# Mapa de dados do MISM3 (Observatório da Mulher)

Onde está cada fonte de dados, de onde vem e quem a usa. **Todos os caminhos abaixo existem no repositório** (o teste `pipeline/tests/test_mapa_de_dados.py` falha se algum deixar de existir). Linhas marcadas com *(gerado, não versionado)* só existem depois de rodar o pipeline no computador de quem o roda.

Fluxo: **fontes oficiais e catálogos escritos à mão → pipeline Python → arquivos gerados em `web/dados/` → telas em `web/*.js`.** O site é estático: não há servidor nem API de IA. O texto digitado e o CEP não são enviados; a única requisição externa possível é a camada de ruas do mapa (OpenStreetMap), que só carrega se a usuária marcar a opção.

## 1. Catálogos escritos à mão (fonte de verdade)

| Arquivo | O que é | Quem lê |
|---|---|---|
| `catalogo/servicos_manuais.csv` | 168 serviços verificados, cada um com fonte e data; `conferido` = `sim` (confirmado), `nao` (não confirmado, com aviso) ou vazio (**pendente**: vazio nunca significa confirmação) | `pipeline/servicos.py` |
| `catalogo/inep_escolas.csv` | ligação manual (revisada) entre escolas do catálogo e o código INEP: 43 escolas | `pipeline/servicos.py`, `pipeline/ligar_catalogo_inep.py` |
| `catalogo/frases_necessidades.txt` | frases de treino do classificador de necessidades | `pipeline/treinar_necessidades.py` |
| `catalogo/frases_fora_do_escopo.txt` | frases fora do assunto do site, para o detector de escopo | `pipeline/treinar_escopo.py` |
| `catalogo/frases_perigo.txt` | frases de perigo (violência, suicídio, criança, saúde) e negativos difíceis, para o detector de perigo | `pipeline/treinar_perigo.py` |
| `catalogo/horarios_onibus.txt` | horários das linhas de ônibus (conferidos nos PDFs de `docs/transporte/`) | `pipeline/horarios_onibus.py` |

**Cuidado:** `python pipeline/ligar_catalogo_inep.py --gravar` sobrescreve `catalogo/inep_escolas.csv`. Não rode sem revisar; o arquivo é curado à mão.

## 2. Arquivos gerados que o site lê (`web/dados/`)

| Arquivo | Gerado por | Quem usa |
|---|---|---|
| `web/dados/catalogo_manual.json` | `python pipeline/servicos.py --somente-manual` | `web/app.js`, `web/ia.js`, mapa, índice do orientador |
| `web/dados/modelo_necessidades.json` | `pipeline/treinar_necessidades.py` | `web/ia.js` (classificador) |
| `web/dados/modelo_escopo.json` | `pipeline/treinar_escopo.py` | `web/orientar.js` (abstenção: o texto é do assunto do site?) |
| `web/dados/modelo_perigo.json` | `pipeline/treinar_perigo.py` | `web/perigo.js` (detector aprendido, junto com as regras) |
| `web/dados/indice_orientacao.json` | `pipeline/indice_orientacao.py` (189 destinos; regenerado em 05/11/2026) | `web/orientar.js`, `web/orientacao-ui.js` |
| `web/dados/oferta_educacao_infantil.json` | `pipeline/oferta_educacao_infantil.py` (Censo Escolar 2025) | `pipeline/servicos.py`; informa a etapa (creche/pré-escola), **não** vaga |
| `web/dados/horarios_onibus.json` | `pipeline/horarios_onibus.py` | tela de horários, índice do orientador |
| `web/dados/cep_indice.json` | `pipeline/indice_cep.py` | busca por CEP, mapa |
| `web/dados/setor_bairro.json` | `pipeline/setores.py` | CEP → bairro provável (`web/mapa-servicos.js`) |
| `web/dados/setores.geojson` | `pipeline/setores.py` | mapa e território |
| `web/dados/territorio.json` | `pipeline/territorio.py` | "Rio Claro em números" (`web/territorio.js`) |
| `web/dados/bairros_apelidos.json`, `web/dados/entre_mulheres_canal.json`, `web/dados/ofertas_mulheres.json` | arquivos mantidos à mão (sem script gerador no pipeline) | busca por bairro, Entre Mulheres |
| `web/dados/servicos.json` *(gerado, não versionado)* | `pipeline/servicos.py` (catálogo + CNES + INEP) | `web/app.js`, de forma **opcional**: só acrescenta o que não está no catálogo (CNES, Censo Escolar); sem ele o site funciona só com o catálogo manual |

