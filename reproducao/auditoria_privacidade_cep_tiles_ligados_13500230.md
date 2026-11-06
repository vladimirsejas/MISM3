# Auditoria de rede com CEP de equipamento público e imagens de mapa ligadas: CEP 13500-230

> Só medição e descrição. Não interpreta risco. Ambiente: Chromium em modo sem interface, servidor local em `127.0.0.1`, uma passagem por cenário.

## Como foi gerado

- Comando: `MISM3_AUDIT_CEP=13500-230 python reproducao\auditoria_privacidade_cep_tiles_ligados.py`
- Commit: `0755520d6ca18e0744801f585fec415396af965e` (ramo `auditoria/cep-medicao`); alterações fora de `reproducao/`: nenhuma
- Navegador: Chromium 156.0.8078.4 (Playwright); Node `v24.14.0`; Python `3.14.3`; sistema `Windows-11-10.0.26200-SP0`; data (UTC) 2026-11-06 15:23:33
- CEP: `13500-230` (CEP de um equipamento público). No índice `web/dados/cep_indice.json`: latitude -22.4052, longitude -47.5691, raio 1500 m.
- Mensagem de teste (não usada nestes cenários): «Preciso de ajuda fictícia para a vaga de creche da pequena Zorzalina Quimérica».

## Cenário A: Caixa da Esri marcada primeiro; depois o CEP (página inicial)

Observações: caixa_esri_marcada_ao_abrir = False; mensagem_do_site = Região aproximada pelo CEP 13500-230 (raio de cerca de 1500 m). Não é o seu endereço. Este CEP cobre uma área grande: a ordem por distância é só uma ideia.; cliques_de_zoom = 3; mapa_movido = True.

Fases (segundos desde o início): carga = 0.0, marcar_caixa = 2.6, digitar_cep = 14.9, zoom = 16.6, mover = 20.9, recarga = 27.5.

| Fase | Requisições | Locais | Externas | Esri | OpenStreetMap | Concluídas / canceladas | Texto | CEP | Coordenadas do CEP | Método ≠ GET ou corpo |
|---|---|---|---|---|---|---|---|---|---|---|
| carga | 31 | 31 | 0 | 0 | 0 | 0 / 0 | 0 | 0 | 0 | 0 |
| marcar_caixa | 30 | 0 | 30 | 30 | 0 | 0 / 30 | 0 | 0 | 0 | 0 |
| digitar_cep | 66 | 0 | 66 | 66 | 0 | 0 / 66 | 0 | 0 | 0 | 0 |
| zoom | 132 | 0 | 132 | 132 | 0 | 0 / 132 | 0 | 0 | 0 | 0 |
| mover | 12 | 0 | 12 | 12 | 0 | 0 / 12 | 0 | 0 | 0 | 0 |
| recarga | 31 | 31 | 0 | 0 | 0 | 0 / 0 | 0 | 0 | 0 | 0 |

- **Fase `marcar_caixa`, Esri:** 30 tiles; zoom 13 a 13 (por zoom: {'13': 30}); no zoom 13: canto noroeste ≈ (-22.3501, -47.6807), canto sudeste ≈ (-22.472, -47.4609); extensão ≈ 22.59 km (leste-oeste) por 13.55 km (norte-sul); ponto do CEP (índice) dentro do retângulo, a 0.67 km do centro dele.
- **Fase `digitar_cep`, Esri:** 66 tiles; zoom 11 a 13 (por zoom: {'11': 48, '13': 18}); no zoom 13: canto noroeste ≈ (-22.3094, -47.7246), canto sudeste ≈ (-22.472, -47.4609); extensão ≈ 27.11 km (leste-oeste) por 18.07 km (norte-sul); ponto do CEP (índice) dentro do retângulo, a 2.92 km do centro dele.
- **Fase `zoom`, Esri:** 132 tiles; zoom 12 a 14 (por zoom: {'12': 48, '13': 48, '14': 36}); no zoom 14: canto noroeste ≈ (-22.3501, -47.6367), canto sudeste ≈ (-22.411, -47.5049); extensão ≈ 13.56 km (leste-oeste) por 6.78 km (norte-sul); ponto do CEP (índice) dentro do retângulo, a 2.75 km do centro dele.
- **Fase `mover`, Esri:** 12 tiles; zoom 14 a 14 (por zoom: {'14': 12}); no zoom 14: canto noroeste ≈ (-22.411, -47.6367), canto sudeste ≈ (-22.4313, -47.5049); extensão ≈ 13.55 km (leste-oeste) por 2.26 km (norte-sul); ponto do CEP (índice) fora do retângulo, a 1.79 km do centro dele.

