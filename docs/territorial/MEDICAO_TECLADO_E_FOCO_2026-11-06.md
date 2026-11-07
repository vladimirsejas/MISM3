# Medição de teclado, foco e alvos de toque — mapa territorial

**Data:** 06/11/2026  
**Base de referência da medição:** implementação da PR #75, commit `4888488cddb7b446b8d971db0e8db676d1d761d5`.  
**Escopo:** registro das medições informadas pelo Claude Code. Este documento complementa, sem alterar, `AUDITORIA_COMPLETA_MAPA_V1.md`.

## Execução geral informada

- 32 arquivos JavaScript verificados, sem falhas.
- Pytest: 251 testes, sem falhas.
- Larguras de 320 px, 375 px e 1280 px: sem rolagem horizontal.
- Requisições externas: 0.
- Erros no console: 0.
- Setores no mapa: 408.
- Navegação do mapa: um único elemento com `tabindex="0"` (roving tabindex).

Esses resultados são o registro da medição anterior fornecida para esta revisão; não representam execução de testes nesta alteração.

## Foco e contraste

O indicador de foco usa dois traços: branco por fora e escuro (`#111`) por dentro. Para cada cor de preenchimento, foi registrada a razão de contraste dos dois traços. O melhor dos dois contrastes fica acima de 4,5:1 em todas as cores da escala.

| Preenchimento | Anel branco | Anel escuro (#111) |
|---|---:|---:|
| `#7a2b37` | 9,42:1 | 2,00:1 |
| `#b9556a` | 4,59:1 | 4,11:1 |
| `#e08e8e` | 2,49:1 | 7,58:1 |
| `#e8a8a2` | 1,99:1 | 9,49:1 |
| `#f2c4bd` | 1,57:1 | 12,05:1 |
| `#fbe9e6` | 1,17:1 | 16,10:1 |

Contraste do traço escuro contra o fundo `#fffaf7`: **18,23:1**.

Na árvore de acessibilidade do Chromium, os setores aparecem com papel `button`, nome contendo o código do setor e descrição contendo bairro e valor.

## Dimensão dos setores e alvos de toque

| Viewport | Menor dimensão de setor | Mediana | Setores abaixo de 44 px |
|---|---:|---:|---:|
| 1280 px | 1,0 px | 7,5 px | 391 de 408 |
| 375 px | — | 3,6 px | 396 de 408 |

A dimensão dos polígonos não constitui alvo de toque adequado em tela pequena. Para interação por toque, a alternativa disponível é a lista **“Detalhar um setor”**.

## Não medido

- Leitor de tela real.
- Celular físico.
- Firefox.
- Safari.
- Desenho renderizado em modo de cores forçadas.

## Limitações conhecidas

- O mapa ainda não oferece zoom.
- Os polígonos são pequenos para toque, especialmente no celular; a lista “Detalhar um setor” é a alternativa de seleção.
- A navegação por setas pode seguir um caminho de ida cuja seta inversa não retorna ao setor de origem. A medição anterior identificou 546 casos desse tipo; a penalidade lateral reduz desvios, mas não resolve a propriedade de ida e volta.

## Ajuste de navegação por setas

A regra anterior escolhia o centroide mais próximo no semiplano da direção. A medição em 408 setores e 1.632 movimentos registrou 548 desvios acima de 60°, 18 saltos para setor a mais de três vezes a distância do vizinho mais próximo, quatro movimentos sem destino e quatro setores inalcançáveis somente pelas setas (`354390705000163`, `354390705000409`, `354390705000501` e `354390710000012`).

A regra ajustada escolhe, entre os setores com projeção positiva na direção, a menor nota:

`projeção na direção + 2 × desvio lateral`

O desvio lateral é o valor absoluto do produto vetorial entre o vetor até o candidato e o vetor da direção. Em medição Node sobre os centroides geométricos do GeoJSON real, o resultado foi de 336 desvios acima de 60° e alcançabilidade dos 408 setores. Quatro movimentos continuam sem destino quando não há candidato no semiplano; os 546 casos de ida e volta continuam como limitação conhecida.

O teste automatizado em `web/tests/mapa_territorial.test.js` inclui um cenário sintético em que o vizinho alinhado vence um candidato diagonal mais próximo em linha reta, e um teste de alcançabilidade usando o GeoJSON local, sem rede.
