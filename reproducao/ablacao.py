"""Ablação do orientador do MISM3 (EXPLORATÓRIA): liga e desliga componentes e mede o efeito.

Só os conjuntos desenvolvimento e teste são executados, sem as perguntas marcadas visto_no_treino. Como esses dois conjuntos já foram
usados em ajustes do sistema, TODAS as tabelas são exploratórias e não são estimativas independentes de desempenho.

Uso (a partir da raiz do repositório):
    python reproducao/ablacao.py

Saídas, em reproducao/resultados/: ablacao.csv (formato longo, com intervalos) e ablacao.md (tabelas e metadados).
Nenhum arquivo de web/, pipeline/, catalogo/, avaliacao/ ou dados/ é lido para escrita ou modificado, e nenhum modelo é treinado.
"""
from __future__ import annotations

import csv
import json
import math
import re
import sys
import unicodedata
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import comum  # noqa: E402

SAIDA = comum.RAIZ / "reproducao" / "resultados"

# (nome técnico, rótulo, descrição de uma linha)
CONDICOES = [
    ("completo", "Sistema completo", "orientador v2, como no site (regras e modelo de necessidades, detector de perigo aprendido, detector de escopo, índice com palavras, letras e LSA)"),
    ("apenas_regras", "Apenas regras (necessidade)", "o sinal de intenção vem só das regras lexicais de necessidade; sem o modelo de necessidades"),
    ("apenas_modelo_necessidades", "Apenas modelo de necessidades", "o sinal de intenção vem só do modelo de necessidades; sem as regras lexicais"),
    ("sem_perigo_aprendido", "Híbrido sem detector de perigo aprendido", "só as regras de segurança de perigo.js; sem o modelo de perigo"),
    ("sem_escopo", "Híbrido sem detector de escopo", "sem o detector de escopo; só a nota da busca decide a abstenção"),
    ("sem_regras_lexicais_necessidade", "Sem regras lexicais de necessidade", "remove as regras lexicais de necessidade do sinal de intenção (neste motor equivale a 'apenas modelo de necessidades': as regras só entram por esse sinal)"),
    ("sem_ngramas_letras", "Sem n-gramas de caracteres do índice", "peso do sinal de letras do índice = 0"),
    ("sem_lsa", "Sem LSA", "peso do sinal de significado (LSA) do índice = 0"),
    ("sem_palavras", "Sem sinal de palavras do índice", "peso do sinal de palavras do índice = 0"),
    ("linha_de_base_tfidf", "Linha de base: busca por palavras (TF-IDF)", "TF-IDF de palavras sobre o texto dos destinos, sem raízes, sem letras, sem LSA, sem classificador e sem detector; abstém só se nenhuma palavra casar"),
]

METRICAS = [  # (chave, rótulo, k, n)
    ("area", "Resposta@3 de área", "area_hit", "area_total"),
    ("especifica", "Resposta@3 específica", "spec_hit", "spec_total"),
    ("taxa_resposta", "Taxa de resposta", "respondida", "escopo_total"),
    ("perigo_revocacao", "Perigo: revocação", "perigo_ok", "perigo_total"),
    ("falsos_alarmes", "Falsos alarmes", "falso_alarme", "nao_perigo_total"),
    ("abstencao_correta", "Abstenção correta", "fora_abstida", "fora_total"),
]


# ---------------------------------------------------------------- linha de base TF-IDF
def _tokens(texto: str) -> list[str]:
    t = unicodedata.normalize("NFD", texto.lower())
    t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    return [w for w in re.split(r"[^a-z0-9]+", t) if len(w) >= 2]


