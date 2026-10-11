"""Indicadores territoriais de Rio Claro por setor censitário (Censo 2022, IBGE) -> web/dados/territorio.json.

Entrada : web/dados/setores.geojson (408 setores com bairro, situação, pessoas e domicílios; gerado por setores.py
          a partir da malha oficial do IBGE) e, se existir, web/dados/oferta_educacao_infantil.json (INEP).
Saída   : web/dados/territorio.json, que alimenta web/territorio.html.

Indicadores (todos de dado público e agregado; nada de pessoa):
  - densidade = pessoas / área do setor (hab/km²). A área vem do próprio polígono, num plano local centrado em
    Rio Claro. Conferência: a soma das áreas dá ~497 km² contra 498,4 km² publicados pelo IBGE.
  - pessoas por domicílio, só para setores com pelo menos MIN_DOMICILIOS domicílios. Setores pequenos dão valores
    absurdos (há setor com 106 pessoas em 1 domicílio, provavelmente domicílio coletivo) e ficam "sem base suficiente".

O que NÃO é: não mede vulnerabilidade, renda, nem necessidade. Não há idade, renda nem sexo na malha usada; esses
campos vêm dos "Agregados por setores censitários" do Censo 2022, que ainda não estão no projeto.

Uso:
    python pipeline/territorio.py
"""
from __future__ import annotations

import json
import math
import sys
from collections import Counter, defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import WEB_DADOS, agora_iso, erro, salvar_json  # noqa: E402

LAT0 = -22.40                       # latitude central de Rio Claro, para o plano local
KM_POR_GRAU_LAT = 110.574
KM_POR_GRAU_LON = 111.320 * math.cos(math.radians(LAT0))
MIN_DOMICILIOS = 20                 # abaixo disso, pessoas por domicílio não é confiável
LIMITES_DENSIDADE = [500, 2000, 5000, 10000]        # hab/km²; 5 classes
LIMITES_PESSOAS_POR_DOMICILIO = [2.0, 2.3, 2.6, 3.0]  # 5 classes
# valores publicados pelo IBGE para Rio Claro (SP), usados só para conferir o cálculo
SEM_BAIRRO = "Sem bairro definido pelo IBGE"   # a malha do IBGE não traz bairro para parte dos setores (NM_BAIRRO vazio)
IBGE_PESSOAS_2022 = 201418
IBGE_AREA_KM2 = 498.403


def area_do_anel_km2(anel) -> float:
    soma = 0.0
    for (x1, y1), (x2, y2) in zip(anel, anel[1:] + anel[:1]):
        soma += (x1 * KM_POR_GRAU_LON) * (y2 * KM_POR_GRAU_LAT) - (x2 * KM_POR_GRAU_LON) * (y1 * KM_POR_GRAU_LAT)
    return abs(soma) / 2


def area_km2(geometria: dict) -> float:
    """Área de um Polygon ou MultiPolygon: anel externo menos os furos."""
    poligonos = [geometria["coordinates"]] if geometria["type"] == "Polygon" else geometria["coordinates"]
    total = 0.0
    for p in poligonos:
        total += area_do_anel_km2(p[0]) - sum(area_do_anel_km2(furo) for furo in p[1:])
    return total


def classe(valor, limites) -> int:
    """0 a len(limites): quantos limites o valor alcança (limite inferior inclusivo)."""
    return sum(valor >= l for l in limites)


