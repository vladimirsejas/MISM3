"""Unidades de saude e canais oficiais da Prefeitura -> web/dados/institucional.json.

Alimenta as paginas "Saude" (qual e a minha UBS?) e "Secretarias" (links oficiais). Le dois CSV versionados:
  catalogo/servicos_manuais.csv   (so as linhas tipo=saude)
  catalogo/secretarias.csv        (secretarias, canais de atendimento, paginas da Saude e documentos)

Usa so a biblioteca padrao do Python (nao precisa de pandas), para rodar em qualquer computador, inclusive
pelo abrir_site.bat. O JSON gerado SOBE para o GitHub: ele vem de CSV que ja esta versionado e nao contem dado
pessoal. Regra do projeto mantida: todo registro precisa de fonte https e de data.

Uso:  python pipeline/institucional.py
"""
from __future__ import annotations

import csv
import re
import sys
from datetime import date
from pathlib import Path
from urllib.parse import urlparse

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import CATALOGO, WEB_DADOS, agora_iso, salvar_json  # noqa: E402

GRUPOS = ("secretaria", "canal", "saude", "documento")
TEMAS = ("mulher", "saude", "assistencia", "trabalho", "educacao", "cidade", "cidadania", "outras")
SITUACOES = ("conferido", "listado")
SUBTIPOS_SAUDE = ("urgencia", "ubs", "usf", "caps", "vigilancia")


def _ler(caminho: Path) -> list[dict]:
    if not caminho.is_file():
        raise FileNotFoundError("Nao encontrei %s" % caminho)
    with caminho.open(encoding="utf-8-sig", newline="") as f:
        return [{k: (v or "").strip() for k, v in linha.items() if k} for linha in csv.DictReader(f)]


def _lista(texto: str) -> list[str]:
    return [x.strip() for x in (texto or "").split(";") if x.strip()]


def _data(valor: str, nome: str, obrigatoria: bool) -> str:
    if not valor:
        if obrigatoria:
            raise ValueError("'%s': falta verificado_em (AAAA-MM-DD)." % nome)
        return ""
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", valor):
        raise ValueError("'%s': verificado_em='%s' invalida (use AAAA-MM-DD)." % (nome, valor))
    date.fromisoformat(valor)  # rejeita 2026-02-31
    return valor


def _url_https(url: str, nome: str) -> str:
    p = urlparse(url)
    if p.scheme != "https" or not p.netloc:
        raise ValueError("'%s': a fonte precisa ser um link https completo (veio '%s')." % (nome, url))
    return url


def validar_unidades(linhas: list[dict]) -> list[dict]:
    """Linhas tipo=saude do catalogo manual -> unidades para a pagina Saude."""
    saida, vistos = [], set()
    for r in linhas:
        if r.get("tipo") != "saude":
            continue
        nome = r.get("nome") or "(sem nome)"
        if not r.get("id") or r["id"] in vistos:
            raise ValueError("'%s': id ausente ou repetido (%s)." % (nome, r.get("id")))
        vistos.add(r["id"])
        sub = r.get("subtipo", "")
        if sub not in SUBTIPOS_SAUDE:
            raise ValueError("'%s': subtipo '%s' desconhecido (use: %s)." % (nome, sub, ", ".join(SUBTIPOS_SAUDE)))
        saida.append({
            "id": r["id"], "subtipo": sub, "nome": nome, "endereco": r.get("endereco", ""),
            "telefone": r.get("telefone", ""), "horario": r.get("horario", ""),
            "bairro": r.get("bairro", ""), "bairros": _lista(r.get("bairros", "")),
            "observacao": r.get("observacao", ""), "divergencia": r.get("divergencia", ""),
            "fonte_url": _url_https(r.get("fonte_url", ""), nome),
            "verificado_em": _data(r.get("verificado_em", ""), nome, True),
        })
    return saida


def validar_canais(linhas: list[dict]) -> list[dict]:
    saida, vistos = [], set()
    for r in linhas:
        nome = r.get("nome") or "(sem nome)"
        if not r.get("id") or r["id"] in vistos:
            raise ValueError("'%s': id ausente ou repetido (%s)." % (nome, r.get("id")))
        vistos.add(r["id"])
        if r.get("grupo") not in GRUPOS:
            raise ValueError("'%s': grupo '%s' invalido (use: %s)." % (nome, r.get("grupo"), ", ".join(GRUPOS)))
        temas = _lista(r.get("temas", ""))
        if not temas or any(t not in TEMAS for t in temas):
            raise ValueError("'%s': temas invalidos %s (use: %s)." % (nome, temas, ", ".join(TEMAS)))
        sit = r.get("situacao", "")
        if sit not in SITUACOES:
            raise ValueError("'%s': situacao '%s' invalida (use: %s)." % (nome, sit, ", ".join(SITUACOES)))
        # "conferido" so vale com data; "listado" nao pode fingir que foi conferido
        data = _data(r.get("verificado_em", ""), nome, sit == "conferido")
        if sit == "listado" and data:
            raise ValueError("'%s': situacao=listado nao deve ter verificado_em (so 'conferido' tem data)." % nome)
        saida.append({
            "id": r["id"], "grupo": r["grupo"], "nome": nome, "temas": temas,
            "url": _url_https(r.get("url", ""), nome), "situacao": sit, "verificado_em": data,
            "descricao": r.get("descricao", ""), "observacao": r.get("observacao", ""),
        })
    return saida


def montar(servicos_csv: Path | None = None, canais_csv: Path | None = None, hoje: str | None = None) -> dict:
    unidades = validar_unidades(_ler(servicos_csv or CATALOGO / "servicos_manuais.csv"))
    canais = validar_canais(_ler(canais_csv or CATALOGO / "secretarias.csv"))
    return {
        "meta": {
            "gerado_em": hoje or agora_iso(),
            "demo": False,
            "aviso": "Cadastros copiados de paginas publicas e que podem estar desatualizados. Confirme por telefone antes de ir.",
            "contagem": {"unidades_saude": len(unidades), "canais": len(canais),
                         "canais_conferidos": sum(1 for c in canais if c["situacao"] == "conferido")},
        },
        "saude": unidades,
        "canais": canais,
    }


def main() -> None:
    try:
        dados = montar()
    except (ValueError, FileNotFoundError) as e:
        print("ERRO: %s" % e, file=sys.stderr)
        sys.exit(1)
    salvar_json(dados, WEB_DADOS / "institucional.json")
    c = dados["meta"]["contagem"]
    print("web/dados/institucional.json: %d unidades de saude, %d canais (%d conferidos)."
          % (c["unidades_saude"], c["canais"], c["canais_conferidos"]))


if __name__ == "__main__":
    main()
