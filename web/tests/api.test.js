const assert = require("assert");

/* Fake de navegador: config global + fetch que registra as chamadas. */
let chamadas, respostas;
global.window = { MISM3_CONFIG: {} };
global.fetch = (url, opts) => {
  chamadas.push({ url, opts });
  const r = respostas[url];
  if (!r) return Promise.resolve({ ok: false, status: 404, json: () => Promise.reject(new Error("404")) });
  if (r === "erro-de-rede") return Promise.reject(new Error("rede"));
  return Promise.resolve({ ok: r.status ? r.status < 400 : true, status: r.status || 200, json: () => Promise.resolve(r.corpo !== undefined ? r.corpo : r) });
};
const Api = require("../api.js");
const novo = (cfg, resp) => { chamadas = []; respostas = resp || {}; global.window.MISM3_CONFIG = cfg; };

(async () => {
  // ---- modo local: le o arquivo, nunca toca a API
  novo({ modo: "local" }, { "dados/servicos.json": { servicos: [1] } });
  assert.deepStrictEqual(await Api.json("dados/servicos.json"), { servicos: [1] });
  assert.deepStrictEqual(chamadas.map(c => c.url), ["dados/servicos.json"]);

  // ---- modo api: usa a API
  novo({ modo: "api", apiBase: "/api" }, { "/api/servicos": { servicos: ["da-api"] }, "dados/servicos.json": { servicos: ["local"] } });
  assert.deepStrictEqual(await Api.json("dados/servicos.json"), { servicos: ["da-api"] });
  assert.deepStrictEqual(chamadas.map(c => c.url), ["/api/servicos"]);

  // ---- API falha (404, 500 ou rede): cai para o arquivo local
  for (const falha of [undefined, { status: 500, corpo: {} }, "erro-de-rede"]) {
    novo({ modo: "api" }, { "/api/servicos": falha, "dados/servicos.json": { servicos: ["local"] } });
    assert.deepStrictEqual(await Api.json("dados/servicos.json"), { servicos: ["local"] });
  }
  // ... a menos que a configuracao proiba
  novo({ modo: "api", usarLocalSeApiFalhar: false }, { "dados/servicos.json": { servicos: ["local"] } });
  await assert.rejects(Api.json("dados/servicos.json"));
  // arquivo sem rota na API (ex.: setores.geojson) sempre vem do disco
  novo({ modo: "api" }, { "dados/setores.geojson": { type: "FeatureCollection" } });
  assert.deepStrictEqual((await Api.json("dados/setores.geojson")).type, "FeatureCollection");
  assert.deepStrictEqual(chamadas.map(c => c.url), ["dados/setores.geojson"]);

  // ---- pesquisa real: desligada por padrao, e so em modo api
  novo({ modo: "api" }, {}); assert.strictEqual(await Api.pesquisar("emprego"), null); assert.strictEqual(chamadas.length, 0);
  novo({ modo: "local", pesquisaRemota: true }, {}); assert.strictEqual(await Api.pesquisar("emprego"), null); assert.strictEqual(chamadas.length, 0);

  // ---- ligada: envia so texto (cortado em 300) e normaliza a resposta
  novo({ modo: "api", pesquisaRemota: true }, { "/api/pesquisar": { necessidades: ["emprego", 7, "filhos", "saude", "estudo"], resultados: [
    { titulo: "Vaga X", url: "https://exemplo.gov.br/x", descricao: "d", fonte: "Prefeitura", consultado_em: "2026-10-10" },
    { titulo: "Sem fonte", url: "" }, { titulo: "Link ruim", url: "javascript:alert(1)" }, { url: "https://a.b" }, null ] } });
  const r = await Api.pesquisar("x".repeat(500), { cep: "13500000" });
  assert.strictEqual(chamadas[0].url, "/api/pesquisar"); assert.strictEqual(chamadas[0].opts.method, "POST");
  assert.strictEqual(JSON.parse(chamadas[0].opts.body).texto.length, 300);
  assert.deepStrictEqual(r.necessidades, ["emprego", "filhos", "saude"]);                 // so strings, no maximo 3
  assert.deepStrictEqual(r.resultados.map(x => x.titulo), ["Vaga X"]);                   // sem fonte ou com link perigoso: descartado

  // ---- falha da pesquisa nunca derruba a busca local
  novo({ modo: "api", pesquisaRemota: true }, { "/api/pesquisar": { status: 502, corpo: {} } });
  assert.strictEqual(await Api.pesquisar("emprego"), null);
  novo({ modo: "api", pesquisaRemota: true }, { "/api/pesquisar": "erro-de-rede" });
  assert.strictEqual(await Api.pesquisar("emprego"), null);

  console.log("api.js: todos os testes passaram");
})().catch(e => { console.error(e); process.exit(1); });
