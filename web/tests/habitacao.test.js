/* Cartão "Casa própria (Minha Casa, Minha Vida)" (área Moradia, seção Habitação).
   Só o que está nos textos arquivados em docs/documetacao/: Portaria MCID 738/2024 (PDF da Prefeitura), Portaria MCID 333/2026 (DOU),
   página e folheto da CAIXA. A Lei 11.977/2009 (texto compilado) foi colada pelo mantenedor e não tem PDF. */
const assert = require("assert"), fs = require("fs"), path = require("path");
const Areas = require("../areas.js");
const area = Areas.porId("moradia"), sec = area.secoes.find((s) => s.titulo === "Habitação");
const card = sec.canais.find((c) => /^Casa própria/.test(c.nome));
assert(card && card.sem_tel === true && card.topicos.length >= 10, "o cartão da casa própria existe, sem telefone próprio");
const tit = card.topicos.map((t) => t[0]);
assert(tit.indexOf("Quem passa na frente") < tit.indexOf("Se a renda passa do teto da Faixa 1"), "a fila da Prefeitura vem antes do financiamento da CAIXA");
const tudo = JSON.stringify(card);

/* Números oficiais da Portaria 333/2026 */
["R$ 3.200,00", "R$ 3.200,01", "R$ 5.000,00", "R$ 5.000,01", "R$ 9.600,00", "R$ 13.000,00", "01/04/2026"].forEach((t) => assert(tudo.includes(t), "falta: " + t));

/* Critérios da Portaria 738/2024, art. 13, e o desempate */
["mulher responsável pela unidade familiar, declarada no CadÚnico", "pessoa negra", "pessoa com deficiência", "pessoa idosa", "criança ou adolescente",
 "câncer ou doença rara", "violência doméstica", "indígenas e quilombolas", "área de risco", "maior número destes critérios", "maior idade do titular"].forEach((t) => assert(tudo.includes(t), "falta: " + t));

/* Déficit habitacional, art. 11 */
["coabitação", "mais de 3 pessoas por dormitório", "30% da renda", "aluguel social provisório", "situação de rua"].forEach((t) => assert(tudo.includes(t), "falta: " + t));

