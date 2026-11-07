"""Gera a base integrada das escolas municipais de Rio Claro para o MISM3.

Combina, sem sobrescrever as fontes:
- catalogo/servicos_manuais.csv (cadastro e coordenadas individuais disponíveis);
- catalogo/inep_escolas.csv (vínculo controlado catálogo -> INEP);
- web/dados/oferta_educacao_infantil.json (Censo Escolar 2025);
- web/dados/cep_indice.json (referência agregada do CNEFE).

Uso: python pipeline/escolas_municipais.py
Saída: web/dados/escolas_municipais.json

Centros de CEP são mantidos como referência agregada, nunca como coordenada individual
da escola. Matrículas não são vagas nem demanda.
"""
from __future__ import annotations

import csv
import json
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]
CATALOGO = RAIZ / "catalogo"
DADOS = RAIZ / "web" / "dados"
SAIDA = DADOS / "escolas_municipais.json"


def ler_csv(caminho: Path) -> list[dict]:
    with caminho.open(encoding="utf-8-sig", newline="") as arquivo:
        return list(csv.DictReader(arquivo))


def carregar() -> dict:
    cadastro = [
        r for r in ler_csv(CATALOGO / "servicos_manuais.csv")
        if r.get("tipo") == "creche" and r.get("subtipo") == "escola_municipal"
    ]
    vinculos = {r["id"]: r for r in ler_csv(CATALOGO / "inep_escolas.csv")}
    oferta = json.loads((DADOS / "oferta_educacao_infantil.json").read_text(encoding="utf-8"))
    indice_cep = json.loads((DADOS / "cep_indice.json").read_text(encoding="utf-8")).get("ceps", {})
    por_inep = {e["inep"]: e for e in oferta.get("escolas", [])}

    escolas = []
    codigos_vinculados = set()
    for r in cadastro:
        vinculo = vinculos.get(r["id"])
        censo = por_inep.get(vinculo["inep"]) if vinculo else None
        if vinculo:
            codigos_vinculados.add(vinculo["inep"])

        coordenada = None
        if r.get("lat") and r.get("lon"):
            coordenada = {
                "latitude": float(r["lat"]),
                "longitude": float(r["lon"]),
                "fonte": "catalogo_manual",
            }

        cep = "".join(ch for ch in (r.get("cep") or "") if ch.isdigit())
        referencia = indice_cep.get(cep) if cep else None
        referencia_cep = None
        if referencia:
            referencia_cep = {
                "latitude": referencia[0],
                "longitude": referencia[1],
                "raio_m": referencia[2],
                "setor_censitario": referencia[3],
                "quantidade_enderecos": referencia[4],
                "natureza": "centroide_agregado_do_CNEFE_nao_e_coordenada_da_escola",
            }

        # Localização operacional única: prioriza coordenada individual; na ausência,
        # usa o centro do CEP do CNEFE, sempre identificando que é uma referência aproximada.
        localizacao_mapa = None
        if coordenada:
            localizacao_mapa = {
                "latitude": coordenada["latitude"],
                "longitude": coordenada["longitude"],
                "metodo": "coordenada_individual",
                "precisao": "individual",
                "fonte": "catalogo_manual",
            }
        elif referencia_cep:
            localizacao_mapa = {
                "latitude": referencia_cep["latitude"],
                "longitude": referencia_cep["longitude"],
                "metodo": "centroide_cep",
                "precisao": "aproximada",
                "raio_m": referencia_cep["raio_m"],
                "fonte": "CNEFE - Censo Demografico 2022",
            }

        escolas.append({
            "id": r["id"],
            "nome": r["nome"],
            "endereco": r.get("endereco") or None,
            "cep": cep or None,
            "telefone": r.get("telefone") or None,
            "horario": r.get("horario") or None,
            "fonte_cadastro": r.get("fonte") or None,
            "fonte_url": r.get("fonte_url") or None,
            "verificado_em": r.get("verificado_em") or None,
            "coordenada_equipamento": coordenada,
            "referencia_cep": referencia_cep,
            "localizacao_mapa": localizacao_mapa,
            "vinculo_inep": ({
                "codigo": vinculo["inep"],
                "nome_censo": vinculo["nome_censo"],
                "metodo": vinculo["metodo"],
            } if vinculo else None),
            "censo_escolar_2025": ({
                campo: censo[campo] for campo in (
                    "rede", "localizacao", "oferece_creche", "oferece_pre_escola",
                    "matriculas_creche", "matriculas_0_a_3_anos",
                    "matriculas_creche_tempo_integral", "matriculas_pre_escola",
                    "turmas_creche", "turmas_pre_escola",
                )
            } if censo else None),
            "observacao_catalogo": r.get("observacao") or None,
        })

    sem_vinculo = [
        {"codigo": e["inep"], "nome_censo": e["nome"],
         "observacao": "Sem vínculo com registro do catálogo; não associar automaticamente."}
        for e in oferta.get("escolas", [])
        if e.get("rede") == "municipal" and e["inep"] not in codigos_vinculados
    ]

    return {
        "meta": {
            "titulo": "Base integrada de escolas municipais de Rio Claro",
            "gerado_em": "2026-11-07",
            "municipio": "Rio Claro/SP",
            "fontes": {
                "cadastro": "catalogo/servicos_manuais.csv",
                "vinculos_inep": "catalogo/inep_escolas.csv",
                "censo_escolar": "web/dados/oferta_educacao_infantil.json",
                "referencia_cep": "web/dados/cep_indice.json",
            },
            "contagens": {
                "escolas_catalogadas": len(escolas),
                "com_coordenada_individual": sum(bool(e["coordenada_equipamento"]) for e in escolas),
                "com_referencia_cep": sum(bool(e["referencia_cep"]) for e in escolas),
                "localizadas_por_coordenada_individual": sum(bool(e["localizacao_mapa"] and e["localizacao_mapa"]["metodo"] == "coordenada_individual") for e in escolas),
                "localizadas_por_cep": sum(bool(e["localizacao_mapa"] and e["localizacao_mapa"]["metodo"] == "centroide_cep") for e in escolas),
                "sem_localizacao_mapa": sum(not e["localizacao_mapa"] for e in escolas),
                "vinculadas_inep": sum(bool(e["vinculo_inep"]) for e in escolas),
                "sem_vinculo_inep": sum(not e["vinculo_inep"] for e in escolas),
                "municipais_no_censo_infantil": sum(e.get("rede") == "municipal" for e in oferta.get("escolas", [])),
                "registros_inep_municipais_sem_vinculo": len(sem_vinculo),
            },
            "interpretacao": "O conjunto consolida cadastro, georreferenciamento disponível e indicadores do Censo Escolar sem confundir as naturezas das fontes.",
            "limites": [
                "Matrículas e turmas não representam vagas disponíveis, demanda reprimida ou fila de espera.",
                "A localização operacional prioriza coordenada individual; na ausência, usa referência do centro de CEP com método e raio explicitados.",
                "O centro de CEP é uma aproximação territorial agregada, não a coordenada comprovada do prédio escolar.",
                "A referência de CEP representa distribuição agregada de endereços CNEFE e não comprova a localização física da escola.",
                "Registros sem vínculo INEP permanecem sem indicadores escolares associados.",
                "A ausência de coordenada individual não significa ausência de endereço cadastrado.",
            ],
            "inep_municipais_sem_vinculo": sem_vinculo,
        },
        "escolas": escolas,
    }


def main() -> None:
    dados = carregar()
    SAIDA.write_text(json.dumps(dados, ensure_ascii=False, indent=2), encoding="utf-8")
    print("Base escolar gravada em %s" % SAIDA)
    print(json.dumps(dados["meta"]["contagens"], ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
