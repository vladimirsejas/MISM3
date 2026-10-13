"""Confere que nada do site/catálogo/pipeline/avaliação mudou desde a referência congelada.

    python laboratorio/verificar_intacto.py            # confere (sai com 1 se algo mudou)
    python laboratorio/verificar_intacto.py --gerar    # só para recriar a referência, de propósito
"""
import hashlib
import subprocess
import sys

from config import LAB, PROTEGIDOS, RAIZ

ARQUIVO = LAB / "protegidos.sha256"


def calcular() -> dict[str, str]:
    """Hash dos arquivos VERSIONADOS pelo Git nas pastas protegidas, ignorando a diferença CRLF/LF do Windows (arquivos soltos, como imagens novas ainda não commitadas, não contam)."""
    saida = subprocess.run(["git", "ls-files", "-z", "--", *PROTEGIDOS, "README.md", "requirements.txt"], cwd=RAIZ,
                           capture_output=True, check=True).stdout.decode("utf-8")
    return {n: hashlib.sha256((RAIZ / n).read_bytes().replace(b"\r\n", b"\n")).hexdigest() for n in sorted(saida.split("\0")) if n and (RAIZ / n).is_file()}


def ler() -> dict[str, str]:
    return {l.split("  ", 1)[1]: l.split("  ", 1)[0] for l in ARQUIVO.read_text(encoding="utf-8").splitlines() if l.strip()}


def main() -> int:
    sys.stdout.reconfigure(encoding="utf-8")
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
