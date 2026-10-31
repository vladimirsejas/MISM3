/* FONTE ÚNICA DOS CONTATOS DE EMERGÊNCIA (31/10/2026).
   O número, o nome e a descrição de cada contato moram só em EMERGENCIA (web/areas.js). Este teste garante que nenhuma outra cópia diverge dela:
   1) as duas listas de web/index.html (painel "Em perigo agora?" e "Contatos essenciais") são GERADAS da fonte e ficam entre marcadores;
   2) todo número em perigo.js existe na fonte;
   3) o Disque 100 de jornada-assistencia.js é o mesmo da fonte;
   4) TODA frase do site que manda ligar para um número usa um número conhecido, e todo "NNN (nome)" tem o nome certo para aquele número.
   A página continua estática de propósito: a lista de emergência precisa aparecer mesmo se o JavaScript falhar.

   Comandos:
     node web/tests/emergencia.test.js                  confere (é o que a CI faz)
     node web/tests/emergencia.test.js --sincronizar    reescreve as duas listas do index.html a partir da fonte (use depois de editar EMERGENCIA) */
const assert = require("assert"), fs = require("fs"), path = require("path");
const Areas = require("../areas.js");
const web = path.join(__dirname, "..");
const E = Areas.EMERGENCIA;
const sincronizar = process.argv.includes("--sincronizar");

