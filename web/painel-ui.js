/* Tela do painel da Secretaria. Só LÊ um arquivo de dados já agregável (hoje: dados de teste) e desenha. Não grava nem envia nada. */
(function (raiz) {
  "use strict";
  var Q = raiz.Questionario, P = raiz.Painel;
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function carregar(url) { return fetch(url, { cache: "no-store" }).then(function (r) { if (!r.ok) throw new Error(url); return r.json(); }); }
  function fmt(n) { return n === null || n === undefined ? "menos de 10" : String(n); }

  /* Barras de uma só cor. O valor vem escrito ao lado (nada depende da cor). Alternativas com menos de 10 respostas ficam ocultas. */
  function barras(d, opcoes) {
    opcoes = opcoes || {};
    if (d.suprimida) return '<p class="meta">Menos de ' + P.K + " respostas para esta pergunta: não é exibida, para não identificar ninguém.</p>";
    var itens = d.itens.filter(function (i) { return !(opcoes.sem && opcoes.sem.indexOf(i.c) !== -1); });
    var maior = Math.max.apply(null, itens.map(function (i) { return i.pct || 0; }).concat([1]));
    return '<p class="meta">' + esc(d.texto) + " (" + d.respondentes + " respostas" + (d.tipo === "multi" ? "; podia marcar mais de uma" : "") + ")</p>" +
      '<ul class="barras">' + itens.map(function (i) {
        if (i.oculto) return '<li><div class="topo"><span>' + esc(i.r) + '</span><span class="oculto">menos de ' + P.K + " respostas</span></div></li>";
        return '<li><div class="topo"><span>' + esc(i.r) + "</span><strong>" + i.pct.toLocaleString("pt-BR") + "% (" + i.n + ')</strong></div><div class="trilho" role="img" aria-label="' + esc(i.r) + ": " + i.pct + '%"><span style="width:' + Math.round(100 * i.pct / maior) + '%"></span></div></li>';
      }).join("") + "</ul>";
  }

  function secao(titulo, intro, corpo) { return '<section class="painel-sec"><h2>' + esc(titulo) + "</h2>" + (intro ? '<p class="meta">' + intro + "</p>" : "") + corpo + "</section>"; }

  function tabelaRegioes(regs) {
    var g = P.indicesPorGrupo(regs, "regiao"), cods = Object.keys(g.grupos);
    if (!cods.length) return '<p class="meta">Nenhuma região tem 10 respostas ou mais.</p>';
    var cab = '<tr><th scope="col">Região de referência</th><th class="num" scope="col">Respostas</th>' + Q.DIMENSOES.map(function (d) { return '<th class="num" scope="col">' + esc(d.nome) + "</th>"; }).join("") + "</tr>";
    var linhas = cods.map(function (c) {
      var x = g.grupos[c];
      return '<tr><th scope="row">' + esc(x.rotulo) + '</th><td class="num">' + x.respondentes + "</td>" + Q.DIMENSOES.map(function (d) { var m = x.indices[d.id].media; return '<td class="num">' + (m === null ? "—" : m) + "</td>"; }).join("") + "</tr>";
    }).join("");
    return '<div class="tabela-rolavel"><table class="dados"><caption class="meta">Pontuação média (0 a 100) por tema. Quanto maior, mais o tema pesa.</caption><thead>' + cab + "</thead><tbody>" + linhas + "</tbody></table></div>" +
      (g.gruposEscondidos ? '<p class="meta">' + g.gruposEscondidos + " região(ões) com menos de " + P.K + " respostas não aparece(m).</p>" : "");
  }

  function tabelaIndices(regs) {
    var ind = P.indices(regs);
    return '<div class="tabela-rolavel"><table class="dados"><thead><tr><th scope="col">Tema</th><th class="num" scope="col">Pontuação média</th><th class="num" scope="col">Mulheres com o tema pesando muito</th><th class="num" scope="col">Respostas</th></tr></thead><tbody>' +
      Q.DIMENSOES.map(function (d) { var x = ind[d.id]; return "<tr><th scope=\"row\">" + esc(d.nome) + '</th><td class="num">' + (x.media === null ? "—" : x.media + " de 100") + '</td><td class="num">' + (x.alto === null ? "—" : x.alto.toLocaleString("pt-BR") + "%") + '</td><td class="num">' + fmt(x.n) + "</td></tr>"; }).join("") +
      '</tbody></table></div><p class="meta">“Pesando muito” = pontuação de ' + P.ALTO + " ou mais. Pergunta em branco não conta como “sem necessidade”.</p>";
  }

  function combinacoes(regs) {
    var c = P.combinacoes(regs), pares = P.paresDeTemas(regs);
    var topo = c.suprimido ? '<p class="meta">Poucas respostas para mostrar esta informação.</p>'
      : '<p><span class="cartao-num"><strong>' + c.pct.toLocaleString("pt-BR") + "%</strong>das mulheres com pelo menos dois temas pesando muito ao mesmo tempo (" + c.n + " de " + c.base + ")</span></p>";
    return topo + (pares.length ? '<p class="meta">Pares de temas que mais aparecem juntos:</p><ul class="barras">' + pares.slice(0, 5).map(function (x) {
      return '<li><div class="topo"><span>' + esc(x.par) + "</span><strong>" + x.n + "</strong></div><div class=\"trilho\"><span style=\"width:" + Math.round(100 * x.n / pares[0].n) + '%"></span></div></li>';
    }).join("") + "</ul>" : "");
  }

  function temasDoTexto(regs) {
    var t = P.temas(regs);
    if (t.suprimido) return '<p class="meta">Menos de ' + P.K + " mulheres usaram o espaço “Fale de você”: não é exibido.</p>";
    var maior = Math.max.apply(null, t.itens.map(function (i) { return i.pct || 0; }).concat([1]));
    return '<p class="meta">' + t.base + " mulheres escreveram no espaço “Fale de você”. O painel mostra só os <strong>assuntos</strong> que o aparelho de cada uma identificou; <strong>nenhum texto chega até aqui</strong>, e violência nunca é registrada a partir de um texto.</p><ul class=\"barras\">" + t.itens.map(function (i) {
      if (i.n === null) return '<li><div class="topo"><span>' + esc(i.rotulo) + '</span><span class="oculto">menos de ' + P.K + " respostas</span></div></li>";
      return '<li><div class="topo"><span>' + esc(i.rotulo) + "</span><strong>" + i.pct.toLocaleString("pt-BR") + "% (" + i.n + ')</strong></div><div class="trilho"><span style="width:' + Math.round(100 * i.pct / maior) + '%"></span></div></li>';
    }).join("") + "</ul>";
  }

  function evolucao(regs) {
    var s = P.serie(regs);
    return '<ul class="barras">' + s.map(function (m) { var maior = Math.max.apply(null, s.map(function (x) { return x.n || 0; }).concat([1]));
      return '<li><div class="topo"><span>' + esc(m.periodo) + "</span><strong>" + fmt(m.n) + ' respostas</strong></div><div class="trilho"><span style="width:' + (m.n ? Math.round(100 * m.n / maior) : 0) + '%"></span></div></li>'; }).join("") + "</ul>" +
      '<p class="meta">Com poucos meses de dados, não dá para falar em tendência.</p>';
  }

  function territorial(t) {
    if (!t) return '<p class="status">A análise territorial <strong>ainda não foi gerada</strong>. Ela precisa da localização dos serviços (CEP) e roda com <code>python pipeline/analise_territorial.py</code>. Enquanto isso, nenhum número territorial é mostrado.</p>';
    var cob = t.meta.cobertura_dos_servicos || {}, nomes = { cras: "CRAS", ubs: "UBS", escola: "Escola municipal" };
    var cols = Object.keys(nomes).filter(function (c) { return cob[c] && cob[c].com_coordenada > 0; });
    var cabecalho = cols.map(function (c) { return '<th class="num" scope="col">Distância média até a ' + (c === "cras" ? "CRAS" : c === "ubs" ? "UBS" : "escola municipal") + " mais próxima</th>"; }).join("");
    var ordem = cols.length ? "distancia_media_" + cols[0] + "_km" : null;
    var linhas = t.bairros.slice().sort(function (a, b) { return ordem ? (b[ordem] || 0) - (a[ordem] || 0) : b.pessoas - a.pessoas; }).map(function (b) {
      return '<tr><th scope="row">' + esc(b.bairro) + '</th><td class="num">' + b.pessoas.toLocaleString("pt-BR") + "</td>" + cols.map(function (c) { var v = b["distancia_media_" + c + "_km"]; return '<td class="num">' + (v == null ? "—" : v.toLocaleString("pt-BR") + " km") + "</td>"; }).join("") + '<td class="num">' + b.servicos_no_bairro + "</td></tr>";
    }).join("");
    var cobertura = Object.keys(nomes).map(function (c) { return nomes[c] + ": " + (cob[c] ? cob[c].com_coordenada + " de " + cob[c].cadastrados + " localizados" : "—"); }).join("; ");
    return '<p class="meta"><strong>Cobertura:</strong> ' + esc(cobertura) + ". Só entram as categorias com serviços localizados.</p>" +
      '<div class="tabela-rolavel"><table class="dados"><thead><tr><th scope="col">Bairro (IBGE)</th><th class="num" scope="col">Pessoas (Censo 2022)</th>' + cabecalho + '<th class="num" scope="col">Serviços cadastrados no bairro</th></tr></thead><tbody>' + linhas + "</tbody></table></div>" +
      '<p class="meta">' + esc(t.meta.aviso || "") + "</p>";
  }

  function montar(dados, terr) {
    var regs = dados.registros, cov = P.cobertura(regs);
    var html = secao("Quem respondeu", "Mostrar quem respondeu evita tratar respostas voluntárias como o retrato de todas as mulheres da cidade.",
      '<p><span class="cartao-num"><strong>' + fmt(cov.total) + "</strong>respostas de mulheres com 18 anos ou mais que autorizaram o uso</span></p>" + barras(cov.idade, { sem: ["m18"] }) + barras(cov.regiao));
    html += secao("O que as mulheres mais procuram", "Prioridade escolhida pela própria mulher.", barras(P.distribuicao(regs, "prioridade_area")) + barras(P.distribuicao(regs, "resultado_6m")) + barras(P.distribuicao(regs, "areas_info"), { sem: ["nenhuma"] }));
    html += secao("O que impede a autonomia econômica", "Obstáculos que as mulheres apontam para trabalhar, estudar, cuidar da família e se deslocar.",
      barras(P.distribuicao(regs, "obstaculos_trabalho"), { sem: ["nenhum", "nao_se_aplica"] }) + barras(P.distribuicao(regs, "obstaculos_estudo"), { sem: ["nada", "nao_se_aplica"] }) + barras(P.distribuicao(regs, "cuidado_rotina")) + barras(P.distribuicao(regs, "transporte_freq")));
    html += secao("Onde falta informação", "Quanto as mulheres conseguem achar e usar os serviços públicos.", barras(P.distribuicao(regs, "informacao")) + barras(P.distribuicao(regs, "sabe_procurar")));
    html += secao("Pontuação por tema", "Resumo do que pesa na vida das mulheres que responderam, em média.", tabelaIndices(regs) + "<h3>Por região de referência</h3>" + tabelaRegioes(regs));
    html += secao("Necessidades combinadas", "Quantas mulheres enfrentam vários obstáculos ao mesmo tempo: o argumento para políticas integradas.", combinacoes(regs));
    html += secao("O que as mulheres contaram sobre si", "Assuntos identificados no espaço opcional “Fale de você”.", temasDoTexto(regs));
    html += secao("Evolução", "", evolucao(regs));
    html += secao("Análise territorial", "Cruza a população de cada bairro (IBGE) com a localização dos serviços.", territorial(terr));
    html += secao("Como ler este painel", "", '<ul><li><strong>Origem:</strong> respostas voluntárias ao questionário do Observatório da Mulher, sem nome. Neste protótipo, <strong>dados de teste</strong> gerados por computador.</li>' +
      "<li><strong>Período:</strong> " + esc(regs.map(function (r) { return r.periodo; }).filter(Boolean).sort()[0] || "") + " a " + esc(regs.map(function (r) { return r.periodo; }).filter(Boolean).sort().slice(-1)[0] || "") + ".</li>" +
      "<li><strong>Privacidade:</strong> nenhum número de grupo com menos de " + P.K + " respostas é mostrado.</li>" +
      "<li><strong>Limites:</strong> quem responde não é uma amostra aleatória da cidade e não inclui quem não usa o site. Os números <strong>não são estatística representativa</strong> de todas as mulheres de Rio Claro, a pontuação é provisória, e <strong>nada aqui é diagnóstico nem avaliação de risco individual</strong>.</li>" +
      "<li><strong>Uso:</strong> apoiar o planejamento. Não deve ser usado para negar serviços nem para classificar mulheres.</li></ul>");
    return html;
  }

  function iniciar() {
    var saida = document.getElementById("painel-saida");
    Promise.all([carregar("dados/painel_teste.json"), carregar("dados/analise_territorial.json").catch(function () { return null; })]).then(function (r) {
      if (r[0].meta && r[0].meta.dados_de_teste) document.getElementById("faixa-teste").hidden = false; else document.getElementById("faixa-teste").hidden = true;
      saida.innerHTML = montar(r[0], r[1]);
    }).catch(function () { saida.innerHTML = '<p class="vazio">Não foi possível carregar os dados do painel.</p>'; });
  }
  iniciar();
})(typeof self !== "undefined" ? self : this);
