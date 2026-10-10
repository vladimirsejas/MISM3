# Fontes oficiais de Rio Claro aproveitáveis no MISM3

Levantamento em 09/10/2026. Este documento identifica fontes e usos potenciais; não significa que os dados já tenham sido importados nem que os indicadores estejam calculados/validados.

## 1. Saúde da mulher: protocolos e indicadores

**Fundação Municipal de Saúde:** https://www.saude-rioclaro.org.br/

Protocolos localizados:
- Câncer de mama: https://www.saude-rioclaro.org.br/protocolos/Protocolo%20CA%20de%20mama.pdf
- Câncer do colo do útero (revisão indicada em 03/06/2026): https://www.saude-rioclaro.org.br/protocolos/Protocolo%20CA%20colo%20do%20utero%202026.pdf

O protocolo de mama menciona 127 diagnósticos registrados em Rio Claro entre 2020 e 2024. Esse número deve ser citado com seu período e definição original; não deve ser tratado automaticamente como incidência, prevalência ou número anual de casos novos.

Os protocolos descrevem indicadores que podem orientar o painel de gestão:
- Mama: cobertura de mamografia, prazo para resultado, tempo de espera para atenção especializada, prazo de liberação histopatológica, início do tratamento e mortalidade.
- Colo do útero: razão de exames citopatológicos em mulheres de 25 a 64 anos, amostras insatisfatórias, positividade, seguimento de lesões de alto grau e mortalidade.

Os protocolos são documentos de organização do cuidado, não uma base municipal completa com numeradores, denominadores e séries históricas. Solicitar os dados agregados à Fundação Municipal de Saúde antes de calcular/publicar indicadores.

Outras fontes para investigar:
- Vigilância Epidemiológica: https://www.saude-rioclaro.org.br/ve.htm
- Saúde da População Negra: https://www.saude-rioclaro.org.br/saudedapopulacaonegra.htm

As páginas de boletins e coberturas vacinais exibiram menus na inspeção; não foi possível confirmar nelas uma série pronta para download. Investigar os anexos/documentos ligados às páginas.

## 2. Catálogo oficial de serviços e unidades

- Portal de Serviços: https://rioclaro.sp.gov.br/portal-de-servicos/
- Unidades Básicas de Saúde: https://rioclaro.sp.gov.br/unidades-basicas-de-saude/
- Unidades Saúde da Família: https://rioclaro.sp.gov.br/unidades-saude-familia/
- Postos de Saúde e urgência: https://rioclaro.sp.gov.br/postos-de-saude/
- Secretaria da Mulher: https://rioclaro.sp.gov.br/secretaria/secretaria-da-mulher/
- Desenvolvimento Social: https://rioclaro.sp.gov.br/secretaria/secretaria-de-desenvolvimento-social/
- Direitos da Pessoa com Deficiência: https://rioclaro.sp.gov.br/secretaria/secretaria-municipal-dos-direitos-da-pessoa-com-deficiencia/
- Fundo Social: https://rioclaro.sp.gov.br/secretaria/fundo-social-de-solidariedade/
- Desenvolvimento Econômico (página cita PAT, Conecta Emprego e Centro de Inovação): https://rioclaro.sp.gov.br/secretaria/secretaria-de-desenvolvimento-economico/
- Mobilidade Urbana: https://rioclaro.sp.gov.br/secretaria/secretaria-de-mobilidade-urbana-e-sistema-viario/

Uso recomendado no MISM3:
1. Catálogo de serviços com nome, categoria, público, endereço, telefone, horário, URL da fonte e data da última conferência.
2. Filtros para saúde da mulher, proteção/violência, assistência social, acessibilidade, trabalho e renda, mobilidade e orientação cidadã.
3. Encaminhamento por links e contatos oficiais; não prometer disponibilidade, elegibilidade ou vaga sem confirmação.
4. Após validação dos endereços, oferecer busca territorial de serviços.

As páginas não garantem catálogo completo de programas, critérios de elegibilidade ou disponibilidade atual. Confirmar com os órgãos responsáveis e manter data de atualização.

