import json
import math
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import territorio as t  # noqa: E402

RAIZ = Path(__file__).resolve().parents[2]


def quadrado(lon, lat, lado):
    return [[lon, lat], [lon + lado, lat], [lon + lado, lat + lado], [lon, lat + lado], [lon, lat]]


def feature(setor, bairro, pessoas, domicilios, geometria):
    return {"type": "Feature", "properties": {"setor": setor, "bairro": bairro, "situacao": "Urbana",
                                              "pessoas": pessoas, "domicilios": domicilios}, "geometry": geometria}


def test_area_de_um_quadrado_de_0_01_grau():
    area = t.area_km2({"type": "Polygon", "coordinates": [quadrado(-47.56, -22.40, 0.01)]})
    esperado = 0.01 * 111.320 * math.cos(math.radians(-22.40)) * 0.01 * 110.574
    assert area == pytest.approx(esperado, rel=1e-6) and 1.0 < area < 1.2   # ~1,14 km²


def test_area_com_furo_e_multipoligono():
    com_furo = {"type": "Polygon", "coordinates": [quadrado(-47.56, -22.40, 0.02), quadrado(-47.555, -22.395, 0.01)]}
    cheio = {"type": "Polygon", "coordinates": [quadrado(-47.56, -22.40, 0.02)]}
    furo = {"type": "Polygon", "coordinates": [quadrado(-47.555, -22.395, 0.01)]}
    assert t.area_km2(com_furo) == pytest.approx(t.area_km2(cheio) - t.area_km2(furo), rel=1e-9)
    multi = {"type": "MultiPolygon", "coordinates": [[quadrado(-47.56, -22.40, 0.01)], [quadrado(-47.50, -22.40, 0.01)]]}
    assert t.area_km2(multi) == pytest.approx(2 * t.area_km2(furo), rel=1e-3)


def test_orientacao_do_anel_nao_muda_a_area():
    a = quadrado(-47.56, -22.40, 0.01)
    assert t.area_do_anel_km2(a) == pytest.approx(t.area_do_anel_km2(a[::-1]))


def test_classe_limite_inferior_inclusivo():
    assert [t.classe(v, [500, 2000]) for v in (0, 499, 500, 1999, 2000, 90000)] == [0, 0, 1, 1, 2, 2]


def mini():
    p = lambda lon: {"type": "Polygon", "coordinates": [quadrado(lon, -22.40, 0.01)]}  # noqa: E731
    return {"features": [
        feature("1", "Centro", 1000, 400, p(-47.60)),     # ~1,14 km²
        feature("2", "Centro", 3000, 1200, p(-47.58)),
        feature("3", "Vila", 5, 2, p(-47.56)),            # poucos domicílios: sem pessoas/domicílio
        feature("4", "Vila", 0, 0, p(-47.54)),            # setor vazio: densidade 0, não nula
        feature("5", None, 100, 40, p(-47.52)),           # a malha do IBGE traz bairro vazio para parte dos setores
        feature("6", "  ", 50, 20, p(-47.50)),
    ]}


def test_montar_totais_bairros_e_regras():
    d = t.montar(mini(), hoje="2026-10-11")
    assert d["totais"]["pessoas"] == 4155 and d["totais"]["domicilios"] == 1662 and d["totais"]["setores"] == 6
    assert [b["nome"] for b in d["bairros"]] == ["Centro", t.SEM_BAIRRO, "Vila"]  # por população; "sem bairro" não some nem vira nome vazio
    assert d["meta"]["sem_bairro"] == {"rotulo": t.SEM_BAIRRO, "setores": 2, "pessoas": 150}
    centro = d["bairros"][0]
    assert centro["pessoas"] == 4000 and centro["setores"] == 2 and centro["pessoas_por_domicilio"] == 2.5
    vila = next(b for b in d["bairros"] if b["nome"] == "Vila")
    assert vila["pessoas_por_domicilio"] is None                               # 2 domicílios: sem base
    assert d["setores"]["3"]["p"] is None and d["setores"]["1"]["p"] == 2.5
    assert d["setores"]["4"]["d"] == 0                                         # zero pessoas é 0, não "sem dado"
    # sem base: os setores "3" (2 domicílios) e "4" (0); os outros quatro têm 20 domicílios ou mais
    assert d["classes"]["pessoas_por_domicilio"]["sem_base_suficiente"] == 2
    assert sum(d["classes"]["densidade"]["contagem"]) == 6
    assert sum(d["classes"]["pessoas_por_domicilio"]["contagem"]) == 4


def test_sem_oferta_nao_ha_educacao_infantil_e_com_oferta_leva_so_o_agregado():
    assert "educacao_infantil" not in t.montar(mini())
    oferta = {"meta": {"fonte": "INEP", "aviso": "Matrícula não é vaga."},
              "totais_por_rede": {"municipal": {"matriculas_creche": 10}}, "escolas": [{"nome": "NÃO PODE VAZAR"}]}
    d = t.montar(mini(), oferta)
    assert d["educacao_infantil"]["por_rede"]["municipal"]["matriculas_creche"] == 10
    assert "NÃO PODE VAZAR" not in json.dumps(d, ensure_ascii=False)


# ---------------------------------------------------------- com os dados reais do repositório
@pytest.fixture(scope="module")
def real():
    geo = json.loads((RAIZ / "web" / "dados" / "setores.geojson").read_text(encoding="utf-8"))
    return t.montar(geo)


def test_dados_reais_batem_com_o_ibge(real):
    c = real["meta"]["conferencia"]
    assert real["totais"]["setores"] == 408 and real["totais"]["bairros"] == 28
    assert c["pessoas_somadas"] == c["pessoas_publicadas_ibge"] == 201418
    assert abs(c["diferenca_area_pct"]) < 1.0, "a soma das áreas dos polígonos deve ficar a menos de 1% da área oficial"
    assert 400 <= real["totais"]["densidade"] <= 410                      # IBGE: 404,11 hab/km²


def test_dados_reais_cada_setor_aparece_uma_vez_nas_classes(real):
    d = real["classes"]["densidade"]
    assert sum(d["contagem"]) == 408
    p = real["classes"]["pessoas_por_domicilio"]
    assert sum(p["contagem"]) + p["sem_base_suficiente"] == 408
    assert sum(b["pessoas"] for b in real["bairros"]) == 201418


def test_dados_reais_indicador_instavel_nao_vira_valor(real):
    # nenhum setor com menos de 20 domicílios pode ter pessoas por domicílio
    geo = json.loads((RAIZ / "web" / "dados" / "setores.geojson").read_text(encoding="utf-8"))
    for f in geo["features"]:
        if f["properties"]["domicilios"] < t.MIN_DOMICILIOS:
            assert real["setores"][f["properties"]["setor"]]["p"] is None
    valores = [s["p"] for s in real["setores"].values() if s["p"] is not None]
    assert max(valores) < 15, "um setor com base suficiente não deve ter dezenas de pessoas por domicílio"


def test_dados_reais_nenhum_bairro_com_nome_vazio(real):
    assert all((b["nome"] or "").strip() for b in real["bairros"])
    sem = real["meta"]["sem_bairro"]
    assert sem["setores"] > 0 and sem["rotulo"] == t.SEM_BAIRRO
    assert next(b for b in real["bairros"] if b["nome"] == t.SEM_BAIRRO)["pessoas"] == sem["pessoas"]
