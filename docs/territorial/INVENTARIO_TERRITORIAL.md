# Inventário territorial do MISM3

**Escopo:** leitura documental da branch `main`. Este inventário descreve o que foi possível confirmar nos arquivos indicados. Não executa scripts, testes, recálculos ou alterações nos dados.

## Estado da inspeção

A branch `main` consultada contém `protocolo/` e `reproducao/`. As PRs #68 e #70 estão fechadas e mescladas. O topo da `main` é o commit `86c7ada7ba35c5002f62d057a8b6e529740dc2f8`, cujo commit de merge corresponde à PR #70; seu primeiro pai é o merge da PR #68 (`52ded74d291516c830764dddaafe00f6acddd725`). A sequência foi confirmada pelos metadados dos merges.

## Arquivos de processamento

### `pipeline/setores.py`
Lê a malha estadual de setores censitários do Censo 2022, filtra o município pelo código IBGE configurado e gera `web/dados/setores.geojson`, além de `web/dados/setor_bairro.json`. Simplifica geometrias pelo algoritmo Douglas–Peucker e registra propriedades `setor`, `bairro`, `situacao`, `pessoas` e `domicilios`. O próprio código declara que `v0001` e `v0002` são interpretados como pessoas e domicílios, mas recomenda confirmar os significados no dicionário do IBGE. Fonte: `pipeline/setores.py`.

### `pipeline/territorio.py`
Calcula indicadores por setor a partir de `web/dados/setores.geojson`: área aproximada, densidade populacional e pessoas por domicílio, com limiar mínimo de domicílios. Também calcula distâncias em linha reta até CRAS, UBS/USF e escolas municipais com creche, considerando localização do catálogo ou centro do CEP, conforme a implementação atual. Define cobertura mínima de localização e registra categorias pendentes quando a cobertura é insuficiente. Fontes: `pipeline/territorio.py` e `web/dados/territorio.json`.

### `pipeline/analise_territorial.py`
Calcula distâncias em linha reta entre centros dos setores e serviços categorizados como CRAS, UBS e escolas municipais. Agrega resultados por bairro e aplica agrupamento exploratório k-means. A função de localização aceita coordenadas no registro do serviço e, quando ausentes, consulta o índice de CEP. O próprio aviso do arquivo de saída identifica a aproximação pelo centro do CEP. Fontes: `pipeline/analise_territorial.py` e `web/dados/analise_territorial.json`.

### `pipeline/exposicao_distancia.py`
Calcula, para CRAS, UBS/USF e escolas municipais, a distância em linha reta entre o centro de cada setor e o serviço mais próximo. Resume a distribuição ponderada pela população, incluindo mediana, percentil 90 e população acima de limiares de distância. Implementa dois cenários: `coordenadas_do_catalogo` e `com_centro_do_cep`. Registra cobertura e se a localização da categoria está completa. Fontes: `pipeline/exposicao_distancia.py` e `web/dados/exposicao_distancia.json`.

### `pipeline/indice_cep.py`
Constrói o índice de CEP a partir de dados CNEFE do IBGE. Agrupa coordenadas por CEP e produz centro aproximado, raio de incerteza, setor censitário e quantidade de endereços. O cabeçalho do script documenta o formato `CEP -> [latitude, longitude, raio_m, setor, n_enderecos]` e declara que o arquivo de saída não contém nome de rua, número ou endereço. Fonte: `pipeline/indice_cep.py`.

### `pipeline/ceps_lista.py`
Lê uma lista local de CEPs com logradouro, bairro e coordenadas, filtrando Rio Claro/SP e uma caixa geográfica definida no código. O cabeçalho informa que a lista auxilia a encontrar CEP de rua e a completar CEPs ausentes no CNEFE. O arquivo bruto está previsto em `dados/bruto/`, indicado pelo código como ignorado pelo Git. Fonte: `pipeline/ceps_lista.py`.

## Arquivos de interface

### `web/territorio.js`
Implementa a visualização “Rio Claro em números”, consumindo dados públicos agregados locais. O cabeçalho declara ausência de requisições externas e uso de `textContent` para conteúdo vindo dos dados. O arquivo constrói elementos de visualização territorial e tabelas. Fonte: `web/territorio.js`.

