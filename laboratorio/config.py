"""Configuração do laboratório (isolado do site). Só lê variáveis de ambiente; nada de chave em arquivo versionado.

    PowerShell:   $env:GEMINI_API_KEY = "sua-chave"
    Linux/macOS:  export GEMINI_API_KEY="sua-chave"
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


def chave() -> str:
    return os.environ.get("GEMINI_API_KEY", "").strip()
