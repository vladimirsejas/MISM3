/* Explicação por IA (Gemini), OPCIONAL e desligada por padrão. Só funciona quando o site é aberto pelo servidor local
   (pipeline/servidor_ia.py) com chave no .env: é ele que guarda a chave e fala com o Google. Em qualquer outro caso
   (site estático, sem chave, Google fora do ar) as funções devolvem "indisponível" e a tela mostra só o orientador de sempre.
   A IA não escolhe serviço: ela só reescreve, em linguagem simples, os serviços que o orientador já encontrou.
   Nunca é chamada quando há sinal de perigo (perigo.js): nesse caso vale só o alerta com os telefones. */
(function (raiz, fabrica) {
  if (typeof module === "object" && module.exports) module.exports = fabrica();
  else raiz.MISM3LLM = fabrica();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; });
  }

  /* Pergunta ao servidor local se a IA está ligada. Em hospedagem estática a resposta não é JSON: vira "não". */
  function disponivel(buscar) {
    return buscar("api/ia/estado", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : { disponivel: false }; })
      .then(function (j) { return !!(j && j.disponivel === true); })
      .catch(function () { return false; });
  }

  /* Só chama a IA se a pessoa marcou a opção, há serviços encontrados e NÃO há sinal de perigo (nem discreto). */
  function deveChamar(r, ligado) {
    return !!(ligado && r && !r.saudacao && !r.geral && !r.perigo && r.itens && r.itens.length);
  }

  /* Reduz os destinos do orientador ao que a IA precisa saber: nome, resumo e contato. Nada além disso é enviado. */
  function servicosDe(itens) {
    return (itens || []).filter(function (it) { return it && it.titulo; }).slice(0, 4).map(function (it) {
      var c = it.contato || {};
      return { titulo: it.titulo, resumo: it.resumo || "", telefone: c.telefone || "", endereco: c.endereco || "", horario: c.horario || "" };
    });
  }

  /* Devolve a explicação (texto) ou null, sem nunca rejeitar: qualquer falha vira "sem explicação". */
  function pedir(buscar, texto, itens) {
    var servicos = servicosDe(itens);
    if (!servicos.length) return Promise.resolve(null);
    return buscar("api/ia", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ texto: texto, servicos: servicos }) })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { return j && j.ok && typeof j.texto === "string" && j.texto.trim() ? j.texto.trim() : null; })
      .catch(function () { return null; });
  }

  function html(texto) {
    var paragrafos = String(texto).split(/\n{2,}/).map(function (p) { return "<p>" + esc(p.trim()).replace(/\n/g, "<br>") + "</p>"; }).join("");
    return '<p class="meta">Explicação escrita por IA (Gemini). Ela pode errar: confira os dados nos cartões acima.</p>' + paragrafos;
  }
  function htmlEspera() { return '<p class="meta">Escrevendo uma explicação com IA…</p>'; }
  function htmlFalha() { return '<p class="meta">Não consegui escrever a explicação com IA agora. As sugestões acima continuam valendo.</p>'; }

  return { disponivel: disponivel, deveChamar: deveChamar, servicosDe: servicosDe, pedir: pedir, html: html, htmlEspera: htmlEspera, htmlFalha: htmlFalha, esc: esc };
});
