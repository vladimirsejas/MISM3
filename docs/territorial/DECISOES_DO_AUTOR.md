# Decisões do autor — mapa territorial do MISM3

**Data das decisões:** 06/11/2026  
**Escopo:** mapa territorial do MISM3. Estas decisões não se aplicam ao MISM2 nem a outros projetos.

## 1. Decisões registradas

**D1.** O mapa territorial usa somente dados públicos, agregados e de locais (setores censitários, equipamentos públicos). Nenhum dado de pessoa, nenhum CEP ou endereço de paciente, estudante, família ou usuária.

**D2.** Sobre o CEP: Opção A. O cenário `com_centro_do_cep` (CEP institucional de escola, dado público de equipamento) permanece, rotulado como análise de sensibilidade, ao lado do cenário `coordenadas_do_catalogo`. Nada é removido: nem `pipeline/indice_cep.py`, nem `web/dados/cep_indice.json`, nem a consulta por CEP do site.

**D3.** Nenhum código, dado gerado ou arquivo de `web/` ou `pipeline/` será alterado nesta fase. O código da Fase 2 só começa depois da etiqueta `v1.0-pesquisa` e em branch própria.

## 2. Fundamentação documental da decisão D2

A decisão mantém o cenário com centro do CEP porque o CEP empregado é o CEP cadastral do próprio equipamento público, como uma escola, e não o CEP de uma pessoa ou residência. A localização resultante é aproximada e deve permanecer identificada como tal; não equivale a uma coordenada institucional conferida.

Os valores abaixo foram lidos diretamente de `web/dados/exposicao_distancia.json`, sem recálculo nesta fase:

| Categoria | `coordenadas_do_catalogo` | `com_centro_do_cep` |
|---|---:|---:|
| CRAS | 6/6 | 6/6 |
| UBS/USF | 22/22 | 22/22 |
| Escolas | 33/68 | 68/68 |

A cobertura escolar aumenta no cenário aproximado porque equipamentos sem coordenadas próprias no catálogo podem ser posicionados pelo centro associado ao CEP institucional. Essa diferença é precisamente o motivo para manter os cenários lado a lado como análise de sensibilidade, e não para apresentar a localização aproximada como se tivesse a mesma precisão da coordenada do catálogo.

O arquivo `web/dados/analise_territorial.json` registra cobertura de escolas de 68/68, usando a localização aproximada pelo centro do CEP, conforme o aviso em seus metadados. Esse resultado não substitui a comparação explícita dos dois cenários em `exposicao_distancia.json`.

## 3. O que D2 não muda

A decisão D2:

- não autoriza CEP residencial, endereço residencial ou localização de pacientes, estudantes, famílias ou usuárias;
- não altera a finalidade nem a unidade estatística do mapa: setores censitários e equipamentos institucionais;
- não transforma o centro do CEP em coordenada exata ou verificada;
- não altera os valores já gravados nos JSONs e não solicita recálculo nesta fase;
- não remove, desativa ou modifica `pipeline/indice_cep.py`, `web/dados/cep_indice.json), nem a consulta por CEP existente no site;
- não autoriza mudanças em `pipeline/`, `web/`, `catalogo/` ou dados gerados;
- não equivale a uma conclusão de anonimização ou de ausência de risco; a política de privacidade e a proposta de supressão/agregação continuam aplicáveis.

## 4. Registro das correções documentais desta PR

As linhas abaixo foram comparadas com `web/dados/exposicao_distancia.json` e `web/dados/analise_territorial.json`. Somente as afirmações contraditas pelos arquivos foram alteradas.

### `docs/estado_do_projeto.md`

**Antes**

`| Distância até o serviço mais próximo | CRAS 6 de 6, UBS e USF 22 de 22 e escolas 59 de 68 (cenário com o centro do CEP) | Coordenadas conferidas visualmente em 04/11/2026; trava: exige 70% dos serviços localizados | Distância em linha reta; as 9 escolas sem localização ficam fora |`

**Depois**

`| Distância até o serviço mais próximo | CRAS 6/6 e UBS/USF 22/22 nos dois cenários; escolas 33/68 em coordenadas_do_catalogo e 68/68 em com_centro_do_cep (análise de sensibilidade com CEP institucional) | web/dados/exposicao_distancia.json (gerado em 05/11/2026) | Distância em linha reta; a localização pelo centro do CEP é aproximada e deve permanecer identificada como análise de sensibilidade |`

**Fonte de conferência:** `web/dados/exposicao_distancia.json`, metadados `gerado_em` e cobertura por categoria nos dois cenários.

### `docs/painel_e_analise_territorial.md`

**Antes — cabeçalho**

`Reescrito em 04/11/2026. Estado: tela pronta; a análise ainda não foi gerada.`

**Depois**

`Reescrito em 06/11/2026. Estado: tela pronta; a análise territorial está gerada em web/dados/analise_territorial.json e web/dados/exposicao_distancia.json (metadados de geração: 05/11/2026).`

**Fonte de conferência:** metadados `gerado_em` dos dois JSONs.

**Antes — linha de cobertura**

`- Gerada em 04/11/2026 (28 bairros; CRAS 6 de 6, UBS e USF 22 de 22, escolas 59 de 68 no cenário com o centro do CEP). O script se recusa a escrever sem coordenadas suficientes, em vez de inventar números.`

**Depois**

`- Gerada em 05/11/2026 (28 bairros; no arquivo web/dados/analise_territorial.json, CRAS 6/6, UBS 22/22 e escolas 68/68, com localização de escolas aproximada pelo centro do CEP). No arquivo web/dados/exposicao_distancia.json, a análise de sensibilidade registra escolas 33/68 em coordenadas_do_catalogo e 68/68 em com_centro_do_cep; CRAS 6/6 e UBS 22/22 nos dois cenários. O script se recusa a escrever sem coordenadas suficientes, em vez de inventar números.`

**Fontes de conferência:** `web/dados/analise_territorial.json` (metadados, cobertura dos serviços e aviso) e `web/dados/exposicao_distancia.json` (cobertura dos dois cenários).

### Afirmações não verificadas

Não foram alteradas outras afirmações históricas ou operacionais dos documentos, pois não foram objeto desta correção ou não podem ser confirmadas exclusivamente pelos dois JSONs indicados. Em particular, a execução atual do bloqueio do script, a conferência visual de coordenadas e o funcionamento da interface permanecem **não verificados** nesta etapa documental.

## 5. Limites éticos

Este registro não conclui que o projeto esteja dispensado de apreciação ética. O enquadramento na Resolução CNS 510/2016 depende do desenho efetivo da pesquisa, dos dados e dos procedimentos utilizados.
