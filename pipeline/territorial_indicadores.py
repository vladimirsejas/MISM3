"""Indicadores territoriais da versão 1 do mapa do MISM3: gera web/dados/indicadores_territoriais.json.

Especificação: docs/territorial/METODOLOGIA_INDICADORES_TERRITORIAIS.md e POLITICA_PRIVACIDADE_DADOS_TERRITORIAIS.md.
Decisões do autor (06/11/2026): só dados públicos, agregados e de locais; nenhum dado de pessoa, CEP ou endereço residencial; o cenário
"com_centro_do_cep" (CEP cadastral do próprio equipamento público) permanece, como análise de sensibilidade, ao lado de "coordenadas_do_catalogo".

Entradas (todas já existentes; nada é baixado nem enviado):
  web/dados/setores.geojson, territorio.json, exposicao_distancia.json, analise_territorial.json e catalogo/servicos_manuais.csv.
  Exceção documentada: web/dados/cep_indice.json é lido SÓ para localizar o CEP cadastral de cada equipamento público no cenário
  "com_centro_do_cep" (a mesma regra de pipeline/exposicao_distancia.py). Nenhum CEP é gravado na saída.

As distâncias NÃO usam lógica nova: reaproveitam o centroide, a distância de Haversine e a regra de localização dos serviços de
pipeline/analise_territorial.py, e o resumo de pipeline/exposicao_distancia.py. O script confere o resultado contra
web/dados/exposicao_distancia.json e se recusa a gravar se houver qualquer diferença.

Determinístico: mesma entrada, mesma saída. O carimbo da saída é derivado do hash do conteúdo das entradas (sem data variável).

Uso:   python pipeline/territorial_indicadores.py            (grava web/dados/indicadores_territoriais.json)
       python pipeline/territorial_indicadores.py --conferir (falha se o arquivo gravado difere do que seria gerado agora)
"""
from __future__ import annotations

import csv
import hashlib
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import analise_territorial as at  # noqa: E402
import exposicao_distancia as ed  # noqa: E402

RAIZ = Path(__file__).resolve().parents[1]
DADOS = RAIZ / "web" / "dados"
CATALOGO = RAIZ / "catalogo" / "servicos_manuais.csv"
SAIDA = DADOS / "indicadores_territoriais.json"
VERSAO = "1"
ENTRADAS = ("setores.geojson", "territorio.json", "exposicao_distancia.json", "analise_territorial.json", "escolas_municipais.json")
ENTRADA_CEP = "cep_indice.json"
CENARIOS = tuple(ed.CENARIOS)  # coordenadas_do_catalogo, com_centro_do_cep
CATEGORIAS = tuple(at.CATEGORIAS)  # cras, ubs, escola
ROTULOS_CATEGORIA = {"cras": "CRAS", "ubs": "UBS e USF", "escola": "Escolas municipais"}
ROTULOS_CENARIO = {
    "coordenadas_do_catalogo": "Coordenadas do catálogo (conferidas)",
    "com_centro_do_cep": "Análise de sensibilidade: centro do CEP cadastral do equipamento",
}
AVISO_METODOLOGICO = ("A distância em linha reta não representa tempo de deslocamento ou acesso efetivo: não considera ruas, transporte, horários, "
                      "capacidade nem área de atendimento. A presença ou a ausência de um equipamento em um setor não define quem ele atende.")
# Faixas de leitura das distâncias (km). 1 e 2 km são os limiares de web/dados/exposicao_distancia.json; 0,5 e 3 km só organizam a legenda.
FAIXAS_DISTANCIA_KM = [0.5, 1.0, 2.0, 3.0]
LIMITES_DENSIDADE = [500, 2000, 5000, 10000]  # os mesmos de territorio.json (classes.densidade.limites)


def hash_conteudo(caminho: Path) -> str:
    """SHA-256 do texto com quebras de linha normalizadas (o mesmo valor no Windows e no Linux)."""
    return hashlib.sha256(caminho.read_bytes().replace(b"\r\n", b"\n")).hexdigest()


