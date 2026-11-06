# Auditoria de privacidade do mapa territorial v1

Gerado por `pipeline/territorial_auditoria.py` sobre `web/dados/indicadores_territoriais.json`. O relatório não reproduz valores suspeitos: informa só o caminho do campo e o tipo de problema.

- Carimbo do arquivo auditado: `1e1b0b090140d23c`
- Resultado: **APROVADA** (0 ocorrência(s))
- Verificações: estrutura (nomes de campo contra o esquema e contra nomes suspeitos), conteúdo (CPF, CEP de 8 dígitos, e-mail, telefone, endereço de logradouro), nomes (equipamento contra o catálogo institucional; bairro contra a malha do IBGE) e proveniência da posição dos equipamentos.

## Setores para decisão do autor (não suprimidos)

A política de privacidade não fixa limiar numérico de supressão, e esta versão **não suprime nem agrega nenhum setor**. A proposta em `docs/territorial/PROPOSTA_SUPRESSAO_E_AGREGACAO.md` traz três faixas candidatas, ainda não aprovadas. Setores que cairiam em cada faixa (população abaixo do primeiro valor **ou** domicílios abaixo do segundo):

| Faixa candidata | Critério | Setores |
|---|---|---|
| conservadora | menos de 5 pessoas ou menos de 3 domicílios | 17 |
| intermediária | menos de 10 pessoas ou menos de 5 domicílios | 21 |
| ampliada | menos de 20 pessoas ou menos de 10 domicílios | 30 |

Faixa conservadora (17 setores): `354390705000027`, `354390705000045`, `354390705000201`, `354390705000224`, `354390705000231`, `354390705000252`, `354390705000271`, `354390705000462`, `354390705000472`, `354390705000478`, `354390705000491`, `354390705000501`, `354390705000508`, `354390705000523`, `354390705000533`, `354390705000544`, `354390705000545`

Faixa intermediária (21 setores): `354390705000027`, `354390705000045`, `354390705000201`, `354390705000224`, `354390705000231`, `354390705000252`, `354390705000271`, `354390705000462`, `354390705000472`, `354390705000478`, `354390705000487`, `354390705000491`, `354390705000501`, `354390705000508`, `354390705000523`, `354390705000533`, `354390705000538`, `354390705000540`, `354390705000544`, `354390705000545`, `354390710000004`

Faixa ampliada (30 setores): `354390705000027`, `354390705000045`, `354390705000201`, `354390705000224`, `354390705000231`, `354390705000252`, `354390705000271`, `354390705000282`, `354390705000283`, `354390705000462`, `354390705000472`, `354390705000478`, `354390705000487`, `354390705000491`, `354390705000501`, `354390705000508`, `354390705000511`, `354390705000513`, `354390705000514`, `354390705000520`, `354390705000523`, `354390705000525`, `354390705000531`, `354390705000533`, `354390705000538`, `354390705000540`, `354390705000544`, `354390705000545`, `354390705000546`, `354390710000004`

Publicar o mapa com esses setores visíveis depende da decisão do autor sobre a faixa e sobre suprimir ou agregar.

