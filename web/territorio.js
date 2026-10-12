/* Rio Claro em números: mapa por setor censitário, barras por bairro e tabelas.
   Só dados públicos e agregados (IBGE Censo 2022, INEP 2025), lidos de arquivos locais. Nenhuma requisição externa.
   Todo texto vindo dos dados entra na página com textContent, nunca como HTML. */
(function () {
  "use strict";

  var NS = "http://www.w3.org/2000/svg";
  var REDES = { municipal: "Municipal", privada: "Privada", estadual: "Estadual", federal: "Federal", nao_informada: "Não informada" };

  function inteiro(n) { return Number(n).toLocaleString("pt-BR"); }
  function decimal(n, casas) { return Number(n).toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas }); }
  function el(tag, classe, texto) {
    var e = document.createElement(tag);
    if (classe) e.className = classe;
    if (texto != null) e.textContent = texto;
    return e;
  }
  function limpar(no) { while (no.firstChild) no.removeChild(no.firstChild); }
  function carregar(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error(url + ": " + r.status);
      return r.json();
    });
  }

  var estado = { metrica: "densidade", bairro: null, area: "todo", geo: null, dados: null, caminhos: [], caixas: {}, vista: null, projetar: null };

  function nomeDoBairro(propriedades) {
    return propriedades.bairro || estado.dados.meta.sem_bairro.rotulo;   /* a malha do IBGE não traz bairro para parte dos setores */
  }

  /* ---------- classes e legenda ---------- */
  function ehDistancia() { return estado.metrica.indexOf("dist_") === 0; }
  function blocoDaMetrica() {
    return ehDistancia() ? estado.dados.distancia_ate_servico[estado.metrica.slice(5)] : estado.dados.classes[estado.metrica];
  }

  function classeDoSetor(codigo) {
    var s = estado.dados.setores[codigo];
    var valor = ehDistancia() ? s[estado.metrica] : (estado.metrica === "densidade" ? s.d : s.p);
    if (valor == null) return "cn";
    var limites = blocoDaMetrica().limites;
    var i = 0;
    while (i < limites.length && valor >= limites[i]) i++;
    return "c" + i;
  }

  function rotulosDaLegenda() {
    var c = blocoDaMetrica();
    var f = estado.metrica === "densidade" ? inteiro : function (n) { return decimal(n, 1); };
    var km = ehDistancia() ? " km" : "";
    var l = c.limites, r = [];
    r.push("Menos de " + f(l[0]) + km);
    for (var i = 0; i < l.length - 1; i++) r.push(f(l[i]) + " a " + f(l[i + 1]) + km);
    r.push(f(l[l.length - 1]) + (km ? " km ou mais" : " ou mais"));
    return r;
  }

  function desenharLegenda() {
    var ul = document.getElementById("legenda");
    limpar(ul);
    var c = blocoDaMetrica();
    var rotulos = rotulosDaLegenda();
    rotulos.forEach(function (txt, i) {
      var li = el("li");
      li.appendChild(el("span", "amostra c" + i));
      li.appendChild(el("span", null, txt + " (" + inteiro(c.contagem[i]) + " setores)"));
      ul.appendChild(li);
    });
    var semBase = estado.metrica === "pessoas_por_domicilio" ? c.sem_base_suficiente : 0;
    if (semBase) {
      var li = el("li");
      li.appendChild(el("span", "amostra cn"));
      li.appendChild(el("span", null, "Sem base suficiente: menos de " + c.min_domicilios + " domicílios (" + inteiro(semBase) + " setores)"));
      ul.appendChild(li);
    }
    var unidade = estado.metrica === "densidade" ? "pessoas por km²" : "pessoas por domicílio";
    if (ehDistancia()) unidade = "distância em linha reta até o serviço mais próximo (" + c.rotulo + ")";
    document.getElementById("sub-mapa").textContent = "Cada setor é colorido por " + unidade + ". Os tons seguem a legenda, do menor valor (primeiro item) ao maior (último).";
  }

  function colorir() {
    estado.caminhos.forEach(function (p) {
      p.setAttribute("class", classeDoSetor(p.getAttribute("data-setor")) + (p.getAttribute("data-bairro") === estado.bairro ? " sel" : ""));
    });
    desenharLegenda();
    if (estado.vista) desenharPontos();
  }

  /* ---------- mapa ---------- */
  function desenharMapa() {
    var svg = document.getElementById("mapa-territorio");
    var feicoes = estado.geo.features;
    var minLon = 180, maxLon = -180, minLat = 90, maxLat = -90;
    function varrer(c) {
      if (typeof c[0] === "number") {
        if (c[0] < minLon) minLon = c[0]; if (c[0] > maxLon) maxLon = c[0];
        if (c[1] < minLat) minLat = c[1]; if (c[1] > maxLat) maxLat = c[1];
      } else c.forEach(varrer);
    }
    feicoes.forEach(function (f) { varrer(f.geometry.coordinates); });
    var kx = Math.cos(((minLat + maxLat) / 2) * Math.PI / 180);
    var largura = 1000, escala = largura / ((maxLon - minLon) * kx), altura = (maxLat - minLat) * escala;
    svg.setAttribute("viewBox", "0 0 " + largura + " " + Math.round(altura));
    estado.vista = { todo: [0, 0, largura, altura] };
    estado.projetar = function (lat, lon) { return [(lon - minLon) * kx * escala, (maxLat - lat) * escala]; };
    function ponto(c) { return ((c[0] - minLon) * kx * escala).toFixed(1) + " " + ((maxLat - c[1]) * escala).toFixed(1); }
    function caminho(geom) {
      var poligonos = geom.type === "Polygon" ? [geom.coordinates] : geom.coordinates, d = [];
      poligonos.forEach(function (p) {
        p.forEach(function (anel) { d.push("M" + anel.map(ponto).join("L") + "Z"); });
      });
      return d.join("");
    }
    feicoes.forEach(function (f) {
      var p = document.createElementNS(NS, "path");
      p.setAttribute("d", caminho(f.geometry));
      p.setAttribute("data-setor", f.properties.setor);
      p.setAttribute("data-bairro", nomeDoBairro(f.properties));
      svg.appendChild(p);
      estado.caminhos.push(p);
      var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      (function medir(c) {
        if (typeof c[0] === "number") {
          var x = (c[0] - minLon) * kx * escala, y = (maxLat - c[1]) * escala;
          if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
        } else c.forEach(medir);
      })(f.geometry.coordinates);
      estado.caixas[f.properties.setor] = [x0, y0, x1, y1];
    });
    var camada = document.createElementNS(NS, "g");
    camada.setAttribute("id", "pontos");
    svg.appendChild(camada);
    calcularAreaUrbana();
    aplicarArea();
    svg.setAttribute("aria-label", "Mapa de Rio Claro dividido em " + feicoes.length + " setores censitários, coloridos pelo indicador escolhido.");
  }

  /* ---------- aproximar na área urbana ---------- */
  /* A área urbana densa é o retângulo que envolve os setores com 2.000 ou mais pessoas por km² (o 2º limite da legenda).
     Tudo sai dos dados: nada de número fixo no texto. */
  function calcularAreaUrbana() {
    var limite = estado.dados.classes.densidade.limites[1];
    var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, pessoas = 0, n = 0;
    estado.geo.features.forEach(function (f) {
      var s = estado.dados.setores[f.properties.setor];
      if (s.d == null || s.d < limite) return;
      var c = estado.caixas[f.properties.setor];
      x0 = Math.min(x0, c[0]); y0 = Math.min(y0, c[1]); x1 = Math.max(x1, c[2]); y1 = Math.max(y1, c[3]);
      pessoas += f.properties.pessoas; n++;
    });
    var w = x1 - x0, h = y1 - y0, folga = 0.03;
    estado.vista.densa = [x0 - w * folga, y0 - h * folga, w * (1 + 2 * folga), h * (1 + 2 * folga)];
    estado.densa = { limite: limite, setores: n, pessoas: pessoas };
  }

  /* ---------- serviços no mapa ---------- */
  function desenharPontos() {
    var camada = document.getElementById("pontos"), lista = document.getElementById("lista-pontos");
    limpar(camada); limpar(lista);
    var resumo = document.getElementById("resumo-dist"), detalhes = document.getElementById("lista-servicos-territorio");
    limpar(resumo);
    resumo.hidden = detalhes.hidden = !ehDistancia();
    if (!ehDistancia()) return;
    var b = blocoDaMetrica(), v = estado.vista[estado.area], r = v[2] / 75;
    b.pontos.forEach(function (p) {
      var xy = estado.projetar(p.lat, p.lon), c = document.createElementNS(NS, "circle");
      c.setAttribute("cx", xy[0].toFixed(1)); c.setAttribute("cy", xy[1].toFixed(1)); c.setAttribute("r", r.toFixed(1));
      c.setAttribute("class", "n-ponto" + (p.precisao === "cep" ? " aprox" : ""));
      c.setAttribute("data-nome", p.nome); c.setAttribute("data-precisao", p.precisao); c.setAttribute("data-raio", p.raio_m);
      camada.appendChild(c);
      lista.appendChild(el("li", null, p.nome + (p.precisao === "cep" ? " (localização aproximada pelo CEP, raio de cerca de " + inteiro(p.raio_m) + " m)" : " (localização pelo endereço)")));
    });
    var pct = 100 * b.pessoas_3_km_ou_mais / b.pessoas_total;
    resumo.appendChild(el("p", null, "Serviços localizados no mapa (" + b.rotulo + "): " + inteiro(b.localizados) + " de " + inteiro(b.cadastrados) +
      " cadastrados no catálogo (" + inteiro(b.localizados_pelo_endereco) + " pelo endereço). Círculo cheio = localização pelo endereço; círculo vazado = aproximada pelo CEP."));
    resumo.appendChild(el("p", null, inteiro(b.pessoas_3_km_ou_mais) + " pessoas (" + decimal(pct, 1) + "%) moram a 3 km ou mais do serviço localizado mais próximo, em linha reta. Metade das pessoas está a " +
      decimal(b.mediana_km, 1) + " km ou menos."));
    if (b.nota) resumo.appendChild(el("p", "nota", b.nota));
    resumo.appendChild(el("p", "nota", estado.dados.meta.aviso_distancia));
  }

  function aplicarArea() {
    var v = estado.vista[estado.area];
    document.getElementById("mapa-territorio").setAttribute("viewBox", v.map(function (n) { return Math.round(n); }).join(" "));
    desenharPontos();
    var nota = document.getElementById("nota-area");
    nota.hidden = estado.area !== "densa";
    if (!nota.hidden) {
      var d = estado.densa, total = estado.dados.totais.pessoas;
      nota.textContent = "Recorte nos " + inteiro(d.setores) + " setores com " + inteiro(d.limite) + " ou mais pessoas por km², onde moram " +
        decimal(100 * d.pessoas / total, 1) + "% da população. Partes mais afastadas ficam de fora da imagem, não do cálculo.";
    }
  }

  /* ---------- dica (tooltip) ---------- */
  function ligarDica() {
    var svg = document.getElementById("mapa-territorio"), moldura = document.getElementById("moldura"), dica = document.getElementById("dica");
    var propriedades = {};
    estado.geo.features.forEach(function (f) { propriedades[f.properties.setor] = f.properties; });

    function mostrar(e) {
      var ponto = e.target.closest ? e.target.closest("circle.ponto") : null;
      var alvo = e.target.closest ? e.target.closest("path") : null;
      if (!alvo && !ponto) { dica.style.display = "none"; return; }
      limpar(dica);
      if (ponto) {
        dica.appendChild(el("strong", null, ponto.getAttribute("data-nome")));
        dica.appendChild(el("div", "sec", ponto.getAttribute("data-precisao") === "cep"
          ? "Localização aproximada pelo CEP (raio de cerca de " + inteiro(ponto.getAttribute("data-raio")) + " m)" : "Localização pelo endereço"));
        posicionar(e);
        return;
      }
      var cod = alvo.getAttribute("data-setor"), pr = propriedades[cod], s = estado.dados.setores[cod];
      dica.appendChild(el("strong", null, nomeDoBairro(pr)));
      dica.appendChild(el("div", "sec", "Setor " + cod + " · " + pr.situacao));
      dica.appendChild(el("div", null, inteiro(pr.pessoas) + " pessoas · " + inteiro(pr.domicilios) + " domicílios"));
      dica.appendChild(el("div", null, s.d == null ? "Densidade: sem área" : inteiro(s.d) + " pessoas por km²"));
      dica.appendChild(el("div", null, s.p == null ? "Pessoas por domicílio: sem base suficiente (menos de " + estado.dados.classes.pessoas_por_domicilio.min_domicilios + " domicílios)"
                                                   : decimal(s.p, 2) + " pessoas por domicílio"));
      Object.keys(estado.dados.distancia_ate_servico || {}).forEach(function (k) {
        if (s["dist_" + k] != null) dica.appendChild(el("div", "sec", "Serviço mais próximo (" + estado.dados.distancia_ate_servico[k].rotulo + "): " + decimal(s["dist_" + k], 1) + " km, em linha reta"));
      });
      posicionar(e);
    }
    function posicionar(e) {
      dica.style.display = "block";
      var r = moldura.getBoundingClientRect();
      var x = e.clientX - r.left + 14, y = e.clientY - r.top + 14;
      if (x + dica.offsetWidth > r.width) x = Math.max(0, e.clientX - r.left - dica.offsetWidth - 14);
      if (y + dica.offsetHeight > r.height) y = Math.max(0, e.clientY - r.top - dica.offsetHeight - 14);
      dica.style.left = x + "px";
      dica.style.top = y + "px";
    }
    svg.addEventListener("pointermove", mostrar);
    svg.addEventListener("pointerdown", mostrar);
    svg.addEventListener("pointerleave", function () { dica.style.display = "none"; });
    svg.addEventListener("click", function (e) {
      var alvo = e.target.closest ? e.target.closest("path") : null;
      if (alvo) escolherBairro(alvo.getAttribute("data-bairro"));
    });
  }

  /* ---------- bairros ---------- */
  function escolherBairro(nome) {
    estado.bairro = estado.bairro === nome ? null : nome;
    document.getElementById("mapa-territorio").classList.toggle("tem-selecao", !!estado.bairro);
    colorir();
    Array.prototype.forEach.call(document.querySelectorAll("#barras button"), function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-bairro") === estado.bairro));
    });
    document.getElementById("limpar").hidden = !estado.bairro;
  }

  function desenharBarras(ul, itens, aoClicar, rotuloDoBotao) {
    limpar(ul);
    var max = Math.max.apply(null, itens.map(function (i) { return i.valor; })) || 1;
    itens.forEach(function (i) {
      var li = el("li"), b = el("button");
      b.type = "button";
      if (aoClicar) {
        b.setAttribute("data-bairro", i.nome);
        b.setAttribute("aria-pressed", "false");
        b.setAttribute("aria-label", rotuloDoBotao(i));
        b.addEventListener("click", function () { aoClicar(i.nome); });
      } else {
        b.style.cursor = "default";
        b.disabled = true;
      }
      b.appendChild(el("span", "nome", i.nome));
      var trilho = el("span", "trilho"), barra = el("span", "n-barra");
      barra.style.width = "calc(" + (100 * i.valor / max).toFixed(1) + "% - 64px)";
      barra.style.minWidth = "2px";
      trilho.appendChild(barra);
      trilho.appendChild(el("span", "num", inteiro(i.valor)));
      b.appendChild(trilho);
      li.appendChild(b);
      ul.appendChild(li);
    });
  }

  function tabela(no, cabecalho, linhas, legenda) {
    limpar(no);
    if (legenda) no.appendChild(el("caption", null, legenda));
    var thead = el("thead"), tr = el("tr");
    cabecalho.forEach(function (c) { var th = el("th", null, c); th.scope = "col"; tr.appendChild(th); });
    thead.appendChild(tr); no.appendChild(thead);
    var tbody = el("tbody");
    linhas.forEach(function (l) {
      var r = el("tr");
      l.forEach(function (c, i) {
        var cel = el(i === 0 ? "th" : "td", null, c);
        if (i === 0) cel.scope = "row";
        r.appendChild(cel);
      });
      tbody.appendChild(r);
    });
    no.appendChild(tbody);
  }

  function resumo() {
    var t = estado.dados.totais;
    document.getElementById("heroi").textContent = inteiro(t.pessoas);
    var caixa = document.getElementById("indicadores");
    [[inteiro(t.domicilios), "domicílios"], [inteiro(t.setores) + " em " + inteiro(t.bairros), "setores censitários e bairros"],
     [inteiro(t.densidade), "pessoas por km² (média do município)"], [decimal(t.pessoas_por_domicilio, 2), "pessoas por domicílio (média)"]
    ].forEach(function (p) {
      var d = el("div", "indicador");
      d.appendChild(el("p", "valor", p[0]));
      d.appendChild(el("p", "rotulo", p[1]));
      caixa.appendChild(d);
    });
  }

  function educacao() {
    var e = estado.dados.educacao_infantil;
    if (!e) return;
    document.getElementById("bloco-edu").hidden = false;
    var redes = Object.keys(e.por_rede);
    document.getElementById("sub-edu").textContent = "Fonte: " + e.fonte + ".";
    desenharBarras(document.getElementById("barras-edu"), redes.map(function (r) {
      return { nome: REDES[r] || r, valor: e.por_rede[r].matriculas_creche };
    }), null);
    tabela(document.getElementById("tabela-edu"),
      ["Rede", "Escolas com educação infantil", "Com creche", "Matrículas em creche", "Turmas de creche", "Matrículas na pré-escola"],
      redes.map(function (r) {
        var x = e.por_rede[r];
        return [REDES[r] || r, inteiro(x.escolas_com_educacao_infantil), inteiro(x.escolas_com_creche), inteiro(x.matriculas_creche),
                inteiro(x.turmas_creche), inteiro(x.matriculas_pre_escola)];
      }), null);
    document.getElementById("nota-edu").textContent = e.aviso;
  }

  function rodape() {
    var m = estado.dados.meta, c = m.conferencia;
    document.getElementById("rodape-numeros").textContent =
      "Fonte: " + m.fonte + ". Gerado em " + m.gerado_em + ". Conferência com o IBGE: soma das pessoas " + inteiro(c.pessoas_somadas) +
      " (publicado: " + inteiro(c.pessoas_publicadas_ibge) + "); área " + decimal(c.area_somada_km2, 1) + " km² (publicado: " +
      decimal(c.area_publicada_ibge_km2, 1) + " km²).";
  }

  function iniciar(resultado) {
    estado.geo = resultado[0];
    estado.dados = resultado[1];
    document.getElementById("aviso").textContent = estado.dados.meta.aviso;
    resumo();
    desenharMapa();
    ligarDica();
    colorir();
    desenharBarras(document.getElementById("barras"), estado.dados.bairros.map(function (b) { return { nome: b.nome, valor: b.pessoas }; }),
      escolherBairro, function (i) { return i.nome + ": " + inteiro(i.valor) + " pessoas. Destacar no mapa."; });
    tabela(document.getElementById("tabela"),
      ["Bairro", "Pessoas", "Domicílios", "Setores", "Pessoas por km²", "Pessoas por domicílio"],
      estado.dados.bairros.map(function (b) {
        return [b.nome, inteiro(b.pessoas), inteiro(b.domicilios), inteiro(b.setores),
                b.densidade == null ? "–" : inteiro(b.densidade), b.pessoas_por_domicilio == null ? "–" : decimal(b.pessoas_por_domicilio, 2)];
      }), "População, domicílios e densidade por bairro (Censo 2022)");
    var sem = estado.dados.meta.sem_bairro;
    if (sem.setores) {
      document.getElementById("nota-bairros").textContent = "O IBGE não definiu bairro para " + inteiro(sem.setores) + " setores (" +
        inteiro(sem.pessoas) + " pessoas); eles aparecem como \"" + sem.rotulo + "\".";
    }
    educacao();
    rodape();
    var grupo = document.querySelector('input[name="metrica"]').closest("fieldset");
    Object.keys(estado.dados.distancia_ate_servico || {}).forEach(function (k) {
      var rotulo = el("label"), entrada = el("input");
      entrada.type = "radio"; entrada.name = "metrica"; entrada.value = "dist_" + k;
      rotulo.appendChild(entrada);
      rotulo.appendChild(document.createTextNode(" Distância até " + estado.dados.distancia_ate_servico[k].rotulo));
      grupo.appendChild(rotulo);
    });
    var pendentes = estado.dados.distancia_pendente || {}, chaves = Object.keys(pendentes);
    if (chaves.length) {
      var nota = document.getElementById("nota-dist-pendente");
      nota.hidden = false;
      nota.textContent = "Distância ainda não disponível: " + chaves.map(function (k) {
        var p = pendentes[k];
        return p.rotulo + " (só " + inteiro(p.localizados) + " de " + inteiro(p.cadastrados) + " estão localizados no mapa; o mínimo é " + inteiro(p.minimo_pct) + "%)";
      }).join("; ") + ". Com poucos serviços no mapa, a distância sairia errada: os que faltam estão em algum lugar.";
    }
    Array.prototype.forEach.call(document.querySelectorAll('input[name="metrica"]'), function (r) {
      r.addEventListener("change", function () { estado.metrica = r.value; colorir(); });
    });
    Array.prototype.forEach.call(document.querySelectorAll('input[name="area"]'), function (r) {
      r.addEventListener("change", function () { estado.area = r.value; aplicarArea(); });
    });
    document.getElementById("limpar").addEventListener("click", function () { if (estado.bairro) escolherBairro(estado.bairro); });
  }

  Promise.all([carregar("dados/setores.geojson"), carregar("dados/territorio.json")]).then(iniciar).catch(function (e) {
    var a = document.getElementById("aviso");
    a.textContent = "Não foi possível carregar os dados desta página (" + e.message + ").";
    a.className = "aviso erro";
  });
})();
