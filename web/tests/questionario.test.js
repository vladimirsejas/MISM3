const assert = require("assert");
const fs = require("fs");
const path = require("path");

const web = path.resolve(__dirname, "..");
const Q = require("../questionario.js");
const Areas = require("../areas.js");
const ler = (f) => fs.readFileSync(path.join(web, f), "utf8");

/* ---- estrutura: só alternativas, nada de texto livre nem dado pessoal ---- */
const ids = Q.PERGUNTAS.map((p) => p.id);
assert.strictEqual(new Set(ids).size, ids.length, "ids de pergunta repetidos");
Q.PERGUNTAS.forEach((p) => {
  assert(["unica", "multi"].includes(p.tipo), "só se aceitam alternativas (nada de texto livre): " + p.id);
  assert.strictEqual(new Set(p.opcoes.map((o) => o.c)).size, p.opcoes.length, "códigos repetidos em " + p.id);
  p.opcoes.forEach((o) => assert(o.c && o.r, "opção incompleta em " + p.id));
  if (p.tipo === "multi") assert(p.max >= 1, "pergunta múltipla sem limite: " + p.id);
  assert(!/(qual|informe|digite|escreva|diga|preencha)[^?]*\b(nome|cpf|rg|telefone|e-mail|endereço|rua)\b/i.test(p.texto), "pergunta pede dado pessoal: " + p.texto);
});
assert(Q.PERGUNTAS.length <= 19, "o questionário é curto o bastante para ser respondido no celular");
const regiao = Q.PERGUNTAS.find((p) => p.id === "regiao");
["cvz", "mae_preta", "bom_sucesso"].forEach((c) => assert(regiao.opcoes.some((o) => o.c === c), "a região usa pontos de referência que a moradora reconhece: " + c));
assert(!regiao.opcoes.some((o) => /zona (norte|sul|leste|oeste)/i.test(o.r)), "ninguém sabe em que zona mora: usar pontos de referência");
assert(regiao.opcoes.some((o) => o.c === "nao_sei") && regiao.opcoes.some((o) => o.c === "nd"), "sempre dar a saída 'não sei' e 'prefiro não informar'");

/* ---- só respostas previstas; múltipla: sem repetição, no máximo N, exclusiva desmarca as outras ---- */
assert.deepStrictEqual(Q.limpar({ idade: "999", trabalho: "formal", x: 1 }), { trabalho: "formal" });
assert.deepStrictEqual(Q.limpar({ obstaculos_trabalho: ["vagas", "vagas", "creche", "transporte", "internet"] }).obstaculos_trabalho, ["vagas", "creche", "transporte"], "no máximo 3, sem repetição");
assert.deepStrictEqual(Q.limpar({ obstaculos_trabalho: ["vagas", "nenhum"] }).obstaculos_trabalho, ["nenhum"], "'nada disso' desmarca as outras");
assert.deepStrictEqual(Q.limpar({ idade: "m18", autoriza: "sim" }), { idade: "m18" }, "menor de 18 anos: a pergunta de autorização nem existe");
assert.deepStrictEqual(Q.limpar({ estudar: "nao", obstaculos_estudo: ["dinheiro"] }), { estudar: "nao" }, "não sobra resposta de pergunta que não se aplica");
assert.deepStrictEqual(Q.limpar({ cuidado: "nenhum", cuidado_rotina: "bastante", apoio_cuidado: "matricula" }), { cuidado: "nenhum" });

/* ---- fluxo: começa pela idade; perguntas condicionais; termina ---- */
assert.strictEqual(Q.proxima({}).pergunta.id, "idade");
assert.strictEqual(Q.proxima({}, ["idade"]).pergunta.id, "regiao", "pular não faz a pergunta voltar");
assert.strictEqual(Q.aplicaveis({ estudar: "nao", cuidado: "nenhum" }).length, Q.PERGUNTAS.length - 3, "sem estudo e sem cuidado, três perguntas saem do caminho");
const completo = { idade: "25_34", regiao: "cvz", grupos: ["sustento"], trabalho: "procurando", obstaculos_trabalho: ["creche"], apoio_renda: "emprego", estudar: "nao", cuidado: "ate3", cuidado_rotina: "pouco", apoio_cuidado: "creche_info", deslocamento: "onibus", transporte_freq: "nunca", informacao: "facil", areas_info: ["trabalho"], sabe_procurar: "sei", prioridade_area: "emprego", resultado_6m: "trabalho_renda", autoriza: "sim" };
assert.strictEqual(Q.proxima(completo), null, "quando tudo foi respondido, acabou");

