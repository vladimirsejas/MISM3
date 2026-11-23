/* "incêndio" em filme, novela, jogo etc. não dispara o alerta de risco; incêndio real continua disparando (só regras, sem o modelo aprendido). */
const assert = require("assert");
const Perigo = require("../perigo.js");
["o incendio do filme foi lindo", "vi um incendio na novela ontem"].forEach((t) => {
  assert.strictEqual(Perigo.avaliar(t), null, `"${t}" não deveria acionar alerta`);
});
["tem um incendio na casa do vizinho", "incendio na minha casa socorro", "a casa esta pegando fogo", "houve um incendio no mercado perto de mim"].forEach((t) => {
  const r = Perigo.avaliar(t);
  assert(r && r.nivel === 2 && r.tipos.includes("risco"), `"${t}" deveria dar alerta completo com o tipo risco`);
});
console.log("perigo_incendio_contexto: ok");
