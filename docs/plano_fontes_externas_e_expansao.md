# Plano de fontes externas — MISM3

**Atualizado em:** 2026-10-09  
**Princípio:** buscar informação pública útil, reaproveitar a fonte original e deixar claro o que foi verificado. Não solicitar dados à Prefeitura, não presumir autorização para integração e não copiar dados pessoais.

## Como vamos decidir se uma fonte entra

Cada fonte deve ter: nome, URL oficial, necessidade atendida, tipo de dado, cobertura geográfica, frequência de atualização, método de acesso permitido, data da última conferência, limitações conhecidas e responsável pela revisão.

Prioridade:
1. **Fonte primária oficial e pública** para informação operacional.
2. **Base pública estruturada** para cobertura, indicadores e geografia.
3. **Organização comunitária ou profissional** apenas para serviços que não aparecem nas bases oficiais, com consentimento e verificação explícita.
4. **Agregadores comerciais** só quando houver utilidade real, termos compatíveis e origem rastreável.

Não vamos declarar uma vaga, matrícula, horário, rota, atendimento ou preço como disponível só porque uma página existe. Se não houver prova recente, mostrar “consulte a fonte” ou “disponibilidade não confirmada”.

## Inventário inicial de fontes

| Área do MISM3 | Fonte para investigar | O que aproveitar | Limite / cuidado | Prioridade |
|---|---|---|---|---|
| Saúde e localização de estabelecimentos | CNES / DATASUS — https://cnes.datasus.gov.br/ | Estabelecimentos, tipo, endereço e serviços cadastrados | Cadastro não prova vaga, agenda, qualidade nem funcionamento no momento | P0 |
| Escolas e educação infantil | INEP Dados Abertos — https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos | Escolas, dependência administrativa e campos oficiais de oferta | Não confundir Educação Infantil com oferta específica de creche; conferir ano da base | P0 |
| População, território e CEP aproximado | IBGE — https://www.ibge.gov.br/ | CNEFE, setores censitários, população por idade e malhas geográficas | Geocodificação aproximada não identifica residência individual; documentar margem e ano | P0 |
| Indicadores sobre mulheres | DataMulheres / Observatório Brasil da Igualdade de Gênero — https://www.gov.br/mulheres/pt-br/observatorio-brasil-da-igualdade-de-genero/datamulheres | Indicadores de autonomia econômica, educação, saúde, violência e participação | Parte dos indicadores é nacional/estadual e pode não permitir conclusão específica para Rio Claro | P1 |
| Indicadores de gênero | IBGE Estatísticas de Gênero — https://www.ibge.gov.br/estatisticas/multidominio/genero/20163-estatisticas-de-genero.html | Contexto e indicadores para orientar perguntas e análises | Verificar nível territorial, período e metodologia de cada tabela | P1 |
| Emprego local | Portal da Empregabilidade — https://vagas.rioclaro.sp.gov.br/ | Direcionar para vagas e serviços oficiais | Não copiar currículos; validar se há feed/API ou apenas navegação manual | P0 |
| Emprego e cursos estaduais | Trampolim — https://www.trampolim.sp.gov.br/ | Oportunidades e qualificação | Confirmar disponibilidade, regras de uso e se os resultados podem ser consultados automaticamente | P1 |
| Transporte coletivo | SOU Rio Claro — https://soutransportes.com.br/rio-claro/ e https://soutransportes.com.br/rio-claro/linhas-e-horarios/ | Linhas, sentidos, horários e comunicados | Horários devem ser atuais e legíveis; PDFs locais extraídos até agora não renderam tabelas confiáveis | P0 |
| Direitos e orientação jurídica | Defensoria Pública de SP — https://www.defensoria.sp.def.br/ | Canais, unidades, critérios e orientações públicas | Não prometer atendimento ou elegibilidade sem checar os critérios atuais | P1 |
| Violência contra a mulher | Ligue 180 — https://www.gov.br/mulheres/pt-br/ligue180 | Canal oficial e orientações de acesso | Mostrar sem exigir login, cadastro ou relato; segurança digital deve ser revisada | P0 |
| Proteção e direitos da mulher em Rio Claro | Secretaria Municipal da Mulher — https://rioclaro.sp.gov.br/secretaria/secretaria-da-mulher/ | Contatos institucionais e serviços publicados | Página institucional não substitui confirmação de vagas/atendimento | P0 |
| Assistência social | Secretaria de Desenvolvimento Social — https://rioclaro.sp.gov.br/secretaria/secretaria-de-desenvolvimento-social/ | Canais oficiais para orientação e rede socioassistencial | Completar catálogo de CRAS/CREAS apenas com fonte verificável | P0 |
| Creche e demanda escolar | Portal da Educação — https://www.educacaorc.com.br/?r=demandaescolar | Informações públicas sobre demanda escolar | Não inferir posição individual em fila nem disponibilidade sem dado explícito | P0 |
| Profissionais mulheres (futuro marketplace) | Cadastro voluntário criado pelo próprio MISM3 | Profissionais que se inscrevem para atender outras mulheres | Exige termos, consentimento, verificação proporcional, denúncia, moderação e política de avaliações; não está implementado | P2 |
| Transporte por mulheres (futuro marketplace) | Cadastro voluntário e fontes públicas permitidas | Motoristas que informem oferecer serviço a passageiras | Não alegar parceria com aplicativos; não publicar localização em tempo real nem dados pessoais desnecessários | P2 |

