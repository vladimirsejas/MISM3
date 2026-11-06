# Auditoria de rede com CEP de equipamento público e imagens de mapa ligadas: CEP 13508-752

> Só medição e descrição. Não interpreta risco. Ambiente: Chromium em modo sem interface, servidor local em `127.0.0.1`, uma passagem por cenário.

## Como foi gerado

- Comando: `MISM3_AUDIT_CEP=13508-752 python reproducao\auditoria_privacidade_cep_tiles_ligados.py`
- Commit: `95a5416d6e020829ea5ace2eede3aa34238fb96c` (ramo `auditoria/cep-medicao`); alterações fora de `reproducao/`: nenhuma
- Navegador: Chromium 156.0.8078.4 (Playwright); Node `v24.14.0`; Python `3.14.3`; sistema `Windows-11-10.0.26200-SP0`; data (UTC) 2026-11-06 15:36:26
- CEP: `13508-752` (CEP de um equipamento público). No índice `web/dados/cep_indice.json`: latitude -22.2605, longitude -47.5873, raio 170 m.
- Mensagem de teste (não usada nestes cenários): «Preciso de ajuda fictícia para a vaga de creche da pequena Zorzalina Quimérica».

## Cenário A: Caixa da Esri marcada primeiro; depois o CEP (página inicial)

Observações: caixa_esri_marcada_ao_abrir = False; mensagem_do_site = Região aproximada pelo CEP 13508-752 (raio de cerca de 170 m). Não é o seu endereço.; cliques_de_zoom = 3; mapa_movido = True.

Fases (segundos desde o início): carga = 0.0, marcar_caixa = 2.6, digitar_cep = 4.3, zoom = 5.9, mover = 10.3, recarga = 13.4.

| Fase | Requisições | Locais | Externas | Esri | OpenStreetMap | Concluídas / canceladas | Texto | CEP | Coordenadas do CEP | Método ≠ GET ou corpo |
|---|---|---|---|---|---|---|---|---|---|---|
| carga | 31 | 31 | 0 | 0 | 0 | 0 / 0 | 0 | 0 | 0 | 0 |
| marcar_caixa | 30 | 0 | 30 | 30 | 0 | 30 / 0 | 0 | 0 | 0 | 0 |
| digitar_cep | 66 | 0 | 66 | 66 | 0 | 64 / 2 | 0 | 0 | 0 | 0 |
| zoom | 86 | 0 | 86 | 86 | 0 | 86 / 0 | 0 | 0 | 0 | 0 |
| mover | 12 | 0 | 12 | 12 | 0 | 12 / 0 | 0 | 0 | 0 | 0 |
| recarga | 31 | 31 | 0 | 0 | 0 | 0 / 0 | 0 | 0 | 0 | 0 |

- **Fase `marcar_caixa`, Esri:** 30 tiles; zoom 13 a 13 (por zoom: {'13': 30}); no zoom 13: canto noroeste ≈ (-22.3501, -47.6807), canto sudeste ≈ (-22.472, -47.4609); extensão ≈ 22.59 km (leste-oeste) por 13.55 km (norte-sul); ponto do CEP (índice) fora do retângulo, a 16.82 km do centro dele.
- **Fase `digitar_cep`, Esri:** 66 tiles; zoom 11 a 13 (por zoom: {'11': 48, '13': 18}); no zoom 13: canto noroeste ≈ (-22.3094, -47.7246), canto sudeste ≈ (-22.472, -47.4609); extensão ≈ 27.11 km (leste-oeste) por 18.07 km (norte-sul); ponto do CEP (índice) fora do retângulo, a 14.49 km do centro dele.
- **Fase `zoom`, Esri:** 86 tiles; zoom 12 a 14 (por zoom: {'12': 48, '13': 2, '14': 36}); no zoom 14: canto noroeste ≈ (-22.3501, -47.6367), canto sudeste ≈ (-22.411, -47.5049); extensão ≈ 13.56 km (leste-oeste) por 6.78 km (norte-sul); ponto do CEP (índice) fora do retângulo, a 13.46 km do centro dele.
- **Fase `mover`, Esri:** 12 tiles; zoom 14 a 14 (por zoom: {'14': 12}); no zoom 14: canto noroeste ≈ (-22.411, -47.6367), canto sudeste ≈ (-22.4313, -47.5049); extensão ≈ 13.55 km (leste-oeste) por 2.26 km (norte-sul); ponto do CEP (índice) fora do retângulo, a 17.95 km do centro dele.

