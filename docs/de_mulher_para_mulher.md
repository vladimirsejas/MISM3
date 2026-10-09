# De mulher para mulher — como funciona e por que é viável

**A ideia:** mulheres que oferecem serviços a outras mulheres (beleza, costura, comida, aulas, saúde e bem-estar, serviços na casa, transporte). Dá renda a quem oferece e confiança a quem procura. Liga com o pilar **Autonomia Feminina**: quem faz um curso do Fundo Social (costura, beleza…) pode divulgar o trabalho.

## Decisão central: quem verifica é a Secretaria da Mulher
Um site feito por estudantes **não tem como garantir** que só mulheres participam, e não deve prometer isso. Quem pode exigir comprovação, conferir documentos e responder por isso é um **órgão público**. Por isso:

- **Todo cadastro é conferido pela Secretaria Municipal da Mulher** (ou órgão oficial que ela designar) antes de aparecer.
- O **critério de quem pode participar é da Secretaria**, não do projeto.
- O site só publica o que a Secretaria enviou **já verificado**: o código recusa qualquer linha sem "o que foi conferido, por quem e quando".
- Aplicativos privados também fazem verificação própria, e ela falha às vezes. Por isso o selo do MISM3 diz **exatamente o que foi conferido**, nunca "seguro" ou "garantido".

## Quem faz o quê
| Papel | Responsável | O que faz |
|---|---|---|
| Receber a adesão e o termo de consentimento | Secretaria da Mulher | Atende a mulher (presencial ou canal oficial) |
| Conferir identidade, e registro profissional/CNH quando se aplica | Secretaria da Mulher | Preenche "o que foi conferido" e a data |
| Canal de denúncia e remoção | Secretaria da Mulher | Responde e pede a retirada em até 2 dias úteis |
| Receber a planilha verificada, validar o formato e publicar | **Projeto (Fatec)** | `pipeline/mulher_para_mulher.py` + site |
| Renovação a cada 180 dias | Secretaria | Sem renovação, o cadastro some sozinho do site |

O projeto entrega a **ferramenta e as regras**. A Secretaria opera a verificação. Sem a parceria, a área fica pronta mas **vazia e invisível**: a porta só aparece quando há cadastro verificado.

## Fluxo da participante
1. Procura a Secretaria e assina o termo de consentimento.
2. A Secretaria confere os dados e registra o que conferiu.
3. A Secretaria envia a linha da planilha ao projeto.
4. O projeto valida e publica: nome profissional, descrição, **bairro/região** e contato de trabalho.
5. A cada 180 dias ela renova, ou o cadastro sai. Pode pedir remoção quando quiser.

## O que o código garante hoje
`catalogo/mulher_para_mulher.csv` está **vazio** (nada é dado fingido). O validador **recusa**:
- cadastro sem consentimento com data, ou com data no futuro;
- cadastro sem **forma de verificação, quem verificou e quando**;
- endereço residencial ou CEP no campo de bairro; e-mail pessoal como contato;
- validade acima de 180 dias; categoria ou local de atendimento desconhecidos.

Cadastro vencido não é publicado e o navegador também o esconde. Não há notas nem avaliações, não há pagamento e o MISM3 não intermedia nada.

## Categorias e cuidado extra
| Categoria | Cuidado |
|---|---|
| Beleza, costura/artesanato, comida, aulas, design/contabilidade | Conferência de identidade pela Secretaria |
| Saúde, corpo e bem-estar | Além da identidade, conferir o registro no conselho profissional (CREFITO, CRN, CRP, CREF…) |
| **Serviços na casa da cliente** (reparos, diarista, cuidadora) | Conferência reforçada: a profissional entra na casa de alguém e a cliente também fica exposta |
| **Transporte e carona** | Conferência reforçada e **consulta à Prefeitura/jurídico** sobre transporte remunerado de passageiros. **Não afirmar parceria com Uber, 99 ou outro aplicativo** sem confirmação por escrito |

Sugestão para a primeira fase: começar só pelas categorias de menor risco.

## O que não prometemos
Segurança absoluta. A verificação confere o que está escrito no cartão do site e nada além. O site orienta a combinar em local público, avisar alguém de confiança e desconfiar de pedido de dinheiro adiantado.

## Como apresentar à banca
1. **Problema:** a mulher que quer renda ou serviço de outra mulher não tem onde encontrar com confiança.
2. **Solução:** uma área em que **a Secretaria verifica** e o MISM3 publica, com regras de privacidade desde o desenho.
3. **Honestidade sobre os limites:** o projeto não verifica ninguém, não garante segurança e só funciona com a parceria da Secretaria. Isso é uma força: mostra que o grupo entendeu o problema.
4. **Mostrar:** a porta "De mulher para mulher" aparecendo com um cadastro de demonstração marcado como **DEMO**, e o validador recusando um cadastro sem verificação ou com endereço.
5. **Próximo passo:** piloto com 5 a 10 mulheres, escolhidas pela Secretaria, nas categorias de menor risco.

## Modelo de termo de consentimento (rascunho, revisar com a Secretaria/jurídico da Fatec)
> Autorizo a divulgação, no site Mapa do Cuidado Rio-Clarense (projeto acadêmico da Fatec Rio Claro, em parceria com a Secretaria Municipal da Mulher), do nome profissional, da descrição do meu serviço, do meu bairro e do contato de trabalho que informei. Entendo que a divulgação é voluntária, vale por até 180 dias e pode ser retirada por mim quando eu quiser. Entendo que a verificação feita pela Secretaria confere apenas o que está descrito no cadastro e que o site não garante o serviço nem a segurança, não cobra e não recebe valores. Data: __ / __ / ____. Assinatura: ______

## Perguntas em aberto (para a Secretaria e o jurídico da Fatec)
- A Secretaria aceita ser a verificadora e quem responde ao canal de denúncia?
- Qual critério de elegibilidade ela adota e como confere?
- Transporte: o que a legislação municipal exige de quem transporta passageiras com remuneração?
- LGPD: quem é o controlador dos dados publicados (Secretaria ou Fatec)?
