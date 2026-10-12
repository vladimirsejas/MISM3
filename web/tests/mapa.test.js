const assert = require("assert");
const fs = require("fs");
const path = require("path");
const web = path.join(__dirname, "..");
const MS = require("../mapa-servicos.js");
const Acesso = require("../acesso.js");
const ler = (f) => fs.readFileSync(path.join(web, f), "utf8");

const catalogo = JSON.parse(ler("dados/catalogo_manual.json")).servicos;
const indice = JSON.parse(ler("dados/cep_indice.json")).ceps;
const lista = MS.preparar(catalogo, indice);

/* ---- 1. Só aparece no mapa o que tem localização de verdade ---- */
assert.strictEqual(lista.length, catalogo.length, "preparar não pode perder nem duplicar serviços");
lista.forEach((s) => {
  if (!s.pos) return;
  assert(MS.dentroDeRioClaro(s.pos.lat, s.pos.lon), "ponto fora de Rio Claro: " + s.nome);
  assert(s.pos.precisao === "endereco" || s.pos.precisao === "cep");
});
const comCoordenada = catalogo.filter((s) => MS.dentroDeRioClaro(s.lat, s.lon));
assert.strictEqual(lista.filter((s) => s.pos && s.pos.precisao === "endereco").length, comCoordenada.length, "todo serviço com coordenada válida aparece pelo endereço");
lista.filter((s) => s.pos && s.pos.precisao === "cep").forEach((s) => {
  assert(!MS.dentroDeRioClaro(s.lat, s.lon), "CEP só é usado quando não há coordenada: " + s.nome);
  assert(s.pos.raio_m <= MS.RAIO_MAX_CEP_M, "CEP vago demais não posiciona serviço: " + s.nome);
});
lista.filter((s) => !s.pos).forEach((s) => {
  const cep = Acesso.normalizarCep(s.cep), v = cep && indice[cep];
  assert(!MS.dentroDeRioClaro(s.lat, s.lon) && !(v && v[2] <= MS.RAIO_MAX_CEP_M), "serviço localizável ficou sem posição: " + s.nome);
});
const n = MS.contagem(lista);
assert.strictEqual(n.endereco + n.cep + n.sem, lista.length, "a contagem do resumo fecha com o total");
assert(n.endereco > 0, "deve haver ao menos um ponto pelo endereço");

/* ---- 2. Coordenada ruim nunca vira ponto ---- */
assert.strictEqual(MS.posicao({ lat: 0, lon: 0 }, {}), null, "coordenada 0,0 não vale");
assert.strictEqual(MS.posicao({ lat: -23.5, lon: -46.6 }, {}), null, "coordenada de outra cidade não vale");
assert.strictEqual(MS.posicao({ lat: "-22,41", lon: "-47,56" }, {}), null, "texto no lugar de número não vale");
assert.strictEqual(MS.posicao({ cep: "13500030" }, { 13500030: [-22.28, -47.55, 1500, "x", 400] }), null, "CEP com raio de 1500 m é vago demais");
const viaCep = MS.posicao({ cep: "13500-040" }, { 13500040: [-22.4145, -47.5603, 420, "x", 98] });
assert(viaCep && viaCep.precisao === "cep" && viaCep.raio_m === 420, "CEP com raio pequeno posiciona de forma aproximada");

/* ---- 3. Filtro, busca (sem acento) e ordenação ---- */
const so = (tipo) => { const a = {}; Acesso.ORDEM.forEach((t) => { a[t] = t === tipo; }); return a; };
assert(MS.filtrar(lista, so("saude")).every((s) => s.tipo === "saude") && MS.filtrar(lista, so("saude")).length === catalogo.filter((s) => s.tipo === "saude").length);
assert.strictEqual(MS.filtrar(lista, null, "SAUDE").length, MS.filtrar(lista, null, "saúde").length, "a busca ignora acento e maiúscula");
const exemplo = [{ tipo: "saude", nome: "B", pos: { lat: -22.42, lon: -47.56 } }, { tipo: "saude", nome: "A", pos: null }, { tipo: "saude", nome: "C", pos: { lat: -22.41, lon: -47.56 } }];
const ord = MS.ordenar(exemplo, [-22.41, -47.56]);
assert.deepStrictEqual(ord.map((s) => s.nome), ["C", "B", "A"], "com CEP: mais perto primeiro, sem posição por último");
assert(ord[0].distancia_m < ord[1].distancia_m && ord[2].distancia_m === null);

