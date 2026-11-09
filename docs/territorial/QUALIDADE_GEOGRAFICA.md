# Qualidade geográfica — malha de setores de Rio Claro

## Fonte e geometria de referência

A referência oficial do MISM3 é a malha IBGE de setores censitários 2022, recortada para Rio Claro (código 3543907), mantida em `dados/referencia_ibge/setores_rio_claro_original_ibge_2022.geojson`. O arquivo contém somente geometria e atributos geográficos (`CD_SETOR`, `SITUACAO`, `CD_BAIRRO`, `NM_BAIRRO`, `AREA_KM2`). As variáveis de contagem de pessoas e domicílios foram removidas intencionalmente. A geometria não é fonte de contagens, não altera a regra D4 e não pode ser usada para reconstituir dados suprimidos.

O contorno municipal de referência é a Malha Municipal IBGE 2025, em `dados/referencia_ibge/municipio_rio_claro_2025.geojson`. A proveniência, os hashes dos arquivos de origem e as verificações de equivalência do shapefile e GeoPackage constam em `dados/referencia_ibge/PROVENIENCIA.txt`.

## Regra de publicação da geometria

A geometria publicada deve corresponder à geometria original dos 408 setores, sem simplificação Douglas–Peucker e sem `coverage_simplify`. A única operação permitida sobre coordenadas é o arredondamento a seis casas decimais (`CASAS = 6`). Em Rio Claro, uma unidade na sexta casa decimal representa aproximadamente 0,11 m de latitude e 0,10 m de longitude.

A Actions compara cada geometria publicada à referência IBGE após arredondamento a seis casas. O teste também verifica validade geométrica, sobreposições entre pares de setores e buracos internos na união da cobertura. O limiar de detecção de área é 0,0121 m², equivalente aproximadamente a uma célula de quantização de 0,11 m × 0,11 m. O limite é determinado pela resolução das coordenadas, não pela área observada nas interseções. Interseções e buracos acima desse limiar são falhas.

## Áreas geodésicas e versões territoriais

O cálculo de área utiliza exclusivamente `pyproj.Geod(ellps="GRS80")`, somando os anéis externos e subtraindo os buracos. A versão do pyproj é fixada em `requirements.txt`. Não se usa a aproximação plana em graus para publicar ou validar a soma das áreas.

Na geometria original dos 408 setores, arredondada a seis casas, a soma geodésica é **498,422 km²**. O contorno municipal IBGE 2025 tem área geodésica de **498,402 km²**. A diferença entre as somas é de aproximadamente **0,020 km²**.

Os setores são da edição 2022 e o limite municipal de comparação é da edição 2025. A comparação espacial em projeção equivalente indica aproximadamente **0,707 km²** do município 2025 sem cobertura pelos setores e **0,727 km²** dos setores fora do limite 2025; a diferença simétrica entre as duas coberturas é aproximadamente **1,434 km²**. Portanto, a divergência de cerca de 0,7 km² em cada sentido é uma diferença entre edições cartográficas, não deve ser rotulada como falha interna da malha de setores nem usada para deformar a geometria original.

## Auditoria dos pontos representativos

A auditoria de centroides deve ser executada novamente sobre a geometria original arredondada a seis casas. O ponto matemático pode ficar fora de polígonos côncavos ou multipartes; quando isso ocorrer, o pipeline usa o ponto interno alternativo documentado, sem chamá-lo de centroide matemático. A contagem anterior de nove pontos externos não deve ser presumida para a geometria original; a auditoria atualizada e os deltas de distância precisam ser gerados após a atualização local dos indicadores.

## Privacidade e limites de uso

A malha de referência contém somente geometria e atributos territoriais. Não fornece pessoas, domicílios, matrículas, docentes ou gestores. A regra D4 continua sendo aplicada no pipeline de privacidade sobre as fontes apropriadas. A auditoria geométrica não remove, altera nem contorna supressões estatísticas.

As tabelas brutas de INEP, CNES, CNEFE e demais fontes locais não são incorporadas a este repositório por esta auditoria. Saídas dependentes dessas fontes devem ser regeneradas localmente pelo responsável, com logs minimizados e sem cópia de dados sensíveis para GitHub ou Actions.
