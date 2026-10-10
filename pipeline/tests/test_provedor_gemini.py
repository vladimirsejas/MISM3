"""Provedor Gemini: tudo testado com respostas FALSAS no formato do google-genai (sem chave, sem rede)."""
import os
import sys
from pathlib import Path
from types import SimpleNamespace as NS

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import provedor_gemini as pg  # noqa: E402
import servidor  # noqa: E402


def resposta(chunks=(), apoios=(), texto="texto livre do modelo"):
    meta = NS(grounding_chunks=[NS(web=NS(uri=u, title=t)) for u, t in chunks],
              grounding_supports=[NS(segment=NS(text=s), grounding_chunk_indices=i) for s, i in apoios])
    return NS(candidates=[NS(grounding_metadata=meta)], text=texto)


def test_converte_fontes_em_resultados_com_descricao_sustentada():
    r = resposta(chunks=[("https://rioclaro.sp.gov.br/pat", "rioclaro.sp.gov.br"), ("https://www.trampolim.sp.gov.br/", "trampolim.sp.gov.br"),
                         ("https://rioclaro.sp.gov.br/pat", "rioclaro.sp.gov.br")],
                 apoios=[("O PAT atende na Unidade Cervezão.", [0]), ("Há cursos gratuitos.", [1]), ("Ligue antes de ir.", [0, 1])])
    out = pg.converter(r, hoje="2026-10-10")
    assert [x["url"] for x in out["resultados"]] == ["https://rioclaro.sp.gov.br/pat", "https://www.trampolim.sp.gov.br/"]  # sem duplicata
    assert out["resultados"][0]["descricao"] == "O PAT atende na Unidade Cervezão. Ligue antes de ir."
    assert out["resultados"][1]["descricao"] == "Há cursos gratuitos. Ligue antes de ir."
    assert all(x["consultado_em"] == "2026-10-10" and x["fonte"] for x in out["resultados"])
    assert out["necessidades"] == []


def test_sem_fonte_nao_ha_resultado_mesmo_com_texto_do_modelo():
    """Regra central: o que o modelo escreveu SEM fonte da busca e descartado (nada inventado)."""
    assert pg.converter(NS(candidates=[NS(grounding_metadata=None)], text="O PAT abre as 8h")) == {"necessidades": [], "resultados": []}
    assert pg.converter(NS(candidates=[], text="x")) == {"necessidades": [], "resultados": []}
    assert pg.converter(resposta(chunks=[], texto="inventei isto"))["resultados"] == []


def test_fonte_sem_link_e_ignorada_e_titulo_cai_para_o_dominio():
    r = resposta(chunks=[(None, "sem-link.com"), ("https://www.defensoria.sp.def.br/x", None)])
    out = pg.converter(r)["resultados"]
    assert len(out) == 1 and out[0]["titulo"] == "defensoria.sp.def.br" and out[0]["url"].startswith("https://")


def test_no_maximo_10_resultados():
    r = resposta(chunks=[("https://s%d.gov.br/" % i, "s%d" % i) for i in range(25)])
    assert len(pg.converter(r)["resultados"]) == 10


def test_pesquisar_monta_o_pedido_com_as_regras_de_nao_inventar(monkeypatch):
    monkeypatch.setattr(pg, "_configuracao", lambda: "CONFIG")
    chamadas = {}

    class Cliente:
        class models:  # noqa: N801
            @staticmethod
            def generate_content(model, contents, config):
                chamadas.update(model=model, contents=contents, config=config)
                return resposta(chunks=[("https://rioclaro.sp.gov.br/x", "rioclaro.sp.gov.br")])

    out = pg.pesquisar("preciso de creche " + "x" * 500, {"cep": "13500000"}, cliente=Cliente)
    assert chamadas["model"] == pg.MODELO and chamadas["config"] == "CONFIG"
    c = chamadas["contents"]
    assert "Rio Claro" in c and "3543907" in c and "Rio de Janeiro" in c      # desambigua o Rio Claro do RJ
    assert "Não invente" in c and "aconselhamento médico nem jurídico" in c    # regras
    assert len(c.split("PEDIDO: ")[1].strip()) <= 300                         # frase cortada em 300
    assert out["resultados"][0]["url"] == "https://rioclaro.sp.gov.br/x"


