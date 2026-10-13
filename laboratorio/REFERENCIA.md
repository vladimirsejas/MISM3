# Referência congelada (antes do laboratório)

- **Commit:** `67e025a6bce5eb7c4ad1fd534746e5397210c1ea` (tag local `mism3-referencia-pre-lab`).
- **Testes Python:** 211 passam (`PYTHONPATH=pipeline python -m pytest pipeline/tests -q`).
- **Testes JavaScript:** os 17 arquivos de `web/tests/` passam.
- **Avaliação:** `python avaliacao/avaliar.py v2 --conjunto todos` roda; 427 perguntas em 5 conjuntos (desenvolvimento 91, teste 119, independente 104, reserva 37, final 76).
- **Pontos fracos já medidos no conjunto final:** 1 perigo não detectado (29/30), `assistencia` 33%, abstenção fora de escopo 67%.
- **Integridade:** `protegidos.sha256` guarda o hash de 199 arquivos de `web/`, `catalogo/`, `pipeline/`, `avaliacao/`, `dados/`, `docs/`, `.github/`, `README.md` e `requirements.txt`. Conferir: `python laboratorio/verificar_intacto.py`.

Para desfazer tudo: apagar a pasta `laboratorio/`. O site e os modelos não dependem dela.
