"""Testes do adaptador reproducao/conjunto_v1.py (Etapa A). NENHUM teste executa o sistema sobre o conjunto congelado:
só usam respostas inventadas à mão, o gabarito (sem saída de sistema) e itens sintéticos que não pertencem ao conjunto.

Uso, da raiz do repositório:  python -m pytest reproducao/teste_conjunto_v1.py -q
"""
import subprocess
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
import conjunto_v1 as cv  # noqa: E402


@pytest.fixture(scope="module")
def ind():
    return cv.Indice()


def item(id_, perigo="Não", acao="Responder", ids=(), tipo=""):
    return {"id": id_, "frase": "texto inventado", "area": "x", "codigos": "", "perigo": perigo if not tipo else f"Sim ({tipo})",
            "acao": acao, "codigos_lista": [], "ids_oficiais": list(ids)}


def resp(itens=(), abstem=False, perigo=False, nivel=0, tipos=(), geral=False):
    return {"id": "", "perigo": perigo, "nivel": nivel, "tipos": list(tipos), "abstem": abstem, "geral": geral, "saudacao": False, "melhor": None,
            "itens": list(itens)}


def test_sha256_normaliza_fim_de_linha():
    assert cv.sha256_bytes(b"a\r\nb\r\n") == cv.sha256_bytes(b"a\nb\n")


def test_conjunto_confere_hash_e_denominadores_do_gabarito():
    assert cv.sha256_do_conjunto() == cv.SHA256_ESPERADO
    ind = cv.Indice()
    qs = [cv.converter_item(i, ind) for i in cv.carregar_conjunto()]
    assert len(qs) == 190
    assert sum(1 for q in qs if q["acao"] == "Responder") == 140 and sum(1 for q in qs if q["fora_de_escopo"]) == 30
    assert sum(1 for q in qs if q["perigo"]) == 90 and sum(1 for q in qs if not q["perigo"]) == 100
    assert sum(1 for q in qs if q["especificos"]) == 140
    assert all(not q["especificos"] and not q["areas"] for q in qs if q["acao"] != "Responder")
    assert {q["id"] for q in qs} >= set(cv.EXCLUIDOS_SENSIBILIDADE)


def test_chave_do_indice_recupera_o_id_de_toda_unidade(ind):
    for uid, u in ind.unidades.items():
        assert ind.id_do_item({"area": u["area"], "sec": u.get("sec"), "svc": u.get("svc"), "titulo": u["titulo"]}) == uid


def test_conversao_classe_vira_svc_e_servico_vira_id(ind):
    q = cv.converter_item(item("T-1", ids=["classe-saude-ubs", "man-secretaria-mulher"]), ind)
    assert q["especificos"] == ["svc:saude/ubs", "id:man-secretaria-mulher"]
    assert q["areas"] == ["area:saude", "area:direitos"]
    assert cv.casa_v1({"svc": "saude/ubs", "id": "outro"}, "svc:saude/ubs")
    assert cv.casa_v1({"id": "man-secretaria-mulher"}, "id:man-secretaria-mulher")
    assert not cv.casa_v1({"id": "outro", "svc": "x"}, "id:man-secretaria-mulher")


def test_conversao_recusa_valores_inesperados(ind):
    with pytest.raises(ValueError):
        cv.converter_item(item("T-2", acao="Talvez"), ind)
    with pytest.raises(ValueError):
        cv.converter_item(item("T-3", ids=["id-que-nao-existe"]), ind)


def test_perigo_comeca_com_sim_e_tipo_e_descritivo(ind):
    q = cv.converter_item(item("T-4", tipo="Suicídio"), ind)
    assert q["perigo"] is True and q["perigo_tipo"] == "Suicídio"
    assert cv.converter_item(item("T-5"), ind)["perigo"] is False


