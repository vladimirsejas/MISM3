# Serviços sem CEP no catálogo (necessários para a análise territorial)

A análise territorial localiza cada serviço pelo CEP. Só as escolas municipais têm CEP no catálogo. Para os serviços abaixo, o endereço já está cadastrado; falta o **CEP**. Procure o CEP no site dos Correios (busca por endereço) ou confirme com a unidade, e preencha a coluna `cep` em `catalogo/servicos_manuais.csv`. Depois rode `python pipeline/servicos.py --somente-manual` e `python pipeline/analise_territorial.py`.

| Tipo | Serviço | Endereço cadastrado |
|---|---|---|
| caps | CAPS AD — Centro de Atenção Psicossocial Álcool e Drogas | Av. 4, 1171, Vila do Rádio |
| caps | CAPS I — Centro de Atenção Psicossocial Infantojuvenil | Rua 15, nº 51, Consolação |
| caps | CAPS III “18 de Maio” | Rua M-9, 66, Jd. Chervezon |
| cras | CRAS Região Bom Sucesso/Novo Wenzel/Bom Retiro | Rua 5, 1201, Jardim Bom Retiro |
| cras | CRAS Região Jardim Brasília | (sem endereço) |
| cras | CRAS Região Jardim Independência | Rua M7, 1031, Jd. Hipódromo |
| cras | CRAS Região Mãe Preta | Av. 1-MP, 159, Jardim Mãe Preta |
| cras | CRAS Região Panorama | Rua 14, 2763, Jd. Wenzel |
| cras | CRAS Região Terra Nova | Rua Marco Antonio Padula, 1043, Terra Nova |
| creas | CREAS – Centro de Referência Especializado de Assistência Social | Rua 6, 640, entre as avenidas 9 e 11, Centro |
| pat | PAT – Posto de Atendimento ao Trabalhador (Unidade Cervezão) | (sem endereço) |
| ubs | UBS 29 | Av. 29, 1311, Bairro do Estádio |
| ubs | UBS Jardim Chervezon | Av. M-17, 739, Jd. Chervezon |
| ubs | UBS Vila Cristina | Av. José F. Castellano, 1784 |
| ubs | UBS Wenzel | Rua 21, 4219, Wenzel |
| ubs | USF Ajapi | Rua 4, s/n (entre as avenidas 1 e 3), Ajapi |
| ubs | USF Assistência | Av. 1, s/n, esquina com a Rua 1, Assistência |
| ubs | USF Bela Vista | Av. 1A, 750, esquina com a Av. Ulysses Guimarães, Bela Vista/Saúde |
| ubs | USF Benjamin de Castro | Av. 8, 420, Jd. Centenário |
| ubs | USF Bonsucesso/Novo Wenzel | Rua 6, 680, Jd. Novo Wenzel |
| ubs | USF Brasília | Estrada dos Costas, 1349 |
| ubs | USF Ferraz | Av. 4, 385, Distrito de Ferraz |
| ubs | USF Guanabara | Rua 9, s/n, Jd. Guanabara |
| ubs | USF Jardim Novo I e II | Rua 8, 1012, Jd. Novo 1 |
| ubs | USF Jardim Progresso | Av. M-35, 1909, Jd. Ipanema |
| ubs | USF Jardim das Flores | Av. M-51, esquina com a Rua 6, Jd. das Flores |
| ubs | USF Mãe Preta I/II | Rua 12 RV, 80, Vila Verde |
| ubs | USF Nosso Teto/Boa Vista | Av. 88, 147, Jd. Boa Vista |
| ubs | USF Palmeiras I/II | Rua 8, 1102, Jd. das Palmeiras |
| ubs | USF Panorama | Av. 64 PA, 1390, Jd. Panorama |
| ubs | USF Santa Elisa | Rua 25, s/n, entre as avenidas 42 e 48 SE, Santa Elisa |
| ubs | USF São Miguel | Av. 62A, 1750, com a Rua 18A |
| ubs | USF Terra Nova | Av. Marginal, 1043, Jd. Terra Nova |
| urgencia | Pronto Atendimento de Ginecologia e Obstetrícia | Av. 15, s/n, Centro (anexo à maternidade) |
| urgencia | UPA do Cervezão | Rua M9, 66, Jd. Independência |
| urgencia | UPA — Unidade de Pronto Atendimento (Av. 29) | Av. 29, 1313, Bairro do Estádio |
