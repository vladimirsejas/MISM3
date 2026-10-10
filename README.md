# Mapa do Cuidado Rio-Clarense (marco 1)

> **Orientação:** este README é somente um mapa resumido do trabalho, não uma fonte de verdade nem uma base para decisões. Antes de decidir ou afirmar que algo existe, confira o código, os testes executados, os dados/fontes originais e o [registro de decisões de desenvolvimento](docs/registro_decisoes_desenvolvimento.md).

A tela inicial (**Mulher em Rede**) tem só o propósito, o botão **Em perigo agora?** e sete portas: **Trabalho, Educação, Saúde, Direitos, Moradia, Assistência Social** e **De Mulher para Mulher** (página independente). O conteúdo de cada área só aparece depois de escolhê-la. Onde há dados de CEP reais, também é possível buscar serviços próximos; o CEP **nunca sai do navegador**.

## Privacidade (por desenho)
- Consulta 100% no navegador; sem servidor próprio, sem cookies, sem localStorage, sem estatísticas.
- O índice de CEP guarda só `CEP → centro aproximado + raio`; nenhum endereço ou nome.
- O mapa começa **sem** imagens externas. As ruas (OpenStreetMap) só carregam se a usuária marcar a caixa.
- Botão "Em perigo agora?" abre os contatos oficiais (190, 192, 193, 180, 100, 188) e um botão para sair da página. Não prometemos que o uso é invisível: "sair" não apaga o histórico do navegador.

## Abrir o sistema
Dê dois cliques em `abrir_site.bat` (Windows; ele serve a pasta `web`) ou rode:

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

Se um download automático falhar (os sites mudam), o script diz onde baixar à mão e em qual pasta colocar. Com `servicos.json` e `cep_indice.json` gerados, o site passa a usá-los (e oferece a busca por CEP).

## Testes

    pip install pytest
    python -m pytest pipeline/tests -q
    node web/tests/acesso.test.js
    node web/tests/necessidades.test.js
    node web/tests/dashboard.test.js   # estrutura: 7 portas, emergência, sem demonstração, links locais

## Conferir o catálogo contra as páginas oficiais
Com internet, rode `python pipeline/verificar_catalogo.py`. Ele abre a fonte de cada serviço e confere se os telefones cadastrados aparecem na página. "ATENCAO" não é erro certo: abra a fonte e confira.

## Acrescentar um serviço verificado
Edite `catalogo/servicos_manuais.csv`. Obrigatórios: `tipo` (creche, saude, assistencia, mulher, emprego_curso), `nome`, `fonte_url`, `verificado_em`. Com `cep`, o serviço entra no mapa; `abrangencia=municipal` faz aparecer para todas. Depois rode `python pipeline/servicos.py`.

## Próximos marcos
2. Setores censitários + Censo 2022 (crianças de 0 a 4 anos): "desertos de cuidado" e simulador de nova creche.
3. Relatórios automáticos explicados; vagas e cursos; transporte.

Veja o [registro de decisões de desenvolvimento](docs/registro_decisoes_desenvolvimento.md), `docs/inventario_de_fontes.md`, a [análise competitiva](docs/analise_competitiva_mism3.md), o [plano de fontes externas](docs/plano_fontes_externas_e_expansao.md) e o [benchmark externo](docs/benchmark_externo_ideias_funcionais.md).
