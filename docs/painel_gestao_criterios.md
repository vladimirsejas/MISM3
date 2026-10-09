# Painel de gestão: critérios de utilidade e limites

## Objetivo

O painel deve ajudar a gestão a decidir o que investigar e qual ação testar, não apenas apresentar gráficos. Cada recomendação precisa deixar explícitos: sinal observado, ação proposta, responsável sugerido, indicador de acompanhamento e informação que deve ser confirmada antes de decidir.

## Estado deste protótipo

- Os números de buscas, demanda, oferta, desistência e crianças de 0 a 4 anos são **fictícios**.
- A malha dos setores censitários é usada como geometria; ela não torna reais os valores fictícios associados aos setores.
- Os nomes de regiões e as ocorrências de buscas sem resultado são exemplos de demonstração, não um retrato de Rio Claro.
- As recomendações são regras transparentes e ilustrativas, não previsões nem decisões automáticas.
- A alternância entre “Visão pública” e “Visão de gestão” apenas esconde partes da interface no navegador. **Não é autenticação nem autorização.** Dados reais exclusivos da gestão não podem ser colocados em arquivos estáticos acessíveis publicamente. Uma implantação real exigiria autenticação, autorização no servidor, proteção das APIs e dos arquivos e revisão de segurança.
- A supressão de valores pequenos é apenas uma demonstração. Antes de publicar estatísticas reais, é necessário avaliar risco de reidentificação por cruzamento, geografia, período e totais complementares; um limite fixo de cinco não garante anonimato.
- Não registrar nem encaminhar relatos individuais de saúde, violência ou questões jurídicas para o painel de gestão. A análise deve usar apenas dados cuja finalidade, base legal, acesso, retenção e agregação tenham sido definidos.

## Recomendações demonstrativas

### 1. Acesso à orientação jurídica

Quando o cenário apresenta buscas sem resultado sobre guarda, pensão ou orientação jurídica, a ação sugerida é mapear e confirmar a rede: Defensoria Pública, assistência jurídica pública e advogadas com atuação pertinente. Antes de exibir um contato, confirmar inscrição profissional quando aplicável, especialidade declarada, critérios de atendimento, custo, horário, acessibilidade e data da verificação.

Indicadores possíveis quando houver dados reais e base legal: percentual de encaminhamentos que encontram um serviço confirmado, tempo até a primeira orientação e proporção de serviços com cadastro atualizado. Não medir a qualidade de uma profissional apenas por estar cadastrada.

### 2. Trabalho e cuidado infantil

Antes de recomendar abrir vagas ou novas turmas, cruzar demanda oficial por faixa etária, fila de espera, vagas realmente disponíveis, horários, critérios de matrícula, transporte e compatibilidade com horários de trabalho ou estudo. Contagem de crianças por setor, isoladamente, não prova falta de vagas.

### 3. Transporte e acesso aos serviços

Antes de concluir que falta transporte, confirmar linhas, horários, acessibilidade e conexão com os serviços relevantes. Ausência de informação no catálogo é uma lacuna informacional; não é prova de ausência do serviço.

### 4. Qualidade do catálogo

Campos preenchidos não garantem dados corretos. Registrar fonte, responsável e data de confirmação; priorizar a revisão de serviços críticos, especialmente proteção, saúde, apoio jurídico, assistência social e cuidado infantil.

## Regra de decisão

O painel não deve converter automaticamente um sinal em decisão de orçamento ou atribuir causalidade. Deve apresentar a hipótese, dizer o que os dados permitem concluir, explicitar o que falta e propor uma verificação concreta. Decisões de contratação, expansão de serviços ou distribuição de recursos continuam exigindo validação humana e dados adequados.

## Referências consultadas

- Governo Digital, Brasil — [Decisão Baseada em Dados](https://www.gov.br/governodigitallogin/pt-br/infraestrutura-nacional-de-dados/decisao-baseada-em-dados): usar análise para reduzir incerteza e aprimorar serviços públicos.
- Office for Statistics Regulation — [Regulatory guidance: Dashboards](https://osr.statisticsauthority.gov.uk/guidance/regulatory-guidance-dashboards/pages/4/): comunicar limitações e incerteza de forma clara, com avisos importantes em destaque.
- Government Digital Service, Reino Unido — [Implement a data quality action plan](https://www.gov.uk/government/publications/implement-a-data-quality-action-plan): priorizar problemas de qualidade, definir ação, prazo, responsável e revisão.
- Government Analysis Function — [Statistical disclosure control for tables](https://analysisfunction.civilservice.gov.uk/policy-store/statistical-disclosure-control-for-tables-produced-from-surveys/): pequenas contagens podem exigir supressão complementar para evitar inferência por subtração.

Essas referências fundamentam princípios gerais de trabalho com dados; não certificam este protótipo nem substituem a análise jurídica e de segurança necessária para uma implantação real.
