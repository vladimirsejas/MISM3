/* Cartão "Defensoria Pública: como pedir ajuda jurídica gratuita" na área Direitos (seção Separação, pensão e guarda).
   Conteúdo baseado em fontes oficiais, com páginas arquivadas em docs/documetacao/ (defensoria-rio-claro.pdf, defensoria-sp-agende-atendimento.pdf e defensoria-sp-instagram-rio-claro.pdf). */
const assert = require("assert"), fs = require("fs"), path = require("path");
const Areas = require("../areas.js");
const sec = Areas.porId("direitos").secoes[0];
assert.strictEqual(sec.titulo, "Separação, pensão e guarda");
const card = sec.canais.find((c) => /^Defensoria Pública/.test(c.nome));
assert(card && card.tel === "0800 773 4340" && !card.sem_tel && card.topicos.length >= 8, "o cartão traz o telefone e o passo a passo");
assert(/noticias\//.test(card.fonte[1]) && /26\/06\/2025/.test(card.fonte[2]) && /31\/10\/2026/.test(card.fonte[2]), "fonte oficial da sede e verificação atual do canal telefônico");
assert(/não diz se o seu caso será atendido/.test(card.aviso) && /[Cc]onfirme/.test(card.aviso), "aviso: não decide o caso e manda confirmar");
const tudo = JSON.stringify(card);
assert(sec.links.some((l) => /Agende atendimento/.test(l[0]) && /agende-seu-atendimento/.test(l[1]) && /7h às 19h/.test(l[2])), "link oficial de agendamento confirma o 0800 e o horário em dias úteis");
assert(sec.links.some((l) => /nova sede em Rio Claro/.test(l[0]) && /Rua Um, nº 659/.test(l[2])), "link oficial confirma endereço e data da mudança");
["3 salários mínimos", "4 salários mínimos", "independe da renda", "gov.br", "nome e o CPF", "Rua Um, nº 659", "7h às 12h", "7h às 19h", "24 horas", "0800 773 4340", "não cobra", "carteira de trabalho e holerite", "netos"].forEach((t) => assert(tudo.includes(t), "falta: " + t));
assert(!/garant|você (tem|terá) direito|vai (ganhar|receber)|com certeza/i.test(tudo), "sem promessa");
assert(!/\(\d{2}\) ?\d{4,5}-?\d{4}/.test(tudo) && (tudo.match(/0800 ?\d{3} ?\d{4}/g) || []).every((t) => t.replace(/\D/g, "") === "08007734340"), "o único telefone é o 0800 773 4340, da conta oficial da Defensoria");
/* O cadastro do serviço e as fontes arquivadas acompanham o texto. */
const cat = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "dados", "catalogo_manual.json"), "utf8")).servicos.find((s) => s.id === "man-defensoria-nudem");
assert(cat && /Júlia/.test(cat.observacao) && /gov\.br/.test(cat.observacao) && cat.verificado_em === "2026-10-31" && cat.telefone === "0800 773 4340" && card.tel === cat.telefone, "o catálogo e o cartão da Defensoria trazem o mesmo telefone");
["defensoria-sp-agende-atendimento.pdf", "defensoria-sp-instagram-rio-claro.pdf"].forEach((f) => assert(fs.existsSync(path.join(__dirname, "..", "..", "docs", "documetacao", f)), "fonte arquivada: " + f));
assert(/agende-seu-atendimento/.test(cat.fonte_url) && /notícia oficial/.test(cat.fonte), "catálogo usa o canal oficial atual e registra as duas fontes");
console.log("defensoria.test.js: cartão com fonte e aviso, regras de renda e urgência da fonte, telefone igual ao do catálogo, sem promessa");
