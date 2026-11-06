# Arquitetura territorial do MISM3

## 1. Objetivo

Organizar a evolução da análise territorial já existente no MISM3, sem criar um segundo sistema paralelo e sem introduzir dados pessoais residenciais. A arquitetura proposta utiliza o setor censitário como unidade estatística principal e os equipamentos públicos como pontos institucionais.

Esta é uma especificação documental. Não altera código, dados ou interface.

## 2. Princípios arquiteturais

1. **Unidade estatística estável:** utilizar os setores censitários do IBGE já representados em `web/dados/setores.geojson`.
2. **Pontos institucionais:** representar estabelecimentos e equipamentos públicos por coordenadas vinculadas ao próprio equipamento e acompanhadas de fonte, método, confiança e data.
3. **Separação entre dado e interpretação:** localização de um serviço dentro de um setor não significa que o serviço atende exclusivamente aquele setor.
4. **Sem geolocalização residencial:** não localizar pacientes, estudantes, famílias ou usuárias por CEP, endereço ou coordenada.
5. **Sem inferência indevida:** distância em linha reta, quantidade de pontos e população agregada não demonstram, isoladamente, acesso efetivo, capacidade, demanda ou vulnerabilidade.
6. **Evolução incremental:** reutilizar os módulos e arquivos territoriais existentes, evitando duplicação de pipelines.

## 3. Unidade estatística

A unidade estatística principal é o setor censitário do IBGE, Censo 2022, representado em `web/dados/setores.geojson`. A leitura desse arquivo confirmou 408 feições e propriedades `setor`, `bairro`, `situacao`, `pessoas` e `domicilios`.

Os indicadores já produzidos em `web/dados/territorio.json` incluem população, domicílios, área, densidade, agregações por bairro e distâncias, conforme os metadados e a estrutura do arquivo.

O nome de bairro é utilizado apenas quando consta na malha. Os setores sem bairro definido pelo IBGE devem permanecer identificados como tais; não se deve completar a informação por suposição.

## 4. Equipamentos como pontos institucionais

Os equipamentos são representados por pontos derivados de coordenadas institucionais registradas no catálogo ou em seu registro de localização. As fontes e os métodos disponíveis podem ser consultados em:

- `catalogo/servicos_manuais.csv`;
- `catalogo/localizacao_registro.csv`;
- `catalogo/inep_escolas.csv`.

Cada ponto utilizado em indicador territorial deve possuir identificador do equipamento, categoria, latitude, longitude, fonte, método de obtenção, confiança e data de verificação. A coordenada precisa estar associada ao equipamento público, nunca ao domicílio de um usuário.

Serviços sem localização suficientemente confiável devem ser apresentados como pendentes ou contabilizados na cobertura de localização, sem receber ponto artificial.

## 5. Camadas do mapa

### Camada A — Limite e setores censitários
Representa o território municipal por meio da malha do IBGE e dos polígonos dos setores. A origem e a versão da malha devem acompanhar os metadados.

### Camada B — População e domicílios agregados
Apresenta variáveis agregadas disponíveis na malha e em tabelas oficiais compatíveis. O significado das variáveis de origem deve ser conferido na documentação oficial antes de ampliar seu uso. A malha atual registra `v0001` e `v0002` como pessoas e domicílios, mas o próprio script de geração mantém ressalva de confirmação do dicionário do IBGE.

### Camada C — Equipamentos públicos
Apresenta pontos institucionais classificados por categoria, com distinção entre coordenadas verificadas, coordenadas oficiais, localizações aproximadas eventualmente mantidas e localizações pendentes. A decisão de manter o cenário de centro do CEP ou retirá-lo permanece com o autor, conforme opções registradas no inventário.

### Camada D — Indicadores territoriais
Apresenta indicadores calculados por setor, incluindo população, densidade, domicílios, equipamentos localizados por categoria, distância em linha reta e qualidade/cobertura das coordenadas.

