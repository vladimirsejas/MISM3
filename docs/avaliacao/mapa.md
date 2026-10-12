# Avaliação do mapa e da busca por CRAS

## Testes automatizados existentes

O teste `web/tests/mapa.test.js` valida a localização de serviços, busca de CRAS por bairro, apelidos confirmados, relação CEP ↔ bairro provável e serviço mais próximo por tipo. No GitHub Actions, a execução reportou:

- **167 bairros** das listas de CRAS conferidos; **1** aparece em mais de um CRAS.
- **165 serviços** no catálogo de mapa: **45** localizados por coordenada de endereço, **38** por centro de CEP dentro do limite de precisão e **82** sem posição confiável.
- **1.154 CEPs** com bairro provável, a partir do índice atual.
- O teste verifica que coordenadas fora de Rio Claro, CEPs vagos, bairros desconhecidos e apelidos ainda não confirmados não gerem correspondências inventadas.

## O que esses números significam — e não significam

Os números descrevem cobertura e integridade dos dados, não uma acurácia geográfica independente. A regra de bairro provável usa setores censitários do IBGE; o agrupamento pode divergir do nome usado pela Prefeitura. A distância no mapa usa coordenadas disponíveis e pode ser aproximada quando deriva do CEP.

O teste não prova, por si só, que o limite de atendimento de cada CRAS está atualizado ou que um endereço pertence oficialmente à sua área de abrangência. Para medir isso, seria necessário um conjunto de referência municipal verificado e datado. Não devemos inventar esse gabarito.

A suíte existente roda com `node web/tests/mapa.test.js` e faz parte do CI.
