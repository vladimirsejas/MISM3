"""Gera web/dados/horarios_onibus.json a partir de catalogo/horarios_onibus.txt (a fonte editavel e conferida).

  python pipeline/horarios_onibus.py              # valida e grava o JSON do site
  python pipeline/horarios_onibus.py --verificar  # so confere se o JSON versionado esta igual ao que o .txt gera

Validacoes: horario valido (00:00 a 23:59), em ordem crescente e sem repeticao dentro de cada quadro; sentido
(Ida/Volta) e dia (Dias uteis/Sabados/Domingos) conhecidos; toda variante usada tem trajeto na legenda; nenhum quadro
vazio. Se algo falhar, nada e gravado.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]
ORIGEM = RAIZ / "catalogo" / "horarios_onibus.txt"
DESTINO = RAIZ / "web" / "dados" / "horarios_onibus.json"
SENTIDOS = ("Ida", "Volta")
DIAS = {"Dias úteis": "segunda a sexta", "Sábados": "", "Domingos": ""}
HORA = re.compile(r"^(?:[01]\d|2[0-3]):[0-5]\d$")


class ErroDeDados(ValueError):
    pass


def ler(texto: str) -> dict:
    meta: dict[str, str] = {}
    legendas: dict[tuple[str, str], dict[int, str]] = {}
    quadros: list[dict] = []
    lacunas: list[str] = []
    nomes: dict[str, str] = {}
    for n, bruta in enumerate(texto.splitlines(), 1):
        linha = bruta.strip()
        if not linha or linha.startswith("#"):
            continue
        partes = [p.strip() for p in linha.split("|")]
        tipo = partes[0]
        try:
            if tipo == "meta":
                meta[partes[1]] = partes[2]
            elif tipo == "legenda":
                _, num, sentido, variante, trajeto = partes
                legendas.setdefault((num, sentido), {})[int(variante)] = trajeto
            elif tipo == "quadro":
                _, num, nome, sentido, dia, variante, horas = partes
                if nomes.setdefault(num, nome) != nome:
                    raise ErroDeDados("a linha %s aparece com dois nomes: %s e %s" % (num, nomes[num], nome))
                quadros.append(dict(linha=num, nome=nome, sentido=sentido, dia=dia, variante=int(variante), horarios=horas.split(), n=n))
            elif tipo == "lacuna":
                lacunas.append(linha.split("|", 1)[1].strip())
            else:
                raise ErroDeDados("tipo de linha desconhecido: %r" % tipo)
        except (ValueError, IndexError) as e:
            raise ErroDeDados("linha %d do arquivo de horarios: %s (%r)" % (n, e, bruta[:80])) from e
    return dict(meta=meta, legendas=legendas, quadros=quadros, lacunas=lacunas)


def validar(d: dict) -> None:
    for chave in ("valido_ate", "impresso_em", "fonte_url"):
        if chave not in d["meta"]:
            raise ErroDeDados("falta 'meta | %s'" % chave)
    if not d["quadros"]:
        raise ErroDeDados("nenhum quadro de horarios")
    for q in d["quadros"]:
        onde = "linha %s %s, %s, variante %d (arquivo, linha %d)" % (q["linha"], q["sentido"], q["dia"], q["variante"], q["n"])
        if q["sentido"] not in SENTIDOS:
            raise ErroDeDados("sentido desconhecido em %s" % onde)
        if q["dia"] not in DIAS:
            raise ErroDeDados("tipo de dia desconhecido em %s" % onde)
        if not q["horarios"]:
            raise ErroDeDados("quadro vazio em %s" % onde)
        for h in q["horarios"]:
            if not HORA.match(h):
                raise ErroDeDados("horario invalido %r em %s" % (h, onde))
        if q["horarios"] != sorted(set(q["horarios"])):
            raise ErroDeDados("horarios fora de ordem ou repetidos em %s: %s" % (onde, " ".join(q["horarios"])))
        if q["variante"] not in d["legendas"].get((q["linha"], q["sentido"]), {}):
            raise ErroDeDados("variante %d sem trajeto na legenda em %s" % (q["variante"], onde))
    for (num, sentido), leg in d["legendas"].items():
        usadas = {q["variante"] for q in d["quadros"] if q["linha"] == num and q["sentido"] == sentido}
        sobra = set(leg) - usadas
        if sobra and not usadas:
            raise ErroDeDados("legenda da linha %s %s sem nenhum quadro" % (num, sentido))


def montar(d: dict) -> dict:
    linhas = []
    for num in sorted({q["linha"] for q in d["quadros"]}):
        qs = [q for q in d["quadros"] if q["linha"] == num]
        sentidos = []
        for sentido in SENTIDOS:
            do_sentido = [q for q in qs if q["sentido"] == sentido]
            if not do_sentido:
                continue
            legenda = {str(v): t for v, t in sorted(d["legendas"][(num, sentido)].items())}
            sentidos.append(dict(sentido=sentido, legenda=legenda, quadros=[
                dict(dia=q["dia"], variante=q["variante"], horarios=q["horarios"]) for q in do_sentido]))
        linhas.append(dict(numero=num, nome=qs[0]["nome"], sentidos=sentidos))
    total = sum(len(q["horarios"]) for q in d["quadros"])
    return dict(
        municipio="Rio Claro", uf="SP",
        fonte=dict(nome="SOU Transportes — Rio Claro", url=d["meta"]["fonte_url"], impresso_em=d["meta"]["impresso_em"],
                   observacao="Páginas de horários impressas do site da SOU em %s; os horários foram lidos das imagens e conferidos por três leituras independentes." % d["meta"]["impresso_em"]),
        valido_ate=d["meta"]["valido_ate"],
        dias={k: v for k, v in DIAS.items()},
        linhas=linhas, lacunas=d["lacunas"], total_horarios=total,
        regra_de_qualidade="Não inventar horários. Todo horário vem de um quadro da SOU, com sentido, tipo de dia e variante de trajeto.")


def gerar() -> str:
    d = ler(ORIGEM.read_text(encoding="utf-8"))
    validar(d)
    return json.dumps(montar(d), ensure_ascii=False, indent=1) + "\n"


def main(argv: list[str] | None = None) -> int:
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--verificar", action="store_true")
    args = ap.parse_args(argv)
    try:
        saida = gerar()
    except ErroDeDados as e:
        print("ERRO nos dados de horarios:", e)
        return 1
    if args.verificar:
        atual = DESTINO.read_text(encoding="utf-8") if DESTINO.exists() else ""
        if atual != saida:
            print("O JSON versionado esta diferente do que o arquivo de horarios gera. Rode: python pipeline/horarios_onibus.py")
            return 1
        print("OK: o JSON esta igual ao que o arquivo de horarios gera.")
        return 0
    DESTINO.write_text(saida, encoding="utf-8")
    j = json.loads(saida)
    print("Gravado %s: %d linhas, %d horarios." % (DESTINO.relative_to(RAIZ), len(j["linhas"]), j["total_horarios"]))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
