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
assert(areas(R("sou aposentada e ajudo a criar meus netos, o dinheiro não dá")).slice(0, 3).includes("assistencia"), "aposentadoria insuficiente para sustentar netos leva à assistência");
assert(areas(R("preciso de trabalho porque a aposentadoria não paga as despesas de todos")).slice(0, 3).includes("trabalho"), "busca explícita de trabalho não deve ser desviada só para aposentadoria");
assert.strictEqual(areas(R("sou vó, crio meus netos e estou sem dinheiro para as despesas"))[0], "assistencia", "necessidade de assistência deve liderar quando a avó relata falta de dinheiro para criar netos");
assert.strictEqual(areas(R("estou sustentando meus netos e a geladeira está vazia"))[0], "assistencia", "falta de comida para netos deve priorizar assistência");
assert.strictEqual(areas(R("estou com os netos, não sobra dinheiro para comida"))[0], "assistencia", "aperto financeiro com netos deve priorizar assistência");
assert(areas(R("minha filha deixou os pequenos aqui em casa e preciso de apoio social")).slice(0, 3).includes("assistencia"), "crianças deixadas com a avó e pedido de apoio social devem mostrar assistência");
assert(areas(R("o INSS recusou meu pedido de aposentadoria e quero recorrer")).slice(0, 3).includes("direitos"), "contestação de aposentadoria negada continua em Direitos");
assert.strictEqual(areas(R("minhas netas moram comigo e falta dinheiro para alimentação"))[0], "assistencia", "variação feminina netas também deve levar à assistência");
assert(areas(R("minha pensão não dá para alimentar as crianças que estão sob meus cuidados")).slice(0, 3).includes("assistencia"), "pensão insuficiente e crianças sob cuidado devem mostrar assistência");
assert.strictEqual(areas(R("minha aposentadoria mal cobre o mercado e o gás para os netinhos"))[0], "assistencia", "despesas de mercado e gás para netos priorizam assistência");
const familiaSemSilencio = R("sou responsável pelos pequenos e falta dinheiro para pagar as contas");
assert(!familiaSemSilencio.abstem && areas(familiaSemSilencio).includes("assistencia"), "necessidade familiar explícita não deve ser descartada como fora do escopo");
const responsabilidade = R("assumi a responsabilidade pelos pequenos e não consigo pagar as contas");
assert(!responsabilidade.abstem && areas(responsabilidade).includes("assistencia"), "variação da palavra responsabilidade deve manter a orientação social");
const necessidadesCriancas = R("a pensão não dá para as necessidades dos pequenos sob meus cuidados");
assert(!necessidadesCriancas.abstem && areas(necessidadesCriancas).includes("assistencia"), "necessidades das crianças sob cuidado devem levar à assistência");
const rendaInsuficiente = R("estou cuidando das crianças e a renda não alcança para as necessidades delas");
assert(!rendaInsuficiente.abstem && areas(rendaInsuficiente).includes("assistencia"), "renda insuficiente e cuidado infantil devem levar à assistência");
const pequenosDependem = R("os pequenos dependem de mim e preciso de apoio no CRAS");
assert(!pequenosDependem.abstem && areas(pequenosDependem).includes("assistencia"), "dependência das crianças e pedido de apoio não devem ser descartados");
const semRecursos = R("estou cuidando das crianças e não tenho recursos para as despesas básicas");
assert(!semRecursos.abstem && areas(semRecursos).includes("assistencia"), "falta de recursos em contexto de cuidado deve levar à assistência");

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
/* ---- uso financeiro explicitamente não autorizado: Direitos + Assistência, sem ativar camada de perigo ---- */
const usoCartaoSemPermissao = R("meu sobrinho ficou com meu cartão e fez um saque sem autorização");
assert(!usoCartaoSemPermissao.abstem, "uso financeiro explicitamente sem autorização não deve ser descartado como fora do escopo");
assert(areas(usoCartaoSemPermissao).slice(0, 3).includes("assistencia"), "uso financeiro sem autorização deve mostrar Assistência, onde estão CREAS e Disque 100");
assert(!areas(usoCartaoSemPermissao).slice(0, 3).some((a) => ["educacao", "trabalho"].includes(a)), "uso financeiro sem autorização não deve ser desviado para educação ou trabalho");
assert(!usoCartaoSemPermissao.perigo, "uso financeiro sem autorização, por si só, não deve ativar a camada de perigo");
const saqueAutorizado = R("minha filha retira meu benefício com minha autorização");
assert(!saqueAutorizado.perigo, "uso autorizado não deve ser classificado como perigo");
assert(R("como desbloquear meu cartão no aplicativo do banco").abstem, "dúvida bancária comum continua fora do escopo");
console.log("orientar.test.js ok");

