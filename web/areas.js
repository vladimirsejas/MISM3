/* Conteúdo das áreas da tela inicial. Só entram links e serviços que já constavam no projeto
   com fonte oficial; o que não foi verificado aparece em "pendencias", nunca como se existisse. */
(function (raiz, fabrica) {
  if (typeof module === "object" && module.exports) module.exports = fabrica();
  else raiz.MISM3Areas = fabrica();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var NOTA_FONTE = "Fonte oficial externa; confira os dados e a disponibilidade no site de origem.";

  /* Ordem = ordem dos botões na tela inicial. A sétima porta (De Mulher para Mulher) é uma página própria. */
  var AREAS = [
    {
      id: "trabalho", nome: "Trabalho", icone: "trabalho",
      intro: "Vagas, cursos de qualificação, crédito e apoio para gerar renda em Rio Claro.",
      checklist: true,
      secoes: [{
        titulo: "Canais oficiais",
        tipos: ["emprego_curso"],
        links: [
          ["Portal da Empregabilidade de Rio Claro", "https://vagas.rioclaro.sp.gov.br/", "Consultar oportunidades e informações para trabalhadores."],
          ["Trampolim — Governo de São Paulo", "https://www.trampolim.sp.gov.br/", "Consultar oportunidades e cursos disponíveis na plataforma."]
        ]
      }],
      pendencias: ["Este sistema não lista vagas abertas. Para ver vagas atuais, use os portais acima."]
    },
    {
      id: "educacao", nome: "Educação", icone: "educacao",
      intro: "Creches, escolas e matrículas na rede de Rio Claro.",
      secoes: [{
        titulo: "Canais oficiais",
        tipos: ["creche"],
        links: [
          ["Secretaria Municipal da Educação", "https://rioclaro.sp.gov.br/secretaria/secretaria-da-educacao/", "Orientações sobre a rede municipal e a matrícula."],
          ["Consulta pública da demanda escolar", "https://www.educacaorc.com.br/?r=demandaescolar", "Informações disponibilizadas no portal da Educação."]
        ]
      }],
      avisos: ["Uma escola ou creche cadastrada não confirma que há vaga. Confirme com a Secretaria da Educação."]
    },
    {
      id: "saude", nome: "Saúde", icone: "saude",
      intro: "Unidades de saúde e serviços de atendimento. Em urgência médica, ligue 192.",
      secoes: [{ titulo: "Unidades de saúde", tipos: ["saude"], agrupar: true, links: [] }],
      pendencias: [
        "A lista segue a página “Endereços das unidades de saúde” da Fundação Municipal de Saúde (10/10/2026), conferida com o cadastro do CNES. Telefones e horários podem mudar: confirme com a unidade.",
        "Hospital Público Municipal Maria Thereza Ramos Vitti: o nome consta no CNES, mas nenhuma fonte consultada traz o endereço e o telefone. Ligue para a Fundação Municipal de Saúde."
      ]
    },
    {
      id: "direitos", nome: "Direitos", icone: "direitos",
      intro: "Orientação jurídica, separação, pensão, aposentadoria, dívidas e proteção contra a violência.",
      secoes: [
        {
          titulo: "Separação, pensão e guarda",
          tipos: [],
          links: [
            ["Defensoria Pública do Estado de São Paulo", "https://www.defensoria.sp.def.br/", "Canais oficiais de orientação jurídica e critérios de atendimento."]
          ]
        },
        {
          titulo: "Violência e proteção",
          tipos: ["mulher"],
          urgente: true,
          links: [
            ["Ligue 180 — Central de Atendimento à Mulher", "https://www.gov.br/mulheres/pt-br/ligue180", "Canal nacional de atendimento, orientação e encaminhamento."],
            ["Secretaria Municipal da Mulher", "https://rioclaro.sp.gov.br/secretaria/secretaria-da-mulher/", "Contatos institucionais publicados pela Prefeitura."]
          ]
        },
        {
          titulo: "Aposentadoria e dívidas",
          tipos: [],
          links: [
            ["Procon de Rio Claro", "https://rioclaro.sp.gov.br/secretaria/secretaria-de-justica/", "A página municipal informa os contatos das unidades do Procon, para orientação sobre dívidas de consumo."],
            ["Procon-SP — Apoio ao Superendividado", "https://www.procon.sp.gov.br/espaco-consumidor/#ApoioSuperendividado", "Programa estadual com inscrição online e triagem para quem não consegue pagar dívidas sem comprometer a subsistência."],
            ["Meu INSS — Simular aposentadoria", "https://www.gov.br/pt-br/servicos/simular-aposentadoria", "Projeção do tempo que falta, com base nos vínculos registrados. Não garante concessão de benefício."]
          ]
        }
      ],
      avisos: ["Nunca compartilhe senhas ou códigos de acesso com intermediários. Simulações de aposentadoria são projeções e não garantem benefício."]
    },
    {
      id: "moradia", nome: "Moradia", icone: "moradia",
      intro: "Água, energia e habitação: tarifas sociais, programas e benefícios.",
      secoes: [
        {
          titulo: "Água e esgoto — Tarifa Social (DAAE)",
          tipos: [],
          canais: [
            { nome: "Tarifa Residencial Social de Água e Esgoto — DAAE", sem_tel: true,
              texto: "Desconto na conta de água e esgoto para famílias que se enquadrem nos critérios, só na categoria residencial: 50% no consumo de até 15 m³ e 25% na faixa de 16 a 20 m³. O cadastro é feito no DAAE, Avenida 8A, nº 360 (entrada pela Avenida 6A), de segunda a sexta-feira, das 8h30 às 15h30.",
              topicos: [
                ["Quem tem direito", "Famílias com renda de até R$ 759 por pessoa (meio salário mínimo por pessoa, segundo o informativo), que se enquadrem em uma destas situações: (I) família de baixa renda inscrita no CadÚnico (Cadastro Único para Programas Sociais); ou (II) família com pessoa com deficiência ou pessoa idosa de 65 anos ou mais que receba o BPC (Benefício de Prestação Continuada)."],
                ["Documentos (original e cópia)", "Documento de identidade com foto, CPF e conta de água, mais um destes: comprovante de inscrição atualizado no CadÚnico; cartão de beneficiário do BPC; ou extrato de pagamento de benefício ou declaração do INSS ou de outro regime de previdência social, público ou privado."],
                ["Prazo", "Até 10 dias depois do pedido, se os critérios forem comprovados."],
                ["Ligação compartilhada", "A família que tem direito recebe o desconto; os demais usuários da ligação continuam com a cobrança normal."],
                ["Validade e renovação", "O desconto dura 12 meses. A renovação deve ser pedida pelo próprio usuário, do mesmo modo que o cadastro, levando a documentação ao DAAE. Sem renovação, o benefício pode ser cancelado."],
                ["Quando se perde o desconto", "Quando a família deixa de atender aos critérios; quando há irregularidades (como ligação clandestina, compartilhamento indevido ou violação de cavalete ou hidrômetro); ou quando há incoerências ou informações inverídicas no cadastro. Há notificação por 3 meses para regularizar a situação."]
              ],
              aviso: "Informativo do DAAE (Resolução ARES-PCJ nº 592/2024) sem data de publicação. O valor de renda acompanha o salário mínimo e pode ter sido reajustado: confirme o valor atual no DAAE antes de ir.",
              fonte: ["Informativo do DAAE de Rio Claro: Tarifa Residencial Social de Água e Esgoto (Resolução ARES-PCJ nº 592/2024)", null, "consultado em 10/10/2026; data de publicação não consta"] }
          ],
          links: [
            ["Atendimento do DAAE: linha 0800 por WhatsApp", "https://daaerioclaro.sp.gov.br/linha-0800-do-daae-passa-a-atender-whatsapp/", "Aviso do DAAE sobre o atendimento da linha 0800 por WhatsApp. Veja nele os números e o horário de atendimento."],
            ["Desconto na conta de água e esgoto — site do DAAE", "https://daaerioclaro.sp.gov.br/familias-de-baixa-renda-podem-solicitar-desconto-ao-daae-na-conta-de-agua-e-esgoto/", "Página do próprio DAAE sobre o desconto na conta para famílias de baixa renda. Confira nela os critérios e documentos vigentes."],
            ["Tarifa social de água e esgoto de Rio Claro", "https://rioclaro.sp.gov.br/daae/familias-em-vulnerabilidade-social-podem-solicitar-tarifa-social-na-conta-de-agua-e-esgoto/", "Página do portal da Prefeitura sobre o mesmo desconto; confirme requisitos e vigência com o DAAE."]
          ]
        },
        {
          titulo: "Energia elétrica — Tarifa Social (Elektro)",
          tipos: [],
          canais: [
            { nome: "Elektro — atendimento ao cliente em Rio Claro (energia elétrica)", sem_tel: true,
              texto: "Distribuidora de energia elétrica da cidade. Segundo a notícia, o Espaço de Atendimento ao Cliente fica na Avenida 7, nº 190, bairro Cidade Nova, e atende das 8h às 17h, com serviços como ligação nova, alteração da data de vencimento da conta, troca de nome do titular e pedido de desligamento. Canal de WhatsApp informado: (19) 2122-1696.",
              aviso: "Informação de uma notícia de 17/12/2020: endereço, horário e canais podem ter mudado. Confirme com a Elektro antes de ir.",
              fonte: ["Notícia da Elektro (Neoenergia): “Espaço de atendimento da Elektro em Rio Claro em novo endereço”", null, "publicada em 17/12/2020, consultada em 10/10/2026"] }
          ],
          links: [
            ["Tarifa Social de Energia Elétrica — ANEEL", "https://www.gov.br/aneel/pt-br/assuntos/tarifas/tarifa-social", "Página da ANEEL, a agência que regula a energia elétrica, sobre a Tarifa Social. Quem tem direito e como pedir o desconto estão nessa página; este sistema não confere os critérios."],
            ["Tarifa Social — Neoenergia (grupo da Elektro)", "https://www.neoenergia.com/tarifa-social", "Página do grupo Neoenergia, ao qual pertence a Elektro, sobre a Tarifa Social. O grupo atende outros estados: confirme se as regras e os canais valem para a Elektro em Rio Claro."]
          ]
        },
        {
          titulo: "Habitação",
          tipos: [],
          links: [
            ["Secretaria de Habitação de Rio Claro", "https://rioclaro.sp.gov.br/secretaria/secretaria-de-planejamento-e-habitacao/", "A Prefeitura publica os contatos da secretaria e links para cadastro habitacional e critérios."],
            ["CRAS — Centros de Referência de Assistência Social", "https://rioclaro.sp.gov.br/centro-ref-assistencia-social/", "Orientação sobre benefícios e proteção social."]
          ]
        }
      ],
      pendencias: [
        "Este sistema não faz inscrição em programas nem confirma vaga, aluguel social ou prioridade habitacional.",
        "Tarifa social de energia elétrica: a distribuidora de Rio Claro é a Elektro (confirmado em notícia da própria empresa, de 2020). Quem tem direito e como pedir o desconto: veja as páginas da ANEEL e da Neoenergia e procure a Elektro e o CRAS. Este sistema não verifica critérios de elegibilidade da energia."
      ]
    },
    {
      id: "assistencia", nome: "Assistência Social", icone: "assistencia",
      intro: "CRAS, CREAS, Conselho Tutelar e serviços de convivência de Rio Claro.",
      secoes: [
        {
          titulo: "Seu CRAS",
          descricao: "O CRAS é a porta de entrada da assistência social, perto de onde você mora.",
          tipos: ["assistencia"], subtipos: ["cras"], busca: "bairro",
          links: [["CRAS e Centros de Convivência — página oficial", "https://desenvolvimentosocial.rc.sp.gov.br/?page_id=1651", "Lista oficial dos CRAS, dos bairros que cada um atende e dos serviços de convivência."]]
        },
        {
          titulo: "Proteção e denúncia",
          descricao: "Para situações de violência, negligência, abandono ou violação de direitos.",
          tipos: ["assistencia"], subtipos: ["creas", "conselho_tutelar"],
          canais: [
            { nome: "Disque 100 — Disque Direitos Humanos", tel: "100", texto: "Recebe, analisa e encaminha denúncias de violações de direitos humanos, como contra crianças e adolescentes, pessoas idosas, pessoas com deficiência, população LGBTQIA+ e população em situação de rua. Funciona 24 horas por dia, todos os dias, inclusive sábados, domingos e feriados. A ligação é gratuita, de qualquer telefone fixo ou móvel, discando 100.", fonte: ["gov.br — Denunciar violação de direitos humanos (Disque 100)", "https://www.gov.br/pt-br/servicos/denunciar-violacao-de-direitos-humanos", "página com última modificação em 15/12/2025, consultada em 10/10/2026"] }
          ],
          links: [["CREAS — página oficial", "https://desenvolvimentosocial.rc.sp.gov.br/?page_id=114", "O que é o CREAS, quem pode procurar e como acessar."]]
        },
        {
          titulo: "Convivência e apoio",
          descricao: "Serviços de convivência para crianças, adolescentes, adultos e pessoas idosas, e unidades da APAE.",
          tipos: ["assistencia"], subtipos: ["scfv", "apae"], agrupar: true, recolhida: true,
          links: []
        },
        {
          titulo: "Secretaria e outros canais",
          tipos: ["assistencia"], recolhida: true,
          links: [
            ["Secretaria de Desenvolvimento Social", "https://rioclaro.sp.gov.br/secretaria/secretaria-de-desenvolvimento-social/", "Informações institucionais sobre assistência social."],
            ["Fundo Social de Solidariedade", "https://rioclaro.sp.gov.br/secretaria/fundo-social-de-solidariedade/", "Informações sobre cursos e programas."],
            ["Pessoa com deficiência em Rio Claro — site oficial", "https://www.pessoacomdeficiencia.rc.sp.gov.br/", "Entidades e serviços que atendem a pessoa com deficiência no município e o cadastro de pessoas com deficiência."]
          ]
        }
      ],
      pendencias: [
        "Horário de funcionamento dos CRAS, do CREAS e das unidades de convivência não consta na fonte: ligue antes de ir.",
        "Conselho Tutelar: horário de funcionamento e plantão não constam na fonte consultada (CMDCA Rio Claro); ligue antes de ir. Para saber qual Conselho atende o seu bairro, consulte a Secretaria de Desenvolvimento Social (link acima)."
      ]
    }
  ];

  /* Contatos de emergência: canais nacionais oficiais. Mantidos aqui para os testes conferirem. */
  var EMERGENCIA = [
    { tel: "190", nome: "Polícia Militar", quando: "Perigo imediato, agressão em andamento ou ameaça." },
    { tel: "192", nome: "SAMU", quando: "Urgência médica ou pessoa ferida." },
    { tel: "193", nome: "Bombeiros", quando: "Incêndio, resgate ou acidente." },
    { tel: "180", nome: "Central de Atendimento à Mulher", quando: "Violência contra a mulher: orientação, denúncia e encaminhamento. 24 horas, gratuito." },
    { tel: "100", nome: "Disque Direitos Humanos", quando: "Violações de direitos humanos, como contra crianças, idosos e pessoas com deficiência. 24 horas, gratuito." },
    { tel: "188", nome: "CVV — apoio emocional", quando: "Conversa de apoio em momentos de sofrimento. 24 horas, gratuito." }
  ];

  function porId(id) {
    for (var i = 0; i < AREAS.length; i++) if (AREAS[i].id === id) return AREAS[i];
    return null;
  }

  return { AREAS: AREAS, EMERGENCIA: EMERGENCIA, NOTA_FONTE: NOTA_FONTE, porId: porId };
});
