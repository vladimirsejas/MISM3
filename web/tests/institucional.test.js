const assert = require("assert");
const fs = require("fs");
const path = require("path");
const I = require("../institucional.js");

const dados = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "dados", "institucional.json"), "utf8"));
const U = dados.saude, C = dados.canais;
const ids = (r) => r.map((x) => x.unidade.id);
let n = 0;
const ok = (c, m) => { assert(c, m); n++; };
const igual = (a, b, m) => { assert.deepStrictEqual(a, b, m); n++; };

// ---- normalizar: acento, caixa, abreviatura
igual(I.normalizar("Jd. Santa Clara"), "jardim santa clara");
igual(I.normalizar("  Estádio  "), "estadio");
igual(I.normalizar("Pq. São Jorge"), "parque sao jorge");
igual(I.normalizar(null), "");
igual(I.rotuloBairro("Jd. Santa Clara"), "Jardim Santa Clara");
igual(I.rotuloBairro("Pq. das Indústrias"), "Parque das Indústrias");
igual(I.rotuloBairro("Boa Esperança"), "Boa Esperança");

// ---- casa(): o que deve e o que NAO deve casar
ok(I.casa("chervezon", "Jd. Chervezon"), "sem o 'jardim'");
ok(I.casa("jardim chervezon", "Jd. Chervezon"), "com o 'jardim'");
ok(I.casa("JD CHERVEZON", "Jd. Chervezon"), "abreviado e em maiusculas");
ok(I.casa("chervez", "Jd. Chervezon"), "digitando ainda");
ok(I.casa("estadio", "Estádio"), "sem acento");
ok(I.casa("vila cristina", "Vila Cristina"));
ok(!I.casa("vila cristina", "Jardim Cristina"), "tipo diferente nao casa");
ok(!I.casa("jardim", "Jd. Chervezon"), "so o tipo nao diz qual bairro");
ok(!I.casa("", "Jd. Chervezon"));
ok(!I.casa("ab", "Abacate"), "2 letras e pouco");
ok(!I.casa("kennedy", "Jd. Chervezon"));
ok(I.casa("santa clara", "Jd. Santa Clara") && !I.casa("santa clara", "Jd. Santa Maria"), "todos os termos precisam casar");

// ---- buscarPorBairro com o cadastro REAL
let r = I.buscarPorBairro("Wenzel", U);
ok(ids(r.atende).includes("municipal-ubs-wenzel"), "Wenzel -> UBS Wenzel");
ok(ids(r.fica).includes("municipal-usf-bonsucesso"), "USF do Jardim Novo Wenzel fica no bairro");
ok(!ids(r.fica).includes("municipal-ubs-wenzel"), "unidade nao aparece nos dois grupos");

r = I.buscarPorBairro("Jd. Panorama", U);
ok(ids(r.atende).includes("municipal-ubs-wenzel") && ids(r.fica).includes("municipal-usf-panorama"));
igual(r.atende[0].via, "Jardim Panorama", "mostra por qual bairro casou");

r = I.buscarPorBairro("chervezon", U);
igual(ids(r.atende), ["municipal-ubs-chervezon"]);

r = I.buscarPorBairro("Vila Cristina", U);
ok(ids(r.atende).includes("municipal-ubs-vila-cristina"));

r = I.buscarPorBairro("Ajapi", U);
ok(ids(r.atende).includes("municipal-ubs-ajapi"), "distrito atende o proprio distrito");
ok(ids(r.fica).includes("municipal-usf-ferraz") === false);

r = I.buscarPorBairro("itape", U);
ok(ids(r.atende).includes("municipal-ubs-itape"));

r = I.buscarPorBairro("Boa Vista", U);
ok(ids(r.atende).includes("municipal-ubs-boa-vista"));
ok(r.atende.some((x) => x.via === "Chácara Boa Vista"), "nome parecido de outro lugar aparece COM o nome certo, para a pessoa distinguir");

r = I.buscarPorBairro("Guanabara", U);
ok(ids(r.atende).includes("municipal-ubs-palmeiras") && ids(r.fica).includes("municipal-usf-guanabara"));

r = I.buscarPorBairro("Centro", U);
ok(ids(r.fica).includes("municipal-gineco-obstetricia"), "Centro: pronto atendimento gineco/obstetricia");

r = I.buscarPorBairro("zzzzzz", U);
ok(!r.curta && !r.atende.length && !r.fica.length, "bairro desconhecido: vazio, sem inventar");
r = I.buscarPorBairro("ab", U);
ok(r.curta, "texto curto");
ok(I.buscarPorBairro("", U).curta);

// ---- bairros do guia oficial: todos achados por nome (nenhum fica inalcancavel)
U.filter((u) => u.subtipo === "ubs").forEach((u) => u.bairros.forEach((b) => {
  ok(ids(I.buscarPorBairro(b, U).atende).includes(u.id), "bairro '" + b + "' deveria achar " + u.id);
}));

