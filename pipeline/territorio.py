"""Indicadores territoriais de Rio Claro por setor censitário (Censo 2022, IBGE) -> web/dados/territorio.json.

Entrada : web/dados/setores.geojson (408 setores com bairro, situação, pessoas e domicílios; gerado por setores.py
          a partir da malha oficial do IBGE) e, se existir, web/dados/oferta_educacao_infantil.json (INEP).
Saída   : web/dados/territorio.json, que alimenta a vista "Rio Claro em numeros" do dashboard (web/index.html).

Indicadores (todos de dado público e agregado; nada de pessoa):
  - densidade = pessoas / área do setor (hab/km²). A área vem do próprio polígono, num plano local centrado em
    Rio Claro. Conferência: a soma das áreas dá ~497 km² contra 498,4 km² publicados pelo IBGE.
  - pessoas por domicílio, só para setores com pelo menos MIN_DOMICILIOS domicílios. Setores pequenos dão valores
    absurdos (há setor com 106 pessoas em 1 domicílio, provavelmente domicílio coletivo) e ficam "sem base suficiente".

Distância até o serviço (só quando há serviços COM LOCALIZAÇÃO no catálogo): para cada setor, a distância em linha reta do
centro do setor até o CRAS, a UBS/USF e a escola municipal com creche (confirmada no Censo Escolar) mais próximos.
A localização vem do endereço (latitude e longitude do catálogo, "precisão endereço") ou, na falta dela, do centro do CEP
(web/dados/cep_indice.json, "precisão CEP", aproximada; CEP com raio acima de RAIO_MAX_CEP_M é vago demais e não conta).
Sem nenhum serviço localizado, o arquivo simplesmente não traz distâncias: números sem base enganariam. O mesmo vale para uma
categoria com poucos serviços localizados (menos de COBERTURA_MINIMA): ela vira "pendente" e a página diz o que falta.

O que NÃO é: não mede vulnerabilidade, renda, nem necessidade. Não há idade, renda nem sexo na malha usada; esses
campos vêm dos "Agregados por setores censitários" do Censo 2022, que ainda não estão no projeto.

Uso:
    python pipeline/territorio.py
"""
from __future__ import annotations

import json
import math
import sys
from privacidade_territorial import setor_suprimido
from collections import Counter, defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from analise_territorial import centro, haversine_km  # noqa: E402  (centroide do setor e distância em linha reta)
from common import WEB_DADOS, agora_iso, erro, salvar_json  # noqa: E402

LAT0 = -22.40                       # latitude central de Rio Claro, para o plano local
KM_POR_GRAU_LAT = 110.574
KM_POR_GRAU_LON = 111.320 * math.cos(math.radians(LAT0))
MIN_DOMICILIOS = 20                 # abaixo disso, pessoas por domicílio não é confiável
LIMITES_DENSIDADE = [500, 2000, 5000, 10000]        # hab/km²; 5 classes
LIMITES_PESSOAS_POR_DOMICILIO = [2.0, 2.3, 2.6, 3.0]  # 5 classes
LIMITES_DISTANCIA_KM = [0.5, 1.0, 2.0, 3.0]   # 5 classes de distância até o serviço
# Só mostra distância de uma categoria se pelo menos esta parte dos serviços cadastrados estiver localizada. Com 2 de 6 CRAS
# no mapa, "65 mil pessoas a 3 km ou mais de um CRAS" seria falso: os 4 que faltam estão em algum lugar.
COBERTURA_MINIMA = 0.70
RAIO_MAX_CEP_M = 800                           # CEP com raio maior (ex.: CEP geral da cidade) é vago demais para localizar
CAIXA_RIO_CLARO = (-22.60, -22.20, -47.82, -47.41)  # lat_min, lat_max, lon_min, lon_max
CATEGORIAS_SERVICO = {
    "cras": {"rotulo": "CRAS", "nota": None,
             "serve": lambda s: s.get("tipo") == "assistencia" and s.get("subtipo") == "cras"},
    "ubs": {"rotulo": "UBS ou USF", "nota": None,
            "serve": lambda s: s.get("tipo") == "saude" and s.get("subtipo") == "ubs"},
    "creche": {"rotulo": "escola municipal com creche",
               "nota": "Só entram as escolas municipais que o Censo Escolar confirma como creche; as demais não têm a etapa conhecida.",
               "serve": lambda s: s.get("tipo") == "creche" and s.get("subtipo") == "escola_municipal"
               and bool((s.get("etapas") or {}).get("creche"))},
}
# valores publicados pelo IBGE para Rio Claro (SP), usados só para conferir o cálculo
SEM_BAIRRO = "Sem bairro definido pelo IBGE"   # a malha do IBGE não traz bairro para parte dos setores (NM_BAIRRO vazio)
IBGE_PESSOAS_2022 = 201418
IBGE_AREA_KM2 = 498.403


