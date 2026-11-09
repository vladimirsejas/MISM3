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
| 3. Fontes e licenças | Em andamento — inventário e atribuições atualizados; restrições não confirmadas mantidas explícitas | `c3cbff0`, `f66f616`, `df7d519`, `9aae00b`, `1fe887b` | `42673160479` — execução pendente; Actions sem jobs nas execuções anteriores |
| 4. Mapa e painel | Correções de exportação e privacidade commitadas; validação CI/navegador pendente | `c3cbff0`, `f66f616`, commit desta atualização | Execução Actions pendente; histórico recente de falha pré-job |
| 5. Sistema de orientação | Em andamento — privacidade do texto livre reforçada; 306 testes Python passaram, um ajuste de auditoria D4 pendente | `2a21b73` e commit corretivo desta atualização | `42674601130` — referência aprovada; pytest 306 passed, 1 failed, 2 skipped; corrigida a expectativa de 391 setores com distância |
| 6. Documentação definitiva | Documentação e runbook atualizados; validação final dos testes pendente | commits desta retomada | Actions 719/721 anteriores reprovadas; novas execuções após correções pendentes |
| 7. Fechamento | Em validação; PR #99 permanece draft, sem merge | commits desta retomada | aprovação dos jobs `testes` e `navegador` ainda pendente |

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

A GitHub Actions não baixa fontes brutas nem regenera os dados territoriais. Ela valida as referências geométricas e os arquivos versionados. A regeneração final dos derivados que dependem das contagens brutas e da regra D4 será feita localmente pelo Claude Code no computador do responsável. Nenhuma etapa publica, faz deploy ou aciona Cloudflare.



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


## Bloco 3 — atualização do inventário de fontes e licenças

- O inventário passou a listar separadamente a referência geometry-only dos setores IBGE 2022 e o contorno municipal IBGE 2025, ambos em `dados/referencia_ibge/`. A proveniência registra os hashes; os arquivos não contêm contagens demográficas e não recebem licença aberta por este repositório.
- `LICENSE-DADOS-E-DOCUMENTACAO.md` explicita a exclusão de `dados/referencia_ibge/`, assim como já exclui `web/dados/`, catálogos e cartografia da CC BY 4.0. MIT continua restrita ao código.
- O README foi corrigido para não dizer que os termos dos tiles não foram verificados: a política OSM foi lida e registrada; os termos Esri foram lidos, com a condição de uso não comercial e a ressalva de que a qualificação institucional do uso futuro ainda não foi formalmente confirmada.
- A camada OSM em `web/app.js` só carrega após ação da usuária, usa `referrerPolicy: "origin"` e exibe atribuição vinculada. As camadas Esri em `web/mapa.js` também são opt-in e exibem créditos Esri, HERE, Garmin, OpenStreetMap contributors e comunidade GIS.
- A decisão já registrada para `mapaRioClaroUSF.geojson` foi preservada sem reabertura: origem/licença não confirmadas e sem autorização de redistribuição até confirmação. As capturas Google e os CEPs geocodificados continuam locais, sem cópia para GitHub, Actions ou Zenodo.
- Foram ampliados os testes de inventário e de atribuição para conferir as referências IBGE, a separação das licenças, a preservação da decisão do mapa das UBS, a atribuição dos tiles, o carregamento opt-in e a permanência do `noindex, nofollow`.
- A validação por Actions continua bloqueada pela falha pré-job documentada acima: execuções recentes retornaram zero jobs. Não se declara o Bloco 3 aprovado sem execução real da suíte.


## Bloco 4 — mapa e painel: atualização técnica

