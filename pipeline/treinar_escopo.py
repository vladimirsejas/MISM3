"""Treina o DETECTOR DE ESCOPO (aprendizado de máquina): o texto é sobre o que o site cobre, ou é outro assunto?

  python pipeline/treinar_escopo.py

Entradas (dentro do assunto): catalogo/frases_necessidades.txt, os positivos de catalogo/frases_perigo.txt e perguntas geradas a partir
          dos nomes dos serviços do catálogo (web/dados/catalogo_manual.json).
          (fora do assunto): catalogo/frases_fora_do_escopo.txt e as frases "nenhuma" de catalogo/frases_necessidades.txt.
Saída:    web/dados/modelo_escopo.json (mesmo formato do modelo de necessidades; lido por web/orientar.js via web/ia.js)

Por que existe: só a nota da busca não separa "qual o preço do dólar" de "preciso de vaga na creche" quando as palavras raras do site
aparecem por acaso. O detector aprende o que é conversa fora do assunto e ajuda o orientador a dizer "não encontrei" em vez de
inventar uma resposta. O limiar é escolhido por validação cruzada deixando de fora no máximo ~1,5% das frases do assunto.
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
CAT = RAIZ / "catalogo"
SAIDA = RAIZ / "web" / "dados" / "modelo_escopo.json"
SEMENTE = 20261013
PERDA_MAX = 0.015  # no máximo 1,5% das frases DO assunto podem cair como "fora" (validação cruzada)


def linhas(arq: Path) -> list[tuple[str, str]]:
    saida = []
    for l in arq.read_text(encoding="utf-8").splitlines():
        l = l.strip()
        if l and not l.startswith("#"):
            rot, _, frase = l.partition("|")
            saida.append((rot.strip(), frase.strip()) if "|" in l else ("", l))
    return saida


def corpus() -> tuple[list[str], list[int]]:
    dentro, fora = [], []
    for rot, f in linhas(CAT / "frases_necessidades.txt"):
        (fora if rot == "nenhuma" else dentro).append(f)
    for rot, f in linhas(CAT / "frases_perigo.txt"):
        if rot in ("violencia", "suicidio", "crianca", "saude"):
            dentro.append(f)
    for _, f in linhas(CAT / "frases_fora_do_escopo.txt"):
        fora.append(f)
    for s in json.loads((RAIZ / "web" / "dados" / "catalogo_manual.json").read_text(encoding="utf-8"))["servicos"]:
        n = s["nome"].split("–")[0].split("—")[0].strip()
        dentro += [n, f"onde fica {n}", f"telefone do {n}", f"horario do {n}"][:3]
    vistas, X, Y = set(), [], []
    for f, y in [(f, 1) for f in dentro] + [(f, 0) for f in fora]:
        k = normalizar(f)
        if k and k not in vistas:
            vistas.add(k); X.append(f); Y.append(y)
    return X, Y


def treinar(X, Y):
    rng = random.Random(SEMENTE)
    XA, YA = [], []
    for f, y in zip(X, Y):
        XA.append(f); YA.append(y)
        for v in aumentar(f, rng):
            XA.append(v); YA.append(y)
    vet = TfidfVectorizer(analyzer=atributos, sublinear_tf=True, min_df=2, norm="l2")
    clf = LogisticRegression(C=12.0, class_weight="balanced", solver="liblinear", max_iter=2000).fit(vet.fit_transform(XA), YA)
    return vet, clf


def main() -> None:
    X, Y = corpus(); Y = np.array(Y)
    oof = np.zeros(len(X))
    for tr, te in StratifiedKFold(5, shuffle=True, random_state=SEMENTE).split(X, Y):
        vet, clf = treinar([X[i] for i in tr], list(Y[tr]))
        oof[te] = clf.predict_proba(vet.transform([X[i] for i in te]))[:, 1]
    dentro, fora = Y == 1, Y == 0
    lim = 0.05
    for L in np.arange(0.05, 0.96, 0.01):  # maior limiar que deixa de fora no máximo PERDA_MAX das frases do assunto
        if (oof[dentro] < L).mean() <= PERDA_MAX:
            lim = round(float(L), 2)
    rel = {"limiar_no_escopo": lim, "fora_detectadas_cv": float((oof[fora] < lim).mean()), "dentro_perdidas_cv": float((oof[dentro] < lim).mean()),
           "dentro": int(dentro.sum()), "fora": int(fora.sum())}
    vet, clf = treinar(X, list(Y))
    exemplos = ["preciso de vaga na creche", "como investir em bitcoin", "meu marido me bate", "qual a previsao do tempo"]
    vt = [{"texto": e, "no_escopo": round(float(clf.predict_proba(vet.transform([e]))[0, 1]), 4)} for e in exemplos]
    m = {"meta": {"descricao": "Detector de escopo: o texto é sobre o que o site cobre? Regressao logistica sobre n-gramas; lido por web/orientar.js.",
                  "limiares": {"no_escopo": lim}, "limiar_padrao": 0.5, "relatorio_validacao_cruzada": rel, "n_frases": len(X), "semente": SEMENTE},
         "classes": ["no_escopo"], "vocabulario": vet.get_feature_names_out().tolist(), "idf": [round(float(x), 4) for x in vet.idf_],
         "coef": [[round(float(w), 4) for w in clf.coef_[0]]], "intercepto": [round(float(clf.intercept_[0]), 4)], "vetores_de_teste": vt}
    SAIDA.write_text(json.dumps(m, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"limiar de escopo {lim:.2f}: fora detectadas (CV) {rel['fora_detectadas_cv']:.0%} de {rel['fora']}; frases do assunto perdidas (CV) {rel['dentro_perdidas_cv']:.1%} de {rel['dentro']}")
    print(f"gravado: {SAIDA} ({SAIDA.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
