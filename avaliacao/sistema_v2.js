/* v2 = o motor de orientação (segurança + busca em 4 sinais). Mesmos módulos do navegador; o índice vem do arquivo gerado pelo Python. */
const fs = require("fs"), path = require("path");
module.exports = function (web) {
  const Orientar = require(path.join(web, "orientar.js")), IA = require(path.join(web, "ia.js")), Regras = require(path.join(web, "necessidades.js"));
  IA.usarModelo(JSON.parse(fs.readFileSync(path.join(web, "dados", "modelo_necessidades.json"), "utf8")));
  const indice = JSON.parse(fs.readFileSync(path.join(web, "dados", "indice_orientacao.json"), "utf8"));
  const cfg = process.env.ORIENTAR_CFG ? JSON.parse(process.env.ORIENTAR_CFG) : {};
  const dica = require(path.join(web, "orientacao-ui.js")).criarDica(IA, Regras);
  const motor = Orientar.criar(indice, { dica: dica, pesos: cfg.pesos, limiar: cfg.limiar });
  return (texto) => {
    const r = motor.responder(texto);
    return { perigo: !!r.perigo, abstem: r.abstem, itens: r.itens.map((i) => ({ area: i.area, sec: i.sec, svc: i.svc, titulo: i.titulo })), saudacao: r.saudacao, geral: r.geral, melhor: r.melhor };
  };
};
