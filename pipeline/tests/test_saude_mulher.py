import csv
import json
import tempfile
import unittest
from pathlib import Path

from pipeline.saude_mulher import (
    FONTES,
    gerar_resumo,
    ler_contagens,
)


class SaudeMulherTests(unittest.TestCase):
    def test_agrega_por_ano_sem_guardar_linhas(self):
        with tempfile.TemporaryDirectory() as tmp:
            caminho = Path(tmp) / "base.csv"
            with caminho.open("w", encoding="utf-8-sig", newline="") as f:
                w = csv.DictWriter(f, fieldnames=["CEP", "IDADE", "DT_INTER"], delimiter=";")
                w.writeheader()
                for _ in range(6):
                    w.writerow({"CEP": "13500000", "IDADE": "50", "DT_INTER": "2023-05-10"})
                w.writerow({"CEP": "13500000", "IDADE": "52", "DT_INTER": "2024-02-01"})
            contagens, linhas = ler_contagens(caminho)
            self.assertEqual(linhas, 7)
            self.assertEqual(contagens[2023], 6)
            self.assertEqual(contagens[2024], 1)

    def test_suprime_grupo_pequeno_e_nao_exporta_cep(self):
        with tempfile.TemporaryDirectory() as tmp:
            pasta = Path(tmp)
            nome, _ = FONTES[0]
            with (pasta / nome).open("w", encoding="utf-8-sig", newline="") as f:
                w = csv.DictWriter(f, fieldnames=["CEP", "IDADE", "DT_INTER"], delimiter=";")
                w.writeheader()
                for _ in range(4):
                    w.writerow({"CEP": "13500000", "IDADE": "50", "DT_INTER": "2022-01-01"})
                for _ in range(5):
                    w.writerow({"CEP": "13500000", "IDADE": "50", "DT_INTER": "2023-01-01"})
            destino = pasta / "resumo.json"
            resumo = gerar_resumo(pasta, destino)
            dados = {x["ano"]: x for x in resumo["dados"]}
            self.assertIsNone(dados[2022]["registros"])
            self.assertIn("suprimido", dados[2022]["status"])
            self.assertEqual(dados[2023]["registros"], 5)
            texto = destino.read_text(encoding="utf-8")
            self.assertNotIn("13500000", texto)
            self.assertNotIn('"IDADE"', texto)
            self.assertNotIn('"CEP"', texto)
            self.assertFalse(resumo["meta"]["fonte_confirmada"])

    def test_rejeita_minimo_inseguro(self):
        with tempfile.TemporaryDirectory() as tmp:
            pasta = Path(tmp)
            nome, _ = FONTES[0]
            (pasta / nome).write_text("DT_INTER\n2022-01-01\n", encoding="utf-8")
            with self.assertRaises(ValueError):
                gerar_resumo(pasta, pasta / "resumo.json", minimo=1)


if __name__ == "__main__":
    unittest.main()
