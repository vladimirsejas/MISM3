# Mapa do Cuidado Rio-Clarense (marco 1)

> Este README registra **o que existe e foi verificado**; não é plano nem diretriz. Decisões e histórico: [registro de decisões](docs/registro_decisoes_desenvolvimento.md). Última verificação: 11/10/2026.

A tela inicial (**Mulher em Rede**) acolhe com **"Você não está sozinha"** e uma ilustração, e traz as **sete portas** (Trabalho, Educação, Saúde, Direitos, Moradia, Assistência Social e De Mulher para Mulher) em cartões coloridos com uma frase curta, um botão **Emergência** que abre o painel de contatos, os **contatos essenciais** (190, 192, 180 e 100, mais CRAM, Secretaria da Mulher, UPA, Conselho Tutelar e CREAS, lidos do catálogo verificado) e um **acesso rápido** com atalhos diretos para seções (por exemplo, `#educacao/educacao-escolas`). O detalhe de cada área (serviços, endereços, horários, critérios) só aparece depois de escolhê-la. Onde há dados de CEP reais, também é possível buscar serviços próximos; o CEP **nunca sai do navegador**. A paleta (rosa, pêssego e verde-sálvia) tem contraste conferido por teste: texto principal ≥ 13:1, texto suave ≥ 5,5:1 e botões e links ≥ 6,5:1.

## Trabalho: plano e currículo
A área Trabalho abre com perguntas curtas (crianças e cuidado, dinheiro para o básico, deslocamento, ensino médio, currículo, objetivo) e monta um plano de passos ordenado: primeiro o cuidado das crianças e o apoio da assistência social quando necessários, depois deslocamento, currículo, cursos ou vagas. Cada passo diz o que fazer, por que está naquela posição e o que tentar se não der certo. O plano não diz se a pessoa tem direito a algo nem garante vaga ou crédito. Há também um montador de currículo, e ambos podem ser impressos ou salvos em PDF. Nada é enviado nem gravado no aparelho: o conteúdo fica na memória da página e some ao voltar ao Início. Os serviços de ensino (SENAI Rio Claro, Senac Rio Claro, Etec Prof. Armando Bayeux da Silva e o catálogo geral das Etecs, dois cursos superiores de tecnologia da Fatec Rio Claro, SESI Rio Claro com a EJA gratuita, a Faculdade SESI de Educação e o SEST SENAT) ficam na área **Educação**, em cinco grupos: conclusão dos estudos e graduação (SESI), estudar e se qualificar ao mesmo tempo (Ensino Médio integrado ao técnico da Etec e as ofertas do SESI com o SENAI), cursos profissionalizantes (qualificação profissional: SENAI, Senac, SEST SENAT), cursos técnicos (Etec, que também está no grupo conjunto) e cursos superiores de tecnologia (Fatec). A área Trabalho reúne emprego, renda, os cursos de qualificação do Fundo Social e também os cursos profissionalizantes e técnicos (SENAI, Senac, SEST SENAT e Etec), que servem tanto a quem está saindo da escola quanto a quem já se formou e quer fazer esses cursos; ela aponta para a Educação para a conclusão dos estudos (EJA), a Faculdade SESI e os cursos superiores da Fatec, que ficam só na Educação. Os dados vêm de páginas oficiais arquivadas em `docs/documetacao`. A gratuidade do SESI em geral foi informada pelo autor; as páginas impressas a confirmam para a EJA e a graduação. A Faculdade SESI de Educação fica em São Paulo (capital), com aulas presenciais à noite segundo uma notícia de 2021; as regras de 2027 precisam ser conferidas no edital. No SEST SENAT, o endereço (Rodovia Washington Luís, km 176, Jardim Rio Claro, CEP 13503-750) e o telefone (19) 3522-1710 da unidade foram confirmados por telefone pelo autor, e há o 0800 700 9393 da central nacional; os cursos mudam a cada período e por isso não são listados: o site aponta para a página de cursos abertos. Segundo o autor, a página da cidade só abre para sócios. O catálogo geral das Etecs é do estado, e a Etec local tem cartão próprio.

## Educação: filhos e você
A área Educação abre com uma caixa que explica o que há na página: **para os seus filhos** (matrícula, transferência, vagas, calendário de 2027 e apoio a quem cria os filhos sozinha), **para você** (EJA, faculdade e cursos profissionalizantes e técnicos) e **emprego e renda** (leva à área Trabalho). Os botões da caixa rolam até cada parte.

