"""Passo 5 - malha de setores censitarios 2022 (IBGE) -> GeoJSON leve de Rio Claro.

Entrada : o zip "SP_setores_CD2022.zip" (shapefile do estado inteiro) em dados/bruto/setores/
          (ou passe o caminho: python pipeline/setores.py caminho/do.zip)
Saida   : web/dados/setores.geojson  (so Rio Claro, poligonos simplificados)
          web/dados/setores_resumo.json (setor -> bairro, situacao, pessoas, domicilios)

Usa so a biblioteca pura-Python "pyshp" (pip install pyshp): funciona no Windows sem GDAL.

Sobre as variaveis v0001..v0007: a malha traz contagens basicas do Censo 2022. Pelos totais de
Rio Claro, v0001 = total de pessoas (soma 201.418) e v0002 = total de domicilios. O significado
exato DEVE ser conferido no dicionario de dados do IBGE; por isso o resumo registra o nome
original ("v0001") ao lado do nome amigavel. Nao ha idade nesta malha: criancas de 0 a 4 anos
virao dos "Agregados por Setores Censitarios".

Privacidade: so agregados por setor (nao ha pessoas nem enderecos aqui).
"""
from __future__ import annotations

import io
import sys
import zipfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import BRUTO, MUNICIPIO_IBGE7, WEB_DADOS, agora_iso, erro, salvar_json  # noqa: E402

TOLERANCIA_GRAUS = 0.00004  # ~4 m: invisivel no mapa, reduz muito o tamanho
CASAS = 5                   # ~1 m


def _dist_seg(p, a, b):
    (x, y), (x1, y1), (x2, y2) = p, a, b
    dx, dy = x2 - x1, y2 - y1
    if dx == 0 and dy == 0:
        return ((x - x1) ** 2 + (y - y1) ** 2) ** 0.5
    t = max(0.0, min(1.0, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)))
    return ((x - (x1 + t * dx)) ** 2 + (y - (y1 + t * dy)) ** 2) ** 0.5


def simplificar(pontos, tol=TOLERANCIA_GRAUS):
    """Douglas-Peucker iterativo (sem recursao). Mantem primeiro e ultimo ponto."""
    n = len(pontos)
    if n <= 4:
        return list(pontos)
    manter = [False] * n
    manter[0] = manter[-1] = True
    pilha = [(0, n - 1)]
    while pilha:
        i, j = pilha.pop()
        dmax, k = 0.0, -1
        for m in range(i + 1, j):
            d = _dist_seg(pontos[m], pontos[i], pontos[j])
            if d > dmax:
                dmax, k = d, m
        if k != -1 and dmax > tol:
            manter[k] = True
            pilha += [(i, k), (k, j)]
    return [p for p, mk in zip(pontos, manter) if mk]


def aneis(shape):
    """Separa os pontos de um poligono em aneis (lista de listas de (lon, lat))."""
    pts = shape.points
    partes = list(shape.parts) + [len(pts)]
    return [pts[partes[i]:partes[i + 1]] for i in range(len(partes) - 1)]


def _area_assinada(anel):
    s = 0.0
    for (x1, y1), (x2, y2) in zip(anel, anel[1:] + anel[:1]):
        s += x1 * y2 - x2 * y1
    return s / 2


def geometria(shape):
    """Monta MultiPolygon GeoJSON. No shapefile, anel horario = externo; anti-horario = furo."""
    poligonos = []
    for anel in aneis(shape):
        simples = simplificar(anel)
        if len(simples) < 4:
            continue
        coords = [[round(x, CASAS), round(y, CASAS)] for x, y in simples]
        if _area_assinada(anel) < 0:       # horario (area negativa) = externo
            poligonos.append([coords])
        elif poligonos:                     # furo do ultimo externo
            poligonos[-1].append(coords)
    if not poligonos:
        return None
    return {"type": "MultiPolygon", "coordinates": poligonos}


def abrir_leitor(origem: Path):
    import shapefile

    origem = Path(origem)
    if origem.suffix.lower() == ".zip":
        with zipfile.ZipFile(origem) as z:
            nomes = {Path(n).suffix.lower(): n for n in z.namelist()}
            faltam = [e for e in (".shp", ".dbf", ".shx") if e not in nomes]
            if faltam:
                raise ValueError("Zip sem %s" % ", ".join(faltam))
            partes = {e[1:]: io.BytesIO(z.read(nomes[e])) for e in (".shp", ".dbf", ".shx")}
        return shapefile.Reader(encoding="utf-8", **partes)
    return shapefile.Reader(str(origem.with_suffix("")), encoding="utf-8")


def extrair(leitor, municipio: str = MUNICIPIO_IBGE7):
    nomes = [f[0] for f in leitor.fields[1:]]
    obrig = ("CD_SETOR", "CD_MUN")
    for c in obrig:
        if c not in nomes:
            raise ValueError("Campo %s ausente. Campos: %s" % (c, nomes))
    ix = {n: nomes.index(n) for n in nomes}
    pega = lambda rec, n: (rec[ix[n]] if n in ix else None)  # noqa: E731
    feicoes, resumo = [], {}
    for sr in leitor.iterShapeRecords():
        rec = sr.record
        if str(pega(rec, "CD_MUN")).strip() != municipio:
            continue
        geom = geometria(sr.shape)
        if geom is None:
            continue
        setor = str(pega(rec, "CD_SETOR")).strip()
        bairro = (pega(rec, "NM_BAIRRO") or "").strip() or None
        sit = (pega(rec, "SITUACAO") or "").strip() or None
        pessoas = pega(rec, "v0001")
        dom = pega(rec, "v0002")
        info = {"setor": setor, "bairro": bairro, "situacao": sit,
                "pessoas": int(pessoas) if pessoas is not None else None,
                "domicilios": int(dom) if dom is not None else None}
        feicoes.append({"type": "Feature", "properties": info, "geometry": geom})
        resumo[setor] = info
    if not feicoes:
        raise ValueError("Nenhum setor do municipio %s na malha." % municipio)
    return {"type": "FeatureCollection", "features": feicoes}, resumo


def main() -> None:
    if len(sys.argv) > 1:
        origem = Path(sys.argv[1])
    else:
        zips = sorted((BRUTO / "setores").glob("*.zip"))
        if not zips:
            erro("Coloque o zip da malha de setores (SP_setores_CD2022.zip) em %s\n"
                 "ou rode: python pipeline/setores.py caminho/do/arquivo.zip" % (BRUTO / "setores"))
        origem = zips[0]
    print("Lendo %s ..." % origem)
    try:
        colecao, resumo = extrair(abrir_leitor(origem))
    except ValueError as e:
        erro(str(e))
    colecao["meta"] = {
        "fonte": "IBGE - Malha de setores censitarios, Censo Demografico 2022",
        "gerado_em": agora_iso(),
        "pessoas": "campo v0001 da malha (a confirmar no dicionario do IBGE)",
        "domicilios": "campo v0002 da malha (a confirmar no dicionario do IBGE)",
    }
    salvar_json(colecao, WEB_DADOS / "setores.geojson")
    salvar_json({"meta": colecao["meta"], "setores": resumo}, WEB_DADOS / "setores_resumo.json")
    tot = sum(s["pessoas"] or 0 for s in resumo.values())
    print("  %d setores | %d pessoas somadas (confira com o total oficial do municipio)" % (len(resumo), tot))


if __name__ == "__main__":
    main()
