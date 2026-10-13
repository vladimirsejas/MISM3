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
    return topo + (J.id === "trabalho" ? htmlRendaImediata() : "") + (J.temCurriculo ? htmlCurriculoSecao() : "");
  }
  function htmlRendaImediata() {
    return '<section class="secao renda-imediata" id="renda-imediata" aria-labelledby="titulo-renda-imediata">' +
      '<h2 id="titulo-renda-imediata">Preciso de dinheiro esta semana</h2>' +
      '<p>Comece por trabalhos pontuais perto de casa. Confirme pagamento, horário e transporte antes de aceitar. A disponibilidade varia: esta lista não é promessa de vaga.</p>' +
      '<h3>Onde procurar primeiro</h3>' +
      '<ul>' +
      '<li><strong>Buffets infantis e festas:</strong> recepção, servir convidados, ajudar a montar mesas, recolher pratos, lavar louça e organizar o salão. Buffets e espaços de festa podem precisar de reforço temporário em fins de semana; pergunte diretamente como se candidatar e quando pagam.</li>' +
      '<li><strong>Bares, lanchonetes e pizzarias:</strong> apoio na cozinha, lavagem de louça, montagem de pedidos e limpeza no fechamento.</li>' +
      '<li><strong>Feiras e comércio de bairro:</strong> ajudar na montagem ou desmontagem, limpeza, reposição e organização; combine previamente se o pagamento será em dinheiro ou outra forma.</li>' +
      '<li><strong>Serviços perto de casa:</strong> faxina, organização de armários, quintais e limpeza pós-obra; passar roupa e pequenos consertos de costura, como botões e barras.</li>' +
      '<li><strong>Apoio comunitário:</strong> acompanhar pessoa idosa em compras ou consultas, ou ajudar uma família com trajeto escolar de criança, sempre com acordo claro e referências de confiança.</li>' +
      '<li><strong>Comida por encomenda:</strong> bolos simples, doces ou marmitas somente após confirmar o pedido e combinar sinal suficiente para comprar os ingredientes. Não produza estoque nem pegue empréstimo para começar.</li>' +
      '<li><strong>Pequenos reparos:</strong> só ofereça tarefas que você realmente sabe fazer, com ferramentas adequadas e segurança; não aceite serviço elétrico ou perigoso sem qualificação.</li>' +
      '</ul>' +
      '<h3>Quanto sobra de verdade?</h3>' +
      '<p>Preencha os valores para descontar passagem, alimentação e cuidado das crianças. Use zero quando não houver esse gasto.</p>' +
      '<div class="campo"><label for="renda-bruta">Pagamento combinado (R$)</label><input id="renda-bruta" type="number" min="0" step="0.01" inputmode="decimal" value="120"></div>' +
      '<div class="campo"><label for="renda-transporte">Transporte ida e volta (R$)</label><input id="renda-transporte" type="number" min="0" step="0.01" inputmode="decimal" value="0"></div>' +
      '<div class="campo"><label for="renda-alimentacao">Alimentação extra (R$)</label><input id="renda-alimentacao" type="number" min="0" step="0.01" inputmode="decimal" value="0"></div>' +
      '<div class="campo"><label for="renda-cuidado">Cuidado das crianças (R$)</label><input id="renda-cuidado" type="number" min="0" step="0.01" inputmode="decimal" value="0"></div>' +
      '<button type="button" class="btn" data-calcular-renda="1">Calcular quanto sobra</button>' +
      '<p id="renda-liquida" role="status" aria-live="polite">Saldo após os gastos: R$ 120,00. Não inclui outros custos nem garante que o serviço compense.</p>' +
      '<h3>Proteção contra golpes e exploração</h3>' +
      '<ul><li>Não pague taxa para conseguir emprego, fazer exame admissional, comprar uniforme obrigatório ou participar de treinamento prometido como garantia de contratação.</li>' +
      '<li>Evite plataformas que exigem recarga ou compra de créditos para liberar contatos. O GetNinjas, por exemplo, pode cobrar créditos de profissionais; não é uma opção gratuita garantida.</li>' +
      '<li>Antes de ir a uma residência: compartilhe localização e endereço com alguém de confiança, combine horário de saída e valor total por escrito. Evite imóvel vazio ou local isolado e vá embora se sentir risco.</li>' +
      '<li>Para festas e buffets, confirme o nome e endereço do estabelecimento, responsável, horário, tarefa, valor e data do pagamento antes do turno. Não entregue documentos originais.</li></ul>' +
      '<h3>Mensagem pronta para enviar</h3>' +
      '<p>Copie e adapte o texto abaixo para buffets, lanchonetes, comércios e grupos do bairro:</p>' +
      '<textarea id="mensagem-renda" rows="5" readonly>Olá! Estou procurando trabalho temporário em Rio Claro, inclusive aos fins de semana. Posso ajudar com organização, limpeza, cozinha, atendimento ou apoio em festas e buffets infantis, conforme a função. Tenho disponibilidade em [dias/horários] e posso conversar para combinar tarefas, valor e pagamento. Se souber de alguma oportunidade, agradeço o contato!</textarea>' +
      '<p class="meta">Antes de enviar, preencha seus dias e horários. Não publique endereço residencial nem documentos em grupos abertos.</p>' +
      '</section>';
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
      '<section class="dicas-entrevista" aria-labelledby="titulo-dicas-entrevista">' +
      '<h2 id="titulo-dicas-entrevista">Como se vestir para a entrevista sem gastar</h2>' +
      '<p>Você não precisa comprar roupa, sapato ou maquiagem para conseguir uma entrevista.</p>' +
      '<ul><li>Escolha uma roupa limpa, inteira e confortável, que permita sentar e se movimentar.</li>' +
      '<li>Prefira peças simples e discretas que você já tem; não precisa ser roupa social cara.</li>' +
      '<li>Confira se a roupa está seca e, se possível, sem amassados. Um calçado limpo e seguro já serve.</li>' +
      '<li>Se quiser e puder, peça uma peça emprestada. Não se endivide nem deixe de ir à entrevista por não ter roupa nova.</li>' +
      '<li>Se a entrevista for por vídeo, procure um lugar iluminado e tranquilo e teste o áudio antes.</li></ul>' +
      '<h3>Cabelo: arrumado sem gastar</h3>' +
      '<ul><li>Use o penteado que você já sabe fazer e que deixa você confortável: preso, solto ou trançado.</li>' +
      '<li>Se o cabelo estiver limpo, mas não der tempo de lavar, escolha um penteado simples; não precisa comprar produto nem ir ao salão.</li>' +
      '<li>Prenda mechas que caiam no rosto se isso ajudar você a trabalhar ou conversar com tranquilidade. Para vagas de cozinha e alimentação, siga as regras de higiene e proteção do estabelecimento.</li></ul>' +
      '<h3>Unhas: simples e limpas já bastam</h3>' +
      '<ul><li>Lave e limpe as unhas; se puder, apare ou lixe as pontas para não enganchar.</li>' +
      '<li>Esmalte é opcional. Não precisa pintar, comprar esmalte ou fazer manicure para uma entrevista.</li>' +
      '<li>Para vagas de cozinha, saúde e cuidado, podem existir regras específicas de unhas curtas, sem esmalte ou sem unhas artificiais. Siga as regras do local.</li></ul>' +
      '<h3>Links gratuitos para se preparar</h3>' +
      '<ul><li><a href="https://www.gov.br/mds/pt-br/noticias-e-conteudos/publicacoes/desenvolvimento-social/CadernoAcessuas_Oficinas_de_Criatividade_2022.pdf" target="_blank" rel="noopener noreferrer">Guia gratuito do Governo Federal: dicas para entrevista</a> — inclui vestuário, cabelo, unhas e preparação.</li>' +
      '<li><a href="https://prefeitura.sp.gov.br/web/desenvolvimento/w/dicas/entrevista_de_emprego/623" target="_blank" rel="noopener noreferrer">Prefeitura de São Paulo: como se preparar para a entrevista</a> — higiene, apresentação e comportamento.</li>' +
      '<li><a href="https://www.gov.br/trabalho-e-emprego/pt-br/pdfs/manual-de-empregabilidade-e-lgbti-original.pdf/%40%40download/file" target="_blank" rel="noopener noreferrer">Manual de empregabilidade do Ministério do Trabalho</a> — orientações para entrevista.</li></ul>' +
      '<p>O mais importante é comparecer com conforto e segurança. Roupa, cabelo e unhas não medem sua capacidade de trabalhar. Não se endivide nem deixe de ir a uma entrevista por não ter dinheiro para se arrumar.</p>' +
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
    /* Educação não recebe o convite de Trabalho dentro do resultado: a ligação entre áreas fica nos atalhos próprios da página. */
    if (ap && J.id !== "educacao") {
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
      '<div class="acoes">' + (qtd && J.id !== "educacao" ? '<button type="button" class="btn" data-imprimir="plano">Imprimir ou salvar em PDF</button>' : "") +
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
      var t = e.target.closest ? e.target.closest("[data-resp],[data-passo],[data-curriculo],[data-imprimir],[data-limpar]") : null;
      if (!t) return;
      if (t.hasAttribute("data-resp")) {
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
      } else if (t.hasAttribute("data-calcular-renda")) {\n        var valor = function (id) { var n = Number($(id).value); return Number.isFinite(n) && n > 0 ? n : 0; };\n        var saldo = valor("renda-bruta") - valor("renda-transporte") - valor("renda-alimentacao") - valor("renda-cuidado");\n        var saidaRenda = $("renda-liquida");\n        if (saidaRenda) saidaRenda.textContent = "Saldo após os gastos: " + saldo.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) + ". Não inclui outros custos nem garante que o serviço compense.";\n      } else if (t.getAttribute("data-limpar") === "plano") {
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