def carregar(dados: Path = DADOS, catalogo: Path = CATALOGO) -> dict:
    ent = {nome: json.loads((dados / nome).read_text(encoding="utf-8")) for nome in ENTRADAS}
    with catalogo.open(encoding="utf-8-sig", newline="") as f:
        linhas = list(csv.DictReader(f))
    arq_cep = dados / ENTRADA_CEP
    indice = json.loads(arq_cep.read_text(encoding="utf-8")).get("ceps", {}) if arq_cep.exists() else {}
    hashes = {nome: hash_conteudo(dados / nome) for nome in ENTRADAS}
    hashes["servicos_manuais.csv"] = hash_conteudo(catalogo)
    if arq_cep.exists():
        hashes[ENTRADA_CEP] = hash_conteudo(arq_cep)
    return {"json": ent, "catalogo": linhas, "indice_cep": indice, "hashes": hashes}


def carimbo(hashes: dict) -> str:
    base = "\n".join(f"{k}:{hashes[k]}" for k in sorted(hashes)) + f"\nversao:{VERSAO}"
    return hashlib.sha256(base.encode("utf-8")).hexdigest()[:16]


CAIXA_RIO_CLARO = (-22.65, -22.2, -47.8, -47.3)  # a mesma de pipeline/servicos.py


def coord_do_catalogo(lat, lon):
    """Mesma regra de pipeline/servicos.py (coord_valida): valida pela caixa de Rio Claro e arredonda a 5 casas.
    O catálogo gerado (catalogo_manual.json), do qual saíram os números de exposicao_distancia.json, usa essas coordenadas de 5 casas."""
    try:
        la, lo = float(str(lat).replace(",", ".")), float(str(lon).replace(",", "."))
    except (TypeError, ValueError):
        return None
    if CAIXA_RIO_CLARO[0] <= la <= CAIXA_RIO_CLARO[1] and CAIXA_RIO_CLARO[2] <= lo <= CAIXA_RIO_CLARO[3]:
        return round(la, 5), round(lo, 5)
    return None


def equipamentos(linhas: list, indice_cep: dict, escolas: list[dict]) -> list[dict]:
    """CRAS/UBS vêm do catálogo; escolas vêm da base consolidada, que preserva método, fonte e raio."""
    saida = []
    for r in linhas:
        if not str(r.get("id", "")).startswith("man-"):
            continue
        for cat in ("cras", "ubs"):
            tipo, sub = at.CATEGORIAS[cat]
            if r.get("tipo") != tipo or r.get("subtipo") != sub:
                continue
            xy_catalogo = coord_do_catalogo(r.get("lat"), r.get("lon"))
            xy_cep = at.coordenada_do_servico({"lat": None, "lon": None, "cep": r.get("cep")}, indice_cep) if not xy_catalogo else None
            cep = "".join(ch for ch in str(r.get("cep") or "") if ch.isdigit())
            item_cep = indice_cep.get(cep) if cep else None
            raio_cep = float(item_cep[2]) if xy_cep and item_cep and len(item_cep) > 2 else 0.0
            saida.append({"id": r["id"], "nome": r["nome"], "categoria": cat, "xy_catalogo": xy_catalogo,
                          "xy_cep": xy_cep, "raio_catalogo_m": 0.0, "raio_cep_m": raio_cep,
                          "metodo_localizacao": "coordenada_individual" if xy_catalogo else ("centroide_cep" if xy_cep else "pendente"),
                          "fonte_localizacao": "catalogo_manual.csv" if xy_catalogo else ("CNEFE/índice CEP" if xy_cep else None)})

    # A base consolidada é a fonte de localização escolar. Não reutilizar a cópia escolar do catálogo:
    # isso evita divergência de coordenadas e preserva os raios operacionais já calculados.
    for escola in escolas:
        local = escola.get("localizacao_mapa") or {}
        try:
            lat, lon = float(local["latitude"]), float(local["longitude"])
        except (KeyError, TypeError, ValueError):
            lat = lon = None
        metodo = str(local.get("metodo") or "pendente")
        xy = (lat, lon) if lat is not None and lon is not None and CAIXA_RIO_CLARO[0] <= lat <= CAIXA_RIO_CLARO[1] and CAIXA_RIO_CLARO[2] <= lon <= CAIXA_RIO_CLARO[3] else None
        individual = xy if metodo == "coordenada_individual" else None
        aproximada = xy if metodo == "centroide_cep" else None
        raio = float(local.get("raio_m") or 0) if aproximada else 0.0
        if raio < 0:
            raise ValueError("raio_m negativo na localização escolar %s" % (escola.get("id") or "sem ID"))
        saida.append({"id": escola["id"], "nome": escola["nome"], "categoria": "escola",
                      "xy_catalogo": individual, "xy_cep": aproximada,
                      "raio_catalogo_m": 0.0, "raio_cep_m": raio,
                      "metodo_localizacao": metodo if xy else "pendente",
                      "fonte_localizacao": local.get("fonte") if xy else None})
    return sorted(saida, key=lambda e: (e["categoria"], e["id"]))


