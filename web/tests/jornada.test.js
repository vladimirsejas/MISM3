const assert = require("assert");
const fs = require("fs");
const path = require("path");

const web = path.resolve(__dirname, "..");
const J = require("../jornada.js");
const Areas = require("../areas.js");
const catalogo = JSON.parse(fs.readFileSync(path.join(web, "dados", "catalogo_manual.json"), "utf8"));
const servicos = Array.isArray(catalogo) ? catalogo : catalogo.servicos;
const achar = (id) => servicos.find((s) => s.id === id) || null;

const ids = (p) => p.passos.map((s) => s.id);

/* ---- só respostas previstas são aceitas ---- */
assert.deepStrictEqual(J.limpar({ filhos: "talvez", curriculo: "sim", x: 1 }), { curriculo: "sim" });
assert.deepStrictEqual(J.limpar({ filhos: "nao", cuidado: "nao" }), { filhos: "nao" }, "cuidado só vale quando há crianças");
assert.deepStrictEqual(J.limpar(null), {});

/* ---- perguntas uma de cada vez: começam pelo objetivo e só aparecem quando fazem diferença ---- */
assert.strictEqual(J.proxima({}).pergunta.id, "objetivo", "a primeira pergunta é o que ela quer");
assert.strictEqual(J.proxima({ objetivo: "emprego" }).pergunta.id, "renda_agora");
assert.strictEqual(J.proxima({ objetivo: "emprego", renda_agora: "nao" }).pergunta.id, "filhos");
assert.strictEqual(J.proxima({ objetivo: "emprego", renda_agora: "nao", filhos: "sim" }).pergunta.id, "cuidado", "só pergunta do cuidado se há crianças");
assert.strictEqual(J.proxima({ objetivo: "emprego", renda_agora: "nao", filhos: "nao" }).pergunta.id, "deslocamento", "sem crianças, pula o cuidado");
const aplic = (r) => J.aplicaveis(r).map((p) => p.id);
assert.deepStrictEqual(aplic({ objetivo: "negocio" }), ["objetivo", "renda_agora", "filhos"], "quem quer renda própria não é perguntada sobre ônibus, ensino médio e currículo");
assert.strictEqual(J.proxima({ objetivo: "negocio", renda_agora: "sim", filhos: "nao" }), null, "acabou: vai para o plano");
assert.strictEqual(J.proxima({}, ["objetivo"]).pergunta.id, "renda_agora", "perguntas puladas não voltam");
assert(J.aplicaveis({ objetivo: "emprego", filhos: "sim" }).length <= J.PERGUNTAS.length);
assert(J.PERGUNTAS.length <= 7, "o questionário é curto");

/* ---- o caso central: desempregada, crianças, sem creche, sem dinheiro, sem transporte, sem currículo ---- */
const caso = J.montarPlano({ filhos: "sim", cuidado: "nao", renda_agora: "sim", deslocamento: "sim", curriculo: "nao", objetivo: "emprego", ensino_medio: "sim" }, achar);
assert.deepStrictEqual(ids(caso), ["renda", "cuidado", "curriculo", "vagas", "deslocamento", "formacao"],
  "o dinheiro do básico e o cuidado das crianças vêm antes de procurar vaga");
assert.deepStrictEqual(caso.passos.map((p) => p.numero), [1, 2, 3, 4, 5, 6]);
assert.strictEqual(caso.primeiros, 3, "só os 3 primeiros passos aparecem de cara");
assert.strictEqual(caso.passos[0].acao.alvo, "#assistencia", "o primeiro passo leva ao CRAS no próprio site");
assert.strictEqual(caso.passos[1].acao.alvo, "#educacao/educacao-filhos");
assert.strictEqual(caso.passos.find((p) => p.id === "deslocamento").acao.alvo, "#transporte", "o ônibus leva aos horários do próprio site");

