"""Catalogo de Escolas do INEP (exportacao do portal) -> servicos do tipo "educacao_infantil".

A exportacao analisada tem 142 registros de Rio Claro (ver docs/inventario_de_fontes.md).
Regras que protegem a usuaria de informacao errada:
  * so entra escola que oferece Educacao Infantil (a etapa vem escrita no proprio arquivo);
  * escola paralisada ou que atende exclusivamente alunos com deficiencia fica de fora;
  * NUNCA se diz que a escola tem creche: o arquivo nao tem esse campo. Para creche use o Censo Escolar.

Os nomes das colunas do portal mudam; por isso a busca e tolerante (sem acento, por trecho do nome)
e, se faltar uma coluna essencial, o erro lista as colunas encontradas.
"""
from __future__ import annotations

import re
import unicodedata

from common import MUNICIPIO_NOME, normalizar_cep


def _sem_acento(s) -> str:
    return unicodedata.normalize("NFKD", str(s)).encode("ascii", "ignore").decode().lower().strip()


def _achar(colunas, *trechos: str):
    """Primeira coluna cujo nome (sem acento) contem algum dos trechos, na ordem dos trechos."""
    norm = [(c, _sem_acento(c)) for c in colunas]
    for t in trechos:
        for original, n in norm:
            if t in n:
                return original
    return None


def _vazio(v) -> bool:
    return v is None or str(v).strip() in ("", "nan", "None")


def servicos_escolas(df, indice: dict, hoje: str, localizar) -> list[dict]:
    """localizar(cep, lat, lon, indice) -> (lat, lon, geo): vem de servicos.py (evita import circular)."""
    c_cod = _achar(df.columns, "codigo inep", "co_entidade", "codigo")
    c_nome = _achar(df.columns, "escola", "nome", "no_entidade")
    c_etapa = _achar(df.columns, "etapa", "modalidade")
    if not (c_nome and c_etapa):
        raise ValueError("Catalogo de escolas sem coluna de nome/etapa. Colunas encontradas: %s" % list(df.columns))
    c_status = _achar(df.columns, "restricao", "situacao", "status")
    c_rede = _achar(df.columns, "dependencia", "rede")
    c_end = _achar(df.columns, "endereco")
    c_cep = _achar(df.columns, "cep")
    c_tel = _achar(df.columns, "telefone", "fone")
    c_lat = _achar(df.columns, "latitude")
    c_lon = _achar(df.columns, "longitude")
    c_mun = _achar(df.columns, "municipio")

    saida = []
    for _, r in df.iterrows():
        get = lambda c: (None if (not c or _vazio(r[c])) else str(r[c]).strip())  # noqa: E731
        if c_mun and get(c_mun) and _sem_acento(get(c_mun)) != _sem_acento(MUNICIPIO_NOME):
            continue
        status = _sem_acento(get(c_status) or "")
        if "paralis" in status or "extint" in status or "exclusivamente" in status:
            continue
        if "infantil" not in _sem_acento(get(c_etapa) or ""):
            continue
        rede = _sem_acento(get(c_rede) or "")
        subtipo = next((x for x in ("municipal", "estadual", "federal", "privada") if x in rede), None)
        lat, lon, geo = localizar(get(c_cep), get(c_lat), get(c_lon), indice)
        cod = re.sub(r"\D", "", get(c_cod) or "")
        nome = get(c_nome)
        saida.append({
            "id": "esc-%s" % (cod or re.sub(r"[^a-z0-9]+", "_", _sem_acento(nome))),
            "tipo": "educacao_infantil", "subtipo": subtipo, "nome": nome.title(),
            "cep": normalizar_cep(get(c_cep)), "endereco": get(c_end), "telefone": get(c_tel), "horario": None,
            "lat": lat, "lon": lon, "geo": geo, "abrangencia": "local",
            "fonte": "INEP - Catalogo de Escolas",
            "fonte_url": "https://inepdata.inep.gov.br/",
            "verificado_em": hoje,
            "observacao": "O cadastro indica Educação Infantil entre as etapas. NAO informa se atende creche (0 a 3 anos), "
                          "vagas nem horário: confirme com a escola ou com a Secretaria de Educação.",
        })
    return saida