class TfIdf:
    def __init__(self, unidades: list[dict]):
        self.unidades = unidades
        docs = [Counter(_tokens(u.get("texto", ""))) for u in unidades]
        n = len(docs)
        df: Counter = Counter()
        for d in docs:
            df.update(d.keys())
        self.idf = {w: math.log((1 + n) / (1 + c)) + 1 for w, c in df.items()}
        self.vetores = []
        for d in docs:
            v = {w: (1 + math.log(c)) * self.idf[w] for w, c in d.items()}
            norma = math.sqrt(sum(x * x for x in v.values())) or 1.0
            self.vetores.append({w: x / norma for w, x in v.items()})

    def responder(self, texto: str) -> dict:
        q = Counter(_tokens(texto))
        qv = {w: (1 + math.log(c)) * self.idf[w] for w, c in q.items() if w in self.idf}
        norma = math.sqrt(sum(x * x for x in qv.values()))
        if not qv or norma == 0:
            return {"abstem": True, "perigo": False, "nivel": 0, "tipos": [], "itens": []}
        pontos = [(sum(qv[w] * v.get(w, 0.0) for w in qv) / norma, i) for i, v in enumerate(self.vetores)]
        pontos.sort(key=lambda x: -x[0])
        top = [(s, i) for s, i in pontos[:6] if s > 0]
        itens = [{"area": self.unidades[i].get("area"), "sec": self.unidades[i].get("sec"), "svc": self.unidades[i].get("svc"),
                  "titulo": self.unidades[i].get("titulo")} for _, i in top]
        return {"abstem": not itens, "perigo": False, "nivel": 0, "tipos": [], "itens": itens}


def rodar_tfidf(perguntas: list[dict]) -> dict[str, dict]:
    indice = json.loads((comum.RAIZ / "web" / "dados" / "indice_orientacao.json").read_text(encoding="utf-8"))
    motor = TfIdf(indice["unidades"])
    return {q["id"]: {"id": q["id"], **motor.responder(q["texto"])} for q in perguntas}


# ---------------------------------------------------------------- formatação
def fmt(k: int, n: int) -> str:
    if n == 0:
        return "n/d"
    lo, hi = comum.wilson(k, n)
    return f"{100 * k / n:.0f}% ({k}/{n}) [{100 * lo:.0f}–{100 * hi:.0f}]"


def fmt_mrr(rr: list[float]) -> str:
    if not rr:
        return "n/d"
    lo, hi = comum.bootstrap_media(rr)
    return f"{sum(rr) / len(rr):.2f} [{lo:.2f}–{hi:.2f}]"


