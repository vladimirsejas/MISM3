const assert = require("assert");
const fs = require("fs");
const path = require("path");

const web = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(web, "territorio.html"), "utf8");
const js = fs.readFileSync(path.join(web, "territorio.js"), "utf8");
const dados = JSON.parse(fs.readFileSync(path.join(web, "dados", "territorio.json"), "utf8"));
const geo = JSON.parse(fs.readFileSync(path.join(web, "dados", "setores.geojson"), "utf8"));

/* ---- a página só fala com arquivos locais e não indexa ---- */
const externos = (html + js).match(/https?:\/\/[^\s"'<>)]+/g) || [];
assert.deepStrictEqual(externos.filter((u) => !/^http:\/\/www\.w3\.org\/2000\/svg$/.test(u)), [], "nenhuma URL externa na página");
assert(/<meta name="robots" content="noindex">/.test(html), "a página não deve ser indexada enquanto não for revisada");
assert(!/<script[^>]+src="https?:/.test(html) && !/<link[^>]+href="https?:/.test(html), "sem script ou estilo externo");

/* ---- texto dos dados nunca entra como HTML ---- */
assert(!/innerHTML|insertAdjacentHTML|document\.write|outerHTML/.test(js), "texto vindo dos dados só entra com textContent");

/* ---- honestidade do que a página mostra ---- */
assert(/não quem precisa de ajuda/.test(html), "o aviso principal deve dizer que mostra onde as pessoas moram, não quem precisa de ajuda");
assert(/Matrícula não é vaga/.test(html), "deve avisar que matrícula não é vaga");
assert(/Correlação não prova causa/.test(html), "deve avisar que correlação não prova causa");
assert(/20 domicílios/.test(html) && /106 pessoas/.test(html), "deve explicar por que pessoas por domicílio exige base mínima");
assert(/não é o tamanho médio das famílias/.test(html) && /vazios/.test(html), "deve avisar que pessoas por domicílio não é o tamanho médio das famílias (o campo provavelmente inclui domicílios vazios)");
assert(/<table id="tabela">/.test(html) && /<fieldset class="filtros">/.test(html) && /role="img"/.test(html), "tabela, filtro e mapa acessível");

/* ---- modo escuro: nos dois escopos, com as mesmas variáveis ---- */
assert(/prefers-color-scheme: dark\)[\s\S]*?:root:where\(:not\(\[data-theme="light"\]\)\)/.test(html), "escuro pelo sistema, sem sobrescrever o tema claro escolhido");
assert(/:root\[data-theme="dark"\]/.test(html), "escuro pelo seletor de tema");
const claro = html.match(/--c0: (#[0-9a-f]{6}); --c1: (#[0-9a-f]{6}); --c2: (#[0-9a-f]{6}); --c3: (#[0-9a-f]{6}); --c4: (#[0-9a-f]{6});/);
assert.deepStrictEqual(claro.slice(1), ["#86b6ef", "#5598e7", "#2a78d6", "#1c5cab", "#0d366b"], "rampa clara validada (passos 250 a 700)");

/* ---- distância até o serviço: sempre mostra quantos serviços estão localizados e que a localização pelo CEP é aproximada ---- */
assert(/desenharPontos/.test(js) && /localizados/.test(js) && /localizados_pelo_endereco/.test(js), "o resumo deve dizer quantos serviços cadastrados estão localizados");
assert(/aproximada pelo CEP/.test(js) && /\.ponto\.aprox/.test(html), "ponto aproximado pelo CEP deve ser visualmente diferente (círculo vazado) e dito na legenda");
assert(/Object\.keys\(estado\.dados\.distancia_ate_servico \|\| \{\}\)/.test(js), "as opções de distância só aparecem quando há serviços localizados");
assert(!/o\(a\)|\(a\)/.test(js), "texto sem 'o(a)': usar redação neutra");
if (dados.distancia_ate_servico) {
  Object.keys(dados.distancia_ate_servico).forEach((k) => {
    const d = dados.distancia_ate_servico[k];
    assert(d.localizados >= 1 && d.localizados <= d.cadastrados, "serviços localizados nunca passam dos cadastrados: " + k);
    assert(!("por_setor" in d), "a distância por setor fica em setores, não duplicada");
    d.pontos.forEach((p) => assert.deepStrictEqual(Object.keys(p).sort(), ["lat", "lon", "nome", "precisao", "raio_m"], "ponto só com o necessário para o mapa"));
  });
  assert(dados.meta.aviso_distancia && /não prova falta de serviço/.test(dados.meta.aviso_distancia));
}

/* ---- categoria com poucos serviços localizados não ganha distância: fica "pendente" e a página diz o que falta ---- */
assert(/distancia_pendente/.test(js) && /ainda não disponível/i.test(js) && /id="nota-dist-pendente"/.test(html), "a página deve explicar por que uma distância não aparece");
Object.keys(dados.distancia_pendente || {}).forEach((k) => {
  const p = dados.distancia_pendente[k];
  assert(p.localizados / p.cadastrados < p.minimo_pct / 100, "pendente só com cobertura abaixo do mínimo: " + k);
  assert(!dados.distancia_ate_servico || !(k in dados.distancia_ate_servico), "categoria pendente não pode ter distância: " + k);
  assert(!Object.values(dados.setores).some((s) => ("dist_" + k) in s), "nem a distância por setor: " + k);
});
Object.keys(dados.distancia_ate_servico || {}).forEach((k) => {
  const d = dados.distancia_ate_servico[k];
  assert(d.localizados / d.cadastrados >= 0.7, "distância só com pelo menos 70% dos serviços localizados: " + k);
});

/* ---- o texto vale nos dois temas: no escuro, valor maior é tom mais CLARO, então não se pode dizer "mais escuro" ---- */
assert(!/mais escuro|mais clar/i.test(html + js), "a explicação das cores não pode depender do tema; use a legenda");

/* ---- aproximar na área urbana e setores sem bairro ---- */
assert(/name="area" value="densa"/.test(html) && /name="area" value="todo"/.test(html), "o mapa deve poder aproximar na área urbana");
assert(/sem_bairro/.test(js) && /nomeDoBairro/.test(js), "setor sem bairro no IBGE não pode aparecer como nome vazio ou 'null'");
assert(!/\d+(?:[.,]\d+)?% da população/.test(html + js.replace(/decimal\(100 \* d\.pessoas \/ total, 1\) \+ "% da população/, "")),
  "a parcela da população na área urbana sai dos dados, não de um número escrito na página");

/* ---- dados: conferem com o IBGE e entre si ---- */
assert.strictEqual(dados.totais.setores, 408);
assert.strictEqual(geo.features.length, 408);
assert.strictEqual(dados.meta.conferencia.pessoas_somadas, dados.meta.conferencia.pessoas_publicadas_ibge, "a soma das pessoas deve bater com o IBGE");
assert(Math.abs(dados.meta.conferencia.diferenca_area_pct) < 1, "a área somada deve ficar a menos de 1% da oficial");
assert.strictEqual(dados.bairros.reduce((s, b) => s + b.pessoas, 0), dados.totais.pessoas);
assert(dados.bairros.every((b) => typeof b.nome === "string" && b.nome.trim()), "nenhum bairro com nome vazio");
assert.strictEqual(dados.meta.sem_bairro.pessoas, dados.bairros.find((b) => b.nome === dados.meta.sem_bairro.rotulo).pessoas);
assert.strictEqual(dados.classes.densidade.contagem.reduce((s, n) => s + n, 0), 408);
const ppd = dados.classes.pessoas_por_domicilio;
assert.strictEqual(ppd.contagem.reduce((s, n) => s + n, 0) + ppd.sem_base_suficiente, 408);
assert.strictEqual(dados.classes.densidade.limites.length, 4, "5 classes");
geo.features.forEach((f) => assert(dados.setores[f.properties.setor], "setor do mapa sem indicador: " + f.properties.setor));

/* ---- a educação infantil leva só o agregado por rede, nunca escola por escola ---- */
if (dados.educacao_infantil) {
  assert(!("escolas" in dados.educacao_infantil), "só totais por rede");
  assert(/não é vaga/i.test(dados.educacao_infantil.aviso));
}

console.log("territorio.test.js: página local, sem HTML injetado, avisos, escuro, 408 setores e totais conferidos com o IBGE passaram");
