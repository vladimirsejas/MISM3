# Mulher em Rede (MISM3) — marco 1

> Este README registra **o que existe e foi verificado**; não é plano nem diretriz. Decisões e histórico: [registro de decisões](docs/registro_decisoes_desenvolvimento.md). Última verificação: 11/10/2026.

> **Princípio:** o Mulher em Rede oferece orientação baseada nas evidências disponíveis. Não substitui a avaliação de profissionais, não determina automaticamente as necessidades de uma pessoa e explicita a origem, a data e os limites de cada informação. **O que existe, o que foi testado e o que ainda é proposta:** [estado do projeto](docs/estado_do_projeto.md). Validação com usuárias: [roteiro](docs/roteiro_validacao_navegacao.md) (ainda não realizada).

A tela inicial (**Mulher em Rede**) acolhe com **"Você não está sozinha"** e uma ilustração, e traz as **sete portas** (Trabalho, Educação, Saúde, Direitos, Moradia, Assistência Social e Entre Mulheres) em cartões coloridos com uma frase curta, um botão **Emergência** que abre o painel de contatos, os **contatos essenciais** (190, 192, 180 e 100, mais CRAM, Secretaria da Mulher, UPA, Conselho Tutelar e CREAS, lidos do catálogo verificado) e um **acesso rápido** com atalhos diretos para seções (por exemplo, `#educacao/educacao-escolas`). O detalhe de cada área (serviços, endereços, horários, critérios) só aparece depois de escolhê-la. Onde há dados de CEP reais, também é possível buscar serviços próximos; o CEP **nunca sai do navegador**. A paleta (rosa, pêssego e verde-sálvia) tem contraste conferido por teste: texto principal ≥ 13:1, texto suave ≥ 5,5:1 e botões e links ≥ 6,5:1.

## Trabalho: plano e currículo
A tela inicial tem a caixa **"Conte com suas palavras"**: um modelo de aprendizado de máquina, treinado pela equipe e executado no aparelho (`web/ia.js`), sugere por onde começar. O texto digitado e o CEP não são enviados pelo orientador (não há API de IA nem servidor); hoje a única requisição externa possível é a camada de ruas do mapa (OpenStreetMap), que só carrega se a usuária marcar a opção e avisa disso antes (o envio de respostas do questionário existe no código, mas está desligado em `web/dados/coleta.json`). Arquitetura e métricas: `docs/arquitetura_ia.md` e `docs/ia/avaliacao_modelo_necessidades.md`. Para retreinar: `python pipeline/treinar_necessidades.py` (precisa de scikit-learn).

O **Questionário** (`#questionario`) tem 19 perguntas de alternativas, calcula índices de 0 a 100 em 5 temas e devolve até 3 caminhos com serviços reais. Foi pensado para também gerar dados sem identificação para a Secretaria da Mulher, mas **a coleta está desligada** (nada é enviado). Detalhes em `docs/questionario_observatorio.md`.

O plano do próximo ciclo está em `docs/plano_proximo_ciclo.md` e o roteiro para conferir os contatos de proteção (Patrulha; o CRAM foi retirado por falta de fonte confiável) em `docs/roteiro_conferir_protecao.md`.

Para a Secretaria da Mulher há um **painel com dados de teste**, dentro do dashboard (`#painel`, aberto pelo bloco "Para a gestão" no fim da tela inicial; o painel real exigirá login) e um script de **análise territorial** (`pipeline/analise_territorial.py`, ainda sem dados suficientes). Ver `docs/painel_e_analise_territorial.md` e `docs/roteiro_validacao_questionario.md`.

