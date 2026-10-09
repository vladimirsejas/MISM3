# Horários de ônibus de Rio Claro

## Fonte primária

- [SOU Transportes — Rio Claro](https://soutransportes.com.br/rio-claro/)
- [SOU Transportes — Linhas e horários](https://soutransportes.com.br/rio-claro/linhas-e-horarios/)

A página principal da SOU informa que o aplicativo oferece informações em tempo real e tabelas de horários. A página específica de linhas e horários não expôs tabelas legíveis na consulta automatizada feita para este projeto.

## Estado da base

O arquivo `web/dados/horarios_onibus.json` registra a fonte primária, mas ainda não contém horários. Isso é intencional: a extração anterior dos 12 PDFs locais retornou apenas cabeçalhos de páginas de anotações, não os horários. Não devemos transformar esses arquivos em dados de transporte nem tratar horários não verificados como oficiais.

## Próximo passo

Extrair as tabelas diretamente da página da SOU, do aplicativo oficial ou de arquivos de horários publicados pela operadora. Para cada linha, guardar número/nome, sentido, tipo de dia, horários, URL da fonte e data de consulta. Se não for possível ler a tabela automaticamente, registrar a limitação sem inventar valores.
