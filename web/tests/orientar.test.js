const assert = require("assert");
const fs = require("fs");
const path = require("path");
const web = path.resolve(__dirname, "..");
const Orientar = require("../orientar.js");
const UI = require("../orientacao-ui.js");
const IA = require("../ia.js");
const Regras = require("../necessidades.js");
IA.usarModelo(JSON.parse(fs.readFileSync(path.join(web, "dados", "modelo_necessidades.json"), "utf8")));
const indice = JSON.parse(fs.readFileSync(path.join(web, "dados", "indice_orientacao.json"), "utf8"));
const escopo = IA.criarClassificador(JSON.parse(fs.readFileSync(path.join(web, "dados", "modelo_escopo.json"), "utf8")));
const motor = Orientar.criar(indice, { dica: UI.criarDica(IA, Regras), escopo: (t) => escopo.probabilidades(t).no_escopo, limiarEscopo: escopo.limiares.no_escopo });
const R = (t, ctx) => motor.responder(t, ctx);
const areas = (r) => r.itens.map((i) => i.area);
const svcs = (r) => r.itens.map((i) => i.svc);

/* ---- encontra o serviço certo, com erros de digitação e jeito de falar de quem escreve ---- */
assert(svcs(R("preciso de vaga na creche pro meu filho de 2 anos")).slice(0, 3).some((s) => /creche|educacao/.test(String(s))) || areas(R("preciso de vaga na creche pro meu filho de 2 anos")).slice(0, 3).includes("educacao"));
assert(areas(R("quero terminar o ensino medio")).slice(0, 3).includes("educacao"));
assert(areas(R("preciso de um emprego urgente")).slice(0, 3).includes("trabalho"));
assert(areas(R("presiso de advogdo de graça")).slice(0, 3).includes("direitos"), "tolera erro de digitação");
assert(areas(R("upa mais proxima")).slice(0, 3).includes("saude"));
const casaPropria = R("quero me inscrever pra casa própria");
assert(areas(casaPropria).slice(0, 3).includes("moradia"), "casa própria leva à área de moradia");
assert(casaPropria.itens.every((i) => !i.palavras.some((p) => ["moradia", "habitacao", "aluguel"].includes(p))), "a explicação usa palavras originais, não termos artificiais da expansão");
assert(areas(R("moro na rua e preciso de ajuda")).slice(0, 3).some((a) => ["moradia", "assistencia"].includes(a)), "situação de rua leva a um caminho de moradia ou assistência");
assert(areas(R("a vacina do meu filho está atrasada")).slice(0, 3).includes("saude"), "vacinação infantil leva à saúde");
assert(areas(R("não tenho com quem deixar meu bebê para trabalhar")).slice(0, 3).includes("educacao"), "falta de rede de cuidado leva à educação infantil");

/* ---- segurança: perigo vem junto da resposta, com os serviços de proteção fixados no topo ---- */
const v = R("meu marido me bate e eu tenho medo");
assert(v.perigo && v.perigo.nivel === 2 && v.perigo.telefones.includes("180"));
assert(v.itens.length >= 2 && v.itens[0].fixado, "serviços de proteção fixados");
assert(v.itens.some((i) => /mulher/.test(String(i.svc))), "traz serviço da rede de proteção à mulher");
const s = R("quero me matar");
assert(s.perigo && s.perigo.telefones.includes("188") && s.itens.some((i) => i.id === "man-saude-caps-iii"));

