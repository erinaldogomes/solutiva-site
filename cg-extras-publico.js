/* ClickGo · extras ANTES da compra (24/10/2026).
   1) Página inicial: seção "Deixe ainda mais especial" (#especial). Só carrega a vitrine (cg-vitrine.css/js) quando a
      seção chega perto da tela; "Quero" leva ao formulário já com o extra marcado (/esboco/?extras=id).
   2) Formulário (/esboco/): caixinhas no passo de revisão (#cg-form-extras). window.CGFormExtras.ids() devolve os ids
      marcados; o esboco.js manda em "extras" no POST /pedido.
   Catálogo e valores SEMPRE vêm de /config (a nuvem só repassa o que o app publicou); a nuvem confere os ids de novo.
   Sem script inline (CSP), sem innerHTML com dado de fora. */
(function () {
  'use strict';
  var API = 'https://orbixbr.onrender.com/api/clickgo';
  try {
    var qa = new URLSearchParams(location.search).get('api');
    if (qa && /^(localhost|127\.0\.0\.1)$/.test(location.hostname) && /^http:\/\/(127\.0\.0\.1|localhost):\d{2,5}$/.test(qa)) API = qa + '/api/clickgo';
  } catch (e) { /* */ }
  var ID = /^[a-z0-9]{2,20}$/;
  // extras SÓ com o site no ar (app: soNoAr em data/precos.json, 28/10/2026): nunca viram caixinha antes da compra; aparecem
  // como aviso "na sala do seu site" (quem compra é a sala). O app também recusa esses ids antes do site no ar.
  var SO_SALA = ['seo', 'logo', 'premium'];
  function daSala(x) { return SO_SALA.indexOf(x.id) >= 0; }
  function notaSala(lista) {
    if (!lista.length) return null;
    return el('p', 'cfe-sub cfe-sala', 'Depois que o site estiver no ar, na sala do seu site: ' + lista.map(function (x) { return x.nome + ' ' + brl(x.valor) + unidade(x); }).join(' · ') + '.');
  }
  var MIDIA = 'https://clickgo-midia.pages.dev/vitrine/';
  var VIDEOS = [1, 2, 3].map(function (n) { return { src: MIDIA + 'exemplo-video-' + n + '.mp4', poster: MIDIA + 'exemplo-video-' + n + '.jpg' }; });

  function catalogo() {
    return fetch(API + '/config', { credentials: 'omit' }).then(function (r) { return r.ok ? r.json() : {}; }).then(function (c) {
      return (c && Array.isArray(c.extras) ? c.extras : []).filter(function (x) {
        return x && ID.test(String(x.id)) && Number(x.valor) > 0 && Number(x.valor) < 100000 && typeof x.nome === 'string';
      }).slice(0, 8);
    }).catch(function () { return []; });
  }
  function brl(v) { return 'R$ ' + (Number(v) || 0).toLocaleString('pt-BR', { minimumFractionDigits: Number(v) % 1 ? 2 : 0, maximumFractionDigits: 2 }); }
  function unidade(x) { return x.unidade === 'secao' ? ' por seção' : x.unidade === 'mes' ? ' por mês' : ''; }
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function carregar(src, css) {
    return new Promise(function (ok, falha) {
      var e = document.createElement(css ? 'link' : 'script');
      if (css) { e.rel = 'stylesheet'; e.href = src; } else { e.src = src; e.async = true; }
      e.onload = ok; e.onerror = falha; document.head.appendChild(e);
    });
  }

  /* 1) página inicial */
  var home = document.getElementById('especial');
  if (home) {
    var feito = false;
    var montar = function () {
      if (feito) return; feito = true;
      Promise.all([catalogo(), carregar('/cg-vitrine.css?v=1', true), carregar('/cg-vitrine.js?v=1')]).then(function (r) {
        var todos = r[0], cat = todos.filter(function (x) { return !daSala(x); });
        if (!cat.length || !window.CGVitrine) return;
        home.hidden = false;
        window.CGVitrine.montar(home.querySelector('.esp-lista'), {
          catalogo: cat, videos: VIDEOS,
          aoQuerer: function (id) { if (ID.test(id)) location.href = '/esboco/?extras=' + encodeURIComponent(id); }
        });
        var ns = notaSala(todos.filter(daSala)); if (ns) home.appendChild(ns);
      }).catch(function () { /* sem vitrine: a seção fica escondida */ });
    };
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) { if (es.some(function (e) { return e.isIntersecting; })) { io.disconnect(); montar(); } }, { rootMargin: '600px 0px' });
      // a seção nasce escondida (não cruza a tela); observa a vizinha visível
      io.observe(document.getElementById('animacoes') || document.getElementById('perguntas') || home.parentNode);
    } else montar();
  }

  /* 2) formulário */
  var caixa = document.getElementById('cg-form-extras');
  var marcados = [];
  try {
    var q = new URLSearchParams(location.search).get('extras');
    var s = sessionStorage.getItem('cg_extras');
    marcados = String(q || s || '').split(',').filter(function (x) { return ID.test(x); }).slice(0, 6);
  } catch (e) { /* */ }
  function guardar() { try { sessionStorage.setItem('cg_extras', marcados.join(',')); } catch (e) { /* */ } }
  if (caixa) {
    catalogo().then(function (todos) {
      var cat = todos.filter(function (x) { return !daSala(x); }), sala = todos.filter(daSala);
      if (!cat.length && !sala.length) { marcados = []; return; }
      marcados = marcados.filter(function (id) { return cat.some(function (x) { return x.id === id; }); });
      caixa.textContent = '';
      caixa.appendChild(el('p', 'cfe-t', 'Deixe ainda mais especial (opcional)'));
      caixa.appendChild(el('p', 'cfe-sub', 'Soma no total e metade vai no sinal. Dá para tirar depois, antes de aprovar a prévia.'));
      var total = el('p', 'cfe-total');
      var conta = function () {
        var t = cat.filter(function (x) { return marcados.indexOf(x.id) >= 0; }).reduce(function (a, x) { return a + Number(x.valor); }, 0);
        total.textContent = t ? 'Extras: ' + brl(t) : '';
      };
      cat.forEach(function (x) {
        var lb = el('label', 'aceite cfe-op'), cb = document.createElement('input'), cx = el('span', 'aceite-cx'), tx = el('span');
        cb.type = 'checkbox'; cb.value = x.id; cb.checked = marcados.indexOf(x.id) >= 0;
        cx.setAttribute('aria-hidden', 'true');
        tx.appendChild(el('b', '', x.nome)); tx.appendChild(document.createTextNode(' · ' + brl(x.valor) + unidade(x) + (x.prazo ? ' · ' + x.prazo : '')));
        if (x.desc) tx.appendChild(el('small', 'cfe-desc', x.desc));
        cb.addEventListener('change', function () {
          marcados = marcados.filter(function (id) { return id !== x.id; });
          if (cb.checked) marcados.push(x.id);
          guardar(); conta();
        });
        lb.appendChild(cb); lb.appendChild(cx); lb.appendChild(tx); caixa.appendChild(lb);
      });
      caixa.appendChild(total); conta(); guardar();
      var ns = notaSala(sala); if (ns) caixa.appendChild(ns);
      caixa.hidden = false;
    });
  }
  window.CGFormExtras = { ids: function () { return marcados.slice(0, 6); } };
})();
