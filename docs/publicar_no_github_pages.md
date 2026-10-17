# Publicar o site no GitHub Pages

O repositório `vladimirsejas/MISM3` é **público**, então o GitHub Pages é gratuito. O site ficará em **https://vladimirsejas.github.io/MISM3/** e abre em qualquer celular, sem o notebook ligado. O arquivo `.github/workflows/publicar-site.yml` já faz a publicação; falta só **ligar o Pages** (isso só o dono do repositório pode fazer).

## Passo a passo (funciona no navegador do celular, pedindo "site para computador")
1. No GitHub, abra o repositório e vá em **Settings > Pages**.
2. Em **Build and deployment > Source**, escolha **GitHub Actions**.
3. Vá em **Settings > Environments > github-pages > Deployment branches and tags** e **adicione o ramo `claude/maes-solo-educacao`** (por padrão só o `main` pode publicar). Se você juntar o trabalho ao `main`, este passo não é necessário.
4. Abra a aba **Actions**, escolha **Publicar site** e toque em **Run workflow** (ou faça um novo envio para o ramo: o fluxo roda sozinho).
5. Espere uns 2 minutos. O endereço aparece no resumo do fluxo e em **Settings > Pages**.

## O que vai e o que NÃO vai para a internet
- **Vai:** a pasta `web/` (as páginas, o catálogo verificado, os horários de ônibus, o modelo de IA e o questionário).
- **Não vai:** os testes e o **protótipo do painel da Secretaria com dados de teste** (`painel-secretaria.html`, `painel.js`, `painel-ui.js`, `dados/painel_teste.json`). O painel real nunca deve ser público: ele precisa de login num servidor da Prefeitura.
- **Não existe no site publicado:** `servicos.json` e `cep_indice.json` (ficam só no computador do autor e não estão no repositório). Sem eles, a **busca por CEP não é oferecida** e o cadastro de unidades de saúde do CNES não aparece. O catálogo verificado à mão funciona normalmente.

## Antes de divulgar o endereço
- O site se declara **estudo acadêmico, não oficial da Prefeitura** (aviso no rodapé). Mantenha assim.
- Revise o que ficará público: o cartão do **Peniel** na área Saúde está marcado como "não confirmado por ligação"; o **questionário** diz que a coleta está desligada; a página **Entre Mulheres** diz que o canal de cadastro ainda não foi definido.
- O código e os documentos do repositório já são públicos, inclusive este.

## Como atualizar
Cada envio para os ramos `main` ou `claude/maes-solo-educacao` que mude algo em `web/` republica o site sozinho. Para tirar o site do ar: **Settings > Pages** e desligue a publicação.
