# Análise competitiva — MISM3 e serviços para mulheres em Rio Claro

**Data da análise:** 2026-10-09  
**Objetivo:** identificar o que já é oferecido publicamente e definir vantagens funcionais concretas para o Mapa do Cuidado Rio-Clarense (MISM3).  
**Método:** consulta a páginas públicas oficiais. Esta análise não presume acesso a sistemas internos nem afirma que um serviço não exista apenas porque não foi encontrado na página consultada.

## 1. Referências públicas examinadas

### Secretaria Municipal da Mulher
URL: https://rioclaro.sp.gov.br/secretaria/secretaria-da-mulher/

A página pública apresenta:
- telefone/WhatsApp, e-mail, endereço e horário de atendimento;
- competências institucionais ligadas a direitos das mulheres, equidade, enfrentamento à violência, campanhas, articulação de políticas públicas, educação, saúde, trabalho e autonomia econômica.

**Limitação observada na página consultada:** o conteúdo visível é institucional e descritivo. Não apresenta, nessa página, um fluxo integrado de busca por necessidade, localização de serviços próximos ou acompanhamento de etapas para resolver uma demanda. Isso descreve a página examinada, não todo o trabalho realizado pela Secretaria.

### Notícias e ações municipais
- https://rioclaro.sp.gov.br/mulher/secretaria-da-mulher-orienta-sobre-importunacao-sexual/
- https://rioclaro.sp.gov.br/mulher/secretaria-da-mulher-apresenta-projetos-para-parcerias-com-o-governo-do-estado/
- https://rioclaro.sp.gov.br/mulher/fim-da-violencia-contra-a-mulher-e-tema-de-atividades-em-rio-claro/

As notícias documentam campanhas e ações de enfrentamento à violência, articulação de parcerias, acolhimento e promoção de autonomia econômica. Notícias e eventos são importantes, mas uma notícia isolada não substitui um catálogo operacional continuamente atualizado.

### Portal da Empregabilidade
URL: https://vagas.rioclaro.sp.gov.br/

O inventário de fontes do MISM3 já identifica esse portal como fonte para vagas e cadastro de currículo. O projeto deve encaminhar a mulher à plataforma oficial e evitar copiar currículos ou dados pessoais. A disponibilidade atual de vagas e a possibilidade de integração automatizada precisam ser verificadas.

### Transporte coletivo
URL primária indicada para o projeto: https://soutransportes.com.br/rio-claro/

A extração dos 12 PDFs locais retornou apenas cabeçalhos de impressão/anotações; portanto, os horários não foram considerados dados estruturados validados.

## 2. O que o MISM3 já tem

Com base no código e no inventário atual do repositório:
- consulta por CEP executada no navegador, sem enviar o CEP digitado ao servidor;
- índice geográfico derivado do CNEFE/IBGE, com localização aproximada por CEP;
- catálogo de serviços e cálculo de proximidade aproximada;
- mapa de pontos com coordenadas disponíveis;
- referências de fonte e datas de verificação nos registros de serviços.

Limitações atuais:
- a distância aproximada não equivale a rota de rua nem tempo de deslocamento;
- cobertura e qualidade dependem de dados completos e atualizados;
- transporte ainda não tem horários estruturados e validados;
- emprego, cursos e educação infantil ainda precisam de catálogos operacionais, com status e data de validade;
- não há, nesta versão, prova de disponibilidade de vagas de creche ou de emprego em tempo real.

## 3. Matriz de comparação funcional

| Necessidade da mulher | O que as páginas públicas consultadas mostram | Meta funcional do MISM3 | Evidência necessária para considerar concluído |
|---|---|---|---|
| Descobrir por onde começar | Página institucional, contatos e notícias da Secretaria | Entrada por necessidade: segurança, saúde, renda, emprego, estudo, cuidado dos filhos, transporte e direitos | Testes com tarefas reais e links oficiais funcionais |
| Encontrar serviços próximos | Não há busca por CEP visível na página institucional consultada | Busca geográfica por CEP, distância aproximada claramente explicada e endereço/contato | Testes de CEP, coordenadas e cobertura; indicar quando localização for aproximada |
| Encontrar emprego e renda | Portal da Empregabilidade e iniciativas de autonomia econômica | Agregar links e oportunidades públicas verificáveis, com status, prazo, requisitos e data da consulta | Cada oportunidade aponta para fonte primária e é marcada aberta/encerrada/indeterminada |
| Conciliar trabalho e cuidado infantil | Fontes de emprego e educação estão separadas | Mostrar em uma jornada relacionada emprego, escolas/creches e transporte, sem afirmar que há vaga de creche sem confirmação | Cadastro INEP validado; oferta de creche identificada corretamente; disponibilidade só quando comprovada |
| Saber como chegar | A SOU é a fonte indicada para o transporte | Consulta de linha/sentido/horário e link de origem; futuramente itinerários e acessibilidade | Tabelas atuais extraídas e verificadas; nunca inventar rota ou horário |
| Acessar proteção em situação urgente | A Prefeitura publica campanhas e orientações; a Secretaria tem contato público | Acesso rápido e discreto a canais oficiais de emergência e atendimento, sem exigir cadastro nem coletar relato sensível | Telefones e serviços confirmados; revisão de segurança e privacidade |
| Saber se a informação é confiável | Páginas institucionais e notícias têm datas diferentes | Mostrar fonte, data de verificação e status da informação em cada registro | Validador de catálogo e rotina de revisão |
| Identificar lacunas de atendimento | Notícias relatam iniciativas, mas não são por si só um diagnóstico de cobertura | Painel agregado de cobertura e qualidade dos dados, deixando claro o que é ausência de dado versus ausência de serviço | Indicadores com denominadores, método, limites e fontes explícitos |

