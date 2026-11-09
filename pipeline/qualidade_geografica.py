"""Auditoria reproduzível da qualidade geográfica e da proveniência dos dados territoriais."""
from __future__ import annotations

import argparse
import csv
import json
import math
import re
from pathlib import Path

from pyproj import Geod, Transformer
from shapely.geometry import shape
from shapely.ops import transform, unary_union
from shapely.strtree import STRtree
from shapely.validation import explain_validity

RAIZ = Path(__file__).resolve().parents[1]
DADOS = RAIZ / "web" / "dados"
CATALOGO = RAIZ / "catalogo" / "servicos_manuais.csv"
LOCALIZACAO = RAIZ / "catalogo" / "localizacao_registro.csv"
REFERENCIA_AREA_KM2 = 498.403
LATITUDE_REFERENCIA = -22.40
KM_POR_GRAU_LAT = 110.574
KM_POR_GRAU_LON = 111.320 * math.cos(math.radians(LATITUDE_REFERENCIA))
GEOD = Geod(ellps="GRS80")
TRANSFORMAR_UTM = Transformer.from_crs("EPSG:4326", "EPSG:31983", always_xy=True).transform
LIMITE_MUNICIPAL = RAIZ / "dados" / "geografia" / "limite_municipal_2022.geojson"
TOLERANCIA_TOPOLOGICA_M2 = 1.0
# 1 m² registra todo resíduo; 1.000 m² (0,001 km²) separa sobreposição/lacuna material.
LIMIAR_TOPOLOGICO_RELEVANTE_M2 = 1000.0


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
    """Área geodésica no elipsoide GRS80, em km²."""
    area, _ = GEOD.polygon_area_perimeter(
        [float(p[0]) for p in anel],
        [float(p[1]) for p in anel],
    )
    return abs(area) / 1_000_000


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
    ids, duplicados, invalidas, codigos_invalidos = set(), [], [], []
    tipos = {"Polygon": 0, "MultiPolygon": 0, "outros": 0}
    geometrias_validas = []
    auto_intersecoes = []
    for f in geojson.get("features", []):
        props = f.get("properties") or {}
        codigo = str(props.get("setor") or "sem_codigo")
        if codigo in ids:
            duplicados.append(codigo)
        ids.add(codigo)
        if not re.fullmatch(r"[0-9]{15}", codigo):
            codigos_invalidos.append(codigo)
        geom = f.get("geometry") or {}
        tipo = geom.get("type")
        tipos[tipo if tipo in {"Polygon", "MultiPolygon"} else "outros"] += 1
        erros = []
        if tipo not in {"Polygon", "MultiPolygon"}:
            erros.append("tipo_geometrico_nao_suportado")
        try:
            geometria = shape(geom)
            if geometria.is_empty:
                erros.append("geometria_vazia")
            if not geometria.is_valid:
                motivo = explain_validity(geometria)
                erros.append("geometria_invalida:" + motivo)
                if "Self-intersection" in motivo or "Ring Self-intersection" in motivo:
                    auto_intersecoes.append({"setor": codigo, "motivo": motivo})
            if geometria.is_valid and not geometria.is_empty:
                geometrias_validas.append((codigo, geometria))
        except Exception as exc:
            erros.append("geometria_nao_interpretavel:" + type(exc).__name__)
        for pol in _poligonos(geom):
            if not pol:
                erros.append("poligono_sem_anel")
                continue
            for anel in pol:
                if len(anel) < 4:
                    erros.append("anel_com_menos_de_quatro_pontos")
                    continue
                if anel[0] != anel[-1]:
                    erros.append("anel_nao_fechado")
                for ponto in anel:
                    if (not isinstance(ponto, (list, tuple)) or len(ponto) < 2
                            or not all(isinstance(v, (int, float)) and math.isfinite(v) for v in ponto[:2])
                            or not (-180 <= ponto[0] <= 180 and -90 <= ponto[1] <= 90)):
                        erros.append("coordenada_invalida_ou_fora_dos_limites")
                        break
        if erros:
            invalidas.append({"setor": codigo, "problemas": sorted(set(erros))})
    return {
        "total": len(geojson.get("features", [])),
        "codigos_unicos": len(ids),
        "codigos_fora_do_padrao_ibge": sorted(set(codigos_invalidos)),
        "duplicados": sorted(set(duplicados)),
        "tipos": tipos,
        "geometrias_com_erro_estrutural": invalidas,
        "auto_intersecoes": auto_intersecoes,
        "geometrias_validas_para_topologia": len(geometrias_validas),
    }


