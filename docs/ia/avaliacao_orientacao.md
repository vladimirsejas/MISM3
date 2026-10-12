# Avaliação do orientador (busca + segurança) do Mulher Resolve

Este documento mostra **como o orientador foi medido**, o que deu certo e **o que não deu**. Os números vêm de `avaliacao/` e podem ser repetidos por qualquer pessoa:

```
python avaliacao/avaliar.py v2 --conjunto teste          # v1 = assistente anterior; v2 = orientador atual
python avaliacao/avaliar.py v2 --conjunto desenvolvimento --erros
```

> **Atualização de 13/10/2026 (madrugada):** a seção "Segunda rodada de avaliação" no fim deste documento traz três conjuntos novos de perguntas, o achado de que as regras de segurança sozinhas generalizavam mal (34% em frases novas), o detector de perigo aprendido que foi criado a partir disso e as medições mais recentes. As seções anteriores continuam valendo como histórico.

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
| v1 (assistente anterior) | 66% (55/83) | 40% (34/85) | 0.24 | 82% (70/85) | 100% (12/12) | 1% (1/73) | 85% (11/13) |
| v2 completo | 90% (75/83) | 91% (77/85) | 0.82 | 95% (81/85) | 100% (12/12) | 0% (0/73) | 69% (9/13) |
| sem palavras | 84% (70/83) | 86% (73/85) | 0.77 | 88% (75/85) | 100% (12/12) | 0% (0/73) | 77% (10/13) |
| sem letras (digitação) | 83% (69/83) | 85% (72/85) | 0.76 | 87% (74/85) | 100% (12/12) | 0% (0/73) | 85% (11/13) |
| sem significado (LSA) | 75% (62/83) | 75% (64/85) | 0.69 | 78% (66/85) | 100% (12/12) | 0% (0/73) | 100% (13/13) |
| sem classificador | 90% (75/83) | 89% (76/85) | 0.80 | 95% (81/85) | 100% (12/12) | 0% (0/73) | 69% (9/13) |
| sem contexto de área | 90% (75/83) | 91% (77/85) | 0.82 | 95% (81/85) | 100% (12/12) | 0% (0/73) | 69% (9/13) |

> **Atenção: este conjunto de teste deixou de ser independente.** A primeira rodada (antes de qualquer ajuste) deu **87%** de resposta específica e **83%** (10/12) na segurança. Depois dela, as regras de segurança foram corrigidas e o vocabulário de alguns serviços foi ampliado (creche, CMEI, vacina, situação de rua e outros) olhando também para falhas observadas nessas perguntas; é isso que leva o número a 91%. O 91% mostra o efeito desses ajustes e **não é uma estimativa de acerto com perguntas novas**: a estimativa independente é a da primeira rodada.

**Leitura honesta:**

- O orientador acerta o destino específico em **91%** das perguntas do teste depois dos ajustes (87% na primeira rodada, antes deles; o assistente anterior: 40%) e coloca o certo perto do topo (MRR 0,82 contra 0,24).
- A **ablação** mostra que cada sinal pesa: sem o *significado* (LSA) cai de 91% para 75%; sem as *letras*, para 85%; sem as *palavras*, para 86%.
- **O classificador de intenção ajuda pouco** (sem ele, 91% cai para 89%) e **o contexto de área não aparece na métrica**, porque a avaliação não o usa (ele só vale na caixa de dúvida dentro de uma área). Não afirmamos mais do que a medição mostra.
- **Abstenção é o ponto fraco**: a v1 se cala melhor no que está fora do escopo (85% contra 69%). O orientador acerta mais, mas por isso também arrisca mais responder o que não devia. Como errar por responder custa uma lista a mais, e errar por calar deixa a mulher sem caminho, aceitamos essa troca; o texto da tela deixa claro que a sugestão pode estar errada.
- **Segurança**: 12/12 no teste e **0 falsos alarmes** em todas as 210 perguntas. **Mas atenção ao que aconteceu**: na primeira vez que rodamos o conjunto de teste, a camada de segurança acertou **10 de 12 (83%)**; ela não reconhecia violência contra uma vizinha (“meu vizinho bate na mulher dele”) nem “meu marido … bate nas crianças”. Corrigimos as regras de forma geral e adicionamos testes. Por isso, **o 12/12 não é mais uma estimativa independente**; a estimativa independente é 83%. Para uma ferramenta que atende mulheres em risco, a conclusão é que as regras de segurança precisam de revisão contínua com profissionais da rede (CRAM, DDM, CAPS).

