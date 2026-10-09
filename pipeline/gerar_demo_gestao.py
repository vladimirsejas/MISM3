"""Gera os dados FICTICIOS do painel de gestao (web/dados/demo/gestao.json).

Nada aqui e medicao real: o MISM3 e um prototipo que nunca recebe dados verdadeiros.
O gerador e DETERMINISTICO (mesma semente, mesmo resultado) e confere invariantes
(o funil sempre decresce, as somas batem), para que a demonstracao nunca mostre numero impossivel.

Regra de privacidade mostrada no prototipo: celulas com menos de K_MINIMO casos sao ocultadas
(aparecem como "menos de 5"), para que um numero pequeno nao identifique ninguem.

Uso:  python pipeline/gerar_demo_gestao.py
"""
from __future__ import annotations

import json
import random
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import WEB_DADOS, salvar_json  # noqa: E402

SEMENTE = 20261009
K_MINIMO = 5
MESES = ["2025-11", "2025-12", "2026-01", "2026-02", "2026-03", "2026-04",
         "2026-05", "2026-06", "2026-07", "2026-08", "2026-09", "2026-10"]

# (id, rotulo, peso, % de buscas sem resultado). Os ids sao os de web/necessidades.js.
NECESSIDADES = [
    ("emprego", "Emprego e renda", 22, 6), ("filhos", "Filhos e cuidado infantil", 17, 9),
    ("saude", "Saúde", 14, 4), ("estudo", "Estudo e cursos", 12, 8),
    ("familia", "Família e assistência social", 12, 5), ("casamento", "Casamento, separação e direitos", 10, 21),
    ("violencia", "Violência e proteção", 7, 3), ("transporte", "Ônibus e transporte", 6, 34),
]
# Regioes genericas (nenhuma e dado real).
REGIOES = ["Centro", "Zona Norte", "Zona Sul", "Zona Leste", "Zona Oeste", "Ajapi (distrito)", "Assistência (distrito)", "Região do Cervezão"]
SEM_RESULTADO = [
    ("Orientação jurídica gratuita (guarda, pensão)", 148), ("Vaga em creche perto de casa", 121),
    ("Horário de ônibus por linha", 104), ("Curso com turma aberta", 87),
    ("Atendimento psicológico para mulheres", 66), ("Casa de acolhimento", 43), ("Dar entrada no Cadastro Único", 29),
]


def suprimir(n: int) -> int | None:
    """None = ocultar (menos de K_MINIMO casos)."""
    return n if n >= K_MINIMO else None


def gerar() -> dict:
    rng = random.Random(SEMENTE)

    # ---- buscas por mes: crescimento com sazonalidade (picos em janeiro e agosto)
    base, serie = 540, []
    for i, m in enumerate(MESES):
        sazonal = 1.18 if m.endswith(("-01", "-08")) else (0.9 if m.endswith("-12") else 1.0)
        serie.append(int(base * (1.045 ** i) * sazonal * rng.uniform(0.96, 1.04)))
    total = sum(serie)

    # ---- por necessidade: reparte o total pelos pesos; o ultimo absorve o arredondamento
    pesos = sum(p for _, _, p, _ in NECESSIDADES)
    nec, usado = [], 0
    for i, (id_, rotulo, peso, pct_sem) in enumerate(NECESSIDADES):
        n = total - usado if i == len(NECESSIDADES) - 1 else int(total * peso / pesos * rng.uniform(0.95, 1.05))
        usado += n
        nec.append({"id": id_, "rotulo": rotulo, "buscas": n, "sem_resultado": int(n * pct_sem / 100 * rng.uniform(0.9, 1.1))})
    nec.sort(key=lambda x: -x["buscas"])

    # ---- funil da autonomia (so quem buscou emprego/renda/curso)
    procuraram = sum(x["buscas"] for x in nec if x["id"] in ("emprego", "estudo"))
    funil, valor = [("Procuraram trabalho ou curso", procuraram)], procuraram
    for etapa, taxa in (("Se inscreveram", 0.19), ("Participaram", 0.69), ("Concluíram", 0.68), ("Chegaram a uma nova oportunidade", 0.33)):
        valor = int(valor * taxa * rng.uniform(0.97, 1.03))
        funil.append((etapa, valor))
    funil = [{"etapa": e, "valor": v} for e, v in funil]

    # ---- demanda x oferta por regiao (algumas com demanda muito acima da oferta, uma com vagas ociosas)
    regioes = []
    for nome, interessadas, vagas in zip(REGIOES, (310, 480, 420, 520, 390, 60, 45, 275), (190, 130, 160, 110, 150, 40, 55, 120)):
        regioes.append({"regiao": nome, "interessadas": int(interessadas * rng.uniform(0.95, 1.05)),
                        "vagas": int(vagas * rng.uniform(0.95, 1.05)), "abandono_pct": round(rng.uniform(9, 31), 1)})
    regioes[6]["vagas"] = max(regioes[6]["vagas"], int(regioes[6]["interessadas"] * 1.4))  # vagas ociosas: oferta > demanda

    # ---- criancas de 0 a 4 anos por setor (fictício), usando a malha real so como geometria
    geo = json.loads((WEB_DADOS / "setores.geojson").read_text(encoding="utf-8"))
    setores = {}
    for f in geo["features"]:
        pessoas = int(f["properties"].get("pessoas") or 0)
        r = random.Random(f"{SEMENTE}-{f['properties']['setor']}")
        setores[f["properties"]["setor"]] = int(pessoas * r.uniform(0.03, 0.095))

    sem_resultado = [{"tema": t, "ocorrencias": n} for t, n in SEM_RESULTADO]
    # cada necessidade fica identificavel na lista de "sem resultado" so se passar do limite de privacidade
    for x in nec:
        x["sem_resultado"] = suprimir(x["sem_resultado"])

    conferir(serie, nec, funil, regioes)
    return {
        "meta": {"demo": True, "aviso": "DADOS FICTÍCIOS. Nenhum número deste painel é medição real.",
                 "k_minimo": K_MINIMO, "periodo": [MESES[0], MESES[-1]]},
        "meses": MESES, "buscas_por_mes": serie, "necessidades": nec, "funil": funil,
        "regioes": regioes, "sem_resultado": sem_resultado, "criancas_0_4_por_setor": setores,
    }


def conferir(serie, nec, funil, regioes):
    """Invariantes: se algum falhar, o demo mostraria um numero impossivel."""
    assert len(serie) == len(MESES) and all(v > 0 for v in serie)
    assert sum(x["buscas"] for x in nec) == sum(serie), "as necessidades devem somar o total de buscas"
    vals = [f["valor"] for f in funil]
    assert all(a > b > 0 for a, b in zip(vals, vals[1:])), "o funil deve decrescer a cada etapa"
    assert any(r["interessadas"] > 3 * r["vagas"] for r in regioes), "falta uma regiao com demanda muito acima da oferta"
    assert any(r["vagas"] > r["interessadas"] for r in regioes), "falta uma regiao com vagas ociosas"
    for x in nec:
        assert x["sem_resultado"] is None or x["sem_resultado"] <= x["buscas"]


def main() -> None:
    dados = gerar()
    salvar_json(dados, WEB_DADOS / "demo" / "gestao.json")
    print("web/dados/demo/gestao.json: %d buscas fictícias em %d meses, %d setores" % (
        sum(dados["buscas_por_mes"]), len(dados["meses"]), len(dados["criancas_0_4_por_setor"])))


if __name__ == "__main__":
    main()