def posicoes(equip: list[dict], cenario: str, cat: str) -> list[tuple]:
    usar_cep = ed.CENARIOS[cenario]
    pts = []
    for e in equip:
        if e["categoria"] != cat:
            continue
        if e["xy_catalogo"]:
            lat, lon = e["xy_catalogo"]
            pts.append((lat, lon, float(e.get("raio_catalogo_m") or 0)))
        elif usar_cep and e["xy_cep"]:
            lat, lon = e["xy_cep"]
            pts.append((lat, lon, float(e.get("raio_cep_m") or 0)))
    return pts


def faixa_distancia_km(distancia_km: float, raio_m: float) -> tuple[float, float]:
    """Envelope geométrico operacional, não intervalo de confiança estatístico."""
    raio_km = max(0.0, float(raio_m or 0)) / 1000.0
    return max(0.0, distancia_km - raio_km), distancia_km + raio_km


def _caixa(geom: dict) -> tuple[float, float, float, float]:
    xs, ys = [], []
    for pol in at.poligonos(geom):
        for x, y in pol[0]:
            xs.append(x)
            ys.append(y)
    return min(xs), min(ys), max(xs), max(ys)


def quantis(valores: list[float], n: int = 5) -> list[float]:
    """Pontos de corte (n-1) que repartem os valores em n grupos de tamanho parecido."""
    v = sorted(valores)
    cortes = []
    for k in range(1, n):
        idx = round(k * (len(v) - 1) / n)
        c = v[idx]
        if not cortes or c > cortes[-1]:
            cortes.append(c)
    return cortes