## Resultado no conjunto de desenvolvimento (79 perguntas)

| Sistema | Área@3 | Específica@3 | MRR | Resposta | Perigo | Falsos alarmes | Abstenção |
|---|---|---|---|---|---|---|---|
| v1 (assistente anterior) | 75% (52/69) | 39% (27/69) | 0.28 | 86% (60/70) | 43% (6/14) | 0% (0/56) | 89% (8/9) |
| v2 completo | 97% (67/69) | 90% (62/69) | 0.82 | 100% (70/70) | 100% (14/14) | 0% (0/56) | 78% (7/9) |

## Limites

- As perguntas foram escritas pela equipe, não por usuárias reais. A medição prova que o sistema funciona nos casos que imaginamos, **não** que cobre tudo o que será digitado. O teste com usuárias reais (roteiro em `docs/roteiro_validacao_navegacao.md`) continua sendo necessário.
- Na avaliação original, falharam perguntas sobre casa própria, situação de rua e vacinação infantil. Em 12/10/2026, foram acrescentadas pontes lexicais locais para esses três padrões e testes de regressão em `web/tests/orientar.test.js`; a suíte passou no GitHub Actions. As métricas da tabela acima são da avaliação anterior e **não foram recalculadas** após essa mudança. O orientador continua limitado ao catálogo: não encontra um serviço que não esteja cadastrado e verificado (por exemplo, dentista gratuito ou fonoaudiólogo, que ainda não constam como serviços verificados).
- O sinal de escopo (decidir que algo está fora do assunto) é simples (nota da busca + confiança do classificador) e erra em frases curtas fora do escopo que usam palavras do site (“como fazer um site”).
- Não há previsão de risco nem pontuação de pessoas: o sistema só **orienta para serviços** a partir do que a pessoa escreve, sem guardar nada.
- Não há elegibilidade automática: nunca dizemos que alguém tem direito a vaga ou benefício.

## Próximos passos

1. Teste do orientador com usuárias reais e profissionais da rede; ampliar o conjunto de perguntas com o que elas escreverem (só com consentimento).
2. Ampliar o vocabulário dos serviços que ainda não casam (dentista, fonoaudiologia, vacina).
3. Fase com **API de LLM** (Claude): usar só em *tarefas de bastidor* (ex.: gerar variações de perguntas para avaliar, revisar resumos dos serviços), com a chave fora do navegador. O guia está em `docs/arquitetura_ia.md`; o script `pipeline/testar_api.py` verifica se a chave funciona.

## Nota de 13/10/2026: CRAM retirado

O CRAM foi retirado do catálogo por falta de fonte confiável (ver o registro de decisões). Perguntas do gabarito que pedem o CRAM (por exemplo, "onde fica o cram") deixaram de ter resposta específica possível, e a resposta específica no desenvolvimento passou de 93% para 90%. O gabarito foi mantido como estava, de propósito.


## Segunda rodada de avaliação (13/10/2026)

### O que foi feito e por quê

Os resultados anteriores tinham uma fraqueza que apareceu quando escrevi perguntas **novas**: o conjunto de teste já tinha sido usado para corrigir regras, então ele não media mais nada de forma independente. Foram escritos três conjuntos novos, em ordem, cada um **antes** de olhar como o sistema respondia:

| Conjunto | Perguntas | Para que serve |
|---|---|---|
| `independente` | 104 | primeira medição com frases novas; depois dela, as falhas foram usadas para corrigir (virou conjunto de ajuste) |
| `reserva` | 37 | medir se as correções generalizam |
| `final` | 76 | medição depois de todos os ajustes; também usado para corrigir 4 falhas de segurança (ver abaixo) |

Os ids são únicos entre conjuntos (um erro de numeração meu, que misturava respostas de dois conjuntos, foi achado e corrigido; hoje um teste automático impede isso). O gabarito vem do catálogo e do bom senso, nunca das respostas do sistema.

### O achado mais importante: lista de palavras não generaliza

