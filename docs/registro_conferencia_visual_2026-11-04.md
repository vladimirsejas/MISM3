# Registro do trabalho de 04/11/2026: localização dos serviços e preparação do artigo

Este registro existe para que quem retomar o projeto, inclusive uma nova sessão de trabalho com um assistente de IA, saiba exatamente o que foi decidido e o que falta, sem refazer nem pedir de novo o que já foi entregue.

## O que foi feito

O catálogo de serviços do MISM3 tinha poucas coordenadas, e a análise territorial depende delas. O script de geocodificação a partir do CNEFE, rodado em outubro, resolveu 12 de 150 serviços com confiança alta e não encontrou correspondência para quase todas as unidades de saúde e para os CRAS. O autor conferiu então, no Google Maps (satélite e Street View), as 22 unidades de saúde e 4 CRAS, e enviou as capturas. Treze coordenadas de UBS e USF foram aplicadas ao catálogo no commit 056ea78, e a documentação das evidências e da rodada automática foi registrada no commit f8e064d. Em 04/11/2026 foi também adicionada a análise de exposição à distância (`pipeline/exposicao_distancia.py`) e um `pytest.ini`, no commit 9586749, com 217 testes aprovados.

## Decisões que não devem ser reabertas

O autor já enviou todas as fotografias necessárias para as unidades listadas; não se deve pedir novas capturas dessas unidades. O trabalho não tem participantes humanos e não passará por comitê de ética: não coleta dados pessoais, não faz teste com usuárias nem com colegas e não cita falas ou avaliações de pessoas como resultado. A declaração ética deve descrever apenas o que foi feito, sem afirmar que houve dispensa. As capturas não devem mostrar pessoas, e as originais completas, que exibem abas e outros dados do computador do autor, ficam fora do repositório. O mapa de unidades de saúde e de CRAS é tratado como encerrado, salvo as pendências listadas abaixo.

## Coordenadas aplicadas ao catálogo

As coordenadas dos quatro CRAS (Mãe Preta, Jardim Brasília, Bom Sucesso e Terra Nova) e a correção da USF Palmeiras (de -22.411063, -47.564642 para -22.430193, -47.583958, uma diferença de cerca de 2,9 km) já constam do catálogo. Por último foram aplicadas, a partir de `catalogo/conferencia_visual_usf_pendentes_2026-11-04.csv`, as coordenadas das três USF que faltavam, e cada alteração está registrada em `catalogo/localizacao_registro.csv`:

- USF Ajapi: -22.281236, -47.548217, confiança alta. O Google Maps lista a unidade em R. 4, 341, com o mesmo telefone do catálogo, e o Street View mostra a placa da unidade. A coordenada anterior do MISM 1 ficava a cerca de 183 m.
- USF Jardim Progresso: -22.377894, -47.574402, confiança média. O Maps lista "USF Progresso" em Av. M 37, 1909 (o catálogo diz Av. M-35, 1909; o endereço do catálogo não foi alterado). Há uma entrada vizinha ("USF Jd Progresso José Carlos da Silva", a cerca de 45 m) e uma entrada "USF Jardim Progresso." em Av. M 31, 1881, marcada como permanentemente fechada, a cerca de 130 m. Não há Street View da fachada atual.
- USF Brasília: -22.430726, -47.581693, confiança média. O Maps lista "USF Jardim Brasília Neusa Maria Mortari" em Estr. dos Costas, 1281, e o catálogo registra o número 1349 para a mesma estrada; o número não foi alterado. A placa da unidade não aparece no Street View.

## O que ainda falta

Estas pendências não bloqueiam a análise territorial:

- Endereço do CRAS Terra Nova: o catálogo diz Rua Marco Antonio Padula, 1043, e o Google Maps mostra Av. Marginal Jn, 75; deve ser revisado com a Prefeitura.
- CEP da USF Palmeiras: conferir o CEP 13500210.
- Telefones das USF Santa Elisa e Brasília: não foram verificados.
- Fonte e licença do arquivo `mapaRioClaroUSF.geojson` do MISM 1, de origem e data desconhecidas, que serviu de referência de 21 unidades de saúde.
- Distâncias em linha reta, não por ruas; os setores sem bairro são tratados à parte.
- Repositório público: as imagens do Google Maps não vão ao GitHub (termos de uso do Google); só o índice e as coordenadas vão.

As distâncias de `web/dados/exposicao_distancia.json` e `web/dados/analise_territorial.json` já foram recalculadas com todos os serviços (CRAS 6/6, UBS e USF 22/22, escolas 59/68 no cenário com o centro do CEP).

## Plano para o artigo

O artigo é técnico, sem participantes. A avaliação do orientador e do detector de perigo hoje não é totalmente independente (parte das frases foi escrita pela equipe, as reservas 4 a 13, 15 e 16 não são independentes e houve ajuste sobre os mesmos casos). Para ganhar robustez, o plano é construir um conjunto de teste congelado, escrito pelo autor a partir de documentos públicos, relatar linhas de base simples, intervalos de confiança e a lista de falsos positivos e falsos negativos do detector de perigo, e apresentar a análise territorial em dois cenários (só coordenadas conferidas e com o centro do CEP como complemento). Falta ainda corrigir a inconsistência da documentação sobre os mapas Esri e OpenStreetMap, congelar um commit com etiqueta e depositar a versão no Zenodo. O manuscrito em rascunho está no documento "MISM3 – Manuscrito técnico (rascunho)", e as referências bibliográficas sugeridas na pesquisa preliminar ainda precisam ser verificadas em fontes primárias antes de qualquer citação.
