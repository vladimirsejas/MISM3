# Pistas nos sites da Prefeitura e da Saúde de Rio Claro

**Estado: NÃO VERIFICADO.** Em 2026-10-10 o ambiente de desenvolvimento não conseguiu abrir `rioclaro.sp.gov.br` nem `saude-rioclaro.org.br` (rede bloqueada). Tudo abaixo vem de **resultados de busca**: trechos antigos, muitos sem data. Regra do projeto: **nada entra no catálogo (`catalogo/servicos_manuais.csv`) sem conferir na página oficial e registrar a data**.

## Páginas que valem abrir e conferir à mão

| O que | Endereço | Para quê no MISM3 |
|---|---|---|
| Telefones úteis | https://rioclaro.sp.gov.br/telefones-uteis/ | contatos por órgão (base do catálogo de proteção e assistência) |
| Unidades Básicas de Saúde | https://rioclaro.sp.gov.br/unidades-basicas-de-saude/ | lista oficial de UBS |
| Endereços das unidades (Saúde) | https://www.saude-rioclaro.org.br/enderecos.htm | endereços e horários (página antiga: conferir) |
| Atendimento 24 h (Saúde) | https://www.saude-rioclaro.org.br/atendimento%2024h.htm | UPA/pronto atendimento |
| Carta de Serviços | https://cartadeservicos.rioclaro.sp.gov.br/ | descrição oficial de cada serviço, documentos e prazos |
| Secretaria de Desenvolvimento Social | https://rioclaro.sp.gov.br/secretaria/secretaria-de-desenvolvimento-social/ | CRAS/CREAS, CadÚnico, benefícios |
| Secretaria da Mulher | https://rioclaro.sp.gov.br/secretaria/secretaria-da-mulher/ | a busca não achou telefone/endereço próprios nela |
| Vagas do PAT | https://rioclaro.sp.gov.br/desenvolvimento-economico/vagas-disponiveis-no-pat-rio-claro/ | vagas reais (hoje só o rótulo "PAT" no site) |
| Cursos de qualificação (PAT/PEQ) | https://rioclaro.sp.gov.br/governo/rio-claro-abre-inscricoes-para-cursos-de-qualificacao-profissional/ | cursos gratuitos, requisitos |
| Ouvidoria | https://rioclaro.sp.gov.br/fale-conosco/ | canal oficial (156) |
| Protocolo de câncer de mama (Saúde) | https://www.saude-rioclaro.org.br/protocolos/Protocolo%20de%20CA%20de%20mama.pdf | regras oficiais de rastreamento |
| Relatórios Anuais de Gestão 2022/2023 (Saúde) | https://www.saude-rioclaro.org.br/uac/RAG%202023.pdf | metas e cobertura por serviço (útil ao painel de gestão, como contexto) |

## Pistas de conteúdo (a confirmar)

- **Atendimento à mulher em situação de violência:** o Centro de Referência de Atendimento à Mulher (CRAM) aparece em notícia municipal sem data: Rua 17, nº 30 (anexo ao Centro Social Urbano), das 8h às 17h, telefones 3532-4014 e 3525-1366. **Conferir se continua válido** antes de qualquer uso.
- **Ouvidoria:** 156, ou (19) 3526-7105 / 7156, Rua 3, 945, Centro (a conferir).
- **Rastreamento pela Saúde:** o protocolo municipal recomenda mamografia anual de 50 a 69 anos; o relatório de 2022 cita preventivo para 25 a 64 anos. Agendamento citado em notícia de 2008 (Central de Vagas, com pedido médico): **provavelmente desatualizado**.
- **Emprego:** o PAT aparece com endereço diferente em notícias diferentes (Avenida 3, 536, ou Rua 6, 676). **Não usar nenhum até conferir.** Cursos gratuitos (PEQ/PAT) pedem, em notícias antigas, mais de 18 anos, ensino médio completo, morar em Rio Claro e estar desempregada.
- **A Secretaria da Mulher** aparece na lista de secretarias sem contato próprio nos resultados.

## O que pode virar funcionalidade
1. **Catálogo de proteção e assistência:** telefones úteis + Carta de Serviços (com fonte e data de verificação em cada linha).
2. **Vagas e cursos do PAT** no bloco "Concursos e vagas", se a página for estruturada o bastante para ler.
3. **Metas de saúde da mulher** (Relatório Anual de Gestão) como contexto no painel de gestão, citando a fonte e o ano.

## Como obter o conteúdo completo
Ou se libera esses dois domínios na rede do ambiente de desenvolvimento, ou alguém abre as páginas no navegador e confere/cola o conteúdo. Depois disso os dados entram em `catalogo/servicos_manuais.csv` com `fonte_url` e `verificado_em`.
