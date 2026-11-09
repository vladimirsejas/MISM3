"""Obtém a malha municipal oficial do IBGE 2022 e extrai Rio Claro (SP)."""
from __future__ import annotations

import argparse
from datetime import date
from io import BytesIO
import json
from pathlib import Path
import tempfile
from urllib.request import Request, urlopen
from zipfile import ZipFile

import shapefile
from pyproj import Transformer
from shapely.geometry import shape
from shapely.ops import transform

RAIZ = Path(__file__).resolve().parents[1]
SAIDA = RAIZ / "dados" / "geografia" / "limite_municipal_2022.geojson"
URL = (
    "https://geoftp.ibge.gov.br/organizacao_do_territorio/"
    "malhas_territoriais/malhas_municipais/municipio_2022/"
    "UFs/SP/SP_Municipios_2022.zip"
)
CODIGO_IBGE = "3543907"
TRANSFORMAR = Transformer.from_crs("EPSG:4674", "EPSG:4326", always_xy=True).transform


def _codigo_municipio(registro: dict) -> str:
    for chave in ("CD_MUN", "CD_GEOCMU", "CD_MUNICIP", "CD_MUN_"):
        valor = registro.get(chave)
        if valor not in (None, ""):
            texto = str(valor).strip()
            if texto.endswith(".0"):
                texto = texto[:-2]
            return texto.zfill(7)
    return ""


def baixar(destino: Path = SAIDA) -> dict:
    """Baixa o ZIP oficial, extrai somente o polígono de Rio Claro e grava GeoJSON."""
    req = Request(URL, headers={"User-Agent": "MISM3-geodata-audit/1.0"})
    with urlopen(req, timeout=90) as resposta:
        pacote = resposta.read()
    with ZipFile(BytesIO(pacote)) as arquivo:
        nomes = arquivo.namelist()
        shp_nome = next(n for n in nomes if n.lower().endswith(".shp"))
        base = shp_nome[:-4]
        componentes = {
            ext: next(n for n in nomes if n.lower() == (base + ext).lower())
            for ext in (".shp", ".shx", ".dbf")
        }
        leitor = shapefile.Reader(
            shp=BytesIO(arquivo.read(componentes[".shp"])),
            shx=BytesIO(arquivo.read(componentes[".shx"])),
            dbf=BytesIO(arquivo.read(componentes[".dbf"])),
            encoding="utf-8",
        )
        campos = [campo[0] for campo in leitor.fields[1:]]
        selecionado = None
        for item in leitor.iterShapeRecords():
            registro = dict(zip(campos, item.record))
            codigo = _codigo_municipio(registro)
            nome = str(registro.get("NM_MUN") or registro.get("NM_MUNIC") or "").strip().casefold()
            uf = str(registro.get("SIGLA_UF") or registro.get("UF") or "SP").strip().upper()
            if codigo == CODIGO_IBGE or (nome == "rio claro" and uf == "SP"):
                geom = transform(TRANSFORMAR, shape(item.shape.__geo_interface__))
                props = {
                    "codigo_ibge": CODIGO_IBGE,
                    "municipio": "Rio Claro",
                    "uf": "SP",
                    "ano_malha": 2022,
                    "sistema_origem": "SIRGAS 2000 (EPSG:4674)",
                    "sistema_geojson": "WGS 84 (EPSG:4326)",
                    "area_atributo_ibge_km2": next(
                        (float(registro[k]) for k in ("AREA_KM2", "AREA_KM", "AREA") if registro.get(k) not in (None, "")),
                        None,
                    ),
                }
                selecionado = {"type": "Feature", "properties": props, "geometry": geom.__geo_interface__}
                break
    if selecionado is None:
        raise ValueError("O shapefile oficial não contém o município IBGE 3543907.")
    resultado = {
        "type": "FeatureCollection",
        "meta": {
            "fonte": "IBGE — Malha Municipal Digital 2022, UF São Paulo",
            "url": URL,
            "codigo_ibge": CODIGO_IBGE,
            "consultado_em": date.today().isoformat(),
            "uso": "Validação topológica da malha de setores censitários do Censo 2022; não é camada de atendimento ou endereço.",
        },
        "features": [selecionado],
    }
    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_text(json.dumps(resultado, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    return resultado


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--destino", type=Path, default=SAIDA)
    args = parser.parse_args(argv)
    resultado = baixar(args.destino)
    area = resultado["features"][0]["properties"]["area_atributo_ibge_km2"]
    print("Limite municipal IBGE 2022 gravado: %s; área de atributo: %s km²" % (args.destino, area))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
