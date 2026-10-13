# Arquitetura de IA do Mulher em Rede

Escrito em 11/10/2026. Define o papel de cada tecnologia, o que está implementado e o que não está, sem chamar de IA o que é regra.

## Quatro capacidades, o que é cada uma e o estado real
| Capacidade | O que faz no projeto | Estado |
|---|---|---|
| **Aprendizado de máquina (classificação de texto)** | Lê o que a mulher escreve e sugere até 3 áreas do site. Modelo de regressão logística sobre n-gramas de caracteres e palavras (TF-IDF), treinado por `pipeline/treinar_necessidades.py`, que roda **no navegador** (`web/ia.js`, pesos em `web/dados/modelo_necessidades.json`). | **Implementado** (v1) |
| **Regras de palavras-chave** | `web/necessidades.js`. Entram junto com o modelo, para nunca perder um alerta de violência. **Não são IA.** | Implementado |
| **Sistema de recomendação (por conteúdo)** | Depois de reconhecer a necessidade, ranqueia os **serviços do catálogo verificado** pela semelhança (TF-IDF de n-gramas) entre o texto da mulher e o nome, tipo e observação de cada serviço, com condições de segurança (ex.: o CAPS de álcool e drogas só aparece se o texto falar disso). | **Implementado** (v1) |
| **Plano do Trabalho** | Árvore de decisão escrita à mão (**regras, não aprendizado**). | Regras |
| **Inteligência pública (Observatório)** | Indicadores agregados, lacunas e análise territorial para a Secretaria. | **Não implementado** (ver `docs/observatorio_e_dados_da_secretaria.md`) |

## Atualização de 12/10/2026: do classificador para um sistema de orientação
Depois de comparar três pareceres de IA (DeepSeek, Gemini e outro), ficou decidido: **não** colocar modelo de linguagem nem modelo pesado no navegador (os celulares do público não aguentam, e relatos sensíveis não podem sair do aparelho), **manter os dados verificados como a inteligência** e usar a IA como interface. Implementado nesta rodada:
| Camada | O que faz | Onde |
|---|---|---|
| Entender o texto | Modelo + regras; **álcool e drogas** agora têm caminho próprio (Saúde, direto na seção do CAPS AD e dos grupos) e o modelo foi retreinado com 24 frases novas | `web/ia.js`, `web/necessidades.js`, `catalogo/frases_necessidades.txt` |
| Meu Plano | Ordena as necessidades por urgência (regra fixa e explicável), com motivo e "se não der certo"; nada promete vaga | `web/plano.js` |
| Orientador (tela inicial e caixa de dúvida das áreas) | Busca híbrida por 161 destinos (serviços, seções, canais, ferramentas): palavras + letras + significado (LSA) + intenção, com explicação do porquê; se não acha, diz e mostra as áreas | `web/orientar.js`, `web/orientacao-ui.js`, `pipeline/indice_orientacao.py`, `web/dados/indice_orientacao.json` |
| Segurança | Regras revisáveis detectam violência, suicídio, criança em perigo e emergência de saúde e **fixam** telefones e serviços de proteção no topo; não dependem de nota | `web/perigo.js` |
| Lugar | CEP -> bairro provável (setor do IBGE) e bairro -> CEPs; serviço mais perto de cada tipo | `web/mapa-servicos.js`, `web/dados/setor_bairro.json` |
**Limites honestos:** (1) o bairro do IBGE é agrupado (cerca de 27 nomes para 408 setores; 83% dos CEPs recebem um) e pode diferir do nome da Prefeitura; (2) o orientador é uma busca com aprendizado de máquina leve (não um modelo de linguagem): acerta o destino específico em 87 a 91% das perguntas do teste (87% na primeira rodada; 91% depois de ajustes feitos olhando para ele), mas as perguntas foram escritas pela equipe (ver `docs/ia/avaliacao_orientacao.md`); (3) o modelo continua treinado só com frases escritas pela equipe; (4) **não há elegibilidade automática**: dizer que alguém tem direito a um benefício exige critério oficial confirmado e atualizado, que ainda não temos. Próximo passo técnico, só com evidência de teste com usuárias: embeddings leves quantizados (ONNX), medindo tamanho, memória e precisão em celulares simples.

