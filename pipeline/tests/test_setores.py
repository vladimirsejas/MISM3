import sys
import zipfile
from pathlib import Path

import pytest

shapefile = pytest.importorskip("shapefile")
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import setores  # noqa: E402


def cria_zip(tmp_path):
    base = tmp_path / "SP_setores_CD2022"
    w = shapefile.Writer(str(base), shapeType=shapefile.POLYGON)
    for nome, tipo, tam in (("CD_SETOR", "C", 15), ("CD_MUN", "C", 7), ("NM_BAIRRO", "C", 50),
                            ("SITUACAO", "C", 6)):
        w.field(nome, tipo, tam)
    w.field("v0001", "F", 15, 7)
    w.field("v0002", "F", 15, 7)
    quadrado = [[-47.56, -22.40], [-47.56, -22.39], [-47.55, -22.39], [-47.55, -22.40], [-47.56, -22.40]]  # horario
    furo = [[-47.558, -22.398], [-47.552, -22.398], [-47.552, -22.392], [-47.558, -22.392], [-47.558, -22.398]]  # anti-horario
    w.poly([quadrado, furo]); w.record("354390700000001", "3543907", "Centro", "Urbana", 1200, 400)
    w.poly([quadrado]); w.record("354390700000002", "3543907", "", "Rural", 30, 10)
    w.poly([quadrado]); w.record("330400300000001", "3304003", "Outra", "Urbana", 999, 300)  # Rio Claro/RJ-like
    w.close()
    z = tmp_path / "malha.zip"
    with zipfile.ZipFile(z, "w") as zf:
        for ext in (".shp", ".shx", ".dbf"):
            zf.write(str(base) + ext, "SP_setores_CD2022" + ext)
    return z


def test_extrai_so_o_municipio(tmp_path):
    colecao, resumo = setores.extrair(setores.abrir_leitor(cria_zip(tmp_path)))
    assert set(resumo) == {"354390700000001", "354390700000002"}
    assert len(colecao["features"]) == 2


def test_propriedades_e_bairro_vazio(tmp_path):
    _, resumo = setores.extrair(setores.abrir_leitor(cria_zip(tmp_path)))
    a, b = resumo["354390700000001"], resumo["354390700000002"]
    assert (a["bairro"], a["pessoas"], a["domicilios"], a["situacao"]) == ("Centro", 1200, 400, "Urbana")
    assert b["bairro"] is None  # setor sem bairro nao inventa nome


def test_furo_preservado(tmp_path):
    colecao, _ = setores.extrair(setores.abrir_leitor(cria_zip(tmp_path)))
    geom = colecao["features"][0]["geometry"]
    assert geom["type"] == "MultiPolygon" and len(geom["coordinates"]) == 1
    assert len(geom["coordinates"][0]) == 2  # externo + furo


def test_municipio_inexistente(tmp_path):
    with pytest.raises(ValueError):
        setores.extrair(setores.abrir_leitor(cria_zip(tmp_path)), municipio="9999999")


def test_simplificar_mantem_extremos_e_reduz():
    reta = [(0.0, 0.0), (0.5, 0.000001), (1.0, 0.0), (1.5, 0.000001), (2.0, 0.0)]
    s = setores.simplificar(reta, tol=0.0001)
    assert s[0] == reta[0] and s[-1] == reta[-1] and len(s) < len(reta)
    quina = [(0, 0), (1, 0), (1, 1), (2, 1), (2, 2)]
    assert setores.simplificar(quina, tol=0.0001) == quina  # curvas reais ficam
