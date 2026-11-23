"""Análises EXPLORATÓRIAS adicionais (posteriores ao teste congelado, não pré-especificadas).

Análise 1 (versão completa): SA@3 da busca do sistema completo sem a fixação de serviços, variantes (i) busca pura e (ii) pipeline com fixação
desligada (definições em busca_sem_fixacao_exploratorio.py), com bootstrap pareado contra TF-IDF, BM25 e sistema completo nas 140 e nas 50 sem risco.
Análise 2: sensibilidade do BM25 (k1 em {0,9; 1,2; 1,5; 2,0} x b em {0,5; 0,75; 1,0}), SA@3 nas 140; sem escolher melhor e sem IC por combinação.

Código congelado reexecutado em memória (git show 4bf1676); nada em web/ é tocado. Saídas novas em modo "x":
reproducao/resultados/EXPLORATORIO_BUSCA_SEM_FIXACAO_COMPLETO.{csv,md} e EXPLORATORIO_BM25_SENSIBILIDADE.{csv,md}.
"""
from __future__ import annotations

import csv
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import ablacao  # noqa: E402
import bm25_exploratorio as bx  # noqa: E402
import busca_sem_fixacao_exploratorio as bs  # noqa: E402
import comum  # noqa: E402
import conjunto_v1 as cv  # noqa: E402

RES = comum.RAIZ / "reproducao" / "resultados"
S1C, S1M = RES / "EXPLORATORIO_BUSCA_SEM_FIXACAO_COMPLETO.csv", RES / "EXPLORATORIO_BUSCA_SEM_FIXACAO_COMPLETO.md"
S2C, S2M = RES / "EXPLORATORIO_BM25_SENSIBILIDADE.csv", RES / "EXPLORATORIO_BM25_SENSIBILIDADE.md"
K1S, BS = (0.9, 1.2, 1.5, 2.0), (0.5, 0.75, 1.0)
AVISO = "**Aviso:** análise exploratória, posterior ao teste congelado e não pré-especificada. Não substitui nem altera o resultado principal."


