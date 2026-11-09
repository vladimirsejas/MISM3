# Auditoria de privacidade do mapa territorial v1

Gerado por `pipeline/territorial_auditoria.py` sobre `web/dados/indicadores_territoriais.json`. O relatório não reproduz valores suspeitos: informa só o caminho do campo e o tipo de problema.

- Carimbo do arquivo auditado: `1e1b0b090140d23c`
- Resultado: **APROVADA** (0 ocorrência(s))
- Verificações: estrutura (nomes de campo contra o esquema e contra nomes suspeitos), conteúdo (CPF, CEP de 8 dígitos, e-mail, telefone, endereço de logradouro), nomes (equipamento contra o catálogo institucional; bairro contra a malha do IBGE) e proveniência da posição dos equipamentos.

## Setores pequenos (decisão D4)

Esta versão da auditoria foi escrita antes da decisão D4 (ver `DECISOES_DO_AUTOR.md`). Na publicação, os setores com **menos de 5 pessoas ou menos de 3 domicílios** (faixa conservadora da proposta em `PROPOSTA_SUPRESSAO_E_AGREGACAO.md`) têm população, domicílios, densidade e distâncias omitidos; os agregados dos bairros afetados e os totais de população e domicílios também são omitidos. A regra é aplicada de forma central e com falha segura (valor ausente ou inválido também suprime), em `pipeline/privacidade_territorial.py`.

| Faixa candidata | Critério | Setores |
|---|---|---|
| conservadora (adotada, D4) | menos de 5 pessoas ou menos de 3 domicílios | 17 |
| intermediária (não adotada) | menos de 10 pessoas ou menos de 5 domicílios | 21 |
| ampliada (não adotada) | menos de 20 pessoas ou menos de 10 domicílios | 30 |

As listas de códigos de setor das três faixas foram retiradas deste documento: a regra e as contagens bastam para a auditoria, e a lista dos setores protegidos fica no próprio código e nos dados publicados (campo `suprimido_privacidade`).
