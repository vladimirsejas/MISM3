import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import verificar_catalogo as v  # noqa: E402

PAGINA = b"""<html><script>var x='3525-9999'</script><body>
<p>PAT: <b>(19) 3525-2785</b></p><p>Qualificacao: (19) 3532-2255 | 3524-4897 | 98912-1015</p></body></html>"""


def test_telefones_ultimos_8_digitos():
    assert v.telefones("(19) 9 9439-4433 (WhatsApp)") == ["94394433"]
    assert v.telefones("(19) 3532-2255 | 3524-4897 | 98912-1015") == ["35322255", "35244897", "89121015"]
    assert v.telefones("") == []


def test_achado_na_pagina_ignora_script():
    texto = v.texto_da_pagina(PAGINA)
    assert v.verifica({"telefone": "(19) 3525-2785"}, texto) == []
    assert v.verifica({"telefone": "(19) 3532-2255 | 98912-1015"}, texto) == []
    # numero que so existe dentro de <script> nao conta
    assert v.verifica({"telefone": "3525-9999"}, texto) != []


def test_numero_errado_e_apontado():
    texto = v.texto_da_pagina(PAGINA)
    probs = v.verifica({"telefone": "(19) 3525-2786"}, texto)
    assert len(probs) == 1 and "3525-2786" in probs[0]
