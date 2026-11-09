# Qualidade geográfica da malha territorial

## Referências e reprodutibilidade

A referência de setores é `dados/referencia_ibge/setores_rio_claro_original_ibge_2022.geojson`, com 408 setores do IBGE, geometria original em SIRGAS 2000 (EPSG:4674) e sem contagens demográficas. O limite municipal de comparação é `dados/referencia_ibge/municipio_rio_claro_2025.geojson`. A proveniência, os campos preservados e os hashes dos arquivos-fonte estão em `dados/referencia_ibge/PROVENIENCIA.txt`.

`pipeline/setores.py` não aplica Douglas–Peucker nem outra simplificação. Preserva os vértices originais e arredonda somente as coordenadas para seis casas decimais (`CASAS = 6`). A Actions confere cada geometria publicada contra a geometria original arredondada, setor por setor, e rejeita geometria inválida, sobreposição ou buraco interno acima da precisão de publicação.

## Precisão e topologia

Seis casas decimais em latitude/longitude representam aproximadamente 0,11 m em Rio Claro. Uma célula de quantização de 0,11 m × 0,11 m corresponde a cerca de 0,0121 m². Por isso, o limiar de detecção de sobreposição entre pares e de buraco interno é 0,0121 m². O limite é derivado da resolução das coordenadas, não dos resultados medidos. O limiar de relevância para destacar sobreposições maiores continua separado, em 1.000 m².

Na geometria de referência arredondada a seis casas, a suíte confere 408 feições válidas, zero pares sobrepostos acima de 0,0121 m² e área de buracos internos abaixo desse limiar. A auditoria também confirma que a geometria publicada corresponde à referência original arredondada, sem simplificação.

## Áreas e edições territoriais

As áreas são calculadas geodesicamente com `pyproj.Geod(ellps="GRS80")`, não por aproximação plana. A soma das áreas dos 408 setores de 2022 é 498,422 km². A área geodésica do limite municipal de 2025 é 498,402 km²; a diferença entre as somas é aproximadamente 0,020 km².

A malha de setores de 2022 e a malha municipal de 2025 são edições diferentes. A comparação espacial dos contornos aponta cerca de 0,708 km² de área do município de 2025 não coberta pela união dos setores e cerca de 0,727 km² de setores fora do limite municipal de 2025. Esses valores descrevem a diferença entre edições cartográficas; não são buracos internos da cobertura setorial, nem evidência de sobreposição entre setores. A cobertura setorial interna é avaliada separadamente.

## Centroides

A auditoria dos centroides matemáticos foi refeita sobre a geometria original, sem arredondamento. Foram identificados 11 centroides fora do respectivo polígono, em 408 setores. A lista exata dos códigos é testada em `pipeline/tests/test_referencia_ibge.py`. A produção preserva os centroides internos e usa um ponto representativo interno somente nos setores cujo centroide matemático está fora; esse ponto alternativo não é denominado centroide matemático.

## Limites de interpretação

A auditoria geométrica verifica validade, correspondência, sobreposição e buracos internos. A diferença entre os limites de 2022 e 2025 não deve ser confundida com erro do processamento. A geometria não comprova acesso por ruas, transporte, horários ou capacidade de atendimento.

Os dados de pessoas e domicílios não são extraídos da referência geométrica. A publicação desses indicadores depende da regra D4 e da regeneração local autorizada, sem envio de bases brutas ao GitHub.