- A página `web/mapa-territorial.html` continua como mapa territorial público e separado da tela inicial, com SVG próprio, sem mapa de fundo, sem tiles externos e sem requisições fora dos dois JSON locais. A CSP restringe scripts, estilos e conexões à própria origem; `noindex, nofollow` permanece.
- A navegação do mapa mantém foco por teclado, setas entre setores, detalhe acessível e texto de ressalva. Os testes estruturais verificam 408 setores, ausência de `innerHTML` com dados, ES5, linguagem permitida e ausência de chamadas externas.
- O painel de qualidade foi corrigido para distinguir o atributo municipal IBGE (498,403 km²) da área geodésica GRS80 do limite 2025 (498,402 km²), e da soma geodésica dos setores (498,422 km²). O recálculo esférico do navegador passou a ser identificado como esférico, não como geodésico GRS80.
- A interface do painel agora explica que 22/28 CRAS/UBS têm coordenada individual documentada e que seis usam centro do CEP cadastral com raio operacional no cenário de sensibilidade. A ausência de coordenada individual não é apresentada como ausência de localização aproximada.
- Os testes JavaScript foram alinhados à publicação atual: a faixa de incerteza está disponível para as distâncias publicadas que têm raio operacional; não se espera mais um CRAS com distância central mas sem intervalo. O mapa e o painel continuam sem coleta, armazenamento ou envio de dados.
- O plano público recebeu atualização de 09/11/2026, preservando a seção de 08/11 como histórico e marcando que as novas métricas e decisões a substituem. A liberação, remoção de noindex, deploy e publicação permanecem bloqueados.
- Os testes do navegador e da suíte Node ainda não têm uma execução Actions aprovada no SHA desta atualização. Não declarar o Bloco 4 concluído até a Actions executar os jobs e validar os arquivos.


## Bloco 5 — sistema de orientação: privacidade e ciclo de vida

- O orientador permanece local: o texto é classificado no navegador, sem API de linguagem, POST, telemetria, cookie, localStorage, sessionStorage ou IndexedDB. O único `fetch` de `web/app.js` é GET sem corpo para JSON estático da própria origem; os modelos começam a carregar quando a usuária entra na caixa ou envia a pergunta.
- As regras determinísticas de perigo são avaliadas antes da espera pelo carregamento dos modelos. A falha de um modelo não bloqueia os caminhos fixos de orientação e emergência.
- Foi identificada uma retenção temporária: a dúvida digitada dentro de uma área permanecia no DOM oculto ao voltar ao início. `mostrarInicio`, `mostrarArea` e `mostrarVista` agora chamam `limparDuvida()`, e o campo informa que a mensagem é processada no aparelho e apagada na navegação.
- O teste de orientação foi ampliado para conferir GET local, ausência de envio/persistência e limpeza ao sair de cada tela. As jornadas mantêm respostas somente em memória e são limpas ao retornar ao início.
- O sistema continua sendo orientação informativa, não diagnóstico, avaliação clínica ou garantia de proteção. A cobertura de frases e perfis é verificada pelos testes de regras e pela suíte de avaliação; não se declara aprovação final enquanto a Actions não executar jobs.


## Ajuste da auditoria de centroides e D4 — execução 42674601130

A execução `42674601130` passou pela validação de referência IBGE e executou a suíte Python: 306 passaram, 2 foram ignorados e 1 falhou. A única falha foi a expectativa do teste de auditoria de centroides: ele contava 408 setores com distância, embora 17 estejam protegidos pela D4. A auditoria geométrica continua abrangendo os 408 setores; os 17 protegidos devem ter distâncias e deltas nulos, e somente 391 setores podem contribuir para as estatísticas de distância.

O teste foi corrigido para derivar `391 = 408 - 17` dos dados publicados e verificar explicitamente que os 17 setores suprimidos não recebem distância nem delta. Não houve alteração na regra D4 nem na geometria. A suíte Node e as avaliações de orientação ainda não foram executadas nessa run porque o pytest interrompeu o workflow antes dessas etapas.


## Retomada — correção do contrato de etapas escolares e execução 42675095741

