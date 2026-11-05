# Avaliação do modelo de necessidades

Gerado por `pipeline/treinar_necessidades.py` em 2026-11-05. **Leia com as limitações abaixo.**

## Limitações (importantes)

- As frases de treino e de teste foram **escritas pela equipe**, não vêm de mulheres reais. O desempenho com pessoas de verdade pode ser **menor**.
- O conjunto é **pequeno** (430 frases). Os números têm margem de erro grande e servem para comparar o modelo com as regras, não para prometer desempenho.
- As **regras** de palavras-chave foram escritas pela mesma equipe, olhando para frases parecidas; isso as favorece nesta comparação.
- O modelo **não decide direitos nem diagnostica**: só sugere áreas do site. Em violência, o sistema soma regras e modelo para não deixar de alertar.

## Como foi avaliado

- **Validação cruzada em 5 partes (430 frases):** cada frase é prevista por um modelo que nunca a viu (o treino inclui variações sem acento e com letra esquecida).
- **Teste independente (66 frases):** frases dos testes antigos do projeto, escritas antes de o modelo existir. Elas foram escritas para as regras, então as favorecem.
- **Regras + modelo:** é o que o site usa (a união dos dois, no máximo 3 sugestões). O modelo exportado é treinado com todas as frases.

### Validação cruzada

430 frases. Micro-média, **precisão / recall / F1 / acerto exato**:

| Sistema | Precisão | Recall | F1 | Acerto exato |
|---|---|---|---|---|
| Regras de palavras-chave | 72% | 54% | 62% | 43% |
| Modelo de aprendizado de máquina | 78% | 65% | 71% | 56% |
| Regras + modelo (usado no site) | 70% | 81% | 75% | 56% |

| Necessidade | Frases | Regras: recall | Modelo: recall | Regras + modelo: recall | Regras + modelo: precisão |
|---|---|---|---|---|---|
| violencia | 37 | 24% | 84% | 89% | 69% |
| casamento | 45 | 67% | 62% | 80% | 72% |
| filhos | 48 | 79% | 65% | 92% | 54% |
| emprego_curso | 45 | 69% | 64% | 89% | 60% |
| saude | 67 | 66% | 55% | 78% | 81% |
| estudo | 36 | 81% | 75% | 89% | 67% |
| moradia | 68 | 24% | 65% | 66% | 71% |
| dividas | 47 | 32% | 72% | 83% | 95% |
| familia | 49 | 55% | 57% | 73% | 72% |

### Teste independente (66 frases antigas)

| Sistema | Precisão | Recall | F1 | Acerto exato |
|---|---|---|---|---|
| Regras de palavras-chave | 100% | 100% | 100% | 100% |
| Modelo de aprendizado de máquina | 93% | 76% | 83% | 65% |
| Regras + modelo | 94% | 100% | 97% | 92% |

