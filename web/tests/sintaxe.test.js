const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const web = path.resolve(__dirname, "..");

/* Os scripts do navegador (app.js, mapa.js...) não são executados pelos outros testes, que só carregam a lógica pura.
   Aqui TODOS são compilados: um erro de sintaxe derrubaria a tela inteira e passaria despercebido. */
const scripts = fs.readdirSync(web).filter((f) => f.endsWith(".js")).sort();
assert(scripts.length >= 15, "deve achar os scripts do site (" + scripts.length + ")");
scripts.forEach((f) => {
  try { new vm.Script(fs.readFileSync(path.join(web, f), "utf8"), { filename: f }); }
  catch (e) { assert.fail("erro de sintaxe em web/" + f + ": " + e.message); }
});

/* Todo <script src> das páginas aponta para um arquivo que existe. */
["index.html", "mapa.html", "territorio.html", "painel-secretaria.html", "rede-mulheres.html"].forEach((pagina) => {
  const html = fs.readFileSync(path.join(web, pagina), "utf8");
  Array.from(html.matchAll(/<script src="([^"]+)"/g), (m) => m[1]).forEach((src) => {
    assert(fs.existsSync(path.join(web, src)), pagina + " carrega um script que não existe: " + src);
  });
});
console.log("sintaxe.test.js: " + scripts.length + " scripts compilam e todo <script src> existe");
