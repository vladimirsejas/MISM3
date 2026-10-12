"""Contrato dos dados: regras que não podem sumir numa refatoração.
- coordenada de fonte x sem localização (nunca inventar coordenada);
- informação conferida x não conferida (a não conferida precisa de aviso);
- as ligações INEP apontam para serviços que existem, e os scripts leem/gravam o mesmo arquivo."""
import csv
import json
import re
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
CATALOGO = json.loads((RAIZ / "web" / "dados" / "catalogo_manual.json").read_text(encoding="utf-8"))["servicos"]


def test_ids_unicos_e_campos_basicos():
    ids = [s["id"] for s in CATALOGO]
    assert len(ids) == len(set(ids))
    for s in CATALOGO:
        assert s["nome"] and s["tipo"], s["id"]
        assert re.match(r"^\d{4}-\d{2}-\d{2}$", str(s.get("verificado_em") or "")), f"{s['id']}: data de conferência inválida"


def test_coordenada_so_quando_ha_fonte_de_coordenada():
    for s in CATALOGO:
        tem = s.get("lat") is not None and s.get("lon") is not None
        assert s.get("geo") in ("coordenada_fonte", "sem_local"), s["id"]
        assert tem == (s["geo"] == "coordenada_fonte"), f"{s['id']}: coordenada sem fonte, ou fonte sem coordenada"
        if tem:
            assert -23.0 < s["lat"] < -22.0 and -48.3 < s["lon"] < -47.2, f"{s['id']}: fora de Rio Claro"


def test_nao_conferido_tem_aviso_e_conferido_tem_fonte():
    for s in CATALOGO:
        assert isinstance(s.get("conferido"), bool), s["id"]
        if s["conferido"] is False:
            assert s.get("aviso"), f"{s['id']}: não conferido precisa de aviso visível"
        else:
            assert s.get("fonte_url") or s.get("fonte"), f"{s['id']}: conferido precisa de fonte"


def test_ligacoes_inep_apontam_para_servicos_existentes_e_scripts_usam_o_mesmo_arquivo():
    ids = {s["id"] for s in CATALOGO}
    with open(RAIZ / "catalogo" / "inep_escolas.csv", encoding="utf-8", newline="") as f:
        linhas = list(csv.DictReader(f))
    assert linhas
    for l in linhas:
        assert l["id"] in ids, f"ligação INEP para serviço inexistente: {l['id']}"
        assert re.match(r"^\d{8}$", l["inep"]), l["id"]
    assert len({l["id"] for l in linhas}) == len(linhas), "id repetido nas ligações INEP"
    for script in ("servicos.py", "ligar_catalogo_inep.py"):
        assert "inep_escolas.csv" in (RAIZ / "pipeline" / script).read_text(encoding="utf-8"), script
    # o arquivo que os dois scripts usam precisa existir exatamente onde eles dizem
    assert (RAIZ / "catalogo" / "inep_escolas.csv").exists()


def test_oferta_do_censo_e_ligacoes_manuais_sao_pecas_separadas():
    assert (RAIZ / "web" / "dados" / "oferta_educacao_infantil.json").exists()
    assert (RAIZ / "pipeline" / "oferta_educacao_infantil.py").exists()
