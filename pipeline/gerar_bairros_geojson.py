"""Gera limites de bairros para o mapa do MISM3.

Usa os centros dos bairros calculados a partir do CSV local de CEPs geocodificados.
Quando há polígono de bairro no OpenStreetMap, usa-o; nos demais casos cria uma
divisão de Voronoi APROXIMADA. Polígonos aproximados não são limites administrativos.
"""
from __future__ import annotations

import csv
import json
import sys
import time
import unicodedata
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen

import numpy as np
from scipy.spatial import Voronoi
from shapely.geometry import Polygon, mapping, shape
from shapely.ops import linemerge, polygonize, unary_union

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import erro  # noqa: E402

RAIZ = Path(__file__).resolve().parent.parent
CSV_CEPS = RAIZ / "dados" / "bruto" / "ceps_google" / "resumido3_com_coordenadas_google.csv"
SAIDA_BAIRROS = RAIZ / "web" / "dados" / "bairros_rio_claro.geojson"
SAIDA_MUNICIPIO = RAIZ / "web" / "dados" / "municipio_rio_claro.geojson"
CODIGO_IBGE = "3543907"
USER_AGENT = "MISM3/1.0 (projeto academico; dados publicos)"
OVERPASS = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter"]
CAIXA = (-22.65, -22.15, -47.80, -47.30)  # triagem, não limite oficial


def chave(texto):
    texto = unicodedata.normalize("NFD", str(texto or ""))
    texto = "".join(c for c in texto if unicodedata.category(c) != "Mn")
    return "".join(c for c in texto.casefold() if c.isalnum())


def baixar_json(url, dados=None):
    ultimo = None
    for tentativa in range(3):
        try:
            req = Request(url, data=dados, headers={"User-Agent": USER_AGENT})
            with urlopen(req, timeout=180) as resposta:
                return json.load(resposta)
        except Exception as exc:
            ultimo = exc
            time.sleep(2 * (tentativa + 1))
    raise RuntimeError(f"Falha ao consultar fonte geográfica: {ultimo}")


def carregar_centros():
    if not CSV_CEPS.is_file():
        raise FileNotFoundError(f"CSV não encontrado: {CSV_CEPS}")
    por_bairro = {}
    with CSV_CEPS.open("r", encoding="utf-8-sig", newline="") as f:
        leitor = csv.DictReader(f, delimiter=";")
        for r in leitor:
            bairro = (r.get("Bairro") or "").strip()
            try:
                lat, lon = float(r["Latitude"]), float(r["Longitude"])
            except (KeyError, TypeError, ValueError):
                continue
            lat_min, lat_max, lon_min, lon_max = CAIXA
            if not bairro or not (lat_min <= lat <= lat_max and lon_min <= lon <= lon_max):
                continue
            por_bairro.setdefault(bairro, []).append((lon, lat))
    centros = {}
    for bairro, pontos in por_bairro.items():
        centros[bairro] = (float(np.median([p[0] for p in pontos])), float(np.median([p[1] for p in pontos])))
    if not centros:
        raise ValueError("Nenhum centro de bairro com coordenadas válidas.")
    return centros


def obter_municipio():
    url = (f"https://servicodados.ibge.gov.br/api/v3/malhas/municipios/{CODIGO_IBGE}"
           "?formato=application/vnd.geo+json&qualidade=maxima")
    dados = baixar_json(url)
    if not dados.get("features"):
        raise ValueError("IBGE não retornou o limite de Rio Claro.")
    geom = shape(dados["features"][0]["geometry"])
    if geom.is_empty:
        raise ValueError("Limite municipal do IBGE vazio.")
    return geom, dados


def poligono_elemento(el):
    if el.get("type") == "way":
        pts = [(p["lon"], p["lat"]) for p in el.get("geometry", [])]
        if len(pts) >= 4 and pts[0] == pts[-1]:
            return Polygon(pts)
        return None
    linhas = []
    for membro in el.get("members", []):
        if membro.get("role") == "outer" and membro.get("geometry"):
            linhas.append([(p["lon"], p["lat"]) for p in membro["geometry"]])
    if not linhas:
        return None
    try:
        unidos = linemerge(linhas)
        poligonos = list(polygonize(unidos))
        return unary_union(poligonos) if poligonos else None
    except Exception:
        return None


