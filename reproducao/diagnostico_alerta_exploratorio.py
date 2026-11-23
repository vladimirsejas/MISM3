"""Análises EXPLORATÓRIAS para o Manuscrito B (camada de alerta): posteriores ao teste congelado, não pré-especificadas, e NÃO podem ser usadas
para alterar o sistema congelado. Não reproduz texto de mensagens: só contagens e IDs.

Reexecução do código congelado em memória (git show 4bf1676; nada em web/ é tocado).
Análise 1: taxa de perda por tipo de mensagem (violência: controle coercitivo / agressão física imediata / outra; ideação: indireta / fronteira / explícita; crianças).
Análise 2: diagnóstico de limiar: limiar e limiar alto de cada tipo do detector aprendido multiplicados por 1,0 ... 0,5, com o filtro de âncora ligado e desligado
(a âncora é desligada só em memória, trocando a condição do `if` em perigo.js; os limiares são escalados numa cópia em memória de modelo_perigo.json).

Saídas novas, abertas em modo "x": reproducao/resultados/EXPLORATORIO_PERDA_POR_TIPO.{csv,md} e EXPLORATORIO_LIMIAR_DIAGNOSTICO.{csv,md}.
"""
from __future__ import annotations

import csv
import json
import subprocess
import sys
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import comum  # noqa: E402
import conjunto_v1 as cv  # noqa: E402

COMMIT = "4bf1676"
RES = comum.RAIZ / "reproducao" / "resultados"
S1C, S1M = RES / "EXPLORATORIO_PERDA_POR_TIPO.csv", RES / "EXPLORATORIO_PERDA_POR_TIPO.md"
S2C, S2M = RES / "EXPLORATORIO_LIMIAR_DIAGNOSTICO.csv", RES / "EXPLORATORIO_LIMIAR_DIAGNOSTICO.md"
FATORES = (1.0, 0.9, 0.8, 0.7, 0.6, 0.5)
AVISO = ("**Aviso:** análise exploratória, posterior ao teste congelado e não pré-especificada; não pode ser usada para alterar o sistema congelado. "
         "Não substitui nem altera o resultado principal. Nenhum texto de mensagem é reproduzido: só contagens e IDs.")

# ---- Leitura (minha, posterior ao teste) das mensagens de risco; critérios escritos em CRITERIOS e no .md
def ids(prefixo_ini: int, fim: int) -> list[str]:
    return [f"C-{n:03d}" for n in range(prefixo_ini, fim + 1)]

VIOL_B = ids(26, 45)
VIOL_OUTRA = ["C-007", "C-016", "C-151", "C-152", "C-153", "C-156", "C-157", "C-158", "C-160"]
VIOL_A = [i for i in ids(1, 45) + ids(151, 160) if i not in VIOL_B and i not in VIOL_OUTRA]
IDE_EXPL = ["C-063", "C-068", "C-072", "C-076", "C-080"]
IDE_FRONT = ["C-061", "C-062", "C-065", "C-066", "C-070", "C-071", "C-075", "C-078"]
IDE_IND = ["C-064", "C-067", "C-069", "C-073", "C-074", "C-077", "C-079"]
CRITERIOS = [
    "**Violência (55), duas leituras minhas, lidas após o teste:**",
    "- (a) controle coercitivo: a mensagem descreve controle financeiro, controle de documentos, isolamento ou restrição de saída, vigilância, ameaça legal ou de guarda, humilhação ou culpabilização, "
    "chantagem, perseguição ou assédio, sem agressão física em curso e sem arma.",
    "- (b) agressão física imediata: agressão física em curso ou ocorrida agora, ou arma/objeto usado contra a pessoa ou contra terceiro, ou invasão/arrombamento, ou ameaça de morte ou lesão física iminente.",
    "- outra: não cabe em (a) nem em (b): agressão física relatada como habitual, passada ou não imediata, destruição de bens, ameaça sem conteúdo especificado, expulsão de casa, violência contra criança relatada junto de outro pedido.",
    "**Ideação (20):**",
    "- explícita: contém termo literal de morte ou de matar-se (morrer, morresse, acabar com a própria vida, tirar a própria vida).",
    "- fronteira: sem termo literal acima, mas nomeia o meio ou o método (remédio, comprimidos, cartela, ponte, caminhão) ou usa expressão idiomática de morte (dar cabo da vida, dar um fim, acabar com tudo).",
    "- indireta ou eufemística: nenhum dos dois; só eufemismos de desaparecer, dormir, apagar, sumir.",
    "**Crianças (15):** sem subdivisão.",
]

