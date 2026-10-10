import csv
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import institucional  # noqa: E402

RAIZ = Path(__file__).resolve().parents[2]


def unidade(**kw):
    base = {"id": "u1", "tipo": "saude", "subtipo": "ubs", "nome": "UBS Teste", "endereco": "Rua 1", "telefone": "(19) 3000-0000",
            "horario": "", "bairro": "Centro", "bairros": "Jd. A;Jd. B", "observacao": "", "divergencia": "",
            "fonte_url": "https://exemplo.gov.br/x", "verificado_em": "2026-10-09"}
    base.update(kw)
    return base


def canal(**kw):
    base = {"id": "c1", "grupo": "secretaria", "nome": "Secretaria X", "temas": "mulher;saude", "url": "https://exemplo.gov.br/",
            "situacao": "conferido", "verificado_em": "2026-10-09", "descricao": "", "observacao": ""}
    base.update(kw)
    return base


def test_unidade_valida_e_bairros_viram_lista():
    u = institucional.validar_unidades([unidade()])[0]
    assert u["bairros"] == ["Jd. A", "Jd. B"] and u["bairro"] == "Centro"


def test_ignora_linhas_que_nao_sao_saude():
    assert institucional.validar_unidades([unidade(tipo="creche"), unidade(id="u2")]) == institucional.validar_unidades([unidade(id="u2")])


@pytest.mark.parametrize("campo,valor", [
    ("fonte_url", "http://sem-https.gov.br/"), ("fonte_url", ""), ("fonte_url", "rioclaro.sp.gov.br"),
    ("verificado_em", ""), ("verificado_em", "2026-02-31"), ("verificado_em", "09/10/2026"),
    ("subtipo", "hospital-inventado"), ("id", ""),
])
def test_unidade_invalida_e_recusada(campo, valor):
    with pytest.raises(ValueError):
        institucional.validar_unidades([unidade(**{campo: valor})])


def test_id_repetido_e_recusado():
    with pytest.raises(ValueError):
        institucional.validar_unidades([unidade(), unidade()])


def test_canal_valido():
    c = institucional.validar_canais([canal()])[0]
    assert c["temas"] == ["mulher", "saude"] and c["situacao"] == "conferido"


@pytest.mark.parametrize("kw", [
    {"grupo": "outro"}, {"temas": ""}, {"temas": "mulher;inventado"}, {"situacao": "ok"},
    {"url": "http://x.gov.br"}, {"situacao": "conferido", "verificado_em": ""},
    {"situacao": "listado", "verificado_em": "2026-10-09"},  # listado nao pode fingir que foi conferido
])
def test_canal_invalido_e_recusado(kw):
    with pytest.raises(ValueError):
        institucional.validar_canais([canal(**kw)])


def test_canal_listado_sem_data_e_aceito():
    c = institucional.validar_canais([canal(situacao="listado", verificado_em="")])[0]
    assert c["verificado_em"] == ""


# ---- o catalogo REAL do repositorio tem que continuar valido
def test_catalogo_real_valido_e_completo():
    d = institucional.montar(hoje="2026-10-10")
    assert d["meta"]["contagem"]["unidades_saude"] >= 15
    ids = {u["id"] for u in d["saude"]}
    assert {"municipal-urgencia-nsl", "municipal-usf-guanabara", "municipal-ubs-wenzel"} <= ids


def test_toda_ubs_de_bairro_informa_bairros_atendidos():
    for u in institucional.montar(hoje="2026-10-10")["saude"]:
        if u["subtipo"] == "ubs":
            assert u["bairros"], "UBS sem bairros atendidos: %s" % u["nome"]


def test_urgencia_24h_tem_telefone_e_horario():
    for u in institucional.montar(hoje="2026-10-10")["saude"]:
        if u["subtipo"] == "urgencia":
            assert u["telefone"] and u["horario"], u["nome"]


def test_divergencias_conhecidas_estao_registradas():
    por_id = {u["id"]: u for u in institucional.montar(hoje="2026-10-10")["saude"]}
    assert "3527-2908" in por_id["municipal-ubs-vila-cristina"]["divergencia"]
    assert por_id["municipal-ubs-wenzel"]["divergencia"]
    assert por_id["municipal-ubs-ferraz"]["divergencia"] and por_id["municipal-usf-ferraz"]["divergencia"]


def test_contagem_de_bairros_bate_com_o_guia_oficial():
    esperado = {"municipal-ubs-chervezon": 14, "municipal-ubs-wenzel": 10, "municipal-ubs-29": 18,
                "municipal-ubs-vila-cristina": 9, "municipal-ubs-palmeiras": 6, "municipal-ubs-boa-vista": 4}
    por_id = {u["id"]: u for u in institucional.montar(hoje="2026-10-10")["saude"]}
    for k, n in esperado.items():
        assert len(por_id[k]["bairros"]) == n, k


def test_secretarias_conferidas_e_listadas_nao_se_misturam():
    canais = institucional.montar(hoje="2026-10-10")["canais"]
    assert all(bool(c["verificado_em"]) == (c["situacao"] == "conferido") for c in canais)
    assert {c["grupo"] for c in canais} == set(institucional.GRUPOS)


def test_csv_manual_continua_aceito_pelo_pipeline_de_servicos():
    import pandas as pd
    import servicos
    df = pd.read_csv(RAIZ / "catalogo" / "servicos_manuais.csv", dtype=str)
    itens = servicos.servicos_manuais(df, {})
    wenzel = next(i for i in itens if i["id"] == "municipal-ubs-wenzel")
    assert wenzel["bairro"] == "Wenzel" and "Jd. Wenzel" in wenzel["bairros"] and wenzel["divergencia"]
    assert all("bairros" not in i for i in itens if i["id"] == "municipal-upa-av29")
