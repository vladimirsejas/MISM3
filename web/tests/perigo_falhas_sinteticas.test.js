/* Regressão das três falhas de SEGURANÇA achadas numa verificação com 90 frases sintéticas (escritas por uma pessoa, não por mulheres reais):
   dor no peito descrita sem a palavra "dor" (s01), agressão por filho adulto com exploração da aposentadoria (f05) e retorno do agressor
   com proteção judicial já concedida (v03). Cada falha tem o texto exato e variações de redação, para provar que a correção é de lógica
   (sintoma + contexto) e não uma lista de frases. Também confere que frases parecidas, mas sem perigo, não geram alerta completo. */
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const Perigo = require("../perigo.js");
Perigo.usarModelo(JSON.parse(fs.readFileSync(path.join(__dirname, "..", "dados", "modelo_perigo.json"), "utf8")));
const r = (t) => Perigo.avaliar(t);
const alerta = (t, tipo) => { const x = r(t); assert(x && x.nivel === 2 && x.tipos.includes(tipo), `"${t}" deveria dar alerta completo de ${tipo}; deu ${x ? "nível " + x.nivel + " [" + x.tipos + "]" : "nada"}`); return x; };
const semAlertaCompleto = (t) => { const x = r(t); assert(!x || x.nivel < 2, `"${t}" não deveria dar alerta completo (deu [${x && x.tipos}])`); };

/* s01: sintoma cardíaco sem a palavra "dor" -> emergência médica (192, UPA) */
const s01 = alerta("meu peito aperta forte e o braco esquerdo formiga, estou muito assustada", "saude");
assert(s01.telefones.includes("192") && s01.pins.some((p) => /upa/.test(p.id || "")), "s01 deve fixar 192 e a UPA");
["sinto um aperto forte no peito e suor frio", "estou com pressao no peito e o braço esquerdo dormente", "meu peito esta pesado e dói o braço esquerdo",
 "dor no braco esquerdo e falta de ar", "o peito queima e a dor vai pra mandibula", "formigamento no braço esquerdo, peito apertado e tontura"
].forEach((t) => alerta(t, "saude"));

/* f05: agressão física por familiar (filho adulto, neto, irmão...), inclusive com "me dá tapa", e exploração financeira junto */
const f05 = alerta("meu filho ja adulto pega minha aposentadoria e me da tapa quando reclamo", "violencia");
assert(f05.telefones.includes("190") && f05.telefones.includes("180"));
["meu filho me deu um soco porque neguei dinheiro", "meu neto me empurra e leva meu cartao da aposentadoria", "minha filha me bate e fica com a minha pensao",
 "meu irmao me da murro quando eu nao entrego o dinheiro", "meu genro me bateu e me ameaca", "meu filho levanta a mao pra mim e me chama de velha inutil e pega meu beneficio"
].forEach((t) => alerta(t, "violencia"));

/* v03: proteção judicial concedida + agressor reaparece/descumpre -> alerta completo, com Patrulha Maria da Penha e DDM fixadas */
const v03 = alerta("a justica me deu protecao contra o ex mas ele veio de novo e esta batendo no portao", "violencia");
assert(v03.telefones.includes("190") && v03.pins.some((p) => p.svc === "mulher/patrulha") && v03.pins.some((p) => p.svc === "mulher/ddm"), "v03 deve fixar a Patrulha e a DDM");
["o juiz concedeu a ordem de afastamento mas meu ex apareceu aqui em casa", "tenho protecao judicial contra ele e ele descumpriu, esta rondando minha rua",
 "ele nao respeita a medida que o juiz deu e voltou pra minha porta", "consegui a medida protetiva e mesmo assim ele me procurou hoje de novo",
 "meu ex ignorou a decisao da justica e esta tentando entrar na minha casa"
].forEach((t) => alerta(t, "violencia"));

/* ---- sem alarme falso: mesmas palavras em outro contexto ---- */
["meu filho me bateu no jogo de videogame", "meu neto me venceu no truco e me deu um abraco", "meu peito esta cheio de saudade da minha mae", "meu filho me da muito orgulho", "meu filho pega minha aposentadoria emprestada e sempre devolve",
 "o juiz deu a sentenca do divorcio e o prazo termina semana que vem", "minha vizinha bateu no portao pra pedir acucar", "meu ex veio buscar o filho no horario combinado",
 "queria saber como funciona a protecao judicial contra violencia", "a justica me deu a guarda do meu filho", "meu braco esquerdo esta com uma coceira",
 "me da um conselho sobre o peito de frango no almoco", "meu cunhado me deu um tapa nas costas de brincadeira no churrasco"
].forEach(semAlertaCompleto);
console.log("perigo_falhas_sinteticas.test.js ok");