A área Trabalho abre com perguntas curtas (crianças e cuidado, dinheiro para o básico, deslocamento, ensino médio, currículo, objetivo) e monta um plano de passos ordenado: primeiro o cuidado das crianças e o apoio da assistência social quando necessários, depois deslocamento, currículo, cursos ou vagas. Cada passo diz o que fazer, por que está naquela posição e o que tentar se não der certo. O plano não diz se a pessoa tem direito a algo nem garante vaga ou crédito. Há também um montador de currículo, e ambos podem ser impressos ou salvos em PDF. Nada é enviado nem gravado no aparelho: o conteúdo fica na memória da página e some ao voltar ao Início. Os serviços de ensino (SENAI Rio Claro, Senac Rio Claro, Etec Prof. Armando Bayeux da Silva e o catálogo geral das Etecs, dois cursos superiores de tecnologia da Fatec Rio Claro, SESI Rio Claro com a EJA gratuita, a Faculdade SESI de Educação e o SEST SENAT) ficam na área **Educação**, em cinco grupos: conclusão dos estudos e graduação (SESI), estudar e se qualificar ao mesmo tempo (Ensino Médio integrado ao técnico da Etec e as ofertas do SESI com o SENAI), cursos profissionalizantes (qualificação profissional: SENAI, Senac, SEST SENAT), cursos técnicos (Etec, que também está no grupo conjunto) e cursos superiores de tecnologia (Fatec). A área Trabalho reúne emprego, renda, os cursos de qualificação do Fundo Social e também os cursos profissionalizantes e técnicos (SENAI, Senac, SEST SENAT e Etec), que servem tanto a quem está saindo da escola quanto a quem já se formou e quer fazer esses cursos; ela aponta para a Educação para a conclusão dos estudos (EJA), a Faculdade SESI e os cursos superiores da Fatec, que ficam só na Educação. Os dados vêm de páginas oficiais arquivadas em `docs/documetacao`. A gratuidade do SESI em geral foi informada pelo autor; as páginas impressas a confirmam para a EJA e a graduação. A Faculdade SESI de Educação fica em São Paulo (capital), com aulas presenciais à noite segundo uma notícia de 2021; as regras de 2027 precisam ser conferidas no edital. No SEST SENAT, o endereço (Rodovia Washington Luís, km 176, Jardim Rio Claro, CEP 13503-750) e o telefone (19) 3522-1710 da unidade foram confirmados por telefone pelo autor, e há o 0800 700 9393 da central nacional; os cursos mudam a cada período e por isso não são listados: o site aponta para a página de cursos abertos. Segundo o autor, a página da cidade só abre para sócios. O catálogo geral das Etecs é do estado, e a Etec local tem cartão próprio.

## Educação: filhos e você
A área Educação abre com uma caixa que explica o que há na página: **para os seus filhos** (matrícula, transferência, vagas, calendário de 2027 e apoio a quem cria os filhos sozinha), **para você** (EJA, faculdade e cursos profissionalizantes e técnicos) e **emprego e renda** (leva à área Trabalho). Os botões da caixa rolam até cada parte.

O guia dos filhos tem cartões sobre: quem cuida de cada etapa, o caminho de cada tipo de escola (municipal, estadual, particular, SESI, EJA), a matrícula pelo aplicativo CADU (caminho conferido na publicação oficial da Prefeitura de 17/10/2025), a primeira matrícula, os documentos por situação, a transferência, como procurar vaga, o que fazer se a vaga for negada, o **calendário de 2027 das escolas estaduais** (Resolução SEDUC nº 80/2026, texto oficial conferido) e as **férias de 2027 e a Copa do Mundo Feminina** (Lei nº 15.421/2026, art. 67, e Parecer CNE/CEB nº 7/2026, homologado). O que veio só de pesquisa está marcado como não conferido.

**Escolas municipais:** a seção "Escolas municipais de Rio Claro" (recolhida, com busca por nome ou bairro) traz as **68 escolas** da página oficial "Unidades de ensino" da Prefeitura (11/10/2026), com endereço e telefone. A página não diz quais etapas cada escola atende nem se há vaga, e o site avisa isso em cada cartão. As 5 unidades do "Programa Integra" da mesma página não foram cadastradas (a natureza delas não foi confirmada).

**Ainda não confirmado pela Secretaria:** o calendário e o procedimento de matrícula de 2027 na rede **municipal**, como pedir vaga em creche quando não há disponibilidade e os documentos exigidos hoje. A lista de escolas estaduais também não está no site.

