# Observatório da Mulher Rio-Clarense e o Mulher em Rede: como o projeto pode gerar dados sem expor as mulheres

Documento de **proposta**, escrito em 11/10/2026. Nada aqui está implementado. As decisões que dependem da Secretaria Municipal da Mulher estão na seção 6.

## 1. O que a Secretaria apresentou (apresentação "Observatório da Mulher Rio-Clarense")
- Ideia central: *"Não é sobre criar mais ações, é sobre fazer as ações existentes funcionarem juntas."* Os atendimentos já existem, mas estão fragmentados; faltam integração, dados e estratégia unificada.
- Quatro pilares: **governança de dados**, rede integrada, autonomia feminina e inteligência pública.
- O Observatório quer **padronizar registros, fortalecer a atuação intersetorial, identificar áreas de risco, permitir atuação preventiva e basear decisões em evidências**.
- A Fatec Rio Claro entra com arquitetura do sistema, banco de dados, dashboards, análise de indicadores, IA e relatórios.
- Cronograma citado: diagnóstico (maio-junho/2026), integração da rede (junho), protocolos e fluxos (julho-agosto) e lançamento (agosto/2026).

O primeiro pilar é **governança de dados**. É o que orienta o desenho abaixo.

## 2. O que o Mulher em Rede já é
Um site público, estático, que **não grava nada** sobre quem o usa: sem cadastro, sem cookies, sem localStorage, sem servidor. O CEP é consultado só no aparelho. A página diz isso à usuária. Foi uma decisão deliberada, porque muitas mulheres que usam o site podem estar em situação de violência, e quem as agride pode ter acesso ao celular delas.

## 3. O que NÃO recomendo construir
**Um "lado escondido" que vá guardando informações de cada mulher** (o que ela buscou, onde mora, o que precisa), ligadas a ela, sem que ela saiba ou concorde.

Motivos:
1. **Segurança.** Um banco com perfis individuais de mulheres em situação de violência é um alvo: vazamento, acesso indevido ou abuso por quem tem acesso interno podem colocá-las em risco real.
2. **Lei (LGPD, Lei 13.709/2018).** Coletar dados pessoais exige finalidade clara, transparência, minimização e base legal. Dados sobre saúde ou violência são **dados pessoais sensíveis** (art. 5º, II e art. 11). Coletar às escondidas é ilegal, mesmo com boa intenção.
3. **Confiança.** O site promete que não guarda nada. Se isso deixar de ser verdade em silêncio, a mulher que descobrir pode parar de usá-lo (e de pedir ajuda).
4. **Não é necessário.** A Secretaria precisa entender o **conjunto** das mulheres (o que procuram, onde falta serviço, onde há barreira). Para isso, dados **anônimos e agregados** bastam e são mais seguros.

## 4. O que recomendo: duas camadas, com a camada de dados anônima, voluntária e transparente

**Camada pública (como é hoje):** o site continua sem gravar nada sobre quem navega.

**Camada de pesquisa (nova, opcional):** um bloco claro, *"Ajude a Secretaria a entender o que as mulheres de Rio Claro precisam"*, com perguntas de marcar **X** (sem digitar), que a mulher só responde se quiser.
- **Anônimo:** nenhum nome, CPF, telefone, e-mail, IP guardado, CEP, nem cookie ou identificador. Cada resposta é uma linha solta, sem ligação com a pessoa nem com as respostas anteriores dela.
- **Voluntário e explícito:** o botão diz o que acontece com a resposta, e a mulher pode ignorar sem perder nada.
- **Sem pergunta sobre violência**, saúde individual ou qualquer coisa que a identifique. Quem precisa de ajuda não é "pesquisada": é atendida (botão "Em perigo agora?").
- **Local em faixas, não em pontos:** região da cidade (centro, norte, sul, leste, oeste, zona rural, distritos), nunca CEP ou rua. Idade em faixas largas.
- **Só aparece em relatório quando há pelo menos 10 respostas no recorte** (regra de privacidade para não identificar ninguém em grupos pequenos).

**Lado da Secretaria (fechado ao público):** um painel com login, que mostra **apenas resultados agregados** (gráficos e tabelas) e permite exportar relatório. Sem acesso a linha por linha com dados que identifiquem alguém, porque esses dados não existem.

## 5. Perguntas de marcar X (rascunho para a Secretaria revisar)
Todas com a opção **"prefiro não responder"**.
1. O que você veio buscar hoje? *(marque quantos quiser: trabalho, educação/creche, saúde, direitos, moradia, assistência social, transporte, outro)*
2. Você encontrou o que precisava? *(sim / em parte / não)*
3. Se não encontrou, o que atrapalhou? *(não achei a informação / o telefone não atende / não há vaga / falta transporte / não sabia que o serviço existia / informação desatualizada / outro)*
4. Em que região você mora? *(centro, norte, sul, leste, oeste, zona rural, distritos)*
5. Sua faixa de idade? *(18-24, 25-34, 35-44, 45-59, 60 ou mais)*
6. Você tem filhos ou crianças sob sua responsabilidade? *(não / 1 / 2 ou mais)*
7. Qual é a sua situação hoje? *(trabalhando, procurando trabalho, estudando, cuidando da casa/família, outra)*
8. O que mais falta em Rio Claro para as mulheres? *(marcar até 3: creche, curso, vaga de emprego, transporte, atendimento de saúde, orientação jurídica, moradia, segurança, outro)*
9. O site foi fácil de usar? *(sim / mais ou menos / difícil)*

Sem campo de texto livre na primeira versão (campo livre costuma receber nomes, telefones e relatos que identificam e que a pesquisa não deveria guardar).

## 6. O que precisa ser decidido com a Secretaria (e que eu não posso decidir sozinho)
1. **Quem é o controlador dos dados** (a Secretaria, em geral) e quem é o encarregado (DPO).
2. **Pedido formal:** a apresentação mostra a parceria, mas um contrato ou termo de cooperação da Prefeitura com a Fatec define responsabilidades.
3. **Onde fica o servidor:** o ideal é infraestrutura da própria Prefeitura. Um site estático não pode receber nem guardar respostas: é preciso um serviço de coleta.
4. **Quem acessa o painel**, como entra (gov.br ou conta institucional) e por quanto tempo os dados ficam.
5. **Texto de consentimento e de privacidade** aprovado pelo jurídico.
6. **Uso para pesquisa acadêmica:** se os dados forem publicados num trabalho da Fatec, avaliar o comitê de ética.
7. **Dados que a Secretaria já tem** (atendimentos, ocorrências) e que alimentariam o Observatório: isso é outra frente e exige base legal própria, fora deste site.

## 7. Etapas sugeridas
- **Etapa 0 (feita aqui):** este documento.
- **Etapa 1:** a Secretaria revisa e decide a seção 6.
- **Etapa 2:** construir o bloco de perguntas e o painel de resultados com **dados de teste claramente marcados**, sem nenhuma coleta real.
- **Etapa 3:** com servidor, jurídico e consentimento aprovados, ligar a coleta de verdade e atualizar o texto de privacidade do site.

## 8. O que muda no que o site diz às mulheres
Hoje: *"Nada do que você responde é enviado ou guardado."* Isso continua verdadeiro para o plano e as buscas. Quando a camada de pesquisa existir, ela deve vir **separada e identificada**, com o aviso do que é enviado, e as promessas atuais não podem ser enfraquecidas.
