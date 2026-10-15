# Proposta de conteúdo para mãe solo, mulher que sustenta a família e avó cuidadora

Escrito em 15/10/2026. **Proposta: nenhum código, dado, catálogo ou teste foi alterado.** Serve para decidir o que entra no próximo ciclo e o que precisa de confirmação humana antes.

Princípio mantido do projeto: orientar, conectar e mostrar lacunas. Não prometer vaga, benefício nem atendimento. Existência de um programa não é a mesma coisa que vaga aberta para a mulher naquele dia.

## 1. Como ler os níveis de confiança

Esta pesquisa foi feita sem conseguir abrir as páginas da Prefeitura: o ambiente bloqueou `rioclaro.sp.gov.br` (proxy responde 403). O que veio de lá chegou como **resumo de uma ferramenta de busca restrita ao domínio**, com link da página. Por isso cada achado leva um nível:

| Nível | Significado | Pode virar texto do site? |
|---|---|---|
| A | Confirmado no repositório (código, catálogo, testes) | Já está no site |
| B | Visto em resumo de busca de página oficial (`rioclaro.sp.gov.br`, `gov.br`); a página não foi aberta | Só depois de abrir a página, ler e registrar a data |
| C | Conhecimento geral ou fonte não oficial | Não. Vira pendência |

## 2. O CADU: o que a pesquisa mostra (e uma correção minha)

**Conclusão: CADU é um único canal digital da Prefeitura, usado por vários serviços. Não são três sistemas.** CadÚnico é outra coisa.

| Nome | O que é | Onde aparece | Nível |
|---|---|---|---|
| CADU (Cadu) | Central de Atendimento Digital da Prefeitura: aplicativo, portal e telefone/WhatsApp 0800 019 0505 | Matrícula e rematrícula; agendamento de consulta; inscrição nos cursos do Fundo Social; DAAE (água e esgoto); outros | B |
| CadÚnico (Cadastro Único) | Cadastro socioeconômico **federal**, feito pelo CRAS. É a porta de entrada de Bolsa Família, BPC, tarifa social de energia e outros. Estar inscrita **não** garante o benefício | gov.br e MDS; CRAS | B |

**Correção:** na primeira análise falei em "três coisas com nome parecido" (escola, saúde, CadÚnico). A pesquisa mostra que o Cadu da escola e o da saúde são **o mesmo canal**. O problema real é outro: o site fala do Cadu em contextos separados sem dizer que é um canal só, e a mulher pode confundir Cadu com CadÚnico.

**A sigla:** as fontes divergem (um resumo traz "Central de Atendimento Digital Unicidades", outro "UniCidadão"). Não escrever o significado da sigla no site até abrir a página oficial.

### O que isso muda no site (conteúdo, não botão)
1. Um parágrafo único "O que é o Cadu e para que serve", reaproveitado onde o Cadu aparece, mais uma linha "Cadu não é o CadÚnico" na área Assistência.
2. **Fundo Social:** o registro do catálogo (`man-fundo-social`) traz só um WhatsApp. Um resumo de notícia de julho de 2026 diz que as inscrições nos cursos gratuitos (780 vagas, idade mínima 16) são **exclusivamente pelo Cadu**. Se for verdade, a jornada de Trabalho pode mandar a mulher a um canal que não inscreve. Verificar. (B)
3. **Saúde:** o 0800 019 0505 e a informação de que mamografia e Papanicolau dependem de solicitação de profissional estão na `observacao` de um registro do catálogo (`man-cadu`), não no texto da área Saúde. Informação escondida. (A para a localização no código; B para o conteúdo)
4. **Matrícula:** o calendário citado em notícias é do ciclo 2026. O site já avisa que 2027 precisa de confirmação; manter. Uma notícia sem ano ("rematrículas 11 a 19 de novembro; matrículas de 30 de novembro a 15 de dezembro") **não** pode ser usada sem ver o ano. (B)

## 3. Diagnóstico: o que existe e o que falta

