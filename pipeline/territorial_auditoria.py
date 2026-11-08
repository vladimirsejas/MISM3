"""Auditoria de privacidade de web/dados/indicadores_territoriais.json (política: docs/territorial/POLITICA_PRIVACIDADE_DADOS_TERRITORIAIS.md, seção 6).

O que verifica, olhando nomes de campo E conteúdo:
  1. estrutura: todo campo precisa estar no esquema conhecido; nome de campo que sugere dado pessoal (cpf, cep, endereço, telefone, e-mail,
     paciente, estudante, morador, responsável etc.) reprova com mensagem própria;
  2. conteúdo: padrões de CPF, CEP (8 dígitos) fora do contexto de equipamento, e-mail, telefone e endereço de logradouro em qualquer valor;
  3. nomes: o valor de "nome" de um equipamento precisa ser um nome do catálogo institucional; "bairro" precisa ser um bairro da malha do IBGE;
  4. proveniência: a posição de cada equipamento precisa vir rotulada (catalogo, centro_do_cep ou pendente) e "pendente" não pode ter coordenada.
O relatório nunca reproduz o valor suspeito: informa só o caminho do campo e o tipo de problema.

Setores pequenos: a política não define limiar de supressão (a regra numérica é decisão do autor). Este script NÃO suprime nada e NÃO escolhe faixa:
apenas LISTA os setores que cairiam em cada faixa candidata da proposta (docs/territorial/PROPOSTA_SUPRESSAO_E_AGREGACAO.md), para a decisão do autor.

Uso:   python pipeline/territorial_auditoria.py [arquivo.json] [--relatorio docs/territorial/AUDITORIA_MAPA_V1.md]
Sai com código 1 se a auditoria reprovar.
"""
from __future__ import annotations

import csv
import json
import re
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]
DADOS = RAIZ / "web" / "dados"
ALVO = DADOS / "indicadores_territoriais.json"
CATALOGO = RAIZ / "catalogo" / "servicos_manuais.csv"

# Esquema conhecido de indicadores_territoriais.json: qualquer outro nome de campo reprova.
CAMPOS_PERMITIDOS = {
    "meta", "totais", "classes", "cobertura", "resumo_distancias", "equipamentos", "setores",
    "versao", "carimbo", "fonte", "entradas_sha256", "entradas_geradas_em", "metodo", "aviso_metodologico", "rotulos_cenario",
    "auditoria_centros", "metodo_atual", "setores_auditados", "centroides_fora_do_poligono", "substituicao_automatica", "observacao",
    "rotulos_categoria", "ressalvas", "conferencia", "equipamentos_fora_da_malha", "coincide_com_exposicao_distancia",
    "setores.geojson", "territorio.json", "exposicao_distancia.json", "analise_territorial.json", "escolas_municipais.json", "servicos_manuais.csv", "cep_indice.json",
    "area_km2", "bairros", "domicilios", "pessoas", "rotulo", "unidade", "limites",
    "com_coordenada", "cadastrados", "completo",
    "populacao_toda", "setores_sem_bairro", "mediana_km", "p90_km", "acima_de", "percentual", "1 km", "2 km",
    "id", "nome", "categoria", "precisao", "metodo_localizacao", "fonte_localizacao", "raio_incerteza_m", "lat", "lon", "setor", "bairro", "densidade", "distancia_km", "distancia_min_km", "distancia_max_km",
    "metodologia_incerteza", "unidade_raio", "formula", "interpretacao", "origem_raio", "limite", "comparacao",
    "coordenadas_do_catalogo", "com_centro_do_cep", "cras", "ubs", "escola", "creche", "distancia",
}
# Hashes (SHA-256 das entradas e carimbo) podem conter, por acaso, 8 dígitos seguidos. Só estes campos, e só quando o valor INTEIRO é um hash
# hexadecimal, ficam fora da busca de padrões numéricos. Qualquer outro valor nesses campos é auditado normalmente.
CAMPOS_DE_HASH = (("meta", "carimbo"), ("meta", "entradas_sha256"))
HEX = re.compile(r"[0-9a-f]{16}|[0-9a-f]{64}")
# Campo que só vale dentro de um registro de equipamento (CEP cadastral do próprio equipamento público). A saída atual não usa.
CAMPOS_DE_CONTEXTO = {"cep_institucional": ("equipamentos",)}
PRECISOES = {"catalogo", "centro_do_cep", "pendente"}

NOMES_SUSPEITOS = re.compile(
    r"(cpf|cnpj|\brg\b|cep|cadastro_pessoa|endere[cç]o|logradouro|rua|telefone|celular|fone|e_?mail|paciente|estudante|aluno|aluna|"
    r"morador|moradora|resid[eê]ncia|respons[aá]vel|usu[aá]ria|nascimento|idade_individual|nome_mae|nome_pai|prontuario|matricula_aluno|cartao_sus)",
    re.IGNORECASE)
