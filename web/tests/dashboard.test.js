const assert = require("assert");
const fs = require("fs");
const path = require("path");

const web = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(web, "index.html"), "utf8");
const app = fs.readFileSync(path.join(web, "app.js"), "utf8");
const css = fs.readFileSync(path.join(web, "estilo.css"), "utf8");

// "De mulher para mulher" e uma porta CONDICIONAL: fica escondida e so aparece quando ha cadastro verificado pela Secretaria
assert(/id="porta-m2m"[^>]*hidden|hidden[^>]*id="porta-m2m"/.test(html) || /<button[^>]*id="porta-m2m"[^>]*\bhidden\b/.test(html), "a porta De mulher para mulher deve nascer escondida");
const categorias = Array.from(html.matchAll(/data-categoria="([^"]+)"/g), m => m[1]).filter(c => c !== "mulher_para_mulher");
const esperadas = ["emprego_curso", "saude", "estudo", "filhos", "casamento", "violencia", "familia", "moradia", "dividas"];

assert.strictEqual(categorias.length, 9, "a tela inicial deve manter as sete portas originais e acrescentar moradia e dívidas");
assert.deepStrictEqual([...new Set(categorias)].sort(), esperadas.slice().sort(),
  "as sete portas devem manter as categorias reconhecidas pelo classificador");
assert.strictEqual((html.match(/class="bloco-portas"/g) || []).length, 4,
  "as portas devem continuar organizadas em quatro jornadas");
assert(html.includes('class="outras-areas"'), "ferramentas de gestão e rede devem ficar separadas das portas de atendimento");
assert(html.includes('class="acesso-digital"'), "a tela deve explicar os limites atuais de privacidade e acessibilidade");
// o estado de deduplicacao e UM so, compartilhado entre as categorias da busca combinada (comportamento comprovado no navegador)
assert(app.includes("function novosVistos()") && app.includes("vistos.links[chaveLink]"), "busca combinada deve deduplicar links");
assert(app.includes("vistos.servicos[chaveServico]") && app.includes("blocoCategoria(k, vistos)"), "busca combinada deve deduplicar serviços e compartilhar o estado entre categorias");
assert(app.includes("Checklist para avaliar uma oportunidade"), "emprego deve exibir o checklist de viabilidade");
assert(css.includes(".grade-outras-areas"), "as áreas complementares devem ter estilo próprio");

console.log("dashboard.test.js: nove portas, quatro jornadas, acesso digital e prevenção de redundância passaram");
