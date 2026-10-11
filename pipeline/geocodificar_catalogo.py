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
       o que mudou em catalogo/localizacao_registro.csv (versionado: id, campo, valor, método, confiança, data). Depois: python pipeline/servicos.py --somente-manual

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
import io
import re
import sys
import unicodedata
import zipfile
from collections import Counter, defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import (BRUTO, CATALOGO, DADOS, MUNICIPIO_IBGE7, WEB_DADOS, achar_coluna, agora_iso, erro, haversine_m,  # noqa: E402
                    ler_csv_flex, normalizar_cep, para_numero)
from ceps_lista import CAMINHO_PADRAO as CAMINHO_LISTA_CEPS, ler_lista_ceps  # noqa: E402

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


_UNIDADES = ["zero", "um", "dois", "tres", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez", "onze", "doze",
             "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"]
_DEZENAS = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"]
_CENTENAS = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos",
             "oitocentos", "novecentos"]
_OUTRAS_GRAFIAS = {"quatorze": ["catorze"], "dezesseis": ["dezeseis"], "dezessete": ["dezesete"]}


def por_extenso(n: int) -> str:
    """0 a 999 em português, sem acento, como o IBGE escreve no CNEFE ('RUA TRES', 'AVENIDA CINQUENTA E SEIS PA')."""
    if n < 20:
        return _UNIDADES[n]
    if n < 100:
        d, u = divmod(n, 10)
        return _DEZENAS[d] + (" e " + _UNIDADES[u] if u else "")
    if n == 100:
        return "cem"
    c, resto = divmod(n, 100)
    return _CENTENAS[c] + (" e " + por_extenso(resto) if resto else "")


def variantes_por_extenso(nome: str) -> list[str]:
    """Formas comparáveis do nome da rua: números trocados por extenso (como no CNEFE) e, por último, o original.

    O CNEFE de Rio Claro escreve 'AVENIDA ONZE F' onde o catálogo diz 'Av. 11F'. Grafias alternativas (quatorze/catorze,
    dezesseis/dezeseis) geram mais de uma variante.
    """
    partes = re.split(r"(\d+)", str(nome))
    opcoes: list[list[str]] = []
    for parte in partes:
        if parte.isdigit() and int(parte) < 1000:
            palavra = por_extenso(int(parte))
            alternativas = [palavra]
            for base, outras in _OUTRAS_GRAFIAS.items():
                if base in palavra.split():
                    alternativas += [palavra.replace(base, o) for o in outras]
            opcoes.append(alternativas)
        else:
            opcoes.append([parte])
    formas = [""]
    for alternativas in opcoes:
        formas = [f + " " + a for f in formas for a in alternativas][:12]
    saida = []
    for f in formas + [str(nome)]:
        c = canon(f)
        if c and c not in saida:
            saida.append(c)
    return saida


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
    return {"tipo": tipo, "nome": canon(nome), "variantes": variantes_por_extenso(nome), "numero": numero,
            "motivo": "" if numero is not None else "sem_numero"}


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
         "registros": "", "rua_cnefe": "", "numero_cnefe": "", "diferenca_numero": "", "bairro_cep": "", "bairro_confere": "", "alternativas": "", "situacao": "pendente",
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

    regs = next((indice[(e["tipo"], v)] for v in e["variantes"] if (e["tipo"], v) in indice), None)
    tipo_diferente = False
    if not regs:
        # mesmo nome de rua com outro tipo (ex.: "Rua" no catálogo, "AVENIDA" no IBGE)
        achadas = {t: v for (t, n), v in indice.items() if n in e["variantes"]}
        if not achadas:
            parecidas = _parecidas(e["variantes"][0], indice)
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
                        rua_cnefe=rua, numero_cnefe=n_prox, diferenca_numero=abs(n_prox - e["numero"]), observacao=msg)
        return _res(metodo="numero_proximo", confianca="ambigua" if ceps else "nenhuma", candidatos=len(ceps),
                    alternativas=_alt_ceps(prox), rua_cnefe=rua, numero_cnefe=n_prox, diferenca_numero=abs(n_prox - e["numero"]),
                    observacao=msg)

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


