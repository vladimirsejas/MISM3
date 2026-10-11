/* Jornada "Trabalho e cuidado": perguntas curtas -> plano de próximos passos, e currículo.
   Lógica pura (sem DOM, sem rede, sem gravar nada): testável no Node e usada no navegador.
   Não decide quem tem direito a nada: ordena sugestões e aponta os canais oficiais, que avaliam cada caso. */
(function (raiz, fabrica) {
  if (typeof module === "object" && module.exports) module.exports = fabrica();
  else raiz.Jornada = fabrica();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var DESENV_ECON = "https://rioclaro.sp.gov.br/secretaria/secretaria-de-desenvolvimento-economico/";
  var FUNDO_SOCIAL = "https://rioclaro.sp.gov.br/secretaria/fundo-social-de-solidariedade/";

  /* Todo link do plano vem de uma fonte já cadastrada no projeto (areas.js ou catalogo_manual.json). */
  var LINKS = {
    educacao: ["Secretaria Municipal da Educação", "https://rioclaro.sp.gov.br/secretaria/secretaria-da-educacao/", "Orientações sobre a rede municipal e a matrícula."],
    demanda: ["Consulta pública da demanda escolar", "https://www.educacaorc.com.br/?r=demandaescolar", "Informações disponibilizadas no portal da Educação."],
    cras: ["CRAS — Centros de Referência de Assistência Social", "https://rioclaro.sp.gov.br/centro-ref-assistencia-social/", "Orientação sobre benefícios e proteção social."],
    assistencia: ["Área Assistência Social deste site", "#assistencia", "CRAS por bairro, CREAS e Secretaria de Desenvolvimento Social."],
    portal: ["Portal da Empregabilidade de Rio Claro", "https://vagas.rioclaro.sp.gov.br/", "Consultar oportunidades e informações para trabalhadores."],
    trampolim: ["Trampolim — Governo de São Paulo", "https://www.trampolim.sp.gov.br/", "Consultar oportunidades e cursos disponíveis na plataforma."],
    pat: ["PAT, Conecta e Secretaria de Desenvolvimento Econômico", DESENV_ECON, "Atendimento ao trabalhador e orientação para procurar emprego."],
    bancoPovo: ["Banco do Povo e Sala do Empreendedor", DESENV_ECON, "Orientação para empreender e sobre crédito, sem garantia de aprovação."],
    cqp: ["Centros de Qualificação Profissional e Fundo Social", FUNDO_SOCIAL, "Cursos de qualificação. Confirme turmas abertas e inscrições."],
    senai: ["SENAI Rio Claro", "https://sp.senai.br/unidade/rioclaro/sobre-a-unidade", "Cursos livres, Aprendiz SENAI e cursos técnicos gratuitos."],
    senac: ["Senac Rio Claro", "https://www.sp.senac.br/senac-rio-claro/cursos-livres", "Cursos livres. Confirme valores, bolsas e turmas."],
    sestsenat: ["SEST SENAT — busca de unidades", "https://www.sestsenat.org.br/unidades", "Selecione São Paulo e Rio Claro e confirme se há unidade."]
  };

  var PERGUNTAS = [
    { id: "filhos", texto: "Você tem crianças que dependem de você?", opcoes: [["sim", "Sim"], ["nao", "Não"]] },
    { id: "cuidado", texto: "Hoje você tem com quem deixá-las para trabalhar ou estudar?", so_se: ["filhos", "sim"], opcoes: [["sim", "Sim"], ["as_vezes", "Só às vezes"], ["nao", "Não"]] },
    { id: "renda_agora", texto: "Você precisa de dinheiro para as despesas básicas agora?", opcoes: [["sim", "Sim"], ["nao", "Não"]] },
    { id: "deslocamento", texto: "Chegar até um trabalho ou curso é um problema para você?", opcoes: [["sim", "Sim"], ["nao", "Não"]] },
    { id: "curriculo", texto: "Você já tem um currículo?", opcoes: [["sim", "Sim"], ["nao", "Não"]] },
    { id: "objetivo", texto: "O que você quer agora?", opcoes: [["emprego", "Conseguir um emprego"], ["curso", "Fazer um curso"], ["negocio", "Gerar renda por conta própria"], ["nao_sei", "Ainda não sei"]] }
  ];

  var ID_VALIDOS = {};
  PERGUNTAS.forEach(function (p) { ID_VALIDOS[p.id] = p.opcoes.map(function (o) { return o[0]; }); });

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

  var ALTERNATIVA_GERAL = "Se este passo não funcionar (sem vaga, sem resposta ou não serve para você), não desista do plano: passe ao próximo e volte depois, ou procure atendimento presencial no CRAS.";

  /* Cada passo diz o que fazer, por que está nessa posição e o que tentar se não der certo. */
  function montarPlano(respostas) {
    var r = limpar(respostas);
    var passos = [];
    function add(p) { passos.push(p); }

    if (r.filhos === "sim" && r.cuidado !== "sim") {
      add({
        id: "cuidado", titulo: "Combinar o cuidado das crianças",
        porque: r.cuidado === "as_vezes"
          ? "Se o cuidado só funciona às vezes, fica difícil manter um horário fixo de trabalho ou de curso."
          : "Sem alguém com quem deixar as crianças, é difícil manter um trabalho ou um curso. Por isso este passo vem primeiro.",
        fazer: ["Procure a Secretaria da Educação para saber como pedir vaga em creche ou escola e quais documentos levar.",
          "Pergunte a situação do pedido e os horários de funcionamento: o horário da creche precisa caber no do trabalho.",
          "Combine, se puder, uma alternativa com familiares ou vizinhos para os dias sem vaga."],
        links: [LINKS.educacao, LINKS.demanda],
        alternativa: "Uma creche cadastrada não garante vaga. Se não houver vaga agora, peça orientação no CRAS sobre outras formas de apoio."
      });
    }

    if (r.renda_agora === "sim") {
      add({
        id: "renda", titulo: "Procurar apoio da assistência social",
        porque: "Quando falta dinheiro para o básico, é difícil se dedicar a um curso ou a uma busca de emprego. O CRAS orienta sobre benefícios e programas.",
        fazer: ["Descubra qual CRAS atende o seu bairro na área Assistência Social.",
          "Leve documentos pessoais e comprovante de residência, se tiver. Quem decide se há direito a algum benefício é o órgão responsável, não este site."],
        links: [LINKS.assistencia, LINKS.cras],
        alternativa: "Se o CRAS estiver longe ou sem horário, ligue antes para a Secretaria de Desenvolvimento Social, (19) 3522-1930."
      });
    }

    if (r.deslocamento === "sim") {
      add({
        id: "deslocamento", titulo: "Escolher opções perto de casa",
        porque: "Se chegar ao local é difícil, uma boa vaga ou curso longe pode não funcionar na prática.",
        fazer: ["Prefira primeiro opções no seu bairro ou perto dele.",
          "Antes de aceitar, confirme horário de ônibus, tempo de viagem e custo do transporte. Este site ainda não traz horários de ônibus.",
          "Pergunte se há turmas ou vagas em horários que combinem com o transporte."],
        links: [],
        alternativa: "Cursos a distância, quando existirem, evitam o deslocamento. Pergunte à unidade ou veja o Trampolim."
      });
    }

    var querEmprego = r.objetivo === "emprego" || r.objetivo === "nao_sei" || !r.objetivo;
    if (r.curriculo === "nao" && (querEmprego || r.objetivo === "curso")) {
      add({
        id: "curriculo", titulo: "Montar um currículo",
        porque: "A maioria das vagas e dos cursos pede um currículo. Mesmo sem emprego com carteira, você tem experiências que contam: cuidados, vendas, limpeza, cozinha, trabalhos informais.",
        fazer: ["Use o montador de currículo desta página: preencha, confira e imprima ou salve em PDF.",
          "Não coloque CPF, RG, endereço completo nem data de nascimento exata."],
        links: [], acao: "curriculo",
        alternativa: "Se preferir ajuda presencial, pergunte no PAT se há orientação para montar currículo."
      });
    }

    if (r.objetivo === "curso") {
      add({
        id: "curso", titulo: "Escolher um curso profissionalizante",
        porque: "Um curso certificado amplia as vagas possíveis. Compare opções gratuitas e pagas antes de decidir.",
        fazer: ["Veja as opções abaixo e pergunte requisitos, duração, horário, custo e se há bolsa ou gratuidade.",
          "Confirme se há turma aberta e prazo de inscrição: a página de uma unidade não garante vaga."],
        links: [LINKS.senai, LINKS.cqp, LINKS.senac, LINKS.sestsenat, LINKS.trampolim],
        alternativa: "Se um curso não tiver turma, tente outra instituição da lista ou os cursos do Trampolim."
      });
    }

    if (querEmprego) {
      add({
        id: "vagas", titulo: "Procurar vagas",
        porque: "Com o cuidado das crianças, o dinheiro do básico e o deslocamento encaminhados, a busca por vagas rende mais.",
        fazer: ["Procure vagas no Portal da Empregabilidade e no Trampolim.",
          "Passe no PAT ou no Conecta para orientação e intermediação.",
          "Antes de aceitar uma vaga: horário, escala, local, salário e contrato claros, e custo de transporte. Desconfie de quem cobra para participar de seleção."],
        links: [LINKS.portal, LINKS.trampolim, LINKS.pat],
        alternativa: "Este site não lista vagas abertas. Sem resultado nos portais, veja também os cursos abaixo para ampliar as possibilidades."
      });
      if (r.objetivo === "emprego") {
        add({
          id: "formacao", titulo: "Se faltar qualificação, veja cursos",
          porque: "Alguns empregos exigem um curso. Fazer um curso curto pode abrir vagas que hoje estão fechadas.",
          fazer: ["Veja as opções de cursos abaixo e confirme requisitos, custo e turmas."],
          links: [LINKS.senai, LINKS.cqp, LINKS.senac], alternativa: ALTERNATIVA_GERAL
        });
      }
    }

    if (r.objetivo === "negocio") {
      add({
        id: "negocio", titulo: "Entender como gerar renda por conta própria",
        porque: "Vender produtos ou serviços pode ser um caminho de renda, principalmente quando um emprego fixo não cabe na sua rotina.",
        fazer: ["Procure a Secretaria de Desenvolvimento Econômico (Banco do Povo e Sala do Empreendedor) para saber como formalizar e quais apoios existem.",
          "Pergunte requisitos e prazos de crédito: o site não promete crédito nem renda."],
        links: [LINKS.bancoPovo, LINKS.cqp],
        alternativa: "Um curso curto de gestão ou da sua área pode ajudar antes de começar. Veja as opções de cursos abaixo."
      });
    }

    if (r.objetivo === "nao_sei" && !passos.some(function (p) { return p.id === "curso"; })) {
      add({
        id: "opcoes", titulo: "Conhecer as opções antes de escolher",
        porque: "Quem ainda não sabe o que quer pode comparar cursos e vagas, sem pressa.",
        fazer: ["Dê uma olhada nos cursos abaixo e anote o que combina com seu tempo e seus interesses."],
        links: [LINKS.senai, LINKS.cqp, LINKS.senac], alternativa: ALTERNATIVA_GERAL
      });
    }

    passos.forEach(function (p, i) { p.numero = i + 1; });
    return {
      respostas: r, passos: passos,
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
    var contato = [campo(d.telefone, 40), campo(d.email, 80), campo(d.cidade, 60)].filter(Boolean);
    return { nome: campo(d.nome, 80), contato: contato, secoes: secoes, vazio: !campo(d.nome, 80) && !secoes.length };
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

  return { PERGUNTAS: PERGUNTAS, LINKS: LINKS, limpar: limpar, montarPlano: montarPlano, montarCurriculo: montarCurriculo, dadosDesnecessarios: dadosDesnecessarios };
});
