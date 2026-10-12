"""Indice exploratorio de acesso territorial a servicos publicos de Rio Claro.

Uso:
    python pipeline/cobertura.py
    python pipeline/cobertura.py --gpkg "docs/ibge/SP_setores_CD2022.gpkg"

Por padrao usa a malha agregada ja versionada em web/dados/setores.geojson. Com --gpkg,
le a camada local do GeoPackage, descobre colunas por sinonimos e filtra Rio Claro pelo
codigo do setor/municipio. Nao imprime registros pessoais nem exporta enderecos residenciais.

O ICS e comparativo, nao uma medida oficial de suficiencia: transforma a distancia em
pontuacao relativa usando o percentil 95 das distancias observadas em cada categoria.
Quanto maior o ICS, menor a distancia relativa aos servicos cadastrados. A ausencia de
coordenadas em uma categoria e dado ausente, nunca distancia zero.
"""
from __future__ import annotations

import argparse
import json
import math
import re
import statistics
import sys
import unicodedata
from datetime import date
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]
DADOS = RAIZ / "web" / "dados"
COD_MUNICIPIO = "3543907"
CATEGORIAS = {
    "cras": ("assistencia", "cras"),
    "ubs": ("saude", "ubs"),
    "escola": ("creche", "escola_municipal"),
}
AVISO = (
    "Indice comparativo e exploratorio. Distancias em linha reta do centroide do setor "
    "ao servico cadastrado mais proximo; nao consideram ruas, transporte, horarios, "
    "capacidade, elegibilidade ou qualidade. Pontuacao alta nao prova cobertura adequada; "
    "pontuacao baixa nao prova ausencia de servico. Resultados dependem da completude "
    "do catalogo e das coordenadas."
)


def normalizar(texto) -> str:
    s = unicodedata.normalize("NFKD", str(texto or "")).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "_", s).strip("_")


def achar_coluna(colunas, sinonimos, obrigatoria=False, papel="campo"):
    """Escolhe primeiro nome exato normalizado; depois aceita correspondencia por prefixo/sufixo."""
    mapa = {normalizar(c): c for c in colunas}
    for s in sinonimos:
        n = normalizar(s)
        if n in mapa:
            return mapa[n]
    for s in sinonimos:
        n = normalizar(s)
        for cn, original in mapa.items():
            if cn.startswith(n + "_") or cn.endswith("_" + n):
                return original
    if obrigatoria:
        raise ValueError("Nao identifiquei a coluna de %s. Colunas encontradas: %s" % (papel, list(colunas)))
    return None


def numero(valor):
    if valor is None:
        return None
    try:
        s = str(valor).strip().replace(",", ".")
        if not s or s.lower() in ("nan", "none", "null", "na"):
            return None
        n = float(s)
        return n if math.isfinite(n) else None
    except (TypeError, ValueError):
        return None


def poligonos(geom):
    if not geom:
        return []
    if geom.get("type") == "Polygon":
        return [geom["coordinates"]]
    if geom.get("type") == "MultiPolygon":
        return list(geom["coordinates"])
    return []


def centro(geom):
    """Centroide planar do anel externo do maior poligono; devolve latitude, longitude."""
    anel = max((p[0] for p in poligonos(geom)), key=len)
    pts = anel[:-1] if len(anel) > 1 and anel[0] == anel[-1] else anel
    area = cx = cy = 0.0
    for i, p in enumerate(pts):
        q = pts[(i + 1) % len(pts)]
        cruz = p[0] * q[1] - q[0] * p[1]
        area += cruz
        cx += (p[0] + q[0]) * cruz
        cy += (p[1] + q[1]) * cruz
    if abs(area) < 1e-18:
        return sum(p[1] for p in pts) / len(pts), sum(p[0] for p in pts) / len(pts)
    return cy / (3 * area), cx / (3 * area)


def haversine_km(lat1, lon1, lat2, lon2):
    rad = math.pi / 180
    a = math.sin((lat2-lat1)*rad/2)**2 + math.cos(lat1*rad)*math.cos(lat2*rad)*math.sin((lon2-lon1)*rad/2)**2
    return 6371.0088 * 2 * math.asin(math.sqrt(min(1.0, max(0.0, a))))


def ler_setores_geojson(caminho=None):
    caminho = Path(caminho) if caminho else DADOS / "setores.geojson"
    if not caminho.exists():
        raise ValueError("Malha nao encontrada: %s" % caminho)
    obj = json.loads(caminho.read_text(encoding="utf-8"))
    saida = []
    for i, f in enumerate(obj.get("features", [])):
        p, g = f.get("properties", {}), f.get("geometry")
        if not g or not poligonos(g):
            continue
        setor_c = achar_coluna(p.keys(), ["setor", "CD_SETOR", "CD_GEOCODI", "codigo_setor"])
        setor = str(p.get(setor_c, "") if setor_c else "").strip()
        if setor and setor[:7] != COD_MUNICIPIO:
            continue
        pop_c = achar_coluna(p.keys(), ["pessoas", "populacao", "pop_total", "V0001", "POP"])
        if pop_c is None:
            raise ValueError("Nao identifiquei a populacao no GeoJSON. Campos encontrados: %s" % list(p))
        pop = numero(p.get(pop_c))
        if pop is None or pop < 0:
            continue
        bairro_c = achar_coluna(p.keys(), ["bairro", "NM_BAIRRO", "nome_bairro"])
        lat, lon = centro(g)
        saida.append({"setor": setor or "setor-%d" % (i+1), "bairro": str(p.get(bairro_c) or "Sem bairro identificado"),
                      "pessoas": int(pop), "lat": lat, "lon": lon})
    if not saida:
        raise ValueError("Nenhum setor valido de Rio Claro foi identificado na malha.")
    return saida


