"""O índice do orientador é gerado em Python e lido no navegador (JavaScript): a tokenização tem de ser idêntica nos dois lados,
e o arquivo publicado tem de bater com o que o gerador produz hoje (ninguém edita o índice na mão)."""
import json
import shutil
import subprocess
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import indice_orientacao as io  # noqa: E402

RAIZ = Path(__file__).resolve().parents[2]
ORIENTAR = RAIZ / "web" / "orientar.js"
INDICE = RAIZ / "web" / "dados" / "indice_orientacao.json"
FRASES = ["Preciso de vaga na creche pro meu filho", "meu marido me bateu", "quero terminar o ensino médio", "ÔNIBUS p/ a UPA mais próxima?",
          "estou desempregada com dois filhos", "mães solo e bebês", "casa própria", "preventivo grátis 2027", "  espaços   e\tabas  "]


@pytest.mark.skipif(shutil.which("node") is None, reason="node não está instalado")
def test_tokenizacao_do_python_e_do_javascript_coincidem():
    js = json.loads(subprocess.check_output(
        ["node", "-e", "const O=require(%s);console.log(JSON.stringify(%s.map(t=>O.fichas(t))))" % (json.dumps(str(ORIENTAR)), json.dumps(FRASES))]))
    for frase, do_js in zip(FRASES, js):
        assert io.fichas(frase) == do_js, frase


def test_indice_publicado_e_consistente():
    indice = json.loads(INDICE.read_text(encoding="utf-8"))
    un = indice["unidades"]
    # um serviço pode aparecer em duas áreas (ex.: SENAI em Trabalho e em Educação); o motor mostra cada serviço uma vez só
    lugares = [(u["id"], u["area"], u["sec"]) for u in un]
    assert len(lugares) == len(set(lugares)), "mesmo serviço duplicado no mesmo lugar"
    assert len(indice["lsa"]["docs"]) == len(un)
    assert len(indice["lsa"]["comp"]) == len(indice["lsa"]["termos"]) == len(indice["lsa"]["idf"])
    assert all(len(l) == indice["lsa"]["k"] for l in indice["lsa"]["docs"])
    for u in un:
        assert u["titulo"] and u["href"].startswith("#"), u["id"]
        assert u["tipo"] in {"servico", "classe", "area", "secao", "canal", "ferramenta"}, u["id"]
    # as 8 áreas têm porta própria e o orientador nunca fica sem destino genérico
    assert sum(1 for u in un if u["tipo"] == "area") >= 7


def test_indice_publicado_e_o_que_o_gerador_produz_hoje():
    try:  # o gerador usa o scikit-learn (LSA); em alguns Windows uma política de segurança bloqueia as DLLs dele
        from sklearn.feature_extraction.text import TfidfVectorizer  # noqa: F401
    except ImportError as erro:
        pytest.skip(f"scikit-learn não pôde ser carregado neste computador ({erro}); o CI do GitHub roda este teste")
    atual = io.gerar()
    publicado = json.loads(INDICE.read_text(encoding="utf-8"))
    assert [u["id"] for u in atual["unidades"]] == [u["id"] for u in publicado["unidades"]], "rode: python pipeline/indice_orientacao.py"
    assert atual["lsa"]["termos"] == publicado["lsa"]["termos"]


def test_nenhuma_unidade_promete_vaga_ou_beneficio():
    import re
    indice = json.loads(INDICE.read_text(encoding="utf-8"))
    for u in indice["unidades"]:
        resumo = re.sub(r"n[aã]o (?:existe|h[aá]|significa|\w+ )[^.]*garant\w*", "", u.get("resumo", ""), flags=re.I)  # negar a promessa é o texto certo
        assert not re.search(r"\bgarant|voc[eê] tem direito a", resumo, re.I), u["id"]
