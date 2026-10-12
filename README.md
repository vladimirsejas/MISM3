# Mulher Resolve (MISM3)

MISM3 é o código do projeto: Monitoramento Inteligente da Saúde da Mulher (terceira versão). "Mulher Resolve" é o nome público do site.

Site estático de orientação para mulheres de Rio Claro (SP): reúne serviços públicos verificados (assistência social, saúde, educação, trabalho, direitos, moradia, transporte) e recomenda para onde ir a partir do que a pessoa escreve. Projeto acadêmico de demonstração (Fatec Rio Claro, Inteligência Artificial). Não é um site oficial da Prefeitura, não é vendido e não tem fins comerciais.

Estado em 13/10/2026. O que existe, o que foi testado e o que ainda é proposta: [docs/estado_do_projeto.md](docs/estado_do_projeto.md). Decisões e histórico: [docs/registro_decisoes_desenvolvimento.md](docs/registro_decisoes_desenvolvimento.md).

Restrições de projeto: o orientador não usa modelo de linguagem e o texto digitado fica no navegador; a explicação por IA (Gemini) é opcional, vem desligada, só existe com o servidor local e uma chave no `.env`, e nunca é usada quando há sinal de perigo; não prevê risco individual; não decide elegibilidade a benefício; não promete vaga. Cada dado mostra fonte e data de conferência.

## Arquitetura

```
fontes oficiais (IBGE, INEP, CNES, páginas municipais)      catálogos escritos à mão (catalogo/)
                         \                                    /
                          v                                  v
                   pipeline/*.py  (Python: baixa, trata, treina, valida)
                                   |
                                   v
                   web/dados/*.json, *.geojson  (arquivos gerados)
                                   |
                                   v
              web/index.html + web/*.js  (navegador: sem servidor, sem build)
```

- O site roda inteiro no navegador. Python gera os arquivos que o site lê. Para publicar o site (hospedagem estática) não há servidor nem API. Para a explicação opcional por IA, o `abrir_site.bat` liga `pipeline/servidor_ia.py`, que serve `web/` e guarda a chave do Gemini; sem chave, o site funciona igual.
- O dashboard é uma única página (`web/index.html`). Entre Mulheres, Rio Claro em números e o Painel são vistas carregadas sob demanda (`app.js`).
- Os modelos de aprendizado de máquina são treinados em Python e exportados como JSON (pesos); o navegador só faz multiplicação de matrizes (`web/ia.js`, `web/orientar.js`).

## Linguagens

| Linguagem | Onde | Para que serve | Versão |
|---|---|---|---|
| JavaScript (ES5, módulos IIFE, sem bundler, sem npm) | `web/*.js`, `web/tests/`, `avaliacao/*.js`, `pipeline/gerar_dados_teste_painel.js` | Todo o site e seus testes; scripts de avaliação | Navegador moderno; Node 18+ para testes (CI: 20; testado: 22) |
| Python | `pipeline/*.py`, `pipeline/tests/`, `avaliacao/avaliar.py` | Pipeline de dados, treino e exportação dos modelos, avaliação, testes | 3.10+ (CI: 3.12; testado: 3.13 e 3.14) |
| HTML | `web/index.html` | Dashboard (página única) | HTML5 |
| CSS | `web/estilo.css`, `web/vendor/leaflet.css` | Visual, contraste, impressão, responsividade | CSS3, sem pré-processador |
| Batch (Windows) | `abrir_site.bat`, `atualizar_localizacoes.bat` | Abrir o site local; refazer localizações do catálogo | cmd.exe |
| YAML | `.github/workflows/testes.yml` | Integração contínua (GitHub Actions) | |
| JSON, GeoJSON, CSV, TXT | `web/dados/`, `catalogo/`, `avaliacao/perguntas.json` | Dados, modelos exportados, catálogos e frases de treino | UTF-8 |
| Markdown | `README.md`, `docs/` | Documentação | |

## Bibliotecas e dependências

Python (instalar: `python -m pip install -r requirements.txt`; fonte única das versões mínimas):

