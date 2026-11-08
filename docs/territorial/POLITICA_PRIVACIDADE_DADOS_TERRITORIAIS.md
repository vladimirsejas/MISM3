# Política de privacidade dos dados territoriais do MISM3

## 1. Finalidade e princípio

Esta política define limites para a preparação, análise, armazenamento e publicação de dados no mapa territorial do MISM3.

Princípio central: **caracterizar territórios e equipamentos públicos sem localizar pessoas**.

A unidade espacial estatística é o setor censitário do IBGE. Os pontos do mapa representam equipamentos institucionais. O mapa não deve receber nem derivar localização residencial de pacientes, estudantes, famílias ou usuárias.

## 2. Dados permitidos, sob controle de fonte e finalidade

Podem ser considerados, quando necessários à finalidade territorial e acompanhados de fonte, data e documentação:

- Malhas geográficas oficiais, incluindo setores censitários.
- Dados populacionais, domiciliares e demográficos publicados de forma agregada.
- Localização institucional de estabelecimentos e equipamentos públicos.
- Atributos públicos do equipamento, como categoria, nome institucional, endereço de atendimento e fonte.
- Indicadores calculados exclusivamente sobre unidades territoriais agregadas.
- Metadados de qualidade, cobertura, incerteza e proveniência.

A disponibilidade pública de uma base não elimina a obrigação de avaliar finalidade, necessidade, granularidade e risco de associação.

## 3. Dados proibidos no mapa e no pipeline territorial

Não devem ser coletados, importados, cruzados, armazenados, enviados a serviços externos ou publicados para a finalidade deste mapa:

- CEP de pacientes ou pessoas atendidas.
- CEP de estudantes ou famílias.
- CEP residencial de mulheres ou usuárias.
- Endereços residenciais individuais.
- Coordenadas de residências ou locais individuais de permanência.
- Registros individuais de saúde, diagnóstico, internação, atendimento ou encaminhamento.
- Registros individuais de matrícula, frequência, assistência ou vulnerabilidade.
- Identificadores pessoais diretos ou indiretos.
- Listas individualizadas que permitam relacionar uma pessoa a um setor, serviço, condição ou evento.
- Cruzamentos que, mesmo sem nome ou documento, permitam reidentificação razoável de indivíduos ou domicílios.

O CEP institucional de um equipamento público, quando usado exclusivamente para localizar o próprio equipamento, é conceitualmente distinto de um CEP residencial. Pela decisão D2, o cenário com centro do CEP cadastral do equipamento permanece como análise de sensibilidade, sempre identificado como aproximado. Esta política não autoriza a inclusão de CEP de pessoas.

## 4. Minimização e separação

1. O pipeline territorial deve receber apenas malhas, dados agregados e registros institucionais aprovados.
2. Dados brutos que contenham endereços residenciais não devem ser copiados para o pipeline territorial.
3. Não enviar dados de usuários a serviços de geocodificação, mapas externos ou APIs.
4. Não registrar entradas de usuárias em logs territoriais.
5. Não combinar bases individuais de saúde, educação e assistência.
6. Manter separados os dados de equipamentos e os dados agregados por setor.
7. Publicar somente os campos necessários à visualização e à reprodução dos indicadores.
8. Documentar a origem, a data, o método e o nível de precisão de cada coordenada institucional.

## 5. Setores pequenos e risco de identificação

A agregação por setor censitário reduz granularidade, mas não garante anonimato em qualquer circunstância. Setores com população muito pequena, categorias raras ou combinações de atributos muito específicas podem permitir inferências sobre indivíduos ou domicílios. Pela decisão D4 revisada em 08/11/2026, os 17 setores com menos de 5 pessoas ou menos de 3 domicílios têm população, domicílios, densidade e distâncias/indicadores derivados omitidos em todos os arquivos públicos. A geometria dos setores e os pontos institucionais permanecem disponíveis.

Antes de publicar tabelas, mapas temáticos ou indicadores:

- Avaliar o tamanho populacional e domiciliar dos setores.
- Avaliar raridade de categorias e combinações de atributos.
- Aplicar a supressão primária nos 17 setores abaixo do critério D4.
- Aplicar supressão complementar aos agregados dos 13 bairros afetados e omitir totais municipais demográficos no painel, para reduzir reconstrução por subtração.
- Omitir indicadores derivados por setor nos setores protegidos; não basta esconder os números apenas na interface.
- Evitar filtros sucessivos que permitam recuperar por diferença um valor suprimido.
- Evitar cruzamentos muito detalhados entre idade, sexo, condição de saúde, serviço e território.
- Registrar a regra de supressão aplicada e sua justificativa.

