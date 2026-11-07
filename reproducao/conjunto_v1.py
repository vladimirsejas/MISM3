"""Adaptador e calculadora da execução ÚNICA do conjunto congelado v1 (protocolo/conjunto_congelado_v1.json).

ETAPA A (preparação): este arquivo só converte, calcula e valida. Ele NÃO executa o sistema sobre o conjunto congelado enquanto a Etapa B
não for autorizada por escrito pelo autor. O caminho que executa o conjunto está protegido pela opção --etapa-b e pela confirmação
--confirmo-etapa-b-autorizada; nenhum comando da Etapa A usa essas opções.

Decisões de método (PRÉ-REGISTRO, tomadas antes de qualquer execução; repetidas no MANIFESTO_EXECUCAO_v1.md):
  - texto = campo "frase"; ação "Responder" = orientável; "Recusar" = fora do escopo (abstenção esperada); "Pedir esclarec." = vaga.
  - destinos esperados = "ids_oficiais". Acerto específico: algum dos 3 primeiros itens tem id igual a um esperado; se o id esperado é de tipo
    "classe" no índice, basta o item ter o mesmo campo svc da classe. Os itens que o executor devolve não trazem o id; ele é recuperado pela
    chave (area, sec, svc, titulo), única no índice (conferida em tempo de execução).
  - áreas esperadas = áreas (campo area do índice) dos ids esperados; acerto de área: algum dos 3 primeiros itens está nesse conjunto.
    Itens sem ids esperados (Recusar, Pedir esclarec.) não entram no denominador de Resposta@3 de área nem de específica.
  - perigo esperado = verdadeiro se o campo "perigo" começa com "Sim", falso se "Não"; o tipo é descritivo.
  - Especificidade: denominador = negativas EXCLUINDO "Pedir esclarec."; o valor com todas as negativas também é publicado.
    Falso alarme: FP / todas as negativas; a versão sem as "Pedir esclarec." também é publicada.
  - Abstenção correta = Recusar em que o sistema se abstém ou não mostra item; abstenção indevida = Responder em que o sistema se abstém ou não
    mostra item. Para "Pedir esclarec." publica-se a abstenção à parte (a saída do sistema não distingue "pedido de esclarecimento": NÃO VERIFICADO).
  - Aviso discreto (nivel 1) e alerta completo (nivel 2) são registrados separadamente, pelo campo nivel da saída do sistema.
  - Matriz de confusão por área, regra para rótulos múltiplos: previsão = área do 1º item (ou "abstenção"); se a previsão está entre as áreas
    esperadas, conta-se na diagonal dessa área; senão, na linha da primeira área esperada em ordem alfabética.
  - Incerteza: Wilson de 95% para proporções; bootstrap pareado por mensagem, 10.000 reamostragens, semente 20261106, percentil de 95%, para
    MRR, Resposta@3 específica e para as diferenças entre condições.
  - Melhor linha de base lexical para o critério 1 = a condição "linha_de_base_tfidf" (Busca simples, TF-IDF; não há BM25 versionado).
  - Sensibilidade: repetir sem C-123, C-041, C-088 e D-030.

Uso, da raiz do repositório:
    python reproducao/conjunto_v1.py --conferir-conjunto          # só lê o gabarito e mostra denominadores (não executa o sistema)
    python reproducao/conjunto_v1.py --validar                    # Passo 3: dev/teste contra ablacao_depois.csv e subconjunto sintético
    python reproducao/conjunto_v1.py --gerar-manifesto            # grava reproducao/MANIFESTO_EXECUCAO_v1.md
    python reproducao/conjunto_v1.py --etapa-b --confirmo-etapa-b-autorizada   # SOMENTE depois da autorização da Etapa B
"""
from __future__ import annotations

import ast
import csv
import hashlib
import json
import platform
import random
import subprocess
import sys
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import ablacao  # noqa: E402
import comum  # noqa: E402

RAIZ = comum.RAIZ
CONJUNTO = RAIZ / "protocolo" / "conjunto_congelado_v1.json"
SHA256_ESPERADO = "abbae38d3cc39a8428130c09ac59d65c96cff497112481a9eadcf3ac9227ae00"
SEMENTE_V1 = 20261106
BOOTSTRAP_V1 = 10000
EXCLUIDOS_SENSIBILIDADE = ("C-123", "C-041", "C-088", "D-030")
CONDICOES = [c[0] for c in ablacao.CONDICOES]  # as 9 condições de ablacao.py e a linha de base TF-IDF, exatamente como implementadas
BASE_LEXICAL = "linha_de_base_tfidf"
LIMITES = {"diferenca_pp": 5.0, "revocacao_perigo": 0.90, "piora_revocacao_pp": 5.0, "falso_alarme": 0.05, "abstencao_indevida": 0.15}


# ------------------------------------------------------------------ índice e conversão
class Indice:
    def __init__(self) -> None:
        bruto = json.loads((RAIZ / "web" / "dados" / "indice_orientacao.json").read_text(encoding="utf-8"))
        self.unidades = {u["id"]: u for u in bruto["unidades"]}
        self.por_chave: dict[tuple, str] = {}
        for u in bruto["unidades"]:
            chave = (u["area"], u.get("sec"), u.get("svc"), u["titulo"])
            if chave in self.por_chave:
                raise ValueError("chave (area, sec, svc, titulo) repetida no índice: " + repr(chave))
            self.por_chave[chave] = u["id"]
        self.reforcos_sem_unidade = 0
        for r in bruto.get("reforcos", []):
            chave = (r["area"], r.get("sec"), r.get("svc"), r["titulo"])
            if chave not in self.por_chave:
                self.por_chave[chave] = r["id"]
                self.reforcos_sem_unidade += 1

    def id_do_item(self, item: dict) -> str | None:
        return self.por_chave.get((item.get("area"), item.get("sec"), item.get("svc"), item.get("titulo")))


def lista_de_ids(valor) -> list[str]:
    """ids_oficiais pode vir como lista JSON (é o caso do arquivo atual: as 190 entradas) ou como texto no formato de lista do Python;
    neste último caso é convertido com ast.literal_eval (nunca eval)."""
    if isinstance(valor, str):
        valor = ast.literal_eval(valor)
    if not isinstance(valor, (list, tuple)) or not all(isinstance(i, str) for i in valor):
        raise ValueError(f"ids_oficiais inesperado: {valor!r}")
    return list(valor)