/* ---- pontuação: 0 a 100 por tema; pergunta em branco NÃO é 'sem necessidade' ---- */
const mae = { idade: "25_34", trabalho: "procurando", obstaculos_trabalho: ["creche", "transporte", "vagas"], estudar: "concluir", obstaculos_estudo: ["sem_cuidado", "dinheiro"], cuidado: "mais_de_um", cuidado_rotina: "impede_trabalho_estudo", deslocamento: "carona", transporte_freq: "frequentemente", informacao: "onde_procurar", sabe_procurar: "ja_procurei" };
const pm = Q.pontuar(mae);
assert.deepStrictEqual(Object.keys(pm), ["economica", "educacao", "cuidados", "mobilidade", "rede"]);
assert.strictEqual(pm.economica.indice, 100); assert.strictEqual(pm.educacao.indice, 80); assert.strictEqual(pm.cuidados.indice, 100);
assert.strictEqual(pm.mobilidade.indice, 57); assert.strictEqual(pm.rede.indice, 83);
const livre = Q.pontuar({ trabalho: "formal", obstaculos_trabalho: ["nenhum"], estudar: "nao", cuidado: "nenhum", deslocamento: "carro", transporte_freq: "nunca", informacao: "facil", sabe_procurar: "sei" });
Object.keys(livre).forEach((k) => assert.strictEqual(livre[k].indice, 0, "sem dificuldade = 0: " + k));
const branco = Q.pontuar({ idade: "nd", trabalho: "nd", obstaculos_trabalho: ["nao_se_aplica"], cuidado: "nd", sabe_procurar: "nd", informacao: "nao_precisei" });
Object.keys(branco).forEach((k) => assert.strictEqual(branco[k].indice, null, "em branco ou 'prefiro não informar' = SEM DADOS, nunca zero: " + k));
const parcial = Q.pontuar({ trabalho: "procurando" });
assert.strictEqual(parcial.economica.indice, 100); assert.strictEqual(parcial.economica.respondidas, 1); assert.strictEqual(parcial.economica.total, 2, "o índice informa com quantas perguntas foi calculado");
Object.keys(pm).forEach((k) => assert(pm[k].indice >= 0 && pm[k].indice <= 100));
assert(!JSON.stringify(Q.pontuar(completo)).match(/risco|violên|vulnerab|diagnóst|gravidade/i), "não existe pontuação de risco, violência ou vulnerabilidade");
assert(!Q.DIMENSOES.some((d) => /prote|violên|saúde mental|risco/i.test(d.nome + d.indica)), "nenhuma dimensão pontuada trata de violência, saúde mental ou risco");

/* ---- caminhos: o que ELA marcou vem primeiro; proteção só se ela marcar; no máximo 3 ---- */
const cam = (r) => Q.caminhos(r).map((c) => c.id);
assert.deepStrictEqual(cam(Object.assign({}, mae, { prioridade_area: "creche", resultado_6m: "trabalho_renda" })), ["cuidados", "economica", "rede"]);
assert.strictEqual(cam({ trabalho: "informal", prioridade_area: "direitos_protecao" })[0], "protecao", "marcou proteção: vem primeiro");
assert.strictEqual(cam({ trabalho: "informal", resultado_6m: "seguranca" })[0], "protecao");
assert.strictEqual(cam({ areas_info: ["protecao"] })[0], "protecao", "interesse em orientação sobre proteção também abre o caminho");
assert(!cam(Object.assign({}, mae, { prioridade_area: "outra", resultado_6m: "outro" })).includes("protecao"), "NUNCA se infere proteção das outras respostas, por mais necessidades que existam");
assert(cam(mae).length <= 3 && cam(completo).length <= 3);
assert.deepStrictEqual(cam({ idade: "nd", trabalho: "nd" }), [], "sem respostas válidas, não inventa caminho");
Q.caminhos(Object.assign({}, mae, { prioridade_area: "direitos_protecao" })).forEach((c) => {
  const m = /^#([a-z-]+)(?:\/([\w-]+))?$/.exec(c.href);
  assert(m && Areas.porId(m[1]), "caminho para área inexistente: " + c.href);
  assert(!/você (tem|terá) direito|garant|aprovad/i.test(c.porque + c.titulo), "o caminho não pode prometer");
});
assert(Q.caminhos({ prioridade_area: "direitos_protecao" })[0].urgente === true);

