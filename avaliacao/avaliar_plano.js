/* Mede se Meu Plano respeita a ordem explícita definida pelo produto.
   Isto NÃO avalia se a política de prioridade é a melhor para todas as pessoas; avalia consistência da implementação.
   Uso: node avaliacao/avaliar_plano.js
*/
const assert = require("assert");
const Plano = require("../web/plano.js");
const fake = (id) => ({ id, titulo: id, texto: id, href: "#" + id, urgente: false });
const casos = [
  { nome: "violência antes de estudo", entrada: ["estudo", "violencia"], esperado: ["violencia", "estudo"] },
  { nome: "saúde, moradia e trabalho", entrada: ["emprego_curso", "moradia", "saude"], esperado: ["saude", "moradia", "emprego_curso"] },
  { nome: "apoio familiar e filhos", entrada: ["filhos", "familia", "casamento"], esperado: ["familia", "filhos", "casamento"] },
  { nome: "dívidas antes de trabalho e estudo", entrada: ["estudo", "dividas", "emprego_curso"], esperado: ["dividas", "emprego_curso", "estudo"] },
  { nome: "todas as áreas em ordem inversa", entrada: Plano.ORDEM.slice().reverse(), esperado: Plano.ORDEM.slice() }
];
let acertos = 0;
for (const c of casos) {
  const obtido = Plano.montar(c.entrada.map(fake)).passos.map((p) => p.id);
  const ok = JSON.stringify(obtido) === JSON.stringify(c.esperado);
  console.log((ok ? "OK " : "FALHA ") + c.nome + ": " + obtido.join(" > "));
  if (ok) acertos++;
}
console.log("Consistência da ordem: " + acertos + "/" + casos.length + " (" + (100 * acertos / casos.length).toFixed(1) + "%)");
console.log("Nota: esta métrica confere a implementação da regra fixa; não é uma validação clínica ou social da prioridade normativa.");
if (acertos !== casos.length) process.exitCode = 1;
