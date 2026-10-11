# Painel da Secretaria e análise territorial

Escrito em 11/10/2026. **Estado: protótipo com dados de teste.**

## Painel (`web/painel-secretaria.html`)
- **O que é:** a tela que a Secretaria da Mulher usaria para ver o que as mulheres responderam no questionário, **só em números agregados**. Seções: quem respondeu, o que procuram, o que impede a autonomia, onde falta informação, pontuação por tema (e por região), necessidades combinadas, evolução, análise territorial e "como ler".
- **Os dados são de TESTE.** `web/dados/painel_teste.json` tem 420 registros sorteados por computador (`node pipeline/gerar_dados_teste_painel.js`, semente fixa). **Não representam nenhuma mulher real.** O arquivo e a página dizem isso em destaque.
- **Não está no site público:** nenhum link leva a ele e a página tem `noindex`. Isso **não** é proteção: quem souber o endereço abre a página (que só tem dados de teste). O painel real **exige login da Prefeitura num servidor protegido**; esconder um botão ou uma página não protege dados de ninguém.
- **Regra dos 10 (`web/painel.js`):** nenhuma célula, pergunta, região, par de temas ou mês com menos de 10 respostas é mostrado. Quando só uma célula some, a menor das outras também some, para a conta "total menos o resto" não revelar o número escondido (testado).
- **Sempre mostra** quem respondeu, para ninguém tratar respostas voluntárias como retrato de toda a cidade. Pergunta em branco é "sem dados", não zero.

## Análise territorial (`pipeline/analise_territorial.py`)
- **O que faz:** cruza a população dos 408 setores do IBGE (Censo 2022) com a localização dos serviços do catálogo verificado: distância média da população até o CRAS, a UBS e a escola municipal mais próximos, serviços por bairro e um agrupamento exploratório de bairros (k-means).
- **Não gerada ainda.** O script **se recusa a escrever** sem coordenadas, em vez de inventar números. O painel diz "ainda não foi gerada".
- **O que falta (dados, não código):** no catálogo, **só as escolas municipais têm CEP** (64 de 68). **CRAS, UBS, UPA, CAPS e PAT têm endereço, mas não CEP.** A lista dos 36 serviços a completar está em `docs/ceps_a_preencher.md`. Depois: `python pipeline/servicos.py --somente-manual` e `python pipeline/analise_territorial.py` (precisa do `web/dados/cep_indice.json`, que está no computador do autor).
- **Por que não cruzar por nome de bairro:** testado e descartado. Os 28 bairros do IBGE não casam com as listas de bairros dos CRAS (por exemplo, "Bela Vista" casava com 3 CRAS e "Grande Cervezão" não casava com "Jd. Chervezon"). Atribuir população a um CRAS errado enganaria a Secretaria.
- **Limites:** distância em linha reta (sem ruas, ônibus nem horários); localização do serviço aproximada pelo centro do CEP; mostra onde a rede cadastrada está longe da população, **não prova falta de serviço**; sem dado pessoal de ninguém.

## Para o painel real
Servidor da Prefeitura, login, perfis de acesso, os registros do questionário (contrato em `docs/questionario_observatorio.md`) e o mesmo código de agregação (`web/painel.js`), que já aplica a regra dos 10.
