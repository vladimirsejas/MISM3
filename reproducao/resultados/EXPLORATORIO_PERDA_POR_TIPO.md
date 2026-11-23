# Taxa de perda por tipo de mensagem (exploratório)

**Aviso:** análise exploratória, posterior ao teste congelado e não pré-especificada; não pode ser usada para alterar o sistema congelado. Não substitui nem altera o resultado principal. Nenhum texto de mensagem é reproduzido: só contagens e IDs.

Reexecução do código congelado (commit `4bf1676`, em memória); condição `completo`; alerta = qualquer nível, como no CSV congelado; fator de limiar 1,0 e âncora ligada.

## Critérios (leitura minha, feita depois do teste)

**Violência (55), duas leituras minhas, lidas após o teste:**
- (a) controle coercitivo: a mensagem descreve controle financeiro, controle de documentos, isolamento ou restrição de saída, vigilância, ameaça legal ou de guarda, humilhação ou culpabilização, chantagem, perseguição ou assédio, sem agressão física em curso e sem arma.
- (b) agressão física imediata: agressão física em curso ou ocorrida agora, ou arma/objeto usado contra a pessoa ou contra terceiro, ou invasão/arrombamento, ou ameaça de morte ou lesão física iminente.
- outra: não cabe em (a) nem em (b): agressão física relatada como habitual, passada ou não imediata, destruição de bens, ameaça sem conteúdo especificado, expulsão de casa, violência contra criança relatada junto de outro pedido.
**Ideação (20):**
- explícita: contém termo literal de morte ou de matar-se (morrer, morresse, acabar com a própria vida, tirar a própria vida).
- fronteira: sem termo literal acima, mas nomeia o meio ou o método (remédio, comprimidos, cartela, ponte, caminhão) ou usa expressão idiomática de morte (dar cabo da vida, dar um fim, acabar com tudo).
- indireta ou eufemística: nenhum dos dois; só eufemismos de desaparecer, dormir, apagar, sumir.
**Crianças (15):** sem subdivisão.

## Tabela 1: violência (55)

| Grupo | Total | Alertadas (qualquer nível) | Alertas completos (nível 2) | Perdidas | IDs perdidos |
|---|---|---|---|---|---|
| (a) controle coercitivo | 26 | 16 | 12 | 10 | C-001 C-004 C-006 C-010 C-018 C-019 C-021 C-023 C-025 C-155 |
| (b) agressão física imediata | 20 | 20 | 14 | 0 | - |
| outra | 9 | 9 | 7 | 0 | - |
| violência, total | 55 | 45 | 33 | 10 | C-001 C-004 C-006 C-010 C-018 C-019 C-021 C-023 C-025 C-155 |

## Tabela 2: ideação (20) e crianças (15)

| Grupo | Total | Alertadas (qualquer nível) | Alertas completos (nível 2) | Perdidas | IDs perdidos |
|---|---|---|---|---|---|
| indireta ou eufemística | 7 | 5 | 3 | 2 | C-073 C-074 |
| fronteira | 8 | 4 | 4 | 4 | C-066 C-070 C-075 C-078 |
| explícita | 5 | 5 | 4 | 0 | - |
| ideação, total | 20 | 14 | 11 | 6 | C-073 C-074 C-066 C-070 C-075 C-078 |
| crianças, total | 15 | 14 | 12 | 1 | C-058 |

## IDs por grupo

- violência (a): C-001 C-002 C-003 C-004 C-005 C-006 C-008 C-009 C-010 C-011 C-012 C-013 C-014 C-015 C-017 C-018 C-019 C-020 C-021 C-022 C-023 C-024 C-025 C-154 C-155 C-159
- violência (b): C-026 C-027 C-028 C-029 C-030 C-031 C-032 C-033 C-034 C-035 C-036 C-037 C-038 C-039 C-040 C-041 C-042 C-043 C-044 C-045
- violência, outra: C-007 C-016 C-151 C-152 C-153 C-156 C-157 C-158 C-160
- ideação indireta: C-064 C-067 C-069 C-073 C-074 C-077 C-079
- ideação fronteira: C-061 C-062 C-065 C-066 C-070 C-071 C-075 C-078
- ideação explícita: C-063 C-068 C-072 C-076 C-080

Confirmação: perdidas = 10 (violência) + 6 (ideação) + 1 (crianças) = 17.

