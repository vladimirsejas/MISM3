const assert = require("assert");
const fs = require("fs");
const path = require("path");

const raiz = path.resolve(__dirname, "..", "..");
const fluxo = fs.readFileSync(path.join(raiz, ".github", "workflows", "publicar-site.yml"), "utf8");

/* o que NÃO pode ir para a internet */
["tests", "painel-secretaria.html", "painel.js", "painel-ui.js", "dados/painel_teste.json"].forEach((x) => assert(new RegExp("rm -[rf]+ [^\\n]*_site/" + x.replace(/[.]/g, "\\.")).test(fluxo), "a publicação deve excluir: " + x));
/* permissões mínimas e ações com versão fixa */
assert(/permissions:\s*\n\s*contents: read\s*\n\s*pages: write\s*\n\s*id-token: write/.test(fluxo), "permissões mínimas");
(fluxo.match(/uses: [^\s]+/g) || []).forEach((u) => assert(/@v\d+$/.test(u.replace("uses: ", "")), "ação sem versão fixa: " + u));
assert(/path: _site/.test(fluxo) && /cp -r web _site/.test(fluxo), "publica só a pasta web/");
/* o site publicado não depende de nada que foi excluído */
const site = fs.readFileSync(path.join(raiz, "web", "index.html"), "utf8") + fs.readFileSync(path.join(raiz, "web", "app.js"), "utf8") + fs.readFileSync(path.join(raiz, "web", "rede-mulheres.html"), "utf8");
assert(!/painel-secretaria|painel\.js|painel-ui|painel_teste/.test(site), "o site público não pode apontar para o painel da Secretaria");
/* caminhos relativos: o Pages serve em /MISM3/, não na raiz do domínio */
const html = fs.readFileSync(path.join(raiz, "web", "index.html"), "utf8");
assert(!/(?:href|src)="\/(?!\/)/.test(html), "o index não pode usar caminhos absolutos (o site fica numa subpasta)");

console.log("publicacao.test.js: o que fica de fora, permissões mínimas, versões fixas e caminhos relativos passaram");
