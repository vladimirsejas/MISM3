/* Avaliação exploratória da caixa de dúvida com o módulo real do navegador.
   As perguntas são sintéticas, escritas pela equipe; não representam usuárias reais.
   Uso: node avaliacao/avaliar_duvida.js
*/
const fs = require("fs");
const path = require("path");
const web = path.resolve(__dirname, "..", "web");
const Duvida = require(path.join(web, "duvida.js"));
const Areas = require(path.join(web, "areas.js"));
const catalogo = JSON.parse(fs.readFileSync(path.join(web, "dados", "catalogo_manual.json"), "utf8")).servicos;

function indice(id) {
  const area = Areas.porId(id), vistos = {};
  const nomes = area.secoes.map((sec) => catalogo
    .filter((s) => sec.tipos.indexOf(s.tipo) !== -1 && !vistos[s.id] &&
      (!sec.subtipos || sec.subtipos.indexOf(s.subtipo) !== -1) && (vistos[s.id] = 1))
    .map((s) => s.nome));
  const extras = [];
  if (area.jornada) extras.push({ ancora: "titulo-jornada", rotulo: "Monte seu plano", corpo: "plano passo a passo primeiro passo o que fazer por onde começar" });
  if (area.jornada === true) extras.push({ ancora: "montar-curriculo", rotulo: "Montar um currículo", corpo: "currículo curriculo emprego vaga trabalho" });
  if (area.secoes.some((x) => x.tipos.length)) extras.push({ ancora: "busca-por-cep", rotulo: "Ver o que fica perto de mim (pelo CEP)", corpo: "cep perto proximo mais proximo perto de mim endereco bairro unidade escola creche" });
  if (area.secoes.some((x) => x.busca === "bairro")) extras.push({ ancora: "busca-bairro", rotulo: "Qual CRAS atende o meu bairro?", corpo: "cras bairro atende regiao endereco moro" });
  return Duvida.indexar(area, nomes, extras);
}
const cache = {};
function buscar(area, pergunta) {
  if (!cache[area]) cache[area] = indice(area);
  return Duvida.buscar(cache[area], pergunta, 3).map((x) => x.ancora);
}

/* alvo = uma âncora aceitável entre as três primeiras; fora=true deve produzir lista vazia. */
const casos = [
  ["educacao", "como faço para pedir vaga na creche", ["educacao-filhos"]],
  ["educacao", "minha filha precisa de matrícula na escola", ["educacao-filhos"]],
  ["educacao", "quero terminar o ensino médio", ["educacao-voce"]],
  ["educacao", "tem creche perto de mim", ["busca-por-cep"]],
  ["educacao", "onde fica a escola mais próxima da minha casa", ["busca-por-cep"]],
  ["saude", "meu filho usa drogas, tem grupo de apoio para família", ["saude-familia-drogas"]],
  ["saude", "meu marido bebe muito", ["saude-familia-drogas"]],
  ["saude", "onde fica o posto de saúde", ["saude-unidades"]],
  ["assistencia", "qual CRAS atende meu bairro", ["busca-bairro"]],
  ["assistencia", "denunciar maus tratos com criança", ["secao-2", "secao-1"]],
  ["trabalho", "como fazer currículo", ["montar-curriculo"]],
  ["moradia", "conta de luz muito alta tarifa social", ["secao-1"]],
  ["direitos", "preciso de advogado de graça para pensão", ["secao-1"]],
  ["moradia", "quero pagar menos na conta de água", ["secao-1"]],
  ["assistencia", "estou sem comida em casa", ["secao-1"]],
  ["educacao", "qual o horário de matrícula da creche", ["educacao-filhos"]],
  ["saude", "preciso de atendimento psicológico", ["saude-unidades"]],
  ["direitos", "como denunciar violência contra a mulher", ["secao-2"]],
  ["educacao", "qual a previsão do tempo amanhã", []],
  ["saude", "qual a previsão do tempo amanhã", []],
  ["assistencia", "qual a previsão do tempo amanhã", []],
  ["trabalho", "", []]
];

let acertos = 0, respostasEsperadas = 0, abstencoesCorretas = 0, falsosResultados = 0;
const erros = [];
for (const [area, pergunta, alvos] of casos) {
  const resultado = buscar(area, pergunta);
  if (alvos.length) {
    respostasEsperadas++;
    if (resultado.some((x) => alvos.includes(x))) acertos++;
    else erros.push({ area, pergunta, esperado: alvos, obtido: resultado });
  } else if (resultado.length === 0) abstencoesCorretas++;
  else { falsosResultados++; erros.push({ area, pergunta, esperado: [], obtido: resultado }); }
}
const pct = (n, d) => d ? (100 * n / d).toFixed(1) + "%" : "n/d";
console.log("Avaliação exploratória de duvida.js (perguntas sintéticas; não é validação com usuárias)");
console.log("Acerto@3 nas perguntas com alvo: " + pct(acertos, respostasEsperadas) + " (" + acertos + "/" + respostasEsperadas + ")");
console.log("Abstenção correta nas perguntas sem alvo: " + pct(abstencoesCorretas, casos.length - respostasEsperadas) + " (" + abstencoesCorretas + "/" + (casos.length - respostasEsperadas) + ")");
console.log("Respostas fora de escopo: " + falsosResultados);
if (erros.length) {
  console.log("Casos para revisar:");
  erros.forEach((e) => console.log("- " + e.area + " | " + JSON.stringify(e.pergunta) + " | esperado=" + e.esperado.join(",") + " | obtido=" + e.obtido.join(",")));
}
