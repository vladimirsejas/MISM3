import csv
import sys
from pathlib import Path

import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import geocodificar_catalogo as g  # noqa: E402

COLUNAS = ["COD_MUNICIPIO", "NOM_TIPO_SEGLOGR", "NOM_TITULO_SEGLOGR", "NOM_SEGLOGR", "NUM_ENDERECO", "CEP",
           "LATITUDE", "LONGITUDE", "COD_SETOR"]


def cnefe_falso():
    L = [
        ("3543907", "AVENIDA", "", "30", "290", "13502000", "-22,4000", "-47,5600", "354390705000010"),
        ("3543907", "AVENIDA", "", "30", "290", "13502000", "-22,4001", "-47,5601", "354390705000010"),
        ("3543907", "AVENIDA", "", "30", "100", "13502000", "-22,4100", "-47,5700", "354390705000011"),
        ("3543907", "RUA", "", "M-9", "66", "13500999", "-22,4200", "-47,5500", "354390705000012"),
        ("3543907", "RUA", "", "5", "1201", "13503000", "-22,3900", "-47,5400", "354390705000013"),
        ("3543907", "RUA", "", "5", "1201", "13503111", "-22,3901", "-47,5401", "354390705000013"),   # CEP ambíguo
        ("3543907", "RUA", "", "7", "830", "13504000", "-22,3900", "-47,5000", "354390705000014"),
        ("3543907", "RUA", "", "7", "830", "13504000", "-22,4500", "-47,5900", "354390705000014"),    # pontos distantes
        ("3543907", "RUA", "DOUTOR", "ELOI CHAVES", "3265", "13504050", "-22,4300", "-47,5800", "354390705000015"),
        ("3304003", "AVENIDA", "", "30", "290", "27000000", "-22,4", "-43,8", "330400300000001"),     # outro município
    ]
    return pd.DataFrame(L, columns=COLUNAS, dtype=str)


def test_canon_ignora_hifen_espaco_zero_e_acento():
    assert g.canon("M-9") == g.canon("M 9") == "m9"
    assert g.canon("01") == "1"
    assert g.canon("Elói Chaves") == "eloichaves"
    assert g.canon("100") == "100"


def test_interpretar_endereco():
    e = g.interpretar_endereco("Av. 30, 290, Jd. Brasília")
    assert (e["tipo"], e["nome"], e["numero"]) == ("avenida", "30", 290)
    e = g.interpretar_endereco("Rua 15, nº 51, Consolação")
    assert e["numero"] == 51
    assert g.interpretar_endereco("Av. 4, s/n (entre as avenidas 1 e 3), Ajapi")["motivo"] == "sem_numero"
    assert g.interpretar_endereco("Avenida 62, 1134 - Recanto Paraíso")["numero"] == 1134
    assert g.interpretar_endereco("Rua 17, nº 30 (anexo ao Centro Social, entre as avenidas 23 e 35)")["numero"] == 30
    assert g.interpretar_endereco("Rua 18 JN, S/N - Jardim Novo")["motivo"] == "sem_numero"
    assert g.interpretar_endereco("Rua 15, entre as avenidas 23 e 25, Bairro do Estádio")["motivo"] == "sem_numero"
    assert g.interpretar_endereco("Avenida Visconde com Avenida 28 e 30, 150")["motivo"] == "cruzamento"
    assert g.interpretar_endereco("")["motivo"] == "sem_endereco"
    assert g.interpretar_endereco("Condomínio Maria, 12")["motivo"] == "rua_sem_tipo"


def test_casar_exato_com_media_dos_pontos_e_setor():
    idx = g.indexar_cnefe(cnefe_falso())
    r = g.casar("Av. 30, 290, Jd. Brasília", idx)
    assert r["qualidade"] == "exato"
    assert r["cep"] == "13502000" and r["setor"] == "354390705000010" and r["registros"] == 2
    assert abs(float(r["lat"]) - (-22.40005)) < 1e-5


def test_outro_municipio_nao_entra():
    idx = g.indexar_cnefe(cnefe_falso())
    assert all(reg[3] != "27000000" for regs in idx.values() for reg in regs)


def test_hifen_e_titulo_no_nome():
    idx = g.indexar_cnefe(cnefe_falso())
    assert g.casar("Rua M9, 66, Jd. Chervezon", idx)["qualidade"] == "exato"
    assert g.casar("Rua Doutor Elói Chaves, 3265, Alto do Santana", idx)["qualidade"] == "exato"


def test_numero_proximo_nunca_vira_exato():
    r = g.casar("Av. 30, 120, Centro", g.indexar_cnefe(cnefe_falso()))
    assert r["qualidade"] == "numero_proximo" and r["numero_cnefe"] == 100


def test_cep_ambiguo_e_dispersao_nao_sao_exatos():
    idx = g.indexar_cnefe(cnefe_falso())
    assert g.casar("Rua 5, 1201, Bom Retiro", idx)["qualidade"] == "exato_cep_ambiguo"
    assert g.casar("Rua 7, 830, Centro", idx)["qualidade"] == "exato_disperso"


def test_rua_nao_encontrada_e_tipo_diferente():
    idx = g.indexar_cnefe(cnefe_falso())
    assert g.casar("Rua Inexistente, 10, X", idx)["qualidade"] == "rua_nao_encontrada"
    r = g.casar("Rua 30, 290, X", idx)  # no IBGE é AVENIDA 30
    assert r["qualidade"] == "rua_so_pelo_nome" and "tipo diferente" in r["observacao"]


def test_propor_pula_quem_ja_tem_tudo_e_aplicar_so_exato_e_so_vazio(tmp_path):
    cat = tmp_path / "cat.csv"
    campos = ["id", "nome", "cep", "endereco", "lat", "lon", "observacao"]
    linhas = [
        {"id": "a", "nome": "A", "cep": "", "endereco": "Av. 30, 290, Jd. Brasília", "lat": "", "lon": "", "observacao": "x"},
        {"id": "b", "nome": "B", "cep": "13500001", "endereco": "Av. 30, 290, Jd. Brasília", "lat": "-1", "lon": "-2", "observacao": ""},
        {"id": "c", "nome": "C", "cep": "", "endereco": "Rua 7, 830, Centro", "lat": "", "lon": "", "observacao": ""},
        {"id": "d", "nome": "D", "cep": "99999999", "endereco": "Av. 30, 290, Jd. Brasília", "lat": "", "lon": "", "observacao": ""},
    ]
    with cat.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=campos, lineterminator="\n")
        w.writeheader()
        w.writerows(linhas)
    props = g.propor(linhas, g.indexar_cnefe(cnefe_falso()))
    assert [p["id"] for p in props] == ["a", "c", "d"]  # "b" já tem CEP e coordenada
    assert g.aplicar(cat, props) == 2  # "a" e "d"; "c" é exato_disperso
    lido = {r["id"]: r for r in csv.DictReader(cat.open(encoding="utf-8"))}
    assert lido["a"]["cep"] == "13502000" and lido["a"]["lat"].startswith("-22.4000")
    assert lido["d"]["cep"] == "99999999"          # CEP que já existia não é sobrescrito
    assert lido["d"]["lat"].startswith("-22.4000")  # coordenada vazia foi preenchida
    assert lido["c"]["cep"] == "" and lido["b"]["lat"] == "-1"
    assert lido["a"]["observacao"] == "x"
