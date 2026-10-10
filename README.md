# Mapa do Cuidado Rio-Clarense (marco 1)

> **Orientação:** este README é somente um mapa resumido do trabalho, não uma fonte de verdade nem uma base para decisões. Antes de decidir ou afirmar que algo existe, confira o código, os testes executados, os dados/fontes originais e o [registro de decisões de desenvolvimento](docs/registro_decisoes_desenvolvimento.md).

Comece escrevendo uma necessidade ou escolhendo uma porta: **Emprego, Saúde, Estudo, Filhos, Casamento e direitos, Violência ou Família**. A busca por palavras é processada localmente no navegador e abre caminhos, links oficiais e serviços cadastrados em Rio Claro/SP. Também é possível buscar serviços próximos pelo CEP; o CEP **nunca sai do navegador**. O catálogo está em expansão e informa quando faltam dados.

## Privacidade (por desenho)
- Consulta 100% no navegador; sem servidor próprio, sem cookies, sem localStorage, sem estatísticas.
- O índice de CEP guarda só `CEP → centro aproximado + raio`; nenhum endereço ou nome.
- O mapa começa **sem** imagens externas. As ruas (OpenStreetMap) só carregam se a usuária marcar a caixa.
- Barra fixa com 190 e Ligue 180, e botão "Sair rápido". Não prometemos que o uso é invisível: o histórico do navegador pode guardar a visita.

## Ver agora (um clique)
Dê dois cliques em **`abrir_site.bat`** (Windows). Ele acha o Python, atualiza os dados oficiais de saúde e secretarias, escolhe uma porta livre (8000 a 8010), liga o servidor e abre o navegador. Para parar, feche a janela preta.

**Existe um único `.bat`: `abrir_site.bat`.** Ele serve o site e a API juntos e lê o `.env` sozinho (pesquisa real só se você configurar a chave). Outras tarefas são comandos, não arquivos soltos:

- Montar os dados reais de CEP e serviços (quando você tiver as fontes): `python pipeline/montar_dados.py`
- Ver o protótipo **sem Python e sem servidor**: abra `demo_unico/index.html` no navegador (depois de mudar `web/`, rode `python pipeline/gerar_demo_unico.py`).

Manualmente: `python pipeline/institucional.py` e `python pipeline/servidor.py`, ou `python -m http.server 8000 --directory web`, e abra http://localhost:8000. A faixa **DADOS ILUSTRATIVOS** da tela inicial (busca por CEP e mapa) só some quando existirem `cep_indice.json` e `servicos.json` reais; as páginas **Saúde** e **Secretarias** já usam dados reais e dizem isso na tela. CEPs de teste do modo demonstração: 00000-001, 00000-002 ou 00000-003.

## Saúde por bairro e secretarias (dados reais, sem CEP)
- `web/saude.html` — "Qual é a minha unidade de saúde?": o bairro digitado é comparado **no navegador** com a área de abrangência de cada UBS (guia da Fundação de Saúde). Mostra a UBS de referência, as unidades que ficam no bairro, urgências 24 horas, saúde da mulher e todas as unidades, com botão de ligar, horário, fonte e data. Quando as duas fontes oficiais **divergem** (ex.: telefone da UBS Vila Cristina), mostra as duas versões e pede confirmação, em vez de escolher uma.
- `web/secretarias.html` — 44 links oficiais (secretarias, canais de atendimento, páginas e documentos da Saúde) com filtro por assunto e busca. Cada link é **"conferido"** (página aberta numa data) ou **"só listado"** (consta no índice oficial, mas não foi reaberto).
- Dados: `catalogo/servicos_manuais.csv` (linhas `tipo=saude`, com as colunas `bairro`, `bairros` e `divergencia`) e `catalogo/secretarias.csv`. O gerador `pipeline/institucional.py` valida (fonte https, data real, "listado" nunca com data) e grava `web/dados/institucional.json`, que **vai para o GitHub** porque vem de CSV versionado. Para atualizar: edite o CSV e dê dois cliques em `abrir_site.bat`.

