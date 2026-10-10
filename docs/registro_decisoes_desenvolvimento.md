# Registro de decisões de desenvolvimento — MISM3

Este registro é um documento de trabalho para decisões explícitas. Ele não substitui a inspeção do código, dos testes, dos dados e das fontes originais.

## Regra de autoridade dos materiais

**O README.md não é fonte de verdade nem norte para decisões de produto ou arquitetura.** É apenas um mapa resumido do que está sendo desenvolvido e de como navegar no projeto. Pode ficar desatualizado ou simplificar decisões.

Ao avaliar o estado do MISM3, verificar nesta ordem:
1. Decisões expressamente confirmadas pelo fundador na conversa.
2. Código existente e comportamento que pode ser demonstrado.
3. Testes executados e seus resultados reais.
4. Dados e documentação de origem, com seus metadados e limitações.
5. Registro de decisões, para histórico e contexto.
6. README, apenas como mapa de navegação e resumo.

Não inferir que uma funcionalidade existe só porque aparece no README ou em um plano. Confirmar a implementação. Não considerar uma ideia implementada só porque aparece em documentação.

## Direção do protótipo

- O MISM3 é um protótipo fechado em desenvolvimento; não pressupor uso pelo público.
- Usar cenários sintéticos para testes internos. Não exigir testes com mulheres reais para avançar no protótipo.
- Marcar explicitamente dados, perfis, serviços e histórias fictícias com `[DEMO]` ou aviso equivalente.
- Não misturar dados reais e ilustrativos sem identificação visível e inequívoca.
- A busca deve reconhecer acentos, sinônimos e necessidades combinadas, sem enviar o texto digitado a um servidor.
- Priorizar caminhos funcionais e jornadas integradas, não apenas uma coleção de links.
- Construir progressivamente: validar a base antes de ampliar funcionalidades.
- Distinguir sempre implementação feita, teste executado, hipótese e trabalho futuro.

## Decisões e alterações recentes

### Busca de necessidades
- Extraído o classificador local para `web/necessidades.js`.
- Criados testes sintéticos em `web/tests/necessidades.test.js`.
- O módulo reconhece até três categorias por frase.
- Teste de referência executado pelo ambiente de trabalho: 39 cenários passaram. Isso não equivale a teste completo de navegador.

### De Mulher para Mulher
- Criada a página `web/rede-mulheres.html` com perfis fictícios, filtros, prévia de cadastro e simulação de denúncia.
- Os níveis são rótulos demonstrativos, não verificações reais.
- Cadastro e denúncia não são enviados nem persistidos.
- A sintaxe JavaScript embutida foi verificada; falta teste visual no navegador.

### Próximos focos
1. Fazer uma verificação funcional do fluxo de busca na interface.
2. Projetar o painel de Inteligência Pública usando dados censitários reais somente quando a proveniência e os campos forem confirmados; usar dados ilustrativos separados enquanto isso.
3. Expandir a jornada De Mulher para Mulher mantendo perfis e interações fictícios.
4. Preparar limites e caminho para produção sem tratar esses limites como impedimento ao protótipo.

## Atualização deste registro
Ao concluir mudanças relevantes, registrar o que foi alterado, o teste executado, o resultado observado e o que ainda não foi verificado.

### Inteligência Pública
- Criada a página `web/inteligencia-publica.html`.
- A página tenta carregar `web/dados/setores_resumo.json` e mostra contagens de setores, pessoas e domicílios apenas se o arquivo estiver disponível.
- O gráfico de comparação territorial usa valores fictícios explicitamente marcados `[DEMO]`; não representa estatísticas de Rio Claro.
- O painel explica que a malha geral não comprova demanda por creche e que são necessários dados apropriados de faixa etária e oferta.
- Sintaxe JavaScript embutida verificada; ainda falta inspeção visual e teste com um arquivo real confirmado.

### Navegação
- A tela inicial agora liga para os protótipos De Mulher para Mulher e Inteligência Pública.
- O teste de busca foi repetido depois das alterações: 39 cenários passaram. Sintaxe de `web/app.js` e dos scripts embutidos nas duas páginas foi verificada.

## 2026-10-10 — Saúde por bairro, secretarias e consolidação das branches

### O que mudou
- Trazido para esta branch o trabalho da `claude/keen-brown-fgpknd` (UBS do guia oficial, painel de gestão, API, vagas, recomendação, documentos de fontes). O merge entrou sem conflito.
- Os dois PDFs de `docs/unidades saude rio claro/` (capturas de tela do guia da Saúde e da página da Prefeitura, de 09/10/2026) foram lidos e incorporados ao catálogo.
- `catalogo/servicos_manuais.csv`: novas colunas `bairro`, `bairros`, `divergencia`; 8 novas unidades (urgência 24 h Nossa Senhora de Lourdes, Vigilância Sanitária e 6 USF); a área de abrangência das 6 UBS de bairro passou de texto em `observacao` para lista estruturada (contagens conferidas com o guia: 14, 10, 18, 9, 6 e 4 bairros).
- `catalogo/secretarias.csv` (novo): 44 links, 21 "conferidos" (páginas abertas no levantamento de 09/10/2026 registrado em `docs/fontes_oficiais_rioclaro_mism3.md`) e 23 "só listados".
- `pipeline/institucional.py` (novo) gera `web/dados/institucional.json`; `pipeline/servicos.py` repassa os campos novos.
- Páginas novas `web/saude.html` e `web/secretarias.html`, módulo `web/institucional.js`, estilos `web/institucional.css`; menu das seis páginas e tela inicial atualizados; ícone de aba embutido (o console deixou de acusar `favicon.ico` 404).
- `abrir_site.bat` reescrito (CRLF, ASCII, porta livre, atualiza dados antes de abrir) e `.gitattributes` para manter CRLF nos `.bat`.

