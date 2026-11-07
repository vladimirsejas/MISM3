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


def test_faixa_geometrica_de_distancia_preserva_raio_e_limita_zero():
    assert at.faixa_distancia_km(2.0, 1500) == (0.5, 3.5)
    assert at.faixa_distancia_km(0.7, 1500) == (0.0, 2.2)


def test_faixas_sobrepostas_nao_permitem_ordenar_proximidade():
    assert at.faixas_se_sobrepoem((0.5, 2.0), (1.5, 2.5))
    assert not at.faixas_se_sobrepoem((0.2, 0.8), (1.0, 1.5))


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
    campos = {"bairro", "setores", "pessoas", "servicos_no_bairro", "grupo"}
    for categoria in ("cras", "ubs", "escola"):
        campos.update({
            "distancia_media_%s_km" % categoria,
            "distancia_media_%s_min_km" % categoria,
            "distancia_media_%s_max_km" % categoria,
        })
    assert set(r["bairros"][0]) <= campos


def test_agrupamento_so_com_bairros_suficientes():
    bairros = [{"bairro": str(i), "pessoas": 100, "distancia_media_cras_km": float(i), "distancia_media_ubs_km": float(i), "distancia_media_escola_km": float(i)} for i in range(12)]
    g = at.agrupar(bairros, 3)
    if g is not None:  # sem scikit-learn o agrupamento é simplesmente omitido
        assert len(g["resumo"]) == 3 and sum(r["bairros"] for r in g["resumo"]) == 12
        assert g["resumo"][0]["media_distancia_media_cras_km"] <= g["resumo"][-1]["media_distancia_media_cras_km"]
    assert at.agrupar(bairros[:4], 3) is None


def test_base_escolar_consolidada_e_fonte_da_localizacao():
    catalogo = [
        cras("man-cras-a", -22.395, -47.595),
        {
            "id": "man-em-teste",
            "tipo": "creche",
            "subtipo": "escola_municipal",
            "nome": "Escola do catálogo",
            "lat": -22.385,
            "lon": -47.585,
        },
    ]
    escolas = [{
        "id": "man-em-teste",
        "nome": "Escola consolidada",
        "localizacao_mapa": {
            "latitude": -22.394,
            "longitude": -47.596,
            "metodo": "centroide_cep",
            "precisao": "aproximada",
            "fonte": "CNEFE",
            "raio_m": 500,
        },
    }]

    resultado = at.analisar(geo(), catalogo, {}, escolas=escolas)
    cobertura = resultado["meta"]["cobertura_dos_servicos"]["escola"]

    # A coordenada consolidada deve prevalecer sobre a cópia do catálogo.
    assert cobertura["com_coordenada"] == 1
    assert cobertura["cadastrados"] == 1
    assert cobertura["localizacao_por_metodo"] == {"centroide_cep": 1}
    assert cobertura["precisao"] == {"aproximada": 1}
    assert cobertura["com_raio_informado"] == 1
    assert cobertura["raio_m"] == {"quantidade": 1, "minimo": 500.0, "mediana": 500.0, "maximo": 500.0}
    assert cobertura["sem_localizacao_mapa"] == 0

    # A escola aparece uma única vez na contagem de serviços do bairro.
    assert sum(b["servicos_no_bairro"] for b in resultado["bairros"]) == 2


def test_escola_sem_localizacao_na_base_consolidada_nao_usa_catalogo_antigo():
    catalogo = [{
        "id": "man-em-sem-localizacao",
        "tipo": "creche",
        "subtipo": "escola_municipal",
        "nome": "Escola sem localização consolidada",
        "lat": -22.395,
        "lon": -47.595,
    }]
    escolas = [{
        "id": "man-em-sem-localizacao",
        "nome": "Escola sem localização consolidada",
        "localizacao_mapa": None,
    }]

    with pytest.raises(ValueError):
        at.analisar(geo(), catalogo, {}, escolas=escolas)


def test_base_real_tem_33_coordenadas_individuais_e_35_por_cep_sem_duplicidade():
    import json

    caminho = at.DADOS / "escolas_municipais.json"
    if not caminho.exists():
        pytest.skip("base escolar consolidada não disponível neste ambiente")
    escolas = json.loads(caminho.read_text(encoding="utf-8"))["escolas"]
    assert len(escolas) == 68
    assert len({e["id"] for e in escolas}) == 68

    resultado = at.analisar(
        geo(),
        [cras("man-cras-a", -22.395, -47.595)],
        {},
        escolas=escolas,
    )
    cobertura = resultado["meta"]["cobertura_dos_servicos"]["escola"]
    assert cobertura["cadastrados"] == 68
    assert cobertura["com_coordenada"] == 68
    assert cobertura["localizacao_por_metodo"] == {
        "coordenada_individual": 33,
        "centroide_cep": 35,
    }
    assert cobertura["precisao"] == {
        "individual": 33,
        "aproximada": 35,
    }
    assert cobertura["sem_localizacao_mapa"] == 0
    assert cobertura["raio_m"]["quantidade"] == 35
    # 1 CRAS + 68 escolas: a escola não pode ser contada duas vezes pelo catálogo.
    assert sum(b["servicos_no_bairro"] for b in resultado["bairros"]) <= 69
