/* Recomendador do Mapa do Cuidado (sem DOM, sem rede, sem gravar nada): testavel no Node.
   Nao e IA treinada nem usa dados da pessoa alem do que ela escolhe na tela agora.
   A regra e aberta: cada ponto vem de um fato do cadastro e vira uma frase de "por que". */
(function (raiz, fabrica) {
  if (typeof module === "object" && module.exports) module.exports = fabrica();
  else raiz.Recomendar = fabrica();
})(typeof self !== "undefined" ? self : this, function () {
  var OBJETIVOS = {
    trabalhar: "Quero trabalhar",
    curso: "Quero fazer um curso",
    empreender: "Quero empreender / crédito"
  };
  var PESO = { objetivo: 3, gratuito: 1, perto: 1, municipal: 0 };

  /* Pontua um servico para um objetivo. Devolve null se o cadastro nao diz que serve ao objetivo:
     nao adivinhamos compatibilidade que a fonte oficial nao confirma. */
  function pontuar(servico, objetivo) {
    var obj = servico.objetivos || [];
    if (obj.indexOf(objetivo) < 0) return null;
    var pontos = PESO.objetivo, porque = ["O cadastro oficial indica que serve ao objetivo escolhido (" + OBJETIVOS[objetivo].toLowerCase() + ")"];
    if (servico.gratuito) { pontos += PESO.gratuito; porque.push("Gratuito, segundo a página oficial"); }
    if (servico.distancia_m != null && servico.distancia_m <= 3000) {
      pontos += PESO.perto; porque.push("Fica a menos de 3 km do seu CEP (em linha reta)");
    }
    return { pontos: pontos, porque: porque };
  }

  /* servicos: lista ja com distancia_m (Acesso.comDistancia). Ordena por pontos e, empatando, pela distancia. */
  function recomendar(servicos, objetivo) {
    if (!OBJETIVOS[objetivo]) return [];
    return servicos.filter(function (s) { return s.tipo === "emprego_curso"; })
      .map(function (s) { var p = pontuar(s, objetivo); return p && Object.assign({}, s, { pontos: p.pontos, porque: p.porque }); })
      .filter(Boolean)
      .sort(function (a, b) {
        if (b.pontos !== a.pontos) return b.pontos - a.pontos;
        var da = a.distancia_m == null ? Infinity : a.distancia_m, db = b.distancia_m == null ? Infinity : b.distancia_m;
        return da - db;
      });
  }

  return { OBJETIVOS: OBJETIVOS, pontuar: pontuar, recomendar: recomendar };
});
