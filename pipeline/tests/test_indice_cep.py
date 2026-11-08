import indice_cep as ic


def test_ceps_associados_a_setores_protegidos_nao_sao_publicados():
    geo = {
        "features": [
            {"properties": {"setor": "pequeno", "pessoas": 4, "domicilios": 20}, "geometry": {}},
            {"properties": {"setor": "normal", "pessoas": 100, "domicilios": 40}, "geometry": {}},
        ]
    }
    indice = {
        "11111111": [-22.4, -47.5, 300, "pequeno", 2],
        "22222222": [-22.4, -47.5, 300, "normal", 10],
        "33333333": [-22.4, -47.5, 500, "", 0],
    }
    resultado, removidos = ic.filtrar_ceps_de_setores_suprimidos(indice, geo)
    assert removidos == 1
    assert "11111111" not in resultado
    assert "22222222" in resultado and "33333333" in resultado


def test_ausencia_de_geometria_nao_apaga_ceps_sem_vinculo_setorial():
    indice = {"33333333": [-22.4, -47.5, 500, "", 0]}
    resultado, removidos = ic.filtrar_ceps_de_setores_suprimidos(indice, {"features": []})
    assert removidos == 0
    assert resultado == indice
