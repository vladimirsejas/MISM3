# Avaliação do Meu Plano

## O que está sendo medido

`web/plano.js` aplica uma ordem explícita e explicável; não aprende essa ordem a partir de dados. O script `avaliacao/avaliar_plano.js` verifica se o módulo respeita a ordem configurada em cinco cenários combinados, incluindo entradas invertidas.

## Resultado

GitHub Actions executou **5/5 cenários (100%)** na avaliação de consistência: violência antes de estudo; saúde, moradia e trabalho; apoio familiar e filhos; dívidas, trabalho e estudo; e todas as áreas recebidas em ordem inversa.

## Interpretação correta

Esse 100% significa que a implementação respeitou a regra fixa nesses cenários. **Não significa** que a prioridade social ou clínica da regra tenha sido validada com profissionais ou usuárias. Essa avaliação normativa precisa ser feita separadamente, sobretudo para casos em que necessidades concorrentes mudam a urgência.

O script roda com `node avaliacao/avaliar_plano.js` e está incluído no workflow de CI.
