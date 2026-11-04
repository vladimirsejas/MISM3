/* Tela da análise territorial (vista #painel do dashboard). Só LÊ dados/analise_territorial.json, gerado por
   pipeline/analise_territorial.py a partir de dados públicos (IBGE) e do catálogo de serviços, e desenha. Não grava nem envia nada.
   Antes de 04/11/2026 esta tela também mostrava um painel de respostas de questionário; o questionário foi retirado do projeto. */
(function (raiz) {
  "use strict";
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function carregar(url) { return fetch(url, { cache: "no-store" }).then(function (r) { if (!r.ok) throw new Error(url); return r.json(); }); }

  function secao(titulo, intro, corpo) { return '<section class="painel-sec"><h2>' + esc(titulo) + "</h2>" + (intro ? '<p class="meta">' + intro + "</p>" : "") + corpo + "</section>"; }

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

  function comoLer() {
    return secao("Como ler esta tela", "", "<ul><li><strong>Origem:</strong> população por setor censitário (IBGE, Censo 2022) e localização dos serviços do catálogo verificado. Nenhum dado de pessoa entra nesta tela.</li>" +
      "<li><strong>Limites:</strong> as distâncias são aproximações e <strong>não provam falta de serviço</strong>; ausência de dado não é ausência de serviço.</li>" +
      "<li><strong>Uso:</strong> apoiar o planejamento. Não deve ser usado para negar serviços nem para classificar mulheres.</li></ul>");
  }

  function iniciar() {
    var saida = document.getElementById("painel-saida");
    carregar("dados/analise_territorial.json").catch(function () { return null; }).then(function (t) {
      saida.innerHTML = secao("Distância dos bairros aos serviços", "", territorial(t)) + comoLer();
    });
  }
  iniciar();
})(typeof self !== "undefined" ? self : this);
