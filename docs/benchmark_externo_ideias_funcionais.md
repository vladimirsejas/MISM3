# Benchmark externo — ideias funcionais para o MISM3

**Data da pesquisa:** 2026-10-09  
**Objetivo:** estudar produtos e fontes públicas que resolvem partes do problema do MISM3 e transformar as boas práticas em trabalho concreto para Rio Claro. Não copiar interfaces ou alegar parceria com as plataformas citadas.

## Conclusão executiva

O MISM3 deve combinar quatro modelos que hoje aparecem separados:

1. **Busca por necessidade em linguagem comum**, inspirada na busca de serviços digitais do gov.br.
2. **Diretório local de recursos e serviços**, inspirado no Findhelp/211, com fonte, atualização, filtros e orientação clara para o próximo passo.
3. **Conexão entre necessidades relacionadas**, como emprego + curso + creche + transporte.
4. **Marketplace local de profissionais mulheres**, com perfis voluntários, regras transparentes, segurança, denúncia e avaliações cuidadosas.

O diferencial não será simplesmente reunir links. Será explicar: **qual caminho serve para esta necessidade, o que a pessoa precisa fazer, o que deve confirmar e qual é a alternativa se o primeiro caminho não funcionar.**

## 1. Produtos e práticas estudados

### A. Findhelp — diretório de recursos e encaminhamentos

Referências:
- https://www.findhelp.org/
- https://company.findhelp.com/products/platform/
- https://go.findhelp.com/support/getting-started-with-findhelp

Recursos documentados pela própria plataforma:
- busca e autoencaminhamento a recursos;
- cartões de programas com data de revisão;
- filtros e listas salvas;
- ferramentas para que organizações atualizem informações;
- encaminhamentos com status e acompanhamento de resultados;
- possibilidade de pesquisar sem login;
- recomendações de programas baseadas nas necessidades informadas.

**Ideias para MISM3:**
- Cada ficha deve mostrar “conferido em”, fonte primária e estado da informação.
- O primeiro uso não deve exigir conta.
- O catálogo deve distinguir serviço encontrado, elegibilidade desconhecida, contato pendente e disponibilidade não confirmada.
- Futuramente, se existirem parceiros e consentimento, registrar encaminhamentos com estados simples: link aberto pela usuária (não rastreado), contato iniciado (informado voluntariamente), atendida/não atendida (informado voluntariamente). Não alegar que sabemos se a pessoa foi atendida sem confirmação.
- Criar um processo leve para corrigir ficha desatualizada.

**Não copiar nesta fase:** prontuário individual, rastreamento de pessoas, perfil sensível ou integração de encaminhamento. Isso aumentaria a coleta de dados e a responsabilidade do projeto.

### B. United Way 211 — navegação por necessidades reais

Referências:
- https://www.211.org/about-us
- https://register.211.org/

O 211 descreve uma rede de atendimento humano que conecta pessoas a recursos locais para necessidades como moradia, alimentação, transporte e saúde; seus canais podem ser confidenciais e anônimos. A plataforma de dados também descreve diretório, APIs e análise de demanda, com acesso a recursos específicos condicionado à participação da rede.

**Ideias para MISM3:**
- Organizar a entrada por situações da vida, não por nomes de secretarias.
- Cobrir necessidades básicas que frequentemente aparecem juntas: comida, moradia, contas essenciais, transporte, saúde, cuidado infantil, renda e proteção.
- Para cada necessidade, oferecer uma sequência curta: “comece aqui”, “o que confirmar”, “documentos publicados pela fonte”, “alternativa se não conseguir”.
- Um diretório digital não substitui atendimento humano. Futuramente, explorar contatos públicos de organizações comunitárias e canais de orientação, sem prometer uma central 24h que não existe.
- Analisar apenas estatísticas agregadas de busca, sem armazenar frases sensíveis nem CEPs.

**Limite:** o 211 é uma rede norte-americana, não um serviço que o MISM3 possa simplesmente reproduzir no Brasil. Usamos os princípios de navegação e catálogo, não os números nem as alegações de cobertura.

### C. gov.br — busca e navegação por categorias

Referências:
- https://www.gov.br/pt-br/servicos/buscar-servicos-por
- https://www.gov.br/pt-br/por-dentro-do-govbr/ajuda-para-navegar-o-portal

O portal permite procurar por assunto e navegar por categorias, órgãos, estados e público-alvo.

