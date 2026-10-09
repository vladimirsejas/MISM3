"""Passo 4 - monta o catalogo de servicos (web/dados/servicos.json).

Junta tres origens, sempre marcando de onde veio cada registro:
  * CNES (saude)               - base completa do CNES (pasta com tbEstabelecimento*.csv), via cnes.py
  * Censo Escolar (creches)    - dados/bruto/escolas/microdados_ed_basica_*.csv
  * Catalogo de Escolas do INEP (educacao infantil, SEM afirmar creche) - escolas_inep.py
  * Catalogo manual verificado - catalogo/servicos_manuais.csv (CRAS, Secretaria da Mulher...)

Localizacao: se a fonte traz coordenada valida, usa; senao usa o centro do CEP
(web/dados/cep_indice.json). O campo "geo" diz qual dos dois foi usado, e o site
mostra isso a usuaria. Sem CEP e sem coordenada = "sem_local" (aparece na lista, nao no mapa).

Uso:  python pipeline/servicos.py
"""
from __future__ import annotations

import json
import re
import sys
import unicodedata
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import (BRUTO, CATALOGO, RAIZ, MUNICIPIO_IBGE6, MUNICIPIO_IBGE7, WEB_DADOS, achar_coluna, agora_iso,  # noqa: E402
                    ler_csv_flex, normalizar_cep, salvar_json)

OBJETIVOS = ("trabalhar", "curso", "empreender")
TIPOS = ("creche", "educacao_infantil", "saude", "assistencia", "mulher", "emprego_curso", "mulher_para_mulher")
# Rio Claro/SP fica em aprox. lat -22.4, lon -47.56. Caixa folgada para rejeitar coordenada errada.
CAIXA = (-22.65, -22.2, -47.8, -47.3)


# ------------------------------------------------------------ utilidades
def _norm(s: str) -> str:
    s = unicodedata.normalize("NFKD", str(s)).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "_", s).strip("_")


def coord_valida(lat, lon):
    try:
        la, lo = float(str(lat).replace(",", ".")), float(str(lon).replace(",", "."))
    except (TypeError, ValueError):
        return None
    if CAIXA[0] <= la <= CAIXA[1] and CAIXA[2] <= lo <= CAIXA[3]:
        return round(la, 5), round(lo, 5)
    return None


def localizar(cep, lat, lon, indice: dict):
    """Devolve (lat, lon, nivel_geo)."""
    c = coord_valida(lat, lon)
    if c:
        return c[0], c[1], "coordenada_fonte"
    cepn = normalizar_cep(cep)
    if cepn and cepn in indice:
        return indice[cepn][0], indice[cepn][1], "centroide_cep"
    return None, None, "sem_local"


# Subtipos que sao LUGARES onde a usuaria pode ir. O resto (centrais, ambulancias, vigilancia,
# laboratorio, farmacia...) e estrutura de apoio e nao aparece no site.
SUBTIPOS_PUBLICO = ("ubs", "urgencia", "hospital", "caps", "especialidades")


def subtipo_saude(descricao: str) -> str:
    d = _norm(descricao)
    if any(x in d for x in ("central", "movel", "vigilancia", "laboratorio", "apoio_diagnose", "sadt",
                            "abastecimento", "regulacao", "telessaude", "farmacia", "consultorio_isolado")):
        return "apoio"
    if "caps" in d or "psicossocial" in d:
        return "caps"
    if "pronto" in d or "urgencia" in d or "upa" in d:
        return "urgencia"
    if "hospital" in d:
        return "hospital"
    if "centro_de_saude" in d or "unidade_basica" in d or "ubs" in d or "posto" in d:
        return "ubs"
    if "policlinica" in d or "especialidade" in d:
        return "especialidades"
    return "outros"