- **Primeira rodada no conjunto `independente`:** segurança **52% (14/27)**; o assistente antigo (v1) acertou 56%. Ou seja, ficamos atrás dele na segurança.
- Depois de corrigir as regras com essas frases, o conjunto `independente` passou a 27/27, **mas isso só mostrava que as frases conhecidas foram consertadas.**
- **Conjunto `reserva` (frases novas depois das correções):** as regras sozinhas acertaram **10 de 29 (34%)** e tiveram 4 falsos alarmes em 8 frases difíceis.
- Conclusão: as regras (`web/perigo.js`) são úteis (alta precisão, revisáveis), mas dependem de a frase ter sido prevista por quem escreveu a lista.

### O que foi criado: o detector de perigo aprendido

- `catalogo/frases_perigo.txt` (frases de perigo e de negativos difíceis, escritas pela equipe; **nenhuma é pergunta de avaliação**, e um teste confere isso) e `pipeline/treinar_perigo.py` treinam um modelo de regressão logística sobre letras e palavras, um por tipo (violência, suicídio, criança, saúde). Os limiares são escolhidos por validação cruzada: um limiar de **aviso** (até ~2% de falsos alarmes) e um de **alerta** (alta confiança).
- `web/perigo.js` usa **regras e detector juntos**: se uma regra dispara, ou o detector está muito confiante, o alerta é completo (nível 2: telefones e serviços de proteção fixados). Se só o detector está moderadamente confiante, mostra um **aviso discreto** (nível 1: os telefones certos do tipo, sem alterar a lista de resultados).
- **Âncora de segurança contra falsos alarmes:** um alerta que vem só do detector precisa de pelo menos uma palavra do campo do assunto. Sem isso, o modelo pequeno dava 0,97 de "suicídio" para "vou tirar férias" (confundia com "tirar a vida"). Com a âncora e mais negativos, isso deixou de acontecer, e há testes para esses casos.

### O detector de escopo (abstenção)

- `catalogo/frases_fora_do_escopo.txt` e `pipeline/treinar_escopo.py` treinam um modelo que separa "é sobre o que o site cobre" de "é outro assunto" (as frases do assunto vêm das frases de necessidades, de perigo e de perguntas geradas com os nomes dos serviços). Em validação cruzada ele reconhece 70% das frases fora do assunto perdendo 1,5% das do assunto.
- `web/orientar.js` só trata a pergunta como fora do assunto quando o detector concorda **e** a busca não achou correspondência forte (nota abaixo de 0,50). Assim uma frase com a palavra "creche" nunca é recusada só porque o detector duvida. Testes: `web/tests/orientar.test.js` e `pipeline/tests/test_modelo_escopo.py` (inclui a conferência de que o corpus não contém perguntas de avaliação).

### Resultados atuais (versão após todos os ajustes)

| Conjunto | Sistema | Área@3 | Específica@3 | MRR | Resposta | Perigo detectado | Falsos alarmes | Abstenção |
|---|---|---|---|---|---|---|---|---|
| desenvolvimento | v1 | 75% (51/68) | 38% (26/68) | 0.27 | 86% (59/69) | 43% (6/14) | 0% (0/55) | 89% (8/9) |
| desenvolvimento | v2 | 96% (65/68) | 87% (59/68) | 0.80 | 99% (68/69) | 100% (14/14) | 2% (1/55) | 89% (8/9) |
| teste | v1 | 66% (55/83) | 40% (34/85) | 0.24 | 82% (70/85) | 100% (12/12) | 1% (1/73) | 85% (11/13) |
| teste | v2 | 92% (76/83) | 92% (78/85) | 0.81 | 95% (81/85) | 100% (12/12) | 1% (1/73) | 77% (10/13) |
| independente | v1 | 64% (56/87) | 39% (31/79) | 0.22 | 82% (71/87) | 56% (15/27) | 2% (1/60) | 60% (9/15) |
| independente | v2 | 98% (85/87) | 95% (75/79) | 0.89 | 98% (85/87) | 100% (27/27) | 3% (2/60) | 73% (11/15) |
| reserva | v1 | 54% (19/35) | 49% (17/35) | 0.23 | 71% (25/35) | 52% (15/29) | 0% (0/6) | 0% (0/2) |
| reserva | v2 | 83% (29/35) | 77% (27/35) | 0.79 | 94% (33/35) | 97% (28/29) | 0% (0/6) | 0% (0/2) |
| final | v1 | 54% (34/63) | 31% (19/61) | 0.18 | 71% (45/63) | 33% (10/30) | 0% (0/33) | 83% (10/12) |
| final | v2 | 87% (55/63) | 82% (50/61) | 0.75 | 92% (58/63) | 97% (29/30) | 0% (0/33) | 67% (8/12) |

