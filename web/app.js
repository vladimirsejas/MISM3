/* Interface do Mapa do Cuidado. O CEP digitado nunca sai do navegador e nunca e gravado. */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var dados = { indice: null, servicos: null, demo: false };
  var mapa = null, camadas = null, tiles = null;

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

  function iniciar() {
    carregar("dados/cep_indice.json").then(function (idx) {
      return carregar("dados/servicos.json").then(function (sv) { return [idx, sv, false]; });
    }).catch(function () {
      return Promise.all([carregar("dados/demo/cep_indice.json"), carregar("dados/demo/servicos.json")])
        .then(function (r) { return [r[0], r[1], true]; });
    }).then(function (r) {
      dados.indice = r[0].ceps; dados.servicos = r[1].servicos;
      dados.demo = !!(r[0].meta && r[0].meta.demo) || !!(r[1].meta && r[1].meta.demo);
      $("faixa-demo").hidden = !dados.demo;
      $("fontes").textContent = "Índice de CEPs: " + (r[0].meta.fonte || "") + " · Serviços gerados em " + (r[1].meta.gerado_em || "?") + ".";
      if (dados.demo) mostrarMensagem("Modo demonstração: use os CEPs fictícios 00000-001, 00000-002 ou 00000-003.");
    }).catch(function () {
      mostrarMensagem("Não foi possível carregar os dados. Abra o site por um servidor local (veja o README).");
    });
  }

  function mostrarMensagem(t) { var m = $("mensagem"); m.textContent = t; m.hidden = !t; }

  function cartao(s, area) {
    var partes = [];
    var tipoTxt = Acesso.rotuloSubtipo(s.subtipo);
    if (tipoTxt) partes.push('<p class="meta">' + esc(tipoTxt) + "</p>");
    if (s.distancia_m != null) {
      var aprox = s.geo === "centroide_cep" ? " (localização aproximada pelo CEP do serviço)" : "";
      partes.push('<p class="dist">' + esc(Acesso.formatarDistancia(s.distancia_m)) + aprox + "</p>");
    } else if (s.abrangencia === "municipal") {
      partes.push('<p class="dist">Atende todo o município</p>');
    } else {
      partes.push('<p class="meta">Localização ainda não disponível</p>');
    }
    if (s.endereco) partes.push("<p>" + esc(s.endereco) + "</p>");
    if (s.telefone) partes.push('<p>Telefone: <a href="tel:' + esc(String(s.telefone).replace(/[^\d+]/g, "")) + '">' + esc(s.telefone) + "</a></p>");
    if (s.horario) partes.push("<p>Horário: " + esc(s.horario) + "</p>");
    if (s.observacao) partes.push("<p>" + esc(s.observacao) + "</p>");
    var fonte = s.fonte_url ? '<a href="' + esc(s.fonte_url) + '" target="_blank" rel="noopener noreferrer">' + esc(s.fonte) + "</a>" : esc(s.fonte);
    partes.push('<p class="meta">Fonte: ' + fonte + " · verificado em " + esc(s.verificado_em) + "</p>");
    return '<article class="cartao"><h3>' + esc(s.nome) + "</h3>" + partes.join("") + "</article>";
  }

  function desenhar(r) {
    var html = "";
    r.grupos.forEach(function (g) {
      var itens = g.municipais.concat(g.proximos);
      html += '<section class="grupo"><h2>' + esc(g.rotulo) + "</h2>";
      if (!itens.length && !g.sem_localizacao.length) {
        html += '<p class="vazio">Nenhum serviço deste tipo cadastrado ainda. Isso não significa que não exista: significa que ainda não temos o dado.</p>';
      }
      itens.forEach(function (s) { html += cartao(s, r.area); });
      if (g.sem_localizacao.length) {
        html += '<p class="meta">' + g.sem_localizacao.length + " serviço(s) deste tipo sem localização no mapa:</p>";
        g.sem_localizacao.slice(0, 5).forEach(function (s) { html += cartao(s, r.area); });
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
    L.circle([r.area.lat, r.area.lon], { radius: Math.max(r.area.raio_m, 150), color: "#6b2d8a", fillOpacity: 0.12 })
      .bindTooltip("Sua região aproximada").addTo(camadas);
    r.grupos.forEach(function (g) {
      g.proximos.forEach(function (s) {
        pts.push([s.lat, s.lon]);
        L.circleMarker([s.lat, s.lon], { radius: 7, color: "#fff", weight: 2, fillColor: "#a4161a", fillOpacity: 1 })
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
    if (!dados.indice) { mostrarMensagem("Os dados ainda estão carregando. Tente de novo."); return; }
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

  $("sair-rapido").addEventListener("click", function () {
    $("cep").value = ""; $("grupos").innerHTML = "";
    window.location.replace("https://www.google.com.br/");
  });

  iniciar();
})();
