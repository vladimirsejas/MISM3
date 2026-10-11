const assert = require("assert");
const fs = require("fs");
const path = require("path");

const web = path.resolve(__dirname, "..");
const J = require("../jornada.js");
const E = require("../jornada-educacao.js");
const Areas = require("../areas.js");
const catalogo = JSON.parse(fs.readFileSync(path.join(web, "dados", "catalogo_manual.json"), "utf8"));
const servicos = Array.isArray(catalogo) ? catalogo : catalogo.servicos;
const achar = (id) => servicos.find((s) => s.id === id) || null;
const eng = J.de("educacao");
const ids = (p) => p.passos.map((s) => s.id);

/* ---- 1. A jornada está registrada, a de Trabalho continua igual e a área Educação a abre ---- */
assert(eng && eng.id === "educacao" && eng.PERGUNTAS[0].id === "para_quem", "a primeira pergunta é para quem é");
assert(J.de("trabalho") && J.de("trabalho").temCurriculo && !eng.temCurriculo, "só o Trabalho tem montador de currículo");
assert.strictEqual(J.de("inexistente"), null);
assert.strictEqual(Areas.AREAS.find((a) => a.id === "educacao").jornada, "educacao", "a área Educação abre a jornada de Educação");
assert.strictEqual(Areas.AREAS.find((a) => a.id === "trabalho").jornada, true, "a área Trabalho continua com a dela");

/* ---- 2. Perguntas: só as que fazem diferença, na ordem; trocar a resposta apaga o que não vale mais ---- */
assert.deepStrictEqual(eng.aplicaveis({}).map((p) => p.id), ["para_quem"], "sem saber para quem é, só a primeira pergunta");
assert.deepStrictEqual(eng.aplicaveis({ para_quem: "filho" }).map((p) => p.id), ["para_quem", "idade", "situacao"]);
assert.deepStrictEqual(eng.aplicaveis({ para_quem: "filho", situacao: "nao_pedi" }).map((p) => p.id), ["para_quem", "idade", "situacao", "celular"], "o celular só importa para quem ainda vai pedir");
assert.deepStrictEqual(eng.aplicaveis({ para_quem: "eu" }).map((p) => p.id), ["para_quem", "estudo"]);
assert.deepStrictEqual(eng.limpar({ para_quem: "eu", idade: "0a3", situacao: "negada", celular: "sim", estudo: "medio" }), { para_quem: "eu", estudo: "medio" }, "para si: respostas sobre o filho somem");
assert.deepStrictEqual(eng.limpar({ para_quem: "filho", estudo: "medio", situacao: "espero", celular: "sim" }), { para_quem: "filho", situacao: "espero" }, "para o filho: some o estudo; sem pedido novo, some o celular");
assert.deepStrictEqual(eng.limpar({ para_quem: "x", idade: "99" }), {}, "valor fora do previsto é ignorado");
assert.strictEqual(eng.proxima({ para_quem: "filho", idade: "0a3" }, []).pergunta.id, "situacao");
assert.strictEqual(eng.proxima({ para_quem: "filho", idade: "0a3" }, ["situacao"]), null, "pergunta pulada não é repetida");

/* ---- 3. Todas as combinações de respostas dão um plano válido ---- */
const combos = [];
["0a3", "4a5", "6mais"].forEach((idade) => ["nao_pedi", "espero", "negada"].forEach((situacao) => ["sim", "nao", undefined].forEach((celular) =>
  combos.push({ para_quem: "filho", idade: idade, situacao: situacao, celular: celular }))));
["medio", "tecnico", "faculdade", "nao_sei"].forEach((estudo) => combos.push({ para_quem: "eu", estudo: estudo }));
combos.push({ para_quem: "filho" }, { para_quem: "filho", idade: "0a3" });          // quem pulou as perguntas
const planos = combos.map((c) => eng.montarPlano(c, achar));
planos.forEach((pl, i) => {
  assert(pl.passos.length >= 1 && pl.passos.length <= 4, "plano com tamanho razoável: " + JSON.stringify(combos[i]));
  pl.passos.forEach((p, k) => {
    assert(p.numero === k + 1 && p.titulo && p.porque && p.alternativa, "passo incompleto (por que e 'se não der certo' são obrigatórios): " + p.id);
    assert(Array.isArray(p.leve) && Array.isArray(p.pergunte) && Array.isArray(p.extras), "estrutura igual à da jornada de Trabalho");
    assert(p.acao && /^(interno|externo)$/.test(p.acao.tipo), "cada passo tem uma ação clara: " + p.id);
  });
  assert(pl.avisos.length >= 2 && /Em perigo agora/.test(pl.avisos[pl.avisos.length - 1]), "o aviso de segurança acompanha todo plano");
});
assert.strictEqual(new Set(planos.map((pl) => ids(pl).join(">"))).size, 7, "7 sequências diferentes: 3 para o filho (pedir, esperar, vaga negada) e 4 para estudar");

