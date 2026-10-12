"""Testa o verificador da chave do Gemini sem usar a rede nem uma chave de verdade."""
import io
import json
import urllib.error

import testar_gemini as tg


def test_le_env_com_bom_aspas_e_comentarios(tmp_path):
    f = tmp_path / ".env"
    f.write_bytes("﻿# comentário\nGEMINI_API_KEY=\"abc123\"\nOUTRA=x\n".encode("utf-8"))
    assert tg.ler_env(f) == {"GEMINI_API_KEY": "abc123", "OUTRA": "x"}


def test_le_env_em_utf16_do_powershell(tmp_path):
    f = tmp_path / ".env"
    f.write_bytes("GEMINI_API_KEY=abc123\n".encode("utf-16"))
    assert tg.ler_env(f)["GEMINI_API_KEY"] == "abc123"


def test_chave_do_ambiente_vence_a_do_arquivo(tmp_path):
    f = tmp_path / ".env"
    f.write_text("GEMINI_API_KEY=do_arquivo\n", encoding="utf-8")
    assert tg.obter_chave({"GEMINI_API_KEY": "do_ambiente"}, f) == "do_ambiente"
    assert tg.obter_chave({}, f) == "do_arquivo"
    assert tg.obter_chave({}, tmp_path / "nao_existe") == ""


def test_sem_chave_nao_envia_nada(monkeypatch, capsys, tmp_path):
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.setattr(tg, "RAIZ", tmp_path)
    chamadas = []
    monkeypatch.setattr(tg, "_pedir", lambda *a, **k: chamadas.append(a))
    assert tg.main([]) == 2
    assert not chamadas and "Nada foi enviado" in capsys.readouterr().out


def test_sucesso_mostra_resposta_e_nunca_a_chave(monkeypatch, capsys):
    monkeypatch.setenv("GEMINI_API_KEY", "SEGREDO-NAO-IMPRIMIR")
    capturado = {}

    def falso(url, chave, corpo=None):
        capturado.update(url=url, chave=chave)
        return {"candidates": [{"content": {"parts": [{"text": "ok"}]}}], "usageMetadata": {"promptTokenCount": 5, "candidatesTokenCount": 1}}
    monkeypatch.setattr(tg, "_pedir", falso)
    assert tg.main([]) == 0
    saida = capsys.readouterr().out
    assert "FUNCIONOU" in saida and "SEGREDO" not in saida
    assert "SEGREDO" not in capturado["url"], "a chave não pode ir na URL"


def test_modelo_inexistente_lista_os_disponiveis(monkeypatch, capsys):
    monkeypatch.setenv("GEMINI_API_KEY", "x")
    erro = urllib.error.HTTPError("u", 404, "nf", {}, io.BytesIO(json.dumps({"error": {"message": "modelo?"}}).encode()))

    def falso(url, chave, corpo=None):
        if corpo is not None:
            raise erro
        return {"models": [{"name": "models/gemini-a", "supportedGenerationMethods": ["generateContent"]},
                           {"name": "models/embed", "supportedGenerationMethods": ["embedContent"]}]}
    monkeypatch.setattr(tg, "_pedir", falso)
    assert tg.main([]) == 1
    saida = capsys.readouterr().out
    assert "HTTP 404" in saida and "gemini-a" in saida and "embed" not in saida
