"""Servidor local: contrato da API, limites e seguranca. Sobe em porta livre, numa thread."""
import json
import sys
import threading
import urllib.error
import urllib.request
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import servidor  # noqa: E402


class Provedor:
    """Provedor de mentira so para o teste."""
    chamadas = []

    @staticmethod
    def pesquisar(texto, contexto):
        Provedor.chamadas.append((texto, contexto))
        if texto == "quebra":
            raise RuntimeError("falhou por dentro: segredo-interno")
        if texto == "lista":
            return ["nao e objeto"]
        return {"necessidades": ["emprego"], "resultados": [{"titulo": "T", "url": "https://x.gov.br"}]}


@pytest.fixture
def web(tmp_path):
    (tmp_path / "dados").mkdir()
    (tmp_path / "dados" / "servicos.json").write_text('{"servicos": [{"id": "a"}]}', encoding="utf-8")
    (tmp_path / "index.html").write_text("<h1>oi</h1>", encoding="utf-8")
    (tmp_path.parent / "segredo.txt").write_text("nao pode vazar", encoding="utf-8")
    return tmp_path


def subir(web, provedor):
    srv = servidor.criar_servidor(web, provedor, porta=0)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, "http://127.0.0.1:%d" % srv.server_address[1]


def pedir(url, dados=None, cabecalhos=None):
    req = urllib.request.Request(url, data=dados, headers=cabecalhos or {}, method="POST" if dados is not None else "GET")
    try:
        with urllib.request.urlopen(req, timeout=5) as r:
            return r.status, r.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8")


def post(base, corpo):
    return pedir(base + "/api/pesquisar", json.dumps(corpo).encode(), {"Content-Type": "application/json"})


def test_rotas_de_dados_e_saude(web):
    srv, base = subir(web, None)
    try:
        assert json.loads(pedir(base + "/api/saude")[1]) == {"ok": True, "pesquisa": False}
        st, corpo = pedir(base + "/api/servicos")
        assert st == 200 and json.loads(corpo)["servicos"][0]["id"] == "a"
        st, corpo = pedir(base + "/api/vagas")            # arquivo ausente: 404 (o site cai para os arquivos locais)
        assert st == 404 and "erro" in json.loads(corpo)
        assert pedir(base + "/api/nao-existe")[0] == 404
        assert pedir(base + "/index.html")[1] == "<h1>oi</h1>"   # site estatico continua servido
    finally:
        srv.shutdown()


def test_config_reflete_se_ha_provedor(web):
    for prov, esperado in ((None, False), (Provedor, True)):
        srv, base = subir(web, prov)
        try:
            js = pedir(base + "/config.js")[1]
            assert '"modo": "api"' in js and ('"pesquisaRemota": %s' % str(esperado).lower()) in js
        finally:
            srv.shutdown()


def test_pesquisa_desligada_devolve_501(web):
    srv, base = subir(web, None)
    try:
        assert post(base, {"texto": "emprego"})[0] == 501
    finally:
        srv.shutdown()


def test_pesquisa_com_provedor_e_limites(web):
    Provedor.chamadas.clear()
    srv, base = subir(web, Provedor)
    try:
        st, corpo = post(base, {"texto": "x" * 1000, "contexto": {"cep": "13500000"}})
        assert st == 200 and json.loads(corpo)["resultados"][0]["url"] == "https://x.gov.br"
        assert len(Provedor.chamadas[0][0]) == 300             # frase cortada em 300 caracteres
        assert post(base, {"semtexto": 1})[0] == 400            # contrato: precisa de "texto"
        assert pedir(base + "/api/pesquisar", b"nao e json", {"Content-Type": "application/json"})[0] == 400
        assert pedir(base + "/api/pesquisar", b"x" * 9000, {"Content-Type": "application/json"})[0] == 413
        assert post(base, {"texto": "a", "contexto": "texto"})[0] == 400
        st, corpo = post(base, {"texto": "quebra"})             # falha do provedor: 502, SEM vazar o motivo
        assert st == 502 and "segredo-interno" not in corpo
        assert post(base, {"texto": "lista"})[0] == 502         # provedor devolveu algo fora do contrato
    finally:
        srv.shutdown()


def test_nao_sai_da_pasta_web(web):
    srv, base = subir(web, None)
    try:
        for caminho in ("/../segredo.txt", "/%2e%2e/segredo.txt", "/..%2fsegredo.txt"):
            st, corpo = pedir(base + caminho)
            assert "nao pode vazar" not in corpo, caminho
    finally:
        srv.shutdown()


def test_registro_nao_guarda_a_frase(web, capfd):
    srv, base = subir(web, Provedor)
    try:
        post(base, {"texto": "FRASE-SECRETA-DA-USUARIA"})
        pedir(base + "/api/servicos?q=CONSULTA-SECRETA")
    finally:
        srv.shutdown()
    saida = capfd.readouterr().err
    assert "FRASE-SECRETA" not in saida and "CONSULTA-SECRETA" not in saida
    assert "POST /api/pesquisar" in saida


def test_provedor_precisa_ter_funcao(tmp_path):
    ruim = tmp_path / "p.py"
    ruim.write_text("x = 1", encoding="utf-8")
    with pytest.raises(RuntimeError):
        servidor.carregar_provedor(ruim)
    assert servidor.carregar_provedor(tmp_path / "nao_existe.py") is None


def test_config_informa_o_destino_da_pesquisa(web):
    class ComNome(Provedor):
        NOME = "Servico Externo X"
    srv, base = subir(web, ComNome)
    try:
        assert '"pesquisaDestino": "Servico Externo X"' in pedir(base + "/config.js")[1]
    finally:
        srv.shutdown()
    srv, base = subir(web, None)
    try:
        assert '"pesquisaDestino": ""' in pedir(base + "/config.js")[1]
    finally:
        srv.shutdown()
