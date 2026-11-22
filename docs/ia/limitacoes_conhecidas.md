# Limitações conhecidas do MISM3

Atualizado em 12/10/2026. Este documento descreve o que os testes e a arquitetura sustentam hoje; não é uma certificação de funcionamento em campo.

## Métricas já existentes do classificador

O projeto já possui avaliação em `docs/ia/avaliacao_modelo_necessidades.md`, gerada por `pipeline/treinar_necessidades.py`; criar outro avaliador paralelo para repetir o mesmo cálculo seria duplicação.

No relatório versionado desta branch, a validação cruzada em 408 frases da equipe mostra **F1 de 76%** para regras + modelo, com precisão de 71%, recall de 80% e acerto exato de 57%. No conjunto antigo de 66 frases, regras + modelo chegaram a 98% de F1, mas essas frases foram escritas para as regras e favorecem esse sistema; esse resultado não deve ser tratado como estimativa de desempenho em campo. As métricas são comparativas, não promessas.

## Interpretação de texto

- O classificador de necessidades combina modelo local (TF-IDF/regressão logística) e regras. As frases de treino e os conjuntos sintéticos são escritos pela equipe, não por usuárias reais; o desempenho real pode ser inferior.
- O orientador (`web/orientar.js`) é uma busca com aprendizado de máquina leve (palavras, letras, significado por LSA e intenção), não um modelo de linguagem. A caixa de dúvida antiga (`duvida.js`, lexical) foi substituída por ele; os números e limites medidos estão em `docs/ia/avaliacao_orientacao.md` (abstenção em escopo ainda fraca: cerca de 70%).
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


## Ciclo de vida do texto livre

O orientador não envia perguntas para APIs de linguagem nem para serviços externos. Os únicos pedidos de rede associados à busca são GETs same-origin para os arquivos JSON estáticos do classificador, do índice e dos detectores. A mensagem digitada não integra URL, corpo de requisição ou telemetria. Não há `localStorage`, `sessionStorage`, cookies ou IndexedDB para guardar perguntas.

Os campos de dúvida das áreas e a caixa inicial são limpos ao navegar para outra área, voltar ao início ou abrir uma vista. O alerta determinístico de perigo é calculado imediatamente, antes do carregamento dos modelos. Se os arquivos não estiverem disponíveis, a aplicação mantém a orientação fixa e os telefones de emergência; isso não transforma o classificador em avaliação clínica ou garantia de proteção.


## Atualização territorial — 09/11/2026

O mapa territorial e o painel de qualidade estão implementados em versão exploratória, mas não estão liberados para publicação: as páginas permanecem com `noindex, nofollow`. A malha tem 408 setores; 17 setores são protegidos pela D4 e não exibem valores demográficos ou distâncias. Os resumos de distância consideram no máximo 391 setores.

As distâncias são medidas em linha reta, não rotas, tempos ou acesso efetivo. O centro do CEP institucional é uma aproximação e não comprova a localização do equipamento. O envelope geométrico operacional não é intervalo de confiança. A regeneração final dos derivados que dependem de CNES, CNEFE e microdados INEP locais permanece pendente; não tratar os arquivos versionados atuais como regeneração final.