PADROES = {
    "CPF": re.compile(r"(?<!\d)\d{3}\.\d{3}\.\d{3}-\d{2}(?!\d)"),
    "CPF (11 dígitos)": re.compile(r"(?<!\d)\d{11}(?!\d)"),
    "CEP": re.compile(r"(?<!\d)\d{5}-\d{3}(?!\d)"),
    "CEP (8 dígitos)": re.compile(r"(?<!\d)\d{8}(?!\d)"),
    "e-mail": re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+"),
    "telefone": re.compile(r"(?<!\d)(?:\(?\d{2}\)?[\s-]?)?9?\d{4}-\d{4}(?!\d)"),
    "endereço de logradouro": re.compile(r"\b(?:rua|avenida|av\.?|travessa|alameda|estrada|rodovia)\s+[^,;\n]{1,60},?\s*(?:n[ºo.]?\s*)?\d{1,5}\b", re.IGNORECASE),
}
# Faixas CANDIDATAS da proposta (população abaixo de X ou domicílios abaixo de Y). Não aprovadas: só para listar.
FAIXAS_CANDIDATAS = (("conservadora", 5, 3), ("intermediária", 10, 5), ("ampliada", 20, 10))


class Falha:
    def __init__(self, caminho: str, tipo: str, mensagem: str):
        self.caminho, self.tipo, self.mensagem = caminho, tipo, mensagem

    def __str__(self) -> str:
        return f"{self.caminho}: [{self.tipo}] {self.mensagem}"


def _percorrer(no, caminho: tuple):
    """Gera (caminho, chave|None, valor) para cada folha e (caminho, chave, None) para cada nome de campo."""
    if isinstance(no, dict):
        for k, v in no.items():
            yield caminho + (k,), k, "__chave__"
            yield from _percorrer(v, caminho + (k,))
    elif isinstance(no, list):
        for i, v in enumerate(no):
            yield from _percorrer(v, caminho + (i,))
    else:
        yield caminho, None, no


def _fmt(caminho: tuple) -> str:
    return "/".join(str(p) for p in caminho)


def carregar_referencias() -> tuple[set, set]:
    with CATALOGO.open(encoding="utf-8-sig", newline="") as f:
        nomes = {r["nome"] for r in csv.DictReader(f)}
    geo = json.loads((DADOS / "setores.geojson").read_text(encoding="utf-8"))
    bairros = {(ft["properties"].get("bairro") or "") for ft in geo["features"]}
    return nomes, bairros


def auditar(dado: dict, nomes_instituicoes: set | None = None, bairros: set | None = None) -> list[Falha]:
    if nomes_instituicoes is None or bairros is None:
        n, b = carregar_referencias()
        nomes_instituicoes = n if nomes_instituicoes is None else nomes_instituicoes
        bairros = b if bairros is None else bairros
    falhas: list[Falha] = []
    for caminho, chave, valor in _percorrer(dado, ()):
        if valor == "__chave__":  # 1. inspeção estrutural: nomes de campo
            contexto = CAMPOS_DE_CONTEXTO.get(chave)
            if chave in CAMPOS_PERMITIDOS or (contexto and caminho[0] in contexto):
                continue
            if isinstance(chave, str) and re.fullmatch(r"\d{15}", chave):
                falhas.append(Falha(_fmt(caminho), "campo", "chave numérica longa (possível identificador); a saída não usa códigos como chave"))
            elif isinstance(chave, str) and NOMES_SUSPEITOS.search(chave):
                falhas.append(Falha(_fmt(caminho), "campo proibido", "o nome do campo sugere dado pessoal (CPF, CEP, endereço, telefone, e-mail, paciente, estudante, morador, responsável etc.)"))
            else:
                falhas.append(Falha(_fmt(caminho), "campo fora do esquema", "campo desconhecido: a saída pública só pode ter os campos do esquema"))
            continue
        if isinstance(valor, bool) or valor is None:
            continue
        chave_folha = next((p for p in reversed(caminho) if isinstance(p, str)), "")
        em_cep_ok = chave_folha == "cep_institucional" and caminho[0] == "equipamentos"
        if isinstance(valor, int) and abs(valor) >= 10_000_000:  # 2. conteúdo numérico: 8 dígitos ou mais lembram CEP/CPF
            falhas.append(Falha(_fmt(caminho), "conteúdo", "número com 8 ou mais dígitos (padrão de CEP ou CPF)"))
            continue
        if not isinstance(valor, str):
            continue
        if HEX.fullmatch(valor) and any(caminho[:len(c)] == c for c in CAMPOS_DE_HASH):
            continue
        for rotulo, rx in PADROES.items():
            if rx.search(valor):
                if rotulo.startswith("CEP") and em_cep_ok:
                    continue
                falhas.append(Falha(_fmt(caminho), "conteúdo", f"valor com padrão de {rotulo}"))
        if caminho[0] == "equipamentos" and chave_folha == "nome" and valor not in nomes_instituicoes:  # 3. nomes
            falhas.append(Falha(_fmt(caminho), "nome", "o nome do equipamento não é um nome do catálogo institucional (pode ser nome de pessoa)"))
        if caminho[0] == "setores" and chave_folha == "bairro" and valor not in bairros:
            falhas.append(Falha(_fmt(caminho), "nome", "o bairro não existe na malha do IBGE (texto livre não é permitido)"))
    for i, e in enumerate(dado.get("equipamentos", []) if isinstance(dado, dict) else []):  # 4. proveniência
        if not isinstance(e, dict):
            continue
        p = e.get("precisao")
        if p not in PRECISOES:
            falhas.append(Falha(f"equipamentos/{i}/precisao", "proveniência", "a posição do equipamento precisa vir rotulada como catalogo, centro_do_cep ou pendente"))
        if p == "pendente" and (e.get("lat") is not None or e.get("lon") is not None):
            falhas.append(Falha(f"equipamentos/{i}", "proveniência", "equipamento com localização pendente não pode ter coordenada"))
    return falhas


