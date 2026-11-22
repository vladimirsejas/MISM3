"""Semântica da conferência do catálogo manual: planilha -> pipeline -> JSON.

Regra central: campo vazio NUNCA significa confirmação. Só a marcação explícita "sim" produz o estado "confirmado";
o campo antigo "conferido" do JSON continua existindo, mas é derivado (verdadeiro só quando o estado é confirmado).
"""
import csv
import json
import sys
from collections import Counter
from pathlib import Path

import pandas as pd
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import servicos as s  # noqa: E402
from common import RAIZ, ler_csv_flex, salvar_json  # noqa: E402

BASE = {"tipo": "assistencia", "subtipo": "cras", "nome": "CRAS Teste", "fonte_url": "https://exemplo.gov.br", "verificado_em": "2026-10-10"}


def _um(conferido, **extra):
    linha = {**BASE, **extra}
    if conferido is not None:
        linha["conferido"] = conferido
    return s.servicos_manuais(pd.DataFrame([linha]), {})[0]


def test_estado_confirmado_so_com_marcacao_explicita():
    r = _um("sim")
    assert r["estado_conferencia"] == "confirmado" and r["conferido"] is True


def test_estado_nao_confirmado_mantem_fonte_de_pesquisa_e_conferido_falso():
    r = _um("nao")
    assert r["estado_conferencia"] == "nao_confirmado" and r["conferido"] is False
    assert "não conferida" in r["fonte"]


@pytest.mark.parametrize("vazio", ["", None, "   ", float("nan")])
def test_campo_vazio_e_pendente_nunca_confirmado(vazio):
    r = _um(vazio)
    assert r["estado_conferencia"] == "pendente"
    assert r["conferido"] is False, "campo vazio não pode virar 'conferido'"


def test_valor_desconhecido_e_erro_e_nao_confirmacao_silenciosa():
    with pytest.raises(ValueError, match="conferido"):
        _um("talvez")


@pytest.mark.parametrize("estado", s.ESTADOS_CONFERENCIA)
def test_aviso_de_cautela_continua_no_registro_em_qualquer_estado(estado):
    valor = {"confirmado": "sim", "nao_confirmado": "nao", "pendente": ""}[estado]
    r = _um(valor, aviso="Confirme antes de ir.")
    assert r["estado_conferencia"] == estado and r["aviso"] == "Confirme antes de ir."


def test_planilha_para_json_preserva_o_estado_inclusive_campo_vazio(tmp_path):
    csv_path = tmp_path / "m.csv"
    campos = ["id", "tipo", "subtipo", "nome", "fonte_url", "verificado_em", "conferido"]
    linhas = [["a", "assistencia", "cras", "A", "https://x.gov.br", "2026-10-10", "sim"],
              ["b", "assistencia", "cras", "B", "https://x.gov.br", "2026-10-10", "nao"],
              ["c", "assistencia", "cras", "C", "https://x.gov.br", "2026-10-10", ""]]
    with csv_path.open("w", encoding="utf-8", newline="") as f:
        w = csv.writer(f); w.writerow(campos); w.writerows(linhas)
    saida = s.montar({}, None, None, ler_csv_flex(csv_path), hoje="2026-11-21")
    destino = tmp_path / "catalogo.json"
    salvar_json(saida, destino)
    lido = {x["id"]: x for x in json.loads(destino.read_text(encoding="utf-8"))["servicos"]}
    assert {k: (v["estado_conferencia"], v["conferido"]) for k, v in lido.items()} == {
        "a": ("confirmado", True), "b": ("nao_confirmado", False), "c": ("pendente", False)}


def test_catalogo_real_nenhum_registro_recebe_confirmacao_automatica():
    with (RAIZ / "catalogo" / "servicos_manuais.csv").open(encoding="utf-8", newline="") as f:
        planilha = {r["id"]: (r["conferido"] or "").strip().lower() for r in csv.DictReader(f)}
    gerado = json.loads((RAIZ / "web" / "dados" / "catalogo_manual.json").read_text(encoding="utf-8"))["servicos"]
    assert len(gerado) == len(planilha)
    esperado = {"sim": "confirmado", "nao": "nao_confirmado", "": "pendente"}
    for r in gerado:
        assert r["estado_conferencia"] == esperado[planilha[r["id"]]], r["id"]
        assert r["conferido"] is (r["estado_conferencia"] == "confirmado"), r["id"]
    contagem = Counter(r["estado_conferencia"] for r in gerado)
    assert contagem["confirmado"] == sum(1 for v in planilha.values() if v == "sim")
    assert contagem["pendente"] == sum(1 for v in planilha.values() if v == "")
