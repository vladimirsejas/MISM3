# Estado do projeto: o que existe, o que foi testado e o que ainda é proposta

Última verificação: 11/10/2026. Cada afirmação aqui tem um arquivo, um teste ou um número que a sustenta. Se algo mudar, atualize esta página junto com o código.

## O princípio

> **O Mulher em Rede (MISM3) oferece orientação baseada nas evidências disponíveis.** Não substitui a avaliação de profissionais, não determina automaticamente as necessidades de uma pessoa e explicita a origem, a data e os limites de cada informação que usa.

Não vendemos o sistema como diagnóstico social, nem como prova de que um serviço resolve um problema.

## Dois produtos, uma base de dados

| | Navegação social | Inteligência territorial (Observatório) |
|---|---|---|
| Para quem | Mulheres que procuram um caminho | Gestão pública e pesquisa |
| Pergunta | "O que posso fazer agora?" | "Onde existem lacunas que merecem investigação?" |
| Onde está | Site principal (`web/index.html`) | vista "Rio Claro em números" do dashboard (`#rio-claro-em-numeros`, no bloco "Para a gestão"; o site inteiro é `noindex`) |
| Dados | Catálogo de serviços, jornadas | Só agregados públicos; nenhuma pessoa identificável |

## Como ler as colunas

- **Implementado:** existe no código e roda.
- **Testado:** há teste automatizado ou conferência com fonte pública. **Não é** validação com usuárias.
- **Validado com usuárias:** pessoas reais usaram e os resultados foram observados. **Hoje não existe nenhuma.**
- **Proposta:** ideia ou minuta, sem implementação.

## Navegação social

| Capacidade | Implementado | Testado (como) | Validado com usuárias | Limite ou pendência |
|---|---|---|---|---|
| Sete portas e busca por palavras | Sim | 54 cenários escritos pela equipe (`necessidades.test.js`) | Não | Frases da própria equipe |
| Modelo de IA que sugere por onde começar | Sim, roda no aparelho | Validação cruzada em 408 frases: regras + modelo com precisão 71%, recall 80%, F1 76%, acerto exato 57% (`docs/ia/`). Classe mais fraca: moradia (recall 57%). Medição com frases de mãe solo, mulher que sustenta a casa e avó: `docs/avaliacao_perfis/` | Não | Não prova desempenho com mulheres reais; nunca decide direito nem diagnóstico |
| Jornada guiada de Trabalho (inclui a prioridade do Sine, Lei 14.542/2023) | Sim | `jornada.test.js`: ordem, links, promessas proibidas | Não | |
| **Jornada guiada de Educação** (vaga para o filho; estudar) | Sim | `jornada_educacao.test.js`: 33 combinações de respostas, fonte de cada link e telefone, sem promessa de vaga; conferida no Chromium | Não | Só organiza o que a área e o catálogo já traziam; o procedimento do CADU é de 2025 e precisa de confirmação anual. Falta a jornada de violência e proteção |
| **Jornada guiada de Assistência Social** (apoio no básico; direitos violados; convivência) | Sim | `jornada_assistencia.test.js`: 4 caminhos, telefones e links com fonte, sem promessa, sem valor de renda e sem horário; conferida no Chromium | Não | O passo do CRAS cita o Cadastro Único como primeiro passo, com o mesmo texto e as mesmas fontes do bloco novo da área; não diz valor de renda, horário nem benefício garantido. Para a mulher em violência aponta o Ligue 180 e a área Direitos; a jornada própria de violência espera a confirmação de CRAM, Delegacia e Patrulha |
| **Bloco "Cadastro Único e Bolsa Família"** (primeiro bloco da área Assistência Social) | Sim, desde 16/10/2026 | `cadunico.test.js`: é o primeiro bloco, tem fonte e aviso, só cita páginas oficiais, sem promessa, sem valor de renda, sem horário; conferido no Chromium em 1280 e 390 px, 0 requisições externas; o orientador leva "como faço o cadúnico" a ele em 1º lugar | Não | Texto lido em páginas da Prefeitura e do gov.br em 15/10/2026 **sem PDF arquivado** (aviso visível na tela e pendência declarada). Falta: horário do CRAS e do posto do Paço Municipal; valor atual do limite de renda do Bolsa Família (fica no gov.br, de propósito); prioridade da mulher responsável pela família no Minha Casa Minha Vida (depende do PDF dos critérios de habitação) |
| **Cartão "Pensão alimentícia: como pedir e o que levar"** (área Direitos, seção Separação, pensão e guarda; vem antes do da Defensoria) | Sim, desde 16/10/2026 | `pensao.test.js`: onde pedir, quem comparece (inclusive procuração e quem tem a guarda), documentos para menor e para maior de 18 anos, pai que não consta na certidão (ação de investigação de paternidade), avó sem guarda, Lei do Pix Pensão marcada como **ainda não vigente (julho de 2027)**; aviso de que a fonte principal é de **2012**; sem promessa, sem valor; conferido no Chromium em 1280 e 390 px | Não | Fonte principal é um texto do Senado de 04/09/2012: procedimentos podem ter mudado. Fora de propósito: alimentos provisórios, retroatividade e pensão avoenga (as fontes enviadas não são oficiais ou não tratam do caso). Falta uma fonte atual sobre reconhecimento de paternidade |
| **Cartão "Defensoria Pública: como pedir ajuda jurídica gratuita"** (área Direitos, seção Separação, pensão e guarda) | Sim, desde 16/10/2026 | `defensoria.test.js`: quem é atendido (3 a 4 salários mínimos; violência doméstica independe da renda), como agendar (portal, assistente virtual Júlia, gov.br ou nome e CPF), urgência, o que levar, endereço; com telefone igual ao do catálogo e sem promessa; conferido no Chromium em 1280 e 390 px | Não | Só o que está nas páginas arquivadas; o telefone e o horário vêm da conta oficial da Defensoria no Instagram (rede social da instituição: conferir também no site). **Falta**: o passo a passo de **pensão alimentícia e reconhecimento de paternidade** (a página do Senado enviada era de outro assunto) e o texto dos itens que vieram fechados na página "Agende seu atendimento" (quem tem direito, preparando-se, urgentes) |
| Cartões com fonte, data e aviso "não conferido" | Sim | Fonte e data obrigatórias em todo registro (`pytest`, `dashboard.test.js`) | Não | |
| Etapas da escola (creche, pré-escola) | Sim, 43 de 68 escolas municipais | Ligação 1 para 1 com o Censo Escolar 2025; nome parecido não liga | Não | As outras 25 continuam dizendo que a etapa deve ser confirmada |
| Horários de ônibus | Sim, 5 linhas, 382 horários, válidos até 04/02/2027 | Três leituras independentes das imagens | Não | Falta a linha 02 Arco-Íris/Mãe Preta; Circular I só no sentido Volta |
| Mapa de serviços (dentro de `web/index.html`) | Sim, na própria tela inicial | `mapa.test.js` com os dados reais; conferido no Chromium em 1280 e 390 px, 0 requisições externas | Não | Dos 164 serviços: 45 aparecem pelo endereço, 38 pela posição **aproximada** do CEP (vazados) e 81 só na lista, com link para pesquisar o endereço no Google Maps. Distância em linha reta, não caminho a pé. Mapa de ruas só se a usuária marcar a caixa |
| Qual CRAS atende o meu bairro? (na página do mapa) | Sim | `mapa.test.js`: os 167 bairros das listas oficiais dos 6 CRAS levam ao CRAS certo; bairro inventado não leva a nenhum; conferido no Chromium | Não | Só vale para CRAS (única categoria com lista oficial de área de atendimento). Nomes parciais pedem confirmação. Apelidos de bairro: 2 candidatos "a confirmar", nenhum em uso |
| Privacidade da busca | Sim: sem servidor próprio, sem cookies, sem localStorage (declarado no README) | Páginas verificadas no Chromium com 0 requisições externas | Não | O histórico do navegador pode guardar a visita; "Sair rápido" não apaga e diz isso |
| Entre Mulheres | Protótipo | `entre_mulheres.test.js` | Não | 0 ofertas cadastradas; canal de cadastro não definido |

