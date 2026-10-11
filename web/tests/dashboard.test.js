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
/* O nome antigo ("De Mulher para Mulher") é slogan conhecido de uma rede de lojas: não pode voltar a aparecer no site. */
["index.html", "rede-mulheres.html", "areas.js", "app.js"].forEach((f) => assert(!/de mulher (para|pra) mulher/i.test(fs.readFileSync(path.join(__dirname, "..", f), "utf8")), "nome antigo em " + f));
const NOMES = ["Trabalho", "Educação", "Saúde", "Direitos", "Moradia", "Assistência Social", "Entre Mulheres"];
const inicio = index.slice(index.indexOf('<section id="inicio-tela"'), index.indexOf('<section id="area"'));
const portas = Array.from(inicio.matchAll(/<a class="porta" href="([^"]+)">.*?<strong>([^<]+)<\/strong>/g), (m) => ({ href: m[1], nome: m[2].trim() }));
assert.deepStrictEqual(portas.map((p) => p.nome), NOMES, "a tela inicial deve ter exatamente as sete portas, na ordem definida");
assert.strictEqual((index.match(/class="porta"/g) || []).length, 7, "não pode haver outros botões de porta");
assert.deepStrictEqual(portas.slice(0, 6).map((p) => p.href), Areas.AREAS.map((a) => "#" + a.id), "cada porta deve apontar para a sua área");
assert.deepStrictEqual(Areas.AREAS.map((a) => a.nome), NOMES.slice(0, 6), "os nomes das áreas devem ser os mesmos das portas");
assert.strictEqual(portas[6].href, "rede-mulheres.html", "Entre Mulheres é uma página independente");

/* ---- 2. A tela inicial acolhe e orienta, mas não traz o detalhe das áreas ----
   Pode citar serviços em frases curtas e nos contatos essenciais (CRAS, CREAS, Conselho Tutelar). Não pode trazer o conteúdo
   detalhado (programas, critérios, órgãos específicos) nem endereço ou horário: isso só aparece depois de escolher a área. */
["Fundo Social", "Procon", "Defensoria", "tarifa social"].forEach((t) =>
  assert(!inicio.includes(t), "a tela inicial não deve expor conteúdo detalhado de área: " + t));