| Biblioteca | Onde é usada | Para que serve |
|---|---|---|
| pandas | `pipeline/cnes.py`, `common.py`, `indice_cep.py`, `oferta_educacao_infantil.py`, `servicos.py` e testes | Leitura e tratamento de CSV grandes (CNES, CNEFE, Censo Escolar) |
| numpy | `analise_territorial.py`, `common.py`, `indice_cep.py`, `indice_orientacao.py`, `treinar_necessidades.py`, `treinar_perigo.py`, `treinar_escopo.py` | Arrays, cálculo numérico, distâncias |
| scikit-learn | `treinar_necessidades.py`, `treinar_perigo.py`, `treinar_escopo.py` (TfidfVectorizer, LogisticRegression, OneVsRestClassifier, StratifiedKFold); `indice_orientacao.py` (TfidfVectorizer, TruncatedSVD); `analise_territorial.py` (KMeans) | Treino dos modelos, TF-IDF, redução de dimensão (LSA) e agrupamento. Traz o scipy como dependência |
| pyshp (módulo `shapefile`) | `pipeline/setores.py` | Ler o shapefile de setores censitários do IBGE |
| openpyxl | `pipeline/inspecionar_arquivo.py` | Inspecionar a estrutura de planilhas .xlsx |
| pytest | `pipeline/tests/` | Testes do pipeline |

Biblioteca padrão do Python mais usada: `argparse`, `csv`, `json`, `pathlib`, `re`, `unicodedata`, `urllib` (downloads em `baixar.py` e `common.py`; verificação da chave em `testar_api.py`), `zipfile`, `subprocess` (chama o Node em `indice_orientacao.py` e `avaliar.py`).

JavaScript:

| Biblioteca | Onde | Para que serve |
|---|---|---|
| Leaflet 1.9.4 (BSD-2), copiada em `web/vendor/` (`leaflet.js`, `leaflet.css`, `images/`, `LEAFLET-LICENSE.txt`) | `web/mapa.js` (mapa de serviços), `web/territorio.js` (mapa por setor) | Mapas interativos; servida localmente |
| Módulos do Node: `fs`, `path`, `assert`, `vm` | `web/tests/*.test.js`, `avaliacao/*.js`, `pipeline/gerar_dados_teste_painel.js` | Testes e scripts de linha de comando |

Não há pacotes npm, `package.json`, framework, bundler nem CDN. Todo o JavaScript do site é código do projeto, exceto o Leaflet.

Serviços externos: o site só consulta `tile.openstreetmap.org` (ruas do mapa), e apenas se a usuária marcar a opção (`web/mapa.js`). Links para páginas oficiais, WhatsApp e Google Maps abrem por clique. A única exceção é a explicação opcional por IA: só se a usuária marcar a opção (`web/ia-llm.js`) e só quando o site é aberto por `pipeline/servidor_ia.py` com `GEMINI_API_KEY`, o texto dela e os serviços encontrados vão ao servidor local, que os repassa à API REST do Gemini (`generativelanguage.googleapis.com`, sem biblioteca do Google). A chave nunca vai ao navegador. Em tempo de desenvolvimento, `pipeline/baixar.py` baixa dados do IBGE, INEP e DATASUS, e `pipeline/testar_api.py` (`ANTHROPIC_API_KEY`) e `pipeline/testar_gemini.py` (`GEMINI_API_KEY`) fazem uma chamada mínima só para verificar a chave.

Integração contínua: GitHub Actions (`actions/checkout@v4`, `actions/setup-python@v5`, `actions/setup-node@v4`), Python 3.12, Node 20.

## Modelos de aprendizado de máquina

Todos rodam no navegador. Pesos em JSON, treinados em Python, avaliados em `avaliacao/` (resultados e limites em [docs/ia/avaliacao_orientacao.md](docs/ia/avaliacao_orientacao.md)).

| Modelo | Algoritmo | Treino (script, dados) | Saída | Uso no site |
|---|---|---|---|---|
| Necessidades | Regressão logística um-contra-todos sobre n-gramas de caracteres (3 a 5) e palavras, TF-IDF | `pipeline/treinar_necessidades.py`, `catalogo/frases_necessidades.txt` | `web/dados/modelo_necessidades.json` | `web/ia.js` (sugestão de necessidades); dica de intenção no orientador |
| Perigo | Regressão logística por tipo (violência, suicídio, criança, saúde); limiares de aviso e de alerta por validação cruzada | `pipeline/treinar_perigo.py`, `catalogo/frases_perigo.txt` | `web/dados/modelo_perigo.json` | `web/perigo.js`, junto com regras |
| Escopo | Regressão logística binária (assunto do site ou não) | `pipeline/treinar_escopo.py`, `catalogo/frases_fora_do_escopo.txt` | `web/dados/modelo_escopo.json` | `web/orientar.js` (abstenção) |
| Busca | TF-IDF de palavras e de letras, mais LSA (TruncatedSVD, 64 dimensões) | `pipeline/indice_orientacao.py` (usa `web/areas.js` e `web/dados/catalogo_manual.json`) | `web/dados/indice_orientacao.json` | `web/orientar.js` (ranking de destinos) |

