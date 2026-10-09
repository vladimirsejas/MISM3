# De mulher para mulher — regras antes de qualquer cadastro

A ideia: mulheres que oferecem serviços a outras mulheres (beleza, costura, comida, aulas, saúde e bem-estar, serviços na casa, transporte), dando renda a quem oferece e confiança a quem procura. Liga com o pilar **Autonomia Feminina**: quem faz um curso do Fundo Social (costura, beleza…) pode divulgar o trabalho.

## O que está pronto no código
- `catalogo/mulher_para_mulher.csv` (vazio) + `pipeline/mulher_para_mulher.py` (validador) + porta no site que **só aparece quando há cadastro válido**.
- O validador **recusa**: sem consentimento por escrito, endereço residencial ou CEP, e-mail pessoal, validade acima de 180 dias, e categorias de maior risco sem verificação descrita.
- Cadastro vencido some do site (o navegador confere a data; o pipeline também não publica).
- Nenhum cadastro foi criado: nada aqui é dado fingido.

## Regras (inegociáveis)
1. **Consentimento por escrito** de cada mulher, com data. Ela pode pedir remoção a qualquer momento e a remoção é feita em até 2 dias úteis.
2. **Só o necessário e só o profissional:** nome público (pode ser nome fantasia), descrição do serviço, bairro/região, WhatsApp ou telefone comercial. Nunca endereço de casa, CPF, foto de documento ou nome completo obrigatório. Quem divulga o telefone de uma mulher expõe essa mulher: por isso o consentimento e a validade.
3. **Validade curta:** no máximo 180 dias; sem renovação, sai.
4. **Sem prometer segurança.** O site diz que não garante o serviço, nem a segurança, e orienta: combinar em local público, avisar alguém de confiança, desconfiar de pedido de dinheiro adiantado.
5. **Sem pagamento, sem intermediação:** o MISM3 não cobra, não recebe e não combina corrida nem serviço. Só mostra o contato.
6. **Sem notas e avaliações públicas na primeira versão.** Avaliação mal desenhada vira difamação e vingança. Se vier depois, com regras e moderação definidas antes.
7. **Canal de denúncia:** precisa existir e ter **uma pessoa responsável** antes de publicar o primeiro cadastro (sugestão: a Secretaria da Mulher ou a coordenação do projeto). Sem responsável, não publica.

## Por que cada categoria tem um risco diferente
| Categoria | Risco | Regra |
|---|---|---|
| Beleza, costura/artesanato, comida, aulas, design/contabilidade | Baixo (contato por WhatsApp, atendimento em estabelecimento ou online) | Cadastro autodeclarado é aceito, **marcado como não verificado** |
| Saúde, corpo e bem-estar (academias, fisio, nutrição, psicologia) | Médio: exige registro profissional (CREFITO, CRN, CRP, CREF…) | Conferir o registro no conselho; só então marcar como verificado |
| **Serviços na casa da cliente** (reparos, diarista, cuidadora) | Alto: entra na casa de alguém | **Obrigatório** descrever a verificação e quem verificou |
| **Transporte e carona** | Alto: homem se passando por motorista é um risco real, e transporte remunerado de passageiros é atividade regulamentada | **Obrigatório** verificação presencial; **consultar a Prefeitura/jurídico** antes. **Não** afirmar parceria com Uber, 99 ou outro aplicativo sem confirmação por escrito |

## Como povoar (sem banco de dados e sem conta)
1. Combinar com a **Secretaria da Mulher** quem recebe e confere os cadastros e o canal de denúncia.
2. Parcerias naturais: **Fundo Social** (turmas de qualificação) e **Sala do Empreendedor / Desenvolvimento Econômico**. Começar pelas categorias de risco baixo, com 5 a 10 mulheres reais, e só depois avançar.
3. Cada mulher assina o termo de consentimento (modelo abaixo) e uma pessoa do projeto preenche a linha do CSV.

## Modelo de termo de consentimento (rascunho, revisar com a Secretaria/jurídico da Fatec)
> Autorizo a divulgação, no site Mapa do Cuidado Rio-Clarense (projeto acadêmico da Fatec Rio Claro), do nome profissional, da descrição do meu serviço, do meu bairro e do contato de trabalho que informei. Entendo que a divulgação é voluntária, vale por até 180 dias e pode ser retirada por mim quando eu quiser. Entendo que o site não garante o serviço nem a segurança e que não cobra nem recebe valores. Data: __ / __ / ____. Assinatura: ______

## Perguntas que ainda precisam de resposta (antes de publicar)
- Quem é o responsável pelo canal de denúncia e pela remoção?
- A Secretaria da Mulher quer participar? Sem parceria, vale publicar só a estrutura.
- Transporte: o que a legislação municipal exige de quem transporta passageiras com remuneração?
- LGPD: confirmar com o jurídico da Fatec quem é o controlador dos dados publicados.
