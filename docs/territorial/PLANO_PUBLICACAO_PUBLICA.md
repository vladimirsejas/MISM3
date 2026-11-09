# Plano de publicação pública do MISM3

**Data de preparação:** 08/11/2026  
**Diretriz do autor:** site principal, mapa territorial e painel de gestão públicos, com dados agregados, transparência metodológica e ressalvas explícitas.  
**Estado:** preparação para publicação; ainda não é autorização para retirar o bloqueio de indexação, publicar uma versão oficial ou integrar a PR #92 à `main`.

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
- [ ] Índice de CEP revisado quanto à necessidade, privacidade e termos de redistribuição (o filtro D4 foi corrigido e 3 CEPs de setores protegidos saíram; ver seção 7.3 para o que continua pendente).
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
- Foi preparado, **sem aplicar**, um pacote de histórico reescrito e verificado (ver `docs/territorial/RUNBOOK_SANEAMENTO_HISTORICO.md`).

### 7.3 Risco residual conhecido

- **CEPs com poucos endereços:** 63 CEPs do índice têm menos de 3 endereços (36 com 1 endereço e 27 com 2). A D4 vale para setores; para CEPs não há decisão do autor. Cada entrada publica latitude e longitude com 4 casas (cerca de 11 m) e um raio de referência: o raio é só metadado, a coordenada é a do conjunto de endereços (no caso de 1 endereço, o próprio ponto). **Decisão pendente:** omitir esses CEPs, generalizar a coordenada para o centro do setor ou manter.
- **Subtração:** o total municipal do IBGE (201.418) é público; com todos os setores visíveis publicados, a soma dos 17 setores protegidos, em conjunto, pode ser obtida por subtração. É uma soma de 17 setores, não o valor de nenhum deles (o número não é reproduzido aqui de propósito), mas é uma limitação da decisão de manter os demais setores visíveis.
- **Conteúdo de tiles:** com a caixa de imagens marcada, Esri ou OpenStreetMap recebem IP, user-agent e a região do mapa vista (ver `reproducao/AUDITORIA_REDE_RESUMO.md`).

### 7.4 Licenças e termos (nada confirmado como autorização)

- **OpenStreetMap, tiles:** a política de uso (https://operations.osmfoundation.org/policies/tiles/) exige Referer em sites; o MISM3 usa `no-referrer`. Em 06/11/2026 os tiles responderam 200 sem Referer nos testes, mas isso não garante que a política seja cumprida nem que não haverá bloqueio.
- **Esri World Imagery / mapa-base:** os termos oficiais não foram confirmados; respostas de funcionários da Esri em fóruns indicam restrição de licença para uso do serviço. **Bloqueio de publicação até confirmar os termos ou trocar de provedor.**
- **IBGE, INEP e CNES/DATASUS:** os textos oficiais de licença e de redistribuição não foram confirmados nesta verificação (as buscas retornaram só material sobre os produtos). Permanecem como pendência em `AVISOS-DE-TERCEIROS.md`.

### 7.5 Verificações no navegador (Chromium sem janela, servidor local)

- Em sete cenários (página inicial, orientador com mensagem fictícia, CEP no mapa de serviços com a caixa desmarcada e marcada, mapa territorial com clique em setor, privacidade e qualidade dos dados): 0 ocorrências do texto ou do CEP digitados em URL, cabeçalho ou corpo; 0 requisições diferentes de GET; armazenamento do navegador vazio; requisições externas só com a caixa de imagens marcada (30 pedidos de tiles à Esri). O único erro de console foi um 404 esperado de `dados/servicos.json`, arquivo opcional por desenho.
- Não foram feitos teste em aparelho real, leitor de tela, outros navegadores nem verificação de domínio e HTTPS próprios.
