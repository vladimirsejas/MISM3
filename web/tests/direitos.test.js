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
assert(/não há unidade da DPU de Rio Claro|nem confirma unidade da DPU em Rio Claro/.test(conteudo), "não inventa unidade local da DPU");
assert(/Rua Três, 1026, Centro, CEP 13500-910/.test(conteudo), "endereço da APS Rio Claro está no encaminhamento previdenciário");
assert(/segunda a sábado, das 7h às 22h/.test(conteudo) && /agendamento pelo Meu INSS ou 135/.test(conteudo), "horário do 135 e agendamento presencial estão explicados");
assert(!/3524-2212|3534-3166|7h às 17h/.test(conteudo), "não publica telefone e horário local sem confirmação oficial");
assert(/em favor de seus assistidos/.test(conteudo) && /não é um canal direto de atendimento ao público/.test(conteudo), "explica corretamente o alcance do ACT INSS-DPU");
assert(/Avenida 5, nº 535, Centro, sala 104/.test(conteudo) && /3531-6137/.test(conteudo) && /13h às 17h/.test(conteudo), "CEJUSC usa o endereço, telefone e horário do diretório oficial atual");
assert(/atendimento é gratuito/.test(conteudo) && /Antes de enviar dados pessoais/.test(conteudo), "CEJUSC esclarece gratuidade e protege dados ao orientar contato por e-mail");
assert(/não confirma que o serviço esteja recebendo casos novos agora/.test(conteudo), "NPJ/SAJU não é anunciado como serviço ativo confirmado");
assert(/Anhanguera — unidade na Rua 2/.test(conteudo) && /atendimento jurídico a confirmar/.test(conteudo), "inclui a unidade indicada pelo mantenedor sem dizer que o serviço está ativo");
assert(/endereço completo não foi verificado/.test(conteudo) && /oferta atual de orientação jurídica gratuita/.test(conteudo), "distingue localização informada de atendimento jurídico confirmado");
assert(/Rua 5, 821/.test(conteudo) && /CEP 13500-040/.test(conteudo), "Procon Centro fica identificável pelo endereço informado");
assert(/não ranqueia nem recomenda profissionais individuais/.test(conteudo), "não cria ranking nem endosso profissional");
const semAvisosNegativos = conteudo.replace(/não garante[^.]{0,120}/gi, "");
assert(!/garante (?:atendimento|resultado)|caso será aceito|você tem direito/i.test(semAvisosNegativos), "não promete elegibilidade ou resultado");

const links = secao.links;
[
  "https://www2.oabsp.org.br/asp/dotnet/AJ/Triagem/WzdCadastroTriagem",
  "https://www.oabsp.org.br/subsecao/rio-claro",
  "https://www.prt15.mpt.mp.br/servicos/denuncias",
  "https://www.dpu.def.br/contatos-dpu",
  "https://www.gov.br/inss/pt-br/canais_atendimento/acts/acordos-de-cooperacao-tecnica-acts-nacionais/dpu-defensoria-publica-da-uniao",
  "https://www.gov.br/inss/pt-br/canais_atendimento/central-135",
  "https://www.gov.br/inss/pt-br/centrais-de-conteudo/publicacoes/contratos-e-licitacoes/superintendencia-regional-sudeste-i-sao-paulo/pregao-eletronico-no90011-2025-contratacao-de-servicos-de-vigilancia-integrada-no-ambito-da-srse-i/anexo_x-20302607.pdf/@@download/file",
  "https://www.consumidor.gov.br/",
  "https://rioclaro.sp.gov.br/justica/procon-de-rio-claro-realiza-mil-atendimentos-mensais/",
  "https://www.anhanguera.com/central-de-atendimento/",
  "https://www.tjsp.jus.br/Download/Conciliacao/Nucleo/Enderecos_Cejusc.pdf",
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
