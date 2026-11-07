# Manifesto da execução única do conjunto congelado v1

Execução principal única; nenhuma saída parcial será inspecionada para orientar mudanças.

Este manifesto foi preenchido na Etapa A (preparação), **antes** de qualquer execução do sistema sobre o conjunto congelado. As decisões de método abaixo são PRÉ-REGISTRO: foram tomadas antes de qualquer execução e não serão alteradas com base nos resultados.

- Data e hora (UTC) da geração: 2026-11-07 03:25:09
- Responsável pelo congelamento: Vladimir Queiroz Sejas (autor).

## 1. Integridade

- SHA-256 de `protocolo/conjunto_congelado_v1.json`: `abbae38d3cc39a8428130c09ac59d65c96cff497112481a9eadcf3ac9227ae00` (esperado `abbae38d3cc39a8428130c09ac59d65c96cff497112481a9eadcf3ac9227ae00`: confere)
- SHA-256 do arquivo de hash `protocolo/CONJUNTO_CONGELADO_v1.sha256`: `377a7f5c1de637a509e0f5b547d76991f6e6e42737a69af93a393e077f7a3ee3`
- Gabarito: está no próprio arquivo do conjunto (mesmo SHA-256). n = 190.
- Commit da etiqueta `v1.0-pesquisa`: `2d8a836cdc8e700500b67c2b6433bc26c4fd9fdd`
- Commit de `origin/main` usado: `44520b8d5d07f9a2ba275fcea3dba44ffec32d05`; commit-base do ramo `execucao/conjunto-v1-preparacao` na geração: `c7d89d4f083c978be50b11826e18f4671f34dee5` (o commit que traz o adaptador e este manifesto vem logo depois)
- O código do sistema avaliado é o da etiqueta; `web/dados/` (modelos e índice), `pipeline/`, `catalogo/` e `avaliacao/` da `main` são idênticos aos da etiqueta, exceto arquivos novos do mapa territorial (fora do sistema avaliado): `web/dados/indicadores_territoriais.json`, `pipeline/territorial_*.py` e seus testes. Os scripts de `reproducao/` vêm da `main`. Observação: `web/escopo.js` não existe no repositório (o detector de escopo é `criarClassificador` em `web/ia.js`, com o modelo `web/dados/modelo_escopo.json`).

## 2. Ambiente

- Python `3.14.3`; Node `v24.14.0`; sistema `Windows-11-10.0.26200-SP0`; arquitetura `AMD64` (64bit)
- Bibliotecas do interpretador que executará a Etapa B (`python -m pip freeze`; o adaptador e a execução só usam a biblioteca padrão do Python e o Node):

