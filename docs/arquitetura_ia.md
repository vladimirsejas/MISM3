# Arquitetura de IA do Mulher em Rede

Escrito em 11/10/2026. Define o papel de cada tecnologia, o que está implementado e o que não está, sem chamar de IA o que é regra.

## Quatro capacidades, o que é cada uma e o estado real
| Capacidade | O que faz no projeto | Estado |
|---|---|---|
| **Aprendizado de máquina (classificação de texto)** | Lê o que a mulher escreve e sugere até 3 áreas do site. Modelo de regressão logística sobre n-gramas de caracteres e palavras (TF-IDF), treinado por `pipeline/treinar_necessidades.py`, que roda **no navegador** (`web/ia.js`, pesos em `web/dados/modelo_necessidades.json`). | **Implementado** (v1) |
| **Regras de palavras-chave** | `web/necessidades.js`. Entram junto com o modelo, para nunca perder um alerta de violência. **Não são IA.** | Implementado |
| **Sistema de recomendação** | Hoje o plano do Trabalho é uma árvore de decisão escrita à mão (**regras, não aprendizado**). | Regras; evolução prevista |
| **Inteligência pública (Observatório)** | Indicadores agregados, lacunas e análise territorial para a Secretaria. | **Não implementado** (ver `docs/observatorio_e_dados_da_secretaria.md`) |

## Como o modelo foi avaliado (resumo; detalhes em `docs/ia/avaliacao_modelo_necessidades.md`)
Validação cruzada em 5 partes sobre as frases escritas pela equipe, e teste independente com as 53 frases dos testes antigos.
- Só regras: F1 65%. Só o modelo: F1 68%. **Regras + modelo (o que o site usa): F1 75%.**
- Em **violência**, as regras sozinhas pegam 24% dos casos, o modelo 81% e os dois juntos 86%. Foi o ganho mais importante.
- **Limites:** frases escritas pela equipe, não por mulheres reais; conjunto pequeno; limiar escolhido olhando a própria validação (número otimista); nas 53 frases antigas as regras vão melhor, porque foram escritas para elas.

## Decisão sobre privacidade (por que o texto nunca sai do aparelho)
O site promete não enviar nem guardar nada. Muitas usuárias podem estar em situação de violência. Por isso o modelo roda no navegador. **Não usamos serviço externo de IA (Gemini, ChatGPT ou similares) para ler o que a mulher escreve.** A infraestrutura que existia na linhagem ChatGPT (`servidor.py`, `provedor_gemini.py`) já havia sido recusada pelo mesmo motivo (registro de decisões).

## Próximas etapas (propostas)
1. **Busca semântica interna** sobre o catálogo (162 serviços): entender sinônimos e ranquear serviços por necessidade, no navegador.
2. **Plano com necessidades combinadas**: o resultado do modelo alimentar o plano com mais de uma necessidade.
3. **Observatório (lado da Secretaria):** índice de acesso por bairro e agrupamento (clustering) com dados públicos. Só depois, com servidor e termo de cooperação, a coleta anônima agregada.
4. **Pesquisa em fontes oficiais:** feita pela equipe, **fora do site** (em um processo de atualização do catálogo, com fonte e data), nunca com o texto da usuária.
5. Melhorar o modelo com frases reais, coletadas só com consentimento, quando houver coleta.
