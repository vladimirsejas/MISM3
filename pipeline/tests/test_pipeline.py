import sys
from pathlib import Path

import pandas as pd
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import common  # noqa: E402
import indice_cep  # noqa: E402
import servicos  # noqa: E402


def cnefe_falso():
    linhas = []
    # CEP 13500001: 10 enderecos proximos; CEP 13500002: 2 enderecos; outro municipio; sem CEP
    for i in range(10):
        linhas.append(("3543907", "13500001", "-22,4000", "-47,5600", "354390705000001"))
    linhas[0] = ("3543907", "13500001", "-22,4010", "-47,5610", "354390705000001")
    linhas += [("3543907", "13500002", "-22,41", "-47,57", "354390705000002")] * 2
    linhas += [("3304003", "27000000", "-22,4", "-43,8", "330400300000001")]  # Rio Claro RJ-like
    linhas += [("3543907", "", "-22,4", "-47,5", "354390705000003")]
    return pd.DataFrame(linhas, columns=["COD_MUNICIPIO", "CEP", "LATITUDE", "LONGITUDE", "COD_SETOR"], dtype=str)


def test_normalizar_cep():
    assert common.normalizar_cep("13.500-001") == "13500001"
    assert common.normalizar_cep(13500001.0) == "13500001"
    assert common.normalizar_cep("3500001") == "03500001"
    assert common.normalizar_cep("00000000") is None
    assert common.normalizar_cep(None) is None
    assert common.normalizar_cep("abc") is None


def test_indice_filtra_municipio_e_cep_vazio():
    idx = indice_cep.construir_indice(cnefe_falso())
    assert set(idx) == {"13500001", "13500002"}


def test_indice_raio_e_privacidade():
    idx = indice_cep.construir_indice(cnefe_falso())
    lat, lon, raio, setor, n = idx["13500001"]
    assert n == 10 and setor == "354390705000001"
    assert abs(lat + 22.4) < 0.001
    assert indice_cep.RAIO_MIN_M <= raio <= indice_cep.RAIO_MAX_M
    # CEP com poucos enderecos: raio maior e coordenada menos precisa (3 casas)
    assert idx["13500002"][2] >= indice_cep.RAIO_MIN_POUCOS_M
    assert len(str(idx["13500002"][0]).split(".")[1]) <= 3
    # nada alem de 5 campos numericos/codigo: sem rua ou nome
    assert all(len(v) == 5 for v in idx.values())


def test_indice_coluna_ausente():
    with pytest.raises(ValueError):
        indice_cep.construir_indice(pd.DataFrame({"X": ["1"]}))


def test_indice_municipio_inexistente():
    with pytest.raises(ValueError):
        indice_cep.construir_indice(cnefe_falso(), municipio="9999999")


INDICE = {"13500001": [-22.4, -47.56, 200, "s", 10]}


def test_localizar_prioridade():
    assert servicos.localizar("13500001", "-22,41", "-47,57", INDICE)[2] == "coordenada_fonte"
    assert servicos.localizar("13500001", None, None, INDICE) == (-22.4, -47.56, "centroide_cep")
    assert servicos.localizar("13500009", None, None, INDICE)[2] == "sem_local"
    # coordenada fora de Rio Claro (ex.: Rio Claro/RJ) e rejeitada e cai para o CEP
    assert servicos.localizar("13500001", "-22,9", "-43,8", INDICE)[2] == "centroide_cep"


