/* Classificador de aviso (nível 1): web/dados/modelo_aviso_n1.json, treinado por pipeline/treinar_n1.py.
   Regras que este teste garante:
   1. sem o modelo carregado, nada muda em relação às regras;
   2. com o modelo, ele só PROMOVE "nenhum alerta" para aviso de nível 1: nenhuma frase que as regras já classificavam muda de nível;
   3. frases de nível 2 continuam em nível 2;
   4. pedidos comuns de serviço e frases do dia a dia continuam sem alerta.
   As frases abaixo são de DESENVOLVIMENTO (escritas por IA para testar o orientador); os acertos nelas não estimam o acerto em frases novas. */
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const dir = path.join(__dirname, "..", "dados");
const ler = (n) => JSON.parse(fs.readFileSync(path.join(dir, n), "utf8"));

function carregar(comAviso) {
  delete require.cache[require.resolve("../perigo.js")];
  const P = require("../perigo.js");
  P.usarModelo(ler("modelo_perigo.json"));
  if (comAviso) P.usarModeloAviso(ler("modelo_aviso_n1.json"));
  return P;
}
const sem = carregar(false);
const com = carregar(true);
const nivel = (P, t) => { const x = P.avaliar(t); return x ? x.nivel : 0; };

const modelo = ler("modelo_aviso_n1.json");
assert.deepStrictEqual(modelo.classes, ["aviso"], "o modelo de aviso tem uma única classe");
assert(modelo.meta.limiares.aviso > 0 && modelo.meta.limiares.aviso < 1, "limiar de aviso entre 0 e 1");
assert.strictEqual(modelo.vocabulario.length, modelo.idf.length);
assert.strictEqual(modelo.vocabulario.length, modelo.coef[0].length);

/* 1 e 2: o modelo só promove 0 -> 1. Nenhuma frase com resultado das regras pode mudar. */
const FRASES = [
  "meu marido me bate", "ele me trancou em casa", "ele tentou me enforcar agora", "tem uma arma aqui em casa", "acho que vou desmaiar to sangrando",
  "meu filho engasgou e esta roxo", "nao aguento mais viver", "onde fica a delegacia da mulher", "o que é o cram", "ele grita comigo todo dia",
  "meu marido exige a senha do meu celular", "preciso de vaga na creche", "tomei um mate gelado agora", "meu time apanhou ontem no campeonato",
  "ele diz que sou burra e nao sirvo pra nada", "meu namorado nao deixa eu trabalhar", "esqueci a senha do aplicativo do banco",
  "meu marido pega meu celular escondido e depois pergunta quem e cada pessoa", "ele me proibe de sair e me ameaca com uma faca",
  "qual posto de saude atende gestante aqui", "meu marido me deu o cartao dele pra eu comprar", "combinamos de dividir a senha do streaming"
];
let promovidas = 0;
FRASES.forEach((t) => {
  const a = nivel(sem, t), b = nivel(com, t);
  if (a > 0) assert.strictEqual(b, a, `"${t}": o classificador não pode mudar um resultado das regras (era nível ${a}, ficou ${b})`);
  else assert(b === 0 || b === 1, `"${t}": só pode promover para nível 1`);
  if (a === 0 && b === 1) promovidas++;
});

/* o resultado promovido tem a forma de um aviso de violência */
const exemplo = FRASES.find((t) => nivel(sem, t) === 0 && nivel(com, t) === 1);
if (exemplo) {
  const x = com.avaliar(exemplo);
  assert.strictEqual(x.nivel, 1);
  assert(x.tipos.includes("violencia"));
  assert(x.telefones.length > 0 && x.mensagens.length === 1 && x.pins.length === 0);
  assert(x.doModelo && typeof x.doModelo.aviso === "number");
}

/* 3: nível 2 nunca é rebaixado */
["ele tentou me enforcar agora", "ele me trancou em casa e disse que me mata", "acho que vou desmaiar to sangrando", "meu namorado me bateu ontem e ameaca me matar"].forEach((t) => {
  assert.strictEqual(nivel(sem, t), 2, `"${t}" deveria ser nível 2 nas regras`);
  assert.strictEqual(nivel(com, t), 2, `"${t}" deveria continuar nível 2 com o classificador`);
});

/* 4: pedidos de serviço e frases do dia a dia sem alerta */
["preciso de vaga em creche pro meu filho", "to procurando emprego de auxiliar administrativo", "vc sabe onde faz cadastro no CadUnico", "tem horario de onibus no domingo?",
 "onde pego segunda via do cartao transporte", "queria informacao sobre beneficio da assistencia social", "esqueci a senha do aplicativo do banco", "to juntando dinheiro pras ferias de janeiro",
 "meu marido e eu dividimos as contas", "combinamos de compartilhar a senha do celular"].forEach((t) => {
  assert.strictEqual(nivel(com, t), 0, `"${t}" não deveria dar alerta com o classificador`);
});

/* o modelo carregado sem a função de classificação não quebra o orientador: modelo ausente = comportamento das regras */
const vazio = carregar(false);
vazio.usarModeloAviso(null);
assert.strictEqual(nivel(vazio, "meu marido me bate"), nivel(sem, "meu marido me bate"));

console.log(`perigo_aviso_n1.test.js ok (${promovidas} de ${FRASES.length} frases promovidas de nenhum alerta para aviso)`);