JS = r"""
const {execSync}=require("child_process"), fs=require("fs");
const git=(f)=>execSync("git show "+process.argv[1]+":"+f,{cwd:process.argv[2],maxBuffer:1<<28}).toString("utf8");
const base={}; ["perigo","ia","necessidades"].forEach(n=>base[n]=git("web/"+n+".js"));
const modelo=JSON.parse(git("web/dados/modelo_perigo.json"));
const alvo="if (!regra && ANCORAS[tp] && !emAlguma(ANCORAS[tp])) p = undefined;";
if(!base.perigo.includes(alvo)) throw new Error("trecho da âncora não encontrado");
function montar(ancora){
  const src=Object.assign({},base); if(!ancora) src.perigo=base.perigo.replace(alvo,"if (false) p = undefined;");
  const reg={};
  const load=(n)=>{ if(reg[n])return reg[n].exports; const m={exports:{}}; reg[n]=m; new Function("module","exports","require",src[n])(m,m.exports,(p)=>load(p.replace("./","").replace(".js",""))); return m.exports; };
  return load("perigo");
}
const perguntas=JSON.parse(fs.readFileSync(0,"utf8"));
const FATORES=[1.0,0.9,0.8,0.7,0.6,0.5], saida=[];
[true,false].forEach(ancora=>{
  const Perigo=montar(ancora);
  FATORES.forEach(f=>{
    const m=JSON.parse(JSON.stringify(modelo));
    ["limiares","limiares_altos"].forEach(k=>{ Object.keys(m.meta[k]).forEach(t=>{ m.meta[k][t]=m.meta[k][t]*f; }); });
    Perigo.usarModelo(m);
    const por={}; perguntas.forEach(q=>{ const r=Perigo.avaliar(q.texto); por[q.id]={nivel:r?r.nivel:0,tipos:r?r.tipos:[]}; });
    saida.push({ancora:ancora,fator:f,por:por});
  });
});
process.stdout.write(JSON.stringify(saida));
"""


