const assert = require("assert");
const fs = require("fs");
const path = require("path");

/* A vista #painel mostra só a análise territorial (IBGE + catálogo de serviços). O questionário e o painel de respostas foram
   retirados do projeto em 04/11/2026; este teste garante que nada deles volte sem querer e que a tela continue honesta. */
const web = path.resolve(__dirname, "..");
const ler = (f) => fs.readFileSync(path.join(web, f), "utf8");
const existe = (f) => fs.existsSync(path.join(web, f));

/* ---- o que foi retirado não pode ter voltado ---- */
["questionario.js", "questionario-ui.js", "painel.js", "dados/coleta.json", "dados/painel_teste.json", "tests/questionario.test.js"].forEach((f) => assert(!existe(f), "foi retirado do projeto e não deve existir: web/" + f));
assert(!fs.existsSync(path.join(web, "..", "pipeline", "gerar_dados_teste_painel.js")), "o gerador de dados de teste do painel foi retirado");
const index = ler("index.html"), app = ler("app.js"), areas = ler("areas.js"), ui = ler("painel-ui.js");
[["index.html", index], ["app.js", app], ["areas.js", areas], ["painel-ui.js", ui]].forEach(([nome, txt]) => {
  assert(!/questionario/i.test(txt.replace(/questionário é curto/g, "")) && !/Questionario/.test(txt), "sobrou referência ao questionário em web/" + nome);
});
assert(!/id="faixa-teste"|PROTÓTIPO COM DADOS DE TESTE|painel_teste/.test(index + app + ui), "não há mais dados de teste de respostas");

/* ---- a página: só lê, não grava e não envia ---- */
const vistaDe = (html, id) => { const m = new RegExp('<section id="' + id + '"[\\s\\S]*?(?=\\n  <section id="vista-|\\n  <p id="fontes")').exec(html); assert(m, "vista não encontrada em index.html: " + id); return m[0]; };
const vista = vistaDe(index, "vista-painel");
assert(/name="robots" content="noindex, nofollow"/.test(index), "o site não deve ser indexado");
assert(/Análise territorial/.test(vista) && /não usa respostas nem dados de nenhuma pessoa/.test(vista), "a página deve dizer que não usa dados de pessoas");
const gestao = (/<section class="para-gestao"[\s\S]*?<\/section>/.exec(index) || [""])[0];
assert(/href="#painel"/.test(gestao) && /Análise territorial/.test(gestao), "a análise é aberta pelo bloco 'Para a gestão'");
assert(!/href="#painel"/.test(index.replace(gestao, "")), "a análise só é aberta pelo bloco 'Para a gestão': nunca pelas portas, pelo acesso rápido ou pelo assistente");
assert(!/painel/i.test(areas), "a análise territorial não entra nas áreas das mulheres");
assert(/nome: "Análise territorial", scripts: \["painel-ui\.js"\]/.test(app), "a vista carrega só painel-ui.js");
assert(!/localStorage|sessionStorage|indexedDB|document\.cookie|sendBeacon/.test(ui), "a tela não grava nada");
assert(!/method\s*:\s*["']POST/i.test(ui) && !/XMLHttpRequest|WebSocket/.test(ui), "a tela só lê dados, não envia");
const buscas = ui.match(/carregar\("[^"]+"\)/g) || [];
assert.deepStrictEqual(buscas, ['carregar("dados/analise_territorial.json")'], "a tela lê um único arquivo: a análise territorial");

/* ---- honestidade: sem a análise gerada, a tela diz isso e não inventa números ---- */
["Como ler esta tela", "não provam falta de serviço", "Nenhum dado de pessoa entra nesta tela"].forEach((t) => assert((vista + ui).includes(t), "a tela deve dizer: " + t));
assert(/ainda não foi gerada/.test(ui), "sem a análise territorial, a tela diz que não foi gerada e não inventa números");
assert(/faixa geométrica/.test(ui) && /distancia_media_.*_min_km/.test(ui) && /distancia_media_.*_max_km/.test(ui), "a tela explica e exibe os limites da faixa geométrica");
assert(!existe("dados/analise_territorial.json") || JSON.parse(ler("dados/analise_territorial.json")).meta.aviso, "se a análise existir, tem de trazer o aviso de método");

console.log("painel.test.js: a vista mostra só a análise territorial, nada do questionário voltou, a tela só lê e não inventa números");
