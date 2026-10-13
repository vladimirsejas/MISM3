"""Cliente mínimo do Gemini (só biblioteca padrão). Toda falha vira ErroLab com mensagem clara; nunca mexe em dados.

Nenhum texto de usuária real é enviado: o laboratório só trabalha com perguntas sintéticas.
A chave nunca aparece em mensagens de erro, logs ou arquivos.
"""
import json
import urllib.error
import urllib.request

import config


class ErroLab(Exception):
    pass


EXPLICACOES = {400: "pedido recusado (confira o modelo e o conteúdo)", 401: "chave inválida", 403: "a chave não tem permissão",
               404: "modelo não encontrado para esta conta", 429: "limite de uso atingido"}


def _limpar(msg: str, chave: str) -> str:
    return msg.replace(chave, "***") if chave else msg


def gerar(prompt: str, modelo: str | None = None) -> str:
    chave = config.chave()
    if not chave:
        raise ErroLab("Falta GEMINI_API_KEY. Nada foi enviado.")
    modelo = modelo or config.MODELO
    corpo = json.dumps({"contents": [{"parts": [{"text": prompt}]}]}).encode("utf-8")
    req = urllib.request.Request(f"{config.URL_BASE}/{modelo}:generateContent", data=corpo, method="POST",
                                 headers={"x-goog-api-key": chave, "content-type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=config.TIMEOUT_S) as r:
            dados = json.load(r)
    except urllib.error.HTTPError as e:
        raise ErroLab(f"HTTP {e.code}: {EXPLICACOES.get(e.code, 'erro da API')}") from None
    except (urllib.error.URLError, TimeoutError, OSError) as e:
        raise ErroLab(_limpar(f"sem conexão com a API ({type(e).__name__})", chave)) from None
    except ValueError:
        raise ErroLab("resposta da API não é JSON válido") from None
    try:
        texto = "".join(p.get("text", "") for p in dados["candidates"][0]["content"]["parts"]).strip()
    except (KeyError, IndexError, TypeError, AttributeError):
        raise ErroLab("resposta da API sem texto (vazia ou bloqueada)") from None
    if not texto:
        raise ErroLab("resposta da API vazia")
    return texto
