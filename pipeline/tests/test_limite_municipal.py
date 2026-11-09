import json
from pathlib import Path

from shapely.geometry import shape

RAIZ = Path(__file__).resolve().parents[2]
ARQUIVO = RAIZ / "dados" / "geografia" / "limite_municipal_2022.geojson"


def test_limite_municipal_e_da_edicao_2022_do_ibge():
    dados = json.loads(ARQUIVO.read_text(encoding="utf-8"))
    assert dados["meta"]["codigo_ibge"] == "3543907"
    assert "geoftp.ibge.gov.br" in dados["meta"]["url"]
    assert len(dados["features"]) == 1
    feature = dados["features"][0]
    assert feature["properties"]["codigo_ibge"] == "3543907"
    assert feature["properties"]["municipio"] == "Rio Claro"
    assert feature["properties"]["ano_malha"] == 2022
    geometria = shape(feature["geometry"])
    assert geometria.geom_type in {"Polygon", "MultiPolygon"}
    assert geometria.is_valid and geometria.area > 0
