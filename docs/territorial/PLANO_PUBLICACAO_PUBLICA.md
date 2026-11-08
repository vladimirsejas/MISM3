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

A base territorial contém 408 setores. Dezessete atendem ao critério D4: menos de 5 pessoas **ou** menos de 3 domicílios.

A auditoria confirmou que:
- `web/dados/setores.geojson` contém os campos exatos de pessoas e domicílios desses setores;
- `web/dados/indicadores_territoriais.json` repete os valores por setor;
- `web/dados/territorio.json` mantém densidade setorial, mesmo quando a razão pessoas/domicílios está nula para setores pequenos;
- a interface atual sinaliza os setores, mas não suprime os valores.

A política de privacidade registra que sinalização não equivale a proteção estatística e que os parâmetros de supressão ainda não foram definidos. A publicação pública exige uma decisão explícita sobre a revisão de D4: manter os valores com ressalva, suprimir os campos de baixa contagem em todos os arquivos públicos, ou agregar os setores afetados. Se houver supressão, ela precisa alcançar também os indicadores derivados e os arquivos brutos servidos ao navegador; esconder somente o número na tela não basta.

**Ponto adicional de qualidade:** a mensagem atual do mapa diz “população muito pequena”, embora o critério também inclua setores com menos de três domicílios. Alguns desses setores têm dezenas de pessoas e apenas um domicílio cadastrado. A redação precisa refletir as duas condições para não induzir interpretação errada.

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

### 3.6 Documentação e avaliação com usuárias

- `README.md` e `docs/estado_do_projeto.md` precisam refletir o estado real de 08/11/2026 e a decisão de publicação pública.
- Testes automatizados não equivalem a validação com mulheres usuárias. A documentação deve continuar dizendo isso até que exista avaliação real, consentida e documentada.
- O painel de qualidade avalia integridade estrutural, mas não comprova validação topológica completa nem correção de todas as coordenadas.

## 4. Infraestrutura e lançamento

- A PR #92 permanece aberta, em draft e sem merge. A branch de trabalho é `feat/mapa-territorial-como-mapa-principal`; não alterar `main` sem autorização expressa.
- A prévia do Cloudflare Pages teve deploy bem-sucedido no commit `89683e7`. A validação da prévia do commit mais recente precisa ser conferida após os testes.
- Há também um registro de build falho de um serviço Cloudflare Workers chamado `mism3`. O repositório não contém diretório ou configuração de Worker correspondente na árvore auditada. Confirmar no painel da Cloudflare se esse serviço participa de algum domínio/rota do MISM3; não confundir essa falha com o deploy do Pages.
- O bloqueio `noindex, nofollow` deve permanecer até a aprovação dos critérios abaixo.
- Antes da liberação: executar teste de navegação em desktop e celular, teste de requisições externas, verificação dos arquivos publicados, checagem de domínio/HTTPS e plano de rollback.

## 5. Critérios de liberação

A publicação só deve avançar quando todos estiverem atendidos:

- [ ] Decisão D4 formalizada e aplicada de modo consistente a todos os arquivos públicos.
- [ ] Índice de CEP revisado quanto à necessidade, privacidade e termos de redistribuição.
- [ ] Licenças, autorizações e atribuições dos recursos de terceiros confirmadas ou recursos substituídos.
- [ ] Serviços e telefones prioritários conferidos; contagens recalculadas.
- [ ] README, estado do projeto, política pública e metadados atualizados.
- [ ] CI completa aprovada na ponta atual da branch.
- [ ] Prévia do Pages validada em desktop e celular.
- [ ] Dependência do Worker esclarecida.
- [ ] Autor autoriza a retirada de `noindex` e a publicação oficial.

## 6. Regra de segurança para esta fase

A preparação continua somente na branch `feat/mapa-territorial-como-mapa-principal`. Não fazer merge, não alterar `main`, não retirar `noindex` e não declarar o MISM3 oficialmente publicado sem autorização expressa do autor.
