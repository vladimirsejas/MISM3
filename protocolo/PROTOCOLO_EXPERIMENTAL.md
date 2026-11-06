# Protocolo experimental — avaliação do orientador do MISM3

**Versão:** 1.0 — pré-execução  
**Data:** 05/11/2026  
**Estado:** proposta; conjunto novo, congelamento e execução ainda não realizados.

## 1. Perguntas de pesquisa

- **QP1 — Recuperação:** o sistema completo recupera a área e o destino específico esperado entre os três primeiros resultados melhor que linhas de base simples?
- **QP2 — Componentes:** qual a contribuição incremental das regras lexicais, n-gramas de caracteres, LSA, classificador de necessidades e detectores aprendidos de perigo e escopo?
- **QP3 — Segurança:** qual a revocação do detector de perigo e a taxa de falso alarme em mensagens negativas?
- **QP4 — Abstenção:** o sistema reconhece mensagens fora do escopo ou insuficientemente determinadas sem se abster indevidamente de mensagens orientáveis?
- **QP5 — Erros:** quais áreas e categorias concentram erros de recuperação, segurança e abstenção?

## 2. Hipóteses

H1: o sistema completo terá Resposta@3 específica superior à melhor linha de base lexical simples.  
H2: n-gramas de caracteres contribuirão para mensagens com variação ortográfica; LSA poderá contribuir quando não houver coincidência lexical direta.  
H3: o detector de perigo aprendido, combinado às regras, elevará a revocação em relação à condição apenas regras sem taxa inaceitável de falso alarme.  
H4: o detector de escopo elevará a abstenção correta sem elevar excessivamente a abstenção indevida.  
H5: componentes removidos poderão não reduzir o desempenho; resultados nulos ou desfavoráveis serão reportados sem reformular hipóteses.

## 3. Sistema e condições experimentais

O MISM3 é um orientador local executado no navegador, que associa mensagens a áreas, seções e serviços cadastrados. A arquitetura documentada combina busca textual por palavras, n-gramas de caracteres, representação semântica LSA calculada previamente, sugestão de classificador de necessidades, regras lexicais e componentes de segurança e escopo. Não é um modelo de linguagem generativa, não realiza diagnóstico e não determina elegibilidade a benefícios.

A versão avaliada será identificada por commit imutável. Diferenças entre a arquitetura documentada e o código congelado serão registradas antes da execução. Componentes cuja desativação isolada não possa ser confirmada serão marcados como **não verificados**, não simulados.

Condições, aplicadas às mesmas mensagens, catálogo e gabarito:

1. **Completo:** configuração congelada com todos os componentes disponíveis ativos.
2. **Sem regras lexicais:** desativar regras e pontes lexicais de orientação, mantendo os demais sinais.
3. **Sem n-gramas de caracteres:** retirar similaridade por caracteres.
4. **Sem LSA:** retirar o sinal semântico LSA.
5. **Sem classificador de necessidades:** retirar a sugestão da regressão logística de necessidades.
6. **Sem detector de perigo aprendido:** manter regras de segurança e desligar somente o modelo aprendido.
7. **Sem detector de escopo:** retirar o componente aprendido de fora do escopo.
8. **Apenas regras:** somente regras lexicais e de segurança explicitamente documentadas, sem busca estatística, LSA ou classificadores aprendidos.
9. **Apenas modelo:** somente componentes aprendidos selecionados, sem pontes lexicais manuais. A composição exata será registrada antes do congelamento.
10. **Busca simples:** BM25 ou TF-IDF simples, sem regras manuais, LSA, classificador de necessidades ou detectores de segurança. Escolher BM25 apenas se houver implementação versionada disponível; caso contrário, usar TF-IDF simples. A escolha e os parâmetros serão fixados antes de observar resultados.

Uma ablação só será considerada válida se a desativação de um componente não alterar inadvertidamente os demais.

## 4. Conjunto novo

