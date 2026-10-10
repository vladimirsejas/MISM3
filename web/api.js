/* Camada de dados do MISM3: UM unico lugar que decide de onde vem cada dado (arquivo local ou API).
   O resto do site nao sabe se ha API: chama Api.json("dados/servicos.json") e recebe o JSON.
   Contrato completo em docs/api_contrato.md. */
(function (raiz, fabrica) {
  if (typeof module === "object" && module.exports) module.exports = fabrica();
  else raiz.Api = fabrica();
})(typeof self !== "undefined" ? self : this, function () {
  var PADRAO = { modo: "local", apiBase: "/api", pesquisaRemota: false, usarLocalSeApiFalhar: true, pesquisaDestino: "" };
  /* arquivo local -> rota da API. Arquivo que nao esta aqui e sempre lido do disco. */
  var ROTAS = { "dados/cep_indice.json": "/cep_indice", "dados/servicos.json": "/servicos", "dados/vagas.json": "/vagas", "dados/gestao.json": "/gestao" };

  function global_() { return typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : {}); }
  function cfg() {
    var c = global_().MISM3_CONFIG || {}, o = {};
    Object.keys(PADRAO).forEach(function (k) { o[k] = c[k] !== undefined ? c[k] : PADRAO[k]; });
    return o;
  }
  function lerJson(url) {
    return fetch(url, { cache: "no-store" }).then(function (r) {
      if (!r.ok) throw new Error(url + " " + r.status);
      return r.json();
    });
  }

  /* Le um JSON do projeto. Em modo "api" tenta a API primeiro; se falhar (offline, 404, 500) usa o arquivo local. */
  function json(caminho) {
    var c = cfg(), rota = ROTAS[caminho];
    if (c.modo === "api" && rota) {
      return lerJson(c.apiBase + rota).catch(function (e) {
        if (c.usarLocalSeApiFalhar) return lerJson(caminho);
        throw e;
      });
    }
    return lerJson(caminho);
  }

  /* So aceita o que tem FONTE: resultado sem titulo ou sem link http(s) e descartado ("nada sem fonte"). */
  function normalizarResposta(j) {
    var saida = { necessidades: [], resultados: [] };
    if (j && Array.isArray(j.necessidades)) {
      saida.necessidades = j.necessidades.filter(function (x) { return typeof x === "string"; }).slice(0, 3);
    }
    if (j && Array.isArray(j.resultados)) {
      saida.resultados = j.resultados.filter(function (r) {
        return r && typeof r.titulo === "string" && r.titulo && typeof r.url === "string" && /^https?:\/\//i.test(r.url);
      }).slice(0, 10).map(function (r) {
        return { titulo: r.titulo.slice(0, 200), descricao: String(r.descricao || "").slice(0, 600), url: r.url,
          fonte: String(r.fonte || "").slice(0, 120), consultado_em: String(r.consultado_em || "").slice(0, 40) };
      });
    }
    return saida;
  }

  /* Pesquisa real (provedor plugado no servidor). Devolve null se desligada ou se falhar: a busca local continua valendo. */
  function pesquisar(texto, contexto) {
    var c = cfg();
    if (c.modo !== "api" || !c.pesquisaRemota) return Promise.resolve(null);
    return fetch(c.apiBase + "/pesquisar", {
      method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store",
      body: JSON.stringify({ texto: String(texto == null ? "" : texto).slice(0, 300), contexto: contexto || {} })
    }).then(function (r) {
      if (!r.ok) throw new Error("pesquisar " + r.status);
      return r.json();
    }).then(normalizarResposta).catch(function () { return null; });
  }

  return { cfg: cfg, json: json, pesquisar: pesquisar, normalizarResposta: normalizarResposta, ROTAS: ROTAS };
});
