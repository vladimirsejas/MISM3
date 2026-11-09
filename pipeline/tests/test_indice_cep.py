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


def test_setor_do_cnefe_com_sufixo_de_letra_casa_com_o_geojson_do_ibge():
    geo = {"features": [{"properties": {"setor": "354390705000201", "pessoas": 3, "domicilios": 2}, "geometry": {}},
                        {"properties": {"setor": "354390705000002", "pessoas": 400, "domicilios": 300}, "geometry": {}}]}
    indice = {"13501600": [-22.43, -47.57, 1500, "354390705000201P", 27], "13500000": [-22.4, -47.5, 150, "354390705000002P", 40]}
    resultado, removidos = ic.filtrar_ceps_de_setores_suprimidos(indice, geo)
    assert removidos == 1 and "13501600" not in resultado and "13500000" in resultado
    assert ic.id_do_setor("354390705000201P") == "354390705000201" and ic.id_do_setor(None) == "" and ic.id_do_setor("pequeno") == "pequeno"


def test_indice_publicado_nao_tem_cep_de_setor_protegido_nos_dados_reais():
    """Dados reais do repositório: nenhum CEP publicado pode apontar para setor suprimido pela D4."""
    import json
    from pathlib import Path
    dados = Path(__file__).resolve().parents[2] / "web" / "dados"
    geo = json.loads((dados / "setores.geojson").read_text(encoding="utf-8"))
    ceps = json.loads((dados / "cep_indice.json").read_text(encoding="utf-8"))["ceps"]
    _, removiveis = ic.filtrar_ceps_de_setores_suprimidos(ceps, geo)
    assert removiveis == 0, "o índice publicado ainda tem %d CEP(s) de setor protegido" % removiveis
    protegidos = sum(1 for f in geo["features"] if ic.setor_suprimido(f["properties"]))
    assert protegidos > 0, "o teste precisa de setores protegidos para valer"