# Mapeamento FIXO (pré-registro) entre as 10 condições do protocolo (seção 3) e as 10 de ablacao.py; não coincidem uma a uma.
# (número no protocolo, nome no protocolo, condição do código ou None, situação)
MAPEAMENTO = [
    (1, "Completo", "completo", "implementada"),
    (2, "Sem regras lexicais", "sem_regras_lexicais_necessidade", "mapeada por regra fixa"),
    (3, "Sem n-gramas de caracteres", "sem_ngramas_letras", "implementada"),
    (4, "Sem LSA", "sem_lsa", "implementada"),
    (5, "Sem classificador de necessidades", "apenas_regras", "mapeada por regra fixa"),
    (6, "Sem detector de perigo aprendido", "sem_perigo_aprendido", "implementada"),
    (7, "Sem detector de escopo", "sem_escopo", "implementada"),
    (8, "Apenas regras (só regras, sem busca estatística, LSA ou classificadores)", None, "NÃO VERIFICADO: não implementada como o protocolo define"),
    (9, "Apenas modelo (só componentes aprendidos)", None, "NÃO VERIFICADO: não implementada como o protocolo define"),
    (10, "Busca simples (BM25 ou TF-IDF)", "linha_de_base_tfidf", "implementada (TF-IDF; não há BM25 versionado)"),
]
ROTULO_PROTOCOLO = {cod: f"protocolo {n}" for n, _, cod, _ in MAPEAMENTO if cod}
ROTULO_PROTOCOLO["apenas_modelo_necessidades"] = "complementar; a mais próxima da 9, que NÃO está implementada"
ROTULO_PROTOCOLO["sem_palavras"] = "exploratória, fora do protocolo"
assert set(ROTULO_PROTOCOLO) == set(CONDICOES), "toda condição do código tem um rótulo no mapeamento"


def converter_item(item: dict, ind: Indice) -> dict:
    """Converte um registro do conjunto congelado para o esquema de comum.py, só com as regras fixas do pré-registro."""
    ids = lista_de_ids(item["ids_oficiais"])
    desconhecidos = [i for i in ids if i not in ind.unidades]
    if desconhecidos:
        raise ValueError(f"{item['id']}: ids esperados fora do índice: {desconhecidos}")
    especificos, areas = [], []
    for i in ids:
        u = ind.unidades[i]
        especificos.append("svc:" + u["svc"] if u["tipo"] == "classe" else "id:" + i)
        a = "area:" + u["area"]
        if a not in areas:
            areas.append(a)
    acao = item["acao"]
    if acao not in ("Responder", "Recusar", "Pedir esclarec."):
        raise ValueError(f"{item['id']}: ação inesperada {acao!r}")
    perigo_txt = item["perigo"]
    if not (perigo_txt.startswith("Sim") or perigo_txt.startswith("Não")):
        raise ValueError(f"{item['id']}: campo perigo inesperado {perigo_txt!r}")
    tipo = perigo_txt[perigo_txt.find("(") + 1:perigo_txt.find(")")] if "(" in perigo_txt else ""
    return {"id": item["id"], "texto": item["frase"], "areas": areas, "especificos": especificos, "perigo": perigo_txt.startswith("Sim"),
            "perigo_tipo": tipo, "fora_de_escopo": acao == "Recusar", "acao": acao}


def casa_v1(item: dict, token: str) -> bool:
    if token.startswith("id:"):
        return item.get("id") == token[3:]
    return comum.casa(item, token)


def carregar_conjunto() -> list[dict]:
    dados = json.loads(CONJUNTO.read_bytes().decode("utf-8"))
    if dados["n"] != len(dados["itens"]) or dados["n"] != 190:
        raise ValueError("o conjunto não tem n=190")
    return dados["itens"]


def sha256_bytes(dados: bytes) -> str:
    """SHA-256 dos bytes do arquivo como estão no Git (fim de linha LF). No Windows o checkout pode converter LF em CRLF
    (core.autocrlf); normalizar CRLF para LF devolve os bytes do repositório, que são os que o protocolo fixa."""
    return hashlib.sha256(dados.replace(b"\r\n", b"\n")).hexdigest()


def sha256_do_conjunto() -> str:
    return sha256_bytes(CONJUNTO.read_bytes())


# ------------------------------------------------------------------ cálculo
def anotar_ids(respostas: dict[str, dict], ind: Indice) -> dict[str, dict]:
    """Acrescenta aos itens devolvidos pelo executor o id do índice (recuperado pela chave única)."""
    saida = {}
    for qid, r in respostas.items():
        itens = [dict(i, id=ind.id_do_item(i)) for i in r["itens"]]
        saida[qid] = dict(r, itens=itens)
    return saida


def _acerta(r: dict, tokens: list[str], casa) -> int:
    return int(any(casa(i, t) for i in r["itens"][:3] for t in tokens))


