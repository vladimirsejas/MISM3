import escolas_municipais as em


def test_gerador_nao_vincula_matriculas_ou_turmas_a_escolas():
    dados = em.carregar()
    assert dados["escolas"]
    for escola in dados["escolas"]:
        assert "censo_escolar_2025" not in escola
        assert not any("matricula" in chave.lower() or "turma" in chave.lower() for chave in escola)
    assert "inep_municipais_sem_vinculo" not in dados["meta"]
    assert "censo_escolar_agregado_por_rede" in dados["meta"]["fontes"]
