/* Fala popular ("trampo", "abrigo", "maquina de costura"...) deixa de cair em abstenção: a busca ganha as palavras do catálogo, o texto original fica intacto. */
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const web = path.resolve(__dirname, "..");
const Orientar = require("../orientar.js");
const UI = require("../orientacao-ui.js");
const IA = require("../ia.js");
const Regras = require("../necessidades.js");
IA.usarModelo(JSON.parse(fs.readFileSync(path.join(web, "dados", "modelo_necessidades.json"), "utf8")));
const indice = JSON.parse(fs.readFileSync(path.join(web, "dados", "indice_orientacao.json"), "utf8"));
const escopo = IA.criarClassificador(JSON.parse(fs.readFileSync(path.join(web, "dados", "modelo_escopo.json"), "utf8")));
const motor = Orientar.criar(indice, { dica: UI.criarDica(IA, Regras), escopo: (t) => escopo.probabilidades(t).no_escopo, limiarEscopo: escopo.limiares.no_escopo });
["me mandaram embora e preciso de um trampo logo", "como consigo credito pra comprar maquina de costura", "preciso de um abrigo temporario"].forEach((t) => {
  const r = motor.responder(t, {});
  assert(r.itens.length > 0, `"${t}" não deveria cair em abstenção`);
});
const fora = motor.responder("qual a previsao do tempo para amanha em Paris", {});
assert.strictEqual(fora.itens.length, 0, "assunto fora do escopo continua em abstenção");
console.log("orientar_vocabulario_popular: ok");