def calcular(perguntas: list[dict], respostas: dict[str, dict], casa=comum.casa, perigo_inclui_fora: bool = False) -> dict:
    """Mesmas definições de comum.metricas (que reproduz avaliacao/avaliar.py) e mais os vetores por mensagem e as métricas do protocolo.

    perigo_inclui_fora=False reproduz comum.metricas (perguntas fora do escopo não entram nas contas de perigo);
    True (conjunto congelado) conta o perigo em todas as mensagens.
    """
    m: dict = defaultdict(int)
    por_msg: dict[str, dict] = {}
    conf: dict[tuple, int] = defaultdict(int)
    niv_pos, niv_neg = Counter(), Counter()
    tipos_pos: dict[str, Counter] = defaultdict(Counter)
    rev_tipo: dict[str, list[int]] = defaultdict(lambda: [0, 0])
    for q in perguntas:
        r = respostas[q["id"]]
        itens = r["itens"]
        mudo = int(bool(r["abstem"]) or not itens)
        acao = q.get("acao", "Recusar" if q["fora_de_escopo"] else "Responder")
        reg = {"categoria": "fora" if q["fora_de_escopo"] else ("vaga" if acao == "Pedir esclarec." else "orientavel")}
        conta_perigo = perigo_inclui_fora or not q["fora_de_escopo"]
        if q["fora_de_escopo"]:
            m["fora_total"] += 1
            m["fora_abstida"] += mudo
        elif acao == "Pedir esclarec.":
            m["vaga_total"] += 1
            m["vaga_abstida"] += mudo
            m["vaga_geral"] += int(bool(r.get("geral")))
        else:
            m["escopo_total"] += 1
            m["respondida"] += int(not mudo)
            m["indevida"] += mudo
            if q["areas"]:
                m["area_total"] += 1
                a = _acerta(r, q["areas"], casa)
                m["area_hit"] += a
                reg["area_hit"] = a
                esperadas = sorted({t.partition(":")[2].split("/")[0] for t in q["areas"]})
                pred = itens[0]["area"] if itens and not r["abstem"] else "abstenção"
                conf[(pred if pred in esperadas else esperadas[0], pred)] += 1
            if q["especificos"]:
                m["spec_total"] += 1
                pos = next((k for k, i in enumerate(itens, 1) if any(casa(i, t) for t in q["especificos"])), None)
                h = int(pos is not None and pos <= 3)
                m["spec_hit"] += h
                reg["spec_hit"] = h
                reg["rr"] = 1 / pos if pos else 0.0
        if conta_perigo:
            tipo = q.get("perigo_tipo", "")
            if q["perigo"]:
                m["perigo_total"] += 1
                m["perigo_ok"] += int(r["perigo"])
                niv_pos[r.get("nivel", 0)] += 1
                tipos_pos[tipo or "-"][tuple(sorted(r.get("tipos", [])))] += 1
                rev_tipo[tipo or "-"][0] += int(r["perigo"])
                rev_tipo[tipo or "-"][1] += 1
            else:
                m["nao_perigo_total"] += 1
                m["falso_alarme"] += int(r["perigo"])
                niv_neg[r.get("nivel", 0)] += 1
                if acao != "Pedir esclarec.":
                    m["nao_perigo_sem_vagas_total"] += 1
                    m["falso_alarme_sem_vagas"] += int(r["perigo"])
        por_msg[q["id"]] = reg
    m = dict(m)
    m["por_msg"] = por_msg
    ordem = [i for i in por_msg if "spec_hit" in por_msg[i]]
    m["ids_spec"] = ordem
    m["spec_vec"] = [por_msg[i]["spec_hit"] for i in ordem]
    m["rr"] = [por_msg[i]["rr"] for i in ordem]
    m["confusao"] = {f"{a}|{b}": v for (a, b), v in sorted(conf.items())}
    m["nivel_positivas"] = dict(niv_pos)
    m["nivel_negativas"] = dict(niv_neg)
    m["tipos_por_perigo"] = {k: {",".join(t) or "(nenhum)": v for t, v in c.items()} for k, c in tipos_pos.items()}
    m["revocacao_por_tipo"] = {k: tuple(v) for k, v in rev_tipo.items()}
    return m


def bootstrap_pareado(vetores: dict[str, list[float]], ref: str, reamostragens: int = BOOTSTRAP_V1, semente: int = SEMENTE_V1) -> dict:
    """Bootstrap pareado por mensagem: as MESMAS reamostragens para todas as condições. Devolve IC da média e da diferença (cond - ref)."""
    nomes = list(vetores)
    n = len(vetores[ref])
    if n == 0 or any(len(v) != n for v in vetores.values()):
        return {}
    rng = random.Random(semente)
    medias: dict[str, list[float]] = {c: [] for c in nomes}
    for _ in range(reamostragens):
        idx = [rng.randrange(n) for _ in range(n)]
        for c in nomes:
            v = vetores[c]
            medias[c].append(sum(v[i] for i in idx) / n)
    lo_i, hi_i = int(0.025 * reamostragens), int(0.975 * reamostragens) - 1
    saida = {}
    for c in nomes:
        s = sorted(medias[c])
        d = sorted(a - b for a, b in zip(medias[c], medias[ref]))
        saida[c] = {"media": sum(vetores[c]) / n, "ic": (s[lo_i], s[hi_i]),
                    "dif_vs_ref": sum(vetores[c]) / n - sum(vetores[ref]) / n, "dif_ic": (d[lo_i], d[hi_i])}
    return saida


def avaliar_criterios(res: dict[str, dict], completo_vs_base: dict) -> dict:
    """Critérios da seção 6 do protocolo, aplicados mecanicamente (sem interpretação).

    completo_vs_base: saída de bootstrap_pareado(..., ref=linha de base)["completo"]: diferença (completo - base) e seu IC pareado.
    """
    c = res["completo"]
    dif = completo_vs_base["dif_vs_ref"]
    lim_inf = completo_vs_base["dif_ic"][0]
    rev = c["perigo_ok"] / c["perigo_total"] if c.get("perigo_total") else None
    melhor_rev = max((r["perigo_ok"] / r["perigo_total"] for r in res.values() if r.get("perigo_total")), default=None)
    fa = c["falso_alarme"] / c["nao_perigo_total"] if c.get("nao_perigo_total") else None
    ind = c["indevida"] / c["escopo_total"] if c.get("escopo_total") else None
    out = {
        "1_diferenca_pp_a_favor_do_completo": 100 * dif,
        "1_ok": 100 * dif >= LIMITES["diferenca_pp"],
        "2_limite_inferior_bootstrap_pareado": lim_inf,
        "2_ok": lim_inf > 0,
        "3_revocacao_global": rev,
        "3_melhor_revocacao_entre_condicoes": melhor_rev,
        "3_ok": rev is not None and rev >= LIMITES["revocacao_perigo"] and (melhor_rev - rev) * 100 <= LIMITES["piora_revocacao_pp"],
        "4_falso_alarme": fa,
        "4_ok": fa is not None and fa <= LIMITES["falso_alarme"],
        "5_abstencao_indevida": ind,
        "5_ok": ind is not None and ind <= LIMITES["abstencao_indevida"],
    }
    out["todos_ok"] = all(out[k] for k in ("1_ok", "2_ok", "3_ok", "4_ok", "5_ok"))
    return out


TEXTO_NAO_SUPEROU = ("No conjunto sintético e congelado deste estudo, o sistema híbrido não demonstrou superioridade pré-especificada sobre a linha de base lexical "
                     "simples em Resposta@3 específica. As diferenças observadas foram tratadas como evidência insuficiente de ganho incremental dos componentes combinados, "
                     "e não como confirmação de superioridade. Os resultados delimitam o desempenho nos cenários fictícios avaliados e não demonstram eficácia com usuárias reais.")
TEXTO_REVOCACAO_BAIXA = ("A revocação de perigo observada não atingiu o limiar definido previamente. Portanto, o sistema não deve ser apresentado como mecanismo confiável de triagem "
                         "ou proteção; sua função permanece limitada à orientação experimental e requer revisão especializada.")


