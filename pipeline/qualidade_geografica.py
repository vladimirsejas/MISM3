"""Auditoria reproduzível da qualidade geográfica e da proveniência dos dados territoriais."""
from __future__ import annotations

import argparse
import csv
import json
import math
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]
DADOS = RAIZ / "web" / "dados"
CATALOGO = RAIZ / "catalogo" / "servicos_manuais.csv"
LOCALIZACAO = RAIZ / "catalogo" / "localizacao_registro.csv"
REFERENCIA_AREA_KM2 = 498.403
LATITUDE_REFERENCIA = -22.40
KM_POR_GRAU_LAT = 110.574
KM_POR_GRAU_LON = 111.320 * math.cos(math.radians(LATITUDE_REFERENCIA))
RAIO_TERRA_KM = 6371.0088


def _poligonos(geom):
    if geom.get("type") == "Polygon":
        return [geom.get("coordinates") or []]
    if geom.get("type") == "MultiPolygon":
        return geom.get("coordinates") or []
    return []


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


def ponto_na_malha(geojson, lon, lat):
    for f in geojson.get("features", []):
        for p in _poligonos(f.get("geometry") or {}):
            if p and _anel_contem(p[0], lon, lat) and not any(_anel_contem(h, lon, lat) for h in p[1:]):
                return True
    return False



def area_anel_local_km2(anel):
    soma = 0.0
    for (x1, y1), (x2, y2) in zip(anel, anel[1:] + anel[:1]):
        soma += (x1 * KM_POR_GRAU_LON) * (y2 * KM_POR_GRAU_LAT) - (x2 * KM_POR_GRAU_LON) * (y1 * KM_POR_GRAU_LAT)
    return abs(soma) / 2


def area_anel_geodesica_km2(anel):
    """Área esférica pelo integral de longitude e seno da latitude (km²)."""
    soma = 0.0
    for (lon1, lat1), (lon2, lat2) in zip(anel, anel[1:] + anel[:1]):
        soma += math.radians(lon2 - lon1) * (2 + math.sin(math.radians(lat1)) + math.sin(math.radians(lat2)))
    return abs(soma) * RAIO_TERRA_KM ** 2 / 2


def areas_geojson_km2(geojson):
    local = geodesica = 0.0
    for f in geojson.get("features", []):
        for poligono in _poligonos(f.get("geometry") or {}):
            if not poligono:
                continue
            local += area_anel_local_km2(poligono[0]) - sum(area_anel_local_km2(h) for h in poligono[1:])
            geodesica += area_anel_geodesica_km2(poligono[0]) - sum(area_anel_geodesica_km2(h) for h in poligono[1:])
    return local, geodesica


def validar_geometrias(geojson):
    ids, duplicados, invalidas = set(), [], []
    for f in geojson.get("features", []):
        props = f.get("properties") or {}
        codigo = str(props.get("setor") or "sem_codigo")
        if codigo in ids:
            duplicados.append(codigo)
        ids.add(codigo)
        geom = f.get("geometry") or {}
        polys = _poligonos(geom)
        erros = []
        if not polys:
            erros.append("tipo_ou_coordenadas_ausentes")
        for pol in polys:
            if not pol:
                erros.append("poligono_sem_anel")
                continue
            for anel in pol:
                if len(anel) < 4:
                    erros.append("anel_com_menos_de_quatro_pontos")
                elif anel[0] != anel[-1]:
                    erros.append("anel_nao_fechado")
                if any(not (-180 <= p[0] <= 180 and -90 <= p[1] <= 90) for p in anel):
                    erros.append("coordenada_fora_dos_limites_geograficos")
        if erros:
            invalidas.append({"setor": codigo, "problemas": sorted(set(erros))})
    return {"total": len(geojson.get("features", [])), "codigos_unicos": len(ids),
            "duplicados": duplicados, "geometrias_com_erro_estrutural": invalidas}


