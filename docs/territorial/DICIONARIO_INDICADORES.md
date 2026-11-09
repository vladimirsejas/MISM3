# Dicionário de indicadores territoriais — MISM3

Atualizado em 09/11/2026. Este dicionário descreve os campos usados pelo mapa territorial e seus limites de interpretação. A unidade estatística é o setor censitário do IBGE 2022; a malha publicada contém 408 setores.

## Unidade e geometria

| Campo / conceito | Definição | Limite de interpretação |
|---|---|---|
| `setor` / `id` | Código do setor censitário do IBGE. | Identifica território estatístico, não residência nem pessoa. |
| `area_km2` | Área do polígono calculada geodesicamente no elipsoide GRS80. | Não confundir com o atributo municipal de área nem com a área da edição 2025. |
| `bairro` | Rótulo de bairro associado à referência territorial disponível. | Não equivale a limite administrativo oficial de bairro da Prefeitura. |

A geometria de referência é a malha IBGE 2022 original. Os vértices são preservados; somente as coordenadas são arredondadas a seis casas decimais. A auditoria topológica usa 0,0121 m² como tolerância de quantização. Foram identificados 11 centroides matemáticos externos; os pontos internos alternativos são usados somente nesses 11 casos.

## Indicadores demográficos e de densidade

| Campo | Definição | Fonte / regra |
|---|---|---|
| `pessoas` | Total agregado de pessoas residentes no setor. | IBGE, Censo Demográfico 2022, V0001. |
| `domicilios` | Total agregado de domicílios particulares e coletivos no setor. | IBGE, Censo Demográfico 2022, V0002. |
| `densidade` | Pessoas por km² do setor, calculadas a partir de `pessoas` e `area_km2`. | Valor nulo quando a base é suprimida ou insuficiente. |

### Regra de supressão D4

O campo `suprimido_privacidade` identifica os 17 setores protegidos. Nesses setores, `pessoas`, `domicilios`, `densidade` e todos os campos de distância permanecem nulos. Os setores continuam desenhados para preservar a referência cartográfica. Os 17 setores não entram em estatísticas de distância; portanto, no máximo 391 dos 408 setores contribuem para esses resumos. Não reconstruir valores suprimidos por diferença, agregação reversa ou cruzamento externo.

## Equipamentos públicos

O objeto `equipamentos` contém contagens territoriais por categoria:

- `cras`: equipamentos CRAS localizados no setor.
- `ubs`: UBS/USF localizadas no setor.
- `escola`: escolas municipais localizadas no setor.

A presença de um ponto significa que o equipamento foi localizado segundo o método registrado. Não comprova área de atendimento, capacidade, vaga, elegibilidade ou acesso efetivo. A localização por centro de CEP é aproximada e não é coordenada comprovada do prédio.

## Distâncias em linha reta

Os objetos `distancia_km`, `distancia_min_km` e `distancia_max_km` organizam a distância até o equipamento mais próximo por cenário e categoria.

| Cenário | Significado |
|---|---|
| `coordenadas_do_catalogo` | Usa coordenadas individuais quando método e proveniência estão documentados; não aplica fallback de CEP. |
| `com_centro_do_cep` | Análise de sensibilidade que usa o centro e o raio do CEP cadastral do próprio equipamento quando aplicável. |

As categorias são `cras`, `ubs` e `escola`. As distâncias são calculadas em linha reta (Haversine) e expressas em quilômetros. Não são rotas, tempo de deslocamento, acessibilidade, transporte disponível ou garantia de atendimento.

Quando existe raio operacional documentado, os campos mínimo e máximo descrevem um envelope geométrico operacional. Esse envelope não é intervalo de confiança. Sem raio documentado, a faixa não é calculada. Valores nulos também podem indicar setor protegido pela D4 ou ausência de localização elegível.

## Resumos

Os resumos de distância incluem mediana, percentil 90, faixas e proporções de setores não suprimidos. São estatísticas por setor, não ponderadas pela população. Não representam população exposta, risco individual, demanda reprimida ou probabilidade de atendimento.

## Fontes e arquivos de referência

- Geometria: `dados/referencia_ibge/setores_rio_claro_original_ibge_2022.geojson`.
- Limite municipal de comparação: `dados/referencia_ibge/municipio_rio_claro_2025.geojson`.
- Indicadores publicados: `web/dados/indicadores_territoriais.json`.
- Distâncias: `web/dados/exposicao_distancia.json`.
- Método e geração: `pipeline/territorial_indicadores.py`, `pipeline/territorio.py`, `pipeline/exposicao_distancia.py` e `pipeline/analise_territorial.py`.
- Proveniência e limitações: `dados/referencia_ibge/PROVENIENCIA.txt`, `docs/territorial/METODOLOGIA_INDICADORES_TERRITORIAIS.md` e `docs/territorial/POLITICA_PRIVACIDADE_DADOS_TERRITORIAIS.md`.

A regeneração final de derivados que dependem das fontes locais permanece pendente, conforme `docs/territorial/REGENERACAO_LOCAL_PENDENTE.md`. Este dicionário não certifica a atualização desses derivados.
