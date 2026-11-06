# Métricas por área e do detector de perigo: resultados EXPLORATÓRIOS

> **EXPLORATÓRIO.** Desenvolvimento e teste já foram usados em ajustes do sistema; os números descrevem o comportamento do orientador completo nessas perguntas, não um desempenho independente. Independente, reserva e final não foram executados.

## Como foi gerado

- Comando: `python reproducao/metricas_por_necessidade.py`
- Commit: `127036ea4373729d624ba440f4845dd8426d4ffb` (ramo `treino-deterministico`); alterações fora de `reproducao/`: nenhuma
- Node `v24.14.0`; Python `3.12.10`; sistema `Windows-11-10.0.26200-SP0`; data (UTC) 2026-11-06 16:27:28
- Sistema: orientador completo (`reproducao/rodar_variantes.js`, condição `completo`, cópia adaptada de `avaliacao/sistema_v2.js`).
- Perguntas executadas: desenvolvimento 78, teste 98; excluídas por `visto_no_treino`: 13 e 21.
- Intervalos de Wilson de 95% entre colchetes, em pontos percentuais.

## Definições

- **Área esperada:** a área do gabarito (`area:X`). Se a pergunta aceita mais de uma área e o primeiro cartão cai em uma delas, conta como acerto naquela área; caso contrário vale a primeira área listada no gabarito.
- **Área prevista:** a área do primeiro cartão; "abstenção" quando o sistema não mostra cartão.
- Perguntas fora do escopo aparecem na linha "fora de escopo" da matriz e contam como falso positivo da área que o sistema escolheu; perguntas dentro do escopo sem área no gabarito ficam de fora e são contadas à parte.
- **Precisão** da área A = acertos de A ÷ vezes em que o primeiro cartão foi de A. **Revocação** = acertos de A ÷ perguntas esperadas em A (abstenção conta como erro). **Macro-F1** e **acurácia balanceada** (média das revocações) são calculados só sobre áreas com perguntas esperadas.
- **Perigo:** "alerta completo" = nível 2 de `perigo.js`; "aviso discreto" = nível 1; "nenhum" = sem alerta.

## Orientador por área: desenvolvimento (EXPLORATÓRIO, 78 perguntas)

Matriz de confusão (linhas = área esperada; colunas = área do primeiro cartão):

| esperada \ prevista | assistencia | direitos | educacao | entre-mulheres | moradia | saude | trabalho | transporte | abstenção |
|---|---|---|---|---|---|---|---|---|---|
| assistencia | 10 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| direitos | 0 | 14 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| educacao | 0 | 0 | 15 | 0 | 0 | 0 | 0 | 0 | 0 |
| entre-mulheres | 0 | 0 | 0 | 2 | 0 | 0 | 0 | 0 | 0 |
| moradia | 0 | 0 | 0 | 0 | 5 | 0 | 0 | 0 | 0 |
| saude | 1 | 0 | 2 | 0 | 0 | 9 | 0 | 0 | 0 |
| trabalho | 0 | 0 | 0 | 0 | 0 | 0 | 7 | 0 | 0 |
| transporte | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 1 |
| fora de escopo | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 8 |

| Área | Suporte | Precisão | Revocação | F1 |
|---|---|---|---|---|
| assistencia | 10 | 0.91 | 1.00 | 0.95 |
| direitos | 14 | 1.00 | 1.00 | 1.00 |
| educacao | 15 | 0.88 | 1.00 | 0.94 |
| entre-mulheres | 2 | 1.00 | 1.00 | 1.00 |
| moradia | 5 | 1.00 | 1.00 | 1.00 |
| saude | 12 | 1.00 | 0.75 | 0.86 |
| trabalho | 7 | 0.88 | 1.00 | 0.93 |
| transporte | 3 | 1.00 | 0.67 | 0.80 |

**Macro-F1:** 0.94. **Acurácia balanceada:** 0.93. Perguntas em escopo sem área no gabarito (fora da matriz): 1.

## Orientador por área: teste (EXPLORATÓRIO, 98 perguntas)

Matriz de confusão (linhas = área esperada; colunas = área do primeiro cartão):

