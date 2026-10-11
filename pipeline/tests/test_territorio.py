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


# ---------------------------------------------------------- distância até o serviço mais próximo
def tres_setores():
    """Três quadrados de 0,01 grau (~1,0 km de lado), lado a lado, com 100, 200 e 400 pessoas."""
    p = lambda lon: {"type": "Polygon", "coordinates": [quadrado(lon, -22.40, 0.01)]}  # noqa: E731
    return {"features": [feature("a", "A", 100, 40, p(-47.60)), feature("b", "B", 200, 80, p(-47.59)),
                         feature("c", "C", 400, 160, p(-47.57))]}


def cras(lat, lon, **extra):
    return {"id": "man-cras-x", "tipo": "assistencia", "subtipo": "cras", "nome": "CRAS X", "lat": lat, "lon": lon, "cep": None, **extra}


def test_localizar_servico_endereco_cep_e_cep_vago():
    assert t.localizar_servico({"lat": -22.40, "lon": -47.56}, None) == (-22.40, -47.56, "endereco", 0)
    assert t.localizar_servico({"lat": -23.5, "lon": -46.6}, None) is None                    # São Paulo: fora de Rio Claro
    assert t.localizar_servico({"lat": "texto", "lon": "x"}, None) is None
    indice = {"13501000": [-22.41, -47.55, 300, "s", 12], "13500000": [-22.40, -47.56, 1500, "s", 900]}
    assert t.localizar_servico({"cep": "13501-000"}, indice) == (-22.41, -47.55, "cep", 300)
    assert t.localizar_servico({"cep": "13500000"}, indice) is None                           # CEP geral da cidade: vago demais
    assert t.localizar_servico({"cep": "13509999"}, indice) is None and t.localizar_servico({}, indice) is None


def test_distancia_ate_o_servico_mais_proximo_e_resumo():
    # CRAS no centro do setor "a": "a" fica a ~0 km, "b" (0,01° a leste) a ~1,03 km e "c" (0,03° a leste) a ~3,08 km
    d = t.distancias_ate_servicos(tres_setores(), [cras(-22.395, -47.595)], None)["cras"]
    a, b, c = (d["por_setor"][k] for k in "abc")
    assert a < 0.05 and 1.0 < b < 1.07 and 3.0 < c < 3.15
    assert d["contagem"] == [1, 0, 1, 0, 1] and sum(d["contagem"]) == 3                    # <0,5 | 0,5-1 | 1-2 | 2-3 | >=3
    assert d["pessoas_por_classe"] == [100, 0, 200, 0, 400] and d["pessoas_total"] == 700
    assert d["pessoas_ate_1_km"] == 100 and d["pessoas_3_km_ou_mais"] == 400                # "b" está a 1,03 km: fora do "até 1 km"
    assert d["mediana_km"] == pytest.approx(3.08, abs=0.1)                                  # 400 das 700 pessoas (mais da metade) estão a ~3 km
    assert (d["cadastrados"], d["localizados"], d["localizados_pelo_endereco"]) == (1, 1, 1)


def test_cobertura_conta_o_que_nao_foi_localizado():
    servicos = [cras(-22.395, -47.595), {**cras(None, None), "id": "man-cras-y", "nome": "CRAS Y", "cep": None}]
    d = t.distancias_ate_servicos(tres_setores(), servicos, None)["cras"]
    assert (d["cadastrados"], d["localizados"]) == (2, 1)                                  # a página precisa mostrar "1 de 2"


def test_so_servicos_do_catalogo_manual_e_a_categoria_certa():
    ubs = {"id": "man-ubs", "tipo": "saude", "subtipo": "ubs", "nome": "UBS", "lat": -22.395, "lon": -47.595}
    cnes = {"id": "cnes-123", "tipo": "saude", "subtipo": "ubs", "nome": "CNES", "lat": -22.395, "lon": -47.595}
    escola = {"id": "man-em-1", "tipo": "creche", "subtipo": "escola_municipal", "nome": "EM sem etapas", "lat": -22.395, "lon": -47.595}
    com_creche = {**escola, "id": "man-em-2", "nome": "EM com creche", "etapas": {"creche": True, "pre_escola": True, "fonte": "f"}}
    so_pre = {**escola, "id": "man-em-3", "nome": "EM só pré", "etapas": {"creche": False, "pre_escola": True, "fonte": "f"}}
    r = t.distancias_ate_servicos(tres_setores(), [ubs, cnes, escola, com_creche, so_pre], None)
    assert set(r) == {"ubs", "creche"}                                                      # sem CRAS localizado, a categoria some
    assert r["ubs"]["cadastrados"] == 1                                                     # o registro do CNES não entra
    assert [p["nome"] for p in r["creche"]["pontos"]] == ["EM com creche"]                  # sem etapa conhecida ou sem creche: fora
    assert r["creche"]["nota"]


def test_montar_sem_servico_localizado_nao_traz_distancia_nenhuma():
    d = t.montar(tres_setores(), servicos=[cras(None, None)])
    assert "distancia_ate_servico" not in d and "aviso_distancia" not in d["meta"]
    assert not any(k.startswith("dist_") for s in d["setores"].values() for k in s)


def test_montar_com_servico_traz_distancia_por_setor_aviso_e_pontos_sem_duplicar():
    d = t.montar(tres_setores(), servicos=[cras(-22.395, -47.595)], indice_cep=None)
    assert d["setores"]["a"]["dist_cras"] < 0.05 and d["setores"]["c"]["dist_cras"] > 3
    assert "aproximada" in d["meta"]["aviso_distancia"] and "não prova falta de serviço" in d["meta"]["aviso_distancia"]
    bloco = d["distancia_ate_servico"]["cras"]
    assert "por_setor" not in bloco and bloco["pontos"][0]["precisao"] == "endereco"
    assert set(bloco["pontos"][0]) == {"nome", "lat", "lon", "precisao", "raio_m"}          # só o que o mapa precisa; nada de telefone ou endereço
