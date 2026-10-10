# Registro de decisões de desenvolvimento — MISM3

Este registro é um documento de trabalho para decisões explícitas. Ele não substitui a inspeção do código, dos testes, dos dados e das fontes originais.

## Regra de autoridade dos materiais

**O README.md não é fonte de verdade nem norte para decisões de produto ou arquitetura.** É apenas um mapa resumido do que está sendo desenvolvido e de como navegar no projeto. Pode ficar desatualizado ou simplificar decisões.

Ao avaliar o estado do MISM3, verificar nesta ordem:
1. Decisões expressamente confirmadas pelo fundador na conversa.
2. Código existente e comportamento que pode ser demonstrado.
3. Testes executados e seus resultados reais.
4. Dados e documentação de origem, com seus metadados e limitações.
5. Registro de decisões, para histórico e contexto.
6. README, apenas como mapa de navegação e resumo.

Não inferir que uma funcionalidade existe só porque aparece no README ou em um plano. Confirmar a implementação. Não considerar uma ideia implementada só porque aparece em documentação.

## Direção do protótipo

- O MISM3 é um protótipo fechado em desenvolvimento; não pressupor uso pelo público.
- Usar cenários sintéticos para testes internos. Não exigir testes com mulheres reais para avançar no protótipo.
- Marcar explicitamente dados, perfis, serviços e histórias fictícias com `[DEMO]` ou aviso equivalente.
- Não misturar dados reais e ilustrativos sem identificação visível e inequívoca.
- A busca deve reconhecer acentos, sinônimos e necessidades combinadas, sem enviar o texto digitado a um servidor.
- Priorizar caminhos funcionais e jornadas integradas, não apenas uma coleção de links.
- Construir progressivamente: validar a base antes de ampliar funcionalidades.
- Distinguir sempre implementação feita, teste executado, hipótese e trabalho futuro.

## Decisões e alterações recentes

### Busca de necessidades
- Extraído o classificador local para `web/necessidades.js`.
- Criados testes sintéticos em `web/tests/necessidades.test.js`.
- O módulo reconhece até três categorias por frase.
- Teste de referência executado pelo ambiente de trabalho: 39 cenários passaram. Isso não equivale a teste completo de navegador.

### De Mulher para Mulher
- Criada a página `web/rede-mulheres.html` com perfis fictícios, filtros, prévia de cadastro e simulação de denúncia.
- Os níveis são rótulos demonstrativos, não verificações reais.
- Cadastro e denúncia não são enviados nem persistidos.
- A sintaxe JavaScript embutida foi verificada; falta teste visual no navegador.

### Próximos focos
1. Fazer uma verificação funcional do fluxo de busca na interface.
2. Projetar o painel de Inteligência Pública usando dados censitários reais somente quando a proveniência e os campos forem confirmados; usar dados ilustrativos separados enquanto isso.
3. Expandir a jornada De Mulher para Mulher mantendo perfis e interações fictícios.
4. Preparar limites e caminho para produção sem tratar esses limites como impedimento ao protótipo.

## Atualização deste registro
Ao concluir mudanças relevantes, registrar o que foi alterado, o teste executado, o resultado observado e o que ainda não foi verificado.

### Inteligência Pública
- Criada a página `web/inteligencia-publica.html`.
- A página tenta carregar `web/dados/setores_resumo.json` e mostra contagens de setores, pessoas e domicílios apenas se o arquivo estiver disponível.
- O gráfico de comparação territorial usa valores fictícios explicitamente marcados `[DEMO]`; não representa estatísticas de Rio Claro.
- O painel explica que a malha geral não comprova demanda por creche e que são necessários dados apropriados de faixa etária e oferta.
- Sintaxe JavaScript embutida verificada; ainda falta inspeção visual e teste com um arquivo real confirmado.

### Navegação
- A tela inicial agora liga para os protótipos De Mulher para Mulher e Inteligência Pública.
- O teste de busca foi repetido depois das alterações: 39 cenários passaram. Sintaxe de `web/app.js` e dos scripts embutidos nas duas páginas foi verificada.

## 2026-10-10 — Saúde por bairro, secretarias e consolidação das branches

