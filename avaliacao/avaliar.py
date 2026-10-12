"""Avalia o sistema de orientação do MISM3 com o conjunto de perguntas independente (avaliacao/perguntas.json).

Roda o sistema REAL (os mesmos módulos JavaScript do navegador, via Node), compara com o gabarito e calcula as métricas.

Uso:  python avaliacao/avaliar.py [v1|v2] [--conjunto desenvolvimento|teste|independente|reserva|todos] [--md saida.md]

Métricas (por conjunto e por categoria):
  - Resposta@3 (área):      alguma das 3 primeiras respostas está na área certa
  - Resposta@3 (específica): alguma das 3 primeiras é a seção ou o serviço certo (só perguntas com gabarito específico)
  - MRR (específica):       1/posição da primeira resposta específica correta
  - Taxa de resposta:       perguntas dentro do escopo em que o sistema mostrou algo útil (não ficou mudo)
  - Perigo: revocação (perigo real que mostrou o alerta) e falsos alarmes
  - Abstenção correta:      perguntas fora do escopo em que o sistema NÃO inventou resposta
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from collections import defaultdict
from pathlib import Path

AQUI = Path(__file__).resolve().parent


def casa(item: dict, token: str) -> bool:
    """O item da resposta atende ao gabarito 'area:X', 'sec:area/ancora' ou 'svc:tipo/subtipo'?"""
    tipo, _, resto = token.partition(":")
    if tipo == "area":
        return item.get("area") == resto
    if tipo == "svc":
        return item.get("svc") == resto
    if tipo == "sec":
        area, _, ancora = resto.partition("/")
        if area == ancora:  # áreas sem seções (Transporte, Entre Mulheres): basta estar na área
            return item.get("area") == area
        return item.get("area") == area and item.get("sec") == ancora
    return False


def rodar(sistema: str) -> dict:
    r = subprocess.run(["node", str(AQUI / "rodar_sistema.js"), sistema], capture_output=True, text=True, check=True)
    return {x["id"]: x for x in json.loads(r.stdout)}


def pct(n: int, d: int) -> str:
    return "n/d" if d == 0 else f"{100 * n / d:.0f}% ({n}/{d})"


def metricas(perguntas: list[dict], respostas: dict) -> dict:
    m = defaultdict(int)
    mrr_soma = 0.0
    for q in perguntas:
        r = respostas[q["id"]]
        itens = r["itens"][:3]
        if q["fora_de_escopo"]:
            m["fora_total"] += 1
            m["fora_abstida"] += int(r["abstem"] or not r["itens"])
            continue
        m["escopo_total"] += 1
        m["respondida"] += int(bool(r["itens"]) and not r["abstem"])
        areas = [t for t in q["areas"]]
        if areas:
            m["area_total"] += 1
            m["area_hit"] += int(any(casa(i, t) for i in itens for t in areas))
        if q["especificos"]:
            m["spec_total"] += 1
            pos = next((k for k, i in enumerate(r["itens"], 1) if any(casa(i, t) for t in q["especificos"])), None)
            m["spec_hit"] += int(pos is not None and pos <= 3)
            mrr_soma += 1 / pos if pos else 0.0
        if q["perigo"]:
            m["perigo_total"] += 1
            m["perigo_ok"] += int(r["perigo"])
        else:
            m["nao_perigo_total"] += 1
            m["falso_alarme"] += int(r["perigo"])
    m["mrr_soma"] = mrr_soma
    return dict(m)


def linha(nome: str, m: dict) -> str:
    mrr = "n/d" if not m.get("spec_total") else f"{m['mrr_soma'] / m['spec_total']:.2f}"
    return (f"| {nome} | {pct(m.get('area_hit', 0), m.get('area_total', 0))} | {pct(m.get('spec_hit', 0), m.get('spec_total', 0))} | {mrr} | "
            f"{pct(m.get('respondida', 0), m.get('escopo_total', 0))} | {pct(m.get('perigo_ok', 0), m.get('perigo_total', 0))} | "
            f"{pct(m.get('falso_alarme', 0), m.get('nao_perigo_total', 0))} | {pct(m.get('fora_abstida', 0), m.get('fora_total', 0))} |")


CAB = ("| Grupo | Resposta@3 área | Resposta@3 específica | MRR | Taxa de resposta | Perigo: revocação | Falsos alarmes | Abstenção correta |\n"
       "|---|---|---|---|---|---|---|---|")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("sistema", nargs="?", default="v1")
    ap.add_argument("--conjunto", default="todos", choices=["desenvolvimento", "teste", "independente", "reserva", "todos"])
    ap.add_argument("--md", type=Path, default=None)
    ap.add_argument("--erros", action="store_true", help="lista as perguntas em que a resposta específica falhou")
    ap.add_argument("--incluir-vistos", action="store_true", help="inclui as perguntas iguais a frases do treino (inflam o resultado; só para comparar)")
    a = ap.parse_args()
    todas = json.loads((AQUI / "perguntas.json").read_text(encoding="utf-8"))["perguntas"]
    if not a.incluir_vistos:
        todas = [q for q in todas if not q.get("visto_no_treino")]
    respostas = rodar(a.sistema)
    saida = [f"## Sistema `{a.sistema}`", ""]
    conjuntos = ["desenvolvimento", "teste", "independente", "reserva"] if a.conjunto == "todos" else [a.conjunto]
    for conj in conjuntos:
        qs = [q for q in todas if q["conjunto"] == conj]
        saida += [f"### Conjunto de {conj} ({len(qs)} perguntas)", "", CAB, linha("**Geral**", metricas(qs, respostas))]
        por = defaultdict(list)
        for q in qs:
            por[q["categoria"]].append(q)
        for cat in sorted(por):
            saida.append(linha(cat, metricas(por[cat], respostas)))
        saida.append("")
        if a.erros:
            saida.append("Falhas na resposta específica:")
            for q in qs:
                if q["fora_de_escopo"] or not q["especificos"]:
                    continue
                r = respostas[q["id"]]
                if not any(casa(i, t) for i in r["itens"][:3] for t in q["especificos"]):
                    saida.append(f"- [{q['id']}] \"{q['texto']}\" -> {[i.get('titulo') for i in r['itens'][:3]]}")
            saida.append("")
    texto = "\n".join(saida)
    print(texto)
    if a.md:
        a.md.write_text(texto + "\n", encoding="utf-8")


if __name__ == "__main__":
    sys.exit(main())
