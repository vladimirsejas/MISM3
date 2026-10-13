"""Única porta de escrita do laboratório: só grava dentro de laboratorio/ e nunca em pastas protegidas."""
from pathlib import Path

from config import LAB, PROTEGIDOS, RAIZ


class EscritaProibida(Exception):
    pass


def caminho_permitido(caminho) -> Path:
    p = Path(caminho).resolve()
    if not p.is_relative_to(LAB):
        raise EscritaProibida(f"fora de laboratorio/: {p}")
    for pasta in PROTEGIDOS:
        if p.is_relative_to(RAIZ / pasta):
            raise EscritaProibida(f"pasta protegida: {pasta}")
    return p


def gravar_texto(caminho, texto: str, sobrescrever: bool = False) -> Path:
    p = caminho_permitido(caminho)
    if p.exists() and not sobrescrever:
        raise EscritaProibida(f"já existe (use sobrescrever=True de propósito): {p.name}")
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(texto, encoding="utf-8")
    return p
