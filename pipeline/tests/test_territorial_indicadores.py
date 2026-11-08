"""Indicadores territoriais da versão 1 do mapa (web/dados/indicadores_territoriais.json): conferência contra os arquivos existentes."""
import csv
import hashlib
import json
from pathlib import Path

import pytest

import exposicao_distancia as ed
import servicos
import territorial_indicadores as ti

RAIZ = Path(__file__).resolve().parents[2]
DADOS = RAIZ / "web" / "dados"


@pytest.fixture(scope="module")
def saida():
    return ti.gerar(ti.carregar())


@pytest.fixture(scope="module")
def publicado():
    return json.loads((DADOS / "indicadores_territoriais.json").read_text(encoding="utf-8"))


def test_408_setores_e_soma_de_populacao(publicado):
    assert publicado["totais"]["setores"] == len(publicado["setores"]) == 408
    assert sum(s["pessoas"] for s in publicado["setores"]) == publicado["totais"]["pessoas"] == 201418
    assert sum(s["domicilios"] for s in publicado["setores"]) == publicado["totais"]["domicilios"] == 87946


def test_codigos_de_setor_unicos_e_iguais_aos_da_malha(publicado):
    ids = [s["id"] for s in publicado["setores"]]
    assert len(ids) == len(set(ids))
    geo = json.loads((DADOS / "setores.geojson").read_text(encoding="utf-8"))
    assert set(ids) == {f["properties"]["setor"] for f in geo["features"]}
    assert ids == sorted(ids), "a saída é ordenada por código de setor (determinismo)"


def test_totais_batem_com_exposicao_distancia(publicado):
    expo = json.loads((DADOS / "exposicao_distancia.json").read_text(encoding="utf-8"))
    assert publicado["totais"]["pessoas"] == expo["meta"]["pessoas_total"]
    for cen in ti.CENARIOS:
        for cat in ti.CATEGORIAS:
            esperado = expo["cenarios"][cen][cat]
            assert publicado["cobertura"][cen][cat] == esperado["cobertura"], (cen, cat)
            assert publicado["resumo_distancias"][cen][cat]["populacao_toda"] == esperado["populacao_toda"], (cen, cat)
            assert publicado["resumo_distancias"][cen][cat]["setores_sem_bairro"] == esperado["setores_sem_bairro"], (cen, cat)


def test_distancias_por_setor_reproduzem_os_limiares_de_exposicao_distancia(publicado):
    """Os valores por setor estão arredondados a 3 casas, então um setor a menos de 0,5 m do limiar pode trocar de lado: a contagem
    publicada precisa estar entre (acima do limiar) e (no limiar ou acima), depois do arredondamento."""
    expo = json.loads((DADOS / "exposicao_distancia.json").read_text(encoding="utf-8"))
    for cen in ti.CENARIOS:
        for cat in ti.CATEGORIAS:
            for rotulo, limiar in (("1 km", 1.0), ("2 km", 2.0)):
                esperado = expo["cenarios"][cen][cat]["populacao_toda"]["acima_de"][rotulo]["setores"]
                ds = [s["distancia_km"][cen][cat] for s in publicado["setores"]]
                assert sum(1 for d in ds if d > limiar) <= esperado <= sum(1 for d in ds if d >= limiar), (cen, cat, rotulo)


def test_cenario_do_cep_so_muda_as_escolas(publicado):
    """Pela decisão D2, CRAS e UBS/USF têm coordenada do catálogo nos dois cenários; só as escolas dependem do centro do CEP cadastral."""
    for s in publicado["setores"]:
        d = s["distancia_km"]
        assert d["coordenadas_do_catalogo"]["cras"] == d["com_centro_do_cep"]["cras"]
        assert d["coordenadas_do_catalogo"]["ubs"] == d["com_centro_do_cep"]["ubs"]
    assert any(s["distancia_km"]["coordenadas_do_catalogo"]["escola"] != s["distancia_km"]["com_centro_do_cep"]["escola"] for s in publicado["setores"])


def test_equipamentos_por_categoria_e_precisao(publicado):
    eq = publicado["equipamentos"]
    por = {}
    for e in eq:
        por.setdefault(e["categoria"], []).append(e)
    assert {c: len(v) for c, v in por.items()} == {"cras": 6, "ubs": 22, "escola": 68}
    assert {e["precisao"] for e in eq} <= {"catalogo", "centro_do_cep", "pendente"}
    assert all(e["precisao"] == "catalogo" for e in por["cras"] + por["ubs"])
    escolas = [e["precisao"] for e in por["escola"]]
    assert escolas.count("catalogo") == 33 and escolas.count("centro_do_cep") == 35 and escolas.count("pendente") == 0
    assert all((e["precisao"] == "pendente") == (e["lat"] is None) for e in eq)
    # o indicador 4 conta só a coordenada do catálogo, e cada ponto cai em, no máximo, um setor
    contados = sum(sum(s["equipamentos"].values()) for s in publicado["setores"])
    com_setor = sum(1 for e in eq if e["setor"])
    assert contados == com_setor == sum(1 for e in eq if e["precisao"] == "catalogo") - publicado["meta"]["equipamentos_fora_da_malha"]["escola"] - publicado["meta"]["equipamentos_fora_da_malha"]["cras"] - publicado["meta"]["equipamentos_fora_da_malha"]["ubs"]


def test_publicado_e_o_que_o_gerador_produz_hoje(saida, publicado):
    """O arquivo versionado não pode ficar velho em relação às entradas (rode: python pipeline/territorial_indicadores.py)."""
    assert json.loads(ti.serializar(saida)) == publicado