/* ---- telefones vêm do catálogo verificado; sem catálogo, não aparece telefone (nunca se inventa) ---- */
assert.strictEqual(caso.passos[0].contato.telefone, "(19) 3522-1930");
assert.strictEqual(caso.passos.find((p) => p.id === "vagas").contato.telefone, "(19) 3525-2785");
const semCatalogo = J.montarPlano({ renda_agora: "sim", objetivo: "emprego" });
semCatalogo.passos.forEach((p) => assert.strictEqual(p.contato, null, "sem catálogo, sem telefone: " + p.id));
const texto = JSON.stringify(caso.passos);
const fones = (texto.match(/\(\d{2}\) \d{4,5}-\d{4}/g) || []);
fones.forEach((f) => assert(servicos.some((s) => String(s.telefone || "").includes(f)), "telefone fora do catálogo: " + f));
assert(!/3522-1930/.test(fs.readFileSync(path.join(web, "jornada.js"), "utf8")), "nenhum telefone escrito à mão no código do plano");

/* ---- sem obstáculos, o plano é curto ---- */
const livre = J.montarPlano({ filhos: "nao", renda_agora: "nao", deslocamento: "nao", curriculo: "sim", objetivo: "emprego", ensino_medio: "sim" }, achar);
assert.deepStrictEqual(ids(livre), ["vagas", "formacao"]);
const comCuidado = J.montarPlano({ filhos: "sim", cuidado: "sim", renda_agora: "nao", curriculo: "sim", objetivo: "emprego" }, achar);
assert(!ids(comCuidado).includes("cuidado"), "quem já tem com quem deixar as crianças não recebe esse passo");
const asVezes = J.montarPlano({ filhos: "sim", cuidado: "as_vezes", objetivo: "emprego", curriculo: "sim" }, achar);
assert.strictEqual(ids(asVezes)[0], "cuidado", "cuidado só às vezes também merece atenção");

/* ---- ensino médio: leva à EJA do SESI ---- */
const eja = J.montarPlano({ filhos: "sim", cuidado: "nao", ensino_medio: "nao", curriculo: "nao", objetivo: "emprego" }, achar);
assert.deepStrictEqual(ids(eja), ["cuidado", "curriculo", "vagas", "estudos", "formacao"]);
assert.strictEqual(eja.passos.find((p) => p.id === "estudos").contato.nome, "SESI Rio Claro");
assert(!ids(J.montarPlano({ ensino_medio: "sim", objetivo: "emprego", curriculo: "sim" }, achar)).includes("estudos"), "quem terminou o ensino médio não recebe o passo");
assert(!ids(J.montarPlano({ objetivo: "emprego", curriculo: "sim" }, achar)).includes("estudos"), "sem resposta, não presume");

/* ---- objetivos ---- */
const curso = J.montarPlano({ objetivo: "curso", curriculo: "sim" }, achar);
assert.deepStrictEqual(ids(curso), ["curso"]);
assert.strictEqual(curso.passos[0].acao.alvo, "#educacao/educacao-voce", "o curso leva à lista de cursos do próprio site, sem despejar links");
const negocio = J.montarPlano({ objetivo: "negocio", curriculo: "nao", deslocamento: "sim" }, achar);
assert.deepStrictEqual(ids(negocio), ["negocio"], "quem quer renda própria não recebe vagas, currículo nem ônibus");
assert.strictEqual(negocio.passos[0].contato.telefone, "(19) 3522-1954");
const naoSei = J.montarPlano({ objetivo: "nao_sei", curriculo: "nao" }, achar);
assert.deepStrictEqual(ids(naoSei), ["curriculo", "vagas", "opcoes"]);
assert.deepStrictEqual(ids(J.montarPlano({}, achar)), ["vagas"], "sem respostas: só o caminho de vagas");