## Usar dados reais (na sua máquina, com internet)
Requer Python 3.10+ e `pip install pandas numpy`.
O CNES é a base completa baixada à mão do site do CNES e descompactada em `docs/cnes` (ou `dados/bruto/cnes`).

    python pipeline/baixar.py cnefe       # IBGE CNEFE de Rio Claro
    python pipeline/baixar.py escolas     # Censo Escolar do INEP (grande; retoma se cair)
    # se o INEP nao baixar: baixe o zip pelo navegador e rode
    python pipeline/baixar.py escolas --zip "C:\\caminho\\microdados_censo_escolar_2025.zip"
    python pipeline/inspecionar_arquivo.py dados/bruto   # mostra só a ESTRUTURA dos arquivos
    python pipeline/indice_cep.py         # gera web/dados/cep_indice.json
    python pipeline/cnes.py docs/cnes     # diagnóstico: só contagens, confere as regras do CNES
    python pipeline/servicos.py           # gera web/dados/servicos.json
    pip install pyshp
    python pipeline/setores.py caminho/SP_setores_CD2022.zip   # malha de setores de Rio Claro

Se um download automático falhar (os sites mudam), o script diz onde baixar à mão e em qual pasta colocar. Quando os dois JSON existirem, a faixa de demonstração some sozinha.

## Testes

    pip install pytest
    python -m pytest pipeline/tests -q
    node web/tests/acesso.test.js
    node web/tests/recomendar.test.js
    node web/tests/vagas.test.js
    node web/tests/necessidades.test.js
    node web/tests/api.test.js
    node web/tests/institucional.test.js
    node web/tests/dashboard.test.js

## Conferir o catálogo contra as páginas oficiais
Com internet, rode `python pipeline/verificar_catalogo.py`. Ele abre a fonte de cada serviço e confere se os telefones cadastrados aparecem na página. "ATENCAO" não é erro certo: abra a fonte e confira.

## Acrescentar um serviço verificado
Edite `catalogo/servicos_manuais.csv`. Obrigatórios: `tipo` (creche, saude, assistencia, mulher, emprego_curso), `nome`, `fonte_url`, `verificado_em`. Para `saude`: `subtipo` (urgencia, ubs, usf, caps, vigilancia), `bairro` (onde fica), `bairros` (bairros atendidos, separados por `;`) e, se as fontes discordarem, `divergencia`. Com `cep`, o serviço entra no mapa; `abrangencia=municipal` faz aparecer para todas. Depois rode `python pipeline/servicos.py`.

## Busca por necessidade ("escreva e abrimos as portas")
Na tela inicial a pessoa toca numa "porta" (Emprego, Saúde, Estudo, Filhos, Casamento e direitos, Violência, Família) ou **escreve uma frase** ("preciso de emprego, mas tenho uma criança pequena"). A frase pode ter até 3 necessidades: o site mostra "Entendemos que você procura: [Emprego ✕] [Filhos ✕]" e a pessoa tira o que não serve. A regra está em `web/necessidades.js` e compara **palavras inteiras, radicais e expressões** (não pedaços de palavra, por isso "divagar" não vira "vaga"); palavras amplas como "dinheiro" e "bolsa" só valem dentro de expressões. "Violência" sempre vem primeiro e também é reconhecida de forma indireta ("ele me bate", "não deixa eu sair"). A lista de **47 frases de aceitação** em `web/tests/necessidades.test.js` é o roteiro da apresentação: para ensinar uma frase nova, acrescente-a lá primeiro. O texto digitado não sai do navegador.

## De mulher para mulher
Área para mulheres que oferecem serviços a outras mulheres. **Quem verifica é a Secretaria da Mulher**: o site não tem como garantir que só mulheres participam, então só publica cadastros já conferidos por ela (o que foi conferido, por quem e quando). `catalogo/mulher_para_mulher.csv` está vazio e a porta só aparece quando há cadastro válido; no modo demonstração aparecem dois exemplos marcados [DEMO]. O validador exige consentimento, só bairro (nunca endereço) e validade de até 180 dias. Papéis, fluxo, limites e roteiro para a banca em `docs/de_mulher_para_mulher.md`. Não prometemos segurança, não há pagamento nem notas.

## Dados e pesquisas reais (API)
O MISM3 é funcional com ou sem usuárias: o site tem uma **camada de dados plugável** (`web/api.js`). Sem servidor, lê os arquivos de `web/dados/`; com o servidor (`abrir_site.bat` ou `python pipeline/servidor.py`) fala com a API e, se ela falhar, volta para os arquivos. Para **pesquisas reais**: o `provedor_gemini.py` usa o **Google Gemini com Pesquisa Google, a mesma API do MISM2** (coloque `GEMINI_API_KEY` e `MISM3_PROVEDOR=gemini` num `.env`, que o git ignora), e só aproveita o que tem fonte. Ou escreva o seu em `provedor_pesquisa.py` (modelo: `provedor_pesquisa.exemplo.py`). A chave nunca vai ao navegador. Frases sobre violência nunca vão à API. Contrato, regras e limites em `docs/api_contrato.md`.

