"""A distância é calculada em Python (pipeline) e em JavaScript (site): as duas precisam dar o mesmo resultado."""
import json
import shutil
import subprocess
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from common import haversine_m  # noqa: E402

ACESSO = Path(__file__).resolve().parents[2] / "web" / "acesso.js"
PONTOS = [(-22.4145, -47.5603, -22.4131, -47.5628), (-22.30, -47.50, -22.45, -47.60), (-22.41, -47.56, -22.41, -47.56),
          (-22.5999, -47.8199, -22.2001, -47.4101)]


@pytest.mark.skipif(shutil.which("node") is None, reason="node não está instalado")
def test_haversine_do_python_e_do_javascript_coincidem():
    js = json.loads(subprocess.check_output(
        ["node", "-e", "const A=require(%s);console.log(JSON.stringify(%s.map(p=>A.haversine(...p))))" % (json.dumps(str(ACESSO)), json.dumps(PONTOS))]))
    for ponto, valor_js in zip(PONTOS, js):
        assert abs(float(haversine_m(*ponto)) - valor_js) < 0.001, ponto