def main() -> int:
    if any(p.exists() for p in (S1C, S1M, S2C, S2M)):
        print("saídas já existem; não sobrescreve.")
        return 2
    if cv.sha256_do_conjunto() != cv.SHA256_ESPERADO:
        print("SHA-256 do conjunto diferente do esperado.")
        return 2
    ind = cv.Indice()
    itens = cv.carregar_conjunto()
    qs = [cv.converter_item(i, ind) for i in itens]
    cat = {q["id"]: ("violência" if "Viol" in q["perigo_tipo"] else "crianças" if q["perigo_tipo"].startswith("Cri") else "ideação") if q["perigo"] else None for q in qs}
    risco = [q["id"] for q in qs if q["perigo"]]
    neg = [q["id"] for q in qs if not q["perigo"]]
    assert len(risco) == 90 and len(neg) == 100
    assert Counter(cat[i] for i in risco) == {"violência": 55, "ideação": 20, "crianças": 15}, Counter(cat[i] for i in risco)
    grupos = {"violência": set(VIOL_A + VIOL_B + VIOL_OUTRA), "ideação": set(IDE_EXPL + IDE_FRONT + IDE_IND)}
    assert grupos["violência"] == {i for i in risco if cat[i] == "violência"} and len(VIOL_A + VIOL_B + VIOL_OUTRA) == 55
    assert grupos["ideação"] == {i for i in risco if cat[i] == "ideação"} and len(IDE_EXPL + IDE_FRONT + IDE_IND) == 20
    r = subprocess.run(["node", "-e", JS, COMMIT, str(comum.RAIZ)], input=json.dumps([{"id": q["id"], "texto": q["texto"]} for q in qs]),
                       capture_output=True, text=True, encoding="utf-8", check=True)
    var = json.loads(r.stdout)
    por = {(v["ancora"], v["fator"]): v["por"] for v in var}
    base = por[(True, 1.0)]
    # verificação: fator 1,0 com âncora = 73/90, 0/100 e igual ao CSV congelado
    csv_cong = {x["id_mensagem"]: x["alerta_perigo"] for x in csv.DictReader(open(comum.RAIZ / "reproducao/resultados/PREVISOES_TESTE_CONGELADO.csv", encoding="utf-8-sig"), delimiter=";") if x["condicao_codigo"] == "completo"}
    div = sum(1 for i in base if (base[i]["nivel"] > 0) != (csv_cong[i] == "sim"))
    ok_r, ok_n = sum(base[i]["nivel"] > 0 for i in risco), sum(base[i]["nivel"] > 0 for i in neg)
    print(f"fator 1,0 com âncora: {ok_r}/90 e {ok_n}/100 (divergências contra o CSV: {div}); completos: {sum(base[i]['nivel'] == 2 for i in risco)}")
    if (ok_r, ok_n, div) != (73, 0, 0):
        print("PARE: não reproduz 73/90 e 0/100; nada foi gravado.")
        return 1

    # ---------------- Análise 1
    def linha(nome, lst):
        al = [i for i in lst if base[i]["nivel"] > 0]
        return [nome, len(lst), len(al), sum(base[i]["nivel"] == 2 for i in lst), len(lst) - len(al), [i for i in lst if base[i]["nivel"] == 0]]
    t1 = [linha("(a) controle coercitivo", VIOL_A), linha("(b) agressão física imediata", VIOL_B), linha("outra", VIOL_OUTRA), linha("violência, total", VIOL_A + VIOL_B + VIOL_OUTRA)]
    t2 = [linha("indireta ou eufemística", IDE_IND), linha("fronteira", IDE_FRONT), linha("explícita", IDE_EXPL), linha("ideação, total", IDE_IND + IDE_FRONT + IDE_EXPL),
          linha("crianças, total", [i for i in risco if cat[i] == "crianças"])]
    perdidas = [i for i in risco if base[i]["nivel"] == 0]
    soma = (sum(1 for i in perdidas if cat[i] == "violência"), sum(1 for i in perdidas if cat[i] == "ideação"), sum(1 for i in perdidas if cat[i] == "crianças"))
    assert soma == (10, 6, 1) and len(perdidas) == 17, soma

    # ---------------- Análise 2
    t3, t4 = [], []
    for ancora in (True, False):
        for f in FATORES:
            p = por[(ancora, f)]
            t3.append(["ligada" if ancora else "desligada", f, sum(p[i]["nivel"] > 0 for i in risco), sum(p[i]["nivel"] == 2 for i in risco), sum(p[i]["nivel"] > 0 for i in neg)])
            t4.append(["ligada" if ancora else "desligada", f] + [sum(p[i]["nivel"] > 0 for i in risco if cat[i] == c) for c in ("violência", "ideação", "crianças")]
                      + [sum(p[i]["nivel"] == 2 for i in risco if cat[i] == c) for c in ("violência", "ideação", "crianças")])

    with S1C.open("x", encoding="utf-8", newline="") as fh:
        w = csv.writer(fh, lineterminator="\n")
        w.writerow(["grupo", "total", "alertadas_qualquer_nivel", "alertas_completos_nivel2", "perdidas", "ids_perdidos"])
        for x in t1 + t2:
            w.writerow(x[:5] + [" ".join(x[5])])
    with S2C.open("x", encoding="utf-8", newline="") as fh:
        w = csv.writer(fh, lineterminator="\n")
        w.writerow(["ancora", "fator", "alertas_risco_qualquer_nivel_de_90", "alertas_completos_de_90", "alertas_sem_risco_de_100", "viol_qualquer", "ide_qualquer", "cri_qualquer", "viol_completos", "ide_completos", "cri_completos"])
        for a, b in zip(t3, t4):
            w.writerow(a + b[2:])
    cab = "| Grupo | Total | Alertadas (qualquer nível) | Alertas completos (nível 2) | Perdidas | IDs perdidos |\n|---|---|---|---|---|---|"
    md1 = ["# Taxa de perda por tipo de mensagem (exploratório)", "", AVISO, "",
           f"Reexecução do código congelado (commit `{COMMIT}`, em memória); condição `completo`; alerta = qualquer nível, como no CSV congelado; fator de limiar 1,0 e âncora ligada.", "",
           "## Critérios (leitura minha, feita depois do teste)", ""] + CRITERIOS + ["",
           "## Tabela 1: violência (55)", "", cab] + [f"| {n} | {t} | {a} | {c} | {p} | {' '.join(l) or '-'} |" for n, t, a, c, p, l in t1] + ["",
           "## Tabela 2: ideação (20) e crianças (15)", "", cab] + [f"| {n} | {t} | {a} | {c} | {p} | {' '.join(l) or '-'} |" for n, t, a, c, p, l in t2] + ["",
           "## IDs por grupo", "", f"- violência (a): {' '.join(VIOL_A)}", f"- violência (b): {' '.join(VIOL_B)}", f"- violência, outra: {' '.join(VIOL_OUTRA)}",
           f"- ideação indireta: {' '.join(IDE_IND)}", f"- ideação fronteira: {' '.join(IDE_FRONT)}", f"- ideação explícita: {' '.join(IDE_EXPL)}", "",
           f"Confirmação: perdidas = {soma[0]} (violência) + {soma[1]} (ideação) + {soma[2]} (crianças) = {len(perdidas)}.", ""]
    with S1M.open("x", encoding="utf-8", newline="\n") as fh:
        fh.write("\n".join(md1) + "\n")
    md2 = ["# Diagnóstico de limiar do detector de alerta (exploratório)", "", AVISO, "",
           f"Reexecução do código congelado (commit `{COMMIT}`, em memória) só da camada `Perigo.avaliar`, sobre as 190 mensagens. Os limiares `meta.limiares` e `meta.limiares_altos` de cada tipo (violência, suicídio, criança, saúde) do `modelo_perigo.json` "
           "são multiplicados pelo fator numa cópia em memória; as regras determinísticas não mudam. \"Âncora desligada\" troca em memória a condição do `if` da âncora em `perigo.js`. "
           "Nenhum arquivo do sistema foi alterado. Alertas contam qualquer tipo de alerta, em qualquer nível.", "",
           f"Verificação: fator 1,0 com âncora ligada = {ok_r}/90 e {ok_n}/100, igual ao CSV congelado em todas as 190 mensagens.", "",
           "## Tabela 3: alertas por combinação", "", "| Âncora | Fator | Alertas nas 90 de risco | Alertas completos nas 90 | Alertas nas 100 sem risco |", "|---|---|---|---|---|"]
    md2 += [f"| {a} | {f} | {r_}/90 | {c}/90 | {n}/100 |" for a, f, r_, c, n in t3]
    md2 += ["", "## Tabela 4: alertas de risco por categoria (qualquer nível; entre parênteses, alertas completos)", "",
            "| Âncora | Fator | Violência (de 55) | Ideação (de 20) | Crianças (de 15) |", "|---|---|---|---|---|"]
    md2 += [f"| {a} | {f} | {v} ({vc}) | {i} ({ic}) | {c} ({cc}) |" for a, f, v, i, c, vc, ic, cc in t4]
    with S2M.open("x", encoding="utf-8", newline="\n") as fh:
        fh.write("\n".join(md2) + "\n")
    print("\n".join(md1)); print(); print("\n".join(md2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
