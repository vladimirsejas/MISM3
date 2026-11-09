import sys
import pytest
from pathlib import Path

PIPELINE = Path(__file__).resolve().parents[1]
if str(PIPELINE) not in sys.path:
    sys.path.insert(0, str(PIPELINE))

import qualidade_geografica as qg


def test_validar_geometrias_detecta_anel_aberto_e_codigo_duplicado():
    geo = {"features": [
        {"properties": {"setor": "1"}, "geometry": {"type": "Polygon", "coordinates": [[[0, 0], [1, 0], [1, 1], [0, 1]]] }},
        {"properties": {"setor": "1"}, "geometry": {"type": "GeometryCollection", "geometries": []}},
    ]}
    r = qg.validar_geometrias(geo)
    assert r["total"] == 2
    assert r["codigos_unicos"] == 1
    assert r["duplicados"] == ["1"]
    assert len(r["geometrias_com_erro_estrutural"]) == 2


def test_ponto_na_malha_respeita_buracos():
    geo = {"features": [{"geometry": {"type": "Polygon", "coordinates": [
        [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]],
        [[4, 4], [6, 4], [6, 6], [4, 6], [4, 4]],
    ]}}]}
    assert qg.ponto_na_malha(geo, 2, 2)
    assert not qg.ponto_na_malha(geo, 5, 5)


def test_resumo_contabiliza_proveniencia_e_area():
    geo = {"features": [{"properties": {"setor": "1", "pessoas": 4, "domicilios": 2},
                        "geometry": {"type": "Polygon", "coordinates": [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]}}]}
    territorio = {"totais": {"area_km2": 497.3}}
    indicadores = {"equipamentos": [
        {"id": "cras1", "categoria": "cras", "confianca_localizacao": "alta", "metodo_localizacao": "rua", "data_aplicacao_localizacao": "2026-01-01", "lat": 0.5, "lon": 0.5},
        {"id": "cras2", "categoria": "cras", "confianca_localizacao": "nao_registrada", "metodo_localizacao": "catalogo_sem_registro_de_proveniencia", "lat": 0.5, "lon": 0.5},
        {"id": "escola1", "categoria": "escola", "metodo_localizacao": "coordenada_individual", "lat": 0.5, "lon": 0.5},
    ]}
    r = qg.resumir(geo, territorio, indicadores, {"cras1", "cras2"}, {"cras2": {"endereco": "Rua 2, 100", "fonte_url": "https://exemplo.gov.br", "fonte": "Secretaria Municipal", "verificado_em": "2026-10-10"}})
    assert r["areas"]["diferenca_km2"] == round(qg.areas_geojson_km2(geo) - 497.3, 3)
    assert r["equipamentos"]["cras_ubs"]["proveniencia_documentada"] == 1
    assert len(r["equipamentos"]["cras_ubs"]["proveniencia_ausente"]) == 1
    assert r["equipamentos"]["cras_ubs"]["endereco_fonte_documentada"][0]["verificado_em"] == "2026-10-10"
    assert r["privacidade"]["setores_abaixo_da_faixa_de_cautela_D4"] == 1


def test_base_real_confere_contagens_de_proveniencia_e_privacidade():
    r = qg.carregar()
    assert r["geometrias"]["total"] == 408
    assert r["geometrias"]["codigos_unicos"] == 408
    assert not r["geometrias"]["duplicados"]
    assert not r["geometrias"]["geometrias_com_erro_estrutural"]
    assert r["areas"]["soma_setorial_km2"] == 498.422
    assert r["areas"]["referencia_municipal_km2"] == 498.402
    
    assert r["areas"]["recalculo_geodesico_km2"] == 498.422
    assert r["areas"]["diferenca_recalculo_geodesico_vs_referencia_km2"] == 0.020
    assert r["equipamentos"]["cras_ubs"]["total"] == 28
    assert r["equipamentos"]["cras_ubs"]["proveniencia_documentada"] == 22
    assert len(r["equipamentos"]["cras_ubs"]["proveniencia_ausente"]) == 6
    pendentes = {item["id"] for item in r["equipamentos"]["cras_ubs"]["proveniencia_ausente"]}
    registros_com_fonte = {item["id"]: item for item in r["equipamentos"]["cras_ubs"]["endereco_fonte_documentada"]}
    assert pendentes == {
        "man-cras-jardim-independencia", "man-cras-panorama", "man-saude-ubs-29",
        "man-saude-ubs-wenzel", "man-saude-usf-ferraz", "man-saude-usf-sao-miguel"
    }
    assert pendentes.issubset(registros_com_fonte)
    assert all(registros_com_fonte[i]["verificado_em"] == "2026-10-10" for i in pendentes)
    assert r["equipamentos"]["escolas"] == {
        "total": 68, "coordenada_individual": 33, "referencia_cep": 35, "sem_metodo_reconhecido": 0
    }
    assert r["privacidade"]["setores_abaixo_da_faixa_de_cautela_D4"] == 17


