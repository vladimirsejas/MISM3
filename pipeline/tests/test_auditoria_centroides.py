import sys
from pathlib import Path

PIPELINE = Path(__file__).resolve().parents[1]
if str(PIPELINE) not in sys.path:
    sys.path.insert(0, str(PIPELINE))

import auditoria_centroides as ac


def quadrado():
    return {"type": "Polygon", "coordinates": [[[0, 0], [4, 0], [4, 4], [0, 4], [0, 0]]]}


def quadrado_com_buraco():
    return {"type": "Polygon", "coordinates": [
        [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]],
        [[4, 4], [6, 4], [6, 6], [4, 6], [4, 4]],
    ]}


def test_ponto_interno_preserva_centroide_quando_ele_ja_esta_dentro():
    geom = quadrado()
    lat, lon = ac.ponto_interno(geom)
    assert ac._contem(geom, lon, lat)
    assert (lat, lon) == ac._centro_atual(geom)


def test_ponto_interno_nao_cai_no_buraco():
    geom = quadrado_com_buraco()
    lat, lon = ac.ponto_interno(geom)
    assert ac._contem(geom, lon, lat)


def test_ponto_interno_considera_componente_de_multipoligono():
    geom = {"type": "MultiPolygon", "coordinates": [
        quadrado()["coordinates"],
        [[[10, 0], [20, 0], [20, 5], [10, 5], [10, 0]]],
    ]}
    lat, lon = ac.ponto_interno(geom)
    assert ac._contem(geom, lon, lat)


def test_comparacao_calcula_variacao_de_distancia_sem_mudar_dado_de_entrada():
    geo = {"type": "FeatureCollection", "features": [{
        "type": "Feature", "properties": {"setor": "1", "pessoas": 10}, "geometry": quadrado()
    }]}
    indicadores = {"equipamentos": [
        {"categoria": "ubs", "precisao": "catalogo", "lat": 1.0, "lon": 5.0},
    ]}
    original = repr(geo)
    resultado = ac.comparar(geo, indicadores)
    assert resultado["meta"]["setores_auditados"] == 1
    assert resultado["setores"][0]["distancias"]["coordenadas_do_catalogo"]["ubs"]["delta_km"] is not None
    assert repr(geo) == original


def test_geometria_sem_ponto_interno_falha_explicitamente():
    geom = {"type": "Polygon", "coordinates": [[[0, 0], [1, 1], [2, 2], [0, 0]]]}
    try:
        ac.ponto_interno(geom)
    except ValueError as exc:
        assert "ponto interno" in str(exc)
    else:
        raise AssertionError("esperava falha para geometria degenerada")


def test_malha_real_audita_408_setores_e_identifica_nove_centroides_externos():
    import json

    raiz = Path(__file__).resolve().parents[2]
    geo = json.loads((raiz / "web/dados/setores.geojson").read_text(encoding="utf-8"))
    indicadores = json.loads((raiz / "web/dados/indicadores_territoriais.json").read_text(encoding="utf-8"))
    resultado = ac.comparar(geo, indicadores)

    assert resultado["meta"]["setores_auditados"] == 408
    assert resultado["meta"]["centroides_atualmente_fora"] == 9
    assert set(resultado["meta"]["codigos_centroides_fora"]) == {
        "354390705000026",
        "354390705000165",
        "354390705000339",
        "354390705000432",
        "354390705000460",
        "354390705000524",
        "354390705000529",
        "354390705000530",
        "354390705000541",
    }
    assert all(s["ponto_interno_alternativo"]["metodo"] == ac.METODO_ALTERNATIVO
               for s in resultado["setores"])
    assert resultado["resumo"]["distancias"]["coordenadas_do_catalogo"]["ubs"]["setores_com_distancia"] == 408
