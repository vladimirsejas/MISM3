"""Treina o CLASSIFICADOR DE AVISO (nível 1) do orientador e o exporta para o navegador.

  python pipeline/treinar_n1.py

Entrada: pipeline/frases_rotuladas_n1.tsv  (nivel<TAB>grupo<TAB>frase; N0 = nenhum alerta, N1 = aviso, N2 = alerta completo)
Saída:   web/dados/modelo_aviso_n1.json    (mesmo formato do detector de perigo; lido por web/perigo.js via web/ia.js)

Para que serve: as regras de web/perigo.js reconhecem o aviso de nível 1 (controle, humilhação, ameaça velada) por listas de palavras e
combinações, e não generalizam para frases escritas de outro jeito. Este classificador aprende com exemplos e pega parte do que as regras
não pegam. Ele só PROMOVE "nenhum alerta" para aviso de nível 1: nunca rebaixa, nunca substitui as regras de nível 2 e nunca age quando
as regras já deram algum resultado. Assim ele não pode piorar a detecção de nível 2 por construção.

Modelo: regressão logística sobre n-gramas de caracteres (3 a 5) e palavras, ponderados por TF-IDF, exatamente as mesmas características
de web/ia.js (por isso o navegador calcula sem código novo). Duas classes: N1 (positivo) contra N0 (negativo). As frases N2 não entram no
treino, porque o nível 2 é decidido pelas regras e pelo detector de perigo.

Variações de escrita (sem acento, letra esquecida, letra repetida, letras trocadas, palavras coladas) são geradas só no treino.

Avaliação: validação cruzada em 5 partes AGRUPADA por família de frases (variantes da mesma frase nunca ficam em treino e em teste ao mesmo
tempo). O limiar de decisão sai das probabilidades fora da dobra, escolhido para manter os falsos alarmes baixos. Todas as frases deste
arquivo são conjunto de DESENVOLVIMENTO: os números da validação cruzada não equivalem a um teste com frases que o modelo nunca viu, e o
acerto nas frases de treino não prova nada. Para retreinar com frases novas, acrescente linhas ao arquivo .tsv e rode o comando acima.
"""
from __future__ import annotations

import json
import random
import sys
from pathlib import Path

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import StratifiedGroupKFold

sys.path.insert(0, str(Path(__file__).resolve().parent))
from treinar_necessidades import aumentar, atributos, normalizar  # noqa: E402

RAIZ = Path(__file__).resolve().parents[1]
ENTRADA = RAIZ / "pipeline" / "frases_rotuladas_n1.tsv"
SAIDA = RAIZ / "web" / "dados" / "modelo_aviso_n1.json"
SEMENTE = 20261122
C_CANDIDATOS = [1.0, 3.0, 12.0]
FALSOS_ALARMES_DIFICEIS_MAX = 0.10  # teto nos negativos "difíceis" (frases de controle de brincadeira, acordo, pedido comum)
FALSOS_ALARMES_TODOS_MAX = 0.03     # teto em todos os negativos
PREFIXOS_DIFICEIS = ("lote_", "perigo_controle_")  # grupos escritos para testar o limite entre aviso e conversa comum


def ler() -> list[tuple[str, str, str]]:
    itens, vistas = [], set()
    for n, linha in enumerate(ENTRADA.read_text(encoding="utf-8").splitlines(), 1):
        if not linha.strip() or linha.startswith("#") or linha.startswith("nivel\t"):
            continue
        partes = linha.split("\t")
        if len(partes) != 3 or partes[0] not in ("N0", "N1", "N2") or not partes[2].strip():
            raise SystemExit(f"linha {n} inválida: {linha!r}")
        nivel, grupo, frase = partes[0], partes[1], partes[2].strip()
        chave = normalizar(frase)
        if chave in vistas:
            continue  # a mesma frase com rótulos de arquivos diferentes: vale a primeira
        vistas.add(chave)
        if nivel != "N2":  # N2 não entra neste classificador
            itens.append((nivel, grupo, frase))
    return itens


def ruido(frase: str, rng: random.Random) -> list[str]:
    """Erros de digitação comuns, só para o treino: letra esquecida, repetida, trocada e palavras coladas."""
    palavras = frase.split()
    saida = []
    longas = [i for i, w in enumerate(palavras) if len(w) > 3]
    if longas:
        i = rng.choice(longas); w = palavras[i]
        j = rng.randrange(1, len(w))
        saida.append(" ".join(palavras[:i] + [w[:j] + w[j] + w[j:]] + palavras[i + 1:]))          # letra repetida
        i = rng.choice(longas); w = palavras[i]
        j = rng.randrange(0, len(w) - 1)
        saida.append(" ".join(palavras[:i] + [w[:j] + w[j + 1] + w[j] + w[j + 2:]] + palavras[i + 1:]))  # letras trocadas
    if len(palavras) > 3:
        k = rng.randrange(0, len(palavras) - 1)
        saida.append(" ".join(palavras[:k] + [palavras[k] + palavras[k + 1]] + palavras[k + 2:]))  # palavras coladas
    return saida