| Tema | O que existe hoje (A) | Lacuna |
|---|---|---|
| Dinheiro para o básico | Jornada de Assistência leva ao CRAS e pede "pergunte quais benefícios existem". Há um teste que **proíbe** as palavras CadÚnico e Bolsa Família nessa jornada | O passo mais importante (inscrever ou atualizar o CadÚnico no CRAS) nunca é dito. A jornada manda perguntar o que o site poderia explicar |
| BPC | Aparece só como documento aceito na tarifa social | Nada explica o que é, que não é aposentadoria, nem o caminho (CadÚnico, depois INSS) |
| Comida | Nenhum conteúdo | Existem canais municipais (seção 4, P3), mas nada orienta a mulher até eles |
| Moradia | Dois links (Secretaria de Habitação e CRAS) | Não explica cadastro habitacional, atualização anual nem a prioridade federal para mulher responsável pela família (P2) |
| Pensão e guarda | Cartão "Crio meu filho sozinha" na Educação remete à Defensoria | Sem passo a passo, sem "o que fazer se o pai não consta na certidão", sem "se não paga". O registro da Defensoria no catálogo não tem telefone |
| Avó cuidadora | Uma linha na lista "Documentos em situações específicas" (guarda), marcada como pesquisa não conferida | Ela não aparece como pessoa: sem renda, sem saúde, sem guarda e matrícula como caminho |
| Saúde da mulher | Está só dentro de um registro do catálogo | Não aparece na área Saúde |
| Orientador de IA | 383 frases de treino, **1** com "neto" | Não reconhece "crio meus netos", "sustento a casa", insegurança alimentar com facilidade |
| Jornadas que terminam sem próximo passo | Trabalho, Educação e Assistência têm "alternativa" em cada passo | A de Assistência "apoio" termina em "pergunte" (ver primeira linha). Não há jornada de violência e proteção (já registrado no estado do projeto) |

Duplicações: não encontrei duplicação relevante de conteúdo. O problema é o inverso: informação **faltando ou escondida**.

## 4. Propostas, por prioridade

Cada proposta responde às três perguntas: onde começo, o que levo, o que faço se não der. Nenhuma afirma elegibilidade.

### P1. "Dinheiro para o básico": CadÚnico, Bolsa Família e BPC (Assistência)
- **Perfis:** as três.
- **Conteúdo:** (1) CadÚnico é o cadastro; Bolsa Família e BPC são benefícios, cada um com regras próprias; (2) ir ao CRAS (já existe "qual CRAS atende o meu bairro"); (3) quem faz é a pessoa responsável pela família; (4) o que levar; (5) o BPC é pedido ao INSS (135 ou Meu INSS), é gratuito e não precisa de intermediário; (6) BPC não é aposentadoria; (7) estar no CadÚnico não garante benefício.
- **Fatos vistos (B):** atualização do cadastro em no máximo 24 meses (MDS); o responsável leva documento com foto, CPF ou título, comprovante de residência e documentos de todos que moram junto; Rio Claro fez atendimentos especiais de atualização nos CRAS.
- **Fonte a abrir:** gov.br "Inscrever-se no Cadastro Único", gov.br "Receber o Bolsa Família", MDS "BPC" e "BPC no Cadastro Único"; página oficial dos CRAS de Rio Claro.
- **Impacto:** alto. É a porta de dinheiro, comida (P3) e moradia (P2).
- **Cuidado com a regra do projeto:** hoje o teste de Assistência proíbe essas palavras por falta de fonte. A mudança só entra depois das fontes abertas e com o teste atualizado na mesma entrega. Critérios de idade e renda do BPC: remeter ao gov.br, não resumir de memória.

### P2. Chefe de família e moradia: ligar o CadÚnico à habitação
- **Achado de maior valor para o Observatório:** um resumo de busca da Portaria MCID nº 738/2024 (publicada no site da Prefeitura) diz que a seleção do Minha Casa Minha Vida dá prioridade a **mulher responsável pela unidade familiar, declarada no CadÚnico**. Se a leitura do PDF confirmar, é exatamente "fazer as ações existentes funcionarem juntas": quem sustenta a casa precisa estar corretamente declarada no CadÚnico. (B, alto impacto, **confirmar no PDF**)
- **Outros fatos (B):** cadastro habitacional da Prefeitura com mais de um ano precisa ser atualizado; a atualização é pelo site ou presencial na Secretaria de Planejamento e Habitação; a Prefeitura alerta para golpe: não há cobrança de documentação.
- **Conteúdo:** como consultar e atualizar o cadastro, o que os critérios publicados dizem, como saber se há inscrição aberta, o aviso do golpe. Sem afirmar que ela será contemplada.
- **Também em Moradia:** tarifa social de água e energia já existe e pede CadÚnico (ligar com P1).

