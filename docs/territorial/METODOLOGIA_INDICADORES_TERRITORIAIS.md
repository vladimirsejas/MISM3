# Metodologia dos indicadores territoriais do MISM3

## 1. Escopo

Este documento especifica os indicadores propostos para a versão inicial do mapa territorial do MISM3. Distingue os componentes já observados nos arquivos atuais das definições que ainda dependem de validação ou implementação.

A unidade estatística principal é o setor censitário do IBGE. Os equipamentos são pontos institucionais. Não são utilizados CEP residencial, endereço de paciente, estudante ou família, nem registros individuais.

## 2. Fontes identificadas no repositório

- `web/dados/setores.geojson`: malha municipal de setores censitários e atributos agregados.
- `web/dados/territorio.json`: indicadores territoriais já calculados.
- `web/dados/exposicao_distancia.json`: resultados existentes de distância em dois cenários de localização.
- `catalogo/servicos_manuais.csv`: catálogo de serviços institucionais.
- `catalogo/inep_escolas.csv`: correspondência de escolas com registros do INEP.
- `catalogo/localizacao_registro.csv`: proveniência de coordenadas e outros campos de localização.
- `pipeline/territorio.py`, `pipeline/analise_territorial.py` e `pipeline/exposicao_distancia.py`: procedimentos de cálculo existentes.

A leitura de `web/dados/setores.geojson` confirmou 408 feições. Seus metadados registram `v0001` como pessoas e `v0002` como domicílios, mas `pipeline/setores.py` ressalva que os significados devem ser confirmados no dicionário oficial do IBGE.

## 3. Indicadores da versão 1

### Indicador 1 — População agregada por setor

**Definição:** total de pessoas associado a cada setor censitário.

**Fórmula:** soma da variável de população publicada para o setor, conforme definição do dicionário oficial da fonte.

**Unidade:** pessoas por setor.

**Fonte:** malha de setores censitários do IBGE, Censo 2022, representada em `web/dados/setores.geojson`.

**Situação:** já existe atributo `pessoas` no GeoJSON. A definição oficial da variável de origem deve ser confirmada no dicionário do IBGE antes de ampliar a interpretação.

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

**Limitações:** não identifica endereços nem moradores. O significado exato de `v0002` deve ser confirmado no dicionário oficial do IBGE.

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

**Ponto representativo:** os cálculos atuais utilizam o centroide geométrico calculado pelo código. A análise de sensibilidade entre centroide geométrico e ponto interno representativo é proposta na seção 5 e ainda não foi executada.

**Limitações:** não representa percurso por ruas, tempo de viagem, transporte, barreiras físicas, capacidade, horário, elegibilidade ou atendimento efetivo. Se faltarem coordenadas de equipamentos, a distância até o ponto conhecido mais próximo pode ficar superestimada. A cobertura de localização deve acompanhar todo resultado.

**Linguagem permitida:** “distância em linha reta”.

### Indicador 6 — Qualidade e cobertura das coordenadas

**Definição:** proporção de equipamentos cadastrados de uma categoria com localização elegível, acompanhada da classificação de proveniência e confiança.

**Fórmula:**

`cobertura = equipamentos com coordenada elegível / equipamentos cadastrados × 100`

**Unidade:** quantidade de equipamentos e percentual por categoria.

**Fonte:** catálogo e registro de proveniência em `catalogo/servicos_manuais.csv` e `catalogo/localizacao_registro.csv`; cobertura já registrada em `web/dados/exposicao_distancia.json`.

**Limitações:** cobertura não significa precisão uniforme. Coordenadas de métodos diferentes devem ser identificadas separadamente. A coordenada aproximada pelo centro do CEP não deve ser apresentada como equivalente a uma coordenada institucional conferida.

**Linguagem permitida:** “localização pendente”, “coordenada verificada”, “coordenada aproximada” e “cobertura das coordenadas”.

## 4. Cenários de localização por CEP institucional

O arquivo `web/dados/exposicao_distancia.json` registra dois cenários: `coordenadas_do_catalogo` e `com_centro_do_cep`. O segundo utiliza, quando falta latitude/longitude, o CEP do registro do próprio equipamento para obter posição aproximada no índice. Não se trata de CEP de paciente, estudante ou família.

No arquivo atual, as coberturas são:

| Categoria | Coordenadas do catálogo | Com centro do CEP |
|---|---:|---:|
| CRAS | 6/6 | 6/6 |
| UBS/USF | 22/22 | 22/22 |
| Escolas | 33/68 | 68/68 |

Esses valores são lidos do arquivo existente e não foram recalculados nesta fase. A escolha de manter o cenário com CEP institucional como análise de sensibilidade ou retirá-lo é decisão do autor. Ver opções e consequências em `INVENTARIO_TERRITORIAL.md`.

## 5. Análise de sensibilidade proposta: centroide versus ponto interno representativo

**Status: proposta; não executada.**

Os cálculos atuais utilizam o centroide geométrico do setor. Para setores irregulares, o centroide pode ficar fora do polígono ou não representar adequadamente sua ocupação espacial.

Propõe-se comparar:

1. **Centroide geométrico:** ponto calculado a partir da geometria do polígono.
2. **Ponto interno representativo:** ponto garantidamente localizado dentro do polígono, por exemplo, um ponto sobre a superfície produzido por método geoespacial apropriado.

Procedimento proposto:

- Usar exatamente a mesma malha de setores e o mesmo conjunto aprovado de pontos institucionais nos dois cenários.
- Não usar endereços, CEPs ou coordenadas de pessoas.
- Calcular a distância de cada setor aos mesmos equipamentos em cada cenário.
- Comparar diferenças por setor, categoria e estatísticas agregadas.
- Relatar quantos setores têm centroide fora do polígono.
- Registrar método de geração do ponto interno, sistema de coordenadas e versão das bibliotecas.
- Não escolher o cenário que produza resultado mais favorável; justificar a escolha pela adequação geométrica.
- Identificar o efeito da mudança sobre mediana, percentil 90 e proporções acima dos limiares, quando esses resumos forem utilizados.

A comparação não mede acesso efetivo e não corrige a ausência de coordenadas de equipamentos.

## 6. Linguagem de interpretação

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

## 7. Regras de qualidade e publicação

- Todo indicador deve registrar fonte, ano, data de geração, unidade, fórmula e limitações.
- Toda coordenada institucional deve possuir método, confiança e data de verificação.
- Categorias com cobertura incompleta devem exibir a cobertura junto do resultado.
- Não calcular nem publicar distância quando a cobertura for insuficiente para interpretação, segundo regra previamente documentada.
- Não misturar cenários de localização sem rotulagem.
- Não publicar dados individuais ou cruzamentos que permitam reidentificação.
- Valores de setores pequenos devem passar pelas regras de supressão da política de privacidade.

## 8. Situação nesta fase

Esta fase é exclusivamente documental. Nenhum indicador foi recalculado, nenhuma análise de sensibilidade foi executada, nenhum script foi alterado e nenhum teste foi rodado. Os números de cobertura apresentados são transcrições dos arquivos atuais do repositório.
