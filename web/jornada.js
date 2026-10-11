/* Jornada "Trabalho": perguntas curtas, uma de cada vez -> plano com poucos passos e uma ação clara em cada um; e currículo.
   Lógica pura (sem DOM, sem rede, sem gravar nada): testável no Node e usada no navegador.
   Não decide quem tem direito a nada: ordena sugestões e aponta os canais oficiais, que avaliam cada caso. */
(function (raiz, fabrica) {
  if (typeof module === "object" && module.exports) module.exports = fabrica();
  else raiz.Jornada = fabrica();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var DESENV_ECON = "https://rioclaro.sp.gov.br/secretaria/secretaria-de-desenvolvimento-economico/";
  var PRIMEIROS = 3; /* quantos passos aparecem de cara; os demais ficam dobrados */

  /* Links externos do plano: todos vêm de uma fonte já cadastrada no projeto (areas.js ou catalogo_manual.json). */
  var LINKS = {
    portal: ["Portal da Empregabilidade de Rio Claro", "https://vagas.rioclaro.sp.gov.br/", "Consultar oportunidades e informações para trabalhadores."],
    trampolim: ["Trampolim — Governo de São Paulo", "https://www.trampolim.sp.gov.br/", "Consultar oportunidades e cursos disponíveis na plataforma."],
    leiSine: ["Lei nº 14.542/2023 (prioridade no Sine)", "https://www2.camara.leg.br/legin/fed/lei/2023/lei-14542-3-abril-2023-793992-publicacaooriginal-167489-pl.html", "Texto da lei federal que dá prioridade a mulheres em situação de violência doméstica e familiar e reserva 10% das vagas intermediadas."],
    desenvEcon: ["Secretaria de Desenvolvimento Econômico (Banco do Povo e Sala do Empreendedor)", DESENV_ECON, "Orientação para empreender e sobre crédito, sem garantia de aprovação."]
  };

  /* Perguntas, na ordem em que são feitas. Cada uma só aparece quando faz diferença para o plano. */
  var PERGUNTAS = [
    { id: "objetivo", texto: "O que você quer agora?", opcoes: [["emprego", "Conseguir um emprego"], ["curso", "Fazer um curso"], ["negocio", "Gerar renda por conta própria"], ["nao_sei", "Ainda não sei"]] },
    { id: "renda_agora", texto: "Você precisa de dinheiro para as despesas básicas agora?", opcoes: [["sim", "Sim"], ["nao", "Não"]] },
    { id: "filhos", texto: "Você tem crianças que dependem de você?", opcoes: [["sim", "Sim"], ["nao", "Não"]] },
    { id: "cuidado", texto: "Hoje você tem com quem deixá-las para trabalhar ou estudar?", opcoes: [["sim", "Sim"], ["as_vezes", "Só às vezes"], ["nao", "Não"]] },
    { id: "deslocamento", texto: "Chegar até um trabalho ou curso é um problema para você?", opcoes: [["sim", "Sim"], ["nao", "Não"]] },
    { id: "ensino_medio", texto: "Você terminou o ensino médio?", opcoes: [["sim", "Sim"], ["nao", "Não"]] },
    { id: "curriculo", texto: "Você já tem um currículo?", opcoes: [["sim", "Sim"], ["nao", "Não"]] }
  ];

  var ID_VALIDOS = {};
  PERGUNTAS.forEach(function (p) { ID_VALIDOS[p.id] = p.opcoes.map(function (o) { return o[0]; }); });

  /* Uma pergunta só se aplica quando a resposta muda o plano. */
  function aplica(p, r) {
    if (p.id === "cuidado") return r.filhos === "sim";
    if (p.id === "deslocamento" || p.id === "ensino_medio" || p.id === "curriculo") return r.objetivo !== "negocio";
    return true;
  }

  /* Só aceita respostas previstas; qualquer outra coisa é ignorada (nada de texto livre aqui). */
  function limpar(resp) {
    var r = {};
    PERGUNTAS.forEach(function (p) {
      var v = resp && resp[p.id];
      if (ID_VALIDOS[p.id].indexOf(v) !== -1) r[p.id] = v;
    });
    if (r.filhos !== "sim") delete r.cuidado;
    return r;
  }

  function aplicaveis(resp) {
    var r = limpar(resp);
    return PERGUNTAS.filter(function (p) { return aplica(p, r); });
  }

  /* Próxima pergunta ainda sem resposta (e que não foi pulada); null quando acabou. */
  function proxima(resp, puladas) {
    var r = limpar(resp), lista = aplicaveis(r), pul = puladas || [];
    for (var i = 0; i < lista.length; i++) {
      if (r[lista[i].id] === undefined && pul.indexOf(lista[i].id) === -1) return { pergunta: lista[i], numero: i + 1, total: lista.length };
    }
    return null;
  }

  function interno(alvo, rotulo) { return { tipo: "interno", alvo: alvo, rotulo: rotulo }; }
  function externo(link, rotulo) { return { tipo: "externo", alvo: link[1], rotulo: rotulo }; }

  /* O telefone vem do catálogo verificado (uma só fonte); sem catálogo, o passo simplesmente não mostra telefone. */
  function contato(achar, id, rotulo) {
    var s = achar && achar(id);
    return s && s.telefone ? { nome: rotulo || s.nome, telefone: String(s.telefone) } : null;
  }

  /* Cada passo: um título curto, por que importa, UMA ação, o telefone real e (recolhido) o que levar, o que perguntar e o que fazer se não der certo. */
  function montarPlano(respostas, achar) {
    var r = limpar(respostas);
    var negocio = r.objetivo === "negocio";
    var querVaga = r.objetivo === "emprego" || r.objetivo === "nao_sei" || !r.objetivo;
    var passos = [];
    function add(p) { p.leve = p.leve || []; p.pergunte = p.pergunte || []; p.extras = p.extras || []; p.contato = p.contato || null; passos.push(p); }

    if (r.renda_agora === "sim") {
      add({
        id: "renda", titulo: "Procure o CRAS do seu bairro",
        porque: "O CRAS orienta sobre benefícios e programas de apoio quando falta dinheiro para o básico. Quem avalia o seu caso é o próprio CRAS, não este site.",
        acao: interno("#assistencia", "Ver o CRAS do meu bairro"),
        leve: ["Documento com foto e comprovante de residência, se tiver. Confirme a lista com o CRAS."],
        contato: contato(achar, "man-desenv-social-sede", "Secretaria de Desenvolvimento Social"),
        alternativa: "Se o CRAS estiver longe ou sem horário, ligue antes para a Secretaria de Desenvolvimento Social."
      });
    }

    if (r.filhos === "sim" && r.cuidado !== "sim") {
      add({
        id: "cuidado",
        titulo: r.cuidado === "as_vezes" ? "Garanta o cuidado dos seus filhos nos horários de trabalho" : "Peça vaga em creche ou escola para seus filhos",
        porque: r.cuidado === "as_vezes"
          ? "Se o cuidado só funciona às vezes, fica difícil manter um horário fixo de trabalho ou de curso."
          : "Sem alguém com quem deixar as crianças, é difícil manter um trabalho ou um curso. Por isso este passo vem cedo.",
        acao: interno("#educacao/educacao-filhos", "Ver como pedir a vaga"),
        leve: ["Documentos da criança e do responsável. A lista exata é a que a Secretaria da Educação informar."],
        pergunte: ["Como pedir a vaga pelo aplicativo CADU ou na Secretaria da Educação.", "Qual escola perto de casa atende a idade do seu filho e que horário ela funciona."],
        contato: contato(achar, "man-secretaria-educacao", "Secretaria Municipal da Educação"),
        alternativa: "Uma escola cadastrada não garante vaga. Se não houver vaga agora, peça o registro por escrito e procure o Conselho Tutelar. Nos dias sem vaga, combine com familiares ou vizinhos."
      });
    }

    if (r.curriculo === "nao" && !negocio) {
      add({
        id: "curriculo", titulo: "Monte seu currículo (leva uns 5 minutos)",
        porque: "A maioria das vagas e dos cursos pede um currículo. Experiências sem carteira assinada contam: cuidados, vendas, limpeza, cozinha, trabalhos informais.",
        acao: { tipo: "curriculo", rotulo: "Montar meu currículo agora" },
        leve: ["Não coloque CPF, RG, endereço completo nem data de nascimento exata."],
        contato: contato(achar, "man-pat", "PAT (se quiser ajuda presencial)"),
        alternativa: "Se preferir ajuda presencial, pergunte no PAT se há orientação para montar currículo."
      });
    }

    /* O passo do objetivo: o que ela pediu. */
    if (r.objetivo === "curso") {
      add({
        id: "curso", titulo: "Escolha um curso",
        porque: "Um curso certificado amplia as vagas possíveis. Compare opções gratuitas e pagas antes de decidir.",
        acao: interno("#educacao/educacao-voce", "Ver cursos em Rio Claro"),
        pergunte: ["Requisitos, duração, horário, custo e se há bolsa ou gratuidade.", "Se há turma aberta e prazo de inscrição: a página de uma unidade não garante vaga."],
        extras: [LINKS.trampolim],
        alternativa: "Se um curso não tiver turma, tente outra instituição da lista ou os cursos do Trampolim."
      });
    } else if (negocio) {
      add({
        id: "negocio", titulo: "Entenda como gerar renda por conta própria",
        porque: "Vender produtos ou serviços pode ser um caminho de renda, principalmente quando um emprego fixo não cabe na sua rotina.",
        acao: externo(LINKS.desenvEcon, "Ver a Secretaria de Desenvolvimento Econômico"),
        pergunte: ["Como formalizar e quais apoios existem (Banco do Povo e Sala do Empreendedor).", "Requisitos e prazos de crédito: o site não promete crédito nem renda."],
        contato: contato(achar, "man-sde", "Secretaria de Desenvolvimento Econômico"),
        alternativa: "Um curso curto de gestão ou da sua área pode ajudar antes de começar. Veja as opções na área Educação."
      });
    } else if (querVaga) {
      add({
        id: "vagas", titulo: "Procure vagas e atendimento ao trabalhador",
        porque: "Os portais mostram vagas abertas, e o PAT atende pessoalmente, com orientação.",
        acao: externo(LINKS.portal, "Ver vagas no Portal da Empregabilidade"),
        pergunte: ["Antes de aceitar uma vaga: horário, escala, local, salário e contrato claros, e custo de transporte.", "Desconfie de quem cobra para participar de seleção.", "Se você vive ou viveu violência doméstica: a Lei nº 14.542/2023 dá prioridade no atendimento do Sine e reserva 10% das vagas intermediadas para mulheres nessa situação. Pergunte no PAT como funciona em Rio Claro e o que precisam de você. Você decide quanto quer contar."],
        extras: [LINKS.trampolim, LINKS.leiSine],
        contato: contato(achar, "man-pat", "PAT — Posto de Atendimento ao Trabalhador"),
        alternativa: "Este site não lista vagas abertas. Se não achar nada, veja cursos para ampliar as possibilidades."
      });
    }
    if (r.objetivo === "nao_sei") {
      add({
        id: "opcoes", titulo: "Conheça as opções antes de escolher",
        porque: "Quem ainda não sabe o que quer pode comparar cursos e vagas, sem pressa.",
        acao: interno("#educacao/educacao-voce", "Ver cursos e estudos em Rio Claro"),
        pergunte: ["Anote o que combina com o seu tempo e os seus interesses."],
        alternativa: "Se continuar em dúvida, o PAT e o CRAS orientam pessoalmente."
      });
    }

    if (r.deslocamento === "sim" && !negocio) {
      add({
        id: "deslocamento", titulo: "Veja se o ônibus serve para você",
        porque: "Uma vaga ou um curso longe demais pode não funcionar na prática.",
        acao: interno("#transporte", "Ver horários de ônibus"),
        pergunte: ["Tempo de viagem e custo do transporte antes de aceitar.", "Se há turmas ou vagas em horários que combinem com o ônibus."],
        alternativa: "O site traz os horários de algumas linhas da SOU; se a sua não estiver, confira no site da SOU. Prefira opções no seu bairro ou perto dele."
      });
    }

    if (r.ensino_medio === "nao" && !negocio) {
      add({
        id: "estudos", titulo: "Termine o ensino médio na EJA",
        porque: "Muitas vagas e cursos pedem o ensino médio completo. O SESI-SP oferece a EJA gratuita para quem não concluiu.",
        acao: interno("#educacao/educacao-voce", "Ver a EJA e os cursos"),
        leve: ["Para o ensino médio na EJA, a idade mínima é 18 anos."],
        pergunte: ["Se a EJA tem turma na unidade, quais documentos levar e até quando vai a matrícula."],
        contato: contato(achar, "man-sesi-rio-claro", "SESI Rio Claro"),
        alternativa: "Se o SESI não tiver turma agora, pergunte na Secretaria Municipal da Educação sobre outras opções de EJA."
      });
    }

    if (r.objetivo === "emprego") {
      add({
        id: "formacao", titulo: "Se faltar qualificação, veja cursos",
        porque: "Alguns empregos exigem um curso. Um curso curto pode abrir vagas que hoje estão fechadas.",
        acao: interno("#educacao/educacao-voce", "Ver cursos em Rio Claro"),
        pergunte: ["Requisitos, custo e turmas abertas."],
        alternativa: "Se um curso não tiver turma, tente outra instituição da lista."
      });
    }

    passos.forEach(function (p, i) { p.numero = i + 1; });
    return {
      respostas: r, passos: passos, primeiros: PRIMEIROS,
      /* Sem perguntar nada (é um assunto íntimo): um lembrete fixo para quem carrega um peso a mais em casa. */
      apoio: { texto: "Se um filho ou outro familiar usa álcool ou drogas e isso pesa na sua rotina, você não está sozinha: veja por onde começar.", rotulo: "Ver apoio na área Saúde", alvo: "#saude/saude-familia-drogas" },
      avisos: [
        "Este plano são sugestões de por onde começar. Ele não diz se você tem direito a algum benefício nem garante vaga, emprego ou crédito.",
        "Se você está com medo de alguém ou em risco, use o botão “Em perigo agora?” ou abra a área Direitos antes de qualquer outro passo."
      ]
    };
  }

  /* Currículo: só organiza o que a pessoa digitou. Não inventa nem completa nada. */
  function linhas(txt, max) {
    return String(txt == null ? "" : txt).split(/\r?\n/).map(function (l) { return l.trim(); }).filter(Boolean).slice(0, max || 12)
      .map(function (l) { return l.slice(0, 160); });
  }
  function campo(txt, max) { return String(txt == null ? "" : txt).replace(/\s+/g, " ").trim().slice(0, max || 100); }

  function montarCurriculo(d) {
    d = d || {};
    var secoes = [];
    var objetivo = campo(d.objetivo, 120);
    if (objetivo) secoes.push({ titulo: "Objetivo", itens: [objetivo] });
    var exp = linhas(d.experiencias); if (exp.length) secoes.push({ titulo: "Experiências", itens: exp });
    var form = linhas(d.formacao); if (form.length) secoes.push({ titulo: "Formação e cursos", itens: form });
    var hab = linhas(d.habilidades); if (hab.length) secoes.push({ titulo: "Habilidades", itens: hab });
    var disp = campo(d.disponibilidade, 120); if (disp) secoes.push({ titulo: "Disponibilidade", itens: [disp] });
    var contatoCv = [campo(d.telefone, 40), campo(d.email, 80), campo(d.cidade, 60)].filter(Boolean);
    return { nome: campo(d.nome, 80), contato: contatoCv, secoes: secoes, vazio: !campo(d.nome, 80) && !secoes.length };
  }

  /* Avisa se a pessoa colocou dado que não deve ir num currículo (CPF, RG, CEP completo). */
  function dadosDesnecessarios(d) {
    var txt = Object.keys(d || {}).map(function (k) { return String(d[k]); }).join(" \n ");
    var achados = [];
    if (/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/.test(txt)) achados.push("parece haver um CPF");
    if (/\b\d{1,2}\.?\d{3}\.?\d{3}-?[\dxX]\b/.test(txt)) achados.push("parece haver um RG");
    if (/\b\d{5}-?\d{3}\b/.test(txt)) achados.push("parece haver um CEP");
    return achados;
  }

  return {
    PERGUNTAS: PERGUNTAS, LINKS: LINKS, PRIMEIROS: PRIMEIROS, limpar: limpar, aplicaveis: aplicaveis, proxima: proxima,
    montarPlano: montarPlano, montarCurriculo: montarCurriculo, dadosDesnecessarios: dadosDesnecessarios
  };
});
