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
      checklist: true, jornada: true,
      secoes: [{
        titulo: "Canais oficiais",
        tipos: ["emprego_curso"], agrupar: true,
        subtipos: ["pat", "conecta", "credito", "secretaria", "qualificacao", "fundo_social", "curso_profissionalizante", "curso_tecnico", "eja", "escola_sesi"],
        grupos: ["Emprego e orientação", "Cursos gratuitos de qualificação", "Cursos profissionalizantes (qualificação profissional)", "Cursos técnicos (ensino técnico)", "Estudar e se qualificar ao mesmo tempo"],
        links: [
          ["Portal da Empregabilidade de Rio Claro", "https://vagas.rioclaro.sp.gov.br/", "Consultar oportunidades e informações para trabalhadores."],
          ["Trampolim — Governo de São Paulo", "https://www.trampolim.sp.gov.br/", "Consultar oportunidades e cursos disponíveis na plataforma."],
          ["Estudar: concluir o ensino médio, faculdade e cursos superiores", "#educacao", "EJA gratuita, Faculdade SESI e os cursos superiores da Fatec estão na área Educação, que também reúne os cursos técnicos e profissionalizantes."]
        ]
      }],
      pendencias: ["Este sistema não lista vagas abertas. Para ver vagas atuais, use os portais acima."]
    },
    {
      id: "educacao", nome: "Educação", icone: "educacao",
      intro: "Matrícula, transferência e vagas para os filhos, creches e escolas, conclusão dos estudos (EJA), cursos técnicos e superiores em Rio Claro.",
      secoes: [{
        titulo: "Para as mães: matrícula, transferência e vagas",
        descricao: "Passo a passo para quem precisa matricular, transferir ou procurar vaga para os filhos. Vale a regra geral; datas, documentos e locais de Rio Claro precisam ser confirmados na Secretaria Municipal da Educação.",
        tipos: [], links: [],
        canais: [
          { nome: "Por onde começar: quem cuida da etapa do meu filho", sem_tel: true, resumo: "Ver o passo a passo",
            texto: "Cada etapa de ensino tem uma rede responsável. Saber isso ajuda a saber onde pedir a vaga.",
            topicos: [
              ["Creche e pré-escola (0 a 5 anos)", "Em geral são organizadas pelo município. Procure a Secretaria Municipal da Educação."],
              ["Ensino fundamental", "É atendido por escolas do município e do estado. Pergunte na Secretaria qual escola e qual rede atendem o seu bairro."],
              ["Ensino médio", "Em geral é responsabilidade do estado. Também há o ensino médio da rede SESI-SP (veja o grupo “Concluir os estudos e graduação”, mais abaixo) e escolas particulares."],
              ["Jovem ou adulto que não concluiu os estudos", "Veja a EJA (Educação de Jovens e Adultos), no grupo “Concluir os estudos e graduação”, mais abaixo, ou pergunte na Secretaria Municipal da Educação."]
            ],
            fonte: ["Constituição Federal, art. 211", null, "regra geral; a organização de Rio Claro deve ser confirmada na Secretaria da Educação"] },
          { nome: "Crio meu filho sozinha: o que perguntar e a quem pedir apoio", sem_tel: true, resumo: "Ver o passo a passo",
            texto: "Você não precisa se justificar para pedir ajuda. Estas perguntas servem para combinar a vaga e a escola com a sua rotina de mãe que cuida sozinha.",
            topicos: [
              ["Documentos", "Diga à Secretaria ou à escola que você é a única responsável e pergunte quais documentos valem no seu caso, por exemplo quando o pai não consta na certidão de nascimento ou não convive com a criança. Não tente adivinhar: confirme antes de ir."],
              ["Prioridade na vaga", "Pergunte se existe critério de prioridade para vaga em creche (por exemplo, mãe que trabalha ou família em situação de vulnerabilidade) e quais comprovantes são pedidos. Este site não confirmou se esse critério existe em Rio Claro."],
              ["Horário que cabe na sua rotina", "Pergunte o horário de funcionamento e se há período integral ou parcial. Se o horário não couber no seu trabalho ou estudo, diga isso ao pedir a vaga e peça orientação sobre outras opções."],
              ["Quem busca a criança", "Pergunte como cadastrar uma pessoa de confiança autorizada a buscar a criança nos dias em que você não puder."],
              ["Se você está sozinha por causa de violência", "Se houver medida protetiva ou restrição de contato com alguém, avise a escola por um canal seguro e peça que a informação seja tratada com cuidado. Veja a área Direitos para orientação e para o Ligue 180."],
              ["Pensão e guarda", "Para pedir pensão alimentícia ou regularizar a guarda, veja a área Direitos (Defensoria Pública), que orienta quem não pode pagar advogado."],
              ["Apoio da assistência social", "O CRAS orienta sobre benefícios e apoio à família. Veja a área Assistência Social e pergunte lá se há serviços para famílias com uma só responsável."]
            ],
            aviso: "São perguntas para levar, não regras confirmadas: os critérios e procedimentos de Rio Claro dependem da Secretaria Municipal da Educação.",
            fonte: ["Orientação geral; sem fonte oficial local", null, "a ser confirmada"] },
          { nome: "Cada tipo de escola tem um caminho", sem_tel: true, resumo: "Ver o passo a passo",
            texto: "O pedido de vaga não é o mesmo em todo lugar. Comece pelo caminho da escola que você procura.",
            topicos: [
              ["Creche, pré-escola e ensino fundamental municipais", "Use o aplicativo CADU (veja o passo a passo no cartão seguinte). Em publicação oficial de 17 de outubro de 2025, a Prefeitura informou que as matrículas e rematrículas da rede municipal passaram a ser 100% digitais pelo CADU. Em caso de dúvida, procure a Secretaria Municipal da Educação. Ainda é preciso confirmar se o procedimento é o mesmo para 2027."],
              ["Escola estadual", "Procure a própria escola estadual ou a Secretaria Estadual da Educação. A pesquisa indica que a Secretaria Escolar Digital (SED) tem uma consulta pública de matrícula, em que se informa o RA (Registro do Aluno) e a data de nascimento; essa informação não foi conferida por nós."],
              ["Escola particular", "Procure a secretaria da própria escola."],
              ["Escola do SESI", "O SESI-SP tem processo seletivo próprio e regras de vagas (veja o cartão SESI Rio Claro, mais abaixo). Não é o mesmo processo da rede municipal."],
              ["EJA", "Pergunte na Secretaria Municipal da Educação ou na unidade que oferece a EJA (por exemplo, o SESI)."]
            ],
            aviso: "Os caminhos acima são uma orientação inicial. O que falta confirmar com a Secretaria está em “Pendências”, no fim desta página.",
            fonte: ["Pesquisa sobre o procedimento de Rio Claro", null, "não conferida em fonte oficial por nós"] },
          { nome: "Matrícula pelo aplicativo CADU: passo a passo no celular", sem_tel: true, resumo: "Ver o passo a passo",
            texto: "A Prefeitura informou, em publicação oficial de 17 de outubro de 2025, que as matrículas da rede municipal de Rio Claro são 100% digitais e que o CADU, o aplicativo da Prefeitura, permite matricular ou rematricular o filho direto pelo celular.",
            topicos: [
              ["1. Baixe o aplicativo", "O aplicativo CADU está disponível para Android (Google Play) e para iPhone (App Store). Procure pelo nome “CADU”."],
              ["2. Faça o seu cadastro", "Cadastre-se como responsável e adicione o aluno como dependente. Segundo o passo a passo da Prefeitura, o cadastro pede CPF, nome completo, e-mail, telefone e data de nascimento, além de validação de biometria e envio dos documentos solicitados. Deixe os documentos à mão."],
              ["3. Peça a matrícula", "Com o cadastro feito, abra o aplicativo e toque em “Serviços”, depois em “Educação”. Selecione “Matrícula e Rematrícula” e toque em “Iniciar nova solicitação”."],
              ["4. Escolha o aluno e a escola", "Escolha o nome do aluno ou da aluna e depois selecione a escola desejada. Finalize tocando em “Matrícula Escolar – Alunos”."],
              ["5. Acompanhe", "A Secretaria Escolar valida o pedido e a confirmação chega por notificação no próprio aplicativo. Lembre: enviar a solicitação não é o mesmo que ter a vaga garantida (veja “Inscrição não é vaga”)."],
              ["Sem celular, sem internet ou com dificuldade no aplicativo", "Procure a Secretaria Municipal da Educação pessoalmente e peça ajuda para fazer o pedido. Pergunte também se há atendimento presencial para o CADU: este site ainda não tem o endereço de unidades de atendimento."]
            ],
            aviso: "Os nomes dos botões podem mudar quando o aplicativo for atualizado, e o calendário de 2027 ainda precisa ser confirmado na Secretaria.",
            fonte: ["Prefeitura de Rio Claro: publicação oficial (17/10/2025) e página sobre rematrículas", "https://rioclaro.sp.gov.br/educacao/rio-claro-abre-rematriculas-para-estudantes-da-educacao-infantil/", "passo a passo conforme a publicação e os materiais oficiais da Prefeitura"] },
          { nome: "Matricular meu filho pela primeira vez", sem_tel: true, resumo: "Ver o passo a passo",
            texto: "Antes de ir, saiba o que levar e o que perguntar. Datas e procedimentos mudam a cada ano.",
            topicos: [
              ["A matrícula é obrigatória?", "Dos 4 aos 17 anos, sim: a família tem o dever de matricular e o Estado de oferecer a vaga. Para crianças de 0 a 3 anos (creche) a vaga é um direito, mas a matrícula não é obrigatória e depende de vagas."],
              ["Idade mínima", "As normas nacionais costumam usar uma data de corte (em geral 31 de março) para definir a idade de entrada em cada etapa. Confirme a data e a idade da sua criança na Secretaria."],
              ["Documentos que costumam ser pedidos", "Certidão de nascimento ou documento da criança; CPF da criança, se tiver; RG e CPF do responsável; comprovante de residência atualizado; carteira de vacinação; documentos escolares anteriores, quando houver. É uma lista para ir preparada, não a lista oficial: a Secretaria informa os documentos exigidos em cada caso."],
              ["Inscrição não é vaga", "São etapas diferentes: inscrição ou cadastro, pedido de vaga, convocação e matrícula efetivada. Ter protocolo ou cadastro não significa que a criança já tem a vaga. Pergunte em que etapa o seu pedido está."],
              ["Datas", "Os prazos mudam a cada ano. A Prefeitura divulgou em outubro de 2025 o calendário para o ano letivo de 2026 (informação não conferida por nós); essas datas não valem para 2027. Confirme o calendário novo na Secretaria."],
              ["Sem internet ou sem conseguir preencher o cadastro", "Procure a Secretaria Municipal da Educação pessoalmente (endereço e telefone no cartão da Secretaria, mais abaixo) e peça ajuda para fazer o pedido. O CRAS também pode orientar."],
              ["O que perguntar", "Em que período a matrícula ou a inscrição está aberta? Onde faço (pessoalmente, na escola ou pela internet)? Quais documentos levo? Qual escola atende o meu endereço? Como acompanho o pedido? Peça tudo por escrito ou anote o nome de quem atendeu."]
            ],
            fonte: ["Constituição Federal, art. 208; LDB (Lei 9.394/1996), art. 6º; ECA (Lei 8.069/1990), art. 53", null, "regras gerais; procedimentos de Rio Claro devem ser confirmados na Secretaria da Educação"] },
          { nome: "Pedir transferência de escola", sem_tel: true, resumo: "Ver o passo a passo",
            texto: "Para mudar o filho de escola (mudança de bairro, de cidade ou de rede).",
            topicos: [
              ["Na escola de origem", "Peça a declaração de transferência e o histórico escolar (ou documento equivalente) do seu filho. Pergunte quanto tempo leva e peça por escrito."],
              ["Na escola ou na Secretaria de destino", "Pergunte se há vaga na série do seu filho, qual é o procedimento e o prazo, e quais documentos levar. Se não houver vaga na escola desejada, pergunte quais escolas próximas têm."],
              ["Mudança no meio do ano", "A transferência pode ser feita durante o ano. Confirme com a escola de destino como funciona e se é preciso comprovar o novo endereço."]
            ],
            aviso: "Os procedimentos de transferência de Rio Claro não foram arquivados de fonte oficial: confirme com a Secretaria Municipal da Educação e com a escola.",
            fonte: ["Orientação geral; sem fonte oficial local", null, "a ser confirmada"] },
          { nome: "Procurar vaga em creche ou em escola", sem_tel: true, resumo: "Ver o passo a passo",
            texto: "Não existe vaga garantida só por estar cadastrada: o que vale é o pedido feito junto ao órgão responsável.",
            topicos: [
              ["1. Faça o pedido", "Procure a Secretaria Municipal da Educação e peça a vaga para o seu filho. Guarde o protocolo ou o nome de quem atendeu."],
              ["2. Acompanhe", "Use a consulta pública da demanda escolar (link nesta área) para ver informações sobre a demanda por vagas, e volte à Secretaria para saber a situação do seu pedido."],
              ["3. Pergunte sobre a fila", "Pergunte como funciona a lista de espera, em que posição está o pedido e se há outras escolas próximas com vaga. Peça a resposta por escrito."],
              ["4. Outras possibilidades", "Veja também as escolas da rede SESI (ingresso por sorteio e processo seletivo, segundo notícia de 24/09/2026) e escolas particulares, se for possível."]
            ],
            fonte: ["Consulta pública da demanda escolar", "https://www.educacaorc.com.br/?r=demandaescolar", "portal da Educação de Rio Claro"] },
          { nome: "Se a vaga for negada ou demorar", sem_tel: true, resumo: "Ver o passo a passo",
            texto: "O acesso à escola pública e gratuita, próxima da residência, é um direito da criança e do adolescente. Se o pedido for recusado sem explicação ou demorar demais, a família pode pedir ajuda.",
            topicos: [
              ["Conselho Tutelar", "Recebe casos de direitos de crianças e adolescentes. Veja o contato na área Assistência Social deste site."],
              ["Defensoria Pública", "Orienta e pode atuar, sem custo para quem não pode pagar, para garantir o direito à vaga. Link nesta área, na seção de direitos."],
              ["Guarde as provas", "Protocolo, nomes de atendentes, datas e respostas por escrito ajudam em qualquer pedido de ajuda."]
            ],
            fonte: ["ECA (Lei 8.069/1990), arts. 53 e 54", null, "regra geral"] }
        ]
      }, {
        titulo: "Canais oficiais",
        tipos: ["creche"],
        links: [
          ["Secretaria Municipal da Educação", "https://rioclaro.sp.gov.br/secretaria/secretaria-da-educacao/", "Orientações sobre a rede municipal e a matrícula."],
          ["Consulta pública da demanda escolar", "https://www.educacaorc.com.br/?r=demandaescolar", "Informações disponibilizadas no portal da Educação."],
          ["Rematrículas na rede municipal (Prefeitura de Rio Claro)", "https://rioclaro.sp.gov.br/educacao/rio-claro-abre-rematriculas-para-estudantes-da-educacao-infantil/", "Página da Prefeitura sobre as rematrículas pelo aplicativo CADU."],
          ["Secretaria Escolar Digital (SED): consulta pública de matrícula, rede estadual", "https://sed.educacao.sp.gov.br/ConsultaPublica/Index", "Para escolas estaduais. Indicado pela pesquisa; confira se a página abre e se atende o seu caso."]
        ]
      }, {
        titulo: "Estudar, concluir os estudos e se qualificar",
        tipos: ["emprego_curso"], agrupar: true,
        subtipos: ["eja", "escola_sesi", "graduacao", "curso_superior_tecnologia", "curso_tecnico", "curso_profissionalizante"],
        links: []
      }],
      avisos: ["Uma escola ou creche cadastrada não confirma que há vaga. Confirme com a Secretaria da Educação."],
      pendencias: [
        "As regras de Rio Claro ainda não foram arquivadas de fonte oficial: o passo a passo acima segue a regra geral e as informações de pesquisa, e três pontos precisam ser confirmados com a Secretaria Municipal da Educação: (1) o calendário e o procedimento de novas matrículas para 2027, inclusive se o aplicativo CADU continua sendo o canal (a Prefeitura o confirmou como canal de matrícula em publicação de 17/10/2025); (2) como solicitar e acompanhar vaga em creche, e o que fazer quando não há vaga; (3) quais documentos e canais são exigidos hoje em cada etapa (creche, pré-escola, ensino fundamental e EJA).",
        "A lista de escolas públicas (municipais e estaduais) com endereço e telefone ainda não está neste site."
      ]
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

  /* Página "De Mulher para Mulher": serviços que mulheres oferecem a outras mulheres.
     Só as categorias ficam aqui; as ofertas reais ficam em dados/ofertas_mulheres.json (hoje vazio: nada é inventado). */
  var REDE_OFERTAS = {
    categorias: [
      { id: "transporte", titulo: "Transporte e motorista", exemplo: "Motorista de aplicativo ou de transporte escolar, feito por mulher." },
      { id: "saude-mental", titulo: "Psicologia e saúde mental", exemplo: "Psicólogas, terapeutas e grupos de apoio conduzidos por mulheres." },
      { id: "saude-corpo", titulo: "Saúde e cuidado do corpo", exemplo: "Fisioterapia, nutrição, massoterapia, doula e outras profissionais mulheres." },
      { id: "atividade-fisica", titulo: "Academia e atividade física", exemplo: "Academias, treinos e aulas só para mulheres." },
      { id: "beleza", titulo: "Beleza e bem-estar", exemplo: "Cabeleireira, manicure, maquiadora, esteticista." },
      { id: "aulas", titulo: "Aulas e orientação", exemplo: "Reforço escolar, idiomas, música, orientação profissional e de carreira." },
      { id: "casa-familia", titulo: "Casa e família", exemplo: "Cuidadora, babá, diarista, costura, comida caseira, reparos feitos por mulheres." },
      { id: "negocios", titulo: "Negócios e artesanato", exemplo: "Produtos e serviços de empreendedoras e artesãs de Rio Claro." },
      { id: "outros", titulo: "Outros serviços", exemplo: "Qualquer outro serviço oferecido por mulher para mulheres." }
    ]
  };

  function porId(id) {
    for (var i = 0; i < AREAS.length; i++) if (AREAS[i].id === id) return AREAS[i];
    return null;
  }

  return { AREAS: AREAS, EMERGENCIA: EMERGENCIA, REDE_OFERTAS: REDE_OFERTAS, NOTA_FONTE: NOTA_FONTE, porId: porId };
});
