"""Extrai texto dos PDFs de horários da SOU para inspeção em lote.

Uso, na raiz do repositório:
    python pipeline/extrair_texto_onibus.py

Lê docs/transporte/*.pdf e grava dados/bruto/transporte/textos_extraidos.txt.
Não altera os PDFs nem publica os horários no site. A saída serve para conferir
se o texto/tabela pode ser extraído automaticamente antes de estruturar os dados.
"""
from __future__ import annotations

import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
PASTA_PDFS = RAIZ / "docs" / "transporte"
SAIDA = RAIZ / "dados" / "bruto" / "transporte" / "textos_extraidos.txt"


def main() -> int:
    try:
        from pypdf import PdfReader
    except ImportError:
        print("Falta a biblioteca pypdf. Instale com:")
        print("  python -m pip install pypdf")
        return 2

    arquivos = sorted(PASTA_PDFS.glob("*.pdf"))
    if not arquivos:
        print(f"Nenhum PDF encontrado em: {PASTA_PDFS}")
        return 1

    blocos: list[str] = []
    sem_texto: list[str] = []
    for arquivo in arquivos:
        try:
            leitor = PdfReader(str(arquivo))
            paginas = []
            for numero, pagina in enumerate(leitor.pages, start=1):
                texto = (pagina.extract_text() or "").strip()
                if texto:
                    paginas.append(f"--- Página {numero} ---\n{texto}")
            if not paginas:
                sem_texto.append(arquivo.name)
                conteudo = "[Nenhum texto extraível; pode ser PDF de imagem ou impressão rasterizada.]"
            else:
                conteudo = "\n\n".join(paginas)
            blocos.append(f"\n{'=' * 78}\nARQUIVO: {arquivo.name}\n{'=' * 78}\n{conteudo}\n")
            print(f"{arquivo.name}: {len(paginas)} página(s) com texto")
        except Exception as exc:  # não interrompe o lote por um PDF defeituoso
            blocos.append(f"\n{'=' * 78}\nARQUIVO: {arquivo.name}\nERRO: {exc}\n")
            print(f"{arquivo.name}: erro ao ler ({exc})")

    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    SAIDA.write_text("\n".join(blocos), encoding="utf-8")
    print(f"\nTexto extraído de {len(arquivos)} PDF(s).")
    print(f"Arquivo de saída: {SAIDA}")
    if sem_texto:
        print("\nPDF(s) sem texto extraível; exigirão OCR ou conferência visual:")
        for nome in sem_texto:
            print(f"  - {nome}")
    print("\nEsta saída ainda NÃO é uma tabela oficial estruturada; confira linha, sentido e validade antes de integrar.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
