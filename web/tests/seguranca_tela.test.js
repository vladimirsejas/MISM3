const assert = require("assert");
const fs = require("fs");
const path = require("path");
const app = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

/* Segurança primeiro: o alerta de perigo (regras de perigo.js, já na página) aparece na hora e também quando a busca não carrega. */
assert(/function alertaAgora\(texto\)/.test(app), "app.js precisa do alerta imediato");
const usos = (app.match(/alertaAgora\(texto\)/g) || []).length;
assert(usos >= 5, `o alerta imediato deve ser usado no início e na falha, na tela inicial e nas áreas (achei ${usos} usos)`);
/* em ambos os fluxos, o alerta é montado ANTES de esperar os arquivos (prepararOrientador) */
["function usarIA", "function responderDuvida"].forEach((nome) => {
  const i = app.indexOf(nome), fim = app.indexOf("prepararOrientador()", i);
  assert(i !== -1 && fim !== -1 && app.slice(i, fim).indexOf("alertaAgora(texto)") !== -1, `${nome}: o alerta deve vir antes de esperar o download`);
});
console.log("seguranca_tela.test.js ok");