## Próximos itens a buscar e incorporar

### 1. Catálogo operacional, não só uma lista de links
Para cada serviço: categoria, subcategoria, nome, público atendido, endereço público, telefone público, horário publicado, abrangência, acessibilidade quando comprovada, documentos exigidos quando publicados, fonte primária, data da conferência e status da informação.

### 2. Emprego conectado ao cuidado
Montar uma jornada que conecte vaga de emprego, curso necessário, transporte e cuidado infantil. A primeira versão pode encaminhar para fontes oficiais; só importar oportunidades se o acesso for permitido e houver forma de atualizar/encerrar registros.

### 3. Educação infantil sem falsas promessas
Cruzar cadastro escolar com campos oficiais de oferta. Distinguir creche, pré-escola e outras etapas. Mostrar “oferta cadastrada” separadamente de “vaga disponível”.

### 4. Transporte validado
Obter uma tabela legível por linha, sentido e tipo de dia. Registrar URL, data da coleta e período de validade. Só então criar pesquisa por linha/horário. Não fabricar horários a partir de cabeçalho de PDF.

### 5. Rede De Mulher para Mulher
Planejar como um marketplace separado do catálogo público. A profissional escolhe quais serviços oferece, área atendida, preço ou “sob consulta”, disponibilidade, atendimento domiciliar/remoto e meios de contato. O perfil só é publicado após aceitar regras e passar pelas verificações definidas. A futura verificação de identidade e elegibilidade feminina precisa de avaliação jurídica e técnica; login Gov.br não deve ser tratado como garantia automática de gênero.

### 6. Indicadores e lacunas de cobertura
Usar dados agregados para identificar áreas com mais crianças pequenas, distâncias aproximadas até serviços e ausência de registros. Sempre separar “não há serviço cadastrado” de “não existe serviço”. Publicar ano, denominador, método e limitações.

## Campos mínimos para qualquer dado importado

- `fonte_nome`
- `fonte_url`
- `coletado_em`
- `data_referencia` (quando publicada pela fonte)
- `metodo_coleta` (download, consulta manual ou API autorizada)
- `status_validacao` (confirmado, parcial, desatualizado ou não confirmado)
- `limites`
- `licenca_ou_termos` (quando aplicável)

## Regras de coleta e privacidade

- Não pedir nem armazenar relato de violência para liberar acesso a serviços.
- Não importar nomes, telefones pessoais ou currículos de pessoas sem base legal e autorização apropriada.
- Não fazer scraping que viole termos, bloqueios técnicos ou controles de acesso.
- Preferir links para a fonte original quando não houver acesso estruturado autorizado.
- Não usar ausência de resultado como prova de ausência do serviço.
- Nunca afirmar que um perfil, serviço, horário ou vaga está verificado sem registrar o que foi efetivamente conferido.
- A busca por necessidade deve continuar local no navegador sempre que possível.

## Ordem de execução sugerida

1. Corrigir e validar os links/cadastros já usados pela interface.
2. Completar os serviços de saúde e assistência com dados públicos estruturados.
3. Extrair e validar escolas e oferta de creche com os campos oficiais.
4. Construir tabela de transporte apenas depois de obter horários legíveis e atuais.
5. Criar o modelo de dados e as regras do marketplace De Mulher para Mulher.
6. Só depois considerar contas, autenticação, mensagens, avaliações ou pagamentos.

## Referências externas consultadas

- INEP — Dados Abertos: https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos
- INEP — Sinopses Estatísticas: https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/sinopses-estatisticas/sinopses-estastisticas
- IBGE — Estatísticas de Gênero: https://www.ibge.gov.br/estatisticas/multidominio/genero/20163-estatisticas-de-genero.html
- Ministério das Mulheres — DataMulheres: https://www.gov.br/mulheres/pt-br/observatorio-brasil-da-igualdade-de-genero/datamulheres
- Prefeitura de Rio Claro — Secretaria da Mulher: https://rioclaro.sp.gov.br/secretaria/secretaria-da-mulher/
- SOU Transportes — Rio Claro: https://soutransportes.com.br/rio-claro/