def test_calculo_com_respostas_inventadas(ind):
    ids = {"a": "man-secretaria-mulher", "b": "classe-saude-ubs"}
    qs = [cv.converter_item(i, ind) for i in [
        item("Q1", ids=[ids["a"]]),                               # acerto específico na 2ª posição
        item("Q2", ids=[ids["b"]]),                               # acerto por classe (svc), 1ª posição
        item("Q3", ids=[ids["a"]]),                               # erro: o esperado só aparece na 4ª posição
        item("Q4", acao="Recusar"),                               # abstenção correta
        item("Q5", acao="Pedir esclarec."),                       # vaga, negativa
        item("Q6", tipo="Violência", ids=[ids["a"]]),             # perigo detectado, nível 2
        item("Q7", tipo="Criança", ids=[ids["a"]]),               # perigo não detectado
        item("Q8", acao="Recusar"),                               # abstenção correta falhou (mostra item)
    ]]
    outro = {"id": "x", "area": "mapa", "sec": None, "svc": None, "titulo": "t"}
    certo = {"id": ids["a"], "area": "direitos", "sec": "s", "svc": "mulher/secretaria", "titulo": "t1"}
    ubs = {"id": "u", "area": "saude", "sec": None, "svc": "saude/ubs", "titulo": "t2"}
    r = {
        "Q1": resp([outro, certo]), "Q2": resp([ubs]), "Q3": resp([outro, outro, outro, certo]), "Q4": resp(abstem=True),
        "Q5": resp(abstem=True), "Q6": resp([certo], perigo=True, nivel=2, tipos=["violencia"]), "Q7": resp([certo]), "Q8": resp([outro]),
    }
    m = cv.calcular(qs, r, cv.casa_v1, perigo_inclui_fora=True)
    assert (m["escopo_total"], m["respondida"], m["indevida"]) == (5, 5, 0)
    assert (m["spec_total"], m["spec_hit"]) == (5, 4) and (m["area_total"], m["area_hit"]) == (5, 4)
    assert abs(sum(m["rr"]) - (0.5 + 1 + 0.25 + 1 + 1)) < 1e-9
    assert (m["fora_total"], m["fora_abstida"]) == (2, 1)
    assert (m["vaga_total"], m["vaga_abstida"]) == (1, 1)
    assert (m["perigo_total"], m["perigo_ok"]) == (2, 1)
    assert (m["nao_perigo_total"], m["falso_alarme"]) == (6, 0)  # nenhuma negativa teve r["perigo"] verdadeiro nas respostas inventadas
    assert m["nao_perigo_sem_vagas_total"] == 5
    assert m["nivel_positivas"] == {2: 1, 0: 1}
    assert m["revocacao_por_tipo"] == {"Violência": (1, 1), "Criança": (0, 1)}
    assert m["confusao"] == {"direitos|direitos": 2, "direitos|mapa": 2, "saude|saude": 1}  # Q6 e Q7 acertam no 1º item; Q1 e Q3 têm o 1º item em "mapa"


def test_falso_alarme_conta_so_perigo_verdadeiro_na_saida(ind):
    qs = [cv.converter_item(i, ind) for i in [item("N1"), item("N2", acao="Pedir esclarec."), item("N3", acao="Recusar")]]
    r = {"N1": resp(perigo=True, nivel=1), "N2": resp(perigo=True, nivel=2), "N3": resp()}
    m = cv.calcular(qs, r, cv.casa_v1, perigo_inclui_fora=True)
    assert (m["nao_perigo_total"], m["falso_alarme"]) == (3, 2)
    assert (m["nao_perigo_sem_vagas_total"], m["falso_alarme_sem_vagas"]) == (2, 1)


def test_bootstrap_pareado_e_deterministico_e_zero_para_vetores_iguais():
    v = [1.0, 0.0, 1.0, 1.0, 0.0, 1.0]
    a = cv.bootstrap_pareado({"completo": v, "outra": list(v)}, "completo", reamostragens=500)
    assert a["outra"]["dif_vs_ref"] == 0 and a["outra"]["dif_ic"] == (0.0, 0.0)
    b = cv.bootstrap_pareado({"completo": v, "outra": [0.0] * 6}, "completo", reamostragens=500)
    c = cv.bootstrap_pareado({"completo": v, "outra": [0.0] * 6}, "completo", reamostragens=500)
    assert b == c and b["outra"]["dif_vs_ref"] < 0 and b["outra"]["dif_ic"][1] < 0


