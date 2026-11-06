# Plano técnico da Fase 2 — mapa territorial do MISM3

**Status:** especificação documental; não implementada.  
**Data:** 06/11/2026.  
**Pré-condição:** iniciar somente depois da etiqueta `v1.0-pesquisa`, em branch própria, conforme decisão D3 em `DECISOES_DO_AUTOR.md`.

## 1. Objetivo e limites

A Fase 2 deverá validar a integridade espacial e estatística do mapa territorial, comparar representações alternativas dos setores, formalizar a associação espacial de equipamentos, aplicar a regra aprovada de supressão/agregação e demonstrar reprodutibilidade e privacidade das saídas.

O escopo continua restrito a dados públicos, agregados e institucionais. Não incluir dados pessoais, CEP ou endereço residencial de pacientes, estudantes, famílias ou usuárias. O CEP institucional de equipamento permanece apenas como cenário aproximado de análise de sensibilidade, conforme D2.

Esta fase não autoriza alterar a consulta por CEP existente no site nem remover `pipeline/indice_cep.py` ou `web/dados/cep_indice.json`. Mudanças nesses componentes exigem autorização específica. A Fase 2 não deve modificar a etiqueta `v1.0-pesquisa` nem reescrever dados de referência fora do escopo aprovado.

## 2. Organização prevista dos arquivos

A lista é uma proposta de organização; nomes finais devem ser conferidos com a estrutura existente antes de qualquer implementação.

### Arquivos existentes que poderão ser alterados

| Arquivo | Mudança prevista | Condição |
|---|---|---|
| `pipeline/setores.py` | Validações explícitas de geometria, códigos, atributos e soma agregada | Somente se a inspeção identificar lacuna; preservar geração atual |
| `pipeline/territorio.py` | Integridade dos agregados, ponto representativo e metadados de qualidade | Não alterar indicadores fora do escopo aprovado |
| `pipeline/analise_territorial.py` | Associação equipamento-setor, regra de fronteira e distâncias comparáveis | Preservar comportamento existente não relacionado |
| `pipeline/exposicao_distancia.py` | Comparação entre cenários de localização e ponto representativo | Manter os dois cenários de CEP institucional |
| `web/territorio.js` | Avisos de qualidade, supressão e limitações | Não alterar fluxos não territoriais |
| `web/mapa.js` e `web/mapa-servicos.js` | Somente se for necessário exibir distinção entre coordenada de catálogo e aproximação institucional | Não modificar a consulta por CEP sem autorização específica |
| `web/tests/*` e/ou testes em `pipeline/tests/*` | Testes automatizados das regras novas | Adicionar sem apagar testes existentes |

### Arquivos novos que poderão ser criados

- `pipeline/validar_territorio.py`: validações de integridade espacial e estatística, caso não caibam adequadamente nos módulos existentes.
- `pipeline/privacidade_territorial.py`: auditoria de estrutura, conteúdo, proveniência e saídas, caso não exista mecanismo equivalente.
- `pipeline/tests/test_validar_territorio.py`: testes de geometria, códigos, totais e associações espaciais.
- `pipeline/tests/test_privacidade_territorial.py`: testes negativos com dados fictícios e testes de publicação.
- `web/tests/territorio.test.js`: testes de interface e avisos, se a estrutura de testes atual permitir arquivo separado.
- Relatório versionado de validação, com metadados, checksums e resultados não sensíveis, em caminho a aprovar antes da execução.

Não criar cópias paralelas dos JSONs de produção nem novos catálogos sem necessidade demonstrada.

## 3. Validações espaciais e estatísticas

### 3.1 Integridade dos setores

Verificações propostas:

- unicidade e preenchimento do código de setor;
- ausência de geometrias nulas ou vazias;
- tipos geométricos esperados e coordenadas finitas;
- validade topológica (anéis, auto-interseções e polígonos inválidos);
- limites geográficos compatíveis com o município e sistema de referência declarado;
- detecção de sobreposições indevidas e lacunas relevantes entre setores, distinguindo limites municipais e áreas legitimamente sem setor;
- correspondência entre número de feições, códigos e registros de origem.

**Critério de aceitação:** todos os códigos devem ser únicos; geometrias nulas/vazias ou inválidas devem ser zero após correção documentada; sobreposições/lacunas devem ser inexistentes ou justificadas; nenhuma geometria pode estar fora da área de referência sem justificativa.  
**Exige execução no computador do autor:** sim, para rodar a validação na cópia integral do repositório e nas entradas geográficas locais.

### 3.2 Soma das populações e domicílios