def resumir(geojson, territorio, indicadores, localizacao, catalogo_registros=None):
    setores = geojson.get("features", [])
    equipamentos = indicadores.get("equipamentos", [])
    categorias = {c: [e for e in equipamentos if e.get("categoria") == c] for c in ("cras", "ubs", "escola")}
    cras_ubs = categorias["cras"] + categorias["ubs"]
    documentados = [e for e in cras_ubs if e.get("confianca_localizacao") in {"alta", "media"}
                    and e.get("metodo_localizacao") and e.get("data_aplicacao_localizacao")]
    sem_proveniencia = [e for e in cras_ubs if e not in documentados]
    catalogo_por_id = catalogo_registros or {}
    endereco_fonte_documentada = []
    endereco_fonte_ausente = []
    for equipamento in cras_ubs:
        registro = catalogo_por_id.get(equipamento.get("id"), {})
        item = {
            "id": equipamento.get("id"),
            "nome": equipamento.get("nome"),
            "endereco": registro.get("endereco"),
            "fonte_url": registro.get("fonte_url"),
            "fonte": registro.get("fonte"),
            "verificado_em": registro.get("verificado_em"),
        }
        if registro.get("endereco") and registro.get("fonte_url") and registro.get("verificado_em"):
            endereco_fonte_documentada.append(item)
        else:
            endereco_fonte_ausente.append(item)
    escolas = categorias["escola"]
    escolas_individuais = [e for e in escolas if e.get("metodo_localizacao") == "coordenada_individual"]
    escolas_cep = [e for e in escolas if e.get("metodo_localizacao") == "centroide_cep"]
    sem_coordenada = [e for e in equipamentos if e.get("lat") is None or e.get("lon") is None]
    fora = [e for e in equipamentos if e.get("lat") is not None and e.get("lon") is not None
            and not ponto_na_malha(geojson, float(e["lon"]), float(e["lat"]))]
    pequenos = [f for f in setores if int((f.get("properties") or {}).get("pessoas") or 0) < 5
                or int((f.get("properties") or {}).get("domicilios") or 0) < 3]
    area = float((territorio.get("totais") or {}).get("area_km2") or 0)
    area_local, area_geodesica = areas_geojson_km2(geojson)
    diferenca = area - REFERENCIA_AREA_KM2
    geometria = validar_geometrias(geojson)
    return {
        "geometrias": geometria,
        "areas": {"soma_setorial_km2": area, "referencia_municipal_km2": REFERENCIA_AREA_KM2,
                  "diferenca_km2": round(diferenca, 3),
                  "diferenca_percentual": round(100 * diferenca / REFERENCIA_AREA_KM2, 3) if REFERENCIA_AREA_KM2 else None,
                  "recalculo_local_km2": round(area_local, 3),
                  "recalculo_geodesico_km2": round(area_geodesica, 3),
                  "diferenca_recalculo_local_vs_referencia_km2": round(area_local - REFERENCIA_AREA_KM2, 3),
                  "diferenca_recalculo_geodesico_vs_referencia_km2": round(area_geodesica - REFERENCIA_AREA_KM2, 3)},
        "equipamentos": {
            "total": len(equipamentos),
            "por_categoria": {c: len(v) for c, v in categorias.items()},
            "sem_coordenada": len(sem_coordenada),
            "coordenadas_fora_da_malha": [{"id": e.get("id"), "categoria": e.get("categoria")} for e in fora],
            "cras_ubs": {"total": len(cras_ubs), "proveniencia_documentada": len(documentados),
                         "proveniencia_ausente": [{"id": e.get("id"), "categoria": e.get("categoria")} for e in sem_proveniencia],
                         "endereco_fonte_documentada": endereco_fonte_documentada,
                         "endereco_fonte_ausente": endereco_fonte_ausente},
            "escolas": {"total": len(escolas), "coordenada_individual": len(escolas_individuais),
                        "referencia_cep": len(escolas_cep),
                        "sem_metodo_reconhecido": len(escolas) - len(escolas_individuais) - len(escolas_cep)},
        },
        "privacidade": {"setores_abaixo_da_faixa_de_cautela_D4": len(pequenos),
                        "criterio_registrado": "menos de 5 pessoas ou menos de 3 domicílios; sinalização, sem supressão automática"},
        "localizacao_registro": {"ids_com_registro": len(localizacao)},
    }


def carregar(dados=DADOS, catalogo=CATALOGO, localizacao=LOCALIZACAO):
    geo = json.loads((dados / "setores.geojson").read_text(encoding="utf-8"))
    territorio = json.loads((dados / "territorio.json").read_text(encoding="utf-8"))
    indicadores = json.loads((dados / "indicadores_territoriais.json").read_text(encoding="utf-8"))
    with localizacao.open(encoding="utf-8-sig", newline="") as f:
        registros = {r["id"] for r in csv.DictReader(f) if r.get("id")}
    with catalogo.open(encoding="utf-8-sig", newline="") as f:
        catalogo_registros = {r["id"]: r for r in csv.DictReader(f) if r.get("id")}
    return resumir(geo, territorio, indicadores, registros, catalogo_registros)


