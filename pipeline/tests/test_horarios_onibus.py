import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import horarios_onibus as ho  # noqa: E402

BASE = """meta | valido_ate | 2027-02-04
meta | impresso_em | 2026-10-09
meta | fonte_url | https://exemplo.test/
legenda | 01 | Ida | 1 | Bairro-Centro
legenda | 01 | Volta | 2 | Centro-Bairro
quadro | 01 | Bairro | Ida | Dias úteis | 1 | 05:00 06:30 23:50
quadro | 01 | Bairro | Volta | Sábados | 2 | 07:10 08:20
lacuna | Falta uma linha.
"""


def erro(texto):
    try:
        ho.validar(ho.ler(texto))
    except ho.ErroDeDados as e:
        return str(e)
    return None


def test_dados_validos_geram_a_estrutura_esperada():
    d = ho.ler(BASE)
    ho.validar(d)
    j = ho.montar(d)
    assert j["total_horarios"] == 5 and j["valido_ate"] == "2027-02-04"
    linha = j["linhas"][0]
    assert linha["numero"] == "01" and [s["sentido"] for s in linha["sentidos"]] == ["Ida", "Volta"]
    assert linha["sentidos"][0]["legenda"] == {"1": "Bairro-Centro"}
    assert j["lacunas"] == ["Falta uma linha."]


def test_detecta_horario_invalido_fora_de_ordem_e_repetido():
    assert "invalido" in erro(BASE.replace("06:30", "25:30"))
    assert "fora de ordem" in erro(BASE.replace("05:00 06:30", "06:30 05:00"))
    assert "repetidos" in erro(BASE.replace("05:00 06:30", "05:00 05:00"))
    assert "invalido" in erro(BASE.replace("23:50", "24:00"))


def test_detecta_variante_sem_legenda_sentido_e_dia_desconhecidos():
    assert "sem trajeto na legenda" in erro(BASE.replace("Dias úteis | 1", "Dias úteis | 7"))
    assert "sentido desconhecido" in erro(BASE.replace("| Volta | Sábados", "| Retorno | Sábados"))
    assert "dia desconhecido" in erro(BASE.replace("Sábados", "Feriados"))


def test_detecta_quadro_vazio_meta_ausente_e_linha_com_dois_nomes():
    assert "quadro vazio" in erro(BASE.replace("07:10 08:20", ""))
    assert "falta 'meta | valido_ate'" in erro(BASE.replace("meta | valido_ate | 2027-02-04\n", ""))
    assert "dois nomes" in erro(BASE.replace("01 | Bairro | Volta", "01 | Outro | Volta"))
    assert "desconhecido" in erro(BASE + "xyz | a | b\n")


def test_arquivo_e_json_do_repositorio_estao_consistentes():
    assert ho.main(["--verificar"]) == 0           # o JSON versionado e igual ao que o .txt gera
    j = json.loads(ho.DESTINO.read_text(encoding="utf-8"))
    assert j["total_horarios"] == 382 and len(j["linhas"]) == 5
    numeros = {l["numero"]: [s["sentido"] for s in l["sentidos"]] for l in j["linhas"]}
    assert numeros == {"01": ["Ida", "Volta"], "06": ["Ida", "Volta"], "07": ["Volta"], "08": ["Ida", "Volta"], "09": ["Ida", "Volta"]}
    assert not any(x in json.dumps(j, ensure_ascii=False).lower() for x in (".pdf", "ocr", "docs/"))


def test_json_desatualizado_e_detectado(tmp_path, monkeypatch):
    velho = tmp_path / "h.json"
    velho.write_text('{"linhas": []}', encoding="utf-8")
    monkeypatch.setattr(ho, "DESTINO", velho)
    assert ho.main(["--verificar"]) == 1
