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
import math
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


def _registro_cep_valido(cep, valor) -> bool:
    """Valida o contrato público antes de qualquer decisão de divulgação."""
    if not re.fullmatch(r"\\d{8}", str(cep or "")):
        return False
    if not isinstance(valor, (list, tuple)) or len(valor) != 5:
        return False
    lat, lon, raio, setor, quantidade = valor
    if not isinstance(setor, str) or not setor.strip():
        return False
    if isinstance(quantidade, bool) or not isinstance(quantidade, (int, float)):
        return False
    if not math.isfinite(float(quantidade)) or quantidade < 0 or int(quantidade) != quantidade:
        return False
    for numero, minimo, maximo in ((lat, -90, 90), (lon, -180, 180), (raio, 0, float("inf"))):
        if isinstance(numero, bool) or not isinstance(numero, (int, float)) or not math.isfinite(float(numero)):
            return False
        if numero < minimo or numero > maximo:
            return False
    return True


def _setores_geojson(geojson: dict) -> tuple[set[str], set[str], dict[str, dict]]:
    """Retorna setores conhecidos, protegidos e geometrias; ausência de prova não libera publicação."""
    conhecidos, protegidos, geometrias = set(), set(), {}
    for feature in geojson.get("features", []):
        propriedades = feature.get("properties") or {}
        codigo = id_do_setor(propriedades.get("setor"))
        if not codigo:
            continue
        conhecidos.add(codigo)
        if setor_suprimido(propriedades):
            protegidos.add(codigo)
        geometria = feature.get("geometry")
        if geometria:
            geometrias[codigo] = geometria
    return conhecidos, protegidos, geometrias


def filtrar_ceps_de_setores_suprimidos(indice: dict, geojson: dict) -> tuple[dict, int]:
    """Mantém apenas CEPs com vínculo setorial verificável e setor não protegido pela D4.

    Um CEP sem setor, com código ausente da malha, registro inválido ou setor protegido é
    omitido. Não é possível presumir que um setor desconhecido atende à regra D4.
    """
    conhecidos, protegidos, _ = _setores_geojson(geojson)
    filtrado = {}
    for cep, valor in indice.items():
        if not _registro_cep_valido(cep, valor):
            continue
        setor = id_do_setor(valor[3])
        if not setor or setor not in conhecidos or setor in protegidos:
            continue
        filtrado[cep] = list(valor)
    return filtrado, len(indice) - len(filtrado)


MINIMO_ENDERECOS_POR_CEP = 3  # mesma lógica da D4 (menos de 3 domicílios): CEP com menos de 3 endereços não publica ponto próprio
RAIO_MINIMO_GENERALIZADO_M = 300
RAIO_MAXIMO_GENERALIZADO_M = 1500


def _aneis(geom: dict):
    """Anéis (lista de [lon, lat]) do polígono ou multipolígono: o primeiro de cada polígono é o externo, os demais são furos."""
    if geom.get("type") == "Polygon":
        return [geom["coordinates"]]
    if geom.get("type") == "MultiPolygon":
        return geom["coordinates"]
    return []


