# Auditoria completa do mapa territorial v1 (técnica, privacidade e funcionamento)

**Data:** 06/11/2026. **Escopo:** somente medição e registro. Nenhum arquivo de `web/`, `pipeline/`, `catalogo/`, `dados/`, `avaliacao/`, `protocolo/` nem modelo foi alterado. Complementa o diagnóstico da etapa 1 do [plano](PLANO_IMPLEMENTACAO_MAPA_TERRITORIAL.md); a política de privacidade está em [POLITICA_PRIVACIDADE_DADOS_TERRITORIAIS.md](POLITICA_PRIVACIDADE_DADOS_TERRITORIAIS.md).

## Como foi medido

- Objeto: `web/mapa-territorial.html`, `.js` e `.css` do ramo `mapa-territorial-v1` (PR #75), **mesclados em área de trabalho sobre a `main` de 06/11/2026 (commit `22bdc74`), sem commit** (merge sem conflito).
- Ferramenta: Playwright com Chromium (sem janela), servidor estático local (`127.0.0.1`) servindo `web/`. Três tamanhos de tela: computador 1280×800; celular 375×812 (toque, emulação de celular); celular pequeno 320×640.
- Uma passada por tamanho. Não foram usados celular físico, outros navegadores nem leitor de tela.

## Resultados

| Verificação | Computador | Celular 375 | Celular 320 |
|---|---|---|---|
| Requisições na carga | 6 (página, 2 CSS, 1 JS, 2 JSON), todas locais | igual | igual |
| Requisições externas | 0 | 0 | 0 |
| Requisições diferentes de GET | 0 | 0 | 0 |
| Erros ou avisos no console, requisições falhas | nenhum | nenhum | nenhum |
| Setores desenhados | 408 | 408 | 408 |
| Combinações indicador × categoria × cenário percorridas | 13, todas pintam o mapa e atualizam a legenda | 13 | 13 |
| Detalhe pelo clique e pela lista de setores | funciona | funciona | funciona |
| Cookies, localStorage, sessionStorage, IndexedDB, Cache Storage, Service Workers | vazios | vazios | vazios |
| Largura da página contra a tela (rolagem horizontal) | 1280 de 1280 (sem rolagem) | **504 de 375 (rolagem horizontal)** | **504 de 320 (rolagem horizontal)** |
| Texto sem contraste mínimo (WCAG 2.x, 4,5:1 / 3:1 para texto grande, cores computadas) | nenhum reprovado | nenhum | nenhum |

Arquivos abertos pela página: `dados/indicadores_territoriais.json` e `dados/setores.geojson`.

## Achados que exigem decisão ou correção

1. **Rolagem horizontal no celular.** A tabela "Cobertura das coordenadas dos equipamentos" (`.mt-tabela`) tem 469 px de largura em tela de 375 px e alarga a página inteira para 504 px. Em celular real, isso reduz o zoom de toda a página. Não foi corrigido (fora do escopo desta etapa). **Corrigido na PR #75** (tabelas viram lista em tela estreita e o texto longo quebra linha): sem rolagem horizontal em 1280, 375 e 320 px, medido em 06/11/2026 sobre o commit `c527dc0`.
2. **Setores pequenos sem aviso.** O texto "população muito pequena, interprete com cautela" da decisão D4 **não aparece** na página; a ressalva da tela ainda diz que a regra numérica "depende de decisão do autor". **Corrigido na PR #75:** os 17 setores têm contorno tracejado, item na legenda e aviso no detalhe; a ressalva cita a D4.
3. **Texto sobre `v0001` e `v0002` desatualizado.** A tela diz "significado a confirmar no dicionário do IBGE". O dicionário oficial dos agregados preliminares do IBGE (`Dicionario_de_dados_agregados_preliminares.xlsx`) define `V0001` como "Total de pessoas" e `V0002` como "Total de Domicílios (DPPO + DPPV + DPPUO + DPIO + DCCM + DCSM)", que inclui domicílios não ocupados e coletivos. Falta confirmar que a malha usada é da mesma divulgação. **Corrigido na PR #75:** o texto agora traz o significado oficial; continua pendente confirmar que a malha usada é da mesma divulgação dos agregados preliminares.
4. **Setores não são alcançáveis pelo teclado.** Os 408 polígonos não têm `tabindex`. A alternativa é a lista "Detalhar um setor" (409 opções), que funciona. Ordem de Tab medida: link "Pular", link "Voltar", indicador, os dois marcadores, lista de setores. Todos mostram contorno de foco de 3 px. **Corrigido na PR #75** (commit `6b850c0`): um único ponto de Tab no mapa (roving tabindex), setas para o setor vizinho, Home e End, Enter e Espaço abrem o detalhe; medido no Chromium sem janela. Não testado com leitor de tela.
5. **Cor mais clara do mapa quase não se distingue do fundo.** Contraste da cor contra o fundo do mapa (`#fffaf7`): classe 1 `#fbe9e6` = 1,13:1; `#f2c4bd` = 1,51:1; `#e8a8a2` = 1,92:1; `#e08e8e` = 2,40:1; `#b9556a` = 4,43:1; `#7a2b37` = 9,10:1; "sem valor" `#d9d9d9` = 1,36:1. O critério de 3:1 para elementos gráficos (WCAG 1.4.11) não é atingido pelas quatro cores mais claras. Não foi testada a leitura por pessoas com daltonismo. **Tratado na PR #75, com ressalva:** as cores de preenchimento não foram alteradas (continuam de 1,13:1 a 2,40:1 contra o fundo nas quatro mais claras). Cada setor agora tem contorno escuro (`#51413f`, 9,31:1 contra o fundo do mapa) que delimita a forma, e o foco do teclado usa anel duplo, branco por fora e escuro por dentro: contra cada uma das 6 cores de preenchimento, o melhor dos dois traços tem de 4,59:1 a 16,10:1 e os dois traços têm 18,88:1 entre si. Individualmente, o traço escuro contra `#7a2b37` mede 2,00:1 e o branco contra `#fbe9e6` mede 1,17:1; o par garante a visibilidade, não cada traço isolado.
6. **Mapa sem zoom nem deslocamento.** A área urbana concentra os 96 pontos de equipamento em poucos pixels, e em tela de celular os pontos se sobrepõem. Não há controle de aproximação. **Continua aberto.**
7. **Caixas de marcação de 18×18 px.** O alvo de toque efetivo é o rótulo inteiro (altura mínima de 44 px no CSS); só o quadrado em si mede 18 px. **Continua aberto** (o alvo de toque efetivo é o rótulo).
8. **Layout de computador.** Com o painel "Detalhe do setor" vazio, a coluna da direita fica com grande espaço em branco entre "Detalhe" e "Resumo". **Continua aberto.**

## O que não foi verificado

- Celular físico, Safari, Firefox, leitor de tela, zoom do navegador a 200%, rotação de tela.
- Desempenho em aparelho de pouca memória (408 polígonos em SVG).
- Se a página, ao ser ligada ao menu, mantém a mesma política de conteúdo (hoje ela não tem link no menu).

## Atualização de 06/11/2026

Os itens 1 a 5 foram tratados na PR #75 (ramo `mapa-territorial-v1`, topo `c527dc0` quando medido). Ficam abertos o zoom do mapa (6), o tamanho do quadrado das caixas (7) e o espaço em branco no computador (8). Esta atualização só altera este texto; as medições originais da tabela acima foram feitas antes das correções.

## Conclusão factual

Nas medições acima, a página não faz requisição externa, não grava nada no navegador, não exibe dado de pessoa nem endereço, carrega só dois arquivos de dados locais e funciona em computador. No celular, apresenta rolagem horizontal. Os pontos 2 a 6 acima são pendências antes de qualquer publicação.