def main() -> int:
    if any(p.exists() for p in (S1C, S1M, S2C, S2M)):
        print("saídas já existem; não sobrescreve.")
        return 2
    if cv.sha256_do_conjunto() != cv.SHA256_ESPERADO:
        print("SHA-256 do conjunto diferente do esperado.")
        return 2
    ind = cv.Indice()
    qs = [cv.converter_item(i, ind) for i in cv.carregar_conjunto()]
    bruto = bs.reexecutar(qs)
    linhas = {r["id_mensagem"]: r for r in csv.DictReader(bx.CSV_CONGELADO.open(encoding="utf-8-sig"), delimiter=";") if r["condicao_codigo"] == "completo"}
    div = sum(1 for q in qs if [i["id"] for i in bruto["completo"][q["id"]]["itens"][:3]] != [linhas[q["id"]][f"item_{k}"] for k in (1, 2, 3) if linhas[q["id"]][f"item_{k}"]]
              or ("sim" if (bruto["completo"][q["id"]]["abstem"] or not bruto["completo"][q["id"]]["itens"]) else "não") != linhas[q["id"]]["abstencao"])
    comp = cv.calcular(qs, bruto["completo"], cv.casa_v1, perigo_inclui_fora=True)
    tf = cv.calcular(qs, cv.anotar_ids(ablacao.rodar_tfidf(qs), ind), cv.casa_v1, perigo_inclui_fora=True)
    print(f"completo reexecutado: {comp['spec_hit']}/{comp['spec_total']} (divergências contra o CSV: {div}); TF-IDF: {tf['spec_hit']}/{tf['spec_total']}")
    if (comp["spec_hit"], comp["spec_total"], tf["spec_hit"], tf["spec_total"], div) != (76, 140, 35, 140, 0):
        print("PARE: verificação falhou; nada foi gravado.")
        return 1
    ids = tf["ids_spec"]
    risco = {q["id"] for q in qs if q["perigo"]}
    pos = {i: k for k, i in enumerate(ids)}
    idx_sr = [pos[i] for i in ids if i not in risco]
    idx_r = [pos[i] for i in ids if i in risco]

    # ---------------- Análise 1
    bm = cv.calcular(qs, cv.anotar_ids(bx.rodar_bm25(qs), ind), cv.casa_v1, perigo_inclui_fora=True)
    assert bm["spec_hit"] == 38
    vet = {"tfidf": tf["spec_vec"], "bm25": bm["spec_vec"], "completo": bx.completo_do_csv(ids)}
    for nome in ("busca_pura", "sem_fixacao"):
        r = cv.calcular(qs, bruto[nome], cv.casa_v1, perigo_inclui_fora=True)
        assert r["ids_spec"] == ids
        vet[nome] = r["spec_vec"]
    vet = {k: [float(x) for x in v] for k, v in vet.items()}
    ordem = ("busca_pura", "sem_fixacao", "tfidf", "bm25", "completo")
    rot = {"busca_pura": "(i) busca pura", "sem_fixacao": "(ii) pipeline sem fixação", "tfidf": "TF-IDF", "bm25": "BM25", "completo": "sistema completo"}
    grupos = {"total": list(range(len(ids))), "risco": idx_r, "sem_risco": idx_sr}
    cont = [[g, c, int(sum(vet[c][k] for k in ks)), len(ks)] for g, ks in grupos.items() for c in ordem]
    dif = []
    for escopo, ks in (("140", grupos["total"]), ("50 sem risco", idx_sr)):
        for var in ("busca_pura", "sem_fixacao"):
            for ref in ("tfidf", "bm25", "completo"):
                b = cv.bootstrap_pareado({var: [vet[var][k] for k in ks], ref: [vet[ref][k] for k in ks]}, ref)[var]
                dif.append([escopo, var, ref, 100 * b["dif_vs_ref"], 100 * b["dif_ic"][0], 100 * b["dif_ic"][1]])
    # ---------------- Análise 2
    unidades = cv.json.loads((comum.RAIZ / "web" / "dados" / "indice_orientacao.json").read_text(encoding="utf-8"))["unidades"]
    sens = []
    for k1 in K1S:
        for b in BS:
            motor = bx.BM25(unidades, k1, b)
            resp = cv.anotar_ids({q["id"]: {"id": q["id"], **motor.responder(q["texto"])} for q in qs}, ind)
            m = cv.calcular(qs, resp, cv.casa_v1, perigo_inclui_fora=True)
            sens.append((k1, b, m["spec_hit"], m["spec_total"]))
    assert [s for s in sens if (s[0], s[1]) == (1.5, 0.75)][0][2] == 38
    vals = [s[2] for s in sens]

    # ---------------- gravação (modo x)
    with S1C.open("x", encoding="utf-8", newline="") as f:
        w = csv.writer(f, lineterminator="\n")
        w.writerow(["grupo", "condicao", "acertos_top3", "total", "percentual"])
        for g, c, k, n in cont:
            w.writerow([g, c, k, n, round(100 * k / n, 1)])
        w.writerow([])
        w.writerow(["mensagens", "variante", "referencia", "dif_variante_menos_referencia_pp", "ic95_inferior_pp", "ic95_superior_pp"])
        for e, v, r, d, lo, hi in dif:
            w.writerow([e, v, r, round(d, 2), round(lo, 2), round(hi, 2)])
    k = {(g, c): (a, n) for g, c, a, n in cont}
    md1 = ["# Busca do sistema completo sem a fixação de serviços: versão completa (exploratório)", "", AVISO, "",
           "Variantes e verificação: ver `reproducao/busca_sem_fixacao_exploratorio.py` (reexecução em memória do commit `4bf1676`). "
           "(i) busca pura = 3 primeiros de `motor.pontuar`, ignorando fixação, escopo, abstenção, corte, diversidade e reforços. "
           "(ii) pipeline completo com `pins = []` em `Perigo.avaliar`; alerta e `urgente` do nível 2 inalterados; abstenção e demais regras como estão.", "",
           f"Verificação desta execução: sistema completo reexecutado 76/140 (0 divergências contra o CSV congelado); TF-IDF 35/140; BM25 38/140. "
           f"Bootstrap pareado por mensagem, {cv.BOOTSTRAP_V1} reamostragens, semente {cv.SEMENTE_V1}, `conjunto_v1.bootstrap_pareado`, percentis 2,5% e 97,5%; "
           "nas 50 sem risco o bootstrap usa só essas 50 mensagens.", "",
           "## SA@3", "", "| Grupo | (i) busca pura | (ii) sem fixação | TF-IDF | BM25 | Sistema completo |", "|---|---|---|---|---|---|"]
    for g in grupos:
        cel = lambda c: f"{k[(g, c)][0]}/{k[(g, c)][1]} ({100 * k[(g, c)][0] / k[(g, c)][1]:.1f}%)"
        md1.append(f"| {g.replace('_', ' ')} | " + " | ".join(cel(c) for c in ordem) + " |")
    md1 += ["", "## Diferenças pareadas (variante menos referência; pontos percentuais; IC 95%)", "", "| Mensagens | Variante | Referência | Diferença | IC 95% |", "|---|---|---|---|---|"]
    for e, v, r, d, lo, hi in dif:
        md1.append(f"| {e} | {rot[v]} | {rot[r]} | {d:+.2f} | [{lo:.2f}; {hi:.2f}] |")
    with S1M.open("x", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(md1) + "\n")
    with S2C.open("x", encoding="utf-8", newline="") as f:
        w = csv.writer(f, lineterminator="\n")
        w.writerow(["k1", "b", "acertos_top3", "total", "percentual"])
        for k1, b, h, n in sens:
            w.writerow([k1, b, h, n, round(100 * h / n, 1)])
    md2 = ["# Sensibilidade do BM25 a k1 e b (exploratório)", "", AVISO, "",
           "Mesma implementação, normalização, unidades, gabarito e critério de `reproducao/bm25_exploratorio.py`; só k1 e b variam. SA@3 nas 140 mensagens orientáveis. "
           "Sem escolha de melhor combinação e sem intervalos por combinação. A configuração de `EXPLORATORIO_BM25.md` é k1 = 1,5 e b = 0,75.", "",
           "| k1 \\ b | 0,5 | 0,75 | 1,0 |", "|---|---|---|---|"]
    for k1 in K1S:
        md2.append(f"| {k1} | " + " | ".join(next(f"{h}/{n} ({100 * h / n:.1f}%)" for a, bb, h, n in sens if a == k1 and bb == b) for b in BS) + " |")
    md2 += ["", f"Mínimo: {min(vals)}/140 ({100 * min(vals) / 140:.1f}%). Máximo: {max(vals)}/140 ({100 * max(vals) / 140:.1f}%).", ""]
    with S2M.open("x", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(md2) + "\n")
    print("\n".join(md1)); print(); print("\n".join(md2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
