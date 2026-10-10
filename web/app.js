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


  var CATEGORIAS = {
    emprego_curso: {
      titulo: "Emprego, renda e cursos",
      descricao: "Consulte oportunidades e cursos nas fontes oficiais. Antes de aceitar uma vaga, considere também a rotina de cuidado, o deslocamento, os horários e as condições do contrato.",
      tipos: ["emprego_curso"],
      links: [
        ["Portal da Empregabilidade de Rio Claro", "https://vagas.rioclaro.sp.gov.br/", "Consultar oportunidades e informações para trabalhadores."],
        ["Trampolim — Governo de São Paulo", "https://www.trampolim.sp.gov.br/", "Consultar oportunidades e cursos disponíveis na plataforma."]
      ]
    },
    saude: {
      titulo: "Saúde",
      descricao: "Encontre serviços de saúde cadastrados. Em urgência médica, ligue 192.",
      tipos: ["saude"],
      links: []
    },
    estudo: {
      titulo: "Estudo e qualificação",
      descricao: "Veja informações sobre educação infantil, escolas e cursos. A abertura de turma ou vaga precisa ser confirmada.",
      tipos: ["creche", "emprego_curso"],
      links: [
        ["Secretaria Municipal da Educação", "https://rioclaro.sp.gov.br/secretaria/secretaria-da-educacao/", "Informações oficiais sobre a rede municipal."],
        ["Fundo Social de Solidariedade", "https://rioclaro.sp.gov.br/secretaria/fundo-social-de-solidariedade/", "Informações sobre cursos e programas."]
      ]
    },
    filhos: {
      titulo: "Filhos: creche, escola e apoio",
      descricao: "Reúna os caminhos para educação infantil e apoio à família. A existência de uma unidade não confirma vaga disponível.",
      tipos: ["creche", "assistencia", "saude"],
      links: [
        ["Secretaria Municipal da Educação", "https://rioclaro.sp.gov.br/secretaria/secretaria-da-educacao/", "Orientações sobre a rede e matrícula."],
        ["Consulta pública da demanda escolar", "https://www.educacaorc.com.br/?r=demandaescolar", "Consulte as informações disponibilizadas no portal da Educação."]
      ]
    },
    casamento: {
      titulo: "Casamento, separação e direitos",
      descricao: "Veja caminhos para buscar orientação sobre direitos e questões familiares. O catálogo específico dessa área ainda está sendo ampliado.",
      tipos: ["mulher", "assistencia"],
      links: [
        ["Defensoria Pública do Estado de São Paulo", "https://www.defensoria.sp.def.br/", "Consulte os canais oficiais de orientação jurídica e os critérios de atendimento."]
      ]
    },
    violencia: {
      titulo: "Violência: proteção e ajuda",
      descricao: "Se houver perigo imediato, ligue 190. Para orientação e denúncia de violência contra a mulher, Ligue 180. Não é necessário contar sua história ao MISM3.",
      tipos: ["mulher", "assistencia"],
      links: [
        ["Ligue 180 — Central de Atendimento à Mulher", "https://www.gov.br/mulheres/pt-br/ligue180", "Canal nacional de atendimento, orientação e encaminhamento."],
        ["Secretaria Municipal da Mulher", "https://rioclaro.sp.gov.br/secretaria/secretaria-da-mulher/", "Consulte os contatos institucionais publicados pela Prefeitura."]
      ]
    },
    familia: {
      titulo: "Família e assistência",
      descricao: "Encontre serviços cadastrados de assistência, saúde, apoio à mulher e educação. Se uma informação estiver ausente, isso não significa que o serviço não exista.",
      tipos: ["assistencia", "mulher", "saude", "creche"],
      links: [
        ["Secretaria de Desenvolvimento Social", "https://rioclaro.sp.gov.br/secretaria/secretaria-de-desenvolvimento-social/", "Informações institucionais sobre assistência social."],
        ["Secretaria Municipal da Mulher", "https://rioclaro.sp.gov.br/secretaria/secretaria-da-mulher/", "Informações e contatos da Secretaria."]
      ]
    }
  };

  function abrirCategoria(chave) {
    abrirCategorias([chave]);
  }

  function abrirCategorias(chaves) {
    var validas = chaves.filter(function (chave, i) {
      return CATEGORIAS[chave] && chaves.indexOf(chave) === i;
    }).slice(0, 3);
    if (!validas.length) return;
    $("painel-categoria").hidden = false;
    document.querySelector(".portas").hidden = true;
    $("titulo-categoria").textContent = validas.length === 1 ? CATEGORIAS[validas[0]].titulo : "Caminhos para suas necessidades";
    $("descricao-categoria").textContent = validas.length === 1
      ? CATEGORIAS[validas[0]].descricao
      : "Identificamos mais de uma necessidade. Veja os caminhos abaixo.";
    var html = "";
    var linksExibidos = Object.create(null);
    var servicosExibidos = Object.create(null);
    if (validas.length > 1) {
      html += '<p class="nota-redundancia">Como você indicou mais de uma necessidade, links e serviços comuns aparecem uma única vez para evitar repetição.</p>';
    }
    validas.forEach(function (chave) {
      var c = CATEGORIAS[chave];
      html += '<section class="resultado-necessidade"><h3 class="subtitulo">' + esc(c.titulo) + '</h3><p>' + esc(c.descricao) + '</p>';
      if (chave === "emprego_curso") {
        html += '<article class="cartao"><h4>Checklist para avaliar uma oportunidade</h4><ul><li>O horário e a escala combinam com sua rotina?</li><li>Quanto tempo e dinheiro o deslocamento vai exigir?</li><li>Como ficam os cuidados com crianças ou outros dependentes?</li><li>Salário, contrato, local de trabalho e custos estão claros?</li><li>Desconfie de anúncios que exigem pagamento para participar do processo seletivo.</li></ul><p class="meta">Este checklist ajuda a avaliar a viabilidade; não substitui a conferência da empresa e da vaga.</p></article>';
      }
      c.links.forEach(function (l) {
        var chaveLink = String(l[1] || "").toLowerCase();
        if (linksExibidos[chaveLink]) return;
        linksExibidos[chaveLink] = true;
        html += '<article class="cartao"><h3><a href="' + esc(l[1]) + '" target="_blank" rel="noopener noreferrer">' + esc(l[0]) + '</a></h3><p>' + esc(l[2]) + '</p><p class="meta">Fonte externa oficial; confira os dados e a disponibilidade no site de origem.</p></article>';
      });
      var candidatos = dados.servicos ? dados.servicos.filter(function (s) { return c.tipos.indexOf(s.tipo) !== -1; }) : [];
      var encontrados = [];
      candidatos.forEach(function (s) {
        var chaveServico = String(s.id || [s.nome, s.tipo, s.fonte_url || s.fonte].join("|")).toLowerCase();
        if (servicosExibidos[chaveServico]) return;
        servicosExibidos[chaveServico] = true;
        encontrados.push(s);
      });
      if (encontrados.length) {
        html += '<h4>Serviços cadastrados em Rio Claro</h4>';
        encontrados.forEach(function (s) { html += cartao(s, null); });
      } else if (!candidatos.length) {
        html += '<p class="vazio">Ainda não há serviços dessa categoria carregados no catálogo desta versão. Consulte também as fontes oficiais acima.</p>';
      } else {
        html += '<p class="meta">Os serviços que também atendem a esta necessidade já aparecem acima.</p>';
      }
      if (chave === "violencia") {
        html += '<article class="cartao urgente"><h3>Ajuda imediata</h3><p>Polícia: <a href="tel:190">190</a></p><p>Central de Atendimento à Mulher: <a href="tel:180">180</a></p><p>Atendimento médico de urgência: <a href="tel:192">192</a></p><p class="meta">Protótipo: não escreva detalhes pessoais. O botão “Sair rápido” não apaga o histórico do navegador.</p></article>';
      }
      html += "</section>";
    });
    $("opcoes-categoria").innerHTML = html;
    $("painel-categoria").scrollIntoView({behavior:"smooth", block:"start"});
  }
  $("form-necessidade").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var texto = $("necessidade").value;
    var chaves = MISM3Necessidades.identificarCategorias(texto);
    var aviso = $("mensagem-necessidade");
    if (!texto.trim()) {
      aviso.textContent = "Digite uma necessidade, como emprego, saúde, creche ou violência.";
      aviso.hidden = false;
      return;
    }
    if (!chaves.length) {
      aviso.textContent = "Ainda não reconheci essa necessidade. Tente emprego, saúde, estudo, filhos, separação, violência ou assistência.";
      aviso.hidden = false;
      return;
    }
    aviso.hidden = true;
    abrirCategorias(chaves);
  });

  document.querySelectorAll("[data-categoria]").forEach(function (b) {
    b.addEventListener("click", function () { abrirCategoria(b.getAttribute("data-categoria")); });
  });
  $("voltar-portas").addEventListener("click", function () {
    $("painel-categoria").hidden = true;
    document.querySelector(".portas").hidden = false;
    document.querySelector(".portas").scrollIntoView({behavior:"smooth", block:"start"});
  });

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
