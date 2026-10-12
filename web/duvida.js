/* Caixa de dúvida de cada área: a mulher escreve uma pergunta com as próprias palavras e o sistema mostra, NA PRÓPRIA PÁGINA, os
   trechos que respondem (seções, cartões de contato, textos e serviços cadastrados), com um botão para ir até eles.
   Não usa modelo de linguagem: só procura no conteúdo que já foi revisado e tem fonte. Por isso não inventa serviço, vaga, direito
   nem prazo. Se não achar, diz que não achou. A pergunta é lida e descartada NO APARELHO (nada é enviado nem gravado).
   Lógica pura (sem DOM, sem rede). A tela está em app.js. */
(function (raiz, fabrica) {
  if (typeof module === "object" && module.exports) module.exports = fabrica(require("./necessidades.js"));
  else raiz.Duvida = fabrica(raiz.MISM3Necessidades);
})(typeof self !== "undefined" ? self : this, function (Regras) {
  "use strict";

  /* Palavras de ligação que não ajudam a achar nada. */
  var PARADAS = {};
  ("a o as os um uma uns umas de da do das dos em na no nas nos por para pra com sem sobre entre ate ao aos e ou mas que se sou sao " +
   "ser estou esta estao foi fui vai vou ter tenho tem tinha minha meu minhas meus sua seu suas seus como qual quais quando onde " +
   "quem porque preciso precisa quero quer queria posso pode fazer faco faz saber aqui ali la isso isto esse essa esses essas " +
   "muito muita mais menos ja nao sim tambem so ainda eu voce me te lhe nos ela ele eles elas dele dela ver tem ha hoje agora " +
   "gostaria algum alguma alguns algumas coisa coisas ajuda ajudar").split(" ").forEach(function (p) { PARADAS[p] = 1; });

  /* Formas que significam o mesmo (gênero e plural) viram uma só; o resto usa os 5 primeiros caracteres (crech(e/es), matric(ula/ular)). */
  function raizDa(p) {
    if (/^filh[oa]s?$/.test(p)) return "filho";
    if (/^(bebe|bebes|bebezinho|bebezinha)$/.test(p)) return "bebe";
    if (/^(maes?|mamae)$/.test(p)) return "mae";
    return p.length > 5 ? p.slice(0, 5) : p;
  }
  function fichas(texto) {
    return Regras.normalizar(texto).split(" ").filter(function (p) { return p.length >= 3 && !PARADAS[p]; }).map(raizDa);
  }

  /* Pontes de vocabulário: como a pessoa fala -> como as páginas escrevem. Curtas e revisadas; só ligam palavras a assuntos que
     JÁ existem nas áreas (nenhuma cria um serviço novo). Cada entrada vale para qualquer palavra que comece pela chave. */
  var PONTES = {};
  function ponte(palavras, alternativas) {
    var alts = fichas(alternativas);
    palavras.split(" ").forEach(function (w) { PONTES[raizDa(Regras.normalizar(w))] = alts; });
  }
  ponte("comida fome alimento alimentos passando necessidade", "cesta basica beneficio cras familia");
  ponte("luz eletrica energia conta contas", "energia tarifa social");
  ponte("agua esgoto", "agua tarifa social");
  ponte("advogado advogada processo juridico", "defensoria orientacao juridica direitos");
  ponte("pensao alimenticia guarda divorcio separar separacao", "defensoria pensao guarda separacao");
  ponte("denunciar denuncia abandono negligencia maus tratos", "conselho tutelar creas disque violacao");
  ponte("graca gratis gratuito gratuita", "gratuito gratuita");
  ponte("emprego trabalho serviço servico vaga vagas", "trabalho emprego pat vaga");
  ponte("curriculo curriculum cv", "curriculo plano trabalho emprego");
  ponte("creche matricula matricular vaga vagas", "creche matricula vaga escola educacao infantil");
  ponte("psicologo psicologa psiquiatra terapia ansiedade depressao", "psicologico caps saude mental atencao psicossocial");
  ponte("remedio medicamento", "farmacia saude unidade");
  ponte("viciado viciada vicio droga drogas alcool bebe bebado crack", "drogas alcool caps ajuda mutua apoio");
  ponte("bairro endereco moro", "bairro cras regiao");

  function recortar(texto, max) {
    var t = String(texto || "").replace(/\s+/g, " ").trim();
    if (t.length <= max) return t;
    var corte = t.lastIndexOf(" ", max);
    return t.slice(0, corte > max * 0.6 ? corte : max).replace(/[,;:\s]+$/, "") + "…";
  }

  /* Monta os documentos pesquisáveis de uma área. `nomesPorSecao[i]` = nomes dos serviços cadastrados que a seção i mostra. */
  function indexar(area, nomesPorSecao, extras) {
    var docs = [];
    function adicionar(d) {
      var peso = [].concat(fichas(d.rotulo), fichas(d.rotulo), fichas(d.rotulo), fichas(d.corpo || ""));
      if (!peso.length) return;
      d.fichas = peso; docs.push(d);
    }
    (area.guia && area.guia.itens || []).forEach(function (g) {
      if (g.ancora) adicionar({ ancora: g.ancora, rotulo: g.titulo, pai: g.titulo, corpo: g.texto, trecho: g.texto });
    });
    (area.secoes || []).forEach(function (sec, i) {
      var ancora = sec.ancora || ("secao-" + (i + 1));
      var nomes = (nomesPorSecao && nomesPorSecao[i]) || [];
      var links = (sec.links || []).map(function (l) { return l[0]; });
      adicionar({ ancora: ancora, rotulo: sec.titulo, pai: sec.titulo, corpo: [sec.descricao].concat(links, nomes).join(" "), trecho: sec.descricao || "" });
      (sec.canais || []).forEach(function (c) {
        var topicos = (c.topicos || []).map(function (t) { return t[0] + " " + t[1]; });
        adicionar({ ancora: ancora, rotulo: c.nome, pai: sec.titulo, corpo: [c.texto].concat(topicos).join(" "), trecho: c.texto || "", topicos: c.topicos || [] });
      });
      nomes.forEach(function (n) { adicionar({ ancora: ancora, rotulo: n, pai: sec.titulo, corpo: "", trecho: "" }); });
    });
    (extras || []).forEach(function (e) { adicionar({ ancora: e.ancora, rotulo: e.rotulo, pai: e.rotulo, corpo: e.corpo || "", trecho: e.trecho || "" }); });
    var df = {};
    docs.forEach(function (d) { var vistos = {}; d.fichas.forEach(function (f) { if (!vistos[f]) { vistos[f] = 1; df[f] = (df[f] || 0) + 1; } }); });
    return { docs: docs, df: df, n: docs.length };
  }

  /* Pergunta -> até `max` trechos da própria página, do mais para o menos relacionado. Sem acerto confiável, lista vazia.
     Cada palavra da pergunta vale por si e pelas suas pontes de vocabulário. Palavras que não aparecem em lugar nenhum da página
     pesam contra: se a palavra principal da pergunta não existe aqui, o sistema não finge que respondeu. */
  function buscar(indice, pergunta, max) {
    var q = fichas(pergunta).filter(function (f, i, a) { return a.indexOf(f) === i; });
    if (!q.length || !indice || !indice.n) return [];
    var idf = function (f) { return Math.log(1 + indice.n / (1 + (indice.df[f] || 0))); };
    /* A ponte só vale quando a palavra da pessoa NÃO existe na página ("comida" -> cesta básica); se existe, vale ela mesma. */
    var alternativas = q.map(function (f) { return [f].concat(indice.df[f] ? [] : (PONTES[f] || [])); });
    var peso = q.map(function (f, k) { return Math.max.apply(null, alternativas[k].map(idf)); });
    var total = peso.reduce(function (a, b) { return a + b; }, 0);
    var pontuados = indice.docs.map(function (d) {
      var contagem = {}; d.fichas.forEach(function (f) { contagem[f] = (contagem[f] || 0) + 1; });
      var soma = 0, coberto = 0, achadas = [];
      alternativas.forEach(function (alts, k) {
        var melhor = 0, qual = null;
        alts.forEach(function (a, n) {
          if (!contagem[a]) return;
          var v = idf(a) * (1 + Math.log(contagem[a])) * (n === 0 ? 1 : 0.8);
          if (v > melhor) { melhor = v; qual = a; }
        });
        if (qual) { soma += melhor; coberto += peso[k]; achadas.push(qual); }
      });
      return { doc: d, cobertura: total ? coberto / total : 0, achadas: achadas, pontos: achadas.length ? soma / Math.sqrt(d.fichas.length) : 0 };
    }).filter(function (p) { return p.achadas.length > 0; });
    if (!pontuados.length) return [];
    pontuados.sort(function (a, b) { return b.pontos - a.pontos; });
    var topo = pontuados[0];
    if (q.length >= 2 && topo.cobertura < 0.45) return [];
    var saida = [], vistas = {};
    pontuados.forEach(function (p) {
      var chave = p.doc.ancora + "|" + p.doc.rotulo;
      if (saida.length >= (max || 3) || p.pontos < topo.pontos * 0.55 || vistas[chave]) return;
      vistas[chave] = 1;
      var trecho = p.doc.trecho;
      (p.doc.topicos || []).some(function (t) {
        var f = fichas(t[0] + " " + t[1]);
        if (p.achadas.some(function (a) { return f.indexOf(a) !== -1; })) { trecho = t[0] + ": " + t[1]; return true; }
        return false;
      });
      saida.push({ ancora: p.doc.ancora, rotulo: p.doc.rotulo, pai: p.doc.pai, trecho: recortar(trecho, 190), pontos: p.pontos });
    });
    return saida;
  }

  return { fichas: fichas, indexar: indexar, buscar: buscar, recortar: recortar };
});
