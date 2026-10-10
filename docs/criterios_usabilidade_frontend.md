# Critérios de usabilidade do frontend do MISM3

## Objetivo

Tomar decisões de interface por critérios verificáveis de acessibilidade e usabilidade, e não apenas por gosto visual. O MISM3 atende pessoas que podem estar com pressa, inseguras, usando celular ou procurando serviços sensíveis.

## Critérios aplicados

- **Alvos de interação:** botões principais com pelo menos 44 CSS px de altura como referência de projeto. A WCAG 2.2 nível AA define 24 × 24 CSS px como mínimo com exceções; 44 × 44 px é o critério aprimorado AAA e uma meta prática mais confortável para controles importantes.
- **Foco visível:** quem navega com teclado precisa conseguir identificar qual controle está selecionado.
- **Carga cognitiva:** manter categorias nomeadas de forma direta, ações previsíveis e explicações curtas. Não obrigar a pessoa a memorizar instruções entre telas.
- **Reconhecimento em vez de memorização:** oferecer portas por necessidade e exemplos no campo de busca, sem exigir que a pessoa conheça nomes técnicos de serviços.
- **Prevenção de erros:** espaçar controles, tornar ações principais fáceis de localizar e dar feedback quando a busca não encontra uma categoria ou CEP.
- **Responsividade:** organizar os controles em coluna no celular quando uma linha ficaria apertada.
- **Movimento reduzido:** respeitar a preferência do sistema por movimento reduzido.
- **Privacidade compreensível:** explicar perto da interação o que fica no aparelho e não prometer invisibilidade total, pois o navegador pode guardar histórico.

## O que não afirmar sem teste

Não existe uma cor, formato de botão ou composição visual que agrade universalmente a todas as pessoas. Contraste, tamanho, espaçamento e foco podem ser avaliados tecnicamente; preferência estética e facilidade real precisam de teste com usuários representativos.

Antes de declarar uma solução como melhor, testar tarefas concretas: encontrar um serviço, procurar pelo CEP, voltar para as categorias e localizar ajuda urgente. Registrar sucesso, erros, tempo e comentários sem coletar histórias pessoais ou dados sensíveis.

## Fontes

- W3C, WCAG 2.2 — Target Size (Minimum), critério 2.5.8: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum
- W3C, WCAG 2.2 — Target Size (Enhanced), critério 2.5.5: https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced
- W3C, WCAG 2.2: https://www.w3.org/TR/WCAG22/

## Estado

Esta branch adiciona regras CSS iniciais para foco visível, controles de toque, campos de entrada, adaptação móvel e preferência por movimento reduzido. Isso é uma melhoria de implementação, não uma certificação de conformidade nem substitui testes com pessoas.