def montar(geojson: dict, oferta: dict | None = None, hoje: str | None = None) -> dict:
    setores = {}
    por_bairro = defaultdict(lambda: {"setores": 0, "pessoas": 0, "domicilios": 0, "area": 0.0})
    cont_dens = Counter()
    cont_ppd = Counter()
    sem_base = 0
    for f in geojson["features"]:
        p = f["properties"]
        area = area_km2(f["geometry"])
        pessoas, domicilios = int(p["pessoas"]), int(p["domicilios"])
        dens = pessoas / area if area > 0 else None
        ppd = pessoas / domicilios if domicilios >= MIN_DOMICILIOS else None
        setores[p["setor"]] = {
            "a": round(area, 4),
            "d": None if dens is None else round(dens),
            "p": None if ppd is None else round(ppd, 2),
        }
        if dens is not None:
            cont_dens[classe(dens, LIMITES_DENSIDADE)] += 1
        if ppd is not None:
            cont_ppd[classe(ppd, LIMITES_PESSOAS_POR_DOMICILIO)] += 1
        else:
            sem_base += 1
        b = por_bairro[(p["bairro"] or "").strip() or SEM_BAIRRO]
        b["setores"] += 1
        b["pessoas"] += pessoas
        b["domicilios"] += domicilios
        b["area"] += area

    pessoas_total = sum(b["pessoas"] for b in por_bairro.values())
    domicilios_total = sum(b["domicilios"] for b in por_bairro.values())
    area_total = sum(b["area"] for b in por_bairro.values())
    bairros = []
    for nome, b in por_bairro.items():
        bairros.append({
            "nome": nome, "setores": b["setores"], "pessoas": b["pessoas"], "domicilios": b["domicilios"],
            "area_km2": round(b["area"], 2),
            "densidade": round(b["pessoas"] / b["area"]) if b["area"] > 0 else None,
            "pessoas_por_domicilio": round(b["pessoas"] / b["domicilios"], 2) if b["domicilios"] >= MIN_DOMICILIOS else None,
        })
    bairros.sort(key=lambda b: (-b["pessoas"], b["nome"]))
    sem = por_bairro.get(SEM_BAIRRO)

    saida = {
        "meta": {
            "fonte": "IBGE, Censo Demográfico 2022, malha de setores censitários (campos v0001 = pessoas e v0002 = domicílios)",
            "gerado_em": hoje or agora_iso()[:10],
            "conferencia": {
                "pessoas_somadas": pessoas_total, "pessoas_publicadas_ibge": IBGE_PESSOAS_2022,
                "area_somada_km2": round(area_total, 1), "area_publicada_ibge_km2": IBGE_AREA_KM2,
                "diferenca_area_pct": round(100 * (area_total - IBGE_AREA_KM2) / IBGE_AREA_KM2, 2),
            },
            "sem_bairro": {"rotulo": SEM_BAIRRO, "setores": sem["setores"] if sem else 0, "pessoas": sem["pessoas"] if sem else 0},
            "aviso": "Mostra onde as pessoas moram, não quem precisa de ajuda. Não há idade, renda nem sexo nesta malha. "
                     "Mais gente por km² não quer dizer mais necessidade, nem menos serviço.",
        },
        "totais": {
            "pessoas": pessoas_total, "domicilios": domicilios_total, "setores": len(setores), "bairros": len(bairros),
            "area_km2": round(area_total, 1),
            "densidade": round(pessoas_total / area_total),
            "pessoas_por_domicilio": round(pessoas_total / domicilios_total, 2),
        },
        "classes": {
            "densidade": {"unidade": "pessoas por km²", "limites": LIMITES_DENSIDADE,
                          "contagem": [cont_dens[i] for i in range(len(LIMITES_DENSIDADE) + 1)]},
            "pessoas_por_domicilio": {"unidade": "pessoas por domicílio", "limites": LIMITES_PESSOAS_POR_DOMICILIO,
                                      "min_domicilios": MIN_DOMICILIOS,
                                      "contagem": [cont_ppd[i] for i in range(len(LIMITES_PESSOAS_POR_DOMICILIO) + 1)],
                                      "sem_base_suficiente": sem_base},
        },
        "bairros": bairros,
        "setores": setores,
    }
    if oferta:
        saida["educacao_infantil"] = {
            "fonte": oferta["meta"]["fonte"], "aviso": oferta["meta"]["aviso"], "por_rede": oferta["totais_por_rede"]}
    return saida


def main() -> int:
    caminho = WEB_DADOS / "setores.geojson"
    if not caminho.exists():
        erro("Não achei %s. Rode antes python pipeline/setores.py." % caminho)
    geojson = json.loads(caminho.read_text(encoding="utf-8"))
    p_oferta = WEB_DADOS / "oferta_educacao_infantil.json"
    oferta = json.loads(p_oferta.read_text(encoding="utf-8")) if p_oferta.exists() else None
    saida = montar(geojson, oferta)
    salvar_json(saida, WEB_DADOS / "territorio.json")
    c, t = saida["meta"]["conferencia"], saida["totais"]
    print("Gravado web/dados/territorio.json: %d setores, %d bairros, %d pessoas, %d domicílios." %
          (t["setores"], t["bairros"], t["pessoas"], t["domicilios"]))
    print("Conferência com o IBGE: pessoas %d (publicado %d); área %.1f km² (publicado %.1f; diferença %.2f%%)." %
          (c["pessoas_somadas"], c["pessoas_publicadas_ibge"], c["area_somada_km2"], c["area_publicada_ibge_km2"], c["diferenca_area_pct"]))
    print("Densidade: %s | pessoas por domicílio: %s (sem base suficiente: %d)" %
          (saida["classes"]["densidade"]["contagem"], saida["classes"]["pessoas_por_domicilio"]["contagem"],
           saida["classes"]["pessoas_por_domicilio"]["sem_base_suficiente"]))
    return 0


if __name__ == "__main__":
    sys.exit(main())
