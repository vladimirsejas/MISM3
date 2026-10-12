const assert = require("assert");
const fs = require("fs");
const path = require("path");

const web = path.resolve(__dirname, "..");
const ler = (f) => fs.readFileSync(path.join(web, f), "utf8");
const EM = require("../entre-mulheres.js");
const Areas = require("../areas.js");

const cat = Areas.REDE_OFERTAS.categorias[0];
const ok = { nome: "Ana Cabeleireira", descricao: "Corte e escova em casa, com hora marcada", atende: "Perto do CVZ", contato: "(19) 99999-0000", mulher: true, consentimento: true };

/* ---- validação: nada sem consentimento, só para mulheres, sem dados pessoais ---- */
assert.strictEqual(EM.validar(ok).ok, true);
assert.strictEqual(EM.validar(Object.assign({}, ok, { consentimento: false })).ok, false, "sem consentimento não prepara cadastro");
assert.strictEqual(EM.validar(Object.assign({}, ok, { mulher: false })).ok, false, "o espaço é só para mulheres");
assert(EM.validar({}).erros.nome && EM.validar({}).erros.contato && EM.validar({}).erros.consentimento);
assert(EM.validar(Object.assign({}, ok, { nome: "A" })).erros.nome, "nome curto demais");
assert(EM.validar(Object.assign({}, ok, { descricao: "x".repeat(201) })).erros.descricao, "descrição acima do limite");
assert(EM.validar(Object.assign({}, ok, { contato: "só aviso" })).erros.contato, "contato precisa ser um meio de falar com ela");
assert(EM.validar(Object.assign({}, ok, { descricao: "Meu CPF é 123.456.789-09 e faço unhas" })).erros.descricao, "CPF na descrição é recusado");
assert.strictEqual(EM.validar(Object.assign({}, ok, { contato: "@ana.cabelo no Instagram" })).ok, true, "rede social vale como contato");
assert.strictEqual(EM.validar(Object.assign({}, ok, { nome: "  Ana   Cabeleireira  " })).dados.nome, "Ana Cabeleireira", "espaços sobrando saem");

/* ---- o cadastro vira texto com o termo de consentimento e a data ---- */
assert.strictEqual(EM.montarCadastro({}, cat, "2026-10-11"), null, "sem dados válidos, não monta");
const texto = EM.montarCadastro(ok, cat, "2026-10-11");
["CADASTRO", cat.titulo, "Ana Cabeleireira", "AUTORIZO a publicação dos dados acima, e somente deles", "sem fins lucrativos", "retirada a qualquer momento", "11/10/2026"].forEach((t) => assert(texto.includes(t), "o cadastro deve conter: " + t));
assert(!/cpf|rg\b/i.test(texto.replace(/Declaro[\s\S]*$/, "")), "nenhum dado pessoal além do escolhido");

/* ---- canais: só existem se a equipe os cadastrou ---- */
const cfg = JSON.parse(ler("dados/entre_mulheres_canal.json"));
assert.strictEqual(cfg.whatsapp, null, "enquanto não houver canal acordado, fica vazio: nada de número inventado");
assert.strictEqual(cfg.email, null);
assert.deepStrictEqual(EM.canalDisponivel(cfg), { whatsapp: null, email: null });
assert.deepStrictEqual(EM.canalDisponivel({ whatsapp: "5519999999999", email: "a@b.gov.br" }), { whatsapp: "5519999999999", email: "a@b.gov.br" });
assert.strictEqual(EM.canalDisponivel({ whatsapp: "abc", email: "sem-arroba" }).whatsapp, null, "número inválido é ignorado");
assert.strictEqual(EM.linkWhatsapp(null, "x"), null);
assert(/^https:\/\/wa\.me\/5519999999999\?text=/.test(EM.linkWhatsapp("5519999999999", "olá & tchau")) && !/&\s/.test(EM.linkWhatsapp("5519999999999", "olá & tchau")), "texto codificado no link");
assert(/^mailto:a@b\.gov\.br\?subject=/.test(EM.linkEmail("a@b.gov.br", "x")));

/* ---- a página: uma aba por categoria, cada uma com o seu espaço; nada enviado nem gravado ---- */
const ui = ler("entre-mulheres-ui.js"), logica = ler("entre-mulheres.js").replace(/\/\*[\s\S]*?\*\//g, ""), pagina = (function () { const vistaDe = (html, id) => { const m = new RegExp('<section id="' + id + '"[\\s\\S]*?(?=\\n  <section id="vista-|\\n  <p id="fontes")').exec(html); assert(m, "vista não encontrada em index.html: " + id); return m[0]; };
 return vistaDe(ler("index.html"), "vista-entre-mulheres"); })(), appjs = ler("app.js");
assert(/role="tablist"/.test(ui) && /role="tab"/.test(ui) && /role="tabpanel"/.test(ui) && /aria-selected/.test(ui) && /ArrowRight/.test(ui), "abas acessíveis, com teclado");
assert(/CATS\.map\(painel\)/.test(ui) && /formulario\(c\)/.test(ui), "cada categoria tem o seu painel com o seu formulário");
assert(!/localStorage|sessionStorage|indexedDB|document\.cookie|sendBeacon/.test(ui + logica), "não grava nada");
assert(!/method\s*:\s*["']POST/i.test(ui) && (ui.match(/fetch\(/g) || []).length === 1, "só lê arquivos do próprio site; não envia");
assert(!/fetch\(|XMLHttpRequest/.test(logica));
assert(/rel="noopener noreferrer"/.test(ui), "link externo seguro");
assert(!/<form[^>]*action=/.test(ui + pagina), "nenhum formulário envia a lugar nenhum");
assert(appjs.includes('scripts: ["entre-mulheres.js", "entre-mulheres-ui.js"]') && appjs.includes("EntreMulheresUI.iniciar"), "a vista carrega a lógica antes da tela e inicia a tela, só quando é aberta");
assert(/replaceState\(null, "", "#entre-mulheres\/"/.test(ui) && !/replaceState\(null, "", "#" \+ id\)/.test(ui), "as categorias não podem usar #transporte etc.: colidiriam com as áreas do dashboard");
assert(/Nada é enviado por esta página/.test(ui) && /O canal que recebe cadastros ainda não foi definido/.test(ui), "a página diz a verdade sobre o que acontece com o cadastro");
assert(!/identidade verificada|selo de confiança/i.test(ui), "sem selo nem verificação que não existe");
Areas.REDE_OFERTAS.categorias.forEach((c) => assert(c.exemplo && c.titulo, "categoria completa: " + c.id));

console.log("entre_mulheres.test.js: validação, termo de consentimento, canais, abas por categoria e privacidade passaram");
