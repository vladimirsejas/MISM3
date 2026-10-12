"""Testes do indice territorial com dados sinteticos."""
import json

import pytest

import cobertura as cb


def setores():
    return [
        {"setor": "354390705000001", "bairro": "Centro", "pessoas": 1000, "lat": -22.40, "lon": -47.56},
        {"setor": "354390705000002", "bairro": "Centro", "pessoas": 3000, "lat": -22.41, "lon": -47.57},
        {"setor": "354390705000003", "bairro": "Ajapi", "pessoas": 500, "lat": -22.25, "lon": -47.82},
    ]


def catalogo():
    return [
        {"id": "man-cras-1", "tipo": "assistencia", "subtipo": "cras", "cep": "13500000"},
        {"id": "man-ubs-1", "tipo": "saude", "subtipo": "ubs", "lat": -22.401, "lon": -47.561},
        {"id": "man-escola-1", "tipo": "creche", "subtipo": "escola_municipal", "lat": -22.402, "lon": -47.562},
        {"id": "cnes-ignorar", "tipo": "assistencia", "subtipo": "cras", "lat": -22.4, "lon": -47.56},
    ]


def test_descobre_colunas_ignorando_acento_e_caixa():
    assert cb.achar_coluna(["CD_SETOR", "População residente", "NM_BAIRRO"],
                           ["populacao", "pessoas"]) == "População residente"
    assert cb.achar_coluna(["COD_MUN", "Geometria"], ["CD_MUN", "codigo_municipio"]) is None


def test_calcula_distancias_indices_e_ponderacao():
    r = cb.calcular(setores(), catalogo(), {"13500000": [-22.400, -47.560, 150, "", 3]}, hoje="2026-10-12")
    assert r["meta"]["setores_total"] == 3
    assert r["meta"]["pessoas_total"] == 4500
    assert r["meta"]["servicos"]["cras"] == {"com_coordenada": 1, "cadastrados": 1}
    assert r["setores"][0]["indice_cras"] is not None
    assert 0 <= r["setores"][0]["ics"] <= 100
    assert r["bairros"][0]["bairro"] == "Ajapi"
    assert r["meta"]["gerado_em"] == "2026-10-12"
    assert "nao prova" in r["meta"]["aviso"]


def test_categoria_sem_coordenada_e_ausente_nao_zero():
    r = cb.calcular(setores(), [], {})
    assert all(s["distancia_cras_km"] is None for s in r["setores"])
    assert all(s["indice_cras"] is None and s["ics"] is None for s in r["setores"])


def test_ignora_catalogo_nao_manual():
    por, total = cb.servicos_com_coordenadas([{"id": "cnes-123", "tipo": "assistencia", "subtipo": "cras", "lat": -22.4, "lon": -47.56}], {})
    assert por["cras"] == []
    assert total["cras"] == 0


def test_le_geojson_descobrindo_colunas_e_filtrando_municipio(tmp_path):
    caminho = tmp_path / "setores.geojson"
    geom = {"type": "Polygon", "coordinates": [[[-47.6, -22.4], [-47.59, -22.4], [-47.59, -22.39], [-47.6, -22.39], [-47.6, -22.4]]]}
    obj = {"type": "FeatureCollection", "features": [
        {"type": "Feature", "properties": {"CD_SETOR": "354390705000001", "População": 125, "NM_BAIRRO": "Centro"}, "geometry": geom},
        {"type": "Feature", "properties": {"CD_SETOR": "330455705000001", "População": 999, "NM_BAIRRO": "Outro"}, "geometry": geom},
    ]}
    caminho.write_text(json.dumps(obj, ensure_ascii=False), encoding="utf-8")
    r = cb.ler_setores_geojson(caminho)
    assert len(r) == 1 and r[0]["pessoas"] == 125 and r[0]["bairro"] == "Centro"


def test_erro_explica_colunas_ausentes(tmp_path):
    caminho = tmp_path / "setores.geojson"
    geom = {"type": "Polygon", "coordinates": [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]}
    caminho.write_text(json.dumps({"features": [{"properties": {"CD_SETOR": "354390705000001"}, "geometry": geom}]}), encoding="utf-8")
    with pytest.raises(ValueError, match="populacao"):
        cb.ler_setores_geojson(caminho)