def centroide_e_raio_do_setor(geom: dict) -> tuple[float, float, int] | None:
    """Centro (lat, lon) ponderado pela área e raio (m) até o vértice mais distante, limitado a [300, 1500] m.

    A conta é plana em graus, suficiente para um setor urbano; o resultado é arredondado a 4 casas e a 10 m."""
    area_total = cx = cy = 0.0
    pontos = []
    for poligono in _aneis(geom):
        for i, anel in enumerate(poligono):
            a2 = sx = sy = 0.0
            for (x0, y0), (x1, y1) in zip(anel, anel[1:]):
                cruz = x0 * y1 - x1 * y0
                a2 += cruz
                sx += (x0 + x1) * cruz
                sy += (y0 + y1) * cruz
            if abs(a2) < 1e-18:
                continue
            area = abs(a2) / 2
            peso = area if i == 0 else -area
            area_total += peso
            cx += (sx / (3 * a2)) * peso
            cy += (sy / (3 * a2)) * peso
            if i == 0:
                pontos.extend(anel)
    if abs(area_total) < 1e-18 or not pontos:
        return None
    lon, lat = cx / area_total, cy / area_total
    raio = max(haversine_m(lat, lon, y, x) for x, y in pontos)
    raio = int(-(-raio // 10) * 10)
    return round(lat, 4), round(lon, 4), max(RAIO_MINIMO_GENERALIZADO_M, min(RAIO_MAXIMO_GENERALIZADO_M, raio))


def generalizar_ceps_com_poucos_enderecos(indice: dict, geojson: dict, minimo: int = MINIMO_ENDERECOS_POR_CEP) -> tuple[dict, int, int]:
    """Generaliza CEPs com poucos endereços e omite registros sem prova setorial/geometria."""
    conhecidos, protegidos, geoms = _setores_geojson(geojson)
    novo, generalizados, omitidos = {}, 0, 0
    for cep, valor in indice.items():
        if not _registro_cep_valido(cep, valor):
            omitidos += 1
            continue
        setor = id_do_setor(valor[3])
        if not setor or setor not in conhecidos or setor in protegidos:
            omitidos += 1
            continue
        quantidade = int(valor[4])
        if quantidade >= minimo:
            novo[cep] = list(valor)
            continue
        resumo = centroide_e_raio_do_setor(geoms[setor]) if setor in geoms else None
        if resumo is None:
            omitidos += 1
            continue
        lat, lon, raio = resumo
        resultado = [lat, lon, max(raio, valor[2]), valor[3], quantidade]
        if resultado != list(valor):
            generalizados += 1
        novo[cep] = resultado
    return novo, generalizados, omitidos


def sanear_indice_para_publicacao(indice: dict, geojson: dict) -> tuple[dict, dict]:
    """Aplica D4, vínculo setorial verificável e generalização em qualquer caminho de geração."""
    filtrado, removidos_validacao = filtrar_ceps_de_setores_suprimidos(indice, geojson)
    final, generalizados, omitidos_generalizacao = generalizar_ceps_com_poucos_enderecos(filtrado, geojson)
    return final, {
        "omitidos_validacao_setorial": removidos_validacao,
        "generalizados_poucos_enderecos": generalizados,
        "omitidos_generalizacao": omitidos_generalizacao,
    }


def sanear_indice_publicado(caminho_indice: Path, caminho_geojson: Path) -> int:
    """Aplica ao índice JÁ publicado (sem reler o CNEFE) a D4 e a regra de CEP com poucos endereços; atualiza os metadados.

    Devolve quantas entradas foram alteradas ou removidas. É idempotente: rodar de novo não altera nada."""
    dados = json.loads(caminho_indice.read_text(encoding="utf-8"))
    geojson = json.loads(caminho_geojson.read_text(encoding="utf-8"))
    ceps, estatisticas = sanear_indice_para_publicacao(dados["ceps"], geojson)
    removidos = estatisticas["omitidos_validacao_setorial"]
    generalizados = estatisticas["generalizados_poucos_enderecos"]
    omitidos = estatisticas["omitidos_generalizacao"]
    if removidos or generalizados or omitidos:
        dados["ceps"] = ceps
        meta = dados.setdefault("meta", {})
        meta["ceps_sem_vinculo_setorial_verificavel_ou_protegido_omitidos"] = removidos
        meta["ceps_generalizados_por_poucos_enderecos"] = sum(1 for v in ceps.values() if v[4] < MINIMO_ENDERECOS_POR_CEP)
        meta["ceps_poucos_enderecos_sem_geometria_omitidos"] = omitidos
        meta["ceps_so_da_lista"] = [c for c in meta.get("ceps_so_da_lista", []) if c in ceps]
        meta["regra_poucos_enderecos"] = ("CEP com menos de %d endereços não publica o ponto dos endereços: a coordenada é o centro do setor censitário e o raio cobre o setor "
                                          "(entre %d e %d m). CEP sem setor utilizável é omitido." % (MINIMO_ENDERECOS_POR_CEP, RAIO_MINIMO_GENERALIZADO_M, RAIO_MAXIMO_GENERALIZADO_M))
        # mantém o formato legível do arquivo publicado (indent=1 e quebra final) para o diff mostrar só o que mudou
        caminho_indice.write_text(json.dumps(dados, ensure_ascii=False, indent=1) + "\n", encoding="utf-8", newline="\n")
    return removidos + generalizados + omitidos


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
        print("  %d entradas do índice publicado foram alteradas ou removidas (D4 e CEP com poucos endereços)." % n)
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
    indice, estatisticas = sanear_indice_para_publicacao(indice, geojson)
    novos = {cep: valor for cep, valor in novos.items() if cep in indice}
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
            "observacao_lista": "CEPs sem vínculo setorial verificável não são publicados no índice.",
            "ceps_sem_vinculo_setorial_verificavel_ou_protegido_omitidos": estatisticas["omitidos_validacao_setorial"],
            "ceps_generalizados_por_poucos_enderecos": estatisticas["generalizados_poucos_enderecos"],
            "ceps_poucos_enderecos_sem_geometria_omitidos": estatisticas["omitidos_generalizacao"],
            "observacao_privacidade": "CEPs sem setor verificável, associados a setores protegidos ou com registros inválidos são omitidos. CEPs com menos de 3 endereços são generalizados para o centro do setor; se a geometria não for utilizável, são omitidos.",
        },
        "ceps": indice,
    }
    salvar_json(saida, WEB_DADOS / "cep_indice.json")
    pequenos = sum(1 for v in indice.values() if v[4] < POUCOS)
    print("  %d CEPs indexados; %d sem vínculo setorial verificável ou protegidos foram omitidos." %
          (len(indice), estatisticas["omitidos_validacao_setorial"]))
    print("  %d CEPs com menos de %d endereços foram generalizados." % (pequenos, POUCOS))
    print("Proximo passo: python pipeline/servicos.py")


if __name__ == "__main__":
    main()
