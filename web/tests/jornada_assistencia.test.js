const assert = require("assert");
const fs = require("fs");
const path = require("path");

const web = path.resolve(__dirname, "..");
const J = require("../jornada.js");
require("../jornada-assistencia.js");
const Areas = require("../areas.js");
const catalogo = JSON.parse(fs.readFileSync(path.join(web, "dados", "catalogo_manual.json"), "utf8"));
const servicos = Array.isArray(catalogo) ? catalogo : catalogo.servicos;
const achar = (id) => servicos.find((s) => s.id === id) || null;
const eng = J.de("assistencia");
const ids = (p) => p.passos.map((s) => s.id).join(">");

/* ---- 1. Registrada, ligada à área e sem mexer nas outras ---- */
assert(eng && eng.PERGUNTAS.length === 1 && eng.PERGUNTAS[0].id === "precisa");
assert.strictEqual(Areas.AREAS.find((a) => a.id === "assistencia").jornada, "assistencia");
assert.strictEqual(Areas.AREAS.find((a) => a.id === "educacao").jornada, "educacao");
assert(!eng.temCurriculo && !eng.primeiraDecideCaminho);
assert.deepStrictEqual(eng.limpar({ precisa: "x" }), {}, "resposta fora do previsto é ignorada");
assert.strictEqual(eng.proxima({ precisa: "apoio" }, []), null, "uma pergunta só: depois dela, vem o plano");

/* ---- 2. Cada resposta leva ao caminho certo ---- */
const plano = (precisa) => eng.montarPlano({ precisa: precisa }, achar);
assert.strictEqual(ids(plano("apoio")), "cras>outros");
assert.strictEqual(ids(plano("nao_sei")), "cras>outros", "sem saber por onde começar, a porta de entrada é o CRAS");
assert.strictEqual(ids(plano("direitos")), "creas>conselho>disque100");
assert.strictEqual(ids(plano("convivencia")), "convivencia");
assert.strictEqual(plano(undefined).passos.length, 0, "sem resposta, sem passos (a tela pergunta primeiro)");

/* ---- 3. Estrutura e honestidade dos passos ---- */
["apoio", "nao_sei", "direitos", "convivencia"].forEach((r) => {
  const pl = plano(r);
  pl.passos.forEach((p, i) => {
    assert(p.numero === i + 1 && p.titulo && p.porque && p.alternativa && p.acao, "passo incompleto: " + p.id);
    assert(Array.isArray(p.leve) && Array.isArray(p.pergunte) && Array.isArray(p.extras));
  });
  assert(/não garante|nenhum deles garante/.test(pl.avisos[0]), "avisa que não garante atendimento nem benefício");
  assert(/Em perigo agora/.test(pl.avisos[pl.avisos.length - 1]), "o aviso de segurança acompanha todo plano");
});
const proibido = /você (tem|terá) direito|vaga garantida|garantimos|você está apta|você não é elegível|benefício garantido|R\$ ?\d|\b\d{1,2}h às \d{1,2}h/i;
["apoio", "direitos", "convivencia"].forEach((r) => assert(!proibido.test(JSON.stringify(plano(r).passos)), "promete, diz valor ou horário sem fonte: " + r));
/* O CadÚnico pode ser nomeado (tem fonte oficial e aviso na área), mas só no passo do CRAS do caminho "apoio". */
assert(/Cadastro Único/.test(JSON.stringify(plano("apoio").passos[0])), "o passo do CRAS cita o Cadastro Único");

/* ---- 4. Telefones e links vêm de fonte do projeto ---- */
const permitidos = new Set(servicos.map((s) => s.fonte_url));
Areas.AREAS.forEach((a) => a.secoes.forEach((s) => (s.links || []).forEach((l) => permitidos.add(l[1]))));
const emergencia = (Areas.EMERGENCIA || []).map((c) => c.tel);
["apoio", "direitos", "convivencia"].forEach((r) => plano(r).passos.forEach((p) => {
  [p.acao].concat(p.extras.map((l) => ({ tipo: "externo", alvo: l[1] }))).forEach((a) => {
    if (a.tipo === "externo") { assert(/^https:\/\//.test(a.alvo) && permitidos.has(a.alvo), "link externo sem fonte: " + a.alvo); }
    else if (/^#/.test(a.alvo)) assert(Areas.AREAS.some((x) => x.id === /^#([a-z-]+)/.exec(a.alvo)[1]) || /^#mapa(\/cras)?$/.test(a.alvo), "área inexistente: " + a.alvo);
    else assert(fs.existsSync(path.join(web, a.alvo.split("#")[0])), "página inexistente: " + a.alvo);
  });
  if (p.contato) {
    const ok = servicos.some((s) => String(s.telefone) === p.contato.telefone) || emergencia.includes(p.contato.telefone);
    assert(ok, "telefone sem fonte: " + p.contato.nome + " " + p.contato.telefone);
  }
}));
assert(emergencia.includes("100"), "o 100 é um dos contatos de emergência do site");
const cras = plano("apoio").passos[0];
assert(/3522-1930/.test(cras.contato.telefone), "o telefone da Secretaria de Desenvolvimento Social vem do catálogo");
assert(cras.acao.alvo === "#mapa/cras" && /id="titulo-cras"/.test(fs.readFileSync(path.join(web, "index.html"), "utf8")), "o passo leva à caixa 'Qual CRAS atende o meu bairro?'");
const creas = plano("direitos").passos[0];
assert(/3523-6420/.test(creas.contato.telefone) && /violência física, psicológica ou sexual/.test(creas.porque), "CREAS: telefone do catálogo e o que ele atende, como na fonte");
const conselho = plano("direitos").passos[1];
assert(/Região Sul: \(19\) 3533-5411/.test(conselho.pergunte[0]) && /Região Norte: \(19\) 3523-6439/.test(conselho.pergunte[0]), "os telefones dos dois Conselhos Tutelares vêm do catálogo");
assert(!conselho.contato, "não escolhe um Conselho por conta própria: a pessoa precisa saber a região");
assert(/Ligue 180/.test(plano("direitos").apoio.texto) && plano("direitos").apoio.alvo === "#direitos", "para a mulher em violência, aponta o 180 e a área Direitos");

/* ---- 5. Sem catálogo, nada quebra ---- */
const sem = eng.montarPlano({ precisa: "direitos" }, null);
assert(sem.passos.length === 3 && sem.passos[0].contato === null && sem.passos[2].contato.telefone === "100", "sem catálogo: sem telefone inventado (só o 100, que é fixo)");

/* ---- 6. Tela ---- */
const index = fs.readFileSync(path.join(web, "index.html"), "utf8");
assert(index.indexOf("jornada-assistencia.js") > index.indexOf("jornada.js") && index.indexOf("jornada-assistencia.js") < index.indexOf("jornada-ui.js"));
assert(/\^\\d\{3\}\$/.test(fs.readFileSync(path.join(web, "jornada-ui.js"), "utf8")), "a tela transforma o 100 em link de ligar");
console.log("jornada_assistencia.test.js: 4 caminhos conferidos, telefones e links com fonte, sem promessa, sem valor de renda e sem horário");
