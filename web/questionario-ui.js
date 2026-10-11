/* Tela do questionário do Observatório: uma pergunta por vez -> retorno com pontuação, caminhos e serviços.
   O que a pessoa responde fica só na memória desta página (some ao sair). Só é enviado algo à Secretaria se (1) a pessoa autorizar
   no fim, (2) ela tiver 18 anos ou mais e (3) a coleta tiver sido ativada em dados/coleta.json. Hoje a coleta está DESLIGADA. */
(function (raiz) {
  "use strict";
  var Q = raiz.Questionario;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function $(id) { return document.getElementById(id); }

  function novo() { return { etapa: "intro", resp: {}, ordem: [], puladas: [], pendente: [], envio: { estado: "nao_tentado" } }; }
  var e = novo();
  var config = { ativa: false, endpoint: null };
  function usarConfig(c) { if (c && typeof c === "object") config = c; }

  function html() {
    return '<section class="secao questionario" aria-labelledby="titulo-questionario">' +
      '<h2 id="titulo-questionario" tabindex="-1">Questionário para conhecer as mulheres de Rio Claro</h2>' +
      '<div id="questionario-saida" aria-live="polite"></div></section>';
  }

  /* ------------------------------------------------------------ introdução */
  function htmlIntro() {
    return '<div class="etapa"><p>Queremos conhecer melhor as mulheres de Rio Claro. Este questionário faz parte do estudo <strong>Observatório da Mulher Rio-Clarense</strong>, da Fatec Rio Claro, e tem dois objetivos:</p>' +
      '<ol class="q-objetivos"><li><strong>Ajudar você:</strong> no fim, mostramos caminhos e serviços que podem ajudar na sua vida.</li>' +
      '<li><strong>Ajudar a Secretaria da Mulher:</strong> as respostas de quem autorizar poderão mostrar o que as mulheres do município precisam, para a Secretaria planejar melhor as suas ações.</li></ol>' +
      '<ul class="q-garantias"><li>Você <strong>não informa nome, CPF nem telefone</strong>. Só marca alternativas.</li>' +
      '<li>Participar é <strong>voluntário</strong>. Você pode pular qualquer pergunta. Não existe resposta certa ou errada.</li>' +
      '<li>Ele <strong>não substitui atendimento</strong>, não garante vaga e não faz diagnóstico nem avaliação de risco.</li>' +
      '<li>Só se você autorizar, <strong>no fim</strong>, as respostas poderão ser usadas pela Secretaria, <strong>sem o seu nome</strong>. Menores de 18 anos não têm respostas enviadas.</li></ul>' +
      '<p class="status" role="note"><strong>Situação hoje:</strong> a coleta de dados para a Secretaria ainda <strong>não foi ativada</strong>. Você recebe a sua orientação, e as respostas ficam só neste aparelho e somem quando você sai da página.</p>' +
      '<div class="acoes"><button type="button" class="btn" data-q="comecar">Começar (leva uns 5 minutos)</button></div>' +
      '<p class="meta">Se você corre perigo agora, use o botão “Em perigo agora?” no alto da página.</p></div>';
  }

  /* ------------------------------------------------------------ perguntas */
  function htmlPergunta(prox) {
    var p = prox.pergunta, multi = p.tipo === "multi";
    var marcadas = multi ? e.pendente : [];
    var opcoes = p.opcoes.map(function (op) {
      if (multi) {
        var on = marcadas.indexOf(op.c) !== -1;
        var cheio = marcadas.length >= p.max && !on && !op.x;
        return '<label class="opcao-check' + (on ? " marcada" : "") + (cheio ? " bloqueada" : "") + '"><input type="checkbox" data-q-multi="' + esc(op.c) + '"' + (on ? " checked" : "") + (cheio ? " disabled" : "") + "> <span>" + esc(op.r) + "</span></label>";
      }
      return '<button type="button" class="opcao-btn" data-q-resp="' + esc(p.id) + '" data-valor="' + esc(op.c) + '">' + esc(op.r) + "</button>";
    }).join("");
    var voltar = e.ordem.length || e.puladas.length ? '<button type="button" class="link-btn" data-q="voltar">← Voltar</button>' : "";
    var continuar = multi ? '<div class="acoes"><button type="button" class="btn" data-q="continuar">Continuar</button></div>' : "";
    var pular = '<button type="button" class="link-btn" data-q="pular">Prefiro não responder</button>';
    return '<div class="etapa"><p class="progresso">' + esc(p.bloco) + " · pergunta " + prox.numero + " de " + prox.total + "</p>" +
      '<div class="barra" aria-hidden="true"><span style="width:' + Math.round((prox.numero - 1) / prox.total * 100) + '%"></span></div>' +
      '<h3 class="pergunta-texto" id="q-foco" tabindex="-1">' + esc(p.texto) + "</h3>" + (p.ajuda ? '<p class="meta">' + esc(p.ajuda) + "</p>" : "") +
      '<div class="opcoes-grade">' + opcoes + "</div>" + continuar + '<div class="rodape-etapa">' + voltar + pular + "</div></div>";
  }

  /* ------------------------------------------------------------ resultado */
  function telHref(tel) {
    var m = /\(?(\d{2})\)?\s*(9?\s?\d{4})[-\s]?(\d{4})/.exec(String(tel || ""));
    return m ? "tel:+55" + m[1] + (m[2] + m[3]).replace(/\s/g, "") : null;
  }
  function dataBr(iso) { var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ""); return m ? m[3] + "/" + m[2] + "/" + m[1] : ""; }

  function htmlServico(sv) {
    var href = telHref(sv.telefone), data = dataBr(sv.verificado_em);
    var contato = sv.telefone ? (href ? '<a class="tel" href="' + esc(href) + '">' + esc(sv.telefone) + "</a>" : esc(sv.telefone))
      : (sv.fonte_url ? '<a href="' + esc(sv.fonte_url) + '" target="_blank" rel="noopener noreferrer">Ver na fonte oficial</a>' : "");
    return "<li><strong>" + esc(sv.nome) + "</strong>" + (contato ? "<span>" + contato + "</span>" : "") + (data ? '<span class="meta">Conferido em ' + esc(data) + "</span>" : "") + "</li>";
  }

  function htmlCaminho(c, n) {
    var servicos = [];
    if (c.need && raiz.MISM3IA && raiz.MISM3IA.servicosPara) {
      var r = raiz.MISM3IA.servicosPara(c.consulta || "", [{ id: c.need }], 2);
      servicos = r[c.need] || [];
    }
    var extra = c.id === "mobilidade" ? '<p class="meta">O site traz os horários de 5 linhas da SOU; se a sua não estiver, confira no site da SOU.</p>' : "";
    return '<li class="passo' + (n === 1 ? " destaque" : "") + '"><h4>' + n + ". " + esc(c.titulo) + "</h4>" + (c.porque ? "<p>" + esc(c.porque) + "</p>" : "") +
      '<p><a class="btn' + (c.urgente ? "" : "") + '" href="' + esc(c.href) + '">Abrir esta área</a></p>' + extra +
      (servicos.length ? '<ul class="ia-servicos"><li class="ia-rotulo">Serviços que podem ajudar:</li>' + servicos.map(htmlServico).join("") + "</ul>" : "") + "</li>";
  }

  function htmlBarras(pts) {
    return '<ul class="indices">' + Q.DIMENSOES.map(function (d) {
      var x = pts[d.id], n = x.indice;
      return '<li><div class="indice-topo"><strong>' + esc(d.nome) + "</strong><span>" + (n === null ? "sem dados" : n + " de 100") + "</span></div>" +
        '<div class="barra-indice" role="img" aria-label="' + esc(d.nome) + ": " + (n === null ? "sem dados" : n + " de 100") + '"><span style="width:' + (n === null ? 0 : n) + '%"></span></div>' +
        '<p class="meta">' + esc(d.indica) + (x.respondidas < x.total ? " Calculado com " + x.respondidas + " de " + x.total + " perguntas respondidas." : "") + "</p></li>";
    }).join("") + "</ul>";
  }

  function mesAtual() { var d = new Date(); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2); }

  function htmlEnvio() {
    var r = Q.limpar(e.resp);
    if (r.idade === "m18") return '<p>Como você tem menos de 18 anos, <strong>as suas respostas não são enviadas</strong>. Você recebeu a orientação do mesmo jeito.</p>';
    if (r.autoriza !== "sim") return "<p>Você <strong>não autorizou</strong> o uso das respostas: <strong>nada é enviado</strong>. A sua orientação continua valendo.</p>";
    var reg = Q.registro(r, mesAtual());
    var ver = '<details class="ia-como"><summary>Ver exatamente o que seria enviado</summary><pre class="registro">' + esc(JSON.stringify(reg, null, 1)) + '</pre><p class="meta">Só códigos das alternativas e as pontuações, mais o mês. Sem nome, sem texto livre, sem data e hora exatas.</p></details>';
    if (e.envio.estado === "enviado") return "<p><strong>Obrigada.</strong> As suas respostas, sem nome, foram enviadas para ajudar a Secretaria da Mulher.</p>" + ver;
    if (e.envio.estado === "falhou") return "<p>Não foi possível enviar agora. As suas respostas <strong>não foram enviadas</strong>. A orientação acima continua valendo.</p>" + ver;
    return "<p>Você autorizou, obrigada. Mas a coleta ainda <strong>não foi ativada</strong> pela Secretaria da Mulher: <strong>nada foi enviado</strong> até agora.</p>" + ver;
  }

  function htmlResultado() {
    var r = Q.limpar(e.resp), pts = Q.pontuar(r), cams = Q.caminhos(r);
    var urgente = cams.some(function (c) { return c.urgente; })
      ? '<p class="ia-urgente" role="alert"><strong>Se você corre perigo agora, ligue 190 (Polícia Militar) ou 180 (Central de Atendimento à Mulher), ou toque em “Em perigo agora?”.</strong></p>' : "";
    var corpo = cams.length
      ? '<ol class="plano">' + cams.map(function (c, i) { return htmlCaminho(c, i + 1); }).join("") + "</ol>"
      : '<p class="vazio">Com as respostas dadas não consegui indicar um caminho. Você pode escolher uma área na tela inicial ou usar “Conte com suas palavras”.</p>';
    return '<div class="plano-tela"><h3 id="q-foco" tabindex="-1">Obrigada por responder</h3>' + urgente +
      "<h4>Seus caminhos</h4>" + '<p class="meta">Começamos pelo que você marcou como mais importante. Os serviços vêm do cadastro verificado; confirme horário e vaga por telefone.</p>' + corpo +
      "<h4>Como as suas respostas se distribuem</h4>" +
      '<p class="meta">De 0 a 100 em cada tema: quanto maior o número, mais esse tema pesa na sua vida hoje. Pergunta em branco não conta como “sem necessidade”.</p>' + htmlBarras(pts) +
      '<p class="status" role="note">Esta pontuação só ajuda a organizar prioridades. Não é uma escala validada, não é diagnóstico e não decide direitos nem acesso a serviços.</p>' +
      "<h4>Sobre o uso das suas respostas</h4>" + htmlEnvio() +
      '<div class="acoes"><button type="button" class="btn secundario" data-q="refazer">Refazer o questionário</button><a class="btn secundario" href="#">Voltar ao início</a></div></div>';
  }

  /* ------------------------------------------------------------ fluxo */
  function desenhar(focar) {
    var saida = $("questionario-saida"); if (!saida) return;
    var prox = e.etapa === "perguntas" ? Q.proxima(e.resp, e.puladas) : null;
    if (e.etapa === "perguntas" && !prox) e.etapa = "resultado";
    saida.innerHTML = e.etapa === "intro" ? htmlIntro() : e.etapa === "resultado" ? htmlResultado() : htmlPergunta(prox);
    if (focar) {
      var alvo = $(e.etapa === "intro" ? "titulo-questionario" : "q-foco");
      if (alvo) alvo.focus({ preventScroll: true });
      var topo = $("titulo-questionario"); if (topo && topo.scrollIntoView) topo.scrollIntoView({ block: "start" });
    }
    if (e.etapa === "resultado") tentarEnviar();
  }

  /* O envio só acontece com autorização, 18 anos ou mais e coleta ativada. Cada resposta vai UMA vez, sem cookies e sem identificador. */
  function tentarEnviar() {
    if (e.envio.estado !== "nao_tentado") return;
    var reg = Q.registro(e.resp, mesAtual());
    if (!reg || !config.ativa || typeof config.endpoint !== "string" || !/^https:\/\//.test(config.endpoint)) return;
    e.envio.estado = "enviando";
    fetch(config.endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(reg), credentials: "omit", referrerPolicy: "no-referrer", cache: "no-store" })
      .then(function (r) { e.envio.estado = r.ok ? "enviado" : "falhou"; })
      .catch(function () { e.envio.estado = "falhou"; })
      .then(function () { if (e.etapa === "resultado" && $("questionario-saida")) desenhar(false); });
  }

  function responder(id, valor) {
    var novoR = {}; Object.keys(e.resp).forEach(function (k) { novoR[k] = e.resp[k]; });
    novoR[id] = valor;
    e.resp = Q.limpar(novoR);
    e.ordem = e.ordem.filter(function (x) { return x !== id; });
    if (e.resp[id] !== undefined) e.ordem.push(id);
    var validas = Q.aplicaveis(e.resp).map(function (p) { return p.id; });
    e.ordem = e.ordem.filter(function (x) { return validas.indexOf(x) !== -1; });
    e.puladas = e.puladas.filter(function (x) { return validas.indexOf(x) !== -1; });
    e.pendente = []; e.envio = { estado: "nao_tentado" };
  }

  function voltar() {
    var prox = Q.proxima(e.resp, e.puladas);
    var todas = Q.aplicaveis(e.resp).map(function (p) { return p.id; });
    var limite = prox ? todas.indexOf(prox.pergunta.id) : todas.length, anterior = null;
    for (var i = limite - 1; i >= 0; i--) {
      if (e.resp[todas[i]] !== undefined || e.puladas.indexOf(todas[i]) !== -1) { anterior = todas[i]; break; }
    }
    if (!anterior) { e.etapa = "intro"; return; }
    delete e.resp[anterior]; e.resp = Q.limpar(e.resp);
    e.ordem = e.ordem.filter(function (x) { return x !== anterior; });
    e.puladas = e.puladas.filter(function (x) { return x !== anterior; });
    e.pendente = []; e.envio = { estado: "nao_tentado" };
    e.etapa = "perguntas";
  }

  function limpar() { e = novo(); }
  function restaurar() { desenhar(false); }

  function ligar() {
    document.addEventListener("change", function (ev) {
      var t = ev.target, c = t && t.getAttribute ? t.getAttribute("data-q-multi") : null;
      if (c === null || c === undefined) return;
      var prox = Q.proxima(e.resp, e.puladas); if (!prox) return;
      var p = prox.pergunta, op = p.opcoes.filter(function (x) { return x.c === c; })[0];
      if (t.checked) {
        e.pendente = op && op.x ? [c] : e.pendente.filter(function (x) { return !p.opcoes.some(function (y) { return y.c === x && y.x; }); }).concat([c]);
      } else e.pendente = e.pendente.filter(function (x) { return x !== c; });
      desenhar(false);
      var again = document.querySelector('[data-q-multi="' + c + '"]'); if (again) again.focus({ preventScroll: true });
    });
    document.addEventListener("click", function (ev) {
      var t = ev.target.closest ? ev.target.closest("[data-q],[data-q-resp]") : null;
      if (!t || !$("questionario-saida")) return;
      if (t.hasAttribute("data-q-resp")) { responder(t.getAttribute("data-q-resp"), t.getAttribute("data-valor")); desenhar(true); return; }
      var acao = t.getAttribute("data-q");
      if (acao === "comecar") { e = novo(); e.etapa = "perguntas"; }
      else if (acao === "voltar") voltar();
      else if (acao === "pular") { var prox = Q.proxima(e.resp, e.puladas); if (prox) e.puladas.push(prox.pergunta.id); e.pendente = []; }
      else if (acao === "continuar") {
        var pr = Q.proxima(e.resp, e.puladas);
        if (pr) { if (e.pendente.length) responder(pr.pergunta.id, e.pendente.slice()); else { e.puladas.push(pr.pergunta.id); } }
      } else if (acao === "refazer") { e = novo(); e.etapa = "perguntas"; }
      desenhar(true);
    });
  }

  raiz.QuestionarioUI = { html: html, ligar: ligar, limpar: limpar, restaurar: restaurar, usarConfig: usarConfig };
})(typeof self !== "undefined" ? self : this);
