"""Sugere CEP, coordenada e setor censitário para serviços do catálogo que têm endereço mas não têm CEP.

Usa o CNEFE 2022 do IBGE (o mesmo que o indice_cep.py usa): cada endereço do Censo traz rua, número, CEP,
coordenada e setor. O CNEFE bruto fica SÓ no computador de quem roda (dados/bruto/ está no .gitignore): ele
tem endereços de moradias e não deve ir para o GitHub.

O script SUGERE; quem decide é uma pessoa. Ele nunca altera o catálogo sozinho:

  1. python pipeline/geocodificar_catalogo.py
       grava dados/geocodificacao_proposta.csv (também no .gitignore), uma linha por serviço com endereço e sem
       CEP/coordenada: endereço original, CEP/lat/lon sugeridos, método, quantidade de candidatos, confiança,
       alternativas (quando ambíguo) e a coluna "decisao", vazia.
  2. Uma pessoa revisa a planilha e escreve "aprovar" na coluna decisao das linhas que aceita. Nas linhas
     ambíguas ou sem sugestão, pode digitar o CEP/lat/lon certos e aprovar.
  3. python pipeline/geocodificar_catalogo.py --aplicar-aprovadas
       copia cep/lat/lon das linhas aprovadas para o catálogo (só campos vazios), valida os valores e registra
       o que mudou em dados/geocodificacao_aplicada.csv. Depois: python pipeline/servicos.py --somente-manual

Níveis de confiança: "alta" = mesma rua e mesmo número, um único CEP, pontos a menos de 300 m uns dos outros
(só aqui há lat/lon sugeridos); "baixa" = só CEP (número próximo, ou tipo de rua diferente); "ambigua" = vários
candidatos (as alternativas são listadas, sem coordenadas); "nenhuma" = endereço incompleto ou sem
correspondência. Nunca se inventa coordenada: no número próximo a coordenada seria a de uma casa vizinha, então
não é sugerida.
"""
from __future__ import annotations

import argparse
import csv
import difflib
import re
import sys
import unicodedata
import zipfile
from collections import Counter, defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import (BRUTO, CATALOGO, DADOS, MUNICIPIO_IBGE7, achar_coluna, agora_iso, erro, haversine_m,  # noqa: E402
                    ler_csv_flex, normalizar_cep, para_numero)

DISPERSAO_MAX_M = 300  # pontos do mesmo número de rua mais afastados que isso não são tratados como "exato"

TIPOS = {
    "av": "avenida", "avenida": "avenida", "r": "rua", "rua": "rua", "est": "estrada", "estr": "estrada",
    "estrada": "estrada", "al": "alameda", "alameda": "alameda", "tv": "travessa", "trav": "travessa",
    "travessa": "travessa", "pc": "praca", "pca": "praca", "praca": "praca", "rod": "rodovia",
    "rodovia": "rodovia", "vl": "viela", "viela": "viela",
}