### 4.1 Composição final proposta

O conjunto recebido contém **190 mensagens fictícias**, todas escritas pelo autor:

| Classe de perigo | Quantidade |
|---|---:|
| Perigo — violência | 55 |
| Perigo — sofrimento psicológico e ideação suicida | 20 |
| Perigo — violência contra criança | 15 |
| **Total de mensagens com perigo** | **90** |
| **Mensagens sem perigo** | **100** |
| **Total geral** | **190** |

A categoria de violência reúne situações de violência e ameaça, incluindo casos de risco imediato. O detector mantém quatro tipos operacionais: violência contra a mulher, risco imediato, violência contra criança e sofrimento psicológico grave/ideação suicida. Os 55 registros de violência não foram subdivididos em contagens adicionais neste quadro; não inferir quantitativos por subtipo sem apuração específica.

### 4.2 Autoria, campos e gabarito

As 190 frases foram escritas pelo autor. O gabarito foi proposto com apoio de inteligência artificial e revisado integralmente pelo autor, que permanece responsável pelas decisões finais e pela conferência de cada registro.

O arquivo registra identificador e frase, área, códigos associados, classificação de perigo, ação do site e destinos esperados por identificadores oficiais do catálogo. Para a avaliação, os campos centrais são área esperada, destinos esperados (identificadores oficiais), perigo (sim/não e tipo conforme os quatro tipos do detector) e ação esperada do site.

Foram retirados do formulário de anotação os campos **prioridade de segurança**, **justificativa** e **anotador**. Não serão reintroduzidos como campos do conjunto.

A anotação foi realizada em **uma única passada** pelo autor. Não houve segunda passada, intervalo de sete dias ou cálculo de kappa intra-anotador. A ausência de uma medida de estabilidade intra-anotador e de concordância interanotadores será declarada como limitação metodológica. A revisão integral do gabarito pelo autor não equivale a validação independente por outro anotador.

### 4.3 Relatório de similaridade e sobreposição

A comparação de similaridade de letras reportada para o conjunto encontrou:
- **0 pares idênticos**;
- **4 pares** com similaridade de letras igual ou superior a 0,80 e inferior a 0,90: **C-123, C-041, C-088 e D-030**;
- **nenhum par** com similaridade igual ou superior a 0,90.

Os quatro pares foram mantidos no conjunto. A análise de sensibilidade deverá apresentar os resultados principais em duas condições: com os 190 registros e sem os quatro registros envolvidos nos pares sinalizados. A análise sem esses registros é complementar e não substitui o resultado principal com o conjunto integral.

### 4.4 Integridade e estado do congelamento

O arquivo proposto para inclusão é `protocolo/conjunto_congelado_v1.json`. O SHA-256 esperado dos bytes do arquivo é:

`abbae38d3cc39a8428130c09ac59d65c96cff497112481a9eadcf3ac9227ae00`

O manifesto de hash será versionado junto ao arquivo. **A inclusão em uma branch ou em uma pull request não significa que o conjunto esteja congelado.** O conjunto somente poderá ser declarado congelado após a aprovação e mesclagem da pull request, com conferência do hash no arquivo integrado à branch principal. Até esse momento, seu estado é proposta de inclusão/congelamento.

## 5. Métricas

### 5.1 Recuperação

- **Resposta@3 de área:** proporção de mensagens orientáveis em que ao menos uma área esperada aparece entre os três primeiros resultados.
- **Resposta@3 específica:** proporção de mensagens orientáveis em que o serviço/destino esperado aparece entre os três primeiros.
- **MRR:** média do inverso da posição do primeiro destino esperado; zero se nenhum aparecer.
- **Precision@3:** proporção dos três resultados que pertencem ao conjunto aceito pelo gabarito. Se forem exibidos menos de três, a convenção do denominador será definida antes da execução.
- **Recall@3:** proporção dos destinos aceitos recuperados entre os três primeiros.
- **Macro-F1:** média não ponderada do F1 por classe de área.
- **Acurácia balanceada:** média das revocações por classe.
- **Matriz de confusão:** por área, com abstenção separada e regra explícita para rótulos múltiplos.

