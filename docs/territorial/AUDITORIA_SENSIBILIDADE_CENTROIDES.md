# Auditoria de sensibilidade dos centroides

## Objetivo

Comparar o centroide atualmente calculado por pipeline/analise_territorial.py com um ponto interno representativo, sem alterar o método de produção.

## Método alternativo

pipeline/auditoria_centroides.py calcula um ponto interno pela varredura determinística das faixas horizontais entre as coordenadas Y dos vértices. Em cada faixa, identifica os intervalos internos do anel externo, desconta os buracos e escolhe o maior intervalo horizontal encontrado. O ponto médio desse intervalo é verificado contra a geometria completa.

O método é uma alternativa de análise de sensibilidade; não é denominado centroide, não pretende representar a distribuição populacional interna e não deve ser adotado automaticamente como método oficial.

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
