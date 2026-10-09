/* Concursos e processos seletivos: situacao calculada pela data de HOJE, no navegador. */
(function (raiz, fabrica) {
  if (typeof module === "object" && module.exports) module.exports = fabrica();
  else raiz.Vagas = fabrica();
})(typeof self !== "undefined" ? self : this, function () {
  var ROTULO = { aberto: "Inscrições abertas", em_breve: "Inscrições em breve", encerrado: "Inscrições encerradas" };

  /* hoje, de e ate: "AAAA-MM-DD" (comparacao de texto funciona nesse formato). */
  function situacao(v, hoje) {
    if (v.inscricoes_de && hoje < v.inscricoes_de) return "em_breve";
    if (hoje <= v.inscricoes_ate) return "aberto";
    return "encerrado";
  }

  /* Abertos (prazo mais proximo primeiro), depois em breve, depois os encerrados mais recentes (no maximo 3). */
  function organizar(vagas, hoje) {
    var com = vagas.map(function (v) { return Object.assign({}, v, { situacao: situacao(v, hoje) }); });
    var por = function (s) { return com.filter(function (v) { return v.situacao === s; }); };
    var abertos = por("aberto").sort(function (a, b) { return a.inscricoes_ate < b.inscricoes_ate ? -1 : 1; });
    var breve = por("em_breve").sort(function (a, b) { return (a.inscricoes_de || "") < (b.inscricoes_de || "") ? -1 : 1; });
    var enc = por("encerrado").sort(function (a, b) { return a.inscricoes_ate < b.inscricoes_ate ? 1 : -1; }).slice(0, 3);
    return abertos.concat(breve, enc);
  }

  function dataBR(iso) { return iso ? iso.split("-").reverse().join("/") : ""; }

  return { ROTULO: ROTULO, situacao: situacao, organizar: organizar, dataBR: dataBR };
});
