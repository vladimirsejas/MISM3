# Avaliação do modelo de necessidades

Gerado por `pipeline/treinar_necessidades.py` em 2026-10-16. **Leia com as limitações abaixo.**

## Limitações (importantes)

- As frases de treino e de teste foram **escritas pela equipe**, não vêm de mulheres reais. O desempenho com pessoas de verdade pode ser **menor**.
- O conjunto é **pequeno** (408 frases). Os números têm margem de erro grande e servem para comparar o modelo com as regras, não para prometer desempenho.
- As **regras** de palavras-chave foram escritas pela mesma equipe, olhando para frases parecidas; isso as favorece nesta comparação.
- O modelo **não decide direitos nem diagnostica**: só sugere áreas do site. Em violência, o sistema soma regras e modelo para não deixar de alertar.

## Como foi avaliado

- **Validação cruzada em 5 partes (408 frases):** cada frase é prevista por um modelo que nunca a viu (o treino inclui variações sem acento e com letra esquecida).
- **Teste independente (66 frases):** frases dos testes antigos do projeto, escritas antes de o modelo existir. Elas foram escritas para as regras, então as favorecem.
- **Regras + modelo:** é o que o site usa (a união dos dois, no máximo 3 sugestões). O modelo exportado é treinado com todas as frases.

### Validação cruzada

408 frases. Micro-média, **precisão / recall / F1 / acerto exato**:

| Sistema | Precisão | Recall | F1 | Acerto exato |
|---|---|---|---|---|
| Regras de palavras-chave | 72% | 57% | 64% | 46% |
| Modelo de aprendizado de máquina | 81% | 64% | 72% | 56% |
| Regras + modelo (usado no site) | 71% | 80% | 76% | 57% |

| Necessidade | Frases | Regras: recall | Modelo: recall | Regras + modelo: recall | Regras + modelo: precisão |
|---|---|---|---|---|---|
| violencia | 37 | 24% | 84% | 89% | 72% |
| casamento | 42 | 69% | 62% | 76% | 70% |
| filhos | 48 | 79% | 73% | 94% | 56% |
| emprego_curso | 45 | 69% | 60% | 87% | 62% |
| saude | 67 | 66% | 58% | 78% | 84% |
| estudo | 36 | 81% | 75% | 89% | 67% |
| moradia | 46 | 33% | 41% | 57% | 84% |
| dividas | 43 | 35% | 72% | 81% | 92% |
| familia | 49 | 55% | 61% | 78% | 75% |

### Teste independente (66 frases antigas)

| Sistema | Precisão | Recall | F1 | Acerto exato |
|---|---|---|---|---|
| Regras de palavras-chave | 100% | 100% | 100% | 100% |
| Modelo de aprendizado de máquina | 94% | 79% | 86% | 70% |
| Regras + modelo | 95% | 100% | 98% | 94% |

