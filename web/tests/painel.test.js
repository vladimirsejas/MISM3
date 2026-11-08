const assert = require("assert");
const fs = require("fs");
const path = require("path");

const web = path.resolve(__dirname, "..");
const ler = (f) => fs.readFileSync(path.join(web, f), "utf8");
const existe = (f) => fs.existsSync(path.join(web, f));

/* O questionário e o painel de respostas foram retirados; não podem voltar sem autorização. */
["questionario.js", "questionario-ui.js", "painel.js", "dados/coleta.json", "dados/painel_teste.json", "tests/questionario.test.js"].forEach((f) => assert(!existe(f), "foi retirado do projeto e não deve existir: web/" + f));
assert(!fs.existsSync(path.join(web, "..", "pipeline", "gerar_dados_teste_painel.js")), "o gerador de dados de teste do painel foi retirado");

const index = ler("index.html");
const app = ler("app.js");
const areas = ler("areas.js");
const territorial = ler("mapa-territorial.html");
const ui = ler("mapa-territorial.js");

[["index.html", index], ["app.js", app], ["areas.js", areas], ["mapa-territorial.html", territorial], ["mapa-territorial.js", ui]].forEach(([nome, txt]) => {
  assert(!/questionario/i.test(txt.replace(/questionário é curto/g, "")) && !/Questionario/.test(txt), "sobrou referência ao questionário em web/" + nome);
});
assert(!/id="faixa-teste"|PROTÓTIPO COM DADOS DE TESTE|painel_teste/.test(index + app + territorial + ui), "não há dados de teste de respostas");

/* A análise territorial é uma página própria, aberta pelo bloco de gestão. */
const gestao = (/<section class="para-gestao"[\s\S]*?<\/section>/.exec(index) || [""])[0];
assert(/href="mapa-territorial\.html"/.test(gestao) && /Mapa territorial/.test(gestao), "o mapa territorial é aberto pelo bloco 'Para a gestão'");
assert(!/href="#painel"/.test(index.replace(gestao, "")), "o mapa não é aberto pelas portas, pelo acesso rápido ou pelo assistente");
assert(!/painel/i.test(areas), "a análise territorial não entra nas áreas das mulheres");
assert(!/id="vista-painel"|id="painel-saida"/.test(index), "a vista legada de painel foi removida do dashboard");
assert(!/nome: "Análise territorial"/.test(app), "o painel legado não é registrado como vista interna");
assert(!/painel-ui\.js/.test(index), "o painel legado não é carregado na página inicial");

/* A página territorial lê apenas os arquivos locais e não registra entradas pessoais. */
assert(/name="robots" content="noindex, nofollow"/.test(index) && /name="robots" content="noindex, nofollow"/.test(territorial), "as páginas de demonstração não devem ser indexadas");
assert(/mapa-territorial\.js/.test(territorial) && /id="mt-svg"/.test(territorial), "a página própria contém o mapa territorial");
assert(/carregar\("dados\/indicadores_territoriais\.json"/.test(ui) && /carregar\("dados\/setores\.geojson"/.test(ui), "o mapa lê os indicadores e a malha locais");
assert(!/localStorage|sessionStorage|indexedDB|document\.cookie|sendBeacon/.test(ui), "a tela territorial não grava dados de usuárias");
assert(!/method\s*:\s*["']POST/i.test(ui) && !/WebSocket/.test(ui), "a tela territorial não envia dados");
assert(/\.open\("GET"/.test(ui) && !/https?:\/\//i.test(ui), "a tela só consulta arquivos locais por GET");
["Como ler este mapa", "envelope geométrico", "não intervalo de confiança"].forEach((t) => assert((territorial + ui).toLowerCase().includes(t.toLowerCase()), "o mapa deve explicar: " + t));

console.log("painel.test.js: página territorial própria, painel legado removido e sem coleta ou envio de dados pessoais");
