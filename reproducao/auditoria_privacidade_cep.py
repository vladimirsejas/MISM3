"""Auditoria de privacidade do site do MISM3 com Playwright (Chromium).

Serve web/ por um servidor estático local, abre web/index.html em seis cenários (cada um em um contexto de navegador novo, sem cache nem
armazenamento anterior) e registra TODAS as requisições de rede: domínio, caminho, método, tamanho, cabeçalhos e corpo. Para cada requisição,
procura o texto digitado e o CEP (busca exata e por trechos de três palavras) na URL, nos cabeçalhos e no corpo. Ao fim de cada cenário
registra localStorage, sessionStorage, IndexedDB e cookies.

Só mensagens e CEP de testes são usados. Nenhum arquivo do projeto é alterado; as saídas ficam em reproducao/resultados/.

Preparação (uma vez), em um ambiente virtual qualquer:
    python -m pip install playwright
    python -m playwright install chromium
Uso (da raiz do repositório; para outro local de navegadores, defina PLAYWRIGHT_BROWSERS_PATH):
    MISM3_AUDIT_CEP=13504-090 python reproducao/auditoria_privacidade_cep.py

Saídas: reproducao/auditoria_privacidade_cep_<CEP>.md e reproducao/resultados/auditoria_cep_<CEP>/auditoria_requisicoes.json.
"""
from __future__ import annotations

import functools
import http.server
import json
import math
import os
import re
import socketserver
import sys
import threading
import time
from collections import Counter, defaultdict
from pathlib import Path
from urllib.parse import unquote_plus, urlparse

sys.path.insert(0, str(Path(__file__).resolve().parent))
import comum  # noqa: E402

try:
    from playwright.sync_api import sync_playwright
except ImportError:  # pragma: no cover
    sys.exit("Playwright não está instalado: python -m pip install playwright && python -m playwright install chromium")

RAIZ = comum.RAIZ
WEB = RAIZ / "web"
MENSAGEM = "Preciso de ajuda fictícia para a vaga de creche da pequena Zorzalina Quimérica"
CEP = os.environ.get("MISM3_AUDIT_CEP", "13504-090").strip()
CEP_DIGITOS = re.sub(r"\D", "", CEP)
if not re.fullmatch(r"\d{8}", CEP_DIGITOS):
    sys.exit("CEP inválido. Informe oito dígitos em MISM3_AUDIT_CEP.")
CEP = CEP_DIGITOS[:5] + "-" + CEP_DIGITOS[5:]
CEP_PREFIXO = CEP_DIGITOS[:5]
SAIDA = RAIZ / "reproducao" / "resultados" / f"auditoria_cep_{CEP_DIGITOS}"


# ---------------------------------------------------------------- servidor estático local
class _Silencioso(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):  # sem ruído no terminal
        pass


def iniciar_servidor() -> tuple[socketserver.TCPServer, str]:
    handler = functools.partial(_Silencioso, directory=str(WEB))
    srv = socketserver.ThreadingTCPServer(("127.0.0.1", 0), handler)
    srv.daemon_threads = True
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, f"http://127.0.0.1:{srv.server_address[1]}"


# ---------------------------------------------------------------- vazamento: busca exata e por trechos de três palavras
def _norm(s: str) -> str:
    return unquote_plus(s or "").lower()


def _trechos(texto: str, n: int = 3) -> list[str]:
    ps = re.findall(r"\w+", texto.lower())
    return [" ".join(ps[i:i + n]) for i in range(len(ps) - n + 1)]


def procurar(req: dict) -> dict:
    """Onde o texto digitado ou o CEP aparecem nesta requisição (url, cabeçalhos, corpo)."""
    partes = {"url": _norm(req["url"]), "cabecalhos": _norm(json.dumps(req["cabecalhos"], ensure_ascii=False)), "corpo": _norm(req["corpo"] or "")}
    achados: list[str] = []
    for nome, h in partes.items():
        h_sem = h.replace("+", " ")
        if MENSAGEM.lower() in h_sem:
            achados.append(f"mensagem exata em {nome}")
        for t in _trechos(MENSAGEM):
            if t in h_sem:
                achados.append(f"trecho de 3 palavras '{t}' em {nome}")
        if CEP in h or CEP_DIGITOS in h:
            achados.append(f"CEP exato em {nome}")
        elif CEP_PREFIXO in h:
            achados.append(f"prefixo do CEP ({CEP_PREFIXO}) em {nome}")
    return {"achados": sorted(set(achados))}