## 4. Diferencial competitivo a construir

O MISM3 não deve ser apenas outro portal de links. Seu diferencial será transformar a busca em um caminho prático, seguro e verificável:

1. **Entrada pela necessidade, não pelo nome do órgão.**
2. **Serviços conectados:** emprego + formação + cuidado infantil + transporte + saúde + proteção.
3. **Localização transparente:** distância aproximada, endereço e aviso quando não houver coordenadas.
4. **Informações acionáveis:** requisitos, documentos, telefone, horário, prazo, link oficial e data da última verificação.
5. **Proteção por desenho:** não coletar relatos de violência, currículos ou dados pessoais desnecessários; manter a consulta por CEP local no navegador.
6. **Detecção de lacunas:** separar serviço não localizado, cadastro incompleto e serviço cuja existência ou disponibilidade ainda não foi confirmada.
7. **Prestação de contas baseada em dados:** métricas de cobertura e atualização, sem atribuir culpa ou declarar inferioridade sem evidência.

## 5. Plano de execução priorizado

### P0 — Qualidade e segurança
- Revisar o catálogo manual de serviços sociais, completar CRAS/CREAS e confirmar contatos, endereços e horários em fontes atuais.
- Garantir que cada cartão mostre fonte e data de verificação.
- Corrigir registros antigos ou incompletos; não transformar falta de informação em afirmação de inexistência.

### P1 — Jornada de trabalho e autonomia
- Criar catálogo de fontes de emprego e cursos: Portal da Empregabilidade, Trampolim, PAT/CONECTA, concursos e cursos com inscrições confirmadas.
- Para cada item, guardar origem, data da consulta, situação, prazo e requisitos.
- Direcionar a candidatura para a fonte oficial; não coletar currículo na primeira versão.

### P2 — Cuidado infantil e educação
- Adicionar a exportação de escolas do INEP ao repositório quando disponível.
- Identificar oferta explícita de creche usando campo oficial, sem tratar toda Educação Infantil como creche.
- Não afirmar existência de vaga ou fila sem dado público que comprove disponibilidade.

### P3 — Transporte
- Usar a SOU Transportes como fonte primária informada para os documentos.
- Obter tabelas legíveis e atuais, registrar a data da consulta e estruturar linhas, sentidos e tipos de dia.
- Só depois oferecer horários como atuais. Não estimar tempos de viagem sem dados apropriados.

### P4 — Comparação e validação com usuárias
- Preparar tarefas de teste: “preciso encontrar trabalho”, “preciso de atendimento de saúde”, “preciso de ajuda por violência”, “preciso encontrar creche e chegar ao trabalho”.
- Medir se a pessoa encontra a fonte correta, quanto tempo leva e se consegue executar o próximo passo.
- Comparar funcionalidades com páginas públicas consultadas, usando critérios iguais e evidência documentada.

## 6. Critérios de sucesso para o primeiro marco

- Toda ficha publicada tem fonte e data de verificação.
- Nenhuma vaga, inscrição, vaga de creche ou horário de ônibus é apresentado como disponível sem evidência.
- A mulher consegue começar pela sua necessidade e chegar a um serviço ou fonte oficial em poucos passos.
- A consulta por CEP continua local no navegador.
- O sistema distingue ausência de cadastro de ausência de serviço.
- Os principais fluxos são testados com dados reais e casos sem resultado.

## 7. Fontes públicas consultadas

- Secretaria Municipal da Mulher: https://rioclaro.sp.gov.br/secretaria/secretaria-da-mulher/
- Ação “Não se Cale”: https://rioclaro.sp.gov.br/mulher/secretaria-da-mulher-orienta-sobre-importunacao-sexual/
- Projetos e parcerias estaduais: https://rioclaro.sp.gov.br/mulher/secretaria-da-mulher-apresenta-projetos-para-parcerias-com-o-governo-do-estado/
- Programação do Agosto Lilás: https://rioclaro.sp.gov.br/mulher/fim-da-violencia-contra-a-mulher-e-tema-de-atividades-em-rio-claro/
- Portal da Empregabilidade: https://vagas.rioclaro.sp.gov.br/
- SOU Transportes: https://soutransportes.com.br/rio-claro/

**Nota de rigor:** a comparação acima avalia páginas públicas e funcionalidades visíveis. Não é uma auditoria completa dos serviços municipais nem prova de que a Prefeitura não ofereça funcionalidades em outros canais.
