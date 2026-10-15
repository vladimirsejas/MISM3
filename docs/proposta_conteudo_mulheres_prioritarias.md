# Proposta de conteúdo para mãe solo, mulher que sustenta a família e avó cuidadora

Escrito em 15/10/2026. **Proposta: nenhum código, dado, catálogo ou teste foi alterado.** Serve para decidir o que entra no próximo ciclo e o que precisa de confirmação humana antes.

Princípio mantido do projeto: orientar, conectar e mostrar lacunas. Não prometer vaga, benefício nem atendimento. Existência de um programa não é a mesma coisa que vaga aberta para a mulher naquele dia.

## 1. Como ler os níveis de confiança

Esta pesquisa foi feita sem conseguir abrir as páginas da Prefeitura: o ambiente bloqueou `rioclaro.sp.gov.br` (proxy responde 403). O que veio de lá chegou como **resumo de uma ferramenta de busca restrita ao domínio**, com link da página. Por isso cada achado leva um nível:

| Nível | Significado | Pode virar texto do site? |
|---|---|---|
| A | Confirmado no repositório (código, catálogo, testes) | Já está no site |
| B | Visto em resumo de busca de página oficial (`rioclaro.sp.gov.br`, `gov.br`); a página não foi aberta | Só depois de abrir a página, ler e registrar a data |
| C | Conhecimento geral ou fonte não oficial | Não. Vira pendência |

## 2. O CADU: o que a pesquisa mostra (e uma correção minha)

**Conclusão: CADU é um único canal digital da Prefeitura, usado por vários serviços. Não são três sistemas.** CadÚnico é outra coisa.

| Nome | O que é | Onde aparece | Nível |
|---|---|---|---|
| CADU (Cadu) | Aplicativo de atendimento digital da Prefeitura, com portal e telefone/WhatsApp 0800 019 0505. Na tela do app: Saúde, Educação, Desenvolvimento Social, Mais; "Cadastro Digital"; "Solicitações Digitais" | DAAE (água e esgoto) e Saúde dividem o **mesmo 0800**: **A**, pela notícia do DAAE arquivada em `docs/documetacao/daae-cadu-atendimento.pdf`. Matrícula e rematrícula; cursos do Fundo Social: B | A (DAAE, Saúde, categorias do app) / B (demais) |
| CadÚnico (Cadastro Único) | Cadastro socioeconômico **federal**, feito pelo CRAS. É a porta de entrada de Bolsa Família, BPC, tarifa social de energia e outros. Estar inscrita **não** garante o benefício | gov.br e MDS; CRAS | B |

**Correção:** na primeira análise falei em "três coisas com nome parecido" (escola, saúde, CadÚnico). A pesquisa mostra que o Cadu da escola e o da saúde são **o mesmo canal**. O problema real é outro: o site fala do Cadu em contextos separados sem dizer que é um canal só, e a mulher pode confundir Cadu com CadÚnico.

**Um terceiro "cadastro" para não confundir (A):** o app do Cadu tem um botão "Cadastro Digital: clique aqui para manter o cadastro atualizado". É o cadastro **do próprio app**, não o CadÚnico. A página do DAAE não diz o que esse cadastro contém nem se ele leva ao CadÚnico, então o site não deve ligar um ao outro. Também fica pendente saber se a categoria "Desenvolvimento Social" do app oferece algo do CRAS; não afirmar até ver.

**Horário do 0800 (A, na notícia do DAAE):** 24 h por telefone e WhatsApp. Atendente humano de segunda a sexta (exceto feriados nacionais), 7h às 19h; assistente virtual de segunda a sexta das 19h às 7h e 24 h em sábados, domingos e feriados. Isso encerra a dúvida "7h às 19h ou 7h às 17h" **para esse número**. Cuidado: a notícia do DAAE não mostra a data de publicação (diz só "a partir da próxima segunda-feira (13)", sem mês nem ano); o horário específico da Saúde ainda deve ser confirmado na Fundação de Saúde.

**A sigla (A, com ressalva):** a matéria publicitária da Prefeitura no g1 (10/10/2025, arquivada em `docs/documetacao/cadu-g1-especial-publicitario.pdf`) diz **"CADU – Central de Atendimento Digital Unicidades"**. Um resumo de busca trazia "UniCidadão"; vale a grafia da própria Prefeitura. Ressalva: é propaganda institucional ("conteúdo de responsabilidade do anunciante"), boa para dizer o que a Prefeitura afirma do seu app, não para prometer funcionalidade. O depoimento de moradora na matéria é publicidade e não deve ser usado.

**O que o app oferece segundo essa matéria (A, como afirmação da Prefeitura):** agendar e desmarcar consultas no SUS; carteirinha de vacinação digital; serviços de zeladoria; avisos da Prefeitura; matrícula e rematrícula; "acesso a programas sociais". O menu mostra, entre outras, as categorias Saúde, Educação, Desenvolvimento Social, **Conecta** e **Desenvolvimento Econômico** (o catálogo tem o Conecta e a Secretaria de Desenvolvimento Econômico como serviços de emprego). Novas funcionalidades entram aos poucos, então a lista muda. **A matéria não diz quais programas sociais** nem se inclui o CadÚnico: pendente.

**Para a usuária sem celular ou com pouca internet:** a matéria trata o app como caminho principal, e o site já registra que o CADU não tem endereço físico. O conteúdo novo deve sempre trazer o canal presencial ou o telefone ao lado do app.

