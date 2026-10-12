/* Mapa de serviços do Mulher Resolve: lógica pura (sem DOM), testável no Node e usada no navegador.
   Princípio: só desenha ponto onde existe localização de verdade. Serviço sem localização fica na lista, com link para
   pesquisar o endereço, e nunca ganha um ponto inventado. */
(function (raiz, fabrica) {
  if (typeof module === "object" && module.exports) module.exports = fabrica(require("./acesso.js"));
  else raiz.MapaServicos = fabrica(raiz.Acesso);
})(typeof self !== "undefined" ? self : this, function (Acesso) {
  /* Caixa de Rio Claro com folga (a mesma que o pipeline usa): coordenada fora dela é descartada. */
  var CAIXA = { latMin: -22.60, latMax: -22.20, lonMin: -47.82, lonMax: -47.41 };
  /* CEP com raio acima disso é vago demais para posicionar um serviço (mesmo limite do mapa territorial). */
  var RAIO_MAX_CEP_M = 800;

  /* Cor E forma por categoria: a cor sozinha não basta para quem não distingue cores. */
  var ESTILO = {
    mulher: { cor: "#a0404c", forma: "circulo", curto: "Apoio à mulher" },
    assistencia: { cor: "#b5651d", forma: "quadrado", curto: "Assistência social" },
    creche: { cor: "#4f7d3f", forma: "losango", curto: "Creches e escolas" },
    saude: { cor: "#2b6f8e", forma: "triangulo", curto: "Saúde" },
    emprego_curso: { cor: "#6b4f9e", forma: "hexagono", curto: "Trabalho e cursos" }
  };
  var PONTOS_FORMA = {
    circulo: null,
    quadrado: "5,5 19,5 19,19 5,19",
    losango: "12,2 22,12 12,22 2,12",
    triangulo: "12,3 22,21 2,21",
    hexagono: "7,3 17,3 23,12 17,21 7,21 1,12"
  };

  function dentroDeRioClaro(lat, lon) {
    return typeof lat === "number" && typeof lon === "number" && isFinite(lat) && isFinite(lon) &&
      lat >= CAIXA.latMin && lat <= CAIXA.latMax && lon >= CAIXA.lonMin && lon <= CAIXA.lonMax;
  }

  /* Localização de um serviço: 'endereco' (coordenada do catálogo) ou 'cep' (centro aproximado do CEP) ou null. */
  function posicao(s, indiceCep) {
    if (dentroDeRioClaro(s.lat, s.lon)) return { lat: s.lat, lon: s.lon, precisao: "endereco", raio_m: 0 };
    var cep = Acesso.normalizarCep(s.cep);
    var v = cep && indiceCep ? indiceCep[cep] : null;
    if (v && Number(v[2]) <= RAIO_MAX_CEP_M && dentroDeRioClaro(Number(v[0]), Number(v[1]))) {
      return { lat: Number(v[0]), lon: Number(v[1]), precisao: "cep", raio_m: Math.round(Number(v[2])) };
    }
    return null;
  }

  function preparar(servicos, indiceCep) {
    return servicos.map(function (s) { return Object.assign({}, s, { pos: posicao(s, indiceCep) }); });
  }

  function contagem(lista) {
    var c = { endereco: 0, cep: 0, sem: 0 };
    lista.forEach(function (s) { c[s.pos ? s.pos.precisao : "sem"]++; });
    return c;
  }

  function semAcento(t) {
    return String(t == null ? "" : t).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  }

  /* Abreviações que aparecem nas fontes oficiais ("Jd. Brasília") e que a pessoa escreve por extenso (ou o contrário). */
  var ABREVIACOES = { jd: "jardim", jdm: "jardim", vl: "vila", pq: "parque", res: "residencial", resid: "residencial", cj: "conjunto", conj: "conjunto", cond: "condominio", dist: "distrito", chac: "chacara" };
  var SEM_VALOR = { de: 1, da: 1, do: 1, dos: 1, das: 1 };

  /* Texto comparável de um nome de bairro: sem acento, sem pontuação, abreviações abertas, sem "de/da/do". */
  function normalizarBairro(t) {
    return semAcento(t).replace(/[^a-z0-9]+/g, " ").trim().split(" ").filter(Boolean)
      .map(function (w) { return ABREVIACOES[w] || w; })
      .filter(function (w) { return !SEM_VALOR[w]; }).join(" ");
  }

  /* Apelidos confirmados: [{apelido, aponta_para:[nomes como nas fontes], situacao}]. Só os "confirmado" valem; os "a_confirmar" ficam guardados e não são usados. */
  function apelidosConfirmados(lista) {
    return (lista || []).filter(function (a) { return a && a.situacao === "confirmado" && a.apelido && a.aponta_para && a.aponta_para.length; });
  }

  /* Termos a procurar para o que a pessoa digitou: o próprio texto e, se for um apelido confirmado, os nomes para onde ele aponta. */
  function termosDeBusca(texto, apelidos) {
    var q = normalizarBairro(texto);
    if (!q) return [];
    var termos = [q];
    apelidosConfirmados(apelidos).forEach(function (a) {
      if (normalizarBairro(a.apelido) === q) a.aponta_para.forEach(function (n) { termos.push(normalizarBairro(n)); });
    });
    return termos;
  }

  /* ativas: { tipo: true/false }. texto: busca em nome, endereço e bairros (sem acento, com abreviações abertas e apelidos confirmados). */
  function filtrar(lista, ativas, texto, apelidos) {
    var termos = termosDeBusca(texto, apelidos);
    return lista.filter(function (s) {
      if (ativas && ativas[s.tipo] === false) return false;
      if (!termos.length) return true;
      var palheiro = normalizarBairro([s.nome, s.endereco, s.bairros].join(" "));
      return termos.some(function (t) { return palheiro.indexOf(t) !== -1; });
    });
  }

  /* Os nomes oficiais trazem sufixos ("Jd. Brasília I e II") e tipo ("Jd.", "Vila"); a moradora escreve só "Brasília". */
  var TIPOS = { jardim: 1, vila: 1, parque: 1, residencial: 1, conjunto: 1, condominio: 1, chacara: 1, habitacional: 1 };
  var SUFIXO = /^(i|ii|iii|iv|v|vi|vii|viii|ix|x|e|\d)$/;
  function semSufixo(n) {
    var t = n.split(" ");
    while (t.length > 1 && SUFIXO.test(t[t.length - 1])) t.pop();
    return t.join(" ");
  }
  function semTipo(n) {
    var t = n.split(" ");
    while (t.length > 1 && TIPOS[t[0]]) t.shift();
    return t.join(" ");
  }

  /* Qual CRAS atende um bairro? Só pela lista oficial de bairros de cada CRAS (campo "bairros" do catálogo): nada de adivinhar por distância.
     Procura em três etapas, da mais segura para a mais aproximada, e para na primeira que achar:
       "exato"        o nome igual ao da lista;
       "sem_numeral"  igual, ignorando sufixos como "I e II";
       "sem_tipo"     igual, ignorando também "Jd./Vila/Parque" (pode juntar bairros diferentes: a tela pede confirmação).
     Devolve { status, metodo, cras: [{servico, bairro}], sugestoes }. status: "ok" (um CRAS), "varios" (mais de um CRAS),
     "nao_encontrado" ou "vazio". "bairro" é sempre o nome como está na lista oficial. */
  function crasDoBairro(texto, servicos, apelidos) {
    var termos = termosDeBusca(texto, apelidos);
    if (!termos.length) return { status: "vazio", metodo: "", cras: [], sugestoes: [] };
    var itens = [];
    servicos.filter(function (s) { return s.subtipo === "cras" && s.bairros; }).forEach(function (s) {
      String(s.bairros).split(",").forEach(function (nome) {
        var n = normalizarBairro(nome);
        if (n) itens.push({ servico: s, bairro: nome.trim(), n: n, n2: semSufixo(n), n3: semTipo(semSufixo(n)) });
      });
    });
    var etapas = [["exato", function (i) { return i.n; }, function (t) { return t; }],
      ["sem_numeral", function (i) { return i.n2; }, semSufixo],
      ["sem_tipo", function (i) { return i.n3; }, function (t) { return semTipo(semSufixo(t)); }]];
    for (var e = 0; e < etapas.length; e++) {
      var alvo = termos.map(etapas[e][2]), vistos = {}, achados = [];
      itens.forEach(function (i) {
        if (alvo.indexOf(etapas[e][1](i)) === -1) return;
        var chave = i.servico.id + "|" + i.n;
        if (!vistos[chave]) { vistos[chave] = 1; achados.push({ servico: i.servico, bairro: i.bairro }); }
      });
      if (achados.length && e === 0 && termos.every(function (t) { return t === semSufixo(t); })) {
        /* Quem não escreveu "I/II" pode morar na parte II: "Jd. Paulista" e "Jd. Paulista II" podem ser de CRAS diferentes. */
        itens.forEach(function (i) {
          var chave = i.servico.id + "|" + i.n;
          if (alvo.indexOf(i.n2) !== -1 && !vistos[chave]) { vistos[chave] = 1; achados.push({ servico: i.servico, bairro: i.bairro }); }
        });
      }
      if (achados.length) {
        var distintos = {};
        achados.forEach(function (a) { distintos[a.servico.id] = 1; });
        return { status: Object.keys(distintos).length === 1 ? "ok" : "varios", metodo: etapas[e][0], cras: achados, sugestoes: [] };
      }
    }
    var sugestoes = [];
    itens.forEach(function (i) {
      if (termos.some(function (t) { return i.n.indexOf(t) !== -1 || t.indexOf(i.n) !== -1; })) sugestoes.push({ bairro: i.bairro, servico: i.servico });
    });
    return { status: "nao_encontrado", metodo: "", cras: [], sugestoes: sugestoes.slice(0, 6) };
  }

  /* Com origem [lat, lon]: serviços com posição por distância em linha reta; sem posição ao fim, por nome.
     Sem origem: por categoria (ordem do site) e nome. */
  function ordenar(lista, origem) {
    var ordem = Acesso.ORDEM;
    var comDist = lista.map(function (s) {
      var d = origem && s.pos ? Acesso.haversine(origem[0], origem[1], s.pos.lat, s.pos.lon) : null;
      return Object.assign({}, s, { distancia_m: d });
    });
    return comDist.sort(function (a, b) {
      if (origem) {
        if ((a.distancia_m == null) !== (b.distancia_m == null)) return a.distancia_m == null ? 1 : -1;
        if (a.distancia_m != null && a.distancia_m !== b.distancia_m) return a.distancia_m - b.distancia_m;
      } else if (a.tipo !== b.tipo) {
        return ordem.indexOf(a.tipo) - ordem.indexOf(b.tipo);
      }
      return String(a.nome).localeCompare(String(b.nome), "pt-BR");
    });
  }

  /* ---- CEP <-> bairro ----
     O índice de CEP guarda o setor censitário de cada CEP, e a malha do IBGE dá um nome de bairro a cada setor (setor_bairro.json).
     Isso diz o bairro PROVÁVEL de um CEP, não o certo: o nome do IBGE é agrupado (cerca de 27 nomes) e um CEP grande pode cobrir
     mais de um bairro. Sem setor ou sem bairro no setor, não devolve nada (nada é inventado). */
  function setorDoCep(cep, indiceCep) {
    var v = indiceCep && indiceCep[cep];
    return v && v[3] ? String(v[3]).replace(/\D/g, "").slice(0, 15) : null;
  }
  function bairroDoCep(cep, indiceCep, setorBairro) {
    var set = setorDoCep(cep, indiceCep), nome = set && setorBairro && setorBairro[set];
    if (!nome) return null;
    return { bairro: nome, area_grande: Number(indiceCep[cep][2]) > RAIO_MAX_CEP_M };
  }
  function chaveBairro(n) { return semSufixo(normalizarBairro(n)); }
  /* Vice-versa: os CEPs cujo setor tem este bairro (compara sem acento, sem "Jd./Jardim" e sem numeral romano). */
  function cepsDoBairro(bairro, indiceCep, setorBairro) {
    var alvo = chaveBairro(bairro), lista = [];
    if (!alvo || !indiceCep || !setorBairro) return lista;
    Object.keys(indiceCep).forEach(function (cep) {
      var b = bairroDoCep(cep, indiceCep, setorBairro);
      if (b && chaveBairro(b.bairro) === alvo) lista.push(cep);
    });
    return lista.sort();
  }

  /* Lista JÁ ordenada por distância (saída de ordenar com origem): o serviço mais perto de cada tipo, só entre os que têm
     posição, na ordem de categorias do site. Sem origem ou sem posição, não devolve nada (nada é inventado). */
  function maisPertoPorTipo(ordenada) {
    var primeiro = {};
    ordenada.forEach(function (s) {
      if (s.distancia_m == null || primeiro[s.tipo]) return;
      primeiro[s.tipo] = s;
    });
    return Acesso.ORDEM.filter(function (t) { return primeiro[t]; }).map(function (t) { return primeiro[t]; });
  }

  /* Pesquisa o endereço no Google Maps (abre em outra aba, por clique da pessoa). Só leva o endereço do SERVIÇO. */
  function linkGoogleMaps(s) {
    var end = String(s.endereco || "").replace(/,?\s*CEP\s*[\d.-]+/i, "").trim();
    if (!end) return null;
    return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(end + ", Rio Claro, SP");
  }

  /* Primeiro telefone do texto ("(19) 3532-4014 / (19) 3532-5221", "(19) 9 9956-3042 (WhatsApp)") só com dígitos, ou null. */
  function primeiroTelefone(texto) {
    var m = /\(?\s*(\d{2})\s*\)?\s*(9?\s?\d{4})\s*-?\s*(\d{4})/.exec(String(texto || ""));
    return m ? (m[1] + m[2] + m[3]).replace(/\s/g, "") : null;
  }

  function rotuloPrecisao(pos) {
    if (!pos) return "Sem posição no mapa: confira o endereço na lista.";
    if (pos.precisao === "endereco") return "Posição pelo endereço";
    return "Posição aproximada pelo CEP (raio de cerca de " + pos.raio_m + " m)";
  }

  /* SVG do marcador: cheio = pelo endereço; vazado = aproximado pelo CEP. Só constantes, nunca texto de serviço. */
  function svgMarcador(tipo, aproximado) {
    var e = ESTILO[tipo] || ESTILO.assistencia, pts = PONTOS_FORMA[e.forma];
    var fill = aproximado ? "#ffffff" : e.cor, stroke = aproximado ? e.cor : "#ffffff", w = aproximado ? 3 : 2;
    var forma = pts ? '<polygon points="' + pts + '"' : '<circle cx="12" cy="12" r="9"';
    return '<svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true" focusable="false">' + forma +
      ' fill="' + fill + '" stroke="' + stroke + '" stroke-width="' + w + '" stroke-linejoin="round"/></svg>';
  }

  return { CAIXA: CAIXA, RAIO_MAX_CEP_M: RAIO_MAX_CEP_M, ESTILO: ESTILO, dentroDeRioClaro: dentroDeRioClaro, posicao: posicao,
    preparar: preparar, contagem: contagem, filtrar: filtrar, ordenar: ordenar, maisPertoPorTipo: maisPertoPorTipo, bairroDoCep: bairroDoCep, cepsDoBairro: cepsDoBairro, linkGoogleMaps: linkGoogleMaps,
    rotuloPrecisao: rotuloPrecisao, primeiroTelefone: primeiroTelefone, normalizarBairro: normalizarBairro,
    apelidosConfirmados: apelidosConfirmados, termosDeBusca: termosDeBusca, crasDoBairro: crasDoBairro, svgMarcador: svgMarcador, semAcento: semAcento };
});
