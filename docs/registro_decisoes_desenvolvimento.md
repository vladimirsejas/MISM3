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
- (Regra substituída em 10/10/2026) Antes, dados fictícios eram marcados com `[DEMO]`. Agora **não há conteúdo fictício no projeto**: todo dado exibido tem fonte e data, e o que falta aparece como "não confirmado".
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

### Conselhos Tutelares: conferidos na página do CMDCA — 10/10/2026 (corrige a entrada anterior)
- O mantenedor enviou a impressão (PDF) da página https://cmdcarioclaro.com.br/contato/ de 10/10/2026, 03:27. Com ela, os dois Conselhos passaram a constar como **verificados**, com a fonte "CMDCA Rio Claro (página de contato, consultada em 10/10/2026)":
  - Sul: Avenida 05, nº 760, Centro, CEP 13500-380; (19) 3533-5411 / (19) 3532-5221.
  - Norte: Rua 01, nº 1809, Centro, CEP 13537-035; (19) 3523-6439.
- **Correção:** o telefone (19) 99336-6682 (plantão/WhatsApp) e o detalhe "entre as ruas 8 e 9", vindos do texto colado antes, **não constam na página** e foram removidos. O CEP do Norte, antes ausente, agora vem da página.
- A página também lista o administrativo do CMDCA (Casa dos Conselhos, Rua 8, nº 3.131, Alto do Santana, CEP 13504-096, (19) 3533-2507; atendimento de segunda a sexta, 8h às 17h). Não foi cadastrado: é o conselho de direitos, não o Conselho Tutelar, e o horário da página não está claramente atribuído aos Conselhos Tutelares.
- Horário e plantão dos Conselhos Tutelares **não constam** na fonte; a interface manda ligar antes. O campo `conferido=nao` e o aviso na interface continuam disponíveis para futuros itens não conferidos.
- Nova coluna opcional `fonte` no catálogo manual, para nomear a fonte quando não for a Prefeitura.

### Remoção de todo conteúdo de demonstração — 10/10/2026
- Removidos: `web/dados/demo/` (serviços e CEPs inventados), `web/prototipos/` (protótipos De Mulher para Mulher e Inteligência Pública com perfis e gráficos fictícios) e `docs/roteiro_demo_mism3.md` (histórias de personagens fictícias). Continuam no histórico do git até o commit `355b010`.
- Removidos também as verificações de `meta.demo` no código e o campo `"demo": false` dos arquivos gerados pelo pipeline. Um teste agora impede que esses caminhos voltem.
- Mantidos `web/dados/setores.geojson` e `setores_resumo.json` (dados reais do IBGE, para o marco de setores censitários); a página que os exibia era o painel conceitual removido, então hoje nada na interface os usa.
- Ainda não confirmado e sem dado para cadastrar: CRAS e CREAS (página oficial não pôde ser lida), unidades de saúde (CNES), fonte oficial do Disque 100, tarifa social de energia.

### CRAS, CREAS, unidades de convivência e Disque 100 com fonte oficial — 10/10/2026
- Páginas da Secretaria de Desenvolvimento Social de Rio Claro (impressas pelo mantenedor em 10/10/2026, 03:31 e 03:32) e página do gov.br "Denunciar violação de direitos humanos (Disque 100)" (03:34; última modificação 15/12/2025). A rede da sessão não alcança esses sites, então o conteúdo foi lido nos PDFs enviados.
- Cadastrados 6 CRAS (com a lista de bairros atendidos publicada), o CREAS (Rua 6, 640; (19) 3523-6420 / 3523-6439; e-mail creas@rioclaro.sp.gov.br; atende todo o município) e 13 unidades de convivência (SCFV). Telefones sem DDD na fonte receberam "(19)", o DDD de Rio Claro.
- O CRAS Região Jardim Brasília consta na fonte como "em endereço provisório", sem endereço e sem telefone; a interface não inventa e remete à Secretaria, (19) 3522-1930 (telefone já verificado no catálogo).
- **Inconsistência sinalizada:** (19) 3523-6439 aparece como telefone do Conselho Tutelar Norte (CMDCA) e do CREAS (Prefeitura). Ambos foram cadastrados como publicados, com aviso no cartão do Conselho Norte. Conferir por telefone qual é o número correto.
- Novos recursos: campo `bairros` no catálogo e busca "Qual CRAS atende o meu bairro?" (sem acento, abreviações como Jd./Pq. por extenso; roda no aparelho). Aviso: a lista é de bairros, não de ruas.
- Disque 100: texto do cartão conforme a fonte (24 horas, todos os dias, gratuito de qualquer telefone, discando 100), com link e data. O painel de emergência passou a dizer "24 horas, gratuito" para o 100.
- Ainda sem dado: horário de funcionamento de CRAS, CREAS, SCFV e Conselhos Tutelares; unidades de saúde (CNES); tarifa social de energia.

