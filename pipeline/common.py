"""Utilidades comuns do pipeline do Mapa do Cuidado Rio-Clarense.

Regras do projeto, valem para todos os scripts:
  1. So entram dados publicos e agregados. Nenhum nome de pessoa, CPF ou endereco
     residencial e gravado nos arquivos que vao para o site.
  2. Toda informacao carrega a fonte e a data (verificado_em / gerado_em).
  3. O municipio e sempre identificado pelo codigo IBGE, nunca pelo nome
     (existe Rio Claro no Rio de Janeiro tambem).
"""
from __future__ import annotations

import html
import io
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
DADOS = RAIZ / "dados"
BRUTO = DADOS / "bruto"
WEB_DADOS = RAIZ / "web" / "dados"
CATALOGO = RAIZ / "catalogo"

MUNICIPIO_IBGE7 = "3543907"  # Rio Claro / SP (7 digitos, padrao IBGE)
MUNICIPIO_IBGE6 = "354390"  # mesmo municipio sem o digito verificador (padrao DATASUS)
MUNICIPIO_NOME = "Rio Claro"
UF = "SP"

USER_AGENT = "mapa-do-cuidado/0.1 (projeto academico Fatec Rio Claro; dados publicos)"


# ----------------------------------------------------------------- rede
def abrir_url(url: str, timeout: int = 60) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read()


def baixar(url: str, destino: Path, tentativas: int = 3, mostrar: bool = True) -> Path:
    """Baixa um arquivo grande em blocos, com nova tentativa e escrita atomica."""
    destino = Path(destino)
    destino.parent.mkdir(parents=True, exist_ok=True)
    parcial = destino.with_suffix(destino.suffix + ".parte")
    ultimo_erro: Exception | None = None
    for n in range(1, tentativas + 1):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, timeout=120) as resp, open(parcial, "wb") as f:
                total = int(resp.headers.get("Content-Length") or 0)
                lido = 0
                while True:
                    bloco = resp.read(1024 * 256)
                    if not bloco:
                        break
                    f.write(bloco)
                    lido += len(bloco)
                    if mostrar and total:
                        print("\r  %s: %5.1f%% (%d MB)" % (destino.name, 100 * lido / total, lido // 1_048_576), end="", flush=True)
            if mostrar:
                print()
            parcial.replace(destino)
            return destino
        except (urllib.error.URLError, TimeoutError, ConnectionError) as e:  # noqa: PERF203
            ultimo_erro = e
            print("  tentativa %d/%d falhou: %s" % (n, tentativas, e))
            time.sleep(2 * n)
    raise RuntimeError("Nao consegui baixar %s: %s" % (url, ultimo_erro))


def listar_indice(url: str) -> list[tuple[str, bool]]:
    """Le uma pagina de indice de diretorio (estilo Apache, como o FTP do IBGE).

    Devolve [(nome, eh_diretorio)]. Nao assume nomes de arquivos: quem chama
    escolhe por palavra-chave, assim o script sobrevive a pequenas mudancas no site.
    """
    if not url.endswith("/"):
        url += "/"
    texto = abrir_url(url).decode("utf-8", errors="replace")
    achados: list[tuple[str, bool]] = []
    for href in re.findall(r'href="([^"]+)"', texto, flags=re.I):
        href = html.unescape(href)
        if href.startswith(("?", "#", "/", "..", "http")):
            continue
        nome = urllib.parse.unquote(href)
        achados.append((nome.rstrip("/"), href.endswith("/")))
    return achados


# ----------------------------------------------------------------- dados
def normalizar_cep(valor) -> str | None:
    """Devolve o CEP com 8 digitos ou None se for invalido/ausente."""
    if valor is None:
        return None
    s = str(valor).strip()
    if re.fullmatch(r"\d+\.0", s):  # inteiro lido como float: 13500000.0
        s = s[:-2]
    s = re.sub(r"\D", "", s)
    if not s:
        return None
    s = s.zfill(8)
    if len(s) != 8 or s == "00000000":
        return None
    return s


def achar_coluna(colunas, *candidatos: str) -> str | None:
    """Acha o nome real de uma coluna ignorando maiusculas e acentos simples."""
    mapa = {str(c).strip().lower(): c for c in colunas}
    for cand in candidatos:
        if cand.lower() in mapa:
            return mapa[cand.lower()]
    return None


def para_numero(serie):
    """Converte texto numerico com virgula ou ponto decimal em float (NaN se falhar)."""
    import pandas as pd

    return pd.to_numeric(serie.astype(str).str.strip().str.replace(",", ".", regex=False), errors="coerce")


def ler_csv_flex(origem, **kw):
    """Le CSV publico brasileiro tentando utf-8 e latin-1 e detectando ; ou ,."""
    import pandas as pd

    if isinstance(origem, (str, Path)):
        bruto = Path(origem).read_bytes()
    elif isinstance(origem, (bytes, bytearray)):
        bruto = bytes(origem)
    else:
        bruto = origem.read()
    for enc in ("utf-8-sig", "latin-1"):
        try:
            texto = bruto.decode(enc)
            break
        except UnicodeDecodeError:
            continue
    primeira = texto.splitlines()[0] if texto else ""
    sep = ";" if primeira.count(";") >= primeira.count(",") else ","
    return pd.read_csv(io.StringIO(texto), sep=sep, dtype=str, **kw)


def haversine_m(lat1, lon1, lat2, lon2):
    """Distancia em metros entre dois pontos (aceita arrays numpy)."""
    import numpy as np

    r = 6_371_000.0
    p1, p2 = np.radians(lat1), np.radians(lat2)
    dphi = p2 - p1
    dl = np.radians(lon2) - np.radians(lon1)
    a = np.sin(dphi / 2) ** 2 + np.cos(p1) * np.cos(p2) * np.sin(dl / 2) ** 2
    return 2 * r * np.arcsin(np.sqrt(a))


def salvar_json(obj, caminho: Path) -> None:
    caminho = Path(caminho)
    caminho.parent.mkdir(parents=True, exist_ok=True)
    with open(caminho, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, separators=(",", ":"))
    print("  gravado: %s (%.1f KB)" % (caminho, caminho.stat().st_size / 1024))


def agora_iso() -> str:
    return time.strftime("%Y-%m-%d")


def erro(msg: str, codigo: int = 1):
    print("\nERRO: " + msg, file=sys.stderr)
    sys.exit(codigo)
