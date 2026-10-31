# Referências internacionais: o que olhamos, o que serve para Rio Claro e o que ficou pendente

Pesquisa de 31/10/2026. **Nenhuma regra, benefício ou número de outro país vale aqui.** O que importa é o método: como outros lugares ajudam uma mulher a não percorrer sozinha uma rede de serviços. Níveis de confiança como em `proposta_conteudo_mulheres_prioritarias.md`: **A** página oficial aberta ou fonte arquivada; **B** resumo de busca de fonte oficial ou de organismo internacional, sem a página aberta; **C** notícia, blog ou diretório de terceiros.

## O que entrou no site (área Direitos, seção "Mais de um serviço ao mesmo tempo")

| Ideia | De onde vem | Nível | O que virou |
|---|---|---|---|
| Reunir os serviços para a mulher não descobrir sozinha por onde começar | Centros de Justiça da Família de Nova York: segurança, orientação jurídica, benefícios e abrigo no mesmo lugar, gratuitos, sem exigir situação migratória | A (ficha oficial do ENDGBV) | Cartão "Quem atende junto": seis situações, cada uma com os serviços de Rio Claro que já estão no catálogo. Marcado como adaptação: **Rio Claro não tem um lugar único**. |
| Cuidado das crianças enquanto a mulher é atendida | Mesmos centros de Nova York (a partir de 3 anos, segundo a ficha atual; um comunicado de 2013 falava em cuidado sem limite de idade) | A | Pergunta no cartão "Antes de ir". **Nenhum serviço de Rio Claro está registrado como tendo esse espaço**; o texto manda perguntar e não supor. |
| Serviço existir não basta: perto, no horário, que ela consiga pagar, com quem deixar os filhos | Pesquisa nórdica sobre mães migrantes (horários noturnos e falta de creche fazem recusar emprego); Ciudad Mujer (El Salvador) e o centro de Toronto incluem cuidado infantil | B / C | Quatro perguntas para fazer ao ligar. Não virou campo do catálogo (ver pendências). |

## Também entrou: caminho "sozinha com os filhos" na jornada de Assistência

Nova opção na pergunta que já existia ("Estou sozinha com os filhos e preciso voltar a trabalhar"), sem botão novo. O plano tem cinco passos: CRAS e Cadastro Único, creche ou escola dos filhos, curso que caiba na rotina das crianças, vagas de trabalho, e a Defensoria sobre a pensão (esse último pode andar em paralelo). A **creche vem antes das vagas**, como nos programas de integração de mães (nível B, citados por terceiros e não verificados um a um) e como o ACCESS NYC faz ao reunir creche, emprego e benefícios na mesma triagem. Telefones e links vêm do catálogo; nenhum passo promete vaga ou benefício. Testes: `web/tests/jornada_assistencia.test.js`.

## Modelos estudados, com o que aprendemos

