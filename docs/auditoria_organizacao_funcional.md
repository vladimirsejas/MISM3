# Auditoria de organização funcional do MISM3: a planta do armário

31/10/2026. Somente leitura: nenhum arquivo do site foi alterado por esta auditoria. Cada achado diz como foi conferido. Complementa `analise_reorganizacao.md` (mesma data). Um texto colado do ChatGPT foi usado como **sugestão**, não como ordem: o que ele traz de bom foi conferido e incorporado; o que não confere está marcado abaixo.

Critério: abrir cada porta e cada prateleira e perguntar se o objeto está no lugar certo, se há dois iguais, se algo está na gaveta errada ou escondido, e se o que parece organizado por fora está por dentro.

## 1. O que foi conferido contra o texto colado do ChatGPT

| Afirmação | Resultado |
|---|---|
| Trabalho tem 16 atalhos e 18 blocos, tudo em `jornada-ui.js` | **Confirmado.** 16 links + currículo; 18 blocos de 448 a 4.291 caracteres. |
| Saúde não tem saúde da mulher | **Confirmado no texto da área**; ver 2.3 para a nuance. |
| Entre Mulheres não tem ninguém cadastrado e o canal não está definido | **Confirmado.** `ofertas_mulheres.json`: 0 ofertas; `entre_mulheres_canal.json`: whatsapp e e-mail `null`. |
| Painel usa 420 registros sintéticos | **Confirmado.** `painel_teste.json`: 420 registros. |
| Coleta do questionário desligada | **Confirmado.** `coleta.json`: `ativa: false`. |
| Transporte: 5 linhas, 382 horários, validade até 04/02/2027, Arco-Íris/Mãe Preta ausente, Circular I só no sentido Volta | **Confirmado** em `horarios_onibus.json`. Feriados também não constam. |
| `estado_do_projeto.md` diz 19 perguntas; o código tem 20 | **Parcialmente.** O código tem 20 itens: 19 de marcar (15 de escolha única, 4 de várias) e 1 campo de texto opcional (`fale_de_voce`). Então "19" e "20" descrevem o mesmo questionário de dois jeitos; falta padronizar a frase ("19 perguntas de marcar e um espaço opcional"). |
| `questionario_observatorio.md` diz "nenhum texto livre" e depois descreve o campo "Fale de você" | **Confirmado**, linhas 6 e 13: o documento se contradiz. |
| Números de emergência repetidos em vários arquivos | **Confirmado**: `index.html` (duas listas), `areas.js` (`EMERGENCIA`) e `perigo.js`. Hoje coincidem (190, 192, 193, 180, 100, 188). |
| `estado_do_projeto.md` diz que só existe a jornada de Trabalho | **Não confirmado.** O documento lista as três jornadas (Trabalho, Educação, Assistência). Está velho em outras coisas (data de 11/10, 19 perguntas), mas não nisso. |
| Educação precisa separar filhos e mulher | **Já está separada** (seções "Para os seus filhos" e "Para você"). |
| Os papéis de `ia.js`, `orientar.js` e `perigo.js` | **Não conferi** o código interno de `ia.js` e `perigo.js`. Conferi só que `orientar.js` roteia pelo índice (ver 2.1). |

## 2. O que escapou (não estava no texto colado)

### 2.1 A categoria `emprego_curso` mistura duas prateleiras
No catálogo, vagas (PAT, Conecta, Secretaria de Desenvolvimento Econômico) e cursos (SENAI, Senac, Centro de Qualificação, Fatec) têm o mesmo tipo `emprego_curso`. O orientador então manda "quero fazer um curso profissionalizante" e "curso de informática grátis" para **Trabalho**, não para Educação (testado agora). É o contrário do princípio de que Educação é a casa dos estudos. **Isso explica por que cursos aparecem nos dois lugares:** a causa está no catálogo, não só no texto das áreas.

