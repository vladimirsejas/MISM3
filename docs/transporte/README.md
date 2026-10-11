# Horários de ônibus de Rio Claro

**Fonte:** [SOU Transportes — Rio Claro](https://soutransportes.com.br/rio-claro/linhas-e-horarios/). Os PDFs desta pasta são **páginas impressas do site da SOU em 09/10/2026**. Cada página diz "Horários válidos até: 04/02/2027".

## Como os horários chegaram ao site

Os PDFs são **impressões de imagem**, sem texto (a extração automática só achava cabeçalhos de impressão). Por isso os horários foram **lidos das imagens** e conferidos por **três leituras independentes**: leitura visual, OCR a 220 dpi e OCR a 300 dpi. Resultado: **382 horários, todos iguais nas três leituras**.

- Fonte de verdade, editável: [`catalogo/horarios_onibus.txt`](../../catalogo/horarios_onibus.txt) (um quadro por linha, com comentários explicando o formato).
- Gerador e validador: `python pipeline/horarios_onibus.py` grava `web/dados/horarios_onibus.json`. Ele **recusa** horário inválido, fora de ordem ou repetido, e variante sem trajeto na legenda. `--verificar` confere se o JSON versionado está igual ao que o `.txt` gera.
- Interface: área **Transporte** (`#transporte`), por atalho "Horários de ônibus" na tela inicial. Mostra as próximas saídas de hoje (pelo relógio do aparelho), os horários por tipo de dia e o trajeto de cada variante.

## Como ler uma página da SOU

Cada página é uma **linha** (número e nome) e um **sentido** ("Local de partida: Ida" ou "Volta"). Há quadros de **Dias úteis** (segunda a sexta), **Sábados** e **Domingos**; o mesmo dia pode ter **vários quadros**, um por **variante de trajeto**. O número pequeno acima de cada horário (1, 2, 3...) remete à "Legenda de viagens" (por exemplo, "1 - Bela Vista/São Miguel-Centro"). A SOU não traz feriados nessas páginas.

## O que cada PDF contém (pelo conteúdo, não pelo nome do arquivo)

Os nomes dos arquivos **não correspondem** ao conteúdo em vários casos:

| Arquivo | Conteúdo real |
|---|---|
| `belavista2.pdf` | Linha 01 Bela Vista, **Ida** |
| `belavista1.pdf` | Linha 01 Bela Vista, **Volta** |
| `cervezaoida.pdf` | Linha 06 Cervezão, Ida |
| `cervezaovolta.pdf` | Linha 06 Cervezão, Volta |
| `circular1ida.pdf` | Linha 07 Circular I, **Volta** (cópia exata de `circular1volta.pdf`) |
| `circular1volta.pdf` | Linha 07 Circular I, Volta |
| `circular2ida.pdf` | Linha 08 Circular 2, Ida |
| `circular2volta.pdf` | Linha 08 Circular 2, Volta |
| `paimeirasida.pdf` | Linha 09 Paineiras, Ida |
| `arcoirismaepretaida.pdf` | Linha 09 Paineiras, **Ida** (cópia exata de `paimeirasida.pdf`; **não** é a Arco-Íris/Mãe Preta) |
| `paineirasvolta.pdf` | Linha 09 Paineiras, Volta |

## O que ainda falta (não inventar)

- **Linha 02 Arco-Íris/Mãe Preta:** existe no site da SOU (foto da lista conferida pelo mantenedor em 11/10/2026: o site tem 6 linhas, 01, 02, 06, 07, 08 e 09, e a lista termina na 09). Ainda **falta cadastrar os horários dela**: baixar a página no site da SOU, ida e volta.
- Os horários de ida e volta dos PDFs recebidos estão certos; só os **nomes dos arquivos** estavam trocados (tabela acima). A Circular I está cadastrada só no sentido Volta.
- Se a SOU publicar outra linha ou outro sentido, baixar a página, acrescentar ao `.txt` e rodar `python pipeline/horarios_onibus.py`.
- Feriados: não constam nas páginas recebidas.
- Os horários **vencem em 04/02/2027**: o site avisa quando a data passa. Quando a SOU publicar novos horários, baixar de novo, atualizar o `.txt` e rodar `python pipeline/horarios_onibus.py`.
