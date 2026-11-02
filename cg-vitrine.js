/* ClickGo: VITRINE DE EXTRAS (24/10/2026). Sem build, sem lib.
   Uso:
     CGVitrine.montar(elemento, {
       catalogo: [{ id, nome, valor, unidade: 'unico'|'secao'|'mes', desc, prazo? }],   // preço SEMPRE vem daqui
       ramo: 'pizzaria',                       // opcional (reservado; as demos mostram vários ramos)
       aoQuerer: function (id) { ... },        // botão "Quero"
       videos: [{ src, poster }]               // opcional, para o extra 'video'
     })  -> { elemento, destruir() }
   Ids com demo: 'animacao', 'ultra', 'secao', 'mudancas4', 'video', 'logo', 'premium', 'seo'. Id desconhecido = cartão simples.
   modo: 'caixinha' (02/11/2026, extras NA COMPRA no /acompanhar): o pé do cartão vira uma caixinha "Somar ao pedido";
     marcados: [ids] marca as iniciais; aoMarcar(id, ligado) avisa a troca; o retorno ganha marcar(ids) para sincronizar.
   Demos só se mexem com o cartão na tela; com prefers-reduced-motion ficam paradas (quadro completo) e o vídeo
   não toca sozinho (botão de play). Estilos em cg-vitrine.css. As animações de exemplo são cópias geradas das
   animações-base do app (bloco <<base-animacoes>>; não editar à mão). */
