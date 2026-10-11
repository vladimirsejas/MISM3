"""Passo 3 - constroi o indice CEP -> area aproximada, a partir do CNEFE 2022 (IBGE).

Por que isso existe: a base dos Correios (DNE) e paga. O CNEFE do IBGE e gratuito e traz,
para cada endereco do Censo 2022, o CEP e a coordenada. Agrupando por CEP obtemos o
ponto central de cada CEP e um raio de incerteza. O site usa esse indice no proprio
navegador: o CEP digitado pela mulher nunca e enviado a nenhum servidor.

Privacidade: o arquivo gerado NAO contem nenhum endereco, numero ou nome de rua.
So: CEP -> (lat, lon, raio em metros, setor censitario, quantidade de enderecos).
Coordenadas arredondadas e raio minimo evitam apontar uma casa especifica.

Uso:
    python pipeline/indice_cep.py
Saida: web/dados/cep_indice.json
"""
from __future__ import annotations

import sys
import zipfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import (BRUTO, MUNICIPIO_IBGE7, MUNICIPIO_NOME, UF, WEB_DADOS, achar_coluna, agora_iso, erro,  # noqa: E402
                    haversine_m, ler_csv_flex, normalizar_cep, para_numero, salvar_json)

RAIO_MIN_M = 150
RAIO_MIN_POUCOS_M = 300  # CEPs com poucos enderecos: borra mais
RAIO_MAX_M = 1500
POUCOS = 5


def construir_indice(df, municipio: str = MUNICIPIO_IBGE7) -> dict:
    """Recebe o DataFrame do CNEFE (texto) e devolve {cep: [lat, lon, raio_m, setor, n]}."""
    import numpy as np
    import pandas as pd

    c_cep = achar_coluna(df.columns, "CEP")
    c_lat = achar_coluna(df.columns, "LATITUDE")
    c_lon = achar_coluna(df.columns, "LONGITUDE")
    c_set = achar_coluna(df.columns, "COD_SETOR")
    c_mun = achar_coluna(df.columns, "COD_MUNICIPIO")
    faltando = [n for n, c in (("CEP", c_cep), ("LATITUDE", c_lat), ("LONGITUDE", c_lon)) if c is None]
    if faltando:
        raise ValueError("Colunas ausentes no CNEFE: %s. Colunas encontradas: %s" % (faltando, list(df.columns)[:40]))

    if c_mun is not None:
        df = df[df[c_mun].astype(str).str.strip().str[:7] == municipio]
    if df.empty:
        raise ValueError("Nenhum endereco do municipio %s no arquivo (confira se baixou o municipio certo)." % municipio)

    trab = pd.DataFrame({
        "cep": df[c_cep].map(normalizar_cep),
        "lat": para_numero(df[c_lat]),
        "lon": para_numero(df[c_lon]),
        "setor": df[c_set].astype(str).str.strip() if c_set else "",
    })
    trab = trab.dropna(subset=["cep", "lat", "lon"])
    trab = trab[trab["lat"].between(-34, 6) & trab["lon"].between(-74, -28)]  # dentro do Brasil
    if trab.empty:
        raise ValueError("Nenhum endereco com CEP e coordenada validos.")

    med = trab.groupby("cep").agg(lat_c=("lat", "median"), lon_c=("lon", "median"), n=("lat", "size"))
    trab = trab.join(med, on="cep")
    trab["d"] = haversine_m(trab["lat"].to_numpy(), trab["lon"].to_numpy(), trab["lat_c"].to_numpy(), trab["lon_c"].to_numpy())
    p90 = trab.groupby("cep")["d"].quantile(0.9)
    setor = trab.groupby("cep")["setor"].agg(lambda s: s.mode().iloc[0] if len(s.mode()) else "")

    indice: dict[str, list] = {}
    for cep, linha in med.iterrows():
        n = int(linha["n"])
        piso = RAIO_MIN_POUCOS_M if n < POUCOS else RAIO_MIN_M
        raio = int(np.clip(round(float(p90[cep]), -1), piso, RAIO_MAX_M))
        casas = 3 if n < POUCOS else 4
        indice[cep] = [round(float(linha["lat_c"]), casas), round(float(linha["lon_c"]), casas), raio, setor[cep], n]
    return indice


def ler_cnefe() -> "pd.DataFrame":  # noqa: F821
    pasta = BRUTO / "cnefe"
    zips = sorted(pasta.glob("*.zip"))
    csvs = sorted(pasta.glob("*.csv"))
    if zips:
        with zipfile.ZipFile(zips[0]) as z:
            nomes = [n for n in z.namelist() if n.lower().endswith(".csv")]
            if not nomes:
                erro("O zip %s nao tem CSV dentro." % zips[0])
            with z.open(nomes[0]) as f:
                return ler_csv_flex(f.read())
    if csvs:
        return ler_csv_flex(csvs[0])
    erro("CNEFE nao encontrado em %s. Rode antes: python pipeline/baixar.py cnefe" % pasta)


def main() -> None:
    print("Lendo CNEFE...")
    df = ler_cnefe()
    print("  %d linhas lidas" % len(df))
    try:
        indice = construir_indice(df)
    except ValueError as e:
        erro(str(e))
    saida = {
        "meta": {
            "fonte": "IBGE - Cadastro Nacional de Enderecos para Fins Estatisticos (CNEFE), Censo Demografico 2022",
            "municipio": "%s/%s (IBGE %s)" % (MUNICIPIO_NOME, UF, MUNICIPIO_IBGE7),
            "gerado_em": agora_iso(),
            "formato": "cep -> [latitude, longitude, raio_m, setor_censitario, n_enderecos]",
        },
        "ceps": indice,
    }
    salvar_json(saida, WEB_DADOS / "cep_indice.json")
    pequenos = sum(1 for v in indice.values() if v[4] < POUCOS)
    print("  %d CEPs indexados (%d com menos de %d enderecos, com area borrada)." % (len(indice), pequenos, POUCOS))
    print("Proximo passo: python pipeline/servicos.py")


if __name__ == "__main__":
    main()
