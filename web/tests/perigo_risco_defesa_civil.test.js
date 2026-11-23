const assert = require("assert");
const Perigo = require("../perigo.js");
["alagou tudo aqui em casa", "fiquei sem casa depois da enchente", "risco de desabar o barranco atras de casa"].forEach((t) => {
  const r = Perigo.avaliar(t);
  assert(r && r.tipos.includes("risco"), `"${t}" deveria acionar o alerta de risco`);
  assert(r.pins.some((p) => p.id === "man-defesa-civil"), `"${t}" deveria fixar a Defesa Civil`);
});
const cat = JSON.parse(require("fs").readFileSync(require("path").join(__dirname, "..", "dados", "catalogo_manual.json"), "utf8")).servicos;
const dc = cat.find((s) => s.id === "man-defesa-civil");
assert(dc && /199/.test(JSON.stringify(dc)), "o catálogo tem a Defesa Civil com o 199");
console.log("perigo_risco_defesa_civil: ok");
