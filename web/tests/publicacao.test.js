const assert = require("assert");
const fs = require("fs");
const path = require("path");

const raiz = path.resolve(__dirname, "..", "..");
const web = path.join(raiz, "web");
const fluxo = fs.readFileSync(path.join(raiz, ".github", "workflows", "publicar-site.yml"), "utf8");

/* publica a pasta web/, sem os testes */
assert(/cp -r web _site/.test(fluxo) && /path: _site/.test(fluxo), "publica só a pasta web/");
assert(/rm -rf _site\/tests/.test(fluxo), "os testes não vão para a internet");
assert(/touch _site\/\.nojekyll/.test(fluxo) && /test -f _site\/index\.html/.test(fluxo), "falha se o site não tiver index.html");
/* permissões mínimas e ações com versão fixa */
assert(/permissions:\s*\n\s*contents: read\s*\n\s*pages: write\s*\n\s*id-token: write/.test(fluxo), "permissões mínimas");
(fluxo.match(/uses: [^\s]+/g) || []).forEach((u) => assert(/@v\d+$/.test(u.replace("uses: ", "")), "ação sem versão fixa: " + u));

/* o site publicado não depende da pasta de testes e todo script que ele carrega existe */
const html = fs.readFileSync(path.join(web, "index.html"), "utf8"), app = fs.readFileSync(path.join(web, "app.js"), "utf8");
assert(!/tests\//.test(html + app), "o site não pode depender da pasta de testes");
const scripts = Array.from(html.matchAll(/<script[^>]*src="([^"]+)"/g), (m) => m[1]).concat(Array.from(app.matchAll(/scripts: \[([^\]]*)\]/g), (m) => (m[1].match(/"([^"]+)"/g) || []).map((x) => x.replace(/"/g, ""))).flat());
assert(scripts.length > 10, "deve haver scripts a conferir");
scripts.forEach((s) => assert(fs.existsSync(path.join(web, s)), "script carregado pelo site não existe: " + s));
/* o Pages serve numa subpasta (/MISM3/): nada de caminho absoluto */
assert(!/(?:href|src)="\/(?!\/)/.test(html), "o index não pode usar caminhos absolutos (o site fica numa subpasta)");
/* o painel é público e, por isso, precisa se declarar de teste */
if (fs.existsSync(path.join(web, "dados", "painel_teste.json"))) {
  assert(/dados_de_teste":\s*true/.test(fs.readFileSync(path.join(web, "dados", "painel_teste.json"), "utf8").slice(0, 400)), "dados do painel precisam se declarar de teste");
  assert(/PROTÓTIPO COM DADOS DE TESTE/.test(html), "o painel público precisa da faixa de dados de teste");
}

console.log("publicacao.test.js: publica só web/ sem os testes, permissões mínimas, versões fixas, scripts existentes, caminhos relativos e painel declarado de teste passaram");

/* ---- celular: o modelo de currículo (pre) precisa quebrar linha, senão a página ganha rolagem horizontal ---- */
const css = fs.readFileSync(path.join(web, "estilo.css"), "utf8");
assert(/pre\.modelo-curriculo\{[^}]*white-space:pre-wrap/.test(css) && /pre\.modelo-curriculo\{[^}]*overflow-wrap:anywhere/.test(css), "pre.modelo-curriculo deve quebrar linha");
assert(/@media\(max-width:820px\)\{\.lista-cartoes\{grid-template-columns:minmax\(0,1fr\)\}\}/.test(css), "a grade de cartões no celular usa minmax(0,1fr), não 1fr (que cresce até a maior palavra)");
assert(/\ncode\{overflow-wrap:anywhere\}/.test(css) && /\.cartao\{min-width:0;overflow-wrap:break-word\}/.test(css), "cartões e código quebram linha em telas de 320 px");
console.log("publicacao.test.js: modelo de currículo, grade de cartões e código quebram linha no celular");
