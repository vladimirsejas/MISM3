# Casa principal de cada assunto (passo 2)

31/10/2026. Documento de orientação para quem for mexer no conteúdo. Não altera o site.

## A regra em uma frase

**Cada assunto tem uma casa. A casa explica o procedimento; as outras portas apontam para ela com uma frase e um link, sem explicar de novo.** A mulher pode chegar por qualquer porta, mas o passo a passo, os documentos, os critérios e as datas vivem num lugar só, para um telefone ou um prazo mudar uma vez.

**Pode repetir:** os números de emergência, o Ligue 180, o fato de que creche e transporte pesam para quem quer trabalhar, e a menção do nome de um serviço (por exemplo "SENAI e Senac: cursos") como apontador.
**Não repetir:** passo a passo, lista de documentos, critério de elegibilidade, data, valor e telefone do mesmo serviço escritos à mão em mais de um lugar.

Estados usados abaixo: **Feito** (já está assim no código), **Decidido** (o autor decidiu, falta aplicar), **Proposto** (sugestão minha, sem decisão ainda).

## Como medi

Contei quantas vezes cada assunto é mencionado em cada área, no texto de `web/areas.js`, no conteúdo de Trabalho (`web/jornada-ui.js`) e nas jornadas. É uma contagem **de menções**, aproximada, feita em 31/10/2026: serve para ver onde um assunto mais mora, não para medir qualidade.

## A tabela

