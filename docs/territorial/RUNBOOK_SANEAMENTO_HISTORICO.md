# Procedimento de saneamento do histórico Git e da hospedagem (para o proprietário)

**Data de preparação:** 08/11/2026.
**Estado:** os passos 4.1 a 4.5 foram **aplicados em 09/11/2026** (ver a seção 7); o passo 4.6 (suporte do GitHub) e todo o painel da Cloudflare continuam pendentes e dependem do proprietário. Este documento não contém dados protegidos.

## 1. Por que apagar os arquivos em um novo commit não basta

Um commit novo que corrija `web/dados/*.json` não remove as versões antigas: elas continuam em commits, branches, tags e nas referências de PR (`refs/pull/*`) do repositório público, e nas implantações antigas da Cloudflare Pages. A reescrita do histórico remove as versões antigas de **branches e tags**; as referências de PR e os commits em cache do GitHub só desaparecem com pedido de remoção ao suporte do GitHub ou com a recriação do repositório.

## 2. O que foi preparado

Pasta local restrita `C:\MISM_PRIVACIDADE` (fora do repositório):

| Item | O que é |
|---|---|
| `backup-original.git` | Espelho completo do GitHub antes da reescrita (170 referências: 62 branches, 2 tags, 106 de PR). **Não mexer.** |
| `refs-originais.txt` | SHAs originais de todas as referências. |
| `PACOTE/` | Resultado final: repositório espelho reescrito (`sanitizado.git`), `commit-map.txt` (SHA antigo para SHA novo), `ref-map.txt`, `verificacao.txt` (saída da verificação) e os scripts `reescrever.sh` e `verificar_pacote.py`, para refazer tudo a partir do backup. |

A reescrita usa `git filter-repo` 2.47.0 (MIT) e remove, em **todos** os commits de todas as branches e tags, as versões de:

- `web/dados/setores.geojson`, `indicadores_territoriais.json`, `territorio.json`, `analise_territorial.json`, `exposicao_distancia.json`, `escolas_municipais.json`, `oferta_educacao_infantil.json`, `cep_indice.json`, `setores_resumo.json` e `demo/gestao.json`;
- `demo_unico/gestao.html` e `demo_unico/inteligencia-publica.html`;
- `reproducao/auditoria_privacidade.md`, `reproducao/resultados/auditoria_requisicoes.json`, `reproducao/auditoria_privacidade_cep_*.md` e `reproducao/resultados/auditoria_cep_*`;
- `docs/territorial/imagens_mapa_v1/`.

Depois da remoção, um commit final na branch `feat/mapa-territorial-como-mapa-principal` restaura **somente** a versão sanitizada atual dos oito arquivos de dados territoriais. Verificado: a árvore da ponta reescrita é **idêntica** (mesmo hash de árvore) à ponta original da branch, ou seja, o conteúdo final não mudou; só o histórico.

Efeitos da reescrita (todos os SHAs de commits mudam a partir do primeiro commit que tocou esses arquivos):

