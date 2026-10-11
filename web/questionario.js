/* Questionário do Observatório da Mulher Rio-Clarense.
   Dois objetivos: (1) devolver a quem responde uma orientação com caminhos e serviços reais; (2) produzir dados SEM IDENTIFICAÇÃO
   para a Secretaria Municipal da Mulher conhecer as mulheres de Rio Claro. Lógica pura (sem DOM, sem rede, sem armazenamento).

   Regras que este módulo cumpre e os testes conferem:
   - não pede nome, CPF, telefone nem endereço. Só alternativas, mais UM espaço opcional "Fale de você" cujo TEXTO nunca é enviado:
     o aparelho identifica os assuntos e, com autorização, só os assuntos (sem violência) acompanham o registro;
   - pergunta em branco NÃO conta como "sem necessidade": fica fora da pontuação;
   - não existe pontuação de risco de violência, de saúde mental nem de capacidade de cuidar: proteção só aparece quando a PRÓPRIA
     mulher a marca como prioridade;
   - a pontuação organiza prioridades. Não é escala validada, não é diagnóstico e não decide direitos;
   - menores de 18 anos nunca geram registro para envio. */
(function (raiz, fabrica) {
  if (typeof module === "object" && module.exports) module.exports = fabrica();
  else raiz.Questionario = fabrica();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  /* Cada opção: c = código (é o que vai para os dados), r = rótulo, x = exclusiva (desmarca as outras), p = pontos (quando a
     pergunta pontua; ausente = não pontua esta opção, fica fora do cálculo). */
  function o(c, r, extra) { var x = { c: c, r: r }; if (extra) for (var k in extra) x[k] = extra[k]; return x; }

  var PERGUNTAS = [
    { id: "idade", bloco: "Sobre você", texto: "Qual é a sua faixa de idade?", tipo: "unica", opcoes: [
      o("m18", "Menos de 18 anos"), o("18_24", "18 a 24 anos"), o("25_34", "25 a 34 anos"), o("35_44", "35 a 44 anos"),
      o("45_59", "45 a 59 anos"), o("60_mais", "60 anos ou mais"), o("nd", "Prefiro não informar")] },
    { id: "regiao", bloco: "Sobre você", texto: "Perto de onde você mora, em Rio Claro?", ajuda: "Escolha o ponto de referência mais próximo. Não precisa saber o nome do bairro.", tipo: "unica", opcoes: [
      o("cvz", "Perto do CVZ (Cervezão)"), o("mae_preta", "Perto da Mãe Preta"), o("bom_sucesso", "Perto do Bom Sucesso"),
      o("centro", "Região central"), o("outro", "Outro bairro ou região"), o("rural", "Área rural"),
      o("nao_sei", "Não sei identificar"), o("nd", "Prefiro não informar")] },
    { id: "grupos", bloco: "Sobre você", texto: "Alguma destas frases combina com a sua vida?", ajuda: "Marque todas que quiser.", tipo: "multi", max: 7, opcoes: [
      o("deficiencia", "Sou mulher com deficiência"), o("sustento", "Sou responsável pelo sustento da família"),
      o("cuida_crianca", "Cuido de criança ou adolescente"), o("cuida_idoso", "Cuido de pessoa idosa ou dependente"),
      o("idosa", "Sou idosa"), o("nenhuma", "Nenhuma dessas", { x: true }), o("nd", "Prefiro não informar", { x: true })] },

    { id: "trabalho", bloco: "Trabalho e renda", texto: "Qual frase descreve melhor a sua vida de trabalho hoje?", tipo: "unica", max_pontos: 3, opcoes: [
      o("formal", "Tenho emprego com carteira assinada", { p: 0 }), o("conta_propria", "Trabalho por conta própria ou tenho meu negócio", { p: 1 }),
      o("informal", "Faço trabalhos informais ou temporários", { p: 2 }), o("procurando", "Estou procurando emprego", { p: 3 }),
      o("quer_comecar", "Quero começar a trabalhar, mas ainda não consigo", { p: 3 }), o("estudando", "Estou estudando ou me qualificando", { p: 1 }),
      o("nao_procura", "Não estou procurando trabalho agora"), o("nd", "Prefiro não informar")] },
    { id: "obstaculos_trabalho", bloco: "Trabalho e renda", texto: "O que mais dificulta conseguir ou manter um trabalho?", ajuda: "Marque até 3.", tipo: "multi", max: 3, max_pontos: 3, pontua_por_quantidade: true, opcoes: [
      o("vagas", "Falta de vagas"), o("experiencia", "Falta de experiência"), o("qualificacao", "Falta de curso ou qualificação"),
      o("creche", "Falta de creche ou de alguém para cuidar dos filhos"), o("horarios", "Horários que não combinam com a minha rotina"),
      o("transporte", "Dificuldade de transporte"), o("internet", "Falta de internet ou de aparelho"),
      o("cuidar_familiar", "Preciso cuidar de um familiar"), o("acessibilidade", "Falta de acessibilidade"),
      o("nenhum", "Nada disso me atrapalha", { x: true, zero: true }), o("nao_se_aplica", "Não se aplica", { x: true, fora: true })] },
    { id: "apoio_renda", bloco: "Trabalho e renda", texto: "Qual apoio seria mais útil para melhorar a sua renda?", tipo: "unica", opcoes: [
      o("emprego", "Encaminhamento para vagas de emprego"), o("curso", "Curso profissionalizante"),
      o("curriculo", "Ajuda para fazer o currículo e procurar vagas"), o("negocio", "Apoio para abrir ou melhorar um pequeno negócio"),
      o("direitos_trab", "Orientação sobre direitos trabalhistas"), o("credito", "Crédito ou orientação financeira"),
      o("conciliar", "Conciliar trabalho e cuidados com a família"), o("nao_preciso", "Não preciso disso agora")] },

    { id: "estudar", bloco: "Estudo", texto: "Você gostaria de estudar ou fazer um curso nos próximos 12 meses?", tipo: "unica", max_pontos: 2, opcoes: [
      o("concluir", "Sim, concluir ou retomar os estudos", { p: 2 }), o("profissionalizante", "Sim, um curso profissionalizante", { p: 2 }),
      o("superior_tecnico", "Sim, curso técnico ou superior", { p: 2 }), o("digital", "Sim, aprender informática", { p: 2 }),
      o("empreender", "Sim, curso para empreender", { p: 2 }), o("nao", "Não neste momento", { p: 0 })] },
    { id: "obstaculos_estudo", bloco: "Estudo", texto: "O que mais impede você de estudar ou fazer um curso?", ajuda: "Marque até 3.", tipo: "multi", max: 3, max_pontos: 3, pontua_por_quantidade: true, opcoes: [
      o("sem_curso", "Não encontro curso adequado"), o("dinheiro", "Não tenho dinheiro para os custos"), o("horarios", "Os horários não combinam"),
      o("sem_cuidado", "Não tenho com quem deixar os filhos"), o("chegar", "Não consigo chegar ao local"),
      o("precisa_trabalhar", "Preciso trabalhar ou cuidar da família"), o("digital", "Dificuldade com internet ou acessibilidade"),
      o("nao_sabe_onde", "Não sei onde procurar"), o("nada", "Nada me impede hoje", { x: true, zero: true }), o("nao_se_aplica", "Não se aplica", { x: true, fora: true })] },

    { id: "cuidado", bloco: "Cuidado com a família", texto: "Você cuida todo dia de crianças, adolescentes, idosos ou pessoas dependentes?", tipo: "unica", max_pontos: 2, opcoes: [
      o("ate3", "Sim, de criança de até 3 anos", { p: 1 }), o("4_5", "Sim, de criança de 4 a 5 anos", { p: 1 }),
      o("escolar", "Sim, de criança ou adolescente em idade escolar", { p: 1 }), o("idoso", "Sim, de pessoa idosa ou dependente", { p: 1 }),
      o("mais_de_um", "Sim, de mais de um desses grupos", { p: 2 }), o("nenhum", "Não tenho essa responsabilidade", { p: 0 }), o("nd", "Prefiro não informar")] },
    { id: "cuidado_rotina", bloco: "Cuidado com a família", texto: "Esse cuidado dificulta a sua rotina?", tipo: "unica", max_pontos: 3, opcoes: [
      o("nao_dificulta", "Não dificulta", { p: 0 }), o("pouco", "Dificulta um pouco", { p: 1 }), o("bastante", "Dificulta bastante", { p: 2 }),
      o("impede_trabalho_estudo", "Impede que eu trabalhe ou estude", { p: 3 }), o("impede_atendimento", "Impede que eu procure atendimento ou resolva outras coisas", { p: 3 }),
      o("nao_se_aplica", "Não se aplica")] },
    { id: "apoio_cuidado", bloco: "Cuidado com a família", texto: "Qual apoio faria mais diferença para você e sua família?", tipo: "unica", opcoes: [
      o("creche_info", "Informações sobre creche e educação infantil"), o("matricula", "Matrícula e vagas na escola"),
      o("contraturno", "Atividades no contraturno da escola"), o("assistencia", "Orientação sobre assistência social"),
      o("conciliar", "Conciliar trabalho, estudo e cuidados"), o("idosos", "Serviços para idosos ou pessoas dependentes"),
      o("nao_preciso", "Não preciso disso agora")] },

    { id: "deslocamento", bloco: "Transporte", texto: "Como você costuma se deslocar para trabalhar, estudar ou ir a um atendimento?", tipo: "unica", max_pontos: 3, opcoes: [
      o("pe", "A pé", { p: 0 }), o("bicicleta", "De bicicleta", { p: 0 }), o("onibus", "De ônibus", { p: 0 }), o("carro", "De carro ou moto meus", { p: 0 }),
      o("carona", "Dependo de carona ou de outra pessoa", { p: 1 }), o("nao_consigo", "Não consigo me deslocar quando preciso", { p: 3 }), o("outra", "Outra forma")] },
    { id: "transporte_freq", bloco: "Transporte", texto: "Com que frequência o transporte ou a distância impedem você de fazer algo importante?", tipo: "unica", max_pontos: 4, opcoes: [
      o("nunca", "Nunca", { p: 0 }), o("raramente", "Raramente", { p: 1 }), o("as_vezes", "Às vezes", { p: 2 }),
      o("frequentemente", "Frequentemente", { p: 3 }), o("quase_sempre", "Quase sempre", { p: 4 })] },

    { id: "informacao", bloco: "Informação e apoio", texto: "Você consegue achar informação sobre os serviços públicos de que precisa?", tipo: "unica", max_pontos: 3, opcoes: [
      o("facil", "Sim, com facilidade", { p: 0 }), o("entender", "Acho, mas tenho dificuldade para entender", { p: 1 }),
      o("onde_procurar", "Tenho dificuldade para saber onde procurar", { p: 2 }), o("atendimento", "Tenho dificuldade para conseguir atendimento", { p: 2 }),
      o("nao_sei_quais", "Não sei quais serviços existem", { p: 3 }), o("nao_precisei", "Não precisei de serviços recentemente")] },
    { id: "areas_info", bloco: "Informação e apoio", texto: "Sobre quais assuntos você gostaria de receber orientação?", ajuda: "Marque todos que quiser.", tipo: "multi", max: 12, opcoes: [
      o("saude_mulher", "Saúde da mulher"), o("saude_mental", "Saúde mental e apoio emocional"), o("assistencia", "Assistência social e benefícios"),
      o("moradia", "Moradia"), o("direitos", "Direitos das mulheres"), o("juridica", "Orientação jurídica"),
      o("protecao", "Proteção e enfrentamento à violência"), o("trabalho", "Trabalho e renda"), o("educacao", "Educação e cursos"),
      o("creches", "Creche e serviços para os filhos"), o("cultura", "Cultura, esporte e lazer"), o("nenhuma", "Nenhum, por enquanto", { x: true })] },
    { id: "sabe_procurar", bloco: "Informação e apoio", texto: "Se precisar de ajuda para um problema importante, você sabe onde procurar?", tipo: "unica", max_pontos: 3, opcoes: [
      o("sei", "Sei exatamente onde procurar", { p: 0 }), o("ideia", "Tenho uma ideia, mas preciso de orientação", { p: 1 }),
      o("nao_sei", "Não sei onde procurar", { p: 2 }), o("ja_procurei", "Já procurei ajuda e não consegui resolver", { p: 3 }), o("nd", "Prefiro não informar")] },

    { id: "prioridade_area", bloco: "O que importa para você", texto: "Se a Prefeitura pudesse ajudar primeiro em uma área, qual deveria ser?", tipo: "unica", opcoes: [
      o("emprego", "Emprego e renda"), o("educacao", "Cursos e educação"), o("creche", "Creche e apoio ao cuidado dos filhos"), o("saude", "Saúde"),
      o("assistencia_moradia", "Assistência social e moradia"), o("direitos_protecao", "Direitos e proteção"), o("transporte", "Transporte"),
      o("apoio_emocional", "Apoio emocional e convivência"), o("outra", "Outra área")] },
    { id: "resultado_6m", bloco: "O que importa para você", texto: "O que faria mais diferença na sua vida nos próximos seis meses?", tipo: "unica", opcoes: [
      o("trabalho_renda", "Conseguir trabalho ou aumentar a renda"), o("curso", "Começar ou terminar um curso"),
      o("creche_servico", "Conseguir creche ou outro serviço para os filhos"), o("saude_assistencia", "Conseguir atendimento de saúde ou assistência"),
      o("transporte", "Resolver a dificuldade de transporte"), o("direitos_servico", "Conhecer meus direitos e chegar a um serviço"),
      o("seguranca", "Ter mais segurança e apoio especializado"), o("autonomia", "Ter mais autonomia para organizar minha vida"), o("outro", "Outra coisa")] },

    { id: "fale_de_voce", bloco: "Fale de você", texto: "Quer falar um pouco de você? (opcional)", tipo: "texto", max_chars: 500,
      ajuda: "Escreva do seu jeito: o que está difícil, o que você sonha, o que falta na cidade para as mulheres. Se preferir, pule.", opcoes: [] },
    { id: "autoriza", bloco: "Para terminar", texto: "Você autoriza usar as suas respostas, SEM o seu nome e SEM o seu texto, para a Secretaria da Mulher conhecer as mulheres de Rio Claro?", ajuda: "Você recebe a sua orientação de qualquer jeito. Esta pergunta só decide se as respostas poderão ajudar a Secretaria.", tipo: "unica", opcoes: [
      o("sim", "Sim, autorizo"), o("nao", "Não autorizo")] }
  ];

  var POR_ID = {};
  PERGUNTAS.forEach(function (p) { POR_ID[p.id] = p; });

  var CUIDA = ["ate3", "4_5", "escolar", "idoso", "mais_de_um"];

  /* Pergunta só aparece quando faz diferença. */
  function aplica(p, r) {
    if (p.id === "obstaculos_estudo") return !!r.estudar && r.estudar !== "nao";
    if (p.id === "cuidado_rotina" || p.id === "apoio_cuidado") return CUIDA.indexOf(r.cuidado) !== -1;
    if (p.id === "autoriza") return r.idade !== "m18";
    return true;
  }

  /* Aceita só códigos previstos. Respostas múltiplas: sem repetição, no máximo `max`, e opção exclusiva desmarca as outras. */
  function limpar(resp) {
    var r = {};
    PERGUNTAS.forEach(function (p) {
      var v = resp && resp[p.id];
      var validos = p.opcoes.map(function (x) { return x.c; });
      if (p.tipo === "texto") {
        var t = typeof v === "string" ? v.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim().slice(0, p.max_chars) : "";
        if (t) r[p.id] = t;
      } else if (p.tipo === "unica") {
        if (typeof v === "string" && validos.indexOf(v) !== -1) r[p.id] = v;
      } else if (Array.isArray(v)) {
        var lista = v.filter(function (c, i) { return validos.indexOf(c) !== -1 && v.indexOf(c) === i; });
        var excl = lista.filter(function (c) { return p.opcoes.some(function (x) { return x.c === c && x.x; }); });
        if (excl.length) lista = [excl[excl.length - 1]];
        if (lista.length > p.max) lista = lista.slice(0, p.max);
        if (lista.length) r[p.id] = lista;
      }
    });
    /* respostas de perguntas que não se aplicam saem: não podem sobrar dados de um caminho que a pessoa não seguiu */
    PERGUNTAS.forEach(function (p) { if (!aplica(p, r)) delete r[p.id]; });
    return r;
  }

  function aplicaveis(resp) {
    var r = limpar(resp);
    return PERGUNTAS.filter(function (p) { return aplica(p, r); });
  }

  /* Próxima pergunta sem resposta e não pulada; null quando acabou. */
  function proxima(resp, puladas) {
    var r = limpar(resp), lista = aplicaveis(r), pul = puladas || [];
    for (var i = 0; i < lista.length; i++) {
      if (r[lista[i].id] === undefined && pul.indexOf(lista[i].id) === -1) return { pergunta: lista[i], numero: i + 1, total: lista.length };
    }
    return null;
  }

  function rotulo(qid, codigo) {
    var p = POR_ID[qid];
    if (!p) return "";
    for (var i = 0; i < p.opcoes.length; i++) if (p.opcoes[i].c === codigo) return p.opcoes[i].r;
    return "";
  }

  /* ------------------------------------------------------------ pontuação por dimensão (0 a 100) */
  var DIMENSOES = [
    { id: "economica", nome: "Trabalho e renda", itens: ["trabalho", "obstaculos_trabalho"],
      indica: "Quanto o trabalho e a renda pesam hoje: situação de trabalho e obstáculos para conseguir ou manter um trabalho." },
    { id: "educacao", nome: "Estudo e cursos", itens: ["estudar", "obstaculos_estudo"],
      indica: "Vontade de estudar e obstáculos para conseguir." },
    { id: "cuidados", nome: "Cuidado com a família", itens: ["cuidado", "cuidado_rotina"],
      indica: "Quanto as responsabilidades de cuidado pesam na rotina." },
    { id: "mobilidade", nome: "Transporte", itens: ["deslocamento", "transporte_freq"],
      indica: "Dificuldade de chegar a serviços, cursos e trabalho." },
    { id: "rede", nome: "Informação e acesso aos serviços", itens: ["informacao", "sabe_procurar"],
      indica: "Quanto falta de informação ou de orientação para chegar aos serviços públicos." }
  ];

  /* Pontos de uma pergunta: { pontos, maximo } ou null quando NÃO entra no cálculo (sem resposta, "prefiro não informar", "não se aplica"). */
  function pontosDe(p, r) {
    var v = r[p.id];
    if (v === undefined || !p.max_pontos) return null;
    if (p.tipo === "unica") {
      var op = p.opcoes.filter(function (x) { return x.c === v; })[0];
      return op && op.p !== undefined ? { pontos: op.p, maximo: p.max_pontos } : null;
    }
    if (p.pontua_por_quantidade) {
      if (v.length === 1) {
        var unico = p.opcoes.filter(function (x) { return x.c === v[0]; })[0];
        if (unico && unico.fora) return null;
        if (unico && unico.zero) return { pontos: 0, maximo: p.max_pontos };
      }
      return { pontos: Math.min(v.length, p.max_pontos), maximo: p.max_pontos };
    }
    return null;
  }

  function pontuar(resp) {
    var r = limpar(resp), saida = {};
    DIMENSOES.forEach(function (d) {
      var soma = 0, max = 0, usadas = 0;
      d.itens.forEach(function (qid) {
        var x = POR_ID[qid] && aplica(POR_ID[qid], r) ? pontosDe(POR_ID[qid], r) : null;
        if (x) { soma += x.pontos; max += x.maximo; usadas++; }
      });
      /* Cuidado: quem diz que não cuida de ninguém não tem sobrecarga (0), e a pergunta de rotina nem é feita. */
      if (d.id === "cuidados" && r.cuidado === "nenhum") { usadas = 1; soma = 0; max = 2; }
      saida[d.id] = { nome: d.nome, indica: d.indica, indice: max ? Math.round(100 * soma / max) : null, respondidas: usadas, total: d.itens.length };
    });
    return saida;
  }

  /* ------------------------------------------------------------ caminhos individuais (até 3) */
  var CAMINHOS = {
    protecao: { titulo: "Proteção contra a violência", href: "#direitos", need: "violencia", urgente: true },
    economica: { titulo: "Trabalho e renda", href: "#trabalho", need: "emprego_curso" },
    educacao: { titulo: "Estudo e cursos", href: "#educacao/educacao-voce", need: "estudo" },
    cuidados: { titulo: "Apoio ao cuidado da família", href: "#educacao/educacao-filhos", need: "filhos" },
    mobilidade: { titulo: "Chegar aos serviços e às oportunidades", href: "#transporte", need: null },
    rede: { titulo: "Saber onde procurar ajuda", href: "#assistencia", need: "familia" },
    saude: { titulo: "Saúde e apoio emocional", href: "#saude", need: "saude" },
    direitos: { titulo: "Direitos e orientação jurídica", href: "#direitos", need: "casamento" },
    assistencia: { titulo: "Assistência social e moradia", href: "#assistencia", need: "familia" }
  };
  var DA_PRIORIDADE_AREA = { emprego: "economica", educacao: "educacao", creche: "cuidados", saude: "saude", assistencia_moradia: "assistencia", direitos_protecao: "protecao", transporte: "mobilidade", apoio_emocional: "saude" };
  var DO_RESULTADO = { trabalho_renda: "economica", curso: "educacao", creche_servico: "cuidados", saude_assistencia: "saude", transporte: "mobilidade", direitos_servico: "direitos", seguranca: "protecao", autonomia: "economica" };
  /* Palavras que ajudam o ranking de serviços a achar o certo (usadas só na busca no catálogo, nunca mostradas nem enviadas). */
  var CONSULTA_APOIO = { emprego: "vagas de emprego", curso: "curso profissionalizante", curriculo: "currículo vagas", negocio: "abrir negócio crédito empreender", direitos_trab: "direitos trabalhistas", credito: "crédito empreender", conciliar: "emprego creche" };
  var CONSULTA_ESTUDO = { concluir: "ensino médio EJA terminar os estudos", profissionalizante: "curso profissionalizante", superior_tecnico: "faculdade curso técnico", digital: "informática curso", empreender: "empreender curso" };
  var CONSULTA_CUIDADO = { creche_info: "creche educação infantil matrícula", matricula: "matrícula vaga escola", assistencia: "assistência social cras", conciliar: "creche matrícula" };

  function lista(qid, r) {
    var v = r[qid];
    if (!v) return [];
    return (Array.isArray(v) ? v : [v]).map(function (c) { return rotulo(qid, c); }).filter(Boolean);
  }

  function porque(id, r) {
    var partes = [];
    if (id === "protecao") return "Você marcou proteção entre as suas prioridades. Esta é uma escolha sua: o questionário não avalia nem adivinha risco.";
    if (id === "economica") {
      if (r.trabalho) partes.push("Você disse: “" + rotulo("trabalho", r.trabalho) + "”.");
      var ob = lista("obstaculos_trabalho", r).filter(function (x) { return !/^Nada|^Não se aplica/.test(x); });
      if (ob.length) partes.push("O que mais dificulta: " + ob.join("; ").toLowerCase() + ".");
    } else if (id === "educacao") {
      partes.push("Você disse que gostaria de estudar: “" + rotulo("estudar", r.estudar) + "”.");
      var oe = lista("obstaculos_estudo", r).filter(function (x) { return !/^Nada|^Não se aplica/.test(x); });
      if (oe.length) partes.push("O que impede: " + oe.join("; ").toLowerCase() + ".");
    } else if (id === "cuidados") {
      if (r.cuidado_rotina) partes.push("Sobre a rotina de cuidado: “" + rotulo("cuidado_rotina", r.cuidado_rotina) + "”.");
      if (r.apoio_cuidado && r.apoio_cuidado !== "nao_preciso") partes.push("Apoio que você escolheu: " + rotulo("apoio_cuidado", r.apoio_cuidado).toLowerCase() + ".");
    } else if (id === "mobilidade") {
      if (r.transporte_freq) partes.push("O transporte ou a distância impedem algo importante: " + rotulo("transporte_freq", r.transporte_freq).toLowerCase() + ".");
    } else if (id === "rede") {
      if (r.informacao) partes.push("Sobre achar informação: “" + rotulo("informacao", r.informacao) + "”.");
      if (r.sabe_procurar) partes.push("Sobre saber onde procurar ajuda: “" + rotulo("sabe_procurar", r.sabe_procurar) + "”.");
    } else if (id === "saude") {
      partes.push("Você indicou saúde ou apoio emocional entre as suas prioridades.");
    } else if (id === "direitos") {
      partes.push("Você indicou conhecer os seus direitos e chegar a um serviço como o que mais faria diferença.");
    } else if (id === "assistencia") {
      partes.push("Você indicou assistência social ou moradia entre as suas prioridades.");
    }
    return partes.join(" ");
  }

  function consultaDe(id, r) {
    if (id === "economica") return CONSULTA_APOIO[r.apoio_renda] || "emprego vagas";
    if (id === "educacao") return CONSULTA_ESTUDO[r.estudar] || "estudar curso";
    if (id === "cuidados") return CONSULTA_CUIDADO[r.apoio_cuidado] || "creche matrícula";
    if (id === "saude") return (r.prioridade_area === "apoio_emocional" || (r.areas_info || []).indexOf("saude_mental") !== -1) ? "psicóloga apoio emocional ansiedade" : "saúde consulta médico";
    if (id === "direitos") return "orientação jurídica defensoria advogada";
    if (id === "protecao") return "violência delegacia da mulher proteção";
    return "";
  }

  /* Até 3 caminhos. Primeiro o que a PRÓPRIA mulher marcou como prioridade (proteção sempre à frente, se marcada); depois as
     dimensões de maior pontuação (a partir de 34, para não sugerir o que quase não pesa). */
  function caminhos(resp) {
    var r = limpar(resp), pts = pontuar(r), fila = [];
    function pôr(id) { if (id && CAMINHOS[id] && fila.indexOf(id) === -1) fila.push(id); }
    var marcouProtecao = r.prioridade_area === "direitos_protecao" || r.resultado_6m === "seguranca" || (r.areas_info || []).indexOf("protecao") !== -1;
    if (marcouProtecao) pôr("protecao");
    pôr(DA_PRIORIDADE_AREA[r.prioridade_area]);
    pôr(DO_RESULTADO[r.resultado_6m]);
    DIMENSOES.map(function (d) { return d.id; })
      .filter(function (id) { return pts[id].indice !== null && pts[id].indice >= 34; })
      .sort(function (a, b) { return pts[b].indice - pts[a].indice; })
      .forEach(pôr);
    return fila.slice(0, 3).map(function (id) {
      var c = CAMINHOS[id];
      return { id: id, titulo: c.titulo, href: c.href, need: c.need, urgente: !!c.urgente, porque: porque(id, r), consulta: consultaDe(id, r) };
    });
  }

  /* Avisa quando o texto parece ter dado que identifica (o texto nunca é enviado, mas ninguém precisa escrever isso). */
  function dadosPessoais(texto) {
    var t = String(texto || ""), a = [];
    if (/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/.test(t)) a.push("um CPF");
    if (/\b\d{1,2}\.?\d{3}\.?\d{3}-?[\dxX]\b/.test(t)) a.push("um RG");
    if (/\(?\b\d{2}\)?\s?9?\d{4}[-\s]?\d{4}\b/.test(t)) a.push("um telefone");
    if (/[^\s@]+@[^\s@]+\.[^\s@]+/.test(t)) a.push("um e-mail");
    if (/\b\d{5}-?\d{3}\b/.test(t)) a.push("um CEP");
    return a;
  }

  /* Assuntos que podem acompanhar o registro. "violencia" fica DE FORA de propósito: não se infere nem se registra violência a
     partir de um texto. A mulher a vê e recebe ajuda na hora, no próprio aparelho, e só isso. */
  var TEMAS_PERMITIDOS = ["casamento", "filhos", "emprego_curso", "saude", "estudo", "moradia", "dividas", "familia"];

  /* ------------------------------------------------------------ o que seria enviado à Secretaria */
  function podeEnviar(resp) {
    var r = limpar(resp);
    return r.autoriza === "sim" && !!r.idade && r.idade !== "m18";
  }

  /* Registro sem identificação: só códigos de alternativas, índices e o MÊS da resposta. Sem texto livre, sem data/hora exata,
     sem identificador, sem IP (o IP depende do servidor: ver docs/questionario_observatorio.md). */
  function registro(resp, mes, extras) {
    var r = limpar(resp);
    if (!podeEnviar(r)) return null;
    var pts = pontuar(r), indices = {}, respostas = {};
    DIMENSOES.forEach(function (d) { indices[d.id] = pts[d.id].indice; });
    Object.keys(r).forEach(function (q) { if (q !== "autoriza" && q !== "fale_de_voce") respostas[q] = r[q]; });
    /* O TEXTO nunca vai no registro. Só os assuntos que o aparelho identificou nele, e só se ela escreveu algo. */
    var temas = [];
    if (r.fale_de_voce && extras && Array.isArray(extras.temas)) {
      temas = extras.temas.filter(function (t, i, a) { return TEMAS_PERMITIDOS.indexOf(t) !== -1 && a.indexOf(t) === i; });
    }
    return { instrumento: "observatorio-questionario", versao: 2, periodo: /^\d{4}-\d{2}$/.test(mes || "") ? mes : null, respostas: respostas, temas_do_texto: temas, indices: indices };
  }

  return {
    PERGUNTAS: PERGUNTAS, DIMENSOES: DIMENSOES, CAMINHOS: CAMINHOS, limpar: limpar, aplicaveis: aplicaveis, proxima: proxima,
    pontuar: pontuar, caminhos: caminhos, podeEnviar: podeEnviar, registro: registro, rotulo: rotulo, dadosPessoais: dadosPessoais, TEMAS_PERMITIDOS: TEMAS_PERMITIDOS
  };
});
