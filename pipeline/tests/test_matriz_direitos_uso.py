"""Valida rastreabilidade e decisões de publicação para dados e mídia do repositório."""
import csv
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MATRIX = ROOT / "docs" / "MATRIZ_DIREITOS_DE_USO.csv"
MANIFEST = ROOT / "docs" / "PACOTE_PUBLICACAO.csv"
ALLOWED = {"PODE SER PUBLICADO", "PODE SER PUBLICADO SOMENTE AGREGADO"}
EXTENSIONS = {
    ".csv", ".json", ".geojson", ".txt", ".pdf", ".webp", ".png", ".jpg",
    ".jpeg", ".svg", ".sha256", ".parquet", ".xlsx", ".ods", ".gpkg",
    ".zip", ".shp", ".dbf", ".shx", ".gif", ".ico", ".woff", ".woff2",
    ".ttf", ".otf", ".mp3", ".mp4", ".webm", ".avif", ".tif", ".tiff", ".xml",
}
IGNORED = {".git", ".venv", "venv", "node_modules", "__pycache__"}


def read_csv(path):
    with path.open(encoding="utf-8-sig", newline="") as stream:
        return list(csv.DictReader(stream))


def data_media_paths():
    for path in ROOT.rglob("*"):
        if not path.is_file() or any(part in IGNORED for part in path.parts):
            continue
        if path.suffix.lower() in EXTENSIONS:
            yield path.relative_to(ROOT).as_posix()


def test_every_data_or_media_file_has_matrix_row():
    matrix = {row["arquivo ou fonte"] for row in read_csv(MATRIX)}
    missing = sorted(set(data_media_paths()) - matrix)
    assert not missing, "Arquivos de dados/mídia sem linha na matriz: " + ", ".join(missing)


def test_every_data_or_media_file_has_manifest_decision():
    matrix = {row["arquivo ou fonte"]: row for row in read_csv(MATRIX)}
    manifest = {row["arquivo ou fonte"]: row for row in read_csv(MANIFEST)}
    paths = set(data_media_paths())
    missing = sorted(paths - set(manifest))
    assert not missing, "Arquivos sem status no manifesto: " + ", ".join(missing)
    errors = []
    for path in sorted(paths):
        decision = matrix[path]["DECISÃO"]
        included = manifest[path]["inclusão no pacote"].strip().lower() == "sim"
        if included and decision not in ALLOWED:
            errors.append(f"{path}: incluído com decisão {decision}")
        if included and not manifest[path]["DECISÃO"] == decision:
            errors.append(f"{path}: decisão do manifesto diverge da matriz")
    assert not errors, "Manifesto incompatível com a matriz: " + "; ".join(errors)


def test_inep_public_output_is_only_aggregated():
    matrix = {row["arquivo ou fonte"]: row for row in read_csv(MATRIX)}
    manifest = {row["arquivo ou fonte"]: row for row in read_csv(MANIFEST)}
    path = "web/dados/oferta_educacao_infantil.json"
    assert matrix[path]["DECISÃO"] == "PODE SER PUBLICADO SOMENTE AGREGADO"
    assert manifest[path]["inclusão no pacote"] == "sim"
    import json
    data = json.loads((ROOT / path).read_text(encoding="utf-8"))
    assert set(data) == {"meta", "totais_por_rede"}
    assert "escolas" not in data


def test_cep_index_is_cnefe_only_and_aggregated():
    import json
    matrix = {row["arquivo ou fonte"]: row for row in read_csv(MATRIX)}
    manifest = {row["arquivo ou fonte"]: row for row in read_csv(MANIFEST)}
    path = "web/dados/cep_indice.json"
    assert matrix[path]["DECISÃO"] == "PODE SER PUBLICADO SOMENTE AGREGADO"
    assert manifest[path]["inclusão no pacote"] == "sim"
    data = json.loads((ROOT / path).read_text(encoding="utf-8"))
    assert data["meta"]["fonte"].startswith("IBGE - Cadastro Nacional")
    assert data["meta"].get("ceps_so_da_lista", []) == []
    assert data["meta"]["ceps_sem_vinculo_setorial_verificavel_ou_protegido_omitidos"] >= 0
    assert data["meta"]["ceps_generalizados_por_poucos_enderecos"] >= 0
    assert all(len(cep) == 8 and cep.isdigit() for cep in data["ceps"])
    assert all(len(valor) == 5 and bool(valor[3]) for valor in data["ceps"].values())