/* ---- 4. A ordem respeita a situação ---- */
const p = (r) => ids(eng.montarPlano(r, achar)).join(">");
assert.strictEqual(p({ para_quem: "filho", idade: "0a3", situacao: "nao_pedi", celular: "sim" }), "pedir>acompanhar>ajuda");
assert.strictEqual(p({ para_quem: "filho", idade: "0a3", situacao: "espero" }), "acompanhar>ajuda");
assert.strictEqual(p({ para_quem: "filho", idade: "0a3", situacao: "negada" }), "registro>ajuda>acompanhar", "se a vaga foi negada, o primeiro passo é pedir o registro por escrito");
assert.strictEqual(p({ para_quem: "eu", estudo: "faculdade" }), "cursinho>graduacao");

/* ---- 5. Texto honesto: dependente da idade, do celular e sem promessa ---- */
const pedir = (r) => eng.montarPlano(r, achar).passos[0];
assert(/direito, mas a matrícula não é obrigatória/.test(pedir({ para_quem: "filho", idade: "0a3", situacao: "nao_pedi", celular: "sim" }).porque), "creche: direito, mas sem obrigatoriedade e dependente de vagas");
assert(/obrigatória/.test(pedir({ para_quem: "filho", idade: "4a5", situacao: "nao_pedi", celular: "sim" }).porque));
assert(/CADU/.test(pedir({ para_quem: "filho", idade: "0a3", situacao: "nao_pedi", celular: "sim" }).titulo));
assert(/pessoalmente/.test(pedir({ para_quem: "filho", idade: "0a3", situacao: "nao_pedi", celular: "nao" }).titulo), "sem celular: pedir pessoalmente na Secretaria");
assert(/2025/.test(pedir({ para_quem: "filho", idade: "0a3", situacao: "nao_pedi", celular: "sim" }).pergunte.join(" ")), "avisa que a informação do CADU é de 2025 e precisa de confirmação");
const proibido = /você (tem|terá) direito|vaga garantida|garantimos|você está apta|você não é elegível|inscrições abertas|vagas abertas/i;
planos.forEach((pl) => assert(!proibido.test(JSON.stringify(pl.passos)), "o plano promete ou anuncia o que o site não pode afirmar"));
planos.forEach((pl) => assert(/não garante/.test(pl.avisos[0]), "o plano avisa que não garante vaga"));

/* ---- 6. Fontes: telefones e links vêm do catálogo; links internos existem ---- */
const permitidos = new Set(servicos.map((s) => s.fonte_url));
Areas.AREAS.forEach((a) => a.secoes.forEach((s) => (s.links || []).forEach((l) => permitidos.add(l[1]))));
servicos.filter((s) => s.instagram).forEach((s) => permitidos.add("https://www.instagram.com/" + String(s.instagram).replace(/^@/, "") + "/"));
const rotas = new Set(Areas.AREAS.concat(Areas.EXTRAS || []).map((a) => a.id));
planos.forEach((pl) => pl.passos.forEach((passo) => {
  [passo.acao].concat(passo.extras.map((l) => ({ tipo: "externo", alvo: l[1] }))).forEach((a) => {
    if (a.tipo === "interno") assert(rotas.has(/^#([a-z-]+)/.exec(a.alvo)[1]), "link interno para área inexistente: " + a.alvo);
    else { assert(/^https:\/\//.test(a.alvo), "link externo precisa ser https: " + a.alvo); assert(permitidos.has(a.alvo), "link externo sem fonte cadastrada: " + a.alvo); }
  });
  if (passo.contato) {
    const s = servicos.find((x) => String(x.telefone) === passo.contato.telefone);
    assert(s && s.telefone, "telefone do passo não vem do catálogo: " + passo.contato.nome);
  }
}));
const todosTextos = JSON.stringify(planos);
assert(!/PEJA|man-peja/i.test(todosTextos), "o PEJA da Unesp hoje atende homens reeducandos: não é recomendado");
assert(planos.some((pl) => pl.passos.some((x) => x.contato && /3522-1950/.test(x.contato.telefone))), "o telefone da Secretaria vem do catálogo");

/* ---- 7. Sem o catálogo, nada quebra (só some o telefone) ---- */
const sem = eng.montarPlano({ para_quem: "filho", idade: "0a3", situacao: "nao_pedi", celular: "sim" }, null);
assert(sem.passos.length === 3 && sem.passos.every((x) => x.contato === null), "sem catálogo o plano existe, sem telefone inventado");

/* ---- 8. Arquivos da página ---- */
const index = fs.readFileSync(path.join(web, "index.html"), "utf8");
assert(index.indexOf("jornada-educacao.js") > index.indexOf("jornada.js") && index.indexOf("jornada-educacao.js") < index.indexOf("jornada-ui.js"), "a jornada de Educação carrega depois da base e antes da tela");
const ui = fs.readFileSync(path.join(web, "jornada-ui.js"), "utf8");
assert(/estados\[J\.id\]/.test(ui) && !/localStorage|sessionStorage|document\.cookie/.test(ui), "estado por jornada, só na memória da página");
assert(eng.primeiraDecideCaminho === true && !J.de("trabalho").primeiraDecideCaminho, "só a Educação esconde o total na primeira pergunta");
assert(/semTotal/.test(ui), "a tela não mostra 'Pergunta 1 de 1' quando a primeira resposta decide o caminho");
console.log("jornada_educacao.test.js: " + combos.length + " combinações de respostas conferidas, planos honestos e com fonte");
