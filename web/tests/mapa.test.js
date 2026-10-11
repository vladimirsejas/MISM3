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
const html = ler("mapa.html"), js = ler("mapa.js");
assert(/<script src="vendor\/leaflet\.js">/.test(html) && !/src="https?:/.test(html) && !/<link[^>]+href="https?:/.test(html), "só dependências locais (sem CDN)");
assert(/id="sair-rapido"/.test(html) && /<details class="emergencia"/.test(html), "a página mantém o botão de emergência e o de sair");
assert(/noopener noreferrer/.test(js), "links externos abrem com noopener noreferrer");
assert(!/localStorage|sessionStorage|document\.cookie|indexedDB|history\.(push|replace)State|location\.(hash|search)\s*=/.test(js), "o CEP e as escolhas não são guardados em lugar nenhum");
js.split("\n").filter((l) => /\.innerHTML\s*[=+]/.test(l)).forEach((l) => assert(/svgMarcador/.test(l), "innerHTML só para o SVG do marcador: " + l.trim()));
assert(!/fetch\(\s*["'`]https?:/.test(js), "nenhuma requisição externa automática");
assert(/id="limpar-cep"/.test(html) && /aproximad/i.test(html), "a página diz que a região do CEP é aproximada e deixa limpar");
console.log("mapa.test.js: ok (" + lista.length + " serviços; " + n.endereco + " pelo endereço, " + n.cep + " pelo CEP, " + n.sem + " sem posição)");
