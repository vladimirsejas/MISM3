# Auditoria automatizada da qualidade geográfica

## O que verifica

Execute `python pipeline/qualidade_geografica.py` na raiz do repositório. O módulo lê somente os arquivos territoriais versionados e produz relatórios JSON e Markdown.

Verifica a estrutura das geometrias GeoJSON (tipo, anéis, fechamento, limites de coordenadas), duplicidade de códigos de setor, localização dos equipamentos dentro da malha, procedência registrada de CRAS/UBS, método de localização das escolas, diferença entre a soma das áreas setoriais e a referência municipal e quantidade de setores sinalizados pela cautela D4. Para a área, calcula novamente a soma pelo plano local usado atualmente e por uma fórmula geodésica esférica independente.

## Saídas

- `docs/territorial/RELATORIO_QUALIDADE_GEOGRAFICA.json`
- `docs/territorial/RELATORIO_QUALIDADE_GEOGRAFICA.md`

## Limites

A validação geométrica desta versão verifica integridade estrutural dos anéis e limites das coordenadas; não substitui uma validação topológica completa de auto-interseções e sobreposições. A soma pelo método local fica em aproximadamente 497,340 km²; o recálculo geodésico esférico fica em aproximadamente 499,665 km², enquanto a referência municipal é 498,403 km². A diferença muda de sinal entre os dois métodos, portanto não pode ser atribuída apenas a arredondamento: exige verificar recorte municipal, cobertura, sobreposição e lacunas entre polígonos. A auditoria registra a divergência, não escolhe automaticamente um método nem corrige artificialmente as áreas. A auditoria não supre os seis registros de proveniência ausentes, não inventa raios e não aplica supressão ou agregação aos setores pequenos.