### O que isso muda no site (conteúdo, não botão)
1. Um parágrafo único "O que é o Cadu e para que serve", reaproveitado onde o Cadu aparece, mais uma linha "Cadu não é o CadÚnico" na área Assistência.
2. **Trabalho:** o menu do app tem "Conecta" e "Desenvolvimento Econômico". Verificar se a jornada de Trabalho deve dizer que parte do atendimento também está no app, sem substituir os telefones. (A para o menu; o que há dentro de cada categoria é pendente)
3. **Fundo Social:** o registro do catálogo (`man-fundo-social`) traz só um WhatsApp. Um resumo de notícia de julho de 2026 diz que as inscrições nos cursos gratuitos (780 vagas, idade mínima 16) são **exclusivamente pelo Cadu**. Se for verdade, a jornada de Trabalho pode mandar a mulher a um canal que não inscreve. Verificar. (B)
4. **Saúde:** o 0800 019 0505 e a informação de que mamografia e Papanicolau dependem de solicitação de profissional estão na `observacao` de um registro do catálogo (`man-cadu`), não no texto da área Saúde. Informação escondida. (A para a localização no código; B para o conteúdo)
5. **Matrícula:** o calendário citado em notícias é do ciclo 2026. O site já avisa que 2027 precisa de confirmação; manter. Uma notícia sem ano ("rematrículas 11 a 19 de novembro; matrículas de 30 de novembro a 15 de dezembro") **não** pode ser usada sem ver o ano. (B)

## 3. Diagnóstico: o que existe e o que falta

| Tema | O que existe hoje (A) | Lacuna |
|---|---|---|
| Dinheiro para o básico | Jornada de Assistência leva ao CRAS e pede "pergunte quais benefícios existem". Há um teste que **proíbe** as palavras CadÚnico e Bolsa Família nessa jornada | O passo mais importante (inscrever ou atualizar o CadÚnico no CRAS) nunca é dito. A jornada manda perguntar o que o site poderia explicar |
| BPC | Aparece só como documento aceito na tarifa social | Nada explica o que é, que não é aposentadoria, nem o caminho (CadÚnico, depois INSS) |
| Comida | Nenhum conteúdo | Existem canais municipais (seção 4, P3), mas nada orienta a mulher até eles |
| Moradia | Dois links (Secretaria de Habitação e CRAS) | Não explica cadastro habitacional, atualização anual nem a prioridade federal para mulher responsável pela família (P2) |
| Pensão e guarda | Cartão "Crio meu filho sozinha" na Educação remete à Defensoria | Sem passo a passo, sem "o que fazer se o pai não consta na certidão", sem "se não paga". O registro da Defensoria no catálogo não tem telefone |
| Avó cuidadora | Uma linha na lista "Documentos em situações específicas" (guarda), marcada como pesquisa não conferida | Ela não aparece como pessoa: sem renda, sem saúde, sem guarda e matrícula como caminho |
| Saúde da mulher | Está só dentro de um registro do catálogo | Não aparece na área Saúde |
| Orientador de IA | 383 frases de treino, **1** com "neto" | Não reconhece "crio meus netos", "sustento a casa", insegurança alimentar com facilidade |
| Jornadas que terminam sem próximo passo | Trabalho, Educação e Assistência têm "alternativa" em cada passo | A de Assistência "apoio" termina em "pergunte" (ver primeira linha). Não há jornada de violência e proteção (já registrado no estado do projeto) |

Duplicações: não encontrei duplicação relevante de conteúdo. O problema é o inverso: informação **faltando ou escondida**.

## 4. Propostas, por prioridade

Cada proposta responde às três perguntas: onde começo, o que levo, o que faço se não der. Nenhuma afirma elegibilidade.

