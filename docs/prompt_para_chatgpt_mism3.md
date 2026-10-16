Você vai trabalhar no repositório MISM3 ("Mulher em Rede", Rio Claro, SP). É um projeto acadêmico (Fatec Rio Claro): um site estático que orienta mulheres para serviços públicos verificados. Quem usa o site pode estar em violência, sem comida ou prestes a ser despejada. **Uma informação errada pode causar dano real.**

REGRA DE OURO: é melhor entregar menos, com fonte, do que mais, sem fonte. Se você não tem certeza, PARE e pergunte. Nunca preencha com o que "provavelmente" é verdade.

Responda sempre em português do Brasil. Sem emojis em documentos do projeto.

======================================================================
1. CONTEXTO (leia antes de fazer qualquer coisa)
======================================================================

- Repositório: github.com/vladimirsejas/MISM3, branch `main`.
- O PR #55 (16/10/2026) JÁ ENTROU na `main`. Ele trouxe: o bloco "Cadastro Único e Bolsa Família" no topo da área Assistência Social; os cartões "Pensão alimentícia" e "Defensoria Pública" na área Direitos; correções do orientador de IA (pontes de busca, frases de treino, modelos retreinados). COMECE SEMPRE DA `main` ATUALIZADA. Se uma análise sua diz que "falta" algo, confira primeiro na `main`: por exemplo, o orientador já reconhece "sustento a casa", "estou na rua", "endividada".
- Arquitetura: site estático em `web/` (JavaScript ES5, sem build, sem npm, sem framework). Python em `pipeline/` só GERA dados. Os modelos de aprendizado de máquina são treinados em Python, exportados em JSON e rodam no navegador. Não há servidor, cookie, localStorage nem analytics. NÃO MUDE ISSO.
- Leia, nesta ordem: `README.md`; `docs/estado_do_projeto.md`; as 5 últimas entradas de `docs/registro_decisoes_desenvolvimento.md`; `docs/documetacao/LEIA-ME.md`; `docs/proposta_conteudo_mulheres_prioritarias.md`; `docs/texto_final_assistencia_cadunico.md`; `docs/avaliacao_perfis/resultados_2026-10-15.md`.
- Se você NÃO consegue acessar o repositório nem rodar comandos, diga isso na PRIMEIRA linha da resposta e trabalhe só no "modo proposta" (seção 7). NUNCA diga que rodou um teste que você não rodou.

======================================================================
2. REGRAS INEGOCIÁVEIS
======================================================================

1. FONTE OFICIAL, DATA E STATUS. Só afirme telefone, endereço, horário, documento, valor, critério ou prazo que esteja (a) numa página oficial ARQUIVADA em PDF em `docs/documetacao/` (nível A), ou (b) na tela com o aviso "ainda não conferido, confirme no CRAS" (nível B+, página lida mas sem PDF). NADA por dedução, por memória, por blog, por Jusbrasil, por rede social de terceiros, por site privado (cadunico.com.br, infocidadao.com) ou por resumo de outra IA, inclusive o seu.
2. NUNCA escreva no site: valor de renda (ex.: "R$ 218"), horário de atendimento sem página oficial arquivada, "você tem direito", "benefício garantido", "vaga garantida", "aprovado", "você vai receber". Os testes barram isso. Não tente contornar.
3. NENHUM BOTÃO, PORTA OU TELA NOVA. Todo conteúdo entra nas áreas que já existem (`web/areas.js`), como cartões `canais` com `topicos`, `aviso` e `fonte`, ou como tópicos de cartões existentes.
4. NÃO MEXA, sem autorização humana explícita: a camada de segurança (`web/perigo.js`, `web/dados/modelo_perigo.json`, `catalogo/frases_perigo.txt`, `pipeline/treinar_perigo.py`); o botão "Em perigo agora?" e os telefones 190, 192, 193, 180, 100, 188; os pesos e limiares do orientador (`PESOS`, `limiar`, `minimo`, `corte`, `limiarEscopo` em `web/orientar.js`); a privacidade (nada de cookie, localStorage, analytics ou chamada de rede externa).
5. NUNCA EDITE À MÃO ARQUIVOS GERADOS:
   - `web/dados/catalogo_manual.json` -> edite `catalogo/servicos_manuais.csv` e rode `python pipeline/servicos.py --somente-manual`;
   - `web/dados/indice_orientacao.json` -> `python pipeline/indice_orientacao.py`;
   - `web/dados/modelo_necessidades.json` e `modelo_escopo.json` -> `python pipeline/treinar_necessidades.py` e `python pipeline/treinar_escopo.py`.