Segurança: `web/perigo.js` aplica regras determinísticas e o modelo de perigo. Regra ou modelo com alta confiança gera alerta completo (telefones e serviços de proteção fixados); modelo com confiança moderada gera só um aviso. O alerta das regras aparece antes de qualquer arquivo ser baixado.

Não existe: modelo de linguagem, embeddings neurais, previsão de risco, elegibilidade automática de benefício.

## Estrutura do repositório

| Caminho | Conteúdo |
|---|---|
| `web/` | Site estático (publicável como está) |
| `web/dados/` | JSON e GeoJSON lidos pelo site (gerados ou mantidos à mão; ver `docs/mapa_de_dados.md`) |
| `web/tests/` | Testes em Node (`*.test.js`) |
| `web/vendor/` | Leaflet |
| `web/img/` | Imagens do site (brasões, faixa de mulheres) |
| `catalogo/` | Fontes escritas à mão: serviços, horários de ônibus, ligação com o INEP, frases de treino |
| `pipeline/` | Scripts Python e `pipeline/tests/` |
| `avaliacao/` | Conjuntos de perguntas com gabarito e avaliadores |
| `docs/` | Documentação, decisões e PDFs de fonte (`docs/documetacao/`) |
| `dados/bruto/` | Downloads grandes; fora do Git |
| `requirements.txt` | Dependências Python |

## Código do site (`web/*.js`)

| Arquivo | Função |
|---|---|
| `app.js` | Roteador por hash, renderização das áreas e vistas, contatos, orientador na tela |
| `areas.js` | Conteúdo das áreas (cartões, seções, canais, fontes) |
| `acesso.js` | Lógica pura: distância, idade da informação, regras de exibição |
| `ia.js` | Classificador de necessidades; `criarClassificador` carrega qualquer modelo no mesmo formato |
| `necessidades.js` | Regras de palavras-chave de necessidades e normalização de texto |
| `perigo.js` | Camada de segurança: regras, detector aprendido, âncoras, letras esticadas |
| `orientar.js` | Motor de busca de destinos (palavras, letras, LSA, intenção, escopo) e abstenção |
| `orientacao-ui.js` | Tela do orientador (alerta, lista de resultados, saída "não encontrei") |
| `ia-llm.js` | Explicação opcional por IA (Gemini): decide quando pode chamar (nunca com sinal de perigo), reduz os serviços ao mínimo enviado e escapa a resposta |
| `plano.js` | Meu Plano: ordem de urgência por regra fixa |
| `jornada.js`, `jornada-educacao.js`, `jornada-assistencia.js`, `jornada-ui.js` | Jornadas guiadas (Trabalho, Educação, Assistência) e currículo |
| `questionario.js`, `questionario-ui.js` | Questionário do Observatório (20 perguntas); envio desligado em `web/dados/coleta.json` |
| `mapa.js`, `mapa-servicos.js` | Mapa de serviços (Leaflet) e lógica de CEP, bairro e serviço mais próximo |
| `territorio.js` | Vista "Rio Claro em números" (setores censitários) |
| `entre-mulheres.js`, `entre-mulheres-ui.js` | Entre Mulheres: preparo do cadastro e tela |
| `painel.js`, `painel-ui.js` | Painel da Secretaria (agregação sem identificação; dados de teste) |

## Pipeline (`pipeline/*.py`)

