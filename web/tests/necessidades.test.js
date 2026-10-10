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
  ["quero opções de lazer", ["lazer"]], ["atividades culturais", ["lazer"]], ["quero praticar esporte", ["lazer"]],
  ["o que fazer no fim de semana", ["lazer"]], ["qual horário do ônibus", ["transporte"]],
  // violencia dita de forma indireta
  ["ele me bate", ["violencia"]], ["fui agredida", ["violencia"]], ["ele me ameaça", ["violencia"]],
  ["tenho medo dele", ["violencia"]], ["sofro violência em casa", ["violencia"]], ["meu ex me persegue", ["violencia"]],
  ["meu marido não deixa eu sair de casa", ["violencia", "casamento"]],
  // trabalho e renda
  ["estou desempregada", ["emprego"]], ["quero abrir um negócio", ["emprego"]], ["preciso ganhar dinheiro", ["emprego"]],
  ["perdi meu emprego e não consigo pagar o aluguel", ["emprego", "moradia"]],   // aluguel agora e MORADIA (decisao vinda da main)
  // familia e assistencia
  ["Preciso de Bolsa Família", ["familia"]], ["não tenho dinheiro para comer", ["familia"]], ["preciso de cesta básica", ["familia"]],
  // direitos
  ["quero me divorciar", ["casamento"]], ["preciso de uma advogada", ["casamento"]],
  ["quero pedir a guarda dos meus filhos", ["casamento", "filhos"]],
  // filhos e saude
  ["preciso de uma creche", ["filhos"]], ["vaga na creche", ["filhos"]], ["meu filho está doente", ["filhos", "saude"]],
  ["estou grávida e preciso de pré-natal", ["saude"]], ["estou com ansiedade", ["saude"]], ["onde fica a UBS mais perto", ["saude"]],
  // estudo e transporte
  ["quero voltar a estudar", ["estudo"]], ["quero fazer um curso de costura", ["estudo"]],
  ["como chegar de ônibus ao trabalho", ["transporte", "emprego"]],
  // NAO deve reconhecer (palavra amplas ou pedaco de palavra)
  ["vou divagar sobre a vida", []], ["guarda municipal", []], ["preciso de dinheiro", []],
  ["tenho medo de dirigir", []], ["bom dia", []], ["   ", []], ["xyz", []], ["paternidade", []],
  // ---- frases acrescentadas da lista de testes do ChatGPT (2026-10-09), com a expectativa decidida na consolidacao:
  ["quero ajuda por causa de violência doméstica", ["violencia"]], ["ele me bateu ontem", ["violencia"]],
  ["me controla e me ameaça", ["violencia"]], ["preciso de medida protetiva", ["violencia"]],
  ["separação e orientação jurídica", ["casamento"]], ["quero me separar", ["casamento"]],
  ["não tenho dinheiro para advogado e quero me separar", ["casamento", "familia"]],
  ["emprego e filhos", ["filhos", "emprego"]], ["preciso de creche e emprego", ["filhos", "emprego"]],
  ["estudar e conseguir vaga na creche", ["filhos", "estudo"]], ["quero bolsa de estudos", ["estudo"]],
  ["estou passando fome", ["familia"]], ["quero uma vaga de emprego", ["emprego"]],
  ["quero consulta com ginecologista", ["saude"]], ["meu filho precisa de consulta", ["filhos", "saude"]],
  ["marido, filhos e emprego", ["casamento", "filhos", "emprego"]], ["quero estudar e trabalhar", ["emprego", "estudo"]],
  ["a vaga-lume apareceu no quintal", []], ["bolsa de couro", []],
  ["Preciso de emprego e de uma vaga na creche para meu filho", ["filhos", "emprego"]],
  ["Quero me separar, mas não tenho dinheiro para pagar uma advogada", ["casamento", "familia"]],
  ["Meu marido me ameaça e não deixa eu sair", ["violencia", "casamento"]],
  // decididas na consolidacao (a lista dele esperava outra coisa):
  ["estou grávida e preciso de atendimento", ["saude"]],               // gestante e SAUDE, nao creche
  ["preciso de curso de qualificação", ["emprego", "estudo"]],           // qualificar serve ao trabalho e ao estudo
  ["quero conversar sobre escola de samba", []],                         // "escola de samba" nao e estudo
  ["preciso de aluguel social", ["moradia"]],
  ["estou com medo de despejo e preciso de moradia", ["moradia"]],
  ["preciso sair de casa", ["violencia", "moradia"]],
  ["quero fazer cadastro habitacional", ["moradia"]],
  ["quero renegociar minhas dívidas", ["dividas"]],
  ["não consigo pagar as contas do cartão", ["dividas"]],
  ["quero simular minha aposentadoria no INSS", ["dividas"]],
  ["estou sem dinheiro para comer e com contas atrasadas", ["dividas", "familia"]],
  // lacunas achadas na auditoria: palavras flexionadas que a busca por palavra inteira nao reconhecia
  ["estou endividada", ["dividas"]],
  ["quero me aposentar", ["dividas"]],
  ["estou endividada e quero me aposentar", ["dividas"]],
  ["preciso de aluguel e estou desempregada", ["moradia", "emprego"]],
  // seguranca: pedido para sair de casa SEMPRE traz a violencia (com o aviso do 180), mesmo junto de moradia
  ["preciso sair de casa, ele me bate", ["violencia", "moradia"]],
  ["", []],
  ["   ", []]
];
FRASES.forEach(([frase, esperado]) => mesmoConjunto(frase, esperado));
assert.deepStrictEqual(ids(null), []);
assert.deepStrictEqual(N.identificarCategorias("emprego e filhos").sort(), ["emprego_curso", "filhos"]);   // nome das portas
assert.strictEqual(N.normalizar("Violência, separação e SAÚDE!"), "violencia separacao e saude");

