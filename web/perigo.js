/* Camada de SEGURANÇA do MISM3: lê o que a mulher escreveu e diz se há risco, de que tipo, o que mostrar primeiro e quais destinos fixar.
   É determinística de propósito (regras revisáveis, sem modelo e sem busca): em situação de perigo a resposta não pode depender de nota de
   similaridade. Errar para mais custa uma frase a mais na tela; errar para menos pode custar muito mais. Por isso as regras favorecem o alerta.
   Lógica pura (sem DOM, sem rede, sem gravar nada); o texto é lido e descartado no aparelho. */
(function (raiz, fabrica) {
  if (typeof module === "object" && module.exports) module.exports = fabrica(require("./necessidades.js"));
  else raiz.Perigo = fabrica(raiz.MISM3Necessidades);
})(typeof self !== "undefined" ? self : this, function (Regras) {
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
        "me machucar", "me cortar", "me ferir", "automutilacao", "quero sumir(?! (?:com|de|da|do|a|o|as|os)\\b)", "acabar com a minha vida"
      ],
      mensagem: "Sinto muito que você esteja se sentindo assim. Você não está sozinha. Se pensa em se machucar, ligue agora para o 188 (CVV, conversa de apoio, 24 horas, gratuito) ou para o 192 (SAMU).",
      telefones: ["188", "192"],
      pins: [{ id: "man-saude-caps-iii" }, { id: "man-saude-upa-estadio" }]
    },
    crianca: {
      forte: [
        "(?:meu pai|padrasto|meu tio|meu avo|vizinho|professor|meu marido|meu companheiro|ele|ele mesmo|a mae dela|a mae dele)(?: me)? (?:abusa|abusou|abusando|mexe|bolina|estupra|estuprou|bate|machuca|maltrata|espanca)(?: n[ao]?| d[ao]?)?(?: minha| meu| a| o| uma| um)? ?(?:filha|filho|crianca|menina|menino|neta|neto|sobrinha|sobrinho|enteada|enteado)",
        "(?:bate|bateu|batendo|machuca|machucou|maltrata|maltratou|espanca|espancou|agride|agrediu) (?:(?:n[ao]s?|em|a[so]?) )?(?:minhas? |meus? |suas? |seus? |nossos |nossas |as |os )?(?:criancas?|filh[oa]s?|menin[oa]s?|bebes?|netos?|netas?)",
        "abus(?:a|ou|ando|o) (?:d[ao]|de) (?:minha|meu|uma|um) (?:filha|filho|crianca|menina|menino|neta|neto)",
        "(?:crianca|menina|menino|filha|filho) (?:esta sendo |sendo |foi )?(?:abusada|abusado|maltratada|maltratado|espancada|espancado|violentada)",
        "maus tratos (?:a|com|em|contra) (?:crianca|criancas|menor|filho|filha|bebe)", "abuso sexual (?:de|da|do|contra) (?:crianca|menor|filha|filho)"
      ],
      mensagem: "Se uma criança está em perigo agora, ligue 190. Para pedir proteção e denunciar: Disque 100 (24 horas, gratuito) e o Conselho Tutelar.",
      telefones: ["190", "100"],
      pins: [{ svc: "assistencia/conselho_tutelar", max: 2 }, { svc: "assistencia/creas", max: 1 }, { svc: "mulher/ddm", max: 1 }]
    },
    violencia: {
      forte: [
        "(?:me|nos) (?:bateu|bate|batem|bateram|batendo|agrediu|agride|agrediram|espancou|espanca|empurrou|empurra|chutou|chuta|enforcou|sufocou|esfaqueou|ameacou|ameaca|ameacando|persegue|perseguiu|perseguindo|humilha|humilhou|xingou|xinga|trancou|tranca|proibe|vigia|controla|mordeu|queimou|jogou)",
        PESSOA + " me (?:bate|bateu|ameaca|ameacou|agride|agrediu|persegue|humilha|humilhou|abusa|abusou|empurrou|chutou|enforcou)",
        PESSOA + " (?:controla|controlou|controlando|vigia|vigiando) (?:todo o |toda a |meu |minha |meus |minhas )?(?:dinheiro|conta bancaria|celular|telefone|mensagens|com quem eu falo|roupas|documentos)",
        PESSOA + " (?:bate|bateu|agride|agrediu|empurrou|chutou|enforcou|ameaca|ameacou|abusa|abusou) (?:em|n[ao]s?|d[ao]s?) (?:mim|nos|gente|minha|meu|meus|minhas|nossos|nossas|filha|filho|criancas)",
        PESSOA + " (?:vai|quer|disse que vai) (?:me )?(?:matar|bater)",
        "(?:estou|to|ta|tou|esta|vivo|vivendo|continuo) (?:apanhando|sendo agredida|sendo ameacada|sofrendo violencia|sendo perseguida)", "apanh(?:o|ando|ei|ou)\\b",
        "(?:bate|bateu|batendo|agride|agrediu|espanca|espancou|maltrata|ameaca|ameacou) (?:n[ao]|em|a) (?:a |sua |minha )?(?:mulher|esposa|namorada|companheira|vizinha|irma|amiga|mae)",
        "(?:vizinha|amiga|irma|mae|filha|prima|colega) (?:apanha|apanhando|sofre violencia|e agredida|esta sendo agredida|e ameacada)",
        "apanha (?:do|da|de) (?:marido|namorado|companheiro|pai|ex)",
        "violencia (?:domestica|psicologica|fisica|sexual|patrimonial)", "sofro violencia", "sofrendo violencia",
        "vai me matar", "quer me matar", "vou morrer", "ameaca de morte", "ameacou de morte", "ameacou me matar",
        "medida protetiva", "estupr\\w*", "abusad[ao]", "abuso sexual", "fui forcada", "me forcou", "assedi\\w*", "fui violentada",
        "tenho medo (?:dele|dela|do meu marido|do meu ex|do meu companheiro|do meu namorado|de voltar pra casa|de voltar para casa|de ir pra casa|de chegar em casa)",
        "(?:nao me deixa|nao deixa eu|me proibe de|me tranca|me prende) (?:sair|em casa|de sair|trabalhar)", "nao posso sair de casa",
        "quebrou tudo", "quebra tudo", "sair de casa com (?:[a-z]+ ){0,4}seguranca", "fugir de casa", "fugir dele",
        "estou em perigo", "to em perigo", "me ajuda ele esta aqui", "ele esta aqui", "ele esta vindo", "socorro"
      ],
      contexto: ["delegacia da mulher", "\\bddm\\b", "\\bcram\\b", "patrulha maria da penha", "ligue 180", "casa abrigo", "casa de abrigo", "abrigo (?:pra|para) (?:mim|mulher|mim e meus filhos|minha familia)", "preciso de abrigo"],
      mensagem: "Se você está em perigo agora, ligue 190 (Polícia). O Ligue 180 orienta e encaminha, 24 horas, de graça. Você não precisa contar a sua história aqui.",
      telefones: ["190", "180"],
      pins: [{ svc: "mulher/ddm", max: 1 }, { svc: "mulher/patrulha", max: 1 }, { svc: "mulher/secretaria", max: 1 }]
    },
    saude: {
      forte: [
        "dor (?:muito )?(?:forte )?(?:no|em) peito", "dor no peito", "falta de ar", "nao consigo respirar", "sem ar", "sufocando", "afogando", "parou de respirar",
        "desmai\\w*", "desacordad\\w*", "convuls\\w*", "infarto", "\\bavc\\b", "derrame", "overdose", "envenen\\w*", "(?:engoliu|tomou|bebeu|ingeriu|comeu) (?:veneno|produto de limpeza|soda caustica|(?:muito|todos os|a cartela de) remedios?)",
        "sangrando (?:muito|bastante)", "sangramento (?:forte|intenso|muito)", "queimadura (?:grave|forte)", "acidente grave"
      ],
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

  /* nivel 2 = situação de perigo ou de risco de vida; nivel 1 = só perguntou por um serviço de proteção (aviso discreto).
     Devolve null quando não há nenhum sinal. */
  function avaliar(texto) {
    var t = Regras.normalizar(texto);
    if (!t) return null;
    var tipos = [], nivel = 0;
    ORDEM.forEach(function (tp) {
      if (achou(COMPILADO[tp].forte, t)) { tipos.push(tp); nivel = 2; }
    });
    if (!tipos.length && achou(COMPILADO.violencia.contexto, t)) { tipos.push("violencia"); nivel = 1; }
    if (!tipos.length) return null;
    var tels = [], vistos = {}, pins = [];
    tipos.forEach(function (tp) {
      TIPOS[tp].telefones.forEach(function (n) { if (!vistos[n]) { vistos[n] = 1; tels.push(n); } });
      TIPOS[tp].pins.forEach(function (p) { pins.push(p); });
    });
    return { nivel: nivel, tipos: tipos, mensagens: tipos.map(function (tp) { return TIPOS[tp].mensagem; }), telefones: tels, pins: pins };
  }

  return { avaliar: avaliar, TIPOS: TIPOS, ORDEM: ORDEM };
});