### 2.2 Uma gaveta de Trabalho guarda coisas de quatro prateleiras
O bloco "Serviços públicos e cursos gratuitos" junta Seguro-desemprego, Carteira de Trabalho e SINE (Trabalho), **Bolsa Família e Cadastro Único** (Assistência), **Tarifa Social de Energia** (Moradia), cursos da Fundação Bradesco e Qualifica SP (Educação) e "direitos básicos" trabalhistas (Direitos). Cada item deveria morar na sua porta, com um link aqui.

### 2.3 Saúde: a página e o orientador discordam
Perguntando "quero fazer mamografia", "preciso de papanicolau" e "pré-natal", o orientador **acha** serviços (especialidades, Secretaria de Saúde, UBS) a partir do catálogo. Mas a página Saúde não tem uma linha sobre esses assuntos: seus 6 cartões falam todos de álcool e drogas na família, e 5 dos 6 atalhos do topo levam à mesma lista de unidades. O serviço existe no catálogo; falta a prateleira que o explica.

### 2.4 O teste que está vermelho esconde 145 conferências
`dashboard.test.js` para na linha 206, porque 14 PDFs rastreados em `docs/documetacao/` não têm explicação no LEIA-ME. Tudo o que vem depois (145 `assert`, incluindo a conferência de que 190, 192, 180 e 100 estão na tela inicial) **não roda**. Rodei uma cópia temporária sem essa linha: as 145 passam. Então o problema é só documental, mas hoje a CI fica vermelha e a trava dos números de emergência não está valendo.

Esses 14 PDFs: 7 são **cópias idênticas**, byte a byte, de outros já explicados com nome melhor (`CADU2.pdf` = `cadu-g1-especial-publicitario.pdf`, `def.pdf` = `defensoria-sp-instagram-rio-claro.pdf`, `defensoria oublicasp.pdf` = `defensoria-sp-agende-atendimento.pdf`, `DAAE.pdf` = `daae-cadu-atendimento.pdf`, `CADPREF.pdf` = `cadastro-unico-reforma-2019.pdf`, `pensao2.pdf` = `senado-lei-pix-pensao-2026.pdf`, `pensãoal.pdf` = `senado-como-pedir-pensao-alimenticia-2012.pdf`). Os outros 7 (`CAD.pdf`, `CAD21.pdf`, `lei.pdf`, `leibolsafamiia.pdf`, `pat.pdf`, `pensao1.pdf`, `senado.pdf`) precisam de uma explicação ou de uma decisão do mantenedor. A pasta pesa 70 MB, quase todo o peso do repositório.

### 2.5 Dois motores de plano para a mesma mulher
O caminho "Estou sozinha com os filhos" de Assistência (que eu acrescentei) e a jornada de Trabalho (respostas: tem filhos, não tem com quem deixar) geram planos quase iguais: CRAS, creche, vagas, cursos. Trabalho é mais completo. É redundância minha, a corrigir.

### 2.6 O cartão do Questionário na tela inicial promete mais do que acontece
O cartão diz "Responda e ajude a Secretaria da Mulher a conhecer as mulheres de Rio Claro". A coleta está desligada. **A página do questionário é honesta** (linhas 38 e 126 de `questionario-ui.js`: "a coleta ainda não foi ativada, nada foi enviado"). Só o cartão da porta precisa dizer o mesmo.

### 2.7 Aposentadoria mora em duas portas
Direitos tem "Aposentadoria e dívidas" (simular no Meu INSS); Assistência tem "Aposentadoria, BPC e a renda" dentro da seção da avó. Os assuntos são próximos e os cartões diferentes: falta só um aviso cruzado.

## 3. O armário, prateleira por prateleira