Requisições com texto, CEP ou coordenadas do CEP em URL, cabeçalho ou corpo: nenhuma.

Cabeçalhos das requisições externas concluídas: Referer {'não enviado': 192}; com Cookie: 0.

Armazenamento (antes da recarga): localStorage `{}`; sessionStorage `{}`; IndexedDB `[]`; Cache Storage `[]`; Service Workers `[]`; cookies: document.cookie «», no contexto `[]`.

Armazenamento (depois da recarga): localStorage `{}`; sessionStorage `{}`; IndexedDB `[]`; Cache Storage `[]`; Service Workers `[]`; cookies: document.cookie «», no contexto `[]`.

## Cenário B: CEP primeiro; caixa da Esri marcada depois (página inicial)

Observações: caixa_esri_marcada_ao_abrir = False; mensagem_do_site = Região aproximada pelo CEP 13508-752 (raio de cerca de 170 m). Não é o seu endereço.; cliques_de_zoom = 3; mapa_movido = True.

Fases (segundos desde o início): carga = 0.0, digitar_cep = 2.4, marcar_caixa = 4.0, zoom = 5.5, mover = 9.8, recarga = 12.8.

| Fase | Requisições | Locais | Externas | Esri | OpenStreetMap | Concluídas / canceladas | Texto | CEP | Coordenadas do CEP | Método ≠ GET ou corpo |
|---|---|---|---|---|---|---|---|---|---|---|
| carga | 31 | 31 | 0 | 0 | 0 | 0 / 0 | 0 | 0 | 0 | 0 |
| digitar_cep | 0 | 0 | 0 | 0 | 0 | 0 / 0 | 0 | 0 | 0 | 0 |
| marcar_caixa | 48 | 0 | 48 | 48 | 0 | 48 / 0 | 0 | 0 | 0 | 0 |
| zoom | 132 | 0 | 132 | 132 | 0 | 132 / 0 | 0 | 0 | 0 | 0 |
| mover | 12 | 0 | 12 | 12 | 0 | 12 / 0 | 0 | 0 | 0 | 0 |
| recarga | 31 | 31 | 0 | 0 | 0 | 0 / 0 | 0 | 0 | 0 | 0 |

- **Fase `marcar_caixa`, Esri:** 48 tiles; zoom 11 a 11 (por zoom: {'11': 48}); no zoom 11: canto noroeste ≈ (-22.106, -48.1641), canto sudeste ≈ (-22.7559, -47.1094); extensão ≈ 108.4 km (leste-oeste) por 72.27 km (norte-sul); ponto do CEP (índice) dentro do retângulo, a 19.62 km do centro dele.
- **Fase `zoom`, Esri:** 132 tiles; zoom 12 a 14 (por zoom: {'12': 48, '13': 48, '14': 36}); no zoom 14: canto noroeste ≈ (-22.3501, -47.6367), canto sudeste ≈ (-22.411, -47.5049); extensão ≈ 13.56 km (leste-oeste) por 6.78 km (norte-sul); ponto do CEP (índice) fora do retângulo, a 13.46 km do centro dele.
- **Fase `mover`, Esri:** 12 tiles; zoom 14 a 14 (por zoom: {'14': 12}); no zoom 14: canto noroeste ≈ (-22.411, -47.6367), canto sudeste ≈ (-22.4313, -47.5049); extensão ≈ 13.55 km (leste-oeste) por 2.26 km (norte-sul); ponto do CEP (índice) fora do retângulo, a 17.95 km do centro dele.

Requisições com texto, CEP ou coordenadas do CEP em URL, cabeçalho ou corpo: nenhuma.

Cabeçalhos das requisições externas concluídas: Referer {'não enviado': 192}; com Cookie: 0.

