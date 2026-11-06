"""Gera reproducao/AMBIENTE.md: versões instaladas, sistema, commit, comandos para repetir as avaliações e análise de reprodutibilidade dos modelos.

Não treina nada e não executa nenhuma avaliação. A parte sobre sementes vem da LEITURA do código de pipeline/treinar_*.py e pipeline/indice_orientacao.py
(as linhas citadas são extraídas por este script); onde não é possível concluir sem treinar, o resultado fica marcado como "não verificado".

Uso (da raiz do repositório):   python reproducao/gerar_ambiente.py
"""
from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import comum  # noqa: E402

RAIZ = comum.RAIZ


def nome_normal(n: str) -> str:
    return re.sub(r"[-_.]+", "-", n).lower()


def pacotes_do_requirements() -> list[str]:
    nomes = []
    for linha in (RAIZ / "requirements.txt").read_text(encoding="utf-8").splitlines():
        linha = linha.split("#")[0].strip()
        if linha:
            nomes.append(nome_normal(re.split(r"[<>=!~\[ ]", linha)[0]))
    return nomes


def freeze_filtrado() -> list[str]:
    alvo = set(pacotes_do_requirements()) | {"scipy"}  # scipy vem junto com scikit-learn (comentário do requirements.txt)
    saida = subprocess.run([sys.executable, "-m", "pip", "freeze"], capture_output=True, text=True, encoding="utf-8").stdout.splitlines()
    return sorted([l for l in saida if nome_normal(l.split("==")[0]) in alvo], key=str.lower)


def linhas_com(padroes: str, arquivos: list[Path]) -> list[str]:
    achadas = []
    rx = re.compile(padroes, re.IGNORECASE)
    for a in arquivos:
        for n, linha in enumerate(a.read_text(encoding="utf-8").splitlines(), 1):
            if rx.search(linha):
                achadas.append(f"`{a.relative_to(RAIZ).as_posix()}:{n}`: `{linha.strip()[:150]}`")
    return achadas


def kib(p: Path) -> str:
    b = p.stat().st_size
    return f"{b:,} B ({b / 1024:.0f} KiB)".replace(",", ".")