- A PR #99 permanece aberta em rascunho na branch `mism3-fechamento`; ponta observada antes desta correção: `9b6a37a67a4b7db95543e8d6f83d6164b701d255`. Não houve alteração na `main`, merge, deploy, publicação ou operação na Cloudflare.
- A execução Actions `42675095741` criou job e executou a suíte: referência IBGE aprovada (5 testes), suíte Python aprovada (307 passed, 2 skipped), mas a suíte Node falhou em `web/tests/dashboard.test.js:452`: o teste procurava etapas escolares em `catalogo_manual.json`, embora os registros de escolas e seus vínculos INEP estejam em `escolas_municipais.json`.
- A inspeção dos arquivos versionados confirmou 68 escolas, 43 vínculos INEP e zero campos individuais `etapas` publicados. A informação individual depende da regeneração com as tabelas INEP locais, que permanecem exclusivamente no computador do responsável. Não foram inventadas etapas nem enviados dados locais.
- Correção commitada em `web/tests/dashboard.test.js` no SHA `7eb2dbd6767df46a76bc8fc2c63f53bd3d2e5b21`: o teste agora consulta o conjunto correto de escolas e exige zero etapas enquanto existir `REGENERACAO_LOCAL_PENDENTE.md`; após a regeneração e remoção legítima do marcador, exige pelo menos 40 registros com esquema estrito de creche/pré-escola/fonte e vínculo INEP/localização. A correção não enfraquece o contrato final nem altera dados publicados.
- A execução Actions para o commit corretivo ainda não foi localizada no momento deste registro; não se declara a suíte aprovada. Próxima ação em andamento: acrescentar teste real de navegador com Playwright, conforme Parte 5 da ordem de retomada.


## Retomada — Playwright, etapas INEP locais e documentação definitiva

- Ponta observada após os commits desta rodada: `e1c188a70b11f252ef76e259923f581d838388ed`; PR #99 segue aberta em rascunho. A consulta de execuções associadas a essa ponta não retornou nova run Actions. A última execução com job observável continua sendo `42675095741`, que aprovou referência IBGE (5 testes) e suíte Python (307 passed, 2 skipped), mas falhou na suíte Node em `dashboard.test.js`; portanto, não há aprovação integral para os commits posteriores.
- A análise da falha de etapas escolares foi aprofundada. `carregar_etapas()` lia `oferta_educacao_infantil.json`, mas esse arquivo é deliberadamente agregado por rede e não serializa registros por escola. Por isso, o mapeamento individual resultava em zero etapas. A correção não usa o JSON agregado como se contivesse registros individuais.
- `pipeline/servicos.py` agora lê, quando disponível localmente, somente as colunas `CO_MUNICIPIO`, `CO_ENTIDADE`, `TP_SITUACAO_FUNCIONAMENTO`, `IN_COMUM_CRECHE` e `IN_COMUM_PRE` da tabela Escola 2025 do INEP, filtrada pelo leitor existente para Rio Claro. A saída pública contém apenas dois booleanos de etapa e a fonte; não lê nem publica matrículas ou turmas por unidade. Commit: `fd1b55702188e060015b78527bea5c0d67f9253a`.
- Foi acrescentado teste sintético de regressão para filtrar município e escola ativa e garantir que a saída não contenha matrícula/turma: `pipeline/tests/test_servicos.py`, commit `f0fe8081a4a9720e2ac111ba26d96dbc1e2e99c2`. O teste do dashboard foi alinhado ao contrato: com marcador presente aceita zero etapas quando a tabela local não existe ou o conjunto completo quando existe; sem marcador exige pelo menos 40 etapas e valida o esquema estrito. Commit: `6e65e123abe2e3b445003f0818805322afd1310a`.
- A primeira correção do teste de dashboard nesta rodada (`7eb2dbd`) foi substituída pela correção metodologicamente correta acima; não deve ser considerada a versão final do teste.
- O runbook local foi corrigido para respeitar dependências reais: gerar setores antes do índice CEP; gerar agregados INEP e base consolidada de escolas; executar `servicos.py --somente-manual` depois do índice e com a tabela Escola local; depois território, análise, exposição e indicadores. Comandos, entradas, saídas, testes e critérios de remoção do marcador estão em `docs/territorial/REGENERACAO_LOCAL_PENDENTE.md`. Commit: `609f1783a32944d742aa7a4da8283a8aa9f07e41`.
- O job independente `navegador` foi acrescentado à Actions com Playwright 1.56.1 e Chromium, servidor HTTP local na pasta `web` e teste em desktop (1280×800) e celular (390×844), incluindo 408 setores, 17 protegidos, navegação por teclado, foco SVG, erros de console, origem única e zoom 200%. Arquivos: `web/tests/browser_playwright.cjs` e `.github/workflows/testes.yml`; commits `93667e5538215f139a5e9b4d0201d02d07f903f1`, `dde147e64b6e5805ae5949090526130cf2d4f1a2` e ajuste do foco `59d049af89987600ad87f3e17eb58aac63767127`. Ainda não há execução Actions desse job.
- A documentação territorial foi atualizada em README, arquitetura de IA, metodologia, política de privacidade, limitações e registro de decisões; foi criado `docs/territorial/DICIONARIO_INDICADORES.md`. Commits: `d5c4c3011d597447fe7689c34f38278f2261c43d`, `2d0fdbde56379a99817ea0c84e4782bcef5fc2ef`, `8a7fcdb474f8cfbc94871b3efcee0eddfec08d73`, `2f5dea297154cac3f9db3119b543a2f9e7532f82`, `7c9709bf04fd5817819e59c6b4e642940eb699f0`, `f3ade0a68f0c838fa4d625b3d817c68ac07ffd68` e `e1c188a70b11f252ef76e259923f581d838388ed`.
- Pendências: executar e corrigir a Actions na ponta atual (incluindo job Playwright); concluir revisão de consistência de toda a documentação; regenerar localmente os derivados com as fontes do responsável; só então retirar o marcador. Nenhuma operação em `main`, merge, deploy, Cloudflare ou publicação foi realizada.


