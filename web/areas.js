/* Conteúdo das áreas da tela inicial. Só entram links e serviços que já constavam no projeto
   com fonte oficial; o que não foi verificado aparece em "pendencias", nunca como se existisse. */
(function (raiz, fabrica) {
  if (typeof module === "object" && module.exports) module.exports = fabrica();
  else raiz.MISM3Areas = fabrica();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var NOTA_FONTE = "Fonte oficial externa; confira os dados e a disponibilidade no site de origem.";

  /* Ordem = ordem dos botões na tela inicial. A sétima porta (Entre Mulheres) é uma página própria. */
  var AREAS = [
    {
      exemploDuvida: "como faço um currículo?", id: "trabalho", nome: "Trabalho", icone: "trabalho",
      intro: "Vagas, cursos de qualificação, crédito e apoio para gerar renda em Rio Claro.",
      checklist: true, jornada: true,
      secoes: [{
        titulo: "Canais oficiais",
        tipos: ["emprego_curso"], agrupar: true,
        /* Aqui ficam emprego e a qualificação municipal. Os cursos de SENAI, Senac, SEST SENAT, Etec, EJA e SESI moram só em Educação ("Para você"), para um curso mudar de endereço ou de turma em um lugar só. */
        subtipos: ["pat", "conecta", "credito", "secretaria", "qualificacao", "fundo_social"],
        grupos: ["Emprego e orientação", "Cursos gratuitos de qualificação"],
        links: [
          ["Portal da Empregabilidade de Rio Claro", "https://vagas.rioclaro.sp.gov.br/", "Consultar oportunidades e informações para trabalhadores."],
          ["Trampolim — Governo de São Paulo", "https://www.trampolim.sp.gov.br/", "Consultar oportunidades e cursos disponíveis na plataforma."],
          ["Lei nº 14.542/2023: prioridade no Sine para mulheres em situação de violência", "https://www2.camara.leg.br/legin/fed/lei/2023/lei-14542-3-abril-2023-793992-publicacaooriginal-167489-pl.html", "A lei federal reserva 10% das vagas intermediadas pelo Sine para mulheres em situação de violência doméstica e familiar. Como isso funciona em Rio Claro e o que o atendimento pede, só o PAT pode dizer: pergunte lá."],
          ["Estudar: concluir o ensino médio, faculdade e cursos superiores", "#educacao", "EJA gratuita, Faculdade SESI e os cursos superiores da Fatec estão na área Educação, que também reúne os cursos técnicos e profissionalizantes."]
        ]
      }, {
        titulo: "Formação mais longa (anos)", ancora: "trabalho-formacao-longa",
        descricao: "Graduações e cursos gratuitos que levam anos (UNIVESP, IFSP e o Programa Senac de Gratuidade) ficam na área Educação, que mantém esta lista num lugar só para a oferta, os prazos e as regras não ficarem diferentes em duas áreas. Oferta, prazos e regras mudam a cada edital ou período: confirme sempre na página de cada instituição antes de se inscrever.",
        tipos: [], links: [
          ["Formação mais longa: UNIVESP, IFSP e Senac gratuito (na área Educação)", "#educacao/educacao-formacao-longa", "A lista completa, com o vestibular da UNIVESP e as regras de cada instituição, está na área Educação."]
        ]
      }],
      pendencias: ["Este sistema não lista vagas abertas. Para ver vagas atuais, use os portais acima."]
    },
    {
      exemploDuvida: "como peço vaga na creche?", id: "educacao", nome: "Educação", icone: "educacao", jornada: "educacao",
      intro: "Para os seus filhos: matrícula, transferência e vagas em creches e escolas. Para você: concluir os estudos (EJA), fazer faculdade e cursos profissionalizantes e técnicos, em Rio Claro.",
      guia: {
        titulo: "O que você encontra nesta página",
        texto: "A área Educação é para os seus filhos e também para você.",
        itens: [
          { titulo: "Para os seus filhos", texto: "Matrícula, transferência, vaga em creche, calendário de 2027, documentos e o que fazer se não houver vaga. Há também apoio para quem cria os filhos sozinha e a lista das escolas municipais, com endereço e telefone. O cursinho gratuito para o vestibular e o ENEM, que serve aos filhos, está em “Para você”.", ancora: "educacao-filhos", botao: "Ver o guia dos filhos" },
          { titulo: "Creches e escolas perto de mim", texto: "Informe o seu CEP e veja as unidades que ficam mais perto, com endereço e telefone, e o bairro provável do seu CEP. Uma escola cadastrada não garante vaga: confirme na Secretaria da Educação.", ancora: "busca-por-cep", botao: "Informar meu CEP" },
          { titulo: "Para você", texto: "Terminar o ensino médio (EJA), fazer faculdade e cursos profissionalizantes e técnicos para trabalhar: SENAI, Senac, SEST SENAT, Etec e Fatec, além do cursinho gratuito para o vestibular e o ENEM e do EJA da Unesp. Para uma formação mais longa (anos), há ainda a UNIVESP, o IFSP e as bolsas do Programa Senac de Gratuidade.", ancora: "educacao-voce", botao: "Ver cursos e estudos para você" },
          { titulo: "Emprego e renda", texto: "Vagas de emprego, crédito e um plano para voltar a trabalhar ficam na área Trabalho.", href: "#trabalho", botao: "Ir para Trabalho" }
        ]
      },
      secoes: [{
        titulo: "Para os seus filhos: matrícula, transferência e vagas", ancora: "educacao-filhos",
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
          { nome: "Crio meu neto: como pedir a matrícula", sem_tel: true, resumo: "Ver o passo a passo",
            texto: "Quem cria o neto ou a neta pode procurar a matrícula pelos mesmos caminhos desta seção. O que vale como prova de que a criança mora com você é decidido pela Secretaria Municipal da Educação e pela escola.",
            topicos: [
              ["Por onde pedir", "Siga os cartões desta seção: o aplicativo CADU ou a Secretaria Municipal da Educação, pessoalmente. Se precisar de ajuda para preencher, peça na Secretaria."],
              ["Pergunte o que vale", "Pergunte à Secretaria e à escola o que aceitam quando o neto vive com a avó e não há guarda judicial. A pesquisa indica que pode ser pedido o termo de guarda: confirme com eles antes de assumir que é preciso."],
              ["Se pedirem a guarda no papel", "Procure a Defensoria Pública (cartão na área Direitos): ela avalia o caso e atende quem não tem condições de pagar."],
              ["Outras ajudas para quem cria netos", "Moradia, renda, convivência e proteção da avó estão no bloco “Sou avó ou pessoa idosa”, na área Assistência Social."]
            ],
            aviso: "A informação sobre documentos vem de pesquisa e não foi conferida em fonte oficial de Rio Claro. Quem informa o que é aceito é a Secretaria Municipal da Educação.",
            fonte: ["Pesquisa; sem fonte oficial local conferida", null, "a ser confirmada"] },
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
              ["Sem celular, sem internet ou com dificuldade no aplicativo", "O CADU é um aplicativo e não tem endereço. Para pedir ajuda, procure a Secretaria Municipal da Educação pessoalmente (endereço e telefones no cartão da Secretaria, mais abaixo) e peça apoio para fazer o pedido."]
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
          { nome: "Férias escolares de 2027 e a Copa do Mundo Feminina", sem_tel: true, resumo: "Ver o que muda",
            texto: "Em 2027 as férias do meio do ano podem ser diferentes por causa da Copa do Mundo Feminina no Brasil. Isso afeta quem precisa deixar os filhos com alguém para trabalhar ou estudar, por isso vale se planejar com antecedência. Este cartão trata das férias, não das datas de matrícula.",
            topicos: [
              ["O que a lei determina", "A Lei nº 15.421, de 1º de junho de 2026 (art. 67), diz que os sistemas de ensino deverão ajustar os calendários para que as férias escolares do primeiro semestre de 2027, nas redes pública e privada, abranjam todo o período entre a abertura e o encerramento da Copa do Mundo Feminina da FIFA 2027."],
              ["Quais são as datas", "A lei não traz as datas. O Parecer CNE/CEB nº 7/2026 informa que a Copa acontece de 24 de junho a 25 de julho de 2027, em oito cidades-sede: Belo Horizonte, Brasília, Fortaleza, Porto Alegre, Recife, Rio de Janeiro, Salvador e São Paulo."],
              ["O que o Conselho Nacional de Educação orienta", "O parecer (aprovado em 6 de agosto de 2026 e homologado pelo Ministro da Educação) diz que cada sistema de ensino tem autonomia para organizar o calendário. Os sistemas dos municípios-sede, das suas regiões metropolitanas e das áreas diretamente impactadas devem fazer os ajustes necessários em 2027. Os demais sistemas, estaduais e municipais, que não serão diretamente impactados, têm autonomia para decidir se adotam a medida total ou parcialmente. Em qualquer caso, continuam valendo os 200 dias letivos e a carga horária mínima."],
              ["E Rio Claro?", "Rio Claro não é cidade-sede e não terá jogos da Copa. Pelo parecer, a decisão sobre as férias de 2027 cabe a cada rede de ensino (municipal, estadual ou particular) que não for diretamente impactada. Ainda não sabemos o que cada uma decidiu: pergunte à Secretaria Municipal da Educação ou à escola."],
              ["A regra pode mudar", "O parecer informa que tramita na Câmara dos Deputados o Projeto de Lei nº 3.481/2026, que trocaria o “deverão” do art. 67 por “poderão”, “tanto quanto possível”. Em 6 de agosto de 2026 ele ainda não tinha sido aprovado; este site não sabe se isso mudou."],
              ["Se você trabalha ou estuda", "Combine com antecedência quem cuida das crianças em julho e pergunte à escola ou à Secretaria se haverá alguma atividade ou programa durante as férias. Este site não confirmou que haja."],
              ["Isto não é o calendário de matrícula", "O período de matrículas e rematrículas de 2027 em Rio Claro continua sem data confirmada: veja “Datas” em “Matricular meu filho pela primeira vez”."]
            ],
            aviso: "A lei e o parecer foram conferidos nos textos oficiais. O que cada rede de Rio Claro decidiu ainda precisa ser confirmado, e o projeto de lei pode ter mudado a regra.",
            fonte: ["Lei nº 15.421/2026, art. 67 (DOU de 2/6/2026) e Parecer CNE/CEB nº 7/2026, aprovado em 6/8/2026 e homologado (DOU de 8/9/2026, Seção 1, p. 60)", null, "textos oficiais conferidos por nós"] },
          { nome: "Calendário de 2027 das escolas estaduais", sem_tel: true, resumo: "Ver as datas",
            texto: "Datas fixadas pela Secretaria da Educação do Estado de São Paulo para as escolas da rede estadual (em geral, ensino fundamental II e médio). Não valem automaticamente para a rede municipal de Rio Claro nem para escolas particulares.",
            topicos: [
              ["Começo e fim das aulas", "O ano letivo de 2027 começa em 11 de fevereiro de 2027 e termina em 22 de dezembro de 2027."],
              ["Semestres", "O 1º semestre termina em 6 de julho de 2027 e o 2º semestre começa em 26 de julho de 2027. As férias de julho dos alunos ficam entre essas duas datas."],
              ["Bimestres", "1º: 11/02 a 23/04. 2º: 26/04 a 06/07. 3º: 26/07 a 05/10. 4º: 06/10 a 22/12 (todos em 2027)."],
              ["Recesso escolar", "De 19 de janeiro a 3 de fevereiro de 2027 (antes do início das aulas) e de 23 a 31 de dezembro de 2027 (depois do encerramento)."],
              ["Dias sem aula para os professores planejarem", "Planejamento: 4 e 5 de fevereiro de 2027. Replanejamento: 22 e 23 de julho de 2027. São períodos não letivos: confirme com a escola se haverá aula."],
              ["Dias letivos", "As escolas devem garantir o mínimo de 200 dias letivos. Dias de aula que deixarem de acontecer devem ser repostos, inclusive em sábados e recessos."],
              ["Quem segue este calendário", "A resolução vale para a rede estadual. As redes municipais podem adotar as mesmas diretrizes por adesão (art. 4º); ainda não sabemos se a rede municipal de Rio Claro adotou. Escolas particulares definem o próprio calendário."],
              ["E a Copa do Mundo Feminina?", "O texto da resolução, de 28 de julho de 2026, não menciona a Copa. Ela é anterior ao Parecer CNE/CEB nº 7/2026 (6 de agosto de 2026), que manda ajustar os calendários nos municípios-sede e nas áreas diretamente impactadas e dá autonomia às demais redes. Veja o cartão “Férias escolares de 2027”. Pergunte à escola se o calendário dela foi ajustado: este site não sabe."]
            ],
            aviso: "Cada escola aprova o seu calendário, com base na resolução, e pode ter pequenas diferenças. Confirme sempre o calendário da escola do seu filho.",
            fonte: ["Resolução SEDUC nº 80, de 28 de julho de 2026 (Diário Oficial do Estado de São Paulo, 29/07/2026)", "https://doe.sp.gov.br/executivo/secretaria-da-educacao/resolucao-seduc-n-80-de-28-de-julho-de-2026-20260728112412202010205", "texto oficial conferido por nós"] },
          { nome: "Documentos em situações específicas: o que a pesquisa indica", sem_tel: true, resumo: "Ver o passo a passo",
            texto: "Além da lista geral, alguns casos costumam pedir papéis a mais. Use como roteiro de perguntas para a Secretaria, não como lista oficial.",
            topicos: [
              ["Creche em período integral", "A pesquisa indica que podem pedir comprovante de trabalho dos pais (carteira assinada, holerite ou declaração de trabalho autônomo) e, em alguns casos, comprovante de renda ou NIS/Bolsa Família como critério de prioridade. Pergunte se há prioridade em Rio Claro e quais comprovantes são aceitos."],
              ["Comprovante de residência", "Em geral, conta recente de água, luz, internet ou telefone fixo. Se você mora de aluguel e a conta não está no seu nome, pergunte se aceitam o contrato de aluguel ou a declaração do proprietário. O endereço pode influenciar a escola oferecida."],
              ["Cartão do SUS", "A pesquisa indica que também pode ser pedido o Cartão do SUS da criança. Leve, se tiver."],
              ["Depois da solicitação no CADU", "Pergunte se é preciso levar cópias dos documentos à escola indicada depois da confirmação."],
              ["Vindo de outra escola (transferência)", "Costuma ser pedida a declaração de transferência e o histórico escolar da escola de origem. Se vier de escola particular, pergunte se pedem declaração de quitação de débitos."],
              ["Criança que vive com avós, tios ou outro cuidador", "Pergunte o que vale quando não há guarda judicial. A pesquisa indica que pode ser pedido o termo de guarda."],
              ["Educação especial (deficiência, TEA)", "Leve laudo médico atualizado e relatórios pedagógicos anteriores, se houver, para a escola organizar o atendimento especializado. Peça à Secretaria a orientação sobre apoio."],
              ["Ensino médio à noite, de 16 a 18 anos (rede estadual)", "A pesquisa indica que a rede estadual pode priorizar quem trabalha e pedir comprovação de trabalho. Confirme na escola estadual."]
            ],
            aviso: "Esta lista vem de pesquisa (inclui informações da rede estadual e de outras cidades) e não foi conferida em fonte oficial de Rio Claro. A Secretaria Municipal da Educação informa os documentos exigidos em cada caso.",
            fonte: ["Pesquisa; sem fonte oficial local conferida", null, "a ser confirmada"] },
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
              ["Peça o registro de que não há vaga", "Se disserem que não há vaga, pergunte se podem dar um documento ou protocolo que registre a falta de vaga e a posição do seu pedido na lista de espera. Não deixe de concluir o pedido no CADU só porque não há vaga: pergunte à Secretaria se o cadastro e o protocolo colocam o seu filho na lista de espera."],
              ["Ministério Público (Promotoria da Infância e Juventude)", "Se o Conselho Tutelar e a Secretaria não resolverem, a família pode procurar a Promotoria da Infância e Juventude. Confirme o endereço e a forma de atendimento antes de ir."],
              ["Guarde as provas", "Protocolo, nomes de atendentes, datas e respostas por escrito ajudam em qualquer pedido de ajuda."]
            ],
            fonte: ["ECA (Lei 8.069/1990), arts. 53 e 54", null, "regra geral"] }
        ]
      }, {
        titulo: "Canais oficiais",
        tipos: ["creche"], subtipos: ["secretaria"],
        links: [
          ["Secretaria Municipal da Educação", "https://rioclaro.sp.gov.br/secretaria/secretaria-da-educacao/", "Orientações sobre a rede municipal e a matrícula."],
          ["Consulta pública da demanda escolar", "https://www.educacaorc.com.br/?r=demandaescolar", "Informações disponibilizadas no portal da Educação."],
          ["Rematrículas na rede municipal (Prefeitura de Rio Claro)", "https://rioclaro.sp.gov.br/educacao/rio-claro-abre-rematriculas-para-estudantes-da-educacao-infantil/", "Página da Prefeitura sobre as rematrículas pelo aplicativo CADU."],
          ["Secretaria Escolar Digital (SED): consulta pública de matrícula, rede estadual", "https://sed.educacao.sp.gov.br/ConsultaPublica/Index", "Para escolas estaduais. Indicado pela pesquisa; confira se a página abre e se atende o seu caso."]
        ]
      }, {
        titulo: "Escolas municipais de Rio Claro", ancora: "educacao-escolas", recolhida: true,
        descricao: "Lista oficial da Prefeitura, com endereço e telefone. Ela não diz quais etapas cada escola atende (berçário, maternal, pré-escola ou ensino fundamental) nem se há vaga: ligue para confirmar. Para pedir a vaga, use o aplicativo CADU (veja o guia acima).",
        filtro: "Procurar escola pelo nome ou bairro", filtroExemplo: "Ex.: Jardim Novo, Santana, Cidade Jardim",
        tipos: ["creche"], subtipos: ["escola_municipal"], links: []
      }, {
        titulo: "Para você: concluir os estudos e se qualificar", ancora: "educacao-voce",
        descricao: "Você também pode estudar. Terminar o ensino médio, fazer faculdade e cursos profissionalizantes ou técnicos abre caminho para o trabalho. Há também um cursinho gratuito para o vestibular e o ENEM (as provas que dão acesso à faculdade), que serve para você e para os seus filhos, com contato pelo Instagram. Para uma formação mais longa, de anos, veja a seção “Formação mais longa (anos)”, logo abaixo. Cada cartão diz quem oferece e como confirmar vagas, datas e custos com a própria instituição.",
        tipos: ["emprego_curso"], agrupar: true,
        subtipos: ["eja", "escola_sesi", "graduacao", "curso_superior_tecnologia", "curso_tecnico", "curso_profissionalizante", "cursinho_popular", "eja_unesp"],
        links: []
      }, {
        titulo: "Formação mais longa (anos)", ancora: "educacao-formacao-longa",
        descricao: "Graduações e cursos que levam anos e são gratuitos. Oferta, prazos e regras mudam a cada edital ou período: confirme sempre na página de cada instituição antes de se inscrever.",
        tipos: [], links: [
          ["UNIVESP", "https://univesp.br/", "Graduações gratuitas a distância, com apoio em polos presenciais."],
          ["Vestibular da UNIVESP", "https://vestibular.univesp.br/", "Há vestibular: veja aqui as datas atuais e se há inscrição aberta."],
          ["IFSP — Instituto Federal de São Paulo", "https://www.ifsp.edu.br/", "Cursos técnicos e superiores gratuitos; a oferta e os prazos mudam a cada edital, e alguns já estão encerrados. Veja o que está aberto agora."],
          ["Senac São Paulo — Programa Senac de Gratuidade", "https://www.sp.senac.br/", "Oferece bolsas integrais em cursos. A regra divulgada é renda de até dois salários mínimos por pessoa da família, com vaga por ordem de inscrição e prazo antes de a turma começar: confira as regras atuais no site."]
        ]
      }],
      avisos: ["Uma escola ou creche cadastrada não confirma que há vaga. Confirme com a Secretaria da Educação."],
      pendencias: [
        "As regras de Rio Claro ainda não foram arquivadas de fonte oficial: o passo a passo acima segue a regra geral e as informações de pesquisa, e três pontos precisam ser confirmados com a Secretaria Municipal da Educação: (1) o calendário e o procedimento de novas matrículas para 2027, inclusive se o aplicativo CADU continua sendo o canal (a Prefeitura o confirmou como canal de matrícula em publicação de 17/10/2025); (2) como solicitar e acompanhar vaga em creche, e o que fazer quando não há vaga; (3) quais documentos e canais são exigidos hoje em cada etapa (creche, pré-escola, ensino fundamental e EJA).",
        "A lista de escolas estaduais com endereço e telefone ainda não está neste site. As escolas municipais estão na seção “Escolas municipais de Rio Claro”."
      ]
    },
    {
      exemploDuvida: "meu filho usa drogas, onde pedir ajuda?", id: "saude", nome: "Saúde", icone: "saude",
      intro: "Unidades de saúde e serviços de atendimento, mamografia, preventivo e pré-natal. Em urgência médica, ligue 192.",
      guia: {
        titulo: "O que você encontra nesta página",
        texto: "Cuidar de quem você ama também cansa. Aqui estão a saúde para você e os caminhos para quando um filho ou outro familiar usa álcool ou drogas.",
        itens: [
          { titulo: "Preciso de atendimento urgente", texto: "UPAs e hospitais, com endereço e telefone. Em urgência médica, ligue 192 (SAMU).", ancora: "saude-unidades", botao: "Ver UPAs e hospitais" },
          { titulo: "Quero ser atendida no posto de saúde", texto: "Os postos de saúde (UBS e USF) de Rio Claro, com endereço e telefone. Ligue antes para saber como ser atendida.", ancora: "saude-unidades", botao: "Ver os postos de saúde" },
          { titulo: "Preciso de ajuda para a saúde mental", texto: "O CVV, no 188, conversa 24 horas por dia, de graça. Os CAPS, serviços de saúde mental da rede pública, estão na lista de unidades.", ancora: "saude-unidades", botao: "Ver os CAPS" },
          { titulo: "Preciso de remédio", texto: "A Farmácia Central e o Dispensário de Medicamentos estão na lista de unidades. Ligue para saber o que é preciso levar.", ancora: "saude-unidades", botao: "Ver as farmácias" },
          { titulo: "Quero fazer mamografia ou preventivo, ou estou grávida", texto: "Como conseguir mamografia e Papanicolau em Rio Claro, o que o Ministério da Saúde orienta e como começar o pré-natal.", ancora: "saude-mulher", botao: "Ver saúde da mulher" },
          { titulo: "Meu filho ou familiar usa álcool ou drogas", texto: "Por onde começar, o que fazer numa crise, onde ligar e como cuidar de você nesse caminho. A culpa não é sua.", ancora: "saude-familia-drogas", botao: "Ver o que fazer" },
          { titulo: "Unidades de saúde", texto: "Postos, UPAs, hospitais e especialidades, com endereço e telefone.", ancora: "saude-unidades", botao: "Ver as unidades" }
        ]
      },
      secoes: [
        {
          titulo: "Saúde da mulher: mamografia, preventivo e gravidez", ancora: "saude-mulher",
          descricao: "Os exames de prevenção e o pré-natal começam na unidade de saúde perto de você. Aqui está o que a Fundação Municipal de Saúde e o Ministério da Saúde publicaram, o que este site não conseguiu confirmar e onde ligar. Este site não faz diagnóstico: quem avalia o seu caso é a equipe de saúde.",
          tipos: [], links: [
            ["Nota Técnica nº 626/2025: mamografia no SUS (Ministério da Saúde)", "https://ninho.inca.gov.br/jspui/bitstream/123456789/17713/1/SEI_0050548355_Nota_Tecnica_626.pdf", "Explica quem tem acesso à mamografia no SUS e quais sinais pedem procurar a unidade em qualquer idade."],
            ["Teste de DNA-HPV no SUS (Ministério da Saúde, 15/08/2025)", "https://www.gov.br/saude/pt-br/assuntos/noticias/2025/agosto/ministerio-da-saude-oferta-tecnologia-inovadora-100-nacional-para-detectar-cancer-do-colo-do-utero-no-sus", "Notícia do Ministério sobre o teste que vai substituir o Papanicolau aos poucos."],
            ["Pré-natal (Ministério da Saúde)", "https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/g/gravidez/pre-natal", "Quando começar, onde ir e como é o acompanhamento."],
            ["CNES (DATASUS): cadastro dos estabelecimentos de saúde, competência 08/2026", "https://cnes.datasus.gov.br/", "Cadastro oficial usado para ver quais unidades públicas registram mamografia e pré-natal. Cadastro não é vaga nem agenda."],
            ["Cadu na Prefeitura de Rio Claro (25/08/2023)", "https://rioclaro.sp.gov.br/fundacao-de-saude/nova-central-para-agendamento-de-consultas-comeca-a-operar-na-2a-feira-em-rc/", "Notícia de 2023: o Cadu agenda consultas nas unidades básicas e o Papanicolau por telefone."]
          ],
          canais: [
            { nome: "Mamografia: como conseguir em Rio Claro", tel: "0800 019 0505", resumo: "Ver o passo a passo",
              texto: "A mamografia é o exame que procura sinais de câncer de mama. O caminho em Rio Claro começa numa consulta na unidade de saúde.",
              topicos: [
                ["O que a Fundação de Saúde informou em 07/10/2026", "A Fundação Municipal de Saúde informou que, a partir dos 40 anos, todas as mulheres têm direito ao rastreamento do câncer de mama por mamografia, que pode ser pedida nas unidades de saúde. Informou também que Rio Claro não tinha fila para mamografia nem para Papanicolau naquela data. Isso pode mudar: confirme na unidade."],
                ["Quem pede o exame", "Segundo a Fundação, a mamografia é feita a partir de um pedido do médico ou do enfermeiro. Por isso o primeiro passo é uma consulta na sua unidade de saúde."],
                ["Como marcar a consulta", "Direto na unidade de saúde ou pelo Cadu (telefone e WhatsApp), no 0800 019 0505. A ficha do Cadu está na lista de unidades, mais abaixo."],
                ["Onde o exame é feito", "No cadastro do CNES (agosto de 2026), o AME (Ambulatório Médico de Especialidades de Rio Claro, da Secretaria de Estado da Saúde) é a única unidade pública cadastrada na cidade que registra a mamografia como serviço próprio. Quatro UBS registram a mamografia como serviço feito por outro estabelecimento: nelas você faz a consulta e recebe o pedido, e o exame é feito em outro lugar, que a unidade informa. Cadastro não é agenda nem vaga: confirme com a sua unidade."],
                ["O que o Ministério da Saúde orienta", "A Nota Técnica nº 626/2025 diz que o rastreamento regular pelo SUS é para mulheres de 50 a 74 anos, a cada dois anos. Para quem tem de 40 a 49 anos, ou mais de 74, e não tem sintomas, o SUS não impede o exame: a mulher pode pedir, desde que um profissional de saúde explique os riscos e os benefícios. A idade que a Fundação cita (a partir de 40 anos) e a do rastreamento regular do Ministério (50 a 74 anos) se completam: pergunte na unidade o que vale para o seu caso."],
                ["Se você notou uma alteração na mama", "Procure a unidade em qualquer idade, sem esperar a data do exame. O Ministério lista como sinais de alerta: nódulo endurecido ou que vai crescendo, saída de sangue por um dos mamilos, pele da mama com aspecto de casca de laranja ou repuxada, mudança no formato do mamilo, lesão de pele na mama que não melhora com pomada, caroço na axila e mama inflamada que não melhora depois do antibiótico. O Ministério diz que a mulher com um sinal de alerta deve ter prioridade na marcação. Isto não é diagnóstico: só a equipe de saúde avalia."]
              ],
              aviso: "A informação sobre fila e idade é de uma publicação da Fundação de 07/10/2026 e pode mudar. Este site não sabe os dias e os horários de coleta de cada unidade, nem se há mutirão agora: ligue antes de ir. Ter direito ao exame não garante data nem vaga.",
              fonte: ["Fundação Municipal de Saúde de Rio Claro: Outubro Rosa reforça importância de exames preventivos", "https://rioclaro.sp.gov.br/fundacao-de-saude/outubro-rosa-reforca-importancia-de-exames-preventivos/", "Publicada em 07/10/2026; página aberta e lida em 31/10/2026. A parte nacional vem da Nota Técnica nº 626/2025 do Ministério da Saúde (INCA), lida na íntegra na mesma data. Os serviços por unidade vêm do cadastro do CNES, competência 08/2026 (tabelas rlEstabServClass e tbEstabelecimento), lido em 31/10/2026."] },
            { nome: "Preventivo do colo do útero: Papanicolau e teste de DNA-HPV", tel: "0800 019 0505", resumo: "Ver o passo a passo",
              texto: "O exame preventivo procura alterações no colo do útero antes de elas causarem sintomas. Em Rio Claro, a Fundação cita o Papanicolau.",
              topicos: [
                ["Como conseguir em Rio Claro", "Segundo a Fundação (07/10/2026), o Papanicolau é feito a partir de um pedido do médico ou do enfermeiro: marque consulta direto na unidade ou pelo Cadu, no 0800 019 0505. Em 2023 a Prefeitura já informava que o Papanicolau pode ser agendado por telefone pelo Cadu."],
                ["Para quem é o rastreamento", "O Ministério da Saúde indica o rastreamento organizado do câncer do colo do útero para mulheres de 25 a 64 anos."],
                ["O teste novo: DNA-HPV", "Desde agosto de 2025, o Ministério da Saúde oferece no SUS o teste de DNA-HPV, que vai substituir o Papanicolau aos poucos. Começou em 12 estados, em um município de cada um. Com resultado negativo, o Ministério fala em repetir o teste em até cinco anos. Este site não encontrou informação de que o DNA-HPV já seja feito em Rio Claro: a Fundação cita o Papanicolau. Pergunte na sua unidade qual exame é feito."]
              ],
              aviso: "O que vale em Rio Claro é o que a sua unidade informar. Este site não sabe quando o DNA-HPV chega à cidade, nem o intervalo que a Fundação usa hoje para repetir o Papanicolau. Isto não é diagnóstico.",
              fonte: ["Fundação Municipal de Saúde de Rio Claro: Outubro Rosa reforça importância de exames preventivos", "https://rioclaro.sp.gov.br/fundacao-de-saude/outubro-rosa-reforca-importancia-de-exames-preventivos/", "Publicada em 07/10/2026; página aberta e lida em 31/10/2026. O DNA-HPV vem da notícia do Ministério da Saúde de 15/08/2025, também lida em 31/10/2026."] },
            { nome: "Pré-natal: quando e onde começar", sem_tel: true, resumo: "Ver o passo a passo",
              texto: "O pré-natal é o acompanhamento da gravidez. Quanto mais cedo começa, melhor a equipe consegue acompanhar você e o bebê.",
              topicos: [
                ["Quando começar", "Assim que descobrir ou desconfiar da gravidez, de preferência até a 12ª semana, segundo o Ministério da Saúde."],
                ["Onde ir", "Na unidade de atenção básica mais próxima da sua casa (UBS ou USF). A lista de unidades, com endereço e telefone, está mais abaixo. No cadastro do CNES (agosto de 2026), 17 UBS e USF de Rio Claro registram o acompanhamento do pré-natal como serviço próprio, em vários bairros. A Prefeitura informa que o Cadu, no 0800 019 0505, agenda consultas nas unidades básicas."],
                ["Como é o acompanhamento", "O Ministério fala em consultas todo mês até a 28ª semana, a cada 15 dias da 28ª à 36ª semana e toda semana no fim da gravidez. Depois do parto, também há consulta na unidade."],
                ["Atendimento ginecológico e da gravidez fora de hora", "Rio Claro tem o Pronto Atendimento de Ginecologia e Obstetrícia, na Av. 15, s/n, Centro, anexo à maternidade, telefone (19) 3535-7002, que a lista da Fundação indica como aberto 24 horas. Veja a ficha dele em Unidades de saúde, mais abaixo, e confirme por telefone."]
              ],
              aviso: "Este site não traz o número mínimo de consultas nem a lista de exames do pré-natal, porque a página do Ministério que consultamos não os informa. A equipe da unidade explica o que vale para você. Em urgência, ligue 192.",
              fonte: ["Ministério da Saúde: Pré-natal", "https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/g/gravidez/pre-natal", "Página aberta e lida em 31/10/2026; ela não mostra data de atualização. O Pronto Atendimento vem da lista de endereços da Fundação Municipal de Saúde (10/10/2026). As 17 UBS e USF vêm do cadastro do CNES, competência 08/2026, lido em 31/10/2026."] }
          ]
        },
        {
          titulo: "Meu filho ou familiar usa álcool ou drogas", ancora: "saude-familia-drogas",
          descricao: "Muitas mães passam por isso, e ninguém precisa enfrentar sozinha. Você pode ligar e pedir orientação mesmo que a pessoa ainda não queira se tratar.",
          tipos: ["saude"], subtipos: ["caps"], links: [],
          canais: [
            { nome: "Por onde começar", sem_tel: true, resumo: "Ver o passo a passo",
              texto: "Ligue antes e conte a situação em poucas palavras. Peça orientação sobre como a pessoa e a sua família podem ser atendidas.",
              topicos: [
                ["Se a pessoa já é adulta", "O CAPS AD (Centro de Atenção Psicossocial Álcool e Drogas) é o serviço de saúde de Rio Claro para quem usa álcool ou drogas. Ligue e pergunte como é o primeiro atendimento e se a família pode ser orientada."],
                ["Se tem menos de 18 anos", "O CAPS Infantojuvenil atende crianças e adolescentes. O Conselho Tutelar (área Assistência Social) também orienta sobre a proteção de crianças e adolescentes."],
                ["Se é uma crise (agitação, risco de vida, overdose)", "Ligue 192 (SAMU). O CAPS III funciona 24 horas, segundo a fonte abaixo: confirme por telefone."],
                ["Se há violência em casa", "Se você tem medo, ou se alguém a agride ou ameaça, use o botão “Em perigo agora?”. Sua segurança vem primeiro."],
                ["Para você", "O CRAS e o CREAS (área Assistência Social) orientam famílias. Pergunte também se há grupo ou acolhimento para quem cuida: os grupos de ajuda mútua de Rio Claro estão logo abaixo. Procure cuidar da sua própria saúde e do seu descanso."]
              ],
              fonte: ["Fundação Municipal de Saúde — endereços das unidades", "https://www.saude-rioclaro.org.br/enderecos.htm", "conferido em 10/10/2026; horários e formas de acesso devem ser confirmados por telefone"] },
            { nome: "Comunidade Terapêutica Peniel de Rio Claro (informação não confirmada por ligação)", sem_tel: true, resumo: "Ver o que perguntar antes de ir",
              texto: "Av. Brasil, 6620, Distrito Industrial. Telefone: (19) 3534-3227. Pelo nome da entidade, é uma comunidade terapêutica, e quem conhece o lugar, inclusive o autor deste site, informa que pessoas ficam lá para tratar a dependência. No cadastro nacional de estabelecimentos de saúde (CNES) ela aparece como “clínica/centro de especialidade”, que não é o mesmo tipo de serviço. Nada disso foi confirmado por telefone nem por fonte oficial.",
              topicos: [
                ["Pergunte ao ligar", "Se atende o caso do seu familiar (idade, álcool, crack, outras drogas), se aceita mulheres e adolescentes, como é a primeira conversa e se a família pode visitar."],
                ["Comunidade terapêutica não é hospital nem clínica", "É um local de acolhimento, e a permanência deve ser uma escolha da própria pessoa. Pergunte como funciona a entrada, por quanto tempo, se há contrato por escrito, quanto custa (se custa) e quais regras a família precisa cumprir. Desconfie de quem promete cura ou pede dinheiro adiantado."],
                ["Confira se o lugar é regular", "Pergunte se tem licença e quem fiscaliza. A Vigilância Sanitária, o CAPS AD e o CREAS podem orientar a família sobre o que é preciso olhar antes de decidir."],
                ["Se houver maus-tratos", "Se souber de ameaça, agressão ou pessoa impedida de sair contra a vontade, procure o Conselho Tutelar (se for menor de 18 anos), a Polícia (190) ou o Ligue 180, conforme o caso. Denúncias também podem ser feitas à Vigilância Sanitária e ao Ministério Público."]
              ],
              aviso: "Não conferimos o que o lugar oferece, nem se há vaga, nem se atende mulheres, nem se está regular. Não substitui o CAPS AD: ligue também para a rede de saúde.",
              fonte: ["CNES/DATASUS (cadastro nacional) e relato do autor do site", null, "endereço e telefone vistos no cadastro em 10/10/2026; razão social informada pelo autor; atendimento não confirmado"] },
            { nome: "Grupos de ajuda mútua: para que serve cada um", sem_tel: true, resumo: "Ver a diferença entre eles",
              texto: "Além do CAPS AD, existem grupos em que as pessoas se ajudam entre si. Os grupos de ajuda mútua são anônimos e não cobram para participar; por isso quase nunca há cadastro público. Abaixo estão os de Rio Claro que conseguimos confirmar.",
              topicos: [
                ["AA – Alcoólicos Anônimos", "Para quem quer parar de beber. O único requisito é o desejo de parar de beber."],
                ["NA – Narcóticos Anônimos", "Para quem quer parar de usar drogas. O único requisito é o desejo de parar de usar."],
                ["Al-Anon", "Para familiares e amigos de quem tem problema com álcool."],
                ["Alateen", "Para jovens de 13 a 19 anos afetados pelo alcoolismo de um familiar ou amigo."],
                ["Amor Exigente", "Grupo de apoio a familiares e dependentes químicos."],
                ["Diferença para o CAPS AD", "O CAPS AD é um serviço de saúde pública, com equipe profissional. Os grupos são de ajuda entre pessoas, sem equipe de saúde, e um não substitui o outro."]
              ],
              fonte: ["Ministério do Desenvolvimento e Assistência Social: Tratamento e Reinserção Social", "https://www.gov.br/mds/pt-br/privados/obid/tratamento-e-reinsercao-social", "página consultada em 11/10/2026; o Amor Exigente é descrito pelo próprio grupo"] },
            { nome: "NA – Grupo Gratidão (Rio Claro)", sem_tel: true,
              texto: "Narcóticos Anônimos, para quem tem problema com drogas. Reuniões às terças, quintas e domingos, às 20h. Local: Capela São Benedito, Avenida 5, sem número, Consolação, CEP 13503-254. Linha de ajuda do NA: 132. Site: na.org.br.",
              aviso: "Informação de contato direto e da placa do grupo, não de fonte oficial. Confirme os dias e os horários antes de ir.",
              fonte: ["Placa do grupo e contato direto", null, "informada pelo autor do site e conferida em 12/10/2026"] },
            { nome: "NA – Grupo Viver Limpo (Rio Claro)", sem_tel: true,
              texto: "Narcóticos Anônimos, para quem tem problema com drogas. Local: Avenida Trinta, CEP 13500-550. Os dias e os horários das reuniões ainda não foram informados. Linha de ajuda do NA: 132.",
              aviso: "Informação de contato direto, não de fonte oficial. Ligue para o 132 ou procure o grupo para confirmar dia, horário e o local exato.",
              fonte: ["Contato direto", null, "informada pelo autor do site em 12/10/2026; sem dia nem horário"] },
            { nome: "Amor Exigente (Rio Claro)", sem_tel: true,
              texto: "Grupo de apoio a familiares e dependentes químicos. Reuniões toda segunda-feira, às 20h. Local: Rua P4 com Avenida P25, Vila Paulista, no espaço da igreja Santo Antônio. E-mail do Amor Exigente: faleconosco@amorexigente.org.br.",
              aviso: "Informação do cartaz do grupo e de contato direto, não de fonte oficial. Confirme o horário e o local antes de ir.",
              fonte: ["Cartaz do grupo e contato direto", null, "informada pelo autor do site e conferida em 12/10/2026"] }
          ]
        },
        { titulo: "Unidades de saúde", ancora: "saude-unidades", tipos: ["saude"], agrupar: true, links: [] }
      ],
      pendencias: [
        "A lista segue a página “Endereços das unidades de saúde” da Fundação Municipal de Saúde (10/10/2026), conferida com o cadastro do CNES. Telefones e horários podem mudar: confirme com a unidade.",
        "Hospital Público Municipal Maria Thereza Ramos Vitti: o nome consta no CNES, mas nenhuma fonte consultada traz o endereço e o telefone. Ligue para a Fundação Municipal de Saúde."
      ]
    },
    {
      exemploDuvida: "preciso de advogado de graça", id: "direitos", nome: "Direitos", icone: "direitos",
      intro: "Orientação jurídica, separação, pensão, aposentadoria, dívidas e proteção contra a violência.",
      guia: {
        titulo: "O que você encontra nesta página",
        texto: "Escolha a sua situação. Se você está em perigo agora, use o botão “Em perigo agora?” no topo da página ou ligue 190.",
        itens: [
          { titulo: "Sofro violência ou tenho medo de alguém", texto: "Os canais de proteção, a Delegacia de Defesa da Mulher, a Patrulha Maria da Penha e a Defensoria. Violência contra a mulher: ligue 180, 24 horas, de graça.", ancora: "secao-2", botao: "Ver os canais de proteção" },
          { titulo: "Preciso de pensão ou da guarda dos filhos (ou dos netos)", texto: "Como pedir a pensão, o que levar e como falar com a Defensoria.", ancora: "secao-1", botao: "Ver pensão e guarda" },
          { titulo: "Preciso de orientação jurídica sem poder pagar advogado", texto: "A Defensoria Pública atende quem não tem condições de pagar: como agendar e o que levar.", ancora: "secao-1", botao: "Ver a Defensoria" },
          { titulo: "Aposentadoria e dívidas", texto: "Simular a aposentadoria no Meu INSS e onde buscar ajuda com dívidas.", ancora: "secao-3", botao: "Ver aposentadoria e dívidas" }
        ]
      },
      secoes: [
        {
          titulo: "Separação, pensão e guarda", ancora: "secao-1",
          tipos: [],
          canais: [
            { nome: "Pensão alimentícia: como pedir e o que levar", sem_tel: true, resumo: "Ver o passo a passo",
              texto: "Para pedir pensão para um filho ou para um neto que vive com você. A pensão é pedida na Justiça.",
              topicos: [
                ["Onde pedir", "O Senado informa que é preciso procurar um advogado ou a Defensoria Pública. A Defensoria é para quem não pode pagar as despesas do processo sem prejudicar o sustento próprio e o da família. O cartão logo abaixo explica como falar com a Defensoria de Rio Claro."],
                ["Quem comparece", "Se quem vai receber a pensão tem mais de 18 anos, é a própria pessoa. Se é menor de idade, é quem tem a guarda. Se a pessoa está doente ou não pode ir, pode fazer uma procuração para alguém ir no lugar dela."],
                ["O que levar: se quem vai receber é menor de 18 anos", "Certidão de nascimento da criança ou do adolescente. RG, CPF e comprovante de residência de quem é responsável por ela. O endereço de casa ou do trabalho de quem deve pagar a pensão."],
                ["O que levar: se quem vai receber tem mais de 18 anos", "RG, CPF e comprovante de residência de quem vai pedir a pensão, e o endereço de casa ou do trabalho de quem deve pagar."],
                ["Se o pai não consta na certidão de nascimento", "O Senado informa que é preciso que o nome do pai conste da certidão e que, se não constar, é necessário propor uma ação de investigação de paternidade. A Defensoria ou o advogado explica como. Pergunte a eles se há outro caminho no seu caso."],
                ["Se você cria os netos e não tem a guarda", "O Senado informa que, quando quem recebe a pensão é menor de idade, quem comparece é quem tem a guarda. Procure a Defensoria para avaliar como regularizar a guarda e pedir a pensão."],
                ["Uma lei nova, que ainda não vale", "A Lei nº 15.479/2026, conhecida como Lei do Pix Pensão, prevê que a pensão seja descontada automaticamente da conta de quem deve pagar e passada para a conta de quem recebe, por determinação da Justiça. Ela só entra em vigor em julho de 2027."]
              ],
              aviso: "A orientação sobre como pedir e quais documentos levar vem de um texto do Senado Federal de 04/09/2012: leis e procedimentos podem ter mudado, então confirme na Defensoria ou com o advogado. Este texto não diz qual será o valor da pensão nem o que a Justiça vai decidir.",
              fonte: ["Senado Federal (Agência Senado e Rádio Senado)", "https://www12.senado.leg.br/noticias/especiais/especial-cidadania/pensao-alimenticia-atende-necessidades-basicas-e-padrao-de-vida/como-fazer-para-pedir-pensao-alimenticia", "“Como fazer para pedir pensão alimentícia” (04/09/2012) e “Nova lei cria transferência automática da pensão alimentícia” (30/07/2026), impressas em 15/10/2026"] },
            { nome: "Defensoria Pública: como pedir ajuda jurídica gratuita (pensão, guarda, reconhecimento do pai)", tel: "0800 773 4340", resumo: "Ver o passo a passo",
              texto: "Para quem não pode pagar advogado. Vale para pedir pensão, regularizar a guarda de um filho ou de um neto e tratar do reconhecimento do pai.",
              topicos: [
                ["Quem a Defensoria atende", "Pessoas que não têm condições de pagar advogado. Em geral, famílias com renda de até 3 salários mínimos por mês. O limite pode subir para 4 salários mínimos em alguns casos: família com mais de 5 pessoas; gastos comprovados com tratamento de doença grave ou com remédio de uso contínuo; pessoa com deficiência na família; ou pessoa idosa na família, desde que ela tenha 4 ou mais membros. Em caso de violência doméstica e familiar contra a mulher, o atendimento independe da renda."],
                ["Como agendar", "Pelo portal da Defensoria (defensoria.sp.def.br), pelo celular ou pelo computador, com a assistente virtual Júlia, que a Defensoria diz estar disponível 24 horas. Dá para entrar com a conta gov.br ou só com o nome e o CPF. Também dá para ligar para o 0800 773 4340, das 7h às 19h, em dias úteis."],
                ["Se é urgente", "Quem não pode esperar tem vagas com espera reduzida: a Defensoria analisa a urgência de acordo com o caso, considerando se a demora pode causar prejuízo grave ou de difícil reparação. Em finais de semana e feriados há atendimento só de casos urgentes, das 7h às 12h."],
                ["O que levar", "Podem ser pedidos documentos que mostrem a renda e os gastos da família, como carteira de trabalho e holerite, entre outros. O site da Defensoria tem uma página “Documentos para atendimento” e um item “Preparando-se para o atendimento”: veja antes de ir."],
                ["Onde fica", "A unidade de Rio Claro atende na Rua Um, nº 659, bairro Saúde, desde 01/07/2025, segundo a Defensoria. Confirme o endereço antes de ir."],
                ["Cuidado com golpes", "A Defensoria informa que não cobra por atendimento. Desconfie de quem pedir dinheiro para marcar ou para resolver o seu caso."],
                ["O que a Defensoria pode fazer", "Entrar com ações na Justiça, atuar em processos em andamento e promover acordos e conciliações entre as pessoas. No agendamento, pergunte se o seu caso (pensão, guarda ou reconhecimento do pai) pode ser atendido."],
                ["Se você cria os netos e não tem a guarda", "Procure a Defensoria para avaliar o seu caso. Escolas e unidades de saúde têm regras próprias: pergunte lá o que aceitam enquanto isso."]
              ],
              aviso: "Estas informações vêm da Defensoria Pública do Estado de São Paulo (notícia de 26/06/2025, página “Agende seu atendimento” e conta oficial da Defensoria no Instagram, de abril de 2026). O endereço e os horários podem ter mudado: confirme. Este texto não diz se o seu caso será atendido nem o que a Justiça vai decidir sobre pensão ou guarda.",
              fonte: ["Defensoria Pública do Estado de São Paulo", "https://www.defensoria.sp.def.br/", "notícia de 26/06/2025, página “Agende seu atendimento” e postagem da conta oficial da Defensoria (abril de 2026), impressas em 11/10 e 15/10/2026"] }
          ],
          links: [
            ["Defensoria Pública do Estado de São Paulo", "https://www.defensoria.sp.def.br/", "Canais oficiais de orientação jurídica e critérios de atendimento."],
            ["Como fazer para pedir pensão alimentícia — Senado Federal", "https://www12.senado.leg.br/noticias/especiais/especial-cidadania/pensao-alimenticia-atende-necessidades-basicas-e-padrao-de-vida/como-fazer-para-pedir-pensao-alimenticia", "Onde pedir, quem comparece e quais documentos levar (texto de 2012)."],
            ["Nova lei cria transferência automática da pensão alimentícia — Rádio Senado", "https://www12.senado.leg.br/radio/1/noticia/2026/07/30/nova-lei-cria-transferencia-automatica-da-pensao-alimenticia", "A Lei do Pix Pensão (Lei nº 15.479/2026), que entra em vigor em julho de 2027."]
          ]
        },
        {
          titulo: "Violência e proteção", ancora: "secao-2",
          tipos: ["mulher"],
          urgente: true,
          links: [
            ["Ligue 180 — Central de Atendimento à Mulher", "https://www.gov.br/mulheres/pt-br/ligue180", "Canal nacional de atendimento, orientação e encaminhamento."],
            ["Secretaria Municipal da Mulher", "https://rioclaro.sp.gov.br/secretaria/secretaria-da-mulher/", "Contatos institucionais publicados pela Prefeitura."]
          ]
        },
        {
          titulo: "Aposentadoria e dívidas", ancora: "secao-3",
          tipos: [],
          links: [
            ["Procon de Rio Claro", "https://rioclaro.sp.gov.br/secretaria/secretaria-de-justica/", "A página municipal informa os contatos das unidades do Procon, para orientação sobre dívidas de consumo."],
            ["Procon-SP — Apoio ao Superendividado", "https://www.procon.sp.gov.br/espaco-consumidor/#ApoioSuperendividado", "Programa estadual com inscrição online e triagem para quem não consegue pagar dívidas sem comprometer a subsistência."],
            ["Meu INSS — Simular aposentadoria", "https://www.gov.br/pt-br/servicos/simular-aposentadoria", "Projeção do tempo que falta, com base nos vínculos registrados. Não garante concessão de benefício."]
          ]
        }
        ,{
          titulo: "Mais de um serviço ao mesmo tempo", ancora: "secao-4",
          descricao: "Quase nenhuma situação se resolve num lugar só. Aqui está quais serviços de Rio Claro costumam se conectar em cada situação e o que perguntar antes de ir.",
          tipos: [],
          canais: [
            { nome: "Quem atende junto: a rede para a sua situação", sem_tel: true, resumo: "Ver a rede por situação",
              texto: "Em outras cidades e países, o atendimento à mulher foi reunido num só endereço, para ela não ter de descobrir sozinha por onde começar. Este site não encontrou um lugar assim em Rio Claro: cada serviço fica no seu endereço. Esta lista mostra como eles se conectam, para você não começar pelo lugar errado. Você não precisa ir a todos. Em cada um, pergunte para onde encaminham.",
              topicos: [
                ["Violência ou medo de alguém", "Perigo agora: 190. Orientação e encaminhamento, 24 horas e de graça: 180. Depois, a Delegacia de Defesa da Mulher e a Patrulha Maria da Penha; a Secretaria Municipal da Mulher; o CREAS, para o acompanhamento social; a Defensoria, para as medidas na Justiça, a pensão e a guarda dos filhos; e a unidade de saúde ou o pronto atendimento, se houver ferimento ou outro cuidado de saúde. Filhos em risco: Conselho Tutelar."],
                ["Sem trabalho e com filhos pequenos", "1) CRAS: Cadastro Único e orientação sobre benefícios. 2) Secretaria da Educação: creche ou escola dos filhos. 3) Fundo Social, Centro de Qualificação Profissional, SENAI e Senac: cursos. 4) Portal da Empregabilidade, Conecta, PAT e Secretaria de Desenvolvimento Econômico: vagas. Sem creche, o trabalho fica difícil de aceitar: por isso a creche vem antes das vagas."],
                ["Falta comida ou dinheiro para as contas", "CRAS primeiro. Em paralelo, as tarifas sociais de água e de energia (área Moradia). Se houver dívidas, o Procon (área Direitos)."],
                ["Falta de casa ou aluguel que não cabe", "CRAS para a orientação e o Cadastro Único; Habitação, para saber das inscrições e dos programas; tarifas sociais de água e de energia enquanto isso (área Moradia)."],
                ["Pensão, guarda ou separação", "Defensoria Pública, para quem não pode pagar advogado. O CRAS pode ajudar com documentos e com o Cadastro Único. Se há violência, comece pelo primeiro item desta lista."],
                ["Cuido de um neto, de um pai ou de uma mãe", "CRAS, para a orientação e os benefícios da família; Secretaria da Educação, para a matrícula do neto; Defensoria, para avaliar a guarda; unidade de saúde, para o cuidado de quem precisa."]
              ],
              aviso: "A ordem é uma sugestão de por onde começar, não uma regra: cada serviço avalia o seu caso e nenhum garante vaga, benefício ou atendimento. Os serviços citados estão cadastrados nas outras áreas deste site, com endereço, telefone e data de conferência; confirme-os antes de ir. A ideia de mostrar a rede inteira vem dos centros integrados de atendimento à mulher e é uma adaptação para Rio Claro, não um serviço que já exista aqui.",
              fonte: ["Centros de Justiça da Família de Nova York (ENDGBV): ficha oficial de 2025 sobre os serviços reunidos no mesmo lugar", "https://www.nyc.gov/assets/ocdv/downloads/pdf/ENDGBV-FJC-One-Pager-ENGLISH.pdf", "Ideia de organização, conferida em 31/10/2026. Os serviços de Rio Claro seguem as outras áreas deste site."] },
            { nome: "Antes de ir: quatro perguntas para o serviço caber na sua rotina", sem_tel: true, resumo: "Ver as quatro perguntas",
              texto: "Um serviço pode existir e, mesmo assim, não servir: o horário bate com o seu trabalho, a condução custa caro, ou não há com quem deixar as crianças. Faça estas perguntas ao ligar, antes de ir.",
              topicos: [
                ["Fica perto?", "Pergunte como chegar e quantas conduções são. No mapa da página inicial, informe o seu bairro ou o CEP: a distância mostrada é em linha reta e não mostra o tempo da viagem."],
                ["Funciona no meu horário?", "Pergunte os dias e os horários de atendimento e se é preciso agendar. Muitos serviços atendem só em horário comercial: se você trabalha nesse horário, pergunte se há outro dia ou outro canal, como telefone ou WhatsApp."],
                ["Quanto custa chegar e voltar?", "Some a ida e a volta. Se o serviço é gratuito mas o transporte pesa, pergunte se parte do atendimento pode ser feita por telefone ou por mensagem."],
                ["Posso levar as crianças?", "Pergunte se pode ir com os filhos e se há um espaço para eles ficarem durante o atendimento. Este site não confirmou, para nenhum serviço de Rio Claro, que haja esse espaço: não suponha que exista. Peça também para anotar o seu pedido, para você não ter de repetir a história a cada serviço."]
              ],
              aviso: "Estas são perguntas para você fazer, não promessas do serviço. Nenhum dos serviços cadastrados informa, nas fontes consultadas, que ofereça cuidado para as crianças durante o atendimento.",
              fonte: ["Centros de Justiça da Família de Nova York (ENDGBV): cuidado de crianças durante o atendimento, a partir de 3 anos", "https://www.nyc.gov/assets/ocdv/downloads/pdf/ENDGBV-FJC-One-Pager-ENGLISH.pdf", "Ideia de organização, conferida em 31/10/2026. Em Rio Claro, vale como pergunta, não como informação."] }
          ],
          links: []
        }
      ],
      avisos: ["Nunca compartilhe senhas ou códigos de acesso com intermediários. Simulações de aposentadoria são projeções e não garantem benefício."]
    },
    {
      exemploDuvida: "como pagar menos na conta de luz?", id: "moradia", nome: "Moradia", icone: "moradia",
      intro: "Água, energia e habitação: tarifas sociais, programas e benefícios. Há um caminho para avós que criam os netos.",
      guia: {
        titulo: "O que você encontra nesta página",
        texto: "Contas mais baratas e o caminho para a casa própria.",
        itens: [
          { titulo: "Conta de água e de luz mais barata", texto: "A tarifa social do DAAE (água e esgoto) e o que saber sobre a tarifa social de energia.", ancora: "secao-1", botao: "Ver as tarifas" },
          { titulo: "Sou avó e crio meus netos: casa própria", texto: "O que o texto oficial pede para provar que o neto faz parte da família, e por onde começar.", ancora: "secao-3", botao: "Ver o caminho da avó" },
          { titulo: "Casa própria: renda, ordem da fila e o que conta a seu favor", texto: "Os tetos de renda de 2026 e os critérios que a Prefeitura publica. Este site não inscreve nem garante vaga.", ancora: "secao-3", botao: "Ver os critérios" }
        ]
      },
      secoes: [
        {
          titulo: "Água e esgoto — Tarifa Social (DAAE)", ancora: "secao-1",
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
          titulo: "Energia elétrica — Tarifa Social (Elektro)", ancora: "secao-2",
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
          titulo: "Habitação", ancora: "secao-3",
          tipos: [],
          canais: [
            { nome: "Sou avó e crio meus netos: casa própria e moradia", sem_tel: true, resumo: "Ver o passo a passo",
              texto: "Para quem cria neto ou neta e quer entrar na fila da casa própria. O ponto que mais costuma travar é provar que a criança faz parte da sua família. Este cartão mostra o que o texto oficial pede.",
              topicos: [
                ["O que o texto oficial pede", "A Portaria MCID nº 738/2024 dá prioridade a famílias com criança ou adolescente, comprovada por certidão de nascimento, de guarda ou de tutela. A certidão de nascimento do seu neto mostra quem são os pais dele, e não mostra você. Por isso, quando não há guarda nem tutela, a prova pode não ficar completa só com a certidão. A Portaria não diz o que a Prefeitura aceita nesse caso."],
                ["Primeiro passo: pergunte à Secretaria", "Pergunte à Secretaria de Planejamento e Habitação quais documentos ela aceita para provar que o seu neto mora com você e depende de você. Quem decide o que vale é a Secretaria, e não este sistema. Anote o que ela responder e, se puder, peça por escrito."],
                ["Se falta o documento do neto", "Procure a Defensoria Pública antes de depender dessa prova: ela avalia como regularizar a situação legal do seu neto e atende quem não tem condições de pagar. O cartão “Defensoria Pública” da área Direitos explica quem é atendido, como agendar e o que levar. Regularizar essa situação não garante vaga nem prioridade: só deixa em ordem o documento que a Portaria cita."],
                ["Fique como responsável no CadÚnico", "A Portaria também dá prioridade à mulher responsável pela unidade familiar, declarada no CadÚnico. Para isso o cadastro precisa estar feito e atualizado. O passo a passo está no primeiro bloco da área Assistência Social. Pergunte no CRAS como registrar os netos que você cria."],
                ["O que mais pode contar a seu favor", "Pessoa idosa na família é outro critério (a Portaria não informa a idade: confirme). Em caso de empate, a Portaria desempata pela maior idade de quem assina o contrato, e a guarda não entra no desempate. Se você mora com a sua filha e os netos na mesma casa e quer um lugar só seu, isso pode se encaixar em coabitação."],
                ["Se os pais não ajudam", "O cartão “Pensão alimentícia” da área Direitos explica como pedir a pensão para os netos. No caso de criança, quem comparece é quem tem a guarda."]
              ],
              aviso: "Orientação, não decisão: este sistema não sabe quais documentos a Secretaria aceita e não garante vaga, pontuação nem prioridade. Quem confirma é a Secretaria de Planejamento e Habitação. Quando o neto vive com você sem o documento, buscar antes a orientação da Defensoria é o caminho que este projeto recomenda para evitar problemas com a pontuação.",
              fonte: ["Ministério das Cidades (Portaria MCID nº 738/2024), no PDF da Prefeitura de Rio Claro", "https://rioclaro.sp.gov.br/wp-content/uploads/2025/11/CRITERIOS-DE-ELEGIBILIDADE.pdf", "arts. 9º, 11 e 13 da Portaria, lidos em 16/10/2026; a recomendação sobre a Defensoria é deste projeto"] },
            { nome: "Casa própria (Minha Casa, Minha Vida): renda, ordem da fila e o que conta a seu favor", sem_tel: true, resumo: "Ver os critérios",
              texto: "Resumo dos critérios federais que a Prefeitura publica para os empreendimentos habitacionais. Serve para você se preparar e saber o que perguntar na Secretaria de Planejamento e Habitação. Quem confirma inscrição, ordem e documentos é a Prefeitura, não este sistema.",
              topicos: [
                ["Teto de renda", "A Portaria MCID nº 333/2026 (Diário Oficial da União de 01/04/2026) fixa a renda bruta familiar mensal, para quem mora em área urbana: Faixa Urbano 1, até R$ 3.200,00; Faixa Urbano 2, de R$ 3.200,01 até R$ 5.000,00; Faixa Urbano 3, de R$ 5.000,01 até R$ 9.600,00. Renda bruta é a de toda a família somada, antes dos descontos. Nos empreendimentos com recursos do FAR, o critério é a Faixa Urbano 1. A Faixa Urbano 2 só vale quando a Prefeitura indica a família diretamente (veja mais abaixo). Os valores são atualizados todo ano: confirme o teto em vigor na Secretaria."],
                ["O que a lei chama de família", "A Lei nº 11.977/2009 diz que o grupo familiar é formado por uma ou mais pessoas que contribuem para o rendimento da família ou que têm as despesas atendidas por ela, e aceita todas as espécies de família reconhecidas pela lei brasileira, inclusive a de uma pessoa só. A lei fala em despesas atendidas, e não em parentesco. Pela redação, a avó que sustenta os netos se encaixa nessa definição, mas é a Secretaria que decide como registrar a sua família."],
                ["Quem passa na frente", "A Portaria MCID nº 738/2024 manda a Prefeitura ordenar as famílias que cumprem os requisitos dando preferência a quem se enquadra no maior número destes critérios: mulher responsável pela unidade familiar, declarada no CadÚnico; pessoa negra na família, declarada no CadÚnico; pessoa com deficiência, comprovada por avaliação biopsicossocial; pessoa idosa; criança ou adolescente; pessoa com câncer ou doença rara crônica e degenerativa, com laudo médico; mulher vítima de violência doméstica e familiar, com registro da denúncia no Ministério Público; indígenas e quilombolas, declarados no CadÚnico; moradia em área de risco reconhecida pelo mapeamento oficial ou pela Defesa Civil; e contrato desfeito sem culpa do beneficiário. A Lei nº 11.977/2009 também dá prioridade a famílias com mulher responsável pela unidade familiar e a famílias com pessoa com deficiência."],
                ["Se há empate", "Quando várias famílias cumprem o mesmo número de critérios e há menos unidades do que famílias, a Portaria manda desempatar pela maior idade do titular do contrato, comprovada por documento civil com data de nascimento."],
                ["Precisa estar em déficit habitacional", "Além da renda, a família precisa fazer parte do déficit habitacional da cidade, comprovado pelo ateste da Prefeitura e pelas informações de moradia do CadÚnico. A Portaria pede pelo menos uma destas situações: viver em casa precária (parede que não é de alvenaria nem de madeira aparelhada, ou moradia improvisada); coabitação (famílias que moram juntas na mesma casa e querem ter casa só delas, comprovado por autodeclaração); casa alugada com mais de 3 pessoas por dormitório; aluguel que pesa mais de 30% da renda da família, comprovado por contrato ou recibo; aluguel social provisório, comprovado pela Prefeitura; ou situação de rua ou trajetória de rua, que tem regras próprias de atendimento."],
                ["Se você cria os netos", "Veja o cartão “Sou avó e crio meus netos: casa própria e moradia”, logo acima. Ele trata da prova de que o neto faz parte da família, da guarda e da Defensoria."],
                ["Contrato no nome da mulher", "A Lei nº 11.977/2009 diz que os contratos e registros do programa são feitos, de preferência, no nome da mulher. Quando a mulher é a responsável pela família, o contrato pode ser assinado sem a assinatura do cônjuge (exceto quando há dinheiro do FGTS). Em separação ou divórcio, o título do imóvel vai para a mulher (exceto com FGTS); se a guarda dos filhos for só do pai, o título vai para ele. Se isso se aplica ao seu caso, confirme com a Defensoria."],
                ["Indicação direta pela Prefeitura", "A Prefeitura pode indicar famílias sem passar pela ordem da fila nestes casos: perdeu o único imóvel em emergência ou calamidade pública reconhecida pelo governo federal (decretada a partir de 01/01/2023); perdeu o único imóvel por obra pública federal; ou vem de área de risco “alto” ou “muito alto”, limitada a 20% das unidades (30% se a cidade tiver Plano Municipal de Redução de Riscos). Nesses casos o teto de renda é o da Faixa Urbano 2."],
                ["O que costuma ser pedido", "Os textos citam: documento civil com data de nascimento (pessoa idosa e desempate); certidão de nascimento, de guarda ou de tutela (criança ou adolescente); contrato ou recibo de aluguel (aluguel acima de 30% da renda); laudo médico (câncer ou doença rara); avaliação biopsicossocial (deficiência); e declaração no CadÚnico (mulher responsável, pessoa negra, indígenas e quilombolas). A lista final de documentos é da Prefeitura: peça a lista atual na Secretaria."],
                ["Se a renda passa do teto da Faixa 1", "A Portaria 333/2026 vai até R$ 13.000,00 de renda bruta familiar mensal. A CAIXA descreve a modalidade Classe Média, para famílias com renda de até R$ 13 mil, como financiamento: casa ou apartamento novo, usado ou na planta, de até R$ 600 mil; entrada mínima de 20% do valor do imóvel (o FGTS pode ser usado como entrada ou nas parcelas); juros nominais de 10% ao ano; prazo de até 35 anos. O passo a passo da CAIXA é: simulação, análise de crédito com a documentação, análise de engenharia do imóvel e assinatura do contrato. Os textos que recebemos não trazem as condições das Faixas Urbano 2 e 3: consulte a CAIXA. Alô CAIXA: 4004 0 104 (capitais e regiões metropolitanas) ou 0800 104 0 104 (demais regiões)."],
                ["Documentos para pedir financiamento na CAIXA", "Um folheto da CAIXA, criado em maio de 2017, lista os documentos básicos para pedir crédito imobiliário. Quem compra (pessoa física): documento oficial de identificação e comprovante de renda atualizado, emitido há no máximo 2 meses. Para usar o FGTS: última declaração do Imposto de Renda com o recibo de entrega à Receita Federal, e carteira de trabalho ou extrato do FGTS. Do imóvel: certidão atualizada de inteiro teor da matrícula. Quem vende (pessoa física): documento oficial de identificação e comprovante de estado civil. O folheto diz que a CAIXA pode pedir documentos adicionais. Ele tem quase 10 anos: confirme a lista atual com a CAIXA (telefones no tópico anterior). Isto vale para o financiamento pela CAIXA, não para a fila da Prefeitura."],
                ["O que o PDF da Prefeitura não diz", "O arquivo publicado no site da Prefeitura é a Portaria federal na forma geral. Onde ela deixa a escolha para a cidade, aparece só um “x” (distância até o empreendimento e anos de inscrição no cadastro habitacional). Por ele, não dá para saber se Rio Claro usa esses critérios nem com quais números. Pergunte também se há inscrição aberta e como atualizar o cadastro."]
              ],
              aviso: "Resumo de textos oficiais, sem garantia de vaga, de prioridade ou de contemplação. As portarias e a lei podem ter sido alteradas depois: o teto de renda vale desde 01/04/2026 e é atualizado todo ano. A Prefeitura só pede documentos pelos canais oficiais da Secretaria: desconfie de quem cobra para garantir casa.",
              fonte: ["Ministério das Cidades (Portarias MCID nº 738/2024 e nº 333/2026) e Lei nº 11.977/2009", "https://rioclaro.sp.gov.br/wp-content/uploads/2025/11/CRITERIOS-DE-ELEGIBILIDADE.pdf", "Portaria 738/2024 (PDF no site da Prefeitura); Portaria 333/2026 (Diário Oficial da União de 01/04/2026); Lei 11.977/2009 (texto compilado enviado pelo mantenedor); página da CAIXA “Minha Casa, Minha Vida – Classe Média” (impressa em 16/10/2026) e folheto da CAIXA “Documentação básica para solicitação de Crédito Imobiliário” (arquivo de maio de 2017); lidos em 16/10/2026"] }
          ],
          links: [
            ["Critérios de elegibilidade (Portaria MCID 738/2024): PDF da Prefeitura", "https://rioclaro.sp.gov.br/wp-content/uploads/2025/11/CRITERIOS-DE-ELEGIBILIDADE.pdf", "O texto completo da Portaria, como a Prefeitura publica. Foi a fonte do cartão acima."],
            ["Portaria MCID nº 333/2026: limites de renda do Minha Casa, Minha Vida", "https://www.in.gov.br/web/dou/-/portaria-mcid-n-333-de-30-de-marco-de-2026-697065554", "Publicação oficial (Diário Oficial da União, 01/04/2026) com os tetos de renda das faixas. Os valores são atualizados todo ano."],
            ["Minha Casa, Minha Vida – Classe Média (CAIXA)", "https://www.caixa.gov.br/voce/habitacao/minha-casa-minha-vida/classe-media/Paginas/default.aspx", "Página da CAIXA sobre o financiamento para renda de até R$ 13 mil, com o passo a passo e os telefones. Não é o programa da fila da Prefeitura: confirme as condições vigentes na CAIXA."],
            ["Atualização cadastral para programa habitacional: aviso da Prefeitura", "https://rioclaro.sp.gov.br/planejamento-e-habitacao/em-rio-claro-atualizacao-cadastral-para-programa-habitacional-vai-ate-28-de-fevereiro/", "Notícia da Prefeitura sobre a atualização do cadastro habitacional. Veja nela o prazo e como fazer, e confirme na Secretaria se há novo período."],
            ["Aviso da Prefeitura sobre golpe com moradias do programa habitacional", "https://rioclaro.sp.gov.br/planejamento-e-habitacao/criminosos-aplicam-golpe-oferecendo-moradias-do-programa-habitacional-de-rc/", "A Prefeitura alerta que criminosos oferecem moradias do programa. Leia antes de passar documentos ou dinheiro a alguém."],
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
      exemploDuvida: "estou sem comida em casa", id: "assistencia", nome: "Assistência Social", icone: "assistencia", jornada: "assistencia",
      intro: "CRAS, CREAS, Conselho Tutelar e serviços de convivência de Rio Claro.",
      guia: {
        titulo: "O que você encontra nesta página",
        texto: "Caminhos para pedir ajuda, para você e para a sua família.",
        itens: [
          { titulo: "Preciso de ajuda para sustentar minha família", texto: "O Cadastro Único, que é a porta de entrada dos programas do governo: quem pode, o que levar e onde ir.", ancora: "assistencia-cadunico", botao: "Ver o passo a passo" },
          { titulo: "Sou avó ou pessoa idosa", texto: "Netos que moram comigo, aposentadoria e BPC, convivência para pessoas idosas e onde pedir ajuda se alguém usa o meu cartão.", ancora: "assistencia-avo", botao: "Ver o que existe" },
          { titulo: "Qual é o meu CRAS?", texto: "Escreva o nome do seu bairro e veja o CRAS que atende você.", ancora: "secao-1", botao: "Achar o meu CRAS" }
        ]
      },
      secoes: [
        {
          titulo: "Preciso de ajuda para sustentar minha família: comece pelo Cadastro Único", ancora: "assistencia-cadunico",
          descricao: "O primeiro passo para pedir apoio do governo costuma ser o Cadastro Único (CadÚnico), que se faz no CRAS do seu bairro, sem custo.",
          tipos: [],
          canais: [
            { nome: "Cadastro Único e Bolsa Família: passo a passo", sem_tel: true, resumo: "Ver o passo a passo",
              texto: "Como fazer ou atualizar o cadastro e qual é a diferença entre o cadastro e o Bolsa Família. Confirme tudo com o CRAS antes de ir.",
              topicos: [
                ["Se a situação é urgente hoje", "O cadastro leva dias para valer. Se falta comida ou há risco hoje, não espere: procure o CRAS agora, ou ligue para a Secretaria de Desenvolvimento Social, (19) 3522-1930, e diga que é urgente. Se há perigo, use o botão “Em perigo agora?”, no topo da página."],
                ["O que é o Cadastro Único", "O Cadastro Único (CadÚnico) reúne as informações das famílias de baixa renda. Ele é a porta de entrada para programas como o Bolsa Família, a tarifa social de energia elétrica, o Minha Casa Minha Vida, a carteira do idoso e o BPC. Fazer o cadastro não é receber o benefício: cada programa tem as suas regras, e este site não diz se a família tem direito a algum deles."],
                ["Não confunda com o Cadu", "O Cadu é o aplicativo de atendimento digital da Prefeitura de Rio Claro (consulta de saúde, matrícula, cursos, avisos e outros serviços). O Cadastro Único é outro assunto: é o cadastro do governo federal, feito pessoalmente no CRAS."],
                ["Quem pode se cadastrar", "Em geral, podem se inscrever famílias com renda mensal de até meio salário mínimo por pessoa. Famílias com renda acima disso também podem ser cadastradas quando a inscrição for exigida por um programa ou serviço específico. Estar no CadÚnico não garante benefício: cada programa tem suas próprias regras. Fonte oficial lida em 16/10/2026, ainda sem PDF arquivado: ainda não conferido, confirme no CRAS."],
                ["Quem da família deve ir", "Em geral, o Responsável Familiar tem pelo menos 16 anos, mora na casa e responde pela entrevista. Essa pessoa deve ter 16 anos ou mais e, de preferência, ser uma mulher da família; se não houver uma mulher que possa ir, outra pessoa da família pode ser a responsável. A composição deve refletir quem mora no domicílio e compartilha rendas e despesas. Se a criança ou a pessoa atendida precisar de representante legal, como guardião ou tutor, o procedimento é diferente: explique a situação e confirme no CRAS quais documentos de guarda ou tutela são necessários."],
                ["Onde ir", "O cadastro é presencial: não é feito pelo site. Procure o CRAS do seu bairro (veja logo abaixo, em “Seu CRAS”, escrevendo o nome do bairro) e ligue antes para saber o dia, o horário e se é preciso marcar. A Prefeitura também informa um posto do Cadastro Único no Paço Municipal (Rua 3, nº 945, Centro); para saber o horário, ligue para a Secretaria de Desenvolvimento Social, (19) 3522-1930."],
                ["O que levar", "Leve, se tiver, CPF de todos os moradores, documento com foto de quem responde pela família e comprovante de residência; se não houver comprovante, pergunte sobre a declaração de endereço. Leve também os documentos das crianças e dos demais moradores e, se houver, comprovante de matrícula escolar. Se faltar algum documento, não desista: procure o atendimento e pergunte como regularizar. Confirme a lista atual com o CRAS, pois ela pode variar conforme a situação."],
                ["Se você sustenta seus netos com a aposentadoria", "Comece pelo atendimento do Cadastro Único do seu bairro. Explique quem mora na casa, quais netos vivem com você, quem divide as despesas e todas as rendas, inclusive a aposentadoria. Para o CadÚnico, a composição familiar considera quem mora no domicílio e compartilha renda e despesas. A avó ou o avô pode ser Responsável Familiar se cumprir os requisitos do cadastro; se houver guarda, tutela ou representação legal, explique isso e pergunte qual procedimento se aplica. Leve, se tiver, CPF de todos, documento com foto, comprovante de residência e documentos das crianças. Se faltar algum documento, procure o atendimento para saber como regularizar. A inscrição no CadÚnico não garante benefício. O BPC tem regras próprias para definir o grupo familiar e calcular renda; avós não entram automaticamente nesse cálculo. Se não conseguir atendimento, use o contato da Secretaria de Desenvolvimento Social deste cartão. Fontes oficiais lidas em 16/10/2026, ainda sem PDF arquivado: ainda não conferido, confirme no CRAS."],
                ["Depois do atendimento", "Os dados entram no sistema em até 45 dias. Dá para acompanhar pelo aplicativo CadÚnico. O cadastro deve ser atualizado a cada 2 anos, ou antes, se a família mudar de endereço ou se alguém nascer."],
                ["E o Bolsa Família?", "Não é preciso pedir o Bolsa Família: com o CadÚnico atualizado, o governo federal avalia a família. O critério principal é a renda por pessoa. O valor limite é definido pelo governo federal e pode mudar: veja o valor atual em gov.br. Quem escolhe quem recebe é o governo federal, não a Prefeitura, e uma família pode estar no CadÚnico sem receber o benefício."],
                ["Se alguém da família tem 65 anos ou mais, ou tem deficiência", "O BPC é outro benefício. Depois do CadÚnico, ele é pedido ao INSS, pelo telefone 135 ou pelo aplicativo Meu INSS. O pedido é gratuito e não precisa de intermediário. Para o cálculo do BPC, a lei define um grupo familiar específico, que não inclui automaticamente todas as pessoas cadastradas no mesmo domicílio: consulte as regras oficiais do INSS e peça orientação no CRAS."],
                ["Se não conseguir atendimento", "Ligue para a Secretaria de Desenvolvimento Social, (19) 3522-1930, e pergunte quem pode atender."],
                ["Cuidado", "A inscrição no CadÚnico é gratuita. Desconfie de quem cobra ou de sites que prometem benefício. As páginas oficiais são as do gov.br e as da Prefeitura de Rio Claro."]
              ],
              aviso: "Esta orientação vem das páginas oficiais da Prefeitura de Rio Claro e do gov.br, lidas em 16/10/2026. A equipe ainda não conferiu cada ponto no arquivo das páginas, que ainda não foram arquivadas em PDF: ainda não conferido, confirme no CRAS. O horário de atendimento não consta: ligue antes de ir. Este texto não diz se a família tem direito a algum benefício.",
              fonte: ["Prefeitura de Rio Claro (Secretaria de Desenvolvimento Social) e gov.br", "https://desenvolvimentosocial.rc.sp.gov.br/?page_id=3366", "páginas lidas em 16/10/2026, ainda não arquivadas em PDF"] }
          ],
          links: [
            ["Como me cadastro no CadÚnico? — Prefeitura de Rio Claro", "https://desenvolvimentosocial.rc.sp.gov.br/?page_id=3366", "Quem pode, documentos e onde fazer, segundo a Secretaria de Desenvolvimento Social."],
            ["Unidades de atendimento — Prefeitura de Rio Claro", "https://desenvolvimentosocial.rc.sp.gov.br/?page_id=1270", "Endereços de atendimento, inclusive o do Cadastro Único."],
            ["Quem tem direito ao Bolsa Família? — Prefeitura de Rio Claro", "https://desenvolvimentosocial.rc.sp.gov.br/?page_id=3375", "Critérios e funcionamento do programa, segundo a Prefeitura."],
            ["BPC — Prefeitura de Rio Claro", "https://desenvolvimentosocial.rc.sp.gov.br/?page_id=1954", "Página da Secretaria de Desenvolvimento Social sobre o Benefício de Prestação Continuada."],
            ["Perguntas frequentes do Cadastro Único — Ministério do Desenvolvimento e Assistência Social", "https://www.gov.br/mds/pt-br/acoes-e-programas/cadastro-unico/perguntas-frequentes-cadastro-unico", "Orientações federais sobre composição familiar e documentos; página lida em 16/10/2026, ainda sem PDF arquivado."],
            ["Inscrever-se no Cadastro Único — gov.br", "https://www.gov.br/pt-br/servicos/inscrever-se-no-cadastro-unico-para-programas-sociais-do-governo-federal", "Regras federais: quem pode, documentos e como se inscrever."],
            ["Receber o Bolsa Família — gov.br", "https://www.gov.br/pt-br/servicos/receber-o-bolsa-familia", "Regras federais atuais, inclusive o valor de renda por pessoa."],
            ["Como é calculada a renda para o BPC — MDS", "https://www.gov.br/mds/pt-br/acoes-e-programas/SUAS/beneficios-assistenciais/como-calcular-a-renda-per-capita-familiar", "Explica o grupo familiar específico e o cálculo de renda do BPC; não confundir com a composição do CadÚnico."]
          ]
        },
        {
          titulo: "Seu CRAS", ancora: "secao-1", /* ids fixos: o índice do orientador e o gabarito da avaliação apontam para eles; o bloco do CadÚnico entrou antes sem deslocá-los */
          descricao: "O CRAS é a porta de entrada da assistência social, perto de onde você mora.",
          tipos: ["assistencia"], subtipos: ["cras"], busca: "bairro",
          links: [["CRAS e Centros de Convivência — página oficial", "https://desenvolvimentosocial.rc.sp.gov.br/?page_id=1651", "Lista oficial dos CRAS, dos bairros que cada um atende e dos serviços de convivência."]]
        },
        {
          titulo: "Sou avó ou pessoa idosa: convivência, aposentadoria e proteção", ancora: "assistencia-avo",
          descricao: "Quem cria os netos ou sustenta a família depois dos 60 também tem caminhos para si. Aqui estão os que as fontes do projeto confirmam e, com aviso, os que ainda precisam ser conferidos.",
          tipos: [],
          canais: [
            { nome: "Netos que moram comigo: escola, atendimento e documentos", sem_tel: true, resumo: "Ver o passo a passo",
              texto: "Guarda, escola e atendimento de saúde são assuntos diferentes, e cada lugar tem as suas regras. Pergunte em cada um o que aceitam, antes de assumir que é preciso um documento da Justiça.",
              topicos: [
                ["Escola", "Para a matrícula, veja o cartão “Crio meu neto” na área Educação. A Secretaria Municipal da Educação e a escola dizem o que aceitam."],
                ["Atendimento de saúde do neto", "Pergunte no local de atendimento o que aceitam quando quem leva a criança é a avó. Os endereços e os telefones estão na área Saúde."],
                ["Quem responde legalmente pela criança", "Se a escola ou outro lugar pedir a guarda, procure a Defensoria Pública. Ela avalia o caso e atende quem não tem condições de pagar. O cartão está na área Direitos."],
                ["Pensão e casa própria", "Para pedir pensão aos pais, veja o cartão “Pensão alimentícia” na área Direitos. Para a fila da casa própria, veja “Sou avó e crio meus netos” na área Moradia."]
              ],
              aviso: "Orientação do projeto, não decisão: este sistema não sabe o que cada escola ou unidade de saúde aceita. Quem confirma é o próprio lugar.",
              fonte: ["Plano de conteúdo do projeto (item P5) e cartões deste site", null, "orientação; sem fonte oficial local sobre o que cada serviço aceita"] },
            { nome: "Aposentadoria, BPC e a renda da casa", sem_tel: true, resumo: "Ver o que é cada coisa",
              texto: "Aposentadoria e BPC são coisas diferentes, com regras e lugares de pedido diferentes. Este site não decide quem recebe cada um deles.",
              topicos: [
                ["Comece pelo Cadastro Único", "Para os programas do governo, o começo costuma ser o Cadastro Único, feito no CRAS, sem custo. O passo a passo está no primeiro bloco desta área."],
                ["BPC, para quem tem 65 anos ou mais", "O BPC é outro benefício, para quem tem 65 anos ou mais ou tem deficiência. Depois do CadÚnico, ele é pedido ao INSS, pelo telefone 135 ou pelo aplicativo Meu INSS, sem custo e sem intermediário. As regras estão no gov.br."],
                ["Aposentadoria", "A simulação do Meu INSS é só uma projeção: não garante o benefício. Ela está na área Direitos, em “Aposentadoria e dívidas”."],
                ["Conta de água mais barata", "O DAAE tem tarifa social para família inscrita no CadÚnico e para família com pessoa idosa de 65 anos ou mais que receba o BPC. O cartão está na área Moradia."],
                ["O que este site não diz", "Se ter netos em casa ou receber aposentadoria muda o direito a um benefício. Cada programa tem as suas regras, e quem decide é o programa: pergunte no CRAS."]
              ],
              aviso: "Resumo de textos já usados em outros blocos deste site. Valores, regras de renda e prazos mudam: confirme no CRAS, no INSS e no gov.br.",
              fonte: ["Blocos “Cadastro Único e Bolsa Família”, “Aposentadoria e dívidas” e “Água e esgoto” deste site", null, "informativo do DAAE e páginas oficiais já citadas nesses blocos"] },
            { nome: "Convivência, curso e apoio para pessoas idosas", sem_tel: true, resumo: "Ver o que existe",
              texto: "Quem passa o dia com a casa e com os netos também precisa de convivência e de apoio.",
              topicos: [
                ["Convivência para pessoas idosas (65 anos ou mais)", "Cinco CRAS oferecem convivência para pessoas idosas, e há duas unidades parceiras: o Centro de Convivência do Idoso (Abrigo São Vicente de Paulo) e o grupo Protagonistas da Vida (UDAM). A lista com endereço e telefone está na seção “Convivência e apoio”, mais abaixo. O horário não consta na fonte: ligue antes de ir."],
                ["Curso de cuidador de idosos (não conferido)", "Um resumo de notícia da Prefeitura diz que o Fundo Social formou 20 cuidadores de idosos em um curso gratuito de 80 horas, com inscrição pelo Cadu. A página não foi aberta e não sabemos se há nova turma: pergunte ao Fundo Social. Pode ser um caminho de renda para quem já cuida."],
                ["Centro Dia do Idoso (não conferido)", "Um resumo de notícia da Prefeitura diz que o Centro Dia do Idoso tem 60 vagas para idosos semidependentes e que uma segunda unidade foi anunciada, sem abertura confirmada. A página não foi aberta: pergunte no CRAS como pedir vaga."],
                ["Se você está esgotada", "Ficar sozinha com tudo cansa. O CVV, no 188, conversa com quem está sofrendo, 24 horas por dia. As unidades de saúde estão na área Saúde."]
              ],
              aviso: "O curso e o Centro Dia vêm de resumos de notícia, sem a página aberta: confirme com o Fundo Social e com o CRAS antes de ir. A convivência vem do cadastro dos CRAS e das unidades.",
              fonte: ["Prefeitura de Rio Claro: cadastro dos CRAS e das unidades de convivência; resumos de notícias do Fundo Social e do Centro Dia", "https://rioclaro.sp.gov.br/secretaria/fundo-social-de-solidariedade/", "convivência: página dos CRAS impressa em 10/10/2026; curso e Centro Dia: resumos de busca, não conferidos"] },
            { nome: "Alguém usa meu cartão ou minha aposentadoria sem eu querer", sem_tel: true, resumo: "Ver onde pedir ajuda",
              texto: "Se alguém fica com o seu dinheiro contra a sua vontade, você pode pedir ajuda. Veja os canais abaixo.",
              topicos: [
                ["Disque 100", "Recebe denúncias de violações de direitos de pessoas idosas, 24 horas por dia, todos os dias. A ligação é gratuita, de qualquer telefone, fixo ou celular. Qualquer pessoa pode relatar, seja a vítima ou quem conhece o caso. A página oficial não lista tipos de violação: o serviço avalia o que fazer."],
                ["Orientação jurídica", "A Defensoria Pública atende quem não tem condições de pagar. Pergunte a ela o que fazer. O cartão está na área Direitos."],
                ["Perigo agora", "Se há ameaça ou agressão em andamento, ligue 190 (Polícia Militar)."],
                ["Antes de ligar", "Se puder, anote datas, valores e quem usou o dinheiro. Não passe dados de acesso a ninguém que diga ser do banco ou do INSS."]
              ],
              aviso: "Este site não diz se o que aconteceu com você é uma violação nem o que será decidido. Quem avalia é o serviço que você procurar.",
              fonte: ["gov.br: Denunciar violação de direitos humanos (Disque 100)", "https://www.gov.br/pt-br/servicos/denunciar-violacao-de-direitos-humanos", "última modificação 15/12/2025; página impressa em 10/10/2026"] }
          ],
          links: []
        },
        {
          titulo: "Proteção e denúncia", ancora: "secao-2",
          descricao: "Para situações de violência, negligência, abandono ou violação de direitos.",
          tipos: ["assistencia"], subtipos: ["creas", "conselho_tutelar"],
          canais: [
            { nome: "Disque 100 — Disque Direitos Humanos", tel: "100", texto: "Recebe, analisa e encaminha denúncias de violações de direitos humanos, como contra crianças e adolescentes, pessoas idosas, pessoas com deficiência, população LGBTQIA+ e população em situação de rua. Funciona 24 horas por dia, todos os dias, inclusive sábados, domingos e feriados. A ligação é gratuita, de qualquer telefone fixo ou móvel, discando 100.", fonte: ["gov.br — Denunciar violação de direitos humanos (Disque 100)", "https://www.gov.br/pt-br/servicos/denunciar-violacao-de-direitos-humanos", "página com última modificação em 15/12/2025, consultada em 10/10/2026"] }
          ],
          links: [["CREAS — página oficial", "https://desenvolvimentosocial.rc.sp.gov.br/?page_id=114", "O que é o CREAS, quem pode procurar e como acessar."]]
        },
        {
          titulo: "Convivência e apoio", ancora: "secao-3",
          descricao: "Serviços de convivência para crianças, adolescentes, adultos e pessoas idosas, e unidades da APAE.",
          tipos: ["assistencia"], subtipos: ["scfv", "apae"], agrupar: true, recolhida: true,
          links: []
        },
        {
          titulo: "Secretaria e outros canais", ancora: "secao-4",
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
        "Cadastro Único: o horário do CRAS e do posto do Paço Municipal não consta na fonte, e as páginas da Prefeitura e do gov.br citadas no passo a passo foram lidas em 15/10/2026, mas ainda não foram arquivadas em PDF.",
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

  /* Página "Entre Mulheres": serviços que mulheres oferecem a outras mulheres.
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

  /* Áreas com rota própria (#transporte) que NÃO são uma das sete portas da tela inicial: chegam por atalho. */
  var EXTRAS = [{
    id: "transporte", nome: "Transporte", icone: "onibus",
    intro: "Horários de ônibus de Rio Claro, conforme a SOU Transportes. Escolha a linha e o sentido.",
    horarios: true, secoes: []
  }, {
    id: "questionario", nome: "Questionário", icone: "assistencia",
    intro: "Responda marcando alternativas. Você recebe caminhos e serviços para a sua vida, e as respostas de quem autorizar poderão ajudar a Secretaria da Mulher a conhecer as mulheres de Rio Claro.",
    questionario: true, secoes: []
  }];

  function porId(id) {
    for (var i = 0; i < AREAS.length; i++) if (AREAS[i].id === id) return AREAS[i];
    for (var j = 0; j < EXTRAS.length; j++) if (EXTRAS[j].id === id) return EXTRAS[j];
    return null;
  }

  return { AREAS: AREAS, EXTRAS: EXTRAS, EMERGENCIA: EMERGENCIA, REDE_OFERTAS: REDE_OFERTAS, NOTA_FONTE: NOTA_FONTE, porId: porId };
});