/* ---- 4. Link do Google Maps: só o endereço do serviço; nada inventado ---- */
const g = MS.linkGoogleMaps({ endereco: "Rua 7, 830, Centro, CEP 13500-143" });
assert(g.startsWith("https://www.google.com/maps/search/?api=1&query=") && decodeURIComponent(g).includes("Rua 7, 830, Centro, Rio Claro, SP") && !/CEP/.test(decodeURIComponent(g)));
assert.strictEqual(MS.linkGoogleMaps({ endereco: "" }), null);
assert.strictEqual(MS.linkGoogleMaps({}), null);
assert.strictEqual(MS.primeiroTelefone("(19) 3532-4014 / (19) 3532-5221"), "1935324014");
assert.strictEqual(MS.primeiroTelefone("(19) 9 9956-3042 (WhatsApp)"), "19999563042");
assert.strictEqual(MS.primeiroTelefone("sem telefone"), null);

/* ---- 5. Marcadores: forma e cor por categoria; vazado quando aproximado ---- */
const formas = Acesso.ORDEM.map((t) => MS.ESTILO[t].forma), cores = Acesso.ORDEM.map((t) => MS.ESTILO[t].cor);
assert.strictEqual(new Set(formas).size, Acesso.ORDEM.length, "cada categoria tem uma forma própria (cor sozinha não basta)");
assert.strictEqual(new Set(cores).size, Acesso.ORDEM.length, "cada categoria tem uma cor própria");
assert(MS.svgMarcador("saude", false).includes('fill="' + MS.ESTILO.saude.cor + '"'));
assert(MS.svgMarcador("saude", true).includes('fill="#ffffff"') && MS.svgMarcador("saude", true).includes('stroke="' + MS.ESTILO.saude.cor + '"'));

