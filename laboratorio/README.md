# Laboratório (Gemini) — ferramenta de desenvolvimento isolada

Serve só para **gerar e medir perguntas de teste**. O site não importa nem chama nada daqui (há teste para isso). Sem internet, sem chave e sem Gemini, o MISM3 funciona igual.

## Regras
1. **Só dados sintéticos.** Nunca enviar relato real nem dado identificável.
2. **O Gemini propõe, pessoas decidem.** Todo gabarito é aprovado por revisor humano (hoje: o autor do projeto e futuros colaboradores). O modelo não valida o próprio trabalho.
3. **Só escreve em `laboratorio/`.** `seguro.gravar_texto` recusa `web/`, `catalogo/`, `pipeline/`, `avaliacao/`, `dados/`, `docs/`, `.github/`.
4. **Nunca rodar `pipeline/treinar_*.py` por causa daqui**: eles exportam modelos para `web/dados/`.
5. **Chave só em variável de ambiente** (`GEMINI_API_KEY`); `.env` já é ignorado pelo Git. Nunca em código, log, commit ou resultado.
6. **Conjunto lacrado:** quando existir, ninguém o usa para escrever prompts, ajustar regras ou limiares.

## Comandos
```
python laboratorio/verificar_intacto.py                      # nada protegido mudou?
GEMINI_API_KEY=... python laboratorio/testar_gemini.py       # uma chamada fixa, não grava nada
python -m pytest laboratorio/tests -q                        # testes do laboratório
```
(Os testes do laboratório não estão no CI de propósito, para não alterar `.github/`; rodar localmente antes de qualquer mudança.)

## Critérios de decisão (escritos ANTES de medir)
- **APROVADO:** 211 testes Python + 17 JS + `avaliar.py` passam; `verificar_intacto.py` limpo; nenhum caso crítico de perigo passa de detectado a não detectado; nenhuma regressão relevante por categoria; resultado reproduzido numa segunda execução; chave ausente do código e dos logs.
- **REPROVADO:** qualquer critério acima falha, mesmo que a média melhore.
- **INCONCLUSIVO:** falta revisão humana, cobertura ou evidência para decidir.
Nenhum resultado significa "segurança garantida": só que os critérios foram cumpridos nos conjuntos testados.

## Fases
0 referência (feita) · 1 estrutura isolada (feita) · 2 integração testada, com respostas simuladas e com chamada real ao Gemini (feita em 12/10/2026) · 3 gerar casos · 4 validar e lacrar · 5 medir e comparar · 6 decidir.