6. NUNCA enfraqueça, apague ou pule um teste para ficar verde. Se um teste falha, descubra por quê. Só altere um teste se ele barrar algo legítimo; explique no PR e mantenha a proteção contra promessa.
7. NÃO misture o MISM3 com o MISM2.
8. IDs ESTÁVEIS. Não renumere seções. O `app.js` cria ids `secao-N` por POSIÇÃO quando a seção não tem `ancora`; o índice do orientador e o gabarito da avaliação usam esses ids. Ao inserir uma seção nova, dê a ela uma `ancora` própria e fixe a `ancora` das antigas com o mesmo id que tinham (em Assistência, "secao-1" a "secao-4"), ou acrescente a nova no FIM.
9. UM ASSUNTO POR PR. Nunca faça merge. Nunca faça force push nem reescreva histórico. Nunca versione segredos (`.env`). Não commite arquivo grande que não foi gerado pelos scripts.
10. NÃO invente dados, números, histórias de usuárias nem "quantas avós vivem isso em Rio Claro". Sem dado, escreva "pendente".

======================================================================
3. ARMADILHAS JÁ ENCONTRADAS (aprendidas do jeito difícil)
======================================================================

- Depois de mexer em `web/areas.js` SEMPRE regenere o índice (`python pipeline/indice_orientacao.py`) e atualize a contagem de destinos em `docs/mapa_de_dados.md` (um teste do pytest confere).
- Pontes de busca (função `expandirConsulta` em `web/orientar.js`): ponte LONGA faz uma área dominar frases com várias necessidades; palavra GENÉRICA captura o assunto errado (uma ponte para "benefício" mandou "INSS meu benefício foi negado" para a Assistência; o certo é Direitos). Faça pontes curtas e específicas e teste contra frases de assuntos vizinhos.
- Frases novas de treino NÃO podem estar nos conjuntos de avaliação (`avaliacao/perguntas.json` e `docs/avaliacao_perfis/*.json`); há testes que conferem. Nunca treine com frases de um conjunto reservado.
- Todo conjunto contra o qual você AJUSTA deixa de ser limpo. Escreva um conjunto reservado NOVO, antes de ajustar, para medir de verdade.
- O índice (LSA) muda um pouco a cada regeneração. Abstenções por 0,004 de diferença (ex.: nota 0,294 contra limite 0,30) são ruído: NÃO "corrija" mexendo no limiar.
- Um cartão que repete muito uma palavra (ex.: "advogado") pode passar na frente do serviço certo (a Defensoria) no ranking. Depois de escrever, rode a avaliação e compare PERGUNTA POR PERGUNTA, não só o total.
- Impressões em PDF de páginas com itens "dobrados" (acordeões) vêm com o texto FECHADO. Peça para a pessoa abrir os itens antes de imprimir ou colar o texto.
- Resumos de IA já erraram aqui: "Lei do Pix Pensão já vale" (só vale em julho de 2027), sigla do CADU ("UniCidadão"; a Prefeitura escreve "Unicidades"), "CadÚnico criado em 2003". Trate qualquer resumo como pista, nunca como fonte.
- Windows: use `encoding="utf-8"` explícito; há duas cópias do projeto no computador da usuária; todo comando que você der precisa dizer em QUAL pasta rodar. Para abrir o site: `abrir_site.bat`.
- O CI do GitHub roda Python 3.12 e Node 20. Confira se não depende de versão mais nova.

======================================================================
4. O QUE PODE USAR x O QUE NÃO PODE SER PUBLICADO COMO ESTÁ
======================================================================

PODE USAR (já tem PDF arquivado em `docs/documetacao/`):
- O Cadu (aplicativo da Prefeitura) é a "Central de Atendimento Digital Unicidades"; o 0800 019 0505 atende DAAE e Saúde: atendente humano de segunda a sexta, das 7h às 19h; assistente virtual das 19h às 7h e 24 h em fins de semana e feriados (`daae-cadu-atendimento.pdf`, `cadu-g1-especial-publicitario.pdf`).
- Os 6 CRAS: endereços, telefones e bairros atendidos (`cras.pdf`); Conselho Tutelar (`ctutelar.pdf`); CREAS (`creas.pdf`); Disque 100 (`disque100.pdf`).
- Defensoria de SP em Rio Claro: Rua Um, nº 659, Saúde; 0800 773 4340, das 7h às 19h em dias úteis; assistente virtual Júlia, 24 h (`defensoria-*.pdf`).
- Pensão alimentícia (Senado, texto de 2012) e Lei do Pix Pensão (Lei 15.479/2026, em vigor só em julho de 2027) (`senado-*.pdf`).

