# Ambiente e reprodutibilidade

Este arquivo é gerado por `reproducao/gerar_ambiente.py` (não treina nada e não executa avaliação). A análise de sementes vem da leitura do código; o que não pôde ser concluído sem treinar está marcado como **não verificado**.

## Ambiente desta execução

- Commit: `fd7b371ba4ae4af8147e084f1e2b3623aa2ce160` (ramo `reproducao-e-auditoria`); alterações fora de `reproducao/`: nenhuma
- Sistema operacional: `Windows-11-10.0.26200-SP0`
- Node: `v24.14.0`
- Python: `3.14.3`
- Data da geração (UTC): 2026-11-06 01:48:36

Bibliotecas de `requirements.txt` (saída de `python -m pip freeze`, filtrada pelos pacotes do arquivo, mais `scipy`, que vem com o scikit-learn):

```text
numpy==2.4.3
openpyxl==3.1.5
pandas==3.0.1
pyshp==3.1.6
pytest==9.0.3
scikit-learn==1.9.1
scipy==1.18.1
```

O `requirements.txt` usa limites inferiores (`>=`), sem versões fixas. Portanto, uma instalação nova pode trazer versões diferentes das listadas acima. A integração contínua (`.github/workflows/testes.yml`) usa Python 3.12 e Node 20, e instala o que o `pip` resolver na hora; esta máquina usa Python 3.14.3 e Node v24.14.0.

## Comandos para repetir as avaliações existentes

Da raiz do repositório (como na integração contínua):

```bash
PYTHONPATH=pipeline python -m pytest pipeline/tests -q
for f in web/tests/*.test.js; do node "$f" || exit 1; done
python avaliacao/avaliar.py v2 --conjunto desenvolvimento
python avaliacao/avaliar.py v2 --conjunto teste
node avaliacao/avaliar_plano.js
```

**Atenção:** `avaliacao/avaliar.py` chama `avaliacao/rodar_sistema.js`, que executa o sistema sobre **todas** as perguntas de `avaliacao/perguntas.json`, inclusive as dos conjuntos independente, reserva e final, mesmo quando só um conjunto é pedido com `--conjunto` (o relatório mostra apenas o conjunto pedido). Para executar somente desenvolvimento e teste, use os scripts desta pasta (`reproducao/ablacao.py` e `reproducao/metricas_por_necessidade.py`), que passam ao Node só essas perguntas. A integração contínua roda `python avaliacao/avaliar.py v2 --conjunto todos`. Nenhum desses comandos de avaliação foi executado em `avaliacao/` por esta pasta.

Comandos desta pasta:

```bash
python reproducao/ablacao.py
python reproducao/metricas_por_necessidade.py
python reproducao/gerar_ambiente.py
python -m pip install playwright && python -m playwright install chromium
python reproducao/auditoria_privacidade.py
```

## Tamanho dos modelos e do índice

| Arquivo | Tamanho |
|---|---|
| `web/dados/modelo_necessidades.json` | 674.659 B (659 KiB) |
| `web/dados/modelo_escopo.json` | 337.806 B (330 KiB) |
| `web/dados/modelo_perigo.json` | 521.506 B (509 KiB) |
| `web/dados/indice_orientacao.json` | 697.831 B (681 KiB) |
| **Total** | 2.231.802 B (2179 KiB) |

## Sementes e reprodutibilidade bit a bit dos modelos versionados

Conclusão resumida: **não verificado** que `web/dados/modelo_*.json` e `web/dados/indice_orientacao.json` sejam reproduzíveis bit a bit, porque isso exige treinar de novo, o que esta tarefa não faz. A leitura do código mostra o seguinte.

**O que está fixo (sementes no código):**

