# Limitações conhecidas do MISM3

Atualizado em 12/10/2026. Este documento descreve o que os testes e a arquitetura sustentam hoje; não é uma certificação de funcionamento em campo.

## Interpretação de texto

- O classificador de necessidades combina modelo local (TF-IDF/regressão logística) e regras. As frases de treino e os conjuntos sintéticos são escritos pela equipe, não por usuárias reais; o desempenho real pode ser inferior.
- A busca contextual de `duvida.js` é lexical, com pontes de vocabulário revisadas. Não é compreensão semântica nem um modelo de linguagem. A primeira avaliação exploratória encontrou lacunas para perguntas sobre comida em casa, horário de matrícula da creche e denúncia de violência na área Direitos.
- O sistema pode se abster quando não encontra relação confiável. Isso reduz respostas inventadas, mas pode deixar uma necessidade sem encaminhamento; a abstenção também precisa ser avaliada.
- A regra de segurança é explícita e conservadora, não um diagnóstico nem uma avaliação individual de risco. Em situação de perigo, a orientação de emergência precisa permanecer visível.

## Plano e priorização

- `plano.js` usa uma ordem fixa, documentada e explicável. Os testes medem se o código aplica essa ordem, não se ela é adequada a todos os contextos reais.
- O sistema não confirma elegibilidade a benefícios, vaga, prioridade, prazo ou disponibilidade de atendimento.

## Mapa e território

- O bairro atribuído a um CEP é provável, derivado da malha/setores censitários do IBGE e pode divergir do nome popular ou da divisão administrativa municipal.
- Posição pelo CEP é aproximada. Serviços sem coordenada confiável não devem receber pontos inventados.
- Distância em linha reta não é tempo de viagem, acessibilidade por transporte nem comprovação de área de abrangência de um CRAS.
- Os indicadores territoriais usam dados públicos agregados. Não servem para rotular mulheres ou prever risco individual.

## Privacidade e validade

- A arquitetura atual evita enviar texto sensível para serviços externos e não deve adicionar telemetria de perguntas sem uma decisão de privacidade explícita.
- Testes sintéticos e CI verificam comportamentos programados; não substituem teste de usabilidade com pessoas, revisão de profissionais da rede nem confirmação periódica de telefones, endereços e regras municipais.
- Toda métrica deve declarar conjunto, tamanho, data, critérios e limitações. Não comparar números de conjuntos diferentes como se fossem equivalentes.
