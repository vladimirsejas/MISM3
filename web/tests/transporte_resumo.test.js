/* Resumo do dia por linha e sentido (área Transporte): primeira e última saída, quantidade e maior espera, juntando as variantes de trajeto do mesmo
   sentido e dia. Usa os horários reais de web/dados/horarios_onibus.json; os valores esperados são recalculados aqui por outro caminho (minutos inteiros,
   sem reaproveitar as funções do app). As funções puras são extraídas de web/app.js entre os marcadores "resumo-dia". */
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const web = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(web, "app.js"), "utf8");
const h = JSON.parse(fs.readFileSync(path.join(web, "dados", "horarios_onibus.json"), "utf8"));

const ini = app.indexOf("/* resumo-dia:inicio"), fim = app.indexOf("/* resumo-dia:fim */");
assert(ini > 0 && fim > ini, "marcadores do resumo não encontrados em app.js");
const dataBr = (iso) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ""); return m ? m[3] + "/" + m[2] + "/" + m[1] : ""; };
const minutos = (x) => parseInt(x.slice(0, 2), 10) * 60 + parseInt(x.slice(3), 10);
const M = new Function("minutos", "dataBr", app.slice(ini, fim) + "; return { resumirDia: resumirDia, textoResumoDia: textoResumoDia, textoAvisoResumo: textoAvisoResumo, DIAS: DIAS_RESUMO };")(minutos, dataBr);

assert.deepStrictEqual(M.DIAS, ["Dias úteis", "Sábados", "Domingos"]);

/* esperado, calculado de outro jeito: lista única de minutos, ordenada, diferenças consecutivas */
function esperado(sentido, dia) {
  const todos = [];
  sentido.quadros.filter((q) => q.dia === dia).forEach((q) => q.horarios.forEach((x) => todos.push(minutos(x))));
  const u = Array.from(new Set(todos)).sort((a, b) => a - b);
  if (!u.length) return null;
  const f = (m) => String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
  let maior = null;
  for (let i = 1; i < u.length; i++) maior = Math.max(maior === null ? 0 : maior, u[i] - u[i - 1]);
  return { primeira: f(u[0]), ultima: f(u[u.length - 1]), quantidade: u.length, maiorEspera: maior };
}

let comHorario = 0, combinados = 0;
h.linhas.forEach((l) => l.sentidos.forEach((s) => M.DIAS.forEach((dia) => {
  const r = M.resumirDia(s, dia), e = esperado(s, dia), id = l.numero + " " + s.sentido + " " + dia;
  assert.deepStrictEqual(r, e, id);
  if (!r) return;
  comHorario++;
  /* limites: primeira e última existem nos quadros reais, nenhuma saída fica fora do intervalo, a maior espera cabe no intervalo */
  const reais = [].concat(...s.quadros.filter((q) => q.dia === dia).map((q) => q.horarios));
  assert(reais.includes(r.primeira) && reais.includes(r.ultima), id + ": primeira/última não estão nos quadros");
  assert(reais.every((x) => minutos(x) >= minutos(r.primeira) && minutos(x) <= minutos(r.ultima)), id);
  assert(r.quantidade <= reais.length && r.quantidade >= 1, id);
  if (r.quantidade > 1) assert(r.maiorEspera > 0 && r.maiorEspera <= minutos(r.ultima) - minutos(r.primeira), id);
  /* variantes combinadas: a quantidade é a de saídas distintas de TODOS os quadros do dia, não a de um quadro só */
  const nQuadros = s.quadros.filter((q) => q.dia === dia).length;
  if (nQuadros > 1) { combinados++; assert(r.quantidade > Math.max(...s.quadros.filter((q) => q.dia === dia).map((q) => q.horarios.length)) - 1, id); }
})));
assert(comHorario > 20, "poucos quadros verificados: " + comHorario);
assert(combinados > 0, "nenhum sentido com variantes combinadas nos dados reais");

