/* Cartão "Pensão alimentícia: como pedir e o que levar" (área Direitos, seção Separação, pensão e guarda).
   Só o que está nas páginas do Senado arquivadas em docs/documetacao/: senado-como-pedir-pensao-alimenticia-2012.pdf e senado-lei-pix-pensao-2026.pdf. */
const assert = require("assert"), fs = require("fs"), path = require("path");
const Areas = require("../areas.js");
const area = Areas.porId("direitos"), sec = area.secoes[0];
const card = sec.canais.find((c) => /^Pensão alimentícia/.test(c.nome));
assert(card && card.sem_tel === true && card.topicos.length >= 7, "o cartão da pensão existe e vem antes do da Defensoria");
assert(sec.canais.indexOf(card) < sec.canais.findIndex((c) => /^Defensoria/.test(c.nome)), "a pensão vem antes do cartão da Defensoria");
assert(/^https:\/\/www12\.senado\.leg\.br\//.test(card.fonte[1]) && /2012/.test(card.fonte[2]) && /2026/.test(card.fonte[2]) && /15\/10\/2026/.test(card.fonte[2]), "fonte oficial do Senado, com as duas datas e a da leitura");
assert(/de 04\/09\/2012/.test(card.aviso) && /podem ter mudado/.test(card.aviso) && /não diz qual será o valor/.test(card.aviso), "o aviso diz que o texto é de 2012, que pode ter mudado e que não decide valor");
const tudo = JSON.stringify(card);
["advogado ou a Defensoria Pública", "mais de 18 anos", "tem a guarda", "procuração", "certidão de nascimento", "RG, CPF e comprovante de residência", "endereço de casa ou do trabalho", "investigação de paternidade", "netos", "Lei nº 15.479/2026", "julho de 2027", "ainda não vale"].forEach((t) => assert(tudo.includes(t), "falta: " + t));
assert(!/garant|você (tem|terá) direito|você vai (ganhar|receber)|com certeza|retroativ|alimentos provisórios|R\$ ?\d/i.test(tudo), "sem promessa, sem valor e sem afirmação que as fontes não trazem");
assert(!/poderá requerer/.test(tudo), "a Lei do Pix Pensão não pode aparecer como se já valesse");
sec.links.forEach((l) => assert(/^https:\/\//.test(l[1])));
assert(sec.links.some((l) => /como-fazer-para-pedir-pensao-alimenticia/.test(l[1])) && sec.links.some((l) => /nova-lei-cria-transferencia-automatica/.test(l[1])), "os dois textos do Senado estão nos links");
["senado-como-pedir-pensao-alimenticia-2012.pdf", "senado-lei-pix-pensao-2026.pdf"].forEach((f) => assert(fs.existsSync(path.join(__dirname, "..", "..", "docs", "documetacao", f)), "fonte arquivada: " + f));
console.log("pensao.test.js: cartão do Senado com data de 2012 avisada, documentos da fonte, lei nova marcada como ainda não vigente, sem promessa nem valor");