# ------------------------------------------------------------ Censo Escolar
def servicos_creches(df, indice: dict, hoje: str) -> list[dict]:
    c_mun = achar_coluna(df.columns, "CO_MUNICIPIO")
    c_cre = achar_coluna(df.columns, "IN_COMUM_CRECHE")
    c_nome = achar_coluna(df.columns, "NO_ENTIDADE")
    c_cod = achar_coluna(df.columns, "CO_ENTIDADE")
    if not (c_mun and c_cre and c_nome):
        raise ValueError("Censo Escolar sem CO_MUNICIPIO/IN_COMUM_CRECHE/NO_ENTIDADE. Colunas: %s" % list(df.columns)[:30])
    c_sit = achar_coluna(df.columns, "TP_SITUACAO_FUNCIONAMENTO")
    c_dep = achar_coluna(df.columns, "TP_DEPENDENCIA")
    c_cep = achar_coluna(df.columns, "CO_CEP")
    c_end = achar_coluna(df.columns, "DS_ENDERECO")
    c_num = achar_coluna(df.columns, "NU_ENDERECO")
    c_bai = achar_coluna(df.columns, "NO_BAIRRO")
    c_tel = achar_coluna(df.columns, "NU_TELEFONE")
    c_lat = achar_coluna(df.columns, "LATITUDE", "NU_LATITUDE")
    c_lon = achar_coluna(df.columns, "LONGITUDE", "NU_LONGITUDE")

    d = df[df[c_mun].astype(str).str.strip() == MUNICIPIO_IBGE7]
    d = d[d[c_cre].astype(str).str.strip() == "1"]
    if c_sit:
        d = d[d[c_sit].astype(str).str.strip() == "1"]  # 1 = em atividade
    dep = {"1": "Federal", "2": "Estadual", "3": "Municipal", "4": "Privada"}
    saida = []
    for _, r in d.iterrows():
        get = lambda c: (r[c] if c and str(r[c]) not in ("nan", "None", "") else None)  # noqa: E731
        lat, lon, geo = localizar(get(c_cep), get(c_lat), get(c_lon), indice)
        end = " ".join(str(x) for x in (get(c_end), get(c_num), get(c_bai)) if x) or None
        saida.append({
            "id": "inep-%s" % (get(c_cod) or _norm(r[c_nome])),
            "tipo": "creche", "subtipo": dep.get(str(get(c_dep)), "n/d").lower(),
            "nome": str(r[c_nome]).title(), "cep": normalizar_cep(get(c_cep)), "endereco": end,
            "telefone": get(c_tel), "horario": None, "lat": lat, "lon": lon, "geo": geo,
            "abrangencia": "local", "fonte": "INEP - Censo Escolar", "fonte_url": "https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/microdados/censo-escolar",
            "verificado_em": hoje,
            "observacao": "Indica que a escola oferta creche. NAO informa vagas livres nem fila: confirme com a Secretaria de Educacao.",
        })
    return saida


# ------------------------------------------------------------ catalogo manual
def servicos_manuais(df, indice: dict) -> list[dict]:
    saida = []
    for _, r in df.iterrows():
        g = lambda c: (None if str(r.get(c, "")) in ("nan", "None", "") else str(r[c]).strip())  # noqa: E731
        tipo = g("tipo")
        if tipo not in TIPOS:
            raise ValueError("Tipo invalido '%s' no catalogo manual (use: %s)" % (tipo, ", ".join(TIPOS)))
        if not g("fonte_url") or not g("verificado_em"):
            raise ValueError("Registro '%s' sem fonte_url/verificado_em: todo item manual precisa de fonte e data." % g("nome"))
        for o in (g("objetivos") or "").split(";"):
            if o and o not in OBJETIVOS:
                raise ValueError("Objetivo invalido '%s' em '%s' (use: %s)" % (o, g("nome"), ", ".join(OBJETIVOS)))
        lat, lon, geo = localizar(g("cep"), g("lat"), g("lon"), indice)
        saida.append({
            "id": g("id") or "man-%s" % _norm(g("nome") or ""), "tipo": tipo, "subtipo": g("subtipo"),
            "nome": g("nome"), "cep": normalizar_cep(g("cep")), "endereco": g("endereco"),
            "telefone": g("telefone"), "horario": g("horario"), "lat": lat, "lon": lon, "geo": geo,
            "abrangencia": g("abrangencia") or "local", "fonte": "Pagina oficial (cadastro manual)",
            "fonte_url": g("fonte_url"), "verificado_em": g("verificado_em"), "observacao": g("observacao"),
            "objetivos": [o for o in (g("objetivos") or "").split(";") if o],
            "gratuito": True if g("gratuito") == "sim" else None,
        })
        if not saida[-1]["objetivos"]:
            del saida[-1]["objetivos"]
        if saida[-1]["gratuito"] is None:
            del saida[-1]["gratuito"]
    return saida