NÃO PUBLIQUE COMO ESTÁ (veio de textos de IA; exige página oficial arquivada):
- "Bolsa Família: renda de até R$ 218 por pessoa" e o exemplo de cálculo. O valor pode estar desatualizado; o site hoje remete ao gov.br, de propósito. Só publique o número depois de arquivar a página do gov.br e da Prefeitura e conferir que batem, e sempre com data.
- "CRAS atende das 8h às 17h" e "setor de Cadastro Único: confirme o horário". A única faixa "8h às 12h e 13h às 17h" na base é a da SEDE da Secretaria de Desenvolvimento Social, que é outro endereço.
- "Núcleo de Orientação ao Idoso" com telefone ou horário: não há fonte no projeto.
- CREAS "(19) 3523-6513": o catálogo tem "(19) 3523-6420 / (19) 3523-6439" (fonte `creas.pdf`). O endereço Rua 6, nº 640 confere. NÃO troque o telefone sem PDF.
- Tarifa Social do DAAE "desconto de 50%" e critérios: confira no PDF já arquivado (`daae-tarifa-social-agua.pdf`, Resolução ARES-PCJ nº 592/2024) antes de repetir qualquer número.
- Alimentação: só há notícia de cestas para ALUNOS da rede municipal (jan.-fev. de 2026) e do Programa de Aquisição de Alimentos/Armazém Solidário por meio dos CRAS. NÃO é programa aberto a qualquer família. O texto deve dizer "pergunte no CRAS quais recursos de alimentação existem agora".
- "Alimentos provisórios", "retroatividade da pensão", "pensão avoenga": sem fonte oficial no projeto.
- BPC: remeta ao gov.br. Não resuma critérios de memória.

======================================================================
5. TRABALHO A FAZER (um item por vez, um PR por item, nesta ordem)
======================================================================

T1. AVÓ QUE SUSTENTA A FAMÍLIA COM A APOSENTADORIA.
   - Meça primeiro: escreva 20 frases novas (coloquiais, com erro de escrita) em um conjunto reservado NOVO (`docs/avaliacao_perfis/perfis_reserva4.json`, mesmo formato dos outros) e rode `node docs/avaliacao_perfis/rodar_perfis.js perfis_reserva4.json` ANTES de mudar qualquer coisa.
   - Reconhecimento: pontes curtas e frases de treino (59 já existem; escreva frases diferentes, ex.: "minha aposentadoria sustenta meus filhos e netos", "pago as contas da casa com a aposentadoria", "crio meus netos e não sobra dinheiro para mim").
   - Conteúdo: UM tópico novo dentro do cartão do Cadastro Único ou de "Seu CRAS", sem seção nova e sem botão, no formato "onde começo, o que levo, o que faço se não der certo". Não presuma exploração financeira; para suspeita de abuso (alguém usa o cartão ou o dinheiro dela sem consentimento) aponte o Disque 100 e o CREAS, que já constam no site.
   - Não prometa benefício. Não diga que a aposentadoria impede ou garante algo.
T2. ALIMENTAÇÃO. Só com fonte: Plano Municipal de Segurança Alimentar 2025-2028 e páginas da Secretaria de Desenvolvimento Social, arquivados em PDF. Até lá, só "pergunte no CRAS".
T3. HABITAÇÃO. Só com os PDFs arquivados: critérios de elegibilidade (Portaria MCID 738/2024, publicada no site da Prefeitura) e a página de atualização do cadastro habitacional. A prioridade da "mulher responsável pela família declarada no CadÚnico" só entra se constar nesses PDFs.
T4. TARIFA SOCIAL E DÍVIDAS: conferir se Moradia já liga o CadÚnico à tarifa social, com fonte, e conectar sem duplicar texto.
T5. SAÚDE DA MULHER E DE QUEM CUIDA: levar para a área Saúde o que hoje está só na observação do registro `man-cadu` do catálogo (agendamento pelo 0800 019 0505; mamografia e Papanicolau dependem de solicitação de profissional).
T6. ARQUIVAR AS PÁGINAS PENDENTES do CadÚnico (Prefeitura e gov.br) para tirar o aviso "ainda não conferido". Isso é feito PELA PESSOA, imprimindo em PDF; você só atualiza o `LEIA-ME.md` e a tela.
T7. RECONHECIMENTO DE PATERNIDADE: aguardar fonte atual. Não escreva nada sem ela.