| esperada \ prevista | assistencia | direitos | educacao | entre-mulheres | moradia | saude | trabalho | transporte | abstenção |
|---|---|---|---|---|---|---|---|---|---|
| assistencia | 14 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| direitos | 0 | 16 | 1 | 0 | 0 | 0 | 0 | 0 | 0 |
| educacao | 0 | 0 | 12 | 0 | 0 | 0 | 0 | 0 | 0 |
| entre-mulheres | 0 | 0 | 0 | 2 | 0 | 0 | 0 | 0 | 0 |
| moradia | 0 | 0 | 0 | 0 | 4 | 0 | 0 | 0 | 0 |
| saude | 0 | 0 | 3 | 0 | 0 | 12 | 1 | 0 | 1 |
| trabalho | 0 | 0 | 1 | 0 | 0 | 0 | 11 | 0 | 1 |
| transporte | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 3 | 1 |
| fora de escopo | 1 | 0 | 0 | 0 | 0 | 2 | 0 | 0 | 10 |

| Área | Suporte | Precisão | Revocação | F1 |
|---|---|---|---|---|
| assistencia | 14 | 0.93 | 1.00 | 0.97 |
| direitos | 17 | 1.00 | 0.94 | 0.97 |
| educacao | 12 | 0.71 | 1.00 | 0.83 |
| entre-mulheres | 2 | 1.00 | 1.00 | 1.00 |
| moradia | 4 | 1.00 | 1.00 | 1.00 |
| saude | 17 | 0.86 | 0.71 | 0.77 |
| trabalho | 13 | 0.92 | 0.85 | 0.88 |
| transporte | 4 | 1.00 | 0.75 | 0.86 |

**Macro-F1:** 0.91. **Acurácia balanceada:** 0.91. Perguntas em escopo sem área no gabarito (fora da matriz): 2.

## Orientador por área: desenvolvimento + teste (agrupados) (EXPLORATÓRIO, 176 perguntas)

Matriz de confusão (linhas = área esperada; colunas = área do primeiro cartão):

| esperada \ prevista | assistencia | direitos | educacao | entre-mulheres | moradia | saude | trabalho | transporte | abstenção |
|---|---|---|---|---|---|---|---|---|---|
| assistencia | 24 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| direitos | 0 | 30 | 1 | 0 | 0 | 0 | 0 | 0 | 0 |
| educacao | 0 | 0 | 27 | 0 | 0 | 0 | 0 | 0 | 0 |
| entre-mulheres | 0 | 0 | 0 | 4 | 0 | 0 | 0 | 0 | 0 |
| moradia | 0 | 0 | 0 | 0 | 9 | 0 | 0 | 0 | 0 |
| saude | 1 | 0 | 5 | 0 | 0 | 21 | 1 | 0 | 1 |
| trabalho | 0 | 0 | 1 | 0 | 0 | 0 | 18 | 0 | 1 |
| transporte | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 5 | 2 |
| fora de escopo | 1 | 0 | 0 | 0 | 0 | 2 | 1 | 0 | 18 |

| Área | Suporte | Precisão | Revocação | F1 |
|---|---|---|---|---|
| assistencia | 24 | 0.92 | 1.00 | 0.96 |
| direitos | 31 | 1.00 | 0.97 | 0.98 |
| educacao | 27 | 0.79 | 1.00 | 0.89 |
| entre-mulheres | 4 | 1.00 | 1.00 | 1.00 |
| moradia | 9 | 1.00 | 1.00 | 1.00 |
| saude | 29 | 0.91 | 0.72 | 0.81 |
| trabalho | 20 | 0.90 | 0.90 | 0.90 |
| transporte | 7 | 1.00 | 0.71 | 0.83 |

**Macro-F1:** 0.92. **Acurácia balanceada:** 0.91. Perguntas em escopo sem área no gabarito (fora da matriz): 3.

## Detector de perigo: desenvolvimento (EXPLORATÓRIO, 78 perguntas)

| Rótulo do gabarito \ saída do sistema | alerta completo | aviso discreto | nenhum | total |
|---|---|---|---|---|
| perigo | 9 | 5 | 0 | 14 |
| sem perigo | 0 | 1 | 63 | 64 |

| Métrica | Valor [IC 95%] |
|---|---|
| Revocação (qualquer alerta) | 100% (14/14) [78–100] |
| Revocação (só alerta completo) | 64% (9/14) [39–84] |
| Especificidade (sem alerta entre os sem perigo) | 98% (63/64) [92–100] |
| Falso alarme (qualquer alerta) | 2% (1/64) [0–8] |
| Falso alarme (só alerta completo) | 0% (0/64) [0–6] |

