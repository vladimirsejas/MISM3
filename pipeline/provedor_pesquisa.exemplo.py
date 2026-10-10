"""MODELO de provedor de pesquisa real. Copie para  pipeline/provedor_pesquisa.py  e preencha.

O servidor (pipeline/servidor.py) chama  pesquisar(texto, contexto)  quando a usuaria escreve uma frase e a
pesquisa remota esta ligada. Aqui voce fala com a sua API (busca na web, dados abertos, modelo de linguagem...).

REGRAS (o site tambem as aplica):
  * devolva so o que tem FONTE: cada resultado precisa de "titulo" e "url" (http/https); sem isso o site descarta;
  * NAO invente: se a API nao achou, devolva "resultados": [];
  * a chave da API fica em variavel de ambiente (os.environ), NUNCA no codigo nem no navegador;
  * este arquivo e ignorado pelo git (.gitignore): nao suba credenciais.

Formato da resposta:
  {
    "necessidades": ["emprego", "filhos"],          # opcional; ids de web/necessidades.js; o site soma as da busca local
    "resultados": [
      {"titulo": "...", "descricao": "...", "url": "https://...", "fonte": "nome da fonte", "consultado_em": "2026-10-10"}
    ]
  }
"""
from __future__ import annotations

import os
from datetime import date


def pesquisar(texto: str, contexto: dict) -> dict:
    chave = os.environ.get("MISM3_API_KEY")  # exemplo: defina antes de rodar o servidor
    if not chave:
        raise RuntimeError("defina MISM3_API_KEY")

    # TODO: chame a sua API aqui, por exemplo com urllib.request ou requests, usando `texto`.
    #       Restrinja a consulta a Rio Claro/SP (codigo IBGE 3543907) para nao trazer o Rio Claro do RJ.
    achados: list[dict] = []

    return {
        "necessidades": [],
        "resultados": [
            {"titulo": a["titulo"], "descricao": a.get("resumo", ""), "url": a["link"], "fonte": a.get("site", ""),
             "consultado_em": date.today().isoformat()}
            for a in achados
        ],
    }