## Sobre este projeto
O Mulher em Rede (MISM3) é um **estudo acadêmico de demonstração**: não é vendido, não tem fins comerciais e **não é um site oficial da Prefeitura de Rio Claro**. Ele é um mostruário do que se pode fazer para reunir, de forma clara e segura, informações públicas da cidade; a ideia é que, no futuro, possa ser adotado pela Prefeitura. O rodapé do site diz isso e mostra o **brasão de Rio Claro em versão estilizada** (`web/img/brasao-estilizado.webp`, 60 KB), apenas como ilustração. Se o projeto for adotado oficialmente, o brasão estilizado deve ser trocado pelo arquivo oficial da Prefeitura, com autorização.

## Transporte: horários de ônibus
A área **Transporte** (`#transporte`, atalho "Horários de ônibus" na tela inicial) traz os horários da **SOU Transportes** de **5 linhas** (01 Bela Vista, 06 Cervezão, 07 Circular I, 08 Circular 2 e 09 Paineiras), com **382 horários**. Para cada linha e sentido, mostra as **próximas saídas de hoje** (pelo relógio do aparelho), os horários de dias úteis, sábados e domingos, e o **trajeto de cada variante** como a SOU escreve. Avisa que as páginas são de 09/10/2026 e valem **até 04/02/2027** (e avisa quando essa data passa), que feriados não constam e **o que falta**: a Circular I só tem a Volta, e a linha Arco-Íris/Mãe Preta e as demais ainda não foram cadastradas. Os PDFs da SOU eram impressões de imagem; os horários foram lidos e conferidos por três leituras independentes (veja `docs/transporte/README.md`). Para atualizar: edite `catalogo/horarios_onibus.txt` e rode `python pipeline/horarios_onibus.py` (ele recusa horário inválido, fora de ordem ou repetido).

## Tela inicial: questionário e Secretaria da Mulher
Abaixo das sete portas há dois cartões de destaque e, em seguida, o **mapa de serviços** (busca de CRAS por bairro, CEP, mapa e "mais perto"). Os cartões de destaque são: o **Questionário** (ajuda a Secretaria da Mulher a conhecer as mulheres de Rio Claro) e a **Secretaria da Mulher**, cujo endereço, telefone e horário vêm do catálogo verificado (`man-secretaria-mulher`), sem digitar o mesmo dado duas vezes. O painel da Secretaria (`painel-secretaria.html`) segue fora do site público, com dados de teste.

## Saúde: dependência química e grupos de ajuda mútua
Na área Saúde, seção "Meu filho ou familiar usa álcool ou drogas", há um cartão que explica para que serve cada tipo de grupo (AA, NA, Al-Anon, Alateen, Amor Exigente, e a diferença para o CAPS AD) e os grupos de Rio Claro informados por contato direto: **NA Grupo Gratidão**, **NA Grupo Viver Limpo** e **Amor Exigente**. São grupos anônimos, sem cadastro público: cada cartão diz que a fonte não é oficial e pede para confirmar dia e horário. Não publicamos telefones pessoais de integrantes. Os cartões ficam em `web/areas.js`.

## Mapa de serviços
O mapa está **dentro da tela inicial** (seção "Mapa de serviços", logo abaixo das portas; o botão "Ver o mapa de serviços" do topo rola até ela), com filtros por tipo, busca por nome, endereço ou bairro e a lista de todos os serviços. Não há página nem comando separado: tudo abre no mesmo endereço. Ele mostra num mapa todos os serviços do catálogo que têm localização, com filtro por tipo (cor **e** forma diferentes), busca por nome, endereço ou bairro e telefone, horário, fonte e data em cada ponto. **Ponto cheio:** posição pelo endereço. **Ponto vazado:** posição aproximada pelo CEP (só quando o CEP é preciso, raio de até 800 m). Serviço sem localização aparece só na lista, com o link "Ver no Google Maps" (abre outra aba e leva só o endereço do serviço); nenhum ponto é inventado. O CEP digitado serve só para marcar uma região aproximada e ordenar por distância **em linha reta**; não é guardado nem vai para a barra de endereço. Usa o Leaflet local e os dados que já existem (`catalogo_manual.json`, `cep_indice.json`, `setores.geojson` só como contorno). Mais pontos aparecem à medida que `python pipeline/atualizar_localizacoes.py` localiza mais serviços. Ao informar o CEP, o topo da página mostra **o serviço mais perto de cada tipo** (só entre os que têm posição conhecida; a distância é em linha reta). Os CRAS achados pela busca de bairro têm o botão "Mostrar no mapa" quando a posição do CRAS é conhecida.

