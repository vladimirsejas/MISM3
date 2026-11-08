/* Painel local de qualidade dos dados territoriais do MISM3.
   Lê somente arquivos versionados do próprio site. Não envia nem armazena dados.
   A validação é estrutural e descritiva; não substitui auditoria topológica ou validação física. */
(function (raiz, fabrica) {
  if (typeof module === "object" && module.exports) module.exports = fabrica();
  else raiz.QualidadeDados = fabrica();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var REFERENCIA_AREA_KM2 = 498.403;
  var LATITUDE_REFERENCIA = -22.40;
  var KM_POR_GRAU_LAT = 110.574;
  var KM_POR_GRAU_LON = 111.320 * Math.cos(LATITUDE_REFERENCIA * Math.PI / 180);
  var RAIO_TERRA_KM = 6371.0088;

  function poligonos(geom) {
    if (!geom) return [];
    if (geom.type === "Polygon") return [geom.coordinates || []];
    if (geom.type === "MultiPolygon") return geom.coordinates || [];
    return [];
  }

  function anelContem(anel, lon, lat) {
    var dentro = false, j, i, xi, yi, xj, yj;
    if (!anel || anel.length < 3) return false;
    j = anel.length - 1;
    for (i = 0; i < anel.length; i++) {
      xi = Number(anel[i][0]); yi = Number(anel[i][1]);
      xj = Number(anel[j][0]); yj = Number(anel[j][1]);
      if ((yi > lat) !== (yj > lat) && lon < (xj - xi) * (lat - yi) / ((yj - yi) || 1e-18) + xi) dentro = !dentro;
      j = i;
    }
    return dentro;
  }

  function pontoNaMalha(geo, lon, lat) {
    var features = geo.features || [], i, polys, j, p, k, dentro, buraco;
    for (i = 0; i < features.length; i++) {
      polys = poligonos(features[i].geometry);
      for (j = 0; j < polys.length; j++) {
        p = polys[j];
        if (!p.length || !anelContem(p[0], lon, lat)) continue;
        dentro = true;
        for (k = 1; k < p.length; k++) {
          buraco = p[k];
          if (anelContem(buraco, lon, lat)) { dentro = false; break; }
        }
        if (dentro) return true;
      }
    }
    return false;
  }

  function areaAnelLocal(anel) {
    var soma = 0, i, a, b;
    for (i = 0; i < anel.length; i++) {
      a = anel[i]; b = anel[(i + 1) % anel.length];
      soma += (a[0] * KM_POR_GRAU_LON) * (b[1] * KM_POR_GRAU_LAT) -
        (b[0] * KM_POR_GRAU_LON) * (a[1] * KM_POR_GRAU_LAT);
    }
    return Math.abs(soma) / 2;
  }

  function areaAnelGeodesica(anel) {
    var soma = 0, i, a, b;
    for (i = 0; i < anel.length; i++) {
      a = anel[i]; b = anel[(i + 1) % anel.length];
      soma += (b[0] - a[0]) * Math.PI / 180 *
        (2 + Math.sin(a[1] * Math.PI / 180) + Math.sin(b[1] * Math.PI / 180));
    }
    return Math.abs(soma) * RAIO_TERRA_KM * RAIO_TERRA_KM / 2;
  }

  function areasGeojson(geo) {
    var local = 0, geodesica = 0, features = geo.features || [], i, polys, j, p, k;
    for (i = 0; i < features.length; i++) {
      polys = poligonos(features[i].geometry);
      for (j = 0; j < polys.length; j++) {
        p = polys[j];
        if (!p.length) continue;
        local += areaAnelLocal(p[0]);
        geodesica += areaAnelGeodesica(p[0]);
        for (k = 1; k < p.length; k++) {
          local -= areaAnelLocal(p[k]);
          geodesica -= areaAnelGeodesica(p[k]);
        }
      }
    }
    return { local: local, geodesica: geodesica };
  }

  function validarGeometrias(geo) {
    var features = geo.features || [], ids = {}, duplicados = [], invalidas = [], total = features.length;
    var i, props, codigo, polys, j, k, ring, erros, p, coord;
    for (i = 0; i < total; i++) {
      props = features[i].properties || {};
      codigo = String(props.setor || "sem_codigo");
      if (ids[codigo]) duplicados.push(codigo);
      ids[codigo] = true;
      polys = poligonos(features[i].geometry);
      erros = [];
      if (!polys.length) erros.push("tipo_ou_coordenadas_ausentes");
      for (j = 0; j < polys.length; j++) {
        if (!polys[j].length) { erros.push("poligono_sem_anel"); continue; }
        for (k = 0; k < polys[j].length; k++) {
          ring = polys[j][k];
          if (!ring || ring.length < 4) erros.push("anel_com_menos_de_quatro_pontos");
          else if (JSON.stringify(ring[0]) !== JSON.stringify(ring[ring.length - 1])) erros.push("anel_nao_fechado");
          for (p = 0; ring && p < ring.length; p++) {
            coord = ring[p];
            if (!coord || coord.length < 2 || !isFinite(Number(coord[0])) || !isFinite(Number(coord[1])) ||
                Number(coord[0]) < -180 || Number(coord[0]) > 180 || Number(coord[1]) < -90 || Number(coord[1]) > 90) {
              erros.push("coordenada_fora_dos_limites_geograficos");
            }
          }
        }
      }
      if (erros.length) invalidas.push({ setor: codigo, problemas: erros.filter(function (v, n, a) { return a.indexOf(v) === n; }) });
    }
    return { total: total, codigos_unicos: Object.keys(ids).length, duplicados: duplicados, geometrias_com_erro_estrutural: invalidas };
  }

  function resumir(geo, territorio, indicadores) {
    var features = geo.features || [], equipamentos = indicadores.equipamentos || [];
    var categorias = { cras: [], ubs: [], escola: [] }, i, e, props, lat, lon;
    var semCoordenada = [], foraMalha = [], crasUbs = [], documentados = [], semProveniencia = [];
    var escolasIndividuais = [], escolasCep = [], pequenos = [], areas, areaPublicada, diff;
    for (i = 0; i < equipamentos.length; i++) {
      e = equipamentos[i];
      if (categorias[e.categoria]) categorias[e.categoria].push(e);
      if (e.lat === null || e.lat === undefined || e.lon === null || e.lon === undefined) semCoordenada.push(e);
      else {
        lat = Number(e.lat); lon = Number(e.lon);
        if (!isFinite(lat) || !isFinite(lon) || !pontoNaMalha(geo, lon, lat)) foraMalha.push(e);
      }
    }
    crasUbs = categorias.cras.concat(categorias.ubs);
    for (i = 0; i < crasUbs.length; i++) {
      e = crasUbs[i];
      if ((e.confianca_localizacao === "alta" || e.confianca_localizacao === "media") &&
          e.metodo_localizacao && e.data_aplicacao_localizacao) documentados.push(e);
      else semProveniencia.push(e);
    }
    for (i = 0; i < categorias.escola.length; i++) {
      e = categorias.escola[i];
      if (e.metodo_localizacao === "coordenada_individual") escolasIndividuais.push(e);
      if (e.metodo_localizacao === "centroide_cep") escolasCep.push(e);
    }
    for (i = 0; i < features.length; i++) {
      props = features[i].properties || {};
      if (Number(props.pessoas || 0) < 5 || Number(props.domicilios || 0) < 3) pequenos.push(props.setor);
    }
    areas = areasGeojson(geo);
    areaPublicada = Number((territorio.totais || {}).area_km2 || 0);
    diff = areaPublicada - REFERENCIA_AREA_KM2;
    return {
      geometrias: validarGeometrias(geo),
      areas: {
        soma_setorial_km2: areaPublicada,
        referencia_municipal_km2: REFERENCIA_AREA_KM2,
        diferenca_km2: diff,
        diferenca_percentual: 100 * diff / REFERENCIA_AREA_KM2,
        recalculo_local_km2: areas.local,
        recalculo_geodesico_km2: areas.geodesica,
        diferenca_recalculo_local_vs_referencia_km2: areas.local - REFERENCIA_AREA_KM2,
        diferenca_recalculo_geodesico_vs_referencia_km2: areas.geodesica - REFERENCIA_AREA_KM2
      },
      equipamentos: {
        total: equipamentos.length,
        por_categoria: { cras: categorias.cras.length, ubs: categorias.ubs.length, escola: categorias.escola.length },
        sem_coordenada: semCoordenada.length,
        coordenadas_fora_da_malha: foraMalha.length,
        cras_ubs: { total: crasUbs.length, proveniencia_documentada: documentados.length, proveniencia_ausente: semProveniencia.length },
        escolas: { total: categorias.escola.length, coordenada_individual: escolasIndividuais.length, referencia_cep: escolasCep.length,
          sem_metodo_reconhecido: categorias.escola.length - escolasIndividuais.length - escolasCep.length }
      },
      privacidade: {
        setores_abaixo_da_faixa_de_cautela_D4: pequenos.length,
        criterio_registrado: "menos de 5 pessoas ou menos de 3 domicílios; sinalização, sem supressão automática"
      },
      fontes: {
        setores: { arquivo: "dados/setores.geojson", fonte: (geo.meta || {}).fonte || "não informada", gerado_em: (geo.meta || {}).gerado_em || null },
        territorio: { arquivo: "dados/territorio.json", fonte: (territorio.meta || {}).fonte || "não informada", gerado_em: (territorio.meta || {}).gerado_em || null },
        indicadores: { arquivo: "dados/indicadores_territoriais.json", gerado_em: (indicadores.meta || {}).gerado_em || null }
      }
    };
  }

  function formatar(n, casas) {
    if (n === null || n === undefined || !isFinite(Number(n))) return "não disponível";
    return Number(n).toFixed(casas === undefined ? 0 : casas).replace(".", ",");
  }

  function criar(tag, classe, texto) {
    var node = document.createElement(tag);
    if (classe) node.className = classe;
    if (texto !== undefined) node.textContent = texto;
    return node;
  }

  function adicionarCartoes(id, itens) {
    var destino = document.getElementById(id), i, artigo, titulo, valor, detalhe;
    while (destino.firstChild) destino.removeChild(destino.firstChild);
    for (i = 0; i < itens.length; i++) {
      artigo = criar("article", "qd-cartao" + (itens[i].alerta ? " qd-alerta" : ""));
      titulo = criar("h3", "", itens[i].titulo);
      valor = criar("p", "qd-valor", itens[i].valor);
      detalhe = criar("p", "qd-detalhe", itens[i].detalhe);
      artigo.appendChild(titulo); artigo.appendChild(valor); artigo.appendChild(detalhe);
      destino.appendChild(artigo);
    }
  }

  function carregar(url, sucesso, falha) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) return;
      if (xhr.status >= 200 && xhr.status < 300) {
        try { sucesso(JSON.parse(xhr.responseText)); } catch (erro) { falha(url); }
      } else falha(url);
    };
    xhr.send();
  }

  function render(resultado) {
    var g = resultado.geometrias, a = resultado.areas, e = resultado.equipamentos, p = resultado.privacidade;
    adicionarCartoes("qd-geometrias", [
      { titulo: "Setores censitários", valor: formatar(g.total), detalhe: "Registros presentes na malha versionada." },
      { titulo: "Códigos únicos", valor: formatar(g.codigos_unicos), detalhe: "Códigos de setor distintos." },
      { titulo: "Erros estruturais", valor: formatar(g.geometrias_com_erro_estrutural.length), detalhe: "Anéis, coordenadas ou geometrias com problemas.", alerta: g.geometrias_com_erro_estrutural.length > 0 },
      { titulo: "Códigos duplicados", valor: formatar(g.duplicados.length), detalhe: "Duplicidades identificadas na malha.", alerta: g.duplicados.length > 0 }
    ]);
    adicionarCartoes("qd-areas", [
      { titulo: "Soma publicada", valor: formatar(a.soma_setorial_km2, 3) + " km²", detalhe: "Área agregada no arquivo territorial." },
      { titulo: "Referência municipal", valor: formatar(a.referencia_municipal_km2, 3) + " km²", detalhe: "Valor de referência registrado na auditoria." },
      { titulo: "Recálculo local", valor: formatar(a.recalculo_local_km2, 3) + " km²", detalhe: "Método plano local utilizado no pipeline." },
      { titulo: "Recálculo geodésico", valor: formatar(a.recalculo_geodesico_km2, 3) + " km²", detalhe: "Fórmula esférica independente.", alerta: true }
    ]);
    adicionarCartoes("qd-equipamentos", [
      { titulo: "Equipamentos", valor: formatar(e.total), detalhe: "CRAS " + e.por_categoria.cras + ", UBS " + e.por_categoria.ubs + " e escolas " + e.por_categoria.escola + "." },
      { titulo: "CRAS/UBS com método de coordenada", valor: e.cras_ubs.proveniencia_documentada + " de " + e.cras_ubs.total, detalhe: "Método, confiança e data de aplicação registrados." },
      { titulo: "CRAS/UBS sem método de coordenada", valor: formatar(e.cras_ubs.proveniencia_ausente), detalhe: "O endereço tem fonte no catálogo; falta documentar a obtenção/validação da coordenada e o raio.", alerta: e.cras_ubs.proveniencia_ausente > 0 },
      { titulo: "Escolas por localização", valor: e.escolas.coordenada_individual + " individuais / " + e.escolas.referencia_cep + " por CEP", detalhe: "Referências por CEP são aproximadas." },
      { titulo: "Coordenadas fora da malha", valor: formatar(e.coordenadas_fora_da_malha), detalhe: "Pontos que não caem em nenhum polígono.", alerta: e.coordenadas_fora_da_malha > 0 },
      { titulo: "Sem coordenadas", valor: formatar(e.sem_coordenada), detalhe: "Registros sem latitude ou longitude.", alerta: e.sem_coordenada > 0 }
    ]);
    adicionarCartoes("qd-privacidade", [
      { titulo: "Setores em cautela D4", valor: formatar(p.setores_abaixo_da_faixa_de_cautela_D4), detalhe: "Sinalizados por população ou domicílios pequenos.", alerta: p.setores_abaixo_da_faixa_de_cautela_D4 > 0 },
      { titulo: "Supressão automática", valor: "Não aplicada", detalhe: "A decisão D4 vigente é preservada." }
    ]);
    var fontes = document.getElementById("qd-fontes");
    fontes.textContent = "Setores: " + resultado.fontes.setores.fonte + " (" + (resultado.fontes.setores.gerado_em || "data não informada") + "). Território: " + resultado.fontes.territorio.fonte + " (" + (resultado.fontes.territorio.gerado_em || "data não informada") + "). Indicadores: " + resultado.fontes.indicadores.arquivo + ".";
    document.getElementById("qd-status").textContent = "Painel calculado a partir dos arquivos locais do projeto. Nenhum dado foi enviado.";
  }

  function iniciar() {
    var status = document.getElementById("qd-status");
    if (!status) return;
    carregar("dados/setores.geojson", function (geo) {
      carregar("dados/territorio.json", function (territorio) {
        carregar("dados/indicadores_territoriais.json", function (indicadores) {
          try { render(resumir(geo, territorio, indicadores)); }
          catch (erro) { status.textContent = "Não foi possível calcular a qualidade dos dados: " + erro.message; }
        }, function () { status.textContent = "Não foi possível carregar os indicadores territoriais locais."; });
      }, function () { status.textContent = "Não foi possível carregar os dados territoriais locais."; });
    }, function () { status.textContent = "Não foi possível carregar a malha geográfica local."; });
  }

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
    else iniciar();
  }

  return { poligonos: poligonos, anelContem: anelContem, pontoNaMalha: pontoNaMalha, areaAnelLocal: areaAnelLocal,
    areaAnelGeodesica: areaAnelGeodesica, areasGeojson: areasGeojson, validarGeometrias: validarGeometrias, resumir: resumir };
});
