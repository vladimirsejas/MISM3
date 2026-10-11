const assert = require("assert");
const fs = require("fs");
const path = require("path");

const web = path.resolve(__dirname, "..");
const IA = require("../ia.js");
const Areas = require("../areas.js");
const modelo = JSON.parse(fs.readFileSync(path.join(web, "dados", "modelo_necessidades.json"), "utf8"));

/* ---- sem o modelo carregado, o sistema ainda funciona só com as regras ---- */
assert.strictEqual(IA.pronto(), false);
assert.strictEqual(IA.sugerir("meu marido me bateu")[0].id, "violencia", "sem o modelo, as regras continuam valendo e a violência vem primeiro");
assert.deepStrictEqual(IA.sugerir("oi bom dia"), []);
IA.usarModelo(modelo);
assert.strictEqual(IA.pronto(), true);

/* ---- o modelo no navegador faz a MESMA conta do treino em Python (vetores exportados pelo script de treino) ---- */
assert(modelo.vetores_de_teste.length >= 10);
modelo.vetores_de_teste.forEach((v) => {
  const p = IA.probabilidades(v.frase);
  Object.keys(v.prob).forEach((c) => assert(Math.abs(p[c] - v.prob[c]) < 0.01, "diverge do treino em '" + v.frase + "' / " + c + ": " + p[c] + " vs " + v.prob[c]));
});

/* ---- cada necessidade leva a um lugar que existe no site ---- */
modelo.classes.forEach((c) => assert(IA.CAMINHOS[c], "necessidade sem caminho: " + c));
Object.keys(IA.CAMINHOS).forEach((c) => {
  const m = /^#([a-z-]+)(?:\/([\w-]+))?$/.exec(IA.CAMINHOS[c].href);
  assert(m && Areas.porId(m[1]), "caminho para área inexistente: " + c);
});

/* ---- o modelo reconhece frases que as regras sozinhas não pegam ---- */
const regrasSo = require("../necessidades.js");
const frasesNovas = [
  ["ele me trancou no quarto e eu tenho pavor dele", "violencia"],
  ["não consigo vaga de berçário pro meu neném", "filhos"],
  ["tô sem um real e as crianças sem comer", "familia"],
  ["quero concluir a escola que abandonei", "estudo"]
];
let melhoraram = 0;
frasesNovas.forEach(([frase, esperada]) => {
  const juntos = IA.sugerir(frase).map((s) => s.id);
  assert(juntos.includes(esperada), "regras + modelo deveriam sugerir " + esperada + " para: " + frase + " => " + juntos);
  if (!regrasSo.identificarCategorias(frase).includes(esperada)) melhoraram++;
});
assert(melhoraram >= 2, "o modelo deveria acrescentar acertos que as regras não têm (acrescentou " + melhoraram + ")");

/* ---- segurança: tudo que as regras alertam como violência continua alertando; violência vem sempre primeiro ---- */
["ele me bate", "tenho medo do meu marido", "preciso de medida protetiva", "violência doméstica"].forEach((f) => {
  const s = IA.sugerir(f);
  assert.strictEqual(s[0] && s[0].id, "violencia", "violência deve ser a primeira sugestão: " + f);
  assert(s[0].urgente, "violência deve ser marcada como urgente");
});
const mista = IA.sugerir("preciso de emprego e meu marido me bate");
assert.strictEqual(mista[0].id, "violencia", "em necessidades mistas, a proteção vem antes");
assert(IA.sugerir("quero uma receita de bolo").length === 0, "fora do escopo, não inventa sugestão");
assert(IA.sugerir("").length === 0 && IA.sugerir("   ").length === 0);
assert(IA.sugerir("meu filho precisa de creche e eu preciso de emprego e de saúde e moradia e dívidas").length <= 3, "no máximo 3 sugestões");

/* ---- transparência: o modelo diz de onde vêm os dados e não promete nada ---- */
assert(/escritas pela equipe/.test(modelo.meta.origem_das_frases) && /Não decide direitos/.test(modelo.meta.aviso));
const tudo = JSON.stringify(IA.CAMINHOS);
assert(!/você (tem|terá) direito|garant|aprovad/i.test(tudo), "os textos dos caminhos não podem prometer");

/* ---- privacidade: o código da IA não usa rede nem armazenamento ---- */
const codigo = fs.readFileSync(path.join(web, "ia.js"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
assert(!/fetch\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|indexedDB|document\.cookie|WebSocket/.test(codigo), "ia.js não pode usar rede nem armazenamento");

console.log("ia.test.js: mesma conta do treino, caminhos válidos, ganho sobre as regras, prioridade da violência e privacidade passaram");