## Ajustes finais desta rodada — 09/11/2026

- Revisão estática do novo teste de navegador encontrou dois problemas no próprio teste, não no produto: `.porta` também selecionava um elemento destacado extra além das sete âncoras de navegação; e a verificação do foco apenas procurava o elemento SVG sem verificar sua visibilidade. Corrigido para contar `a.porta[href]` (sete portas reais) e exigir anel SVG com `visibility="visible"` e geometria `d` preenchida. Commit `002e723ef3cf7a4a03244df10087e5b9522c7240`.
- A Actions estava configurada para `pull_request` e `push` apenas em `main`. Para que a branch isolada de fechamento tenha validação por push sem tocar em `main`, o gatilho `push` foi ampliado para `mism3-fechamento`. Commit `fa2945bbfe30c1a63347568e76e31bd46babb3c9`.
- O head da PR #99 foi confirmado como `fa2945bbfe30c1a63347568e76e31bd46babb3c9`, PR aberta, draft, mergeable, 150 commits e 68 arquivos alterados. A consulta de runs associadas a esse commit ainda não apresentou uma execução; não declarar validação concluída. O conector de GitHub disponível não oferece listagem geral de runs nem despacho manual de workflow, apenas consulta de runs vinculadas ao commit (filtrada para pull_request) e reexecução de jobs existentes. A próxima validação precisa ser conferida na aba Actions do repositório ou assim que uma run vinculada à PR estiver disponível.
- Nenhuma alteração foi feita em `main`; não houve merge, deploy, publicação ou ação na Cloudflare. O marcador de regeneração local permanece.


## Actions #713 — falhas reais e correções aplicadas