def relatorio_markdown(resultado):
    e, g, a = resultado["equipamentos"], resultado["geometrias"], resultado["areas"]
    linhas = ["# Relatório de qualidade geográfica", "",
              "## Geometrias", "",
              f"- Setores: {g['total']}; códigos únicos: {g['codigos_unicos']}",
              f"- Geometrias com erro estrutural: {len(g['geometrias_com_erro_estrutural'])}",
              f"- Códigos duplicados: {len(g['duplicados'])}", "",
              "## Área territorial", "",
              f"- Soma das áreas setoriais: {a['soma_setorial_km2']} km²",
              f"- Referência municipal: {a['referencia_municipal_km2']} km²",
              f"- Diferença do total publicado: {a['diferenca_km2']} km² ({a['diferenca_percentual']}%)",
              f"- Recalculo local (método atual): {a['recalculo_local_km2']} km²",
              f"- Recalculo geodésico esférico: {a['recalculo_geodesico_km2']} km²",
              f"- Diferença geodésica para a referência: {a['diferenca_recalculo_geodesico_vs_referencia_km2']} km²", "",
              "## Equipamentos e proveniência", "",
              f"- Equipamentos: {e['total']} (CRAS {e['por_categoria']['cras']}, UBS {e['por_categoria']['ubs']}, escolas {e['por_categoria']['escola']})",
              f"- Sem coordenada: {e['sem_coordenada']}",
              f"- Coordenadas fora da malha: {len(e['coordenadas_fora_da_malha'])}",
              f"- CRAS/UBS com método de coordenada documentado: {e['cras_ubs']['proveniencia_documentada']}/{e['cras_ubs']['total']}",
              f"- CRAS/UBS sem método de coordenada documentado: {len(e['cras_ubs']['proveniencia_ausente'])}",
              f"- CRAS/UBS com endereço, fonte e data no catálogo: {len(e['cras_ubs']['endereco_fonte_documentada'])}/{e['cras_ubs']['total']}",
              "",
              "### Registros sem método de coordenada",
              "",
              "| Equipamento | Endereço cadastrado | Fonte do cadastro | Verificado em |",
              "|---|---|---|---|",
              *[f"| {item['nome'] or item['id']} | {item['endereco'] or 'não informado'} | {item['fonte'] or item['fonte_url'] or 'não informada'} | {item['verificado_em'] or 'não informada'} |"
                for item in e['cras_ubs']['endereco_fonte_documentada']
                if item['id'] in {p['id'] for p in e['cras_ubs']['proveniencia_ausente']}],
              "",
              "A presença de endereço e fonte no catálogo não documenta como a coordenada foi obtida ou validada, nem justifica um raio de incerteza.",
              f"- Escolas: {e['escolas']['coordenada_individual']} individuais, {e['escolas']['referencia_cep']} por CEP", "",
              "## Privacidade", "",
              f"- Setores sinalizados pela cautela D4: {resultado['privacidade']['setores_abaixo_da_faixa_de_cautela_D4']}",
              "- Nenhuma supressão ou agregação é aplicada por esta auditoria.", "",
              "Este relatório verifica estrutura, proveniência e consistência declarada. Não comprova, por si só, a exatidão física de cada coordenada nem a acessibilidade efetiva aos serviços.", ""]
    return "\n".join(linhas)


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--saida-json", type=Path, default=RAIZ / "docs/territorial/RELATORIO_QUALIDADE_GEOGRAFICA.json")
    parser.add_argument("--saida-md", type=Path, default=RAIZ / "docs/territorial/RELATORIO_QUALIDADE_GEOGRAFICA.md")
    args = parser.parse_args(argv)
    resultado = carregar()
    args.saida_json.parent.mkdir(parents=True, exist_ok=True)
    args.saida_json.write_text(json.dumps(resultado, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    args.saida_md.write_text(relatorio_markdown(resultado), encoding="utf-8")
    print("Auditoria geográfica concluída: %d setores; %d CRAS/UBS sem método de coordenada." % (
        resultado["geometrias"]["total"], len(resultado["equipamentos"]["cras_ubs"]["proveniencia_ausente"])))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
