# Horários de ônibus de Rio Claro

## Fonte utilizada no levantamento

**Fonte informada para os documentos reunidos no projeto:** [SOU Transportes — Rio Claro](https://soutransportes.com.br/rio-claro/).

Página específica de linhas e horários: [SOU Transportes — Linhas e horários](https://soutransportes.com.br/rio-claro/linhas-e-horarios/).

Os 12 PDFs guardados localmente em `docs/transporte/` foram obtidos/impressos a partir da fonte da SOU indicada acima, conforme informado durante o levantamento. Portanto, essa URL deve ser citada como origem dos documentos na documentação do MISM3.

## Resultado da extração

O script `pipeline/extrair_texto_onibus.py` conseguiu abrir os 12 PDFs e processar 29 páginas, mas o texto extraído contém somente cabeçalhos de impressão/anotações. Os horários não ficaram disponíveis como texto legível nesses arquivos. Isso não invalida a fonte: significa apenas que os PDFs locais não permitiram extrair automaticamente as tabelas.

## Estado da base

O arquivo `web/dados/horarios_onibus.json` registra a fonte da SOU, mas ainda não contém horários estruturados. Não preencher horários por suposição.

## Próximo passo

Obter as tabelas legíveis a partir da própria página da SOU ou de seus arquivos/documentos publicados e estruturar cada linha com número/nome, sentido, tipo de dia, horários, URL da fonte e data de consulta. Preservar a URL da SOU como referência de origem e indicar separadamente qualquer dificuldade técnica de extração.
