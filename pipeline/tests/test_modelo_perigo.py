"""O detector de perigo é treinado em Python e roda no navegador: as duas contas precisam dar o mesmo resultado, e o arquivo tem de estar íntegro."""
import json
import shutil
import subprocess
from pathlib import Path

import pytest

RAIZ = Path(__file__).resolve().parents[2]
MODELO = RAIZ / "web" / "dados" / "modelo_perigo.json"
M = json.loads(MODELO.read_text(encoding="utf-8"))


def test_formato_e_limiares():
    assert M["classes"] == ["violencia", "suicidio", "crianca", "saude"]
    n = len(M["vocabulario"])
    assert len(M["idf"]) == n and all(len(c) == n for c in M["coef"]) and len(M["intercepto"]) == 4
    for t in M["classes"]:
        lim, alto = M["meta"]["limiares"][t], M["meta"]["limiares_altos"][t]
        assert 0.05 <= lim <= alto <= 0.99, (t, lim, alto)


def test_corpus_de_treino_nao_contem_as_perguntas_de_avaliacao():
    """Treinar com as perguntas de avaliação tornaria a medição inútil."""
    import re, unicodedata

    def norm(t):
        t = "".join(c for c in unicodedata.normalize("NFD", t) if unicodedata.category(c) != "Mn").lower()
        return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9 ]", " ", t)).strip()
    treino = {norm(l.partition("|")[2]) for f in ("frases_perigo.txt", "frases_necessidades.txt")
              for l in (RAIZ / "catalogo" / f).read_text(encoding="utf-8").splitlines() if "|" in l and not l.startswith("#")}
    perguntas = json.loads((RAIZ / "avaliacao" / "perguntas.json").read_text(encoding="utf-8"))["perguntas"]
    repetidas = [q["texto"] for q in perguntas if q["conjunto"] in ("independente", "reserva", "teste") and not q["visto_no_treino"] and norm(q["texto"]) in treino]
    assert not repetidas, repetidas


@pytest.mark.skipif(shutil.which("node") is None, reason="node não está instalado")
def test_probabilidades_do_python_e_do_javascript_coincidem():
    js = """const IA=require(%s);const m=JSON.parse(require('fs').readFileSync(%s,'utf8'));const c=IA.criarClassificador(m);
    console.log(JSON.stringify(m.vetores_de_teste.map(v=>c.probabilidades(v.texto))))""" % (json.dumps(str(RAIZ / "web" / "ia.js")), json.dumps(str(MODELO)))
    saida = json.loads(subprocess.check_output(["node", "-e", js]))
    for esperado, obtido in zip(M["vetores_de_teste"], saida):
        for t in M["classes"]:
            assert abs(esperado[t] - obtido[t]) < 0.002, (esperado["texto"], t)
