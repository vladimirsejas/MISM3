"""montar_dados: diagnostico, plano e resumo, sobre uma pasta de mentira (sem tocar nos dados reais)."""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import montar_dados as md  # noqa: E402


def arvore(tmp, cnefe=False, cnes=False, inep=False, manual=2, cep_indice=False):
    (tmp / "catalogo").mkdir(parents=True)
    (tmp / "catalogo" / "servicos_manuais.csv").write_text("id,tipo\n" + "".join("m%d,mulher\n" % i for i in range(manual)), encoding="utf-8")
    (tmp / "catalogo" / "vagas_publicas.csv").write_text("id,orgao\n", encoding="utf-8")           # so cabecalho: vazio
    (tmp / "catalogo" / "mulher_para_mulher.csv").write_text("id,categoria\n", encoding="utf-8")
    if cnefe:
        (tmp / "dados" / "bruto" / "cnefe").mkdir(parents=True)
        (tmp / "dados" / "bruto" / "cnefe" / "35_Rio_Claro.zip").write_bytes(b"x")
    if cnes:
        (tmp / "docs" / "cnes").mkdir(parents=True)
        (tmp / "docs" / "cnes" / "tbEstabelecimento202608.csv").write_text("x", encoding="utf-8")
    if inep:
        (tmp / "docs").mkdir(exist_ok=True)
        (tmp / "docs" / "Análise - Tabela da lista das escolas - Detalhado.csv").write_text("x", encoding="utf-8")
    if cep_indice:
        (tmp / "web" / "dados").mkdir(parents=True, exist_ok=True)
        (tmp / "web" / "dados" / "cep_indice.json").write_text(json.dumps({"ceps": {"13500000": [0, 0, 1, "s", 1]}}), encoding="utf-8")


def por_chave(fontes):
    return {f.chave: f for f in fontes}


def test_diagnostico_acha_as_fontes_onde_os_scripts_procuram(tmp_path):
    arvore(tmp_path, cnefe=True, cnes=True, inep=True)
    f = por_chave(md.diagnosticar(tmp_path))
    assert f["cnefe"].ok and f["cnes"].ok and f["inep"].ok                        # docs/cnes e o CSV do INEP com nome acentuado
    assert not f["censo"].ok and f["manual"].ok
    assert not f["vagas"].ok and not f["m2m"].ok                                  # so cabecalho = vazio, e o diagnostico diz isso
    assert "0 cadastrados" in f["vagas"].nome and "2 servicos" in f["manual"].nome
    assert f["cnefe"].obrigatoria and not f["cnes"].obrigatoria


def test_sem_cnefe_nao_monta_servicos_e_explica_como_obter(tmp_path):
    arvore(tmp_path, cnes=True)
    plano = {s: motivo for s, _, motivo in md.planejar(md.diagnosticar(tmp_path), tmp_path)}
    assert "falta o CNEFE" in plano["indice_cep.py"] and "baixar.py cnefe" in plano["indice_cep.py"]
    assert "indice de CEP" in plano["servicos.py"]            # o site ignora servicos reais sem o indice
    assert plano["vagas.py"] == ""


def test_com_cnefe_e_cnes_monta_tudo(tmp_path):
    arvore(tmp_path, cnefe=True, cnes=True)
    assert all(motivo == "" for _, _, motivo in md.planejar(md.diagnosticar(tmp_path), tmp_path))


def test_indice_ja_existente_basta_para_os_servicos(tmp_path):
    arvore(tmp_path, cnes=True, cep_indice=True)
    plano = {s: motivo for s, _, motivo in md.planejar(md.diagnosticar(tmp_path), tmp_path)}
    assert "ja existe" in plano["indice_cep.py"] and plano["servicos.py"] == ""


def test_executar_roda_so_o_que_nao_foi_pulado_e_relata_falha(tmp_path):
    chamadas = []

    def falso(script):
        chamadas.append(script)
        return (1, "linha1\nlinha2\nERRO: algo") if script == "servicos.py" else (0, "ok")

    passos = [("indice_cep.py", "indice", "falta o CNEFE"), ("servicos.py", "servicos", ""), ("vagas.py", "vagas", "")]
    res = md.executar(passos, tmp_path, rodar=falso)
    assert chamadas == ["servicos.py", "vagas.py"]                                # o pulado nao roda
    assert res[0][1].startswith("PULADO") and res[1][1].startswith("FALHOU (codigo 1)") and "ERRO: algo" in res[1][1] and res[2][1].startswith("OK") and "ok" in res[2][1]   # etapa boa tambem mostra a saida (contagens)


def test_resumo_diz_se_o_site_esta_real_ou_em_demonstracao(tmp_path):
    arvore(tmp_path, cep_indice=True)
    assert "MODO DEMONSTRACAO" in md.resumo(tmp_path)[-1]                        # so o indice: ainda demo
    (tmp_path / "web" / "dados" / "servicos.json").write_text(json.dumps(
        {"meta": {"contagem_por_origem": {"cnes": 2}}, "servicos": [{"tipo": "saude"}, {"tipo": "saude"}]}), encoding="utf-8")
    r = md.resumo(tmp_path)
    assert any("CEPs indexados: 1" in x for x in r) and any("Servicos: 2" in x and "'saude': 2" in x for x in r)
    assert "DADOS REAIS" in r[-1]


def test_so_com_csv_de_ceps_usa_o_indice_por_csv(tmp_path):
    arvore(tmp_path, cnes=True)
    (tmp_path / "docs" / "cep_Rio_Claro").mkdir(parents=True)
    (tmp_path / "docs" / "cep_Rio_Claro" / "ceps.csv").write_text("CEP;Latitude;Longitude\n", encoding="utf-8")
    fontes = md.diagnosticar(tmp_path)
    assert por_chave(fontes)["ceps_csv"].ok and not por_chave(fontes)["ceps_csv"].obrigatoria
    plano = md.planejar(fontes, tmp_path)
    assert plano[0][0] == "indice_cep_csv.py" and plano[0][2] == ""        # roda, nao e pulado
    assert dict((s, m) for s, _, m in plano)["servicos.py"] == ""           # e os servicos reais sao montados


def test_cnefe_tem_prioridade_sobre_o_csv(tmp_path):
    arvore(tmp_path, cnefe=True, cnes=True)
    (tmp_path / "docs" / "cep_Rio_Claro").mkdir(parents=True)
    (tmp_path / "docs" / "cep_Rio_Claro" / "ceps.csv").write_text("CEP;Latitude;Longitude\n", encoding="utf-8")
    assert md.planejar(md.diagnosticar(tmp_path), tmp_path)[0][0] == "indice_cep.py"
