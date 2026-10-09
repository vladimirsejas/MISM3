"""Passo 1 (baixar.py) - baixa as fontes publicas gratuitas para dados/bruto/.

Uso (no seu computador, com internet):
    python pipeline/baixar.py            # tenta tudo
    python pipeline/baixar.py cnefe      # so o CNEFE (obrigatorio para o CEP)
    python pipeline/baixar.py escolas                 # baixa o Censo Escolar (retoma se cair)
    python pipeline/baixar.py escolas --zip "C:\\...\\microdados_censo_escolar_2025.zip"   # zip baixado pelo navegador

Os caminhos nos servidores do IBGE/INEP podem mudar. O CNEFE e descoberto navegando pelos
indices de diretorio (escolhe pelo codigo do municipio); o Censo Escolar usa uma lista de
enderecos conhecidos do INEP. Downloads grandes RETOMAM de onde pararam se a conexao cair. Se algo nao for encontrado, ele diz o que fazer na mao
(baixar pelo navegador e colocar o arquivo na pasta indicada).
"""
from __future__ import annotations

import json
import re
import sys
import zipfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import (BRUTO, MUNICIPIO_IBGE6, MUNICIPIO_IBGE7, abrir_url, baixar, erro, listar_indice, salvar_json)  # noqa: E402

CNEFE_RAIZ = "https://ftp.ibge.gov.br/Cadastro_Nacional_de_Enderecos_Fins_Estatisticos/Censo_Demografico_2022/"
CNEFE_PAGINA = "https://www.ibge.gov.br/estatisticas/sociais/populacao/38734-cadastro-nacional-de-enderecos-para-fins-estatisticos.html"
INEP_PAGINA = "https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/microdados/censo-escolar"


# ------------------------------------------------------------- CNEFE
def _descer(url: str, preferencias: list[str], profundidade: int = 6) -> tuple[str, list[tuple[str, bool]]]:
    """Desce pelo indice escolhendo, em cada nivel, a pasta que casa com uma preferencia."""
    atual = url
    itens = listar_indice(atual)
    for _ in range(profundidade):
        zips = [n for n, d in itens if not d and n.lower().endswith(".zip")]
        if any(MUNICIPIO_IBGE7 in z or "RIO_CLARO" in z.upper() for z in zips):
            return atual, itens
        pastas = [n for n, d in itens if d]
        escolha = None
        for pref in preferencias:
            for p in pastas:
                if re.search(pref, p, flags=re.I):
                    escolha = p
                    break
            if escolha:
                break
        if not escolha:
            break
        atual = atual.rstrip("/") + "/" + escolha + "/"
        itens = listar_indice(atual)
    return atual, itens


def baixar_cnefe(url_direta: str | None = None) -> Path:
    destino_dir = BRUTO / "cnefe"
    existentes = list(destino_dir.glob("*.zip")) + list(destino_dir.glob("*.csv"))
    if existentes:
        print("CNEFE ja esta em %s (apague para baixar de novo)." % destino_dir)
        return existentes[0]
    if url_direta:
        return baixar(url_direta, destino_dir / Path(url_direta).name)
    print("Procurando o CNEFE 2022 de Rio Claro no FTP do IBGE...")
    try:
        pasta, itens = _descer(CNEFE_RAIZ, [r"^Arquivos_CNEFE$", r"^CSV$", r"^Municipios$", r"^35", r"^SP$"])
    except Exception as e:  # noqa: BLE001
        erro("Nao consegui ler o FTP do IBGE (%s).\nBaixe manualmente em %s o arquivo do municipio %s (Rio Claro/SP) "
             "e coloque o .zip em %s" % (e, CNEFE_PAGINA, MUNICIPIO_IBGE7, destino_dir))
    zips = [n for n, d in itens if not d and n.lower().endswith(".zip") and (MUNICIPIO_IBGE7 in n or "RIO_CLARO" in n.upper())]
    if not zips:
        print("Pasta alcancada: %s" % pasta)
        print("Conteudo (primeiros 40): %s" % [n for n, _ in itens][:40])
        erro("Nao achei o arquivo de Rio Claro. Baixe manualmente em %s e coloque o .zip em %s.\n"
             "Ou rode de novo com --url <endereco-direto-do-zip>." % (CNEFE_PAGINA, destino_dir))
    return baixar(pasta + zips[0], destino_dir / zips[0])


