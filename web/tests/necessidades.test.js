const assert = require("assert");
const N = require("../necessidades.js");

const ids = t => N.identificar(t).map(n => n.id);
const mesmoConjunto = (frase, esperado) => {
  const obtido = ids(frase);
  assert.deepStrictEqual([...obtido].sort(), [...esperado].sort(),
    `"${frase}": esperado [${esperado}] mas veio [${obtido}]`);
};

/* ---- Lista de aceitacao: frases da apresentacao (do documento de discussao + variacoes reais) ---- */
const FRASES = [
  // as tres historias da apresentacao (varias necessidades na mesma frase)
  ["Preciso de emprego, mas tenho uma criança pequena.", ["emprego", "filhos"]],
  ["Quero me separar e não tenho dinheiro para pagar advogado.", ["casamento", "familia"]],
  ["Quero estudar, mas não tenho com quem deixar meus filhos.", ["estudo", "filhos"]],
  // uma palavra, com e sem acento, maiusculas
  ["violência", ["violencia"]], ["violencia", ["violencia"]], ["VIOLÊNCIA", ["violencia"]],
  ["Saúde", ["saude"]], ["família", ["familia"]], ["emprego", ["emprego"]], ["estudo", ["estudo"]],
  ["filhos", ["filhos"]], ["casamento", ["casamento"]], ["ônibus", ["transporte"]],
  // violencia dita de forma indireta
  ["ele me bate", ["violencia"]], ["fui agredida", ["violencia"]], ["ele me ameaça", ["violencia"]],
  ["tenho medo dele", ["violencia"]], ["sofro violência em casa", ["violencia"]], ["meu ex me persegue", ["violencia"]],
  ["meu marido não deixa eu sair de casa", ["violencia", "casamento"]],
  // trabalho e renda
  ["estou desempregada", ["emprego"]], ["quero abrir um negócio", ["emprego"]], ["preciso ganhar dinheiro", ["emprego"]],
  ["perdi meu emprego e não consigo pagar o aluguel", ["emprego", "familia"]],
  // familia e assistencia
  ["Preciso de Bolsa Família", ["familia"]], ["não tenho dinheiro para comer", ["familia"]], ["preciso de cesta básica", ["familia"]],
  // direitos
  ["quero me divorciar", ["casamento"]], ["preciso de uma advogada", ["casamento"]],
  ["quero pedir a guarda dos meus filhos", ["casamento", "filhos"]],
  // filhos e saude
  ["preciso de uma creche", ["filhos"]], ["vaga na creche", ["filhos"]], ["meu filho está doente", ["filhos", "saude"]],
  ["estou grávida e preciso de pré-natal", ["filhos", "saude"]], ["estou com ansiedade", ["saude"]], ["onde fica a UBS mais perto", ["saude"]],
  // estudo e transporte
  ["quero voltar a estudar", ["estudo"]], ["quero fazer um curso de costura", ["estudo"]],
  ["como chegar de ônibus ao trabalho", ["transporte", "emprego"]],
  // NAO deve reconhecer (palavra amplas ou pedaco de palavra)
  ["vou divagar sobre a vida", []], ["guarda municipal", []], ["preciso de dinheiro", []],
  ["tenho medo de dirigir", []], ["bom dia", []], ["   ", []], ["xyz", []], ["paternidade", []],
];
FRASES.forEach(([frase, esperado]) => mesmoConjunto(frase, esperado));
assert.deepStrictEqual(ids(null), []);

/* ---- Regras de ordem e limite ---- */
// violencia (urgente) sempre primeiro, mesmo no fim da frase
assert.strictEqual(ids("preciso de emprego e meu marido me bate")[0], "violencia");
// o resto segue a ordem em que a pessoa escreveu
assert.deepStrictEqual(ids("preciso de emprego e de uma creche"), ["emprego", "filhos"]);
assert.deepStrictEqual(ids("preciso de uma creche e de emprego"), ["filhos", "emprego"]);
// no maximo 3 necessidades por frase
assert(ids("emprego, creche, saúde, estudo, ônibus e família").length <= 3);
// "escola" e ambigua (estudar ou deixar o filho): mostra as duas, a pessoa remove a que nao serve
assert.deepStrictEqual(ids("escola").sort(), ["estudo", "filhos"]);

/* ---- Contrato de cada necessidade ---- */
assert(N.porId("violencia").urgente && /180/.test(N.porId("violencia").aviso) && /190/.test(N.porId("violencia").aviso));
assert.deepStrictEqual(N.porId("transporte").tipos, []);              // transporte nao inventa horario
assert(N.porId("transporte").links[0].url.startsWith("https://"));
assert.strictEqual(N.porId("inexistente"), null);

/* ---- Separar grupos: destaque na ordem da necessidade, o resto fica em "outros" ---- */
const grupos = ["mulher", "assistencia", "creche", "educacao_infantil", "saude", "emprego_curso"].map(t => ({ tipo: t }));
const s = N.separar(grupos, [N.porId("filhos")]);
assert.deepStrictEqual(s.destaque.map(g => g.tipo), ["creche", "educacao_infantil", "saude", "assistencia"]);
assert.deepStrictEqual(s.outros.map(g => g.tipo), ["mulher", "emprego_curso"]);
assert.deepStrictEqual(N.separar(grupos, []).destaque, []);

console.log("necessidades.js: todos os testes passaram (" + FRASES.length + " frases)");
