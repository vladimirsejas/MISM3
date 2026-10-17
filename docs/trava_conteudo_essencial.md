# Trava do conteúdo essencial: por que o Trabalho sumia e como isso foi impedido

Escrito em 16/10/2026, a pedido do mantenedor: "toda vez que mexe o Trabalho some metade do trabalho feito; isso precisa parar".

## O que acontecia (com provas do histórico do Git)

1. **Existiam 19 branches no GitHub e a `main` era só uma delas.** O Trabalho completo **nunca foi juntado à `main`**:
   `web/jornada-ui.js` (onde mora a jornada do Trabalho) tinha **27 peças-chave e 328 linhas na `main`**, contra **54 a 56 peças e 500 a 545 linhas** nas branches `zealous-volta`, `lucid-brahmagupta` e `trusting-allen`.
2. **Cada sessão nova começa da `main`.** Quem partia dela herdava só as 27 peças. Ao abrir o site, parecia que "metade tinha sumido": na verdade, nunca estivera ali.
3. **O Trabalho estava fragmentado em quatro pedaços, em quatro branches.** Nenhuma branch tinha tudo:
   - `gracious-hopper`: os três guias oficiais gratuitos de entrevista e a dica de entrevista por vídeo;
   - `lucid-brahmagupta`: Concurso público (com os sites) e Buffet de festas;
   - `zealous-volta`: atalhos, entrevista e PAT;
   - `trusting-allen`: a restauração do Trabalho, a avó que procura trabalho e o cartão sem consentimento.
4. **Quedas por sobrescrita.** O commit `55b71f5` ("Corrige apresentação das dicas e ações do plano de Educação") derrubou `jornada-ui.js` de 432 para 339 linhas e levou peças do Trabalho junto. O próprio `f7b9b5c` se chama "**Restaura** o trabalho da área Trabalho (PR #53)": já era a segunda vez que o Trabalho precisava ser restaurado.
5. **A causa de fundo:** vários arquivos "quentes" (`web/jornada-ui.js` e `web/areas.js`) são editados por várias linhas de trabalho ao mesmo tempo, e **nada avisava quando uma peça sumia**.

## O que foi feito

### 1. As branches foram juntadas
A branch `claude/peaceful-mccarthy-xx4rts` agora contém a `main`, a `trusting-allen` (e, por ela, a `chatgpt/avo-cuidadora-correcao`), a `lucid-brahmagupta` (e, por ela, a `zealous-volta`) e o que só existia na `gracious-hopper`. Foi conferido **item por item**: nenhum título, cartão, tópico, link, atalho ou serviço de catálogo de nenhuma dessas branches ficou de fora (ver "Prova" abaixo).

### 2. A trava
- **`docs/conteudo_essencial.json`**: lista de tudo o que existe hoje, em todas as áreas: seções, cartões, títulos de tópicos, links, atalhos do topo e âncoras de `web/areas.js`; títulos, âncoras e links da jornada em `web/jornada-ui.js`; e os serviços do catálogo.
- **`web/tests/conteudo_essencial.test.js`**: confere que cada item da lista continua existindo. O GitHub o roda em todo Pull Request (`.github/workflows/testes.yml` roda todos os `web/tests/*.test.js`).
- **Se algo sumir, o teste reprova e diz exatamente o quê e onde.**

Prova de que funciona: ao colocar de volta a versão antiga de `jornada-ui.js` da `main` (o acidente real), o teste reprovou com **116 itens sumidos**, entre eles "Buffet de festas", "Concurso público", "Guias oficiais gratuitos para se preparar" e "Cabelo e unhas sem gastar". Ao renomear um cartão de Assistência Social, ele apontou o cartão e os 5 tópicos.

## Como usar

```
node web/tests/conteudo_essencial.test.js                      # conferir (o CI faz isso)
node web/tests/conteudo_essencial.test.js --atualizar          # acrescentar à lista o que é NOVO (nunca tira nada)
node web/tests/conteudo_essencial.test.js --aceitar-remocoes   # tirar da lista o que sumiu: SÓ se a remoção for de propósito
```

**Regras para qualquer pessoa ou sessão que mexa no site:**
1. **Comece sempre da `main` atualizada**, depois que os Pull Requests anteriores forem aceitos. Não comece de uma branch antiga.
2. **Antes de juntar uma branch a outra, rode os testes.** Se o `conteudo_essencial` reprovar, **restaure o trecho**: não use `--aceitar-remocoes` para "fazer o teste passar".
3. **Ao criar conteúdo novo, rode `--atualizar`** e inclua o `docs/conteudo_essencial.json` no mesmo commit: assim o conteúdo novo também fica trancado.
4. **Ao mudar de propósito o título de um cartão**, rode `--aceitar-remocoes` e depois `--atualizar`, e escreva no commit por que mudou.
5. **Não aceite um Pull Request com teste vermelho.**

## O que falta e só o dono do repositório pode fazer

- **Juntar este trabalho à `main`.** Enquanto a `main` estiver defasada, qualquer sessão nova vai partir de uma base sem o Trabalho: a trava protege o que estiver na branch, mas a `main` é a base de todas as sessões.
- **Proteger a `main` no GitHub** (Settings → Branches → Add branch protection rule → `main`): marcar "Require a pull request before merging" e "Require status checks to pass before merging" (o fluxo `testes`). Assim ninguém consegue juntar uma branch com o teste vermelho.
- **Arquivar as branches antigas** que já foram absorvidas, para não haver 19 linhas de trabalho concorrentes.

## Prova da conferência (16/10/2026)

Para cada branch, gerou-se a lista de itens com o mesmo teste e comparou-se com o resultado final:

| Branch | Itens | Faltam no resultado |
|---|---|---|
| `main` | 383 | 0 |
| `trusting-allen` (inclui a branch do ChatGPT) | 493 | 0 |
| `lucid-brahmagupta` | 450 | 0 |
| `zealous-volta` | 433 | 0 |
| `fix/curriculo-trabalho-links-gratuitos` | 401 | 0 |
| `gracious-hopper` | 360 | 6, todos títulos antigos de roupa, cabelo, unhas e links: o conteúdo existe no final em versão mais completa, e os 3 guias oficiais e a dica de vídeo foram trazidos |
| `chatgpt/cartao-sem-consentimento`, `claude/awesome-darwin`, `claude/fervent-ramanujan`, `claude/magical-cannon`, `imagens-brasao` | 339 a 383 | 0 |
| `avaliacao/metricas-funcionalidades`, `ia/indice-cobertura-automatico`, `ia/melhoria-vocabulario-filhos`, `fix/ddm-endereco-telefone-oficiais`, `fix/fonte-oficial-cram-rio-claro` | 328 a 340 | 1 a 2: o serviço `man-cram` e o cartão de Saúde "Apoio fora da rede pública", que só existem nessas branches antigas e que a `main` retirou de propósito (o CRAM virou "dica" por não ter fonte atual) |

## Limites da trava (o que ela NÃO garante)

- Ela confere **a existência** dos itens (títulos, cartões, links, tópicos). Se alguém trocar o **texto dentro** de um tópico por outro pior, ela não percebe.
- Ela só protege o que **já está na lista**. Conteúdo novo só entra na trava depois de `--atualizar`.
- Ela não substitui juntar tudo à `main`: sem isso, o problema volta a aparecer toda vez que uma sessão nova partir da base antiga.
