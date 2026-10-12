"""Dependências e README: o que o README diz sobre bibliotecas e arquivos de código precisa bater com o código.
Se um destes testes falhar, atualize o README (e requirements.txt, se for biblioteca nova)."""
import ast
import glob
import re
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
README = (RAIZ / "README.md").read_text(encoding="utf-8")
STD = set(sys.stdlib_module_names)
# módulo importado -> nome do pacote no pip
PACOTE = {"sklearn": "scikit-learn", "shapefile": "pyshp", "pandas": "pandas", "numpy": "numpy", "openpyxl": "openpyxl", "pytest": "pytest"}
LOCAIS = {Path(f).stem for f in glob.glob(str(RAIZ / "pipeline" / "*.py"))} | {"conftest"}


def bibliotecas_de(arquivo: Path) -> set[str]:
    achadas = set()
    for no in ast.walk(ast.parse(arquivo.read_text(encoding="utf-8"))):
        mods = []
        if isinstance(no, ast.Import):
            mods = [a.name.split(".")[0] for a in no.names]
        elif isinstance(no, ast.ImportFrom) and no.level == 0 and no.module:
            mods = [no.module.split(".")[0]]
        for m in mods:
            if m in PACOTE:
                achadas.add(PACOTE[m])
            elif m not in STD and m not in LOCAIS and m != "__future__":
                raise AssertionError(f"{arquivo.name}: biblioteca de terceiros '{m}' sem mapeamento em test_dependencias.py/requirements.txt/README")
    return achadas


def requisitos() -> set[str]:
    nomes = set()
    for linha in (RAIZ / "requirements.txt").read_text(encoding="utf-8").splitlines():
        linha = linha.split("#")[0].strip()
        if linha:
            nomes.add(re.split(r"[<>=!~ ]", linha)[0].lower())
    return nomes


def test_toda_biblioteca_usada_esta_em_requirements_e_no_readme():
    usadas = set()
    for f in glob.glob(str(RAIZ / "pipeline" / "*.py")) + glob.glob(str(RAIZ / "pipeline" / "tests" / "*.py")) + glob.glob(str(RAIZ / "avaliacao" / "*.py")):
        usadas |= bibliotecas_de(Path(f))
    req = requisitos()
    assert usadas <= req, f"em uso e fora de requirements.txt: {sorted(usadas - req)}"
    assert req <= usadas | {"scipy"}, f"em requirements.txt e sem uso no código: {sorted(req - usadas)}"
    faltam = [b for b in sorted(req) if b.lower() not in README.lower()]
    assert not faltam, f"bibliotecas de requirements.txt que o README não cita: {faltam}"


def test_tabela_do_pipeline_do_readme_bate_com_os_imports():
    secao = README.split("## Pipeline (`pipeline/*.py`)")[1].split("\n## ")[0]
    for linha in secao.splitlines():
        if not linha.startswith("| `"):
            continue
        celulas = [c.strip() for c in linha.strip().strip("|").split("|")]
        scripts = re.findall(r"`([a-z_]+\.py)`", celulas[0])
        declaradas = {x.strip().lower() for x in re.sub(r"\(.*?\)", "", celulas[-1]).split(",")} - {"stdlib", ""}
        for s in scripts:
            reais = {b.lower() for b in bibliotecas_de(RAIZ / "pipeline" / s)}
            assert reais == declaradas, f"README, tabela do pipeline: {s} declara {sorted(declaradas)}, o código importa {sorted(reais)}"


def test_todo_arquivo_de_codigo_esta_descrito_no_readme():
    faltam = []
    for padrao in ("web/*.js", "pipeline/*.py"):
        for f in sorted(glob.glob(str(RAIZ / padrao))):
            if not re.search(r"(?<![\w.-])" + re.escape(Path(f).name) + r"(?![\w])", README):  # nome exato (plano.js não vale por avaliar_plano.js)
                faltam.append(str(Path(f).relative_to(RAIZ)))
    assert not faltam, f"arquivos de código que o README não descreve: {faltam}"


def test_versao_do_leaflet_no_readme():
    cabecalho = (RAIZ / "web" / "vendor" / "leaflet.js").read_text(encoding="utf-8")[:300]
    versao = re.search(r"Leaflet (\d+\.\d+\.\d+)", cabecalho).group(1)
    assert f"Leaflet {versao}" in README, f"README deve citar Leaflet {versao}"


def test_readme_sem_emojis():
    emojis = re.findall("[\U0001F300-\U0001FAFF☀-➿⭐✅❌]", README)
    assert not emojis, f"README sem emojis; encontrado: {emojis}"


def test_links_locais_do_readme_existem():
    quebrados = []
    for alvo in re.findall(r"\]\(([^)#]+?)(?:#[^)]*)?\)", README):
        if alvo.startswith(("http", "mailto")):
            continue
        if not (RAIZ / alvo).exists():
            quebrados.append(alvo)
    assert not quebrados, f"links do README para arquivos que não existem: {quebrados}"


def test_arquivos_citados_em_crases_no_readme_existem():
    """Todo caminho entre crases com diretório (web/..., pipeline/..., docs/...) precisa existir; exceções: pastas e arquivos gerados fora do Git."""
    ignorar = {"dados/bruto/", "web/dados/servicos.json", "web/dados/cep_indice.json", "docs/cnes", "dados/bruto"}
    faltam = []
    for caminho in re.findall(r"`((?:web|pipeline|catalogo|docs|avaliacao)/[\w./-]+)`", README):
        if caminho in ignorar or "*" in caminho or caminho.endswith("/"):
            continue
        if not (RAIZ / caminho).exists():
            faltam.append(caminho)
    assert not faltam, f"caminhos citados no README que não existem: {sorted(set(faltam))}"
