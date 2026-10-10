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
assert(fund && fund.tipo === "saude" && fund.telefone === "(19) 3525-4717 / (19) 3522-3600" && /Rua 6, 2580, Santa Cruz/.test(fund.endereco), "sede da Fundação conforme a página da própria Fundação");
assert(/Rua 6, 2572, Centro/.test(fund.observacao) && /3522-3600/.test(fund.observacao) && /confirme por telefone/.test(fund.observacao), "a divergência entre a página e o CNES deve ficar à vista");
assert(fund.cnes === "6361528" && /saude-rioclaro\.org\.br\/enderecos\.htm/.test(fund.fonte_url));

/* ---- 5c. Unidades de saúde: página "Endereços das unidades de saúde" da Fundação (10/10/2026) ---- */
const saude = catalogo.servicos.filter((s) => s.tipo === "saude");
const por = (g) => saude.filter((s) => s.grupo === g);
assert.strictEqual(por("Unidades básicas de saúde (UBS e USF)").length, 22, "a página lista 4 UBS e 18 USF");
assert.strictEqual(por("Pronto atendimento 24 horas").length, 3);
assert.strictEqual(por("Saúde mental (CAPS)").length, 3);
const upas = saude.filter((s) => /^UPA/.test(s.nome));
assert.strictEqual(upas.length, 2, "Rio Claro tem 2 UPAs");
upas.forEach((u) => assert(u.horario === "24 horas" && u.subtipo === "urgencia", "UPA 24 horas: " + u.nome));
assert.strictEqual(porNome["UPA do Cervezão"].telefone, "(19) 3533-7272");
assert.strictEqual(porNome["UPA — Unidade de Pronto Atendimento (Av. 29)"].telefone, "(19) 3522-1818");
assert.strictEqual(porNome["CAPS III “18 de Maio”"].horario, "24 horas");
assert.strictEqual(porNome["USF Mãe Preta I/II"].horario, "Dias úteis, das 7h às 19h", "três USFs funcionam até as 19h");
assert.strictEqual(saude.filter((s) => /às 19h/.test(s.horario || "")).length, 3);
assert.strictEqual(porNome["USF Terra Nova"].cnes || "", "", "sem correspondência segura no CNES: o código não pode ser chutado");
assert.strictEqual(porNome["USF Ferraz"].cnes || "", "");
const cn = saude.map((s) => s.cnes).filter(Boolean);
assert.strictEqual(new Set(cn).size, cn.length, "código CNES repetido no catálogo");
cn.forEach((c) => assert(/^\d{7}$/.test(c), "código CNES inválido: " + c));
assert(/Rua M9, 66/.test(porNome["UPA do Cervezão"].endereco) && /Rua M-9, 66/.test(porNome["CAPS III “18 de Maio”"].endereco), "o mesmo endereço aparece em duas unidades na fonte e deve vir com aviso");
assert(/confirme o local por telefone/.test(porNome["UPA do Cervezão"].observacao) && /confirme o local por telefone/.test(porNome["CAPS III “18 de Maio”"].observacao));
const hosp = porNome["Hospital Público Municipal Maria Thereza Ramos Vitti"];
assert(hosp && !hosp.endereco && !hosp.telefone && hosp.cnes === "5550874", "o hospital municipal só consta por nome: nada pode ser inventado");
saude.forEach((s) => assert(s.fonte_url && s.verificado_em && s.fonte, "unidade sem fonte: " + s.nome));
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
const moradiaCanais = Areas.porId("moradia").secoes.flatMap((s) => s.canais || []);
const moradiaLinks = Areas.porId("moradia").secoes.flatMap((s) => s.links);
const elektro = moradiaCanais.find((c) => /Elektro/.test(c.nome));
assert(elektro && elektro.sem_tel === true && /Avenida 7, nº 190/.test(elektro.texto) && /8h às 17h/.test(elektro.texto) && /2122-1696/.test(elektro.texto), "canal da Elektro conforme a notícia");
assert(/17\/12\/2020/.test(elektro.aviso) && /17\/12\/2020/.test(elektro.fonte[2]), "notícia de 2020 deve ser sinalizada como possivelmente desatualizada");
assert(!/tel:.*2122/.test(JSON.stringify(elektro)), "o número do WhatsApp não pode virar link de ligação");
assert(moradiaLinks.some((l) => l[1] === "https://www.gov.br/aneel/pt-br/assuntos/tarifas/tarifa-social" && /ANEEL/.test(l[0])), "link da ANEEL sobre a tarifa social");
assert(Areas.porId("moradia").pendencias.some((p) => /Elektro/.test(p) && /não verifica critérios/.test(p)), "o sistema não deve afirmar critérios de elegibilidade da tarifa social");
assert(!Areas.porId("moradia").pendencias.some((p) => /link oficial ainda não foi verificado/.test(p)), "pendência de link resolvida");
assert(moradiaLinks.some((l) => l[1] === "https://daaerioclaro.sp.gov.br/linha-0800-do-daae-passa-a-atender-whatsapp/" && /0800/.test(l[0])), "link do aviso do DAAE sobre o 0800 por WhatsApp");
assert(!/0800 ?\d/.test(JSON.stringify(Areas.porId("moradia"))), "nenhum número 0800 pode ser escrito sem fonte lida");
const daae = moradiaLinks.find((l) => l[1] === "https://daaerioclaro.sp.gov.br/familias-de-baixa-renda-podem-solicitar-desconto-ao-daae-na-conta-de-agua-e-esgoto/");
assert(daae && /DAAE/.test(daae[0]), "link do site do DAAE sobre o desconto na conta de água");
const agua = moradiaCanais.find((c) => /Água e Esgoto — DAAE/.test(c.nome));
const aguaTxt = agua.texto + JSON.stringify(agua.topicos);
["50% no consumo de até 15 m³", "25% na faixa de 16 a 20 m³", "Avenida 8A, nº 360", "8h30 às 15h30", "R$ 759", "CadÚnico", "BPC", "10 dias", "12 meses"].forEach((x) => assert(aguaTxt.includes(x), "informativo do DAAE: falta " + x));
assert(/Resolução ARES-PCJ nº 592\/2024/.test(agua.fonte[0]) && /reajustado/.test(agua.aviso), "o valor de renda acompanha o salário mínimo e deve vir com aviso");
assert(agua.sem_tel === true, "o informativo não traz telefone: nenhum número pode ser inventado");
const neo = moradiaLinks.find((l) => l[1] === "https://www.neoenergia.com/tarifa-social");
assert(neo && /confirme se as regras e os canais valem para a Elektro/.test(neo[2]), "a página da Neoenergia pode cobrir outros estados: o cartão deve pedir para confirmar que vale para a Elektro");
assert.strictEqual(Areas.porId("inexistente"), null);