Na mesma página, a caixa **"Qual CRAS atende o meu bairro?"** usa só a lista oficial de bairros que a Prefeitura publica para cada CRAS (campo `bairros` do catálogo; nada de adivinhar por distância). Ela entende "Jd." e "Jardim", acento e sufixos como "I e II"; quando o nome só bate sem o "Jd./Vila" (podem ser bairros diferentes) ou existe em mais de um CRAS, mostra todos os nomes oficiais encontrados e pede confirmação por telefone. Apelidos de bairro (como Cervezão) ficam em `web/dados/bairros_apelidos.json`: **só os marcados "confirmado" são usados**; os "a_confirmar" não mudam nenhum resultado, e um teste confere que cada nome para onde apontam existe nas fontes do projeto.

## Jornadas de orientação
Três áreas têm um plano guiado: **Trabalho**, **Educação** e **Assistência Social**. A pessoa responde poucas perguntas, uma de cada vez (pode pular), e recebe um plano curto: em cada passo, **por que começar por ali**, uma ação, o telefone do catálogo, **o que levar e o que perguntar** e **o que fazer se não der certo**. Nada é enviado nem guardado no aparelho.

- **Trabalho** (`web/jornada.js`): emprego, curso ou renda por conta própria, com montador de currículo.
- **Educação** (`web/jornada-educacao.js`): duas ramificações. *Para o meu filho:* pedir a vaga (pelo CADU, ou pessoalmente na Secretaria se a mãe não consegue usar o aplicativo), acompanhar a fila e pedir ajuda se a vaga for negada ou demorar (Conselho Tutelar, Defensoria, Promotoria). *Para mim:* terminar o ensino médio (EJA), curso técnico ou gratuito, cursinho e faculdade.
- **Assistência Social** (`web/jornada-assistencia.js`): três caminhos. *Falta dinheiro ou apoio no básico:* CRAS do bairro (com link para "Qual CRAS atende o meu bairro?") e outros canais. *Direitos violados:* CREAS, Conselho Tutelar (Sul e Norte) e Disque 100, com o Ligue 180 e a área Direitos para a mulher em violência. *Convivência* para filhos ou pessoas idosas. Não fala de benefício específico (por exemplo CadÚnico): o projeto não tem fonte, então manda perguntar ao CRAS.
- Todo texto vem do que a área e o catálogo verificado já trazem, com os mesmos avisos ("confirme na Secretaria", "não garante vaga"). Os planos nunca anunciam vaga ou inscrição aberta, e o PEJA da Unesp (que hoje atende outro público) não é recomendado.
- Para criar outra jornada: `Jornada.registrar({...})` com as perguntas, as regras de quando cada uma se aplica e a função que monta os passos; o motor, a tela e o estado por jornada já são compartilhados. Testes: `web/tests/jornada.test.js`, `jornada_educacao.test.js` e `jornada_assistencia.test.js` (conferem todas as combinações de respostas, as fontes dos links e telefones e a ausência de promessas).

## Idade da informação
Cada serviço mostra a fonte, a data de verificação e há quantos dias ela foi feita. Acima de 90 dias, ou sem data válida, aparece o aviso "Esta informação pode ter mudado. Confirme telefone, endereço e horário na fonte antes de ir." O aviso não diz que o dado está errado; só informa que a conferência é antiga.

