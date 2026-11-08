# Painel de qualidade dos dados territoriais

Abra \`web/qualidade-dados.html\` ou acesse o link no bloco **Para a gestão** da página inicial.

O painel lê somente três arquivos locais versionados:
- \`web/dados/setores.geojson\`
- \`web/dados/territorio.json\`
- \`web/dados/indicadores_territoriais.json\`

Ele calcula no navegador a integridade estrutural da malha, códigos duplicados, coordenadas de equipamentos fora dos polígonos, procedência de CRAS/UBS, métodos de localização das escolas, cautela D4 e três medidas de área (publicada, recálculo local e recálculo geodésico esférico).

Não há formulário, armazenamento local, envio de dados nem serviço externo. O painel não substitui validação topológica completa, conferência física de coordenadas ou análise de acessibilidade.

Para reproduzir a lógica no pipeline Python, execute:

\`\`\`powershell
python pipeline/qualidade_geografica.py
\`\`\`

A rotina Python gera relatórios JSON e Markdown em \`docs/territorial/\`. O painel web calcula os indicadores diretamente dos arquivos locais para não depender de um relatório previamente gerado.
