/* TRAVA DO CONTEÚDO ESSENCIAL: nada do que já foi feito pode sumir sem que alguém decida isso de propósito.

   Por que existe: várias branches editam os mesmos arquivos (web/jornada-ui.js e web/areas.js). Quando uma delas é juntada à outra
   e leva a versão antiga de um trecho, o Trabalho (e qualquer outra área) perde partes sem aviso. Aconteceu mais de uma vez
   (ver docs/trava_conteudo_essencial.md).

   Como funciona: docs/conteudo_essencial.json guarda a lista de tudo o que existe hoje (seções, cartões, títulos de tópicos,
   links, atalhos, títulos e âncoras da jornada, serviços do catálogo). Este teste confere que cada item continua existindo.
   Se algo sumir, o teste reprova e diz exatamente o quê e onde. O GitHub roda este teste em todo Pull Request.

   Comandos:
     node web/tests/conteudo_essencial.test.js                       confere (é o que o CI faz)
     node web/tests/conteudo_essencial.test.js --atualizar           ACRESCENTA à lista o que é novo (nunca tira nada)
     node web/tests/conteudo_essencial.test.js --aceitar-remocoes    tira da lista o que sumiu: SÓ se a remoção for de propósito */
const assert = require("assert"), fs = require("fs"), path = require("path");
const raiz = path.join(__dirname, "..", "..");
const ARQ = path.join(raiz, "docs", "conteudo_essencial.json");
const Areas = require("../areas.js");
const ler = (p) => fs.readFileSync(path.join(raiz, p), "utf8");

const limpa = (s) => String(s).replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
const unicos = (a) => [...new Set(a)].sort();

