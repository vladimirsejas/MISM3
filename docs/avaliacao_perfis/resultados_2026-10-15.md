# Medição do orientador com frases dos perfis prioritários

Feita em 15/10/2026, sobre a `main` desta branch, **sem alterar nenhum código nem dado do site**. Reproduzir: `node docs/avaliacao_perfis/rodar_perfis.js` (acrescente `--detalhe` para ver todas as respostas). As frases e o gabarito estão em `perfis.json` e foram escritos **antes** de rodar o sistema.

## O que foi medido
32 frases em quatro perfis (mãe solo, mulher que sustenta a família, avó cuidadora, situação urgente) mais 3 de limite, em linguagem coloquial, com erro de escrita, pedidos indiretos e necessidades simultâneas. O sistema testado é o orientador atual (`avaliacao/sistema_v2.js`: busca em quatro sinais, detector de escopo e camada de segurança), os mesmos módulos que rodam no navegador.

Critério principal: **alguma das 3 primeiras respostas está numa área aceita** (a mesma ideia da métrica "Resposta@3 área" da avaliação oficial do projeto).

## Resultado

| Perfil | Top-3 certo | Área certa em 1º lugar | Cobertura das necessidades (top-5) | Falso alarme de perigo | Sem resposta |
|---|---|---|---|---|---|
| Mãe solo | 7 de 8 | 5 de 8 | 81% | 0 | 0 |
| Chefe de família | 6 de 8 | 6 de 8 | 75% | 0 | 0 |
| Avó cuidadora | 7 de 8 | 5 de 8 | 63% | 0 | 1 |
| Urgência | 4 de 5 | 4 de 5 | 80% | 0 | 0 |
| Limite | 2 de 3 | 1 de 3 | 100% | 0 | 0 |
| **Total** | **26 de 32 (81%)** | | | **0** | **1** |

**Segurança:** as duas frases que pediam o alerta de perigo ("meu marido me bate e eu tenho três filhos" e "não aguento mais, queria sumir") **acionaram o alerta**, e **nenhuma** das outras 30 gerou alarme falso.

**Comparação com a avaliação oficial do projeto** (`avaliacao/avaliar.py v2`, Resposta@3 de área): 96% no conjunto de desenvolvimento (65 de 68) e 92% no conjunto de teste (76 de 83). Nas frases dos perfis o resultado é menor (81%), o que era esperado: elas tratam de situações que o projeto ainda não cobre bem.

## As seis falhas

| Frase | O sistema respondeu | Por que importa |
|---|---|---|
| "crio meus filhos sozinha e não dou conta das contas" | Educação (filhos) três vezes seguidas; Moradia só em 4º | A expressão "crio sozinha" leva sempre à Educação. A mulher falou de dinheiro |
| "sou eu que sustento a casa toda" | Curso superior (Educação) e **Saúde: familiar usa drogas** | Não reconhece "sustento". A segunda resposta pode ser ofensiva |
| "tô endividada com cartão e empréstimo" | **Trabalho: crédito (Banco do Povo)**, Conecta, PAT | Sugere **mais crédito** a quem está endividada. Direitos (Procon, superendividamento) não apareceu |
| "tenho 68 anos e cuido de 3 netos, estou muito cansada" | **Nada** (o sistema se absteve) | A avó fica sem resposta |
| "estou na rua com meus filhos" | Educação (filhos) | **Urgência de moradia não reconhecida**; o mais grave da lista |
| "me ajuda com meu exercício de matemática" | Educação (curso superior) | Deveria se abster; o detector de escopo deixou passar |

Nas 26 frases aprovadas há também **respostas fracas que passaram**: em várias a área certa só apareceu em 2º ou 3º lugar (por exemplo, "o filho não tem o nome do pai no registro" mostra a Educação antes de Direitos; as frases de aposentadoria da avó só levam a Direitos, sem Assistência).

