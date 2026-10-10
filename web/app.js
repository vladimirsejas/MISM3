/* Interface do Mapa do Cuidado. O CEP digitado nunca sai do navegador e nunca e gravado. */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var dados = { indice: null, servicos: null, demo: false };
  var mapa = null, camadas = null, tiles = null;
  var ultimo = null, objetivo = null, necessidades = [];  /* so em memoria: nada vai para storage, cookie ou rede */

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function carregar(url) { return Api.json(url); }  /* de onde vem (arquivo local ou API) e decisao de api.js */


  var CATEGORIAS = {
    emprego_curso: {
      titulo: "Emprego, renda e cursos",
      descricao: "Comece pelas oportunidades e confirme prazos, requisitos e inscrições diretamente na fonte.",
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
      tipos: ["creche", "educacao_infantil", "emprego_curso"],
      links: [
        ["Secretaria Municipal da Educação", "https://rioclaro.sp.gov.br/secretaria/secretaria-da-educacao/", "Informações oficiais sobre a rede municipal."],
        ["Fundo Social de Solidariedade", "https://rioclaro.sp.gov.br/secretaria/fundo-social-de-solidariedade/", "Informações sobre cursos e programas."]
      ]
    },
    filhos: {
      titulo: "Filhos: creche, escola e apoio",
      descricao: "Reúna os caminhos para educação infantil e apoio à família. A existência de uma unidade não confirma vaga disponível.",
      tipos: ["creche", "educacao_infantil", "assistencia", "saude"],
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
    mulher_para_mulher: {
      titulo: "De mulher para mulher",
      descricao: "Mulheres que oferecem serviços a outras mulheres. Cada cadastro é verificado pela Secretaria da Mulher, é voluntário e vence se não for renovado. A verificação confere o que está escrito no cartão; não garante o serviço nem a segurança. Combine em local público, avise alguém de confiança e desconfie de pedidos de dinheiro adiantado.",
      tipos: ["mulher_para_mulher"],
      links: []
    },
    transporte: {
      titulo: "Ônibus e transporte",
      descricao: "Ainda não mostramos horários aqui: eles não foram conferidos. Consulte a fonte oficial do transporte coletivo.",
      tipos: [],
      links: [
        ["SOU Transportes — Rio Claro", "https://soutransportes.com.br/rio-claro/", "Linhas e horários publicados pela operadora."]
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

  /* Conteudo de UMA categoria (links oficiais + servicos cadastrados + ajuda imediata). */
  function blocoCategoria(chave) {
    var c = CATEGORIAS[chave];
    var html = "";
    c.links.forEach(function (l) {
      html += '<article class="cartao"><h3><a href="' + esc(l[1]) + '" target="_blank" rel="noopener noreferrer">' + esc(l[0]) + '</a></h3><p>' + esc(l[2]) + '</p><p class="meta">Fonte externa oficial; confira os dados e a disponibilidade no site de origem.</p></article>';
    });
    var encontrados = dados.servicos ? dados.servicos.filter(function (s) { return c.tipos.indexOf(s.tipo) !== -1; }) : [];
    if (encontrados.length) {
      html += '<h3 class="subtitulo">Serviços cadastrados em Rio Claro</h3>';
      var LIMITE = 6;  /* com dados reais uma categoria pode ter dezenas de servicos */
      encontrados.slice(0, LIMITE).forEach(function (s) { html += cartao(s, null); });
      if (encontrados.length > LIMITE) {
        html += '<details class="outros"><summary>Ver mais ' + (encontrados.length - LIMITE) + " serviços cadastrados</summary>" +
          encontrados.slice(LIMITE).map(function (s) { return cartao(s, null); }).join("") + "</details>";
      }
      html += '<p class="meta">Esta lista não está ordenada por distância. Para ver o que fica mais perto de você, use “Quero encontrar serviços perto de mim pelo CEP”.</p>';
    } else {
      html += '<p class="vazio">Ainda não há serviços dessa categoria carregados no catálogo desta versão. Estamos ampliando e validando os registros. Consulte também as fontes oficiais acima.</p>';
    }
    if (chave === "violencia") {
      html += '<article class="cartao urgente"><h3>Ajuda imediata</h3><p>Polícia: <a href="tel:190">190</a></p><p>Central de Atendimento à Mulher: <a href="tel:180">180</a></p><p>Atendimento médico de urgência: <a href="tel:192">192</a></p><p class="meta">Se o aparelho puder estar sendo monitorado, considere usar um dispositivo seguro. O botão “Sair rápido” não apaga o histórico do navegador.</p></article>';
    }
    return html;
  }

  var CHAVE_PARA_ID = { emprego_curso: "emprego" }, ID_PARA_CHAVE = { emprego: "emprego_curso" };
  var idNec = function (chave) { return CHAVE_PARA_ID[chave] || chave; };
  var chaveDe = function (id) { return ID_PARA_CHAVE[id] || id; };
  var veioDoTexto = false;  /* so mostramos "Entendemos que voce procura" quando a pessoa escreveu uma frase */

  function desenharEntendimento() {
    var alvo = $("entendimento");
    if (!veioDoTexto || !necessidades.length) { alvo.innerHTML = ""; return; }
    alvo.innerHTML = "<p>Entendemos que você procura:</p>" + '<div class="chips">' + necessidades.map(function (n) {
      return '<button type="button" data-remover="' + esc(n.id) + '" title="Tirar da busca">' + esc(n.rotulo.split(" / ")[0].split(",")[0]) + " ✕</button>";
    }).join("") + "</div>" + '<p class="meta">Se algo não é o que você procura, toque nele para tirar.</p>';
  }

  /* Abre uma ou VARIAS categorias juntas (a frase pode ter mais de uma necessidade). */
  function abrirCaminho(chaves) {
    var validas = chaves.filter(function (k) { return CATEGORIAS[k]; });
    if (!validas.length) return;
    necessidades = validas.map(function (k) { return Necessidades.porId(idNec(k)); }).filter(Boolean);
    $("painel-categoria").hidden = false;
    document.querySelector(".portas").hidden = true;
    desenharEntendimento();
    if (validas.length === 1) {
      $("titulo-categoria").textContent = CATEGORIAS[validas[0]].titulo;
      $("descricao-categoria").textContent = CATEGORIAS[validas[0]].descricao;
      $("opcoes-categoria").innerHTML = blocoCategoria(validas[0]);
    } else {
      $("titulo-categoria").textContent = "Seu caminho";
      $("descricao-categoria").textContent = "Reunimos o que se relaciona com o que você escreveu, uma parte de cada vez.";
      $("opcoes-categoria").innerHTML = validas.map(function (k) {
        return '<section class="subcaminho"><h3>' + esc(CATEGORIAS[k].titulo) + "</h3><p>" + esc(CATEGORIAS[k].descricao) + "</p>" + blocoCategoria(k) + "</section>";
      }).join("");
    }
    if (ultimo) desenhar(ultimo);  /* ja ha busca por CEP na tela: reorganiza pelos servicos da necessidade */
    $("painel-categoria").scrollIntoView({behavior:"smooth", block:"start"});
  }

  function abrirCategoria(chave) { veioDoTexto = false; abrirCaminho([chave]); }

  $("entendimento").addEventListener("click", function (e) {
    var id = e.target && e.target.getAttribute("data-remover");
    if (!id) return;
    var restantes = necessidades.filter(function (n) { return n.id !== id; }).map(function (n) { return chaveDe(n.id); });
    if (!restantes.length) { $("voltar-portas").click(); return; }
    abrirCaminho(restantes);
  });

  /* ---- pesquisa real (API): so aparece quando o servidor tem um provedor plugado (docs/api_contrato.md) ---- */
  function htmlResultadosReais(r) {
    if (!r || !r.resultados.length) return "";
    return '<section class="subcaminho resultados-reais"><h3>Resultados da pesquisa</h3><p class="meta">Pesquisa feita agora em fontes externas. Confira sempre a informação na fonte antes de ir.</p>' +
      r.resultados.map(function (x) {
        return '<article class="cartao"><h3><a href="' + esc(x.url) + '" target="_blank" rel="noopener noreferrer">' + esc(x.titulo) + "</a></h3>" +
          (x.descricao ? "<p>" + esc(x.descricao) + "</p>" : "") +
          '<p class="meta">Fonte: ' + esc(x.fonte || x.url) + (x.consultado_em ? " · consultado em " + esc(x.consultado_em) : "") + "</p></article>";
      }).join("") + "</section>";
  }
  function mostrarResultadosReais(r, semCaminho) {
    var alvo = $("resultados-reais");
    alvo.innerHTML = htmlResultadosReais(r);
    if (semCaminho && alvo.innerHTML) {  /* a pesquisa achou algo que a busca local nao reconheceu */
      $("painel-categoria").hidden = false; document.querySelector(".portas").hidden = true;
      $("titulo-categoria").textContent = "Resultados da pesquisa"; $("descricao-categoria").textContent = "";
      $("opcoes-categoria").innerHTML = ""; $("entendimento").innerHTML = "";
    }
  }

  $("form-necessidade").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var texto = $("necessidade").value;
    var aviso = $("mensagem-necessidade");
    if (!texto.trim()) {
      aviso.textContent = "Escreva o que você precisa, com suas palavras. Ex.: “preciso de emprego, mas tenho um filho pequeno”.";
      aviso.hidden = false;
      return;
    }
    var achadas = Necessidades.identificar(texto);  /* violencia sempre primeiro; ate 3 necessidades */
    /* Frase com sinal de violencia NUNCA vai para a API: a protecao local aparece na hora e nada sai do aparelho. */
    var pesquisa = achadas.some(function (n) { return n.urgente; }) ? Promise.resolve(null) : Api.pesquisar(texto);
    if (achadas.length) {
      aviso.hidden = true; veioDoTexto = true;
      abrirCaminho(achadas.map(function (n) { return chaveDe(n.id); }));  /* aparece ja; nao espera a rede */
    } else {
      aviso.textContent = Api.cfg().pesquisaRemota ? "Pesquisando…" : "Ainda não reconheci o que você escreveu. Tente com outras palavras, como emprego, saúde, estudo, filhos, família, casamento, violência ou ônibus.";
      aviso.hidden = false;
    }
    pesquisa.then(function (r) {
      if (!r) { if (!achadas.length && Api.cfg().pesquisaRemota) aviso.textContent = "Não encontrei nada com essas palavras. Tente de outro jeito."; return; }
      var ids = achadas.map(function (n) { return n.id; });
      r.necessidades.forEach(function (id) { if (ids.indexOf(id) < 0 && Necessidades.porId(id) && ids.length < 3) ids.push(id); });
      if (ids.length > achadas.length) { aviso.hidden = true; veioDoTexto = true; abrirCaminho(ids.map(chaveDe)); }
      if (r.resultados.length) aviso.hidden = true;
      mostrarResultadosReais(r, !ids.length);
      if (!ids.length && !r.resultados.length) aviso.textContent = "Não encontrei nada com essas palavras. Tente de outro jeito.";
    });
  });

  document.querySelectorAll("[data-categoria]").forEach(function (b) {
    b.addEventListener("click", function () { abrirCategoria(b.getAttribute("data-categoria")); });
  });
  $("voltar-portas").addEventListener("click", function () {
    $("resultados-reais").innerHTML = "";
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
      dados.indice = r[0].ceps;
      /* cadastro "de mulher para mulher" vence: depois de renovar_ate nao aparece, mesmo que o arquivo seja antigo */
      dados.servicos = r[1].servicos.filter(function (x) { return x.tipo !== "mulher_para_mulher" || (x.renovar_ate && x.renovar_ate >= hojeISO()); });
      $("porta-m2m").hidden = !dados.servicos.some(function (x) { return x.tipo === "mulher_para_mulher"; });
      dados.demo = !!(r[0].meta && r[0].meta.demo) || !!(r[1].meta && r[1].meta.demo);
      $("faixa-demo").hidden = !dados.demo;
      $("fontes").textContent = "Índice de CEPs: " + (r[0].meta.fonte || "") + " · Serviços gerados em " + (r[1].meta.gerado_em || "?") + ".";
      if (dados.demo) mostrarMensagem("Modo demonstração: use os CEPs fictícios 00000-001, 00000-002 ou 00000-003.");
    }).catch(function () {
      mostrarMensagem("Não foi possível carregar os dados. Abra o site por um servidor local (veja o README).");
    });
  }

  function hojeISO() {  /* data local do aparelho; so serve para decidir aberto/encerrado e nunca e enviada */
    var d = new Date(), z = function (n) { return (n < 10 ? "0" : "") + n; };
    return d.getFullYear() + "-" + z(d.getMonth() + 1) + "-" + z(d.getDate());
  }

  function carregarVagas() {
    carregar("dados/vagas.json").then(function (j) {
      var lista = Vagas.organizar(j.vagas || [], hojeISO());
      if (!lista.length) return;
      $("lista-vagas").innerHTML = lista.map(function (v) {
        var p = ['<p class="meta">' + esc(Vagas.ROTULO[v.situacao]) + " · prazo final " + esc(Vagas.dataBR(v.inscricoes_ate)) + "</p>"];
        if (v.inscricoes_de) p.push("<p>Inscrições a partir de " + esc(Vagas.dataBR(v.inscricoes_de)) + "</p>");
        if (v.banca) p.push("<p>Banca organizadora: " + esc(v.banca) + "</p>");
        if (v.cargos_resumo) p.push("<p>Cargos: " + esc(v.cargos_resumo) + "</p>");
        if (v.escolaridade) p.push("<p>Escolaridade: " + esc(v.escolaridade) + "</p>");
        if (v.observacao) p.push("<p>" + esc(v.observacao) + "</p>");
        p.push('<p class="meta"><a href="' + esc(v.edital_url) + '" target="_blank" rel="noopener noreferrer">Edital oficial</a> · verificado em ' + esc(Vagas.dataBR(v.verificado_em)) + "</p>");
        return '<article class="cartao"><h3>' + esc(v.titulo) + '</h3><p class="meta">' + esc(v.orgao) + "</p>" + p.join("") + "</article>";
      }).join("");
      $("vagas").hidden = false;
    }).catch(function () { /* sem vagas cadastradas: a secao continua escondida */ });
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

  function desenharObjetivos() {
    $("objetivos").innerHTML = Object.keys(Recomendar.OBJETIVOS).map(function (k) {
      return '<button type="button" data-obj="' + k + '" aria-pressed="' + (objetivo === k) + '">' + esc(Recomendar.OBJETIVOS[k]) + "</button>";
    }).join("");
  }

  function desenharSugestoes() {
    var alvo = $("sugestoes");
    if (!objetivo || !ultimo) { alvo.innerHTML = ""; return; }
    var todos = ultimo.grupos.reduce(function (a, g) { return a.concat(g.municipais, g.proximos, g.sem_localizacao); }, []);
    var lista = Recomendar.recomendar(todos, objetivo);
    if (!lista.length) {
      alvo.innerHTML = '<p class="vazio">Ainda não temos serviço cadastrado para este objetivo com essa informação confirmada. Isso não significa que não exista.</p>';
      return;
    }
    alvo.innerHTML = lista.map(function (s, i) {
      return '<article class="cartao"><p class="meta">Sugestão ' + (i + 1) + "</p>" + cartao(s, ultimo.area).replace(/^<article class="cartao">|<\/article>$/g, "") +
        '<ul class="porque">' + s.porque.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul></article>";
    }).join("") + '<p class="meta">A ordem usa só o que o cadastro oficial confirma (objetivo, gratuidade, distância em linha reta). Não avalia você e não garante vaga.</p>';
  }

  $("objetivos").addEventListener("click", function (e) {
    var k = e.target && e.target.getAttribute("data-obj");
    if (!k) return;
    objetivo = objetivo === k ? null : k;
    desenharObjetivos(); desenharSugestoes();
  });

  function htmlGrupo(g, r) {
    var itens = g.municipais.concat(g.proximos), html = "";
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
    return html + "</section>";
  }

  function desenhar(r) {
    ultimo = r;
    var obj = necessidades.map(function (n) { return n.objetivo; }).filter(Boolean)[0];
    if (obj) objetivo = obj;
    desenharObjetivos(); desenharSugestoes();
    var html = "";
    var sep = Necessidades.separar(r.grupos, necessidades);
    if (sep.destaque.length) {
      sep.destaque.forEach(function (g) { html += htmlGrupo(g, r); });
      html += '<details class="outros"><summary>Ver outros serviços perto de você</summary>' + sep.outros.map(function (g) { return htmlGrupo(g, r); }).join("") + "</details>";
    } else {
      r.grupos.forEach(function (g) { html += htmlGrupo(g, r); });
    }
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
    $("cep").value = ""; $("necessidade").value = ""; $("grupos").innerHTML = ""; $("sugestoes").innerHTML = "";
    $("painel-categoria").hidden = true; $("opcoes-categoria").innerHTML = ""; $("entendimento").innerHTML = ""; $("resultados-reais").innerHTML = ""; veioDoTexto = false; ultimo = null; objetivo = null; necessidades = [];
    window.location.replace("https://www.google.com.br/");
  });

  if (Api.cfg().modo === "api" && Api.cfg().pesquisaRemota) {
    $("ajuda-necessidade").textContent = "Não escreva nomes, documentos ou detalhes pessoais. Para pesquisar, sua frase é enviada ao servidor do projeto (frases sobre violência nunca são enviadas).";
  }
  iniciar();
  carregarVagas();
})();
