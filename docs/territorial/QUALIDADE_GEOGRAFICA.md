# Auditoria automatizada da qualidade geográfica

## O que verifica

Execute `python pipeline/qualidade_geografica.py` na raiz do repositório. O módulo lê somente os arquivos territoriais versionados e produz relatórios JSON e Markdown.

Verifica a estrutura das geometrias GeoJSON (tipo, anéis, fechamento, limites de coordenadas), duplicidade de códigos de setor, localização dos equipamentos dentro da malha, procedência registrada de CRAS/UBS, método de localização das escolas, diferença entre a soma das áreas setoriais e a referência municipal e quantidade de setores sinalizados pela cautela D4.

## Saídas

- `docs/territorial/RELATORIO_QUALIDADE_GEOGRAFICA.json`
- `docs/territorial/RELATORIO_QUALIDADE_GEOGRAFICA.md`

## Limites

A validação geométrica desta versão verifica integridade estrutural dos anéis e limites das coordenadas; não substitui uma validação topológica completa de auto-interseções e sobreposições. A verificação de ponto na malha mede apenas inclusão geométrica, não área de atendimento ou acesso. A divergência de área é registrada, não corrigida artificialmente. A auditoria não supre os seis registros de proveniência ausentes, não inventa raios e não aplica supressão ou agregação aos setores pequenos.
