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
