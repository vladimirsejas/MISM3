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

1. **Rolagem horizontal no celular — CORRIGIDA.** A tabela "Cobertura das coordenadas dos equipamentos" (`.mt-tabela`) tinha 469 px de largura em tela de 375 px e alargava a página inteira para 504 px. **Corrigido no commit `c534542` da PR #75:** as tabelas viram lista em tela estreita e o texto longo quebra linha. A medição registrada posteriormente em 1280, 375 e 320 px não identificou rolagem horizontal.
2. **Aviso D4 — CORRIGIDO.** Os 17 setores pequenos recebem contorno tracejado, aparecem na legenda e exibem aviso no detalhe; a ressalva da página registra a decisão D4. Correção incorporada no commit `c534542` da PR #75.
3. **Texto de `v0001` e `v0002` — CORRIGIDO.** O texto agora registra `V0001` como total de pessoas e `V0002` como total de domicílios, inclusive coletivos e não ocupados, conforme o dicionário dos agregados preliminares do IBGE. A correção está no commit `c534542` da PR #75. **Permanece uma ressalva documental:** falta confirmar que a malha utilizada pertence à mesma divulgação dos agregados preliminares.
4. **Navegação por teclado — IMPLEMENTADA, AGUARDANDO MEDIÇÃO.** O código da PR #75 implementa um único ponto de Tab no mapa (roving tabindex), setas para navegar entre setores, Home e End, e Enter e Espaço para abrir o detalhe. A lista "Detalhar um setor" permanece como alternativa. A implementação ainda aguarda medição específica; não declarar o comportamento como validado. Leitor de tela não testado.
5. **Destaque de foco e contraste — IMPLEMENTADOS, AGUARDANDO MEDIÇÃO.** As cores de preenchimento dos indicadores permanecem inalteradas. O foco do teclado usa um anel duplo, branco por fora e escuro por dentro, para criar separação visual sobre preenchimentos claros e escuros. Os valores de contraste registrados acima são a medição histórica das cores de preenchimento contra o fundo do mapa; **não constituem medição do novo anel de foco**. A razão de contraste do destaque contra as cores dos cinco indicadores e o fundo vizinho ainda precisa ser medida no navegador. Não declarar atendimento à meta de 3:1 antes dessa medição. Também não foi testada a leitura por pessoas com daltonismo.
6. **Mapa sem zoom nem deslocamento.** A área urbana concentra os 96 pontos de equipamento em poucos pixels, e em tela de celular os pontos se sobrepõem. Não há controle de aproximação. **Continua aberto.**
7. **Caixas de marcação de 18×18 px.** O alvo de toque efetivo é o rótulo inteiro (altura mínima de 44 px no CSS); só o quadrado em si mede 18 px. **Continua aberto** (o alvo de toque efetivo é o rótulo).
8. **Layout de computador.** Com o painel "Detalhe do setor" vazio, a coluna da direita fica com grande espaço em branco entre "Detalhe" e "Resumo". **Continua aberto.**

## O que não foi verificado

- Celular físico, Safari, Firefox, leitor de tela, zoom do navegador a 200%, rotação de tela.
- Desempenho em aparelho de pouca memória (408 polígonos em SVG).
- Se a página, ao ser ligada ao menu, mantém a mesma política de conteúdo (hoje ela não tem link no menu).

## Atualização de 06/11/2026

Os itens 1, 2 e 3 estão **corrigidos no commit `c534542` da PR #75**. A navegação por teclado (item 4) e o anel duplo de foco (item 5) estão **implementados, aguardando medição**; ainda não há validação registrada dessas duas melhorias. Permanecem como pendências o zoom do mapa (item 6), o tamanho do quadrado das caixas (item 7) e o espaço em branco no computador (item 8). Esta atualização altera somente este documento; as medições originais da tabela acima são anteriores às correções.

## Conclusão factual

As medições originais registradas nesta auditoria confirmaram ausência de requisições externas, gravação no navegador e dados pessoais, mas identificaram rolagem horizontal no celular. Posteriormente, os itens 1 a 3 foram corrigidos no commit `c534542` da PR #75. A navegação por teclado e o destaque duplo de foco estão implementados, porém aguardam medição. O zoom do mapa permanece pendente, assim como os itens 7 e 8. Esta conclusão não substitui uma nova rodada de testes.
