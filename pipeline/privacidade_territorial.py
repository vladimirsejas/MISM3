"""Regras de privacidade para a publicação de indicadores por setor censitário."""

LIMITE_PESSOAS = 5
LIMITE_DOMICILIOS = 3


def setor_suprimido(propriedades: dict) -> bool:
    """Retorna True quando o setor deve ter contagens e derivados omitidos."""
    if propriedades.get("suprimido_privacidade") is True:
        return True
    pessoas = propriedades.get("pessoas")
    domicilios = propriedades.get("domicilios")
    if pessoas is None or domicilios is None:
        return False
    return int(pessoas) < LIMITE_PESSOAS or int(domicilios) < LIMITE_DOMICILIOS


def sanitizar_geojson(geojson: dict) -> dict:
    """Remove contagens sensíveis dos setores pequenos antes de gravar o arquivo público."""
    for feature in geojson.get("features", []):
        propriedades = feature.setdefault("properties", {})
        if setor_suprimido(propriedades):
            propriedades["pessoas"] = None
            propriedades["domicilios"] = None
            propriedades["suprimido_privacidade"] = True
    return geojson