- **ACCESS NYC (A, página aberta).** Questionário de 5 a 10 minutos que devolve até 30 benefícios; 9 categorias; 11 idiomas. Lição: entrada por perguntas fechadas, para quem não sabe o que escrever. Pendência: a página não diz se os dados são guardados.
- **The Orange Door (Victoria, Austrália) (B).** Princípio "nenhuma porta errada": quem chega por qualquer porta é atendida e a equipe não a obriga a repetir a história. Lição: dizer, em cada serviço, que ela pode pedir para anotar o pedido.
- **Casa da Mulher Brasileira, programa federal (B).** Já é o equivalente brasileiro dos centros integrados: delegacia, juizado, Defensoria, apoio psicossocial, e em algumas unidades brinquedoteca e autonomia econômica. **Pendência:** verificar se existe, está prevista ou é possível uma unidade na região; é a pergunta certa para a Secretaria da Mulher.
- **Isange, Ruanda (B).** Atendimento médico, psicológico, policial e jurídico no mesmo hospital, com manual padrão para todas as unidades. Lição: padronizar o que cada serviço faz. Em 2026, deputados ruandeses apontaram falta de reforma e de capacidade.
- **Ciudad Mujer, El Salvador (B/C).** Cinco módulos (violência, saúde sexual e reprodutiva, autonomia econômica, educação em grupo, cuidado infantil). Sem avaliação de impacto encontrada; números de usuárias divergem entre fontes.
- **Europa e refugiadas (B).** Blue Dots (ACNUR e UNICEF) em Polônia, Moldávia, Romênia e outros: um espaço seguro com ajuda psicológica, jurídica, social e área para as crianças. Os resultados de busca não descrevem apoio a emprego nem cuidado infantil organizado. WISE, Taalbubbels+ e MY TURN foram citados por terceiros e **não foram verificados**.
- **Países nórdicos (B).** Documentos do Conselho Nórdico e da OCDE: para refugiadas, creche acessível e horários flexíveis pesam mais do que o curso em si; explicar as opções de creche no idioma delas.
- **Canadá (C).** Centros de apoio a mulheres recém-chegadas (Toronto) com emprego, acolhimento e cuidado das crianças de 19 meses a 6 anos. Fonte: diretórios; confirmar antes de citar.
- **África (B).** Robôs de conversa por WhatsApp para violência de gênero (Chomi, na África do Sul; plataforma nacional do Quênia, 2026). Um ensaio clínico sul-africano mostrou efeitos pequenos. **Não copiar:** envia a conversa a um servidor, o contrário da decisão do MISM3 de o texto não sair do navegador.
- **Katar, Sheikha Moza (B).** O que a pesquisa trouxe: Education Above All (educação de crianças em áreas de pobreza e conflito), Silatech (emprego de jovens no mundo árabe) e um centro e mesquita para mulheres. Pouco documentado sobre proteção de mulheres e família; não adotamos nada.
- **Segurança digital (A).** Botão de saída rápida: o design system do governo do Reino Unido e o de Nova Gales do Sul recomendam e avisam que **o botão não apaga o histórico**. O MISM3 já tem saída rápida e a nota ao lado do botão já diz que **não apaga** o histórico e sugere janela anônima (`web/index.html`, conferido em 31/10/2026): nada a mudar.
- **Alemanha, telefone 116 016 (B).** Aconselhamento em 18 idiomas, linguagem simples e língua de sinais, 24 horas. O número de idiomas varia entre fontes.

## Pendências, em ordem de valor

1. **Perguntar à Secretaria da Mulher** se existe ou está prevista uma Casa da Mulher Brasileira na região e se algum serviço tem espaço para as crianças. Uma ligação responde mais que toda a pesquisa acima.
2. **Campo "aceita criança junto?" e "atende em horário noturno ou sábado?" no catálogo**, só depois que a resposta for conferida por serviço. Hoje 117 de 164 serviços ainda não têm horário.
3. **Triagem com mais perguntas fechadas** (filhos, renda, moradia, trabalho), no estilo ACCESS NYC. A jornada de Assistência já tem uma pergunta e agora um caminho para quem está sozinha com os filhos; ampliar exige decisão do grupo sobre o desenho.
4. **Mulheres migrantes** (português para estrangeiras, documentos): falta fonte local de Rio Claro. Sem ela não vira texto.
5. **Iniciativas comunitárias de mulheres** (associações, grupos): levantamento de campo.

## O que decidimos não fazer

- Não importar regras ou benefícios de outro país.
- Não usar robô de conversa que envie texto a servidor.
- Não criar botão novo: a seção entra na área Direitos sem novo atalho, como `guias.test.js` exige.
- Não prometer que algum serviço tem cuidado para as crianças.

## Fontes abertas nesta pesquisa

- ACCESS NYC: https://access.nyc.gov/
- ENDGBV, Centros de Justiça da Família: https://www.nyc.gov/assets/ocdv/downloads/pdf/ENDGBV-FJC-One-Pager-ENGLISH.pdf
- GOV.UK, "Exit this page": https://design-system.service.gov.uk/components/exit-this-page
- Demais itens: resultados de busca de 31/10/2026, sem a página aberta (nível B ou C).
