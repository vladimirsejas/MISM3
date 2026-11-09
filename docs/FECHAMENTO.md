# Fechamento do MISM3

Data de início: 2026-11-09
Branch de trabalho: `mism3-fechamento`
Branch-base: `main`
SHA de partida: `9ed9731ca55b97888a6e0fef2df04fdd9eedbd9d`

## Registro de execução

- Estado inicial confirmado diretamente no GitHub.
- Branch criada a partir da ponta atual de `main`.
- Primeiro commit confirma permissão de escrita.
- Nenhuma alteração em `main`, merge, deploy ou operação na Cloudflare.

## Blocos

| Bloco | Estado | Commit | Actions |
|---|---|---|---|
| 1. Privacidade | Concluído | `edc9ea8ee14170d14b275641bf57bc32bdea7dbd` | `42657889614` — sucesso |
| 2. Geografia | Em andamento | `a1a0f88`, `71eead9`, `81f6843`, `22e2c40`, `4b3db12` | `42666891746` — falhou na conferência entre bases escolares; correção aplicada, regeneração integral ainda pendente |
| 3. Fontes e licenças | Em andamento | `c3cbff0`, `f66f616`, `df7d519`, `9aae00b` | Testes de atribuição e inventário documental adicionados; aprovação integral pendente |
| 4. Mapa e painel | Em andamento | `c3cbff0`, `f66f616` | Atribuição cartográfica e teste automatizado de créditos corrigidos; testes de navegador e acessibilidade ainda pendentes |
| 5. Sistema de orientação | Pendente | — | — |
| 6. Documentação definitiva | Pendente | — | — |
| 7. Fechamento | Pendente | — | — |

## Registro técnico

### 2026-11-09
- Inventário inicial: `main` em `9ed9731ca55b97888a6e0fef2df04fdd9eedbd9d`.
- Branches existentes e PRs abertas consultadas; nenhuma PR aberta no momento da consulta.
- A branch de fechamento foi criada sem alterar `main`.

## Bloco 1 — privacidade: execução e correções

- A rotina de filtragem do índice CEP foi corrigida para omitir registros sem vínculo com setor da malha, setores protegidos pela D4 e registros inválidos; o mesmo saneamento é chamado tanto na geração normal quanto no saneamento do arquivo publicado.
- O índice publicado passou de 1.367 para 1.243 CEPs. Foram removidos 124 CEPs sem correspondência verificável na malha; permanecem zero CEPs sem setor verificável e zero CEPs associados aos 17 setores D4. Os 44 CEPs com menos de três endereços permanecem generalizados para o centro do setor.
- A validação do registro CEP passou a exigir chave de oito dígitos, cinco campos válidos, coordenadas/raio finitos e contagem de endereços inteira e não negativa.
- A regra central D4 passou a tratar contagens fracionárias, booleanas, negativas, NaN e infinitas como inválidas, aplicando supressão fail-closed.
- Foram acrescentados testes para CEP sem setor, setor ausente da malha, sufixo CNEFE, registros inválidos, generalização, idempotência e contagens D4 inválidas.
- O carimbo e o hash de entrada de `indicadores_territoriais.json` foram atualizados após o saneamento do índice CEP, preservando a serialização original dos demais indicadores.
- Commits do bloco: `7aa998c64983a8ba767ec3e4ff22250ce9bfb46a`, `150b15333414223670b93c568ebd0e2d67626ebf`, `0aab7d729e9d6233ca3817218f9b63dd6e1973e5`, `ea9d9043ded2852a5ff6f24950b9220cca3f1eb1`, `d2b3682f85b8f9f064e2873a474f4d64a539fb18`, `8688195ab4dfe49588a9728491a262b76a6c8a1a`, `f283de8150d49cb4d6c51ea70b211cea0795540e`, `e22459d97f82fac8849f65334d5652a499294ac2`, `23e0e59dd11cd0abb31c1c2c772a461829ef2518`, `56d912dd7d6029d6d8462878e8d4aa84489f09f2`, `88bfb3c837af71089f5de5793964481da328462f`, `edc9ea8ee14170d14b275641bf57bc32bdea7dbd`.
- Execuções Actions anteriores foram inspecionadas e falharam durante a correção iterativa: 42656266747, 42656339521, 42656385372, 42656489465, 42656599377, 42657143528, 42657191141, 42657289569, 42657302503, 42657452897 e 42657510675. As falhas foram corrigidas; a execução integral `42657889614` aprovou a branch no SHA `edc9ea8ee14170d14b275641bf57bc32bdea7dbd`.


## Bloco 2 — geografia: execução em andamento

