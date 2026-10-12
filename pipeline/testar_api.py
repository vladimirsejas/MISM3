"""Verifica se a chave da API da Anthropic (Claude) está funcionando. Faz UMA chamada mínima e mostra só o resultado.

A chave nunca vai para o site nem para o repositório: ela fica na variável de ambiente ANTHROPIC_API_KEY da sua máquina.

    PowerShell:   $env:ANTHROPIC_API_KEY = "sua-chave"; python pipeline/testar_api.py
    Linux/macOS:  ANTHROPIC_API_KEY="sua-chave" python pipeline/testar_api.py

Não usa nenhuma biblioteca além da padrão do Python. Nenhum texto de usuária é enviado: a pergunta de teste é fixa.
"""
import json
import os
import sys
import urllib.error
import urllib.request

URL = "https://api.anthropic.com/v1/messages"
MODELO = os.environ.get("ANTHROPIC_MODEL", "claude-haiku-5-5")


def testar(chave: str) -> int:
    corpo = json.dumps({"model": MODELO, "max_tokens": 20,
                        "messages": [{"role": "user", "content": "Responda apenas: ok"}]}).encode("utf-8")
    req = urllib.request.Request(URL, data=corpo, method="POST", headers={
        "x-api-key": chave, "anthropic-version": "2023-06-01", "content-type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            dados = json.load(r)
    except urllib.error.HTTPError as e:
        detalhe = ""
        try:
            detalhe = json.load(e).get("error", {}).get("message", "")
        except Exception:  # noqa: BLE001 - só para mostrar a mensagem, se houver
            pass
        explicacoes = {401: "chave inválida ou digitada errada", 403: "a chave não tem permissão (ou a conta está sem acesso)",
                       404: f"modelo '{MODELO}' não encontrado para esta conta", 429: "limite de uso atingido ou sem crédito",
                       400: "pedido recusado (confira o crédito da conta)"}
        print(f"FALHOU (HTTP {e.code}): {explicacoes.get(e.code, 'erro da API')}. {detalhe}")
        return 1
    except (urllib.error.URLError, TimeoutError) as e:
        print(f"FALHOU: não consegui falar com a API ({e}). Confira a internet.")
        return 1
    texto = "".join(b.get("text", "") for b in dados.get("content", []))
    uso = dados.get("usage", {})
    print(f"FUNCIONOU. Modelo: {dados.get('model', MODELO)} | resposta: {texto.strip()!r} | tokens: {uso.get('input_tokens')} entrada, {uso.get('output_tokens')} saída")
    return 0


def main() -> int:
    chave = os.environ.get("ANTHROPIC_API_KEY", "").strip()
    if not chave:
        print("Falta a chave. Defina a variável ANTHROPIC_API_KEY (veja as instruções no começo deste arquivo). Nada foi enviado.")
        return 2
    return testar(chave)


if __name__ == "__main__":
    sys.exit(main())
