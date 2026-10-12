# Índice de Cobertura de Serviços (ICS) — exploratório

## Como gerar

No PowerShell, na pasta do projeto:

```powershell
python pipeline/cobertura.py
```

Esse comando usa `web/dados/setores.geojson`, a malha agregada de setores censitários já presente no repositório, e o catálogo manual com coordenadas ou CEPs resolvíveis pelo índice local.

Se quiser ler diretamente o GeoPackage do IBGE que está no computador:

```powershell
python pipeline/cobertura.py --gpkg "docs/ibge/SP_setores_CD2022.gpkg"

Para listar as colunas sem tentar gerar o índice (útil para conferir o esquema do arquivo):

```powershell
python pipeline/cobertura.py --gpkg "docs/ibge/SP_setores_CD2022.gpkg" --inspecionar
```

O modo de inspeção lê apenas uma feição, imprime os nomes dos campos e quais candidatos foram reconhecidos; não imprime os valores dos registros e não gera arquivo de saída.
```

A leitura do GeoPackage exige GeoPandas no mesmo Python usado para executar o script. O programa lê uma feição para descobrir o esquema, procura nomes de coluna por sinônimos e filtra Rio Claro antes de carregar os setores. Se não identificar o código do setor ou a população, para e mostra as colunas encontradas — não adivinha.

Saída padrão: `web/dados/cobertura_territorial.json`. Para trocar o destino:

```powershell
python pipeline/cobertura.py --saida "C:\temp\cobertura_territorial.json"
```

## Como ler o ICS

- Para cada setor, o script calcula a distância em linha reta até o serviço cadastrado mais próximo em cada categoria disponível: CRAS, UBS e escola municipal.
- Cada distância é convertida em uma pontuação relativa de 0 a 100. O percentil 95 das distâncias observadas daquela categoria funciona como escala municipal: 100 representa distância zero; a pontuação chega a 0 ao alcançar ou ultrapassar essa escala.
- O ICS do setor é a média simples das pontuações das categorias que têm dados. Se uma categoria não tiver serviço localizável, fica como ausente e não recebe zero.
- O resumo por bairro pondera o ICS dos setores pela população. O JSON guarda também distâncias, pontuações por categoria, pessoas cobertas pelo cálculo e a contagem de serviços cadastrados/localizáveis.

## Limites importantes

O ICS é **comparativo e exploratório**, não é um indicador oficial de cobertura nem um critério para classificar bairros como bons ou ruins. A escala depende da distribuição das distâncias na cidade; uma nota alta não prova suficiência, e uma nota baixa não prova ausência de serviço. A distância é em linha reta: não mede ruas, transporte público, horário, capacidade, fila, acessibilidade, qualidade nem elegibilidade.

A localização pelo centro do CEP é aproximada. O resultado só considera os serviços manuais com IDs `man-` e coordenadas/CEPs resolvidos, seguindo a política atual de não misturar automaticamente cadastros de origem diferente. A ausência de coordenadas não significa ausência do serviço. O arquivo gerado é um artefato local de análise; não foi conectado automaticamente ao dashboard público nem ao painel da Secretaria.

O script não grava endereços residenciais nem dados pessoais. Os setores e populações são dados agregados do Censo 2022.
