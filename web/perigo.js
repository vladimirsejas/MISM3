/* Camada de SEGURANÇA do MISM3: lê o que a mulher escreveu e diz se há risco, de que tipo, o que mostrar primeiro e quais destinos fixar.
   É determinística de propósito (regras revisáveis, sem modelo e sem busca): em situação de perigo a resposta não pode depender de nota de
   similaridade. Errar para mais custa uma frase a mais na tela; errar para menos pode custar muito mais. Por isso as regras favorecem o alerta.
   Lógica pura (sem DOM, sem rede, sem gravar nada); o texto é lido e descartado no aparelho. */
(function (raiz, fabrica) {
  if (typeof module === "object" && module.exports) module.exports = fabrica(require("./necessidades.js"), require("./ia.js"));
  else raiz.Perigo = fabrica(raiz.MISM3Necessidades, raiz.MISM3IA);
})(typeof self !== "undefined" ? self : this, function (Regras, IA) {
  "use strict";

  /* Cada tipo: gatilhos (sobre o texto sem acento, minúsculo, só letras e números), a mensagem, os telefones e os destinos a fixar.
     "forte" = situação que está acontecendo ou é grave; "contexto" = a pessoa só está perguntando por um serviço de proteção. */
  var PESSOA = "(?:meu marido|meu companheiro|meu namorado|meu ex(?: marido| companheiro| namorado)?|meu pai|meu padrasto|meu patrao|ele|ela)";
  var TIPOS = {
    suicidio: {
      forte: [
        "(?:quero|vou|penso em|pensando em|tenho vontade de|vontade de|ideia de|desejo de)(?: me)? (?:matar|morrer)(?! de )",
        "(?:quero|vou|penso em|pensando em|vontade de) (?:acabar com (?:tudo|minha vida|isso)|tirar a minha vida|tirar minha vida|sumir(?! (?:com|de|da|do|a|o|as|os)\\b)|desaparecer(?! (?:com|de|da|do)\\b))",
        "suicid\\w*", "nao quero mais viver", "nao aguento mais viver", "cansei de viver", "melhor sem mim", "estariam melhor sem mim",
        "me machucar", "me cortar", "me ferir", "automutilacao",
        "(?:pensei|penso|pensando|quero|vou|vontade|ideia|tentei|tentar) (?:em |de )?(?:tomar|engolir|beber) (?:todos os |todas as |muitos |muitas |a cartela de |um monte de |tudo de )?(?:remedios?|comprimidos?|pilulas?|veneno)",
        "(?:pensei|penso|pensando|quero|vou|vontade|ideia|tentei|tentar) (?:em |de )?(?:me )?(?:enforcar|enforco|afogar|envenenar|atirar|jogar (?:d[aoe]|na|no) \\w+|jogar na frente|pular (?:d[aoe]|na|no) \\w+|cortar os pulsos|me jogar)",
        "(?:vou|quero) me (?:enforcar|jogar|atirar|envenenar|afogar)",
        "(?:queria|quero|gostaria de|preferia|desejo) (?:dormir|adormecer) e nao (?:acordar|acordar mais|ver mais nada)", "nao quero (?:mais )?(?:acordar|estar aqui|existir|estar viva|ficar aqui|continuar)", "queria (?:nao ter nascido|desaparecer|nao existir|estar morta|ter morrido)",
        "(?:minha )?vida nao tem (?:mais )?(?:sentido|valor|jeito|saida)", "nao vejo (?:mais )?(?:saida|solucao|sentido|futuro)", "nao tem mais jeito pra mim", "(?:seria|era|e) melhor (?:se eu )?(?:morresse|nao existisse|nao estivesse aqui|desaparecesse)", "ninguem sentiria minha falta", "nao tenho mais motivo pra viver", "(?:escrevi|deixei|fiz|preparei|escrever) (?:uma )?(?:carta|bilhete|mensagem) de despedida", "ja escrevi minha despedida", "(?:filhos|familia|todos|todo mundo|mundo) (?:ficariam|estariam|ficaria|estaria) melhor sem (?:a mae|mim|eu)", "nao tenho motivo pra (?:viver|continuar)", "quero sumir(?! (?:com|de|da|do|a|o|as|os)\\b)", "acabar com a minha vida"
      ],
      aviso: "Se você pensa em se machucar, ligue para o 188 (CVV, conversa de apoio, 24 horas, gratuito) ou para o 192 (SAMU).",
      mensagem: "Sinto muito que você esteja se sentindo assim. Você não está sozinha. Se pensa em se machucar, ligue agora para o 188 (CVV, conversa de apoio, 24 horas, gratuito) ou para o 192 (SAMU).",
      telefones: ["188", "192"],
      pins: [{ id: "man-saude-caps-iii" }, { id: "man-saude-upa-estadio" }]
    },
    crianca: {
      forte: [
        "(?:meu pai|padrasto|meu tio|meu avo|vizinho|professor|meu marido|meu companheiro|ele|ele mesmo|a mae dela|a mae dele)(?: me)? (?:abusa|abusou|abusando|mexe|bolina|estupra|estuprou|bate|machuca|maltrata|espanca)(?: n[ao]?| d[ao]?)?(?: minha| meu| a| o| uma| um)? ?(?:filha|filho|crianca|menina|menino|neta|neto|sobrinha|sobrinho|enteada|enteado)",
        "(?:bate|bateu|batendo|machuca|machucou|maltrata|maltratou|espanca|espancou|agride|agrediu) (?:(?:n[ao]s?|em|a[so]?) )?(?:minhas? |meus? |suas? |seus? |nossos |nossas |as |os )?(?:criancas?|filh[oa]s?|menin[oa]s?|bebes?|netos?|netas?)",
        "abus(?:a|ou|ando|o) (?:d[ao]|de) (?:minha|meu|uma|um) (?:filha|filho|crianca|menina|menino|neta|neto)",
        "(?:padrasto|pai|tio|avo|vizinho|professor|primo|irmao|marido|namorado|ele|tio dela|tio dele|colega) (?:mexe|mexeu|mexendo|passa|passou|passando|toca|tocou|encosta|encostou|bolina|bolinou|obriga|forca|forcou|beija|beijou|se esfrega|mostra)(?: a mao| as maos)? (?:com |em |n[ao]s? |nela|nele|a |o )?(?:(?:minha|meu|a|o|uma|um) ){0,2}(?:filha|filho|crianca|menina|menino|neta|neto|sobrinha|sobrinho|enteada|enteado|nela|nele)",
        "passa(?:ndo|ou)? a mao (?:nela|nele|na (?:menina|crianca|filha|neta|sobrinha)|no (?:menino|filho|neto|sobrinho))", "(?:neta|filha|filho|crianca|menina|menino|sobrinha|sobrinho)(?: de \\d+ anos)? (?:me )?(?:contou|disse|falou|confessou) que (?:o |a |meu |minha )?(?:\\w+ ){0,3}(?:mexe|mexeu|passa|passou|tocou|abusa|abusou|bolina|obriga|machuca|bate)",
        "(?:crianca|menina|menino|filh[oa]|neto|neta|bebe|sobrinh[oa])s?(?: [a-z]+){0,5} (?:apanh(?:a|am|ando|ou)(?! (?:do|da|dos|das) (?:adversari\\w*|time|equipe|oponent\\w*|rival|jogo|campeonato|volei|futebol|basquete|handebol))(?= (?:de|do|da|dos|das|toda|todo|todas|todos|muito|demais|bastante|dele|dela|em casa|sempre|a noite)|$)|e espancad[oa]|e agredid[oa]|vive machucad[oa]|tem marcas)", "apanha(?:ndo|m)? de (?:cinto|chinelo|fio|pau|corda|vara|mangueira)", "(?:escuto|ouco|ouvi) (?:os )?gritos d[eao]s? (?:crianca|menina|menino|filh[oa]|vizinh[oa])", "(?:crianca|menina|menino|filh[oa]) (?:trancad[oa]|amarrad[oa]|sem comer|passando fome) (?:em casa|sozinh[oa])",
        "(?:crianca|menina|menino|filha|filho) (?:esta sendo |sendo |foi )?(?:abusada|abusado|maltratada|maltratado|espancada|espancado|violentada)",
        "maus tratos (?:a|com|em|contra) (?:crianca|criancas|menor|filho|filha|bebe)", "abuso sexual (?:de|da|do|contra) (?:crianca|menor|filha|filho)"
      ],
      aviso: "Se uma criança está em perigo, ligue 190 (Polícia) ou Disque 100 (24 horas, gratuito).",
      mensagem: "Se uma criança está em perigo agora, ligue 190. Para pedir proteção e denunciar: Disque 100 (24 horas, gratuito) e o Conselho Tutelar.",
      telefones: ["190", "100"],
      pins: [{ svc: "assistencia/conselho_tutelar", max: 2 }, { svc: "assistencia/creas", max: 1 }, { svc: "mulher/ddm", max: 1 }]
    },
    violencia: {
      forte: [
        "(?:me|nos) (?:bateu|bate|batem|bateram|batendo|agrediu|agride|agrediram|espancou|espanca|empurrou|empurra|chutou|chuta|enforcou|sufocou|esfaqueou|ameacou|ameaca|ameacando|persegue|perseguiu|perseguindo|humilha|humilhou|xingou|xinga|trancou|tranca|proibe|vigia|controla|mordeu|queimou|jogou)(?! (?:no|na|em|num|numa) (?:jogo|jogos|videogame|game|xadrez|truco|baralho|damas|corrida|futebol|partida|campeonato|final|ping pong|tenis))(?! de (?:goleada|\\d))",
        PESSOA + " me (?:bate|bateu|ameaca|ameacou|agride|agrediu|persegue|humilha|humilhou|abusa|abusou|empurrou|chutou|enforcou)",
        PESSOA + " (?:controla|controlou|controlando|vigia|vigiando) (?:todo o |toda a |meu |minha |meus |minhas )?(?:dinheiro|conta bancaria|celular|telefone|mensagens|com quem eu falo|roupas|documentos)",
        PESSOA + " (?:bate|bateu|agride|agrediu|empurrou|chutou|enforcou|ameaca|ameacou|abusa|abusou) (?:em|n[ao]s?|d[ao]s?) (?:mim|nos|gente|minha|meu|meus|minhas|nossos|nossas|filha|filho|criancas)",
        PESSOA + " (?:vai|quer|disse que vai) (?:me )?(?:matar|bater)",
        "(?:estou|to|ta|tou|esta|vivo|vivendo|continuo) (?:apanhando|sendo agredida|sendo ameacada|sofrendo violencia|sendo perseguida)", "apanh(?:o|ando|ei|ou|a|am)\\b(?! (?:chuva|sol|gripe|resfriado|frio|bola|onibus|um taxi|ar|vento|sereno|a bola|o onibus|feio|de goleada|no jogo|em campo|na final|no campeonato|pra (?:aprender|achar|mexer)|muito pra|(?:do|da|dos|das) (?:adversari\\w*|time|equipe|oponent\\w*|rival|jogo|campeonato|volei|futebol|basquete|handebol)))",
        "(?:bate|bateu|batendo|agride|agrediu|espanca|espancou|maltrata|ameaca|ameacou) (?:n[ao]|em|a) (?:a |sua |minha )?(?:mulher|esposa|namorada|companheira|vizinha|irma|amiga|mae)",
        "(?:vizinha|amiga|irma|mae|filha|prima|colega) (?:apanha|apanhando|sofre violencia|e agredida|esta sendo agredida|e ameacada)",
        "apanha (?:do|da|de) (?:marido|namorado|companheiro|pai|ex)",
        "violencia (?:domestica|psicologica|fisica|sexual|patrimonial)", "sofro violencia", "sofrendo violencia",
        "vai me matar", "quer me matar", "tentou me (?:matar|estrangular|sufocar|esfaquear|enforcar|afogar|queimar|atropelar)", "(?:ele|ela|meu \\\\w+) tentou me (?:matar|estrangular|sufocar|esfaquear|enforcar)", "\\bme (?:mata|matar|machuca|machucar|esfaqueia|esfaquear)\\b(?! de )", "(?:ele|ela) (?:disse|falou|jurou|prometeu) que (?:me )?(?:mata|vai me|vai acabar comigo)", "acabar comigo",
        "(?:meu ex|meu ex marido|meu ex namorado|ex|ele|ela|marido|companheiro|namorado|um homem|alguem|um desconhecido|meu patrao|meu chefe)(?: \\w+){0,2} (?:me )?(?:segue|seguiu|seguindo|persegue|perseguindo|perseguiu|vigiando|vigia|monitora|monitorando|espiona|espiando)(?! (?:no|na|nas|nos|em) (?:instagram|insta|face|facebook|redes|whatsapp|zap|tiktok|twitter|x|canal|youtube))", "(?:ta|esta|vive|fica|anda) me (?:seguindo|perseguindo|vigiando|monitorando|espiando)", "aparece (?:na|no|em) (?:porta|trabalho|minha casa|escola|faculdade)", "fica me (?:ligando|mandando mensagem|ameacando|esperando|vigiando)", "(?:nao para|nao para de) (?:me )?(?:ligar|mandar mensagem|perseguir)",
        "(?:denunciar|denuncia contra|registrar (?:ocorrencia|boletim) contra|prestar queixa d[eo]) (?:o |a |meu |minha )?(?:marido|companheiro|companheira|namorado|ex|pai|padrasto|agressor|patrao)",
        "(?:estou com|to com|fiquei com|sinto|sentindo|morro de) medo (?:dele|dela|do meu (?:marido|ex|companheiro|namorado|pai|padrasto)|da minha familia)",
        "(?:ele|ela) (?:ta|esta) (?:me )?(?:esperando|na porta|na frente da minha casa)", "vou morrer(?! de )", "ameaca de morte", "ameacou de morte", "ameacou me matar",
        "medida protetiva", "estupr\\w*", "abusad[ao]", "abuso sexual", "fui forcada", "me forcou", "assedi\\w*", "fui violentada",
        "tenho medo (?:dele|dela|do meu marido|do meu ex|do meu companheiro|do meu namorado|de voltar pra casa|de voltar para casa|de ir pra casa|de chegar em casa|de entrar em casa|de ficar em casa|de dormir em casa)",
        "(?:nao me deixa|nao deixa eu|me proibe de|me tranca|me prende) (?:sair|em casa|de sair|trabalhar)", "nao posso sair de casa",
        "quebrou tudo", "quebra tudo", "sair de casa com (?:[a-z]+ ){0,4}seguranca", "fugir de casa", "fugir dele",
        "estou em perigo", "to em perigo", "me ajuda ele esta aqui", "ele esta aqui", "ele esta vindo", "socorro(?: me (?:ajuda|ajudem)| por favor)?$", "socorro me ajuda"
      ],
      contexto: ["delegacia da mulher", "\\bddm\\b", "\\bcram\\b", "patrulha maria da penha", "ligue 180", "casa abrigo", "casa de abrigo", "abrigo (?:pra|para) (?:mim|mulher|mim e meus filhos|minha familia)", "preciso de abrigo"],
      aviso: "Se você está em perigo, ligue 190 (Polícia) ou 180 (Central de Atendimento à Mulher, 24 horas, gratuito).",
      mensagem: "Se você está em perigo agora, ligue 190 (Polícia). O Ligue 180 orienta e encaminha, 24 horas, de graça. Você não precisa contar a sua história aqui.",
      telefones: ["190", "180"],
      pins: [{ svc: "mulher/ddm", max: 1 }, { svc: "mulher/patrulha", max: 1 }, { svc: "mulher/secretaria", max: 1 }]
    },
    saude: {
      forte: [
        "dor (?:muito )?(?:forte )?(?:no|em) peito", "dor no peito", "falta de ar", "nao consigo respirar", "sem ar", "sufocando", "afogando", "parou de respirar",
        "desmai\\w*", "(?:caiu|tombou|passou mal|bateu a cabeca|escorregou|apagou) e (?:nao|n) (?:responde|reage|acorda|se mexe|fala|levanta)", "nao (?:acorda|respira|reage|se mexe)\\b", "nao esta (?:respirando|reagindo|respondendo)", "inconsciente", "engasg\\w+", "(?:esta|ficou|ficando|esta ficando) (?:roxo|roxa|azul|azulado|azulada|branco|branca como cera)", "vomitando sangue", "(?:febre|temperatura) (?:muito )?alta.{0,40}(?:convuls\\w*|mole|nao acorda|dormindo demais)", "perdeu os sentidos", "(?:queimou|queimadura).{0,25}(?:crianca|bebe|filh[oa]|rosto|corpo)", "(?:levou|tomou) (?:um )?choque", "cortou (?:muito|fundo)", "desacordad\\w*", "convuls\\w*", "infarto", "\\bavc\\b", "derrame", "overdose", "envenen\\w*", "(?:engoliu|tomou|bebeu|ingeriu|comeu) (?:veneno|produto de limpeza|soda caustica|(?:muito|todos os|a cartela de) remedios?)",
        "sangrando (?:muito|bastante)", "sangramento (?:forte|intenso|muito)", "queimadura (?:grave|forte)", "acidente grave"
      ],
      aviso: "Se for uma urgência médica, ligue 192 (SAMU) ou vá à UPA mais próxima.",
      mensagem: "Isso pode ser uma urgência. Ligue agora para o 192 (SAMU) ou vá à UPA mais próxima.",
      telefones: ["192"],
      pins: [{ id: "man-saude-upa-cervezao" }, { id: "man-saude-upa-estadio" }, { id: "man-saude-santa-casa" }]
    },
    risco: {
      forte: ["risco de (?:cair|desabar|desabamento)", "vai desabar", "desabando", "incendio", "pegando fogo", "alagou", "enchente", "deslizamento", "vazamento de gas", "cheiro de gas"],
      mensagem: "Se há risco imediato para você ou para quem está com você, ligue 190 (Polícia), 192 (SAMU) ou 193 (Bombeiros).",
      telefones: ["190", "192", "193"],
      pins: []
    }
  };

  /* Ordem de importância quando mais de um tipo aparece (risco de vida primeiro). */
  var ORDEM = ["suicidio", "crianca", "violencia", "saude", "risco"];

  var COMPILADO = {};
  Object.keys(TIPOS).forEach(function (t) {
    COMPILADO[t] = {
      forte: TIPOS[t].forte.map(function (r) { return new RegExp("(?:^| )" + r + "(?: |$)"); }),
      contexto: (TIPOS[t].contexto || []).map(function (r) { return new RegExp("(?:^| )" + r + "(?: |$)"); })
    };
  });

  function achou(lista, texto) { return lista.some(function (r) { return r.test(texto); }); }

  /* Âncoras: um alerta que vem SÓ do detector aprendido precisa de ao menos uma palavra do campo do assunto. Modelos pequenos confundem
     "vou tirar férias" com "vou tirar a minha vida"; a âncora barra esse tipo de erro sem atrapalhar as regras. */
  var ANCORAS = {
    suicidio: /(?:^| )(?:morr\w*|mort\w*|mat(?:ar|o|ei|ou|ando)|vida|viver|vivo|acab\w*|sum(?:ir|o|ido)|desapare\w*|suicid\w*|despedid\w*|despedi|enforc\w*|corda|veneno|remedios?|comprimidos?|machuc\w*|cort(?:ar|ei|es)|pulsos?|ponte|saida|sentido|existir|existo|nascer|nasci|acord\w*|dormir|dorm\w+|ferir|jogar|pular|afog\w*|sem mim|falta|peso|cansad\w+|desist\w*|ninguem|sozinh\w+)(?: |$)/,
    violencia: /(?:^| )(?:bat\w*|agred\w*|ameac\w*|mat(?:ar|a|ou)|soco|socos|tapa|surra|pancada|empurr\w*|estrangul\w*|sufoc\w*|enforc\w*|forc\w*|abus\w*|violen\w*|medo|pavor|persegu\w*|segu\w+|vigi\w*|tranc\w*|preso|presa|machuc\w*|quebr\w*|arma|faca|socorro|marido|namorad\w*|companheir\w*|ex|ele|ela|padrasto|pai|chefe|patrao|apanh\w*|xing\w*|humilh\w*|control\w*|proib\w*|fugi\w*|fugir|escond\w*|sair de casa|perigo|esfaque\w*|cinto|estupr\w*|assedi\w*)(?: |$)/,
    crianca: /(?:^| )(?:crianca\w*|filh[oa]s?|menin[oa]s?|neto|neta|bebe|bebes|sobrinh[oa]|entead[oa]|adolescente|aluno|aluna|baba|pequen[oa]|infantil|menor)(?: |$)/,
    saude: /(?:^| )(?:desmai\w*|respir\w*|sangu\w*|sangr\w*|convuls\w*|infart\w*|derrame|engasg\w*|roxo|roxa|azul|queda|caiu|caido|caida|inconsciente|veneno|queimad\w*|queimou|overdose|dor|febre|parto|acidente|choque|afog\w*|passando mal|passou mal|responde|acorda|tontura|desacord\w*|pulso|vomit\w*|ferido|ferida|machuc\w*|corte|corpo|cinza|palid\w*|suando|frio|remedios?|engoliu|tomou|ingeriu|mole|duro|torto|torta|boca|falar|enxerg\w*)(?: |$)/
  };

  /* Detector aprendido (pipeline/treinar_perigo.py): pega o que as listas de palavras não pegam. Trabalha JUNTO com as regras: o alerta
     aparece se qualquer um dos dois disparar. Sem o modelo carregado, só valem as regras. */
  var detector = null;
  function usarModelo(m) { detector = (m && IA && IA.criarClassificador) ? IA.criarClassificador(m) : null; if (detector) detector.altos = (m.meta && m.meta.limiares_altos) || {}; }

  /* nivel 2 = situação de perigo ou de risco de vida; nivel 1 = só perguntou por um serviço de proteção (aviso discreto).
     Devolve null quando não há nenhum sinal. */
  function avaliar(texto) {
    var t = Regras.normalizar(texto);
    if (!t) return null;
    /* Letras esticadas ("me baaaate", "quero morreeer", "socorrooo"): além do texto como veio, olha uma versão com 3 ou mais letras
       iguais seguidas reduzidas a uma (o português não tem palavra com três letras iguais seguidas, então nada legítimo é alterado). */
    var t2 = t.replace(/([a-z0-9])\1{2,}/g, "$1"), versoes = t2 !== t ? [t, t2] : [t];
    function emAlguma(re) { return versoes.some(function (v) { return re.test(v); }); }
    var tipos = [], nivel = 0;
    var probs = detector ? detector.probabilidades(texto) : null, doModelo = {}, fracos = [];
    if (probs && t2 !== t) { var probs2 = detector.probabilidades(t2); Object.keys(probs2).forEach(function (k) { if (probs2[k] > probs[k]) probs[k] = probs2[k]; }); }
    ORDEM.forEach(function (tp) {
      var regra = versoes.some(function (v) { return achou(COMPILADO[tp].forte, v); }), p = probs ? probs[tp] : undefined, lim = detector ? detector.limiares[tp] : undefined;
      var alto = detector && detector.altos[tp] !== undefined ? detector.altos[tp] : lim;
      if (!regra && ANCORAS[tp] && !emAlguma(ANCORAS[tp])) p = undefined; /* o detector sozinho não vale sem uma palavra do assunto */
      if (p !== undefined && lim !== undefined && p >= lim) doModelo[tp] = Math.round(p * 1000) / 1000;
      if (regra || (p !== undefined && alto !== undefined && p >= alto)) { tipos.push(tp); nivel = 2; }
      else if (p !== undefined && lim !== undefined && p >= lim) fracos.push(tp); /* detector com confiança moderada: só aviso discreto */
    });
    if (!tipos.length && fracos.length) {
      var tels1 = [], vistos1 = {};
      fracos.forEach(function (tp) { TIPOS[tp].telefones.forEach(function (n) { if (!vistos1[n]) { vistos1[n] = 1; tels1.push(n); } }); });
      return { nivel: 1, tipos: fracos, doModelo: doModelo, mensagens: fracos.map(function (tp) { return TIPOS[tp].aviso || TIPOS[tp].mensagem; }), telefones: tels1, pins: [] };
    }
    if (!tipos.length && versoes.some(function (v) { return achou(COMPILADO.violencia.contexto, v); })) { tipos.push("violencia"); nivel = 1; }
    if (!tipos.length) return null;
    var tels = [], vistos = {}, pins = [];
    tipos.forEach(function (tp) {
      TIPOS[tp].telefones.forEach(function (n) { if (!vistos[n]) { vistos[n] = 1; tels.push(n); } });
      TIPOS[tp].pins.forEach(function (p) { pins.push(p); });
    });
    /* gestante em urgência: o pronto atendimento de ginecologia e obstetrícia é o primeiro destino */
    if (tipos.indexOf("saude") !== -1 && /gravid|gestan|gestac|parto|contrac|pre natal|prenatal|aborto|maternidade/.test(t)) pins.unshift({ id: "man-saude-pa-ginecologia" });
    return { nivel: nivel, tipos: tipos, doModelo: doModelo, mensagens: tipos.map(function (tp) { return TIPOS[tp].mensagem; }), telefones: tels, pins: pins };
  }

  return { avaliar: avaliar, usarModelo: usarModelo, TIPOS: TIPOS, ORDEM: ORDEM };
});
