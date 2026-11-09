import privacidade_territorial as p


def test_criterio_d4_usa_ou_e_respeita_os_limites():
    assert p.setor_suprimido({"pessoas": 4, "domicilios": 20})
    assert p.setor_suprimido({"pessoas": 20, "domicilios": 2})
    assert not p.setor_suprimido({"pessoas": 5, "domicilios": 3})
    assert p.setor_suprimido({"pessoas": 100, "domicilios": 100, "suprimido_privacidade": True})


def test_ausencia_ou_valor_invalido_suprime_por_cautela():
    assert p.setor_suprimido({"pessoas": None, "domicilios": 10})
    assert p.setor_suprimido({"pessoas": 10, "domicilios": None})
    assert p.setor_suprimido({"pessoas": "desconhecido", "domicilios": 10})
    assert p.setor_suprimido({"pessoas": 10})


def test_geojson_remove_contagens_e_derivados_sem_apagar_geometria():
    geo = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": {
                    "setor": "pequeno",
                    "pessoas": 4,
                    "domicilios": 1,
                    "densidade": 900,
                    "pessoas_por_domicilio": 4,
                    "dist_creche": 0.2,
                    "dist_cras": 0.4,
                    "dist_ubs": 0.5,
                    "dist_escola": 0.6,
                    "suprimido_privacidade": False,
                },
                "geometry": {"type": "Point", "coordinates": [0, 0]},
            },
            {
                "type": "Feature",
                "properties": {"setor": "normal", "pessoas": 100, "domicilios": 40},
                "geometry": {"type": "Point", "coordinates": [1, 1]},
            },
        ],
    }
    resultado = p.sanitizar_geojson(geo)
    pequeno, normal = resultado["features"]
    assert pequeno["properties"]["pessoas"] is None
    assert pequeno["properties"]["domicilios"] is None
    assert pequeno["properties"]["suprimido_privacidade"] is True
    assert pequeno["properties"]["densidade"] is None
    assert pequeno["properties"]["pessoas_por_domicilio"] is None
    assert pequeno["properties"]["dist_creche"] is None
    assert pequeno["properties"]["dist_cras"] is None
    assert pequeno["properties"]["dist_ubs"] is None
    assert pequeno["properties"]["dist_escola"] is None
    assert pequeno["geometry"] == {"type": "Point", "coordinates": [0, 0]}
    assert normal["properties"]["pessoas"] == 100
    assert normal["properties"]["domicilios"] == 40
