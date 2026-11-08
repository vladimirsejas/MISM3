# Registro público resumido da auditoria de privacidade

Os relatórios detalhados com identificadores de CEP, coordenadas aproximadas, extensões geográficas e registros brutos de requisições foram retirados desta versão pública por cautela.

No ambiente e navegador testados, não foi observado envio do texto digitado nem do CEP em URLs, cabeçalhos ou corpos das requisições. Quando a pessoa ativa uma camada cartográfica externa, o navegador solicita tiles ao provedor correspondente; esses pedidos podem revelar a área visualizada e dados técnicos de conexão ao provedor.

Este resultado descreve apenas os cenários testados. Não comprova o comportamento de todos os navegadores, extensões, redes, serviços de hospedagem ou políticas de retenção dos provedores externos.

Para reproduzir a auditoria, execute os scripts localmente com `MISM3_AUDIT_CEP` definido e, se desejado, `MISM3_AUDIT_OUTPUT_DIR`. Os registros detalhados são gravados fora do repositório público.
