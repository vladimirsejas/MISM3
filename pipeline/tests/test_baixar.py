import http.server
import sys
import threading
import zipfile
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import baixar as modulo_baixar  # noqa: E402
import common  # noqa: E402

CONTEUDO = bytes(range(256)) * 4000  # ~1 MB


def servidor(corta_primeira: bool, aceita_range: bool = True):
    estado = {"pedidos": [], "cortou": False}

    class H(http.server.BaseHTTPRequestHandler):
        def log_message(self, *a):
            pass

        def do_GET(self):
            rng = self.headers.get("Range")
            estado["pedidos"].append(rng)
            ini = 0
            if rng and aceita_range:
                ini = int(rng.split("=")[1].rstrip("-"))
                self.send_response(206)
            else:
                self.send_response(200)
            corpo = CONTEUDO[ini:]
            self.send_header("Content-Length", str(len(corpo)))
            self.end_headers()
            if corta_primeira and not estado["cortou"]:
                estado["cortou"] = True
                self.wfile.write(corpo[: len(corpo) // 2])  # promete tudo, entrega metade e desliga
                self.wfile.flush()
                self.close_connection = True
                return
            self.wfile.write(corpo)

    srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), H)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, estado


@pytest.fixture(autouse=True)
def sem_espera(monkeypatch):
    monkeypatch.setattr(common.time, "sleep", lambda s: None)


def test_retoma_depois_de_conexao_cortada(tmp_path):
    srv, estado = servidor(corta_primeira=True)
    try:
        dest = common.baixar("http://127.0.0.1:%d/a.bin" % srv.server_port, tmp_path / "a.bin", mostrar=False)
    finally:
        srv.shutdown()
    assert dest.read_bytes() == CONTEUDO
    assert estado["pedidos"][0] is None and estado["pedidos"][1].startswith("bytes=")  # pediu so o resto
    assert not (tmp_path / "a.bin.parte").exists()


def test_servidor_que_ignora_range_recomeca(tmp_path):
    srv, estado = servidor(corta_primeira=True, aceita_range=False)
    try:
        dest = common.baixar("http://127.0.0.1:%d/a.bin" % srv.server_port, tmp_path / "a.bin", mostrar=False)
    finally:
        srv.shutdown()
    assert dest.read_bytes() == CONTEUDO  # sem duplicar o inicio


def test_desiste_depois_das_tentativas(tmp_path):
    with pytest.raises(RuntimeError):
        common.baixar("http://127.0.0.1:9/nada.bin", tmp_path / "x.bin", tentativas=2, mostrar=False)


def test_extrai_so_o_csv_de_escolas(tmp_path):
    z = tmp_path / "censo.zip"
    with zipfile.ZipFile(z, "w") as zf:
        zf.writestr("dados/microdados_ed_basica_2025.csv", "CO_MUNICIPIO;NO_ENTIDADE\n1;X\n")
        zf.writestr("dicionario.xlsx", "lixo")
    out = modulo_baixar.extrair_escolas(z, tmp_path / "saida")
    assert out.name == "microdados_ed_basica_2025.csv" and out.read_text().startswith("CO_MUNICIPIO")
    assert not (tmp_path / "saida" / "dicionario.xlsx").exists()
