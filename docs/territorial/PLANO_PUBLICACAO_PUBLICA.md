# Plano de publicação pública do MISM3

**Data de preparação:** 08/11/2026  
**Diretriz do autor:** site principal, mapa territorial e painel de gestão públicos, com dados agregados, transparência metodológica e ressalvas explícitas.  
**Estado:** preparação para publicação; ainda não é autorização para retirar o bloqueio de indexação, publicar uma versão oficial ou integrar a PR #92 à `main`.

## Atualização técnica — 09/11/2026

Esta atualização prevalece sobre números e descrições anteriores deste documento que tenham sido alterados pela auditoria de fechamento. As seções abaixo preservam o histórico de preparação de 08/11/2026.

- **CEP e privacidade:** o índice público foi saneado de 1.367 para 1.243 entradas. Os 44 CEPs com menos de três endereços continuam generalizados para o centro do setor. A regra D4 protege 17 setores; a regeneração final dos derivados ainda depende da conferência local das contagens brutas.
- **Geometria:** a geração não aplica Douglas–Peucker nem `coverage_simplify`; preserva os vértices e arredonda somente para seis casas decimais. A referência original IBGE 2022 e o limite municipal 2025 estão em `dados/referencia_ibge/`, sem contagens demográficas. O teste de correspondência compara os 408 setores publicados à referência original.
- **Topologia:** o limiar de detecção de sobreposição por par e de buraco interno é 0,0121 m², derivado da resolução aproximada de 0,11 m × 0,11 m das coordenadas com seis casas. A malha de referência não apresenta sobreposições nem buracos internos acima desse limiar. O limiar de relevância de 1.000 m² é separado.
- **Centroides:** a reauditoria sobre a geometria original sem arredondamento encontrou 11 centroides matemáticos externos em 408 setores. A produção preserva os 397 centroides internos e usa ponto representativo interno apenas nos 11 casos externos. A lista de códigos está testada.
- **Áreas:** a soma dos setores de 2022 com `pyproj.Geod(ellps="GRS80")` é 498,422 km². O limite municipal 2025 tem 498,402 km² pelo mesmo método e atributo oficial `AREA_KM2` de 498,403 km². A diferença de contorno entre as edições 2022 e 2025 é da ordem de 0,7 km² em cada lado da comparação; não é um buraco interno nem uma sobreposição entre setores.
- **CRAS/UBS:** 22 dos 28 equipamentos têm coordenada individual documentada. Seis usam centro do CEP cadastral e raio operacional do índice no cenário de sensibilidade. Esse cenário pode alterar as distâncias de CRAS e UBS, além das escolas. A aproximação não é apresentada como coordenada individual verificada.
- **Tiles e atribuição:** a política OSM foi lida e a camada permanece opt-in, com Referer de origem e atribuição visível. Os termos Esri foram lidos; o acesso gratuito é condicionado a uso não comercial, e a qualificação institucional para eventual uso futuro ainda não foi formalmente confirmada. Os tiles não são redistribuídos.
- **Fontes e licenças:** o inventário distingue disponibilidade pública, licença identificada e autorização de redistribuição. Os arquivos de referência geométrica não recebem licença aberta por este repositório; `LICENSE-DADOS-E-DOCUMENTACAO.md` exclui explicitamente `dados/referencia_ibge/`. A decisão registrada pelo responsável para `mapaRioClaroUSF.geojson` foi preservada sem reabertura.
- **Estado de liberação:** `noindex, nofollow` permanece. Esta atualização não autoriza deploy, publicação oficial, merge ou alteração da Cloudflare. A regeneração final dos indicadores dependentes das contagens brutas e D4 será feita localmente pelo Claude Code no computador do responsável.

## 1. Modelo de publicação escolhido

O MISM3 será apresentado em três entradas públicas e relacionadas:

