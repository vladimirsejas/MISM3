/* Serviços de moradia no catálogo (Secretaria de Habitação e Defesa Civil), ligados à área Moradia e ao índice do orientador.
   Dados lidos em 05/11/2026 nas páginas da Prefeitura de Rio Claro. O que a fonte não traz (CEP, e-mail, tipos de ocorrência, atualização
   do cadastro) fica em branco e é dito na observação: este teste garante que ninguém preencha isso sem fonte. */
const assert = require("assert"), fs = require("fs"), path = require("path");
const Areas = require("../areas.js");
const web = path.resolve(__dirname, "..");
const catalogo = JSON.parse(fs.readFileSync(path.join(web, "dados", "catalogo_manual.json"), "utf8")).servicos;
const indice = JSON.parse(fs.readFileSync(path.join(web, "dados", "indice_orientacao.json"), "utf8"));
const porId = (id) => catalogo.find((s) => s.id === id);

const hab = porId("man-habitacao-secretaria"), dc = porId("man-defesa-civil");
assert(hab && dc, "os dois serviços existem no catálogo");
[hab, dc].forEach((s) => {
  assert(s.tipo === "assistencia" && s.fonte_url && /^https:\/\/(www\.)?rioclaro\.sp\.gov\.br\//.test(s.fonte_url), s.id + ": fonte oficial da Prefeitura");
  assert(s.verificado_em === "2026-11-05" && s.fonte && s.aviso, s.id + ": data, fonte e aviso");
  assert(!s.lat && !s.lon, s.id + ": sem coordenada inventada");
  assert(/n[ãa]o foram testados|n[ãa]o testados/i.test((s.aviso || "") + " " + (s.observacao || "")), s.id + ": telefone marcado como não testado");
});

/* Secretaria de Habitação: telefone literal; endereço divergente entre duas páginas oficiais => rua e CEP em branco, as duas versões na observação. */
assert.strictEqual(hab.subtipo, "habitacao");
assert.strictEqual(hab.telefone, "(19) 3522-1905");
assert(!hab.cep, "CEP em branco por divergência entre as páginas oficiais");
assert(/3265/.test(hab.endereco) && !/Elói Chaves|Rua 6/.test(hab.endereco), "o endereço cadastrado só tem o que as duas páginas confirmam (nº 3265, Alto do Santana)");
assert(/Rua Doutor Elói Chaves, 3265, CEP 13504-050/.test(hab.observacao) && /Rua 6, 3265, CEP 13504-099/.test(hab.observacao), "as duas versões do endereço estão na observação");
assert(/Atualização do cadastro: o procedimento não foi encontrado em fonte oficial/.test(hab.observacao), "atualização do cadastro: lacuna dita, não inventada");
assert(/sistemas\.rioclaro\.sp\.gov\.br\/cadastrohabitacional/.test(hab.observacao) && /Departamento de Acompanhamento e Cadastro Social/.test(hab.observacao), "como se inscrever: site e atendimento presencial");

/* Defesa Civil: 199 (24 h) e telefone administrativo literais; sem prometer vistoria nem tipos de ocorrência que a página não lista. */
assert.strictEqual(dc.subtipo, "defesa_civil");
assert(/^199 \(24 horas\) \/ \(19\) 3534-3199/.test(dc.telefone), "telefones literais da página");
assert(!dc.cep, "CEP não consta da página: em branco");
assert(/não lista os tipos de ocorrência/.test(dc.observacao) && /não promete atendimento nem vistoria/.test(dc.observacao), "não promete vistoria nem tipos de ocorrência");

/* Ligação à área Moradia: Habitação lista a Secretaria; duas seções novas; os serviços novos não vazam para a Assistência. */
const moradia = Areas.porId("moradia");
const sec = (t) => moradia.secoes.find((s) => s.titulo === t);
const habSec = sec("Habitação"), risco = sec("Casa em risco, alagamento ou enchente"), aluguel = sec("Aluguel ou prestação da casa atrasados, ameaça de despejo");
assert(habSec.tipos.includes("assistencia") && habSec.subtipos.includes("habitacao"), "a seção Habitação mostra a Secretaria");
assert(risco && risco.tipos.includes("assistencia") && risco.subtipos.includes("defesa_civil"), "seção da Defesa Civil");
assert(aluguel && aluguel.links.some((l) => l[1] === "#direitos/secao-1") && aluguel.links.some((l) => l[1] === "#assistencia/secao-1") && aluguel.links.some((l) => l[1] === "#direitos/secao-3"),
  "aluguel/prestação atrasados: Defensoria, CRAS e Procon (dívidas) por link");
assert(!/aluguel social|auxílio-aluguel/i.test(JSON.stringify(risco)) && /não encontrou, em página oficial, aluguel social/.test(aluguel.descricao), "não afirma aluguel social que nenhuma página oficial confirma");
assert(!/0800 ?\d/.test(JSON.stringify(aluguel)), "nenhum 0800 escrito à mão na seção (o telefone vem do cartão com fonte)");
const ids = moradia.guia.itens.map((i) => i.ancora);
assert(ids.includes("secao-4") && ids.includes("secao-5"), "atalhos no topo da área Moradia");
const assistencia = Areas.porId("assistencia");
assert(assistencia.secoes.every((s) => !(s.tipos || []).includes("assistencia") || (s.subtipos && !s.subtipos.includes("habitacao") && !s.subtipos.includes("defesa_civil"))),
  "as seções da Assistência Social têm subtipos explícitos: os serviços de moradia não vazam para lá");

/* Índice do orientador: os serviços entram na área Moradia, com a necessidade "moradia". */
const un = (id) => indice.unidades.filter((u) => u.id === id);
const uHab = un("man-habitacao-secretaria"), uDc = un("man-defesa-civil");
assert(uHab.length === 1 && uHab[0].area === "moradia" && uHab[0].sec === "secao-3" && uHab[0].needs.includes("moradia"), "Secretaria de Habitação no índice, em Moradia/Habitação");
assert(uDc.length === 1 && uDc[0].area === "moradia" && uDc[0].sec === "secao-4" && uDc[0].needs.includes("moradia"), "Defesa Civil no índice, em Moradia/Casa em risco");
const sAluguel = indice.unidades.find((u) => u.id === "sec-moradia-secao-5");
assert(sAluguel && /despejo/.test(sAluguel.texto) && /prestacao/.test(sAluguel.texto), "a seção de aluguel/prestação atrasados tem o vocabulário do assunto");
assert(indice.unidades.filter((u) => u.svc === "assistencia/cras" && u.area === "moradia").length === 0, "os CRAS não foram duplicados na área Moradia (isso trocava a área líder em perguntas de assistência)");

console.log("moradia_servicos.test.js: Secretaria de Habitação e Defesa Civil com fonte, telefone literal e lacunas ditas; ligados a Moradia e ao índice; sem aluguel social inventado");
