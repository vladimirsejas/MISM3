# Mapa do Cuidado Rio-Clarense (marco 1)

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
    node web/tests/necessidades.test.js

## Conferir o catálogo contra as páginas oficiais
Com internet, rode `python pipeline/verificar_catalogo.py`. Ele abre a fonte de cada serviço e confere se os telefones cadastrados aparecem na página. "ATENCAO" não é erro certo: abra a fonte e confira.

## Acrescentar um serviço verificado
Edite `catalogo/servicos_manuais.csv`. Obrigatórios: `tipo` (creche, saude, assistencia, mulher, emprego_curso), `nome`, `fonte_url`, `verificado_em`. Com `cep`, o serviço entra no mapa; `abrangencia=municipal` faz aparecer para todas. Depois rode `python pipeline/servicos.py`.

## Próximos marcos
2. Setores censitários + Censo 2022 (crianças de 0 a 4 anos): "desertos de cuidado" e simulador de nova creche.
3. Relatórios automáticos explicados; vagas e cursos; transporte.

Veja `docs/inventario_de_fontes.md`, a [análise competitiva e roadmap funcional](docs/analise_competitiva_mism3.md), o [plano de fontes externas e expansão](docs/plano_fontes_externas_e_expansao.md) e o [benchmark externo de ideias funcionais](docs/benchmark_externo_ideias_funcionais.md), que transforma referências de outros produtos em melhorias priorizadas para o MISM3.
