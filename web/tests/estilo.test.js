/* Regras de largura e de letra de web/estilo.css (31/10/2026). Não mede a tela (isso exige um navegador); trava as regras que, se forem desfeitas, trazem o defeito de volta:
   1) a letra do corpo está em rem, para crescer junto com a página nas telas grandes (em px ela não cresceria);
   2) a largura da página só cresce a partir de 1440 px, em três degraus: celular, tablet e notebook pequeno ficam como estavam;
   3) a letra de 16 px do celular continua;
   4) texto pré-formatado (o modelo de currículo) quebra linha: antes alargava a página inteira (783 px numa caixa de 358 px no celular);
   5) a coluna dos cartões no celular é minmax(0,1fr), e o cartão quebra texto longo (antes a página ganhava 17 px em 320 px de tela). */
const assert = require("assert"), fs = require("fs"), path = require("path");
const css = fs.readFileSync(path.join(__dirname, "..", "estilo.css"), "utf8").replace(/\r\n/g, "\n");

assert(/body\{[^}]*font:1\.0625rem\/1\.55/.test(css), "o corpo do texto está em rem (1,0625rem = 17 px com a raiz padrão)");
assert(!/body\{[^}]*font:17px/.test(css), "o corpo do texto não voltou para px fixo");

/* A largura da página: uma regra base e três degraus, e os degraus só dentro de min-width >= 1440 px. */
const base = css.indexOf(".conteudo,.topo-in,.rodape{max-width:1240px;");
assert(base !== -1, "a largura base é 1240 px (a que o notebook pequeno e o tablet já tinham)");
const degraus = [[1440, "min(94vw,1400px)", "106%"], [1700, "min(92vw,1640px)", "112%"], [2100, "min(90vw,1900px)", "120%"]];
let anterior = base;
degraus.forEach(([largura, max, letra]) => {
  const i = css.indexOf("@media(min-width:" + largura + "px){");
  assert(i > anterior, "o degrau de " + largura + " px existe e vem depois do anterior");
  const bloco = css.slice(i, css.indexOf("\n}\n", i));
  assert(bloco.includes(".conteudo,.topo-in,.rodape{max-width:" + max + "}"), "degrau " + largura + ": largura " + max);
  assert(bloco.includes("html{font-size:" + letra + "}"), "degrau " + largura + ": letra " + letra);
  anterior = i;
});
assert((css.match(/\.conteudo,\.topo-in,\.rodape\{max-width:/g) || []).length === 4, "só a base e os três degraus definem a largura da página");

/* O celular continua com a letra de 16 px. */
const cel = css.indexOf("@media(max-width:520px){");
assert(cel !== -1 && /body\{font-size:16px\}/.test(css.slice(cel, cel + 400)), "a letra do celular continua 16 px abaixo de 520 px");

/* Nada alarga a página no celular. */
assert(/pre\{white-space:pre-wrap;overflow-wrap:anywhere;max-width:100%\}/.test(css), "texto pré-formatado quebra linha");
assert(/@media\(max-width:820px\)\{\.lista-cartoes\{grid-template-columns:minmax\(0,1fr\)\}\}/.test(css), "a coluna dos cartões em tela estreita é minmax(0,1fr)");
assert(/\.cartao,\.status\{min-width:0;overflow-wrap:anywhere\}/.test(css), "cartão e texto de status quebram texto longo");

/* Listas curtas em colunas só nas telas grandes. */
assert(/@media\(min-width:1440px\)\{\s*\.guia-area ul\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)\}/.test(css), "o guia da área tem 2 colunas a partir de 1440 px");
assert(/@media\(min-width:1700px\)\{\s*\.guia-area ul\{grid-template-columns:repeat\(3,minmax\(0,1fr\)\)\}/.test(css), "e 3 colunas a partir de 1700 px");

console.log("estilo.test.js: letra em rem, página mais larga só a partir de 1440 px em três degraus, celular com 16 px, e nada que alargue a página em tela pequena");