### APAE Rio Claro — 10/10/2026
- Fonte: captura de tela do rodapé do site oficial https://apaerioclaro.com.br/ enviada pelo mantenedor (o site não permite impressão em PDF). Cadastradas as duas unidades de atendimento: Unidade Central (Av. Presidente Tancredo Neves, 249, Cidade Claret; (19) 2112-2700 e WhatsApp (19) 99694-2420) e Unidade Assistência Social I (Rua 15, 843, Consolação; (19) 3597-0323). O endereço da Central coincide com o do SCFV "Pessoa Adulta APAE" na página da Prefeitura.
- **Decisão:** as residências inclusivas (Casa 1, Casa 2 e residência masculina) citadas no site **não foram cadastradas**. São moradias de pessoas com deficiência; sua localização não é um serviço de atendimento ao público e divulgá-la pode expor moradores.
- Limite: a captura mostra só o rodapé; horário de funcionamento e público atendido não constam e não foram inventados.

### Centro de Habilitação Infantil "Princesa Victória" — 10/10/2026
- Fonte: captura de tela do blog https://chipv.wordpress.com/ (WordPress.com, sem data de atualização), enviada pelo mantenedor. Cadastrado em **Saúde** como **não conferido**: Avenida José Felício Castellano, 1.700, Vila Cristina; atende crianças e adolescentes de 0 a 14 anos (para admissão) com deficiências físicas, visual, auditiva, má formação labiopalatal, deficiências múltiplas ou atraso neuro-psicomotor.
- O telefone do blog, (19) 535-1461, tem 7 dígitos (formato antigo) e **não foi convertido nem virou link de ligar**; aparece só como texto, com a recomendação de confirmar o número atual.
- Não usados: o número de atendidos e a lista de especialidades de um texto colado junto, que parece resposta de IA e cita páginas não lidas (por exemplo saude-rioclaro.org.br/UBS/centros.html). Falta a página da Secretaria Municipal de Saúde para conferir.

### Centro de Especialidade Infantil (CEI) — 10/10/2026
- Fonte: notícia da Prefeitura de Rio Claro (Fundação de Saúde), https://rioclaro.sp.gov.br/fundacao-de-saude/rio-claro-ganha-centro-de-especialidade-infantil-neste-sabado/, **publicada em 11/10/2019**, impressa em PDF pelo mantenedor em 10/10/2026.
- Cadastrado em Saúde o CEI "Antonio Carlos Rodrigues – Tute" (Rua 15, entre as avenidas 23 e 25, Bairro do Estádio; telefones 3523-3754, 3533-4055 e 3524-5770, com DDD 19 acrescentado), que reúne o Criari, o Caps IJ, o CEO Infantil e a odontologia do CHI Princesa Victória.
- Marcado como **não conferido** com aviso próprio: a notícia tem 7 anos, então endereço, telefones e composição dos serviços podem ter mudado. Novo campo opcional `aviso` no catálogo para texto de alerta específico. Criari, Caps IJ e CEO Infantil não receberam cadastro próprio por falta de endereço e telefone específicos na fonte.
- O cartão do CHI registra, com a mesma fonte, que a odontologia dele passou a funcionar no CEI.
- O texto de IA colado antes sobre o CRIARI (3 a 18 anos, "consultas psiquiátricas") não foi usado: não há fonte lida que o sustente.

