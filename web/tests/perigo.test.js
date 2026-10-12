const assert = require("assert");
const Perigo = require("../perigo.js");
const tipos = (t) => { const r = Perigo.avaliar(t); return r ? r.tipos : []; };
const nivel = (t) => { const r = Perigo.avaliar(t); return r ? r.nivel : 0; };

/* ---- situações que SEMPRE devem acender o alerta (errar para menos é o erro grave) ---- */
const deve = {
  violencia: ["meu marido me bate", "ele me ameaçou de morte", "estou apanhando em casa", "fui estuprada", "tenho medo dele", "meu ex me persegue", "ele disse que vai me matar", "sofro violência doméstica", "preciso sair de casa com segurança", "meu vizinho bate na mulher dele toda noite", "minha irmã apanha do marido", "meu marido controla meu dinheiro", "ele vigia meu celular", "meu companheiro controla com quem eu falo"],
  suicidio: ["quero me matar", "não aguento mais viver", "penso em acabar com tudo", "tenho vontade de morrer", "quero sumir"],
  crianca: ["meu padrasto abusa da minha filha", "minha filha está sendo abusada", "meu marido bate nas crianças", "ele machuca os filhos"],
  saude: ["estou com dor no peito", "meu filho desmaiou", "não consigo respirar", "ela teve convulsão", "tomou veneno"],
  risco: ["a casa está pegando fogo", "cheiro de gás"]
};
Object.keys(deve).forEach((tp) => deve[tp].forEach((t) => {
  assert(tipos(t).includes(tp), `"${t}" deveria acionar ${tp}, mas deu [${tipos(t)}]`);
  assert.strictEqual(nivel(t), 2, `"${t}" deveria ser nível 2`);
}));

/* ---- frases comuns que NÃO são perigo (falso alarme assusta e faz a pessoa desconfiar) ---- */
["quero sumir com as dívidas", "meu marido bateu o carro", "preciso de vaga na creche", "quero fazer um curso", "tem preventivo no posto?", "ola, preciso de ajuda", "onde fica o cras", "estou desempregada", "quero me matricular na escola", "meu filho morre de medo de escuro", "o professor bateu o recorde da escola", "a bateria do celular acabou", "meu filho apanha a bola e joga no gol", "meu marido controla a temperatura da casa"]
  .forEach((t) => assert.strictEqual(Perigo.avaliar(t), null, `"${t}" não deveria acionar alerta`));

/* ---- quem só pergunta por um serviço de proteção recebe aviso discreto (nível 1), não alarme ---- */
assert.strictEqual(nivel("onde fica a delegacia da mulher"), 1);
assert.strictEqual(nivel("o que é o cram"), 1);

/* ---- cada alerta traz telefone e destinos fixados; texto vazio é ignorado ---- */
const r = Perigo.avaliar("quero me matar");
assert(r.telefones.includes("188") && r.telefones.includes("192"));
assert(r.pins.some((p) => p.id === "man-saude-caps-iii"));
assert(Perigo.avaliar("meu marido me bate").telefones.includes("180"));
assert.strictEqual(Perigo.avaliar(""), null);
assert.strictEqual(Perigo.avaliar("   "), null);
/* sem acento, maiúsculas e pontuação não mudam o resultado */
assert(tipos("MEU MARIDO ME BATE!!!").includes("violencia"));
assert(tipos("nao aguento mais viver").includes("suicidio"));
/* mais de um tipo ao mesmo tempo: risco de vida vem primeiro */
assert.deepStrictEqual(tipos("quero me matar e meu marido me bate"), ["suicidio", "violencia"]);
console.log("perigo.test.js ok");
