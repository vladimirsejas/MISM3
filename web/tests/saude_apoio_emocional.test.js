/* Seção "Saúde mental e apoio emocional" (área Saúde), 31/10/2026: Saúde passa a ser a casa principal do apoio emocional e do CVV;
   Trabalho ("Se o desânimo apertar") mantém a sua frase e aponta para cá.
   Fonte aberta e lida em 31/10/2026: página inicial do CVV (cvv.org.br): 188 gratuito e 24 horas por dia, voluntários, apoio emocional e prevenção do suicídio,
   conversa sigilosa e sem julgamentos, chat e e-mail (sem horários), guia sobre como ajudar alguém em risco.
   O site do CVV NÃO diz se é terapia nem se atende emergência médica: por isso o texto não afirma nenhuma das duas coisas. */
const assert = require("assert"), fs = require("fs"), path = require("path");
const Areas = require("../areas.js");
const J = require("../jornada.js");
const catalogo = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "dados", "catalogo_manual.json"), "utf8"));
const servicos = Array.isArray(catalogo) ? catalogo : catalogo.servicos;

const sau = Areas.porId("saude");
const sec = sau.secoes.find((s) => s.ancora === "saude-apoio-emocional");
assert(sec, "a seção de apoio emocional existe na área Saúde");
assert.deepStrictEqual(sau.secoes.map((s) => s.ancora), ["saude-mulher", "saude-apoio-emocional", "saude-familia-drogas", "saude-unidades"], "ordem das seções de Saúde");
assert(sec.canais.length === 2, "dois cartões: CVV e saúde mental na rede pública");
const [cvv, rede] = sec.canais;
const T = (c) => JSON.stringify(c);

/* O atalho de saúde mental leva à seção e continua dizendo 188, CVV e CAPS. */
const atalho = sau.guia.itens.find((i) => /saúde mental/.test(i.titulo));
assert(atalho && atalho.ancora === "saude-apoio-emocional" && /188/.test(atalho.texto) && /CVV/.test(atalho.texto) && /CAPS/.test(atalho.texto), "atalho de saúde mental leva à seção nova");

/* CVV: o que o site oficial diz, nem mais nem menos. */
const e188 = Areas.EMERGENCIA.find((e) => e.tel === "188");
assert(e188 && cvv.tel === e188.tel, "o telefone do cartão é o 188 da fonte única de emergência");
assert(/^https:\/\/cvv\.org\.br\/$/.test(cvv.fonte[1]) && /Página aberta e lida em 31\/10\/2026/.test(cvv.fonte[2]), "fonte oficial aberta e lida em 31/10/2026");
assert(sec.links.some((l) => l[1] === "https://cvv.org.br/"), "link do site oficial");
assert(/voluntários/.test(T(cvv)) && /sigilosa, sem julgamentos, críticas ou comparações/.test(T(cvv)), "voluntários e conversa sigilosa e sem julgamentos, como no site");
assert(/188, de graça, 24 horas por dia/.test(T(cvv)) && /não informa os horários dessas conversas/.test(T(cvv)), "188 gratuito 24 horas; chat e e-mail sem inventar horário");
assert(/ligue agora para o 188/i.test(T(cvv)) && /192 \(SAMU\)/.test(T(cvv)) && /Você não está sozinha/.test(T(cvv)), "pensamento de se machucar: 188 e 192, como no alerta de segurança");
assert(/guia sobre como ajudar alguém que pode estar em risco/.test(T(cvv)), "guia para ajudar outra pessoa");
assert(/não sabe se há espera/.test(cvv.aviso) && /não substitui a consulta com a equipe de saúde/.test(cvv.aviso), "aviso do que este site não sabe");

