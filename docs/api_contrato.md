# API do MISM3: como plugar dados e pesquisas reais

O MISM3 é **funcional**, tenha ou não usuárias: o site lê dados reais e faz pesquisas reais quando existir uma API por trás. Este documento é o contrato. Quem for ligar uma API (você, o ChatGPT ou eu) só precisa seguir isto.

## Duas camadas, uma decisão
```
navegador (web/)  ──>  Api.json / Api.pesquisar  (web/api.js)  ──>  servidor (pipeline/servidor.py)  ──>  seu provedor
                          └─ sem servidor: lê web/dados/*.json (modo "local")
```
- **Modo local** (padrão, `web/config.js`): lê arquivos de `web/dados/`. Funciona com duplo clique, sem internet. É o que o `demo_unico/` usa.
- **Modo api**: o site pergunta ao servidor. **Se a API falhar** (offline, 404, 500), cai para os arquivos locais, então ela nunca derruba o site.
- O servidor liga o modo api sozinho: rode `abrir_servidor.bat` (ou `python pipeline/servidor.py`) e ele entrega um `/config.js` com `modo: "api"`.

## Rotas
| Rota | Devolve | Observação |
|---|---|---|
| `GET /api/saude` | `{"ok": true, "pesquisa": bool}` | `pesquisa` = há provedor plugado |
| `GET /api/servicos` | o conteúdo de `web/dados/servicos.json` | 404 se o arquivo não existe; o site usa os dados de demonstração |
| `GET /api/cep_indice` | `web/dados/cep_indice.json` | idem |
| `GET /api/vagas` | `web/dados/vagas.json` | idem |
| `GET /api/gestao` | `web/dados/gestao.json` | o painel de gestão |
| `POST /api/pesquisar` | pesquisa real (abaixo) | `501` se não há provedor |

Para trocar um desses arquivos por dados vindos de uma API, **gere o JSON no mesmo formato** (a forma dos arquivos está em `web/dados/demo/*.json` e nos scripts de `pipeline/`) ou altere a rota em `servidor.py` para buscar na sua API.

## Pesquisa real: `POST /api/pesquisar`
Pedido: `{"texto": "frase da usuária (até 300 caracteres)", "contexto": {}}`

Resposta (do seu provedor):
```json
{
  "necessidades": ["emprego", "filhos"],
  "resultados": [
    {"titulo": "…", "descricao": "…", "url": "https://…", "fonte": "nome da fonte", "consultado_em": "2026-10-10"}
  ]
}
```
- `necessidades` (opcional): ids de `web/necessidades.js` (`emprego`, `estudo`, `saude`, `filhos`, `familia`, `casamento`, `violencia`, `transporte`). O site soma às que a busca local achou (no máximo 3).
- `resultados`: **cada um precisa de `titulo` e `url` http(s)**. Sem fonte o site descarta. Regra do projeto: **nada sem fonte e nada inventado**; se a API não achou nada, devolva `"resultados": []`.
- A tela mostra "Fonte: … · consultado em …" e o aviso para conferir na fonte.

### Como plugar o seu provedor (3 passos)
1. Copie `pipeline/provedor_pesquisa.exemplo.py` para `pipeline/provedor_pesquisa.py` (o git ignora este arquivo).
2. Implemente `pesquisar(texto, contexto) -> dict` chamando a sua API. A **chave fica em variável de ambiente** (`os.environ`), nunca no código nem no navegador.
3. Rode `python pipeline/servidor.py`. A linha de início diz `pesquisa real: LIGADA`. A frase digitada passa a ir ao servidor, e o aviso de privacidade da tela muda para dizer isso.

Dica: restrinja as consultas a **Rio Claro/SP (código IBGE 3543907)** para não trazer o Rio Claro do RJ.

## Regras de segurança e privacidade (já implementadas)
- **Frases com sinal de violência nunca são enviadas** à API: a proteção aparece só com a busca local.
- O servidor **nunca registra** o texto digitado nem o corpo das requisições (só método e caminho).
- Corpo limitado a 8 KB; frase cortada em 300 caracteres; falha do provedor vira `502` **sem** vazar o motivo; o servidor não sai da pasta `web/`.
- O servidor escuta só em `127.0.0.1` (esta máquina). **Antes de abrir para a rede**, acrescente autenticação.
- O aviso de privacidade da tela só afirma "não é enviado a nenhum servidor" quando isso é verdade.

## O que ainda não existe
- **Nenhum provedor concreto.** Falta saber qual API vocês vão usar (busca na web, dados abertos, modelo de linguagem). O encaixe está pronto e testado com um provedor de mentira.
- Páginas de resultados ricos (filtros, paginação) e cache de pesquisas.
- Autenticação, para o caso de expor o servidor.