def test_comando_gera_relatorios_json_e_markdown(tmp_path):
    import json

    saida_json = tmp_path / "qualidade.json"
    saida_md = tmp_path / "qualidade.md"
    assert qg.main(["--saida-json", str(saida_json), "--saida-md", str(saida_md)]) == 0
    dados = json.loads(saida_json.read_text(encoding="utf-8"))
    texto = saida_md.read_text(encoding="utf-8")
    assert dados["geometrias"]["total"] == 408
    assert "498.422 km²" in texto
    assert "proveniência" in texto
    assert "## Topologia da malha" in texto
    assert "Interseções entre setores acima de 0.0121 m²: 0" in texto



def test_limite_municipal_e_topologia_da_malha_real():
    resultado = qg.carregar()
    topologia = resultado["topologia"]
    assert resultado["geometrias"]["total"] == 408
    assert resultado["geometrias"]["codigos_unicos"] == 408
    assert resultado["geometrias"]["codigos_fora_do_padrao_ibge"] == []
    assert resultado["geometrias"]["duplicados"] == []
    assert resultado["geometrias"]["tipos"]["outros"] == 0
    assert resultado["geometrias"]["geometrias_com_erro_estrutural"] == []
    assert resultado["geometrias"]["auto_intersecoes"] == []
    assert topologia["avaliacao_lacunas"] == "avaliada"
    # Malha de setores 2022 e limite municipal 2025 são edições diferentes.
    # A divergência entre os contornos é registrada, não tratada como falha interna da cobertura.
    assert topologia["sobreposicoes"] == []
    assert topologia["buracos_internos_m2"] == []
    assert topologia["area_buracos_internos_total_m2"] == 0
    assert topologia["limiar_deteccao_sobreposicao_m2"] == 0.0121
    assert topologia["limiar_deteccao_buraco_m2"] == 0.0121
    assert topologia["area_sobreposicoes_total_m2"] == 0
    assert topologia["area_lacunas_km2"] == pytest.approx(0.707921241, abs=1e-6)
    assert topologia["area_setores_fora_municipio_km2"] == pytest.approx(0.727497653, abs=1e-6)
    assert topologia["quantidade_setores_com_area_fora_municipio"] == 16
    assert topologia["lacunas_relevantes"] is True
    assert topologia["setores_fora_relevantes"] is True
    assert resultado["correspondencia_setores"]["correspondencia_completa"] is True


def test_seis_equipamentos_sem_coordenada_catalogo_usam_cep_com_raio_operacional():
    import json

    raiz = Path(__file__).resolve().parents[2]
    dados = json.loads((raiz / "web/dados/indicadores_territoriais.json").read_text(encoding="utf-8"))
    ids = {
        "man-cras-jardim-independencia", "man-cras-panorama", "man-saude-ubs-29",
        "man-saude-ubs-wenzel", "man-saude-usf-ferraz", "man-saude-usf-sao-miguel",
    }
    itens = [e for e in dados["equipamentos"] if e["id"] in ids]
    assert len(itens) == 6
    assert all(e["metodo_localizacao"] == "centroide_cep" for e in itens)
    assert all(e["confianca_localizacao"] == "aproximada_operacional" for e in itens)
    assert all(e["precisao"] == "centro_do_cep" for e in itens)
    assert all(e["raio_incerteza_m"] > 0 for e in itens)
    assert all(e["fonte_localizacao"] == "CNEFE/índice CEP" for e in itens)