## Catálogo e dados

| Capacidade | Estado | Evidência | Limite ou pendência |
|---|---|---|---|
| Catálogo de serviços | 164 registros; 146 com telefone, 151 com endereço, 47 com horário (contagem de 13/10/2026) | `catalogo/servicos_manuais.csv`, cada um com fonte e data | 3 registros "não conferidos" (CEI Tutê, Patrulha Maria da Penha e Cadu) |
| **Proteção à mulher** | **4 registros (DDM, Patrulha, Secretaria da Mulher e Defensoria); o CRAM foi retirado em 13/10/2026 por falta de fonte confiável e aparece só como dica na Secretaria**; **"não conferido": a Patrulha**; **2 sem telefone** (Patrulha e Defensoria). A DDM agora tem telefone publicado pela Prefeitura em 27/08/2025; o endereço publicado em 12/04/2017 fica com aviso para confirmação antes de ir. A Defensoria foi conferida em 11/10 e 15/10/2026 e agora tem telefone (0800 773 4340, das 7h às 19h em dias úteis) e a assistente virtual Júlia, disponível 24 horas, segundo a conta oficial da Defensoria no Instagram (abril de 2026). | `catalogo/servicos_manuais.csv`; publicações municipais da DDM, de 12/04/2017 e 27/08/2025; `docs/documetacao/defensoria-rio-claro.pdf` | CRAM e Patrulha continuam pendentes de fontes e contatos suficientemente seguros para uso atual. A DDM não tem horário informado no cadastro. |
| Localização dos serviços | 45 com latitude e longitude exatas (rua e número no CNEFE, revisadas por pessoa); 102 com CEP | `pipeline/geocodificar_catalogo.py` só sugere; nada entra sem aprovação | 105 pendentes; CEP dá só localização aproximada |
| Oferta de educação infantil | 69 escolas em atividade em Rio Claro (Censo Escolar 2025) | `web/dados/oferta_educacao_infantil.json` | Matrícula não é vaga, demanda nem fila |

## Inteligência territorial