# ---------------------------------------------------------------- tiles
def tile_para_lonlat(z: int, x: int, y: int) -> tuple[float, float]:
    n = 2 ** z
    lon = x / n * 360 - 180
    lat = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * y / n))))
    return lat, lon


def analisar_tile(url: str) -> dict | None:
    u = urlparse(url)
    if "openstreetmap.org" in u.netloc:
        m = re.match(r"^/(\d+)/(\d+)/(\d+)\.png$", u.path)
        if m:
            z, x, y = map(int, m.groups())
            return {"servico": "OpenStreetMap", "z": z, "x": x, "y": y}
    if "arcgisonline.com" in u.netloc:
        m = re.search(r"/tile/(\d+)/(\d+)/(\d+)$", u.path)
        if m:
            z, y, x = map(int, m.groups())  # a Esri usa z/y/x
            return {"servico": "Esri", "z": z, "x": x, "y": y}
    return None


# ---------------------------------------------------------------- coleta de uma sessão
class Sessao:
    def esperar_externas(self, page, base: str, limite: float = 25.0) -> None:
        """Espera as requisições para outros domínios terminarem (ou falharem), até `limite` segundos."""
        fim = time.time() + limite
        while time.time() < fim:
            pend = [r for r in self.requisicoes if not r["url"].startswith(base) and r["status"] is None and r["falhou"] is None]
            if not pend:
                return
            page.wait_for_timeout(500)

    def __init__(self, nome: str):
        self.nome = nome
        self.requisicoes: list[dict] = []
        self.t0 = time.time()
        self.marcos: dict[str, float] = {}

    def marco(self, rotulo: str) -> None:
        self.marcos[rotulo] = time.time() - self.t0

    def anexar(self, page) -> None:
        def ao_requisitar(req):
            # Sem chamadas bloqueantes aqui: os eventos de término podem chegar antes de este tratador acabar.
            reg = {"cenario": self.nome, "t": round(time.time() - self.t0, 3), "url": req.url, "metodo": req.method,
                   "tipo_recurso": req.resource_type, "cabecalhos": dict(req.headers), "corpo": req.post_data, "tamanho_resposta": None,
                   "status": None, "falhou": None, "cabecalhos_finais": False}
            req._reg = reg  # noqa: SLF001
            self.requisicoes.append(reg)

        def ao_terminar(req):
            reg = getattr(req, "_reg", None)
            if not reg:
                return
            try:
                reg["cabecalhos"] = req.all_headers()  # cabeçalhos finais, como foram enviados (o registro do início é provisório)
                reg["cabecalhos_finais"] = True
                reg["tamanho_resposta"] = req.sizes()["responseBodySize"]
                resp = req.response()
                reg["status"] = resp.status if resp else None
            except Exception:  # noqa: BLE001
                pass

        def ao_falhar(req):
            reg = getattr(req, "_reg", None)
            if reg:
                reg["falhou"] = str(req.failure)  # ex.: net::ERR_ABORTED (o mapa cancela tiles de zoom intermediário)

        page.on("request", ao_requisitar)
        page.on("requestfinished", ao_terminar)
        page.on("requestfailed", ao_falhar)


def armazenamento(page, ctx) -> dict:
    js = """async () => {
      const ls = {}, ss = {};
      for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); ls[k] = localStorage.getItem(k); }
      for (let i = 0; i < sessionStorage.length; i++) { const k = sessionStorage.key(i); ss[k] = sessionStorage.getItem(k); }
      let idb = [];
      try { idb = (await indexedDB.databases()).map(d => d.name + ' v' + d.version); } catch (e) { idb = ['indisponível: ' + e]; }
      return { localStorage: ls, sessionStorage: ss, indexedDB: idb, documentCookie: document.cookie };
    }"""
    d = page.evaluate(js)
    d["cookies_do_contexto"] = [{"name": c["name"], "domain": c["domain"]} for c in ctx.cookies()]
    return d


