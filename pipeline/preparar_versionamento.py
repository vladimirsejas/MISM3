"""Prepara com segurança os arquivos novos (ainda fora do Git) para irem ao GitHub.

Roda NA SUA MAQUINA, dentro da pasta do projeto. Nao envia nada para a internet.

  python pipeline/preparar_versionamento.py                 # so mostra um relatorio; nao altera nada
  python pipeline/preparar_versionamento.py --aplicar       # faz 'git add' apenas dos arquivos classificados PODE
  python pipeline/preparar_versionamento.py --filtrar-inep ARQUIVO.csv
                                                            # gera o recorte de Rio Claro do Censo Escolar (arquivo pequeno)

Classificacao de cada arquivo novo:
  PODE       pequeno e sem sinal de dado pessoal: pode ir ao Git
  FILTRAR    microdados nacionais do INEP: gere o recorte de Rio Claro e versione so ele
  REVISAR    muitas linhas (dado bruto) ou possivel CPF: olhe antes de decidir
  AVISO      entre 50 MB e 100 MB: o GitHub avisa, mas aceita
  BLOQUEADO  100 MB ou mais: o GitHub recusa o envio
"""
from __future__ import annotations

import argparse
import csv
import re
import subprocess
import sys
from pathlib import Path

MUNICIPIO_IBGE7 = "3543907"  # Rio Claro/SP
MB = 1024 * 1024
LIMITE_BLOQUEIO = 100 * MB
LIMITE_AVISO = 50 * MB
LIMITE_PODE = 20 * MB
LINHAS_BRUTO = 50_000
EXT_TEXTO = {".csv", ".txt", ".json", ".geojson", ".md", ".tsv"}
PADRAO_CPF = re.compile(r"(?<!\d)\d{3}\.\d{3}\.\d{3}-\d{2}(?!\d)")


def _utf8() -> None:
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass


def tamanho_legivel(n: int) -> str:
    return "%.1f MB" % (n / MB) if n >= MB else "%.0f KB" % (n / 1024)


def contar_linhas_e_cpf(caminho: Path, limite_bytes: int = 200 * MB) -> tuple[int | None, int]:
    """(linhas, ocorrencias de CPF) de um arquivo de texto. None se for grande demais para ler."""
    if caminho.stat().st_size > limite_bytes:
        return None, 0
    linhas = cpf = 0
    with open(caminho, "rb") as f:
        for bruto in f:
            linhas += 1
            if cpf < 1000:
                cpf += len(PADRAO_CPF.findall(bruto.decode("latin-1", errors="ignore")))
    return linhas, cpf


def classificar(caminho: Path, tamanho: int, linhas: int | None, cpf: int) -> tuple[str, str]:
    nome = caminho.name.lower()
    if tamanho >= LIMITE_BLOQUEIO:
        return "BLOQUEADO", "tem %s: o GitHub recusa arquivos de 100 MB ou mais" % tamanho_legivel(tamanho)
    if "microdados" in nome and caminho.suffix.lower() == ".csv" and tamanho > 5 * MB:
        return "FILTRAR", "microdados nacionais: gere o recorte de Rio Claro com --filtrar-inep e versione so ele"
    if cpf:
        return "REVISAR", "achei %d possivel(is) CPF no texto: confira antes de enviar" % cpf
    if linhas is not None and linhas > LINHAS_BRUTO:
        return "REVISAR", "%d linhas: parece dado bruto; versione so o resultado gerado (ex.: cep_indice.json)" % linhas
    if linhas is None and caminho.suffix.lower() in EXT_TEXTO:
        return "REVISAR", "arquivo de texto muito grande para conferir"
    if tamanho >= LIMITE_AVISO:
        return "AVISO", "tem %s: o GitHub avisa (limite de aviso: 50 MB)" % tamanho_legivel(tamanho)
    if tamanho <= LIMITE_PODE or (caminho.suffix.lower() == ".pdf" and tamanho < LIMITE_AVISO):
        return "PODE", "pequeno e sem sinal de dado pessoal"
    return "REVISAR", "tem %s: confira se precisa mesmo ir ao Git" % tamanho_legivel(tamanho)


def arquivos_novos(raiz: Path) -> list[Path]:
    """Arquivos fora do Git que o .gitignore nao esconde."""
    saida = subprocess.run(["git", "ls-files", "--others", "--exclude-standard", "-z"], cwd=raiz,
                           capture_output=True, check=True).stdout.decode("utf-8", errors="replace")
    return [raiz / p for p in saida.split("\0") if p]


