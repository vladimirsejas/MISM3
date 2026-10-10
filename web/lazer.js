/* Pagina "Lazer": agenda por dia da semana. Filtros e busca so rodam neste aparelho. */
(function () {
  "use strict";
  var I = Institucional;
  var $ = function (id) { return document.getElementById(id); };
  var itens = [], canais = [], demo = false;
  var hoje = I.chaveDoDia(new Date());
  var filtro = { dia: "", gratuito: false, publico: "", categoria: "", fimDeSemana: false };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  var NOME_DIA = { seg: "segunda", ter: "terça", qua: "quarta", qui: "quinta", sex: "sexta", sab: "sábado", dom: "domingo" };

  function aplicar() {
    var lista = I.filtrarLazer(itens, { categoria: filtro.categoria, gratuito: filtro.gratuito, publico: filtro.publico, dia: filtro.dia });
    if (filtro.fimDeSemana) lista = lista.filter(function (i) { return I.ocorreNoDia(i, "sab") || I.ocorreNoDia(i, "dom"); });
    return lista;
  }

  function cartaoAtividade(i, compacto) {
    var selos = [];
    if (i.gratuito === "sim") selos.push('<span class="selo-tipo">Grátis</span>');
    if (i.publico && i.publico !== "todas") selos.push('<span class="selo-tipo">' + esc(I.PUBLICOS[i.publico]) + "</span>");
    var fonte = i.fonte_url
      ? '<p class="meta fonte">Fonte: <a href="' + esc(i.fonte_url) + '" target="_blank" rel="noopener noreferrer">página oficial</a> · conferido em ' + esc(I.dataBR(i.verificado_em)) + "</p>"
      : '<p class="meta fonte">Exemplo fictício, sem fonte.</p>';
    return '<article class="cartao atividade"><p class="hora">' + esc(i.horario) + "</p><h3>" + esc(i.nome) + "</h3>" +
      (i.local ? '<p class="meta">' + esc(i.local) + "</p>" : "") +
      (compacto ? "" : '<p class="meta">' + esc(I.rotuloDias(i.dias)) + " · " + esc(I.LAZER_CATEGORIAS[i.categoria] || "") + "</p>") +
      (selos.length ? '<div class="selos">' + selos.join("") + "</div>" : "") +
      (i.observacao && !demo ? "<p>" + esc(i.observacao) + "</p>" : "") + fonte + "</article>";
  }

  function desenhar() {
    var chips = [
      { k: "hoje", r: "Hoje (" + NOME_DIA[hoje] + ")", on: filtro.dia === hoje },
      { k: "fds", r: "Fim de semana", on: filtro.fimDeSemana },
      { k: "gratis", r: "Grátis", on: filtro.gratuito },
      { k: "criancas", r: "Para crianças", on: filtro.publico === "criancas" }
    ];
    $("filtros").innerHTML = chips.map(function (c) {
      return '<button type="button" data-chip="' + c.k + '" aria-pressed="' + c.on + '">' + esc(c.r) + "</button>";
    }).join("");

    var lista = aplicar();
    $("contagem").textContent = lista.length + (lista.length === 1 ? " atividade" : " atividades") + (demo ? " (exemplos fictícios)" : "");

    var semana = I.agendaSemanal(lista);
    $("agenda").innerHTML = semana.map(function (d) {
      var ehHoje = d.dia.chave === hoje;
      return '<section class="dia' + (ehHoje ? " dia-hoje" : "") + '" aria-label="' + esc(d.dia.rotulo) + '"><h3>' + esc(d.dia.rotulo) + (ehHoje ? ' <span class="selo-tipo">hoje</span>' : "") + "</h3>" +
        (d.itens.length ? d.itens.map(function (i) { return cartaoAtividade(i, true); }).join("") : '<p class="meta vazio-dia">Nada cadastrado</p>') + "</section>";
    }).join("");

    var sem = I.semDiaFixo(lista);
    $("sem-dia").hidden = !sem.length;
    $("lista-sem-dia").innerHTML = sem.map(function (i) { return cartaoAtividade(i, false); }).join("");
  }

  function desenharFontes() {
    var lista = canais.filter(function (c) { return c.temas.indexOf("lazer") !== -1; });
    $("fontes-lazer").innerHTML = lista.map(function (c) {
      var status = c.situacao === "conferido" ? '<span class="status-link conferido">✓ Conferida em ' + esc(I.dataBR(c.verificado_em)) + "</span>" : '<span class="status-link listado">Só listada</span>';
      return '<article class="cartao"><div class="cab-cartao"><h3>' + esc(c.nome) + '</h3><div class="selos">' + status + "</div></div><p>" + esc(c.descricao) + "</p>" +
        (c.observacao ? '<p class="meta">' + esc(c.observacao) + "</p>" : "") +
        '<div class="acoes-contato"><a class="botao-acao claro" href="' + esc(c.url) + '" target="_blank" rel="noopener noreferrer">Abrir página oficial<span class="sr-so"> de ' + esc(c.nome) + " (abre em outra aba)</span></a></div></article>";
    }).join("");
  }

  $("filtros").addEventListener("click", function (e) {
    var k = e.target && e.target.getAttribute && e.target.getAttribute("data-chip");
    if (!k) return;
    if (k === "hoje") filtro.dia = filtro.dia === hoje ? "" : hoje;
    if (k === "fds") filtro.fimDeSemana = !filtro.fimDeSemana;
    if (k === "gratis") filtro.gratuito = !filtro.gratuito;
    if (k === "criancas") filtro.publico = filtro.publico === "criancas" ? "" : "criancas";
    desenhar();
    var b = document.querySelector('#filtros [data-chip="' + k + '"]'); if (b) b.focus();
  });
  $("categoria").addEventListener("change", function () { filtro.categoria = $("categoria").value; desenhar(); });
  $("sair-rapido").addEventListener("click", function () { window.location.replace("https://www.google.com.br/"); });

  Api.json("dados/institucional.json").then(function (d) {
    canais = d.canais || []; itens = d.lazer || [];
    if (itens.length) return d;
    /* agenda real vazia: mostra o exemplo fictício, sempre sinalizado */
    return Api.json("dados/demo/lazer.json").then(function (x) { itens = x.lazer || []; demo = true; return d; });
  }).then(function (d) {
    $("faixa-demo").hidden = !demo;
    $("categoria").innerHTML = '<option value="">Todas</option>' + Object.keys(I.LAZER_CATEGORIAS).map(function (k) { return '<option value="' + esc(k) + '">' + esc(I.LAZER_CATEGORIAS[k]) + "</option>"; }).join("");
    desenhar(); desenharFontes();
    $("fontes").textContent = "Cadastro gerado em " + I.dataBR(d.meta && d.meta.gerado_em) + ".";
  }).catch(function () {
    $("contagem").textContent = "Não foi possível carregar a agenda. Abra o site pelo arquivo abrir_site.bat (veja o README).";
  });
})();
