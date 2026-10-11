/* Tela da jornada "Trabalho e cuidado" (formulário -> plano) e do montador de currículo.
   Nada é enviado nem gravado no aparelho. O que a pessoa digita fica só na memória desta página, para o plano
   não sumir quando ela abre um link do plano e volta; é apagado ao voltar ao Início, em "Limpar" ou ao fechar a página. */
(function (raiz) {
  "use strict";
  var J = raiz.Jornada;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function $(id) { return document.getElementById(id); }

  var ultimo = { resp: null, plano: null, cvDados: null, curriculo: null };

  /* ------------------------------------------------------------ formulário */
  function htmlPergunta(p) {
    var opcoes = p.opcoes.map(function (o, i) {
      var id = "p-" + p.id + "-" + o[0];
      return '<label class="opcao" for="' + id + '"><input type="radio" id="' + id + '" name="p-' + p.id + '" value="' + esc(o[0]) + '">' + esc(o[1]) + "</label>";
    }).join("");
    return '<fieldset class="pergunta" id="f-' + p.id + '"' + (p.so_se ? " hidden" : "") + '><legend>' + esc(p.texto) + '</legend><div class="opcoes">' + opcoes + "</div></fieldset>";
  }

  function html() {
    return '<section class="secao jornada" aria-labelledby="titulo-jornada">' +
      '<h2 id="titulo-jornada">Monte seu plano</h2>' +
      '<p class="meta">Responda o que quiser, em poucos toques. Nenhuma resposta é enviada nem gravada no aparelho. O plano fica só nesta página e some quando você voltar ao Início ou fechar.</p>' +
      '<form id="form-plano" autocomplete="off">' + J.PERGUNTAS.map(htmlPergunta).join("") +
      '<div class="acoes"><button type="submit" class="btn">Montar meu plano</button><button type="button" class="btn secundario" data-limpar="plano">Limpar</button></div></form>' +
      '<div id="plano-saida" aria-live="polite"></div></section>' +
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

  /* ------------------------------------------------------------ saída */
  function ehInterno(url) { return String(url).charAt(0) === "#"; }
  function nomeArea(url) { return url === "#assistencia" ? "área Assistência Social deste site" : url === "#educacao" ? "área Educação deste site" : "este site"; }

  function htmlPlano(plano, paraPapel) {
    if (!plano.passos.length) {
      return '<p class="vazio">Não encontrei passos para sugerir com essas respostas. Escolha o que você quer agora e tente de novo.</p>';
    }
    var lista = plano.passos.map(function (p) {
      var links = p.links.map(function (l) {
        if (paraPapel) return "<li>" + esc(l[0]) + (ehInterno(l[1]) ? " (" + nomeArea(l[1]) + ")" : " — " + esc(l[1])) + "</li>";
        return ehInterno(l[1])
          ? '<li><a href="' + esc(l[1]) + '">' + esc(l[0]) + "</a> — " + esc(l[2]) + "</li>"
          : '<li><a href="' + esc(l[1]) + '" target="_blank" rel="noopener noreferrer">' + esc(l[0]) + "</a> — " + esc(l[2]) + "</li>";
      }).join("");
      var acao = !paraPapel && p.acao === "curriculo" ? '<p><button type="button" class="btn secundario" data-rolar="montar-curriculo">Ir para o montador de currículo</button></p>' : "";
      return '<li class="passo"><h3>' + p.numero + ". " + esc(p.titulo) + "</h3><p>" + esc(p.porque) + "</p>" +
        "<ul>" + p.fazer.map(function (f) { return "<li>" + esc(f) + "</li>"; }).join("") + "</ul>" +
        (links ? '<p class="meta">Onde procurar:</p><ul class="onde">' + links + "</ul>" : "") + acao +
        '<p class="meta"><strong>Se não der certo:</strong> ' + esc(p.alternativa) + "</p></li>";
    }).join("");
    return '<ol class="plano">' + lista + "</ol>" +
      '<div class="status" role="note">' + plano.avisos.map(function (a) { return "<p>" + esc(a) + "</p>"; }).join("") + "</div>";
  }

  function htmlCurriculo(cv) {
    if (cv.vazio) return '<p class="vazio">Preencha pelo menos o nome ou uma das seções para gerar o currículo.</p>';
    return '<article class="curriculo-folha">' + (cv.nome ? "<h3>" + esc(cv.nome) + "</h3>" : "") +
      (cv.contato.length ? '<p class="contato">' + cv.contato.map(esc).join(" · ") + "</p>" : "") +
      cv.secoes.map(function (s) {
        return "<h4>" + esc(s.titulo) + "</h4><ul>" + s.itens.map(function (i) { return "<li>" + esc(i) + "</li>"; }).join("") + "</ul>";
      }).join("") + "</article>";
  }

  function mostrarPlano() {
    ultimo.plano = J.montarPlano(ultimo.resp);
    $("plano-saida").innerHTML = htmlPlano(ultimo.plano) +
      (ultimo.plano.passos.length ? '<div class="acoes"><button type="button" class="btn" data-imprimir="plano">Imprimir ou salvar em PDF</button></div>' : "");
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
    if (ultimo.resp) {
      Object.keys(ultimo.resp).forEach(function (k) {
        var el = document.getElementById("p-" + k + "-" + ultimo.resp[k]); if (el) el.checked = true;
      });
      var fc = $("f-cuidado"); if (fc) fc.hidden = ultimo.resp.filhos !== "sim";
      mostrarPlano();
    }
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

  /* ------------------------------------------------------------ ligação */
  function respostas() {
    var r = {};
    J.PERGUNTAS.forEach(function (p) {
      var el = document.querySelector('input[name="p-' + p.id + '"]:checked');
      if (el) r[p.id] = el.value;
    });
    return r;
  }

  function limpar() {
    ultimo.resp = null; ultimo.plano = null; ultimo.cvDados = null; ultimo.curriculo = null;
    limparFolha();
  }

  function ligar() {
    document.addEventListener("change", function (e) {
      if (e.target && e.target.name === "p-filhos") {
        var sim = e.target.value === "sim", f = $("f-cuidado");
        if (f) { f.hidden = !sim; if (!sim) f.querySelectorAll("input").forEach(function (i) { i.checked = false; }); }
      }
    });
    document.addEventListener("submit", function (e) {
      if (e.target.id === "form-plano") {
        e.preventDefault();
        ultimo.resp = respostas();
        mostrarPlano();
        $("plano-saida").scrollIntoView({ block: "start" });
      } else if (e.target.id === "form-curriculo") {
        e.preventDefault();
        var d = {};
        CAMPOS_CV.forEach(function (k) { d[k] = $("c-" + k).value; });
        ultimo.cvDados = d;
        mostrarCurriculo();
      }
    });
    document.addEventListener("click", function (e) {
      var t = e.target.closest ? e.target.closest("[data-imprimir],[data-limpar],[data-rolar]") : null;
      if (!t) return;
      if (t.hasAttribute("data-rolar")) {
        var alvo = $(t.getAttribute("data-rolar"));
        if (alvo) { var d = alvo.querySelector("details"); if (d) d.open = true; alvo.scrollIntoView({ block: "start" }); var campo = alvo.querySelector("input"); if (campo) campo.focus({ preventScroll: true }); }
      } else if (t.getAttribute("data-limpar") === "plano") {
        $("form-plano").reset(); var fc = $("f-cuidado"); if (fc) fc.hidden = true; $("plano-saida").innerHTML = ""; ultimo.resp = null; ultimo.plano = null;
      } else if (t.getAttribute("data-limpar") === "curriculo") {
        $("form-curriculo").reset(); $("curriculo-saida").innerHTML = ""; ultimo.cvDados = null; ultimo.curriculo = null;
      } else if (t.getAttribute("data-imprimir") === "plano" && ultimo.plano) {
        imprimir("<h1>Meu plano — Trabalho e cuidado</h1><p>Mulher em Rede · Rio Claro/SP · gerado em " + hoje() + "</p>" + htmlPlano(ultimo.plano, true) +
          "<p>Confirme sempre telefone, endereço, horário e vagas diretamente com cada órgão antes de ir.</p>");
      } else if (t.getAttribute("data-imprimir") === "curriculo" && ultimo.curriculo) {
        imprimir(htmlCurriculo(ultimo.curriculo));
      }
    });
    window.addEventListener("afterprint", limparFolha);
  }

  raiz.JornadaUI = { html: html, ligar: ligar, limpar: limpar, restaurar: restaurar, htmlPlano: htmlPlano, htmlCurriculo: htmlCurriculo };
})(typeof self !== "undefined" ? self : this);