def ler_setores_gpkg(caminho):
    """Importacao opcional do GeoPackage local; nomes de coluna descobertos por sinonimos."""
    try:
        import geopandas as gpd
    except ImportError as e:
        raise ValueError("Para ler .gpkg, instale geopandas no mesmo Python: python -m pip install geopandas") from e
    caminho = Path(caminho)
    if not caminho.exists():
        raise ValueError("GeoPackage nao encontrado: %s" % caminho)
    gdf = gpd.read_file(caminho, rows=None)
    if gdf.empty:
        raise ValueError("GeoPackage sem feicoes.")
    cols = list(gdf.columns)
    geom_col = gdf.geometry.name
    setor_c = achar_coluna([c for c in cols if c != geom_col],
                           ["CD_SETOR", "setor", "CD_GEOCODI", "codigo_setor"], obrigatoria=True, papel="codigo do setor")
    pop_c = achar_coluna([c for c in cols if c != geom_col],
                         ["pessoas", "populacao", "pop_total", "V0001", "POP", "V001", "total_pessoas"],
                         obrigatoria=True, papel="populacao")
    bairro_c = achar_coluna([c for c in cols if c != geom_col], ["NM_BAIRRO", "bairro", "nome_bairro"])
    mun_c = achar_coluna([c for c in cols if c != geom_col],
                         ["CD_MUN", "CD_MUNICIPIO", "codigo_municipio", "municipio_ibge"])
    setores = []
    for _, row in gdf.iterrows():
        codigo = re.sub(r"\D", "", str(row.get(setor_c, "")))
        if mun_c:
            mun = re.sub(r"\D", "", str(row.get(mun_c, "")))
            if mun and not mun.startswith(COD_MUNICIPIO):
                continue
        elif codigo and not codigo.startswith(COD_MUNICIPIO):
            continue
        pop = numero(row.get(pop_c))
        geom = row.geometry
        if pop is None or pop < 0 or geom is None or geom.is_empty:
            continue
        c = geom.centroid
        # GeoPackage de setores do IBGE normalmente usa coordenadas lon/lat (EPSG:4326).
        # Reprojetamos para WGS84 quando houver CRS declarado diferente.
        crs = getattr(gdf, "crs", None)
        if crs is None:
            raise ValueError("GeoPackage sem CRS declarado; nao e seguro interpretar coordenadas.")
        if str(crs).upper() not in ("EPSG:4326", "OGC:CRS84"):
            ponto = gpd.GeoSeries([c], crs=crs).to_crs("EPSG:4326").iloc[0]
            lon, lat = ponto.x, ponto.y
        else:
            lon, lat = c.x, c.y
        bairro = str(row.get(bairro_c) or "Sem bairro identificado") if bairro_c else "Sem bairro identificado"
        setores.append({"setor": codigo or "setor-%d" % (len(setores)+1), "bairro": bairro,
                        "pessoas": int(pop), "lat": float(lat), "lon": float(lon)})
    if not setores:
        raise ValueError("Nenhum setor de Rio Claro foi selecionado. Colunas usadas: setor=%s, populacao=%s, municipio=%s; verifique os codigos." % (setor_c, pop_c, mun_c))
    print("Campos identificados no GeoPackage: setor=%s; populacao=%s; bairro=%s; municipio=%s" % (setor_c, pop_c, bairro_c, mun_c))
    return setores


def servicos_com_coordenadas(catalogo, indice_cep):
    por_cat = {k: [] for k in CATEGORIAS}
    totais = {k: 0 for k in CATEGORIAS}
    for s in catalogo:
        if not str(s.get("id", "")).startswith("man-"):
            continue  # somente catalogo manual conferido pelo projeto
        for categoria, (tipo, subtipo) in CATEGORIAS.items():
            if s.get("tipo") == tipo and s.get("subtipo") == subtipo:
                totais[categoria] += 1
                lat, lon = numero(s.get("lat")), numero(s.get("lon"))
                if lat is None or lon is None:
                    cep = re.sub(r"\D", "", str(s.get("cep") or ""))
                    v = indice_cep.get(cep) if cep else None
                    if v and len(v) >= 2:
                        lat, lon = numero(v[0]), numero(v[1])
                if lat is not None and lon is not None and -90 <= lat <= 90 and -180 <= lon <= 180:
                    por_cat[categoria].append((str(s.get("id")), lat, lon))
    return por_cat, totais


