"""Análise EXPLORATÓRIA (posterior ao teste, não pré-especificada): SA@3 do sistema completo sem a fixação de serviços do alerta.

Usa a reexecução do código congelado (commit 4bf1676, branch backup-main-antiga-4bf1676): os arquivos de web/ são lidos com `git show` e
executados em memória pelo Node, sem checkout e sem tocar em web/. O conjunto é protocolo/conjunto_congelado_v1.json.

Variantes (mesma condição "completo": regras e modelo de necessidades, detector de perigo, detector de escopo, índice com palavras, letras e LSA):
  (i)  busca pura: os 3 primeiros de motor.pontuar(texto, {}) ordenados pela nota (b.s - a.s, como em orientar.js/responder), em todo o
       índice (serviços, seções, canais, ferramentas, áreas e classes); ignora fixação, filtro de escopo, abstenção, corte, diversidade e cartões de reforço.
  (ii) pipeline completo com a fixação desligada: Perigo.avaliar é embrulhado em memória para devolver `pins = []`; o alerta (nível, tipos,
       telefones) e o `urgente` do nível 2 continuam iguais, logo o alerta completo ainda ignora o filtro de escopo e a abstenção; tudo o mais fica como está.
Verificação: o pipeline sem alteração deve reproduzir 76/140 e as linhas do CSV congelado (alerta, abstenção, top-3).

Comparações: bootstrap pareado, 10.000 reamostragens, semente 20261106, conjunto_v1.bootstrap_pareado (variante menos referência), contra
TF-IDF (35/140), BM25 (38/140, bm25_exploratorio.py) e sistema completo (76/140, lido do CSV congelado).
Saídas novas abertas em modo "x": reproducao/resultados/EXPLORATORIO_BUSCA_SEM_FIXACAO.{csv,md}.
"""
from __future__ import annotations

import csv
import json
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import ablacao  # noqa: E402
import bm25_exploratorio as bx  # noqa: E402
import comum  # noqa: E402
import conjunto_v1 as cv  # noqa: E402

COMMIT = "4bf1676"
RES = comum.RAIZ / "reproducao" / "resultados"
SAIDA_CSV, SAIDA_MD = RES / "EXPLORATORIO_BUSCA_SEM_FIXACAO.csv", RES / "EXPLORATORIO_BUSCA_SEM_FIXACAO.md"

JS = r"""
const {execSync}=require("child_process"), fs=require("fs");
const git=(f)=>execSync("git show "+process.argv[1]+":"+f,{cwd:process.argv[2],maxBuffer:1<<28}).toString("utf8");
const src={}; ["orientar","perigo","ia","necessidades","orientacao-ui"].forEach(n=>src[n]=git("web/"+n+".js"));
const reg={};
function load(n){ if(reg[n])return reg[n].exports; const m={exports:{}}; reg[n]=m; new Function("module","exports","require",src[n])(m,m.exports,(p)=>load(p.replace("./","").replace(".js",""))); return m.exports;}
const Orientar=load("orientar"),IA=load("ia"),Regras=load("necessidades"),Perigo=load("perigo"),UI=load("orientacao-ui");
const dado=(n)=>JSON.parse(git("web/dados/"+n));
IA.usarModelo(dado("modelo_necessidades.json"));
const indice=dado("indice_orientacao.json");
Perigo.usarModelo(dado("modelo_perigo.json"));
const esc=IA.criarClassificador(dado("modelo_escopo.json"));
const motor=Orientar.criar(indice,{dica:UI.criarDica(IA,Regras),escopo:(t)=>esc.probabilidades(t).no_escopo,limiarEscopo:esc.limiares.no_escopo});
const perguntas=JSON.parse(fs.readFileSync(0,"utf8"));
const trio=(i)=>({id:i.id,svc:i.svc,area:i.area,sec:i.sec,titulo:i.titulo});
const out={completo:{},busca_pura:{},sem_fixacao:{}};
perguntas.forEach(q=>{
  const r=motor.responder(q.texto);
  out.completo[q.id]={abstem:r.abstem,perigo:!!r.perigo,itens:r.itens.map(trio)};
  const r0=r; const pont=motor.pontuar(q.texto,{}).slice().sort((a,b)=>b.s-a.s);
  out.busca_pura[q.id]={abstem:false,perigo:!!r0.perigo,itens:pont.slice(0,3).map(x=>trio(x.u))};
});
const original=Perigo.avaliar;
Perigo.avaliar=function(t){ const r=original(t); if(r) r.pins=[]; return r; };
perguntas.forEach(q=>{ const r=motor.responder(q.texto); out.sem_fixacao[q.id]={abstem:r.abstem,perigo:!!r.perigo,itens:r.itens.map(trio),nivel:r.perigo?r.perigo.nivel:0}; });
process.stdout.write(JSON.stringify(out));
"""


