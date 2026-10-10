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
assert(!("demo" in catalogo.meta), "não deve existir marcador de demonstração no catálogo");
catalogo.servicos.forEach((s) => assert(s.fonte_url && s.verificado_em && !/\[DEMO\]/.test(s.nome), "serviço sem fonte/data ou de demonstração: " + s.nome));
const conselhos = catalogo.servicos.filter((s) => /Conselho Tutelar/.test(s.nome));
assert.strictEqual(conselhos.length, 2, "devem constar o Conselho Tutelar Sul e o Norte");
const tel = Object.fromEntries(conselhos.map((s) => [s.nome, s.telefone]));
assert.strictEqual(tel["Conselho Tutelar – Região Sul"], "(19) 3533-5411 / (19) 3532-5221");
assert.strictEqual(tel["Conselho Tutelar – Região Norte"], "(19) 3523-6439", "telefone do Norte conforme a página do CMDCA");
assert(!JSON.stringify(conselhos).includes("99336"), "telefone sem fonte não pode voltar");
conselhos.forEach((s) => assert(s.conferido !== false && /CMDCA/.test(s.fonte) && s.fonte_url === "https://cmdcarioclaro.com.br/contato/", "fonte do Conselho: " + s.nome));
/* ---- 5b. CRAS, CREAS e unidades de convivência (Secretaria de Desenvolvimento Social, 10/10/2026) ---- */
const cras = catalogo.servicos.filter((s) => s.subtipo === "cras");
assert.strictEqual(cras.length, 6, "a página oficial lista seis CRAS");
cras.forEach((s) => assert(s.bairros && s.bairros.split(",").length >= 10, "CRAS sem lista de bairros: " + s.nome));
const porNome = Object.fromEntries(catalogo.servicos.map((s) => [s.nome, s]));
assert.strictEqual(porNome["CRAS Região Mãe Preta"].telefone, "(19) 3524-9954");
assert.strictEqual(porNome["CRAS Região Panorama"].endereco, "Rua 14, 2763, Jd. Wenzel");
assert(/endereço provisório/.test(porNome["CRAS Região Jardim Brasília"].observacao) && !porNome["CRAS Região Jardim Brasília"].telefone,
  "o CRAS Jardim Brasília está em endereço provisório e sem telefone na fonte: nada pode ser inventado");
const creas = catalogo.servicos.filter((s) => s.subtipo === "creas");
assert.strictEqual(creas.length, 1);
assert.strictEqual(creas[0].telefone, "(19) 3523-6420 / (19) 3523-6439");
assert(creas[0].endereco.includes("Rua 6, 640") && creas[0].observacao.includes("creas@rioclaro.sp.gov.br"));
assert(porNome["Conselho Tutelar – Região Norte"].observacao.includes("também aparece como telefone do CREAS"), "o número repetido entre Conselho Norte e CREAS deve ser sinalizado");
const chi = porNome["Centro de Habilitação Infantil “Princesa Victória” (CHI)"];
assert(chi && chi.tipo === "saude" && chi.conferido !== false && chi.fonte_url === "https://www.pessoacomdeficiencia.rc.sp.gov.br/", "o CHI foi conferido no site oficial da Fundação de Saúde");
assert.strictEqual(chi.telefone, "(19) 3527-1461 / (19) 3535-4408");
assert(!JSON.stringify(chi).includes("535-1461") || chi.telefone.includes("3527-1461"), "o telefone antigo de 7 dígitos não pode voltar");
assert(!/\(19\) 535-1461/.test(chi.telefone + chi.observacao), "telefone antigo de 7 dígitos removido");
assert(chi.observacao.includes("chi@rc.saude-rioclaro.org.br") && /confirme por telefone/.test(chi.observacao), "o público atendido vem de blog sem data e deve pedir confirmação");
const cei = porNome["Centro de Especialidade Infantil (CEI) “Antonio Carlos Rodrigues – Tute”"];
assert(cei && cei.tipo === "saude" && cei.conferido === false && /11\/10\/2019/.test(cei.aviso + cei.fonte), "o CEI vem de notícia de 2019: deve constar como informação antiga");
assert.strictEqual(cei.telefone, "(19) 3523-3754 / (19) 3533-4055 / (19) 3524-5770");
assert(/Rua 15, entre as avenidas 23 e 25/.test(cei.endereco) && /Criari/.test(cei.observacao) && /Caps IJ/.test(cei.observacao) && /CEO/.test(cei.observacao));
assert(/odontologia do CHI/.test(porNome["Centro de Habilitação Infantil “Princesa Victória” (CHI)"].observacao), "a mudança da odontologia do CHI deve constar no cartão do CHI");
const fund = porNome["Fundação Municipal de Saúde de Rio Claro"];
assert(fund && fund.tipo === "saude" && fund.telefone === "(19) 3522-3600" && fund.cep === "13500190" && /Rua 6, 2572/.test(fund.endereco), "contato da Fundação de Saúde conforme o CNES");
assert(/cnes2\.datasus\.gov\.br/.test(fund.fonte_url) && /desatualizados/.test(fund.observacao), "dado do CNES deve citar a fonte e avisar que pode estar desatualizado");
const apae = catalogo.servicos.filter((s) => s.subtipo === "apae");
assert.strictEqual(apae.length, 2, "o site da APAE lista duas unidades de atendimento");
assert.strictEqual(porNome["APAE Rio Claro – Unidade Central"].telefone, "(19) 2112-2700 / (19) 99694-2420 (WhatsApp)");
assert.strictEqual(porNome["APAE Rio Claro – Unidade Assistência Social I"].telefone, "(19) 3597-0323");
apae.forEach((s) => assert(s.fonte_url === "https://apaerioclaro.com.br/" && /Casa 1|Casa 2|Jardim Claret \(Bairro\)|Bairro do Estádio/i.test(s.observacao + s.endereco) === false,
  "APAE: fonte do site oficial e sem localização das residências inclusivas: " + s.nome));