### 5.2 Segurança e abstenção

- **Revocação de perigo:** VP/(VP+FN), global e por subtipo.
- **Especificidade de perigo:** VN/(VN+FP).
- **Taxa de falso alarme:** FP/total de mensagens negativas para perigo.
- **Abstenção correta:** proporção das mensagens cujo gabarito exige abstenção em que o sistema se abstém.
- **Abstenção indevida:** proporção das mensagens orientáveis em que o sistema se abstém.

Aviso discreto e alerta completo serão registrados separadamente. Mensagens ambíguas não serão usadas como negativos inequívocos no cálculo principal de especificidade. Todos os denominadores serão publicados.

### 5.3 Incerteza

Proporções terão intervalos de Wilson de 95%. MRR, diferenças pareadas e métricas agregadas não binárias terão bootstrap pareado por mensagem, 10.000 replicações, semente registrada e intervalo percentil de 95%. As condições serão comparadas nos mesmos registros; suas saídas não serão tratadas como amostras independentes. Subgrupos pequenos serão descritos como exploratórios. Não haverá alegação de significância sem procedimento pré-especificado.

## 6. Critérios de sucesso e fracasso

O desfecho principal é Resposta@3 específica entre mensagens orientáveis.

O sistema híbrido será considerado superior à melhor linha de base lexical somente se, simultaneamente:
1. a diferença absoluta de Resposta@3 específica for de pelo menos **5 pontos percentuais** a favor do sistema completo;
2. o limite inferior do intervalo bootstrap pareado de 95% da diferença for maior que zero;
3. a revocação global de perigo for de pelo menos **90%**, sem piora superior a 5 pontos percentuais em relação à melhor condição de segurança;
4. a taxa de falso alarme não ultrapassar **5%**;
5. a abstenção indevida não ultrapassar **15%**.

Se o intervalo da diferença incluir zero, a superioridade será considerada inconclusiva, mesmo que a estimativa pontual favoreça o híbrido. Revocação abaixo de 90% será reportada como insuficiência de segurança. O cumprimento dos critérios não demonstra segurança clínica nem eficácia no mundo real.

**Texto pré-definido para o artigo se o híbrido não superar a linha de base:**

> “No conjunto sintético e congelado deste estudo, o sistema híbrido não demonstrou superioridade pré-especificada sobre a linha de base lexical simples em Resposta@3 específica. As diferenças observadas foram tratadas como evidência insuficiente de ganho incremental dos componentes combinados, e não como confirmação de superioridade. Os resultados delimitam o desempenho nos cenários fictícios avaliados e não demonstram eficácia com usuárias reais.”

Se a revocação de perigo ficar abaixo do limiar, acrescentar:

> “A revocação de perigo observada não atingiu o limiar definido previamente. Portanto, o sistema não deve ser apresentado como mecanismo confiável de triagem ou proteção; sua função permanece limitada à orientação experimental e requer revisão especializada.”

## 7. Congelamento e execução

Antes da primeira execução, registrar em manifesto:

- SHA-256 dos bytes exatos do arquivo do conjunto e do gabarito;
- commit imutável do repositório;
- versões de Python, Node.js, sistema operacional e arquitetura;
- versões de todas as bibliotecas;
- comandos exatos de cada condição;
- parâmetros, sementes, limiares e configuração de cada ablação;
- versões do catálogo, índice e modelos;
- data/hora e responsável pelo congelamento.

A execução principal será **única** após congelamento. Não será permitido ajustar regra, limiar, vocabulário, catálogo, modelo, parâmetro ou gabarito com base nos resultados. Falha técnica poderá justificar repetição somente se logs demonstrarem que nenhuma saída parcial foi inspecionada para orientar mudanças; incidente e justificativa serão publicados. Mudança metodológica posterior exige novo conjunto e protocolo versionado.

