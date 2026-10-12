const assert = require("assert");
const fs = require("fs");
const path = require("path");

const web = path.resolve(__dirname, "..");
const ler = (f) => fs.readFileSync(path.join(web, f), "utf8");
const Q = require("../questionario.js");
const P = require("../painel.js");

/* registros mínimos para provar as regras */
const reg = (resp) => Q.registro(Object.assign({ idade: "25_34", autoriza: "sim" }, resp), "2026-10");
const muitos = (n, resp) => Array.from({ length: n }, () => reg(resp));

/* ---- regra dos 10: nenhum número de grupo pequeno aparece ---- */
assert.strictEqual(P.K, 10);
const poucos = muitos(9, { trabalho: "formal" });
const d9 = P.distribuicao(poucos, "trabalho");
assert.strictEqual(d9.suprimida, true, "menos de 10 respondentes: a pergunta inteira some");
assert.strictEqual(d9.respondentes, null);
assert.strictEqual(d9.itens.length, 0);
const mistos = muitos(30, { trabalho: "formal" }).concat(muitos(25, { trabalho: "informal" }), muitos(4, { trabalho: "procurando" }));
const dm = P.distribuicao(mistos, "trabalho");
const por = Object.fromEntries(dm.itens.map((i) => [i.c, i]));
assert.strictEqual(por.procurando.n, null, "alternativa com 4 respostas fica oculta");
assert(por.procurando.oculto === true && por.procurando.pct === null);
assert.strictEqual(por.formal.n, 30);
/* supressão complementar: se só uma alternativa ficou oculta, a menor das outras também some (senão total - resto revela o número) */
const ocultos = dm.itens.filter((i) => i.oculto);
assert(ocultos.length >= 2, "com uma única célula oculta, a menor das outras também é ocultada");
assert.strictEqual(por.informal.n, null, "a menor alternativa visível também é ocultada");
assert.strictEqual(por.formal.n, 30, "a maior continua visível");
/* pergunta de múltipla escolha: as alternativas não somam o total, então não há supressão complementar */
const multi = muitos(20, { obstaculos_trabalho: ["vagas", "creche"] }).concat(muitos(3, { obstaculos_trabalho: ["internet"] }));
const dmu = Object.fromEntries(P.distribuicao(multi, "obstaculos_trabalho").itens.map((i) => [i.c, i]));
assert.strictEqual(dmu.internet.n, null); assert.strictEqual(dmu.vagas.n, 20); assert.strictEqual(dmu.creche.n, 20);

/* ---- médias por grupo: grupo pequeno nunca aparece ---- */
const g = P.indicesPorGrupo(muitos(12, { regiao: "cvz", trabalho: "procurando" }).concat(muitos(6, { regiao: "centro", trabalho: "procurando" })), "regiao");
assert(g.grupos.cvz && !g.grupos.centro, "região com 6 respostas não aparece");
assert.strictEqual(g.gruposEscondidos, 1);

/* ---- índice: em branco não conta; média só com 10 ou mais ---- */
const semDados = P.indices(muitos(12, { trabalho: "nd" }));
assert.strictEqual(semDados.economica.media, null, "quem deixou em branco não vira média zero");
assert.strictEqual(P.indices(muitos(5, { trabalho: "procurando" })).economica.media, null, "menos de 10 pessoas: sem média");
assert.strictEqual(P.indices(muitos(10, { trabalho: "procurando" })).economica.media, 100);

/* ---- combinações ---- */
const duplos = muitos(12, { trabalho: "procurando", obstaculos_trabalho: ["vagas", "creche", "transporte"], estudar: "concluir", obstaculos_estudo: ["dinheiro", "sem_cuidado", "chegar"] });
const livres = muitos(10, { trabalho: "formal", obstaculos_trabalho: ["nenhum"], estudar: "nao" });
assert.strictEqual(P.combinacoes(duplos.concat(livres)).n, 12);
assert.strictEqual(P.combinacoes(duplos.concat(livres)).base, 22);
assert.strictEqual(P.combinacoes(duplos.slice(0, 5)).suprimido, true);
assert(P.paresDeTemas(duplos).some((x) => /Trabalho e renda \+ Estudo e cursos/.test(x.par)));
assert.deepStrictEqual(P.paresDeTemas(muitos(5, { trabalho: "procurando", obstaculos_trabalho: ["vagas", "creche", "transporte"], estudar: "concluir", obstaculos_estudo: ["dinheiro", "sem_cuidado", "chegar"] })), [], "par com menos de 10 não aparece");