/* ---- o que seria enviado à Secretaria: sem identificação, só com autorização e 18 anos ou mais ---- */
assert.strictEqual(Q.registro(Object.assign({}, completo, { autoriza: "nao" }), "2026-10"), null, "sem autorização, nada é enviado");
assert.strictEqual(Q.registro(Object.assign({}, completo, { idade: "m18" }), "2026-10"), null, "menor de 18 anos: nunca");
assert.strictEqual(Q.registro(Object.assign({}, completo, { idade: undefined }), "2026-10"), null, "sem idade informada não envia (não dá para saber se é menor)");
const reg = Q.registro(completo, "2026-10");
assert.deepStrictEqual(Object.keys(reg).sort(), ["indices", "instrumento", "periodo", "respostas", "versao"]);
assert.strictEqual(reg.periodo, "2026-10", "só o mês, nunca data e hora exatas");
assert(!("autoriza" in reg.respostas), "a autorização não vai no registro");
Object.keys(reg.respostas).forEach((q) => {
  const p = Q.PERGUNTAS.find((x) => x.id === q);
  [].concat(reg.respostas[q]).forEach((c) => assert(p.opcoes.some((o) => o.c === c), "só códigos de alternativas: " + q + "=" + c));
});
Object.keys(reg.respostas).forEach((k) => assert(ids.includes(k), "campo fora das perguntas do questionário: " + k));
assert(!["nome", "cpf", "rg", "telefone", "email", "endereco", "ip", "id", "timestamp", "dispositivo"].some((k) => k in reg || k in reg.respostas), "nenhum campo de identificação");
assert.strictEqual(Q.registro(completo, "2026-10-11T10:00").periodo, null, "data com hora é descartada");

/* ---- a coleta está DESLIGADA e o código só envia quando ligada ---- */
const coleta = JSON.parse(ler("dados/coleta.json"));
assert.strictEqual(coleta.ativa, false, "a coleta só pode ser ligada depois dos acordos com a Prefeitura");
assert.strictEqual(coleta.endpoint, null);
const ui = ler("questionario-ui.js"), logica = ler("questionario.js").replace(/\/\*[\s\S]*?\*\//g, "");
assert.strictEqual((ui.match(/fetch\(/g) || []).length, 1, "só um lugar pode enviar dados");
assert(/!config\.ativa/.test(ui) && /\^https:\\\/\\\//.test(ui) && /credentials: "omit"/.test(ui) && /referrerPolicy: "no-referrer"/.test(ui), "envio só com coleta ativa, https, sem cookies e sem referência");
assert(!/localStorage|sessionStorage|indexedDB|document\.cookie|sendBeacon|geolocation/.test(ui + logica), "o questionário não usa armazenamento do navegador");
assert(!/fetch\(|XMLHttpRequest|WebSocket/.test(logica), "a lógica do questionário não usa rede");

/* ---- transparência na tela e no site ---- */
["não informa nome, CPF nem telefone", "voluntário", "não substitui atendimento", "não foi ativada", "Menores de 18 anos"].forEach((t) => assert(ui.includes(t), "a introdução deve dizer: " + t));
assert(/Não é uma escala validada, não é diagnóstico/.test(ui), "o retorno deve avisar o que a pontuação não é");
assert(/Pergunta em branco não conta/.test(ui));
const index = ler("index.html");
assert(/href="#questionario"/.test(index) && /src="questionario\.js"/.test(index) && /src="questionario-ui\.js"/.test(index));
assert(index.indexOf("questionario.js") < index.indexOf("questionario-ui.js") && index.indexOf("ia.js") < index.indexOf("questionario-ui.js"), "ordem dos scripts");
const ext = Areas.EXTRAS.find((a) => a.id === "questionario");
assert(ext && ext.questionario === true && !Areas.AREAS.some((a) => a.id === "questionario"), "o questionário é uma rota extra, fora das sete portas");
assert(Areas.porId("questionario") === ext);

console.log("questionario.test.js: estrutura, pontuação (em branco ≠ zero), caminhos, registro sem identificação, coleta desligada e transparência passaram");
