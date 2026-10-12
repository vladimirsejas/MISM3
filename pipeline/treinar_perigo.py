"""Treina o DETECTOR DE PERIGO (aprendizado de máquina) e o exporta para o navegador.

  python pipeline/treinar_perigo.py

Entradas: catalogo/frases_perigo.txt (frases de perigo e negativos difíceis) e catalogo/frases_necessidades.txt
          (as frases de necessidades servem de negativos, exceto as de violência, que entram como positivas).
Saída:    web/dados/modelo_perigo.json (mesmo formato do modelo de necessidades; lido por web/perigo.js via web/ia.js)

Por que existe: as regras de web/perigo.js são listas de palavras e não generalizam (numa avaliação com frases novas elas acertaram
34%). O detector aprendido pega o que as regras não pegam. Ele trabalha JUNTO com as regras: o alerta aparece se qualquer um dos dois
disparar. Errar para mais custa uma mensagem a mais; errar para menos pode custar muito mais, por isso os limiares são escolhidos
pela validação cruzada priorizando revocação, com um teto de falsos alarmes nos exemplos negativos.

Modelo: regressão logística (uma por tipo: violencia, suicidio, crianca, saude) sobre n-gramas de caracteres (3 a 5) e palavras,
ponderados por TF-IDF, com variações de escrita (sem acento, letra esquecida) só no treino. Não usa serviço externo.
"""
from __future__ import annotations

import json
import random
import sys
from pathlib import Path

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import StratifiedKFold

sys.path.insert(0, str(Path(__file__).resolve().parent))
from treinar_necessidades import aumentar, atributos, normalizar  # noqa: E402

RAIZ = Path(__file__).resolve().parents[1]
PERIGO = RAIZ / "catalogo" / "frases_perigo.txt"
NECESSIDADES = RAIZ / "catalogo" / "frases_necessidades.txt"
SAIDA = RAIZ / "web" / "dados" / "modelo_perigo.json"
TIPOS = ["violencia", "suicidio", "crianca", "saude"]
SEMENTE = 20261013
FALSOS_ALARMES_MAX = 0.02  # teto de falsos alarmes (CV) nos exemplos negativos, por tipo (limiar de aviso discreto, nível 1)
FALSOS_ALARMES_ALTO = 0.003  # teto para o limiar de ALTA confiança (alerta completo, nível 2)


def ler() -> list[tuple[str, str]]:
    itens, vistas = [], set()
    for n, linha in enumerate(PERIGO.read_text(encoding="utf-8").splitlines(), 1):
        linha = linha.strip()
        if not linha or linha.startswith("#"):
            continue
        rot, _, frase = linha.partition("|")
        rot, frase = rot.strip(), frase.strip()
        if rot not in TIPOS + ["nenhuma"] or not frase:
            raise SystemExit(f"linha {n} inválida: {linha!r}")
        if normalizar(frase) in vistas:
            raise SystemExit(f"linha {n}: frase repetida: {frase!r}")
        vistas.add(normalizar(frase))
        itens.append((rot, frase))
    # frases de necessidades: violência = positivo; o resto = negativo (não são emergências)
    for linha in NECESSIDADES.read_text(encoding="utf-8").splitlines():
        linha = linha.strip()
        if not linha or linha.startswith("#"):
            continue
        rot, _, frase = linha.partition("|")
        rots, frase = [r.strip() for r in rot.split(",")], frase.strip()
        if not frase or normalizar(frase) in vistas:
            continue
        vistas.add(normalizar(frase))
        itens.append(("violencia" if "violencia" in rots else "nenhuma", frase))
    return itens


def treinar(frases: list[str], rotulos: list[str], aumentar_dados: bool = True):
    rng = random.Random(SEMENTE)
    X, Y = [], []
    for f, r in zip(frases, rotulos):
        X.append(f); Y.append(r)
        if aumentar_dados:
            for v in aumentar(f, rng):
                X.append(v); Y.append(r)
    vet = TfidfVectorizer(analyzer=atributos, sublinear_tf=True, min_df=2, norm="l2")
    M = vet.fit_transform(X)
    clfs = {}
    for t in TIPOS:
        y = np.array([1 if r == t else 0 for r in Y])
        clfs[t] = LogisticRegression(C=12.0, class_weight="balanced", solver="liblinear", max_iter=2000).fit(M, y)
    return vet, clfs


