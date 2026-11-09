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
| 2. Geografia | Em andamento — correções e testes versionados; Actions sem jobs e regeneração local pendente | `a1a0f88`, `71eead9`, `81f6843`, `22e2c40`, `4b3db12`, `33c6b94`, `671e958`, `7d1e003`, `23e9b78` | `42671168961` — referência aprovada; `42672174236`, `42672449139` e `42672558750` — falha pré-job, zero jobs criados |
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

- A decisão geométrica foi substituída: não há Douglas–Peucker nem `coverage_simplify`. `pipeline/setores.py` preserva os vértices originais e aplica somente arredondamento a seis casas decimais (`CASAS = 6`). A referência original e os arquivos municipais oficiais ficam em `dados/referencia_ibge/`.
- O limiar de detecção de sobreposição e buraco interno é 0,0121 m², equivalente aproximadamente a uma célula de arredondamento de 0,11 m × 0,11 m. O limite decorre da precisão de seis casas decimais, não dos resultados observados. A relevância continua separada em 1.000 m².
- A primeira regeneração automatizada baixou a malha oficial SP_setores_CD2022.zip do FTP do IBGE, processou 408 setores e gerou uma malha de 531 KB. A execução `42666891746` parou antes da auditoria topológica e dos centroides porque `exposicao_distancia.py` ainda calculava escolas a partir do catálogo antigo (14/68 no cenário individual e 66/68 no cenário CEP), enquanto o gerador de indicadores usava a base municipal consolidada (33/68 e 68/68). Não se alterou a expectativa para esconder a divergência.
- A divergência foi corrigida: `exposicao_distancia.py` agora usa a mesma base consolidada de escolas e os mesmos métodos `coordenada_individual` e `centroide_cep` do gerador de indicadores. Foi acrescentado teste de regressão com catálogo e base escolar conflitantes. Commits: `22e2c40faccb940579b132068479e2d089cff929` e `4b3db12c06c0901de1ff1d94cb8dd0f0478f90ad`.
- A auditoria da geometria original arredondada foi executada localmente com Shapely 2.1.2: 408 setores válidos, zero sobreposições acima de 0,0121 m², zero buracos internos e 11 centroides matemáticos externos (não nove). Os 11 códigos são fixados em teste. A auditoria completa de impacto nas distâncias e a regeneração de indicadores dependem dos arquivos locais e serão executadas pelo Claude Code no computador do responsável.


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



## Evidência adicional incorporada — equivalência da malha oficial IBGE

- O responsável pelo projeto conferiu o GeoPackage oficial do IBGE contra o shapefile oficial para os 408 setores de Rio Claro: mesmo conjunto de setores, geometrias idênticas e área total de 498,422 km² em ambos os formatos.
- Essa conferência sustenta que GeoPackage e shapefile representam o mesmo dado geográfico oficial, em formatos distintos. Não são duas fontes independentes nem duas validações independentes da delimitação territorial. A evidência foi informada pelo responsável e ainda não foi reproduzida nesta execução automatizada; deve ser registrada como conferência externa documentada, sem alegar que o agente acessou os arquivos locais.
- O pipeline pode continuar usando o shapefile oficial já previsto na automação. Não há necessidade de duplicar o GeoPackage no repositório, nem de armazenar ambos os formatos no GitHub. A fonte, a edição, o hash e a transformação efetivamente usada devem permanecer rastreáveis.

## Limite das fontes locais — regra permanente de execução

Os seguintes arquivos estão no computador do responsável e não estão disponíveis nesta sessão GitHub: CNES de agosto/2026 em Parquet; tabelas INEP de 2025; CNEFE de Rio Claro; agregado de CEPs do CNEFE; lista de CEPs com coordenadas obtidas pelo Google; malha de bairros IBGE nacional; capturas de conferência visual de CRAS, escolas e unidades de saúde.

