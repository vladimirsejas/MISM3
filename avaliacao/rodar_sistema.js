/* Executa o sistema REAL (os mesmos módulos que rodam no navegador) sobre as perguntas e imprime, em JSON, o que a mulher veria:
   se o alerta de perigo apareceu, se o sistema se absteve e os itens da resposta, em ordem. Uso: node rodar_sistema.js <sistema> */
const fs = require("fs"), path = require("path");
const web = path.resolve(__dirname, "..", "web");
const sistema = process.argv[2] || "v1";
const perguntas = JSON.parse(fs.readFileSync(path.join(__dirname, "perguntas.json"), "utf8")).perguntas;
const catalogo = JSON.parse(fs.readFileSync(path.join(web, "dados", "catalogo_manual.json"), "utf8")).servicos;

let responder;
if (sistema === "v1") {
  /* v1 = o que a tela inicial fazia antes desta rodada: assistente (modelo + regras) -> Meu Plano -> serviços do catálogo. */
  const IA = require(path.join(web, "ia.js")), Plano = require(path.join(web, "plano.js"));
  IA.usarModelo(JSON.parse(fs.readFileSync(path.join(web, "dados", "modelo_necessidades.json"), "utf8")));
  IA.usarCatalogo(catalogo.filter((s) => /^man-/.test(s.id)));
  const alvo = (href) => { const p = String(href).replace(/^#/, "").split("/"); return { area: p[0], sec: p[1] || null }; };
  responder = (texto) => {
    const sug = IA.sugerir(texto), srv = IA.servicosPara(texto, sug, 2), itens = [];
    Plano.montar(sug).passos.forEach((p) => {
      const a = alvo(p.href);
      itens.push({ area: a.area, sec: a.sec, svc: null, titulo: p.titulo });
      (srv[p.id] || []).forEach((s) => itens.push({ area: a.area, sec: null, svc: s.tipo + "/" + s.subtipo, titulo: s.nome }));
    });
    return { perigo: sug.some((s) => s.urgente), abstem: sug.length === 0, itens };
  };
} else {
  responder = require(path.join(__dirname, "sistema_" + sistema + ".js"))(web, catalogo);
}
const saida = perguntas.map((q) => Object.assign({ id: q.id }, responder(q.texto)));
process.stdout.write(JSON.stringify(saida));