Leitura honesta, na ordem do que pesa:

1. **Perigo detectado:** no conjunto `final`, **primeira execução, antes de qualquer correção: 86% (25/29)**, contra **31%** do assistente antigo nas mesmas frases. Escaparam: "dormi no carro porque tenho medo de entrar em casa", "tentou me estrangular ontem", "já escrevi minha despedida" e "acho que meus filhos ficariam melhor sem a mãe". Elas foram corrigidas depois (regras e exemplos de treino de padrões gerais, não só dessas frases), o que levou o número a 29/30; **por isso o 97% do `final` já não é independente.** A estimativa independente é 86%.
2. **O conjunto `reserva` ficou em 93% (27/29)**, com 0 falsos alarmes, mas é preciso lembrar que as frases dele foram vistas antes de o detector ser treinado (os exemplos de treino não as copiam, e um teste automático confere isso).
3. **Critério para valer:** ainda há situações que escapam. Segurança em tempo real precisa de revisão contínua com profissionais da rede (CRAM, DDM, CAPS) e de frases reais, com consentimento. Os números acima são de frases escritas pela equipe, não de mulheres reais.
4. **Falsos alarmes:** o aviso discreto aparece em algumas frases ambíguas (como dor de dente forte). Isso foi uma escolha: errar para mais custa uma frase na tela. Em 313 frases sem perigo (todos os conjuntos), o alerta completo disparou em 1 ("meu pai idoso caiu e tá com muita dor", que provavelmente merece mesmo atenção) e o aviso discreto em 3. Um segundo alerta ("o time da minha filha apanhou do adversário no vôlei") era erro e foi corrigido.
5. **Resposta específica:** de 84% (`final`, 1ª rodada nesse conjunto) a 95% (`independente`, depois dos ajustes). O número independente de verdade é o do `final` na primeira execução (80%) e o do `teste` na primeira rodada (87%), contra 31% a 40% do assistente antigo.
6. **Abstenção:** antes do detector de escopo era o ponto mais fraco (38% no `final`, 47% no `independente`, contra 83% do assistente antigo no `final`). Com o detector de escopo (abaixo) subiu para **67%** no `final`, 73% no `independente` e 77% no `teste`; o assistente antigo ainda se cala mais no `final` (83%), porque quase nunca responde nada. **Atenção:** o parâmetro "correspondência forte" (0,50) foi escolhido olhando para todos esses conjuntos, então esses números de abstenção já não são independentes. Frases curtas e ambíguas ("tem pizza?") continuam sendo o caso difícil.
7. **Vocabulário:** foram acrescentadas sinônimos a 7 serviços (posto, dentista pelo SUS, sem grana pra comer etc.). Uma ablação mostrou efeito de ±1 pergunta por adição (ruído), então **não vale tirar conclusões** sobre cada uma; mais ajustes de vocabulário seriam ajuste ao teste.
8. A mudança do CRAM (retirado do catálogo) continua afetando um pequeno número de perguntas cujo gabarito é o CRAM; o gabarito foi mantido de propósito.

### Como reproduzir

```
python pipeline/treinar_perigo.py                      # treina o detector (mostra limiares e revocação por validação cruzada)
python avaliacao/avaliar.py v2 --conjunto final        # e: desenvolvimento, teste, independente, reserva
python pipeline/indice_orientacao.py                   # regera o índice do orientador
```

### O que ainda falta

- Frases reais de mulheres, com consentimento, para treinar e medir o detector (as de hoje são da equipe).
- Mais negativos e frases fora do escopo para melhorar a abstenção.
- Revisão das regras e do detector com CRAM, DDM e CAPS; decidir os textos dos avisos.
- Tamanho: o índice (540 KB) e os modelos de perigo (520 KB), escopo (310 KB) e necessidades (600 KB) somam cerca de 2 MB sem compressão e só são baixados quando a usuária começa a escrever; em conexões lentas isso demora alguns segundos na primeira vez.