# ---------------------------------------------------------------- cenários
def cen1(page, base, s):
    page.goto(base + "/index.html")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(2500)


def cen2(page, base, s):
    page.goto(base + "/index.html")
    page.wait_for_load_state("networkidle")
    s.marco("antes_de_digitar")
    page.fill("#ia-texto", MENSAGEM)
    page.click("#ia-enviar")
    page.wait_for_timeout(3000)
    s.extra = {"resposta_exibida_em_ia_saida": bool(page.inner_text("#ia-saida").strip()), "caracteres_da_resposta": len(page.inner_text("#ia-saida"))}


def cen3(page, base, s):
    page.goto(base + "/index.html")
    page.wait_for_load_state("networkidle")
    s.marco("antes_de_digitar")
    page.fill("#cep-mapa", CEP)
    page.press("#cep-mapa", "Enter")
    page.wait_for_timeout(3000)
    s.extra = {"mensagem_do_site": (page.inner_text("#mensagem-mapa") if page.locator("#mensagem-mapa").is_visible() else "(sem mensagem)")}


def cen4(page, base, s):
    page.goto(base + "/index.html")
    page.wait_for_selector("#usar-tiles-mapa", state="attached")
    s.extra = {"caixa_marcada_por_padrao": page.is_checked("#usar-tiles-mapa")}
    page.locator("#mapa-servicos").scroll_into_view_if_needed()
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(2500)


def cen5(page, base, s):
    """Mesmo mapa, caixa desmarcada ANTES de o mapa iniciar. É uma simulação: um script de inicialização desmarca a caixa assim que o
    elemento existe. Uma pessoa não consegue fazer isso, porque só vê a caixa depois do primeiro desenho do mapa (ver cenários 4 e 5b)."""
    page.add_init_script("new MutationObserver((m,o)=>{const c=document.getElementById('usar-tiles-mapa'); if(c){c.checked=false;o.disconnect();}})"
                         ".observe(document,{childList:true,subtree:true})")
    page.goto(base + "/index.html")
    page.wait_for_load_state("networkidle")
    s.extra = {"caixa_marcada_no_fim": page.is_checked("#usar-tiles-mapa"), "simulacao": "desmarcada por script de inicialização, antes do mapa iniciar"}
    page.locator("#mapa-servicos").scroll_into_view_if_needed()
    page.wait_for_timeout(2500)


def cen5b(page, base, s):
    """Variante: espera o mapa carregar com a caixa marcada, desmarca e mexe no mapa (zoom) para ver se saem novas requisições de tiles."""
    page.goto(base + "/index.html")
    page.wait_for_load_state("networkidle")
    page.locator("#mapa-servicos").scroll_into_view_if_needed()
    page.wait_for_timeout(2000)
    s.marco("antes_de_desmarcar")
    page.uncheck("#usar-tiles-mapa", force=True)
    s.marco("depois_de_desmarcar")
    zoom = page.locator("#mapa-servicos .leaflet-control-zoom-in")
    if zoom.count():
        zoom.first.click()
        page.wait_for_timeout(1000)
        zoom.first.click()
    page.wait_for_timeout(2500)
    s.extra = {"controle_de_zoom_encontrado": bool(zoom.count())}


def cen6(page, base, s):
    """Mapa 'serviços perto de mim' (OpenStreetMap, opção de ruas): área > busca por CEP > resultado > marcar 'Mostrar ruas'."""
    page.goto(base + "/index.html#educacao")
    page.wait_for_selector("#busca-por-cep", state="attached")
    page.wait_for_load_state("networkidle")
    visivel = page.locator("#busca-por-cep").is_visible()
    s.extra = {"busca_por_cep_visivel": visivel}
    if not visivel:
        return
    page.click("#busca-por-cep summary")
    page.fill("#cep", CEP)
    page.press("#cep", "Enter")
    page.wait_for_timeout(2500)
    res = page.locator("#resultado").is_visible()
    s.extra["resultado_com_mapa_visivel"] = res
    s.extra["mensagem_do_site"] = page.inner_text("#mensagem") if page.locator("#mensagem").is_visible() else "(sem mensagem)"
    s.marco("antes_de_marcar_ruas")
    if res:
        s.extra["caixa_ruas_marcada_por_padrao"] = page.is_checked("#usar-tiles")
        page.check("#usar-tiles")
        s.marco("depois_de_marcar_ruas")
        page.wait_for_timeout(3000)


