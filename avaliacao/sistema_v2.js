/* v2 = o motor de orientação (segurança + busca em 4 sinais). Mesmos módulos do navegador; o índice vem do arquivo gerado pelo Python. */
const fs = require("fs"), path = require("path");
module.exports = function (web) {
  const Orientar = require(path.join(web, "orientar.js")), IA = require(path.join(web, "ia.js")), Regras = require(path.join(web, "necessidades.js"));
  IA.usarModelo(JSON.parse(fs.readFileSync(path.join(web, "dados", "modelo_necessidades.json"), "utf8")));
  const indice = JSON.parse(fs.readFileSync(path.join(web, "dados", "indice_orientacao.json"), "utf8"));
  require(path.join(web, "perigo.js")).usarModelo(JSON.parse(fs.readFileSync(path.join(web, "dados", "modelo_perigo.json"), "utf8")));
  const cfg = process.env.ORIENTAR_CFG ? JSON.parse(process.env.ORIENTAR_CFG) : {};
  const dica = require(path.join(web, "orientacao-ui.js")).criarDica(IA, Regras);
  const esc = cfg.semEscopo ? null : IA.criarClassificador(JSON.parse(fs.readFileSync(path.join(web, "dados", "modelo_escopo.json"), "utf8")));
  const motor = Orientar.criar(indice, { dica: dica, pesos: cfg.pesos, limiar: cfg.limiar, escopo: esc ? (t) => esc.probabilidades(t).no_escopo : null,
    limiarEscopo: esc ? esc.limiares.no_escopo : undefined, fortaCorrespondencia: cfg.forta });
  return (texto) => {
    const r = motor.responder(texto);
    return { perigo: !!r.perigo, abstem: r.abstem, itens: r.itens.map((i) => ({ area: i.area, sec: i.sec, svc: i.svc, titulo: i.titulo })), saudacao: r.saudacao, geral: r.geral, melhor: r.melhor };
  };
};
