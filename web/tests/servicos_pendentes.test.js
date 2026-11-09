"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const web = path.resolve(__dirname, "..");
const marcador = JSON.parse(fs.readFileSync(path.join(web, "dados", "servicos.json"), "utf8"));
const app = fs.readFileSync(path.join(web, "app.js"), "utf8");

assert.equal(marcador.meta.status, "pendente_regeneracao_local");
assert.deepEqual(marcador.servicos, []);
assert.match(marcador.meta.observacao, /não contém registros do pipeline/i);
assert.match(app, /r\[1\]\.meta\.status !== "pendente_regeneracao_local"/);
assert.match(app, /dados\.origem = pipelineDisponivel \? "Catálogo verificado e base do pipeline" : "Catálogo verificado manualmente"/);
assert.match(app, /dados\.falhou = !r\[0\] && !pipelineDisponivel/);

console.log("servicos_pendentes.test.js: marcador vazio não simula base do pipeline nem altera a origem do catálogo");