// ---- lista de bairros (datalist)
const lista = I.listaBairros(U);
ok(lista.length > 60, "bairros: " + lista.length);
ok(new Set(lista.map(I.normalizar)).size === lista.length, "sem repeticao");
ok(lista.includes("Jardim Chervezon") && lista.includes("Estádio") && !lista.some((b) => /\bJd\b/.test(b)), "abreviaturas expandidas");
igual(lista.slice().sort((a, b) => I.normalizar(a) < I.normalizar(b) ? -1 : 1), lista, "ordem alfabetica sem acento");

// ---- agrupar
const g = I.agruparUnidades(U);
igual(g.map((x) => x.chave), ["urgencia", "ubs", "usf", "outros"]);
igual(g.reduce((s, x) => s + x.unidades.length, 0), U.length, "nenhuma unidade some");
ok(U.filter(I.ehVinteEQuatroHoras).length >= 3, "tem unidades 24h");
ok(U.filter(I.ehVinteEQuatroHoras).every((u) => u.subtipo === "urgencia"));

// ---- observacao: tira o repetido, preserva o especifico
const por = Object.fromEntries(U.map((u) => [u.id, u]));
igual(I.limparObservacao(por["municipal-ubs-itape"]), "Funciona só às terças pela manhã. A página oficial não informa telefone.");
ok(!/Atende moradores/.test(I.limparObservacao(por["municipal-ubs-chervezon"])), "bairros ficam so no campo proprio");
ok(!/Papanicolau/.test(I.limparObservacao(por["municipal-ubs-wenzel"])), "frase geral sai do cartao");
ok(!/captura de tela/.test(I.limparObservacao(por["municipal-usf-panorama"])), "nota de procedencia sai do cartao");
ok(/Unidade de Sa\u00fade da Fam\u00edlia/.test(I.limparObservacao(por["municipal-usf-panorama"])));
U.forEach((u) => ok(!/coordenad|CEP\/|aparece na lista|n\u00e3o no mapa/i.test(I.limparObservacao(u)), "nota interna vazou para o cartao: " + u.id));
igual(I.limparObservacao(por["municipal-gineco-obstetricia"]), "Unidade de urgência ginecológica e obstétrica listada na página municipal. Confirmar funcionamento e endereço antes de deslocar-se.");
igual(I.limparObservacao(por["municipal-upa-av29"]), "");
igual(I.limparObservacao(null), "");
igual(I.limparObservacao({ observacao: "Texto proprio." }), "Texto proprio.");

// ---- telefones
igual(I.telefones("(19) 3535-2908 / 3535-0709"), [
  { texto: "(19) 3535-2908", href: "tel:+5519 35352908".replace(" ", "") },
  { texto: "(19) 3535-0709", href: "tel:+551935350709" }], "segundo numero herda o DDD");
igual(I.telefones("(19) 9 9956-3042 (WhatsApp)")[0].href, "tel:+5519999563042");
igual(I.telefones("(19) 98912-0719")[0], { texto: "(19) 98912-0719", href: "tel:+5519989120719" }, "celular colado nao perde digito");
igual(I.telefones(""), []);
igual(I.telefones(null), []);
U.filter((u) => u.telefone).forEach((u) => ok(I.telefones(u.telefone).length >= 1, "telefone ilegivel em " + u.nome));

// ---- canais
const mulher = I.filtrarCanais(C, { tema: "mulher" });
ok(mulher.some((c) => c.id === "sec-mulher") && mulher.some((c) => c.id === "doc-protocolo-mama"));
igual(I.filtrarCanais(C, { texto: "educacao" }).map((c) => c.id).includes("sec-educacao"), true, "sem acento acha 'Educação'");
ok(I.filtrarCanais(C, { texto: "ouvidoria" })[0].id === "sec-ouvidoria");
ok(I.filtrarCanais(C, { texto: "xxxxxxxx" }).length === 0);
ok(I.filtrarCanais(C, { grupo: "documento" }).every((c) => c.grupo === "documento"));
const todos = I.filtrarCanais(C, {});
igual(todos.length, C.length, "sem filtro devolve tudo");
const primeiroListado = todos.findIndex((c) => c.situacao === "listado");
ok(todos.slice(primeiroListado).every((c) => c.situacao === "listado"), "conferidos vem antes dos apenas listados");
ok(I.TEMAS.every((t) => C.some((c) => c.temas.includes(t.chave))), "todo tema do filtro tem pelo menos um canal");
ok(C.every((c) => /^https:\/\//.test(c.url)));

igual(I.dataBR("2026-10-09"), "09/10/2026");
igual(I.dataBR(""), "");

console.log("institucional.js: " + n + " verificações passaram");