# ---------------------------------------------------------------------------------------------- CEP pela rua (lista de CEPs)
PALAVRAS_DE_BAIRRO = {"jd", "jardim", "vila", "vl", "bairro", "parque", "pq", "residencial", "res", "conjunto", "conj", "distrito",
                      "de", "da", "do", "dos", "das", "i", "ii", "iii", "a", "b"}


def _tokens_bairro(texto: str) -> set[str]:
    return {t for t in re.findall(r"[a-z0-9]+", sem_acento(texto).lower()) if t not in PALAVRAS_DE_BAIRRO}


def bairro_do_endereco(endereco: str) -> str:
    """Bairro escrito no endereço do catálogo ("Rua 5, 1201, Jardim Bom Retiro" ou "Rua 4-B, 70 - Cidade Nova"), sem o CEP. '' se não há."""
    texto = re.sub(r"\bCEP\b.*$", "", str(endereco or ""), flags=re.I)
    if " - " in texto:
        return texto.split(" - ", 1)[1].split(",")[0].strip()
    partes = [p.strip() for p in texto.split(",")]
    return partes[2] if len(partes) > 2 else ""


def bairro_confere(endereco: str, bairro_lista: str) -> str:
    """'sim' se o bairro do endereço e o bairro do CEP na lista se contêm (ignorando Jd., Vila...), 'não' se diferem, '' se falta um dos dois."""
    a, b = _tokens_bairro(bairro_do_endereco(endereco)), _tokens_bairro(bairro_lista or "")
    if not a or not b:
        return ""
    return "sim" if a <= b or b <= a else "não"


def aviso_de_bairro(r: dict) -> str:
    """Texto curto para a listagem: só avisa quando o bairro do catálogo e o do CEP na lista diferem. Não bloqueia nada."""
    if (r.get("bairro_confere") or "") == "não":
        return " | ATENÇÃO bairro do CEP na lista: %s" % r.get("bairro_cep")
    return ""


def indexar_ruas_da_lista(linhas: list[dict]) -> dict:
    """{(tipo|None, nome canônico): [linha]}; cada rua entra com o nome em algarismo e por extenso, como em interpretar_endereco."""
    indice: dict = defaultdict(list)
    for r in linhas:
        palavras = r["logradouro"].replace(".", ". ").split()
        if not palavras:
            continue
        tipo = tipo_norm(palavras[0])
        nome = " ".join(palavras[1:]) if tipo else r["logradouro"]
        for v in variantes_por_extenso(nome):
            indice[(tipo, v)].append(r)
            if tipo:
                indice[(None, v)].append(r)
    return indice


def cep_pela_rua(endereco: str, ruas: dict) -> dict | None:
    """CEP(s) da rua do endereço na lista de CEPs, sem usar o número. Devolve o mesmo formato de casar(), ou None se a rua não está lá."""
    e = interpretar_endereco(endereco)
    if e.get("motivo") in ("sem_endereco", "cruzamento", "rua_sem_tipo"):
        return None
    achadas: dict[str, dict] = {}
    for v in e["variantes"]:
        for r in ruas.get((e["tipo"], v), []):
            achadas.setdefault(r["cep"], r)
    if not achadas:                                   # tipo diferente (ex.: "Rua" no catálogo, "Avenida" na lista)
        for v in e["variantes"]:
            for r in ruas.get((None, v), []):
                achadas.setdefault(r["cep"], r)
    if not achadas:
        return None
    candidatas = list(achadas.values())
    if len(candidatas) > 1:                           # a rua passa por mais de um CEP: o bairro do catálogo pode desempatar
        partes = [p.strip() for p in str(endereco).split(",")]
        mencionado = _tokens_bairro(" ".join(partes[2:]))
        if mencionado:
            filtradas = [r for r in candidatas if mencionado <= _tokens_bairro(r["bairro"])]
            if filtradas:
                candidatas = filtradas
    if len(candidatas) == 1:
        r = candidatas[0]
        return _res(metodo="cep_da_rua", confianca="baixa", candidatos=1, cep=r["cep"], situacao="sugestao",
                    rua_cnefe=r["logradouro"],
                    observacao="Rua achada na lista de CEPs (%s, %s), sem usar o número: sugerido só o CEP, localização aproximada."
                               % (r["logradouro"], r["bairro"] or "bairro não informado"))
    return _res(metodo="cep_da_rua", confianca="ambigua", candidatos=len(candidatas),
                alternativas="; ".join("CEP %s (%s)" % (r["cep"], r["bairro"] or "sem bairro") for r in sorted(candidatas, key=lambda r: r["cep"])),
                observacao="A rua passa por mais de um CEP na lista e o bairro do catálogo não desempata: escolher à mão.")