def area_do_anel_km2(anel) -> float:
    soma = 0.0
    for (x1, y1), (x2, y2) in zip(anel, anel[1:] + anel[:1]):
        soma += (x1 * KM_POR_GRAU_LON) * (y2 * KM_POR_GRAU_LAT) - (x2 * KM_POR_GRAU_LON) * (y1 * KM_POR_GRAU_LAT)
    return abs(soma) / 2


def area_km2(geometria: dict) -> float:
    """Área de um Polygon ou MultiPolygon: anel externo menos os furos."""
    poligonos = [geometria["coordinates"]] if geometria["type"] == "Polygon" else geometria["coordinates"]
    total = 0.0
    for p in poligonos:
        total += area_do_anel_km2(p[0]) - sum(area_do_anel_km2(furo) for furo in p[1:])
    return total


def classe(valor, limites) -> int:
    """0 a len(limites): quantos limites o valor alcança (limite inferior inclusivo)."""
    return sum(valor >= l for l in limites)


def _na_caixa(lat, lon) -> bool:
    return CAIXA_RIO_CLARO[0] <= lat <= CAIXA_RIO_CLARO[1] and CAIXA_RIO_CLARO[2] <= lon <= CAIXA_RIO_CLARO[3]


def localizar_servico(s: dict, indice_cep: dict | None):
    """(lat, lon, precisao, raio_m) do serviço, ou None. 'endereco' = latitude/longitude do catálogo; 'cep' = centro do CEP."""
    lat, lon = s.get("lat"), s.get("lon")
    if lat is not None and lon is not None:
        try:
            lat, lon = float(lat), float(lon)
        except (TypeError, ValueError):
            return None
        return (lat, lon, "endereco", 0) if _na_caixa(lat, lon) else None
    cep = "".join(c for c in str(s.get("cep") or "") if c.isdigit())
    v = (indice_cep or {}).get(cep)
    if v and float(v[2]) <= RAIO_MAX_CEP_M and _na_caixa(float(v[0]), float(v[1])):
        return float(v[0]), float(v[1]), "cep", round(float(v[2]))
    return None


def _mediana_ponderada(pares) -> float | None:
    """Mediana de (valor, peso)."""
    pares = sorted(p for p in pares if p[1] > 0)
    total = sum(w for _, w in pares)
    if not total:
        return None
    acumulado = 0
    for v, w in pares:
        acumulado += w
        if acumulado >= total / 2:
            return v
    return pares[-1][0]


def distancias_ate_servicos(geojson: dict, servicos: list[dict], indice_cep: dict | None) -> tuple[dict, dict]:
    """Distâncias por setor apenas para setores não suprimidos; resumos contam setores, nunca pessoas."""
    centros = {}
    for f in geojson["features"]:
        p = f["properties"]
        centros[p["setor"]] = (centro(f["geometry"]), not setor_suprimido(p))
    saida, pendentes = {}, {}
    for chave, cat in CATEGORIAS_SERVICO.items():
        elegiveis = [s for s in servicos if str(s.get("id", "")).startswith("man-") and cat["serve"](s)]
        pontos = []
        for s in elegiveis:
            loc = localizar_servico(s, indice_cep)
            if loc:
                pontos.append({"nome": s["nome"], "lat": round(loc[0], 6), "lon": round(loc[1], 6), "precisao": loc[2], "raio_m": loc[3]})
        if not pontos:
            continue
        if len(pontos) / len(elegiveis) < COBERTURA_MINIMA:
            pendentes[chave] = {"rotulo": cat["rotulo"], "cadastrados": len(elegiveis), "localizados": len(pontos),
                                "minimo_pct": round(100 * COBERTURA_MINIMA)}
            continue
        por_setor, distancias = {}, []
        for codigo, (coord, liberado) in centros.items():
            if not liberado:
                por_setor[codigo] = None
                continue
            lat, lon = coord
            d = round(min(haversine_km(lat, lon, p["lat"], p["lon"]) for p in pontos), 2)
            por_setor[codigo] = d
            distancias.append(d)
        contagem = [0] * (len(LIMITES_DISTANCIA_KM) + 1)
        for d in distancias:
            contagem[classe(d, LIMITES_DISTANCIA_KM)] += 1
        distancias_ordenadas = sorted(distancias)
        mediana = None
        if distancias_ordenadas:
            meio = len(distancias_ordenadas) // 2
            mediana = distancias_ordenadas[meio] if len(distancias_ordenadas) % 2 else round((distancias_ordenadas[meio - 1] + distancias_ordenadas[meio]) / 2, 2)
        saida[chave] = {
            "rotulo": cat["rotulo"], "nota": cat["nota"],
            "cadastrados": len(elegiveis), "localizados": len(pontos),
            "localizados_pelo_endereco": sum(p["precisao"] == "endereco" for p in pontos),
            "pontos": pontos, "por_setor": por_setor,
            "limites": LIMITES_DISTANCIA_KM, "contagem": contagem,
            "setores_total": len(centros), "setores_suprimidos": len(centros) - len(distancias),
            "setores_ate_1_km": sum(d <= 1.0 for d in distancias),
            "setores_3_km_ou_mais": sum(d >= 3.0 for d in distancias),
            "mediana_km": mediana,
        }
    return saida, pendentes


