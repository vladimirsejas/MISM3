/* "Escreva o que precisa e abrimos as portas": palavra -> necessidade -> grupos de servicos.
   Roda no navegador. O texto digitado NAO e enviado nem gravado. So mostra o que o cadastro tem;
   onde nao ha cadastro, diz isso (ausencia de dado nao e ausencia de servico). */
(function (raiz, fabrica) {
  if (typeof module === "object" && module.exports) module.exports = fabrica();
  else raiz.Necessidades = fabrica();
})(typeof self !== "undefined" ? self : this, function () {
  /* tipos = grupos de Acesso.ORDEM a destacar, na ordem. objetivo = filtro da trilha de autonomia (Recomendar). */
  var LISTA = [
    { id: "violencia", rotulo: "Violência / estou em perigo", urgente: true,
      palavras: ["violencia", "agressao", "agredida", "apanho", "ameaca", "ameacada", "medo", "abuso", "estupro", "importunacao", "perseguicao", "maria da penha"],
      tipos: ["mulher", "assistencia", "saude"],
      aviso: "Em perigo agora: ligue 190 (polícia) ou 192 (SAMU). Violência contra a mulher: Ligue 180, 24 horas, gratuito. Você não precisa se identificar para pedir orientação." },
    { id: "casamento", rotulo: "Casamento, separação, guarda, pensão",
      palavras: ["casamento", "casada", "separacao", "separar", "divorcio", "guarda", "pensao", "marido", "companheiro", "uniao estavel", "namorado"],
      tipos: ["mulher", "assistencia"],
      aviso: "Para divórcio, guarda e pensão normalmente é preciso orientação jurídica gratuita (Defensoria Pública) ou advogado. Ainda não cadastramos esse serviço: pergunte à Secretaria da Mulher, abaixo. Se há violência no relacionamento, use também “Violência”." },
    { id: "familia", rotulo: "Família e assistência social",
      palavras: ["familia", "cras", "creas", "cadunico", "cad unico", "bolsa familia", "cesta basica", "alimento", "fome", "beneficio", "aluguel", "assistencia"],
      tipos: ["assistencia", "mulher"] },
    { id: "filhos", rotulo: "Filhos e cuidado infantil",
      palavras: ["filho", "filhos", "filha", "crianca", "criancas", "bebe", "creche", "berçario", "bercario", "deixar meu filho", "matricula", "gravida", "gestante"],
      tipos: ["creche", "educacao_infantil", "saude", "assistencia"],
      aviso: "O cadastro mostra onde há escolas e creches, não se há vaga. Confirme com a Secretaria de Educação." },
    { id: "saude", rotulo: "Saúde",
      palavras: ["saude", "medico", "doente", "ubs", "posto de saude", "hospital", "upa", "pronto socorro", "remedio", "consulta", "psicologo", "ansiedade", "depressao", "caps", "vacina", "exame"],
      tipos: ["saude"] },
    { id: "emprego", rotulo: "Emprego e renda", objetivo: "trabalhar",
      palavras: ["emprego", "trabalho", "trabalhar", "vaga", "vagas", "curriculo", "renda", "dinheiro", "desempregada", "concurso", "pat", "conecta", "empreender", "negocio", "credito", "microempreendedora"],
      tipos: ["emprego_curso"] },
    { id: "estudo", rotulo: "Estudo e cursos", objetivo: "curso",
      palavras: ["estudo", "estudar", "curso", "cursos", "qualificacao", "capacitacao", "aprender", "faculdade", "eja", "supletivo", "escola", "formacao"],
      tipos: ["emprego_curso", "educacao_infantil"],
      aviso: "Hoje o cadastro tem os Centros de Qualificação do Fundo Social. Não temos ainda a lista de turmas abertas nem de EJA." },
    { id: "transporte", rotulo: "Ônibus e transporte",
      palavras: ["transporte", "onibus", "horario", "linha", "terminal", "tarifa", "passagem", "como chegar"],
      tipos: [],
      aviso: "Ainda não mostramos horários aqui: eles não foram conferidos. A fonte oficial do transporte coletivo é a SOU Transportes.",
      links: [{ texto: "Linhas e horários (SOU Transportes)", url: "https://soutransportes.com.br/rio-claro/" }] }
  ];

  function normalizar(t) {
    return String(t == null ? "" : t).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
      .replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
  }

  /* Texto livre -> necessidades que casam. Urgente (violencia) sempre primeiro. Casa palavra inteira ou frase. */
  function identificar(texto) {
    var t = " " + normalizar(texto) + " ";
    if (t.trim() === "") return [];
    var achadas = LISTA.filter(function (n) {
      return n.palavras.some(function (p) { return t.indexOf(" " + normalizar(p) + " ") >= 0; });
    });
    return achadas.sort(function (a, b) { return (b.urgente ? 1 : 0) - (a.urgente ? 1 : 0); });
  }

  function porId(id) { return LISTA.filter(function (n) { return n.id === id; })[0] || null; }

  /* grupos = Acesso.buscar().grupos. Devolve {destaque (na ordem da necessidade), outros}. */
  function separar(grupos, necessidades) {
    var ordem = [];
    necessidades.forEach(function (n) { n.tipos.forEach(function (t) { if (ordem.indexOf(t) < 0) ordem.push(t); }); });
    var destaque = ordem.map(function (t) { return grupos.filter(function (g) { return g.tipo === t; })[0]; }).filter(Boolean);
    var outros = grupos.filter(function (g) { return ordem.indexOf(g.tipo) < 0; });
    return { destaque: destaque, outros: outros };
  }

  return { LISTA: LISTA, normalizar: normalizar, identificar: identificar, porId: porId, separar: separar };
});