# ------------------------------------------------------------------ execução das condições
def executar_condicoes(perguntas: list[dict], ind: Indice) -> dict[str, dict]:
    """Executa as 10 condições sobre as perguntas entregues e devolve as respostas já com o id do índice nos itens."""
    saida = {}
    for nome in CONDICOES:
        resp = ablacao.rodar_tfidf(perguntas) if nome == BASE_LEXICAL else comum.rodar_variante(nome, perguntas)
        saida[nome] = anotar_ids(resp, ind)
    return saida


def analisar(perguntas: list[dict], respostas_por_condicao: dict[str, dict], excluir: tuple = ()) -> dict:
    qs = [q for q in perguntas if q["id"] not in excluir]
    res = {c: calcular(qs, respostas_por_condicao[c], casa_v1, perigo_inclui_fora=True) for c in CONDICOES}
    spec = {c: [float(x) for x in res[c]["spec_vec"]] for c in CONDICOES}
    mrr = {c: res[c]["rr"] for c in CONDICOES}
    boot_spec = bootstrap_pareado(spec, "completo")
    boot_mrr = bootstrap_pareado(mrr, "completo")
    criterios = avaliar_criterios(res, bootstrap_pareado(spec, BASE_LEXICAL)["completo"]) if res["completo"].get("spec_total") else {}
    return {"n_mensagens": len(qs), "metricas": res, "boot_spec": boot_spec, "boot_mrr": boot_mrr, "criterios": criterios}


def _fmt(k: int, n: int) -> str:
    if not n:
        return "n/d"
    lo, hi = comum.wilson(k, n)
    return f"{100 * k / n:.1f}% ({k}/{n}) [{100 * lo:.1f}–{100 * hi:.1f}]"


def relatorio_md(titulo: str, analise: dict) -> list[str]:
    res, bs, bm = analise["metricas"], analise["boot_spec"], analise["boot_mrr"]
    md = [f"## {titulo} ({analise['n_mensagens']} mensagens)", "",
          "| Condição | R@3 área | R@3 específica | MRR [IC 95% bootstrap] | Dif. R@3 esp. vs completo [IC pareado] | Revocação de perigo | Especificidade (sem vagas) | Especificidade (todas) | Falso alarme (todas) | Falso alarme (sem vagas) | Abstenção correta (Recusar) | Abstenção indevida |",
          "|---|---|---|---|---|---|---|---|---|---|---|---|"]
    for c in CONDICOES:
        m = res[c]
        espec_sv = _fmt(m["nao_perigo_sem_vagas_total"] - m["falso_alarme_sem_vagas"], m["nao_perigo_sem_vagas_total"])
        espec_t = _fmt(m["nao_perigo_total"] - m["falso_alarme"], m["nao_perigo_total"])
        b, mm = bs.get(c), bm.get(c)
        md.append(f"| {c} ({ROTULO_PROTOCOLO[c]}) | {_fmt(m.get('area_hit', 0), m.get('area_total', 0))} | {_fmt(m.get('spec_hit', 0), m.get('spec_total', 0))} | "
                  f"{(mm['media'] if mm else float('nan')):.3f} [{(mm['ic'][0] if mm else float('nan')):.3f}–{(mm['ic'][1] if mm else float('nan')):.3f}] | "
                  f"{(100 * b['dif_vs_ref'] if b else float('nan')):+.1f} pp [{(100 * b['dif_ic'][0] if b else float('nan')):+.1f}; {(100 * b['dif_ic'][1] if b else float('nan')):+.1f}] | "
                  f"{_fmt(m.get('perigo_ok', 0), m.get('perigo_total', 0))} | {espec_sv} | {espec_t} | "
                  f"{_fmt(m['falso_alarme'], m['nao_perigo_total'])} | {_fmt(m['falso_alarme_sem_vagas'], m['nao_perigo_sem_vagas_total'])} | "
                  f"{_fmt(m.get('fora_abstida', 0), m.get('fora_total', 0))} | {_fmt(m.get('indevida', 0), m.get('escopo_total', 0))} |")
    md += ["", "Vagas (Pedir esclarec.): abstenção/ausência de item e campo `geral` da saída (não é pedido de esclarecimento verificado):", ""]
    for c in CONDICOES:
        m = res[c]
        md.append(f"- {c}: abstém ou sem item {m.get('vaga_abstida', 0)}/{m.get('vaga_total', 0)}; `geral` verdadeiro {m.get('vaga_geral', 0)}/{m.get('vaga_total', 0)}")
    md += ["", "Nível do alerta por condição (positivas | negativas; 1 = aviso discreto, 2 = alerta completo):", ""]
    for c in CONDICOES:
        md.append(f"- {c}: positivas {json.dumps(res[c]['nivel_positivas'], sort_keys=True)}; negativas {json.dumps(res[c]['nivel_negativas'], sort_keys=True)}")
    md += ["", "Revocação por tipo de perigo (condição `completo`): " + "; ".join(f"{t}: {_fmt(a, b)}" for t, (a, b) in sorted(res["completo"]["revocacao_por_tipo"].items())), "",
           "Matriz de confusão por área (condição `completo`; linha = área esperada, coluna = previsão):", ""]
    for k, v in res["completo"]["confusao"].items():
        md.append(f"- {k.replace('|', ' → ')}: {v}")
    cr = analise["criterios"]
    if cr:
        md += ["", "Critérios do protocolo (seção 6), aplicados mecanicamente:", ""]
        for k, v in cr.items():
            md.append(f"- {k}: {v}")
        if not cr["1_ok"] or not cr["2_ok"]:
            md += ["", "> " + TEXTO_NAO_SUPEROU]
        if not cr["3_ok"]:
            md += ["", "> " + TEXTO_REVOCACAO_BAIXA]
    return md