## 3. Inteligência (três camadas, que não devem ser confundidas)

| Componente | Arquivo | O que faz |
|---|---|---|
| Classificador de necessidades | `web/ia.js` + `web/dados/modelo_necessidades.json` | TF-IDF + regressão logística treinada pela equipe |
| Regras de palavras-chave | `web/necessidades.js` | reconhece necessidades e categorias com certeza |
| Ordem do plano | `web/plano.js` | regra fixa de urgência, explicável |
| Orientador (busca) | `web/orientar.js`, `web/orientacao-ui.js` | palavras + letras + significado (LSA) + dica do classificador; explica por que cada resultado apareceu; se não acha, diz e mostra as áreas |
| Segurança | `web/perigo.js` + `web/dados/modelo_perigo.json` | regras revisáveis **e** detector aprendido; em perigo, alerta com telefones e serviços de proteção no topo; com confiança moderada, só um aviso discreto |

Avaliação do orientador: `avaliacao/avaliar.py`, `avaliacao/perguntas.json` (5 conjuntos de perguntas com gabarito) e `docs/ia/avaliacao_orientacao.md`. Limites: `docs/ia/limitacoes_conhecidas.md`.

## 4. Jornadas

| Arquivo | Conteúdo |
|---|---|
| `web/jornada.js`, `web/jornada-ui.js` | motor das jornadas guiadas |
| `web/jornada-educacao.js`, `web/jornada-assistencia.js` | jornadas de Educação e de Assistência Social |

## 5. Regras de dados que não podem se perder

- **Coordenada só com fonte:** `geo` = `coordenada_fonte` (45 serviços, com latitude e longitude) ou `sem_local` (os demais). Localização aproximada pelo CEP é outra coisa e nunca vira coordenada de fonte.
- **Conferido x não conferido:** registro não conferido tem `aviso` visível. O CRAM foi retirado do catálogo por falta de fonte confiável; aparece só como dica no cartão da Secretaria Municipal da Mulher.
- **Estados de conferência (`estado_conferencia`):** `confirmado` (planilha: sim), `nao_confirmado` (planilha: nao) e `pendente` (campo vazio). Nenhum registro recebe confirmação automática. O campo antigo `conferido` continua no JSON, mas é derivado: só é verdadeiro quando o estado é `confirmado`. Hoje: 1 confirmado, 3 não confirmados e 164 pendentes. "Desatualizado" não é estado de conferência: é a idade da consulta (abaixo).
- **Procedência da fonte (`fonte_tipo`):** `identificada` (a planilha descreve a fonte), `generica` (a planilha não descreve; o texto "Página oficial do órgão" é preenchido automaticamente e só se sabe o site do órgão: 9 registros) e `nao_identificada` (não confirmado e sem descrição). Nenhuma fonte específica é atribuída sem evidência.
- **Atualidade:** `data_consulta` (= `verificado_em`) é a data em que o projeto consultou a fonte, **não** a data em que o órgão atualizou a informação; `data_atualizacao_fonte` fica vazia quando a planilha não traz a coluna opcional `atualizacao_fonte`. `idade_verificacao_dias` e `atualidade` (`consulta_recente` até 30 dias, `consulta_a_renovar` até 90, `consulta_antiga` acima, `desconhecida`) são calculados em `pipeline/servicos.py` (`LIMITES_ATUALIDADE`) e recalculados no navegador com os mesmos limites (`web/acesso.js`). Consulta recente não prova que a informação esteja atualizada.
- **Campos vazios:** a interface diz "Não informado na fonte" para telefone, endereço e horário ausentes. "Não se aplica" só existe com regra documentada (`NAO_SE_APLICA` em `web/acesso.js`, hoje sem nenhuma regra): na dúvida, é "não informado".
- Testes que protegem isto: `pipeline/tests/test_contrato_dados.py`, `pipeline/tests/test_conferencia.py`, `pipeline/tests/test_procedencia_atualidade.py`, `web/tests/conferencia_ui.test.js`, `web/tests/procedencia_atualidade.test.js` e `web/tests/campos_incompletos.test.js`.
- **Auditoria reprodutível:** `python pipeline/auditoria_catalogo.py` recalcula essas medidas (completude por campo e por eixo, estados, procedência, atualidade, avisos) e grava JSON e CSV; o teste `pipeline/tests/test_auditoria_catalogo.py` confere os números da auditoria de referência (168 registros; telefone 151, endereço 156, CEP 108, coordenada 84, horário 52; 9 avisos).

