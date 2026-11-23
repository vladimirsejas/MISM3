"""Gera o registro completo do teste congelado v1 SEM alterar o sistema.

Extrai o código congelado do commit 4bf1676 (git show, só leitura) para uma pasta temporária do sistema, reexecuta as condições que rodam em
Node e grava reproducao/resultados/REGISTRO_TESTE_CONGELADO.csv: todas as colunas originais de PREVISOES_TESTE_CONGELADO.csv (mesma ordem, mesmos
valores) e, ao final, as colunas novas abaixo. A pasta temporária é apagada ao fim. Nada em web/ é lido nem escrito. O arquivo de saída é
aberto em modo "x" (recusa sobrescrever).

Colunas novas (vazias nas linhas que não passam pelo Node: condições 8 e 9, não executáveis, e a linha de base TF-IDF, que não tem camada de alerta):
  nivel_alerta         0 (nenhum), 1 (aviso discreto) ou 2 (alerta completo)
  regra_disparada      por tipo alertado, separados por ponto e vírgula: "<tipo>.forte#<n>" (n-ésima regra forte de web/perigo.js, base 0),
                       "<tipo>.contexto#<n>" (regra de contexto) ou "modelo" (detector aprendido); "nenhuma" se não houve alerta
  probabilidade_perigo maior probabilidade bruta do detector aprendido entre os quatro tipos (antes da âncora); vazia sem o detector (condição 6)
  ancora_bloqueou      sim se a âncora zerou uma probabilidade que estava no limiar de aviso ou acima dele (só conta quando não houve regra)
  servicos_fixados     ids dos serviços fixados pela camada de alerta (fixado = verdadeiro), separados por ponto e vírgula
  ordem_final_top5     ids dos cinco primeiros itens exibidos, separados por ponto e vírgula

A coluna da âncora vem de uma instrumentação feita só na cópia temporária de perigo.js (registra o valor antes de zerá-lo); o cálculo não muda.

Uso (da raiz do repositório):  python reproducao/registrar_teste_congelado.py
"""
from __future__ import annotations

import csv
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
COMMIT = "4bf1676"
ORIGINAL = RAIZ / "reproducao" / "resultados" / "PREVISOES_TESTE_CONGELADO.csv"
SAIDA = RAIZ / "reproducao" / "resultados" / "REGISTRO_TESTE_CONGELADO.csv"
CONJUNTO = RAIZ / "protocolo" / "conjunto_congelado_v1.json"
ARQUIVOS = ["web/ia.js", "web/necessidades.js", "web/perigo.js", "web/orientar.js", "web/orientacao-ui.js",
            "web/dados/modelo_necessidades.json", "web/dados/modelo_perigo.json", "web/dados/modelo_escopo.json", "web/dados/indice_orientacao.json"]
NOVAS = ["nivel_alerta", "regra_disparada", "probabilidade_perigo", "ancora_bloqueou", "servicos_fixados", "ordem_final_top5"]
ANCORA_ORIGINAL = "if (!regra && ANCORAS[tp] && !emAlguma(ANCORAS[tp])) p = undefined;"
ANCORA_INSTRUMENTADA = ("if (!regra && ANCORAS[tp] && !emAlguma(ANCORAS[tp])) { (global.__anc = global.__anc || {})[tp] = p; p = undefined; }")

