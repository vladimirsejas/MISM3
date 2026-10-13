"""Cliente mínimo do Gemini (só biblioteca padrão). Toda falha vira ErroLab com mensagem clara; nunca mexe em dados.

Nenhum texto de usuária real é enviado: o laboratório só trabalha com perguntas sintéticas.
A chave nunca aparece em mensagens de erro, logs ou arquivos.
"""
import json
import time
import urllib.error
import urllib.request

import config


TEMPORARIOS = {429, 500, 502, 503, 504}  # vale tentar de novo
ESPERAS_S = (3, 8, 20, 45)  # pausa antes de cada nova tentativa (até 5 tentativas no total)
_dormir = time.sleep


class ErroLab(Exception):
    pass


EXPLICACOES = {400: "pedido recusado (o Google também usa 400 para chave inválida; confira a chave e o modelo)", 401: "chave inválida", 403: "a chave não tem permissão",
               404: "modelo não encontrado para esta conta", 429: "limite de uso atingido", 503: "serviço sobrecarregado (já tentei de novo várias vezes; tente em alguns minutos)"}


def _limpar(msg: str, chave: str) -> str:
    return msg.replace(chave, "***") if chave else msg


def _motivo(e: urllib.error.HTTPError) -> str:
    """Mensagem de erro que o Google devolve (ex.: 'API key not valid'), limitada a 200 caracteres; vazio se não houver."""
    try:
        m = json.loads(e.read().decode("utf-8", "replace")).get("error", {}).get("message", "")
    except Exception:  # noqa: BLE001 - só para enriquecer a mensagem
        return ""
    return f" | Google diz: {m[:200]}" if m else ""


def gerar(prompt: str, modelo: str | None = None) -> str:
    chave = config.chave()
    if not chave:
        raise ErroLab("Falta GEMINI_API_KEY. Nada foi enviado.")
    if config.parece_exemplo(chave):
        raise ErroLab("A chave encontrada parece um valor de exemplo (zeros ou texto de modelo). Troque pela chave real no .env ou em GEMINI_API_KEY. Nada foi enviado.")
    modelo = modelo or config.MODELO
    corpo = json.dumps({"contents": [{"parts": [{"text": prompt}]}]}).encode("utf-8")
    req = urllib.request.Request(f"{config.URL_BASE}/{modelo}:generateContent", data=corpo, method="POST",
                                 headers={"x-goog-api-key": chave, "content-type": "application/json"})
    dados = None
    for tentativa in range(len(ESPERAS_S) + 1):
        try:
            with urllib.request.urlopen(req, timeout=config.TIMEOUT_S) as r:
                dados = json.load(r)
            break
        except urllib.error.HTTPError as e:
            if e.code in TEMPORARIOS and tentativa < len(ESPERAS_S):
                _dormir(ESPERAS_S[tentativa])
                continue
            raise ErroLab(_limpar(f"HTTP {e.code}: {EXPLICACOES.get(e.code, 'erro da API')}{_motivo(e)}", chave)) from None
        except (urllib.error.URLError, TimeoutError, OSError) as e:
            if tentativa < len(ESPERAS_S):
                _dormir(ESPERAS_S[tentativa])
                continue
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
