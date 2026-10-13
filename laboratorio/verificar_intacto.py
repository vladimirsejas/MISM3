"""Confere que nada do site/catálogo/pipeline/avaliação mudou desde a referência congelada.

    python laboratorio/verificar_intacto.py            # confere (sai com 1 se algo mudou)
    python laboratorio/verificar_intacto.py --gerar    # só para recriar a referência, de propósito
"""
import hashlib
import sys

from config import LAB, PROTEGIDOS, RAIZ

ARQUIVO = LAB / "protegidos.sha256"


def calcular() -> dict[str, str]:
    h = {}
    for pasta in PROTEGIDOS:
        for f in sorted((RAIZ / pasta).rglob("*")):
            if f.is_file() and "__pycache__" not in f.parts and ".pytest_cache" not in f.parts and f.suffix != ".pyc":
                h[f.relative_to(RAIZ).as_posix()] = hashlib.sha256(f.read_bytes()).hexdigest()
    h["README.md"] = hashlib.sha256((RAIZ / "README.md").read_bytes()).hexdigest()
    h["requirements.txt"] = hashlib.sha256((RAIZ / "requirements.txt").read_bytes()).hexdigest()
    return h


def ler() -> dict[str, str]:
    return {l.split("  ", 1)[1]: l.split("  ", 1)[0] for l in ARQUIVO.read_text(encoding="utf-8").splitlines() if l.strip()}


def main() -> int:
    atual = calcular()
    if "--gerar" in sys.argv:
        ARQUIVO.write_text("".join(f"{v}  {k}\n" for k, v in sorted(atual.items())), encoding="utf-8")
        print(f"Referência gravada: {len(atual)} arquivos.")
        return 0
    ref = ler()
    mudou = sorted(k for k in ref if atual.get(k) != ref[k])
    novos = sorted(set(atual) - set(ref))
    for k in mudou:
        print("ALTERADO/REMOVIDO:", k)
    for k in novos:
        print("NOVO:", k)
    print(f"{'INTACTO' if not (mudou or novos) else 'DIFERENTE'}: {len(ref)} arquivos na referência.")
    return 0 if not (mudou or novos) else 1


if __name__ == "__main__":
    sys.exit(main())
