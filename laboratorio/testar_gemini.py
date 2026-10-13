"""Verifica se a chave do Gemini funciona: UMA chamada fixa e sintética. Não grava nada.

    GEMINI_API_KEY="sua-chave" python laboratorio/testar_gemini.py
"""
import sys

from cliente_llm import ErroLab, gerar


def main() -> int:
    try:
        print("FUNCIONOU. Resposta:", repr(gerar("Responda apenas: ok")))
        return 0
    except ErroLab as e:
        print("FALHOU:", e)
        return 2


if __name__ == "__main__":
    sys.exit(main())