## Inteligência do sistema: como o MISM3 orienta
Uma ideia só atravessa o projeto: **os dados verificados são a inteligência; a IA é a interface**. Nada aqui usa modelo de linguagem, nada sai do aparelho e nada promete vaga ou benefício. Em camadas:
1. **Entender o que a mulher escreve** (`web/ia.js`, `web/necessidades.js`): modelo de aprendizado de máquina (TF-IDF + regressão logística, treinado em `pipeline/treinar_necessidades.py`) somado a regras de palavras-chave. Álcool e drogas são tratados como **questão de saúde** (dependência é doença) e levam direto à seção da Saúde com o CAPS AD e os grupos de ajuda mútua.
2. **Meu Plano** (`web/plano.js`): quando o texto revela mais de uma necessidade, o resultado vira um plano em **ordem de urgência** (segurança, apoio básico, saúde, moradia, filhos, direitos, dívidas, trabalho, estudo), com "por que nesta posição" e "se não der certo". A ordem é uma regra fixa e explicável, não uma nota do modelo.
3. **Orientador: tela inicial e caixa de dúvida de cada área** (`web/orientar.js`, `web/perigo.js`, `web/orientacao-ui.js`; índice gerado por `pipeline/indice_orientacao.py`): a mulher escreve do seu jeito e recebe o serviço, a seção ou a ferramenta certa, com telefone, endereço, data da última conferência e **por que apareceu**. Busca híbrida (palavras, letras, significado por LSA e intenção do classificador) sobre 161 destinos; tolera erros de digitação; se não acha, diz que não achou e mostra as áreas. Uma camada de segurança (regras mais um detector aprendido, `pipeline/treinar_perigo.py`) detecta violência, suicídio, criança em perigo e emergência de saúde e fixa telefones e serviços de proteção no topo. Tudo roda no aparelho. Avaliação com 210 perguntas e conjunto de teste guardado: `docs/ia/avaliacao_orientacao.md` (`python avaliacao/avaliar.py v2 --conjunto teste`).
4. **CEP, bairro e o que fica perto** (`web/mapa-servicos.js`, `web/dados/setor_bairro.json`): o CEP vira o **bairro provável** (pelo setor do IBGE, que é agrupado e pode diferir do nome usado pela Prefeitura) e leva à busca do CRAS; o contrário (CEPs de um bairro) também. O mapa fica na tela inicial e mostra o serviço mais perto de cada tipo.
O que ainda **não** existe: elegibilidade automática de benefícios (precisa de critérios oficiais confirmados), busca semântica por embeddings (o modelo atual é de letras e palavras) e qualquer modelo de linguagem. Ver `docs/arquitetura_ia.md`.

## Linguagens e onde cada uma é usada
O site é **estático** (HTML, CSS e JavaScript puros, sem framework, sem servidor e sem etapa de compilação). O Python só gera os dados que o site lê. Contagem de arquivos versionados:

| Linguagem | Arquivos | Onde está | Para que serve |
|---|---|---|---|
| **JavaScript** | 42 | `web/*.js` (22 arquivos), `web/tests/` (16), `web/vendor/leaflet.js` (1, de terceiros), `pipeline/gerar_dados_teste_painel.js` (1), `avaliacao/` (2) | O site inteiro roda no navegador: telas e áreas (`app.js`, `areas.js`), jornadas (`jornada*.js`), mapa (`mapa.js`, `mapa-servicos.js`), questionário, painel e o orientador "Conte com suas palavras" (`ia.js`, `necessidades.js`, `orientar.js`, `perigo.js`). Os testes do site ficam em `web/tests/` e rodam com Node. |
| **Python** | 37 | `pipeline/` (20 scripts), `pipeline/tests/` (16 testes), `avaliacao/avaliar.py` (1) | Baixa e trata dados (CNEFE, CNES, INEP), monta o catálogo (`servicos.py`), localiza serviços por CEP (`geocodificar_catalogo.py`, `indice_cep.py`, `atualizar_localizacoes.py`), gera os horários de ônibus e treina o modelo de necessidades (`treinar_necessidades.py`) e gera o índice do orientador (`indice_orientacao.py`). |
| **HTML** | 1 | `web/index.html` | O dashboard inteiro. Entre Mulheres, Rio Claro em números e o Painel são "vistas" dentro dele (carregam seus scripts só quando abertas); não existem páginas separadas. |
| **CSS** | 2 | `web/estilo.css` (o visual do site) e `web/vendor/leaflet.css` (de terceiros) | Aparência, cores, layout e impressão. |
| **Batch (.bat, Windows)** | 2 | raiz: `abrir_site.bat` (abre o dashboard) e `atualizar_localizacoes.bat` (manutenção dos dados, só para quem mantém o catálogo) | Conveniência para quem desenvolve; as usuárias nunca rodam nada, só abrem o endereço do site. |
| **YAML** | 1 | `.github/workflows/testes.yml` | Roda os testes de Python e de JavaScript a cada envio ao GitHub. |
| **Dados (não são programa)** | — | `web/dados/*.json` e `.geojson` (gerados), `catalogo/*.csv` e `*.txt` (digitados à mão) | O catálogo verificado, os horários, o modelo e os mapas. Para mudar um serviço, edite `catalogo/servicos_manuais.csv` e rode `python pipeline/servicos.py --somente-manual`. |
| **Markdown** | 22 | `README.md` e `docs/` | Documentação, decisões e fontes. |

