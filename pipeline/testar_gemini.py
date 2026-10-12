"""Verifica se a chave da API do Google Gemini está funcionando. Faz UMA chamada mínima e mostra só o resultado.

A chave nunca vai para o site nem para o repositório. Ela é lida da variável de ambiente GEMINI_API_KEY
ou do arquivo .env da raiz do projeto (ignorado pelo git). O script nunca imprime a chave.

    python pipeline/testar_gemini.py            testa a chave com uma pergunta fixa
    python pipeline/testar_gemini.py --modelos  lista os modelos que a chave pode usar

Modelo: variável GEMINI_MODELO (padrão abaixo). Se o modelo não existir para a conta, o script lista os disponíveis.
Não usa nenhuma biblioteca além da padrão do Python. Nenhum texto de usuária é enviado: a pergunta de teste é fixa.
"""
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
BASE = "https://generativelanguage.googleapis.com/v1beta"
MODELO_PADRAO = "gemini-3.8-flash"


def ler_env(arquivo: Path) -> dict:
    """Lê CHAVE=valor de um .env. Tolera BOM e UTF-16 (o PowerShell grava assim). Devolve só o que encontrou."""
    if not arquivo.is_file():
        return {}
    bruto = arquivo.read_bytes()
    texto = bruto.decode("utf-16") if bruto[:2] in (b"\xff\xfe", b"\xfe\xff") else bruto.decode("utf-8-sig", errors="replace")
    achados = {}
    for linha in texto.splitlines():
        linha = linha.strip()
        if not linha or linha.startswith("#") or "=" not in linha:
            continue
        nome, _, valor = linha.partition("=")
        achados[nome.strip()] = valor.strip().strip('"').strip("'")
    return achados


def obter_chave(ambiente=None, arquivo=None) -> str:
    ambiente = os.environ if ambiente is None else ambiente
    chave = (ambiente.get("GEMINI_API_KEY") or "").strip()
    if chave:
        return chave
    return (ler_env(arquivo or RAIZ / ".env").get("GEMINI_API_KEY") or "").strip()


def _pedir(url: str, chave: str, corpo: dict | None = None) -> dict:
    """A chave vai no cabeçalho (não na URL), para não aparecer em registros de acesso."""
    dados = json.dumps(corpo).encode("utf-8") if corpo is not None else None
    req = urllib.request.Request(url, data=dados, method="POST" if dados else "GET",
                                 headers={"x-goog-api-key": chave, "content-type": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def listar_modelos(chave: str) -> list:
    dados = _pedir(f"{BASE}/models?pageSize=200", chave)
    return sorted(m["name"].split("/", 1)[-1] for m in dados.get("models", [])
                  if "generateContent" in m.get("supportedGenerationMethods", []))


def _mensagem_http(e: urllib.error.HTTPError) -> str:
    try:
        return json.load(e).get("error", {}).get("message", "")
    except Exception:  # noqa: BLE001 - só para mostrar a mensagem, se houver
        return ""


EXPLICACOES = {400: "pedido recusado (chave inválida ou digitada errada costuma dar este erro no Google)",
               401: "chave inválida", 503: "o Google está com muita demanda neste modelo (a chave está certa; é temporário: tente de novo em alguns minutos ou use outro modelo, por exemplo gemini-flash-latest)", 403: "a chave não tem permissão ou a API não está ativada para ela",
               404: "modelo não encontrado para esta conta", 429: "limite de uso atingido ou sem cota"}


def testar(chave: str, modelo: str) -> int:
    corpo = {"contents": [{"parts": [{"text": "Responda apenas: ok"}]}], "generationConfig": {"maxOutputTokens": 64}}
    try:
        dados = _pedir(f"{BASE}/models/{modelo}:generateContent", chave, corpo)
    except urllib.error.HTTPError as e:
        print(f"FALHOU (HTTP {e.code}): {EXPLICACOES.get(e.code, 'erro da API')}. {_mensagem_http(e)}")
        if e.code == 404:
            try:
                print("Modelos disponíveis para esta chave:", ", ".join(listar_modelos(chave)) or "(nenhum)")
                print("Use um deles assim (PowerShell):  $env:GEMINI_MODELO = \"nome-do-modelo\"; python pipeline\\testar_gemini.py")
            except (urllib.error.URLError, TimeoutError):
                pass
        return 1
    except (urllib.error.URLError, TimeoutError) as e:
        print(f"FALHOU: não consegui falar com a API ({e}). Confira a internet.")
        return 1
    partes = (dados.get("candidates") or [{}])[0].get("content", {}).get("parts", [])
    texto = "".join(p.get("text", "") for p in partes).strip()
    uso = dados.get("usageMetadata", {})
    print(f"FUNCIONOU. Modelo: {modelo} | resposta: {texto!r} | tokens: {uso.get('promptTokenCount')} entrada, {uso.get('candidatesTokenCount')} saída")
    return 0


def main(argv=None) -> int:
    argv = sys.argv[1:] if argv is None else argv
    chave = obter_chave()
    if not chave:
        print("Falta a chave. Defina GEMINI_API_KEY no ambiente ou no arquivo .env da raiz do projeto. Nada foi enviado.")
        return 2
    if "--modelos" in argv:
        try:
            print("\n".join(listar_modelos(chave)))
            return 0
        except urllib.error.HTTPError as e:
            print(f"FALHOU (HTTP {e.code}): {EXPLICACOES.get(e.code, 'erro da API')}. {_mensagem_http(e)}")
            return 1
        except (urllib.error.URLError, TimeoutError) as e:
            print(f"FALHOU: não consegui falar com a API ({e}).")
            return 1
    return testar(chave, os.environ.get("GEMINI_MODELO", MODELO_PADRAO))


if __name__ == "__main__":
    sys.exit(main())
