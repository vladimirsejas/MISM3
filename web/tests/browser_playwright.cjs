"use strict";

const assert = require("node:assert/strict");
const { chromium } = require("playwright");

const base = "http://127.0.0.1:8765";
const origem = new URL(base).origin;
const erros = [];
const externos = [];

async function abrirServidor(page, caminho) {
  for (let tentativa = 0; tentativa < 20; tentativa++) {
    try {
      const resposta = await fetch(base + "/" + caminho);
      if (resposta.ok) return;
    } catch (_) {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("Servidor local não respondeu para " + caminho);
}

async function testarPagina(browser, caminho, largura, altura, mapa) {
  const context = await browser.newContext({ viewport: { width: largura, height: altura }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  page.on("console", (msg) => { if (msg.type() === "error") erros.push(caminho + ": " + msg.text()); });
  page.on("pageerror", (err) => erros.push(caminho + ": " + err.message));
  page.on("request", (req) => {
    if (new URL(req.url()).origin !== origem) externos.push(caminho + ": " + req.url());
  });
  await abrirServidor(page, caminho);
  await page.goto(base + "/" + caminho, { waitUntil: "networkidle" });
  if (mapa) {
    await page.waitForFunction(() => document.querySelectorAll("#mt-camada-setores path[data-setor]").length === 408);
    const quantidade = await page.locator("#mt-camada-setores path[data-setor]").count();
    assert.equal(quantidade, 408, "o mapa deve desenhar os 408 setores");
    const dados = await page.evaluate(async () => {
      const r = await fetch("dados/indicadores_territoriais.json");
      return r.json();
    });
    const protegidos = dados.setores.filter((s) => s.suprimido_privacidade === true);
    assert.equal(protegidos.length, 17, "os dados publicados devem identificar os 17 setores protegidos");
    const primeiro = page.locator('[data-setor="' + protegidos[0].id + '"]');
    await primeiro.click();
    const detalhe = await page.locator("#mt-detalhe-corpo").innerText();
    assert.match(detalhe, /omitidos por cautela estatística/i, "setor protegido deve explicar a supressão");
    await page.locator("#mt-setor").focus();
    await page.keyboard.press("Tab");
    const foco = await page.evaluate(() => document.activeElement && document.activeElement.getAttribute("data-setor"));
    assert.ok(foco, "Tab deve levar o foco ao mapa");
    const visivel = await page.evaluate(() => {
      const e = document.activeElement;
      const anel = document.querySelector("#mt-camada-foco .mt-anel-halo");
      return !!e && !!anel && anel.getAttribute("visibility") === "visible" && !!anel.getAttribute("d");
    });
    assert.ok(visivel, "o foco do teclado deve ficar visível");
    await page.keyboard.press("ArrowRight");
    const depois = await page.evaluate(() => document.activeElement && document.activeElement.getAttribute("data-setor"));
    assert.ok(depois && depois !== foco, "setas devem navegar entre setores");
  } else {
    assert.equal(await page.locator('a[class="porta"][href]').count(), 7, "a página inicial deve manter exatamente as sete portas de navegação");
  }
  await page.setViewportSize({ width: Math.floor(largura / 2), height: Math.floor(altura / 2) });
  await page.evaluate(() => window.dispatchEvent(new Event("resize")));
  await page.waitForTimeout(200);
  const dimensoes = await page.evaluate(() => {
    const viewport = document.documentElement.clientWidth;
    const excedentes = Array.from(document.querySelectorAll("body *")).map((e) => {
      const r = e.getBoundingClientRect();
      return {
        tag: e.tagName.toLowerCase(),
        id: e.id || "",
        classe: typeof e.className === "string" ? e.className : "",
        texto: (e.innerText || e.textContent || "").trim().replace(/\s+/g, " ").slice(0, 70),
        left: Math.round(r.left),
        right: Math.round(r.right),
        width: Math.round(r.width),
        scrollWidth: e.scrollWidth,
        clientWidth: e.clientWidth,
        ancestrais: e.tagName.toLowerCase() === "svg" ? (function () {
          const lista = [];
          let p = e.parentElement;
          while (p && lista.length < 5) {
            const pr = p.getBoundingClientRect();
            const estilo = getComputedStyle(p);
            lista.push({
              tag: p.tagName.toLowerCase(),
              id: p.id || "",
              classe: p.getAttribute("class") || "",
              left: Math.round(pr.left),
              right: Math.round(pr.right),
              width: Math.round(pr.width),
              overflowX: estilo.overflowX,
              position: estilo.position
            });
            p = p.parentElement;
          }
          return lista;
        })() : undefined
      };
    }).filter((e) => e.width > 0 && e.right > viewport + 1)
      .sort((a, b) => b.right - a.right).slice(0, 12);
    return {
      larguraDocumento: document.documentElement.scrollWidth,
      larguraViewport: viewport,
      excedentes
    };
  });
  assert.ok(dimensoes.larguraDocumento <= dimensoes.larguraViewport,
    "não deve haver rolagem horizontal em zoom de 200% (" + caminho + ", viewport " +
    dimensoes.larguraViewport + "px, documento " + dimensoes.larguraDocumento +
    "px, elementos excedentes: " + JSON.stringify(dimensoes.excedentes) + ")");
  await context.close();
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const tamanho of [{ w: 1280, h: 800 }, { w: 390, h: 844 }]) {
      await testarPagina(browser, "index.html", tamanho.w, tamanho.h, false);
      await testarPagina(browser, "mapa-territorial.html", tamanho.w, tamanho.h, true);
    }
    assert.deepEqual(externos, [], "nenhuma requisição pode sair da própria origem");
    assert.deepEqual(erros, [], "nenhum erro de console ou JavaScript");
    process.stdout.write("Playwright: página inicial e mapa territorial aprovados em desktop e celular; 408 setores, 17 protegidos, teclado, foco, origem única e zoom 200%.\n");
  } finally {
    await browser.close();
  }
})().catch((err) => { console.error(err); process.exit(1); });
