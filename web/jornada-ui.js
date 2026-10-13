/* Tela das jornadas (Trabalho, Educação...): perguntas uma de cada vez -> plano curto (e, no Trabalho, montador de currículo).
   Nada é enviado nem gravado no aparelho. O que a pessoa responde fica só na memória desta página, para o plano
   não sumir quando ela abre um link do plano e volta; é apagado ao voltar ao Início, em "Recomeçar" ou ao fechar a página. */
(function (raiz) {
  "use strict";
  /* Cada jornada (trabalho, educacao...) tem o seu motor e o seu estado: assim as respostas de uma não vazam para a outra
     quando a pessoa abre um link do plano e vai para outra área. `J` e `ultimo` apontam para a jornada que está na tela. */
  var J = raiz.Jornada.de("trabalho");
  var estados = {};

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function $(id) { return document.getElementById(id); }

  /* resp: respostas; ordem: ids na ordem respondida (para o "Voltar"); puladas; feitos: passos marcados "Já fiz". */
  function novoEstado() { return { resp: {}, ordem: [], puladas: [], feitos: {}, plano: null, cvDados: null, curriculo: null }; }
  var ultimo = novoEstado();
  function usar(id) {
    J = raiz.Jornada.de(id) || raiz.Jornada.de("trabalho");
    estados[J.id] = estados[J.id] || novoEstado();
    ultimo = estados[J.id];
  }
  var achar = null; /* função id -> serviço do catálogo, entregue pelo app.js */

  function usarCatalogo(fn) { achar = fn; }

  /* ------------------------------------------------------------ estrutura */
  function html(id) {
    usar(id === true ? "trabalho" : id);
    var topo = '<section class="secao jornada" aria-labelledby="titulo-jornada">' +
      '<h2 id="titulo-jornada" tabindex="-1">' + esc(J.titulo) + '</h2>' +
      '<div id="jornada-saida" aria-live="polite"></div></section>';
    return topo + (J.temCurriculo ? htmlCurriculoSecao() : "");
  }
  function htmlCurriculoSecao() {
    return '<section class="secao curriculo" id="montar-curriculo" aria-labelledby="titulo-curriculo">' +
      '<details><summary><h2 id="titulo-curriculo">Montar um currículo</h2></summary>' +
      '<p class="meta">Preencha só o que quiser. Não coloque CPF, RG, endereço completo nem data de nascimento exata. O texto não sai deste aparelho.</p>' +
      '<form id="form-curriculo" autocomplete="off">' +
      campoTexto("c-nome", "Nome", 80) + campoTexto("c-telefone", "Telefone ou WhatsApp", 40) + campoTexto("c-email", "E-mail", 80) +
      campoTexto("c-cidade", "Cidade", 60, "Rio Claro - SP") + campoTexto("c-objetivo", "Que tipo de trabalho você procura?", 120) +
      campoArea("c-experiencias", "Experiências (uma por linha)", "Ex.: Auxiliar de cozinha, bar do João, 2022 a 2024") +
      campoArea("c-formacao", "Estudos e cursos (um por linha)", "Ex.: Ensino médio completo") +
      campoArea("c-habilidades", "O que você sabe fazer (uma por linha)", "Ex.: Atendimento ao público; costura; organização") +
      campoTexto("c-disponibilidade", "Disponibilidade de horário", 120) +
      '<div class="acoes"><button type="submit" class="btn">Gerar currículo</button><button type="button" class="btn secundario" data-limpar="curriculo">Limpar</button></div></form>' +
      '<div id="curriculo-saida" aria-live="polite"></div></details>' +
      '<div class="links-curriculo"><h3>Outras opções gratuitas</h3><ul>' +
      '<li><a href="https://word.cloud.microsoft/create/pt-br/resume-templates/" target="_blank" rel="noopener noreferrer">Modelos de currículo — Microsoft Word</a></li>' +
      '<li><a href="https://docs.google.com/document/u/0/" target="_blank" rel="noopener noreferrer">Google Docs — documentos e modelos</a></li>' +
      '<li><a href="https://www.gov.br/trabalho-e-emprego/pt-br" target="_blank" rel="noopener noreferrer">Ministério do Trabalho e Emprego</a></li>' +
      '<li><a href="https://servicos.mte.gov.br/" target="_blank" rel="noopener noreferrer">Emprega Brasil / SINE</a></li>' +
      '<li><a href="https://www.gov.br/pt-br/servicos/obter-a-carteira-de-trabalho" target="_blank" rel="noopener noreferrer">Carteira de Trabalho Digital</a></li>' +
      '</ul></div>' +
      '<div class="links-vagas"><h3>Sites para procurar emprego</h3>' +
      '<p class="meta">As opções básicas de busca e candidatura são gratuitas. Algumas plataformas oferecem recursos extras pagos; não pague para se candidatar a uma vaga.</p><ul>' +
      '<li><a href="https://www.vagas.com.br/" target="_blank" rel="noopener noreferrer">Vagas.com.br</a> — busca de vagas e alertas.</li>' +
      '<li><a href="https://br.indeed.com/" target="_blank" rel="noopener noreferrer">Indeed</a> — pesquisa por cargo, empresa e cidade.</li>' +
      '<li><a href="https://www.infojobs.com.br/" target="_blank" rel="noopener noreferrer">Infojobs</a> — cadastro de currículo e candidatura; há recursos opcionais pagos.</li>' +
      '<li><a href="https://portal.gupy.io/pt" target="_blank" rel="noopener noreferrer">Gupy</a> — vagas e etapas de seleção das empresas.</li>' +
      '<li><a href="https://br.linkedin.com/jobs" target="_blank" rel="noopener noreferrer">LinkedIn — Vagas</a> — busca de oportunidades e contato profissional.</li>' +
      '<li><a href="https://www.trabalhabrasil.com.br/" target="_blank" rel="noopener noreferrer">Trabalha Brasil</a> — classificados e busca de vagas.</li>' +
      '</ul></div>' +
      '<section class="apoio-trabalho" aria-labelledby="trabalho-agora"><h3 id="trabalho-agora">Preciso de dinheiro esta semana</h3>' +
      '<p>Para tentar conseguir renda rápida, ofereça um serviço que você já sabe fazer: faxina, passar roupa, cozinhar, cuidar de crianças ou idosos, lavar carro ou ajudar em comércio. Combine valor, horário e transporte antes. A renda varia e não há pagamento garantido.</p>' +
      '<h4>Onde oferecer seu serviço</h4><ul>' +
      '<li>Grupo de WhatsApp do bairro ou grupos locais de emprego no Facebook.</li>' +
      '<li><a href="https://www.olx.com.br/" target="_blank" rel="noopener noreferrer">OLX</a> — confira as regras da categoria de serviços.</li>' +
      '<li><a href="https://www.getninjas.com.br/" target="_blank" rel="noopener noreferrer">GetNinjas</a> — confira antes se há cobrança para receber contatos.</li>' +
      '</ul><p><strong>Mensagem para anunciar:</strong></p><blockquote><p>Faço faxina, passo roupa e ajudo com organização da casa. Tenho disponibilidade em [dias/horários]. Se precisar ou souber de alguém, me chame no privado.</p></blockquote>' +
      '<button type="button" class="btn secundario" data-copiar="anuncio">Copiar mensagem de serviço</button>' +
      '<textarea id="texto-anuncio" class="texto-copia" rows="3" readonly>Faço faxina, passo roupa e ajudo com organização da casa. Tenho disponibilidade em [dias/horários]. Se precisar ou souber de alguém, me chame no privado.</textarea>' +
      '<p class="meta">Não pague taxa para conseguir uma vaga. Para entregas por aplicativo, confirme os requisitos e o prazo de aprovação antes de contar com esse dinheiro.</p></section>' +
      '<section class="apoio-trabalho" aria-labelledby="trabalho-hoje"><h3 id="trabalho-hoje">O que posso fazer hoje</h3>' +
      '<ul class="lista-check">' +
      '<li><label><input type="checkbox"> Separei documento de identidade, CPF e comprovante de residência, se tiver.</label></li>' +
      '<li><label><input type="checkbox"> Consultei ou baixei a <a href="https://www.gov.br/pt-br/servicos/obter-a-carteira-de-trabalho" target="_blank" rel="noopener noreferrer">Carteira de Trabalho Digital</a>.</label></li>' +
      '<li><label><input type="checkbox"> Procurei o <a href="https://servicos.mte.gov.br/" target="_blank" rel="noopener noreferrer">Emprega Brasil / SINE</a> ou o PAT da minha cidade.</label></li>' +
      '</ul><p class="meta">Se não tiver todos os documentos, não desista: pergunte ao PAT ou ao CRAS como regularizar sua situação.</p></section>' +
      '<section class="apoio-trabalho" aria-labelledby="cv-sem-experiencia"><h3 id="cv-sem-experiencia">Nunca trabalhei. O que coloco no currículo?</h3>' +
      '<p>Você pode destacar habilidades, trabalhos informais, cuidados, atividades voluntárias, cursos e disponibilidade. Não invente emprego nem experiência formal.</p>' +
      '<p><strong>Exemplo para adaptar:</strong></p><pre class="modelo-curriculo">[NOME]\n[Telefone/WhatsApp] · [Bairro e cidade]\n\nOBJETIVO\nTrabalhar como [atendente, auxiliar de limpeza, ajudante de cozinha ou outra função]\n\nHABILIDADES\n• Organização e cuidado com ambientes\n• Atendimento e comunicação respeitosa\n• Uso de celular e WhatsApp\n• [Outras habilidades que você realmente tem]\n\nEXPERIÊNCIA E ATIVIDADES\n[Trabalhos informais, ajuda em negócio familiar, voluntariado ou outras atividades reais]\n\nESTUDOS E CURSOS\n[Escolaridade e cursos, se houver]\n\nDISPONIBILIDADE\n[Manhã, tarde, noite ou integral]</pre>' +
      '<button type="button" class="btn secundario" data-copiar="modelo">Copiar modelo de currículo</button>' +
      '<textarea id="texto-modelo" class="texto-copia" rows="8" readonly>[NOME]\n[Telefone/WhatsApp] · [Bairro e cidade]\n\nOBJETIVO\nTrabalhar como [função desejada]\n\nHABILIDADES\n[Liste habilidades reais]\n\nEXPERIÊNCIA E ATIVIDADES\n[Trabalhos informais, voluntariado ou atividades reais]\n\nESTUDOS E CURSOS\n[Escolaridade e cursos, se houver]\n\nDISPONIBILIDADE\n[Horários em que pode trabalhar]</textarea>' +
      '</section>' +
      '<section class="apoio-trabalho" aria-labelledby="trabalho-sem-experiencia"><h3 id="trabalho-sem-experiencia">Onde procurar trabalho sem experiência</h3>' +
      '<p>Tente perguntar diretamente sobre vagas de entrada em supermercados, padarias, lojas, restaurantes, hotéis, condomínios, empresas de limpeza, salões, clínicas e cozinhas. A contratação depende de cada empregador.</p>' +
      '<blockquote><p>Bom dia. Estou procurando trabalho e tenho interesse em [área/função]. Vocês estão recebendo currículos ou têm alguma vaga? Posso deixar meu contato?</p></blockquote>' +
      '</section>' +
      '<section class="apoio-trabalho" aria-labelledby="trabalho-direitos"><h3 id="trabalho-direitos">Serviços públicos e cursos gratuitos</h3><ul>' +
      '<li><a href="https://servicos.mte.gov.br/" target="_blank" rel="noopener noreferrer">Emprega Brasil / SINE</a> — consulta de vagas e serviços de emprego.</li>' +
      '<li><a href="https://www.gov.br/pt-br/servicos/obter-a-carteira-de-trabalho" target="_blank" rel="noopener noreferrer">Carteira de Trabalho Digital</a>.</li>' +
      '<li><a href="https://www.gov.br/pt-br/servicos/solicitar-o-seguro-desemprego" target="_blank" rel="noopener noreferrer">Seguro-desemprego</a> — depende dos requisitos e da situação de desligamento.</li>' +
      '<li><a href="https://www.gov.br/mds/pt-br/acoes-e-programas/bolsa-familia" target="_blank" rel="noopener noreferrer">Bolsa Família</a> — regras e elegibilidade são avaliadas pelo programa.</li>' +
      '<li><a href="https://www.gov.br/aneel/pt-br/assuntos/tarifa-social" target="_blank" rel="noopener noreferrer">Tarifa Social de Energia Elétrica</a> — consulte os critérios atuais.</li>' +
      '<li><a href="https://www.ev.org.br/" target="_blank" rel="noopener noreferrer">Fundação Bradesco</a> — cursos on-line gratuitos.</li>' +
      '<li><a href="https://www.qualificasp.sp.gov.br/" target="_blank" rel="noopener noreferrer">Qualifica SP</a> — confira turmas e inscrições abertas.</li>' +
      '</ul><p>O CRAS pode orientar sobre CadÚnico e benefícios sociais. Nenhum benefício é automático: confirme os critérios e a documentação.</p>' +
      '<h4>Direitos básicos, em palavras simples</h4><p>Carteira assinada registra o vínculo de emprego. Vale-transporte ajuda no deslocamento conforme as regras. Férias, 13º salário e FGTS têm regras próprias; consulte os canais oficiais para entender cada caso.</p></section>' +
      '<section class="apoio-trabalho" aria-labelledby="trabalho-entrevista"><h3 id="trabalho-entrevista">Antes da entrevista</h3><ul>' +
      '<li>Use roupa limpa, inteira e confortável. Você não precisa comprar roupa, sapato ou maquiagem para participar de uma entrevista.</li><li>Veja se tem alguma peça emprestada com alguém de confiança; escolha algo que permita sentar, andar e se movimentar à vontade.</li><li>Se puder, pesquise o tipo de ambiente da empresa, mas não deixe de comparecer só porque não tem roupa social.</li><li>Confira endereço, horário e como chegar. Leve o currículo no celular ou impresso, se tiver.</li><li>Se precisar de cuidado para os filhos, tente combinar com alguém de confiança e pense num plano alternativo.</li></ul>' +
      '<h4>Leituras úteis: como se vestir sem gastar</h4><p>Estas orientações ajudam a escolher uma roupa adequada usando o que você já tem. São dicas, não regras obrigatórias: a roupa não define sua competência.</p><ul>' +
      '<li><a href="https://mepoupe.com/dicas-de-riqueza/procurando-emprego-como-se-vestir-sem-gastar-a-grana-que-voce-nao-tem/" target="_blank" rel="noopener noreferrer">Me Poupe! — Como se vestir sem gastar a grana que você não tem</a></li>' +
      '<li><a href="https://www.ciadeestagios.com.br/guia-profissional/como-se-vestir/" target="_blank" rel="noopener noreferrer">Cia de Estágios — Como se vestir para uma entrevista de emprego</a></li>' +
      '</ul><h4>“Fale sobre você”</h4><p>“Sou [nome], estou procurando uma oportunidade em [área]. Sou [qualidade verdadeira], aprendo com orientação e posso contribuir com [habilidade real].”</p>' +
      '<h4>“Por que quer trabalhar aqui?”</h4><p>“Tenho interesse nessa função e quero aprender e fazer um bom trabalho. Pelo que conheço, posso contribuir com [algo ligado à vaga].”</p>' +
      '<h4>“Qual é seu ponto a desenvolver?”</h4><p>Escolha algo verdadeiro e explique como está melhorando. Por exemplo: “Ainda tenho pouca experiência formal, então estou buscando aprender e praticar.”</p></section>' +
      '<section class="apoio-trabalho" aria-labelledby="trabalho-rede"><h3 id="trabalho-rede">Peça ajuda à sua rede</h3>' +
      '<p>Enviar uma mensagem a pessoas de confiança pode ajudar a encontrar oportunidades. Não existe garantia, mas você não precisa procurar sozinha.</p>' +
      '<textarea id="texto-rede" class="texto-copia" rows="4" readonly>Oi, tudo bem? Estou procurando trabalho como [cargo/área]. Se você souber de alguma vaga ou alguém que precise, pode me avisar? Posso mandar meu currículo. Obrigada!</textarea>' +
      '<button type="button" class="btn secundario" data-copiar="rede">Copiar mensagem para WhatsApp</button>' +
      '<p class="meta">Compartilhe só com quem você se sente segura. Não publique documentos pessoais em grupos.</p></section>' +
      '<section class="apoio-trabalho" aria-labelledby="trabalho-golpes"><h3 id="trabalho-golpes">Cuidado com golpes de emprego</h3><ul>' +
      '<li>Desconfie se cobrarem PIX ou taxa para contratar ou garantir vaga.</li><li>Desconfie de salário muito alto com promessa de contratação fácil e imediata.</li><li>Confirme a empresa e a vaga por um canal oficial.</li><li>Não envie foto de documentos nem dados bancários antes de confirmar a legitimidade e a necessidade.</li><li>Leia com cuidado se pedirem para comprar curso, material ou equipamento para poder trabalhar.</li></ul>' +
      '</section>' +
      '<section class="apoio-trabalho" aria-labelledby="trabalho-apoio"><h3 id="trabalho-apoio">Se o desânimo apertar</h3>' +
      '<p>Ficar sem trabalho não define seu valor. Faça um passo possível por vez e peça apoio a alguém de confiança. O <a href="https://cvv.org.br/" target="_blank" rel="noopener noreferrer">CVV</a> atende pelo 188, gratuitamente, 24 horas por dia. Para apoio social, procure o CRAS do seu território.</p>' +
      '</section></section>';
  }
  function campoTexto(id, rotulo, max, valor) {
    return '<div class="campo"><label for="' + id + '">' + esc(rotulo) + '</label><input id="' + id + '" type="text" maxlength="' + max + '" autocomplete="off"' + (valor ? ' value="' + esc(valor) + '"' : "") + "></div>";
  }
  function campoArea(id, rotulo, dica) {
    return '<div class="campo"><label for="' + id + '">' + esc(rotulo) + '</label><textarea id="' + id + '" rows="3" maxlength="900" autocomplete="off" placeholder="' + esc(dica) + '"></textarea></div>';
  }

  /* ------------------------------------------------------------ perguntas */
  function htmlPergunta(prox) {
    var p = prox.pergunta;
    var opcoes = p.opcoes.map(function (o) {
      return '<button type="button" class="opcao-btn" data-resp="' + esc(p.id) + '" data-valor="' + esc(o[0]) + '">' + esc(o[1]) + "</button>";
    }).join("");
    var voltar = ultimo.ordem.length || ultimo.puladas.length
      ? '<button type="button" class="link-btn" data-passo="voltar">← Voltar</button>' : "";
    var pular = p === J.PERGUNTAS[0] ? "" : '<button type="button" class="link-btn" data-passo="pular">Prefiro não responder</button>';
    /* Quando a primeira resposta decide quais perguntas vêm depois, ainda não dá para dizer quantas são. */
    var semTotal = J.primeiraDecideCaminho && prox.numero === 1;
    return '<div class="etapa"><p class="progresso">Pergunta ' + prox.numero + (semTotal ? "" : " de " + prox.total) + '</p>' +
      '<div class="barra" aria-hidden="true"><span style="width:' + Math.round((prox.numero - 1) / prox.total * 100) + '%"></span></div>' +
      '<h3 class="pergunta-texto" id="pergunta-foco" tabindex="-1">' + esc(p.texto) + '</h3>' +
      '<div class="opcoes-grade">' + opcoes + "</div>" +
      '<div class="rodape-etapa">' + voltar + pular + "</div>" +
      '<p class="meta">Nada do que você responde é enviado ou guardado no aparelho.</p></div>';
  }

  /* ------------------------------------------------------------ plano */
  function ehInterno(url) { return String(url).charAt(0) === "#"; }
  function nomeDestino(url) {
    if (url === "#transporte") return "área Transporte deste site";
    if (url === "#saude" || /^#saude\//.test(url)) return "área Saúde deste site";
    if (url === "#assistencia") return "área Assistência Social deste site";
    if (/^#educacao/.test(url)) return "área Educação deste site";
    return "este site";
  }
  function telHref(tel) {
    if (/^\d{3}$/.test(String(tel).trim())) return "tel:" + String(tel).trim(); /* 100, 180, 190... */
    var m = /\(?(\d{2})\)?\s*(\d{4,5})[-\s]?(\d{4})/.exec(String(tel));
    return m ? "tel:+55" + m[1] + m[2] + m[3] : null;
  }

  function htmlContato(c, paraPapel) {
    if (!c) return "";
    var href = telHref(c.telefone);
    if (paraPapel || !href) return '<p class="contato-passo">' + esc(c.nome) + ": <strong>" + esc(c.telefone) + "</strong></p>";
    return '<p class="contato-passo">Ligar: ' + esc(c.nome) + ' — <a class="tel" href="' + href + '">' + esc(c.telefone) + "</a></p>";
  }

  function htmlAcao(a, paraPapel) {
    if (!a) return "";
    if (paraPapel) {
      if (a.tipo === "externo") return "<p>" + esc(a.rotulo) + ": " + esc(a.alvo) + "</p>";
      if (a.tipo === "interno") return "<p>" + esc(a.rotulo) + " (" + nomeDestino(a.alvo) + ")</p>";
      return "<p>" + esc(a.rotulo) + " (montador de currículo deste site)</p>";
    }
    if (a.tipo === "interno") return '<p><a class="btn" href="' + esc(a.alvo) + '">' + esc(a.rotulo) + "</a></p>";
    if (a.tipo === "externo") return '<p><a class="btn" href="' + esc(a.alvo) + '" target="_blank" rel="noopener noreferrer">' + esc(a.rotulo) + " ↗</a></p>";
    return '<p><button type="button" class="btn" data-curriculo="1">' + esc(a.rotulo) + "</button></p>";
  }

  function htmlDetalhes(p, paraPapel) {
    var blocos = "";
    if (p.leve.length) blocos += "<h4>O que levar</h4><ul>" + p.leve.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>";
    if (p.pergunte.length) blocos += "<h4>O que perguntar</h4><ul>" + p.pergunte.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>";
    if (p.extras.length) {
      blocos += "<h4>Outros lugares</h4><ul>" + p.extras.map(function (l) {
        return paraPapel ? "<li>" + esc(l[0]) + " — " + esc(l[1]) + "</li>"
          : '<li><a href="' + esc(l[1]) + '" target="_blank" rel="noopener noreferrer">' + esc(l[0]) + "</a> — " + esc(l[2]) + "</li>";
      }).join("") + "</ul>";
    }
    blocos += '<p><strong>Se não der certo:</strong> ' + esc(p.alternativa) + "</p>";
    if (paraPapel) return blocos;
    return '<details class="mais-passo"><summary>Detalhes e o que fazer se não der certo</summary>' + blocos + "</details>";
  }

  function htmlPasso(p, destaque, paraPapel) {
    var feito = !paraPapel && ultimo.feitos[p.id];
    var cab = destaque ? '<p class="selo">Comece por aqui</p>' : "";
    var marca = paraPapel ? "" :
      '<label class="ja-fiz"><input type="checkbox" data-feito="' + esc(p.id) + '"' + (feito ? " checked" : "") + "> Já fiz</label>";
    return '<li class="passo' + (destaque ? " destaque" : "") + (feito ? " feito" : "") + '" id="passo-' + esc(p.id) + '">' + cab +
      "<h3>" + p.numero + ". " + esc(p.titulo) + "</h3><p>" + esc(p.porque) + "</p>" +
      htmlAcao(p.acao, paraPapel) + htmlContato(p.contato, paraPapel) + htmlDetalhes(p, paraPapel) + marca + "</li>";
  }

  function htmlPlano(plano, paraPapel) {
    if (!plano.passos.length) {
      return '<p class="vazio">Não encontrei passos para sugerir com essas respostas. Escolha o que você quer agora e tente de novo.</p>';
    }
    var n = plano.primeiros || 3, todos = plano.passos;
    var avisos = '<div class="status" role="note">' + plano.avisos.map(function (a) { return "<p>" + esc(a) + "</p>"; }).join("") + "</div>";
    var ap = plano.apoio;
    if (ap) {
      avisos = (paraPapel
        ? "<p>" + esc(ap.texto) + " (" + esc(ap.rotulo) + ")</p>"
        : '<aside class="apoio-extra"><p>' + esc(ap.texto) + '</p><p><a class="btn secundario" href="' + esc(ap.alvo) + '">' + esc(ap.rotulo) + "</a></p></aside>") + avisos;
    }
    if (paraPapel) {
      return '<ol class="plano">' + todos.map(function (p, i) { return htmlPasso(p, i === 0, true); }).join("") + "</ol>" + avisos;
    }
    var visiveis = todos.slice(0, n), resto = todos.slice(n);
    return '<ol class="plano">' + visiveis.map(function (p, i) { return htmlPasso(p, i === 0, false); }).join("") + "</ol>" +
      (resto.length ? '<details class="resto"><summary>Ver mais ' + resto.length + (resto.length === 1 ? " passo" : " passos") + "</summary>" +
        '<ol class="plano" start="' + (n + 1) + '">' + resto.map(function (p) { return htmlPasso(p, false, false); }).join("") + "</ol></details>" : "") + avisos;
  }

  function resumoRespostas() {
    var partes = [];
    J.PERGUNTAS.forEach(function (p) {
      var v = ultimo.resp[p.id];
      if (v === undefined) return;
      p.opcoes.forEach(function (o) { if (o[0] === v) partes.push(o[1]); });
    });
    return partes;
  }

  function htmlPlanoTela() {
    ultimo.plano = J.montarPlano(ultimo.resp, achar);
    var qtd = ultimo.plano.passos.length;
    return '<div class="plano-tela"><h3 id="plano-foco" tabindex="-1">Seu plano: ' + qtd + (qtd === 1 ? " passo" : " passos") + "</h3>" +
      '<p class="meta">Faça um de cada vez, na ordem. Marque “Já fiz” para acompanhar.</p>' +
      htmlPlano(ultimo.plano, false) +
      '<div class="acoes">' + (qtd ? '<button type="button" class="btn" data-imprimir="plano">Imprimir ou salvar em PDF</button>' : "") +
      '<button type="button" class="btn secundario" data-passo="refazer">Mudar minhas respostas</button>' +
      '<button type="button" class="btn secundario" data-limpar="plano">Recomeçar</button></div></div>';
  }

  function desenhar(focar) {
    var saida = $("jornada-saida"); if (!saida) return;
    var prox = J.proxima(ultimo.resp, ultimo.puladas);
    saida.innerHTML = prox ? htmlPergunta(prox) : htmlPlanoTela();
    if (focar) {
      var alvo = $(prox ? "pergunta-foco" : "plano-foco");
      if (alvo) { alvo.focus({ preventScroll: true }); }
      var topo = $("titulo-jornada"); if (topo && topo.scrollIntoView) topo.scrollIntoView({ block: "start" });
    }
  }

  /* ------------------------------------------------------------ currículo */
  function htmlCurriculo(cv) {
    if (cv.vazio) return '<p class="vazio">Preencha pelo menos o nome ou uma das seções para gerar o currículo.</p>';
    return '<article class="curriculo-folha">' + (cv.nome ? "<h3>" + esc(cv.nome) + "</h3>" : "") +
      (cv.contato.length ? '<p class="contato">' + cv.contato.map(esc).join(" · ") + "</p>" : "") +
      cv.secoes.map(function (s) {
        return "<h4>" + esc(s.titulo) + "</h4><ul>" + s.itens.map(function (i) { return "<li>" + esc(i) + "</li>"; }).join("") + "</ul>";
      }).join("") + "</article>";
  }

  var CAMPOS_CV = ["nome", "telefone", "email", "cidade", "objetivo", "experiencias", "formacao", "habilidades", "disponibilidade"];

  function mostrarCurriculo() {
    ultimo.curriculo = J.montarCurriculo(ultimo.cvDados);
    var avisos = J.dadosDesnecessarios(ultimo.cvDados);
    $("curriculo-saida").innerHTML = htmlCurriculo(ultimo.curriculo) +
      (avisos.length ? '<p class="aviso-nao-conferido">Atenção: ' + esc(avisos.join(", ")) + ". Currículo não precisa desse dado: apague antes de imprimir.</p>" : "") +
      (ultimo.curriculo.vazio ? "" : '<div class="acoes"><button type="button" class="btn" data-imprimir="curriculo">Imprimir ou salvar em PDF</button></div>');
  }

  /* Ao reabrir a área (por exemplo, ao voltar de um link do plano), recoloca o que estava na memória. */
  function restaurar() {
    desenhar(false);
    if (ultimo.cvDados) {
      CAMPOS_CV.forEach(function (k) { var el = $("c-" + k); if (el && ultimo.cvDados[k] != null) el.value = ultimo.cvDados[k]; });
      var det = document.querySelector("#montar-curriculo details"); if (det) det.open = true;
      mostrarCurriculo();
    }
  }

  function hoje() {
    var d = new Date();
    return ("0" + d.getDate()).slice(-2) + "/" + ("0" + (d.getMonth() + 1)).slice(-2) + "/" + d.getFullYear();
  }

  /* Folha só para impressão: criada na hora, esvaziada logo depois. Nada fica guardado. */
  function imprimir(conteudo) {
    var f = $("folha-impressao");
    if (!f) { f = document.createElement("div"); f.id = "folha-impressao"; f.className = "folha-impressao"; document.body.appendChild(f); }
    f.innerHTML = conteudo;
    window.print();
  }
  function limparFolha() { var f = $("folha-impressao"); if (f) f.innerHTML = ""; }

  function limpar() {
    estados = {};
    ultimo = novoEstado();
    limparFolha();
  }

  /* ------------------------------------------------------------ ligação */
  function responder(id, valor) {
    var novo = {};
    Object.keys(ultimo.resp).forEach(function (k) { novo[k] = ultimo.resp[k]; });
    novo[id] = valor;
    ultimo.resp = J.limpar(novo);
    ultimo.ordem = ultimo.ordem.filter(function (x) { return x !== id; });
    if (ultimo.resp[id] !== undefined) ultimo.ordem.push(id);
    /* Se uma resposta tirou perguntas do caminho (ex.: filhos = não), esquece as respostas e puladas que sobraram. */
    var validas = J.aplicaveis(ultimo.resp).map(function (p) { return p.id; });
    ultimo.ordem = ultimo.ordem.filter(function (x) { return validas.indexOf(x) !== -1; });
    ultimo.puladas = ultimo.puladas.filter(function (x) { return validas.indexOf(x) !== -1; });
    ultimo.feitos = {};
  }

  function voltar() {
    /* Desfaz a última ação: a última pergunta respondida ou pulada. */
    var proxima = J.proxima(ultimo.resp, ultimo.puladas);
    var todas = J.aplicaveis(ultimo.resp).map(function (p) { return p.id; });
    var limite = proxima ? todas.indexOf(proxima.pergunta.id) : todas.length;
    var anterior = null;
    for (var i = limite - 1; i >= 0; i--) {
      var id = todas[i];
      if (ultimo.resp[id] !== undefined || ultimo.puladas.indexOf(id) !== -1) { anterior = id; break; }
    }
    if (!anterior) return;
    delete ultimo.resp[anterior];
    ultimo.resp = J.limpar(ultimo.resp);
    ultimo.ordem = ultimo.ordem.filter(function (x) { return x !== anterior; });
    ultimo.puladas = ultimo.puladas.filter(function (x) { return x !== anterior; });
    ultimo.feitos = {};
  }

  function ligar() {
    document.addEventListener("submit", function (e) {
      if (e.target.id === "form-curriculo") {
        e.preventDefault();
        var d = {};
        CAMPOS_CV.forEach(function (k) { d[k] = $("c-" + k).value; });
        ultimo.cvDados = d;
        mostrarCurriculo();
      }
    });
    document.addEventListener("change", function (e) {
      var c = e.target && e.target.getAttribute ? e.target.getAttribute("data-feito") : null;
      if (c) {
        if (e.target.checked) ultimo.feitos[c] = true; else delete ultimo.feitos[c];
        var li = $("passo-" + c); if (li) li.classList.toggle("feito", !!e.target.checked);
      }
    });
    document.addEventListener("click", function (e) {
      var t = e.target.closest ? e.target.closest("[data-resp],[data-passo],[data-curriculo],[data-imprimir],[data-limpar],[data-copiar]") : null;
      if (!t) return;
      if (t.hasAttribute("data-copiar")) {
        var tipoCopia = t.getAttribute("data-copiar");
        var campoCopia = tipoCopia === "anuncio" ? $("texto-anuncio") : tipoCopia === "modelo" ? $("texto-modelo") : $("texto-rede");
        if (campoCopia) {
          campoCopia.focus(); campoCopia.select();
          var copiou = false;
          try { copiou = document.execCommand("copy"); } catch (_) {}
          if (copiou) { t.textContent = "Mensagem copiada"; }
          else { t.textContent = "Texto selecionado: use Ctrl+C para copiar"; }
        }
      } else if (t.hasAttribute("data-resp")) {
        responder(t.getAttribute("data-resp"), t.getAttribute("data-valor"));
        desenhar(true);
      } else if (t.getAttribute("data-passo") === "voltar") {
        voltar(); desenhar(true);
      } else if (t.getAttribute("data-passo") === "pular") {
        var prox = J.proxima(ultimo.resp, ultimo.puladas);
        if (prox) ultimo.puladas.push(prox.pergunta.id);
        desenhar(true);
      } else if (t.getAttribute("data-passo") === "refazer") {
        ultimo.resp = {}; ultimo.ordem = []; ultimo.puladas = []; ultimo.feitos = {}; ultimo.plano = null;
        desenhar(true);
      } else if (t.hasAttribute("data-curriculo")) {
        var alvo = $("montar-curriculo");
        if (alvo) {
          var det = alvo.querySelector("details"); if (det) det.open = true;
          alvo.scrollIntoView({ block: "start" });
          var campo = $("c-nome"); if (campo) campo.focus({ preventScroll: true });
        }
      } else if (t.getAttribute("data-limpar") === "plano") {
        ultimo.resp = {}; ultimo.ordem = []; ultimo.puladas = []; ultimo.feitos = {}; ultimo.plano = null;
        desenhar(true);
      } else if (t.getAttribute("data-limpar") === "curriculo") {
        $("form-curriculo").reset(); $("curriculo-saida").innerHTML = ""; ultimo.cvDados = null; ultimo.curriculo = null;
      } else if (t.getAttribute("data-imprimir") === "plano" && ultimo.plano) {
        imprimir("<h1>" + esc(J.tituloImpressao) + "</h1><p>Mulher em Rede · Rio Claro/SP · gerado em " + hoje() + "</p>" + htmlPlano(ultimo.plano, true) +
          "<p>Confirme sempre telefone, endereço, horário e vagas diretamente com cada órgão antes de ir.</p>");
      } else if (t.getAttribute("data-imprimir") === "curriculo" && ultimo.curriculo) {
        imprimir(htmlCurriculo(ultimo.curriculo));
      }
    });
    window.addEventListener("afterprint", limparFolha);
  }

  raiz.JornadaUI = { html: html, ligar: ligar, limpar: limpar, restaurar: restaurar, usarCatalogo: usarCatalogo, htmlPlano: htmlPlano, htmlCurriculo: htmlCurriculo };
})(typeof self !== "undefined" ? self : this);
