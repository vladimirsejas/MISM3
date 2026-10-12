"""O detector de escopo é treinado em Python e roda no navegador: mesma conta nos dois lados; e o corpus não pode conter perguntas de avaliação."""
import json
import re
import shutil
import subprocess
import unicodedata
from pathlib import Path

import pytest

RAIZ = Path(__file__).resolve().parents[2]
MODELO = RAIZ / "web" / "dados" / "modelo_escopo.json"
M = json.loads(MODELO.read_text(encoding="utf-8"))


def test_formato():
    n = len(M["vocabulario"])
    assert M["classes"] == ["no_escopo"] and len(M["idf"]) == n and len(M["coef"][0]) == n
    assert 0.05 <= M["meta"]["limiares"]["no_escopo"] <= 0.95
    # o limiar escolhido por validação cruzada não pode jogar fora mais de ~2% das frases do assunto
    assert M["meta"]["relatorio_validacao_cruzada"]["dentro_perdidas_cv"] <= 0.02


def test_corpus_nao_contem_as_perguntas_de_avaliacao():
    def norm(t):
        t = "".join(c for c in unicodedata.normalize("NFD", t) if unicodedata.category(c) != "Mn").lower()
        return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9 ]", " ", t)).strip()
    treino = {norm(l.partition("|")[2] if "|" in l else l) for f in ("frases_fora_do_escopo.txt", "frases_necessidades.txt", "frases_perigo.txt")
              for l in (RAIZ / "catalogo" / f).read_text(encoding="utf-8").splitlines() if l.strip() and not l.startswith("#")}
    perguntas = json.loads((RAIZ / "avaliacao" / "perguntas.json").read_text(encoding="utf-8"))["perguntas"]
    repetidas = [q["texto"] for q in perguntas if not q["visto_no_treino"] and norm(q["texto"]) in treino]
    assert not repetidas, repetidas


@pytest.mark.skipif(shutil.which("node") is None, reason="node não está instalado")
def test_probabilidades_do_python_e_do_javascript_coincidem():
    js = """const IA=require(%s);const m=JSON.parse(require('fs').readFileSync(%s,'utf8'));const c=IA.criarClassificador(m);
    console.log(JSON.stringify(m.vetores_de_teste.map(v=>c.probabilidades(v.texto))))""" % (json.dumps(str(RAIZ / "web" / "ia.js")), json.dumps(str(MODELO)))
    saida = json.loads(subprocess.check_output(["node", "-e", js]))
    for esperado, obtido in zip(M["vetores_de_teste"], saida):
        assert abs(esperado["no_escopo"] - obtido["no_escopo"]) < 0.002, esperado["texto"]
