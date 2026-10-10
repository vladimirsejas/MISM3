/* Regras das paginas "Saude" e "Secretarias". Sem acesso a rede e sem DOM: roda no navegador e no Node (testes).
   O que a pessoa digita (bairro, busca) so e comparado aqui, neste aparelho. */
(function (raiz, fabrica) {
  if (typeof module === "object" && module.exports) module.exports = fabrica();
  else raiz.Institucional = fabrica();
})(typeof self !== "undefined" ? self : this, function () {

  var ABREVIACOES = { jd: "jardim", pq: "parque", vl: "vila", av: "avenida", cj: "conjunto", res: "residencial" };
  /* palavras que nao identificam o bairro sozinhas: so as de "tipo" (jardim, vila...) restringem o casamento */
  var TIPOS = ["jardim", "parque", "vila", "distrito", "recanto", "chacara"];
  var LIGACAO = ["de", "da", "do", "das", "dos", "e", "bairro", "zona"];

  function normalizar(texto) {
    var t = String(texto == null ? "" : texto).toLowerCase()
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, " ").trim();
    return t.split(" ").filter(Boolean).map(function (p) { return ABREVIACOES[p] || p; }).join(" ");
  }
  function tokens(texto) { var n = normalizar(texto); return n ? n.split(" ") : []; }

  /* "Jd. Santa Clara" -> "Jardim Santa Clara" (para mostrar a pessoa) */
  function rotuloBairro(b) {
    return String(b || "").replace(/\b(Jd|Pq|Vl|Av|Cj|Res)\.?(?=\s)/g, function (m, a) { return { Jd: "Jardim", Pq: "Parque", Vl: "Vila", Av: "Avenida", Cj: "Conjunto", Res: "Residencial" }[a]; })
      .replace(/\s+/g, " ").trim();
  }

  /* Todos os bairros citados (atendidos por UBS ou onde ha unidade), sem repeticao, em ordem alfabetica */
  function listaBairros(unidades) {
    var mapa = {};
    unidades.forEach(function (u) {
      (u.bairros || []).concat(u.bairro ? [u.bairro] : []).forEach(function (b) {
        var r = rotuloBairro(b), k = normalizar(r);
        if (k && !mapa[k]) mapa[k] = r;
      });
    });
    return Object.keys(mapa).sort().map(function (k) { return mapa[k]; });
  }

  /* A consulta casa com o bairro? Todos os termos "fortes" da consulta precisam ser inicio de alguma palavra do bairro
     (assim "chervez" ja acha "Jardim Chervezon"), e se a pessoa escreveu "vila"/"jardim"/"parque", o bairro tem que ter
     essa mesma palavra ("vila cristina" nao casa com "Jardim Cristina"). */
  function casa(consulta, bairro) {
    var q = tokens(consulta).filter(function (p) { return LIGACAO.indexOf(p) === -1; });
    var b = tokens(bairro);
    if (!q.length) return false;
    var fortes = q.filter(function (p) { return TIPOS.indexOf(p) === -1; });
    if (!fortes.length) return false;                       /* so "jardim": nao diz qual */
    var tiposQ = q.filter(function (p) { return TIPOS.indexOf(p) !== -1; });
    if (tiposQ.some(function (t) { return b.indexOf(t) === -1; })) return false;
    return fortes.every(function (p) {
      return b.some(function (w) { return w === p || (p.length >= 3 && w.indexOf(p) === 0); });
    });
  }

  /* Resultado para "qual e a minha unidade?":
       atende  = UBS cujo guia oficial lista o bairro na area de abrangencia (unidade de referencia)
       fica    = unidades que ficam no bairro (USF, urgencia, CAPS...) e nao estao acima */
  function buscarPorBairro(texto, unidades) {
    var vazio = { consulta: String(texto || "").trim(), curta: true, atende: [], fica: [] };
    if (normalizar(texto).replace(/ /g, "").length < 3) return vazio;
    var atende = [], fica = [], usados = {};
    unidades.forEach(function (u) {
      var achado = (u.bairros || []).filter(function (b) { return casa(texto, b); })[0];
      if (achado) { atende.push({ unidade: u, via: rotuloBairro(achado) }); usados[u.id] = true; }
    });
    unidades.forEach(function (u) {
      if (usados[u.id] || !u.bairro || !casa(texto, u.bairro)) return;
      fica.push({ unidade: u, via: rotuloBairro(u.bairro) });
    });
    return { consulta: vazio.consulta, curta: false, atende: atende, fica: fica };
  }

  var GRUPOS_SAUDE = [
    { chave: "urgencia", rotulo: "Urgência e emergência", subtipos: ["urgencia"] },
    { chave: "ubs", rotulo: "Unidades Básicas de Saúde (UBS)", subtipos: ["ubs"] },
    { chave: "usf", rotulo: "Unidades de Saúde da Família (USF)", subtipos: ["usf"] },
    { chave: "outros", rotulo: "Saúde mental e outros serviços", subtipos: ["caps", "vigilancia"] }
  ];
  function agruparUnidades(unidades) {
    return GRUPOS_SAUDE.map(function (g) {
      return { chave: g.chave, rotulo: g.rotulo, unidades: unidades.filter(function (u) { return g.subtipos.indexOf(u.subtipo) !== -1; }) };
    }).filter(function (g) { return g.unidades.length; });
  }
  function ehVinteEQuatroHoras(u) { return /24\s*h/i.test(u.horario || ""); }

  /* Telefones de um campo livre: "(19) 3535-2908 / 3535-0709" -> dois links tel: (o 2o herda o DDD) */
  function telefones(campo) {
    /* "9 9956-3042" (nono digito separado por espaco) e "98912-0719" (colado) sao os dois formatos do catalogo */
    var saida = [], ddd = "19", re = /(?:\((\d{2})\)\s*)?(?:(9)\s)?(\d{4,5})-(\d{4})/g, m;
    var txt = String(campo || "");
    while ((m = re.exec(txt))) {
      if (m[1]) ddd = m[1];
      var nono = m[2] || "";
      saida.push({ texto: "(" + ddd + ") " + (nono ? nono + " " : "") + m[3] + "-" + m[4], href: "tel:+55" + ddd + nono + m[3] + m[4] });
    }
    return saida;
  }

  /* A observacao do cadastro repete em toda UBS (a) a lista de bairros, que a tela mostra em separado, e (b) frases que a
     pagina diz uma vez so, para todas as unidades. Tira so isso; o que for especifico da unidade fica. */
  var FRASES_GERAIS = [
    /Atende moradores de:.*?\.(?=\s|$)(?=\s*(?:Atendimento|Coleta|P[aá]gina|$))/,
    /Atendimento m[eé]dico de cl[ií]nica geral;[^.]*\.\s*/,
    /Coleta de exames, inclusive Papanicolau\.\s*/,
    /Sem CEP\/coordenadas validados[^.]*\.\s*/,                 /* notas internas: a pagina nao tem mapa */
    /Sem coordenadas validadas\.\s*/,
    /Endere[cç]o e telefone publicados na p[aá]gina municipal\.\s*/,
    /Dados lidos de captura de tela[^.]*\.\s*/,   /* nota de procedencia: vai uma vez so, no rodape da pagina */
    /P[aá]gina oficial sem data de atualiza[cç][aã]o: confirme por telefone antes de ir\.\s*/
  ];
  function limparObservacao(u) {
    var t = String((u && u.observacao) || "");
    FRASES_GERAIS.forEach(function (re) { t = t.replace(re, ""); });
    return t.replace(/\s+/g, " ").trim();
  }

  var TEMAS = [
    { chave: "mulher", rotulo: "Mulher e proteção" },
    { chave: "saude", rotulo: "Saúde" },
    { chave: "assistencia", rotulo: "Assistência social e direitos" },
    { chave: "trabalho", rotulo: "Trabalho e renda" },
    { chave: "educacao", rotulo: "Educação" },
    { chave: "cidade", rotulo: "Cidade e mobilidade" },
    { chave: "cidadania", rotulo: "Atendimento ao cidadão" },
    { chave: "outras", rotulo: "Outras secretarias" }
  ];
  var GRUPOS_CANAL = { secretaria: "Secretaria", canal: "Canal de atendimento", saude: "Página da Saúde", documento: "Documento" };

  /* Filtra por texto livre e/ou tema. Paginas ja conferidas vem antes das apenas listadas. */
  function filtrarCanais(canais, filtro) {
    var f = filtro || {}, q = normalizar(f.texto || "");
    var lista = canais.filter(function (c) {
      if (f.tema && c.temas.indexOf(f.tema) === -1) return false;
      if (f.grupo && c.grupo !== f.grupo) return false;
      if (!q) return true;
      var alvo = normalizar(c.nome + " " + c.descricao);
      return q.split(" ").every(function (p) { return alvo.indexOf(p) !== -1; });
    });
    return lista.map(function (c, i) { return { c: c, i: i }; }).sort(function (a, b) {
      var sa = a.c.situacao === "conferido" ? 0 : 1, sb = b.c.situacao === "conferido" ? 0 : 1;
      return sa - sb || a.i - b.i;
    }).map(function (x) { return x.c; });
  }

  function dataBR(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
    return m ? m[3] + "/" + m[2] + "/" + m[1] : (iso || "");
  }

  return { normalizar: normalizar, rotuloBairro: rotuloBairro, listaBairros: listaBairros, casa: casa,
    buscarPorBairro: buscarPorBairro, agruparUnidades: agruparUnidades, ehVinteEQuatroHoras: ehVinteEQuatroHoras,
    limparObservacao: limparObservacao, telefones: telefones, filtrarCanais: filtrarCanais, dataBR: dataBR, TEMAS: TEMAS, GRUPOS_CANAL: GRUPOS_CANAL };
});
