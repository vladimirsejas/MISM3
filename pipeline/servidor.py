"""Servidor local do MISM3: serve o site (web/) e a API em /api/*.

Por que existe: o site funciona sozinho com arquivos, mas para PESQUISAS REAIS (uma API de busca, um servico de
dados, um modelo de linguagem...) a chave de acesso nao pode ficar no navegador. Este servidor guarda a chave
(variavel de ambiente) e entrega ao site so o resultado. Contrato completo em docs/api_contrato.md.

  python pipeline/servidor.py [--porta 8000] [--web web]

Rotas
  GET  /config.js          configuracao do site em modo "api" (substitui web/config.js enquanto o servidor roda)
  GET  /api/saude          {"ok": true, ...}
  GET  /api/servicos       web/dados/servicos.json      (404 se nao existir: o site cai para os arquivos locais)
  GET  /api/cep_indice     web/dados/cep_indice.json
  GET  /api/vagas          web/dados/vagas.json
  GET  /api/gestao         web/dados/gestao.json
  POST /api/pesquisar      {"texto": "...", "contexto": {}} -> pesquisa real pelo PROVEDOR (501 se nao houver)

Provedor de pesquisa (um dos dois; sem nenhum, a pesquisa fica desligada):
  * MISM3_PROVEDOR=gemini no .env  -> pipeline/provedor_gemini.py (Google Gemini com Pesquisa Google, a mesma API do MISM2)
  * pipeline/provedor_pesquisa.py com  pesquisar(texto, contexto) -> dict  (modelo: provedor_pesquisa.exemplo.py)

Privacidade: o servidor NUNCA registra o texto digitado nem o corpo das requisicoes; so metodo e caminho.
"""
from __future__ import annotations

import argparse
import importlib.util
import json
import os
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

RAIZ = Path(__file__).resolve().parent.parent
WEB_PADRAO = RAIZ / "web"
LIMITE_CORPO = 8 * 1024  # a frase da usuaria tem ate 300 caracteres; 8 KB sobra e barra abuso

ROTAS_ARQUIVO = {
    "/api/servicos": "dados/servicos.json",
    "/api/cep_indice": "dados/cep_indice.json",
    "/api/vagas": "dados/vagas.json",
    "/api/gestao": "dados/gestao.json",
}


def carregar_env(arquivo: Path | None = None) -> list[str]:
    """Le CHAVE=valor de um .env (por padrao o da raiz do projeto) para o ambiente, sem sobrescrever o que ja existe.
    Devolve so os NOMES carregados, nunca os valores (para nunca ir parar em log)."""
    arquivo = arquivo or RAIZ / ".env"
    carregadas: list[str] = []
    if not arquivo.is_file():
        return carregadas
    for linha in arquivo.read_text(encoding="utf-8").splitlines():
        linha = linha.strip()
        if not linha or linha.startswith("#") or "=" not in linha:
            continue
        chave, _, valor = linha.partition("=")
        chave, valor = chave.strip(), valor.strip().strip('"').strip("'")
        if chave and chave not in os.environ:
            os.environ[chave] = valor
            carregadas.append(chave)
    return carregadas


def carregar_provedor(caminho: Path | None = None):
    """Escolhe o provedor de pesquisa: pipeline/provedor_pesquisa.py (o seu) ou, com MISM3_PROVEDOR=gemini,
    pipeline/provedor_gemini.py. Devolve o modulo ou None (pesquisa desligada)."""
    pasta = Path(__file__).resolve().parent
    if caminho is None:
        if (pasta / "provedor_pesquisa.py").exists():
            caminho = pasta / "provedor_pesquisa.py"
        elif os.environ.get("MISM3_PROVEDOR", "").strip().lower() == "gemini":
            caminho = pasta / "provedor_gemini.py"
        else:
            return None
    if not caminho.exists():
        return None
    spec = importlib.util.spec_from_file_location("provedor_pesquisa", caminho)
    modulo = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(modulo)  # type: ignore[union-attr]
    if not callable(getattr(modulo, "pesquisar", None)):
        raise RuntimeError("%s precisa definir pesquisar(texto, contexto)" % caminho.name)
    return modulo


def provedor_se_pronto(provedor):
    """Provedor escolhido mas sem o que precisa (ex.: sem chave) = pesquisa DESLIGADA, com aviso claro.
    Evita a tela afirmar que a frase vai a um servico externo quando nada seria enviado."""
    if provedor is not None and callable(getattr(provedor, "pronto", None)) and not provedor.pronto():
        print("AVISO: provedor '%s' escolhido, mas falta a chave/configuracao. Pesquisa real DESLIGADA; o site usa so a busca local." %
              getattr(provedor, "NOME", "pesquisa"))
        return None
    return provedor


