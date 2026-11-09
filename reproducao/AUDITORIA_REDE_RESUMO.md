# Auditoria de rede: resumo público (sem identificadores)

Este resumo substitui os relatórios detalhados das medições de rede (que continham CEPs usados nos testes, coordenadas e o registro requisição a requisição). Os relatórios detalhados deixaram de ser versionados porque o registro completo de requisições, com URLs de tiles e cabeçalhos, não é necessário para a conclusão; os **scripts** que geram essas medições continuam em `reproducao/` (`auditoria_privacidade.py`, `auditoria_privacidade_cep.py` e `auditoria_privacidade_cep_tiles_ligados.py`) e as saídas, se geradas de novo, são ignoradas pelo Git (`.gitignore`).

**Escopo e limites.** Medições feitas em 06/11/2026 com Chromium sem janela (Playwright) e servidor estático local. Mostram o que esse navegador, nesse ambiente, enviou em uma passada por cenário. Não provam nada sobre outros navegadores, extensões, redes ou sobre o servidor de produção, que pode manter registros de acesso próprios.

## O que foi medido

| Tema | Resultado medido |
|---|---|
| Texto digitado, CEP e coordenadas | Em todos os cenários com CEP de equipamento público (três CEPs) e com mensagem e CEP fictícios, houve **0 ocorrências** do texto, do CEP ou das coordenadas do CEP em URL, cabeçalho ou corpo de requisição. |
| Métodos | Nenhuma requisição diferente de GET e nenhuma com corpo. |
| Cookies e Referer | Nenhuma requisição externa concluída levou `Cookie`; nenhuma levou `Referer` (a página usa `referrer` igual a `no-referrer`). |
| Armazenamento | `localStorage`, `sessionStorage`, IndexedDB, Cache Storage e Service Workers terminaram vazios, inclusive depois de recarregar a página. |
| Caixa de imagens de mapa desmarcada (padrão atual dos dois mapas) | **0 requisições externas** ao abrir a página, digitar o CEP e recarregar. |
| Caixa de imagens marcada | Saem pedidos `GET` de imagens de mapa (tiles) à Esri (mapa de serviços da página inicial) ou ao OpenStreetMap (mapa "perto de mim"). Nesses pedidos saem o endereço IP, o navegador (user-agent) e a região do mapa vista, pelos números z/x/y dos tiles. |
| Região dos tiles no mapa de serviços (Esri) | A região pedida foi a mesma para os três CEPs testados: depois de digitar o CEP o mapa enquadra a rede de serviços inteira (zoom 11, cerca de 108 km por 72 km). Só depois de zoom e deslocamento feitos pelo script a região encolhe (menor retângulo observado: cerca de 1,1 km por 2,3 km, zoom 15). |
| Região dos tiles no mapa "perto de mim" (OpenStreetMap) | Depende do CEP: zoom 12 (cerca de 45 km por 27 km) ou zoom 11 (cerca de 108 km por 54 km) no enquadramento inicial. |

## O que isto não afirma

- Que "nada sai do aparelho": com a caixa marcada saem pedidos de tiles, com IP e user-agent.
- Que o resultado vale para outros navegadores ou redes, ou para o servidor de hospedagem.
- Que a região dos tiles não revele nada: ela mostra a área do mapa que a pessoa estava vendo, não o CEP.

Histórico: uma auditoria anterior, de quando a caixa de imagens do mapa de serviços vinha marcada por padrão, registrou 72 pedidos de tiles ao abrir a página inicial; a decisão de desmarcar a caixa por padrão eliminou esses pedidos.
