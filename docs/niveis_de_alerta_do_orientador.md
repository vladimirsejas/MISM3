# Níveis de alerta do orientador (segurança)

Este documento explica, em linguagem simples, o que o orientador faz quando a pessoa escreve uma situação de risco, como a camada de **controle coercitivo** funciona e o que os números medidos significam. O código está em `web/perigo.js`; os testes, em `web/tests/perigo*.test.js`.

## O que são os níveis 0, 1 e 2

| Nível | O que aparece | Quando |
|---|---|---|
| **0** | Nenhum alerta. A lista de serviços aparece normalmente. | A frase não mostra risco. |
| **1** | Um aviso de uma linha, com os telefones 190 (Polícia) e 180 (Central de Atendimento à Mulher), sem fixar serviços no topo. | Há sinal de controle, perseguição ou humilhação, mas sem indicador grave. |
| **2** | Alerta completo, com telefones e serviços de proteção fixados no topo. | Há indicador grave (ver abaixo) ou uma regra de nível 2 foi acionada. |

O orientador **não faz diagnóstico nem previsão de risco**: só mostra o caminho de ajuda mais próximo do que foi escrito. Nenhum texto digitado é enviado ou gravado.

## Camada de controle coercitivo (nível 1)

Controle coercitivo e violência psicológica costumam aparecer sem palavra de violência física. A camada procura uma **combinação**, nunca uma palavra solta:

1. **Comportamento de controle**: celular, senha e mensagens; roupa e redes sociais; isolamento e proibição de sair, falar ou ver a família; proibição de trabalhar ou estudar; controle do dinheiro, salário ou cartão; humilhação recorrente; vigilância constante; ameaça de deixar sem casa, dinheiro ou filhos; fazer a pessoa duvidar da própria memória ou sanidade; gritos recorrentes.
2. **Imposição, restrição, punição ou recorrência**: "não deixa", "proibiu", "exige", "manda", "toda hora", "todo dia", "de cinco em cinco minutos", "se eu fizer X, ele faz Y".
3. **Relação**: marido, namorado, noivo, ex, companheiro (ou "ele/ela"), na primeira pessoa ou em terceira pessoa (irmã, vizinha, amiga, filha, tia, prima…).

**Palavra isolada nunca alerta**: "marido", "ciúme", "celular", "senha", "dinheiro", "roupa", "louca", "briga" sozinhas não geram aviso.

O que **suprime** o aviso: acordo ou consentimento ("combinamos", "decidimos", "eu gostei", "tudo bem"), cuidado carinhoso ("me avisa quando chegar"), briga isolada, passado resolvido, notícia, novela e relato de terceiro distante. Pedir um dado sem imposição (a senha do Wi-Fi, o número de telefone), preferência ("ele prefere ficar em casa") e emoção isolada ("ficou com ciúme") também não alertam.

O erro de digitação é tolerado de forma conservadora: uma edição em palavras de seis letras ou mais, e duas só se forem teclas vizinhas. Palavras válidas parecidas com termos de risco não são trocadas.

## Quando o nível 2 é mantido

O nível 2 continua sempre que houver:

- uma **regra de nível 2** (por exemplo: bater, espancar, ameaça de morte, medida protetiva descumprida, impedir de sair, trancar em casa, violência sexual);
- um **indicador grave** na frase: matar, morte, arma ou faca, agressão física, estupro ou sexo forçado, cárcere, impedir de pedir socorro, ameaça explícita, destruição de bens como intimidação, medo de morrer;
- **controle em três ou mais frentes ao mesmo tempo** (por exemplo, dinheiro retido, proibição de trabalhar e celular tirado).

Se a camada de controle reconhece a frase e o nível 2 viria **apenas do detector aprendido** (e a frase não tem nenhum indicador grave), o resultado fica em **nível 1**. Se o detector aprendido nunca deveria alertar sozinho (frase curta, com acordo, sem controle, violência nem imposição), ele é vetado. Na dúvida entre alertar de menos e de mais, o projeto prefere alertar: o veto só vale sem nenhum sinal de risco.

## Como rodar os testes

```powershell
foreach ($f in Get-ChildItem web\tests\*.test.js) { node $f.FullName }
$env:PYTHONPATH = "pipeline"; python -m pytest pipeline/tests
```

Os testes de segurança estão em `web/tests/perigo.test.js`, `perigo_generalizacao.test.js`, `perigo_controle_coercitivo.test.js` e `perigo_controle_indireto.test.js`. No notebook de desenvolvimento, `dashboard.test.js` (um PDF fora do repositório) e dois testes da matriz de direitos de uso (arquivos locais não rastreados) falham por motivos do ambiente, não do código.

## Números medidos

Medição em **128 frases novas** (escritas à parte, antes do ajuste desta camada), com a camada anterior:

| Medida | Resultado |
|---|---|
| Nível exato | 91 de 128 |
| Esperadas nível 1 que deram pelo menos nível 1 | 28 de 51 (55%) |
| Esperadas nível 1 que deram nível 2 | 9 de 51 |
| Esperadas nível 0 que deram nível 1 ou 2 | 5 de 75 |

Depois do ajuste, nessas mesmas 128 frases: nível exato 128 de 128; esperadas nível 1 com pelo menos nível 1, 51 de 51; nível 1 que deram nível 2, 0; nível 0 com alerta, 0 de 75. **Esses números são de frases usadas no ajuste: não estimam o acerto em frases novas.** Nas 71, 90 e 427 frases dos conjuntos já existentes, nenhuma frase mudou de nível.

## Limitações

- Não houve validação com mulheres reais. As frases de teste foram escritas pelo autor do projeto e por IA.
- As listas de supressão (acordo, carinho, elogio, rotina, limite de dez palavras) são **heurísticas** e podem esconder um caso real escrito de forma incomum.
- O detector aprendido tem viés: dá alerta a frases cotidianas com "marido". Os vetos corrigem os casos conhecidos, não todos.
- Controle dito de forma muito indireta, sem comportamento reconhecível, continua sem aviso.
- A medição independente do que esta camada faz deve ser feita à parte, com frases que não foram usadas no ajuste.
