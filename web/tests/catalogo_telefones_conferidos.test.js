/* Telefones conferidos em fonte oficial (23/11/2026) e registros que seguem sem telefone: o estado de conferência acompanha o dado.
   Os registros sem telefone ficam vazios e pendentes: sem fonte oficial localizada, nada é preenchido. */
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const web = path.resolve(__dirname, "..");
const cat = JSON.parse(fs.readFileSync(path.join(web, "dados", "catalogo_manual.json"), "utf8")).servicos;
const idx = JSON.parse(fs.readFileSync(path.join(web, "dados", "indice_orientacao.json"), "utf8")).unidades;
const porId = Object.fromEntries(cat.map((s) => [s.id, s]));
const unidade = Object.fromEntries(idx.map((u) => [u.id, u]));

const conferidos = {
  "man-saude-ame": ["(19) 3526-2300", "https://www.saude-rioclaro.org.br/enderecos.htm"],
  "man-saude-bezerra-de-menezes": ["(19) 2112-2100", "https://www.saude-rioclaro.org.br/enderecos.htm"],
  "man-senai-rio-claro": ["(19) 3522-4951 / (19) 98292-0356 (WhatsApp)", "https://sp.senai.br/unidade/rioclaro/horario-de-atendimento"],
  "man-fatec-ia": ["(19) 3522-8703", "https://fatecrioclaro.cps.sp.gov.br/ia/"],
  "man-fatec-esg": ["(19) 3522-8703", "https://fatecrioclaro.cps.sp.gov.br/esg/"],
  "man-senac-rio-claro": ["(19) 2112-3400", "https://www.sp.senac.br/senac-rio-claro"]
};
Object.entries(conferidos).forEach(([id, [tel, url]]) => {
  const s = porId[id];
  assert(s, id + " existe no catálogo publicado");
  assert.strictEqual(s.telefone, tel, id + ": telefone");
  assert.strictEqual(s.fonte_url, url, id + ": fonte");
  assert.strictEqual(s.verificado_em, "2026-11-23", id + ": data da conferência");
  assert(s.conferido === true && s.estado_conferencia === "confirmado", id + ": conferido e confirmado");
  assert.strictEqual(unidade[id].contato.telefone, tel.split(" / ")[0], id + ": o cartão do orientador mostra o primeiro número");
});
assert.strictEqual(porId["man-senai-rio-claro"].horario, "Secretaria: seg a sex 8h às 20h; sáb 8h às 11h");
assert.strictEqual(porId["man-fatec-esg"].horario, "8h às 12h e 13h às 21h");
assert(/não informa os dias/.test(porId["man-fatec-esg"].observacao), "a Fatec não informa os dias da semana: o texto diz isso");
assert(/rodapé do site da Fatec Rio Claro/.test(porId["man-fatec-ia"].observacao) && /também consta na página deste curso/.test(porId["man-fatec-ia"].observacao), "a origem do telefone e do horário da Fatec IA está dita");

const semFonte = [
  "man-saude-hospital-municipal", "man-scfv-jd-brasilia", "man-scfv-apae-adulta", "man-etec-cps",
  "man-sesi-eja", "man-faculdade-sesi", "man-sestsenat-cursos", "man-metamorfose", "man-peja-unesp"
];
semFonte.forEach((id) => {
  const s = porId[id];
  assert(s && !String(s.telefone || "").trim(), id + ": sem fonte oficial localizada, o telefone segue vazio");
  assert(s.conferido === false && s.estado_conferencia === "pendente", id + ": segue pendente");
});
assert.strictEqual(cat.filter((s) => !String(s.telefone || "").trim()).length, semFonte.length, "só estes registros ficam sem telefone");

/* o estado de conferência nunca é 'confirmado' sem fonte, data e algum contato */
cat.filter((s) => s.estado_conferencia === "confirmado").forEach((s) => {
  assert(s.fonte_url && /^\d{4}-\d{2}-\d{2}$/.test(s.verificado_em), s.id + ": confirmado precisa de fonte e data");
  assert(String(s.telefone || "").trim(), s.id + ": confirmado sem telefone");
});
console.log("catalogo_telefones_conferidos: ok");