def validar_topologia(geojson, limite_municipal=None):
    """Mede sobreposições, lacunas e área externa em projeção UTM 23S."""
    projetadas, codigos = [], []
    for feature in geojson.get("features", []):
        codigo = str((feature.get("properties") or {}).get("setor") or "sem_codigo")
        try:
            geom = shape(feature.get("geometry") or {})
            if not geom.is_valid or geom.is_empty:
                continue
            projetadas.append(transform(TRANSFORMAR_UTM, geom))
            codigos.append(codigo)
        except Exception:
            continue
    sobreposicoes = []
    if projetadas:
        arvore = STRtree(projetadas)
        for i, geometria in enumerate(projetadas):
            for j in arvore.query(geometria):
                j = int(j)
                if j <= i:
                    continue
                area_m2 = geometria.intersection(projetadas[j]).area
                if area_m2 > TOLERANCIA_TOPOLOGICA_M2:
                    sobreposicoes.append({"setores": [codigos[i], codigos[j]], "area_m2": round(area_m2, 3)})
        uniao = unary_union(projetadas)
        soma_areas = sum(g.area for g in projetadas)
    else:
        uniao, soma_areas = None, 0.0
    area_sobreposicoes_total = sum(item["area_m2"] for item in sobreposicoes)
    area_sobreposicao_maxima = max((item["area_m2"] for item in sobreposicoes), default=0.0)
    sobreposicoes_relevantes = [item for item in sobreposicoes if item["area_m2"] > LIMIAR_TOPOLOGICO_RELEVANTE_M2]
    if limite_municipal is None or uniao is None:
        return {
            "avaliacao_lacunas": "nao_avaliada",
            "motivo_lacunas": "Limite municipal oficial de referência não foi fornecido.",
            "sobreposicoes": sobreposicoes,
            "sobreposicoes_relevantes": sobreposicoes_relevantes,
            "area_sobreposicoes_total_m2": round(area_sobreposicoes_total, 3),
            "area_sobreposicao_maxima_m2": round(area_sobreposicao_maxima, 3),
            "area_somada_setores_km2_utm": round(soma_areas / 1_000_000, 6),
            "area_uniao_setores_km2_utm": round(uniao.area / 1_000_000, 6) if uniao is not None else None,
        }
    features_limite = limite_municipal.get("features", [])
    if len(features_limite) != 1:
        raise ValueError("O limite municipal de referência deve conter exatamente uma feição.")
    limite = transform(TRANSFORMAR_UTM, shape(features_limite[0]["geometry"]))
    if not limite.is_valid or limite.is_empty:
        raise ValueError("O limite municipal de referência é inválido ou vazio.")
    lacunas = limite.difference(uniao)
    fora = uniao.difference(limite)
    return {
        "avaliacao_lacunas": "avaliada",
        "sobreposicoes": sobreposicoes,
        "sobreposicoes_relevantes": sobreposicoes_relevantes,
        "area_sobreposicoes_total_m2": round(area_sobreposicoes_total, 3),
        "area_sobreposicao_maxima_m2": round(area_sobreposicao_maxima, 3),
        "area_limite_municipal_km2_utm": round(limite.area / 1_000_000, 6),
        "area_somada_setores_km2_utm": round(soma_areas / 1_000_000, 6),
        "area_uniao_setores_km2_utm": round(uniao.area / 1_000_000, 6),
        "area_lacunas_km2": round(lacunas.area / 1_000_000, 9),
        "area_setores_fora_municipio_km2": round(fora.area / 1_000_000, 9),
        "lacunas_detectadas": lacunas.area > TOLERANCIA_TOPOLOGICA_M2,
        "lacunas_relevantes": lacunas.area > LIMIAR_TOPOLOGICO_RELEVANTE_M2,
        "setores_fora_detectados": fora.area > TOLERANCIA_TOPOLOGICA_M2,
        "setores_fora_relevantes": fora.area > LIMIAR_TOPOLOGICO_RELEVANTE_M2,
        "limite_area_atributo_ibge_km2": features_limite[0].get("properties", {}).get("area_atributo_ibge_km2"),
    }


