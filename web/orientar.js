/* Motor de ORIENTAÇÃO do MISM3: a mulher escreve com as próprias palavras e o sistema devolve, em ordem, os DESTINOS reais que podem ajudar
   (serviços verificados, seções das áreas e ferramentas do dashboard), com contato, fonte e o motivo de cada um. Sem modelo de linguagem:
   o que aparece vem sempre de dados que o projeto já verificou, e o que não existe nunca é inventado.

   Quatro sinais somados (cada um cobre a falha do outro):
     1. PALAVRAS   TF-IDF sobre as raízes das palavras (acha o nome do serviço e os termos exatos);
     2. LETRAS     TF-IDF sobre trechos de 3 a 5 letras (tolera erro de digitação, falta de acento e abreviação);
     3. SIGNIFICADO  LSA (análise semântica latente), calculada offline em Python (pipeline/indice_orientacao.py): liga "remédio" a
                     "medicamento" e "marido me bateu" a "violência" pelo que aparece junto nos textos;
     4. INTENÇÃO   a dica do classificador de necessidades (ia.js), um modelo de aprendizado de máquina treinado pela equipe.
   Antes de tudo roda a camada de SEGURANÇA (perigo.js), que é determinística e fixa os destinos certos em situação de risco.
   Lógica pura (sem DOM, sem rede, sem gravar nada): o texto é lido e descartado no aparelho. A tela está em app.js. */
