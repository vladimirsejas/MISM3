import sys
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
    r = qg.resumir(geo, territorio, indicadores, {"cras1", "cras2"})
    assert r["areas"]["diferenca_km2"] == -1.103
    assert r["equipamentos"]["cras_ubs"]["proveniencia_documentada"] == 1
    assert len(r["equipamentos"]["cras_ubs"]["proveniencia_ausente"]) == 1
    assert r["privacidade"]["setores_abaixo_da_faixa_de_cautela_D4"] == 1


def test_base_real_confere_contagens_de_proveniencia_e_privacidade():
    r = qg.carregar()
    assert r["geometrias"]["total"] == 408
    assert r["geometrias"]["codigos_unicos"] == 408
    assert not r["geometrias"]["duplicados"]
    assert not r["geometrias"]["geometrias_com_erro_estrutural"]
    assert r["areas"]["soma_setorial_km2"] == 497.3
    assert r["areas"]["referencia_municipal_km2"] == 498.403
    assert r["equipamentos"]["cras_ubs"]["total"] == 28
    assert r["equipamentos"]["cras_ubs"]["proveniencia_documentada"] == 22
    assert len(r["equipamentos"]["cras_ubs"]["proveniencia_ausente"]) == 6
    assert r["equipamentos"]["escolas"] == {
        "total": 68, "coordenada_individual": 33, "referencia_cep": 35, "sem_metodo_reconhecido": 0
    }
    assert r["privacidade"]["setores_abaixo_da_faixa_de_cautela_D4"] == 17
