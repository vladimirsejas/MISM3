"""Auditoria de privacidade do mapa territorial: precisa passar no arquivo real e REPROVAR dados fictícios com padrões proibidos."""
import copy
import json
from pathlib import Path

import pytest

import territorial_auditoria as aud

RAIZ = Path(__file__).resolve().parents[2]
ARQUIVO = RAIZ / "web" / "dados" / "indicadores_territoriais.json"


@pytest.fixture()
def real():
    return json.loads(ARQUIVO.read_text(encoding="utf-8"))


def tipos(falhas):
    return {f.tipo for f in falhas}


def test_passa_no_arquivo_real(real):
    assert aud.auditar(real) == []


def test_o_cli_passa_no_real_e_reprova_no_plantado(tmp_path, real, capsys):
    assert aud.main([str(ARQUIVO)]) == 0
    plantado = copy.deepcopy(real)
    plantado["setores"][0]["bairro"] = "13500-040"
    arq = tmp_path / "plantado.json"
    arq.write_text(json.dumps(plantado, ensure_ascii=False), encoding="utf-8")
    rel = tmp_path / "relatorio.md"
    assert aud.main([str(arq), "--relatorio", str(rel)]) == 1
    saida = capsys.readouterr().out
    assert "REPROVADA" in saida and "13500-040" not in saida
    assert "REPROVADA" in rel.read_text(encoding="utf-8")


@pytest.mark.parametrize("campo,valor,esperado", [
    ("cpf", "x", "campo proibido"),
    ("endereco_residencial", "x", "campo proibido"),
    ("telefone", "x", "campo proibido"),
    ("paciente", "x", "campo proibido"),
    ("campo_novo_qualquer", "x", "campo fora do esquema"),
])
def test_reprova_nome_de_campo_proibido_ou_fora_do_esquema(real, campo, valor, esperado):
    real["setores"][0][campo] = valor
    assert esperado in tipos(aud.auditar(real))


@pytest.mark.parametrize("texto,rotulo", [
    ("123.456.789-09", "CPF"),
    ("12345678909", "CPF (11 dígitos)"),
    ("13500-040", "CEP"),
    ("13500040", "CEP (8 dígitos)"),
    ("maria@exemplo.com", "e-mail"),
    ("(19) 3522-1905", "telefone"),
    ("Rua das Flores, 123", "endereço de logradouro"),
])
def test_reprova_padrao_de_conteudo_em_qualquer_valor(real, texto, rotulo):
    real["meta"]["fonte"] = "Fonte pública " + texto
    falhas = aud.auditar(real)
    assert any(f.tipo == "conteúdo" and rotulo in f.mensagem for f in falhas), [str(f) for f in falhas]
    assert all(texto not in str(f) for f in falhas), "o relatório não pode repetir o valor suspeito"


def test_reprova_numero_com_oito_digitos_ou_mais(real):
    real["setores"][3]["pessoas"] = 13500040
    assert "conteúdo" in tipos(aud.auditar(real))


def test_reprova_nome_de_pessoa_no_lugar_do_nome_de_equipamento(real):
    real["equipamentos"][0]["nome"] = "Maria Aparecida da Silva"
    falhas = aud.auditar(real)
    assert any(f.tipo == "nome" and f.caminho == "equipamentos/0/nome" for f in falhas)
    assert all("Maria" not in str(f) for f in falhas)


def test_reprova_bairro_que_nao_esta_na_malha(real):
    real["setores"][0]["bairro"] = "Casa da Joana"
    assert "nome" in tipos(aud.auditar(real))


def test_cep_so_vale_no_contexto_de_equipamento(real):
    real["equipamentos"][0]["cep_institucional"] = "13500-040"
    assert aud.auditar(real) == [], "CEP cadastral do próprio equipamento público é o contexto permitido (decisão D2)"
    real["setores"][0]["cep_institucional"] = "13500-040"
    assert any("cep_institucional" in f.caminho and f.caminho.startswith("setores") for f in aud.auditar(real))


def test_reprova_posicao_de_equipamento_sem_rotulo_ou_pendente_com_coordenada(real):
    real["equipamentos"][0]["precisao"] = "exata"
    assert "proveniência" in tipos(aud.auditar(real))
    outro = copy.deepcopy(real)
    outro["equipamentos"][0]["precisao"] = "pendente"
    assert any(f.tipo == "proveniência" and "pendente" in f.mensagem for f in aud.auditar(outro))


def test_hash_so_e_dispensado_quando_o_valor_inteiro_e_hash_e_no_campo_de_hash(real):
    real["meta"]["carimbo"] = "12345678abcdef90"
    real["meta"]["entradas_sha256"]["setores.geojson"] = "12345678" + "ab" * 28
    assert aud.auditar(real) == []
    real["meta"]["metodo"] = "12345678"
    assert "conteúdo" in tipos(aud.auditar(real))
    real["meta"]["metodo"] = "texto"
    real["meta"]["entradas_sha256"]["setores.geojson"] = "13500040"
    assert "conteúdo" in tipos(aud.auditar(real))


def test_setores_pequenos_sao_listados_sem_suprimir_nada(real):
    peq = aud.setores_pequenos(real)
    assert set(peq) == {"conservadora", "intermediária", "ampliada"}
    assert set(peq["conservadora"]) <= set(peq["intermediária"]) <= set(peq["ampliada"])
    assert all(len(v) == len(set(v)) for v in peq.values()) and all(v == sorted(v) for v in peq.values())
    pessoas = {s["id"]: s for s in real["setores"]}
    assert all(pessoas[i]["pessoas"] < 20 or pessoas[i]["domicilios"] < 10 for i in peq["ampliada"])
    assert len(real["setores"]) == 408, "nenhum setor foi suprimido ou agregado"
    texto = aud.relatorio(real, [])
    assert "decisão do autor" in texto and "não suprime nem agrega nenhum setor" in texto

def test_nao_aceita_raio_zero_quando_a_proveniencia_nao_esta_registrada(real):
    equipamento = next(e for e in real["equipamentos"] if e["categoria"] in {"cras", "ubs"} and e["confianca_localizacao"] == "nao_registrada")
    equipamento["raio_incerteza_m"] = 0
    falhas = aud.auditar(real)
    assert any(f.caminho.endswith("/raio_incerteza_m") and f.tipo == "proveniência" for f in falhas)


def test_nao_publica_envelope_se_ha_equipamento_sem_raio_conhecido(real):
    setor = real["setores"][0]
    setor["distancia_min_km"]["com_centro_do_cep"]["cras"] = 0
    setor["distancia_max_km"]["com_centro_do_cep"]["cras"] = 0.1
    falhas = aud.auditar(real)
    assert any("não publicar envelope" in f.mensagem for f in falhas)
