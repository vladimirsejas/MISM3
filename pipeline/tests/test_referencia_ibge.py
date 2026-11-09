import json
import sys
from pathlib import Path

import pytest

from pyproj import Transformer
from shapely.geometry import shape
from shapely.ops import transform, unary_union
from shapely.strtree import STRtree

ROOT = Path(__file__).resolve().parents[2]
REF = ROOT / "dados" / "referencia_ibge" / "setores_rio_claro_original_ibge_2022.geojson"
PUBLICADO = ROOT / "web" / "dados" / "setores.geojson"
CASAS = 6
# Uma célula de quantização aproximada de 0,11 m × 0,11 m.
# O limiar é determinado pela resolução das coordenadas publicadas, não pelos resultados.
LIMIAR_CELULA_M2 = 0.0121


def arredondar(valor):
    if isinstance(valor, list):
        return [arredondar(item) for item in valor]
    if isinstance(valor, float):
        return round(valor, CASAS)
    return valor


def carregar():
    referencia = json.loads(REF.read_text(encoding="utf-8"))
    publicado = json.loads(PUBLICADO.read_text(encoding="utf-8"))
    return referencia, publicado


def test_publicado_corresponde_a_geometria_ibge_original_arredondada():
    referencia, publicado = carregar()
    ref = {str(f["properties"]["CD_SETOR"]): f for f in referencia["features"]}
    pub = {str(f["properties"]["setor"]): f for f in publicado["features"]}
    assert len(ref) == 408
    assert len(pub) == 408
    assert set(ref) == set(pub)
    for codigo, feature_ref in ref.items():
        props = feature_ref["properties"]
        assert not ({"v0001", "v0002", "v0003", "v0004", "v0005", "v0006", "v0007"} & set(props))
        geom_esperada = shape({
            "type": feature_ref["geometry"]["type"],
            "coordinates": arredondar(feature_ref["geometry"]["coordinates"]),
        })
        geom_publicada = shape(pub[codigo]["geometry"])
        assert geom_esperada.is_valid, codigo
        assert geom_publicada.is_valid, codigo
        assert geom_publicada.equals(geom_esperada), codigo


def test_cobertura_nao_tem_sobreposicoes_nem_buracos_internos():
    referencia, publicado = carregar()
    para_metros = Transformer.from_crs("EPSG:4674", "EPSG:31983", always_xy=True).transform
    geometrias = [transform(para_metros, shape(f["geometry"])) for f in publicado["features"]]
    assert len(geometrias) == 408
    assert all(g.is_valid and not g.is_empty for g in geometrias)
    arvore = STRtree(geometrias)
    sobreposicoes = []
    for i, geom in enumerate(geometrias):
        for j in arvore.query(geom):
            j = int(j)
            if j > i:
                area = geom.intersection(geometrias[j]).area
                if area > LIMIAR_CELULA_M2:
                    sobreposicoes.append((i, j, area))
    assert sobreposicoes == []
    uniao = unary_union(geometrias)
    partes = list(uniao.geoms) if uniao.geom_type == "MultiPolygon" else [uniao]
    area_buracos = sum(
        shape({"type": "Polygon", "coordinates": [list(anel.coords)]}).area
        for parte in partes for anel in parte.interiors
    )
    assert area_buracos <= LIMIAR_CELULA_M2


def test_centroides_matematicos_sao_reauditados_na_geometria_original():
    sys.path.insert(0, str(ROOT / "pipeline"))
    import auditoria_centroides

    referencia, _ = carregar()
    externos = []
    for feature in referencia["features"]:
        geom = {
            "type": feature["geometry"]["type"],
            "coordinates": arredondar(feature["geometry"]["coordinates"]),
        }
        lat, lon = auditoria_centroides._centro_atual(geom)
        if not auditoria_centroides._contem(geom, lon, lat):
            externos.append(str(feature["properties"]["CD_SETOR"]))
    assert externos == [
        "354390705000026", "354390705000165", "354390705000195",
        "354390705000339", "354390705000432", "354390705000460",
        "354390705000502", "354390705000524", "354390705000529",
        "354390705000530", "354390705000541",
    ]
