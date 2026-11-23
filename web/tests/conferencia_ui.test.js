/* Estados de conferência na interface (confirmado / não confirmado / pendente): linguagem simples, campo vazio nunca confirma,
   aviso de cautela visível em qualquer estado, e o campo antigo "conferido" do JSON derivado do estado. */
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const A = require("../acesso.js");
const web = path.resolve(__dirname, "..");

assert.strictEqual(A.estadoConferencia({ estado_conferencia: "confirmado", conferido: true }), "confirmado");
assert.strictEqual(A.estadoConferencia({ estado_conferencia: "nao_confirmado", conferido: false }), "nao_confirmado");
assert.strictEqual(A.estadoConferencia({ estado_conferencia: "pendente", conferido: false }), "pendente");
/* dado antigo, sem o campo novo: só "conferido: false" explícito vira não confirmado; ausente ou true NUNCA vira confirmado */
assert.strictEqual(A.estadoConferencia({ conferido: false }), "nao_confirmado");
assert.strictEqual(A.estadoConferencia({ conferido: true }), "pendente");
assert.strictEqual(A.estadoConferencia({}), "pendente");
assert.strictEqual(A.estadoConferencia(null), "pendente");
assert.strictEqual(A.estadoConferencia({ estado_conferencia: "qualquer coisa" }), "pendente");

/* textos em linguagem simples, sem termos técnicos */
["confirmado", "nao_confirmado", "pendente"].forEach((e) => {
  const t = A.textoConferencia({ estado_conferencia: e });
  assert(t && t.length > 20, e);
  assert(!/pipeline|json|hash|metadad|csv|planilha/i.test(t), "texto técnico demais: " + t);
});
assert(/ainda não conferiu/.test(A.textoConferencia({ estado_conferencia: "pendente" })) && /ligue antes de ir/i.test(A.textoConferencia({ estado_conferencia: "pendente" })));
assert(!/ainda não/i.test(A.textoConferencia({ estado_conferencia: "confirmado" })), "texto de confirmado não pode soar como pendência");

/* catálogo real gerado pelo pipeline */
const cat = JSON.parse(fs.readFileSync(path.join(web, "dados", "catalogo_manual.json"), "utf8")).servicos;
cat.forEach((s) => {
  assert(["confirmado", "nao_confirmado", "pendente"].includes(s.estado_conferencia), s.id + ": estado ausente");
  assert.strictEqual(s.conferido, s.estado_conferencia === "confirmado", s.id + ": 'conferido' deve derivar do estado");
});
const csv = fs.readFileSync(path.join(web, "..", "catalogo", "servicos_manuais.csv"), "utf8");
assert(cat.filter((s) => s.estado_conferencia === "confirmado").length === 10, "só a marcação explícita da planilha pode confirmar (DDM e os nove registros conferidos em 23/11/2026)");
assert(cat.filter((s) => s.estado_conferencia === "pendente").length > 100, "campo vazio deve resultar em pendente");

/* a interface usa o estado e mostra o aviso de cautela sempre */
const app = fs.readFileSync(path.join(web, "app.js"), "utf8");
assert(app.includes("Acesso.estadoConferencia(s)") && app.includes("Acesso.textoConferencia(s)"));
assert(/if \(s\.aviso && est !== "nao_confirmado"\)/.test(app), "aviso de cautela deve aparecer em qualquer estado");
assert(!/s\.conferido\s*(?:!==|===)\s*false/.test(app), "a interface não deve mais decidir pelo campo antigo");
const mapa = fs.readFileSync(path.join(web, "mapa.js"), "utf8");
assert(/Conferência pendente/.test(mapa) && !/s\.conferido\s*(?:!==|===)\s*false/.test(mapa));
console.log("conferencia_ui.test.js ok");
