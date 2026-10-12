"""Monta a base de DESTINOS do motor de orientação (o que o sistema pode apontar para uma mulher que escreve uma dúvida).

Cada destino é uma unidade pesquisável com tudo o que a tela precisa para responder: título, resumo, contato, fonte, link e onde ele
mora no dashboard (área, seção, tipo/subtipo de serviço). Os destinos vêm só do que o projeto JÁ tem e verificou:
  - serviços do catálogo (web/dados/catalogo_manual.json), com o vocabulário popular de cada tipo (VOCABULARIO, abaixo);
  - seções, cartões e tópicos das áreas (web/areas.js, exportado pelo Node);
  - ferramentas do dashboard (currículo, plano, CRAS por bairro, perto de mim) e os horários de ônibus.
Nada aqui inventa serviço. Este módulo é Python puro; o navegador só lê o resultado (web/dados/indice_orientacao.json).

Uso:  python pipeline/indice_orientacao.py            (grava web/dados/indice_orientacao.json)
"""
from __future__ import annotations

import json
import re
import subprocess
import unicodedata
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
WEB = RAIZ / "web"
DADOS = WEB / "dados"

# Vocabulário POPULAR de cada tipo de serviço: como a mulher fala, que nem sempre é como a Prefeitura escreve.
# É conhecimento do domínio, escrito e revisável (cada linha pode ser conferida); alimenta a busca por palavras e por significado.
VOCABULARIO: dict[str, tuple[str, str]] = {
    "saude/ubs": ("Posto de saúde (UBS e USF)", "posto de saude ubs usf unidade basica consulta medico clinico geral pediatra ginecologista pre natal gravida gestante vacina preventivo curativo dentista cuidado do bairro agendar consulta postinho posto do bairro sus pelo sus machucado ralou ferimento joelho cotovelo corte pequeno atestado"),
    "saude/urgencia": ("UPA e pronto atendimento 24 horas", "upa pronto socorro pronto atendimento urgencia emergencia febre alta acidente dor forte madrugada samu atendimento 24 horas passando mal"),
    "saude/hospital": ("Hospital", "hospital santa casa internacao cirurgia maternidade parto internado emergencia"),
    "saude/farmacia": ("Farmácia e remédios pela rede pública", "farmacia remedio medicamento receita dispensacao de graca sem dinheiro para remedio medicamentos gratuitos"),
    "saude/laboratorio": ("Laboratório e exames", "laboratorio exame de sangue exames coleta resultado de exame"),
    "saude/especialidades": ("Especialidades (dentista, mamografia, fisioterapia e outras)", "especialidades especialista dentista odontologia mamografia fisioterapia ortopedista cardiologista ginecologia exame de imagem ultrassom raio x encaminhamento dor de dente dentista pelo sus gratuito obturacao extracao canal siso tratamento dentario"),
    "saude/caps": ("CAPS: saúde mental, álcool e drogas", "caps saude mental psicologo psicologa psiquiatra depressao ansiedade panico tristeza sem vontade de nada surto crise drogas alcool dependencia vicio cracolandia familia de dependente atendimento psicologico terapia"),
    "saude/cei": ("Centro de Especialidade Infantil", "centro de especialidade infantil crianca fonoaudiologo fono terapia ocupacional atraso de fala autismo desenvolvimento tea transtorno do espectro autista terapia filho com autismo"),
    "saude/centro_habilitacao": ("Centro de habilitação infantil", "habilitacao reabilitacao crianca deficiencia fisioterapia"),
    "saude/secretaria": ("Fundação de Saúde e agendamento (Cadu)", "cadu agendamento de consultas fundacao de saude ouvidoria reclamacao atendimento ruim marcar consulta telefone 0800"),
    "saude/transporte": ("Transporte para tratamento de saúde", "transporte sanitario tfd tratamento fora de domicilio ambulancia viagem para tratamento hospital em outra cidade"),
    "mulher/ddm": ("Delegacia da Mulher (DDM)", "delegacia da mulher ddm boletim de ocorrencia denuncia policia medida protetiva registrar violencia ameaca agressao estupro"),
    "mulher/cram": ("CRAM: atendimento à mulher em situação de violência", "cram centro de referencia de atendimento a mulher violencia psicologa assistente social acolhimento escuta apoio violencia domestica"),
    "mulher/patrulha": ("Patrulha Maria da Penha", "patrulha maria da penha guarda civil acompanhamento medida protetiva visitas protecao"),
    "mulher/defensoria": ("Defensoria Pública (orientação jurídica gratuita)", "defensoria publica advogado advogada gratuito de graca pensao alimenticia guarda divorcio separacao medida protetiva direito juridico nudem"),
    "mulher/secretaria": ("Secretaria Municipal da Mulher", "secretaria da mulher politicas para mulheres atendimento a mulher whatsapp cram centro de referencia de atendimento a mulher"),
    "assistencia/cras": ("CRAS: porta de entrada da assistência social", "cras assistencia social cesta basica comida fome sem renda sem dinheiro beneficio bolsa familia cadunico cadastro unico auxilio bpc ajuda financeira documentos acompanhamento da familia necessidade grana sem grana pra comer sem comida passando fome alimento mantimento nao tenho o que comer"),
    "assistencia/creas": ("CREAS: proteção quando direitos são violados", "creas violacao de direitos violencia abuso abandono negligencia situacao de rua morador de rua maus tratos trabalho infantil"),
    "assistencia/conselho_tutelar": ("Conselho Tutelar", "conselho tutelar crianca adolescente maus tratos abuso negligencia abandono denuncia direitos da crianca menor crianca fora da escola nao vai na escola evasao escolar crianca na rua abandono"),
    "assistencia/scfv": ("Convivência e fortalecimento de vínculos", "convivencia fortalecimento de vinculos contraturno atividades criancas adolescentes idosos grupo servico de convivencia lugar para idoso durante o dia"),
    "assistencia/apae": ("APAE: pessoas com deficiência", "apae deficiencia deficiente intelectual autismo sindrome de down apoio familia"),
    "assistencia/acolhimento": ("Acolhimento em república feminina (jovens de 18 a 21 anos)", "republica feminina acolhimento jovens 18 a 21 anos saindo de abrigo acolhimento institucional moradia para jovem"),
    "assistencia/sede": ("Secretaria de Desenvolvimento Social", "secretaria de desenvolvimento social assistencia social sede nam"),
    "emprego_curso/pat": ("PAT: vagas de emprego e atendimento ao trabalhador", "pat posto de atendimento ao trabalhador vaga de emprego vagas procurar emprego desempregada seguro desemprego carteira de trabalho curriculo intermediacao ninguem me contrata mulher mais velha de 40 anos 50 anos 55 anos idade dificuldade de conseguir emprego"),
    "emprego_curso/conecta": ("CONECTA: emprego e oportunidades", "conecta empregos oportunidades vagas cadastro emprego"),
    "emprego_curso/credito": ("Banco do Povo (crédito para empreender)", "banco do povo microcredito emprestimo credito empreender abrir negocio pequeno negocio mei capital de giro vender"),
    "emprego_curso/fundo_social": ("Fundo Social de Solidariedade", "fundo social solidariedade cursos gratuitos programas informacoes"),
    "emprego_curso/qualificacao": ("Centro de Qualificação Profissional (cursos gratuitos)", "centro de qualificacao profissional cqp cursos gratuitos informatica costura cabeleireira manicure culinaria aprender profissao curso de graca"),
    "emprego_curso/curso_profissionalizante": ("Cursos profissionalizantes (SENAI, Senac, SEST SENAT)", "senai senac sest senat curso profissionalizante curso profissional formacao qualificacao profissao"),
    "emprego_curso/curso_tecnico": ("Cursos técnicos (Etec)", "etec curso tecnico tecnico enfermagem informatica administracao centro paula souza"),
    "emprego_curso/curso_superior_tecnologia": ("Curso superior de tecnologia (Fatec)", "fatec faculdade tecnologia curso superior tecnologo inteligencia artificial faculdade publica estadual gratuita universidade publica"),
    "emprego_curso/graduacao": ("Faculdade (graduação)", "faculdade graduacao licenciatura pedagogia curso superior universidade vestibular bolsa"),
    "emprego_curso/eja": ("EJA: terminar os estudos", "eja ensino medio supletivo terminar os estudos voltar a estudar concluir estudos jovens e adultos parei de estudar noite"),
    "emprego_curso/eja_unesp": ("PEJA (Unesp): educação de jovens e adultos", "peja unesp educacao de jovens e adultos 15 anos ou mais"),
    "emprego_curso/escola_sesi": ("SESI: ensino e EJA", "sesi escola ensino fundamental ensino medio eja gratuito"),
    "emprego_curso/cursinho_popular": ("Cursinho popular gratuito (vestibular e ENEM)", "cursinho pre vestibular vestibular enem simulado gratuito metamorfose unesp preparatorio faculdade"),
    "emprego_curso/secretaria": ("Secretaria de Desenvolvimento Econômico", "secretaria de desenvolvimento economico sala do empreendedor mei empreendedorismo emprego empresa"),
    "creche/secretaria": ("Secretaria da Educação (matrícula e vagas)", "secretaria da educacao matricula vaga creche escola transferencia historico escolar educacao infantil cmei rematricula"),
    "creche/escola_municipal": ("Escolas municipais de Rio Claro (creche e pré-escola)", "escola municipal emef emei cmei creche pre escola educacao infantil escola perto de casa bairro"),
}

