"""Regras centrais de privacidade para a publicação de indicadores territoriais.

A validação é fail-closed: se população ou domicílios estiverem ausentes ou inválidos,
não há base para provar que o setor atende aos critérios de publicação.
"""

import math

LIMITE_PESSOAS = 5
LIMITE_DOMICILIOS = 3
CAMPOS_DERIVADOS_SENSIVEIS = (
    "densidade",
    "pessoas_por_domicilio",
    "p",
    "d",
    "dist_cras",
    "dist_ubs",
    "dist_creche",
    "dist_escola",
    "distancia_km",
    "distancia_min_km",
    "distancia_max_km",
)


def _contagem_inteira_valida(valor) -> int | None:
    """Converte contagem não negativa e inteira; fração, NaN, infinito e booleano são inválidos."""
    if isinstance(valor, bool) or valor is None:
        return None
    try:
        numero = float(valor)
    except (TypeError, ValueError, OverflowError):
        return None
    if not math.isfinite(numero) or numero < 0 or not numero.is_integer():
        return None
    return int(numero)


def setor_suprimido(propriedades: dict) -> bool:
    """Retorna True quando contagens ou derivados do setor devem ser omitidos."""
    if propriedades.get("suprimido_privacidade") is True:
        return True
    pessoas = _contagem_inteira_valida(propriedades.get("pessoas"))
    domicilios = _contagem_inteira_valida(propriedades.get("domicilios"))
    if pessoas is None or domicilios is None:
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
            for campo in list(propriedades):
                if campo in CAMPOS_DERIVADOS_SENSIVEIS or campo.startswith("dist_") or campo.startswith("distancia_"):
                    propriedades[campo] = None
    return geojson