Requisições com texto, CEP ou coordenadas do CEP em URL, cabeçalho ou corpo: nenhuma.

Cabeçalhos das requisições externas concluídas: Referer n/d; com Cookie: 0.

Armazenamento (antes da recarga): localStorage `{}`; sessionStorage `{}`; IndexedDB `[]`; Cache Storage `[]`; Service Workers `[]`; cookies: document.cookie «», no contexto `[]`.

Armazenamento (depois da recarga): localStorage `{}`; sessionStorage `{}`; IndexedDB `[]`; Cache Storage `[]`; Service Workers `[]`; cookies: document.cookie «», no contexto `[]`.

## Cenário B: CEP primeiro; caixa da Esri marcada depois (página inicial)

Observações: caixa_esri_marcada_ao_abrir = False; mensagem_do_site = Região aproximada pelo CEP 13500-230 (raio de cerca de 1500 m). Não é o seu endereço. Este CEP cobre uma área grande: a ordem por distância é só uma ideia.; cliques_de_zoom = 3; mapa_movido = True.

Fases (segundos desde o início): carga = 0.0, digitar_cep = 2.3, marcar_caixa = 3.9, zoom = 5.5, mover = 12.9, recarga = 15.8.

| Fase | Requisições | Locais | Externas | Esri | OpenStreetMap | Concluídas / canceladas | Texto | CEP | Coordenadas do CEP | Método ≠ GET ou corpo |
|---|---|---|---|---|---|---|---|---|---|---|
| carga | 31 | 31 | 0 | 0 | 0 | 0 / 0 | 0 | 0 | 0 | 0 |
| digitar_cep | 0 | 0 | 0 | 0 | 0 | 0 / 0 | 0 | 0 | 0 | 0 |
| marcar_caixa | 48 | 0 | 48 | 48 | 0 | 0 / 48 | 0 | 0 | 0 | 0 |
| zoom | 132 | 0 | 132 | 132 | 0 | 0 / 132 | 0 | 0 | 0 | 0 |
| mover | 12 | 0 | 12 | 12 | 0 | 0 / 12 | 0 | 0 | 0 | 0 |
| recarga | 31 | 31 | 0 | 0 | 0 | 0 / 0 | 0 | 0 | 0 | 0 |

- **Fase `marcar_caixa`, Esri:** 48 tiles; zoom 11 a 11 (por zoom: {'11': 48}); no zoom 11: canto noroeste ≈ (-22.106, -48.1641), canto sudeste ≈ (-22.7559, -47.1094); extensão ≈ 108.4 km (leste-oeste) por 72.27 km (norte-sul); ponto do CEP (índice) dentro do retângulo, a 7.52 km do centro dele.
- **Fase `zoom`, Esri:** 132 tiles; zoom 12 a 14 (por zoom: {'12': 48, '13': 48, '14': 36}); no zoom 14: canto noroeste ≈ (-22.3501, -47.6367), canto sudeste ≈ (-22.411, -47.5049); extensão ≈ 13.56 km (leste-oeste) por 6.78 km (norte-sul); ponto do CEP (índice) dentro do retângulo, a 2.75 km do centro dele.
- **Fase `mover`, Esri:** 12 tiles; zoom 14 a 14 (por zoom: {'14': 12}); no zoom 14: canto noroeste ≈ (-22.411, -47.6367), canto sudeste ≈ (-22.4313, -47.5049); extensão ≈ 13.55 km (leste-oeste) por 2.26 km (norte-sul); ponto do CEP (índice) fora do retângulo, a 1.79 km do centro dele.

Requisições com texto, CEP ou coordenadas do CEP em URL, cabeçalho ou corpo: nenhuma.

Cabeçalhos das requisições externas concluídas: Referer n/d; com Cookie: 0.

Armazenamento (antes da recarga): localStorage `{}`; sessionStorage `{}`; IndexedDB `[]`; Cache Storage `[]`; Service Workers `[]`; cookies: document.cookie «», no contexto `[]`.

