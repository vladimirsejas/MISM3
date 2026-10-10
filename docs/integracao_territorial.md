# Integração territorial e saúde da mulher no MISM3

## Arquivos fornecidos

O CSV `resumido3_com_coordenadas_google.csv` contém 2.003 CEPs de Rio Claro/SP, nomes de bairros/logradouros e coordenadas geocodificadas. Há 1.822 linhas com coordenadas; 8 coordenadas caem fora de uma caixa geográfica ampla de triagem para Rio Claro e são descartadas pelo importador. A caixa é apenas uma validação grosseira, não o limite municipal oficial.

O script `gerar_bairros_geojson.py` enviado como complemento originalmente dependia de `clusters_por_bairro.json`, derivado de registros de saúde. A versão adaptada do MISM3 calcula centros de bairro a partir dos pontos do CSV de CEPs, evitando usar localização de pacientes para definir limites territoriais.

## Preparar o CSV local

Copie o arquivo para:

```
dados/bruto/ceps_google/resumido3_com_coordenadas_google.csv
```

A pasta `dados/bruto/` é ignorada pelo Git. O CSV original não precisa nem deve ser publicado no repositório.

## Gerar o índice de CEP

Execute na raiz do MISM3:

```powershell
python pipeline\indice_cep_csv.py
```

O script gera `web/dados/cep_indice.json`, formato já utilizado pelo site. Ele exporta somente CEP, coordenadas arredondadas, raio de incerteza, setor vazio e contagem; não exporta rua, bairro ou endereço. Usa raio de 300 m e arredonda as coordenadas a três casas decimais. O CNEFE/IBGE continua sendo a fonte preferencial quando estiver disponível; esta é uma fonte complementar fornecida pelo responsável do projeto.

## Gerar polígonos de bairros

Instale as dependências uma vez:

```powershell
pip install shapely scipy numpy
```

Depois execute:

```powershell
python pipeline\gerar_bairros_geojson.py
```

A consulta ao IBGE e ao OpenStreetMap/Overpass requer internet. A saída é `web/dados/bairros_rio_claro.geojson` e `web/dados/municipio_rio_claro.geojson`. Bairros sem polígono encontrado no OpenStreetMap recebem polígonos de Voronoi marcados explicitamente como aproximados; esses polígonos não são limites administrativos oficiais. A versão adaptada usa correspondência exata de nomes para reduzir associações indevidas.

## Limitações e cuidados

- Coordenadas de geocodificação não foram verificadas uma a uma no terreno.
- A caixa geográfica de triagem não substitui validação contra a malha oficial do município.
- Um ponto de CEP representa uma localização aproximada, não cada endereço daquele CEP.
- Não usar o índice para localizar pacientes nem inferir residência individual.
- Os dados territoriais não são registros de saúde. O processamento de saúde da mulher permanece separado e depende dos CSVs originais e da confirmação da fonte (SIH/SIM/SISCAN) antes de rotular os indicadores.