# Vocabulário popular das SEÇÕES das áreas (chave "área/seção"): palavras que a mulher usa e que o texto da seção não traz.
VOCABULARIO_SECOES: dict[str, str] = {
    "direitos/secao-1": "pensao alimenticia pensao guarda divorcio separacao separar advogado pai dos meus filhos nao paga pensao ex marido ex companheiro nao deixa ver o filho visita",
    "direitos/secao-2": "violencia domestica agressao ameaca ameacou medo marido companheiro namorado ex bate bateu apanhando apanhar persegue humilha medida protetiva sair de casa abuso estupro violencia psicologica agressor denunciar",
    "direitos/secao-3": "aposentadoria inss beneficio negado divida dividas nome sujo negativado renegociar cobranca conta atrasada",
    "moradia/secao-1": "agua conta de agua daae tarifa social esgoto desconto conta cara",
    "moradia/secao-2": "luz conta de luz energia eletrica elektro tarifa social desconto cortaram a luz conta alta",
    "moradia/secao-3": "habitacao casa propria moradia popular cadastro habitacional minha casa minha vida aluguel aluguel social despejo despejada morar sem casa sem teto lugar para morar moro de favor",
    "assistencia/secao-1": "cras assistencia comida fome cesta basica sem renda beneficio bolsa familia cadunico documentos certidao registro civil segunda via ajuda financeira",
    "assistencia/secao-2": "denuncia violacao de direitos crianca adolescente maus tratos abuso negligencia abandono creas conselho tutelar disque 100",
    "assistencia/secao-3": "convivencia contraturno idoso criancas atividades deficiencia apae",
    "saude/saude-familia-drogas": "drogas alcool bebe bebado alcoolatra viciado vicio crack maconha cocaina dependente quimico dependencia familia de dependente grupo de apoio narcoticos anonimos alcoolicos anonimos amor exigente parar de beber parar de usar caps ad",
    "saude/saude-unidades": "posto de saude ubs usf upa hospital consulta medico unidade de saude remedio exame vacina preventivo",
    "educacao/educacao-filhos": "creche vaga matricula escola filho filha crianca transferir transferencia rematricula calendario escolar cmei nao tenho com quem deixar meu filho",
    "educacao/educacao-voce": "eja ensino medio terminar os estudos faculdade vestibular enem cursinho curso tecnico etec fatec voltar a estudar parei de estudar",
    "educacao/educacao-escolas": "escola municipal creche emef emei cmei lista das escolas telefone endereco perto de casa bairro",
    "trabalho/secao-1": "emprego trabalho vaga curso gratuito qualificacao pat conecta banco do povo credito empreender curriculo renda desempregada",
}

