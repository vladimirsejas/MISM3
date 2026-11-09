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

import json
import re
import sys
import zipfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from ceps_lista import CAMINHO_PADRAO as CAMINHO_LISTA_CEPS, ler_lista_ceps  # noqa: E402
from common import (BRUTO, DADOS as DADOS_RAIZ, MUNICIPIO_IBGE7, MUNICIPIO_NOME, UF, WEB_DADOS, achar_coluna, agora_iso, erro,  # noqa: E402
                    haversine_m, ler_csv_flex, normalizar_cep, para_numero, salvar_json)
from privacidade_territorial import setor_suprimido  # noqa: E402

DADOS_PARQUET = DADOS_RAIZ / "parquet"

RAIO_MIN_M = 150
RAIO_MIN_POUCOS_M = 300  # CEPs com poucos enderecos: borra mais
RAIO_MAX_M = 1500
POUCOS = 5
RAIO_LISTA_M = 500  # CEP que só existe na lista de CEPs: um único ponto, então a área é larga


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


def completar_com_lista(indice: dict, lista: list[dict], raio_m: int = RAIO_LISTA_M) -> dict:
    """Acrescenta ao índice os CEPs que o CNEFE não cobre, usando o ponto da lista de CEPs (ceps_lista.py).

    Nunca troca um CEP que já veio do CNEFE (ele tem endereços reais por trás). O CEP novo entra com n = 0 (nenhum endereço do IBGE),
    setor vazio e raio largo, porque é um ponto só. Não grava rua nem bairro: o arquivo continua sem endereços. Devolve só os CEPs novos.
    """
    por_cep: dict[str, list[dict]] = {}
    for r in lista:
        if r["cep"] not in indice:
            por_cep.setdefault(r["cep"], []).append(r)
    novos = {}
    for cep, linhas in por_cep.items():
        lat = sum(r["lat"] for r in linhas) / len(linhas)
        lon = sum(r["lon"] for r in linhas) / len(linhas)
        novos[cep] = [round(lat, 3), round(lon, 3), raio_m, "", 0]
    indice.update(novos)
    return novos


def id_do_setor(valor) -> str:
    """Código do setor só com os dígitos iniciais.

    O índice do CNEFE grava o setor com sufixo de letra (por exemplo "354390705000201P"), e o GeoJSON do IBGE grava só os dígitos;
    comparar as duas formas sem normalizar nunca casa e deixaria passar os CEPs dos setores protegidos."""
    s = str(valor or "").strip()
    m = re.match(r"(\d+)[A-Za-z]*$", s)
    return m.group(1) if m else s


def filtrar_ceps_de_setores_suprimidos(indice: dict, geojson: dict) -> tuple[dict, int]:
    """Remove do índice público qualquer CEP associado a setor protegido pela decisão D4."""
    protegidos = {
        id_do_setor(f.get("properties", {}).get("setor"))
        for f in geojson.get("features", [])
        if setor_suprimido(f.get("properties", {}))
    }
    protegidos.discard("")
    filtrado = {
        cep: valor for cep, valor in indice.items()
        if len(valor) < 4 or not valor[3] or id_do_setor(valor[3]) not in protegidos
    }
    return filtrado, len(indice) - len(filtrado)


def sanear_indice_publicado(caminho_indice: Path, caminho_geojson: Path) -> int:
    """Aplica a decisão D4 ao índice JÁ publicado (sem reler o CNEFE) e atualiza os metadados. Devolve quantos CEPs saíram."""
    dados = json.loads(caminho_indice.read_text(encoding="utf-8"))
    geojson = json.loads(caminho_geojson.read_text(encoding="utf-8"))
    ceps, removidos = filtrar_ceps_de_setores_suprimidos(dados["ceps"], geojson)
    if removidos:
        dados["ceps"] = ceps
        meta = dados.setdefault("meta", {})
        meta["ceps_de_setores_suprimidos_omitidos"] = meta.get("ceps_de_setores_suprimidos_omitidos", 0) + removidos
        # mantém o formato legível do arquivo publicado (indent=1 e quebra final) para o diff mostrar só os CEPs removidos
        caminho_indice.write_text(json.dumps(dados, ensure_ascii=False, indent=1) + "\n", encoding="utf-8", newline="\n")
    return removidos


