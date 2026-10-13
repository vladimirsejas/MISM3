"""Garantias do laboratório: isolado do site, falha com clareza, não vaza a chave, não escreve fora de si."""
import io
import os
import json
import subprocess
import sys
import urllib.error
from pathlib import Path
from unittest import mock

import pytest

import cliente_llm
import seguro
from config import LAB, RAIZ

CHAVE_FALSA = "CHAVE-FALSA-123456"


class Resp(io.BytesIO):
    def __enter__(self):
        return self

    def __exit__(self, *a):
        return False


def ok(texto):
    return Resp(json.dumps({"candidates": [{"content": {"parts": [{"text": texto}]}}]}).encode())


@pytest.fixture(autouse=True)
def com_chave(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", CHAVE_FALSA)


def test_sem_chave_nao_envia_nada(monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY")
    with mock.patch("urllib.request.urlopen") as u, pytest.raises(cliente_llm.ErroLab, match="Falta"):
        cliente_llm.gerar("x")
    u.assert_not_called()


def test_resposta_boa():
    with mock.patch("urllib.request.urlopen", return_value=ok("ok")):
        assert cliente_llm.gerar("x") == "ok"


def test_chave_vai_no_cabecalho_nunca_na_url():
    with mock.patch("urllib.request.urlopen", return_value=ok("ok")) as u:
        cliente_llm.gerar("x")
    req = u.call_args[0][0]
    assert CHAVE_FALSA not in req.full_url
    assert req.get_header("X-goog-api-key") == CHAVE_FALSA


@pytest.mark.parametrize("codigo", [400, 401, 403, 404, 429, 500, 503])
def test_erros_http_viram_erro_claro_sem_chave(codigo):
    e = urllib.error.HTTPError("u", codigo, "m", {}, io.BytesIO(CHAVE_FALSA.encode()))
    with mock.patch("urllib.request.urlopen", side_effect=e), pytest.raises(cliente_llm.ErroLab) as exc:
        cliente_llm.gerar("x")
    assert str(codigo) in str(exc.value) and CHAVE_FALSA not in str(exc.value)


def test_400_mostra_motivo_do_google_sem_vazar_a_chave():
    corpo = json.dumps({"error": {"message": f"API key not valid ({CHAVE_FALSA}). Please pass a valid API key."}}).encode()
    e = urllib.error.HTTPError("u", 400, "m", {}, io.BytesIO(corpo))
    with mock.patch("urllib.request.urlopen", side_effect=e), pytest.raises(cliente_llm.ErroLab) as exc:
        cliente_llm.gerar("x")
    assert "API key not valid" in str(exc.value) and CHAVE_FALSA not in str(exc.value)


@pytest.mark.parametrize("erro", [TimeoutError(), urllib.error.URLError("sem rede " + CHAVE_FALSA), ConnectionResetError()])
def test_timeout_e_rede(erro):
    with mock.patch("urllib.request.urlopen", side_effect=erro), pytest.raises(cliente_llm.ErroLab) as exc:
        cliente_llm.gerar("x")
    assert CHAVE_FALSA not in str(exc.value)


@pytest.mark.parametrize("corpo", [b"", b"nao e json", b"{}", b'{"candidates": []}', b'{"candidates":[{"content":{"parts":[{"text":"  "}]}}]}'])
def test_resposta_vazia_ou_malformada(corpo):
    with mock.patch("urllib.request.urlopen", return_value=Resp(corpo)), pytest.raises(cliente_llm.ErroLab):
        cliente_llm.gerar("x")


def test_escrita_so_dentro_do_laboratorio(tmp_path):
    p = seguro.gravar_texto(LAB / "resultados" / "_teste_tmp.txt", "a", sobrescrever=True)
    p.unlink()
    for ruim in [RAIZ / "web" / "dados" / "x.json", RAIZ / "catalogo" / "x.txt", RAIZ / "pipeline" / "x.py",
                 RAIZ / "avaliacao" / "perguntas.json", tmp_path / "x.txt", LAB / ".." / "README.md"]:
        with pytest.raises(seguro.EscritaProibida):
            seguro.gravar_texto(ruim, "x", sobrescrever=True)


def test_nao_sobrescreve_sem_pedir():
    p = seguro.gravar_texto(LAB / "resultados" / "_teste_tmp2.txt", "a", sobrescrever=True)
    try:
        with pytest.raises(seguro.EscritaProibida):
            seguro.gravar_texto(p, "b")
    finally:
        p.unlink()


def test_site_e_pipeline_nao_dependem_do_laboratorio_nem_do_gemini():
    for pasta in ("web", "pipeline", "avaliacao"):
        for f in (RAIZ / pasta).rglob("*"):
            if f.suffix in {".js", ".py", ".html"} and f.is_file() and "vendor" not in f.parts and "__pycache__" not in f.parts and f.name != "test_dependencias.py":
                t = f.read_text(encoding="utf-8", errors="ignore").lower()
                for proibido in ("laboratorio/", "cliente_llm", "generativelanguage", "gemini_api_key"):
                    assert proibido not in t, f"{f} menciona {proibido}"


def test_nenhuma_chave_real_versionada():
    for f in LAB.rglob("*"):
        if f.is_file() and "__pycache__" not in f.parts and f.suffix in {".py", ".md", ".txt", ".json", ".sha256"}:
            assert "AI" + "za" not in f.read_text(encoding="utf-8", errors="ignore"), f


def test_arquivos_protegidos_intactos():
    r = subprocess.run([sys.executable, str(LAB / "verificar_intacto.py")], capture_output=True, text=True, encoding="utf-8",
                       env={**os.environ, "PYTHONIOENCODING": "utf-8"})
    assert r.returncode == 0, r.stdout


def test_chave_lida_do_arquivo_env_e_variavel_vale_mais(tmp_path, monkeypatch):
    import config
    arq = tmp_path / ".env"
    arq.write_text('# comentario\nOUTRA=1\nGEMINI_API_KEY = "CHAVE-DO-ARQUIVO"\n', encoding="utf-8-sig")
    monkeypatch.setattr(config, "ARQUIVOS_ENV", (tmp_path / "nao_existe.env", arq))
    monkeypatch.delenv("GEMINI_API_KEY")
    assert config.chave() == "CHAVE-DO-ARQUIVO"
    monkeypatch.setenv("GEMINI_API_KEY", "CHAVE-DA-VARIAVEL")
    assert config.chave() == "CHAVE-DA-VARIAVEL"


def test_sem_env_e_sem_variavel_chave_vazia(tmp_path, monkeypatch):
    import config
    monkeypatch.setattr(config, "ARQUIVOS_ENV", (tmp_path / "nao_existe.env",))
    monkeypatch.delenv("GEMINI_API_KEY")
    monkeypatch.delenv("GOOGLE_API_KEY", raising=False)
    assert config.chave() == ""


def test_env_do_laboratorio_e_ignorado_pelo_git():
    for caminho in ("laboratorio/.env", ".env"):
        r = subprocess.run(["git", "check-ignore", "-q", caminho], cwd=RAIZ)
        assert r.returncode == 0, f"{caminho} NÃO está no .gitignore"


def test_nome_alternativo_google_api_key_e_env_da_raiz(tmp_path, monkeypatch):
    import config
    raiz_env = tmp_path / ".env"
    raiz_env.write_text("GOOGLE_API_KEY=CHAVE-GOOGLE\n", encoding="utf-8")
    monkeypatch.setattr(config, "ARQUIVOS_ENV", (tmp_path / "lab.env", raiz_env))
    monkeypatch.delenv("GEMINI_API_KEY")
    monkeypatch.delenv("GOOGLE_API_KEY", raising=False)
    assert config.chave() == "CHAVE-GOOGLE"


@pytest.mark.parametrize("valor", ["0" * 45, "xxxx", "cole-a-chave-aqui", "COLE_AQUI_A_CHAVE_REAL", "sua-chave"])
def test_chave_de_exemplo_nao_e_enviada(monkeypatch, valor):
    monkeypatch.setenv("GEMINI_API_KEY", valor)
    with mock.patch("urllib.request.urlopen") as u, pytest.raises(cliente_llm.ErroLab, match="exemplo"):
        cliente_llm.gerar("x")
    u.assert_not_called()


def test_chave_real_nao_e_confundida_com_exemplo():
    import config
    assert not config.parece_exemplo("AI" + "zaSyD-chave-de-verdade-0001")
