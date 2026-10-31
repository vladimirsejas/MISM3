/* Jornada "Assistência social": uma pergunta -> plano curto com o primeiro canal, por que começar por ele, o que perguntar e o que
   fazer se não der certo. Três caminhos: falta de dinheiro ou de apoio no básico; direitos violados (violência, abandono, negligência);
   convivência para filhos ou pessoas idosas; e, para quem está sozinha com os filhos e precisa voltar a trabalhar, uma sequência em que a creche
   vem antes dos cursos e das vagas (ideia dos portais de benefícios e dos programas de integração de mães: emprego e cuidado infantil juntos).
   Só usa o que a área Assistência Social e o catálogo verificado já afirmam. Fala do Cadastro Único (CadÚnico) como o primeiro passo no CRAS,
   com o texto e as fontes da área; não afirma que a pessoa tem direito a benefício algum nem diz valor de renda ou horário.
   Lógica pura (sem DOM, sem rede, sem gravar nada). */
(function (raiz, fabrica) {
  if (typeof module === "object" && module.exports) module.exports = fabrica(require("./jornada.js"));
  else raiz.JornadaAssistencia = fabrica(raiz.Jornada);
})(typeof self !== "undefined" ? self : this, function (J) {
  "use strict";
  var A = J.ajudantes, interno = A.interno, contato = A.contato;

  var CADUNICO = ["Como me cadastro no CadÚnico? — Prefeitura de Rio Claro", "https://desenvolvimentosocial.rc.sp.gov.br/?page_id=3366", "Quem pode, documentos e onde fazer, segundo a Secretaria de Desenvolvimento Social."];
  var LISTA_CRAS = ["CRAS e Centros de Convivência — página oficial", "https://desenvolvimentosocial.rc.sp.gov.br/?page_id=1651", "Lista oficial dos CRAS, dos bairros que cada um atende e dos serviços de convivência."];
  var DISQUE_100 = { nome: "Disque Direitos Humanos", telefone: "100" };

  var PERGUNTAS = [
    { id: "precisa", texto: "Do que você precisa agora?", opcoes: [
      ["apoio", "Falta dinheiro ou comida para as despesas básicas"],
      ["sozinha_trabalho", "Estou sozinha com os filhos e preciso voltar a trabalhar"],
      ["direitos", "Violência, abandono ou direitos violados (meus ou de uma criança)"],
      ["convivencia", "Atividades e convivência para meu filho ou para uma pessoa idosa"],
      ["nao_sei", "Não sei por onde começar"]
    ] }
  ];
  function aplica() { return true; }

  function passoCras(achar) {
    return {
      id: "cras", titulo: "Procure o CRAS do seu bairro",
      porque: "O CRAS é a porta de entrada da assistência social, perto de onde você mora. É lá que se faz o Cadastro Único (CadÚnico), que é a porta para programas como o Bolsa Família. Quem avalia o seu caso é o órgão responsável, não este site.",
      acao: interno("#mapa/cras", "Ver qual CRAS atende o meu bairro"),
      leve: ["Quem responde pela família: documento com foto, CPF ou título de eleitor e comprovante de residência. Dos outros moradores: pelo menos um documento de cada um. Confirme a lista com o CRAS."],
      pergunte: ["Como fazer ou atualizar o Cadastro Único e quais documentos levar.", "Dia, horário e se é preciso marcar: o site nem sempre traz o horário de cada unidade."],
      extras: [CADUNICO, LISTA_CRAS],
      contato: contato(achar, "man-desenv-social-sede", "Secretaria de Desenvolvimento Social"),
      alternativa: "Se o CRAS estiver longe ou sem horário, ligue antes para a Secretaria de Desenvolvimento Social."
    };
  }

  function passoOutrosCanais(achar) {
    return {
      id: "outros", titulo: "Veja outros canais se o CRAS não resolver",
      porque: "A Secretaria de Desenvolvimento Social e o Fundo Social de Solidariedade também informam sobre programas e cursos. Cada canal avalia o seu caso: nenhum garante atendimento.",
      acao: interno("#assistencia", "Ver a Secretaria e outros canais"),
      pergunte: ["Que programas e cursos existem agora e como se inscrever: as páginas oficiais nem sempre trazem as turmas abertas."],
      contato: contato(achar, "man-fundo-social", "Fundo Social de Solidariedade"),
      alternativa: "Se um canal não responder, tente o outro ou volte ao CRAS e pergunte quem mais pode ajudar."
    };
  }

  function passoCreas(achar) {
    return {
      id: "creas", titulo: "Procure o CREAS",
      porque: "O CREAS atende famílias e pessoas em situação de risco social ou com direitos violados, como violência física, psicológica ou sexual, negligência, abandono, trabalho infantil e situação de rua. Atende todo o município, é gratuito e pode ser procurado diretamente.",
      acao: interno("#assistencia", "Ver o CREAS"),
      pergunte: ["Como é o primeiro atendimento e se é preciso agendar."],
      contato: contato(achar, "man-creas", "CREAS"),
      alternativa: "Se não conseguir falar com o CREAS, o CRAS também orienta. Para crianças e adolescentes, procure o Conselho Tutelar (próximo passo)."
    };
  }

  function passoConselho(achar) {
    var sul = achar && achar("man-conselho-tutelar-sul"), norte = achar && achar("man-conselho-tutelar-norte");
    var tels = [];
    if (sul && sul.telefone) tels.push("Região Sul: " + sul.telefone);
    if (norte && norte.telefone) tels.push("Região Norte: " + norte.telefone);
    return {
      id: "conselho", titulo: "Se for uma criança ou adolescente, procure o Conselho Tutelar",
      porque: "O Conselho Tutelar recebe casos de violação de direitos de crianças e adolescentes. Há um Conselho para a região Sul e outro para a Norte.",
      acao: interno("#assistencia", "Ver o Conselho Tutelar"),
      pergunte: [tels.length ? "Qual região atende o seu endereço. Telefones — " + tels.join("; ") + "." : "Qual região atende o seu endereço (Sul ou Norte)."],
      alternativa: "Se o Conselho Tutelar não resolver, o CREAS e a Defensoria Pública orientam o que fazer em seguida."
    };
  }

  function passoDisque100() {
    return {
      id: "disque100", titulo: "Denuncie pelo Disque 100, se preferir",
      porque: "O Disque 100 recebe, analisa e encaminha denúncias de violações de direitos humanos, como contra crianças e adolescentes, pessoas idosas e pessoas com deficiência. Funciona 24 horas por dia, todos os dias. A ligação é gratuita.",
      acao: interno("#assistencia", "Ver o Disque 100 e os outros canais de proteção"),
      pergunte: ["Você decide quanto quer contar. Se houver perigo agora, use o botão “Em perigo agora?”."],
      contato: DISQUE_100,
      alternativa: "Se não conseguir ligar, procure o CREAS ou o Conselho Tutelar."
    };
  }

  function passoConvivencia() {
    return {
      id: "convivencia", titulo: "Pergunte no CRAS pelo serviço de convivência",
      porque: "O Serviço de Convivência e Fortalecimento de Vínculos atende, por exemplo, crianças e adolescentes de 6 a 15 anos (rede direta da Prefeitura), e há unidades que atendem pessoas idosas de 65 anos ou mais. Cada unidade tem um CRAS de referência: o CRAS do seu bairro diz qual fica mais perto.",
      acao: interno("#assistencia", "Ver os serviços de convivência"),
      pergunte: ["Idade atendida, horário, se há vaga e como fazer a inscrição: as páginas oficiais não informam as vagas."],
      extras: [LISTA_CRAS],
      alternativa: "Se a unidade mais próxima não tiver vaga, pergunte no CRAS por outra."
    };
  }

  /* Caminho "sozinha com os filhos": CRAS e Cadastro Único, depois creche, depois cursos, depois vagas, e a pensão em paralelo.
     A creche vem antes das vagas porque sem ter com quem deixar as crianças a vaga não se aceita. Nada aqui diz que a mulher tem direito a vaga ou benefício. */
  function passoCreche(achar) {
    return {
      id: "creche", titulo: "Encaminhe a creche ou a escola dos filhos",
      porque: "Sem ter com quem deixar as crianças fica difícil aceitar um curso ou uma vaga de trabalho. Por isso este passo vem antes. Inscrição ou cadastro não é vaga: pergunte em que etapa está o pedido.",
      acao: interno("#educacao", "Ver matrícula e vagas para os filhos"),
      leve: ["Certidão de nascimento da criança, documento e comprovante de residência de quem é responsável. Confirme a lista com a Secretaria da Educação."],
      pergunte: ["Como pedir a vaga, em que etapa está o pedido e que alternativas existem se não houver vaga.", "Se há atividade no contraturno para as crianças maiores (pergunte também no CRAS, que informa os serviços de convivência)."],
      contato: contato(achar, "man-secretaria-educacao", "Secretaria Municipal da Educação"),
      alternativa: "Se não houver vaga, pergunte na Secretaria como acompanhar o pedido e, no CRAS, por serviços de convivência. Escola cadastrada não garante vaga."
    };
  }

  function passoCursosSozinha(achar) {
    return {
      id: "cursos", titulo: "Escolha um curso que caiba na rotina dos seus filhos",
      porque: "Um curso gratuito só ajuda se o horário couber na rotina das crianças. O Fundo Social e os centros de qualificação informam as turmas.",
      acao: interno("#trabalho", "Ver cursos e montar o plano de Trabalho"),
      pergunte: ["Que cursos existem agora, em que horário são as aulas e se há outra turma.", "Se é possível levar a criança ou se há apoio para quem tem filhos pequenos: não suponha que haja."],
      contato: contato(achar, "man-fundo-social", "Fundo Social de Solidariedade"),
      alternativa: "Se o horário não servir, pergunte quando abre outra turma e peça para anotarem o seu interesse."
    };
  }

  function passoVagasSozinha(achar) {
    return {
      id: "vagas", titulo: "Procure vagas de trabalho",
      porque: "Com a creche encaminhada e um curso em vista, a busca por vagas fica mais possível. A Secretaria de Desenvolvimento Econômico e o Portal da Empregabilidade informam as oportunidades.",
      acao: interno("#trabalho", "Ver vagas e fazer o currículo"),
      pergunte: ["Que vagas existem e em que horário: confira se o horário e o deslocamento cabem na rotina dos seus filhos antes de aceitar."],
      contato: contato(achar, "man-sde", "Secretaria de Desenvolvimento Econômico"),
      alternativa: "Se não houver vaga agora, deixe o currículo e pergunte quando abrem novas oportunidades."
    };
  }

  function passoPensaoSozinha(achar) {
    return {
      id: "pensao", titulo: "Pergunte à Defensoria sobre a pensão dos filhos",
      porque: "Se o pai ou a mãe dos seus filhos não ajuda, a Defensoria Pública orienta, de graça, quem não pode pagar advogado. A pensão só vale a partir do pedido na Justiça, então vale perguntar cedo. Isso pode andar junto com os outros passos.",
      acao: interno("#direitos", "Ver pensão e guarda"),
      pergunte: ["Se o seu caso pode ser atendido e o que levar. Pelo telefone ou pelo portal da Defensoria, em dias úteis."],
      contato: contato(achar, "man-defensoria-nudem", "Defensoria Pública"),
      alternativa: "Se não conseguir agendar, procure o CRAS e pergunte quem pode orientar sobre pensão."
    };
  }

  function montarPlano(respostas, achar) {
    var r = J.de("assistencia").limpar(respostas);
    var passos = [], apoio = null;
    function completa(p) { p.leve = p.leve || []; p.pergunte = p.pergunte || []; p.extras = p.extras || []; p.contato = p.contato || null; passos.push(p); }
    var avisos = ["Este plano são sugestões de por onde começar. Quem avalia o seu caso é o serviço procurado, não este site, e nenhum deles garante atendimento ou benefício. Confirme sempre telefone, endereço e horário antes de ir."];
    if (r.precisa === "direitos") {
      completa(passoCreas(achar)); completa(passoConselho(achar)); completa(passoDisque100());
      apoio = { texto: "Se a violência é contra você, mulher: o Ligue 180 atende 24 horas, de graça, e a área Direitos traz os canais de proteção.", rotulo: "Ver a área Direitos", alvo: "#direitos" };
    } else if (r.precisa === "sozinha_trabalho") {
      completa(passoCras(achar)); completa(passoCreche(achar)); completa(passoCursosSozinha(achar)); completa(passoVagasSozinha(achar)); completa(passoPensaoSozinha(achar));
      apoio = { texto: "Se alguém ameaça ou machuca você ou os seus filhos, comece pela área Direitos: o Ligue 180 atende 24 horas, de graça.", rotulo: "Ver a área Direitos", alvo: "#direitos" };
    } else if (r.precisa === "convivencia") {
      completa(passoConvivencia());
    } else if (r.precisa === "apoio" || r.precisa === "nao_sei") {
      completa(passoCras(achar)); completa(passoOutrosCanais(achar));
      apoio = { texto: "Se você também procura trabalho ou cursos, monte um plano na área Trabalho.", rotulo: "Ver o plano de Trabalho", alvo: "#trabalho" };
    } else {
      avisos = ["Escolha do que você precisa e tente de novo."];
    }
    avisos.push("Se você está com medo de alguém ou em risco, use o botão “Em perigo agora?” ou abra a área Direitos antes de qualquer outro passo.");
    passos.forEach(function (p, i) { p.numero = i + 1; });
    return { respostas: r, passos: passos, primeiros: J.PRIMEIROS, apoio: apoio, avisos: avisos };
  }

  J.registrar({ id: "assistencia", titulo: "Monte seu plano de apoio", tituloImpressao: "Meu plano — Assistência social", PERGUNTAS: PERGUNTAS, aplica: aplica, montarPlano: montarPlano });

  return { PERGUNTAS: PERGUNTAS, montarPlano: montarPlano };
});
