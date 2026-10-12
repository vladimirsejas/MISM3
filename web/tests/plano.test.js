const assert = require("assert");
const fs = require("fs");
const path = require("path");
const web = path.resolve(__dirname, "..");
const Plano = require("../plano.js");
const IA = require("../ia.js");
IA.usarModelo(JSON.parse(fs.readFileSync(path.join(web, "dados", "modelo_necessidades.json"), "utf8")));
const ids = (texto) => Plano.montar(IA.sugerir(texto, 5)).passos.map((p) => p.id);

/* ---- a ordem é a regra de urgência, não a nota do modelo ---- */
assert.deepStrictEqual(Plano.ORDEM, ["violencia", "familia", "saude", "moradia", "filhos", "casamento", "dividas", "emprego_curso", "estudo"]);
const fake = (id) => ({ id, titulo: id, texto: id, href: "#" + id, urgente: false });
assert.deepStrictEqual(Plano.montar([fake("estudo"), fake("emprego_curso"), fake("violencia"), fake("filhos")]).passos.map((p) => p.id), ["violencia", "filhos", "emprego_curso", "estudo"], "violência primeiro; trabalho e estudo por último");
assert.deepStrictEqual(Plano.montar([fake("moradia"), fake("familia")]).passos.map((p) => p.id), ["familia", "moradia"], "comida e apoio antes de moradia");
const entrada = [fake("estudo"), fake("violencia")], copia = JSON.stringify(entrada);
Plano.montar(entrada);
assert.strictEqual(JSON.stringify(entrada), copia, "não altera o que recebe");
assert.deepStrictEqual(Plano.montar([]).passos, [], "sem sugestões, sem passos");
assert.deepStrictEqual(Plano.montar([{ id: "inventada", titulo: "x", texto: "x", href: "#x" }]).passos, [], "necessidade desconhecida não vira passo");

/* ---- com as frases reais do assistente ---- */
const desempregada = ids("estou desempregada com dois filhos e não consigo pagar o aluguel");
assert(desempregada.indexOf("moradia") < desempregada.indexOf("filhos") && desempregada.indexOf("filhos") < desempregada.indexOf("emprego_curso"), "moradia, depois filhos, depois trabalho: " + desempregada.join(","));
const drogas = Plano.montar(IA.sugerir("meu filho usa drogas e eu não sei o que fazer", 5));
const passoDrogas = drogas.passos.find((p) => p.id === "saude");
assert(passoDrogas && /CAPS III/.test(passoDrogas.senao) && /192/.test(passoDrogas.senao), "drogas: o 'se não der certo' fala de crise (192) e do CAPS III");
assert(Plano.montar([fake("violencia")]).passos[0].senao.includes("180"), "violência: o 180 aparece");

/* ---- cada passo tem motivo e alternativa; nenhum promete vaga, benefício ou resultado ---- */
Plano.ORDEM.forEach((id) => {
  const p = Plano.montar([fake(id)]).passos[0];
  assert(p.porque && p.porque.length > 20, "falta o motivo da posição: " + id);
  assert(p.senao && p.senao.length > 20, "falta o que fazer se não der certo: " + id);
  assert(!/(você vai (receber|conseguir)|você tem direito|vaga garantida|garantimos|com certeza|sem falta)/i.test(p.porque + " " + p.senao), "o plano não pode prometer: " + id);
});
assert(/Nenhum serviço garante vaga, benefício ou atendimento/.test(Plano.montar([]).aviso), "o aviso diz que nada é garantido");
assert(!/fetch\(|XMLHttpRequest|localStorage|sessionStorage|document\.cookie/.test(fs.readFileSync(path.join(web, "plano.js"), "utf8")), "o plano não usa rede nem armazenamento");

/* ---- a tela usa o plano ---- */
const app = fs.readFileSync(path.join(web, "app.js"), "utf8"), index = fs.readFileSync(path.join(web, "index.html"), "utf8");
assert(index.indexOf('<script src="plano.js">') !== -1 && index.indexOf('<script src="plano.js">') < index.indexOf('<script src="app.js">'), "plano.js é carregado antes do app.js");
assert(/Plano\.montar/.test(app) && /Meu plano/.test(app), "o app mostra o Meu plano");
console.log("plano.test.js: ordem de urgência, motivo e alternativa em cada passo, sem promessa, sem rede, usado pela tela");