- A geração dos anéis deixou de aplicar Douglas–Peucker separadamente. A malha é transformada para UTM 23S e simplificada como cobertura com Shapely `coverage_simplify`, tolerância de 4 m; se a cobertura original não for válida, os vértices são preservados sem simplificação. A saída usa seis casas decimais.
- O limiar de detecção de sobreposição foi definido em 0,01 m². Com seis casas decimais, a resolução linear é aproximadamente 0,1 m em Rio Claro; 0,1 m × 0,1 m corresponde a 0,01 m². O limiar é definido pela precisão de publicação, não pela área das interseções observadas. A classificação de relevância permanece separada em 1.000 m².
- A primeira regeneração automatizada baixou a malha oficial SP_setores_CD2022.zip do FTP do IBGE, processou 408 setores e gerou uma malha de 531 KB. A execução `42666891746` parou antes da auditoria topológica e dos centroides porque `exposicao_distancia.py` ainda calculava escolas a partir do catálogo antigo (14/68 no cenário individual e 66/68 no cenário CEP), enquanto o gerador de indicadores usava a base municipal consolidada (33/68 e 68/68). Não se alterou a expectativa para esconder a divergência.
- A divergência foi corrigida: `exposicao_distancia.py` agora usa a mesma base consolidada de escolas e os mesmos métodos `coordenada_individual` e `centroide_cep` do gerador de indicadores. Foi acrescentado teste de regressão com catálogo e base escolar conflitantes. Commits: `22e2c40faccb940579b132068479e2d089cff929` e `4b3db12c06c0901de1ff1d94cb8dd0f0478f90ad`.
- A auditoria dos nove centroides ainda não foi repetida sobre a nova geometria. A topologia, os pares sobrepostos, a área fora do limite municipal e a sensibilidade das distâncias ainda aguardam a execução regenerada e a Actions verde. O bloco permanece aberto.


## Comparação de branches e integração anterior

- Ponta atual da `main` confirmada: `9ed9731ca55b97888a6e0fef2df04fdd9eedbd9d`. A PR #92 já está mesclada no commit `7b0d1f3e646c37337aa69cf74e97474be5661848`; não foi repetido merge.
- PRs #93, #95, #96, #97 e #98 foram confirmadas como fechadas e mescladas. A comparação `main...mism3-fechamento` mostra a `main` como ancestral, com a branch de fechamento 108 commits à frente e zero atrás.
- Os commits `36c00fe`, `8337e1b` e `e867977` também são ancestrais da branch de fechamento, verificados por comparação de commits.
- A comparação arquivo a arquivo dos oito dados da branch `feat/mapa-territorial-como-mapa-principal` foi concluída. `escolas_municipais.json`, `oferta_educacao_infantil.json`, `analise_territorial.json`, `exposicao_distancia.json`, `setores.geojson` e `territorio.json` estavam iguais à `main`; o índice CEP e os indicadores diferiam. A branch de fechamento preserva o índice saneado para 1.243 CEPs (124 CEPs sem vínculo setorial verificável ou protegidos omitidos), em vez das versões de 1.367/1.384 CEPs que não aplicavam integralmente o saneamento. Os indicadores foram recalculados sobre as entradas saneadas e registram a proveniência das escolas e a incerteza espacial. Não foi copiada a versão menos restritiva do índice da branch antiga.

## Bloco 3 — fontes e licenças: execução em andamento

- `AVISOS-DE-TERCEIROS.md` foi atualizado com links oficiais, data de consulta e status explícito para IBGE/CNEFE, malha de setores, INEP, CNES, OpenStreetMap, Esri e bibliotecas Python diretas.
- Para IBGE/CNEFE e malha de setores, o FTP confirma que os arquivos são públicos, mas não foi localizada licença específica nem autorização expressa de redistribuição. O repositório não declara MIT/CC BY para esses dados.
- Para INEP, a página oficial de microdados foi identificada; a licença geral do conteúdo do portal não foi estendida automaticamente aos microdados. Para CNES, o portal disponibiliza o conjunto, mas o campo de licença exibido é genérico e não identifica licença específica da extração usada.
- A política de tiles OSM foi lida; a camada continua opt-in, envia apenas o Referer de origem e mantém atribuição com link. Os termos Esri foram lidos; a permissão gratuita depende de uso não comercial e a qualificação institucional do uso futuro ainda não foi formalmente confirmada. A atribuição das duas camadas Esri foi ampliada para incluir Esri, HERE, Garmin, OpenStreetMap contributors e a comunidade GIS.
- As licenças dos pacotes Python diretos foram registradas por versão, incluindo dependências nativas GEOS/PROJ; foi acrescentado teste de regressão para impedir que a licença do projeto seja confundida com licença de dados ou tiles de terceiros. Aprovação da Actions pendente.

A regeneração geográfica ocorre no primeiro ciclo da PR #99 enquanto ela não tiver o rótulo `geografia-regenerada`. Depois que os dados forem gerados e commitados, o rótulo será aplicado para que a execução final valide o SHA com os dados versionados sem repetir o download. Nenhuma etapa publica, faz deploy ou aciona Cloudflare.

