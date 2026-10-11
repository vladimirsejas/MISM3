# Plano do próximo ciclo: realista para um projeto de estudante

Escrito em 11/10/2026, a partir do plano sugerido pelo ChatGPT e conferido contra o código e os dados do repositório. Todo número abaixo foi medido na `main` (commit `bcc03b3`), não copiado de documentação antiga.

## 1. De onde partimos (medido hoje)

| Fato | Valor | Como foi conferido |
|---|---|---|
| Testes automáticos no GitHub | **verdes** no último commit da `main` (execução nº 20, `success`) | GitHub Actions, workflow `testes` |
| Serviços no catálogo | 164 | `catalogo/servicos_manuais.csv` |
| No mapa | 45 pelo endereço, 38 pelo CEP (aproximado), **81 só na lista** | `web/tests/mapa.test.js` |
| Registros "não conferidos" | **5**: CRAM, Delegacia da Mulher, Patrulha Maria da Penha, CEI Antonio Ca…, Cadu | coluna `conferido` |
| Sem telefone / sem endereço | 19 / 13 (inclui Delegacia e Patrulha: os dois) | catálogo |
| CRAS localizados | 2 de 6 (os outros 4 aguardam a rodada do geocodificador) | catálogo |
| Bairro → CRAS | **já existe**: os 6 CRAS trazem a lista oficial de bairros que atendem (10 a 44 bairros cada) | campo `bairros`, fonte: página da Prefeitura |
| Busca por "Bom Sucesso", "Mãe Preta", "Jardim Brasília" | acha o CRAS certo | `mapa-servicos.js` |
| Busca por "CVZ" | **0 resultados** (apelido que não está nos dados) | idem |
| Busca por "Cervezão" | acha 3 serviços, **nenhum CRAS** (a lista oficial escreve "Jd. Chervezon") | idem |

O último achado mostra a lacuna real de orientação territorial: a moradora usa o apelido, a fonte oficial usa outra grafia.

## 2. Premissas deste plano

- **Quem testa:** você, o grupo e colegas de turma. Não há tempo nem equipe para abrir ao público.
- **Dinheiro:** nenhum para hospedagem. Tudo abaixo custa zero.
- **O que isso muda:** o objetivo do ciclo é um produto **pronto para demonstrar e testar**, não para operar. O site já se declara "estudo acadêmico de demonstração". Isso continua verdadeiro e deve ser dito.
- **O que não podemos afirmar no fim:** "validado com mulheres" (colegas e familiares não são a população-alvo) nem "dados completos".

## 3. O que adotei do plano do ChatGPT e o que mudei

| Do plano dele | Decisão |
|---|---|
| Ordem: confiabilidade, depois orientação territorial, depois teste com pessoas, depois Observatório | **Mantida.** |
| "Confirmar os 3 registros de proteção" | **Mantido** (bloco C). |
| "Criar `regioes_referencia.csv`" com limites | **Reduzido** a uma tabela de apelidos de bairro (bloco D). Não desenhamos fronteira sem fonte, e o bairro→CRAS oficial já existe. |
| 30 dias, 6 fases, 5 a 8 voluntárias | **Reduzido** a blocos de uma noite, 5 colegas e um teste no mesmo dia. |
| Auditoria WCAG completa | **Reduzida** a um roteiro mínimo e gratuito (bloco F). Uma auditoria completa não cabe. |
| Protocolar todas as minutas LAI | **Reduzido** a 2 pedidos (bloco G). A resposta não depende de nós e pode levar 20 a 30 dias. |
| Comandos com `C:\MISM3` | **Trocados**: há duas cópias do projeto no computador; use sempre a que recebeu o `git pull`. |
| Observatório com indicadores | **Adiado** até haver dados recebidos. Sem dados, só o que já existe. |
| Jornada nova (filhos e trabalho) | **Adiada** até o teste mostrar onde as pessoas travam. |

## 4. Os blocos, na ordem

Tempo é estimativa de uma noite de trabalho. **[Você]** é o que só você pode fazer no mundo real; **[Claude]** é o que vai para o código.

### Bloco A. Versão de referência (15 minutos)
- [Você] `git pull` na pasta do projeto e abrir o `abrir_mapa.bat` **dessa mesma pasta**.
- Os testes não precisam ser rodados à mão: rodam sozinhos a cada alteração no GitHub (aba Actions, marca verde).
- **Pronto quando:** você sabe o código do commit que está testando (`git log -1 --oneline`).

