const assert = require("assert");
const N = require("../necessidades.js");
const ids = t => N.identificar(t).map(n => n.id);

// as palavras do grupo: emprego, saude, estudo, filhos, casamento, violencia, familia
assert.deepStrictEqual(ids("emprego"), ["emprego"]);
assert.deepStrictEqual(ids("Saúde"), ["saude"]);
assert.deepStrictEqual(ids("ESTUDO"), ["estudo"]);
assert.deepStrictEqual(ids("filhos"), ["filhos"]);
assert.deepStrictEqual(ids("casamento"), ["casamento"]);
assert.deepStrictEqual(ids("violência"), ["violencia"]);
assert.deepStrictEqual(ids("família"), ["familia"]);
assert.deepStrictEqual(ids("ônibus"), ["transporte"]);

// frase livre; acento e pontuacao nao atrapalham; urgencia sempre primeiro
assert.deepStrictEqual(ids("Preciso de um emprego e deixar meu filho!").sort(), ["emprego", "filhos"]);
assert.strictEqual(ids("tenho medo do meu marido, preciso de emprego")[0], "violencia");
assert(ids("tenho medo do meu marido").includes("casamento"));

// palavra inteira: "pat" nao casa dentro de "paternidade"; texto vazio ou desconhecido = nada
assert.deepStrictEqual(ids("paternidade"), []);
assert.deepStrictEqual(ids("   "), []);
assert.deepStrictEqual(ids("xyz"), []);
assert.deepStrictEqual(ids(null), []);

// violencia e marcada como urgente e traz os telefones; transporte nao inventa horario
assert(N.porId("violencia").urgente && /180/.test(N.porId("violencia").aviso) && /190/.test(N.porId("violencia").aviso));
assert.deepStrictEqual(N.porId("transporte").tipos, []);
assert(N.porId("transporte").links[0].url.startsWith("https://"));

// separar grupos: destaque na ordem da necessidade, o resto fica em "outros"
const grupos = ["mulher", "assistencia", "creche", "educacao_infantil", "saude", "emprego_curso"].map(t => ({ tipo: t }));
const s = N.separar(grupos, [N.porId("filhos")]);
assert.deepStrictEqual(s.destaque.map(g => g.tipo), ["creche", "educacao_infantil", "saude", "assistencia"]);
assert.deepStrictEqual(s.outros.map(g => g.tipo), ["mulher", "emprego_curso"]);
assert.deepStrictEqual(N.separar(grupos, []).destaque, []);
console.log("necessidades.js: todos os testes passaram");
