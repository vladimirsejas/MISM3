"""Configuração do laboratório (isolado do site). Só lê variáveis de ambiente; nada de chave em arquivo versionado.

    Uma vez só: criar laboratorio/.env com a linha  GEMINI_API_KEY=sua-chave  (modelo em env.exemplo; o Git ignora o .env)
    Ou, só naquela janela:  PowerShell  $env:GEMINI_API_KEY = "sua-chave"   |   Linux/macOS  export GEMINI_API_KEY="sua-chave"
"""
import os
from pathlib import Path

LAB = Path(__file__).resolve().parent
RAIZ = LAB.parent
# Pastas que o laboratório NUNCA pode alterar (o site, o catálogo, o pipeline e as avaliações atuais).
PROTEGIDOS = ("web", "catalogo", "pipeline", "avaliacao", "dados", "docs", ".github")
MODELO = os.environ.get("GEMINI_MODEL", "gemini-3.8-flash")
URL_BASE = "https://generativelanguage.googleapis.com/v1beta/models"
TIMEOUT_S = 30


ARQUIVO_ENV = LAB / ".env"  # local, ignorado pelo Git (ver .gitignore); modelo em env.exemplo


def _ler_env(nome: str) -> str:
    """Valor de `nome` no arquivo laboratorio/.env (linhas NOME=valor; aspas opcionais; # comenta). Vazio se não houver."""
    try:
        linhas = ARQUIVO_ENV.read_text(encoding="utf-8-sig").splitlines()
    except OSError:
        return ""
    for linha in linhas:
        k, sep, v = linha.strip().partition("=")
        if sep and k.strip() == nome:
            return v.strip().strip("\"'").strip()
    return ""


def chave() -> str:
    """A variável de ambiente vale mais que o .env; sem nenhuma das duas, devolve vazio."""
    return os.environ.get("GEMINI_API_KEY", "").strip() or _ler_env("GEMINI_API_KEY")