**Ideias para MISM3:**
- Aceitar linguagem cotidiana e sinônimos (“estou desempregada”, “preciso trabalhar”, “quero curso”).
- Manter também botões de categorias para quem não sabe o que escrever.
- Mostrar resultados agrupados por objetivo: resolver agora, preparar-se, entender direitos, encontrar apoio.
- Quando a busca não for reconhecida, sugerir exemplos em vez de exibir uma página vazia.
- Não deixar uma única palavra ampla (“escola”, “filho”, “renda”) escolher silenciosamente uma resposta errada: quando houver ambiguidade, apresentar opções de interpretação.

### D. Womyn Owned — diretório com verificação rastreável

Referência:
- https://www.womynowned.com/

O diretório apresenta fornecedores certificados e informa a origem da certificação, a data de obtenção da informação e o link para a entidade certificadora.

**Ideias para o futuro marketplace De Mulher para Mulher:**
- Separar “identidade verificada”, “qualificação profissional verificada” e “negócio declarado pela própria profissional”; não misturar esses selos.
- Exibir data e método de cada verificação, em vez de um selo vago.
- Permitir filtros por tipo de serviço, região atendida, atendimento domiciliar/remoto, faixa de preço declarada e acessibilidade informada.
- Ter perfil de correção/denúncia e processo de revisão.
- Não prometer que a profissional é segura apenas porque tem identidade verificada. Verificação não garante qualidade, conduta ou resultado.
- Não coletar documento ou informação sensível além do estritamente necessário; a verificação de gênero e a eventual autenticação precisam de análise jurídica/técnica antes da implementação.

**Limite:** o diretório citado atua nos EUA e usa certificação comercial específica. O MISM3 precisa criar seus próprios critérios adequados ao Brasil; não deve copiar o selo nem afirmar equivalência.

### E. DataMulheres e Dados Abertos do SUS — evidências para planejar

Referências:
- https://www.gov.br/mulheres/pt-br/observatorio-brasil-da-igualdade-de-genero/datamulheres
- https://dadosabertos.saude.gov.br/

O DataMulheres reúne indicadores oficiais sobre a realidade das mulheres; o portal de dados abertos do SUS disponibiliza bases públicas em formatos estruturados, incluindo CSV, JSON, XML e API, conforme o conjunto de dados.

**Ideias para MISM3:**
- Usar indicadores oficiais para contextualizar necessidades, sempre anotando período, escala geográfica e limitações.
- Usar dados estruturados do SUS/CNES para ampliar o catálogo de saúde, mas não inferir agenda, vaga, qualidade ou funcionamento atual a partir do cadastro.
- Não fabricar indicadores municipais quando a fonte só permite resultado estadual ou nacional.
- Separar claramente “dados para entender a população” de “dados para encontrar um serviço hoje”.

### F. ONU Mulheres — segurança digital desde o desenho

Referências:
- https://brasil.unwomen.org/pt-br/stories/noticia/2025/12/tiktok-e-onu-mulheres-lancam-cartilha-de-seguranca-online-para-fortalecer-protecao-de-mulheres-e-meninas-no-ambiente-digital
- https://www.unwomen.org/en/what-we-do/ending-violence-against-women

A orientação pública enfatiza privacidade, moderação, denúncia, apoio especializado e prevenção de assédio e violência digital.

**Ideias para MISM3:**
- A busca por proteção deve funcionar sem cadastro.
- Não pedir que a mulher conte detalhes de violência para mostrar contatos de ajuda.
- Não criar notificações, mensagens ou histórico sensível por padrão.
- Explicar com honestidade que “sair rápido” não apaga o histórico do navegador.
- Se o marketplace for implementado, permitir denúncia, bloqueio e retirada de conteúdo, além de definir regras contra assédio, fraude, discriminação e divulgação de dados pessoais.
- Avaliar riscos de segurança antes de publicar localização exata, agenda ou endereço residencial de uma profissional.

## 2. Ideias de produto que podem diferenciar o MISM3

### 2.1 Caminho completo para uma necessidade
Exemplo “preciso de emprego e tenho filhos pequenos”:
1. oportunidades de emprego;
2. cursos ou preparação;
3. informações oficiais de creche/escola;
4. transporte público;
5. assistência social quando pertinente;
6. alternativa se algum cadastro não estiver disponível.

Cada etapa mostra fonte e limitações. O sistema não presume que existe vaga de creche nem que a usuária é elegível para um benefício.

### 2.2 Cartão de serviço que responde às perguntas práticas
Cada ficha, quando a fonte fornecer os dados, deve responder:
- O que é e quem pode procurar?
- Onde fica e qual região atende?
- Como entrar em contato?
- Qual horário foi publicado?
- Que documentos a fonte diz que são necessários?
- Existe inscrição ou prazo público?
- Quando a informação foi conferida?
- O que ainda não foi confirmado?
- Qual alternativa pode ajudar se esse caminho falhar?