def setores_pequenos(dado: dict) -> dict[str, list[str]]:
    """Lista, por faixa candidata, os setores que exigiriam decisão do autor. Não suprime nem escolhe faixa."""
    saida = {}
    for nome, pmin, dmin in FAIXAS_CANDIDATAS:
        saida[nome] = sorted(s["id"] for s in dado.get("setores", []) if s["pessoas"] < pmin or s["domicilios"] < dmin)
    return saida


def relatorio(dado: dict, falhas: list[Falha]) -> str:
    peq = setores_pequenos(dado)
    carimbo = dado.get("meta", {}).get("carimbo", "?")
    linhas = ["# Auditoria de privacidade do mapa territorial v1", "",
              "Gerado por `pipeline/territorial_auditoria.py` sobre `web/dados/indicadores_territoriais.json`. "
              "O relatório não reproduz valores suspeitos: informa só o caminho do campo e o tipo de problema.", "",
              f"- Carimbo do arquivo auditado: `{carimbo}`",
              f"- Resultado: **{'APROVADA' if not falhas else 'REPROVADA'}** ({len(falhas)} ocorrência(s))",
              "- Verificações: estrutura (nomes de campo contra o esquema e contra nomes suspeitos), conteúdo (CPF, CEP de 8 dígitos, e-mail, telefone, endereço de logradouro), "
              "nomes (equipamento contra o catálogo institucional; bairro contra a malha do IBGE) e proveniência da posição dos equipamentos.", ""]
    if falhas:
        linhas += ["## Ocorrências", ""] + [f"- `{f.caminho}`: **{f.tipo}**. {f.mensagem}" for f in falhas] + [""]
    linhas += ["## Setores para decisão do autor (não suprimidos)", "",
               "A política de privacidade não fixa limiar numérico de supressão, e esta versão **não suprime nem agrega nenhum setor**. "
               "A proposta em `docs/territorial/PROPOSTA_SUPRESSAO_E_AGREGACAO.md` traz três faixas candidatas, ainda não aprovadas. "
               "Setores que cairiam em cada faixa (população abaixo do primeiro valor **ou** domicílios abaixo do segundo):", "",
               "| Faixa candidata | Critério | Setores |", "|---|---|---|"]
    for nome, pmin, dmin in FAIXAS_CANDIDATAS:
        linhas.append(f"| {nome} | menos de {pmin} pessoas ou menos de {dmin} domicílios | {len(peq[nome])} |")
    linhas += [""]
    for nome, pmin, dmin in FAIXAS_CANDIDATAS:
        linhas += [f"Faixa {nome} ({len(peq[nome])} setores): " + (", ".join(f"`{s}`" for s in peq[nome]) if peq[nome] else "nenhum"), ""]
    linhas += ["Publicar o mapa com esses setores visíveis depende da decisão do autor sobre a faixa e sobre suprimir ou agregar.", ""]
    return "\n".join(linhas)


def main(argv: list[str]) -> int:
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:  # noqa: BLE001
        pass
    destino_relatorio = argv[argv.index("--relatorio") + 1] if "--relatorio" in argv else None
    args = [a for a in argv if not a.startswith("--") and a != destino_relatorio]
    arquivo = Path(args[0]) if args else ALVO
    dado = json.loads(arquivo.read_text(encoding="utf-8"))
    falhas = auditar(dado)
    texto = relatorio(dado, falhas)
    if destino_relatorio:
        destino = Path(destino_relatorio)
        destino.parent.mkdir(parents=True, exist_ok=True)
        destino.write_text(texto + "\n", encoding="utf-8", newline="\n")
    if falhas:
        print("AUDITORIA REPROVADA: %d ocorrência(s) em %s" % (len(falhas), arquivo))
        for f in falhas:
            print("  -", f)
        print("Interrompa antes de publicar (política, seção 9): isole o material e reavalie a finalidade.")
        return 1
    peq = setores_pequenos(dado)
    print("AUDITORIA APROVADA: %s" % arquivo.name)
    print("Setores para decisão do autor (não suprimidos): " + "; ".join(f"{n}: {len(v)}" for n, v in peq.items()))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