| Script | Entrada | Saída | Bibliotecas |
|---|---|---|---|
| `baixar.py` | URLs do IBGE, INEP, CNES | `dados/bruto/` | stdlib (`urllib`, `zipfile`) |
| `common.py` | Utilidades compartilhadas (download com retomada, distância) | | pandas, numpy |
| `cnes.py` | Base completa do CNES | Diagnóstico e estabelecimentos de saúde | pandas |
| `indice_cep.py` | CNEFE 2022 | `web/dados/cep_indice.json` | pandas, numpy |
| `ceps_lista.py` | Lista de CEPs com coordenada | Dados para o índice | stdlib |
| `servicos.py` | `catalogo/servicos_manuais.csv`, CNES, INEP | `web/dados/catalogo_manual.json` e `servicos.json` | pandas |
| `geocodificar_catalogo.py` | Catálogo | Planilha de sugestões de CEP e coordenada | stdlib |
| `atualizar_localizacoes.py` | Catálogo, CNEFE, lista de CEPs | Localizações e mapa territorial | stdlib |
| `setores.py` | Shapefile de setores do IBGE | `web/dados/setores.geojson`, `setor_bairro.json` | pyshp |
| `territorio.py` | Censo 2022 por setor | `web/dados/territorio.json` | stdlib |
| `analise_territorial.py` | Setores e serviços | Distâncias e agrupamento | numpy, scikit-learn (KMeans) |
| `oferta_educacao_infantil.py` | Censo Escolar 2025 | `web/dados/oferta_educacao_infantil.json` | pandas |
| `ligar_catalogo_inep.py` | Catálogo e Censo | `catalogo/inep_escolas.csv` (sobrescreve; revisar antes) | stdlib |
| `horarios_onibus.py` | `catalogo/horarios_onibus.txt` | `web/dados/horarios_onibus.json` | stdlib |
| `treinar_necessidades.py`, `treinar_perigo.py`, `treinar_escopo.py` | Frases em `catalogo/` | Modelos em `web/dados/` | numpy, scikit-learn |
| `indice_orientacao.py` | Áreas, catálogo, horários | `web/dados/indice_orientacao.json` | numpy, scikit-learn |
| `verificar_catalogo.py` | Catálogo | Relatório de conferência com as páginas oficiais | stdlib |
| `inspecionar_arquivo.py` | Arquivos baixados | Estrutura (nunca os registros) | openpyxl |
| `preparar_versionamento.py` | Arquivos novos | `git add` seguro (tamanho, CPF, dado bruto) | stdlib |
| `testar_api.py` | `ANTHROPIC_API_KEY` | Resultado de uma chamada mínima | stdlib |
| `servidor_ia.py` | `web/`, `GEMINI_API_KEY` (ambiente ou `.env`) | Serve o site e o endereço `/api/ia` (explicação por Gemini, com limites e conferência da resposta) | stdlib (`http.server`, `urllib`) |
| `testar_gemini.py` | `GEMINI_API_KEY` (ambiente ou `.env`) | Resultado de uma chamada mínima; `--modelos` lista os modelos da chave | stdlib |

## Como executar

Site (Windows): duplo clique em `abrir_site.bat` (procura Python, escolhe porta livre de 8000 a 8010, serve `web/` e abre o navegador). Em qualquer sistema:

```
python pipeline/servidor_ia.py 8000
```
Abrir `http://localhost:8000`. O site funciona só com os arquivos versionados.

Instalar dependências do pipeline e dos testes:

```
python -m pip install -r requirements.txt
```

Testes:

```
PYTHONPATH=pipeline python -m pytest pipeline/tests -q          # Linux, macOS
$env:PYTHONPATH = "pipeline"; python -m pytest pipeline/tests    # PowerShell
for f in web/tests/*.test.js; do node $f || break; done          # Linux, macOS
foreach ($f in Get-ChildItem web\tests\*.test.js) { node $f.FullName }   # PowerShell
```

Avaliação do orientador:

```
python avaliacao/avaliar.py v2 --conjunto final        # também: desenvolvimento, teste, independente, reserva, todos
node avaliacao/avaliar_plano.js
```

Regerar dados e modelos (requer scikit-learn funcional):

```
python pipeline/servicos.py --somente-manual   # catálogo manual -> web/dados/catalogo_manual.json
python pipeline/indice_orientacao.py           # índice do orientador
python pipeline/treinar_necessidades.py
python pipeline/treinar_perigo.py
python pipeline/treinar_escopo.py
python pipeline/horarios_onibus.py
```

Pipeline com dados reais (internet, `dados/bruto/`): `baixar.py cnefe`, `baixar.py escolas`, `indice_cep.py`, `cnes.py docs/cnes`, `oferta_educacao_infantil.py`, `territorio.py`, `setores.py <zip>`, `geocodificar_catalogo.py`. Cada script documenta argumentos em `--help` e no cabeçalho.

