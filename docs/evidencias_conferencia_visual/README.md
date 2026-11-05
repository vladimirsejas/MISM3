# Evidências da conferência visual de coordenadas (UBS, USF e CRAS)

Esta pasta documenta como foram conferidas as coordenadas das unidades de saúde e dos CRAS do catálogo do MISM3. A conferência foi feita em 04/11/2026 por Vladimir Queiroz Sejas, no Google Maps, em visão de satélite e, quando disponível, em Street View. Cada captura de tela foi recortada para mostrar apenas a área do mapa: abas, barra de favoritos, barra de tarefas, a foto da conta Google e as fotos de usuários que o Google exibe no painel lateral foram removidas ou cobertas.

## Como o método funciona

O script `pipeline/geocodificar_catalogo.py` propõe coordenadas a partir do CNEFE 2022 e nunca altera o catálogo sozinho. Na rodada de outubro de 2026, ele resolveu 12 de 150 serviços com confiança alta, sugeriu apenas CEP em 40 e não encontrou correspondência em 98, entre eles quase todas as unidades de saúde e os CRAS. Para essas, o autor localizou a unidade no Google Maps, confirmou a fachada, a placa ou a posição da entrada e registrou o ponto. As decisões aprovadas estão em `catalogo/conferencia_visual_ubs_usf_2026-11-04.csv` (13 unidades de saúde), em `catalogo/conferencia_visual_usf_pendentes_2026-11-04.csv` (as 3 últimas USF: Ajapi, Jardim Progresso e Brasília) e em `catalogo/conferencia_visual_cras_2026-11-04.csv` (4 CRAS). O script aplicou as coordenadas somente em campos vazios e registrou cada alteração em `catalogo/localizacao_registro.csv`, com método, confiança e data.

## O que há nesta pasta

O arquivo `indice_capturas.csv` lista as 48 capturas, a unidade a que cada uma se refere, o tipo de visão, as coordenadas lidas na barra de endereço do navegador e, quando existe, a distância até a coordenada de referência (a do arquivo `mapaRioClaroUSF.geojson`, do projeto MISM 1, ou a do catálogo). A pasta `capturas/` contém as imagens, nomeadas pela unidade. Há capturas das 22 unidades de saúde e dos 4 CRAS. As USF Jardim Progresso e Brasília têm confiança média (ver `docs/registro_conferencia_visual_2026-11-04.md`). Como o repositório é público e as imagens contêm conteúdo do Google, as imagens ficam apenas no computador do autor e não são enviadas ao GitHub; o índice e as coordenadas são o que vai no repositório.

## Como ler o índice

Nas capturas de unidades de saúde, a coluna `unidade_provavel` foi atribuída por proximidade entre o ponto da captura e a coordenada de referência, e não por transcrição manual do nome. Por isso deve ser revisada, em especial nos casos com distância acima de 100 m. Nas capturas dos CRAS, a unidade é a que o próprio Google Maps nomeia. A coluna `tipo_de_visao` distingue a busca por coordenada ou por nome em satélite do Street View, pelo formato do endereço. As coordenadas da URL foram lidas por reconhecimento óptico de texto e podem ter erro de dígito; a captura é a evidência, e o índice é um auxílio.

## Como foram obtidas as coordenadas dos CRAS

A URL do Google Maps traz o centro da tela, não a posição do marcador. Para cada CRAS, a coordenada aprovada foi calculada somando ao centro da URL o deslocamento do marcador na captura, convertido em metros pela escala do mapa. O método foi validado em dois casos em que a URL exibia a latitude do próprio marcador (CRAS Jardim Brasília e CRAS Terra Nova): o cálculo diferiu em cerca de 2 m. O erro estimado das coordenadas dos CRAS é, portanto, de poucos metros, suficiente para distâncias medidas em quilômetros, mas não para localizar a porta de entrada.

## Limitações e cuidados

As coordenadas de 21 unidades de saúde vêm de um arquivo do projeto anterior, de origem e data desconhecidas, e a conferência visual verifica apenas se o ponto cai na unidade correta. Os telefones não foram verificados nesta etapa. O endereço do CRAS Terra Nova no Google Maps (Av. Marginal Jn, 75) difere do que consta no catálogo (Rua Marco Antonio Padula, 1043); a placa "CRAS Terra Nova" no Street View está no prédio do marcador, e o endereço do catálogo deve ser revisado com a Prefeitura. As imagens contêm conteúdo do Google (Imagens ©2026 Airbus, Maxar Technologies, Dados do mapa ©2026 Google). Antes de redistribuir estas imagens fora do repositório, por exemplo em um depósito no Zenodo ou no artigo, é preciso verificar os termos de uso do Google Maps e Street View e manter a atribuição. Sem essa verificação, o artigo deve citar o índice e as coordenadas, e não reproduzir as imagens.
