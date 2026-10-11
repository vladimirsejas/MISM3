/* Mapa de serviços do Mulher em Rede: lógica pura (sem DOM), testável no Node e usada no navegador.
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
    return String(t == null ? "" : t).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  }

  /* ativas: { tipo: true/false }. texto: busca em nome, endereço e bairros, sem acento. */
  function filtrar(lista, ativas, texto) {
    var q = semAcento(texto).trim();
    return lista.filter(function (s) {
      if (ativas && ativas[s.tipo] === false) return false;
      if (!q) return true;
      return semAcento([s.nome, s.endereco, s.bairros].join(" ")).indexOf(q) !== -1;
    });
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
    preparar: preparar, contagem: contagem, filtrar: filtrar, ordenar: ordenar, linkGoogleMaps: linkGoogleMaps,
    rotuloPrecisao: rotuloPrecisao, primeiroTelefone: primeiroTelefone, svgMarcador: svgMarcador, semAcento: semAcento };
});
