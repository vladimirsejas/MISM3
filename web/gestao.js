/* Painel de Gestao do Mapa do Cuidado. Dados 100% ficticios (web/dados/demo/gestao.json).
   Graficos em SVG puro, sem biblioteca externa e sem chamadas de rede alem dos arquivos locais. */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var NS = "http://www.w3.org/2000/svg";
  var D = null;          // dados do painel
  var SERVICOS = [];     // catalogo carregado no site (para a qualidade do catalogo)
  var GEO = null;        // malha de setores
  var mapa = null, camada = null;

  /* ---------------------------------------------------------------- utilidades */
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function fmt(n) { return Number(n).toLocaleString("pt-BR"); }
  function pct(a, b) { return b ? Math.round((a / b) * 1000) / 10 : 0; }
  function pctTxt(p) { return String(p).replace(".", ",") + "%"; }
  function compacto(n) { return n >= 1000 ? (Math.round(n / 100) / 10).toString().replace(".", ",") + " mil" : String(n); }
  function css(v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); }
  function carregar(url) { return fetch(url, { cache: "no-store" }).then(function (r) { if (!r.ok) throw new Error(url); return r.json(); }); }
  function larg(el) { return Math.max(260, Math.floor(el.clientWidth || el.parentNode.clientWidth || 320)); }
  var MESES_ABREV = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  function mesRot(m) { var p = m.split("-"); return MESES_ABREV[+p[1] - 1] + "/" + p[0].slice(2); }
  function rotuloCurto(r) { return r.split(" / ")[0].split(",")[0]; }
  function oculto(n) { return n == null ? "menos de " + D.meta.k_minimo : fmt(n); }  // privacidade: celulas pequenas

  function svg(w, h, rotulo) {
    var s = document.createElementNS(NS, "svg");
    s.setAttribute("width", w); s.setAttribute("height", h); s.setAttribute("viewBox", "0 0 " + w + " " + h);
    s.setAttribute("role", "img"); if (rotulo) s.setAttribute("aria-label", rotulo);
    return s;
  }
  function no(pai, nome, attrs, texto) {
    var e = document.createElementNS(NS, nome);
    for (var k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k)) e.setAttribute(k, attrs[k]);
    if (texto != null) e.textContent = texto;
    pai.appendChild(e); return e;
  }
  /* barra com 4px arredondados SO no fim (direita) e base reta */
  function caminhoBarra(x, y, w, h) {
    var r = Math.min(4, w, h / 2);
    if (w <= 0) return "M" + x + "," + y;
    return "M" + x + "," + y + " H" + (x + w - r) + " a" + r + "," + r + " 0 0 1 " + r + "," + r + " V" + (y + h - r) + " a" + r + "," + r + " 0 0 1 " + (-r) + "," + r + " H" + x + " Z";
  }
  function quebrar(texto, max) {  // ate 2 linhas
    if (texto.length <= max) return [texto];
    var pal = texto.split(" "), a = "", i = 0;
    while (i < pal.length && (a + " " + pal[i]).trim().length <= max) { a = (a + " " + pal[i]).trim(); i++; }
    var b = pal.slice(i).join(" ");
    return [a, b.length > max ? b.slice(0, max - 1) + "…" : b];
  }

  /* ---------------------------------------------------------------- dica (tooltip) */
  var dica = $("dica");
  function mostrar(html, ev) { dica.innerHTML = html; dica.hidden = false; mover(ev); }
  function mover(ev) {
    var x = ev.clientX + 14, y = ev.clientY + 14, r = dica.getBoundingClientRect();
    if (x + r.width > window.innerWidth - 8) x = ev.clientX - r.width - 14;
    if (y + r.height > window.innerHeight - 8) y = ev.clientY - r.height - 14;
    dica.style.left = Math.max(4, x) + "px"; dica.style.top = Math.max(4, y) + "px";
  }
  function esconder() { dica.hidden = true; }
  /* area de acerto MAIOR que a marca; funciona com mouse, toque e teclado */
  function ligarDica(elem, html) {
    elem.addEventListener("mouseenter", function (e) { mostrar(html, e); });
    elem.addEventListener("mousemove", mover);
    elem.addEventListener("mouseleave", esconder);
    elem.addEventListener("touchstart", function (e) { var t = e.touches[0]; mostrar(html, { clientX: t.clientX, clientY: t.clientY }); }, { passive: true });
    elem.addEventListener("focus", function () { var r = elem.getBoundingClientRect(); mostrar(html, { clientX: r.left + r.width / 2, clientY: r.top }); });
    elem.addEventListener("blur", esconder);
  }
  document.addEventListener("touchstart", function (e) { if (!e.target.closest || !e.target.closest(".marca")) esconder(); }, { passive: true });

  /* ---------------------------------------------------------------- tabela equivalente (acessibilidade) */
  function tabela(alvo, titulo, cab, linhas) {
    var h = '<details class="tabela"><summary>Ver como tabela: ' + esc(titulo) + "</summary><table><thead><tr>";
    cab.forEach(function (c, i) { h += '<th scope="col"' + (i ? ' class="n"' : "") + ">" + esc(c) + "</th>"; });
    h += "</tr></thead><tbody>";
    linhas.forEach(function (l) {
      h += "<tr>"; l.forEach(function (c, i) { h += (i ? '<td class="n">' : '<th scope="row">') + esc(c) + (i ? "</td>" : "</th>"); }); h += "</tr>";
    });
    alvo.innerHTML = h + "</tbody></table></details>";
  }

  /* ---------------------------------------------------------------- barras horizontais (uma serie) */
  function barrasH(alvo, itens, opt) {
    var W = larg(alvo), rotW = Math.min(190, Math.max(112, Math.round(W * 0.38))), valW = 72;
    var linhaH = 36, barH = 20, maxV = Math.max.apply(null, itens.map(function (i) { return i.valor || 0; })) || 1;
    var area = W - rotW - valW, s = svg(W, itens.length * linhaH + 4, opt.rotulo);
    itens.forEach(function (it, i) {
      var y = i * linhaH + 2, w = it.valor ? Math.max(2, Math.round(area * it.valor / maxV)) : 0;
      var g = no(s, "g", { "class": "marca", tabindex: 0, "aria-label": it.aria });
      no(g, "rect", { x: 0, y: y - 2, width: W, height: linhaH, fill: "transparent" });  // area de acerto
      var linhas = quebrar(it.rotulo, Math.floor(rotW / 6.6));
      linhas.forEach(function (l, k) { no(g, "text", { x: 0, y: y + barH / 2 + 4 - (linhas.length - 1) * 7 + k * 14 }, l); });
      if (w) no(g, "path", { "class": "barra", d: caminhoBarra(rotW, y, w, barH), style: "fill:" + opt.cor });
      no(g, "text", { x: rotW + w + 6, y: y + barH / 2 + 4, "class": "txt-valor" }, it.valorTxt);
      ligarDica(g, it.dica);
    });
    alvo.innerHTML = ""; alvo.appendChild(s);
  }

  /* ---------------------------------------------------------------- linha (serie temporal) */
  function niceStep(x) { var p = Math.pow(10, Math.floor(Math.log(x) / Math.LN10)), f = x / p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p; }
  function linha(alvo, meses, valores) {
    var W = larg(alvo), H = 210, m = { l: 46, r: 18, t: 14, b: 28 }, s = svg(W, H, "Buscas por mês, de " + mesRot(meses[0]) + " a " + mesRot(meses[meses.length - 1]));
    var passo = niceStep(Math.max.apply(null, valores) / 4), topo = Math.ceil(Math.max.apply(null, valores) / passo) * passo;
    var xs = function (i) { return m.l + (W - m.l - m.r) * i / (meses.length - 1); };
    var ys = function (v) { return m.t + (H - m.t - m.b) * (1 - v / topo); };
    for (var t = 0; t <= topo; t += passo) {
      no(s, "line", { x1: m.l, x2: W - m.r, y1: ys(t), y2: ys(t), "class": "grade" });
      no(s, "text", { x: m.l - 8, y: ys(t) + 4, "text-anchor": "end", "class": "eixo-txt" }, compacto(t));
    }
    var salto = W < 420 ? 3 : 2;
    meses.forEach(function (mm, i) { if ((meses.length - 1 - i) % salto === 0) no(s, "text", { x: xs(i), y: H - 8, "text-anchor": "middle", "class": "eixo-txt" }, mesRot(mm)); });
    var d = valores.map(function (v, i) { return (i ? "L" : "M") + xs(i).toFixed(1) + "," + ys(v).toFixed(1); }).join(" ");
    no(s, "path", { d: d + " L" + xs(valores.length - 1) + "," + ys(0) + " L" + xs(0) + "," + ys(0) + " Z", style: "fill:var(--s1);opacity:.1" });  // area ~10%
    no(s, "path", { d: d, fill: "none", "stroke-width": 2, "stroke-linejoin": "round", "stroke-linecap": "round", style: "stroke:var(--s1)" });
    var cur = valores.length - 1;
    no(s, "circle", { cx: xs(cur), cy: ys(valores[cur]), r: 6, style: "fill:var(--surface-1)" });  // anel de 2px
    no(s, "circle", { cx: xs(cur), cy: ys(valores[cur]), r: 4, style: "fill:var(--s1)" });
    no(s, "text", { x: xs(cur) - 8, y: ys(valores[cur]) - 10, "text-anchor": "end", "class": "txt-valor" }, fmt(valores[cur]));
    var guia = no(s, "line", { y1: m.t, y2: H - m.b, style: "stroke:var(--ink-3)", "stroke-width": 1, visibility: "hidden" });
    var ponto = no(s, "circle", { r: 4, style: "fill:var(--s1)", visibility: "hidden" });
    var cap = no(s, "rect", { x: m.l, y: m.t, width: W - m.l - m.r, height: H - m.t - m.b, fill: "transparent", tabindex: 0, "class": "marca", "aria-label": "Passe por cima para ver cada mês" });
    function ir(ev) {
      var r = cap.getBoundingClientRect(), i = Math.round((ev.clientX - r.left) / r.width * (meses.length - 1));
      i = Math.max(0, Math.min(meses.length - 1, i));
      guia.setAttribute("x1", xs(i)); guia.setAttribute("x2", xs(i)); guia.setAttribute("visibility", "visible");
      ponto.setAttribute("cx", xs(i)); ponto.setAttribute("cy", ys(valores[i])); ponto.setAttribute("visibility", "visible");
      mostrar("<b>" + esc(mesRot(meses[i])) + "</b>" + fmt(valores[i]) + " buscas", ev);
    }
    cap.addEventListener("mousemove", ir);
    cap.addEventListener("mouseleave", function () { guia.setAttribute("visibility", "hidden"); ponto.setAttribute("visibility", "hidden"); esconder(); });
    cap.addEventListener("touchstart", function (e) { var t = e.touches[0]; ir({ clientX: t.clientX, clientY: t.clientY }); }, { passive: true });
    alvo.innerHTML = ""; alvo.appendChild(s);
  }

  /* ---------------------------------------------------------------- funil (rampa ordinal) */
  function funil(alvo, etapas) {
    var W = larg(alvo), rotW = Math.min(190, Math.max(112, Math.round(W * 0.38))), valW = 130, linhaH = 40, barH = 22;
    var area = W - rotW - valW, s = svg(W, etapas.length * linhaH + 4, "Funil: " + etapas.map(function (e) { return e.etapa + " " + e.valor; }).join(", "));
    etapas.forEach(function (e, i) {
      var y = i * linhaH + 4, w = Math.max(3, Math.round(area * e.valor / etapas[0].valor));
      var ant = i ? pct(e.valor, etapas[i - 1].valor) : null;
      var g = no(s, "g", { "class": "marca", tabindex: 0, "aria-label": e.etapa + ": " + fmt(e.valor) + (ant != null ? ", " + pctTxt(ant) + " da etapa anterior" : "") });
      no(g, "rect", { x: 0, y: y - 4, width: W, height: linhaH, fill: "transparent" });
      quebrar(e.etapa, Math.floor(rotW / 6.6)).forEach(function (l, k, a) { no(g, "text", { x: 0, y: y + barH / 2 + 4 - (a.length - 1) * 7 + k * 14 }, l); });
      no(g, "path", { "class": "barra", d: caminhoBarra(rotW, y, w, barH), style: "fill:var(--ord-" + (i + 1) + ")" });
      var t = no(g, "text", { x: rotW + w + 6, y: y + barH / 2 + 4, "class": "txt-valor" }, fmt(e.valor));
      if (ant != null) no(t, "tspan", { dx: 6, style: "font-weight:400" }, "(" + pctTxt(ant) + " da anterior)");
      ligarDica(g, "<b>" + esc(e.etapa) + "</b>" + fmt(e.valor) + " pessoas" + (ant != null ? "<br>" + pctTxt(ant) + " da etapa anterior" : ""));
    });
    alvo.innerHTML = ""; alvo.appendChild(s);
  }

  /* ---------------------------------------------------------------- barras agrupadas: demanda x oferta */
  function agrupadas(alvo, regioes) {
    var W = larg(alvo), rotW = Math.min(170, Math.max(120, Math.round(W * 0.36))), valW = 44, grupoH = 62, bh = 15, gap = 3;
    var maxV = Math.max.apply(null, regioes.map(function (r) { return Math.max(r.interessadas, r.vagas); }));
    var area = W - rotW - valW, s = svg(W, regioes.length * grupoH + 4, "Interessadas e vagas por região");
    alvo.innerHTML = '<div class="legenda"><span><i style="background:var(--s1)"></i>Interessadas</span><span><i style="background:var(--s2)"></i>Vagas</span></div>';
    regioes.forEach(function (r, i) {
      var y = i * grupoH + 6, razao = r.interessadas / r.vagas;
      var g = no(s, "g", { "class": "marca", tabindex: 0, "aria-label": r.regiao + ": " + r.interessadas + " interessadas e " + r.vagas + " vagas" });
      no(g, "rect", { x: 0, y: y - 6, width: W, height: grupoH, fill: "transparent" });
      no(g, "text", { x: 0, y: y + bh, "class": "txt-valor" }, r.regiao.length > 22 ? r.regiao.slice(0, 21) + "…" : r.regiao);
      var t2 = no(g, "text", { x: 0, y: y + bh + 16, style: "font-size:11px" });
      if (razao > 3) { no(t2, "tspan", { style: "fill:var(--alerta-icone);font-weight:700" }, "▲ "); no(t2, "tspan", {}, "demanda " + razao.toFixed(1).replace(".", ",") + "× a oferta"); }
      else if (r.vagas > r.interessadas) { no(t2, "tspan", { style: "fill:var(--alerta-icone);font-weight:700" }, "◆ "); no(t2, "tspan", {}, "vagas ociosas"); }
      [["interessadas", "var(--s1)"], ["vagas", "var(--s2)"]].forEach(function (par, k) {
        var w = Math.max(2, Math.round(area * r[par[0]] / maxV)), yy = y + k * (bh + gap);
        no(g, "path", { "class": "barra", d: caminhoBarra(rotW, yy, w, bh), style: "fill:" + par[1] });
        no(g, "text", { x: rotW + w + 6, y: yy + bh - 3, "class": "txt-valor" }, fmt(r[par[0]]));
      });
      ligarDica(g, "<b>" + esc(r.regiao) + "</b>Interessadas: " + fmt(r.interessadas) + "<br>Vagas: " + fmt(r.vagas) + "<br>Desistência: " + pctTxt(r.abandono_pct).replace(".", ","));
    });
    alvo.appendChild(s);
  }

  /* ---------------------------------------------------------------- tiles (KPIs) */
  function sparkline(valores) {
    var W = 150, H = 44, s = svg(W, H, "Tendência dos últimos 12 meses"), mx = Math.max.apply(null, valores), mn = Math.min.apply(null, valores);
    var xs = function (i) { return 4 + (W - 12) * i / (valores.length - 1); }, ys = function (v) { return 6 + (H - 14) * (1 - (v - mn) / (mx - mn || 1)); };
    no(s, "path", { d: valores.map(function (v, i) { return (i ? "L" : "M") + xs(i).toFixed(1) + "," + ys(v).toFixed(1); }).join(" "), fill: "none", "stroke-width": 2, "stroke-linecap": "round", "stroke-linejoin": "round", style: "stroke:var(--neutro)" });
    no(s, "circle", { cx: xs(valores.length - 1), cy: ys(valores[valores.length - 1]), r: 6, style: "fill:var(--surface-1)" });
    no(s, "circle", { cx: xs(valores.length - 1), cy: ys(valores[valores.length - 1]), r: 4, style: "fill:var(--s1)" });
    var d = document.createElement("div"); d.appendChild(s); return d.innerHTML;
  }
  function tiles() {
    var total = D.buscas_por_mes.reduce(function (a, b) { return a + b; }, 0), n = D.buscas_por_mes.length;
    var ult = D.buscas_por_mes[n - 1], pen = D.buscas_por_mes[n - 2], delta = Math.round((ult / pen - 1) * 100);
    var sem = D.necessidades.reduce(function (a, x) { return a + (x.sem_resultado || 0); }, 0);
    var f = D.funil, comHorario = SERVICOS.length ? pct(SERVICOS.filter(function (x) { return x.horario; }).length, SERVICOS.length) : null;
    var h = '<div class="tile heroi"><div><p class="rot">Buscas por necessidade nos últimos 12 meses</p><p class="val">' + fmt(total) + '</p>' +
      '<p class="delta">' + (delta >= 0 ? "▲ +" : "▼ ") + delta + "% em " + esc(mesRot(D.meses[n - 1])) + " em relação ao mês anterior</p></div>" + sparkline(D.buscas_por_mes) + "</div>";
    function t(rot, val, nota) { return '<div class="tile"><p class="rot">' + rot + '</p><p class="val">' + val + '</p><p class="delta">' + nota + "</p></div>"; }
    h += t("Buscas sem resultado", pctTxt(pct(sem, total)), "ampliar o catálogo reduz este número");
    h += t("Concluem o que começam", pctTxt(pct(f[3].valor, f[2].valor)), "concluíram, entre as que participaram");
    h += t("Chegam a algo novo", pctTxt(pct(f[4].valor, f[3].valor)), "nova oportunidade, entre as que concluíram");
    h += t("Catálogo com horário", comHorario == null ? "—" : pctTxt(comHorario), "dos serviços cadastrados informam o horário");
    $("kpis").innerHTML = h;
  }

  /* ---------------------------------------------------------------- qualidade do catalogo (calculada ao vivo) */
  function qualidade() {
    var alvo = $("g-catalogo");
    if (!SERVICOS.length) { alvo.innerHTML = '<p class="meta">Nenhum serviço carregado.</p>'; return; }
    var tipos = {}; SERVICOS.forEach(function (x) { (tipos[x.tipo] = tipos[x.tipo] || []).push(x); });
    var campos = [["telefone", "Telefone", function (x) { return !!x.telefone; }], ["endereco", "Endereço", function (x) { return !!x.endereco; }],
      ["horario", "Horário", function (x) { return !!x.horario; }], ["local", "No mapa", function (x) { return x.lat != null && x.lon != null; }]];
    var h = '<div class="medidor"><span class="cab"></span>' + campos.map(function (c) { return '<span class="cab">' + c[1] + "</span>"; }).join("");
    Acesso.ORDEM.concat(Object.keys(tipos).filter(function (k) { return Acesso.ORDEM.indexOf(k) < 0; })).forEach(function (k) {
      if (!tipos[k]) return;
      h += '<div class="tipo">' + esc(Acesso.ROTULOS[k] || k) + "<small>" + tipos[k].length + " cadastrados</small></div>";
      campos.forEach(function (c) {
        var p = pct(tipos[k].filter(c[2]).length, tipos[k].length);
        h += '<div><div class="trilho" role="img" aria-label="' + c[1] + ": " + pctTxt(p) + '"><span style="width:' + p + '%"></span></div><div class="pct">' + c[1] + " " + pctTxt(p) + "</div></div>";
      });
    });
    alvo.innerHTML = h + "</div>";
  }

  /* ---------------------------------------------------------------- mapa (rampa sequencial, sem imagens externas) */
  function quantis(valores, k) {
    var v = valores.filter(function (x) { return x > 0; }).sort(function (a, b) { return a - b; }), cortes = [];
    for (var i = 1; i < k; i++) cortes.push(v[Math.floor(v.length * i / k)]);
    return cortes;
  }
  function desenharMapa() {
    if (!GEO || !D || typeof L === "undefined") return;
    var cores = [1, 2, 3, 4, 5].map(function (i) { return css("--seq-" + i); });
    var vals = D.criancas_0_4_por_setor, cortes = quantis(Object.keys(vals).map(function (k) { return vals[k]; }), 5);
    var cls = function (v) { var c = 0; while (c < cortes.length && v >= cortes[c]) c++; return c; };
    if (!mapa) { mapa = L.map("mapa-gestao", { zoomControl: true, attributionControl: false, zoomSnap: 0.25, zoomDelta: 0.5 }); camada = L.layerGroup().addTo(mapa); }
    camada.clearLayers();
    var layer = L.geoJSON(GEO, {
      style: function (f) { return { fillColor: cores[cls(vals[f.properties.setor] || 0)], fillOpacity: 0.92, color: css("--surface-1"), weight: 0.6 }; },
      onEachFeature: function (f, l) {
        var v = vals[f.properties.setor] || 0;
        l.bindTooltip("<b>" + esc(f.properties.bairro || "Setor sem bairro") + "</b>" + (v < D.meta.k_minimo ? "menos de " + D.meta.k_minimo : "cerca de " + fmt(v)) + " crianças de 0 a 4 anos (fictício)", { sticky: true });
      }
    }).addTo(camada);
    SERVICOS.filter(function (x) { return (x.tipo === "creche" || x.tipo === "educacao_infantil") && x.lat != null; }).forEach(function (x) {
      L.circleMarker([x.lat, x.lon], { radius: 6, fillColor: css("--s2"), fillOpacity: 1, color: css("--surface-1"), weight: 2 })
        .bindTooltip(esc(x.nome) + " (serviço de exemplo)").addTo(camada);
    });
    mapa.fitBounds(layer.getBounds(), { padding: [4, 4] });
    setTimeout(function () { mapa.invalidateSize(); }, 50);
    var lim = [0].concat(cortes), rot = lim.map(function (a, i) { return i < lim.length - 1 ? fmt(a) + " a " + fmt(lim[i + 1] - 1) : fmt(a) + " ou mais"; });
    $("legenda-mapa").innerHTML = "<span>Crianças de 0 a 4 anos por setor:</span>" + rot.map(function (r, i) { return '<span><i style="background:' + cores[i] + '"></i>' + r + "</span>"; }).join("") +
      '<span><i style="background:var(--s2);border-radius:50%;width:12px"></i>serviço de exemplo</span>';
  }

  /* ---------------------------------------------------------------- decisões possíveis (sempre identificadas como cenário fictício) */
  function montarAcoes() {
    var alvo = $("acoes-gestao");
    if (!alvo || !D) return;
    var cards = [];
    var sem = (D.sem_resultado || []).slice().sort(function (a, b) { return b.ocorrencias - a.ocorrencias; });
    var juridico = sem.find(function (x) { return /jur[ií]dic|advogad|defensoria|guarda|pens[aã]o/i.test(x.tema); });
    var creche = sem.find(function (x) { return /creche|educa[cç][aã]o infantil/i.test(x.tema); });
    var transporte = sem.find(function (x) { return /[ôo]nibus|transporte/i.test(x.tema); });

    function card(prioridade, titulo, sinal, acao, responsavel, indicador, confirmar) {
      cards.push('<article class="acao-card"><p class="acao-prioridade">' + esc(prioridade) + '</p>' +
        '<h3>' + esc(titulo) + '</h3><p><strong>Sinal do cenário:</strong> ' + esc(sinal) + '</p>' +
        '<p><strong>Próximo passo:</strong> ' + esc(acao) + '</p>' +
        '<p><strong>Responsável sugerido:</strong> ' + esc(responsavel) + '</p>' +
        '<p><strong>Como acompanhar:</strong> ' + esc(indicador) + '</p>' +
        '<p class="acao-confirmar"><strong>Antes de decidir:</strong> ' + esc(confirmar) + '</p></article>');
    }

    if (juridico) {
      card("Prioridade de validação", "Fechar a lacuna de orientação jurídica",
        juridico.tema + " aparece entre os exemplos de buscas sem resultado (" + fmt(juridico.ocorrencias) + " ocorrências fictícias).",
        "Mapear Defensoria Pública, serviços públicos de assistência jurídica e advogadas com atuação em Direito de Família e violência contra a mulher. Confirmar critérios, custo, horários, acessibilidade e forma segura de contato.",
        "Coordenação da política para mulheres, assistência social e parceiros da rede de justiça.",
        "Percentual de encaminhamentos jurídicos que encontram um serviço confirmado; tempo até a primeira orientação.",
        "Validar a oferta com os próprios serviços e profissionais. Não divulgar contatos ou disponibilidade sem confirmação.");
    }
    if (creche) {
      card("Investigar oferta e acesso", "Verificar a procura por creche e cuidado infantil",
        creche.tema + " aparece entre os exemplos sem resultado (" + fmt(creche.ocorrencias) + " ocorrências fictícias).",
        "Cruzar demanda oficial por faixa etária e fila de espera com vagas efetivamente disponíveis por unidade e período. Identificar opções de cuidado e horários que permitam trabalhar ou estudar.",
        "Secretaria de Educação, assistência social e área de trabalho e renda.",
        "Demanda registrada, vagas disponíveis, tempo de espera e encaminhamentos atendidos.",
        "Usar bases oficiais comparáveis e atuais. Crianças estimadas por setor neste painel são fictícias e não medem demanda real.");
    }
    if (transporte) {
      card("Investigar acesso", "Conferir barreiras de transporte",
        transporte.tema + " aparece entre os exemplos sem resultado (" + fmt(transporte.ocorrencias) + " ocorrências fictícias).",
        "Confirmar linhas, horários, acessibilidade e conexões com creches, cursos, serviços de saúde e oportunidades de trabalho. Registrar onde a informação oficial está ausente ou difícil de encontrar.",
        "Área municipal de mobilidade, operadores de transporte e serviços parceiros.",
        "Serviços com horários oficiais atualizados e rotas úteis documentadas.",
        "Não concluir que falta transporte apenas porque falta informação no catálogo.");
    }

    var maiorRazao = (D.regioes || []).slice().sort(function (a, b) {
      return (b.interessadas / Math.max(1, b.vagas)) - (a.interessadas / Math.max(1, a.vagas));
    })[0];
    if (maiorRazao) {
      card("Validar antes de alocar recursos", "Investigar diferença entre procura e vagas",
        maiorRazao.regiao + " apresenta " + fmt(maiorRazao.interessadas) + " interessadas e " + fmt(maiorRazao.vagas) + " vagas no cenário fictício.",
        "Confirmar com os serviços locais se as vagas estão abertas, se os requisitos são compatíveis e se há barreiras de horário, deslocamento ou cuidado infantil. Só depois avaliar novas turmas ou redistribuição.",
        "Gestão de trabalho e qualificação, com os prestadores das oportunidades.",
        "Vagas realmente abertas, inscrições concluídas, comparecimento e conclusão.",
        "Os nomes das regiões e todos os volumes de procura/oferta são demonstrativos; não usar para escolher bairros reais.");
    }

    var totalServicos = SERVICOS.length;
    var semHorario = SERVICOS.filter(function (x) { return !x.horario; }).length;
    if (totalServicos) {
      card("Melhorar a informação disponível", "Completar e revisar o catálogo de serviços",
        semHorario + " de " + totalServicos + " serviços carregados não informam horário no cadastro atual.",
        "Revisar primeiro os serviços de proteção, saúde, apoio jurídico, assistência social e cuidado infantil. Confirmar telefone, endereço institucional, horário, acessibilidade, custo e data da última verificação.",
        "Equipe responsável pelo catálogo, com confirmação de cada órgão ou profissional.",
        "Percentual de cadastros verificados e atualizados; quantidade de encaminhamentos que chegam ao destino.",
        "Campo preenchido não garante que a informação esteja correta; registrar fonte e data de confirmação.");
    } else {
      card("Preparar para uso real", "Definir a rotina de manutenção do catálogo",
        "Nenhum serviço real foi carregado nesta execução.",
        "Antes de usar o painel fora da demonstração, atribuir um responsável por categoria, uma fonte oficial e uma frequência de revisão para cada serviço.",
        "Equipe responsável pelo MISM3 e instituições parceiras.",
        "Percentual de serviços com fonte, data de verificação e responsável definidos.",
        "Não apresentar serviços fictícios como disponíveis para a população.");
    }

    alvo.innerHTML = cards.join("");
  }

  /* ---------------------------------------------------------------- montagem */
  function montar() {
    if (!D) return;
    var gestao = document.body.getAttribute("data-visao") === "gestao";
    tiles();
    var nec = D.necessidades;
    barrasH($("g-necessidades"), nec.map(function (n) {
      return { rotulo: rotuloCurto(n.rotulo), valor: n.buscas, valorTxt: fmt(n.buscas), aria: n.rotulo + ": " + n.buscas + " buscas",
        dica: "<b>" + esc(n.rotulo) + "</b>" + fmt(n.buscas) + " buscas<br>Sem resultado: " + oculto(n.sem_resultado) };
    }), { cor: "var(--s1)", rotulo: "Buscas por necessidade" });
    tabela($("t-necessidades"), "buscas por necessidade", ["Necessidade", "Buscas", "Sem resultado"], nec.map(function (n) { return [n.rotulo, fmt(n.buscas), oculto(n.sem_resultado)]; }));
    linha($("g-meses"), D.meses, D.buscas_por_mes);
    tabela($("t-meses"), "buscas por mês", ["Mês", "Buscas"], D.meses.map(function (m, i) { return [mesRot(m), fmt(D.buscas_por_mes[i])]; }));
    funil($("g-funil"), D.funil);
    tabela($("t-funil-tab"), "etapas do funil", ["Etapa", "Pessoas", "% da etapa anterior"], D.funil.map(function (e, i) { return [e.etapa, fmt(e.valor), i ? pctTxt(pct(e.valor, D.funil[i - 1].valor)) : "—"]; }));
    qualidade();
    montarAcoes();
    desenharMapa();
    if (gestao) {
      agrupadas($("g-regioes"), D.regioes);
      tabela($("t-regioes"), "demanda e oferta por região", ["Região", "Interessadas", "Vagas", "Desistência"], D.regioes.map(function (r) { return [r.regiao, fmt(r.interessadas), fmt(r.vagas), pctTxt(r.abandono_pct)]; }));
      var sem = D.sem_resultado.slice().sort(function (a, b) { return b.ocorrencias - a.ocorrencias; });
      barrasH($("g-sem"), sem.map(function (x) { return { rotulo: x.tema, valor: x.ocorrencias, valorTxt: fmt(x.ocorrencias), aria: x.tema + ": " + x.ocorrencias, dica: "<b>" + esc(x.tema) + "</b>" + fmt(x.ocorrencias) + " buscas sem resultado" }; }), { cor: "var(--s1)", rotulo: "Buscas sem resultado por tema" });
      tabela($("t-sem-tab"), "buscas sem resultado", ["Tema", "Ocorrências"], sem.map(function (x) { return [x.tema, fmt(x.ocorrencias)]; }));
      var top = GEO ? GEO.features.map(function (f) { return [f.properties.bairro || "Setor sem bairro", D.criancas_0_4_por_setor[f.properties.setor] || 0]; })
        .sort(function (a, b) { return b[1] - a[1]; }).slice(0, 10) : [];
      tabela($("t-mapa-tab"), "10 setores com mais crianças (fictício)", ["Bairro", "Crianças de 0 a 4 anos"], top.map(function (t) { return [t[0], t[1] < D.meta.k_minimo ? "menos de " + D.meta.k_minimo : fmt(t[1])]; }));
    }
  }

  function definirVisao(v) {
    document.body.setAttribute("data-visao", v);
    Array.prototype.forEach.call(document.querySelectorAll(".visao button"), function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-visao") === v)); });
    $("aviso-visao").textContent = v === "publica"
      ? "Visão demonstrativa pública: resumo e tendências fictícias."
      : "Visão demonstrativa de gestão: inclui hipóteses de ação e detalhes fictícios. O seletor apenas esconde elementos na tela; não é controle de acesso.";
    montar();
  }
  Array.prototype.forEach.call(document.querySelectorAll(".visao button"), function (b) {
    b.addEventListener("click", function () { definirVisao(b.getAttribute("data-visao")); });
  });
  var rt; window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(montar, 150); });
  if (window.matchMedia) window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", montar);

  Promise.all([
    carregar("dados/demo/gestao.json"),
    carregar("dados/servicos.json").catch(function () { return carregar("dados/demo/servicos.json"); }).catch(function () { return { servicos: [] }; }),
    carregar("dados/setores.geojson").catch(function () { return null; })
  ]).then(function (r) {
    D = r[0]; SERVICOS = r[1].servicos || []; GEO = r[2];
    $("fonte-gestao").textContent = "Período fictício: " + mesRot(D.meses[0]) + " a " + mesRot(D.meses[D.meses.length - 1]) + ". Malha de setores: IBGE (Censo 2022), usada só como geometria.";
    var q = /[?&]visao=(gestao|publica)/.exec(location.search);
    definirVisao(q ? q[1] : "publica");
  }).catch(function () {
    $("kpis").innerHTML = '<p class="mensagem">Não foi possível carregar os dados do painel. Abra o site por um servidor local (veja o README).</p>';
  });
})();
