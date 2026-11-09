# Regeneração territorial final pendente

A geometria e os testes de referência IBGE já estão versionados e são validados na GitHub Actions. A regeneração final de indicadores não deve ocorrer neste ambiente: depende das contagens brutas e da conferência da regra D4 no computador do responsável.

O arquivo `web/dados/indicadores_territoriais.json` deve ser tratado como publicação pendente de regeneração até que o Claude Code execute localmente o pipeline autorizado, compare os hashes de entrada, confira a supressão dos 17 setores D4 e produza os derivados minimizados. Os arquivos brutos, tabelas INEP de docentes/gestores/matrículas, CNES, CNEFE, CEPs com coordenadas Google e capturas de conferência não podem ser enviados ao GitHub, à Actions ou a artefatos públicos.

O teste `test_publicado_e_o_que_o_gerador_produz_hoje` fica explicitamente ignorado enquanto este arquivo existir. Remova este marcador somente depois de regenerar e validar os derivados localmente, atualizar os arquivos públicos minimizados autorizados e confirmar que a saída reproduz o gerador. Então a Actions volta a executar esse teste como obrigatório.

Nenhuma etapa deste bloqueio autoriza deploy, publicação, merge, Cloudflare ou alteração da `main`.
