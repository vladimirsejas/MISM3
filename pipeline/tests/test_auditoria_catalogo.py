"""A ferramenta de auditoria reproduz os números da auditoria de referência sobre o catálogo da versão pública (168 registros)."""
import csv
import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import auditoria_catalogo as au  # noqa: E402
from common import RAIZ  # noqa: E402

CSV_REAL = RAIZ / "catalogo" / "servicos_manuais.csv"


@pytest.fixture(scope="module")
def real():
    return au.auditar_catalogo(CSV_REAL, "2026-11-21")


def test_reproduz_registros_e_completude_de_referencia(real):
    assert real["registros"] == 168
    t = {k: v["preenchidos"] for k, v in real["completude_total"].items()}
    assert (t["telefone"], t["endereco"], t["cep"], t["horario"]) == (158, 156, 108, 63)
    assert real["coordenada_de_origem"]["registros_com_lat_e_lon_na_planilha"] == 84
    assert real["avisos_de_cautela"]["registros_com_aviso"] == 9


def test_reproduz_dominios_datas_e_idades(real):
    assert real["dominios"]["registros_em_dominios_municipais"] == 145 and real["dominios"]["dominios_municipais_com_registro"] == 4
    a = real["atualidade"]
    assert (a["data_consulta_mais_antiga"], a["data_consulta_mais_recente"]) == ("2026-10-08", "2026-11-23")
    assert (a["idade_minima_dias"], a["idade_maxima_dias"]) == (16, 44)


def test_reproduz_indicador_antigo_contra_marcacoes_explicitas(real):
    c = real["conferencia"]
    assert c["indicador_antigo_conferido"]["valor"] == 166 and c["marcacoes_explicitas"] == 12
    assert c["estados"] == {"confirmado": 10, "nao_confirmado": 2, "pendente": 156}
    assert real["procedencia"]["generica"] == 9


def test_completude_por_eixo_soma_o_total(real):
    eixos = real["completude_por_eixo"]
    assert sum(e["_registros"] for e in eixos.values()) == 168
    for campo in ("telefone", "endereco", "horario"):
        assert sum(e[campo]["preenchidos"] for e in eixos.values()) == real["completude_total"][campo]["preenchidos"]


def test_comando_grava_json_e_csv_sem_metricas_indefinidas(tmp_path):
    pequeno = tmp_path / "c.csv"
    with pequeno.open("w", encoding="utf-8", newline="") as f:
        w = csv.writer(f); w.writerow(["id", "tipo", "subtipo", "nome", "fonte_url", "verificado_em", "conferido", "telefone"])
        w.writerow(["a", "saude", "ubs", "A", "https://rioclaro.sp.gov.br/x", "2026-11-01", "", "123"])
        w.writerow(["b", "saude", "ubs", "B", "https://rioclaro.sp.gov.br/y", "2026-08-01", "nao", ""])
    saida = tmp_path / "out.json"
    assert au.main(["--catalogo", str(pequeno), "--referencia", "2026-11-21", "--sem-testes", "--saida", str(saida), "--commit-catalogo", "abc1234"]) == 0
    d = json.loads(saida.read_text(encoding="utf-8"))
    assert d["repositorio"]["commit"] and d["catalogo"]["commit_declarado"] == "abc1234" and len(d["catalogo"]["sha256"]) == 64
    assert d["executado_em"] and d["catalogo_auditoria"]["registros"] == 2
    assert d["catalogo_auditoria"]["conferencia"]["estados"] == {"confirmado": 0, "nao_confirmado": 1, "pendente": 1}
    assert d["catalogo_auditoria"]["atualidade"]["estados"] == {"consulta_recente": 1, "consulta_antiga": 1}
    assert d["privacidade"]["requisicoes_de_rede_por_cenario"]["status"] == "nao_executado"
    assert d["testes"]["status"] == "nao_executado"
    assert "armazenamento" in d["privacidade"]["analise_estatica_do_codigo"]
    assert (tmp_path / "out_completude.csv").exists()
    assert "None" not in saida.read_text(encoding="utf-8") and "NaN" not in saida.read_text(encoding="utf-8")
