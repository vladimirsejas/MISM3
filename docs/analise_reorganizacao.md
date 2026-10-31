# Análise de reorganização do MISM3 (somente leitura)

31/10/2026. Nada aqui altera o site, exceto a correção citada na seção 5. Os números vêm de uma contagem feita no código desta branch; onde não consegui conferir, está escrito.

## 1. O que a pesquisa trouxe nesta rodada (América do Norte e Europa)

Nível de confiança como em `proposta_conteudo_mulheres_prioritarias.md`: **B** é resumo de busca de fonte oficial, sem a página aberta; **C** é diretório, notícia ou blog.

| Modelo | O que faz | Nível | Serve ao MISM3? |
|---|---|---|---|
| Benefits Finder, Canadá | Poucas perguntas, lista de benefícios, sem coletar nem rastrear (segundo a página arquivada). Quem combina muitas opções pode esconder resultados. | B | Sim, como método da triagem. Aviso: mais filtros podem esconder resultados. |
| Benefit Finder, EUA (Benefits.gov) | Mais de mil programas; diz não pedir identificação nem guardar respostas; permite imprimir ou enviar o resultado, porque sair da página perde tudo. | B (página antiga) | Sim: o plano do MISM3 já fica só no aparelho; vale oferecer **imprimir**, e o MISM3 já tem `tituloImpressao`. |
| Centros LIBRE, México | Atendimento integral perto da comunidade, com psicologia, assistência social e direito; relatos de 1.001 centros em 2026. Nada sobre cuidado infantil. | B/C | Só como ideia: articular profissionais diferentes. |
| Routes to Support, Reino Unido | Cadastro único de serviços de violência, mantido **pelos próprios serviços**, com data de atualização. | B | Sim: é o que o catálogo do MISM3 ainda não tem (cada serviço corrigir a sua ficha). |
| Maison des Femmes, França | Um profissional coordena cada trajetória, para a mulher ter um único ponto de contato. Financiamento descrito como frágil. | B | Ideia: um passo "primeiro contato" em cada plano. |
| Alemanha, mães sozinhas | Programas de redes locais e treinamento em tempo parcial; os resultados de busca são antigos e não confirmam o que existe hoje. | C | Não adotar nada sem verificar. |

**Não verifiquei** e por isso **não uso**: os números do Urban Institute, do MY TURN, do WISE, a rede irlandesa e a afirmação de que o ACCESS NYC cobre "mais de 44 benefícios". Foram citados em um texto colado, sem a página aberta por mim.

## 2. Estrutura real do MISM3 hoje

Sete portas. Contagem no código:

| Área | Atalhos no topo | Seções | Cartões | Onde mora o conteúdo |
|---|---|---|---|---|
| Trabalho | 16 + currículo | 2 em `areas.js` | 0 | **dentro de `jornada-ui.js`, em texto HTML** (18 blocos) |
| Educação | 4 | 5 | 12 | `areas.js` |
| Saúde | 6 | 2 | 6 | `areas.js` |
| Direitos | 4 | 4 | 4 | `areas.js` |
| Moradia | 3 | 3 | 4 | `areas.js` |
| Assistência | 3 | 6 | 6 | `areas.js` |

Catálogo: 164 serviços; 147 com telefone, 152 com endereço, **49 com horário (115 sem)**, 45 com coordenada de fonte.

## 3. Achados

**A. Trabalho é o único que não segue o padrão.** As outras áreas são dados (`areas.js`: seção, cartão, tópicos, aviso, fonte). Trabalho é HTML escrito à mão em `jornada-ui.js`: 18 blocos, de 448 a 4.291 caracteres, e a lista "Por onde começar" tem 16 itens planos (dinheiro esta semana, renda imediata, o que posso fazer hoje, ideias de renda, vagas, estudar, sem experiência, entrevista, aparência, básico, transporte, filhos, golpes, rejeição, rede). Concordo que é completo e desorganizado. Itens que se sobrepõem: "dinheiro esta semana", "renda imediata", "o que posso fazer hoje" e "ideias de renda"; "básico", "transporte" e "filhos", que são barreiras e não temas.