1. **Site principal:** orientação e catálogo de serviços para mulheres.
2. **Mapa territorial:** indicadores agregados por setor censitário e pontos de equipamentos institucionais.
3. **Painel de gestão:** leitura territorial e página de qualidade/procedência dos dados.

O painel não será tratado como área administrativa privada. Como o projeto é estático, as páginas e os arquivos JSON/GeoJSON servidos ao navegador podem ser acessados diretamente. Portanto, a revisão de publicação precisa abranger os arquivos de dados, não apenas o que a interface mostra.

## 2. Trabalho já preparado nesta etapa

- Criada `web/privacidade.html`, com explicação pública sobre dados, processamento local, CEP, mapas externos, hospedagem e limites.
- Adicionado acesso à página de privacidade no rodapé do site, na navegação do mapa territorial e na página de qualidade dos dados.
- Mantido `noindex, nofollow` nas três páginas principais e na página de privacidade. A retirada será feita somente na etapa de liberação.
- Criado `web/tests/privacidade.test.js` para conferir a página, os links, as camadas cartográficas opcionais e o bloqueio de indexação pré-lançamento.

## 3. Bloqueios de publicação que precisam ser resolvidos

### 3.1 Privacidade e setores pequenos — decisão D4

A regra D4 aprovada pelo autor foi aplicada aos 17 setores com menos de 5 pessoas ou menos de 3 domicílios:
- população e domicílios foram removidos dos campos públicos do GeoJSON;
- densidade, pessoas por domicílio e distâncias/indicadores derivados por setor foram suprimidos;
- os agregados demográficos e médias dos 13 bairros afetados foram omitidos como supressão complementar;
- totais municipais de população e domicílios foram retirados do painel territorial para reduzir risco de reconstrução por subtração;
- polígonos e pontos de equipamentos institucionais foram preservados.

A regra está centralizada em `pipeline/privacidade_territorial.py`. Os testes devem garantir que a geração dos dados não reintroduza os valores. A supressão reduz o risco, mas não representa garantia absoluta de anonimato: novas variáveis, filtros, períodos e fontes devem passar por nova análise de combinação e inferência.

**Ponto de qualidade corrigido:** a redação da interface agora distingue o critério completo — menos de 5 pessoas ou menos de 3 domicílios — e não chama todos os setores afetados de “população muito pequena”.

### 3.2 CEP e dados de endereço

`web/dados/cep_indice.json` contém 1.387 entradas, com CEP, coordenadas aproximadas, raio operacional, setor censitário e quantidade agregada de endereços. O CEP digitado pela usuária é consultado localmente, mas o próprio índice é um arquivo público entregue ao navegador.

Antes do lançamento, confirmar:
- a base de origem e os termos aplicáveis à redistribuição do CNEFE;
- a necessidade de publicar todos os campos do índice;
- se a granularidade e as contagens associadas a CEPs são adequadas à finalidade pública;
- se a página explica com clareza que a posição é aproximada.

A página oficial do IBGE descreve o CNEFE como cadastro georreferenciado de domicílios e estabelecimentos e informa que a divulgação segue diretrizes de sigilo estatístico. Isso é contexto relevante, mas não substitui a confirmação dos termos específicos de reutilização do arquivo e do derivado publicado.

### 3.3 Proveniência e qualidade geográfica

- Seis registros de CRAS/UBS têm coordenadas no catálogo, mas não têm método/raio de localização documentados.
- A auditoria geométrica identificou nove centroides fora dos polígonos em 408 setores; nenhum foi substituído.
- A divergência de área entre a soma setorial e a referência municipal permanece documentada, sem ajuste artificial.
- Distância em linha reta não representa percurso, tempo, capacidade, vaga ou acesso efetivo.

Esses limites precisam permanecer visíveis no mapa e no painel.

### 3.4 Licenças e direitos de terceiros

