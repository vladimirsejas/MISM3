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
| Onde está | Site principal (`web/index.html`) | `web/territorio.html` (fora do site público, sem link na tela inicial, `noindex`) |
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
| Modelo de IA que sugere por onde começar | Sim, roda no aparelho | Validação cruzada em 325 frases: regras + modelo com precisão 71%, recall 81%, F1 75%, acerto exato 56% (`docs/ia/`) | Não | Não prova desempenho com mulheres reais; nunca decide direito nem diagnóstico |
| Jornada guiada de Trabalho (inclui a prioridade do Sine, Lei 14.542/2023) | Sim | `jornada.test.js`: ordem, links, promessas proibidas | Não | |
| **Jornada guiada de Educação** (vaga para o filho; estudar) | Sim | `jornada_educacao.test.js`: 33 combinações de respostas, fonte de cada link e telefone, sem promessa de vaga; conferida no Chromium | Não | Só organiza o que a área e o catálogo já traziam; o procedimento do CADU é de 2025 e precisa de confirmação anual. Falta a jornada de violência e proteção |
| **Jornada guiada de Assistência Social** (apoio no básico; direitos violados; convivência) | Sim | `jornada_assistencia.test.js`: 4 caminhos, telefones e links com fonte, sem benefício específico nem promessa; conferida no Chromium | Não | Não menciona CadÚnico nem benefício específico (sem fonte no projeto). Para a mulher em violência aponta o Ligue 180 e a área Direitos; a jornada própria de violência espera a confirmação de CRAM, Delegacia e Patrulha |
| Cartões com fonte, data e aviso "não conferido" | Sim | Fonte e data obrigatórias em todo registro (`pytest`, `dashboard.test.js`) | Não | |
| Etapas da escola (creche, pré-escola) | Sim, 43 de 68 escolas municipais | Ligação 1 para 1 com o Censo Escolar 2025; nome parecido não liga | Não | As outras 25 continuam dizendo que a etapa deve ser confirmada |
| Horários de ônibus | Sim, 5 linhas, 382 horários, válidos até 04/02/2027 | Três leituras independentes das imagens | Não | Falta a linha 02 Arco-Íris/Mãe Preta; Circular I só no sentido Volta |
| Mapa de serviços (`web/mapa.html`) | Sim, ligado à tela inicial | `mapa.test.js` com os dados reais; conferido no Chromium em 1280 e 390 px, 0 requisições externas | Não | Dos 164 serviços: 45 aparecem pelo endereço, 38 pela posição **aproximada** do CEP (vazados) e 81 só na lista, com link para pesquisar o endereço no Google Maps. Distância em linha reta, não caminho a pé. Mapa de ruas só se a usuária marcar a caixa |
| Qual CRAS atende o meu bairro? (na página do mapa) | Sim | `mapa.test.js`: os 167 bairros das listas oficiais dos 6 CRAS levam ao CRAS certo; bairro inventado não leva a nenhum; conferido no Chromium | Não | Só vale para CRAS (única categoria com lista oficial de área de atendimento). Nomes parciais pedem confirmação. Apelidos de bairro: 2 candidatos "a confirmar", nenhum em uso |
| Privacidade da busca | Sim: sem servidor próprio, sem cookies, sem localStorage (declarado no README) | Páginas verificadas no Chromium com 0 requisições externas | Não | O histórico do navegador pode guardar a visita; "Sair rápido" não apaga e diz isso |
| Entre Mulheres | Protótipo | `entre_mulheres.test.js` | Não | 0 ofertas cadastradas; canal de cadastro não definido |

## Catálogo e dados

| Capacidade | Estado | Evidência | Limite ou pendência |
|---|---|---|---|
| Catálogo de serviços | 165 registros; 147 com telefone, 152 com endereço, 48 com horário | `catalogo/servicos_manuais.csv`, cada um com fonte e data | 4 registros "não conferidos" |
| **Proteção à mulher** | **2 de 5 registros "não conferidos"** (CRAM e Patrulha); **2 sem telefone** (Patrulha e Defensoria). A DDM agora tem telefone publicado pela Prefeitura em 27/08/2025; o endereço publicado em 12/04/2017 fica com aviso para confirmação antes de ir. A Defensoria foi conferida em 11/10/2026; a página não traz telefone. | `catalogo/servicos_manuais.csv`; publicações municipais da DDM, de 12/04/2017 e 27/08/2025; `docs/documetacao/defensoria-rio-claro.pdf` | CRAM e Patrulha continuam pendentes de fontes e contatos suficientemente seguros para uso atual. A DDM não tem horário informado no cadastro. |
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
