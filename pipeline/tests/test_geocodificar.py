import copy
import csv
import sys
import zipfile
from pathlib import Path

import pandas as pd
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import geocodificar_catalogo as g  # noqa: E402

COLUNAS = ["COD_MUNICIPIO", "NOM_TIPO_SEGLOGR", "NOM_TITULO_SEGLOGR", "NOM_SEGLOGR", "NUM_ENDERECO", "CEP",
           "LATITUDE", "LONGITUDE", "COD_SETOR"]

LINHAS_CNEFE = [
    # Av. 30, 290: dois pontos no mesmo CEP, a poucos metros -> exato
    ("3543907", "AVENIDA", "", "30", "290", "13502000", "-22,4000", "-47,5600", "354390705000010"),
    ("3543907", "AVENIDA", "", "30", "290", "13502000", "-22,4001", "-47,5601", "354390705000010"),
    ("3543907", "AVENIDA", "", "30", "100", "13502000", "-22,4100", "-47,5700", "354390705000011"),
    ("3543907", "RUA", "", "M-9", "66", "13500999", "-22,4200", "-47,5500", "354390705000012"),
    # Rua 5, 1201: o mesmo número em dois CEPs (rua repetida em outro bairro/distrito) -> ambíguo
    ("3543907", "RUA", "", "5", "1201", "13503000", "-22,3900", "-47,5400", "354390705000013"),
    ("3543907", "RUA", "", "5", "1201", "13503111", "-22,3901", "-47,5401", "354390705000013"),
    # Rua 7, 830: um CEP só, mas pontos a ~13 km um do outro -> não dá para afirmar coordenada
    ("3543907", "RUA", "", "7", "830", "13504000", "-22,3900", "-47,5000", "354390705000014"),
    ("3543907", "RUA", "", "7", "830", "13504000", "-22,4500", "-47,5900", "354390705000014"),
    ("3543907", "RUA", "DOUTOR", "ELOI CHAVES", "3265", "13504050", "-22,4300", "-47,5800", "354390705000015"),
    # "18" existe como RUA e como AVENIDA -> o catálogo só diz "18"
    ("3543907", "RUA", "", "18", "50", "13505000", "-22,4400", "-47,5100", "354390705000016"),
    ("3543907", "AVENIDA", "", "18", "50", "13505111", "-22,4401", "-47,5101", "354390705000017"),
    # só existe como AVENIDA 40
    ("3543907", "AVENIDA", "", "40", "77", "13506000", "-22,4600", "-47,5200", "354390705000018"),
    ("3304003", "AVENIDA", "", "30", "290", "27000000", "-22,4", "-43,8", "330400300000001"),  # outro município
]


def cnefe_falso():
    return pd.DataFrame(LINHAS_CNEFE, columns=COLUNAS, dtype=str)


@pytest.fixture
def idx():
    return g.indexar_cnefe(cnefe_falso())


def sem_sugestao_de_local(r):
    assert r["lat"] == "" and r["lon"] == ""


# ------------------------------------------------------------- grafias e interpretação do endereço
def test_canon_ignora_hifen_espaco_zero_e_acento():
    assert g.canon("M-9") == g.canon("M 9") == "m9"
    assert g.canon("01") == "1"
    assert g.canon("Elói Chaves") == "eloichaves"
    assert g.canon("100") == "100"


def test_interpretar_endereco():
    e = g.interpretar_endereco("Av. 30, 290, Jd. Brasília")
    assert (e["tipo"], e["nome"], e["numero"]) == ("avenida", "30", 290)
    assert g.interpretar_endereco("Rua 15, nº 51, Consolação")["numero"] == 51
    assert g.interpretar_endereco("Avenida 62, 1134 - Recanto Paraíso")["numero"] == 1134
    assert g.interpretar_endereco("Rua 17, nº 30 (anexo ao Centro Social, entre as avenidas 23 e 35)")["numero"] == 30
    assert g.interpretar_endereco("Av. 4, s/n (entre as avenidas 1 e 3), Ajapi")["motivo"] == "sem_numero"
    assert g.interpretar_endereco("Rua 18 JN, S/N - Jardim Novo")["motivo"] == "sem_numero"
    assert g.interpretar_endereco("Rua 15, entre as avenidas 23 e 25, Bairro do Estádio")["motivo"] == "sem_numero"
    assert g.interpretar_endereco("Avenida Visconde com Avenida 28 e 30, 150")["motivo"] == "cruzamento"
    assert g.interpretar_endereco("")["motivo"] == "sem_endereco"
    assert g.interpretar_endereco("Condomínio Maria, 12")["motivo"] == "rua_sem_tipo"


