/* Seção "Mais de um serviço ao mesmo tempo" (área Direitos): a rede por situação e as quatro perguntas antes de ir.
   Ideia de organização vinda de centros integrados de atendimento (Nova York); os serviços de Rio Claro vêm das outras áreas.
   O teste trava três coisas: cada serviço citado existe no catálogo, nada promete vaga ou espaço para crianças, e a fonte externa é só ideia. */
const assert = require("assert"), fs = require("fs"), path = require("path");
const Areas = require("../areas.js");
const area = Areas.porId("direitos");
const sec = area.secoes.find((s) => s.ancora === "secao-4");
assert(sec && /Mais de um serviço/.test(sec.titulo), "a seção existe no fim da área Direitos, sem renumerar as anteriores");
assert(area.secoes.slice(0, 3).map((s) => s.ancora).join() === "secao-1,secao-2,secao-3", "as âncoras antigas não mudaram");
assert(area.guia.itens.length === 4, "o guia continua com 4 atalhos: a seção nova entra sem botão novo, como o grupo decidiu");
const rede = sec.canais.find((c) => /^Quem atende junto/.test(c.nome)), antes = sec.canais.find((c) => /^Antes de ir/.test(c.nome));
assert(rede && antes && rede.sem_tel && antes.sem_tel, "os dois cartões existem e não têm telefone próprio");
assert(rede.topicos.length >= 6 && antes.topicos.length === 4, "seis situações e quatro perguntas");
["Violência", "Sem trabalho e com filhos", "comida", "casa", "Pensão", "neto"].forEach((t) => assert(rede.topicos.some((x) => x[0].indexOf(t) !== -1), "situação: " + t));
["Fica perto", "horário", "custa", "crianças"].forEach((t) => assert(antes.topicos.some((x) => x[0].indexOf(t) !== -1), "pergunta: " + t));

/* Cada serviço citado nas situações existe no catálogo de serviços do site. */
const csv = fs.readFileSync(path.join(__dirname, "..", "..", "catalogo", "servicos_manuais.csv"), "utf8");
["Delegacia de Defesa da Mulher", "Patrulha Maria da Penha", "CREAS", "Defensoria", "Conselho Tutelar", "Secretaria Municipal da Mulher", "Centro de Qualificação Profissional", "SENAI", "Senac", "Fundo Social", "CONECTA", "PAT", "Secretaria de Desenvolvimento Econômico", "Secretaria Municipal da Educação"].forEach((n) => assert(csv.indexOf(n) !== -1, "serviço não está no catálogo: " + n));

/* Sem promessa e sem afirmar que existe cuidado para as crianças. */
const tudo = JSON.stringify([rede, antes]);
assert(!/garant(e|imos|ido) (vaga|benef|atend)|você (tem|terá) direito|com certeza|sempre (atende|tem)/i.test(tudo.replace(/nenhum garante vaga, benefício ou atendimento/g, "").replace(/Nenhum dos serviços[^"]*"/g, "")), "sem promessa");
assert(/não confirmou, para nenhum serviço de Rio Claro, que haja esse espaço/.test(antes.topicos[3][1]), "não afirma que há espaço para as crianças");
assert(/Nenhum dos serviços cadastrados informa/.test(antes.aviso), "o aviso diz o que as fontes não trazem");
assert(/não encontrou um lugar assim em Rio Claro/.test(rede.texto) && /não um serviço que já exista aqui/.test(rede.aviso), "a ideia é marcada como adaptação, não como serviço existente");
assert(/nenhum garante vaga, benefício ou atendimento/.test(rede.aviso), "o aviso padrão do projeto está presente");
[rede, antes].forEach((c) => { assert(/^https:\/\//.test(c.fonte[1]) && /31\/10\/2026/.test(c.fonte[2]), "fonte com data"); });
assert(/^https:\/\/www\.nyc\.gov\//.test(rede.fonte[1]), "a fonte externa é a ficha oficial de Nova York");
console.log("rede_junto.test.js: seis situações com a rede de Rio Claro, quatro perguntas antes de ir, serviços conferidos no catálogo, sem promessa nem espaço para crianças presumido");
