"""Liga as escolas do catálogo ao código INEP, para mostrar no cartão as etapas que a escola oferece.

O catálogo diz, com honestidade, que a página da Prefeitura "não diz quais etapas a escola atende". O Censo Escolar
2025 (web/dados/oferta_educacao_infantil.json) diz se cada escola oferece creche e pré-escola. Falta só ligar uma
coisa à outra, e o catálogo não tem o código INEP.

Regra de segurança: só liga quando o nome bate EXATAMENTE depois de normalizar (sem acento, sem "E.M.", "Escola",
"Municipal" etc., palavras em qualquer ordem) e quando a ligação é 1 para 1. Nome parecido não liga. O que sobra é
listado para revisão humana e não recebe nenhuma informação no site.

Uso:
    python pipeline/ligar_catalogo_inep.py            # mostra os pares e o que sobrou; não grava nada
    python pipeline/ligar_catalogo_inep.py --gravar   # grava catalogo/inep_escolas.csv (revise o arquivo antes de publicar)
    python pipeline/ligar_catalogo_inep.py --gravar --incluir-quase-iguais   # inclui também os "talvez" de 95% ou mais
                                                      # (diferença de uma letra: Neto/Netto, Sousa/Souza), marcados no arquivo
"""
from __future__ import annotations

import argparse
import csv
import json
import re
import sys
import unicodedata
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import CATALOGO, WEB_DADOS, erro  # noqa: E402

DESTINO = CATALOGO / "inep_escolas.csv"
CAMPOS = ["id", "inep", "nome_catalogo", "nome_censo", "metodo"]
# palavras que não identificam a escola (só o tipo dela); o resto do nome precisa bater por inteiro
PALAVRAS_DE_TIPO = {"e", "m", "em", "emei", "cmei", "escola", "municipal", "de", "da", "do", "dos", "das", "educacao",
                    "infantil", "ensino", "fundamental", "centro", "creche",
                    # títulos: o catálogo escreve "Profª", o Censo "PROFESSORA"; não identificam a escola
                    "prof", "profa", "professor", "professora", "dr", "dra", "doutor", "doutora"}
SIMILARIDADE_TALVEZ = 0.9  # nomes quase iguais (Sousa/Souza, Neto/Netto): só sugestão, nunca ligação


def sem_acento(texto: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", str(texto)) if unicodedata.category(c) != "Mn")


def palavras(nome: str) -> tuple[str, ...]:
    """Palavras que identificam a escola, em ordem alfabética ('Dom Pedro I' e 'PEDRO DOM I' dão o mesmo resultado)."""
    tokens = re.findall(r"[a-z0-9]+", sem_acento(nome).lower().replace(".", ""))
    return tuple(sorted(t for t in tokens if t not in PALAVRAS_DE_TIPO))


def ligar(servicos: list[dict], escolas: list[dict]) -> tuple[list[dict], list[dict], list[dict]]:
    """Devolve (pares, servicos_sem_par, escolas_sem_par). Só entram pares 1 para 1 com o mesmo conjunto de palavras."""
    por_chave_censo: dict[tuple, list[dict]] = {}
    for e in escolas:
        por_chave_censo.setdefault(palavras(e["nome"]), []).append(e)
    por_chave_catalogo = Counter(palavras(s["nome"]) for s in servicos)
    pares, sem_par = [], []
    usados = set()
    for s in servicos:
        chave = palavras(s["nome"])
        candidatas = por_chave_censo.get(chave, [])
        if chave and len(candidatas) == 1 and por_chave_catalogo[chave] == 1:
            e = candidatas[0]
            pares.append({"id": s["id"], "inep": e["inep"], "nome_catalogo": s["nome"], "nome_censo": e["nome"],
                          "metodo": "mesmas palavras"})
            usados.add(e["inep"])
        else:
            sem_par.append(s)
    return pares, sem_par, [e for e in escolas if e["inep"] not in usados]


def talvez(sem_par_catalogo: list[dict], sem_par_censo: list[dict]) -> list[tuple[dict, dict, float]]:
    """Pares quase iguais que a regra exata não ligou. Só para a pessoa conferir; nunca são gravados."""
    import difflib

    sugestoes = []
    for s in sem_par_catalogo:
        a = " ".join(palavras(s["nome"]))
        melhor = max(((difflib.SequenceMatcher(None, a, " ".join(palavras(e["nome"]))).ratio(), e) for e in sem_par_censo),
                     key=lambda x: x[0], default=(0, None))
        if melhor[1] is not None and melhor[0] >= SIMILARIDADE_TALVEZ:
            sugestoes.append((s, melhor[1], melhor[0]))
    return sugestoes


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--catalogo", type=Path, default=CATALOGO / "servicos_manuais.csv")
    ap.add_argument("--oferta", type=Path, default=WEB_DADOS / "oferta_educacao_infantil.json")
    ap.add_argument("--saida", type=Path, default=DESTINO)
    ap.add_argument("--gravar", action="store_true")
    ap.add_argument("--incluir-quase-iguais", action="store_true",
                    help="liga também os 'talvez' com 95%% ou mais de semelhança (marcados como 'grafia quase igual')")
    a = ap.parse_args()
    if not a.oferta.exists():
        erro("Não achei %s. Rode antes python pipeline/oferta_educacao_infantil.py." % a.oferta)
    with a.catalogo.open(encoding="utf-8", newline="") as f:
        servicos = [r for r in csv.DictReader(f) if r["tipo"] == "creche" and r["subtipo"] == "escola_municipal"]
    escolas = [e for e in json.loads(a.oferta.read_text(encoding="utf-8"))["escolas"] if e["rede"] == "municipal"]
    pares, sem_par, escolas_sem_par = ligar(servicos, escolas)
    print("%d escolas municipais no catálogo, %d no Censo (educação infantil, em atividade): %d ligadas." %
          (len(servicos), len(escolas), len(pares)))
    for p in pares:
        print("  OK  %-48s <-> %s" % (p["nome_catalogo"][:48], p["nome_censo"]))
    sugestoes = talvez(sem_par, escolas_sem_par)
    if sugestoes:
        print("\nTALVEZ (nomes quase iguais; NÃO foram ligados, confirme à mão):")
        for s, e, r in sugestoes:
            print("  ??  %-48s <-> %s  (%.0f%%)" % (s["nome"][:48], e["nome"], 100 * r))
    print("\nNo catálogo e SEM par no Censo (%d). Provavelmente só ensino fundamental, ou nome diferente; conferir:" % len(sem_par))
    for s in sem_par:
        print("  ?   %s" % s["nome"])
    print("\nNo Censo e SEM par no catálogo (%d):" % len(escolas_sem_par))
    for e in escolas_sem_par:
        print("  ?   %s" % e["nome"])
    if a.incluir_quase_iguais:
        for s_, e_, r_ in sugestoes:
            if r_ >= 0.95:
                pares.append({"id": s_["id"], "inep": e_["inep"], "nome_catalogo": s_["nome"], "nome_censo": e_["nome"],
                              "metodo": "grafia quase igual"})
    if a.gravar:
        with a.saida.open("w", encoding="utf-8", newline="") as f:
            w = csv.DictWriter(f, fieldnames=CAMPOS, lineterminator="\n")
            w.writeheader()
            w.writerows(pares)
        print("\nGravado %s (%d ligações)." % (a.saida, len(pares)))
    else:
        print("\nNada foi gravado. Use --gravar depois de conferir os pares.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