### P1. "Dinheiro para o básico": CadÚnico, Bolsa Família e BPC (Assistência)
- **Perfis:** as três.
- **Conteúdo:** (1) CadÚnico é o cadastro; Bolsa Família e BPC são benefícios, cada um com regras próprias; (2) ir ao CRAS (já existe "qual CRAS atende o meu bairro"); (3) quem faz é a pessoa responsável pela família; (4) o que levar; (5) o BPC é pedido ao INSS (135 ou Meu INSS), é gratuito e não precisa de intermediário; (6) BPC não é aposentadoria; (7) estar no CadÚnico não garante benefício.
- **Fatos vistos (B):** atualização do cadastro em no máximo 24 meses (MDS); o responsável leva documento com foto, CPF ou título, comprovante de residência e documentos de todos que moram junto; Rio Claro fez atendimentos especiais de atualização nos CRAS.
- **Estado das fontes de Rio Claro para o CadÚnico em 15/10/2026 (o que o mantenedor trouxe):**
  - **Confirmado (A):** o telefone do CRAS Mãe Preta, (19) 3524-9954, e os endereços e bairros atendidos dos seis CRAS (`docs/documetacao/cras.pdf`, página oficial da Secretaria de Desenvolvimento Social, impressa em 10/10/2026). **Essa página não menciona Cadastro Único nem horário de atendimento.**
  - **Não confirmado (B-):** "o CadÚnico é feito nos CRAS, de segunda a sexta, das 8h às 17h". Veio de um resumo de busca atribuído a `desenvolvimentosocial.rc.sp.gov.br/?page_id=108`, página que não vimos. O único horário de 8h às 17h que temos em fonte é o da **sede** da Secretaria (8h às 12h e 13h às 17h), que é outro endereço. Não publicar horário de CRAS sem ver a página.
  - **Não confirmado (B-):** a lista de documentos (responsável: documento com foto, CPF ou título, comprovante de residência; demais membros: ao menos um documento cada) bate com o resumo do MDS visto antes, o que aumenta a confiança, mas ainda não foi lida na página da Prefeitura.
  - **Páginas oficiais atuais da Secretaria de Desenvolvimento Social, identificadas em 15/10/2026 (B+):** o ChatGPT trouxe os endereços e eu os localizei por uma segunda via independente (busca restrita ao domínio `desenvolvimentosocial.rc.sp.gov.br`), que devolveu resumos coerentes. Nível **B+**: duas leituras independentes concordam, mas as páginas **não foram abertas nem arquivadas** (o ambiente bloqueia o domínio). As páginas: "Como me cadastro no CADÚNICO?" (`?page_id=3366`), "Unidades de Atendimento" (`?page_id=1270`), "Quem tem direito ao Bolsa Família?" (`?page_id=3375`), "Programa Bolsa Família" (`?page_id=1944`), "Cadastro único" (`?page_id=108`), "CRAS" (`?page_id=112`), "BPC" (`?page_id=1954`) e "Como Solicitar o BPC/LOAS?" (`?page_id=1927`), "Como Solicitar a Tarifa Social de Energia Elétrica?" (`?page_id=3384`). Resumo do que as duas leituras dizem:
    - **Onde:** o cadastro é **presencial, não pelo site**, em "postos de atendimento do Cadastro Único" da Prefeitura ou nos CRAS. A página de unidades lista **"Cadastro Único, Paço Municipal, Rua 3, nº 945, Centro"**, atendimento presencial; o endereço do Paço bate com o Diário Oficial do município. Telefone e horário do posto **não** apareceram.
    - **Quem deve ir:** o responsável pela família, **"de preferência mulher"** (municipal), e, no gov.br, 16 anos ou mais, "preferencialmente mulher". As duas fontes concordam.
    - **Documentos:** responsável, documento com foto e CPF ou título de eleitor (obrigatório um dos dois), mais comprovante de residência recente, ou declaração de endereço se não houver; demais moradores, um documento de cada (certidão, RG, CPF, título ou carteira de trabalho); a Prefeitura acrescenta **comprovante de matrícula escolar para crianças e adolescentes** (o gov.br não diz isso).
    - **Depois:** dados no sistema em até 45 dias; acompanhar pelo aplicativo CadÚnico; atualizar a cada 2 anos ou antes se mudar de endereço ou nascer alguém.
    - **CadÚnico não é Bolsa Família:** para se **inscrever** no CadÚnico, a Prefeitura cita renda de até meio salário mínimo por pessoa, ou renda total de até 3 salários mínimos em situação de vulnerabilidade. Para **receber o Bolsa Família**, a página específica cita CadÚnico atualizado e renda por pessoa de até R$ 218 (exemplo de família de quatro: R$ 872), e diz que **não é preciso pedir o Bolsa Família**: o governo avalia.
    - **Cuidados:** (1) uma das buscas apontou que a Prefeitura cita, em outra página, faixas antigas (R$ 85 e R$ 170); (2) o valor de R$ 218 pode ter mudado: não afirmo nem nego o valor atual, e o texto deve remeter ao gov.br no dia da publicação; (3) o **horário de 8h às 17h dos CRAS** continua sem confirmação em página que eu tenha visto (aparece no texto do ChatGPT e no que você colou antes, possivelmente da mesma origem); (4) tirar `utm_source=chatgpt.com` dos links ao citar.
  - **Confirmado em página oficial, de 2019 (A):** a Prefeitura publicou em 25/09/2019 "Totalmente reformado, Cadastro Único é entregue à comunidade" (arquivada em `docs/documetacao/cadastro-unico-reforma-2019.pdf`). **Existe um espaço próprio do Cadastro Único**, além dos CRAS. A secretária de Desenvolvimento Social diz ali que o Cadastro Único reúne informações para programas como Bolsa Família, tarifa social de energia elétrica, Minha Casa Minha Vida e carteira do idoso. Isso confirma, em fonte oficial, o elo CadÚnico e moradia (P2) e CadÚnico e tarifa social. **Limites:** a impressão não mostra endereço, telefone nem horário (e tem um trecho cortado entre as páginas 2 e 3), e é de 2019. O endereço Rua 3, nº 945 continua vindo só de portal privado e de texto colado, não desta página.
  - **Pista importante, sem data (B-):** um resumo cita uma notícia da Prefeitura, "Serviços do Cadastro Único a partir de 2ª-f serão realizados nos Cras", ligada a uma reforma no local onde o atendimento funcionava. Se o CadÚnico foi **transferido temporariamente** para os CRAS, o texto do site precisa saber se já voltou ao local original. Sem a notícia e sua data, não dá para dizer onde atender hoje. **Atualização:** como a reforma do espaço foi concluída em 25/09/2019 (item acima), é provável que essa transferência temporária para os CRAS tenha sido em 2019 e já tenha acabado. É inferência, sem a data da notícia; ela reduz a preocupação, não a elimina.
  - **Não é fonte:** um PDF de `cadunico.com.br` ("CadÚnico 2026", CRAS Rio Claro Endereço, Telefone) foi descartado. É site privado de conteúdo genérico, sem horário, documento nem endereço de Rio Claro, e só remete à página da Prefeitura. Não foi arquivado. Serve de alerta de produto: a mulher que buscar "CadÚnico Rio Claro" cai nesse tipo de site, então o texto do MISM3 deve dizer que **a inscrição é gratuita, feita no CRAS, e que só o gov.br e a Prefeitura são oficiais**.
  - **Pista nova, de portal privado (C, não é fonte):** o arquivo OneNote de 15/10/2026 traz duas capturas do portal "Info Cidadão" (`infocidadao.com/sp/rio-claro`, "portal independente", com aviso de que não responde pelos dados) listando **7 locais**: os 6 CRAS e um **"Posto CadÚnico", Rua 3, 945, Centro**. Esse endereço é o do Paço Municipal, que consta no rodapé de uma página oficial da Prefeitura já arquivada (`cram-noticia-2016.pdf`). Hipótese de trabalho: o CadÚnico funciona normalmente no Paço e foi levado aos CRAS durante a reforma citada acima. **Hipótese, não fato:** falta a página oficial.
  - **Decisão do mantenedor (15/10/2026):** o texto do site dirá que o CadÚnico é feito **no CRAS**, trará o **telefone do CRAS da usuária** (a ferramenta "qual CRAS atende o meu bairro" já existe) e a orientação de **ligar antes**. Isso resolve o risco de mandá-la ao lugar errado, desde que o texto **não afirme horário** nem cite o "Posto" do Centro. Duas premissas continuam sendo conferidas em página oficial: que o atendimento é no CRAS (há indício na Prefeitura e no gov.br, só em resumo) e a lista de documentos. Por isso o pedido de impressões abaixo cai de quatro para duas.
  - **Posto central (mantenedor, mesmo dia):** o mantenedor informa que também existe um posto do Cadastro Único na Prefeitura. A página de 2019 confirma que o espaço existe; o endereço e o funcionamento de hoje ainda não. Quando houver página atual, o texto pode dizer "no CRAS do seu bairro ou no posto central do Cadastro Único, no Centro", com telefone; até lá, fica só o CRAS.
  - **O portal privado erra em 2 dos 6 CRAS**, comparado ao `cras.pdf` oficial: Jardim Brasília ("Rua 21, 54" no portal; a Prefeitura diz "endereço provisório") e Jardim Independência ("Rua M-7, 490" no portal; "Rua M7 nº 1031" na Prefeitura). Mãe Preta, Panorama, Terra Nova e Bom Sucesso batem. Por isso o portal não serve nem para endereço, e o site deve continuar usando só a página oficial.
  - **Detalhe de cautela:** o mesmo resumo diz "CadÚnico criado em 2003". Pelo que sei, ele é de 2001 e o Decreto 6.135/2007 o regulamenta; o dado é dispensável para a usuária e mostra por que o resumo não vale como fonte.
