/* Controle coercitivo e violência psicológica = aviso de NÍVEL 1, por COMBINAÇÃO (comportamento de controle + imposição/recorrência + sujeito de relação).
   Palavra isolada nunca alerta; acordo, cuidado carinhoso, briga isolada, passado e ficção suprimem; nível 2 só vem dos indicadores graves já
   existentes e nunca é rebaixado. As 6 frases de desenvolvimento e as variações abaixo são escritas à mão (nenhuma é de mulher real): servem de
   conjunto de DESENVOLVIMENTO, e os acertos nelas não estimam o acerto em frases novas. */
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const Perigo = require("../perigo.js");
Perigo.usarModelo(JSON.parse(fs.readFileSync(path.join(__dirname, "..", "dados", "modelo_perigo.json"), "utf8")));
const av = (t) => Perigo.avaliar(t);
const n1 = (t) => { const x = av(t); assert(x && x.nivel === 1 && x.tipos.includes("violencia"), `"${t}" deveria dar aviso nível 1 de violencia; deu ${x ? "nível " + x.nivel + " [" + x.tipos + "]" : "nada"}`); return x; };
const n0 = (t) => { const x = av(t); assert(!x, `"${t}" não deveria dar alerta; deu nível ${x && x.nivel} [${x && x.tipos}]`); };
const n2 = (t) => { const x = av(t); assert(x && x.nivel === 2, `"${t}" deveria manter o nível 2; deu ${x ? "nível " + x.nivel : "nada"}`); };

/* ---- as 6 frases de desenvolvimento ---- */
["Meu marido escolhe a roupa que tenho que vestir.", "Meu namorado meliga toda hora querendo me controlar", "Meu marido ghrita comigompor qualuer coisa.",
 "Meu noivo não deixa eu falaer com ninguém.", "Meu noito todos os dia quer me ver e nãoi me da espaço.", "Meu marido grita muito com meus filhos."].forEach(n1);

/* ---- 1. celular, senha e mensagens ---- */
["meu marido exige a senha do meu celular", "o namorado fica mexendo no meu zap escondido", "ele revira minhas mensagens toda hora", "meu ex quer saber com quem eu falo o tempo todo", "meu companheiro mexe no meu celuar sem eu saber"].forEach(n1);
["combinamos de compartilhar a senha do celular", "meu marido me emprestou o celular dele", "esqueci a senha do meu celular", "troquei a senha do wifi", "meu marido mexeu no meu celular so pra ver as horas"].forEach(n0);

/* ---- 2. roupa, aparência e redes sociais ---- */
["meu namorado decide que roupa eu posso usar", "ele proibe eu de usar saia", "meu marido manda eu apagar minhas fotos do instagram", "o noivo nao deixa eu postar foto", "meu marido escolhe o que eu posso vestir"].forEach(n1);
["meu marido me ajudou a escolher a roupa do casamento", "comprei uma blusa nova pro meu marido", "meu marido gosta do meu cabelo", "cada um escolhe a propria roupa la em casa", "meu namorado elogiou minha maquiagem"].forEach(n0);

/* ---- 3. isolamento e proibição de sair, falar, ver ---- */
["meu marido nao deixa eu visitar minha mae", "o noivo nao quer que eu fale com as minhas amigas", "ele diz que minhas amigas nao prestam", "meu namorado faz cena toda vez que eu saio com as amigas", "meu marido me proibiu de ver minha familia", "meu namorado naum deixa eu ver minha mae"].forEach(n1);
["meu marido adora minha familia e visitamos todo domingo", "combinamos de sair so com os amigos dele hoje", "minha mae mandou eu voltar cedo hoje", "o seguranca nao deixa eu entrar com mochila", "meu marido ficou feliz de eu encontrar as amigas"].forEach(n0);
/* terceira pessoa */
["a vizinha nao pode sair porque o marido nao deixa", "minha irma e proibida pelo marido de falar com a familia"].forEach((t) => assert(av(t) && av(t).nivel >= 1, t));

/* ---- 4. proibição de trabalhar ou estudar ---- */
["meu marido nao quer que eu trabalhe", "meu namorado me fez largar a faculdade", "ele proibiu eu de estudar", "o noivo manda eu largar o emprego", "meu ex exige que eu largue o curso", "meu marido nao deixa eu trabaia"].forEach(n1);
["meu marido me incentivou a estudar", "meu marido ficou feliz com meu emprego novo", "combinamos que eu volto a trabalhar em marco", "cada um trabalha num turno aqui em casa", "meu marido trabalha a noite"].forEach(n0);

/* ---- 5. dinheiro, salário, cartão ---- */
["meu marido fica com o meu salario todo mes", "meu noivo so me da dinheiro quando eu peco", "meu noivo cobra cada centavo que eu gasto", "meu marido esconde meu cartao", "nao posso mexer na minha conta que meu marido nao deixa", "meu marido pega meu dinhero"].forEach((t) => { if (t.endsWith("dinhero")) { const x = av(t); assert(x && x.nivel >= 1, t); } else n1(t); });
["meu marido e eu dividimos as contas", "meu marido me emprestou dinheiro", "o salario acabou antes do fim do mes", "preciso abrir uma conta no banco", "meu marido paga o aluguel"].forEach(n0);

