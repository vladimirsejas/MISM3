# Diagnóstico de limiar do detector de alerta (exploratório)

**Aviso:** análise exploratória, posterior ao teste congelado e não pré-especificada; não pode ser usada para alterar o sistema congelado. Não substitui nem altera o resultado principal. Nenhum texto de mensagem é reproduzido: só contagens e IDs.

Reexecução do código congelado (commit `4bf1676`, em memória) só da camada `Perigo.avaliar`, sobre as 190 mensagens. Os limiares `meta.limiares` e `meta.limiares_altos` de cada tipo (violência, suicídio, criança, saúde) do `modelo_perigo.json` são multiplicados pelo fator numa cópia em memória; as regras determinísticas não mudam. "Âncora desligada" troca em memória a condição do `if` da âncora em `perigo.js`. Nenhum arquivo do sistema foi alterado. Alertas contam qualquer tipo de alerta, em qualquer nível.

Verificação: fator 1,0 com âncora ligada = 73/90 e 0/100, igual ao CSV congelado em todas as 190 mensagens.

## Tabela 3: alertas por combinação

| Âncora | Fator | Alertas nas 90 de risco | Alertas completos nas 90 | Alertas nas 100 sem risco |
|---|---|---|---|---|
| ligada | 1.0 | 73/90 | 56/90 | 0/100 |
| ligada | 0.9 | 75/90 | 62/90 | 1/100 |
| ligada | 0.8 | 78/90 | 68/90 | 2/100 |
| ligada | 0.7 | 80/90 | 73/90 | 3/100 |
| ligada | 0.6 | 81/90 | 77/90 | 4/100 |
| ligada | 0.5 | 83/90 | 79/90 | 5/100 |
| desligada | 1.0 | 76/90 | 58/90 | 3/100 |
| desligada | 0.9 | 78/90 | 64/90 | 4/100 |
| desligada | 0.8 | 81/90 | 70/90 | 5/100 |
| desligada | 0.7 | 83/90 | 76/90 | 7/100 |
| desligada | 0.6 | 85/90 | 80/90 | 11/100 |
| desligada | 0.5 | 87/90 | 82/90 | 18/100 |

## Tabela 4: alertas de risco por categoria (qualquer nível; entre parênteses, alertas completos)

| Âncora | Fator | Violência (de 55) | Ideação (de 20) | Crianças (de 15) |
|---|---|---|---|---|
| ligada | 1.0 | 45 (33) | 14 (11) | 14 (12) |
| ligada | 0.9 | 47 (37) | 14 (13) | 14 (12) |
| ligada | 0.8 | 49 (41) | 15 (14) | 14 (13) |
| ligada | 0.7 | 50 (46) | 16 (14) | 14 (13) |
| ligada | 0.6 | 51 (49) | 16 (14) | 14 (14) |
| ligada | 0.5 | 53 (50) | 16 (15) | 14 (14) |
| desligada | 1.0 | 45 (33) | 16 (12) | 15 (13) |
| desligada | 0.9 | 47 (37) | 16 (14) | 15 (13) |
| desligada | 0.8 | 49 (41) | 17 (15) | 15 (14) |
| desligada | 0.7 | 50 (46) | 18 (16) | 15 (14) |
| desligada | 0.6 | 51 (49) | 19 (16) | 15 (15) |
| desligada | 0.5 | 53 (50) | 19 (17) | 15 (15) |
