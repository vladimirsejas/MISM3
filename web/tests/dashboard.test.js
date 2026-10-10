/* Teste estrutural da tela inicial e das áreas (especificação "Mulher em Rede").
   Não substitui o teste no navegador: confere o que dá para garantir lendo os arquivos. */
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const Areas = require("../areas.js");

const web = path.resolve(__dirname, "..");
const ler = (f) => fs.readFileSync(path.join(web, f), "utf8");
const index = ler("index.html"), rede = ler("rede-mulheres.html"), app = ler("app.js"), css = ler("estilo.css");

/* ---- 1. Tela inicial: exatamente sete portas, com os nomes pedidos ---- */
const NOMES = ["Trabalho", "Educação", "Saúde", "Direitos", "Moradia", "Assistência Social", "De Mulher para Mulher"];
const inicio = index.slice(index.indexOf('<section id="inicio-tela"'), index.indexOf('<section id="area"'));
const portas = Array.from(inicio.matchAll(/<a class="porta" href="([^"]+)">.*?<\/span>([^<]+)<\/a>/g), (m) => ({ href: m[1], nome: m[2].trim() }));
assert.deepStrictEqual(portas.map((p) => p.nome), NOMES, "a tela inicial deve ter exatamente as sete portas, na ordem definida");
assert.strictEqual((index.match(/class="porta"/g) || []).length, 7, "não pode haver outros botões de porta");
assert.deepStrictEqual(portas.slice(0, 6).map((p) => p.href), Areas.AREAS.map((a) => "#" + a.id), "cada porta deve apontar para a sua área");
assert.deepStrictEqual(Areas.AREAS.map((a) => a.nome), NOMES.slice(0, 6), "os nomes das áreas devem ser os mesmos das portas");
assert.strictEqual(portas[6].href, "rede-mulheres.html", "De Mulher para Mulher é uma página independente");

/* ---- 2. A tela inicial não expõe o conteúdo das áreas ---- */
["CRAS", "CREAS", "Conselho Tutelar", "Fundo Social", "Disque 100", "Procon", "Defensoria", "tarifa social"].forEach((t) =>
  assert(!inicio.includes(t), "a tela inicial não deve expor conteúdo de área: " + t));
assert(!/<form/.test(inicio) && !/<input/.test(inicio), "a tela inicial não tem formulários nem campos de busca");

