/* Item P5 do plano (docs/proposta_conteudo_mulheres_prioritarias.md): "Avó que cria ou sustenta os netos".
   Seção em Assistência Social (logo depois de "Seu CRAS") e cartão "Crio meu neto" em Educação.
   Só o que as fontes do projeto dizem; o que veio de resumo de notícia vai marcado "não conferido". */
const assert = require("assert");
const Areas = require("../areas.js");

const ass = Areas.porId("assistencia");
const titulos = ass.secoes.map((s) => s.titulo);
const iAvo = titulos.findIndex((t) => /^Sou avó ou pessoa idosa/.test(t));
assert(iAvo === 2 && /Seu CRAS/.test(titulos[1]) && /Cadastro Único/.test(titulos[0]), "ordem: CadÚnico, Seu CRAS e a seção da avó (a do CadÚnico segue sendo a primeira)");
const sec = ass.secoes[iAvo];
assert(sec.ancora === "assistencia-avo" && sec.canais.length === 4 && sec.canais.every((c) => c.sem_tel === true && c.aviso && c.fonte), "quatro cartões, cada um com aviso e fonte");

const por = (re) => sec.canais.find((c) => re.test(c.nome));
const escola = por(/^Netos que moram comigo/), renda = por(/^Aposentadoria, BPC/), cuidar = por(/^Convivência, curso e apoio/), cartao = por(/^Alguém usa meu cartão/);
assert(escola && renda && cuidar && cartao, "os quatro itens do P5 estão como cartões");
const txt = (c) => JSON.stringify(c), tp = (c, n) => c.topicos.find((t) => t[0] === n)[1];

/* P5.1: guarda, escola e saúde são assuntos diferentes; não afirmar que ordem judicial é sempre necessária */
assert(/assuntos diferentes/.test(escola.texto) && /antes de assumir que é preciso um documento da Justiça/.test(escola.texto), "guarda, escola e saúde separados, sem dizer que a ordem judicial é sempre necessária");
["Escola", "Atendimento de saúde do neto", "Quem responde legalmente pela criança", "Pensão e casa própria"].forEach((n) => assert(escola.topicos.some((t) => t[0] === n), "falta o tópico: " + n));
assert(/Defensoria Pública/.test(tp(escola, "Quem responde legalmente pela criança")) && /dizem o que aceitam/.test(tp(escola, "Escola")), "escola: a Secretaria e a escola dizem o que aceitam; guarda: Defensoria");
assert(/Quem confirma é o próprio lugar/.test(escola.aviso), "aviso: quem confirma é o próprio lugar");

/* P5.2: aposentadoria, BPC e benefícios são coisas diferentes, sem sugerir que algo garante ou impede benefício */
assert(/Aposentadoria e BPC são coisas diferentes/.test(renda.texto) && /Este site não decide quem recebe/.test(renda.texto), "aposentadoria e BPC separados; o site não decide");
assert(/65 anos ou mais/.test(tp(renda, "BPC, para quem tem 65 anos ou mais")) && /135/.test(tp(renda, "BPC, para quem tem 65 anos ou mais")) && /sem intermediário/.test(tp(renda, "BPC, para quem tem 65 anos ou mais")), "BPC: 65 anos ou mais, INSS 135 ou Meu INSS, sem intermediário");
assert(/projeção/.test(tp(renda, "Aposentadoria")) && /não garante o benefício/.test(tp(renda, "Aposentadoria")), "a simulação de aposentadoria é só projeção");
assert(/65 anos ou mais que receba o BPC/.test(tp(renda, "Conta de água mais barata")), "tarifa social de água: pessoa idosa de 65 anos ou mais com BPC (informativo do DAAE)");
assert(/Se ter netos em casa ou receber aposentadoria muda o direito/.test(tp(renda, "O que este site não diz")) && /quem decide é o programa/.test(tp(renda, "O que este site não diz")), "não sugere que ter neto ou aposentadoria garante ou impede benefício");

