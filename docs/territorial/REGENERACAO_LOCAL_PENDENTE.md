# Regeneração territorial final pendente

A geometria e os testes de referência IBGE já estão versionados e são validados na GitHub Actions. A regeneração final de indicadores não deve ocorrer neste ambiente: depende das contagens brutas e da conferência da regra D4 no computador do responsável.

O arquivo `web/dados/indicadores_territoriais.json` deve ser tratado como publicação pendente de regeneração até que o Claude Code execute localmente o pipeline autorizado, compare os hashes de entrada, confira a supressão dos 17 setores D4 e produza os derivados minimizados. Os arquivos brutos, tabelas INEP de docentes/gestores/matrículas, CNES, CNEFE, CEPs com coordenadas Google e capturas de conferência não podem ser enviados ao GitHub, à Actions ou a artefatos públicos.

O teste `test_publicado_e_o_que_o_gerador_produz_hoje` fica explicitamente ignorado enquanto este arquivo existir. Remova este marcador somente depois de regenerar e validar os derivados localmente, atualizar os arquivos públicos minimizados autorizados e confirmar que a saída reproduz o gerador. Então a Actions volta a executar esse teste como obrigatório.

Nenhuma etapa deste bloqueio autoriza deploy, publicação, merge, Cloudflare ou alteração da `main`.


## Runbook de regeneração local — 09/11/2026

Executar exclusivamente no computador do responsável, em cópia de trabalho da branch `mism3-fechamento`. Não copiar fontes brutas, tabelas escolares restritas, CEPs residenciais, coordenadas Google ou capturas para o GitHub, Actions, artefatos ou logs. Preservar os arquivos-fonte originais, sem sobrescrever ou mover.

### Ambiente fixado pelo repositório

- Python 3.12 (mesma linha usada pela Actions).
- Dependências Python fixadas em `requirements.txt`: pandas 3.0.1, numpy 2.4.3, scikit-learn 1.9.1, scipy 1.18.1, pyshp 3.1.6, pyproj 3.7.2, shapely 2.1.2, openpyxl 3.1.5 e pytest 9.0.3.
- Node.js 20 para os testes JavaScript.
- O teste de navegador usa Playwright 1.56.1 e Chromium, instalados no job de navegador da Actions; não é dependência do pipeline de dados.

### Entradas locais necessárias

- CNES de agosto de 2026, em formato original, para a rotina de serviços.
- Microdados INEP/Censo Escolar 2025 e tabelas locais de docentes, gestores e matrículas, exclusivamente para as agregações autorizadas. Não associar matrículas, turmas ou pessoas a escolas individuais.
- CNEFE de Rio Claro e agregado local de CEPs do CNEFE, usados apenas segundo as regras documentadas de localização institucional e generalização.
- Lista local de CEPs com coordenadas Google e malha de bairros IBGE nacional, apenas para conferência local; não publicar coordenadas ou arquivos.
- Malha oficial IBGE de setores 2022 (arquivo ZIP SP_setores_CD2022.zip) e arquivos de referência versionados em `dados/referencia_ibge/`.
- Catálogos `catalogo/servicos_manuais.csv`, `catalogo/inep_escolas.csv` e `catalogo/localizacao_registro.csv`, além dos JSON versionados usados pelo pipeline.

### Sequência de execução

Na raiz do repositório, com o ambiente Python 3.12 ativado, executar na ordem abaixo. A ordem respeita as dependências observadas no código: a geração do índice CEP exige a malha setorial; os catálogos e análises dependem do índice e dos agregados escolares.

```powershell
python -m pip install -r requirements.txt
python pipeline/setores.py "CAMINHO_LOCAL/SP_setores_CD2022.zip"
python pipeline/indice_cep.py
python pipeline/oferta_educacao_infantil.py --pasta "docs/educacao/dados"
python pipeline/escolas_municipais.py
python pipeline/servicos.py --somente-manual
python pipeline/territorio.py
python pipeline/analise_territorial.py
python pipeline/exposicao_distancia.py
python pipeline/territorial_indicadores.py
python pipeline/qualidade_geografica.py --saida-json "$env:TEMP/mism3_qualidade_geografica.json" --saida-md "$env:TEMP/mism3_qualidade_geografica.md"
python pipeline/auditoria_centroides.py --saida-json "$env:TEMP/mism3_auditoria_centroides.json" --saida-md "$env:TEMP/mism3_auditoria_centroides.md"
```

O caminho do ZIP é local e deve apontar para o arquivo oficial já obtido; não baixar fontes automaticamente nesta etapa. O parâmetro `--pasta` aponta para as três tabelas INEP 2025 locais. `oferta_educacao_infantil.py` publica somente totais por rede; `servicos.py --somente-manual` lê apenas a tabela Escola local para derivar os dois booleanos de etapa por escola vinculada, sem ler ou publicar matrículas/turmas individuais. `escolas_municipais.py` gera a base consolidada de cadastro e localização das escolas. Antes de executar, conferir a presença das entradas locais e suas versões. Se um pré-requisito estiver ausente, interromper o comando sem substituir a fonte por dado sintético.

### Saídas esperadas

