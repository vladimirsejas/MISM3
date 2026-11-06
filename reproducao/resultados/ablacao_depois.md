# Ablação do orientador: resultados EXPLORATÓRIOS

> **EXPLORATÓRIO.** Os conjuntos de desenvolvimento e de teste já foram usados em ajustes do sistema (vocabulário, frases de treino, índice). Estas tabelas mostram a contribuição relativa dos componentes, não uma estimativa independente de desempenho. Os conjuntos independente, reserva e final não foram executados.

## Como foi gerado

- Comando: `python reproducao/ablacao.py`
- Commit: `127036ea4373729d624ba440f4845dd8426d4ffb` (ramo `treino-deterministico`)
- Arquivos alterados fora de `reproducao/` no momento da execução: nenhum
- Node `v24.14.0`; Python `3.12.10`; sistema `Windows-11-10.0.26200-SP0`
- Data da execução (UTC): 2026-11-06 16:26:45
- Semente do bootstrap: `20261105`; reamostragens: 2000
- Intervalos: Wilson de 95% para as proporções, mostrado entre colchetes em pontos percentuais; bootstrap percentil de 95% para o MRR (reciprocos por pergunta com gabarito específico).
- Definições das métricas: as de `avaliacao/avaliar.py` (Resposta@3 olha os 3 primeiros cartões; taxa de resposta = perguntas dentro do escopo em que o sistema mostrou algo; perigo conta qualquer alerta, completo ou discreto; abstenção correta = perguntas fora do escopo sem resposta inventada).
- O executor é `reproducao/rodar_variantes.js`, cópia adaptada de `avaliacao/rodar_sistema.js` e `avaliacao/sistema_v2.js`; os originais não foram modificados. Ele executa só as perguntas de desenvolvimento e teste.

## Perguntas usadas e excluídas

| Conjunto | Executadas | Excluídas (`visto_no_treino`) |
|---|---|---|
| desenvolvimento | 78 | 13 |
| teste | 98 | 21 |

## Condições

- **Sistema completo** (`completo`): orientador v2, como no site (regras e modelo de necessidades, detector de perigo aprendido, detector de escopo, índice com palavras, letras e LSA).
- **Apenas regras (necessidade)** (`apenas_regras`): o sinal de intenção vem só das regras lexicais de necessidade; sem o modelo de necessidades.
- **Apenas modelo de necessidades** (`apenas_modelo_necessidades`): o sinal de intenção vem só do modelo de necessidades; sem as regras lexicais.
- **Híbrido sem detector de perigo aprendido** (`sem_perigo_aprendido`): só as regras de segurança de perigo.js; sem o modelo de perigo.
- **Híbrido sem detector de escopo** (`sem_escopo`): sem o detector de escopo; só a nota da busca decide a abstenção.
- **Sem regras lexicais de necessidade** (`sem_regras_lexicais_necessidade`): remove as regras lexicais de necessidade do sinal de intenção (neste motor equivale a 'apenas modelo de necessidades': as regras só entram por esse sinal).
- **Sem n-gramas de caracteres do índice** (`sem_ngramas_letras`): peso do sinal de letras do índice = 0.
- **Sem LSA** (`sem_lsa`): peso do sinal de significado (LSA) do índice = 0.
- **Sem sinal de palavras do índice** (`sem_palavras`): peso do sinal de palavras do índice = 0.
- **Linha de base: busca por palavras (TF-IDF)** (`linha_de_base_tfidf`): TF-IDF de palavras sobre o texto dos destinos, sem raízes, sem letras, sem LSA, sem classificador e sem detector; abstém só se nenhuma palavra casar.

## Conjunto de desenvolvimento (EXPLORATÓRIO, 78 perguntas)

| Condição | Resposta@3 de área | Resposta@3 específica | MRR | Taxa de resposta | Perigo: revocação | Falsos alarmes | Abstenção correta |
|---|---|---|---|---|---|---|---|
| Sistema completo | 97% (66/68) [90–99] | 87% (59/68) [77–93] | 0.77 [0.68–0.84] | 99% (68/69) [92–100] | 100% (14/14) [78–100] | 2% (1/55) [0–10] | 89% (8/9) [57–98] |
| Apenas regras (necessidade) | 96% (65/68) [88–98] | 85% (58/68) [75–92] | 0.75 [0.66–0.83] | 97% (67/69) [90–99] | 100% (14/14) [78–100] | 2% (1/55) [0–10] | 89% (8/9) [57–98] |
| Apenas modelo de necessidades | 97% (66/68) [90–99] | 88% (60/68) [78–94] | 0.78 [0.69–0.85] | 99% (68/69) [92–100] | 100% (14/14) [78–100] | 2% (1/55) [0–10] | 89% (8/9) [57–98] |
| Híbrido sem detector de perigo aprendido | 97% (66/68) [90–99] | 87% (59/68) [77–93] | 0.77 [0.68–0.84] | 99% (68/69) [92–100] | 100% (14/14) [78–100] | 0% (0/55) [0–7] | 89% (8/9) [57–98] |
| Híbrido sem detector de escopo | 97% (66/68) [90–99] | 87% (59/68) [77–93] | 0.77 [0.69–0.84] | 100% (69/69) [95–100] | 100% (14/14) [78–100] | 2% (1/55) [0–10] | 67% (6/9) [35–88] |
| Sem regras lexicais de necessidade | 97% (66/68) [90–99] | 88% (60/68) [78–94] | 0.78 [0.69–0.85] | 99% (68/69) [92–100] | 100% (14/14) [78–100] | 2% (1/55) [0–10] | 89% (8/9) [57–98] |
| Sem n-gramas de caracteres do índice | 87% (59/68) [77–93] | 79% (54/68) [68–87] | 0.75 [0.65–0.83] | 88% (61/69) [79–94] | 100% (14/14) [78–100] | 2% (1/55) [0–10] | 89% (8/9) [57–98] |
| Sem LSA | 81% (55/68) [70–88] | 76% (52/68) [65–85] | 0.67 [0.56–0.76] | 83% (57/69) [72–90] | 100% (14/14) [78–100] | 2% (1/55) [0–10] | 100% (9/9) [70–100] |
| Sem sinal de palavras do índice | 93% (63/68) [84–97] | 82% (56/68) [72–90] | 0.74 [0.65–0.82] | 94% (65/69) [86–98] | 100% (14/14) [78–100] | 2% (1/55) [0–10] | 89% (8/9) [57–98] |
| Linha de base: busca por palavras (TF-IDF) | 96% (65/68) [88–98] | 81% (55/68) [70–88] | 0.71 [0.61–0.80] | 99% (68/69) [92–100] | 0% (0/14) [0–22] | 0% (0/55) [0–7] | 22% (2/9) [6–55] |

