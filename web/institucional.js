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
    { chave: "lazer", rotulo: "Lazer, cultura e esporte" },
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

  /* ---------- lazer: agenda por dia da semana ---------- */
  var DIAS = [
    { chave: "seg", rotulo: "Segunda" }, { chave: "ter", rotulo: "Terça" }, { chave: "qua", rotulo: "Quarta" },
    { chave: "qui", rotulo: "Quinta" }, { chave: "sex", rotulo: "Sexta" }, { chave: "sab", rotulo: "Sábado" }, { chave: "dom", rotulo: "Domingo" }
  ];
  var LAZER_CATEGORIAS = {
    esporte: "Esporte e atividade física", cultura: "Cultura", parques: "Parques e natureza",
    oficinas: "Oficinas e cursos livres", biblioteca: "Bibliotecas e leitura", eventos: "Eventos e feiras"
  };
  var PUBLICOS = { todas: "Para todas", criancas: "Para crianças", jovens: "Para jovens", idosos: "Para idosos" };

  function chaveDoDia(data) { return ["dom", "seg", "ter", "qua", "qui", "sex", "sab"][(data || new Date()).getDay()]; }
  function ocorreNoDia(item, dia) { return item.dias.indexOf(dia) !== -1 || item.dias.indexOf("diario") !== -1; }
  /* "7h as 8h" -> 7 ; "19h30" -> 19.5 ; "a confirmar" -> 99 (vai para o fim do dia) */
  function horaInicial(h) {
    var m = /(\d{1,2})\s*(?:h|:)\s*(\d{2})?/i.exec(String(h || ""));
    return m ? Number(m[1]) + (m[2] ? Number(m[2]) / 60 : 0) : 99;
  }
  function ordenarPorHora(itens) {
    return itens.slice().sort(function (a, b) { return horaInicial(a.horario) - horaInicial(b.horario) || a.nome.localeCompare(b.nome, "pt-BR"); });
  }
  function agendaSemanal(itens) {
    return DIAS.map(function (d) { return { dia: d, itens: ordenarPorHora(itens.filter(function (i) { return ocorreNoDia(i, d.chave); })) }; });
  }
  /* atividades sem dia fixo (so "variavel") nao cabem na grade: aparecem a parte */
  function semDiaFixo(itens) {
    return itens.filter(function (i) { return !i.dias.some(function (d) { return d !== "variavel"; }); });
  }
  /* filtro: categoria, gratuito (true), publico ("criancas" mostra tambem o que e "para todas"), dia ("hoje" ja vem resolvido em chave) */
  function filtrarLazer(itens, f) {
    f = f || {};
    return itens.filter(function (i) {
      if (f.categoria && i.categoria !== f.categoria) return false;
      if (f.gratuito && i.gratuito !== "sim") return false;
      if (f.publico && i.publico !== f.publico && i.publico !== "todas") return false;
      if (f.dia && !ocorreNoDia(i, f.dia)) return false;
      return true;
    });
  }
  function rotuloDias(dias) {
    if (dias.indexOf("diario") !== -1) return "Todos os dias";
    var nomes = DIAS.filter(function (d) { return dias.indexOf(d.chave) !== -1; }).map(function (d) { return d.rotulo; });
    return nomes.length ? nomes.join(", ") : "Dia a confirmar";
  }

  /* ---------- rede "De mulher para mulher": por AREA de servico, nao por nome ---------- */
  var ONDE_ATENDE = { estabelecimento: "No estabelecimento", casa_da_cliente: "Na casa da cliente", casa_da_profissional: "Na casa da profissional", online: "Online", a_combinar: "A combinar" };

  /* cadastro vencido (renovar_ate no passado) nao aparece, mesmo que o arquivo seja antigo */
  function cadastrosVigentes(cadastros, hojeISO) {
    return cadastros.filter(function (c) { return !c.renovar_ate || !hojeISO || c.renovar_ate >= hojeISO; });
  }
  function contarPorArea(cadastros) {
    var m = {};
    cadastros.forEach(function (c) { m[c.subtipo] = (m[c.subtipo] || 0) + 1; });
    return m;
  }
  /* filtro por area e/ou texto livre (servico, descricao, bairro). Ordem: area na ordem do arquivo de areas, depois nome. */
  function filtrarCadastros(cadastros, f) {
    f = f || {};
    var q = normalizar(f.texto || "");
    return cadastros.filter(function (c) {
      if (f.area && c.subtipo !== f.area) return false;
      if (!q) return true;
      var alvo = normalizar([c.nome, c.descricao, c.bairro, c.subtipo].join(" "));
      return q.split(" ").every(function (p) { return alvo.indexOf(p) !== -1; });
    });
  }

  function dataBR(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
    return m ? m[3] + "/" + m[2] + "/" + m[1] : (iso || "");
  }

  return { normalizar: normalizar, rotuloBairro: rotuloBairro, listaBairros: listaBairros, casa: casa,
    buscarPorBairro: buscarPorBairro, agruparUnidades: agruparUnidades, ehVinteEQuatroHoras: ehVinteEQuatroHoras,
    limparObservacao: limparObservacao, telefones: telefones, filtrarCanais: filtrarCanais, dataBR: dataBR,
    ONDE_ATENDE: ONDE_ATENDE, cadastrosVigentes: cadastrosVigentes, contarPorArea: contarPorArea, filtrarCadastros: filtrarCadastros,
    DIAS: DIAS, LAZER_CATEGORIAS: LAZER_CATEGORIAS, PUBLICOS: PUBLICOS, chaveDoDia: chaveDoDia, ocorreNoDia: ocorreNoDia, horaInicial: horaInicial,
    agendaSemanal: agendaSemanal, semDiaFixo: semDiaFixo, filtrarLazer: filtrarLazer, rotuloDias: rotuloDias, TEMAS: TEMAS, GRUPOS_CANAL: GRUPOS_CANAL };
});