def ler_cnefe(caminho: Path):
    if caminho.suffix.lower() == ".zip":
        with zipfile.ZipFile(caminho) as z:
            nomes = [n for n in z.namelist() if n.lower().endswith(".csv")]
            if not nomes:
                raise ValueError("Nenhum CSV dentro de %s" % caminho)
            return ler_csv_flex(z.read(nomes[0]))
    return ler_csv_flex(caminho)


CAMPOS_PROPOSTA = ["id", "nome", "endereco_catalogo", "cep_catalogo", "situacao", "confianca", "metodo", "candidatos",
                   "cep", "cep_confere", "cep_distancia_m", "lat", "lon", "setor", "registros", "rua_cnefe", "numero_cnefe",
                   "diferenca_numero", "bairro_cep", "bairro_confere", "alternativas", "observacao", "decisao"]
# CEP do catálogo diferente do CNEFE, mas com o centro a até esta distância (mais o raio do CEP) do ponto achado: é CEP
# vizinho da mesma região, não erro. Mais longe que isso, a pessoa precisa conferir.
CEP_VIZINHO_M = 1500


def amostra_de_ruas(indice: dict, n: int = 15) -> list[str]:
    """Como os nomes de rua aparecem no CNEFE: tipos mais comuns e algumas ruas (só nomes; nada de número, CEP ou ponto)."""
    tipos = Counter()
    for (tipo, _canonico), regs in indice.items():
        tipos[tipo] += len(regs)
    linhas = ["Tipos de rua no CNEFE: " + ", ".join("%s=%d" % (t, c) for t, c in tipos.most_common(8))]
    exemplos = sorted({regs[0][5] for regs in indice.values()})
    passo = max(1, len(exemplos) // n)
    linhas.append("Exemplos de nomes de rua (%d ruas no total): %s" % (len(indice), " | ".join(exemplos[::passo][:n])))
    return linhas


def carregar_indice_cep(caminho: Path | None) -> dict:
    """{cep: [lat, lon, raio_m, ...]} do web/dados/cep_indice.json (gerado por indice_cep.py), ou {} se não existir."""
    if caminho is None or not caminho.exists():
        return {}
    import json

    return json.loads(caminho.read_text(encoding="utf-8")).get("ceps", {})


# métodos do estágio 1 que não chegaram a um CEP e merecem uma segunda tentativa pela lista de CEPs
TENTAR_PELA_RUA = ("sem_correspondencia", "rua_sem_numero", "rua_ambigua", "rua_sem_numeros")


def propor(linhas: list[dict], indice: dict, indice_cep: dict | None = None, ruas_cep: dict | None = None,
           bairro_por_cep: dict | None = None) -> list[dict]:
    """Uma sugestão por serviço que tem endereço e ainda não tem CEP nem coordenada. Não altera as linhas."""
    saida = []
    for s in linhas:
        if not (s.get("endereco") or "").strip():
            continue
        if (s.get("cep") or "").strip() and (s.get("lat") or "").strip() and (s.get("lon") or "").strip():
            continue
        r = casar(s["endereco"], indice)
        if ruas_cep and r["metodo"] in TENTAR_PELA_RUA and not r["cep"]:
            pela_rua = cep_pela_rua(s["endereco"], ruas_cep)
            if pela_rua:
                pela_rua["rua_cnefe"] = pela_rua["rua_cnefe"] or r["rua_cnefe"]
                r = pela_rua
        cep_catalogo = normalizar_cep(s.get("cep")) or ""
        confere, distancia = "", ""
        if cep_catalogo and r["cep"]:
            if cep_catalogo == r["cep"]:
                confere = "sim"
            else:
                confere = "não"
                centro_cep = (indice_cep or {}).get(cep_catalogo)
                if centro_cep and r["lat"] and r["lon"]:
                    distancia = round(haversine_m(float(r["lat"]), float(r["lon"]), float(centro_cep[0]), float(centro_cep[1])))
                    if distancia <= CEP_VIZINHO_M + float(centro_cep[2]):
                        confere = "vizinho"
                        r["observacao"] = (r["observacao"] + " " if r["observacao"] else "") + (
                            "O CEP do catálogo (%s) é diferente do CNEFE (%s), mas o centro dele fica a %d m do ponto: CEP vizinho, mesma região."
                            % (cep_catalogo, r["cep"], distancia))
                if confere == "não":
                    r["observacao"] = (r["observacao"] + " " if r["observacao"] else "") + (
                        "O CEP do catálogo (%s) é diferente do CNEFE (%s)%s: conferir qual está certo." % (
                            cep_catalogo, r["cep"], "" if distancia == "" else " e o centro dele fica a %d m do ponto" % distancia))
                    r["situacao"] = "pendente"
        bairro_cep = (bairro_por_cep or {}).get(r["cep"], "") if r["cep"] else ""
        saida.append({"id": s["id"], "nome": s["nome"], "endereco_catalogo": s["endereco"], "cep_catalogo": cep_catalogo,
                      "cep_confere": confere, "cep_distancia_m": distancia, "decisao": "",
                      **{**r, "bairro_cep": bairro_cep, "bairro_confere": bairro_confere(s["endereco"], bairro_cep) if bairro_cep else ""}})
    return saida


def _ler_planilha(caminho: Path) -> tuple[list[dict], list[str], str]:
    """Lê a planilha de revisão mesmo depois de salva pelo Excel: UTF-8 ou Windows-1252, separador ';' ou ','."""
    bruto = caminho.read_bytes()
    for codificacao in ("utf-8-sig", "cp1252"):
        try:
            texto = bruto.decode(codificacao)
            break
        except UnicodeDecodeError:
            continue
    cabecalho = texto.splitlines()[0] if texto else ""
    separador = ";" if cabecalho.count(";") > cabecalho.count(",") else ","
    leitor = csv.DictReader(io.StringIO(texto, newline=""), delimiter=separador)
    return list(leitor), list(leitor.fieldnames or []), separador


def _gravar_planilha(caminho: Path, campos: list[str], linhas: list[dict]) -> None:
    """Separador ';' e UTF-8 com marca (BOM): é o que o Excel em português abre sem estragar colunas nem acentos."""
    with caminho.open("w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=campos, delimiter=";", lineterminator="\n", extrasaction="ignore")
        w.writeheader()
        w.writerows(linhas)


def marcar_altas(planilha: Path) -> tuple[list[dict], list[dict]]:
    """Escreve 'aprovar' nas linhas de confiança alta ainda sem decisão, exceto onde o CEP do catálogo difere do CNEFE e não é vizinho (cep_confere = 'não').

    Atalho para não digitar linha por linha. NÃO altera o catálogo (isso só acontece em --aplicar-aprovadas) e a pessoa
    continua podendo apagar o 'aprovar' de qualquer linha antes de aplicar. Devolve (marcadas, altas_puladas).
    """
    linhas, campos, _ = _ler_planilha(planilha)
    marcadas, puladas = [], []
    for r in linhas:
        if (r.get("confianca") or "").strip() != "alta" or (r.get("decisao") or "").strip():
            continue
        if (r.get("cep_confere") or "").strip() == "não":
            puladas.append(r)
            continue
        r["decisao"] = "aprovar"
        marcadas.append(r)
    if marcadas:
        _gravar_planilha(planilha, campos, linhas)
    return marcadas, puladas


def marcar_baixas_cep(planilha: Path, limite_numero: int = 200) -> tuple[list[dict], list[dict]]:
    """Escreve 'aprovar' nas sugestões só de CEP que são seguras o bastante: o CEP vindo do número mais próximo da mesma rua
    (diferença de até `limite_numero`) ou da rua inteira quando ela tem um CEP só. O bairro NÃO bloqueia: as ruas da grade de Rio Claro
    atravessam vários bairros e o catálogo usa nomes informais de bairro; a lista mostra o aviso ao lado para a pessoa decidir.
    Não marca onde o CEP do catálogo difere do CNEFE.

    Aplicar uma sugestão dessas grava só o CEP (nunca latitude/longitude): o serviço passa a ser localizado de forma aproximada pelo CEP.
    Devolve (marcadas, puladas); cada pulada traz o motivo em "_motivo".
    """
    linhas, campos, _ = _ler_planilha(planilha)
    marcadas, puladas = [], []
    for r in linhas:
        if (r.get("confianca") or "").strip() != "baixa" or (r.get("decisao") or "").strip() or not (r.get("cep") or "").strip():
            continue
        metodo = (r.get("metodo") or "").strip()
        if metodo not in ("numero_proximo", "cep_da_rua") or (r.get("cep_confere") or "").strip() == "não":
            continue
        if metodo == "numero_proximo":
            try:
                diferenca = int(float(r.get("diferenca_numero") or "nan"))
            except ValueError:
                continue
            if diferenca > limite_numero:
                r["_motivo"] = "número a %s do pedido" % diferenca
                puladas.append(r)
                continue
        r["decisao"] = "aprovar"
        marcadas.append(r)
    if marcadas:
        _gravar_planilha(planilha, campos, linhas)
    return marcadas, puladas


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
    aprovadas = [r for r in _ler_planilha(planilha)[0] if (r.get("decisao") or "").strip().lower() in APROVADOS]
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
    ap.add_argument("--indice-cep", type=Path, default=WEB_DADOS / "cep_indice.json",
                    help="índice de CEP (indice_cep.py), usado para distinguir CEP vizinho de CEP errado")
    ap.add_argument("--marcar-altas", nargs="?", const=True, default=False, metavar="PLANILHA",
                    help="escreve 'aprovar' nas linhas de confiança alta e lista cada uma para você conferir; "
                         "não altera o catálogo e não lê o CNEFE")
    ap.add_argument("--marcar-baixas-cep", nargs="?", const=True, default=False, metavar="PLANILHA",
                    help="escreve 'aprovar' nas sugestões só de CEP (número próximo ou rua inteira com um CEP só); "
                         "não altera o catálogo e não lê o CNEFE")
    ap.add_argument("--limite-numero", type=int, default=200,
                    help="com --marcar-baixas-cep: maior diferença de número aceita (padrão 200)")
    ap.add_argument("--ceps-google", type=Path, default=CAMINHO_LISTA_CEPS,
                    help="lista de CEPs com rua e bairro, usada para achar o CEP de ruas que o CNEFE não resolveu")
    a = ap.parse_args()
    if a.marcar_baixas_cep:
        planilha = a.saida if a.marcar_baixas_cep is True else Path(a.marcar_baixas_cep)
        if not planilha.exists():
            erro("Planilha não encontrada: %s" % planilha)
        marcadas, puladas = marcar_baixas_cep(planilha, a.limite_numero)
        print("%d sugestões de CEP marcadas 'aprovar' em %s. O catálogo NÃO foi alterado." % (len(marcadas), planilha))
        print("CONFIRA cada uma (serviço | endereço do catálogo | rua achada | CEP | método). Para recusar, apague 'aprovar' na planilha:")
        for r in marcadas:
            print("  %-46s | %-40s | %s | %s | %s%s" % (r["nome"][:46], r["endereco_catalogo"][:40], r["rua_cnefe"], r["cep"], r["metodo"],
                                                      aviso_de_bairro(r)))
        for r in puladas:
            print("  NÃO MARCADA (%s): %s | %s | CEP %s" % (r["_motivo"], r["nome"][:46], r["endereco_catalogo"][:40], r["cep"]))
        print("Depois de conferir: python pipeline/geocodificar_catalogo.py --aplicar-aprovadas")
        return 0
    if a.marcar_altas:
        planilha = a.saida if a.marcar_altas is True else Path(a.marcar_altas)
        if not planilha.exists():
            erro("Planilha não encontrada: %s" % planilha)
        marcadas, puladas = marcar_altas(planilha)
        print("%d linhas de confiança alta marcadas 'aprovar' em %s. O catálogo NÃO foi alterado." % (len(marcadas), planilha))
        print("CONFIRA cada uma (serviço | endereço do catálogo | rua no CNEFE | CEP). Para recusar, apague 'aprovar' na planilha:")
        for r in marcadas:
            print("  %-46s | %-40s | %s %s | %s" % (r["nome"][:46], r["endereco_catalogo"][:40], r["rua_cnefe"], r["numero_cnefe"], r["cep"]))
        for r in puladas:
            print("  NÃO MARCADA (CEP do catálogo difere do CNEFE): %s | catálogo %s | CNEFE %s" % (r["nome"][:50], r.get("cep_catalogo"), r["cep"]))
        print("Depois de conferir: python pipeline/geocodificar_catalogo.py --aplicar-aprovadas")
        return 0
    if a.aplicar_aprovadas:
        planilha = a.saida if a.aplicar_aprovadas is True else Path(a.aplicar_aprovadas)
        if not planilha.exists():
            erro("Planilha não encontrada: %s" % planilha)
        mud, avisos = aplicar_aprovadas(a.catalogo, planilha, CATALOGO / "localizacao_registro.csv")
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
    indice_cep = carregar_indice_cep(a.indice_cep)
    if not indice_cep:
        print("AVISO: sem %s: não dá para distinguir CEP vizinho de CEP errado (rode python pipeline/indice_cep.py)." % a.indice_cep)
    lista = ler_lista_ceps(a.ceps_google)
    ruas_cep = indexar_ruas_da_lista(lista) if lista else None
    if ruas_cep:
        print("Lista de CEPs: %d CEPs de Rio Claro usados para achar o CEP de ruas sem correspondência no CNEFE." % len(lista))
    else:
        print("AVISO: sem lista de CEPs em %s: só o CNEFE será usado." % a.ceps_google)
    bairro_por_cep = {}
    for r in lista:
        bairro_por_cep.setdefault(r["cep"], r["bairro"])
    propostas = propor(linhas, indice, indice_cep, ruas_cep, bairro_por_cep)
    a.saida.parent.mkdir(parents=True, exist_ok=True)
    _gravar_planilha(a.saida, CAMPOS_PROPOSTA, propostas)
    print("Sugestões gravadas em %s (%d serviços). O catálogo NÃO foi alterado." % (a.saida, len(propostas)))
    for (conf, met), n in sorted(Counter((p["confianca"], p["metodo"]) for p in propostas).items()):
        print("  %-8s %-26s %d" % (conf, met, n))
    print("--- Diagnóstico (pode colar no chat; só nomes de rua) ---")
    for linha in amostra_de_ruas(indice):
        print(linha)
    print("Revise a planilha (abre no Excel). Para aprovar de uma vez as de confiança alta: --marcar-altas. "
          "Depois, --aplicar-aprovadas.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
