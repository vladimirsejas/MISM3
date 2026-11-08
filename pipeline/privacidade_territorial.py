"""Regras centrais de privacidade para a publicação de indicadores territoriais.

A validação é fail-closed: se população ou domicílios estiverem ausentes ou inválidos,
não há base para provar que o setor atende aos critérios de publicação.
"""

LIMITE_PESSOAS = 5
LIMITE_DOMICILIOS = 3
CAMPOS_DERIVADOS_SENSIVEIS = (
    "densidade",
    "pessoas_por_domicilio",
    "p",
    "d",
    "dist_creche",
    "distancia_km",
    "distancia_min_km",
    "distancia_max_km",
)


def setor_suprimido(propriedades: dict) -> bool:
    """Retorna True quando contagens ou derivados do setor devem ser omitidos."""
    if propriedades.get("suprimido_privacidade") is True:
        return True
    pessoas = propriedades.get("pessoas")
    domicilios = propriedades.get("domicilios")
    if pessoas is None or domicilios is None:
        return True
    try:
        pessoas = int(pessoas)
        domicilios = int(domicilios)
    except (TypeError, ValueError, OverflowError):
        return True
    return pessoas < LIMITE_PESSOAS or domicilios < LIMITE_DOMICILIOS


def sanitizar_geojson(geojson: dict) -> dict:
    """Remove contagens e indicadores derivados dos setores pequenos antes da publicação."""
    for feature in geojson.get("features", []):
        propriedades = feature.setdefault("properties", {})
        if setor_suprimido(propriedades):
            propriedades["pessoas"] = None
            propriedades["domicilios"] = None
            propriedades["suprimido_privacidade"] = True
            for campo in CAMPOS_DERIVADOS_SENSIVEIS:
                if campo in propriedades:
                    propriedades[campo] = None
    return geojson