- **Fonte a abrir:** gov.br "Inscrever-se no Cadastro Único", gov.br "Receber o Bolsa Família", MDS "BPC" e "BPC no Cadastro Único"; página oficial dos CRAS de Rio Claro.
- **Impacto:** alto. É a porta de dinheiro, comida (P3) e moradia (P2).
- **Cuidado com a regra do projeto:** hoje o teste de Assistência proíbe essas palavras por falta de fonte. A mudança só entra depois das fontes abertas e com o teste atualizado na mesma entrega. Critérios de idade e renda do BPC: remeter ao gov.br, não resumir de memória.

### P2. Chefe de família e moradia: ligar o CadÚnico à habitação
- **Achado de maior valor para o Observatório:** um resumo de busca da Portaria MCID nº 738/2024 (publicada no site da Prefeitura) diz que a seleção do Minha Casa Minha Vida dá prioridade a **mulher responsável pela unidade familiar, declarada no CadÚnico**. Se a leitura do PDF confirmar, é exatamente "fazer as ações existentes funcionarem juntas": quem sustenta a casa precisa estar corretamente declarada no CadÚnico. (B, alto impacto, **confirmar no PDF**)
- **Outros fatos (B):** cadastro habitacional da Prefeitura com mais de um ano precisa ser atualizado; a atualização é pelo site ou presencial na Secretaria de Planejamento e Habitação; a Prefeitura alerta para golpe: não há cobrança de documentação.
- **Conteúdo:** como consultar e atualizar o cadastro, o que os critérios publicados dizem, como saber se há inscrição aberta, o aviso do golpe. Sem afirmar que ela será contemplada.
- **Também em Moradia:** tarifa social de água e energia já existe e pede CadÚnico (ligar com P1).

### P3. Comida
- **Canais encontrados (B):** cestas verdes do Programa de Aquisição de Alimentos para famílias em insegurança alimentar atendidas pelos CRAS (um resumo cita 567 famílias, sem data confirmada); Armazém Solidário com moeda social ENA no CRAS Panorama; cestas do Fundo Social; cestas a alunos da rede municipal em jan./fev. de 2026.
- **O que isso não prova:** nada mostra programa permanente de cesta para qualquer família, nem que as ações estejam abertas hoje. O texto do site deve dizer: "pergunte no CRAS quais recursos de alimentação existem agora", com telefone da Secretaria de Desenvolvimento Social (já no catálogo).
- **Pendência humana:** uma ligação à Secretaria de Desenvolvimento Social para saber como a família é encaminhada.

### P4. Mãe solo
- **Pensão e paternidade (conteúdo geral, B/C):** levar certidão de nascimento da criança, documento e comprovante de residência de quem tem a guarda; se o pai não consta, existe ação de investigação de paternidade, e o reconhecimento voluntário pode ser feito em cartório, gratuito para quem não pode pagar; a pensão só vale a partir do pedido na Justiça, por isso procurar cedo.
- **Fontes a abrir:** Senado "Como fazer para pedir pensão alimentícia", Defensoria Pública de SP, Arpen-SP (reconhecimento em cartório).
- **Defensoria em Rio Claro (já no catálogo, A):** endereço Rua 1, nº 659, Saúde (notícia de 26/06/2025; confirmar antes de ir); agendamento pelo portal da Defensoria, com assistente virtual, em dias úteis das 8h às 18h; urgências com espera reduzida; atendimento gratuito para quem não pode pagar advogado, em geral renda familiar até 3 salários mínimos (até 4 em alguns casos), e **violência doméstica contra a mulher independe da renda**. A fonte **não traz telefone**, então o texto deve mandar agendar pelo portal e dizer que não há telefone divulgado. Pendência real: um passo a passo do portal para quem tem pouca familiaridade com internet (ver nota sobre quem não tem celular, seção 2).
- **Trabalho compatível com o cuidado:** a jornada já pergunta se há com quem deixar a criança. Falta mostrar, quando a resposta é "não", o que existe: creche (já há jornada), contraturno (SCFV, já no catálogo) e cursos do Fundo Social, **com o canal de inscrição correto** (ver seção 2, item 2).
- **Saúde da mulher:** subir para a área Saúde a informação do Cadu 0800 019 0505 (o horário do número está confirmado na notícia do DAAE, seção 2; o da Saúde em si, confirmar) e que mamografia e Papanicolau dependem de solicitação de profissional.

### P5. Avó que cria ou sustenta os netos
- **Guarda, matrícula e saúde são questões diferentes.** O texto não deve afirmar que ordem judicial é sempre necessária. Dizer: pergunte na escola e na unidade de saúde o que aceitam; procure a Defensoria para avaliar o caso. Nenhuma fonte oficial sobre guarda foi achada (C): **fica como pendência**, não como texto.
- **Renda:** diferença entre aposentadoria, BPC e benefícios da família; CadÚnico; sem sugerir que ter neto ou receber aposentadoria garante ou impede benefício. Depende de P1.
- **Quem cuida também precisa de cuidado (B):** curso gratuito de cuidador de idosos do Fundo Social (80 h, inscrição pelo Cadu) serve a quem cuida e é caminho de renda; Centro Dia do Idoso (60 vagas para idosos semidependentes; a segunda unidade foi anunciada, abertura não confirmada); convivência do idoso já está no catálogo.
- **Proteção da avó:** o Disque 100 já está na jornada de Assistência. Falta dizer em linguagem simples a situação "alguém usa meu cartão ou minha aposentadoria sem eu querer".

