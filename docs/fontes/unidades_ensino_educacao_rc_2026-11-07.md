# Unidades de ensino de Rio Claro — fonte oficial e situação no MISM3

**Data de consulta da fonte:** 2026-11-07  
**Fonte oficial:** Secretaria Municipal da Educação de Rio Claro — Unidades de Ensino  
**URL:** https://www.educacaorc.com.br/?r=secretaria/unidadeEnsino

## 1. Onde os dados estão armazenados

O cadastro das escolas municipais já está incorporado ao catálogo principal do MISM3:

- **Arquivo canônico:** `catalogo/servicos_manuais.csv`
- **Identificador dos registros:** prefixo `man-em-`
- **Categoria:** `tipo=creche`, `subtipo=escola_municipal`
- **Quantidade de registros escolares no catálogo:** 68
- **Registros com latitude e longitude preenchidas:** 33
- **Registros sem par individual de latitude/longitude:** 35

Este documento não substitui o catálogo. Ele registra a fonte institucional e a situação da geolocalização para orientar a continuidade do trabalho.

## 2. O que a página oficial fornece

A página da Secretaria apresenta unidades de ensino com informações cadastrais como:

- nome da unidade;
- endereço;
- bairro;
- CEP;
- e-mail;
- telefone(s).

A página consultada não apresenta latitude e longitude como campos geográficos explícitos. Portanto, ela é uma fonte cadastral de endereços, não uma fonte direta de coordenadas.

## 3. Interpretação da localização

É necessário distinguir:

1. **Endereço oficial:** endereço textual publicado pela Secretaria.
2. **CEP:** referência postal; pode representar uma área e não a posição exata da escola.
3. **Coordenada individual:** latitude/longitude atribuída à unidade por método documentado.
4. **Coordenada derivada do centro do CEP:** estimativa aproximada, que não deve ser apresentada como localização exata do imóvel.

A existência de endereço oficial não significa que a página publique coordenadas. Da mesma forma, a ausência de coordenadas na página não significa que o MISM3 esteja sem qualquer informação sobre as escolas.

## 4. Situação conhecida do catálogo

Na versão de `catalogo/servicos_manuais.csv` consultada nesta revisão:

| Indicador | Quantidade |
|---|---:|
| Escolas municipais cadastradas (`man-em-`) | 68 |
| Com latitude e longitude no catálogo | 33 |
| Sem par individual de latitude/longitude no catálogo | 35 |

As coordenadas existentes devem ser preservadas. Não substituir coordenadas já registradas por centros de CEP sem análise e justificativa documentadas.

## 5. Cuidados encontrados na fonte

A página deve ser tratada como fonte oficial de referência cadastral, mas seus campos precisam de conferência. Na própria listagem há situações que exigem cautela, como:

- CEP aparentemente incompatível com Rio Claro em um registro;
- CEP geral do município em algumas unidades;
- endereços iguais publicados para unidades distintas;
- endereço sem número ou com indicação de esquina/trecho;
- unidades e extensões de programas identificadas separadamente.

Não corrigir silenciosamente esses dados. Registrar divergências e preservar o valor publicado pela fonte, distinguindo-o do valor adotado no catálogo.

Os pontos denominados “Programa Integra” na página não devem ser automaticamente tratados como novas escolas municipais. São registros de programas/unidades de atendimento e exigem classificação própria antes de qualquer inclusão no conjunto de escolas.

## 6. Próxima etapa de integração

1. Manter `catalogo/servicos_manuais.csv` como cadastro canônico das escolas.
2. Cruzar os 68 registros existentes com a listagem oficial atual, por nome e endereço.
3. Identificar unidades presentes no catálogo que não aparecem na página atual e unidades publicadas na página que não possuem correspondência no catálogo.
4. Registrar divergências de endereço, CEP, nome e telefone sem apagar os valores anteriores.
5. Para as 35 escolas sem coordenadas individuais, avaliar geocodificação pelo endereço completo e documentar método, fonte, data e confiança.
6. Não usar automaticamente o centro do CEP como coordenada exata da escola.
7. Atualizar o registro de localização correspondente em `catalogo/localizacao_registro.csv` quando houver coordenada nova ou corrigida, preservando a rastreabilidade.

## 7. Relevância para a pesquisa geoespacial do MISM3

A diferença entre endereço cadastral publicado e coordenada geográfica disponível é relevante para investigar como a qualidade e a incerteza da localização dos serviços públicos afetam a confiabilidade dos indicadores territoriais.

A página oficial pode sustentar a origem dos endereços. Ela, isoladamente, não comprova a precisão métrica das coordenadas derivadas desses endereços.

**Regra de continuidade:** não solicitar novamente ao usuário uma lista de escolas ou dados de creches já existentes no MISM3. Antes de pedir qualquer nova coleta, inspecionar o catálogo, o vínculo INEP e o registro de localização.