### `web/mapa.js`
Implementa a tela do mapa de serviços. O cabeçalho documenta consumo de catálogo, índice de CEP e malha de setores, e declara que o texto digitado não é enviado, gravado ou colocado na barra de endereço. O mapa apresenta pontos de serviços e diferencia localizações por endereço, aproximação por CEP e serviços sem posição. Fonte: `web/mapa.js`.

### `web/mapa-servicos.js`
Contém lógica de preparação e classificação dos pontos exibidos no mapa de serviços. A função `posicao` prioriza latitude/longitude do registro e, na ausência, pode utilizar o índice de CEP, respeitando raio máximo configurado. Serviços sem localização permanecem sem ponto inventado. Fonte: `web/mapa-servicos.js`.

## Arquivos de dados

### `web/dados/setores.geojson`
GeoJSON de setores censitários. A leitura do arquivo confirmou 408 feições, geometria MultiPolygon na primeira feição e propriedades `setor`, `bairro`, `situacao`, `pessoas` e `domicilios`. Metadados apontam a malha de setores censitários do IBGE, Censo 2022. Os metadados identificam `v0001` como pessoas e `v0002` como domicílios, mas mantêm ressalva de confirmação no dicionário do IBGE. Fonte: `web/dados/setores.geojson`.

### `web/dados/territorio.json`
JSON com metadados, totais, classes, agregações por bairro e setor, pendências de distância, distâncias até serviços e dados de educação infantil. Os metadados registram soma de população de 201.418, referência publicada do IBGE de 201.418 e área somada aproximada de 497,3 km² frente à área publicada indicada de 498,403 km². Registra 43 setores sem bairro definido pelo IBGE, com 12.846 pessoas. O aviso explicita que a malha não contém idade, renda ou sexo e que distância em linha reta não prova falta de serviço. Fonte: `web/dados/territorio.json`.

### `web/dados/analise_territorial.json`
Resultado agregado por bairro da análise territorial. Metadados datam a geração em 2026-11-05 e registram cobertura de 6/6 CRAS, 22/22 UBS e 68/68 escolas. O aviso informa que as distâncias foram calculadas com localização aproximada pelo centro do CEP; o agrupamento de bairros é exploratório. Fonte: `web/dados/analise_territorial.json`.

### `web/dados/exposicao_distancia.json`
Resultado com os dois cenários de localização. No cenário `coordenadas_do_catalogo`, registra CRAS 6/6, UBS 22/22 e escolas 33/68. No cenário `com_centro_do_cep`, registra CRAS 6/6, UBS 22/22 e escolas 68/68. A população total utilizada é 201.418 e os limiares registrados são 1 km e 2 km. O arquivo informa que a distância é em linha reta e que categorias com cobertura incompleta podem ter distância superestimada. Fonte: `web/dados/exposicao_distancia.json`.

### `web/dados/cep_indice.json`
JSON cujo metadado identifica o CNEFE, Censo Demográfico 2022, e o município Rio Claro/SP. O formato registrado é CEP para vetor com latitude, longitude, raio em metros, setor censitário e quantidade de endereços. Não contém nomes de ruas nem números de endereço, conforme a estrutura e o cabeçalho de `pipeline/indice_cep.py`. Fonte: `web/dados/cep_indice.json` e `pipeline/indice_cep.py`.

## Arquivos de catálogo

### `catalogo/servicos_manuais.csv`
Catálogo manual com 168 registros e colunas que incluem identificador, tipo, subtipo, nome, CEP, endereço, telefone, horário, latitude, longitude, fonte e data de verificação, entre outras. O campo CEP é um atributo de cadastro de serviço; seu uso deve ser interpretado no contexto do equipamento institucional e não como CEP de usuário. Fonte: `catalogo/servicos_manuais.csv`.

### `catalogo/inep_escolas.csv`
Tabela de correspondência entre identificadores do catálogo e códigos/nomenclaturas do Censo Escolar/INEP, com coluna de método de correspondência. Não contém coordenadas no cabeçalho observado. Fonte: `catalogo/inep_escolas.csv`.

