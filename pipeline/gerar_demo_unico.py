"""Gera uma versao "arquivo unico" de cada pagina do site em demo_unico/.

Cada HTML sai com CSS, JavaScript e dados embutidos: abre com duplo clique (file://), sem servidor, sem
internet. Serve para olhar o prototipo rapidamente e para apresentar em qualquer computador.

Como funciona:
  * <link rel=stylesheet> e <script src> locais viram <style>/<script> inline, na mesma ordem;
  * os arquivos de dados que as paginas buscam com fetch (dados/*.json, *.geojson) sao embutidos e um
    pequeno "shim" responde ao fetch com eles. O que nao existe (ex.: dados reais) responde 404, e o site
    cai para os dados de demonstracao, exatamente como no servidor local;
  * os links entre paginas continuam funcionando (mesmos nomes de arquivo, na mesma pasta).

Uso:  python pipeline/gerar_demo_unico.py                    (rode de novo depois de qualquer mudanca em web/)
      python pipeline/gerar_demo_unico.py --com-dados-reais   (inclui os dados reais montados; so para uso LOCAL, nao suba)
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import RAIZ  # noqa: E402

WEB = RAIZ / "web"
SAIDA = RAIZ / "demo_unico"

SHIM = """<script>
/* Dados embutidos: responde ao fetch sem servidor. O que nao esta aqui responde 404, como no servidor local. */
(function () {
  var EMBUTIDOS = %s;
  var original = window.fetch ? window.fetch.bind(window) : null;
  window.fetch = function (url) {
    var chave = String(url).split("?")[0].replace(/^\\.\\//, "");
    if (Object.prototype.hasOwnProperty.call(EMBUTIDOS, chave)) {
      return Promise.resolve(new Response(EMBUTIDOS[chave], { status: 200, headers: { "Content-Type": "application/json" } }));
    }
    return Promise.resolve(new Response("", { status: 404 }));
  };
})();
</script>"""


# Dados gerados a partir das fontes reais (montar_dados.py). Ficam FORA do arquivo unico por padrao, porque
# demo_unico/ vai para o GitHub; com --com-dados-reais voce gera uma copia so para uso local.
DADOS_REAIS = {"dados/cep_indice.json", "dados/servicos.json", "dados/vagas.json", "dados/gestao.json"}


def _seguro(texto: str) -> str:
    """Evita fechar a tag <script>/<style> sem querer dentro do conteudo embutido."""
    return texto.replace("</script", "<\\/script").replace("</style", "<\\/style")


def gerar_pagina(html_path: Path) -> tuple[str, list[str], int]:
    html = html_path.read_text(encoding="utf-8")
    fontes_js: list[str] = []

    def css(m):
        arq = WEB / m.group(1)
        return "<style>\n%s\n</style>" % _seguro(arq.read_text(encoding="utf-8")) if arq.exists() else m.group(0)

    def js(m):
        arq = WEB / m.group(1)
        if not arq.exists():
            return m.group(0)
        txt = arq.read_text(encoding="utf-8")
        fontes_js.append(txt)
        return "<script>\n%s\n</script>" % _seguro(txt)

    html = re.sub(r'<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>', css, html)
    html = re.sub(r'<script src="([^"]+)"></script>', js, html)

    # dados que a pagina busca (no HTML e em todos os scripts, inclusive os inline)
    texto_total = html + "\n".join(fontes_js)
    refs = sorted(set(re.findall(r'["\'](dados/[A-Za-z0-9_./-]+\.(?:json|geojson))["\']', texto_total)))
    if "--com-dados-reais" not in sys.argv:
        refs = [r for r in refs if r not in DADOS_REAIS]
    embutidos = {r: (WEB / r).read_text(encoding="utf-8") for r in refs if (WEB / r).exists()}
    shim = SHIM % json.dumps(embutidos, ensure_ascii=False).replace("</", "<\\/")
    html = html.replace("<head>", "<head>\n" + shim, 1)
    return html, sorted(embutidos), len(refs) - len(embutidos)


def main() -> None:
    SAIDA.mkdir(exist_ok=True)
    for pagina in sorted(WEB.glob("*.html")):
        html, embutidos, ausentes = gerar_pagina(pagina)
        destino = SAIDA / pagina.name
        destino.write_text(html, encoding="utf-8")
        print("%-28s %6.0f KB  dados embutidos: %s%s" % (pagina.name, destino.stat().st_size / 1024, ", ".join(embutidos) or "-",
              "  (ausentes => 404 proposital: %d)" % ausentes if ausentes else ""))
    print("\nAbra demo_unico/index.html com duplo clique.")


if __name__ == "__main__":
    main()