- Não solicitar upload nem download desses arquivos para esta sessão e não tentar reproduzir sua ausência com dados inventados ou substitutos.
- Não copiar os arquivos, amostras, linhas, capturas, tabelas brutas, coordenadas Google ou resultados identificáveis para GitHub, PR, Actions artifacts, logs, documentação pública ou Zenodo.
- As tabelas INEP de docentes, gestores e matrículas permanecem exclusivamente no computador do responsável. A leitura local só pode alimentar análises autorizadas e saídas agregadas aprovadas pela auditoria de privacidade.
- As capturas de conferência visual e a lista de CEPs com coordenadas Google permanecem explicitamente no inventário de licenças do Bloco 3, sem presunção de autorização de redistribuição.
- Se a próxima correção depender desses arquivos, preparar código reproduzível e um único prompt consolidado para Claude Code executar no computador do responsável. O prompt deverá exigir inspeção local, preservação dos arquivos-fonte, validação e testes, geração apenas de derivados minimizados e relatório de execução sem dados sensíveis. Não declarar a tarefa concluída antes de receber e validar o resultado da execução local.

A ausência dessas fontes nesta sessão não bloqueia o trabalho independente de código, testes, documentação e auditoria que possa ser realizado no repositório sem os dados privados. Nenhuma alteração aqui autoriza publicação, deploy, merge ou operação na Cloudflare.


## Decisão geométrica substitutiva — referência IBGE original

Em 09/11/2026, a decisão anterior de simplificação foi revogada por solicitação expressa do responsável. A branch remove Douglas–Peucker e `coverage_simplify`; a publicação conserva a geometria original dos 408 setores e arredonda coordenadas apenas a seis casas. O arquivo original sem contagens, o limite municipal 2025 e a proveniência foram incorporados em `dados/referencia_ibge/`. O arquivo publicado `web/dados/setores.geojson` foi alinhado à geometria de referência arredondada, preservando propriedades já publicadas; a referência não foi usada para recuperar contagens nem alterar D4.

A auditoria local reproduzida com Shapely 2.1.2 e pyproj 3.7.2 confirmou 408 geometrias válidas, nenhuma sobreposição acima de 0,0121 m² e nenhum buraco interno na união. A soma geodésica dos setores é 498,422 km² e a do limite municipal 2025 é 498,402 km². Em projeção equivalente, a diferença entre as duas edições cartográficas tem 0,707 km² de área municipal 2025 não coberta e 0,727 km² de setores 2022 fora do limite 2025 (diferença simétrica de 1,434 km²); isso não é falha interna da cobertura setorial.

A repetição do teste dos centroides sobre a geometria original encontrou 11 centroides matemáticos externos, com os códigos registrados no teste `pipeline/tests/test_referencia_ibge.py`. A auditoria detalhada de deslocamentos e distâncias deve ser gerada após a atualização local dos indicadores, sem publicar arquivos brutos nem dados escolares restritos.

A etapa de regeneração automática foi retirada da Actions. A Actions não baixa fontes brutas nem tenta regenerar indicadores dependentes de contagens/D4. O pipeline e a suíte são testados sobre dados versionados; a regeneração final será executada localmente pelo Claude Code, usando fontes locais preservadas e gerando somente derivados autorizados.


## Retomada — execução Actions 42671168961

- O proprietário reapresentou os três arquivos de referência. Os dois GeoJSON foram comparados por SHA de blob Git: `municipio_rio_claro_2025.geojson` e `setores_rio_claro_original_ibge_2022.geojson` coincidem byte a byte com os arquivos já versionados em `dados/referencia_ibge/`. A proveniência reapresentada tem uma diferença de um byte em relação à versão versionada (tamanho 2.543 contra 2.542 bytes); conteúdo substantivo conferido, sem mudança da origem.
- A validação isolada `pipeline/tests/test_referencia_ibge.py` passou na Actions do SHA `33c6b94a0f0dd231be9dbb100a93824d6d008e26`.
- A auditoria independente executada sobre o arquivo original reapresentado encontrou 408 geometrias, zero inválidas, zero pares com sobreposição acima de 0,0121 m² e 11 centroides matemáticos externos: `354390705000026`, `354390705000165`, `354390705000195`, `354390705000339`, `354390705000432`, `354390705000460`, `354390705000502`, `354390705000524`, `354390705000529`, `354390705000530` e `354390705000541`. Portanto, a evidência geométrica original confirma 11, não nove; os testes de produção e a auditoria de centroides devem refletir os 11 casos, preservando os outros 397.
- A execução integral `42671168961` falhou no SHA acima: 293 passaram, 11 falharam e 1 foi ignorado. Três falhas são expectativas antigas/inconsistentes com a geometria original ou com o contrato: o teste de centroides esperava nove externos; o teste sintético de comparação omitia `domicilios` e, por isso, era classificado como protegido pela regra D4; o contrato de catálogo não reconhecia `geo=centroide_cep` (método aproximado por CEP, sem coordenada própria). Essas expectativas foram corrigidas neste commit.
- As demais falhas dependem da regeneração coerente dos derivados locais: `indicadores_territoriais.json`, `exposicao_distancia.json` e `analise_territorial.json`, produzidos com as contagens e fontes locais do responsável e a regra D4. Não se altera expectativa para mascarar divergência, não se inclui fonte bruta nem tabela restrita no GitHub. A regeneração permanece destinada ao Claude Code no computador do responsável.


