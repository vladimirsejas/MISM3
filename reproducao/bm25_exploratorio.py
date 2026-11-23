"""Comparação EXPLORATÓRIA com BM25 Okapi sobre o conjunto congelado v1 (190 mensagens). Análise posterior ao teste, não pré-especificada.

Reaproveita de ablacao.py a normalização (_tokens), as unidades indexadas (web/dados/indice_orientacao.json, campo `texto`) e a regra de
saída da condição 10 (até 6 itens com nota > 0; abstém só se nada casar); de conjunto_v1.py, o gabarito, `calcular`, `anotar_ids`
e `bootstrap_pareado`. Só a função de pontuação muda (TF-IDF -> BM25). Configuração única, definida antes de ver qualquer resultado: k1 = 1,5 e b = 0,75.

Não altera arquivo existente: os dois arquivos de saída são abertos em modo "x" (falha se já existirem). Não executa o sistema completo
nem lê o CSV congelado, exceto para a comparação com os 76/140 do sistema completo, que vem do CSV só para leitura.

Uso (da raiz do repositório):  python reproducao/bm25_exploratorio.py
"""
from __future__ import annotations

import csv
import math
import sys
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import ablacao  # noqa: E402
import comum  # noqa: E402
import conjunto_v1 as cv  # noqa: E402

K1, B = 1.5, 0.75
RES = comum.RAIZ / "reproducao" / "resultados"
SAIDA_CSV, SAIDA_MD = RES / "EXPLORATORIO_BM25.csv", RES / "EXPLORATORIO_BM25.md"
CSV_CONGELADO = RES / "PREVISOES_TESTE_CONGELADO.csv"


class BM25:
    """BM25 Okapi: idf = ln((N - df + 0,5)/(df + 0,5) + 1) (nunca negativo); termos repetidos na consulta contam repetidos."""

    def __init__(self, unidades: list[dict], k1: float = K1, b: float = B):
        self.unidades, self.k1, self.b = unidades, k1, b
        self.docs = [Counter(ablacao._tokens(u.get("texto", ""))) for u in unidades]
        self.tam = [sum(d.values()) for d in self.docs]
        self.n = len(self.docs)
        self.avgdl = sum(self.tam) / self.n
        df: Counter = Counter()
        for d in self.docs:
            df.update(d.keys())
        self.idf = {w: math.log((self.n - c + 0.5) / (c + 0.5) + 1) for w, c in df.items()}

    def responder(self, texto: str) -> dict:
        q = [w for w in ablacao._tokens(texto) if w in self.idf]
        if not q:
            return {"abstem": True, "perigo": False, "nivel": 0, "tipos": [], "itens": []}
        pontos = []
        for i, d in enumerate(self.docs):
            s = 0.0
            for w in q:
                f = d.get(w, 0)
                if f:
                    s += self.idf[w] * f * (self.k1 + 1) / (f + self.k1 * (1 - self.b + self.b * self.tam[i] / self.avgdl))
            pontos.append((s, i))
        pontos.sort(key=lambda x: -x[0])
        top = [(s, i) for s, i in pontos[:6] if s > 0]
        itens = [{"area": self.unidades[i].get("area"), "sec": self.unidades[i].get("sec"), "svc": self.unidades[i].get("svc"),
                  "titulo": self.unidades[i].get("titulo")} for _, i in top]
        return {"abstem": not itens, "perigo": False, "nivel": 0, "tipos": [], "itens": itens}


def rodar_bm25(perguntas: list[dict]) -> dict[str, dict]:
    indice = cv.json.loads((comum.RAIZ / "web" / "dados" / "indice_orientacao.json").read_text(encoding="utf-8"))
    motor = BM25(indice["unidades"])
    return {q["id"]: {"id": q["id"], **motor.responder(q["texto"])} for q in perguntas}


def completo_do_csv(ids: list[str]) -> list[float]:
    """Vetor 0/1 do sistema completo (acerto específico no top-3), lido do CSV congelado (somente leitura)."""
    linhas = {r["id_mensagem"]: r for r in csv.DictReader(CSV_CONGELADO.open(encoding="utf-8-sig"), delimiter=";") if r["condicao_codigo"] == "completo"}
    ind = cv.Indice()
    qs = {q["id"]: q for q in (cv.converter_item(i, ind) for i in cv.carregar_conjunto())}
    saida = []
    for i in ids:
        r, q = linhas[i], qs[i]
        itens = [{"id": r[f"item_{k}"], "svc": (ind.unidades.get(r[f"item_{k}"]) or {}).get("svc")} for k in (1, 2, 3) if r[f"item_{k}"]]
        saida.append(float(any(cv.casa_v1(it, t) for it in itens for t in q["especificos"])))
    return saida