### P6. Orientador de IA: avaliar antes de treinar
- Criar um conjunto de **avaliação** novo (não de treino), em frases coloquiais e com erros de escrita, para quatro perfis (esboço na seção 6). Medir: destino correto, necessidades simultâneas reconhecidas, abstenção quando não sabe.
- **Cuidado metodológico:** frases escritas só para testar não entram no treino; senão o resultado deixa de medir generalização. Só depois de medir a falha se acrescentam frases de treino diferentes das de teste. Seguir o padrão dos conjuntos `independente` e `reserva` já existentes em `avaliacao/`.

### P7. Estrutura: um bloco "Comece por aqui" em cada área
Sem botão novo. No topo de cada área, três linhas por situação (ex.: Assistência: "falta dinheiro / falta comida / contas pesando / quero voltar a trabalhar"), cada uma com onde começar, o que levar e a alternativa. Os cartões atuais ficam abaixo. É o que você pediu: melhorar o início das áreas, não multiplicar elementos.

## 5. Ordem de trabalho (mantém a sequência já definida)

1. **Conferir o que existe:** feito neste documento (seções 2 e 3).
2. **Pesquisar e documentar:** abrir as páginas da seção 8, registrar data e trecho, marcar o que continua pendente.
3. **Redigir separado:** textos novos em arquivos de proposta, sem tocar nas áreas, jornadas nem catálogo.
4. **Validar antes de publicar:** testes de regressão (pytest e Node), conferência de navegação e a avaliação da IA (P6).

Sugestão de ordem de entrega: P1, depois P2 e P4/P5, depois P3, depois P6 e P7. P1 vem primeiro porque P2, P3 e P5 dependem dele.

Sobre "prontidão de 90%" e "MISM2": esta árvore do repositório não tem nenhum dos dois, então não pude conferir; nada do MISM2 foi tocado.

## 6. Esboço do conjunto de avaliação da IA (rascunho, não entra no treino)

| Perfil | Frases (coloquiais, com erro de escrita, pedido indireto) | Destino esperado |
|---|---|---|
| Mãe solo | "nao tenho com quem deixa meu filho pra trabalha"; "o pai nao paga nada e eu me viro sozinha"; "preciso de vaga na creche mas trabalho o dia todo"; "meu filho nao tem o nome do pai no registro" | Educação (creche) ou Direitos (pensão); mais de uma necessidade |
| Chefe de família | "meu salario nao da pra conta nem pra comida"; "sou eu que sustento a casa toda"; "to devendo agua e luz"; "marido desempregado, so eu trabalho" | Assistência/CadÚnico; Moradia (tarifa social); Dívidas; Trabalho |
| Avó cuidadora | "crio meus netos e preciso matricular um deles"; "minha filha largou os meninos comigo"; "so tenho minha aposentadoria pra sustentar todo mundo"; "tenho 68 anos e cuido de 3 netos" | Educação (matrícula); Direitos (guarda, pensão); Assistência (renda) |
| Urgência | "posso ser despejada e nao tenho pra onde ir"; "hoje nao tem comida em casa"; "meu filho usa meu cartao da aposentadoria sem eu deixar" | Moradia/Assistência; Assistência (alimentação); Disque 100 |
| Fora do alcance | "qual o valor exato do bolsa familia que eu vou receber?" | Abstenção: não decide benefício; encaminha ao CRAS |

## 7. O que precisa de uma pessoa (não consigo fazer daqui)

1. **Liberar o acesso de rede** para `rioclaro.sp.gov.br` e `gov.br` no ambiente (menu do ambiente na barra de título da sessão, depois Editar, Acesso à rede, domínios permitidos). Com isso abro as páginas e confirmo cada achado B.
2. Ligar para a Secretaria de Desenvolvimento Social, (19) 3522-1930 (já no catálogo), e perguntar como a família é encaminhada às cestas e se o PAA e o Armazém Solidário estão ativos.
3. ~~Descobrir como se agenda a Defensoria em Rio Claro.~~ **Resolvido:** já está no catálogo (portal com assistente virtual, 8h às 18h em dias úteis); a fonte não publica telefone. Corrigido em 15/10/2026: eu tinha listado isto como pendente por engano.
4. Confirmar o canal de inscrição do Fundo Social (Cadu ou WhatsApp).
5. **Mínimo para publicar o P1 (duas impressões em PDF):** (1) a página do gov.br "Inscrever-se no Cadastro Único para Programas Sociais do Governo Federal" (documentos, quem faz, gratuidade, que não garante benefício); (2) a notícia da Prefeitura "Serviços do Cadastro Único ... serão realizados nos Cras" ou a página `rioclaro.sp.gov.br/centro-ref-assistencia-social/`, o que mostrar o CadÚnico no CRAS, com a data visível. **Atualização:** a notícia de 2019 já foi arquivada e vale como prova de que o serviço existe, mas não diz onde nem quando atende hoje. O que falta no item (2) é **uma página atual da Secretaria de Desenvolvimento Social** (`?page_id=108`, `?page_id=1944` "Programa Bolsa Família em Rio Claro", `?page_id=1270` ou `?page_id=112`, indicadas no texto colado pelo mantenedor) que diga onde fazer o cadastro hoje. **Opcionais, para completar:** o que está abaixo.
   Lista completa de páginas que ajudam, para tirar o CadÚnico da lista de pendências: (a) `desenvolvimentosocial.rc.sp.gov.br/?page_id=108` (citada como origem de horário e documentos); (b) `rioclaro.sp.gov.br/centro-ref-assistencia-social/` (página do CRAS na Prefeitura, que o resumo diz tratar de BPC e transferência de renda); (c) a notícia "Serviços do Cadastro Único a partir de 2ª-f serão realizados nos Cras", com a data visível. Se possível, uma quarta: (d) a página oficial que confirme onde fica o atendimento do Cadastro Único no Centro (o "Posto CadÚnico", Rua 3, 945, apontado só por portal privado).