JS = r"""
const fs = require("fs"), path = require("path");
const web = path.join(process.argv[1], "web");
const Orientar = require(path.join(web, "orientar.js")), IA = require(path.join(web, "ia.js")), Regras = require(path.join(web, "necessidades.js"));
const Perigo = require(path.join(web, "perigo.js")), UI = require(path.join(web, "orientacao-ui.js"));
const ler = (n) => JSON.parse(fs.readFileSync(path.join(web, "dados", n), "utf8"));
const CONDICOES = {
  completo: {}, sem_regras_lexicais_necessidade: { necessidade: "modelo" }, sem_ngramas_letras: { pesos: { letras: 0 } }, sem_lsa: { pesos: { significado: 0 } },
  apenas_regras: { necessidade: "regras" }, sem_perigo_aprendido: { semModeloPerigo: true }, sem_escopo: { semEscopo: true }
};
const perguntas = JSON.parse(fs.readFileSync(0, "utf8"));
IA.usarModelo(ler("modelo_necessidades.json"));
const indice = ler("indice_orientacao.json"), modeloPerigo = ler("modelo_perigo.json"), modeloEscopo = ler("modelo_escopo.json");
const det = IA.criarClassificador(modeloPerigo);
const saida = {};
Object.keys(CONDICOES).forEach((nome) => {
  const c = CONDICOES[nome];
  Perigo.usarModelo(c.semModeloPerigo ? null : modeloPerigo);
  let dica;
  if (!c.necessidade) dica = UI.criarDica(IA, Regras);
  else dica = (t) => { const p = c.necessidade === "regras" ? {} : Object.assign({}, IA.probabilidades(t) || {});
    if (c.necessidade === "regras") Regras.identificarCategorias(t, 9).forEach((k) => { p[k] = Math.max(p[k] || 0, 0.9); }); return p; };
  const esc = c.semEscopo ? null : IA.criarClassificador(modeloEscopo);
  const motor = Orientar.criar(indice, { dica: dica, pesos: c.pesos, escopo: esc ? (t) => esc.probabilidades(t).no_escopo : null, limiarEscopo: esc ? esc.limiares.no_escopo : undefined });
  const por = {};
  perguntas.forEach((q) => {
    global.__anc = {};
    const r = motor.responder(q.texto), anc = global.__anc;
    const t = Regras.normalizar(q.texto), t2 = t.replace(/([a-z0-9])\1{2,}/g, "$1"), versoes = t2 !== t ? [t, t2] : [t];
    const idx = (lista) => { for (let i = 0; i < lista.length; i++) { const re = new RegExp("(?:^| )" + lista[i] + "(?: |$)"); if (versoes.some((v) => re.test(v))) return i; } return -1; };
    const tipos = r.perigo ? r.perigo.tipos : [];
    const regra = tipos.map((tp) => { const i = idx(Perigo.TIPOS[tp].forte); if (i >= 0) return tp + ".forte#" + i;
      const j = idx(Perigo.TIPOS[tp].contexto || []); if (j >= 0 && r.perigo.nivel === 1) return tp + ".contexto#" + j; return "modelo"; });
    let probMax = null, ancora = false;
    if (!c.semModeloPerigo) {
      const p1 = det.probabilidades(q.texto), p2 = t2 !== t ? det.probabilidades(t2) : null;
      Object.keys(p1).forEach((k) => { const v = Math.max(p1[k], p2 ? p2[k] : 0); if (probMax === null || v > probMax) probMax = v; });
      Object.keys(anc).forEach((k) => { const lim = det.limiares[k]; if (lim !== undefined && anc[k] >= lim) ancora = true; });
    }
    por[q.id] = { nivel: r.perigo ? r.perigo.nivel : 0, regra: regra.length ? regra.join(";") : "nenhuma", prob: probMax === null ? "" : (Math.round(probMax * 1000) / 1000).toFixed(3),
      ancora: ancora ? "sim" : "nao", fixados: r.itens.filter((i) => i.fixado).map((i) => i.id).join(";"), top5: r.itens.slice(0, 5).map((i) => i.id).join(";") };
  });
  saida[nome] = por;
});
process.stdout.write(JSON.stringify(saida));
"""


def git_show(caminho: str) -> bytes:
    r = subprocess.run(["git", "show", f"{COMMIT}:{caminho}"], cwd=RAIZ, capture_output=True)
    if r.returncode != 0:
        raise SystemExit(f"commit {COMMIT} ou arquivo {caminho} não encontrado ({r.stderr.decode('utf-8', 'replace').strip()}). Nada foi gravado.")
    return r.stdout


def main() -> int:
    if SAIDA.exists():
        print("REGISTRO_TESTE_CONGELADO.csv já existe; não sobrescreve.")
        return 2
    perguntas = [{"id": i["id"], "texto": i["frase"]} for i in json.loads(CONJUNTO.read_bytes().decode("utf-8"))["itens"]]
    tmp = Path(tempfile.mkdtemp(prefix="mism3_congelado_"))
    try:
        for a in ARQUIVOS:
            destino = tmp / a
            destino.parent.mkdir(parents=True, exist_ok=True)
            destino.write_bytes(git_show(a))
        perigo = tmp / "web" / "perigo.js"
        texto = perigo.read_text(encoding="utf-8")
        if texto.count(ANCORA_ORIGINAL) != 1:
            raise SystemExit("trecho da âncora não encontrado na cópia do commit congelado. Nada foi gravado.")
        perigo.write_text(texto.replace(ANCORA_ORIGINAL, ANCORA_INSTRUMENTADA), encoding="utf-8", newline="")
        r = subprocess.run(["node", "-e", JS, str(tmp)], input=json.dumps(perguntas), capture_output=True, text=True, encoding="utf-8")
        if r.returncode != 0:
            raise SystemExit("falha ao executar o código congelado: " + r.stderr[-400:])
        por = json.loads(r.stdout)
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    linhas = list(csv.reader(ORIGINAL.read_bytes().decode("utf-8-sig").replace("\r\n", "\n").splitlines(), delimiter=";"))
    cab, corpo = linhas[0], linhas[1:]
    col = {k: i for i, k in enumerate(cab)}
    with SAIDA.open("x", encoding="utf-8-sig", newline="") as f:
        w = csv.writer(f, delimiter=";", lineterminator="\n")
        w.writerow(cab + NOVAS)
        for lin in corpo:
            cond, qid = lin[col["condicao_codigo"]], lin[col["id_mensagem"]]
            reg = por.get(cond, {}).get(qid)
            if reg is None:  # condições 8 e 9 (não executáveis) e linha de base TF-IDF
                w.writerow(lin + [""] * len(NOVAS))
            else:
                w.writerow(lin + [reg["nivel"], reg["regra"], reg["prob"], reg["ancora"], reg["fixados"], reg["top5"]])
    print(f"gravado {SAIDA.relative_to(RAIZ)}: {len(corpo)} linhas; condições reexecutadas: {', '.join(por)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
