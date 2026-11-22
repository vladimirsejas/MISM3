# Roteiro de melhoria do orientador de segurança

Este documento diz em que ponto está a detecção de sinais de perigo do orientador, o que ainda não funciona bem e o que fazer em seguida. Ele não é uma promessa de resultado: os números abaixo vêm de frases escritas por IA e pela equipe, nunca de mulheres reais.

## Como o orientador classifica

O orientador devolve um de três níveis. Nível 0 é nenhum alerta. Nível 1 é um aviso discreto, para sinais de controle, humilhação ou ameaça velada, e para pedidos de serviço de proteção, que mostram o 180. Nível 2 é o alerta completo, para risco grave ou imediato. O nível 2 vem das regras de `web/perigo.js` e do detector aprendido `web/dados/modelo_perigo.json`. O aviso de nível 1 vem das regras e, desde o classificador de aviso, também de `web/dados/modelo_aviso_n1.json`, treinado por `pipeline/treinar_n1.py`.

## Regra de segurança que não pode ser quebrada

O classificador de aviso só promove "nenhum alerta" para aviso de nível 1. Ele nunca rebaixa um resultado, nunca troca o que as regras decidiram e nunca age quando já existe algum alerta. Por isso ele não pode piorar a detecção de nível 2. Qualquer mudança futura deve manter essa regra.

## Onde estamos

Em 59 frases escritas pelo autor do projeto, que não foram usadas para treinar nem para ajustar nada, medidas uma única vez, o nível exato subiu de 36 para 41 frases. Dos 24 casos de aviso esperados, o orientador reconhecia 9 como aviso ou mais e passou a reconhecer 15 (62,5%). O nível 2 ficou igual, com 8 de 9. Houve 2 falsos alarmes em 26 frases sem perigo (7,7%), e os pedidos comuns de serviço não geraram alerta. Na validação cruzada do treino, que usa frases de desenvolvimento, a sensibilidade foi de cerca de 90%; esse número não deve ser lido como o desempenho com frases novas.

## O que ainda não funciona

Sensibilidade de aviso ainda abaixo do alvo de 75%: 9 dos 24 avisos esperados continuam sem nenhum alerta. Seis avisos saem como nível 2 em vez de nível 1, o que não é perigoso mas é impreciso. A frase "tem uma arma aqui em casa" continua sem alerta. A frase "meu time apanhou ontem no campeonato" ainda gera nível 2 por engano, e "meu celular ta sem espaco de memoria" passou a gerar aviso. Os conjuntos de frases usados no desenvolvimento são conjuntos de desenvolvimento: o acerto neles não prova que o orientador funciona com frases novas.

## Próximos passos, nesta ordem

1. Escrever frases novas de aviso e de conversa comum, com erros de digitação, e acrescentá-las a `pipeline/frases_rotuladas_n1.tsv` (colunas: nivel, grupo, frase; variantes da mesma frase recebem o mesmo grupo). Separar parte delas como teste, sem usar no treino.
2. Retreinar com `python pipeline/treinar_n1.py` e rodar a suíte de testes completa.
3. Medir em um conjunto novo, nunca usado antes, e só publicar se a sensibilidade de aviso for de pelo menos 75%, os falsos alarmes forem de no máximo 10%, os pedidos de serviço continuarem sem alerta e o nível 2 não piorar.
4. Corrigir, com regra e com exemplos de treino, os casos que ainda erram, sem ajustar o código para uma frase isolada.
5. Validar com pessoas, com protocolo ético próprio, antes de qualquer afirmação sobre uso real.

## Limites que devem constar em qualquer descrição pública

O orientador é um apoio de orientação e não faz diagnóstico nem decide sobre direitos. Não houve validação com mulheres reais. Os números vêm de frases escritas por IA e pela equipe. Em perigo imediato, a orientação é ligar 190, 180 ou 192.