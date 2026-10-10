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

### Organização do dashboard e triagem das sugestões de empregabilidade — 10/10/2026
- A tela inicial foi reorganizada em três jornadas: **Trabalho e desenvolvimento**, **Saúde e rede de cuidado** e **Direitos e proteção**. As sete portas de entrada e seus identificadores foram preservados para não quebrar a busca existente.
- Os protótipos **De Mulher para Mulher** e **Inteligência Pública** foram separados em “Outras áreas da plataforma”, distinguindo o atendimento à população da ferramenta conceitual de gestão.
- Em buscas que identificam mais de uma necessidade, links oficiais repetidos e serviços compartilhados agora aparecem uma única vez, com aviso explicativo.
- A jornada de emprego ganhou um checklist de viabilidade que considera horário/escala, deslocamento, responsabilidades de cuidado, clareza do contrato e sinais de fraude. Isso é orientação de avaliação, não uma promessa de vaga ou de validação da empresa.
- As ideias do Gemini foram tratadas como arquitetura futura, não como funcionalidades já disponíveis. Ainda não existem integração real com Gov.br, verificação de identidade ou de CNPJ, cadastro público de profissionais, vagas integradas, fila municipal de creche, microcrédito, botão de pânico conectado à emergência nem armazenamento seguro em nuvem. Cada uma exige fontes oficiais, integração autorizada, análise jurídica e desenho de segurança antes de ser anunciada como funcional.
- Verificação executada após as mudanças: sintaxe de `web/app.js`, `web/necessidades.js` e `web/tests/necessidades.test.js` validada; os **39 cenários** do classificador de necessidades passaram. A estrutura estática da tela confirma as sete portas e três grupos. Ainda falta abrir a interface no navegador e testar visualmente os fluxos combinados e o mapa por CEP.