def montar(geojson: dict, oferta: dict | None = None, hoje: str | None = None, servicos: list[dict] | None = None,
           indice_cep: dict | None = None) -> dict:
    setores = {}
    por_bairro = defaultdict(lambda: {"setores": 0, "pessoas": 0, "domicilios": 0, "area": 0.0, "suprimido": False})
    cont_dens = Counter()
    cont_ppd = Counter()
    sem_base = 0
    suprimidos = 0
    for f in geojson["features"]:
        p = f["properties"]
        area = area_km2(f["geometry"])
        suprimido = setor_suprimido(p)
        pessoas = None if suprimido or p.get("pessoas") is None else int(p["pessoas"])
        domicilios = None if suprimido or p.get("domicilios") is None else int(p["domicilios"])
        dens = pessoas / area if pessoas is not None and area > 0 else None
        ppd = pessoas / domicilios if pessoas is not None and domicilios is not None and domicilios >= MIN_DOMICILIOS else None
        setores[p["setor"]] = {
            "a": round(area, 4), "d": None if dens is None else round(dens),
            "p": None if ppd is None else round(ppd, 2), "suprimido_privacidade": suprimido,
        }
        if suprimido:
            suprimidos += 1
        elif dens is not None:
            cont_dens[classe(dens, LIMITES_DENSIDADE)] += 1
        if ppd is not None:
            cont_ppd[classe(ppd, LIMITES_PESSOAS_POR_DOMICILIO)] += 1
        else:
            sem_base += 1
        b = por_bairro[(p["bairro"] or "").strip() or SEM_BAIRRO]
        b["setores"] += 1
        b["suprimido"] = b["suprimido"] or suprimido
        if pessoas is not None and domicilios is not None:
            b["pessoas"] += pessoas
            b["domicilios"] += domicilios
        b["area"] += area

    pessoas_total = None if suprimidos else sum(b["pessoas"] for b in por_bairro.values())
    domicilios_total = None if suprimidos else sum(b["domicilios"] for b in por_bairro.values())
    area_total = sum(b["area"] for b in por_bairro.values())
    bairros = []
    for nome, b in por_bairro.items():
        bairros.append({
            "nome": nome, "setores": b["setores"],
            "pessoas": None if b["suprimido"] else b["pessoas"],
            "domicilios": None if b["suprimido"] else b["domicilios"],
            "dados_suprimidos": b["suprimido"],
            "area_km2": round(b["area"], 2),
            "densidade": None if b["suprimido"] or b["area"] <= 0 else round(b["pessoas"] / b["area"]),
            "pessoas_por_domicilio": None if b["suprimido"] or b["domicilios"] < MIN_DOMICILIOS else round(b["pessoas"] / b["domicilios"], 2),
        })
    bairros.sort(key=lambda b: (b["pessoas"] is None, -(b["pessoas"] or 0), b["nome"]))
    sem = por_bairro.get(SEM_BAIRRO)

    saida = {
        "meta": {
            "fonte": "IBGE, Censo Demográfico 2022, malha de setores censitários; contagens pequenas omitidas por cautela estatística",
            "gerado_em": hoje or agora_iso()[:10],
            "conferencia": {
                "pessoas_somadas": pessoas_total, "pessoas_publicadas_ibge": IBGE_PESSOAS_2022 if not suprimidos else None,
                "area_somada_km2": round(area_total, 1), "area_publicada_ibge_km2": IBGE_AREA_KM2,
                "diferenca_area_pct": round(100 * (area_total - IBGE_AREA_KM2) / IBGE_AREA_KM2, 2),
            },
            "sem_bairro": {"rotulo": SEM_BAIRRO, "setores": sem["setores"] if sem else 0, "pessoas": None if (sem and sem["suprimido"]) or suprimidos else (sem["pessoas"] if sem else 0)},
            "setores_suprimidos": suprimidos,
            "aviso": "Dados de população, domicílios e indicadores derivados são omitidos em setores com menos de 5 pessoas ou menos de 3 domicílios, e nos agregados de bairros afetados. O painel preserva a geometria e os pontos institucionais. Não há idade, renda nem sexo nesta malha.",
        },
        "totais": {
            "pessoas": pessoas_total, "domicilios": domicilios_total, "setores": len(setores), "bairros": len(bairros),
            "area_km2": round(area_total, 1),
            "densidade": None if suprimidos or not area_total else round(pessoas_total / area_total),
            "pessoas_por_domicilio": None if suprimidos or not domicilios_total else round(pessoas_total / domicilios_total, 2),
        },
        "classes": {
            "densidade": {"unidade": "pessoas por km²", "limites": LIMITES_DENSIDADE,
                          "contagem": [cont_dens[i] for i in range(len(LIMITES_DENSIDADE) + 1)], "suprimidos": suprimidos},
            "pessoas_por_domicilio": {"unidade": "pessoas por domicílio", "limites": LIMITES_PESSOAS_POR_DOMICILIO,
                                      "min_domicilios": MIN_DOMICILIOS,
                                      "contagem": [cont_ppd[i] for i in range(len(LIMITES_PESSOAS_POR_DOMICILIO) + 1)],
                                      "sem_base_suficiente": sem_base, "suprimidos": suprimidos},
        },
        "bairros": bairros,
        "setores": setores,
    }
    dist, pendentes = distancias_ate_servicos(geojson, servicos or [], indice_cep) if servicos else ({}, {})
    if pendentes:
        saida["distancia_pendente"] = pendentes
    if dist:
        saida["distancia_ate_servico"] = {k: {kk: vv for kk, vv in v.items() if kk != "por_setor"} for k, v in dist.items()}
        saida["meta"]["aviso_distancia"] = (
            "Distâncias em linha reta são exibidas somente para setores sem supressão estatística. "
            "Os resumos contam setores, não pessoas. Onde a localização vem do CEP, é aproximada; "
            "não considera ruas, ônibus nem horários e não prova falta de serviço.")
        for chave, v in dist.items():
            for codigo, d in v["por_setor"].items():
                saida["setores"][codigo]["dist_" + chave] = d
    if oferta:
        saida["educacao_infantil"] = {
            "fonte": oferta["meta"]["fonte"], "aviso": oferta["meta"]["aviso"], "por_rede": oferta["totais_por_rede"]}
    return saida