```text
altair==6.3.0
anaconda==0.0.1.1
annotated-types==0.7.0
anyio==4.15.1
argon2-cffi==25.1.0
argon2-cffi-bindings==25.1.0
arrow==1.4.0
asttokens==3.0.1
async-lru==2.2.0
attrs==25.4.0
babel==2.18.0
beautifulsoup4==4.14.3
bleach==6.3.0
certifi==2026.2.25
cffi==2.0.0
charset-normalizer==3.4.5
click==8.5.0
cloudpickle==3.1.2
colorama==0.4.6
comm==0.2.3
contourpy==1.4.0
cramjam==2.12.1
cryptography==50.0.1
cycler==0.12.1
debugpy==1.8.20
decorator==5.2.1
defusedxml==0.7.1
distro==1.9.0
duckdb==2.0.0
et_xmlfile==2.0.0
executing==2.2.1
Faker==40.11.1
fastapi==0.104.1
fastjsonschema==2.21.2
fastparquet==2026.5.0
filelock==4.2.4
fonttools==4.65.0
fqdn==1.5.1
fsspec==2026.7.0
geopandas==1.2.0
google-auth==2.58.0
google-genai==2.24.0
greenlet==3.4.0
h11==0.16.0
hf-xet==1.7.0
httpcore==1.0.9
httpcore2==2.13.0
httptools==0.8.0
httpx==0.28.1
httpx2==2.13.0
huggingface_hub==2.4.0
idna==3.20
iniconfig==2.3.0
ipykernel==7.2.0
ipython==9.11.0
ipython_pygments_lexers==1.1.1
ipywidgets==8.1.8
isoduration==20.11.0
itsdangerous==2.2.0
jedi==0.19.2
Jinja2==3.1.6
jiter==0.17.0
joblib==1.6.0
json5==0.13.0
jsonpointer==3.0.0
jsonschema==4.26.0
jsonschema-specifications==2025.9.1
jupyter==1.1.1
jupyter-console==6.6.3
jupyter-events==0.12.0
jupyter-lsp==2.3.0
jupyter_client==8.8.0
jupyter_core==5.9.1
jupyter_server==2.17.0
jupyter_server_terminals==0.5.4
jupyterlab==4.5.6
jupyterlab_pygments==0.3.0
jupyterlab_server==2.28.0
jupyterlab_widgets==3.0.16
kiwisolver==1.5.1
lark==1.3.1
markdown-it-py==4.2.0
MarkupSafe==3.0.3
matplotlib==3.11.2
matplotlib-inline==0.2.1
mdurl==0.1.2
mistune==3.2.0
narwhals==2.27.1
nbclient==0.10.4
nbconvert==7.17.0
nbformat==5.10.4
nest-asyncio==1.6.0
notebook==7.5.5
notebook_shim==0.2.4
numpy==2.4.3
openai==3.16.0
openpyxl==3.1.5
packaging==26.0
pandas==3.0.1
pandocfilters==1.5.1
parso==0.8.6
pillow==12.3.0
platformdirs==4.9.4
plotly==7.1.0
pluggy==1.6.0
prometheus_client==0.24.1
prompt_toolkit==3.0.52
protobuf==7.36.1
psutil==7.2.2
psycopg2-binary==2.9.12
pure_eval==0.2.3
pyarrow==25.0.1
pyasn1==0.6.4
pyasn1_modules==0.4.2
pycparser==3.0
pydantic==2.13.4
pydantic_core==2.46.4
pydeck==0.9.3
Pygments==2.19.2
pyogrio==0.13.0
pyparsing==3.3.2
pypdf==6.20.0
pyproj==3.8.0
pyshp==3.1.6
pytest==9.0.3
python-dateutil==2.9.0.post0
python-dotenv==1.2.2
python-json-logger==4.0.0
python-multipart==0.0.32
python-vlc==3.0.21203
pywinpty==3.0.3
PyYAML==6.0.3
pyzmq==27.1.0
redis==7.4.0
referencing==0.37.0
requests==2.32.5
rfc3339-validator==0.1.4
rfc3986-validator==0.1.1
rfc3987-syntax==1.1.0
rich==15.0.0
rpds-py==0.30.0
scikit-learn==1.9.1
scipy==1.18.1
Send2Trash==2.1.0
setuptools==84.0.0
shapely==2.2.0
six==1.17.0
sniffio==1.3.1
soupsieve==2.8.3
spotipy==2.26.0
SQLAlchemy==2.0.49
stack-data==0.6.3
starlette==1.6.0
streamlit==1.64.0
tabulate==0.10.0
tenacity==9.1.4
terminado==0.18.1
threadpoolctl==3.7.0
tinycss2==1.4.0
toml==0.10.2
tornado==6.5.5
tqdm==4.70.1
traitlets==5.14.3
truststore==0.10.4
typing-inspection==0.4.2
typing_extensions==4.16.0
tzdata==2025.3
ucimlrepo==0.0.7
uri-template==1.3.0
urllib3==2.6.3
uvicorn==0.53.0
watchdog==6.0.0
wcwidth==0.6.0
webcolors==25.10.0
webencodings==0.5.1
websocket-client==1.9.0
websockets==16.1.1
wheel==0.48.0
widgetsnbextension==4.0.15
ytmusicapi==1.12.0
```

## 3. Comandos exatos

Da raiz do repositório, com `PYTHONHASHSEED=0` (definido antes de iniciar o Python):

```bash
export PYTHONHASHSEED=0 PYTHONUTF8=1
python reproducao/conjunto_v1.py --conferir-conjunto      # Etapa A: só lê o gabarito
python reproducao/conjunto_v1.py --validar                # Etapa A: dev/teste contra ablacao_depois.csv + subconjunto sintético
python reproducao/conjunto_v1.py --etapa-b --confirmo-etapa-b-autorizada   # Etapa B (única execução; só após autorização escrita)
```