def test_grafias_diferentes_chegam_ao_mesmo_lugar(idx):
    # abreviação x tipo por extenso, hífen x sem hífen, acento, título (DOUTOR) no nome
    for endereco in ("Av. 30, 290, X", "Avenida 30, 290, X", "AV 30, 290", "Avenida 030, 290"):
        assert g.casar(endereco, idx)["confianca"] == "alta", endereco
    assert g.casar("Rua M9, 66, Jd. Chervezon", idx)["confianca"] == "alta"
    assert g.casar("R. M 9, 66", idx)["confianca"] == "alta"
    assert g.casar("Rua Doutor Elói Chaves, 3265, Alto do Santana", idx)["confianca"] == "alta"


# ------------------------------------------------------------- correspondência confiável
def test_exato_tem_coordenada_cep_setor_metodo_e_candidatos(idx):
    r = g.casar("Av. 30, 290, Jd. Brasília", idx)
    assert (r["confianca"], r["metodo"], r["candidatos"], r["situacao"]) == ("alta", "rua_numero_exatos", 1, "sugestao")
    assert r["cep"] == "13502000" and r["setor"] == "354390705000010" and r["registros"] == 2
    assert abs(float(r["lat"]) - (-22.40005)) < 1e-5


def test_outro_municipio_nao_entra(idx):
    assert all(reg[3] != "27000000" for regs in idx.values() for reg in regs)


# ------------------------------------------------------------- duplicados e ambiguidade: nada de coordenada
def test_mesmo_numero_em_dois_ceps_fica_ambiguo_com_alternativas(idx):
    r = g.casar("Rua 5, 1201, Bom Retiro", idx)
    assert (r["confianca"], r["candidatos"], r["situacao"]) == ("ambigua", 2, "pendente")
    assert "13503000" in r["alternativas"] and "13503111" in r["alternativas"]
    assert r["cep"] == ""
    sem_sugestao_de_local(r)


def test_um_cep_mas_pontos_muito_distantes_nao_ganha_coordenada(idx):
    r = g.casar("Rua 7, 830, Centro", idx)
    assert r["confianca"] == "baixa" and r["cep"] == "13504000"
    sem_sugestao_de_local(r)


def test_nome_de_rua_existente_com_dois_tipos_fica_ambiguo(idx):
    r = g.casar("Travessa 18, 50, X", idx)  # tipo que não existe, mas o nome "18" existe como RUA e AVENIDA
    assert (r["metodo"], r["confianca"], r["candidatos"]) == ("rua_ambigua", "ambigua", 2)
    assert "RUA 18" in r["alternativas"] and "AVENIDA 18" in r["alternativas"]
    sem_sugestao_de_local(r)


def test_tipo_diferente_unico_so_sugere_cep(idx):
    r = g.casar("Rua 40, 77, X", idx)  # no IBGE é AVENIDA 40
    assert (r["metodo"], r["confianca"], r["cep"]) == ("rua_numero_tipo_diferente", "baixa", "13506000")
    sem_sugestao_de_local(r)


# ------------------------------------------------------------- sem número, sem correspondência, incompleto
def test_numero_proximo_so_sugere_cep_e_nunca_coordenada_de_vizinho(idx):
    r = g.casar("Av. 30, 120, Centro", idx)
    assert (r["metodo"], r["confianca"], r["cep"], r["numero_cnefe"]) == ("numero_proximo", "baixa", "13502000", 100)
    sem_sugestao_de_local(r)


def test_servico_sem_numero_nao_ganha_sugestao(idx):
    for endereco in ("Av. 30, s/n, Centro", "Av. 30, entre as avenidas 1 e 3"):
        r = g.casar(endereco, idx)
        assert (r["metodo"], r["confianca"], r["situacao"]) == ("rua_sem_numero", "nenhuma", "pendente")
        assert r["cep"] == ""
        sem_sugestao_de_local(r)