| Capacidade | Estado | Evidência | Limite ou pendência |
|---|---|---|---|
| Mapa dos 408 setores com população e densidade | Implementado | Soma de pessoas igual ao Censo 2022 (201.418); área a 0,21% da oficial (`test_territorio.py`) | 43 setores (6,4% das pessoas) vêm sem bairro no IBGE |
| Distância até o serviço mais próximo | **Só creche** (33 de 43 escolas localizadas) | Trava: exige 70% dos serviços localizados | CRAS (2 de 6) e UBS (5 de 22) **não mostram distância**, de propósito |
| Painel da Secretaria | Protótipo com **420 registros sintéticos** | `painel.test.js` (regra dos 10) | Não há dado real |
| Questionário | 19 perguntas, **coleta desligada** (`ativa: false`) | `questionario.test.js` | Falta definir controlador de dados, termo e servidor; não validado com mulheres |
| População de 0 a 3 anos, renda, mulheres responsáveis por setor | **Não está no projeto** | | Sem isso não existe taxa de cobertura de creche |
| Pedidos de dados à Prefeitura (fila de creche, RMA, saúde, estatísticas) | Proposta: minutas 6 a 9 em `docs/pedidos_LAI.md` | | Sem protocolo registrado no projeto |

## Confiança por informação, não por página

Uma informação pode ter a fonte certa e a data antiga; um endereço pode estar certo e o horário não. Por isso a confiança é por dimensão:

| Dimensão | Já aparece para a usuária | Falta |
|---|---|---|
| Fonte | Sim: cada cartão cita a fonte e o link | |
| Atualização | Sim: data de verificação, "há N dias" e alerta quando é antiga | |
| Conferência | Sim, parcial: "ainda não conferido, ligue antes" | Mostrar quando o telefone foi confirmado por ligação |
| Localização | Só na página territorial (círculo cheio = endereço, vazado = CEP) | Mostrar no cartão se a localização é exata ou aproximada |
| Recomendação | Sim, só na jornada de Trabalho ("por que este passo") | As demais áreas |

## O que o projeto não afirma

- Que faz diagnóstico, ou que a IA "entende" a situação de uma mulher.
- Que há vaga em creche, emprego ou atendimento. Cadastro não confirma vaga.
- Que uma área "tem falta" de serviço. Distância em linha reta não é acessibilidade: não considera ruas, ônibus nem horários, e um serviço ainda não localizado não é um serviço ausente.
- Que o questionário ou o painel funcionam com dados reais. Hoje não funcionam.

## Ordem de trabalho recomendada

1. **Integridade técnica: feita.** Backup verificado, versão única na `main`, dados grandes fora do Git.
2. **Confiabilidade cadastral: em andamento.** Conferir os serviços de proteção; localizar os CRAS e as UBS; revisar as propostas restantes do geocodificador.
3. **Inteligência territorial: parcial.** Falta a planilha do Censo por setor (idade, renda) para a cobertura.
4. **Jornadas de orientação: só Trabalho.** Faltam sair de casa com os filhos, dinheiro, pensão e guarda, cada uma com fonte oficial.
5. **Validação com usuárias: não começou.** Roteiro em `docs/roteiro_validacao_navegacao.md`.

## Como atualizar os números desta página

```
PYTHONPATH=pipeline python -m pytest pipeline/tests -q
for f in web/tests/*.test.js; do node $f; done
python pipeline/territorio.py          # cobertura e distâncias
python pipeline/geocodificar_catalogo.py --cnefe <caminho do CNEFE>
```


## Orientador: avó/cuidadora, renda insuficiente e apoio social — 16/10/2026

- **Implementação em revisão:** a consulta lexical reconhece netos/netas, cuidado de crianças e pedidos explícitos de apoio familiar. Quando há sinais claros de cuidado e necessidade material, o orientador evita classificar a frase como fora do escopo. Pesos, limiares, modelos e camada de segurança não foram alterados.
- **Testes:** a suíte completa passou no GitHub Actions: 211 testes Python, testes JavaScript, avaliador de necessidades e avaliador do plano.
- **Validação independente:** `perfis_reserva14.json` marcou 19/20 (95%) no total; no perfil avó, 18/19 respostas corretas no top-3, 17/19 com a área principal em primeiro lugar, 92% de cobertura das necessidades, zero falsos alarmes de perigo e uma frase sem resposta. Execução: https://github.com/vladimirsejas/MISM3/actions/runs/38835434296.
- **Integridade da avaliação:** as reservas 4 a 13 foram consultadas durante o desenvolvimento e ficam apenas como regressão no CI; não são conjuntos independentes para estimar desempenho final.
- **Limites restantes:** a frase genérica “preciso de orientação social porque não consigo manter os pequenos” ainda não recebe resposta; não ajustei o código com base nessa falha para preservar a reserva 14. A consulta sobre familiar que usa cartão/dinheiro sem autorização continua sendo uma tarefa separada. A orientação detalhada do CadÚnico ainda depende de conferência/arquivamento de fonte oficial. Não houve validação visual em navegador.
- **Estado:** PR #57 segue em rascunho, sem mesclagem. MISM2 não foi alterado.
