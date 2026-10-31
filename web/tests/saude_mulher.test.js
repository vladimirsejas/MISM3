/* Seção "Saúde da mulher" (área Saúde): mamografia, preventivo do colo do útero e pré-natal, em 31/10/2026.
   Cada afirmação vem de uma página que foi ABERTA e LIDA nesse dia (e não de resumo de busca):
   - Fundação Municipal de Saúde de Rio Claro, "Outubro Rosa reforça importância de exames preventivos" (07/10/2026);
   - Nota Técnica nº 626/2025 do Ministério da Saúde (INCA), lida na íntegra;
   - Ministério da Saúde, página de pré-natal e notícia do teste DNA-HPV (15/08/2025);
   - cadastro do CNES, competência 08/2026 (tabelas rlEstabServClass e tbEstabelecimento).
   O teste trava três coisas: cada número e telefone bate com uma fonte; nada promete vaga nem faz diagnóstico; e o que NÃO sabemos continua dito. */
const assert = require("assert"), fs = require("fs"), path = require("path");
const Areas = require("../areas.js");
const catalogo = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "dados", "catalogo_manual.json"), "utf8"));
const servicos = Array.isArray(catalogo) ? catalogo : catalogo.servicos;

const sau = Areas.porId("saude");
const sec = sau.secoes.find((s) => s.ancora === "saude-mulher");
assert(sec && sau.secoes[0] === sec, "a seção de saúde da mulher existe e é a primeira da área Saúde");
assert(sec.canais.length === 3, "três cartões: mamografia, preventivo e pré-natal");
const [mama, colo, pre] = sec.canais;
assert(/^Mamografia/.test(mama.nome) && /^Preventivo do colo do útero/.test(colo.nome) && /^Pré-natal/.test(pre.nome), "ordem dos cartões");

