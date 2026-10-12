/* Meu Plano: junta as necessidades que o assistente reconheceu numa ORDEM, com o motivo de cada posição e o que fazer se o
   primeiro caminho não der certo. A ordem é uma regra fixa e explicável (urgência e base primeiro), NÃO uma nota do modelo:
   segurança, depois o básico do dia a dia, depois o que sustenta o resto. Nada aqui promete vaga, benefício ou atendimento:
   cada serviço avalia o caso. Lógica pura (sem DOM, sem rede, sem gravar nada). A tela está em app.js. */
(function (raiz, fabrica) {
  if (typeof module === "object" && module.exports) module.exports = fabrica();
  else raiz.Plano = fabrica();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  /* Do mais urgente ao que pode seguir em paralelo. */
  var ORDEM = ["violencia", "familia", "saude", "moradia", "filhos", "casamento", "dividas", "emprego_curso", "estudo"];

  var PORQUE = {
    violencia: "Sua segurança vem antes de qualquer outra coisa.",
    familia: "Comida e apoio no dia a dia vêm antes de planos mais longos. O CRAS é a porta de entrada da assistência social.",
    saude: "Cuidar da saúde (a sua ou a de quem você cuida) não deve esperar.",
    moradia: "Ter onde morar e conseguir pagar água e energia dá base para o resto.",
    filhos: "Com a escola ou a creche dos filhos encaminhada, fica mais possível trabalhar e estudar.",
    casamento: "Orientação jurídica gratuita ajuda a decidir com mais segurança.",
    dividas: "Entender a situação das dívidas e das contas evita que ela piore.",
    emprego_curso: "Com o apoio básico encaminhado, a busca por renda ganha força.",
    estudo: "Estudar abre caminhos e pode andar em paralelo com o resto."
  };

  /* O que fazer se o primeiro caminho não der certo. Sempre conta com o que as áreas já dizem; nada de promessa. */
  var SENAO = {
    violencia: "Se não conseguir falar agora, o 180 funciona 24 horas e é gratuito; em perigo imediato, 190.",
    familia: "Se o CRAS estiver longe ou sem horário, ligue antes para a Secretaria de Desenvolvimento Social e pergunte quem pode atender.",
    saude: "Em urgência, ligue 192 (SAMU). Se a unidade não resolver, pergunte na própria unidade para onde encaminham.",
    saude_drogas: "Em crise, ligue 192 (SAMU). Se não conseguir contato com o CAPS AD, tente o CAPS III, que funciona 24 horas segundo a fonte (confirme por telefone), ou os grupos de ajuda mútua.",
    moradia: "Se não houver inscrição aberta, pergunte ao órgão quando abre e peça as tarifas sociais de água e energia enquanto isso.",
    filhos: "Se não houver vaga, pergunte na Secretaria da Educação como acompanhar o pedido e que alternativas existem. Escola cadastrada não garante vaga.",
    casamento: "Se o primeiro atendimento não resolver, procure a Defensoria Pública.",
    dividas: "Anote quem atendeu e o que pediram, e tente de novo em outro dia ou em outro canal.",
    emprego_curso: "Se não houver vaga aberta agora, deixe o currículo e pergunte quando abrem novos cursos e vagas.",
    estudo: "Se a turma estiver fechada, pergunte quando abrem as próximas inscrições."
  };

  /* sugestoes = saída de MISM3IA.sugerir (cada uma com id, titulo, texto, href, urgente). Não altera o que recebe. */
  function montar(sugestoes) {
    var itens = (sugestoes || []).filter(function (s) { return s && ORDEM.indexOf(s.id) !== -1; }).map(function (s, i) {
      return { s: s, i: i, rank: ORDEM.indexOf(s.id) };
    });
    itens.sort(function (a, b) { return a.rank - b.rank || a.i - b.i; });
    var passos = itens.map(function (x, k) {
      var s = x.s, drogas = s.id === "saude" && /saude-familia-drogas/.test(String(s.href));
      return {
        ordem: k + 1, id: s.id, titulo: s.titulo, texto: s.texto, href: s.href, urgente: !!s.urgente,
        porque: PORQUE[s.id], senao: SENAO[drogas ? "saude_drogas" : s.id]
      };
    });
    return {
      passos: passos,
      aviso: "Este plano é uma sugestão de por onde começar. Nenhum serviço garante vaga, benefício ou atendimento: cada um avalia o seu caso. Confirme sempre telefone, endereço e horário."
    };
  }

  return { ORDEM: ORDEM, PORQUE: PORQUE, SENAO: SENAO, montar: montar };
});