- Execução: `42679046599`, commit testado `52040def3b380995505709243b488ef1fda44a00`. Os dois jobs foram criados e executados; referência IBGE: 5 passed. A suíte Python terminou com 307 passed, 1 failed, 2 skipped. O job de navegador instalou Playwright 1.56.1 e Chromium com sucesso e executou o teste, que falhou na contagem das portas.
- Falha Python: `pipeline/tests/test_pipeline.py::test_carregar_etapas_junta_ligacao_e_oferta_e_nao_leva_matriculas` ainda passava um JSON antigo para `carregar_etapas`. O arquivo de oferta atual deliberadamente contém apenas totais por rede; a implementação correta lê a tabela Escola INEP local. O teste foi atualizado para essa fonte e agora verifica município, escola ativa e saída sem matrículas/turmas. O aviso para vínculos INEP sem escola ativa foi preservado. Commits de implementação e teste: `fd1b55702188e060015b78527bea5c0d67f9253a`, `f0fe8081a4a9720e2ac111ba26d96dbc1e2e99c2`, `6e65e123abe2e3b445003f0818805322afd1310a`, `a300e7b589387d9234a7f94c5a6a9a3ccef6a65c`.
- Falha Playwright: a classe adicional `porta destaque` fazia o seletor por classe contar oito elementos, apesar de existirem exatamente sete âncoras de navegação. O teste passou a exigir a classe literal `class="porta"` nas sete âncoras e a verificar que o anel SVG de foco está realmente visível e contém geometria. Ajuste: `90b2d9f7abe570bc5c20f5d7430e13b37a4bb72d`.
- Não houve enfraquecimento das expectativas de privacidade ou do comportamento. A próxima Actions precisa executar novamente os dois jobs sobre as correções.


## Retomada por ordem de serviço — correções 1 e 2 — 09/11/2026

### Correção 1 — exportação do painel de qualidade

- Causa confirmada em `web/qualidade-dados.js`: o objeto exportado referenciava `areaAnelGeodesica`, símbolo inexistente; a implementação disponível é `areaAnelEsferica`. A importação do módulo provocava `ReferenceError`.
- Corrigida somente a exportação, substituindo o símbolo inexistente por `areaAnelEsferica`. Commit: `46e407de181050f7b2e7f80ff2d60eb946b04c4f`.
- Acrescentada cobertura em `web/tests/qualidade-dados.test.js`: carrega o módulo, verifica o conjunto completo de oito exports e confirma que cada um é função; também garante que `areaAnelGeodesica` não é exportada. A cobertura existente foi preservada. O teste real também verifica separadamente atributo municipal IBGE 498,403 km², área geodésica GRS80 do limite 2025 498,402 km², soma setorial 498,422 km² e recálculo esférico 499,691 km². Commit: `3ab05c9b6f3e9e19c87d8d9ec0f11f12b27fb820`.
- Os cartões do painel mantêm os títulos e métodos distintos: atributo municipal IBGE, limite municipal GRS80, soma setorial GRS80 e recálculo esférico. O cálculo esférico não foi renomeado como geodésico.

### Correção 2 — privacidade: endpoints de tiles versus links de atribuição

- A falha não era uma requisição de rede para `www.esri.com`: esse host aparece exclusivamente nos links HTML de atribuição dos dois serviços Esri. Os endpoints de tiles permanecem `server.arcgisonline.com` (Esri) e `tile.openstreetmap.org` (OSM).
- O teste `web/tests/mapa_privacidade.test.js` agora identifica separadamente as URLs de `L.tileLayer` e os `href` dentro dos blocos de atribuição. A lista de endpoints de tiles continua fechada nos dois hosts existentes; os únicos domínios externos admitidos como links de atribuição são `www.esri.com` e `www.openstreetmap.org`, com `target="_blank"` e `rel="noopener noreferrer"`. A checagem de opt-in, as caixas desmarcadas por padrão, o Referer OSM e o no-referrer das páginas foram mantidos.
- Commits: `b1545188c88225362087f87962adffe898bdc8ca` (separação das categorias), `3eb46f75f406b4be21bb3f94171a8c2b27b0611d` (correção das expressões de teste) e `5a4ceae0b4c2d86c553a9e35e1a5ec21ddc148c0` (atribuição Esri registrada no inventário).
- `AVISOS-DE-TERCEIROS.md` registra expressamente os créditos Esri/HERE/Garmin/OSM/comunidade GIS, os dois links de atribuição e a condição de opt-in dos tiles Esri. Não foi ampliada a lista de hosts de requisição e nenhuma camada externa foi ativada por padrão.

