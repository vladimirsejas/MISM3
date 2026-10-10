const assert = require("assert");
const fs = require("fs");
const path = require("path");

const web = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(web, "index.html"), "utf8");
const app = fs.readFileSync(path.join(web, "app.js"), "utf8");
const css = fs.readFileSync(path.join(web, "estilo.css"), "utf8");

const categorias = Array.from(html.matchAll(/data-categoria="([^"]+)"/g), m => m[1]);
const esperadas = ["emprego_curso", "saude", "estudo", "filhos", "casamento", "violencia", "familia", "moradia", "dividas"];

assert.strictEqual(categorias.length, 9, "a tela inicial deve manter as sete portas originais e acrescentar moradia e dívidas");
assert.deepStrictEqual([...new Set(categorias)].sort(), esperadas.slice().sort(),
  "as sete portas devem manter as categorias reconhecidas pelo classificador");
assert.strictEqual((html.match(/class="bloco-portas"/g) || []).length, 3,
  "as portas devem continuar organizadas em três jornadas");
assert(html.includes('class="outras-areas"'), "ferramentas de gestão e rede devem ficar separadas das portas de atendimento");
assert(app.includes("var linksExibidos = Object.create(null)"), "busca combinada deve deduplicar links");
assert(app.includes("var servicosExibidos = Object.create(null)"), "busca combinada deve deduplicar serviços");
assert(app.includes("Checklist para avaliar uma oportunidade"), "emprego deve exibir o checklist de viabilidade");
assert(css.includes(".grade-outras-areas"), "as áreas complementares devem ter estilo próprio");

console.log("dashboard.test.js: nove portas, quatro jornadas, acesso digital e prevenção de redundância passaram");
