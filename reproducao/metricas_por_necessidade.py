"""Métricas por área e do detector de perigo para o orientador completo (EXPLORATÓRIAS).

Só desenvolvimento e teste, sem as perguntas marcadas visto_no_treino. Como esses conjuntos já foram usados em ajustes, os números são
exploratórios. Nenhum modelo é treinado e nenhum arquivo fora de reproducao/ é escrito.

Uso (da raiz do repositório):   python reproducao/metricas_por_necessidade.py
Saídas em reproducao/resultados/: confusao_area_<conjunto>.csv, metricas_area_<conjunto>.csv, perigo_confusao_<conjunto>.csv,
perigo_metricas_<conjunto>.csv e metricas_por_necessidade.md.
"""
from __future__ import annotations

import csv
import sys
from collections import Counter, defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import comum  # noqa: E402

SAIDA = comum.RAIZ / "reproducao" / "resultados"
ABST = "abstenção"
FORA = "fora de escopo"
TODOS = "desenvolvimento + teste (agrupados)"


def area_esperada(q: dict, primeira: str | None) -> str | None:
    """Área esperada da pergunta. Se houver mais de uma área aceita e o primeiro cartão cair em uma delas, vale essa (acerto);
    senão vale a primeira área listada no gabarito."""
    areas = [t.split(":", 1)[1] for t in q["areas"] if t.startswith("area:")]
    if not areas:
        return None
    return primeira if primeira in areas else areas[0]


def primeiro_cartao(r: dict) -> str:
    if r["abstem"] or not r["itens"]:
        return ABST
    return r["itens"][0].get("area") or ABST


def matriz_area(perguntas: list[dict], respostas: dict[str, dict]) -> tuple[Counter, int]:
    """Conta (esperada, prevista). Perguntas em escopo sem área no gabarito ficam de fora e são contadas à parte."""
    c: Counter = Counter()
    sem_area = 0
    for q in perguntas:
        prev = primeiro_cartao(respostas[q["id"]])
        if q["fora_de_escopo"]:
            c[(FORA, prev)] += 1
            continue
        esp = area_esperada(q, prev)
        if esp is None:
            sem_area += 1
            continue
        c[(esp, prev)] += 1
    return c, sem_area


def prf(c: Counter) -> tuple[list[dict], float, float]:
    """Precisão, revocação e F1 por área; macro-F1 e acurácia balanceada sobre as áreas com suporte (perguntas em escopo)."""
    areas = sorted({e for (e, _) in c if e != FORA})
    previstas = sorted({p for (_, p) in c if p != ABST} | set(areas))
    linhas = []
    for a in previstas:
        tp = c[(a, a)]
        suporte = sum(v for (e, _), v in c.items() if e == a)
        previsto_a = sum(v for (_, p), v in c.items() if p == a)
        prec = tp / previsto_a if previsto_a else float("nan")
        rev = tp / suporte if suporte else float("nan")
        f1 = (2 * prec * rev / (prec + rev)) if suporte and previsto_a and (prec + rev) > 0 else (0.0 if suporte else float("nan"))
        linhas.append({"area": a, "suporte": suporte, "previstas_como_esta": previsto_a, "acertos": tp, "precisao": prec, "revocacao": rev, "f1": f1})
    com_suporte = [l for l in linhas if l["suporte"] > 0]
    macro = sum(l["f1"] for l in com_suporte) / len(com_suporte) if com_suporte else float("nan")
    bal = sum(l["revocacao"] for l in com_suporte) / len(com_suporte) if com_suporte else float("nan")
    return linhas, macro, bal


def f(x: float) -> str:
    return "n/d" if x != x else f"{x:.2f}"


def fp(k: int, n: int) -> str:
    if n == 0:
        return "n/d"
    lo, hi = comum.wilson(k, n)
    return f"{100 * k / n:.0f}% ({k}/{n}) [{100 * lo:.0f}–{100 * hi:.0f}]"


def perigo(perguntas: list[dict], respostas: dict[str, dict]) -> dict:
    cont: Counter = Counter()  # (rotulo, saida) -> n ; saida in {"completo","discreto","nenhum"}
    por_tipo_det: Counter = Counter()
    violencia = Counter()
    for q in perguntas:
        r = respostas[q["id"]]
        saida = {2: "completo", 1: "discreto"}.get(r["nivel"], "nenhum")
        rot = "perigo" if q["perigo"] else "sem perigo"
        cont[(rot, saida)] += 1
        if q["perigo"]:
            for t in r["tipos"] or ["(nenhum)"]:
                por_tipo_det[t] += 1
            if q["categoria"] == "violencia":
                violencia["n"] += 1
                violencia["detectou_violencia"] += int("violencia" in r["tipos"] and r["nivel"] >= 1)
                violencia["completo"] += int(r["nivel"] == 2)
    return {"cont": cont, "tipos_detectados": por_tipo_det, "violencia": violencia}