| Porta | O que deve ficar | O que está fora do lugar | Ação sugerida |
|---|---|---|---|
| **Trabalho** | Renda, vagas, currículo, entrevista, MEI, golpes | Gaveta mista (2.2); cursos duplicados; 16 atalhos planos; conteúdo em HTML e não em dados | Cinco grupos; mover itens para a porta certa com link; mesmo endereço `#trabalho/...` |
| **Educação** | Filhos; formação; cursos | Os cursos do catálogo estão em `emprego_curso` (2.1) | Separar `curso` de `emprego` no catálogo; Educação guarda o texto |
| **Saúde** | Rede de saúde; saúde da mulher; saúde mental e família | Falta saúde da mulher; todos os cartões são de dependência química | Três grupos; abrir fonte oficial antes de escrever |
| **Direitos** | Violência, pensão, guarda, Defensoria, dívidas | Aposentadoria repetida (2.7); seção nova sem atalho (decisão do grupo) | Aviso cruzado |
| **Moradia** | Água, energia, habitação | Falta caminho para despejo e sem-teto: "vou ser despejada" só leva ao cartão Habitação; "sem casa com filhos" vai a CREAS | Investigar serviço local confirmado; sem inventar |
| **Assistência** | CadÚnico, CRAS, CREAS, convivência | Plano de mãe solo duplica Trabalho (2.5) | Chamar o motor de Trabalho e acrescentar só a Defensoria |
| **Entre Mulheres** | Diretório de profissionais e negócios de mulheres | Nome sugere rede de apoio; hoje é diretório vazio | Subtítulo claro; sem selo de verificação sem processo |

**Prateleiras que atravessam tudo**
- *Emergência:* 4 lugares com os mesmos números. Hoje iguais; o risco é divergirem. Fonte única, e liberar o teste de 2.4.
- *Mapa:* um na tela inicial e busca por CEP em cada área, os dois lendo o mesmo catálogo. Não achei dois motores; manter assim.
- *Transporte:* dados com lacunas registradas honestamente; atualizar antes da validade de 04/02/2027.
- *Orientador:* roteia certo para violência, aposentadoria, Cadastro Único, despejo e mamografia; erra o destino principal para cursos (2.1).

**Gestão**
- *Rio Claro em números:* dados públicos agregados; não é diagnóstico da mulher.
- *Painel:* 420 registros sintéticos, sinalizado no nome ("dados de teste").
- *Questionário:* coleta desligada, e a página diz (2.6).

## 4. Documentação que não acompanha o código
- `estado_do_projeto.md`: data 11/10/2026; diz "19 perguntas" sem mencionar o espaço de texto (são 19 de marcar + 1 opcional).
- `questionario_observatorio.md`: abre dizendo "nenhum texto livre" (linha 6), mas tem o espaço "Fale de você" (linha 13) e o título "As 20 perguntas" (linha 21).
- LEIA-ME de `docs/documetacao/`: 14 PDFs sem explicação (2.4).
- `mapa_de_dados.md`: confere (20 perguntas); a contagem de horários do catálogo é de antes: hoje 49 com horário e 115 sem.

## 5. O que não pode sair
Jornada e currículo de Trabalho; calculadora de renda líquida; caminho de mãe solo (a lógica fica, só deixa de ser duplicada); jornada de Educação; a seção "Mais de um serviço ao mesmo tempo"; Cadastro Único e Assistência; busca de CRAS por bairro; mapa com localização exata e aproximada; privacidade por desenho; trava do conteúdo essencial; avaliações do orientador; separação entre orientação e inteligência territorial. **Repetição útil não é redundância:** o 180 em várias portas e a creche em Educação e Trabalho ficam.

## 6. Ordem sugerida (nada foi feito)
1. Destravar a CI: explicar os 14 PDFs no LEIA-ME (decisão do mantenedor sobre os 7 duplicados) e voltar a rodar as 145 conferências.
2. Separar curso de emprego no catálogo e no orientador; Educação como casa dos cursos.
3. Reorganizar Trabalho em cinco grupos, esvaziando a gaveta mista (2.2).
4. Unir os dois planos (2.5).
5. Saúde da mulher, com fonte aberta.
6. Cartão do Questionário e subtítulo de Entre Mulheres.
7. Fonte única de emergência.
8. Moradia emergencial, só com serviço confirmado.
9. Atualizar `estado_do_projeto.md`, `questionario_observatorio.md` e a contagem do catálogo.