def main() -> None:
    SAIDA.mkdir(parents=True, exist_ok=True)
    por, excluidas = comum.carregar_perguntas()
    meta = comum.versoes()
    linhas_csv: list[list] = []
    resultados: dict[tuple[str, str], dict] = {}
    for nome, _, _ in CONDICOES:
        for conj in comum.CONJUNTOS:
            qs = por[conj]
            resp = rodar_tfidf(qs) if nome == "linha_de_base_tfidf" else comum.rodar_variante(nome, qs)
            m = comum.metricas(qs, resp)
            resultados[(nome, conj)] = m
            for chave, _, kk, nn in METRICAS:
                k, n = m.get(kk, 0), m.get(nn, 0)
                lo, hi = comum.wilson(k, n)
                linhas_csv.append([nome, conj, chave, k, n, "" if n == 0 else round(k / n, 4), "" if n == 0 else round(lo, 4), "" if n == 0 else round(hi, 4)])
            rr = m["rr"]
            lo, hi = comum.bootstrap_media(rr)
            linhas_csv.append([nome, conj, "mrr", "", len(rr), round(sum(rr) / len(rr), 4) if rr else "", round(lo, 4) if rr else "", round(hi, 4) if rr else ""])
    with (SAIDA / "ablacao.csv").open("w", encoding="utf-8", newline="") as f:
        w = csv.writer(f, lineterminator="\n")
        w.writerow(["condicao", "conjunto", "metrica", "acertos", "total", "valor", "ic95_inferior", "ic95_superior"])
        w.writerows(linhas_csv)

    md = ["# Ablação do orientador: resultados EXPLORATÓRIOS", "",
          "> **EXPLORATÓRIO.** Os conjuntos de desenvolvimento e de teste já foram usados em ajustes do sistema (vocabulário, frases de treino, índice). "
          "Estas tabelas mostram a contribuição relativa dos componentes, não uma estimativa independente de desempenho. "
          "Os conjuntos independente, reserva e final não foram executados.", "",
          "## Como foi gerado", "",
          f"- Comando: `{meta['comando']}`",
          f"- Commit: `{meta['commit']}` (ramo `{meta['ramo']}`)",
          f"- Arquivos alterados fora de `reproducao/` no momento da execução: {'nenhum' if not meta['alteracoes_fora_de_reproducao'] else 'há alterações: ' + meta['alteracoes_fora_de_reproducao']}",
          f"- Node `{meta['node']}`; Python `{meta['python']}`; sistema `{meta['sistema']}`",
          f"- Data da execução (UTC): {meta['data_utc']}",
          f"- Semente do bootstrap: `{meta['semente']}`; reamostragens: {comum.BOOTSTRAP}",
          "- Intervalos: Wilson de 95% para as proporções, mostrado entre colchetes em pontos percentuais; bootstrap percentil de 95% para o MRR (reciprocos por pergunta com gabarito específico).",
          "- Definições das métricas: as de `avaliacao/avaliar.py` (Resposta@3 olha os 3 primeiros cartões; taxa de resposta = perguntas dentro do escopo em que o sistema mostrou algo; "
          "perigo conta qualquer alerta, completo ou discreto; abstenção correta = perguntas fora do escopo sem resposta inventada).",
          "- O executor é `reproducao/rodar_variantes.js`, cópia adaptada de `avaliacao/rodar_sistema.js` e `avaliacao/sistema_v2.js`; os originais não foram modificados. "
          "Ele executa só as perguntas de desenvolvimento e teste.", "",
          "## Perguntas usadas e excluídas", "",
          "| Conjunto | Executadas | Excluídas (`visto_no_treino`) |", "|---|---|---|"]
    for conj in comum.CONJUNTOS:
        md.append(f"| {conj} | {len(por[conj])} | {excluidas[conj]} |")
    md += ["", "## Condições", ""]
    for nome, rotulo, desc in CONDICOES:
        md.append(f"- **{rotulo}** (`{nome}`): {desc}.")
    for conj in comum.CONJUNTOS:
        md += ["", f"## Conjunto de {conj} (EXPLORATÓRIO, {len(por[conj])} perguntas)", "",
               "| Condição | " + " | ".join(r for _, r, _, _ in METRICAS[:2]) + " | MRR | " + " | ".join(r for _, r, _, _ in METRICAS[2:]) + " |",
               "|---|" + "---|" * (len(METRICAS) + 1)]
        for nome, rotulo, _ in CONDICOES:
            m = resultados[(nome, conj)]
            cel = [fmt(m.get(kk, 0), m.get(nn, 0)) for _, _, kk, nn in METRICAS]
            md.append(f"| {rotulo} | " + " | ".join(cel[:2]) + f" | {fmt_mrr(m['rr'])} | " + " | ".join(cel[2:]) + " |")
    md += ["", "## Observações", "",
           "- A condição `sem_regras_lexicais_necessidade` é a mesma configuração de `apenas_modelo_necessidades`: neste motor as regras lexicais de necessidade só entram pelo sinal de intenção. Os números idênticos confirmam isso.",
           "- Zerar um peso do índice (letras, LSA ou palavras) não remove o cálculo; apenas anula a contribuição do sinal na nota final.",
           "- A linha de base TF-IDF não tem detector de perigo, então sua revocação de perigo é 0 por construção, e ela só se abstém quando nenhuma palavra casa.",
           "- Com poucas perguntas por grupo, os intervalos são largos; diferenças de um ou dois pontos percentuais entre condições não são interpretáveis."]
    (SAIDA / "ablacao.md").write_text("\n".join(md) + "\n", encoding="utf-8", newline="\n")
    print("ok:", SAIDA / "ablacao.md")


if __name__ == "__main__":
    main()
