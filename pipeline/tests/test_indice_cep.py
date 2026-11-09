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
    assert removidos == 2
    assert "11111111" not in resultado
    assert "22222222" in resultado and "33333333" not in resultado


def test_ausencia_de_setor_na_malha_omite_cep_mesmo_com_muitos_enderecos():
    indice = {"33333333": [-22.4, -47.5, 500, "", 120]}
    resultado, removidos = ic.filtrar_ceps_de_setores_suprimidos(indice, {"features": []})
    assert removidos == 1
    assert resultado == {}


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
    filtrado, removiveis = ic.filtrar_ceps_de_setores_suprimidos(ceps, geo)
    assert removiveis == 0, "o índice publicado ainda tem %d CEP(s) sem vínculo verificável ou de setor protegido" % removiveis
    assert filtrado == ceps
    protegidos = sum(1 for f in geo["features"] if ic.setor_suprimido(f["properties"]))
    assert protegidos > 0, "o teste precisa de setores protegidos para valer"


QUADRADO = {"type": "Polygon", "coordinates": [[[-47.50, -22.40], [-47.49, -22.40], [-47.49, -22.39], [-47.50, -22.39], [-47.50, -22.40]]]}


def test_centroide_e_raio_do_setor():
    lat, lon, raio = ic.centroide_e_raio_do_setor(QUADRADO)
    assert (lat, lon) == (-22.395, -47.495)
    assert ic.RAIO_MINIMO_GENERALIZADO_M <= raio <= ic.RAIO_MAXIMO_GENERALIZADO_M
    furo = {"type": "Polygon", "coordinates": QUADRADO["coordinates"] + [[[-47.498, -22.398], [-47.496, -22.398], [-47.496, -22.396], [-47.498, -22.396], [-47.498, -22.398]]]}
    assert ic.centroide_e_raio_do_setor(furo)[:2] != (lat, lon), "o furo desloca o centro"
    assert ic.centroide_e_raio_do_setor({"type": "Point", "coordinates": [0, 0]}) is None


def test_cep_com_poucos_enderecos_perde_o_ponto_proprio_e_aponta_para_o_setor():
    geo = {"features": [{"properties": {"setor": "111111111111111", "pessoas": 300, "domicilios": 100}, "geometry": QUADRADO}]}
    indice = {
        "11111111": [-22.3912, -47.4961, 150, "111111111111111P", 1],     # 1 endereço: ponto próprio não pode ser publicado
        "22222222": [-22.3950, -47.4950, 150, "111111111111111P", 2],     # 2 endereços: idem
        "33333333": [-22.3931, -47.4932, 150, "111111111111111P", 3],     # 3 endereços: mantém
        "44444444": [-22.3000, -47.4000, 300, "999999999999999P", 1],     # setor fora do GeoJSON: omite (fail-closed)
    }
    novo, generalizados, omitidos = ic.generalizar_ceps_com_poucos_enderecos(indice, geo)
    assert (generalizados, omitidos) == (2, 1)
    assert novo["11111111"][:2] == novo["22222222"][:2] == [-22.395, -47.495]
    assert novo["11111111"][3] == "111111111111111P" and novo["11111111"][4] == 1 and novo["11111111"][2] >= 300
    assert novo["33333333"] == indice["33333333"] and "44444444" not in novo
    again, g2, o2 = ic.generalizar_ceps_com_poucos_enderecos(novo, geo)
    assert again == novo and (g2, o2) == (0, 0), "idempotente: reaplicar a regra não muda nada nem conta de novo"


def test_indice_publicado_nao_tem_ponto_proprio_de_cep_com_poucos_enderecos_nos_dados_reais():
    import json
    from pathlib import Path
    dados = Path(__file__).resolve().parents[2] / "web" / "dados"
    geo = json.loads((dados / "setores.geojson").read_text(encoding="utf-8"))
    ceps = json.loads((dados / "cep_indice.json").read_text(encoding="utf-8"))["ceps"]
    novo, estatisticas = ic.sanear_indice_para_publicacao(ceps, geo)
    assert novo == ceps and estatisticas == {
        "omitidos_validacao_setorial": 0,
        "generalizados_poucos_enderecos": 0,
        "omitidos_generalizacao": 0,
    }, "o índice publicado deve ser idempotente após todas as regras de privacidade"
    pequenos = [c for c, v in ceps.items() if v[4] < ic.MINIMO_ENDERECOS_POR_CEP]
    assert pequenos, "o teste precisa de CEPs com poucos endereços para valer"



def test_saneamento_integral_aplica_d4_setor_verificavel_e_generalizacao():
    geo = {"features": [
        {"properties": {"setor": "111111111111111", "pessoas": 300, "domicilios": 100}, "geometry": QUADRADO},
        {"properties": {"setor": "222222222222222", "pessoas": 4, "domicilios": 20}, "geometry": QUADRADO},
    ]}
    indice = {
        "11111111": [-22.3912, -47.4961, 150, "111111111111111P", 2],
        "22222222": [-22.4, -47.5, 150, "999999999999999P", 80],
        "33333333": [-22.4, -47.5, 150, "222222222222222P", 20],
        "44444444": [-22.4, -47.5, 150, "111111111111111P", 10],
    }
    resultado, stats = ic.sanear_indice_para_publicacao(indice, geo)
    assert set(resultado) == {"11111111", "44444444"}
    assert resultado["11111111"][:2] == [-22.395, -47.495]
    assert stats["omitidos_validacao_setorial"] == 2
    assert stats["generalizados_poucos_enderecos"] == 1
    assert stats["omitidos_generalizacao"] == 0


def test_registro_com_contagem_fracionaria_ou_invalida_e_omitido():
    geo = {"features": [{"properties": {"setor": "111111111111111", "pessoas": 300, "domicilios": 100}, "geometry": QUADRADO}]}
    indice = {
        "11111111": [-22.4, -47.5, 150, "111111111111111P", 3.5],
        "22222222": [-22.4, -47.5, 150, "111111111111111P", float("nan")],
        "33333333": [-22.4, -47.5, 150, "111111111111111P", True],
    }
    resultado, removidos = ic.filtrar_ceps_de_setores_suprimidos(indice, geo)
    assert resultado == {}
    assert removidos == 3