Observações: o `web/vendor/` (Leaflet) é uma biblioteca de terceiros, usada localmente, sem pedir nada à internet.

## Estado dos dados
- Catálogo verificado à mão (`catalogo/servicos_manuais.csv`): 164 registros: 45 de saúde, 26 de assistência, 20 de emprego e cursos, 4 de mulher e 69 de educação infantil (a Secretaria da Educação e 68 escolas municipais). As unidades de saúde vêm do CNESNet (códigos CNES, 51 estabelecimentos mantidos pela Fundação Municipal de Saúde) e da página de endereços da Fundação; 43 têm endereço e 41 têm telefone.
- Os números 977 estabelecimentos no CNES e 45 publicados foram confirmados pelo autor, que trabalha na Fundação Municipal de Saúde; a base completa do CNES não está versionada.
- Sem `servicos.json` e `cep_indice.json` (gerados na máquina de quem roda o pipeline), o site usa só o catálogo verificado e não oferece busca por CEP. Em 09/10/2026 foram gerados localmente 1.387 CEPs a partir de 104.236 linhas do CNEFE e lidos 142 registros de escolas do INEP (69 com Educação Infantil, nenhum campo identifica creche).

## Como rodar os testes e localizar os serviços
```
PYTHONPATH=pipeline python -m pytest pipeline/tests -q     # testes Python
for f in web/tests/*.test.js; do node $f; done              # testes JavaScript
python pipeline/atualizar_localizacoes.py                   # localiza serviços (CNEFE + lista de CEPs) e refaz o mapa territorial
```
O último comando só sugere; nada entra no catálogo sem a sua confirmação. A cada alteração no GitHub, os dois primeiros rodam sozinhos (`.github/workflows/testes.yml`).

### No Windows, sem digitar comandos
- **`abrir_site.bat`** (duplo clique; já existia): acha o Python, escolhe uma porta livre (8000 a 8010) e abre o site no navegador. Deixe a janela aberta enquanto usa.

O `.bat` serve a pasta `web` **da pasta onde ele está**: se existirem duas cópias do projeto, abra o `.bat` da cópia que recebeu o `git pull`.
- **`atualizar_localizacoes.bat`** (duplo clique): roda `atualizar_localizacoes.py`. Mostra a lista de localizações sugeridas e só altera o catálogo depois que você digita `s`.

Os dois precisam do Python no PATH.

## Privacidade (por desenho)
- Consulta 100% no navegador; sem servidor próprio, sem cookies, sem localStorage, sem estatísticas.
- O índice de CEP guarda só `CEP → centro aproximado + raio`; nenhum endereço ou nome.
- O mapa começa **sem** imagens externas. As ruas (OpenStreetMap) só carregam se a usuária marcar a caixa.
- Botão "Em perigo agora?" abre os contatos oficiais (190, 192, 193, 180, 100, 188) e um botão para sair da página. Não prometemos que o uso é invisível: "sair" não apaga o histórico do navegador.

