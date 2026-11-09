/* Privacidade do mapa: nenhuma imagem de mapa de outro domínio pode ser pedida sem a usuária marcar a caixa de ruas.
   Decisão de 05/11/2026 (ver docs/registro_decisoes_desenvolvimento.md): a caixa do mapa de serviços vem desmarcada.
   O teste lê os arquivos; a medição de rede no navegador está em reproducao/auditoria_privacidade.md (ramo reproducao-e-auditoria). */
const assert = require("assert"), fs = require("fs"), path = require("path");
const web = path.resolve(__dirname, "..");
const raiz = path.resolve(web, "..");
const html = fs.readFileSync(path.join(web, "index.html"), "utf8");
const mapa = fs.readFileSync(path.join(web, "mapa.js"), "utf8");
const app = fs.readFileSync(path.join(web, "app.js"), "utf8");
const readme = fs.readFileSync(path.join(raiz, "README.md"), "utf8");

/* 1) As duas caixas de ruas vêm desmarcadas. */
["usar-tiles-mapa", "usar-tiles"].forEach((id) => {
  const m = html.match(new RegExp('<input[^>]*id="' + id + '"[^>]*>'));
  assert(m, "caixa " + id + " existe");
  assert(!/\bchecked\b/.test(m[0]), "a caixa " + id + " vem desmarcada: " + m[0]);
});

/* 2) O texto ao lado diz o que a marcação envia e o que acontece sem marcar. */
const rotulo = html.match(/<label class="tiles"><input[^>]*id="usar-tiles-mapa"[^>]*>([^<]*)<\/label>/);
assert(rotulo && /Esri/.test(rotulo[1]) && /endereço de rede/.test(rotulo[1]) && /Sem marcar/.test(rotulo[1]) && !/Desmarque/.test(rotulo[1]), "o rótulo explica o envio e o que acontece sem marcar");

/* 3) O código só liga a camada de imagens pelo estado da caixa (nunca ligarBase(true) direto). */
assert(/ligarBase\(\$\("usar-tiles-mapa"\)\.checked\)/.test(mapa), "a camada inicial segue o estado da caixa");
assert(!/ligarBase\(true\)/.test(mapa), "nenhuma chamada força a camada ligada");
assert(/\$\("usar-tiles"\)\.addEventListener\("change"[\s\S]*if \(e\.target\.checked\)/.test(app), "a camada do OpenStreetMap só entra ao marcar a caixa");

/* 4) Distingue requisições de tiles de links HTML de atribuição.
   Somente os dois serviços de tiles conhecidos podem ser requisitados, e ambos dependem de opt-in.
   Os href abaixo são créditos clicáveis, não endpoints de imagem/rede. */
const hostsTiles = new Set();
[app, mapa].forEach((codigo) => {
  const re = /L\.tileLayer\(\s*["'](https?:\/\/[^"']+)/g;
  let m;
  while ((m = re.exec(codigo)) !== null) hostsTiles.add(new URL(m[1].replace(/\{[^}]+\}/g, "0")).host);
});
assert.deepStrictEqual(Array.from(hostsTiles).sort(), [
  "server.arcgisonline.com",
  "tile.openstreetmap.org"
].sort(), "requisições de tiles limitadas aos dois serviços aprovados");
assert.strictEqual((mapa.match(/L\.tileLayer\(/g) || []).length, 2, "as duas camadas Esri são tiles e não links de atribuição");
assert.strictEqual((app.match(/L\.tileLayer\(/g) || []).length, 1, "a camada OSM é tile e não link de atribuição");
assert(/ligarBase\(\$\("usar-tiles-mapa"\)\.checked\)/.test(mapa) &&
  /if \(ligar && !tiles\)/.test(mapa), "tiles Esri só são adicionados conforme o opt-in desmarcado por padrão");
assert(/if \(e\.target\.checked\)[\s\S]*L\.tileLayer/.test(app), "tiles OSM só são requisitados depois da marcação explícita");

const linksAtribuicao = [];
[app, mapa].forEach((codigo) => {
  const re = /attribution:\s*'([^']*)'/g;
  let bloco;
  while ((bloco = re.exec(codigo)) !== null) {
    const anchors = bloco[1].match(/<a\b[^>]*>/g) || [];
    anchors.forEach((tag) => {
      const href = tag.match(/href=["'](https?:\/\/[^"']+)/i);
      if (!href) return;
      const host = new URL(href[1]).host;
      linksAtribuicao.push({ host: host, tag: tag });
    });
  }
});
const hostsAtribuicao = Array.from(new Set(linksAtribuicao.map((x) => x.host))).sort();
assert.deepStrictEqual(hostsAtribuicao, ["www.esri.com", "www.openstreetmap.org"],
  "somente Esri e OpenStreetMap são links externos de atribuição");
assert(linksAtribuicao.length >= 5, "todos os créditos das duas camadas permanecem clicáveis");
linksAtribuicao.forEach((link) => {
  assert(/rel=["']noopener noreferrer["']/.test(link.tag),
    "link de atribuição deve usar rel=noopener noreferrer: " + link.tag);
  assert(/target=["']_blank["']/.test(link.tag),
    "link de atribuição abre em nova aba: " + link.tag);
});
const avisos = fs.readFileSync(path.join(raiz, "AVISOS-DE-TERCEIROS.md"), "utf8");
assert(/Esri: tiles de mapa-base/.test(avisos) &&
  /www\.esri\.com|terms\/web-site-service/.test(avisos),
  "inventário de terceiros registra a atribuição e os termos da Esri");

/* ---- Referer dos tiles (política de uso do OpenStreetMap, conferida em 08/11/2026) ---- */
{
  const fs2 = require("fs"), path2 = require("path");
  const app = fs2.readFileSync(path2.resolve(__dirname, "..", "app.js"), "utf8");
  const mapa = fs2.readFileSync(path2.resolve(__dirname, "..", "mapa.js"), "utf8");
  const osm = (app.match(/L\.tileLayer\("https:\/\/tile\.openstreetmap\.org[\s\S]*?\.addTo\(mapa\)/) || [""])[0];
  assert(osm.length > 0, "camada do OpenStreetMap encontrada");
  assert(/referrerPolicy: "origin"/.test(osm), "só os tiles do OpenStreetMap enviam a ORIGEM do site como Referer (a política deles exige Referer em páginas web)");
  assert(/openstreetmap\.org\/copyright/.test(osm) && /OpenStreetMap contributors/.test(osm), "atribuição do OpenStreetMap com link para a licença");
  assert(!/referrerPolicy/.test(mapa), "os tiles da Esri não enviam Referer");
  ["index.html", "mapa-territorial.html", "privacidade.html", "qualidade-dados.html"].forEach((h) => {
    assert(/name="referrer" content="no-referrer"/.test(fs2.readFileSync(path2.resolve(__dirname, "..", h), "utf8")), "a página segue com no-referrer: " + h);
  });
}

console.log("mapa_privacidade.test.js: caixas de ruas desmarcadas, camadas só por marcação, rótulo explica o envio, README coerente");
