"""Agrega dados administrativos de saúde da mulher para análise no MISM3.

Entrada esperada (local, não versionada):
  dados/bruto/saude_mulher/cancer_*_mulheres_rio_claro_2021_2025.csv

O arquivo público não deve conter registros individuais, CEP, coordenadas, idade
individual ou datas completas. A fonte exata precisa ser confirmada antes de
interpretar os registros como internações, diagnósticos, incidência ou mortalidade.
"""
from __future__ import annotations

import argparse
import csv
import json
import re
import unicodedata
from collections import Counter
from datetime import date
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
PASTA_ENTRADA = RAIZ / "dados" / "bruto" / "saude_mulher"
ARQUIVO_SAIDA = PASTA_ENTRADA / "saude_mulher_resumo.json"
MINIMO_PUBLICACAO = 5

FONTES = [
    ("cancer_mama_mulheres_rio_claro_2021_2025.csv", "Câncer de mama"),
    ("cancer_colo_utero_mulheres_rio_claro_2021_2025.csv", "Câncer do colo do útero"),
    ("cancer_colorretal_mulheres_rio_claro_2021_2025.csv", "Câncer colorretal"),
    ("cancer_ovario_mulheres_rio_claro_2021_2025.csv", "Câncer de ovário"),
    ("cancer_pele_nao_melanoma_mulheres_rio_claro_2021_2025.csv", "Câncer de pele não melanoma"),
    ("cancer_pulmao_mulheres_rio_claro_2021_2025.csv", "Câncer de pulmão"),
    ("cancer_tireoide_mulheres_rio_claro_2021_2025.csv", "Câncer de tireoide"),
]

COLUNAS_DATA = (
    "DT_INTER", "DT_DIAG", "DT_NOTIFIC", "DT_OBITO", "DT_EVENTO",
    "ANO_DIAG", "ANO", "ANO_EVENTO",
)


def normalizar(texto: object) -> str:
    texto = unicodedata.normalize("NFD", str(texto or ""))
    texto = "".join(c for c in texto if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]", "", texto.casefold())


def achar_coluna(colunas: list[str], candidatas: tuple[str, ...]) -> str | None:
    por_nome = {normalizar(c): c for c in colunas}
    for candidata in candidatas:
        if normalizar(candidata) in por_nome:
            return por_nome[normalizar(candidata)]
    return None


def extrair_ano(valor: object) -> int | None:
    """Aceita datas YYYY-MM-DD, YYYYMMDD e campos contendo apenas o ano."""
    texto = str(valor or "").strip()
    if not texto or texto.lower() in {"nan", "none", "nat"}:
        return None
    match = re.search(r"(?<!\d)(20\d{2})(?!\d)", texto)
    if not match:
        return None
    ano = int(match.group(1))
    return ano if 1900 <= ano <= date.today().year + 1 else None


def ler_contagens(caminho: Path) -> tuple[Counter, int]:
    """Lê somente o ano e conta linhas; nenhum campo individual é mantido."""
    with caminho.open("r", encoding="utf-8-sig", newline="") as arquivo:
        amostra = arquivo.read(8192)
        arquivo.seek(0)
        try:
            dialeto = csv.Sniffer().sniff(amostra, delimiters=";,\t,")
        except csv.Error:
            dialeto = csv.excel
        leitor = csv.DictReader(arquivo, dialect=dialeto)
        if not leitor.fieldnames:
            raise ValueError(f"CSV sem cabeçalho: {caminho.name}")
        coluna_data = achar_coluna(leitor.fieldnames, COLUNAS_DATA)
        if not coluna_data:
            raise ValueError(
                f"{caminho.name}: não encontrei coluna de data/ano conhecida "
                f"({', '.join(COLUNAS_DATA)}). Confirme a fonte e o esquema."
            )
        contagens: Counter = Counter()
        linhas_lidas = 0
        for linha in leitor:
            linhas_lidas += 1
            ano = extrair_ano(linha.get(coluna_data))
            if ano is not None:
                contagens[ano] += 1
    return contagens, linhas_lidas


def gerar_resumo(pasta: Path = PASTA_ENTRADA, saida: Path = ARQUIVO_SAIDA,
                 minimo: int = MINIMO_PUBLICACAO) -> dict:
    if minimo < MINIMO_PUBLICACAO:
        raise ValueError(f"O mínimo de publicação não pode ser menor que {MINIMO_PUBLICACAO}.")
    agregados = []
    arquivos_encontrados = 0

    for nome_arquivo, doenca in FONTES:
        caminho = pasta / nome_arquivo
        if not caminho.is_file():
            continue
        arquivos_encontrados += 1
        contagens, _ = ler_contagens(caminho)
        for ano, quantidade in sorted(contagens.items()):
            suprimido = quantidade < minimo
            agregados.append({
                "doenca": doenca,
                "ano": ano,
                "registros": None if suprimido else quantidade,
                "status": f"suprimido: menos de {minimo}" if suprimido else "publicavel",
            })

    if arquivos_encontrados == 0:
        raise FileNotFoundError(
            f"Nenhum CSV esperado foi encontrado em {pasta}. "
            "Coloque as bases locais nessa pasta; elas não devem ser enviadas ao Git."
        )

    resumo = {
        "meta": {
            "produto": "MISM3",
            "modulo": "saude_mulher",
            "municipio": "Rio Claro/SP",
            "gerado_em": date.today().isoformat(),
            "quantidade_minima_publicacao": minimo,
            "fonte_confirmada": False,
            "status_fonte": "pendente de confirmação",
            "interpretacao": (
                "Contagem de registros administrativos por arquivo e ano. "
                "Não interpretar como incidência, prevalência, diagnóstico, "
                "internação ou mortalidade até confirmar a fonte e as regras de extração."
            ),
            "privacidade": (
                "Somente agregados por categoria e ano; CEPs, coordenadas, datas completas "
                "e campos individuais não são exportados."
            ),
        },
        "dados": agregados,
    }
    saida.parent.mkdir(parents=True, exist_ok=True)
    saida.write_text(json.dumps(resumo, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Resumo agregado gerado: {saida}")
    print(f"Arquivos processados: {arquivos_encontrados}")
    print(f"Grupos ano/categoria: {len(agregados)} (grupos pequenos suprimidos)")
    print("Atenção: fonte ainda não confirmada; o arquivo não deve ser publicado como indicador epidemiológico.")
    return resumo


def main() -> None:
    parser = argparse.ArgumentParser(description="Agrega com segurança os arquivos locais de saúde da mulher.")
    parser.add_argument("--entrada", type=Path, default=PASTA_ENTRADA, help="Pasta local com os CSVs de origem.")
    parser.add_argument("--saida", type=Path, default=ARQUIVO_SAIDA, help="Destino do JSON agregado.")
    parser.add_argument("--minimo", type=int, default=MINIMO_PUBLICACAO, help="Mínimo para publicar uma contagem (mínimo permitido: 5).")
    args = parser.parse_args()
    gerar_resumo(args.entrada, args.saida, args.minimo)


if __name__ == "__main__":
    main()
