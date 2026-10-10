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

### Redesign "Mulher em Rede": sete portas, emergência em botão e fim da demonstração — 10/10/2026
- **Causa do problema anterior:** o commit `1ed42bf` removeu as portas Filhos e Família do `index.html` sem ajustar `app.js`, README e teste. Foi revertido e, em seguida, a tela foi redesenhada conforme a especificação (exatamente sete portas).
- **Tela inicial:** propósito + botão "Em perigo agora?" + sete portas. Saíram da home: busca por texto, busca por CEP, aviso de privacidade, "outras áreas", cartões de assistência e a faixa vermelha. Cada área é aberta por `#id` (histórico do navegador funciona); De Mulher para Mulher é `rede-mulheres.html`.
- **Mapeamento das portas antigas:** emprego_curso→Trabalho; estudo e filhos→Educação; saúde→Saúde; casamento, violência, dívidas e aposentadoria→Direitos; moradia→Moradia; família e assistência→Assistência Social. Conteúdo em `web/areas.js`.
- **Emergência:** `<details>` nativo (funciona sem JavaScript, Esc e clique fora fecham) com 190, 192, 193, 180, 100 e 188 como links `tel:`. "Sair" abre outro site e declara que não apaga o histórico.
- **Dados reais:** a interface não carrega mais `dados/demo`. Usa `servicos.json` (pipeline) ou, na falta, `catalogo_manual.json` (10 serviços do CSV, todos com fonte e data). Lacunas aparecem como "não confirmado" (CNES/unidades de saúde, CREAS, Conselho Tutelar, tarifa social de energia). Textos de desenvolvedor foram retirados do CSV.
- **De Mulher para Mulher:** os perfis, selos, cadastro e denúncia eram fictícios; a página agora diz que a área ainda não existe e mostra apenas canais reais (Ligue 180 e Secretaria da Mulher). Os protótipos ficaram em `web/prototipos/`.
- **Busca por texto:** saiu da home (especificação), mas voltou dentro de cada área como "indicar área": usa `necessidades.js` (47 testes) e só aponta para uma das seis áreas (`AREA_DA_NECESSIDADE` em `web/areas.js`), sem conteúdo novo. Também foi adicionado o link "Pular para o conteúdo".
- **Verificado:** testes JS (acesso, necessidades, dashboard) e 34 de pipeline passaram; teste no Chromium (30 verificações: portas, Voltar/Início/histórico, emergência, celular 375px, ausência de erros de console).
- **Não verificado:** links externos (rede sem acesso aos sites oficiais nesta sessão), os números de emergência contra fonte oficial atual, a busca por CEP e o mapa com dados reais, leitores de tela, aparelhos físicos.

### Conselhos Tutelares (não conferidos) — 10/10/2026
- Cadastrados no catálogo os Conselhos Tutelares Região Sul (Avenida 5, 760) e Região Norte (Rua 1, 1809; plantão por telefone/WhatsApp), com a coluna nova `conferido=nao`. A origem é pesquisa na internet informada pelo mantenedor; **nenhuma página oficial foi lida** (a rede da sessão não alcança os sites). O link de conferência é https://cmdcarioclaro.com.br/contato/.
- A interface mostra "Ainda não conferido na página oficial. Ligue antes de ir." e "informado em", nunca "verificado em", para esses itens. Horários, bairros atendidos e CEP do Conselho Norte não foram informados e não foram inventados.
- Correção: telefones múltiplos num mesmo campo (separados por " / ") agora têm um link `tel:` cada; antes seriam emendados num único número inexistente.
- Pendente: conferir os dois Conselhos na página oficial e então trocar `conferido` para vazio; cadastrar CRAS e CREAS; o texto colado cita um "Segundo Conselho Tutelar" na Rua 1 com Avenida 14, e não está confirmado que seja o mesmo que o da Região Norte.
