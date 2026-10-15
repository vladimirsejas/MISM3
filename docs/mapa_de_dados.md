# Mapa de dados do MISM3 (Mulher em Rede)

Onde está cada fonte de dados, de onde vem e quem a usa. **Todos os caminhos abaixo existem no repositório** (o teste `pipeline/tests/test_mapa_de_dados.py` falha se algum deixar de existir). Linhas marcadas com *(gerado, não versionado)* só existem depois de rodar o pipeline no computador de quem o roda.

Fluxo: **fontes oficiais e catálogos escritos à mão → pipeline Python → arquivos gerados em `web/dados/` → telas em `web/*.js`.** O site é estático: não há servidor nem API de IA. O texto digitado e o CEP não são enviados; a única requisição externa possível é a camada de ruas do mapa (OpenStreetMap), que só carrega se a usuária marcar a opção.

## 1. Catálogos escritos à mão (fonte de verdade)

| Arquivo | O que é | Quem lê |
|---|---|---|
| `catalogo/servicos_manuais.csv` | 164 serviços verificados, cada um com fonte e data; `conferido` = não quando falta confirmação (e então tem aviso) | `pipeline/servicos.py` |
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
| `web/dados/indice_orientacao.json` | `pipeline/indice_orientacao.py` (162 destinos) | `web/orientar.js`, `web/orientacao-ui.js` |
| `web/dados/oferta_educacao_infantil.json` | `pipeline/oferta_educacao_infantil.py` (Censo Escolar 2025) | `pipeline/servicos.py`; informa a etapa (creche/pré-escola), **não** vaga |
| `web/dados/horarios_onibus.json` | `pipeline/horarios_onibus.py` | tela de horários, índice do orientador |
| `web/dados/cep_indice.json` | `pipeline/indice_cep.py` | busca por CEP, mapa |
| `web/dados/setor_bairro.json` | `pipeline/setores.py` | CEP → bairro provável (`web/mapa-servicos.js`) |
| `web/dados/setores.geojson` | `pipeline/setores.py` | mapa e território |
| `web/dados/territorio.json` | `pipeline/territorio.py` | "Rio Claro em números" (`web/territorio.js`) |
| `web/dados/painel_teste.json` | `pipeline/gerar_dados_teste_painel.js` | `web/painel.js` — **dados de teste, não são de mulheres reais** |
| `web/dados/bairros_apelidos.json`, `web/dados/coleta.json`, `web/dados/entre_mulheres_canal.json`, `web/dados/ofertas_mulheres.json` | arquivos mantidos à mão (sem script gerador no pipeline) | busca por bairro, coleta, Entre Mulheres |
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

## 4. Jornadas e questionário

| Arquivo | Conteúdo |
|---|---|
| `web/jornada.js`, `web/jornada-ui.js` | motor das jornadas guiadas |
| `web/jornada-educacao.js`, `web/jornada-assistencia.js` | jornadas de Educação e de Assistência Social |
| `web/questionario.js`, `web/questionario-ui.js` | questionário (20 perguntas) do Observatório; o envio de respostas existe no código, mas está desligado (ver `web/dados/coleta.json`) |

## 5. Regras de dados que não podem se perder

- **Coordenada só com fonte:** `geo` = `coordenada_fonte` (45 serviços, com latitude e longitude) ou `sem_local` (os demais). Localização aproximada pelo CEP é outra coisa e nunca vira coordenada de fonte.
- **Conferido x não conferido:** registro não conferido tem `aviso` visível. O CRAM foi retirado do catálogo por falta de fonte confiável; aparece só como dica no cartão da Secretaria Municipal da Mulher.
- Testes que protegem isto: `pipeline/tests/test_contrato_dados.py`.

## 6. Documentação de apoio

`README.md`, `docs/registro_decisoes_desenvolvimento.md`, `docs/inventario_de_fontes.md`, `docs/arquitetura_ia.md`, `docs/transporte/README.md`, `docs/estado_do_projeto.md` e os PDFs de prova em `docs/documetacao/`.