## Retomada — correções de contrato geográfico e bloqueio de regeneração local

- A execução `42671168961` aprovou o teste isolado de referência IBGE e reprovou 11 testes na suíte geral (293 passaram, 1 foi ignorado). A reauditoria da geometria original confirmou 11 centroides externos, não nove. Os testes de produção já preservam os 397 centroides internos e corrigem somente os 11 externos.
- A Action seguinte, disparada no SHA `671e9589827337196c1252359ea5cb4b8e22f900`, está registrada como execução `42672174236`; seu resultado deve ser consultado antes de afirmar aprovação.
- O catálogo admite três estados de localização: coordenada de fonte, centro do CEP e sem localização. Os seis CRAS/UBS sem coordenada individual documentada têm fallback pelo CEP institucional, com raio operacional do índice; o cenário de sensibilidade com CEP pode reduzir a distância estimada para CRAS e UBS, além de escolas. Os testes não devem tratar esses seis casos como ausência de raio quando o índice fornece o raio operacional.
- O teste de igualdade entre arquivo publicado e gerador não pode ser declarado aprovado antes da regeneração local das saídas que dependem das contagens brutas e da regra D4. Foi criado o marcador `docs/territorial/REGENERACAO_LOCAL_PENDENTE.md`; enquanto ele existir, o teste aparece explicitamente como ignorado, e volta a ser obrigatório quando o Claude Code remover o marcador após regenerar e validar os dados minimizados.
- O teste geográfico usa o limiar de 0,0121 m² tanto para interseção entre pares quanto para buracos internos da união, derivado da quantização de seis casas decimais. A comparação com o limite municipal 2025 continua separada, pois a diferença de contorno entre as edições 2022 e 2025 é aproximadamente 0,7 km² e não representa buraco interno na malha de setores.


## Bloqueio operacional da GitHub Actions — 09/11/2026

- Após a execução `42671168961`, as execuções `42672174236` (SHA `671e9589827337196c1252359ea5cb4b8e22f900`), `42672449139` (SHA `7d1e003f73c3b848e7ce0e37b6301cf11e17b012`) e `42672558750` (SHA `23e9b78ebb894e2a7da7b92e410466a86ba982d7`) terminaram com conclusão `failure`, mas a API do GitHub retornou `total_count=0` em `/actions/runs/{id}/jobs` para as três: nenhum job foi criado, nenhum passo executou e não há log de pytest para interpretar. Isso não é uma reprovação dos testes; é uma falha anterior à criação do job.
- A tentativa de reexecutar a execução `42672449139` foi recusada pelo GitHub com HTTP 403 e mensagem `This workflow run cannot be retried`. Não foi alterada a configuração da Actions nem criado outro workflow para contornar a política.
- O código e os testes geográficos foram commitados na branch. A validação isolada de referência IBGE continua comprovada somente no SHA `33c6b94a0f0dd231be9dbb100a93824d6d008e26`, execução `42671168961`; não se atribui aprovação às alterações posteriores sem execução real.
- A validação final do Bloco 2 permanece bloqueada até a Actions voltar a criar jobs e até a regeneração local autorizada pelo responsável. Nenhuma mudança em `main`, merge, deploy, Cloudflare ou publicação foi feita.
