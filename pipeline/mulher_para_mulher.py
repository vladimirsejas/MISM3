"""Catalogo "De mulher para mulher": mulheres que oferecem servico a outras mulheres.

Principios (ver docs/de_mulher_para_mulher.md):
  * so entra quem CONSENTIU por escrito em ser publicada (data em consentimento_em);
  * so contato PROFISSIONAL publico (WhatsApp/telefone comercial/link) e apenas BAIRRO ou regiao:
    nunca endereco residencial, nunca nome completo obrigatorio;
  * todo cadastro VENCE (renovar_ate, no maximo 180 dias depois do consentimento): sem renovacao some do site;
  * categorias de maior risco (transporte, servicos na casa da cliente) exigem verificacao descrita e quem verificou;
  * nao ha nota/avaliacao nesta versao e o site nao promete seguranca.
"""
from __future__ import annotations

import re
import sys
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

CATEGORIAS = {
    "beleza": "Beleza e estética", "costura_artesanato": "Costura e artesanato", "alimentacao": "Comidas e doces",
    "aulas": "Aulas e reforço escolar", "saude_bem_estar": "Saúde, corpo e bem-estar", "negocios": "Design, foto, contabilidade e outros serviços",
    "servicos_na_casa": "Serviços na casa da cliente (reparos, diarista, cuidadora)", "transporte": "Transporte e carona",
}
ALTO_RISCO = ("servicos_na_casa", "transporte")
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
        if g("categoria") in ALTO_RISCO and not (g("forma_de_verificacao") and g("verificada_por")):
            raise ValueError("'%s': categoria de maior risco exige forma_de_verificacao e verificada_por." % nome)
        if renovar < date.fromisoformat(hoje):
            continue  # vencido: nao publica
        verif = ("Verificação: %s (por %s)." % (g("forma_de_verificacao"), g("verificada_por"))
                 if g("forma_de_verificacao") and g("verificada_por") else "Cadastro autodeclarado; não foi verificado.")
        saida.append({
            "id": g("id") or "m2m-" + re.sub(r"[^a-z0-9]+", "-", nome.lower()).strip("-"),
            "tipo": TIPO_SERVICO, "subtipo": g("categoria"), "nome": nome, "cep": None,
            "endereco": "Bairro/região: %s" % g("bairro_ou_regiao"), "telefone": g("contato_publico"), "horario": None,
            "lat": None, "lon": None, "geo": "sem_local", "abrangencia": "municipal",
            "fonte": "Cadastro De mulher para mulher (consentimento em %s)" % g("consentimento_em"),
            "fonte_url": "", "verificado_em": g("consentimento_em"), "renovar_ate": g("renovar_ate"),
            "observacao": " ".join(x for x in (g("descricao"), "Atende: %s." % g("onde_atende").replace("_", " "), verif,
                                               "O MISM3 não garante o serviço nem a segurança. Combine em local público e avise alguém de confiança.",
                                               g("observacao")) if x),
        })
    ids = [x["id"] for x in saida]
    if len(ids) != len(set(ids)):
        raise ValueError("ids repetidos em mulher_para_mulher.csv.")
    return saida
