/* Jornada "Educação": uma pergunta de cada vez -> plano curto, com duas ramificações.
     "Para o meu filho"  -> pedir ou acompanhar a vaga (creche, pré-escola, ensino fundamental);
     "Para mim"          -> terminar o ensino médio, curso técnico ou profissionalizante, faculdade.
   Não inventa nada: cada passo organiza o que a área Educação e o catálogo verificado já trazem, com a mesma cautela
   ("confirme na Secretaria", "não garante vaga"). Lógica pura (sem DOM, sem rede, sem gravar nada). */
(function (raiz, fabrica) {
  if (typeof module === "object" && module.exports) module.exports = fabrica(require("./jornada.js"));
  else raiz.JornadaEducacao = fabrica(raiz.Jornada);
})(typeof self !== "undefined" ? self : this, function (J) {
  "use strict";
  var A = J.ajudantes, interno = A.interno, externo = A.externo, contato = A.contato, extraDoCatalogo = A.extraDoCatalogo;

  var DEMANDA = ["Consulta pública da demanda escolar", "https://www.educacaorc.com.br/?r=demandaescolar", "Informações disponibilizadas no portal da Educação."];

  var PERGUNTAS = [
    { id: "para_quem", texto: "Para quem você procura?", opcoes: [["filho", "Para o meu filho ou filha"], ["eu", "Para mim"]] },
    { id: "idade", texto: "Qual é a idade da criança?", opcoes: [["0a3", "De 0 a 3 anos"], ["4a5", "4 ou 5 anos"], ["6mais", "6 anos ou mais"]] },
    { id: "situacao", texto: "Em que ponto você está?", opcoes: [["nao_pedi", "Ainda não pedi a vaga"], ["espero", "Já pedi e estou esperando"], ["negada", "Disseram que não há vaga, ou está demorando"]] },
    { id: "celular", texto: "Você consegue usar um aplicativo no celular (o CADU)?", opcoes: [["sim", "Sim"], ["nao", "Não, ou tenho dificuldade"]] },
    { id: "estudo", texto: "O que você quer estudar?", opcoes: [["medio", "Terminar o ensino médio"], ["tecnico", "Um curso técnico ou profissionalizante"], ["faculdade", "Entrar na faculdade"], ["nao_sei", "Ainda não sei"]] }
  ];

  function aplica(p, r) {
    if (p.id === "idade" || p.id === "situacao") return r.para_quem === "filho";
    if (p.id === "celular") return r.para_quem === "filho" && r.situacao === "nao_pedi";
    if (p.id === "estudo") return r.para_quem === "eu";
    return true;
  }
  function depois(r) {
    if (r.para_quem !== "filho") { delete r.idade; delete r.situacao; delete r.celular; }
    if (r.para_quem !== "eu") delete r.estudo;
    if (r.situacao !== "nao_pedi") delete r.celular;
  }

  /* -------------------------------------------------------------- ramificação: vaga para o filho */
  var DOCUMENTOS = "Documentos que costumam ser pedidos: certidão de nascimento ou documento da criança, RG e CPF do responsável, comprovante de residência atualizado, carteira de vacinação e documentos escolares anteriores, se houver. É uma lista para ir preparada, não a lista oficial: a Secretaria informa o que exige em cada caso.";

  function passoPedir(r, achar) {
    var sec = contato(achar, "man-secretaria-educacao", "Secretaria Municipal da Educação");
    var regra = r.idade === "0a3"
      ? " Para crianças de 0 a 3 anos a vaga em creche é um direito, mas a matrícula não é obrigatória e depende de vagas."
      : r.idade === "4a5" ? " Dos 4 aos 17 anos a matrícula é obrigatória: a família tem o dever de matricular e o Estado, de oferecer a vaga." : "";
    if (r.idade === "6mais") {
      return {
        id: "pedir", titulo: "Descubra qual escola atende o seu bairro e peça a vaga",
        porque: "O ensino fundamental é atendido por escolas do município e do estado. A Secretaria Municipal da Educação diz qual escola e qual rede atendem o seu bairro. Para a escola municipal, o pedido é pelo aplicativo CADU. Estar cadastrada não garante a vaga." + regra,
        acao: interno("#educacao/educacao-filhos", "Ver o passo a passo da matrícula"),
        leve: [DOCUMENTOS],
        pergunte: ["Qual escola e qual rede (municipal ou estadual) atendem o seu endereço.", "Em que período o pedido está aberto: as datas mudam a cada ano."],
        contato: sec,
        alternativa: "Escola estadual: procure a própria escola ou a Secretaria Estadual da Educação. Escola particular: procure a secretaria da própria escola."
      };
    }
    if (r.celular === "nao") {
      return {
        id: "pedir", titulo: "Peça a vaga pessoalmente na Secretaria Municipal da Educação",
        porque: "O pedido da rede municipal é feito pelo aplicativo CADU, mas quem não tem celular ou internet, ou tem dificuldade, pode procurar a Secretaria pessoalmente e pedir ajuda para fazer o pedido. Estar cadastrada não garante a vaga." + regra,
        acao: interno("#educacao", "Ver endereço e telefones da Secretaria"),
        leve: [DOCUMENTOS],
        pergunte: ["Onde faço o pedido e em que período ele está aberto: as datas mudam a cada ano.", "Qual escola atende o meu endereço e como acompanho o pedido. Peça tudo por escrito ou anote o nome de quem atendeu."],
        contato: sec,
        alternativa: "O CRAS também pode orientar quem não consegue fazer o cadastro sozinha."
      };
    }
    return {
      id: "pedir", titulo: "Peça a vaga pelo aplicativo CADU",
      porque: "Em publicação oficial de 17 de outubro de 2025, a Prefeitura informou que as matrículas da rede municipal (creche, pré-escola e ensino fundamental) são 100% digitais, pelo aplicativo CADU. Estar cadastrada não garante a vaga: o que vale é o pedido feito ao órgão responsável." + regra,
      acao: interno("#educacao/educacao-filhos", "Ver o passo a passo do CADU"),
      leve: [DOCUMENTOS],
      pergunte: ["Se o procedimento do CADU é o mesmo deste ano: a informação oficial que o site tem é de 2025.", "Qual escola atende o meu endereço e como acompanho o pedido. Peça tudo por escrito ou anote o nome de quem atendeu."],
      contato: sec,
      alternativa: "Se o aplicativo não funcionar, vá pessoalmente à Secretaria Municipal da Educação e peça ajuda para fazer o pedido. O CRAS também pode orientar."
    };
  }

  function passoAcompanhar(achar) {
    return {
      id: "acompanhar", titulo: "Acompanhe o pedido e pergunte sobre a fila",
      porque: "Inscrição não é vaga: são etapas diferentes (inscrição ou cadastro, pedido de vaga, convocação e matrícula efetivada). Ter protocolo ou cadastro não significa que a criança já tem a vaga. Pergunte em que etapa o seu pedido está.",
      acao: externo(DEMANDA, "Ver a consulta pública da demanda escolar"),
      pergunte: ["Como funciona a lista de espera, em que posição está o pedido e se há outras escolas próximas com vaga. Peça a resposta por escrito.", "Guarde o protocolo ou o nome de quem atendeu."],
      contato: contato(achar, "man-secretaria-educacao", "Secretaria Municipal da Educação"),
      alternativa: "Se o pedido demorar ou a vaga for negada, o próximo passo mostra a quem pedir ajuda."
    };
  }

  function passoRegistro(achar) {
    return {
      id: "registro", titulo: "Peça o registro de que não há vaga",
      porque: "Se disserem que não há vaga, pergunte se podem dar um documento ou protocolo que registre a falta de vaga e a posição do seu pedido na lista de espera. Não deixe de concluir o pedido no CADU só porque não há vaga: pergunte à Secretaria se o cadastro e o protocolo colocam o seu filho na lista de espera.",
      acao: interno("#educacao/educacao-filhos", "Ver o que fazer se a vaga for negada"),
      leve: ["Protocolo, nomes de quem atendeu, datas e respostas por escrito: ajudam em qualquer pedido de ajuda."],
      pergunte: ["Em que posição está o pedido na lista de espera.", "Se há outras escolas próximas com vaga."],
      contato: contato(achar, "man-secretaria-educacao", "Secretaria Municipal da Educação"),
      alternativa: "Se a Secretaria não registrar nem responder, siga para o próximo passo: pedir ajuda."
    };
  }

  function passoAjuda(achar) {
    return {
      id: "ajuda", titulo: "Peça ajuda se a vaga for negada ou demorar",
      porque: "O acesso à escola pública e gratuita, próxima da residência, é um direito da criança e do adolescente. Se o pedido for recusado sem explicação ou demorar demais, a família pode pedir ajuda.",
      acao: interno("#assistencia", "Ver o Conselho Tutelar"),
      pergunte: [
        "Conselho Tutelar: recebe casos de direitos de crianças e adolescentes.",
        "Defensoria Pública: orienta e pode atuar, sem custo para quem não pode pagar, para garantir o direito à vaga.",
        "Se o Conselho Tutelar e a Secretaria não resolverem: Promotoria da Infância e Juventude (Ministério Público). Confirme o endereço e a forma de atendimento antes de ir."
      ],
      extras: [extraDoCatalogo(achar, "man-defensoria-nudem", "Orientação jurídica para quem não pode pagar advogado.")].filter(Boolean),
      alternativa: "Outras possibilidades, se for possível: escolas da rede SESI (ingresso por sorteio e processo seletivo, segundo notícia de 24/09/2026) e escolas particulares."
    };
  }

  /* -------------------------------------------------------------- ramificação: estudar */
  function passosEstudo(r, achar) {
    var p = [];
    if (r.estudo === "medio") {
      p.push({
        id: "medio", titulo: "Termine o ensino médio na EJA",
        porque: "Muitas vagas e cursos pedem o ensino médio completo. O SESI-SP oferece a EJA gratuita para quem não concluiu: a página informa idade mínima de 18 anos para o ensino médio e a turma de 2026.",
        acao: interno("#educacao/educacao-voce", "Ver a EJA e os cursos"),
        leve: ["Para o ensino médio na EJA, a idade mínima é 18 anos."],
        pergunte: ["Se há turma para este ano na unidade, quais documentos levar e até quando vai a matrícula: a informação da página é da turma de 2026."],
        extras: [extraDoCatalogo(achar, "man-sesi-eja", "Página da Nova EJA e da EJA Profissionalizante.")].filter(Boolean),
        contato: contato(achar, "man-sesi-rio-claro", "SESI Rio Claro"),
        alternativa: "Se o SESI não tiver turma agora, pergunte na Secretaria Municipal da Educação sobre outras opções de EJA."
      });
    } else if (r.estudo === "tecnico") {
      p.push({
        id: "tecnico", titulo: "Veja cursos gratuitos e técnicos",
        porque: "O Centro de Qualificação Profissional (Fundo Social) oferece cursos gratuitos de qualificação, e o SENAI e a Etec têm cursos técnicos. As páginas oficiais não mostram turmas abertas: é preciso confirmar.",
        acao: interno("#educacao/educacao-voce", "Ver cursos em Rio Claro"),
        pergunte: ["Requisitos, duração, horário, custo e se há bolsa ou gratuidade.", "Se há turma aberta e prazo de inscrição: a página de uma unidade não garante vaga."],
        extras: [extraDoCatalogo(achar, "man-etec-rio-claro", "Cursos técnicos e ensino médio técnico da Etec."),
          extraDoCatalogo(achar, "man-senai-rio-claro", "Cursos livres, Aprendiz e técnicos: confirme custo, turmas e inscrições.")].filter(Boolean),
        contato: contato(achar, "man-cqp-rio-claro", "Centro de Qualificação Profissional (Fundo Social)"),
        alternativa: "Se um curso não tiver turma, tente outra instituição da lista."
      });
    } else if (r.estudo === "faculdade") {
      var m = achar && achar("man-metamorfose");
      var insta = m && m.instagram ? ["Instagram do Cursinho Metamorfose", "https://www.instagram.com/" + String(m.instagram).replace(/^@/, "") + "/", "Perguntar se há vaga."] : null;
      p.push({
        id: "cursinho", titulo: "Prepare-se para o vestibular e o ENEM",
        porque: "O Cursinho Popular Metamorfose, da Unesp Rio Claro, é gratuito e aberto a todos, com simulados do ENEM. A página oficial não informa horário, turmas nem período de inscrição: o contato é pelo Instagram. Não há como saber daqui se há vaga agora.",
        acao: insta ? externo(insta, "Perguntar no Instagram do cursinho") : interno("#educacao/educacao-voce", "Ver o cursinho"),
        pergunte: ["Se há turma aberta, horário e período de inscrição.", "Quais documentos e critérios de prioridade são pedidos."],
        alternativa: "Se não houver vaga agora, pergunte quando abre a próxima turma."
      });
      p.push({
        id: "graduacao", titulo: "Conheça opções de graduação",
        porque: "Algumas opções em Rio Claro: licenciaturas gratuitas da Faculdade SESI e cursos superiores de tecnologia da Fatec. O ENEM abre vagas em universidades por programas como SISU e ProUni.",
        acao: interno("#educacao/educacao-voce", "Ver faculdades e cursos"),
        pergunte: ["Forma de ingresso, vagas, custo e prazo de inscrição: as páginas não trazem tudo."],
        extras: [extraDoCatalogo(achar, "man-faculdade-sesi", "Licenciaturas gratuitas: confirme o vestibular e as vagas."),
          extraDoCatalogo(achar, "man-fatec-ia", "Curso superior de tecnologia em Inteligência Artificial: turno, vagas e ingresso não constam na página."),
          extraDoCatalogo(achar, "man-fatec-esg", "Curso superior de tecnologia em Gestão da Sustentabilidade: turno, vagas e ingresso não constam na página.")].filter(Boolean),
        alternativa: "Se uma opção não servir, compare as outras da lista na área Educação."
      });
    } else {
      p.push({
        id: "opcoes", titulo: "Conheça as opções antes de escolher",
        porque: "Quem ainda não sabe o que quer pode comparar cursos, EJA e faculdades, sem pressa.",
        acao: interno("#educacao/educacao-voce", "Ver cursos e estudos em Rio Claro"),
        pergunte: ["Anote o que combina com o seu tempo e os seus interesses."],
        alternativa: "Se continuar em dúvida, o PAT e o CRAS orientam pessoalmente."
      });
    }
    return p;
  }

  /* -------------------------------------------------------------- plano */
  function montarPlano(respostas, achar) {
    var r = J.de("educacao").limpar(respostas);
    var passos = [];
    function completa(p) { p.leve = p.leve || []; p.pergunte = p.pergunte || []; p.extras = p.extras || []; p.contato = p.contato || null; passos.push(p); }
    var apoio, avisos;
    if (r.para_quem === "eu") {
      passosEstudo(r, achar).forEach(completa);
      apoio = { texto: "Se você também procura trabalho, monte um plano na área Trabalho.", rotulo: "Ver o plano de Trabalho", alvo: "#trabalho" };
      avisos = ["Este plano são sugestões de por onde começar. Ele não garante vaga, bolsa nem aprovação. Confirme sempre turmas, inscrições, custos e datas com a própria instituição."];
    } else if (r.para_quem === "filho") {
      if (r.situacao === "negada") { completa(passoRegistro(achar)); completa(passoAjuda(achar)); completa(passoAcompanhar(achar)); }
      else if (r.situacao === "espero") { completa(passoAcompanhar(achar)); completa(passoAjuda(achar)); }
      else { completa(passoPedir(r, achar)); completa(passoAcompanhar(achar)); completa(passoAjuda(achar)); }
      apoio = { texto: "Se você cria o seu filho sozinha ou precisa saber que documentos valem no seu caso, veja as perguntas que vale a pena fazer.", rotulo: "Ver o passo a passo na área Educação", alvo: "#educacao/educacao-filhos" };
      avisos = ["Este plano são sugestões de por onde começar. Ele não garante vaga e não diz se o seu filho tem prioridade: quem avalia é a Secretaria. Datas e documentos mudam a cada ano: confirme na Secretaria Municipal da Educação."];
    } else {
      apoio = null; avisos = ["Escolha para quem você procura e tente de novo."];
    }
    avisos.push("Se você está com medo de alguém ou em risco, use o botão “Em perigo agora?” ou abra a área Direitos antes de qualquer outro passo.");
    passos.forEach(function (p, i) { p.numero = i + 1; });
    return { respostas: r, passos: passos, primeiros: J.PRIMEIROS, apoio: apoio, avisos: avisos };
  }

  J.registrar({ id: "educacao", titulo: "Monte seu plano de estudos e vagas", tituloImpressao: "Meu plano — Educação", primeiraDecideCaminho: true, PERGUNTAS: PERGUNTAS, aplica: aplica, depois: depois, montarPlano: montarPlano });

  return { PERGUNTAS: PERGUNTAS, montarPlano: montarPlano };
});