**B. Duplicata textual entre Trabalho e Educação.** A seção "Formação mais longa (anos)" aparece com os mesmos textos e links nas duas áreas (3 textos longos idênticos). Também há 4 links iguais.

**C. Redundância que eu criei.** O caminho "Estou sozinha com os filhos" que acrescentei em Assistência faz quase o mesmo plano que a jornada de Trabalho já faz quando a mulher responde "tenho filhos" e "não tenho com quem deixá-las": CRAS, creche, currículo, vagas, ônibus, cursos. Assistência acrescenta só a Defensoria. São dois motores gerando planos parecidos. Se o texto de um mudar, o outro fica velho.

**D. Saúde tem um buraco que pesa mais que a organização.** Os seis cartões da área são todos sobre álcool e drogas na família (comunidade terapêutica, grupos de ajuda mútua). Cinco dos seis atalhos do topo levam para a mesma lista de unidades. **Não há texto sobre mamografia, Papanicolau, pré-natal ou câncer**, que são o assunto central do projeto. Essas palavras só aparecem no catálogo e no índice do orientador.

**E. Educação já está separada.** A área tem "Para os seus filhos" (12 cartões) e "Para você" em seções distintas, e o guia do topo já divide assim. Aqui o problema não é a separação: é a duplicata do item B.

**F. Direitos e Assistência.** Têm propósito diferente e a duplicação de serviço é pequena (telefone da Secretaria de Desenvolvimento Social 3 vezes; o 0800 da Defensoria 2). Falta só um aviso cruzado quando o assunto toca os dois, como pensão e guarda (Direitos) e Cadastro Único (Assistência).

**G. Qualidade do catálogo.** 115 de 164 serviços sem horário. Uma jornada bem organizada não resolve isso: a mulher chega sem saber quando é atendida.

## 4. Recomendação, por ordem

1. **Unir os dois planos para quem tem filhos e quer trabalhar (C).** Assistência chama o motor de Trabalho com respostas já preenchidas e acrescenta só o passo da Defensoria. Pequeno e evita divergência futura.
2. **Reorganizar Trabalho sem perder nada (A).** Cinco grupos: renda agora; procurar emprego; preparar a candidatura (currículo, entrevista, aparência, rejeição, golpes); formação (estudar, MEI); e a minha realidade (filhos, transporte, o básico, rede, apoio). Manter os mesmos endereços (`#trabalho/trabalho-...`) para os links e testes antigos continuarem valendo. Num segundo momento, mover o texto para dados, como nas outras áreas.
3. **Uma só fonte para "Formação mais longa" (B).** Educação guarda o texto; Trabalho aponta para lá.
4. **Saúde da mulher (D).** Acrescentar o que falta, com fonte aberta antes de escrever: mamografia, Papanicolau, pré-natal. Depois, três grupos: atendimento, saúde mental e apoio, família e dependência química.
5. **Horários do catálogo (G).** Conferir por telefone os serviços mais usados primeiro: creche e CRAS.
6. **Avisos cruzados entre Direitos e Assistência (F).**
7. **Moradia:** só navegação; não há duplicata relevante.

## 5. Correção feita agora

O passo "Pergunte à Defensoria sobre a pensão" dizia que a pensão "só vale a partir do pedido na Justiça". Essa frase veio de conhecimento geral meu, sem fonte aberta, e o projeto só afirma o que uma fonte sustenta. Foi trocada por "Pergunte cedo como e onde pedir". (`web/jornada-assistencia.js`)

## 6. O que não fazer

Botão novo para mães solo ou refugiadas; segundo catálogo de cursos; segunda lista de telefones; robô de conversa que envie texto a servidor; novo mapa. Rede comunitária de mulheres e orientação para migrantes só depois de levantamento local.
