# Busca do sistema completo sem a fixação de serviços: versão completa (exploratório)

**Aviso:** análise exploratória, posterior ao teste congelado e não pré-especificada. Não substitui nem altera o resultado principal.

Variantes e verificação: ver `reproducao/busca_sem_fixacao_exploratorio.py` (reexecução em memória do commit `4bf1676`). (i) busca pura = 3 primeiros de `motor.pontuar`, ignorando fixação, escopo, abstenção, corte, diversidade e reforços. (ii) pipeline completo com `pins = []` em `Perigo.avaliar`; alerta e `urgente` do nível 2 inalterados; abstenção e demais regras como estão.

Verificação desta execução: sistema completo reexecutado 76/140 (0 divergências contra o CSV congelado); TF-IDF 35/140; BM25 38/140. Bootstrap pareado por mensagem, 10000 reamostragens, semente 20261106, `conjunto_v1.bootstrap_pareado`, percentis 2,5% e 97,5%; nas 50 sem risco o bootstrap usa só essas 50 mensagens.

## SA@3

| Grupo | (i) busca pura | (ii) sem fixação | TF-IDF | BM25 | Sistema completo |
|---|---|---|---|---|---|
| total | 46/140 (32.9%) | 42/140 (30.0%) | 35/140 (25.0%) | 38/140 (27.1%) | 76/140 (54.3%) |
| risco | 17/90 (18.9%) | 15/90 (16.7%) | 12/90 (13.3%) | 12/90 (13.3%) | 49/90 (54.4%) |
| sem risco | 29/50 (58.0%) | 27/50 (54.0%) | 23/50 (46.0%) | 26/50 (52.0%) | 27/50 (54.0%) |

## Diferenças pareadas (variante menos referência; pontos percentuais; IC 95%)

| Mensagens | Variante | Referência | Diferença | IC 95% |
|---|---|---|---|---|
| 140 | (i) busca pura | TF-IDF | +7.86 | [0.71; 15.00] |
| 140 | (i) busca pura | BM25 | +5.71 | [-0.71; 12.86] |
| 140 | (i) busca pura | sistema completo | -21.43 | [-29.29; -13.57] |
| 140 | (ii) pipeline sem fixação | TF-IDF | +5.00 | [-2.14; 12.86] |
| 140 | (ii) pipeline sem fixação | BM25 | +2.86 | [-4.29; 10.00] |
| 140 | (ii) pipeline sem fixação | sistema completo | -24.29 | [-31.43; -17.14] |
| 50 sem risco | (i) busca pura | TF-IDF | +12.00 | [0.00; 24.00] |
| 50 sem risco | (i) busca pura | BM25 | +6.00 | [-6.00; 18.00] |
| 50 sem risco | (i) busca pura | sistema completo | +4.00 | [0.00; 10.00] |
| 50 sem risco | (ii) pipeline sem fixação | TF-IDF | +8.00 | [-4.00; 20.00] |
| 50 sem risco | (ii) pipeline sem fixação | BM25 | +2.00 | [-10.00; 14.00] |
| 50 sem risco | (ii) pipeline sem fixação | sistema completo | +0.00 | [0.00; 0.00] |
