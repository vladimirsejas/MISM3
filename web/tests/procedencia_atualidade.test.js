/* Procedência (fonte identificada, genérica, não identificada) e atualidade (data da CONSULTA, nunca "atualizado") na interface. */
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const A = require("../acesso.js");
const web = path.resolve(__dirname, "..");
const hoje = new Date(2026, 10, 21); // 21/11/2026, referência da auditoria

/* limites configuráveis e documentados */
assert.deepStrictEqual(A.LIMITES_ATUALIDADE, { recente_ate_dias: 30, a_renovar_ate_dias: 90 });
const est = (iso) => A.atualidade(iso, hoje).estado;
assert.strictEqual(est("2026-11-21"), "consulta_recente");
assert.strictEqual(est("2026-10-22"), "consulta_recente", "30 dias ainda é recente");
assert.strictEqual(est("2026-10-21"), "consulta_a_renovar", "31 dias");
assert.strictEqual(est("2026-08-23"), "consulta_a_renovar", "90 dias");
assert.strictEqual(est("2026-08-22"), "consulta_antiga", "91 dias");
["", null, "lixo", "2027-01-01"].forEach((d) => assert.strictEqual(est(d), "desconhecida", String(d)));
assert.strictEqual(A.atualidade("2026-10-08", hoje).dias, 44);

/* textos: dizem que é data da consulta e que não se sabe quando o órgão atualizou */
const base = { verificado_em: "2026-10-10", fonte: "Prefeitura", fonte_tipo: "identificada" };
const t = A.textoConsulta(base, hoje);
assert(/consultada pela equipe em 10\/10\/2026 \(há 42 dias\)/.test(t) && /Não sabemos quando o órgão atualizou/.test(t), t);
assert(!/atualizad[ao]\b(?! a página)/.test(t.replace("o órgão atualizou", "")), "não pode afirmar que está atualizado: " + t);
assert(/O órgão informa atualização em 01\/09\/2026/.test(A.textoConsulta({ ...base, data_atualizacao_fonte: "2026-09-01" }, hoje)));
assert(/Não há registro de quando/.test(A.textoConsulta({ verificado_em: "" }, hoje)));
assert.strictEqual(A.textoProcedencia({ fonte_tipo: "identificada" }), "");
assert(/Só sabemos o site do órgão/.test(A.textoProcedencia({ fonte_tipo: "generica" })));
assert(/Fonte não identificada/.test(A.textoProcedencia({ fonte_tipo: "nao_identificada" })));
["generica", "nao_identificada"].forEach((k) => assert(!/pipeline|json|hash|metadad/i.test(A.textoProcedencia({ fonte_tipo: k }))));

/* catálogo real: 9 genéricos; todo registro tem os campos de atualidade; a data de atualização da fonte não é inventada */
const cat = JSON.parse(fs.readFileSync(path.join(web, "dados", "catalogo_manual.json"), "utf8")).servicos;
assert.strictEqual(cat.filter((s) => s.fonte_tipo === "generica").length, 9);
cat.forEach((s) => {
  assert(["identificada", "generica", "nao_identificada"].includes(s.fonte_tipo), s.id);
  assert.strictEqual(s.data_consulta, s.verificado_em, s.id);
  assert.strictEqual(s.data_atualizacao_fonte, null, s.id + ": data de atualização da fonte não pode ser inventada");
  assert(["consulta_recente", "consulta_a_renovar", "consulta_antiga", "desconhecida"].includes(s.atualidade), s.id);
});

/* a interface usa os textos novos (e não o antigo "verificado em ... " sem ressalva) */
const app = fs.readFileSync(path.join(web, "app.js"), "utf8");
assert(app.includes("Acesso.textoConsulta(s)") && app.includes("Acesso.textoProcedencia(s)"));
assert(!/" · verificado em "/.test(app), "texto antigo 'verificado em' sem ressalva ainda presente");
assert(fs.readFileSync(path.join(web, "mapa.js"), "utf8").includes("Acesso.textoConsulta(s)"));
console.log("procedencia_atualidade.test.js ok");