/* ---- Reforços de Trabalho: cartões que já existem na tela e que o orientador SOMA à resposta, sem tirar nada ---- */
const ids = (r) => r.itens.map((i) => i.id);
const REFORCOS_IDS = ["ferr-central-justica", "ferr-entrevista-aparencia", "ferr-dinheiro-semana", "ferr-quanto-sobra"];
const ehReforco = (i) => REFORCOS_IDS.indexOf(i) >= 0;
assert.strictEqual(R("com que roupa eu vou na entrevista").itens[0].id, "ferr-entrevista-aparencia", "roupa para entrevista: o cartão de aparência vem em 1º");
assert.strictEqual(R("nao tenho dinheiro para arrumar o cabelo para a entrevista").itens[0].id, "ferr-entrevista-aparencia", "cabelo para entrevista leva ao cartão");
assert.strictEqual(R("como me vestir para procurar emprego").itens[0].id, "ferr-entrevista-aparencia", "vestir para procurar emprego leva ao cartão");
assert.strictEqual(R("preciso de dinheiro essa semana").itens[0].id, "ferr-dinheiro-semana", "dinheiro esta semana leva ao bloco de renda rápida");
assert.strictEqual(R("quanto vou ganhar de verdade com um bico depois de pagar passagem").itens[0].id, "ferr-quanto-sobra", "conta do bico leva ao bloco de saldo");
assert.strictEqual(R("como acho ajuda jurídica gratuita").itens[0].id, "ferr-central-justica", "pedido direto de ajuda jurídica gratuita leva à central" );
assert(ids(R("onde denuncio assédio moral no trabalho")).slice(0, 4).includes("ferr-central-justica"), "assédio no trabalho encontra a seção com os caminhos do MPT e assistência jurídica");
assert.strictEqual(R("não pagaram meu salário").itens[0].id, "ferr-central-justica", "salário não pago leva à rota trabalhista e jurídica" );
const violenciaComPedidoJuridico = R("meu marido me bate e preciso de advogada");
assert(violenciaComPedidoJuridico.itens[0].fixado && violenciaComPedidoJuridico.itens[0].area === "direitos", "pedido jurídico não passa à frente da rota fixada de violência");
["ferr-entrevista-aparencia", "ferr-dinheiro-semana", "ferr-quanto-sobra"].forEach((id) => {
  const u = (indice.reforcos || []).filter((x) => x.id === id)[0];
  assert(u && /^#trabalho\/[\w-]+$/.test(u.href) && u.area === "trabalho", "o reforço existe no índice e aponta para um bloco de Trabalho: " + id);
});
assert(!(indice.unidades || []).some((u) => ehReforco(u.id)), "os reforços ficam FORA das unidades do índice (não treinam o LSA nem mudam a nota de ninguém)");

/* Não contaminam perguntas sem relação nem as de violência (palavras como "roupa", "cabelo" e "dinheiro" já causaram isso). */
["como emagrecer rapido", "quanto e 15 vezes 12", "quanto custa uma passagem pra sao paulo", "me ajuda com meu trabalho de matematica",
 "ele rasgou minhas roupas e disse que eu nao valho nada", "vi uma crianca sendo arrastada pelo cabelo na rua pela mae",
 "levei um soco na boca e sai de casa so com a roupa do corpo", "ele puxou meu cabelo e me jogou no chao",
 "meu marido pegou o dinheiro todo e nao me deixa trabalhar",
 "ele me bateu e eu preciso de dinheiro hoje para sair de casa"].forEach((t) =>
  assert(!ids(R(t)).some(ehReforco), "sem reforço de Trabalho em: " + t));

/* Somam sem tirar: tirando os reforços, a lista é a mesma que o orientador daria sem eles. */
const motorSem = Orientar.criar(Object.assign({}, indice, { reforcos: [] }), { dica: UI.criarDica(IA, Regras), escopo: (t) => escopo.probabilidades(t).no_escopo, limiarEscopo: escopo.limiares.no_escopo });
["como me preparar pra uma entrevista de emprego", "to morrendo de ansiedade pra entrevista de emprego", "preciso de uma renda extra urgente",
 "com que roupa eu vou na entrevista", "como me vestir para procurar emprego", "preciso de um emprego e de um curriculo",
 "sou avo, crio meus netos e preciso de trabalho", "meu filho esta muito agressivo e triste"].forEach((t) => {
  const com = ids(R(t)).filter((i) => !ehReforco(i)), sem = ids(motorSem.responder(t));
  assert.deepStrictEqual(com, sem.slice(0, com.length), "a ordem do que já aparecia não muda: " + t);
  assert(com.length >= Math.min(6, sem.length), "nenhum item antigo some: " + t);
});
/* Pergunta geral sobre entrevista: os 3 primeiros ficam como estavam e o cartão vem logo depois. */
assert.strictEqual(R("como me preparar pra uma entrevista de emprego").itens[3].id, "ferr-entrevista-aparencia", "entrevista em geral: o cartão vem depois dos 3 primeiros");

/* Avó que cria netos e procura trabalho: Trabalho entra na resposta sem tirar Assistência (CRAS e Cadastro Único). */
["sou vovo e crio duas criancas, procuro emprego", "criei meus netos e agora preciso voltar a trabalhar", "sou avo, crio meus netos e preciso de trabalho"].forEach((t) => {
  const a = areas(R(t));
  assert(a.indexOf("trabalho") >= 0, "avó que procura trabalho vê Trabalho: " + t);
});
assert(areas(R("sou avo, crio meus netos e preciso de trabalho")).indexOf("assistencia") >= 0, "e continua vendo Assistência");
/* Quem diz que não consegue manter/sustentar as crianças: Assistência, não silêncio. */
["nao estou dando conta de sustentar as criancas", "sozinha para manter meus filhos pequenos"].forEach((t) =>
  assert(areas(R(t)).indexOf("assistencia") >= 0, "não consigo manter as crianças leva à Assistência: " + t));
