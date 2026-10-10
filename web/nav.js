/* Menu e rodape COMPARTILHADOS: uma unica lista para todas as paginas (antes era copiada a mao em cada HTML).
   Saude e lazer ficam em primeiro plano; secretarias e paineis de gestao ficam no rodape ("Mais"). */
(function () {
  "use strict";
  var MENU = [
    { href: "index.html", rotulo: "Início" },
    { href: "saude.html", rotulo: "Saúde" },
    { href: "lazer.html", rotulo: "Lazer" },
    { href: "rede-mulheres.html", rotulo: "De mulher para mulher" },
    { href: "gestao.html", rotulo: "Gestão", tambem: ["inteligencia-publica.html"] }
  ];
  var MAIS = [
    { href: "secretarias.html", rotulo: "Secretarias e telefones úteis" },
    { href: "gestao.html", rotulo: "Painel de gestão (protótipo)" },
    { href: "inteligencia-publica.html", rotulo: "Inteligência pública (protótipo)" }
  ];
  var atual = (window.location.pathname.split("/").pop() || "index.html").toLowerCase();

  function ehAtual(item) { return item.href === atual || (item.tambem || []).indexOf(atual) !== -1; }

  var menu = document.querySelector("[data-menu]");
  if (menu) {
    menu.innerHTML = MENU.map(function (m) {
      return '<a href="' + m.href + '"' + (ehAtual(m) ? ' aria-current="page"' : "") + ">" + m.rotulo + "</a>";
    }).join("");
  }

  var rodape = document.querySelector("footer.rodape");
  if (!rodape) { rodape = document.createElement("footer"); rodape.className = "rodape"; document.body.appendChild(rodape); }
  var mais = document.createElement("nav");
  mais.className = "rodape-links";
  mais.setAttribute("aria-label", "Mais páginas");
  mais.innerHTML = "<strong>Mais:</strong> " + MAIS.map(function (m) {
    return '<a href="' + m.href + '"' + (m.href === atual ? ' aria-current="page"' : "") + ">" + m.rotulo + "</a>";
  }).join(" · ");
  rodape.insertBefore(mais, rodape.firstChild);
})();