def etapa_b() -> None:
    """EXECUÇÃO ÚNICA. Só roda com --etapa-b e --confirmo-etapa-b-autorizada, depois da autorização escrita do autor."""
    if sha256_do_conjunto() != SHA256_ESPERADO:
        raise SystemExit("SHA-256 do conjunto diferente do esperado: não executa.")
    pasta = RAIZ / "reproducao" / "resultados" / "conjunto_v1"
    if pasta.exists():
        raise SystemExit("reproducao/resultados/conjunto_v1 já existe: a execução principal é única; não repete.")
    ind = Indice()
    itens = carregar_conjunto()
    qs = [converter_item(i, ind) for i in itens]
    brutas = executar_condicoes(qs, ind)
    pasta.mkdir(parents=True)
    (pasta / "saidas_brutas.json").write_text(json.dumps(brutas, ensure_ascii=False), encoding="utf-8")
    principal = analisar(qs, brutas)
    sens = analisar(qs, brutas, EXCLUIDOS_SENSIBILIDADE)
    (pasta / "metricas.json").write_text(json.dumps({"principal": _serializavel(principal), "sensibilidade_sem_C123_C041_C088_D030": _serializavel(sens)},
                                                      ensure_ascii=False, indent=1), encoding="utf-8")
    md = ["# Execução única do conjunto congelado v1", "", f"- Conjunto SHA-256: `{sha256_do_conjunto()}`", f"- Semente do bootstrap: {SEMENTE_V1}; reamostragens: {BOOTSTRAP_V1}", ""]
    md += relatorio_md("Resultado principal (190 mensagens)", principal) + [""]
    md += relatorio_md("Análise de sensibilidade (sem C-123, C-041, C-088 e D-030)", sens)
    (pasta / "resultados.md").write_text("\n".join(md) + "\n", encoding="utf-8", newline="\n")
    print("ok:", pasta)


def _serializavel(a: dict) -> dict:
    def limpa(m):
        return {k: v for k, v in m.items() if k not in ("por_msg",)}
    return {"n_mensagens": a["n_mensagens"], "metricas": {c: limpa(m) for c, m in a["metricas"].items()}, "boot_spec": a["boot_spec"],
            "boot_mrr": a["boot_mrr"], "criterios": a["criterios"]}


# ------------------------------------------------------------------ validação (Etapa A)
def conferir_conjunto() -> None:
    """Só lê o gabarito e mostra os denominadores. NÃO executa o sistema."""
    sha = sha256_do_conjunto()
    ind = Indice()
    brutos = carregar_conjunto()
    qs = [converter_item(i, ind) for i in brutos]
    print("tipo de ids_oficiais no arquivo:", dict(Counter(type(i["ids_oficiais"]).__name__ for i in brutos)), "(texto seria convertido com ast.literal_eval)")
    print("SHA-256 (bytes do Git, fim de linha LF):", sha, "(confere)" if sha == SHA256_ESPERADO else "(DIFERENTE do esperado)")
    print("SHA-256 do arquivo no disco, sem normalizar:", hashlib.sha256(CONJUNTO.read_bytes()).hexdigest(), "(difere do anterior só se o checkout converteu LF em CRLF)")
    print("n =", len(qs))
    print("ação:", dict(Counter(q["acao"] for q in qs)))
    print("perigo (Sim/Não):", dict(Counter(q["perigo"] for q in qs)), "| tipos:", dict(Counter(q["perigo_tipo"] for q in qs if q["perigo"])))
    print("com destino esperado (denominador de R@3 específica e de área):", sum(1 for q in qs if q["especificos"]))
    print("negativas:", sum(1 for q in qs if not q["perigo"]), "| negativas exceto 'Pedir esclarec.':", sum(1 for q in qs if not q["perigo"] and q["acao"] != "Pedir esclarec."))
    print("sensibilidade exclui:", ", ".join(EXCLUIDOS_SENSIBILIDADE), "| presentes:", sum(1 for q in qs if q["id"] in EXCLUIDOS_SENSIBILIDADE))
    print("chaves do índice sem colisão; reforços sem unidade correspondente:", ind.reforcos_sem_unidade)


def validar() -> int:
    """3a: o adaptador reproduz EXATAMENTE reproducao/resultados/ablacao_depois.csv; 3b: teste sintético de ponta a ponta."""
    ind = Indice()
    por, _ = comum.carregar_perguntas()
    esperado = {(r["condicao"], r["conjunto"], r["metrica"]): r for r in csv.DictReader((RAIZ / "reproducao" / "resultados" / "ablacao_depois.csv").open(encoding="utf-8"))}
    diferencas, comparadas = [], 0
    for nome in CONDICOES:
        for conj in comum.CONJUNTOS:
            qs = por[conj]
            resp = ablacao.rodar_tfidf(qs) if nome == BASE_LEXICAL else comum.rodar_variante(nome, qs)
            m = calcular(qs, resp)  # mesmo caminho de cálculo do adaptador, gabarito original (tokens area:/svc:/sec:)
            ref = comum.metricas(qs, resp)
            for chave in ("fora_total", "fora_abstida", "escopo_total", "respondida", "area_total", "area_hit", "spec_total", "spec_hit", "perigo_total", "perigo_ok", "nao_perigo_total", "falso_alarme"):
                if m.get(chave, 0) != ref.get(chave, 0):
                    diferencas.append(f"{nome}/{conj}/{chave}: adaptador {m.get(chave, 0)} x comum.metricas {ref.get(chave, 0)}")
            if m["rr"] != ref["rr"]:
                diferencas.append(f"{nome}/{conj}: vetor de recíprocos diferente de comum.metricas")
            for metrica, _, kk, nn in ablacao.METRICAS:
                k, n = m.get(kk, 0), m.get(nn, 0)
                lo, hi = comum.wilson(k, n)
                lin = esperado[(nome, conj, metrica)]
                obtido = (str(k), str(n), "" if n == 0 else str(round(k / n, 4)), "" if n == 0 else str(round(lo, 4)), "" if n == 0 else str(round(hi, 4)))
                alvo = (lin["acertos"], lin["total"], lin["valor"], lin["ic95_inferior"], lin["ic95_superior"])
                comparadas += 1
                if obtido != alvo:
                    diferencas.append(f"{nome}/{conj}/{metrica}: adaptador {obtido} x CSV {alvo}")
            rr = m["rr"]
            lo, hi = comum.bootstrap_media(rr)
            lin = esperado[(nome, conj, "mrr")]
            obtido = (str(len(rr)), str(round(sum(rr) / len(rr), 4)) if rr else "", str(round(lo, 4)) if rr else "", str(round(hi, 4)) if rr else "")
            alvo = (lin["total"], lin["valor"], lin["ic95_inferior"], lin["ic95_superior"])
            comparadas += 1
            if obtido != alvo:
                diferencas.append(f"{nome}/{conj}/mrr: adaptador {obtido} x CSV {alvo}")
    print(f"3a: {comparadas} medidas comparadas com ablacao_depois.csv (10 condições x 2 conjuntos x 7 métricas); diferenças: {len(diferencas)}")
    for d in diferencas:
        print("  DIFERENÇA:", d)
    if diferencas:
        return 1
    print("3a: o adaptador reproduz EXATAMENTE os números de ablacao_depois.csv (acertos, totais, valores e intervalos).")
    return sintetico(ind)


