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


# Procurados nesta ordem; ambos ignorados pelo Git (ver .gitignore). Modelo em env.exemplo.
ARQUIVOS_ENV = (LAB / ".env", RAIZ / ".env")
NOMES_CHAVE = ("GEMINI_API_KEY", "GOOGLE_API_KEY")  # GOOGLE_API_KEY é o nome padrão usado pelo Google


def _ler_env(nome: str) -> str:
    """Valor de `nome` nos arquivos .env (linhas NOME=valor; aspas opcionais; # comenta). Vazio se não houver."""
    for arquivo in ARQUIVOS_ENV:
        try:
            linhas = arquivo.read_text(encoding="utf-8-sig").splitlines()
        except OSError:
            continue
        for linha in linhas:
            k, sep, v = linha.strip().partition("=")
            if sep and k.strip() == nome and v.strip().strip("\"'").strip():
                return v.strip().strip("\"'").strip()
    return ""


def chave() -> str:
    """Variável de ambiente vale mais que os arquivos .env; sem nenhuma, devolve vazio."""
    for nome in NOMES_CHAVE:
        v = os.environ.get(nome, "").strip() or _ler_env(nome)
        if v:
            return v
    return ""


def parece_exemplo(valor: str) -> bool:
    """Valor de exemplo que ninguém trocou pela chave real (só zeros, 'cole...', 'sua-chave', 'xxx')."""
    v = valor.strip().lower()
    return bool(v) and (set(v) <= {"0"} or set(v) <= {"x"} or v.startswith(("cole", "sua-chave", "sua_chave", "troque", "preencha")))
