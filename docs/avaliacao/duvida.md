# Avaliação da caixa de dúvida

## Método

O script `avaliacao/avaliar_duvida.js` executa o módulo real `web/duvida.js` com o conteúdo das áreas e o catálogo de serviços do repositório. Compara cada consulta com um alvo definido antes da execução e mede se algum alvo aparece entre os três primeiros resultados (`Acerto@3`). Consultas sem alvo esperado medem abstenção correta.

As perguntas são sintéticas, escritas pela equipe. Não são relatos de usuárias nem uma amostra representativa de uso real.

## Resultado da execução no GitHub Actions

Na primeira execução do conjunto de 22 consultas, antes de corrigir um rótulo de referência inadequado para atendimento psicológico:

- Acerto@3: **14/18 (77,8%)**.
- Abstenção correta em consultas sem alvo: **4/4 (100%)**.
- Respostas fora de escopo: **0**.

O gabarito de “preciso de atendimento psicológico” foi então corrigido para aceitar a âncora real `saude-unidades`, que aparece entre os resultados do módulo. A execução seguinte deve ser consultada no GitHub Actions para registrar o número final.

## Erros observados na primeira execução

- “estou sem comida em casa” não retornou trecho na área Assistência Social. A ponte lexical existe, mas não há uma resposta suficientemente relacionada na página atual. Isso pode ser uma abstenção prudente ou uma lacuna de orientação para apoio alimentar; precisa de decisão de produto e fonte verificada.
- “qual o horário de matrícula da creche” não encontrou a seção de educação infantil. É uma lacuna de recuperação lexical que merece revisão.
- “como denunciar violência contra a mulher” não encontrou trecho na área Direitos. O alerta de segurança é tratado em outra camada; ainda assim, a busca contextual deveria ser avaliada para encaminhar a conteúdo de proteção.

## Limitações

- O conjunto é pequeno e elaborado pela equipe; não permite afirmar acurácia em produção.
- A métrica só considera os três primeiros resultados e os alvos escolhidos para esse conjunto.
- A abstenção pode evitar inventar informação, mas também esconder uma necessidade legítima; os erros precisam de revisão humana.
- O script é reproduzível com `node avaliacao/avaliar_duvida.js` e está incluído no workflow de CI.