assert(!/\b(Rua|Avenida|Av\.)\s/.test(inicio) && !/\d{1,2}h\b|\d{1,2}:\d{2}/.test(inicio), "a tela inicial não deve trazer endereço nem horário");
assert(!/<form/.test(inicio) && !/<input/.test(inicio), "a tela inicial não tem formulários nem campos de busca");
assert.strictEqual((inicio.match(/<textarea/g) || []).length, 1, "o único campo da tela inicial é a caixa da IA (Conte com suas palavras)");

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
    const interno = l[1].charAt(0) === "#";
    assert(/^https:\/\//.test(l[1]) || (interno && Areas.AREAS.some((x) => "#" + x.id === l[1])), a.id + ": link sem https e que não aponta para uma área existente: " + l[1]);
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

/* ---- 6b. A caixa "Conte com suas palavras" é a IA da tela inicial: um campo só, que não envia nem guarda nada ---- */
assert(/id="ia-caixa"/.test(index) && /id="ia-texto"/.test(index) && /Conte com suas palavras/.test(index), "falta a caixa da IA na tela inicial");
assert(/aprendizado de máquina/.test(index) && /n[ãa]o é enviado/.test(index) && /pode errar/.test(index), "a caixa deve explicar o que é, que não envia o texto e que pode errar");
assert(index.includes('src="ia.js"') && index.indexOf('src="ia.js"') > index.indexOf('src="necessidades.js"'), "ia.js deve carregar depois de necessidades.js");
assert(/limparIA\(\)/.test(app) && /sair-rapido[\s\S]{0,200}limparIA\(\)/.test(app), "o texto digitado deve ser apagado ao sair da tela e no botão de sair rápido");
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

/* ---- 6f. Entre Mulheres: mulheres oferecem serviços a mulheres; categorias fixas, ofertas só com consentimento, nada inventado ---- */
const cats = Areas.REDE_OFERTAS.categorias;
assert(cats.length >= 8 && new Set(cats.map((c) => c.id)).size === cats.length, "categorias únicas");
cats.forEach((c) => assert(c.titulo && c.exemplo.length > 20, "categoria incompleta: " + c.id));
["transporte", "saude-mental", "atividade-fisica"].forEach((id) => assert(cats.some((c) => c.id === id), "falta a categoria " + id));
const ofertas = JSON.parse(fs.readFileSync(path.join(web, "dados", "ofertas_mulheres.json"), "utf8"));
assert(Array.isArray(ofertas.ofertas), "ofertas deve ser uma lista");
ofertas.ofertas.forEach((o) => {
  assert(cats.some((c) => c.id === o.categoria), "oferta com categoria inexistente: " + o.id);
  assert(o.nome && o.descricao && o.contato, "oferta incompleta: " + o.id);
  assert(/^\d{4}-\d{2}-\d{2}$/.test(o.consentimento_em || ""), "oferta sem data de consentimento, não pode ser publicada: " + o.id);
});
assert(!/fictíci|protótipo|\[DEMO\]|Ana Exemplo|Maria Exemplo/i.test(rede + JSON.stringify(ofertas)), "a página não pode ter conteúdo fictício");
assert(!/identidade verificada|selo de confiança/i.test(rede.replace(/nenhum selo[^<]*/i, "")), "não prometer verificação que não existe");
assert(rede.includes('src="areas.js"') && rede.includes('id="categorias"') && ler("entre-mulheres-ui.js").includes("ofertas_mulheres.json") && !/<style/.test(rede), "a página lê as ofertas do arquivo de dados e não tem estilo embutido");
assert(!rede.includes("REDE_MULHERES") && !/Em que ponto você está/.test(rede), "os caminhos de acolhimento não fazem parte desta página");

/* ---- 7. Comportamento esperado no código ---- */
["web/dados/demo", "web/prototipos", "docs/roteiro_demo_mism3.md"].forEach((c) => assert(!fs.existsSync(path.join(web, "..", c)), "conteúdo de demonstração removido não pode voltar: " + c));
assert(app.includes("history.state && history.state.app"), "Voltar deve usar o histórico apenas quando a navegação começou no sistema");
assert(app.includes("linksTelefone") && !/replace\(\/\[\^\\d\+\]\/g, ""\)\) \+ '">' \+ esc\(s\.telefone/.test(app), "telefones múltiplos devem ter um link cada");
assert(app.includes("PREFERIDA") && app.includes("grupo-recolhido"), "unidades de convivência devem ficar em grupos recolhidos, em ordem por público");
assert(app.includes("busca-por-cep"), "a busca por CEP deve continuar existindo");
assert(css.includes(".emergencia>summary") && css.includes("min-height:44px"), "alvos de toque devem ter pelo menos 44px");
assert(!/prefers-color-scheme:\s*dark/.test(css), "a interface deve manter o fundo claro");

/* ---- Trabalho: jornada, currículo e cursos profissionalizantes ---- */
assert(Areas.AREAS.find((a) => a.id === "trabalho").jornada === true, "a área Trabalho deve abrir a jornada");
const ordemScripts = Array.from(index.matchAll(/<script src="([^"]+)"/g), (m) => m[1]);
assert(ordemScripts.indexOf("jornada.js") !== -1 && ordemScripts.indexOf("jornada.js") < ordemScripts.indexOf("jornada-ui.js") && ordemScripts.indexOf("jornada-ui.js") < ordemScripts.indexOf("app.js"), "scripts da jornada devem carregar antes do app.js");
const cat = JSON.parse(ler("dados/catalogo_manual.json")); const lista = Array.isArray(cat) ? cat : cat.servicos;
["man-senai-rio-claro", "man-senac-rio-claro", "man-sestsenat", "man-sestsenat-cursos", "man-etec-cps", "man-etec-rio-claro", "man-sesi-rio-claro", "man-sesi-eja", "man-faculdade-sesi", "man-fatec-ia", "man-fatec-esg"].forEach((id) => {
  const s = lista.find((x) => x.id === id);
  assert(s && s.tipo === "emprego_curso" && s.fonte_url && s.verificado_em, "curso profissionalizante ausente ou sem fonte/data: " + id);
});
const sest = lista.find((x) => x.id === "man-sestsenat");
assert(sest.conferido !== false && /3522-1710/.test(sest.telefone) && /0800 700 9393/.test(sest.telefone) && sest.fonte_url === "https://www.sestsenat.org.br/home", "SEST SENAT: unidade confirmada por telefone, com o 0800 e o link do site");
assert(/sócios/.test(sest.observacao), "o cartão do SEST SENAT deve dizer que a página da cidade é para sócios");
const sestCursos = lista.find((x) => x.id === "man-sestsenat-cursos");
assert(sestCursos.fonte_url === "https://www.sestsenat.org.br/cursos" && /mudam|muda/.test(sestCursos.observacao), "o cartão de cursos do SEST SENAT remete à página e diz que a lista muda");
assert(!/NR ?35|Liderança|Webaula de|Transporte de Cargas/i.test(JSON.stringify(sestCursos)), "o SEST SENAT não deve enumerar cursos, que mudam a cada período");
lista.filter((x) => x.tipo === "emprego_curso").forEach((x) => assert(x.grupo, "serviço de Trabalho sem grupo ficaria escondido atrás de \"Mostrar todos\": " + x.id));
assert(Areas.AREAS.find((a) => a.id === "trabalho").secoes[0].agrupar === true, "a lista de Trabalho deve ser agrupada, não limitada a 12 cartões");
const trab = Areas.AREAS.find((a) => a.id === "trabalho").secoes[0], edu = Areas.AREAS.find((a) => a.id === "educacao").secoes.find((s) => s.agrupar);
["curso_superior_tecnologia", "graduacao"].forEach((st) => {
  assert(!trab.subtipos.includes(st) && edu.subtipos.includes(st), "educação pura pertence só à área Educação: " + st);
});
assert(!trab.grupos.includes("Concluir os estudos e graduação (SESI)"), "Trabalho não mostra o grupo de conclusão dos estudos: isso é da Educação");
const JUNTO = "Estudar e se qualificar ao mesmo tempo";
assert(trab.grupos.includes(JUNTO), "Trabalho deve mostrar o grupo que combina estudo e qualificação");
["man-etec-rio-claro", "man-sesi-eja", "man-sesi-rio-claro"].forEach((id) =>
  assert(lista.find((x) => x.id === id).grupo.split(";").includes(JUNTO), "oferta que combina escolaridade e qualificação deve estar no grupo conjunto: " + id));
["curso_profissionalizante", "curso_tecnico"].forEach((st) => {
  assert(trab.subtipos.includes(st) && edu.subtipos.includes(st), "cursos profissionalizantes e técnicos servem a Educação e a Trabalho: " + st);
});
const aparece = (sec, x) => sec.subtipos.includes(x.subtipo) && (!sec.grupos || x.grupo.split(";").some((g) => sec.grupos.includes(g)));
lista.filter((x) => x.tipo === "emprego_curso").forEach((x) =>
  assert(aparece(trab, x) || aparece(edu, x), "serviço sem área (subtipo ou grupo não coberto): " + x.id + " " + x.subtipo));
assert(Areas.AREAS.find((a) => a.id === "trabalho").secoes[0].links.some((l) => l[1] === "#educacao"), "Trabalho deve apontar para a área Educação");
lista.filter((x) => x.subtipo === "curso_profissionalizante").forEach((x) => assert(/profissionalizantes/.test(x.grupo) && !/técnicos/.test(x.grupo), "curso profissionalizante deve ficar no grupo próprio: " + x.id));
lista.filter((x) => x.subtipo === "curso_tecnico").forEach((x) => assert(/técnicos/.test(x.grupo), "curso técnico deve estar no grupo de técnicos: " + x.id));
["man-etec-cps", "man-etec-rio-claro"].forEach((id) => {
  const g = lista.find((x) => x.id === id).grupo.split(";");
  assert(g.some((x) => /técnicos/.test(x)) && !g.some((x) => /profissionalizantes/.test(x)), "a Etec fica nos grupos de técnicos (e no conjunto), sem repetir em profissionalizantes: " + id);
});
const maesSec = Areas.AREAS.find((a) => a.id === "educacao").secoes[0];
assert(/filhos/.test(maesSec.titulo) && maesSec.canais.length >= 6, "Educação deve começar com o passo a passo para os filhos (matrícula, transferência, vagas)");
const areaEdu = Areas.AREAS.find((a) => a.id === "educacao");
assert(areaEdu.guia && areaEdu.guia.itens.length === 3, "a Educação deve abrir com a caixa que explica o que há para os filhos, para a mãe e no Trabalho");
assert(areaEdu.guia.itens.some((i) => /Para você/.test(i.titulo) && /profissionalizantes/.test(i.texto) && /EJA/.test(i.texto)), "a caixa deve dizer que há cursos profissionalizantes e EJA para a própria mãe");
areaEdu.guia.itens.filter((i) => i.ancora).forEach((i) => assert(areaEdu.secoes.some((sec) => sec.ancora === i.ancora), "o botão deve levar a uma seção existente: " + i.ancora));
assert(areaEdu.guia.itens.some((i) => i.href === "#trabalho"), "a caixa deve apontar para a área Trabalho");
const secVoce = areaEdu.secoes.find((sec) => sec.ancora === "educacao-voce");
assert(secVoce && /Para você/.test(secVoce.titulo) && /Você também pode estudar/.test(secVoce.descricao), "a seção de cursos deve se dirigir à própria mãe");
assert(/data-rolar/.test(ler("app.js")) && /secao-recolhida/.test(ler("app.js")), "o botão da caixa deve rolar e abrir seção recolhida");
["matricular", "transferência", "vaga"].forEach((t) => assert(maesSec.canais.some((c) => c.nome.toLowerCase().includes(t)), "falta o cartão sobre: " + t));
assert(maesSec.canais.some((c) => /tipo de escola/i.test(c.nome)), "falta o cartão com o caminho de cada tipo de escola");
assert(JSON.stringify(maesSec).includes("Inscrição não é vaga"), "deve explicar a diferença entre inscrição e vaga");
assert(/2027/.test(JSON.stringify(maesSec)) && /não valem para 2027/.test(JSON.stringify(maesSec)), "o calendário de 2026 não pode ser apresentado como o de 2027");
assert(/2027/.test(Areas.AREAS.find((a) => a.id === "educacao").pendencias.join(" ")), "a pendência deve citar o calendário de 2027");
assert(!/\(\d{2}\)\s?\d{4}|\d{4}-\d{4}/.test(JSON.stringify(maesSec).replace(/https?:[^"\s]*/g, "")), "o passo a passo das mães não deve conter telefones sem fonte (endereços de links não contam)");
assert(Areas.AREAS.find((a) => a.id === "educacao").pendencias.some((p) => /Rio Claro/.test(p) && /fonte oficial/.test(p)), "Educação deve declarar que as regras locais ainda não vieram de fonte oficial");
const caduCard = maesSec.canais.find((c) => /CADU/.test(c.nome));
assert(caduCard && caduCard.topicos.length >= 5, "falta o passo a passo da matrícula pelo aplicativo CADU");
["Serviços", "Educação", "Matrícula e Rematrícula", "Iniciar nova solicitação", "Matrícula Escolar"].forEach((t) =>
  assert(JSON.stringify(caduCard).includes(t), "o passo a passo do CADU deve citar: " + t));
assert(/17 de outubro de 2025/.test(JSON.stringify(caduCard)) && /2027/.test(JSON.stringify(caduCard)), "o CADU deve citar a fonte oficial e lembrar que 2027 precisa de confirmação");
assert(/biometria/.test(JSON.stringify(caduCard)) && /notificação/.test(JSON.stringify(caduCard)), "o passo a passo deve cobrir cadastro (biometria) e acompanhamento por notificação");
const secEdu = Areas.AREAS.find((a) => a.id === "educacao");
assert(/não foi conferida por nós/.test(JSON.stringify(secEdu.secoes[0].canais.find((c) => /tipo de escola/i.test(c.nome)))), "a consulta da SED (rede estadual) continua marcada como não conferida");
const docsCard = maesSec.canais.find((c) => /Documentos em situações específicas/.test(c.nome));
assert(docsCard && docsCard.topicos.length >= 6 && /não foi conferida em fonte oficial/.test(docsCard.aviso), "os documentos indicados só pela pesquisa devem estar marcados como não conferidos");
const negada = maesSec.canais.find((c) => /negada/.test(c.nome));
["Conselho Tutelar", "Defensoria", "Ministério Público", "registro de que não há vaga"].forEach((t) => assert(JSON.stringify(negada).includes(t), "vaga negada deve citar: " + t));
const estadual = maesSec.canais.find((c) => /Calendário de 2027 das escolas estaduais/.test(c.nome));
assert(estadual && /Resolução SEDUC nº 80/.test(estadual.fonte[0]) && /conferido por nós/.test(estadual.fonte[2]), "o calendário estadual deve citar a Resolução SEDUC nº 80, conferida");
["11 de fevereiro de 2027", "22 de dezembro de 2027", "6 de julho de 2027", "26 de julho de 2027", "19 de janeiro", "200 dias letivos"].forEach((t) =>
  assert(JSON.stringify(estadual).includes(t), "calendário estadual deve conter: " + t));
assert(/não menciona a Copa/.test(JSON.stringify(estadual)) && /rede estadual/.test(estadual.texto) && /rede municipal de Rio Claro/.test(JSON.stringify(estadual)), "o calendário estadual não pode ser apresentado como o da rede municipal de Rio Claro");
const ferias = maesSec.canais.find((c) => /Férias escolares de 2027/.test(c.nome));
assert(ferias && /15\.421/.test(JSON.stringify(ferias)) && /art\. 67/.test(JSON.stringify(ferias)), "o cartão das férias de 2027 deve citar a Lei 15.421, art. 67");
assert(/A lei não traz as datas/.test(JSON.stringify(ferias)) && /Parecer CNE\/CEB nº 7\/2026/.test(JSON.stringify(ferias)) && /24 de junho a 25 de julho de 2027/.test(JSON.stringify(ferias)), "as datas da Copa vêm do parecer do CNE, não da lei");
assert(/DOU de 8\/9\/2026/.test(ferias.fonte[0]) && /conferidos por nós/.test(ferias.fonte[2]), "o parecer homologado deve ser citado como fonte conferida");
assert(/Rio Claro não é cidade-sede e não terá jogos da Copa/.test(JSON.stringify(ferias)) && /3\.481\/2026/.test(JSON.stringify(ferias)), "deve dizer que Rio Claro não é sede e que o projeto de lei pode mudar a regra");
assert(/autonomia/.test(JSON.stringify(ferias)) && /diretamente impactad/.test(JSON.stringify(ferias)), "deve explicar a diferença entre cidades impactadas e demais redes");
assert(/Isto não é o calendário de matrícula/.test(JSON.stringify(ferias)), "férias não podem ser confundidas com o calendário de matrícula");
const solo = maesSec.canais.find((c) => /sozinha/i.test(c.nome));
assert(solo && solo.topicos.length >= 6, "falta o cartão de apoio para mães que criam os filhos sozinhas");
["Documentos", "Prioridade na vaga", "Horário", "Quem busca a criança", "violência", "Pensão e guarda", "assistência social"].forEach((t) =>
  assert(JSON.stringify(solo).includes(t), "o cartão de mães solo deve tratar de: " + t));
assert(/não confirmou se esse critério existe/.test(JSON.stringify(solo)), "a prioridade de vaga não pode ser afirmada sem fonte");
assert(!/\(\d{2}\)\s?\d{4}|\d{4}-\d{4}/.test(JSON.stringify(solo)), "o cartão de mães solo não deve conter telefones sem fonte");
assert(/@media print/.test(css) && /folha-impressao/.test(css), "deve haver estilo de impressão para o plano e o currículo");
assert(!/localStorage|sessionStorage|document\.cookie/.test(ler("jornada-ui.js") + ler("jornada.js")), "a jornada não pode guardar nada no aparelho");
assert(!/fetch\(|XMLHttpRequest|sendBeacon/.test(ler("jornada-ui.js") + ler("jornada.js")), "a jornada não pode enviar nada pela rede");


// Escolas municipais (página oficial "Unidades de ensino", 11/10/2026)
const escolas = lista.filter((x) => x.subtipo === "escola_municipal");
assert(escolas.length === 68, "devem estar cadastradas as 68 escolas municipais da página oficial; achei " + escolas.length);
assert(escolas.every((x) => x.tipo === "creche" && x.fonte_url === "https://www.educacaorc.com.br/?r=secretaria/unidadeEnsino" && x.verificado_em === "2026-10-11" && x.endereco), "toda escola deve ter fonte, data e endereço");
assert(new Set(escolas.map((x) => x.id)).size === 68, "ids das escolas devem ser únicos");
escolas.forEach((x) => assert(/^\(19\) \d{4,5}-\d{4}( \/ \(19\) \d{4,5}-\d{4})*$/.test(x.telefone) && !/0000/.test(x.telefone), "telefone da escola em formato inválido ou marcador vazio: " + x.nome + " " + x.telefone));
assert(!escolas.some((x) => x.cep === "16504450" || x.cep === "13500000"), "CEP errado ou genérico da fonte não deve virar localização");
assert(/não é de Rio Claro/.test(escolas.find((x) => /Clara Freire Castellano/.test(x.nome)).observacao), "o CEP errado da fonte deve estar explicado");
const rosa = escolas.find((x) => /Rosa Maria Castellano Pieroni/.test(x.nome));
assert(!/3522-1950/.test(rosa.telefone) && /linha da Secretaria/.test(rosa.observacao), "a linha da Secretaria não pode ser o telefone da escola");
assert(escolas.every((x) => /não diz quais etapas/.test(x.observacao)), "nenhuma escola pode ser apresentada como creche sem avisar que a etapa deve ser confirmada");
assert(escolas.find((x) => /Aparecida José Carlini Bonilha/.test(x.nome)).telefone === "(19) 3533-6633", "telefone da Aparecida Carlini Bonilha conforme a página oficial");
const secEsc = Areas.AREAS.find((a) => a.id === "educacao").secoes.find((sec) => sec.ancora === "educacao-escolas");
assert(secEsc && secEsc.recolhida && secEsc.filtro && JSON.stringify(secEsc.subtipos) === '["escola_municipal"]', "a lista de escolas deve ficar recolhida e com busca");
assert(Areas.AREAS.find((a) => a.id === "educacao").secoes.find((sec) => sec.titulo === "Canais oficiais").subtipos.join() === "secretaria", "os canais oficiais devem mostrar só o cartão da Secretaria");
assert(/data-filtro/.test(ler("app.js")) && /semAcento/.test(ler("app.js")), "a busca por nome ou bairro deve ignorar acentos");
// Brasão estilizado + aviso de projeto acadêmico (não oficial)
assert(/<img class="brasao" src="img\/brasao-estilizado\.webp"[^>]*width="\d+" height="\d+"[^>]*alt="Brasão estilizado de Rio Claro/.test(index), "o brasão deve ter alt, largura e altura");
assert(/estudo acadêmico de demonstração/.test(index) && /não é um site oficial da Prefeitura de Rio Claro/.test(index), "o rodapé deve dizer que o site é acadêmico e não oficial");
assert(/versão estilizada, apenas como ilustração/.test(index), "o brasão deve ser identificado como versão estilizada");
const brasaoArq = path.join(web, "img/brasao-estilizado.webp");
assert(fs.existsSync(brasaoArq) && fs.statSync(brasaoArq).size < 120 * 1024, "a imagem do brasão deve existir e ser leve (< 120 KB)");

/* ---- Tela inicial acolhedora: hero, emergência, contatos essenciais, acesso rápido e paleta ---- */
assert(/<h1 id="titulo-inicio"[^>]*>Você não está <em>sozinha<\/em><\/h1>/.test(index), "a tela inicial deve acolher: 'Você não está sozinha'");
assert(/<img src="img\/heroi-mulheres\.webp" width="\d+" height="\d+" alt=""/.test(index) && fs.statSync(path.join(web, "img/heroi-mulheres.webp")).size < 120 * 1024, "a ilustração do topo deve ser decorativa (alt vazio), ter largura e altura e ser leve");
assert(/Cada informação mostra a fonte e a data/.test(index), "a tela inicial só pode prometer o que o site cumpre: fonte e data");
assert(/id="abrir-emergencia"/.test(index) && /abrir-emergencia/.test(app) && /stopPropagation/.test(app), "a tela inicial deve ter o botão Emergência que abre o painel do topo");
["190", "192", "180", "100"].forEach((n) => assert(new RegExp('href="tel:' + n + '"').test(inicio), "contato essencial nacional ausente: " + n));
assert(!/Telefone a confirmar|a confirmar/i.test(inicio), "os contatos essenciais não podem ficar 'a confirmar'");
const idsLocais = Array.from(app.matchAll(/\["(man-[a-z0-9-]+)", "/g), (m) => m[1]);
assert(idsLocais.length >= 5, "contatos locais devem vir do catálogo por id");
idsLocais.forEach((id) => { const x = lista.find((y) => y.id === id); assert(x && x.telefone, "contato local sem telefone no catálogo: " + id); });
const links = Array.from(inicio.matchAll(/<a href="#([a-z-]+)(?:\/([a-z-]+))?">/g), (m) => ({ area: m[1], secao: m[2] }));
assert(links.length >= 5, "acesso rápido deve ter atalhos");
links.forEach((l) => {
  const area = Areas.AREAS.concat(Areas.EXTRAS).find((a) => a.id === l.area);
  assert(area, "atalho para área inexistente: " + l.area);
  if (l.secao) assert(area.secoes.some((sec) => sec.ancora === l.secao), "atalho para seção inexistente: " + l.area + "/" + l.secao);
});
assert(/split\("\/"\)/.test(app) && /rolarPara\(secao\)/.test(app), "a rota deve entender #área/seção");
assert(!/Mapa de serviços|Buscar no site|Legislação/.test(inicio), "a tela inicial não pode mostrar o que ainda não existe");

/* Contraste da paleta (WCAG): lido do :root do CSS */
const vars = Object.fromEntries(Array.from(css.slice(0, css.indexOf("}")).matchAll(/--([a-z-]+):(#[0-9a-f]{6})/g), (m) => [m[1], m[2]]));
const lum = (h) => { const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4))); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const razao = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
["bg", "card", "lilas", "lav", "verde", "rosa", "pessego", "hero"].forEach((f) => {
  assert(razao(vars.fg, vars[f]) >= 13, "texto principal com contraste menor que 13:1 sobre " + f + ": " + razao(vars.fg, vars[f]).toFixed(2));
});
["bg", "card", "lilas", "verde", "rosa", "pessego", "hero"].forEach((f) => {
  assert(razao(vars.mut, vars[f]) >= 5.5, "texto suave com contraste menor que 5,5:1 sobre " + f + ": " + razao(vars.mut, vars[f]).toFixed(2));
});
assert(razao("#ffffff", vars["pri-esc"]) >= 6.5 && razao("#ffffff", vars.alerta) >= 6.5, "texto branco sobre botões e emergência deve ter contraste >= 6,5:1");
["bg", "card", "rosa", "verde", "pessego"].forEach((f) => assert(razao(vars["pri-esc"], vars[f]) >= 6.5, "links com contraste menor que 6,5:1 sobre " + f));
// Nome do projeto: o mesmo em todos os lugares, com a cidade ao lado
assert(/class="marca"[^>]*>.*Mulher em Rede<span class="marca-local">Rio Claro<\/span>/.test(index) && /class="marca"[^>]*>.*Mulher em Rede<span class="marca-local">Rio Claro<\/span>/.test(rede), "o nome deve ser 'Mulher em Rede', com 'Rio Claro' ao lado, nas duas páginas");
assert(/<title>Mulher em Rede – Rio Claro<\/title>/.test(index) && /Mulher em Rede \(MISM3\)/.test(index), "título e rodapé devem usar o mesmo nome");
assert(!/Mulheres de Rio Claro/.test(index + rede + app), "o nome 'Mulheres de Rio Claro' sugere um site da cidade e não deve ser usado enquanto o projeto não for oficial");

/* ---- Transporte: horários da SOU, sem nada inventado ---- */
const onibus = JSON.parse(ler("dados/horarios_onibus.json"));
const transp = Areas.EXTRAS.find((a) => a.id === "transporte");
assert(transp && transp.horarios === true && transp.secoes.length === 0 && !Areas.AREAS.some((a) => a.id === "transporte"), "Transporte é uma área extra, fora das sete portas");
assert(Areas.porId("transporte") === transp, "a rota #transporte deve existir");
assert(/href="#transporte">Horários de ônibus</.test(inicio) && portas.length === 7, "a tela inicial leva ao Transporte por atalho, sem virar uma oitava porta");
assert(/htmlHorarios/.test(app) && /dados\/horarios_onibus\.json/.test(app) && /onibus: "i-onibus"/.test(app) && /id="i-onibus"/.test(index), "a interface dos horários deve existir");
assert(onibus.valido_ate === "2027-02-04" && onibus.fonte.url === "https://soutransportes.com.br/rio-claro/linhas-e-horarios/", "validade e fonte da SOU");
assert(onibus.total_horarios === 382 && onibus.linhas.length === 5, "devem estar cadastrados os 382 horários das 5 linhas recebidas");
const horaOk = /^([01]\d|2[0-3]):[0-5]\d$/;
let contados = 0;
onibus.linhas.forEach((l) => l.sentidos.forEach((s) => s.quadros.forEach((q) => {
  assert(["Ida", "Volta"].includes(s.sentido) && ["Dias úteis", "Sábados", "Domingos"].includes(q.dia), "sentido ou dia inválido na linha " + l.numero);
  assert(s.legenda[String(q.variante)], "variante sem trajeto na linha " + l.numero + " " + s.sentido);
  assert(q.horarios.length && q.horarios.every((x) => horaOk.test(x)) && q.horarios.every((x, i) => i === 0 || q.horarios[i - 1] < x), "horários inválidos ou fora de ordem: " + l.numero + " " + s.sentido + " " + q.dia);
  contados += q.horarios.length;
})));
assert(contados === onibus.total_horarios, "a soma dos horários deve bater com o total");
const circ1 = onibus.linhas.find((l) => l.numero === "07");
assert(circ1 && circ1.sentidos.length === 1 && circ1.sentidos[0].sentido === "Volta", "a Circular I só tem a Volta: o site não pode inventar a Ida");
assert(onibus.lacunas.some((t) => /Circular I/.test(t) && /Ida/.test(t)) && onibus.lacunas.some((t) => /Arco-Íris/.test(t)) && onibus.lacunas.some((t) => /Feriados/.test(t)), "as lacunas devem estar declaradas ao usuário");
assert(!/\.pdf|OCR|docs\/|desenvolvedor/i.test(JSON.stringify(onibus)), "o JSON de horários não pode expor detalhes internos");
assert(/Só temos o sentido/.test(app) && /Essa data já passou/.test(app) && /Em feriados os horários podem mudar/.test(app), "o site deve avisar sentido faltante, validade vencida e feriados");
console.log("dashboard.test.js: sete portas, emergência, navegação, nenhum conteúdo de demonstração, links locais e conteúdo das áreas passaram");