def baixar_bairros_osm(limite):
    oeste, sul, leste, norte = limite.bounds
    caixa = f"({sul},{oeste},{norte},{leste})"
    consulta = f'''[out:json][timeout:120];(
      way["place"~"^(suburb|neighbourhood|quarter)$"]{caixa};
      relation["place"~"^(suburb|neighbourhood|quarter)$"]{caixa};
      relation["boundary"="administrative"]["admin_level"~"^(9|10)$"]{caixa};
    );out geom;'''
    corpo = urlencode({"data": consulta}).encode()
    dados = None
    for servidor in OVERPASS:
        try:
            dados = baixar_json(servidor, corpo)
            break
        except Exception as exc:
            print("Aviso: Overpass indisponível:", exc)
    if dados is None:
        return {}
    resultado = {}
    for el in dados.get("elements", []):
        nome = el.get("tags", {}).get("name")
        geom = poligono_elemento(el)
        if not nome or geom is None or geom.is_empty:
            continue
        try:
            geom = geom.buffer(0).intersection(limite)
        except Exception:
            continue
        if geom.is_empty:
            continue
        k = chave(nome)
        resultado[k] = unary_union([resultado[k], geom]) if k in resultado else geom
    return resultado


def voronoi_finito(pontos, limite):
    nomes = list(pontos)
    if len(nomes) < 2:
        return {nomes[0]: limite} if nomes else {}
    coords = np.array([pontos[n] for n in nomes], dtype=float)
    oeste, sul, leste, norte = limite.bounds
    w, h = leste - oeste, norte - sul
    extras = np.array([[oeste-10*w,sul-10*h],[leste+10*w,sul-10*h],
                       [oeste-10*w,norte+10*h],[leste+10*w,norte+10*h]])
    try:
        vor = Voronoi(np.vstack([coords, extras]))
    except Exception as exc:
        raise ValueError(f"Não foi possível calcular as áreas aproximadas: {exc}")
    saida = {}
    for i, nome in enumerate(nomes):
        regiao = vor.regions[vor.point_region[i]]
        if not regiao or -1 in regiao:
            continue
        geom = Polygon(vor.vertices[regiao]).buffer(0).intersection(limite)
        if not geom.is_empty:
            saida[nome] = geom
    return saida


def salvar(caminho, dados):
    caminho.parent.mkdir(parents=True, exist_ok=True)
    caminho.write_text(json.dumps(dados, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")


def main():
    centros = carregar_centros()
    limite, municipio = obter_municipio()
    salvar(SAIDA_MUNICIPIO, municipio)
    osm = baixar_bairros_osm(limite)
    ocupados, sem_osm = [], {}
    features = []
    for nome, ponto in centros.items():
        geom = osm.get(chave(nome))
        if geom is not None:
            ocupados.append(geom)
            features.append({"type":"Feature","properties":{"bairro":nome,"fonte_limite":"OpenStreetMap"},
                             "geometry":mapping(geom)})
        else:
            sem_osm[nome] = ponto
    area_livre = limite.difference(unary_union(ocupados)) if ocupados else limite
    for nome, geom in voronoi_finito(sem_osm, area_livre).items():
        features.append({"type":"Feature","properties":{"bairro":nome,
            "fonte_limite":"Aproximado (Voronoi a partir de pontos de CEP; não oficial)"},
            "geometry":mapping(geom)})
    salvar(SAIDA_BAIRROS, {"type":"FeatureCollection","features":features})
    oficiais = sum(f["properties"]["fonte_limite"] == "OpenStreetMap" for f in features)
    print(f"Gerados {len(features)} bairros: {oficiais} com polígono OSM e {len(features)-oficiais} aproximados.")
    print("Áreas aproximadas não devem ser tratadas como limites oficiais.")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        erro(str(exc))
