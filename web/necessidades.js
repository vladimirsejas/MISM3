/* "Escreva o que precisa e abrimos as portas": frase -> necessidades -> caminhos.
   Roda no navegador; o texto digitado nao e enviado nem gravado.

   Como casa: palavras INTEIRAS ("filho" nao casa dentro de "filhote"), radicais com * ("divorci*" casa divorcio,
   divorciar, divorciada) e expressoes ("me bate", "nao deixa eu sair"). Isso evita falsos positivos por pedaco de
   palavra (ex.: "divagar" contem "vaga"). Palavras amplas demais ("dinheiro", "vaga", "apoio", "bolsa") ficam de
   fora de proposito: so entram dentro de expressoes que tem sentido. Ate 3 necessidades por frase. */
(function (raiz, fabrica) {
  if (typeof module === "object" && module.exports) module.exports = fabrica();
  else { raiz.Necessidades = fabrica(); raiz.MISM3Necessidades = raiz.Necessidades; }
})(typeof self !== "undefined" ? self : this, function () {
  /* tipos = grupos de Acesso.ORDEM a destacar, na ordem. objetivo = filtro da trilha de autonomia (Recomendar). */
  var LISTA = [
    { id: "violencia", rotulo: "Violência / estou em perigo", urgente: true,
      palavras: ["violencia", "violent*", "agressao", "agredi*", "agressiv*", "apanh*", "ameac*", "abus*", "estupr*", "importunac*",
        "assedi*", "perseguic*", "maria da penha", "medida protetiva", "me bate", "me bateu", "me batendo", "me agride", "me agrediu",
        "me xinga", "me xingou", "me humilha", "me humilhou", "me persegue", "me perseguindo", "me forcou", "me obriga",
        "nao deixa eu sair", "nao me deixa sair", "nao deixa eu trabalhar", "nao me deixa trabalhar", "me proibe", "me proibiu",
        "controla meu dinheiro", "controla tudo", "tenho medo dele", "medo dele", "medo do marido", "medo do meu marido",
        "medo do companheiro", "medo do meu companheiro", "medo do namorado", "medo do ex", "medo de apanhar",
        "bate em mim", "me empurrou", "me machucou", "me controla", "estou em perigo", "em perigo",
        "preciso sair de casa", "quero sair de casa com seguranca", "sair de casa com seguranca"],
      tipos: ["mulher", "assistencia", "saude"],
      aviso: "Em perigo agora: ligue 190 (polícia) ou 192 (SAMU). Violência contra a mulher: Ligue 180, 24 horas, gratuito. Você não precisa se identificar para pedir orientação." },
    { id: "casamento", rotulo: "Casamento, separação, guarda, pensão",
      palavras: ["casamento", "casad*", "separ*", "divorci*", "pensao", "marido", "companheiro", "uniao estavel", "namorado",
        "advogad*", "defensoria", "direitos", "guarda dos filhos", "guarda do filho", "guarda da crianca", "guarda compartilhada",
        "guarda unilateral", "pedir a guarda", "perder a guarda", "ex marido", "ex companheiro"],
      tipos: ["mulher", "assistencia"],
      aviso: "Para divórcio, guarda e pensão normalmente é preciso orientação jurídica gratuita (Defensoria Pública) ou advogado. Ainda não cadastramos esse serviço: pergunte à Secretaria da Mulher, abaixo. Se há violência no relacionamento, use também “Violência”." },
    { id: "familia", rotulo: "Família e assistência social",
      palavras: ["familia", "familias", "cras", "creas", "cadunico", "cad unico", "bolsa familia", "cesta basica", "beneficio*",
        "comida", "fome", "comer", "o que comer", "passando necessidade",
        "sem dinheiro", "nao tenho dinheiro", "falta de dinheiro", "pouco dinheiro", "sem renda", "assistencia", "assistente social",
        "conta de luz", "luz cortada", "agua cortada"],
      tipos: ["assistencia", "mulher"] },
    { id: "moradia", rotulo: "Moradia e aluguel",
      palavras: ["moradia", "habitacao", "aluguel", "aluguel social", "casa para morar", "sem casa", "despejo", "despejada",
        "regularizacao fundiaria", "cadastro habitacional", "casa popular", "moradia popular", "preciso sair de casa"],
      tipos: ["assistencia", "mulher"],
      aviso: "Esta página não faz inscrição em programas nem confirma vaga, aluguel social ou prioridade habitacional: pergunte à Prefeitura quais critérios e programas estão vigentes. Se a saída de casa é por medo de alguém, use também “Violência”." },
    { id: "dividas", rotulo: "Dívidas, orçamento e aposentadoria",
      palavras: ["divida", "dividas", "endividad*", "superendividamento", "nome sujo", "renegociar divida", "renegociar dividas",
        "renegociacao de dividas", "renegociac*", "cartao atrasado", "emprestimo consignado", "consignado", "nao consigo pagar as contas",
        "contas atrasadas", "orcamento domestico", "aposentadoria", "aposentar*", "inss", "tempo de contribuicao", "simular aposentadoria", "procon"],
      tipos: [],
      aviso: "Use canais oficiais e não compartilhe senhas, códigos de acesso ou documentos com intermediários. Simulações de aposentadoria são projeções e não garantem benefício." },
    { id: "filhos", rotulo: "Filhos e cuidado infantil",
      palavras: ["filho*", "filha*", "crianc*", "bebe*", "creche*", "maternidade", "escola infantil", "educacao infantil", "emei",
        "baba", "com quem deixar", "deixar meu filho", "deixar meus filhos", "ninguem para cuidar",
        "matricula", "escola do meu filho", "escola dos meus filhos", "escola da minha filha", "levar na escola"],
      exclusivas: ["escola do meu filho", "escola dos meus filhos", "escola da minha filha", "levar na escola"],  // so de "filhos": as outras nao as enxergam
      tipos: ["creche", "educacao_infantil", "saude", "assistencia"],
      aviso: "O cadastro mostra onde há escolas e creches, não se há vaga. Confirme com a Secretaria de Educação." },
    { id: "saude", rotulo: "Saúde",
      palavras: ["saude", "medic*", "doente", "doenca*", "ubs", "upa", "posto de saude", "hospital", "pronto socorro", "remedio*",
        "consulta*", "exame*", "psicolog*", "psiquiatr*", "ansiedade", "depress*", "terapia", "caps", "vacina*", "menopausa",
        "gestacao", "gestante", "gravida", "gravidez", "pre natal", "ginecolog*", "mamografia", "preventivo", "dor"],
      tipos: ["saude"] },
    { id: "emprego", rotulo: "Emprego e renda", objetivo: "trabalhar",
      palavras: ["emprego*", "desemprega*", "trabalh*", "curriculo*", "renda", "ganhar dinheiro", "fonte de renda",
        "vaga de emprego", "vagas de emprego", "vaga de trabalho", "vagas de trabalho", "procuro vaga", "procurando vaga",
        "qualific*", "capacit*", "empreend*", "negocio", "credito", "microempreendedor*", "mei", "concurso*", "pat", "conecta", "banco do povo", "bico", "diarista"],
      tipos: ["emprego_curso"] },
    { id: "estudo", rotulo: "Estudo e cursos", objetivo: "curso",
      palavras: ["estud*", "faculdade", "universidade", "ensino medio", "ensino superior", "eja", "supletivo", "curso*", "qualific*",
        "capacit*", "etec", "fatec", "alfabetiza*", "enem", "escola", "formacao"],
      tipos: ["emprego_curso", "educacao_infantil"],
      aviso: "Hoje o cadastro tem os Centros de Qualificação do Fundo Social. Não temos ainda a lista de turmas abertas nem de EJA." },
    { id: "transporte", rotulo: "Ônibus e transporte",
      palavras: ["transporte", "onibus", "linha*", "horario*", "terminal", "tarifa", "passagem", "como chegar", "conducao", "vale transporte"],
      tipos: [],
      aviso: "Ainda não mostramos horários aqui: eles não foram conferidos. A fonte oficial do transporte coletivo é a SOU Transportes.",
      links: [{ texto: "Linhas e horários (SOU Transportes)", url: "https://soutransportes.com.br/rio-claro/" }] }
  ];
  var MAXIMO = 3;
  var IGNORAR = ["escola de samba", "guarda municipal", "bolsa de couro", "vaga lume"];

  function normalizar(t) {
    return String(t == null ? "" : t).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
      .replace(/[^a-z0-9* ]+/g, " ").replace(/\s+/g, " ").trim();
  }

  /* A expressao casa quando as palavras aparecem em sequencia; "x*" casa qualquer palavra que comece com "x". */
  function posicao(entrada, tokens) {
    var e = normalizar(entrada).split(" ");
    for (var i = 0; i + e.length <= tokens.length; i++) {
      var ok = e.every(function (p, j) {
        return p.charAt(p.length - 1) === "*" ? tokens[i + j].indexOf(p.slice(0, -1)) === 0 : tokens[i + j] === p;
      });
      if (ok) return i;
    }
    return -1;
  }

  /* Texto livre -> necessidades que casam (ate 3). Urgente (violencia) sempre primeiro; o resto na ordem da frase. */
  function identificar(texto) {
    var t = normalizar(String(texto == null ? "" : texto).replace(/\*/g, " "));
    IGNORAR.forEach(function (x) { t = (" " + t + " ").replace(" " + normalizar(x) + " ", " ").trim(); });
    if (t === "") return [];
    var tokens = t.split(" ");
    var achadas = [];
    LISTA.forEach(function (n) {
      // expressoes "exclusivas" de OUTRA necessidade somem do texto que esta enxerga (ex.: "levar na escola" nao e estudo)
      var meus = tokens;
      LISTA.forEach(function (o) {
        if (o !== n && o.exclusivas) {
          var u = " " + meus.join(" ") + " ";
          o.exclusivas.forEach(function (x) { u = u.split(" " + normalizar(x) + " ").join(" "); });
          meus = u.trim() === "" ? [] : u.trim().split(" ");
        }
      });
      var melhor = -1;
      n.palavras.forEach(function (p) {
        var pos = posicao(p, meus);
        if (pos >= 0 && (melhor < 0 || pos < melhor)) melhor = pos;
      });
      if (melhor >= 0) achadas.push({ n: n, pos: melhor });
    });
    achadas.sort(function (a, b) {
      if (!!a.n.urgente !== !!b.n.urgente) return a.n.urgente ? -1 : 1;
      return a.pos - b.pos;
    });
    return achadas.slice(0, MAXIMO).map(function (a) { return a.n; });
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

  /* Mesmo resultado, com o nome das "portas" da tela (emprego -> emprego_curso). Mantido por compatibilidade. */
  function identificarCategorias(texto) {
    return identificar(texto).map(function (n) { return n.id === "emprego" ? "emprego_curso" : n.id; });
  }

  return { LISTA: LISTA, normalizar: normalizar, identificar: identificar, identificarCategorias: identificarCategorias, porId: porId, separar: separar };
});
