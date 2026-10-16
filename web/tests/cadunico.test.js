/* Bloco "Cadastro Único e Bolsa Família" da área Assistência Social.
   Confere: primeiro bloco, fonte e aviso, páginas oficiais, sem promessa, valor monetário ou horário não confirmado. */
const assert = require("assert");
const Areas = require("../areas.js");

const area = Areas.porId("assistencia");
const sec = area.secoes[0];
assert.strictEqual(sec.ancora, "assistencia-cadunico", "o bloco do CadÚnico é o primeiro da área Assistência");
assert(/CadÚnico/.test(sec.titulo) || /Cadastro Único/.test(sec.titulo), "o título cita o Cadastro Único");
assert.strictEqual(area.secoes[1].titulo, "Seu CRAS", "'Seu CRAS' vem logo abaixo: o texto manda procurar o bairro ali");
assert(area.secoes[1].busca === "bairro", "a busca por bairro continua na seção Seu CRAS");

const card = sec.canais[0];
assert(card && card.sem_tel === true && card.topicos.length >= 10, "um cartão com o passo a passo completo");
assert(card.fonte && /^https:\/\//.test(card.fonte[1]) && /16\/10\/2026/.test(card.fonte[2]), "o cartão traz fonte oficial e a data da leitura");
assert(card.aviso && /ainda não conferiu/.test(card.aviso) && /ligue antes/.test(card.aviso) && /não diz se a família tem direito/.test(card.aviso), "aviso: não conferido, ligue antes, não decide direito");

const titulos = card.topicos.map((t) => t[0]).join(" | ");
["urgente", "O que é o Cadastro Único", "Cadu", "Quem pode se cadastrar", "Quem da família deve ir", "Onde ir", "O que levar", "Se você sustenta seus netos", "Depois do atendimento", "Bolsa Família", "65 anos", "Se não conseguir atendimento", "Cuidado"].forEach((t) =>
  assert(titulos.includes(t), "falta o tópico: " + t));
assert.strictEqual(card.topicos[0][0], "Se a situação é urgente hoje", "o aviso de urgência vem primeiro: o cadastro leva dias e não resolve a fome de hoje");
const topicoAvo = card.topicos.find((t) => /sustenta seus netos/.test(t[0]));
assert(topicoAvo && /aposentadoria/.test(topicoAvo[1]) && /quem mora/.test(topicoAvo[1]), "o tópico orienta avós a declarar a situação real da família");
assert(/ainda não conferido, confirme no CRAS/.test(topicoAvo[1]), "o tópico específico mantém aviso enquanto a fonte não estiver arquivada em PDF");

const tudo = JSON.stringify(sec);
assert(/BPC/.test(tudo) && /135/.test(tudo) && /não precisa de intermediário/.test(tudo), "o BPC é explicado: INSS, 135 ou Meu INSS, sem intermediário");
assert(!/você (tem|terá) direito|garant|aprovad|vai receber|com certeza/i.test(tudo.replace(/não diz se a família tem direito/g, "").replace(/não garante/g, "")), "o bloco não promete");
assert(!/R\$ ?\d/.test(tudo), "nenhum valor monetário de renda");
assert(!/\b\d{1,2}\s?h\b|\bdas \d{1,2}h/i.test(tudo), "nenhum horário de atendimento: a fonte não traz");
assert(/Responsável Familiar tem pelo menos 16 anos, mora na casa e responde pela entrevista/.test(tudo) && /composição deve refletir quem mora no domicílio e compartilha rendas e despesas/.test(tudo), "quem responde pela família: 16 anos ou mais, mora na casa, e a composição reflete quem divide renda e despesas");
assert(!/obrigatoriamente (uma )?mulher|só (uma )?mulher pode|apenas (uma )?mulher/i.test(tudo), "o texto não exige que a responsável seja mulher");
assert(/Não confunda com o Cadu/.test(tudo) && /gratuita/.test(tudo), "separa o Cadu do CadÚnico e diz que a inscrição é gratuita");
assert(/não é preciso pedir o Bolsa Família|Não é preciso pedir o Bolsa Família/.test(tudo) && /não a Prefeitura/.test(tudo), "separa cadastro de benefício e diz quem seleciona");
assert(/3522-1930/.test(tudo), "o telefone da Secretaria de Desenvolvimento Social está no bloco");

/* Só páginas oficiais: Prefeitura de Rio Claro e gov.br. */
sec.links.forEach((l) => assert(/^https:\/\/(desenvolvimentosocial\.rc\.sp\.gov\.br|rioclaro\.sp\.gov\.br|www\.gov\.br)\//.test(l[1]), "link fora das páginas oficiais: " + l[1]));
assert(sec.links.some((l) => /gov\.br\/pt-br\/servicos\/inscrever-se/.test(l[1])) && sec.links.some((l) => /page_id=3366/.test(l[1])), "traz a página municipal e a federal do cadastro");
assert(sec.links.some((l) => /gov\.br\/mds\/pt-br\/acoes-e-programas\/cadastro-unico\/perguntas-frequentes-cadastro-unico/.test(l[1])), "traz FAQ oficial do MDS sobre composição familiar");
assert(!/utm_|chatgpt/i.test(tudo), "sem parâmetros de rastreamento nos links");

/* A pendência fica declarada enquanto as páginas não estiverem arquivadas. */
assert(area.pendencias.some((p) => /Cadastro Único/.test(p) && /não foram arquivadas/.test(p)), "a pendência do arquivo em PDF deve estar declarada");

console.log("cadunico.test.js: bloco primeiro e com fonte, aviso de urgência, sem promessa, sem valor de renda nem horário, só páginas oficiais");
