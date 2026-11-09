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

Na raiz do repositório, com o ambiente Python 3.12 ativado:

```bash
python -m pip install -r requirements.txt
python pipeline/servicos.py --somente-manual
python pipeline/setores.py "CAMINHO_LOCAL/SP_setores_CD2022.zip"
python pipeline/territorio.py
python pipeline/analise_territorial.py
python pipeline/exposicao_distancia.py
python pipeline/territorial_indicadores.py
python pipeline/qualidade_geografica.py --saida-json "%TEMP%/mism3_qualidade_geografica.json" --saida-md "%TEMP%/mism3_qualidade_geografica.md"
python pipeline/auditoria_centroides.py --saida-json "%TEMP%/mism3_auditoria_centroides.json" --saida-md "%TEMP%/mism3_auditoria_centroides.md"
```

No Windows PowerShell, substituir `%TEMP%\...` por `$env:TEMP\...`. O caminho do ZIP é local e deve apontar para o arquivo oficial já obtido; não baixar fontes automaticamente nesta etapa. Antes de rodar os geradores dependentes de escolas/CNES, conferir que os dados locais exigidos estão presentes e que os scripts identificam as versões e entradas esperadas. Se um pré-requisito estiver ausente, interromper aquele comando sem substituir a fonte por dado sintético.

### Saídas esperadas

- `web/dados/catalogo_manual.json`: catálogo manual normalizado.
- `web/dados/setores.geojson` e `web/dados/setor_bairro.json`: geometria de 408 setores, vértices originais preservados e coordenadas arredondadas a seis casas.
- `web/dados/territorio.json`: indicadores agregados territoriais.
- `web/dados/analise_territorial.json`: análise de cobertura e localização de equipamentos.
- `web/dados/exposicao_distancia.json`: cenários de distância em linha reta, sem tratar distância como tempo ou acesso efetivo.
- `web/dados/indicadores_territoriais.json`: indicadores territoriais minimizados, com D4 aplicada.
- Relatórios de qualidade geográfica e centroides somente em `%TEMP%` (ou `$env:TEMP`), sem adicionar os relatórios detalhados ao repositório.

### Testes obrigatórios e critérios de aceite

```bash
PYTHONPATH=pipeline python -m pytest pipeline/tests -q
for f in web/tests/*.test.js; do node "$f" || exit 1; done
python pipeline/territorial_indicadores.py --conferir
```

Além da suíte, conferir os relatórios locais: 408 setores válidos; zero sobreposições e buracos internos acima de 0,0121 m²; 11 centroides matemáticos externos na geometria original; 17 setores D4 sem população, domicílios, densidade ou distância publicados; no máximo 391 setores contribuindo para estatísticas de distância; índice CEP sem vínculos setoriais não verificáveis e sem associação aos setores protegidos. A soma geodésica de setores de 2022 e a área geodésica do limite municipal de 2025 devem permanecer identificadas separadamente.

### Remoção do marcador

Remover este arquivo somente quando, cumulativamente: (1) a regeneração tiver sido executada localmente com as entradas autorizadas e suas versões/hashes registrados; (2) os arquivos derivados tiverem sido revisados e minimizados; (3) a regra D4 tiver sido conferida nos 17 setores e nos agregados de bairro; (4) nenhum dado bruto, linha individual, coordenada Google ou tabela restrita tiver sido copiado para os derivados públicos; (5) `python pipeline/territorial_indicadores.py --conferir` passar; (6) a suíte Python e Node passar; (7) o teste de igualdade publicado/gerador deixar de ser ignorado e passar na Actions. Até lá, manter o marcador e não afirmar que a regeneração final foi concluída.
