# Próximos passos (guardado em 12/10/2026, para retomar em 13/10/2026)

## Onde paramos
- **Laboratório Gemini:** fases 0, 1 e 2 concluídas (referência congelada, laboratório isolado, chamada real ao Gemini funcionando). Fase 3 **não iniciada**; nada foi gerado e nada da cota foi gasto.
- **Chave:** salva no `.env` da raiz (ignorado pelo Git) e aceita pelo Google. Nunca colar a chave em conversa, commit ou log.
- **Capa:** a nova ilustração das seis mulheres foi trocada em `web/img/faixa-mulheres.webp` (faixa abaixo do bloco "Você não está sozinha"). Está só na branch `claude/gracious-hopper-q0msjn`; **a `main` ainda não tem**, e não há Pull Request.
- Se a capa não aparecer: abrir `http://localhost:8000/` em janela anônima (o navegador guarda imagens de mesmo nome).

## Decisões pendentes (responder para começar)
1. **Fase 3, tamanho do piloto:** cerca de 5 casos por categoria (aprox. 100 no total) está bom?
2. **Fase 3, ordem de revisão:** começar por violencia, crianca e armadilha?
3. **Imagem:** levar a capa nova para a `main` com um Pull Request só dela?
4. **Imagem no topo:** a ilustração deve ficar no topo da página, no lugar do brasão? (mudança maior de layout; testes do site precisam ser conferidos)
5. **Servidor local:** ajustar o `abrir_site.bat` para sempre renovar imagens trocadas (evita o cache preso)?
6. **Mensagem não entendida:** "a senhora virou a lia" (o que significa? ajuste na imagem?).

## O que a Fase 3 vai construir (depois das decisões 1 e 2)
- `laboratorio/gerar_casos.py`: o Gemini propõe perguntas **sintéticas** por categoria; a categoria é só hipótese; cada caso leva id, versão do prompt, modelo exato (sem `-latest`), data e `origem: sintetica`.
- Filtro de duplicatas contra as 427 perguntas de `avaliacao/perguntas.json` e contra `catalogo/frases_*.txt`.
- `revisao.csv` para revisão humana (aprovado, corrigido ou rejeitado). Só os aprovados avançam.
- Testes com respostas simuladas, como na Fase 2. Saídas só em `laboratorio/dados_gerados/` e `laboratorio/relatorios/`.

## Pendências menores
- Tag `mism3-referencia-pre-lab` existe só localmente (não foi enviada ao GitHub).
- Os testes do laboratório não rodam no CI (de propósito, para não alterar `.github/`).
- No computador do usuário há arquivos soltos: `web/img/Gemini_Generated_Image…jpg` (pode apagar, a versão final está em `faixa-mulheres.webp`) e a pasta `MISM3_backup_local_20261010/` (evitar `git add .`).
- Modelo do Gemini: padrão `gemini-3.8-flash` (pode dar 503 por demanda; o laboratório repete sozinho). Alternativa que respondeu: `gemini-3.7-flash` via `GEMINI_MODEL`.

## Comandos úteis (PowerShell, em C:\MISM3)
```
git pull
python laboratorio/verificar_intacto.py        # esperado: INTACTO: 199 arquivos
python -m pytest laboratorio/tests -q          # esperado: 41 passed
python laboratorio/listar_modelos.py           # confere chave e modelos (não mostra a chave)
python laboratorio/testar_gemini.py            # uma chamada de teste
```
