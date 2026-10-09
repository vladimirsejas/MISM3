# Inspirações: como outros países e São Paulo organizam o apoio, e o que adaptar

**Data da pesquisa:** 2026-10-09. **Como foi feita:** buscas na web. Os sites oficiais (gov.fr, gov.uk, hilfetelefon.de, thehotline.org, rioclaro.sp.gov.br…) **não puderam ser abertos** daqui; as informações vêm de resumos de busca, páginas de órgãos públicos citadas nos resultados e reportagens. Cada item traz **Confiança**: *Alta* (página de órgão público ou da própria organização), *Média* (reportagem ou fonte secundária), *A confirmar* (não achei fonte clara). **Antes de usar qualquer número ou regra no site, confirmar no site oficial.**

Regra de adaptação: copiamos o **princípio**, nunca o serviço. O que depende de lei, dinheiro ou sistema que Rio Claro não tem fica como "para perguntar à Prefeitura".

---

## 1. Violência e pedido de ajuda

| País | O que fazem | Confiança |
|---|---|---|
| **Alemanha** | [Hilfetelefon 116 016](https://www.apotheke-adhoc.de/nachrichten/detail/panorama/hilfetelefon-gewalt-gegen-frauen-kostenlose-beratung-24-7/): 24 h, anônimo, gratuito; **telefone, e-mail e chat**; atendimento em 18 idiomas, língua de sinais e **linguagem simples**; encaminha ao apoio local. **Frauenhaus-Suche** ([ZIF, desde 2021](https://netzpolitik.org/2021/haeusliche-gewalt-suchmaschine-fuer-freie-plaetze-in-frauenhaeusern-gestartet/)): busca nacional de abrigos com capacidade atualizada diariamente; participação voluntária; em 2025 houve mais de 36 mil buscas sem abrigo encontrado ([ZIF, mai/2026](https://autonome-frauenhaeuser-zif.de/wp-content/uploads/2026/05/ZIF_PM_Fuenf_Jahre_Frauenhaus-Suche_18.05.2026.pdf)) | Média |
| **França** | [Plataforma de polícia/gendarmaria por chat](https://www.prefectures-regions.gouv.fr/bretagne/Region-et-institutions/L-action-de-l-Etat/Egalite-et-droits-des-femmes/Violences-sexistes-et-sexuelles-Qui-contacter/Vos-contacts-nationaux): anônimo, com atendentes treinados, **botão de saída rápida e apagamento do histórico**; 3919 para escuta e encaminhamento (horário diverge entre fontes); SMS 114 para surdos | Média |
| **Reino Unido** | App [Bright Sky](https://www.hestia.org/press-release-vodafone-foundation-and-hestia-launch-the-uks-first-app-to-provide-nationwide-domestic-abuse-support): diretório de serviços por localização, questionário "meu relacionamento é seguro?", diário seguro; **avisa para instalar só em aparelho que a pessoa tem certeza de que ninguém monitora** | Média |
| **EUA** | National DV Hotline: telefone, texto e chat; conteúdo de **plano de segurança**; botão de saída rápida que, como alertam [guias de apoio](https://eoc.gatech.edu/node/451), **não apaga o histórico** | Média |
| **São Paulo (Estado)** | [App SP Mulher Segura](https://www.bnewssaopaulo.com.br/noticias/politica/aplicativo-sp-mulher-segura-ganha-novas-ferramentas-de-apoio-e-protecao.html): login gov.br, boletim online, **botão de pânico para mulheres com medida protetiva** (aciona a PM com geolocalização), localizador de serviços; 142 delegacias da mulher, 18 em funcionamento 24 h; anunciada a Patrulha Mulher Segura | Média |

**O que adaptar ao MISM3**
1. **Página "Pedir ajuda"**, sem formulário: canais (180, 190, 192, delegacia online, SP Mulher Segura), o que cada um faz, e se é anônimo/gratuito. *Esforço baixo, sem dependências.*
2. **Campo "acessibilidade" nos serviços** (Libras, linguagem simples, acesso) como no Hilfetelefon. *Baixo.*
3. **Aviso de segurança do aparelho** na porta "Violência" (como o Bright Sky) e orientação honesta sobre histórico do navegador: nosso "Sair rápido" **não apaga o histórico** (já dito no README). *Baixo.*
4. **Plano de segurança** em lista (documentos, contatos, bolsa): só com texto revisado por especialistas (Secretaria da Mulher, defensoria ou ONG). **Não escrever por conta própria.** *Médio, depende de revisão.*
5. **Lição do Frauenhaus-Suche:** mostrar *"sem vaga/sem dado"* de forma honesta. Já fazemos ("ausência de cadastro não é ausência de serviço").

**Não copiar:** botão de pânico próprio com geolocalização (risco alto, exige operação 24 h).

## 2. Direitos e benefícios (o que eu posso receber?)

| País | O que fazem | Confiança |
|---|---|---|
| **França** | [Simulador de direitos](https://www.economie.gouv.fr/node/35858) (mesdroitssociaux.gouv.fr): **sem criar conta**, avalia direitos a dezenas de auxílios (a página cita 58) e **diz quais passos dar**; resultado é estimativa a confirmar | Média |
| **Reino Unido** | [Turn2us](https://turn2us.org.uk/services-for-organisations/why-use-our-tools): calculadora **anônima**, cerca de 10 minutos, mantida por especialistas, sem conta | Média |
| **EUA** | Linha **211** (informação e encaminhamento a serviços locais 24 h) e o padrão aberto [Open Referral / HSDS](https://openreferral.readthedocs.io/en/3.0/_sources/design_principles.md.txt) para diretórios de serviços: organização, serviço, local, **procedência** e **factualidade** | Média |

**O que adaptar**
1. **"Descubra o que perguntar no CRAS"**: questionário curto, **só no navegador**, que devolve uma lista de programas a pedir (Cadastro Único, Bolsa Família, BPC, tarifa social…) **sem valores**, com o passo seguinte e o link oficial. A lista de regras precisa vir de fonte oficial e ser conferida. *Médio.*
2. **Alinhar o catálogo ao HSDS** (nomes de campos, procedência, data de verificação). Já temos `fonte_url` e `verificado_em`; faltam horário estruturado, acessibilidade e idioma. *Baixo.*

## 3. Cuidado infantil (para ela poder trabalhar)

| País | O que fazem | Confiança |
|---|---|---|
| **França** | [monenfant.fr (CAF)](https://caf.fr/professionnels/offres-et-services/caf-des-alpes-maritimes/partenaires-locaux/newsletter-familles-et-territoires/newsletter-ndeg-3-juillet-2022/monenfantfr-decouvrez-le-nombre-de-places-disponibles): busca geolocalizada de creches, **com indicação de vagas disponíveis**, **simulador de custo** e apoio de um relais local; creches devem informar vagas pontuais | Média |
| **Reino Unido** | [Calculadora de cuidado infantil](https://www.gov.uk/childcare-calculator?hl=en-GB): diz **quais benefícios a pessoa pode usar**; os serviços são inspecionados e classificados pelo Ofsted | Média |
| **Alemanha** | [Kita-Navigator](https://www.bornheim.de/fileadmin/dokumente/_leben-familie/Kinderbetreuung/Kita_Navigator_Flyer.pdf): pré-matrícula online em várias unidades (de 8 a 25 por criança, conforme a cidade), **com prazos**; é **intenção de matrícula, não vaga garantida**; quem não tem internet pode fazer na unidade | Média |

**O que adaptar**
1. **Guia "Como pedir vaga na creche de Rio Claro"**: prazos, documentos, onde pedir, consulta pública da demanda escolar que já aparece no catálogo, e o aviso de que **cadastro não é vaga**. Dados via LAI (já redigidos). *Baixo.*
2. **Campos que o cidadão precisa**: faixa etária, período integral, horário. Já pedidos na LAI nº 4 e nº 5.
3. **Não** prometer "vagas disponíveis" sem dado oficial; a França só mostra porque há obrigação legal de informar.

## 4. Voltar ao trabalho, estudar e empreender

| País | O que fazem | Confiança |
|---|---|---|
| **Alemanha** | Agência de Emprego: [informação gratuita para quem volta ao trabalho](https://www.arbeitsagentur.de/vor-ort/datei/wiedereinstiegsberatung_ba150126.pdf) com encarregadas de igualdade; programa federal "Perspektive Wiedereinstieg" (2008 em diante, quase 17 mil participantes) e portal que **orienta a mulher a quem pode ajudá-la na região** | Média |
| **França** | **Force Femmes**: acompanhamento gratuito de mulheres com mais de 45 anos, com encontros individuais com uma **referente experiente** e oficinas (currículo, simulação de entrevista); depende de **voluntárias** de RH e empreendedorismo | Média |
| **Reino Unido** | [Autoavaliação de habilidades](https://nationalcareers.service.gov.uk:443/skills-assessment) (40 perguntas, 5 a 10 min, **código para retomar**); [guias e programas de retorno](https://www.gov.uk/government/collections/returning-to-work-guidance-and-evaluation-reports) para quem saiu para cuidar de alguém | Média |
| **EUA** | **Dress for Success**: roupa para entrevista e coaching, [gratuitos](https://ywcaoahu.org/dress-for-success-honolulu-services), por indicação ou procura direta | Média |
| **São Paulo (Estado)** | [Trampolim](https://tribunadejundiai.com.br/economia/empregos/trampolim-plataforma-gratuita-governo-sp/): vagas, currículo e testes; Qualifica SP com cursos gratuitos (modalidade "Novo Emprego" para 25 a 59 anos), inscrição com login gov.br; PAT com mais de 200 unidades | Média |

**O que adaptar**
1. **Trilha "Voltar ao trabalho"**: poucas perguntas, local no navegador, e devolve caminhos: Trampolim/Qualifica SP (aviso do requisito de idade e do login gov.br), PAT/CONECTA, cursos do Fundo Social, concursos abertos. A trilha de autonomia de hoje já faz a base. *Baixo a médio.*
2. **Mentoria em grupo, estilo Force Femmes e Dress for Success.** É o **"de mulher para mulher" de menor risco**: voluntárias de RH e empreendedoras fazem oficinas de currículo e entrevista em **local público** (biblioteca, Fatec), com a Fatec ou uma ONG como organizadora. Não é marketplace e não expõe contato individual. *Médio, precisa de voluntárias.*
3. **Campanha de roupas para entrevista** com o Fundo Social ou igreja/associação local. Só ideia: não verifiquei se já existe em Rio Claro.

## 5. Transporte

| Onde | O que fazem | Confiança |
|---|---|---|
| **Brasília** | [Desde 2014](https://planetizen.com/node/72323), depois das 22 h a mulher pode pedir para **descer fora do ponto**; Nova York tem programa parecido desde 2005. Não achei confirmação de que a regra de Brasília siga em vigor | Média |
| **São Paulo** | Pesquisa citada pelo [ITDP (mar/2026)](https://itdp.org/2026/03/12/making-bus-systems-safer-for-women-in-brazil-and-beyond/) diz que 91,1% das mulheres sentem medo esperando ônibus; campanha *Guarded Bus Stop* (Eletromidia, nome citado em inglês pela fonte) com videochamada a um agente, ampliada para 100 abrigos | Média |
| **Apps só para mulheres** | Lady Driver (SP, 2017; números de escala divergem entre fontes). Uber ampliou nos EUA a [preferência por motorista mulher](https://abcnews4.com/news/nation-world/women-can-now-request-female-drivers-on-uber) (**aumenta a chance, não garante**). Grab Malásia, em beta, verifica **passageiras** com documento e selfie. Crítica sul-africana: "só mulheres" é fraco se homens ainda podem pedir corrida. Safr (Boston) faz entrevista presencial e sessão de direção | Média |

**O que adaptar**
1. **Perguntar à Prefeitura/operadora** se existe desembarque noturno seguro em Rio Claro (a LAI nº 3 pode incluir) e, se existir, mostrar. *Baixo.*
2. **Horários**: seguir o plano já registrado (só publicar o que foi conferido).
3. **Não construir transporte de mulheres.** A lição de todos os casos: exige **verificação dos dois lados**, regulamentação de transporte remunerado e botão de emergência operado. Só vale **ligar** a um aplicativo licenciado que atenda Rio Claro (a confirmar).

## 6. Saúde

| País | O que fazem | Confiança |
|---|---|---|
| **Reino Unido** | [NHS: localizador de farmácias e médicos](https://sefton.communitypharmacy.org.uk/wp-content/uploads/sites/80/2026/05/NHS-Service-finder-Guide-April-26-final-spec.docx) com horários de funcionamento mantidos pelo próprio serviço; avisa que feriados mudam o horário | Média |

**Adaptar:** mostrar **"horário não informado: ligue"** em vez de calar; só mostrar "aberto agora" quando o horário for verificado. Falta um pedido de LAI à Secretaria de Saúde (horários das UBS, pré-natal, saúde da mulher): **acrescentar**.

## 7. Redes de mulheres que já funcionam no Brasil

| Rede | O que é | Confiança |
|---|---|---|
| [**Mapa do Acolhimento**](https://www.band.com.br/nacional/brasil/voluntarias-acolhem-vitimas-e-reforcam-combate-a-violencia-contra-mulheres) | ONG que conecta mulheres a **advogadas e psicólogas voluntárias**, gratuitamente, no país todo; mais de 30 mil pedidos em uma década (reportagem de jul/2026). O pareamento era manual no início. A triagem das voluntárias **não ficou clara nas fontes** | Média |
| [**Promotoras Legais Populares**](https://reachalliance.org/wp-content/uploads/2024/09/FINAL_Access-to-Justice-for-Women-in-Brazil_The-Role-of-Community-Paralegals.pdf) | Programa da ONG Themis (desde 1993): mulheres formadas como **paralegais comunitárias** para orientar outras mulheres; funciona também por universidades | Média |

**Adaptar:** na porta "Casamento e direitos", **apontar** para essas redes (depois de confirmar com elas) e para a Defensoria. Um projeto local de formação com a Fatec e outra universidade é ideia de longo prazo.

---

## Os melhores achados, em ordem

| # | Ideia | Origem | Esforço | Depende de |
|---|---|---|---|---|
| 1 | Página **"Pedir ajuda"** (canais, o que cada um faz, anônimo/gratuito, aviso do aparelho) | DE, FR, UK, SP | Baixo | Nada |
| 2 | **"O que perguntar no CRAS"**: guia de direitos local e anônimo | FR, UK | Médio | Fonte oficial das regras |
| 3 | **Trilha "Voltar ao trabalho"** com Trampolim, Qualifica SP, PAT, cursos | DE, UK, SP | Baixo/Médio | Dados que já temos |
| 4 | **Guia "Como pedir vaga na creche"** com prazos e aviso "cadastro ≠ vaga" | DE, FR | Baixo | LAI para dados |
| 5 | **Mentoria em grupo** como primeiro "de mulher para mulher" | FR, EUA | Médio | Voluntárias e um local público |
| 6 | Catálogo no padrão **HSDS** + campos de acessibilidade e idioma | EUA | Baixo | Nada |
| 7 | **"Aberto agora"** só com horário verificado | UK | Baixo | Horários |
| 8 | **Desembarque noturno seguro**: perguntar e, se existir, mostrar | Brasília | Baixo | LAI |

## Sobre "criar sem depender da Secretaria"
O MISM3 pode existir sem ninguém. Os casos estudados mostram **quem vigia a participação**: o Mapa do Acolhimento e a Force Femmes são ONGs que **selecionam e treinam** suas voluntárias; as plataformas de transporte verificam documento e selfie. Para a área "De mulher para mulher", sem órgão público, propomos **três níveis de selo, sempre honestos**: *autodeclarado* (ninguém conferiu), *conferido pela equipe do MISM3* (dizendo **como**) e *conferido por órgão oficial*. O site nunca diz "só mulheres" se o nível for o primeiro. Recomendação: começar por **mentoria em grupo** (item 5), que não expõe contato individual.

## Limites desta pesquisa
- Resumos de busca, não leitura direta dos sites oficiais; datas e números variam entre fontes (ex.: horário do 3919, escala do Lady Driver).
- Não localizei: regras vigentes do desembarque noturno fora de Brasília; triagem das voluntárias do Mapa do Acolhimento; interface atual do simulador francês; SBA Women's Business Centers (EUA); delegacia da mulher e serviços jurídicos gratuitos específicos de Rio Claro.
- Itens marcados como "a confirmar" não devem aparecer no site sem conferência.
