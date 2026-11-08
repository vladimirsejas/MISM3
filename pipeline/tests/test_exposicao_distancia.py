"""Testes da exposição à distância com dados sintéticos pequenos."""
import exposicao_distancia as ex


def quadrado(x0, y0, lado=0.01):
    return {"type": "Polygon", "coordinates": [[[x0, y0], [x0 + lado, y0], [x0 + lado, y0 + lado], [x0, y0 + lado], [x0, y0]]]}


def geo():
    # Alfa (1000 pessoas) e Beta (3000), lado a lado; Beta sem bairro
    return {"features": [
        {"properties": {"bairro": "Alfa", "pessoas": 1000, "domicilios": 400}, "geometry": quadrado(-47.60, -22.40)},
        {"properties": {"bairro": "", "pessoas": 3000, "domicilios": 1200}, "geometry": quadrado(-47.57, -22.40)},
    ]}


def ubs(id_, lat=None, lon=None, cep=None):
    s = {"id": id_, "tipo": "saude", "subtipo": "ubs", "nome": id_}
    if lat is not None:
        s.update(lat=lat, lon=lon)
    if cep:
        s["cep"] = cep
    return s


def test_quantil_ponderado():
    assert ex.quantil_ponderado([(1, 1), (2, 1), (3, 2)], 0.5) == 2
    assert ex.quantil_ponderado([], 0.5) is None


def test_percentual_acima_do_limiar_e_sem_bairro():
    # UBS no centro de Alfa: Alfa fica a ~0 km, Beta (a ~3 km a leste) fica a mais de 2 km
    r = ex.calcular(geo(), [ubs("man-ubs-a", -22.395, -47.595)], {}, usar_cep=False)["ubs"]
    ac = r["setores_validos"]["acima_de"]
    assert ac["2 km"]["setores"] == 1 and ac["2 km"]["percentual"] == 50.0
    assert r["setores_sem_bairro"]["acima_de"]["2 km"]["percentual"] == 100.0
    assert r["cobertura"]["completo"] is True


def test_cobertura_incompleta_sem_cep_e_completa_com_cep():
    servicos = [ubs("man-ubs-a", -22.395, -47.595), ubs("man-ubs-b", cep="13500000")]
    indice = {"13500000": [-22.395, -47.565]}
    sem = ex.calcular(geo(), servicos, indice, usar_cep=False)["ubs"]
    com = ex.calcular(geo(), servicos, indice, usar_cep=True)["ubs"]
    assert sem["cobertura"] == {"com_coordenada": 1, "cadastrados": 2, "completo": False}
    assert com["cobertura"]["completo"] is True
    assert com["setores_validos"]["acima_de"]["2 km"]["setores"] == 0     # a segunda UBS aproxima o setor Beta


def test_categoria_sem_nenhuma_coordenada():
    r = ex.calcular(geo(), [ubs("man-ubs-a")], {}, usar_cep=False)["ubs"]
    assert r["setores_validos"] is None


def test_gerar_traz_dois_cenarios():
    out = ex.gerar(geo(), [ubs("man-ubs-a", -22.395, -47.595)], {})
    assert set(out["cenarios"]) == {"coordenadas_do_catalogo", "com_centro_do_cep"}
    assert out["meta"]["pessoas_total"] is None and out["meta"]["setores_suprimidos"] == 0
