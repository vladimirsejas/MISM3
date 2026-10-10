"""Gera web/dados/cep_indice.json a partir do CSV de CEPs geocodificados fornecido.

Fonte local esperada:
  dados/bruto/ceps_google/resumido3_com_coordenadas_google.csv

O arquivo de saída não contém logradouro, bairro ou endereço. O CNEFE/IBGE continua
sendo a fonte preferencial; este script é uma alternativa, pois as coordenadas
foram fornecidas por geocodificação Google e precisam de validação territorial.
"""
from __future__ import annotations

import csv
import sys
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import WEB_DADOS, erro, normalizar_cep, salvar_json  # noqa: E402

RAIZ = Path(__file__).resolve().parent.parent
ENTRADA = RAIZ / "dados" / "bruto" / "ceps_google" / "resumido3_com_coordenadas_google.csv"

# Caixa de triagem ampla para Rio Claro/SP, não substitui o limite municipal oficial.
LAT_MIN, LAT_MAX = -22.65, -22.15
LON_MIN, LON_MAX = -47.80, -47.30
RAIO_M = 300


def construir_indice(caminho: Path = ENTRADA) -> tuple[dict, dict]:
    import math

    if not caminho.is_file():
        raise FileNotFoundError(
            f"CSV não encontrado: {caminho}\n"
            "Coloque o arquivo fornecido em dados/bruto/ceps_google/."
        )
    indice = {}
    total = com_coord = fora_caixa = cep_invalido = 0
    with caminho.open("r", encoding="utf-8-sig", newline="") as f:
        leitor = csv.DictReader(f, delimiter=";")
        obrigatorias = {"CEP", "Latitude", "Longitude"}
        if not leitor.fieldnames or not obrigatorias.issubset(leitor.fieldnames):
            raise ValueError("CSV precisa ter as colunas CEP, Latitude e Longitude.")
        for linha in leitor:
            total += 1
            cep = normalizar_cep(linha.get("CEP"))
            if not cep:
                cep_invalido += 1
                continue
            try:
                lat = float(str(linha.get("Latitude", "")).replace(",", "."))
                lon = float(str(linha.get("Longitude", "")).replace(",", "."))
            except (TypeError, ValueError):
                continue
            if not (math.isfinite(lat) and math.isfinite(lon)):
                continue
            com_coord += 1
            if not (LAT_MIN <= lat <= LAT_MAX and LON_MIN <= lon <= LON_MAX):
                fora_caixa += 1
                continue
            # Todos os CEPs vieram como um ponto geocodificado; arredondar e
            # ampliar o raio evita sugerir precisão de endereço residencial.
            indice[cep] = [round(lat, 3), round(lon, 3), RAIO_M, "", 1]
    if not indice:
        raise ValueError("Nenhum CEP com coordenadas passou pelas validações.")
    diagnostico = {
        "linhas_csv": total,
        "ceps_indexados": len(indice),
        "linhas_com_coordenadas": com_coord,
        "coordenadas_fora_da_caixa_de_triagem": fora_caixa,
        "ceps_invalidos": cep_invalido,
    }
    return indice, diagnostico


def main() -> None:
    try:
        indice, d = construir_indice()
    except (FileNotFoundError, ValueError) as exc:
        erro(str(exc))
    saida = {
        "meta": {
            "fonte": "CSV fornecido pelo responsável do projeto; coordenadas geocodificadas pelo Google",
            "municipio": "Rio Claro/SP (triagem por caixa geográfica aproximada)",
            "gerado_em": date.today().isoformat(),
            "formato": "cep -> [latitude arredondada, longitude arredondada, raio_m, setor_censitario, n_enderecos]",
            "precisao": "aproximada; coordenadas arredondadas a 3 casas e raio de 300 m",
            "limite_municipal_validado": False,
            "demo": False,
            "diagnostico": d,
        },
        "ceps": indice,
    }
    salvar_json(saida, WEB_DADOS / "cep_indice.json")
    print("Índice complementar gerado. Revise a cobertura antes de usar em produção.")
    print("Diagnóstico:", d)


if __name__ == "__main__":
    main()
