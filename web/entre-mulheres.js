/* Entre Mulheres: preparo do cadastro de uma mulher que quer oferecer um serviço a outras mulheres.
   Lógica pura (sem DOM, sem rede, sem armazenamento). O que ela digita vira um TEXTO com o termo de consentimento, que ela mesma
   copia, imprime ou envia pelo canal que a equipe definir. O site não recebe nem guarda nada, não verifica identidade
   e não concede selo nenhum. A oferta só é publicada depois que uma pessoa da equipe a confere. */
(function (raiz, fabrica) {
  if (typeof module === "object" && module.exports) module.exports = fabrica();
  else raiz.EntreMulheres = fabrica();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var LIMITES = { nome: [2, 80], descricao: [15, 200], atende: [2, 80], contato: [8, 80] };
  var CAMPOS = ["nome", "descricao", "atende", "contato"];

  function limpa(t) { return String(t == null ? "" : t).replace(/\s+/g, " ").trim(); }

  /* Dados que não devem ir num anúncio: CPF, RG, e-mail pessoal solto na descrição. (O contato escolhido, sim, é livre.) */
  function dadosSensiveis(texto) {
    var t = String(texto || ""), achados = [];
    if (/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/.test(t)) achados.push("parece haver um CPF");
    if (/\b\d{1,2}\.?\d{3}\.?\d{3}-?[\dxX]\b/.test(t)) achados.push("parece haver um RG");
    return achados;
  }

  function validar(d) {
    d = d || {};
    var dados = {}, erros = {};
    CAMPOS.forEach(function (c) {
      dados[c] = limpa(d[c]);
      var lim = LIMITES[c];
      if (!dados[c]) erros[c] = "Preencha este campo.";
      else if (dados[c].length < lim[0]) erros[c] = "Escreva um pouco mais (mínimo " + lim[0] + " letras).";
      else if (dados[c].length > lim[1]) erros[c] = "Use no máximo " + lim[1] + " letras.";
    });
    if (!erros.contato && !/\d{4}|@|instagram|facebook|\.com/i.test(dados.contato)) erros.contato = "Informe um telefone, WhatsApp ou rede social para as pessoas falarem com você.";
    ["nome", "descricao", "atende"].forEach(function (c) {
      var s = dadosSensiveis(dados[c]);
      if (!erros[c] && s.length) erros[c] = "Retire os dados pessoais (" + s.join(", ") + "). Anúncio não precisa disso.";
    });
    if (!d.mulher) erros.mulher = "Este espaço é só para mulheres: marque para confirmar.";
    if (!d.consentimento) erros.consentimento = "Sem a sua autorização, nada pode ser publicado.";
    return { ok: Object.keys(erros).length === 0, erros: erros, dados: dados };
  }

  function dataBr(iso) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ""); return m ? m[3] + "/" + m[2] + "/" + m[1] : ""; }

  /* O texto que ela entrega à equipe. Inclui o termo de consentimento e a data. */
  function montarCadastro(d, categoria, dataISO) {
    var v = validar(d);
    if (!v.ok) return null;
    var x = v.dados;
    return [
      "CADASTRO — ENTRE MULHERES (Mulher Resolve, Rio Claro)",
      "Categoria: " + categoria.titulo,
      "Nome ou nome do negócio: " + x.nome,
      "O que ofereço: " + x.descricao,
      "Bairro ou região que atendo: " + x.atende,
      "Contato que autorizo divulgar: " + x.contato,
      "",
      "Declaro que sou mulher e AUTORIZO a publicação dos dados acima, e somente deles, no site Mulher Resolve (estudo acadêmico, sem fins lucrativos). " +
        "Sei que o site não intermedeia pagamento nem conversa, que o contato é direto comigo e que posso pedir a retirada a qualquer momento.",
      "Data do consentimento: " + dataBr(dataISO)
    ].join("\n");
  }

  /* Canais de envio: só existem se a equipe os cadastrou em dados/entre_mulheres_canal.json. */
  function canalDisponivel(cfg) {
    cfg = cfg || {};
    return { whatsapp: /^\d{12,13}$/.test(String(cfg.whatsapp || "")) ? String(cfg.whatsapp) : null,
             email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(cfg.email || "")) ? String(cfg.email) : null };
  }
  function linkWhatsapp(numero, texto) { return numero ? "https://wa.me/" + numero + "?text=" + encodeURIComponent(texto) : null; }
  function linkEmail(email, texto) { return email ? "mailto:" + email + "?subject=" + encodeURIComponent("Cadastro Entre Mulheres") + "&body=" + encodeURIComponent(texto) : null; }

  return { LIMITES: LIMITES, CAMPOS: CAMPOS, validar: validar, dadosSensiveis: dadosSensiveis, montarCadastro: montarCadastro, canalDisponivel: canalDisponivel, linkWhatsapp: linkWhatsapp, linkEmail: linkEmail };
});
