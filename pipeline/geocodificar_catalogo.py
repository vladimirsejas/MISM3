"""Propõe CEP, latitude, longitude e setor censitário para serviços do catálogo que têm endereço mas não têm CEP.

Usa o CNEFE 2022 do IBGE (o mesmo que o indice_cep.py usa): cada endereço do Censo traz rua, número, CEP,
coordenada e setor. Casando "tipo + nome da rua + número" do catálogo com o CNEFE, o serviço ganha uma
coordenada oficial, sem inventar nada e sem pagar a base dos Correios.

O script PROPÕE, não decide: grava uma planilha de revisão. Só com --aplicar ele escreve no catálogo, e apenas
nos casos "exato" (número encontrado na mesma rua, com os pontos a menos de 300 m uns dos outros) e apenas
nos campos que estão vazios. Número próximo, rua não encontrada, cruzamento e "s/n" ficam para revisão humana.

Uso (dentro da pasta do projeto):
    python pipeline/geocodificar_catalogo.py                 # só gera dados/geocodificacao_proposta.csv
    python pipeline/geocodificar_catalogo.py --aplicar       # grava lat, lon e cep dos casos "exato"
    python pipeline/servicos.py --somente-manual             # regera o JSON do site depois de aplicar

Privacidade: a saída traz só dados de serviços públicos (que já estão no catálogo). Nenhum endereço de
moradia do CNEFE é gravado.
"""
from __future__ import annotations

