"""Funções comuns da pasta reproducao/: perguntas, execução das variantes, intervalos de confiança e metadados.

Regras que esta pasta cumpre (e que este módulo impõe):
  - só os conjuntos desenvolvimento e teste são carregados; independente, reserva e final nunca são lidos para execução;
  - perguntas marcadas visto_no_treino são excluídas, como em avaliacao/avaliar.py (a contagem fica registrada);
  - nenhum arquivo fora de reproducao/ é escrito.
"""
from __future__ import annotations

import json
import math
import platform
import random
import subprocess
import sys
import tempfile
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
CONJUNTOS = ("desenvolvimento", "teste")
SEMENTE = 20261105
BOOTSTRAP = 2000
Z95 = 1.959963984540054


def carregar_perguntas() -> tuple[dict[str, list[dict]], dict[str, int]]:
    """Devolve {conjunto: perguntas executáveis} e {conjunto: quantas foram excluídas por visto_no_treino}."""
    bruto = json.loads((RAIZ / "avaliacao" / "perguntas.json").read_text(encoding="utf-8"))["perguntas"]
    por: dict[str, list[dict]] = {c: [] for c in CONJUNTOS}
    excluidas = {c: 0 for c in CONJUNTOS}
    for q in bruto:
        if q["conjunto"] not in CONJUNTOS:
            continue  # independente, reserva e final: descartadas aqui, antes de qualquer execução
        if q.get("visto_no_treino"):
            excluidas[q["conjunto"]] += 1
            continue
        por[q["conjunto"]].append(q)
    return por, excluidas


def rodar_variante(condicao: str, perguntas: list[dict]) -> dict[str, dict]:
    """Executa uma condição com o Node (modulos reais de web/) só sobre as perguntas entregues."""
    with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False, encoding="utf-8") as f:
        json.dump([{"id": q["id"], "texto": q["texto"]} for q in perguntas], f, ensure_ascii=False)
        caminho = f.name
    try:
        r = subprocess.run(["node", str(RAIZ / "reproducao" / "rodar_variantes.js"), "--perguntas", caminho, "--condicao", condicao],
                           capture_output=True, text=True, encoding="utf-8", check=True)
    finally:
        Path(caminho).unlink(missing_ok=True)
    return {x["id"]: x for x in json.loads(r.stdout)}


def casa(item: dict, token: str) -> bool:
    """Mesma regra de avaliacao/avaliar.py: gabarito 'area:X', 'sec:area/ancora' ou 'svc:tipo/subtipo'."""
    tipo, _, resto = token.partition(":")
    if tipo == "area":
        return item.get("area") == resto
    if tipo == "svc":
        return item.get("svc") == resto
    if tipo == "sec":
        area, _, ancora = resto.partition("/")
        if area == ancora:
            return item.get("area") == area
        return item.get("area") == area and item.get("sec") == ancora
    return False


def wilson(k: int, n: int, z: float = Z95) -> tuple[float, float]:
    """Intervalo de Wilson de 95% para uma proporção k/n."""
    if n == 0:
        return (float("nan"), float("nan"))
    p = k / n
    d = 1 + z * z / n
    centro = (p + z * z / (2 * n)) / d
    meia = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d
    return (max(0.0, centro - meia), min(1.0, centro + meia))


def bootstrap_media(valores: list[float], reamostragens: int = BOOTSTRAP, semente: int = SEMENTE) -> tuple[float, float]:
    """Intervalo percentil de 95% da média, por bootstrap com semente fixa."""
    if not valores:
        return (float("nan"), float("nan"))
    rng = random.Random(semente)
    n = len(valores)
    medias = sorted(sum(valores[rng.randrange(n)] for _ in range(n)) / n for _ in range(reamostragens))
    return (medias[int(0.025 * reamostragens)], medias[int(0.975 * reamostragens) - 1])


def metricas(perguntas: list[dict], respostas: dict[str, dict]) -> dict:
    """Mesmas definições de avaliacao/avaliar.py, mais o reciproco por pergunta (para o bootstrap do MRR)."""
    m: dict = defaultdict(int)
    rr: list[float] = []
    for q in perguntas:
        r = respostas[q["id"]]
        itens3 = r["itens"][:3]
        if q["fora_de_escopo"]:
            m["fora_total"] += 1
            m["fora_abstida"] += int(r["abstem"] or not r["itens"])
            continue
        m["escopo_total"] += 1
        m["respondida"] += int(bool(r["itens"]) and not r["abstem"])
        if q["areas"]:
            m["area_total"] += 1
            m["area_hit"] += int(any(casa(i, t) for i in itens3 for t in q["areas"]))
        if q["especificos"]:
            m["spec_total"] += 1
            pos = next((k for k, i in enumerate(r["itens"], 1) if any(casa(i, t) for t in q["especificos"])), None)
            m["spec_hit"] += int(pos is not None and pos <= 3)
            rr.append(1 / pos if pos else 0.0)
        if q["perigo"]:
            m["perigo_total"] += 1
            m["perigo_ok"] += int(r["perigo"])
        else:
            m["nao_perigo_total"] += 1
            m["falso_alarme"] += int(r["perigo"])
    m = dict(m)
    m["rr"] = rr
    return m


def versoes() -> dict[str, str]:
    def cmd(*a: str) -> str:
        try:
            return subprocess.run(a, capture_output=True, text=True, encoding="utf-8", cwd=RAIZ).stdout.strip()
        except OSError:
            return "indisponível"
    return {
        "commit": cmd("git", "rev-parse", "HEAD"),
        "commit_curto": cmd("git", "rev-parse", "--short", "HEAD"),
        "ramo": cmd("git", "branch", "--show-current"),
        "alteracoes_fora_de_reproducao": cmd("git", "status", "--porcelain", "--", ".", ":(exclude)reproducao"),
        "node": cmd("node", "--version"),
        "python": platform.python_version(),
        "sistema": platform.platform(),
        "data_utc": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S"),
        "comando": "python " + " ".join(sys.argv),
        "semente": str(SEMENTE),
    }