def test_subtipo_saude():
    assert servicos.subtipo_saude("CENTRO DE SAUDE/UNIDADE BASICA") == "ubs"
    assert servicos.subtipo_saude("Pronto Atendimento") == "urgencia"
    assert servicos.subtipo_saude("CENTRO DE ATENCAO PSICOSSOCIAL") == "caps"
    assert servicos.subtipo_saude("POLICLINICA") == "especialidades"
    assert servicos.subtipo_saude("Clinica") == "outros"
    # nomes reais do CNES de Rio Claro que NAO sao lugares de atendimento
    for nome in ("UNIDADE MOVEL DE NIVEL PRE-HOSPITALAR NA AREA DE URGENCIA", "CENTRAL DE REGULACAO MEDICA DAS URGENCIAS",
                 "FARMACIA", "CENTRAL DE ABASTECIMENTO", "UNIDADE DE VIGILANCIA EM SAUDE", "LABORATORIO DE SAUDE PUBLICA",
                 "UNIDADE DE APOIO DIAGNOSE E TERAPIA (SADT ISOLADO)", "CONSULTORIO ISOLADO", "UNIDADE MOVEL TERRESTRE"):
        assert servicos.subtipo_saude(nome) == "apoio", nome
    assert servicos.subtipo_saude("HOSPITAL ESPECIALIZADO") == "hospital"
    assert servicos.subtipo_saude("CENTRO DE ATENCAO PSICOSSOCIAL") == "caps"
    assert servicos.subtipo_saude("CLINICA/CENTRO DE ESPECIALIDADE") == "especialidades"


def test_creches():
    df = pd.DataFrame({
        "CO_MUNICIPIO": ["3543907", "3543907", "3543907", "3304003"],
        "IN_COMUM_CRECHE": ["1", "0", "1", "1"],
        "NO_ENTIDADE": ["EMEI A", "ESCOLA B", "CRECHE C", "CRECHE RJ"],
        "CO_ENTIDADE": ["1", "2", "3", "4"],
        "TP_SITUACAO_FUNCIONAMENTO": ["1", "1", "2", "1"],
        "TP_DEPENDENCIA": ["3", "3", "3", "3"],
        "CO_CEP": ["13500001", "13500001", "13500001", "27000000"],
    })
    s = servicos.servicos_creches(df, INDICE, "2026-10-08")
    assert [x["nome"] for x in s] == ["Emei A"]  # so ativa, com creche, do municipio certo
    assert "vagas" in s[0]["observacao"]


def test_creches_colunas_faltando():
    with pytest.raises(ValueError):
        servicos.servicos_creches(pd.DataFrame({"A": ["1"]}), INDICE, "x")


def test_manuais_exigem_fonte_e_tipo():
    ok = pd.DataFrame([{"tipo": "mulher", "nome": "X", "cep": "13500001", "fonte_url": "http://a", "verificado_em": "2026-10-08"}])
    assert servicos.servicos_manuais(ok, INDICE)[0]["geo"] == "centroide_cep"
    with pytest.raises(ValueError):
        servicos.servicos_manuais(pd.DataFrame([{"tipo": "xx", "nome": "X", "fonte_url": "a", "verificado_em": "b"}]), INDICE)
    with pytest.raises(ValueError):
        servicos.servicos_manuais(pd.DataFrame([{"tipo": "mulher", "nome": "X"}]), INDICE)


def test_catalogo_manual_real_valido():
    df = common.ler_csv_flex(common.CATALOGO / "servicos_manuais.csv")
    s = servicos.servicos_manuais(df, INDICE)
    assert len(s) >= 2 and all(x["fonte_url"] and x["verificado_em"] for x in s)


def test_montar_deduplica():
    m = pd.DataFrame([{"id": "a", "tipo": "mulher", "nome": "X", "fonte_url": "u", "verificado_em": "d"}] * 2)
    out = servicos.montar(INDICE, manuais=m, hoje="2026-10-08")
    assert len(out["servicos"]) == 1


def test_catalogo_manual_do_site_nao_tem_demonstracao_e_tem_fonte():
    """web/dados/catalogo_manual.json e o que o site mostra sem o pipeline completo."""
    import json
    from pathlib import Path
    d = json.loads((Path(__file__).resolve().parents[2] / "web" / "dados" / "catalogo_manual.json").read_text(encoding="utf-8"))
    assert d["meta"]["demo"] is False
    assert d["servicos"], "catalogo vazio"
    for s in d["servicos"]:
        assert s["fonte_url"].startswith("http") and s["verificado_em"], s["nome"]
        assert "[DEMO]" not in s["nome"]
