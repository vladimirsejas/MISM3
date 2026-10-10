const assert = require("assert");
const busca = require("../necessidades.js");

const casos = [
  ["violência", ["violencia"]],
  ["VIOLÊNCIA", ["violencia"]],
  ["violencia", ["violencia"]],
  ["quero ajuda por causa de violência doméstica", ["violencia"]],
  ["ele me bate", ["violencia"]],
  ["ele me bateu ontem", ["violencia"]],
  ["tenho medo dele", ["violencia"]],
  ["meu marido não deixa eu sair", ["violencia", "casamento"]],
  ["me controla e me ameaça", ["violencia"]],
  ["preciso de medida protetiva", ["violencia"]],
  ["quero me separar", ["casamento"]],
  ["quero me divorciar", ["casamento"]],
  ["separação e orientação jurídica", ["casamento"]],
  ["não tenho dinheiro para advogado e quero me separar", ["casamento", "familia"]],
  ["emprego e filhos", ["filhos", "emprego_curso"]],
  ["preciso de creche e emprego", ["filhos", "emprego_curso"]],
  ["estudar e conseguir vaga na creche", ["filhos", "estudo"]],
  ["quero voltar a estudar", ["estudo"]],
  ["bolsa família", ["familia"]],
  ["quero bolsa de estudos", ["estudo"]],
  ["não tenho dinheiro para comer", ["familia"]],
  ["estou passando fome", ["familia"]],
  ["preciso de cesta básica", ["familia"]],
  ["quero uma vaga de emprego", ["emprego_curso"]],
  ["preciso de curso de qualificação", ["emprego_curso"]],
  ["quero consulta com ginecologista", ["saude"]],
  ["estou grávida e preciso de atendimento", ["saude"]],
  ["meu filho precisa de consulta", ["filhos", "saude"]],
  ["marido, filhos e emprego", ["casamento", "filhos", "emprego_curso"]],
  ["quero estudar e trabalhar", ["emprego_curso", "estudo"]],
  ["vou divagar sobre esse assunto", []],
  ["a vaga-lume apareceu no quintal", []],
  ["bolsa de couro", []],
  ["quero conversar sobre escola de samba", ["estudo"]],
  ["Preciso de emprego e de uma vaga na creche para meu filho", ["filhos", "emprego_curso"]],
  ["Quero me separar, mas não tenho dinheiro para pagar uma advogada", ["casamento", "familia"]],
  ["Meu marido me ameaça e não deixa eu sair", ["violencia", "casamento"]],
  ["preciso de aluguel social", ["moradia"]],
  ["estou com medo de despejo e preciso de moradia", ["moradia"]],
  ["quero fazer cadastro habitacional", ["moradia"]],
  ["quero renegociar minhas dívidas", ["dividas"]],
  ["não consigo pagar as contas do cartão", ["dividas"]],
  ["quero simular minha aposentadoria no INSS", ["dividas"]],
  ["estou sem dinheiro para comer e com contas atrasadas", ["dividas", "familia"]],
  ["", []],
  ["   ", []]
];

let falhas = [];
casos.forEach(([frase, esperado]) => {
  const obtido = busca.identificarCategorias(frase);
  try {
    assert.deepStrictEqual(obtido, esperado);
  } catch (e) {
    falhas.push({frase, esperado, obtido});
  }
});
assert.strictEqual(busca.normalizar("Violência, separação e SAÚDE!"), "violencia separacao e saude");
if (falhas.length) {
  console.error(JSON.stringify(falhas, null, 2));
  process.exitCode = 1;
} else {
  console.log("necessidades.js: " + casos.length + " cenários passaram");
}
