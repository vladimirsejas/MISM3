"""Compara centroides atuais com pontos internos representativos dos setores.

Gera relatório de sensibilidade sem alterar os indicadores de produção.
Uso: python pipeline/auditoria_centroides.py
"""
from __future__ import annotations

import argparse
import json
import math
import statistics
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]
DADOS = RAIZ / "web" / "dados"
CATEGORIAS = ("cras", "ubs", "escola")
CENARIOS = {
    "coordenadas_do_catalogo": {"catalogo"},
    "com_centro_do_cep": {"catalogo", "centro_do_cep"},
}
METODO_ALTERNATIVO = "centroide_com_correcao_interna_minima_v1"


def _poligonos(geom):
    if geom.get("type") == "Polygon":
        return [list(geom.get("coordinates") or [])]
    if geom.get("type") == "MultiPolygon":
        return list(geom.get("coordinates") or [])
    raise ValueError("Geometria não é Polygon nem MultiPolygon")


def _anel_contem(anel, lon, lat):
    dentro = False
    j = len(anel) - 1
    for i in range(len(anel)):
        xi, yi = anel[i][0], anel[i][1]
        xj, yj = anel[j][0], anel[j][1]
        if (yi > lat) != (yj > lat) and lon < (xj - xi) * (lat - yi) / ((yj - yi) or 1e-18) + xi:
            dentro = not dentro
        j = i
    return dentro


def _contem(geom, lon, lat):
    return any(
        _anel_contem(poligono[0], lon, lat)
        and not any(_anel_contem(buraco, lon, lat) for buraco in poligono[1:])
        for poligono in _poligonos(geom) if poligono
    )


def _centro_atual(geom):
    """Reproduz o método centro() atual para comparar sem mudar a produção."""
    poligonos = _poligonos(geom)
    maior = max((p[0] for p in poligonos), key=len)
    pts = maior[:-1] if len(maior) > 1 and maior[0] == maior[-1] else maior
    area = cx = cy = 0.0
    for i in range(len(pts)):
        x0, y0 = pts[i][0], pts[i][1]
        x1, y1 = pts[(i + 1) % len(pts)][0], pts[(i + 1) % len(pts)][1]
        cruz = x0 * y1 - x1 * y0
        area += cruz
        cx += (x0 + x1) * cruz
        cy += (y0 + y1) * cruz
    if abs(area) < 1e-18:
        return sum(p[1] for p in pts) / len(pts), sum(p[0] for p in pts) / len(pts)
    area /= 2
    return cy / (6 * area), cx / (6 * area)


def _haversine_km(lat1, lon1, lat2, lon2):
    p = math.pi / 180
    a = math.sin((lat2 - lat1) * p / 2) ** 2 + math.cos(lat1 * p) * math.cos(lat2 * p) * math.sin((lon2 - lon1) * p / 2) ** 2
    return 2 * 6371.0088 * math.asin(math.sqrt(a))


def _intersecoes_anel(anel, y):
    xs = []
    for a, b in zip(anel, anel[1:]):
        x1, y1 = float(a[0]), float(a[1])
        x2, y2 = float(b[0]), float(b[1])
        if (y1 <= y < y2) or (y2 <= y < y1):
            xs.append(x1 + (y - y1) * (x2 - x1) / (y2 - y1))
    xs.sort()
    return [(xs[i], xs[i + 1]) for i in range(0, len(xs) - 1, 2) if xs[i + 1] > xs[i]]


def _subtrair_intervalos(base, remover):
    resultado = list(base)
    for r0, r1 in remover:
        novo = []
        for a, b in resultado:
            if r1 <= a or r0 >= b:
                novo.append((a, b))
            else:
                if r0 > a:
                    novo.append((a, min(r0, b)))
                if r1 < b:
                    novo.append((max(r1, a), b))
        resultado = novo
    return [(a, b) for a, b in resultado if b - a > 1e-12]


