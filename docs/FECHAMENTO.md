# Fechamento do MISM3

Data de início: 2026-11-09
Branch de trabalho: `mism3-fechamento`
Branch-base: `main`
SHA de partida: `9ed9731ca55b97888a6e0fef2df04fdd9eedbd9d`

## Registro de execução

- Estado inicial confirmado diretamente no GitHub.
- Branch criada a partir da ponta atual de `main`.
- Primeiro commit confirma permissão de escrita.
- Nenhuma alteração em `main`, merge, deploy ou operação na Cloudflare.

## Blocos

| Bloco | Estado | Commit | Actions |
|---|---|---|---|
| 1. Privacidade | Em validação contínua | `7aa998c`, `150b153`, `0aab7d7`, `ea9d904`, `d2b3682`, `8688195`, `f283de8`, `e22459d`, `23e0e59`, `56d912d`, `88bfb3c` | Actions em novas tentativas; ver registro abaixo |
| 2. Geografia | Pendente | — | — |
| 3. Fontes e licenças | Pendente | — | — |
| 4. Mapa e painel | Pendente | — | — |
| 5. Sistema de orientação | Pendente | — | — |
| 6. Documentação definitiva | Pendente | — | — |
| 7. Fechamento | Pendente | — | — |

## Registro técnico

### 2026-11-09
- Inventário inicial: `main` em `9ed9731ca55b97888a6e0fef2df04fdd9eedbd9d`.
- Branches existentes e PRs abertas consultadas; nenhuma PR aberta no momento da consulta.
- A branch de fechamento foi criada sem alterar `main`.

## Bloco 1 — privacidade: execução e correções

- A rotina de filtragem do índice CEP foi corrigida para omitir registros sem vínculo com setor da malha, setores protegidos pela D4 e registros inválidos; o mesmo saneamento é chamado tanto na geração normal quanto no saneamento do arquivo publicado.
- O índice publicado passou de 1.367 para 1.243 CEPs. Foram removidos 124 CEPs sem correspondência verificável na malha; permanecem zero CEPs sem setor verificável e zero CEPs associados aos 17 setores D4. Os 44 CEPs com menos de três endereços permanecem generalizados para o centro do setor.
- A validação do registro CEP passou a exigir chave de oito dígitos, cinco campos válidos, coordenadas/raio finitos e contagem de endereços inteira e não negativa.
- A regra central D4 passou a tratar contagens fracionárias, booleanas, negativas, NaN e infinitas como inválidas, aplicando supressão fail-closed.
- Foram acrescentados testes para CEP sem setor, setor ausente da malha, sufixo CNEFE, registros inválidos, generalização, idempotência e contagens D4 inválidas.
- O carimbo e o hash de entrada de `indicadores_territoriais.json` foram atualizados após o saneamento do índice CEP, preservando a serialização original dos demais indicadores.
- Commits do bloco: `7aa998c64983a8ba767ec3e4ff22250ce9bfb46a`, `150b15333414223670b93c568ebd0e2d67626ebf`, `0aab7d729e9d6233ca3817218f9b63dd6e1973e5`, `ea9d9043ded2852a5ff6f24950b9220cca3f1eb1`, `d2b3682f85b8f9f064e2873a474f4d64a539fb18`, `8688195ab4dfe49588a9728491a262b76a6c8a1a`, `f283de8150d49cb4d6c51ea70b211cea0795540e`, `e22459d97f82fac8849f65334d5652a499294ac2`, `23e0e59dd11cd0abb31c1c2c772a461829ef2518`, `56d912dd7d6029d6d8462878e8d4aa84489f09f2`, `88bfb3c837af71089f5de5793964481da328462f`.
- Execuções Actions anteriores foram inspecionadas e falharam durante a correção iterativa: 42656266747, 42656339521, 42656385372, 42656489465, 42656599377, 42657143528 e 42657191141. As falhas identificadas foram corrigidas; a execução após o último commit ainda será registrada quando terminar.