## Como o modelo foi avaliado (resumo; detalhes em `docs/ia/avaliacao_modelo_necessidades.md`)
Validação cruzada em 5 partes sobre as frases escritas pela equipe, e teste independente com as 53 frases dos testes antigos.
- Só regras: F1 65%. Só o modelo: F1 68%. **Regras + modelo (o que o site usa): F1 75%.**
- Em **violência**, as regras sozinhas pegam 24% dos casos, o modelo 81% e os dois juntos 86%. Foi o ganho mais importante.
- **Limites:** frases escritas pela equipe, não por mulheres reais; conjunto pequeno; limiar escolhido olhando a própria validação (número otimista); nas 53 frases antigas as regras vão melhor, porque foram escritas para elas.

## Como a recomendação de serviços escolhe (e o que ela se recusa a fazer)
- Cada necessidade só pode recomendar tipos de serviço que existem no catálogo. **Moradia e dívidas não têm serviços cadastrados**, então só mostram o caminho da área, sem inventar.
- Só entra o catálogo verificado à mão (ids `man-`), nunca os cartões crus do CNES.
- No máximo 2 serviços por necessidade; só com telefone ou fonte; mostra a data de conferência; abaixo de uma semelhança mínima só aparecem "portas de entrada" (secretarias, CRAS, PAT).
- Achado durante os testes: sem condições, "preciso de psicóloga, estou ansiosa" recomendava o CAPS de **álcool e drogas** (semelhança de letras em "psic"). Foi corrigido com condições por serviço e há testes para isso.

## Decisão sobre privacidade (por que o texto nunca sai do aparelho)
O site promete não enviar nem guardar nada. Muitas usuárias podem estar em situação de violência. Por isso o modelo roda no navegador. **Não usamos serviço externo de IA (Gemini, ChatGPT ou similares) para ler o que a mulher escreve.** A infraestrutura que existia na linhagem ChatGPT (`servidor.py`, `provedor_gemini.py`) já havia sido recusada pelo mesmo motivo (registro de decisões).

## Próximas etapas (propostas)
1. ~~Busca interna sobre o catálogo~~ (feita, v1). **Limite:** é similaridade de letras e palavras, **não semântica de verdade**: não entende sinônimos que não compartilham letras. Um modelo de *embeddings* de frases rodando no navegador seria o passo seguinte, mas precisa baixar um modelo grande (dezenas de MB) e foi adiado.
2. **Plano com necessidades combinadas**: o resultado do modelo alimentar o plano com mais de uma necessidade.
3. **Observatório (lado da Secretaria):** índice de acesso por bairro e agrupamento (clustering) com dados públicos. Só depois, com servidor e termo de cooperação, a coleta anônima agregada.
4. **Pesquisa em fontes oficiais:** feita pela equipe, **fora do site** (em um processo de atualização do catálogo, com fonte e data), nunca com o texto da usuária.
5. Melhorar o modelo com frases reais, coletadas só com consentimento, quando houver coleta.

## Orientador e avaliação (13/10/2026)

O orientador substituiu a caixa de dúvida por busca lexical. Medição completa, com conjunto de teste guardado, ablação e limites, em `docs/ia/avaliacao_orientacao.md`. Resumo: destino específico certo em 91% no teste depois de ajustes (87% na primeira rodada, a estimativa independente; assistente anterior: 40%), 0 falsos alarmes de perigo em 210 perguntas, segurança 83% na primeira rodada do teste (corrigida depois; ver o documento), abstenção 69% (ponto fraco).

### Fase com API de LLM (planejada, ainda não usada no site)

A chave da API **nunca** vai para o navegador nem para o repositório. Usos previstos, todos nos bastidores: (1) gerar variações de perguntas para ampliar a avaliação, revisadas por pessoas; (2) apoiar a revisão de resumos de serviços; (3) só depois de teste com usuárias, um modo opcional de redação de resposta *a partir dos serviços já encontrados* (nunca inventando serviço, telefone ou direito), com o texto passando por um servidor da própria equipe. Para saber se a chave funciona: `python pipeline/testar_api.py` (lê `ANTHROPIC_API_KEY` do seu computador e faz uma chamada mínima).

### Detector de perigo aprendido (13/10/2026)

A segurança deixou de depender só de listas de palavras: `web/perigo.js` combina as regras com um detector de aprendizado de máquina (`web/dados/modelo_perigo.json`, treinado por `pipeline/treinar_perigo.py`). Regras e detector se complementam: o alerta completo (telefones e serviços de proteção fixados) aparece se uma regra dispara ou o detector está muito confiante; com confiança moderada aparece só um aviso discreto. Uma âncora semântica impede que o detector sozinho dispare sem palavras do assunto. Números e limites em `docs/ia/avaliacao_orientacao.md`.
