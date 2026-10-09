"""Passo 1 (baixar.py) - baixa as fontes publicas gratuitas para dados/bruto/.

Uso (no seu computador, com internet):
    python pipeline/baixar.py            # tenta tudo
    python pipeline/baixar.py cnefe      # so o CNEFE (obrigatorio para o CEP)
    python pipeline/baixar.py cnes
    python pipeline/baixar.py escolas

Os caminhos exatos de arquivo nos servidores do IBGE/INEP podem mudar. Por isso este
script NAO tem nomes de arquivo fixos: ele navega pelos indices de diretorio e escolhe
pelo codigo do municipio. Se algo nao for encontrado, ele diz o que fazer na mao
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
CNES_API = "https://apidadosabertos.saude.gov.br/cnes/estabelecimentos"


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


# ------------------------------------------------------------- CNES
def baixar_cnes() -> Path:
    """Estabelecimentos de saude via API de Dados Abertos do Ministerio da Saude."""
    destino = BRUTO / "cnes" / "estabelecimentos.json"
    if destino.exists():
        print("CNES ja esta em %s (apague para baixar de novo)." % destino)
        return destino
    registros: list[dict] = []
    limite, offset = 20, 0
    print("Baixando estabelecimentos do CNES (municipio %s)..." % MUNICIPIO_IBGE6)
    while True:
        url = "%s?codigo_municipio=%s&limit=%d&offset=%d" % (CNES_API, MUNICIPIO_IBGE6, limite, offset)
        try:
            dados = json.loads(abrir_url(url, timeout=60).decode("utf-8"))
        except Exception as e:  # noqa: BLE001
            if registros:
                print("  interrompido em %d registros: %s" % (len(registros), e))
                break
            erro("Falha ao consultar a API do CNES (%s).\nAlternativa: exporte a lista de estabelecimentos de Rio Claro em "
                 "https://cnes.datasus.gov.br (Consultas > Estabelecimentos) para CSV e coloque em %s" % (e, destino.parent))
        lote = dados.get("estabelecimentos") if isinstance(dados, dict) else dados
        if not lote:
            break
        registros.extend(lote)
        print("\r  %d registros" % len(registros), end="", flush=True)
        if len(lote) < limite:
            break
        offset += limite
    print()
    salvar_json(registros, destino)
    return destino


# ------------------------------------------------------------- escolas
def baixar_escolas() -> Path:
    destino_dir = BRUTO / "escolas"
    existentes = list(destino_dir.glob("*.csv"))
    if existentes:
        print("Escolas ja esta em %s (apague para baixar de novo)." % destino_dir)
        return existentes[0]
    print("Procurando o Censo Escolar mais recente no portal do INEP...")
    try:
        pagina = abrir_url(INEP_PAGINA).decode("utf-8", errors="replace")
    except Exception as e:  # noqa: BLE001
        erro("Nao consegui abrir a pagina do INEP (%s). Baixe o zip do Censo Escolar em %s e coloque o arquivo "
             "microdados_ed_basica_*.csv em %s" % (e, INEP_PAGINA, destino_dir))
    links = re.findall(r'href="([^"]+\.zip)"', pagina, flags=re.I)
    links = [l for l in links if "censo_escolar" in l.lower() or "microdados" in l.lower()]
    anos = sorted({int(a) for l in links for a in re.findall(r"(20\d{2})", l)}, reverse=True)
    if not anos:
        erro("Nao achei links de .zip na pagina do INEP. Baixe manualmente em %s." % INEP_PAGINA)
    ano = anos[0]
    alvo = [l for l in links if str(ano) in l][0]
    print("  ano mais recente encontrado: %d" % ano)
    zip_path = baixar(alvo, destino_dir / ("censo_escolar_%d.zip" % ano))
    with zipfile.ZipFile(zip_path) as z:
        nomes = [n for n in z.namelist() if re.search(r"microdados_ed_basica.*\.csv$", n, flags=re.I)]
        if not nomes:
            erro("O zip nao tem microdados_ed_basica_*.csv. Conteudo: %s" % z.namelist()[:20])
        alvo_csv = destino_dir / Path(nomes[0]).name
        with z.open(nomes[0]) as src, open(alvo_csv, "wb") as dst:
            while True:
                bloco = src.read(1024 * 1024)
                if not bloco:
                    break
                dst.write(bloco)
    zip_path.unlink()  # economiza espaco: o csv ja foi extraido
    print("  extraido: %s" % alvo_csv)
    return alvo_csv


def main(argv: list[str]) -> None:
    url_direta = None
    if "--url" in argv:
        i = argv.index("--url")
        url_direta = argv[i + 1]
        argv = argv[:i] + argv[i + 2:]
    alvo = argv[0] if argv else "tudo"
    if alvo in ("tudo", "cnefe"):
        baixar_cnefe(url_direta)
    if alvo in ("tudo", "cnes"):
        baixar_cnes()
    if alvo in ("tudo", "escolas"):
        baixar_escolas()
    print("\nPronto. Proximo passo: python pipeline/inspecionar_arquivo.py dados/bruto")


if __name__ == "__main__":
    main(sys.argv[1:])