### P3. Comida
- **Canais encontrados (B):** cestas verdes do Programa de Aquisição de Alimentos para famílias em insegurança alimentar atendidas pelos CRAS (um resumo cita 567 famílias, sem data confirmada); Armazém Solidário com moeda social ENA no CRAS Panorama; cestas do Fundo Social; cestas a alunos da rede municipal em jan./fev. de 2026.
- **O que isso não prova:** nada mostra programa permanente de cesta para qualquer família, nem que as ações estejam abertas hoje. O texto do site deve dizer: "pergunte no CRAS quais recursos de alimentação existem agora", com telefone da Secretaria de Desenvolvimento Social (já no catálogo).
- **Pendência humana:** uma ligação à Secretaria de Desenvolvimento Social para saber como a família é encaminhada.

### P4. Mãe solo
- **Pensão e paternidade (conteúdo geral, B/C):** levar certidão de nascimento da criança, documento e comprovante de residência de quem tem a guarda; se o pai não consta, existe ação de investigação de paternidade, e o reconhecimento voluntário pode ser feito em cartório, gratuito para quem não pode pagar; a pensão só vale a partir do pedido na Justiça, por isso procurar cedo.
- **Fontes a abrir:** Senado "Como fazer para pedir pensão alimentícia", Defensoria Pública de SP, Arpen-SP (reconhecimento em cartório).
- **Pendência humana:** telefone ou forma de agendar da Defensoria em Rio Claro (o registro do catálogo está sem telefone).
- **Trabalho compatível com o cuidado:** a jornada já pergunta se há com quem deixar a criança. Falta mostrar, quando a resposta é "não", o que existe: creche (já há jornada), contraturno (SCFV, já no catálogo) e cursos do Fundo Social, **com o canal de inscrição correto** (ver seção 2, item 2).
- **Saúde da mulher:** subir para a área Saúde a informação do Cadu 0800 019 0505 (um resumo diz 7h às 19h em dias úteis; notícia antiga diz 7h às 17h: confirmar) e que mamografia e Papanicolau dependem de solicitação de profissional.

### P5. Avó que cria ou sustenta os netos
- **Guarda, matrícula e saúde são questões diferentes.** O texto não deve afirmar que ordem judicial é sempre necessária. Dizer: pergunte na escola e na unidade de saúde o que aceitam; procure a Defensoria para avaliar o caso. Nenhuma fonte oficial sobre guarda foi achada (C): **fica como pendência**, não como texto.
- **Renda:** diferença entre aposentadoria, BPC e benefícios da família; CadÚnico; sem sugerir que ter neto ou receber aposentadoria garante ou impede benefício. Depende de P1.
- **Quem cuida também precisa de cuidado (B):** curso gratuito de cuidador de idosos do Fundo Social (80 h, inscrição pelo Cadu) serve a quem cuida e é caminho de renda; Centro Dia do Idoso (60 vagas para idosos semidependentes; a segunda unidade foi anunciada, abertura não confirmada); convivência do idoso já está no catálogo.
- **Proteção da avó:** o Disque 100 já está na jornada de Assistência. Falta dizer em linguagem simples a situação "alguém usa meu cartão ou minha aposentadoria sem eu querer".

### P6. Orientador de IA: avaliar antes de treinar
- Criar um conjunto de **avaliação** novo (não de treino), em frases coloquiais e com erros de escrita, para quatro perfis (esboço na seção 6). Medir: destino correto, necessidades simultâneas reconhecidas, abstenção quando não sabe.
- **Cuidado metodológico:** frases escritas só para testar não entram no treino; senão o resultado deixa de medir generalização. Só depois de medir a falha se acrescentam frases de treino diferentes das de teste. Seguir o padrão dos conjuntos `independente` e `reserva` já existentes em `avaliacao/`.

