# Mapa do Cuidado Rio-Clarense (MISM3)

> Este README registra **o que existe e foi verificado**. Não é plano nem diretriz. As decisões e o histórico estão em [docs/registro_decisoes_desenvolvimento.md](docs/registro_decisoes_desenvolvimento.md).
> Última verificação: 10/10/2026.

## O que o site faz hoje
A pessoa escreve uma necessidade ou escolhe uma de **sete portas**: Emprego e renda, Estudo e qualificação, Saúde, Separação e direitos, Violência e proteção, Moradia e aluguel, Dívidas e aposentadoria. A busca por palavras roda no navegador e devolve links oficiais e serviços cadastrados em Rio Claro/SP. Também há busca por CEP, que mostra serviços próximos; o CEP não sai do navegador.

Outras áreas, separadas das portas de atendimento: protótipo *De Mulher para Mulher* (`web/rede-mulheres.html`) e painel conceitual *Inteligência Pública* (`web/inteligencia-publica.html`).

## Privacidade (como está implementado)
- Consulta no navegador; sem servidor próprio, cookies, localStorage ou estatísticas.
- O índice de CEP guarda só `CEP → centro aproximado + raio`.
- O mapa começa sem imagens externas; as ruas (OpenStreetMap) só carregam se a usuária marcar a caixa, e então o servidor de mapas vê a região aproximada.
- Barra fixa com 190 e Ligue 180 e botão "Sair rápido". O botão não apaga o histórico do navegador.

## Estado dos dados neste repositório
- **Versionado:** catálogo manual com 10 serviços (`catalogo/servicos_manuais.csv`), malha e resumo de setores censitários, `horarios_onibus.json` e dados de **demonstração** (`web/dados/demo/`).
- **Não versionado:** `web/dados/cep_indice.json` e `web/dados/servicos.json`, gerados localmente pelo pipeline. Sem eles o site abre em **modo demonstração**, com a faixa "DADOS ILUSTRATIVOS" e os CEPs fictícios 00000-001, 00000-002 e 00000-003. Nesse modo, as portas mostram serviços `[DEMO]` e links oficiais. A porta Saúde traz dois links da Prefeitura (lista de Unidades Básicas de Saúde e Fundação Municipal de Saúde), localizados por busca e **ainda não abertos nem conferidos**; endereços e telefones das unidades não foram copiados.
- Números gerados localmente em 09/10/2026 (ver [inventário de fontes](docs/inventario_de_fontes.md)): 104.236 linhas do CNEFE lidas e 1.387 CEPs indexados; 142 escolas do INEP em Rio Claro, 69 com indicação de Educação Infantil (nenhum campo identifica creche).

## Como rodar
Demonstração (Windows: `abrir_site.bat`; ou):

    python -m http.server 8000 --directory web

e abrir http://localhost:8000.

Dados reais (Python 3.10+, `pip install pandas numpy pyshp`):

    python pipeline/baixar.py cnefe
    python pipeline/baixar.py escolas      # ou --zip caminho/microdados.zip
    python pipeline/indice_cep.py          # gera web/dados/cep_indice.json
    python pipeline/cnes.py docs/cnes      # diagnóstico do CNES (base baixada à mão)
    python pipeline/servicos.py            # gera web/dados/servicos.json
    python pipeline/setores.py caminho/SP_setores_CD2022.zip

Catálogo: edite `catalogo/servicos_manuais.csv` (obrigatórios `tipo`, `nome`, `fonte_url`, `verificado_em`; com `cep` o serviço entra no mapa; `abrangencia=municipal` aparece para todas) e rode `python pipeline/servicos.py`. `python pipeline/verificar_catalogo.py` confere os telefones contra as páginas-fonte; "ATENCAO" não é erro certo, é para conferir.

## Testes (executados em 10/10/2026)

    pip install pytest
    python -m pytest pipeline/tests -q     # 33 passaram
    node web/tests/acesso.test.js          # passou
    node web/tests/necessidades.test.js    # 47 cenários passaram
    node web/tests/dashboard.test.js       # passou (sete portas, quatro jornadas)

Verificação no navegador (Chromium, tela de 390 px, modo demonstração): as sete portas abrem e mostram conteúdo, sem erro de JavaScript. Não verificados: mapa por CEP, dados reais, leitor de tela e contraste.

## Documentos
[Inventário de fontes](docs/inventario_de_fontes.md) · [Registro de decisões](docs/registro_decisoes_desenvolvimento.md) · [Roteiro de demonstração](docs/roteiro_demo_mism3.md) · [Análise competitiva](docs/analise_competitiva_mism3.md) · [Plano de fontes externas](docs/plano_fontes_externas_e_expansao.md) · [Benchmark de ideias](docs/benchmark_externo_ideias_funcionais.md) · [Pedidos LAI](docs/pedidos_LAI.md) · [Transporte](docs/transporte/README.md)