def test_endereco_sem_correspondencia_fica_pendente_e_mostra_nomes_parecidos(idx):
    r = g.casar("Rua Doutor Eloi Chavez, 3265, X", idx)  # erro de digitação
    assert (r["metodo"], r["confianca"], r["candidatos"]) == ("sem_correspondencia", "nenhuma", 0)
    assert "ELOI CHAVES" in r["alternativas"]  # só para conferir; nada é aplicado
    assert r["cep"] == ""
    sem_sugestao_de_local(r)
    longe = g.casar("Rua Zzzzz, 1, X", idx)
    assert longe["metodo"] == "sem_correspondencia" and longe["alternativas"] == ""


def test_endereco_incompleto_nao_ganha_sugestao(idx):
    for endereco in ("", "Avenida Visconde com Avenida 28 e 30, 150", "Condomínio Maria, 12"):
        r = g.casar(endereco, idx)
        assert (r["metodo"], r["confianca"], r["situacao"]) == ("endereco_incompleto", "nenhuma", "pendente")
        sem_sugestao_de_local(r)


# ------------------------------------------------------------- o catálogo original nunca muda sozinho
CAMPOS_CAT = ["id", "nome", "cep", "endereco", "lat", "lon", "observacao"]


def escrever_catalogo(caminho, linhas):
    with caminho.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=CAMPOS_CAT, lineterminator="\n")
        w.writeheader()
        w.writerows(linhas)


def servicos():
    return [
        {"id": "a", "nome": "A", "cep": "", "endereco": "Av. 30, 290, Jd. Brasília", "lat": "", "lon": "", "observacao": "x"},
        {"id": "b", "nome": "B", "cep": "13500001", "endereco": "Av. 30, 290, Jd. Brasília", "lat": "-22.4", "lon": "-47.5", "observacao": ""},
        {"id": "c", "nome": "C", "cep": "", "endereco": "Rua 5, 1201, Bom Retiro", "lat": "", "lon": "", "observacao": ""},
        {"id": "d", "nome": "D", "cep": "99999999", "endereco": "Av. 30, 290, Jd. Brasília", "lat": "", "lon": "", "observacao": ""},
        {"id": "e", "nome": "E", "cep": "", "endereco": "", "lat": "", "lon": "", "observacao": ""},
    ]


def test_propor_nao_altera_as_linhas_e_pula_completas_e_sem_endereco(idx):
    linhas = servicos()
    antes = copy.deepcopy(linhas)
    props = g.propor(linhas, idx)
    assert linhas == antes
    assert [p["id"] for p in props] == ["a", "c", "d"]  # "b" já está completo; "e" não tem endereço
    assert all(p["decisao"] == "" for p in props)
    assert set(props[0]) == set(g.CAMPOS_PROPOSTA)


def test_main_gera_planilha_sem_tocar_no_catalogo(tmp_path, monkeypatch):
    cat = tmp_path / "cat.csv"
    escrever_catalogo(cat, servicos())
    bytes_antes = cat.read_bytes()
    zip_cnefe = tmp_path / "cnefe.zip"
    with zipfile.ZipFile(zip_cnefe, "w") as z:
        z.writestr("3543907_RIO_CLARO.csv", cnefe_falso().to_csv(sep=";", index=False))
    saida = tmp_path / "proposta.csv"
    monkeypatch.setattr(sys, "argv", ["x", "--cnefe", str(zip_cnefe), "--catalogo", str(cat), "--saida", str(saida)])
    assert g.main() == 0
    assert cat.read_bytes() == bytes_antes
    lidas = list(csv.DictReader(saida.open(encoding="utf-8")))
    assert [r["id"] for r in lidas] == ["a", "c", "d"]
    assert lidas[0]["confianca"] == "alta" and lidas[1]["confianca"] == "ambigua"
    assert list(lidas[0]) == g.CAMPOS_PROPOSTA


# ------------------------------------------------------------- só entra no catálogo o que uma pessoa aprovou
def planilha(caminho, linhas):
    with caminho.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=g.CAMPOS_PROPOSTA, lineterminator="\n")
        w.writeheader()
        for r in linhas:
            w.writerow({**{c: "" for c in g.CAMPOS_PROPOSTA}, **r})


