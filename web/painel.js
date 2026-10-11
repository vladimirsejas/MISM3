/* Painel da Secretaria da Mulher: agregação de respostas do questionário SEM identificação.
   Lógica pura (sem DOM, sem rede, sem armazenamento). Regra central de privacidade: nenhum número de um grupo com menos de K
   respostas é mostrado (supressão de células pequenas), e quando só uma célula some, a menor das outras também some, para que
   a conta "total menos o resto" não revele o número escondido.

   Estas funções não sabem de onde vêm os registros. Hoje o painel só roda com DADOS DE TESTE (dados/painel_teste.json). O painel
   real exigirá login da Prefeitura e um servidor: o navegador não pode proteger dados de ninguém. */
(function (raiz, fabrica) {
  if (typeof module === "object" && module.exports) module.exports = fabrica(require("./questionario.js"));
  else raiz.Painel = fabrica(raiz.Questionario);
})(typeof self !== "undefined" ? self : this, function (Q) {
  "use strict";

  var K = 10;
  var ALTO = 67; /* índice a partir do qual um tema "pesa muito" (dois terços do máximo) */

  function pergunta(qid) { return Q.PERGUNTAS.filter(function (p) { return p.id === qid; })[0]; }
  function lista(v) { return v === undefined ? [] : Array.isArray(v) ? v : [v]; }
  function pct(n, d) { return d ? Math.round(1000 * n / d) / 10 : null; }

  /* Quantas mulheres escolheram cada alternativa de uma pergunta. Quem não respondeu não entra na base. */
  function distribuicao(regs, qid, k) {
    var lim = k || K, p = pergunta(qid);
    var resp = regs.filter(function (r) { return r.respostas && r.respostas[qid] !== undefined; });
    var base = resp.length;
    var saida = { pergunta: qid, texto: p.texto, tipo: p.tipo, respondentes: base, suprimida: false, itens: [] };
    if (base < lim) { saida.suprimida = true; saida.respondentes = null; return saida; }
    var itens = p.opcoes.map(function (o) {
      var n = resp.filter(function (r) { return lista(r.respostas[qid]).indexOf(o.c) !== -1; }).length;
      return { c: o.c, r: o.r, n: n, pct: pct(n, base), oculto: false };
    });
    itens.forEach(function (i) { if (i.n < lim && i.n > 0) { i.oculto = true; } });
    /* supressão complementar só vale para perguntas de uma escolha (as alternativas somam o total) */
    if (p.tipo === "unica") {
      var ocultos = itens.filter(function (i) { return i.oculto; });
      if (ocultos.length === 1) {
        var menor = itens.filter(function (i) { return !i.oculto && i.n > 0; }).sort(function (a, b) { return a.n - b.n; })[0];
        if (menor) menor.oculto = true;
      }
    }
    itens.forEach(function (i) { if (i.oculto) { i.n = null; i.pct = null; } });
    saida.itens = itens;
    return saida;
  }

  /* Média do índice de cada tema, só para quem teve o tema calculado (nunca zero para quem deixou em branco). */
  function indices(regs, k) {
    var lim = k || K, saida = {};
    Q.DIMENSOES.forEach(function (d) {
      var v = regs.map(function (r) { return r.indices ? r.indices[d.id] : null; }).filter(function (x) { return typeof x === "number"; });
      var soma = v.reduce(function (a, b) { return a + b; }, 0);
      saida[d.id] = { nome: d.nome, n: v.length >= lim ? v.length : null, media: v.length >= lim ? Math.round(soma / v.length) : null, suprimido: v.length < lim,
        alto: v.length >= lim ? pct(v.filter(function (x) { return x >= ALTO; }).length, v.length) : null };
    });
    return saida;
  }

  /* Médias por grupo (por exemplo, região). Grupos com menos de K respostas NÃO aparecem. */
  function indicesPorGrupo(regs, qid, k) {
    var lim = k || K, grupos = {}, escondidos = 0;
    pergunta(qid).opcoes.forEach(function (o) {
      var sub = regs.filter(function (r) { return r.respostas && lista(r.respostas[qid]).indexOf(o.c) !== -1; });
      if (!sub.length) return;
      if (sub.length < lim) { escondidos++; return; }
      grupos[o.c] = { rotulo: o.r, respondentes: sub.length, indices: indices(sub, lim) };
    });
    return { pergunta: qid, grupos: grupos, gruposEscondidos: escondidos };
  }

  /* Mulheres com dois ou mais temas pesando muito ao mesmo tempo: o retrato de quem precisa de política integrada. */
  function combinacoes(regs, k) {
    var lim = k || K;
    var com2 = regs.filter(function (r) { return r.indices && Object.keys(r.indices).filter(function (d) { return typeof r.indices[d] === "number"; }).length >= 2; });
    var varios = com2.filter(function (r) { return Object.keys(r.indices).filter(function (d) { return r.indices[d] >= ALTO; }).length >= 2; });
    if (com2.length < lim || varios.length < lim) return { base: com2.length >= lim ? com2.length : null, n: null, pct: null, suprimido: true };
    return { base: com2.length, n: varios.length, pct: pct(varios.length, com2.length), suprimido: false };
  }

  /* Par de temas que mais aparecem juntos entre as mulheres com os dois temas pesando muito. */
  function paresDeTemas(regs, k) {
    var lim = k || K, cont = {};
    regs.forEach(function (r) {
      var altos = Q.DIMENSOES.filter(function (d) { return typeof (r.indices || {})[d.id] === "number" && r.indices[d.id] >= ALTO; });
      for (var i = 0; i < altos.length; i++) for (var j = i + 1; j < altos.length; j++) {
        var chave = altos[i].nome + " + " + altos[j].nome; cont[chave] = (cont[chave] || 0) + 1;
      }
    });
    return Object.keys(cont).filter(function (c) { return cont[c] >= lim; }).map(function (c) { return { par: c, n: cont[c] }; })
      .sort(function (a, b) { return b.n - a.n; });
  }

  function serie(regs, k) {
    var lim = k || K, por = {};
    regs.forEach(function (r) { if (r.periodo) por[r.periodo] = (por[r.periodo] || 0) + 1; });
    return Object.keys(por).sort().map(function (m) { return { periodo: m, n: por[m] >= lim ? por[m] : null }; });
  }

  /* Quem respondeu: o painel tem de mostrar a cobertura, para ninguém tratar respostas voluntárias como retrato de toda a cidade. */
  function cobertura(regs, k) {
    return { total: regs.length >= (k || K) ? regs.length : null, idade: distribuicao(regs, "idade", k), regiao: distribuicao(regs, "regiao", k) };
  }

  return { K: K, ALTO: ALTO, distribuicao: distribuicao, indices: indices, indicesPorGrupo: indicesPorGrupo, combinacoes: combinacoes, paresDeTemas: paresDeTemas, serie: serie, cobertura: cobertura };
});
