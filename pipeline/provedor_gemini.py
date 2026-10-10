"""Provedor de pesquisa REAL do MISM3: Google Gemini com Pesquisa Google (grounding).

Mesma API e mesma chave do MISM2 (GEMINI_API_KEY, pacote google-genai). A regra do MISM2 vale aqui:
"o sistema calcula, a IA explica; nunca inventar". Por isso:
  * so entra no resultado o que o Gemini SUSTENTOU com uma fonte da busca (grounding): cada resultado vem de uma
    pagina real, com link. Texto que o modelo escreveu sem fonte e DESCARTADO;
  * se a busca nao achou nada, devolve resultados vazios (o site diz "nao encontrei", nao inventa);
  * a chave fica em variavel de ambiente / arquivo .env (ignorado pelo git), nunca no navegador.

Ligar:  coloque no .env da raiz do projeto
            GEMINI_API_KEY=sua_chave
            MISM3_PROVEDOR=gemini
        e rode  python pipeline/servidor.py   (pip install google-genai)

Testar sozinho, sem o site:   python pipeline/provedor_gemini.py "preciso de emprego e tenho filho pequeno"
Ver a estrutura bruta da resposta:   python pipeline/provedor_gemini.py --bruto "preciso de emprego"
"""
from __future__ import annotations

import json
import os
import sys
from datetime import date
from urllib.parse import urlparse

NOME = "Google (Gemini)"  # mostrado na tela: a usuaria precisa saber para onde a frase vai
MODELO = os.environ.get("MISM3_GEMINI_MODELO", "gemini-3.8-flash")  # o mesmo valor que o MISM2 usa; troque pela variavel se preciso

PROMPT = """Você pesquisa para o Mapa do Cuidado Rio-Clarense, um guia de serviços públicos e oportunidades para mulheres.

Procure informações REAIS e ATUAIS sobre o pedido abaixo em Rio Claro, estado de São Paulo (código IBGE 3543907).
Não é o Rio Claro do Rio de Janeiro.

REGRAS:
1. Use somente o que você encontrou na busca. Não invente endereço, telefone, horário, vaga, prazo, valor ou requisito.
2. Se não encontrou, diga que não encontrou. Não complete com o que "costuma ser".
3. Prefira fontes oficiais (sites .gov.br, da Prefeitura de Rio Claro, do Governo de São Paulo) e instituições conhecidas.
4. Não dê aconselhamento médico nem jurídico: aponte onde a pessoa pode buscar ajuda.
5. Não peça dados pessoais. Responda em português simples, em poucas frases.

PEDIDO: {texto}
"""


def pronto() -> bool:
    """O servidor so liga a pesquisa se isto for verdadeiro (senao a tela diria que a frase vai ao Google sem ir)."""
    return bool(os.environ.get("GEMINI_API_KEY"))


def dominio(url: str) -> str:
    host = urlparse(url or "").netloc.lower()
    return host[4:] if host.startswith("www.") else host


def converter(resp, hoje: str | None = None) -> dict:
    """Resposta do Gemini -> contrato do MISM3. So aproveita o que tem fonte (grounding)."""
    hoje = hoje or date.today().isoformat()
    candidatos = getattr(resp, "candidates", None) or []
    meta = getattr(candidatos[0], "grounding_metadata", None) if candidatos else None
    pedacos = getattr(meta, "grounding_chunks", None) or []
    apoios = getattr(meta, "grounding_supports", None) or []

    # trechos do texto do modelo que cada fonte SUSTENTA (indice da fonte -> trechos)
    sustentado: dict[int, list[str]] = {}
    for ap in apoios:
        trecho = getattr(getattr(ap, "segment", None), "text", None)
        for i in getattr(ap, "grounding_chunk_indices", None) or []:
            if trecho:
                sustentado.setdefault(i, []).append(trecho.strip())

    resultados, vistos = [], set()
    for i, p in enumerate(pedacos):
        web = getattr(p, "web", None)
        url, titulo = getattr(web, "uri", None), getattr(web, "title", None)
        if not url or url in vistos:
            continue
        vistos.add(url)
        site = titulo or dominio(url)   # o Gemini costuma devolver o dominio do site como "title"
        descricao = " ".join(sustentado.get(i, []))[:600]
        resultados.append({
            "titulo": site, "descricao": descricao, "url": url, "fonte": site, "consultado_em": hoje,
        })
    return {"necessidades": [], "resultados": resultados[:10]}


def _configuracao():
    """Ferramenta de busca do Gemini. Separado para os testes nao precisarem do pacote."""
    from google.genai import types
    return types.GenerateContentConfig(tools=[types.Tool(google_search=types.GoogleSearch())], temperature=0.2)


def _cliente():
    chave = os.environ.get("GEMINI_API_KEY")
    if not chave:
        raise RuntimeError("GEMINI_API_KEY nao encontrada (coloque no .env da raiz do projeto)")
    from google import genai
    return genai.Client(api_key=chave)


def pesquisar(texto: str, contexto: dict | None = None, cliente=None) -> dict:
    cliente = cliente or _cliente()
    resp = cliente.models.generate_content(model=MODELO, contents=PROMPT.format(texto=texto[:300]), config=_configuracao())
    return converter(resp)


def _bruto(resp) -> dict:
    """Ajuda a depurar o formato real: mostra so a ESTRUTURA (campos e fontes), nunca a chave."""
    cand = (getattr(resp, "candidates", None) or [None])[0]
    meta = getattr(cand, "grounding_metadata", None)
    return {
        "tem_metadata": meta is not None,
        "fontes": [{"title": getattr(getattr(p, "web", None), "title", None), "uri": (getattr(getattr(p, "web", None), "uri", "") or "")[:90]}
                   for p in (getattr(meta, "grounding_chunks", None) or [])],
        "n_apoios": len(getattr(meta, "grounding_supports", None) or []),
        "buscas_feitas": list(getattr(meta, "web_search_queries", None) or []),
    }


if __name__ == "__main__":
    try:  # le o .env da raiz do projeto, se houver (sem depender do python-dotenv)
        from servidor import carregar_env
        carregar_env()
    except Exception:  # noqa: BLE001
        pass
    args = [a for a in sys.argv[1:] if a != "--bruto"]
    if not args:
        sys.exit('uso: python pipeline/provedor_gemini.py [--bruto] "frase da usuaria"')
    try:
        cli = _cliente()
    except RuntimeError as e:
        sys.exit("ERRO: %s" % e)
    if "--bruto" in sys.argv:
        r = cli.models.generate_content(model=MODELO, contents=PROMPT.format(texto=args[0][:300]), config=_configuracao())
        print(json.dumps(_bruto(r), ensure_ascii=False, indent=2))
    else:
        print(json.dumps(pesquisar(args[0], cliente=cli), ensure_ascii=False, indent=2))
