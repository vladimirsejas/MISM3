# Roteiro para conferir os contatos de proteção à mulher

Para fazer quando você tiver uma noite e um telefone. **Nada aqui exige conhecimento técnico**: é reunir a fonte oficial de cada serviço e me entregar; eu atualizo o catálogo e os testes. Estado de partida medido em 11/10/2026.

## Por que isso vem antes de tudo

A jornada de violência e proteção só será escrita com contatos confirmados. Hoje, de cinco registros de proteção, **três estão "não conferidos"** e dois não têm telefone nem endereço. Um telefone errado aqui é pior do que nenhum, por isso o site já mostra "ligue antes" nesses três.

## O que o catálogo diz hoje

| Serviço | Telefone | Endereço | Horário | Situação | Onde olhar (já está no catálogo) |
|---|---|---|---|---|---|
| **CRAM** (Centro de Referência de Atendimento à Mulher) | (19) 3532-4014 / (19) 3525-1366 | Rua 17, nº 30 (anexo ao Centro Social Urbano "Mitiko Nevoeiro") | 8h às 17h | não conferido; a fonte é uma página da Prefeitura **sem data visível** | `https://rioclaro.sp.gov.br/desenvolvimento-social/casa-aberta-no-centro-de-referencia-de-atendimento-a-mulher/` |
| **Delegacia de Defesa da Mulher (DDM)** | **nenhum** | **nenhum** | nenhum | não conferido; as fontes consultadas **divergem** | `https://www.spportodas.sp.gov.br/sp-por-todas/seguranca_mulher/delegacias_da_mulher` e a página oficial da Polícia Civil / SSP-SP |
| **Patrulha Maria da Penha** (Guarda Civil Municipal) | **nenhum** | **nenhum** | nenhum | não conferido; a página não traz telefone nem como acionar | `https://seguranca.rioclaro.sp.gov.br/patrulha-maria-da-penha/` |
| Defensoria Pública | nenhum (agendamento pelo portal) | Rua 1, 659 | pelo portal | **conferida em 11/10/2026** | `docs/documetacao/defensoria-rio-claro.pdf` |

## O que fazer, serviço por serviço

1. **Abrir a página oficial** da coluna "Onde olhar" e **imprimir em PDF** (Ctrl + P, destino "Salvar como PDF"). Foi assim que se conferiram o CRAS e a Defensoria.
2. **Salvar em `docs/documetacao/`** com estes nomes: `cram-rio-claro.pdf`, `ddm-rio-claro.pdf`, `patrulha-maria-da-penha.pdf`.
3. Se a página **não traz telefone, endereço ou horário**, ligue para o **número principal do órgão** (Secretaria da Mulher, Prefeitura ou Guarda Civil Municipal) e pergunte o que falta (veja "Como ligar").
4. **Anote** para cada informação conferida: o que foi confirmado, **a data**, e **por qual meio** (página oficial ou telefone, e para qual setor). Não anote nome de pessoa.
5. Me diga só: "os PDFs estão em `docs/documetacao/`" e as anotações. Eu atualizo o catálogo (`conferido`, fonte e data) e os testes.

## Como ligar (sem criar risco para ninguém)

- **Nunca ligue para 190, 192, 193, 180 ou 100 para "testar".** Eles são serviços de emergência e de denúncia.
- Apresente-se como **estudante da Fatec Rio Claro** fazendo um projeto acadêmico que reúne informações públicas, e peça só informação institucional: endereço, telefone de atendimento, horário e como a mulher aciona o serviço.
- **Não peça nem aceite relato de caso de ninguém.** Se a pessoa começar a contar, agradeça e volte à pergunta.
- Peça, se possível, que a informação seja confirmada **também por e-mail ou por página oficial**, para ficar uma fonte escrita.

## Quando duas fontes oficiais discordam (a DDM é o caso)

1. Vale a que **tem data** e é do **próprio órgão** (Polícia Civil / SSP-SP para a DDM; Guarda Civil Municipal para a Patrulha).
2. Se ainda houver dúvida, **ligue** para o número principal e peça confirmação.
3. Se não for possível resolver, o campo **continua vazio e "não conferido"**, com as duas versões anotadas no `aviso`. O site seguirá dizendo "ligue antes". **Nunca** se escolhe um número "pelo que parece mais certo".

## O que eu faço depois que você entregar

- Atualizo `catalogo/servicos_manuais.csv` (telefone, endereço, horário, `fonte`, `fonte_url`, `verificado_em`, `conferido`) **só com o que está nos PDFs ou nas suas anotações**.
- Regenero `web/dados/catalogo_manual.json`, rodo os testes e mostro o antes e o depois.
- Com os contatos confirmados, escrevo a **jornada de violência e proteção** (mínima, só com fonte): emergência primeiro, orientação e acolhimento depois, e o "se não der certo" de cada canal.

## Critério de pronto

Cada um dos três está **confirmado com fonte arquivada** ou **explicitamente pendente com o motivo escrito**. Os dois resultados são aceitáveis; o que não é aceitável é um telefone sem origem.
