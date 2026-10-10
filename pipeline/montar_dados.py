"""Monta os dados REAIS do site com um comando so:  python pipeline/montar_dados.py

Confere quais fontes publicas voce ja tem, roda cada etapa na ordem certa e diz, no fim, o que ficou real e o que
falta (com o comando para obter). Nada e inventado: sem o arquivo da fonte, a etapa e pulada e explicada.

  python pipeline/montar_dados.py                  diagnostico + monta o que for possivel
  python pipeline/montar_dados.py --so-diagnostico so mostra o que existe e o que falta

Gera (e o git ignora, porque se refaz a partir das fontes):  web/dados/cep_indice.json, servicos.json, vagas.json
Depois: abrir_servidor.bat. A faixa "DADOS ILUSTRATIVOS" some sozinha quando cep_indice.json e servicos.json existem.
"""
from __future__ import annotations

import json
import subprocess
import sys
from dataclasses import dataclass, field
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import RAIZ  # noqa: E402


@dataclass
class Fonte:
    chave: str
    nome: str
    obrigatoria: bool            # sem ela o site nao mostra dado real
    achados: list[Path] = field(default_factory=list)
    como_obter: str = ""

    @property
    def ok(self) -> bool:
        return bool(self.achados)


def _linhas_de_dados(csv: Path) -> int:
    """Linhas preenchidas de um CSV, sem contar o cabecalho."""
    if not csv.is_file():
        return 0
    linhas = [l for l in csv.read_text(encoding="utf-8-sig", errors="replace").splitlines() if l.strip()]
    return max(0, len(linhas) - 1)


def diagnosticar(raiz: Path = RAIZ) -> list[Fonte]:
    bruto, docs, cat = raiz / "dados" / "bruto", raiz / "docs", raiz / "catalogo"
    cnefe = sorted((bruto / "cnefe").glob("*.zip")) + sorted((bruto / "cnefe").glob("*.csv"))
    cnes = [p for p in (bruto / "cnes", docs / "cnes") if list(p.glob("tbEstabelecimento*.csv"))]
    censo = sorted(set((bruto / "escolas").glob("microdados_ed_basica*.csv")) | set(docs.rglob("microdados_ed_basica*.csv")))
    inep = sorted(set((bruto / "escolas").glob("*lista das escolas*.csv")) | set(docs.rglob("*lista das escolas*.csv")))
    ceps_csv = sorted((bruto / "ceps_google").glob("*.csv")) + sorted((docs / "cep_Rio_Claro").glob("*.csv"))
    manual, vagas, m2m = cat / "servicos_manuais.csv", cat / "vagas_publicas.csv", cat / "mulher_para_mulher.csv"
    return [
        Fonte("cnefe", "IBGE CNEFE (CEP e coordenadas)", True, cnefe, r"python pipeline\baixar.py cnefe"),
        Fonte("ceps_csv", "CSV de CEPs com coordenadas (plano B ao CNEFE)", False, ceps_csv,
              r"coloque o CSV em docs\cep_Rio_Claro (colunas CEP;Latitude;Longitude)"),
        Fonte("cnes", "CNES (estabelecimentos de saude)", False, cnes,
              r"baixe a base completa no site do CNES e descompacte em docs\cnes"),
        Fonte("inep", "INEP Catalogo de Escolas (CSV exportado)", False, inep,
              r'coloque o CSV "Tabela da lista das escolas" em docs\ (exportado do INEPdata)'),
        Fonte("censo", "INEP Censo Escolar (microdados)", False, censo, r"python pipeline\baixar.py escolas"),
        Fonte("manual", "Catalogo manual verificado (%d servicos)" % _linhas_de_dados(manual), False,
              [manual] if _linhas_de_dados(manual) else [], r"edite catalogo\servicos_manuais.csv"),
        Fonte("vagas", "Concursos e processos seletivos (%d cadastrados)" % _linhas_de_dados(vagas), False,
              [vagas] if _linhas_de_dados(vagas) else [], r"preencha catalogo\vagas_publicas.csv com o edital oficial"),
        Fonte("m2m", "De mulher para mulher (%d cadastros)" % _linhas_de_dados(m2m), False,
              [m2m] if _linhas_de_dados(m2m) else [], r"preencha catalogo\mulher_para_mulher.csv (exige verificacao)"),
    ]