/* Rede pública: aponta para a lista que já existe e confere a data dos CAPS no catálogo. */
const caps = servicos.filter((s) => s.tipo === "saude" && s.subtipo === "caps");
assert(caps.length >= 3 && caps.every((s) => s.verificado_em === "2026-10-10"), "os CAPS do catálogo foram verificados em 10/10/2026, como diz o texto");
assert(/Saúde mental \(CAPS\)/.test(T(rede)) && /conferidos em 10\/10\/2026/.test(T(rede)), "aponta para o grupo Saúde mental (CAPS)");
assert(/não confirma quais serviços recebem quem chega sem encaminhamento/.test(T(rede)), "não afirma que o CAPS aceita sem encaminhamento");
assert(/^https:\/\//.test(rede.fonte[1]) && /10\/10\/2026/.test(rede.fonte[2]), "fonte e data da lista de unidades");

/* O que NÃO pode aparecer: promessa, diagnóstico, terapia, conclusão que a fonte não traz. */
const limpo = T(sec).replace(/não faz diagnóstico|não substitui|atendimento garantido/g, "");
assert(!/garant|com certeza|diagnóstic|terapia|psicólog|psiquiatra|tratamento gratuito|emergência médica|você está com|depress/i.test(limpo), "sem promessa, diagnóstico, terapia ou nome de doença");
assert(!/R\$ ?\d|\b(24|48) ?h\b.*chat/i.test(T(sec)), "sem valor nem horário inventado");

/* Trabalho: a frase que já existia continua e agora aponta para Saúde. */
global.self = { Jornada: J };
require("../jornada-ui.js");
const UI = global.self.JornadaUI;
UI.usarCatalogo(null);
const tela = UI.html(true);
assert(/id="trabalho-apoio"/.test(tela) && /Ficar sem trabalho não define seu valor/.test(tela) && /atende pelo 188, gratuitamente, 24 horas por dia/.test(tela), "a frase de Trabalho continua inteira");
assert(/<a href="https:\/\/cvv\.org\.br\/"/.test(tela), "o link do CVV em Trabalho continua");
assert(/href="#saude\/saude-apoio-emocional">área Saúde<\/a>/.test(tela), "Trabalho aponta para a seção de apoio emocional em Saúde");

/* O orientador leva quem escreve sobre tristeza e solidão para a seção nova (antes ia para a seção de álcool e drogas).
   Frases escritas por mim em 31/10/2026, fora dos conjuntos de avaliação (esses não se usam para ajustar nada). */
const IA = require("../ia.js"), Regras = require("../necessidades.js"), Orientar = require("../orientar.js"), UIO = require("../orientacao-ui.js");
const web = path.join(__dirname, "..");
IA.usarModelo(JSON.parse(fs.readFileSync(path.join(web, "dados", "modelo_necessidades.json"), "utf8")));
const indice = JSON.parse(fs.readFileSync(path.join(web, "dados", "indice_orientacao.json"), "utf8"));
const escopo = IA.criarClassificador(JSON.parse(fs.readFileSync(path.join(web, "dados", "modelo_escopo.json"), "utf8")));
const motor = Orientar.criar(indice, { dica: UIO.criarDica(IA, Regras), escopo: (t) => escopo.probabilidades(t).no_escopo, limiarEscopo: escopo.limiares.no_escopo });
["estou muito triste e sozinha", "preciso conversar com alguem"].forEach((frase) => {
  const r = motor.responder(frase);
  assert(r.itens.length && r.itens[0].area === "saude" && r.itens[0].sec === "saude-apoio-emocional", "o orientador leva '" + frase + "' para o apoio emocional");
});
/* E não tira o que já funcionava: álcool e drogas continua indo para a sua seção, e violência continua indo para Direitos. */
assert(motor.responder("meu filho usa drogas").itens[0].sec === "saude-familia-drogas", "'meu filho usa drogas' continua indo para a seção de álcool e drogas");
assert(motor.responder("meu marido me bate").itens[0].area === "direitos", "violência continua indo para Direitos");

console.log("saude_apoio_emocional.test.js: seção nova como casa do apoio emocional, só com o que o site do CVV diz, CAPS conferidos no catálogo, sem promessa nem diagnóstico, e Trabalho apontando para Saúde");