def main() -> int:
    caminho = WEB_DADOS / "setores.geojson"
    if not caminho.exists():
        erro("Não achei %s. Rode antes python pipeline/setores.py." % caminho)
    geojson = json.loads(caminho.read_text(encoding="utf-8"))
    p_oferta = WEB_DADOS / "oferta_educacao_infantil.json"
    oferta = json.loads(p_oferta.read_text(encoding="utf-8")) if p_oferta.exists() else None
    p_cat, p_cep = WEB_DADOS / "catalogo_manual.json", WEB_DADOS / "cep_indice.json"
    servicos = json.loads(p_cat.read_text(encoding="utf-8")).get("servicos") if p_cat.exists() else None
    indice_cep = json.loads(p_cep.read_text(encoding="utf-8")).get("ceps", {}) if p_cep.exists() else None
    saida = montar(geojson, oferta, servicos=servicos, indice_cep=indice_cep)
    salvar_json(saida, WEB_DADOS / "territorio.json")
    c, t = saida["meta"]["conferencia"], saida["totais"]
    print("Gravado web/dados/territorio.json: %d setores, %d bairros; contagens demográficas suprimidas por cautela." %
          (t["setores"], t["bairros"]))
    print("Conferência de área: %.1f km² (referência IBGE %.1f; diferença %.2f%%). Contagens populacionais não são reexibidas." %
          (c["area_somada_km2"], c["area_publicada_ibge_km2"], c["diferenca_area_pct"]))
    print("Densidade: %s | pessoas por domicílio: %s (sem base suficiente: %d)" %
          (saida["classes"]["densidade"]["contagem"], saida["classes"]["pessoas_por_domicilio"]["contagem"],
           saida["classes"]["pessoas_por_domicilio"]["sem_base_suficiente"]))
    for chave, v in saida.get("distancia_ate_servico", {}).items():
        print("Distância até %s: %d de %d localizados (%d pelo endereço); %d setores a 3 km ou mais entre os não suprimidos." %
              (v["rotulo"], v["localizados"], v["cadastrados"], v["localizados_pelo_endereco"], v["setores_3_km_ou_mais"]))
    for chave, v in saida.get("distancia_pendente", {}).items():
        print("SEM distância até %s: só %d de %d localizados (mínimo %d%%). Localize mais serviços antes de mostrar." %
              (v["rotulo"], v["localizados"], v["cadastrados"], v["minimo_pct"]))
    if "distancia_ate_servico" not in saida and "distancia_pendente" not in saida:
        print("Sem distâncias: nenhum serviço do catálogo tem localização (latitude/longitude ou CEP no cep_indice.json).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
