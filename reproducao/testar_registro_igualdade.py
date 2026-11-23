"""Confere que reproducao/resultados/REGISTRO_TESTE_CONGELADO.csv não muda nada do que foi medido: as colunas originais precisam ser
idênticas às de PREVISOES_TESTE_CONGELADO.csv (com CRLF normalizado para LF) e os totais principais precisam bater. Só lê arquivos.

Uso (da raiz do repositório):  python reproducao/testar_registro_igualdade.py        (sai com código 1 em qualquer diferença)
"""
from __future__ import annotations

import csv
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import conjunto_v1 as cv  # noqa: E402

RES = cv.RAIZ / "reproducao" / "resultados"
ORIGINAL, REGISTRO = RES / "PREVISOES_TESTE_CONGELADO.csv", RES / "REGISTRO_TESTE_CONGELADO.csv"
NOVAS = ["nivel_alerta", "regra_disparada", "probabilidade_perigo", "ancora_bloqueou", "servicos_fixados", "ordem_final_top5"]


def ler(caminho: Path) -> list[list[str]]:
    texto = caminho.read_bytes().decode("utf-8-sig").replace("\r\n", "\n")
    return list(csv.reader(texto.splitlines(), delimiter=";"))


def main() -> int:
    erros: list[str] = []
    orig, reg = ler(ORIGINAL), ler(REGISTRO)
    n = len(orig[0])
    if reg[0] != orig[0] + NOVAS:
        erros.append(f"cabeçalho diferente: {reg[0]}")
    if len(reg) != len(orig):
        erros.append(f"número de linhas diferente: {len(reg)} contra {len(orig)}")
    for k, (a, b) in enumerate(zip(orig, reg)):
        if b[:n] != a:
            erros.append(f"linha {k + 1}: colunas originais diferentes: {a} contra {b[:n]}")
            if len(erros) > 5:
                break
    c = {k: i for i, k in enumerate(reg[0])}
    linhas = [dict(zip(reg[0], r)) for r in reg[1:]]
    por = {}
    for r in linhas:
        por.setdefault(r["condicao_codigo"], {})[r["id_mensagem"]] = r
    ind = cv.Indice()
    qs = {q["id"]: q for q in (cv.converter_item(i, ind) for i in cv.carregar_conjunto())}
    comp = por["completo"]
    risco = [i for i, q in qs.items() if q["perigo"]]
    neg = [i for i, q in qs.items() if not q["perigo"]]
    alertas = sum(int(comp[i]["nivel_alerta"]) > 0 for i in risco)
    completos = sum(int(comp[i]["nivel_alerta"]) == 2 for i in risco)
    falsos = sum(int(comp[i]["nivel_alerta"]) > 0 for i in neg)
    acertos = 0
    total = 0
    for i, q in qs.items():
        if q["acao"] == "Responder" and q["especificos"]:
            total += 1
            itens = [{"id": comp[i][f"item_{k}"], "svc": (ind.unidades.get(comp[i][f"item_{k}"]) or {}).get("svc")} for k in (1, 2, 3) if comp[i][f"item_{k}"]]
            acertos += int(any(cv.casa_v1(it, t) for it in itens for t in q["especificos"]))
    for nome, obtido, esperado in (("alertas nas 90 de risco", alertas, 73), ("alertas completos nas 90", completos, 56), ("falsos alarmes nas 100", falsos, 0),
                                   ("SA@3 acertos", acertos, 76), ("SA@3 denominador", total, 140)):
        if obtido != esperado:
            erros.append(f"{nome}: {obtido} (esperado {esperado})")
    for cond, d in por.items():  # o registro nunca contradiz a coluna original de alerta
        for i, r in d.items():
            if r["nivel_alerta"] != "" and (r["alerta_perigo"] == "sim") != (int(r["nivel_alerta"]) > 0):
                erros.append(f"{cond} {i}: alerta_perigo e nivel_alerta se contradizem")
    print(f"linhas: {len(reg) - 1}; alertas nas 90: {alertas}; completos: {completos}; falsos alarmes: {falsos}; SA@3: {acertos}/{total}")
    if erros:
        print("FALHOU:")
        print("\n".join(erros))
        return 1
    print("OK: colunas originais idênticas e totais conferidos (73/90, 56 completos, 0/100, 76/140).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
