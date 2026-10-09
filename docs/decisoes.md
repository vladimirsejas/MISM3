# Decisões de projeto

## 2026-10-09 — Rede de Autonomia (Plano B) sem banco de dados, por enquanto
**Contexto.** O Plano B propõe contas (e-mail/senha), perfil, inscrições, histórico de recomendações e painel em PostgreSQL. O Mapa do Cuidado promete o oposto: consulta no navegador, sem servidor próprio, sem cookies, sem gravar o CEP.

**Decisão.** Aproveitar a ideia central do Plano B (levar a mulher do objetivo à oportunidade, com explicação) como recomendação **local**, sem conta e sem gravar. Implementada em `web/recomendar.js`.

**Por quê.**
1. O gargalo real é dado, não infraestrutura: hoje há 7 serviços de trabalho/curso verificados, sem lista de turmas, vagas ou requisitos. As páginas oficiais não publicam isso.
2. Conta e histórico criam dado pessoal e exigem hospedagem, LGPD e senha: custo alto para dois devs iniciantes e sem ganho enquanto não há o que recomendar.
3. Pontuação em "%" (ex.: "94% compatível") passaria precisão que o cadastro não tem. Mostramos o *porquê* em frases, não um número.

**Quando reconsiderar o banco.** Se um parceiro (Secretaria da Mulher, Fundo Social, SDE) se comprometer a cadastrar turmas/vagas com data, faz sentido uma tabela `oportunidade` (só ela, administrada pelo parceiro). Indicadores de demanda só como contagens agregadas, sem identificar ninguém; nunca perfil individual.

**Pendências de dados (precisam de gente, não de código).**
- Pedir à SDE/Fundo Social a lista de cursos e turmas abertas (Lei de Acesso à Informação, se necessário).
- Cadastrar CRAS/CREAS (ver `docs/inventario_de_fontes.md`).
- Conferir telefones com `python pipeline/verificar_catalogo.py`.