def reexecutar(qs: list[dict]) -> dict:
    r = subprocess.run(["node", "-e", JS, COMMIT, str(comum.RAIZ)], input=json.dumps([{"id": q["id"], "texto": q["texto"]} for q in qs]),
                       capture_output=True, text=True, encoding="utf-8", check=True)
    return json.loads(r.stdout)


def main() -> int:
    if SAIDA_CSV.exists() or SAIDA_MD.exists():
        print("saídas já existem; não sobrescreve.")
        return 2
    if cv.sha256_do_conjunto() != cv.SHA256_ESPERADO:
        print("SHA-256 do conjunto diferente do esperado.")
        return 2
    ind = cv.Indice()
    qs = [cv.converter_item(i, ind) for i in cv.carregar_conjunto()]
    bruto = reexecutar(qs)
    # verificação: pipeline sem alteração = CSV congelado
    linhas = {r["id_mensagem"]: r for r in csv.DictReader(bx.CSV_CONGELADO.open(encoding="utf-8-sig"), delimiter=";") if r["condicao_codigo"] == "completo"}
    div = 0
    for q in qs:
        r, c = bruto["completo"][q["id"]], linhas[q["id"]]
        top = [i["id"] for i in r["itens"][:3]]
        if top != [c[f"item_{k}"] for k in (1, 2, 3) if c[f"item_{k}"]] or ("sim" if (r["abstem"] or not r["itens"]) else "não") != c["abstencao"]:
            div += 1
    print("divergências do pipeline reexecutado contra o CSV congelado:", div)
    if div:
        print("PARE: a reexecução não reproduz o CSV; nada foi gravado.")
        return 1
    resp = {nome: cv.calcular(qs, bruto[nome], cv.casa_v1, perigo_inclui_fora=True) for nome in ("completo", "busca_pura", "sem_fixacao")}
    if (resp["completo"]["spec_hit"], resp["completo"]["spec_total"]) != (76, 140):
        print("PARE: completo reexecutado não deu 76/140.")
        return 1
    tf = cv.calcular(qs, cv.anotar_ids(ablacao.rodar_tfidf(qs), ind), cv.casa_v1, perigo_inclui_fora=True)
    bm = cv.calcular(qs, cv.anotar_ids(bx.rodar_bm25(qs), ind), cv.casa_v1, perigo_inclui_fora=True)
    if (tf["spec_hit"], bm["spec_hit"]) != (35, 38):
        print("PARE: TF-IDF/BM25 não reproduzem 35 e 38.")
        return 1
    ids = tf["ids_spec"]
    vet = {"tfidf": tf["spec_vec"], "bm25": bm["spec_vec"], "completo": bx.completo_do_csv(ids),
           "busca_pura": resp["busca_pura"]["spec_vec"], "sem_fixacao": resp["sem_fixacao"]["spec_vec"]}
    vet = {k: [float(x) for x in v] for k, v in vet.items()}
    assert resp["busca_pura"]["ids_spec"] == ids == resp["sem_fixacao"]["ids_spec"]
    risco = {q["id"] for q in qs if q["perigo"]}
    pos = {i: k for k, i in enumerate(ids)}
    grupos = {"total": ids, "risco": [i for i in ids if i in risco], "sem_risco": [i for i in ids if i not in risco]}
    rot = {"busca_pura": "(i) busca pura", "sem_fixacao": "(ii) pipeline sem fixação", "tfidf": "TF-IDF", "bm25": "BM25", "completo": "sistema completo"}
    cont = []
    for g, lst in grupos.items():
        for c in ("busca_pura", "sem_fixacao", "tfidf", "bm25", "completo"):
            cont.append([g, c, int(sum(vet[c][pos[i]] for i in lst)), len(lst)])
    dif = []
    for var in ("busca_pura", "sem_fixacao"):
        for ref in ("tfidf", "bm25", "completo"):
            b = cv.bootstrap_pareado({var: vet[var], ref: vet[ref]}, ref)[var]
            dif.append([var, ref, 100 * b["dif_vs_ref"], 100 * b["dif_ic"][0], 100 * b["dif_ic"][1]])
    abst = {n: sum(1 for q in qs if q["acao"] == "Responder" and (bruto[n][q["id"]]["abstem"] or not bruto[n][q["id"]]["itens"])) for n in ("completo", "busca_pura", "sem_fixacao")}
    with SAIDA_CSV.open("x", encoding="utf-8", newline="") as f:
        w = csv.writer(f, lineterminator="\n")
        w.writerow(["grupo", "condicao", "acertos_top3", "total", "percentual"])
        for g, c, k, n in cont:
            w.writerow([g, c, k, n, round(100 * k / n, 1)])
        w.writerow([])
        w.writerow(["variante", "referencia", "dif_variante_menos_referencia_pp", "ic95_inferior_pp", "ic95_superior_pp"])
        for v, r, d, lo, hi in dif:
            w.writerow([v, r, round(d, 2), round(lo, 2), round(hi, 2)])
    k = {(g, c): (a, n) for g, c, a, n in cont}
    md = ["# Busca do sistema completo sem a fixação de serviços (exploratório)", "",
          "**Aviso:** análise exploratória, posterior ao teste congelado e não pré-especificada. Não substitui nem altera o resultado principal.", "",
          "## O que cada variante faz", "",
          f"Reexecução do código congelado (commit `{COMMIT}`, branch `backup-main-antiga-4bf1676`), lido com `git show` e executado em memória; `web/` do repositório não foi tocado. Condição `completo` (regras e modelo de necessidades, detector de perigo, detector de escopo, índice com palavras, letras e LSA).", "",
          "- **(i) Busca pura:** os 3 primeiros de `motor.pontuar(texto, {})` ordenados pela nota, em todo o índice (serviços, seções, canais, ferramentas, áreas e classes). Ignora fixação, filtro de escopo, abstenção, corte, diversidade e cartões de reforço; nunca abstém.",
          "- **(ii) Pipeline com fixação desligada:** `Perigo.avaliar` é embrulhado em memória para devolver `pins = []`. O alerta (nível, tipos, telefones) e o `urgente` do nível 2 ficam como estão, então o alerta completo continua ignorando o filtro de escopo e a abstenção. Todo o resto do pipeline fica como está (abstenção, corte, diversidade, reforços).",
          "- **Verificação:** o pipeline sem alteração reproduziu o CSV congelado (alerta, abstenção e top-3) sem divergência e deu 76/140. TF-IDF e BM25 reproduziram 35/140 e 38/140.",
          f"- Bootstrap pareado por mensagem, {cv.BOOTSTRAP_V1} reamostragens, semente {cv.SEMENTE_V1}, `conjunto_v1.bootstrap_pareado`, percentis 2,5% e 97,5%, sobre as 140 mensagens.", "",
          "## SA@3 (acertos no top-3 / mensagens orientáveis com destino esperado)", "",
          "| Grupo | (i) busca pura | (ii) sem fixação | TF-IDF | BM25 | Sistema completo |", "|---|---|---|---|---|---|"]
    for g in ("total", "risco", "sem_risco"):
        cel = lambda c: f"{k[(g, c)][0]}/{k[(g, c)][1]} ({100 * k[(g, c)][0] / k[(g, c)][1]:.1f}%)"
        md.append(f"| {g.replace('_', ' ')} | {cel('busca_pura')} | {cel('sem_fixacao')} | {cel('tfidf')} | {cel('bm25')} | {cel('completo')} |")
    md += ["", "## Diferenças pareadas (variante menos referência; pontos percentuais; IC 95%)", "", "| Variante | Referência | Diferença | IC 95% |", "|---|---|---|---|"]
    for v, r, d, lo, hi in dif:
        md.append(f"| {rot[v]} | {rot[r]} | {d:+.2f} | [{lo:.2f}; {hi:.2f}] |")
    md += ["", f"Abstenções em mensagens orientáveis (de 140): sistema completo {abst['completo']}; (i) {abst['busca_pura']}; (ii) {abst['sem_fixacao']}.", ""]
    with SAIDA_MD.open("x", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(md) + "\n")
    print("\n".join(md))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
