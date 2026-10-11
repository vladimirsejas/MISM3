/* Tela do Entre Mulheres: uma aba por categoria, cada uma com o seu espaço (quem oferece e o cadastro para oferecer).
   Nada é enviado nem gravado por esta página. O cadastro vira um texto que a mulher copia, imprime ou envia pelo canal da equipe. */
(function (raiz) {
  "use strict";
  var EM = raiz.EntreMulheres;

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function dataBr(d) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d || ""); return m ? m[3] + "/" + m[2] + "/" + m[1] : esc(d); }
  function hojeISO() { var d = new Date(); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function carregar(url) { return fetch(url, { cache: "no-store" }).then(function (r) { if (!r.ok) throw new Error(url); return r.json(); }); }

  var CATS = [], ofertas = [], canal = { whatsapp: null, email: null }, ativa = null;

  function cartao(o) {
    var p = ["<h4>" + esc(o.nome) + "</h4>", "<p>" + esc(o.descricao) + "</p>"];
    if (o.atende) p.push('<p class="dist">Atende: ' + esc(o.atende) + "</p>");
    if (o.contato) p.push("<p>Contato: " + esc(o.contato) + "</p>");
    p.push('<p class="meta">Publicado com o consentimento dela em ' + dataBr(o.consentimento_em) + ". Confirme preço e disponibilidade direto com ela.</p>");
    return '<article class="cartao">' + p.join("") + "</article>";
  }

  function campo(id, rotulo, tipo, dica, max) {
    var entrada = tipo === "area"
      ? '<textarea id="' + id + '" name="' + id + '" rows="3" maxlength="' + max + '" autocomplete="off" placeholder="' + esc(dica) + '" aria-describedby="e-' + id + '"></textarea>'
      : '<input id="' + id + '" name="' + id + '" type="text" maxlength="' + max + '" autocomplete="off" placeholder="' + esc(dica) + '" aria-describedby="e-' + id + '">';
    return '<div class="campo"><label for="' + id + '">' + esc(rotulo) + "</label>" + entrada + '<p class="erro-campo" id="e-' + id + '" role="alert"></p></div>';
  }

  function formulario(c) {
    var p = "f-" + c.id + "-";
    return '<div class="oferecer"><h4>Sou mulher e quero oferecer meu serviço em “' + esc(c.titulo) + '”</h4>' +
      '<p class="meta">Preencha aqui. Nada é enviado por esta página: ela só prepara o seu cadastro, com o termo de autorização, para você copiar, imprimir ou enviar. O que você digitar some quando sair da página.</p>' +
      '<form class="form-oferta" data-cat="' + esc(c.id) + '" novalidate autocomplete="off">' +
      campo(p + "nome", "Seu nome ou o nome do seu negócio", "texto", "Ex.: Ana, cabeleireira", EM.LIMITES.nome[1]) +
      campo(p + "descricao", "O que você oferece (1 ou 2 frases)", "area", c.exemplo, EM.LIMITES.descricao[1]) +
      campo(p + "atende", "Bairro ou região que você atende", "texto", "Ex.: perto do CVZ; atendo na minha casa", EM.LIMITES.atende[1]) +
      campo(p + "contato", "Um contato que você escolhe divulgar", "texto", "Telefone, WhatsApp ou rede social", EM.LIMITES.contato[1]) +
      '<p class="meta">Não coloque CPF, RG nem endereço completo. Use um contato que você aceita tornar público.</p>' +
      '<label class="marca-check"><input type="checkbox" name="mulher"> <span>Eu sou mulher.</span></label><p class="erro-campo" id="e-' + p + 'mulher" role="alert"></p>' +
      '<label class="marca-check"><input type="checkbox" name="consentimento"> <span>Eu autorizo a publicação desses dados, e só deles, no site Mulher em Rede. Sei que posso pedir a retirada a qualquer momento.</span></label><p class="erro-campo" id="e-' + p + 'consentimento" role="alert"></p>' +
      '<div class="acoes"><button type="submit" class="btn">Preparar meu cadastro</button></div></form>' +
      '<div class="resultado-cadastro" aria-live="polite"></div></div>';
  }

  function painel(c) {
    var of = ofertas.filter(function (o) { return o.categoria === c.id; });
    var lista = of.length ? '<div class="lista-cartoes">' + of.map(cartao).join("") + "</div>"
      : '<p class="vazio-cat"><strong>Ainda não há mulheres cadastradas aqui.</strong> Este espaço é para você: se você oferece este tipo de serviço, o cadastro abaixo é o primeiro passo.</p>';
    return '<section class="painel-aba" role="tabpanel" id="painel-' + esc(c.id) + '" aria-labelledby="aba-' + esc(c.id) + '"' + (c.id === ativa ? "" : " hidden") + ">" +
      "<h3>" + esc(c.titulo) + "</h3><p>" + esc(c.exemplo) + '</p><h4>Quem oferece</h4>' + lista + formulario(c) + "</section>";
  }

  function desenhar() {
    var abas = CATS.map(function (c) {
      var n = ofertas.filter(function (o) { return o.categoria === c.id; }).length, sel = c.id === ativa;
      return '<button type="button" role="tab" class="aba" id="aba-' + esc(c.id) + '" aria-controls="painel-' + esc(c.id) + '" aria-selected="' + sel + '" tabindex="' + (sel ? 0 : -1) + '" data-aba="' + esc(c.id) + '">' + esc(c.titulo) + (n ? " (" + n + ")" : "") + "</button>";
    }).join("");
    document.getElementById("categorias").innerHTML = '<div class="abas" role="tablist" aria-label="Categorias de serviços">' + abas + "</div>" + CATS.map(painel).join("");
  }

  function selecionar(id, foco) {
    if (!CATS.some(function (c) { return c.id === id; })) return;
    ativa = id;
    CATS.forEach(function (c) {
      var a = document.getElementById("aba-" + c.id), p = document.getElementById("painel-" + c.id), sel = c.id === id;
      a.setAttribute("aria-selected", sel); a.tabIndex = sel ? 0 : -1; p.hidden = !sel;
    });
    if (foco) document.getElementById("aba-" + id).focus();
    try { history.replaceState(null, "", "#" + id); } catch (x) { /* sem histórico: segue sem atualizar o endereço */ }
  }

  function imprimir(texto) {
    var f = document.getElementById("folha-impressao");
    if (!f) { f = document.createElement("div"); f.id = "folha-impressao"; f.className = "folha-impressao"; document.body.appendChild(f); }
    f.innerHTML = "<h1>Cadastro — Entre Mulheres</h1><pre style=\"white-space:pre-wrap;font:inherit\">" + esc(texto) + "</pre>";
    window.print();
  }

  function mostrarResultado(form, c, texto) {
    var caixa = form.parentNode.querySelector(".resultado-cadastro"), cn = EM.canalDisponivel(canal);
    var wa = EM.linkWhatsapp(cn.whatsapp, texto), em = EM.linkEmail(cn.email, texto), envio = "";
    if (wa || em) {
      envio = '<p>Para enviar à equipe:</p><div class="acoes">' + (wa ? '<a class="btn" href="' + esc(wa) + '" target="_blank" rel="noopener noreferrer">Enviar pelo WhatsApp</a>' : "") + (em ? '<a class="btn" href="' + esc(em) + '">Enviar por e-mail</a>' : "") + "</div>" +
        '<p class="meta">Ao tocar, o seu aplicativo abre com o texto pronto. Só é enviado se você apertar “enviar” lá.</p>';
    } else {
      envio = '<p class="status" role="note"><strong>O canal que recebe cadastros ainda não foi definido.</strong> Por isso nada foi enviado. Copie ou imprima o seu cadastro e guarde: ele vale quando o canal for divulgado (a previsão é que seja feito com a Secretaria Municipal da Mulher).</p>';
    }
    caixa.innerHTML = '<div class="status" role="note"><strong>Seu cadastro está pronto.</strong> Confira o texto abaixo.</div><pre class="registro" tabindex="0">' + esc(texto) + "</pre>" + envio +
      '<div class="acoes"><button type="button" class="btn secundario" data-acao="copiar">Copiar texto</button><button type="button" class="btn secundario" data-acao="imprimir">Imprimir ou salvar em PDF</button><button type="button" class="btn secundario" data-acao="editar">Editar</button></div>';
    caixa.setAttribute("data-texto", texto);
    caixa.scrollIntoView({ block: "nearest" });
  }

  function aoEnviar(ev) {
    var form = ev.target.closest ? ev.target.closest("form.form-oferta") : null;
    if (!form) return;
    ev.preventDefault();
    var c = CATS.filter(function (x) { return x.id === form.getAttribute("data-cat"); })[0], p = "f-" + c.id + "-";
    var d = { mulher: form.elements.mulher.checked, consentimento: form.elements.consentimento.checked };
    EM.CAMPOS.forEach(function (k) { d[k] = form.elements[p + k].value; });
    var v = EM.validar(d), primeiro = null;
    EM.CAMPOS.concat(["mulher", "consentimento"]).forEach(function (k) {
      var e = document.getElementById("e-" + p + k); if (e) e.textContent = v.erros[k] || "";
      var campoEl = form.elements[k === "mulher" || k === "consentimento" ? k : p + k];
      if (campoEl) campoEl.setAttribute("aria-invalid", v.erros[k] ? "true" : "false");
      if (v.erros[k] && !primeiro) primeiro = campoEl;
    });
    var caixa = form.parentNode.querySelector(".resultado-cadastro");
    if (!v.ok) { caixa.innerHTML = ""; if (primeiro) primeiro.focus(); return; }
    mostrarResultado(form, c, EM.montarCadastro(d, c, hojeISO()));
  }

  function aoClicar(ev) {
    var aba = ev.target.closest ? ev.target.closest("[data-aba]") : null;
    if (aba) { selecionar(aba.getAttribute("data-aba"), false); return; }
    var bt = ev.target.closest ? ev.target.closest("[data-acao]") : null;
    if (!bt) return;
    var caixa = bt.closest(".resultado-cadastro"), texto = caixa.getAttribute("data-texto") || "", a = bt.getAttribute("data-acao");
    if (a === "imprimir") imprimir(texto);
    else if (a === "editar") { caixa.innerHTML = ""; var f = caixa.parentNode.querySelector("form"); if (f) f.querySelector("input,textarea").focus(); }
    else if (a === "copiar") {
      var ok = function () { bt.textContent = "Copiado!"; setTimeout(function () { bt.textContent = "Copiar texto"; }, 2000); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(texto).then(ok, function () { selecionarTexto(caixa); });
      else selecionarTexto(caixa);
    }
  }
  function selecionarTexto(caixa) { var pre = caixa.querySelector("pre"), r = document.createRange(); r.selectNodeContents(pre); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); }

  function aoTeclar(ev) {
    var aba = ev.target.closest ? ev.target.closest("[data-aba]") : null;
    if (!aba || ["ArrowRight", "ArrowLeft", "Home", "End"].indexOf(ev.key) === -1) return;
    var i = CATS.map(function (c) { return c.id; }).indexOf(aba.getAttribute("data-aba"));
    var j = ev.key === "Home" ? 0 : ev.key === "End" ? CATS.length - 1 : (i + (ev.key === "ArrowRight" ? 1 : -1) + CATS.length) % CATS.length;
    ev.preventDefault(); selecionar(CATS[j].id, true);
  }

  function iniciar(categorias) {
    CATS = categorias;
    var inicial = (location.hash || "").replace("#", "");
    ativa = CATS.some(function (c) { return c.id === inicial; }) ? inicial : CATS[0].id;
    Promise.all([carregar("dados/ofertas_mulheres.json"), carregar("dados/entre_mulheres_canal.json").catch(function () { return {}; })]).then(function (r) {
      ofertas = r[0].ofertas || []; canal = r[1] || {};
      desenhar();
    }).catch(function () {
      document.getElementById("aviso-catalogo").textContent = "As ofertas não foram carregadas. Abra o sistema pelo procedimento do README.";
    });
    document.addEventListener("click", aoClicar); document.addEventListener("submit", aoEnviar); document.addEventListener("keydown", aoTeclar);
    window.addEventListener("hashchange", function () { var h = (location.hash || "").replace("#", ""); if (document.getElementById("aba-" + h)) selecionar(h, false); });
  }

  raiz.EntreMulheresUI = { iniciar: iniciar };
})(typeof self !== "undefined" ? self : this);