/* caso real com variantes: linha 01 Ida, sábados (variantes 2, 3, 4 e 5): a espera máxima é calculada sobre a sequência combinada */
const l01 = h.linhas.find((l) => l.numero === "01").sentidos.find((s) => s.sentido === "Ida");
const sab = l01.quadros.filter((q) => q.dia.startsWith("S"));
assert(sab.length >= 2);
const rs = M.resumirDia(l01, sab[0].dia);
assert(rs.quantidade > sab[0].horarios.length, "as variantes não foram somadas");
const soUma = M.resumirDia({ quadros: [sab[0]] }, sab[0].dia);
assert(rs.maiorEspera <= soUma.maiorEspera, "juntar variantes não pode aumentar a maior espera");

/* duplicidades entre variantes não contam duas vezes (cópia dos quadros reais, com a primeira variante repetida) */
const q0 = l01.quadros[0];
const dup = M.resumirDia({ quadros: [q0, { dia: q0.dia, variante: 99, horarios: q0.horarios.slice() }] }, q0.dia);
assert.deepStrictEqual(dup, M.resumirDia({ quadros: [q0] }, q0.dia), "saída repetida foi contada duas vezes");
/* ordem cronológica independe da ordem dos quadros */
const inv = M.resumirDia({ quadros: l01.quadros.slice().reverse() }, sab[0].dia);
assert.deepStrictEqual(inv, rs);

/* dia sem horário: texto exato, nunca zero */
const semSab = { quadros: l01.quadros.filter((q) => !q.dia.startsWith("S")) };
assert.strictEqual(M.resumirDia(semSab, sab[0].dia), null);
assert.strictEqual(M.textoResumoDia(M.resumirDia(semSab, sab[0].dia)), "sem horários cadastrados");
assert.strictEqual(M.textoResumoDia(M.resumirDia({ quadros: [] }, "Domingos")), "sem horários cadastrados");
/* uma única saída: não inventa espera */
const uma = M.resumirDia({ quadros: [{ dia: "Domingos", horarios: ["08:00"] }] }, "Domingos");
assert.deepStrictEqual(uma, { primeira: "08:00", ultima: "08:00", quantidade: 1, maiorEspera: null });
assert(/1 saída;/.test(M.textoResumoDia(uma)) && !/0 min/.test(M.textoResumoDia(uma)));

/* aviso obrigatório, com a validade lida do JSON */
assert(/^\d{4}-\d{2}-\d{2}$/.test(h.valido_ate));
const aviso = M.textoAvisoResumo(h.valido_ate);
const fixo = "São horários de saída publicados pela SOU Transportes. Eles não informam a hora de chegada em cada parada, não incluem feriados e a linha 02 (Arco-Íris/Mãe Preta) ainda não foi cadastrada. Horários válidos até ";
assert.strictEqual(aviso, fixo + dataBr(h.valido_ate) + ".");
assert(aviso.endsWith("04/02/2027.") === (h.valido_ate === "2027-02-04"));
assert.notStrictEqual(M.textoAvisoResumo("2030-01-02"), aviso, "a data não pode ser fixa no código");
assert(!/04\/02\/2027|2027-02-04/.test(app.slice(ini, fim)), "a data de validade não pode estar escrita no código");

/* vocabulário proibido no texto do resumo */
const textoTodo = [aviso].concat(h.linhas.map((l) => l.sentidos.map((s) => M.DIAS.map((d) => M.textoResumoDia(M.resumirDia(s, d))).join(" ")).join(" "))).join(" ");
assert(!/\b(chega|garante|acess[ií]vel)\b/i.test(textoTodo), "palavra proibida no resumo");

/* a interface monta o resumo com textContent (sem innerHTML) e o insere na área Transporte */
const fn = app.slice(app.indexOf("function elementoResumo"), app.indexOf("function htmlSentido"));
assert(fn.includes("textContent") && !/innerHTML/.test(fn), "o resumo não pode usar innerHTML");
assert(/elementoResumo\(dados\.horarios\)/.test(app));

console.log("transporte_resumo.test.js ok (" + comHorario + " resumos conferidos)");
