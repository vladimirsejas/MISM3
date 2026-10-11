# Questionário do Observatório da Mulher Rio-Clarense

Instrumento implementado em `web/questionario.js` (lógica) e `web/questionario-ui.js` (tela), na rota `#questionario`. Escrito em 11/10/2026.

## O que é
Um questionário de **alternativas** (nenhum texto livre), uma pergunta por vez, com **dois objetivos**: (1) devolver à mulher caminhos e serviços reais do catálogo verificado; (2) produzir dados **sem identificação** para a Secretaria Municipal da Mulher conhecer as mulheres de Rio Claro.

## Estado atual (leia primeiro)
- **A coleta está DESLIGADA** (`web/dados/coleta.json`: `ativa: false`). Hoje **nada é enviado a lugar nenhum**; as respostas ficam só na memória da página. A tela diz isso à participante.
- Para ligar: termo de cooperação com a Prefeitura, controlador e encarregado de dados definidos, texto de consentimento aprovado pelo jurídico e um servidor da Prefeitura (ver "Contrato do servidor").
- As **pontuações são regras de negócio provisórias**, não uma escala validada. Os pesos só devem ser fixados depois de testar o questionário com mulheres de Rio Claro e com a equipe da Secretaria.

## O espaço "Fale de você" (opcional)
Antes da autorização há um campo de texto livre, diferente das perguntas de marcar, para a mulher contar a vida do jeito dela. O desenho protege as participantes:
- **O texto nunca é enviado.** O aparelho lê o texto com o modelo de IA que já roda no navegador (`web/ia.js`) e identifica só **assuntos** (trabalho, saúde, moradia, filhos, estudo, dívidas, apoio social, separação). Se ela autorizar no fim e a coleta estiver ativa, **só esses assuntos** (`temas_do_texto`) acompanham o registro.
- **Violência nunca é registrada a partir de um texto.** Se ela escrever sobre violência, o alerta com 190 e 180 aparece **só para ela**, no aparelho. Esse assunto fica de fora do registro de propósito (teste).
- Avisa quando o texto parece ter CPF, RG, telefone, e-mail ou CEP, e pede para não escrever nome nem endereço.
- No painel da Secretaria, aparece como "O que as mulheres contaram sobre si", só com a regra dos 10.
- Se a Secretaria quiser receber o **texto**, é uma decisão **separada**, com o jurídico e o encarregado de dados (risco de nome, telefone e relatos de violência no texto), e não está implementada.

## As 20 perguntas
Idade; referência de onde mora; grupos com que se identifica; situação de trabalho; obstáculos para trabalhar; apoio desejado para a renda; vontade de estudar; obstáculos para estudar; responsabilidade de cuidado; efeito do cuidado na rotina; apoio desejado para o cuidado; como se desloca; frequência com que o transporte impede algo; acesso à informação; assuntos de interesse; se sabe onde buscar ajuda; área prioritária; resultado mais importante em 6 meses; autorização final. Três delas só aparecem quando fazem diferença (obstáculos de estudo, rotina de cuidado e apoio ao cuidado). Toda pergunta tem saída "prefiro não responder".

**Localização:** em vez de "zona norte/sul", que a população não reconhece, usa **pontos de referência** (CVZ, Mãe Preta, Bom Sucesso, região central, outro bairro, área rural, não sei). **Esses nomes são um rascunho do autor e precisam ser validados com moradoras.** Um mapa para tocar na região é o ideal e depende de uma base territorial confiável.

## Pontuação (0 a 100 por tema)
Cada tema soma pontos de duas perguntas e divide pelo máximo possível das que foram respondidas.