Armazenamento (depois da recarga): localStorage `{}`; sessionStorage `{}`; IndexedDB `[]`; Cache Storage `[]`; Service Workers `[]`; cookies: document.cookie «», no contexto `[]`.

## Cenário C: Mapa 'perto de mim' (OpenStreetMap): CEP, depois caixa de ruas marcada

Observações: busca_por_cep_visivel = True; resultado_com_mapa_visivel = True; mensagem_do_site = (sem mensagem); caixa_osm_marcada_antes = False; cliques_de_zoom = 3; mapa_movido = True.

Fases (segundos desde o início): carga = 0.0, digitar_cep = 2.3, marcar_caixa = 3.9, zoom = 8.0, mover = 20.6, recarga = 23.5.

| Fase | Requisições | Locais | Externas | Esri | OpenStreetMap | Concluídas / canceladas | Texto | CEP | Coordenadas do CEP | Método ≠ GET ou corpo |
|---|---|---|---|---|---|---|---|---|---|---|
| carga | 31 | 31 | 0 | 0 | 0 | 0 / 0 | 0 | 0 | 0 | 0 |
| digitar_cep | 0 | 0 | 0 | 0 | 0 | 0 / 0 | 0 | 0 | 0 | 0 |
| marcar_caixa | 15 | 0 | 15 | 0 | 15 | 0 / 15 | 0 | 0 | 0 | 0 |
| zoom | 34 | 0 | 34 | 0 | 34 | 0 / 34 | 0 | 0 | 0 | 0 |
| mover | 8 | 0 | 8 | 0 | 8 | 0 / 8 | 0 | 0 | 0 | 0 |
| recarga | 31 | 31 | 0 | 0 | 0 | 0 / 0 | 0 | 0 | 0 | 0 |

- **Fase `marcar_caixa`, OpenStreetMap:** 15 tiles; zoom 12 a 12 (por zoom: {'12': 15}); no zoom 12: canto noroeste ≈ (-22.2688, -47.8125), canto sudeste ≈ (-22.5126, -47.373); extensão ≈ 45.18 km (leste-oeste) por 27.11 km (norte-sul); ponto do CEP (índice) dentro do retângulo, a 2.92 km do centro dele.
- **Fase `zoom`, OpenStreetMap:** 34 tiles; zoom 13 a 15 (por zoom: {'13': 12, '14': 10, '15': 12}); no zoom 15: canto noroeste ≈ (-22.3806, -47.6367), canto sudeste ≈ (-22.4009, -47.5708); extensão ≈ 6.78 km (leste-oeste) por 2.26 km (norte-sul); ponto do CEP (índice) fora do retângulo, a 3.91 km do centro dele.
- **Fase `mover`, OpenStreetMap:** 8 tiles; zoom 15 a 15 (por zoom: {'15': 8}); no zoom 15: canto noroeste ≈ (-22.3806, -47.6257), canto sudeste ≈ (-22.411, -47.5598); extensão ≈ 6.78 km (leste-oeste) por 3.39 km (norte-sul); ponto do CEP (índice) dentro do retângulo, a 2.65 km do centro dele.

Requisições com texto, CEP ou coordenadas do CEP em URL, cabeçalho ou corpo: nenhuma.

Cabeçalhos das requisições externas concluídas: Referer n/d; com Cookie: 0.

Armazenamento (antes da recarga): localStorage `{}`; sessionStorage `{}`; IndexedDB `[]`; Cache Storage `[]`; Service Workers `[]`; cookies: document.cookie «», no contexto `[]`.

Armazenamento (depois da recarga): localStorage `{}`; sessionStorage `{}`; IndexedDB `[]`; Cache Storage `[]`; Service Workers `[]`; cookies: document.cookie «», no contexto `[]`.

## O que cada medida mostra (sem interpretação de risco)

- **Envio do CEP** (texto do CEP em URL, cabeçalho ou corpo): 0 requisições de 675.
- **Envio de coordenadas** (latitude e longitude do CEP em URL, cabeçalho ou corpo): 0 requisições.
- **Pedido de imagens de uma região:** 489 requisições de tiles (Esri: 432; OpenStreetMap: 57); a URL de cada tile traz zoom, coluna e linha.
- **Exposição do endereço IP ao provedor:** inerente a qualquer requisição externa; requisições externas feitas: 489.
- Requisições com método diferente de GET ou com corpo, em todos os cenários: 0.

