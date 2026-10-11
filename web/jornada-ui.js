/* Tela da jornada "Trabalho": perguntas uma de cada vez -> plano curto -> montador de currículo.
   Nada é enviado nem gravado no aparelho. O que a pessoa responde fica só na memória desta página, para o plano
   não sumir quando ela abre um link do plano e volta; é apagado ao voltar ao Início, em "Recomeçar" ou ao fechar a página. */
(function (raiz) {
  "use strict";
  var J = raiz.Jornada;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function $(id) { return document.getElementById(id); }

  /* resp: respostas; ordem: ids na ordem respondida (para o "Voltar"); puladas; feitos: passos marcados "Já fiz". */
  var ultimo = { resp: {}, ordem: [], puladas: [], feitos: {}, plano: null, cvDados: null, curriculo: null };
  var achar = null; /* função id -> serviço do catálogo, entregue pelo app.js */

  function usarCatalogo(fn) { achar = fn; }

  /* ------------------------------------------------------------ estrutura */
  function html() {
    return '<section class="secao jornada" aria-labelledby="titulo-jornada">' +
      '<h2 id="titulo-jornada" tabindex="-1">Monte seu plano</h2>' +
      '<div id="jornada-saida" aria-live="polite"></div></section>' +
      '<section class="secao curriculo" id="montar-curriculo" aria-labelledby="titulo-curriculo">' +
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
      '<div id="curriculo-saida" aria-live="polite"></div></details></section>';
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
    var pular = p.id === "objetivo" ? "" : '<button type="button" class="link-btn" data-passo="pular">Prefiro não responder</button>';
    return '<div class="etapa"><p class="progresso">Pergunta ' + prox.numero + " de " + prox.total + '</p>' +
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
    if (url === "#assistencia") return "área Assistência Social deste site";
    if (/^#educacao/.test(url)) return "área Educação deste site";
    return "este site";
  }
  function telHref(tel) {
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
    ultimo = { resp: {}, ordem: [], puladas: [], feitos: {}, plano: null, cvDados: null, curriculo: null };
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
      } else if (t.getAttribute("data-limpar") === "plano") {
        ultimo.resp = {}; ultimo.ordem = []; ultimo.puladas = []; ultimo.feitos = {}; ultimo.plano = null;
        desenhar(true);
      } else if (t.getAttribute("data-limpar") === "curriculo") {
        $("form-curriculo").reset(); $("curriculo-saida").innerHTML = ""; ultimo.cvDados = null; ultimo.curriculo = null;
      } else if (t.getAttribute("data-imprimir") === "plano" && ultimo.plano) {
        imprimir("<h1>Meu plano — Trabalho</h1><p>Mulher em Rede · Rio Claro/SP · gerado em " + hoje() + "</p>" + htmlPlano(ultimo.plano, true) +
          "<p>Confirme sempre telefone, endereço, horário e vagas diretamente com cada órgão antes de ir.</p>");
      } else if (t.getAttribute("data-imprimir") === "curriculo" && ultimo.curriculo) {
        imprimir(htmlCurriculo(ultimo.curriculo));
      }
    });
    window.addEventListener("afterprint", limparFolha);
  }

  raiz.JornadaUI = { html: html, ligar: ligar, limpar: limpar, restaurar: restaurar, usarCatalogo: usarCatalogo, htmlPlano: htmlPlano, htmlCurriculo: htmlCurriculo };
})(typeof self !== "undefined" ? self : this);