### 2.3 Busca que reconhece mais de uma necessidade
O sistema deve poder classificar uma frase em mais de uma categoria. Exemplo: “preciso trabalhar, mas não tenho com quem deixar meu filho” → emprego + cuidado infantil. Na primeira versão, isso pode ser feito por regras locais e testadas; não precisa começar com IA generativa.

### 2.4 Correção comunitária sem publicação automática
Botão “Informação incorreta ou desatualizada”. A pessoa pode informar o problema sem ter que criar uma conta. O relato entra em fila de revisão; não altera a ficha publicamente até ser validado.

### 2.5 Catálogo de profissionais mulheres, com confiança explicada
No futuro, cada perfil pode mostrar:
- serviços oferecidos e região de atendimento;
- preço ou “sob consulta”;
- formas de atendimento;
- identidade verificada (se houver processo válido);
- qualificação profissional verificada, quando aplicável;
- avaliações com regras contra retaliação e avaliações falsas;
- data da última atualização;
- botão de denunciar/bloquear.

A plataforma deve explicar que os selos confirmam apenas aquilo que foi realmente verificado.

### 2.6 Painel de qualidade do próprio MISM3
Antes de fazer afirmações sobre falta de atendimento, medir qualidade do catálogo:
- percentual de fichas com fonte;
- percentual com data de revisão;
- percentual com telefone/endereço confirmados;
- quantidade de fichas desatualizadas ou incompletas;
- categorias sem dados suficientes.

Essas métricas medem a qualidade da base do projeto, não a qualidade dos serviços públicos.

## 3. Plano priorizado

### P0 — agora: busca e confiança
- Melhorar os sinônimos da busca local.
- Tratar ambiguidades e múltiplas necessidades.
- Acrescentar data de revisão e estado de validação a cada ficha.
- Testar links e remover links quebrados.
- Garantir que ausência no catálogo não seja descrita como inexistência do serviço.
- Fazer teste de acessibilidade móvel, teclado, contraste e linguagem simples.

### P1 — próximo: jornadas integradas
- Criar jornadas emprego + curso + filhos + transporte.
- Completar catálogo de saúde e assistência a partir de fontes públicas verificáveis.
- Validar educação infantil com os campos oficiais corretos.
- Estruturar transporte apenas quando houver tabelas legíveis e atuais.

### P2 — depois: qualidade e participação
- Receber sugestões de correção e revisar manualmente.
- Criar indicadores da qualidade e atualização do catálogo.
- Fazer testes com pessoas usando tarefas fictícias, sem recolher histórias pessoais.

### P3 — futuro: De Mulher para Mulher
- Definir política de cadastro, verificação, moderação, avaliações, denúncia e proteção de dados.
- Testar primeiro um catálogo pequeno de profissionais voluntárias.
- Só depois considerar conta de usuária, mensagens, pagamentos ou integração de autenticação.

## 4. Princípios que não vamos negociar

- Não solicitar dados à Prefeitura nem propor pedidos LAI como dependência do projeto.
- Priorizar fontes públicas oficiais e fontes originais.
- Não inventar vaga, horário, serviço, endereço, estatística ou certificação.
- Não armazenar CEP ou relato sensível sem necessidade e justificativa.
- Não exigir conta para consultar serviços públicos e canais de proteção.
- Não confundir cadastro, disponibilidade, qualidade e segurança.
- Não prometer verificação ou proteção que o sistema ainda não realiza.

## Fontes de pesquisa

- Findhelp, plataforma: https://company.findhelp.com/products/platform/
- Findhelp, busca e encaminhamentos: https://go.findhelp.com/support/getting-started-with-findhelp
- United Way 211: https://www.211.org/about-us
- gov.br, busca por serviços: https://www.gov.br/pt-br/servicos/buscar-servicos-por
- Womyn Owned: https://www.womynowned.com/
- DataMulheres: https://www.gov.br/mulheres/pt-br/observatorio-brasil-da-igualdade-de-genero/datamulheres
- Dados Abertos do SUS: https://dadosabertos.saude.gov.br/
- ONU Mulheres Brasil, segurança digital: https://brasil.unwomen.org/pt-br/stories/noticia/2025/12/tiktok-e-onu-mulheres-lancam-cartilha-de-seguranca-online-para-fortalecer-protecao-de-mulheres-e-meninas-no-ambiente-digital

**Nota:** este documento é benchmark e plano de produto, não auditoria técnica nem confirmação de que APIs, parcerias, integrações ou licenças estejam disponíveis para o MISM3.