def percentil95(valores):
    if not valores:
        return None
    ordenados = sorted(valores)
    return ordenados[max(0, math.ceil(0.95 * len(ordenados)) - 1)]


def calcular(setores, catalogo, indice_cep, hoje=None):
    por_cat, totais = servicos_com_coordenadas(catalogo, indice_cep)
    distancias = []
    for st in setores:
        item = {"setor": st["setor"], "bairro": st["bairro"], "pessoas": st["pessoas"]}
        for cat, servicos in por_cat.items():
            d = min((haversine_km(st["lat"], st["lon"], lat, lon) for _, lat, lon in servicos), default=None)
            item["distancia_%s_km" % cat] = round(d, 3) if d is not None else None
        distancias.append(item)
    escalas = {}
    for cat in CATEGORIAS:
        ds = [r["distancia_%s_km" % cat] for r in distancias if r["distancia_%s_km" % cat] is not None]
        escalas[cat] = percentil95(ds)
    for item in distancias:
        scores = []
        for cat in CATEGORIAS:
            d, escala = item["distancia_%s_km" % cat], escalas[cat]
            if d is not None and escala is not None:
                # Score relativo: 100 no servico contiguo, 0 a partir do P95 da propria cidade.
                score = 100.0 if escala <= 0 else max(0.0, min(100.0, 100 * (1 - d / escala)))
                item["indice_%s" % cat] = round(score, 1)
                scores.append(score)
            else:
                item["indice_%s" % cat] = None
        item["ics"] = round(sum(scores) / len(scores), 1) if scores else None
        item["categorias_com_dado"] = len(scores)
    bairros = {}
    for item in distancias:
        b = bairros.setdefault(item["bairro"], {"bairro": item["bairro"], "setores": 0, "pessoas": 0, "soma_ics_pop": 0.0, "pessoas_com_ics": 0})
        b["setores"] += 1
        b["pessoas"] += item["pessoas"]
        if item["ics"] is not None:
            b["soma_ics_pop"] += item["ics"] * item["pessoas"]
            b["pessoas_com_ics"] += item["pessoas"]
    resumo = []
    for b in bairros.values():
        resumo.append({"bairro": b["bairro"], "setores": b["setores"], "pessoas": b["pessoas"],
                       "ics_medio_ponderado": round(b["soma_ics_pop"] / b["pessoas_com_ics"], 1) if b["pessoas_com_ics"] else None,
                       "pessoas_com_ics": b["pessoas_com_ics"]})
    resumo.sort(key=lambda x: x["bairro"])
    return {
        "meta": {"fonte_populacao": "IBGE, Censo Demografico 2022, setores censitarios",
                 "fonte_servicos": "Catalogo manual do MISM3 e indice local de CEP",
                 "gerado_em": (hoje or date.today()).isoformat(), "metodo": "distancia em linha reta; escala por categoria = percentil 95 municipal",
                 "escala_p95_km": escalas,
                 "servicos": {c: {"com_coordenada": len(por_cat[c]), "cadastrados": totais[c]} for c in CATEGORIAS},
                 "pessoas_total": sum(s["pessoas"] for s in setores), "setores_total": len(setores), "aviso": AVISO},
        "setores": distancias, "bairros": resumo,
    }


def main(argv=None):
    ap = argparse.ArgumentParser(description="Gera um ICS exploratorio para acesso territorial a servicos.")
    ap.add_argument("--gpkg", help="GeoPackage local do IBGE; se omitido, usa web/dados/setores.geojson")
    ap.add_argument("--setores", help="GeoJSON agregado alternativo")
    ap.add_argument("--saida", type=Path, default=DADOS / "cobertura_territorial.json")
    a = ap.parse_args(argv)
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
    try:
        print("Lendo malha territorial...")
        if a.gpkg:
            setores = ler_setores_gpkg(a.gpkg)
        else:
            setores = ler_setores_geojson(a.setores)
        cat_path = DADOS / "catalogo_manual.json"
        cep_path = DADOS / "cep_indice.json"
        if not cat_path.exists():
            raise ValueError("Catalogo manual ausente: %s. Rode python pipeline/servicos.py --somente-manual." % cat_path)
        catalogo = json.loads(cat_path.read_text(encoding="utf-8")).get("servicos", [])
        indice = json.loads(cep_path.read_text(encoding="utf-8")).get("ceps", {}) if cep_path.exists() else {}
        resultado = calcular(setores, catalogo, indice)
        a.saida.parent.mkdir(parents=True, exist_ok=True)
        a.saida.write_text(json.dumps(resultado, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        cob = resultado["meta"]["servicos"]
        print("Gerado: %s" % a.saida)
        print("%d setores, %d bairros, %d pessoas." % (resultado["meta"]["setores_total"], len(resultado["bairros"]), resultado["meta"]["pessoas_total"]))
        print("Servicos com coordenadas: %s" % ", ".join("%s %d/%d" % (c, v["com_coordenada"], v["cadastrados"]) for c, v in cob.items()))
        print("ICS: indice comparativo exploratorio; veja os limites em meta.aviso.")
        return 0
    except (OSError, ValueError, json.JSONDecodeError) as e:
        print("NAO GERADO: %s" % e, file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