Logs integrais e saídas brutas serão preservados. Resultados ausentes não serão substituídos por estimativas ou resultados históricos.

## 8. Plano de análise de erros

1. Congelar categorias de erro antes de abrir resultados por condição.
2. Classificar falhas em: área incorreta; seção incorreta; serviço esperado ausente do top-3; serviço proibido; falso alerta; perigo não detectado; alerta incompleto; abstenção indevida; resposta indevida; empate/ordenação; erro de gabarito.
3. Registrar identificador, categoria, condição, saída, gabarito e justificativa, sem reescrever a mensagem.
4. Comparar erros pareados do sistema completo e das linhas de base; separar erros compartilhados daqueles introduzidos ou corrigidos por cada componente.
5. Divergências de gabarito serão revisadas sem consultar a saída sempre que possível. Correções posteriores serão registradas como análise de sensibilidade, nunca substituindo silenciosamente o resultado principal.
6. Não usar a análise de erros como ciclo de ajuste do sistema no mesmo conjunto.

## 9. Limitações

As mensagens serão fictícias e escritas exclusivamente pelo autor; não representam a diversidade linguística, social, regional ou emocional de mulheres reais. O cenário corresponde a um município, Rio Claro (SP), e depende do catálogo local congelado. A autoria e anotação por uma única pessoa podem introduzir viés no corpus e no gabarito. Não haverá segunda anotadora nem coautora adicional nesta etapa. O professor com doutorado que já acompanha o trabalho aceitou orientar e participar da publicação caso o estudo esteja metodologicamente completo. Sua eventual coautoria dependerá de contribuição intelectual efetiva, incluindo revisão do desenho e do texto e aprovação da versão final; orientação ou assinatura não serão presumidas como anotação independente. A anotação em uma única passada não permite estimar estabilidade intra-anotador. Também não haverá concordância interanotadores; ambas as ausências constituem limitações metodológicas, e a limitação de anotador único permanece. As quotas de segurança não garantem precisão adequada por subtipo. O estudo mede recuperação e comportamento de segurança em mensagens artificiais; não mede redução de violência, acesso efetivo, qualidade do atendimento, diagnóstico, elegibilidade ou desfechos sociais. A atualidade e a cobertura do catálogo limitam os destinos recuperáveis. Não haverá validação multicêntrica ou prospectiva com participantes nesta etapa.

## 10. Pendências

- [x] Segunda anotadora e coautora adicional: não haverá nesta etapa; o conjunto será escrito exclusivamente pelo autor.
- [x] Professor com doutorado já acompanha o trabalho e aceitou orientar e participar da publicação se o estudo estiver metodologicamente completo; eventual coautoria dependerá de contribuição efetiva na revisão do desenho e do texto e aprovação da versão final.
- [ ] Verificar se cada ablação é implementável e isolável na versão congelada; não verificado sem execução/inspeção técnica.
- [ ] Escolher BM25 ou TF-IDF simples antes do congelamento.
- [x] Revista principal definida: PeerJ Computer Science; alternativa: PLOS ONE; terceira opção: revista brasileira ainda a selecionar. Taxas, políticas editoriais e condições de submissão permanecem **não verificadas** e deverão ser conferidas nas páginas oficiais antes da submissão.
- [x] Conjunto de 190 mensagens escrito pelo autor; gabarito proposto com apoio de IA e revisado integralmente pelo autor.
- [ ] Após mesclagem da pull request, confirmar o SHA-256 na branch principal e então declarar o conjunto congelado; registrar os demais itens do manifesto antes da execução.
- [ ] Confirmar enquadramento ético institucional antes de qualquer atividade com participantes ou dados identificáveis.
- [ ] Executar uma única vez e publicar resultados completos, inclusive resultados negativos.
