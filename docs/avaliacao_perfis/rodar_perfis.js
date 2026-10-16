/* Mede o orientador atual (avaliacao/sistema_v2.js, os mesmos módulos do navegador) com as frases de perfis.json.
   Uso: node docs/avaliacao_perfis/rodar_perfis.js [arquivo.json] [--detalhe]   (padrão: perfis.json; o conjunto reservado é perfis_reserva.json)
   Não altera nada: só lê o site e imprime o resultado. */
const fs = require("fs"), path = require("path");
const web = path.resolve(__dirname, "..", "..", "web");
const catalogo = JSON.parse(fs.readFileSync(path.join(web, "dados", "catalogo_manual.json"), "utf8")).servicos;
const responder = require(path.resolve(__dirname, "..", "..", "avaliacao", "sistema_v2.js"))(web, catalogo);
const arquivo = process.argv.slice(2).find((a) => /\.json$/.test(a)) || "perfis.json";
const frases = JSON.parse(fs.readFileSync(path.join(__dirname, arquivo), "utf8")).frases;
console.log("conjunto: " + arquivo + " (" + frases.length + " frases)\n");
const detalhe = process.argv.includes("--detalhe");
const perfis = {}, linhas = [];
frases.forEach((q) => {
  const r = responder(q.texto), itens = r.itens || [];
  const areas3 = itens.slice(0, 3).map((i) => i.area), areas5 = itens.slice(0, 5).map((i) => i.area);
  const ok = new Set([q.principal].concat(q.aceita || []).filter(Boolean));
  let res;
  if (q.fora) res = { acerto: !!(r.abstem || !itens.length), tipo: "abstencao" };
  else {
    const hit3 = areas3.some((a) => ok.has(a)), top1 = itens.length && itens[0].area === q.principal;
    const cob = (q.precisa || []).length ? (q.precisa.filter((a) => areas5.includes(a)).length / q.precisa.length) : 1;
    res = { acerto: hit3, top1: !!top1, cobertura5: cob, tipo: "area" };
    if (q.perigo) res.perigoOk = !!r.perigo;
    if (!q.perigo && r.perigo) res.falsoAlarme = true;
  }
  const p = perfis[q.perfil] = perfis[q.perfil] || { n: 0, acerto: 0, top1: 0, cob: 0, cobN: 0, abst: 0, falsoAlarme: 0, vazio: 0 };
  p.n++; if (res.acerto) p.acerto++; if (res.top1) p.top1++; if (res.tipo === "area") { p.cob += res.cobertura5; p.cobN++; }
  if (res.falsoAlarme) p.falsoAlarme++; if (!itens.length && !q.fora) p.vazio++;
  linhas.push({ q, r, res, itens });
});
const f = (n, d) => (d ? Math.round((100 * n) / d) + "% (" + n + "/" + d + ")" : "n/d");
console.log("perfil | respondeu certo no top-3 | área certa em 1º | cobertura das necessidades (top-5) | falso alarme de perigo | sem resposta");
Object.keys(perfis).forEach((k) => { const p = perfis[k]; console.log(k + " | " + f(p.acerto, p.n) + " | " + f(p.top1, p.n) + " | " + (p.cobN ? Math.round((100 * p.cob) / p.cobN) + "%" : "n/d") + " | " + p.falsoAlarme + " | " + p.vazio); });
let tot = { n: 0, a: 0 }; Object.values(perfis).forEach((p) => { tot.n += p.n; tot.a += p.acerto; }); console.log("TOTAL: " + f(tot.a, tot.n));
console.log("\n--- falhas e perigo ---");
linhas.forEach((l) => {
  const falhou = !l.res.acerto || l.res.perigoOk === false || l.res.falsoAlarme;
  if (falhou || detalhe) {
    console.log((falhou ? "FALHA " : "ok    ") + l.q.id + " [" + l.q.perfil + "] \"" + l.q.texto + "\"");
    console.log("   esperado: " + (l.q.fora ? "abster" : [l.q.principal].concat(l.q.aceita || []).join("/")) + (l.q.perigo ? " + ALERTA de perigo" : "") + " | perigo=" + (l.r.perigo ? "sim" : "não") + " abstem=" + (l.r.abstem ? "sim" : "não"));
    console.log("   respondeu: " + (l.itens.slice(0, 4).map((i) => i.area + (i.sec ? "/" + i.sec : "") + (i.svc ? "(" + i.svc + ")" : "")).join(", ") || "(nada)"));
  }
});