import argparse
import csv
import re
import sys
import unicodedata
import zipfile
from collections import Counter, defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import (BRUTO, CATALOGO, DADOS, MUNICIPIO_IBGE7, achar_coluna, erro, haversine_m,  # noqa: E402
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


def casar(endereco: str, indice: dict) -> dict:
    """Devolve {qualidade, rua_cnefe, numero_cnefe, cep, lat, lon, setor, registros, observacao}."""
    base = {"qualidade": "", "rua_cnefe": "", "numero_cnefe": "", "cep": "", "lat": "", "lon": "", "setor": "",
            "registros": "", "observacao": ""}
    e = interpretar_endereco(endereco)
    if e.get("motivo") in ("sem_endereco", "cruzamento", "rua_sem_tipo"):
        base["qualidade"] = e["motivo"]
        base["observacao"] = {"sem_endereco": "Serviço sem endereço no catálogo.",
                              "cruzamento": "Endereço dado como esquina/cruzamento: localizar à mão.",
                              "rua_sem_tipo": "Não deu para separar tipo e nome da rua: localizar à mão."}[e["motivo"]]
        return base
    regs = indice.get((e["tipo"], e["nome"]))
    obs = ""
    if not regs:
        # mesmo nome de rua com outro tipo (ex.: "Av." no catálogo, "RUA" no IBGE): só sugere, nunca aplica
        achados = [v for (t, n), v in indice.items() if n == e["nome"]]
        if len(achados) == 1:
            regs, obs = achados[0], "Rua achada só pelo nome, com tipo diferente do catálogo: conferir."
        else:
            base["qualidade"] = "rua_nao_encontrada"
            base["observacao"] = "Nenhuma rua com esse nome no CNEFE (ou várias): localizar à mão."
            return base
    base["rua_cnefe"] = Counter(r[5] for r in regs).most_common(1)[0][0]
    if e["numero"] is None:
        base["qualidade"] = "sem_numero"
        base["observacao"] = "Endereço sem número (s/n): a rua existe no CNEFE, mas o ponto exato precisa ser dado à mão."
        return base
    exatos = [r for r in regs if r[0] == e["numero"]]
    if exatos:
        lat = sum(r[1] for r in exatos) / len(exatos)
        lon = sum(r[2] for r in exatos) / len(exatos)
        dispersao = max(haversine_m(lat, lon, r[1], r[2]) for r in exatos)
        ceps = Counter(r[3] for r in exatos if r[3])
        setores = Counter(r[4] for r in exatos if r[4])
        base.update({"numero_cnefe": e["numero"], "lat": "%.6f" % lat, "lon": "%.6f" % lon,
                     "cep": ceps.most_common(1)[0][0] if ceps else "",
                     "setor": setores.most_common(1)[0][0] if setores else "", "registros": len(exatos)})
        if obs:
            base["qualidade"], base["observacao"] = "rua_so_pelo_nome", obs
        elif dispersao > DISPERSAO_MAX_M:
            base["qualidade"] = "exato_disperso"
            base["observacao"] = "Pontos do mesmo número a até %d m uns dos outros: conferir." % dispersao
        elif len(ceps) > 1:
            base["qualidade"] = "exato_cep_ambiguo"
            base["observacao"] = "O mesmo número aparece com mais de um CEP (%s): conferir." % ", ".join(sorted(ceps))
        else:
            base["qualidade"] = "exato"
        return base
    com_numero = [r for r in regs if r[0] is not None]
    if not com_numero:
        base["qualidade"] = "rua_sem_numeros"
        base["observacao"] = "A rua existe no CNEFE, mas sem números: localizar à mão."
        return base
    prox = min(com_numero, key=lambda r: abs(r[0] - e["numero"]))
    base.update({"qualidade": "numero_proximo", "numero_cnefe": prox[0], "lat": "%.6f" % prox[1],
                 "lon": "%.6f" % prox[2], "cep": prox[3] or "", "setor": prox[4], "registros": 1,
                 "observacao": "Número %d não existe no CNEFE; o mais próximo é %d (diferença de %d). Só sugestão."
                               % (e["numero"], prox[0], abs(prox[0] - e["numero"]))})
    return base


def ler_cnefe(caminho: Path):
    if caminho.suffix.lower() == ".zip":
        with zipfile.ZipFile(caminho) as z:
            nomes = [n for n in z.namelist() if n.lower().endswith(".csv")]
            if not nomes:
                raise ValueError("Nenhum CSV dentro de %s" % caminho)
            return ler_csv_flex(z.read(nomes[0]))
    return ler_csv_flex(caminho)


def propor(linhas: list[dict], indice: dict) -> list[dict]:
    """Uma proposta por serviço que tem endereço e ainda não tem CEP nem coordenada."""
    saida = []
    for s in linhas:
        if not (s.get("endereco") or "").strip():
            continue
        if (s.get("cep") or "").strip() and (s.get("lat") or "").strip() and (s.get("lon") or "").strip():
            continue
        r = casar(s["endereco"], indice)
        saida.append({"id": s["id"], "nome": s["nome"], "endereco_catalogo": s["endereco"], **r})
    return saida


def aplicar(caminho: Path, propostas: list[dict]) -> int:
    """Grava lat, lon e cep (só onde estão vazios) dos casos 'exato'. Devolve quantos serviços mudaram."""
    exatos = {p["id"]: p for p in propostas if p["qualidade"] == "exato"}
    with caminho.open(encoding="utf-8", newline="") as f:
        leitor = csv.DictReader(f)
        campos = leitor.fieldnames
        linhas = list(leitor)
    mudou = 0
    for s in linhas:
        p = exatos.get(s["id"])
        if not p:
            continue
        alterou = False
        for campo, valor in (("lat", p["lat"]), ("lon", p["lon"]), ("cep", p["cep"])):
            if valor and not (s.get(campo) or "").strip():
                s[campo] = valor
                alterou = True
        mudou += alterou
    with caminho.open("w", encoding="utf-8", newline="") as f:
        gravador = csv.DictWriter(f, fieldnames=campos, lineterminator="\n")
        gravador.writeheader()
        gravador.writerows(linhas)
    return mudou


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--cnefe", type=Path, default=BRUTO / "cnefe" / "3543907_RIO_CLARO.zip")
    ap.add_argument("--catalogo", type=Path, default=CATALOGO / "servicos_manuais.csv")
    ap.add_argument("--saida", type=Path, default=DADOS / "geocodificacao_proposta.csv")
    ap.add_argument("--aplicar", action="store_true", help="grava lat, lon e cep dos casos 'exato' no catálogo")
    a = ap.parse_args()
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
    campos = ["id", "nome", "endereco_catalogo", "qualidade", "rua_cnefe", "numero_cnefe", "cep", "lat", "lon",
              "setor", "registros", "observacao"]
    with a.saida.open("w", encoding="utf-8", newline="") as f:
        g = csv.DictWriter(f, fieldnames=campos, lineterminator="\n")
        g.writeheader()
        g.writerows(propostas)
    print("Propostas gravadas em %s (%d serviços)." % (a.saida, len(propostas)))
    for q, n in Counter(p["qualidade"] for p in propostas).most_common():
        print("  %-20s %d" % (q, n))
    if a.aplicar:
        print("Catálogo atualizado em %d serviços (só casos 'exato', só campos vazios). Rode: python pipeline/servicos.py --somente-manual"
              % aplicar(a.catalogo, propostas))
    else:
        print("Nada foi gravado no catálogo. Revise a planilha; com --aplicar entram só os casos 'exato'.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
