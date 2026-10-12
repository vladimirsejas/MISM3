const assert = require("assert");
const fs = require("fs");
const path = require("path");
const web = path.resolve(__dirname, "..");
const Duvida = require("../duvida.js");
const Areas = require("../areas.js");
const catalogo = JSON.parse(fs.readFileSync(path.join(web, "dados", "catalogo_manual.json"), "utf8")).servicos;

/* Mesmo índice que a tela monta (app.js: montarIndiceDuvida): textos da área + nomes dos serviços cadastrados + ferramentas. */
function indice(id) {
  const area = Areas.porId(id), vistos = {};
  const nomes = area.secoes.map((sec) => catalogo.filter((s) => sec.tipos.indexOf(s.tipo) !== -1 && !vistos[s.id] && (!sec.subtipos || sec.subtipos.indexOf(s.subtipo) !== -1) && (vistos[s.id] = 1)).map((s) => s.nome));
  const extras = [];
  if (area.jornada) extras.push({ ancora: "titulo-jornada", rotulo: "Monte seu plano", corpo: "plano passo a passo primeiro passo o que fazer por onde começar" });
  if (area.jornada === true) extras.push({ ancora: "montar-curriculo", rotulo: "Montar um currículo", corpo: "currículo curriculo emprego vaga trabalho" });
  if (area.secoes.some((x) => x.busca === "bairro")) extras.push({ ancora: "busca-bairro", rotulo: "Qual CRAS atende o meu bairro?", corpo: "cras bairro atende regiao endereco moro" });
  return Duvida.indexar(area, nomes, extras);
}
const acha = (id, pergunta) => Duvida.buscar(indice(id), pergunta, 3).map((h) => h.ancora);

/* ---- perguntas com as palavras da pessoa levam ao trecho certo da própria página ---- */
assert(acha("educacao", "como faço para pedir vaga na creche").includes("educacao-filhos"), "creche -> seção dos filhos");
assert(acha("educacao", "minha filha precisa de matrícula na escola").includes("educacao-filhos"), "matrícula -> seção dos filhos (filha = filho)");
assert(acha("educacao", "quero terminar o ensino médio").includes("educacao-voce"), "ensino médio -> seção 'para você'");
assert(acha("saude", "meu filho usa drogas, tem grupo de apoio para família").includes("saude-familia-drogas"), "drogas -> seção dos grupos e do CAPS AD");
assert(acha("saude", "meu marido bebe muito").includes("saude-familia-drogas"), "álcool -> seção dos grupos e do CAPS AD");
assert(acha("saude", "onde fica o posto de saúde").includes("saude-unidades"), "posto de saúde -> unidades");
assert(acha("assistencia", "qual cras atende meu bairro").includes("busca-bairro"), "CRAS do bairro -> a ferramenta de busca");
assert(acha("assistencia", "denunciar maus tratos com criança").length > 0, "denúncia -> Conselho Tutelar / Disque 100");
assert(acha("trabalho", "como fazer currículo").includes("montar-curriculo"), "currículo -> o gerador de currículo");
assert(acha("moradia", "conta de luz muito alta tarifa social").length > 0, "luz (ponte para energia) -> tarifa social");
assert(acha("direitos", "preciso de advogado de graça para pensão").length > 0, "advogado/pensão -> Defensoria e pensão");

/* ---- o que a página não tem não é inventado: lista vazia (a tela mostra "não encontramos") ---- */
["educacao", "saude", "assistencia", "trabalho", "direitos", "moradia"].forEach((id) => {
  assert.deepStrictEqual(acha(id, "qual a previsão do tempo amanhã"), [], "sem relação com a área: não inventa resposta (" + id + ")");
  assert.deepStrictEqual(acha(id, ""), [], "pergunta vazia: nada");
  assert.deepStrictEqual(acha(id, "de da do em"), [], "só palavras de ligação: nada");
});

/* ---- toda resposta aponta para um lugar que EXISTE na página ---- */
["trabalho", "educacao", "saude", "direitos", "moradia", "assistencia"].forEach((id) => {
  const area = Areas.porId(id);
  const ancoras = new Set(area.secoes.map((sec, i) => sec.ancora || ("secao-" + (i + 1))).concat((area.guia && area.guia.itens || []).map((g) => g.ancora), ["titulo-jornada", "montar-curriculo", "busca-bairro"]));
  indice(id).docs.forEach((d) => assert(ancoras.has(d.ancora), "âncora que não existe na página: " + id + " -> " + d.ancora));
  assert.strictEqual(typeof area.exemploDuvida, "string", "cada área tem um exemplo de pergunta: " + id);
});

/* ---- a ponte de vocabulário só vale quando a palavra da pessoa não existe na página ---- */
const idxEdu = indice("educacao");
assert(!acha("educacao", "como faço para pedir vaga na creche").includes("educacao-voce"), "'creche' existe na página: a ponte para 'educação' não puxa a faculdade");

/* ---- privacidade: o módulo não usa rede nem grava nada ---- */
const codigo = fs.readFileSync(path.join(web, "duvida.js"), "utf8");
assert(!/fetch\(|XMLHttpRequest|localStorage|sessionStorage|document\.cookie|indexedDB/.test(codigo), "a caixa de dúvida não usa rede nem armazenamento");

/* ---- a tela: aparece nas áreas com conteúdo, com aviso de que pode errar, e carrega o módulo ---- */
const app = fs.readFileSync(path.join(web, "app.js"), "utf8"), index = fs.readFileSync(path.join(web, "index.html"), "utf8");
assert(/<script src="duvida\.js"><\/script>/.test(index) && index.indexOf('<script src="duvida.js">') < index.indexOf('<script src="app.js">'), "duvida.js é carregado antes do app.js");
assert(/!area\.secoes \|\| !area\.secoes\.length/.test(app), "áreas sem seções (Transporte, Questionário) não mostram a caixa");
assert(/pode errar/.test(app) && /Se você está em perigo agora/.test(app), "a resposta avisa que pode errar e põe o perigo em primeiro lugar");
console.log("duvida.test.js: respostas na própria página, nada inventado, âncoras reais, ponte só quando falta a palavra, sem rede, caixa nas áreas com conteúdo");
void idxEdu;
