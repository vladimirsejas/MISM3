/* Gera dados de TESTE para o painel da Secretaria (web/dados/painel_teste.json).
 *
 *   node pipeline/gerar_dados_teste_painel.js
 *
 * Os registros são sorteados por computador a partir das alternativas do questionário (web/questionario.js). NÃO representam
 * nenhuma mulher real e NÃO podem ser lidos como resultado de pesquisa: servem só para a Secretaria ver como o painel ficará.
 * O arquivo carrega o aviso dentro dele e o painel o exibe em destaque. A semente é fixa: rodar de novo dá o mesmo arquivo.
 */
const fs = require("fs");
const path = require("path");
const Q = require("../web/questionario.js");

let estado = 20261011;
function aleatorio() { estado = (estado * 1664525 + 1013904223) % 4294967296; return estado / 4294967296; }
function sorteio(pesos) { /* pesos: {codigo: peso} */
  const cod = Object.keys(pesos), total = cod.reduce((a, c) => a + pesos[c], 0);
  let x = aleatorio() * total;
  for (const c of cod) { x -= pesos[c]; if (x <= 0) return c; }
  return cod[cod.length - 1];
}
function uniforme(p) { const o = {}; p.opcoes.forEach((x) => { o[x.c] = 1; }); return o; }

const N = 420;
const MESES = ["2026-08", "2026-09", "2026-10"];
const regs = [];
let tentativas = 0;
while (regs.length < N && tentativas < N * 5) {
  tentativas++;
  const r = {};
  r.idade = sorteio({ "18_24": 2, "25_34": 4, "35_44": 4, "45_59": 3, "60_mais": 1.5, nd: 0.3 });
  r.regiao = sorteio({ cvz: 3, mae_preta: 3, bom_sucesso: 2, centro: 2, outro: 3, rural: 0.5, nao_sei: 0.6, nd: 0.4 });
  r.trabalho = sorteio({ formal: 3, conta_propria: 2, informal: 2.5, procurando: 3, quer_comecar: 1, estudando: 1, nao_procura: 1 });
  Q.PERGUNTAS.forEach((p) => {
    if (r[p.id] !== undefined || p.id === "autoriza" || p.tipo === "texto") return;
    if (p.tipo === "unica") r[p.id] = sorteio(uniforme(p));
    else {
      const n = 1 + Math.floor(aleatorio() * Math.min(3, p.max)), cods = Object.keys(uniforme(p)), esc = [];
      for (let i = 0; i < n; i++) esc.push(cods[Math.floor(aleatorio() * cods.length)]);
      r[p.id] = esc;
    }
  });
  r.autoriza = "sim";
  const temas = [];
  if (aleatorio() < 0.45) { const n = 1 + Math.floor(aleatorio() * 2); for (let i = 0; i < n; i++) temas.push(Q.TEMAS_PERMITIDOS[Math.floor(aleatorio() * Q.TEMAS_PERMITIDOS.length)]); r.fale_de_voce = "(texto de teste, nunca guardado)"; }
  const reg = Q.registro(r, MESES[Math.floor(aleatorio() * MESES.length)], { temas: temas });
  if (reg) regs.push(reg);
}

const saida = {
  meta: {
    dados_de_teste: true,
    aviso: "DADOS DE TESTE gerados por computador. Não representam nenhuma mulher real e não são resultado de pesquisa. Servem só para mostrar como o painel funcionará.",
    gerado_por: "pipeline/gerar_dados_teste_painel.js",
    registros: regs.length,
    instrumento: "observatorio-questionario",
    versao: 1
  },
  registros: regs
};
const destino = path.join(__dirname, "..", "web", "dados", "painel_teste.json");
fs.writeFileSync(destino, JSON.stringify(saida) + "\n", "utf8");
console.log("Gravado " + path.relative(path.join(__dirname, ".."), destino) + ": " + regs.length + " registros de TESTE, " + (fs.statSync(destino).size / 1024).toFixed(0) + " KB");
