"""Lê a lista de CEPs de Rio Claro com rua, bairro e coordenada (dados/bruto/ceps_google/*.csv).

A lista tem uma linha por CEP: CEP;Logradouro;Bairro;Municipio;UF;Endereco_Completo;Latitude;Longitude. Ela serve a duas coisas:
  1. descobrir o CEP de uma rua quando o catálogo só traz "rua e número" (geocodificar_catalogo.py);
  2. dar o centro de CEPs que o CNEFE não cobre (indice_cep.py).

O arquivo bruto fica só no computador de quem usa (dados/bruto/ está no .gitignore). Só entram no Git resultados: o CEP escolhido
para um serviço e o centro aproximado de um CEP, sem nome de rua.
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import BRUTO, achar_coluna, ler_csv_flex, normalizar_cep, para_numero  # noqa: E402

CAMINHO_PADRAO = BRUTO / "ceps_google" / "resumido3_com_coordenadas_google.csv"
CAIXA_RIO_CLARO = (-22.60, -22.20, -47.82, -47.41)  # lat_min, lat_max, lon_min, lon_max


def ler_lista_ceps(caminho: Path | None = None) -> list[dict]:
    """[{cep, logradouro, bairro, lat, lon}] só de Rio Claro/SP e só com coordenada dentro de Rio Claro. [] se o arquivo não existe."""
    caminho = caminho or CAMINHO_PADRAO
    if not caminho.exists():
        return []
    df = ler_csv_flex(caminho)
    c = {n: achar_coluna(df.columns, n) for n in ("CEP", "Logradouro", "Bairro", "Municipio", "UF", "Latitude", "Longitude")}
    faltando = [n for n in ("CEP", "Logradouro", "Latitude", "Longitude") if not c[n]]
    if faltando:
        raise ValueError("Lista de CEPs sem as colunas %s. Colunas: %s" % (faltando, list(df.columns)))
    if c["Municipio"]:
        df = df[df[c["Municipio"]].astype(str).str.strip().str.lower().str.replace("é", "e") == "rio claro"]
    if c["UF"]:
        df = df[df[c["UF"]].astype(str).str.strip().str.upper() == "SP"]
    lat, lon = para_numero(df[c["Latitude"]]), para_numero(df[c["Longitude"]])
    saida = []
    for (_, linha), la, lo in zip(df.iterrows(), lat, lon):
        cep = normalizar_cep(linha[c["CEP"]])
        if not cep or la != la or lo != lo:
            continue
        if not (CAIXA_RIO_CLARO[0] <= la <= CAIXA_RIO_CLARO[1] and CAIXA_RIO_CLARO[2] <= lo <= CAIXA_RIO_CLARO[3]):
            continue
        saida.append({"cep": cep, "logradouro": str(linha[c["Logradouro"]]).strip(),
                      "bairro": str(linha[c["Bairro"]]).strip() if c["Bairro"] else "", "lat": float(la), "lon": float(lo)})
    return saida