def lido(cat):
    return {r["id"]: r for r in csv.DictReader(cat.open(encoding="utf-8"))}


def test_sem_aprovacao_nada_muda(tmp_path, idx):
    cat, plan = tmp_path / "cat.csv", tmp_path / "p.csv"
    escrever_catalogo(cat, servicos())
    planilha(plan, g.propor(servicos(), idx))
    antes = cat.read_bytes()
    mud, avisos = g.aplicar_aprovadas(cat, plan, tmp_path / "log.csv")
    assert mud == [] and cat.read_bytes() == antes and not (tmp_path / "log.csv").exists()


def test_aprovar_copia_so_campos_vazios_e_registra(tmp_path, idx):
    cat, plan, log = tmp_path / "cat.csv", tmp_path / "p.csv", tmp_path / "log.csv"
    escrever_catalogo(cat, servicos())
    props = g.propor(servicos(), idx)
    for p in props:
        if p["id"] in ("a", "d"):
            p["decisao"] = "Aprovar"
    planilha(plan, props)
    mud, avisos = g.aplicar_aprovadas(cat, plan, log)
    r = lido(cat)
    assert r["a"]["cep"] == "13502000" and r["a"]["lat"] == "-22.400050" and r["a"]["observacao"] == "x"
    assert r["d"]["cep"] == "99999999" and r["d"]["lat"] == "-22.400050"  # CEP existente não é sobrescrito
    assert any("cep já preenchido" in a for a in avisos)
    assert r["c"]["cep"] == "" and r["b"]["lat"] == "-22.4"  # "c" (ambíguo) não foi aprovado; "b" intocado
    registro = list(csv.DictReader(log.open(encoding="utf-8")))
    assert {x["id"] for x in registro} == {"a", "d"} and all(x["metodo"] == "rua_numero_exatos" for x in registro)


def test_linha_ambigua_so_entra_se_a_pessoa_digitar_o_valor_certo(tmp_path):
    cat, plan = tmp_path / "cat.csv", tmp_path / "p.csv"
    escrever_catalogo(cat, servicos())
    planilha(plan, [{"id": "c", "decisao": "aprovar", "confianca": "ambigua", "metodo": "rua_numero_exatos"}])
    assert g.aplicar_aprovadas(cat, plan)[0] == []  # aprovada, mas sem valor: nada a gravar
    planilha(plan, [{"id": "c", "decisao": "aprovar", "cep": "13503000", "lat": "-22,3900", "lon": "-47,5400",
                     "confianca": "ambigua", "metodo": "rua_numero_exatos"}])
    mud, _ = g.aplicar_aprovadas(cat, plan)
    assert len(mud) == 3 and lido(cat)["c"]["lon"] == "-47.540000"


@pytest.mark.parametrize("valores, trecho", [
    ({"cep": "123", "lat": "-22.4", "lon": "-47.5"}, "CEP inválido"),
    ({"cep": "13503000", "lat": "-23.5", "lon": "-46.6"}, "fora de Rio Claro"),  # São Paulo
    ({"cep": "13503000", "lat": "-22.4", "lon": ""}, "juntas"),
])
def test_valores_invalidos_na_planilha_nao_sao_aplicados(tmp_path, valores, trecho):
    cat, plan = tmp_path / "cat.csv", tmp_path / "p.csv"
    escrever_catalogo(cat, servicos())
    antes = cat.read_bytes()
    planilha(plan, [{"id": "c", "decisao": "aprovar", **valores}])
    mud, avisos = g.aplicar_aprovadas(cat, plan)
    assert mud == [] and cat.read_bytes() == antes and any(trecho in a for a in avisos)


def test_id_inexistente_gera_aviso(tmp_path):
    cat, plan = tmp_path / "cat.csv", tmp_path / "p.csv"
    escrever_catalogo(cat, servicos())
    planilha(plan, [{"id": "zzz", "decisao": "aprovar", "cep": "13503000"}])
    mud, avisos = g.aplicar_aprovadas(cat, plan)
    assert mud == [] and any("não existe" in a for a in avisos)
