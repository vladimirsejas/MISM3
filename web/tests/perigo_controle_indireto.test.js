/* Controle dito de forma INDIRETA (restrição, punição, ameaça condicional, dinheiro, frequência, desqualificação, distorção, terceira pessoa), rebaixamento
   de nível 2 só-do-detector sem indicador grave e veto do detector em frases curtas ou com acordo.
   Cada categoria tem variações positivas (aviso de nível 1) e negativas (nenhum alerta) escritas à mão, com erros de digitação e frases curtas, diferentes das
   frases de desenvolvimento que motivaram o ajuste. Nenhuma frase é de mulher real: servem como conjunto de DESENVOLVIMENTO e os acertos nelas NÃO estimam o
   acerto em frases novas. */
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const Perigo = require(path.join(__dirname, "..", "perigo.js"));
Perigo.usarModelo(JSON.parse(fs.readFileSync(path.join(__dirname, "..", "dados", "modelo_perigo.json"), "utf8")));
const av = (t) => Perigo.avaliar(t);
const n1 = (t) => { const x = av(t); assert(x && x.nivel === 1 && x.tipos.includes("violencia"), `"${t}" deveria dar aviso nível 1 de violencia; deu ${x ? "nível " + x.nivel + " [" + x.tipos + "]" : "nada"}`); };
const n0 = (t) => { const x = av(t); assert(!x, `"${t}" não deveria dar alerta; deu nível ${x && x.nivel} [${x && x.tipos}]`); };
const n2 = (t) => { const x = av(t); assert(x && x.nivel === 2, `"${t}" deveria manter o nível 2; deu ${x ? "nível " + x.nivel : "nada"}`); };

/* (a) incapacidade ou restrição na 1a/3a pessoa */
["nao posso sair com minhas amigas sem ele brigar", "ela nao pode ir na igreja porque o marido nao deixa", "nao consigo nem trocar de celular que meu noivo reclama",
 "minha cunhada nao pode postar nada porque o marido fica bravo", "nao posso atender o telefone sem ele ficar perguntando quem e"].forEach(n1);
["nao posso sair hoje porque estou gripada", "nao consigo ir na festa porque tenho prova", "minha irma nao pode viajar porque esta gravida de oito meses",
 "nao posso postar foto do trabalho por regra da empresa", "nao posso comer doce por causa da diabetes"].forEach(n0);

/* (b) ordem, punição e consequência */
["meu marido fica uma semana sem falar comigo quando discordo dele", "meu namorado faz barraco toda vez que eu saio sem ele", "se eu chego tarde meu marido me castiga com silencio",
 "ele manda eu voltar pra casa toda vez que saio", "meu noivo naum deixa eu visitar ninguem e fica dias sem falar comigo se eu desobedeco"].forEach(n1);
["meu marido nao falou comigo hoje porque estava com dor de cabeca", "a gente discutiu e depois fizemos as pazes", "meu namorado voltou pra casa cedo porque combinamos",
 "se eu chegar tarde aviso ele pelo telefone tranquilo", "fiquei uma semana sem falar com minha prima por causa de uma briga boba"].forEach(n0);

/* (c) ameaça condicional de perder algo */
["meu marido diz que se eu largar ele vou ficar sem nada", "ele avisou que se eu sair de casa nunca mais vejo meu filho", "meu namorado diz que se eu estudar ele me deixa",
 "ele fala que se eu denunciar vou perder a casa", "meu ex diz que se eu casar de novo nunca mais vou ver as criancas"].forEach(n1);
["se eu aceitar o emprego vou ganhar mais", "se eu estudar mais vou passar na prova", "meu marido disse que se chover ele nao vai trabalhar",
 "disse que se eu quiser ele ajuda na mudanca", "se eu separar vou ter que mudar de casa e estou me preparando"].forEach(n0);

/* (d) retenção de dinheiro */
["meu marido pega meu salario inteiro todo mes", "tenho que pedir autorizacao pro meu namorado pra comprar qualquer coisa", "minha vizinha entrega o pagamento todo pro marido",
 "meu noivo controla tudo que eu gasto e quer nota fiscal", "ele nao deixa eu mexer na minha conta"].forEach(n1);
["meu marido e eu dividimos o salario nas contas", "emprestei dinheiro pro meu irmao", "meu marido me deu o cartao dele pra eu comprar", "paguei o aluguel e sobrou pouco",
 "minha vizinha ganhou o salario e comprou uma geladeira"].forEach(n0);

