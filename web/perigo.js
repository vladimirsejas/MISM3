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
  /* Quem agride pode ser o parceiro ou outro familiar (filho adulto, neto, genro, irmão...): a relação familiar não reduz o risco. */
  var FAMILIAR = "(?:meu|minha) (?:filho|filha|neto|neta|genro|nora|irmao|irma|sobrinho|sobrinha|cunhado|cunhada|tio|tia|madrasta|enteado|enteada|mae|avo)(?: ja adulto| ja adulta| adulto| adulta| mais velho| mais velha)?";
  var PESSOA = "(?:meu marido|meu companheiro|meu namorado|meu ex(?: marido| companheiro| namorado)?|meu pai|meu padrasto|meu patrao|ele|ela|" + FAMILIAR + ")";
  /* Golpe físico descrito sem o verbo "bater" ("me dá tapa", "me deu um soco"); afasta brincadeira e carinho. */
  var GOLPE = "(?:me|nos) (?:da|deu|dava|dando|der|dar) (?:um |uns |o |a |uma )?(?:tapas?|socos?|chutes?|surras?|empurr\\w+|pancadas?|bofetadas?|murros?|cascudos?|beliscoes|safanao|safanoes|chicotadas?|cintadas?|mordidas?)(?!(?: \\w+){0,6} (?:de brincadeira|brincando|de leve|de carinho|de parabens|de cumprimento))";
  /* Proteção judicial já concedida (medida protetiva, ordem de afastamento) e o agressor que reaparece ou descumpre: risco alto, não só "pergunta". */
  var PROTECAO = "(?:protecao (?:judicial |da justica )?contra|protetiva|medida (?:judicial|de protecao|de afastamento|que o juiz)|ordem de (?:afastamento|restricao)|protecao judicial|(?:decisao|ordem) (?:da justica|do juiz|judicial)|juiz (?:deu|concedeu|determinou|mandou) (?:a |uma )?(?:ordem|medida|protecao|afastamento))";
  var REAPARECE = "(?:(?:veio|voltou|apareceu|aparece|chegou|esta|ta|ficou|fica|anda|continua|insiste)(?: \\w+){0,3} (?:de novo|aqui|rondando|na porta|no portao|na frente|na minha (?:casa|rua|porta)|em frente|me procurando|me procurou|me ligando|me mandando|me esperando)|descumpr\\w+|nao (?:respeita|respeitou|cumpre|cumpriu|obedece|obedeceu)|ignor\\w+ (?:a |as |o )?(?:decisao|medida|ordem|justica|juiz|protecao)|rondando|(?:batendo|esmurrando|chutando|forcando) (?:na|no|a|o) (?:porta|portao|janela)|tentando (?:entrar|arrombar|invadir)|me procurou)";
  /* Sintomas de infarto sem a palavra "dor": aperto, pressão ou peso no peito; braço ou mandíbula com formigamento junto de outro sinal. */
  var BRACO_MANDIBULA = "(?:(?:braco|bracos|mandibula|maxilar|ombro) (?:esquerdo |direito )?(?:formig\\w*|dorment\\w*|adormecid\\w*|doendo|dolorid\\w*|pesad\\w*|doi|dor)|(?:dor|formigamento|dormencia|peso) (?:no|em|do|na) (?:braco|bracos|mandibula|maxilar|ombro)(?: esquerdo| direito)?)";
  /* Contato com quem a justiça proibiu: "o juiz proibiu / não pode falar com ela" + o contato acontecendo = descumprimento de proteção. */
  var PROIBIDO = "(?:proibid[ao]s?|proibindo|proibiu|nao pode (?:falar|se aproximar|chegar perto|entrar em contato|procurar|ligar|mandar mensagem|ter contato)|(?:juiz|justica|decisao|ordem|medida)(?: \\w+){0,3} (?:proibi\\w+|determin\\w+|mandou)|ordem de afastamento)";
  var CONTATO = "(?:(?:entrou|entrando|fez|teve)(?: \\w+)? contato|contato com ela|contato comigo|falou com ela|falou comigo|mandando mensagem|mandou mensagem|manda mensagem|ligando|ligou|liga pra ela|procurou|procurando|aproximou|se aproxima|apareceu|chegou perto|esta perto|esteve)";
  var AGRESSOR_AMBIENTE = "(?:ele|ex|dele|agressor|marido|namorado|companheiro|pai dos meus filhos|pai dela|pai dele)";
  var SINAL_DANO_CRIANCA = "(?:machucad\\w+|marcas?|roxo|roxa|roxos|hematomas?|apanh\\w+|abus\\w+|maltrat\\w+|negligenc\\w+|espanc\\w+|queimad\\w+|passando fome|sem comer|trancad\\w+|abandonad\\w+)";
  var SINAL_ASSOCIADO = "(?:peito|falta de ar|sem ar|ar faltando|suor frio|suando frio|tontura|tonta|enjoo|enjoada|nausea|mal estar|passando mal|palidez|palida)";
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
        "(?:minha )?vida nao tem (?:mais )?(?:sentido|valor|jeito|saida)", "nao vejo (?:mais )?(?:saida|solucao|sentido|futuro)", "nao tem mais jeito pra mim", "(?:seria|era|e) melhor (?:se eu )?(?:morresse|nao existisse|nao estivesse aqui|desaparecesse)", "ninguem sentiria minha falta", "nao tenho mais motivo pra viver", "(?:escrevi|deixei|fiz|preparei|escrever) (?:uma )?(?:carta|bilhete|mensagem) de despedida", "ja escrevi minha despedida", "(?:filhos|familia|todos|todo mundo|mundo) (?:ficariam|estariam|ficaria|estaria) melhor sem (?:a mae|mim|eu)", "nao tenho motivo pra (?:viver|continuar)", "quero sumir(?! (?:com|de|da|do|a|o|as|os)\\b)", "acabar com a minha vida",
        "(?:medo|receio|temo|acho|penso|tenho certeza|desconfio|preocupad[ao]|preocupacao)(?: \\w+){0,3} que (?:ela|ele|elas|eles|meu \\w+|minha \\w+|\\w+)(?: \\w+){0,2} (?:se mate|se matar|vai se matar|va se matar|se suicide|se suicidar|(?:tire|tirar) a (?:propria )?vida|acabe com a (?:propria )?vida|(?:tente|tentar|va tentar|possa tentar|pode tentar) (?:se )?(?:matar|suicid\\w+)|(?:se machuque|se fira|se corte|se machucar) (?:a si|de proposito|sozinh[ao])|se (?:faca|fazer) mal)",
        "(?:ela|ele|meu \\w+|minha \\w+) (?:quer|querendo|pensa em|pensando em|disse que quer|disse que vai|falou que quer|falou que vai|diz que quer|diz que vai) (?:se )?(?:matar|suicidar|morrer(?! de )|acabar com a (?:propria )?vida|tirar a (?:propria )?vida)",
        "(?:tentou|tentaram|tentando) (?:se )?(?:matar|suicidar|suicidio)", "tentativa de suicidio", "(?:vai |va |pode |possa )se (?:mate|matar)",
        "cvv", "centro de valorizacao da vida", "(?:ligar|ligue|numero|telefone)(?: \\w+){0,2} 188"
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
        "maus tratos (?:a|com|em|contra) (?:crianca|criancas|menor|filho|filha|bebe)",
        "(?:crianca|menina|menino|filh[oa]|bebe|neto|neta|aluna|aluno|sobrinh[oa]|entead[oa]|afilhad[oa])(?: \\w+){0,2} sempre (?:chega|volta|aparece|vem)(?: \\w+){0,5} (?:machucad[oa]|roxo|roxa|com marcas|com hematomas|com roxos)(?!(?: \\w+){0,4} (?:futebol|jogo|treino|bicicleta|skate|patins|brincadeira|campinho|quadra|recreio|capoeira|judo|handebol|volei|basquete|brincando))", "abuso sexual (?:de|da|do|contra) (?:crianca|menor|filha|filho)"
      ],
      combos: [["conselho tutelar", SINAL_DANO_CRIANCA]],
      aviso: "Se uma criança está em perigo, ligue 190 (Polícia) ou Disque 100 (24 horas, gratuito).",
      mensagem: "Se uma criança está em perigo agora, ligue 190. Para pedir proteção e denunciar: Disque 100 (24 horas, gratuito) e o Conselho Tutelar.",
      telefones: ["190", "100"],
      pins: [{ svc: "assistencia/conselho_tutelar", max: 2 }, { svc: "assistencia/creas", max: 1 }, { svc: "mulher/ddm", max: 1 }]
    },
    violencia: {
      forte: [
        "(?:me|nos) (?:bateu|bate|batem|bateram|batendo|agrediu|agride|agrediram|espancou|espanca|empurrou|empurra|chutou|chuta|enforcou|sufocou|esfaqueou|ameacou|ameaca|ameacando|trancou|tranca|trancaram|trancam|trancando|espancaram|empurraram|chutaram|enforcaram|sufocaram|esfaquearam|ameacaram|proibe|vigia|controla|mordeu|queimou|jogou)(?! (?:no|na|em|num|numa) (?:jogo|jogos|videogame|game|xadrez|truco|baralho|damas|corrida|futebol|partida|campeonato|final|ping pong|tenis))(?! de (?:goleada|\\d))",
        PESSOA + " me (?:bate|bateu|ameaca|ameacou|agride|agrediu|abusa|abusou|empurrou|chutou|enforcou)(?! (?:no|na|em|num|numa) (?:jogo|jogos|videogame|game|xadrez|truco|baralho|damas|corrida|futebol|partida|campeonato|final|ping pong|tenis))",
        GOLPE, PESSOA + " (?:levanta|levantou|ergue|ergueu|levantando) a mao pra (?:mim|cima de mim)",
        "descumpr\\w+ (?:a |essa |minha )?(?:medida|protecao|ordem)(?: protetiva| judicial| de afastamento)?",
        "(?:manda|mandou|mandando|envia|enviou|enviando|faz|fez|fazendo|fica|vive|deixou|deixa)(?: \\w+){0,3} ameacando",
        "(?:me|nos|minha|meu)(?: \\w+){0,5} (?:com|de|portando) (?:uma |um )?(?:faca|facao|canivete|arma|revolver|pistola|garrucha|espingarda)(?!(?: \\w+){0,2} (?:de pao|de cozinha|de mesa|de cortar|de brinquedo))",
        "(?:ele|ela|ex|marido|namorado|companheiro|homem|alguem)(?: \\w+){0,3} armad[oa]",
        "(?:apontou|apontaram|apontando|aponta|empunhou|empunhando|sacou)(?: \\w+){0,3} (?:uma |um )?(?:arma|faca|facao|revolver|pistola|espingarda|garrucha)",
        "(?:apontou|apontaram|apontando)(?: (?:uma|um|o|a))? (?!dedo|lapis|caneta|laser|celular|camera|lanterna|controle|microfone)\\w+ (?:pra|para|na|no|em) (?:mim|minha cara|minha cabeca|meu rosto|minha barriga)",
        "(?:me|nos) (?:prendeu|prenderam|prendem|prendendo) (?:em casa|no quarto|la dentro|dentro de casa|no banheiro|no porao|no quintal)",
        PESSOA + " (?:controla|controlou|controlando|vigia|vigiando) (?:todo o |toda a |meu |minha |meus |minhas )?(?:dinheiro|conta bancaria|celular|telefone|mensagens|com quem eu falo|roupas|documentos)",
        PESSOA + " (?:bate|bateu|agride|agrediu|empurrou|chutou|enforcou|ameaca|ameacou|abusa|abusou) (?:em|n[ao]s?|d[ao]s?) (?:mim|nos|gente|minha|meu|meus|minhas|nossos|nossas|filha|filho|criancas)",
        "(?:meu|minha) (?:pai|mae|padrasto|madrasta|marido|companheiro|namorado|ex|irmao|tio|avo)(?: \\w+){0,3} (?:agrediu|agrediram|agride|bateu|bateram|bate|espancou|espancaram|espanca|machucou|machucam|empurrou|chutou|esfaqueou|enforcou|sufocou|maltratou|maltrata|ameacou)(?: \\w+)? (?:a |o |os |as )?(?:minha mae|meu pai|minha irma|meus irmaos|minhas irmas|minha avo|meu avo|mim|nos|minha familia|a gente|todos nos|todo mundo|todos|meus filhos|as criancas|a mae|a crianca|minhas filhas)",
        PESSOA + " (?:vai|quer|disse que vai) (?:me )?(?:matar|bater)",
        "(?:estou|to|ta|tou|esta|vivo|vivendo|continuo) (?:apanhando|sendo agredida|sendo ameacada|sofrendo violencia|sendo perseguida)", "apanh(?:o|ando|ei|ou|a|am)\\b(?! (?:chuva|sol|gripe|resfriado|frio|bola|onibus|um taxi|ar|vento|sereno|a bola|o onibus|feio|de goleada|no jogo|em campo|na final|no campeonato|pra (?:aprender|achar|mexer)|muito pra|(?:do|da|dos|das) (?:adversari\\w*|time|equipe|oponent\\w*|rival|jogo|campeonato|volei|futebol|basquete|handebol)))",
        "(?:bate|bateu|batendo|agride|agrediu|espanca|espancou|maltrata|ameaca|ameacou) (?:n[ao]|em|a) (?:a |sua |minha )?(?:mulher|esposa|namorada|companheira|vizinha|irma|amiga|mae)",
        "(?:vizinha|amiga|irma|mae|filha|prima|colega) (?:apanha|apanhando|sofre violencia|e agredida|esta sendo agredida|e ameacada)",
        "apanha (?:do|da|de) (?:marido|namorado|companheiro|pai|ex)",
        "violencia (?:domestica|psicologica|fisica|sexual|patrimonial)", "sofro violencia", "sofrendo violencia",
        "vai me matar", "quer me matar", "tentou me (?:matar|estrangular|sufocar|esfaquear|enforcar|afogar|queimar|atropelar)", "(?:ele|ela|meu \\\\w+) tentou me (?:matar|estrangular|sufocar|esfaquear|enforcar)", "\\bme (?:mata|matar|machuca|machucar|esfaqueia|esfaquear)\\b(?! de )", "(?:ele|ela) (?:disse|falou|jurou|prometeu) que (?:me )?(?:mata|vai me|vai acabar comigo)", "acabar comigo",
        "(?:meu ex|meu ex marido|meu ex namorado|ex|ele|ela|marido|companheiro|namorado|um homem|alguem|um desconhecido|meu patrao|meu chefe)(?: \\w+){0,2} (?:me )?(?:vigiando|vigia|monitora|monitorando|espiona|espiando)(?! (?:no|na|nas|nos|em) (?:instagram|insta|face|facebook|redes|whatsapp|zap|tiktok|twitter|x|canal|youtube))", "(?:ta|esta|vive|fica|anda) me (?:vigiando|monitorando|espiando)", "aparece (?:na|no|em) (?:porta|trabalho|minha casa|escola|faculdade)", "fica me (?:ligando|mandando mensagem|ameacando|esperando|vigiando)", "(?:nao para|nao para de) (?:me )?(?:ligar|mandar mensagem|perseguir)",
        "(?:denunciar|denuncia contra|registrar (?:ocorrencia|boletim) contra|prestar queixa d[eo]) (?:o |a |meu |minha )?(?:marido|companheiro|companheira|namorado|ex|pai|padrasto|agressor|patrao)",
        "(?:estou com|to com|fiquei com|sinto|sentindo|morro de) medo (?:dele|dela|do meu (?:marido|ex|companheiro|namorado|pai|padrasto)|da minha familia)",
        "(?:ele|ela) (?:ta|esta) (?:me )?(?:esperando|na porta|na frente da minha casa)", "vou morrer(?! de )", "ameaca de morte", "ameacou de morte", "ameacou me matar",
        "medida protetiva", "estupr\\w*", "abusad[ao]", "abuso sexual", "fui forcada", "me forcou", "assedi\\w*", "fui violentada",
        "tenho medo (?:dele|dela|do meu marido|do meu ex|do meu companheiro|do meu namorado|de voltar pra casa|de voltar para casa|de ir pra casa|de chegar em casa|de entrar em casa|de ficar em casa|de dormir em casa)",
        "(?:nao me deixa|nao deixa eu|me proibe de|me tranca|me prende) (?:sair|em casa|de sair|trabalhar)", "nao posso sair de casa",
        "quebrou tudo", "quebra tudo", "sair de casa com (?:[a-z]+ ){0,4}seguranca", "fugir de casa", "fugir dele",
        "(?:vivo|fico|estou|ficamos|vivemos|estamos|passo os dias|minha (?:filha|mae|irma|amiga|vizinha|prima) (?:vive|fica|esta)) (?:sempre |o tempo todo |todo dia )?(?:trancad[ao]s?|presa|presas|preso|presos|em carcere|em cativeiro)(?: dentro)? (?:em casa|de casa|na casa|dentro de casa|no apartamento|no quintal|no porao|no escuro)(?!(?: \\w+){0,5} (?:quarentena|chuva|gripe|covid|pandemia|greve|obra))",
        "(?:me deixa|me mantem|me tem|me prende|me tranca) (?:trancad[ao]|presa|em casa|no quarto)", "estou em perigo", "to em perigo", "me ajuda ele esta aqui", "ele esta aqui", "ele esta vindo", "socorro(?: me (?:ajuda|ajudem)| por favor)?$", "socorro me ajuda"
      ],
      contexto: ["delegacia da mulher", "\\bddm\\b", "\\bcram\\b", "patrulha maria da penha", "ligue 180", "casa abrigo", "casa de abrigo", "abrigo (?:pra|para) (?:mim|mulher|mim e meus filhos|minha familia)", "preciso de abrigo"],
      /* nível 1: só perseguição, humilhação verbal ou xingamento. Se aparecer ameaça, violência física, arma ou descumprimento de proteção,
         as regras fortes acima valem e o nível é 2. */
      moderado: [
        "me (?:persegue|perseguiu|perseguindo|segue|seguiu|seguindo|humilha|humilhou|humilhando|xinga|xingou|xingando|insulta|insultou|ofende|ofendeu|ofendendo|menospreza)(?! (?:no|na|em) (?:instagram|insta|face|facebook|redes|whatsapp|zap|tiktok|twitter|canal|youtube))",
        "(?:ta|esta|vive|fica|anda) me (?:seguindo|perseguindo|humilhando|xingando|insultando|ofendendo)",
        "(?:meu ex|meu ex marido|meu ex companheiro|meu ex namorado|ex|ele|ela|marido|companheiro|namorado|um homem|alguem|um desconhecido)(?: \\w+){0,2} (?:persegue|perseguiu|perseguindo)"
      ],
      combos: [[PROTECAO, REAPARECE], [PROIBIDO, CONTATO, AGRESSOR_AMBIENTE]],
      aviso: "Se você está em perigo, ligue 190 (Polícia) ou 180 (Central de Atendimento à Mulher, 24 horas, gratuito).",
      mensagem: "Se você está em perigo agora, ligue 190 (Polícia). O Ligue 180 orienta e encaminha, 24 horas, de graça. Você não precisa contar a sua história aqui.",
      telefones: ["190", "180"],
      pins: [{ svc: "mulher/ddm", max: 1 }, { svc: "mulher/patrulha", max: 1 }, { svc: "mulher/secretaria", max: 1 }]
    },
    saude: {
      forte: [
        "dor (?:muito )?(?:forte )?(?:no|em) peito", "dor no peito", "falta de ar", "nao consigo respirar", "sem ar", "sufocando", "afogando", "parou de respirar",
        "desmai\\w*", "(?:caiu|tombou|passou mal|bateu a cabeca|escorregou|apagou) e (?:nao|n) (?:responde|reage|acorda|se mexe|fala|levanta)", "nao (?:acorda|respira|reage|se mexe)\\b", "nao esta (?:respirando|reagindo|respondendo)", "inconsciente", "engasg\\w+", "(?:esta|ficou|ficando|esta ficando) (?:roxo|roxa|azul|azulado|azulada|branco|branca como cera)", "vomitando sangue", "(?:febre|temperatura) (?:muito )?alta.{0,40}(?:convuls\\w*|mole|nao acorda|dormindo demais)", "perdeu os sentidos", "(?:queimou|queimadura).{0,25}(?:crianca|bebe|filh[oa]|rosto|corpo)", "(?:levou|tomou) (?:um )?choque", "cortou (?:muito|fundo)", "desacordad\\w*", "convuls\\w*", "infarto", "\\bavc\\b", "derrame", "overdose", "envenen\\w*", "(?:engoliu|tomou|bebeu|ingeriu|comeu) (?:veneno|produto de limpeza|soda caustica|(?:muito|todos os|a cartela de) remedios?)",
        "(?:meu |o |no )?peito (?:esta |ta |fica |ficou |ficando )?(?:aperta\\w*|apertad\\w*|pesad\\w*|queima\\w*|esmagad\\w*|esmagand\\w*|doendo|doi)(?! (?:de|por) (?:saudade|tristeza|emocao|alegria|orgulho|amor))",
        "(?:aperto|pressao|peso|queimacao|pontada|facada|fisgada|desconforto|dor) (?:forte |muito forte |intensa |intenso |no lado esquerdo )?(?:no|em|do|sobre o) peito",
        "sangrando (?:muito|bastante)", "sangramento (?:forte|intenso|muito)",
        "(?:sangra|sangrou|sangrando) (?:sem parar|demais|muito|bastante|forte)", "nao para de sangrar", "hemorragia", "(?:perdendo|perdi|perdeu) (?:muito )?sangue", "muito sangue",
        "(?:corte|cortei|ferimento|talho|furo)(?!(?: \\w+){0,3} (?:cabelo|barba|unha|gasto|gastos|custo|custos|orcamento|energia|luz|agua|verba|bolo|papel|tecido|grama))(?: \\w+){0,3} (?:profundo|profunda|fundo|funda|grave)",
        "(?:dormencia|formigamento|fraqueza|paralisia|adormecimento|perda de (?:forca|sensibilidade)|(?:perdi|perdeu|perdendo) (?:a |o )?(?:forca|movimento|sensibilidade))(?: \\w+){0,3} (?:lado (?:esquerdo|direito)|metade do corpo|metade do rosto|rosto|face|boca)",
        "(?:lado|metade) (?:esquerdo|direito|do corpo)(?: \\w+){0,3} (?:dormente|dormindo|formigando|paralisad\\w+|sem forca|fraco)",
        "boca torta", "rosto torto", "fala (?:enrolada|arrastada)", "(?:falando|falar) enrolad[ao]", "perdi a fala", "perda (?:subita )?(?:da |de )?visao", "queimadura (?:grave|forte)", "acidente grave"
      ],
      combos: [[BRACO_MANDIBULA, SINAL_ASSOCIADO]],
      aviso: "Se for uma urgência médica, ligue 192 (SAMU) ou vá à UPA mais próxima.",
      mensagem: "Isso pode ser uma urgência. Ligue agora para o 192 (SAMU) ou vá à UPA mais próxima.",
      telefones: ["192"],
      pins: [{ id: "man-saude-upa-cervezao" }, { id: "man-saude-upa-estadio" }, { id: "man-saude-santa-casa" }]
    },
    risco: {
      forte: ["risco de (?:cair|desabar|desabamento)", "vai desabar", "desabando", "incendio", "pegando fogo", "alagou", "enchente", "deslizamento", "vazamento de gas", "cheiro de gas",
        "(?:queria|quero|preciso|tenho que|tenho de|vou|devo) ligar (?:para|pra|no|na|pro|ao) (?:a |o )?(?:emergencia|samu|bombeiros?|ambulancia|190|192|193)",
        "(?:nao sei|esqueci|qual|qual e|cade|onde acho|preciso d[oe]) (?:o |a )?(?:numero|telefone|contato)(?: \\w+){0,2} (?:d[aeo]s?|pra|para) (?:emergencia|samu|bombeiros?|ambulancia)",
        "(?:chamar|chamem|chame) (?:a |uma )?(?:ambulancia|samu|bombeiros)"],
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
      moderado: (TIPOS[t].moderado || []).map(function (r) { return new RegExp("(?:^| )" + r + "(?: |$)"); }),
      contexto: (TIPOS[t].contexto || []).map(function (r) { return new RegExp("(?:^| )" + r + "(?: |$)"); }),
      /* combinações: dois sinais que só juntos indicam o risco (ex.: proteção judicial + agressor que reaparece) */
      combos: (TIPOS[t].combos || []).map(function (par) { return par.map(function (r) { return new RegExp("(?:^| )" + r + "(?: |$)"); }); })
    };
  });

  function achou(lista, texto) { return lista.some(function (r) { return r.test(texto); }); }
  /* Tolerância a erro de digitação nos termos-chave de perigo: palavra com 6 letras ou mais que não é do vocabulário e está a 1 edição
     (2 se tiver 10 letras ou mais) de um termo-chave é trocada por ele numa VERSÃO ADICIONAL do texto; o texto original continua sendo avaliado.
     Palavras curtas (menos de 6 letras) só valem se escritas certo, para não trocar palavras comuns ("mate", "juiz", "samu"). */
  var VOCABULARIO = ("sangrando sangramento sangrar sangue hemorragia desmaiei desmaiou desmaiar desmaio dormencia formigamento trancada trancado trancadas " +
    "emergencia ambulancia bombeiros suicidar suicidio estrangular estrangulou espancou espancada espancado agrediu agrediram agredida agredido agredir " +
    "ameacou ameacando ameaca perseguindo perseguiu persegue protetiva protecao proibindo proibido proibiu judicial acorrentada acorrentado amarrada amarrado " +
    "machucada machucado apanhou apanhando tutelar respirar respirando convulsao engasgou infarto veneno violencia estuprada abusada abusou abusando socorro " +
    "queimadura profundo profunda inconsciente desacordado contato afastamento denuncia delegacia agressor agressora esfaqueou enforcou sufocou machucou " +
    "maltrata maltratou empurrou conselho telefone numero ligar " +
    "agredia agrediam agredindo agredira agredidos agredidas espancava espancavam espancando espancaram estrangulava estrangulando estrangularam " +
    "ameacava ameacavam ameacaram ameacada ameacado perseguia perseguiam perseguidas perseguido perseguida machucava machucavam machucando machucaram " +
    "maltratava maltratando maltrataram empurrava empurrando empurraram sufocava sufocando esfaqueava esfaqueando enforcava enforcando abusava " +
    "abusavam abusaram abusado trancava trancando trancaram apanhava apanhavam apanhado sangrava sangravam desmaiava desmaiando desmaiaram " +
    "respirava respirando acorrentava acorrentaram amarrava amarraram queimava queimando proibia proibiam proibiram contatos " +
    "trancou prendeu prenderam prendendo apontou apontaram apontando empunhou obrigou obrigaram obrigando bateram batendo chutaram sufocaram esfaquearam " +
    "enforcaram espancaram empurraram ameacaram tentou tentaram tentando").split(" ");
  var NO_VOCAB = {}; VOCABULARIO.forEach(function (w) { NO_VOCAB[w] = 1; });
  ["projecao", "projecoes", "protecoes", "numeros", "telefones", "ligara", "ligaria", "titular", "titulares", "contrato", "contratos", "contratar", "contratada", "contratado", "telefonema"].forEach(function (w) { NO_VOCAB[w] = 1; });
  /* distância de edição com transposição (Damerau/OSA), com corte em "max" */
  function distancia(a, b, max) {
    var la = a.length, lb = b.length, i, j, d = [];
    if (Math.abs(la - lb) > max) return max + 1;
    for (i = 0; i <= la; i++) { d[i] = [i]; }
    for (j = 1; j <= lb; j++) d[0][j] = j;
    for (i = 1; i <= la; i++) for (j = 1; j <= lb; j++) {
      var c = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + c);
      if (i > 1 && j > 1 && a.charAt(i - 1) === b.charAt(j - 2) && a.charAt(i - 2) === b.charAt(j - 1)) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
    return d[la][lb];
  }
  /* Neutraliza usos que NÃO são sobre risco, por categoria: cada item troca a expressão por um texto neutro ANTES das regras e do detector.
       - cvv do cartão de crédito (não é o CVV de apoio emocional);
       - "corte" de cabelo, gastos, energia... (não é ferimento).
     Outras categorias (figurados com objeto abstrato, esporte, hipérbole banal, proteção em vigor sem reaparecimento) ficam junto delas abaixo. */
  var NEUTRAS = [
    [/(?:codigo|numero|digitos?|verso|seguranca|cartao|credito|debito)(?: \w+){0,3} cvv|cvv (?:do|no|de|da|dos) (?:meu |o |a |seu )?(?:cartao|credito|debito|banco)/g, "codigo do cartao"],
    [/\bcortes? (?:de|do|da|dos|das) (?:cabelo|barba|unhas?|gastos?|custos?|orcamento|energia|luz|agua|verba|bolo|papel|tecido|grama|franja|despesas?)\b/g, "assunto comum"],
    /* figurado: "matar/morrer de" rir, vergonha, cansaço, saudade... ou "de tanto" + verbo de esforço ("matou de tanto correr").
       Ficam de fora medo, fome e sede: "me mata de fome" e "morro de medo dele" podem ser relato real. */
    [/\b(?:me |te |nos )?(?:mata|matou|mataram|matam|matando|morri|morro|morre|morremos|morrendo|morreu|morrer|morria)(?: \w+)? de (?:rir|riso|risada|risadas|vergonha|cansaco|saudade|sono|susto|calor|frio|curiosidade|emocao|alegria|inveja|preguica|tedio|orgulho|tanto (?:rir|correr|trabalhar|andar|estudar|esperar|pedalar|caminhar|dancar|cantar|pular|jogar|treinar|malhar|limpar|cozinhar|ler|falar|comer|dormir|pensar|rir))\b/g, "expressao figurada"],
    /* figurado: golpe com objeto abstrato ("tapa de motivação", "empurrão na vida/na carreira", "soco na autoestima") */
    [/\b(?:tapa|soco|chute|empurrao|empurraozinho|murro|puxao|pancada|cutucada|sacudida|beliscao|cascudo|chacoalhada)(?: \w+)? (?:de|na|no|em|pra|para) (?:a |o )?(?:motivacao|vida|carreira|realidade|ego|autoestima|humildade|confianca|animo|coragem|sorte|esperanca|inspiracao|estudos|trabalho|projeto|sonho|futuro|mercado|profissao|negocios|criatividade|perspectiva|empreendedorismo|juizo|consciencia|ideias)\b/g, "expressao figurada"],
    /* esporte e brincadeira: golpe "no treino", "na aula de luta", "no jogo", "na brincadeira" */
    [/\b(?:tapa|soco|chute|empurrao|murro|pancada|cotovelada|joelhada|golpe)s? (?:no|na|durante o|durante a) (?:treino|aula de (?:boxe|luta|judo|jiu jitsu|karate|muay thai|capoeira|taekwondo)|jogo|campeonato|luta de (?:boxe|mma|judo)|partida|brincadeira|recreio|ensaio)\b/g, "expressao esportiva"]
  ];
  /* hipérbole sobre falta banal, em contexto hipotético ("ele iria me matar se visse que comi o último pedaço de bolo"): só quando há
     marcador de hipótese/brincadeira E um item banal. Sem os dois, a ameaça continua valendo. */
  var HIPOTESE = /\b(?:iria|ia|se visse|hora que visse|quando visse|se soubesse|se descobrisse|se percebesse|brincando|de brincadeira|kkk+|haha+)\b/;
  var ITEM_BANAL = /\b(?:bolo|doce|pizza|chocolate|sorvete|pedaco|biscoito|bolacha|lanche|salgado|coxinha|pao|torrada|refrigerante|controle remoto|videogame|brinquedo|figurinha|camisa do time|chinelo|bateria do celular|carregador|tomada|blusa|esmalte|batom|maquiagem|perfume|fone|tenis)\b/;
  function neutralizar(t) {
    NEUTRAS.forEach(function (n) { t = t.replace(n[0], n[1]); });
    if (HIPOTESE.test(t) && ITEM_BANAL.test(t)) t = t.replace(/\bme (?:matar|mata|esganar|esganaria|estrangular|assassinar)\b/g, "me repreender").replace(/\bme (?:escondi|escondo|escondia|escondendo)\b/g, "me afastei");
    return t;
  }
  /* Proteção em vigor e agressor que não reaparece ("depois da medida protetiva nunca mais se aproximou, sem notícias há um ano"): relato
     resolvido, não perigo. Exige TODAS as três coisas: contexto de proteção, marcador de ausência de contato e nenhum marcador de reaparecimento. */
  var CTX_PROTECAO = /(?:^| )(?:medida protetiva|protetiva|protecao|b o|boletim|denuncia|ordem de afastamento)(?: |$)/;
  var SEM_REAPARECER = /(?:nunca mais|nao se aproximou|nao se aproxima|nao me procurou|nao me procura|nao tenho noticias|sem noticias|nao voltou|nao apareceu|faz (?:mais de )?(?:um|dois|tres|\d+) (?:ano|anos|mes|meses) que (?:nao|nunca))/;
  var REAPARECEU = /(?:voltou|descumpr|de novo|ontem|hoje|agora|rondando|esta aqui|me procurou|me ligou|me mandou|mandou mensagem|ainda (?:me|esta|vem|aparece)|apareceu(?! nunca))/;
  /* "nunca mais me procurou" é ausência de contato, não reaparecimento: as formas negadas saem antes de procurar marcador de reaparecimento */
  var NEGADOS = /(?:nunca mais|nao|nunca)(?: \w+){0,2} (?:me procurou|me procura|me ligou|me liga|me mandou|apareceu|voltou|veio|se aproximou|se aproxima|mandou mensagem)/g;
  function violenciaResolvida(vs) { return vs.every(function (v) { return CTX_PROTECAO.test(v) && SEM_REAPARECER.test(v) && !REAPARECEU.test(v.replace(NEGADOS, " ")); }); }
  /* Dor localizada comum (braço direito, costas, ombro, ciático, dente...) sem sinal de gravidade: o detector aprendido sozinho não vale. */
  var DOR_LOCAL = /(?:^| )dor(?:es)? (?:forte |leve |muita |muito )?(?:n[oa]s?|d[oae]s?|em) (?:meu |minha |o |a )?(?:braco|costas|ombros?|ciatico|nervo ciatico|joelhos?|tornozelos?|pernas?|pes?|coluna|lombar|pescoco|dentes?|garganta|ouvido|cabeca|barriga|estomago|maos?|punhos?|cotovelos?|quadril|panturrilha|coxa|tendao)(?: |$)/;
  var GRAVIDADE = /esquerd|peito|falta de ar|sem ar|formig|dorment|suor|tontur|enjo|desmai|insuport|de repente|subita|irradi|queda|caiu|acidente|pancada|sangr|convuls|inconsci|nao consigo (?:respirar|mexer|levantar|andar|falar)|muito forte|fortissima|desesper/;
  function corrigirDigitacao(t) {
    return t.split(" ").map(function (w) {
      if (w.length < 6 || NO_VOCAB[w] || /\d/.test(w)) return w;
      var limite = w.length >= 10 ? 2 : 1, melhor = null, md = 3;
      VOCABULARIO.forEach(function (v) {
        if (v.length < 6) return;
        var lim = limite;
        if (lim === 1 && w.length >= 7 && v.length >= 7 && Math.abs(w.length - v.length) <= 1 && w.charAt(0) === v.charAt(0) && w.charAt(w.length - 1) === v.charAt(v.length - 1)) lim = 2; /* mesmas letras das pontas */
        var dd = distancia(w, v, lim);
        if (dd <= lim && dd < md) { md = dd; melhor = v; }
      });
      return melhor || w;
    }).join(" ");
  }
  /* Palavras coladas: "eleme prendeu", "mebateu", "tentoume enforcar", "maridome bate". Só separa um pronome (ele, ela, me, te, nos) quando o resto da palavra
     é exatamente um termo de perigo (verbo de agressão, cárcere, arma ou o parceiro): nenhuma palavra comum é cortada. A versão separada é só MAIS UMA versão avaliada pelas regras. */
  var TERMOS_COLADOS = {};
  ("tentou bateu bate batem bateram trancou tranca trancaram prendeu prenderam prende espancou espanca obrigou obriga ameacou ameaca mata matou matar apontou " +
   "estrangulou enforcou agrediu empurrou chutou sufocou esfaqueou queimou xingou humilhou persegue perseguiu forcou marido namorado noivo companheiro padrasto " +
   "enforcar estrangular espancar deu levou quebrou").split(" ").forEach(function (w) { TERMOS_COLADOS[w] = 1; });
  var PREFIXOS_COLADOS = ["ele", "ela", "me", "te"], SUFIXOS_COLADOS = ["me", "te", "nos"];
  function descolar(t) {
    return t.split(" ").map(function (w) {
      if (w === "eleme") return "ele me";
      if (w === "elame") return "ela me";
      if (w.length < 6 || TERMOS_COLADOS[w]) return w;
      var i, r;
      if ((w.indexOf("eleme") === 0 || w.indexOf("elame") === 0) && TERMOS_COLADOS[w.slice(5)]) return w.slice(0, 3) + " me " + w.slice(5); /* "elemetrancou" */
      for (i = 0; i < PREFIXOS_COLADOS.length; i++) {
        r = w.slice(PREFIXOS_COLADOS[i].length);
        if (w.indexOf(PREFIXOS_COLADOS[i]) === 0 && TERMOS_COLADOS[r]) return PREFIXOS_COLADOS[i] + " " + r;
      }
      for (i = 0; i < SUFIXOS_COLADOS.length; i++) {
        r = w.slice(0, w.length - SUFIXOS_COLADOS[i].length);
        if (w.length > SUFIXOS_COLADOS[i].length && w.lastIndexOf(SUFIXOS_COLADOS[i]) === w.length - SUFIXOS_COLADOS[i].length && TERMOS_COLADOS[r]) return r + " " + SUFIXOS_COLADOS[i];
      }
      return w;
    }).join(" ");
  }
  function achouCombo(combos, texto) { return combos.some(function (par) { return par.every(function (r) { return r.test(texto); }); }); }

  /* Necessidade material familiar não é, por si só, evidência de violência ou perigo infantil.
     Regras explícitas de dano continuam prevalecendo; este filtro evita falso positivo do classificador aprendido. */
  function necessidadeMaterialSemDano(t) {
    var familiar = /\b(?:criancas?|filh[oa]s?|netos?|netas?|netinhos?|netinhas?)\b/.test(t);
    var material = /\b(?:aposentadoria|pensao|renda|dinheiro|beneficio|contas?|despesas?|necessidades?|mercado|alimentacao|comida|recursos?)\b/.test(t);
    var dano = /\b(?:apanh\w*|agred\w*|bat(?:e|eu|endo)|abus\w*|maltrat\w*|machuc\w*|ameac\w*|violenc\w*|tranc\w*|abandon\w*|negligenc\w*|fome|passando fome|sem comer|sem comida|perigo|socorro|ferid\w*|queimad\w*|sangr\w*)\b/.test(t);
    return familiar && material && !dano;
  }


  /* Âncoras: um alerta que vem SÓ do detector aprendido precisa de ao menos uma palavra do campo do assunto. Modelos pequenos confundem
     "vou tirar férias" com "vou tirar a minha vida"; a âncora barra esse tipo de erro sem atrapalhar as regras. */
  var ANCORAS = {
    suicidio: /(?:^| )(?:morr\w*|mort\w*|mat(?:ar|o|ei|ou|ando)|vida|acab\w*|sum(?:ir|o|ido)|desapare\w*|suicid\w*|despedid\w*|despedi|enforc\w*|corda|veneno|remedios?|comprimidos?|machuc\w*|cort(?:ar|ei|es)|pulsos?|ponte|saida|sentido|existir|existo|nascer|nasci|acord\w*|dormir|dorm\w+|ferir|jogar|pular|afog\w*|sem mim|falta|peso|cansad\w+|desist\w*|ninguem|sozinh\w+)(?: |$)/,
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
    var t2 = t.replace(/([a-z0-9])\1{2,}/g, "$1"), t4 = descolar(t2), t3 = corrigirDigitacao(t4), versoes = [t];
    if (t2 !== t) versoes.push(t2);
    if (t4 !== t2) versoes.push(t4);
    if (t3 !== t4) versoes.push(t3);
    var versoesSoRegras = (t4 !== t2 ? 1 : 0) + (t3 !== t4 ? 1 : 0); /* as versões corrigidas só alimentam as regras, nunca o detector aprendido */
    versoes = versoes.map(neutralizar);
    function emAlguma(re) { return versoes.some(function (v) { return re.test(v); }); }
    var tipos = [], nivel = 0;
    var tN = neutralizar(t), probs = detector ? detector.probabilidades(tN !== t ? tN : texto) : null, doModelo = {}, fracos = [];
    if (probs) versoes.slice(1, versoes.length - versoesSoRegras).forEach(function (v) { var pv = detector.probabilidades(v); Object.keys(pv).forEach(function (k) { if (pv[k] > probs[k]) probs[k] = pv[k]; }); });
    var resolvida = violenciaResolvida(versoes);
    ORDEM.forEach(function (tp) {
      var regra = versoes.some(function (v) { return achou(COMPILADO[tp].forte, v) || achouCombo(COMPILADO[tp].combos, v); }), p = probs ? probs[tp] : undefined, lim = detector ? detector.limiares[tp] : undefined;
      if (tp === "violencia" && resolvida) return;
      if (tp === "violencia" && !regra && versoes.some(function (v) { return achou(COMPILADO[tp].moderado, v); })) { fracos.push(tp); return; } /* só nível 1: o detector não eleva */
      if (tp === "saude" && !regra && versoes.some(function (v) { return DOR_LOCAL.test(v); }) && !versoes.some(function (v) { return GRAVIDADE.test(v); })) p = undefined;
      var alto = detector && detector.altos[tp] !== undefined ? detector.altos[tp] : lim;
      if (!regra && ANCORAS[tp] && !emAlguma(ANCORAS[tp])) p = undefined; /* o detector sozinho não vale sem uma palavra do assunto */
      if (!regra && tp === "crianca" && necessidadeMaterialSemDano(t)) p = undefined; /* pobreza e responsabilidade familiar não são alerta de abuso sem sinal de dano */
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