### Bloco B. Localizar CRAS e UBS (1 noite)
- [Você] `python pipeline\atualizar_localizacoes.py` (ou duplo clique em `atualizar_localizacoes.bat`), com os caminhos do CNEFE e da lista de CEPs. **Ler a lista inteira.** Se estiver certa, digitar `s`; se alguma estiver errada, Enter, apagar o `aprovar` dessa linha e rodar de novo. Mandar o texto impresso para o Claude.
- [Claude] Conferir a lista, ajustar a lógica onde errar, atualizar as contagens e a documentação.
- **Pronto quando:** CRAS e UBS aprovados têm CEP no catálogo e a linha correspondente em `catalogo/localizacao_registro.csv`; nenhum endereço ambíguo ganhou posição.
- **Meta realista:** 6 de 6 CRAS (hoje 2) e mais de 70% das UBS/USF (hoje 5 de 22), que é o limite que libera a distância no mapa territorial.

### Bloco C. Contatos de proteção (1 noite, mais uma ou duas ligações)
- Alvos: **CRAM**, **Delegacia de Defesa da Mulher**, **Patrulha Maria da Penha**. Hoje os dois últimos não têm telefone nem endereço.
- [Você] Imprimir em PDF a **página oficial** de cada um (Prefeitura, Guarda Civil Municipal, Polícia Civil/SSP-SP) e guardar em `docs/documetacao/`. Foi assim que se conferiram o CRAS e a Defensoria. Se a página não trouxer o telefone, ligar para o número principal do órgão e perguntar.
- [Claude] Atualizar telefone, endereço, fonte, data e `conferido` só com o que está na fonte.
- **Regra:** o que não puder ser confirmado **continua** "não conferido", com o aviso "ligue antes" que o site já mostra. Nunca se preenche número por dedução.
- **Pronto quando:** cada um dos 3 está confirmado com fonte arquivada, ou explicitamente pendente.

### Bloco D. Apelidos de bairro e "qual CRAS atende o meu bairro?" (1 a 2 noites)
- [Você + colegas de Rio Claro] Preencher `catalogo/bairros_apelidos.csv` com os nomes que a população usa: apelido, nome oficial ou grafia dos dados, quem informou e quando. Ex.: o que se diz para o bairro que a fonte escreve "Jd. Chervezon" (**a confirmar com você**, não vou presumir). Começar com 10 a 15 nomes.
- [Claude] A busca do mapa passa a entender os apelidos; uma caixa "Qual CRAS atende o meu bairro?" usa as listas oficiais que já estão no catálogo. Bairro que não existe nos dados responde "não encontramos este bairro; veja a lista de CRAS ou ligue", sem adivinhar.
- **Não faremos:** desenhar fronteiras de bairro ou de região.
- **Pronto quando:** cada apelido da tabela leva ao CRAS certo (teste automático) e bairro desconhecido não leva a lugar nenhum.

### Bloco E. Teste de usabilidade (1 tarde)
- **Quem:** 5 colegas da turma e, se possível, 1 ou 2 familiares adultos com pouca familiaridade com tecnologia. **Nome correto do que é:** "teste de usabilidade com colegas e familiares", não "validação com usuárias".
- **Roteiro:** o que já existe em `docs/roteiro_validacao_navegacao.md`, reduzido a 5 tarefas: (5) achar os números de emergência, (2) descobrir o telefone do CRAS de um bairro, (1) começar o pedido de vaga em creche, (4) achar o horário de um ônibus, (7) dizer o que o botão "Sair" faz. Situações **fictícias**, ninguém conta a própria história, ninguém é identificado.
- **Critérios (já no roteiro):** emergência em até 10 segundos; ninguém acredita que "Sair" apaga o histórico; tarefas concluídas sem ajuda.
- **Como mostrar no celular, sem pagar nada:** `python -m http.server 8000 --directory web --bind 0.0.0.0`, depois `http://IP-DO-NOTEBOOK:8000` no celular, na mesma rede Wi-Fi (o IP aparece no comando `ipconfig`; o Windows pergunta se permite a rede privada). Se a rede da Fatec bloquear, use o celular como roteador (hotspot) ou mostre na tela do notebook.
- [Claude] Criar a ficha de registro; depois do teste, corrigir os 3 maiores problemas.
- **Cuidado:** se os resultados forem apresentados ou publicados, perguntar antes à orientação acadêmica da Fatec sobre avaliação ética (o roteiro já diz isso).
- **Pronto quando:** tabela de resultados salva em `docs/resultados_teste_1.md`, problemas listados por quantas pessoas tropeçaram.

