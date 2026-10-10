# Integração dos dados de saúde da mulher no MISM3

## O que veio do repositório MISM

O arquivo `MISM-main.zip` fornecido para esta integração contém três scripts Python e um README. **Não contém os CSVs com os registros de saúde.** Portanto, esta integração incorpora o processamento e a documentação, mas não importa linhas de dados que não vieram no ZIP.

Os scripts de origem são úteis como referência, mas não devem ser copiados diretamente para produção:
- `georreferenciar_dados.py` envia CEPs a serviços externos e cria coordenadas aproximadas artificiais quando não consegue geocodificar;
- `gerar_clusters_bairro.py` exporta CEPs, idade mínima/máxima e detalhes de geolocalização;
- `gerar_mapa.py` constrói visualizações a partir de registros individuais.

Esses comportamentos precisam ser revistos antes de qualquer publicação.

## Integração adicionada

O novo script `pipeline/saude_mulher.py` lê localmente os sete CSVs esperados em:

```
dados/bruto/saude_mulher/
```

Ele agrega registros por categoria e ano e gera:

```
dados/bruto/saude_mulher/saude_mulher_resumo.json
```

O diretório `dados/bruto/` já é excluído do Git pelo `.gitignore` do projeto. Os CSVs originais e o resumo gerado ficam locais e não devem ser versionados.

Comando no Windows, na raiz do projeto:

```powershell
python pipeline\saude_mulher.py
```

É possível indicar outra pasta e destino com `--entrada` e `--saida`.

## Proteções aplicadas

- Não exporta CEP, endereço, coordenadas, idade individual ou datas completas.
- Não faz chamadas de geocodificação com CEP de pacientes.
- Suprime contagens inferiores a cinco registros.
- Não inventa coordenadas nem atribui registros a bairros sem uma fonte territorial validada.
- Marca a fonte como pendente de confirmação e descreve a medida como registros administrativos.

## Antes de publicar indicadores

O README do projeto de origem afirma que a fonte exata dos dados ainda precisa ser confirmada (por exemplo, SIH, SIM ou SISCAN). Por isso, o JSON não deve ser rotulado como incidência de câncer, diagnóstico confirmado, internações ou mortalidade até verificar a extração original, o significado das colunas e o recorte populacional.

A supressão de grupos pequenos é uma proteção mínima, não uma garantia completa contra reidentificação. Antes de publicar, é necessário revisar os riscos de inferência, as categorias, a combinação com outras fontes e as regras de acesso.

## Próxima integração funcional

Depois da confirmação da fonte e da validação dos agregados, o MISM3 poderá exibir uma seção de saúde da mulher com séries temporais e metadados de qualidade. O módulo não altera as páginas compartilhadas do frontend nesta etapa; isso evita conflito com a rodada de revisão visual em andamento.