## 8. Fontes que indicaram os achados (a abrir e conferir)

Resumos de busca restritos ao domínio da Prefeitura (páginas **não abertas**):
- [Rio Claro abre inscrições para cursos de qualificação gratuitos](https://rioclaro.sp.gov.br/secretarias/fundo-social-de-solidariedade/rio-claro-abre-inscricoes-para-cursos-de-qualificacao-gratuitos/) (Cadu, 780 vagas)
- [Rio Claro abre rematrículas para estudantes da educação infantil](https://rioclaro.sp.gov.br/educacao/rio-claro-abre-rematriculas-para-estudantes-da-educacao-infantil/) (ciclo 2026)
- [Matrículas e rematrículas na rede municipal começam em novembro](https://rioclaro.sp.gov.br/educacao/matriculas-e-rematriculas-na-rede-municipal-de-rio-claro-comecam-em-novembro/) (ano a confirmar)
- [Nova central para agendamento de consultas](https://rioclaro.sp.gov.br/fundacao-de-saude/nova-central-para-agendamento-de-consultas-comeca-a-operar-na-2a-feira-em-rc/) e [Outubro Rosa reforça importância de exames preventivos](https://rioclaro.sp.gov.br/fundacao-de-saude/outubro-rosa-reforca-importancia-de-exames-preventivos/)
- [Daae mantém atendimento telefônico no feriado da Revolução de 1932](https://rioclaro.sp.gov.br/daae/daae-mantem-atendimento-telefonico-no-feriado-da-revolucao-de-1932/) (Cadu no DAAE)
- **Arquivada em PDF (lida):** matéria publicitária da Prefeitura no g1, "CADU transforma os serviços públicos em Rio Claro com mais praticidade" (10/10/2025), em `docs/documetacao/cadu-g1-especial-publicitario.pdf`
- **Arquivada em PDF (lida):** [Daae adere atendimento via Cadu e muda número de telefone](https://daaerioclaro.sp.gov.br/daae-adere-atendimento-via-cadu-e-muda-numero-de-telefone/), impressa em 15/10/2026, em `docs/documetacao/daae-cadu-atendimento.pdf`
- [Prefeitura fará atendimento especial para atualização do Cadastro Único](https://rioclaro.sp.gov.br/desenvolvimento-social/prefeitura-fara-atendimento-especial-para-atualizacao-do-cadastro-unico/)
- [Armazém Solidário tem nova edição no Jardim Panorama](https://rioclaro.sp.gov.br/desenvolvimento-economico/armazem-solidario-tem-nova-edicao-no-jardim-panorama/)
- [Prefeitura entrega cesta básica para 17 mil alunos](https://rioclaro.sp.gov.br/educacao/prefeitura-entrega-cesta-basica-para-17-mil-alunos-das-escolas-municipais/)
- [Critérios de elegibilidade (Portaria MCID 738/2024)](https://rioclaro.sp.gov.br/wp-content/uploads/2025/11/CRITERIOS-DE-ELEGIBILIDADE.pdf)
- [Atualização cadastral para programa habitacional](https://rioclaro.sp.gov.br/planejamento-e-habitacao/em-rio-claro-atualizacao-cadastral-para-programa-habitacional-vai-ate-28-de-fevereiro/) e [alerta de golpe](https://rioclaro.sp.gov.br/planejamento-e-habitacao/criminosos-aplicam-golpe-oferecendo-moradias-do-programa-habitacional-de-rc/)
- [Fundo Social forma mais 20 cuidadores de idosos](https://rioclaro.sp.gov.br/fundacao-de-saude/fundo-social-forma-mais-20-cuidadores-de-idosos/) e [Rio Claro inaugura Centro Dia do Idoso](https://rioclaro.sp.gov.br/desenvolvimento-social/rio-claro-inaugura-centro-dia-do-idoso-nesta-quinta-feira/)

Federais (resumos de busca; abrir):
- [Inscrever-se no Cadastro Único](https://www.gov.br/pt-br/servicos/inscrever-se-no-cadastro-unico-para-programas-sociais-do-governo-federal)
- [Receber o Bolsa Família](https://www.gov.br/pt-br/servicos/receber-o-bolsa-familia)
- [BPC (MDS)](https://www.gov.br/mds/pt-br/acoes-e-programas/suas/beneficios-assistenciais/beneficio-assistencial-ao-idoso-e-a-pessoa-com-deficiencia-bpc) e [BPC no Cadastro Único](https://www.gov.br/mds/pt-br/acoes-e-programas/suas/beneficios-assistenciais/bpc-no-cadastro-unico)
- [Como fazer para pedir pensão alimentícia (Senado)](https://www12.senado.leg.br/noticias/especiais/especial-cidadania/pensao-alimenticia-atende-necessidades-basicas-e-padrao-de-vida/como-fazer-para-pedir-pensao-alimenticia)

Uma busca geral (sem restrição de domínio) trouxe descrições erradas, como chamar o Cadu de registro federal. Por isso nenhum achado desta página vem de busca aberta sem confirmação no domínio oficial.

## 9. Texto proposto para a área Assistência Social: CadÚnico e Bolsa Família (rascunho v2)

Rascunho. **Não está no site e nenhum código foi alterado.** Níveis: A = fonte oficial arquivada; B+ = duas leituras independentes de página oficial, página ainda não arquivada (seção 4, P1). Só o que for A pode ser publicado; o que for B+ espera a impressão em PDF.

**Onde entra, sem botão novo.** Como primeiro bloco da área Assistência Social, antes de "Seu CRAS", com a ferramenta "qual CRAS atende o meu bairro" que já existe fornecendo o telefone. Os mesmos fatos alimentam os campos "leve" e "pergunte" do passo "Procure o CRAS" da jornada de Assistência.

> **Preciso de ajuda para sustentar minha família: comece pelo Cadastro Único**
>
> **O que é.** O Cadastro Único (CadÚnico) é o cadastro do governo federal que a Prefeitura faz, sem custo, para identificar famílias de baixa renda. Ele é a porta de entrada para programas como o Bolsa Família, a tarifa social de energia elétrica, o Minha Casa Minha Vida, a carteira do idoso e o BPC. **Fazer o cadastro não é receber o benefício:** cada programa tem regras próprias. *(A para a lista de programas, citada pela Prefeitura em 2019; B+ para o restante)*
>
> **Quem pode se cadastrar.** A Prefeitura informa que o cadastro é para famílias com renda de até meio salário mínimo por pessoa, ou renda total de até três salários mínimos em situação de vulnerabilidade social. Na dúvida, procure o atendimento: quem avalia é o cadastro, não este site. *(B+: copiar o texto exato da página `?page_id=3366` ou `?page_id=108`)*
>
> **Quem deve fazer.** A família indica uma pessoa responsável por prestar as informações de todos os moradores. Em regra ela tem 16 anos ou mais e, de preferência, é uma mulher da família. Se não houver uma mulher que possa ir, outra pessoa da família pode ser a responsável. *(B+: Prefeitura e gov.br concordam em "de preferência mulher"; o gov.br dá os 16 anos)*
>
> **Onde fazer.** Presencialmente: não é pelo site. Procure o CRAS do seu bairro, **[telefone do CRAS dela]**, ou o posto do Cadastro Único no **Paço Municipal, Rua 3, nº 945, Centro**. **Ligue antes** para saber o dia, o horário e se é preciso agendar. Para o posto, a Secretaria de Desenvolvimento Social atende no (19) 3522-1930. *(B+ para o endereço do posto; A para o telefone da Secretaria e dos CRAS; **horário não é afirmado**)*
>
> **O que levar** (originais; confirme com o atendimento). *Quem responde pela família:* documento com foto e CPF ou título de eleitor; comprovante de residência recente (conta de luz ou água); se não tiver comprovante, pergunte sobre a declaração de endereço. *Os outros moradores:* pelo menos um documento de cada um (certidão de nascimento ou casamento, RG, CPF, título de eleitor ou carteira de trabalho). *Crianças e adolescentes:* a Prefeitura também pede o comprovante de matrícula escolar. *(B+)*
>
> **Depois do atendimento.** Os dados entram no sistema em até 45 dias. Acompanhe pelo aplicativo CadÚnico. Atualize a cada 2 anos, ou antes se você mudar de endereço ou se alguém nascer na família. *(B+)*
>
> **E o Bolsa Família?** Você não precisa pedir o Bolsa Família: com o CadÚnico atualizado, o governo federal avalia a família. O critério principal é a renda por pessoa. A página da Prefeitura cita **até R$ 218 por pessoa [conferir o valor atual no gov.br no dia da publicação; ele pode mudar]**. Quem seleciona é o governo federal, não a Prefeitura, e uma família pode estar no CadÚnico sem receber o benefício. *(B+, com o valor sujeito a conferência)*
>
> **Se alguém da família tem 65 anos ou mais, ou tem deficiência.** O BPC é outro benefício: depois do CadÚnico, é pedido ao INSS (135 ou Meu INSS), sem intermediário. As regras estão no gov.br. A Prefeitura também tem páginas sobre o BPC. *(B+; abrir `?page_id=1954` e `?page_id=1927`)*
>
> **Cuidado.** A inscrição é gratuita. Só o gov.br e a Prefeitura são fontes oficiais; desconfie de quem cobra ou de sites que prometem benefício. *(B)*
>
> Este texto orienta o primeiro passo. Ele não diz se você tem direito a algum benefício. Fontes: Prefeitura de Rio Claro (Secretaria de Desenvolvimento Social) e gov.br, com a data da conferência.

### Checagens pedidas antes de publicar

1. **Dados municipais vigentes.** Imprimir em PDF e arquivar em `docs/documetacao/`: `?page_id=3366` (como me cadastro), `?page_id=1270` (unidades), `?page_id=3375` (Bolsa Família) e `?page_id=108` (Cadastro Único). Só depois o endereço do posto e o texto dos critérios passam de B+ para A.
2. **Alinhamento com o gov.br.** Pela comparação dos resumos:

| Item | Prefeitura | gov.br | Diferença |
|---|---|---|---|
| Quem responde pela família | "De preferência mulher" | 16 anos ou mais, preferencialmente mulher | Igual |
| Documentos do responsável | Documento com foto e CPF ou título | Documento com foto, CPF ou título, comprovante de residência ou declaração | Igual |
| Demais moradores | Certidão, RG, CPF, título ou carteira de trabalho | Pelo menos um documento de cada | Igual |
| Crianças e adolescentes | **Comprovante de matrícula escolar** | Não consta | **A Prefeitura pede a mais** |
| Atualização | A cada 2 anos | 24 meses (MDS) | Igual |
| 45 dias para entrar no sistema | Consta | Não verificado | Só a Prefeitura |
| Falta de documento | Não visto | Município cadastra mesmo assim, o cadastro fica incompleto | Só o gov.br |

3. **Inscrição no CadÚnico não é requisito do Bolsa Família.** O texto separa os dois: o parágrafo "Quem pode se cadastrar" (cadastro) e o "E o Bolsa Família?" (benefício, com critério de renda próprio e seleção federal).
4. **Valor de R$ 218.** Conferir no gov.br no dia da publicação. Se divergir, vale o gov.br e a página da Prefeitura vira pendência a corrigir. Um valor desatualizado pode fazer uma mulher achar que não pode se inscrever, então, na dúvida, o texto manda procurar o atendimento.
5. **Horário.** Não afirmar horário de CRAS nem do posto até haver página atual impressa.

### O que muda no código quando for a hora (hoje, nada)

- `web/tests/jornada_assistencia.test.js` proíbe "CadÚnico" e "Bolsa Fam" na jornada: ajustar para continuar vetando promessa ("você tem direito", "benefício garantido") e aceitar o nome do cadastro.
- O mesmo teste só aceita links externos que já constam em `areas.js` ou no catálogo: os novos links oficiais entram lá, com fonte e data.
- Atualizar `docs/estado_do_projeto.md`, que hoje diz que a jornada de Assistência "não menciona CadÚnico".

### Novas pistas encontradas (não confirmadas)

- **Segurança alimentar (P3):** a busca devolveu o PDF do **Plano Municipal de Segurança Alimentar e Nutricional 2025-2028** (CAISAN), publicado no site da Secretaria em janeiro de 2026. É a fonte oficial mais promissora para a seção de comida; precisa ser impresso e lido.
- **Tarifa social de energia (P2):** existe a página `?page_id=3384`, "Como Solicitar a Tarifa Social de Energia Elétrica?", que pode complementar a seção de Moradia já existente.

## 10. Lista para conferir: o que abrir, o que verificar e como devolver

**Regra combinada com o mantenedor (15/10/2026):** o que é oficial é oficial. Uma página oficial **aberta e arquivada em PDF** vale como fonte (nível A), sem dúvida adicional. A cautela dos níveis B e B+ existia só porque até agora só se viu um **resumo** da página, não a página. Duas ressalvas permanecem, e não são desconfiança da fonte: (1) a **data** (uma página de 2019 prova o que existia em 2019); (2) **cada assunto tem a sua fonte oficial**: para serviço local vale a Prefeitura; para regra federal (renda do Bolsa Família, BPC, quem é o responsável) vale o gov.br. Se as duas divergirem num valor federal, vale o gov.br.

**Como devolver:** imprimir em PDF, no mesmo formato das anteriores (com a data e o endereço da página visíveis), e enviar. Se o PDF cortar o texto, enviar também o trecho copiado.

### Para publicar o bloco do CadÚnico (prioridade 1)

| # | Abrir | Verificar |
|---|---|---|
| 1 | https://desenvolvimentosocial.rc.sp.gov.br/?page_id=3366 | Documentos de cada pessoa; "de preferência mulher"; presencial; prazo de 45 dias; atualização a cada 2 anos; se traz telefone ou horário |
| 2 | https://desenvolvimentosocial.rc.sp.gov.br/?page_id=1270 | Se lista "Cadastro Único, Paço Municipal, Rua 3, nº 945, Centro"; se traz telefone ou horário; os endereços dos CRAS |
| 3 | https://desenvolvimentosocial.rc.sp.gov.br/?page_id=3375 | O critério de renda do Bolsa Família e a data da página |
| 4 | https://www.gov.br/pt-br/servicos/inscrever-se-no-cadastro-unico-para-programas-sociais-do-governo-federal | Responsável com 16 anos ou mais, preferencialmente mulher; documentos; gratuidade; data da última modificação |
| 5 | https://www.gov.br/pt-br/servicos/receber-o-bolsa-familia | **Valor atual** do critério de renda por pessoa (vale este, não o da Prefeitura, se divergir) |

### Em seguida (prioridades 2 e 3)

| Assunto | Abrir | Verificar |
|---|---|---|
| BPC | https://desenvolvimentosocial.rc.sp.gov.br/?page_id=1954 e `?page_id=1927`; https://www.gov.br/mds/pt-br/acoes-e-programas/suas/beneficios-assistenciais/beneficio-assistencial-ao-idoso-e-a-pessoa-com-deficiencia-bpc | Quem pode, como pedir (INSS, 135, Meu INSS), relação com o CadÚnico |
| Moradia | https://rioclaro.sp.gov.br/wp-content/uploads/2025/11/CRITERIOS-DE-ELEGIBILIDADE.pdf; https://rioclaro.sp.gov.br/planejamento-e-habitacao/em-rio-claro-atualizacao-cadastral-para-programa-habitacional-vai-ate-28-de-fevereiro/ | Se há prioridade para **mulher responsável pela família, declarada no CadÚnico**; o que é preciso para atualizar o cadastro habitacional |
| Tarifa social de energia | https://desenvolvimentosocial.rc.sp.gov.br/?page_id=3384 | Passo a passo e documentos |
| Cursos do Fundo Social | https://rioclaro.sp.gov.br/secretarias/fundo-social-de-solidariedade/rio-claro-abre-inscricoes-para-cursos-de-qualificacao-gratuitos/ | Se a inscrição é **só pelo Cadu**; data; idade mínima; quantidade de vagas |
| Comida | https://desenvolvimentosocial.rc.sp.gov.br/wp-content/uploads/2026/01/PLAMSAN-2025-2028.pdf | Quais ações existem hoje e como a família chega a elas (o arquivo é grande: imprimir só as páginas de ações) |
| Pensão e paternidade | https://www12.senado.leg.br/noticias/especiais/especial-cidadania/pensao-alimenticia-atende-necessidades-basicas-e-padrao-de-vida/como-fazer-para-pedir-pensao-alimenticia | Documentos; o que fazer se o pai não consta na certidão; que a pensão vale a partir do pedido |

### Conferência por quem frequenta os locais (complementar)

Pessoas que usam o posto do Paço Municipal ou os CRAS podem dizer **o que mudou de verdade**: horário, se precisa agendar, quanto espera. Isso **não é fonte** (é relato, nível C) e não vira texto publicado; serve para descobrir divergência com a página oficial e para decidir o que perguntar ao órgão. O que for publicado continua vindo de página oficial ou de confirmação por telefone com o órgão. Perguntas, só factuais e sem identificar ninguém:

1. Em que endereço foi atendida e em que dia da semana?
2. Que horas chegou e que horas foi atendida?
3. Precisou agendar antes, ou foi direto?
4. Que documentos pediram além dos que a página lista?
5. Ligou antes? Qual telefone atendeu?

Registrar apenas o dia da conferência e as respostas, sem nome nem relato pessoal. Se várias respostas divergirem da página oficial, ligar para o órgão e atualizar a fonte.