/* A avó: cartão próprio, no topo da seção, com o que as fontes dizem e o que elas NÃO dizem */
const avoCard = sec.canais.find((c) => /^Sou avó e crio meus netos/.test(c.nome));
assert(avoCard && avoCard.sem_tel === true && sec.canais.indexOf(avoCard) === 0 && sec.canais.indexOf(avoCard) < sec.canais.indexOf(card), "o cartão da avó é o primeiro da seção Habitação");
assert(/avós que criam os netos/.test(area.intro), "a introdução da área Moradia avisa que há um caminho para a avó");
const avoTudo = JSON.stringify(avoCard), at = (n) => avoCard.topicos.find((t) => t[0] === n)[1];
["certidão de nascimento, de guarda ou de tutela", "mostra quem são os pais dele, e não mostra você", "A Portaria não diz o que a Prefeitura aceita"].forEach((t) => assert(at("O que o texto oficial pede").includes(t), "falta: " + t));
assert(/Quem decide o que vale é a Secretaria, e não este sistema/.test(at("Primeiro passo: pergunte à Secretaria")), "quem decide é a Secretaria");
const guarda = at("Se falta o documento do neto");
["Defensoria Pública", "atende quem não tem condições de pagar", "área Direitos", "Regularizar essa situação não garante vaga nem prioridade"].forEach((t) => assert(guarda.includes(t), "falta: " + t));
["responsável pela unidade familiar, declarada no CadÚnico", "Assistência Social", "CRAS"].forEach((t) => assert(at("Fique como responsável no CadÚnico").includes(t), "falta: " + t));
const mais = at("O que mais pode contar a seu favor");
assert(/maior idade de quem assina o contrato/.test(mais) && /a guarda não entra no desempate/.test(mais) && /coabitação/.test(mais) && /não informa a idade/.test(mais), "desempate pela idade, guarda fora do desempate, coabitação e idade não informada");
assert(/Pensão alimentícia/.test(at("Se os pais não ajudam")), "liga ao cartão da pensão");
assert(/não garante vaga, pontuação nem prioridade/.test(avoCard.aviso) && /Quem confirma é a Secretaria/.test(avoCard.aviso) && /sem o documento, buscar antes a orientação da Defensoria/.test(avoCard.aviso), "aviso: orientação, não decisão; sem o documento, a Defensoria vem antes");
assert(!/invariavelmente|sempre (desclassific|negad|indefer)|raramente aceit|alijad|você (tem|terá) direito|garantid|com certeza|vai conseguir/i.test(avoTudo), "sem as afirmações do texto colado que nenhuma fonte oficial sustenta");
assert(/^https:\/\/rioclaro\.sp\.gov\.br\//.test(avoCard.fonte[1]) && /16\/10\/2026/.test(avoCard.fonte[2]) && /deste projeto/.test(avoCard.fonte[2]), "fonte oficial, data da leitura e a recomendação marcada como do projeto");
assert(/Veja o cartão “Sou avó e crio meus netos/.test(card.topicos.find((t) => t[0] === "Se você cria os netos")[1]), "o cartão geral remete ao cartão da avó, sem repetir o texto");

/* Mulher: contrato no nome dela, exceção do FGTS e a regra da guarda */
const mulher = card.topicos.find((t) => t[0] === "Contrato no nome da mulher")[1];
["de preferência, no nome da mulher", "sem a assinatura do cônjuge", "FGTS", "guarda dos filhos for só do pai"].forEach((t) => assert(mulher.includes(t), "falta: " + t));

/* Indicação direta: o limite de 20% / 30% e o teto da Faixa 2 */
const direta = card.topicos.find((t) => t[0] === "Indicação direta pela Prefeitura")[1];
["20% das unidades", "30%", "Faixa Urbano 2", "01/01/2023"].forEach((t) => assert(direta.includes(t), "falta: " + t));

/* CAIXA: financiamento, não a fila; com a data do folheto */
const caixa = card.topicos.find((t) => t[0] === "Se a renda passa do teto da Faixa 1")[1];
["R$ 13 mil", "R$ 600 mil", "20%", "10% ao ano", "35 anos", "FGTS", "4004 0 104", "0800 104 0 104", "consulte a CAIXA"].forEach((t) => assert(caixa.includes(t), "falta: " + t));
const docs = card.topicos.find((t) => t[0] === "Documentos para pedir financiamento na CAIXA")[1];
["maio de 2017", "quase 10 anos", "inteiro teor da matrícula", "não para a fila da Prefeitura"].forEach((t) => assert(docs.includes(t), "falta: " + t));
assert(!/721 ?6268/.test(tudo), "o 0800 do folheto de 2017 não entra: a página da CAIXA de 2026 não o lista");
assert((tudo.match(/0800 ?\d/g) || []).length === 1 && tudo.includes("0800 104 0 104"), "o único 0800 do cartão é o Alô CAIXA da página de 2026");

/* O PDF da Prefeitura só traz "x" nas escolhas locais: o cartão avisa */
assert(card.topicos.some((t) => t[0] === "O que o PDF da Prefeitura não diz" && /“x”/.test(t[1]) && /inscrição aberta/.test(t[1])), "avisa que o PDF tem só 'x' nas escolhas da cidade");

/* Sem promessa, com fonte e aviso */
assert(/sem garantia de vaga/.test(card.aviso) && /desconfie de quem cobra/.test(card.aviso), "o aviso nega garantia e alerta para cobrança indevida");
assert(!/você (tem|terá) direito|você vai (ganhar|receber|conseguir)|com certeza|será contemplad|está garantid/i.test(tudo), "sem promessa de contemplação");
assert(/^https:\/\/rioclaro\.sp\.gov\.br\//.test(card.fonte[1]) && /16\/10\/2026/.test(card.fonte[2]) && /maio de 2017/.test(card.fonte[2]), "fonte oficial da Prefeitura, com a data da leitura e a do folheto antigo");

/* Links: todos https; os oficiais esperados estão lá */
sec.links.forEach((l) => assert(/^https:\/\//.test(l[1]) && l[2], "link com endereço seguro e descrição: " + l[0]));
["CRITERIOS-DE-ELEGIBILIDADE.pdf", "portaria-mcid-n-333-de-30-de-marco-de-2026", "caixa.gov.br/voce/habitacao/minha-casa-minha-vida/classe-media"].forEach((u) =>
  assert(sec.links.some((l) => l[1].includes(u)), "link ausente: " + u));

/* Fontes arquivadas */
["prefeitura-criterios-elegibilidade-portaria-mcid-738-2024.pdf", "portaria-mcid-333-2026-limites-de-renda.pdf",
 "caixa-minha-casa-minha-vida-classe-media.pdf", "caixa-documentacao-basica-credito-imobiliario-2017.pdf"].forEach((f) =>
  assert(fs.existsSync(path.join(__dirname, "..", "..", "docs", "documetacao", f)), "fonte arquivada: " + f));
const leia = fs.readFileSync(path.join(__dirname, "..", "..", "docs", "documetacao", "LEIA-ME.md"), "utf8");
["prefeitura-criterios-elegibilidade-portaria-mcid-738-2024.pdf", "portaria-mcid-333-2026-limites-de-renda.pdf",
 "caixa-minha-casa-minha-vida-classe-media.pdf", "caixa-documentacao-basica-credito-imobiliario-2017.pdf"].forEach((f) => assert(leia.includes(f), "LEIA-ME cita: " + f));

console.log("habitacao.test.js: tetos de renda de 2026, critérios e desempate da Portaria 738, déficit habitacional, tópico da avó sem inventar regra, CAIXA como financiamento (folheto de 2017 avisado), sem promessa");
