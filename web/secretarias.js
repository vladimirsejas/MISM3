/* Pagina "Secretarias e canais oficiais". A busca so e comparada neste aparelho. */
(function () {
  "use strict";
  var I = Institucional;
  var $ = function (id) { return document.getElementById(id); };
  var canais = [], tema = "", texto = "";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  var ORDEM = ["secretaria", "canal", "saude", "documento"];
  var ROTULO_GRUPO = { secretaria: "Secretarias", canal: "Canais de atendimento ao cidadão", saude: "Páginas da Saúde", documento: "Documentos" };

  function cartao(c) {
    var conferido = c.situacao === "conferido";
    var status = conferido
      ? '<span class="status-link conferido">✓ Conferida em ' + esc(I.dataBR(c.verificado_em)) + "</span>"
      : '<span class="status-link listado">Só listada</span>';
    return '<article class="cartao' + (conferido ? " cartao-destaque" : "") + '"><div class="cab-cartao"><h3>' + esc(c.nome) + '</h3><div class="selos">' + status + "</div></div>" +
      (c.descricao ? "<p>" + esc(c.descricao) + "</p>" : "") +
      (c.observacao ? '<p class="meta">' + esc(c.observacao) + "</p>" : "") +
      '<div class="acoes-contato"><a class="botao-acao claro" href="' + esc(c.url) + '" target="_blank" rel="noopener noreferrer">Abrir página oficial<span class="sr-so"> de ' + esc(c.nome) + " (abre em outra aba)</span></a></div>" +
      '<p class="url-curta">' + esc(c.url) + "</p></article>";
  }

  function desenhar() {
    $("filtros").innerHTML = [{ chave: "", rotulo: "Todos" }].concat(I.TEMAS).map(function (t) {
      return '<button type="button" data-tema="' + esc(t.chave) + '" aria-pressed="' + (tema === t.chave) + '">' + esc(t.rotulo) + "</button>";
    }).join("");
    var lista = I.filtrarCanais(canais, { texto: texto, tema: tema });
    $("contagem").textContent = lista.length + (lista.length === 1 ? " resultado" : " resultados") +
      (texto ? " para “" + texto + "”" : "") + (tema ? " em “" + I.TEMAS.filter(function (t) { return t.chave === tema; })[0].rotulo + "”" : "");
    if (!lista.length) {
      $("lista").innerHTML = '<p class="vazio">Nada encontrado. Tente uma palavra mais curta ou escolha “Todos”.</p>';
      return;
    }
    $("lista").innerHTML = ORDEM.map(function (g) {
      var itens = lista.filter(function (c) { return c.grupo === g; });
      if (!itens.length) return "";
      return '<section class="bloco"><h3>' + esc(ROTULO_GRUPO[g]) + '</h3><div class="grade-cartoes">' + itens.map(cartao).join("") + "</div></section>";
    }).join("");
  }

  $("filtros").addEventListener("click", function (e) {
    var t = e.target && e.target.getAttribute && e.target.getAttribute("data-tema");
    if (t === null || t === undefined) return;
    tema = t; desenhar();
    var b = document.querySelector('#filtros [data-tema="' + t + '"]'); if (b) b.focus();
  });
  $("form-busca").addEventListener("submit", function (e) { e.preventDefault(); texto = $("busca").value.trim(); desenhar(); });
  $("busca").addEventListener("input", function () { texto = $("busca").value.trim(); desenhar(); });

  $("sair-rapido").addEventListener("click", function () {
    $("busca").value = "";
    window.location.replace("https://www.google.com.br/");
  });

  Api.json("dados/institucional.json").then(function (d) {
    canais = d.canais || [];
    desenhar();
    $("fontes").textContent = "Cadastro gerado em " + I.dataBR(d.meta && d.meta.gerado_em) + ": " +
      ((d.meta && d.meta.contagem && d.meta.contagem.canais_conferidos) || 0) + " de " + canais.length + " páginas conferidas.";
  }).catch(function () {
    var m = $("mensagem"); m.textContent = "Não foi possível carregar os dados. Abra o site pelo arquivo abrir_site.bat (veja o README)."; m.hidden = false;
  });
})();