# Necessidade (as 9 do classificador) a que cada destino serve. O motor soma a dica do classificador a esses destinos.
def necessidades_do_destino(u: dict) -> list[str]:
    svc, area, sec = u.get("svc") or "", u.get("area") or "", u.get("sec") or ""
    tipo = svc.split("/")[0] if svc else ""
    if tipo == "mulher":
        return ["violencia", "casamento"] if svc in ("mulher/defensoria", "mulher/secretaria") else ["violencia"]
    if svc in ("assistencia/creas", "assistencia/conselho_tutelar"):
        return ["violencia", "familia"]
    if svc in ("assistencia/cras", "assistencia/sede", "assistencia/scfv", "assistencia/apae", "assistencia/acolhimento"):
        return ["familia"]
    if tipo == "saude":
        return ["saude"]
    if svc in ("creche/secretaria", "creche/escola_municipal"):
        return ["filhos"]
    if svc in ("emprego_curso/pat", "emprego_curso/conecta", "emprego_curso/credito", "emprego_curso/fundo_social", "emprego_curso/qualificacao",
               "emprego_curso/curso_profissionalizante", "emprego_curso/secretaria"):
        return ["emprego_curso"]
    if tipo == "emprego_curso":
        return ["estudo", "emprego_curso"]
    if area == "direitos":
        return {"secao-1": ["casamento"], "secao-2": ["violencia"], "secao-3": ["dividas"]}.get(sec, ["casamento", "violencia", "dividas"])
    if area == "moradia":
        return ["moradia"]
    if area == "saude":
        return ["saude"]
    if area == "educacao":
        return ["estudo"] if sec in ("educacao-voce",) else ["filhos"]
    if area == "trabalho":
        return ["emprego_curso"]
    if area == "assistencia":
        return ["familia"]
    return []