### Bloco F. Acessibilidade mínima (1 a 2 horas)
- [Você] Em `index`, `mapa` e a tela de uma área: (1) só com a tecla Tab, chegar ao botão de emergência e ao filtro do mapa; (2) zoom de 200% sem texto cortado; (3) painel **Lighthouse** do Chrome (já vem no navegador, gratuito), categoria Acessibilidade, anotar a nota e os itens vermelhos.
- [Claude] Corrigir o que for mais grave.
- **Honestidade:** isso é uma checagem mínima, **não** uma auditoria de conformidade.

### Bloco G. Pedidos de informação (30 minutos para enviar; espera longa)
- [Você] Enviar só **2 pedidos** pelo canal de transparência da Prefeitura: o da fila de creche (minuta 4 de `docs/pedidos_LAI.md`) e o da capacidade dos CRAS (minuta 7). Pode pedir ao professor para enviar em nome da Fatec. A lei dá 20 dias, prorrogáveis por mais 10.
- [Claude] Criar `docs/acompanhamento_LAI.csv` (órgão, data, protocolo, prazo, resposta).
- **Nada neste ciclo depende da resposta.**

### Bloco H. Demonstração, sem hospedagem
- Rodar localmente (`abrir_mapa.bat`) e gravar a tela como plano B (no Windows, Win + G).
- [Claude] Roteiro de 5 minutos: tela inicial, mapa, filtro, CEP, jornada de Trabalho, botão de emergência, e um slide de **limitações** (o que não foi validado).
- **Sobre colocar online:** existe hospedagem gratuita para site estático (por exemplo, o próprio GitHub Pages), então dinheiro não é o obstáculo. O obstáculo é que um site público de proteção à mulher exige dados conferidos e alguém para manter. **Recomendação: não publicar neste ciclo.** Se decidir publicar mais tarde, o Claude prepara isso num PR separado.

## 5. O que fica fora deste ciclo, de propósito

Rotas a pé com OSMnx, mapa de calor ou "índice de vulnerabilidade", novo visual, novas jornadas, ativação do questionário, indicadores do Observatório com dados reais (dependem dos pedidos LAI) e qualquer coleta de dados de pessoas.

## 6. Como saber que o ciclo terminou (evidências)

1. Commit de referência anotado e testes verdes no GitHub.
2. CRAS 6 de 6 localizados; UBS/USF acima de 70%; contagens atualizadas na documentação.
3. CRAM, Delegacia e Patrulha confirmados com PDF da fonte, ou explicitamente pendentes.
4. Tabela de apelidos com teste automático passando.
5. `docs/resultados_teste_1.md` preenchido, com os 3 maiores problemas corrigidos.
6. Notas do Lighthouse registradas antes e depois.
7. 2 pedidos LAI enviados, com protocolo registrado.
8. Demonstração gravada e roteiro de 5 minutos.

## 7. O que dizer e o que não dizer na apresentação

**Dizer:** é um protótipo acadêmico; cada informação traz fonte e data; o mapa só marca onde há localização de verdade; 81 de 164 serviços aparecem só na lista e isso é mostrado; os testes automáticos passam; o teste de usabilidade foi feito com colegas e familiares.

**Não dizer:** que foi validado com mulheres, que há vaga em creche ou atendimento, que uma região "tem falta" de serviço, que a distância é o caminho a pé, que os telefones de proteção estão todos conferidos.

## 8. Atualização: depois dos pareceres do Copilot e do Gemini (11/10/2026, noite)

Os dois pediram foco: sem público e sem equipe, o ganho está em **orientação prática** ("o que faço agora?"), não em medir a cidade. Concordo, com ajustes (ver `docs/registro_decisoes_desenvolvimento.md`). A ordem passou a ser: contatos críticos, busca por bairro, jornadas (uma por vez). Observatório, painel, questionário, IA nova e pedidos LAI saíram deste ciclo; o bloco G (LAI) e o F (acessibilidade) ficam opcionais.

| Entrega | Estado |
|---|---|
| Busca por bairro e "Qual CRAS atende o meu bairro?" | **Feita** (PR #31). Falta confirmar os apelidos (Cervezão, CVZ), que só quem conhece os bairros pode fazer. |
| Jornada de Educação (vaga do filho; estudar) | **Feita**. |
| Jornada de assistência social | Próxima: depende só de dados que já estão no catálogo (CRAS com lista de bairros, CREAS, Conselho Tutelar). |
| Jornada de violência e proteção | **Espera os contatos confirmados** (CRAM, Delegacia, Patrulha). Será mínima e só com fonte. |
| Contatos críticos (CRAM, Delegacia, Patrulha) | **Espera você**: páginas oficiais impressas em `docs/documetacao/`. |
| Localizar CRAS e UBS (`atualizar_localizacoes.py`) | **Espera você**: rodar e mandar o que ele imprime. |