def ler_cnefe() -> "pd.DataFrame":  # noqa: F821
    pasta = BRUTO / "cnefe"
    parquets = [
        DADOS_PARQUET / "mapa_nacional" / "Agregados_por_CEP_CNEFE_Censo_2022.parquet",
        pasta / "Agregados_por_CEP_CNEFE_Censo_2022.parquet",
    ]
    for caminho in parquets:
        if caminho.exists():
            import pandas as pd
            # A tabela nacional agregada é pequena em disco; mantém as colunas originais
            # para que construir_indice valide os nomes e não invente equivalências.
            return pd.read_parquet(caminho).astype("string")

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
    erro("CNEFE nao encontrado em %s nem em dados/parquet/mapa_nacional. Rode antes: python pipeline/baixar.py cnefe" % pasta)


def main() -> None:
    import argparse
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--ceps-google", type=Path, default=CAMINHO_LISTA_CEPS,
                    help="lista de CEPs com coordenada; completa os CEPs que o CNEFE não cobre")
    ap.add_argument("--sanear-publicado", action="store_true",
                    help="só aplica a decisão D4 ao web/dados/cep_indice.json já publicado, sem ler o CNEFE")
    a = ap.parse_args()
    if a.sanear_publicado:
        n = sanear_indice_publicado(WEB_DADOS / "cep_indice.json", WEB_DADOS / "setores.geojson")
        print("  %d CEPs de setores protegidos foram removidos do índice publicado." % n)
        return
    print("Lendo CNEFE...")
    df = ler_cnefe()
    print("  %d linhas lidas" % len(df))
    try:
        indice = construir_indice(df)
    except ValueError as e:
        erro(str(e))
    lista = ler_lista_ceps(a.ceps_google)
    novos = completar_com_lista(indice, lista) if lista else {}
    geo_path = WEB_DADOS / "setores.geojson"
    if not geo_path.exists():
        erro("Gere primeiro web/dados/setores.geojson; o índice CEP precisa respeitar a supressão D4.")
    geojson = json.loads(geo_path.read_text(encoding="utf-8"))
    indice, ceps_suprimidos = filtrar_ceps_de_setores_suprimidos(indice, geojson)
    if lista:
        print("  %d CEPs a mais vieram da lista de CEPs (o CNEFE não os cobre)." % len(novos))
    else:
        print("  AVISO: sem lista de CEPs em %s; só o CNEFE foi usado." % a.ceps_google)
    saida = {
        "meta": {
            "fonte": "IBGE - Cadastro Nacional de Enderecos para Fins Estatisticos (CNEFE), Censo Demografico 2022",
            "municipio": "%s/%s (IBGE %s)" % (MUNICIPIO_NOME, UF, MUNICIPIO_IBGE7),
            "gerado_em": agora_iso(),
            "formato": "cep -> [latitude, longitude, raio_m, setor_censitario, n_enderecos]",
            "ceps_so_da_lista": sorted(novos),
            "observacao_lista": "CEPs em 'ceps_so_da_lista' vêm de um ponto único da lista de CEPs (n_enderecos = 0, setor vazio, raio %d m)." % RAIO_LISTA_M,
            "ceps_de_setores_suprimidos_omitidos": ceps_suprimidos,
            "observacao_privacidade": "CEPs associados a setores protegidos pela decisão D4 não são publicados no índice.",
        },
        "ceps": indice,
    }
    salvar_json(saida, WEB_DADOS / "cep_indice.json")
    pequenos = sum(1 for v in indice.values() if v[4] < POUCOS)
    print("  %d CEPs indexados; %d associados a setores protegidos foram omitidos." % (len(indice), ceps_suprimidos))
    print("  %d CEPs com menos de %d endereços permanecem com área borrada." % (pequenos, POUCOS))
    print("Proximo passo: python pipeline/servicos.py")


if __name__ == "__main__":
    main()
