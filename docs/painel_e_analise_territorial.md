# Análise territorial (vista `#painel`)

Reescrito em 04/11/2026. **Estado: tela pronta; a análise ainda não foi gerada.**

## Vista `#painel` do dashboard (aberta pelo bloco "Para a gestão")
- **O que é:** a tela que mostra, por bairro, a população (Censo 2022, IBGE) e a distância média até o CRAS, a UBS e a escola municipal mais próximos, lida de `web/dados/analise_territorial.json`. Não usa dado de nenhuma pessoa.
- **Histórico:** até 04/11/2026 esta vista era um "painel da Secretaria" que agregava respostas de um questionário (com 420 registros sintéticos). O questionário e o painel de respostas foram retirados do projeto; a decisão está em `docs/registro_decisoes_desenvolvimento.md`.
- **Acesso:** só o bloco "Para a gestão" leva a ela, e o site inteiro é `noindex`. Como a tela não tem dado de pessoa, não há o que proteger por login.

## Análise territorial (`pipeline/analise_territorial.py`)
- **O que faz:** cruza a população dos 408 setores do IBGE (Censo 2022) com a localização dos serviços do catálogo verificado: distância média da população até o CRAS, a UBS e a escola municipal mais próximos, serviços por bairro e um agrupamento exploratório de bairros (k-means).
- **Gerada em 04/11/2026** (28 bairros; CRAS 6 de 6, UBS e USF 22 de 22, escolas 59 de 68 no cenário com o centro do CEP). O script **se recusa a escrever** sem coordenadas suficientes, em vez de inventar números.
- **De onde vêm as coordenadas:** os CRAS e as UBS/USF têm coordenada conferida visualmente no Google Maps (`docs/evidencias_conferencia_visual/` e `docs/registro_conferencia_visual_2026-11-04.md`). UPA, CAPS e PAT continuam com endereço, sem CEP; a lista dos serviços a completar está em `docs/ceps_a_preencher.md`. Depois: `python pipeline/servicos.py --somente-manual` e `python pipeline/analise_territorial.py` (precisa do `web/dados/cep_indice.json`).
- **Por que não cruzar por nome de bairro:** testado e descartado. Os 28 bairros do IBGE não casam com as listas de bairros dos CRAS (por exemplo, "Bela Vista" casava com 3 CRAS e "Grande Cervezão" não casava com "Jd. Chervezon"). Atribuir população a um CRAS errado enganaria a gestão.
- **Limites:** distância em linha reta (sem ruas, ônibus nem horários); localização do serviço aproximada pelo centro do CEP; mostra onde a rede cadastrada está longe da população, **não prova falta de serviço**; sem dado pessoal de ninguém.

## Do indicador à decisão (11/10/2026)
Regra: **nenhum indicador entra no painel sem uma decisão que a Prefeitura possa tomar com ele.** Cada um mostra fonte, data de referência, denominador e limite. Só a coluna "Disponível hoje?" descreve o que existe; o resto é plano.

| Pergunta de gestão | Indicador | Decisão que apoia | Fonte provável | Disponível hoje? |
|---|---|---|---|---|
| Onde a creche está abaixo da demanda conhecida? | Crianças aguardando vaga por etapa e território de residência, contra vagas e capacidade | Ampliar, remanejar ou reorganizar a oferta | Secretaria da Educação (agregado); Censo 2022 para crianças de 0 a 4 anos | **Não.** Só população total por setor; faixa etária e fila dependem de dados novos |
| Onde a assistência social está mais pressionada? | Famílias em acompanhamento e atendimentos por equipe de referência | Reforçar equipes, redistribuir serviços | Secretaria de Desenvolvimento Social; RMA e Censo SUAS | **Não** |
| Onde pode haver barreira de acesso à saúde da mulher? | Cobertura de pré-natal e de rastreamento (mulheres elegíveis no denominador) por território assistencial | Busca ativa pelas equipes de saúde | SISAB/e-Gestor APS, SISCAN, Fundação de Saúde | **Não** (fontes públicas existem; falta conferir o recorte territorial) |
| Onde a rede de proteção perde a continuidade? | Proporção agregada de encaminhamentos concluídos e tempo até o acolhimento, em períodos amplos | Melhorar protocolos entre os serviços | Serviços da rede, em agregado | **Não**; exige análise jurídica antes (ver abaixo) |
| Quais territórios têm deslocamento mais difícil? | Tempo estimado até serviços essenciais, baldeações, frequência nos horários relevantes | Ajustar itinerários, horários ou localização | Horários da SOU (5 linhas, 382 horários, já no projeto) + paradas e itinerários (GTFS, pedido feito) | **Parcial**: horários sim, paradas e itinerários não |

**Regras de leitura (valem para todo indicador):**
- **Correlação não prova causa.** Um setor com muitas crianças pequenas, pouca creche e baixa renda levanta uma hipótese; não prova que a falta de creche seja a barreira de emprego daquelas mães.
- **Ausência de dado não é ausência de serviço.** Distinguir sempre: "não encontrei serviço cadastrado", "não tenho dados para localizar" e "confirmei que não existe".
- **Denominador explícito.** "Famílias referenciadas", "em acompanhamento ativo" e "atendimentos realizados" são medidas diferentes; não trocar uma pela outra, nem deduzir carga de trabalho individual só do RMA.
- **Sem índice composto por enquanto.** Mostrar os indicadores separados, com fonte e limite, antes de atribuir pesos e classificar territórios.

**Violência e proteção:** só estatística agregada, em períodos e territórios amplos. Não cruzar registros individuais de delegacia, hospital, medida protetiva e CRAM numa base territorializada: numa cidade média, período, bairro e tipo de ocorrência já podem reidentificar uma pessoa. A vinculação de registros fica nos sistemas de origem. Qualquer compartilhamento passa antes por análise jurídica e de risco de reidentificação (inclusive dedução de números ocultos por totais e subtotais).

**Arquitetura (decisão adiada de propósito):** SQLite basta para o protótipo local. PostgreSQL/PostGIS só se houver processamento geográfico pesado, vários usuários e implantação institucional, e só depois de definidos governança, fontes e usos autorizados.

