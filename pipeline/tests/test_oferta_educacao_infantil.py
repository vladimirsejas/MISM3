import json
import sys
from pathlib import Path

import pandas as pd
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import oferta_educacao_infantil as o  # noqa: E402

RC = "3543907"
OUTRA = "3550308"  # outro município (não pode entrar)

ESCOLA = [
    # CO_MUNICIPIO, CO_ENTIDADE, NO_ENTIDADE, TP_DEPENDENCIA, TP_LOCALIZACAO, TP_SITUACAO, IN_COMUM_CRECHE, IN_COMUM_PRE, (extra)
    (RC, "35000001", "EMEI JARDIM TESTE", "3", "1", "1", "1", "1", "12345678000199"),
    (RC, "35000002", "CRECHE PARTICULAR TESTE", "4", "1", "1", "1", "0", "98765432000100"),
    (RC, "35000003", "ESCOLA SO FUNDAMENTAL", "3", "1", "1", "0", "0", ""),
    (RC, "35000004", "CRECHE PARALISADA", "3", "1", "2", "1", "0", ""),   # situação 2: não está em atividade
    (RC, "35000005", "EMEI SEM DADO DE MATRICULA", "3", "2", "1", "1", "1", ""),
    (OUTRA, "35999999", "CRECHE DE OUTRA CIDADE", "3", "1", "1", "1", "1", ""),
]
MATRICULA = [
    # CO_MUNICIPIO, CO_ENTIDADE, QT_MAT_INF_CRE, QT_MAT_BAS_0_3, QT_MAT_INF_PRE, QT_MAT_INF_CRE_INT
    (RC, "35000001", "80", "80", "120", "40"),
    (RC, "35000002", "30", "30", "0", ""),         # integral em branco -> null, não zero
    (RC, "35000003", "0", "0", "0", "0"),
    (OUTRA, "35999999", "500", "500", "500", "500"),
    # 35000005 não aparece na tabela de matrícula
]
TURMA = [
    (RC, "35000001", "4", "6"),
    (RC, "35000002", "2", "0"),
    (OUTRA, "35999999", "20", "20"),
]


def escreve(pasta, nome, colunas, linhas, codificacao="utf-8"):
    df = pd.DataFrame(linhas, columns=colunas, dtype=str)
    (pasta / nome).write_text(df.to_csv(sep=";", index=False), encoding=codificacao)


@pytest.fixture
def pasta(tmp_path):
    cols_escola = ["CO_MUNICIPIO", "CO_ENTIDADE", "NO_ENTIDADE", "TP_DEPENDENCIA", "TP_LOCALIZACAO",
                   "TP_SITUACAO_FUNCIONAMENTO", "IN_COMUM_CRECHE", "IN_COMUM_PRE", "NU_CNPJ_ESCOLA_PRIVADA"]
    escreve(tmp_path, o.ARQUIVOS["escola"], cols_escola, ESCOLA)
    escreve(tmp_path, o.ARQUIVOS["matricula"],
            ["CO_MUNICIPIO", "CO_ENTIDADE", "QT_MAT_INF_CRE", "QT_MAT_BAS_0_3", "QT_MAT_INF_PRE", "QT_MAT_INF_CRE_INT"], MATRICULA)
    escreve(tmp_path, o.ARQUIVOS["turma"], ["CO_MUNICIPIO", "CO_ENTIDADE", "QT_TUR_INF_CRE", "QT_TUR_INF_PRE"], TURMA)
    return tmp_path


def gerar(pasta, tmp_path, monkeypatch):
    saida = tmp_path / "saida.json"
    monkeypatch.setattr(sys, "argv", ["x", "--pasta", str(pasta), "--saida", str(saida)])
    assert o.main() == 0
    return json.loads(saida.read_text(encoding="utf-8"))


def test_so_rio_claro_e_so_escolas_em_atividade_com_educacao_infantil(pasta, tmp_path, monkeypatch):
    d = gerar(pasta, tmp_path, monkeypatch)
    ids = [e["inep"] for e in d["escolas"]]
    assert sorted(ids) == ["35000001", "35000002", "35000005"]  # sem outra cidade, sem paralisada, sem só-fundamental
    assert d["meta"]["escolas_fora_de_atividade_ignoradas"] == 1
    assert d["meta"]["municipio"] == RC


def test_numeros_por_escola_e_em_branco_nao_e_zero(pasta, tmp_path, monkeypatch):
    d = gerar(pasta, tmp_path, monkeypatch)
    por_id = {e["inep"]: e for e in d["escolas"]}
    a = por_id["35000001"]
    assert (a["rede"], a["localizacao"], a["oferece_creche"], a["oferece_pre_escola"]) == ("municipal", "urbana", True, True)
    assert (a["matriculas_creche"], a["matriculas_0_a_3_anos"], a["turmas_creche"], a["matriculas_pre_escola"]) == (80, 80, 4, 120)
    assert a["matriculas_creche_tempo_integral"] == 40
    assert por_id["35000002"]["matriculas_creche_tempo_integral"] is None      # branco -> null
    assert por_id["35000002"]["rede"] == "privada"
    sem = por_id["35000005"]                                                   # sem linha na tabela de matrícula
    assert sem["matriculas_creche"] is None and sem["turmas_creche"] is None and sem["localizacao"] == "rural"


def test_totais_por_rede_e_aviso(pasta, tmp_path, monkeypatch):
    d = gerar(pasta, tmp_path, monkeypatch)
    mun = d["totais_por_rede"]["municipal"]
    assert mun["escolas_com_educacao_infantil"] == 2 and mun["escolas_com_creche"] == 2
    assert mun["matriculas_creche"] == 80 and mun["turmas_creche"] == 4 and mun["matriculas_pre_escola"] == 120
    assert mun["escolas_sem_dado_de_matricula_creche"] == 1  # a escola 35000005: o total NÃO a conta como zero em silêncio
    assert d["totais_por_rede"]["privada"]["matriculas_creche"] == 30
    assert "não é vaga" in d["meta"]["aviso"].lower()


