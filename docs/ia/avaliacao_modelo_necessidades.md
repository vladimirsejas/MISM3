# Avaliação do modelo de necessidades

Gerado por `pipeline/treinar_necessidades.py` em 2026-11-05. **Leia com as limitações abaixo.**

## Limitações (importantes)

- As frases de treino e de teste foram **escritas pela equipe**, não vêm de mulheres reais. O desempenho com pessoas de verdade pode ser **menor**.
- O conjunto é **pequeno** (420 frases). Os números têm margem de erro grande e servem para comparar o modelo com as regras, não para prometer desempenho.
- As **regras** de palavras-chave foram escritas pela mesma equipe, olhando para frases parecidas; isso as favorece nesta comparação.
- O modelo **não decide direitos nem diagnostica**: só sugere áreas do site. Em violência, o sistema soma regras e modelo para não deixar de alertar.

## Como foi avaliado

- **Validação cruzada em 5 partes (420 frases):** cada frase é prevista por um modelo que nunca a viu (o treino inclui variações sem acento e com letra esquecida).
- **Teste independente (66 frases):** frases dos testes antigos do projeto, escritas antes de o modelo existir. Elas foram escritas para as regras, então as favorecem.
- **Regras + modelo:** é o que o site usa (a união dos dois, no máximo 3 sugestões). O modelo exportado é treinado com todas as frases.

### Validação cruzada

420 frases. Micro-média, **precisão / recall / F1 / acerto exato**:

| Sistema | Precisão | Recall | F1 | Acerto exato |
|---|---|---|---|---|
| Regras de palavras-chave | 73% | 57% | 64% | 45% |
| Modelo de aprendizado de máquina | 80% | 64% | 71% | 58% |
| Regras + modelo (usado no site) | 71% | 81% | 76% | 59% |

| Necessidade | Frases | Regras: recall | Modelo: recall | Regras + modelo: recall | Regras + modelo: precisão |
|---|---|---|---|---|---|
| violencia | 37 | 24% | 76% | 84% | 72% |
| casamento | 43 | 70% | 63% | 79% | 72% |
| filhos | 48 | 79% | 67% | 92% | 54% |
| emprego_curso | 45 | 69% | 62% | 89% | 62% |
| saude | 67 | 66% | 60% | 81% | 83% |
| estudo | 36 | 81% | 67% | 89% | 67% |
| moradia | 58 | 33% | 60% | 67% | 80% |
| dividas | 45 | 33% | 67% | 76% | 92% |
| familia | 49 | 55% | 65% | 80% | 74% |

### Teste independente (66 frases antigas)

| Sistema | Precisão | Recall | F1 | Acerto exato |
|---|---|---|---|---|
| Regras de palavras-chave | 100% | 100% | 100% | 100% |
| Modelo de aprendizado de máquina | 96% | 78% | 86% | 71% |
| Regras + modelo | 96% | 100% | 98% | 95% |

