# Levantamento de fontes municipais para o MISM3

**Levantamento realizado em 09/10/2026.** Este documento registra fontes públicas consultadas e possibilidades de uso no MISM3. Ele não significa que os dados já tenham sido importados ou que os indicadores estejam validados.

## Prioridade 1 — Saúde da mulher: protocolos e indicadores

### Fundação Municipal de Saúde de Rio Claro
Portal: https://www.saude-rioclaro.org.br/

A área de Protocolos disponibiliza documentos oficiais para organizar o cuidado, inclusive:
- Protocolo de saúde da mulher no rastreamento, diagnóstico e acompanhamento do câncer de mama: https://www.saude-rioclaro.org.br/protocolos/Protocolo%20CA%20de%20mama.pdf
- Protocolo de câncer do colo do útero, revisão de 03/06/2026: https://www.saude-rioclaro.org.br/protocolos/Protocolo%20CA%20colo%20do%20utero%202026.pdf

O protocolo de mama menciona 127 diagnósticos de câncer de mama registrados em Rio Claro entre 2020 e 2024. Esse número deve ser apresentado com o período e a definição do próprio documento, sem ser tratado automaticamente como incidência, prevalência ou número de casos novos por ano.

Os protocolos também descrevem indicadores potencialmente úteis para o painel de gestão:
- câncer de mama: cobertura de mamografia de rastreamento, prazo para resultado, tempo de espera para atenção especializada, prazo para resultado histopatológico, início do tratamento e mortalidade;
- câncer do colo do útero: razão de exames citopatológicos em mulheres de 25 a 64 anos, proporção de amostras insatisfatórias, índice de positividade, seguimento de lesões de alto grau e mortalidade.

**Limite:** os documentos definem indicadores e fluxos assistenciais; não substituem uma base municipal com numeradores, denominadores, datas e metodologia para calcular séries históricas. Antes de publicar gráficos, obter e validar os dados operacionais correspondentes com a Fundação Municipal de Saúde.

Outras áreas do portal que podem fornecer material de apoio:
- Vigilância Epidemiológica, boletins e coberturas vacinais: https://www.saude-rioclaro.org.br/ve.htm
- Saúde da População Negra: https://www.saude-rioclaro.org.br/saudedapopulacaonegra.htm

Na inspeção realizada, as páginas de boletins e coberturas vacinais exibiram principalmente menus; não foi possível confirmar nelas uma série de dados pronta para download. Investigar os documentos e anexos ligados a essas páginas antes de assumir que os dados estão disponíveis.

## Prioridade 2 — Catálogo oficial de serviços e unidades

Portal de Serviços da Prefeitura: https://rioclaro.sp.gov.br/portal-de-servicos/

Páginas oficiais úteis:
- Unidades Básicas de Saúde: https://rioclaro.sp.gov.br/unidades-basicas-de-saude/
- Unidades Saúde da Família: https://rioclaro.sp.gov.br/unidades-saude-familia/
- Postos de Saúde e unidades de urgência: https://rioclaro.sp.gov.br/postos-de-saude/
- Secretaria da Mulher: https://rioclaro.sp.gov.br/secretaria/secretaria-da-mulher/
- Secretaria de Desenvolvimento Social: https://rioclaro.sp.gov.br/secretaria/secretaria-de-desenvolvimento-social/
- Secretaria dos Direitos da Pessoa com Deficiência: https://rioclaro.sp.gov.br/secretaria/secretaria-municipal-dos-direitos-da-pessoa-com-deficiencia/
- Fundo Social de Solidariedade: https://rioclaro.sp.gov.br/secretaria/fundo-social-de-solidariedade/
- Desenvolvimento Econômico (inclui referências ao PAT, Conecta Emprego e Centro de Inovação Tecnológica): https://rioclaro.sp.gov.br/secretaria/secretaria-de-desenvolvimento-economico/
- Mobilidade Urbana: https://rioclaro.sp.gov.br/secretaria/secretaria-de-mobilidade-urbana-e-sistema-viario/

Usos possíveis no MISM3:
1. Manter um catálogo com nome do serviço, público atendido, endereço, telefone, horário, fonte e data da última verificação.
2. Permitir filtros por tema: saúde da mulher, violência e proteção, assistência social, deficiência/acessibilidade, trabalho e renda, transporte e orientação cidadã.
3. Exibir os contatos oficiais e abrir a fonte original, em vez de inventar orientações ou apresentar informação desatualizada como certa.
4. Após validar endereços e geocodificação, mostrar serviços próximos ou acessíveis por região.

**Limite:** páginas de secretaria nem sempre contêm o catálogo completo de programas, critérios de elegibilidade, vagas ou disponibilidade atual. Os dados devem ser verificados e, se necessário, confirmados diretamente com os órgãos responsáveis.

## Prioridade 3 — Transparência, planejamento e participação

- Portal principal: https://rioclaro.sp.gov.br/
- Portal da Transparência: https://transparencia.rioclaro.sp.gov.br/
- Planejamento, Gestão e Desenvolvimento Urbano: https://rioclaro.sp.gov.br/secretaria/secretaria-de-planejamento/
- Ouvidoria: https://rioclaro.sp.gov.br/secretaria/ouvidoria/
- Publicações e Diário Oficial são acessíveis a partir do portal municipal.

Usos possíveis:
- identificar planos, orçamento, convênios, editais e programas que contextualizem políticas públicas para mulheres;
- documentar a fonte oficial de cada dado e a data de publicação;
- acompanhar políticas anunciadas, mantendo notícias separadas de indicadores quantitativos.

O Portal da Transparência foi identificado, mas a inspeção não confirmou uma API aberta ou um conjunto de dados estruturados diretamente reutilizável. Isso precisa ser verificado antes de automatizar coleta.

## Recomendação de implementação

1. **Primeiro:** incorporar ao catálogo de serviços os contatos e endereços oficiais mais relevantes para mulheres, saúde, assistência e proteção, guardando URL de origem e data de verificação.
2. **Segundo:** preparar no painel de gestão a estrutura dos indicadores descritos nos protocolos de mama e colo do útero, inicialmente marcados como “dados necessários” até que a Fundação forneça numeradores e denominadores validados.
3. **Terceiro:** solicitar/identificar dados agregados municipais e séries históricas, preferencialmente por ano, território e faixa etária, com documentação metodológica e sem dados pessoais.
4. **Quarto:** avaliar os dados de planejamento, orçamento, editais e Ouvidoria para contextualizar ações e monitorar políticas públicas.

## Proteção de dados e qualidade

- Não coletar, armazenar ou publicar dados pessoais de pacientes.
- Não inferir endereço de paciente a partir do índice de CEPs para produzir indicadores públicos.
- Não tratar notícia, protocolo ou contagem isolada como uma base epidemiológica completa.
- Registrar para cada indicador: definição, fonte, período, numerador, denominador, data de atualização, cobertura e limitações.
- Distinguir claramente dados oficiais publicados, informações de contato e aproximações territoriais.