def ponto_interno(geom, centroide=None):
    """Mantém o centroide quando interno; caso contrário, busca o ponto interno mais próximo.

    A busca usa linhas no meio das faixas Y dos vértices e linhas próximas à
    latitude do centroide. Em cada intervalo interno, projeta a longitude do
    centroide para o intervalo e escolhe o candidato de menor distância
    geodésica. Buracos são descontados explicitamente.
    """
    if centroide is None:
        lat_centro, lon_centro = _centro_atual(geom)
    else:
        lon_centro, lat_centro = centroide
    if _contem(geom, lon_centro, lat_centro):
        return lat_centro, lon_centro

    melhor = None
    for poligono in _poligonos(geom):
        if not poligono or not poligono[0]:
            continue
        ys_vertices = sorted({float(p[1]) for anel in poligono for p in anel})
        if len(ys_vertices) < 2:
            continue
        ys = [(a + b) / 2 for a, b in zip(ys_vertices, ys_vertices[1:]) if b - a > 1e-12]
        minimo, maximo = ys_vertices[0], ys_vertices[-1]
        if minimo < lat_centro < maximo and lat_centro not in ys_vertices:
            ys.append(lat_centro)
        elif minimo < lat_centro < maximo:
            epsilon_y = min((maximo - minimo) * 1e-9, 1e-10)
            ys.extend(y for y in (lat_centro - epsilon_y, lat_centro + epsilon_y) if minimo < y < maximo)

        for y in ys:
            intervalos = _intersecoes_anel(poligono[0], y)
            for buraco in poligono[1:]:
                intervalos = _subtrair_intervalos(intervalos, _intersecoes_anel(buraco, y))
            for x0, x1 in intervalos:
                epsilon_x = min((x1 - x0) * 1e-8, 1e-10)
                x = max(x0 + epsilon_x, min(x1 - epsilon_x, lon_centro))
                if not _anel_contem(poligono[0], x, y) or any(_anel_contem(h, x, y) for h in poligono[1:]):
                    continue
                distancia = _haversine_km(lat_centro, lon_centro, y, x)
                if melhor is None or distancia < melhor[0]:
                    melhor = (distancia, y, x)

    if melhor is None:
        raise ValueError("Não foi possível encontrar ponto interno para a geometria")
    _, lat, lon = melhor
    return lat, lon

def _percentil(valores, q):
    if not valores:
        return None
    ordenados = sorted(valores)
    pos = (len(ordenados) - 1) * q
    baixo = int(pos)
    alto = min(baixo + 1, len(ordenados) - 1)
    frac = pos - baixo
    return ordenados[baixo] * (1 - frac) + ordenados[alto] * frac


def _equipamentos_por_cenario(equipamentos):
    return {
        cenario: {
            categoria: [
                (float(e["lat"]), float(e["lon"]))
                for e in equipamentos
                if e.get("categoria") == categoria
                and e.get("precisao") in precissoes
                and e.get("lat") is not None and e.get("lon") is not None
            ]
            for categoria in CATEGORIAS
        }
        for cenario, precissoes in CENARIOS.items()
    }


def comparar(geojson, indicadores):
    equipamentos = _equipamentos_por_cenario(indicadores.get("equipamentos", []))
    setores, deslocamentos, externos = [], [], []
    deltas = {c: {cat: [] for cat in CATEGORIAS} for c in CENARIOS}

    for feicao in sorted(geojson.get("features", []), key=lambda f: str(f.get("properties", {}).get("setor", ""))):
        props = feicao.get("properties") or {}
        codigo = str(props.get("setor") or "")
        geom = feicao.get("geometry") or {}
        lat_atual, lon_atual = _centro_atual(geom)
        atual_interno = _contem(geom, lon_atual, lat_atual)
        lat_novo, lon_novo = ponto_interno(geom, (lon_atual, lat_atual))
        if not _contem(geom, lon_novo, lat_novo):
            raise ValueError("Ponto alternativo fora do setor %s" % codigo)
        deslocamento = _haversine_km(lat_atual, lon_atual, lat_novo, lon_novo) * 1000
        deslocamentos.append(deslocamento)
        if not atual_interno:
            externos.append(codigo)

        distancias = {}
        for cenario, cats in equipamentos.items():
            distancias[cenario] = {}
            for categoria, pontos in cats.items():
                if not pontos:
                    distancias[cenario][categoria] = {"atual_km": None, "alternativa_km": None, "delta_km": None}
                    continue
                d_atual = min(_haversine_km(lat_atual, lon_atual, lat, lon) for lat, lon in pontos)
                d_novo = min(_haversine_km(lat_novo, lon_novo, lat, lon) for lat, lon in pontos)
                delta = d_novo - d_atual
                distancias[cenario][categoria] = {
                    "atual_km": round(d_atual, 6),
                    "alternativa_km": round(d_novo, 6),
                    "delta_km": round(delta, 6),
                }
                deltas[cenario][categoria].append(delta)
        setores.append({
            "setor": codigo,
            "centroide_atual": {"latitude": lat_atual, "longitude": lon_atual, "dentro_do_poligono": atual_interno},
            "ponto_interno_alternativo": {"latitude": lat_novo, "longitude": lon_novo, "metodo": METODO_ALTERNATIVO},
            "deslocamento_m": round(deslocamento, 3),
            "distancias": distancias,
        })

    resumo_distancias = {}
    for cenario, cats in deltas.items():
        resumo_distancias[cenario] = {}
        for categoria, valores in cats.items():
            absolutos = [abs(v) for v in valores]
            resumo_distancias[cenario][categoria] = {
                "setores_com_distancia": len(valores),
                "mediana_delta_assinado_km": round(statistics.median(valores), 6) if valores else None,
                "mediana_delta_absoluto_km": round(statistics.median(absolutos), 6) if valores else None,
                "p90_delta_absoluto_km": round(_percentil(absolutos, 0.90), 6) if valores else None,
                "maximo_delta_absoluto_km": round(max(absolutos), 6) if valores else None,
                "alteracao_maior_que_10m": sum(v > 0.01 for v in absolutos),
            }

    return {
        "meta": {
            "metodo_atual": "pipeline/analise_territorial.py: centro()",
            "metodo_alternativo": METODO_ALTERNATIVO,
            "unidade_deslocamento": "metros",
            "unidade_distancia": "quilometros",
            "setores_auditados": len(setores),
            "centroides_atualmente_fora": len(externos),
            "codigos_centroides_fora": externos,
            "regra": "Ponto interno alternativo usado apenas para análise de sensibilidade; não substitui o centroide de produção.",
            "equipamentos": "web/dados/indicadores_territoriais.json; mesmos pontos elegíveis por cenário e categoria.",
        },
        "resumo": {
            "deslocamento_ponto_mediana_m": round(statistics.median(deslocamentos), 3) if deslocamentos else None,
            "deslocamento_ponto_p90_m": round(_percentil(deslocamentos, 0.90), 3) if deslocamentos else None,
            "deslocamento_ponto_maximo_m": round(max(deslocamentos), 3) if deslocamentos else None,
            "distancias": resumo_distancias,
        },
        "setores": setores,
    }