def main() -> None:
    meta = comum.versoes()
    trein = sorted((RAIZ / "pipeline").glob("treinar_*.py"))
    arquivos_modelo = [RAIZ / "web" / "dados" / n for n in ("modelo_necessidades.json", "modelo_escopo.json", "modelo_perigo.json", "indice_orientacao.json")]
    sementes = linhas_com(r"random_state|SEMENTE\s*=|random\.Random\(", trein + [RAIZ / "pipeline" / "indice_orientacao.py"])
    datas = linhas_com(r"date\.today|datetime|treinado_em", trein)
    liblinear = linhas_com(r"LogisticRegression\(", trein)

    md = ["# Ambiente e reprodutibilidade", "",
          "Este arquivo é gerado por `reproducao/gerar_ambiente.py` (não treina nada e não executa avaliação). "
          "A análise de sementes vem da leitura do código; o que não pôde ser concluído sem treinar está marcado como **não verificado**.", "",
          "## Ambiente desta execução", "",
          f"- Commit: `{meta['commit']}` (ramo `{meta['ramo']}`); alterações fora de `reproducao/`: {'nenhuma' if not meta['alteracoes_fora_de_reproducao'] else meta['alteracoes_fora_de_reproducao']}",
          f"- Sistema operacional: `{meta['sistema']}`",
          f"- Node: `{meta['node']}`",
          f"- Python: `{meta['python']}`",
          f"- Data da geração (UTC): {meta['data_utc']}", "",
          "Bibliotecas de `requirements.txt` (saída de `python -m pip freeze`, filtrada pelos pacotes do arquivo, mais `scipy`, que vem com o scikit-learn):", "", "```text"]
    md += freeze_filtrado()
    md += ["```", "",
           "O `requirements.txt` usa limites inferiores (`>=`), sem versões fixas. Portanto, uma instalação nova pode trazer versões diferentes das listadas acima. "
           "A integração contínua (`.github/workflows/testes.yml`) usa Python 3.12 e Node 20, e instala o que o `pip` resolver na hora; "
           "esta máquina usa Python " + meta["python"] + " e Node " + meta["node"] + ".", "",
           "## Comandos para repetir as avaliações existentes", "",
           "Da raiz do repositório (como na integração contínua):", "", "```bash",
           "PYTHONPATH=pipeline python -m pytest pipeline/tests -q",
           "for f in web/tests/*.test.js; do node \"$f\" || exit 1; done",
           "python avaliacao/avaliar.py v2 --conjunto desenvolvimento",
           "python avaliacao/avaliar.py v2 --conjunto teste",
           "node avaliacao/avaliar_plano.js", "```", "",
           "**Atenção:** `avaliacao/avaliar.py` chama `avaliacao/rodar_sistema.js`, que executa o sistema sobre **todas** as perguntas de `avaliacao/perguntas.json`, "
           "inclusive as dos conjuntos independente, reserva e final, mesmo quando só um conjunto é pedido com `--conjunto` (o relatório mostra apenas o conjunto pedido). "
           "Para executar somente desenvolvimento e teste, use os scripts desta pasta (`reproducao/ablacao.py` e `reproducao/metricas_por_necessidade.py`), que passam ao Node só essas perguntas. "
           "A integração contínua roda `python avaliacao/avaliar.py v2 --conjunto todos`. Nenhum desses comandos de avaliação foi executado em `avaliacao/` por esta pasta.", "",
           "Comandos desta pasta:", "", "```bash",
           "python reproducao/ablacao.py",
           "python reproducao/metricas_por_necessidade.py",
           "python reproducao/gerar_ambiente.py",
           "python -m pip install playwright && python -m playwright install chromium",
           "python reproducao/auditoria_privacidade.py", "```", "",
           "## Tamanho dos modelos e do índice", "", "| Arquivo | Tamanho |", "|---|---|"]
    md += [f"| `{a.relative_to(RAIZ).as_posix()}` | {kib(a)} |" for a in arquivos_modelo]
    total = sum(a.stat().st_size for a in arquivos_modelo)
    md += [f"| **Total** | {total:,} B ({total / 1024:.0f} KiB) |".replace(",", "."), "",
           "## Sementes e reprodutibilidade bit a bit dos modelos versionados", "",
           "Conclusão resumida: **não verificado** que `web/dados/modelo_*.json` e `web/dados/indice_orientacao.json` sejam reproduzíveis bit a bit, porque isso exige treinar de novo, o que esta tarefa não faz. "
           "A leitura do código mostra o seguinte.", "",
           "**O que está fixo (sementes no código):**", ""]
    md += [f"- {l}" for l in sementes]
    md += ["", "Há semente fixa para a embaralhada e a validação cruzada dos três treinos (`SEMENTE`, usada em `random.Random` e em `StratifiedKFold(..., random_state=SEMENTE)`) "
           "e para o SVD do índice (`TruncatedSVD(..., algorithm=\"arpack\", random_state=0)`).", "",
           "**O que não está fixo ou muda de uma execução para outra (pela leitura do código):**", "",
           "1. **Data gravada no modelo de necessidades (certo, pela leitura).** O treino de necessidades grava a data do dia:", ""]
    md += [f"   - {l}" for l in datas]
    md += ["", "   Por isso `web/dados/modelo_necessidades.json` (campo `meta.treinado_em`) e `docs/ia/avaliacao_modelo_necessidades.md` mudam de byte se o treino for repetido em outro dia, mesmo com os mesmos dados.",
           "2. **`random_state` não é passado ao `LogisticRegression` (efeito não verificado).** Os três treinos usam `solver=\"liblinear\"` sem `random_state`:", ""]
    md += [f"   - {l}" for l in liblinear]
    md += ["", "   Se esse solver usa sorteio no modo escolhido, o resultado poderia variar; não foi verificado e não pode ser afirmado sem treinar.",
           "3. **Versões de bibliotecas não fixas (certo, pelo `requirements.txt`).** Versões diferentes de scikit-learn, numpy ou scipy (inclusive o ARPACK usado no SVD) podem mudar números em casas decimais; "
           "os modelos arredondam os coeficientes a 4 a 6 casas, o que reduz mas não elimina a diferença.",
           "4. **Ordem de iteração de conjuntos de texto (não verificado).** O código usa `set` e `frozenset` em partes do pré-processamento; o efeito da aleatorização de hash do Python sobre a saída não foi verificado.", "",
           "**Observação de uma etapa anterior desta sessão (não repetida aqui):** ao treinar de novo os modelos de necessidades e de escopo sobre um commit sem alterar os dados, os arquivos de modelo apareceram como modificados no Git. "
           "A data do item 1 explica a diferença no modelo de necessidades; não foi investigada a diferença nos demais.", "",
           "**Como verificar depois (fora desta tarefa):** treinar duas vezes no mesmo dia, com as mesmas versões e `PYTHONHASHSEED=0`, e comparar `sha256sum` dos arquivos em `web/dados/`. "
           "Para tornar o resultado reproduzível sem depender do dia, a data teria de ser configurável, o que exigiria alterar `pipeline/` e por isso não foi feito.", ""]
    (RAIZ / "reproducao" / "AMBIENTE.md").write_text("\n".join(md) + "\n", encoding="utf-8", newline="\n")
    print("ok: reproducao/AMBIENTE.md")


if __name__ == "__main__":
    main()
