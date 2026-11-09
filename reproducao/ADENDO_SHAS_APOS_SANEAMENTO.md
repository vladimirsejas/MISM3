# Adendo: correspondência de SHAs depois do saneamento do histórico (09/11/2026)

O histórico do repositório foi reescrito para remover versões antigas de dados territoriais e relatórios de auditoria (ver `docs/territorial/RUNBOOK_SANEAMENTO_HISTORICO.md`). **Todos os SHAs de commit mudaram.** Este adendo liga os SHAs citados no manifesto da execução, no protocolo e nos documentos aos SHAs novos.

Não mudaram: o SHA-256 do conjunto congelado (`abbae38d3cc39a8428130c09ac59d65c96cff497112481a9eadcf3ac9227ae00`), o conteúdo dos arquivos do sistema avaliado (código do orientador, modelos, índice e catálogo) e o conteúdo dos arquivos listados no manifesto. Mudaram os SHAs dos commits e das etiquetas.

## Etiquetas

| Etiqueta | Commit antigo | Commit novo |
|---|---|---|
| `v1.0-pesquisa` | `2d8a836cdc8e700500b67c2b6433bc26c4fd9fdd` | `a178cd7b42e3dc88d90afad4b48ca8f212699c0d` |
| `v0.9-revisao` | `b4bac372505b418bb8b37007e1ccd8289bcbc69e` | `c4116ca0baa8018be00906470ea65fb985c65cf4` |

## SHAs citados nos documentos

| SHA antigo citado | Commit novo | Onde é citado |
|---|---|---|
| `1237aff` | (sem equivalente: o commit só alterava arquivos removidos e deixou de existir) | docs/territorial/PLANO_PUBLICACAO_PUBLICA.md |
| `127036e` | `a4baed25bed53fb86ac9884e5f88d654899086bd` | reproducao/AMBIENTE.md |
| `22bdc74` | `73e0330fb8b276333f2ae6fc41d3bc58a8c4a439` | docs/territorial/AUDITORIA_COMPLETA_MAPA_V1.md, protocolo/PROTOCOLO_EXPERIMENTAL.md |
| `2d8a836cdc8e700500b67c2b6433bc26c4fd9fdd` | `a178cd7b42e3dc88d90afad4b48ca8f212699c0d` | reproducao/MANIFESTO_EXECUCAO_v1.md |
| `398a145` | `505a6232129adf4251d6df774ef3c17009fa8762` | docs/territorial/PLANO_PUBLICACAO_PUBLICA.md |
| `3af80c9` | `744304c8626d8cc03c6f269bf535b8fb1459f106` | docs/territorial/PLANO_PUBLICACAO_PUBLICA.md |
| `44520b8d5d07f9a2ba275fcea3dba44ffec32d05` | `a19b54d39cd67ef985362e326f842fadec9b7e4b` | reproducao/MANIFESTO_EXECUCAO_v1.md |
| `4888488cddb7b446b8d971db0e8db676d1d761d5` | `cc1e4d099b43a7033adcd1bfb085774ad1d9b2fd` | docs/territorial/MEDICAO_TECLADO_E_FOCO_2026-11-06.md |
| `52ded74d291516c830764dddaafe00f6acddd725` | `2548be809c05ba8f3e633958700b6409e001e70a` | docs/territorial/INVENTARIO_TERRITORIAL.md |
| `86c7ada7ba35c5002f62d057a8b6e529740dc2f8` | `21fcad070e3eebd7c90da90dd4e4e6df9337de70` | docs/territorial/INVENTARIO_TERRITORIAL.md |
| `89683e7` | `405b81af7ae9685939ef1edebd204f6294216780` | docs/territorial/PLANO_PUBLICACAO_PUBLICA.md |
| `8e45ddc` | (sem equivalente: o commit só alterava arquivos removidos e deixou de existir) | docs/territorial/PLANO_PUBLICACAO_PUBLICA.md |
| `c30ee8fb8d1ee45af40cf80b5a9097670a7d82bf` | `e808cc870087520a606aa23ad0bdbccb3ddcf158` | docs/territorial/RESULTADO_AUDITORIA_CENTROIDES_2026-11-08.md |
| `c34a903` | `fa3416dbdb3d4f9a158c75d746a70903935997e7` | docs/territorial/PLANO_PUBLICACAO_PUBLICA.md |
| `c534542` | `d32cc6c7a557b728a1304280d9466906e7b7c50f` | docs/territorial/AUDITORIA_COMPLETA_MAPA_V1.md |
| `c7d89d4f083c978be50b11826e18f4671f34dee5` | `61791ff3a70cb9021801041cc4d26d5d204e1184` | reproducao/MANIFESTO_EXECUCAO_v1.md |
| `fd7b371ba4ae4af8147e084f1e2b3623aa2ce160` | `a72934495866c3573ff2cb751653398304a2b159` | reproducao/AMBIENTE.md |

A tabela completa (todos os commits) está em `C:\MISM_PRIVACIDADE\PACOTE\commit-map.txt` no computador do proprietário; não é versionada porque lista commits antigos que continham dados removidos.
