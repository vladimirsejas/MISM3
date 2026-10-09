# Tarefas que o grupo pode fazer agora (sem depender da rede do servidor)

Regra de ouro: **nada entra sem fonte oficial e data de verificação.** Em dúvida, não cadastre e anote a pergunta.

## Quem não programa (cadastro e checagem)
| Tarefa | Onde | Como saber que está pronta |
|---|---|---|
| Preencher concursos/processos seletivos abertos e previstos | `catalogo/vagas_publicas.csv` | Cada linha com **link do edital oficial** (Prefeitura ou banca). Site de notícia não vale. Rode `python pipeline/vagas.py` sem erro |
| Cadastrar CRAS e CREAS (nome, endereço, telefone, bairros atendidos) | `catalogo/servicos_manuais.csv` (`tipo=assistencia`) | Página oficial em `fonte_url`; `verificar_catalogo.py` sem ATENCAO |
| Descobrir endereço e horário do PAT e do CONECTA | mesmo CSV | Só se uma fonte oficial confirmar; senão, vai para o pedido de LAI nº 1 |
| Protocolar os pedidos de LAI | `docs/lai_pedidos.md` | Número do protocolo anotado |
| Visitar (com autorização da Secretaria) um serviço e conferir endereço/horário | — | Foto da placa/horário, data e quem foi |

## Quem programa
| Tarefa | Situação |
|---|---|
| Integrar o CSV do INEP (escolas com Educação Infantil) | **Código pronto.** Falta colocar o CSV em `docs/` e rodar `python pipeline/servicos.py` |
| Leitor dos Agregados do IBGE por setor | Depende de baixar o arquivo e rodar `inspecionar_arquivo.py` |
| Gerar `servicos.json` e `vagas.json` e abrir o site com dados reais | Na máquina de quem tem as bases (CNES, CNEFE) |

## Para iniciantes
- Rodar os testes (`README.md`, seção Testes) e ler um teste de ponta a ponta antes de mexer em qualquer arquivo.
- Cadastro de serviço no CSV é um bom primeiro commit: pequeno, tem validador e é útil de verdade.