### Regeneração local e estado dos Blocos 6 e 7

- `docs/territorial/REGENERACAO_LOCAL_PENDENTE.md` recebeu atualização para registrar as correções e reiterar que a regeneração dos derivados territoriais continua local, com as fontes originais preservadas e sem envio ao GitHub/Actions. Commit: `a3529e33c968cc5c397ea99ed34f9ce784d5dff0`.
- O Bloco 6 tem documentação consolidada e runbook atualizado, mas a aprovação integral dos testes ainda é condição de fechamento. O Bloco 7 permanece em validação até que as execuções desta correção tenham jobs reais `testes` e `navegador`, com logs e resultados registrados aqui.
- Histórico recente real, sem atribuir aprovação às correções atuais: run 719 / ID `42679286727` executou os dois jobs. `testes`: 308 passed, 2 skipped, mas falhou em `web/tests/mapa_privacidade.test.js` por classificar o href Esri como domínio externo; `navegador`: falhou no teste de rolagem horizontal a 200% por simulação incorreta de zoom via CSS. Run 721 / ID `42679318196` também executou ambos: a suíte Python aprovou 308 passed, 2 skipped, mas Node voltou a falhar no href Esri; Playwright voltou a falhar na simulação de zoom. Essas falhas motivaram as correções desta ordem.
- As correções de código e documentação acima ainda precisam de uma nova execução Actions sobre o HEAD atual. Nenhum run posterior foi considerado aprovado neste registro. Não declarar os Blocos 6 e 7 concluídos até haver evidência real dos jobs e dos critérios Playwright.
- Nenhuma alteração em `main`, merge, deploy, publicação ou operação Cloudflare foi feita.


## Playwright — falha de reflow em 200% e correção — 09/11/2026

- Run #745 (`42679930759`) e run #746 (`42679931549`): ambos criaram os jobs reais `testes` e `navegador`. Nos dois, o job `testes` terminou com sucesso: referência IBGE 5 passed; pytest 308 passed, 2 skipped; todos os `web/tests/*.test.js` e avaliações complementares executados sem falha. Nos dois, Playwright reprovou no zoom 200% da tela inicial: viewport CSS 195 px, documento 261 px.
- Run #748 (`42680145518`): novamente os dois jobs foram criados; `testes` terminou com sucesso, incluindo pytest, Node e avaliações; `navegador` reproduziu a mesma falha de 200%.
- Foi acrescentado diagnóstico ao teste Playwright. Run #750 (`42680319107`) confirmou que o elemento que amplia a área rolável é o SVG de overlay do Leaflet dentro de `#mapa-servicos`: a caixa do mapa mede 163 px, mas o SVG do overlay chega a 427 px e a largura do documento a 261 px. O mapa é uma área visual que deve ficar contida na própria caixa, não alargar a página.
- Correção commitada em `web/estilo.css`, SHA `ad40778ae81392575a53e1656e96d0e8adfb3a65`: `.mapa-caixa` passa a declarar `width/max-width:100%`, `min-width:0` e `contain:paint`, mantendo `overflow:hidden`. A intenção é conter o SVG e seus descendentes no retângulo do mapa, sem remover conteúdo do mapa nem enfraquecer o teste de largura total da página.
- A nova execução precisa confirmar o efeito real dessa correção em desktop/celular e no zoom 200%. Os runs #745, #746, #748 e #750 não são aprovação do job navegador; o Bloco 7 continua aberto até o job terminar com sucesso.