Por tipo de perigo:

| Tipo | Situação |
|---|---|
| violência | 100% (9/9) [70–100] das perguntas de perigo com categoria `violencia` receberam algum alerta do tipo violência (alerta completo em 5 de 9) |
| suicídio | não separável: o gabarito marca só perigo sim ou não e a categoria da pergunta; não há rótulo de suicídio |
| criança | não separável: não há categoria nem rótulo de criança no gabarito |
| saúde | não separável com confiança: a categoria `saude` tem uma única pergunta de perigo nestes conjuntos, e perigo de saúde não tem rótulo próprio |

Tipos que o sistema atribuiu às perguntas de perigo (descritivo; não é gabarito): crianca = 2, saude = 1, suicidio = 2, violencia = 11.

## Detector de perigo: teste (EXPLORATÓRIO, 98 perguntas)

| Rótulo do gabarito \ saída do sistema | alerta completo | aviso discreto | nenhum | total |
|---|---|---|---|---|
| perigo | 12 | 0 | 0 | 12 |
| sem perigo | 1 | 0 | 85 | 86 |

| Métrica | Valor [IC 95%] |
|---|---|
| Revocação (qualquer alerta) | 100% (12/12) [76–100] |
| Revocação (só alerta completo) | 100% (12/12) [76–100] |
| Especificidade (sem alerta entre os sem perigo) | 99% (85/86) [94–100] |
| Falso alarme (qualquer alerta) | 1% (1/86) [0–6] |
| Falso alarme (só alerta completo) | 1% (1/86) [0–6] |

Por tipo de perigo:

| Tipo | Situação |
|---|---|
| violência | 100% (9/9) [70–100] das perguntas de perigo com categoria `violencia` receberam algum alerta do tipo violência (alerta completo em 9 de 9) |
| suicídio | não separável: o gabarito marca só perigo sim ou não e a categoria da pergunta; não há rótulo de suicídio |
| criança | não separável: não há categoria nem rótulo de criança no gabarito |
| saúde | não separável com confiança: a categoria `saude` tem uma única pergunta de perigo nestes conjuntos, e perigo de saúde não tem rótulo próprio |

Tipos que o sistema atribuiu às perguntas de perigo (descritivo; não é gabarito): crianca = 1, violencia = 11.

## Detector de perigo: desenvolvimento + teste (agrupados) (EXPLORATÓRIO, 176 perguntas)

| Rótulo do gabarito \ saída do sistema | alerta completo | aviso discreto | nenhum | total |
|---|---|---|---|---|
| perigo | 21 | 5 | 0 | 26 |
| sem perigo | 1 | 1 | 148 | 150 |

| Métrica | Valor [IC 95%] |
|---|---|
| Revocação (qualquer alerta) | 100% (26/26) [87–100] |
| Revocação (só alerta completo) | 81% (21/26) [62–91] |
| Especificidade (sem alerta entre os sem perigo) | 99% (148/150) [95–100] |
| Falso alarme (qualquer alerta) | 1% (2/150) [0–5] |
| Falso alarme (só alerta completo) | 1% (1/150) [0–4] |

Por tipo de perigo:

| Tipo | Situação |
|---|---|
| violência | 100% (18/18) [82–100] das perguntas de perigo com categoria `violencia` receberam algum alerta do tipo violência (alerta completo em 14 de 18) |
| suicídio | não separável: o gabarito marca só perigo sim ou não e a categoria da pergunta; não há rótulo de suicídio |
| criança | não separável: não há categoria nem rótulo de criança no gabarito |
| saúde | não separável com confiança: a categoria `saude` tem uma única pergunta de perigo nestes conjuntos, e perigo de saúde não tem rótulo próprio |

Tipos que o sistema atribuiu às perguntas de perigo (descritivo; não é gabarito): crianca = 3, saude = 1, suicidio = 2, violencia = 22.

## Limites

- O gabarito de perigo é booleano; por isso só a violência pode ser avaliada por tipo, e mesmo assim pela categoria da pergunta, não por um rótulo de tipo.
- Com 12 a 14 perguntas de perigo por conjunto, a revocação tem intervalo largo: 100% observado é compatível com revocação verdadeira bem menor.
- Os falsos alarmes contam perguntas escritas pela própria equipe; frases reais de usuárias podem se comportar diferente.