/* ---- Regras de ordem e limite ---- */
// violencia (urgente) sempre primeiro, mesmo no fim da frase
assert.strictEqual(ids("preciso de emprego e meu marido me bate")[0], "violencia");
// o resto segue a ordem em que a pessoa escreveu
assert.deepStrictEqual(ids("preciso de emprego e de uma creche"), ["emprego", "filhos"]);
assert.deepStrictEqual(ids("preciso de uma creche e de emprego"), ["filhos", "emprego"]);
// no maximo 3 necessidades por frase
assert(ids("emprego, creche, saúde, estudo, ônibus e família").length <= 3);
// "escola" sozinha e estudo; a escola DO FILHO entra por expressao
assert.deepStrictEqual(ids("escola"), ["estudo"]);
assert.deepStrictEqual(ids("preciso levar na escola").sort(), ["filhos"]);
assert.deepStrictEqual(ids("estou grávida"), ["saude"]);   // gestante e saude, nao creche

/* ---- Contrato de cada necessidade ---- */
assert(N.porId("violencia").urgente && /180/.test(N.porId("violencia").aviso) && /190/.test(N.porId("violencia").aviso));
assert.deepStrictEqual(N.porId("transporte").tipos, []);              // transporte nao inventa horario
assert(N.porId("lazer") && N.porId("lazer").tipos.length === 0, "lazer deve abrir a agenda própria, sem inventar serviços no mapa");
assert(N.porId("lazer").palavras.every(p => !p.includes("horario")), "horário continua sendo palavra da necessidade transporte");
assert(N.porId("transporte").palavras.includes("horario*"), "horário permanece na necessidade transporte");
assert(N.porId("transporte").links[0].url.startsWith("https://"));
assert.strictEqual(N.porId("inexistente"), null);

/* ---- Separar grupos: destaque na ordem da necessidade, o resto fica em "outros" ---- */
const grupos = ["mulher", "assistencia", "creche", "educacao_infantil", "saude", "emprego_curso"].map(t => ({ tipo: t }));
const s = N.separar(grupos, [N.porId("filhos")]);
assert.deepStrictEqual(s.destaque.map(g => g.tipo), ["creche", "educacao_infantil", "saude", "assistencia"]);
assert.deepStrictEqual(s.outros.map(g => g.tipo), ["mulher", "emprego_curso"]);
assert.deepStrictEqual(N.separar(grupos, []).destaque, []);

// ordem: violencia sempre primeiro
assert.strictEqual(ids("preciso sair de casa")[0], "violencia");
assert.strictEqual(ids("preciso de aluguel social e tenho medo dele")[0], "violencia");

console.log("necessidades.js: todos os testes passaram (" + FRASES.length + " frases)");
