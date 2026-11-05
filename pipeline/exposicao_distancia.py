"""Exposição à distância (v1): que parcela da população mora longe do serviço mais próximo.

  python pipeline/exposicao_distancia.py

Complementa analise_territorial.py. Para cada categoria (CRAS, UBS/USF, escola municipal) mede, para cada setor censitário do
IBGE (Censo 2022), a distância em linha reta do centro do setor até o serviço mais próximo e informa quantas pessoas ficam a mais de
1 km e a mais de 2 km, além da mediana e do percentil 90 ponderados pela população. NÃO usa dado pessoal de ninguém.

Dois cenários, para mostrar a sensibilidade do resultado à qualidade da localização:
  coordenadas_do_catalogo  -> só serviços com latitude e longitude no catálogo (conferidas pelo autor);
  com_centro_do_cep        -> acrescenta, quando falta coordenada, o centro do CEP (aproximado, menos preciso).

Cuidado de leitura: quando uma categoria tem serviços sem coordenada, o serviço que falta não entra no cálculo e a distância fica
SUPERESTIMADA. Por isso cada resultado traz "cobertura" e o campo "completo"; só interprete como retrato da rede quando completo = true.
Saída: web/dados/exposicao_distancia.json.
"""
from __future__ import annotations

import json
import sys
from datetime import date
from pathlib import Path

import analise_territorial as at

RAIZ = Path(__file__).resolve().parents[1]
DADOS = RAIZ / "web" / "dados"
LIMIARES_KM = (1.0, 2.0)
CENARIOS = {
    "coordenadas_do_catalogo": False,
    "com_centro_do_cep": True,
}
AVISO = ("Distâncias em linha reta entre o centro de cada setor do IBGE e o serviço mais próximo; não consideram ruas, ônibus nem "
         "horários. Mostram onde a rede cadastrada fica longe da população e não provam falta de serviço. Categoria com cobertura "
         "incompleta de coordenadas tem distância superestimada.")


def quantil_ponderado(pares, q):
    """Quantil q (0 a 1) de valores (distância, peso). Devolve None se não há peso."""
    total = sum(p for _, p in pares)
    if total <= 0:
        return None
    acumulado = 0.0
    for d, p in sorted(pares):
        acumulado += p
        if acumulado >= q * total:
            return d
    return sorted(pares)[-1][0]


def resumir(pares, limiares):
    """pares = [(distancia_km, pessoas)]. Resumo ponderado pela população."""
    total = sum(p for _, p in pares)
    out = {"pessoas": total, "setores": len(pares)}
    if total <= 0:
        return out
    out["mediana_km"] = round(quantil_ponderado(pares, 0.5), 2)
    out["p90_km"] = round(quantil_ponderado(pares, 0.9), 2)
    out["acima_de"] = {}
    for lim in limiares:
        longe = sum(p for d, p in pares if d > lim)
        out["acima_de"]["%g km" % lim] = {"pessoas": longe, "percentual": round(100 * longe / total, 1),
                                          "setores": sum(1 for d, _ in pares if d > lim)}
    return out


def calcular(geojson, servicos, indice_cep, usar_cep, limiares=LIMIARES_KM):
    por_cat = {c: [] for c in at.CATEGORIAS}
    totais = {c: 0 for c in at.CATEGORIAS}
    for s in servicos:
        if not str(s.get("id", "")).startswith("man-"):
            continue
        for c, (tipo, sub) in at.CATEGORIAS.items():
            if s.get("tipo") == tipo and s.get("subtipo") == sub:
                totais[c] += 1
                if s.get("lat") is not None and s.get("lon") is not None:
                    xy = (float(s["lat"]), float(s["lon"]))
                elif usar_cep:
                    xy = at.coordenada_do_servico(s, indice_cep)
                else:
                    xy = None
                if xy:
                    por_cat[c].append(xy)
    setores = []
    for f in geojson["features"]:
        pr = f["properties"]
        lat, lon = at.centro(f["geometry"])
        setores.append({"sem_bairro": not pr.get("bairro"), "pessoas": int(pr.get("pessoas") or 0), "lat": lat, "lon": lon})
    saida = {}
    for c, pontos in por_cat.items():
        cobertura = {"com_coordenada": len(pontos), "cadastrados": totais[c], "completo": len(pontos) == totais[c] and totais[c] > 0}
        if not pontos:
            saida[c] = {"cobertura": cobertura, "populacao_toda": None}
            continue
        pares = [(min(at.haversine_km(st["lat"], st["lon"], la, lo) for la, lo in pontos), st["pessoas"]) for st in setores]
        pares_sem = [(d, st["pessoas"]) for (d, _), st in zip(pares, setores) if st["sem_bairro"]]
        saida[c] = {"cobertura": cobertura, "populacao_toda": resumir(pares, limiares), "setores_sem_bairro": resumir(pares_sem, limiares)}
    return saida


def gerar(geojson, servicos, indice_cep, hoje=None):
    return {
        "meta": {
            "fonte": "IBGE, Censo Demográfico 2022 (setores) e catálogo verificado do Observatório da Mulher",
            "gerado_em": (hoje or date.today()).isoformat(),
            "aviso": AVISO,
            "limiares_km": list(LIMIARES_KM),
            "pessoas_total": sum(int(f["properties"].get("pessoas") or 0) for f in geojson["features"]),
        },
        "cenarios": {nome: calcular(geojson, servicos, indice_cep, usar) for nome, usar in CENARIOS.items()},
    }


def main() -> int:
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
    geo = json.loads((DADOS / "setores.geojson").read_text(encoding="utf-8"))
    cat = json.loads((DADOS / "catalogo_manual.json").read_text(encoding="utf-8"))["servicos"]
    arq = DADOS / "cep_indice.json"
    indice = json.loads(arq.read_text(encoding="utf-8")).get("ceps", {}) if arq.exists() else {}
    saida = gerar(geo, cat, indice)
    destino = DADOS / "exposicao_distancia.json"
    destino.write_text(json.dumps(saida, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print("Gravado %s (população %d)" % (destino.relative_to(RAIZ), saida["meta"]["pessoas_total"]))
    for nome, cats in saida["cenarios"].items():
        print("\n[%s]" % nome)
        for c, r in cats.items():
            cob = r["cobertura"]
            t = r.get("populacao_toda")
            if not t:
                print("  %-6s sem coordenada" % c)
                continue
            ac = t["acima_de"]
            print("  %-6s cobertura %d/%d%s | mediana %.2f km, p90 %.2f km | >1 km: %.1f%% (%d pessoas) | >2 km: %.1f%% (%d pessoas)" % (
                c, cob["com_coordenada"], cob["cadastrados"], "" if cob["completo"] else " (INCOMPLETA)", t["mediana_km"], t["p90_km"],
                ac["1 km"]["percentual"], ac["1 km"]["pessoas"], ac["2 km"]["percentual"], ac["2 km"]["pessoas"]))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
