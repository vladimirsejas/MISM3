const assert = require("assert");
const R = require("../recomendar.js");

const base = { tipo: "emprego_curso", distancia_m: null };
const lista = [
  Object.assign({}, base, { id: "pat", nome: "PAT", objetivos: ["trabalhar"] }),
  Object.assign({}, base, { id: "cqp", nome: "CQP", objetivos: ["curso"], gratuito: true, distancia_m: 1200 }),
  Object.assign({}, base, { id: "cqp2", nome: "CQP longe", objetivos: ["curso"], gratuito: true, distancia_m: 9000 }),
  Object.assign({}, base, { id: "fundo", nome: "Fundo", objetivos: ["curso"], distancia_m: 500 }),
  Object.assign({}, base, { id: "semdado", nome: "Sem objetivos" }),
  { id: "ubs", tipo: "saude", nome: "UBS", objetivos: ["curso"] },
];

// so entra quem o cadastro diz que serve; nada e inferido do nome
assert.deepStrictEqual(R.recomendar(lista, "trabalhar").map(s => s.id), ["pat"]);
assert.deepStrictEqual(R.recomendar(lista, "empreender"), []);
assert.deepStrictEqual(R.recomendar(lista, "xx"), []);

// ordena por pontos (gratuito + perto); empate (4 = 4) desempata pela menor distancia
assert.deepStrictEqual(R.recomendar(lista, "curso").map(s => s.id), ["cqp", "fundo", "cqp2"]);
const topo = R.recomendar(lista, "curso")[0];
assert.strictEqual(topo.pontos, 5);
assert(topo.porque.length === 3 && topo.porque.some(t => /Gratuito/.test(t)));

// sem distancia nao ganha ponto de proximidade e nao quebra
assert.strictEqual(R.pontuar(lista[0], "trabalhar").pontos, 3);
// nao altera os objetos originais
assert(!("pontos" in lista[0]));
console.log("recomendar.js: todos os testes passaram");
