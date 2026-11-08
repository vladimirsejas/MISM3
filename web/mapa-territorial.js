/* Mapa territorial v1 do MISM3: setores censitários coloridos por indicador, com os equipamentos públicos cadastrados.
   Lê só arquivos locais (dados/indicadores_territoriais.json e dados/setores.geojson), desenha em SVG (sem mapa de fundo, sem tiles) e não faz
   nenhuma requisição a outro endereço. Todo texto vindo dos dados entra na página por textContent; nunca por innerHTML.
   Especificação: docs/territorial/METODOLOGIA_INDICADORES_TERRITORIAIS.md. JavaScript compatível com ES5, como o resto do site. */
(function (raiz, fabrica) {
  if (typeof module === "object" && module.exports) module.exports = fabrica();
  else raiz.MapaTerritorial = fabrica();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var NS_SVG = "http://www.w3.org/2000/svg"; /* identificador de namespace do SVG, não é um endereço acessado */
  var CORES = { 4: ["#fbe9e6", "#e8a8a2", "#b9556a", "#7a2b37"], 5: ["#fbe9e6", "#f2c4bd", "#e08e8e", "#b9556a", "#7a2b37"] };
  var COR_SEM_VALOR = "#d9d9d9";
  /* Decisão D4: nenhum setor é suprimido nem agregado; setores com menos de 5 pessoas ou menos de 3 domicílios (faixa conservadora da proposta de supressão e agregação) levam aviso. */
  var LIMITE_PEQUENO = { pessoas: 5, domicilios: 3 };
  var AVISO_PEQUENO = "população muito pequena, interprete com cautela";
  var COR_PONTO = "#12343b";
  var CATEGORIAS = ["cras", "ubs", "escola"];
  var CENARIOS = ["coordenadas_do_catalogo", "com_centro_do_cep"];
  var INDICADORES = [
    ["pessoas", "População agregada (pessoas por setor)"],
    ["densidade", "Densidade populacional (pessoas por km²)"],
    ["domicilios", "Domicílios agregados (por setor)"],
    ["equipamentos", "Serviços localizados no setor (por categoria)"],
    ["distancia", "Distância em linha reta até o equipamento mais próximo"]
  ];

  /* ------------------------------------------------------------------ funções puras (testáveis em Node) */
  function setorPequeno(s) { return s.pessoas < LIMITE_PEQUENO.pessoas || s.domicilios < LIMITE_PEQUENO.domicilios; }
  function milhar(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, "."); }
  /* O pequeno acréscimo evita que 2,175 apareça como 2,17 por causa da representação em ponto flutuante. */
  function decimal(n, casas) { return (Number(n) + (n >= 0 ? 1e-9 : -1e-9)).toFixed(casas).replace(".", ","); }
  function limpo(n) { return String(n).replace(".", ","); }

  /* Classe (0 a limites.length) de um valor: número de pontos de corte que o valor alcança. Valor ausente: -1. */
  function classeDe(valor, limites) {
    if (valor === null || valor === undefined) return -1;
    var i = 0;
    while (i < limites.length && valor >= limites[i]) i++;
    return i;
  }

  function rotulosClasses(indicador, limites) {
    if (indicador === "equipamentos") return ["nenhum", "1", "2", "3 ou mais"];
    var f = indicador === "distancia" ? limpo : milhar, r = [], i;
    for (i = 0; i <= limites.length; i++) {
      if (i === 0) r.push("menos de " + f(limites[0]));
      else if (i === limites.length) r.push(f(limites[i - 1]) + " ou mais");
      else r.push(f(limites[i - 1]) + " a menos de " + f(limites[i]));
    }
    return r;
  }

  function coresDe(n) { return CORES[n] || CORES[5]; }

  function valorDoSetor(s, indicador, categoria, cenario) {
    if (indicador === "pessoas") return s.pessoas;
    if (indicador === "densidade") return s.densidade;
    if (indicador === "domicilios") return s.domicilios;
    if (indicador === "equipamentos") {
      if (categoria === "todas") return s.equipamentos.cras + s.equipamentos.ubs + s.equipamentos.escola;
      return s.equipamentos[categoria];
    }
    if (indicador === "distancia") return s.distancia_km[cenario][categoria];
    return null;
  }

  function descreverValor(indicador, v) {
    if (v === null || v === undefined) return "localização pendente";
    if (indicador === "pessoas") return milhar(v) + " pessoas";
    if (indicador === "densidade") return milhar(v) + " pessoas por km²";
    if (indicador === "domicilios") return milhar(v) + " domicílios";
    if (indicador === "equipamentos") return v + (v === 1 ? " serviço localizado no setor" : " serviços localizados no setor");
    return decimal(v, 2) + " km em linha reta";
  }

  function faixaDistancia(s, cenario, categoria) {
    var minimo = s.distancia_min_km && s.distancia_min_km[cenario] ? s.distancia_min_km[cenario][categoria] : null;
    var maximo = s.distancia_max_km && s.distancia_max_km[cenario] ? s.distancia_max_km[cenario][categoria] : null;
    if (minimo === null || minimo === undefined || maximo === null || maximo === undefined) return null;
    return { minimo: minimo, maximo: maximo };
  }

  function textoFaixaDistancia(s, cenario, categoria) {
    var faixa = faixaDistancia(s, cenario, categoria);
    var central = s.distancia_km && s.distancia_km[cenario] ? s.distancia_km[cenario][categoria] : null;
    if (central === null || central === undefined) return "";
    if (!faixa) return " (faixa indisponível: raio não documentado)";
    if (faixa.minimo === faixa.maximo) return "";
    return " (envelope geométrico: " + decimal(faixa.minimo, 2) + "–" + decimal(faixa.maximo, 2) + " km)";
  }

  /* Projeção equirretangular local (sem biblioteca): x cresce para leste, y para o sul. */
  function criarProjecao(geo, largura) {
    var minLon = 1e9, maxLon = -1e9, minLat = 1e9, maxLat = -1e9;
    percorrerAneis(geo, function (anel) {
      var i, p;
      for (i = 0; i < anel.length; i++) {
        p = anel[i];
        if (p[0] < minLon) minLon = p[0];
        if (p[0] > maxLon) maxLon = p[0];
        if (p[1] < minLat) minLat = p[1];
        if (p[1] > maxLat) maxLat = p[1];
      }
    });
    var k = Math.cos(((minLat + maxLat) / 2) * Math.PI / 180);
    var escala = largura / ((maxLon - minLon) * k);
    return {
      largura: largura, altura: Math.round((maxLat - minLat) * escala),
      xy: function (lon, lat) { return [(lon - minLon) * k * escala, (maxLat - lat) * escala]; }
    };
  }

  function percorrerAneis(geo, fn) {
    var i, g, polys, j, k;
    for (i = 0; i < geo.features.length; i++) {
      g = geo.features[i].geometry;
      polys = g.type === "Polygon" ? [g.coordinates] : g.coordinates;
      for (j = 0; j < polys.length; j++) for (k = 0; k < polys[j].length; k++) fn(polys[j][k]);
    }
  }

  function caminhoDe(geom, proj) {
    var polys = geom.type === "Polygon" ? [geom.coordinates] : geom.coordinates, partes = [], j, k, i, p, pts;
    for (j = 0; j < polys.length; j++) {
      for (k = 0; k < polys[j].length; k++) {
        pts = [];
        for (i = 0; i < polys[j][k].length; i++) {
          p = proj.xy(polys[j][k][i][0], polys[j][k][i][1]);
          pts.push(p[0].toFixed(1) + "," + p[1].toFixed(1));
        }
        partes.push("M" + pts.join("L") + "Z");
      }
    }
    return partes.join("");
  }

  /* ------------------------------------------------------------------ tela */
  var estado = { dados: null, geo: null, proj: null, setores: {}, caminhos: {}, escolhido: null };

  function $(id) { return document.getElementById(id); }
  function limpar(no) { while (no.firstChild) no.removeChild(no.firstChild); }
  function el(tag, classe, texto) {
    var e = document.createElement(tag);
    if (classe) e.className = classe;
    if (texto !== undefined && texto !== null) e.textContent = texto;
    return e;
  }
  function cel(tag, classe, texto, rotulo) { var e = el(tag, classe, texto); if (rotulo) e.setAttribute("data-label", rotulo); return e; }
  function svg(tag, atributos) {
    var e = document.createElementNS(NS_SVG, tag), k;
    for (k in atributos) if (Object.prototype.hasOwnProperty.call(atributos, k)) e.setAttribute(k, atributos[k]);
    return e;
  }
  function carregar(url, ok, erro) {
    var x = new XMLHttpRequest();
    x.open("GET", url);
    x.onreadystatechange = function () {
      if (x.readyState !== 4) return;
      if (x.status >= 200 && x.status < 300) { try { ok(JSON.parse(x.responseText)); } catch (e) { erro(url); } } else erro(url);
    };
    x.send();
  }
  function mensagem(texto) { var m = $("mt-mensagem"); m.textContent = texto || ""; m.hidden = !texto; }

  function selecao() {
    return { indicador: $("mt-indicador").value, categoria: $("mt-categoria").value, cenario: $("mt-cenario").value };
  }

  function rotuloCategoria(c) { return c === "todas" ? "Todas as categorias" : estado.dados.meta.rotulos_categoria[c]; }

  function montarSelects() {
    var d = estado.dados, ind = $("mt-indicador"), cen = $("mt-cenario"), i, o;
    for (i = 0; i < INDICADORES.length; i++) { o = el("option", "", INDICADORES[i][1]); o.value = INDICADORES[i][0]; ind.appendChild(o); }
    for (i = 0; i < CENARIOS.length; i++) { o = el("option", "", d.meta.rotulos_cenario[CENARIOS[i]]); o.value = CENARIOS[i]; cen.appendChild(o); }
    atualizarCategorias();
    var lista = d.setores.slice().sort(function (a, b) {
      var ba = a.bairro || "~", bb = b.bairro || "~";
      return ba < bb ? -1 : ba > bb ? 1 : a.id < b.id ? -1 : 1;
    });
    var sel = $("mt-setor");
    o = el("option", "", "Escolha um setor…"); o.value = ""; sel.appendChild(o);
    for (i = 0; i < lista.length; i++) {
      o = el("option", "", (lista[i].bairro || "Sem bairro definido pelo IBGE") + " – setor " + lista[i].id);
      o.value = lista[i].id;
      sel.appendChild(o);
    }
  }

  function atualizarCategorias() {
    var s = selecao(), sel = $("mt-categoria"), atual = sel.value, lista = CATEGORIAS.slice(), i, o;
    if (s.indicador === "equipamentos") lista.push("todas");
    limpar(sel);
    for (i = 0; i < lista.length; i++) { o = el("option", "", rotuloCategoria(lista[i])); o.value = lista[i]; sel.appendChild(o); }
    sel.value = lista.indexOf(atual) !== -1 ? atual : lista[0];
    $("mt-grupo-categoria").hidden = !(s.indicador === "equipamentos" || s.indicador === "distancia");
    $("mt-grupo-cenario").hidden = s.indicador !== "distancia";
  }

  function desenharSetores() {
    var camada = $("mt-camada-setores"), i, f, p, t;
    estado.proj = criarProjecao(estado.geo, 1000);
    $("mt-svg").setAttribute("viewBox", "0 0 " + estado.proj.largura + " " + estado.proj.altura);
    limpar(camada);
    for (i = 0; i < estado.geo.features.length; i++) {
      f = estado.geo.features[i];
      p = svg("path", { d: caminhoDe(f.geometry, estado.proj), "class": "mt-setor", "fill-rule": "evenodd", fill: COR_SEM_VALOR });
      p.setAttribute("data-setor", f.properties.setor);
      p.setAttribute("tabindex", "-1");
      p.setAttribute("role", "button");
      p.setAttribute("aria-label", "Selecionar setor censitário " + f.properties.setor + ". Use Enter ou Espaço para abrir o detalhe.");
      p.setAttribute("aria-pressed", "false");
      t = svg("title", {});
      p.appendChild(t);
      camada.appendChild(p);
      estado.caminhos[f.properties.setor] = p;
      (function (id) {
        p.addEventListener("click", function () { escolherSetor(id); });
        p.addEventListener("focus", function () { definirFoco(id, false); });
        p.addEventListener("blur", function () { estado.focado = null; atualizarAnel(); });
      })(f.properties.setor);
    }
    camada.addEventListener("keydown", teclado);
    criarAnel();
    definirFoco(estado.dados.setores[0].id, false);
    estado.focado = null;
    atualizarAnel();
  }

  /* Foco do teclado em "roving tabindex": só o setor atual tem tabindex 0, então o mapa é um único ponto de Tab. */
  function definirFoco(id, mover) {
    var k;
    if (estado.atual !== undefined && estado.atual !== null && estado.caminhos[estado.atual]) estado.caminhos[estado.atual].setAttribute("tabindex", "-1");
    estado.atual = id;
    estado.caminhos[id].setAttribute("tabindex", "0");
    estado.focado = id;
    if (mover) estado.caminhos[id].focus();
    atualizarAnel();
  }

  /* Anel duplo (branco por fora, escuro por dentro) sobre o setor em foco ou escolhido: visível em qualquer cor de preenchimento. */
  function criarAnel() {
    var camada = $("mt-camada-foco");
    limpar(camada);
    estado.anel = [svg("path", { "class": "mt-anel-halo", visibility: "hidden" }), svg("path", { "class": "mt-anel-nucleo", visibility: "hidden" })];
    camada.appendChild(estado.anel[0]);
    camada.appendChild(estado.anel[1]);
  }

  function atualizarAnel() {
    var id = estado.focado || estado.escolhido, i;
    if (!estado.anel) return;
    for (i = 0; i < 2; i++) {
      if (id) estado.anel[i].setAttribute("d", estado.caminhos[id].getAttribute("d"));
      estado.anel[i].setAttribute("visibility", id ? "visible" : "hidden");
    }
  }

  /* Centroide geométrico (ponderado pela área) dos anéis projetados do polígono.
     O anel externo soma área; anéis internos (buracos) subtraem área. */
  function centroideAnel(anel, proj) {
    var area2 = 0, somaX = 0, somaY = 0, i, a, b, cruz;
    for (i = 0; i < anel.length - 1; i++) {
      a = proj.xy(anel[i][0], anel[i][1]);
      b = proj.xy(anel[i + 1][0], anel[i + 1][1]);
      cruz = a[0] * b[1] - b[0] * a[1];
      area2 += cruz;
      somaX += (a[0] + b[0]) * cruz;
      somaY += (a[1] + b[1]) * cruz;
    }
    if (Math.abs(area2) < 1e-9) return null;
    return { area: Math.abs(area2) / 2, x: somaX / (3 * area2), y: somaY / (3 * area2) };
  }

  function centroideGeometria(geom, proj) {
    var polys = geom.type === "Polygon" ? [geom.coordinates] : geom.coordinates;
    var areaTotal = 0, somaX = 0, somaY = 0, j, k, r, peso;
    for (j = 0; j < polys.length; j++) {
      for (k = 0; k < polys[j].length; k++) {
        r = centroideAnel(polys[j][k], proj);
        if (!r) continue;
        peso = k === 0 ? r.area : -r.area;
        areaTotal += peso;
        somaX += r.x * peso;
        somaY += r.y * peso;
      }
    }
    if (Math.abs(areaTotal) < 1e-9) return null;
    return [somaX / areaTotal, somaY / areaTotal];
  }

  function centroides() {
    var c = {}, i, f, id;
    for (i = 0; i < estado.geo.features.length; i++) {
      f = estado.geo.features[i];
      id = f.properties.setor;
      c[id] = centroideGeometria(f.geometry, estado.proj);
    }
    return c;
  }

  /* Escolhe o setor no semiplano da seta pela nota projeção + 2 × desvio lateral.
     A medição Chromium/Node do critério anterior (408 setores, 1.632 movimentos) encontrou
     548 desvios acima de 60°, 18 saltos acima de 3× o vizinho mais próximo, 4 movimentos
     sem destino e 4 setores inalcançáveis só pelas setas: 354390705000163, 354390705000409,
     354390705000501 e 354390710000012. Com a penalidade lateral, a medição Node encontrou
     336 desvios acima de 60° e alcançabilidade dos 408 setores. Permanecem 546 casos em que
     a seta de volta não retorna à origem; esta regra não resolve essa limitação.
     Os pontos continuam sendo centroides geométricos dos polígonos. */
  function vizinho(origem, dx, dy, cent) {
    var o = cent[origem], k, melhor = null, projecao, desvioLateral, nota, v;
    for (k in cent) if (Object.prototype.hasOwnProperty.call(cent, k) && k !== origem && cent[k]) {
      v = [cent[k][0] - o[0], cent[k][1] - o[1]];
      projecao = v[0] * dx + v[1] * dy;
      if (projecao <= 0) continue;
      desvioLateral = Math.abs(v[0] * dy - v[1] * dx);
      nota = projecao + 2 * desvioLateral;
      if (melhor === null || nota < melhor.nota ||
          (nota === melhor.nota && k < melhor.id)) {
        melhor = { id: k, nota: nota };
      }
    }
    return melhor ? melhor.id : null;
  }

  function teclado(e) {
    var tecla = e.key, id = e.target && e.target.getAttribute ? e.target.getAttribute("data-setor") : null, dir = null, alvo, ids = estado.dados.setores;
    if (!id) return;
    if (tecla === "ArrowLeft") dir = [-1, 0]; else if (tecla === "ArrowRight") dir = [1, 0];
    else if (tecla === "ArrowUp") dir = [0, -1]; else if (tecla === "ArrowDown") dir = [0, 1];
    if (dir) {
      e.preventDefault();
      if (!estado.centroides) estado.centroides = centroides();
      alvo = vizinho(id, dir[0], dir[1], estado.centroides);
      if (alvo) definirFoco(alvo, true);
    } else if (tecla === "Home") { e.preventDefault(); definirFoco(ids[0].id, true); }
    else if (tecla === "End") { e.preventDefault(); definirFoco(ids[ids.length - 1].id, true); }
    else if (tecla === "Enter" || tecla === " " || tecla === "Spacebar") { e.preventDefault(); escolherSetor(id); }
  }

  function marcarPequenos() {
    var d = estado.dados, i, n = 0;
    for (i = 0; i < d.setores.length; i++) {
      if (setorPequeno(d.setores[i])) { estado.caminhos[d.setores[i].id].setAttribute("data-pequeno", "1"); n++; }
    }
    estado.qtdPequenos = n;
  }

  function pintar() {
    var s = selecao(), d = estado.dados, cl = d.classes[s.indicador], cores = coresDe(cl.limites.length + 1), i, st, v, c, p;
    for (i = 0; i < d.setores.length; i++) {
      st = d.setores[i];
      v = valorDoSetor(st, s.indicador, s.categoria, s.cenario);
      c = classeDe(v, cl.limites);
      p = estado.caminhos[st.id];
      p.setAttribute("fill", c < 0 ? COR_SEM_VALOR : cores[Math.min(c, cores.length - 1)]);
      p.firstChild.textContent = "Setor " + st.id + (st.bairro ? " (" + st.bairro + ")" : "") + ": " + descreverValor(s.indicador, v) + (s.indicador === "distancia" ? textoFaixaDistancia(st, s.cenario, s.categoria) : "");
    }
    legenda(s, cl, cores);
    resumo(s);
  }

  function legenda(s, cl, cores) {
    var box = $("mt-legenda"), rot = rotulosClasses(s.indicador, cl.limites), ul = el("ul"), i, li, am, titulo;
    limpar(box);
    titulo = cl.rotulo + (s.indicador === "equipamentos" || s.indicador === "distancia" ? " – " + rotuloCategoria(s.categoria) : "");
    if (s.indicador === "distancia") titulo += " (" + estado.dados.meta.rotulos_cenario[s.cenario] + ")";
    box.appendChild(el("h3", "", titulo + ". Unidade: " + cl.unidade + "."));
    for (i = 0; i < rot.length; i++) {
      li = el("li");
      am = el("span", "mt-amostra");
      am.style.backgroundColor = cores[Math.min(i, cores.length - 1)];
      li.appendChild(am);
      li.appendChild(el("span", "", rot[i]));
      ul.appendChild(li);
    }
    li = el("li");
    am = el("span", "mt-amostra");
    am.style.backgroundColor = COR_SEM_VALOR;
    li.appendChild(am);
    li.appendChild(el("span", "", s.indicador === "distancia" ? "localização pendente (sem coordenada na categoria)" : "sem valor"));
    ul.appendChild(li);
    li = el("li");
    am = el("span", "mt-amostra mt-amostra-pequeno");
    li.appendChild(am);
    li.appendChild(el("span", "", "contorno tracejado: setor com " + AVISO_PEQUENO + " (" + estado.qtdPequenos + " setores)"));
    ul.appendChild(li);
    box.appendChild(ul);
    var pts = el("ul");
    [["▲", "CRAS"], ["■", "UBS e USF"], ["●", "Escola municipal"]].forEach(function (x) {
      var l = el("li"); l.appendChild(el("span", "mt-forma", x[0])); l.appendChild(el("span", "", x[1] + ": ponto cheio = coordenada individual registrada no catálogo; o título do ponto informa método e confiança quando documentados. Ponto vazado = posição aproximada pelo centro do CEP cadastral do equipamento")); pts.appendChild(l);
    });
    box.appendChild(pts);
  }

  function desenharPontos() {
    var camada = $("mt-camada-pontos"), d = estado.dados, mostrarCat = $("mt-ponto-catalogo").checked, mostrarCep = $("mt-ponto-cep").checked, i, e, xy, no, r = 7, t, rot;
    limpar(camada);
    for (i = 0; i < d.equipamentos.length; i++) {
      e = d.equipamentos[i];
      if (e.precisao === "pendente" || e.lat === null) continue;
      if (e.precisao === "catalogo" && !mostrarCat) continue;
      if (e.precisao === "centro_do_cep" && !mostrarCep) continue;
      xy = estado.proj.xy(e.lon, e.lat);
      var estilo = e.precisao === "catalogo"
        ? { fill: COR_PONTO, stroke: "#ffffff", "stroke-width": "1.5" }
        : { fill: "#ffffff", "fill-opacity": "0.55", stroke: COR_PONTO, "stroke-width": "2", "stroke-dasharray": "3 2" };
      if (e.categoria === "escola") no = svg("circle", { cx: xy[0].toFixed(1), cy: xy[1].toFixed(1), r: r });
      else if (e.categoria === "ubs") no = svg("rect", { x: (xy[0] - r).toFixed(1), y: (xy[1] - r).toFixed(1), width: r * 2, height: r * 2 });
      else no = svg("polygon", { points: [xy[0].toFixed(1) + "," + (xy[1] - r - 1).toFixed(1), (xy[0] - r - 1).toFixed(1) + "," + (xy[1] + r).toFixed(1), (xy[0] + r + 1).toFixed(1) + "," + (xy[1] + r).toFixed(1)].join(" ") });
      Object.keys(estilo).forEach(function (k) { no.setAttribute(k, estilo[k]); });
      rot = e.precisao === "catalogo" ? "coordenada individual registrada no catálogo" : "posição aproximada pelo centro do CEP cadastral do equipamento";
      t = svg("title", {});
      var detalhes = [];
      if (e.metodo_localizacao) detalhes.push("método: " + e.metodo_localizacao);
      if (e.confianca_localizacao) detalhes.push("confiança registrada: " + e.confianca_localizacao);
      if (e.raio_incerteza_m > 0) detalhes.push("raio operacional: " + decimal(e.raio_incerteza_m / 1000, 2) + " km");
      if (e.data_aplicacao_localizacao) detalhes.push("registro: " + e.data_aplicacao_localizacao);
      if (e.fonte_localizacao) detalhes.push("fonte: " + e.fonte_localizacao);
      t.textContent = e.nome + " (" + rotuloCategoria(e.categoria) + "): " + rot + (detalhes.length ? ". " + detalhes.join("; ") : "");
      no.appendChild(t);
      camada.appendChild(no);
    }
  }

  function escolherSetor(id) {
    var d = estado.dados, st = null, i, k;
    for (i = 0; i < d.setores.length; i++) if (d.setores[i].id === id) { st = d.setores[i]; break; }
    for (k in estado.caminhos) if (Object.prototype.hasOwnProperty.call(estado.caminhos, k)) {
      estado.caminhos[k].setAttribute("class", "mt-setor");
      estado.caminhos[k].setAttribute("aria-pressed", "false");
    }
    estado.escolhido = st ? st.id : null;
    atualizarAnel();
    $("mt-setor").value = st ? st.id : "";
    var corpo = $("mt-detalhe-corpo");
    limpar(corpo);
    $("mt-detalhe-vazio").hidden = !!st;
    if (!st) return;
    estado.caminhos[st.id].setAttribute("class", "mt-setor mt-escolhido");
    estado.caminhos[st.id].setAttribute("aria-pressed", "true");
    var dl = el("dl"), linhas = [
      ["Setor censitário", st.id], ["Bairro", st.bairro || "Sem bairro definido pelo IBGE"], ["Pessoas", milhar(st.pessoas)],
      ["Domicílios", milhar(st.domicilios)], ["Área", decimal(st.area_km2, 3) + " km²"], ["Densidade", milhar(st.densidade) + " pessoas por km²"]
    ];
    linhas.forEach(function (l) { dl.appendChild(el("dt", "", l[0])); dl.appendChild(el("dd", "", l[1])); });
    corpo.appendChild(dl);
    if (setorPequeno(st)) corpo.appendChild(el("p", "mt-cautela", "Aviso: " + AVISO_PEQUENO + "."));
    var tab = el("table", "mt-tabela"), cab = el("tr"), r;
    cab.appendChild(el("th", "", "Categoria"));
    cab.appendChild(el("th", "mt-num", "Serviços localizados no setor"));
    CENARIOS.forEach(function (c) { cab.appendChild(el("th", "mt-num", "Distância central (km) e envelope geométrico: " + d.meta.rotulos_cenario[c])); });
    tab.appendChild(cab);
    CATEGORIAS.forEach(function (c) {
      r = el("tr");
      r.appendChild(cel("td", "", rotuloCategoria(c), "Categoria"));
      r.appendChild(cel("td", "mt-num", String(st.equipamentos[c]), "Serviços localizados no setor"));
      CENARIOS.forEach(function (cen) {
        var v = st.distancia_km[cen][c], faixa = faixaDistancia(st, cen, c);
        var texto = v === null ? "localização pendente" : decimal(v, 2) + (faixa ? (faixa.minimo !== faixa.maximo ? " (" + decimal(faixa.minimo, 2) + "–" + decimal(faixa.maximo, 2) + ")" : "") : " (faixa indisponível: raio não documentado)");
        r.appendChild(cel("td", "mt-num", texto, "Distância central e envelope geométrico em km: " + d.meta.rotulos_cenario[cen]));
      });
      tab.appendChild(r);
    });
    corpo.appendChild(tab);
    corpo.appendChild(el("p", "", "A estimativa central mede a distância em linha reta do centroide atual do setor ao equipamento mais próximo. Quando a localização tem raio operacional, a faixa entre mínimo e máximo é um envelope geométrico, não um intervalo de confiança. Serviço localizado no setor indica onde o equipamento está, não quem ele atende."));
  }

  function resumo(s) {
    var box = $("mt-resumo-corpo"), d = estado.dados;
    limpar(box);
    if (s.indicador !== "distancia") {
      box.appendChild(el("p", "", "Escolha o indicador “Distância em linha reta até o equipamento mais próximo” para ver o resumo por categoria e por cenário."));
      return;
    }
    var r = d.resumo_distancias[s.cenario][s.categoria], cob = d.cobertura[s.cenario][s.categoria];
    box.appendChild(el("p", "", rotuloCategoria(s.categoria) + ", " + d.meta.rotulos_cenario[s.cenario] + ". Cobertura das coordenadas: " + cob.com_coordenada + " de " + cob.cadastrados + " equipamentos cadastrados."));
    if (!cob.completo) box.appendChild(el("p", "", "Há localização pendente: a distância pode estar superestimada nesta categoria."));
    if (!r) { box.appendChild(el("p", "", "Nenhum equipamento desta categoria tem coordenada neste cenário.")); return; }
    var t = r.populacao_toda, a1 = t.acima_de["1 km"], a2 = t.acima_de["2 km"], ul = el("ul");
    [["Mediana", decimal(t.mediana_km, 2) + " km"], ["Percentil 90", decimal(t.p90_km, 2) + " km"],
     ["Pessoas a mais de 1 km em linha reta", milhar(a1.pessoas) + " (" + limpo(a1.percentual) + "% de " + milhar(t.pessoas) + "), em " + a1.setores + " setores"],
     ["Pessoas a mais de 2 km em linha reta", milhar(a2.pessoas) + " (" + limpo(a2.percentual) + "% de " + milhar(t.pessoas) + "), em " + a2.setores + " setores"]
    ].forEach(function (x) { ul.appendChild(el("li", "", x[0] + ": " + x[1])); });
    box.appendChild(ul);
    box.appendChild(el("p", "", "As faixas exibidas são envelopes geométricos operacionais derivados dos raios documentados; não são intervalos de confiança estatísticos. Quando o raio não está documentado, a faixa não é calculada e a distância central permanece identificada como estimativa. Faixas sobrepostas não permitem ordenar com segurança qual equipamento é mais próximo."));
  }

  function aviso() {
    var m = estado.dados.meta, ul = $("mt-ressalvas"), i;
    $("mt-aviso-texto").textContent = m.aviso_metodologico;
    limpar(ul);
    for (i = 0; i < m.ressalvas.length; i++) ul.appendChild(el("li", "", m.ressalvas[i]));
  }

  function cobertura() {
    var d = estado.dados, box = $("mt-cobertura-corpo"), tab = el("table", "mt-tabela"), cab = el("tr");
    limpar(box);
    ["Categoria", "Cadastrados", "Com coordenada do catálogo", "Com posição pelo centro do CEP cadastral", "Localização pendente (só catálogo)"].forEach(function (h, i) { cab.appendChild(el("th", i ? "mt-num" : "", h)); });
    tab.appendChild(cab);
    CATEGORIAS.forEach(function (c) {
      var a = d.cobertura.coordenadas_do_catalogo[c], b = d.cobertura.com_centro_do_cep[c], r = el("tr");
      r.appendChild(cel("td", "", rotuloCategoria(c), "Categoria"));
      r.appendChild(cel("td", "mt-num", String(a.cadastrados), "Cadastrados"));
      r.appendChild(cel("td", "mt-num", String(a.com_coordenada), "Com coordenada do catálogo"));
      r.appendChild(cel("td", "mt-num", String(b.com_coordenada), "Com posição pelo centro do CEP cadastral"));
      r.appendChild(cel("td", "mt-num", String(a.cadastrados - a.com_coordenada), "Localização pendente (só catálogo)"));
      tab.appendChild(r);
    });
    box.appendChild(tab);
    box.appendChild(el("p", "", "A posição pelo centro do CEP cadastral do equipamento é aproximada e não equivale à coordenada do catálogo. Ela só é usada na análise de sensibilidade."));
  }

  function fonte() {
    var m = estado.dados.meta, box = $("mt-fonte"), g = m.entradas_geradas_em;
    limpar(box);
    box.appendChild(el("p", "", "Fonte: " + m.fonte + "."));
    box.appendChild(el("p", "", "Método: " + m.metodo));
    box.appendChild(el("p", "", "Versão " + m.versao + " dos indicadores. Carimbo dos dados (derivado do conteúdo das entradas): " + m.carimbo + ". Entradas geradas em: malha de setores " + g["setores.geojson"] + "; território " + g["territorio.json"] + "; distâncias " + g["exposicao_distancia.json"] + "; escolas " + (g["escolas_municipais.json"] || "data não informada") + "."));
  }

  function iniciar() {
    carregar("dados/indicadores_territoriais.json", function (dados) {
      carregar("dados/setores.geojson", function (geo) {
        estado.dados = dados;
        estado.geo = geo;
        montarSelects();
        desenharSetores();
        marcarPequenos();
        desenharPontos();
        aviso();
        cobertura();
        fonte();
        pintar();
        escolherSetor(null);
        mensagem("");
        $("mt-indicador").addEventListener("change", function () { atualizarCategorias(); pintar(); });
        $("mt-categoria").addEventListener("change", pintar);
        $("mt-cenario").addEventListener("change", pintar);
        $("mt-ponto-catalogo").addEventListener("change", desenharPontos);
        $("mt-ponto-cep").addEventListener("change", desenharPontos);
        $("mt-setor").addEventListener("change", function (e) { escolherSetor(e.target.value || null); });
      }, falha);
    }, falha);
  }
  function falha() {
    if (typeof window !== "undefined" && window.location && window.location.protocol === "file:") {
      mensagem("O mapa foi aberto diretamente como arquivo (file://), e o navegador bloqueou a leitura dos dados locais. Para visualizar: abra o PowerShell na pasta web do projeto, execute `py -m http.server 8000 --bind 127.0.0.1` e acesse http://127.0.0.1:8000/mapa-territorial.html. O servidor fica restrito ao próprio computador.");
      return;
    }
    mensagem("Não foi possível carregar os dados locais do mapa. Confira se a pasta dados contém indicadores_territoriais.json e setores.geojson e abra a página pelo servidor local. Nenhum dado foi enviado a outros endereços.");
  }

  if (typeof document !== "undefined" && document.getElementById("mt-svg")) iniciar();

  return { classeDe: classeDe, rotulosClasses: rotulosClasses, valorDoSetor: valorDoSetor, descreverValor: descreverValor, faixaDistancia: faixaDistancia, textoFaixaDistancia: textoFaixaDistancia, criarProjecao: criarProjecao, caminhoDe: caminhoDe, centroideGeometria: centroideGeometria, milhar: milhar, decimal: decimal, coresDe: coresDe, setorPequeno: setorPequeno, vizinho: vizinho };
});