/* ---- 6. Página e privacidade ---- */
const html = ler("index.html"), js = ler("mapa.js");
assert(!fs.existsSync(path.join(web, "mapa.html")), "o mapa mora na tela inicial: não existe página separada");
assert(/<script src="vendor\/leaflet\.js">/.test(html) && !/src="https?:/.test(html) && !/<link[^>]+href="https?:/.test(html), "só dependências locais (sem CDN)");
assert(/id="sair-rapido"/.test(html) && /<details class="emergencia"/.test(html), "a página mantém o botão de emergência e o de sair");
assert(/noopener noreferrer/.test(js), "links externos abrem com noopener noreferrer");
assert(!/localStorage|sessionStorage|document\.cookie|indexedDB|history\.(push|replace)State|location\.(hash|search)\s*=/.test(js), "o CEP e as escolhas não são guardados em lugar nenhum");
js.split("\n").filter((l) => /\.innerHTML\s*[=+]/.test(l)).forEach((l) => assert(/svgMarcador/.test(l), "innerHTML só para o SVG do marcador: " + l.trim()));
assert(!/fetch\(\s*["'`]https?:/.test(js), "nenhuma requisição externa automática");
assert(/id="limpar-cep"/.test(html) && /aproximad/i.test(html), "a página diz que a região do CEP é aproximada e deixa limpar");
/* ---- 7. Nomes de bairro: abreviações, acento e "qual CRAS atende?" só pela lista oficial ---- */
assert.strictEqual(MS.normalizarBairro("Jd. São José de Almeida"), MS.normalizarBairro("Jardim Sao Jose Almeida"), "Jd. = Jardim, sem acento e sem 'de'");
assert.strictEqual(MS.normalizarBairro("Vl. Operária"), MS.normalizarBairro("Vila Operaria"));
assert.strictEqual(MS.normalizarBairro("  "), "");
assert.strictEqual(MS.crasDoBairro("Jd Brasilia", lista).status, MS.crasDoBairro("Jardim Brasília", lista).status, "escrever de outro jeito dá o mesmo resultado");

const cras = lista.filter((x) => x.subtipo === "cras");
assert.strictEqual(cras.length, 6, "a página oficial lista seis CRAS");
let ambiguos = 0, total = 0;
cras.forEach((c) => {
  c.bairros.split(",").map((b) => b.trim()).filter(Boolean).forEach((bairro) => {
    total++;
    const r = MS.crasDoBairro(bairro, lista);
    assert(r.status === "ok" || r.status === "varios", "bairro da lista oficial não achado: " + bairro);
    assert(r.cras.some((a) => a.servico.id === c.id), "o bairro " + bairro + " tem que levar ao CRAS que o lista (" + c.nome + ")");
    if (r.status === "varios") ambiguos++;
  });
});
assert(total > 100, "deve haver mais de cem bairros nas listas dos CRAS (" + total + ")");
/* Como a moradora escreve de verdade: sem "I e II", sem "Jd.", com outra abreviação. */
const brasilia = MS.crasDoBairro("Jd Brasilia", lista);
assert(brasilia.status === "ok" && brasilia.metodo === "sem_numeral" && /Brasília/.test(brasilia.cras[0].servico.nome), "Jd Brasilia acha o CRAS pela lista 'Jd. Brasília I e II'");
const bomSucesso = MS.crasDoBairro("Bom Sucesso", lista);
assert(bomSucesso.status === "ok" && bomSucesso.metodo === "sem_tipo" && /Bom Sucesso/.test(bomSucesso.cras[0].servico.nome), "sem o 'Jd.' acha, mas marca como aproximado (a tela pede confirmação)");
const paulista = MS.crasDoBairro("Paulista", lista);
assert(paulista.status === "varios" && paulista.metodo === "sem_tipo" && new Set(paulista.cras.map((a) => a.servico.id)).size >= 3, "Paulista existe nas listas de vários CRAS: mostra todos");
const jdPaulista = MS.crasDoBairro("Jd Paulista", lista);
assert(jdPaulista.status === "varios", "'Jd. Paulista' e 'Jd. Paulista II' são de CRAS diferentes: sem o numeral, não escolhe um só");
assert.strictEqual(MS.crasDoBairro("Jd. Paulista II", lista).status, "ok", "com o numeral escrito, o resultado é um só");
assert(MS.crasDoBairro("Jd Brasilia", lista).cras.every((a) => /Brasília/.test(a.bairro)), "o nome mostrado é o da lista oficial");

const inexistente = MS.crasDoBairro("Bairro Que Não Existe", lista);
assert.strictEqual(inexistente.status, "nao_encontrado");
assert.strictEqual(inexistente.cras.length, 0, "bairro desconhecido não leva a nenhum CRAS (nada de adivinhar)");
assert.strictEqual(MS.crasDoBairro("", lista).status, "vazio");
const sug = MS.crasDoBairro("Brasília", lista);   // parte do nome: não escolhe sozinho, só sugere
assert(sug.status === "nao_encontrado" ? sug.sugestoes.length > 0 : sug.cras.length > 0, "nome parcial ou acha ou sugere, nunca fica mudo");

/* ---- 8. Apelidos de bairro: só os confirmados valem, e todos apontam para nomes que existem nas fontes ---- */
const ap = JSON.parse(ler("dados/bairros_apelidos.json")).apelidos;
assert(Array.isArray(ap) && ap.length > 0);
const fontes = MS.normalizarBairro(lista.map((x) => [x.bairros, x.endereco, x.nome].join(" ")).join(" "));
ap.forEach((a) => {
  assert(a.apelido && a.fonte && a.verificado_em && ["confirmado", "a_confirmar"].includes(a.situacao), "apelido sem fonte, data ou situação válida: " + a.apelido);
  assert(a.aponta_para.length > 0, "apelido sem destino: " + a.apelido);
  a.aponta_para.forEach((n) => assert(fontes.includes(MS.normalizarBairro(n)), "o apelido " + a.apelido + " aponta para um nome que não existe nas fontes do projeto: " + n));
});
const antes = MS.filtrar(lista, null, "CVZ", ap).length;
assert.strictEqual(antes, MS.filtrar(lista, null, "CVZ", []).length, "apelido a_confirmar não muda nenhum resultado");
const falsoOk = [{ apelido: "Apelido Teste", aponta_para: ["Jd. Chervezon"], situacao: "confirmado" }];
assert(MS.filtrar(lista, null, "apelido teste", falsoOk).length > 0, "apelido confirmado leva ao nome das fontes");
assert.strictEqual(MS.crasDoBairro("Apelido Teste", lista, falsoOk).status, "ok", "apelido confirmado leva ao CRAS da lista oficial");
assert.strictEqual(MS.crasDoBairro("Apelido Teste", lista, [{ ...falsoOk[0], situacao: "a_confirmar" }]).status, "nao_encontrado", "a_confirmar não vale");
assert(/id="form-cras"/.test(html) && /id="resultado-cras"/.test(html), "a página tem a caixa 'Qual CRAS atende o meu bairro?'");
assert(/lista oficial/i.test(html), "a caixa diz de onde vem a informação");
console.log("mapa.test.js (bairros): " + total + " bairros dos CRAS conferidos, " + ambiguos + " aparecem em mais de um CRAS");
console.log("mapa.test.js: ok (" + lista.length + " serviços; " + n.endereco + " pelo endereço, " + n.cep + " pelo CEP, " + n.sem + " sem posição)");

// Mais perto por tipo: um por tipo, só com posição, na ordem do site; sem origem não devolve nada.
{
  const ordenada = MS.ordenar(lista, [-22.41, -47.56]);
  const perto = MS.maisPertoPorTipo(ordenada);
  const tipos = perto.map((s) => s.tipo);
  assert.strictEqual(new Set(tipos).size, tipos.length, "um serviço por tipo");
  assert.ok(perto.length >= 2, "há mais de um tipo com posição");
  assert.ok(perto.every((s) => s.distancia_m != null && s.pos), "só serviços com posição");
  const ordemSite = tipos.map((t) => Acesso.ORDEM.indexOf(t));
  assert.deepStrictEqual(ordemSite, ordemSite.slice().sort((a, b) => a - b), "na ordem de categorias do site");
  tipos.forEach((t, i) => {
    const maisPerto = Math.min(...ordenada.filter((s) => s.tipo === t && s.distancia_m != null).map((s) => s.distancia_m));
    assert.strictEqual(perto[i].distancia_m, maisPerto, "é o mais perto do tipo " + t);
  });
  assert.deepStrictEqual(MS.maisPertoPorTipo(MS.ordenar(lista, null)), [], "sem origem, nada");
  console.log("ok: mais perto por tipo");
}

// CEP <-> bairro (pelo setor do IBGE): provável, nunca inventado.
{
  const setorBairro = JSON.parse(ler("dados/setor_bairro.json")).bairros;
  const comBairro = Object.keys(indice).filter((c) => MS.bairroDoCep(c, indice, setorBairro));
  assert(comBairro.length > 1000, "a maioria dos CEPs recebe um bairro provável (" + comBairro.length + " de " + Object.keys(indice).length + ")");
  const b = MS.bairroDoCep(comBairro[0], indice, setorBairro);
  assert(typeof b.bairro === "string" && typeof b.area_grande === "boolean");
  assert.strictEqual(MS.bairroDoCep("00000000", indice, setorBairro), null, "CEP que não está no índice: nada");
  assert.strictEqual(MS.bairroDoCep(comBairro[0], indice, {}), null, "sem tabela de bairros: nada");
  // vice-versa: todo CEP devolvido para um bairro tem mesmo esse bairro
  const nome = b.bairro, doBairro = MS.cepsDoBairro(nome, indice, setorBairro);
  assert(doBairro.includes(comBairro[0]) && doBairro.every((c) => MS.normalizarBairro(MS.bairroDoCep(c, indice, setorBairro).bairro).length > 0), "o CEP de origem está na lista do seu bairro");
  assert.deepStrictEqual(MS.cepsDoBairro("Bairro Que Não Existe", indice, setorBairro), []);
  assert.deepStrictEqual(MS.cepsDoBairro("", indice, setorBairro), []);
  // "Jd. Brasília" digitado casa com o bairro "Jardim Brasília" do IBGE (sem Jd./Jardim e sem acento)
  assert.deepStrictEqual(MS.cepsDoBairro("Jardim Brasília", indice, setorBairro), MS.cepsDoBairro("Jd. Brasilia", indice, setorBairro));
  console.log("ok: CEP <-> bairro (" + comBairro.length + " CEPs com bairro provável)");
}
