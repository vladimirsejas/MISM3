import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import ceps_lista as cl  # noqa: E402
import geocodificar_catalogo as g  # noqa: E402
import indice_cep as ic  # noqa: E402

CABECALHO = "CEP;Logradouro;Bairro;Municipio;UF;Endereco_Completo;Latitude;Longitude"
LINHAS = [
    "13500-100;Avenida 30;Jardim Brasília;Rio Claro;SP;x;-22,4000;-47,5600",
    "13500-200;Rua Marco Antonio Padula;Jardim Novo;Rio Claro;SP;x;-22,4100;-47,5500",
    "13500-300;Rua 5;Vila Alemã;Rio Claro;SP;x;-22,3900;-47,5400",
    "13500-400;Rua 5;Bom Retiro;Rio Claro;SP;x;-22,3950;-47,5450",
    "13500-500;Avenida 1-MP;Mãe Preta;Rio Claro;SP;x;-22,4200;-47,5300",
    "13400-000;Rua Qualquer;Centro;Piracicaba;SP;x;-22,7000;-47,6400",   # outra cidade
    "13500-600;Rua Fora;Centro;Rio Claro;SP;x;-10,0000;-47,5400",         # coordenada fora de Rio Claro
]


def escrever(tmp_path):
    arq = tmp_path / "ceps.csv"
    arq.write_text(CABECALHO + "\n" + "\n".join(LINHAS) + "\n", encoding="utf-8")
    return arq


def test_ler_lista_filtra_cidade_e_coordenada(tmp_path):
    lista = cl.ler_lista_ceps(escrever(tmp_path))
    assert sorted(r["cep"] for r in lista) == ["13500100", "13500200", "13500300", "13500400", "13500500"]
    primeiro = next(r for r in lista if r["cep"] == "13500100")
    assert primeiro["lat"] == -22.4 and primeiro["lon"] == -47.56 and primeiro["bairro"] == "Jardim Brasília"


def test_arquivo_ausente_devolve_lista_vazia(tmp_path):
    assert cl.ler_lista_ceps(tmp_path / "nao_existe.csv") == []


def test_rua_com_um_cep_so_sugere_o_cep_sem_coordenada(tmp_path):
    ruas = g.indexar_ruas_da_lista(cl.ler_lista_ceps(escrever(tmp_path)))
    r = g.cep_pela_rua("Av. 30, 290, Jd. Brasília", ruas)
    assert r["metodo"] == "cep_da_rua" and r["confianca"] == "baixa" and r["cep"] == "13500100"
    assert r["lat"] == "" and r["lon"] == ""                        # nunca inventa coordenada


def test_rua_por_extenso_e_tipo_diferente_acham_o_cep(tmp_path):
    ruas = g.indexar_ruas_da_lista(cl.ler_lista_ceps(escrever(tmp_path)))
    assert g.cep_pela_rua("Rua Marco Antonio Padula, 1043", ruas)["cep"] == "13500200"
    assert g.cep_pela_rua("Avenida Marco Antonio Padula, 1043", ruas)["cep"] == "13500200"


def test_rua_em_dois_ceps_desempata_pelo_bairro_ou_fica_ambigua(tmp_path):
    ruas = g.indexar_ruas_da_lista(cl.ler_lista_ceps(escrever(tmp_path)))
    com_bairro = g.cep_pela_rua("Rua 5, 1201, Bom Retiro", ruas)
    assert com_bairro["cep"] == "13500400" and com_bairro["confianca"] == "baixa"
    sem_bairro = g.cep_pela_rua("Rua 5, 1201", ruas)
    assert sem_bairro["confianca"] == "ambigua" and sem_bairro["cep"] == ""
    assert "13500300" in sem_bairro["alternativas"] and "13500400" in sem_bairro["alternativas"]


def test_rua_que_nao_esta_na_lista_devolve_none(tmp_path):
    ruas = g.indexar_ruas_da_lista(cl.ler_lista_ceps(escrever(tmp_path)))
    assert g.cep_pela_rua("Rua Inexistente, 10", ruas) is None


def test_propor_usa_a_lista_so_quando_o_cnefe_nao_resolveu(tmp_path):
    ruas = g.indexar_ruas_da_lista(cl.ler_lista_ceps(escrever(tmp_path)))
    servicos = [{"id": "x", "nome": "CRAS X", "endereco": "Av. 30, 290, Jd. Brasília", "cep": ""}]
    sem = g.propor(servicos, {})
    com = g.propor(servicos, {}, None, ruas)
    assert sem[0]["cep"] == "" and com[0]["cep"] == "13500100" and com[0]["metodo"] == "cep_da_rua"


def planilha(tmp_path, linhas):
    base = {c: "" for c in g.CAMPOS_PROPOSTA}
    plan = tmp_path / "p.csv"
    g._gravar_planilha(plan, g.CAMPOS_PROPOSTA, [{**base, **r} for r in linhas])
    return plan