O inventário `AVISOS-DE-TERCEIROS.md` ainda registra itens sem origem, licença ou autorização de redistribuição confirmadas:
- ilustrações da capa/faixa e arte do brasão estilizado;
- condições de uso do brasão municipal;
- termos aplicáveis aos arquivos e derivados do IBGE/CNEFE e da malha censitária;
- termos aplicáveis aos dados e derivados do INEP;
- conteúdo factual do catálogo municipal e horários de ônibus;
- termos operacionais dos tiles da Esri e do OpenStreetMap.

A disponibilidade pública de uma fonte não deve ser tratada automaticamente como autorização irrestrita de redistribuição. Para cada item, confirmar a licença/termos ou substituir/remover o recurso antes da publicação.

### 3.5 Conteúdo do catálogo de serviços

O catálogo publicado contém 168 registros. A documentação ainda registra itens não conferidos e contagens de telefone/endereço/horário calculadas em versões anteriores do catálogo. Antes do lançamento:
- recalcular as contagens a partir dos 168 registros atuais;
- confirmar os serviços marcados como não conferidos;
- revisar especialmente os serviços de proteção à mulher e os contatos locais;
- atualizar a data de verificação e as fontes de cada item.

### 3.6 Dados escolares e granularidade de publicação

O arquivo `web/dados/oferta_educacao_infantil.json` continha 69 registros de matrículas por escola, incluindo uma contagem de apenas duas matrículas na faixa de 0 a 3 anos. A interface consumia somente os totais por rede; a lista escola a escola não era necessária ao navegador.

A preparação removeu os registros por escola de `oferta_educacao_infantil.json`, que agora contém apenas `meta` e `totais_por_rede`. A auditoria encontrou também o objeto `censo_escolar_2025` em 43 registros de `escolas_municipais.json`; esse campo foi removido do arquivo público e do gerador `pipeline/escolas_municipais.py`. A localização e a identificação institucional das escolas continuam nos cadastros próprios, sem publicar matrículas ou turmas por unidade. Os testes `pipeline/tests/test_escolas_municipais_publicacao.py` e `web/tests/privacidade_territorial.test.js` impedem a reintrodução desses dados.

### 3.7 Documentação e avaliação com usuárias

- `README.md` e `docs/estado_do_projeto.md` precisam refletir o estado real de 08/11/2026 e a decisão de publicação pública.
- Testes automatizados não equivalem a validação com mulheres usuárias. A documentação deve continuar dizendo isso até que exista avaliação real, consentida e documentada.
- O painel de qualidade avalia integridade estrutural, mas não comprova validação topológica completa nem correção de todas as coordenadas.

## 4. Infraestrutura e lançamento

### 4.1 Repositório público e histórico anterior

O repositório GitHub `vladimirsejas/MISM3` está público. A auditoria confirmou que a branch `main` ainda contém:
- os valores originais de população e domicílios dos 17 setores D4 em `web/dados/setores.geojson` e os valores dos 408 setores e totais municipais em `web/dados/territorio.json`;
- 69 registros de matrículas por escola em `web/dados/oferta_educacao_infantil.json`, incluindo uma contagem de apenas duas matrículas na faixa de 0 a 3 anos;
- vínculos e dados do Censo Escolar por unidade em `web/dados/escolas_municipais.json`.

O histórico público conserva versões anteriores desses arquivos. Além disso, relatórios antigos de auditoria CEP continham CEPs de teste, coordenadas aproximadas e retângulos de tiles. Os relatórios e rastros detalhados (que ainda estavam versionados na ponta da branch até 08/11/2026) foram removidos da árvore e substituídos por `reproducao/AUDITORIA_REDE_RESUMO.md`, e os scripts passaram a exigir CEP informado explicitamente e gravar saídas no diretório temporário local. Isso também não apaga os detalhes de commits anteriores. A branch de publicação possui os arquivos sanitizados e agregados, mas isso não remove os dados das versões públicas da `main` nem do histórico Git. A mitigação exige decisão separada do autor: tornar temporariamente o repositório privado e planejar a limpeza do histórico, ou autorizar uma estratégia de sanitização do repositório. Não fazer alteração na `main`, mudança de visibilidade ou reescrita de histórico sem autorização expressa.