- Os commits que só mexiam nesses arquivos deixam de existir (cerca de 60); a contagem exata antes e depois está em `PACOTE/verificacao.txt`.
- As tags `v0.9-revisao` e `v1.0-pesquisa` passam a apontar para commits com SHA novo. **Impacto no experimento:** `reproducao/MANIFESTO_EXECUCAO_v1.md` e o protocolo citam o commit da etiqueta e commits da `main` pelo SHA antigo. Os arquivos do sistema avaliado (código do orientador, modelos, índice, catálogo) continuam byte a byte iguais e o SHA-256 do conjunto congelado não muda; falta apenas registrar, em adendo ao manifesto, a correspondência de SHAs usando `commit-map.txt`.
- PRs abertas (#92, #91, #81, #62, #58, #51, #45, #44) têm as branches reescritas; o GitHub as mantém, com a lista de commits nova. PRs já mescladas ou fechadas continuam apontando para os SHAs antigos em `refs/pull/*`.
- Qualquer clone existente (o da pasta do projeto, de colaboradores, de ferramentas de IA) tem o histórico antigo e deve ser **apagado e clonado de novo**; um `git pull` reintroduziria os commits antigos.
- A `main` reescrita **não** contém os arquivos de dados territoriais (foram removidos de todo o histórico) e o site da Cloudflare, que publica a `main`, ficaria sem eles. Por isso o passo 4.4 prevê apontar a `main` para a ponta sanitizada da branch da PR #92; isso equivale a integrar a PR #92 e **precisa da sua autorização expressa**.

## 3. Antes de começar (contenção, sem reescrever nada)

1. **Cloudflare Pages (painel):** o domínio de produção publica hoje a versão sem supressão D4, e cada commit e cada PR criou uma URL de prévia pública que continua servindo o que havia naquele commit. Em Pages, projeto `mism3-observatorio`: desative as implantações de prévia (ou proteja-as com Cloudflare Access) e apague as implantações antigas, de produção e de prévia (os detalhes de como o painel permite excluir a implantação de produção atual não foram verificados; confirmar no painel).
2. **Visibilidade do repositório:** deixar o repositório privado durante a janela de reescrita é opcional. Efeitos a considerar antes: o GitHub Pages não é usado (`has_pages` falso); a Cloudflare Pages implanta por meio do aplicativo da Cloudflare instalado no GitHub; se esse aplicativo manterá acesso ao repositório depois de torná-lo privado **não foi verificado** (confirmar nas configurações do aplicativo antes); issues, PRs e links públicos deixam de abrir; a estrela e o observador existentes continuam. Não foi alterada.
3. **Forks e cópias:** em 08/11/2026 a API do GitHub informou 0 forks. Confira de novo imediatamente antes de reescrever (`gh api repos/vladimirsejas/MISM3/forks`).
4. Confirme que o backup existe e abre: `git --git-dir=C:\MISM_PRIVACIDADE\backup-original.git log -1 main`.

## 4. Aplicação (somente com a sua autorização)

Todos os comandos em `C:\MISM_PRIVACIDADE\PACOTE\sanitizado.git`. **Não use `--mirror`** (tentaria apagar as referências de PR, que o GitHub não permite alterar).

1. Conferir a verificação: `type verificacao.txt` deve terminar em `RESULTADO: OK`.
2. Apontar o remoto, sem `--mirror`: `git remote add github https://github.com/vladimirsejas/MISM3.git`.
3. Enviar as branches **menos a `main`** e a das PRs, uma a uma conferindo o antigo SHA: `git push --force-with-lease=refs/heads/<ramo>:<SHA_antigo_de_refs-originais.txt> github refs/heads/<ramo>:refs/heads/<ramo>`; depois as tags: `git push --force github refs/tags/v0.9-revisao refs/tags/v1.0-pesquisa`. (O `--force-with-lease` com o SHA esperado impede sobrescrever algo que mudou desde o backup.)
4. Enviar a ponta sanitizada da PR #92 e apontar a `main` para ela: `git push --force-with-lease=refs/heads/feat/mapa-territorial-como-mapa-principal:<SHA_antigo> github refs/heads/feat/mapa-territorial-como-mapa-principal:refs/heads/feat/mapa-territorial-como-mapa-principal` e depois `git push --force-with-lease=refs/heads/main:<SHA_antigo_da_main> github refs/heads/feat/mapa-territorial-como-mapa-principal:refs/heads/main`. Se a proteção de branch impedir o push forçado na `main`, desative-a por alguns minutos nas configurações e reative em seguida.
5. Conferir no GitHub que `main` e a PR #92 apontam para o mesmo commit e que o deploy da Cloudflare terminou com sucesso.
6. **Suporte do GitHub:** abrir pedido em https://support.github.com/contact (assunto "Remove sensitive data") pedindo a remoção de visualizações em cache e de referências a commits antigos, incluindo `refs/pull/*`, e informando os SHAs de `refs-originais.txt`. Sem isso, os commits antigos continuam acessíveis por SHA e pelas PRs antigas.
7. Apagar e clonar de novo todas as cópias locais; depois de clonar, rodar a suíte de testes.
8. Registrar em adendo ao manifesto do experimento a tabela SHA antigo para SHA novo de `v1.0-pesquisa` e dos commits citados.

## 5. Reverter

O backup `backup-original.git` guarda o estado anterior. Para restaurar uma branch: `git push --force github <SHA_antigo>:refs/heads/<ramo>` a partir do backup. Isso devolve também os dados sem supressão, portanto só deve ser usado se a reescrita falhar.

## 6. O que a reescrita não resolve

- Cópias já feitas por terceiros, por serviços de arquivamento ou por buscadores antes da reescrita.
- Referências de PR e commits em cache do GitHub antes do pedido ao suporte.
- Implantações antigas da Cloudflare que não forem apagadas.
- A decisão pendente sobre CEPs com menos de 3 endereços (seção 7.3 do plano de publicação) e as licenças e termos de terceiros ainda não confirmados.

## 7. Resultado da aplicação (09/11/2026)

**Feito e verificado**

- Backup antes de reescrever: espelho completo do GitHub (`backup-pre-reescrita-*.git`, 64 referências idênticas, sha a sha, às do GitHub e `git fsck` sem erros).
- Branches (62) e tags (2) enviadas com `--force-with-lease` apontando para o SHA antigo; a branch da PR #92 e a `main` por último. Nenhuma recusa.
- Conferência em clone novo do GitHub: as 64 referências são iguais às do pacote verificado; nenhum caminho sensível sobrou em branches e tags; nenhum valor demográfico de setor protegido, matrícula por escola ou CEP de setor protegido nos arquivos restaurados; a árvore da ponta da `main` é idêntica à anterior.
- Testes no clone novo da `main`: 35 de 35 arquivos JavaScript, 285 testes Python, 18 conjuntos de perfis com 20 de 20 e plano de prioridades 5 de 5. CI e Cloudflare Pages verdes no commit novo; produção servindo a versão saneada.

**Efeitos colaterais**

- As 7 PRs que estavam abertas (#91, #81, #62, #58, #51, #45, #44) foram **fechadas automaticamente pelo GitHub** ao reescrever as bases; o botão de reabrir ficou desabilitado. As branches delas continuam existindo, reescritas; é preciso abrir PRs novas se o trabalho for retomado. A PR #92 já estava integrada.
- As etiquetas `v0.9-revisao` e `v1.0-pesquisa` têm commits novos; a correspondência está em `reproducao/ADENDO_SHAS_APOS_SANEAMENTO.md`.

**O que o push não resolve (medido depois dele)**

- O GitHub mantém 98 referências `refs/pull/*` que ainda apontam para os commits antigos, e esses commits continuam abrindo por SHA (`github.com/.../commit/<sha>` e `raw.githubusercontent.com`, HTTP 200 nos três commits antigos testados). A verificação sobre todas as referências, incluindo as de PR, falha: caminhos sensíveis continuam alcançáveis por elas.
- Só o suporte do GitHub (pedido de remoção de dados sensíveis e de visualizações em cache) ou a recriação do repositório remove isso. O texto do pedido está pronto em `C:\MISM_PRIVACIDADE\PACOTE\PEDIDO_SUPORTE_GITHUB.txt`.
- Cópias locais antigas (a pasta do projeto, de colaboradores, de ferramentas) ainda têm o histórico antigo: apagar e clonar de novo; não usar `git push --force` a partir delas.