# ------------------------------------------------------------ principal
def montar(indice: dict, cnes=None, escolas=None, manuais=None, hoje: str | None = None, catalogo_escolas=None,
           mulheres=None) -> dict:
    hoje = hoje or agora_iso()
    itens: list[dict] = []
    contagem = {}
    if cnes is not None:  # lista de servicos ja montada por cnes.carregar()
        itens += cnes; contagem["cnes"] = len(cnes)
    if escolas is not None:
        a = servicos_creches(escolas, indice, hoje); itens += a; contagem["creches_inep"] = len(a)
    if catalogo_escolas is not None:
        import escolas_inep
        a = escolas_inep.servicos_escolas(catalogo_escolas, indice, hoje, localizar)
        itens += a; contagem["escolas_catalogo_inep"] = len(a)
    if mulheres is not None:
        import mulher_para_mulher
        a = mulher_para_mulher.validar(mulheres, hoje); itens += a; contagem["mulher_para_mulher"] = len(a)
    if manuais is not None:
        a = servicos_manuais(manuais, indice); itens += a; contagem["manuais"] = len(a)
    vistos, unicos = set(), []
    for s in itens:
        if s["id"] in vistos:
            continue
        vistos.add(s["id"]); unicos.append(s)
    return {"meta": {"gerado_em": hoje, "demo": False, "contagem_por_origem": contagem,
                     "aviso": "Cadastros oficiais podem estar desatualizados. Confirme antes de ir."},
            "servicos": unicos}


def main() -> None:
    import pandas as pd  # noqa: F401

    caminho_idx = WEB_DADOS / "cep_indice.json"
    indice = {}
    if caminho_idx.exists():
        indice = json.loads(caminho_idx.read_text(encoding="utf-8")).get("ceps", {})
    else:
        print("AVISO: cep_indice.json ausente (rode indice_cep.py). Servicos sem coordenada ficarao 'sem_local'.")

    cnes = None
    pasta_cnes = Path(sys.argv[1]) if len(sys.argv) > 1 else next(
        (p for p in (BRUTO / "cnes", RAIZ / "docs" / "cnes") if list(p.glob("tbEstabelecimento*.csv"))), None)
    if pasta_cnes:
        import cnes as modulo_cnes
        cnes, cont = modulo_cnes.carregar(pasta_cnes, indice, agora_iso())
        print("CNES (%s): %s" % (pasta_cnes, cont))
    else:
        print("AVISO: CNES ausente. Coloque a base completa em docs/cnes (ou passe a pasta: python pipeline/servicos.py caminho).")

    escolas = None
    csvs = sorted(set((BRUTO / "escolas").glob("microdados_ed_basica*.csv")) |
                  set((RAIZ / "docs").rglob("microdados_ed_basica*.csv")))
    if csvs:
        escolas = ler_csv_flex(csvs[-1])
    else:
        print("AVISO: Censo Escolar ausente. Coloque microdados_ed_basica_AAAA.csv em docs/educacao (ou dados/bruto/escolas).")

    catalogo_escolas = None
    ce = sorted(set((BRUTO / "escolas").glob("*lista das escolas*.csv")) | set((RAIZ / "docs").rglob("*lista das escolas*.csv")))
    if ce:
        catalogo_escolas = ler_csv_flex(ce[-1])
        print("Catalogo de Escolas do INEP: %s" % ce[-1].name)
    else:
        print("AVISO: Catalogo de Escolas ausente. Coloque o CSV 'Tabela da lista das escolas' em docs/ (ou dados/bruto/escolas).")

    manuais = None
    m = CATALOGO / "servicos_manuais.csv"
    if m.exists():
        manuais = ler_csv_flex(m)

    mulheres = None
    mm = CATALOGO / "mulher_para_mulher.csv"
    if mm.exists():
        mulheres = ler_csv_flex(mm)

    saida = montar(indice, cnes, escolas, manuais, catalogo_escolas=catalogo_escolas, mulheres=mulheres)
    salvar_json(saida, WEB_DADOS / "servicos.json")
    por_tipo, por_geo = {}, {}
    for s in saida["servicos"]:
        por_tipo[s["tipo"]] = por_tipo.get(s["tipo"], 0) + 1
        por_geo[s["geo"]] = por_geo.get(s["geo"], 0) + 1
    print("  por tipo:", por_tipo)
    print("  por localizacao:", por_geo)


if __name__ == "__main__":
    main()