## 3. Planejamento, transparência e participação

- Prefeitura: https://rioclaro.sp.gov.br/
- Portal da Transparência: https://transparencia.rioclaro.sp.gov.br/
- Planejamento, Gestão e Desenvolvimento Urbano: https://rioclaro.sp.gov.br/secretaria/secretaria-de-planejamento/
- Ouvidoria: https://rioclaro.sp.gov.br/secretaria/ouvidoria/

Podem contextualizar políticas, orçamento, editais, convênios, planos e manifestações de cidadãos. O portal de transparência foi localizado, mas não foi confirmada uma API aberta ou um conjunto estruturado reutilizável; verificar antes de automatizar extração.

## Próximos passos recomendados

1. Montar/atualizar o catálogo de serviços com fonte e data de verificação.
2. Preparar no painel de gestão os indicadores definidos nos protocolos, marcados como “dados necessários” até obter dados operacionais validados.
3. Buscar séries agregadas por ano e, quando possível, território/faixa etária, com dicionário de dados e metodologia.
4. Registrar para cada indicador definição, fonte, período, numerador, denominador, atualização, cobertura e limitações.

## Privacidade e qualidade

- Não publicar dados pessoais ou registros de pacientes.
- Não combinar localização individual de paciente com o índice de CEP.
- Não tratar notícia, protocolo ou contagem isolada como base epidemiológica completa.
- Distinguir dados oficiais, informações de contato e aproximações territoriais.


## Fontes complementares para indicadores de saúde da mulher

Estas fontes podem apoiar o painel de gestão, desde que os indicadores sejam calculados a partir de dados documentados e agregados:

- DATASUS/SISCAN: https://datasus.saude.gov.br/acesso-a-informacao/sistema-de-informacao-do-cancer-siscan-colo-do-utero-e-mama/ — consultas de citopatologia/histopatologia do colo do útero, mamografias e exames de mama; há opções por residência e local de atendimento.
- DATASUS — Epidemiologia e morbidade: https://datasus.saude.gov.br/epidemiologicas-e-morbidade/ — caminhos para SIH/SUS, SIM, SINAN e SISCAN.
- INCA — Dados e Números de câncer de mama: https://www.gov.br/inca/pt-br/assuntos/gestor-e-profissional-de-saude/controle-do-cancer-de-mama/dados-e-numeros
- INCA — Dados e Números de câncer do colo do útero: https://www.gov.br/inca/pt-br/assuntos/gestor-e-profissional-de-saude/controle-do-cancer-do-colo-do-utero/dados-e-numeros
- Portal de Dados Abertos do SUS — Prevenção de câncer de colo e mama: https://dadosabertos.saude.gov.br/dataset/mgdi-prevencao-do-cancer-de-colo-e-mama
- Painel-Oncologia: https://www.gov.br/saude/pt-br/composicao/saes/cgcan/cgcan

O protocolo municipal de câncer do colo do útero localizado no portal menciona 35 encaminhamentos em 2023 e 55 em 2024 para tratamento de lesões precursoras, câncer in situ e/ou invasor. O protocolo municipal de câncer de mama menciona 127 diagnósticos registrados entre 2020 e 2024. Sempre apresentar esses números com sua definição e período de origem; não tratá-los como equivalentes a internações, incidência ou número de pessoas únicas sem metodologia adicional.

### Separação entre MISM3 e MISM2

- **MISM3:** prioridade de produto. Usar os protocolos para orientar o catálogo municipal, os encaminhamentos e a estrutura dos indicadores do painel; não exibir valores calculados sem dados de origem validados.
- **MISM2:** preservar fontes e métodos para análise de saúde da mulher baseada em SIH/SUS. SISCAN, SIM, SIA, INCA e os protocolos locais podem complementar a interpretação, mas seus eventos e unidades de contagem são distintos.
- Nunca transferir registros individuais ou localização de pacientes para o MISM3. Reutilizar somente referências, definições e estatísticas agregadas com proveniência documentada.