- `pipeline/treinar_escopo.py:32`: `SEMENTE = 20261013`
- `pipeline/treinar_escopo.py:67`: `rng = random.Random(SEMENTE)`
- `pipeline/treinar_escopo.py:81`: `for tr, te in StratifiedKFold(5, shuffle=True, random_state=SEMENTE).split(X, Y):`
- `pipeline/treinar_necessidades.py:42`: `SEMENTE = 20261011`
- `pipeline/treinar_necessidades.py:192`: `rng = random.Random(SEMENTE)`
- `pipeline/treinar_perigo.py:37`: `SEMENTE = 20261013`
- `pipeline/treinar_perigo.py:71`: `rng = random.Random(SEMENTE)`
- `pipeline/treinar_perigo.py:95`: `for tr, te in StratifiedKFold(5, shuffle=True, random_state=SEMENTE).split(frases, rot):`
- `pipeline/indice_orientacao.py:330`: `svd = TruncatedSVD(K_LSA, algorithm="arpack", random_state=0)`

Há semente fixa para a embaralhada e a validação cruzada dos três treinos (`SEMENTE`, usada em `random.Random` e em `StratifiedKFold(..., random_state=SEMENTE)`) e para o SVD do índice (`TruncatedSVD(..., algorithm="arpack", random_state=0)`).

**O que não está fixo ou muda de uma execução para outra (pela leitura do código):**

1. **Data gravada no modelo de necessidades (certo, pela leitura).** O treino de necessidades grava a data do dia:

   - `pipeline/treinar_necessidades.py:26`: `from datetime import date`
   - `pipeline/treinar_necessidades.py:234`: `"Gerado por `pipeline/treinar_necessidades.py` em %s. **Leia com as limitações abaixo.**" % date.today().isoformat(), "",`
   - `pipeline/treinar_necessidades.py:280`: `meta=dict(versao=1, treinado_em=date.today().isoformat(), tipo="regressão logística (um contra todos) sobre n-gramas de caracteres e palavras, TF-IDF"`

   Por isso `web/dados/modelo_necessidades.json` (campo `meta.treinado_em`) e `docs/ia/avaliacao_modelo_necessidades.md` mudam de byte se o treino for repetido em outro dia, mesmo com os mesmos dados.
2. **`random_state` não é passado ao `LogisticRegression` (efeito não verificado).** Os três treinos usam `solver="liblinear"` sem `random_state`:

   - `pipeline/treinar_escopo.py:74`: `clf = LogisticRegression(C=12.0, class_weight="balanced", solver="liblinear", max_iter=2000).fit(vet.fit_transform(XA), YA)`
   - `pipeline/treinar_necessidades.py:126`: `clf = OneVsRestClassifier(LogisticRegression(C=12.0, class_weight="balanced", solver="liblinear", max_iter=1000))`
   - `pipeline/treinar_perigo.py:83`: `clfs[t] = LogisticRegression(C=12.0, class_weight="balanced", solver="liblinear", max_iter=2000).fit(M, y)`

   Se esse solver usa sorteio no modo escolhido, o resultado poderia variar; não foi verificado e não pode ser afirmado sem treinar.
3. **Versões de bibliotecas não fixas (certo, pelo `requirements.txt`).** Versões diferentes de scikit-learn, numpy ou scipy (inclusive o ARPACK usado no SVD) podem mudar números em casas decimais; os modelos arredondam os coeficientes a 4 a 6 casas, o que reduz mas não elimina a diferença.
4. **Ordem de iteração de conjuntos de texto (não verificado).** O código usa `set` e `frozenset` em partes do pré-processamento; o efeito da aleatorização de hash do Python sobre a saída não foi verificado.

**Observação de uma etapa anterior desta sessão (não repetida aqui):** ao treinar de novo os modelos de necessidades e de escopo sobre um commit sem alterar os dados, os arquivos de modelo apareceram como modificados no Git. A data do item 1 explica a diferença no modelo de necessidades; não foi investigada a diferença nos demais.

**Como verificar depois (fora desta tarefa):** treinar duas vezes no mesmo dia, com as mesmas versões e `PYTHONHASHSEED=0`, e comparar `sha256sum` dos arquivos em `web/dados/`. Para tornar o resultado reproduzível sem depender do dia, a data teria de ser configurável, o que exigiria alterar `pipeline/` e por isso não foi feito.

