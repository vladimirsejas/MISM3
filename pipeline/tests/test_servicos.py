import sys
from pathlib import Path

import pandas as pd
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import servicos as s  # noqa: E402


def test_coord_valida_aceita_virgula_e_rejeita_fora_da_regiao():
    assert s.coord_valida("-22,41", "-47,56") == (-22.41, -47.56)
    assert s.coord_valida("0", "0") is None
    assert s.coord_valida("-23.5", "-46.6") is None
    assert s.coord_valida("texto", "-47.56") is None


def test_localizar_prefere_coordenada_de_fonte_e_depois_cep():
    indice = {"13500000": [-22.40, -47.56, 300]}
    assert s.localizar("13500-000", "-22.42", "-47.57", indice) == (-22.42, -47.57, "coordenada_fonte")
    assert s.localizar("13500-000", None, None, indice) == (-22.40, -47.56, "centroide_cep")
    assert s.localizar("", None, None, indice) == (None, None, "sem_local")
    assert s.localizar("00000000", None, None, indice) == (None, None, "sem_local")


@pytest.mark.parametrize(("descricao", "esperado"), [
    ("Unidade Básica de Saúde", "ubs"),
    ("Pronto Atendimento / UPA", "urgencia"),
    ("Hospital municipal", "hospital"),
    ("CAPS II", "caps"),
    ("Policlínica de especialidades", "especialidades"),
    ("Laboratório de análises", "apoio"),
    ("Estabelecimento sem descrição conhecida", "outros"),
])
def test_subtipo_saude(descricao, esperado):
    assert s.subtipo_saude(descricao) == esperado


def test_censo_escolar_filtra_municipio_creche_e_unidade_ativa():
    df = pd.DataFrame([
        {"CO_MUNICIPIO": "3543907", "IN_COMUM_CRECHE": "1", "NO_ENTIDADE": "Escola Centro",
         "CO_ENTIDADE": "100", "TP_SITUACAO_FUNCIONAMENTO": "1", "TP_DEPENDENCIA": "3",
         "CO_CEP": "13500000", "DS_ENDERECO": "Rua A", "NU_ENDERECO": "10", "NO_BAIRRO": "Centro"},
        {"CO_MUNICIPIO": "3543907", "IN_COMUM_CRECHE": "0", "NO_ENTIDADE": "Só fundamental",
         "CO_ENTIDADE": "101", "TP_SITUACAO_FUNCIONAMENTO": "1"},
        {"CO_MUNICIPIO": "3543907", "IN_COMUM_CRECHE": "1", "NO_ENTIDADE": "Escola inativa",
         "CO_ENTIDADE": "102", "TP_SITUACAO_FUNCIONAMENTO": "2"},
        {"CO_MUNICIPIO": "3550308", "IN_COMUM_CRECHE": "1", "NO_ENTIDADE": "Outra cidade",
         "CO_ENTIDADE": "103", "TP_SITUACAO_FUNCIONAMENTO": "1"},
    ])
    itens = s.servicos_creches(df, {"13500000": [-22.40, -47.56, 250]}, "2026-10-12")
    assert len(itens) == 1
    item = itens[0]
    assert item["id"] == "inep-100"
    assert item["tipo"] == "creche" and item["subtipo"] == "municipal"
    assert item["lat"] == -22.40 and item["lon"] == -47.56 and item["geo"] == "centroide_cep"
    assert item["verificado_em"] == "2026-10-12"
    assert "não informa vagas livres" in item["observacao"]


def test_censo_escolar_falha_com_colunas_obrigatorias_ausentes():
    with pytest.raises(ValueError, match="Censo Escolar sem"):
        s.servicos_creches(pd.DataFrame([{"NO_ENTIDADE": "Escola"}]), {}, "2026-10-12")


def test_catalogo_manual_exige_fonte_e_data_e_rejeita_tipo_invalido():
    base = {"id": "man-cras", "tipo": "assistencia", "subtipo": "cras", "nome": "CRAS Centro",
            "fonte_url": "https://exemplo.gov.br", "verificado_em": "2026-10-12"}
    ok = s.servicos_manuais(pd.DataFrame([base]), {})
    assert ok[0]["id"] == "man-cras" and ok[0]["conferido"] is True and ok[0]["geo"] == "sem_local"
    with pytest.raises(ValueError, match="sem fonte_url/verificado_em"):
        s.servicos_manuais(pd.DataFrame([{**base, "fonte_url": ""}]), {})
    with pytest.raises(ValueError, match="Tipo invalido"):
        s.servicos_manuais(pd.DataFrame([{**base, "tipo": "inventado"}]), {})


def test_montar_remove_duplicata_por_id_e_prefere_manual_ligado_ao_cnes():
    cnes = [
        {"id": "cnes-123", "tipo": "saude", "subtipo": "ubs", "nome": "UBS CNES", "cnes": "123"},
        {"id": "cnes-456", "tipo": "saude", "subtipo": "ubs", "nome": "Outra UBS", "cnes": "456"},
    ]
    manuais = pd.DataFrame([
        {"id": "man-ubs", "tipo": "saude", "subtipo": "ubs", "nome": "UBS oficial", "cnes": "123",
         "fonte_url": "https://exemplo.gov.br", "verificado_em": "2026-10-12"},
        {"id": "man-cras", "tipo": "assistencia", "subtipo": "cras", "nome": "CRAS Centro",
         "fonte_url": "https://exemplo.gov.br", "verificado_em": "2026-10-12"},
    ])
    resultado = s.montar({}, cnes=cnes, manuais=manuais, hoje="2026-10-12")
    por_id = {x["id"]: x for x in resultado["servicos"]}
    assert "cnes-123" not in por_id
    assert por_id["man-ubs"]["nome"] == "UBS oficial"
    assert "cnes-456" in por_id and "man-cras" in por_id
    assert len(por_id) == len(resultado["servicos"])
