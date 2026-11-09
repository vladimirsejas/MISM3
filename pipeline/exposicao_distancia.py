"""Distribuição de distâncias por setor (v1): quantos setores ficam longe do serviço mais próximo.

  python pipeline/exposicao_distancia.py

Complementa analise_territorial.py. Para cada categoria (CRAS, UBS/USF, escola municipal) mede, para cada setor censitário do
IBGE (Censo 2022), a distância em linha reta do ponto representativo do setor até o serviço mais próximo e informa quantos setores ficam a mais de
1 km e a mais de 2 km, além da mediana e do percentil 90 não ponderados. Não estima pessoas expostas nem usa dado pessoal.

Dois cenários, para mostrar a sensibilidade do resultado à qualidade da localização:
  coordenadas_do_catalogo  -> só coordenadas com método, confiança e valores registrados em localizacao_registro.csv;
  com_centro_do_cep        -> acrescenta, quando falta proveniência de coordenada, o centro do CEP institucional (aproximado).

Cuidado de leitura: quando uma categoria tem serviços sem coordenada, o serviço que falta não entra no cálculo e a distância fica
SUPERESTIMADA. Por isso cada resultado traz "cobertura" e o campo "completo"; só interprete como retrato da rede quando completo = true.
Saída: web/dados/exposicao_distancia.json.
"""
from __future__ import annotations

import json
import sys
from privacidade_territorial import setor_suprimido
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
AVISO = "Os resumos contam somente setores não suprimidos e não são ponderados por população; não representam pessoas expostas. Distâncias em linha reta não consideram ruas, ônibus nem horários. Coordenadas de catálogo sem proveniência registrada não entram no cenário de coordenadas individuais."


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


def resumir_setores(distancias, limiares):
    """Resumo não ponderado: informa quantidade e proporção de setores, nunca contagem de pessoas."""
    valores = sorted(round(float(d), 3) for d in distancias)
    total = len(valores)
    if not total:
        return None
    mediana = valores[total // 2] if total % 2 else round((valores[total // 2 - 1] + valores[total // 2]) / 2, 2)
    p90 = valores[min(total - 1, int((total - 1) * 0.9))]
    acima = {}
    for lim in limiares:
        n = sum(d > lim for d in valores)
        acima["%g km" % lim] = {"setores": n, "percentual": round(100 * n / total, 1)}
    return {"setores": total, "mediana_km": round(mediana, 2), "p90_km": round(p90, 2), "acima_de": acima}


def calcular(geojson, servicos, indice_cep, usar_cep, limiares=LIMIARES_KM, localizacao_registro=None, escolas=None):
    por_cat = {c: [] for c in at.CATEGORIAS}
    totais = {c: 0 for c in at.CATEGORIAS}
    for s in servicos:
        if not str(s.get("id", "")).startswith("man-"):
            continue
        for c, (tipo, sub) in at.CATEGORIAS.items():
            # A base escolar consolidada substitui as linhas escolares do catálogo.
            if escolas is not None and c == "escola":
                continue
            if s.get("tipo") == tipo and s.get("subtipo") == sub:
                totais[c] += 1
                if usar_cep:
                    xy = at.coordenada_do_servico(s, indice_cep, localizacao_registro)
                else:
                    xy = at.coordenada_catalogo_verificada(s, localizacao_registro)
                if xy:
                    por_cat[c].append(xy)

    if escolas is not None:
        totais["escola"] = len(escolas)
        for escola in escolas:
            local = escola.get("localizacao_mapa") or {}
            try:
                lat, lon = float(local["latitude"]), float(local["longitude"])
            except (KeyError, TypeError, ValueError):
                continue
            metodo = str(local.get("metodo") or "pendente")
            if metodo == "coordenada_individual" or (usar_cep and metodo == "centroide_cep"):
                por_cat["escola"].append((lat, lon))

    setores = []
    for f in geojson["features"]:
        pr = f["properties"]
        if setor_suprimido(pr):
            continue
        lat, lon = at.centro(f["geometry"])
        setores.append({"sem_bairro": not pr.get("bairro"), "lat": lat, "lon": lon})
    saida = {}
    for c, pontos in por_cat.items():
        cobertura = {"com_coordenada": len(pontos), "cadastrados": totais[c], "completo": len(pontos) == totais[c] and totais[c] > 0}
        if not pontos:
            saida[c] = {"cobertura": cobertura, "setores_validos": None, "setores_sem_bairro": None}
            continue
        distancias = [min(at.haversine_km(st["lat"], st["lon"], la, lo) for la, lo in pontos) for st in setores]
        sem_bairro = [d for d, st in zip(distancias, setores) if st["sem_bairro"]]
        saida[c] = {
            "cobertura": cobertura,
            "setores_validos": resumir_setores(distancias, limiares),
            "setores_sem_bairro": resumir_setores(sem_bairro, limiares),
        }
    return saida


def gerar(geojson, servicos, indice_cep, hoje=None, localizacao_registro=None, escolas=None):
    return {
        "meta": {
            "fonte": "IBGE, Censo Demográfico 2022 (setores) e catálogo verificado do Observatório da Mulher",
            "gerado_em": (hoje or date.today()).isoformat(),
            "aviso": AVISO,
            "limiares_km": list(LIMIARES_KM),
            "pessoas_total": None,
            "setores_suprimidos": sum(1 for f in geojson["features"] if setor_suprimido(f["properties"])),
        },
        "cenarios": {nome: calcular(geojson, servicos, indice_cep, usar, localizacao_registro=localizacao_registro, escolas=escolas) for nome, usar in CENARIOS.items()},
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
    localizacao_registro = at.carregar_localizacao_registro()
    arq_escolas = DADOS / "escolas_municipais.json"
    if not arq_escolas.exists():
        print("NÃO GERADO: falta web/dados/escolas_municipais.json. Gere a base escolar antes da exposição territorial.")
        return 1
    escolas = json.loads(arq_escolas.read_text(encoding="utf-8")).get("escolas", [])
    saida = gerar(geo, cat, indice, localizacao_registro=localizacao_registro, escolas=escolas)
    destino = DADOS / "exposicao_distancia.json"
    destino.write_text(json.dumps(saida, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print("Gravado %s; contagens populacionais não são publicadas." % destino.relative_to(RAIZ))
    for nome, cats in saida["cenarios"].items():
        print("\n[%s]" % nome)
        for c, r in cats.items():
            cob = r["cobertura"]
            t = r.get("setores_validos")
            if not t:
                print("  %-6s sem coordenada" % c)
                continue
            ac = t["acima_de"]
            print("  %-6s cobertura %d/%d%s | mediana %.2f km, p90 %.2f km | >1 km: %.1f%% (%d setores) | >2 km: %.1f%% (%d setores)" % (
                c, cob["com_coordenada"], cob["cadastrados"], "" if cob["completo"] else " (INCOMPLETA)", t["mediana_km"], t["p90_km"],
                ac["1 km"]["percentual"], ac["1 km"]["setores"], ac["2 km"]["percentual"], ac["2 km"]["setores"]))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
