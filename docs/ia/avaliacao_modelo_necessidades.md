# Avaliação do modelo de necessidades

Gerado por `pipeline/treinar_necessidades.py` em 2026-10-12. **Leia com as limitações abaixo.**

## Limitações (importantes)

- As frases de treino e de teste foram **escritas pela equipe**, não vêm de mulheres reais. O desempenho com pessoas de verdade pode ser **menor**.
- O conjunto é **pequeno** (349 frases). Os números têm margem de erro grande e servem para comparar o modelo com as regras, não para prometer desempenho.
- As **regras** de palavras-chave foram escritas pela mesma equipe, olhando para frases parecidas; isso as favorece nesta comparação.
- O modelo **não decide direitos nem diagnostica**: só sugere áreas do site. Em violência, o sistema soma regras e modelo para não deixar de alertar.

## Como foi avaliado

- **Validação cruzada em 5 partes (349 frases):** cada frase é prevista por um modelo que nunca a viu (o treino inclui variações sem acento e com letra esquecida).
- **Teste independente (53 frases):** frases dos testes antigos do projeto, escritas antes de o modelo existir. Elas foram escritas para as regras, então as favorecem.
- **Regras + modelo:** é o que o site usa (a união dos dois, no máximo 3 sugestões). O modelo exportado é treinado com todas as frases.

### Validação cruzada

349 frases. Micro-média, **precisão / recall / F1 / acerto exato**:

| Sistema | Precisão | Recall | F1 | Acerto exato |
|---|---|---|---|---|
| Regras de palavras-chave | 75% | 60% | 67% | 48% |
| Modelo de aprendizado de máquina | 77% | 62% | 69% | 54% |
| Regras + modelo (usado no site) | 71% | 82% | 76% | 58% |

| Necessidade | Frases | Regras: recall | Modelo: recall | Regras + modelo: recall | Regras + modelo: precisão |
|---|---|---|---|---|---|
| violencia | 37 | 24% | 84% | 89% | 72% |
| casamento | 34 | 74% | 65% | 79% | 71% |
| filhos | 40 | 80% | 65% | 90% | 54% |
| emprego_curso | 39 | 74% | 51% | 85% | 62% |
| saude | 60 | 67% | 53% | 82% | 88% |
| estudo | 36 | 81% | 67% | 86% | 69% |
| moradia | 36 | 31% | 56% | 61% | 88% |
| dividas | 35 | 43% | 63% | 80% | 85% |
| familia | 37 | 65% | 62% | 81% | 70% |

### Teste independente (53 frases antigas)

| Sistema | Precisão | Recall | F1 | Acerto exato |
|---|---|---|---|---|
| Regras de palavras-chave | 100% | 100% | 100% | 100% |
| Modelo de aprendizado de máquina | 100% | 74% | 85% | 68% |
| Regras + modelo | 100% | 100% | 100% | 100% |