### Camada E — Qualidade e limitações
Expõe fonte, data, método, cobertura de localização, dados ausentes, aproximações e avisos de interpretação. A qualidade da localização não deve ficar escondida em metadados técnicos.

## 6. O que o mapa mostra

- Distribuição espacial de população e domicílios agregados.
- Densidade populacional calculada a partir da área do setor.
- Localização de equipamentos públicos cadastrados e suficientemente georreferenciados.
- Quantidade de equipamentos localizados por categoria e setor.
- Distância em linha reta entre um ponto representativo do setor e o equipamento mais próximo.
- Cobertura e qualidade das coordenadas dos equipamentos.
- Setores e categorias para os quais os dados são insuficientes.

## 7. O que o mapa não mostra nem permite concluir

O mapa não localiza pessoas, residências, pacientes, estudantes ou famílias. Não associa condições de saúde a domicílios. Não mostra trajetos reais, tempo de deslocamento, transporte disponível, capacidade instalada, vagas, demanda efetiva ou utilização individual dos serviços.

A localização de um equipamento em determinado setor não prova que ele atende apenas a população daquele setor. A ausência de equipamento dentro de um setor não prova ausência de atendimento. Distância em linha reta não equivale a acessibilidade efetiva.

Não utilizar, com base apenas nesses indicadores, expressões como “população desassistida”, “falta de cobertura” ou “vulnerabilidade”.

## 8. Evolução sobre a estrutura existente

A arquitetura deve evoluir os componentes atuais, sem duplicá-los:

- `pipeline/setores.py`: geração da malha municipal de setores.
- `pipeline/territorio.py`: indicadores territoriais agregados.
- `pipeline/analise_territorial.py`: análise de proximidade e agregação territorial existente.
- `pipeline/exposicao_distancia.py`: cenários de localização e exposição à distância.
- `pipeline/indice_cep.py` e `pipeline/ceps_lista.py`: componentes existentes do índice de CEP, cujo papel e permanência nos cálculos territoriais devem seguir a decisão explícita do autor; esta arquitetura não determina sua remoção.
- `web/territorio.js`: visualização territorial agregada.
- `web/mapa.js` e `web/mapa-servicos.js`: mapa de equipamentos e preparação de pontos.

Os arquivos `web/dados/setores.geojson`, `territorio.json`, `analise_territorial.json` e `exposicao_distancia.json` são saídas existentes que devem ser tratadas como produtos versionados do pipeline. Não devem ser substituídos por resultados não reproduzidos.

## 9. Áreas operacionais adicionais

A divisão em áreas operacionais, como áreas de referência de unidades de saúde, pode ser considerada como camada temática separada quando houver documentação que sustente os limites, finalidade definida, fonte, data e procedimento de digitalização. Não substituirá os setores censitários como unidade estatística principal.

Áreas de abrangência de saúde, educação e assistência social não devem ser presumidas equivalentes. Cada camada operacional exige fonte e validação próprias. A construção de polígonos não documentados não deve ser apresentada como delimitação oficial.

## 10. Fluxo lógico

1. Ler a malha oficial e validar códigos e geometrias.
2. Ler os dados demográficos agregados e conferir seus dicionários.
3. Ler o catálogo de equipamentos e o registro de proveniência das coordenadas.
4. Selecionar pontos institucionais conforme regra de qualidade aprovada.
5. Associar equipamentos a setores por operação espacial, com regra explícita para pontos na fronteira.
6. Calcular indicadores agregados e distâncias, registrando cobertura e limitações.
7. Executar verificações de privacidade e qualidade.
8. Publicar somente resultados territoriais agregados e documentados.

## 11. Enquadramento ético

O enquadramento na Resolução CNS 510/2016 depende do desenho efetivo da pesquisa e dos dados e procedimentos utilizados. Este documento não afirma dispensa de apreciação ética.