### P7. Estrutura: um bloco "Comece por aqui" em cada área
Sem botão novo. No topo de cada área, três linhas por situação (ex.: Assistência: "falta dinheiro / falta comida / contas pesando / quero voltar a trabalhar"), cada uma com onde começar, o que levar e a alternativa. Os cartões atuais ficam abaixo. É o que você pediu: melhorar o início das áreas, não multiplicar elementos.

## 5. Ordem de trabalho (mantém a sequência já definida)

1. **Conferir o que existe:** feito neste documento (seções 2 e 3).
2. **Pesquisar e documentar:** abrir as páginas da seção 8, registrar data e trecho, marcar o que continua pendente.
3. **Redigir separado:** textos novos em arquivos de proposta, sem tocar nas áreas, jornadas nem catálogo.
4. **Validar antes de publicar:** testes de regressão (pytest e Node), conferência de navegação e a avaliação da IA (P6).

Sugestão de ordem de entrega: P1, depois P2 e P4/P5, depois P3, depois P6 e P7. P1 vem primeiro porque P2, P3 e P5 dependem dele.

Sobre "prontidão de 90%" e "MISM2": esta árvore do repositório não tem nenhum dos dois, então não pude conferir; nada do MISM2 foi tocado.

## 6. Esboço do conjunto de avaliação da IA (rascunho, não entra no treino)

| Perfil | Frases (coloquiais, com erro de escrita, pedido indireto) | Destino esperado |
|---|---|---|
| Mãe solo | "nao tenho com quem deixa meu filho pra trabalha"; "o pai nao paga nada e eu me viro sozinha"; "preciso de vaga na creche mas trabalho o dia todo"; "meu filho nao tem o nome do pai no registro" | Educação (creche) ou Direitos (pensão); mais de uma necessidade |
| Chefe de família | "meu salario nao da pra conta nem pra comida"; "sou eu que sustento a casa toda"; "to devendo agua e luz"; "marido desempregado, so eu trabalho" | Assistência/CadÚnico; Moradia (tarifa social); Dívidas; Trabalho |
| Avó cuidadora | "crio meus netos e preciso matricular um deles"; "minha filha largou os meninos comigo"; "so tenho minha aposentadoria pra sustentar todo mundo"; "tenho 68 anos e cuido de 3 netos" | Educação (matrícula); Direitos (guarda, pensão); Assistência (renda) |
| Urgência | "posso ser despejada e nao tenho pra onde ir"; "hoje nao tem comida em casa"; "meu filho usa meu cartao da aposentadoria sem eu deixar" | Moradia/Assistência; Assistência (alimentação); Disque 100 |
| Fora do alcance | "qual o valor exato do bolsa familia que eu vou receber?" | Abstenção: não decide benefício; encaminha ao CRAS |

## 7. O que precisa de uma pessoa (não consigo fazer daqui)

1. **Liberar o acesso de rede** para `rioclaro.sp.gov.br` e `gov.br` no ambiente (menu do ambiente na barra de título da sessão, depois Editar, Acesso à rede, domínios permitidos). Com isso abro as páginas e confirmo cada achado B.
2. Ligar para a Secretaria de Desenvolvimento Social, (19) 3522-1930 (já no catálogo), e perguntar como a família é encaminhada às cestas e se o PAA e o Armazém Solidário estão ativos.
3. Descobrir como se agenda a Defensoria em Rio Claro.
4. Confirmar o canal de inscrição do Fundo Social (Cadu ou WhatsApp).

## 8. Fontes que indicaram os achados (a abrir e conferir)

