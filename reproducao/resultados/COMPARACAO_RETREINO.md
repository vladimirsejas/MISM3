# Comparação antes e depois do retreino determinístico: resultados EXPLORATÓRIOS

> **EXPLORATÓRIO.** Desenvolvimento e teste já foram usados em ajustes; não são estimativa independente. Os conjuntos independente, reserva e final não foram executados. Nenhuma ação corretiva foi tomada.

- **Antes:** arquivos originais de `reproducao/resultados/` (`*_antes.*`), gerados com os modelos versionados na main (commit `fd7b371`, Python 3.14.3).
- **Depois:** `*_depois.*`, gerados com os modelos regenerados (commit `127036e`, Python 3.12.10, `PYTHONHASHSEED=0`), pelos mesmos scripts `reproducao/ablacao.py` e `reproducao/metricas_por_necessidade.py`.
- Os scripts carregam `web/dados/modelo_*.json` do disco (`reproducao/rodar_variantes.js`), portanto o "depois" usou os modelos novos.

## Resultado

- Métricas comparadas (condição × conjunto × métrica): 140; com valor ou contagem diferente: 0.
- Diferenças maiores que 1 ponto percentual: **nenhuma**.
- As tabelas por área, as matrizes de confusão e as métricas do detector de perigo (`metricas_area_*`, `confusao_area_*`, `perigo_*`) são idênticas antes e depois (diferem apenas no fim de linha dos arquivos).

## O que mudou nos modelos

- `modelo_necessidades.json`: só `meta.treinado_em` (de `2026-11-05` para `sha256:<hash das frases>:versao=1`).
- `modelo_perigo.json`: vocabulário (11447 → 12089 termos), IDF, coeficientes e limiares (por exemplo, crianca alto 0,64 → 0,56; saude alto 0,76 → 0,68). O arquivo versionado não correspondia ao estado atual das frases de treino. Mesmo assim, nos 176 itens de desenvolvimento e teste executados, as métricas não mudaram. Não foi investigado por quê; apenas registrado.
- `modelo_escopo.json` e `indice_orientacao.json`: byte a byte iguais aos versionados.

## Tabela (valor antes → depois, em %)

| Condição | Conjunto | Resposta@3 área | Resposta@3 específica | MRR | Revocação de perigo | Falsos alarmes | Abstenção correta |
|---|---|---|---|---|---|---|---|
| completo | desenvolvimento | 97.1 → 97.1 | 86.8 → 86.8 | 76.7 → 76.7 | 100.0 → 100.0 | 1.8 → 1.8 | 88.9 → 88.9 |
| completo | teste | 94.0 → 94.0 | 89.4 → 89.4 | 78.8 → 78.8 | 100.0 → 100.0 | 1.4 → 1.4 | 76.9 → 76.9 |
| apenas_regras | desenvolvimento | 95.6 → 95.6 | 85.3 → 85.3 | 74.6 → 74.6 | 100.0 → 100.0 | 1.8 → 1.8 | 88.9 → 88.9 |
| apenas_regras | teste | 91.6 → 91.6 | 85.9 → 85.9 | 76.2 → 76.2 | 100.0 → 100.0 | 1.4 → 1.4 | 84.6 → 84.6 |
| apenas_modelo_necessidades | desenvolvimento | 97.1 → 97.1 | 88.2 → 88.2 | 77.8 → 77.8 | 100.0 → 100.0 | 1.8 → 1.8 | 88.9 → 88.9 |
| apenas_modelo_necessidades | teste | 92.8 → 92.8 | 90.6 → 90.6 | 78.6 → 78.6 | 100.0 → 100.0 | 1.4 → 1.4 | 76.9 → 76.9 |
| sem_perigo_aprendido | desenvolvimento | 97.1 → 97.1 | 86.8 → 86.8 | 76.7 → 76.7 | 100.0 → 100.0 | 0.0 → 0.0 | 88.9 → 88.9 |
| sem_perigo_aprendido | teste | 92.8 → 92.8 | 88.2 → 88.2 | 77.6 → 77.6 | 100.0 → 100.0 | 0.0 → 0.0 | 76.9 → 76.9 |
| sem_escopo | desenvolvimento | 97.1 → 97.1 | 86.8 → 86.8 | 77.0 → 77.0 | 100.0 → 100.0 | 1.8 → 1.8 | 66.7 → 66.7 |
| sem_escopo | teste | 94.0 → 94.0 | 89.4 → 89.4 | 78.8 → 78.8 | 100.0 → 100.0 | 1.4 → 1.4 | 76.9 → 76.9 |
| sem_regras_lexicais_necessidade | desenvolvimento | 97.1 → 97.1 | 88.2 → 88.2 | 77.8 → 77.8 | 100.0 → 100.0 | 1.8 → 1.8 | 88.9 → 88.9 |
| sem_regras_lexicais_necessidade | teste | 92.8 → 92.8 | 90.6 → 90.6 | 78.6 → 78.6 | 100.0 → 100.0 | 1.4 → 1.4 | 76.9 → 76.9 |
| sem_ngramas_letras | desenvolvimento | 86.8 → 86.8 | 79.4 → 79.4 | 74.6 → 74.6 | 100.0 → 100.0 | 1.8 → 1.8 | 88.9 → 88.9 |
| sem_ngramas_letras | teste | 80.7 → 80.7 | 75.3 → 75.3 | 65.6 → 65.6 | 100.0 → 100.0 | 1.4 → 1.4 | 92.3 → 92.3 |
| sem_lsa | desenvolvimento | 80.9 → 80.9 | 76.5 → 76.5 | 66.7 → 66.7 | 100.0 → 100.0 | 1.8 → 1.8 | 100.0 → 100.0 |
| sem_lsa | teste | 67.5 → 67.5 | 65.9 → 65.9 | 57.6 → 57.6 | 100.0 → 100.0 | 1.4 → 1.4 | 100.0 → 100.0 |
| sem_palavras | desenvolvimento | 92.7 → 92.7 | 82.3 → 82.3 | 73.8 → 73.8 | 100.0 → 100.0 | 1.8 → 1.8 | 88.9 → 88.9 |
| sem_palavras | teste | 83.1 → 83.1 | 80.0 → 80.0 | 72.1 → 72.1 | 100.0 → 100.0 | 1.4 → 1.4 | 92.3 → 92.3 |
| linha_de_base_tfidf | desenvolvimento | 95.6 → 95.6 | 80.9 → 80.9 | 70.8 → 70.8 | 0.0 → 0.0 | 0.0 → 0.0 | 22.2 → 22.2 |
| linha_de_base_tfidf | teste | 87.9 → 87.9 | 76.5 → 76.5 | 66.4 → 66.4 | 0.0 → 0.0 | 0.0 → 0.0 | 23.1 → 23.1 |