def test_validador_identifica_auto_intersecao_em_poligono():
    geo = {"features": [{
        "properties": {"setor": "354390705000001"},
        "geometry": {"type": "Polygon", "coordinates": [[
            [-47.5, -22.4], [-47.4, -22.3], [-47.5, -22.3],
            [-47.4, -22.4], [-47.5, -22.4],
        ]]},
    }]}
    resultado = qg.validar_geometrias(geo)
    assert resultado["geometrias_com_erro_estrutural"]
    assert resultado["auto_intersecoes"]
    assert any("geometria_invalida" in p for p in resultado["geometrias_com_erro_estrutural"][0]["problemas"])


def test_validador_identifica_sobreposicao_e_lacuna_com_limite_referencia():
    def poligono(x0, x1, y0=-22.4, y1=-22.39):
        return {"type": "Polygon", "coordinates": [[
            [x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0],
        ]]}

    geo_overlap = {"features": [
        {"properties": {"setor": "354390705000001"}, "geometry": poligono(-47.51, -47.49)},
        {"properties": {"setor": "354390705000002"}, "geometry": poligono(-47.50, -47.48)},
    ]}
    limite = {"features": [{"geometry": poligono(-47.60, -47.40, -22.5, -22.3)}]}
    overlap = qg.validar_topologia(geo_overlap, limite)
    assert qg.LIMIAR_DETECCAO_SOBREPOSICAO_M2 == 0.0121
    assert len(overlap["sobreposicoes"]) == 1
    assert overlap["sobreposicoes"][0]["area_m2"] > qg.LIMIAR_DETECCAO_SOBREPOSICAO_M2
    assert overlap["lacunas_detectadas"] is True
    assert overlap["setores_fora_detectados"] is False, overlap


def test_correspondencia_setorial_detecta_ids_ausentes_e_extras():
    geo = {"features": [
        {"properties": {"setor": "354390705000001"}},
        {"properties": {"setor": "354390705000002"}},
    ]}
    territorio = {"setores": {"354390705000001": {}, "354390705000003": {}}}
    indicadores = {"setores": [{"id": "354390705000001"}, {"id": "354390705000002"}]}
    resultado = qg.validar_correspondencia_setores(geo, territorio, indicadores)
    assert resultado["correspondencia_completa"] is False
    assert resultado["ausentes_no_territorio"] == ["354390705000002"]
    assert resultado["extras_no_territorio"] == ["354390705000003"]


def test_limiar_de_buraco_interno_deriva_da_precisao_de_publicacao():
    from pyproj import Transformer
    from shapely.geometry import Polygon, mapping
    from shapely.ops import transform

    para_metros = Transformer.from_crs("EPSG:4326", "EPSG:31983", always_xy=True).transform
    para_geo = Transformer.from_crs("EPSG:31983", "EPSG:4326", always_xy=True).transform
    x, y = para_metros(-47.56, -22.40)
    limite_m = Polygon([
        (x - 20, y - 20), (x + 20, y - 20), (x + 20, y + 20),
        (x - 20, y + 20), (x - 20, y - 20),
    ])
    limite = {"features": [{"geometry": mapping(transform(para_geo, limite_m))}]}

    def geojson_com_buraco(lado):
        anel = [(x, y), (x + lado, y), (x + lado, y + lado), (x, y + lado), (x, y)]
        poligono = Polygon(
            [(x - 5, y - 5), (x + 5, y - 5), (x + 5, y + 5), (x - 5, y + 5), (x - 5, y - 5)],
            [anel],
        )
        return {"features": [{
            "properties": {"setor": "354390705000001"},
            "geometry": mapping(transform(para_geo, poligono)),
        }]}

    assert qg.LIMIAR_DETECCAO_BURACO_M2 == 0.0121
    abaixo = qg.validar_topologia(geojson_com_buraco(0.1), limite)
    acima = qg.validar_topologia(geojson_com_buraco(0.2), limite)
    assert abaixo["buracos_internos_m2"] == []
    assert acima["buracos_internos_m2"] == [pytest.approx(0.04, abs=0.002)]