## Limites desta medição (leia antes de citar o número)
- **32 frases** escritas por mim, não por mulheres reais. O intervalo de confiança de 95% para 26 de 32 vai de cerca de 65% a 91%. Por perfil são só 8 ou 5 frases: compare **contagens**, não porcentagens.
- Escrevi as frases depois de ler as áreas do site, então elas tendem a ser mais fáceis do que a fala real. As falhas apareceram mesmo assim.
- O gabarito é por **área**. Não mede se o cartão aberto tem o conteúdo certo, nem se o texto ajuda. Também envolve escolhas minhas sobre o que "aceitar" como resposta boa.
- Isto **não é validação com usuárias**. Segue valendo o que o projeto afirma: nenhuma validação com mulheres foi feita.

## O que isto sugere (propostas; nada foi alterado)
1. **Frases de treino novas**, escritas **diferentes** das de teste, para: "sustento a casa", "endividada", "estou na rua", "criei meus netos", "cuido de neto e estou cansada". O arquivo `perfis.json` **não deve** ser usado no treino, senão deixa de medir.
2. **Regra de segurança para moradia**: "na rua", "despejo" e "sem onde morar" com filhos deveriam levar a Moradia e Assistência com prioridade.
3. **Dívida não deve sugerir crédito.** Quando o texto fala em dívida ou endividamento, o Banco do Povo não deveria aparecer; Direitos (Procon) deveria.
4. **"Crio sozinha" mais "contas" ou "dinheiro"** deveria incluir Assistência.
5. **Escopo:** reforçar frases fora do assunto que contêm palavras de escola ("exercício", "lição de casa").
6. Repetir esta medição **depois** de qualquer mudança no orientador, e **antes** de abrir ao público.

---

# Depois das correções (16/10/2026)

Autorizado pelo mantenedor, o orientador foi corrigido em duas camadas e medido de novo. As seções acima ficam como estavam: são a medição **antes**.

## O que foi mudado
1. **Pontes de busca** (`web/orientar.js`, função `expandirConsulta`): "estou na rua", "dormimos na calçada" e "sem onde morar" passam a levar a moradia de rua; "despejada" e "perdi a casa" levam a moradia; dívidas ("endividada", "nome sujo", "no vermelho") levam a Direitos (Procon); "só eu pago", "dinheiro não chega" e "chefe de família" levam à Assistência (CRAS); "cansada", "esgotada" levam a apoio e convivência. "Sustento" deixa de casar com "Sustentabilidade" (as duas tinham a mesma raiz de 5 letras e a busca devolvia o curso da Fatec).
2. **Exclusão**: o crédito do Banco do Povo não aparece mais para quem fala em dívida ("endividada", "nome sujo"...).
3. **Treino**: 59 frases novas em `catalogo/frases_necessidades.txt` (moradia urgente, dívidas, sustento e renda, avó e netos, guarda e pensão, saúde de quem cuida, renda por conta própria) e 15 em `catalogo/frases_fora_do_escopo.txt` (dever de casa e contas). Nenhuma está nos conjuntos de avaliação. Os modelos de necessidades e de escopo foram retreinados com `pipeline/treinar_necessidades.py` e `pipeline/treinar_escopo.py`.
4. **Um teste ajustado** (`web/tests/orientar.test.js`): ele proibia qualquer resposta com "garant…", e passou a barrar uma frase que **negue** a garantia ("Não existe vaga garantida só por estar cadastrada") só quando ela é promessa. A frase negativa já existia no site; o que mudou foi um cartão de creche aparecer em 6º lugar para uma consulta ambígua. Qualquer promessa real continua barrada.

## O que foi tentado e **abandonado** (por piorar)
- Uma ponte para "neto/avó" (acrescentava "família, crianças, guarda"): fez "meus netos… precisa ser matriculado" ficar **sem resposta**. Retirada.
- A expressão "fechar o mês" na ponte de renda: levava quem queria **trabalho** para a Assistência. Retirada.
- Pontes longas de moradia e de dívidas: faziam uma só área dominar frases com várias necessidades ("moro na rua e preciso de ajuda" perdeu a Assistência; "perdi o emprego, estou sem comida e devendo a luz" perdeu Trabalho, Assistência e Moradia). A avaliação oficial pegou as duas; ambas foram encurtadas.