Notas de ambiente:
- Windows: o padrão de texto do Python é cp1252. Chamadas a `subprocess` e leituras de arquivo usam `encoding="utf-8"` explícito.
- Políticas de controle de aplicativo do Windows podem bloquear DLLs do scikit-learn (`DLL load failed`). O teste `test_indice_orientacao.py` é ignorado nesse caso; o CI do GitHub o executa. Não reinstalar numpy ou scipy como tentativa de correção.
- `ligar_catalogo_inep.py --gravar` sobrescreve `catalogo/inep_escolas.csv`, que é revisado à mão.

## Testes e CI

- `pipeline/tests/`: pytest. Cobre pipeline, contrato dos dados (coordenada só com fonte, registro não conferido com aviso, ligações INEP), paridade Python e JavaScript dos modelos e da tokenização, integridade dos conjuntos de avaliação, dependências e README.
- `web/tests/`: Node. Cobre lógica das jornadas, necessidades, perigo, orientador, plano, mapa, questionário, painel, território, dashboard (portas, emergência, links locais, imagens), sintaxe de todos os scripts e comportamento de segurança da tela.
- `.github/workflows/testes.yml`: instala `requirements.txt`, roda pytest, os testes em Node, `avaliar.py v2 --conjunto todos` e `avaliar_plano.js` a cada push e pull request.
- Contagens de testes não são mantidas neste arquivo; a fonte é a saída do pytest e do CI.

## Privacidade e segurança

- O texto digitado e o CEP não são enviados nem gravados. Não há cookie, `localStorage`, `sessionStorage`, analytics nem chamada a API de IA.
- Únicas requisições: arquivos locais (GET) em `web/dados/`; tiles do OpenStreetMap, só com opt-in. O envio de respostas do questionário existe em `web/questionario-ui.js` e está desligado (`web/dados/coleta.json`: `ativa: false`).
- O site é `noindex`. O botão "Em perigo agora?" abre contatos oficiais (190, 192, 193, 180, 100, 188) e um botão de saída; sair não apaga o histórico do navegador.
- Em falha de rede, o alerta de perigo das regras continua funcionando (`alertaAgora` em `web/app.js`).

## Dados e catálogo

- `catalogo/servicos_manuais.csv` é a fonte de verdade dos serviços (campos obrigatórios: `tipo`, `nome`, `fonte_url`, `verificado_em`; `conferido` e `aviso` para itens sem confirmação). Depois de editar, rodar `python pipeline/servicos.py --somente-manual`.
- Coordenada só existe com fonte (`geo = coordenada_fonte`); localização por CEP é aproximada e nunca vira coordenada de fonte.
- Mapa completo de arquivos de dados, geradores e consumidores: [docs/mapa_de_dados.md](docs/mapa_de_dados.md).
- Verificar o catálogo contra as páginas oficiais (com internet): `python pipeline/verificar_catalogo.py`.

## Documentação

- [docs/funcionalidades.md](docs/funcionalidades.md): descrição funcional por área (trabalho, educação, saúde, mapa, jornadas, transporte).
- [docs/arquitetura_ia.md](docs/arquitetura_ia.md) e [docs/ia/avaliacao_orientacao.md](docs/ia/avaliacao_orientacao.md): arquitetura de IA, métricas e limites.
- [docs/mapa_de_dados.md](docs/mapa_de_dados.md), [docs/inventario_de_fontes.md](docs/inventario_de_fontes.md), [docs/documetacao/LEIA-ME.md](docs/documetacao/LEIA-ME.md): dados e fontes arquivadas.
- [docs/roteiro_teste_orientador.md](docs/roteiro_teste_orientador.md): roteiro de teste manual do orientador.
- [docs/plano_proximo_ciclo.md](docs/plano_proximo_ciclo.md), [docs/plano_fontes_externas_e_expansao.md](docs/plano_fontes_externas_e_expansao.md), [docs/analise_competitiva_mism3.md](docs/analise_competitiva_mism3.md), [docs/benchmark_externo_ideias_funcionais.md](docs/benchmark_externo_ideias_funcionais.md): planejamento e pesquisa.

## Manutenção deste README

Ao adicionar uma biblioteca, uma linguagem ou um arquivo de código em `web/` ou `pipeline/`, atualizar as tabelas acima. `pipeline/tests/test_dependencias.py` falha se uma dependência Python não estiver em `requirements.txt` e neste README, se a versão do Leaflet divergir, ou se um arquivo de `web/*.js` ou `pipeline/*.py` não for citado aqui. Sem emojis; linguagem direta e técnica.
