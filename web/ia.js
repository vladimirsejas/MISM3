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

  function usarModelo(m) {
    modelo = m; indice = Object.create(null);
    m.vocabulario.forEach(function (f, i) { indice[f] = i; });
  }
  function pronto() { return !!modelo; }

  /* Probabilidade de cada necessidade segundo o modelo. Mesma conta do treino: TF sublinear x IDF, norma L2, regressão logística. */
  function probabilidades(texto) {
    if (!modelo) return null;
    var cont = Object.create(null), nomes = atributos(texto);
    nomes.forEach(function (f) { var i = indice[f]; if (i !== undefined) cont[i] = (cont[i] || 0) + 1; });
    var ids = Object.keys(cont), x = [], soma = 0;
    ids.forEach(function (i) { var v = (1 + Math.log(cont[i])) * modelo.idf[i]; x.push(v); soma += v * v; });
    var norma = Math.sqrt(soma) || 1, saida = {};
    modelo.classes.forEach(function (c, k) {
      var z = modelo.intercepto[k], pesos = modelo.coef[k];
      for (var j = 0; j < ids.length; j++) z += pesos[ids[j]] * (x[j] / norma);
      saida[c] = 1 / (1 + Math.exp(-z));
    });
    return saida;
  }

  /* Sugestões finais: união das regras com o modelo, no máximo 3; violência sempre vem primeiro quando aparece. */
  function sugerir(texto) {
    var regras = Regras.identificarCategorias(texto);
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
    return lista.slice(0, meta.maximo_sugestoes || 3).map(function (s) {
      var c = CAMINHOS[s.id];
      return { id: s.id, origem: s.origem, prob: s.prob, titulo: c.titulo, texto: c.texto, href: c.href, urgente: !!c.urgente };
    });
  }

  return { CAMINHOS: CAMINHOS, atributos: atributos, usarModelo: usarModelo, pronto: pronto, probabilidades: probabilidades, sugerir: sugerir };
});
