"""O mapa de dados (docs/mapa_de_dados.md) só vale se todo caminho que ele cita existir."""
import re
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
DOC = RAIZ / "docs" / "mapa_de_dados.md"
EXT = r"(?:csv|json|js|py|md|txt|geojson|pdf)"


def test_todo_caminho_citado_no_mapa_existe():
    faltam = []
    for linha in DOC.read_text(encoding="utf-8").splitlines():
        if "não versionado" in linha:  # arquivos gerados só no computador de quem roda o pipeline
            continue
        for trecho in re.findall(r"`([^`]+)`", linha):
            for m in re.findall(r"((?:catalogo|web|docs|pipeline|avaliacao)/[\w./-]+\." + EXT + r")", trecho):
                if not (RAIZ / m).exists():
                    faltam.append(m)
        for m in re.findall(r"`(README\.md)`", linha):
            if not (RAIZ / m).exists():
                faltam.append(m)
    assert not faltam, f"caminhos do mapa que não existem: {sorted(set(faltam))}"


def test_mapa_cita_os_numeros_atuais():
    import json
    catalogo = json.loads((RAIZ / "web" / "dados" / "catalogo_manual.json").read_text(encoding="utf-8"))["servicos"]
    indice = json.loads((RAIZ / "web" / "dados" / "indice_orientacao.json").read_text(encoding="utf-8"))["unidades"]
    texto = DOC.read_text(encoding="utf-8")
    assert f"{len(catalogo)} serviços verificados" in texto
    assert f"{len(indice)} destinos" in texto
