const assert = require("assert");
const Perigo = require("../perigo.js");
const tipos = (t) => { const r = Perigo.avaliar(t); return r ? r.tipos : []; };
const nivel = (t) => { const r = Perigo.avaliar(t); return r ? r.nivel : 0; };

/* ---- situações que SEMPRE devem acender o alerta (errar para menos é o erro grave) ---- */
const deve = {
  violencia: ["meu marido me bate", "ele me ameaçou de morte", "estou apanhando em casa", "fui estuprada", "tenho medo dele", "meu ex me persegue", "ele disse que vai me matar", "sofro violência doméstica", "preciso sair de casa com segurança", "meu vizinho bate na mulher dele toda noite", "minha irmã apanha do marido", "meu marido controla meu dinheiro", "ele vigia meu celular", "meu companheiro controla com quem eu falo"],
  suicidio: ["pensei em tomar todos os remédios", "queria dormir e não acordar mais", "minha vida não tem mais sentido, não quero estar aqui", "estou pensando em me jogar da ponte", "vou me enforcar", "quero me matar", "não aguento mais viver", "penso em acabar com tudo", "tenho vontade de morrer", "quero sumir"],
  crianca: ["meu padrasto abusa da minha filha", "minha filha está sendo abusada", "meu marido bate nas crianças", "ele machuca os filhos", "meu padrasto mexe com a minha filha de 9 anos", "a criança lá de casa apanha de cinto toda noite", "minha neta de 7 anos contou que o tio passa a mão nela"],
  saude: ["minha mãe caiu e não responde", "meu filho engasgou e está roxo", "estou com dor no peito", "meu filho desmaiou", "não consigo respirar", "ela teve convulsão", "tomou veneno"],
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

/* ---- detector aprendido (junto com as regras): generaliza para frases que as listas de palavras não conhecem ---- */
const fs = require("fs"), path = require("path");
const modelo = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "dados", "modelo_perigo.json"), "utf8"));
Perigo.usarModelo(modelo);
const alto = ["meu companheiro me empurrou da escada e eu tenho medo de voltar", "comprei corda pra me matar", "meu irmao esta com o corpo duro e olhos revirados"];
alto.forEach((t) => assert(Perigo.avaliar(t) && Perigo.avaliar(t).nivel >= 1, `o detector deveria reagir a "${t}"`));
/* aviso discreto (nível 1) não fixa serviços: não deve sequestrar a lista de resultados */
const r1 = Perigo.avaliar("meu filho caiu e ralou o joelho, onde faço curativo");
assert(!r1 || r1.nivel < 2, "joelho ralado não é emergência");
/* sem o modelo, só valem as regras (nada quebra) */
/* âncora: o detector sozinho não dispara sem uma palavra do assunto ("tirar férias" não é "tirar a vida") */
["vou tirar ferias em dezembro", "quero tirar uma duvida sobre pensao", "quero tirar carteira de motorista", "vou tirar o lixo"].forEach((t) => {
  const r = Perigo.avaliar(t);
  assert(!r || r.nivel < 2, `"${t}" não deve gerar alerta completo`);
});
["tentou me estrangular ontem", "dormi no carro porque tenho medo de entrar em casa", "ja escrevi minha despedida", "meus filhos ficariam melhor sem a mae"].forEach((t) => assert(Perigo.avaliar(t) && Perigo.avaliar(t).nivel === 2, `deve alertar: ${t}`));
Perigo.usarModelo(null);
assert(Perigo.avaliar("meu marido me bate").nivel === 2 && Perigo.avaliar("preciso de creche") === null);
Perigo.usarModelo(modelo);
console.log("perigo.test.js ok");