### O que mudou
- Trazido para esta branch o trabalho da `claude/keen-brown-fgpknd` (UBS do guia oficial, painel de gestão, API, vagas, recomendação, documentos de fontes). O merge entrou sem conflito.
- Os dois PDFs de `docs/unidades saude rio claro/` (capturas de tela do guia da Saúde e da página da Prefeitura, de 09/10/2026) foram lidos e incorporados ao catálogo.
- `catalogo/servicos_manuais.csv`: novas colunas `bairro`, `bairros`, `divergencia`; 8 novas unidades (urgência 24 h Nossa Senhora de Lourdes, Vigilância Sanitária e 6 USF); a área de abrangência das 6 UBS de bairro passou de texto em `observacao` para lista estruturada (contagens conferidas com o guia: 14, 10, 18, 9, 6 e 4 bairros).
- `catalogo/secretarias.csv` (novo): 44 links, 21 "conferidos" (páginas abertas no levantamento de 09/10/2026 registrado em `docs/fontes_oficiais_rioclaro_mism3.md`) e 23 "só listados".
- `pipeline/institucional.py` (novo) gera `web/dados/institucional.json`; `pipeline/servicos.py` repassa os campos novos.
- Páginas novas `web/saude.html` e `web/secretarias.html`, módulo `web/institucional.js`, estilos `web/institucional.css`; menu das seis páginas e tela inicial atualizados; ícone de aba embutido (o console deixou de acusar `favicon.ico` 404).
- `abrir_site.bat` reescrito (CRLF, ASCII, porta livre, atualiza dados antes de abrir) e `.gitattributes` para manter CRLF nos `.bat`.

### Problemas encontrados no que já existia
1. As 5 UBS marcadas `abrangencia=local` e sem CEP **não apareciam em nenhuma tela**: o site só lista serviço sem localização depois de uma busca e mostra no máximo 5. A página Saúde não depende de CEP.
2. A área de abrangência (informação mais útil do guia) estava só em texto livre e não era pesquisável.
3. As observações de algumas unidades traziam notas de desenvolvimento ("Sem CEP/coordenadas validados: aparece na lista, não no mapa"). A tela agora as remove (`limparObservacao`) e há teste para impedir que voltem.

### Decisões
- **Não duplicar unidades.** Boa Vista, Assistência e Ajapi aparecem nas duas fontes (UBS e USF) com o mesmo endereço e telefone: ficaram como uma linha com nota. Só entraram como novas as USF que não têm correspondente conferido. A "USF Ferraz" ficou separada da "UBS do Distrito de Ferraz" porque os endereços diferem.
- **Divergência entre fontes oficiais é mostrada, não resolvida:** telefone da UBS Vila Cristina (3535-2908 e 3535-0709 no guia; 3527-2908 na Prefeitura), rua de referência da UBS Wenzel, endereço e telefone de Ferraz.
- **"Conferido" × "só listado":** `verificado_em` só existe para links que foram abertos; o validador recusa data em item "listado". O link "listado" aparece com selo tracejado na tela.
- "Atende o bairro" (guia da Saúde) é diferente de "fica no bairro" (localização): para USF não há área de abrangência publicada, e a tela diz isso.

### Testes executados (neste ambiente, 10/10/2026)
- `pytest pipeline/tests`: 105 passaram (inclui `test_institucional.py`: validações, contagens de bairros, divergências registradas, compatibilidade com `servicos.py`).
- Node: `acesso`, `recomendar`, `vagas`, `necessidades` (72 frases), `api` passaram; `institucional.test.js`: 173 verificações (casamento de bairros, "Vila Cristina" não casa com "Jardim Cristina", todo bairro do guia acha a sua UBS, telefones com DDD herdado e celular colado, ordem conferidos-primeiro).
- Navegador (Chromium/Playwright): busca por bairro com resultado, divergência e telefones; bairro desconhecido e texto curto; filtros (USF = 6 unidades); 44 links, todos `https`, `target=_blank` e `rel=noopener`; menu com 6 itens e página atual correta nas seis páginas; celular de 390 px sem rolagem horizontal e alvos de toque ≥ 40 px; **zero erros** de console nas duas páginas novas, pelo servidor e abrindo `demo_unico/*.html` por `file://`.

### O que NÃO foi verificado
- O `abrir_site.bat` **não foi executado** (o ambiente é Linux). Foi escrito com os mesmos padrões do `mism3.bat`, e o servidor que ele inicia (`pipeline/servidor.py --porta N`) foi testado aqui.
- **Nenhum link de secretaria foi aberto**: o ambiente não alcança `rioclaro.sp.gov.br` nem `saude-rioclaro.org.br` (política de rede). "Conferido" vale pela data do levantamento anterior; não foi reconferido hoje.
- Telefones e endereços das USF e da urgência 24 h foram lidos **de imagem** (captura de tela), não de texto: conferir na página ao vivo.
- Teste com pessoas reais, leitor de tela e contraste não foram feitos (ver `docs/criterios_usabilidade_frontend.md`).