def main() -> None:
    SAIDA.mkdir(parents=True, exist_ok=True)
    por, excluidas = comum.carregar_perguntas()
    meta = comum.versoes()
    resp = {conj: comum.rodar_variante("completo", por[conj]) for conj in comum.CONJUNTOS}
    grupos = {conj: (por[conj], resp[conj]) for conj in comum.CONJUNTOS}
    grupos[TODOS] = (por["desenvolvimento"] + por["teste"], {**resp["desenvolvimento"], **resp["teste"]})

    md = ["# Métricas por área e do detector de perigo: resultados EXPLORATÓRIOS", "",
          "> **EXPLORATÓRIO.** Desenvolvimento e teste já foram usados em ajustes do sistema; os números descrevem o comportamento do orientador "
          "completo nessas perguntas, não um desempenho independente. Independente, reserva e final não foram executados.", "",
          "## Como foi gerado", "",
          f"- Comando: `{meta['comando']}`",
          f"- Commit: `{meta['commit']}` (ramo `{meta['ramo']}`); alterações fora de `reproducao/`: {'nenhuma' if not meta['alteracoes_fora_de_reproducao'] else meta['alteracoes_fora_de_reproducao']}",
          f"- Node `{meta['node']}`; Python `{meta['python']}`; sistema `{meta['sistema']}`; data (UTC) {meta['data_utc']}",
          "- Sistema: orientador completo (`reproducao/rodar_variantes.js`, condição `completo`, cópia adaptada de `avaliacao/sistema_v2.js`).",
          f"- Perguntas executadas: desenvolvimento {len(por['desenvolvimento'])}, teste {len(por['teste'])}; excluídas por `visto_no_treino`: "
          f"{excluidas['desenvolvimento']} e {excluidas['teste']}.",
          "- Intervalos de Wilson de 95% entre colchetes, em pontos percentuais.", "",
          "## Definições", "",
          "- **Área esperada:** a área do gabarito (`area:X`). Se a pergunta aceita mais de uma área e o primeiro cartão cai em uma delas, conta como acerto naquela área; "
          "caso contrário vale a primeira área listada no gabarito.",
          f"- **Área prevista:** a área do primeiro cartão; \"{ABST}\" quando o sistema não mostra cartão.",
          f"- Perguntas fora do escopo aparecem na linha \"{FORA}\" da matriz e contam como falso positivo da área que o sistema escolheu; "
          "perguntas dentro do escopo sem área no gabarito ficam de fora e são contadas à parte.",
          "- **Precisão** da área A = acertos de A ÷ vezes em que o primeiro cartão foi de A. **Revocação** = acertos de A ÷ perguntas esperadas em A "
          "(abstenção conta como erro). **Macro-F1** e **acurácia balanceada** (média das revocações) são calculados só sobre áreas com perguntas esperadas.",
          "- **Perigo:** \"alerta completo\" = nível 2 de `perigo.js`; \"aviso discreto\" = nível 1; \"nenhum\" = sem alerta."]

    csv_areas: dict[str, tuple] = {}
    for nome, (qs, rs) in grupos.items():
        c, sem_area = matriz_area(qs, rs)
        linhas, macro, bal = prf(c)
        slug = "agrupado" if nome == TODOS else nome
        csv_areas[nome] = (c, linhas)
        areas = sorted({e for (e, _) in c if e != FORA})
        colunas = sorted({p for (_, p) in c if p != ABST} | set(areas)) + [ABST]
        with (SAIDA / f"confusao_area_{slug}.csv").open("w", encoding="utf-8", newline="") as fh:
            w = csv.writer(fh, lineterminator="\n")
            w.writerow(["esperada \\ prevista"] + colunas)
            for e in areas + [FORA]:
                w.writerow([e] + [c[(e, p)] for p in colunas])
        with (SAIDA / f"metricas_area_{slug}.csv").open("w", encoding="utf-8", newline="") as fh:
            w = csv.writer(fh, lineterminator="\n")
            w.writerow(["area", "suporte", "previstas_como_esta", "acertos", "precisao", "revocacao", "f1"])
            for l in linhas:
                w.writerow([l["area"], l["suporte"], l["previstas_como_esta"], l["acertos"], "" if l["precisao"] != l["precisao"] else round(l["precisao"], 4),
                            "" if l["revocacao"] != l["revocacao"] else round(l["revocacao"], 4), "" if l["f1"] != l["f1"] else round(l["f1"], 4)])
            w.writerow(["MACRO-F1", "", "", "", "", "", round(macro, 4)])
            w.writerow(["ACURACIA-BALANCEADA", "", "", "", "", round(bal, 4), ""])
        md += ["", f"## Orientador por área: {nome} (EXPLORATÓRIO, {len(qs)} perguntas)", "",
               "Matriz de confusão (linhas = área esperada; colunas = área do primeiro cartão):", "",
               "| esperada \\ prevista | " + " | ".join(colunas) + " |", "|---|" + "---|" * len(colunas)]
        for e in areas + [FORA]:
            md.append(f"| {e} | " + " | ".join(str(c[(e, p)]) for p in colunas) + " |")
        md += ["", "| Área | Suporte | Precisão | Revocação | F1 |", "|---|---|---|---|---|"]
        for l in linhas:
            md.append(f"| {l['area']} | {l['suporte']} | {f(l['precisao'])} | {f(l['revocacao'])} | {f(l['f1'])} |")
        md += ["", f"**Macro-F1:** {f(macro)}. **Acurácia balanceada:** {f(bal)}. Perguntas em escopo sem área no gabarito (fora da matriz): {sem_area}."]

    for nome, (qs, rs) in grupos.items():
        p = perigo(qs, rs)
        slug = "agrupado" if nome == TODOS else nome
        cont = p["cont"]
        pos = sum(v for (r, _), v in cont.items() if r == "perigo")
        neg = sum(v for (r, _), v in cont.items() if r == "sem perigo")
        comp_pos, disc_pos, nen_pos = cont[("perigo", "completo")], cont[("perigo", "discreto")], cont[("perigo", "nenhum")]
        comp_neg, disc_neg, nen_neg = cont[("sem perigo", "completo")], cont[("sem perigo", "discreto")], cont[("sem perigo", "nenhum")]
        with (SAIDA / f"perigo_confusao_{slug}.csv").open("w", encoding="utf-8", newline="") as fh:
            w = csv.writer(fh, lineterminator="\n")
            w.writerow(["rotulo \\ saida", "alerta completo", "aviso discreto", "nenhum"])
            w.writerow(["perigo", comp_pos, disc_pos, nen_pos])
            w.writerow(["sem perigo", comp_neg, disc_neg, nen_neg])
        rows = [("Revocação (qualquer alerta)", comp_pos + disc_pos, pos), ("Revocação (só alerta completo)", comp_pos, pos),
                ("Especificidade (sem alerta entre os sem perigo)", nen_neg, neg), ("Falso alarme (qualquer alerta)", comp_neg + disc_neg, neg),
                ("Falso alarme (só alerta completo)", comp_neg, neg)]
        with (SAIDA / f"perigo_metricas_{slug}.csv").open("w", encoding="utf-8", newline="") as fh:
            w = csv.writer(fh, lineterminator="\n")
            w.writerow(["metrica", "k", "n", "valor", "ic95_inferior", "ic95_superior"])
            for rot, k, n in rows:
                lo, hi = comum.wilson(k, n)
                w.writerow([rot, k, n, "" if not n else round(k / n, 4), "" if not n else round(lo, 4), "" if not n else round(hi, 4)])
        v = p["violencia"]
        md += ["", f"## Detector de perigo: {nome} (EXPLORATÓRIO, {len(qs)} perguntas)", "",
               "| Rótulo do gabarito \\ saída do sistema | alerta completo | aviso discreto | nenhum | total |", "|---|---|---|---|---|",
               f"| perigo | {comp_pos} | {disc_pos} | {nen_pos} | {pos} |", f"| sem perigo | {comp_neg} | {disc_neg} | {nen_neg} | {neg} |", "",
               "| Métrica | Valor [IC 95%] |", "|---|---|"]
        md += [f"| {rot} | {fp(k, n)} |" for rot, k, n in rows]
        md += ["", "Por tipo de perigo:", "",
               "| Tipo | Situação |", "|---|---|",
               f"| violência | {fp(v['detectou_violencia'], v['n'])} das perguntas de perigo com categoria `violencia` receberam algum alerta do tipo violência (alerta completo em {v['completo']} de {v['n']}) |",
               "| suicídio | não separável: o gabarito marca só perigo sim ou não e a categoria da pergunta; não há rótulo de suicídio |",
               "| criança | não separável: não há categoria nem rótulo de criança no gabarito |",
               "| saúde | não separável com confiança: a categoria `saude` tem uma única pergunta de perigo nestes conjuntos, e perigo de saúde não tem rótulo próprio |", "",
               "Tipos que o sistema atribuiu às perguntas de perigo (descritivo; não é gabarito): "
               + (", ".join(f"{t} = {n}" for t, n in sorted(p["tipos_detectados"].items())) or "nenhum") + "."]
    md += ["", "## Limites", "",
           "- O gabarito de perigo é booleano; por isso só a violência pode ser avaliada por tipo, e mesmo assim pela categoria da pergunta, não por um rótulo de tipo.",
           "- Com 12 a 14 perguntas de perigo por conjunto, a revocação tem intervalo largo: 100% observado é compatível com revocação verdadeira bem menor.",
           "- Os falsos alarmes contam perguntas escritas pela própria equipe; frases reais de usuárias podem se comportar diferente."]
    (SAIDA / "metricas_por_necessidade.md").write_text("\n".join(md) + "\n", encoding="utf-8", newline="\n")
    print("ok:", SAIDA / "metricas_por_necessidade.md")


if __name__ == "__main__":
    main()
