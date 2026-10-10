const assert = require("assert");
const fs = require("fs");
const path = require("path");

const web = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(web, "index.html"), "utf8");
const app = fs.readFileSync(path.join(web, "app.js"), "utf8");
const css = fs.readFileSync(path.join(web, "estilo.css"), "utf8");

const categorias = Array.from(html.matchAll(/data-categoria="([^"]+)"/g), m => m[1]).filter(c => c !== "mulher_para_mulher");
const esperadas = ["emprego_curso", "saude", "estudo", "filhos", "casamento", "violencia", "familia", "moradia", "dividas", "lazer"];

assert.strictEqual(categorias.length, 10, "a home deve ter dez portas de categoria, incluindo Lazer");
assert.deepStrictEqual([...new Set(categorias)].sort(), esperadas.slice().sort(), "as portas devem preservar as categorias existentes e incluir lazer");
assert.strictEqual((html.match(/class="grupo-portas-home"/g) || []).length, 3, "a home deve organizar as portas em três grupos curtos");
assert(html.includes('class="atalho-saude"') && html.includes("Qual é a minha unidade de saúde?") && html.includes('href="saude.html"'),
  "a unidade de saúde deve ficar em destaque com atalho direto");
assert(html.includes("Benefícios e assistência social"), "a porta família deve usar o novo rótulo público");
assert(!html.includes('class="outras-areas"'), "outras áreas da plataforma não devem ficar no corpo da home");
assert(!html.includes('class="acesso-digital" aria-labelledby="titulo-acesso-digital"'), "o aviso de acesso digital não deve ficar no corpo da home");
assert(html.includes('class="acesso-digital rodape-acesso"'), "o aviso de acesso digital deve ficar no rodapé");
assert(app.includes('titulo: "Benefícios e assistência social"'), "o painel da categoria também deve usar o novo rótulo");
assert(app.includes('titulo: "Lazer, cultura e esporte"') && app.includes('href="lazer.html"'), "a categoria lazer deve abrir a agenda própria");
assert(app.includes("function novosVistos()") && app.includes("vistos.links[chaveLink]"), "busca combinada deve deduplicar links");
assert(app.includes("vistos.servicos[chaveServico]") && app.includes("blocoCategoria(k, vistos)"), "busca combinada deve deduplicar serviços e compartilhar o estado entre categorias");
assert(app.includes("Checklist para avaliar uma oportunidade"), "emprego deve exibir o checklist de viabilidade");
assert(css.includes(".grade-portas-principal") && css.includes(".rodape-acesso"), "a home e o aviso do rodapé devem ter estilo responsivo");

console.log("dashboard.test.js: dez portas, três grupos, atalho de Saúde, rodapé e prevenção de redundância verificados");
