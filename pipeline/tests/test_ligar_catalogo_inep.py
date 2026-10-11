import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import ligar_catalogo_inep as L  # noqa: E402


def sv(i, nome):
    return {"id": i, "nome": nome}


def es(inep, nome):
    return {"inep": inep, "nome": nome}


def test_palavras_ignora_acento_titulo_tipo_e_ordem():
    assert L.palavras("E.M. Dom Pedro I") == L.palavras("PEDRO DOM I ESCOLA MUNICIPAL")
    assert L.palavras("E.M. Lúcia Helena Ferreira Camargo") == L.palavras("ESCOLA MUNICIPAL PROFESSORA LUCIA HELENA FERREIRA CAMARGO")
    assert L.palavras("E.M. Caminho da Vida Profª Margarida Penteado") == L.palavras("ESCOLA MUNICIPAL CAMINHO DA VIDA PROFA MARGARIDA PENTEADO")
    assert L.palavras("E.M. Paulo Koelle Dr.") == L.palavras("PAULO KOELLE DR ESCOLA MUNICIPAL")


def test_liga_so_nome_igual_e_um_para_um():
    pares, sem_par, escolas_sem = L.ligar(
        [sv("a", "E.M. Monteiro Lobato"), sv("b", "E.M. Armando Grisi")],
        [es("1", "MONTEIRO LOBATO ESCOLA MUNICIPAL"), es("2", "OUTRA ESCOLA MUNICIPAL")])
    assert [(p["id"], p["inep"]) for p in pares] == [("a", "1")]
    assert [s["id"] for s in sem_par] == ["b"] and [e["inep"] for e in escolas_sem] == ["2"]


def test_nome_parecido_nao_liga():
    pares, sem_par, _ = L.ligar([sv("a", "E.M. João Rehder Netto")], [es("1", "JOAO REHDER NETO ESCOLA MUNICIPAL")])
    assert pares == [] and len(sem_par) == 1                       # Netto x Neto: só "talvez"
    sug = L.talvez(sem_par, [es("1", "JOAO REHDER NETO ESCOLA MUNICIPAL")])
    assert len(sug) == 1 and sug[0][2] >= 0.95


def test_ambiguidade_nao_liga_nenhum_lado():
    # dois registros no catálogo com o mesmo nome: não dá para saber qual é o do Censo
    pares, sem_par, _ = L.ligar([sv("a", "E.M. Marcello Schmidt"), sv("b", "E.M. Marcello Schmidt")],
                                [es("1", "MARCELLO SCHMIDT ESCOLA MUNICIPAL")])
    assert pares == [] and len(sem_par) == 2
    # duas escolas do Censo com o mesmo nome: também não liga
    pares, _, _ = L.ligar([sv("a", "E.M. Marcello Schmidt")],
                          [es("1", "MARCELLO SCHMIDT ESCOLA MUNICIPAL"), es("2", "MARCELLO SCHMIDT EM")])
    assert pares == []


def test_nome_so_com_palavras_de_tipo_nao_liga_com_ninguem():
    pares, _, _ = L.ligar([sv("a", "Escola Municipal")], [es("1", "ESCOLA MUNICIPAL")])
    assert pares == []