/* ---- nunca ficar mudo: pedido genérico mostra as portas; saudação convida a escrever; fora de escopo diz que não achou ---- */
const g = R("ola, preciso de ajuda");
assert(g.geral && g.itens.length >= 5 && g.itens.every((i) => i.tipo === "area"));
assert(R("oi").saudacao);
["como investir em bitcoin", "vendo moto barata", "kkkkkkk", "preciso da senha do wifi"].forEach((t) => {
  const r = R(t);
  assert(r.abstem && !r.itens.length && !r.perigo, `"${t}" deveria ser reconhecido como fora do escopo`);
  assert(/Não consegui ligar/.test(UI.html(r, {}, [{ id: "saude", nome: "Saúde" }])), "e a tela oferece o caminho das áreas");
});
assert(R("").abstem);
/* detector de escopo: frases fora do assunto se abstêm; frases do assunto, mesmo curtas, continuam respondidas */
["qual o preco do dolar hoje", "onde conserto geladeira", "como fazer bolo de chocolate"].forEach((t) => assert(R(t).abstem, `"${t}" é fora do assunto`));
["quero fazer preventivo", "ubs no jardim brasilia", "preciso de advogado de graça", "bolsa familia como faz"].forEach((t) => assert(!R(t).abstem && R(t).itens.length, `"${t}" é do assunto e precisa de resposta`));

/* ---- serviço especializado só quando o assunto é dele ---- */
assert(!R("estou com dor de dente forte").itens.some((i) => /Ginecologia/.test(i.titulo)), "dor de dente não leva ao pronto atendimento de ginecologia");
assert(R("estou gravida e com sangramento forte").itens.some((i) => /Ginecologia/.test(i.titulo)), "gestante com sangramento leva ao pronto atendimento de ginecologia");

/* ---- contexto de área: itens da área aberta ganham prioridade ---- */
const c = R("quero fazer um curso", { area: "trabalho" });
assert.strictEqual(c.itens[0].area, "trabalho");

/* ---- todo item tem título, destino e, quando é serviço, telefone ou fonte; nada de promessa ---- */
["preciso de remedio", "quero fazer preventivo", "meu filho esta agressivo"].forEach((t) => R(t).itens.forEach((i) => {
  assert(i.titulo && i.href && i.href.charAt(0) === "#", t + ": " + JSON.stringify(i));
  /* Frases que NEGAM a garantia ("Não existe vaga garantida só por estar cadastrada...") são o contrário de promessa e não contam. */
  const semNegacao = String(i.resumo).split(/(?<=[.!?])\s+/).filter((f) => !/\bn[ãa]o (?:existe|h[áa]|significa|garante)\b/i.test(f)).join(" ");
  assert(!/garant|voc[eê] tem direito a vaga|conseguir[aá]|aprovad/i.test(semNegacao), "sem promessa: " + i.resumo);
}));

/* ---- explicação: mostra por que o item apareceu, com palavras que a pessoa escreveu ---- */
const e = R("preciso de vaga na creche");
assert(e.itens[0].palavras.length > 0 && e.itens[0].palavras.every((p) => /creche|vaga/.test(p)));

/* ---- determinismo e privacidade: mesma entrada, mesma saída; nenhum acesso à rede ---- */
assert.strictEqual(JSON.stringify(R("quero fazer preventivo")), JSON.stringify(R("quero fazer preventivo")));
["orientar.js", "perigo.js", "orientacao-ui.js"].forEach((f) => {
  const src = fs.readFileSync(path.join(web, f), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  assert(!/XMLHttpRequest|sendBeacon|WebSocket|localStorage|sessionStorage|document\.cookie/.test(src), f + " não pode guardar nem enviar o texto");
});
const srcUI = fs.readFileSync(path.join(web, "orientacao-ui.js"), "utf8");
assert(!/fetch\(/.test(srcUI), "orientacao-ui.js só busca o índice pela função recebida");

/* ---- a tela escapa HTML do conteúdo ---- */
assert(!/<script/.test(UI.html({ perigo: null, saudacao: false, geral: false, abstem: false, melhor: 0, itens: [{ rank: 1, id: "x", tipo: "servico", area: "saude", sec: "s", svc: "a/b", titulo: "<script>x</script>", resumo: "", href: "#saude/s", contato: null, fonte: null, palavras: [] }] }, {}, [])));
console.log("orientar.test.js ok");
