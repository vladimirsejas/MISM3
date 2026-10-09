"""Confere o catalogo manual contra as paginas oficiais (roda no SEU computador, com internet).

Para cada linha de catalogo/servicos_manuais.csv, abre a fonte_url e verifica se os telefones
cadastrados aparecem no texto da pagina. Serve para pegar erro de digitacao/leitura e tambem
para avisar quando a prefeitura trocar um numero ou tirar a pagina do ar.

Uso:
    python pipeline/verificar_catalogo.py
Saida: uma linha por registro (OK / ATENCAO) e, no final, o resumo. Nao altera nenhum arquivo.
"""
from __future__ import annotations

import html
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import CATALOGO, abrir_url, ler_csv_flex  # noqa: E402

PADRAO_FONE = re.compile(r"\d{4,5}[-\s.]?\d{4}")


def texto_da_pagina(bruto: bytes) -> str:
    t = bruto.decode("utf-8", errors="replace")
    t = re.sub(r"(?is)<(script|style).*?</\1>", " ", t)
    t = re.sub(r"(?s)<[^>]+>", " ", t)
    return html.unescape(t)


def telefones(campo: str) -> list[str]:
    """Extrai os numeros de um campo e devolve os 8 ultimos digitos de cada um."""
    achados = []
    for m in PADRAO_FONE.findall(campo or ""):
        d = re.sub(r"\D", "", m)
        achados.append(d[-8:])
    return achados


def fone_na_pagina(fone8: str, texto: str) -> bool:
    return re.search(r"%s\D{0,2}%s" % (fone8[:4], fone8[4:]), texto) is not None


def verifica(linha: dict, texto: str) -> list[str]:
    """Lista de problemas (vazia = tudo certo)."""
    problemas = []
    for f in telefones(linha.get("telefone", "")):
        if not fone_na_pagina(f, texto):
            problemas.append("telefone final %s-%s nao aparece na pagina" % (f[:4], f[4:]))
    return problemas


def main() -> None:
    df = ler_csv_flex(CATALOGO / "servicos_manuais.csv").fillna("")
    cache: dict[str, str | None] = {}
    com_problema = 0
    for r in df.to_dict("records"):
        url = r.get("fonte_url", "")
        if url not in cache:
            try:
                cache[url] = texto_da_pagina(abrir_url(url))
            except Exception as e:  # noqa: BLE001
                cache[url] = None
                print("  nao consegui abrir %s: %s" % (url, e))
        if cache[url] is None:
            print("ATENCAO  %-28s fonte fora do ar ou inacessivel" % r["id"])
            com_problema += 1
            continue
        probs = verifica(r, cache[url])
        if probs:
            com_problema += 1
            print("ATENCAO  %-28s %s" % (r["id"], "; ".join(probs)))
        else:
            print("OK       %-28s" % r["id"])
    print("\n%d registros, %d com atencao. Atencao nao e erro certo: a pagina pode mostrar o numero de outro jeito; "
          "abra a fonte e confira." % (len(df), com_problema))


if __name__ == "__main__":
    main()
