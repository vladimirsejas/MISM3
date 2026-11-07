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
      t = svg("title", {});
      p.appendChild(t);
      camada.appendChild(p);
      estado.caminhos[f.properties.setor] = p;
      (function (id) { p.addEventListener("click", function () { escolherSetor(id); }); })(f.properties.setor);
    }
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
      p.firstChild.textContent = "Setor " + st.id + (st.bairro ? " (" + st.bairro + ")" : "") + ": " + descreverValor(s.indicador, v);
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
      var l = el("li"); l.appendChild(el("span", "mt-forma", x[0])); l.appendChild(el("span", "", x[1] + ": ponto cheio = coordenada do catálogo; ponto vazado = posição aproximada pelo centro do CEP cadastral do equipamento")); pts.appendChild(l);
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
      rot = e.precisao === "catalogo" ? "coordenada do catálogo" : "posição aproximada pelo centro do CEP cadastral do equipamento";
      t = svg("title", {});
      t.textContent = e.nome + " (" + rotuloCategoria(e.categoria) + "): " + rot;
      no.appendChild(t);
      camada.appendChild(no);
    }
  }

  function escolherSetor(id) {
    var d = estado.dados, st = null, i, k;
    for (i = 0; i < d.setores.length; i++) if (d.setores[i].id === id) { st = d.setores[i]; break; }
    for (k in estado.caminhos) if (Object.prototype.hasOwnProperty.call(estado.caminhos, k)) estado.caminhos[k].setAttribute("class", "mt-setor");
    estado.escolhido = st ? st.id : null;
    $("mt-setor").value = st ? st.id : "";
    var corpo = $("mt-detalhe-corpo");
    limpar(corpo);
    $("mt-detalhe-vazio").hidden = !!st;
    if (!st) return;
    estado.caminhos[st.id].setAttribute("class", "mt-setor mt-escolhido");
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
    CENARIOS.forEach(function (c) { cab.appendChild(el("th", "mt-num", "Distância em linha reta (km): " + d.meta.rotulos_cenario[c])); });
    tab.appendChild(cab);
    CATEGORIAS.forEach(function (c) {
      r = el("tr");
      r.appendChild(cel("td", "", rotuloCategoria(c), "Categoria"));
      r.appendChild(cel("td", "mt-num", String(st.equipamentos[c]), "Serviços localizados no setor"));
      CENARIOS.forEach(function (cen) {
        var v = st.distancia_km[cen][c];
        r.appendChild(cel("td", "mt-num", v === null ? "localização pendente" : decimal(v, 2), "Distância em linha reta (km): " + d.meta.rotulos_cenario[cen]));
      });
      tab.appendChild(r);
    });
    corpo.appendChild(tab);
    corpo.appendChild(el("p", "", "A distância é medida do centro do setor até o equipamento cadastrado mais próximo da categoria. Serviço localizado no setor indica onde o equipamento está, não quem ele atende."));
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
    box.appendChild(el("p", "", "Versão " + m.versao + " dos indicadores. Carimbo dos dados (derivado do conteúdo das entradas): " + m.carimbo + ". Entradas geradas em: malha de setores " + g["setores.geojson"] + "; território " + g["territorio.json"] + "; distâncias " + g["exposicao_distancia.json"] + "."));
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
  function falha() { mensagem("Não foi possível carregar os dados locais do mapa. Nenhum dado foi enviado a outros endereços."); }

  if (typeof document !== "undefined" && document.getElementById("mt-svg")) iniciar();

  return { classeDe: classeDe, rotulosClasses: rotulosClasses, valorDoSetor: valorDoSetor, descreverValor: descreverValor, criarProjecao: criarProjecao, caminhoDe: caminhoDe, milhar: milhar, decimal: decimal, coresDe: coresDe, setorPequeno: setorPequeno };
});