def test_reprodutibilidade_duas_geracoes_identicas_por_hash(saida):
    a = ti.serializar(saida).encode("utf-8")
    b = ti.serializar(ti.gerar(ti.carregar())).encode("utf-8")
    assert hashlib.sha256(a).hexdigest() == hashlib.sha256(b).hexdigest()
    assert saida["meta"]["carimbo"] == ti.gerar(ti.carregar())["meta"]["carimbo"]
    assert "gerado_em" not in saida["meta"], "sem data variável: o carimbo vem do hash das entradas"


def test_carimbo_muda_se_uma_entrada_mudar():
    h = dict(ti.carregar()["hashes"])
    original = ti.carimbo(h)
    h["territorio.json"] = "0" * 64
    assert ti.carimbo(h) != original


def test_a_conferencia_contra_exposicao_distancia_recusa_numero_diferente(saida):
    expo = json.loads((DADOS / "exposicao_distancia.json").read_text(encoding="utf-8"))
    resumo = json.loads(json.dumps(saida["resumo_distancias"]))
    resumo["com_centro_do_cep"]["escola"]["populacao_toda"]["mediana_km"] += 0.01
    erros = ti.conferir(expo, resumo, saida["cobertura"])
    assert erros and "com_centro_do_cep/escola/populacao_toda" in erros[0]
    assert ti.conferir(expo, saida["resumo_distancias"], saida["cobertura"]) == []


def test_coordenada_do_catalogo_segue_a_regra_de_servicos_py():
    with (RAIZ / "catalogo" / "servicos_manuais.csv").open(encoding="utf-8-sig", newline="") as f:
        for r in csv.DictReader(f):
            assert ti.coord_do_catalogo(r.get("lat"), r.get("lon")) == servicos.coord_valida(r.get("lat"), r.get("lon")), r["id"]


def test_sem_cep_endereco_ou_telefone_na_saida(publicado):
    texto = json.dumps(publicado, ensure_ascii=False)
    for proibido in ("cep_institucional", '"endereco"', '"telefone"', '"cep"'):
        assert proibido not in texto
    assert not any(k in texto for k in ("@", "(19)"))


def test_entradas_declaradas_incluem_o_indice_de_cep_so_para_localizar_equipamentos(publicado):
    assert "cep_indice.json" in publicado["meta"]["entradas_sha256"]
    assert "escolas_municipais.json" in publicado["meta"]["entradas_sha256"]
    assert "localizacao_registro.csv" in publicado["meta"]["entradas_sha256"]
    assert all(len(v) == 64 for v in publicado["meta"]["entradas_sha256"].values())
    assert ed.CENARIOS.keys() == set(ti.CENARIOS)

def test_faixas_de_incerteza_sao_publicadas_e_contem_a_estimativa_central(publicado):
    """A faixa é envelope geométrico para referências aproximadas, não intervalo de confiança."""
    assert publicado["meta"]["metodologia_incerteza"]["formula"] == "d_min=max(0,d-r); d_max=d+r"
    assert "não intervalo de confiança" in publicado["meta"]["metodologia_incerteza"]["interpretacao"].lower()
    intervalos = []
    for setor in publicado["setores"]:
        for cen in ti.CENARIOS:
            for cat in ti.CATEGORIAS:
                central = setor["distancia_km"][cen][cat]
                minimo = setor["distancia_min_km"][cen][cat]
                maximo = setor["distancia_max_km"][cen][cat]
                if central is None:
                    assert minimo is None and maximo is None
                else:
                    assert minimo <= central <= maximo
                    intervalos.append((minimo, central, maximo))
    assert any(minimo < central or central < maximo for minimo, central, maximo in intervalos)


def test_base_escolar_consolidada_preserva_raios_e_proveniencia(publicado):
    escolas = [e for e in publicado["equipamentos"] if e["categoria"] == "escola"]
    assert len(escolas) == 68
    assert sum(e["metodo_localizacao"] == "coordenada_individual" for e in escolas) == 33
    assert sum(e["metodo_localizacao"] == "centroide_cep" for e in escolas) == 35
    aproximadas = [e for e in escolas if e["precisao"] == "centro_do_cep"]
    assert len(aproximadas) == 35
    assert all(e["raio_incerteza_m"] > 0 for e in aproximadas)
    individuais = [e for e in escolas if e["precisao"] == "catalogo"]
    assert all(e["raio_incerteza_m"] == 0 for e in individuais)

def test_proveniencia_de_cras_ubs_nao_presume_confianca(publicado):
    servicos = [e for e in publicado["equipamentos"] if e["categoria"] in {"cras", "ubs"}]
    registrados = [e for e in servicos if e["confianca_localizacao"] in {"alta", "media"}]
    sem_registro = [e for e in servicos if e["confianca_localizacao"] == "nao_registrada"]
    assert len(servicos) == 28
    assert len(registrados) == 22
    assert sum(e["confianca_localizacao"] == "alta" for e in registrados) == 11
    assert sum(e["confianca_localizacao"] == "media" for e in registrados) == 11
    assert len(sem_registro) == 6
    assert all(e["metodo_localizacao"] == "catalogo_sem_registro_de_proveniencia" for e in sem_registro)
    assert all(e["data_aplicacao_localizacao"] for e in registrados)
    assert all(e["fonte_localizacao"] == "servicos_manuais.csv + localizacao_registro.csv" for e in registrados)

