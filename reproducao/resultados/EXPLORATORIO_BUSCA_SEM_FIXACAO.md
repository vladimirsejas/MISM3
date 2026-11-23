# Busca do sistema completo sem a fixação de serviços (exploratório)

**Aviso:** análise exploratória, posterior ao teste congelado e não pré-especificada. Não substitui nem altera o resultado principal.

## O que cada variante faz

Reexecução do código congelado (commit `4bf1676`, branch `backup-main-antiga-4bf1676`), lido com `git show` e executado em memória; `web/` do repositório não foi tocado. Condição `completo` (regras e modelo de necessidades, detector de perigo, detector de escopo, índice com palavras, letras e LSA).

- **(i) Busca pura:** os 3 primeiros de `motor.pontuar(texto, {})` ordenados pela nota, em todo o índice (serviços, seções, canais, ferramentas, áreas e classes). Ignora fixação, filtro de escopo, abstenção, corte, diversidade e cartões de reforço; nunca abstém.
- **(ii) Pipeline com fixação desligada:** `Perigo.avaliar` é embrulhado em memória para devolver `pins = []`. O alerta (nível, tipos, telefones) e o `urgente` do nível 2 ficam como estão, então o alerta completo continua ignorando o filtro de escopo e a abstenção. Todo o resto do pipeline fica como está (abstenção, corte, diversidade, reforços).
- **Verificação:** o pipeline sem alteração reproduziu o CSV congelado (alerta, abstenção e top-3) sem divergência e deu 76/140. TF-IDF e BM25 reproduziram 35/140 e 38/140.
- Bootstrap pareado por mensagem, 10000 reamostragens, semente 20261106, `conjunto_v1.bootstrap_pareado`, percentis 2,5% e 97,5%, sobre as 140 mensagens.

## SA@3 (acertos no top-3 / mensagens orientáveis com destino esperado)

| Grupo | (i) busca pura | (ii) sem fixação | TF-IDF | BM25 | Sistema completo |
|---|---|---|---|---|---|
| total | 46/140 (32.9%) | 42/140 (30.0%) | 35/140 (25.0%) | 38/140 (27.1%) | 76/140 (54.3%) |
| risco | 17/90 (18.9%) | 15/90 (16.7%) | 12/90 (13.3%) | 12/90 (13.3%) | 49/90 (54.4%) |
| sem risco | 29/50 (58.0%) | 27/50 (54.0%) | 23/50 (46.0%) | 26/50 (52.0%) | 27/50 (54.0%) |

## Diferenças pareadas (variante menos referência; pontos percentuais; IC 95%)

| Variante | Referência | Diferença | IC 95% |
|---|---|---|---|
| (i) busca pura | TF-IDF | +7.86 | [0.71; 15.00] |
| (i) busca pura | BM25 | +5.71 | [-0.71; 12.86] |
| (i) busca pura | sistema completo | -21.43 | [-29.29; -13.57] |
| (ii) pipeline sem fixação | TF-IDF | +5.00 | [-2.14; 12.86] |
| (ii) pipeline sem fixação | BM25 | +2.86 | [-4.29; 10.00] |
| (ii) pipeline sem fixação | sistema completo | -24.29 | [-31.43; -17.14] |

Abstenções em mensagens orientáveis (de 140): sistema completo 16; (i) 0; (ii) 16.