def planejar(fontes: list[Fonte], raiz: Path = RAIZ) -> list[tuple[str, str, str]]:
    """Etapas (script, o que faz, motivo se for pulada ou ''). Respeita a ordem e as dependencias."""
    f = {x.chave: x for x in fontes}
    web = raiz / "web" / "dados"
    tem_indice = f["cnefe"].ok or f["ceps_csv"].ok or (web / "cep_indice.json").is_file()
    tem_servicos = any(f[k].ok for k in ("cnes", "inep", "censo", "manual"))
    if f["cnefe"].ok:
        indice = ("indice_cep.py", "indice de CEP (cada CEP -> centro aproximado, via CNEFE)", "")
    elif f["ceps_csv"].ok:   # plano B: o CSV de CEPs com coordenadas (nao exporta rua nem bairro)
        indice = ("indice_cep_csv.py", "indice de CEP (via CSV de CEPs, no lugar do CNEFE)", "")
    else:
        indice = ("indice_cep.py", "indice de CEP (cada CEP -> centro aproximado)",
                  "ja existe web/dados/cep_indice.json: mantido" if tem_indice else "falta o CNEFE (%s)" % f["cnefe"].como_obter)
    return [
        indice,
        ("servicos.py", "catalogo de servicos", "" if (tem_indice and tem_servicos) else
         "sem o indice de CEP o site nao usa os servicos reais" if not tem_indice else "nenhuma fonte de servicos encontrada"),
        ("vagas.py", "concursos e processos seletivos", ""),
    ]


def resumo(raiz: Path = RAIZ) -> list[str]:
    """O que o site vai mostrar de verdade agora (le os arquivos gerados)."""
    web, saida = raiz / "web" / "dados", []
    idx, srv = web / "cep_indice.json", web / "servicos.json"
    if idx.is_file():
        saida.append("CEPs indexados: %d" % len(json.loads(idx.read_text(encoding="utf-8")).get("ceps", {})))
    if srv.is_file():
        s = json.loads(srv.read_text(encoding="utf-8"))
        por_tipo: dict[str, int] = {}
        for x in s.get("servicos", []):
            por_tipo[x["tipo"]] = por_tipo.get(x["tipo"], 0) + 1
        saida.append("Servicos: %d  %s" % (len(s.get("servicos", [])), dict(sorted(por_tipo.items()))))
        saida.append("Origem: %s" % s.get("meta", {}).get("contagem_por_origem", {}))
    if (web / "vagas.json").is_file():
        saida.append("Vagas publicas: %d" % len(json.loads((web / "vagas.json").read_text(encoding="utf-8")).get("vagas", [])))
    real = idx.is_file() and srv.is_file()
    saida.append("Site: %s" % ("mostra DADOS REAIS (a faixa 'ilustrativos' some)" if real else "ainda em MODO DEMONSTRACAO (faltam cep_indice.json e servicos.json)"))
    return saida


def executar(passos, raiz: Path = RAIZ, rodar=None) -> list[tuple[str, str]]:
    """Roda as etapas possiveis. `rodar(script) -> (codigo, texto)` e injetavel para teste."""
    def padrao(script: str):
        r = subprocess.run([sys.executable, str(raiz / "pipeline" / script)], cwd=raiz, capture_output=True, text=True,
                           encoding="utf-8", errors="replace")
        return r.returncode, (r.stdout + r.stderr).strip()
    rodar = rodar or padrao
    resultados = []
    for script, descricao, pulo in passos:
        if pulo:
            resultados.append((descricao, "PULADO: " + pulo))
            continue
        codigo, texto = rodar(script)
        cauda = "\n".join(texto.splitlines()[-4:])
        resultados.append((descricao, ("OK" if codigo == 0 else "FALHOU (codigo %d)" % codigo) + (("\n      " + cauda.replace("\n", "\n      ")) if cauda else "")))
    return resultados


def main() -> None:
    fontes = diagnosticar()
    print("== O que voce ja tem ==")
    csv_ok = any(x.chave == "ceps_csv" and x.ok for x in fontes)
    for x in fontes:
        marca = "[OK]" if x.ok else ("[plano B]" if x.chave == "cnefe" and csv_ok else "[FALTA]" if x.obrigatoria else "[opcional]")
        print("%-10s %-52s %s" % (marca, x.nome, ("%d arquivo(s)" % len(x.achados)) if x.ok else "-> " + x.como_obter))
    if "--so-diagnostico" in sys.argv:
        return
    print("\n== Montando ==")
    for descricao, estado in executar(planejar(fontes)):
        print("- %s: %s" % (descricao, estado))
    print("\n== Resultado ==")
    for linha in resumo():
        print(" ", linha)
    print("\nProximo passo: abrir_servidor.bat (ou python pipeline\\servidor.py)")


if __name__ == "__main__":
    main()
