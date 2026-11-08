# Auditoria de sensibilidade dos centroides

## Objetivo

Comparar o centroide atualmente calculado por pipeline/analise_territorial.py com um ponto interno representativo, sem alterar o método de produção.

## Método alternativo

pipeline/auditoria_centroides.py preserva o centroide atual quando ele já está dentro do polígono. Quando o centroide está fora, examina faixas horizontais entre os vértices, desconta os buracos e procura o ponto interno de menor distância geodésica ao centroide atual. O candidato é validado contra a geometria completa.

O método é uma correção mínima para análise de sensibilidade, não um novo centroide geométrico nem uma medida da distribuição populacional interna. Não deve ser adotado automaticamente como método oficial.

## Comparação

O script avalia todos os setores e compara:

- posição do centroide atual e do ponto interno;
- deslocamento entre os dois pontos;
- distância em linha reta até o equipamento mais próximo por categoria;
- os cenários coordenadas_do_catalogo e com_centro_do_cep;
- mediana, P90 e máximo da variação absoluta das distâncias.

São utilizados os equipamentos publicados em web/dados/indicadores_territoriais.json, mantendo as categorias e as regras de elegibilidade de cada cenário.

## Execução

Na raiz do repositório, execute:

    python pipeline/auditoria_centroides.py

O comando gera docs/territorial/RELATORIO_SENSIBILIDADE_CENTROIDES.json e docs/territorial/RELATORIO_SENSIBILIDADE_CENTROIDES.md.

Também é possível informar caminhos alternativos com --geojson, --indicadores, --saida-json e --saida-md.

## Regra de segurança metodológica

O script não modifica setores.geojson, indicadores_territoriais.json, exposicao_distancia.json nem o código de produção. A adoção de qualquer ponto alternativo depende de análise dos resultados e decisão metodológica explícita.