### Pendências
1. Refazer a captura de `rioclaro.sp.gov.br/unidades-basicas-de-saude/` inteira (rolando até o fim ou "Salvar como PDF"): faltam USF cortadas (uma no Jardim Centenário, fone 3524-0313, nome ilegível) e parte da lista de UBS.
2. Rodar `python pipeline/verificar_catalogo.py` com internet e ligar para as unidades divergentes.
3. Obter CEP/coordenadas das unidades de saúde para que também entrem no mapa e na busca por CEP.
4. Decidir qual endereço de Planejamento está em uso (`secretaria-de-planejamento` ou `-e-habitacao`) e se "Governo e Relações Institucionais" e "Relações Institucionais" são o mesmo órgão.
5. Liberar os domínios `rioclaro.sp.gov.br` e `saude-rioclaro.org.br` na rede do ambiente de desenvolvimento para automatizar a conferência.

### Organização do dashboard e triagem das sugestões de empregabilidade — 10/10/2026
- A tela inicial foi reorganizada em três jornadas: **Trabalho e desenvolvimento**, **Saúde e rede de cuidado** e **Direitos e proteção**. As sete portas de entrada e seus identificadores foram preservados para não quebrar a busca existente.
- Os protótipos **De Mulher para Mulher** e **Inteligência Pública** foram separados em “Outras áreas da plataforma”, distinguindo o atendimento à população da ferramenta conceitual de gestão.
- Em buscas que identificam mais de uma necessidade, links oficiais repetidos e serviços compartilhados agora aparecem uma única vez, com aviso explicativo.
- A jornada de emprego ganhou um checklist de viabilidade que considera horário/escala, deslocamento, responsabilidades de cuidado, clareza do contrato e sinais de fraude. Isso é orientação de avaliação, não uma promessa de vaga ou de validação da empresa.
- As ideias do Gemini foram tratadas como arquitetura futura, não como funcionalidades já disponíveis. Ainda não existem integração real com Gov.br, verificação de identidade ou de CNPJ, cadastro público de profissionais, vagas integradas, fila municipal de creche, microcrédito, botão de pânico conectado à emergência nem armazenamento seguro em nuvem. Cada uma exige fontes oficiais, integração autorizada, análise jurídica e desenho de segurança antes de ser anunciada como funcional.
- Verificação executada após as mudanças: sintaxe de `web/app.js`, `web/necessidades.js`, `web/acesso.js` e dos três testes validada; os **39 cenários** do classificador, os testes de acesso/CEP e o novo `web/tests/dashboard.test.js` passaram. O teste estrutural confirma as sete portas, três jornadas, áreas complementares separadas e as rotinas de prevenção de redundância. Ainda falta abrir a interface no navegador e testar visualmente os fluxos combinados e o mapa por CEP.

### Moradia, dignidade financeira e acesso digital — 10/10/2026
- A tela inicial ganhou uma jornada **Moradia e vida financeira**, com as entradas **Moradia e aluguel** e **Dívidas e aposentadoria**. A busca local reconhece termos de moradia, despejo, cadastro habitacional, superendividamento, contas atrasadas e simulação previdenciária.
- A frase **“preciso sair de casa”** aciona tanto proteção/violência quanto moradia, para não tratar automaticamente uma possível situação de risco como mera questão habitacional.
- Foram adicionados caminhos para fontes oficiais verificadas: Secretaria de Habitação de Rio Claro (cadastro e critérios publicados), CRAS, tarifa social de água/esgoto municipal, Procon de Rio Claro, Procon-SP/PAS e serviço federal de simulação de aposentadoria. Os links orientam a procurar o órgão; não significam que o MISM3 processe inscrições, garanta benefício ou confirme disponibilidade atual.
- A tela agora informa explicitamente os limites digitais: ainda não há zero-rating, login Gov.br integrado, atendimento por áudio, sessão temporária garantida nem apagamento do histórico do navegador. O botão “Sair rápido” não apaga o histórico.
- Não foram criados formulários para coletar dívidas, situação habitacional, dados de violência, CPF ou informações previdenciárias. Também não foram inventados fila de aluguel social, concessão prioritária de moradia, renegociação automática ou cálculo próprio de aposentadoria.
- Verificação executada: **46 cenários** do classificador passaram; os testes de acesso/CEP e o teste estrutural do dashboard passaram; sintaxe dos scripts e testes validada. A inspeção visual no navegador ainda está pendente.
- Fontes oficiais usadas para orientar os links: https://rioclaro.sp.gov.br/secretaria/secretaria-de-planejamento-e-habitacao/ ; https://rioclaro.sp.gov.br/centro-ref-assistencia-social/ ; https://rioclaro.sp.gov.br/daae/familias-em-vulnerabilidade-social-podem-solicitar-tarifa-social-na-conta-de-agua-e-esgoto/ ; https://rioclaro.sp.gov.br/secretaria/secretaria-de-justica/ ; https://www.procon.sp.gov.br/carta-de-servicos/ ; https://www.gov.br/pt-br/servicos/simular-aposentadoria