def gerar(dados: dict) -> dict:
    ent, hashes = dados["json"], dados["hashes"]
    geo, terr, expo = ent["setores.geojson"], ent["territorio.json"], ent["exposicao_distancia.json"]
    feicoes = sorted(geo["features"], key=lambda f: f["properties"]["setor"])
    equip = equipamentos(dados["catalogo"], dados["indice_cep"], ent["escolas_municipais.json"].get("escolas", []))

    # Posição representativa de cada setor: a mesma de pipeline/analise_territorial.py (centroide geométrico).
    setores = []
    centroides_fora = 0
    for f in feicoes:
        pr = f["properties"]
        lat, lon = at.centro(f["geometry"])
        if not at.contem(f["geometry"], lon, lat):
            centroides_fora += 1
        setores.append({"id": pr["setor"], "bairro": pr.get("bairro") or None, "pessoas": int(pr.get("pessoas") or 0),
                        "domicilios": int(pr.get("domicilios") or 0), "lat": lat, "lon": lon, "caixa": _caixa(f["geometry"]), "geom": f["geometry"]})

    # Densidade e área: valores já calculados em territorio.json (não são recalculados aqui).
    for s in setores:
        t = terr["setores"][s["id"]]
        s["area_km2"], s["densidade"] = t["a"], t["d"]

    # Indicador 4: equipamento dentro do polígono (ponto no polígono, só coordenadas do catálogo).
    # Regra de fronteira: o ponto é contado no primeiro setor, em ordem de código, que o contém; ponto fora da malha não entra em setor.
    contagem = {s["id"]: {c: 0 for c in CATEGORIAS} for s in setores}
    pos_setor = {}
    for e in equip:
        e["setor"] = None
        if not e["xy_catalogo"]:
            continue
        lat, lon = e["xy_catalogo"]
        for s in setores:
            x0, y0, x1, y1 = s["caixa"]
            if x0 <= lon <= x1 and y0 <= lat <= y1 and at.contem(s["geom"], lon, lat):
                e["setor"] = s["id"]
                contagem[s["id"]][e["categoria"]] += 1
                break
    fora = {c: sum(1 for e in equip if e["categoria"] == c and e["xy_catalogo"] and e["setor"] is None) for c in CATEGORIAS}

    # Indicadores 5 e 6: distâncias por setor e cobertura, por cenário e categoria.
    dist, dist_min, dist_max, resumo, cobertura = {}, {}, {}, {}, {}
    totais_cat = {c: sum(1 for e in equip if e["categoria"] == c) for c in CATEGORIAS}
    for cen in CENARIOS:
        dist[cen], dist_min[cen], dist_max[cen], resumo[cen], cobertura[cen] = {}, {}, {}, {}, {}
        for cat in CATEGORIAS:
            pts = posicoes(equip, cen, cat)
            cobertura[cen][cat] = {"com_coordenada": len(pts), "cadastrados": totais_cat[cat], "completo": len(pts) == totais_cat[cat] and totais_cat[cat] > 0}
            if not pts:
                dist[cen][cat] = [None] * len(setores)
                dist_min[cen][cat] = [None] * len(setores)
                dist_max[cen][cat] = [None] * len(setores)
                resumo[cen][cat] = None
                continue
            centrais, inferiores, superiores = [], [], []
            for s in setores:
                medidas = [(at.haversine_km(s["lat"], s["lon"], la, lo), raio) for la, lo, raio in pts]
                centrais.append(min(d for d, _ in medidas))
                faixas = [faixa_distancia_km(d, raio) for d, raio in medidas]
                inferiores.append(min(f[0] for f in faixas))
                superiores.append(min(f[1] for f in faixas))
            dist[cen][cat], dist_min[cen][cat], dist_max[cen][cat] = centrais, inferiores, superiores
            pares = [(d, s["pessoas"]) for d, s in zip(centrais, setores)]
            sem = [(d, s["pessoas"]) for d, s in zip(centrais, setores) if not s["bairro"]]
            resumo[cen][cat] = {"populacao_toda": ed.resumir(pares, ed.LIMIARES_KM), "setores_sem_bairro": ed.resumir(sem, ed.LIMIARES_KM)}

    divergencias = conferir(expo, resumo, cobertura)
    if divergencias:
        raise ValueError("os resultados diferem de web/dados/exposicao_distancia.json:\n  " + "\n  ".join(divergencias))

    classes = {
        "pessoas": {"rotulo": "Pessoas (população agregada)", "unidade": "pessoas por setor", "limites": quantis([s["pessoas"] for s in setores])},
        "densidade": {"rotulo": "Densidade populacional", "unidade": "pessoas por km²", "limites": LIMITES_DENSIDADE},
        "domicilios": {"rotulo": "Domicílios (agregados)", "unidade": "domicílios por setor", "limites": quantis([s["domicilios"] for s in setores])},
        "equipamentos": {"rotulo": "Equipamentos localizados no setor", "unidade": "equipamentos por setor", "limites": [1, 2, 3]},
        "distancia": {"rotulo": "Distância em linha reta até o equipamento mais próximo", "unidade": "km", "limites": FAIXAS_DISTANCIA_KM},
    }
    meta_terr, meta_expo = terr["meta"], expo["meta"]
    return {
        "meta": {
            "versao": VERSAO,
            "carimbo": carimbo(hashes),
            "fonte": "IBGE, Censo Demográfico 2022 (malha de setores censitários) e catálogo institucional do Observatório da Mulher (catalogo/servicos_manuais.csv)",
            "entradas_sha256": {k: hashes[k] for k in sorted(hashes)},
            "entradas_geradas_em": {"setores.geojson": geo["meta"]["gerado_em"], "territorio.json": meta_terr["gerado_em"],
                                    "exposicao_distancia.json": meta_expo["gerado_em"], "analise_territorial.json": ent["analise_territorial.json"]["meta"]["gerado_em"],
                                    "escolas_municipais.json": ent["escolas_municipais.json"]["meta"]["gerado_em"]},
            "auditoria_centros": {"metodo_atual": "centroide geométrico do maior componente do MultiPolygon, selecionado pelo número de vértices do anel externo; cálculo usa somente o anel externo", "setores_auditados": len(setores), "centroides_fora_do_poligono": centroides_fora, "substituicao_automatica": False, "observacao": "A comparação com ponto interno representativo e a avaliação do impacto nas distâncias permanecem pendentes. Nenhum centro foi substituído."},
            "metodo": ("Setor censitário como unidade. Pessoas e domicílios: campos agregados da malha do IBGE; a correspondência de v0001/v0002 com o dicionário da divulgação usada ainda exige conferência documental. "
                       "Densidade e área: valores de territorio.json. CRAS/UBS: catálogo institucional. Escolas: web/dados/escolas_municipais.json, campo localizacao_mapa, preservando método, precisão, fonte e raio. "
                       "Distância central: Haversine (raio 6371,0088 km) do centroide atual do setor ao equipamento elegível mais próximo. Para localizações com raio operacional r, o envelope é d_min=max(0,d-r) e d_max=d+r; para várias referências, usa-se o menor limite inferior e o menor limite superior. "
                       "O envelope é geométrico, não intervalo de confiança. Os resumos centrais continuam conferidos contra web/dados/exposicao_distancia.json."),
            "metodologia_incerteza": {"unidade_raio": "metros", "formula": "d_min=max(0,d-r); d_max=d+r",
                                     "interpretacao": "Envelope geométrico operacional, não intervalo de confiança estatístico.",
                                     "origem_raio": "Escolas: localizacao_mapa.raio_m em escolas_municipais.json. CRAS/UBS sem coordenada individual: terceiro elemento do índice CEP. Coordenadas individuais não recebem raio artificial.",
                                     "limite": "O raio aproxima a dispersão dos endereços associados ao CEP; não garante conter o equipamento nem é margem de erro validada pelo IBGE.",
                                     "comparacao": "Faixas sobrepostas não permitem afirmar qual equipamento é mais próximo."},
            "aviso_metodologico": AVISO_METODOLOGICO,
            "rotulos_cenario": ROTULOS_CENARIO,
            "rotulos_categoria": ROTULOS_CATEGORIA,
            "ressalvas": [
                "Nesta versão nenhum setor censitário é suprimido nem agregado. Os %d setores com menos de 5 pessoas ou menos de 3 domicílios (faixa conservadora da proposta de supressão e agregação) são marcados no mapa com o aviso 'população muito pequena, interprete com cautela' (decisão D4 em docs/territorial/DECISOES_DO_AUTOR.md; pode ser revista pelo autor)." % sum(1 for s in setores if s["pessoas"] < 5 or s["domicilios"] < 3),
                "O cenário com centro do CEP cadastral do equipamento é uma análise de sensibilidade: a posição é aproximada e não equivale à coordenada individual do catálogo.",
                "A auditoria geométrica encontrou %d centroides fora dos respectivos polígonos em %d setores. O centroide atual não foi substituído: a alternativa interna e o impacto nas distâncias ainda precisam ser comparados antes de qualquer mudança." % (centroides_fora, len(setores)),
                "A localização escolar é lida da base consolidada, com método, precisão, fonte e raio. Para CRAS/UBS, coordenadas individuais vêm do catálogo; referências pelo índice CEP permanecem aproximadas.",
                "Categorias com cobertura incompleta de coordenadas têm distância superestimada.",
            ],
            "conferencia": {"coincide_com_exposicao_distancia": True, "setores": len(setores), "pessoas": sum(s["pessoas"] for s in setores)},
            "equipamentos_fora_da_malha": fora,
        },
        "totais": {"setores": len(setores), "pessoas": sum(s["pessoas"] for s in setores), "domicilios": sum(s["domicilios"] for s in setores),
                   "area_km2": terr["totais"]["area_km2"], "bairros": terr["totais"]["bairros"]},
        "classes": classes,
        "cobertura": cobertura,
        "resumo_distancias": resumo,
        "equipamentos": [
            {"id": e["id"], "nome": e["nome"], "categoria": e["categoria"],
             "precisao": "catalogo" if e["xy_catalogo"] else ("centro_do_cep" if e["xy_cep"] else "pendente"),
             "metodo_localizacao": e.get("metodo_localizacao"), "fonte_localizacao": e.get("fonte_localizacao"),
             "raio_incerteza_m": round(float(e.get("raio_catalogo_m") or 0) if e["xy_catalogo"] else float(e.get("raio_cep_m") or 0), 1),
             "lat": round((e["xy_catalogo"] or e["xy_cep"] or (None, None))[0], 6) if (e["xy_catalogo"] or e["xy_cep"]) else None,
             "lon": round((e["xy_catalogo"] or e["xy_cep"] or (None, None))[1], 6) if (e["xy_catalogo"] or e["xy_cep"]) else None,
             "setor": e["setor"]}
            for e in sorted(equip, key=lambda e: (e["categoria"], e["id"]))
        ],
        "setores": [
            {"id": s["id"], "bairro": s["bairro"], "pessoas": s["pessoas"], "domicilios": s["domicilios"], "area_km2": s["area_km2"], "densidade": s["densidade"],
             "equipamentos": contagem[s["id"]],
             "distancia_km": {cen: {cat: (None if dist[cen][cat][i] is None else round(dist[cen][cat][i], 3)) for cat in CATEGORIAS} for cen in CENARIOS},
             "distancia_min_km": {cen: {cat: (None if dist_min[cen][cat][i] is None else round(dist_min[cen][cat][i], 3)) for cat in CATEGORIAS} for cen in CENARIOS},
             "distancia_max_km": {cen: {cat: (None if dist_max[cen][cat][i] is None else round(dist_max[cen][cat][i], 3)) for cat in CATEGORIAS} for cen in CENARIOS}}
            for i, s in enumerate(setores)
        ],
    }


