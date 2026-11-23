# Adendo: registro da execução do teste congelado v1

Este adendo registra apenas fatos verificáveis nos arquivos do repositório. Não altera o protocolo, o manifesto, o conjunto congelado nem o código do sistema.

## Data da execução

- Segundo `reproducao/resultados/INTEGRIDADE_TESTE.txt`: início em 2026-11-11 19:04:32 e fim em 2026-11-11 19:05:03 (hora local).
- Segundo a data de modificação dos arquivos no disco: `PREVISOES_TESTE_CONGELADO.csv` em 2026-11-11 19:05:03 (-0300) e `INTEGRIDADE_TESTE.txt` em 2026-11-11 19:05:03 (-0300).
- Essas datas vêm do próprio arquivo e do sistema de arquivos. Não há carimbo de tempo independente.

## Código usado

- Commit registrado em `INTEGRIDADE_TESTE.txt`: `4bf167621e7d66baf953418a3fa48d7b6ed99b2f` (2026-11-07 06:21:49 -0300).
- Esse commit não é ancestral da `main` atual (o histórico foi reescrito em 2026-11-09; ver `reproducao/ADENDO_SHAS_APOS_SANEAMENTO.md`) e só existe em branches antigas, por exemplo `backup-main-antiga-4bf1676`.
- Reexecutar `web/` desse commit, carregado em memória com `git show`, reproduz as linhas registradas no CSV (alerta, abstenção e três primeiros itens) sem divergência, nas 7 condições executáveis em Node. A condição 10 (TF-IDF) não foi reexecutada dessa forma.

## Versionamento tardio

- `reproducao/resultados/PREVISOES_TESTE_CONGELADO.csv` e `reproducao/resultados/INTEGRIDADE_TESTE.txt` só foram versionados em 2026-11-23, doze dias depois da execução. Antes disso existiam apenas no disco local.
- O script que gerou o CSV não está no repositório. Antes deste commit, não havia referência a esses dois arquivos no código nem no histórico.
- Também não foram versionados `saidas_brutas.json`, `metricas.json` nem `resultados.md` da pasta `reproducao/resultados/conjunto_v1/` (que `conjunto_v1.py --etapa-b` criaria). Essa pasta não existe no disco.

## SHA-256 dos arquivos como estavam no disco (byte a byte, antes do commit)

| Arquivo | Bytes | SHA-256 |
|---|---|---|
| `reproducao/resultados/PREVISOES_TESTE_CONGELADO.csv` | 146362 | `42c732fde8da489a39027845edc1a46d7b27b2046e121e0983f32385e48aa01f` |
| `reproducao/resultados/INTEGRIDADE_TESTE.txt` | 2760 | `a013c57717b0c3b250c98a08e7b51271574c5c1e51a68820fba43298ebf1b41e` |

## Quebras de linha (CRLF e LF)

- No disco, o CSV tem quebras de linha CRLF (1901 caracteres CR, um por linha). `INTEGRIDADE_TESTE.txt` não tem CR.
- O repositório local tem `core.autocrlf=true`. Ao adicionar o CSV ao índice, o git pode converter CRLF em LF no blob.
- SHA-256 do CSV com CRLF convertido em LF (144461 bytes): `c36f5864774c96fb8e5acd0577a435b4af9295e9d7e30341baad683f10f61167`. É este o hash que o blob commitado deve ter, se o git normalizar as quebras de linha. Qualquer verificação deve comparar com esse valor, e não com o hash do disco.

## Documentos desatualizados (não editados)

- `protocolo/PROTOCOLO_EXPERIMENTAL.md` ainda diz que a execução do experimento não foi realizada (cabeçalho, seção 4.4 e lista de pendências).
- `reproducao/MANIFESTO_EXECUCAO_v1.md` foi gerado antes da execução e não registra o resultado.
- Os dois arquivos permanecem como estavam. Este adendo é o registro de que a execução ocorreu em 2026-11-11, conforme os dados acima.

## Análises posteriores

Os arquivos `reproducao/bm25_exploratorio.py`, `busca_sem_fixacao_exploratorio.py`, `analises_adicionais_exploratorio.py` e `diagnostico_alerta_exploratorio.py`, com as saídas `reproducao/resultados/EXPLORATORIO_*`, são análises exploratórias feitas depois do teste congelado, não pré-especificadas, e não alteram o sistema avaliado.