def criar_servidor(web: Path = WEB_PADRAO, provedor=None, porta: int = 8000, host: str = "127.0.0.1") -> ThreadingHTTPServer:
    web = Path(web).resolve()

    class Handler(SimpleHTTPRequestHandler):
        def __init__(self, *a, **k):
            super().__init__(*a, directory=str(web), **k)

        # ---- registro: so metodo e caminho, nunca consulta (?q=) nem corpo
        def log_message(self, formato, *args):
            sys.stderr.write("%s %s\n" % (self.command, urlparse(self.path).path))

        def _json(self, status: int, obj) -> None:
            corpo = json.dumps(obj, ensure_ascii=False).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(corpo)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(corpo)

        def do_GET(self):
            caminho = urlparse(self.path).path
            if caminho == "/config.js":
                cfg = {"modo": "api", "apiBase": "/api", "pesquisaRemota": provedor is not None, "usarLocalSeApiFalhar": True,
                       "pesquisaDestino": getattr(provedor, "NOME", "") if provedor is not None else ""}
                corpo = ("window.MISM3_CONFIG = %s;\n" % json.dumps(cfg)).encode("utf-8")
                self.send_response(200)
                self.send_header("Content-Type", "application/javascript; charset=utf-8")
                self.send_header("Content-Length", str(len(corpo)))
                self.send_header("Cache-Control", "no-store")
                self.end_headers()
                self.wfile.write(corpo)
            elif caminho == "/api/saude":
                self._json(200, {"ok": True, "pesquisa": provedor is not None})
            elif caminho in ROTAS_ARQUIVO:
                arquivo = web / ROTAS_ARQUIVO[caminho]
                if arquivo.is_file():
                    corpo = arquivo.read_bytes()
                    self.send_response(200)
                    self.send_header("Content-Type", "application/json; charset=utf-8")
                    self.send_header("Content-Length", str(len(corpo)))
                    self.send_header("Cache-Control", "no-store")
                    self.end_headers()
                    self.wfile.write(corpo)
                else:
                    self._json(404, {"erro": "dado nao disponivel nesta instalacao"})
            elif caminho.startswith("/api/"):
                self._json(404, {"erro": "rota desconhecida"})
            else:
                super().do_GET()  # arquivos de web/ (o SimpleHTTPRequestHandler barra '..' e sai de web/)

        def do_POST(self):
            if urlparse(self.path).path != "/api/pesquisar":
                return self._json(404, {"erro": "rota desconhecida"})
            if provedor is None:
                return self._json(501, {"erro": "pesquisa desligada: crie pipeline/provedor_pesquisa.py (veja docs/api_contrato.md)"})
            try:
                tamanho = int(self.headers.get("Content-Length") or 0)
            except ValueError:
                return self._json(400, {"erro": "Content-Length invalido"})
            if tamanho <= 0 or tamanho > LIMITE_CORPO:
                return self._json(413 if tamanho > LIMITE_CORPO else 400, {"erro": "corpo ausente ou grande demais"})
            try:
                pedido = json.loads(self.rfile.read(tamanho).decode("utf-8"))
                texto, contexto = str(pedido["texto"])[:300], pedido.get("contexto") or {}
                if not isinstance(contexto, dict):
                    raise ValueError("contexto deve ser um objeto")
            except (ValueError, KeyError, UnicodeDecodeError, TypeError):
                return self._json(400, {"erro": "corpo deve ser JSON com 'texto'"})
            try:
                resposta = provedor.pesquisar(texto, contexto)
            except Exception:  # noqa: BLE001 - falha do provedor nao derruba o servidor nem vaza detalhe
                return self._json(502, {"erro": "o provedor de pesquisa falhou"})
            if not isinstance(resposta, dict):
                return self._json(502, {"erro": "o provedor deve devolver um objeto"})
            self._json(200, resposta)  # o site descarta o que nao tiver fonte (api.js: normalizarResposta)

    return ThreadingHTTPServer((host, porta), Handler)


def main() -> None:
    ap = argparse.ArgumentParser(description="Servidor local do MISM3 (site + API)")
    ap.add_argument("--porta", type=int, default=8000)
    ap.add_argument("--web", default=str(WEB_PADRAO))
    args = ap.parse_args()
    carregadas = carregar_env()
    if carregadas:
        print("Lido do .env (so os nomes): %s" % ", ".join(carregadas))
    provedor = provedor_se_pronto(carregar_provedor())
    srv = criar_servidor(Path(args.web), provedor, args.porta)
    print("MISM3 em http://localhost:%d  |  pesquisa real: %s" % (
        args.porta, ("LIGADA (%s)" % getattr(provedor, "NOME", "provedor_pesquisa.py")) if provedor else "desligada (veja docs/api_contrato.md)"))
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print("\nEncerrado.")


if __name__ == "__main__":
    main()
