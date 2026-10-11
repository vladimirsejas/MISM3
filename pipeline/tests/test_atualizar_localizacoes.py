import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import atualizar_localizacoes as au  # noqa: E402


class Falso:
    def __init__(self, falha_em=None):
        self.chamadas, self.falha_em = [], falha_em

    def __call__(self, comando):
        self.chamadas.append(comando)
        return 1 if self.falha_em is not None and len(self.chamadas) == self.falha_em else 0


def nomes(f):
    return [Path(c[1]).name + (" " + c[2] if len(c) > 2 and c[2].startswith("--") else "") for c in f.chamadas]


def test_sem_confirmacao_nao_aplica_nada(monkeypatch):
    f = Falso()
    monkeypatch.setattr(au, "rodar", f)
    assert au.main([], confirmar=lambda _: "n") == 0
    assert "--aplicar-aprovadas" not in " ".join(nomes(f)) and len(f.chamadas) == 3


def test_confirmando_roda_todos_os_passos_na_ordem(monkeypatch):
    f = Falso()
    monkeypatch.setattr(au, "rodar", f)
    assert au.main([], confirmar=lambda _: "s") == 0
    assert nomes(f) == ["geocodificar_catalogo.py", "geocodificar_catalogo.py --marcar-altas",
                        "geocodificar_catalogo.py --marcar-baixas-cep", "geocodificar_catalogo.py --aplicar-aprovadas",
                        "servicos.py --somente-manual", "indice_cep.py", "territorio.py"]


def test_falha_antes_da_pausa_impede_aplicar(monkeypatch):
    f = Falso(falha_em=1)
    monkeypatch.setattr(au, "rodar", f)
    assert au.main(["--sim"]) == 1 and len(f.chamadas) == 1


def test_caminhos_viram_argumentos_do_geocodificador(monkeypatch):
    f = Falso()
    monkeypatch.setattr(au, "rodar", f)
    au.main(["--sim", "--cnefe", "a.zip", "--ceps-google", "b.csv"])
    assert f.chamadas[0][2:] == ["--cnefe", "a.zip", "--ceps-google", "b.csv"]
