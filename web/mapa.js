/* Tela do mapa de serviços. Dados: catalogo_manual.json (serviços), cep_indice.json (centro aproximado de cada CEP) e
   setores.geojson (só o desenho do contorno da cidade). Nada é enviado, gravado ou posto na barra de endereço.
   Texto de serviço entra sempre por textContent; o único innerHTML é o SVG do marcador, feito só de constantes. */
(function () {
  "use strict";
  var MS = window.MapaServicos, Acesso = window.Acesso;
  var $ = function (id) { return document.getElementById(id); };
  var POR_PAGINA = 24;

  var estado = { todos: [], indice: null, apelidos: [], ativas: {}, texto: "", origem: null, origemRaio: 0, limite: POR_PAGINA };
  var mapa = null, camadaPontos = null, camadaOrigem = null, tiles = null, marcadores = {}, primeiraVez = true;

  function el(tag, classe, texto) {
    var e = document.createElement(tag);
    if (classe) e.className = classe;
    if (texto != null) e.textContent = texto;
    return e;
  }

  function carregar(url, obrigatorio) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error(url + ": " + r.status);
      return r.json();
    }).catch(function (e) { if (obrigatorio) throw e; return null; });
  }

  function mensagem(texto) {
    var m = $("mensagem-mapa");
    m.textContent = texto || "";
    m.hidden = !texto;
  }

  /* ---------------------------------------------------------------- cartão (lista e balão do mapa) */
  function linhaTexto(pai, rotulo, valor) {
    if (!valor) return;
    var p = el("p", "mapa-linha-info");
    p.appendChild(el("strong", null, rotulo + ": "));
    p.appendChild(document.createTextNode(valor));
    pai.appendChild(p);
  }

  function cartao(s, naLista) {
    var c = el("div", "mapa-cartao");
    c.appendChild(el("strong", "mapa-nome", s.nome));
    var estilo = MS.ESTILO[s.tipo];
    var tipo = (Acesso.ROTULOS[s.tipo] || s.tipo) + (Acesso.rotuloSubtipo(s.subtipo) ? " · " + Acesso.rotuloSubtipo(s.subtipo) : "");
    c.appendChild(el("p", "mapa-tipo", tipo));
    linhaTexto(c, "Endereço", s.endereco);
    if (s.telefone) {
      var p = el("p", "mapa-linha-info");
      p.appendChild(el("strong", null, "Telefone: "));
      var digitos = MS.primeiroTelefone(s.telefone);
      if (digitos) {
        var a = el("a", null, s.telefone);
        a.href = "tel:+55" + digitos;
        p.appendChild(a);
      } else p.appendChild(document.createTextNode(s.telefone));
      c.appendChild(p);
    }
    linhaTexto(c, "Horário", s.horario);
    var precisao = el("p", "mapa-precisao " + (s.pos ? "p-" + s.pos.precisao : "p-sem"), MS.rotuloPrecisao(s.pos));
    c.appendChild(precisao);
    if (s.distancia_m != null) c.appendChild(el("p", "mapa-linha-info", Acesso.formatarDistancia(s.distancia_m) + ", em linha reta."));
    var idade = Acesso.idadeVerificacao(s.verificado_em);
    var aviso = (s.conferido === false ? "Ainda não conferido: ligue antes de ir. " : "") + idade.texto.charAt(0).toUpperCase() + idade.texto.slice(1) + ".";
    c.appendChild(el("p", "mapa-meta", aviso));
    var acoes = el("p", "mapa-acoes");
    var g = MS.linkGoogleMaps(s);
    if (g) {
      var ga = el("a", "mapa-link", "Ver no Google Maps");
      ga.href = g; ga.target = "_blank"; ga.rel = "noopener noreferrer";
      acoes.appendChild(ga);
    }
    if (s.fonte_url) {
      var fa = el("a", "mapa-link", "Fonte");
      fa.href = s.fonte_url; fa.target = "_blank"; fa.rel = "noopener noreferrer";
      acoes.appendChild(fa);
    }
    if (naLista && s.pos && mapa) {
      var b = el("button", "mapa-ver", "Mostrar no mapa");
      b.type = "button";
      b.addEventListener("click", function () { mostrarNoMapa(s); });
      acoes.appendChild(b);
    }
    c.appendChild(acoes);
    if (estilo) c.style.borderLeftColor = estilo.cor;
    return c;
  }

  /* ---------------------------------------------------------------- mapa */
  function iniciarMapa(setores) {
    if (typeof L === "undefined") { mensagem("O mapa não pôde ser carregado, mas a lista abaixo funciona normalmente."); return; }
    mapa = L.map("mapa-servicos", { zoomControl: true, attributionControl: true }).setView([-22.41, -47.56], 12);
    if (setores) {
      var contorno = L.geoJSON(setores, { style: { color: "#d8bfb8", weight: 0.7, fillColor: "#f3e3dd", fillOpacity: 0.55 }, interactive: false }).addTo(mapa);
      try { mapa.fitBounds(contorno.getBounds()); } catch (e) { /* contorno inválido: segue com a vista padrão */ }
    }
    camadaPontos = L.layerGroup().addTo(mapa);
    camadaOrigem = L.layerGroup().addTo(mapa);
  }

  function desenharPontos(lista) {
    if (!mapa) return;
    camadaPontos.clearLayers();
    marcadores = {};
    var pts = [];
    lista.forEach(function (s) {
      if (!s.pos) return;
      var icone = L.divIcon({ className: "mapa-pino", html: MS.svgMarcador(s.tipo, s.pos.precisao === "cep"), iconSize: [28, 28], iconAnchor: [14, 14], popupAnchor: [0, -12] });
      var m = L.marker([s.pos.lat, s.pos.lon], { icon: icone, title: s.nome, alt: s.nome, keyboard: true });
      m.bindPopup(cartao(s, false), { maxWidth: 320 });
      m.addTo(camadaPontos);
      marcadores[s.id] = m;
      pts.push([s.pos.lat, s.pos.lon]);
    });
    if (estado.origem) pts.push(estado.origem);
    if (pts.length && (primeiraVez || estado.origem)) mapa.fitBounds(pts, { padding: [30, 30], maxZoom: 15 });
    primeiraVez = false;
    setTimeout(function () { mapa.invalidateSize(); }, 50);
  }

  function mostrarNoMapa(s) {
    var m = marcadores[s.id];
    if (!m) return;
    $("mapa-servicos").scrollIntoView({ behavior: "smooth", block: "center" });
    mapa.setView([s.pos.lat, s.pos.lon], Math.max(mapa.getZoom(), 15));
    m.openPopup();
  }

  /* ---------------------------------------------------------------- lista e resumo */
  function atualizar() {
    var visiveis = MS.ordenar(MS.filtrar(estado.todos, estado.ativas, estado.texto, estado.apelidos), estado.origem);
    var n = MS.contagem(visiveis);
    $("resumo-mapa").textContent = visiveis.length
      ? "Mostrando " + visiveis.length + " serviço" + (visiveis.length === 1 ? "" : "s") + ": " + n.endereco + " com posição pelo endereço, " +
        n.cep + " com posição aproximada pelo CEP e " + n.sem + " sem posição no mapa (aparecem só na lista)."
      : "Nenhum serviço encontrado com esses filtros.";
    desenharPontos(visiveis);
    var ul = $("lista-servicos");
    ul.textContent = "";
    visiveis.slice(0, estado.limite).forEach(function (s) {
      var li = el("li", "mapa-item");
      li.appendChild(cartao(s, true));
      ul.appendChild(li);
    });
    $("mais-servicos").hidden = visiveis.length <= estado.limite;
    $("nota-lista").textContent = estado.origem
      ? "Ordenados pela distância em linha reta até o centro do CEP informado; os sem posição ficam no fim."
      : "Ordenados por tipo de serviço e nome. Informe o CEP para ordenar pela distância.";
  }

  function montarFiltros() {
    var caixa = $("filtros");
    var totais = {};
    estado.todos.forEach(function (s) { totais[s.tipo] = (totais[s.tipo] || 0) + 1; });
    Acesso.ORDEM.forEach(function (tipo) {
      if (!totais[tipo]) return;
      estado.ativas[tipo] = true;
      var b = el("button", "mapa-chip");
      b.type = "button";
      b.setAttribute("aria-pressed", "true");
      var amostra = el("span", "mapa-amostra");
      amostra.innerHTML = MS.svgMarcador(tipo, false);
      b.appendChild(amostra);
      b.appendChild(document.createTextNode(MS.ESTILO[tipo].curto + " (" + totais[tipo] + ")"));
      b.addEventListener("click", function () {
        estado.ativas[tipo] = !estado.ativas[tipo];
        b.setAttribute("aria-pressed", String(estado.ativas[tipo]));
        estado.limite = POR_PAGINA;
        atualizar();
      });
      caixa.appendChild(b);
    });
  }

  /* ---------------------------------------------------------------- CEP (só marca uma região aproximada) */
  function aplicarCep(ev) {
    ev.preventDefault();
    var cep = Acesso.normalizarCep($("cep-mapa").value);
    if (!cep) { mensagem("Digite um CEP com 8 números."); return; }
    if (!estado.indice) { mensagem("A busca por CEP não está disponível nesta versão."); return; }
    var area = estado.indice[cep];
    if (!area) { mensagem("Não encontramos este CEP no índice de Rio Claro. Confira os números. Para apoio imediato: Ligue 180 (violência) ou 190 (emergência)."); return; }
    estado.origem = [area[0], area[1]];
    estado.origemRaio = area[2];
    if (camadaOrigem) {
      camadaOrigem.clearLayers();
      L.circle(estado.origem, { radius: Math.max(area[2], 150), color: "#a0404c", fillOpacity: 0.12 }).bindTooltip("Sua região aproximada").addTo(camadaOrigem);
    }
    $("limpar-cep").hidden = false;
    mensagem("Região aproximada pelo CEP " + cep.slice(0, 5) + "-" + cep.slice(5) + " (raio de cerca de " + area[2] + " m). Não é o seu endereço." +
      (area[2] > MS.RAIO_MAX_CEP_M ? " Este CEP cobre uma área grande: a ordem por distância é só uma ideia." : ""));
    estado.limite = POR_PAGINA;
    atualizar();
  }

  function limparCep() {
    estado.origem = null;
    if (camadaOrigem) camadaOrigem.clearLayers();
    $("cep-mapa").value = "";
    $("limpar-cep").hidden = true;
    mensagem("");
    atualizar();
  }

  /* ---------------------------------------------------------------- qual CRAS atende o bairro */
  function mostrarCras(ev) {
    ev.preventDefault();
    var saida = $("resultado-cras");
    saida.textContent = "";
    var texto = $("bairro-cras").value;
    var r = MS.crasDoBairro(texto, estado.todos, estado.apelidos);
    if (r.status === "vazio") { saida.appendChild(el("p", "mensagem", "Escreva o nome do bairro.")); return; }
    if (r.status === "nao_encontrado") {
      var p = el("p", "mensagem", "Não encontramos este bairro nas listas dos CRAS. Confira a escrita, ou veja a lista de CRAS abaixo e ligue para confirmar qual atende o seu endereço.");
      saida.appendChild(p);
      if (r.sugestoes.length) {
        saida.appendChild(el("p", "meta", "Nomes parecidos nas listas oficiais:"));
        var ul = el("ul", "mapa-sugestoes");
        r.sugestoes.forEach(function (x) { ul.appendChild(el("li", null, x.bairro + " (" + x.servico.nome + ")")); });
        saida.appendChild(ul);
      }
      return;
    }
    var vistos = {};
    var unicos = r.cras.filter(function (a) { if (vistos[a.servico.id]) return false; vistos[a.servico.id] = 1; return true; });
    var nomes = r.cras.map(function (a) { return "“" + a.bairro + "” (" + a.servico.nome + ")"; });
    var frase;
    if (r.metodo === "sem_tipo") frase = "Encontramos nomes parecidos na lista oficial: " + nomes.join("; ") + ". Confirme se é o seu bairro antes de ir:";
    else if (r.status === "ok") frase = "Pela lista oficial da Prefeitura, o bairro “" + r.cras[0].bairro + "” é atendido por:";
    else frase = "Este nome aparece na lista de mais de um CRAS (" + nomes.join("; ") + "). Confirme por telefone qual atende o seu endereço:";
    saida.appendChild(el("p", "mapa-cras-frase", frase));
    unicos.forEach(function (a) { saida.appendChild(cartao(a.servico, false)); });
    saida.appendChild(el("p", "meta", "A lista é da página oficial indicada em “Fonte”. Antes de ir, ligue para confirmar o atendimento e a área do seu endereço."));
  }

  /* ---------------------------------------------------------------- ligações da página */
  $("form-cras").addEventListener("submit", mostrarCras);
  $("form-cep-mapa").addEventListener("submit", aplicarCep);
  $("limpar-cep").addEventListener("click", limparCep);
  $("cep-mapa").addEventListener("input", function (e) {
    var d = e.target.value.replace(/\D/g, "").slice(0, 8);
    e.target.value = d.length > 5 ? d.slice(0, 5) + "-" + d.slice(5) : d;
  });
  $("busca-texto").addEventListener("input", function (e) { estado.texto = e.target.value; estado.limite = POR_PAGINA; atualizar(); });
  $("mais-servicos").addEventListener("click", function () { estado.limite += POR_PAGINA; atualizar(); });
  $("usar-tiles-mapa").addEventListener("change", function (e) {
    if (!mapa) return;
    if (e.target.checked) {
      tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18, attribution: "© OpenStreetMap contributors" }).addTo(mapa);
    } else if (tiles) { mapa.removeLayer(tiles); tiles = null; }
  });
  $("sair-rapido").addEventListener("click", function () {
    $("cep-mapa").value = "";
    $("busca-texto").value = "";
    window.location.replace("https://www.google.com.br/");
  });

  Promise.all([carregar("dados/catalogo_manual.json", true), carregar("dados/cep_indice.json", false), carregar("dados/setores.geojson", false),
    carregar("dados/bairros_apelidos.json", false)])
    .then(function (r) {
      estado.indice = r[1] && r[1].ceps ? r[1].ceps : null;
      estado.apelidos = r[3] && r[3].apelidos ? r[3].apelidos : [];
      estado.todos = MS.preparar(r[0].servicos || [], estado.indice);
      montarFiltros();
      iniciarMapa(r[2]);
      atualizar();
    }).catch(function () {
      mensagem("Não foi possível carregar os serviços agora. Tente de novo em instantes. Para apoio imediato: Ligue 180 (violência) ou 190 (emergência).");
    });
})();
