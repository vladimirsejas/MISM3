# Avaliação do orientador (busca + segurança) do Mulher em Rede

Este documento mostra **como o orientador foi medido**, o que deu certo e **o que não deu**. Os números vêm de `avaliacao/` e podem ser repetidos por qualquer pessoa:

```
python avaliacao/avaliar.py v2 --conjunto teste          # v1 = assistente anterior; v2 = orientador atual
python avaliacao/avaliar.py v2 --conjunto desenvolvimento --erros
```

## O que é o orientador (e por que é um projeto de IA)

A mulher escreve do seu jeito e o sistema devolve **o serviço, a seção ou a ferramenta certa**, com telefone, endereço e a data da última conferência, explicando por que apareceu. Tudo roda no aparelho (nenhum texto é enviado), sem modelo de linguagem. São quatro sinais de aprendizado de máquina combinados, mais uma camada de segurança:

| Sinal | O que faz | Por que está aí |
|---|---|---|
| Palavras (TF-IDF com raízes) | Compara as palavras da pergunta com o texto de cada destino, dando mais peso às raras | Base da busca |
| Letras (n-gramas de caracteres) | Compara pedaços de 3 letras | Tolera erros de digitação (“presiso de advogdo”) |
| Significado (LSA, SVD com 64 dimensões, calculada **no Python** e só multiplicada no navegador) | Aprende que “remédio” anda junto de “farmácia” e “marido me bateu” de “violência” a partir dos textos | Pega o que não tem palavra em comum |
| Intenção (regressão logística treinada pela equipe, `web/ia.js`) | Estima a necessidade (emprego, saúde, violência…) | Sinal de escopo e desempate |
| **Segurança** (`web/perigo.js`) | Regras revisáveis que detectam risco (violência, suicídio, criança em perigo, emergência de saúde) e **fixam** o telefone e os serviços de proteção no topo | Em perigo, a resposta não pode depender de nota de similaridade |

Quando não acha nada, o sistema **diz que não achou** e mostra as áreas e os telefones de emergência: nunca fica mudo.

## Como foi medido

- **210 perguntas escritas à parte**, no jeito de falar de quem usa (com erros, gírias, frases longas), cada uma com *gabarito* (área, seção ou serviço correto, se há perigo, se está fora do escopo).
- **Dois conjuntos**: *desenvolvimento* (usado para ajustar) e *teste* (guardado, não olhado enquanto se ajustava). 33 perguntas parecidas com frases de treino do classificador foram marcadas e **excluídas** da medição.
- **Métricas**: *Área@3* e *Específica@3* (o destino certo está entre os 3 primeiros?), *MRR* (quão no topo), *Resposta* (respondeu quando devia), *Perigo* (detectou), *Falsos alarmes*, *Abstenção* (calou-se corretamente no que está fora do escopo).
- **Linha de base (v1)**: o assistente que existia antes (classificador + regras), medido igual.

## Resultado no conjunto de teste (98 perguntas)

| Sistema | Área@3 | Específica@3 | MRR | Resposta | Perigo | Falsos alarmes | Abstenção |
|---|---|---|---|---|---|---|---|
| v1 (assistente anterior) | 64% (53/83) | 39% (33/85) | 0.24 | 81% (69/85) | 100% (12/12) | 1% (1/73) | 85% (11/13) |
| v2 completo | 89% (74/83) | 87% (74/85) | 0.78 | 95% (81/85) | 100% (12/12) | 0% (0/73) | 69% (9/13) |
| sem palavras | 83% (69/83) | 82% (70/85) | 0.74 | 88% (75/85) | 100% (12/12) | 0% (0/73) | 77% (10/13) |
| sem letras (digitação) | 81% (67/83) | 80% (68/85) | 0.71 | 87% (74/85) | 100% (12/12) | 0% (0/73) | 85% (11/13) |
| sem significado (LSA) | 72% (60/83) | 71% (60/85) | 0.66 | 75% (64/85) | 100% (12/12) | 0% (0/73) | 100% (13/13) |
| sem classificador | 89% (74/83) | 87% (74/85) | 0.78 | 95% (81/85) | 100% (12/12) | 0% (0/73) | 69% (9/13) |
| sem contexto de área | 89% (74/83) | 87% (74/85) | 0.78 | 95% (81/85) | 100% (12/12) | 0% (0/73) | 69% (9/13) |

