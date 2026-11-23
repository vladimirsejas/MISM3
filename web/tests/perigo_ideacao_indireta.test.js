/* Ideação indireta e "acabar" de tarefa. Frases de DESENVOLVIMENTO (escritas por IA): os acertos aqui não estimam o acerto em frases novas.
   Garante: (1) frases de ideação indireta acionam o alerta completo só pelas regras; (2) frases do dia a dia com as mesmas palavras não acionam. */
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const ler = (n) => JSON.parse(fs.readFileSync(path.join(__dirname, "..", "dados", n), "utf8"));
const sem = require("../perigo.js"); /* sem modelo: só as regras */
const nivelRegras = (t) => { const r = sem.avaliar(t); return r ? r.nivel : 0; };

[
  "cansei de lutar, quero descansar pra sempre",
  "estou sem esperança nenhuma e penso em dar um fim nisso",
  "às vezes eu queria parar de existir",
  "penso em dar um fim na minha vida",
  "eu não deveria estar aqui"
].forEach((t) => assert.strictEqual(nivelRegras(t), 2, `"${t}" deveria dar alerta completo pelas regras`));

[
  "vou dormir para sempre cedo hoje não",
  "preciso dar um fim nesse problema da conta de luz",
  "quero dar um fim nisso, a fila do posto não anda",
  "minha mãe vai descansar pra sempre no cemitério municipal, como funciona o sepultamento",
  "preciso parar de existir na lista de espera"
].forEach((t) => assert.strictEqual(nivelRegras(t), 0, `"${t}" não deveria acionar alerta`));

/* "acabar" de tarefa não é ideação para o detector aprendido; palavra de morte desliga a trava */
const com = require("../perigo.js");
com.usarModelo(ler("modelo_perigo.json"));
const r = com.avaliar("não vejo a hora de acabar o expediente");
assert(!r || r.nivel < 2, "acabar o expediente não pode dar alerta completo de suicídio");
assert.strictEqual(com.avaliar("quero acabar com a minha vida depois do expediente").nivel, 2, "palavra de morte mantém o alerta");
console.log("perigo_ideacao_indireta: ok");