def test_criterios_mecanicos():
    res = {"completo": {"perigo_ok": 90, "perigo_total": 100, "falso_alarme": 4, "nao_perigo_total": 100, "indevida": 15, "escopo_total": 100},
           "outra": {"perigo_ok": 95, "perigo_total": 100}}
    cr = cv.avaliar_criterios(res, {"dif_vs_ref": 0.05, "dif_ic": (0.01, 0.09)})
    assert cr["1_ok"] and cr["2_ok"] and cr["3_ok"] and cr["4_ok"] and cr["5_ok"] and cr["todos_ok"]
    assert not cv.avaliar_criterios(res, {"dif_vs_ref": 0.049, "dif_ic": (0.01, 0.09)})["1_ok"]
    assert not cv.avaliar_criterios(res, {"dif_vs_ref": 0.06, "dif_ic": (0.0, 0.09)})["2_ok"]
    res["completo"]["perigo_ok"] = 89
    assert not cv.avaliar_criterios(res, {"dif_vs_ref": 0.06, "dif_ic": (0.01, 0.09)})["3_ok"]


def test_etapa_b_recusa_sem_confirmacao_e_nao_cria_resultados():
    pasta = cv.RAIZ / "reproducao" / "resultados" / "conjunto_v1"
    antes = pasta.exists()
    assert cv.main(["--etapa-b"]) == 2
    assert pasta.exists() == antes


def test_script_nao_importa_nada_que_execute_o_conjunto_ao_importar():
    r = subprocess.run([sys.executable, "-c", "import sys; sys.path.insert(0, 'reproducao'); import conjunto_v1"], capture_output=True, text=True, cwd=cv.RAIZ)
    assert r.returncode == 0 and r.stdout == ""


def test_ids_oficiais_como_texto_de_lista_python_e_como_lista_json(ind):
    assert cv.lista_de_ids("['man-secretaria-mulher', 'classe-saude-ubs']") == ["man-secretaria-mulher", "classe-saude-ubs"]
    assert cv.lista_de_ids("[]") == [] and cv.lista_de_ids(["a", "b"]) == ["a", "b"]
    with pytest.raises(ValueError):
        cv.lista_de_ids("[1, 2]")
    with pytest.raises(ValueError):
        cv.lista_de_ids("__import__('os').getcwd()")  # literal_eval recusa expressões
    texto = dict(item("T-9", ids=["man-secretaria-mulher"]), ids_oficiais="['man-secretaria-mulher']")
    assert cv.converter_item(texto, ind)["especificos"] == ["id:man-secretaria-mulher"]


def test_arquivo_congelado_traz_ids_oficiais_como_lista_json():
    assert all(isinstance(i["ids_oficiais"], list) for i in cv.carregar_conjunto())


def test_mapeamento_das_condicoes_do_protocolo():
    por_n = {n: cod for n, _, cod, _ in cv.MAPEAMENTO}
    assert por_n == {1: "completo", 2: "sem_regras_lexicais_necessidade", 3: "sem_ngramas_letras", 4: "sem_lsa", 5: "apenas_regras",
                     6: "sem_perigo_aprendido", 7: "sem_escopo", 8: None, 9: None, 10: "linha_de_base_tfidf"}
    sit = {n: s for n, _, _, s in cv.MAPEAMENTO}
    assert sit[8].startswith("NÃO VERIFICADO") and sit[9].startswith("NÃO VERIFICADO")
    assert set(cv.ROTULO_PROTOCOLO) == set(cv.CONDICOES)
    assert cv.ROTULO_PROTOCOLO["sem_palavras"] == "exploratória, fora do protocolo"
    assert "sem_palavras" not in por_n.values()  # fora dos critérios de sucesso: estes só usam completo e a linha de base


def test_criterios_usam_so_completo_e_linha_de_base():
    import inspect
    fonte = inspect.getsource(cv.avaliar_criterios) + inspect.getsource(cv.analisar)
    assert "sem_palavras" not in fonte and "BASE_LEXICAL" in fonte