SINTETICO = [  # 5 itens inventados, NÃO do conjunto congelado; ids existentes no índice atual
    {"id": "S-001", "frase": "onde posso encontrar atendimento jurídico gratuito para mulheres", "area": "Direitos", "codigos": "", "perigo": "Não", "acao": "Responder",
     "codigos_lista": [], "ids_oficiais": ["man-secretaria-mulher"]},
    {"id": "S-002", "frase": "preciso de um posto de saúde perto de casa para consulta", "area": "Saúde", "codigos": "", "perigo": "Não", "acao": "Responder",
     "codigos_lista": [], "ids_oficiais": ["classe-saude-ubs"]},
    {"id": "S-003", "frase": "meu marido me ameaça de morte e eu tenho medo", "area": "Direitos (Violência)", "codigos": "", "perigo": "Sim (Violência)", "acao": "Responder",
     "codigos_lista": [], "ids_oficiais": ["man-secretaria-mulher"]},
    {"id": "S-004", "frase": "qual a melhor receita de bolo de chocolate", "area": "Fora do escopo", "codigos": "", "perigo": "Não", "acao": "Recusar",
     "codigos_lista": [], "ids_oficiais": []},
    {"id": "S-005", "frase": "preciso de ajuda", "area": "Frase vaga", "codigos": "", "perigo": "Não", "acao": "Pedir esclarec.", "codigos_lista": [], "ids_oficiais": []},
]


def sintetico(ind: Indice) -> int:
    qs = [converter_item(i, ind) for i in SINTETICO]
    brutas = executar_condicoes(qs, ind)
    principal = analisar(qs, brutas)
    sens = analisar(qs, brutas, ("S-005",))
    assert principal["n_mensagens"] == 5 and sens["n_mensagens"] == 4
    m = principal["metricas"]["completo"]
    assert m["escopo_total"] == 3 and m["fora_total"] == 1 and m["vaga_total"] == 1 and m["perigo_total"] == 1 and m["nao_perigo_total"] == 4
    assert m["nao_perigo_sem_vagas_total"] == 3
    assert set(principal["boot_spec"]) == set(CONDICOES) and principal["criterios"]
    print("3b: subconjunto sintético (5 itens inventados) executado de ponta a ponta nas 10 condições, com sensibilidade (sem S-005), bootstrap pareado "
          f"({BOOTSTRAP_V1} reamostragens, semente {SEMENTE_V1}) e critérios.")
    print("    completo, sintético:", {k: m[k] for k in ("area_hit", "area_total", "spec_hit", "spec_total", "perigo_ok", "perigo_total", "falso_alarme", "nao_perigo_total", "indevida", "escopo_total", "fora_abstida", "fora_total")})
    return 0


# ------------------------------------------------------------------ manifesto
def _sha(p: Path) -> str:
    return sha256_bytes(p.read_bytes())


def _git(*a: str) -> str:
    return subprocess.run(["git", *a], capture_output=True, text=True, encoding="utf-8", cwd=RAIZ).stdout.strip()