/* ---- 3. Emergência: botão compacto com os contatos oficiais, em todas as páginas ---- */
[["index.html", index], ["rede-mulheres.html", rede]].forEach(([nome, html]) => {
  assert(html.includes('<details class="emergencia"'), nome + ": falta o botão de emergência");
  const tels = Array.from(html.matchAll(/class="tel" href="tel:(\d+)"/g), (m) => m[1]);
  assert.deepStrictEqual(tels, Areas.EMERGENCIA.map((c) => c.tel), nome + ": contatos de emergência diferentes dos definidos em areas.js");
  assert(html.includes('id="voltar"'), nome + ": falta o botão Voltar");
});
assert(!/barra-emergencia/.test(index + rede + css), "não deve existir faixa de emergência de largura total");
assert(!/location\.replace\(["']https?:\/\/(?!www\.google)/.test(app), "o botão de sair não deve ir a destinos inesperados");
assert(/não apaga/i.test(index), "o texto do botão de sair deve admitir que não apaga o histórico");

/* ---- 4. Nada de demonstração, jargão ou texto técnico na interface ---- */
[["index.html", index], ["rede-mulheres.html", rede], ["app.js", app], ["areas.js", ler("areas.js")]].forEach(([nome, txt]) => {
  ["[DEMO]", "DADOS ILUSTRATIVOS", "faixa-demo", "dados/demo", "protótipo", "Protótipo", "fictíci", "cadastro manual"].forEach((t) =>
    assert(!txt.includes(t), nome + " contém texto proibido: " + t));
});
const dadosVisiveis = ler("dados/catalogo_manual.json");
["complete o CEP", "ainda precisam ser cadastrados", "cadastro manual"].forEach((t) =>
  assert(!dadosVisiveis.includes(t), "catalogo_manual.json contém texto de desenvolvedor: " + t));

/* ---- 5. Links e arquivos locais existem ---- */
[["index.html", index], ["rede-mulheres.html", rede]].forEach(([nome, html]) => {
  Array.from(html.replace(/<script>[\s\S]*?<\/script>/g, "").matchAll(/(?:href|src)="([^"#]+)(?:#[^"]*)?"/g), (m) => m[1])
    .filter((u) => !/^(https?:|tel:|mailto:)/.test(u))
    .forEach((u) => assert(fs.existsSync(path.join(web, u)), nome + ": arquivo local inexistente: " + u));
});
assert(fs.existsSync(path.join(web, "dados/catalogo_manual.json")), "o catálogo verificado deve acompanhar o site");
const catalogo = JSON.parse(dadosVisiveis);
assert.strictEqual(catalogo.meta.demo, false, "o catálogo do site não pode ser de demonstração");
catalogo.servicos.forEach((s) => assert(s.fonte_url && s.verificado_em && !/\[DEMO\]/.test(s.nome), "serviço sem fonte/data ou de demonstração: " + s.nome));
const conselhos = catalogo.servicos.filter((s) => /Conselho Tutelar/.test(s.nome));
assert.strictEqual(conselhos.length, 2, "devem constar o Conselho Tutelar Sul e o Norte");
const tel = Object.fromEntries(conselhos.map((s) => [s.nome, s.telefone]));
assert.strictEqual(tel["Conselho Tutelar – Região Sul"], "(19) 3533-5411 / (19) 3532-5221");
assert.strictEqual(tel["Conselho Tutelar – Região Norte"], "(19) 3523-6439", "telefone do Norte conforme a página do CMDCA");
assert(!JSON.stringify(conselhos).includes("99336"), "telefone sem fonte não pode voltar");
conselhos.forEach((s) => assert(s.conferido !== false && /CMDCA/.test(s.fonte) && s.fonte_url === "https://cmdcarioclaro.com.br/contato/", "fonte do Conselho: " + s.nome));
catalogo.servicos.filter((s) => s.conferido === false).forEach((s) => assert(/não conferida/.test(s.fonte), "item não conferido com fonte enganosa: " + s.nome));
assert(app.includes("Ainda não conferido na página oficial") && app.includes("s.conferido === false"), "a interface deve avisar quando o item não foi conferido");

/* ---- 6. Conteúdo das áreas ---- */
Areas.AREAS.forEach((a) => {
  assert(a.nome && a.intro && a.icone && a.secoes.length, a.id + ": área incompleta");
  assert(index.includes('id="i-' + a.icone + '"'), a.id + ": falta o ícone no sprite");
  const urls = [];
  a.secoes.forEach((s) => s.links.forEach((l) => {
    assert(/^https:\/\//.test(l[1]), a.id + ": link sem https: " + l[1]);
    assert(l[0] && l[2], a.id + ": link sem título ou descrição");
    urls.push(l[1]);
  }));
  assert.strictEqual(new Set(urls).size, urls.length, a.id + ": link repetido dentro da mesma área");
});
const assistencia = Areas.porId("assistencia");
assert(assistencia.pendencias.some((p) => /CREAS/.test(p)) && assistencia.pendencias.some((p) => /Conselho Tutelar/.test(p)),
  "CREAS e Conselho Tutelar sem dados verificados devem aparecer como pendentes, não como serviços");
assert(Areas.porId("saude").pendencias.length, "Saúde deve declarar a lacuna quando o CNES não está carregado");
assert.strictEqual(Areas.porId("inexistente"), null);

/* ---- 6b. Busca dentro das áreas: cobre todas as chaves do classificador ---- */
const Busca = require("../necessidades.js");
assert(!inicio.includes('id="form-necessidade"') && index.includes('id="form-necessidade"'), "a busca fica dentro das áreas, nunca na tela inicial");
const chavesClassificador = Array.from(fs.readFileSync(path.join(web, "necessidades.js"), "utf8").matchAll(/^\s+\["(\w+)", \[$/gm), (m) => m[1]);
assert(chavesClassificador.length >= 9, "não achei as chaves do classificador");
chavesClassificador.forEach((c) => assert(Areas.AREA_DA_NECESSIDADE[c], "necessidade sem área: " + c));
assert.deepStrictEqual(Areas.areasDaNecessidade(Busca.identificarCategorias("preciso de creche e aluguel")).map((a) => a.id), ["educacao", "moradia"]);
assert.deepStrictEqual(Areas.areasDaNecessidade(Busca.identificarCategorias("quero me separar")).map((a) => a.id), ["direitos"]);
assert.deepStrictEqual(Areas.areasDaNecessidade(Busca.identificarCategorias("não tenho o que comer")).map((a) => a.id), ["assistencia"]);
assert(index.includes('class="pular"'), "falta o link para pular ao conteúdo");

/* ---- 7. Comportamento esperado no código ---- */
assert(app.includes("sv.meta && sv.meta.demo"), "dados de demonstração nunca devem ser exibidos");
assert(app.includes("history.state && history.state.app"), "Voltar deve usar o histórico apenas quando a navegação começou no sistema");
assert(app.includes("linksTelefone") && !/replace\(\/\[\^\\d\+\]\/g, ""\)\) \+ '">' \+ esc\(s\.telefone/.test(app), "telefones múltiplos devem ter um link cada");
assert(app.includes("busca-por-cep"), "a busca por CEP deve continuar existindo");
assert(css.includes(".emergencia>summary") && css.includes("min-height:44px"), "alvos de toque devem ter pelo menos 44px");
assert(!/prefers-color-scheme:\s*dark/.test(css), "a interface deve manter o fundo claro");

console.log("dashboard.test.js: sete portas, emergência, navegação, ausência de demonstração, links locais e conteúdo das áreas passaram");