def test_sem_chave_o_erro_nao_vaza_nada(monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    with pytest.raises(RuntimeError, match="GEMINI_API_KEY"):
        pg.pesquisar("x")


def test_env_carrega_nomes_sem_sobrescrever_e_sem_devolver_valores(tmp_path, monkeypatch):
    env = tmp_path / ".env"
    env.write_text('# comentario\n\nGEMINI_API_KEY="valor-secreto"\nMISM3_PROVEDOR=gemini\nJA_EXISTE=do-arquivo\nsem_igual\n', encoding="utf-8")
    for k in ("GEMINI_API_KEY", "MISM3_PROVEDOR"):
        monkeypatch.delenv(k, raising=False)
    monkeypatch.setenv("JA_EXISTE", "do-ambiente")
    nomes = servidor.carregar_env(env)
    assert sorted(nomes) == ["GEMINI_API_KEY", "MISM3_PROVEDOR"]
    assert "valor-secreto" not in " ".join(nomes)                    # so nomes: valores nunca vao para log
    assert os.environ["GEMINI_API_KEY"] == "valor-secreto" and os.environ["JA_EXISTE"] == "do-ambiente"
    assert servidor.carregar_env(tmp_path / "nao_existe") == []
    for k in ("GEMINI_API_KEY", "MISM3_PROVEDOR"):
        monkeypatch.delenv(k, raising=False)


def test_provedor_gemini_e_escolhido_pela_variavel(monkeypatch):
    if (Path(servidor.__file__).parent / "provedor_pesquisa.py").exists():
        pytest.skip("existe um provedor_pesquisa.py local, que tem prioridade")
    monkeypatch.delenv("MISM3_PROVEDOR", raising=False)
    assert servidor.carregar_provedor() is None
    monkeypatch.setenv("MISM3_PROVEDOR", "gemini")
    mod = servidor.carregar_provedor()
    assert mod is not None and mod.NOME == "Google (Gemini)" and callable(mod.pesquisar)


def test_provedor_sem_chave_fica_desligado_com_aviso(monkeypatch, capsys):
    """Cenario real: .env ja tem MISM3_PROVEDOR=gemini, mas a chave ainda nao foi colocada."""
    if (Path(servidor.__file__).parent / "provedor_pesquisa.py").exists():
        pytest.skip("existe um provedor_pesquisa.py local")
    monkeypatch.setenv("MISM3_PROVEDOR", "gemini")
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    assert servidor.provedor_se_pronto(servidor.carregar_provedor()) is None
    assert "Pesquisa real DESLIGADA" in capsys.readouterr().out
    monkeypatch.setenv("GEMINI_API_KEY", "qualquer")
    assert servidor.provedor_se_pronto(servidor.carregar_provedor()).NOME == "Google (Gemini)"
    assert servidor.provedor_se_pronto(None) is None
    um_sem_pronto = NS(NOME="x")   # provedor sem a funcao pronto(): continua ligado (compatibilidade)
    assert servidor.provedor_se_pronto(um_sem_pronto) is um_sem_pronto


@pytest.mark.parametrize("codificacao", ["utf-8", "utf-8-sig", "utf-16"])
def test_env_gravado_no_windows_tambem_e_lido(tmp_path, monkeypatch, codificacao):
    """PowerShell/Bloco de Notas gravam com BOM ou UTF-16: o nome da primeira chave nao pode sair corrompido."""
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.delenv("MISM3_PROVEDOR", raising=False)
    env = tmp_path / ".env"
    env.write_bytes("GEMINI_API_KEY=abc123\r\nMISM3_PROVEDOR=gemini\r\n".encode(codificacao))
    assert sorted(servidor.carregar_env(env)) == ["GEMINI_API_KEY", "MISM3_PROVEDOR"]
    assert os.environ["GEMINI_API_KEY"] == "abc123"          # sem \r nem BOM grudados
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.delenv("MISM3_PROVEDOR", raising=False)
