# Sensibilidade do BM25 a k1 e b (exploratório)

**Aviso:** análise exploratória, posterior ao teste congelado e não pré-especificada. Não substitui nem altera o resultado principal.

Mesma implementação, normalização, unidades, gabarito e critério de `reproducao/bm25_exploratorio.py`; só k1 e b variam. SA@3 nas 140 mensagens orientáveis. Sem escolha de melhor combinação e sem intervalos por combinação. A configuração de `EXPLORATORIO_BM25.md` é k1 = 1,5 e b = 0,75.

| k1 \ b | 0,5 | 0,75 | 1,0 |
|---|---|---|---|
| 0.9 | 33/140 (23.6%) | 36/140 (25.7%) | 38/140 (27.1%) |
| 1.2 | 33/140 (23.6%) | 39/140 (27.9%) | 36/140 (25.7%) |
| 1.5 | 35/140 (25.0%) | 38/140 (27.1%) | 38/140 (27.1%) |
| 2.0 | 36/140 (25.7%) | 38/140 (27.1%) | 38/140 (27.1%) |

Mínimo: 33/140 (23.6%). Máximo: 39/140 (27.9%).