def treinar(frases: list[str], rotulos: list[int], c: float, aumentar_dados: bool = True):
    rng = random.Random(SEMENTE)
    X, Y = [], []
    for f, r in zip(frases, rotulos):
        X.append(f); Y.append(r)
        if aumentar_dados:
            for v in aumentar(f, rng) + ruido(f, rng):
                X.append(v); Y.append(r)
    vet = TfidfVectorizer(analyzer=atributos, sublinear_tf=True, min_df=2, norm="l2")
    M = vet.fit_transform(X)
    clf = LogisticRegression(C=c, class_weight="balanced", solver="liblinear", max_iter=2000, random_state=42).fit(M, np.array(Y))
    return vet, clf


def prob(vet, clf, frases: list[str]) -> np.ndarray:
    return clf.predict_proba(vet.transform(frases))[:, 1]


def fora_da_dobra(frases, y, grupos, c) -> np.ndarray:
    oof = np.zeros(len(frases))
    splitter = StratifiedGroupKFold(n_splits=5, shuffle=True, random_state=SEMENTE)
    for tr, te in splitter.split(frases, y, grupos):
        vet, clf = treinar([frases[i] for i in tr], [int(y[i]) for i in tr], c)
        oof[te] = prob(vet, clf, [frases[i] for i in te])
    return oof


def escolher_limiar(oof, y, dificil) -> tuple[float, dict]:
    pos, neg = y == 1, y == 0
    neg_dificil = neg & dificil
    melhor = 0.99
    for L in np.arange(0.05, 1.0, 0.01):
        if (oof[neg_dificil] >= L).mean() <= FALSOS_ALARMES_DIFICEIS_MAX and (oof[neg] >= L).mean() <= FALSOS_ALARMES_TODOS_MAX:
            melhor = round(float(L), 2)
            break
    rel = {
        "limiar": melhor,
        "sensibilidade_cv": float((oof[pos] >= melhor).mean()),
        "falsos_alarmes_cv_todos": float((oof[neg] >= melhor).mean()),
        "falsos_alarmes_cv_dificeis": float((oof[neg_dificil] >= melhor).mean()),
        "positivos": int(pos.sum()), "negativos": int(neg.sum()), "negativos_dificeis": int(neg_dificil.sum()),
    }
    return melhor, rel


def main() -> None:
    itens = ler()
    frases = [f for _, _, f in itens]
    y = np.array([1 if n == "N1" else 0 for n, _, _ in itens])
    grupos = np.array([g for _, g, _ in itens])
    dificil = np.array([g.startswith(PREFIXOS_DIFICEIS) for g in grupos])
    print(f"frases: {len(itens)} (N1 = {int(y.sum())}, N0 = {int((y == 0).sum())}; negativos difíceis = {int((dificil & (y == 0)).sum())})")

    melhor = None
    for c in C_CANDIDATOS:
        oof = fora_da_dobra(frases, y, grupos, c)
        lim, rel = escolher_limiar(oof, y, dificil)
        print(f"C={c:<5} limiar={lim:.2f} sensibilidade CV={rel['sensibilidade_cv']:.1%} "
              f"falsos alarmes: todos {rel['falsos_alarmes_cv_todos']:.1%}, difíceis {rel['falsos_alarmes_cv_dificeis']:.1%}")
        if melhor is None or rel["sensibilidade_cv"] > melhor[2]["sensibilidade_cv"]:
            melhor = (c, lim, rel)
    c, lim, rel = melhor
    print(f"escolhido: C={c}, limiar={lim:.2f}")

    vet, clf = treinar(frases, [int(v) for v in y], c)
    exemplos = ["meu marido pega meu celular escondido", "preciso de vaga na creche", "ele diz que sou burra e nao sirvo pra nada", "tomei um mate gelado agora"]
    vt = [{"texto": e, "aviso": round(float(prob(vet, clf, [e])[0]), 4)} for e in exemplos]
    modelo = {
        "meta": {
            "descricao": "Classificador de aviso de nível 1 (controle, humilhação, ameaça velada). Regressão logística sobre n-gramas de caracteres e palavras; lido por web/perigo.js. Só promove 'nenhum alerta' para aviso.",
            "limiares": {"aviso": lim}, "limiar_padrao": lim, "C": c, "relatorio_validacao_cruzada": {"aviso": rel},
            "n_frases": len(itens), "semente": SEMENTE,
            "aviso_de_uso": "Números da validação cruzada vêm das frases de desenvolvimento, não de teste independente.",
        },
        "classes": ["aviso"], "vocabulario": vet.get_feature_names_out().tolist(), "idf": [round(float(x), 4) for x in vet.idf_],
        "coef": [[round(float(w), 4) for w in clf.coef_[0]]], "intercepto": [round(float(clf.intercept_[0]), 4)], "vetores_de_teste": vt,
    }
    SAIDA.write_text(json.dumps(modelo, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"gravado: {SAIDA} ({SAIDA.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
