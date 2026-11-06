/* Privacidade do mapa: nenhuma imagem de mapa de outro domínio pode ser pedida sem a usuária marcar a caixa de ruas.
   Decisão de 05/11/2026 (ver docs/registro_decisoes_desenvolvimento.md): a caixa do mapa de serviços vem desmarcada.
   O teste lê os arquivos; a medição de rede no navegador está em reproducao/auditoria_privacidade.md (ramo reproducao-e-auditoria). */
const assert = require("assert"), fs = require("fs"), path = require("path");
const web = path.resolve(__dirname, "..");
const raiz = path.resolve(web, "..");
const html = fs.readFileSync(path.join(web, "index.html"), "utf8");
const mapa = fs.readFileSync(path.join(web, "mapa.js"), "utf8");
const app = fs.readFileSync(path.join(web, "app.js"), "utf8");
const readme = fs.readFileSync(path.join(raiz, "README.md"), "utf8");

/* 1) As duas caixas de ruas vêm desmarcadas. */
["usar-tiles-mapa", "usar-tiles"].forEach((id) => {
  const m = html.match(new RegExp('<input[^>]*id="' + id + '"[^>]*>'));
  assert(m, "caixa " + id + " existe");
  assert(!/\bchecked\b/.test(m[0]), "a caixa " + id + " vem desmarcada: " + m[0]);
});

/* 2) O texto ao lado diz o que a marcação envia e o que acontece sem marcar. */
const rotulo = html.match(/<label class="tiles"><input[^>]*id="usar-tiles-mapa"[^>]*>([^<]*)<\/label>/);
assert(rotulo && /Esri/.test(rotulo[1]) && /endereço de rede/.test(rotulo[1]) && /Sem marcar/.test(rotulo[1]) && !/Desmarque/.test(rotulo[1]), "o rótulo explica o envio e o que acontece sem marcar");

/* 3) O código só liga a camada de imagens pelo estado da caixa (nunca ligarBase(true) direto). */
assert(/ligarBase\(\$\("usar-tiles-mapa"\)\.checked\)/.test(mapa), "a camada inicial segue o estado da caixa");
assert(!/ligarBase\(true\)/.test(mapa), "nenhuma chamada força a camada ligada");
assert(/\$\("usar-tiles"\)\.addEventListener\("change"[\s\S]*if \(e\.target\.checked\)/.test(app), "a camada do OpenStreetMap só entra ao marcar a caixa");

/* 4) Só as duas camadas conhecidas fazem pedido a outro domínio no código do site. */
const externos = new Set();
["app.js", "mapa.js"].forEach((f) => {
  (fs.readFileSync(path.join(web, f), "utf8").match(/https?:\/\/[a-z0-9.-]+\//gi) || []).forEach((u) => externos.add(new URL(u).host));
});
const permitidos = new Set(["tile.openstreetmap.org", "server.arcgisonline.com"]);
externos.forEach((h) => {
  const ehLink = /^(www\.)?(google|gov|wa\.me|rioclaro|cmdca|defensoria|instagram|facebook|whatsapp)/.test(h) || /\.(gov\.br|sp\.gov\.br|com\.br)$/.test(h) || h === "wa.me";
  assert(permitidos.has(h) || ehLink, "domínio externo inesperado em app.js ou mapa.js: " + h + " (se for um serviço de imagens, precisa de caixa de opt-in e de linha em AVISOS-DE-TERCEIROS.md)");
});

/* 5) O README não afirma mais que a Esri vem ligada por padrão. */
assert(!/ligad[ao]s? por padrão/.test(readme), "o README não diz que o mapa vem ligado por padrão");
assert(/ambas vêm desmarcadas/.test(readme) && /Ao abrir o site, nenhuma imagem de mapa é pedida a outro domínio/.test(readme), "o README descreve o opt-in das duas camadas");

console.log("mapa_privacidade.test.js: caixas de ruas desmarcadas, camadas só por marcação, rótulo explica o envio, README coerente");