(function () {
  'use strict';

  /* <<base-animacoes>> */
  var BASE = [{"ramo":"pizzaria","id":"pizza-fatia","rotulo":"Pizzaria","html":"<div class=\"cga-pz-fatia\" role=\"img\" aria-label=\"Pizza girando com uma fatia saindo e vapor subindo\"><svg viewBox=\"0 0 200 200\" aria-hidden=\"true\" focusable=\"false\">\n  <defs>\n    <clipPath id=\"cga-pz-cb\"><path d=\"M100 110L135 170.6A70 70 0 1 1 170 110Z\"/></clipPath>\n    <clipPath id=\"cga-pz-cf\"><path d=\"M100 110L170 110A70 70 0 0 1 135 170.6Z\"/></clipPath>\n    </g>\n  </defs>\n  <ellipse class=\"cga-pz-sombra cga-m\" cx=\"100\" cy=\"188\" rx=\"58\" ry=\"6\"/>\n  <g class=\"cga-pz-vapor\">\n    <path class=\"cga-m\" d=\"M76 36c-6-6 6-10 0-16s6-10 0-14\"/>\n    <path class=\"cga-m\" d=\"M100 32c-6-6 6-10 0-16s6-10 0-14\"/>\n    <path class=\"cga-m\" d=\"M124 36c-6-6 6-10 0-16s6-10 0-14\"/>\n  </g>\n  <g class=\"cga-pz-todo cga-m\">\n    <g clip-path=\"url(#cga-pz-cb)\"><circle class=\"cga-pz-borda\" cx=\"100\" cy=\"110\" r=\"70\"/>\n      <circle class=\"cga-pz-molho\" cx=\"100\" cy=\"110\" r=\"62\"/>\n      <path class=\"cga-pz-queijo\" d=\"M100 54c18 0 26 6 36 10s20 16 22 30-2 26-8 36-10 20-26 24-30 4-42-2-22-14-28-26-6-26 0-38 14-22 24-28 12-6 22-6z\"/>\n      <g class=\"cga-pz-cal\">\n        <circle cx=\"128\" cy=\"90\" r=\"8\"/><circle cx=\"76\" cy=\"92\" r=\"8\"/><circle cx=\"100\" cy=\"72\" r=\"6.5\"/>\n        <circle cx=\"68\" cy=\"128\" r=\"7.5\"/><circle cx=\"98\" cy=\"146\" r=\"7\"/><circle cx=\"133\" cy=\"129\" r=\"8\"/><circle cx=\"150\" cy=\"116\" r=\"5.5\"/>\n      </g>\n      <g class=\"cga-pz-manj\">\n        <ellipse cx=\"112\" cy=\"104\" rx=\"5\" ry=\"2.6\" transform=\"rotate(-30 112 104)\"/>\n        <ellipse cx=\"84\" cy=\"116\" rx=\"5\" ry=\"2.6\" transform=\"rotate(25 84 116)\"/>\n        <ellipse cx=\"137\" cy=\"145\" rx=\"5\" ry=\"2.6\" transform=\"rotate(-10 137 145)\"/>\n        <ellipse cx=\"90\" cy=\"84\" rx=\"4.5\" ry=\"2.4\" transform=\"rotate(40 90 84)\"/></g>\n    <g transform=\"rotate(30 100 110)\" class=\"cga-pz-fios\">\n      <rect class=\"cga-m\" x=\"100\" y=\"108.7\" width=\"21\" height=\"2.6\" rx=\"1.3\"/>\n      <rect class=\"cga-m\" x=\"103\" y=\"104.6\" width=\"18\" height=\"2\" rx=\"1\"/>\n      <rect class=\"cga-m\" x=\"103\" y=\"113.4\" width=\"18\" height=\"2\" rx=\"1\"/>\n    </g>\n    <g class=\"cga-pz-sai cga-m\"><g clip-path=\"url(#cga-pz-cf)\"><circle class=\"cga-pz-borda\" cx=\"100\" cy=\"110\" r=\"70\"/>\n      <circle class=\"cga-pz-molho\" cx=\"100\" cy=\"110\" r=\"62\"/>\n      <path class=\"cga-pz-queijo\" d=\"M100 54c18 0 26 6 36 10s20 16 22 30-2 26-8 36-10 20-26 24-30 4-42-2-22-14-28-26-6-26 0-38 14-22 24-28 12-6 22-6z\"/>\n      <g class=\"cga-pz-cal\">\n        <circle cx=\"128\" cy=\"90\" r=\"8\"/><circle cx=\"76\" cy=\"92\" r=\"8\"/><circle cx=\"100\" cy=\"72\" r=\"6.5\"/>\n        <circle cx=\"68\" cy=\"128\" r=\"7.5\"/><circle cx=\"98\" cy=\"146\" r=\"7\"/><circle cx=\"133\" cy=\"129\" r=\"8\"/><circle cx=\"150\" cy=\"116\" r=\"5.5\"/>\n      </g>\n      <g class=\"cga-pz-manj\">\n        <ellipse cx=\"112\" cy=\"104\" rx=\"5\" ry=\"2.6\" transform=\"rotate(-30 112 104)\"/>\n        <ellipse cx=\"84\" cy=\"116\" rx=\"5\" ry=\"2.6\" transform=\"rotate(25 84 116)\"/>\n        <ellipse cx=\"137\" cy=\"145\" rx=\"5\" ry=\"2.6\" transform=\"rotate(-10 137 145)\"/>\n        <ellipse cx=\"90\" cy=\"84\" rx=\"4.5\" ry=\"2.4\" transform=\"rotate(40 90 84)\"/></g></g>\n  </g>\n</svg></div>"},
    {"ramo":"barbearia","id":"tesoura-corte","rotulo":"Barbearia","html":"<div class=\"cga-bb-tesoura\" role=\"img\" aria-label=\"Tesoura atravessando e cortando as pontas do cabelo\"><svg viewBox=\"0 0 210 170\" aria-hidden=\"true\" focusable=\"false\">\n  <g class=\"cga-bt-fios\"><path d=\"M42 22q-6 34 0 72\"/><path d=\"M58 22q6 34 0 72\"/><path d=\"M74 22q-6 34 0 72\"/><path d=\"M90 22q6 34 0 72\"/><path d=\"M106 22q-6 34 0 72\"/><path d=\"M122 22q6 34 0 72\"/><path d=\"M138 22q-6 34 0 72\"/><path d=\"M154 22q6 34 0 72\"/></g>\n  <path class=\"cga-bt-linha\" d=\"M24 96h168\"/>\n  <g class=\"cga-bt-pontas\"><path class=\"cga-m\" d=\"M42 94q3 12 0 24\"/><path class=\"cga-m\" d=\"M58 94q-3 12 0 24\"/><path class=\"cga-m\" d=\"M74 94q3 12 0 24\"/><path class=\"cga-m\" d=\"M90 94q-3 12 0 24\"/><path class=\"cga-m\" d=\"M106 94q3 12 0 24\"/><path class=\"cga-m\" d=\"M122 94q-3 12 0 24\"/><path class=\"cga-m\" d=\"M138 94q3 12 0 24\"/><path class=\"cga-m\" d=\"M154 94q-3 12 0 24\"/></g>\n  <g class=\"cga-bt-anda cga-m\">\n    <g transform=\"translate(26 96)\">\n      <g class=\"cga-bt-l1 cga-m\"><circle r=\"46\" fill=\"none\"/><path class=\"cga-bt-lamina\" d=\"M0-1L40-5Q44-3 40 0L0 3z\"/><circle class=\"cga-bt-aro\" cx=\"-17\" cy=\"9\" r=\"8\"/><path class=\"cga-bt-haste\" d=\"M0 1l-11 5\"/></g>\n      <g class=\"cga-bt-l2 cga-m\"><circle r=\"46\" fill=\"none\"/><path class=\"cga-bt-lamina\" d=\"M0 1L40 5Q44 3 40 0L0-3z\"/><circle class=\"cga-bt-aro\" cx=\"-17\" cy=\"-9\" r=\"8\"/><path class=\"cga-bt-haste\" d=\"M0-1l-11-5\"/></g>\n      <circle class=\"cga-bt-pino\" r=\"2.6\"/>\n    </g>\n  </g>\n</svg></div>"},
    {"ramo":"clinica","id":"batimento-sorriso","rotulo":"Clínica","html":"<div class=\"cga-cl-batimento\" role=\"img\" aria-label=\"Linha de batimento que se transforma em sorriso\"><svg viewBox=\"0 0 240 150\" aria-hidden=\"true\" focusable=\"false\">\n  <path class=\"cga-cb-linha cga-m\" d=\"M10 84h56l10-22 14 50 16-74 14 46 8-12 6 12h92\"/>\n  <g class=\"cga-cb-capa cga-m\"><rect x=\"-2\" y=\"10\" width=\"250\" height=\"130\"/><rect class=\"cga-cb-scan\" x=\"-2\" y=\"40\" width=\"3\" height=\"80\" rx=\"1.5\"/></g>\n  <g class=\"cga-cb-sorriso cga-m\">\n    <path class=\"cga-cb-boca\" d=\"M80 80q40 40 80 0\"/>\n    <circle class=\"cga-cb-olho\" cx=\"96\" cy=\"58\" r=\"5\"/><circle class=\"cga-cb-olho\" cx=\"144\" cy=\"58\" r=\"5\"/>\n  </g>\n  <path class=\"cga-cb-folha cga-m\" d=\"M176 46c12-12 30-10 34-6-2 14-18 26-34 6zM178 44l24-2\"/>\n</svg></div>"}];
  
/* <</base-animacoes>> */

  function reduzido() { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function preco(v) {
    if (typeof v === 'number' && isFinite(v)) {
      var inteiro = Math.round(v * 100) % 100 === 0;
      return 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: inteiro ? 0 : 2, maximumFractionDigits: 2 });
    }
    var t = String(v == null ? '' : v).trim();
    if (!t) return '';
    if (/^\d+([.,]\d+)?$/.test(t)) return preco(Number(t.replace(',', '.')));
    return /^R\$/.test(t) ? t : 'R$ ' + t;
  }
  var UNIDADE = { secao: 'por seção', mes: 'por mês', unico: 'valor único' };
  function reiniciar(el, classe) { el.classList.remove(classe); void el.getBoundingClientRect(); el.classList.add(classe); }

  var SETA = '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M4 10h11M11 5l5 5-5 5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var RELOGIO = '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M8 4.6V8l2.4 1.6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';

  /* ---------- demos ---------- */
  var DEMOS = {};

  DEMOS.animacao = function () {
    var lista = BASE.slice(0, 3);
    if (!lista.length) return null;
    var slides = '', pontos = '';
    for (var i = 0; i < lista.length; i++) {
      slides += '<div class="cgv-slide cgv-sl-' + lista[i].ramo + (i === 0 ? ' cgv-ativo' : '') + '"><span class="cgv-ramo">' + esc(lista[i].rotulo) + '</span>' + lista[i].html + '</div>';
      pontos += '<button type="button" class="cgv-ponto" aria-label="Exemplo ' + (i + 1) + ' de ' + lista.length + ': ' + esc(lista[i].rotulo) + '"' + (i === 0 ? ' aria-current="true"' : '') + '></button>';
    }
    return {
      palco: '<div class="cgv-carro">' + slides + '</div>',
      depois: '<div class="cgv-pontos" role="group" aria-label="Escolher exemplo">' + pontos + '</div>',
      ligar: function (card) {
        var sl = card.querySelectorAll('.cgv-slide'), bt = card.querySelectorAll('.cgv-ponto');
        var atual = 0, visivel = false, manual = false, timer = null;
        function raiz(k) { return sl[k] && sl[k].lastElementChild; }
        function mostrar(n) {
          if (n === atual) return;
          var velho = sl[atual];
          velho.classList.remove('cgv-ativo'); velho.classList.add('cgv-saiu');
          if (raiz(atual)) raiz(atual).classList.remove('cga-on');
          setTimeout(function () { velho.classList.remove('cgv-saiu'); }, 720);
          atual = n;
          sl[atual].classList.remove('cgv-saiu'); sl[atual].classList.add('cgv-ativo');
          for (var k = 0; k < bt.length; k++) bt[k].setAttribute('aria-current', k === atual ? 'true' : 'false');
          if (visivel && !reduzido() && raiz(atual)) reiniciar(raiz(atual), 'cga-on');
        }
        function parar() { if (timer) { clearInterval(timer); timer = null; } }
        function rodar() { parar(); if (!manual && visivel && !reduzido()) timer = setInterval(function () { mostrar((atual + 1) % sl.length); }, 5600); }
        for (var k = 0; k < bt.length; k++) (function (k) {
          bt[k].addEventListener('click', function () { manual = true; parar(); mostrar(k); });
        })(k);
        return {
          visivel: function (v) {
            visivel = v;
            var r = raiz(atual);
            if (r) { if (v && !reduzido()) reiniciar(r, 'cga-on'); else r.classList.remove('cga-on'); }
            if (v) rodar(); else parar();
          },
          destruir: parar
        };
      }
    };
  };

  DEMOS.ultra = function () {
    var circ = '';
    for (var i = 0; i < 5; i++) circ += '<circle class="cgv-m" cx="' + (20 + i * 40) + '" cy="6" r="3.4"/>';
    return {
      palco: '<div class="cgv-u">' +
        '<div class="cgv-u-topo"><i></i><b></b><b></b></div>' +
        '<div class="cgv-u-hero"><span class="cgv-u-l1"></span><span class="cgv-u-l2"></span><span class="cgv-u-bt"></span></div>' +
        '<div class="cgv-u-div"><svg viewBox="0 0 200 12" preserveAspectRatio="none" focusable="false"><path d="M0 6h200"/>' + circ + '</svg></div>' +
        '<div class="cgv-u-cards">' +
          '<div class="cgv-u-c"><svg viewBox="0 0 48 48" focusable="false"><circle cx="24" cy="24" r="16" class="cgv-s1"/><path class="cgv-s1 cgv-m cgv-u-ponteiro" d="M24 24V13"/><path class="cgv-s1" d="M24 24l6 4"/></svg></div>' +
          '<div class="cgv-u-c"><svg viewBox="0 0 48 48" focusable="false"><ellipse cx="24" cy="42" rx="8" ry="2.4" class="cgv-f2"/><g class="cgv-m cgv-u-pin"><path class="cgv-f1" d="M24 40s-12-12-12-21a12 12 0 0 1 24 0c0 9-12 21-12 21z"/><circle class="cgv-fb" cx="24" cy="19" r="4.4"/></g></svg></div>' +
          '<div class="cgv-u-c"><svg viewBox="0 0 48 48" focusable="false"><path class="cgv-f1" d="M8 12a5 5 0 0 1 5-5h22a5 5 0 0 1 5 5v14a5 5 0 0 1-5 5H20l-8 7v-7h1a5 5 0 0 1-5-5z"/><circle class="cgv-fb cgv-m cgv-u-pt" cx="17" cy="19" r="2.6"/><circle class="cgv-fb cgv-m cgv-u-pt" cx="24" cy="19" r="2.6"/><circle class="cgv-fb cgv-m cgv-u-pt" cx="31" cy="19" r="2.6"/></svg></div>' +
        '</div></div>'
    };
  };

  DEMOS.secao = function () {
    var sois = [[44, 16], [16, 14], [40, 22], [22, 18], [46, 12], [30, 16]], fotos = '';
    for (var i = 0; i < 6; i++) {
      fotos += '<div class="cgv-s-foto"><svg viewBox="0 0 60 60" preserveAspectRatio="xMidYMid slice" focusable="false"><rect class="cgv-s-ceu" width="60" height="60"/>' +
        '<circle class="cgv-s-sol" cx="' + sois[i][0] + '" cy="' + sois[i][1] + '" r="6.5"/>' +
        '<path class="cgv-s-m2" d="M14 60l20-26 26 26z"/><path class="cgv-s-m1" d="M-4 60l22-30 18 30z"/></svg></div>';
    }
    return { palco: '<div class="cgv-s"><div class="cgv-s-tit"><i></i><b></b></div><div class="cgv-s-grade">' + fotos + '</div></div>' };
  };

  DEMOS.mudancas4 = function () {
    var f = '';
    for (var i = 0; i < 4; i++) f += '<div class="cgv-4-ficha"><i></i><b></b></div>';
    return { palco: '<div class="cgv-4">' + f + '<div class="cgv-4-caixa"><div class="cgv-4-num"><span>0</span><span>1</span><span>2</span><span>3</span><span>+4</span></div></div></div>' };
  };

  DEMOS.video = function (item, op) {
    var vids = [];
    var lista = (op && op.videos) || [];
    for (var i = 0; i < lista.length; i++) if (lista[i] && typeof lista[i].src === 'string' && lista[i].src) vids.push(lista[i]);
    if (!vids.length) {
      return {
        palco: '<div class="cgv-quadro"><svg viewBox="0 0 230 140" focusable="false">' +
          '<rect class="cgv-q-film" x="0" y="96" width="230" height="30" rx="4"/>' +
          (function () { var s = ''; for (var k = 0; k < 13; k++) s += '<rect class="cgv-q-furo" x="' + (6 + k * 17.6) + '" y="100" width="9" height="6" rx="1.5"/><rect class="cgv-q-furo" x="' + (6 + k * 17.6) + '" y="116" width="9" height="6" rx="1.5"/>'; return s; })() +
          '<rect class="cgv-q-cla" x="58" y="34" width="114" height="62" rx="8"/>' +
          '<g transform="rotate(-10 58 34)"><rect class="cgv-q-faixa" x="58" y="14" width="114" height="18" rx="4"/>' +
          '<path class="cgv-q-faixa2" d="M72 14h14l-10 18H62zM104 14h14l-10 18H94zM136 14h14l-10 18h-14z"/></g>' +
          '<path class="cgv-q-play" d="M106 50l22 15-22 15z"/>' +
          '<rect class="cgv-q-tempo" x="182" y="40" width="40" height="18" rx="9"/>' +
          '</svg></div>'
      };
    }
    var pontos = '';
    if (vids.length > 1) {
      for (var j = 0; j < vids.length; j++) pontos += '<button type="button" class="cgv-ponto" aria-label="Vídeo de exemplo ' + (j + 1) + ' de ' + vids.length + '"' + (j === 0 ? ' aria-current="true"' : '') + '></button>';
    }
    var p0 = vids[0].poster ? esc(vids[0].poster) : '';
    return {
      palco: '<div class="cgv-video">' + (p0 ? '<img class="cgv-poster" alt="" loading="lazy" decoding="async" src="' + p0 + '">' : '') +
        '<video muted playsinline loop preload="none" aria-hidden="true"' + (p0 ? ' poster="' + p0 + '"' : '') + '></video></div>',
      foraDoPalco: '<button type="button" class="cgv-vplay" hidden aria-label="Tocar o vídeo de exemplo"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 4l13 8-13 8z" fill="currentColor"/></svg></button>',
      depois: pontos ? '<div class="cgv-pontos" role="group" aria-label="Escolher vídeo">' + pontos + '</div>' : '',
      ligar: function (card) {
        var v = card.querySelector('video'), img = card.querySelector('.cgv-poster'), play = card.querySelector('.cgv-vplay');
        var bt = card.querySelectorAll('.cgv-ponto'), atual = 0, visivel = false, querTocar = false;
        v.muted = true; v.defaultMuted = true; v.setAttribute('muted', '');
        function carregar(k) {
          var it = vids[k];
          if (v.getAttribute('data-k') !== String(k)) {
            v.classList.remove('cgv-on');
            v.setAttribute('data-k', String(k));
            if (it.poster) { v.setAttribute('poster', it.poster); if (img) img.src = it.poster; } else { v.removeAttribute('poster'); }
            v.src = it.src;
          }
        }
        function tocar() { carregar(atual); var p = v.play(); if (p && p.catch) p.catch(function () { if (play) play.hidden = false; }); }
        v.addEventListener('playing', function () { v.classList.add('cgv-on'); if (play) play.hidden = true; });
        v.addEventListener('pause', function () { if (reduzido() && play) play.hidden = false; });
        if (play) {
          play.hidden = !reduzido();
          play.addEventListener('click', function () { querTocar = true; tocar(); });
        }
        for (var k = 0; k < bt.length; k++) (function (k) {
          bt[k].addEventListener('click', function () {
            atual = k;
            for (var m = 0; m < bt.length; m++) bt[m].setAttribute('aria-current', m === k ? 'true' : 'false');
            if (visivel && (!reduzido() || querTocar)) tocar(); else { carregar(k); v.pause(); }
          });
        })(k);
        return {
          visivel: function (on) {
            visivel = on;
            if (on && (!reduzido() || querTocar)) tocar();
            else if (!on && !v.paused) v.pause();
          },
          destruir: function () { try { v.pause(); v.removeAttribute('src'); v.load(); } catch (e) {} }
        };
      }
    };
  };

  /* logo animado: as peças de um logo de exemplo chegam uma por uma e o nome desliza ao lado */
  DEMOS.logo = function () {
    return {
      palco: '<div class="cgv-lg"><svg viewBox="0 0 220 120" focusable="false">' +
        '<g class="cgv-lg-marca"><rect class="cgv-lg-p1 cgv-m" x="20" y="30" width="60" height="60" rx="16"/>' +
        '<circle class="cgv-lg-p2 cgv-m" cx="50" cy="60" r="17"/>' +
        '<path class="cgv-lg-p3 cgv-m" d="M44 52l16 8-16 8z"/></g>' +
        '<rect class="cgv-lg-n1 cgv-m" x="96" y="44" width="96" height="14" rx="7"/>' +
        '<rect class="cgv-lg-n2 cgv-m" x="96" y="66" width="62" height="9" rx="4.5"/>' +
        '</svg></div>'
    };
  };

  /* site premium: um celular com a página rolando; cada bloco entra quando chega na tela (como no site de verdade) */
  DEMOS.premium = function () {
    var blocos = '';
    for (var i = 0; i < 4; i++) blocos += '<div class="cgv-pr-b cgv-pr-b' + i + '"><i></i><b></b><b></b></div>';
    return {
      palco: '<div class="cgv-pr"><div class="cgv-pr-tela"><div class="cgv-pr-rolo">' +
        '<div class="cgv-pr-hero"><span></span><span></span><em></em></div>' + blocos +
        '</div></div><span class="cgv-pr-dedo" aria-hidden="true"></span></div>'
    };
  };

  /* SEO mensal: uma busca no Google em que o resultado do cliente sobe para o 1º lugar */
  DEMOS.seo = function () {
    var r = '';
    for (var i = 0; i < 3; i++) r += '<div class="cgv-seo-r cgv-seo-o' + i + '"><i></i><b></b></div>';
    return {
      palco: '<div class="cgv-seo"><div class="cgv-seo-busca"><svg viewBox="0 0 16 16" focusable="false"><circle cx="7" cy="7" r="4.6"/><path d="M10.4 10.4L14 14"/></svg><span></span></div>' +
        '<div class="cgv-seo-lista">' + r + '<div class="cgv-seo-r cgv-seo-voce"><i></i><b></b><span>seu site</span></div></div></div>'
    };
  };

  /* ---------- cartão ---------- */
  function cartao(item, idx, op) {
    var id = String(item && item.id || '');
    var nome = item && item.nome ? String(item.nome) : id;
    var demo = DEMOS.hasOwnProperty(id) ? DEMOS[id](item, op) : null;
    var pr = preco(item && item.valor), un = UNIDADE[item && item.unidade] || '';
    var art = document.createElement('article');
    art.className = 'cgv-card' + (demo ? '' : ' cgv-card-simples');
    art.setAttribute('data-id', id);
    art.style.setProperty('--cgv-i', String(idx));
    var tid = 'cgv-t-' + Math.random().toString(36).slice(2, 8);
    art.setAttribute('aria-labelledby', tid);
    var rot = 'Quero ' + nome + (pr ? ', ' + pr + (un && un !== 'valor único' ? ' ' + un : '') : '');
    art.innerHTML =
      (demo ? '<div class="cgv-palco" aria-hidden="true"><span class="cgv-exemplo">exemplo</span>' + demo.palco + '</div>' + (demo.foraDoPalco || '') + (demo.depois || '') : '') +
      '<div class="cgv-corpo">' +
        '<div class="cgv-topo"><h3 class="cgv-nome" id="' + tid + '">' + esc(nome) + '</h3>' +
          (pr ? '<p class="cgv-preco"><strong>' + esc(pr) + '</strong>' + (un ? '<span class="cgv-unid">' + un + '</span>' : '') + '</p>' : '') + '</div>' +
        (item && item.desc ? '<p class="cgv-desc">' + esc(item.desc) + '</p>' : '') +
        (item && item.prazo ? '<p class="cgv-prazo">' + RELOGIO + esc(item.prazo) + '</p>' : '') +
        (op && op.modo === 'caixinha'
          ? '<div class="cgv-pe"><label class="cgv-caixa"><input type="checkbox" class="cgv-marca" value="' + esc(id) + '"' + ((op.marcados || []).indexOf(id) >= 0 ? ' checked' : '') + ' aria-label="' + esc('Somar ' + nome + (pr ? ', ' + pr + (un && un !== 'valor único' ? ' ' + un : '') : '') + ' ao pedido') + '"><span class="cgv-caixa-q" aria-hidden="true"></span><span class="cgv-caixa-t">Somar ao pedido</span></label></div>'
          : '<div class="cgv-pe"><button type="button" class="cgv-quero" aria-label="' + esc(rot) + '"><span class="cgv-quero-face">Quero' + SETA + '</span></button></div>') +
      '</div>';
    if (demo && demo.foraDoPalco) {
      // o play do vídeo fica por cima do palco, mas fora do aria-hidden
      var palco = art.querySelector('.cgv-palco'), fora = palco.nextElementSibling;
      var caixa = document.createElement('div');
      caixa.style.position = 'relative';
      palco.parentNode.insertBefore(caixa, palco);
      caixa.appendChild(palco); caixa.appendChild(fora);
    }
    return { el: art, id: id, ctl: demo && demo.ligar ? demo.ligar(art) : null };
  }

  function montar(elemento, opcoes) {
    if (!elemento || !elemento.appendChild) throw new Error('CGVitrine.montar: elemento inválido');
    var op = opcoes || {};
    var cat = Array.isArray(op.catalogo) ? op.catalogo : [];
    elemento.classList.add('cgv');
    elemento.innerHTML = '';
    var reduz = reduzido(), temIO = 'IntersectionObserver' in window;
    if (!reduz && temIO) elemento.classList.add('cgv-pronto');
    var cards = [];
    for (var i = 0; i < cat.length; i++) {
      if (!cat[i] || !cat[i].id) continue;
      var c = cartao(cat[i], cards.length, op);
      elemento.appendChild(c.el);
      cards.push(c);
    }

    function aoClicar(ev) {
      var b = ev.target.closest && ev.target.closest('.cgv-quero');
      if (!b || !elemento.contains(b)) return;
      var card = b.closest('.cgv-card'), id = card && card.getAttribute('data-id');
      if (id && typeof op.aoQuerer === 'function') op.aoQuerer(id);
      try { elemento.dispatchEvent(new CustomEvent('cgv:quero', { bubbles: true, detail: { id: id } })); } catch (e) {}
    }
    function aoApertar(ev) {
      if (reduzido()) return;
      var b = ev.target.closest && ev.target.closest('.cgv-quero');
      if (!b || !elemento.contains(b)) return;
      var f = b.querySelector('.cgv-quero-face'), r = f.getBoundingClientRect(), w = document.createElement('span');
      w.className = 'cgv-onda';
      w.style.left = (ev.clientX - r.left) + 'px';
      w.style.top = (ev.clientY - r.top) + 'px';
      f.appendChild(w);
      setTimeout(function () { if (w.parentNode) w.parentNode.removeChild(w); }, 650);
    }
    function aoMudar(ev) {
      var cx = ev.target;
      if (!cx || !cx.classList || !cx.classList.contains('cgv-marca') || !elemento.contains(cx)) return;
      var card = cx.closest('.cgv-card'); if (card) card.classList.toggle('cgv-marcado', cx.checked);
      if (typeof op.aoMarcar === 'function') op.aoMarcar(cx.value, cx.checked);
    }
    elemento.addEventListener('click', aoClicar);
    elemento.addEventListener('pointerdown', aoApertar);
    elemento.addEventListener('change', aoMudar);
    function marcarIds(ids) {
      var l = elemento.querySelectorAll('.cgv-marca');
      for (var k = 0; k < l.length; k++) { var on = (ids || []).indexOf(l[k].value) >= 0; l[k].checked = on; var cd = l[k].closest('.cgv-card'); if (cd) cd.classList.toggle('cgv-marcado', on); }
    }
    if (op.modo === 'caixinha') marcarIds(op.marcados || []);

    var io = null;
    function marcar(c, on) {
      c.el.classList.toggle('cgv-vivo', on && !reduzido());
      if (on) c.el.classList.add('cgv-chegou');
      if (c.ctl && c.ctl.visivel) c.ctl.visivel(on);
    }
    if (temIO) {
      io = new IntersectionObserver(function (es) {
        for (var k = 0; k < es.length; k++) {
          for (var m = 0; m < cards.length; m++) if (cards[m].el === es[k].target) marcar(cards[m], es[k].isIntersecting);
        }
      }, { threshold: 0.25 });
      for (var j = 0; j < cards.length; j++) io.observe(cards[j].el);
    } else {
      for (var n = 0; n < cards.length; n++) marcar(cards[n], true);
    }

    return {
      elemento: elemento,
      marcar: marcarIds,
      destruir: function () {
        if (io) io.disconnect();
        for (var k = 0; k < cards.length; k++) if (cards[k].ctl && cards[k].ctl.destruir) cards[k].ctl.destruir();
        elemento.removeEventListener('click', aoClicar);
        elemento.removeEventListener('pointerdown', aoApertar);
        elemento.removeEventListener('change', aoMudar);
        elemento.innerHTML = '';
        elemento.classList.remove('cgv', 'cgv-pronto');
      }
    };
  }

  window.CGVitrine = { montar: montar, preco: preco };
})();
