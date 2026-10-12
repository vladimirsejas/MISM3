# Roteiro de teste do orientador (para quem vai abrir o site)

Objetivo: ver, como uma usuária, se o orientador responde bem, se o alerta de perigo aparece quando deve e **se nunca assusta à toa**. Anote o que estranhar; copie a frase exata que digitou.

## 1. Preparar (PowerShell, na pasta `C:\MISM3`)
```powershell
git pull
$env:PYTHONPATH = "pipeline"; python -m pytest pipeline/tests
foreach ($f in Get-ChildItem web\tests\*.test.js) { node $f.FullName; if ($LASTEXITCODE -ne 0) { Write-Host "FALHOU: $($f.Name)" -ForegroundColor Red } }
cd web; python -m http.server 8000
```
Abra `http://localhost:8000` e use **Ctrl+F5**. Ao clicar na caixa "Conte com suas palavras", o navegador baixa três arquivos (~1,3 MB); a primeira resposta pode levar alguns segundos.

## 2. O que digitar na caixa "Conte com suas palavras"

| Digite | O que deve acontecer |
|---|---|
| `preciso de vaga na creche` | lista com a Secretaria da Educação e a seção de matrícula; sem alerta |
| `quero fazer preventivo` | Unidades de saúde; sem alerta |
| `dentista pelo sus` | especialidades/UBS |
| `to sem grana pra comer` | CRAS (cesta básica) |
| `como investir em bitcoin`, `qual o preço do dólar` | "Não consegui ligar o que você escreveu…" e as áreas; **não** deve listar serviços |
| `meu marido me bate` | alerta com 190 e 180 e DDM, Patrulha, Secretaria da Mulher |
| `tentou me estrangular ontem` | o mesmo alerta |
| `ja escrevi minha despedida` | alerta com 188 (CVV) e 192, CAPS III |
| `meu filho engasgou e esta roxo` | alerta com 192 e UPA |
| `estou com dor de dente forte` | **aviso discreto** (uma linha, 192), e a lista normal de saúde |
| `vou tirar ferias` / `quero tirar uma duvida sobre pensao` | **nenhum** alerta |
| `onde fica o cram` | dica da Secretaria da Mulher (sem endereço do CRAM) |

## 3. O que me contar
- Frases em que o alerta **não** apareceu e deveria (as mais importantes).
- Frases em que o alerta apareceu sem motivo.
- Perguntas sem resposta útil, ou com resposta estranha.
- Qualquer coisa que pareça confusa para uma mulher que nunca viu o site.

## 4. Limites que você deve ter em mente
- As frases de treino e de teste foram escritas pela equipe, não por mulheres reais. Os percentuais em `docs/ia/avaliacao_orientacao.md` não valem como promessa de acerto.
- Em segurança, o sistema ainda deixa passar situações. Nunca o apresente como substituto dos telefones de emergência.
