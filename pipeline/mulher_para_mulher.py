"""Catalogo "De mulher para mulher": mulheres que oferecem servico a outras mulheres.

Principios (ver docs/de_mulher_para_mulher.md):
  * so entra quem CONSENTIU por escrito em ser publicada (data em consentimento_em);
  * so contato PROFISSIONAL publico (WhatsApp/telefone comercial/link) e apenas BAIRRO ou regiao:
    nunca endereco residencial, nunca nome completo obrigatorio;
  * todo cadastro VENCE (renovar_ate, no maximo 180 dias depois do consentimento): sem renovacao some do site;
  * TODO cadastro e verificado pela Secretaria da Mulher (ou orgao oficial designado por ela): so um orgao publico pode
    exigir comprovacao e responder por ela. Sem verificacao (o que foi conferido, por quem e quando), nao publica;
  * categorias de maior risco (transporte, servicos na casa) exigem alem disso a conferencia especifica descrita;
  * nao ha nota/avaliacao nesta versao e o site nao promete seguranca.
"""
from __future__ import annotations

import re
import sys
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

def _carregar_areas() -> dict:
    """Areas de servico: UMA fonte (web/dados/areas_mulheres.json), usada tambem pela pagina rede-mulheres.html."""
    import json
    caminho = Path(__file__).resolve().parent.parent / "web" / "dados" / "areas_mulheres.json"
    return json.loads(caminho.read_text(encoding="utf-8"))["areas"]


_AREAS = _carregar_areas()
CATEGORIAS = {a["chave"]: a["rotulo"] for a in _AREAS}
ALTO_RISCO = tuple(a["chave"] for a in _AREAS if a["alto_risco"])
ONDE = ("estabelecimento", "casa_da_cliente", "casa_da_profissional", "online", "a_combinar")
MAX_DIAS = 180
SEM_ENDERECO = re.compile(r"\b(rua|avenida|av\.|travessa|alameda|estrada|n[ºo°]\s*\d+|\d{5}-?\d{3})\b", re.I)
TIPO_SERVICO = "mulher_para_mulher"


def _d(v, campo, nome):
    if not v or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", v):
        raise ValueError("'%s': %s ausente ou fora do formato AAAA-MM-DD." % (nome, campo))
    return date.fromisoformat(v)


def validar(df, hoje: str) -> list[dict]:
    saida = []
    for _, r in df.iterrows():
        g = lambda c: (None if str(r.get(c, "")) in ("nan", "None", "") else str(r[c]).strip())  # noqa: E731
        nome = g("nome_publico") or "(sem nome)"
        for obrig in ("categoria", "nome_publico", "descricao", "bairro_ou_regiao", "contato_publico", "onde_atende"):
            if not g(obrig):
                raise ValueError("'%s': campo obrigatorio '%s' vazio." % (nome, obrig))
        if g("categoria") not in CATEGORIAS:
            raise ValueError("'%s': categoria '%s' invalida (use: %s)." % (nome, g("categoria"), ", ".join(CATEGORIAS)))
        if g("onde_atende") not in ONDE:
            raise ValueError("'%s': onde_atende '%s' invalido (use: %s)." % (nome, g("onde_atende"), ", ".join(ONDE)))
        if SEM_ENDERECO.search(g("bairro_ou_regiao")):
            raise ValueError("'%s': bairro_ou_regiao parece endereco. Publique so o bairro ou a regiao." % nome)
        if "@" in g("contato_publico") and "http" not in g("contato_publico"):
            raise ValueError("'%s': use WhatsApp/telefone profissional ou link, nao e-mail pessoal." % nome)
        consent = _d(g("consentimento_em"), "consentimento_em", nome)
        renovar = _d(g("renovar_ate"), "renovar_ate", nome)
        if consent > date.fromisoformat(hoje):
            raise ValueError("'%s': consentimento_em no futuro." % nome)
        if (renovar - consent).days > MAX_DIAS or renovar < consent:
            raise ValueError("'%s': renovar_ate deve ser de 0 a %d dias depois do consentimento." % (nome, MAX_DIAS))
        if not (g("forma_de_verificacao") and g("verificada_por")):
            raise ValueError("'%s': todo cadastro exige forma_de_verificacao e verificada_por (Secretaria ou orgao oficial)." % nome)
        verificada = _d(g("verificada_em"), "verificada_em", nome)
        if verificada > date.fromisoformat(hoje):
            raise ValueError("'%s': verificada_em no futuro." % nome)
        if renovar < date.fromisoformat(hoje):
            continue  # vencido: nao publica
        verif = "Cadastro verificado por %s em %s: %s." % (g("verificada_por"), g("verificada_em"), g("forma_de_verificacao"))
        saida.append({
            "id": g("id") or "m2m-" + re.sub(r"[^a-z0-9]+", "-", nome.lower()).strip("-"),
            "tipo": TIPO_SERVICO, "subtipo": g("categoria"), "nome": nome, "cep": None,
            "endereco": "Bairro/região: %s" % g("bairro_ou_regiao"), "telefone": g("contato_publico"), "horario": None,
            "lat": None, "lon": None, "geo": "sem_local", "abrangencia": "municipal",
            "fonte": "Cadastro De mulher para mulher, verificado por %s" % g("verificada_por"),
            "fonte_url": "", "verificado_em": g("verificada_em"), "renovar_ate": g("renovar_ate"),
            "observacao": " ".join(x for x in (g("descricao"), "Atende: %s." % g("onde_atende").replace("_", " "), verif,
                                               "A verificação confere o que está escrito acima; não garante o serviço nem a segurança. Combine em local público e avise alguém de confiança.",
                                               g("observacao")) if x),
        })
    ids = [x["id"] for x in saida]
    if len(ids) != len(set(ids)):
        raise ValueError("ids repetidos em mulher_para_mulher.csv.")
    return saida