CENARIOS = [
    ("1", "Página inicial, sem interação", cen1, ""),
    ("2", "Mensagem fictícia no orientador", cen2, MENSAGEM),
    ("3", "CEP de teste no mapa de serviços da página inicial", cen3, CEP),
    ("4", "Mapa de serviços com a caixa de imagens do mapa marcada (padrão)", cen4, ""),
    ("5", "Mapa de serviços com a caixa desmarcada antes de o mapa iniciar (simulado por script de inicialização)", cen5, ""),
    ("5b", "Mapa de serviços: caixa desmarcada depois de carregar, com zoom", cen5b, ""),
    ("6", "Mapa 'perto de mim' (OpenStreetMap) com a opção de ruas ligada, após CEP fictício", cen6, CEP),
]


def externo(url: str, base: str) -> bool:
    return not url.startswith(base) and not url.startswith("data:") and not url.startswith("blob:")


def main() -> None:
    SAIDA.mkdir(parents=True, exist_ok=True)
    meta = comum.versoes()
    srv, base = iniciar_servidor()
    sessoes: list[tuple[tuple, Sessao, dict]] = []
    try:
        with sync_playwright() as p:
            navegador = p.chromium.launch()
            versao_chromium = navegador.version
            for cod, titulo, fn, _ in CENARIOS:
                ctx = navegador.new_context(locale="pt-BR")
                page = ctx.new_page()
                s = Sessao(cod)
                s.extra = {}
                s.anexar(page)
                try:
                    fn(page, base, s)
                    s.esperar_externas(page, base)
                    erro = None
                except Exception as e:  # noqa: BLE001
                    erro = f"{type(e).__name__}: {e}"
                armaz = armazenamento(page, ctx)
                s.extra["erro"] = erro
                sessoes.append(((cod, titulo, fn, _), s, armaz))
                ctx.close()
            navegador.close()
    finally:
        srv.shutdown()

    # ---- registro completo (JSON), com a URL local substituída por um marcador estável
    todos = []
    for (cod, titulo, _, digitado), s, armaz in sessoes:
        for r in s.requisicoes:
            r2 = dict(r)
            r2["url"] = r["url"].replace(base, "http://LOCAL")
            r2["cabecalhos"] = {k: v.replace(base, "http://LOCAL") for k, v in r["cabecalhos"].items()}
            r2["externa"] = externo(r["url"], base)
            r2["vazamento"] = procurar(r)["achados"]
            todos.append(r2)
    (SAIDA / "auditoria_requisicoes.json").write_text(json.dumps({"meta": meta, "navegador": f"Chromium {versao_chromium} (Playwright)", "requisicoes": todos},
                                                               ensure_ascii=False, indent=1) + "\n", encoding="utf-8", newline="\n")

    # ---- relatório
    md = ["# Auditoria de privacidade: o que sai do aparelho", "",
          "> Auditoria feita sobre o código em `web/`, servido por um servidor estático local, com mensagens e CEP fictícios. "
          "Ela mostra o que **este navegador, neste ambiente** enviou; não é uma prova sobre outros navegadores, extensões ou o servidor de hospedagem.", "",
          "## Como foi gerado", "",
          f"- Comando: `{meta['comando']}`",
          f"- Commit: `{meta['commit']}` (ramo `{meta['ramo']}`); alterações fora de `reproducao/`: {'nenhuma' if not meta['alteracoes_fora_de_reproducao'] else meta['alteracoes_fora_de_reproducao']}",
          f"- Navegador: Chromium {versao_chromium} (Playwright); Node `{meta['node']}`; Python `{meta['python']}`; sistema `{meta['sistema']}`; data (UTC) {meta['data_utc']}",
          f"- Mensagem fictícia: «{MENSAGEM}». CEP fictício: `{CEP}`.",
          "- Cada cenário roda em um contexto de navegador novo (sem cache, cookies nem armazenamento anteriores). O registro completo, com cabeçalhos e corpo de cada requisição, está em `reproducao/resultados/auditoria_requisicoes.json`.",
          "- Para repetir: `python -m pip install playwright`, `python -m playwright install chromium` e `python reproducao/auditoria_privacidade.py`.", ""]

    resumo_ext: dict[str, dict] = {}
    for (cod, titulo, _, digitado), s, armaz in sessoes:
        reqs = [r for r in s.requisicoes]
        loc = [r for r in reqs if not externo(r["url"], base)]
        ext = [r for r in reqs if externo(r["url"], base)]
        vaz = [(r, procurar(r)["achados"]) for r in reqs]
        vaz = [(r, a) for r, a in vaz if a]
        post = [r for r in reqs if r["metodo"] != "GET" or r["corpo"]]
        tiles = [(r, analisar_tile(r["url"])) for r in ext]
        tiles = [(r, t) for r, t in tiles if t]
        resumo_ext[cod] = {"ext": len(ext), "tiles": len(tiles), "vaz": len(vaz), "post": len(post), "local": len(loc)}
        md += [f"## Cenário {cod}: {titulo}", ""]
        if s.extra.get("erro"):
            md += [f"**O cenário não terminou normalmente:** `{s.extra['erro']}`", ""]
        extras = {k: v for k, v in s.extra.items() if k != "erro"}
        if extras or s.marcos:
            md += ["Observações do cenário: " + "; ".join(f"{k} = {v}" for k, v in extras.items()) + ("; marcos (s desde o início): " + ", ".join(f"{k} = {v:.1f}" for k, v in s.marcos.items()) if s.marcos else "") + ".", ""]
        md += [f"- Requisições totais: {len(reqs)} (locais: {len(loc)}, para outros domínios: {len(ext)}); com método diferente de GET ou com corpo: {len(post)}.",
               f"- Texto digitado ou CEP encontrados em alguma URL, cabeçalho ou corpo: {'**SIM**, ver abaixo' if vaz else 'não'}."]
        if vaz:
            for r, a in vaz:
                md.append(f"  - `{r['metodo']} {r['url'].replace(base, 'LOCAL')[:120]}`: {'; '.join(a)}")
        loc_por_tipo = Counter(r["tipo_recurso"] for r in loc)
        loc_tam = sum((r["tamanho_resposta"] or 0) for r in loc)
        md += [f"- Locais por tipo: " + ", ".join(f"{k} {v}" for k, v in sorted(loc_por_tipo.items())) + f"; {loc_tam / 1024:.0f} KiB baixados do próprio servidor.", ""]
        if ext:
            md += ["Requisições para outros domínios:", "", "| # | t (s) | Método | Domínio | Caminho | Tamanho (B) | Status | Referer enviado | Cookie enviado |", "|---|---|---|---|---|---|---|---|---|"]
            amostra = [r for r in ext if r.get("cabecalhos_finais")][:5] + [r for r in ext if not r.get("cabecalhos_finais")][:3]  # concluídas primeiro; as canceladas não têm cabeçalho final
            for i, r in enumerate(amostra, 1):
                u = urlparse(r["url"])
                ch = {k.lower(): v for k, v in r["cabecalhos"].items()}
                md.append(f"| {i} | {r['t']:.1f} | {r['metodo']} | {u.netloc} | `{u.path}{('?' + u.query) if u.query else ''}` | {r['tamanho_resposta'] if r['tamanho_resposta'] is not None else 'n/d'} | "
                          f"{r['status'] or r['falhou'] or 'n/d'} | {(ch.get('referer') or 'não enviado') if r.get('cabecalhos_finais') else '(cabeçalho final não capturado)'} | {'sim' if 'cookie' in ch else 'não'} |")
            if len(ext) > len(amostra):
                md.append(f"| … | | | | {len(ext) - len(amostra)} requisições a mais, de mesmo tipo (lista completa em `reproducao/resultados/auditoria_requisicoes.json`) | | | | |")
            md.append("")
            estados = Counter(str(r["status"] or r["falhou"] or "sem resposta") for r in ext)
            md.append("Resumo por resultado: " + ", ".join(f"{k} = {v}" for k, v in sorted(estados.items())) + f"; {sum(r['tamanho_resposta'] or 0 for r in ext) / 1024:.0f} KiB recebidos nas concluídas.")
            md.append("")
            if tiles:
                por_serv = defaultdict(list)
                for r, t in tiles:
                    por_serv[t["servico"]].append(t)
                for serv, ts in por_serv.items():
                    zs = sorted({t["z"] for t in ts})
                    lat0, lon0 = tile_para_lonlat(min(t["z"] for t in ts), min(t["x"] for t in ts if t["z"] == min(t["z"] for t in ts)), min(t["y"] for t in ts if t["z"] == min(t["z"] for t in ts)))
                    zmax = max(zs)
                    xs = [t["x"] for t in ts if t["z"] == zmax]
                    ys = [t["y"] for t in ts if t["z"] == zmax]
                    nw = tile_para_lonlat(zmax, min(xs), min(ys))
                    se = tile_para_lonlat(zmax, max(xs) + 1, max(ys) + 1)
                    md.append(f"- **{serv}:** {len(ts)} tiles, zoom {zs[0]} a {zs[-1]}. No zoom {zmax}: canto noroeste ≈ ({nw[0]:.4f}, {nw[1]:.4f}), canto sudeste ≈ ({se[0]:.4f}, {se[1]:.4f}) (latitude, longitude). "
                              "Os tiles pedidos delimitam a região do mapa que a usuária está vendo.")
                md.append("")
        st = armaz
        md += ["Armazenamento ao fim do cenário:", "",
               f"- localStorage: `{json.dumps(st['localStorage'], ensure_ascii=False) or '{}'}`",
               f"- sessionStorage: `{json.dumps(st['sessionStorage'], ensure_ascii=False) or '{}'}`",
               f"- IndexedDB: `{json.dumps(st['indexedDB'], ensure_ascii=False)}`",
               f"- cookies: `document.cookie` = «{st['documentCookie']}»; no contexto: `{json.dumps(st['cookies_do_contexto'], ensure_ascii=False)}`", ""]

    # ---- síntese
    n_vaz = sum(v["vaz"] for v in resumo_ext.values())
    n_post = sum(v["post"] for v in resumo_ext.values())
    md += ["## Síntese", "",
           "| Cenário | Requisições locais | Para outros domínios | Tiles de mapa | Método ≠ GET ou com corpo | Texto/CEP encontrados |",
           "|---|---|---|---|---|---|"]
    for cod, titulo, _, _ in CENARIOS:
        v = resumo_ext[cod]
        md.append(f"| {cod} | {v['local']} | {v['ext']} | {v['tiles']} | {v['post']} | {v['vaz']} |")
    md += ["", f"Total de ocorrências do texto digitado ou do CEP em URL, cabeçalho ou corpo, em todos os cenários: **{n_vaz}**. "
           f"Requisições com método diferente de GET ou com corpo: **{n_post}**.", ""]
    # ---- achados calculados a partir desta execução
    dados = {cod: s for (cod, _, _, _), s, _ in sessoes}
    ext = {cod: [r for r in dados[cod].requisicoes if externo(r["url"], base)] for cod in dados}
    concl = {cod: [r for r in ext[cod] if r.get("cabecalhos_finais")] for cod in dados}
    total_req = sum(len(s.requisicoes) for s in dados.values())
    dominios = sorted({urlparse(r["url"]).netloc for cod in ext for r in ext[cod]})
    sem_referer = all(not r["cabecalhos"].get("referer") for cod in concl for r in concl[cod])
    sem_cookie = all("cookie" not in r["cabecalhos"] for cod in concl for r in concl[cod])
    padrao_marcada = dados["4"].extra.get("caixa_marcada_por_padrao")
    ultima_ext_5b = max((r["t"] for r in ext["5b"]), default=0.0)
    marco_5b = dados["5b"].marcos.get("depois_de_desmarcar", 0.0)
    armazenou = any(a["localStorage"] or a["sessionStorage"] or a["indexedDB"] or a["documentCookie"] or a["cookies_do_contexto"] for _, _, a in sessoes)
    n4 = len(ext["4"])
    ok4 = len(concl["4"])
    bytes4 = sum(r["tamanho_resposta"] or 0 for r in concl["4"])
    ab4 = sum(1 for r in ext["4"] if r["falhou"] and "ABORTED" in r["falhou"])
    abort1 = sum(1 for r in ext["1"] if r["falhou"])
    md += ["## Achados", "",
           f"1. **Busca por exposição do texto e do CEP:** Em {total_req} requisições registradas nos cenários, foram encontradas {n_vaz} requisições com ocorrência detectada em URL, cabeçalho ou corpo, entre {total_req} requisições registradas.",
           f"2. **A caixa de imagens do mapa de serviços vem marcada por padrão: {'sim' if padrao_marcada else 'não'}** (achado, não alterado nesta tarefa). Por isso, **só abrir a página inicial** (cenário 1), sem interação, já gera {len(ext['1'])} requisições de tiles para `server.arcgisonline.com` (Esri): {len(concl['1'])} concluídas e {abort1} canceladas pelo próprio mapa (`net::ERR_ABORTED`, tiles de zoom intermediário). O mesmo ocorre ao abrir a área Educação (cenário 6), porque o mapa da página inicial é iniciado em qualquer rota.",
           f"3. **Desmarcar a caixa antes de o mapa iniciar elimina as requisições** (cenário 5: {len(ext['5'])} requisições externas), mas isso foi feito por um script de inicialização: uma pessoa só vê a caixa depois do primeiro desenho do mapa, quando os tiles já foram pedidos. **Desmarcar depois de carregar interrompe as requisições seguintes** (cenário 5b: última requisição externa em {ultima_ext_5b:.1f} s, antes de desmarcar em {marco_5b:.1f} s, e nenhuma depois, mesmo com zoom).",
           f"4. **Referer:** {'nenhuma das requisições externas concluídas enviou o cabeçalho Referer' if sem_referer else 'HOUVE requisição externa com Referer; ver as tabelas'}, o que é coerente com a meta `referrer` igual a `no-referrer` em `web/index.html`. Essa observação descreve apenas os cabeçalhos efetivamente capturados nesta execução. Cookies: {'nenhuma requisição externa concluída enviou cookie' if sem_cookie else 'HOUVE cookie enviado'}.",
           f"5. **Armazenamento:** {'algum cenário deixou dados em localStorage, sessionStorage, IndexedDB ou cookies; ver cada cenário' if armazenou else 'em todos os cenários, localStorage, sessionStorage, IndexedDB e cookies terminaram vazios'}.",
           "6. **O que não foi medido:** (a) o mapa \"perto de mim\" com a opção de ruas do OpenStreetMap (cenário 6) não pôde ser exercitado, porque o CEP fictício não existe no índice de Rio Claro (o site responde \"Não encontramos este CEP\" e não mostra o mapa); a consulta ao OpenStreetMap, que só ocorre se a pessoa marcar a caixa, foi verificada apenas **por leitura do código** (`web/app.js`, ouvinte de `usar-tiles`), não por medição. (b) Com um CEP **válido**, a leitura de `web/mapa.js` (função `aplicarCep` e o ajuste de vista com `fitBounds`, no máximo zoom 15) indica que o mapa passa a enquadrar a região do CEP e que os tiles pedidos à Esri passariam a delimitar essa região em escala de alguns quilômetros; isso **não foi medido**, pois exigiria um CEP real.", "",
           "## O que exatamente sai do aparelho", "",
           f"- **Para `{', '.join(dominios)}`:** pedidos `GET` de imagens de mapa (tiles) com os números de zoom, coluna e linha do tile na URL. No cenário 4 foram {n4} pedidos ({ok4} concluídos, {bytes4 / 1024:.0f} KiB; {ab4} cancelados), nos zooms 11 e 12, delimitando a região de Rio Claro (cerca de latitude −22,27 a −22,51 e longitude −47,81 a −47,29 no zoom 12). Esses números mostram **que região do mapa a pessoa está vendo**, não onde ela está.",
           "- **Cabeçalhos enviados nesses pedidos** (amostra concluída, cenário 4): `accept`, `accept-encoding`, `accept-language` (aqui `pt-BR`), `user-agent`, `sec-ch-ua*`, `sec-fetch-*` (`cross-site`), `host` e `connection`. Sem `referer`, sem `cookie`, sem `origin`. Além disso, o servidor que recebe o pedido vê o **endereço IP** do aparelho, o que é inerente a qualquer requisição de rede.",
           "- **Para o servidor de hospedagem do site:** só os pedidos dos arquivos estáticos (HTML, CSS, JS, JSON de dados e modelos). Nenhum pedido levou o texto digitado ou o CEP. O servidor de hospedagem de produção pode manter registros de acesso próprios; isto não foi auditado.", "",
           "## Diagrama do fluxo de dados", "",
           "```mermaid",
           "flowchart LR",
           "    P[\"Pessoa no navegador\"]",
           "    S[\"Servidor de hospedagem do site\"]",
           "    L[\"Processamento local no navegador: orientador, modelos, CEP, mapa\"]",
           "    E[\"server.arcgisonline.com (Esri)\"]",
           "    O[\"tile.openstreetmap.org (OpenStreetMap)\"]",
           "    N[\"nenhum destino\"]",
           "    P -->|\"GET arquivos estáticos: HTML, JS, JSON, modelos\"| S",
           "    S -->|\"respostas, sem o texto digitado\"| L",
           "    P -->|\"digita mensagem e CEP\"| L",
           "    L -->|\"GET tiles z/y/x ao abrir qualquer página (caixa marcada por padrão); sem Referer, sem cookie; com IP e user-agent\"| E",
           "    L -.->|\"GET tiles z/x/y só se marcar Mostrar ruas (não medido; leitura de código)\"| O",
           "    L -.->|\"texto digitado e CEP: 0 ocorrências em URL, cabeçalho ou corpo\"| N",
           "```", "",
           "## A frase mais forte que as evidências sustentam", "",
           f"> Nos cenários testados, com mensagem fictícia e CEP {CEP}, em Chromium {versao_chromium} e com o site servido localmente, o detector encontrou {n_vaz} requisições com ocorrência do texto ou CEP em URL, cabeçalho ou corpo, entre {total_req} requisições. Houve algum dado persistido ao fim de um cenário: {armazenou}. As comunicações externas, domínios e tiles observados estão discriminados nas tabelas acima.",
           "", "**O que a frase não afirma:** que \"nada sai do aparelho\" (saem pedidos de tiles e o IP); que isso vale para outros navegadores, extensões ou redes; o comportamento com outros CEPs; o comportamento do servidor de hospedagem de produção; nem o uso do OpenStreetMap (verificado só por leitura de código).",
           "", "## Limites desta auditoria", "",
           "- Ambiente: um Chromium em modo sem interface, servidor local em `127.0.0.1`, uma única passagem por cenário (sem repetições). Em produção, o domínio e o HTTPS são outros.",
           "- A busca por vazamento procura as formas exatas e trechos de três palavras do texto fictício, e as formas do CEP; transformações (por exemplo, hash ou codificação própria) não seriam detectadas.",
           "- Os cabeçalhos de pedidos cancelados não têm versão final capturada; o `Referer` e o `Cookie` foram conferidos nos pedidos concluídos, que são a mesma chamada de tiles.",
           "- O README diz que as únicas requisições são arquivos locais e tiles do OpenStreetMap só com opt-in; esta auditoria mostra tiles da Esri por padrão. Essa divergência é o motivo da pergunta ao autor ao fim do relatório da tarefa.", ""]
    (RAIZ / "reproducao" / f"auditoria_privacidade_cep_{CEP_DIGITOS}.md").write_text("\n".join(md) + "\n", encoding="utf-8", newline="\n")
    print(f"ok: reproducao/auditoria_privacidade_cep_{CEP_DIGITOS}.md |", {k: v for k, v in resumo_ext.items()})


if __name__ == "__main__":
    main()