def conferir(expo: dict, resumo: dict, cobertura: dict) -> list[str]:
    """Compara o que foi calculado com web/dados/exposicao_distancia.json. Lista vazia = tudo igual."""
    erros = []
    for cen in CENARIOS:
        for cat in CATEGORIAS:
            esperado = expo["cenarios"][cen][cat]
            if esperado["cobertura"] != cobertura[cen][cat]:
                erros.append(f"{cen}/{cat}: cobertura {cobertura[cen][cat]} difere de {esperado['cobertura']}")
            obtido = resumo[cen][cat]
            if (obtido is None) != (esperado.get("populacao_toda") is None):
                erros.append(f"{cen}/{cat}: presença do resumo difere")
            elif obtido is not None:
                for chave in ("populacao_toda", "setores_sem_bairro"):
                    if obtido[chave] != esperado[chave]:
                        erros.append(f"{cen}/{cat}/{chave}: {obtido[chave]} difere de {esperado[chave]}")
    return erros


def serializar(saida: dict) -> str:
    return json.dumps(saida, ensure_ascii=False, separators=(",", ":")) + "\n"


def main(argv: list[str]) -> int:
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:  # noqa: BLE001
        pass
    try:
        texto = serializar(gerar(carregar()))
    except ValueError as e:
        print("ERRO:", e)
        return 1
    if "--conferir" in argv:
        try:
            atual = json.loads(SAIDA.read_text(encoding="utf-8")) if SAIDA.exists() else None
        except json.JSONDecodeError:
            atual = None
        if atual != json.loads(texto):
            print("web/dados/indicadores_territoriais.json está desatualizado: rode python pipeline/territorial_indicadores.py")
            return 1
        print("indicadores_territoriais.json confere com as entradas atuais")
        return 0
    SAIDA.write_text(texto, encoding="utf-8", newline="\n")
    d = json.loads(texto)
    print("Gravado %s: %d setores, %d pessoas, carimbo %s" % (SAIDA.relative_to(RAIZ), d["totais"]["setores"], d["totais"]["pessoas"], d["meta"]["carimbo"]))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
