"""Concursos e processos seletivos da Prefeitura -> web/dados/vagas.json.

Fonte de cada linha = o EDITAL OFICIAL (site da Prefeitura ou da banca organizadora). Sites de noticias
e agregadores de concursos servem para descobrir que existe um edital, mas nao como fonte do cadastro:
preco, prazo e cargos mudam por retificacao e eles ficam desatualizados.

Uso:  python pipeline/vagas.py          (le catalogo/vagas_publicas.csv)
"""
from __future__ import annotations

import re
import sys
from datetime import date
from pathlib import Path
from urllib.parse import urlparse

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import CATALOGO, WEB_DADOS, agora_iso, ler_csv_flex, salvar_json  # noqa: E402

TIPOS = ("concurso", "processo_seletivo")
AGREGADORES = ("qconcursos", "estudegratis", "jcconcursos", "pciconcursos", "concursosnobrasil",
               "grancursosonline", "diariodotransporte", "folha.uol", "g1.globo")


def _data(v, campo, nome, obrigatoria=False):
    if v is None:
        if obrigatoria:
            raise ValueError("'%s': falta %s (formato AAAA-MM-DD)." % (nome, campo))
        return None
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", v):
        raise ValueError("'%s': %s='%s' invalida (use AAAA-MM-DD)." % (nome, campo, v))
    date.fromisoformat(v)  # rejeita 2026-02-31
    return v


def validar(df) -> list[dict]:
    saida = []
    for _, r in df.iterrows():
        g = lambda c: (None if str(r.get(c, "")) in ("nan", "None", "") else str(r[c]).strip())  # noqa: E731
        nome = g("titulo") or "(sem titulo)"
        for obrig in ("orgao", "titulo", "tipo", "edital_url", "verificado_em"):
            if not g(obrig):
                raise ValueError("'%s': campo obrigatorio '%s' vazio." % (nome, obrig))
        if g("tipo") not in TIPOS:
            raise ValueError("'%s': tipo '%s' invalido (use: %s)." % (nome, g("tipo"), ", ".join(TIPOS)))
        url = urlparse(g("edital_url"))
        if url.scheme != "https" or not url.netloc:
            raise ValueError("'%s': edital_url precisa ser um link https." % nome)
        if any(a in url.netloc.lower() for a in AGREGADORES):
            raise ValueError("'%s': %s e site de noticias/agregador. Use o edital oficial (Prefeitura ou banca)." % (nome, url.netloc))
        de = _data(g("inscricoes_de"), "inscricoes_de", nome)
        ate = _data(g("inscricoes_ate"), "inscricoes_ate", nome, obrigatoria=True)
        if de and de > ate:
            raise ValueError("'%s': inscricoes_de depois de inscricoes_ate." % nome)
        _data(g("verificado_em"), "verificado_em", nome, obrigatoria=True)
        # Nao gravamos "aberto/encerrado": o site calcula pela data de hoje, para nunca mostrar prazo vencido como aberto.
        saida.append({
            "id": g("id") or re.sub(r"[^a-z0-9]+", "-", nome.lower()).strip("-"),
            "orgao": g("orgao"), "titulo": nome, "tipo": g("tipo"), "banca": g("banca"),
            "inscricoes_de": de, "inscricoes_ate": ate, "cargos_resumo": g("cargos_resumo"),
            "escolaridade": g("escolaridade"), "edital_url": g("edital_url"),
            "verificado_em": g("verificado_em"), "observacao": g("observacao"),
        })
    ids = [v["id"] for v in saida]
    if len(ids) != len(set(ids)):
        raise ValueError("ids repetidos em vagas_publicas.csv.")
    return saida


def main() -> None:
    df = ler_csv_flex(CATALOGO / "vagas_publicas.csv")
    vagas = validar(df)
    if not vagas:
        print("Nenhuma vaga cadastrada em catalogo/vagas_publicas.csv: o site esconde esta secao.")
        return
    salvar_json({"meta": {"gerado_em": agora_iso(), "aviso": "Confira sempre o edital oficial: prazos mudam por retificacao."},
                 "vagas": vagas}, WEB_DADOS / "vagas.json")
    print("%d registro(s) em web/dados/vagas.json" % len(vagas))


if __name__ == "__main__":
    main()
