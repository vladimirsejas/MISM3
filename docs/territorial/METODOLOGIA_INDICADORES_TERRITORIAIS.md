# Metodologia dos indicadores territoriais do MISM3

## 1. Escopo

Este documento especifica os indicadores propostos para a versão inicial do mapa territorial do MISM3. Distingue os componentes já observados nos arquivos atuais das definições que ainda dependem de validação ou implementação.

A unidade estatística principal é o setor censitário do IBGE. Os equipamentos são pontos institucionais. Não são utilizados CEP residencial, endereço de paciente, estudante ou família, nem registros individuais.

## 2. Fontes identificadas no repositório

- `web/dados/setores.geojson`: malha municipal de setores censitários e atributos agregados.
- `web/dados/territorio.json`: indicadores territoriais já calculados.
- `web/dados/exposicao_distancia.json`: resultados existentes de distância em dois cenários de localização.
- `catalogo/servicos_manuais.csv`: catálogo de serviços institucionais.
- `web/dados/escolas_municipais.json`: fonte consolidada das 68 escolas, com método, precisão, fonte e raio da localização operacional.
- IBGE, *Censo Demográfico 2022 — Agregados por Setores Censitários*, Nota metodológica n. 06: V0001 (total de pessoas) e V0002 (total de domicílios, incluindo particulares e coletivos). https://biblioteca.ibge.gov.br/visualizacao/livros/liv102136.pdf
- `catalogo/inep_escolas.csv`: correspondência de escolas com registros do INEP.
- `catalogo/localizacao_registro.csv`: proveniência de coordenadas e outros campos de localização.
- `pipeline/territorio.py`, `pipeline/analise_territorial.py` e `pipeline/exposicao_distancia.py`: procedimentos de cálculo existentes.

A leitura de `web/dados/setores.geojson` confirmou 408 feições. A Nota metodológica n. 06 do IBGE confirma `V0001` como total de pessoas e `V0002` como total de domicílios, incluindo particulares e coletivos.

## 3. Indicadores da versão 1

### Indicador 1 — População agregada por setor

**Definição:** total de pessoas associado a cada setor censitário.

**Fórmula:** soma da variável de população publicada para o setor, conforme definição do dicionário oficial da fonte.

**Unidade:** pessoas por setor.

**Fonte:** malha de setores censitários do IBGE, Censo 2022, representada em `web/dados/setores.geojson`.

**Situação:** já existe atributo `pessoas` no GeoJSON. A definição oficial está confirmada: `V0001` corresponde ao total de pessoas.

**Limitações:** valor agregado, não localização individual; não informa necessidade, renda, saúde ou utilização de serviços.

### Indicador 2 — Densidade populacional

**Definição:** população do setor dividida pela área geográfica do setor.

**Fórmula:**

`densidade_i = população_i / área_i`

**Unidade:** habitantes por quilômetro quadrado (hab/km²).

**Fonte:** população de `web/dados/setores.geojson`; geometria do setor; cálculo já descrito em `pipeline/territorio.py` e resultados em `web/dados/territorio.json`.

**Limitações:** depende da qualidade da geometria e da projeção/medição de área. Densidade não é sinônimo de vulnerabilidade, demanda ou necessidade de serviço.

### Indicador 3 — Domicílios agregados

**Definição:** quantidade agregada de domicílios por setor.

**Fórmula:** valor da variável de domicílios do setor, conforme dicionário da fonte.

**Unidade:** domicílios por setor.

