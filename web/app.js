/* Interface do Mulher em Rede (MISM3). O CEP digitado nunca sai do navegador e nunca é gravado. */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var AREAS = window.MISM3Areas;
  var dados = { indice: null, servicos: [], origem: "", geradoEm: "", falhou: false };
  var mapa = null, camadas = null, tiles = null;
  var LIMITE_CARTOES = 12;

  var ICONES = { trabalho: "i-trabalho", educacao: "i-educacao", saude: "i-saude", direitos: "i-direitos", moradia: "i-moradia", assistencia: "i-assistencia", onibus: "i-onibus" };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function carregar(url) {
    return fetch(url, { cache: "no-store" }).then(function (r) {
      if (!r.ok) throw new Error(url + " " + r.status);
      return r.json();
    });
  }
  function mostrarMensagem(t) { var m = $("mensagem"); m.textContent = t; m.hidden = !t; }

  /* ------------------------------------------------------------ cartões */
  /* Normaliza nomes de bairro para comparar: sem acento, minúsculas e abreviações da fonte por extenso. */
  var ABREV = { jd: "jardim", pq: "parque", res: "residencial", cond: "condominio", conj: "conjunto", hab: "habitacional" };
  function normBairro(t) {
    return MISM3Necessidades.normalizar(t).split(" ").map(function (p) { return ABREV[p] || p; }).join(" ");
  }

  /* Um campo pode ter mais de um número separado por " / ": cada um recebe o seu link (nunca um número emendado). */
  function linksTelefone(txt) {
    return String(txt).split(/\s+\/\s+/).map(function (t) {
      var num = t.replace(/[^\d+]/g, "");
      return num ? '<a href="tel:' + esc(num) + '">' + esc(t) + "</a>" : esc(t);
    }).join(" · ");
  }

  var AVISO_DATA = "Esta informação pode ter mudado. Confirme telefone, endereço e horário na fonte antes de ir.";

  function cartaoServico(s, semFonte) {
    var partes = [];
    var tipoTxt = Acesso.rotuloSubtipo(s.subtipo);
    if (tipoTxt) partes.push('<p class="meta">' + esc(tipoTxt) + "</p>");
    if (s.distancia_m != null) {
      var aprox = s.geo === "centroide_cep" ? " (localização aproximada pelo CEP do serviço)" : "";
      partes.push('<p class="dist">' + esc(Acesso.formatarDistancia(s.distancia_m)) + aprox + "</p>");
    } else if (s.abrangencia === "municipal") {
      partes.push('<p class="dist">Atende todo o município</p>');
    }
    if (s.endereco) partes.push("<p>" + esc(s.endereco) + "</p>");
    else partes.push('<p class="meta">Endereço não informado na fonte: ligue para confirmar.</p>');
    if (s.telefone) partes.push("<p>Telefone: " + linksTelefone(s.telefone) + "</p>");
    if (s.horario) partes.push("<p>Horário: " + esc(s.horario) + "</p>");
    if (s.observacao) partes.push('<p class="meta">' + esc(s.observacao) + "</p>");
    if (s.bairros) partes.push('<details class="bairros"><summary>Bairros atendidos</summary><p>' + esc(s.bairros) + ".</p></details>");
    var fonte = s.fonte_url ? '<a href="' + esc(s.fonte_url) + '" target="_blank" rel="noopener noreferrer">' + esc(s.fonte) + "</a>" : esc(s.fonte);
    if (semFonte) {
      /* a fonte comum aparece uma vez no fim do bloco */
    } else if (s.conferido === false) {
      partes.push('<p class="aviso-nao-conferido">' + (s.aviso ? esc(s.aviso) : "<strong>Ainda não conferido na página oficial.</strong> Ligue antes de ir.") + "</p>");
      partes.push('<p class="meta">Para conferir: ' + fonte + " · informado em " + esc(s.verificado_em) + "</p>");
    } else {
      var idade = Acesso.idadeVerificacao(s.verificado_em);
      partes.push('<p class="meta">Fonte: ' + fonte + " · verificado em " + esc(s.verificado_em) + " (" + esc(idade.texto) + ")</p>");
      if (idade.antigo) partes.push('<p class="aviso-data">' + AVISO_DATA + "</p>");
    }
    var dados_bairros = s.bairros ? ' data-bairros="' + esc(normBairro(s.bairros)) + '"' : "";
    return '<article class="cartao"' + dados_bairros + '><h3>' + esc(s.nome) + "</h3>" + partes.join("") + "</article>";
  }

  function cartaoLink(l) {
    if (String(l[1]).charAt(0) === "#") {
      return '<article class="cartao"><h3><a href="' + esc(l[1]) + '">' + esc(l[0]) + '</a></h3><p>' + esc(l[2]) + "</p></article>";
    }
    return '<article class="cartao"><h3><a href="' + esc(l[1]) + '" target="_blank" rel="noopener noreferrer">' + esc(l[0]) + '</a></h3><p>' + esc(l[2]) +
      '</p><p class="meta">' + esc(AREAS.NOTA_FONTE) + "</p></article>";
  }

  var CHECKLIST = '<article class="cartao"><h3>Antes de aceitar uma oportunidade</h3><ul><li>O horário e a escala combinam com sua rotina?</li><li>Quanto tempo e dinheiro o deslocamento vai exigir?</li><li>Como ficam os cuidados com crianças ou outros dependentes?</li><li>Salário, contrato, local de trabalho e custos estão claros?</li><li>Desconfie de anúncios que exigem pagamento para participar do processo seletivo.</li></ul><p class="meta">Este roteiro ajuda a avaliar a viabilidade; não substitui a conferência da empresa e da vaga.</p></article>';

  /* ------------------------------------------------------------ áreas */
  /* Em Assistência Social, CRAS e CREAS vêm antes dos demais serviços. */
  var ORDEM_SUBTIPO = { cras: 0, creas: 1, conselho_tutelar: 2, sede: 3, scfv: 5 };

  /* Serviços de um bloco: do tipo certo, do subtipo pedido (se houver) e ainda não mostrados em outro bloco. */
  function servicosDaSecao(sec, vistos) {
    var lista = dados.servicos.filter(function (s) {
      if (sec.tipos.indexOf(s.tipo) === -1 || vistos[s.id]) return false;
      if (sec.subtipos && sec.subtipos.indexOf(s.subtipo) === -1) return false;
      vistos[s.id] = true;
      return true;
    });
    return lista.sort(function (a, b) {
      var d = (ORDEM_SUBTIPO[a.subtipo] != null ? ORDEM_SUBTIPO[a.subtipo] : 4) - (ORDEM_SUBTIPO[b.subtipo] != null ? ORDEM_SUBTIPO[b.subtipo] : 4);
      return d || String(a.nome).localeCompare(String(b.nome), "pt-BR");
    });
  }

  var BUSCA_BAIRRO = '<div class="busca-area" id="busca-bairro"><label for="bairro">Qual CRAS atende o meu bairro?</label><input id="bairro" type="search" maxlength="60" placeholder="Digite o nome do bairro" autocomplete="off" aria-describedby="ajuda-bairro"><p id="ajuda-bairro" class="privacidade">A busca usa a lista de bairros publicada pela Prefeitura e acontece neste aparelho. Ruas não constam na lista: confirme por telefone.</p><p id="resposta-bairro" class="status" role="status" hidden></p></div>';

  function cartaoCanal(c) {
    var fonteTxt = c.fonte
      ? "Fonte: " + (c.fonte[1] ? '<a href="' + esc(c.fonte[1]) + '" target="_blank" rel="noopener noreferrer">' + esc(c.fonte[0]) + "</a>" : esc(c.fonte[0])) + " · " + esc(c.fonte[2]) + "."
      : "Canal nacional oficial.";
    return '<article class="cartao"><h3>' + esc(c.nome) + "</h3>" +
      (c.sem_tel ? "" : '<p><a class="tel-grande" href="tel:' + esc(c.tel) + '">' + esc(c.tel) + "</a></p>") +
      "<p>" + esc(c.texto) + "</p>" +
      (c.topicos ? '<details class="detalhes-canal"><summary>' + esc(c.resumo || "Ver quem tem direito, documentos e prazos") + '</summary><dl>' +
        c.topicos.map(function (t) { return "<dt>" + esc(t[0]) + "</dt><dd>" + esc(t[1]) + "</dd>"; }).join("") + "</dl></details>" : "") +
      (c.aviso ? '<p class="aviso-nao-conferido">' + esc(c.aviso) + "</p>" : "") +
      '<p class="meta">' + fonteTxt + "</p></article>";
  }

  /* Unidades vindas do CNES (sem grupo escrito) caem nos mesmos grupos das cadastradas à mão. */
  var GRUPO_POR_SUBTIPO = { ubs: "Unidades básicas de saúde (UBS e USF)", urgencia: "Pronto atendimento 24 horas", caps: "Saúde mental (CAPS)",
    especialidades: "Especialidades, reabilitação e saúde do trabalhador", hospital: "Hospitais e ambulatórios" };

  /* Blocos "agrupar": os serviços ficam em grupos recolhidos (por público), para a página não ficar carregada. */
  function htmlGrupos(servicos, sec) {
    var abrir = servicos.length <= 6; /* poucos serviços: já abertos; muitos: recolhidos com contagem */
    var ordem = [], porGrupo = Object.create(null);
    servicos.forEach(function (s) {
      /* "grupo" pode ter mais de um valor, separados por ";": o serviço aparece em cada um deles. */
      var nomes = String(s.grupo || GRUPO_POR_SUBTIPO[s.subtipo] || Acesso.rotuloSubtipo(s.subtipo) || "Outros serviços").split(";");
      nomes.forEach(function (g) {
        g = g.trim();
        if (!g) return;
        if (sec && sec.grupos && sec.grupos.indexOf(g) === -1) return; /* a seção só mostra os grupos que lhe cabem */
        if (!porGrupo[g]) { porGrupo[g] = []; ordem.push(g); }
        porGrupo[g].push(s);
      });
    });
    /* Ordem lógica por público; grupos novos (não listados) vão para o fim. */
    var PREFERIDA = ["Secretaria de Saúde", "Pronto atendimento 24 horas", "Unidades básicas de saúde (UBS e USF)", "Saúde mental (CAPS)", "Especialidades, reabilitação e saúde do trabalhador",
      "Hospitais e ambulatórios", "Farmácia, exames e transporte",
      "Emprego e orientação", "Cursos gratuitos de qualificação", "Concluir os estudos e graduação (SESI)", "Estudar e se qualificar ao mesmo tempo", "Cursos profissionalizantes (qualificação profissional)", "Cursos técnicos (ensino técnico)", "Cursos superiores de tecnologia",
      "Crianças e adolescentes", "Adultos (30 a 59 anos)", "Pessoas idosas (65 anos ou mais)", "APAE — pessoas com deficiência"];
    ordem.sort(function (x, y) {
      var a = PREFERIDA.indexOf(x), b = PREFERIDA.indexOf(y);
      return (a === -1 ? 99 : a) - (b === -1 ? 99 : b);
    });
    return ordem.map(function (g) {
      return '<details class="grupo-recolhido"' + (abrir ? " open" : "") + '><summary>' + esc(g) + " <span class=\"contagem\">(" + porGrupo[g].length + ')</span></summary><div class="lista-cartoes">' +
        porGrupo[g].map(function (s) { return cartaoServico(s, false); }).join("") + "</div></details>";
    }).join("");
  }

  /* Caixa de orientação no topo da área: diz o que a página tem e leva a cada parte (botões, pois a navegação usa o hash). */
  /* Campo para filtrar uma lista longa por nome ou bairro. O texto digitado fica só neste aparelho. */
  function htmlFiltro(sec) {
    var id = esc(sec.ancora);
    return '<div class="busca-area"><label for="filtro-' + id + '">' + esc(sec.filtro) + '</label>' +
      '<input id="filtro-' + id + '" type="search" maxlength="60" autocomplete="off" data-filtro="' + id + '" placeholder="' + esc(sec.filtroExemplo || "") + '">' +
      '<p class="meta" role="status" aria-live="polite" data-filtro-msg="' + id + '"></p></div>';
  }

  function semAcento(t) { return String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); }

  document.addEventListener("input", function (e) {
    var id = e.target && e.target.getAttribute ? e.target.getAttribute("data-filtro") : null;
    if (!id) return;
    var lista = document.querySelector('[data-lista="' + id + '"]');
    if (!lista) return;
    var termos = semAcento(e.target.value).split(/\s+/).filter(Boolean);
    var cartoes = lista.querySelectorAll(".cartao"), n = 0;
    Array.prototype.forEach.call(cartoes, function (c) {
      var t = semAcento(c.textContent);
      var ok = termos.every(function (x) { return t.indexOf(x) !== -1; });
      c.hidden = !ok;
      if (ok) n++;
    });
    var msg = document.querySelector('[data-filtro-msg="' + id + '"]');
    if (msg) msg.textContent = !termos.length ? "" : (n ? n + " de " + cartoes.length + " encontradas." : "Nenhuma encontrada. Tente só uma parte do nome ou do bairro.");
  });

  function htmlGuia(g) {
    var itens = g.itens.map(function (i) {
      var alvo = i.href
        ? '<a class="btn-rolar" href="' + esc(i.href) + '">' + esc(i.botao) + "</a>"
        : '<button type="button" class="btn-rolar" data-rolar="' + esc(i.ancora) + '">' + esc(i.botao) + "</button>";
      return "<li><strong>" + esc(i.titulo) + "</strong><span>" + esc(i.texto) + "</span>" + alvo + "</li>";
    }).join("");
    return '<nav class="guia-area" aria-label="' + esc(g.titulo) + '"><h2>' + esc(g.titulo) + "</h2>" +
      (g.texto ? "<p>" + esc(g.texto) + "</p>" : "") + "<ul>" + itens + "</ul></nav>";
  }

  /* ------------------------------------------------------------ horários de ônibus (SOU Transportes) */
  var DIA_DA_SEMANA = ["Domingos", "Dias úteis", "Dias úteis", "Dias úteis", "Dias úteis", "Dias úteis", "Sábados"];
  function minutos(hhmm) { return parseInt(hhmm.slice(0, 2), 10) * 60 + parseInt(hhmm.slice(3), 10); }
  function dataBr(iso) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ""); return m ? m[3] + "/" + m[2] + "/" + m[1] : ""; }

  function htmlSentido(h, s, hoje) {
    var tipoHoje = DIA_DA_SEMANA[hoje.getDay()], agora = hoje.getHours() * 60 + hoje.getMinutes();
    var proximos = [];
    s.quadros.forEach(function (q) {
      if (q.dia === tipoHoje) q.horarios.forEach(function (x) { if (minutos(x) >= agora) proximos.push(x); });
    });
    proximos = proximos.filter(function (x, i) { return proximos.indexOf(x) === i; }).sort().slice(0, 3);
    var html = '<div class="sentido"><h3>' + esc(s.sentido) + "</h3>";
    html += proximos.length
      ? '<p class="proximos">Próximas saídas hoje (' + esc(tipoHoje.toLowerCase()) + "): " + proximos.map(function (x) { return "<strong>" + esc(x) + "</strong>"; }).join(", ") + ' <span class="meta">pelo relógio do seu aparelho</span></p>'
      : '<p class="proximos meta">Pelas páginas da SOU, não há mais saídas hoje (' + esc(tipoHoje.toLowerCase()) + ") neste sentido.</p>";
    ["Dias úteis", "Sábados", "Domingos"].forEach(function (dia) {
      var qs = s.quadros.filter(function (q) { return q.dia === dia; });
      if (!qs.length) return;
      var dias = (h.dias || {})[dia];
      html += '<details class="dia-horarios"' + (dia === tipoHoje ? " open" : "") + "><summary>" + esc(dia) + (dias ? ' <span class="contagem">(' + esc(dias) + ")</span>" : "") + "</summary>";
      qs.forEach(function (q) {
        html += '<p class="trajeto">Trajeto: ' + esc(s.legenda[String(q.variante)] || "") + '</p><ul class="horas">' +
          q.horarios.map(function (x) { return '<li class="hora' + (dia === tipoHoje && x === proximos[0] ? " proxima" : "") + '">' + esc(x) + "</li>"; }).join("") + "</ul>";
      });
      html += "</details>";
    });
    return html + "</div>";
  }

  function htmlHorarios() {
    var h = dados.horarios;
    if (!h || !h.linhas || !h.linhas.length) return '<p class="vazio">Os horários de ônibus não foram carregados. Abra o sistema pelo procedimento do README.</p>';
    var hoje = new Date();
    var vencido = h.valido_ate && hoje > new Date(h.valido_ate + "T23:59:59");
    var html = '<div class="status" role="note"><strong>Horários da SOU Transportes.</strong> Páginas impressas em ' + esc(dataBr(h.fonte.impresso_em)) +
      ", válidas até " + esc(dataBr(h.valido_ate)) + "." +
      (vencido ? " <strong>Essa data já passou: confira os horários atuais no site da SOU.</strong>" : "") +
      ' Em feriados os horários podem mudar. <a href="' + esc(h.fonte.url) + '" target="_blank" rel="noopener noreferrer">Conferir no site da SOU</a>.</div>';
    html += '<div class="lista-linhas">';
    h.linhas.forEach(function (l) {
      var ids = l.sentidos.map(function (s) { return s.sentido; });
      html += '<details class="linha-onibus"><summary><span class="num-linha">' + esc(l.numero) + "</span><span>" + esc(l.nome) +
        ' <span class="contagem">' + esc(ids.join(" e ")) + "</span></span></summary>";
      l.sentidos.forEach(function (s) { html += htmlSentido(h, s, hoje); });
      if (l.sentidos.length < 2) html += '<p class="aviso-data">Só temos o sentido ' + esc(ids[0]) + " desta linha. Confira o outro sentido no site da SOU.</p>";
      html += "</details>";
    });
    html += "</div>";
    if (h.lacunas && h.lacunas.length) {
      html += '<aside class="pendente" aria-label="Ainda não disponível"><h2>Ainda não disponível</h2><ul>' + h.lacunas.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul></aside>";
    }
    return html;
  }

  function htmlArea(area) {
    var html = area.jornada && window.JornadaUI ? JornadaUI.html() : "";
    if (area.horarios) html += htmlHorarios();
    if (area.guia) html += htmlGuia(area.guia);
    var vistos = Object.create(null);
    area.secoes.forEach(function (sec, i) {
      var cartoes = "", notaFonte = "";
      if (sec.urgente) {
        cartoes += '<article class="cartao urgente"><h3>Ajuda imediata</h3><p>Perigo imediato: <a class="tel-grande" href="tel:190">190</a> (Polícia)</p><p>Violência contra a mulher: <a class="tel-grande" href="tel:180">180</a> (24 horas, gratuito)</p><p class="meta">Mais contatos no botão “Em perigo agora?”. Não é necessário contar sua história a este sistema.</p></article>';
      }
      (sec.canais || []).forEach(function (c) { cartoes += cartaoCanal(c); });
      if (i === 0 && area.checklist) cartoes += CHECKLIST;
      var servicos = servicosDaSecao(sec, vistos);
      var nomes = servicos.map(function (s) { return String(s.nome).toLowerCase(); });
      sec.links.forEach(function (l) { if (nomes.indexOf(l[0].toLowerCase()) === -1) cartoes += cartaoLink(l); });
      var limitar = !sec.recolhida && !sec.agrupar;
      var visiveis = limitar ? servicos.slice(0, LIMITE_CARTOES) : servicos;
      var corpo = "";
      if (sec.busca === "bairro") corpo += BUSCA_BAIRRO;
      if (sec.filtro) corpo += htmlFiltro(sec);
      if (sec.agrupar) {
        corpo += htmlGrupos(visiveis, sec);
      } else {
        /* Se todos os cartões do bloco têm a mesma fonte e data (e estão conferidos), a fonte aparece uma vez no fim. */
      var comum = !sec.agrupar && visiveis.length >= 3 && visiveis.every(function (s) {
        return s.conferido !== false && s.fonte === visiveis[0].fonte && s.fonte_url === visiveis[0].fonte_url && s.verificado_em === visiveis[0].verificado_em;
      });
      visiveis.forEach(function (s) { cartoes += cartaoServico(s, comum); });
      if (comum) {
        var idadeComum = Acesso.idadeVerificacao(visiveis[0].verificado_em);
        notaFonte = '<p class="meta fonte-comum">Fonte de todos os cartões acima: <a href="' + esc(visiveis[0].fonte_url) + '" target="_blank" rel="noopener noreferrer">' + esc(visiveis[0].fonte) + "</a> · verificado em " + esc(visiveis[0].verificado_em) + " (" + esc(idadeComum.texto) + ").</p>" +
          (idadeComum.antigo ? '<p class="aviso-data">' + AVISO_DATA + "</p>" : "");
      }
      }
      if (cartoes) corpo += '<div class="lista-cartoes"' + (sec.filtro ? ' data-lista="' + esc(sec.ancora) + '"' : "") + ">" + cartoes + "</div>" + notaFonte;
      if (servicos.length > visiveis.length) {
        corpo += '<p class="mais"><button type="button" class="btn secundario" data-mais="' + i + '">Mostrar todos (' + servicos.length + ")</button></p>";
      }
      if (sec.tipos.length && !servicos.length && !sec.links.length && !(sec.canais || []).length) {
        corpo += '<p class="vazio">' + (dados.falhou
          ? "Não foi possível carregar o catálogo de serviços. Abra o sistema pelo procedimento do README."
          : "Nenhum serviço desta categoria está carregado nesta versão. Isso não significa que não exista: significa que ainda não temos o dado.") + "</p>";
      } else if (sec.tipos.length && !servicos.length && !cartoes && !corpo) {
        corpo += '<p class="vazio">Nenhum serviço cadastrado neste bloco ainda.</p>';
      }
      var total = servicos.length + sec.links.length + (sec.canais || []).length;
      var idSecao = sec.ancora ? ' id="' + esc(sec.ancora) + '"' : "";
      if (sec.recolhida) {
        html += '<section class="secao"' + idSecao + '><details class="secao-recolhida"><summary><h2>' + esc(sec.titulo) + ' <span class="contagem">(' + total + ")</span></h2></summary>" +
          (sec.descricao ? "<p class=\"meta\">" + esc(sec.descricao) + "</p>" : "") + corpo + "</details></section>";
      } else {
        html += '<section class="secao"' + idSecao + '><h2' + (sec.ancora ? ' tabindex="-1"' : "") + '>' + esc(sec.titulo) + "</h2>" + (sec.descricao ? '<p class="meta">' + esc(sec.descricao) + "</p>" : "") + corpo + "</section>";
      }
    });
    if (area.avisos && area.avisos.length) {
      html += '<div class="status" role="note"><strong>Importante.</strong> ' + area.avisos.map(esc).join(" ") + "</div>";
    }
    var pend = (area.pendencias || []).slice();
    if (pend.length) {
      html += '<aside class="pendente" aria-label="Ainda não disponível ou não confirmado"><h2>Ainda não disponível ou não confirmado</h2><ul>' +
        pend.map(function (p) { return "<li>" + esc(p) + "</li>"; }).join("") + "</ul></aside>";
    }
    return html;
  }

  /* Rola até uma seção ou bloco (abrindo-o se estiver recolhido) e leva o foco ao título. Devolve false se não existir. */
  function rolarPara(id) {
    var alvo = document.getElementById(id);
    if (!alvo) return false;
    var recolhida = alvo.querySelector("details.secao-recolhida");
    if (recolhida) recolhida.open = true;
    var calmo = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    alvo.scrollIntoView({ behavior: calmo ? "auto" : "smooth", block: "start" });
    var h = /^H[1-6]$/.test(alvo.tagName) ? alvo : alvo.querySelector("h2");
    if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
    return true;
  }
  document.addEventListener("click", function (ev) {
    var b = ev.target.closest ? ev.target.closest("[data-rolar]") : null;
    if (b) rolarPara(b.getAttribute("data-rolar"));
  });

  function mostrarTodos(area, indiceSecao, botao) {
    var vistos = Object.create(null);
    var alvo = [];
    area.secoes.forEach(function (sec, i) {
      var lista = servicosDaSecao(sec, vistos);
      if (i === indiceSecao) alvo = lista;
    });
    var cont = botao.parentNode.previousElementSibling;
    var extra = "";
    alvo.slice(LIMITE_CARTOES).forEach(function (s) { extra += cartaoServico(s); });
    cont.insertAdjacentHTML("beforeend", extra);
    botao.parentNode.remove();
  }

  /* ------------------------------------------------------------ IA: "Conte com suas palavras" */
  /* O modelo só é baixado quando a pessoa usa a caixa. O texto nunca sai do aparelho e é apagado ao sair da tela inicial. */
  var modeloIA = null;
  function carregarModeloIA() {
    if (modeloIA) return modeloIA;
    modeloIA = carregar("dados/modelo_necessidades.json").then(function (m) { MISM3IA.usarModelo(m); }).catch(function () { /* sem o modelo, só as regras */ });
    return modeloIA;
  }
  function limparIA() {
    var t = $("ia-texto"); if (!t) return;
    t.value = ""; $("ia-saida").innerHTML = ""; $("ia-limpar").hidden = true;
  }
  function htmlSugestoes(lista) {
    if (!lista.length) {
      return '<p class="ia-vazio">Não consegui entender por onde começar. Tente descrever de outro jeito, ou escolha uma das áreas abaixo.</p>';
    }
    var urgente = lista[0].urgente
      ? '<p class="ia-urgente" role="alert"><strong>Se você corre perigo agora, ligue 190 (Polícia Militar) ou 180 (Central de Atendimento à Mulher), ou toque em “Em perigo agora?”.</strong></p>' : "";
    return urgente + '<p class="meta">Sugestões da ferramenta. Ela pode errar: confira em cada área.</p><ul class="ia-lista">' + lista.map(function (s) {
      return '<li><a class="ia-card' + (s.urgente ? " urgente" : "") + '" href="' + esc(s.href) + '"><strong>' + esc(s.titulo) + "</strong><span>" + esc(s.texto) + "</span></a></li>";
    }).join("") + "</ul>";
  }
  function usarIA() {
    var t = $("ia-texto"), saida = $("ia-saida");
    if (!t.value.replace(/\s/g, "")) { saida.innerHTML = '<p class="ia-vazio">Escreva uma frase para eu poder ajudar.</p>'; return; }
    saida.innerHTML = '<p class="meta">Lendo…</p>';
    carregarModeloIA().then(function () {
      saida.innerHTML = htmlSugestoes(MISM3IA.sugerir(t.value));
      $("ia-limpar").hidden = false;
    });
  }
  if ($("ia-enviar")) {
    $("ia-enviar").addEventListener("click", usarIA);
    $("ia-limpar").addEventListener("click", function () { limparIA(); $("ia-texto").focus(); });
    $("ia-texto").addEventListener("focus", carregarModeloIA, { once: true });
    $("ia-texto").addEventListener("keydown", function (e) { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) usarIA(); });
  }

  /* ------------------------------------------------------------ navegação */
  var areaAtual = null;

  function limparResultadoCep() {
    $("resultado").hidden = true; $("grupos").innerHTML = ""; $("cep").value = ""; mostrarMensagem("");
  }

  function mostrarInicio() {
    areaAtual = null;
    if (window.JornadaUI) JornadaUI.limpar();
    limparIA();
    $("inicio-tela").hidden = false; $("area").hidden = true; $("fontes").hidden = true;
    $("navegacao").hidden = true; $("secao-atual").hidden = true;
    document.title = "Mulher em Rede – Rio Claro";
    limparResultadoCep();
  }

  function mostrarArea(area) {
    areaAtual = area;
    limparIA();
    $("inicio-tela").hidden = true; $("area").hidden = false; $("fontes").hidden = false;
    $("navegacao").hidden = false; $("secao-atual").hidden = false;
    $("nome-secao").textContent = "Início › " + area.nome;
    $("titulo-area").innerHTML = '<span class="icone-titulo"><svg aria-hidden="true" width="28" height="28"><use href="#' + ICONES[area.icone] + '"/></svg></span>' + esc(area.nome);
    $("intro-area").textContent = area.intro;
    $("conteudo-area").innerHTML = htmlArea(area);
    if (area.jornada && window.JornadaUI) JornadaUI.restaurar();
    var temServicos = area.secoes.some(function (s) { return s.tipos.length; });
    $("busca-por-cep").hidden = !(dados.indice && temServicos);
    limparResultadoCep();
    document.title = area.nome + " – Mulher em Rede";
  }

  function render(foco) {
    /* #area ou #area/seção: o que vem depois da barra leva direto a uma seção da área. */
    var partes = (location.hash || "").replace(/^#/, "").split("/");
    var id = partes[0], secao = partes[1];
    var area = id ? AREAS.porId(id) : null;
    if (area) mostrarArea(area); else mostrarInicio();
    window.scrollTo(0, 0);
    if (area && secao && rolarPara(secao)) return;
    if (foco) (area ? $("titulo-area") : $("titulo-inicio")).focus({ preventScroll: true });
  }

  function irPara(hash) {
    history.pushState({ app: true }, "", hash || location.pathname + location.search);
    render(true);
  }

  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[href^='#']");
    if (a && a.getAttribute("href").length > 1) { e.preventDefault(); irPara(a.getAttribute("href")); }
    var mais = e.target.closest && e.target.closest("[data-mais]");
    if (mais && areaAtual) mostrarTodos(areaAtual, parseInt(mais.getAttribute("data-mais"), 10), mais);
  });
  window.addEventListener("popstate", function () { render(true); });
  if (window.JornadaUI) JornadaUI.ligar();

  /* Voltar: se a usuária chegou aqui clicando dentro do sistema, volta no histórico; senão vai ao início.
     Nunca deixa a pessoa presa nem a leva a outra seção. */
  $("voltar").addEventListener("click", function (e) {
    e.preventDefault();
    if (history.state && history.state.app) history.back();
    else { history.replaceState(null, "", location.pathname + location.search); render(true); }
  });
  $("inicio").addEventListener("click", function (e) { e.preventDefault(); irPara(""); });
  $("marca").addEventListener("click", function (e) { e.preventDefault(); if (areaAtual) irPara(""); });

  /* ------------------------------------------------------------ "qual CRAS atende o meu bairro?" */
  document.addEventListener("input", function (e) {
    if (e.target.id !== "bairro") return;
    var q = normBairro(e.target.value), r = $("resposta-bairro");
    var cards = document.querySelectorAll("article[data-bairros]");
    cards.forEach(function (c) { c.classList.remove("destaque"); });
    if (q.length < 3) { r.hidden = true; return; }
    var achados = [];
    cards.forEach(function (c) {
      if ((" " + c.getAttribute("data-bairros") + " ").indexOf(" " + q + " ") !== -1 || c.getAttribute("data-bairros").indexOf(q) !== -1) {
        c.classList.add("destaque"); achados.push(c.querySelector("h3").textContent);
      }
    });
    r.textContent = achados.length
      ? "Na lista da Prefeitura, este bairro aparece em: " + achados.join("; ") + "." + (achados.length > 1 ? " Aparece em mais de um: ligue para confirmar qual atende a sua rua." : " Os cartões destacados abaixo têm endereço e telefone.")
      : "Não encontrei esse bairro na lista dos CRAS. Confira a grafia ou ligue para a Secretaria de Desenvolvimento Social, (19) 3522-1930.";
    r.hidden = false;
  });

  /* ------------------------------------------------------------ emergência */
  var emerg = $("emergencia");
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && emerg.open) { emerg.open = false; emerg.querySelector("summary").focus(); }
  });
  document.addEventListener("click", function (e) { if (emerg.open && !emerg.contains(e.target)) emerg.open = false; });
  /* Botão "Emergência" da tela inicial: abre o mesmo painel de contatos do topo. */
  $("abrir-emergencia").addEventListener("click", function (e) {
    e.stopPropagation();
    emerg.open = true;
    var primeiro = emerg.querySelector("a.tel");
    if (primeiro) primeiro.focus();
  });
  $("sair-rapido").addEventListener("click", function () {
    limparResultadoCep();
    limparIA();
    window.location.replace("https://www.google.com.br/");
  });

  /* ------------------------------------------------------------ dados */
  function iniciar() {
    /* O catálogo verificado (catalogo_manual.json, versionado) vale SEMPRE. O servicos.json gerado pelo pipeline é opcional
       e só acrescenta o que não está no catálogo (CNES, Censo Escolar). Assim um servicos.json antigo nunca esconde
       cadastros novos, e uma unidade cadastrada à mão com o código CNES não aparece duas vezes. */
    function opcional(url) { return carregar(url).catch(function () { return null; }); }
    return Promise.all([opcional("dados/catalogo_manual.json"), opcional("dados/servicos.json"), opcional("dados/horarios_onibus.json")]).then(function (r) {
      dados.horarios = r[2];
      var manual = (r[0] && r[0].servicos) || [], pipeline = (r[1] && r[1].servicos) || [];
      var idsManuais = Object.create(null), codigosManuais = Object.create(null);
      manual.forEach(function (s) { idsManuais[s.id] = true; if (s.cnes) codigosManuais[String(s.cnes)] = true; });
      var acrescimos = pipeline.filter(function (s) {
        var id = String(s.id || "");
        return !idsManuais[id] && !(/^cnes-/.test(id) && codigosManuais[id.slice(5)]);
      });
      dados.servicos = manual.concat(acrescimos);
      /* O plano do Trabalho busca os telefones no mesmo catálogo verificado (uma só fonte, nada digitado duas vezes). */
      if (window.JornadaUI) JornadaUI.usarCatalogo(function (id) {
        for (var i = 0; i < dados.servicos.length; i++) if (dados.servicos[i].id === id) return dados.servicos[i];
        return null;
      });
      dados.falhou = !r[0] && !r[1];
      dados.origem = r[1] ? "Catálogo verificado e base do pipeline" : "Catálogo verificado manualmente";
      var datas = [r[0], r[1]].map(function (x) { return (x && x.meta && x.meta.gerado_em) || ""; }).sort();
      dados.geradoEm = datas[datas.length - 1];
    }).catch(function () { dados.falhou = true; }).then(function () {
      return carregar("dados/cep_indice.json").then(function (idx) {
        dados.indice = idx.ceps;
        /* Serviço com CEP e sem coordenada é localizado pelo centro do CEP (aproximado), como o pipeline faria. */
        dados.servicos.forEach(function (s) {
          var c = s.cep && dados.indice[String(s.cep).replace(/\D/g, "")];
          if (s.lat == null && c) { s.lat = c[0]; s.lon = c[1]; s.geo = "centroide_cep"; }
        });
      }).catch(function () { /* sem índice real a busca por CEP simplesmente não é oferecida */ });
    }).then(function () {
      var d = /^(\d{4})-(\d{2})-(\d{2})/.exec(dados.geradoEm);
      $("fontes").textContent = dados.falhou ? "O cadastro de serviços não foi carregado."
        : "Cadastro de serviços" + (d ? " atualizado em " + d[3] + "/" + d[2] + "/" + d[1] : "") + ".";
      desenharContatos();
    });
  }

  /* Contatos essenciais de Rio Claro: vêm do catálogo verificado (uma só fonte); se o catálogo não carregar, ficam só os nacionais. */
  var CONTATOS_LOCAIS = [
    ["man-cram", "CRAM, atendimento à mulher"], ["man-secretaria-mulher", "Secretaria Municipal da Mulher"],
    ["man-saude-upa-estadio", "UPA (Av. 29)"], ["man-conselho-tutelar-sul", "Conselho Tutelar, Região Sul"],
    ["man-conselho-tutelar-norte", "Conselho Tutelar, Região Norte"], ["man-creas", "CREAS"]
  ];
  function desenharContatos() {
    var lista = $("lista-contatos");
    if (!lista || !dados.servicos) return;
    var html = "";
    CONTATOS_LOCAIS.forEach(function (c) {
      var s = dados.servicos.filter(function (x) { return x.id === c[0]; })[0];
      if (!s || !s.telefone) return;
      var primeiro = String(s.telefone).split("/")[0].trim();
      var digitos = primeiro.replace(/\D/g, "");
      if (digitos.length < 8) return;
      /* Espaços dentro do número viram espaços sem quebra: o telefone não se parte no meio ("(19) 3532-" / "4014"). */
      var exibido = primeiro.replace(/^(\(\d{2}\)) /, "$1\u00a0").replace(/(\d) (\d)/g, "$1\u00a0$2");
      html += '<li><span class="c-nome">' + esc(c[1]) + '</span><a class="c-tel" href="tel:' + esc(digitos) + '">' + esc(exibido) + "</a></li>";
    });
    lista.insertAdjacentHTML("beforeend", html);
  }

  /* ------------------------------------------------------------ busca por CEP e mapa */
  function desenhar(r) {
    var html = "";
    r.grupos.forEach(function (g) {
      var itens = g.municipais.concat(g.proximos);
      html += '<section class="grupo"><h2>' + esc(g.rotulo) + "</h2>";
      if (!itens.length && !g.sem_localizacao.length) {
        html += '<p class="vazio">Nenhum serviço deste tipo cadastrado ainda. Isso não significa que não exista: significa que ainda não temos o dado.</p>';
      }
      html += '<div class="lista-cartoes">';
      itens.forEach(function (s) { html += cartaoServico(s); });
      html += "</div>";
      if (g.sem_localizacao.length) {
        html += '<p class="meta">' + g.sem_localizacao.length + " serviço(s) deste tipo sem localização no mapa:</p><div class=\"lista-cartoes\">";
        g.sem_localizacao.slice(0, 5).forEach(function (s) { html += cartaoServico(s); });
        html += "</div>";
      }
      if (g.total_local > g.proximos.length + g.sem_localizacao.length) {
        html += '<p class="meta">Mostrando os ' + g.proximos.length + " mais próximos de " + g.total_local + " cadastrados.</p>";
      }
      html += "</section>";
    });
    $("grupos").innerHTML = html;
    $("resumo-area").textContent = "Resultados a partir do centro do CEP " + r.cep.slice(0, 5) + "-" + r.cep.slice(5) +
      " (área aproximada de " + r.area.raio_m + " m de raio, " + r.area.n + " endereços no IBGE).";
    desenharMapa(r);
  }

  function desenharMapa(r) {
    if (typeof L === "undefined") return;
    if (!mapa) {
      mapa = L.map("mapa", { zoomControl: true, attributionControl: true }).setView([r.area.lat, r.area.lon], 14);
      camadas = L.layerGroup().addTo(mapa);
    }
    camadas.clearLayers();
    var pts = [[r.area.lat, r.area.lon]];
    L.circle([r.area.lat, r.area.lon], { radius: Math.max(r.area.raio_m, 150), color: "#a0404c", fillOpacity: 0.12 })
      .bindTooltip("Sua região aproximada").addTo(camadas);
    r.grupos.forEach(function (g) {
      g.proximos.forEach(function (s) {
        pts.push([s.lat, s.lon]);
        L.circleMarker([s.lat, s.lon], { radius: 7, color: "#fff", weight: 2, fillColor: "#7a2b37", fillOpacity: 1 })
          .bindPopup("<strong>" + esc(s.nome) + "</strong><br>" + esc(g.rotulo)).addTo(camadas);
      });
    });
    mapa.fitBounds(pts, { padding: [30, 30], maxZoom: 15 });
    setTimeout(function () { mapa.invalidateSize(); }, 50);
  }

  $("usar-tiles").addEventListener("change", function (e) {
    if (!mapa) return;
    if (e.target.checked) {
      tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18, attribution: "© OpenStreetMap contributors"
      }).addTo(mapa);
    } else if (tiles) { mapa.removeLayer(tiles); tiles = null; }
  });

  $("cep").addEventListener("input", function (e) {
    var d = e.target.value.replace(/\D/g, "").slice(0, 8);
    e.target.value = d.length > 5 ? d.slice(0, 5) + "-" + d.slice(5) : d;
  });

  $("form-cep").addEventListener("submit", function (ev) {
    ev.preventDefault();
    if (!dados.indice) { mostrarMensagem("A busca por CEP não está disponível nesta versão."); return; }
    var r = Acesso.buscar($("cep").value, dados.indice, dados.servicos, 3);
    $("resultado").hidden = r.status !== "ok";
    if (r.status === "cep_invalido") { mostrarMensagem("Digite um CEP com 8 números."); return; }
    if (r.status === "cep_desconhecido") {
      mostrarMensagem("Não encontramos este CEP no índice de Rio Claro. Confira os números. Para apoio imediato: Ligue 180 (violência) ou 190 (emergência).");
      return;
    }
    mostrarMensagem("");
    desenhar(r);
    $("resultado").scrollIntoView({ behavior: "smooth" });
  });

  iniciar().then(function () { render(false); });
})();
