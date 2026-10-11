"""Um comando só para localizar os serviços do catálogo e refazer o mapa territorial.

Encadeia, nesta ordem:
  1. geocodificar_catalogo.py      (CNEFE + lista de CEPs -> planilha de sugestões; não altera o catálogo)
  2. --marcar-altas e --marcar-baixas-cep   (escrevem 'aprovar' e LISTAM cada linha para você conferir)
  3. PAUSA: você confere a lista (ou abre a planilha e apaga 'aprovar' do que recusar) e digita 's' para continuar
  4. --aplicar-aprovadas           (só aqui o catálogo muda, e só campos vazios)
  5. servicos.py --somente-manual  (refaz web/dados/catalogo_manual.json)
  6. indice_cep.py                 (índice de CEP, completado com a lista de CEPs)
  7. territorio.py                 (refaz web/dados/territorio.json com as distâncias)

Uso:  python pipeline/atualizar_localizacoes.py          (pede confirmação)
      python pipeline/atualizar_localizacoes.py --sim    (não pergunta; só para scripts e testes)
"""
from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

AQUI = Path(__file__).resolve().parent


def passos(args_geo: list[str]) -> dict[str, list[list[str]]]:
    py = sys.executable
    return {
        "antes": [
            [py, str(AQUI / "geocodificar_catalogo.py"), *args_geo],
            [py, str(AQUI / "geocodificar_catalogo.py"), "--marcar-altas"],
            [py, str(AQUI / "geocodificar_catalogo.py"), "--marcar-baixas-cep"],
        ],
        "depois": [
            [py, str(AQUI / "geocodificar_catalogo.py"), "--aplicar-aprovadas"],
            [py, str(AQUI / "servicos.py"), "--somente-manual"],
            [py, str(AQUI / "indice_cep.py")],
            [py, str(AQUI / "territorio.py")],
        ],
    }


def rodar(comando: list[str]) -> int:
    print("\n$ " + " ".join(Path(c).name if i < 2 else c for i, c in enumerate(comando)))
    return subprocess.run(comando).returncode


def main(argv: list[str] | None = None, confirmar=input) -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--sim", action="store_true", help="não pergunta antes de aplicar (para scripts e testes)")
    ap.add_argument("--cnefe", type=Path, default=None)
    ap.add_argument("--ceps-google", type=Path, default=None)
    a = ap.parse_args(argv)
    args_geo = []
    if a.cnefe:
        args_geo += ["--cnefe", str(a.cnefe)]
    if a.ceps_google:
        args_geo += ["--ceps-google", str(a.ceps_google)]
    etapas = passos(args_geo)
    for c in etapas["antes"]:
        if rodar(c) != 0:
            print("\nPAROU: o passo acima falhou. Nada foi aplicado ao catálogo.")
            return 1
    if not a.sim:
        resposta = confirmar("\nConferiu a lista acima? Digite s para APLICAR ao catálogo, qualquer outra tecla para parar: ")
        if resposta.strip().lower() not in ("s", "sim"):
            print("Parado. O catálogo NÃO foi alterado. A planilha dados/geocodificacao_proposta.csv continua para você revisar.")
            return 0
    for c in etapas["depois"]:
        if rodar(c) != 0:
            print("\nPAROU: o passo acima falhou. Confira a mensagem e rode de novo.")
            return 1
    print("\nPronto. Confira web/dados/territorio.json e git status; depois faça commit.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