Armazenamento (antes da recarga): localStorage `{}`; sessionStorage `{}`; IndexedDB `[]`; Cache Storage `[]`; Service Workers `[]`; cookies: document.cookie «», no contexto `[]`.

Armazenamento (depois da recarga): localStorage `{}`; sessionStorage `{}`; IndexedDB `[]`; Cache Storage `[]`; Service Workers `[]`; cookies: document.cookie «», no contexto `[]`.

## Cenário C: Mapa 'perto de mim' (OpenStreetMap): CEP, depois caixa de ruas marcada

Observações: busca_por_cep_visivel = True; resultado_com_mapa_visivel = True; mensagem_do_site = (sem mensagem); caixa_osm_marcada_antes = False; cliques_de_zoom = 3; mapa_movido = True.

Fases (segundos desde o início): carga = 0.0, digitar_cep = 2.4, marcar_caixa = 4.0, zoom = 5.5, mover = 9.8, recarga = 12.7.

| Fase | Requisições | Locais | Externas | Esri | OpenStreetMap | Concluídas / canceladas | Texto | CEP | Coordenadas do CEP | Método ≠ GET ou corpo |
|---|---|---|---|---|---|---|---|---|---|---|
| carga | 31 | 31 | 0 | 0 | 0 | 0 / 0 | 0 | 0 | 0 | 0 |
| digitar_cep | 0 | 0 | 0 | 0 | 0 | 0 / 0 | 0 | 0 | 0 | 0 |
| marcar_caixa | 18 | 0 | 18 | 0 | 18 | 18 / 0 | 0 | 0 | 0 | 0 |
| zoom | 40 | 0 | 40 | 0 | 40 | 40 / 0 | 0 | 0 | 0 | 0 |
| mover | 0 | 0 | 0 | 0 | 0 | 0 / 0 | 0 | 0 | 0 | 0 |
| recarga | 31 | 31 | 0 | 0 | 0 | 0 / 0 | 0 | 0 | 0 | 0 |

- **Fase `marcar_caixa`, OpenStreetMap:** 18 tiles; zoom 11 a 11 (por zoom: {'11': 18}); no zoom 11: canto noroeste ≈ (-22.106, -48.1641), canto sudeste ≈ (-22.5937, -47.1094); extensão ≈ 108.47 km (leste-oeste) por 54.23 km (norte-sul); ponto do CEP (índice) dentro do retângulo, a 11.16 km do centro dele.
- **Fase `zoom`, OpenStreetMap:** 40 tiles; zoom 12 a 14 (por zoom: {'12': 10, '13': 12, '14': 18}); no zoom 14: canto noroeste ≈ (-22.3094, -47.6587), canto sudeste ≈ (-22.3704, -47.5269); extensão ≈ 13.56 km (leste-oeste) por 6.78 km (norte-sul); ponto do CEP (índice) fora do retângulo, a 8.85 km do centro dele.

Requisições com texto, CEP ou coordenadas do CEP em URL, cabeçalho ou corpo: nenhuma.

Cabeçalhos das requisições externas concluídas: Referer {'não enviado': 58}; com Cookie: 0.

Armazenamento (antes da recarga): localStorage `{}`; sessionStorage `{}`; IndexedDB `[]`; Cache Storage `[]`; Service Workers `[]`; cookies: document.cookie «», no contexto `[]`.

Armazenamento (depois da recarga): localStorage `{}`; sessionStorage `{}`; IndexedDB `[]`; Cache Storage `[]`; Service Workers `[]`; cookies: document.cookie «», no contexto `[]`.

## O que cada medida mostra (sem interpretação de risco)

- **Envio do CEP** (texto do CEP em URL, cabeçalho ou corpo): 0 requisições de 630.
- **Envio de coordenadas** (latitude e longitude do CEP em URL, cabeçalho ou corpo): 0 requisições.
- **Pedido de imagens de uma região:** 444 requisições de tiles (Esri: 386; OpenStreetMap: 58); a URL de cada tile traz zoom, coluna e linha.
- **Exposição do endereço IP ao provedor:** inerente a qualquer requisição externa; requisições externas feitas: 444.
- Requisições com método diferente de GET ou com corpo, em todos os cenários: 0.

