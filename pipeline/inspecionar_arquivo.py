"""Mostra a ESTRUTURA de arquivos baixados (zip, csv, txt, xlsx, json), nunca os registros.

Uso (no Windows, dentro da pasta do projeto):
    python pipeline\\inspecionar_arquivo.py docs\\cnes
    python pipeline\\inspecionar_arquivo.py caminho\\arquivo.zip

Para cada arquivo imprime: tamanho; se for zip, os arquivos de dentro; se for tabela,
so a linha de cabecalho (nomes das colunas). Nenhuma linha de dados e impressa.
"""
from __future__ import annotations

import csv
import io
import json
import sys
import zipfile
from pathlib import Path

LIMITE_ZIP = 60


def tamanho(n: int) -> str:
    for u in ("B", "KB", "MB", "GB"):
        if n < 1024 or u == "GB":
            return "%.1f %s" % (n, u) if u != "B" else "%d B" % n
        n /= 1024
    return str(n)


def cabecalho_texto(bruto: bytes) -> list[str] | None:
    for enc in ("utf-8-sig", "latin-1"):
        try:
            texto = bruto.decode(enc)
            break
        except UnicodeDecodeError:
            continue
    linha = texto.splitlines()[0] if texto.strip() else ""
    if not linha:
        return None
    sep = max((";", ",", "\t", "|"), key=linha.count)
    return next(csv.reader([linha], delimiter=sep)), sep


def mostra_cabecalho(rotulo: str, bruto: bytes) -> None:
    r = cabecalho_texto(bruto)
    if not r:
        print("    %s: vazio ou sem cabecalho de texto" % rotulo)
        return
    cols, sep = r
    print("    %s: %d colunas (separador %r)" % (rotulo, len(cols), sep))
    for i, c in enumerate(cols):
        print("      %3d  %s" % (i, c.strip()))


def inspeciona(caminho: Path) -> None:
    print("\n== %s  (%s)" % (caminho, tamanho(caminho.stat().st_size)))
    suf = caminho.suffix.lower()
    if suf == ".zip":
        with zipfile.ZipFile(caminho) as z:
            infos = z.infolist()
            print("  %d arquivos dentro do zip:" % len(infos))
            for zi in infos[:LIMITE_ZIP]:
                print("   - %s  (%s)" % (zi.filename, tamanho(zi.file_size)))
            if len(infos) > LIMITE_ZIP:
                print("   ... e mais %d" % (len(infos) - LIMITE_ZIP))
            for zi in infos[:LIMITE_ZIP]:
                if zi.filename.lower().endswith((".csv", ".txt")):
                    with z.open(zi) as f:
                        mostra_cabecalho(zi.filename, f.read(64 * 1024))
    elif suf in (".csv", ".txt"):
        with open(caminho, "rb") as f:
            mostra_cabecalho(caminho.name, f.read(64 * 1024))
    elif suf in (".xlsx", ".xlsm"):
        try:
            import openpyxl
        except ImportError:
            print("  instale: pip install openpyxl")
            return
        wb = openpyxl.load_workbook(caminho, read_only=True)
        for ws in wb.worksheets:
            cab = next(ws.iter_rows(max_row=1, values_only=True), ())
            print("  planilha %r: %d colunas" % (ws.title, len(cab)))
            for i, c in enumerate(cab):
                print("      %3d  %s" % (i, c))
    elif suf == ".json":
        with open(caminho, "rb") as f:
            bruto = f.read(2 * 1024 * 1024)
        try:
            obj = json.loads(bruto)
        except ValueError:
            print("  JSON grande ou invalido; so os primeiros bytes foram lidos")
            return
        if isinstance(obj, dict):
            print("  chaves:", list(obj)[:30])
        elif isinstance(obj, list) and obj and isinstance(obj[0], dict):
            print("  lista de %d objetos; chaves do primeiro: %s" % (len(obj), list(obj[0])[:60]))
    else:
        print("  tipo %r: nao inspeciono o conteudo" % suf)


def main() -> None:
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    alvos: list[Path] = []
    for a in sys.argv[1:]:
        p = Path(a)
        if not p.exists():
            print("Nao encontrei: %s" % p)
            continue
        alvos += sorted(x for x in p.rglob("*") if x.is_file()) if p.is_dir() else [p]
    if not alvos:
        sys.exit(1)
    for p in alvos:
        inspeciona(p)


if __name__ == "__main__":
    main()