/* ---- 6. humilhação verbal recorrente ---- */
["meu marido me chama de burra toda hora", "ele diz que sou inutil na frente dos filhos", "meu noivo me chama de gorda todo dia", "meu ex vive me chamando de louca", "ele me humilha na frente das pessoas", "meu marido me umilia todo dia"].forEach(n1);
["meu marido me chamou de linda", "minha sogra disse que sou muito inteligente", "ele me chama de amor", "meu marido disse que sou incrivel", "meu namorado me chamou de preguicosa de brincadeira"].forEach(n0);

/* ---- 7. vigilância constante ---- */
["ele quer saber onde eu estou toda hora", "meu marido liga toda hora pra saber onde estou", "meu namorado instalou rastreador no meu celular", "ele exige que eu compartilhe a localizacao", "meu ex quer saber onde eu estou o tempo todo"].forEach(n1);
["meu marido me avisa quando chega", "meu marido liga todo dia pra conversar", "ele quer saber como foi meu dia", "me liga pra saber se cheguei bem", "meu namorado me avisa quando chegar em casa"].forEach(n0);

/* ---- 8. ameaça de deixar sem casa, dinheiro ou filhos ---- */
["ele diz que vou perder meus filhos se eu me separar", "meu marido diz que vai me deixar sem dinheiro", "meu ex diz que vai cortar a pensao", "ele garante que eu fico sem a casa", "meu marido diz que vai me botar na rua"].forEach(n1);
["meu marido disse que vai levar as criancas pra praia", "o banco disse que vou perder a casa se nao pagar", "ele vai tirar o lixo", "combinamos que ele fica com os filhos no fim de semana", "meu marido disse que vai cortar o cabelo"].forEach(n0);

/* ---- 9. culpa e dúvida sobre a própria sanidade ---- */
["meu marido diz que eu sou louca", "ele me faz duvidar da minha propria cabeca", "meu namorado diz que eu imagino coisas", "meu ex me culpa por tudo", "ele nega o que disse e fala que eu invento"].forEach(n1);
["meu marido diz que eu sou linda", "ele disse que estou cansada e que preciso descansar", "meu namorado se culpa por tudo", "a culpa foi minha, errei no trabalho", "eu me culpo por tudo"].forEach(n0);

/* ---- 10. gritos recorrentes (um "gritou" isolado não conta) ---- */
["meu noivo vive gritando comigo", "o marido da minha irma grita com ela todo dia", "ele berra com as criancas por qualquer coisa", "meu namorado grita comigo demais"].forEach(n1);
["meu marido gritou comigo ontem na briga", "ele grita no estadio quando o time faz gol", "meu filho grita muito no recreio", "ele gritou de susto com a barata", "meu marido grita gol toda domingo"].forEach(n0);

/* ---- palavra isolada nunca alerta ---- */
["marido", "ciume", "celular", "senha", "dinheiro", "roupa", "controle", "louca", "burra", "briga", "sair", "trabalhar", "meu marido", "meu celular", "minha senha"].forEach(n0);

/* ---- consentimento, acordo, passado resolvido e ficção suprimem ---- */
["combinamos que ele fica com meu salario", "decidimos juntos que ele controla as contas", "resolvemos dividir as senhas do celular", "pedi a opiniao dele e ele escolheu a roupa comigo", "cada um fica com o proprio dinheiro la em casa"].forEach(n0);
["meu antigo noivo controlava meu celular mas hoje meu marido respeita", "na novela o marido nao deixa a mulher sair de casa", "li uma noticia que o marido proibiu a esposa de trabalhar"].forEach(n0);

/* ---- nível 2 só com indicador grave (ameaça de morte, agressão, arma, cárcere, impedir pedir socorro); a camada nunca rebaixa ---- */
["meu marido nao deixa eu falar com ninguem e me bateu ontem", "ele grita comigo por tudo e disse que vai me matar", "meu namorado me vigia o tempo todo e me ameaca com uma faca", "meu marido toma meu celular e me tranca em casa",
 "meu marido controla meu dinheiro", "ele vigia meu celular", "meu companheiro controla com quem eu falo", "ele ameaca levar meus filhos se eu for embora", "meu ex me vigia o tempo todo", "meu marido ameaca me deixar sem dinheiro"].forEach(n2);

/* ---- frases curtas e com erro de digitação (a correção de digitação precisa achar o termo e não pode trocar palavra válida) ---- */
const nx = (t) => { const x = av(t); assert(x && x.nivel >= 1, `"${t}" deveria dar ao menos aviso; deu nada`); };
["ele grita comigo todo dia", "namorado mexe no meu celuar toda hora", "marido pega meu salario", "ele me umilia sempre", "noivo naum deixa eu trabalhar", "marido num deixa eu ver minha mae", "meu marido ghrita muito com a gente"].forEach(nx);
["tenho 55 anos e ninguem me contrata", "estou com saudade da minha mae", "preciso calcular o valor da conta", "o apartamento precisa de conserto", "minha propria casa e pequena", "quero escolher a roupa do meu filho"].forEach(n0);

console.log("perigo_controle_coercitivo.test.js ok");