Cada condição é executada por `reproducao/rodar_variantes.js --condicao <nome>` (as 9 primeiras) ou por `ablacao.rodar_tfidf` (linha de base), com as perguntas do conjunto entregues por arquivo temporário:

- `completo`: Sistema completo. orientador v2, como no site (regras e modelo de necessidades, detector de perigo aprendido, detector de escopo, índice com palavras, letras e LSA).
- `apenas_regras`: Apenas regras (necessidade). o sinal de intenção vem só das regras lexicais de necessidade; sem o modelo de necessidades.
- `apenas_modelo_necessidades`: Apenas modelo de necessidades. o sinal de intenção vem só do modelo de necessidades; sem as regras lexicais.
- `sem_perigo_aprendido`: Híbrido sem detector de perigo aprendido. só as regras de segurança de perigo.js; sem o modelo de perigo.
- `sem_escopo`: Híbrido sem detector de escopo. sem o detector de escopo; só a nota da busca decide a abstenção.
- `sem_regras_lexicais_necessidade`: Sem regras lexicais de necessidade. remove as regras lexicais de necessidade do sinal de intenção (neste motor equivale a 'apenas modelo de necessidades': as regras só entram por esse sinal).
- `sem_ngramas_letras`: Sem n-gramas de caracteres do índice. peso do sinal de letras do índice = 0.
- `sem_lsa`: Sem LSA. peso do sinal de significado (LSA) do índice = 0.
- `sem_palavras`: Sem sinal de palavras do índice. peso do sinal de palavras do índice = 0.
- `linha_de_base_tfidf`: Linha de base: busca por palavras (TF-IDF). TF-IDF de palavras sobre o texto dos destinos, sem raízes, sem letras, sem LSA, sem classificador e sem detector; abstém só se nenhuma palavra casar.

## 4. Pré-registro das decisões de método

1. **Conversão:** texto = `frase`; especificos = `ids_oficiais`; áreas = áreas dos ids esperados no índice; perigo esperado = campo `perigo` começa com "Sim"; ação "Responder" = orientável, "Recusar" = fora do escopo, "Pedir esclarec." = vaga.
2. **Acerto específico:** algum dos 3 primeiros itens tem id igual a um esperado, ou, se o esperado é de tipo `classe`, o item tem o mesmo `svc` da classe. O id do item é recuperado pela chave única (area, sec, svc, titulo) do índice, porque `rodar_variantes.js` não devolve o id.
3. **Acerto de área:** algum dos 3 primeiros itens tem área no conjunto das áreas esperadas. Mensagens sem ids esperados não entram nos denominadores de Resposta@3.
4. **Especificidade de perigo:** denominador = negativas exceto "Pedir esclarec." (principal); a versão com todas as negativas é publicada. **Falso alarme:** FP / todas as negativas; a versão sem "Pedir esclarec." também é publicada.
5. **Abstenção correta:** "Recusar" em que o sistema se abstém ou não mostra item. **Abstenção indevida:** "Responder" em que o sistema se abstém ou não mostra item. Para "Pedir esclarec." publica-se a abstenção à parte; que o sistema "peça esclarecimento" é NÃO VERIFICADO (a saída tem só `abstem` e `geral`).
6. **Aviso discreto e alerta completo:** registrados pelo campo `nivel` da saída (1 = aviso discreto, 2 = alerta completo), conforme `web/perigo.js`.
7. **Matriz de confusão por área:** previsão = área do 1º item ou "abstenção"; se a previsão está entre as áreas esperadas, vai à diagonal dessa área; senão, à linha da primeira área esperada em ordem alfabética.
8. **Incerteza:** Wilson de 95% para proporções; bootstrap pareado por mensagem, 10.000 reamostragens, semente 20261106, percentil de 95% (posições 2,5% e 97,5% das médias ordenadas), as mesmas reamostragens para todas as condições, para MRR, Resposta@3 específica e diferenças.
9. **MRR:** recíproco da posição do primeiro item esperado em toda a lista devolvida, como em `comum.metricas`; zero se nenhum aparece. Precision@3, Recall@3, Macro-F1 e acurácia balanceada NÃO são calculadas nesta execução (a convenção de denominador não foi pré-definida no protocolo).
10. **Escolha da linha de base (protocolo, seção 3, condição 10):** TF-IDF simples, condição `linha_de_base_tfidf`. O protocolo permite BM25 apenas se houver implementação versionada disponível; a busca por "bm25" nos arquivos de código do repositório (`.py`, `.js`, `.json`; fora de `docs/` e `protocolo/`) em 07/11/2026 não encontrou nenhuma, por isso a escolha é TF-IDF. Ela é também a melhor linha de base lexical dos critérios de sucesso; comparações com as demais condições são publicadas como complementares.
11. **Sensibilidade:** todas as métricas repetidas sem C-123, C-041, C-088 e D-030; o resultado com os 190 registros é o principal.
12. **Critérios de sucesso (protocolo, seção 6), aplicados mecanicamente:** (1) diferença de Resposta@3 específica ≥ 5 pontos percentuais a favor de `completo` sobre `linha_de_base_tfidf`; (2) limite inferior do IC bootstrap pareado de 95% da diferença > 0; (3) revocação global de perigo ≥ 90% e sem piora superior a 5 pontos em relação à melhor condição de segurança; (4) falso alarme ≤ 5% (todas as negativas); (5) abstenção indevida ≤ 15%. Os textos pré-definidos do protocolo são anexados ao relatório quando se aplicam.

