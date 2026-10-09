# Horários de ônibus de Rio Claro

## Fonte oficial de consulta

- [SOU Transportes — linhas e horários](https://soutransportes.com.br/rio-claro/linhas-e-horarios/)
- [Prefeitura — Linha 06 Cervezão/Regina Picelli, publicação de 5 de agosto de 2026](https://rioclaro.sp.gov.br/mobilidade-urbana-e-sistema-viario/linha-de-onibus-que-atende-cervezao-e-regina-picelli-muda-a-partir-de-2a-feira/)
- [Prefeitura — linhas 07 e 08 do Jardim Boa Vista, publicação de 22 de julho de 2025](https://rioclaro.sp.gov.br/mobilidade-urbana-e-sistema-viario/linhas-de-onibus-do-jardim-boa-vista-mudam-de-horario-a-partir-de-sabado/)

## Arquivo estruturado

Os horários transcritos das publicações municipais estão em `web/dados/horarios_onibus.json`.

- Linha 06: publicação municipal de agosto de 2026, com vigência anunciada a partir de 10/08/2026.
- Linhas 07 e 08: publicação municipal de julho de 2025. O arquivo preserva esses horários como referência publicada, mas marca que a vigência atual precisa ser confirmada.
- Não usar o conteúdo dos PDFs em `docs/transporte` como tabela estruturada enquanto a extração só retornar cabeçalhos de impressão. Os PDFs locais examinados não continham texto de horários recuperável pelo `pypdf`.

## Próximo passo técnico

Antes de exibir os horários das linhas 07 e 08 como atuais, comparar com a tabela vigente no portal da SOU. Para novas linhas, registrar os horários e a URL de origem, data de publicação e vigência informada. Não inferir horários ausentes.