## 6. Documentação de apoio

`README.md`, `docs/registro_decisoes_desenvolvimento.md`, `docs/inventario_de_fontes.md`, `docs/arquitetura_ia.md`, `docs/transporte/README.md`, `docs/estado_do_projeto.md` e os PDFs de prova em `docs/documetacao/`.

## 7. Privacidade, comunicação externa e limites do que foi verificado

Descrição do que o código do site faz **nesta versão**, lida do código-fonte. Não é garantia de anonimato nem declaração de conformidade com a LGPD ou outra lei.

**O que é processado no aparelho da usuária.** O texto digitado no orientador, a busca por CEP e o bairro, o classificador de necessidades, o detector de perigo, o detector de escopo e o índice do orientador rodam no navegador, sobre arquivos de dados baixados do próprio site (`web/dados/`). O código não grava o texto em armazenamento do navegador nem o envia a um servidor do projeto: a busca textual no código (`pipeline/auditoria_catalogo.py`, seção de análise estática) não encontra `localStorage`, `sessionStorage`, `indexedDB`, `document.cookie` nem `serviceWorker` nos arquivos `web/*.js` e `web/*.html`. A biblioteca do mapa (Leaflet) é servida pelo próprio site (`web/vendor`).

**Recursos que podem se comunicar com o exterior.**
- Camada de ruas do mapa de serviços (`web/mapa.js`): só depois que a usuária marca "Mostrar ruas e nomes", o navegador pede imagens de mapa à Esri (server.arcgisonline.com).
- Camada opcional do mapa por CEP (`web/app.js`, caixa de seleção de mapa-base): só depois de marcada, o navegador pede imagens ao OpenStreetMap (tile.openstreetmap.org).
- Links para fontes oficiais, Instagram de unidades e "Ver no Google Maps": só abrem se a usuária clicar, em nova aba, com `noopener noreferrer`; o site de destino passa a receber a visita e segue a sua própria política.
- Hospedagem do site: o servidor que entrega as páginas e os arquivos de dados, como qualquer servidor web, pode registrar o endereço de rede (IP), data e hora, arquivo pedido e dados do navegador. Esta documentação não examinou a configuração nem os registros desse servidor.

**Quem pode observar o quê.** Os provedores de mapa (Esri e OpenStreetMap) e o servidor de hospedagem podem observar o endereço de rede e os dados técnicos do navegador de quem faz a requisição, e, nos mapas, quais blocos de imagem foram pedidos (o que indica a região que a pessoa está vendo). As páginas usam `referrer: no-referrer` (meta); só os pedidos de imagem do OpenStreetMap enviam a origem do site (sem caminho e sem CEP), como a política de uso do OpenStreetMap exige, e só depois de a caixa de mapa ser marcada. Os pedidos à Esri seguem sem Referer.

**O que não foi verificado.**
- A ferramenta `pipeline/auditoria_catalogo.py` não mede rede em navegador: as afirmações acima vêm da leitura do código. Medições de rede em navegador (Chromium sem janela, 06/11/2026) estão resumidas em `reproducao/AUDITORIA_REDE_RESUMO.md` e não foram refeitas neste trabalho.
- Não foram verificados os registros do servidor de hospedagem, o que os provedores de mapa fazem com os dados que recebem, nem o comportamento em outros navegadores ou extensões.
- Não houve validação com usuárias reais, nem avaliação jurídica. A página de privacidade do site (`web/privacidade.html`) não foi alterada por este trabalho.