## 2026-10-10 — Integração da `main` (jornadas, moradia, dívidas) com a linha da `keen-brown`

### Situação encontrada
A `main` (18 commits feitos pelo GitHub, todos lineares e sem merge) e a `keen-brown` (68 commits) haviam andado separadas. A `main` não perdeu nem apagou nada (zero arquivos removidos, zero marcadores de conflito, 3 testes passando), mas estava **atrasada**: não tinha API, painel de gestão, vagas, recomendador, documentos de decisão, `abrir_site.bat` nem os testes de pipeline. O merge simples conflitava em 7 arquivos, porque os dois lados mudaram a tela inicial e o classificador da busca.

### Como foi integrado (merge feito na branch `claude/nice-cannon-ap2wtt`; a `main` não foi alterada; ponto de retorno: tag local `backup/antes-integracao-main`)
- **Base = linha da `keen-brown`** (mais funcionalidade e desenho institucional), com o que a `main` trouxe de valor portado para dentro dela, e não colado por cima.
- **Classificador (`web/necessidades.js`):** mantido o da `keen-brown` (urgência primeiro, até 3 necessidades, radicais). Portados da `main`: as necessidades **moradia** e **dívidas/aposentadoria**; "aluguel", "moradia", "despejo" e "sem casa" saíram de "família"; pedidos para **sair de casa** acionam **violência primeiro** (aviso 180/190). Melhorias de auditoria: "endividada", "aposentar", "renegociar" passam a ser reconhecidos. Testes: 72 frases da `keen-brown` + 10 da `main` + 5 novas = 87.
- **Tela inicial:** desenho institucional da `keen-brown` com as **4 jornadas** da `main` (Trabalho e desenvolvimento; Saúde e rede de cuidado; Direitos e proteção; Moradia e vida financeira), 9 portas (+ "De mulher para mulher", condicional), ícones SVG no mesmo estilo, aviso de **acesso digital e privacidade** e "Outras áreas da plataforma" com 3 cartões [DEMO].
- **Redundância:** busca combinada agora compartilha um único estado (`novosVistos`) entre as categorias: links, serviços e o atalho "Veja também secretarias" aparecem uma só vez, com nota explicando. Checklist de emprego (horário, deslocamento, cuidado, contrato, golpes) incluído.
- **CSS:** as regras novas da `main` usavam variáveis que não existem no sistema visual atual (`--pri2`); foram **traduzidas** para as variáveis em uso, e o bloco duplicado de `.busca-necessidade` foi descartado.
- **`web/tests/dashboard.test.js` (da `main`):** ajustado de forma legítima (a porta "De mulher para mulher" é condicional; a deduplicação passou a ser conferida pelo mecanismo real). Ele só confere **texto no código**; o comportamento foi comprovado no navegador.

### Testes executados após o merge
Python 105 passaram; JS: `acesso`, `recomendar`, `vagas`, `api`, `institucional` (173), `dashboard`, `necessidades` (87 frases) passaram; sintaxe de todos os scripts ok. Navegador (Chromium): 4 jornadas, 10 portas visíveis em modo demonstração, portas moradia/dívidas/emprego/saúde, "preciso sair de casa" mostra violência antes de moradia com ajuda imediata 180/190, "estou endividada e quero me aposentar" entendido, busca combinada com **zero links e zero cartões repetidos**, celular de 390 px sem rolagem horizontal, e as páginas Saúde, Secretarias, Painel de gestão, De mulher para mulher e Inteligência pública sem erro de JavaScript.

### Não verificado / atenção
- Os textos dos cartões novos de moradia, dívidas e aposentadoria (por exemplo, que a página de Justiça traz contatos do Procon, ou que a de Habitação traz cadastro habitacional) **não foram conferidos nas páginas oficiais** (rede bloqueada neste ambiente). Os endereços de Habitação e Justiça constam como "só listados" em `catalogo/secretarias.csv`.
- "Aluguel" deixou de ser "família": o mesmo conjunto de serviços de assistência continua sendo mostrado, mas o rótulo mudou.
- A `main` ainda não recebeu este merge.