def validar_correspondencia_setores(geojson, territorio, indicadores):
    ids_malha = [str((f.get("properties") or {}).get("setor") or "") for f in geojson.get("features", [])]
    ids_territorio = set((territorio.get("setores") or {}).keys())
    ids_indicadores = [str(s.get("id") or "") for s in indicadores.get("setores", [])]
    malha, indicadores_set = set(ids_malha), set(ids_indicadores)
    return {
        "malha": len(ids_malha),
        "territorio": len(ids_territorio),
        "indicadores": len(ids_indicadores),
        "ausentes_no_territorio": sorted(malha - ids_territorio),
        "extras_no_territorio": sorted(ids_territorio - malha),
        "ausentes_nos_indicadores": sorted(malha - indicadores_set),
        "extras_nos_indicadores": sorted(indicadores_set - malha),
        "duplicados_na_malha": sorted({x for x in ids_malha if ids_malha.count(x) > 1}),
        "duplicados_nos_indicadores": sorted({x for x in ids_indicadores if ids_indicadores.count(x) > 1}),
        "correspondencia_completa": (
            len(ids_malha) == len(malha) == len(ids_indicadores) == len(indicadores_set)
            and malha == ids_territorio == indicadores_set
        ),
    }


def resumir(geojson, territorio, indicadores, localizacao, catalogo_registros=None, limite_municipal=None):
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
    topologia = validar_topologia(geojson, limite_municipal)
    correspondencia = validar_correspondencia_setores(geojson, territorio, indicadores)
    return {
        "geometrias": geometria,
        "topologia": topologia,
        "correspondencia_setores": correspondencia,
        "areas": {"soma_setorial_km2": area, "referencia_municipal_km2": REFERENCIA_AREA_KM2,
                  "diferenca_km2": round(diferenca, 3),
                  "diferenca_percentual": round(100 * diferenca / REFERENCIA_AREA_KM2, 3) if REFERENCIA_AREA_KM2 else None,
                  "recalculo_local_km2": round(area_local, 3),
                  "recalculo_geodesico_km2": round(area_geodesica, 3),
                  "metodo_recalculo_geodesico": "pyproj.Geod no elipsoide GRS80; anéis externos menos furos",
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
    limite = json.loads(LIMITE_MUNICIPAL.read_text(encoding="utf-8")) if LIMITE_MUNICIPAL.exists() else None
    return resumir(geo, territorio, indicadores, registros, catalogo_registros, limite)


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
              f"- Recalculo geodésico elipsoidal GRS80: {a['recalculo_geodesico_km2']} km²",
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
    parser.add_argument("--saida-json", type=Path, default=None)
    parser.add_argument("--saida-md", type=Path, default=None)
    args = parser.parse_args(argv)
    resultado = carregar()
    if args.saida_json:
        args.saida_json.parent.mkdir(parents=True, exist_ok=True)
        args.saida_json.write_text(json.dumps(resultado, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    if args.saida_md:
        args.saida_md.parent.mkdir(parents=True, exist_ok=True)
        args.saida_md.write_text(relatorio_markdown(resultado), encoding="utf-8")
    print("Validação geográfica: %d setores; %d CRAS/UBS sem método de coordenada; lacunas: %s." % (
        resultado["geometrias"]["total"], len(resultado["equipamentos"]["cras_ubs"]["proveniencia_ausente"]), resultado["topologia"]["avaliacao_lacunas"]))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
