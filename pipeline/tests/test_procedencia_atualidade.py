"""Procedência da fonte (identificada / genérica / não identificada) e atualidade da consulta.

A data de verificação é a data em que o projeto consultou a fonte, NÃO a data em que o órgão atualizou a informação.
"""
import json
import re
import sys
from collections import Counter
from pathlib import Path

import pandas as pd
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import servicos as s  # noqa: E402
from common import RAIZ  # noqa: E402

BASE = {"tipo": "assistencia", "subtipo": "cras", "nome": "CRAS Teste", "fonte_url": "https://exemplo.gov.br", "verificado_em": "2026-10-10"}


def _um(**extra):
    return s.servicos_manuais(pd.DataFrame([{**BASE, **extra}]), {}, referencia="2026-11-21")[0]


# ------------------------------------------------------------ procedência
def test_fonte_descrita_na_planilha_e_identificada():
    r = _um(fonte="Prefeitura de Rio Claro, página Unidades", conferido="sim")
    assert r["fonte_tipo"] == "identificada" and r["fonte"] == "Prefeitura de Rio Claro, página Unidades"


def test_fonte_em_branco_recebe_texto_generico_e_e_marcada_como_generica():
    r = _um(conferido="")
    assert r["fonte_tipo"] == "generica" and r["fonte"] == s.TEXTO_FONTE_GENERICA
    assert r["fonte_url"] == "https://exemplo.gov.br", "o endereço do órgão é preservado; nenhuma página específica é inventada"


def test_registro_nao_confirmado_sem_fonte_e_nao_identificado():
    r = _um(conferido="nao")
    assert r["fonte_tipo"] == "nao_identificada" and r["fonte"] == s.TEXTO_FONTE_NAO_CONFIRMADA


def test_texto_generico_digitado_na_planilha_nao_vira_fonte_identificada_por_engano():
    # quem escreve a frase genérica à mão informou algo: é "identificada" pela regra (fonte presente); o teste do catálogo real abaixo
    # garante que os 9 registros do JSON com o texto genérico foram marcados como genéricos, não como identificados.
    assert _um(fonte=s.TEXTO_FONTE_GENERICA)["fonte_tipo"] == "identificada"


def test_catalogo_real_os_registros_com_texto_generico_estao_marcados_como_genericos():
    cat = json.loads((RAIZ / "web" / "dados" / "catalogo_manual.json").read_text(encoding="utf-8"))["servicos"]
    for r in cat:
        assert r["fonte_tipo"] in s.FONTES_TIPOS, r["id"]
        if r["fonte"] == s.TEXTO_FONTE_GENERICA:
            assert r["fonte_tipo"] == "generica", r["id"]
        if r["fonte_tipo"] == "generica":
            assert r["fonte"] == s.TEXTO_FONTE_GENERICA, f"{r['id']}: fonte específica atribuída sem evidência"
    assert Counter(r["fonte_tipo"] for r in cat)["generica"] == 9


# ------------------------------------------------------------ atualidade
@pytest.mark.parametrize(("data", "dias", "estado"), [
    ("2026-11-21", 0, "consulta_recente"),
    ("2026-10-22", 30, "consulta_recente"),        # limite: 30 dias ainda é recente
    ("2026-10-21", 31, "consulta_a_renovar"),
    ("2026-08-23", 90, "consulta_a_renovar"),      # limite: 90 dias ainda é "a renovar"
    ("2026-08-22", 91, "consulta_antiga"),
    ("2026-10-08", 44, "consulta_a_renovar"),      # mais antiga do catálogo na referência do artigo
    ("2026-11-05", 16, "consulta_recente"),
])
def test_limites_de_atualidade(data, dias, estado):
    assert s.atualidade_da_consulta(data, "2026-11-21") == (dias, estado)


@pytest.mark.parametrize("data", ["", None, "lixo", "2026-13-40", "2027-01-01"])
def test_data_ausente_invalida_ou_futura_e_desconhecida(data):
    assert s.atualidade_da_consulta(data, "2026-11-21") == (None, "desconhecida")


def test_limites_sao_configuraveis():
    assert s.atualidade_da_consulta("2026-11-01", "2026-11-21", {"recente_ate_dias": 10, "a_renovar_ate_dias": 15}) == (20, "consulta_antiga")


def test_campos_de_atualidade_separados_e_data_da_fonte_vazia_quando_nao_ha():
    r = _um()
    assert r["data_consulta"] == "2026-10-10" == r["verificado_em"]
    assert r["data_atualizacao_fonte"] is None, "não inventar data de atualização pela instituição"
    assert r["idade_verificacao_dias"] == 42 and r["atualidade"] == "consulta_a_renovar"
    assert _um(atualizacao_fonte="2026-09-01")["data_atualizacao_fonte"] == "2026-09-01"


def test_nenhum_estado_de_atualidade_afirma_que_a_informacao_esta_atualizada():
    todos = {"consulta_recente", "consulta_a_renovar", "consulta_antiga", "desconhecida"}
    assert not any(re.search(r"atualizad", e) for e in todos)
    meta = json.loads((RAIZ / "web" / "dados" / "catalogo_manual.json").read_text(encoding="utf-8"))["meta"]
    assert meta["limites_atualidade"] == s.LIMITES_ATUALIDADE and "nao dizem quando o orgao atualizou" in meta["nota_atualidade"]


def test_limites_do_pipeline_e_da_interface_sao_os_mesmos():
    js = (RAIZ / "web" / "acesso.js").read_text(encoding="utf-8")
    m = re.search(r"LIMITES_ATUALIDADE\s*=\s*\{\s*recente_ate_dias:\s*(\d+),\s*a_renovar_ate_dias:\s*(\d+)\s*\}", js)
    assert m and (int(m.group(1)), int(m.group(2))) == (s.LIMITES_ATUALIDADE["recente_ate_dias"], s.LIMITES_ATUALIDADE["a_renovar_ate_dias"])