/* ---- 6b. Sem caixa de busca por necessidade: nem na tela inicial nem dentro das áreas ---- */
assert(!/id="form-necessidade"|id="necessidade"|Não encontrou\?/.test(index), "a caixa de busca por necessidade foi retirada");
assert(!/form-necessidade|resposta-necessidade|areasDaNecessidade|AREA_DA_NECESSIDADE/.test(app + ler("areas.js")), "não pode sobrar código da caixa retirada");
assert(app.includes("MISM3Necessidades.normalizar") && index.includes('src="necessidades.js"'), "a busca de bairro usa a normalização de texto do módulo, que deve continuar carregado");
assert(index.includes('class="pular"'), "falta o link para pular ao conteúdo");

/* ---- 6c. Fontes arquivadas: todo PDF citado no LEIA-ME existe, e todo PDF da pasta está explicado ---- */
const pastaFontes = path.join(web, "..", "docs", "documetacao");
const leia = fs.readFileSync(path.join(pastaFontes, "LEIA-ME.md"), "utf8");
const citados = Array.from(leia.matchAll(/`([\w.-]+\.pdf)`/g), (m) => m[1]).filter((f, i, a) => a.indexOf(f) === i);
const existentes = fs.readdirSync(pastaFontes).filter((f) => f.endsWith(".pdf"));
citados.forEach((f) => assert(existentes.includes(f), "PDF citado no LEIA-ME não existe: " + f));
existentes.forEach((f) => assert(citados.includes(f), "PDF sem explicação no LEIA-ME: " + f));
assert(existentes.length >= 10, "as dez fontes arquivadas devem estar na pasta");
assert(!existentes.some((f) => /matrix|regrasaneel/i.test(f)), "o blog comercial não é fonte e não deve ser arquivado");

