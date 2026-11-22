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


/* ============ PRIORIDADE 2 — falsos alarmes: figurado, esporte, hipérbole banal, dor comum, proteção sem reaparecimento ============ */

/* 2a. Figurado com objeto abstrato ou emoção: matar/morrer de rir, vergonha, cansaço, "de tanto" + esforço; tapa/empurrão/soco abstratos */
["Meu namorado  me matou de rir.", "Meu noivo me matou de  tanto correr na pedalada de hoje.",                                  // desenvolvimento
 "Eu estava muito parada na vida  e meu amigo me deu um tapa de motivação.", "Ontem  eu  vi que meu primo me deu um empurrão na vida."]   // desenvolvimento
  .forEach(nenhum);
["minha amiga me mata de rir com as piadas dela", "morri de vergonha na reuniao de hoje", "estou morrendo de saudade da minha mae", "meu pai me matou de cansaco na caminhada de domingo",
 "preciso de um tapa de realidade pra largar esse emprego", "meu chefe deu um empurrao na minha carreira", "aquela palestra foi um soco na autoestima, mas me fez bem", "o professor me deu um empurraozinho na vida academica"]
  .forEach(nenhum);
/* os positivos continuam: golpe de verdade, com ou sem objeto concreto, e "me mata de fome" não é figurado */
["meu marido me deu um tapa na cara", "ele me deu um soco no rosto ontem", "meu irmao me deu um empurrao na escada", "ele me deu um chute quando eu reclamei", "meu marido ja me deu varios tapas"]
  .forEach((t) => alerta(t, "violencia"));
alerta("ele disse que vai me matar", "violencia");
alerta("meu marido me mata de fome e me bate", "violencia");

/* 2b. Esporte e brincadeira */
["levei um soco no treino de boxe e fiquei com o olho roxo", "ganhei um chute na aula de luta hoje", "meu primo me deu um empurrao na brincadeira e eu cai na piscina", "tomei uma cotovelada no jogo de basquete"]
  .forEach(nenhum);
alerta("meu marido me deu um soco depois do jogo de futebol", "violencia");

/* 2c. Hipérbole sobre falta banal, em contexto hipotético */
["Me escondi do meu irmão que ele iria me matar hora qaue visse que comi o ultimo pedaço de bolo.",                                  // desenvolvimento
 "minha irma ia me matar se visse que usei o esmalte dela", "meu pai iria me esganar se soubesse que comi o chocolate", "ele ia me matar se descobrisse que comi o ultimo pedaco de pizza", "minha prima vai me matar se eu quebrar o carregador dela, brincando"]
  .forEach(semCompleto);
["ele vai me matar se eu contar pra alguem", "meu marido ia me matar se soubesse que falei com a policia", "ele disse que vai me matar se eu comer na mesa", "meu pai vai me matar se eu sair de casa"]
  .forEach((t) => alerta(t, "violencia"));

/* 2d. Dor localizada comum, sem sinal de gravidade, não dispara o detector sozinho; com sinal de gravidade continua alertando */
["Estpou com dor no braço direito.", "Esrou con dor nas costas.", "estou com dor no ombro direito desde de manha", "dor de dente forte desde ontem", "dor na perna depois da caminhada"].forEach(semCompleto);
["estou com dor no peito", "dor no braco esquerdo e tontura", "dor no braco e falta de ar", "dor nas costas e suor frio e falta de ar"].forEach((t) => alerta(t, "saude"));

/* 2e. Proteção em vigor, agressor que não reaparece (relato resolvido): sem alerta; qualquer reaparecimento ou ameaça mantém o alerta */
["Depois que fiz  os B.O.  e consegui  a medida protetiva nunca mais meu ex marido se aproximou de  im tem mais de um ano que não tenho  notícias dele.",   // desenvolvimento
 "depois da medida protetiva ele nunca mais me procurou e ja faz dois anos", "consegui a protecao judicial e desde entao nao tenho noticias dele", "fiz o bo, tenho a medida protetiva e ele nunca mais se aproximou"]
  .forEach(semCompleto);
["tenho medida protetiva e ele apareceu ontem na minha porta", "depois da medida protetiva ele nunca mais veio mas hoje mandou mensagem", "tenho medida protetiva mas ele continua me ameacando", "consegui a protetiva e ele voltou a me procurar"]
  .forEach((t) => alerta(t, "violencia"));
alerta("depois da medida protetiva nunca mais me procurou mas eu quero me matar", "suicidio");


/* ============ PRIORIDADE 3 — alerta que saía menor que o esperado ============ */

/* 3a. Contato com quem a justiça proibiu (descumprimento de proteção), inclusive com erro de digitação */
alerta("Ele     entrou  en  cpmtato com ela mesmo   o juim proibindo.", "violencia");                          // desenvolvimento
alerta("Ele não pode falar com elae  ta mandando mensagem no celular.", "violencia");                           // desenvolvimento
["o juiz proibiu mas ele mandou mensagem pra ela hoje", "ele nao pode se aproximar e apareceu no trabalho dela", "mesmo com a ordem de afastamento ele me ligou",
 "ele entrou em cpmtato com a minha irma mesmo com a decisao da justica proibindo"].forEach((t) => alerta(t, "violencia"));
["o juiz proibiu a venda do terreno", "ele entrou em contato com o rh da empresa", "a escola proibiu celular em sala", "ele nao pode falar alto na biblioteca", "assinei o contrato do aluguel ontem"].forEach(semCompleto);

/* 3b. Criança machucada (sempre, ou com menção ao conselho tutelar) */
alerta("A menina sempre chega machucada na escola alguém ptrevisa chamar o conselho tutelar.", "crianca");     // desenvolvimento
["meu sobrinho sempre volta da casa do pai com roxos", "a crianca vive com marcas pelo corpo e precisa do conselho tutelar", "vou chamar o conselho tutelar porque o menino esta machucado e passando fome",
 "o menino sempre chega machucado na aula e ninguem faz nada"].forEach((t) => alerta(t, "crianca"));
["meu filho sempre chega machucado do futebol", "o conselho tutelar atende na segunda?", "meu sobrinho sempre chega cansado da escola", "quero informacao sobre o conselho tutelar da regiao sul"].forEach(semCompleto);

/* 3c. Agressão por pai, mãe, padrasto, madrasta ou outro familiar, com outros familiares como vítimas */
alerta("Meu  pai  chegou bebado  agrediu minha mãe a mim e meus irmão.", "violencia");                          // desenvolvimento
["meu padrasto agrediu minha mae e meus irmaos", "minha mae bateu em mim e na minha irma", "meu pai espancou minha avo ontem a noite", "meu tio machucou a gente toda vez que bebe"]
  .forEach((t) => alerta(t, "violencia"));
["meu pai bateu o carro na garagem", "minha mae bateu a porta e saiu", "meu irmao empurrou o carrinho no mercado", "meu marido machucou o dedo no portao"].forEach(semCompleto);

/* 3d. Corte profundo + pedido do SAMU e risco de suicídio de terceiro (cobertos na prioridade 1) continuam em nível 2 */
alerta("Fiz um corte profund e não sei o telefone do Samu.");
alerta("Tenho medo que ela se mate.", "suicidio");

console.log("perigo_generalizacao.test.js (prioridade 3) ok");
