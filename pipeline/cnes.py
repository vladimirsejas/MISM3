"""Passo - estabelecimentos de saude de Rio Claro a partir da BASE COMPLETA DO CNES (DATASUS).

Entrada: a pasta com os CSVs da base completa (ex.: docs/cnes), em especial
    tbEstabelecimento<AAAAMM>.csv   (estabelecimentos, ~290 MB, base nacional)
    tbTipoUnidade<AAAAMM>.csv       (codigo do tipo -> nome do tipo)
    tbTurnoAtendimento<AAAAMM>.csv  (codigo do turno -> descricao)

Decisoes de privacidade e qualidade:
  * Le SO as colunas necessarias (usecols). As colunas de CPF/CNPJ de pessoas NUNCA sao carregadas.
  * Le em blocos e filtra Rio Claro durante a leitura (nao carrega o Brasil inteiro).
  * Por padrao inclui so estabelecimentos publicos (natureza juridica iniciada em 1) e sem fins
    lucrativos (iniciada em 3). Consultorios e clinicas privadas ficam de fora.
  * Estabelecimento com "motivo de desabilitacao" preenchido e tratado como inativo (a conferir
    com o diagnostico).

Uso:
    python pipeline/cnes.py docs/cnes --diagnostico   # so contagens, para conferir as regras
    (o servicos.py chama este modulo para montar o catalogo)
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import MUNICIPIO_IBGE6, normalizar_cep, para_numero  # noqa: E402

COLUNAS = ["CO_UNIDADE", "CO_CNES", "NO_FANTASIA", "NO_LOGRADOURO", "NU_ENDERECO", "NO_BAIRRO", "CO_CEP",
           "NU_TELEFONE", "CO_NATUREZA_JUR", "CO_TIPO_UNIDADE", "CO_MUNICIPIO_GESTOR", "NU_LATITUDE",
           "NU_LONGITUDE", "CO_MOTIVO_DESAB", "CO_TURNO_ATENDIMENTO", "TP_UNIDADE", "CO_TIPO_ESTABELECIMENTO",
           "CO_ATIVIDADE_PRINCIPAL"]
PREFIXOS_NATUREZA = ("1", "3")  # 1 = administracao publica; 3 = entidades sem fins lucrativos
BLOCO = 200_000


def achar_arquivo(pasta: Path, prefixo: str) -> Path | None:
    achados = sorted(Path(pasta).glob(prefixo + "*.csv"))
    return achados[-1] if achados else None


def detectar_encoding(caminho: Path) -> str:
    with open(caminho, "rb") as f:
        amostra = f.read(2 * 1024 * 1024)
    try:
        amostra.decode("utf-8")
        return "utf-8-sig"
    except UnicodeDecodeError:
        return "latin-1"


def ler_tabela_pequena(caminho: Path | None, col_codigo: str, col_texto: str) -> dict[str, str]:
    import pandas as pd

    if not caminho:
        return {}
    df = pd.read_csv(caminho, sep=";", dtype=str, encoding=detectar_encoding(caminho))
    if col_codigo not in df.columns or col_texto not in df.columns:
        return {}
    return {str(c).strip(): str(t).strip() for c, t in zip(df[col_codigo], df[col_texto])}


def ler_estabelecimentos(caminho: Path, ceps_do_municipio: set[str] | None = None):
    """Devolve DataFrame (so Rio Claro) lendo em blocos. Filtro: gestor = 354390 OU CEP no indice."""
    import pandas as pd

    enc = detectar_encoding(caminho)
    cab = pd.read_csv(caminho, sep=";", dtype=str, encoding=enc, nrows=0).columns
    faltam = [c for c in ("CO_UNIDADE", "NO_FANTASIA", "CO_CEP", "CO_MUNICIPIO_GESTOR") if c not in cab]
    if faltam:
        raise ValueError("tbEstabelecimento sem colunas %s. Colunas: %s" % (faltam, list(cab)))
    usar = [c for c in COLUNAS if c in cab]
    partes = []
    for bloco in pd.read_csv(caminho, sep=";", dtype=str, encoding=enc, usecols=usar, chunksize=BLOCO,
                             on_bad_lines="skip"):
        gestor = bloco["CO_MUNICIPIO_GESTOR"].fillna("").str.strip().str[:6] == MUNICIPIO_IBGE6
        if ceps_do_municipio:
            cep_ok = bloco["CO_CEP"].map(normalizar_cep).isin(ceps_do_municipio)
            partes.append(bloco[gestor | cep_ok])
        else:
            partes.append(bloco[gestor])
    return pd.concat(partes, ignore_index=True) if partes else pd.DataFrame(columns=usar)


def filtrar(df, prefixos=PREFIXOS_NATUREZA):
    """Aplica as regras de inclusao e devolve (df_filtrado, contagens)."""
    cont = {"rio_claro_total": len(df)}
    nat = df["CO_NATUREZA_JUR"].fillna("").str.strip() if "CO_NATUREZA_JUR" in df else None
    if nat is not None:
        df = df[nat.str[:1].isin(prefixos)]
    cont["publicos_ou_sem_fins"] = len(df)
    if "CO_MOTIVO_DESAB" in df:
        desab = df["CO_MOTIVO_DESAB"].fillna("").str.strip()
        ativos = desab.isin(["", "0", "00"])
        cont["marcados_desabilitados"] = int((~ativos).sum())
        df = df[ativos]
    cont["incluidos"] = len(df)
    return df, cont


def chave(v) -> str:
    """Normaliza codigos: '02' e '2' viram a mesma chave; vazio/NaN vira ''."""
    s = str(v if v is not None else "").strip()
    if s.lower() == "nan":
        return ""
    return s.lstrip("0") or ("0" if s else "")


def descricao_tipo(r: dict, tipos_unidade: dict, tipos_estab: dict) -> str:
    """Nome do tipo de unidade. Tenta CO_TIPO_UNIDADE, depois TP_UNIDADE, depois CO_TIPO_ESTABELECIMENTO."""
    for col, tabela in (("CO_TIPO_UNIDADE", tipos_unidade), ("TP_UNIDADE", tipos_unidade),
                        ("CO_TIPO_ESTABELECIMENTO", tipos_estab)):
        k = chave(r.get(col))
        if k and k in tabela:
            return tabela[k]
    return ""


def normaliza_tabela(d: dict) -> dict:
    return {chave(k): v for k, v in d.items()}


def montar_servicos(df, indice: dict, tipos: dict, turnos: dict, hoje: str, tipos_estab: dict | None = None) -> list[dict]:
    from servicos import localizar, subtipo_saude  # import tardio: servicos importa este modulo

    tipos, turnos, tipos_estab = normaliza_tabela(tipos), normaliza_tabela(turnos), normaliza_tabela(tipos_estab or {})
    df = df.fillna("")  # campos em branco viram texto vazio (evita NaN em .strip())
    saida = []
    for r in df.to_dict("records"):
        nome = (r.get("NO_FANTASIA") or "").strip()
        if not nome:
            continue
        cep = r.get("CO_CEP")
        lat, lon, geo = localizar(cep, para_numero_escalar(r.get("NU_LATITUDE")),
                                  para_numero_escalar(r.get("NU_LONGITUDE")), indice)
        tipo_desc = descricao_tipo(r, tipos, tipos_estab)
        turno = turnos.get(chave(r.get("CO_TURNO_ATENDIMENTO")))
        end = " ".join(x.strip() for x in (r.get("NO_LOGRADOURO"), r.get("NU_ENDERECO"), r.get("NO_BAIRRO"))
                       if x and str(x).strip()) or None
        saida.append({
            "id": "cnes-%s" % (r.get("CO_CNES") or r.get("CO_UNIDADE")),
            "tipo": "saude", "subtipo": subtipo_saude(tipo_desc), "nome": nome.title(),
            "cep": normalizar_cep(cep), "endereco": end,
            "telefone": (r.get("NU_TELEFONE") or "").strip() or None,
            "horario": ("Turno informado ao CNES: %s" % turno) if turno else None,
            "lat": lat, "lon": lon, "geo": geo, "abrangencia": "local",
            "fonte": "CNES/DATASUS (base completa)", "fonte_url": "https://cnes.datasus.gov.br/", "verificado_em": hoje,
            "observacao": "Tipo de unidade: %s. Cadastro nacional; confirme horario e atendimento com a unidade." % (tipo_desc.title() or "n/d"),
        })
    return saida


def para_numero_escalar(v):
    if v is None or str(v).strip() == "":
        return None
    return str(v).strip().replace(",", ".")


def carregar(pasta: Path, indice: dict, hoje: str) -> tuple[list[dict], dict]:
    arq = achar_arquivo(pasta, "tbEstabelecimento")
    if not arq:
        raise FileNotFoundError("tbEstabelecimento*.csv nao encontrado em %s" % pasta)
    tipos = ler_tabela_pequena(achar_arquivo(pasta, "tbTipoUnidade"), "CO_TIPO_UNIDADE", "DS_TIPO_UNIDADE")
    turnos = ler_tabela_pequena(achar_arquivo(pasta, "tbTurnoAtendimento"), "CO_TURNO_ATENDIMENTO", "DS_TURNO_ATENDIMENTO")
    tipos_estab = ler_tabela_pequena(achar_arquivo(pasta, "tbTipoEstabelecimento"), "CO_TIPO_ESTABELECIMENTO", "DS_TIPO_ESTABELECIMENTO")
    df = ler_estabelecimentos(arq, set(indice) if indice else None)
    df, cont = filtrar(df)
    todos = montar_servicos(df, indice, tipos, turnos, hoje, tipos_estab)
    from servicos import SUBTIPOS_PUBLICO

    publicos = [x for x in todos if x["subtipo"] in SUBTIPOS_PUBLICO]
    cont["fora_do_site_apoio_ou_outros"] = len(todos) - len(publicos)
    cont["no_site"] = len(publicos)
    return publicos, cont


def diagnostico(pasta: Path, indice: dict) -> None:
    """Imprime SO contagens agregadas (nenhum nome de estabelecimento)."""
    import collections

    arq = achar_arquivo(pasta, "tbEstabelecimento")
    if not arq:
        print("tbEstabelecimento*.csv nao encontrado em %s" % pasta)
        return
    tipos = ler_tabela_pequena(achar_arquivo(pasta, "tbTipoUnidade"), "CO_TIPO_UNIDADE", "DS_TIPO_UNIDADE")
    mun = ler_tabela_pequena(achar_arquivo(pasta, "tbMunicipio"), "CO_MUNICIPIO", "NO_MUNICIPIO")
    print("Arquivo: %s (codificacao %s)" % (arq.name, detectar_encoding(arq)))
    print("Municipio %s na tbMunicipio: %s" % (MUNICIPIO_IBGE6, mun.get(MUNICIPIO_IBGE6, "(nao encontrado)")))
    df = ler_estabelecimentos(arq, set(indice) if indice else None)
    print("Estabelecimentos de Rio Claro (gestor %s%s): %d" % (MUNICIPIO_IBGE6, " ou CEP do indice" if indice else "", len(df)))
    if df.empty:
        return
    gest = df["CO_MUNICIPIO_GESTOR"].fillna("").str.strip().str[:6].value_counts().head(5).to_dict()
    print("Gestores encontrados:", gest)
    print("Natureza juridica (1o digito):", df["CO_NATUREZA_JUR"].fillna("").str.strip().str[:1].value_counts().to_dict())
    print("Motivo de desabilitacao (valores):", df["CO_MOTIVO_DESAB"].fillna("(vazio)").str.strip().replace("", "(vazio)").value_counts().head(8).to_dict())
    filtrado, cont = filtrar(df)
    print("Apos regras:", cont)
    tipos, tipos_estab = normaliza_tabela(tipos), normaliza_tabela(
        ler_tabela_pequena(achar_arquivo(pasta, "tbTipoEstabelecimento"), "CO_TIPO_ESTABELECIMENTO", "DS_TIPO_ESTABELECIMENTO"))
    print("Preenchimento das colunas de tipo (nos incluidos):")
    for col in ("CO_TIPO_UNIDADE", "TP_UNIDADE", "CO_TIPO_ESTABELECIMENTO", "CO_ATIVIDADE_PRINCIPAL"):
        if col in filtrado:
            print("   %-26s %d de %d preenchidos" % (col, int((filtrado[col].fillna("").str.strip() != "").sum()), len(filtrado)))
    from servicos import SUBTIPOS_PUBLICO, subtipo_saude
    registros = filtrado.fillna("").to_dict("records")
    c = collections.Counter(descricao_tipo(r, tipos, tipos_estab) or "(sem descricao)" for r in registros)
    print("Tipos incluidos (nome do tipo):")
    for nome, n in c.most_common(25):
        print("   %4d  %s" % (n, nome))
    cls = collections.Counter(subtipo_saude(descricao_tipo(r, tipos, tipos_estab)) for r in registros)
    print("Classificacao:", dict(cls))
    print("Vao para o site (%s): %d | ficam de fora (apoio/outros): %d" % (
        ", ".join(SUBTIPOS_PUBLICO), sum(v for k, v in cls.items() if k in SUBTIPOS_PUBLICO),
        sum(v for k, v in cls.items() if k not in SUBTIPOS_PUBLICO)))
    lat = para_numero(filtrado["NU_LATITUDE"].fillna(""))
    print("Com latitude valida: %d de %d" % (int(lat.notna().sum()), len(filtrado)))
    print("Com CEP valido: %d de %d" % (int(filtrado["CO_CEP"].map(normalizar_cep).notna().sum()), len(filtrado)))


def main() -> None:
    import json

    from common import WEB_DADOS, erro

    if len(sys.argv) < 2:
        erro("Uso: python pipeline/cnes.py docs/cnes --diagnostico")
    pasta = Path(sys.argv[1])
    idx_arq = WEB_DADOS / "cep_indice.json"
    indice = json.loads(idx_arq.read_text(encoding="utf-8")).get("ceps", {}) if idx_arq.exists() else {}
    if not indice:
        print("AVISO: sem cep_indice.json; filtrando so pelo municipio gestor.")
    diagnostico(pasta, indice)


if __name__ == "__main__":
    main()
