/* Cartão "Defensoria Pública: como pedir ajuda jurídica gratuita" na área Direitos (seção Separação, pensão e guarda).
   Conteúdo só do que está nas páginas oficiais arquivadas em docs/documetacao/ (defensoria-rio-claro.pdf e defensoria-sp-agende-atendimento.pdf). */
const assert = require("assert"), fs = require("fs"), path = require("path");
const Areas = require("../areas.js");
const sec = Areas.porId("direitos").secoes[0];
assert.strictEqual(sec.titulo, "Separação, pensão e guarda");
const card = sec.canais[0];
assert(card && card.sem_tel === true && card.topicos.length >= 7, "o cartão traz o passo a passo");
assert(/^https:\/\/www\.defensoria\.sp\.def\.br\//.test(card.fonte[1]) && /15\/10\/2026/.test(card.fonte[2]), "fonte oficial e data");
assert(/não diz se o seu caso será atendido/.test(card.aviso) && /confirme/.test(card.aviso), "aviso: não decide o caso e manda confirmar");
const tudo = JSON.stringify(card);
["3 salários mínimos", "4 salários mínimos", "independe da renda", "gov.br", "nome e o CPF", "Rua Um, nº 659", "7h às 12h", "carteira de trabalho e holerite", "netos"].forEach((t) => assert(tudo.includes(t), "falta: " + t));
assert(!/garant|você (tem|terá) direito|vai (ganhar|receber)|com certeza/i.test(tudo), "sem promessa");
assert(!/\(\d{2}\) ?\d{4,5}-?\d{4}|0800/.test(tudo), "nenhum telefone: a página tem um item de telefone que ainda não foi lido");
/* O cadastro do serviço e as fontes arquivadas acompanham o texto. */
const cat = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "dados", "catalogo_manual.json"), "utf8")).servicos.find((s) => s.id === "man-defensoria-nudem");
assert(cat && /Júlia/.test(cat.observacao) && /gov\.br/.test(cat.observacao) && cat.verificado_em === "2026-10-15", "o catálogo da Defensoria está atualizado com a página nova");
assert(fs.existsSync(path.join(__dirname, "..", "..", "docs", "documetacao", "defensoria-sp-agende-atendimento.pdf")), "a página 'Agende seu atendimento' está arquivada");
console.log("defensoria.test.js: cartão com fonte e aviso, regras de renda e urgência da fonte, sem telefone inventado nem promessa");
