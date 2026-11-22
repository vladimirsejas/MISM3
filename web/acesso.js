/* Logica pura do Observatório da Mulher (sem DOM): testavel no Node e usada no navegador. */
(function (raiz, fabrica) {
  if (typeof module === "object" && module.exports) module.exports = fabrica();
  else raiz.Acesso = fabrica();
})(typeof self !== "undefined" ? self : this, function () {
  var ORDEM = ["mulher", "assistencia", "creche", "saude", "emprego_curso"];
  var ROTULOS = {
    mulher: "Apoio e proteção à mulher",
    assistencia: "Assistência social (CRAS, CREAS e outros)",
    creche: "Creches e educação infantil",
    saude: "Saúde",
    emprego_curso: "Trabalho, renda e cursos"
  };

  var ROTULOS_SUBTIPO = {
    ubs: "Unidade básica de saúde",
    urgencia: "Pronto atendimento / urgência",
    hospital: "Hospital",
    caps: "CAPS (saúde mental)",
    especialidades: "Atendimento especializado",
    secretaria: "Secretaria municipal",
    escola_municipal: "Escola municipal",
    pat: "Posto de Atendimento ao Trabalhador",
    conecta: "Emprego e oportunidades",
    credito: "Crédito para empreender",
    qualificacao: "Cursos gratuitos de qualificação",
    curso_profissionalizante: "Curso profissionalizante",
    curso_tecnico: "Curso técnico",
    escola_sesi: "Escola SESI",
    eja: "Educação de Jovens e Adultos (EJA)",
    graduacao: "Graduação (licenciaturas)",
    curso_superior_tecnologia: "Curso superior de tecnologia",
    fundo_social: "Fundo Social de Solidariedade",
    sede: "Sede administrativa",
    procon: "Procon (defesa do consumidor)",
    habitacao: "Secretaria de Habitação (cadastro habitacional)",
    defesa_civil: "Defesa Civil",
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

  // Idade da verificacao de um servico. Nao julga o dado: so informa ha quanto tempo foi conferido.
  var LIMITE_DIAS = 90;
  function idadeVerificacao(iso, hoje) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ""));
    if (!m) return { dias: null, antigo: true, texto: "data de verificação não informada" };
    var ref = hoje || new Date();
    var d0 = Date.UTC(+m[1], +m[2] - 1, +m[3]);
    var d1 = Date.UTC(ref.getFullYear(), ref.getMonth(), ref.getDate());
    var dias = Math.round((d1 - d0) / 86400000);
    if (dias < 0) return { dias: null, antigo: true, texto: "data de verificação inválida" };
    var texto = dias === 0 ? "verificado hoje" : dias === 1 ? "verificado há 1 dia" : "verificado há " + dias + " dias";
    return { dias: dias, antigo: dias > LIMITE_DIAS, texto: texto };
  }

  /* Estado da conferência do registro (vem do pipeline em "estado_conferencia"). Campo ausente ou vazio NUNCA vira "confirmado":
     dado antigo sem o campo só é "não confirmado" se dizia conferido=false; o resto é "pendente". */
  var TEXTO_CONFERENCIA = {
    confirmado: "Conferido pela equipe do projeto na fonte.",
    nao_confirmado: "Ainda não conferido na página oficial. Ligue antes de ir.",
    pendente: "A equipe ainda não conferiu estas informações. Ligue antes de ir."
  };
  function estadoConferencia(s) {
    var e = s && s.estado_conferencia;
    if (e === "confirmado" || e === "nao_confirmado" || e === "pendente") return e;
    return s && s.conferido === false ? "nao_confirmado" : "pendente";
  }
  function textoConferencia(s) { return TEXTO_CONFERENCIA[estadoConferencia(s)]; }

  /* Procedência e atualidade. A data do registro é a da CONSULTA (quando o projeto leu a fonte), não a da atualização pelo órgão.
     Limites em dias: os mesmos de pipeline/servicos.py (LIMITES_ATUALIDADE); um teste confere. Nenhum rótulo diz "atualizado". */
  var LIMITES_ATUALIDADE = { recente_ate_dias: 30, a_renovar_ate_dias: 90 };
  function atualidade(iso, hoje) {
    var i = idadeVerificacao(iso, hoje);
    if (i.dias === null) return { dias: null, estado: "desconhecida" };
    var e = i.dias <= LIMITES_ATUALIDADE.recente_ate_dias ? "consulta_recente" : i.dias <= LIMITES_ATUALIDADE.a_renovar_ate_dias ? "consulta_a_renovar" : "consulta_antiga";
    return { dias: i.dias, estado: e };
  }
  function dataBrCurta(iso) { var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || "")); return m ? m[3] + "/" + m[2] + "/" + m[1] : ""; }
  /* "Consultada em 10/10/2026 (há 42 dias)." + o que isso NÃO quer dizer. */
  function textoConsulta(s, hoje) {
    var a = atualidade(s && s.verificado_em, hoje);
    if (a.dias === null) return "Não há registro de quando esta fonte foi consultada: confirme antes de ir.";
    var quando = a.dias === 0 ? "hoje" : a.dias === 1 ? "há 1 dia" : "há " + a.dias + " dias";
    var t = "Fonte consultada pela equipe em " + dataBrCurta(s.verificado_em) + " (" + quando + ").";
    if (s.data_atualizacao_fonte) return t + " O órgão informa atualização em " + dataBrCurta(s.data_atualizacao_fonte) + ".";
    return t + " Não sabemos quando o órgão atualizou a página.";
  }
  /* De onde veio: fonte identificada, genérica ou não identificada (campo "fonte_tipo" do pipeline). */
  function textoProcedencia(s) {
    var t = s && s.fonte_tipo;
    if (t === "generica") return "Só sabemos o site do órgão; a página exata de onde vieram estes dados não foi registrada.";
    if (t === "nao_identificada") return "Fonte não identificada com precisão: a informação veio de pesquisa, não de uma página oficial conferida.";
    return "";
  }

  return { LIMITES_ATUALIDADE: LIMITES_ATUALIDADE, atualidade: atualidade, textoConsulta: textoConsulta, textoProcedencia: textoProcedencia,
    estadoConferencia: estadoConferencia, textoConferencia: textoConferencia, ORDEM: ORDEM, ROTULOS: ROTULOS, rotuloSubtipo: rotuloSubtipo, normalizarCep: normalizarCep, haversine: haversine,
    formatarDistancia: formatarDistancia, idadeVerificacao: idadeVerificacao, LIMITE_DIAS: LIMITE_DIAS, comDistancia: comDistancia, buscar: buscar };
});