13. **Campo `ids_oficiais`:** se vier como texto no formato de lista do Python, é convertido com `ast.literal_eval` (nunca `eval`). Verificado em 07/11/2026 no arquivo congelado (mesmo SHA-256): as 190 entradas trazem `ids_oficiais` como lista JSON (e não como texto), então a conversão por `ast.literal_eval` está implementada e testada, mas não é exercida neste arquivo.

## 5. Mapeamento das condições do protocolo para as do código

As 10 condições do protocolo (seção 3) e as 10 de `reproducao/ablacao.py` NÃO coincidem uma a uma. Regras fixas, definidas antes de qualquer execução:

| Protocolo | Condição do protocolo | Condição do código | Situação |
|---|---|---|---|
| 1 | Completo | `completo` | implementada |
| 2 | Sem regras lexicais | `sem_regras_lexicais_necessidade` | mapeada por regra fixa |
| 3 | Sem n-gramas de caracteres | `sem_ngramas_letras` | implementada |
| 4 | Sem LSA | `sem_lsa` | implementada |
| 5 | Sem classificador de necessidades | `apenas_regras` | mapeada por regra fixa |
| 6 | Sem detector de perigo aprendido | `sem_perigo_aprendido` | implementada |
| 7 | Sem detector de escopo | `sem_escopo` | implementada |
| 8 | Apenas regras (só regras, sem busca estatística, LSA ou classificadores) | (nenhuma) | NÃO VERIFICADO: não implementada como o protocolo define |
| 9 | Apenas modelo (só componentes aprendidos) | (nenhuma) | NÃO VERIFICADO: não implementada como o protocolo define |
| 10 | Busca simples (BM25 ou TF-IDF) | `linha_de_base_tfidf` | implementada (TF-IDF; não há BM25 versionado) |
| (só no código) | `apenas_modelo_necessidades` | `apenas_modelo_necessidades` | complementar: é a mais próxima do protocolo 9, mas NÃO a implementa |
| (só no código) | `sem_palavras` | `sem_palavras` | exploratória, fora do protocolo; não entra nos critérios de sucesso |

Regras: (a) protocolo 1, 3, 4, 6, 7 e 10 = `completo`, `sem_ngramas_letras`, `sem_lsa`, `sem_perigo_aprendido`, `sem_escopo` e `linha_de_base_tfidf`; (b) protocolo 5 (sem classificador de necessidades) = `apenas_regras`; (c) protocolo 2 (sem regras lexicais) = `sem_regras_lexicais_necessidade`; (d) protocolo 8 e 9 NÃO estão implementados como o protocolo os define: NÃO VERIFICADO, e nenhuma variante nova foi criada; (e) `sem_palavras` existe só no código e é exploratória. Os critérios de sucesso usam apenas `completo` e `linha_de_base_tfidf`.

### Composição real de cada condição do código