(function (raiz, fabrica) {
  if (typeof module === "object" && module.exports) module.exports = fabrica(require("./necessidades.js"), require("./perigo.js"));
  else raiz.Orientar = fabrica(raiz.MISM3Necessidades, raiz.Perigo);
})(typeof self !== "undefined" ? self : this, function (Regras, Perigo) {
  "use strict";

  /* Mesma tokenização do Python (pipeline/indice_orientacao.py): precisa ser idêntica para a matriz de significado valer. */
  var PARADAS = {};
  ("a o as os um uma uns umas de da do das dos em na no nas nos por para pra com sem sobre entre ate ao aos e ou mas que se sou sao ser estou esta estao " +
   "foi fui vai vou ter tenho tem tinha minha meu minhas meus sua seu suas seus como qual quais quando onde quem porque preciso precisa quero quer queria " +
   "posso pode fazer faco faz saber aqui ali la isso isto esse essa muito muita mais menos ja nao sim tambem so ainda eu voce me te lhe nos ela ele eles " +
   "elas dele dela ver ha hoje agora gostaria algum alguma coisa coisas ajuda ajudar to ta casa").split(" ").forEach(function (p) { PARADAS[p] = 1; });

  function raizDa(p) {
    if (/^filh[oa]s?$/.test(p)) return "filho";
    if (/^(bebe|bebes)$/.test(p)) return "bebe";
    if (/^(maes?|mamae)$/.test(p)) return "mae";
    return p.length > 5 ? p.slice(0, 5) : p;
  }
  function fichas(texto) {
    return Regras.normalizar(texto).split(" ").filter(function (w) { return w.length >= 3 && !PARADAS[w]; }).map(raizDa);
  }
  function semParadas(texto) {
    return Regras.normalizar(texto).split(" ").filter(function (w) { return w && !PARADAS[w]; }).join(" ");
  }

  /* Pontes lexicais locais: traduz o jeito popular de pedir para termos já presentes no índice verificado. */
  function expandirConsulta(texto) {
    var t = Regras.normalizar(texto), extra = [];
    if (/\b(?:casa propria|casa popular|minha casa minha vida|financiamento habitacional|cadastro habitacional|inscricao habitacional)\b/.test(t)) {
      extra.push("moradia habitacao casa propria cadastro habitacional aluguel social secretaria habitacao");
    }
    if (/\b(?:moro na rua|morando na rua|vivo na rua|vivendo na rua|situacao de rua|sem teto|sem casa)\b/.test(t)) {
      extra.push("situacao de rua morador de rua sem casa sem teto assistencia social cras creas moradia acolhimento");
    }
    if (/\bvacina(?:s|cao|r)?\b/.test(t)) {
      extra.push("saude posto de saude ubs usf vacinacao imunizacao carteira de vacinacao");
    }
    if (/\b(?:creche|cmei|emei|emef|bercario|pre escola|preescola|educacao infantil|lista de espera da creche|nao tenho com quem deixar)\b/.test(t)) {
      extra.push("educacao infantil creche cmei emei escola municipal matricula secretaria da educacao vaga");
    }
    return extra.length ? t + " " + extra.join(" ") : t;
  }
  /* Trechos de 3 a 5 letras de cada palavra (com espaço nas pontas), como na comparação por letras do Python. */
  function trechos(texto) {
    var saida = [];
    semParadas(texto).split(" ").forEach(function (w) {
      if (!w) return;
      var p = " " + w + " ";
      for (var n = 3; n <= 5; n++) for (var i = 0; i + n <= p.length; i++) saida.push(p.substr(i, n));
    });
    return saida;
  }

  var SAUDACOES = /^(?:oi+|ola|oie|bom dia|boa tarde|boa noite|obrigad[ao]|valeu|tchau|ate logo|ok|certo|sim|nao)(?: [a-z]+){0,2}$/;
  var AJUDA_GERAL = /^(?:(?:oi+|ola|bom dia|boa tarde|boa noite) )?(?:(?:eu )?preciso de ajuda|me ajuda|ajuda|socorro|nao sei (?:o que fazer|por onde comecar)|por onde comeco|estou perdida)(?: [a-z]+){0,2}$/;

  /* Serviços especializados: só entram na lista quando o texto fala do assunto (ex.: o pronto atendimento de ginecologia não serve a dor de dente). */
  var CONDICOES = {
    "man-saude-pa-ginecologia": /gravid|gestan|gestac|parto|ginecolog|obstetr|menstru|sangramento|pre natal|prenatal|contrac|aborto|corrimento|maternidade|bebe|recem nascid|puerper|mulher/
  };

  var PESOS = { palavras: 0.4, letras: 0.6, significado: 0.3, intencao: 0.1, area: 0.12 };

  function norma(v) {
    var s = 0, k; for (k in v) s += v[k] * v[k];
    s = Math.sqrt(s) || 1; for (k in v) v[k] /= s;
    return v;
  }
  function pontoEscalar(a, b) {
    var t = 0, k;
    for (k in a) if (b[k] !== undefined) t += a[k] * b[k];
    return t;
  }

  /* indice = conteúdo de web/dados/indice_orientacao.json. opcoes.dica(texto) -> { necessidade: prob } (opcional). */
  function criar(indice, opcoes) {
    opcoes = opcoes || {};
    var pesos = Object.assign({}, PESOS, opcoes.pesos || {});
    var U = indice.unidades, N = U.length, lsa = indice.lsa;
    var posTermo = Object.create(null);
    lsa.termos.forEach(function (t, i) { posTermo[t] = i; });

    /* palavras: vetores TF-IDF dos destinos (mesmo idf do Python) */
    var docsW = U.map(function (u) {
      var cont = {};
      fichas(u.texto).forEach(function (f) { cont[f] = (cont[f] || 0) + 1; });
      var v = {};
      Object.keys(cont).forEach(function (f) { var i = posTermo[f]; if (i !== undefined) v[f] = (1 + Math.log(cont[f])) * lsa.idf[i]; });
      return norma(v);
    });
    /* letras: idf e vetores calculados aqui mesmo, sobre os textos dos destinos */
    var df = {}, bruto = U.map(function (u) {
      var cont = {};
      trechos(u.texto).forEach(function (g) { cont[g] = (cont[g] || 0) + 1; });
      Object.keys(cont).forEach(function (g) { df[g] = (df[g] || 0) + 1; });
      return cont;
    });
    var idfC = {};
    Object.keys(df).forEach(function (g) { idfC[g] = Math.log((1 + N) / (1 + df[g])) + 1; });
    var docsC = bruto.map(function (cont) {
      var v = {};
      Object.keys(cont).forEach(function (g) { v[g] = (1 + Math.log(cont[g])) * idfC[g]; });
      return norma(v);
    });

    /* significado: matriz termo x k (por 1000) e vetores dos destinos */
    var K = lsa.k;
    function projetar(qW) {
      var v = new Array(K).fill(0);
      Object.keys(qW).forEach(function (f) {
        var i = posTermo[f]; if (i === undefined) return;
        var linha = lsa.comp[i];
        for (var j = 0; j < K; j++) v[j] += qW[f] * linha[j] / 1000;
      });
      var s = Math.sqrt(v.reduce(function (a, x) { return a + x * x; }, 0)) || 1;
      return v.map(function (x) { return x / s; });
    }

    function pontuar(texto, ctx) {
      var consulta = expandirConsulta(texto), tn = Regras.normalizar(texto);
      var qf = fichas(consulta), contW = {};
      qf.forEach(function (f) { contW[f] = (contW[f] || 0) + 1; });
      var qW = {};
      Object.keys(contW).forEach(function (f) { var i = posTermo[f]; if (i !== undefined) qW[f] = (1 + Math.log(contW[f])) * lsa.idf[i]; });
      var qWn = norma(Object.assign({}, qW));
      var contC = {}; trechos(consulta).forEach(function (g) { contC[g] = (contC[g] || 0) + 1; });
      var qC = {}; Object.keys(contC).forEach(function (g) { if (idfC[g] !== undefined) qC[g] = (1 + Math.log(contC[g])) * idfC[g]; });
      norma(qC);
      var qL = Object.keys(qW).length ? projetar(qWn) : null;
      var dica = opcoes.dica ? opcoes.dica(texto) : null;
      return U.map(function (u, d) {
        var sw = pontoEscalar(docsW[d], qWn), sc = pontoEscalar(docsC[d], qC), sl = 0;
        if (qL) { var z = lsa.docs[d], t = 0; for (var j = 0; j < K; j++) t += z[j] / 1000 * qL[j]; sl = Math.max(0, t); }
        var s = pesos.palavras * sw + pesos.letras * sc + pesos.significado * sl;
        if (dica && u.needs && u.needs.length) s += pesos.intencao * Math.max.apply(null, u.needs.map(function (n) { return dica[n] || 0; }));
        if (ctx && ctx.area && u.area === ctx.area) s += pesos.area;
        if (CONDICOES[u.id] && !CONDICOES[u.id].test(tn)) s -= 1; /* serviço especializado só aparece quando o assunto é dele */
        if (u.tipo === "area") s -= 0.04; /* destinos genéricos (a área inteira) só aparecem depois dos específicos */
        return { u: u, s: s, palavras: sw, letras: sc, significado: sl };
      });
    }

    /* Destinos fixados pela camada de segurança: por id, ou os primeiros `max` serviços de um tipo. */
    function fixados(pins, pont) {
      var saida = [], vistos = {};
      (pins || []).forEach(function (p) {
        var achados = pont.filter(function (x) { return x.u.tipo === "servico" && (p.id ? x.u.id === p.id : x.u.svc === p.svc); });
        achados.sort(function (a, b) { return b.s - a.s; });
        achados.slice(0, p.max || 1).forEach(function (x) { if (!vistos[x.u.id]) { vistos[x.u.id] = 1; saida.push(x); } });
      });
      return saida;
    }

    function motivo(texto, u) {
      var q = fichas(texto), ut = {};
      fichas(u.texto).forEach(function (f) { ut[f] = 1; });
      var originais = Regras.normalizar(texto).split(" ").filter(function (w) { return w.length >= 3 && !PARADAS[w] && ut[raizDa(w)]; });
      return originais.filter(function (w, i, a) { return a.indexOf(w) === i; }).slice(0, 3);
    }

    /* responder: o que a mulher veria. Nunca devolve só silêncio: se não achar, diz isso e oferece o caminho certo. */
    function responder(texto, ctx) {
      ctx = ctx || {};
      var t = Regras.normalizar(texto);
      var perigo = Perigo.avaliar(texto);
      var urgente = !!(perigo && perigo.nivel === 2); /* só o alerta completo ignora o filtro de escopo; o aviso discreto (nível 1) não */
      var base = { perigo: perigo, saudacao: false, geral: false, abstem: false, itens: [], melhor: 0 };
      if (!t) return Object.assign(base, { abstem: true });
      if (!urgente && SAUDACOES.test(t)) return Object.assign(base, { saudacao: true, abstem: true });
      if (!urgente && AJUDA_GERAL.test(t)) {
        /* pedido genérico ("preciso de ajuda"): não é fora de escopo, só não diz o quê; mostramos as portas de cada área */
        var portas = U.filter(function (u) { return u.tipo === "area"; }).slice(0, 6).map(function (u, i) {
          return { rank: i + 1, id: u.id, tipo: u.tipo, area: u.area, sec: u.sec, svc: u.svc, titulo: u.titulo, resumo: u.resumo, href: u.href,
                   contato: null, fonte: null, n: null, pontos: 0, fixado: false, palavras: [] };
        });
        return Object.assign(base, { geral: true, itens: portas });
      }

      var pont = pontuar(texto, ctx);
      pont.sort(function (a, b) { return b.s - a.s; });
      var melhor = pont.length ? pont[0].s : 0;
      /* Sinal de escopo: o assunto está no que o MISM3 cobre? Nota da busca baixa => não; nota média + classificador sem
         nenhuma necessidade provável => também não. Em dúvida, responde (errar para mais custa uma lista a mais, não um silêncio). */
      var dicaT = opcoes.dica ? opcoes.dica(texto) : null, confianca = 0;
      if (dicaT) Object.keys(dicaT).forEach(function (k) { if (dicaT[k] > confianca) confianca = dicaT[k]; });
      var minimo = opcoes.minimo !== undefined ? opcoes.minimo : 0.3;
      var foraDeEscopo = !urgente && (melhor < minimo || (dicaT && melhor < minimo + 0.1 && confianca < 0.3));
      var fix = perigo ? fixados(perigo.pins, pont) : [];
      var vistos = {}, porSvc = {}, escolhidos = [];
      function aceitar(x, fixado) {
        var chave = x.u.tipo === "servico" ? x.u.id : x.u.tipo + "|" + x.u.area + "|" + x.u.sec + "|" + x.u.titulo;
        if (vistos[chave]) return;
        if (!fixado && x.u.svc && (porSvc[x.u.svc] || 0) >= 2) return; /* diversidade: no máximo 2 do mesmo tipo de serviço */
        vistos[chave] = 1; if (x.u.svc) porSvc[x.u.svc] = (porSvc[x.u.svc] || 0) + 1;
        escolhidos.push({ x: x, fixado: !!fixado });
      }
      fix.forEach(function (x) { aceitar(x, true); });
      var limiar = opcoes.limiar !== undefined ? opcoes.limiar : 0.2;
      var corte = opcoes.corte !== undefined ? opcoes.corte : 0.5; /* só entra o que tem pelo menos metade da nota do primeiro */
      if (urgente || (!foraDeEscopo && melhor >= limiar)) pont.forEach(function (x) { if (escolhidos.length < 6 && (urgente || (x.s >= limiar * 0.55 && x.s >= melhor * corte))) aceitar(x, false); });
      var itens = escolhidos.slice(0, 6).map(function (e, i) {
        var u = e.x.u;
        return { rank: i + 1, id: u.id, tipo: u.tipo, area: u.area, sec: u.sec, svc: u.svc, titulo: u.titulo, resumo: u.resumo, href: u.href,
                 contato: u.contato || null, fonte: u.fonte || null, n: u.n || null, pontos: Math.round(e.x.s * 1000) / 1000,
                 fixado: e.fixado, palavras: motivo(texto, u) };
      });
      return Object.assign(base, { itens: itens, abstem: !urgente && !itens.length, melhor: Math.round(melhor * 1000) / 1000 });
    }

    return { responder: responder, pontuar: pontuar, pesos: pesos, tamanho: N };
  }

  return { criar: criar, fichas: fichas, semParadas: semParadas, trechos: trechos, PESOS: PESOS };
});
