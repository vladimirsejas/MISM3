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


def test_objetivos_e_gratuito_do_catalogo():
    base = {"tipo": "emprego_curso", "nome": "X", "fonte_url": "u", "verificado_em": "d"}
    out = servicos.servicos_manuais(pd.DataFrame([dict(base, objetivos="trabalhar;curso", gratuito="sim")]), INDICE)[0]
    assert out["objetivos"] == ["trabalhar", "curso"] and out["gratuito"] is True
    vazio = servicos.servicos_manuais(pd.DataFrame([base]), INDICE)[0]
    assert "objetivos" not in vazio and "gratuito" not in vazio  # nao inventa o que a fonte nao diz
    with pytest.raises(ValueError):
        servicos.servicos_manuais(pd.DataFrame([dict(base, objetivos="voar")]), INDICE)


def test_catalogo_real_so_usa_objetivos_validos():
    df = common.ler_csv_flex(common.CATALOGO / "servicos_manuais.csv")
    for x in servicos.servicos_manuais(df, INDICE):
        assert set(x.get("objetivos", [])) <= set(servicos.OBJETIVOS)


def test_montar_deduplica():
    m = pd.DataFrame([{"id": "a", "tipo": "mulher", "nome": "X", "fonte_url": "u", "verificado_em": "d"}] * 2)
    out = servicos.montar(INDICE, manuais=m, hoje="2026-10-08")
    assert len(out["servicos"]) == 1


def _catalogo_escolas_falso():
    return pd.DataFrame([
        {"Código INEP": "35000001", "Escola": "EMEI JARDIM A", "Restrição de Atendimento": "Escola em funcionamento",
         "Dependência Administrativa": "Municipal", "Endereço": "Rua A, 1", "Telefone": "(19) 3000-0001",
         "Latitude": "-22,4010", "Longitude": "-47,5610", "Etapas e Modalidade de Ensino Oferecidas": "Educação Infantil - Pré-escola"},
        {"Código INEP": "35000002", "Escola": "ESCOLA PARALISADA", "Restrição de Atendimento": "Escola paralisada",
         "Dependência Administrativa": "Municipal", "Endereço": "Rua B, 2", "Telefone": "", "Latitude": "", "Longitude": "",
         "Etapas e Modalidade de Ensino Oferecidas": "Educação Infantil"},
        {"Código INEP": "35000003", "Escola": "COLEGIO SO FUNDAMENTAL", "Restrição de Atendimento": "Escola em funcionamento",
         "Dependência Administrativa": "Estadual", "Endereço": "Rua C, 3", "Telefone": "", "Latitude": "", "Longitude": "",
         "Etapas e Modalidade de Ensino Oferecidas": "Ensino Fundamental"},
        {"Código INEP": "35000004", "Escola": "ESCOLA ESPECIAL", "Restrição de Atendimento": "Atende exclusivamente alunos com deficiência",
         "Dependência Administrativa": "Privada", "Endereço": "Rua D, 4", "Telefone": "", "Latitude": "", "Longitude": "",
         "Etapas e Modalidade de Ensino Oferecidas": "Educação Infantil"},
        {"Código INEP": "35000005", "Escola": "BERCARIO PRIVADO", "Restrição de Atendimento": "Escola em funcionamento",
         "Dependência Administrativa": "Privada", "Endereço": "Rua E, 5", "Telefone": "(19) 3000-0005", "Latitude": "", "Longitude": "",
         "Etapas e Modalidade de Ensino Oferecidas": "Educação Infantil - Creche; Pré-escola"},
    ])


def test_catalogo_escolas_filtra_e_nao_afirma_creche():
    out = servicos.montar(INDICE, catalogo_escolas=_catalogo_escolas_falso(), hoje="2026-10-09")["servicos"]
    assert [s["id"] for s in out] == ["esc-35000001", "esc-35000005"]  # paralisada, so fundamental e especial ficam fora
    assert all(s["tipo"] == "educacao_infantil" for s in out)           # nunca "creche"
    a, b = out
    assert (a["subtipo"], a["geo"], a["lat"]) == ("municipal", "coordenada_fonte", -22.401)
    assert b["subtipo"] == "privada" and b["geo"] == "sem_local"
    assert "NAO informa se atende creche" in a["observacao"]


def test_catalogo_escolas_sem_colunas_essenciais_lista_o_que_achou():
    with pytest.raises(ValueError, match="Colunas encontradas"):
        servicos.montar(INDICE, catalogo_escolas=pd.DataFrame([{"x": "1"}]))


def test_vagas_publicas():
    import vagas
    base = {"orgao": "Prefeitura", "titulo": "Concurso X", "tipo": "concurso", "inscricoes_ate": "2026-09-01",
            "edital_url": "https://www.rioclaro.sp.gov.br/edital.pdf", "verificado_em": "2026-10-09"}
    ok = vagas.validar(pd.DataFrame([dict(base, inscricoes_de="2026-08-01")]))
    assert ok[0]["id"] == "concurso-x" and "situacao" not in ok[0]  # situacao e calculada no site
    for ruim in (dict(base, edital_url="https://www.qconcursos.com/noticia"),   # agregador
                 dict(base, edital_url="http://edital"),                         # sem https
                 dict(base, inscricoes_ate="31/08/2026"),                        # data fora do padrao
                 dict(base, inscricoes_ate="2026-02-31"),                        # data inexistente
                 dict(base, inscricoes_de="2026-10-01"),                         # de depois de ate
                 dict(base, tipo="vaga"),
                 dict(base, orgao="")):
        with pytest.raises(ValueError):
            vagas.validar(pd.DataFrame([ruim]))
    with pytest.raises(ValueError, match="repetidos"):
        vagas.validar(pd.DataFrame([base, base]))


def test_vagas_csv_real_valido():
    import vagas
    assert vagas.validar(common.ler_csv_flex(common.CATALOGO / "vagas_publicas.csv")) is not None
