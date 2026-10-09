const assert = require("assert");
const A = require("../acesso.js");

assert.strictEqual(A.normalizarCep("13.500-001"), "13500001");
assert.strictEqual(A.normalizarCep("1350"), null);
assert.strictEqual(A.normalizarCep("00000000"), null);
assert.strictEqual(A.normalizarCep(null), null);

// ~1 grau de latitude = ~111 km
const d = A.haversine(-22, -47, -23, -47);
assert(d > 110000 && d < 112500, d);

assert.strictEqual(A.formatarDistancia(40), "cerca de 100 m");
assert.strictEqual(A.formatarDistancia(430), "cerca de 400 m");
assert.strictEqual(A.formatarDistancia(1520), "cerca de 1,5 km");
assert.strictEqual(A.formatarDistancia(null), "");

const indice = { "13500001": [-22.4, -47.56, 200, "S1", 10] };
const serv = [
  { id: "a", tipo: "creche", nome: "Longe", lat: -22.45, lon: -47.56, abrangencia: "local" },
  { id: "b", tipo: "creche", nome: "Perto", lat: -22.401, lon: -47.56, abrangencia: "local" },
  { id: "c", tipo: "creche", nome: "Sem local", lat: null, lon: null, abrangencia: "local" },
  { id: "d", tipo: "mulher", nome: "Secretaria", lat: null, lon: null, abrangencia: "municipal" },
  { id: "e", tipo: "saude", nome: "UBS", lat: -22.41, lon: -47.56, abrangencia: "local" },
];
const r = A.buscar("13500-001", indice, serv, 1);
assert.strictEqual(r.status, "ok");
const creche = r.grupos.find(g => g.tipo === "creche");
assert.deepStrictEqual(creche.proximos.map(s => s.nome), ["Perto"]);   // limita e ordena
assert.deepStrictEqual(creche.sem_localizacao.map(s => s.nome), ["Sem local"]);
assert.strictEqual(creche.total_local, 3);
assert.deepStrictEqual(r.grupos.find(g => g.tipo === "mulher").municipais.map(s => s.nome), ["Secretaria"]);
assert.strictEqual(r.grupos.length, A.ORDEM.length);
assert.strictEqual(A.buscar("abc", indice, serv).status, "cep_invalido");
assert.strictEqual(A.buscar("13500002", indice, serv).status, "cep_desconhecido");
assert(!("endereco" in r.area) && r.area.raio_m === 200);
assert.strictEqual(A.rotuloSubtipo("ubs"), "Unidade básica de saúde");
assert.strictEqual(A.rotuloSubtipo("desconhecido"), null);
assert.strictEqual(A.rotuloSubtipo(null), null);
console.log("acesso.js: todos os testes passaram");