/* ---- 1. A forma da fonte ---- */
assert(Array.isArray(E) && E.length >= 3, "EMERGENCIA existe");
const numeros = E.map((e) => e.tel);
assert.strictEqual(new Set(numeros).size, numeros.length, "nenhum número repetido na fonte");
["190", "192", "180"].forEach((n) => assert(numeros.includes(n), "o contato " + n + " nunca pode sair da fonte"));
E.forEach((e) => {
  assert(/^\d{3}$/.test(e.tel), "número de 3 dígitos: " + e.tel);
  assert(e.nome && e.quando, "nome e descrição de " + e.tel);
  [e.nome, e.quando, e.rotulo || "", e.contato || ""].forEach((t) => assert(!/[<>&"]/.test(t), "sem caractere de HTML na fonte: " + e.tel));
});
const nomeCurto = (e) => e.rotulo || e.nome;

/* ---- 2. As duas listas do index.html são geradas da fonte ---- */
const arqIndex = path.join(web, "index.html");
let html = fs.readFileSync(arqIndex, "utf8");
const fimDeLinha = html.includes("\r\n") ? "\r\n" : "\n";
html = html.replace(/\r\n/g, "\n");
const painel = E.map((e) => `          <li><a class="tel" href="tel:${e.tel}" aria-label="Ligar para ${e.tel}, ${nomeCurto(e)}">${e.tel}</a><div><strong>${e.nome}</strong><span>${e.quando}</span></div></li>`).join("\n");
const contatos = E.filter((e) => typeof e.contato === "string").map((e) => `          <li><span class="c-nome">${e.nome}${e.contato ? "<small>" + e.contato + "</small>" : ""}</span><a class="c-tel grave" href="tel:${e.tel}" aria-label="Ligar para ${e.tel}, ${nomeCurto(e)}">${e.tel}</a></li>`).join("\n");
const GERADOS = { painel: painel, contatos: contatos };
let reescreveu = false;
Object.keys(GERADOS).forEach((nome) => {
  const re = new RegExp("( *<!-- EMERGENCIA-INICIO " + nome + ":[^\\n]*-->\\n)([\\s\\S]*?)\\n( *<!-- EMERGENCIA-FIM " + nome + " -->)");
  const m = re.exec(html);
  assert(m, "faltam os marcadores EMERGENCIA-INICIO/FIM '" + nome + "' no index.html");
  if (m[2] !== GERADOS[nome]) {
    if (sincronizar) { html = html.replace(re, (_, a, _b, c) => a + GERADOS[nome] + "\n" + c); reescreveu = true; }
    else assert.fail("A lista '" + nome + "' do web/index.html NÃO é igual à fonte EMERGENCIA de web/areas.js.\n  Se você mudou a fonte, rode:  node web/tests/emergencia.test.js --sincronizar\n  Se mudou o HTML à mão, desfaça: o número, o nome e a descrição moram só na fonte.");
  }
});
if (reescreveu) { fs.writeFileSync(arqIndex, html.replace(/\n/g, fimDeLinha)); console.log("emergencia: index.html reescrito a partir da fonte."); process.exit(0); }
["190", "192", "180"].forEach((n) => assert(new RegExp('<a class="c-tel grave" href="tel:' + n + '"').test(html), "Contatos essenciais mantém o " + n));
assert((html.match(/<a class="tel" href="tel:/g) || []).length === E.length, "o painel tem um link por contato da fonte");

/* ---- 3. perigo.js: todo telefone fixado nos alertas existe na fonte ---- */
const lerWeb = (f) => fs.readFileSync(path.join(web, f), "utf8");
const perigo = lerWeb("perigo.js");
const fixados = [];
(perigo.match(/telefones:\s*\[[^\]]*\]/g) || []).forEach((bloco) => (bloco.match(/\d{3}/g) || []).forEach((n) => fixados.push(n)));
assert(fixados.length >= 8, "perigo.js fixa telefones nos alertas (achei " + fixados.length + ")");
fixados.forEach((n) => assert(numeros.includes(n), "perigo.js fixa o telefone " + n + ", que não está na fonte EMERGENCIA"));

/* ---- 4. jornada-assistencia.js: o Disque 100 é o da fonte ---- */
const d100 = /DISQUE_100\s*=\s*\{\s*nome:\s*"([^"]+)",\s*telefone:\s*"(\d+)"\s*\}/.exec(lerWeb("jornada-assistencia.js"));
const f100 = E.find((e) => e.tel === "100");
assert(d100 && f100 && d100[2] === f100.tel && d100[1] === f100.nome, "DISQUE_100 de jornada-assistencia.js igual ao da fonte");

/* ---- 5. Toda frase do site que cita um número de emergência ---- */
const NOME_DO_NUMERO = { 190: /Pol[ií]cia|emerg[êe]ncia/i, 192: /SAMU/i, 193: /Bombeiros/i, 180: /Central de Atendimento|viol[êe]ncia/i, 188: /CVV/i, 100: /24 horas|Direitos Humanos/i };
const OUTROS = { 132: "contato de um grupo de ajuda mútua (areas.js)", 135: "telefone do INSS, para pedir o BPC (areas.js)" };
const arquivos = fs.readdirSync(web).filter((f) => f.endsWith(".js")).concat(["index.html"]);
let frases = 0, pares = 0, rotulos = 0;
arquivos.forEach((f) => {
  const t = lerWeb(f);
  /* 5a. "ligue 180", "Disque 100", "ligar para o 192", "tel:190": o número tem de ser conhecido */
  const ctx = /(?:ligue|ligar|liga|disque|chame|telefone|tel:)\s*(?:para\s*)?(?:o\s*)?(?:ao\s*)?(\d{3})\b/gi;
  let m;
  while ((m = ctx.exec(t))) {
    frases++;
    assert(numeros.includes(m[1]) || OUTROS[m[1]], f + ': a frase "' + t.slice(Math.max(0, m.index - 15), m.index + 40).replace(/\s+/g, " ") + '" cita o número ' + m[1] + ", que não é da fonte EMERGENCIA nem dos outros números conhecidos (" + Object.keys(OUTROS).join(", ") + ")");
  }
  /* 5b. "190 (Polícia)", "180 (Central de Atendimento à Mulher)": o nome combina com o número */
  const par = /\b(190|192|193|180|188|100)\s*\(([^)]{2,60})\)/g;
  while ((m = par.exec(t))) {
    pares++;
    assert(NOME_DO_NUMERO[m[1]].test(m[2]), f + ': "' + m[0] + '": o nome não combina com o número ' + m[1]);
  }
  /* 5c. aria-label "Ligar para 190, Polícia Militar": igual ao nome curto da fonte */
  const rot = /Ligar para (\d{3}), ([^"]+)"/g;
  while ((m = rot.exec(t))) {
    rotulos++;
    const e = E.find((x) => x.tel === m[1]);
    assert(e && nomeCurto(e) === m[2], f + ': aria-label "' + m[0] + '" diferente da fonte');
  }
});
assert(frases >= 40 && pares >= 8 && rotulos >= 10, "o teste leu frases suficientes (" + frases + " frases, " + pares + " pares, " + rotulos + " rótulos): se caiu, a leitura quebrou");

console.log("emergencia.test.js: fonte única de " + E.length + " contatos; listas do index.html geradas dela; perigo.js (" + fixados.length + " telefones), Disque 100 e " + frases + " frases, " + pares + " pares número-nome e " + rotulos + " rótulos conferidos");