function extrair() {
  const areas = {};
  Areas.AREAS.forEach((a) => {
    const secoes = [], cartoes = [], topicos = [], links = [], guia = [], ancoras = [];
    (a.guia ? a.guia.itens : []).forEach((i) => guia.push(i.titulo + (i.ancora ? " -> #" + i.ancora : "")));
    a.secoes.forEach((s) => {
      secoes.push(s.titulo); if (s.ancora) ancoras.push(s.ancora);
      (s.links || []).forEach((l) => links.push(l[1]));
      (s.canais || []).forEach((c) => {
        cartoes.push(c.nome);
        (c.topicos || []).forEach((t) => topicos.push(c.nome + " || " + t[0]));
        if (c.fonte && c.fonte[1]) links.push(c.fonte[1]);
      });
    });
    areas[a.id] = { secoes: unicos(secoes), cartoes: unicos(cartoes), topicos: unicos(topicos), links: unicos(links), atalhos: unicos(guia), ancoras: unicos(ancoras) };
  });
  const ui = ler("web/jornada-ui.js");
  const jornada = {
    titulos: unicos([...ui.matchAll(/<h[2-4][^>]*>(.*?)<\/h[2-4]>/g)].map((m) => limpa(m[1])).filter((t) => t.length > 3 && !/['"+]/.test(t))),
    ancoras: unicos([...ui.matchAll(/\bid="([a-z0-9-]+)"/g)].map((m) => m[1]).filter((i) => !/^[a-z]-?\d$/.test(i))),
    links: unicos([...ui.matchAll(/href="(https?:\/\/[^"]+)"/g)].map((m) => m[1]))
  };
  const catalogo = unicos(JSON.parse(ler("web/dados/catalogo_manual.json")).servicos.map((s) => s.id));
  return { areas, jornada, catalogo };
}

function comparar(lista, atual) {
  const faltam = [];
  const conf = (rotulo, esperados, existentes) => { const e = new Set(existentes); esperados.forEach((x) => { if (!e.has(x)) faltam.push(rotulo + ": " + x); }); };
  Object.keys(lista.areas).forEach((id) => {
    const a = atual.areas[id];
    if (!a) { faltam.push("ÁREA INTEIRA: " + id); return; }
    Object.keys(lista.areas[id]).forEach((k) => conf("[" + id + "] " + k, lista.areas[id][k], a[k] || []));
  });
  Object.keys(lista.jornada).forEach((k) => conf("[jornada-ui.js] " + k, lista.jornada[k], atual.jornada[k]));
  conf("[catálogo] serviços", lista.catalogo, atual.catalogo);
  return faltam;
}

function acrescentar(lista, atual) {
  let novos = 0;
  const mescla = (a, b) => { const s = new Set(a); b.forEach((x) => { if (!s.has(x)) { s.add(x); novos++; } }); return unicos(s); };
  Object.keys(atual.areas).forEach((id) => {
    lista.areas[id] = lista.areas[id] || {};
    Object.keys(atual.areas[id]).forEach((k) => { lista.areas[id][k] = mescla(lista.areas[id][k] || [], atual.areas[id][k]); });
  });
  Object.keys(atual.jornada).forEach((k) => { lista.jornada[k] = mescla(lista.jornada[k] || [], atual.jornada[k]); });
  lista.catalogo = mescla(lista.catalogo || [], atual.catalogo);
  return novos;
}

function remover(lista, faltam) {
  const set = new Set(faltam);
  Object.keys(lista.areas).forEach((id) => Object.keys(lista.areas[id]).forEach((k) => { lista.areas[id][k] = lista.areas[id][k].filter((x) => !set.has("[" + id + "] " + k + ": " + x)); }));
  Object.keys(lista.jornada).forEach((k) => { lista.jornada[k] = lista.jornada[k].filter((x) => !set.has("[jornada-ui.js] " + k + ": " + x)); });
  lista.catalogo = lista.catalogo.filter((x) => !set.has("[catálogo] serviços: " + x));
}

const atual = extrair();
const modo = process.argv[2];
const vazia = { aviso: "Lista do que NÃO pode sumir. Não edite à mão: use os comandos do cabeçalho de web/tests/conteudo_essencial.test.js.", areas: {}, jornada: {}, catalogo: [] };

if (modo === "--atualizar") {
  const lista = fs.existsSync(ARQ) ? JSON.parse(fs.readFileSync(ARQ, "utf8")) : vazia;
  const n = acrescentar(lista, atual);
  fs.writeFileSync(ARQ, JSON.stringify(lista, null, 1) + "\n");
  console.log("conteudo_essencial: " + n + " item(ns) novo(s) acrescentado(s) à lista (nada foi retirado).");
  process.exit(0);
}

assert(fs.existsSync(ARQ), "falta docs/conteudo_essencial.json: rode  node web/tests/conteudo_essencial.test.js --atualizar");
const lista = JSON.parse(fs.readFileSync(ARQ, "utf8"));
const faltam = comparar(lista, atual);

if (modo === "--aceitar-remocoes") {
  remover(lista, faltam);
  fs.writeFileSync(ARQ, JSON.stringify(lista, null, 1) + "\n");
  console.log("conteudo_essencial: " + faltam.length + " item(ns) retirado(s) da lista, por decisão sua:\n  " + faltam.join("\n  "));
  process.exit(0);
}

if (faltam.length) {
  console.error("\nCONTEÚDO ESSENCIAL SUMIU: " + faltam.length + " item(ns) que existiam deixaram de existir.\n");
  faltam.slice(0, 40).forEach((f) => console.error("  - " + f));
  if (faltam.length > 40) console.error("  ... e mais " + (faltam.length - 40));
  console.error("\nIsso costuma acontecer quando uma branch antiga é juntada e leva a versão velha de web/areas.js ou web/jornada-ui.js." +
    "\nRestaure o trecho (veja docs/trava_conteudo_essencial.md). Se a remoção foi de propósito, rode:  node web/tests/conteudo_essencial.test.js --aceitar-remocoes\n");
}
assert.strictEqual(faltam.length, 0, "conteúdo essencial sumiu (" + faltam.length + " itens)");
const total = Object.values(lista.areas).reduce((s, a) => s + Object.values(a).reduce((t, v) => t + v.length, 0), 0) + Object.values(lista.jornada).reduce((s, v) => s + v.length, 0) + lista.catalogo.length;
console.log("conteudo_essencial.test.js: " + total + " itens essenciais (áreas, jornadas e catálogo) continuam todos presentes");