**Leitura honesta:**

- O orientador acerta o destino específico em **87%** das perguntas (contra 39% do assistente anterior) e coloca o certo, em média, perto do topo (MRR 0,78 contra 0,24).
- A **ablação** mostra que cada sinal pesa: sem o *significado* (LSA) cai de 87% para 71%; sem as *letras*, para 80%; sem as *palavras*, para 82%.
- **O classificador de intenção e o contexto de área não mudam a métrica nesta avaliação.** O contexto de área só vale dentro da caixa de dúvida (a avaliação não o usa); o classificador entra no sinal de escopo. Não vamos afirmar que eles melhoram a ordenação, porque a medição não mostra isso.
- **Abstenção é o ponto fraco**: a v1 se cala melhor no que está fora do escopo (85% contra 69%). O orientador acerta mais, mas por isso também arrisca mais responder o que não devia. Como errar por responder custa uma lista a mais, e errar por calar deixa a mulher sem caminho, aceitamos essa troca; o texto da tela deixa claro que a sugestão pode estar errada.
- **Segurança**: 12/12 no teste e **0 falsos alarmes** em todas as 210 perguntas. **Mas atenção ao que aconteceu**: na primeira vez que rodamos o conjunto de teste, a camada de segurança acertou **10 de 12 (83%)**; ela não reconhecia violência contra uma vizinha (“meu vizinho bate na mulher dele”) nem “meu marido … bate nas crianças”. Corrigimos as regras de forma geral e adicionamos testes. Por isso, **o 12/12 não é mais uma estimativa independente**; a estimativa independente é 83%. Para uma ferramenta que atende mulheres em risco, a conclusão é que as regras de segurança precisam de revisão contínua com profissionais da rede (CRAM, DDM, CAPS).

## Resultado no conjunto de desenvolvimento (79 perguntas)

| Sistema | Área@3 | Específica@3 | MRR | Resposta | Perigo | Falsos alarmes | Abstenção |
|---|---|---|---|---|---|---|---|
| v1 (assistente anterior) | 75% (52/69) | 41% (28/69) | 0.28 | 86% (60/70) | 43% (6/14) | 0% (0/56) | 89% (8/9) |
| v2 completo | 96% (66/69) | 93% (64/69) | 0.82 | 99% (69/70) | 100% (14/14) | 0% (0/56) | 78% (7/9) |

## Limites

- As perguntas foram escritas pela equipe, não por usuárias reais. A medição prova que o sistema funciona nos casos que imaginamos, **não** que cobre tudo o que será digitado. O teste com usuárias reais (roteiro em `docs/roteiro_validacao_navegacao.md`) continua sendo necessário.
- Algumas perguntas ainda falham (“quero me inscrever pra casa própria”, “moro na rua e preciso de ajuda”, “vacina do meu filho está atrasada”), e o orientador não sabe nada que não esteja no catálogo (por exemplo, dentista gratuito ou fonoaudiólogo, que não constam como serviços verificados).
- O sinal de escopo (decidir que algo está fora do assunto) é simples (nota da busca + confiança do classificador) e erra em frases curtas fora do escopo que usam palavras do site (“como fazer um site”).
- Não há previsão de risco nem pontuação de pessoas: o sistema só **orienta para serviços** a partir do que a pessoa escreve, sem guardar nada.
- Não há elegibilidade automática: nunca dizemos que alguém tem direito a vaga ou benefício.

## Próximos passos

1. Teste do orientador com usuárias reais e profissionais da rede; ampliar o conjunto de perguntas com o que elas escreverem (só com consentimento).
2. Ampliar o vocabulário dos serviços que ainda não casam (dentista, fonoaudiologia, vacina).
3. Fase com **API de LLM** (Claude): usar só em *tarefas de bastidor* (ex.: gerar variações de perguntas para avaliar, revisar resumos dos serviços), com a chave fora do navegador. O guia está em `docs/arquitetura_ia.md`; o script `pipeline/testar_api.py` verifica se a chave funciona.
