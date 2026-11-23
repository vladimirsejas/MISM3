# Comparação exploratória com BM25 (conjunto congelado v1)

**Aviso:** análise exploratória, posterior ao teste congelado e não pré-especificada. Não substitui nem altera o resultado principal.

## Configuração (definida antes de ver qualquer resultado)

- BM25 Okapi, k1 = 1.5 e b = 0.75; única configuração, nada ajustado no teste.
- idf = ln((N − df + 0,5)/(df + 0,5) + 1); termos repetidos na consulta contam repetidos; implementação própria em `reproducao/bm25_exploratorio.py` (sem dependências).
- Mesma normalização (`ablacao._tokens`), mesmas unidades (`web/dados/indice_orientacao.json`, campo `texto`), mesma saída (até 6 itens com nota > 0; abstém só se nada casar) e mesmo gabarito/critério de acerto (`conjunto_v1.calcular`, `casa_v1`) da condição 10 (TF-IDF).
- Bootstrap pareado por mensagem, 10000 reamostragens, semente 20261106, `conjunto_v1.bootstrap_pareado`, percentis 2,5% e 97,5%.
- Verificação: o TF-IDF reproduzido nesta execução deu 35/140.
- O vetor do sistema completo (76/140) foi lido de `reproducao/resultados/PREVISOES_TESTE_CONGELADO.csv`, somente leitura.

## Resposta@3 específica (denominador: mensagens orientáveis com destino esperado)

| Grupo | BM25 | TF-IDF | Sistema completo |
|---|---|---|---|
| total | 38/140 (27.1%) | 35/140 (25.0%) | 76/140 (54.3%) |
| risco | 12/90 (13.3%) | 12/90 (13.3%) | 49/90 (54.4%) |
| sem risco | 26/50 (52.0%) | 23/50 (46.0%) | 27/50 (54.0%) |

## Diferenças pareadas (pontos percentuais, IC 95% bootstrap), nas 140 mensagens

| Diferença | Estimativa | IC 95% |
|---|---|---|
| BM25 − TF-IDF | +2.14 | [-2.14; 7.14] |
| BM25 − sistema completo | -27.14 | [-36.43; -17.14] |

Abstenções em mensagens orientáveis: BM25 0/140; TF-IDF 0/140.