/* ---- assuntos do "Fale de você": só assuntos, grupos pequenos ocultos ---- */
const comTemas = (n, t) => Array.from({ length: n }, () => Q.registro({ idade: "25_34", autoriza: "sim", fale_de_voce: "x" }, "2026-10", { temas: t }));
const tm = P.temas(comTemas(20, ["saude"]).concat(comTemas(4, ["moradia"])));
assert.strictEqual(tm.suprimido, false);
assert.strictEqual(tm.itens.find((i) => i.tema === "saude").n, 20);
assert.strictEqual(tm.itens.find((i) => i.tema === "moradia").n, null, "assunto com 4 mulheres fica oculto");
assert.strictEqual(P.temas(comTemas(9, ["saude"])).suprimido, true, "menos de 10 mulheres escreveram: nada aparece");
assert(!P.temas(comTemas(20, ["saude"])).itens.some((i) => i.tema === "violencia"));

/* ---- série por mês e cobertura ---- */
assert.deepStrictEqual(P.serie(muitos(12, {})).map((x) => x.n), [12]);
assert.strictEqual(P.serie(muitos(3, {}))[0].n, null);
assert.strictEqual(P.cobertura(muitos(5, {})).total, null);

/* ---- os dados de teste: marcados como teste, sem identificação, reproduzíveis ---- */
const teste = JSON.parse(ler("dados/painel_teste.json"));
assert.strictEqual(teste.meta.dados_de_teste, true, "o arquivo precisa se declarar de teste");
assert(/DADOS DE TESTE/.test(teste.meta.aviso) && /não representam nenhuma mulher real/i.test(teste.meta.aviso));
assert.strictEqual(teste.registros.length, teste.meta.registros);
teste.registros.forEach((r) => {
  assert.deepStrictEqual(Object.keys(r).sort(), ["indices", "instrumento", "periodo", "respostas", "temas_do_texto", "versao"]);
  assert(!JSON.stringify(r).includes("texto de teste") && !("fale_de_voce" in r.respostas), "o texto nunca entra nos registros");
  assert(!r.temas_do_texto.includes("violencia"), "violência nunca é registrada a partir de texto");
  assert(r.respostas.idade !== "m18" && !("autoriza" in r.respostas), "menores e autorização não entram");
});
const gerador = fs.readFileSync(path.join(web, "..", "pipeline", "gerar_dados_teste_painel.js"), "utf8");
assert(/NÃO representam[\s*]+nenhuma mulher real/.test(gerador) && /semente é fixa/.test(gerador));

/* ---- a página: sinaliza teste, não é indexada, não aparece no site público e não envia nada ---- */
const vistaDe = (html, id) => { const m = new RegExp('<section id="' + id + '"[\\s\\S]*?(?=\\n  <section id="vista-|\\n  <p id="fontes")').exec(html); assert(m, "vista não encontrada em index.html: " + id); return m[0]; };
const html = vistaDe(ler("index.html"), "vista-painel"), ui = ler("painel-ui.js"), logica = ler("painel.js").replace(/\/\*[\s\S]*?\*\//g, "");
assert(/name="robots" content="noindex, nofollow"/.test(ler("index.html")), "o site não deve ser indexado");
assert(/PROTÓTIPO COM DADOS DE TESTE/.test(html) && /login da Prefeitura/.test(html), "a faixa de teste e o aviso de login devem estar na página");
const index = ler("index.html"), app = ler("app.js"), areas = ler("areas.js");
const gestao = (/<section class="para-gestao"[\s\S]*?<\/section>/.exec(index) || [""])[0];
assert(/href="#painel"/.test(gestao) && /dados de teste/.test(gestao), "o painel é aberto pelo bloco 'Para a gestão', dito como dados de teste");
assert(!/href="#painel"/.test(index.replace(gestao, "")), "o painel só é aberto pelo bloco 'Para a gestão': nunca pelas portas, pelo acesso rápido ou pelo assistente");
assert(!/painel/i.test(areas), "o painel não entra nas áreas das mulheres");
assert(/Painel da Secretaria \(dados de teste\)/.test(app) && !/protótipo/i.test(app), "no menu o painel se chama 'dados de teste' e a palavra 'protótipo' não aparece na interface");
assert(!/localStorage|sessionStorage|indexedDB|document\.cookie|sendBeacon/.test(ui + logica), "o painel não grava nada");
assert(!/fetch\(|XMLHttpRequest|WebSocket/.test(logica), "a agregação não usa rede");
assert(!/method\s*:\s*["']POST/i.test(ui), "o painel só lê dados, não envia");
["Como ler este painel", "não são estatística representativa", "nada aqui é diagnóstico", "menos de 10 respostas", "Quem respondeu"].forEach((t) => assert((html + ui).includes(t), "o painel deve dizer: " + t));
assert(/analise_territorial\.json/.test(ui) && /ainda não foi gerada/.test(ui), "sem a análise territorial, a tela diz que não foi gerada e não inventa números");
assert(!fs.existsSync(path.join(web, "dados", "analise_territorial.json")) || JSON.parse(ler("dados/analise_territorial.json")).meta.aviso, "se a análise existir, tem de trazer o aviso de método");

console.log("painel.test.js: regra dos 10, supressão complementar, grupos pequenos, em branco ≠ zero, dados de teste marcados e painel fora do site público passaram");
