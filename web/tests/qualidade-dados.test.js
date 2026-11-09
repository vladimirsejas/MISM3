const assert = require("assert");
const fs = require("fs");
const path = require("path");
const qd = require("../qualidade-dados.js");
const html = fs.readFileSync(path.join(path.resolve(__dirname, ".."), "qualidade-dados.html"), "utf8");

const quadrado = {
  type: "Polygon",
  coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]
};
const geo = { type: "FeatureCollection", features: [
  { properties: { setor: "1", pessoas: 4, domicilios: 2 }, geometry: quadrado },
  { properties: { setor: "2", pessoas: 20, domicilios: 8 }, geometry: quadrado }
] };

function testeExportacoesDoModulo() {
  const exportsEsperados = [
    "poligonos",
    "anelContem",
    "pontoNaMalha",
    "areaAnelLocal",
    "areaAnelEsferica",
    "areasGeojson",
    "validarGeometrias",
    "resumir"
  ];
  assert.deepStrictEqual(Object.keys(qd).sort(), exportsEsperados.slice().sort());
  exportsEsperados.forEach((nome) => {
    assert.strictEqual(typeof qd[nome], "function", "export deve existir e ser função: " + nome);
  });
  assert.strictEqual(qd.areaAnelGeodesica, undefined, "não deve exportar uma função geodésica inexistente");
}

function testeEstrutura() {
  const r = qd.validarGeometrias(geo);
  assert.strictEqual(r.total, 2);
  assert.strictEqual(r.codigos_unicos, 2);
  assert.strictEqual(r.geometrias_com_erro_estrutural.length, 0);
  const ruim = { features: [
    { properties: { setor: "1" }, geometry: { type: "Polygon", coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1]]] } },
    { properties: { setor: "1" }, geometry: { type: "GeometryCollection", geometries: [] } }
  ] };
  const erros = qd.validarGeometrias(ruim);
  assert.deepStrictEqual(erros.duplicados, ["1"]);
  assert.strictEqual(erros.geometrias_com_erro_estrutural.length, 2);
}

function testeBuracos() {
  const comBuraco = { features: [{ geometry: { type: "Polygon", coordinates: [
    [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]],
    [[4, 4], [6, 4], [6, 6], [4, 6], [4, 4]]
  ] } }] };
  assert.strictEqual(qd.pontoNaMalha(comBuraco, 2, 2), true);
  assert.strictEqual(qd.pontoNaMalha(comBuraco, 5, 5), false);
}

function testeResumo() {
  const territorio = { meta: { fonte: "IBGE", gerado_em: "2026-10-11" }, totais: { area_km2: 497.3 } };
  const indicadores = { equipamentos: [
    { id: "cras1", categoria: "cras", lat: 0.5, lon: 0.5, confianca_localizacao: "alta", metodo_localizacao: "rua", data_aplicacao_localizacao: "2026-01-01" },
    { id: "cras2", categoria: "cras", lat: 0.5, lon: 0.5, confianca_localizacao: "nao_registrada", metodo_localizacao: "catalogo_sem_registro_de_proveniencia" },
    { id: "escola1", categoria: "escola", lat: 0.5, lon: 0.5, metodo_localizacao: "coordenada_individual" },
    { id: "escola2", categoria: "escola", lat: 0.5, lon: 0.5, metodo_localizacao: "centroide_cep" }
  ] };
  const r = qd.resumir(geo, territorio, indicadores);
  assert.strictEqual(r.geometrias.total, 2);
  assert.strictEqual(r.equipamentos.cras_ubs.proveniencia_documentada, 1);
  assert.strictEqual(r.equipamentos.cras_ubs.proveniencia_ausente, 1);
  assert.strictEqual(r.equipamentos.escolas.coordenada_individual, 1);
  assert.strictEqual(r.equipamentos.escolas.referencia_cep, 1);
  assert.strictEqual(r.privacidade.setores_abaixo_da_faixa_de_cautela_D4, 1);
  assert.strictEqual(r.areas.soma_setorial_km2, 497.3);
  assert.strictEqual(r.areas.referencia_municipal_km2, 498.403);
  assert.strictEqual(r.areas.referencia_municipal_geodesica_km2, 498.402);
}

function testeBaseReal() {
  const web = path.resolve(__dirname, "..");
  const geoReal = JSON.parse(fs.readFileSync(path.join(web, "dados/setores.geojson"), "utf8"));
  const territorio = JSON.parse(fs.readFileSync(path.join(web, "dados/territorio.json"), "utf8"));
  const indicadores = JSON.parse(fs.readFileSync(path.join(web, "dados/indicadores_territoriais.json"), "utf8"));
  const r = qd.resumir(geoReal, territorio, indicadores);
  assert.strictEqual(r.geometrias.total, 408);
  assert.strictEqual(r.geometrias.codigos_unicos, 408);
  assert.strictEqual(r.geometrias.geometrias_com_erro_estrutural.length, 0);
  assert.strictEqual(r.equipamentos.cras_ubs.total, 28);
  assert.strictEqual(r.equipamentos.cras_ubs.proveniencia_documentada, 22);
  assert.strictEqual(r.equipamentos.cras_ubs.proveniencia_ausente, 6);
  assert.strictEqual(r.equipamentos.escolas.total, 68);
  assert.strictEqual(r.equipamentos.escolas.coordenada_individual, 33);
  assert.strictEqual(r.equipamentos.escolas.referencia_cep, 35);
  assert.strictEqual(r.privacidade.setores_abaixo_da_faixa_de_cautela_D4, 17);
  assert.strictEqual(r.areas.soma_setorial_km2, 498.422);
  assert.strictEqual(r.areas.referencia_municipal_km2, 498.403);
  assert.strictEqual(r.areas.referencia_municipal_geodesica_km2, 498.402);
  assert.ok(Math.abs(r.areas.recalculo_local_km2 - 497.365) < 0.002);
  assert.ok(Math.abs(r.areas.recalculo_esferico_km2 - 499.691) < 0.01);
  assert.ok(Math.abs(r.areas.diferenca_recalculo_esferico_vs_referencia_km2 - (499.691 - 498.402)) < 0.01);
}

testeExportacoesDoModulo();
testeEstrutura();
testeBuracos();
testeResumo();
assert(/Nos outros seis, a posição usada na análise é o centro do CEP cadastral, com raio operacional do índice/.test(html));
assert(/A validação topológica completa/.test(html) && /pipeline Python/.test(html));
testeBaseReal();
console.log("qualidade-dados.test.js: painel territorial, procedência, áreas, geometria e cautela D4 validados");