## Abrir o protótipo com um clique (sem servidor, sem internet)
Abra `demo_unico/index.html` no navegador (duplo clique). Cada página é um arquivo único, com estilos, scripts e dados embutidos; os links entre telas funcionam (Mapa do Cuidado, Painel de Gestão, Inteligência Pública, De Mulher para Mulher). Depois de qualquer mudança em `web/`, rode `python pipeline/gerar_demo_unico.py` para atualizar. O `abrir_site.bat` (servidor local com Python) é o caminho normal.

## Painel de Gestão (protótipo, dados fictícios)
Abra `web/gestao.html` (ou `gestao.html?visao=gestao`). Mostra necessidades, evolução mensal, funil, demanda × oferta, malha de setores, qualidade do catálogo, buscas sem resultado e **cartões de próximos passos para a gestão** (sinal, ação a validar, responsável sugerido, indicador e o que confirmar antes de decidir). **Todos os números de demonstração são fictícios**; a malha real de 408 setores é usada só como geometria e os valores de crianças por setor são inventados.

As visões Pública e Gestão são apenas modos de apresentação no navegador. **Não há autenticação:** o seletor não protege conteúdo e o protótipo não pode receber dados reais. O gerador aplica supressão de valores fictícios menores que cinco no próprio JSON, mas essa regra isolada não garante anonimato para dados reais. Leia `docs/painel_gestao_criterios.md` antes de alterar ou reutilizar o painel.

## Trilha de autonomia (recomendação sem banco de dados)
Depois de buscar o CEP, a usuária escolhe um objetivo (trabalhar, fazer curso, empreender) e vê os serviços de trabalho/renda em ordem, cada um com o **porquê** (objetivo confirmado no cadastro, gratuidade, distância). É uma regra aberta e explicável em `web/recomendar.js`, não um modelo treinado, e roda no navegador: nada é gravado. Só entra quem tem `objetivos` preenchido no catálogo (`trabalhar`, `curso`, `empreender`, separados por `;`) e `gratuito=sim` apenas quando a página oficial diz. Sem a informação confirmada, o serviço não é sugerido para o objetivo: não adivinhamos.

Decisão de projeto: **não usamos conta, e-mail, perfil salvo nem PostgreSQL por enquanto**, para manter a promessa de privacidade do marco 1. Banco só se justifica quando houver um parceiro que cadastre turmas/vagas (veja `docs/decisoes.md`).

## Concursos e processos seletivos da Prefeitura
Preencha `catalogo/vagas_publicas.csv` com o **link do edital oficial** (Prefeitura ou banca) e rode `python pipeline/vagas.py`. O validador recusa sites de notícia e agregadores, datas inválidas e `http` sem `s`. A seção só aparece no site se houver registros, e "aberto/encerrado" é calculado no navegador pela data de hoje.

## Escolas com Educação Infantil
Coloque o CSV "Tabela da lista das escolas" do INEP em `docs/` e rode `python pipeline/servicos.py`. Aparecem como **Escolas com Educação Infantil (não confirma creche)**: o arquivo não diz se há berçário nem vagas.

## Tarefas e pedidos formais
`docs/inspiracoes_internacionais.md` (o que França, Reino Unido, Alemanha, EUA e São Paulo fazem e o que adaptar), `docs/tarefas_do_grupo.md` (o que cada pessoa pode fazer agora) e `docs/pedidos_LAI.md` (rascunhos dos pedidos de acesso à informação).

## Próximos marcos
2. Setores censitários + Censo 2022 (crianças de 0 a 4 anos): "desertos de cuidado" e simulador de nova creche.
3. Relatórios automáticos explicados; vagas e cursos; transporte.

Veja o [registro de decisões de desenvolvimento](docs/registro_decisoes_desenvolvimento.md), o [protótipo De Mulher para Mulher](web/rede-mulheres.html), o [painel conceitual Inteligência Pública](web/inteligencia-publica.html) e o [roteiro de demonstração com três histórias fictícias](docs/roteiro_demo_mism3.md), `docs/inventario_de_fontes.md`, a [análise competitiva e roadmap funcional](docs/analise_competitiva_mism3.md), o [plano de fontes externas e expansão](docs/plano_fontes_externas_e_expansao.md) e o [benchmark externo de ideias funcionais](docs/benchmark_externo_ideias_funcionais.md), que transforma referências de outros produtos em melhorias priorizadas para o MISM3.