- `completo`: orientador v2 como em `avaliacao/sistema_v2.js` (regras e modelo de necessidades, detector de perigo aprendido, detector de escopo, índice com palavras, letras e LSA).
- `apenas_regras` (protocolo 5): só o **sinal de intenção** vem das regras lexicais de necessidade, sem o modelo de necessidades. A busca estatística (palavras, letras, LSA), o detector de perigo aprendido e o detector de escopo continuam ativos. Por isso NÃO é a condição 8 do protocolo (só regras, sem busca estatística, LSA ou classificadores aprendidos).
- `apenas_modelo_necessidades` (complementar; a mais próxima do protocolo 9): só o sinal de intenção vem do modelo de necessidades (regressão logística), sem as regras lexicais de necessidade. O restante do sistema (busca por palavras, letras e LSA, detector de perigo aprendido e regras de perigo, detector de escopo) continua ativo. Por isso NÃO é a condição 9 do protocolo (só componentes aprendidos, sem pontes lexicais manuais): protocolo 9 NÃO VERIFICADO.
- `sem_regras_lexicais_necessidade` (protocolo 2): configuração idêntica à de `apenas_modelo_necessidades` neste motor, porque as regras lexicais de necessidade só entram pelo sinal de intenção. As "regras e pontes lexicais de orientação" de `web/orientar.js` que não passam por esse sinal continuam ativas; o isolamento exato da condição 2 não foi confirmado por teste dedicado.
- `sem_ngramas_letras` (protocolo 3) e `sem_lsa` (protocolo 4): o peso do sinal correspondente no índice vale 0 (o cálculo continua; só a contribuição na nota é anulada). A ausência de efeitos colaterais em outros sinais não foi confirmada por teste dedicado.
- `sem_palavras` (exploratória, fora do protocolo): peso do sinal de palavras do índice = 0.
- `sem_perigo_aprendido` (protocolo 6): não carrega `modelo_perigo.json`; permanecem as regras de segurança de `web/perigo.js`.
- `sem_escopo` (protocolo 7): não carrega o detector de escopo; só a nota da busca decide a abstenção.
- `linha_de_base_tfidf` (protocolo 10, Busca simples): TF-IDF de palavras sobre o campo `texto` dos destinos do índice; normalização NFD sem acentos, minúsculas, tokens com 2 ou mais caracteres; tf = 1 + log(contagem); idf = log((1 + N)/(1 + df)) + 1; vetores normalizados; similaridade do cosseno; até 6 itens com nota > 0; abstém só se nenhuma palavra casar; sem detector de perigo (revocação 0 por construção).

## 6. Parâmetros e limiares

- Sementes: bootstrap 20261106 (dez mil reamostragens); `PYTHONHASHSEED=0`. A validação do adaptador com desenvolvimento e teste usa a semente e as 2.000 reamostragens de `ablacao.py` (20261105) para reproduzir `ablacao_depois.csv`.
- Limiares do sistema: os dos modelos versionados (`web/dados/modelo_*.json`); nenhum é alterado.
- Limites dos critérios: {"diferenca_pp": 5.0, "revocacao_perigo": 0.9, "piora_revocacao_pp": 5.0, "falso_alarme": 0.05, "abstencao_indevida": 0.15}

## 7. SHA-256 dos arquivos usados

Modelos e índice:

| Arquivo | SHA-256 |
|---|---|
| `web/dados/modelo_escopo.json` | `8f029e26756541eac00bdca36276fcadd6c42690324cfbe2cb4b7aa218792b80` |
| `web/dados/modelo_necessidades.json` | `5c30dfe79ebcae17cad01db3368b23455eb47c2685c8ca030bcebeee535b34eb` |
| `web/dados/modelo_perigo.json` | `fe9197580bf0c26b022edc673014e9d0d2476957cfb1645efe8e52a044cc21ea` |
| `web/dados/indice_orientacao.json` | `f4417e85d598d6e25fc943b1c7e4b73865edfc738fded35527bcad60ac923afb` |

Código do orientador (`web/`):