Comparar somas por setor com os totais de referência e com os metadados das fontes. Confirmar no dicionário oficial o significado das variáveis de origem antes de declarar equivalência semântica. Verificar valores ausentes, negativos, duplicações e conversões.

**Critério de aceitação:** soma dos valores válidos igual ao total de referência escolhido, ou divergência explicitamente explicada por escopo, setor excluído ou regra de fonte; nenhum valor ausente/negativo tratado silenciosamente como zero.  
**Exige execução no computador do autor:** sim, para recalcular sobre os arquivos locais; a confirmação do dicionário da fonte exige consulta documental, não execução de código.

### 3.3 Centroide geométrico versus ponto interno representativo

Executar análise de sensibilidade mantendo constantes a malha, os equipamentos elegíveis, os parâmetros de distância e os dois cenários de localização institucional.

Cenários:

1. **Centroide geométrico:** centroide calculado a partir da geometria do setor. Pode ficar fora do polígono em geometrias côncavas ou multipartes.
2. **Ponto interno representativo:** ponto garantidamente dentro do polígono, produzido por método geoespacial documentado (por exemplo, ponto sobre superfície/representative point, conforme biblioteca adotada).

Procedimento:

- registrar biblioteca, versão, sistema de coordenadas e método;
- contar centroides fora do respectivo polígono;
- gerar um ponto interno por setor, preservando identificador;
- calcular distâncias para os mesmos equipamentos e categorias;
- comparar diferença absoluta e relativa por setor e categoria;
- comparar mediana, percentil 90 e proporções acima dos limiares já definidos, quando pertinentes;
- identificar setores com mudanças relevantes e explicar efeitos de geometria;
- não escolher o resultado mais favorável: justificar pelo critério geométrico e pela finalidade estatística.

**Critério de aceitação:** cada setor válido deve possuir exatamente um ponto representativo por método; o ponto interno deve estar coberto pelo polígono correspondente; nenhum equipamento ou setor pode ser silenciosamente descartado; resultados comparativos devem ser reproduzíveis e acompanhados de limitações.  
**Exige execução no computador do autor:** sim, para gerar os pontos e recalcular as distâncias. A especificação e os testes podem ser escritos antes, sem executar o cálculo.

### 3.4 Cruzamento espacial equipamento-setor e pontos na fronteira

Atribuir equipamento ao setor que contém sua coordenada institucional. Definir previamente o tratamento de pontos que caem exatamente na fronteira ou que, por precisão numérica, intersectam mais de um polígono.

Regra proposta para aprovação:

1. aplicar predicado espacial de inclusão com semântica documentada;
2. se o ponto pertencer a exatamente um setor, atribuir a esse setor;
3. se tocar a fronteira e for associado a mais de um setor, não duplicar a contagem: aplicar regra determinística usando o código de setor como desempate técnico, registrando `fronteira=true` e o método;
4. se a incerteza da coordenada for maior que a precisão necessária para decidir, classificar como associação indeterminada e manter fora da contagem por setor até revisão;
5. nunca deslocar coordenadas para forçar uma associação sem registrar a transformação.

A regra determinística por código é uma proposta técnica para evitar dupla contagem, não uma afirmação de que o equipamento pertence substantivamente a um dos setores quando está exatamente na fronteira.

**Critério de aceitação:** cada equipamento elegível é contado no máximo uma vez; casos de fronteira são identificados e auditáveis; casos incertos não são atribuídos por suposição; a soma por setor mais os casos pendentes corresponde ao total elegível do catálogo.  
**Exige execução no computador do autor:** sim, para testar as geometrias e coordenadas reais. Os testes unitários com geometrias artificiais podem ser escritos pelo ChatGPT e executados pelo autor.

## 4. Distâncias e cobertura de localização

### 4.1 Fórmula e unidades

Manter a fórmula de Haversine documentada na metodologia, com latitude e longitude convertidas para radianos e raio terrestre explicitamente declarado. A implementação existente em `pipeline/analise_territorial.py` registra `R = 6371,0088 km`; qualquer mudança deve ser justificada e versionada.

Testar pontos coincidentes (distância zero), pares conhecidos de teste, simetria, resultado finito e não negativo, tratamento de coordenadas inválidas e conversão consistente para quilômetros. Não misturar metros e quilômetros nos JSONs.

**Critério de aceitação:** resultados em quilômetros; tolerância numérica definida nos testes; pontos coincidentes resultam em zero dentro da tolerância; coordenadas inválidas são rejeitadas, não convertidas silenciosamente.  
**Exige execução no computador do autor:** sim, para executar testes e recalcular os resultados finais; a redação dos testes não exige execução pelo Claude Code.

### 4.2 Cobertura de localização

