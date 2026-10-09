# Mapa do Cuidado Rio-Clarense (marco 1)

> **Orientação:** este README é somente um mapa resumido do trabalho, não uma fonte de verdade nem uma base para decisões. Antes de decidir ou afirmar que algo existe, confira o código, os testes executados, os dados/fontes originais e o [registro de decisões de desenvolvimento](docs/registro_decisoes_desenvolvimento.md).

Comece escrevendo uma necessidade ou escolhendo uma porta: **Emprego, Saúde, Estudo, Filhos, Casamento e direitos, Violência ou Família**. A busca por palavras é processada localmente no navegador e abre caminhos, links oficiais e serviços cadastrados em Rio Claro/SP. Também é possível buscar serviços próximos pelo CEP; o CEP **nunca sai do navegador**. O catálogo está em expansão e informa quando faltam dados.

## Privacidade (por desenho)
- Consulta 100% no navegador; sem servidor próprio, sem cookies, sem localStorage, sem estatísticas.
- O índice de CEP guarda só `CEP → centro aproximado + raio`; nenhum endereço ou nome.
- O mapa começa **sem** imagens externas. As ruas (OpenStreetMap) só carregam se a usuária marcar a caixa.
- Barra fixa com 190 e Ligue 180, e botão "Sair rápido". Não prometemos que o uso é invisível: o histórico do navegador pode guardar a visita.

## Ver agora (modo demonstração)
Dê dois cliques em `abrir_site.bat` (Windows) ou rode:

    python -m http.server 8000 --directory web

e abra http://localhost:8000. Sem dados reais aparece a faixa amarela **DADOS ILUSTRATIVOS**; use os CEPs 00000-001, 00000-002 ou 00000-003.

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

## Conferir o catálogo contra as páginas oficiais
Com internet, rode `python pipeline/verificar_catalogo.py`. Ele abre a fonte de cada serviço e confere se os telefones cadastrados aparecem na página. "ATENCAO" não é erro certo: abra a fonte e confira.

## Acrescentar um serviço verificado
Edite `catalogo/servicos_manuais.csv`. Obrigatórios: `tipo` (creche, saude, assistencia, mulher, emprego_curso), `nome`, `fonte_url`, `verificado_em`. Com `cep`, o serviço entra no mapa; `abrangencia=municipal` faz aparecer para todas. Depois rode `python pipeline/servicos.py`.

## Busca por necessidade ("escreva e abrimos as portas")
Na tela inicial a pessoa toca numa "porta" (Emprego, Saúde, Estudo, Filhos, Casamento e direitos, Violência, Família) ou **escreve uma frase** ("preciso de emprego, mas tenho uma criança pequena"). A frase pode ter até 3 necessidades: o site mostra "Entendemos que você procura: [Emprego ✕] [Filhos ✕]" e a pessoa tira o que não serve. A regra está em `web/necessidades.js` e compara **palavras inteiras, radicais e expressões** (não pedaços de palavra, por isso "divagar" não vira "vaga"); palavras amplas como "dinheiro" e "bolsa" só valem dentro de expressões. "Violência" sempre vem primeiro e também é reconhecida de forma indireta ("ele me bate", "não deixa eu sair"). A lista de **47 frases de aceitação** em `web/tests/necessidades.test.js` é o roteiro da apresentação: para ensinar uma frase nova, acrescente-a lá primeiro. O texto digitado não sai do navegador.

## De mulher para mulher
Área para mulheres que oferecem serviços a outras mulheres. **Quem verifica é a Secretaria da Mulher**: o site não tem como garantir que só mulheres participam, então só publica cadastros já conferidos por ela (o que foi conferido, por quem e quando). `catalogo/mulher_para_mulher.csv` está vazio e a porta só aparece quando há cadastro válido; no modo demonstração aparecem dois exemplos marcados [DEMO]. O validador exige consentimento, só bairro (nunca endereço) e validade de até 180 dias. Papéis, fluxo, limites e roteiro para a banca em `docs/de_mulher_para_mulher.md`. Não prometemos segurança, não há pagamento nem notas.

## Abrir o protótipo com um clique (sem servidor, sem internet)
Dê dois cliques em **`abrir_demo.bat`** (Windows) ou abra `demo_unico/index.html` no navegador. Cada página é um arquivo único, com estilos, scripts e dados embutidos; os links entre telas funcionam (Mapa do Cuidado, Painel de Gestão, Inteligência Pública, De Mulher para Mulher). Depois de qualquer mudança em `web/`, rode `python pipeline/gerar_demo_unico.py` para atualizar. O `abrir_site.bat` (servidor local com Python) continua valendo para quem está desenvolvendo.

## Painel de Gestão (protótipo, dados fictícios)
Abra `web/gestao.html` (ou `gestao.html?visao=gestao`). Mostra o que as mulheres procuram por necessidade, buscas por mês, o funil do interesse ao resultado (inscrição → participação → conclusão → nova oportunidade), demanda × oferta por região, crianças de 0 a 4 anos por setor sobre a malha real de 408 setores, qualidade do catálogo (calculada ao vivo) e as buscas sem resultado. **Todos os números são fictícios**, gerados por `python pipeline/gerar_demo_gestao.py` (semente fixa, com invariantes conferidos). Contagens abaixo de 5 são ocultadas.

Há duas visões, para a decisão ainda em aberto sobre o que é público: a **Pública** mostra totais e tendências; a **Gestão** acrescenta o detalhe por região, o mapa em tabela e as buscas sem resultado. Gráficos em SVG puro (sem biblioteca nem rede), cores validadas com o validador da skill de visualização nos temas claro e escuro, cada gráfico com tabela equivalente.

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
