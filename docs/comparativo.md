# Comparativo: o que já existe × o que o Mapa do Cuidado faz

**Regra:** só vale afirmar que "eles não fazem X" com **prova**: print com data, link e quem conferiu. Sem prova, a célula fica em branco ou "não conferido". Isso vale também para a banca da Fatec e para a Secretaria da Mulher, que é nossa parceira.

Sites a conferir (abrir no navegador, com a data da visita):
1. Página da Secretaria da Mulher: `rioclaro.sp.gov.br/secretaria/secretaria-da-mulher/`
2. Portal da Empregabilidade: `vagas.rioclaro.sp.gov.br` (citado pelo ChatGPT; **ninguém do grupo confirmou ainda que existe e funciona**)
3. Linhas e horários da operadora do transporte: `soutransportes.com.br/rio-claro/`
4. Site principal da Prefeitura (busca, secretarias)

Marque cada célula: **Sim** / **Não** / **Parcial** / **N/C** (não conferido), e anote a evidência.

| Funcionalidade | Secretaria da Mulher | Portal da Empregabilidade | Operadora de ônibus | Mapa do Cuidado (hoje) |
|---|---|---|---|---|
| Achar serviço por proximidade (CEP) | | | | **Sim** (`web/acesso.js`) |
| Mostra fonte e data de verificação de cada informação | | | | **Sim** |
| Telefones de emergência sempre visíveis (180/190) e "Sair rápido" | | | | **Sim** |
| Não grava CEP nem dados da usuária | | | | **Sim** (tudo no navegador) |
| Lista vagas de emprego | | | | **Não** (só apontamos PAT/CONECTA) |
| Concursos e processos seletivos com prazo calculado pela data de hoje | | | | **Estrutura pronta**, sem registros |
| Filtra por objetivo (trabalhar, curso, empreender) com explicação do porquê | | | | **Sim** (`web/recomendar.js`) |
| Cursos gratuitos com turmas abertas | | | | **Não** (falta dado) |
| Creche / educação infantil perto de casa | | | | **Parcial** (código pronto; falta o CSV do INEP) |
| Horários e trajetos de ônibus | | | | **Não** (falta dado) |
| Liga vaga/curso + creche + ônibus numa jornada só | | | | **Não** (é o objetivo) |
| Funciona bem no celular, em tela pequena | | | | N/C |
| Acessibilidade (leitor de tela, contraste) | | | | N/C |

## Como transformar isso em argumento
- Onde o outro site **já faz bem**, não duplicamos: **ligamos** (link para o oficial). Ex.: se o Portal da Empregabilidade for oficial e tiver vagas, o certo é apontar para ele, não competir com ele.
- Onde há lacuna **comprovada**, é o nosso diferencial. A medida de sucesso é o tempo para a usuária achar o serviço certo, que podemos testar com 5 a 10 pessoas.
- Evitar frases como "somos melhores": a Secretaria da Mulher é parceira do projeto.