- `web/dados/catalogo_manual.json`: catálogo manual normalizado.
- `web/dados/setores.geojson` e `web/dados/setor_bairro.json`: geometria de 408 setores, vértices originais preservados e coordenadas arredondadas a seis casas.
- `web/dados/oferta_educacao_infantil.json`: totais INEP agregados por rede, sem contagens por escola.\n- `web/dados/escolas_municipais.json`: cadastro consolidado de 68 escolas e seus vínculos/localização, sem matrículas por unidade.\n- `web/dados/territorio.json`: indicadores agregados territoriais.
- `web/dados/analise_territorial.json`: análise de cobertura e localização de equipamentos.
- `web/dados/exposicao_distancia.json`: cenários de distância em linha reta, sem tratar distância como tempo ou acesso efetivo.
- `web/dados/indicadores_territoriais.json`: indicadores territoriais minimizados, com D4 aplicada.
- Relatórios de qualidade geográfica e centroides somente em `%TEMP%` (ou `$env:TEMP`), sem adicionar os relatórios detalhados ao repositório.

### Testes obrigatórios e critérios de aceite

```powershell
$env:PYTHONPATH = "pipeline"
python -m pytest pipeline/tests -q
Get-ChildItem web/tests/*.test.js | ForEach-Object { node $_.FullName; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE } }
python pipeline/territorial_indicadores.py --conferir
```

Além da suíte, conferir os relatórios locais: 408 setores válidos; zero sobreposições e buracos internos acima de 0,0121 m²; 11 centroides matemáticos externos na geometria original; 17 setores D4 sem população, domicílios, densidade ou distância publicados; no máximo 391 setores contribuindo para estatísticas de distância; índice CEP sem vínculos setoriais não verificáveis e sem associação aos setores protegidos. A soma geodésica de setores de 2022 e a área geodésica do limite municipal de 2025 devem permanecer identificadas separadamente.

### Remoção do marcador

Remover este arquivo somente quando, cumulativamente: (1) a regeneração tiver sido executada localmente com as entradas autorizadas e suas versões/hashes registrados; (2) os arquivos derivados tiverem sido revisados e minimizados; (3) a regra D4 tiver sido conferida nos 17 setores e nos agregados de bairro; (4) nenhum dado bruto, linha individual, coordenada Google ou tabela restrita tiver sido copiado para os derivados públicos; (5) `python pipeline/territorial_indicadores.py --conferir` passar; (6) a suíte Python e Node passar; (7) o teste de igualdade publicado/gerador deixar de ser ignorado e passar na Actions. Até lá, manter o marcador e não afirmar que a regeneração final foi concluída.


## Atualização de continuidade — 09/11/2026

As correções do painel de qualidade e da classificação dos domínios de tiles/atribuição não alteram a geração dos derivados territoriais nem autorizam remover este marcador. A regeneração local permanece pendente e deve seguir integralmente o runbook acima, no computador do responsável, com as fontes locais originais preservadas.

- O painel de qualidade agora exporta a função existente `areaAnelEsferica`, sem declarar cálculo geodésico inexistente no JavaScript. Os quatro valores permanecem separados: atributo municipal IBGE 498,403 km²; área geodésica GRS80 do limite 2025 498,402 km²; soma geodésica dos setores 498,422 km²; recálculo esférico independente, identificado expressamente como esférico.
- A validação estática dos tiles separa os dois hosts de requisição (`tile.openstreetmap.org` e `server.arcgisonline.com`) dos links de atribuição (`www.openstreetmap.org` e `www.esri.com`). As camadas continuam desmarcadas por padrão e dependentes de opt-in. Nenhuma destas correções substitui os testes de navegador ou a regeneração dos dados.
- Após as correções, continuam obrigatórios: suíte Python completa, todos os testes `web/tests/*.test.js`, execução Playwright desktop/celular e confirmação dos 408 setores, 17 setores D4 protegidos, foco visível, zero erros de console, nenhuma requisição externa no cenário sem opt-in e ausência de rolagem horizontal em zoom 200%.
- Não remover este arquivo com base apenas na aprovação do CI de código. A remoção continua condicionada à regeneração local, validação dos derivados minimizados, auditoria D4 e igualdade entre publicação e gerador, conforme os critérios cumulativos acima.


### Marcador técnico de serviços do pipeline — 09/11/2026

Foi adicionado `web/dados/servicos.json` apenas como marcador vazio para impedir 404 no navegador enquanto a regeneração local continua pendente. O arquivo contém `servicos: []` e `meta.status: "pendente_regeneracao_local"`; não contém registros CNES/Censo Escolar, não representa dados regenerados e não substitui o procedimento local deste runbook. `web/app.js` reconhece esse estado e mantém a origem apresentada como “Catálogo verificado manualmente”, sem afirmar que a base do pipeline está disponível. O marcador só deve ser substituído pelos dados reais depois da regeneração e validação local previstas neste documento.


## Validação de código/CI concluída — regeneração local continua pendente

Em 09/11/2026, o run GitHub Actions #804 (`42682346999`) aprovou os jobs reais `testes` e `navegador`. A suíte de código passou (referência IBGE 5 passed; pytest 308 passed, 2 skipped; todos os testes Node) e o Playwright aprovou desktop 1280×800, celular 390×844, 408 setores, 17 protegidos, foco por teclado visível, zero requisições externas, zero erros de console/HTTP e zoom 200% sem rolagem horizontal.

**Isso não encerra este runbook.** A aprovação do CI valida o código e a interface com os arquivos versionados; não executa a regeneração local nem comprova igualdade entre os dados publicados e as fontes originais locais. O Bloco 2 permanece em andamento até a regeneração local completa, auditoria D4, análise de distâncias, validação dos derivados e conferência de proveniência previstas acima. O marcador vazio `web/dados/servicos.json` deve ser substituído somente por saída real do pipeline após essa execução, nunca tratado como dataset.
