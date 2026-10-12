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
  ["não tenho onde deixar meu neném para trabalhar", "filhos"],
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

/* ---- busca no catálogo: recomenda serviços reais (verificados à mão), com tipos coerentes e sem fingir o que não existe ---- */
const catalogo = JSON.parse(fs.readFileSync(path.join(web, "dados", "catalogo_manual.json"), "utf8")).servicos.filter((x) => /^man-/.test(x.id));
IA.usarCatalogo(catalogo);
const nomesDe = (texto) => { const sg = IA.sugerir(texto); const r = IA.servicosPara(texto, sg, 2); return Object.keys(r).map((k) => r[k].map((x) => x.nome)).flat().join(" | "); };
assert(/Secretaria Municipal da Educação/.test(nomesDe("meu filho precisa de creche")), "creche leva à Secretaria da Educação");
assert(/CRAS|Desenvolvimento Social/.test(nomesDe("estou sem comida em casa")), "falta de comida leva ao CRAS ou à Secretaria de Desenvolvimento Social");
assert(/Delegacia de Defesa da Mulher|Secretaria Municipal da Mulher/.test(nomesDe("ele me bate e tenho medo")), "violência leva à rede de proteção");
assert(/SESI|EJA/.test(nomesDe("quero terminar o ensino médio")), "ensino médio leva à EJA");
assert(/Banco do Povo|Desenvolvimento Econômico/.test(nomesDe("quero abrir um negócio e conseguir crédito")), "negócio leva a crédito e à Secretaria de Desenvolvimento Econômico");
assert(/PAT|Conecta|Secretaria|SENAI|Senac|Fundo Social/.test(nomesDe("estou desempregada e preciso de emprego")));
assert.deepStrictEqual(IA.servicosPara("tô sem casa", IA.sugerir("tô sem casa").filter((x) => x.id === "moradia"), 2).moradia, [], "moradia não tem serviço cadastrado: não inventa");
/* o CAPS de álcool e drogas só aparece quando o texto fala disso; nunca para ansiedade */
assert(!/Álcool e Drogas/.test(nomesDe("preciso de psicóloga estou muito ansiosa")), "ansiedade não pode levar ao CAPS AD");
assert(!/Álcool e Drogas/.test(nomesDe("fui na UPA e não resolveram")));
assert(/Álcool e Drogas/.test(nomesDe("meu filho usa drogas e não sei o que fazer")), "quando o texto fala de drogas, o CAPS AD aparece");
/* só serviços do tipo certo, e só com telefone ou fonte */
const porId = Object.fromEntries(catalogo.map((x) => [x.id, x]));
["meu filho precisa de creche e emprego", "dor forte e estou sem dinheiro", "quero me separar e tenho medo", "quero fazer faculdade"].forEach((t) => {
  const sg = IA.sugerir(t), r = IA.servicosPara(t, sg, 2);
  sg.forEach((x) => (r[x.id] || []).forEach((sv) => {
    assert(IA.SERVICOS_DA_NECESSIDADE[x.id].some((reg) => reg.tipo === sv.tipo && (!reg.subtipos || reg.subtipos.includes(sv.subtipo))), "serviço do tipo errado para " + x.id + ": " + sv.nome);
    assert(sv.telefone || sv.fonte_url, "serviço sem contato nem fonte: " + sv.nome);
    assert(porId[sv.id], "serviço fora do catálogo verificado: " + sv.id);
  }));
  assert(Object.keys(r).every((k) => r[k].length <= 2), "no máximo 2 serviços por necessidade");
});
/* sem catálogo, nada é recomendado */
const IA2 = (() => { delete require.cache[require.resolve("../ia.js")]; return require("../ia.js"); })();
assert.deepStrictEqual(IA2.servicosPara("creche", [{ id: "filhos" }], 2), {});
/* o app só entrega ao índice os cadastros verificados à mão, nunca os cartões crus do CNES */
assert(/filter\(function \(s\) \{ return \/\^man-\/\.test/.test(fs.readFileSync(path.join(web, "app.js"), "utf8")), "a IA só pode indexar o catálogo verificado (ids man-)");

/* ---- transparência: o modelo diz de onde vêm os dados e não promete nada ---- */
assert(/escritas pela equipe/.test(modelo.meta.origem_das_frases) && /Não decide direitos/.test(modelo.meta.aviso));
const tudo = JSON.stringify(IA.CAMINHOS);
assert(!/você (tem|terá) direito|garant|aprovad/i.test(tudo), "os textos dos caminhos não podem prometer");

/* ---- privacidade: o código da IA não usa rede nem armazenamento ---- */
const codigo = fs.readFileSync(path.join(web, "ia.js"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
assert(!/fetch\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|indexedDB|document\.cookie|WebSocket/.test(codigo), "ia.js não pode usar rede nem armazenamento");

console.log("ia.test.js: mesma conta do treino, caminhos válidos, ganho sobre as regras, prioridade da violência e privacidade passaram");

/* Álcool e drogas: dependência é doença, então o caminho é a Saúde, direto na seção do CAPS AD e dos grupos de ajuda mútua.
   Nenhuma dessas frases pode virar "Proteção contra a violência". */
[
  "meu filho usa drogas e eu não sei o que fazer",
  "meu filho é viciado em crack",
  "minha filha está usando drogas",
  "meu marido bebe muito e eu estou desesperada",
  "meu pai vive bêbado",
  "meu irmão é alcoólatra",
  "estou usando drogas e quero parar",
  "preciso de grupo de apoio para família de dependente químico"
].forEach((frase) => {
  const sug = IA.sugerir(frase, 5);
  const saudeDrogas = sug.find((x) => x.id === "saude");
  assert(saudeDrogas, "álcool e drogas deve sugerir Saúde: " + frase);
  assert.strictEqual(saudeDrogas.href, "#saude/saude-familia-drogas", "deve levar direto à seção dos grupos e do CAPS AD: " + frase);
  assert(!sug.some((x) => x.id === "violencia"), "álcool e drogas não pode virar violência: " + frase);
});
assert.strictEqual(IA.sugerir("preciso marcar consulta com ginecologista", 3).find((x) => x.id === "saude").href, "#saude", "saúde comum continua no topo da Saúde");
console.log("ok: álcool e drogas leva à seção de apoio da Saúde, sem alarme falso de violência");

