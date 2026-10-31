"""Oferta real de creche e pré-escola em Rio Claro, a partir do Censo Escolar 2025 do INEP.

Entrada : as tabelas nacionais do INEP (uma linha por ESCOLA, com contagens; não há alunos individuais):
            Tabela_Escola_2025_V2.csv, Tabela_Matricula_2025_V2.csv, Tabela_Turma_2025_V2.csv
          em docs/educacao/dados/ (ou passe --pasta). São grandes (100 MB+) porque cobrem o país todo e ficam
          só no computador de quem usa (estão no .gitignore).
Saída   : web/dados/oferta_educacao_infantil.json, pequeno e só de Rio Claro: por escola, matrículas, turmas e
          oferta de creche e pré-escola, mais totais por rede (municipal, privada...). Este sim vai para o Git.

Uso:
    python pipeline/oferta_educacao_infantil.py
    python pipeline/oferta_educacao_infantil.py --pasta caminho/das/tabelas

O que NÃO é: matrícula não é vaga, nem demanda, nem fila. Uma escola cheia com fila de espera e uma escola com
vagas sobrando aparecem iguais aqui. Para a taxa de cobertura falta a população de 0 a 3 anos por setor (Censo
2022, "Agregados por setores censitários") e a fila da Secretaria da Educação (ver docs/pedidos_LAI.md).
Campo em branco no INEP vira "null", nunca zero.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import MUNICIPIO_IBGE7, RAIZ, WEB_DADOS, agora_iso, erro, salvar_json  # noqa: E402

PASTA_CSV = RAIZ / "docs" / "educacao" / "dados"
PASTA_PARQUET = RAIZ / "dados" / "parquet" / "git_historico" / "educacao" / "dados"
PASTA_PADRAO = PASTA_CSV if PASTA_CSV.exists() else PASTA_PARQUET
ARQUIVOS = {
    "escola": "Tabela_Escola_2025_V2.csv",
    "matricula": "Tabela_Matricula_2025_V2.csv",
    "turma": "Tabela_Turma_2025_V2.csv",
}
# colunas lidas de cada tabela (as demais, 200+ por arquivo, não interessam)
COLUNAS = {
    "escola": ["CO_MUNICIPIO", "CO_ENTIDADE", "NO_ENTIDADE", "TP_DEPENDENCIA", "TP_LOCALIZACAO",
               "TP_SITUACAO_FUNCIONAMENTO", "IN_COMUM_CRECHE", "IN_COMUM_PRE"],
    "matricula": ["CO_MUNICIPIO", "CO_ENTIDADE", "QT_MAT_INF_CRE", "QT_MAT_BAS_0_3", "QT_MAT_INF_PRE",
                  "QT_MAT_INF_CRE_INT"],
    "turma": ["CO_MUNICIPIO", "CO_ENTIDADE", "QT_TUR_INF_CRE", "QT_TUR_INF_PRE"],
}
REDES = {"1": "federal", "2": "estadual", "3": "municipal", "4": "privada"}
LOCALIZACAO = {"1": "urbana", "2": "rural"}


def detectar_codificacao(caminho: Path) -> str:
    """'utf-8-sig' se o arquivo INTEIRO decodifica como UTF-8, senão 'latin-1'.

    Olhar só o começo não basta: um arquivo latin-1 pode ter 300 mil linhas sem acento e quebrar na 300.001ª.
    Lê em blocos de 4 MB, então um arquivo de 135 MB não vai todo para a memória.
    """
    import codecs

    decodificador = codecs.getincrementaldecoder("utf-8")()
    with caminho.open("rb") as f:
        while True:
            bloco = f.read(4 * 1024 * 1024)
            try:
                decodificador.decode(bloco, final=not bloco)
            except UnicodeDecodeError:
                return "latin-1"
            if not bloco:
                return "utf-8-sig"


def caminho_tabela(pasta: Path, nome_csv: str) -> Path:
    """Resolve a tabela na pasta: Parquet tem prioridade; CSV continua aceito."""
    nome = Path(nome_csv).stem
    for extensao in (".parquet", ".pq", ".csv"):
        caminho = Path(pasta) / (nome + extensao)
        if caminho.exists():
            return caminho
    return Path(pasta) / nome_csv


def ler_filtrado(caminho: Path, colunas: list[str], municipio: str = MUNICIPIO_IBGE7):
    """Lê apenas as colunas necessárias e filtra Rio Claro; CSV em blocos, Parquet por colunas."""
    import pandas as pd

    if caminho.suffix.lower() in (".parquet", ".pq"):
        import pyarrow.parquet as pq

        cabecalho = pq.read_schema(caminho).names
        faltando = [c for c in colunas if c not in cabecalho]
        if faltando:
            raise ValueError("%s sem as colunas %s. Colunas do arquivo: %s" %
                             (caminho.name, faltando, cabecalho[:30]))
        df = pd.read_parquet(caminho, columns=colunas).astype("string")
        return df[df["CO_MUNICIPIO"].str.strip() == municipio].reset_index(drop=True)

    codificacao = detectar_codificacao(caminho)
    cabecalho = pd.read_csv(caminho, sep=";", nrows=0, encoding=codificacao, dtype=str)
    faltando = [c for c in colunas if c not in cabecalho.columns]
    if faltando:
        raise ValueError("%s sem as colunas %s. Colunas do arquivo: %s" % (caminho.name, faltando, list(cabecalho.columns)[:30]))
    partes = []
    for bloco in pd.read_csv(caminho, sep=";", usecols=colunas, dtype=str, encoding=codificacao, chunksize=50000):
        bloco = bloco[bloco["CO_MUNICIPIO"].astype(str).str.strip() == municipio]
        if len(bloco):
            partes.append(bloco)
    return pd.concat(partes) if partes else pd.DataFrame(columns=colunas)


def inteiro(valor):
    """'12' -> 12; vazio ou ausente -> None (em branco não é zero)."""
    if valor is None:
        return None
    t = str(valor).strip().replace(",", ".")
    if t in ("", "nan", "None"):
        return None
    try:
        return int(float(t))
    except ValueError:
        return None


def montar(escola, matricula=None, turma=None, hoje: str | None = None) -> dict:
    """Junta as tabelas (já filtradas para o município) pelo código da escola e calcula os totais por rede."""
    mat = {r["CO_ENTIDADE"]: r for r in matricula.to_dict("records")} if matricula is not None else {}
    tur = {r["CO_ENTIDADE"]: r for r in turma.to_dict("records")} if turma is not None else {}
    escolas, ignoradas = [], 0
    for r in escola.to_dict("records"):
        if str(r["TP_SITUACAO_FUNCIONAMENTO"]).strip() != "1":  # 1 = em atividade
            ignoradas += 1
            continue
        m, t = mat.get(r["CO_ENTIDADE"], {}), tur.get(r["CO_ENTIDADE"], {})
        e = {
            "inep": str(r["CO_ENTIDADE"]).strip(),
            "nome": str(r["NO_ENTIDADE"]).strip(),
            "rede": REDES.get(str(r["TP_DEPENDENCIA"]).strip(), "nao_informada"),
            "localizacao": LOCALIZACAO.get(str(r["TP_LOCALIZACAO"]).strip(), "nao_informada"),
            "oferece_creche": str(r["IN_COMUM_CRECHE"]).strip() == "1",
            "oferece_pre_escola": str(r["IN_COMUM_PRE"]).strip() == "1",
            "matriculas_creche": inteiro(m.get("QT_MAT_INF_CRE")),
            "matriculas_0_a_3_anos": inteiro(m.get("QT_MAT_BAS_0_3")),
            "matriculas_creche_tempo_integral": inteiro(m.get("QT_MAT_INF_CRE_INT")),
            "matriculas_pre_escola": inteiro(m.get("QT_MAT_INF_PRE")),
            "turmas_creche": inteiro(t.get("QT_TUR_INF_CRE")),
            "turmas_pre_escola": inteiro(t.get("QT_TUR_INF_PRE")),
        }
        if e["oferece_creche"] or e["oferece_pre_escola"] or (e["matriculas_creche"] or 0) > 0 or (e["matriculas_pre_escola"] or 0) > 0:
            escolas.append(e)
    escolas.sort(key=lambda e: (e["rede"], e["nome"]))

    totais = {}
    for rede in sorted({e["rede"] for e in escolas}):
        grupo = [e for e in escolas if e["rede"] == rede]
        soma = lambda campo: sum(e[campo] or 0 for e in grupo)  # noqa: E731
        totais[rede] = {
            "escolas_com_educacao_infantil": len(grupo),
            "escolas_com_creche": sum(e["oferece_creche"] for e in grupo),
            "matriculas_creche": soma("matriculas_creche"),
            "turmas_creche": soma("turmas_creche"),
            "matriculas_pre_escola": soma("matriculas_pre_escola"),
            "escolas_sem_dado_de_matricula_creche": sum(1 for e in grupo if e["oferece_creche"] and e["matriculas_creche"] is None),
        }
    return {
        "meta": {
            "fonte": "INEP - Censo Escolar da Educação Básica 2025 (tabelas Escola, Matrícula e Turma)",
            "municipio": MUNICIPIO_IBGE7,
            "gerado_em": hoje or agora_iso()[:10],
            "escolas_fora_de_atividade_ignoradas": ignoradas,
            "aviso": "Matrícula não é vaga, demanda nem fila de espera. Esta tabela mostra a oferta que já existe "
                     "no Censo Escolar; não mostra quem está esperando nem a população de 0 a 3 anos.",
        },
        "totais_por_rede": totais,
        "escolas": escolas,
    }


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--pasta", type=Path, default=PASTA_PADRAO, help="pasta com as três tabelas do INEP")
    ap.add_argument("--saida", type=Path, default=WEB_DADOS / "oferta_educacao_infantil.json")
    a = ap.parse_args()
    caminhos = {k: caminho_tabela(a.pasta, n) for k, n in ARQUIVOS.items()}
    if not caminhos["escola"].exists():
        erro("Não achei Tabela_Escola_2025_V2.csv ou .parquet em %s. Passe a pasta certa com --pasta." % a.pasta)
    try:
        dados = {k: ler_filtrado(c, COLUNAS[k]) for k, c in caminhos.items() if c.exists()}
    except ValueError as e:
        erro(str(e))
    for k, c in caminhos.items():
        if not c.exists():
            print("AVISO: tabela %s não encontrada; os campos dessa tabela ficam vazios (null)." % c.stem)
    if dados["escola"].empty:
        erro("Nenhuma escola do município %s na tabela de escolas. Confira se o arquivo é de 2025 e nacional." % MUNICIPIO_IBGE7)
    saida = montar(dados["escola"], dados.get("matricula"), dados.get("turma"))
    salvar_json(saida, a.saida)
    print("Gravado %s (%d escolas com educação infantil em Rio Claro)." % (a.saida, len(saida["escolas"])))
    for rede, t in saida["totais_por_rede"].items():
        print("  %-10s %3d escolas | %3d com creche | %5d matrículas em creche | %4d turmas de creche | %5d na pré-escola"
              % (rede, t["escolas_com_educacao_infantil"], t["escolas_com_creche"], t["matriculas_creche"],
                 t["turmas_creche"], t["matriculas_pre_escola"]))
    print("Matrícula não é vaga nem fila. Para a cobertura falta a população de 0 a 3 anos (Censo 2022 por setor).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