## Conjunto de teste (EXPLORATÓRIO, 98 perguntas)

| Condição | Resposta@3 de área | Resposta@3 específica | MRR | Taxa de resposta | Perigo: revocação | Falsos alarmes | Abstenção correta |
|---|---|---|---|---|---|---|---|
| Sistema completo | 94% (78/83) [87–97] | 89% (76/85) [81–94] | 0.79 [0.71–0.86] | 96% (82/85) [90–99] | 100% (12/12) [76–100] | 1% (1/73) [0–7] | 77% (10/13) [50–92] |
| Apenas regras (necessidade) | 92% (76/83) [84–96] | 86% (73/85) [77–92] | 0.76 [0.68–0.84] | 93% (79/85) [85–97] | 100% (12/12) [76–100] | 1% (1/73) [0–7] | 85% (11/13) [58–96] |
| Apenas modelo de necessidades | 93% (77/83) [85–97] | 91% (77/85) [83–95] | 0.79 [0.71–0.85] | 95% (81/85) [89–98] | 100% (12/12) [76–100] | 1% (1/73) [0–7] | 77% (10/13) [50–92] |
| Híbrido sem detector de perigo aprendido | 93% (77/83) [85–97] | 88% (75/85) [80–93] | 0.78 [0.70–0.85] | 96% (82/85) [90–99] | 100% (12/12) [76–100] | 0% (0/73) [0–5] | 77% (10/13) [50–92] |
| Híbrido sem detector de escopo | 94% (78/83) [87–97] | 89% (76/85) [81–94] | 0.79 [0.71–0.86] | 96% (82/85) [90–99] | 100% (12/12) [76–100] | 1% (1/73) [0–7] | 77% (10/13) [50–92] |
| Sem regras lexicais de necessidade | 93% (77/83) [85–97] | 91% (77/85) [83–95] | 0.79 [0.71–0.85] | 95% (81/85) [89–98] | 100% (12/12) [76–100] | 1% (1/73) [0–7] | 77% (10/13) [50–92] |
| Sem n-gramas de caracteres do índice | 81% (67/83) [71–88] | 75% (64/85) [65–83] | 0.66 [0.56–0.74] | 82% (70/85) [73–89] | 100% (12/12) [76–100] | 1% (1/73) [0–7] | 92% (12/13) [67–99] |
| Sem LSA | 67% (56/83) [57–77] | 66% (56/85) [55–75] | 0.58 [0.48–0.67] | 68% (58/85) [58–77] | 100% (12/12) [76–100] | 1% (1/73) [0–7] | 100% (13/13) [77–100] |
| Sem sinal de palavras do índice | 83% (69/83) [74–90] | 80% (68/85) [70–87] | 0.72 [0.63–0.81] | 86% (73/85) [77–92] | 100% (12/12) [76–100] | 1% (1/73) [0–7] | 92% (12/13) [67–99] |
| Linha de base: busca por palavras (TF-IDF) | 88% (73/83) [79–93] | 76% (65/85) [66–84] | 0.66 [0.57–0.74] | 100% (85/85) [96–100] | 0% (0/12) [0–24] | 0% (0/73) [0–5] | 23% (3/13) [8–50] |

## Observações

- A condição `sem_regras_lexicais_necessidade` é a mesma configuração de `apenas_modelo_necessidades`: neste motor as regras lexicais de necessidade só entram pelo sinal de intenção. Os números idênticos confirmam isso.
- Zerar um peso do índice (letras, LSA ou palavras) não remove o cálculo; apenas anula a contribuição do sinal na nota final.
- A linha de base TF-IDF não tem detector de perigo, então sua revocação de perigo é 0 por construção, e ela só se abstém quando nenhuma palavra casa.
- Com poucas perguntas por grupo, os intervalos são largos; diferenças de um ou dois pontos percentuais entre condições não são interpretáveis.