assert.strictEqual(catalogo.servicos.filter((s) => s.subtipo === "scfv").length, 13, "a página oficial lista 13 unidades de convivência");
catalogo.servicos.filter((s) => ["cras", "creas", "scfv"].includes(s.subtipo)).forEach((s) =>
  assert(s.conferido !== false && s.fonte_url.startsWith("https://desenvolvimentosocial.rc.sp.gov.br/"), "fonte da Secretaria: " + s.nome));
catalogo.servicos.filter((s) => s.conferido === false).forEach((s) => assert(/não conferida/.test(s.fonte) || (s.aviso && s.aviso.length > 20), "item não conferido sem alerta: " + s.nome));
assert(app.includes("Ainda não conferido na página oficial") && app.includes("s.aviso") && app.includes("s.conferido === false"), "a interface deve avisar quando o item não foi conferido");

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
assert(!assistencia.pendencias.some((p) => /CREAS: endereço/.test(p)), "o CREAS já tem cadastro: não pode constar como pendente");
assert(assistencia.pendencias.some((p) => /Horário de funcionamento dos CRAS/.test(p)), "a falta de horário dos CRAS/CREAS deve estar declarada");
assert(assistencia.pendencias.some((p) => /Conselho Tutelar/.test(p)), "a falta de horário/plantão do Conselho Tutelar deve estar declarada");
assert(Areas.porId("saude").pendencias.length, "Saúde deve declarar a lacuna quando o CNES não está carregado");
const redeSaude = Areas.porId("saude").listaRede;
const nGrupo = Object.fromEntries(redeSaude.grupos.map((g) => [g.titulo, g.itens.length]));
assert.strictEqual(nGrupo["Pronto atendimento 24 horas (UPA)"], 2, "Rio Claro tem 2 UPAs 24 horas");
assert.strictEqual(nGrupo["Hospital"], 1);
assert.strictEqual(nGrupo["Saúde mental (CAPS)"], 3);
assert.strictEqual(nGrupo["Unidades básicas de saúde (UBS e USF)"], 21);
const codigos = redeSaude.grupos.flatMap((g) => g.itens.map((i) => i[0]));
assert.strictEqual(codigos.length, 32);
assert.strictEqual(new Set(codigos).size, codigos.length, "código CNES repetido");
codigos.forEach((c) => assert(/^\d{7}$/.test(c), "código CNES inválido: " + c));
assert(redeSaude.grupos.every((g) => g.itens.every((i) => i[1].length > 8)), "nome de unidade vazio ou curto");
assert(/cnes2\.datasus\.gov\.br/.test(redeSaude.fonte[1]) && /3522-3600/.test(redeSaude.nota));
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
["web/dados/demo", "web/prototipos", "docs/roteiro_demo_mism3.md"].forEach((c) => assert(!fs.existsSync(path.join(web, "..", c)), "conteúdo de demonstração removido não pode voltar: " + c));
assert(app.includes("history.state && history.state.app"), "Voltar deve usar o histórico apenas quando a navegação começou no sistema");
assert(app.includes("linksTelefone") && !/replace\(\/\[\^\\d\+\]\/g, ""\)\) \+ '">' \+ esc\(s\.telefone/.test(app), "telefones múltiplos devem ter um link cada");
assert(app.includes("PREFERIDA") && app.includes("grupo-recolhido"), "unidades de convivência devem ficar em grupos recolhidos, em ordem por público");
assert(app.includes('/^cnes-/.test(String(s.id'), "a base do CNES deve ser detectada pelo id cnes-, não por menção ao CNES na fonte (a Fundação de Saúde cita o CNES e é cadastro manual)");
assert(app.includes("busca-por-cep"), "a busca por CEP deve continuar existindo");
assert(css.includes(".emergencia>summary") && css.includes("min-height:44px"), "alvos de toque devem ter pelo menos 44px");
assert(!/prefers-color-scheme:\s*dark/.test(css), "a interface deve manter o fundo claro");

console.log("dashboard.test.js: sete portas, emergência, navegação, nenhum conteúdo de demonstração, links locais e conteúdo das áreas passaram");