**Parâmetros numéricos de supressão:** a decisão D4 aprovada pelo autor adotou, como regra conservadora do projeto, menos de 5 pessoas ou menos de 3 domicílios por setor. Não se afirma que esse seja um limiar legal universal nem que elimine todo risco de reidentificação. A publicação deve ser reavaliada quando novos indicadores, filtros, períodos ou fontes puderem ser combinados.

## 6. Verificações automáticas obrigatórias

A auditoria não pode depender apenas de nomes de colunas. Campos podem ser renomeados, dados pessoais podem aparecer em valores, texto livre, propriedades aninhadas, arquivos auxiliares, logs ou metadados.

As verificações exigidas para uma futura implementação incluem:

### 6.1 Inspeção estrutural
- Examinar cabeçalhos, esquemas, propriedades GeoJSON, chaves JSON, colunas CSV e estruturas aninhadas.
- Detectar campos diretos e variantes de identificadores pessoais.
- Verificar metadados, nomes de arquivos, comentários e logs.

### 6.2 Inspeção de conteúdo
- Procurar padrões de CPF, telefone pessoal, CEP residencial e endereço individual em valores e textos.
- Verificar sequências numéricas e combinações que possam representar identificadores.
- Inspecionar amostras e arquivos completos quando tecnicamente viável, sem registrar os valores sensíveis no relatório de auditoria.

### 6.3 Inspeção de proveniência
- Exigir fonte, data, método e responsável pela validação de coordenadas institucionais.
- Identificar se uma coordenada deriva de endereço institucional, cadastro público, aproximação ou fonte não verificada.
- Impedir que localização aproximada seja rotulada como coordenada exata.

### 6.4 Inspeção de saída
- Verificar todos os arquivos destinados à pasta pública, inclusive GeoJSON, JSON, CSV, HTML, JavaScript, mapas exportados e relatórios.
- Verificar se há propriedades ou textos que permitam reidentificação.
- Verificar se setores pequenos ou combinações raras exigem supressão ou agregação.
- Verificar se os arquivos públicos contêm apenas os campos necessários.

### 6.5 Inspeção de fluxo e rede
- Verificar se o processamento territorial realiza requisições externas.
- Verificar se dados de localização de usuários, CEP digitado ou endereço residencial são enviados em URL, cabeçalhos, corpo de requisição ou telemetria.
- Verificar logs e mensagens de erro para evitar persistência de entradas.
- Registrar o resultado e os limites de cada auditoria.

### 6.6 Testes negativos
A implementação futura deve incluir dados fictícios de teste contendo padrões proibidos e comprovar que a validação os rejeita. Esses dados devem ser artificiais e não corresponder a pessoas reais.

## 7. Dados e arquivos existentes que exigem atenção

O repositório contém `pipeline/indice_cep.py`, `pipeline/ceps_lista.py`, `web/dados/cep_indice.json`, além de campos CEP em registros do catálogo institucional. O índice atual é descrito como associação CEP para coordenada central aproximada, raio, setor e quantidade de endereços, sem nome de rua ou número.

A ausência de nomes de rua e números não basta para concluir que o arquivo não apresenta qualquer risco. O uso deve ser avaliado conforme finalidade e contexto. O CEP institucional de um equipamento público deve ser distinguido de CEP residencial de pessoa.

Esta fase documental não apaga, altera nem desativa esses componentes. A decisão sobre manter ou retirar o uso de CEP institucional no cenário territorial é apresentada no inventário e permanece com o autor.

## 8. Publicação e controle de acesso

- Publicar apenas dados territoriais agregados e pontos institucionais aprovados.
- Não publicar arquivos brutos que contenham registros residenciais.
- Não publicar logs de processamento com valores sensíveis.
- Documentar as regras de supressão e os campos liberados.
- Revisar os arquivos finais antes de cada publicação.
- Manter trilha de auditoria sem reproduzir os próprios dados sensíveis.

## 9. Incidentes e mudanças de escopo

Se uma fonte, arquivo ou procedimento introduzir dados individuais, CEP residencial, endereço residencial ou possibilidade de reidentificação, a etapa deve ser interrompida antes do processamento/publicação. O material deve ser isolado, a finalidade reavaliada e a equipe deve decidir a providência adequada antes de retomar.

Qualquer nova finalidade, cruzamento ou nível de granularidade exige nova análise de privacidade.

## 10. Enquadramento ético

O enquadramento na Resolução CNS 510/2016 depende do desenho efetivo da pesquisa e dos procedimentos e dados utilizados. Esta política não afirma dispensa de apreciação ética.