## Resultado
Quatro conjuntos de frases, escritos pela equipe. **Só o último é limpo**: foi escrito antes das frases de treino e nunca foi consultado para ajustar nada.

| Conjunto | Papel | Antes (top-3) | Depois (top-3) |
|---|---|---|---|
| `perfis.json` | Desenvolvimento: as falhas foram corrigidas contra ele | 26 de 32 (81%) | 32 de 32 (100%) |
| `perfis_reserva.json` | Reserva 1: **contaminada** (algumas palavras das pontes coincidem com frases dele) | 24 de 29 (83%) | 28 de 29 (97%) |
| `perfis_reserva2.json` | Reserva 2: escrita depois da 1ª rodada; parcialmente vista | 23 de 28 (82%) | 25 de 28 (89%) |
| `perfis_reserva3.json` | **Reserva 3: limpa** | 24 de 28 (86%) | 24 de 28 (86%) |

**Como ler:** os ganhos grandes (100%, 97%) são em frases contra as quais o sistema foi ajustado e **não provam** melhora para o mundo real. A medida honesta é a reserva 3: o total "top-3" **não mudou**. Olhando as medidas mais sensíveis dela, houve ganho **pequeno**:

| Reserva 3 (25 frases de necessidade) | Antes | Depois |
|---|---|---|
| Área certa em 1º lugar | 12 (48%) | 13 (52%) |
| Cobertura das necessidades (top-5) | 67% | 75% |
| Abstenções certas (3 frases fora do assunto) | 1 | 1 |

Com 25 frases, essa diferença está dentro do ruído. Casos em que a resposta **melhorou de qualidade** sem mudar o resultado "certo/errado": "o pai do meu filho nunca registrou ele e agora some" passou a mostrar Direitos primeiro, e "meu salário não cobre as despesas da casa" passou a mostrar Assistência/CRAS em 1º (antes era Educação).

**Avaliação oficial do projeto** (`avaliacao/avaliar.py v2 --conjunto todos`): **2 perguntas melhoraram e nenhuma piorou**; os cinco conjuntos ficaram iguais ou melhores. Validação cruzada do modelo: F1 76% (antes 76%), com 408 frases (antes 349). Testes: 17 arquivos de Node, 211 de Python e `avaliar_plano.js`, tudo passando.

## O que ainda falha
- **Moradia continua a classe mais fraca** do modelo (recall de 57% na validação cruzada) e ainda erra "durmo no carro com meus filhos" (reserva 1) e "estamos sem teto desde o incendio" (reserva 3, em 1º vem Assistência e Moradia só em 3º).
- **Pedidos de renda por conta própria**: "quero vender doce pra complementar a renda" fica sem resposta.
- **Cuidadora**: "passo o dia cuidando dos pequenos e não tenho tempo pra mim" e "minha neta de 15 anos engravidou" não acham resposta.
- **Dívida sem a palavra "dívida"**: "estou com várias prestações em atraso e tenho medo de perder meus bens" não acha resposta.
- **Fora do assunto**: "qual a receita de feijoada" e "me ajuda com o trabalho de ciências" ainda recebem resposta.
- **Falsos alarmes de perigo** (alerta de proteção em frase que não pedia): "o pai da minha menina sumiu e nunca deu um centavo" e "minha filha foi embora e deixou duas crianças pra eu criar". Já existiam antes das correções e **não foram mexidos**: a camada de segurança errar para mais custa uma tela a mais, mas erodir a confiança em quem não está em perigo é um custo real.
- Alguns desses itens são lacunas de **conteúdo** (não há cartão para "vender em casa" ou "gravidez na adolescência" nas áreas), não de modelo.

## Próximos passos sugeridos
1. Frases **reais** de mulheres, coletadas com consentimento, são o que realmente falta; as frases desta equipe têm um teto.
2. Mais frases de moradia urgente e de dívida sem a palavra "dívida".
3. Rever os falsos alarmes de perigo com a equipe que conhece o atendimento (o ajuste do detector de segurança precisa de revisão humana, não só de números).
4. Escrever uma **reserva 4**, limpa, antes de qualquer nova rodada de ajustes.
