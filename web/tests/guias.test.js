/* Atalhos "O que você encontra nesta página" (campo guia de web/areas.js).
   Regra de produto: a pessoa escolhe a situação e vai direto ao que precisa, sem sequência de perguntas.
   Em violência, o caminho até os canais de proteção nunca passa por pergunta. Nada de promessa e nada de diagnóstico. */
const assert = require("assert"), fs = require("fs"), path = require("path");
const Areas = require("../areas.js");
const idsDaPagina = new Set([...fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8").matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));

/* 1) Todo atalho de toda área aponta para uma seção que existe naquela área (âncora explícita ou secao-N automática)
      ou para uma ferramenta real da página (por exemplo, a busca por CEP, que tem id em web/index.html). */
Areas.AREAS.filter((a) => a.guia).forEach((a) => {
  const ancoras = new Set(a.secoes.map((s, i) => s.ancora || "secao-" + (i + 1)));
  assert(a.guia.itens.length >= 2, a.id + ": o guia tem pelo menos 2 atalhos");
  a.guia.itens.forEach((it) => {
    assert(it.titulo && it.texto && it.botao, a.id + ": atalho completo (título, texto e botão): " + it.titulo);
    if (it.href) { /* atalho para OUTRA área, por exemplo "#trabalho" */
      assert(/^#[a-z-]+$/.test(it.href) && Areas.porId(it.href.slice(1)), a.id + ": o atalho “" + it.titulo + "” leva a uma área que não existe: " + it.href);
    } else {
      assert(ancoras.has(it.ancora) || idsDaPagina.has(it.ancora), a.id + ": o atalho “" + it.titulo + "” aponta para algo que não existe: #" + it.ancora);
    }
  });
  const t = JSON.stringify(a.guia).replace(/n[ãa]o [^."]{0,40}garant\w*/gi, ""); /* "não garante vaga" e "não inscreve nem garante vaga" são avisos contra a promessa */
  assert(!/você (tem|terá) direito|garant|com certeza|diagnóstic|você está com|você tem (depress|ansiedade|transtorno)/i.test(t), a.id + ": o guia não promete nem diagnostica");
});

/* 2) Direitos: por situação, e violência vem primeiro. */
const dir = Areas.porId("direitos");
assert(dir.guia && dir.guia.itens.length === 4, "Direitos tem 4 atalhos por situação");
assert(/violência|medo/i.test(dir.guia.itens[0].titulo) && dir.guia.itens[0].ancora === "secao-2", "o primeiro atalho de Direitos é violência e leva à seção de proteção");
assert(/Em perigo agora/.test(dir.guia.texto) && /190/.test(dir.guia.texto), "o texto do guia manda ao botão de perigo e ao 190 antes de qualquer escolha");
assert(/180/.test(dir.guia.itens[0].texto), "o atalho de violência traz o 180");
assert(/Delegacia de Defesa da Mulher/.test(dir.guia.itens[0].texto) && /Patrulha Maria da Penha/.test(dir.guia.itens[0].texto), "o atalho de violência nomeia os serviços que existem no catálogo");
const titDir = dir.guia.itens.map((i) => i.titulo).join(" | ");
["pensão", "orientação jurídica", "Aposentadoria e dívidas"].forEach((t) => assert(new RegExp(t, "i").test(titDir), "Direitos: falta o atalho de " + t));
assert(dir.secoes[1].ancora === "secao-2" && /Violência/.test(dir.secoes[1].titulo), "a seção de violência continua sendo a secao-2");

/* 3) Saúde: por necessidade, com o que existe no catálogo. */
const sau = Areas.porId("saude");
const titSau = sau.guia.itens.map((i) => i.titulo).join(" | ");
["atendimento urgente", "posto de saúde", "saúde mental", "remédio", "álcool ou drogas", "Unidades de saúde"].forEach((t) => assert(new RegExp(t, "i").test(titSau), "Saúde: falta o atalho de " + t));
const urg = sau.guia.itens.find((i) => /urgente/.test(i.titulo));
assert(/192/.test(urg.texto) && /SAMU/.test(urg.texto), "urgência: 192 (SAMU)");
const mental = sau.guia.itens.find((i) => /saúde mental/.test(i.titulo));
assert(/188/.test(mental.texto) && /CVV/.test(mental.texto) && /CAPS/.test(mental.texto), "saúde mental: CVV 188 e CAPS");
assert(sau.guia.itens.some((i) => i.ancora === "saude-familia-drogas"), "o atalho de familiar que usa álcool ou drogas continua");
assert(!/Peniel/i.test(JSON.stringify(sau.guia)), "o guia não dá destaque à Comunidade Terapêutica Peniel (informação não confirmada por ligação)");
assert(!/saúde da mulher|mamografia|papanicolau/i.test(JSON.stringify(sau.guia)), "sem atalho de saúde da mulher enquanto não houver fonte no projeto");

/* 4) Já existiam e continuam: Assistência e Moradia. */
assert(Areas.porId("assistencia").guia.itens.some((i) => i.ancora === "assistencia-avo") && Areas.porId("moradia").guia.itens.some((i) => i.ancora === "secao-3"), "Assistência e Moradia mantêm os atalhos da avó e da casa própria");

console.log("guias.test.js: atalhos de Saúde (por necessidade) e Direitos (por situação, violência primeiro) apontam para seções que existem, sem promessa nem diagnóstico");
