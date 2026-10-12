"""Integridade do conjunto de perguntas da avaliação (avaliacao/perguntas.json): ids únicos, gabarito que existe de verdade no índice."""
import json
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
D = json.loads((RAIZ / "avaliacao" / "perguntas.json").read_text(encoding="utf-8"))
P = D["perguntas"]
INDICE = json.loads((RAIZ / "web" / "dados" / "indice_orientacao.json").read_text(encoding="utf-8"))["unidades"]
# Serviços retirados do catálogo de propósito; o gabarito foi mantido para não esconder o efeito na métrica (ver docs/ia/avaliacao_orientacao.md).
RETIRADOS = {"svc:mulher/cram"}
CONJUNTOS = {"desenvolvimento", "teste", "independente", "reserva"}


def test_ids_unicos_e_conjuntos_validos():
    ids = [q["id"] for q in P]
    assert len(ids) == len(set(ids)), "ids repetidos entre conjuntos (o avaliador misturaria respostas)"
    assert {q["conjunto"] for q in P} <= CONJUNTOS


def test_gabarito_aponta_para_coisas_que_existem():
    areas = {u["area"] for u in INDICE}
    svcs = {u["svc"] for u in INDICE if u["svc"]}
    secs = {f"{u['area']}/{u['sec']}" for u in INDICE if u["sec"]}
    for q in P:
        for t in q["areas"]:
            assert t.startswith("area:") and t[5:] in areas, (q["id"], t)
        for t in q["especificos"]:
            if t in RETIRADOS:
                continue
            tipo, _, resto = t.partition(":")
            assert tipo in ("svc", "sec", "area"), (q["id"], t)
            if tipo == "svc":
                assert resto in svcs, (q["id"], t)
            elif tipo == "area":
                assert resto in areas, (q["id"], t)
            else:
                assert resto in secs or resto.split("/")[0] == resto.split("/")[-1], (q["id"], t)


def test_perguntas_bem_formadas():
    for q in P:
        assert q["texto"].strip(), q["id"]
        if q["fora_de_escopo"]:
            assert not q["areas"] and not q["especificos"], q["id"]
        if q["perigo"]:
            assert q["areas"], f"{q['id']}: pergunta de perigo precisa de área esperada"
