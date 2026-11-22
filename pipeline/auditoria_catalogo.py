"""Auditoria reprodutível do catálogo manual e da privacidade do MISM3 (um comando, resultado estruturado).

Reexecuta, sobre o CSV do catálogo (catalogo/servicos_manuais.csv ou outro informado), as medidas usadas na auditoria de referência:
registros, completude de cada campo (total e por eixo = tipo), estados de conferência, procedência da fonte, atualidade da consulta,
avisos de cautela, domínios das fontes, análise estática do código quanto a armazenamento e comunicação externa, e o resultado dos testes.

Só lê arquivos locais e só escreve o resultado; não acessa a rede e não usa dados pessoais. Nenhuma métrica fica "indefinida":
o que não pôde ser medido aparece como {"status": "nao_executado", "motivo": ...}.

Uso:
  python pipeline/auditoria_catalogo.py                                   # catálogo do repositório, referência = hoje, roda os testes
  python pipeline/auditoria_catalogo.py --referencia 2026-11-21 --sem-testes
  python pipeline/auditoria_catalogo.py --catalogo CSV_TEMP --commit-catalogo 9ed9731 --saida SAIDA.json

Saída: JSON (e um CSV de completude ao lado, mesmo nome com sufixo _completude.csv). Padrão: reproducao/resultados/auditoria_catalogo.json
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import json
import re
import subprocess
import sys
import time
from collections import Counter
from pathlib import Path
from urllib.parse import urlparse

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import RAIZ, ler_csv_flex  # noqa: E402
import servicos as srv  # noqa: E402

VERSAO_FERRAMENTA = "1"
CAMPOS = ["telefone", "endereco", "cep", "lat", "lon", "horario", "aviso", "fonte", "observacao", "bairros", "cnes", "instagram"]
# Domínios que o projeto trata como municipais (Prefeitura e Fundação de Saúde, Educação, Desenvolvimento Social). Configuração
# declarada, não inferida: quem mudar a lista muda o resultado, e a lista consta do JSON de saída.
DOMINIOS_MUNICIPAIS = ["educacaorc.com.br", "saude-rioclaro.org.br", "desenvolvimentosocial.rc.sp.gov.br", "rioclaro.sp.gov.br"]
PADROES_ARMAZENAMENTO = {"localStorage": r"\blocalStorage\b", "sessionStorage": r"\bsessionStorage\b", "indexedDB": r"\bindexedDB\b",
                         "cookie": r"document\.cookie", "serviceWorker": r"serviceWorker", "cacheStorage": r"\bcaches\.(?:open|match)\b"}
PADROES_REDE = {"fetch": r"\bfetch\(", "XMLHttpRequest": r"XMLHttpRequest", "sendBeacon": r"sendBeacon", "WebSocket": r"new WebSocket"}


def _git(*args) -> str | None:
    try:
        r = subprocess.run(["git", *args], cwd=RAIZ, capture_output=True, text=True, encoding="utf-8", timeout=30)
        return r.stdout.strip() if r.returncode == 0 else None
    except (OSError, subprocess.SubprocessError):
        return None


def _vazio(v) -> bool:
    return v is None or str(v).strip() in ("", "nan", "None")


def dominio(url) -> str | None:
    h = (urlparse(str(url or "")).hostname or "").lower()
    return re.sub(r"^www\.", "", h) or None


def completude(df, grupo=None) -> dict:
    n = len(df)
    out = {}
    for c in CAMPOS:
        if c in df.columns:
            k = int(sum(1 for v in df[c] if not _vazio(v)))
            out[c] = {"preenchidos": k, "total": n, "percentual": round(100 * k / n, 1) if n else None}
    return out


def auditar_catalogo(csv_path: Path, referencia: str) -> dict:
    df = ler_csv_flex(csv_path)
    n = len(df)
    registros = srv.servicos_manuais(df, {}, referencia=referencia)
    por_eixo = {tipo: completude(df[df["tipo"] == tipo]) | {"_registros": int((df["tipo"] == tipo).sum())} for tipo in sorted(df["tipo"].dropna().unique())}
    marcas = Counter((str(v).strip().lower() if not _vazio(v) else "") for v in df["conferido"]) if "conferido" in df.columns else Counter({"": n})
    nao_marcados_como_nao = sum(v for k, v in marcas.items() if k not in ("nao", "não", "n"))
    estados = Counter(r["estado_conferencia"] for r in registros)
    doms = Counter(dominio(r["fonte_url"]) for r in registros)
    idades = [r["idade_verificacao_dias"] for r in registros if r["idade_verificacao_dias"] is not None]
    datas = sorted(r["verificado_em"] for r in registros if r["verificado_em"])
    mun = sum(doms[d] for d in DOMINIOS_MUNICIPAIS)
    return {
        "registros": n,
        "completude_total": completude(df),
        "completude_por_eixo": por_eixo,
        "coordenada_de_origem": {"registros_com_lat_e_lon_na_planilha": int(sum(1 for a, b in zip(df["lat"], df["lon"]) if not _vazio(a) and not _vazio(b))) if {"lat", "lon"} <= set(df.columns) else 0},
        "conferencia": {
            "marcacoes_na_planilha": dict(marcas),
            "marcacoes_explicitas": int(marcas.get("sim", 0) + marcas.get("nao", 0)),
            "estados": {e: estados.get(e, 0) for e in srv.ESTADOS_CONFERENCIA},
            "indicador_antigo_conferido": {"valor": nao_marcados_como_nao, "regra": "conferido = not (marcacao == nao): campo vazio contava como conferido"},
        },
        "procedencia": {t: sum(1 for r in registros if r["fonte_tipo"] == t) for t in srv.FONTES_TIPOS},
        "atualidade": {
            "referencia": referencia, "limites_dias": srv.LIMITES_ATUALIDADE,
            "data_consulta_mais_antiga": datas[0] if datas else None, "data_consulta_mais_recente": datas[-1] if datas else None,
            "idade_minima_dias": min(idades) if idades else None, "idade_maxima_dias": max(idades) if idades else None,
            "estados": dict(Counter(r["atualidade"] for r in registros)),
            "registros_com_data_de_atualizacao_da_fonte": sum(1 for r in registros if r["data_atualizacao_fonte"]),
            "nota": "A data de verificação é a da consulta do projeto à fonte, não a da atualização pela instituição.",
        },
        "avisos_de_cautela": {"registros_com_aviso": int(sum(1 for v in (df["aviso"] if "aviso" in df.columns else []) if not _vazio(v)))},
        "dominios": {
            "municipais_configurados": DOMINIOS_MUNICIPAIS, "registros_em_dominios_municipais": mun,
            "dominios_municipais_com_registro": sum(1 for d in DOMINIOS_MUNICIPAIS if doms[d]),
            "distribuicao": dict(doms.most_common()),
        },
    }


def analise_estatica_web() -> dict:
    """Presença, no CÓDIGO do site (web/*.js e web/*.html), de armazenamento e de chamadas de rede. Não é medição em navegador."""
    arquivos = sorted(p for p in (RAIZ / "web").glob("*") if p.suffix in (".js", ".html") and p.is_file())
    def achar(padroes):
        return {k: sorted(p.name for p in arquivos if re.search(v, p.read_text(encoding="utf-8", errors="replace"))) for k, v in padroes.items()}
    urls = Counter()
    for p in arquivos:
        for u in re.findall(r"https?://[^\s\"'<>)\\]+", p.read_text(encoding="utf-8", errors="replace")):
            h = dominio(u)
            if h:
                urls[h] += 1
    return {"metodo": "busca textual no codigo-fonte (nao executa o navegador)", "arquivos_examinados": len(arquivos),
            "armazenamento": achar(PADROES_ARMAZENAMENTO), "chamadas_de_rede": achar(PADROES_REDE), "dominios_citados_no_codigo": dict(urls.most_common(40))}


def rodar_testes() -> dict:
    res = {"web": {"arquivos": 0, "aprovados": 0, "falhas": []}, "pytest": {}}
    for f in sorted((RAIZ / "web" / "tests").glob("*.test.js")):
        res["web"]["arquivos"] += 1
        r = subprocess.run(["node", str(f)], cwd=RAIZ, capture_output=True, text=True, encoding="utf-8", errors="replace")
        if r.returncode == 0:
            res["web"]["aprovados"] += 1
        else:
            res["web"]["falhas"].append(f.name)
    r = subprocess.run([sys.executable, "-m", "pytest", "pipeline/tests", "-q", "-p", "no:cacheprovider", "-rf"], cwd=RAIZ, capture_output=True,
                       text=True, encoding="utf-8", errors="replace", env={**__import__("os").environ, "PYTHONPATH": "pipeline"})
    m = re.search(r"(?:(\d+) failed)?[, ]*(?:(\d+) passed)?", r.stdout.splitlines()[-1] if r.stdout.strip() else "")
    falhas = re.findall(r"^FAILED (\S+)", r.stdout, re.M)
    passou = re.search(r"(\d+) passed", r.stdout)
    res["pytest"] = {"aprovados": int(passou.group(1)) if passou else None, "falhas": falhas, "codigo_de_saida": r.returncode}
    return res


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--catalogo", type=Path, default=RAIZ / "catalogo" / "servicos_manuais.csv")
    ap.add_argument("--referencia", default=time.strftime("%Y-%m-%d"), help="data de referência AAAA-MM-DD para a idade das consultas")
    ap.add_argument("--commit-catalogo", default=None, help="commit de onde o CSV veio, se diferente do repositório (apenas registrado)")
    ap.add_argument("--saida", type=Path, default=RAIZ / "reproducao" / "resultados" / "auditoria_catalogo.json")
    ap.add_argument("--sem-testes", action="store_true")
    a = ap.parse_args(argv)
    cat = a.catalogo.resolve()
    bruto = cat.read_bytes()
    out = {
        "ferramenta": {"nome": "auditoria_catalogo", "versao": VERSAO_FERRAMENTA},
        "executado_em": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "repositorio": {"commit": _git("rev-parse", "HEAD"), "branch": _git("branch", "--show-current"),
                        "alteracoes_nao_commitadas": bool(_git("status", "--porcelain", "--untracked-files=no"))},
        "catalogo": {"arquivo": cat.name, "sha256": hashlib.sha256(bruto).hexdigest(), "commit_declarado": a.commit_catalogo},
        "dados_pessoais": "nenhum: so catalogo de servicos publicos e codigo do site",
        "catalogo_auditoria": auditar_catalogo(cat, a.referencia),
        "privacidade": {
            "analise_estatica_do_codigo": analise_estatica_web(),
            "requisicoes_de_rede_por_cenario": {"status": "nao_executado", "motivo": "exige navegador automatizado (Etapa 4 parada: nenhum framework de automacao instalado)"},
            "armazenamento_em_navegador": {"status": "nao_executado", "motivo": "idem; ver analise_estatica_do_codigo.armazenamento para a presenca no codigo"},
        },
        "testes": ({"status": "nao_executado", "motivo": "--sem-testes"} if a.sem_testes else rodar_testes()),
    }
    a.saida.parent.mkdir(parents=True, exist_ok=True)
    a.saida.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
    c = a.saida.with_name(a.saida.stem + "_completude.csv")
    with c.open("w", encoding="utf-8", newline="") as f:
        w = csv.writer(f); w.writerow(["eixo", "campo", "preenchidos", "total", "percentual"])
        for campo, v in out["catalogo_auditoria"]["completude_total"].items():
            w.writerow(["TOTAL", campo, v["preenchidos"], v["total"], v["percentual"]])
        for eixo, d in out["catalogo_auditoria"]["completude_por_eixo"].items():
            for campo, v in d.items():
                if campo != "_registros":
                    w.writerow([eixo, campo, v["preenchidos"], v["total"], v["percentual"]])
    print("auditoria gravada em", a.saida, "e", c)
    return 0


if __name__ == "__main__":
    sys.exit(main())