### 4.2 Estado da PR e infraestrutura

- A PR #92 permanece aberta, em draft e sem merge. A branch de trabalho é `feat/mapa-territorial-como-mapa-principal`; não alterar `main` sem autorização expressa. A comparação mais recente estava 255 commits à frente e nenhum atrás.
- O Cloudflare Pages confirmou deploy bem-sucedido da prévia no commit `8e45ddc`. URL da branch: https://feat-mapa-territorial-como-m.mism3-observatorio.pages.dev. Os commits posteriores ainda precisam de novo deploy; a inspeção visual e os testes manuais em desktop e celular continuam pendentes.
- A GitHub Actions concluiu com sucesso no commit `c34a903` (run [42532559670](https://github.com/vladimirsejas/MISM3/actions/runs/42532559670)): 279 testes Python passaram, 1 foi ignorado, a suíte JavaScript passou e todos os conjuntos de perfis independentes atingiram 100% (20/20). As alterações posteriores de remoção de CEPs/coordenadas de artefatos de auditoria exigem a nova CI da ponta atual; não são consideradas validadas até a conclusão desse workflow. Isso não substitui validação com usuárias reais.
- Há um serviço Cloudflare Workers chamado `mism3`, separado do Pages. O build do commit `89683e7` falhou; os builds dos commits mais recentes `3af80c9`, `1237aff` e `398a145` aparecem em andamento no painel. O repositório não contém código/configuração de Worker correspondente na árvore auditada. Confirmar no painel da Cloudflare se esse serviço participa de algum domínio/rota do MISM3; não confundir seu estado com o deploy bem-sucedido do Pages.
- O bloqueio `noindex, nofollow` deve permanecer até a aprovação dos critérios abaixo.
- Antes da liberação: executar teste de navegação em desktop e celular, teste de requisições externas, verificação dos arquivos publicados, checagem de domínio/HTTPS e plano de rollback.

## 5. Critérios de liberação

A publicação só deve avançar quando todos estiverem atendidos:

- [x] D4 aplicada aos arquivos de publicação e aos geradores da branch; [ ] exposição histórica mitigada na `main` pública, em commits antigos e em relatórios anteriores.
- [x] Índice de CEP revisado quanto à privacidade (filtro D4 corrigido e regra de CEP com poucos endereços aplicada); [ ] termos de redistribuição do CNEFE/IBGE ainda não confirmados (seção 7.4).
- [ ] Licenças, autorizações e atribuições dos recursos de terceiros confirmadas ou recursos substituídos.
- [ ] Serviços e telefones prioritários conferidos; contagens recalculadas.
- [ ] README, estado do projeto, política pública e metadados atualizados; a lista de matrículas por escola foi removida do arquivo público.
- [x] CI automatizada aprovada no commit `c34a903`; [ ] nova execução aprovada na ponta atual após a remoção dos artefatos de auditoria.
- [ ] Prévia do Pages validada em desktop e celular (ver seção 7.5: medição automatizada feita em Chromium; falta aparelho real).
- [ ] Dependência do Worker esclarecida.
- [ ] Autor autoriza a retirada de `noindex` e a publicação oficial.

## 6. Regra de segurança para esta fase

A preparação de código continua somente na branch `feat/mapa-territorial-como-mapa-principal`. Não fazer merge, não alterar `main`, não mudar a visibilidade do repositório, não reescrever histórico, não retirar `noindex` e não declarar o MISM3 oficialmente publicado sem autorização expressa do autor.

## 7. Estado verificado em 08/11/2026 (saneamento de privacidade e histórico)

Esta seção registra o que foi **medido** nesta data, sem declarar a publicação segura.

### 7.1 O que a ponta da branch passou a garantir (testado)

- Nos 53 arquivos JSON/GeoJSON da árvore, nenhum valor numérico de população, domicílios ou densidade está ligado aos 17 setores protegidos pela D4.
- O filtro D4 do índice de CEP comparava o código do setor do CNEFE (com sufixo de letra, como `...201P`) com o do GeoJSON (só dígitos) e **nunca casava**; o teste usava códigos sem sufixo e passava. Corrigido, com teste sobre os dados reais: 3 CEPs de setores protegidos saíram de `web/dados/cep_indice.json`, e o carimbo dos indicadores foi regenerado (só o hash do índice mudou).
- Relatórios de auditoria de rede com CEPs de teste, coordenadas e registro de requisições, e as capturas do mapa coloridas por população, saíram da árvore; os scripts continuam e as saídas detalhadas são ignoradas pelo Git.
- Testes na ponta: 35 de 35 arquivos JavaScript e 282 testes Python passaram; os 18 conjuntos de perfis (20 frases cada) tiveram 100% e o plano de prioridades 5/5.

### 7.2 Exposição que continua, fora da árvore atual (depende do proprietário)

- **Cloudflare Pages, produção:** em 08/11/2026 o domínio de produção `mism3-observatorio.pages.dev`, que serve a `main`, ainda publicava os valores de população e domicílios dos 17 setores protegidos (17 de 17 com valor numérico), o total municipal (201.418), as matrículas individuais de 43 escolas e os 3 CEPs de setores protegidos. A prévia da branch desta PR, medida no mesmo dia, não publicava nada disso (0 de 17; total nulo; 0 escolas com matrícula; 0 CEPs).
- **Cloudflare Pages, prévias antigas:** cada commit e cada PR gera uma URL pública de prévia e elas continuam servindo o que havia naquele commit. Duas prévias de commits de 07/11/2026, testadas, serviam 408 de 408 setores com população. Só o proprietário, no painel da Cloudflare, pode apagar essas implantações ou restringir o acesso às prévias.
- **GitHub:** o repositório é público (1 estrela, 0 forks em 08/11/2026). O histórico de `main`, as demais branches, as tags `v0.9-revisao` e `v1.0-pesquisa` e as referências de PR (`refs/pull/*`, 106 delas) ainda contêm versões antigas desses arquivos. Reescrever o histórico e fazer push forçado só alcança branches e tags; as referências de PR e os commits em cache só saem com pedido de remoção ao suporte do GitHub (ou recriando o repositório).
- **Atualização de 09/11/2026:** a produção da Cloudflare passou a servir a versão saneada (medido); o histórico de branches e tags foi reescrito e conferido em clone novo (ver a seção 7 de `docs/territorial/RUNBOOK_SANEAMENTO_HISTORICO.md`). **Continuam expostos:** as 98 referências `refs/pull/*` do GitHub e os commits antigos por SHA (pendente: pedido ao suporte do GitHub) e as prévias antigas da Cloudflare (pendente: acesso ao painel).

### 7.3 Risco residual conhecido

- **CEPs com poucos endereços (tratado em 08/11/2026):** os CEPs com menos de 3 endereços perderam o ponto próprio: a coordenada passou a ser o centro do setor censitário e o raio cobre o setor (300 a 1.500 m); sem setor utilizável, o CEP é omitido. Regra e limite conhecido (124 CEPs apontam para 25 códigos de setor do CNEFE que não existem na malha publicada) em `POLITICA_PRIVACIDADE_DADOS_TERRITORIAIS.md`.
- **Subtração:** o total municipal do IBGE (201.418) é público; com todos os setores visíveis publicados, a soma dos 17 setores protegidos, em conjunto, pode ser obtida por subtração. É uma soma de 17 setores, não o valor de nenhum deles (o número não é reproduzido aqui de propósito), mas é uma limitação da decisão de manter os demais setores visíveis.
- **Conteúdo de tiles:** com a caixa de imagens marcada, Esri ou OpenStreetMap recebem IP, user-agent e a região do mapa vista (ver `reproducao/AUDITORIA_REDE_RESUMO.md`).

### 7.4 Licenças e termos (verificado em 08/11/2026; só o que foi lido em página oficial conta como confirmado)

- **OpenStreetMap, tiles (política lida na íntegra em https://operations.osmfoundation.org/policies/tiles/):** exige URL `https://tile.openstreetmap.org/{z}/{x}/{y}.png`, `Referer` válido em páginas web (e proíbe política de referrer restritiva), atribuição visível ("© OpenStreetMap contributors" com link para a licença), respeito ao cache e nenhuma busca antecipada de tiles fora da vista da pessoa. **Ajuste feito:** só os tiles do OpenStreetMap enviam o `Referer` com a origem do site (`referrerPolicy: "origin"`, sem caminho, `#` ou CEP) e a atribuição ganhou o link; o restante do site continua com `no-referrer`. Medido: 15 de 15 pedidos com 200 e `Referer` igual à origem. O que a política diz sobre uso intenso ou comercial não foi avaliado para este projeto; o carregamento só acontece depois de a pessoa marcar a caixa.
- **Esri, mapa-base (World Light Gray Base e Reference):** a página do item e a de atribuição da Esri não carregaram na leitura; o JSON do serviço informa `copyrightText` e remete os termos a https://goto.arcgisonline.com/maps/World_Imagery, **que não foi lido**. Os termos que autorizam (ou não) o uso por URL direta num site público **não estão confirmados**. **Bloqueio de publicação até confirmar os termos ou trocar de provedor.** A camada continua opt-in (caixa desmarcada).
- **IBGE:** o índice oficial do FTP do Censo 2022 diz que "todos os arquivos aqui disponíveis são públicos" (https://ftp.ibge.gov.br/Censos/Censo_Demografico_2022/), mas **nenhuma licença nomeada nem regra de atribuição foi lida**: as páginas `www.ibge.gov.br` e a ficha de metadados da malha responderam 403 à ferramenta de leitura. Pendente: ler a política de uso do IBGE num navegador.
- **INEP:** as páginas de dados abertos e de microdados do INEP (https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos) indicam, segundo o resumo obtido na leitura (não confirmado palavra por palavra), a licença do site Creative Commons Atribuição-SemDerivações 3.0 e que o INEP restringe formatos por causa da LGPD. Não há regra de redistribuição específica do Censo Escolar nessas páginas. **Se a licença vale para os conjuntos de dados e se o uso em dados derivados e agregados é compatível com "SemDerivações" é questão jurídica em aberto.**
- **CNES/DATASUS:** o portal de dados abertos do Ministério da Saúde (https://dadosabertos.saude.gov.br/) declara, textualmente, que todo o conteúdo do site está sob a licença Creative Commons Atribuição-SemDerivações 3.0. O site do CNES (`cnes.datasus.saude.gov.br`) não pôde ser lido (falha de DNS), então nada específico do CNES foi confirmado.
- **Prefeitura de Rio Claro, Procon-SP e demais fontes municipais e estaduais:** não verificadas nesta etapa.

### 7.5 Verificações no navegador (Chromium sem janela, servidor local)

- Em sete cenários (página inicial, orientador com mensagem fictícia, CEP no mapa de serviços com a caixa desmarcada e marcada, mapa territorial com clique em setor, privacidade e qualidade dos dados): 0 ocorrências do texto ou do CEP digitados em URL, cabeçalho ou corpo; 0 requisições diferentes de GET; armazenamento do navegador vazio; requisições externas só com a caixa de imagens marcada (30 pedidos de tiles à Esri). O único erro de console foi um 404 esperado de `dados/servicos.json`, arquivo opcional por desenho.
- Não foram feitos teste em aparelho real, leitor de tela, outros navegadores nem verificação de domínio e HTTPS próprios.