## Como as usuárias chegam ao site (decisão pendente)
O MISM3 é um site **estático** (a pasta `web`, sem servidor). Hoje ele só abre no computador de quem roda o `abrir_site.bat`, o que serve ao desenvolvimento e à demonstração, mas **uma mulher não vai rodar comando nenhum**. Para ela chegar, o dashboard precisa de **um endereço (link) público**. O caminho que combina com a arquitetura é hospedar a pasta `web` em um serviço de páginas estáticas gratuito (por exemplo GitHub Pages): não exige servidor, não coleta nada e mantém o texto da usuária no aparelho dela. Isso só deve ser feito depois de os contatos de proteção (Patrulha; o CRAM foi retirado por falta de fonte confiável) estarem confirmados e o site revisado; enquanto isso o site é `noindex` e não deve ser divulgado.

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
    python pipeline/geocodificar_catalogo.py   # SUGERE CEP/coordenada (planilha dados/geocodificacao_proposta.csv); só muda o catálogo com --aplicar-aprovadas, e só linhas que uma pessoa marcou "aprovar"
    python pipeline/oferta_educacao_infantil.py   # oferta real de creche e pré-escola de Rio Claro (Censo Escolar 2025 do INEP, em docs/educacao/dados/) -> web/dados/oferta_educacao_infantil.json
    python pipeline/ligar_catalogo_inep.py --gravar --incluir-quase-iguais   # liga as escolas municipais do catálogo ao código INEP (catalogo/inep_escolas.csv); o cartão passa a mostrar se a escola tem creche e pré-escola
    python pipeline/territorio.py   # indicadores por setor censitário (densidade, pessoas por domicílio) -> web/dados/territorio.json, que alimenta a vista "Rio Claro em números" do dashboard
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
    python -m pytest pipeline/tests -q      # 49 passaram e 1 foi ignorado em 11/10/2026
    node web/tests/acesso.test.js           # passou (inclui a regra dos 90 dias)
    node web/tests/necessidades.test.js     # 50 cenários passaram
    node web/tests/dashboard.test.js        # passou: 7 portas, emergência, sem demonstração, links locais
    node web/tests/jornada.test.js          # passou: perguntas, ordem e tamanho do plano, telefones do catálogo, links, promessas proibidas, currículo

No navegador (Chromium, 390 px): a área Saúde abre com 45 cartões; a jornada de Trabalho (perguntas uma de cada vez, com Voltar e "Prefiro não responder") gera um plano de até 3 passos visíveis e o resto dobrado, com telefone vindo do catálogo, preserva o plano ao abrir um link e voltar, escapa texto digitado no currículo e imprime só a folha; sem erro de JavaScript. Não verificados: mapa por CEP com dados reais, leitor de tela, contraste.

## Conferir o catálogo contra as páginas oficiais
Com internet, rode `python pipeline/verificar_catalogo.py`. Ele abre a fonte de cada serviço e confere se os telefones cadastrados aparecem na página. "ATENCAO" não é erro certo: abra a fonte e confira.

## Acrescentar um serviço verificado
Edite `catalogo/servicos_manuais.csv`. Obrigatórios: `tipo` (creche, saude, assistencia, mulher, emprego_curso), `nome`, `fonte_url`, `verificado_em`. Com `cep`, o serviço entra no mapa; `abrangencia=municipal` faz aparecer para todas. Depois rode `python pipeline/servicos.py`.

Veja o [registro de decisões de desenvolvimento](docs/registro_decisoes_desenvolvimento.md), `docs/inventario_de_fontes.md`, a [análise competitiva](docs/analise_competitiva_mism3.md), o [plano de fontes externas](docs/plano_fontes_externas_e_expansao.md) e o [benchmark externo](docs/benchmark_externo_ideias_funcionais.md).

As páginas oficiais usadas nos cadastros estão arquivadas em PDF em [docs/documetacao](docs/documetacao/LEIA-ME.md), com a origem e a data de cada uma.
