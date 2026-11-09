"""Auditoria de privacidade de web/dados/indicadores_territoriais.json (política: docs/territorial/POLITICA_PRIVACIDADE_DADOS_TERRITORIAIS.md, seção 6).

O que verifica, olhando nomes de campo E conteúdo:
  1. estrutura: todo campo precisa estar no esquema conhecido; nome de campo que sugere dado pessoal (cpf, cep, endereço, telefone, e-mail,
     paciente, estudante, morador, responsável etc.) reprova com mensagem própria;
  2. conteúdo: padrões de CPF, CEP (8 dígitos) fora do contexto de equipamento, e-mail, telefone e endereço de logradouro em qualquer valor;
  3. nomes: o valor de "nome" de um equipamento precisa ser um nome do catálogo institucional; "bairro" precisa ser um bairro da malha do IBGE;
  4. proveniência: a posição de cada equipamento precisa vir rotulada (catalogo, centro_do_cep ou pendente) e "pendente" não pode ter coordenada.
O relatório nunca reproduz o valor suspeito: informa só o caminho do campo e o tipo de problema.

Setores pequenos: a decisão D4 aprovada pelo autor suprime os setores com menos de 5 pessoas ou menos de 3 domicílios. Este script verifica se a supressão está aplicada nos indicadores e nos arquivos públicos relacionados; não lista identificadores nem valores suprimidos.

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
    "setores.geojson", "territorio.json", "exposicao_distancia.json", "analise_territorial.json", "escolas_municipais.json", "localizacao_registro.csv", "servicos_manuais.csv", "cep_indice.json",
    "area_km2", "bairros", "domicilios", "pessoas", "rotulo", "unidade", "limites",
    "com_coordenada", "cadastrados", "completo",
    "populacao_toda", "setores_sem_bairro", "mediana_km", "p90_km", "acima_de", "percentual", "1 km", "2 km",
    "id", "nome", "categoria", "precisao", "metodo_localizacao", "confianca_localizacao", "data_aplicacao_localizacao", "fonte_localizacao", "raio_incerteza_m", "lat", "lon", "setor", "bairro", "densidade", "distancia_km", "distancia_min_km", "distancia_max_km",
    "metodologia_incerteza", "unidade_raio", "formula", "interpretacao", "origem_raio", "limite", "comparacao",
    "coordenadas_do_catalogo", "com_centro_do_cep", "cras", "ubs", "escola", "creche", "distancia",
    "suprimido_privacidade", "dados_suprimidos", "setores_suprimidos", "setores_suprimidos_privacidade",
    "setores_validos", "setores_total", "setores_ate_1_km", "setores_3_km_ou_mais", "suprimidos", "nota_privacidade",
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
        if e.get("categoria") in {"cras", "ubs"}:
            confianca = e.get("confianca_localizacao")
            if confianca not in {"alta", "media", "nao_registrada", "aproximada_operacional"}:
                falhas.append(Falha(f"equipamentos/{i}/confianca_localizacao", "proveniência", "confiança de localização ausente ou fora dos valores permitidos"))
            if confianca == "nao_registrada" and e.get("raio_incerteza_m") is not None:
                falhas.append(Falha(f"equipamentos/{i}/raio_incerteza_m", "proveniência", "sem método/proveniência, o raio deve ser desconhecido, não zero"))
            if confianca in {"alta", "media"} and not e.get("data_aplicacao_localizacao"):
                falhas.append(Falha(f"equipamentos/{i}/data_aplicacao_localizacao", "proveniência", "registro de confiança exige data de aplicação"))
    categorias_raio_desconhecido = {
        e.get("categoria") for e in dado.get("equipamentos", [])
        if isinstance(e, dict) and e.get("precisao") != "pendente" and e.get("raio_incerteza_m") is None
    }
    for i, setor in enumerate(dado.get("setores", [])):
        for cenario in ("coordenadas_do_catalogo", "com_centro_do_cep"):
            for categoria in categorias_raio_desconhecido:
                limites = setor.get("distancia_min_km", {}).get(cenario, {})
                superiores = setor.get("distancia_max_km", {}).get(cenario, {})
                if limites.get(categoria) is not None or superiores.get(categoria) is not None:
                    falhas.append(Falha(f"setores/{i}/distancia_min_km/{cenario}/{categoria}", "proveniência", "não publicar envelope quando existe equipamento elegível sem raio conhecido"))
        protegido = setor.get("suprimido_privacidade") is True
        pessoas, domicilios = setor.get("pessoas"), setor.get("domicilios")
        abaixo_limite = (pessoas is not None and pessoas < 5) or (domicilios is not None and domicilios < 3)
        if abaixo_limite and not protegido:
            falhas.append(Falha(f"setores/{i}", "privacidade", "setor abaixo do critério D4 sem supressão"))
        if protegido:
            if pessoas is not None or domicilios is not None or setor.get("densidade") is not None:
                falhas.append(Falha(f"setores/{i}", "privacidade", "setor protegido ainda expõe população, domicílios ou densidade"))
            for grupo in ("distancia_km", "distancia_min_km", "distancia_max_km"):
                if any(v is not None for c in setor.get(grupo, {}).values() for v in c.values()):
                    falhas.append(Falha(f"setores/{i}/{grupo}", "privacidade", "setor protegido ainda expõe indicador de distância"))
    totais = dado.get("totais", {})
    if totais.get("pessoas") is not None or totais.get("domicilios") is not None:
        falhas.append(Falha("totais", "privacidade", "totais municipais demográficos devem permanecer omitidos enquanto houver supressão complementar"))
    return falhas


def setores_pequenos(dado: dict) -> dict[str, int]:
    """Retorna somente quantidades; nunca expõe identificadores nem valores de setores."""
    setores = dado.get("setores", [])
    suprimidos = 0
    inconsistentes = 0
    for setor in setores:
        if setor.get("suprimido_privacidade") is True:
            suprimidos += 1
            continue
        pessoas = setor.get("pessoas")
        domicilios = setor.get("domicilios")
        try:
            pessoas = int(pessoas)
            domicilios = int(domicilios)
        except (TypeError, ValueError, OverflowError):
            inconsistentes += 1
            continue
        if pessoas < 5 or domicilios < 3:
            inconsistentes += 1
    return {"suprimidos": suprimidos, "inconsistentes": inconsistentes}


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
    linhas += ["## Aplicação da decisão D4", "",
               f"- Setores protegidos: {peq['suprimidos']}",
               f"- Setores abaixo do critério sem supressão: {peq['inconsistentes']}",
               "- Critério: menos de 5 pessoas ou menos de 3 domicílios.",
               "- Os valores e identificadores dos setores protegidos não são listados neste relatório.",
               "- Os agregados demográficos dos bairros afetados e os totais municipais de população/domicílios também devem permanecer omitidos.", ""]
    return "\n".join(linhas)


def auditar_publicacao() -> list[Falha]:
    """Confere D4 em todos os arquivos territoriais servidos publicamente."""
    falhas: list[Falha] = []
    geo = json.loads((DADOS / "setores.geojson").read_text(encoding="utf-8"))
    terr = json.loads((DADOS / "territorio.json").read_text(encoding="utf-8"))
    expo = json.loads((DADOS / "exposicao_distancia.json").read_text(encoding="utf-8"))
    cep_indice = json.loads((DADOS / "cep_indice.json").read_text(encoding="utf-8"))
    escolas = json.loads((DADOS / "escolas_municipais.json").read_text(encoding="utf-8"))
    oferta = json.loads((DADOS / "oferta_educacao_infantil.json").read_text(encoding="utf-8"))
    analise = json.loads((DADOS / "analise_territorial.json").read_text(encoding="utf-8"))
    features = geo.get("features", [])
    protegidos = [f for f in features if f.get("properties", {}).get("suprimido_privacidade") is True]
    ids = {f["properties"]["setor"] for f in protegidos}
    bairros = {(f["properties"].get("bairro") or "Sem bairro definido pelo IBGE") for f in protegidos}
    if len(protegidos) != 17:
        falhas.append(Falha("setores.geojson", "privacidade", "a quantidade de setores protegidos difere da decisão D4"))
    if any(len(valor) > 3 and valor[3] in ids for valor in cep_indice.get("ceps", {}).values()):
        falhas.append(Falha("cep_indice.json", "privacidade", "o índice CEP ainda referencia setor protegido pela decisão D4"))
    for i, feature in enumerate(protegidos):
        p = feature.get("properties", {})
        if p.get("pessoas") is not None or p.get("domicilios") is not None:
            falhas.append(Falha(f"setores.geojson/features/{i}/properties", "privacidade", "GeoJSON ainda expõe contagem demográfica de setor protegido"))
    for codigo in ids:
        setor = terr.get("setores", {}).get(codigo)
        if not isinstance(setor, dict) or setor.get("suprimido_privacidade") is not True:
            falhas.append(Falha("territorio.json/setores", "privacidade", "setor protegido não está marcado no painel territorial"))
            continue
        if any(v is not None for k, v in setor.items() if k != "a" and k != "suprimido_privacidade"):
            falhas.append(Falha("territorio.json/setores", "privacidade", "painel territorial ainda expõe indicador derivado de setor protegido"))
    if terr.get("totais", {}).get("pessoas") is not None or terr.get("totais", {}).get("domicilios") is not None:
        falhas.append(Falha("territorio.json/totais", "privacidade", "totais municipais demográficos devem permanecer omitidos"))
    if terr.get("meta", {}).get("conferencia", {}).get("pessoas_somadas") is not None:
        falhas.append(Falha("territorio.json/meta/conferencia", "privacidade", "conferência municipal ainda expõe total populacional"))
    for b in terr.get("bairros", []):
        if b.get("nome") in bairros and (b.get("dados_suprimidos") is not True or any(b.get(k) is not None for k in ("pessoas", "domicilios", "densidade", "pessoas_por_domicilio"))):
            falhas.append(Falha("territorio.json/bairros", "privacidade", "agregado de bairro afetado não recebeu supressão complementar"))
    for categoria, resumo in terr.get("distancia_ate_servico", {}).items():
        if any("pessoas" in k for k in resumo):
            falhas.append(Falha(f"territorio.json/distancia_ate_servico/{categoria}", "privacidade", "resumo de distância ainda publica contagens populacionais"))
    if expo.get("meta", {}).get("pessoas_total") is not None:
        falhas.append(Falha("exposicao_distancia.json/meta", "privacidade", "exposição ainda publica total populacional"))
    if "escolas" in oferta or any(
        any("matricula" in k.lower() or "turma" in k.lower() for k in escola)
        for escola in escolas.get("escolas", [])
    ):
        falhas.append(Falha("escolas_municipais.json/oferta_educacao_infantil.json", "privacidade", "cadastro público ainda expõe matrículas ou turmas por escola"))
    for cenario, categorias in expo.get("cenarios", {}).items():
        for categoria, resumo in categorias.items():
            if "populacao_toda" in resumo or any("pessoas" in k for k in resumo):
                falhas.append(Falha(f"exposicao_distancia.json/cenarios/{cenario}/{categoria}", "privacidade", "resumo ainda publica métricas ponderadas por população"))
    if analise.get("meta", {}).get("pessoas_total") is not None or analise.get("grupos") is not None:
        falhas.append(Falha("analise_territorial.json", "privacidade", "análise ainda publica total populacional ou agrupamento derivado"))
    for b in analise.get("bairros", []):
        if b.get("bairro") in bairros and (b.get("dados_suprimidos") is not True or b.get("pessoas") is not None or any(v is not None for k, v in b.items() if k.startswith("distancia_media_"))):
            falhas.append(Falha("analise_territorial.json/bairros", "privacidade", "bairro afetado ainda expõe agregado ou média derivada"))
    return falhas


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
    if arquivo.resolve() == ALVO.resolve():
        falhas.extend(auditar_publicacao())
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
    print("D4: %d setores suprimidos; %d inconsistências de supressão." % (len(peq["suprimidos"]), len(peq["inconsistentes"])))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
