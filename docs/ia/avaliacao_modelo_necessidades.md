# Avaliação do modelo de necessidades

Gerado por `pipeline/treinar_necessidades.py` em 2026-10-11. **Leia com as limitações abaixo.**

## Limitações (importantes)

- As frases de treino e de teste foram **escritas pela equipe**, não vêm de mulheres reais. O desempenho com pessoas de verdade pode ser **menor**.
- O conjunto é **pequeno** (325 frases). Os números têm margem de erro grande e servem para comparar o modelo com as regras, não para prometer desempenho.
- As **regras** de palavras-chave foram escritas pela mesma equipe, olhando para frases parecidas; isso as favorece nesta comparação.
- O modelo **não decide direitos nem diagnostica**: só sugere áreas do site. Em violência, o sistema soma regras e modelo para não deixar de alertar.

## Como foi avaliado

- **Validação cruzada em 5 partes (325 frases):** cada frase é prevista por um modelo que nunca a viu (o treino inclui variações sem acento e com letra esquecida).
- **Teste independente (52 frases):** frases dos testes antigos do projeto, escritas antes de o modelo existir. Elas foram escritas para as regras, então as favorecem.
- **Regras + modelo:** é o que o site usa (a união dos dois, no máximo 3 sugestões). O modelo exportado é treinado com todas as frases.

### Validação cruzada

325 frases. Micro-média, **precisão / recall / F1 / acerto exato**:

| Sistema | Precisão | Recall | F1 | Acerto exato |
|---|---|---|---|---|
| Regras de palavras-chave | 76% | 56% | 65% | 47% |
| Modelo de aprendizado de máquina | 74% | 63% | 68% | 53% |
| Regras + modelo (usado no site) | 71% | 81% | 75% | 56% |

| Necessidade | Frases | Regras: recall | Modelo: recall | Regras + modelo: recall | Regras + modelo: precisão |
|---|---|---|---|---|---|
| violencia | 37 | 24% | 81% | 86% | 70% |
| casamento | 34 | 74% | 59% | 79% | 68% |
| filhos | 40 | 80% | 70% | 92% | 61% |
| emprego_curso | 39 | 74% | 49% | 82% | 57% |
| saude | 36 | 44% | 47% | 69% | 81% |
| estudo | 36 | 69% | 69% | 83% | 68% |
| moradia | 36 | 31% | 61% | 67% | 86% |
| dividas | 35 | 43% | 71% | 86% | 91% |
| familia | 37 | 65% | 57% | 78% | 76% |

### Teste independente (52 frases antigas)

| Sistema | Precisão | Recall | F1 | Acerto exato |
|---|---|---|---|---|
| Regras de palavras-chave | 100% | 100% | 100% | 100% |
| Modelo de aprendizado de máquina | 89% | 73% | 80% | 65% |
| Regras + modelo | 92% | 100% | 96% | 88% |

