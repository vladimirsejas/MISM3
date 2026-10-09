import sys
from pathlib import Path

import pytest

pd = pytest.importorskip("pandas")
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import cnes  # noqa: E402

CAB_ESTAB = ["CO_UNIDADE", "CO_CNES", "NO_FANTASIA", "NO_LOGRADOURO", "NU_ENDERECO", "NO_BAIRRO", "CO_CEP",
             "NU_TELEFONE", "NU_CPF", "CO_NATUREZA_JUR", "CO_TIPO_UNIDADE", "CO_MUNICIPIO_GESTOR",
             "NU_LATITUDE", "NU_LONGITUDE", "CO_MOTIVO_DESAB", "CO_TURNO_ATENDIMENTO", "CO_CPFDIRETORCLN",
             "TP_UNIDADE", "CO_TIPO_ESTABELECIMENTO"]
INDICE = {"13500001": [-22.40, -47.56, 200, "s", 10], "13500002": [-22.41, -47.57, 200, "s", 10]}


def linha(unid, cnes_, nome, cep, nat, tipo, gestor, lat="", lon="", motivo="", turno="3", cpf="", fone="1935220000"):
    # como nos dados reais: CO_TIPO_UNIDADE vem VAZIO e o tipo esta em TP_UNIDADE
    return [unid, cnes_, nome, "RUA A", "10", "CENTRO", cep, fone, cpf, nat, "", gestor,
            lat, lon, motivo, turno, cpf, tipo, ""]


def grava(pasta, linhas):
    with open(pasta / "tbEstabelecimento202608.csv", "w", encoding="latin-1", newline="") as f:
        f.write(";".join(CAB_ESTAB) + "\n")
        for l in linhas:
            f.write(";".join(l) + "\n")
    (pasta / "tbTipoUnidade202608.csv").write_text("CO_TIPO_UNIDADE;DS_TIPO_UNIDADE\n2;CENTRO DE SAUDE/UNIDADE BASICA\n73;PRONTO ATENDIMENTO\n36;CLINICA/CENTRO DE ESPECIALIDADE\n", encoding="latin-1")
    (pasta / "tbTurnoAtendimento202608.csv").write_text("CO_TURNO_ATENDIMENTO;DS_TURNO_ATENDIMENTO\n3;TURNOS DA MANHA E TARDE\n", encoding="latin-1")


@pytest.fixture
def pasta(tmp_path):
    grava(tmp_path, [
        linha("1", "1001", "UBS JARDIM ÁGUA", "13500001", "1244", "02", "354390", lat="-22,4011", lon="-47,5599"),
        linha("2", "1002", "PRONTO ATENDIMENTO", "13500002", "1244", "73", "354390", fone=""),  # telefone em branco
        linha("3", "1003", "CLINICA PRIVADA LTDA", "13500001", "2062", "36", "354390"),          # privada: fora
        linha("4", "1004", "CONSULTORIO DR FULANO", "13500001", "9999", "36", "354390", cpf="12345678900"),  # pessoa fisica: fora
        linha("5", "1005", "UBS DESATIVADA", "13500001", "1244", "02", "354390", motivo="5"),       # inativa: fora
        linha("6", "1006", "UBS OUTRA CIDADE", "27000000", "1244", "02", "330455"),                # outro municipio: fora
        linha("7", "1007", "HOSPITAL ESTADUAL EM RIO CLARO", "13500002", "1023", "02", "350000"),  # gestor estadual, mas CEP local: entra
    ])
    return tmp_path


def test_filtra_municipio_natureza_e_inativos(pasta):
    servs, cont = cnes.carregar(pasta, INDICE, "2026-10-08")
    nomes = sorted(s["nome"] for s in servs)
    assert nomes == ["Hospital Estadual Em Rio Claro", "Pronto Atendimento", "Ubs Jardim Água"]
    assert cont["marcados_desabilitados"] == 1


def test_campos_e_localizacao(pasta):
    servs, _ = cnes.carregar(pasta, INDICE, "2026-10-08")
    por = {s["id"]: s for s in servs}
    ubs = por["cnes-1001"]
    assert ubs["subtipo"] == "ubs" and ubs["geo"] == "coordenada_fonte" and ubs["lat"] == -22.4011
    assert "MANHA" in ubs["horario"].upper()
    assert por["cnes-1002"]["subtipo"] == "urgencia" and por["cnes-1002"]["geo"] == "centroide_cep"


def test_nunca_carrega_cpf(pasta):
    df = cnes.ler_estabelecimentos(pasta / "tbEstabelecimento202608.csv", set(INDICE))
    assert "NU_CPF" not in df.columns and "CO_CPFDIRETORCLN" not in df.columns
    assert "12345678900" not in df.to_csv()


def test_sem_indice_usa_so_gestor(pasta):
    servs, _ = cnes.carregar(pasta, {}, "2026-10-08")
    assert "Hospital Estadual Em Rio Claro" not in [s["nome"] for s in servs]


def test_tabela_ausente(tmp_path):
    with pytest.raises(FileNotFoundError):
        cnes.carregar(tmp_path, INDICE, "x")


def test_tipo_vem_de_tp_unidade_e_zero_a_esquerda(pasta):
    # TP_UNIDADE="02" deve casar com a tabela que tem "2"
    servs, _ = cnes.carregar(pasta, INDICE, "2026-10-08")
    por = {s["id"]: s for s in servs}
    assert por["cnes-1001"]["subtipo"] == "ubs"
    assert por["cnes-1002"]["subtipo"] == "urgencia"


def test_campos_em_branco_nao_quebram(pasta):
    servs, _ = cnes.carregar(pasta, INDICE, "2026-10-08")
    pa = {s["id"]: s for s in servs}["cnes-1002"]
    assert pa["telefone"] is None and pa["lat"] is not None  # sem telefone, mas localizado pelo CEP


def test_fallback_tipo_estabelecimento(tmp_path):
    grava(tmp_path, [linha("1", "1001", "UNIDADE X", "13500001", "1244", "", "354390")])
    # tipo vazio em TP_UNIDADE: cai para CO_TIPO_ESTABELECIMENTO
    import re
    arq = tmp_path / "tbEstabelecimento202608.csv"
    txt = arq.read_text(encoding="latin-1").splitlines()
    txt[1] = txt[1].rsplit(";", 1)[0] + ";36"
    arq.write_text("\n".join(txt) + "\n", encoding="latin-1")
    (tmp_path / "tbTipoEstabelecimento202608.csv").write_text(
        "CO_TIPO_ESTABELECIMENTO;DS_TIPO_ESTABELECIMENTO;DS_CONCEITO_TIPO\n36;POLICLINICA;x\n", encoding="latin-1")
    servs, _ = cnes.carregar(tmp_path, INDICE, "2026-10-08")
    assert servs[0]["subtipo"] == "especialidades"