URLS_CENSO_ESCOLAR = [  # em ordem de preferencia; o INEP as troca de ano em ano
    "https://download.inep.gov.br/dados_abertos/microdados_censo_escolar_2025_.zip",
    "https://download.inep.gov.br/dados_abertos/microdados_censo_escolar_2025.zip",
    "https://download.inep.gov.br/dados_abertos/microdados_censo_escolar_2024.zip",
]


def extrair_escolas(zip_path: Path, destino_dir: Path) -> Path:
    """Tira do zip so o microdados_ed_basica_*.csv (o resto e enorme e nao usamos)."""
    with zipfile.ZipFile(zip_path) as z:
        nomes = [n for n in z.namelist() if re.search(r"microdados_ed_basica.*\.csv$", n, flags=re.I)]
        if not nomes:
            erro("O zip nao tem microdados_ed_basica_*.csv. Conteudo: %s" % z.namelist()[:20])
        alvo_csv = Path(destino_dir) / Path(nomes[0]).name
        alvo_csv.parent.mkdir(parents=True, exist_ok=True)
        with z.open(nomes[0]) as src, open(alvo_csv, "wb") as dst:
            while True:
                bloco = src.read(1024 * 1024)
                if not bloco:
                    break
                dst.write(bloco)
    print("  extraido: %s" % alvo_csv)
    return alvo_csv


def baixar_escolas(url_direta: str | None = None, zip_local: str | None = None) -> Path:
    destino_dir = BRUTO / "escolas"
    if zip_local:  # zip baixado pelo navegador
        return extrair_escolas(Path(zip_local), destino_dir)
    existentes = list(destino_dir.glob("microdados_ed_basica*.csv"))
    if existentes:
        print("Escolas ja esta em %s (apague para baixar de novo)." % destino_dir)
        return existentes[0]
    candidatos = [url_direta] if url_direta else URLS_CENSO_ESCOLAR
    ultimo = None
    for url in candidatos:
        print("Baixando %s" % url)
        try:
            zip_path = baixar(url, destino_dir / "censo_escolar.zip")
            break
        except RuntimeError as e:
            ultimo = e
            print("  nao deu: %s" % e)
    else:
        erro("Nao consegui baixar o Censo Escolar (%s).\nBaixe o zip pelo navegador em %s e rode:\n"
             "  python pipeline/baixar.py escolas --zip \"C:\\caminho\\arquivo.zip\"" % (ultimo, INEP_PAGINA))
    caminho = extrair_escolas(zip_path, destino_dir)
    zip_path.unlink()  # economiza espaco: o csv ja foi extraido
    return caminho


def main(argv: list[str]) -> None:
    url_direta = None
    if "--url" in argv:
        i = argv.index("--url")
        url_direta = argv[i + 1]
        argv = argv[:i] + argv[i + 2:]
    zip_local = None
    if "--zip" in argv:
        i = argv.index("--zip")
        zip_local = argv[i + 1]
        argv = argv[:i] + argv[i + 2:]
    alvo = argv[0] if argv else "tudo"
    if alvo in ("tudo", "cnefe"):
        baixar_cnefe(url_direta)
    if alvo in ("tudo", "escolas"):
        baixar_escolas(url_direta if alvo == "escolas" else None, zip_local)
    print("\nPronto. Proximo passo: python pipeline/inspecionar_arquivo.py dados/bruto")


if __name__ == "__main__":
    main(sys.argv[1:])