### `catalogo/localizacao_registro.csv`
Registro de proveniência de campos de localização por serviço, com colunas `id`, `campo`, `valor`, `metodo`, `confianca` e `aplicado_em`. Inclui registros de latitude, longitude e, em alguns casos, CEP, associados a identificadores de equipamentos. Fonte: `catalogo/localizacao_registro.csv`.

## Onde o CEP entra no cálculo territorial

O uso do CEP observado nos arquivos é o CEP cadastral do equipamento público, não o CEP de uma paciente, estudante ou família.

1. Em `pipeline/territorio.py`, a função `localizar_servico` usa latitude/longitude do catálogo quando disponíveis; na ausência, consulta o CEP do próprio registro de serviço em `web/dados/cep_indice.json`, desde que o raio de incerteza não exceda o limite configurado no script.
2. Em `pipeline/analise_territorial.py`, `coordenada_do_servico` segue a mesma prioridade: coordenadas no registro e, na ausência, centro do CEP.
3. Em `pipeline/exposicao_distancia.py`, os cenários explícitos são `coordenadas_do_catalogo` (sem fallback por CEP) e `com_centro_do_cep` (com fallback para CEP institucional do equipamento). O catálogo possui CEPs associados a serviços; as escolas sem coordenadas próprias são as que explicam a diferença de cobertura observada no arquivo de exposição.
4. Em `web/mapa-servicos.js` e `web/mapa.js`, o mapa de serviços também pode usar o índice de CEP para posicionar serviços sem coordenadas próprias. Esse comportamento é distinto do mapa estatístico por setor e precisa ser considerado caso a interface seja alterada em fase posterior.

### Efeito observado de retirar o cenário com CEP

No arquivo existente `web/dados/exposicao_distancia.json`, retirar o fallback pelo centro do CEP corresponde a utilizar o cenário `coordenadas_do_catalogo`: escolas passam de 68/68 localizadas no cenário com CEP para 33/68 com coordenadas no catálogo. CRAS permanecem 6/6 e UBS permanecem 22/22 nos dois cenários. Esses números descrevem os arquivos atuais e não foram recalculados nesta fase.

### Opções para decisão do autor

**Opção A — Manter o cenário com centro do CEP, explicitamente rotulado como análise de sensibilidade.**

- Vantagens: preserva uma comparação de sensibilidade à forma de localização e aumenta a quantidade de escolas com posição aproximada.
- Desvantagens: a coordenada é aproximada; o raio de incerteza varia; resultados de distância dependem de uma representação menos precisa. O cenário não deve ser confundido com coordenada institucional verificada.

**Opção B — Retirar o cenário com CEP dos indicadores territoriais.**

- Vantagens: mantém apenas coordenadas presentes no catálogo e reduz a dependência de localização aproximada por CEP.
- Desvantagens: a cobertura de escolas cai de 68/68 para 33/68 no arquivo atual, tornando incompleta a base espacial escolar. Isso pode impedir ou limitar a apresentação de distâncias para essa categoria.

**A decisão entre as opções não é tomada por este inventário.** Cabe ao autor escolher, considerando a finalidade do mapa e a transparência sobre a precisão das coordenadas.

## Itens não verificados nesta leitura

- Significado exato de `v0001` e `v0002` no dicionário oficial do IBGE; o próprio `pipeline/setores.py` recomenda confirmação.
- Correspondência individual entre todos os 68 registros escolares e as coordenadas próprias ou os CEPs usados no cenário aproximado.
- A origem documental primária de cada coordenada registrada em `catalogo/localizacao_registro.csv`, além do método e da confiança descritos no próprio registro.
- A validade atual, no terreno, de todos os endereços e coordenadas cadastrados.
- A execução atual dos scripts e a reprodução dos JSONs a partir das entradas.
- O comportamento completo de todas as rotas da interface em execução; a leitura do código não substitui teste funcional.
- Se o índice de CEP contém outros metadados ou riscos indiretos não identificados pela inspeção estrutural; a ausência de nome de rua e número não equivale, por si só, a uma avaliação completa de risco de reidentificação.
- A documentação de origem e atualização de cada fonte de catálogo, quando não explicitada nos próprios arquivos.