**Fonte:** atributo `domicilios` de `web/dados/setores.geojson`; origem indicada como campo `v0002` em `pipeline/setores.py).

**Limitações:** não identifica endereços nem moradores. `V0002` soma domicílios particulares permanentes ocupados, vagos e de uso ocasional, particulares improvisados e coletivos, com ou sem morador; não representa somente domicílios ocupados nem famílias.

### Indicador 4 — Equipamentos por categoria e setor

**Definição:** contagem de equipamentos institucionais georreferenciados cuja posição física está dentro do polígono do setor censitário.

**Fórmula:** contagem de pontos institucionais elegíveis associados ao setor por operação espacial ponto-no-polígono, com regra documentada para pontos na fronteira.

**Unidade:** equipamentos por categoria e setor.

**Fonte:** coordenadas institucionais em `catalogo/servicos_manuais.csv` e proveniência em `catalogo/localizacao_registro.csv`; setores em `web/dados/setores.geojson`.

**Limitações:** mede localização física do equipamento, não área de atendimento, capacidade, vagas, demanda, qualidade ou utilização. Um equipamento localizado em um setor pode atender outros setores. Equipamentos sem coordenada elegível devem permanecer contabilizados como localização pendente, não ser descartados silenciosamente.

**Linguagem permitida:** “serviço localizado no setor” e “oferta cadastrada”.

### Indicador 5 — Distância em linha reta até o equipamento mais próximo

**Definição:** distância geodésica entre um ponto representativo do setor e o equipamento institucional elegível mais próximo de uma categoria.

**Fórmula de Haversine:**

`a = sen²(Δφ/2) + cos(φ1) cos(φ2) sen²(Δλ/2)`

`d = 2R · arcsen(√a)`

Em que `φ` representa latitude em radianos, `λ` representa longitude em radianos, `Δφ` e `Δλ` são as diferenças entre os pontos, e `R` é o raio médio terrestre adotado no cálculo. A implementação existente em `pipeline/analise_territorial.py` usa `R = 6371,0088 km`.

**Unidade:** quilômetros.

**Fonte:** geometria dos setores em `web/dados/setores.geojson`; coordenadas institucionais elegíveis do catálogo e seus registros de proveniência; função de distância em `pipeline/analise_territorial.py` e processamento em `pipeline/exposicao_distancia.py`.

**Ponto representativo:** o código preserva o centroide matemático quando está dentro do setor. Nos nove casos em que o centroide ficava fora do polígono, utiliza um ponto interno corrigido; esse ponto não é denominado centroide matemático. Os 399 centroides internos são preservados.

**Incerteza espacial:** quando o equipamento tem raio operacional `r`, publicar o envelope geométrico `d_min = max(0, d-r)` e `d_max = d+r`. Para várias referências, o limite inferior é o menor `d_min` e o superior é o menor `d_max`. O raio do CEP é parâmetro operacional derivado da dispersão dos endereços CNEFE, não campo oficial do IBGE nem intervalo de confiança. Coordenadas individuais com proveniência registrada não recebem margem artificial. Os seis CRAS/UBS sem proveniência no catálogo não podem usar as coordenadas brutas: no cenário com CEP, recorrem ao centro do CEP institucional e ao raio do índice. Faixas sobrepostas não permitem ordenar com segurança qual equipamento é mais próximo.

**Limitações:** não representa percurso por ruas, tempo de viagem, transporte, barreiras físicas, capacidade, horário, elegibilidade ou atendimento efetivo. Se faltarem coordenadas de equipamentos, a distância até o ponto conhecido mais próximo pode ficar superestimada. A cobertura de localização deve acompanhar todo resultado.

**Linguagem permitida:** “distância em linha reta”.

### Indicador 6 — Qualidade e cobertura das coordenadas

**Definição:** proporção de equipamentos cadastrados de uma categoria com localização elegível, acompanhada da classificação de proveniência e confiança.

**Fórmula:**

`cobertura = equipamentos com coordenada elegível / equipamentos cadastrados × 100`

**Unidade:** quantidade de equipamentos e percentual por categoria.

**Fonte:** catálogo e registro de proveniência em `catalogo/servicos_manuais.csv` e `catalogo/localizacao_registro.csv`; cobertura já registrada em `web/dados/exposicao_distancia.json`.

**Limitações:** cobertura não significa precisão uniforme. Coordenadas de métodos diferentes devem ser identificadas separadamente. A coordenada aproximada pelo centro do CEP não deve ser apresentada como equivalente a uma coordenada institucional conferida.

**Situação da proveniência:** entre os 28 CRAS/UBS, 22 têm método, confiança (11 alta e 11 média) e data de aplicação registrados em `localizacao_registro.csv`. Os outros 6 não têm registro explícito de proveniência. Suas coordenadas brutas do catálogo são excluídas dos cenários de coordenadas individuais; quando o CEP institucional está disponível no índice, a posição aproximada é usada com o respectivo raio. Isso não transforma esses seis registros em coordenadas verificadas.

**Linguagem permitida:** “localização pendente”, “coordenada verificada”, “coordenada aproximada” e “cobertura das coordenadas”.

## 4. Cenários de localização por CEP institucional

O arquivo `web/dados/exposicao_distancia.json` registra dois cenários: `coordenadas_do_catalogo` e `com_centro_do_cep`. O primeiro aceita coordenadas apenas quando latitude, longitude, método e confiança coincidem com `localizacao_registro.csv`. O segundo acrescenta o CEP cadastral do próprio equipamento quando não há proveniência suficiente para aceitar a coordenada bruta. Não se trata de CEP de paciente, estudante ou família.

No arquivo atual, as coberturas são:

| Categoria | Coordenadas do catálogo | Com centro do CEP |
|---|---:|---:|
| CRAS | 4/6 | 6/6 |
| UBS/USF | 18/22 | 22/22 |
| Escolas | 33/68 | 68/68 |

Essas são as coberturas esperadas pela aplicação da regra ao registro atual. Os JSONs derivados (`territorio.json`, `analise_territorial.json`, `exposicao_distancia.json` e `indicadores_territoriais.json`) ainda precisam ser regenerados e validados na execução completa; até lá, não devem ser tratados como saídas atualizadas.

## 5. Auditoria geométrica do ponto representativo

**Status da correção:** implementada no código. Dos 408 setores, 399 mantêm exatamente o centroide matemático original porque já estavam dentro do polígono. Nos nove restantes, o ponto externo é substituído por um ponto interno representativo.

O método base continua calculando o centroide do maior componente escolhido pelo número de vértices do anel externo. A correção não o transforma em centroide ponderado pela área. Quando o centroide cai fora, `ponto_interno` procura candidatos em linhas horizontais internas, desconta os buracos e seleciona o candidato de menor distância geodésica ao centroide original. O resultado é um ponto interno, não um centroide matemático.

**Setores corrigidos:**

- 354390705000026
- 354390705000165
- 354390705000339
- 354390705000432
- 354390705000460
- 354390705000524
- 354390705000529
- 354390705000530
- 354390705000541

A auditoria de sensibilidade anterior registrou deslocamento máximo de aproximadamente 61,546 m e impacto máximo de aproximadamente 54,149 m nas distâncias. Os testes automatizados foram preparados para confirmar que a correção permanece abaixo de 62 m e que a alteração absoluta das distâncias fica abaixo de 55 m.

A correção não altera nem recorta a geometria-fonte. Ela muda apenas o ponto usado como origem da distância. O ponto representativo não mede ocupação interna, acessibilidade efetiva nem distribuição da população dentro do setor.

**Validação pendente:** regenerar os JSONs dependentes e executar integralmente os testes na versão final da branch.
A auditoria não mede ocupação interna do setor nem acessibilidade efetiva.

## 6. Contrato metodológico comum aos indicadores

| Regra | Aplicação |
|---|---|
| Unidade de análise | População e domicílios agregados; nunca pessoas individualizadas |
| Unidade geográfica | Setor censitário, bairro ou município, com escala explicitada |
| Localização de equipamentos | Coordenada individual do catálogo ou referência aproximada identificada pela origem |
| Distância | Em linha reta, quando essa for a métrica disponível; informar ponto de origem e destino |
| Incerteza | Preservada e divulgada; não converter aproximação em precisão aparente |
| Matrículas | Não representam vagas disponíveis |
| Proximidade | Não comprova acessibilidade, atendimento ou elegibilidade |
| Vulnerabilidade | Não pode ser presumida apenas pela distância ou densidade |
| Privacidade | Não identificar nem inferir informações sobre indivíduos ou domicílios |

A agregação por setor não garante anonimato por si só. Antes de publicar, avaliar setores pequenos, categorias raras, cruzamentos específicos e a possibilidade de deduzir valores por diferenças entre totais e subtotais. A regra de supressão ou agregação precisa ser definida e aprovada antes de divulgar indicadores sensíveis; o aviso atual de cautela não equivale a uma proteção estatística.

## 7. Arquitetura em três camadas

1. **Dados territoriais e populacionais:** malha oficial, geometrias dos setores, população agregada, domicílios e correspondências territoriais.
2. **Equipamentos e qualidade geográfica:** escolas, UBS/USF e CRAS; coordenadas; método de localização; fonte; data; precisão; raio ou incerteza quando existente.
3. **Indicadores territoriais:** distâncias estimadas, distribuição de equipamentos e indicadores agregados por setor, bairro e município.

As camadas devem manter proveniência explícita. Alterações na localização de um equipamento devem permitir reconstruir a camada de indicadores sem alterar a fonte populacional; alterações na malha ou nos dados populacionais devem ser rastreáveis separadamente.

## 8. Linguagem de interpretação



### Expressões permitidas
- “distância em linha reta”;
- “serviço localizado no setor”;
- “oferta cadastrada”;
- “localização pendente”;
- “coordenada aproximada”;
- “cobertura das coordenadas”;
- “população residente estimada/agregada no setor”, conforme a fonte.

### Expressões proibidas com base apenas nestes indicadores
- “população desassistida”;
- “falta de cobertura”;
- “vulnerabilidade”;
- “população sem acesso”;
- “serviço não atende o setor”;
- “tempo de deslocamento”;
- “acessibilidade efetiva”.

A presença ou ausência de pontos dentro de um setor não determina a área de atendimento de um equipamento.

## 9. Regras de qualidade e publicação

- Todo indicador deve registrar fonte, ano, data de geração, unidade, fórmula e limitações.
- Toda coordenada institucional deve possuir método, confiança e data de verificação.
- Categorias com cobertura incompleta devem exibir a cobertura junto do resultado.
- Não calcular nem publicar distância quando a cobertura for insuficiente para interpretação, segundo regra previamente documentada.
- Não misturar cenários de localização sem rotulagem.
- Não publicar dados individuais ou cruzamentos que permitam reidentificação.
- Valores de setores pequenos devem passar pelas regras de supressão da política de privacidade.

## 10. Situação nesta fase

A malha contém 408 setores. O centroide matemático foi preservado nos 399 setores em que já era interno; nos nove casos externos, o cálculo passou a usar ponto interno representativo. A auditoria topológica preliminar encontrou seis pares de setores com interseção acima de 1.000 m² e aproximadamente 0,104348 km² de área setorial fora do limite municipal IBGE 2022. Esses resíduos permanecem registrados para investigação; não houve recorte automático. O cálculo geodésico GRS80 da área setorial é aproximadamente 498,396 km², frente a 498,422 km² no atributo do limite municipal IBGE 2022.
A política D4 suprime população, domicílios, densidade, pessoas por domicílio e distâncias nos 17 setores abaixo dos limiares de cautela; agregados de bairros afetados e totais municipais sensíveis também são omitidos. Para CRAS/UBS, 22 de 28 coordenadas têm proveniência registrada. As outras seis coordenadas brutas não são mais aceitas: o cenário com CEP utiliza referência institucional aproximada e raio CNEFE quando disponível.
Os JSONs derivados ainda precisam ser regenerados com as regras atualizadas e conferidos por execução integral dos testes. Os workflows consultados até esta revisão correspondem a commits anteriores ao último conjunto de alterações; portanto, não se declara validação final nem publicação atualizada.
