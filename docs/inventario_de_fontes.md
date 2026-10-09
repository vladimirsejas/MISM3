# Inventário de fontes — Mapa do Cuidado Rio-Clarense

Regra do projeto: **nada aqui é dado fingido**. A coluna "Situação" diz o que foi confirmado e o que ainda precisa ser baixado e conferido na sua máquina.
Município sempre por código IBGE **3543907** (DATASUS: 354390). Nunca filtrar por nome: existe Rio Claro no RJ.

| Fonte | O que traz | Como obter | Granularidade | Usado em | Situação |
|---|---|---|---|---|---|
| IBGE – CNEFE 2022 | CEP, coordenada e setor censitário de cada endereço do Censo | `python pipeline/baixar.py cnefe` (ou download manual na página do IBGE) | Endereço (não vai para o site; só agregado por CEP) | `indice_cep.py` | Campos confirmados em cópia de outro município; caminho no FTP a confirmar ao baixar |
| IBGE – Agregados por setores 2022 | População, domicílios, faixas etárias por setor | Download manual (FTP do IBGE, pasta de agregados por setor) | Setor censitário | Marco 2 (desertos de cuidado) | Dicionário listado; ainda não baixado |
| IBGE – Malha de setores 2022 (SP_setores_CD2022.zip) | Polígonos, bairro, situação urbana/rural e contagens básicas v0001–v0007 | Já baixado pelo Vladi | Setor | `setores.py` | **Verificado em 2026-10-08**: 103.319 setores no estado, 408 em Rio Claro (371 urbanos, 37 rurais, 27 bairros nomeados, 43 setores sem bairro). v0001 soma 201.418 (população do município); significado de v0001–v0007 a confirmar no dicionário. **Não tem idade** |
| CNES/DATASUS – base completa (competência 202608) | Estabelecimentos (`tbEstabelecimento`, 56 colunas: nome, logradouro, bairro, CEP, telefone, latitude/longitude, tipo, natureza jurídica, município gestor, motivo de desabilitação), tipos (`tbTipoUnidade`), turnos (`tbTurnoAtendimento`) | Baixado pelo Vladi do site do CNES (pasta `docs/cnes`) | Estabelecimento | `cnes.py` + `servicos.py` | **Estrutura verificada em 2026-10-08** (colunas reais). Base NACIONAL: o script filtra Rio Claro (gestor 354390 ou CEP do índice) e nunca carrega colunas de CPF. Falta conferir contagens com `python pipeline/cnes.py docs/cnes`. Horário por dia (`tbEstabHorarioAtend`) não usado: código do dia da semana a confirmar |
| INEP – Censo Escolar | Escolas, `IN_COMUM_CRECHE`, dependência, situação, CEP | `python pipeline/baixar.py escolas` | Escola | `servicos.py` | Microdados listados; colunas conferidas só em teste sintético |
| Páginas da Prefeitura | Secretaria da Mulher, Educação, Desenvolvimento Social, Desenvolvimento Econômico (PAT, CONECTA, Banco do Povo), Fundo Social (Centros de Qualificação), CRAS, CREAS | Cadastro manual em `catalogo/servicos_manuais.csv`, sempre com `fonte_url` e `verificado_em`; conferir com `verificar_catalogo.py` | Equipamento | `servicos.py` | 10 registros cadastrados em 2026-10-08 a partir das páginas oficiais; **telefones a conferir com o verificador** (leitura por resumidor pode errar dígitos). Páginas não publicam endereço/horário do PAT e CONECTA, nem a lista de cursos. **CRAS/CREAS ainda a cadastrar** |
| SINAN (violência) | Notificações de violência | PySUS | **Município apenas** (sem CEP, rua ou nome) | Não usado no marco 1 | Não serve para mapa por bairro |
| SSP-SP | Boletins de ocorrência com bairro/coordenada | Planilhas da SSP | Ocorrência (contém campos pessoais) | Não usado | Só com descarte das colunas pessoais na entrada; fora do marco 1 |
| Novo CAGED / RAIS | Vínculos formais por sexo e ocupação | Portal do Ministério do Trabalho | Município | Marco 2 (emprego) | Não verificado |
| OpenStreetMap | Ruas, pontos de ônibus | Extrato regional | Geometria | Marco 3 (transporte) | Não verificado; não apresentar como horário oficial |
| Fila e vagas de creche | — | **Não é público.** Pedir à Secretaria de Educação (Lei de Acesso à Informação) | Por faixa etária e região | — | Dado inexistente por enquanto |

## Nota sobre violência
Não há base pública que permita mapa de risco por CEP. O site **não** guarda relato algum e **não** cruza com violência: só aponta serviços e canais oficiais (180, 190).

## Limites que o sistema sempre declara
1. Cadastro de serviço não significa vaga ou atendimento disponível.
2. Distância é em linha reta a partir do centro do CEP, não rota real.
3. Localização "pelo CEP do serviço" é aproximada e fica marcada como tal.
