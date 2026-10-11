"""Treina o modelo de necessidades (aprendizado de máquina) e o exporta para o navegador.

  python pipeline/treinar_necessidades.py

Entrada:  catalogo/frases_necessidades.txt  (frases escritas pela equipe, com rótulos)
Saídas:   web/dados/modelo_necessidades.json   (pesos do modelo, lido por web/ia.js; roda no aparelho da usuária)
          docs/ia/avaliacao_modelo_necessidades.md  (métricas honestas, geradas a cada treino)

Modelo: regressão logística (um classificador por necessidade, multirrótulo) sobre n-gramas de caracteres (3 a 5) e palavras,
ponderados por TF-IDF. Foi escolhido por ser pequeno (roda no navegador), explicável (cada peso é legível) e robusto a erros de
digitação. Não usa serviço externo nem envia texto a ninguém.

Avaliação: as frases de base são divididas em treino e teste (o modelo nunca vê o teste); as 53 frases dos testes antigos do
projeto, escritas antes do modelo existir, servem de segundo teste independente. As mesmas frases são avaliadas com as regras
de palavras-chave (web/necessidades.js) para comparação. O modelo exportado é treinado com TODAS as frases, depois da avaliação.
"""
from __future__ import annotations

import json
import math
import random
import re
import subprocess
import sys
import unicodedata
from datetime import date
from pathlib import Path

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.multiclass import OneVsRestClassifier

RAIZ = Path(__file__).resolve().parents[1]
FRASES = RAIZ / "catalogo" / "frases_necessidades.txt"
TESTES_ANTIGOS = RAIZ / "web" / "tests" / "necessidades.test.js"
SAIDA_MODELO = RAIZ / "web" / "dados" / "modelo_necessidades.json"
SAIDA_DOC = RAIZ / "docs" / "ia" / "avaliacao_modelo_necessidades.md"
CLASSES = ["violencia", "casamento", "filhos", "emprego_curso", "saude", "estudo", "moradia", "dividas", "familia"]
LIMIAR_PADRAO = 0.50
LIMIARES = {"violencia": 0.25}  # em violência, errar por falta de alerta custa mais: aceita-se mais alarmes falsos
SEMENTE = 20261011
N_MIN, N_MAX = 3, 5


def normalizar(texto: str) -> str:
    """Igual à função normalizar() de web/necessidades.js (a mesma entrada precisa dar a mesma saída nos dois lados)."""
    t = unicodedata.normalize("NFD", str(texto or ""))
    t = "".join(c for c in t if unicodedata.category(c) != "Mn").lower().replace("-", "")
    t = re.sub(r"[^a-z0-9\s]", " ", t)
    return re.sub(r"\s+", " ", t).strip()


def atributos(texto: str) -> list[str]:
    """n-gramas de caracteres por palavra (com espaços nas bordas) e a própria palavra. Igual a atributos() em web/ia.js."""
    saida: list[str] = []
    for w in normalizar(texto).split(" "):
        if not w:
            continue
        p = " " + w + " "
        for n in range(N_MIN, N_MAX + 1):
            for i in range(0, len(p) - n + 1):
                saida.append(p[i:i + n])
        saida.append("w:" + w)
    return saida


def ler_frases() -> list[tuple[frozenset, str, bool]]:
    """Devolve (rótulos, frase, é_combinada). Falha se houver rótulo desconhecido ou frase repetida."""
    itens, vistas = [], set()
    for n, linha in enumerate(FRASES.read_text(encoding="utf-8").splitlines(), 1):
        linha = linha.strip()
        if not linha or linha.startswith("#"):
            continue
        rot, _, frase = linha.partition("|")
        rotulos = [r.strip() for r in rot.split(",") if r.strip()]
        frase = frase.strip()
        if not rotulos or not frase:
            raise SystemExit("linha %d inválida: %r" % (n, linha))
        for r in rotulos:
            if r not in CLASSES and r != "nenhuma":
                raise SystemExit("linha %d: rótulo desconhecido %r" % (n, r))
        if "nenhuma" in rotulos and len(rotulos) > 1:
            raise SystemExit("linha %d: 'nenhuma' não combina com outro rótulo" % n)
        chave = normalizar(frase)
        if chave in vistas:
            raise SystemExit("linha %d: frase repetida: %r" % (n, frase))
        vistas.add(chave)
        itens.append((frozenset(r for r in rotulos if r != "nenhuma"), frase, len(rotulos) > 1))
    return itens


