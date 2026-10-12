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
        subtipos: ["pat", "conecta", "credito", "secretaria", "qualificacao", "fundo_social", "curso_profissionalizante", "curso_tecnico", "eja", "escola_sesi"],
        grupos: ["Emprego e orientação", "Cursos gratuitos de qualificação", "Cursos profissionalizantes (qualificação profissional)", "Cursos técnicos (ensino técnico)", "Estudar e se qualificar ao mesmo tempo"],
        links: [
          ["Portal da Empregabilidade de Rio Claro", "https://vagas.rioclaro.sp.gov.br/", "Consultar oportunidades e informações para trabalhadores."],
          ["Trampolim — Governo de São Paulo", "https://www.trampolim.sp.gov.br/", "Consultar oportunidades e cursos disponíveis na plataforma."],
          ["Lei nº 14.542/2023: prioridade no Sine para mulheres em situação de violência", "https://www2.camara.leg.br/legin/fed/lei/2023/lei-14542-3-abril-2023-793992-publicacaooriginal-167489-pl.html", "A lei federal reserva 10% das vagas intermediadas pelo Sine para mulheres em situação de violência doméstica e familiar. Como isso funciona em Rio Claro e o que o atendimento pede, só o PAT pode dizer: pergunte lá."],
          ["Estudar: concluir o ensino médio, faculdade e cursos superiores", "#educacao", "EJA gratuita, Faculdade SESI e os cursos superiores da Fatec estão na área Educação, que também reúne os cursos técnicos e profissionalizantes."]
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
          { titulo: "Para você", texto: "Terminar o ensino médio (EJA), fazer faculdade e cursos profissionalizantes e técnicos para trabalhar: SENAI, Senac, SEST SENAT, Etec e Fatec, além do cursinho gratuito para o vestibular e o ENEM e do EJA da Unesp.", ancora: "educacao-voce", botao: "Ver cursos e estudos para você" },
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
        descricao: "Você também pode estudar. Terminar o ensino médio, fazer faculdade e cursos profissionalizantes ou técnicos abre caminho para o trabalho. Há também um cursinho gratuito para o vestibular e o ENEM (as provas que dão acesso à faculdade), que serve para você e para os seus filhos, com contato pelo Instagram. Cada cartão diz quem oferece e como confirmar vagas, datas e custos com a própria instituição.",
        tipos: ["emprego_curso"], agrupar: true,
        subtipos: ["eja", "escola_sesi", "graduacao", "curso_superior_tecnologia", "curso_tecnico", "curso_profissionalizante", "cursinho_popular", "eja_unesp"],
        links: []
      }],
      avisos: ["Uma escola ou creche cadastrada não confirma que há vaga. Confirme com a Secretaria da Educação."],
      pendencias: [
        "As regras de Rio Claro ainda não foram arquivadas de fonte oficial: o passo a passo acima segue a regra geral e as informações de pesquisa, e três pontos precisam ser confirmados com a Secretaria Municipal da Educação: (1) o calendário e o procedimento de novas matrículas para 2027, inclusive se o aplicativo CADU continua sendo o canal (a Prefeitura o confirmou como canal de matrícula em publicação de 17/10/2025); (2) como solicitar e acompanhar vaga em creche, e o que fazer quando não há vaga; (3) quais documentos e canais são exigidos hoje em cada etapa (creche, pré-escola, ensino fundamental e EJA).",
        "A lista de escolas estaduais com endereço e telefone ainda não está neste site. As escolas municipais estão na seção “Escolas municipais de Rio Claro”."
      ]
    },
    {
      exemploDuvida: "meu filho usa drogas, onde pedir ajuda?", id: "saude", nome: "Saúde", icone: "saude",
      intro: "Unidades de saúde e serviços de atendimento. Em urgência médica, ligue 192.",
      guia: {
        titulo: "O que você encontra nesta página",
        texto: "Cuidar de quem você ama também cansa. Aqui estão a saúde para você e os caminhos para quando um filho ou outro familiar usa álcool ou drogas.",
        itens: [
          { titulo: "Meu filho ou familiar usa álcool ou drogas", texto: "Por onde começar, o que fazer numa crise, onde ligar e como cuidar de você nesse caminho. A culpa não é sua.", ancora: "saude-familia-drogas", botao: "Ver o que fazer" },
          { titulo: "Unidades de saúde", texto: "Postos, UPAs, hospitais e especialidades, com endereço e telefone.", ancora: "saude-unidades", botao: "Ver as unidades" }
        ]
      },
      secoes: [
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
      exemploDuvida: "como pagar menos na conta de luz?", id: "moradia", nome: "Moradia", icone: "moradia",
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
      exemploDuvida: "estou sem comida em casa", id: "assistencia", nome: "Assistência Social", icone: "assistencia", jornada: "assistencia",
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
