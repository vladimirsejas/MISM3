/* Tela do orientador: junta a camada de segurança (perigo.js) e o motor de busca (orientar.js) e desenha a resposta.
   Serve a tela inicial ("Conte com suas palavras") e a caixa de dúvida de cada área: uma só lógica, duas entradas.
   O índice (~500 KB) só é baixado quando a pessoa começa a escrever. O texto nunca sai do aparelho. */
(function (raiz, fabrica) {
  if (typeof module === "object" && module.exports) module.exports = fabrica();
  else raiz.OrientacaoUI = fabrica();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; });
  }

  var NOME_AREA = {};
  function nomeDaArea(id) { return NOME_AREA[id] || id; }
  function lembrarAreas(lista) { (lista || []).forEach(function (a) { NOME_AREA[a.id] = a.nome; }); }

  var motor = null, promessa = null;
  /* "Dica" de intenção: probabilidades do classificador treinado (ia.js) + as categorias que as regras reconhecem com certeza (piso 0,9).
     A avaliação (avaliacao/sistema_v2.js) usa esta mesma função, para medir exatamente o que a tela usa. */
  function criarDica(IA, Regras) {
    return function (texto) {
      var p = Object.assign({}, (IA && IA.probabilidades && IA.probabilidades(texto)) || {});
      Regras.identificarCategorias(texto, 9).forEach(function (c) { p[c] = Math.max(p[c] || 0, 0.9); });
      return p;
    };
  }

  /* buscar(url) -> Promise<json>. */
  function preparar(buscar, IA, Regras) {
    if (motor) return Promise.resolve(motor);
    if (promessa) return promessa;
    /* O detector de perigo é opcional: se não carregar, valem só as regras de perigo.js. */
    var detector = buscar("dados/modelo_perigo.json").then(function (m) { Perigo.usarModelo(m); }, function () { /* só regras */ });
    promessa = Promise.all([buscar("dados/indice_orientacao.json"), detector]).then(function (r) {
      motor = Orientar.criar(r[0], { dica: criarDica(IA, Regras) });
      return motor;
    });
    promessa.catch(function () { promessa = null; });
    return promessa;
  }

  function telHref(tel) {
    var m = /\(?(\d{2})\)?\s*(9?\s?\d{4})[-\s]?(\d{4})/.exec(String(tel || ""));
    return m ? "tel:+55" + m[1] + (m[2] + m[3]).replace(/\s/g, "") : null;
  }
  function dataBr(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ""));
    return m ? m[3] + "/" + m[2] + "/" + m[1] : "";
  }

  function htmlPerigo(p) {
    if (!p) return "";
    var tels = p.telefones.map(function (n) { return '<a class="tel-grande" href="tel:' + esc(n) + '">' + esc(n) + "</a>"; }).join(" · ");
    if (p.nivel === 1) {
      var t1 = p.telefones.map(function (n) { return '<a href="tel:' + esc(n) + '">' + esc(n) + "</a>"; }).join(" · ");
      return '<p class="status" role="note">' + p.mensagens.map(esc).join(" ") + " " + t1 + ". Você pode usar também o botão “Em perigo agora?” no alto da página.</p>";
    }
    return '<div class="status urgente" role="alert">' + p.mensagens.map(function (m) { return "<p><strong>" + esc(m) + "</strong></p>"; }).join("") +
      '<p class="orientacao-tels">' + tels + "</p></div>";
  }

  /* um destino: título, o que é, contato quando houver, por que apareceu e para onde ir.
     ctx.area = área aberta no momento: destinos dela viram "Ver na página" (rola até a seção) em vez de link. */
  function htmlItem(it, ctx) {
    var c = it.contato, partes = [];
    if (c && c.telefone) { var h = telHref(c.telefone); partes.push(h ? '<a class="tel" href="' + esc(h) + '">' + esc(c.telefone) + "</a>" : esc(c.telefone)); }
    if (c && c.endereco) partes.push(esc(c.endereco));
    if (c && c.horario) partes.push(esc(c.horario));
    var conf = it.fonte && /^\d{4}-/.test(it.fonte.verificado_em || "") ? '<span class="meta">Conferido em ' + esc(dataBr(it.fonte.verificado_em)) + "</span>" : "";
    var porque = it.palavras && it.palavras.length ? '<span class="meta">Apareceu por causa de: ' + it.palavras.map(function (w) { return "“" + esc(w) + "”"; }).join(", ") + "</span>" : "";
    var naArea = ctx && ctx.area && it.area === ctx.area && it.sec;
    var ir = naArea
      ? '<button type="button" class="btn-rolar" data-rolar="' + esc(it.sec) + '">Ver na página</button>'
      : '<a class="btn-rolar" href="' + esc(it.href) + '">Abrir ' + (it.tipo === "area" ? "a área" : "em " + esc(nomeDaArea(it.area))) + "</a>";
    return '<li><strong>' + esc(it.titulo) + "</strong>" + (it.resumo ? "<p>" + esc(it.resumo) + "</p>" : "") +
      (partes.length ? '<p class="orientacao-contato">' + partes.join(" · ") + "</p>" : "") + conf + porque + "<div>" + ir + "</div></li>";
  }

  function htmlPortas(areas) {
    return '<ul class="duvida-lista">' + areas.map(function (a) {
      return '<li><a href="#' + esc(a.id) + '"><strong>' + esc(a.nome) + "</strong></a>" + (a.resumo ? "<p>" + esc(a.resumo) + "</p>" : "") + "</li>";
    }).join("") + "</ul>";
  }

  /* r = resultado de motor.responder. areas = [{id,nome,resumo}] para a saída "não entendi", que nunca deixa a mulher sem caminho. */
  function html(r, ctx, areas) {
    var h = htmlPerigo(r.perigo);
    if (r.saudacao) {
      return h + '<p class="status" role="note">Olá! Conte o que você precisa, do seu jeito. Por exemplo: “preciso de vaga na creche”, “estou sem renda” ou “quero fazer um curso”.</p>';
    }
    if (r.itens.length) {
      var titulo = r.geral ? "Escolha por onde começar:" : (r.perigo && r.perigo.nivel === 2 ? "Estes serviços podem ajudar agora:" : "O que encontramos para você:");
      h += '<p class="meta">' + titulo + '</p><ul class="duvida-lista orientacao-lista">' + r.itens.map(function (it) { return htmlItem(it, ctx); }).join("") + "</ul>";
      h += '<p class="meta">Isto é uma sugestão automática e pode errar. Confirme horário e vaga por telefone com o serviço.</p>';
      return h;
    }
    h += '<p class="status" role="note">Não consegui ligar o que você escreveu a um serviço da nossa lista. Isso não quer dizer que não exista ajuda: tente escrever de outro jeito (por exemplo, “preciso de remédio” ou “quero estudar à noite”) ou escolha uma área abaixo. Se for urgente, ligue 190, 192 ou 180.</p>';
    if (areas && areas.length) h += htmlPortas(areas);
    return h;
  }

  return { preparar: preparar, criarDica: criarDica, html: html, htmlItem: htmlItem, htmlPerigo: htmlPerigo, lembrarAreas: lembrarAreas, telHref: telHref, esc: esc };
});