Publicar denominador e numerador por categoria, método de localização e cenário. Diferenciar coordenada de catálogo, centro do CEP institucional e localização pendente. Não combinar silenciosamente as categorias de precisão.

**Critério de aceitação:** os totais de cadastrados, localizados e pendentes fecham por categoria; os cenários `coordenadas_do_catalogo` e `com_centro_do_cep` permanecem identificáveis; a cobertura é exibida junto dos indicadores; nenhum centro de CEP é rotulado como coordenada exata.  
**Exige execução no computador do autor:** sim, para recalcular e conferir as saídas a partir dos dados atuais.

## 5. Reprodutibilidade

A execução com as mesmas entradas, versões de dependências, parâmetros e configuração deve produzir saídas semanticamente idênticas e, quando serialização determinística for viável, arquivos byte a byte idênticos.

Registrar:

- identificador/versão das entradas;
- versão do código e dependências;
- parâmetros e sistema de referência;
- data/hora de geração;
- checksums de entradas e saídas;
- ordenação estável de registros e propriedades;
- diferenças esperadas quando metadados temporais variam.

**Critério de aceitação:** duas execuções controladas com as mesmas entradas e ambiente produzem os mesmos valores e a mesma estrutura; diferenças apenas de timestamp devem ser explicitamente isoladas; qualquer divergência numérica deve ser explicada.  
**Exige execução no computador do autor:** sim. É uma das tarefas pontuais que o Claude Code deve executar uma vez, após a implementação e antes da aprovação.

## 6. Privacidade: auditoria além dos nomes de colunas

A auditoria deverá abranger o ciclo completo, não apenas cabeçalhos.

### 6.1 Auditoria estrutural

Inspecionar nomes de arquivos, extensões, esquemas, cabeçalhos, propriedades GeoJSON, chaves JSON, estruturas aninhadas, metadados, comentários, HTML, JavaScript, relatórios, arquivos temporários e logs.

**Critério de aceitação:** inventário completo dos arquivos processados e publicados; campos proibidos e estruturas inesperadas identificados; nenhum arquivo desconhecido ignorado silenciosamente.  
**Exige execução no computador do autor:** sim, para varrer a árvore real de arquivos e os diretórios temporários/logs.

### 6.2 Auditoria de conteúdo

Inspecionar valores e texto, não só nomes de campo: padrões de CPF, telefone pessoal, CEP residencial, endereço individual, nomes e identificadores diretos ou indiretos. Considerar conteúdo em arrays, propriedades aninhadas, texto livre, mensagens de erro e metadados. Os valores suspeitos não devem ser copiados para o relatório.

**Critério de aceitação:** nenhum dado pessoal proibido nas saídas territoriais; ocorrências suspeitas devem ser investigadas e resolvidas antes da publicação; relatório registra contagem e classificação sem reproduzir o valor sensível.  
**Exige execução no computador do autor:** sim, sobre arquivos completos e dados intermediários locais.

### 6.3 Auditoria de proveniência

Verificar fonte, data, método, confiança e vínculo institucional de cada coordenada. Diferenciar coordenada própria do catálogo, localização aproximada por CEP institucional e localização pendente.

**Critério de aceitação:** todo ponto publicado possui proveniência rastreável; método aproximado está rotulado; ponto sem evidência suficiente não é apresentado como verificado.  
**Exige execução no computador do autor:** sim, para cruzar os registros atuais e gerar relatório de pendências; a revisão documental pode ser feita pelo ChatGPT com os arquivos disponíveis.

### 6.4 Auditoria de saídas, intermediários e logs

Inspecionar todos os arquivos finais e intermediários, inclusive arquivos temporários, cache, relatórios, dumps, logs de console, logs persistidos, mensagens de exceção, artefatos de teste e arquivos destinados à publicação. Verificar também os dados carregados pelo navegador e arquivos de exportação.

**Critério de aceitação:** nenhum artefato contém dados pessoais proibidos; nenhum arquivo intermediário sensível é incluído na publicação; logs não persistem valores de entrada pessoal; arquivos públicos contêm apenas os campos necessários.  
**Exige execução no computador do autor:** sim, porque depende do ambiente de execução e de seus diretórios reais.

### 6.5 Auditoria de rede

Inspecionar chamadas de rede, URLs, parâmetros, cabeçalhos, corpos, telemetria e requisições de geocodificação. Confirmar que nenhum CEP digitado por usuário, endereço residencial ou dado pessoal seja transmitido.

