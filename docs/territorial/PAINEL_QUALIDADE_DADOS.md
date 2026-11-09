# Painel de qualidade dos dados territoriais

Abra `web/qualidade-dados.html` ou acesse o link no bloco **Para a gestão** da página inicial.

O painel lê somente três arquivos locais versionados:
- `web/dados/setores.geojson`
- `web/dados/territorio.json`
- `web/dados/indicadores_territoriais.json`

Ele calcula no navegador a integridade estrutural da malha, códigos duplicados, coordenadas de equipamentos fora dos polígonos, procedência de CRAS/UBS, métodos de localização das escolas, cautela D4 e verificações independentes de área. A soma setorial publicada usa `pyproj.Geod` no elipsoide GRS80. O painel também mostra uma aproximação plana local e uma verificação esférica independente; esta última não é o cálculo geodésico oficial do pipeline.

A referência municipal tem duas medidas distintas: o atributo `AREA_KM2` da malha municipal IBGE 2025 é 498,403 km²; o recálculo do polígono com Geod GRS80 é 498,402 km². A soma geodésica dos setores de 2022 é 498,422 km².

Na localização dos equipamentos, 22 de 28 CRAS/UBS têm coordenada individual documentada. Os seis restantes usam, no cenário de sensibilidade, o centro do CEP cadastral e o raio operacional do índice. A posição é aproximada e não deve ser apresentada como coordenada individual verificada.

Não há formulário, armazenamento local, envio de dados nem serviço externo. Este painel verifica a estrutura e as métricas locais, mas não calcula topologia completa. A validação Python executa a auditoria topológica da malha de referência: validade, sobreposições por par, buracos internos e diferença de contorno entre as edições IBGE 2022/2025.

Para reproduzir a auditoria completa no pipeline Python, execute:

```powershell
python pipeline/qualidade_geografica.py
```

A rotina Python gera relatórios JSON e Markdown em `docs/territorial/`. O painel web calcula seus próprios indicadores a partir dos arquivos locais para não depender de um relatório previamente gerado.