def relatorio_markdown(resultado):
    meta, resumo = resultado["meta"], resultado["resumo"]
    linhas = [
        "# Auditoria de sensibilidade dos pontos representativos dos setores", "",
        "## Escopo", "",
        "Comparação exploratória sem alteração dos indicadores de produção. O centroide atual é mantido quando está dentro do polígono; quando está fora, o algoritmo procura o ponto interno mais próximo por varredura de linhas horizontais. O resultado não é um novo centroide oficial.", "",
        "## Resultado geométrico", "",
        "- Setores auditados: %d" % meta["setores_auditados"],
        "- Centroides atuais fora dos polígonos: %d" % meta["centroides_atualmente_fora"],
        "- Códigos: %s" % (", ".join(meta["codigos_centroides_fora"]) or "nenhum"),
        "- Deslocamento mediano: %s m" % resumo["deslocamento_ponto_mediana_m"],
        "- Deslocamento P90: %s m" % resumo["deslocamento_ponto_p90_m"],
        "- Deslocamento máximo: %s m" % resumo["deslocamento_ponto_maximo_m"], "",
        "## Impacto nas distâncias", "",
        "| Cenário | Categoria | Setores | Mediana da variação absoluta (km) | P90 absoluto (km) | Máximo absoluto (km) | Setores com alteração > 10 m |",
        "|---|---|---:|---:|---:|---:|---:|",
    ]
    for cenario, cats in resumo["distancias"].items():
        for categoria, v in cats.items():
            linhas.append("| %s | %s | %s | %s | %s | %s | %s |" % (
                cenario, categoria, v["setores_com_distancia"], v["mediana_delta_absoluto_km"],
                v["p90_delta_absoluto_km"], v["maximo_delta_absoluto_km"], v["alteracao_maior_que_10m"]))
    linhas += ["", "## Regra de interpretação", "", meta["regra"], "",
               "O cálculo usa os mesmos equipamentos elegíveis do JSON publicado e mede distância em linha reta. Não representa percurso, acessibilidade ou tempo de deslocamento.", ""]
    return "\n".join(linhas)


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--geojson", type=Path, default=DADOS / "setores.geojson")
    parser.add_argument("--indicadores", type=Path, default=DADOS / "indicadores_territoriais.json")
    parser.add_argument("--saida-json", type=Path, default=RAIZ / "docs/territorial/RELATORIO_SENSIBILIDADE_CENTROIDES.json")
    parser.add_argument("--saida-md", type=Path, default=RAIZ / "docs/territorial/RELATORIO_SENSIBILIDADE_CENTROIDES.md")
    args = parser.parse_args(argv)
    geo = json.loads(args.geojson.read_text(encoding="utf-8"))
    indicadores = json.loads(args.indicadores.read_text(encoding="utf-8"))
    resultado = comparar(geo, indicadores)
    args.saida_json.parent.mkdir(parents=True, exist_ok=True)
    args.saida_json.write_text(json.dumps(resultado, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    args.saida_md.write_text(relatorio_markdown(resultado), encoding="utf-8")
    print("Auditoria concluída: %d setores; %d centroides externos." % (
        resultado["meta"]["setores_auditados"], resultado["meta"]["centroides_atualmente_fora"]))
    print("Relatórios: %s | %s" % (args.saida_json, args.saida_md))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