**Critério de aceitação:** nenhuma transmissão de dado pessoal proibido; chamadas externas e finalidades documentadas; teste negativo demonstra que dados fictícios proibidos não saem do navegador/ambiente.  
**Exige execução no computador do autor:** sim, com inspeção do navegador/rede no ambiente local. Uma leitura estática do código pelo ChatGPT não comprova ausência de tráfego em execução.

### 6.6 Testes negativos

Criar fixtures inteiramente fictícias com padrões proibidos em campos, valores, estruturas aninhadas, logs e arquivos intermediários. Confirmar que a auditoria detecta e bloqueia a publicação. Não utilizar dados reais para simular esses casos.

**Critério de aceitação:** cada classe de dado proibido possui pelo menos um teste negativo; o pipeline falha de forma segura e não inclui o valor sensível no log ou relatório.  
**Exige execução no computador do autor:** sim, para executar a suíte após sua implementação.

## 7. Distribuição do trabalho: ChatGPT e Claude Code

### O que o ChatGPT pode preparar

- especificar a arquitetura e os critérios de aceitação;
- escrever os módulos Python e os testes unitários/integração em branch autorizada, após a etiqueta `v1.0-pesquisa`;
- escrever os testes JavaScript e os avisos de interface;
- preparar fixtures sintéticas;
- revisar diffs, documentação, resultados de testes e relatórios que o autor trouxer;
- comparar JSONs e conferir consistência documental a partir dos arquivos fornecidos.

O ChatGPT não deve afirmar que um teste passou, que um JSON foi reproduzido ou que a auditoria de rede foi aprovada sem evidência de execução.

### O que precisa ser executado uma vez no computador do autor com Claude Code

Após a implementação e revisão do diff, usar Claude Code apenas para operações dependentes do ambiente local:

1. instalar/validar as dependências já previstas no projeto, sem atualizações desnecessárias;
2. executar `pytest` e os testes JavaScript existentes e novos;
3. recalcular os indicadores e distâncias com as entradas aprovadas;
4. executar duas vezes o pipeline controlado e comparar os JSONs para demonstrar reprodutibilidade;
5. inspecionar arquivos intermediários e logs produzidos na execução;
6. executar a auditoria de rede no navegador/ambiente local e guardar evidência não sensível.

O Claude Code não deve redesenhar a arquitetura, alterar arquivos fora do escopo, atualizar dependências por conveniência, mudar dados de entrada ou corrigir automaticamente divergências sem relatório. Cada divergência deve ser apresentada para decisão.

### Sequência mínima recomendada

1. ChatGPT prepara código, testes e revisão do diff em branch própria.
2. Autor revisa o escopo e autoriza a execução local.
3. Claude Code executa a suíte, o pipeline, a comparação de reprodutibilidade e as verificações locais uma única vez.
4. Resultados e logs não sensíveis retornam para revisão.
5. ChatGPT analisa os resultados, corrige apenas problemas autorizados e documenta o que foi efetivamente verificado.
6. Autor aprova os resultados antes de qualquer merge/publicação.

## 8. Critérios globais para considerar a Fase 2 concluída

A Fase 2 só poderá ser considerada concluída quando:

- integridade e validade das geometrias forem demonstradas;
- códigos e somas populacionais forem reconciliados com as fontes;
- a sensibilidade centroide versus ponto interno estiver calculada e documentada;
- a regra de fronteira estiver aprovada e aplicada sem dupla contagem;
- distâncias, unidades e cobertura forem validadas;
- os dois cenários de localização institucional permanecerem claramente separados;
- a regra de supressão/agregação tiver sido aprovada pelo autor e testada;
- a reprodução dos resultados for demonstrada com as mesmas entradas;
- auditorias estrutural, de conteúdo, proveniência, saídas, intermediários, logs e rede forem documentadas;
- testes automatizados passarem no ambiente do autor;
- limitações e itens não verificados estiverem explícitos.

## 9. Itens ainda não verificados

- Estado real das geometrias e existência de setores inválidos, sobrepostos ou com lacunas; **não verificado** nesta fase.
- Quantidade de centroides fora dos respectivos polígonos; **não verificado**.
- Número de equipamentos sobre fronteiras ou com associação espacial ambígua; **não verificado**.
- Distribuição de setores que seriam afetados por cada limiar de supressão; **não verificado**.
- Reprodutibilidade atual dos JSONs e resultados do pipeline; **não verificado**.
- Conteúdo efetivo de arquivos intermediários e logs produzidos em execução; **não verificado**.
- Tráfego de rede em execução no navegador; **não verificado**.
- Aprovação final dos parâmetros de supressão/agregação; depende do autor.
- Enquadramento ético do desenho concreto: depende de avaliação própria; este plano não afirma dispensa de apreciação ética.