O guia dos filhos tem cartões sobre: quem cuida de cada etapa, o caminho de cada tipo de escola (municipal, estadual, particular, SESI, EJA), a matrícula pelo aplicativo CADU (caminho conferido na publicação oficial da Prefeitura de 17/10/2025), a primeira matrícula, os documentos por situação, a transferência, como procurar vaga, o que fazer se a vaga for negada, o **calendário de 2027 das escolas estaduais** (Resolução SEDUC nº 80/2026, texto oficial conferido) e as **férias de 2027 e a Copa do Mundo Feminina** (Lei nº 15.421/2026, art. 67, e Parecer CNE/CEB nº 7/2026, homologado). O que veio só de pesquisa está marcado como não conferido.

**Escolas municipais:** a seção "Escolas municipais de Rio Claro" (recolhida, com busca por nome ou bairro) traz as **68 escolas** da página oficial "Unidades de ensino" da Prefeitura (11/10/2026), com endereço e telefone. A página não diz quais etapas cada escola atende nem se há vaga, e o site avisa isso em cada cartão. As 5 unidades do "Programa Integra" da mesma página não foram cadastradas (a natureza delas não foi confirmada).

**Ainda não confirmado pela Secretaria:** o calendário e o procedimento de matrícula de 2027 na rede **municipal**, como pedir vaga em creche quando não há disponibilidade e os documentos exigidos hoje. A lista de escolas estaduais também não está no site.

## Sobre este projeto
O Mulher em Rede (MISM3) é um **estudo acadêmico de demonstração**: não é vendido, não tem fins comerciais e **não é um site oficial da Prefeitura de Rio Claro**. Ele é um mostruário do que se pode fazer para reunir, de forma clara e segura, informações públicas da cidade; a ideia é que, no futuro, possa ser adotado pela Prefeitura. O rodapé do site diz isso e mostra o **brasão de Rio Claro em versão estilizada** (`web/img/brasao-estilizado.webp`, 60 KB), apenas como ilustração. Se o projeto for adotado oficialmente, o brasão estilizado deve ser trocado pelo arquivo oficial da Prefeitura, com autorização.

## Idade da informação
Cada serviço mostra a fonte, a data de verificação e há quantos dias ela foi feita. Acima de 90 dias, ou sem data válida, aparece o aviso "Esta informação pode ter mudado. Confirme telefone, endereço e horário na fonte antes de ir." O aviso não diz que o dado está errado; só informa que a conferência é antiga.

## Estado dos dados
- Catálogo verificado à mão (`catalogo/servicos_manuais.csv`): 162 registros: 45 de saúde, 25 de assistência, 18 de emprego e cursos, 5 de mulher e 69 de educação infantil (a Secretaria da Educação e 68 escolas municipais). As unidades de saúde vêm do CNESNet (códigos CNES, 51 estabelecimentos mantidos pela Fundação Municipal de Saúde) e da página de endereços da Fundação; 43 têm endereço e 41 têm telefone.
- Os números 977 estabelecimentos no CNES e 45 publicados foram confirmados pelo autor, que trabalha na Fundação Municipal de Saúde; a base completa do CNES não está versionada.
- Sem `servicos.json` e `cep_indice.json` (gerados na máquina de quem roda o pipeline), o site usa só o catálogo verificado e não oferece busca por CEP. Em 09/10/2026 foram gerados localmente 1.387 CEPs a partir de 104.236 linhas do CNEFE e lidos 142 registros de escolas do INEP (69 com Educação Infantil, nenhum campo identifica creche).

## Privacidade (por desenho)
- Consulta 100% no navegador; sem servidor próprio, sem cookies, sem localStorage, sem estatísticas.
- O índice de CEP guarda só `CEP → centro aproximado + raio`; nenhum endereço ou nome.
- O mapa começa **sem** imagens externas. As ruas (OpenStreetMap) só carregam se a usuária marcar a caixa.
- Botão "Em perigo agora?" abre os contatos oficiais (190, 192, 193, 180, 100, 188) e um botão para sair da página. Não prometemos que o uso é invisível: "sair" não apaga o histórico do navegador.

## Abrir o sistema
Dê dois cliques em `abrir_site.bat` (Windows). Ele procura o Python (`py` ou `python`), escolhe uma porta livre entre 8000 e 8010, liga o servidor da pasta `web` e abre o navegador quando o servidor está pronto; se faltar o Python ou as portas estiverem ocupadas, a janela explica o problema e fica aberta. Para parar, feche a janela ou aperte Ctrl+C. Ou rode à mão:

    python -m http.server 8000 --directory web

