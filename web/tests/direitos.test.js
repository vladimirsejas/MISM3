/* Fluxos da Central de Justiça e Direitos: fontes institucionais, fronteiras dos serviços e preservação dos atalhos atuais. */
const assert = require("assert");
const Areas = require("../areas.js");
const area = Areas.porId("direitos");
const secao = area.secoes.find((s) => s.ancora === "secao-4");

assert(area && area.nome === "Direitos", "a porta global continua compatível com o menu atual");
assert(area.guia.titulo === "Central de Justiça e Direitos", "a área tem nome próprio de central sem alterar o menu principal");
assert.strictEqual(area.guia.itens.length, 4, "os quatro atalhos existentes são preservados");
assert(/violência|medo/i.test(area.guia.itens[0].titulo) && area.guia.itens[0].ancora === "secao-2", "violência continua primeiro e vai direto à proteção");
assert(area.guia.itens.some((i) => i.ancora === "secao-4" && /orientação jurídica/i.test(i.titulo)), "há atalho claro para assistência jurídica");
assert(secao && /triagem de cada instituição/.test(secao.descricao), "a central avisa que cada serviço faz sua própria triagem");

const conteudo = JSON.stringify(secao);
["Família", "assédio", "Dívidas", "benefício federal", "Documentos", "OAB-SP", "MPT", "CEJUSC", "NPJ/SAJU"].forEach((t) =>
  assert(new RegExp(t, "i").test(conteudo), "falta rota ou alternativa para: " + t));
assert(/não substitui a orientação de uma advogada ou advogado/.test(conteudo), "o MPT não é apresentado como representação individual");
assert(/não há unidade da DPU de Rio Claro confirmada/.test(conteudo), "não inventa unidade local da DPU");
assert(/dados de contato diferentes/.test(conteudo) && /não fixa endereço nem telefone/.test(conteudo), "CEJUSC mostra a divergência e não publica contato local incerto");
assert(/não confirma que o serviço esteja recebendo casos novos agora/.test(conteudo), "NPJ/SAJU não é anunciado como serviço ativo confirmado");
assert(/Anhanguera não foi incluída como serviço ativo/.test(conteudo), "Anhanguera aparece somente na nota que explica por que não foi cadastrada");
assert(/não ranqueia nem recomenda profissionais individuais/.test(conteudo), "não cria ranking nem endosso profissional");
const semAvisosNegativos = conteudo.replace(/não garante[^.]{0,120}/gi, "");
assert(!/garante (?:atendimento|resultado)|caso será aceito|você tem direito/i.test(semAvisosNegativos), "não promete elegibilidade ou resultado");

const links = secao.links;
[
  "https://www2.oabsp.org.br/asp/dotnet/AJ/Triagem/WzdCadastroTriagem",
  "https://www.oabsp.org.br/subsecao/rio-claro",
  "https://www.prt15.mpt.mp.br/servicos/denuncias",
  "https://www.dpu.def.br/contatos-dpu",
  "https://www.consumidor.gov.br/",
  "https://portal.tjsp.jus.br/Download/Conciliacao/Nucleo/Enderecos_Cejusc.pdf",
  "https://claretiano.edu.br/rioclaro"
].forEach((href) => assert(links.some((l) => l[1] === href), "falta link oficial: " + href));
links.forEach((l) => assert(/^https:\/\//.test(l[1]) && l[2], "link seguro com descrição: " + l[0]));
assert(links.some((l) => /OAB Rio Claro/.test(l[0]) && /\(19\) 99938-4627/.test(l[2])), "usa o canal geral publicado pela OAB-SP");

const familia = area.secoes.find((s) => s.ancora === "secao-1");
const protecao = area.secoes.find((s) => s.ancora === "secao-2");
assert(familia.canais.some((c) => /^Pensão alimentícia/.test(c.nome)), "cartão de pensão preservado");
assert(familia.canais.some((c) => /^Defensoria Pública/.test(c.nome)), "cartão existente da Defensoria preservado");
assert(protecao.urgente && /180/.test(area.guia.itens[0].texto), "rota de violência conserva urgência e Ligue 180");

console.log("direitos.test.js: central por necessidade, assistência OAB/Defensoria, rotas diferenciadas e limites de serviços conferidos");
