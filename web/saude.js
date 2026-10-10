/* Pagina "Saude": qual e a minha unidade? O bairro digitado so e comparado neste aparelho: nao vai a rede, a storage nem a cookie. */
(function () {
  "use strict";
  var I = Institucional;
  var $ = function (id) { return document.getElementById(id); };
  var unidades = [], canais = [], filtro = "todas";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  var ROTULO = { urgencia: "Urgência", ubs: "UBS", usf: "USF", caps: "Saúde mental (CAPS)", vigilancia: "Vigilância Sanitária" };

  function rotuloFonte(url) {
    if (/saude-rioclaro\.org\.br/.test(url)) return "Guia da Fundação de Saúde";
    if (/rioclaro\.sp\.gov\.br/.test(url)) return "Página da Prefeitura";
    return "Fonte oficial";
  }

  /* quem = frase que explica POR QUE esta unidade aparece (so na busca por bairro) */
  function cartaoUnidade(u, quem) {
    var vinteQuatro = I.ehVinteEQuatroHoras(u), urgente = u.subtipo === "urgencia";
    var selos = '<span class="selo-tipo">' + esc(ROTULO[u.subtipo] || "Saúde") + "</span>" +
      (vinteQuatro ? '<span class="selo-tipo selo-24h">24 horas</span>' : "");
    var p = [];
    if (quem) p.push('<p class="quem">' + esc(quem) + "</p>");
    if (u.endereco) p.push('<p class="endereco">' + esc(u.endereco) + "</p>");
    var tels = I.telefones(u.telefone);
    if (tels.length) {
      p.push('<div class="acoes-contato">' + tels.map(function (t) {
        return '<a class="botao-acao' + (urgente ? " urgente" : "") + '" href="' + esc(t.href) + '">Ligar ' + esc(t.texto) + "</a>";
      }).join("") + "</div>");
    } else {
      p.push('<p class="meta">Telefone não informado na página oficial.</p>');
    }
    p.push(u.horario ? "<p>Horário: " + esc(u.horario) + "</p>" : '<p class="meta">Horário não informado na página oficial: confirme por telefone.</p>');
    var propriosBairros = (u.bairros || []).length === 1 && I.normalizar(u.bairros[0]) === I.normalizar(u.bairro);
    if ((u.bairros || []).length && !propriosBairros) {
      p.push("<details><summary>Bairros atendidos (" + u.bairros.length + ")</summary><p>" +
        esc(u.bairros.map(I.rotuloBairro).join(", ")) + ".</p></details>");
    }
    if (u.divergencia) p.push('<div class="alerta-fontes"><strong>As fontes oficiais divergem</strong>' + esc(u.divergencia) + "</div>");
    var obs = I.limparObservacao(u);
    if (obs) p.push("<p>" + esc(obs) + "</p>");
    p.push('<p class="meta fonte">Fonte: <a href="' + esc(u.fonte_url) + '" target="_blank" rel="noopener noreferrer">' + esc(rotuloFonte(u.fonte_url)) +
      "</a> · copiado em " + esc(I.dataBR(u.verificado_em)) + "</p>");
    return '<article class="cartao' + (urgente ? " urgente" : "") + '"><div class="cab-cartao"><h3>' + esc(u.nome) + '</h3><div class="selos">' + selos + "</div></div>" + p.join("") + "</article>";
  }

  function cartaoDocumento(c) {
    return '<article class="cartao"><div class="cab-cartao"><h3>' + esc(c.nome) + '</h3><div class="selos"><span class="selo-tipo">Documento</span></div></div>' +
      "<p>" + esc(c.descricao) + "</p>" + (c.observacao ? '<p class="meta">' + esc(c.observacao) + "</p>" : "") +
      '<div class="acoes-contato"><a class="botao-acao claro" href="' + esc(c.url) + '" target="_blank" rel="noopener noreferrer">Abrir documento</a></div>' +
      '<p class="meta fonte">Página oficial · ' + (c.verificado_em ? "aberta em " + esc(I.dataBR(c.verificado_em)) : "endereço ainda não conferido") + "</p></article>";
  }

  /* ---------- blocos fixos ---------- */
  function desenharUrgencia() {
    var lista = unidades.filter(I.ehVinteEQuatroHoras);
    $("lista-urgencia").innerHTML = lista.map(function (u) { return cartaoUnidade(u); }).join("") ||
      '<p class="vazio">Nenhuma unidade 24 horas cadastrada. Em urgência, ligue 192.</p>';
  }

  function desenharMulher() {
    var docs = canais.filter(function (c) { return c.grupo === "documento" && c.temas.indexOf("mulher") !== -1; });
    $("docs-mulher").innerHTML = docs.map(cartaoDocumento).join("");
  }

  function desenharLista() {
    var todos = I.agruparUnidades(unidades);
    $("filtros").innerHTML = [{ chave: "todas", rotulo: "Todas", n: unidades.length }].concat(todos.map(function (g) {
      return { chave: g.chave, rotulo: g.rotulo.replace(/\s*\(.*\)/, ""), n: g.unidades.length };
    })).map(function (f) {
      return '<button type="button" data-filtro="' + esc(f.chave) + '" aria-pressed="' + (filtro === f.chave) + '">' + esc(f.rotulo) + " (" + f.n + ")</button>";
    }).join("");
    var visiveis = todos.filter(function (g) { return filtro === "todas" || g.chave === filtro; });
    var total = visiveis.reduce(function (s, g) { return s + g.unidades.length; }, 0);
    $("contagem").textContent = total + (total === 1 ? " unidade" : " unidades");
    $("lista-unidades").innerHTML = visiveis.map(function (g) {
      return '<section class="bloco"><h3>' + esc(g.rotulo) + '</h3><div class="grade-cartoes">' + g.unidades.map(function (u) { return cartaoUnidade(u); }).join("") + "</div></section>";
    }).join("");
  }

  /* ---------- busca por bairro ---------- */
  function mostrarResultado(html) {
    var alvo = $("resultado-bairro");
    alvo.innerHTML = html; alvo.hidden = false;
    alvo.scrollIntoView({ behavior: "smooth", block: "start" });
    alvo.focus({ preventScroll: true });
  }

  function buscar() {
    var texto = $("bairro").value, r = I.buscarPorBairro(texto, unidades);
    if (r.curta) {
      $("resultado-bairro").hidden = true;
      var m = $("mensagem"); m.textContent = "Escreva pelo menos 3 letras do nome do bairro."; m.hidden = false;
      return;
    }
    $("mensagem").hidden = true;
    var h = "<h2>Resultado para “" + esc(r.consulta) + "”</h2>";
    if (!r.atende.length && !r.fica.length) {
      h += '<p class="explica">Não encontramos esse bairro nas áreas de abrangência do guia da Saúde. Isso <strong>não significa</strong> que você não seja atendida: o guia pode não listar o seu bairro ou o nome pode estar escrito de outro jeito.</p>' +
        '<p class="explica">Experimente só o nome principal (por exemplo “Wenzel”, sem “Jardim”), escolha uma opção da lista que aparece ao digitar, ou <a href="#todas">veja todas as unidades</a> e ligue para a mais próxima.</p>';
      return mostrarResultado(h);
    }
    if (r.atende.length) {
      h += "<h3>Unidade de referência para o seu bairro</h3>" +
        '<p class="explica">O guia da Saúde lista este bairro na área de abrangência destas UBS. O guia não tem data de atualização: <strong>ligue e confirme se a unidade atende a sua rua</strong>.</p>' +
        '<div class="grade-cartoes">' + r.atende.map(function (x) { return cartaoUnidade(x.unidade, "Atende o bairro: " + x.via); }).join("") + "</div>";
    }
    if (r.fica.length) {
      h += "<h3>Também ficam neste bairro</h3>" +
        '<p class="explica">Unidades que ficam no bairro. As Unidades de Saúde da Família atendem por área definida pela Prefeitura: pergunte se o seu endereço é atendido.</p>' +
        '<div class="grade-cartoes">' + r.fica.map(function (x) { return cartaoUnidade(x.unidade, "Fica no bairro: " + x.via); }).join("") + "</div>";
    }
    mostrarResultado(h);
  }

  $("form-bairro").addEventListener("submit", function (e) { e.preventDefault(); buscar(); });
  /* escolher uma opcao da lista (datalist) dispara "change" com o texto completo */
  $("bairro").addEventListener("change", function () { if ($("bairro").value.trim().length >= 3) buscar(); });

  $("filtros").addEventListener("click", function (e) {
    var f = e.target && e.target.getAttribute && e.target.getAttribute("data-filtro");
    if (!f) return;
    filtro = f; desenharLista();
    var b = document.querySelector('#filtros [data-filtro="' + f + '"]'); if (b) b.focus();
  });

  $("sair-rapido").addEventListener("click", function () {
    $("bairro").value = ""; $("resultado-bairro").innerHTML = "";
    window.location.replace("https://www.google.com.br/");
  });

  Api.json("dados/institucional.json").then(function (d) {
    unidades = d.saude || []; canais = d.canais || [];
    $("lista-bairros").innerHTML = I.listaBairros(unidades).map(function (b) { return '<option value="' + esc(b) + '"></option>'; }).join("");
    desenharUrgencia(); desenharMulher(); desenharLista();
    $("fontes").textContent = "Cadastro gerado em " + I.dataBR(d.meta && d.meta.gerado_em) + ". " + ((d.meta && d.meta.aviso) || "");
  }).catch(function () {
    var m = $("mensagem"); m.textContent = "Não foi possível carregar os dados. Abra o site pelo arquivo abrir_site.bat (veja o README)."; m.hidden = false;
  });
})();
