# Plano de implementação do mapa territorial do MISM3

**Data:** 06/11/2026.
**Escopo deste documento:** só o plano. Ele não implementa nada e não altera código, dados nem modelos.

**Princípio e política.** O mapa trabalha somente com dados públicos agregados por setor censitário e com a localização de equipamentos públicos. As decisões do autor (D1 a D4) estão em [DECISOES_DO_AUTOR.md](DECISOES_DO_AUTOR.md); a política de privacidade está em [POLITICA_PRIVACIDADE_DADOS_TERRITORIAIS.md](POLITICA_PRIVACIDADE_DADOS_TERRITORIAIS.md). Este plano não as repete: toda etapa abaixo deve respeitá-las.

## Regras de interpretação (valem em todas as etapas e na tela)

1. **Distância em linha reta não é tempo de deslocamento.** Ela não considera ruas, transporte, horários nem capacidade.
2. **Localização de equipamento não é área de atendimento.** Estar num setor ou perto dele não define quem o equipamento atende.
3. **Coordenada aproximada nunca é apresentada como verificada.** A posição pelo centro do CEP cadastral do equipamento é análise de sensibilidade (D2) e deve aparecer identificada como tal.

## Etapas

### 1. Recuperação e diagnóstico

Entrada: PR #75 (ramo `mapa-territorial-v1`), aberta e sem mesclar.

- Medir quanto o ramo está atrás da `main`, listar o que a PR realmente altera e verificar se ela ainda se aplica à `main` atual sem conflito.
- Conferir que `web/dados/indicadores_territoriais.json` bate com os dados atuais (408 setores; 201.418 pessoas; 6 CRAS; 22 UBS/USF; 68 escolas).
- Registrar o significado das variáveis `v0001` e `v0002` do IBGE na documentação oficial.
- Rodar apenas os testes que a própria PR traz.

Pronto quando: o diagnóstico estiver registrado e a lista de pendências para publicação estiver escrita.

### 2. Auditoria técnica e de privacidade

- Confirmar que a página só carrega arquivos locais (nenhuma URL externa), a política de segurança de conteúdo, o `no-referrer` e a ausência de armazenamento no navegador.
- Conferir que nenhum campo de pessoa, CPF, endereço residencial ou CEP residencial entra nos JSONs, na página ou nos relatórios (critérios na política de privacidade).
- Revisar a auditoria `AUDITORIA_MAPA_V1.md` contra o estado atual da `main`.

Pronto quando: auditoria repetida sobre a `main` atual e resultados registrados com a data.

### 3. Qualidade dos dados

Cobertura a conferir (408 setores, 6 CRAS, 22 UBS/USF, 68 escolas), **separando coordenada verificada de coordenada aproximada pelo CEP cadastral do equipamento**:

| Categoria | Total | Coordenada do catálogo (verificada) | Aproximada pelo centro do CEP |
|---|---|---|---|
| CRAS | 6 | 6 | 0 |
| UBS/USF | 22 | 22 | 0 |
| Escolas municipais | 68 | 33 | 35 |

(Valores lidos de `web/dados/indicadores_territoriais.json`, campo `equipamentos`; conferir de novo no início da etapa.)

- A tela deve mostrar essa distinção para as escolas e dizer que, com cobertura incompleta, a distância às escolas é superestimada no cenário do catálogo.
- Setores pequenos: aplicar D4 (nenhum setor suprimido ou agregado; os 17 com menos de 5 pessoas ou menos de 3 domicílios levam o aviso "população muito pequena, interprete com cautela").
- Registrar a fonte e o significado de cada campo usado (pessoas, domicílios, área, densidade, distâncias).
- Conferir os códigos de setor entre o JSON de indicadores e `web/dados/setores.geojson`.

Pronto quando: cada número da tela tiver fonte documentada e a distinção verificada/aproximada estiver visível.

### 4. Funcionamento e usabilidade

- Computador e celular: leitura sem rolagem horizontal da página, alvos de toque adequados, mapa utilizável com o dedo.
- Teclado: todos os controles e setores alcançáveis e operáveis sem mouse, com foco visível.
- Contraste: texto e legenda legíveis, e cores não podem ser o único sinal (usar também texto ou padrão).
- Limitações visíveis na tela, sem exigir clique para vê-las.

Pronto quando: testado nos dois tamanhos de tela e só com teclado, com os resultados registrados.

### 5. Integração à navegação do site

Hoje a página `mapa-territorial.html` não tem link no menu do site.

- Decidir o rótulo e o lugar do link, e que o texto de entrada informe que se trata de dados agregados e de equipamentos públicos.
- Garantir que a página volte ao site e que os testes de links locais continuem passando.

Pronto quando: a página for alcançável pelo menu e os testes de navegação passarem.

### 6. Validação para publicação

A publicação só acontece quando todos os critérios abaixo forem atendidos e registrados:

1. Sem dados de pessoa.
2. Fontes documentadas.
3. Indicadores conferidos.
4. Testes aprovados.
5. Funcionamento em computador e celular.
6. Limitações visíveis.

A mesclagem é decisão do autor.