def prob(vet, clfs, frases):
    M = vet.transform(frases)
    return {t: clfs[t].predict_proba(M)[:, 1] for t in TIPOS}


def escolher_limiares(itens) -> tuple[dict, dict, dict]:
    frases = [f for _, f in itens]; rot = np.array([r for r, _ in itens])
    oof = {t: np.zeros(len(itens)) for t in TIPOS}
    for tr, te in StratifiedKFold(5, shuffle=True, random_state=SEMENTE).split(frases, rot):
        vet, clfs = treinar([frases[i] for i in tr], list(rot[tr]))
        p = prob(vet, clfs, [frases[i] for i in te])
        for t in TIPOS:
            oof[t][te] = p[t]
    lim, rel, altos = {}, {}, {}
    for t in TIPOS:
        pos, neg = rot == t, rot == "nenhuma"
        # menor limiar que mantém os falsos alarmes (contra negativos e contra OUTROS tipos de perigo não conta) dentro do teto
        melhor = 0.99
        for L in np.arange(0.05, 1.0, 0.01):
            if (oof[t][neg] >= L).mean() <= FALSOS_ALARMES_MAX:
                melhor = round(float(L), 2); break
        alto = 0.99
        for L in np.arange(melhor, 1.0, 0.01):
            if (oof[t][neg] >= L).mean() <= FALSOS_ALARMES_ALTO:
                alto = round(float(L), 2); break
        lim[t] = melhor
        altos[t] = alto
        rel[t] = {"limiar": melhor, "limiar_alto": alto, "revocacao_alto_cv": float((oof[t][pos] >= alto).mean()), "revocacao_cv": float((oof[t][pos] >= melhor).mean()), "falsos_alarmes_cv": float((oof[t][neg] >= melhor).mean()),
                  "positivos": int(pos.sum()), "negativos": int(neg.sum())}
    return lim, rel, altos


def exportar(itens, lim, rel, altos) -> None:
    frases = [f for _, f in itens]; rotulos = [r for r, _ in itens]
    vet, clfs = treinar(frases, rotulos)
    vocab = vet.get_feature_names_out().tolist()
    coef = [[round(float(w), 4) for w in clfs[t].coef_[0]] for t in TIPOS]
    exemplos = ["meu marido me bate", "preciso de vaga na creche", "nao aguento mais viver", "meu filho engasgou e esta roxo"]
    vt = [{"texto": e, **{t: round(float(p[0]), 4) for t, p in prob(vet, clfs, [e]).items()}} for e in exemplos]
    m = {"meta": {"descricao": "Detector de perigo (violencia, suicidio, crianca, saude). Regressao logistica sobre n-gramas de caracteres e palavras; lido por web/perigo.js.",
                  "limiares": lim, "limiares_altos": altos, "limiar_padrao": 0.5, "relatorio_validacao_cruzada": rel, "n_frases": len(itens), "semente": SEMENTE},
         "classes": TIPOS, "vocabulario": vocab, "idf": [round(float(x), 4) for x in vet.idf_], "coef": coef,
         "intercepto": [round(float(clfs[t].intercept_[0]), 4) for t in TIPOS], "vetores_de_teste": vt}
    SAIDA.write_text(json.dumps(m, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")


def main() -> None:
    itens = ler()
    lim, rel, altos = escolher_limiares(itens)
    exportar(itens, lim, rel, altos)
    for t in TIPOS:
        r = rel[t]
        print(f"{t:10s} aviso>={r['limiar']:.2f} (revocação CV {r['revocacao_cv']:.0%}, falsos alarmes {r['falsos_alarmes_cv']:.1%}) | alerta>={r['limiar_alto']:.2f} (revocação CV {r['revocacao_alto_cv']:.0%}) | {r['positivos']} positivos, {r['negativos']} negativos")
    print(f"gravado: {SAIDA} ({SAIDA.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