/* O atalho do topo leva à seção e a seção tem fonte aberta e datada em cada cartão. */
const atalho = sau.guia.itens.find((i) => i.ancora === "saude-mulher");
assert(atalho && /mamografia/i.test(atalho.titulo) && /pré-natal/i.test(atalho.texto), "atalho de saúde da mulher no topo da área");
sec.canais.forEach((c) => {
  assert(c.fonte && /^https:\/\//.test(c.fonte[1]), "fonte com link seguro: " + c.nome);
  /* A frase da data de leitura tem de ser exata: um "31/10/2026" solto em outra parte do texto não vale como prova. */
  assert(/[Pp]ágina aberta e lida em 31\/10\/2026/.test(c.fonte[2]), "a fonte diz que a página foi aberta e lida em 31/10/2026: " + c.nome);
  assert(c.aviso && c.aviso.length > 60, "aviso do que não sabemos: " + c.nome);
});
sec.links.forEach((l) => assert(/^https:\/\//.test(l[1]), "link seguro: " + l[0]));
["ninho.inca.gov.br", "dna-hpv-oferta", "pre-natal", "cnes.datasus.gov.br", "nova-central-para-agendamento"].forEach((h, i) => {
  const alvo = i === 1 ? "detectar-cancer-do-colo-do-utero" : h;
  assert(sec.links.some((l) => l[1].includes(alvo)), "falta o link oficial: " + alvo);
});

const T = (c) => JSON.stringify(c);

/* Mamografia: o que a Fundação informou, o que o Ministério orienta e o que continua em aberto. */
assert(/40 anos/.test(T(mama)) && /7\/10\/2026|07\/10\/2026/.test(T(mama)), "idade de 40 anos e data da publicação da Fundação");
assert(/não tinha fila/.test(T(mama)) && /Isso pode mudar/.test(T(mama)), "fila: dito como informação de uma data, que pode mudar");
assert(/médico ou do enfermeiro/.test(T(mama)), "quem pede o exame, segundo a Fundação");
assert(/50 a 74 anos/.test(T(mama)) && /a cada dois anos/.test(T(mama)) && /40 a 49 anos/.test(T(mama)), "regra do Ministério (Nota Técnica 626/2025)");
assert(/não impede o exame/.test(T(mama)) && /riscos e os benefícios/.test(T(mama)), "40 a 49 e mais de 74: acesso por demanda, com orientação profissional");
assert(/prioridade na marcação/.test(T(mama)) && /Isto não é diagnóstico/.test(T(mama)), "sinais de alerta com prioridade e sem diagnóstico");
assert(/AME/.test(T(mama)) && /Quatro UBS/.test(T(mama)) && /Cadastro não é agenda nem vaga/.test(T(mama)), "onde o exame é feito: próprio x por terceiro, e cadastro não é vaga");

/* Qual unidade procurar (pedido do autor, 31/10/2026): UBS e USF, nunca "unidade de saúde" solta; a equipe da unidade marca o exame; UPA e CAPS não são o caminho e o pedido em UPA não é mencionado. */
const topico = (c, t) => (c.topicos.find((x) => x[0] === t) || [0, ""])[1];
const qual = topico(mama, "Qual unidade procurar");
assert(/UBS \(Unidade Básica de Saúde/.test(qual) && /USF \(Unidade de Saúde da Família\)/.test(qual), "mamografia: diz que são a UBS e a USF, por extenso");
assert(/A UPA e o CAPS atendem outras necessidades/.test(qual), "mamografia: UPA e CAPS não são o caminho");
const quem = topico(mama, "Quem marca o exame");
assert(/os funcionários da própria UBS ou USF marcam o exame para a mulher/.test(quem) && /trabalha na Fundação Municipal de Saúde/.test(quem), "mamografia: a equipe da unidade marca o exame, e a origem é dita");
assert(/UBS ou na USF/.test(topico(mama, "Como marcar a consulta")), "mamografia: consulta marcada na UBS ou na USF");
assert(/funcionários da própria UBS ou USF marcam a coleta/.test(topico(colo, "Como conseguir em Rio Claro")), "preventivo: a equipe da UBS ou da USF marca a coleta");
assert(!/pedid[oa]s? (em|na|numa) UPA/i.test(T(mama) + T(colo)), "não ensina a pedir o exame em UPA");
assert(!/consulta na (sua )?unidade de saúde/.test(T(mama)), "mamografia: não volta a frase vaga 'unidade de saúde'");

/* Preventivo: Papanicolau em Rio Claro; DNA-HPV só como notícia nacional, sem afirmar que já existe aqui. */
assert(/Papanicolau/.test(T(colo)) && /25 a 64 anos/.test(T(colo)), "Papanicolau e a faixa de 25 a 64 anos");
assert(/Este site não encontrou informação de que o DNA-HPV já seja feito em Rio Claro/.test(T(colo)), "DNA-HPV: não afirma que já existe em Rio Claro");
assert(/até cinco anos/.test(T(colo)) && /12 estados/.test(T(colo)), "DNA-HPV: intervalo e início em 12 estados, como na notícia do Ministério");

/* Pré-natal: só o que a página do Ministério diz; o que ela NÃO traz continua dito. */
assert(/12ª semana/.test(T(pre)) && /28ª semana/.test(T(pre)) && /36ª semana/.test(T(pre)), "calendário do pré-natal do Ministério");
const ondeIr = pre.topicos.find((t) => t[0] === "Onde ir")[1];
assert(/No cadastro do CNES \(agosto de 2026\), 17 UBS e USF de Rio Claro registram o acompanhamento do pré-natal como serviço próprio/.test(ondeIr), "o tópico Onde ir traz as 17 UBS e USF do CNES 08/2026");
const ondeExame = mama.topicos.find((t) => t[0] === "Onde o exame é feito")[1];
assert(/AME/.test(ondeExame) && /única unidade pública cadastrada/.test(ondeExame) && /Quatro UBS/.test(ondeExame), "o tópico Onde o exame é feito traz o AME como serviço próprio e as 4 UBS como terceiro");
assert(!/SEPA/.test(T(sec)), "o SEPA não é serviço de pré-natal: não pode ser citado como se fosse");
assert(/não traz o número mínimo de consultas/.test(T(pre)), "não inventa número mínimo de consultas nem exames");

/* Telefones e endereço batem com o catálogo verificado. */
const cadu = servicos.find((s) => s.id === "man-cadu"), pa = servicos.find((s) => s.id === "man-saude-pa-ginecologia");
assert.strictEqual(mama.tel, cadu.telefone, "telefone do Cadu igual ao do catálogo");
assert.strictEqual(colo.tel, cadu.telefone, "telefone do Cadu igual ao do catálogo (preventivo)");
assert(T(pre).includes(pa.telefone) && /24 horas/.test(pa.horario) && /Av\. 15/.test(pa.endereco) && /Av\. 15/.test(T(pre)), "Pronto Atendimento de Ginecologia e Obstetrícia igual ao catálogo");

/* Nada de promessa, diagnóstico, valor, nem o que as fontes não dizem. */
const limpo = T(sec).replace(/não garante|não faz diagnóstico|não é diagnóstico|Isto não é diagnóstico/g, "");
assert(!/garant|com certeza|diagnóstic|você tem câncer|você está com|R\$ ?\d/i.test(limpo), "sem promessa, sem diagnóstico e sem valor");
assert(!/externo à Fundação|só agenda|fila zerada|gratuit/i.test(T(sec)), "sem afirmar o que veio só de conversa ou de notícia antiga");
assert(!/BI-RADS|biópsia|colposcopia|lei 12\.732|30 dias|60 dias/i.test(T(sec)), "sem regra de lei nem classificação técnica que a fonte lida não traz");

console.log("saude_mulher.test.js: 3 cartões com fonte aberta e datada, números e telefones conferidos, DNA-HPV sem afirmar que existe em Rio Claro, sem diagnóstico nem promessa");
