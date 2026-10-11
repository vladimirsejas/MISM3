"""Análise territorial (v1): quão longe cada bairro está dos serviços, com dados públicos.

  python pipeline/analise_territorial.py

Cruza a população de cada setor censitário (IBGE, Censo 2022: web/dados/setores.geojson) com a LOCALIZAÇÃO dos serviços do
catálogo verificado (catalogo_manual.json). Para cada bairro calcula a distância média (em linha reta) da população até o CRAS,
a UBS e a escola municipal mais próximos, e agrupa os bairros por semelhança (agrupamento k-means, exploratório).

NÃO usa dado pessoal de ninguém. É descritivo: mostra onde a rede cadastrada está longe da população, e não prova que falta serviço.

Precisa de COORDENADAS dos serviços. O catálogo manual não as traz: elas vêm do índice de CEP (web/dados/cep_indice.json, que fica
no computador do autor). Sem coordenadas o script NÃO escreve nada e explica o que falta: números sem base seriam enganosos.
Saída: web/dados/analise_territorial.json (lido pelo painel da Secretaria).
"""
from __future__ import annotations

import json
import math
import re
import sys
from datetime import date
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]
DADOS = RAIZ / "web" / "dados"
CATEGORIAS = {  # nome da coluna -> (tipo, subtipo) no catálogo
    "cras": ("assistencia", "cras"),
    "ubs": ("saude", "ubs"),
    "escola": ("creche", "escola_municipal"),
}
SEM_BAIRRO = "Sem bairro identificado"
AVISO = ("Distâncias em linha reta entre o centro de cada setor do IBGE e o serviço mais próximo, com a localização do serviço aproximada "
         "pelo centro do CEP. Não consideram ruas, ônibus nem horários. Mostram onde a rede cadastrada está longe da população; não provam "
         "falta de serviço. O agrupamento de bairros é exploratório.")


def haversine_km(lat1, lon1, lat2, lon2) -> float:
    p = math.pi / 180
    a = math.sin((lat2 - lat1) * p / 2) ** 2 + math.cos(lat1 * p) * math.cos(lat2 * p) * math.sin((lon2 - lon1) * p / 2) ** 2
    return 2 * 6371.0088 * math.asin(math.sqrt(a))


def _anel_contem(anel, lon, lat) -> bool:
    dentro = False
    j = len(anel) - 1
    for i in range(len(anel)):
        xi, yi = anel[i][0], anel[i][1]
        xj, yj = anel[j][0], anel[j][1]
        if (yi > lat) != (yj > lat) and lon < (xj - xi) * (lat - yi) / ((yj - yi) or 1e-18) + xi:
            dentro = not dentro
        j = i
    return dentro


def poligonos(geom) -> list:
    """Lista de polígonos; cada um é [anel_externo, *buracos]."""
    if geom["type"] == "Polygon":
        return [geom["coordinates"]]
    if geom["type"] == "MultiPolygon":
        return list(geom["coordinates"])
    return []


def contem(geom, lon, lat) -> bool:
    for pol in poligonos(geom):
        if _anel_contem(pol[0], lon, lat) and not any(_anel_contem(b, lon, lat) for b in pol[1:]):
            return True
    return False


def centro(geom):
    """Centroide (pelo cálculo de área) do maior polígono do setor. Devolve (lat, lon)."""
    maior = max((p[0] for p in poligonos(geom)), key=len)
    pts = maior[:-1] if len(maior) > 1 and maior[0] == maior[-1] else maior
    area = cx = cy = 0.0
    for i in range(len(pts)):
        x0, y0 = pts[i][0], pts[i][1]
        x1, y1 = pts[(i + 1) % len(pts)][0], pts[(i + 1) % len(pts)][1]
        cruz = x0 * y1 - x1 * y0
        area += cruz
        cx += (x0 + x1) * cruz
        cy += (y0 + y1) * cruz
    if abs(area) < 1e-18:  # polígono degenerado: média simples dos vértices
        return sum(p[1] for p in pts) / len(pts), sum(p[0] for p in pts) / len(pts)
    area /= 2
    return cy / (6 * area), cx / (6 * area)


def coordenada_do_servico(s, indice_cep):
    if s.get("lat") is not None and s.get("lon") is not None:
        return float(s["lat"]), float(s["lon"])
    cep = re.sub(r"\D", "", str(s.get("cep") or ""))
    if cep and cep in indice_cep:
        v = indice_cep[cep]
        return float(v[0]), float(v[1])
    return None