/* P5.3: quem cuida também precisa de cuidado; o que veio de resumo de notícia vai marcado */
const conv = tp(cuidar, "Convivência para pessoas idosas (65 anos ou mais)");
assert(/Cinco CRAS/.test(conv) && /Abrigo São Vicente de Paulo/.test(conv) && /UDAM/.test(conv) && /Convivência e apoio/.test(conv) && /horário não consta/.test(conv), "convivência: cinco CRAS e duas unidades do cadastro, sem horário");
const curso = cuidar.topicos.find((t) => /^Curso de cuidador de idosos/.test(t[0])), centro = cuidar.topicos.find((t) => /^Centro Dia do Idoso/.test(t[0]));
assert(curso && /não conferido/.test(curso[0]) && /80 horas/.test(curso[1]) && /não sabemos se há nova turma/.test(curso[1]), "curso de cuidador: marcado não conferido, sem afirmar turma aberta");
assert(centro && /não conferido/.test(centro[0]) && /60 vagas/.test(centro[1]) && /sem abertura confirmada/.test(centro[1]), "Centro Dia: marcado não conferido; segunda unidade sem abertura confirmada");
assert(/188/.test(tp(cuidar, "Se você está esgotada")) && /CVV/.test(tp(cuidar, "Se você está esgotada")), "apoio emocional: CVV 188");
assert(/resumos de notícia, sem a página aberta/.test(cuidar.aviso), "aviso: curso e Centro Dia vêm de resumos, sem a página aberta");

/* P5.4: proteção da avó, em linguagem simples, só com o que a página oficial do Disque 100 diz */
const d100 = tp(cartao, "Disque 100");
["violações de direitos de pessoas idosas", "24 horas por dia", "gratuita", "Qualquer pessoa pode relatar", "não lista tipos de violação"].forEach((t) => assert(d100.includes(t), "Disque 100, falta: " + t));
assert(/190/.test(tp(cartao, "Perigo agora")) && /Defensoria Pública/.test(tp(cartao, "Orientação jurídica")), "perigo agora: 190; orientação: Defensoria");
assert(/não diz se o que aconteceu com você é uma violação/.test(cartao.aviso), "o site não diz se é violação nem o que será decidido");
assert(/gov\.br\/pt-br\/servicos\/denunciar-violacao-de-direitos-humanos/.test(cartao.fonte[1]) && /15\/12\/2025/.test(cartao.fonte[2]), "fonte: página oficial do gov.br, com a data da última modificação");

/* Nada de promessa, de valor em reais nem de 0800 sem fonte; sem as frases que nenhuma fonte sustenta */
const tudo = JSON.stringify(sec);
assert(!/você (tem|terá) direito|vai receber|com certeza|invariavelmente|raramente aceit|alijad/i.test(tudo.replace(/não garante/g, "")), "sem promessa");
assert(!/R\$ ?\d|0800/.test(tudo), "sem valor em reais e sem 0800 na seção da avó");
assert(!/crime|violência patrimonial|financeira/i.test(txt(cartao)), "o cartão não classifica o fato (a página do Disque 100 não lista tipos)");

/* Educação: cartão "Crio meu neto", logo depois do das mães que criam sozinhas */
const edu = Areas.porId("educacao").secoes[0].canais.map((c) => c.nome);
const iNeto = edu.findIndex((n) => /^Crio meu neto/.test(n));
assert(iNeto === edu.findIndex((n) => /^Crio meu filho sozinha/.test(n)) + 1, "o cartão do neto vem logo depois do de quem cria o filho sozinha");
const neto = Areas.porId("educacao").secoes[0].canais[iNeto];
assert(/Secretaria Municipal da Educação e pela escola/.test(neto.texto) && /A pesquisa indica que pode ser pedido o termo de guarda/.test(tp(neto, "Pergunte o que vale")) && /confirme com eles/.test(tp(neto, "Pergunte o que vale")), "neto: a Secretaria e a escola dizem o que vale; a guarda é só 'pesquisa indica'");
assert(/Defensoria/.test(tp(neto, "Se pedirem a guarda no papel")) && /Sou avó ou pessoa idosa/.test(tp(neto, "Outras ajudas para quem cria netos")), "neto: Defensoria e ligação com a seção da avó");
assert(/não foi conferida em fonte oficial/.test(neto.aviso), "neto: o aviso diz que não foi conferido em fonte oficial");

/* Os cartões de Moradia, Direitos e Assistência que a avó encontra continuam onde estavam */
assert(Areas.porId("moradia").secoes.find((s) => s.titulo === "Habitação").canais.some((c) => /^Sou avó e crio meus netos/.test(c.nome)), "a avó também aparece em Moradia");
assert(Areas.porId("direitos").secoes[0].canais.some((c) => /^Pensão alimentícia/.test(c.nome)) && Areas.porId("direitos").secoes[0].canais.some((c) => /^Defensoria/.test(c.nome)), "pensão e Defensoria seguem em Direitos");

console.log("avo.test.js: P5 em Assistência (guarda/escola/saúde, renda, cuidado, proteção) e cartão do neto em Educação, com o que é não conferido marcado e sem promessa");