/* ---- todo passo explica, tem UMA ação clara e alternativa; o plano visível é curto ---- */
const planos = [caso, livre, curso, negocio, naoSei, eja];
planos.forEach((pl) => pl.passos.forEach((p) => {
  assert(p.titulo && p.porque && p.alternativa, "passo incompleto: " + p.id);
  assert(p.acao && p.acao.rotulo && ["interno", "externo", "curriculo"].includes(p.acao.tipo), "passo sem ação clara: " + p.id);
  assert(p.titulo.length <= 70, "título longo demais: " + p.titulo);
  assert(p.porque.length <= 260, "explicação longa demais em " + p.id);
}));
const palavrasVisiveis = (pl) => pl.passos.slice(0, pl.primeiros).map((p) => [p.titulo, p.porque].join(" ")).join(" ").split(/\s+/).length;
assert(palavrasVisiveis(caso) <= 130, "o que aparece de cara é curto: " + palavrasVisiveis(caso) + " palavras");

/* ---- links: externos vêm de fonte cadastrada; internos apontam para áreas ou seções que existem ---- */
const permitidos = new Set(servicos.map((s) => s.fonte_url));
Areas.AREAS.forEach((a) => a.secoes.forEach((s) => (s.links || []).forEach((l) => permitidos.add(l[1]))));
Object.keys(J.LINKS).forEach((k) => {
  const url = J.LINKS[k][1];
  assert(permitidos.has(url), "link do plano sem fonte cadastrada no projeto: " + k + " " + url);
});
const rotas = new Set(Areas.AREAS.concat(Areas.EXTRAS || []).map((a) => a.id));
rotas.add("mapa"); /* #mapa e #mapa/cras: o mapa mora na tela inicial */
const secoesDe = {};
Areas.AREAS.concat(Areas.EXTRAS || []).forEach((a) => {
  secoesDe[a.id] = new Set(((a.guia && a.guia.ancoras) || []).map((x) => x.ancora).concat((a.secoes || []).map((s) => s.id).filter(Boolean)));
});
planos.forEach((pl) => pl.passos.forEach((p) => {
  const todos = [p.acao].concat(p.extras.map((l) => ({ tipo: "externo", alvo: l[1] })));
  todos.forEach((a) => {
    if (a.tipo === "interno") {
      const m = /^#([a-z-]+)(?:\/([\w-]+))?$/.exec(a.alvo);
      assert(m && rotas.has(m[1]), "link interno para área inexistente: " + a.alvo);
    } else if (a.tipo === "externo") {
      assert(/^https:\/\//.test(a.alvo), "link externo precisa ser https: " + a.alvo);
      assert(permitidos.has(a.alvo), "link externo sem fonte cadastrada: " + a.alvo);
    }
  });
}));

/* ---- nunca promete direito, vaga, crédito nem decide elegibilidade ---- */
const proibido = /você (tem|terá) direito|vaga garantida|crédito aprovado|garantimos|você está apta|você não é elegível/i;
planos.forEach((pl) => {
  assert(!proibido.test(JSON.stringify(pl.passos)), "texto promete o que o site não pode prometer");
  assert(/não diz se você tem direito/.test(pl.avisos[0]), "o plano deve avisar que não decide elegibilidade");
  assert(/Em perigo agora/.test(pl.avisos[1]), "o plano deve lembrar o caminho de proteção");
});
assert(!/ainda não traz horários/.test(JSON.stringify(caso)), "texto desatualizado sobre ônibus");

/* ---- apoio a quem tem familiar com uso de álcool ou drogas: lembrete fixo, sem perguntar nada ---- */
planos.forEach((pl) => assert.strictEqual(pl.apoio.alvo, "#saude/saude-familia-drogas"));
const secSaude = Areas.porId("saude").secoes.find((x) => x.ancora === "saude-familia-drogas");
assert(secSaude, "a área Saúde precisa ter a seção apontada pelo plano");

/* ---- perguntas: nenhuma pede dado sensível ---- */
J.PERGUNTAS.forEach((p) => assert(!/violên|CPF|renda mensal|salário|nome/i.test(p.texto), "pergunta sensível demais: " + p.texto));

/* ---- currículo ---- */
const cv = J.montarCurriculo({ nome: "  Maria  Souza ", telefone: "(19) 99439-4433", objetivo: "Auxiliar de cozinha",
  experiencias: "Cozinha do bar\n\n  Limpeza de casas  ", formacao: "", habilidades: "Atendimento\nCostura", disponibilidade: "Manhãs" });
assert.strictEqual(cv.nome, "Maria Souza");
assert.deepStrictEqual(cv.secoes.map((s) => s.titulo), ["Objetivo", "Experiências", "Habilidades", "Disponibilidade"], "seções vazias não aparecem");
assert.deepStrictEqual(cv.secoes[1].itens, ["Cozinha do bar", "Limpeza de casas"]);
assert.strictEqual(J.montarCurriculo({}).vazio, true);
assert.strictEqual(J.montarCurriculo({ experiencias: "x\n".repeat(40) }).secoes[0].itens.length, 12, "limita o número de linhas");
const secaoCv = UI.html(true);
assert(/id="montar-curriculo"/.test(secaoCv), "o formulário do currículo continua na jornada Trabalho");
assert(/word\.cloud\.microsoft\.com/.test(secaoCv), "inclui modelos de currículo do Word");
assert(/docs\.google\.com/.test(secaoCv), "inclui Google Docs");
assert(/servicos\.mte\.gov\.br/.test(secaoCv), "inclui Emprega Brasil/SINE");
assert(/vagas\.com\.br/.test(secaoCv), "inclui Vagas.com.br");
assert(/br\.indeed\.com/.test(secaoCv), "inclui Indeed Brasil");
assert(/infojobs\.com\.br/.test(secaoCv), "inclui Infojobs");
assert(/portal\.gupy\.io/.test(secaoCv), "inclui Gupy");
assert(/br\.linkedin\.com\/jobs/.test(secaoCv), "inclui vagas do LinkedIn");
assert(/trabalhabrasil\.com\.br/.test(secaoCv), "inclui Trabalha Brasil");
assert(!/livecareer|canva\.com/i.test(secaoCv), "não inclui plataformas de currículo com recursos pagos");
assert(/Preciso de dinheiro esta semana/.test(secaoCv), "prioriza renda urgente");
assert(/O que posso fazer hoje/.test(secaoCv), "tem checklist simples para hoje");
assert(/Nunca trabalhei/.test(secaoCv), "explica currículo sem experiência");
assert(/Onde procurar trabalho sem experiência/.test(secaoCv), "sugere locais para procurar vaga presencial");
assert(/Serviços públicos e cursos gratuitos/.test(secaoCv), "reúne serviços públicos e cursos");
assert(/Antes da entrevista/.test(secaoCv), "prepara para entrevista em linguagem simples");
assert(/Peça ajuda à sua rede/.test(secaoCv), "inclui mensagem para rede de apoio");
assert(/Cuidado com golpes de emprego/.test(secaoCv), "inclui prevenção de golpes");
assert(/Se o desânimo apertar/.test(secaoCv), "inclui apoio emocional e CVV");
assert(/data-copiar="rede"/.test(secaoCv) && /data-copiar="modelo"/.test(secaoCv), "oferece botões para copiar mensagens e modelo");
assert(/não há pagamento garantido/.test(secaoCv), "não promete renda garantida");

assert.deepStrictEqual(J.dadosDesnecessarios({ a: "123.456.789-09" }), ["parece haver um CPF"]);
assert.deepStrictEqual(J.dadosDesnecessarios({ a: "13500-190" }), ["parece haver um CEP"]);
assert.deepStrictEqual(J.dadosDesnecessarios({ a: "(19) 99439-4433 e (19) 3522-1930" }), [], "telefone não é dado desnecessário");

/* ---- a tela escapa o que a pessoa digita ---- */
global.self = { Jornada: J };
require("../jornada-ui.js");
const UI = global.self.JornadaUI;
const html = UI.htmlCurriculo(J.montarCurriculo({ nome: "<img src=x onerror=alert(1)>", experiencias: "<script>alert(1)</script>" }));
assert(!/<img|<script/.test(html), "texto digitado deve ser escapado");
assert(/&lt;img/.test(html));
const tela = UI.htmlPlano(caso);
assert(/Ver apoio na área Saúde/.test(tela) && /href="#saude\/saude-familia-drogas"/.test(tela), "o plano mostra o lembrete com link para a seção de Saúde");
assert(/Ver apoio na área Saúde/.test(UI.htmlPlano(caso, true)) && !/<a /.test(UI.htmlPlano(caso, true)), "a versão impressa nomeia a área, sem link");
assert(!/target="_blank"[^>]*href="#/.test(tela), "links internos não abrem em outra aba");
assert(/rel="noopener noreferrer"/.test(UI.htmlPlano(J.montarPlano({ objetivo: "emprego", curriculo: "sim" }, achar))), "links externos com noopener");
assert(/<details class="resto">/.test(tela) && /Ver mais 3 passos/.test(tela), "passos além dos 3 primeiros ficam dobrados");
assert(/href="tel:\+5519/.test(tela), "o telefone é um link para ligar");
const papel = UI.htmlPlano(J.montarPlano({ objetivo: "emprego", curriculo: "sim" }, achar), true);
assert(!/<a /.test(papel) && /https:\/\/vagas\.rioclaro\.sp\.gov\.br/.test(papel), "na versão impressa o endereço aparece como texto");
assert(!/Ver mais/.test(UI.htmlPlano(caso, true)), "a versão impressa mostra todos os passos");

/* ---- Lei 14.542/2023: prioridade do Sine, sem prometer vaga e com a fonte oficial ---- */
const passoVagas = planos.flatMap((pl) => pl.passos).find((p) => p.id === "vagas");
assert(passoVagas, "o plano de quem procura vaga deve ter o passo de vagas");
assert(passoVagas.pergunte.some((t) => /14\.542/.test(t) && /PAT/.test(t)), "a prioridade do Sine deve aparecer, mandando perguntar no PAT");
assert(passoVagas.extras.some((l) => /camara\.leg\.br\/legin\/fed\/lei\/2023\/lei-14542/.test(l[1])), "link da lei na fonte oficial");

const interfaceTrabalho = UI.html();
assert(/mepoupe\\.com\\/dicas-de-riqueza\\/procurando-emprego-como-se-vestir-sem-gastar-a-grana-que-voce-nao-tem/.test(interfaceTrabalho), "área Trabalho inclui a leitura da Me Poupe sobre roupa sem gastar");
assert(/ciadeestagios\\.com\\.br\\/guia-profissional\\/como-se-vestir/.test(interfaceTrabalho), "área Trabalho inclui o guia da Cia de Estágios");
assert(/não precisa comprar roupa, sapato ou maquiagem/.test(interfaceTrabalho), "orientação de entrevista não exige gasto com roupa");
console.log("jornada.test.js: perguntas, ordem e tamanho do plano, telefones do catálogo, links, promessas proibidas e currículo passaram");

/* Pulou a pergunta do cuidado: o passo continua (ela tem filhos), mas sem afirmar que ela não tem com quem deixá-los. */
const pulou = J.montarPlano({ filhos: "sim", renda_agora: "nao", curriculo: "sim", objetivo: "emprego" }, achar).passos.find((p) => p.id === "cuidado");
assert(pulou, "com filhos e sem resposta sobre o cuidado, o passo da creche continua disponível");
assert(!/Sem alguém|Peça vaga/.test(pulou.titulo + pulou.porque), "sem resposta, o texto não afirma que ela não tem com quem deixar as crianças");
assert(/não respondeu|possibilidade/.test(pulou.porque), "o texto avisa que é só uma possibilidade");
const disse = J.montarPlano({ filhos: "sim", cuidado: "nao", renda_agora: "nao", curriculo: "sim", objetivo: "emprego" }, achar).passos.find((p) => p.id === "cuidado");
assert(/Sem alguém com quem deixar as crianças/.test(disse.porque), "quem respondeu 'não' continua recebendo o texto direto");
console.log("jornada: cuidado pulado ok");