def sem_acento(texto: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", str(texto)) if unicodedata.category(c) != "Mn")


def canon(texto: str) -> str:
    """Forma comparável: sem acento, minúscula, só letras e números, sem zeros à esquerda ('M-9' = 'M 9' = 'm9')."""
    t = re.sub(r"[^a-z0-9]", "", sem_acento(texto).lower())
    return re.sub(r"(?<![0-9])0+(?=[0-9])", "", t)


def tipo_norm(texto: str) -> str | None:
    return TIPOS.get(re.sub(r"[^a-z]", "", sem_acento(texto).lower()))


def interpretar_endereco(endereco: str) -> dict:
    """Separa "Av. 30, 290, Jd. Brasília" em tipo, nome da rua e número. Marca o que não dá para casar sozinho."""
    partes = [p.strip() for p in str(endereco or "").split(",")]
    rua = partes[0] if partes else ""
    if not rua:
        return {"motivo": "sem_endereco"}
    if re.search(r"\b(com|esquina|entre)\b", sem_acento(endereco).lower()) and re.search(r"\b(com|esquina)\b", sem_acento(rua).lower()):
        return {"motivo": "cruzamento"}
    palavras = rua.replace(".", ". ").split()
    tipo = tipo_norm(palavras[0]) if palavras else None
    nome = " ".join(palavras[1:]) if tipo else rua
    numero = None
    if len(partes) > 1:
        # aceita "290", "nº 51", "1134 - Recanto Paraíso" e "30 (anexo ao Centro)"; recusa "s/n" e "entre as avenidas"
        m = re.match(r"(?:n[º°o.]*\s*)?(\d+)(?!\d)", partes[1].strip(), flags=re.I)
        if m:
            numero = int(m.group(1))
    if not tipo or not nome:
        return {"motivo": "rua_sem_tipo"}
    return {"tipo": tipo, "nome": canon(nome), "numero": numero, "motivo": "" if numero is not None else "sem_numero"}


def indexar_cnefe(df, municipio: str = MUNICIPIO_IBGE7) -> dict:
    """{(tipo, nome canônico): [(numero|None, lat, lon, cep, setor, rua)]} só do município."""
    c = {n: achar_coluna(df.columns, n) for n in (
        "COD_MUNICIPIO", "NOM_TIPO_SEGLOGR", "NOM_TITULO_SEGLOGR", "NOM_SEGLOGR", "NUM_ENDERECO", "CEP",
        "LATITUDE", "LONGITUDE", "COD_SETOR")}
    faltando = [n for n in ("NOM_TIPO_SEGLOGR", "NOM_SEGLOGR", "NUM_ENDERECO", "LATITUDE", "LONGITUDE") if not c[n]]
    if faltando:
        raise ValueError("Colunas ausentes no CNEFE: %s. Encontradas: %s" % (faltando, list(df.columns)[:40]))
    if c["COD_MUNICIPIO"]:
        df = df[df[c["COD_MUNICIPIO"]].astype(str).str.strip().str[:7] == municipio]
    if df.empty:
        raise ValueError("Nenhum endereço do município %s no arquivo." % municipio)
    lat = para_numero(df[c["LATITUDE"]])
    lon = para_numero(df[c["LONGITUDE"]])
    num = para_numero(df[c["NUM_ENDERECO"]])
    indice: dict = defaultdict(list)
    registros = df.to_dict("records")
    for linha, la, lo, n in zip(registros, lat, lon, num):
        if la != la or lo != lo:  # NaN
            continue
        tipo_bruto = linha[c["NOM_TIPO_SEGLOGR"]]
        tipo = tipo_norm(tipo_bruto) or canon(tipo_bruto)
        titulo = linha[c["NOM_TITULO_SEGLOGR"]] if c["NOM_TITULO_SEGLOGR"] else ""
        titulo = "" if titulo != titulo or titulo is None else str(titulo)
        nome = canon("%s %s" % (titulo, linha[c["NOM_SEGLOGR"]]))
        cep = normalizar_cep(linha[c["CEP"]]) if c["CEP"] else None
        setor = str(linha[c["COD_SETOR"]]).strip() if c["COD_SETOR"] else ""
        rua = " ".join(x for x in (str(tipo_bruto), titulo, str(linha[c["NOM_SEGLOGR"]])) if x.strip() and x != "nan")
        indice[(tipo, nome)].append((int(n) if n == n and n > 0 else None, float(la), float(lo), cep, setor, rua))
    return indice


VAZIO = {"metodo": "", "confianca": "nenhuma", "candidatos": 0, "cep": "", "lat": "", "lon": "", "setor": "",
         "registros": "", "rua_cnefe": "", "numero_cnefe": "", "alternativas": "", "situacao": "pendente",
         "observacao": ""}
# Rio Claro (malha do IBGE) com folga de ~5 km: valores fora disso na planilha revisada são recusados
CAIXA_RIO_CLARO = (-22.60, -22.20, -47.82, -47.41)  # lat_min, lat_max, lon_min, lon_max
APROVADOS = ("aprovar", "aprovado", "sim")


def _res(**kw) -> dict:
    r = dict(VAZIO)
    r.update(kw)
    return r


def _parecidas(nome: str, indice: dict, n: int = 3) -> str:
    """Nomes de rua do CNEFE mais parecidos com o procurado (só nomes de rua, nunca números nem coordenadas)."""
    exibicao = {}
    for (_tipo, canonico), regs in indice.items():
        exibicao.setdefault(canonico, regs[0][5])
    achados = difflib.get_close_matches(nome, list(exibicao), n=n, cutoff=0.6)
    return "; ".join(exibicao[a] for a in achados)


def _alt_ceps(regs) -> str:
    por_cep = Counter(r[3] or "(sem CEP)" for r in regs)
    return "; ".join("CEP %s (%d registro%s)" % (c, n, "" if n == 1 else "s") for c, n in sorted(por_cep.items()))


def casar(endereco: str, indice: dict) -> dict:
    """Compara um endereço do catálogo com o CNEFE e devolve a sugestão, o método, os candidatos e a confiança."""
    e = interpretar_endereco(endereco)
    if e.get("motivo") in ("sem_endereco", "cruzamento", "rua_sem_tipo"):
        return _res(metodo="endereco_incompleto", observacao={
            "sem_endereco": "Serviço sem endereço no catálogo.",
            "cruzamento": "Endereço dado como esquina/cruzamento: localizar à mão.",
            "rua_sem_tipo": "Não deu para separar tipo e nome da rua: localizar à mão."}[e["motivo"]])

    regs = indice.get((e["tipo"], e["nome"]))
    tipo_diferente = False
    if not regs:
        # mesmo nome de rua com outro tipo (ex.: "Rua" no catálogo, "AVENIDA" no IBGE)
        achadas = {t: v for (t, n), v in indice.items() if n == e["nome"]}
        if not achadas:
            parecidas = _parecidas(e["nome"], indice)
            return _res(metodo="sem_correspondencia", alternativas=parecidas,
                        observacao="Nenhuma rua com esse nome no CNEFE: localizar à mão."
                                   + (" Nomes parecidos em 'alternativas' (só para conferir)." if parecidas else ""))
        if len(achadas) > 1:
            return _res(metodo="rua_ambigua", confianca="ambigua", candidatos=len(achadas),
                        alternativas="; ".join(sorted(Counter(r[5] for v in achadas.values() for r in v))),
                        observacao="O nome da rua existe com mais de um tipo no CNEFE: escolher à mão.")
        regs, tipo_diferente = next(iter(achadas.values())), True
    rua = Counter(r[5] for r in regs).most_common(1)[0][0]
    if e["numero"] is None:
        return _res(metodo="rua_sem_numero", rua_cnefe=rua,
                    observacao="Endereço sem número (s/n): a rua existe no CNEFE, mas o ponto precisa ser dado à mão.")

    exatos = [r for r in regs if r[0] == e["numero"]]
    if not exatos:
        com_numero = [r for r in regs if r[0] is not None]
        if not com_numero:
            return _res(metodo="rua_sem_numeros", rua_cnefe=rua,
                        observacao="A rua existe no CNEFE, mas sem números: localizar à mão.")
        n_prox = min(com_numero, key=lambda r: abs(r[0] - e["numero"]))[0]
        prox = [r for r in com_numero if r[0] == n_prox]
        ceps = sorted({r[3] for r in prox if r[3]})
        msg = ("Número %d não existe no CNEFE; o mais próximo é %d (diferença de %d). Sugerido só o CEP: a coordenada "
               "seria a de uma moradia vizinha." % (e["numero"], n_prox, abs(n_prox - e["numero"])))
        if len(ceps) == 1:
            return _res(metodo="numero_proximo", confianca="baixa", candidatos=1, cep=ceps[0], situacao="sugestao",
                        rua_cnefe=rua, numero_cnefe=n_prox, observacao=msg)
        return _res(metodo="numero_proximo", confianca="ambigua" if ceps else "nenhuma", candidatos=len(ceps),
                    alternativas=_alt_ceps(prox), rua_cnefe=rua, numero_cnefe=n_prox, observacao=msg)

    grupos = defaultdict(list)
    for r in exatos:
        grupos[r[3] or ""].append(r)
    if len(grupos) > 1:
        return _res(metodo="rua_numero_exatos", confianca="ambigua", candidatos=len(grupos), rua_cnefe=rua,
                    numero_cnefe=e["numero"], registros=len(exatos), alternativas=_alt_ceps(exatos),
                    observacao="O mesmo número aparece com mais de um CEP (a mesma rua pode existir em outro bairro ou "
                               "distrito): escolher à mão. Sem coordenada sugerida.")
    lat = sum(r[1] for r in exatos) / len(exatos)
    lon = sum(r[2] for r in exatos) / len(exatos)
    dispersao = max(haversine_m(lat, lon, r[1], r[2]) for r in exatos)
    cep = next(iter(grupos)) or ""
    setor = (Counter(r[4] for r in exatos if r[4]).most_common(1) or [("", 0)])[0][0]
    comum = dict(candidatos=1, rua_cnefe=rua, numero_cnefe=e["numero"], registros=len(exatos), setor=setor, cep=cep)
    if tipo_diferente:
        return _res(metodo="rua_numero_tipo_diferente", confianca="baixa", situacao="sugestao", **comum,
                    observacao="A rua tem o mesmo nome, mas outro tipo no CNEFE (%s): conferir. Sugerido só o CEP." % rua)
    if dispersao > DISPERSAO_MAX_M:
        return _res(metodo="rua_numero_exatos", confianca="baixa", situacao="sugestao", **comum,
                    observacao="Pontos do mesmo número a até %d m uns dos outros: sugerido só o CEP." % dispersao)
    return _res(metodo="rua_numero_exatos", confianca="alta", situacao="sugestao", lat="%.6f" % lat, lon="%.6f" % lon,
                **comum)


def ler_cnefe(caminho: Path):
    if caminho.suffix.lower() == ".zip":
        with zipfile.ZipFile(caminho) as z:
            nomes = [n for n in z.namelist() if n.lower().endswith(".csv")]
            if not nomes:
                raise ValueError("Nenhum CSV dentro de %s" % caminho)
            return ler_csv_flex(z.read(nomes[0]))
    return ler_csv_flex(caminho)


CAMPOS_PROPOSTA = ["id", "nome", "endereco_catalogo", "situacao", "confianca", "metodo", "candidatos", "cep", "lat",
                   "lon", "setor", "registros", "rua_cnefe", "numero_cnefe", "alternativas", "observacao", "decisao"]


def propor(linhas: list[dict], indice: dict) -> list[dict]:
    """Uma sugestão por serviço que tem endereço e ainda não tem CEP nem coordenada. Não altera as linhas."""
    saida = []
    for s in linhas:
        if not (s.get("endereco") or "").strip():
            continue
        if (s.get("cep") or "").strip() and (s.get("lat") or "").strip() and (s.get("lon") or "").strip():
            continue
        saida.append({"id": s["id"], "nome": s["nome"], "endereco_catalogo": s["endereco"], "decisao": "",
                      **casar(s["endereco"], indice)})
    return saida


def _valida(campo: str, valor: str) -> str:
    """Devolve o valor normalizado ou levanta ValueError (valor da planilha revisada que não faz sentido)."""
    valor = (valor or "").strip()
    if not valor:
        return ""
    if campo == "cep":
        # digitado por uma pessoa: tem que ter 8 dígitos (normalizar_cep completaria "123" com zeros à esquerda)
        cep = normalizar_cep(valor) if len(re.sub(r"\D", "", valor)) == 8 else None
        if not cep:
            raise ValueError("CEP inválido: %r" % valor)
        return cep
    numero = float(valor.replace(",", "."))
    lo, hi = (CAIXA_RIO_CLARO[0], CAIXA_RIO_CLARO[1]) if campo == "lat" else (CAIXA_RIO_CLARO[2], CAIXA_RIO_CLARO[3])
    if not lo <= numero <= hi:
        raise ValueError("%s fora de Rio Claro: %s" % (campo, valor))
    return "%.6f" % numero


def aplicar_aprovadas(catalogo: Path, planilha: Path, registro: Path | None = None) -> tuple[list[dict], list[str]]:
    """Copia cep/lat/lon das linhas com decisao='aprovar' para o catálogo, só nos campos vazios.

    Devolve (mudanças, avisos). Valores inválidos ou fora de Rio Claro não são aplicados e geram aviso.
    """
    with planilha.open(encoding="utf-8", newline="") as f:
        aprovadas = [r for r in csv.DictReader(f) if (r.get("decisao") or "").strip().lower() in APROVADOS]
    with catalogo.open(encoding="utf-8", newline="") as f:
        leitor = csv.DictReader(f)
        campos = leitor.fieldnames
        linhas = list(leitor)
    por_id = {s["id"]: s for s in linhas}
    mudancas, avisos = [], []
    for r in aprovadas:
        s = por_id.get(r["id"])
        if s is None:
            avisos.append("%s: id não existe no catálogo; ignorado." % r["id"])
            continue
        try:
            novos = {c: _valida(c, r.get(c, "")) for c in ("cep", "lat", "lon")}
        except ValueError as e:
            avisos.append("%s: %s; linha ignorada." % (r["id"], e))
            continue
        if bool(novos["lat"]) != bool(novos["lon"]):
            avisos.append("%s: lat e lon precisam vir juntas; linha ignorada." % r["id"])
            continue
        for campo, valor in novos.items():
            if valor and not (s.get(campo) or "").strip():
                s[campo] = valor
                mudancas.append({"id": r["id"], "campo": campo, "valor": valor, "metodo": r.get("metodo", ""),
                                 "confianca": r.get("confianca", ""), "aplicado_em": agora_iso()})
            elif valor and (s.get(campo) or "").strip() != valor:
                avisos.append("%s: %s já preenchido no catálogo (%s); mantido." % (r["id"], campo, s[campo]))
    if mudancas:
        with catalogo.open("w", encoding="utf-8", newline="") as f:
            w = csv.DictWriter(f, fieldnames=campos, lineterminator="\n")
            w.writeheader()
            w.writerows(linhas)
        if registro is not None:
            novo = not registro.exists()
            with registro.open("a", encoding="utf-8", newline="") as f:
                w = csv.DictWriter(f, fieldnames=list(mudancas[0]), lineterminator="\n")
                if novo:
                    w.writeheader()
                w.writerows(mudancas)
    return mudancas, avisos


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--cnefe", type=Path, default=BRUTO / "cnefe" / "3543907_RIO_CLARO.zip")
    ap.add_argument("--catalogo", type=Path, default=CATALOGO / "servicos_manuais.csv")
    ap.add_argument("--saida", type=Path, default=DADOS / "geocodificacao_proposta.csv")
    ap.add_argument("--aplicar-aprovadas", nargs="?", const=True, default=False, metavar="PLANILHA",
                    help="copia para o catálogo as linhas com decisao=aprovar (por padrão, a planilha de --saida); "
                         "não lê o CNEFE")
    a = ap.parse_args()
    if a.aplicar_aprovadas:
        planilha = a.saida if a.aplicar_aprovadas is True else Path(a.aplicar_aprovadas)
        if not planilha.exists():
            erro("Planilha não encontrada: %s" % planilha)
        mud, avisos = aplicar_aprovadas(a.catalogo, planilha, a.saida.with_name("geocodificacao_aplicada.csv"))
        for aviso in avisos:
            print("AVISO:", aviso)
        print("%d campos gravados em %s. Rode: python pipeline/servicos.py --somente-manual" % (len(mud), a.catalogo))
        return 0
    if not a.cnefe.exists():
        erro("CNEFE não encontrado em %s. Rode python pipeline/baixar.py cnefe ou passe --cnefe." % a.cnefe)
    try:
        indice = indexar_cnefe(ler_cnefe(a.cnefe))
    except ValueError as e:
        erro(str(e))
    with a.catalogo.open(encoding="utf-8", newline="") as f:
        linhas = list(csv.DictReader(f))
    propostas = propor(linhas, indice)
    a.saida.parent.mkdir(parents=True, exist_ok=True)
    with a.saida.open("w", encoding="utf-8", newline="") as f:
        g = csv.DictWriter(f, fieldnames=CAMPOS_PROPOSTA, lineterminator="\n")
        g.writeheader()
        g.writerows(propostas)
    print("Sugestões gravadas em %s (%d serviços). O catálogo NÃO foi alterado." % (a.saida, len(propostas)))
    for (conf, met), n in sorted(Counter((p["confianca"], p["metodo"]) for p in propostas).items()):
        print("  %-8s %-26s %d" % (conf, met, n))
    print("Revise a planilha, escreva 'aprovar' na coluna decisao e rode com --aplicar-aprovadas.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