/* (e) frequência ligada a vigilância, ligação ou cobrança */
["meu marido liga de dez em dez minutos pra saber onde estou", "ele manda mensagem toda hora cobrando onde eu estou", "ele vive me rastreando pelo celular",
 "meu marido quer saber cada passo meu toda hora", "meu namorado fica olhando minha localizacao toda noite"].forEach(n1);
["meu marido liga de manha pra desejar bom dia", "a gente se fala o dia todo no whatsapp e eu adoro", "meu namorado me manda mensagem quando chega em casa",
 "compartilhamos a localizacao na viagem", "meu marido me liga no almoco pra conversar"].forEach(n0);

/* (f) desqualificação */
["meu marido diz que sou burra e nao sirvo pra nada", "ele fica rebaixando tudo que eu faco", "meu namorado vive dizendo que ninguem vai me querer",
 "meu ex fala que eu sem ele nao sou nada", "meu marido me ridiculariza na frente da familia"].forEach(n1);
["meu marido me elogiou na frente da familia", "meu chefe disse que preciso melhorar o relatorio", "minha mae diz que sou teimosa as vezes e a gente ri",
 "meu namorado disse que nao sabe cozinhar", "eu me sinto burra quando erro uma conta"].forEach(n0);

/* (g) distorção da realidade */
["meu namorado diz que eu invento tudo e que sou maluca", "ele nega que falou e me faz achar que estou imaginando", "meu marido diz que nunca disse aquilo mesmo eu tendo gravado",
 "minha amiga vive ouvindo do marido que e louca", "ele me faz duvidar da minha memoria"].forEach(n1);
["meu marido disse que esqueceu a conversa e pediu desculpa", "minha memoria esta ruim por causa do estresse do trabalho", "ele lembra diferente de mim e a gente conferiu o recado",
 "meu namorado nao lembra do meu aniversario", "disse que esta ficando louco com a obra da casa"].forEach(n0);

/* (h) terceira pessoa direta */
["minha prima nao pode sair de casa sozinha", "minha colega nao pode falar com ninguem do trabalho", "a vizinha tem que pedir permissao ao marido pra tudo",
 "minha sobrinha esta sendo humilhada pelo namorado", "a filha da minha amiga nao pode usar celular"].forEach(n1);
["minha irma nao pode sair hoje porque esta doente", "a vizinha nao pode estacionar na frente da garagem", "minha prima nao pode comer gluten",
 "minha colega nao pode atender agora porque esta em reuniao", "a filha da minha amiga nao pode ir na festa porque esta de castigo da escola"].forEach(n0);

/* ---- nível 2 só do detector, sem indicador grave: fica em nível 1; com indicador grave, o nível 2 é mantido ---- */
["meu namorado escolhe minha roupa e fala que sem ele eu nao sou ninguem", "meu marido recebe meu pagamento e nao deixa eu trabalhar", "ele fala todo dia que sou inutil e nao deixa eu ver minha mae",
 "meu noivo diz que se eu largar ele vou perder tudo", "meu marido fica com meu cartao e diz que eu nao sei cuidar de dinheiro"].forEach(n1);
["meu marido controla meu celular e disse que vai me matar", "ele me proibe de sair e esconde meu celular pra eu nao ligar pra policia", "meu namorado fica com meu dinheiro e me bateu ontem",
 "ele nao me deixa sair e ja me trancou no quarto", "meu namorado quebrou meu celular e diz que vai me matar se eu contar", "meu ex exige minha senha e disse que me bate se eu negar",
 "ele controla meu dinheiro, meu celular e minhas roupas e nao me deixa trabalhar", "meu marido me forcou a ter relacao e controla minha conta", "ele me ameaca de morte se eu falar com minha familia"].forEach(n2);

/* ---- frases curtas ou com acordo, sem controle, violência nem imposição: o detector sozinho não gera alerta ---- */
["meu marido pediu meu cpf", "ele prefere cafe", "meu noivo ficou chateado", "meu marido quer ficar em casa hoje", "ele pediu o numero do meu telefone",
 "peguei o celular dele emprestado e ele respondeu que tudo bem", "ele escolheu o filme e eu aprovei", "combinamos de dividir a senha do streaming",
 "meu namorado me pediu a senha do netflix e eu passei tranquilo", "meu marido ficou bravo com o time"].forEach(n0);
/* ...mas controle com imposição continua alertando, mesmo curto */
["meu marido exige minha senha toda hora", "meu marido me humilha", "ele quer minha senha e fica bravo se eu nao dou"].forEach(n1);

console.log("perigo_controle_indireto.test.js ok");
