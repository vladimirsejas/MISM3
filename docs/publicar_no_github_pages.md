# Publicar o site no GitHub Pages

O repositório `vladimirsejas/MISM3` é **público**, então o GitHub Pages é gratuito. O site ficará em **https://vladimirsejas.github.io/MISM3/** e abre em qualquer celular, sem o notebook ligado. O arquivo `.github/workflows/publicar-site.yml` já faz a publicação; falta só **ligar o Pages** (isso só o dono do repositório pode fazer).

## Passo a passo (funciona no navegador do celular, pedindo "site para computador")
1. No GitHub, abra o repositório e vá em **Settings > Pages**.
2. Em **Build and deployment > Source**, escolha **GitHub Actions**.
3. Vá em **Settings > Environments > github-pages > Deployment branches and tags** e **adicione o ramo `claude/maes-solo-educacao`** (por padrão só o `main` pode publicar). Se você juntar o trabalho ao `main`, este passo não é necessário.
4. Abra a aba **Actions**, escolha **Publicar site** e toque em **Run workflow** (ou faça um novo envio para o ramo: o fluxo roda sozinho).
5. Espere uns 2 minutos. O endereço aparece no resumo do fluxo e em **Settings > Pages**.

## O que vai e o que NÃO vai para a internet
- **Vai:** a pasta `web/` inteira (as páginas, o catálogo verificado, os horários de ônibus, os modelos de IA, o questionário, o índice de CEP e o **protótipo do painel da Secretaria**).
- **Não vai:** só a pasta `web/tests/` (os testes).
- **Atenção ao painel:** no ramo `main` o painel da Secretaria faz parte da tela inicial (link "Painel da Secretaria") e **ficará público**. Ele só tem **dados de teste**, sorteados por computador, e diz isso numa faixa amarela e nos dados. Mesmo assim, é uma decisão sua: se preferir não expor o painel antes de a Secretaria ver, retire o link da tela inicial antes de ligar o Pages. O painel **real** nunca deve ser público: precisa de login num servidor da Prefeitura.

## Antes de divulgar o endereço
- O site se declara **estudo acadêmico, não oficial da Prefeitura** (aviso no rodapé). Mantenha assim.
- Revise o que ficará público: o painel mostra só dados de teste (faixa amarela); o cartão do **Peniel** na área Saúde está marcado como "não confirmado por ligação"; o **questionário** diz que a coleta está desligada; a página **Entre Mulheres** diz que o canal de cadastro ainda não foi definido.
- O código e os documentos do repositório já são públicos, inclusive este.

## Como atualizar
Cada envio para os ramos `main` ou `claude/maes-solo-educacao` que mude algo em `web/` republica o site sozinho. Para tirar o site do ar: **Settings > Pages** e desligue a publicação.