# Ferramentas e destinos que não são serviços do catálogo.
FERRAMENTAS = [
    {"id": "ferr-curriculo", "area": "trabalho", "sec": "montar-curriculo", "titulo": "Montar um currículo", "resumo": "Preencha poucos campos e o sistema monta o seu currículo para imprimir ou salvar. Nada é enviado nem guardado.", "href": "#trabalho/montar-curriculo",
     "texto": "montar curriculo curriculum cv fazer um curriculo bom emprego vaga entrevista imprimir"},
    {"id": "ferr-plano-trabalho", "area": "trabalho", "sec": "titulo-jornada", "titulo": "Meu plano de trabalho", "resumo": "Responda poucas perguntas e receba um plano com os primeiros passos para voltar a trabalhar.", "href": "#trabalho/titulo-jornada",
     "texto": "plano de trabalho voltar a trabalhar entrevista de emprego por onde comecar nunca trabalhei carteira assinada plano passo a passo emprego"},
    {"id": "ferr-plano-educacao", "area": "educacao", "sec": "titulo-jornada", "titulo": "Meu plano de estudos e vagas", "resumo": "Responda poucas perguntas e veja os primeiros passos para vaga dos filhos ou para estudar.", "href": "#educacao/titulo-jornada",
     "texto": "plano de estudos e vagas passo a passo vaga para o filho voltar a estudar por onde comecar"},
    {"id": "ferr-plano-assistencia", "area": "assistencia", "sec": "titulo-jornada", "titulo": "Meu plano de apoio", "resumo": "Diga do que precisa e veja o primeiro canal e o que perguntar.", "href": "#assistencia/titulo-jornada",
     "texto": "plano de apoio assistencia social por onde comecar falta dinheiro comida direitos violados convivencia"},
    {"id": "ferr-cras-bairro", "area": "assistencia", "sec": "busca-bairro", "titulo": "Qual CRAS atende o meu bairro?", "resumo": "Escreva o nome do bairro e veja o CRAS que atende, pela lista oficial da Prefeitura.", "href": "#mapa/cras",
     "texto": "qual cras atende o meu bairro cras do bairro regiao endereco moro no bairro cras da minha regiao"},
    {"id": "ferr-perto-cep", "area": "educacao", "sec": "busca-por-cep", "titulo": "Creches e escolas perto de mim (pelo CEP)", "resumo": "Informe o seu CEP e veja as unidades que ficam mais perto, com endereço e telefone.", "href": "#educacao/busca-por-cep",
     "texto": "creches e escolas perto de mim cep escola mais proxima perto de casa unidade perto"},
    {"id": "ferr-mapa", "area": "mapa", "sec": "mapa-inicio", "titulo": "Mapa de serviços e o que fica perto de você", "resumo": "Veja no mapa onde ficam os serviços e, com o seu CEP, o mais perto de cada tipo e o bairro provável.", "href": "#mapa",
     "texto": "mapa de servicos o que tem perto da minha casa perto de mim cep bairro onde fica qual meu bairro pelo cep localizar"},
]


