# Proposta de regra de supressão e agregação — mapa territorial do MISM3

**Status:** proposta para decisão do autor; não implementada e não aprovada.  
**Data:** 06/11/2026.

## 1. Finalidade

A política de privacidade territorial do MISM3 já determina que setores pequenos, categorias raras e combinações específicas sejam avaliados antes da divulgação, mas não fixa parâmetros numéricos. Este documento propõe uma regra operacional com alternativas de limiar. Os valores são opções para avaliação, não uma norma, obrigação legal ou decisão já tomada.

O objetivo é evitar que um mapa ou tabela permita identificar ou inferir informação sobre pessoa ou domicílio por meio de contagens pequenas, combinações raras, comparação entre filtros ou subtração de totais. A regra deve preservar, tanto quanto possível, a utilidade dos indicadores territoriais.

## 2. Escopo e premissas

A regra deve ser aplicada antes da publicação de cada produto: tabelas, mapas temáticos, pop-ups, filtros, downloads, relatórios, arquivos JSON/GeoJSON/CSV e saídas derivadas. A análise precisa considerar o conjunto de produtos que podem ser combinados, e não cada tabela isoladamente.

O mapa territorial definido pelo autor utiliza dados públicos, agregados e de locais: setores censitários e equipamentos públicos. Não deve incorporar dados de pessoas, CEP ou endereço residencial de pacientes, estudantes, famílias ou usuárias. O CEP institucional de um equipamento permanece uma forma aproximada de localizar o próprio equipamento, conforme decisão registrada em `DECISOES_DO_AUTOR.md`.

A contagem de um equipamento público individual, cujo endereço e existência já são públicos, não é automaticamente uma contagem de pessoa. Ainda assim, a publicação de uma contagem pequena pode revelar informação protegida se for cruzada com atributo sensível ou com uma população muito pequena. A regra deve distinguir risco de divulgação pessoal de mera raridade de um serviço público.

## 3. Regra proposta em camadas

### Camada A — triagem por população e domicílios do setor

Antes de exibir atributo temático por setor, classificar o setor por faixas de população e domicílios. A classificação serve como alerta para revisão, não como prova automática de risco.

Alternativas a testar:

- **Faixa conservadora:** revisar para possível supressão ou agregação setores com menos de 5 pessoas ou menos de 3 domicílios.
- **Faixa intermediária:** revisar setores com menos de 10 pessoas ou menos de 5 domicílios.
- **Faixa ampliada:** revisar setores com menos de 20 pessoas ou menos de 10 domicílios.

A proposta inicial é comparar as três faixas na auditoria e medir quantos setores e indicadores seriam afetados. Nenhuma faixa deve ser adotada sem conhecer a distribuição real, a qualidade das variáveis e o risco de associação com informação externa. Esses limiares são candidatos de triagem para teste, não valores estatísticos universais.

Quando o setor for sinalizado, as alternativas são: (a) suprimir o valor temático no setor; (b) agregar o setor a uma unidade territorial maior e documentada, preferencialmente bairro oficial quando a correspondência for inequívoca; ou (c) não publicar o atributo sensível nesse nível geográfico.

Não se deve deslocar artificialmente o ponto do setor nem redesenhar limites para esconder uma contagem.

### Camada B — contagens pequenas e categorias raras

Para contagens que possam se referir a pessoas, domicílios, eventos ou atributos sensíveis, comparar os seguintes candidatos:

- supressão primária para contagens de 1 ou 2;
- supressão primária para contagens inferiores a 5;
- supressão primária para contagens inferiores a 10, quando a sensibilidade do atributo ou a combinação com outras variáveis justificar proteção maior.

A seleção não deve ser automática apenas pelo valor numérico. Uma contagem igual a 1 de um equipamento público conhecido pode ser publicável como localização institucional; uma contagem igual a 1 de uma condição de saúde em uma área pequena pode revelar informação sensível. A natureza do atributo e o contexto determinam o risco.

Categorias raras devem ser agrupadas em classes mais amplas quando isso preservar o sentido analítico. Se o agrupamento não for semanticamente válido, suprimir a categoria no recorte geográfico em questão.

### Camada C — combinações raras de atributos

Avaliar também combinações como faixa etária × sexo × setor, categoria de serviço × setor e período × bairro, sempre que tais variáveis vierem a existir no escopo autorizado. Mesmo quando cada coluna isolada parece segura, a combinação pode singularizar um grupo.

