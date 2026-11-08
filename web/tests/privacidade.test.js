/* Verifica a transparência pública e impede liberação prematura para indexação. */
const fs = require("fs");
const path = require("path");
const assert = require("assert");

const web = path.join(__dirname, "..");
const ler = (arquivo) => fs.readFileSync(path.join(web, arquivo), "utf8");

const privacidade = ler("privacidade.html");
const inicio = ler("index.html");
const mapa = ler("mapa-territorial.html");
const qualidade = ler("qualidade-dados.html");
const mapaJs = ler("mapa.js");
const appJs = ler("app.js");

assert(/<html lang="pt-BR">/.test(privacidade), "a página pública declara português brasileiro");
assert(/name="robots" content="noindex, nofollow"/.test(privacidade), "a página permanece fora dos buscadores enquanto o lançamento não for autorizado");
assert(/default-src 'none'/.test(privacidade) && /style-src 'self'/.test(privacidade), "a política de conteúdo bloqueia recursos não necessários");
assert(!/<script\b/i.test(privacidade), "a página de privacidade não executa JavaScript");
assert(/não é um serviço oficial da Prefeitura/.test(privacidade), "a página esclarece que o projeto não é serviço oficial");
assert(/funciona no navegador, no próprio aparelho/.test(privacidade), "a página explica o processamento local do orientador");
assert(/não envia esse valor ao servidor do MISM3/.test(privacidade), "a página explica o tratamento local do CEP");
assert(/OpenStreetMap ou Esri/.test(privacidade), "a página identifica os provedores cartográficos externos");
assert(/17 setores/.test(privacidade) && /não há supressão ou agregação automática/.test(privacidade), "a página informa a cautela dos setores pequenos sem prometer proteção inexistente");
assert(/privacidade.html/.test(inicio) && /privacidade.html/.test(mapa) && /privacidade.html/.test(qualidade), "site, mapa e painel de qualidade dão acesso à página de privacidade");

assert(/id="usar-tiles-mapa"/.test(inicio) && !/<input[^>]*id="usar-tiles-mapa"[^>]*checked/.test(inicio), "camada Esri começa desativada");
assert(/id="usar-tiles"/.test(inicio) && !/<input[^>]*id="usar-tiles"[^>]*checked/.test(inicio), "camada OpenStreetMap começa desativada");
assert(/ligarBase\(\$\("usar-tiles-mapa"\)\.checked\)/.test(mapaJs), "o mapa Esri respeita a opção escolhida");
assert(/if \(e\.target\.checked\)/.test(appJs), "o mapa OpenStreetMap só é ativado após escolha da usuária");

for (const [nome, html] of [["site", inicio], ["mapa", mapa], ["qualidade", qualidade]]) {
  assert(/name="robots" content="noindex, nofollow"/.test(html), nome + " continua sem indexação antes da liberação oficial");
}

console.log("privacidade.test.js: página pública, transparência, camadas externas opcionais e bloqueio de indexação pré-lançamento verificados");
