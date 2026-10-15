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