def main() -> int:
    if SAIDA_CSV.exists() or SAIDA_MD.exists():
        print("saídas já existem; não sobrescreve.")
        return 2
    if cv.sha256_do_conjunto() != cv.SHA256_ESPERADO:
        print("SHA-256 do conjunto diferente do esperado.")
        return 2
    ind = cv.Indice()
    qs = [cv.converter_item(i, ind) for i in cv.carregar_conjunto()]
    tf = cv.anotar_ids(ablacao.rodar_tfidf(qs), ind)
    mt = cv.calcular(qs, tf, cv.casa_v1, perigo_inclui_fora=True)
    print("TF-IDF reproduzido:", mt["spec_hit"], "/", mt["spec_total"])
    if (mt["spec_hit"], mt["spec_total"]) != (35, 140):
        print("PARE: o TF-IDF não reproduz 35/140; nada foi gravado.")
        return 1
    bm = cv.anotar_ids(rodar_bm25(qs), ind)
    mb = cv.calcular(qs, bm, cv.casa_v1, perigo_inclui_fora=True)
    ids = mb["ids_spec"]
    assert ids == mt["ids_spec"]
    comp = completo_do_csv(ids)
    assert int(sum(comp)) == 76, int(sum(comp))
    risco = {q["id"] for q in qs if q["perigo"]}
    vb, vt = [float(x) for x in mb["spec_vec"]], [float(x) for x in mt["spec_vec"]]
    grupos = {"total": ids, "risco": [i for i in ids if i in risco], "sem_risco": [i for i in ids if i not in risco]}
    pos = {i: k for k, i in enumerate(ids)}
    linhas = []
    for nome, g in grupos.items():
        ks = [pos[i] for i in g]
        for cond, v in (("bm25", vb), ("tfidf", vt), ("completo", comp)):
            linhas.append([nome, cond, int(sum(v[k] for k in ks)), len(ks)])
    boot = cv.bootstrap_pareado({"bm25": vb, "tfidf": vt, "completo": comp}, "bm25")
    d_tf = boot["tfidf"]["dif_ic"], boot["tfidf"]["dif_vs_ref"]
    d_co = boot["completo"]["dif_ic"], boot["completo"]["dif_vs_ref"]
    # bootstrap_pareado devolve (cond - ref) com ref = bm25; as diferenças pedidas são bm25 - cond: troca de sinal e dos limites
    dif = {}
    for cond in ("tfidf", "completo"):
        lo, hi = boot[cond]["dif_ic"]
        dif[cond] = (-boot[cond]["dif_vs_ref"] * 100, -hi * 100, -lo * 100)
    ab = {"bm25": sum(1 for q in qs if q["acao"] == "Responder" and not bm[q["id"]]["itens"]),
          "tfidf": sum(1 for q in qs if q["acao"] == "Responder" and not tf[q["id"]]["itens"])}
    with SAIDA_CSV.open("x", encoding="utf-8", newline="") as f:
        w = csv.writer(f, lineterminator="\n")
        w.writerow(["grupo", "condicao", "acertos_top3", "total", "percentual"])
        for g, c, k, n in linhas:
            w.writerow([g, c, k, n, round(100 * k / n, 1)])
        w.writerow([])
        w.writerow(["diferenca", "estimativa_pp", "ic95_inferior_pp", "ic95_superior_pp"])
        w.writerow(["bm25_menos_tfidf"] + [round(x, 2) for x in dif["tfidf"]])
        w.writerow(["bm25_menos_completo"] + [round(x, 2) for x in dif["completo"]])
    g = {(a, b): (k, n) for a, b, k, n in linhas}
    md = ["# Comparação exploratória com BM25 (conjunto congelado v1)", "",
          "**Aviso:** análise exploratória, posterior ao teste congelado e não pré-especificada. Não substitui nem altera o resultado principal.", "",
          "## Configuração (definida antes de ver qualquer resultado)", "",
          f"- BM25 Okapi, k1 = {K1} e b = {B}; única configuração, nada ajustado no teste.",
          "- idf = ln((N − df + 0,5)/(df + 0,5) + 1); termos repetidos na consulta contam repetidos; implementação própria em `reproducao/bm25_exploratorio.py` (sem dependências).",
          "- Mesma normalização (`ablacao._tokens`), mesmas unidades (`web/dados/indice_orientacao.json`, campo `texto`), mesma saída (até 6 itens com nota > 0; abstém só se nada casar) e mesmo gabarito/critério de acerto (`conjunto_v1.calcular`, `casa_v1`) da condição 10 (TF-IDF).",
          f"- Bootstrap pareado por mensagem, {cv.BOOTSTRAP_V1} reamostragens, semente {cv.SEMENTE_V1}, `conjunto_v1.bootstrap_pareado`, percentis 2,5% e 97,5%.",
          "- Verificação: o TF-IDF reproduzido nesta execução deu 35/140.",
          "- O vetor do sistema completo (76/140) foi lido de `reproducao/resultados/PREVISOES_TESTE_CONGELADO.csv`, somente leitura.", "",
          "## Resposta@3 específica (denominador: mensagens orientáveis com destino esperado)", "",
          "| Grupo | BM25 | TF-IDF | Sistema completo |", "|---|---|---|---|"]
    for nome in ("total", "risco", "sem_risco"):
        cel = lambda c: f"{g[(nome, c)][0]}/{g[(nome, c)][1]} ({100 * g[(nome, c)][0] / g[(nome, c)][1]:.1f}%)"
        md.append(f"| {nome.replace('_', ' ')} | {cel('bm25')} | {cel('tfidf')} | {cel('completo')} |")
    md += ["", "## Diferenças pareadas (pontos percentuais, IC 95% bootstrap), nas 140 mensagens", "",
           "| Diferença | Estimativa | IC 95% |", "|---|---|---|",
           f"| BM25 − TF-IDF | {dif['tfidf'][0]:+.2f} | [{dif['tfidf'][1]:.2f}; {dif['tfidf'][2]:.2f}] |",
           f"| BM25 − sistema completo | {dif['completo'][0]:+.2f} | [{dif['completo'][1]:.2f}; {dif['completo'][2]:.2f}] |", "",
           f"Abstenções em mensagens orientáveis: BM25 {ab['bm25']}/140; TF-IDF {ab['tfidf']}/140.", ""]
    with SAIDA_MD.open("x", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(md) + "\n")
    print("\n".join(md))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
