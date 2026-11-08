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

**Ponto representativo:** os cálculos atuais utilizam o centroide geométrico calculado pelo código. A análise de sensibilidade entre centroide geométrico e ponto interno representativo é proposta na seção 5 e ainda não foi executada.

**Incerteza espacial:** quando o equipamento tem raio operacional `r`, publicar também o envelope geométrico `d_min = max(0, d-r)` e `d_max = d+r`. Para várias referências, o limite inferior é o menor `d_min` e o superior é o menor `d_max`; a estimativa central continua sendo a menor distância central. O raio do CEP é parâmetro operacional derivado da dispersão dos endereços CNEFE, não campo oficial do IBGE nem intervalo de confiança. Coordenadas individuais não recebem margem artificial. Faixas sobrepostas não permitem ordenar com segurança qual equipamento é mais próximo. Se o raio de uma localização não está documentado, o envelope daquela categoria/cenário não é publicado (limites nulos); a distância central continua disponível, mas deve ser interpretada como estimativa.

**Limitações:** não representa percurso por ruas, tempo de viagem, transporte, barreiras físicas, capacidade, horário, elegibilidade ou atendimento efetivo. Se faltarem coordenadas de equipamentos, a distância até o ponto conhecido mais próximo pode ficar superestimada. A cobertura de localização deve acompanhar todo resultado.

**Linguagem permitida:** “distância em linha reta”.

### Indicador 6 — Qualidade e cobertura das coordenadas

**Definição:** proporção de equipamentos cadastrados de uma categoria com localização elegível, acompanhada da classificação de proveniência e confiança.

**Fórmula:**

`cobertura = equipamentos com coordenada elegível / equipamentos cadastrados × 100`

**Unidade:** quantidade de equipamentos e percentual por categoria.

**Fonte:** catálogo e registro de proveniência em `catalogo/servicos_manuais.csv` e `catalogo/localizacao_registro.csv`; cobertura já registrada em `web/dados/exposicao_distancia.json`.

**Limitações:** cobertura não significa precisão uniforme. Coordenadas de métodos diferentes devem ser identificadas separadamente. A coordenada aproximada pelo centro do CEP não deve ser apresentada como equivalente a uma coordenada institucional conferida.

**Situação da proveniência na PR #92:** entre os 28 CRAS/UBS com coordenadas do catálogo, 22 têm método, confiança (11 alta e 11 média) e data de aplicação registrados em `localizacao_registro.csv`. Os outros 6 têm coordenadas cadastradas, mas não possuem registro explícito de proveniência; são publicados com confiança `nao_registrada` e não devem ser descritos como verificados. A confirmação desses seis registros é pendência antes de afirmar cobertura completa de proveniência.

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

## 5. Auditoria geométrica do ponto representativo

**Auditoria inicial executada em 07/11/2026 sobre as 408 geometrias versionadas. A substituição do método permanece pendente.**

O método atual em pipeline/analise_territorial.py, função centro, escolhe em cada geometria MultiPolygon o componente cujo anel externo tem mais vértices e calcula o centroide desse anel. A seleção por quantidade de vértices não equivale à seleção por área; o cálculo não considera os anéis internos (buracos) nem combina todos os componentes pela área.

**Resultado da verificação espacial:** 9 dos 408 centroides calculados pelo método atual caem fora do respectivo polígono. Os códigos identificados são:

- 354390705000026
- 354390705000165
- 354390705000339
- 354390705000432
- 354390705000460
- 354390705000524
- 354390705000529
- 354390705000530
- 354390705000541

Uma checagem exploratória adicional calculou o centroide ponderado pela área dos componentes e dos anéis. Ela também encontrou 9 centroides fora; nos nove casos, o deslocamento em relação ao método atual foi inferior a 0,14 metro. Portanto, simplesmente ponderar componentes pela área não resolve esses casos.

**Decisão nesta rodada:** não substituir automaticamente o centroide. A integração da incerteza espacial dos equipamentos foi autorizada em 08/11/2026, mas é independente da escolha do ponto representativo do setor. O ponto alternativo deve ser interno ao polígono e comparado antes da adoção.

Próxima comparação necessária:

1. Gerar um ponto interno representativo para cada um dos 408 setores, inclusive geometrias multipartes e setores com buracos.
2. Confirmar por teste ponto-no-polígono que todos os pontos alternativos pertencem à geometria correspondente.
3. Calcular as distâncias com o mesmo conjunto de equipamentos e nos mesmos cenários de localização.
4. Comparar deslocamento entre pontos, diferenças de distância por setor e categoria, mediana, percentil 90 e proporções acima dos limiares.
5. Registrar algoritmo, sistema de coordenadas, versão da biblioteca e resultados.
6. Adotar o método somente após avaliar o impacto e documentar a decisão.

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

Nesta rodada foi executada a auditoria geométrica inicial das 408 feições e registrada a ocorrência de 9 centroides fora dos polígonos. O gerador e o JSON do mapa passaram a registrar essa auditoria e a distinguir a proveniência das localizações. Nenhum centro foi substituído e as distâncias existentes não foram recalculadas. A comparação completa com pontos internos representativos, o impacto nos indicadores e a definição formal de supressão estatística continuam pendentes. Os números de cobertura apresentados são transcrições dos arquivos atuais do repositório.
