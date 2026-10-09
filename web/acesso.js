/* Logica pura do Mapa do Cuidado (sem DOM): testavel no Node e usada no navegador. */
(function (raiz, fabrica) {
  if (typeof module === "object" && module.exports) module.exports = fabrica();
  else raiz.Acesso = fabrica();
})(typeof self !== "undefined" ? self : this, function () {
  var ORDEM = ["mulher", "assistencia", "creche", "educacao_infantil", "saude", "emprego_curso", "mulher_para_mulher"];
  var ROTULOS = {
    mulher: "Apoio e proteção à mulher",
    assistencia: "Assistência social (CRAS, CREAS e outros)",
    creche: "Creches (escolas que declaram oferecer creche)",
    educacao_infantil: "Escolas com Educação Infantil (não confirma creche)",
    saude: "Saúde",
    emprego_curso: "Trabalho, renda e cursos",
    mulher_para_mulher: "De mulher para mulher"
  };

  var ROTULOS_SUBTIPO = {
    ubs: "Unidade básica de saúde",
    urgencia: "Pronto atendimento / urgência",
    hospital: "Hospital",
    caps: "CAPS (saúde mental)",
    especialidades: "Atendimento especializado",
    secretaria: "Secretaria municipal",
    pat: "Posto de Atendimento ao Trabalhador",
    conecta: "Emprego e oportunidades",
    credito: "Crédito para empreender",
    qualificacao: "Cursos gratuitos de qualificação",
    fundo_social: "Fundo Social de Solidariedade",
    sede: "Sede administrativa",
    municipal: "Rede municipal",
    estadual: "Rede estadual",
    federal: "Rede federal",
    privada: "Rede privada"
  };

  function rotuloSubtipo(s) { return (s && ROTULOS_SUBTIPO[s]) || null; }

  function normalizarCep(v) {
    var s = String(v == null ? "" : v).replace(/\D/g, "");
    if (s.length !== 8 || s === "00000000") return null;
    return s;
  }

  function haversine(lat1, lon1, lat2, lon2) {
    var R = 6371000, rad = Math.PI / 180;
    var dp = (lat2 - lat1) * rad, dl = (lon2 - lon1) * rad;
    var a = Math.sin(dp / 2) * Math.sin(dp / 2) +
      Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dl / 2) * Math.sin(dl / 2);
    return 2 * R * Math.asin(Math.sqrt(a));
  }

  function formatarDistancia(m) {
    if (m == null) return "";
    if (m < 950) return "cerca de " + Math.max(100, Math.round(m / 100) * 100) + " m";
    return "cerca de " + (Math.round(m / 100) / 10).toString().replace(".", ",") + " km";
  }

  /* area = [lat, lon, raio_m, setor, n]. Devolve servicos com distancia, ordenados. */
  function comDistancia(area, servicos) {
    return servicos.map(function (s) {
      var d = (s.lat != null && s.lon != null) ? haversine(area[0], area[1], s.lat, s.lon) : null;
      return Object.assign({}, s, { distancia_m: d });
    });
  }

  function buscar(cepDigitado, indice, servicos, porGrupo) {
    porGrupo = porGrupo || 3;
    var cep = normalizarCep(cepDigitado);
    if (!cep) return { status: "cep_invalido" };
    var area = indice[cep];
    if (!area) return { status: "cep_desconhecido", cep: cep };
    var todos = comDistancia(area, servicos);
    var grupos = ORDEM.map(function (tipo) {
      var doTipo = todos.filter(function (s) { return s.tipo === tipo; });
      var municipais = doTipo.filter(function (s) { return s.abrangencia === "municipal"; });
      var locais = doTipo.filter(function (s) { return s.abrangencia !== "municipal"; });
      var comLocal = locais.filter(function (s) { return s.distancia_m != null; })
        .sort(function (a, b) { return a.distancia_m - b.distancia_m; });
      var semLocal = locais.filter(function (s) { return s.distancia_m == null; });
      return {
        tipo: tipo, rotulo: ROTULOS[tipo],
        proximos: comLocal.slice(0, porGrupo), municipais: municipais,
        sem_localizacao: semLocal, total_local: locais.length
      };
    });
    return { status: "ok", cep: cep, area: { lat: area[0], lon: area[1], raio_m: area[2], setor: area[3], n: area[4] }, grupos: grupos };
  }

  return { ORDEM: ORDEM, ROTULOS: ROTULOS, rotuloSubtipo: rotuloSubtipo, normalizarCep: normalizarCep, haversine: haversine,
    formatarDistancia: formatarDistancia, comDistancia: comDistancia, buscar: buscar };
});