Resumos de busca restritos ao domínio da Prefeitura (páginas **não abertas**):
- [Rio Claro abre inscrições para cursos de qualificação gratuitos](https://rioclaro.sp.gov.br/secretarias/fundo-social-de-solidariedade/rio-claro-abre-inscricoes-para-cursos-de-qualificacao-gratuitos/) (Cadu, 780 vagas)
- [Rio Claro abre rematrículas para estudantes da educação infantil](https://rioclaro.sp.gov.br/educacao/rio-claro-abre-rematriculas-para-estudantes-da-educacao-infantil/) (ciclo 2026)
- [Matrículas e rematrículas na rede municipal começam em novembro](https://rioclaro.sp.gov.br/educacao/matriculas-e-rematriculas-na-rede-municipal-de-rio-claro-comecam-em-novembro/) (ano a confirmar)
- [Nova central para agendamento de consultas](https://rioclaro.sp.gov.br/fundacao-de-saude/nova-central-para-agendamento-de-consultas-comeca-a-operar-na-2a-feira-em-rc/) e [Outubro Rosa reforça importância de exames preventivos](https://rioclaro.sp.gov.br/fundacao-de-saude/outubro-rosa-reforca-importancia-de-exames-preventivos/)
- [Daae mantém atendimento telefônico no feriado da Revolução de 1932](https://rioclaro.sp.gov.br/daae/daae-mantem-atendimento-telefonico-no-feriado-da-revolucao-de-1932/) (Cadu no DAAE)
- [Prefeitura fará atendimento especial para atualização do Cadastro Único](https://rioclaro.sp.gov.br/desenvolvimento-social/prefeitura-fara-atendimento-especial-para-atualizacao-do-cadastro-unico/)
- [Armazém Solidário tem nova edição no Jardim Panorama](https://rioclaro.sp.gov.br/desenvolvimento-economico/armazem-solidario-tem-nova-edicao-no-jardim-panorama/)
- [Prefeitura entrega cesta básica para 17 mil alunos](https://rioclaro.sp.gov.br/educacao/prefeitura-entrega-cesta-basica-para-17-mil-alunos-das-escolas-municipais/)
- [Critérios de elegibilidade (Portaria MCID 738/2024)](https://rioclaro.sp.gov.br/wp-content/uploads/2025/11/CRITERIOS-DE-ELEGIBILIDADE.pdf)
- [Atualização cadastral para programa habitacional](https://rioclaro.sp.gov.br/planejamento-e-habitacao/em-rio-claro-atualizacao-cadastral-para-programa-habitacional-vai-ate-28-de-fevereiro/) e [alerta de golpe](https://rioclaro.sp.gov.br/planejamento-e-habitacao/criminosos-aplicam-golpe-oferecendo-moradias-do-programa-habitacional-de-rc/)
- [Fundo Social forma mais 20 cuidadores de idosos](https://rioclaro.sp.gov.br/fundacao-de-saude/fundo-social-forma-mais-20-cuidadores-de-idosos/) e [Rio Claro inaugura Centro Dia do Idoso](https://rioclaro.sp.gov.br/desenvolvimento-social/rio-claro-inaugura-centro-dia-do-idoso-nesta-quinta-feira/)

Federais (resumos de busca; abrir):
- [Inscrever-se no Cadastro Único](https://www.gov.br/pt-br/servicos/inscrever-se-no-cadastro-unico-para-programas-sociais-do-governo-federal)
- [Receber o Bolsa Família](https://www.gov.br/pt-br/servicos/receber-o-bolsa-familia)
- [BPC (MDS)](https://www.gov.br/mds/pt-br/acoes-e-programas/suas/beneficios-assistenciais/beneficio-assistencial-ao-idoso-e-a-pessoa-com-deficiencia-bpc) e [BPC no Cadastro Único](https://www.gov.br/mds/pt-br/acoes-e-programas/suas/beneficios-assistenciais/bpc-no-cadastro-unico)
- [Como fazer para pedir pensão alimentícia (Senado)](https://www12.senado.leg.br/noticias/especiais/especial-cidadania/pensao-alimenticia-atende-necessidades-basicas-e-padrao-de-vida/como-fazer-para-pedir-pensao-alimenticia)

Uma busca geral (sem restrição de domínio) trouxe descrições erradas, como chamar o Cadu de registro federal. Por isso nenhum achado desta página vem de busca aberta sem confirmação no domínio oficial.