| Arquivo | SHA-256 |
|---|---|
| `web/orientar.js` | `47c34a57c1af242d7bb25b77e22ea7bac495f651d1f6c2e7b6ff5a8c4fd46ea9` |
| `web/perigo.js` | `c6528fb534adc8951714a129b3385f1e48bdbbe0dbda47d6f07a64c85e22bff7` |
| `web/ia.js` | `489eccf3092c838ff6be735ab23c469a9a3d94a528cffbeb504407274ca59792` |
| `web/necessidades.js` | `884afb40f1570b1cb2158e8af265a9acbb33cdaa595c20b3644e00c53948a3e6` |
| `web/orientacao-ui.js` | `0eb84ee958d6f5b30bb166c58d723f5161fb07012aa6b381b601076964702006` |

Catálogo:

| Arquivo | SHA-256 |
|---|---|
| `catalogo/conferencia_visual_cras_2026-11-04.csv` | `b3b3e0476e3c4fd3a846b4f8f46a8035d37df0c88b7f0359bbb1b2d49dcc5deb` |
| `catalogo/conferencia_visual_escolas_2026-11-05.csv` | `ae4b501377f227b732c031878c7d9c22270269b08764d854a7096215879d1a0d` |
| `catalogo/conferencia_visual_ubs_usf_2026-11-04.csv` | `a2e49c237cd1c818e6513955d9381ebcb878da0183c8e06c8635e61c7fcafbba` |
| `catalogo/conferencia_visual_usf_pendentes_2026-11-04.csv` | `00086b3e46bb86cd2bbbd7b843f0782fa670a230bfeb8e29349352fc244222b5` |
| `catalogo/geocodificacao_proposta_2026-10.csv` | `43c670292147abe24c700ad7bcadd82babfffa20f5918e5ab9d55d783384dc41` |
| `catalogo/inep_escolas.csv` | `221a261b4e85dba1af219b862bb16e1c8affa93404219a86641d0890ecdf4751` |
| `catalogo/localizacao_registro.csv` | `0a6f81ca4f7d546ef7f00d844247af8b7e738c1259ac92c0ebb3a245bc5b59fe` |
| `catalogo/servicos_manuais.csv` | `503a16ba3da154fa64f70c9a4ec40b0dbbc754cc1525905a6e1acd9a8e1892fd` |
| `catalogo/frases_fora_do_escopo.txt` | `a75951d8ac88336ae845105680f67a8b4d4e1ea25c1624c44d4f2350a4c59ca7` |
| `catalogo/frases_necessidades.txt` | `ce7f68fef40a282469c23e49a08b220ed1794ab2c73dcd5c490abf727c592e51` |
| `catalogo/frases_perigo.txt` | `c9b7b03a897c034d028dca484562859d84b9e257cedee8041d824e341b2a1d2a` |
| `catalogo/horarios_onibus.txt` | `b992c5814c88fac198c8bc99c283020cd24461d6a72d403c717e2da45abdf5d6` |

Scripts de `reproducao/` usados:

| Arquivo | SHA-256 |
|---|---|
| `reproducao/ablacao.py` | `7de91fb67037225c1edcec838e57576a97cce94563e6d727f19c43c418597763` |
| `reproducao/auditoria_privacidade.py` | `c9a76ea0545ea483e2df80eadc19553f61911dce35ccb881b51bd4dcb6f69449` |
| `reproducao/auditoria_privacidade_cep.py` | `e164df108e12a0b07ae78b9d1a349593bc4c54f8e7b88d3f27345f5d86e8ed67` |
| `reproducao/comum.py` | `3469f86c15515dd6a4f591a44ab08232b4af1ce1222115ab295fca0b7476aa45` |
| `reproducao/conjunto_v1.py` | `f7c2553a9ef0ff5b013b3b075aa749c21e8ae6de1f4e43abc12919ea84e5dec7` |
| `reproducao/gerar_ambiente.py` | `6f0c014b6ac920dba4252d23c94b9f3714bea8557e7ef99bd880d9681aa08f85` |
| `reproducao/metricas_por_necessidade.py` | `7a356866f7d93cf37ca111d180aa52a310f90c0c67316a42b246c8d52136f471` |
| `reproducao/teste_conjunto_v1.py` | `769a6118b3d12eda0a222ac8aca172a0f944132facf7680f49d9c2987baf5ed0` |
| `reproducao/rodar_variantes.js` | `54f5a45ba70287c06789cca35712887c9be5f673374f938e6cf1ad620a8d4f34` |