def sem_acento(t: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", str(t or "")) if unicodedata.category(c) != "Mn")


def normalizar(t: str) -> str:
    """Mesma normalização do navegador (web/necessidades.js): sem acento, minúsculas, só letras e números."""
    t = sem_acento(t).lower().replace("-", "")
    t = re.sub(r"[^a-z0-9\s]", " ", t)
    return re.sub(r"\s+", " ", t).strip()


# Palavras de ligação que não ajudam a achar nada. "casa" fica de fora porque aparece em "em casa" quase sempre (e puxaria "Santa Casa").
PARADAS = frozenset("""a o as os um uma uns umas de da do das dos em na no nas nos por para pra com sem sobre entre ate ao aos e ou mas que se sou sao ser
estou esta estao foi fui vai vou ter tenho tem tinha minha meu minhas meus sua seu suas seus como qual quais quando onde quem porque preciso precisa quero
quer queria posso pode fazer faco faz saber aqui ali la isso isto esse essa muito muita mais menos ja nao sim tambem so ainda eu voce me te lhe nos ela ele
eles elas dele dela ver ha hoje agora gostaria algum alguma coisa coisas ajuda ajudar to ta casa""".split())


def raiz(p: str) -> str:
    """Raiz de uma palavra: gênero e plural viram uma só forma; o resto usa os 5 primeiros caracteres (crech-e/es, matric-ula/ular)."""
    if re.fullmatch(r"filh[oa]s?", p):
        return "filho"
    if re.fullmatch(r"(bebe|bebes)", p):
        return "bebe"
    if re.fullmatch(r"(maes?|mamae)", p):
        return "mae"
    return p[:5] if len(p) > 5 else p


def fichas(texto: str) -> list[str]:
    return [raiz(w) for w in normalizar(texto).split() if len(w) >= 3 and w not in PARADAS]


def sem_paradas(texto: str) -> str:
    """A consulta sem palavras de ligação, para a comparação por letras (assim "em casa" não puxa "Santa Casa")."""
    return " ".join(w for w in normalizar(texto).split() if w not in PARADAS)


def carregar_areas() -> dict:
    """Exporta o conteúdo das áreas (web/areas.js) pelo Node: a fonte da verdade do texto das áreas continua sendo uma só."""
    js = ("const A=require('./web/areas.js');process.stdout.write(JSON.stringify({AREAS:A.AREAS.map(a=>({id:a.id,nome:a.nome,intro:a.intro,"
          "secoes:(a.secoes||[]).map(s=>({titulo:s.titulo,ancora:s.ancora||null,descricao:s.descricao||'',tipos:s.tipos||[],subtipos:s.subtipos||null,"
          "links:(s.links||[]).map(l=>l[0]),canais:(s.canais||[]).map(c=>({nome:c.nome,texto:c.texto||'',topicos:c.topicos||[],aviso:c.aviso||'',fonte:c.fonte||null}))}))}))}))")
    r = subprocess.run(["node", "-e", js], cwd=RAIZ, capture_output=True, text=True, encoding="utf-8", check=True)  # utf-8 explícito: no Windows o padrão é cp1252
    return json.loads(r.stdout)


def carregar_catalogo() -> list[dict]:
    return json.loads((DADOS / "catalogo_manual.json").read_text(encoding="utf-8"))["servicos"]


def carregar_onibus() -> dict:
    return json.loads((DADOS / "horarios_onibus.json").read_text(encoding="utf-8"))


def cortar(t: str, n: int) -> str:
    t = re.sub(r"\s+", " ", str(t or "")).strip()
    if len(t) <= n:
        return t
    c = t.rfind(" ", 0, n)
    return t[: c if c > n * 0.6 else n].rstrip(",;: ") + "…"


def primeiro_telefone(t: str) -> str:
    return str(t or "").split("/")[0].strip()


def colocacoes(areas: dict, servicos: list[dict]) -> dict[str, list[tuple[str, str]]]:
    """Em quais (área, seção) cada serviço aparece no dashboard (mesma regra do app.js: primeira seção que o aceita, por área)."""
    saida: dict[str, list[tuple[str, str]]] = {}
    for a in areas["AREAS"]:
        vistos: set[str] = set()
        for i, sec in enumerate(a["secoes"], 1):
            if not sec["tipos"]:
                continue
            ancora = sec["ancora"] or f"secao-{i}"
            for s in servicos:
                if s["id"] in vistos or s["tipo"] not in sec["tipos"]:
                    continue
                if sec["subtipos"] and s.get("subtipo") not in sec["subtipos"]:
                    continue
                vistos.add(s["id"])
                saida.setdefault(s["id"], []).append((a["id"], ancora))
    return saida


def montar_unidades(areas: dict, servicos: list[dict], onibus: dict) -> list[dict]:
    un: list[dict] = []
    colocs = colocacoes(areas, servicos)

    # --- serviços do catálogo (cada um, em cada lugar onde aparece). As escolas viram uma unidade só (68 cartões inundariam a busca).
    por_svc: dict[str, list[dict]] = {}
    for s in servicos:
        svc = f"{s['tipo']}/{s.get('subtipo') or ''}"
        por_svc.setdefault(svc, []).append(s)
    for svc, lista in por_svc.items():
        titulo_pop, vocab = VOCABULARIO.get(svc, (svc, ""))
        a0, sec0 = (colocs.get(lista[0]["id"]) or [("assistencia", "secao-1")])[0]
        if svc == "creche/escola_municipal":
            nomes = " ".join(f"{s['nome']} {s.get('endereco') or ''}" for s in lista)
            un.append({"id": "classe-escolas", "tipo": "classe", "area": "educacao", "sec": "educacao-escolas", "svc": svc, "titulo": titulo_pop,
                       "resumo": f"{len(lista)} escolas municipais, com endereço e telefone. Informe o seu CEP para ver as mais perto.", "href": "#educacao/educacao-escolas",
                       "texto": f"{titulo_pop} {vocab} {nomes}", "n": len(lista)})
            continue
        if len(lista) >= 5:  # classes grandes (UBS, convivência, CRAS...): uma unidade genérica + as específicas
            un.append({"id": f"classe-{svc.replace('/', '-')}", "tipo": "classe", "area": a0, "sec": sec0, "svc": svc, "titulo": titulo_pop,
                       "resumo": f"{len(lista)} unidades em Rio Claro. Veja a lista, ou informe o seu bairro ou CEP para a mais perto.", "href": f"#{a0}/{sec0}",
                       "texto": f"{titulo_pop} {vocab}", "n": len(lista)})
        for s in lista:
            for (area, sec) in (colocs.get(s["id"]) or [(a0, sec0)]):
                un.append({
                    "id": s["id"], "tipo": "servico", "area": area, "sec": sec, "svc": svc, "titulo": s["nome"],
                    "resumo": cortar(s.get("observacao") or titulo_pop, 170), "href": f"#{area}/{sec}",
                    "contato": {"telefone": primeiro_telefone(s.get("telefone")), "endereco": s.get("endereco") or "", "horario": s.get("horario") or ""},
                    "fonte": {"url": s.get("fonte_url") or "", "verificado_em": s.get("verificado_em") or ""},
                    "texto": f"{s['nome']} {vocab} {s.get('observacao') or ''} {s.get('bairros') or ''} {s.get('endereco') or ''} {s.get('grupo') or ''}",
                })

    # --- seções e cartões das áreas
    for a in areas["AREAS"]:
        un.append({"id": f"area-{a['id']}", "tipo": "area", "area": a["id"], "sec": None, "svc": None, "titulo": a["nome"],
                   "resumo": cortar(a["intro"], 170), "href": f"#{a['id']}", "texto": f"{a['nome']} {a['intro']}"})
        for i, sec in enumerate(a["secoes"], 1):
            ancora = sec["ancora"] or f"secao-{i}"
            un.append({"id": f"sec-{a['id']}-{ancora}", "tipo": "secao", "area": a["id"], "sec": ancora, "svc": None, "titulo": sec["titulo"],
                       "resumo": cortar(sec["descricao"], 170), "href": f"#{a['id']}/{ancora}",
                       "texto": f"{sec['titulo']} {sec['descricao']} " + " ".join(sec["links"]) + " " + VOCABULARIO_SECOES.get(f"{a['id']}/{ancora}", "")})
            for c in sec["canais"]:
                topicos = " ".join(f"{t[0]} {t[1]}" for t in c["topicos"])
                fonte = c.get("fonte") or [None, None, None]
                un.append({"id": f"canal-{a['id']}-{ancora}-{len(un)}", "tipo": "canal", "area": a["id"], "sec": ancora, "svc": None, "titulo": c["nome"],
                           "resumo": cortar(c["texto"] or (c["topicos"][0][1] if c["topicos"] else ""), 190), "href": f"#{a['id']}/{ancora}",
                           "fonte": {"url": fonte[1] or "", "verificado_em": fonte[2] or ""},
                           "texto": f"{c['nome']} {c['texto']} {topicos} {c.get('aviso') or ''}"})

    # --- ferramentas, transporte e Entre Mulheres
    for f in FERRAMENTAS:
        un.append({**f, "tipo": "ferramenta", "svc": None})
    linhas = " ".join(f"linha {l.get('numero', '')} {l['nome']}" for l in onibus["linhas"])
    un.append({"id": "area-transporte", "tipo": "area", "area": "transporte", "sec": None, "svc": None, "titulo": "Horários de ônibus (SOU Transportes)",
               "resumo": "Horários das linhas, com as próximas saídas de hoje e os dias úteis, sábados e domingos.", "href": "#transporte",
               "texto": f"horario de onibus onibus linha circular passa que horas sou transportes transporte coletivo ponto saida {linhas} bela vista cervezao cvz paineiras domingo sabado dia util"})
    un.append({"id": "area-entre-mulheres", "tipo": "area", "area": "entre-mulheres", "sec": None, "svc": None, "titulo": "Entre Mulheres: serviços de mulheres para mulheres",
               "resumo": "Mulheres que oferecem serviços a outras mulheres: motorista, psicóloga, beleza, aulas e mais.", "href": "#entre-mulheres",
               "texto": "entre mulheres rede de mulheres oferecer meus servicos manicure cabeleireira motorista mulher psicologa mulher academia so para mulheres aulas beleza servico feito por mulher cadastro"})
    return un


K_LSA = 64


def construir_indice(un: list[dict]) -> dict:
    """Vocabulário e matriz de SIGNIFICADO (LSA) a partir dos textos dos destinos. O navegador só lê isto e multiplica."""
    import numpy as np
    from sklearn.decomposition import TruncatedSVD
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.preprocessing import normalize as l2

    vec = TfidfVectorizer(analyzer=fichas, sublinear_tf=True)
    X = vec.fit_transform([u["texto"] for u in un])
    svd = TruncatedSVD(K_LSA, algorithm="arpack", random_state=0)
    Z = l2(svd.fit_transform(X))
    termos = [t for t, _ in sorted(vec.vocabulary_.items(), key=lambda kv: kv[1])]
    comp = np.round(svd.components_.T * 1000).astype(int)  # termo x k
    return {
        "k": K_LSA,
        "termos": termos,
        "idf": [round(float(x), 4) for x in vec.idf_],
        "comp": comp.tolist(),
        "docs": np.round(Z * 1000).astype(int).tolist(),
        "variancia_explicada": round(float(svd.explained_variance_ratio_.sum()), 3),
    }


def gerar() -> dict:
    areas, servicos, onibus = carregar_areas(), carregar_catalogo(), carregar_onibus()
    un = montar_unidades(areas, servicos, onibus)
    for u in un:
        u["needs"] = necessidades_do_destino(u)
    return {
        "meta": {"descricao": "Destinos do motor de orientação (serviços, seções, ferramentas) e matriz de significado (LSA). Gerado por pipeline/indice_orientacao.py: não edite à mão.",
                 "n_destinos": len(un)},
        "unidades": un,
        "lsa": construir_indice(un),
    }


def main() -> None:
    saida = gerar()
    caminho = DADOS / "indice_orientacao.json"
    caminho.write_text(json.dumps(saida, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    por: dict[str, int] = {}
    for u in saida["unidades"]:
        por[u["tipo"]] = por.get(u["tipo"], 0) + 1
    print(f"{len(saida['unidades'])} destinos {por}; LSA k={saida['lsa']['k']}, {len(saida['lsa']['termos'])} termos, "
          f"variância explicada {saida['lsa']['variancia_explicada']}; gravado {caminho} ({caminho.stat().st_size / 1024:.0f} KB)")


if __name__ == "__main__":
    main()