======================================================================
6. PROCESSO OBRIGATÓRIO EM CADA ITEM
======================================================================

1. `git checkout main && git pull origin main && git checkout -b chatgpt/<assunto>`. Nunca trabalhe direto na `main`.
2. Escreva um DIAGNÓSTICO curto (o que existe, o que falta, que arquivos serão tocados) e ESPERE a aprovação da pessoa antes de mudar código ou conteúdo publicado.
3. Escreva o conjunto reservado NOVO e meça o "antes".
4. Faça a MENOR mudança possível.
5. Regere o que for gerado (seção 2, regra 5).
6. Verifique (comandos abaixo). Cole a SAÍDA REAL.
7. Documente: `docs/estado_do_projeto.md`, `docs/registro_decisoes_desenvolvimento.md` (inclua os ERROS que você cometeu e corrigiu), e `docs/documetacao/LEIA-ME.md` se houver PDF novo (um teste exige que todo PDF da pasta esteja explicado).
8. Abra o PR com descrição honesta (o que muda, o que NÃO foi conferido, limites). Não faça merge.

COMANDOS (Linux/macOS; no PowerShell veja os equivalentes no README):
```
PYTHONPATH=pipeline python -m pytest pipeline/tests -q
for f in web/tests/*.test.js; do node "$f" || break; done
python avaliacao/avaliar.py v2 --conjunto todos
node avaliacao/avaliar_plano.js
node docs/avaliacao_perfis/rodar_perfis.js perfis.json
node docs/avaliacao_perfis/rodar_perfis.js perfis_reserva3.json
```

CRITÉRIOS DE ACEITE (linha de base em 16/10/2026):
- pytest: 211 passam. Node: 20 arquivos passam.
- `avaliar.py v2 --conjunto todos` (Resposta@3 de área): desenvolvimento 66/68, teste 76/83, independente 85/87, reserva 29/35, final 55/63. NENHUMA pergunta pode piorar: compare por pergunta com o resultado anterior (o CI não pega isso sozinho).
- `perfis.json`: 32/32; `perfis_reserva3.json`: 23/28. Seu conjunto novo: informe antes e depois.
- Navegador (Playwright com `/opt/pw-browsers/chromium` ou Chrome): conferir a área alterada em 1280 px e 390 px: sem erro de página, sem rolagem lateral, 0 requisições externas.
- O CI do GitHub (workflow `testes`) precisa ficar verde.

======================================================================
7. MODO PROPOSTA (se você não consegue rodar nada)
======================================================================

Entregue: (a) o texto final em português; (b) o trecho exato de `web/areas.js` (formato dos cartões `canais`), dizendo EM QUAL seção entra e que ids NÃO podem mudar; (c) os testes que devem ser adicionados; (d) os comandos que a pessoa deve rodar. Marque tudo como "NÃO TESTADO". Não diga "verifiquei", "conferi" nem "está funcionando".

======================================================================
8. FORMATO DE CADA RESPOSTA
======================================================================

1. O que li (arquivos).
2. Diagnóstico.
3. Proposta (texto + onde entra).
4. Arquivos alterados.
5. Saída real dos comandos (cole).
6. O que pode dar errado e o que NÃO foi conferido.
7. Perguntas para a pessoa.

Escreva os textos do site em frases curtas, para quem tem pouca prática de leitura: "você", sem jargão jurídico. Cada orientação responde a três perguntas: onde começo, o que levo, o que faço se não der certo. Cada orientação termina com fonte, data da leitura e aviso.

======================================================================
9. QUANDO PARAR E PERGUNTAR
======================================================================

Pare e pergunte se: faltar fonte oficial para uma afirmação; duas fontes divergirem (telefone, endereço, valor); um teste falhar e a correção exigir mudar teste, limiar ou a camada de segurança; qualquer coisa exigir botão, porta ou tela nova; uma pergunta da avaliação oficial piorar e você não entender por quê; você estiver tentado a "arredondar", "supor" ou "completar" um dado. Perguntar custa uma mensagem; errar custa a confiança de uma mulher que procurou ajuda.