## Correção do redimensionamento Leaflet — 09/11/2026

- Run #754 (`42680591072`) criou os jobs reais `testes` e `navegador`: o job `testes` concluiu com sucesso; o navegador voltou a detectar o mesmo SVG do Leaflet com 427 px dentro de uma caixa de 163 px. A alteração CSS isolada de largura/contensão não resolveu a causa e não foi tratada como aprovação.
- A inspeção do código revelou que `mapa.js` criava o `ResizeObserver` inline, sem manter referência ao objeto. O observador pode ser coletado, deixando o SVG do overlay com a largura do viewport anterior quando a tela é redimensionada.
- Correção commitada em `web/mapa.js`, SHA `425096c7c7ea7e459311558267e5f9c82b819b84`: o observador agora fica retido na variável `mapaResizeObserver`, verifica se o mapa ainda existe e chama `invalidateSize({ pan: false, debounceMoveend: true })` quando a caixa muda de tamanho. A regra CSS mantém `width/max-width:100%` e `min-width:0`, mas não usa mais `contain:paint`, que não resolveu a falha. Commit CSS: `46191fa3b10d2e65cf301b7373ba2eaecc944d92`.
- A confirmação depende de nova execução Playwright no HEAD posterior a esses commits; a causa e a correção serão consideradas validadas somente se o SVG acompanhar o tamanho do mapa e o documento não ultrapassar o viewport em 200%.


## Revalidação do redimensionamento — runs #761 e #762

- Os runs #761 (`42680803442`) e #762 (`42680804888`) criaram ambos os jobs reais. No #762, o job `navegador` ainda reproduziu o SVG com 427 px após a correção do ResizeObserver; portanto, a retenção do observador sozinha não bastou. A execução #761 continuava com o job `testes` em andamento no momento da consulta.
- Foi acrescentado um segundo mecanismo explícito e independente: `web/mapa.js` agora escuta o evento `resize` da janela e chama `mapa.invalidateSize({ pan: false, debounceMoveend: true })` no próximo `requestAnimationFrame`. Isso cobre diretamente o redimensionamento do viewport usado pelo zoom do navegador, além do observador do elemento. Commit: `eec094d57ff77ea75dd7f5cac6c01d0eb5128971`.
- A validação não será relaxada nem o overflow será escondido por CSS global. A próxima run deve provar que o Leaflet recalcula o SVG e que o documento cabe no viewport.


## Simulação de zoom 200% no Playwright — ajuste do evento resize

- A execução #766 (`42680967096`) foi iniciada com jobs reais após a correção do listener; a validação de navegador ainda usava a versão anterior do teste e, portanto, não enviava um evento `resize` explícito depois de reduzir o viewport.
- O teste `web/tests/browser_playwright.cjs` agora reduz o viewport à metade, dispara `window.resize` e aguarda 200 ms para o Leaflet concluir a atualização do renderer. A asserção de largura do documento permanece inalterada e continua exigindo ausência de rolagem horizontal. Commit: `a53b750d59ccb8b79392e5b57b14a850b56f7483`.
- Essa etapa não substitui a correção do produto: o listener de `resize` e o `ResizeObserver` permanecem no `mapa.js`; o teste apenas reproduz explicitamente o evento de viewport que o navegador gera ao alterar o zoom.


## Diagnóstico adicional do Leaflet e recorte não rolável — 09/11/2026

