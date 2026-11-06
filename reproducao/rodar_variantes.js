/* Executor de variantes do orientador (v2) para a ablação e para as métricas por necessidade.

   É uma CÓPIA ADAPTADA de avaliacao/rodar_sistema.js e avaliacao/sistema_v2.js (os originais não foram modificados). Diferenças:
     1. recebe a lista de perguntas por arquivo (--perguntas), em vez de ler todo o perguntas.json. Assim, só as perguntas
        entregues pelo script Python (desenvolvimento e teste, sem as vistas no treino) são executadas; os conjuntos
        independente, reserva e final nunca passam pelo sistema.
     2. aceita --condicao, que liga ou desliga componentes sem alterar nenhum arquivo de web/.
     3. devolve também o nível e os tipos do alerta de perigo (o original devolve só um booleano).
   A condição "completo" usa exatamente os mesmos módulos e a mesma montagem de avaliacao/sistema_v2.js.

   Uso: node reproducao/rodar_variantes.js --perguntas <arquivo.json> --condicao <nome> */
const fs = require("fs"), path = require("path");
const web = path.resolve(__dirname, "..", "web");

const arg = (nome) => { const i = process.argv.indexOf("--" + nome); return i > -1 ? process.argv[i + 1] : null; };
const arquivo = arg("perguntas"), nomeCondicao = arg("condicao") || "completo";
if (!arquivo) { console.error("uso: node rodar_variantes.js --perguntas <arquivo.json> --condicao <nome>"); process.exit(2); }

/* necessidade: de onde vem o sinal de intenção ("hibrido" = regras e modelo, como no sistema completo).
   O índice de busca (palavras, letras, LSA) só muda pelos pesos. */
const CONDICOES = {
  completo: {},
  apenas_regras: { necessidade: "regras" },
  apenas_modelo_necessidades: { necessidade: "modelo" },
  sem_perigo_aprendido: { semModeloPerigo: true },
  sem_escopo: { semEscopo: true },
  sem_regras_lexicais_necessidade: { necessidade: "modelo" },
  sem_ngramas_letras: { pesos: { letras: 0 } },
  sem_lsa: { pesos: { significado: 0 } },
  sem_palavras: { pesos: { palavras: 0 } }
};
const cond = CONDICOES[nomeCondicao];
if (!cond) { console.error("condição desconhecida: " + nomeCondicao); process.exit(2); }

const perguntas = JSON.parse(fs.readFileSync(arquivo, "utf8"));
const Orientar = require(path.join(web, "orientar.js")), IA = require(path.join(web, "ia.js")), Regras = require(path.join(web, "necessidades.js"));
const Perigo = require(path.join(web, "perigo.js"));
const UI = require(path.join(web, "orientacao-ui.js"));
const ler = (nome) => JSON.parse(fs.readFileSync(path.join(web, "dados", nome), "utf8"));

IA.usarModelo(ler("modelo_necessidades.json"));
const indice = ler("indice_orientacao.json");
if (!cond.semModeloPerigo) Perigo.usarModelo(ler("modelo_perigo.json"));

let dica;
if (!cond.necessidade) dica = UI.criarDica(IA, Regras); /* igual ao sistema completo */
else {
  dica = (texto) => {
    const p = cond.necessidade === "regras" ? {} : Object.assign({}, IA.probabilidades(texto) || {});
    if (cond.necessidade === "regras") Regras.identificarCategorias(texto, 9).forEach((c) => { p[c] = Math.max(p[c] || 0, 0.9); });
    return p;
  };
}
const esc = cond.semEscopo ? null : IA.criarClassificador(ler("modelo_escopo.json"));
const motor = Orientar.criar(indice, {
  dica: dica, pesos: cond.pesos,
  escopo: esc ? (t) => esc.probabilidades(t).no_escopo : null,
  limiarEscopo: esc ? esc.limiares.no_escopo : undefined
});

const saida = perguntas.map((q) => {
  const r = motor.responder(q.texto);
  return {
    id: q.id, perigo: !!r.perigo, nivel: r.perigo ? r.perigo.nivel : 0, tipos: r.perigo ? r.perigo.tipos : [],
    abstem: r.abstem, saudacao: r.saudacao, geral: r.geral, melhor: r.melhor,
    itens: r.itens.map((i) => ({ area: i.area, sec: i.sec, svc: i.svc, titulo: i.titulo }))
  };
});
process.stdout.write(JSON.stringify(saida));