def analisar(geojson, servicos, indice_cep, k_grupos=3, hoje=None) -> dict:
    """Devolve o dicionário de saída. Levanta ValueError quando falta base para calcular."""
    # serviços por categoria, com coordenada
    por_cat = {c: [] for c in CATEGORIAS}
    totais = {c: 0 for c in CATEGORIAS}
    for s in servicos:
        if not str(s.get("id", "")).startswith("man-"):
            continue
        for c, (tipo, sub) in CATEGORIAS.items():
            if s.get("tipo") == tipo and s.get("subtipo") == sub:
                totais[c] += 1
                xy = coordenada_do_servico(s, indice_cep)
                if xy:
                    por_cat[c].append((s, xy))
    if not any(por_cat.values()):
        raise ValueError("nenhum serviço tem coordenada. Falta o índice de CEP (web/dados/cep_indice.json) ou latitude e longitude no catálogo.")

    setores = []
    for f in geojson["features"]:
        pr = f["properties"]
        lat, lon = centro(f["geometry"])
        setores.append({"bairro": pr.get("bairro") or SEM_BAIRRO, "pessoas": int(pr.get("pessoas") or 0), "geom": f["geometry"], "lat": lat, "lon": lon})

    bairros: dict[str, dict] = {}
    for st in setores:
        b = bairros.setdefault(st["bairro"], {"bairro": st["bairro"], "setores": 0, "pessoas": 0, "soma": {c: 0.0 for c in CATEGORIAS}, "servicos_no_bairro": 0})
        b["setores"] += 1
        b["pessoas"] += st["pessoas"]
        for c, lista in por_cat.items():
            if lista:
                d = min(haversine_km(st["lat"], st["lon"], xy[0], xy[1]) for _, xy in lista)
                b["soma"][c] += d * st["pessoas"]
    # serviços dentro de cada bairro (qualquer categoria cadastrada com coordenada)
    todos = [(s, xy) for lista in por_cat.values() for s, xy in lista]
    for s, xy in todos:
        for st in setores:
            if contem(st["geom"], xy[1], xy[0]):
                bairros[st["bairro"]]["servicos_no_bairro"] += 1
                break

    saida_b = []
    for b in bairros.values():
        item = {"bairro": b["bairro"], "setores": b["setores"], "pessoas": b["pessoas"], "servicos_no_bairro": b["servicos_no_bairro"]}
        for c in CATEGORIAS:
            item["distancia_media_%s_km" % c] = round(b["soma"][c] / b["pessoas"], 2) if por_cat[c] and b["pessoas"] else None
        saida_b.append(item)
    saida_b.sort(key=lambda x: x["bairro"])

    grupos = agrupar(saida_b, k_grupos)
    return {
        "meta": {
            "fonte": "IBGE, Censo Demográfico 2022 (setores) e catálogo verificado do Mulher em Rede",
            "gerado_em": (hoje or date.today()).isoformat(),
            "aviso": AVISO,
            "cobertura_dos_servicos": {c: {"com_coordenada": len(por_cat[c]), "cadastrados": totais[c]} for c in CATEGORIAS},
            "pessoas_total": sum(b["pessoas"] for b in saida_b),
        },
        "bairros": saida_b,
        "grupos": grupos,
    }


def agrupar(bairros, k):
    """Agrupamento exploratório (k-means, semente fixa) dos bairros pelas distâncias disponíveis. Sem scikit-learn, não agrupa."""
    cols = [c for c in ("distancia_media_cras_km", "distancia_media_ubs_km", "distancia_media_escola_km") if all(b[c] is not None for b in bairros)]
    if len(bairros) < max(8, 2 * k) or not cols:
        return None
    try:
        import numpy as np
        from sklearn.cluster import KMeans
    except Exception:
        return None
    X = np.array([[b[c] for c in cols] for b in bairros], dtype=float)
    desvio = X.std(axis=0)
    z = (X - X.mean(axis=0)) / np.where(desvio == 0, 1, desvio)
    rot = KMeans(n_clusters=k, n_init=10, random_state=20261011).fit_predict(z)
    for b, g in zip(bairros, rot):
        b["grupo"] = int(g)
    resumo = []
    for g in range(k):
        membros = [b for b in bairros if b["grupo"] == g]
        resumo.append({"grupo": g, "bairros": len(membros), "pessoas": sum(m["pessoas"] for m in membros),
                       **{"media_%s" % c: round(sum(m[c] for m in membros) / len(membros), 2) for c in cols}})
    resumo.sort(key=lambda r: r[("media_" + cols[0])])  # do mais perto ao mais longe do primeiro serviço
    return {"metodo": "k-means (k=%d) sobre distâncias padronizadas; exploratório" % k, "usa": cols, "resumo": resumo}


def main() -> int:
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
    geo = json.loads((DADOS / "setores.geojson").read_text(encoding="utf-8"))
    cat = json.loads((DADOS / "catalogo_manual.json").read_text(encoding="utf-8"))["servicos"]
    arq = DADOS / "cep_indice.json"
    indice = json.loads(arq.read_text(encoding="utf-8")).get("ceps", {}) if arq.exists() else {}
    try:
        saida = analisar(geo, cat, indice)
    except ValueError as e:
        print("NÃO GERADO:", e)
        print("Nada foi escrito. Coloque web/dados/cep_indice.json (gerado por pipeline/indice_cep.py) e rode de novo.")
        return 1
    destino = DADOS / "analise_territorial.json"
    destino.write_text(json.dumps(saida, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    cob = saida["meta"]["cobertura_dos_servicos"]
    print("Gravado %s: %d bairros. Serviços com coordenada: %s" % (destino.relative_to(RAIZ), len(saida["bairros"]),
          ", ".join("%s %d/%d" % (c, v["com_coordenada"], v["cadastrados"]) for c, v in cob.items())))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
