"""Lista os modelos do Gemini que a sua chave pode usar para gerar texto. Não grava nada.

    python laboratorio/listar_modelos.py
Para usar outro modelo só nesta janela:  $env:GEMINI_MODEL = "nome-do-modelo"
"""
import json
import sys
import urllib.error
import urllib.request

import config


def main() -> int:
    chave = config.chave()
    if not chave or config.parece_exemplo(chave):
        print("Falta a chave real (GEMINI_API_KEY no ambiente ou no .env). Nada foi enviado.")
        return 2
    req = urllib.request.Request(f"{config.URL_BASE}?pageSize=100", headers={"x-goog-api-key": chave})
    try:
        with urllib.request.urlopen(req, timeout=config.TIMEOUT_S) as r:
            modelos = json.load(r).get("models", [])
    except urllib.error.HTTPError as e:
        print(f"FALHOU (HTTP {e.code}).")
        return 1
    except (urllib.error.URLError, TimeoutError, OSError, ValueError):
        print("FALHOU: não consegui falar com a API.")
        return 1
    nomes = sorted(m["name"].removeprefix("models/") for m in modelos if "generateContent" in m.get("supportedGenerationMethods", []))
    print(f"Modelos disponíveis para gerar texto (padrão do laboratório: {config.MODELO}):")
    print(*(f"  {n}" for n in nomes), sep="\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