### Problemas encontrados no que já existia
1. As 5 UBS marcadas `abrangencia=local` e sem CEP **não apareciam em nenhuma tela**: o site só lista serviço sem localização depois de uma busca e mostra no máximo 5. A página Saúde não depende de CEP.
2. A área de abrangência (informação mais útil do guia) estava só em texto livre e não era pesquisável.
3. As observações de algumas unidades traziam notas de desenvolvimento ("Sem CEP/coordenadas validados: aparece na lista, não no mapa"). A tela agora as remove (`limparObservacao`) e há teste para impedir que voltem.

### Decisões
- **Não duplicar unidades.** Boa Vista, Assistência e Ajapi aparecem nas duas fontes (UBS e USF) com o mesmo endereço e telefone: ficaram como uma linha com nota. Só entraram como novas as USF que não têm correspondente conferido. A "USF Ferraz" ficou separada da "UBS do Distrito de Ferraz" porque os endereços diferem.
- **Divergência entre fontes oficiais é mostrada, não resolvida:** telefone da UBS Vila Cristina (3535-2908 e 3535-0709 no guia; 3527-2908 na Prefeitura), rua de referência da UBS Wenzel, endereço e telefone de Ferraz.
- **"Conferido" × "só listado":** `verificado_em` só existe para links que foram abertos; o validador recusa data em item "listado". O link "listado" aparece com selo tracejado na tela.
- "Atende o bairro" (guia da Saúde) é diferente de "fica no bairro" (localização): para USF não há área de abrangência publicada, e a tela diz isso.

### Testes executados (neste ambiente, 10/10/2026)
- `pytest pipeline/tests`: 105 passaram (inclui `test_institucional.py`: validações, contagens de bairros, divergências registradas, compatibilidade com `servicos.py`).
- Node: `acesso`, `recomendar`, `vagas`, `necessidades` (72 frases), `api` passaram; `institucional.test.js`: 173 verificações (casamento de bairros, "Vila Cristina" não casa com "Jardim Cristina", todo bairro do guia acha a sua UBS, telefones com DDD herdado e celular colado, ordem conferidos-primeiro).
- Navegador (Chromium/Playwright): busca por bairro com resultado, divergência e telefones; bairro desconhecido e texto curto; filtros (USF = 6 unidades); 44 links, todos `https`, `target=_blank` e `rel=noopener`; menu com 6 itens e página atual correta nas seis páginas; celular de 390 px sem rolagem horizontal e alvos de toque ≥ 40 px; **zero erros** de console nas duas páginas novas, pelo servidor e abrindo `demo_unico/*.html` por `file://`.

### O que NÃO foi verificado
- O `abrir_site.bat` **não foi executado** (o ambiente é Linux). Foi escrito com os mesmos padrões do `mism3.bat`, e o servidor que ele inicia (`pipeline/servidor.py --porta N`) foi testado aqui.
- **Nenhum link de secretaria foi aberto**: o ambiente não alcança `rioclaro.sp.gov.br` nem `saude-rioclaro.org.br` (política de rede). "Conferido" vale pela data do levantamento anterior; não foi reconferido hoje.
- Telefones e endereços das USF e da urgência 24 h foram lidos **de imagem** (captura de tela), não de texto: conferir na página ao vivo.
- Teste com pessoas reais, leitor de tela e contraste não foram feitos (ver `docs/criterios_usabilidade_frontend.md`).

### Pendências
1. Refazer a captura de `rioclaro.sp.gov.br/unidades-basicas-de-saude/` inteira (rolando até o fim ou "Salvar como PDF"): faltam USF cortadas (uma no Jardim Centenário, fone 3524-0313, nome ilegível) e parte da lista de UBS.
2. Rodar `python pipeline/verificar_catalogo.py` com internet e ligar para as unidades divergentes.
3. Obter CEP/coordenadas das unidades de saúde para que também entrem no mapa e na busca por CEP.
4. Decidir qual endereço de Planejamento está em uso (`secretaria-de-planejamento` ou `-e-habitacao`) e se "Governo e Relações Institucionais" e "Relações Institucionais" são o mesmo órgão.
5. Liberar os domínios `rioclaro.sp.gov.br` e `saude-rioclaro.org.br` na rede do ambiente de desenvolvimento para automatizar a conferência.
