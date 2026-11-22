/* Tolerância a erro de digitação nas regras de nível 2 (ameaça física e cárcere): erro de letra, letra a mais ou a menos, palavras coladas ("eleme",
   "mebateu", "metrancaram") e plural ("me trancaram"). A correção só pode AUMENTAR a detecção: todas estas frases dão alerta completo (N2) e
   as negativas continuam sem alerta. As frases são escritas à mão (não são de mulheres reais). */
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const Perigo = require(path.join(__dirname, "..", "perigo.js"));
Perigo.usarModelo(JSON.parse(fs.readFileSync(path.join(__dirname, "..", "dados", "modelo_perigo.json"), "utf8")));
const av = (t) => Perigo.avaliar(t);
const n2 = (t) => { const x = av(t); assert(x && x.nivel === 2, `"${t}" deveria ser N2; deu ${x ? "N" + x.nivel : "nada"}`); };
const n0 = (t) => { const x = av(t); assert(!x, `"${t}" não deveria alertar; deu N${x && x.nivel}`); };

/* as quatro de partida e variantes */
["ele me trancou em casa", "ele metrancolu em casa", "estou trancada e ele disse que me mata", "ele me prendeu e não me deixa sair"].forEach(n2);
/* cárcere: letra trocada, faltando, sobrando, colado, plural */
["ele me trankou em casa", "ele me trancau em casa", "ele me tracou em casa", "ele me trrancou em casa", "elemetrancou em casa", "ele metrancou em casa", "me trancaram em casa",
 "me trancarum em casa", "me trnacaram em casa", "me tancaram em casa", "metrancaram em casa", "eleme prendeu em casa", "ele me prendiu em casa", "vivo tramcada em casa",
 "ele nao me dexa sair de casa", "ele me trancou e levou a chave"].forEach(n2);
/* ameaça física e agressão: erro de digitação e coladas */
["ele disse que memata", "ele disse q me mata se eu sair", "ele falou que vai me mattar", "ele vai memtar", "estou trankada e ele disse que me mata", "eleme espancou", "ele mebateu muito ontem",
 "ele tentoume enforcar", "eletentou me estrangular", "eletentou me enforcar", "maridome bate todo dia", "eleme deu uma surra", "eleme obrigou a ter relacao", "ele me espancau"].forEach(n2);
/* arma apontada, inclusive com a palavra mal digitada */
["ele apontou uma arma pra mim", "ele apontpou uma arma pra mim", "ele apotnou uma arma pra mim", "ele apontou uma arna pra mim", "ele apontou uma ajrma pra mim"].forEach(n2);

/* sem falso alarme: palavras parecidas ou colagens que não são perigo */
["ele apontou o dedo pra mim no jogo", "minha prima me prendeu o cabelo com uma presilha", "metade do mes eu fico em casa", "temos uma casa em frente ao mar", "elemento quimico da prova",
 "preciso de vaga em creche pro meu filho", "meu marido bateu o carro"].forEach(n0);

console.log("perigo_digitacao_n2.test.js ok");
