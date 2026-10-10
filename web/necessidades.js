/* Classificador local de necessidades do MISM3. Sem rede, armazenamento ou envio de texto. */
(function (raiz, fabrica) {
  if (typeof module === "object" && module.exports) module.exports = fabrica();
  else raiz.MISM3Necessidades = fabrica();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  function normalizar(texto) {
    return String(texto || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/-/g, "")
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function contemExpressao(texto, expressao) {
    var termo = normalizar(expressao);
    return !!termo && (" " + texto + " ").indexOf(" " + termo + " ") !== -1;
  }

  var REGRAS = [
    ["violencia", [
      "violencia", "agressao", "me bate", "me bateu", "bate em mim",
      "ele me bate", "ela me bate", "me ameaca", "me ameaçou", "ameacou",
      "abuso", "tenho medo dele", "tenho medo dela", "medo do meu marido",
      "nao deixa eu sair", "me controla", "medida protetiva", "protecao",
      "perigo", "me persegue", "me empurrou", "me machucou", "me humilha",
      "violencia sexual", "violencia psicologica"
    ]],
    ["casamento", [
      "casamento", "separacao", "separar", "quero me separar", "divorcio",
      "divorciar", "pensao", "guarda", "direitos", "advogada", "defensoria",
      "marido", "companheiro", "ex marido", "ex companheiro"
    ]],
    ["filhos", [
      "filho", "filhos", "crianca", "criancas", "bebe", "creche",
      "maternidade", "escola infantil", "baba", "educacao infantil",
      "vaga na creche", "matricula do filho"
    ]],
    ["emprego_curso", [
      "emprego", "trabalho", "renda", "curriculo",
      "vaga de emprego", "vagas de emprego", "vaga de trabalho", "vagas de trabalho", "trabalhar",
      "curso", "cursos", "qualificacao", "empreender", "desempregada",
      "desempregado", "procurando emprego", "voltar ao trabalho"
    ]],
    ["saude", [
      "saude", "medico", "medica", "consulta", "exame", "hospital",
      "posto de saude", "psicologa", "psicologo", "menopausa", "gestacao",
      "gravidez", "gravida", "ginecologista", "dor", "remedio"
    ]],
    ["estudo", [
      "estudo", "estudar", "faculdade", "universidade", "escola", "ensino",
      "alfabetizacao", "voltar a estudar", "bolsa de estudos"
    ]],
    ["moradia", [
      "moradia", "habitacao", "aluguel", "aluguel social", "casa para morar",
      "sem casa", "despejo", "regularizacao fundiaria", "cadastro habitacional",
      "casa popular", "moradia popular", "preciso sair de casa"
    ]],
    ["dividas", [
      "divida", "dividas", "superendividamento", "nome sujo", "renegociar divida",
      "renegociacao de dividas", "cartao atrasado", "emprestimo consignado",
      "nao consigo pagar as contas", "contas atrasadas", "orcamento domestico",
      "aposentadoria", "inss", "tempo de contribuicao", "simular aposentadoria"
    ]],
    ["familia", [
      "familia", "assistencia", "beneficio", "beneficios", "cras", "creas",
      "comida", "cesta basica", "sem comida",
      "passar fome", "fome", "comer", "sem dinheiro para comer",
      "nao tenho o que comer", "apoio", "bolsa familia", "sem dinheiro",
      "nao tenho dinheiro", "preciso de ajuda financeira"
    ]]
  ];

  function identificarCategorias(texto) {
    var t = normalizar(texto);
    if (!t) return [];
    var achadas = [];
    REGRAS.forEach(function (regra) {
      if (regra[1].some(function (termo) { return contemExpressao(t, termo); })) {
        achadas.push(regra[0]);
      }
    });
    return achadas.slice(0, 3);
  }

  return {
    normalizar: normalizar,
    identificarCategorias: identificarCategorias
  };
});