def testes_antigos() -> list[tuple[frozenset, str]]:
    """As frases dos testes do classificador de regras, escritas antes do modelo existir."""
    txt = TESTES_ANTIGOS.read_text(encoding="utf-8")
    achados = re.findall(r'\[\s*"([^"]+)"\s*,\s*\[([^\]]*)\]\s*\]', txt)
    saida = []
    for frase, rots in achados:
        rotulos = frozenset(re.findall(r'"([a-z_]+)"', rots))
        if all(r in CLASSES for r in rotulos):
            saida.append((rotulos, frase))
    return saida


def aumentar(frase: str, rng: random.Random) -> list[str]:
    """Variações de escrita comuns (sem acento, letra esquecida), só para o treino."""
    sem_acento = "".join(c for c in unicodedata.normalize("NFD", frase) if unicodedata.category(c) != "Mn")
    palavras = frase.split()
    longas = [i for i, w in enumerate(palavras) if len(w) > 4]
    variantes = [sem_acento]
    if longas:
        i = rng.choice(longas)
        w = palavras[i]
        j = rng.randrange(1, len(w) - 1)
        variantes.append(" ".join(palavras[:i] + [w[:j] + w[j + 1:]] + palavras[i + 1:]))
    return variantes


def matriz(rotulos_lista: list[frozenset]) -> np.ndarray:
    return np.array([[1 if c in r else 0 for c in CLASSES] for r in rotulos_lista])


def treinar(frases: list[str], rotulos: list[frozenset]):
    vet = TfidfVectorizer(analyzer=atributos, sublinear_tf=True, min_df=2, norm="l2")
    X = vet.fit_transform(frases)
    clf = OneVsRestClassifier(LogisticRegression(C=12.0, class_weight="balanced", solver="liblinear", max_iter=1000))
    clf.fit(X, matriz(rotulos))
    return vet, clf


def probabilidades(vet, clf, frases: list[str]) -> np.ndarray:
    return clf.predict_proba(vet.transform(frases))


def decidir(probs: np.ndarray) -> list[frozenset]:
    saida = []
    for linha in probs:
        escolhidas = [(p, c) for p, c in zip(linha, CLASSES) if p >= LIMIARES.get(c, LIMIAR_PADRAO)]
        escolhidas.sort(reverse=True)
        saida.append(frozenset(c for _, c in escolhidas[:3]))  # no máximo 3, como as regras
    return saida


def regras_js(frases: list[str]) -> list[frozenset]:
    """Roda o classificador de regras atual (JavaScript) nas mesmas frases, para comparar."""
    codigo = ("const N=require(process.argv[1]);const f=JSON.parse(require('fs').readFileSync(0,'utf8'));"
              "process.stdout.write(JSON.stringify(f.map(t=>N.identificarCategorias(t))))")
    r = subprocess.run(["node", "-e", codigo, str(RAIZ / "web" / "necessidades.js")], input=json.dumps(frases),
                       capture_output=True, text=True, check=True)
    return [frozenset(x) for x in json.loads(r.stdout)]


def metricas(verdade: list[frozenset], previsto: list[frozenset]) -> dict:
    por = {}
    tp_t = fp_t = fn_t = 0
    for c in CLASSES:
        tp = sum(1 for v, p in zip(verdade, previsto) if c in v and c in p)
        fp = sum(1 for v, p in zip(verdade, previsto) if c not in v and c in p)
        fn = sum(1 for v, p in zip(verdade, previsto) if c in v and c not in p)
        prec = tp / (tp + fp) if tp + fp else None
        rec = tp / (tp + fn) if tp + fn else None
        f1 = 2 * prec * rec / (prec + rec) if prec and rec else 0.0 if (tp + fp and tp + fn) else None
        por[c] = dict(precisao=prec, recall=rec, f1=f1, suporte=tp + fn)
        tp_t, fp_t, fn_t = tp_t + tp, fp_t + fp, fn_t + fn
    prec = tp_t / (tp_t + fp_t) if tp_t + fp_t else 0.0
    rec = tp_t / (tp_t + fn_t) if tp_t + fn_t else 0.0
    return dict(por_classe=por, precisao=prec, recall=rec,
                f1=2 * prec * rec / (prec + rec) if prec + rec else 0.0,
                exato=sum(1 for v, p in zip(verdade, previsto) if v == p) / len(verdade), n=len(verdade))


def pct(x) -> str:
    return "—" if x is None else "%.0f%%" % (100 * x)


