const assert = require("assert");
const fs = require("fs");
const path = require("path");

const web = path.resolve(__dirname, "..");
const J = require("../jornada.js");
const Areas = require("../areas.js");
const catalogo = JSON.parse(fs.readFileSync(path.join(web, "dados", "catalogo_manual.json"), "utf8"));
const servicos = Array.isArray(catalogo) ? catalogo : catalogo.servicos;

const ids = (p) => p.passos.map((s) => s.id);

/* ---- só respostas previstas são aceitas ---- */
assert.deepStrictEqual(J.limpar({ filhos: "talvez", curriculo: "sim", x: 1 }), { curriculo: "sim" });
assert.deepStrictEqual(J.limpar({ filhos: "nao", cuidado: "nao" }), { filhos: "nao" }, "cuidado só vale quando há crianças");
assert.deepStrictEqual(J.limpar(null), {});

/* ---- o caso central: desempregada, duas crianças, sem creche, sem dinheiro, sem transporte, sem currículo ---- */
const caso = J.montarPlano({ filhos: "sim", cuidado: "nao", renda_agora: "sim", deslocamento: "sim", curriculo: "nao", objetivo: "emprego" });
assert.deepStrictEqual(ids(caso), ["cuidado", "renda", "deslocamento", "curriculo", "vagas", "formacao"],
  "o cuidado das crianças e a renda do básico vêm antes de procurar vaga");
assert.deepStrictEqual(caso.passos.map((p) => p.numero), [1, 2, 3, 4, 5, 6]);
assert.strictEqual(caso.passos[0].links.length, 2, "o passo de cuidado aponta para os canais da Educação");

/* ---- sem obstáculos, o plano é curto ---- */
const livre = J.montarPlano({ filhos: "nao", renda_agora: "nao", deslocamento: "nao", curriculo: "sim", objetivo: "emprego" });
assert.deepStrictEqual(ids(livre), ["vagas", "formacao"]);
const comCuidado = J.montarPlano({ filhos: "sim", cuidado: "sim", renda_agora: "nao", curriculo: "sim", objetivo: "emprego" });
assert(!ids(comCuidado).includes("cuidado"), "quem já tem com quem deixar as crianças não recebe esse passo");
const asVezes = J.montarPlano({ filhos: "sim", cuidado: "as_vezes", objetivo: "emprego", curriculo: "sim" });
assert.strictEqual(ids(asVezes)[0], "cuidado", "cuidado só às vezes também merece atenção");

/* ---- ensino médio: leva à EJA gratuita do SESI, depois do cuidado e antes do currículo ---- */
const eja = J.montarPlano({ filhos: "sim", cuidado: "nao", ensino_medio: "nao", curriculo: "nao", objetivo: "emprego" });
assert.deepStrictEqual(ids(eja), ["cuidado", "estudos", "curriculo", "vagas", "formacao"]);
assert(eja.passos.find((p) => p.id === "estudos").links.some((l) => /SESI/.test(l[0])), "o passo de estudos deve apontar para o SESI");
assert(!ids(J.montarPlano({ ensino_medio: "sim", objetivo: "emprego", curriculo: "sim" })).includes("estudos"), "quem terminou o ensino médio não recebe o passo");
assert(!ids(J.montarPlano({ objetivo: "emprego", curriculo: "sim" })).includes("estudos"), "sem resposta, não presume");

/* ---- objetivos ---- */
const curso = J.montarPlano({ objetivo: "curso", curriculo: "sim" });
assert.deepStrictEqual(ids(curso), ["curso"]);
const nomesCurso = curso.passos[0].links.map((l) => l[0]).join("|");
["SENAI Rio Claro", "Senac Rio Claro", "SEST SENAT", "Centros de Qualificação Profissional", "Etec", "Fatec Rio Claro — Inteligência Artificial", "Fatec Rio Claro — Gestão ESG", "Faculdade SESI de Educação", "SESI Rio Claro", "SEST SENAT — cursos abertos agora"].forEach((n) =>
  assert(nomesCurso.includes(n), "o passo de curso deve listar " + n));
const negocio = J.montarPlano({ objetivo: "negocio", curriculo: "sim" });
assert.deepStrictEqual(ids(negocio), ["negocio"], "quem quer renda própria não recebe o passo de procurar vagas");
const naoSei = J.montarPlano({ objetivo: "nao_sei", curriculo: "nao" });
assert.deepStrictEqual(ids(naoSei), ["curriculo", "vagas", "opcoes"]);
assert.deepStrictEqual(ids(J.montarPlano({})), ["vagas"], "sem respostas: só o caminho de vagas");

/* ---- todo passo explica, orienta e oferece alternativa ---- */
[caso, livre, curso, negocio, naoSei].forEach((pl) => pl.passos.forEach((p) => {
  assert(p.titulo && p.porque && p.alternativa && p.fazer.length, "passo incompleto: " + p.id);
}));

/* ---- cada link vem de uma fonte já cadastrada no projeto ---- */
const permitidos = new Set(servicos.map((s) => s.fonte_url));
Areas.AREAS.forEach((a) => a.secoes.forEach((s) => (s.links || []).forEach((l) => permitidos.add(l[1]))));
Areas.AREAS.forEach((a) => permitidos.add("#" + a.id));
Object.keys(J.LINKS).forEach((k) => {
  const url = J.LINKS[k][1];
  assert(permitidos.has(url), "link do plano sem fonte cadastrada no projeto: " + k + " " + url);
});

/* ---- nunca promete direito, vaga, crédito nem decide elegibilidade ---- */
const proibido = /você (tem|terá) direito|vaga garantida|crédito aprovado|garantimos|você está apta|você não é elegível/i;
[caso, curso, negocio, naoSei].forEach((pl) => {
  const texto = JSON.stringify(pl.passos); /* os avisos negam a promessa e são conferidos abaixo */
  assert(!proibido.test(texto), "texto promete o que o site não pode prometer");
  assert(/não diz se você tem direito/.test(pl.avisos[0]), "o plano deve avisar que não decide elegibilidade");
  assert(/Em perigo agora/.test(pl.avisos[1]), "o plano deve lembrar o caminho de proteção");
});

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
assert(!/target="_blank"[^>]*href="#/.test(UI.htmlPlano(caso)), "links internos não abrem em outra aba");
assert(/rel="noopener noreferrer"/.test(UI.htmlPlano(caso)), "links externos com noopener");
const papel = UI.htmlPlano(caso, true);
assert(!/<a /.test(papel) && /https:\/\/rioclaro\.sp\.gov\.br/.test(papel), "na versão impressa o endereço aparece como texto");

console.log("jornada.test.js: ordem do plano, objetivos, fontes, promessas proibidas e currículo passaram");