Opções:

1. reduzir a quantidade de atributos exibidos simultaneamente;
2. ampliar faixas etárias ou categorias;
3. agregar setores em bairro ou unidade geográfica maior documentada;
4. ampliar o período de referência;
5. suprimir a combinação quando as alternativas anteriores não eliminarem o risco.

A publicação não deve permitir que filtros sucessivos reconstruam o valor oculto por diferença.

### Camada D — contagens pequenas de equipamentos

Para equipamentos institucionais, preservar a distinção entre localização pública do estabelecimento e contagem que possa ser interpretada como atributo de pessoas. Não aplicar supressão mecânica a todo setor com um único CRAS, UBS ou escola: a existência e localização do equipamento são dados institucionais públicos e têm finalidade própria.

Entretanto, evitar cruzamentos de contagem de equipamentos com atributos sensíveis ou com setores de população muito pequena quando a combinação puder gerar inferência sobre pessoa ou domicílio. Quando houver risco contextual, preferir exibir a localização institucional sem cruzamento sensível, agregar a estatística ou apresentar a categoria em escala geográfica maior.

## 4. Comparação dos métodos

| Método | Vantagens | Desvantagens e riscos |
|---|---|---|
| Supressão primária | Mantém os valores não suprimidos sem alteração; é compreensível quando há símbolo e explicação | Perde informação; pode ser revertida por subtração de totais se não houver supressão complementar |
| Supressão complementar | Evita que totais e subtotais revelem o valor oculto por diferença | Pode exigir ocultar células adicionais e reduzir bastante a utilidade |
| Agregação por bairro | Reduz granularidade; pode preservar leitura territorial compreensível | Só é válida quando a relação setor-bairro está documentada; bairros heterogêneos podem mascarar diferenças; setores sem bairro definido exigem tratamento explícito |
| Agregação por período | Reduz raridade temporal e pequenas contagens | Pode esconder mudanças relevantes e não resolver risco espacial |
| Agrupamento de categorias | Reduz combinações raras e tabelas esparsas | Pode apagar distinções relevantes ou produzir categorias sem sentido substantivo |
| Arredondamento | Reduz precisão numérica; pode ser simples de comunicar | Não protege necessariamente células pequenas; pode distorcer totais e permitir inferência por comparação de versões |
| Remoção de cruzamento | Evita exposição criada pela combinação de atributos | Diminui possibilidades de análise, mas pode ser a opção mais segura |

A supressão deve considerar totais, subtotais, mapas, filtros e versões anteriores. Sempre que um valor for ocultado e puder ser calculado a partir de um total publicado, aplicar supressão complementar ou retirar o total correspondente.

O arredondamento não deve ser usado como substituto automático da análise de risco. Se for testado, comparar arredondamento para múltiplos de 5 e de 10 em tabelas com contagens suficientemente grandes, verificando distorção dos totais e possibilidade de reconstrução. Não arredondar coordenadas institucionais como método de supressão de pessoas; a precisão geográfica é um problema distinto.

## 5. Procedimento de decisão proposto

1. Inventariar cada produto público e seus campos, escalas, filtros e totais.
2. Classificar atributos por natureza: institucional, demográfico agregado, sensível, potencialmente identificador ou derivado.
3. Calcular a distribuição de população e domicílios por setor usando apenas os dados agregados aprovados.
4. Sinalizar setores pequenos e contagens raras com cada limiar candidato.
5. Avaliar singularidade e inferência por combinação com informação pública externa plausível.
6. Simular supressão primária, supressão complementar, agregação por bairro, agrupamento de categorias e arredondamento.
7. Testar ataques simples de diferença entre tabelas, totais, filtros e versões sucessivas.
8. Comparar risco residual, quantidade de valores suprimidos, perda de cobertura e utilidade analítica.
9. Registrar a regra escolhida, justificativa, responsável, versão, data e produtos afetados.
10. Submeter os parâmetros finais à aprovação do autor e à revisão de privacidade/ética pertinente antes da publicação.

## 6. Como testar a regra

A avaliação deve usar os arquivos públicos e agregados efetivamente autorizados, mais dados fictícios criados para testes negativos. Não usar dados reais de pacientes, estudantes, famílias ou usuárias.

### Testes de risco