### CHI com fonte oficial e Assistência Social reorganizada — 10/10/2026
- **CHI Princesa Victória:** conferido no site oficial do centro (https://www.pessoacomdeficiencia.rc.sp.gov.br/, domínio da Prefeitura, Fundação Municipal de Saúde), impresso em 10/10/2026, 03:53: Avenida José Felício Castellano, 1700, Vila Cristina; telefones (19) 3527-1461 e 3535-4408; e-mail chi@rc.saude-rioclaro.org.br. O telefone do blog antigo, 535-1461, estava desatualizado e **não era corrigível apenas acrescentando um dígito** (o número atual é 3527-1461). O público atendido (0 a 14 anos) segue vindo do blog sem data e o cartão pede confirmação.
- **Assistência Social:** a página tinha mais de 30 cartões de uma vez. Passou a quatro blocos: "Seu CRAS" (busca por bairro e os 6 CRAS), "Proteção e denúncia" (CREAS, 2 Conselhos Tutelares e Disque 100), "Convivência e apoio" (13 SCFV e 2 unidades da APAE, em grupos recolhidos por público) e "Secretaria e outros canais" (recolhido). Cartões visíveis ao abrir: 12 de 31. A frase "horário não consta na fonte" saiu de cada cartão e ficou uma vez na caixa de pendências. Novos campos no catálogo: `grupo` (agrupamento) e, nas áreas, `subtipos`, `recolhida`, `agrupar` e `busca`.
- Link adicionado: site oficial "Pessoa com deficiência em Rio Claro" (entidades e cadastro de pessoas com deficiência).

### Saúde preparada para a base do CNES — 10/10/2026
- A área Saúde passou a agrupar as unidades por tipo (unidade básica, urgência, hospital, CAPS, atendimento especializado, saúde da criança e do adolescente). Com poucos serviços os grupos já vêm abertos; com muitos vêm recolhidos, com contagem.
- O aviso da área muda sozinho: sem base do CNES, diz que a lista completa depende do pipeline; com a base, diz que o CNES pode estar desatualizado e não informa vaga nem horário.
- Verificado em navegador com uma base **simulada** (62 unidades sintéticas, criada só numa pasta temporária de teste, nunca no projeto): grupos corretos, nenhum cartão visível antes de abrir um grupo, 40 cartões no maior grupo, fonte "CNES/DATASUS" em cada um. **Não foi testado com o CNES real**, que fica na máquina do mantenedor (`docs/cnes` está no `.gitignore`).
- Como gerar: `python pipeline/cnes.py docs/cnes` (diagnóstico) e `python pipeline/servicos.py` (gera `web/dados/servicos.json`, que inclui também o catálogo manual). O site passa a usar esse arquivo no lugar de `catalogo_manual.json`.

### Cadastro CNESNet da Fundação Municipal de Saúde — 10/10/2026
- Fonte: PDF do CNESNet (Ministério da Saúde, "Dados da Mantenedora" e lista de mantidas) da Fundação Municipal de Saúde de Rio Claro, impresso pelo mantenedor em 10/10/2026, 04:01 (https://cnes2.datasus.gov.br/Listar_Mantidas.asp?VCnpj=00955107000193&VEstado=35).
- Cadastrada em Saúde a própria Fundação: Rua 6, 2572, Centro, CEP 13500-190, telefone (19) 3522-3600, com aviso de que são dados do cadastro nacional e podem estar desatualizados. É o contato para "confirmar com a Secretaria Municipal de Saúde" que várias áreas pedem.
- A lista tem **51 estabelecimentos** mantidos pela Fundação, só com nome e código CNES, sem endereço, telefone ou horário. Por isso **não foram cadastrados à mão**: a base completa do CNES (na máquina do mantenedor) fornece esses campos, e cadastrar nomes sem endereço duplicaria as unidades quando o pipeline for rodado. Pelos nomes, a lista inclui cerca de 21 UBS/USF, 2 UPAs 24 horas, 1 hospital municipal, 3 CAPS, CEO, centros de especialidades e reabilitação, e também farmácias, laboratório, regulação, bases do SAMU, vigilância e zoonoses (estes últimos o pipeline deixa de fora do site).
- Correção: a detecção de "base do CNES carregada" passou a usar o prefixo `cnes-` do id (marcador do pipeline) em vez de procurar "CNES" na fonte, porque a própria Fundação, cadastrada à mão, cita o CNES e escondia o aviso de lista incompleta.
- Os telefones dos Conselhos Tutelares permanecem os da página do CMDCA (confirmado pelo mantenedor).

### Busca por CEP com o índice real e proteção do .env — 10/10/2026
- O mantenedor já possui `web/dados/cep_indice.json` (não versionado). Com ele, a busca por CEP aparece dentro das áreas que têm serviços. Como o catálogo do projeto é gerado sem índice, o site passou a localizar, em tempo de execução, os serviços que têm CEP e não têm coordenada, pelo centro do CEP (marcados como localização aproximada), sem exigir regeração do catálogo.
- Verificado em navegador com um índice **sintético** criado apenas numa pasta temporária de teste: formatação do CEP, localização dos serviços, distância aproximada, mapa, mensagens de CEP inválido e desconhecido, ausência de requisições externas sem consentimento, e limpeza do CEP e do resultado ao sair da área. **Não foi testado com o índice real.**
- `.env` passou a constar no `.gitignore` (estava fora do controle de versão, mas sem proteção contra um `git add .` acidental).

### Lista oficial da rede municipal de saúde e distribuidora de energia — 10/10/2026
- Por orientação do mantenedor, a lista do CNESNet (51 estabelecimentos mantidos pela Fundação Municipal de Saúde) é tratada como a **rede municipal completa**; o texto "pode haver outras unidades" foi retirado. O mantenedor confirmou que Rio Claro tem 2 UPAs 24 horas, o que coincide com a lista.
- Foram incluídos na página Saúde 32 estabelecimentos **onde a pessoa vai** (2 UPAs, 1 hospital, 3 CAPS, 21 UBS/USF e 5 de especialidades, reabilitação e saúde do trabalhador), com nome e código CNES, como lista recolhida. Ficaram de fora, como no pipeline, farmácias, dispensário, laboratório, regulação, bases do SAMU, vigilância, zoonoses, sede da Fundação (cadastrada à parte), unidade odontológica móvel e a "UNAMOS UNESP" (natureza não identificada). Nomes padronizados e acentuados a partir de um cadastro em letras maiúsculas.
- A lista **some sozinha** quando a base do CNES com endereços é carregada (detecção pelo prefixo `cnes-` do id), para não duplicar as unidades.
- Distribuidora de energia de Rio Claro: **Elektro** (informação do mantenedor, não verificada em página oficial). O aviso de Moradia diz que o desconto da tarifa social de energia é aplicado pela Elektro e que o link oficial ainda não foi verificado.

### Elektro (distribuidora de energia) — 10/10/2026
- Fonte: PDF de uma notícia da própria Elektro (Neoenergia), "Espaço de atendimento da Elektro em Rio Claro em novo endereço", **publicada em 17/12/2020**, impressa pelo mantenedor em 10/10/2026, 04:14. A impressão não traz o endereço (URL) da página, por isso a fonte é citada sem link.
- Confirma que a distribuidora de Rio Claro é a Elektro. Cadastrado em Moradia o atendimento ao cliente: Avenida 7, nº 190, bairro Cidade Nova; das 8h às 17h; serviços (ligação nova, alteração da data de vencimento, troca de titularidade, pedido de desligamento); canal de WhatsApp (19) 2122-1696, exibido só como texto, sem link de ligação.
- Aviso na interface: a notícia tem seis anos e endereço, horário e canais podem ter mudado.
- A notícia **não trata de tarifa social de energia**. O aviso de Moradia segue dizendo que o link oficial dessa tarifa não foi verificado; falta a página da Elektro sobre o tema.

### Link da ANEEL sobre a tarifa social — 10/10/2026
- Adicionado em Moradia o link https://www.gov.br/aneel/pt-br/assuntos/tarifas/tarifa-social, informado pelo mantenedor. **O conteúdo da página não foi lido** (a rede da sessão não alcança gov.br); por isso a descrição no site é neutra e diz que o sistema não confere os critérios de quem tem direito.
- A pendência "link oficial ainda não verificado" foi substituída por uma orientação: ver a página da ANEEL e procurar a Elektro e o CRAS. A elegibilidade (por exemplo CadÚnico) não foi afirmada no site porque nenhuma página lida a confirma.
- Adicionado também https://www.neoenergia.com/tarifa-social (Neoenergia, grupo da Elektro), informado pelo mantenedor e **não lido** (site inacessível à sessão). Como o grupo atende outros estados, o cartão pede para confirmar que regras e canais valem para a Elektro em Rio Claro.
- Adicionado em Moradia o link do site do DAAE sobre o desconto na conta de água e esgoto para famílias de baixa renda (https://daaerioclaro.sp.gov.br/familias-de-baixa-renda-podem-solicitar-desconto-ao-daae-na-conta-de-agua-e-esgoto/), informado pelo mantenedor e **não lido** (site inacessível à sessão). Mantido também o link anterior do portal da Prefeitura; os dois usam termos diferentes ("baixa renda" e "vulnerabilidade social") e os critérios não foram conferidos.

### Tarifa Residencial Social de Água e Esgoto (DAAE) — 10/10/2026
- Fonte: informativo em PDF do DAAE, "Tarifa Residencial Social de Água e Esgoto", conforme a **Resolução ARES-PCJ nº 592/2024**, enviado pelo mantenedor. O PDF não traz data de publicação nem telefone.
- Conteúdo cadastrado em Moradia: desconto de 50% no consumo de até 15 m³ e 25% na faixa de 16 a 20 m³ (só categoria residencial); quem tem direito (renda de até R$ 759 por pessoa e CadÚnico, ou pessoa com deficiência/idosa de 65 anos ou mais que receba o BPC); onde e quando (DAAE, Avenida 8A, 360, entrada pela Avenida 6A, segunda a sexta, 8h30 às 15h30); documentos; prazo de até 10 dias; validade de 12 meses e renovação; ligação compartilhada; e quando o desconto se perde.
- **Alerta:** R$ 759 é meio salário mínimo e acompanha o reajuste do salário mínimo; o informativo não tem data, então o valor pode estar desatualizado. O cartão avisa para confirmar o valor atual no DAAE.
- A página Moradia foi reorganizada em três blocos (Água e esgoto, Energia elétrica, Habitação). As regras da tarifa social de **energia** seguem sem leitura de página oficial; os links da ANEEL e da Neoenergia continuam sem conteúdo lido.

### Matrix Energia (não usado) e aviso do 0800 do DAAE — 10/10/2026
- O PDF `regrasaneel.pdf` enviado pelo mantenedor é, na verdade, um artigo de blog da **Matrix Energia** (comercializadora privada de energia), atualizado em 19/06/2026: explica a composição da tarifa de energia, bandeiras tarifárias e Grupos A e B, e promove energia solar por assinatura para empresas. **Não trata da Tarifa Social**, não menciona a Elektro nem Rio Claro e não é fonte oficial. Nada dele foi usado no site.
- Adicionado em Moradia (bloco Água) o link do aviso do DAAE sobre a linha 0800 por WhatsApp (https://daaerioclaro.sp.gov.br/linha-0800-do-daae-passa-a-atender-whatsapp/), informado pelo mantenedor e **não lido**. Os números do 0800 e do WhatsApp **não foram cadastrados** porque não foram vistos em nenhuma fonte; um teste impede que um número 0800 seja escrito sem fonte.
- O mantenedor enviou ao branch o commit "Adiciona documentacao do CNES" com 7 PDFs (os mesmos já lidos). Eles não contêm endereço nem telefone das unidades de saúde.

### Endereços das unidades de saúde — página da Fundação Municipal de Saúde — 10/10/2026
- Fonte: PDF da página oficial "Endereços das unidades de saúde de Rio Claro-SP" (https://www.saude-rioclaro.org.br/enderecos.htm), da Fundação Municipal de Saúde, impresso pelo mantenedor em 10/10/2026, 04:32. Traz endereço, telefone e horário de cada unidade; a página não tem data de atualização própria.
- Cadastradas 41 unidades novas (22 UBS/USF, 3 de pronto atendimento 24 horas, 3 CAPS, 5 de especialidades, 4 de farmácia/exames/transporte, 3 hospitais/ambulatórios que não são da rede municipal) mais o Hospital Público Municipal Maria Thereza Ramos Vitti, que só consta por nome. O total de unidades de saúde no catálogo é 44, em sete grupos recolhidos. Ficaram de fora, por não serem lugares de atendimento ao público: SAMU, vigilâncias epidemiológica e sanitária, controle de zoonoses, combate à dengue e SESMT.
- **Cruzamento com a lista do CNES (51 estabelecimentos):** 34 registros do catálogo receberam o código CNES por correspondência clara de nome (20 UBS/USF, 2 UPAs, 3 CAPS, SEPA, CEAD, CEO, CEREST, dispensário, laboratório, hospital municipal, CHI e a sede da Fundação). **Sem código, por falta de correspondência segura:** USF Terra Nova, USF Ferraz, CEO Infantil e o Pronto Atendimento de Ginecologia e Obstetrícia. O CNES lista 21 UBS/USF e a página, 22; a unidade "UBS PSF Dr. Emilio Beltrati Junior" (CNES 7045395) não foi associada a nenhuma delas. O mapeamento da UPA da Av. 29 ao CNES 7038895 (UPA Dr. Olavo Narkevitz) é inferência: a página não dá o nome, e o mantenedor confirmou que há duas UPAs.
- **Divergências sinalizadas na interface:** (1) sede da Fundação: a página diz Rua 6, 2580, Santa Cruz, (19) 3525-4717; o CNES diz Rua 6, 2572, Centro, (19) 3522-3600; (2) a página lista a UPA do Cervezão e o CAPS III no mesmo endereço, Rua M9, 66.
- Novo campo opcional `cnes` no catálogo: quando o pipeline completo é rodado, a unidade cadastrada à mão **vence** o registro `cnes-<código>` correspondente (que não traz telefone nem horário), evitando duplicidade. Registros do CNES sem correspondente manual caem nos mesmos grupos pelo subtipo.
- Retirada a lista "só com nomes e códigos" da rede municipal criada antes, que deixou de ser necessária. O Hospital Municipal permanece, com aviso de que nenhuma fonte traz endereço e telefone.
- O CHI passou a constar também com o horário da página (dias úteis, das 7h às 16h); o CEI recebeu a observação de que a página lista hoje o CAPS I e o CEO Infantil na Rua 15, nº 51, Consolação, com os mesmos telefones da notícia de 2019.

### Fontes arquivadas em docs/documetacao — 10/10/2026
- O mantenedor enviou à branch a pasta `docs/documetacao` com 7 PDFs. Conferidos por SHA-256: são **idênticos** aos PDFs recebidos na conversa e lidos para os cadastros. Foram acrescentados mais 3 (endereços das unidades de saúde, Elektro e informativo do DAAE) e um `LEIA-ME.md` que diz, para cada arquivo, o que é, a página de origem, o horário da impressão e onde foi usado. Um teste exige que todo PDF da pasta esteja explicado no `LEIA-ME`.
- O artigo da Matrix Energia não foi arquivado: não é fonte oficial e não foi usado.

### Proteção contra envio acidental de bancos de dados — 10/10/2026
- O mantenedor mantém, fora deste repositório, bancos de dados de um projeto anterior (`escudo_feminino*.db`) e cópias de segurança. **Nenhum deles foi aberto ou lido pela sessão.** Como esse tipo de arquivo pode conter dados pessoais, o `.gitignore` passou a bloquear `.env`, `*.db`, `*.sqlite`, `*.sqlite3`, `*.backup` e `*.bak`, com teste automático.

### Correção: servicos.json antigo escondia CRAS e CREAS — 10/10/2026
- **Defeito:** o site usava o `servicos.json` (gerado pelo pipeline) **no lugar** do `catalogo_manual.json`. Um `servicos.json` gerado antes da atualização do catálogo fazia o site mostrar 0 CRAS e 0 CREAS. Reproduzido em navegador antes da correção.
- **Correção:** o catálogo verificado agora é carregado sempre; o `servicos.json` só **acrescenta** o que não está nele (CNES e Censo Escolar), descartando registros `cnes-<código>` de unidades já cadastradas à mão. Teste novo com um `servicos.json` antigo simulado; a bateria passou a recriar as pastas de teste a partir do código atual a cada execução.
- Consequência para quem edita o CSV: rodar `python pipeline/servicos.py --somente-manual` para atualizar o catálogo versionado.
