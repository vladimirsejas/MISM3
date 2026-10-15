/* IA do Mulher em Rede: lê o que a mulher escreve e sugere por onde começar.
   Combina duas coisas: (1) um modelo de aprendizado de máquina treinado pela equipe (pipeline/treinar_necessidades.py), cujos pesos
   ficam em dados/modelo_necessidades.json, e (2) as regras de palavras-chave de necessidades.js. O texto é lido e descartado NO
   APARELHO: nada é enviado, gravado nem registrado. Não decide direitos nem faz diagnóstico: só sugere áreas do site. */
(function (raiz, fabrica) {
  if (typeof module === "object" && module.exports) module.exports = fabrica(require("./necessidades.js"));
  else raiz.MISM3IA = fabrica(raiz.MISM3Necessidades);
})(typeof self !== "undefined" ? self : this, function (Regras) {
  "use strict";

  /* Para onde cada necessidade leva. Textos curtos, sem prometer nada. */
  var CAMINHOS = {
    violencia: { titulo: "Proteção contra a violência", texto: "Orientação e canais oficiais. Se há perigo agora, use o botão “Em perigo agora?”.", href: "#direitos", urgente: true },
    casamento: { titulo: "Separação, pensão e guarda", texto: "Onde pedir orientação jurídica gratuita.", href: "#direitos" },
    filhos: { titulo: "Filhos: creche, escola e apoio", texto: "Matrícula, vaga em creche e apoio a quem cria os filhos sozinha.", href: "#educacao/educacao-filhos" },
    emprego_curso: { titulo: "Trabalho, renda e cursos", texto: "Um plano curto para voltar a trabalhar e onde procurar vagas e cursos.", href: "#trabalho" },
    saude: { titulo: "Saúde", texto: "Unidades de saúde, pronto atendimento e apoio.", href: "#saude" },
    estudo: { titulo: "Voltar a estudar", texto: "EJA, ensino médio, faculdade e cursos.", href: "#educacao/educacao-voce" },
    moradia: { titulo: "Moradia, água e energia", texto: "Tarifas sociais e programas de habitação.", href: "#moradia" },
    dividas: { titulo: "Dívidas e aposentadoria", texto: "Orientação sobre dívidas e aposentadoria.", href: "#direitos" },
    familia: { titulo: "Apoio social (CRAS)", texto: "Benefícios, cesta básica e acompanhamento da família.", href: "#assistencia" }
  };

  /* Álcool e drogas (própria ou de alguém da família) é questão de saúde (dependência é doença): em vez do topo da Saúde, o
     botão leva direto à seção que reúne o CAPS AD e os grupos de ajuda mútua de Rio Claro. */
  var CAMINHO_DROGAS = { titulo: "Álcool ou drogas: apoio para você e para a família", texto: "Dependência é uma doença e tem tratamento. CAPS AD (saúde pública) e grupos de ajuda mútua de Rio Claro, como NA e Amor Exigente.", href: "#saude/saude-familia-drogas" };

  var N_MIN = 3, N_MAX = 5;
  var modelo = null, indice = null;

  /* Mesmos atributos do treino (pipeline/treinar_necessidades.py: atributos()). */
  function atributos(texto) {
    var saida = [], palavras = Regras.normalizar(texto).split(" ");
    for (var k = 0; k < palavras.length; k++) {
      var w = palavras[k];
      if (!w) continue;
      var p = " " + w + " ";
      for (var n = N_MIN; n <= N_MAX; n++) for (var i = 0; i + n <= p.length; i++) saida.push(p.substr(i, n));
      saida.push("w:" + w);
    }
    return saida;
  }

  /* Conta do modelo: TF sublinear x IDF, norma L2, regressão logística. Serve a qualquer modelo no mesmo formato. */
  function calcular(m, ind, texto) {
    var cont = Object.create(null), nomes = atributos(texto);
    nomes.forEach(function (f) { var i = ind[f]; if (i !== undefined) cont[i] = (cont[i] || 0) + 1; });
    var ids = Object.keys(cont), x = [], soma = 0;
    ids.forEach(function (i) { var v = (1 + Math.log(cont[i])) * m.idf[i]; x.push(v); soma += v * v; });
    var norma = Math.sqrt(soma) || 1, saida = {};
    m.classes.forEach(function (c, k) {
      var z = m.intercepto[k], pesos = m.coef[k];
      for (var j = 0; j < ids.length; j++) z += pesos[ids[j]] * (x[j] / norma);
      saida[c] = 1 / (1 + Math.exp(-z));
    });
    return saida;
  }
  function indexar(m) {
    var ind = Object.create(null);
    m.vocabulario.forEach(function (f, i) { ind[f] = i; });
    return ind;
  }
  /* Outro modelo no mesmo formato (ex.: o detector de perigo de perigo.js), sem mexer no modelo de necessidades. */
  function criarClassificador(m) {
    var ind = indexar(m);
    return { limiares: (m.meta && m.meta.limiares) || {}, probabilidades: function (texto) { return calcular(m, ind, texto); } };
  }

  function usarModelo(m) {
    modelo = m; indice = indexar(m);
  }
  function pronto() { return !!modelo; }

  /* Probabilidade de cada necessidade segundo o modelo de necessidades. */
  function probabilidades(texto) {
    return modelo ? calcular(modelo, indice, texto) : null;
  }

  /* Sugestões finais: união das regras com o modelo, no máximo 3; violência sempre vem primeiro quando aparece. */
  function sugerir(texto, maximo) {
    var regras = Regras.identificarCategorias(texto, maximo);
    var probs = probabilidades(texto) || {};
    var meta = modelo ? modelo.meta : { limiar_padrao: 1, limiares: {}, maximo_sugestoes: 3 };
    var ach = {};
    Object.keys(probs).forEach(function (c) {
      var lim = meta.limiares[c] != null ? meta.limiares[c] : meta.limiar_padrao;
      if (probs[c] >= lim) ach[c] = { id: c, origem: "modelo", prob: probs[c] };
    });
    regras.forEach(function (c) {
      if (ach[c]) ach[c].origem = "ambos";
      else ach[c] = { id: c, origem: "regras", prob: probs[c] != null ? probs[c] : 1 };
    });
    var lista = Object.keys(ach).map(function (c) { return ach[c]; });
    lista.sort(function (a, b) {
      if (a.id === "violencia") return -1;
      if (b.id === "violencia") return 1;
      return (b.origem === "ambos") - (a.origem === "ambos") || b.prob - a.prob;
    });
    return lista.slice(0, maximo || meta.maximo_sugestoes || 3).map(function (s) {
      var c = s.id === "saude" && DROGAS.test(Regras.normalizar(texto)) ? CAMINHO_DROGAS : CAMINHOS[s.id];
      return { id: s.id, origem: s.origem, prob: s.prob, titulo: c.titulo, texto: c.texto, href: c.href, urgente: !!c.urgente };
    });
  }


  /* ------------------------------------------------------------ serviços do catálogo (recomendação por conteúdo) */
  /* Quais serviços do catálogo verificado cabem em cada necessidade. Só entram tipos que EXISTEM no catálogo: moradia e dívidas
     não têm serviços cadastrados, e o site não finge que têm (mostra só o caminho da área). */
  var SERVICOS_DA_NECESSIDADE = {
    violencia: [{ tipo: "mulher" }, { tipo: "assistencia", subtipos: ["creas"] }],
    casamento: [{ tipo: "mulher" }],
    filhos: [{ tipo: "creche", subtipos: ["secretaria"] }],
    emprego_curso: [{ tipo: "emprego_curso", subtipos: ["pat", "conecta", "credito", "secretaria", "fundo_social", "qualificacao", "curso_profissionalizante", "curso_tecnico"] }],
    estudo: [{ tipo: "emprego_curso", subtipos: ["eja", "escola_sesi", "graduacao", "curso_superior_tecnologia", "curso_tecnico", "curso_profissionalizante", "formacao_gratuita"] }],
    saude: [{ tipo: "saude", subtipos: ["urgencia", "caps", "hospital", "especialidades", "secretaria", "cei", "centro_habilitacao"] }],
    familia: [{ tipo: "assistencia", subtipos: ["cras", "sede", "creas"] }],
    moradia: [],
    dividas: []
  };
  /* Serviços "porta de entrada" que valem um pequeno empurrão quando o texto não aponta nenhum em especial. */
  var PORTAS = { secretaria: 1, sede: 1, pat: 1, cras: 1, ddm: 1, cram: 1, caps: 0.6, urgencia: 0.6 };
  /* Alguns serviços só fazem sentido quando o texto trata do assunto deles. Semelhança de letras não basta: um CAPS de álcool e
     drogas nunca deve aparecer para quem diz estar ansiosa, e o inverso. (Comparação sem acento e em minúsculas.) */
  var DROGAS = /droga|alcool|bebida|crack|vici|dependen|quimic|cachaca|maconha|cocaina|bebe demais|bebe muito|bebe todo|bebad|embriag|parar de beber|narcotic|amor exigente|al anon/;
  var MENTAL = /psic|ansios|ansied|depress|triste|angusti|saude mental|panico|suicid|nervos|insonia|nao consigo dormir|terapi|psiquiatr|emocional|sem vontade de nada/;
  var CRIANCA = /crianca|filh|adolescen|menin|bebe|nene|jovem/;
  var CONDICOES = [
    { nome: /alcool e drogas/, vale: function (q) { return DROGAS.test(q); } },
    { nome: /infantojuvenil/, vale: function (q) { return MENTAL.test(q) && CRIANCA.test(q); } },
    { nome: /caps iii|18 de maio/, vale: function (q) { return MENTAL.test(q) || DROGAS.test(q); } }
  ];
  function liberado(s, q) {
    var nome = Regras.normalizar(s.nome);
    return CONDICOES.every(function (c) { return !c.nome.test(nome) || c.vale(q); });
  }
  /* Abaixo disto o serviço só entra se for uma "porta de entrada" (secretaria, CRAS, PAT...): evita sugestões por mera coincidência de letras. */
  var MIN_SEMELHANCA = 0.08;
  var catalogo = null;

  function textoDoServico(s) {
    return [s.nome, String(s.subtipo || "").replace(/_/g, " "), s.observacao, s.grupo].filter(Boolean).join(" ");
  }
  function vetorizar(texto, idf) {
    var cont = Object.create(null);
    atributos(texto).forEach(function (f) { cont[f] = (cont[f] || 0) + 1; });
    var v = Object.create(null), soma = 0;
    Object.keys(cont).forEach(function (f) {
      var w = idf[f]; if (w === undefined) return;
      var x = (1 + Math.log(cont[f])) * w; v[f] = x; soma += x * x;
    });
    var n = Math.sqrt(soma) || 1;
    Object.keys(v).forEach(function (f) { v[f] /= n; });
    return v;
  }
  /* Recebe a lista de serviços já carregada pelo site e monta um índice de busca (TF-IDF sobre nome, tipo e observação). */
  function usarCatalogo(lista) {
    var docs = (lista || []).filter(function (s) { return s && s.nome && (s.telefone || s.fonte_url); });
    var df = Object.create(null);
    var feats = docs.map(function (s) {
      var set = Object.create(null);
      atributos(textoDoServico(s)).forEach(function (f) { set[f] = 1; });
      Object.keys(set).forEach(function (f) { df[f] = (df[f] || 0) + 1; });
      return set;
    });
    var idf = Object.create(null), n = docs.length;
    Object.keys(df).forEach(function (f) { idf[f] = Math.log((1 + n) / (1 + df[f])) + 1; });
    catalogo = { idf: idf, itens: docs.map(function (s) { return { servico: s, vetor: vetorizar(textoDoServico(s), idf) }; }) };
  }
  function cosseno(a, b) {
    var t = 0; Object.keys(a).forEach(function (f) { if (b[f] !== undefined) t += a[f] * b[f]; });
    return t;
  }
  function cabe(s, regras) {
    return regras.some(function (r) { return s.tipo === r.tipo && (!r.subtipos || r.subtipos.indexOf(s.subtipo) !== -1); });
  }
  /* Para cada necessidade sugerida, os serviços do catálogo que mais combinam com o texto (no máximo `max`). Sem catálogo: vazio. */
  function servicosPara(texto, sugestoes, max) {
    var saida = {};
    if (!catalogo) return saida;
    var q = vetorizar(texto, catalogo.idf), limite = max || 2, usados = Object.create(null), qn = Regras.normalizar(texto);
    (sugestoes || []).forEach(function (sug) {
      var regras = SERVICOS_DA_NECESSIDADE[sug.id] || [];
      var ranque = catalogo.itens.filter(function (it) { return cabe(it.servico, regras) && !usados[it.servico.id] && liberado(it.servico, qn); }).map(function (it) {
        return { servico: it.servico, pontos: cosseno(q, it.vetor) + 0.12 * (PORTAS[it.servico.subtipo] || 0), semelhanca: cosseno(q, it.vetor) };
      }).sort(function (a, b) { return b.pontos - a.pontos || String(a.servico.nome).localeCompare(String(b.servico.nome), "pt-BR"); });
      saida[sug.id] = ranque.filter(function (r) { return r.semelhanca >= MIN_SEMELHANCA || (PORTAS[r.servico.subtipo] || 0) >= 1; }).slice(0, limite).map(function (r) { usados[r.servico.id] = 1; return r.servico; });
    });
    return saida;
  }

  return { CAMINHOS: CAMINHOS, atributos: atributos, usarModelo: usarModelo, pronto: pronto, probabilidades: probabilidades, criarClassificador: criarClassificador, sugerir: sugerir, usarCatalogo: usarCatalogo, servicosPara: servicosPara, SERVICOS_DA_NECESSIDADE: SERVICOS_DA_NECESSIDADE };
});