def test_marcar_baixas_cep_respeita_limite_e_cep_divergente_mas_nao_trava_por_bairro(tmp_path):
    plan = planilha(tmp_path, [
        {"id": "perto", "nome": "P", "confianca": "baixa", "metodo": "numero_proximo", "cep": "13500100", "diferenca_numero": "40"},
        {"id": "longe", "nome": "L", "confianca": "baixa", "metodo": "numero_proximo", "cep": "13500100", "diferenca_numero": "900"},
        {"id": "rua", "nome": "R", "confianca": "baixa", "metodo": "cep_da_rua", "cep": "13500200"},
        {"id": "dif", "nome": "D", "confianca": "baixa", "metodo": "cep_da_rua", "cep": "13500200", "cep_confere": "não"},
        {"id": "feita", "nome": "F", "confianca": "baixa", "metodo": "cep_da_rua", "cep": "13500200", "decisao": "recusar"},
        {"id": "amb", "nome": "A", "confianca": "ambigua", "metodo": "cep_da_rua", "cep": ""},
        {"id": "bairro_difere", "nome": "B", "confianca": "baixa", "metodo": "numero_proximo", "cep": "13500100",
         "diferenca_numero": "5", "bairro_confere": "não", "bairro_cep": "Vila Alemã"},
    ])
    marcadas, puladas = g.marcar_baixas_cep(plan, 200)
    assert sorted(r["id"] for r in marcadas) == ["bairro_difere", "perto", "rua"]       # bairro diferente avisa, não bloqueia
    assert [r["id"] for r in puladas] == ["longe"] and "900" in puladas[0]["_motivo"]
    lidas = {r["id"]: r for r in g._ler_planilha(plan)[0]}
    assert lidas["dif"]["decisao"] == "" and lidas["longe"]["decisao"] == "" and lidas["feita"]["decisao"] == "recusar"


def test_aviso_de_bairro_so_aparece_quando_difere():
    assert "Vila Alemã" in g.aviso_de_bairro({"bairro_confere": "não", "bairro_cep": "Vila Alemã"})
    assert g.aviso_de_bairro({"bairro_confere": "sim", "bairro_cep": "x"}) == "" and g.aviso_de_bairro({"bairro_confere": ""}) == ""


def test_bairro_do_endereco_nos_dois_formatos_e_sem_cep():
    assert g.bairro_do_endereco("Rua 5, 1201, Jardim Bom Retiro") == "Jardim Bom Retiro"
    assert g.bairro_do_endereco("Rua 4-B, 70 - Cidade Nova") == "Cidade Nova"
    assert g.bairro_do_endereco("Av. Dois, 720, Centro, CEP 13500-411") == "Centro"
    assert g.bairro_do_endereco("Estrada dos Costas, 1349") == ""


def test_bairro_confere_ignora_jardim_e_exige_coincidencia():
    assert g.bairro_confere("Rua 5, 1201, Bom Retiro", "Jardim Bom Retiro") == "sim"
    assert g.bairro_confere("Rua 5, 1201, Jardim Bom Retiro", "Vila Alemã") == "não"
    assert g.bairro_confere("Estrada dos Costas, 1349", "Centro") == "" and g.bairro_confere("Rua 5, 1, Centro", "") == ""


def test_propor_traz_o_bairro_do_cep_e_se_confere(tmp_path):
    ruas = g.indexar_ruas_da_lista(cl.ler_lista_ceps(escrever(tmp_path)))
    bairros = {r["cep"]: r["bairro"] for r in cl.ler_lista_ceps(escrever(tmp_path))}
    servicos = [{"id": "x", "nome": "CRAS X", "endereco": "Av. 30, 290, Jd. Brasília", "cep": ""},
                {"id": "y", "nome": "Y", "endereco": "Av. 30, 290, Vila Outra", "cep": ""}]
    p = {r["id"]: r for r in g.propor(servicos, {}, None, ruas, bairros)}
    assert p["x"]["bairro_cep"] == "Jardim Brasília" and p["x"]["bairro_confere"] == "sim"
    assert p["y"]["bairro_confere"] == "não"


def test_completar_indice_nao_troca_cep_do_cnefe_e_nao_guarda_rua():
    indice = {"13500100": [-22.4, -47.56, 150, "setor", 30]}
    lista = [
        {"cep": "13500100", "logradouro": "Avenida 30", "bairro": "x", "lat": -22.5, "lon": -47.5},
        {"cep": "13500500", "logradouro": "Avenida 1-MP", "bairro": "Mãe Preta", "lat": -22.4204, "lon": -47.5304},
    ]
    novos = ic.completar_com_lista(indice, lista)
    assert list(novos) == ["13500500"] and indice["13500100"][4] == 30
    assert indice["13500500"] == [-22.42, -47.53, ic.RAIO_LISTA_M, "", 0]
    assert "Avenida" not in str(indice) and "Mãe" not in str(indice)
