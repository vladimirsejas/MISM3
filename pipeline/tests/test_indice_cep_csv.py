import csv
from pathlib import Path

from pipeline.indice_cep_csv import construir_indice


def test_construir_indice_filtra_coordenada_fora_da_caixa_e_nao_exporta_endereco(tmp_path):
    csv_path = tmp_path / "ceps.csv"
    with csv_path.open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=["CEP", "Logradouro", "Bairro", "Latitude", "Longitude"],
            delimiter=";",
        )
        writer.writeheader()
        writer.writerow({"CEP": "13500010", "Logradouro": "Rua 2", "Bairro": "Saúde",
                         "Latitude": "-22.4155479", "Longitude": "-47.556792"})
        writer.writerow({"CEP": "13500020", "Logradouro": "Rua 3", "Bairro": "Centro",
                         "Latitude": "-22.4163246", "Longitude": "-47.5575959"})
        writer.writerow({"CEP": "13500030", "Logradouro": "Rua fora", "Bairro": "Centro",
                         "Latitude": "-23.2303365", "Longitude": "-45.9063457"})
        writer.writerow({"CEP": "13500040", "Logradouro": "", "Bairro": "Centro",
                         "Latitude": "", "Longitude": ""})

    indice, diagnostico = construir_indice(csv_path)

    assert set(indice) == {"13500010", "13500020"}
    assert indice["13500010"] == [-22.416, -47.557, 300, "", 1]
    assert diagnostico["linhas_csv"] == 4
    assert diagnostico["ceps_indexados"] == 2
    assert diagnostico["coordenadas_fora_da_caixa_de_triagem"] == 1
    assert all(len(registro) == 5 for registro in indice.values())
    assert all("Rua" not in str(registro) and "Centro" not in str(registro) for registro in indice.values())