def relatorio(raiz: Path) -> list[tuple[str, Path, str]]:
    itens = []
    for caminho in sorted(arquivos_novos(raiz)):
        if not caminho.is_file():
            continue
        tam = caminho.stat().st_size
        linhas, cpf = (contar_linhas_e_cpf(caminho) if caminho.suffix.lower() in EXT_TEXTO else (0, 0))
        status, motivo = classificar(caminho, tam, linhas, cpf)
        itens.append((status, caminho, motivo))
    return itens


def _detectar_codificacao(caminho: Path) -> str:
    amostra = open(caminho, "rb").read(2 * MB)
    try:
        amostra.decode("utf-8")
        return "utf-8-sig"
    except UnicodeDecodeError:
        return "latin-1"


def filtrar_inep(origem: Path, destino: Path, municipio: str = MUNICIPIO_IBGE7) -> tuple[int, int]:
    """Copia so as linhas de um municipio. Le em fluxo (nao carrega o arquivo na memoria)."""
    cod = _detectar_codificacao(origem)
    with open(origem, encoding=cod, newline="") as f:
        cab = f.readline()
    sep = ";" if cab.count(";") >= cab.count(",") else ","
    total = mantidas = 0
    with open(origem, encoding=cod, newline="") as fin, open(destino, "w", encoding=cod, newline="") as fout:
        leitor = csv.reader(fin, delimiter=sep)
        escritor = csv.writer(fout, delimiter=sep, lineterminator="\n")
        cabecalho = next(leitor)
        nomes = [c.strip().lstrip("﻿").strip('"').upper() for c in cabecalho]
        if "CO_MUNICIPIO" not in nomes:
            raise SystemExit("Nao achei a coluna CO_MUNICIPIO. Colunas: %s" % ", ".join(nomes[:15]))
        idx = nomes.index("CO_MUNICIPIO")
        escritor.writerow(cabecalho)
        for linha in leitor:
            total += 1
            if len(linha) > idx and linha[idx].strip() == municipio:
                escritor.writerow(linha)
                mantidas += 1
    return total, mantidas


def main(argv: list[str] | None = None) -> int:
    _utf8()
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--aplicar", action="store_true", help="faz git add apenas dos arquivos PODE")
    ap.add_argument("--filtrar-inep", metavar="CSV", help="gera o recorte de Rio Claro de um microdados_ed_basica*.csv")
    ap.add_argument("--raiz", metavar="PASTA", help="pasta do projeto (padrao: a pasta deste script, um nivel acima)")
    args = ap.parse_args(argv)
    raiz = Path(args.raiz).resolve() if args.raiz else Path(__file__).resolve().parents[1]

    if args.filtrar_inep:
        origem = Path(args.filtrar_inep)
        destino = origem.with_name("microdados_ed_basica_rio_claro.csv")
        total, mantidas = filtrar_inep(origem, destino)
        print("Lidas %d linhas; mantidas %d de Rio Claro (%s)." % (total, mantidas, MUNICIPIO_IBGE7))
        print("Arquivo gerado: %s (%s)" % (destino, tamanho_legivel(destino.stat().st_size)))
        print("Rode de novo este script sem opcoes para ver a classificacao do arquivo gerado.")
        return 0

    itens = relatorio(raiz)
    if not itens:
        print("Nao ha arquivos novos fora do Git (alem dos ja ignorados).")
        return 0
    contagem: dict[str, int] = {}
    for status, caminho, motivo in itens:
        contagem[status] = contagem.get(status, 0) + 1
        print("%-9s %9s  %s\n          %s" % (status, tamanho_legivel(caminho.stat().st_size), caminho.relative_to(raiz), motivo))
    print("\nResumo:", ", ".join("%s=%d" % (k, v) for k, v in sorted(contagem.items())))
    pode = [c for s, c, _ in itens if s == "PODE"]
    if args.aplicar:
        if pode:
            subprocess.run(["git", "add", "--"] + [str(c.relative_to(raiz)) for c in pode], cwd=raiz, check=True)
            print("\ngit add feito em %d arquivo(s) PODE. Falta so: git commit e git push (veja o README)." % len(pode))
        else:
            print("\nNenhum arquivo PODE para adicionar.")
    else:
        print("\nNada foi alterado. Para adicionar ao Git so os arquivos PODE: python pipeline/preparar_versionamento.py --aplicar")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