| Assunto | Casa principal | Quem aponta para ela | Menções hoje (T=Trabalho, E=Educação, S=Saúde, D=Direitos, M=Moradia, A=Assistência) | Estado |
|---|---|---|---|---|
| Cursos e formação: SENAI, Senac, SEST SENAT, Etec, Fatec, EJA, SESI, cursinho | **Educação**, seção "Para você" | Trabalho (link "Estudar", na seção Canais oficiais); Direitos cita os nomes como apontador | SENAI/Senac/Etec: E 12, T 5; EJA: E 17, T 7 | **Feito** em 31/10/2026 (passo 1). Falta a linha abaixo. |
| Formação mais longa (UNIVESP, IFSP, Senac Gratuidade) | **Educação**, seção "Formação mais longa" | Trabalho tem uma **cópia** da mesma lista | T e E com os mesmos textos e links | **Proposto.** Trabalho passa a ter só um link para a seção de Educação. Depende de atualizar a trava de conteúdo essencial de propósito. |
| Creche, escola, matrícula, transferência | **Educação**, "Para os seus filhos" | Trabalho (bloco "Tenho filhos"), Assistência (plano "sozinha com os filhos"), Direitos ("Quem atende junto") | E 62, A 12, T 5, D 4, M 1 | **Feito.** Repetição útil: só Educação explica o procedimento. |
| Cadastro Único, Bolsa Família, CRAS, CREAS | **Assistência Social** | Trabalho, Direitos, Moradia e Educação mandam para o CRAS | CadÚnico: A 41, M 10, D 3, T 2; CRAS: A 53, T 13, E 5, D 5, M 3; CREAS: A 14 | **Feito, e não se mexe** (autor: Assistência está aprovada). Em Moradia o CadÚnico aparece só como **requisito** da casa própria, o que é repetição útil. |
| Conselho Tutelar e proteção de criança e idoso | **Assistência**, "Proteção e denúncia" | Educação, Saúde e Direitos apontam | A 8, E 5, S 2, D 1, T 1 | **Feito.** |
| Pensão alimentícia, guarda, separação, Defensoria | **Direitos**, "Separação, pensão e guarda" | Educação ("veja a área Direitos"), Assistência (plano), Moradia | Pensão: D 32, A 10; Defensoria: D 31, A 8, M 6, E 5; guarda: D 15, E 7, M 7, A 5 | **Feito.** |
| Violência, proteção jurídica, Ligue 180 | **Direitos**, "Violência e proteção" | Todas as páginas têm o botão "Em perigo agora?" (com 190, 192 e 180); o número no texto aparece só em Direitos, Assistência, Educação e Saúde (Trabalho e Moradia: 0 menções no texto) | 180 no texto: D 3, A 2, E 1, S 1 | **Feito.** Repetição obrigatória: ninguém é obrigada a achar a porta certa. A ausência do 180 no texto de Trabalho e Moradia é coberta pelo botão; não há lacuna comprovada. |
| Aposentadoria, INSS, BPC | **Direitos**, "Aposentadoria e dívidas" (simular no INSS) | Assistência tem o cartão "Aposentadoria, BPC e a renda da casa" (outro ângulo: renda da família com a avó) | A 24, D 8, M 2 | **Proposto:** um aviso cruzado de uma frase em cada um. |
| Dívidas, Procon | **Direitos**, "Aposentadoria e dívidas" | — | D | **Feito.** |
| Vagas, PAT, Conecta, Portal da Empregabilidade, Sine | **Trabalho**, grupo "Encontrar trabalho" | Assistência (plano), Educação ("Emprego e renda") | T 18, E 2, D 2, A 1 | **Feito** (reordenado em 31/10/2026). |
| Currículo, entrevista, roupa e cabelo | **Trabalho**, grupo "Me candidatar" | — | currículo: T 40, A 2 | **Feito.** |
| Dinheiro rápido, bicos, calculadora, MEI | **Trabalho**, grupo "Dinheiro rápido" | Assistência ("falta o básico") | MEI: T 2 | **Feito.** |
| Golpes de emprego | **Trabalho**, grupo "Dinheiro rápido" | — | T 3, M 2, D 1 | **Feito.** O golpe de moradia é outro assunto e mora em Moradia. |
| Tarifa social de água e de energia | **Moradia**, seções 1 e 2 | Trabalho cita a Tarifa Social de Energia na gaveta "Serviços públicos"; Assistência cita | M 10, A 2, T 1 | **Proposto:** em Trabalho, só um link para Moradia. |
| Habitação, casa própria | **Moradia**, seção "Habitação" | Direitos ("Quem atende junto"), Assistência | M 17, A 2, D 1 | **Feito.** Lacuna: despejo e sem-teto não têm serviço confirmado (ver `auditoria_organizacao_funcional.md`). |
| Unidades de saúde, urgência, CAPS | **Saúde**, "Unidades de saúde" | O 192 está na lista de emergência de todas as páginas | S | **Feito.** |
| Família e dependência química | **Saúde**, "Meu filho ou familiar usa álcool ou drogas" | Trabalho (apoio) | S | **Feito.** |
| Saúde da mulher (mamografia, Papanicolau, pré-natal) | **Saúde** | — | **0 menções em todas as áreas** | **Proposto, depende de fonte aberta.** O orientador já acha o serviço no catálogo, mas a página não explica. |
| Apoio emocional, CVV (188) | **Saúde** (saúde mental), com o 188 na lista de emergência | Trabalho ("Se o desânimo apertar"), emergência | T 2, S 2, A 2 | **Proposto:** em Trabalho, manter a frase e o link; o texto principal fica em Saúde. |
| Avó que cria os netos | **Assistência**, seção "Sou avó ou pessoa idosa" | Educação (matrícula do neto), Moradia (casa própria da avó), Direitos (guarda e pensão) | M 23, A 19, E 8, D 7 | **Feito, por ângulo.** Cada porta explica só o seu pedaço (matrícula, casa, guarda); o resto aponta para Assistência. |
| Transporte e horários | **Recurso transversal** (área Transporte) | Trabalho (bloco "Transporte e passagem") | T 17 | **Feito.** Não vira porta nova. |
| Mapa e busca por CEP | **Recurso transversal** (mapa da tela inicial) | Educação tem "Creches e escolas perto de mim (pelo CEP)"; os dois leem o mesmo catálogo | — | **Feito.** Não conferi se outras áreas têm busca própria. |
| Contatos de emergência | **Recurso transversal** | Todas as portas | 4 cópias no código: `index.html` (duas listas), `areas.js` (`EMERGENCIA`), `perigo.js` | **Proposto:** fonte única. Hoje os números coincidem. |
| Profissionais e negócios de mulheres | **Entre Mulheres** | — | — | **Feito.** Não é catálogo de serviço público; hoje sem cadastros. |

## Quando aparecer um assunto novo

1. Procure primeiro se ele já existe (regra do projeto: não criar o que já há).
2. Escolha a porta em que a mulher **procuraria**, não a secretaria que cuida do assunto.
3. Escreva o procedimento só nela.
4. Nas outras portas em que a mulher também pode chegar, escreva uma frase e um link.
5. Se o assunto mexe com mais de uma porta ao mesmo tempo (uma mãe solo que precisa de creche, vaga e pensão), é caso para **plano** (jornada) que reúne os links, e não para repetir o texto.

## O que este documento não decide

- Não decide remover nada. Qualquer mudança de lugar mantém o conteúdo (ver `analise_reorganizacao.md`, seção 5, "O que não pode sair").
- Não muda a área Assistência Social, que o autor aprovou como está.
- Os itens **Propostos** só entram no site com a decisão do autor, um a um, com os testes e a comparação antes e depois.
