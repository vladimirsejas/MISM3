"""Auditoria de rede com CEP de equipamento público e as imagens de mapa LIGADAS (Playwright, Chromium).

Complementa reproducao/auditoria_privacidade_cep.py (que não foi alterado). Aquele script não marca a caixa da Esri antes de buscar o CEP
e, desde o commit e87a272, a caixa "Mostrar ruas e nomes" vem desmarcada: nos cenários 1 a 5b dele não há requisição externa. Este script mede o que
acontece quando a pessoa MARCA a caixa. Só mede e descreve; não interpreta risco.

Cenários, cada um em um contexto de navegador novo (sem cache, cookies nem armazenamento):
  A  página inicial; MARCA a caixa #usar-tiles-mapa; digita o CEP em #cep-mapa; Enter; aguarda; aproxima o zoom; move o mapa; recarrega.
  B  página inicial; digita o CEP em #cep-mapa; Enter; MARCA a caixa depois; aguarda; aproxima o zoom; move o mapa; recarrega.
  C  área Educação, "perto de mim" (OpenStreetMap): busca pelo CEP em #cep; marca #usar-tiles depois do resultado; aproxima o zoom; move o mapa; recarrega.
Cada ação inicia uma "fase"; cada requisição é atribuída à fase em que foi feita.

Para cada fase mede: requisições totais e externas por domínio (Esri e OpenStreetMap separados); níveis de zoom e retângulo geográfico dos tiles pedidos
(cantos noroeste e sudeste e extensão em km); se o texto digitado, o CEP ou as coordenadas do CEP aparecem em URL, cabeçalho ou corpo; método diferente de
GET ou corpo; e, ao fim e depois de recarregar, cookies, localStorage, sessionStorage, IndexedDB, Cache Storage e Service Workers.

Uso local (informe um CEP de teste explicitamente; PLAYWRIGHT_BROWSERS_PATH se necessário):
    MISM3_AUDIT_CEP=<CEP_DE_TESTE> python reproducao/auditoria_privacidade_cep_tiles_ligados.py
    python reproducao/auditoria_privacidade_cep_tiles_ligados.py --resumo
As saídas detalhadas ficam no diretório temporário do sistema (ou em MISM3_AUDIT_OUTPUT_DIR), nunca no repositório público.
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
import tempfile
from collections import Counter, defaultdict
from pathlib import Path
from urllib.parse import unquote_plus, urlparse

sys.path.insert(0, str(Path(__file__).resolve().parent))
import comum  # noqa: E402

RAIZ = comum.RAIZ
WEB = RAIZ / "web"
RES = Path(os.environ.get("MISM3_AUDIT_OUTPUT_DIR", tempfile.gettempdir())) / "mism3_auditoria_privacidade" / "resultados"
MENSAGEM = "Preciso de ajuda fictícia para a vaga de creche da pequena Zorzalina Quimérica"
EM_MODO_RESUMO = "--resumo" in sys.argv

if not EM_MODO_RESUMO:
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:  # pragma: no cover
        sys.exit("Playwright não está instalado: python -m pip install playwright && python -m playwright install chromium")
    CEP = os.environ.get("MISM3_AUDIT_CEP", "").strip()
    if not CEP:
        sys.exit("Defina MISM3_AUDIT_CEP com um CEP de teste em ambiente local; nenhum CEP padrão é embutido no repositório.")
    CEP_DIGITOS = re.sub(r"\D", "", CEP)
    if not re.fullmatch(r"\d{8}", CEP_DIGITOS):
        sys.exit("CEP inválido. Informe oito dígitos em MISM3_AUDIT_CEP.")
    CEP = CEP_DIGITOS[:5] + "-" + CEP_DIGITOS[5:]
    CEP_PREFIXO = CEP_DIGITOS[:5]
    _idx = json.loads((WEB / "dados" / "cep_indice.json").read_text(encoding="utf-8"))["ceps"].get(CEP_DIGITOS)
    CEP_LAT, CEP_LON, CEP_RAIO = (_idx[0], _idx[1], _idx[2]) if _idx else (None, None, None)
    SAIDA = RES / "auditoria_cep_tiles_ligados_local"


# ---------------------------------------------------------------- servidor estático local
class _Silencioso(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


def iniciar_servidor() -> tuple[socketserver.TCPServer, str]:
    handler = functools.partial(_Silencioso, directory=str(WEB))
    srv = socketserver.ThreadingTCPServer(("127.0.0.1", 0), handler)
    srv.daemon_threads = True
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, f"http://127.0.0.1:{srv.server_address[1]}"


# ---------------------------------------------------------------- busca por exposição: texto, CEP e coordenadas do CEP
def _norm(s: str) -> str:
    return unquote_plus(s or "").lower()


def _trechos(texto: str, n: int = 3) -> list[str]:
    ps = re.findall(r"\w+", texto.lower())
    return [" ".join(ps[i:i + n]) for i in range(len(ps) - n + 1)]


def procurar(req: dict) -> dict:
    """Separa: texto digitado, CEP (exato ou prefixo) e coordenadas do CEP, em URL, cabeçalhos e corpo."""
    partes = {"url": _norm(req["url"]), "cabecalhos": _norm(json.dumps(req["cabecalhos"], ensure_ascii=False)), "corpo": _norm(req["corpo"] or "")}
    texto, cep, coord = [], [], []
    for nome, h in partes.items():
        h_sem = h.replace("+", " ")
        if MENSAGEM.lower() in h_sem:
            texto.append(f"mensagem exata em {nome}")
        for t in _trechos(MENSAGEM):
            if t in h_sem:
                texto.append(f"trecho de 3 palavras '{t}' em {nome}")
        if CEP in h or CEP_DIGITOS in h:
            cep.append(f"CEP exato em {nome}")
        elif CEP_PREFIXO in h:
            cep.append(f"prefixo do CEP ({CEP_PREFIXO}) em {nome}")
        if CEP_LAT is not None:
            la, lo = f"{abs(CEP_LAT):.3f}", f"{abs(CEP_LON):.3f}"
            if la in h and lo in h:
                coord.append(f"latitude e longitude do CEP (3 casas) em {nome}")
    return {"texto": sorted(set(texto)), "cep": sorted(set(cep)), "coordenadas": sorted(set(coord))}


# ---------------------------------------------------------------- tiles e retângulos
def tile_para_lonlat(z: int, x: int, y: int) -> tuple[float, float]:
    n = 2 ** z
    return math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * y / n)))), x / n * 360 - 180


def haversine_km(a, b, c, d) -> float:
    p = math.pi / 180
    h = math.sin((c - a) * p / 2) ** 2 + math.cos(a * p) * math.cos(c * p) * math.sin((d - b) * p / 2) ** 2
    return 2 * 6371.0088 * math.asin(math.sqrt(h))


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


def retangulo(ts: list[dict]) -> dict:
    """Zoom (mínimo e máximo), contagem por zoom e retângulo dos tiles no zoom máximo, com a extensão em km."""
    zs = sorted({t["z"] for t in ts})
    zmax = zs[-1]
    xs = [t["x"] for t in ts if t["z"] == zmax]
    ys = [t["y"] for t in ts if t["z"] == zmax]
    nw = tile_para_lonlat(zmax, min(xs), min(ys))
    se = tile_para_lonlat(zmax, max(xs) + 1, max(ys) + 1)
    lat_c = (nw[0] + se[0]) / 2
    lon_c = (nw[1] + se[1]) / 2
    r = {"tiles": len(ts), "zoom_min": zs[0], "zoom_max": zmax, "por_zoom": {str(z): sum(1 for t in ts if t["z"] == z) for z in zs},
         "noroeste": [round(nw[0], 4), round(nw[1], 4)], "sudeste": [round(se[0], 4), round(se[1], 4)],
         "largura_km": round(haversine_km(lat_c, nw[1], lat_c, se[1]), 2), "altura_km": round(haversine_km(nw[0], lon_c, se[0], lon_c), 2)}
    cl, co = globals().get("CEP_LAT"), globals().get("CEP_LON")
    if cl is not None:  # só descrição: o ponto do CEP (índice) está dentro do retângulo e a quantos km do centro dele
        r["cep_dentro_do_retangulo"] = bool(se[0] <= cl <= nw[0] and nw[1] <= co <= se[1])
        r["cep_a_km_do_centro"] = round(haversine_km(cl, co, lat_c, lon_c), 2)
    return r


# ---------------------------------------------------------------- coleta de uma sessão
class Sessao:
    def __init__(self, nome: str):
        self.nome = nome
        self.requisicoes: list[dict] = []
        self.t0 = time.time()
        self.fases: list[tuple[str, float]] = []
        self.extra: dict = {}
        self.armazenamento: dict[str, dict] = {}

    def fase(self, rotulo: str) -> None:
        self.fases.append((rotulo, time.time() - self.t0))

    def fase_de(self, t: float) -> str:
        atual = "antes_da_primeira_acao"
        for nome, ini in self.fases:
            if ini <= t:
                atual = nome
        return atual

    def esperar_externas(self, page, base: str, limite: float = 25.0) -> None:
        fim = time.time() + limite
        while time.time() < fim:
            pend = [r for r in self.requisicoes if not r["url"].startswith(base) and r["status"] is None and r["falhou"] is None]
            if not pend:
                return
            page.wait_for_timeout(500)

    def anexar(self, page) -> None:
        def ao_requisitar(req):
            reg = {"cenario": self.nome, "t": round(time.time() - self.t0, 3), "url": req.url, "metodo": req.method, "tipo_recurso": req.resource_type,
                   "cabecalhos": dict(req.headers), "corpo": req.post_data, "tamanho_resposta": None, "status": None, "falhou": None, "cabecalhos_finais": False}
            req._reg = reg  # noqa: SLF001
            self.requisicoes.append(reg)

        def ao_terminar(req):
            reg = getattr(req, "_reg", None)
            if not reg:
                return
            try:
                reg["cabecalhos"] = req.all_headers()
                reg["cabecalhos_finais"] = True
                reg["tamanho_resposta"] = req.sizes()["responseBodySize"]
                resp = req.response()
                reg["status"] = resp.status if resp else None
            except Exception:  # noqa: BLE001
                pass

        def ao_falhar(req):
            reg = getattr(req, "_reg", None)
            if reg:
                reg["falhou"] = str(req.failure)

        page.on("request", ao_requisitar)
        page.on("requestfinished", ao_terminar)
        page.on("requestfailed", ao_falhar)


JS_ARMAZENAMENTO = """async () => {
  const ls = {}, ss = {};
  for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); ls[k] = localStorage.getItem(k); }
  for (let i = 0; i < sessionStorage.length; i++) { const k = sessionStorage.key(i); ss[k] = sessionStorage.getItem(k); }
  let idb = [], caches_ = [], sw = [];
  try { idb = (await indexedDB.databases()).map(d => d.name + ' v' + d.version); } catch (e) { idb = ['indisponível: ' + e]; }
  try { const nomes = await caches.keys(); for (const n of nomes) { const c = await caches.open(n); caches_.push(n + ': ' + (await c.keys()).length + ' entradas'); } } catch (e) { caches_ = ['indisponível: ' + e]; }
  try { sw = (await navigator.serviceWorker.getRegistrations()).map(r => r.scope); } catch (e) { sw = ['indisponível: ' + e]; }
  return { localStorage: ls, sessionStorage: ss, indexedDB: idb, cacheStorage: caches_, serviceWorkers: sw, documentCookie: document.cookie };
}"""


def capturar_armazenamento(page, ctx) -> dict:
    d = page.evaluate(JS_ARMAZENAMENTO)
    d["cookies_do_contexto"] = [{"name": c["name"], "domain": c["domain"]} for c in ctx.cookies()]
    return d


# ---------------------------------------------------------------- interações
def aproximar_zoom(page, mapa: str, vezes: int = 3) -> int:
    botao = page.locator(f"{mapa} .leaflet-control-zoom-in")
    if not botao.count():
        return 0
    for _ in range(vezes):
        botao.first.click()
        page.wait_for_timeout(900)
    return vezes


def mover_mapa(page, mapa: str) -> bool:
    caixa = page.locator(mapa).bounding_box()
    if not caixa:
        return False
    cx, cy = caixa["x"] + caixa["width"] / 2, caixa["y"] + caixa["height"] / 2
    page.mouse.move(cx, cy)
    page.mouse.down()
    page.mouse.move(cx - 140, cy - 90, steps=10)
    page.mouse.up()
    page.wait_for_timeout(1200)
    return True


def pausa(page, s, base):
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(1500)
    s.esperar_externas(page, base, 20.0)


def fim_comum(page, ctx, s, base, mapa: str):
    s.fase("zoom")
    s.extra["cliques_de_zoom"] = aproximar_zoom(page, mapa)
    pausa(page, s, base)
    s.fase("mover")
    s.extra["mapa_movido"] = mover_mapa(page, mapa)
    pausa(page, s, base)
    s.armazenamento["antes_da_recarga"] = capturar_armazenamento(page, ctx)
    s.fase("recarga")
    page.reload()
    pausa(page, s, base)
    s.armazenamento["depois_da_recarga"] = capturar_armazenamento(page, ctx)


def cen_a(page, ctx, base, s):
    s.fase("carga")
    page.goto(base + "/index.html")
    page.wait_for_selector("#usar-tiles-mapa", state="attached")
    s.extra["caixa_esri_marcada_ao_abrir"] = page.is_checked("#usar-tiles-mapa")
    pausa(page, s, base)
    s.fase("marcar_caixa")
    page.locator("#mapa-servicos").scroll_into_view_if_needed()
    page.check("#usar-tiles-mapa")
    pausa(page, s, base)
    s.fase("digitar_cep")
    page.fill("#cep-mapa", CEP)
    page.press("#cep-mapa", "Enter")
    pausa(page, s, base)
    s.extra["mensagem_do_site"] = page.inner_text("#mensagem-mapa") if page.locator("#mensagem-mapa").is_visible() else "(sem mensagem)"
    fim_comum(page, ctx, s, base, "#mapa-servicos")


def cen_b(page, ctx, base, s):
    s.fase("carga")
    page.goto(base + "/index.html")
    page.wait_for_selector("#usar-tiles-mapa", state="attached")
    s.extra["caixa_esri_marcada_ao_abrir"] = page.is_checked("#usar-tiles-mapa")
    pausa(page, s, base)
    s.fase("digitar_cep")
    page.locator("#mapa-servicos").scroll_into_view_if_needed()
    page.fill("#cep-mapa", CEP)
    page.press("#cep-mapa", "Enter")
    pausa(page, s, base)
    s.extra["mensagem_do_site"] = page.inner_text("#mensagem-mapa") if page.locator("#mensagem-mapa").is_visible() else "(sem mensagem)"
    s.fase("marcar_caixa")
    page.check("#usar-tiles-mapa")
    pausa(page, s, base)
    fim_comum(page, ctx, s, base, "#mapa-servicos")


def cen_c(page, ctx, base, s):
    s.fase("carga")
    page.goto(base + "/index.html#educacao")
    page.wait_for_selector("#busca-por-cep", state="attached")
    pausa(page, s, base)
    s.extra["busca_por_cep_visivel"] = page.locator("#busca-por-cep").is_visible()
    if not s.extra["busca_por_cep_visivel"]:
        return
    s.fase("digitar_cep")
    page.click("#busca-por-cep summary")
    page.fill("#cep", CEP)
    page.press("#cep", "Enter")
    pausa(page, s, base)
    s.extra["resultado_com_mapa_visivel"] = page.locator("#resultado").is_visible()
    s.extra["mensagem_do_site"] = page.inner_text("#mensagem") if page.locator("#mensagem").is_visible() else "(sem mensagem)"
    if not s.extra["resultado_com_mapa_visivel"]:
        return
    s.extra["caixa_osm_marcada_antes"] = page.is_checked("#usar-tiles")
    s.fase("marcar_caixa")
    page.check("#usar-tiles")
    pausa(page, s, base)
    fim_comum(page, ctx, s, base, "#mapa")


CENARIOS = [
    ("A", "Caixa da Esri marcada primeiro; depois o CEP (página inicial)", cen_a),
    ("B", "CEP primeiro; caixa da Esri marcada depois (página inicial)", cen_b),
    ("C", "Mapa 'perto de mim' (OpenStreetMap): CEP, depois caixa de ruas marcada", cen_c),
]


def externo(url: str, base: str) -> bool:
    return not url.startswith(base) and not url.startswith("data:") and not url.startswith("blob:")


def dominio_rotulo(url: str) -> str:
    h = urlparse(url).netloc
    return "Esri" if "arcgisonline" in h else "OpenStreetMap" if "openstreetmap" in h else h


# ---------------------------------------------------------------- uma execução
def medir() -> None:
    SAIDA.mkdir(parents=True, exist_ok=True)
    meta = comum.versoes()
    srv, base = iniciar_servidor()
    sessoes = []
    try:
        with sync_playwright() as p:
            navegador = p.chromium.launch()
            versao = navegador.version
            for cod, titulo, fn in CENARIOS:
                ctx = navegador.new_context(locale="pt-BR", viewport={"width": 1280, "height": 1000})
                page = ctx.new_page()
                s = Sessao(cod)
                s.anexar(page)
                try:
                    fn(page, ctx, base, s)
                    s.esperar_externas(page, base)
                    erro = None
                except Exception as e:  # noqa: BLE001
                    erro = f"{type(e).__name__}: {e}"
                s.extra["erro"] = erro
                if "depois_da_recarga" not in s.armazenamento:
                    try:
                        s.armazenamento["ao_terminar"] = capturar_armazenamento(page, ctx)
                    except Exception as e:  # noqa: BLE001
                        s.armazenamento["ao_terminar"] = {"erro": str(e)}
                sessoes.append((cod, titulo, s))
                ctx.close()
            navegador.close()
    finally:
        srv.shutdown()

    registro, resumo = [], {"cep": CEP, "cep_lat": CEP_LAT, "cep_lon": CEP_LON, "cep_raio_m": CEP_RAIO, "commit": meta["commit"], "cenarios": {}}
    md = [f"# Auditoria de rede com CEP de equipamento público e imagens de mapa ligadas: CEP {CEP}", "",
          "> Só medição e descrição. Não interpreta risco. Ambiente: Chromium em modo sem interface, servidor local em `127.0.0.1`, uma passagem por cenário.", "",
          "## Como foi gerado", "",
          f"- Comando: `MISM3_AUDIT_CEP={CEP} {meta['comando']}`",
          f"- Commit: `{meta['commit']}` (ramo `{meta['ramo']}`); alterações fora de `reproducao/`: {'nenhuma' if not meta['alteracoes_fora_de_reproducao'] else meta['alteracoes_fora_de_reproducao']}",
          f"- Navegador: Chromium {versao} (Playwright); Node `{meta['node']}`; Python `{meta['python']}`; sistema `{meta['sistema']}`; data (UTC) {meta['data_utc']}",
          f"- CEP: `{CEP}` (CEP de um equipamento público). No índice `web/dados/cep_indice.json`: latitude {CEP_LAT}, longitude {CEP_LON}, raio {CEP_RAIO} m.",
          f"- Mensagem de teste (não usada nestes cenários): «{MENSAGEM}».", ""]
    for cod, titulo, s in sessoes:
        for r in s.requisicoes:
            r2 = dict(r)
            r2["url"] = r["url"].replace(base, "http://LOCAL")
            r2["cabecalhos"] = {k: v.replace(base, "http://LOCAL") for k, v in r["cabecalhos"].items()}
            r2["externa"] = externo(r["url"], base)
            r2["fase"] = s.fase_de(r["t"])
            r2["exposicao"] = procurar(r)
            registro.append(r2)
        md += [f"## Cenário {cod}: {titulo}", ""]
        if s.extra.get("erro"):
            md += [f"**O cenário não terminou normalmente:** `{s.extra['erro']}`", ""]
        md += ["Observações: " + "; ".join(f"{k} = {v}" for k, v in s.extra.items() if k != "erro") + ".", "",
               "Fases (segundos desde o início): " + ", ".join(f"{n} = {t:.1f}" for n, t in s.fases) + ".", ""]
        nomes_fases = [n for n, _ in s.fases]
        md += ["| Fase | Requisições | Locais | Externas | Esri | OpenStreetMap | Concluídas / canceladas | Texto | CEP | Coordenadas do CEP | Método ≠ GET ou corpo |", "|---|---|---|---|---|---|---|---|---|---|---|"]
        res_cen = {"fases": {}, "titulo": titulo, "extra": {k: v for k, v in s.extra.items()}}
        for fase in nomes_fases:
            reqs = [r for r in s.requisicoes if s.fase_de(r["t"]) == fase]
            ext = [r for r in reqs if externo(r["url"], base)]
            por_dom = Counter(dominio_rotulo(r["url"]) for r in ext)
            ok = sum(1 for r in ext if r["status"] == 200)
            cancel = sum(1 for r in ext if r["falhou"])
            ex = [procurar(r) for r in reqs]
            n_texto, n_cep, n_coord = (sum(1 for e in ex if e[k]) for k in ("texto", "cep", "coordenadas"))
            n_post = sum(1 for r in reqs if r["metodo"] != "GET" or r["corpo"])
            md.append(f"| {fase} | {len(reqs)} | {len(reqs) - len(ext)} | {len(ext)} | {por_dom.get('Esri', 0)} | {por_dom.get('OpenStreetMap', 0)} | {ok} / {cancel} | {n_texto} | {n_cep} | {n_coord} | {n_post} |")
            tiles = [(r, analisar_tile(r["url"])) for r in ext]
            tiles = [t for _, t in tiles if t]
            res_cen["fases"][fase] = {"requisicoes": len(reqs), "locais": len(reqs) - len(ext), "externas": len(ext), "por_dominio": dict(por_dom), "concluidas": ok, "canceladas": cancel,
                                      "com_texto": n_texto, "com_cep": n_cep, "com_coordenadas": n_coord, "metodo_ou_corpo": n_post, "retangulos": {}}
            for serv in sorted({t["servico"] for t in tiles}):
                res_cen["fases"][fase]["retangulos"][serv] = retangulo([t for t in tiles if t["servico"] == serv])
        md.append("")
        for fase in nomes_fases:
            for serv, ret in res_cen["fases"][fase]["retangulos"].items():
                md.append(f"- **Fase `{fase}`, {serv}:** {ret['tiles']} tiles; zoom {ret['zoom_min']} a {ret['zoom_max']} (por zoom: {ret['por_zoom']}); no zoom {ret['zoom_max']}: canto noroeste ≈ ({ret['noroeste'][0]}, {ret['noroeste'][1]}), "
                          f"canto sudeste ≈ ({ret['sudeste'][0]}, {ret['sudeste'][1]}); extensão ≈ {ret['largura_km']} km (leste-oeste) por {ret['altura_km']} km (norte-sul); "
                          f"ponto do CEP (índice) {'dentro' if ret.get('cep_dentro_do_retangulo') else 'fora'} do retângulo, a {ret.get('cep_a_km_do_centro')} km do centro dele.")
        md.append("")
        exp = [(r, procurar(r)) for r in s.requisicoes]
        exp = [(r, e) for r, e in exp if e["texto"] or e["cep"] or e["coordenadas"]]
        md.append("Requisições com texto, CEP ou coordenadas do CEP em URL, cabeçalho ou corpo: " + ("nenhuma." if not exp else ""))
        for r, e in exp:
            md.append(f"  - `{r['metodo']} {r['url'].replace(base, 'LOCAL')[:110]}`: " + "; ".join(e["texto"] + e["cep"] + e["coordenadas"]))
        refs = Counter(("enviado: " + r["cabecalhos"].get("referer", "")) if r["cabecalhos"].get("referer") else "não enviado" for r in s.requisicoes if externo(r["url"], base) and r["cabecalhos_finais"])
        cks = sum(1 for r in s.requisicoes if externo(r["url"], base) and r["cabecalhos_finais"] and "cookie" in r["cabecalhos"])
        md += ["", f"Cabeçalhos das requisições externas concluídas: Referer {dict(refs) or 'n/d'}; com Cookie: {cks}.", ""]
        for quando, a in s.armazenamento.items():
            md += [f"Armazenamento ({quando.replace('_', ' ')}): localStorage `{json.dumps(a.get('localStorage'), ensure_ascii=False)}`; sessionStorage `{json.dumps(a.get('sessionStorage'), ensure_ascii=False)}`; "
                   f"IndexedDB `{json.dumps(a.get('indexedDB'), ensure_ascii=False)}`; Cache Storage `{json.dumps(a.get('cacheStorage'), ensure_ascii=False)}`; Service Workers `{json.dumps(a.get('serviceWorkers'), ensure_ascii=False)}`; "
                   f"cookies: document.cookie «{a.get('documentCookie')}», no contexto `{json.dumps(a.get('cookies_do_contexto'), ensure_ascii=False)}`.", ""]
        res_cen["armazenamento"] = s.armazenamento
        resumo["cenarios"][cod] = res_cen

    # medidas que o prompt pede para diferenciar (só descrição)
    todas_ext = [r for r in registro if r["externa"]]
    md += ["## O que cada medida mostra (sem interpretação de risco)", "",
           f"- **Envio do CEP** (texto do CEP em URL, cabeçalho ou corpo): {sum(1 for r in registro if r['exposicao']['cep'])} requisições de {len(registro)}.",
           f"- **Envio de coordenadas** (latitude e longitude do CEP em URL, cabeçalho ou corpo): {sum(1 for r in registro if r['exposicao']['coordenadas'])} requisições.",
           f"- **Pedido de imagens de uma região:** {sum(1 for r in todas_ext if analisar_tile(r['url']))} requisições de tiles (Esri: {sum(1 for r in todas_ext if 'arcgisonline' in r['url'])}; OpenStreetMap: {sum(1 for r in todas_ext if 'openstreetmap' in r['url'])}); a URL de cada tile traz zoom, coluna e linha.",
           f"- **Exposição do endereço IP ao provedor:** inerente a qualquer requisição externa; requisições externas feitas: {len(todas_ext)}.",
           f"- Requisições com método diferente de GET ou com corpo, em todos os cenários: {sum(1 for r in registro if r['metodo'] != 'GET' or r['corpo'])}.", ""]
    SAIDA.mkdir(parents=True, exist_ok=True)
    (SAIDA / "auditoria_requisicoes.json").write_text(json.dumps({"meta": meta, "navegador": f"Chromium {versao} (Playwright)", "requisicoes": registro}, ensure_ascii=False, indent=1) + "\n", encoding="utf-8", newline="\n")
    (SAIDA / "resumo.json").write_text(json.dumps(resumo, ensure_ascii=False, indent=1) + "\n", encoding="utf-8", newline="\n")
    caminho_md = RES.parent / "auditoria_privacidade_cep_tiles_ligados_local.md"
    caminho_md.write_text("\n".join(md) + "\n", encoding="utf-8", newline="\n")
    print("ok:", caminho_md)
    for cod, r in resumo["cenarios"].items():
        print(cod, {f: (d["externas"], d["por_dominio"]) for f, d in r["fases"].items()})


# ---------------------------------------------------------------- quadro comparativo
def resumir() -> None:
    arqs = sorted(RES.glob("auditoria_cep_tiles_ligados_*/resumo.json"))
    if not arqs:
        sys.exit("Nenhum resultado em reproducao/resultados/auditoria_cep_tiles_ligados_*/. Rode a medição antes.")
    dados = [json.loads(a.read_text(encoding="utf-8")) for a in arqs]
    # referência: a auditoria anterior (CEP fictício, caixa da Esri marcada por padrão, commit fd7b371)
    ref = None
    anterior = RES / "auditoria_requisicoes.json"
    if anterior.exists():
        reqs = [r for r in json.loads(anterior.read_text(encoding="utf-8"))["requisicoes"] if r["cenario"] == "4" and r.get("externa")]
        ts = [t for t in (analisar_tile(r["url"]) for r in reqs) if t]
        if ts:
            ref = retangulo(ts)
    md = ["# Quadro comparativo: CEP de equipamento público com imagens de mapa ligadas", "",
          "Gerado por `python reproducao/auditoria_privacidade_cep_tiles_ligados.py --resumo` a partir de `reproducao/resultados/auditoria_cep_tiles_ligados_*/resumo.json`. Só medidas; sem interpretação de risco.", ""]
    if ref:
        md += [f"Referência: auditoria anterior (CEP fictício, caixa da Esri marcada por padrão, cenário 4 de `reproducao/resultados/auditoria_requisicoes.json`): Esri, {ref['tiles']} tiles, zoom {ref['zoom_min']} a {ref['zoom_max']}; "
               f"no zoom {ref['zoom_max']}, noroeste ≈ ({ref['noroeste'][0]}, {ref['noroeste'][1]}), sudeste ≈ ({ref['sudeste'][0]}, {ref['sudeste'][1]}); extensão ≈ {ref['largura_km']} km × {ref['altura_km']} km.", ""]
    md += ["| CEP | Lat, lon e raio no índice | Cenário | Fase | Serviço | Tiles | Zoom | Extensão (km) | Noroeste | Sudeste | Ponto do CEP no retângulo (a km do centro) | Texto/CEP/coord. na rede |", "|---|---|---|---|---|---|---|---|---|---|---|---|"]
    menores = []
    for d in dados:
        for cod, c in d["cenarios"].items():
            for fase, f in c["fases"].items():
                for serv, r in f["retangulos"].items():
                    md.append(f"| {d['cep']} | {d['cep_lat']}, {d['cep_lon']}, {d['cep_raio_m']} m | {cod} | {fase} | {serv} | {r['tiles']} | {r['zoom_min']}–{r['zoom_max']} | {r['largura_km']} × {r['altura_km']} | "
                              f"{r['noroeste'][0]}, {r['noroeste'][1]} | {r['sudeste'][0]}, {r['sudeste'][1]} | {'dentro' if r.get('cep_dentro_do_retangulo') else 'fora'} ({r.get('cep_a_km_do_centro')} km) | {f['com_texto']}/{f['com_cep']}/{f['com_coordenadas']} |")
                    menores.append((r["largura_km"] * r["altura_km"], d["cep"], cod, fase, serv, r))
    md.append("")
    if menores:
        a, cep, cod, fase, serv, r = min(menores, key=lambda x: x[0])
        md += [f"**Menor retângulo de tiles observado:** {r['largura_km']} km × {r['altura_km']} km (≈ {a:.2f} km²), CEP {cep}, cenário {cod}, fase `{fase}`, {serv}, zoom {r['zoom_max']}.", ""]
    md += ["## Requisições externas por cenário e fase", "", "| CEP | Cenário | Fase | Externas | Esri | OpenStreetMap | Concluídas / canceladas |", "|---|---|---|---|---|---|---|"]
    for d in dados:
        for cod, c in d["cenarios"].items():
            for fase, f in c["fases"].items():
                md.append(f"| {d['cep']} | {cod} | {fase} | {f['externas']} | {f['por_dominio'].get('Esri', 0)} | {f['por_dominio'].get('OpenStreetMap', 0)} | {f['concluidas']} / {f['canceladas']} |")
    md.append("")
    RES.mkdir(parents=True, exist_ok=True)
    caminho_md = RES.parent / "auditoria_privacidade_cep_tiles_ligados_resumo_local.md"
    caminho_md.write_text("\n".join(md) + "\n", encoding="utf-8", newline="\n")
    print("ok:", caminho_md)


if __name__ == "__main__":
    resumir() if EM_MODO_RESUMO else medir()
