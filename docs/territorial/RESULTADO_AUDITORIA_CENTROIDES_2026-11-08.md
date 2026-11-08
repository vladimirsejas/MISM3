# Resultado da auditoria de sensibilidade dos centroides — 08/11/2026

## Execução

- Fonte geográfica: web/dados/setores.geojson.
- Fonte dos equipamentos: web/dados/indicadores_territoriais.json.
- Commit de referência dos dados: c30ee8fb8d1ee45af40cf80b5a9097670a7d82bf.
- Setores processados: 408.
- Centroides atuais fora dos respectivos polígonos: 9.
- Setores cujo centroide já era interno e foi preservado: 399.

## Método comparado

O método atual foi reproduzido a partir de pipeline/analise_territorial.py, função centro().

A alternativa centroide_com_correcao_interna_minima_v1 aplica esta regra:

1. Se o centroide atual está dentro do polígono, mantém exatamente a coordenada atual.
2. Se está fora, procura um ponto interno em linhas horizontais entre os vértices, descontando os buracos.
3. Entre os candidatos internos, seleciona um ponto de menor distância geodésica ao centroide atual.
4. Valida o ponto final contra a geometria completa.

A alternativa não é um novo centroide geométrico nem uma medida da distribuição populacional. É uma correção mínima candidata para os nove pontos externos. Nenhum arquivo de produção foi alterado.

## Resultado geométrico

| Medida | Resultado |
|---|---:|
| Setores auditados | 408 |
| Centroides externos | 9 |
| Centroides internos preservados | 399 |
| Deslocamento mediano considerando os 408 setores | 0 m |
| Deslocamento P90 considerando os 408 setores | 0 m |
| Maior deslocamento entre os nove corrigidos | 61,546 m |
| Menor deslocamento entre os nove corrigidos | 7,209 m |

O deslocamento mediano e o P90 gerais são zero porque os 399 centroides já internos permanecem inalterados.

## Impacto nas distâncias — todos os 408 setores

Valores de variação absoluta entre a distância calculada com o centroide atual e a calculada com a alternativa. As distâncias são em linha reta.

| Cenário | Categoria | Mediana absoluta | P90 absoluto | Máximo absoluto | Setores com alteração acima de 10 m |
|---|---|---:|---:|---:|---:|
| coordenadas_do_catalogo | CRAS | 0 m | 0 m | 44,409 m | 5 |
| coordenadas_do_catalogo | UBS | 0 m | 0 m | 44,474 m | 5 |
| coordenadas_do_catalogo | Escola | 0 m | 0 m | 54,149 m | 6 |
| com_centro_do_cep | CRAS | 0 m | 0 m | 44,409 m | 5 |
| com_centro_do_cep | UBS | 0 m | 0 m | 44,474 m | 5 |
| com_centro_do_cep | Escola | 0 m | 0 m | 54,036 m | 6 |

## Resultado individual dos nove setores

As variações abaixo são assinadas: valor negativo significa que a distância alternativa diminuiu; valor positivo significa que aumentou.

| Setor | Deslocamento do ponto | Δ CRAS | Δ UBS | Δ Escola — catálogo | Δ Escola — CEP |
|---|---:|---:|---:|---:|---:|
| 354390705000026 | 35,241 m | -23,321 m | -32,854 m | +23,384 m | +14,190 m |
| 354390705000165 | 38,100 m | +10,864 m | -6,604 m | -31,345 m | +3,908 m |
| 354390705000339 | 61,546 m | +19,157 m | -26,556 m | +1,097 m | +22,417 m |
| 354390705000432 | 44,755 m | -44,409 m | -42,212 m | -33,866 m | -33,866 m |
| 354390705000460 | 42,224 m | +3,702 m | +24,596 m | -11,799 m | +40,467 m |
| 354390705000524 | 7,209 m | -5,886 m | -7,045 m | -6,410 m | -7,062 m |
| 354390705000529 | 7,792 m | +6,935 m | +6,616 m | -1,830 m | -1,830 m |
| 354390705000530 | 21,119 m | -3,827 m | -7,273 m | +20,076 m | +20,076 m |
| 354390705000541 | 55,546 m | -43,136 m | +44,474 m | +54,149 m | +54,036 m |

## Decisão técnica nesta etapa

A primeira alternativa experimental, que escolhia a maior corda horizontal de cada polígono, foi descartada. Ela deslocava também centroides que já estavam dentro dos polígonos e produzia alterações de quilômetros em setores sem necessidade de correção.

A alternativa atual evita esse efeito: preserva os 399 pontos válidos e limita a correção aos nove pontos externos. Os maiores impactos observados nas distâncias ficaram abaixo de 55 metros.

**Conclusão:** a correção mínima é uma candidata tecnicamente mais conservadora para tratar os nove centroides externos. Ainda assim, não foi promovida a método oficial nem aplicada aos indicadores de produção. A adoção depende de decisão metodológica explícita e da revisão do algoritmo em relação à geometria simplificada disponível.

## Limitações

- A distância é geodésica em linha reta, não percurso por ruas ou tempo de deslocamento.
- O ponto interno é calculado sobre a geometria GeoJSON versionada e simplificada.
- A escolha de ponto interno não representa a distribuição de moradores dentro do setor.
- O resultado não valida acesso efetivo aos serviços.
- Os números devem ser reproduzidos pelo comando: python pipeline/auditoria_centroides.py.
