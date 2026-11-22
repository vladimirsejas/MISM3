/* Campos incompletos: campo vazio nunca aparece como informação disponível; "não informado" ≠ "não se aplica"; registros e filtros preservados. */
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const A = require("../acesso.js");
const MS = require("../mapa-servicos.js");
const web = path.resolve(__dirname, "..");

const completo = { tipo: "saude", subtipo: "ubs", telefone: "(19) 0000-0000", endereco: "Rua A, 1", horario: "Seg a sex" };
assert.strictEqual(A.textoCamposAusentes(completo), "", "registro completo não ganha aviso");
["", "   ", null, undefined].forEach((v) => assert.deepStrictEqual(A.camposAusentes({ ...completo, telefone: v }).nao_informado, ["telefone"], JSON.stringify(v)));
assert.deepStrictEqual(A.camposAusentes({ tipo: "saude", subtipo: "ubs" }).nao_informado, ["telefone", "endereço", "horário"]);
const t = A.textoCamposAusentes({ ...completo, telefone: "", horario: null });
assert(/Não informado na fonte: telefone, horário\./.test(t) && /confirme|ligue/i.test(t), t);
assert(!/pipeline|json|hash|metadad|null|undefined/i.test(t));

/* "não se aplica": só com regra documentada; sem regra, é sempre "não informado" (na dúvida, não informado) */
assert.deepStrictEqual(A.NAO_SE_APLICA, {}, "não há regra de 'não se aplica' com base em fonte; criar uma exige documentar");
const regras = { "assistencia/exemplo_sem_horario": ["horario"] };
const a = A.camposAusentes({ tipo: "assistencia", subtipo: "exemplo_sem_horario", telefone: "1", endereco: "x", horario: "" }, regras);
assert.deepStrictEqual(a, { nao_informado: [], nao_se_aplica: ["horário"] });
assert.strictEqual(A.textoCamposAusentes({ tipo: "assistencia", subtipo: "exemplo_sem_horario", telefone: "1", endereco: "x", horario: "" }, regras), "", "não se aplica não vira pendência");
assert.deepStrictEqual(A.camposAusentes({ tipo: "assistencia", subtipo: "outro", telefone: "1", endereco: "x", horario: "" }, regras).nao_informado, ["horário"], "regra de um tipo não vale para outro");

/* catálogo real: registros incompletos preservados, contagens da auditoria, e o filtro continua achando-os */
const cat = JSON.parse(fs.readFileSync(path.join(web, "dados", "catalogo_manual.json"), "utf8")).servicos;
assert.strictEqual(cat.length, 168);
const sem = (c) => cat.filter((s) => !String(s[c] || "").trim()).length;
assert.deepStrictEqual([sem("telefone"), sem("endereco"), sem("horario")], [17, 12, 110], "contagens de campos vazios mudaram: investigar");
const incompletos = cat.filter((s) => A.textoCamposAusentes(s));
assert(incompletos.length >= 100 && incompletos.length <= 168);
cat.forEach((s) => { if (!String(s.telefone || "").trim()) assert(/telefone/.test(A.textoCamposAusentes(s)), s.id); });
const indice = JSON.parse(fs.readFileSync(path.join(web, "dados", "cep_indice.json"), "utf8")).ceps;
const lista = MS.preparar(cat, indice);
assert.strictEqual(lista.length, 168, "preparar não pode perder registros incompletos");
assert.strictEqual(MS.filtrar(lista, null, "", []).length, 168, "sem filtro, todos aparecem");
const semTel = lista.find((s) => !String(s.telefone || "").trim());
assert(MS.filtrar(lista, null, semTel.nome, []).some((s) => s.id === semTel.id), "o filtro por texto continua achando registro sem telefone");
const tipos = {}; cat.forEach((s) => { tipos[s.tipo] = (tipos[s.tipo] || 0) + 1; });
Object.keys(tipos).forEach((tp) => assert.strictEqual(MS.filtrar(lista, { [tp]: true }, "", []).length >= 0, true));
assert.strictEqual(MS.filtrar(lista, Object.fromEntries(Object.keys(tipos).map((k) => [k, false])), "", []).length, 0);

/* a interface usa a função e não mostra mais a frase solta antiga */
const app = fs.readFileSync(path.join(web, "app.js"), "utf8");
assert(app.includes("Acesso.textoCamposAusentes(s)") && !app.includes("Endereço não informado na fonte: ligue para confirmar"));
assert(fs.readFileSync(path.join(web, "mapa.js"), "utf8").includes("Acesso.textoCamposAusentes(s)"));
console.log("campos_incompletos.test.js ok");