def tabela(titulo: str, m_modelo: dict, m_regras: dict) -> str:
    linhas = ["### " + titulo, "", "%d frases. Visão geral (micro): modelo precisão %s, recall %s, F1 %s, acerto exato %s; regras precisão %s, recall %s, F1 %s, acerto exato %s."
              % (m_modelo["n"], pct(m_modelo["precisao"]), pct(m_modelo["recall"]), pct(m_modelo["f1"]), pct(m_modelo["exato"]),
                 pct(m_regras["precisao"]), pct(m_regras["recall"]), pct(m_regras["f1"]), pct(m_regras["exato"])), "",
              "| Necessidade | Frases | Modelo: precisão | Modelo: recall | Regras: precisão | Regras: recall |", "|---|---|---|---|---|---|"]
    for c in CLASSES:
        a, b = m_modelo["por_classe"][c], m_regras["por_classe"][c]
        linhas.append("| %s | %d | %s | %s | %s | %s |" % (c, a["suporte"], pct(a["precisao"]), pct(a["recall"]), pct(b["precisao"]), pct(b["recall"])))
    return "\n".join(linhas) + "\n"


def main() -> int:
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
    rng = random.Random(SEMENTE)
    itens = ler_frases()
    antigos = testes_antigos()

    # ---- validação cruzada (5 partes): cada frase é prevista por um modelo que NUNCA a viu. Mais estável que uma só divisão.
    ordem = list(range(len(itens)))
    rng.shuffle(ordem)
    # estratifica pelo rótulo principal para cada parte ter de tudo
    ordem.sort(key=lambda i: (sorted(itens[i][0])[0] if itens[i][0] else "~", rng.random()))
    partes = [ordem[k::5] for k in range(5)]
    prev_modelo = [None] * len(itens)
    for k in range(5):
        teste_idx = set(partes[k])
        x_tr, y_tr = [], []
        for i, (rotulos, frase, _) in enumerate(itens):
            if i in teste_idx:
                continue
            x_tr.append(frase); y_tr.append(rotulos)
            for v in aumentar(frase, rng):
                x_tr.append(v); y_tr.append(rotulos)
        vet_k, clf_k = treinar(x_tr, y_tr)
        frases_k = [itens[i][1] for i in partes[k]]
        for i, pr in zip(partes[k], decidir(probabilidades(vet_k, clf_k, frases_k))):
            prev_modelo[i] = pr
    frases_todas = [i[1] for i in itens]
    verdade = [i[0] for i in itens]
    prev_regras = regras_js(frases_todas)
    prev_junto = [a | b for a, b in zip(prev_modelo, prev_regras)]

    # ---- teste independente: o modelo treinado com todas as frases contra as 53 frases dos testes antigos
    x_all, y_all = [], []
    for rotulos, frase, _ in itens:
        x_all.append(frase); y_all.append(rotulos)
        for v in aumentar(frase, rng):
            x_all.append(v); y_all.append(rotulos)
    vet, clf = treinar(x_all, y_all)
    f_ant = [f for _, f in antigos]
    v_ant = [r for r, _ in antigos]
    p_mod_ant = decidir(probabilidades(vet, clf, f_ant))
    p_reg_ant = regras_js(f_ant)

    relatorio = ["# Avaliação do modelo de necessidades", "",
                 "Gerado por `pipeline/treinar_necessidades.py` em %s. **Leia com as limitações abaixo.**" % date.today().isoformat(), "",
                 "## Limitações (importantes)", "",
                 "- As frases de treino e de teste foram **escritas pela equipe**, não vêm de mulheres reais. O desempenho com pessoas de verdade pode ser **menor**.",
                 "- O conjunto é **pequeno** (%d frases). Os números têm margem de erro grande e servem para comparar o modelo com as regras, não para prometer desempenho." % len(itens),
                 "- As **regras** de palavras-chave foram escritas pela mesma equipe, olhando para frases parecidas; isso as favorece nesta comparação.",
                 "- O modelo **não decide direitos nem diagnostica**: só sugere áreas do site. Em violência, o sistema soma regras e modelo para não deixar de alertar.", "",
                 "## Como foi avaliado", "",
                 "- **Validação cruzada em 5 partes (%d frases):** cada frase é prevista por um modelo que nunca a viu (o treino inclui variações sem acento e com letra esquecida)." % len(itens),
                 "- **Teste independente (%d frases):** frases dos testes antigos do projeto, escritas antes de o modelo existir. Elas foram escritas para as regras, então as favorecem." % len(antigos),
                 "- **Regras + modelo:** é o que o site usa (a união dos dois, no máximo 3 sugestões). O modelo exportado é treinado com todas as frases.", ""]
    mm, mr, mj = metricas(verdade, prev_modelo), metricas(verdade, prev_regras), metricas(verdade, prev_junto)
    relatorio.append("### Validação cruzada\n")
    relatorio.append("%d frases. Micro-média, **precisão / recall / F1 / acerto exato**:\n" % mm["n"])
    relatorio.append("| Sistema | Precisão | Recall | F1 | Acerto exato |\n|---|---|---|---|---|")
    for nome, m in (("Regras de palavras-chave", mr), ("Modelo de aprendizado de máquina", mm), ("Regras + modelo (usado no site)", mj)):
        relatorio.append("| %s | %s | %s | %s | %s |" % (nome, pct(m["precisao"]), pct(m["recall"]), pct(m["f1"]), pct(m["exato"])))
    relatorio.append("")
    relatorio.append("| Necessidade | Frases | Regras: recall | Modelo: recall | Regras + modelo: recall | Regras + modelo: precisão |\n|---|---|---|---|---|---|")
    for c in CLASSES:
        relatorio.append("| %s | %d | %s | %s | %s | %s |" % (c, mm["por_classe"][c]["suporte"], pct(mr["por_classe"][c]["recall"]), pct(mm["por_classe"][c]["recall"]),
                                                        pct(mj["por_classe"][c]["recall"]), pct(mj["por_classe"][c]["precisao"])))
    relatorio.append("")
    ma, mra, mja = metricas(v_ant, p_mod_ant), metricas(v_ant, p_reg_ant), metricas(v_ant, [a | b for a, b in zip(p_mod_ant, p_reg_ant)])
    relatorio.append("### Teste independente (%d frases antigas)\n" % ma["n"])
    relatorio.append("| Sistema | Precisão | Recall | F1 | Acerto exato |\n|---|---|---|---|---|")
    for nome, m in (("Regras de palavras-chave", mra), ("Modelo de aprendizado de máquina", ma), ("Regras + modelo", mja)):
        relatorio.append("| %s | %s | %s | %s | %s |" % (nome, pct(m["precisao"]), pct(m["recall"]), pct(m["f1"]), pct(m["exato"])))
    relatorio.append("")
    for nome, m in (("regras", mr), ("modelo", mm), ("regras+modelo", mj)):
        print("CV %-14s precisão %s recall %s F1 %s exato %s | violência recall %s" % (nome, pct(m["precisao"]), pct(m["recall"]), pct(m["f1"]), pct(m["exato"]), pct(m["por_classe"]["violencia"]["recall"])))
    for nome, m in (("regras", mra), ("modelo", ma)):
        print("IND %-14s F1 %s recall %s" % (nome, pct(m["f1"]), pct(m["recall"])))

    # modelo final = o treinado com todas as frases (acima)
    vocab = vet.get_feature_names_out().tolist()
    idf = vet.idf_.tolist()
    coef = np.array([e.coef_[0] for e in clf.estimators_])
    interc = np.array([e.intercept_[0] for e in clf.estimators_])
    exemplos = ["meu marido me bateu e eu tenho medo", "preciso de vaga na creche e de um emprego", "oi bom dia", "estou sem casa e sem comida",
                "quero voltar a estudar mas tenho um bebê", "dor de barriga forte, onde é a UPA", "nome sujo e contas atrasadas", "preciso me separar e ficar com a guarda",
                "quero fazer um curso de costura", "ele me ameaça de morte", "qual a previsão do tempo", "cesta básica urgente"]
    vetores = []
    for t in exemplos:
        p = probabilidades(vet, clf, [t])[0]
        vetores.append(dict(frase=t, prob={c: round(float(v), 6) for c, v in zip(CLASSES, p)}))
    modelo = dict(
        meta=dict(versao=1, treinado_em=date.today().isoformat(), tipo="regressão logística (um contra todos) sobre n-gramas de caracteres e palavras, TF-IDF",
                  exemplos_de_treino=len(itens), origem_das_frases="escritas pela equipe do projeto; nenhuma vem de usuárias",
                  aviso="Sugere áreas do site. Não decide direitos nem faz diagnóstico.", n_min=N_MIN, n_max=N_MAX,
                  limiar_padrao=LIMIAR_PADRAO, limiares=LIMIARES, maximo_sugestoes=3),
        classes=CLASSES, vocabulario=vocab, idf=[round(x, 5) for x in idf],
        coef=[[round(float(x), 4) for x in linha] for linha in coef.T.tolist()] if False else [[round(float(x), 4) for x in linha] for linha in coef.tolist()],
        intercepto=[round(float(x), 4) for x in interc], vetores_de_teste=vetores)
    SAIDA_MODELO.write_text(json.dumps(modelo, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    SAIDA_DOC.parent.mkdir(parents=True, exist_ok=True)
    SAIDA_DOC.write_text("\n".join(relatorio) + "\n", encoding="utf-8")
    print("Modelo: %d atributos, %d classes, %.0f KB em %s" % (len(vocab), len(CLASSES), SAIDA_MODELO.stat().st_size / 1024, SAIDA_MODELO.relative_to(RAIZ)))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