def gerar_manifesto() -> None:
    freeze = subprocess.run([sys.executable, "-m", "pip", "freeze"], capture_output=True, text=True, encoding="utf-8").stdout.strip().splitlines()
    node = subprocess.run(["node", "--version"], capture_output=True, text=True).stdout.strip()
    tag = _git("rev-parse", "v1.0-pesquisa^{commit}")
    head = _git("rev-parse", "HEAD")
    base = _git("rev-parse", "origin/main")
    linhas_hash = lambda arqs: [f"| `{p.relative_to(RAIZ).as_posix()}` | `{_sha(p)}` |" for p in arqs]  # noqa: E731
    dados = sorted((RAIZ / "web" / "dados").glob("modelo_*.json")) + [RAIZ / "web" / "dados" / "indice_orientacao.json"]
    catalogo = sorted((RAIZ / "catalogo").glob("*.csv")) + sorted((RAIZ / "catalogo").glob("*.txt"))
    scripts = sorted((RAIZ / "reproducao").glob("*.py")) + [RAIZ / "reproducao" / "rodar_variantes.js"]
    codigo = [RAIZ / "web" / n for n in ("orientar.js", "perigo.js", "ia.js", "necessidades.js", "orientacao-ui.js")]  # o detector de escopo está em ia.js; não existe web/escopo.js
    manifesto_hash = RAIZ / "protocolo" / "CONJUNTO_CONGELADO_v1.sha256"
    md = ["# Manifesto da execução única do conjunto congelado v1", "",
          "Execução principal única; nenhuma saída parcial será inspecionada para orientar mudanças.", "",
          "Este manifesto foi preenchido na Etapa A (preparação), **antes** de qualquer execução do sistema sobre o conjunto congelado. As decisões de método abaixo são "
          "PRÉ-REGISTRO: foram tomadas antes de qualquer execução e não serão alteradas com base nos resultados.", "",
          f"- Data e hora (UTC) da geração: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')}",
          "- Responsável pelo congelamento: a preencher pelo autor (não informado na preparação deste manifesto).", "",
          "## 1. Integridade", "",
          f"- SHA-256 de `protocolo/conjunto_congelado_v1.json`: `{sha256_do_conjunto()}` (esperado `{SHA256_ESPERADO}`: {'confere' if sha256_do_conjunto() == SHA256_ESPERADO else 'DIFERENTE'})",
          f"- SHA-256 do arquivo de hash `protocolo/CONJUNTO_CONGELADO_v1.sha256`: `{_sha(manifesto_hash)}`",
          f"- Gabarito: está no próprio arquivo do conjunto (mesmo SHA-256). n = 190.",
          f"- Commit da etiqueta `v1.0-pesquisa`: `{tag}`",
          f"- Commit de `origin/main` usado: `{base}`; commit-base do ramo `execucao/conjunto-v1-preparacao` na geração: `{head}` (o commit que traz o adaptador e este manifesto vem logo depois)",
          "- O código do sistema avaliado é o da etiqueta; `web/dados/` (modelos e índice), `pipeline/`, `catalogo/` e `avaliacao/` da `main` são idênticos aos da etiqueta, "
          "exceto arquivos novos do mapa territorial (fora do sistema avaliado): `web/dados/indicadores_territoriais.json`, `pipeline/territorial_*.py` e seus testes. "
          "Os scripts de `reproducao/` vêm da `main`. Observação: `web/escopo.js` não existe no repositório (o detector de escopo é `criarClassificador` em `web/ia.js`, com o modelo `web/dados/modelo_escopo.json`).", "",
          "## 2. Ambiente", "",
          f"- Python `{platform.python_version()}`; Node `{node}`; sistema `{platform.platform()}`; arquitetura `{platform.machine()}` ({platform.architecture()[0]})",
          "- Bibliotecas do interpretador que executará a Etapa B (`python -m pip freeze`; o adaptador e a execução só usam a biblioteca padrão do Python e o Node):", "", "```text"] + (freeze or ["(nenhum pacote instalado)"]) + ["```", "",
          "## 3. Comandos exatos", "", "Da raiz do repositório, com `PYTHONHASHSEED=0` (definido antes de iniciar o Python):", "", "```bash",
          "export PYTHONHASHSEED=0 PYTHONUTF8=1",
          "python reproducao/conjunto_v1.py --conferir-conjunto      # Etapa A: só lê o gabarito",
          "python reproducao/conjunto_v1.py --validar                # Etapa A: dev/teste contra ablacao_depois.csv + subconjunto sintético",
          "python reproducao/conjunto_v1.py --etapa-b --confirmo-etapa-b-autorizada   # Etapa B (única execução; só após autorização escrita)", "```", "",
          "Cada condição é executada por `reproducao/rodar_variantes.js --condicao <nome>` (as 9 primeiras) ou por `ablacao.rodar_tfidf` (linha de base), com as perguntas do conjunto "
          "entregues por arquivo temporário:", ""]
    for nome, rotulo, desc in ablacao.CONDICOES:
        md.append(f"- `{nome}`: {rotulo}. {desc}.")
    md += ["", "## 4. Pré-registro das decisões de método", "",
           "1. **Conversão:** texto = `frase`; especificos = `ids_oficiais`; áreas = áreas dos ids esperados no índice; perigo esperado = campo `perigo` começa com \"Sim\"; "
           "ação \"Responder\" = orientável, \"Recusar\" = fora do escopo, \"Pedir esclarec.\" = vaga.",
           "2. **Acerto específico:** algum dos 3 primeiros itens tem id igual a um esperado, ou, se o esperado é de tipo `classe`, o item tem o mesmo `svc` da classe. O id do item é "
           "recuperado pela chave única (area, sec, svc, titulo) do índice, porque `rodar_variantes.js` não devolve o id.",
           "3. **Acerto de área:** algum dos 3 primeiros itens tem área no conjunto das áreas esperadas. Mensagens sem ids esperados não entram nos denominadores de Resposta@3.",
           "4. **Especificidade de perigo:** denominador = negativas exceto \"Pedir esclarec.\" (principal); a versão com todas as negativas é publicada. **Falso alarme:** FP / todas as negativas; "
           "a versão sem \"Pedir esclarec.\" também é publicada.",
           "5. **Abstenção correta:** \"Recusar\" em que o sistema se abstém ou não mostra item. **Abstenção indevida:** \"Responder\" em que o sistema se abstém ou não mostra item. "
           "Para \"Pedir esclarec.\" publica-se a abstenção à parte; que o sistema \"peça esclarecimento\" é NÃO VERIFICADO (a saída tem só `abstem` e `geral`).",
           "6. **Aviso discreto e alerta completo:** registrados pelo campo `nivel` da saída (1 = aviso discreto, 2 = alerta completo), conforme `web/perigo.js`.",
           "7. **Matriz de confusão por área:** previsão = área do 1º item ou \"abstenção\"; se a previsão está entre as áreas esperadas, vai à diagonal dessa área; senão, à linha da primeira área esperada em ordem alfabética.",
           "8. **Incerteza:** Wilson de 95% para proporções; bootstrap pareado por mensagem, 10.000 reamostragens, semente 20261106, percentil de 95% (posições 2,5% e 97,5% das médias ordenadas), "
           "as mesmas reamostragens para todas as condições, para MRR, Resposta@3 específica e diferenças.",
           "9. **MRR:** recíproco da posição do primeiro item esperado em toda a lista devolvida, como em `comum.metricas`; zero se nenhum aparece. Precision@3, Recall@3, Macro-F1 e acurácia balanceada "
           "NÃO são calculadas nesta execução (a convenção de denominador não foi pré-definida no protocolo).",
           "10. **Escolha da linha de base (protocolo, seção 3, condição 10):** TF-IDF simples, condição `linha_de_base_tfidf`. O protocolo permite BM25 apenas se houver implementação versionada disponível; a busca por \"bm25\" nos arquivos de código do repositório (`.py`, `.js`, `.json`; fora de `docs/` e `protocolo/`) em 07/11/2026 não encontrou nenhuma, por isso a escolha é TF-IDF. Ela é também a melhor linha de base lexical dos critérios de sucesso; comparações com as demais condições são publicadas como complementares.",
           "11. **Sensibilidade:** todas as métricas repetidas sem C-123, C-041, C-088 e D-030; o resultado com os 190 registros é o principal.",
           "12. **Critérios de sucesso (protocolo, seção 6), aplicados mecanicamente:** (1) diferença de Resposta@3 específica ≥ 5 pontos percentuais a favor de `completo` sobre `linha_de_base_tfidf`; "
           "(2) limite inferior do IC bootstrap pareado de 95% da diferença > 0; (3) revocação global de perigo ≥ 90% e sem piora superior a 5 pontos em relação à melhor condição de segurança; "
           "(4) falso alarme ≤ 5% (todas as negativas); (5) abstenção indevida ≤ 15%. Os textos pré-definidos do protocolo são anexados ao relatório quando se aplicam.", "",
           "13. **Campo `ids_oficiais`:** se vier como texto no formato de lista do Python, é convertido com `ast.literal_eval` (nunca `eval`). Verificado em 07/11/2026 no arquivo congelado (mesmo SHA-256): "
           "as 190 entradas trazem `ids_oficiais` como lista JSON (e não como texto), então a conversão por `ast.literal_eval` está implementada e testada, mas não é exercida neste arquivo.", "",
           "## 5. Mapeamento das condições do protocolo para as do código", "",
           "As 10 condições do protocolo (seção 3) e as 10 de `reproducao/ablacao.py` NÃO coincidem uma a uma. Regras fixas, definidas antes de qualquer execução:", "",
           "| Protocolo | Condição do protocolo | Condição do código | Situação |", "|---|---|---|---|"] + [
           f"| {n} | {nome} | {('`' + cod + '`') if cod else '(nenhuma)'} | {sit} |" for n, nome, cod, sit in MAPEAMENTO] + [
           "| (só no código) | `apenas_modelo_necessidades` | `apenas_modelo_necessidades` | complementar: é a mais próxima do protocolo 9, mas NÃO a implementa |",
           "| (só no código) | `sem_palavras` | `sem_palavras` | exploratória, fora do protocolo; não entra nos critérios de sucesso |", "",
           "Regras: (a) protocolo 1, 3, 4, 6, 7 e 10 = `completo`, `sem_ngramas_letras`, `sem_lsa`, `sem_perigo_aprendido`, `sem_escopo` e `linha_de_base_tfidf`; (b) protocolo 5 (sem classificador de necessidades) = `apenas_regras`; "
           "(c) protocolo 2 (sem regras lexicais) = `sem_regras_lexicais_necessidade`; (d) protocolo 8 e 9 NÃO estão implementados como o protocolo os define: NÃO VERIFICADO, e nenhuma variante nova foi criada; "
           "(e) `sem_palavras` existe só no código e é exploratória. Os critérios de sucesso usam apenas `completo` e `linha_de_base_tfidf`.", "",
           "### Composição real de cada condição do código", "",
           "- `completo`: orientador v2 como em `avaliacao/sistema_v2.js` (regras e modelo de necessidades, detector de perigo aprendido, detector de escopo, índice com palavras, letras e LSA).",
           "- `apenas_regras` (protocolo 5): só o **sinal de intenção** vem das regras lexicais de necessidade, sem o modelo de necessidades. A busca estatística (palavras, letras, LSA), o detector de perigo aprendido e o detector de escopo continuam ativos. "
           "Por isso NÃO é a condição 8 do protocolo (só regras, sem busca estatística, LSA ou classificadores aprendidos).",
           "- `apenas_modelo_necessidades` (complementar; a mais próxima do protocolo 9): só o sinal de intenção vem do modelo de necessidades (regressão logística), sem as regras lexicais de necessidade. O restante do sistema (busca por palavras, letras e LSA, "
           "detector de perigo aprendido e regras de perigo, detector de escopo) continua ativo. Por isso NÃO é a condição 9 do protocolo (só componentes aprendidos, sem pontes lexicais manuais): protocolo 9 NÃO VERIFICADO.",
           "- `sem_regras_lexicais_necessidade` (protocolo 2): configuração idêntica à de `apenas_modelo_necessidades` neste motor, porque as regras lexicais de necessidade só entram pelo sinal de intenção. "
           "As \"regras e pontes lexicais de orientação\" de `web/orientar.js` que não passam por esse sinal continuam ativas; o isolamento exato da condição 2 não foi confirmado por teste dedicado.",
           "- `sem_ngramas_letras` (protocolo 3) e `sem_lsa` (protocolo 4): o peso do sinal correspondente no índice vale 0 (o cálculo continua; só a contribuição na nota é anulada). A ausência de efeitos colaterais em outros sinais não foi confirmada por teste dedicado.",
           "- `sem_palavras` (exploratória, fora do protocolo): peso do sinal de palavras do índice = 0.",
           "- `sem_perigo_aprendido` (protocolo 6): não carrega `modelo_perigo.json`; permanecem as regras de segurança de `web/perigo.js`.",
           "- `sem_escopo` (protocolo 7): não carrega o detector de escopo; só a nota da busca decide a abstenção.",
           "- `linha_de_base_tfidf` (protocolo 10, Busca simples): TF-IDF de palavras sobre o campo `texto` dos destinos do índice; normalização NFD sem acentos, minúsculas, tokens com 2 ou mais caracteres; tf = 1 + log(contagem); "
           "idf = log((1 + N)/(1 + df)) + 1; vetores normalizados; similaridade do cosseno; até 6 itens com nota > 0; abstém só se nenhuma palavra casar; sem detector de perigo (revocação 0 por construção).", "",
           "## 6. Parâmetros e limiares", "",
           "- Sementes: bootstrap 20261106 (dez mil reamostragens); `PYTHONHASHSEED=0`. A validação do adaptador com desenvolvimento e teste usa a semente e as 2.000 reamostragens de `ablacao.py` (20261105) para reproduzir `ablacao_depois.csv`.",
           "- Limiares do sistema: os dos modelos versionados (`web/dados/modelo_*.json`); nenhum é alterado.",
           "- Limites dos critérios: " + json.dumps(LIMITES, ensure_ascii=False), "",
           "## 7. SHA-256 dos arquivos usados", "", "Modelos e índice:", "", "| Arquivo | SHA-256 |", "|---|---|"] + linhas_hash(dados) + [
           "", "Código do orientador (`web/`):", "", "| Arquivo | SHA-256 |", "|---|---|"] + linhas_hash(codigo) + [
           "", "Catálogo:", "", "| Arquivo | SHA-256 |", "|---|---|"] + linhas_hash(catalogo) + [
           "", "Scripts de `reproducao/` usados:", "", "| Arquivo | SHA-256 |", "|---|---|"] + linhas_hash(scripts)
    (RAIZ / "reproducao" / "MANIFESTO_EXECUCAO_v1.md").write_text("\n".join(md) + "\n", encoding="utf-8", newline="\n")
    print("ok: reproducao/MANIFESTO_EXECUCAO_v1.md")


def main(argv: list[str]) -> int:
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:  # noqa: BLE001
        pass
    if "--conferir-conjunto" in argv:
        conferir_conjunto()
        return 0
    if "--validar" in argv:
        return validar()
    if "--gerar-manifesto" in argv:
        gerar_manifesto()
        return 0
    if "--etapa-b" in argv:
        if "--confirmo-etapa-b-autorizada" not in argv:
            print("A Etapa B só roda com --confirmo-etapa-b-autorizada, depois da autorização escrita do autor. Nada foi executado.")
            return 2
        etapa_b()
        return 0
    print(__doc__)
    return 2


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