/* ---- 6d. Arquivos sensíveis nunca vão ao GitHub por engano ---- */
const ignorados = fs.readFileSync(path.join(web, "..", ".gitignore"), "utf8").split(/\r?\n/).map((l) => l.trim());
[".env", "*.db", "*.sqlite", "*.backup"].forEach((p) => assert(ignorados.includes(p), ".gitignore deve bloquear " + p));

/* ---- 6e. O catálogo verificado vale sempre; o servicos.json do pipeline só acrescenta ---- */
assert(app.includes("dados/catalogo_manual.json") && app.includes("idsManuais") && app.includes("codigosManuais"), "o catálogo verificado deve ser carregado sempre e prevalecer sobre o servicos.json");
assert(!/tentativas\s*=/.test(app), "um servicos.json antigo não pode substituir o catálogo verificado (voltaria a esconder CRAS e CREAS)");

/* ---- 6f. De Mulher para Mulher: caminhos por situação, só com itens do catálogo e sem prender a uma doença ---- */
const sits = Areas.REDE_MULHERES.situacoes;
assert.strictEqual(sits.length, 7, "sete caminhos");
assert.strictEqual(new Set(sits.map((s) => s.id)).size, sits.length);
sits.forEach((s) => {
  assert(s.titulo && s.texto.length > 60, "caminho sem texto: " + s.id);
  s.itens.forEach((id) => assert(catalogo.servicos.some((x) => x.id === id), "o caminho " + s.id + " cita um item que não existe no catálogo: " + id));
  s.canais.forEach((tel) => assert(Areas.EMERGENCIA.some((c) => c.tel === tel), "canal sem contato oficial: " + tel));
  s.atalhos.forEach((a) => assert(/^index\.html#(trabalho|educacao|saude|direitos|moradia|assistencia)$/.test(a[1]), "atalho inválido: " + a[1]));
  assert(!/câncer|cancer|mamografia|oncolog|quimio/i.test(s.titulo + " " + s.texto), "os caminhos não devem ficar presos a uma doença: " + s.id);
});
assert(/190/.test(sits[0].texto) && /180/.test(sits[0].texto) && /24 horas/.test(sits[0].texto));
["man-cram", "man-ddm-rio-claro", "man-patrulha-maria-da-penha", "man-defensoria-nudem", "man-cadu"].forEach((id) => {
  const s = catalogo.servicos.find((x) => x.id === id);
  assert(s && s.conferido === false && s.aviso && /MISM2/.test(s.aviso + s.fonte), "item trazido do MISM2 deve constar como não conferido, citando a origem: " + id);
  assert(s.fonte_url.startsWith("https://"), "item sem fonte: " + id);
});
assert(!catalogo.servicos.find((x) => x.id === "man-ddm-rio-claro").telefone, "a DDM não tem telefone confiável: nada pode ser inventado");
assert.strictEqual(catalogo.servicos.find((x) => x.id === "man-cram").telefone, "(19) 3532-4014 / (19) 3525-1366");
assert(!/fictíci|protótipo|\[DEMO\]|Ana Exemplo/i.test(rede), "a página não pode ter conteúdo fictício");
assert(rede.includes('src="areas.js"') && rede.includes('id="caminhos"') && !/<style/.test(rede), "a página usa só os componentes já existentes: nenhum estilo novo");

/* ---- 7. Comportamento esperado no código ---- */
["web/dados/demo", "web/prototipos", "docs/roteiro_demo_mism3.md"].forEach((c) => assert(!fs.existsSync(path.join(web, "..", c)), "conteúdo de demonstração removido não pode voltar: " + c));
assert(app.includes("history.state && history.state.app"), "Voltar deve usar o histórico apenas quando a navegação começou no sistema");
assert(app.includes("linksTelefone") && !/replace\(\/\[\^\\d\+\]\/g, ""\)\) \+ '">' \+ esc\(s\.telefone/.test(app), "telefones múltiplos devem ter um link cada");
assert(app.includes("PREFERIDA") && app.includes("grupo-recolhido"), "unidades de convivência devem ficar em grupos recolhidos, em ordem por público");
assert(app.includes("busca-por-cep"), "a busca por CEP deve continuar existindo");
assert(css.includes(".emergencia>summary") && css.includes("min-height:44px"), "alvos de toque devem ter pelo menos 44px");
assert(!/prefers-color-scheme:\s*dark/.test(css), "a interface deve manter o fundo claro");

console.log("dashboard.test.js: sete portas, emergência, navegação, nenhum conteúdo de demonstração, links locais e conteúdo das áreas passaram");
