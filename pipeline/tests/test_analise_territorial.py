"""Testes da análise territorial com dados sintéticos pequenos (a conferência dos números é feita à mão)."""
import math

import pytest

import analise_territorial as at


def quadrado(x0, y0, lado=0.01):
    return {"type": "Polygon", "coordinates": [[[x0, y0], [x0 + lado, y0], [x0 + lado, y0 + lado], [x0, y0 + lado], [x0, y0]]]}


def geo():
    # dois setores lado a lado; o da esquerda tem 1000 pessoas, o da direita 3000
    return {"features": [
        {"properties": {"bairro": "Alfa", "pessoas": 1000}, "geometry": quadrado(-47.60, -22.40)},
        {"properties": {"bairro": "Beta", "pessoas": 3000}, "geometry": quadrado(-47.59, -22.40)},
    ]}


def cras(id_, lat, lon):
    return {"id": id_, "tipo": "assistencia", "subtipo": "cras", "nome": id_, "lat": lat, "lon": lon}


def test_haversine_um_grau_de_latitude():
    assert abs(at.haversine_km(0, 0, 1, 0) - 111.19) < 0.1


def test_ponto_em_poligono_e_buraco():
    g = {"type": "Polygon", "coordinates": [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]], [[4, 4], [6, 4], [6, 6], [4, 6], [4, 4]]]}
    assert at.contem(g, 1, 1) and not at.contem(g, 5, 5) and not at.contem(g, 20, 20)


def test_distancia_ponderada_pela_populacao_e_servico_no_bairro():
    # um CRAS no meio do setor Alfa (a ~0 km do centro de Alfa)
    s = [cras("man-cras-a", -22.395, -47.595)]
    r = at.analisar(geo(), s, {})
    b = {x["bairro"]: x for x in r["bairros"]}
    assert b["Alfa"]["distancia_media_cras_km"] < 0.1
    assert b["Beta"]["distancia_media_cras_km"] > 0.8        # um centésimo de grau de longitude, ~1 km
    assert b["Alfa"]["servicos_no_bairro"] == 1 and b["Beta"]["servicos_no_bairro"] == 0
    assert r["meta"]["pessoas_total"] == 4000
    assert r["meta"]["cobertura_dos_servicos"]["cras"] == {"com_coordenada": 1, "cadastrados": 1}
    assert b["Alfa"]["distancia_media_ubs_km"] is None, "categoria sem nenhum serviço com coordenada fica vazia, não zero"


def test_sem_coordenada_nao_gera_nada():
    sem = [{"id": "man-cras-x", "tipo": "assistencia", "subtipo": "cras", "nome": "x", "cep": "13500000"}]
    with pytest.raises(ValueError):
        at.analisar(geo(), sem, {})


def test_coordenada_pelo_indice_de_cep():
    sv = [{"id": "man-cras-x", "tipo": "assistencia", "subtipo": "cras", "nome": "x", "cep": "13500-000"}]
    r = at.analisar(geo(), sv, {"13500000": [-22.395, -47.595]})
    assert r["meta"]["cobertura_dos_servicos"]["cras"]["com_coordenada"] == 1


def test_so_catalogo_verificado_a_mao():
    sv = [dict(cras("cnes-123", -22.395, -47.595))]  # id de pipeline, não "man-"
    with pytest.raises(ValueError):
        at.analisar(geo(), sv, {})


def test_aviso_e_sem_dado_pessoal():
    r = at.analisar(geo(), [cras("man-cras-a", -22.395, -47.595)], {})
    assert "não provam" in r["meta"]["aviso"] and "exploratório" in r["meta"]["aviso"]
    assert set(r["bairros"][0]) <= {"bairro", "setores", "pessoas", "servicos_no_bairro", "grupo", "distancia_media_cras_km", "distancia_media_ubs_km", "distancia_media_escola_km"}


def test_agrupamento_so_com_bairros_suficientes():
    bairros = [{"bairro": str(i), "pessoas": 100, "distancia_media_cras_km": float(i), "distancia_media_ubs_km": float(i), "distancia_media_escola_km": float(i)} for i in range(12)]
    g = at.agrupar(bairros, 3)
    if g is not None:  # sem scikit-learn o agrupamento é simplesmente omitido
        assert len(g["resumo"]) == 3 and sum(r["bairros"] for r in g["resumo"]) == 12
        assert g["resumo"][0]["media_distancia_media_cras_km"] <= g["resumo"][-1]["media_distancia_media_cras_km"]
    assert at.agrupar(bairros[:4], 3) is None
