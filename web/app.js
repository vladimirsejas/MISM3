/* Interface do Mulher em Rede (MISM3). O CEP digitado nunca sai do navegador e nunca é gravado. */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var AREAS = window.MISM3Areas;
  var dados = { indice: null, servicos: [], origem: "", geradoEm: "", falhou: false };
  var mapa = null, camadas = null, tiles = null;
  var LIMITE_CARTOES = 12;

  var ICONES = { trabalho: "i-trabalho", educacao: "i-educacao", saude: "i-saude", direitos: "i-direitos", moradia: "i-moradia", assistencia: "i-assistencia" };

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

  function cartaoServico(s) {
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
    if (s.conferido === false) {
      partes.push('<p class="aviso-nao-conferido">' + (s.aviso ? esc(s.aviso) : "<strong>Ainda não conferido na página oficial.</strong> Ligue antes de ir.") + "</p>");
      partes.push('<p class="meta">Para conferir: ' + fonte + " · informado em " + esc(s.verificado_em) + "</p>");
    } else {
      partes.push('<p class="meta">Fonte: ' + fonte + " · verificado em " + esc(s.verificado_em) + "</p>");
    }
    var dados_bairros = s.bairros ? ' data-bairros="' + esc(normBairro(s.bairros)) + '"' : "";
    return '<article class="cartao"' + dados_bairros + '><h3>' + esc(s.nome) + "</h3>" + partes.join("") + "</article>";
  }

  function cartaoLink(l) {
    return '<article class="cartao"><h3><a href="' + esc(l[1]) + '" target="_blank" rel="noopener noreferrer">' + esc(l[0]) + '</a></h3><p>' + esc(l[2]) +
      '</p><p class="meta">' + esc(AREAS.NOTA_FONTE) + "</p></article>";
  }

  var CHECKLIST = '<article class="cartao"><h3>Antes de aceitar uma oportunidade</h3><ul><li>O horário e a escala combinam com sua rotina?</li><li>Quanto tempo e dinheiro o deslocamento vai exigir?</li><li>Como ficam os cuidados com crianças ou outros dependentes?</li><li>Salário, contrato, local de trabalho e custos estão claros?</li><li>Desconfie de anúncios que exigem pagamento para participar do processo seletivo.</li></ul><p class="meta">Este roteiro ajuda a avaliar a viabilidade; não substitui a conferência da empresa e da vaga.</p></article>';

  /* ------------------------------------------------------------ áreas */
  /* Em Assistência Social, CRAS e CREAS vêm antes dos demais serviços. */
  var ORDEM_SUBTIPO = { cras: 0, creas: 1, conselho_tutelar: 2, sede: 3, scfv: 5 };

  function servicosDosTipos(tipos, vistos) {
    var lista = dados.servicos.filter(function (s) {
      if (tipos.indexOf(s.tipo) === -1 || vistos[s.id]) return false;
      vistos[s.id] = true;
      return true;
    });
    return lista.sort(function (a, b) {
      var d = (ORDEM_SUBTIPO[a.subtipo] != null ? ORDEM_SUBTIPO[a.subtipo] : 4) - (ORDEM_SUBTIPO[b.subtipo] != null ? ORDEM_SUBTIPO[b.subtipo] : 4);
      return d || String(a.nome).localeCompare(String(b.nome), "pt-BR");
    });
  }

  function htmlArea(area) {
    var html = "";
    var vistos = Object.create(null);
    if (area.id === "assistencia") {
      html += '<div class="busca-area" id="busca-bairro"><label for="bairro">Qual CRAS atende o meu bairro?</label><input id="bairro" type="search" maxlength="60" placeholder="Digite o nome do bairro" autocomplete="off" aria-describedby="ajuda-bairro"><p id="ajuda-bairro" class="privacidade">A busca usa a lista de bairros publicada pela Prefeitura e acontece neste aparelho. Ruas não constam na lista: confirme por telefone.</p><p id="resposta-bairro" class="status" role="status" hidden></p></div>';
    }
    area.secoes.forEach(function (sec, i) {
      var cartoes = "";
      if (sec.urgente) {
        cartoes += '<article class="cartao urgente"><h3>Ajuda imediata</h3><p>Perigo imediato: <a class="tel-grande" href="tel:190">190</a> (Polícia)</p><p>Violência contra a mulher: <a class="tel-grande" href="tel:180">180</a> (24 horas, gratuito)</p><p class="meta">Mais contatos no botão “Em perigo agora?”. Não é necessário contar sua história a este sistema.</p></article>';
      }
      if (i === 0 && area.canais) {
        area.canais.forEach(function (c) {
          cartoes += '<article class="cartao"><h3>' + esc(c.nome) + '</h3><p><a class="tel-grande" href="tel:' + esc(c.tel) + '">' + esc(c.tel) + "</a></p><p>" + esc(c.texto) + '</p><p class="meta">' + (c.fonte ? 'Fonte: <a href="' + esc(c.fonte[1]) + '" target="_blank" rel="noopener noreferrer">' + esc(c.fonte[0]) + "</a> · " + esc(c.fonte[2]) + "." : "Canal nacional oficial.") + "</p></article>";
        });
      }
      if (i === 0 && area.checklist) cartoes += CHECKLIST;
      var servicos = servicosDosTipos(sec.tipos, vistos);
      var nomes = servicos.map(function (s) { return String(s.nome).toLowerCase(); });
      sec.links.forEach(function (l) { if (nomes.indexOf(l[0].toLowerCase()) === -1) cartoes += cartaoLink(l); });
      var visiveis = servicos.slice(0, LIMITE_CARTOES);
      visiveis.forEach(function (s) { cartoes += cartaoServico(s); });
      html += '<section class="secao"><h2>' + esc(sec.titulo) + '</h2>';
      if (cartoes) html += '<div class="lista-cartoes">' + cartoes + "</div>";
      if (servicos.length > visiveis.length) {
        html += '<p class="mais"><button type="button" class="btn secundario" data-mais="' + i + '">Mostrar todos (' + servicos.length + ")</button></p>";
      }
      if (sec.tipos.length && !servicos.length) {
        html += '<p class="vazio">' + (dados.falhou
          ? "Não foi possível carregar o catálogo de serviços. Abra o sistema pelo procedimento do README."
          : "Nenhum serviço desta categoria está carregado nesta versão. Isso não significa que não exista: significa que ainda não temos o dado.") + "</p>";
      }
      html += "</section>";
    });
    if (area.avisos && area.avisos.length) {
      html += '<div class="status" role="note"><strong>Importante.</strong> ' + area.avisos.map(esc).join(" ") + "</div>";
    }
    if (area.pendencias && area.pendencias.length) {
      html += '<aside class="pendente" aria-label="Ainda não disponível ou não confirmado"><h2>Ainda não disponível ou não confirmado</h2><ul>' +
        area.pendencias.map(function (p) { return "<li>" + esc(p) + "</li>"; }).join("") + "</ul></aside>";
    }
    return html;
  }

  function mostrarTodos(area, indiceSecao, botao) {
    var vistos = Object.create(null);
    var alvo = [];
    area.secoes.forEach(function (s, i) {
      var lista = servicosDosTipos(s.tipos, vistos);
      if (i === indiceSecao) alvo = lista;
    });
    var cont = botao.parentNode.previousElementSibling;
    var extra = "";
    alvo.slice(LIMITE_CARTOES).forEach(function (s) { extra += cartaoServico(s); });
    cont.insertAdjacentHTML("beforeend", extra);
    botao.parentNode.remove();
  }

  /* ------------------------------------------------------------ navegação */
  var areaAtual = null;

  function limparResultadoCep() {
    $("resultado").hidden = true; $("grupos").innerHTML = ""; $("cep").value = ""; mostrarMensagem("");
  }

  function mostrarInicio() {
    areaAtual = null;
    $("inicio-tela").hidden = false; $("area").hidden = true; $("fontes").hidden = true;
    $("navegacao").hidden = true; $("secao-atual").hidden = true;
    document.title = "Mulher em Rede – Rio Claro";
    limparResultadoCep();
  }

  function mostrarArea(area) {
    areaAtual = area;
    $("inicio-tela").hidden = true; $("area").hidden = false; $("fontes").hidden = false;
    $("navegacao").hidden = false; $("secao-atual").hidden = false;
    $("nome-secao").textContent = "Início › " + area.nome;
    $("titulo-area").innerHTML = '<span class="icone-titulo"><svg aria-hidden="true" width="28" height="28"><use href="#' + ICONES[area.icone] + '"/></svg></span>' + esc(area.nome);
    $("intro-area").textContent = area.intro;
    $("conteudo-area").innerHTML = htmlArea(area);
    var temServicos = area.secoes.some(function (s) { return s.tipos.length; });
    $("busca-por-cep").hidden = !(dados.indice && temServicos);
    limparResultadoCep();
    $("necessidade").value = ""; $("resposta-necessidade").hidden = true;
    document.title = area.nome + " – Mulher em Rede";
  }

  function render(foco) {
    var id = (location.hash || "").replace(/^#/, "");
    var area = id ? AREAS.porId(id) : null;
    if (area) mostrarArea(area); else mostrarInicio();
    window.scrollTo(0, 0);
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

  /* ------------------------------------------------------------ "indicar área" (classificador local) */
  $("form-necessidade").addEventListener("submit", function (e) {
    e.preventDefault();
    var r = $("resposta-necessidade");
    var texto = $("necessidade").value;
    if (!texto.trim()) { r.textContent = "Digite o que você precisa, como emprego, creche, aluguel ou separação."; r.hidden = false; return; }
    var achadas = AREAS.areasDaNecessidade(MISM3Necessidades.identificarCategorias(texto));
    if (!achadas.length) {
      r.textContent = "Não reconheci essa necessidade. Volte ao início e escolha uma das áreas.";
    } else {
      r.innerHTML = "Veja: " + achadas.map(function (a) {
        return a === areaAtual ? esc(a.nome) + " (você já está aqui)" : '<a href="#' + esc(a.id) + '">' + esc(a.nome) + "</a>";
      }).join(" · ");
    }
    r.hidden = false;
  });

  /* ------------------------------------------------------------ emergência */
  var emerg = $("emergencia");
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && emerg.open) { emerg.open = false; emerg.querySelector("summary").focus(); }
  });
  document.addEventListener("click", function (e) { if (emerg.open && !emerg.contains(e.target)) emerg.open = false; });
  $("sair-rapido").addEventListener("click", function () {
    limparResultadoCep();
    window.location.replace("https://www.google.com.br/");
  });

  /* ------------------------------------------------------------ dados */
  function iniciar() {
    var tentativas = [["dados/servicos.json", "Base completa (pipeline)"], ["dados/catalogo_manual.json", "Catálogo verificado manualmente"]];
    function tentar(i) {
      if (i >= tentativas.length) return Promise.reject(new Error("sem catálogo"));
      return carregar(tentativas[i][0]).then(function (sv) {
        dados.servicos = sv.servicos; dados.origem = tentativas[i][1]; dados.geradoEm = (sv.meta && sv.meta.gerado_em) || "";
      }).catch(function () { return tentar(i + 1); });
    }
    return tentar(0).catch(function () { dados.falhou = true; }).then(function () {
      return carregar("dados/cep_indice.json").then(function (idx) {
        dados.indice = idx.ceps;
      }).catch(function () { /* sem índice real a busca por CEP simplesmente não é oferecida */ });
    }).then(function () {
      var d = /^(\d{4})-(\d{2})-(\d{2})/.exec(dados.geradoEm);
      $("fontes").textContent = dados.falhou ? "O cadastro de serviços não foi carregado."
        : "Cadastro de serviços" + (d ? " atualizado em " + d[3] + "/" + d[2] + "/" + d[1] : "") + ".";
    });
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
    L.circle([r.area.lat, r.area.lon], { radius: Math.max(r.area.raio_m, 150), color: "#7a4a8f", fillOpacity: 0.12 })
      .bindTooltip("Sua região aproximada").addTo(camadas);
    r.grupos.forEach(function (g) {
      g.proximos.forEach(function (s) {
        pts.push([s.lat, s.lon]);
        L.circleMarker([s.lat, s.lon], { radius: 7, color: "#fff", weight: 2, fillColor: "#5e3573", fillOpacity: 1 })
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