| Tema | Perguntas | O que indica |
|---|---|---|
| Trabalho e renda | situação de trabalho (0 a 3) + obstáculos (0 a 3, pela quantidade marcada) | quanto trabalho e renda pesam |
| Estudo e cursos | vontade de estudar (0 ou 2) + obstáculos (0 a 3) | vontade e obstáculos |
| Cuidado com a família | responsabilidade (0 a 2) + efeito na rotina (0 a 3) | peso do cuidado |
| Transporte | como se desloca (0 a 3) + frequência (0 a 4) | dificuldade de chegar |
| Informação e acesso | acha informação (0 a 3) + sabe onde procurar (0 a 3) | falta de orientação |

Regras:
- **Resposta em branco, "prefiro não informar" e "não se aplica" não contam**: o tema fica "sem dados", **nunca zero**. O índice informa com quantas perguntas foi calculado.
- As perguntas de **apoio desejado, assuntos de interesse e prioridades** são **marcadores**, não pontuam: servem para ordenar os caminhos, como a escolha da própria mulher.
- **Não existe pontuação de risco de violência, de saúde mental nem de capacidade de cuidar.** Proteção só aparece, em primeiro lugar, quando **a própria mulher** a marca como prioridade, e **nunca é deduzida** das outras respostas (há teste).

## O retorno individual
Até 3 caminhos: primeiro o que ela marcou como prioridade, depois os temas de maior pontuação (a partir de 34). Cada caminho traz o motivo (as próprias palavras dela), o link para a área e até 2 serviços do catálogo verificado, com telefone e data de conferência. Mostra também as barras de pontuação, com o aviso de que não é diagnóstico nem decide direitos. O retorno aparece **sempre**; a autorização só decide se as respostas podem ir à Secretaria.

## Diferenças em relação à proposta recebida (e por quê)
1. **Menores de 18 anos nunca geram dados enviados.** A LGPD (art. 14) exige consentimento específico dos responsáveis para dados de crianças e adolescentes. Elas recebem a orientação, e a pergunta de autorização nem aparece.
2. **Autorização no fim, separada da orientação.** A pergunta "quer receber orientação?" foi removida: quem responde sempre recebe.
3. **Regiões por pontos de referência**, como o autor pediu.
4. **Locais pequenos não são mostrados:** a Secretaria só deve ver um recorte (por exemplo, região e faixa de idade) com **pelo menos 10 respostas**, para ninguém ser identificada.

## O que seria enviado (registro)
Só **códigos das alternativas**, as **pontuações** e o **mês**. Sem nome, sem texto livre, sem data e hora exatas, sem identificador. A tela mostra o registro exato ("Ver exatamente o que seria enviado").

```json
{ "instrumento": "observatorio-questionario", "versao": 2, "periodo": "2026-10",
  "respostas": { "idade": "25_34", "regiao": "cvz", "trabalho": "procurando", "obstaculos_trabalho": ["creche","transporte"] },
  "temas_do_texto": ["filhos","emprego_curso"],
  "indices": { "economica": 100, "educacao": 80, "cuidados": 100, "mobilidade": 57, "rede": 83 } }
```

## Contrato do servidor (para a equipe da Prefeitura)
- `POST` em HTTPS, corpo JSON como acima, **sem cookies** (`credentials: omit`) e sem referência (`no-referrer`).
- **Responder 200/204 e não guardar IP, cabeçalhos nem horário exato.** O anonimato absoluto depende do servidor: se ele registrar IP em log, a resposta deixa de ser anônima. Isso precisa ser verificado antes de prometer anonimato.
- Validar o corpo contra as alternativas de `web/questionario.js` e **rejeitar** qualquer campo fora delas.
- Painel da Secretaria: **autenticado**, só **resultados agregados**, com a regra dos 10 respostas por recorte e com a **origem, o período e a cobertura** dos dados à vista. Respostas voluntárias **não são estatística representativa** de todas as mulheres de Rio Claro.

## Antes de colocar no ar
Validar com a Secretaria, com o encarregado de dados e com um grupo diverso de mulheres (inclusive idosas, com baixa escolaridade e com deficiência): se as perguntas são compreendidas, se a ordem faz sentido, e se cada pontuação melhora mesmo as recomendações. Só depois fixar pesos e ligar a coleta.
