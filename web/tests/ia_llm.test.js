const assert = require("assert");
const fs = require("fs");
const path = require("path");
const L = require("../ia-llm.js");

const web = path.resolve(__dirname, "..");
const ler = (f) => fs.readFileSync(path.join(web, f), "utf8");
const itens = [
  { titulo: "CRAS Centro", resumo: "Assistência social.", contato: { telefone: "(19) 3522-1234", endereco: "Rua A, 10", horario: "08h às 17h" }, href: "#x", area: "assistencia", extra: "NÃO ENVIAR" },
  { titulo: "Porta da área", resumo: "Veja a área." },
];

/* ---- quando a IA pode ser chamada ---- */
const r = { itens, geral: false, saudacao: false, perigo: null };
assert.strictEqual(L.deveChamar(r, true), true);
assert.strictEqual(L.deveChamar(r, false), false, "sem a marcação da pessoa, nunca");
assert.strictEqual(L.deveChamar(Object.assign({}, r, { perigo: { nivel: 2 } }), true), false, "perigo grave: só o alerta");
assert.strictEqual(L.deveChamar(Object.assign({}, r, { perigo: { nivel: 1 } }), true), false, "perigo discreto: também não envia");
assert.strictEqual(L.deveChamar(Object.assign({}, r, { geral: true }), true), false);
assert.strictEqual(L.deveChamar(Object.assign({}, r, { saudacao: true }), true), false);
assert.strictEqual(L.deveChamar(Object.assign({}, r, { itens: [] }), true), false, "sem serviços não há o que explicar");
assert.strictEqual(L.deveChamar(null, true), false);

/* ---- o que é enviado: só nome, resumo e contato ---- */
const s = L.servicosDe(itens.concat(itens, itens));
assert.strictEqual(s.length, 4);
assert.deepStrictEqual(Object.keys(s[0]).sort(), ["endereco", "horario", "resumo", "telefone", "titulo"]);
assert(!JSON.stringify(s).includes("NÃO ENVIAR") && !JSON.stringify(s).includes("#x"));

/* ---- pedir: sucesso, falhas e nada a enviar ---- */
(async () => {
  let enviado = null;
  const ok = (u, o) => { enviado = { u, o }; return Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: true, texto: " Procure o CRAS. " }) }); };
  assert.strictEqual(await L.pedir(ok, "preciso de creche", itens), "Procure o CRAS.");
  assert.strictEqual(enviado.u, "api/ia", "caminho relativo: funciona em qualquer pasta");
  assert.strictEqual(enviado.o.method, "POST");
  const corpo = JSON.parse(enviado.o.body);
  assert.deepStrictEqual(Object.keys(corpo).sort(), ["servicos", "texto"]);
  assert.strictEqual(corpo.texto, "preciso de creche");

  const falhas = [
    () => Promise.reject(new Error("sem rede")),
    () => Promise.resolve({ ok: false, json: () => Promise.resolve({}) }),
    () => Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: false }) }),
    () => Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: true, texto: "   " }) }),
    () => Promise.resolve({ ok: true, json: () => Promise.reject(new Error("não é json")) }),
  ];
  for (const f of falhas) assert.strictEqual(await L.pedir(f, "x", itens), null, "qualquer falha vira null, sem lançar erro");
  let chamou = false;
  assert.strictEqual(await L.pedir(() => { chamou = true; }, "x", []), null);
  assert.strictEqual(chamou, false, "sem serviços, nem chama a rede");

  /* ---- disponibilidade: em site estático (sem servidor local) o botão não aparece ---- */
  assert.strictEqual(await L.disponivel(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ disponivel: true }) })), true);
  assert.strictEqual(await L.disponivel(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ disponivel: false }) })), false);
  assert.strictEqual(await L.disponivel(() => Promise.resolve({ ok: false })), false, "404 da hospedagem estática");
  assert.strictEqual(await L.disponivel(() => Promise.resolve({ ok: true, json: () => Promise.reject(new Error("html")) })), false);
  assert.strictEqual(await L.disponivel(() => Promise.reject(new Error("x"))), false);

  /* ---- a resposta é escapada: nada da IA vira HTML ---- */
  const h = L.html('Oi <img src=x onerror=alert(1)>\n\nSegundo "parágrafo"');
  assert(!h.includes("<img") && h.includes("&lt;img") && (h.match(/<p>/g) || []).length === 2);
  assert(/Gemini/.test(h) && /pode errar/.test(h), "a tela diz que é IA e que pode errar");

  /* ---- a tela: opção desligada por padrão, escondida até o servidor confirmar, e a IA depois do orientador ---- */
  const index = ler("index.html"), app = ler("app.js");
  assert(/<label class="ia-opcao" id="ia-llm-opcao"[^>]*\bhidden\b/.test(index), "a opção começa escondida");
  assert(/<input type="checkbox" id="ia-llm">/.test(index) && !/id="ia-llm"[^>]*checked/.test(index), "e desmarcada");
  assert(/enviados ao Google/.test(index) && /Sem marcar, nada sai do seu aparelho/.test(index), "o aviso de privacidade está ao lado da opção");
  const ordem = Array.from(index.matchAll(/<script src="([^"]+)"/g), (m) => m[1]);
  assert(ordem.indexOf("ia-llm.js") > ordem.indexOf("orientacao-ui.js") && ordem.indexOf("ia-llm.js") < ordem.indexOf("app.js"));
  assert(/MISM3LLM\.deveChamar\(r, marcada\)/.test(app), "app.js só chama a IA pelo filtro de segurança");
  assert(!/fetch\(/.test(ler("ia-llm.js")), "ia-llm.js não faz rede sozinho: recebe a função de busca");
  assert(!/localStorage|sessionStorage|document\.cookie/.test(ler("ia-llm.js")), "nada do texto é guardado");
  console.log("ia_llm.test.js: ok");
})().catch((e) => { console.error(e); process.exit(1); });