e abra http://localhost:8000. Sem o pipeline completo, o site usa `web/dados/catalogo_manual.json` (serviços verificados à mão, com fonte e data) e avisa o que falta. Para regenerar esse catálogo depois de editar o CSV: `python pipeline/servicos.py --somente-manual`.


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

Se um download automático falhar (os sites mudam), o script diz onde baixar à mão e em qual pasta colocar. O catálogo verificado (`catalogo_manual.json`) vale sempre. Com `servicos.json` gerado, o site **acrescenta** as unidades do CNES e do Censo Escolar que não estão no catálogo (sem duplicar as já cadastradas à mão com o código CNES). Com `cep_indice.json`, o site oferece a busca por CEP. Depois de editar `catalogo/servicos_manuais.csv`, rode `python pipeline/servicos.py --somente-manual` para atualizar o catálogo.

## Levar os dados gerados na sua máquina para o GitHub
Os arquivos gerados pelo pipeline (`web/dados/cep_indice.json`, `web/dados/servicos.json`) e a documentação nova ficam só no seu computador até serem versionados. O script `pipeline/preparar_versionamento.py` faz isso com segurança, **sem enviar nada para a internet**: confere o tamanho (o GitHub recusa 100 MB ou mais), procura possíveis CPFs, avisa sobre dado bruto e só adiciona ao Git os arquivos classificados `PODE`.

    python pipeline/preparar_versionamento.py            # só mostra o relatório; não altera nada
    python pipeline/preparar_versionamento.py --filtrar-inep docs\educacao\microdados_ed_basica_2025.csv   # recorte de Rio Claro (arquivo pequeno)
    python pipeline/preparar_versionamento.py --aplicar  # git add somente dos arquivos PODE
    git commit -m "Adiciona dados gerados e documentação"
    git push

Os microdados nacionais do INEP (`microdados_ed_basica_AAAA.csv`) ficam no `.gitignore`; versione só o recorte de Rio Claro (`microdados_ed_basica_rio_claro.csv`). O pipeline lê qualquer arquivo `microdados_ed_basica*.csv` em `docs/`, então o recorte funciona no lugar do arquivo completo.

## Testes

    pip install pytest
    python -m pytest pipeline/tests -q      # 39 passaram em 11/10/2026
    node web/tests/acesso.test.js           # passou (inclui a regra dos 90 dias)
    node web/tests/necessidades.test.js     # 50 cenários passaram
    node web/tests/dashboard.test.js        # passou: 7 portas, emergência, sem demonstração, links locais
    node web/tests/jornada.test.js          # passou: ordem do plano, fontes, promessas proibidas, currículo

No navegador (Chromium, 390 px): a área Saúde abre com 45 cartões; a jornada de Trabalho gera o plano de 6 passos no caso de uma mulher com crianças, sem creche, sem dinheiro e sem transporte, preserva o plano ao abrir um link e voltar, escapa texto digitado no currículo e imprime só a folha; sem erro de JavaScript. Não verificados: mapa por CEP com dados reais, leitor de tela, contraste.

## Conferir o catálogo contra as páginas oficiais
Com internet, rode `python pipeline/verificar_catalogo.py`. Ele abre a fonte de cada serviço e confere se os telefones cadastrados aparecem na página. "ATENCAO" não é erro certo: abra a fonte e confira.

## Acrescentar um serviço verificado
Edite `catalogo/servicos_manuais.csv`. Obrigatórios: `tipo` (creche, saude, assistencia, mulher, emprego_curso), `nome`, `fonte_url`, `verificado_em`. Com `cep`, o serviço entra no mapa; `abrangencia=municipal` faz aparecer para todas. Depois rode `python pipeline/servicos.py`.

Veja o [registro de decisões de desenvolvimento](docs/registro_decisoes_desenvolvimento.md), `docs/inventario_de_fontes.md`, a [análise competitiva](docs/analise_competitiva_mism3.md), o [plano de fontes externas](docs/plano_fontes_externas_e_expansao.md) e o [benchmark externo](docs/benchmark_externo_ideias_funcionais.md).

As páginas oficiais usadas nos cadastros estão arquivadas em PDF em [docs/documetacao](docs/documetacao/LEIA-ME.md), com a origem e a data de cada uma.