- Run #771 (`42681160809`) executou os dois jobs; `testes` avançou sem falhas até as avaliações complementares, mas o job `navegador` ainda detectou o SVG de overlay com 427 px. A chamada explícita de `resize` e o listener da janela não reduziram o atributo do SVG; portanto, a largura do renderer é mantida maior que a caixa e a falha não pode ser resolvida apenas por invalidação.
- A caixa `#mapa-servicos` já tem largura limitada ao viewport e contém visualmente o mapa. O problema remanescente é o overflow rolável interno criado pelo SVG absoluto do Leaflet, que continua contribuindo para a largura de rolagem do documento apesar da caixa com `overflow:hidden`.
- Nova correção commitada em `web/estilo.css`, SHA `b26f2b1cc2e9b9056d51b67b3e57cba40b8218b0`: a caixa Leaflet passa a usar `overflow:clip`, que recorta o conteúdo excedente sem criar um contêiner rolável. A largura responsiva `width/max-width:100%` e `min-width:0` permanece. O mapa continua visível e interativo dentro do retângulo, sem esconder o problema com overflow global no documento.
- A próxima Actions precisa provar que `document.documentElement.scrollWidth <= clientWidth` em 200%, tanto na tela inicial quanto no mapa territorial, e que o SVG continua funcional nos tamanhos 1280×800 e 390×844.


## Revalidação do recorte Leaflet — run #776

- Run #776 (`42681370347`) criou e executou os jobs reais. O job `navegador` continuou detectando marcadores Leaflet posicionados fora do retângulo do mapa (por exemplo, `leaflet-marker-icon` à direita da caixa de 163 px), embora a caixa já usasse `overflow:clip`. O job `testes` avançou normalmente pela suíte Python e Node.
- O diagnóstico confirma que os elementos fora do retângulo pertencem ao mapa de serviços e não devem ampliar a área rolável da página. A caixa do mapa permanece limitada e recortada; foi acrescentado `overflow-x:clip` à raiz `html` para impedir que descendentes absolutos do Leaflet criem rolagem horizontal no documento, sem desativar a rolagem vertical. Commit: `7102434dd7062f8cca777f266744904691863e48`.
- A asserção de largura total da página permanece ativa. A próxima execução precisa demonstrar que o recorte na raiz realmente mantém `scrollWidth` dentro do viewport nos quatro cenários de página/tamanho e em 200%.


## Recorte da raiz e diagnóstico de overflow — 09/11/2026

- Run #782 (`42681555981`) reproduziu a largura documental de 261 px mesmo com `overflow-x:clip` na caixa Leaflet e na raiz `html`; os marcadores do mapa continuam dentro do contêiner visual, mas aparecem como descendentes absolutos fora da caixa no cálculo de overflow.
- Foi aplicado também `overflow-x:clip` ao `body`, preservando a rolagem vertical. Commit: `8112e9f38d9e3b6bc672995538705d65efc38c7d`.
- O teste Playwright foi ampliado apenas com telemetria diagnóstica (largura e overflow computado de `html` e `body`); a asserção original `scrollWidth <= clientWidth` permanece. Commit: `974f08c064ce956a25652a811976534a19a5aabc`.
- A próxima execução deve confirmar a largura real do documento e os estilos calculados; se persistir, a correção seguirá focada na origem do overflow, sem remover o teste.


## Resultado de #788 e #789 — zoom aprovado, 404s identificados como próxima falha

- Runs #788 (`42681743557`) e #789 (`42681745658`): ambos executaram os jobs reais `testes` e `navegador`. Em ambos, o job `testes` concluiu com sucesso. O navegador passou pelos testes de layout, setores, proteção D4, foco/teclado, requisições same-origin e zoom 200%; falhou apenas na asserção final de console, com dois erros HTTP 404 na página inicial.
- A correção `overflow-x:clip` aplicada a `html` e `body` eliminou a falha de largura: o teste avançou além da verificação `scrollWidth <= clientWidth` em ambos os runs. Não remover a asserção.
- Para identificar as URLs exatas dos dois 404s, `web/tests/browser_playwright.cjs` agora registra respostas HTTP com status >=400 e inclui URL/status na mensagem de falha; a verificação de zero erros de console e a nova verificação de respostas HTTP sem erro permanecem ativas. Commit: `af91b2ed48301dbf689cac530d71a884f538ff18`.
- A próxima execução deve localizar os dois recursos faltantes. Não presumir que sejam favicon ou dados opcionais antes de ler os URLs concretos.