def test_saida_nao_leva_cnpj_nem_outros_campos_da_tabela(pasta, tmp_path, monkeypatch):
    d = gerar(pasta, tmp_path, monkeypatch)
    texto = json.dumps(d, ensure_ascii=False)
    assert "12345678000199" not in texto and "98765432000100" not in texto and "CNPJ" not in texto.upper()
    assert set(d["escolas"][0]) == {"inep", "nome", "rede", "localizacao", "oferece_creche", "oferece_pre_escola",
                                    "matriculas_creche", "matriculas_0_a_3_anos", "matriculas_creche_tempo_integral",
                                    "matriculas_pre_escola", "turmas_creche", "turmas_pre_escola"}


def test_arquivo_em_latin1_e_leitura_em_blocos(tmp_path):
    cols = ["CO_MUNICIPIO", "CO_ENTIDADE", "NO_ENTIDADE"]
    linhas = [(RC, "1", "ESCOLA JOSÉ AÇÃO")] + [(OUTRA, str(i), "X") for i in range(2, 120001)]  # > 2 blocos de 50 mil
    escreve(tmp_path, "t.csv", cols, linhas, codificacao="latin-1")
    df = o.ler_filtrado(tmp_path / "t.csv", cols)
    assert len(df) == 1 and df.iloc[0]["NO_ENTIDADE"] == "ESCOLA JOSÉ AÇÃO"


def test_coluna_faltando_da_erro_claro(tmp_path):
    escreve(tmp_path, "t.csv", ["CO_MUNICIPIO", "CO_ENTIDADE"], [(RC, "1")])
    with pytest.raises(ValueError, match="sem as colunas"):
        o.ler_filtrado(tmp_path / "t.csv", ["CO_MUNICIPIO", "CO_ENTIDADE", "QT_MAT_INF_CRE"])


def test_sem_tabela_de_turma_os_campos_ficam_null(pasta, tmp_path, monkeypatch, capsys):
    (pasta / o.ARQUIVOS["turma"]).unlink()
    d = gerar(pasta, tmp_path, monkeypatch)
    assert all(e["turmas_creche"] is None for e in d["escolas"])
    assert "AVISO" in capsys.readouterr().out


def test_inteiro():
    assert o.inteiro("12") == 12 and o.inteiro("12.0") == 12 and o.inteiro("0") == 0
    assert o.inteiro("") is None and o.inteiro(None) is None and o.inteiro("nan") is None and o.inteiro("abc") is None


def test_latin1_com_acento_so_no_fim_do_arquivo(tmp_path):
    """Regressão: detectar a codificação só pelo começo quebraria quando o primeiro acento vem depois de milhares de linhas."""
    cols = ["CO_MUNICIPIO", "CO_ENTIDADE", "NO_ENTIDADE"]
    linhas = [(OUTRA, str(i), "ESCOLA SEM ACENTO " + "X" * 40) for i in range(1, 200001)] + [(RC, "9", "ESCOLA JOSÉ")]
    escreve(tmp_path, "t.csv", cols, linhas, codificacao="latin-1")
    assert (tmp_path / "t.csv").stat().st_size > 8 * 1024 * 1024  # mais de dois blocos de 4 MB antes do primeiro acento
    assert o.detectar_codificacao(tmp_path / "t.csv") == "latin-1"
    df = o.ler_filtrado(tmp_path / "t.csv", cols)
    assert len(df) == 1 and df.iloc[0]["NO_ENTIDADE"] == "ESCOLA JOSÉ"


def test_utf8_com_bom_e_detectado(tmp_path):
    cols = ["CO_MUNICIPIO", "CO_ENTIDADE", "NO_ENTIDADE"]
    escreve(tmp_path, "t.csv", cols, [(RC, "1", "ESCOLA AÇÃO")], codificacao="utf-8-sig")
    assert o.detectar_codificacao(tmp_path / "t.csv") == "utf-8-sig"
    assert o.ler_filtrado(tmp_path / "t.csv", cols).iloc[0]["NO_ENTIDADE"] == "ESCOLA AÇÃO"


def test_le_parquet_com_mesmo_resultado_do_csv(pasta, tmp_path):
    pytest.importorskip("pyarrow")
    esperado = o.ler_filtrado(pasta / o.ARQUIVOS["escola"], o.COLUNAS["escola"])
    diretorio = tmp_path / "parquet"
    diretorio.mkdir()
    for chave, nome in o.ARQUIVOS.items():
        pd.read_csv(pasta / nome, sep=";", dtype=str).to_parquet(
            diretorio / (Path(nome).stem + ".parquet"), index=False)
    caminho = o.caminho_tabela(diretorio, o.ARQUIVOS["escola"])
    obtido = o.ler_filtrado(caminho, o.COLUNAS["escola"])
    assert obtido.to_dict("records") == esperado.to_dict("records")


def test_parquet_tem_prioridade_sobre_csv(pasta, tmp_path):
    pytest.importorskip("pyarrow")
    nome = o.ARQUIVOS["escola"]
    df = pd.read_csv(pasta / nome, sep=";", dtype=str)
    diretorio = tmp_path / "dados"
    diretorio.mkdir()
    df.to_parquet(diretorio / (Path(nome).stem + ".parquet"), index=False)
    (diretorio / nome).write_text("arquivo CSV que não deve ser escolhido", encoding="utf-8")
    assert o.caminho_tabela(diretorio, nome).suffix == ".parquet"
