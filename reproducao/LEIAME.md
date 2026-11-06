# reproducao/

Material de reprodução e auditoria do MISM3. Tudo aqui foi criado sem modificar `web/`, `pipeline/`, `catalogo/`, `avaliacao/`, `dados/`, `docs/` nem `protocolo/`. Nenhum modelo foi treinado, nenhum limiar ou vocabulário foi ajustado, nenhuma pergunta foi criada, e os conjuntos independente, reserva e final **não foram executados**.

**Todas as tabelas de desempenho são EXPLORATÓRIAS:** desenvolvimento e teste já foram usados em ajustes do sistema, então os números descrevem o comportamento do sistema nessas perguntas, não um desempenho independente.

| Arquivo | O que é |
|---|---|
| `comum.py` | Funções comuns: carrega só desenvolvimento e teste (sem `visto_no_treino`), executa as variantes, intervalo de Wilson, bootstrap com semente fixa. |
| `rodar_variantes.js` | Cópia adaptada de `avaliacao/rodar_sistema.js` e `avaliacao/sistema_v2.js`: executa só as perguntas que recebe e liga ou desliga componentes sem alterar `web/`. |
| `ablacao.py` | Tarefa 1: ablação (9 condições e uma linha de base TF-IDF). Gera `resultados/ablacao.md` e `resultados/ablacao.csv`. |
| `metricas_por_necessidade.py` | Tarefa 2: matriz de confusão por área, precisão, revocação, F1, macro-F1, acurácia balanceada e métricas do detector de perigo. Gera `resultados/metricas_por_necessidade.md` e os CSV. |
| `auditoria_privacidade.py` | Tarefa 3: auditoria de rede e de armazenamento com Playwright (Chromium). Gera `auditoria_privacidade.md` e `resultados/auditoria_requisicoes.json`. |
| `gerar_ambiente.py` | Tarefa 4: gera `AMBIENTE.md` (versões, comandos, tamanhos, análise de sementes). |
| `resultados/` | Saídas geradas (Markdown, CSV e JSON), com o comando, o commit, as versões e a semente registrados em cada relatório. |

Comandos, da raiz do repositório:

```bash
python reproducao/ablacao.py
python reproducao/metricas_por_necessidade.py
python reproducao/gerar_ambiente.py
python -m pip install playwright && python -m playwright install chromium
python reproducao/auditoria_privacidade.py
```

A semente do bootstrap é `20261105` (2000 reamostragens). Os relatórios registram o hash do commit em que foram gerados; como os próprios arquivos de `reproducao/` entram em commits posteriores, repita os comandos no commit que quiser auditar.
