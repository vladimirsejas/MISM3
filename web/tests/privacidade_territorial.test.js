/* Guardião da publicação: os arquivos servidos pelo site não podem reconstruir setores suprimidos
   nem publicar matrículas individualizadas por escola. */
const assert = require("assert");
const fs = require("fs");
const path = require("path");

const dadosDir = path.join(__dirname, "..", "dados");
const ler = (nome) => JSON.parse(fs.readFileSync(path.join(dadosDir, nome), "utf8"));
const indicadores = ler("indicadores_territoriais.json");
const geo = ler("setores.geojson");
const territorio = ler("territorio.json");
const analise = ler("analise_territorial.json");
const exposicao = ler("exposicao_distancia.json");
const oferta = ler("oferta_educacao_infantil.json");
const cep = ler("cep_indice.json");

const protegidos = indicadores.setores.filter(s => s.suprimido_privacidade === true);
const ids = new Set(protegidos.map(s => s.id));
assert.strictEqual(ids.size, 17, "a regra D4 protege 17 setores");

protegidos.forEach(s => {
  assert.strictEqual(s.pessoas, null);
  assert.strictEqual(s.domicilios, null);
  assert.strictEqual(s.densidade, null);
  ["distancia_km", "distancia_min_km", "distancia_max_km"].forEach(campo => {
    Object.values(s[campo]).forEach(cenario => Object.values(cenario).forEach(valor => assert.strictEqual(valor, null)));
  });
});
assert(indicadores.setores.every(s => typeof s.suprimido_privacidade === "boolean"),
  "todos os setores declaram explicitamente se estão suprimidos");

const geoProtegidos = geo.features.filter(f => ids.has(f.properties.setor));
assert.strictEqual(geoProtegidos.length, 17);
geoProtegidos.forEach(f => {
  assert.strictEqual(f.properties.pessoas, null);
  assert.strictEqual(f.properties.domicilios, null);
  assert.strictEqual(f.properties.suprimido_privacidade, true);
});

const setoresTerritorio = Object.values(territorio.setores).filter(s => s.suprimido_privacidade);
assert.strictEqual(setoresTerritorio.length, 17);
setoresTerritorio.forEach(s => {
  assert.strictEqual(s.d, null);
  assert.strictEqual(s.p, null);
  Object.keys(s).filter(k => k.indexOf("dist_") === 0).forEach(k => assert.strictEqual(s[k], null));
});
const bairrosSuprimidos = territorio.bairros.filter(b => b.dados_suprimidos);
assert.strictEqual(bairrosSuprimidos.length, 13);
bairrosSuprimidos.forEach(b => {
  ["pessoas", "domicilios", "densidade", "pessoas_por_domicilio"].forEach(k => assert.strictEqual(b[k], null));
});
assert.strictEqual(territorio.totais.pessoas, null);
assert.strictEqual(territorio.totais.domicilios, null);
assert.strictEqual(territorio.meta.conferencia.pessoas_somadas, null);
assert.strictEqual(territorio.meta.sem_bairro.pessoas, null);

analise.bairros.filter(b => b.dados_suprimidos).forEach(b => {
  assert.strictEqual(b.pessoas, null);
  ["distancia_media_cras_km", "distancia_media_ubs_km", "distancia_media_escola_km"].forEach(k => assert.strictEqual(b[k], null));
});
assert.strictEqual(analise.meta.pessoas_total, null);
assert.strictEqual(exposicao.meta.pessoas_total, null);
assert.strictEqual(exposicao.meta.setores_suprimidos, 17);
assert(exposicao.cenarios && Object.keys(exposicao.cenarios).length > 0);

assert.deepStrictEqual(Object.keys(oferta).sort(), ["meta", "totais_por_rede"]);
assert.strictEqual(oferta.meta.granularidade_publicada, "totais por rede de ensino; sem contagens por escola");
assert(!("escolas" in oferta), "o arquivo público não contém matrículas individualizadas");
assert(Object.keys(oferta.totais_por_rede).length > 0);

const ceps = Object.values(cep.ceps || {});
assert(!ceps.some(item => ids.has(String(item.setor))),
  "o índice de CEP público não deve apontar para os setores suprimidos");

console.log("privacidade_territorial.test.js: D4, agregados complementares, CEP e matrículas por escola protegidos");
