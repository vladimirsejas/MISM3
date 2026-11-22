/* Generalização da camada de SEGURANÇA, por categoria (não por frase). Cada categoria tem a(s) frase(s) de desenvolvimento que a motivou
   e, além delas, variações redigidas à parte (positivas e negativas). As 71 frases do autor são conjunto de DESENVOLVIMENTO: os resultados
   nelas não estimam o acerto em frases novas. Nenhuma frase aqui foi escrita por mulher real. */
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const Perigo = require("../perigo.js");
Perigo.usarModelo(JSON.parse(fs.readFileSync(path.join(__dirname, "..", "dados", "modelo_perigo.json"), "utf8")));
const av = (t) => Perigo.avaliar(t);
const alerta = (t, tipo) => { const x = av(t); assert(x && x.nivel === 2 && (!tipo || x.tipos.includes(tipo)), `"${t}" deveria dar alerta completo${tipo ? " de " + tipo : ""}; deu ${x ? "nível " + x.nivel + " [" + x.tipos + "]" : "nada"}`); return x; };
const nivel1 = (t, tipo) => { const x = av(t); assert(x && x.nivel === 1 && (!tipo || x.tipos.includes(tipo)), `"${t}" deveria dar aviso nível 1${tipo ? " de " + tipo : ""}; deu ${x ? "nível " + x.nivel + " [" + x.tipos + "]" : "nada"}`); return x; };
const nenhum = (t) => { const x = av(t); assert(!x, `"${t}" não deveria dar alerta; deu nível ${x && x.nivel} [${x && x.tipos}]`); };
const semCompleto = (t) => { const x = av(t); assert(!x || x.nivel < 2, `"${t}" não deveria dar alerta completo; deu [${x && x.tipos}]`); };

/* ============ PRIORIDADE 1 — emergências que saíam sem alerta ============ */

/* 1a. Tolerância a erro de digitação nos termos-chave (palavra de 6+ letras a 1 edição; curtas só exatas) */
alerta("Bati Meu naria e eest sanfgrando muito.", "saude");                       // desenvolvimento
["ele esta sanrgando muito depois da queda", "minha filha esta sangrnado bastante do braço", "meu vizinho esta sangrndo demais"]
  .forEach((t) => alerta(t, "saude"));
alerta("preciso chamar uma ambulacia, meu pai passou mal", "risco");
["tomei um mate gelado agora", "preciso de um contato do cras", "o juiz marcou audiencia para amanha", "quero estudar numeros romanos", "o samu atende no meu bairro?"].forEach(nenhum);
assert.strictEqual(Perigo.avaliar("meu marido bateu o carro"), null, "correção de digitação não pode criar alerta onde não há");

/* 1b. Déficit de um lado do corpo (dormência, fraqueza, boca torta, fala enrolada) = sinais de AVC/infarto */
alerta("Sentimdomuma dormencia do lado esquerdo.", "saude");                      // desenvolvimento
["sinto formigamento no lado direito do corpo", "minha mae esta com a boca torta e nao consegue falar direito", "perdi a forca do lado esquerdo de repente", "meu pai teve dormencia na metade do rosto"]
  .forEach((t) => alerta(t, "saude"));
["estou com dormencia na perna depois de ficar sentada muito tempo", "meu pe esta formigando", "a boca esta seca de sede", "estou com o pe dormente de tanto ficar sentada"].forEach(semCompleto);

/* 1c. Ferimento grave e pedido do número de emergência */
alerta("Fiz um corte profund e não sei o telefone do Samu.", "saude");           // desenvolvimento
["abri um corte fundo na perna com a faca", "o corte profundo nao para de sangrar", "meu filho tem um ferimento grave na cabeca"].forEach((t) => alerta(t, "saude"));
["o corte de cabelo ficou grande demais", "fui ao salao fazer um corte feio de franja", "o corte de gastos foi profundo na empresa"].forEach(semCompleto);
const emg = alerta("Queria ligar para a emergência mas não sei o número.", "risco");  // desenvolvimento
assert(["190", "192", "193"].every((n) => emg.telefones.includes(n)), "pedido de número de emergência deve devolver 190, 192 e 193");
["preciso ligar para o samu mas esqueci o numero", "qual o telefone dos bombeiros", "nao sei o numero da ambulancia", "queria chamar uma ambulancia pra minha avo"].forEach((t) => alerta(t, "risco"));
["qual o numero do cras", "o samu atende em rio claro?", "meu telefone esta sem bateria", "qual o telefone da prefeitura"].forEach(nenhum);

/* 1d. Privação de liberdade ("trancada em casa") */
alerta("Vivo tramcada em casa.", "violencia");                                    // desenvolvimento
["fico trancada em casa o dia inteiro e ele leva a chave", "minha filha vive trancada em casa pelo marido", "ele me deixa trancada no quarto quando sai", "estamos presas em casa, ele nao deixa a gente sair"]
  .forEach((t) => alerta(t, "violencia"));
["fiquei trancada fora de casa sem a chave", "estou trancada em casa por causa da quarentena", "trancaram a porta do carro", "o gato ficou preso na casa da vizinha"].forEach(semCompleto);

/* 1e. Risco de suicídio da própria pessoa ou de outra (terceira pessoa), tentativa e menção ao CVV */
alerta("Ela precisa procurar o CVV.", "suicidio");                               // desenvolvimento
alerta("Tenho medo que ela se mate.", "suicidio");                               // desenvolvimento
const cvv = alerta("liga pro cvv que ela esta mal", "suicidio");
assert(cvv.telefones.includes("188") && cvv.telefones.includes("192"), "CVV (188) e SAMU (192) em destaque");
["meu irmao disse que quer se matar", "receio que minha filha se suicide", "acho que ela vai tentar se matar", "minha amiga tentou se matar semana passada", "tenho medo que ele se machuque de proposito"]
  .forEach((t) => alerta(t, "suicidio"));
["meu pai quer ver o jogo em casa hoje", "tenho medo que ela se machuque na escada", "qual o cvv do meu cartao", "preciso do codigo cvv do cartao de credito", "o numero cvv fica no verso do cartao"].forEach(nenhum);

console.log("perigo_generalizacao.test.js ok");
