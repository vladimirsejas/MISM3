/* Mapa territorial v1 (web/mapa-territorial.html, .js e .css): sem requisição externa, sem innerHTML com dados, ES5, linguagem permitida e
   funções puras coerentes com web/dados/indicadores_territoriais.json. A medição de rede no navegador foi feita com Playwright (ver o relatório da PR). */
const assert = require("assert"), fs = require("fs"), path = require("path");
const web = path.resolve(__dirname, "..");
const ler = (f) => fs.readFileSync(path.join(web, f), "utf8");
const html = ler("mapa-territorial.html"), js = ler("mapa-territorial.js"), css = ler("mapa-territorial.css");
const dados = JSON.parse(ler("dados/indicadores_territoriais.json"));
const M = require("../mapa-territorial.js");
const semComentarios = js.replace(/\/\*[\s\S]*?\*\//g, ""); /* as regras de código valem para o código, não para os comentários que as citam */

/* ---- a página não faz requisição externa ---- */
const NAMESPACE_SVG = "http://www.w3.org/2000/svg"; /* identificador de namespace, não é um endereço acessado */
[["mapa-territorial.html", html], ["mapa-territorial.js", js], ["mapa-territorial.css", css]].forEach(([nome, txt]) => {
  const urls = (txt.match(/(?:https?:)?\/\/[a-z0-9.-]+\.[a-z]{2,}[^\s"')]*/gi) || []).filter((u) => u !== NAMESPACE_SVG);
  assert.deepStrictEqual(urls, [], "endereço externo em " + nome + ": " + urls.join(", "));
  assert(!/@import|url\(\s*["']?https?:/i.test(txt), "sem importação externa em " + nome);
});
assert(!/<script[^>]+src="(?!mapa-territorial\.js")/.test(html) && !/<link[^>]+href="(?!estilo\.css|mapa-territorial\.css)/.test(html), "só scripts e estilos locais");
assert(!/<img\b|<iframe|<object|<embed|<form\b|<base\b/i.test(html), "sem imagens externas, quadros, formulários nem base");
const csp = (html.match(/Content-Security-Policy" content="([^"]+)"/) || [])[1] || "";
assert(/default-src 'none'/.test(csp) && /connect-src 'self'/.test(csp) && /script-src 'self'/.test(csp) && /style-src 'self'/.test(csp), "CSP restritiva: " + csp);
assert(!/unsafe-inline|unsafe-eval|https?:|\*/.test(csp), "CSP sem origem externa nem permissão de código embutido");
assert(/name="referrer" content="no-referrer"/.test(html) && /noindex/.test(html), "sem Referer e fora dos buscadores");
assert(!/\sstyle="/.test(html) && !/<style/i.test(html), "estilo só em arquivo (compatível com a CSP)");
assert(!/\b(fetch|WebSocket|sendBeacon|EventSource|importScripts)\b/.test(semComentarios) && !/XMLHttpRequest\(\)[\s\S]{0,40}open\("(?!GET)/.test(semComentarios), "só XMLHttpRequest GET");
const urlsPedidas = js.match(/carregar\("([^"]+)"/g).map((s) => s.slice(10, -1));
assert.deepStrictEqual(urlsPedidas.sort(), ["dados/indicadores_territoriais.json", "dados/setores.geojson"], "lê só os dois arquivos locais");

/* ---- dados entram na página só por textContent ---- */
assert(!/innerHTML|outerHTML|insertAdjacentHTML|document\.write|\beval\(|new Function|createContextualFragment/.test(semComentarios), "nada de HTML montado com dados (o teste olha o código, não os comentários que citam a regra)");
assert(/textContent/.test(semComentarios));

/* ---- JavaScript compatível com ES5 ---- */
[[/=>/, "função de seta"], [/\blet\s/, "let"], [/\bconst\s/, "const"], [/`/, "template literal"], [/\bclass\s+\w/, "class"], [/\.\.\.[\w[]/, "spread"],
 [/\bfor\s*\([^)]*\sof\s/, "for...of"], [/\.(includes|startsWith|endsWith|find|findIndex|padStart|padEnd|assign|entries|values)\(/, "método de ES6 ou posterior"], [/\bPromise\b/, "Promise"]].forEach(([rx, nome]) => {
  assert(!rx.test(semComentarios), "ES5: " + nome + " não é permitido em mapa-territorial.js");
});

/* ---- linguagem ---- */
const TERMOS_PROIBIDOS = [/desassistid/i, /falta de cobertura/i, /vulnerabilidade/i, /sem acesso/i, /não atende/i, /acessibilidade efetiva/i, /necessidade de servi/i];
const textoDaTela = html + js + JSON.stringify(dados.meta) + JSON.stringify(dados.classes);
TERMOS_PROIBIDOS.forEach((rx) => assert(!rx.test(textoDaTela), "termo fora da linguagem permitida: " + rx));
const comDeslocamento = (textoDaTela.match(/tempo de deslocamento/gi) || []).length;
assert(comDeslocamento === 1 && /não representa tempo de deslocamento ou acesso efetivo/.test(dados.meta.aviso_metodologico), "'tempo de deslocamento' só aparece no aviso, e negado");
assert(/distância em linha reta/i.test(dados.meta.aviso_metodologico), "o aviso metodológico fala em distância em linha reta");
["Como ler este mapa", "mt-aviso-texto", "Fonte e data", "Detalhe do setor"].forEach((t) => assert(html.indexOf(t) !== -1, "a página tem: " + t));
assert(/localização pendente/.test(js) && /serviço localizado no setor|serviços localizados no setor/.test(js + html), "usa a linguagem permitida");

/* ---- a página nova não está ligada nos arquivos existentes ---- */
fs.readdirSync(web).filter((f) => /\.(html|js|css)$/.test(f) && !/^mapa-territorial\./.test(f)).forEach((f) => {
  assert(!/mapa-territorial/.test(ler(f)), "link para a página nova em " + f + " (a decisão de ligar o mapa é do autor)");
});

/* ---- funções puras ---- */
assert.strictEqual(M.classeDe(null, [1, 2]), -1);
assert.deepStrictEqual([0, 0.99, 1, 1.5, 2, 99].map((v) => M.classeDe(v, [1, 2])), [0, 0, 1, 1, 2, 2]);
Object.keys(dados.classes).forEach((ind) => {
  const lim = dados.classes[ind].limites;
  assert(lim.every((v, i) => i === 0 || v > lim[i - 1]), "limites crescentes em " + ind);
  assert.strictEqual(M.rotulosClasses(ind, lim).length, lim.length + 1, "um rótulo por classe em " + ind);
  assert.strictEqual(M.coresDe(lim.length + 1).length, lim.length + 1, "uma cor por classe em " + ind);
});
const geo = JSON.parse(ler("dados/setores.geojson"));
const proj = M.criarProjecao(geo, 1000);
assert.strictEqual(proj.largura, 1000);
assert(proj.altura > 500 && proj.altura < 2000);
assert.strictEqual(geo.features.length, 408);
const ids = new Set();
geo.features.forEach((f) => {
  const d = M.caminhoDe(f.geometry, proj);
  assert(/^M[\d.,L-]+Z/.test(d), "caminho SVG válido para " + f.properties.setor);
  (d.match(/(-?[\d.]+),(-?[\d.]+)/g) || []).forEach((p) => { const [x, y] = p.split(",").map(Number); assert(x >= -0.1 && x <= 1000.1 && y >= -0.1 && y <= proj.altura + 0.1, "ponto dentro do mapa"); });
  ids.add(f.properties.setor);
});
assert.strictEqual(ids.size, 408);

/* cada setor tem valor (número ou localização pendente) em cada combinação de indicador, categoria e cenário */
const comb = [["pessoas"], ["densidade"], ["domicilios"], ["equipamentos", "cras"], ["equipamentos", "ubs"], ["equipamentos", "escola"], ["equipamentos", "todas"]];
["cras", "ubs", "escola"].forEach((c) => ["coordenadas_do_catalogo", "com_centro_do_cep"].forEach((n) => comb.push(["distancia", c, n])));
comb.forEach(([ind, cat, cen]) => {
  const cl = dados.classes[ind];
  dados.setores.forEach((s) => {
    const v = M.valorDoSetor(s, ind, cat, cen);
    assert(v === null || (typeof v === "number" && isFinite(v) && v >= 0), "valor inválido em " + ind + "/" + cat + "/" + cen);
    const c = M.classeDe(v, cl.limites);
    assert(c >= -1 && c <= cl.limites.length);
  });
});
assert.strictEqual(M.descreverValor("distancia", null), "localização pendente");
assert.strictEqual(M.descreverValor("pessoas", 201418), "201.418 pessoas");
assert.strictEqual(M.decimal(2.175, 2), "2,18");
assert.strictEqual(dados.setores.reduce((a, s) => a + s.pessoas, 0), 201418);

/* ---- decisão D4: setores pequenos são marcados, nenhum é suprimido ---- */
const pequenos = dados.setores.filter((s) => M.setorPequeno(s));
assert.strictEqual(pequenos.length, 17, "17 setores com menos de 5 pessoas ou menos de 3 domicílios");
assert(pequenos.every((s) => s.pessoas < 5 || s.domicilios < 3) && dados.setores.filter((s) => !M.setorPequeno(s)).every((s) => s.pessoas >= 5 && s.domicilios >= 3));
assert(js.indexOf("população muito pequena, interprete com cautela") !== -1 && /17 setores/.test(JSON.stringify(dados.meta.ressalvas)), "o aviso e a contagem aparecem na página");
assert(/@media \(max-width:40rem\)[\s\S]*data-label/.test(css) && /data-label/.test(js), "tabelas viram lista no celular (sem rolagem horizontal)");

assert(/setAttribute\("tabindex", "-1"\)/.test(js) && /setAttribute\("tabindex", "0"\)/.test(js) && /function definirFoco/.test(js), "roving tabindex: só o setor atual tem tabindex 0 (um único ponto de Tab)");
assert((js.match(/setAttribute\("tabindex", "0"\)/g) || []).length === 1, "tabindex 0 só aparece em definirFoco: os setores não nascem todos focalizáveis");
assert(/setAttribute\("role", "button"\)/.test(js) && /setAttribute\("aria-label"/.test(js), "setores têm semântica e nome acessíveis");
assert(/aria-pressed/.test(js), "o setor selecionado expõe estado acessível");
assert(/addEventListener\("keydown", teclado\)/.test(js) && ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "Enter"].every((k) => js.indexOf('"' + k + '"') !== -1), "setas, Home, End e Enter tratados");
assert(!/Escape|"Esc"/.test(js), "Esc não faz nada");
assert(/<svg id="mt-svg"[^>]*role="group"/.test(html) && !/<svg id="mt-svg"[^>]*tabindex/.test(html), "o SVG não é um ponto de Tab; os setores filhos são os alvos");
assert(/id="mt-ajuda-teclado"[^>]*>Use Tab para chegar ao mapa e as setas para mudar de setor\. Enter abre o detalhe\.</.test(html), "instrução visível acima do mapa");
assert(/id="mt-camada-foco"/.test(html) && /mt-anel-halo\{stroke:#fff/.test(css) && /mt-anel-nucleo\{stroke:#111/.test(css), "anel de foco duplo, branco por fora e escuro por dentro");
assert(/stroke:#51413f;stroke-width:1\.15/.test(css), "contorno escuro consistente melhora separação dos polígonos");
const cent = { a: [0, 0], b: [10, 1], c: [0, 10], d: [-10, 0] };
assert.strictEqual(M.vizinho("a", 1, 0, cent), "b");
assert.strictEqual(M.vizinho("a", 0, 1, cent), "c");
assert.strictEqual(M.vizinho("a", -1, 0, cent), "d");
assert.strictEqual(M.vizinho("a", 0, -1, cent), null, "sem vizinho naquele lado");

/* Um candidato diagonal é mais perto em linha reta, mas o alinhado vence pela nota lateral. */
const centSinteticos = { origem: [0, 0], diagonal: [1, 1], alinhado: [2, 0] };
assert(Math.sqrt(2) < 2, "o candidato diagonal é mais próximo em distância euclidiana");
assert.strictEqual(M.vizinho("origem", 1, 0, centSinteticos), "alinhado",
  "a penalidade lateral prefere o vizinho alinhado à direção da seta");

const quadrado = { type: "Polygon", coordinates: [[[0, 0], [4, 0], [4, 4], [0, 4], [0, 0]]] };
assert.deepStrictEqual(M.centroideGeometria(quadrado, { xy: function (x, y) { return [x, y]; } }), [2, 2],
  "navegação usa o centro geométrico do polígono, não o centro da caixa delimitadora");

/* O GeoJSON real é carregado do disco local, sem rede; os 408 setores devem ser alcançáveis por setas. */
const centroidesReais = {};
geo.features.forEach((f) => {
  centroidesReais[f.properties.setor] = M.centroideGeometria(f.geometry, proj);
});
const idsReais = Object.keys(centroidesReais);
const alcancados = new Set([idsReais[0]]);
const filaSetores = [idsReais[0]];
while (filaSetores.length) {
  const origem = filaSetores.shift();
  [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
    const destino = M.vizinho(origem, dx, dy, centroidesReais);
    if (destino && !alcancados.has(destino)) {
      alcancados.add(destino);
      filaSetores.push(destino);
    }
  });
}
assert.strictEqual(alcancados.size, 408,
  "a navegação por setas alcança os 408 setores do GeoJSON real a partir do primeiro setor");

console.log("mapa_territorial.test.js: sem requisição externa, CSP restritiva, textContent, ES5, linguagem permitida, 408 setores e funções coerentes com os indicadores");
