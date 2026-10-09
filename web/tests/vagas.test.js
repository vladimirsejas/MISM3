const assert = require("assert");
const V = require("../vagas.js");

const v = (id, de, ate) => ({ id: id, inscricoes_de: de, inscricoes_ate: ate });
assert.strictEqual(V.situacao(v("a", "2026-10-01", "2026-10-20"), "2026-10-09"), "aberto");
assert.strictEqual(V.situacao(v("a", null, "2026-10-09"), "2026-10-09"), "aberto");      // ultimo dia ainda vale
assert.strictEqual(V.situacao(v("a", null, "2026-10-08"), "2026-10-09"), "encerrado");
assert.strictEqual(V.situacao(v("a", "2026-11-01", "2026-11-30"), "2026-10-09"), "em_breve");

const lista = [v("enc1", null, "2026-01-10"), v("enc2", null, "2026-03-10"), v("enc3", null, "2026-05-10"),
  v("enc4", null, "2025-12-01"), v("longe", null, "2026-12-30"), v("perto", null, "2026-10-12"), v("breve", "2026-11-01", "2026-11-30")];
const o = V.organizar(lista, "2026-10-09");
assert.deepStrictEqual(o.map(x => x.id), ["perto", "longe", "breve", "enc3", "enc2", "enc1"]); // 3 encerrados mais recentes
assert(!("situacao" in lista[0]));                                                              // nao altera a entrada
assert.strictEqual(V.dataBR("2026-10-09"), "09/10/2026");
console.log("vagas.js: todos os testes passaram");