- construir tabelas com uma, duas e poucas ocorrências artificiais;
- criar combinações raras artificiais entre atributos;
- verificar se totais e subtotais permitem recuperar células suprimidas;
- tentar reconstruir valores comparando filtros, bairros, períodos e versões;
- testar se um setor pequeno continua distinguível após agregação;
- verificar se a supressão de uma célula exige supressão complementar;
- testar se a combinação de um ponto público de equipamento com atributo sensível cria inferência indevida.

### Testes de utilidade

- medir quantidade e proporção de setores afetados por cada limiar;
- medir quantidade de células suprimidas e agregadas;
- comparar totais antes/depois, quando a regra permitir;
- avaliar perda de cobertura geográfica e de categorias;
- comparar arredondamento com valores originais sem expor células protegidas;
- verificar se os rótulos e avisos explicam corretamente o tratamento aplicado.

### Critérios mínimos de aceitação

- nenhum valor protegido pode ser recuperado por subtração simples de totais publicados;
- nenhuma combinação de filtros disponibilizada ao público pode reconstruir uma célula suprimida;
- todo setor sinalizado deve receber tratamento documentado ou justificativa de liberação;
- os arquivos intermediários, logs e relatórios não podem conter valores pessoais proibidos;
- os dados institucionais públicos não devem ser confundidos com atributos de pessoas;
- a regra aplicada deve ser reproduzível e versionada;
- a publicação deve identificar quando valores foram suprimidos, agregados ou arredondados, sem revelar o valor protegido.

## 7. Decisões ainda dependentes do autor

O autor deverá aprovar, antes de qualquer implementação/publicação:

- qual faixa de triagem populacional e domiciliar será testada como padrão inicial;
- quais limiares de contagem serão avaliados para cada classe de atributo;
- quando a agregação por bairro é aceitável e como tratar setores sem bairro identificado;
- se arredondamento será admitido e em quais indicadores;
- quem fará a revisão final de risco e como será registrada a aprovação.

**Nenhum limiar deste documento está aprovado.** A proposta não deve ser convertida em código nem aplicada a dados publicados antes da decisão do autor.

## 8. Fontes consultadas

As fontes abaixo foram abertas e consultadas em 06/11/2026. São referências metodológicas para controle de divulgação estatística e desidentificação; não são normas brasileiras que imponham os limiares propostos.

1. **Office for National Statistics (ONS).** *Policy on protecting confidentiality in tables of birth and death statistics*. A orientação discute avaliação contextual de contagens pequenas, combinação com informação externa, agregação de categorias/geografias, supressão primária e complementar e arredondamento. A própria política ressalta que não impõe uma técnica única.  
   Link: https://www.ons.gov.uk/methodology/methodologytopicsandstatisticalconcepts/disclosurecontrol/policyonprotectingconfidentialityintablesofbirthanddeathstatistics  
   Acesso: 06/11/2026.

2. **National Institute of Standards and Technology (NIST).** *SP 800-188 — De-Identifying Government Datasets: Techniques and Governance* (setembro de 2023). Aborda avaliação de riscos de divulgação, modelos de compartilhamento, governança, transformação de quasi-identificadores e estudos de risco de reidentificação.  
   Link: https://csrc.nist.gov/pubs/sp/800/188/final  
   Acesso: 06/11/2026.

3. **Conselho Nacional de Saúde.** *Resolução nº 510, de 07 de abril de 2016*. Fonte normativa oficial consultada apenas para preservar a cautela sobre o enquadramento ético: a aplicação depende do desenho efetivo da pesquisa e de seus procedimentos. Este documento não conclui dispensa de apreciação ética.  
   Link: https://www.gov.br/conselho-nacional-de-saude/pt-br/atos-normativos/resolucoes/2016/resolucao-no-510.pdf/view  
   Acesso: 06/11/2026.

## 9. Itens não verificados

- Não foi localizada nesta etapa uma norma brasileira que estabeleça um limiar universal de população por setor ou de contagem mínima aplicável a este mapa; **não verificado**.
- Não foram calculadas as distribuições reais de população/domicílios por setor para estimar o impacto dos limiares candidatos; **não verificado**.
- Não foi executado teste de reidentificação ou de reconstrução por diferença nos produtos atuais; **não verificado**.
- Não foi realizada avaliação jurídica ou deliberação do sistema CEP/CONEP sobre o desenho concreto da pesquisa; **não verificado**.
