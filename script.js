/* =====================================================================
   CONTATO: o ÚNICO lugar para trocar para onde os botões levam.
   - principal: botão de orçamento (ciano), o único botão principal do site.
   - secundario: ícone do LinkedIn no rodapé.
   - O NÚMERO do WhatsApp da ClickGo (rodapé, bolinha, formulário, página do
     pedido) fica em contato.js. O campo abaixo é outra coisa:
   - whatsapp: preencha só com dígitos para os BOTÕES PRINCIPAIS
     com 55 + DDD, ex.: '5561999999999'. Aí todos os botões principais
     passam a abrir o WhatsApp com a mensagem pronta abaixo.
   ===================================================================== */
const CONTATO = {
  principal: 'https://ig.me/m/clickgo.dev',
  esboco: '/esboco/',   // pedir a prévia sem custo: formulário (resposta na página de acompanhamento)
  secundario: 'https://www.youtube.com/@clickgodev',
  whatsapp: '',
  mensagemWhatsapp: 'Olá! Vi o site da ClickGo e quero um orçamento.'
};

(function () {
  'use strict';
  document.documentElement.classList.remove('sem-js');

  // ---- links de contato ----
  var usaZap = /^\d{12,13}$/.test(CONTATO.whatsapp || '');
  var principal = usaZap
    ? 'https://wa.me/' + CONTATO.whatsapp + '?text=' + encodeURIComponent(CONTATO.mensagemWhatsapp)
    : CONTATO.principal;
  document.querySelectorAll('[data-contato]').forEach(function (a) {
    var tipo = a.getAttribute('data-contato');
    a.href = tipo === 'secundario' ? CONTATO.secundario : tipo === 'esboco' ? CONTATO.esboco : principal;
  });
  if (usaZap) {
    document.querySelectorAll('[data-rotulo-canal]').forEach(function (el) { el.textContent = 'WhatsApp'; });
  }

  var ano = document.getElementById('ano');
  if (ano) ano.textContent = new Date().getFullYear();

  // ---- revelar ao rolar ----
  var revelas = document.querySelectorAll('.revela');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (ents) {
      var k = 0;
      ents.sort(function (a, b) { return a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left; });
      ents.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.style.setProperty('--atraso', Math.min(k++, 6) * 90 + 'ms');
          e.target.classList.add('visivel'); io.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    revelas.forEach(function (el) { io.observe(el); });
  } else {
    revelas.forEach(function (el) { el.classList.add('visivel'); });
  }

  // ---- vídeo da Vitrine: só baixa quando chega perto ----
  var reduz = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var vit = document.querySelector('.vitrine-video');
  if (vit && 'IntersectionObserver' in window) {
    var vio = new IntersectionObserver(function (ents) {
      ents.forEach(function (e) {
        if (e.isIntersecting) {
          if (!vit.src) { vit.src = vit.getAttribute('data-src'); }
          if (!reduz) { var p = vit.play(); if (p && p.catch) p.catch(function () {}); }
        } else if (!vit.paused) { vit.pause(); }
      });
    }, { rootMargin: '200px 0px' });
    vio.observe(vit);
  }
  if (vit && reduz) { vit.controls = true; }

  // ---- animações sob medida: cada vídeo só baixa/toca na tela; movimento reduzido = só o pôster ----
  var anims = document.querySelectorAll('.anim-video');
  if (anims.length && !reduz && 'IntersectionObserver' in window) {
    var aio = new IntersectionObserver(function (ents) {
      ents.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) {
          if (!v.getAttribute('src')) { v.src = v.getAttribute('data-src'); }
          var p = v.play(); if (p && p.catch) p.catch(function () {});
        } else if (!v.paused) { v.pause(); }
      });
    }, { threshold: 0.35 });
    anims.forEach(function (v) { aio.observe(v); });
  }

  // ---- painel do topo: robôs trabalhando (demonstração, sem números) ----
  var html = document.documentElement;
  var temIO = 'IntersectionObserver' in window;
  var feed = document.getElementById('feed');
  var EVENTOS = [
    ['Orbix', 'achou um produto novo para divulgar'],
    ['NexoFrame', 'gravou o vídeo do produto'],
    ['Orbix', 'conferiu o preço antes de publicar'],
    ['Orbix', 'publicou o vídeo em 4 redes'],
    ['ClickGo', 'respondeu um cliente e mandou o esboço do site'],
    ['LYRA', 'editou a gameplay e agendou'],
    ['Certeza Duvidosa', 'montou roteiro, narração e cenas'],
    ['Orbit', 'recebeu um comando pelo Telegram']
  ];
  // a lista estática do HTML vale sem JS ou com movimento reduzido; com JS ela recomeça do ciclo
  var iniciaFeed = function () {};
  if (feed && !reduz) {
    var idx = 0, vivo = true, noTopo = true, liberado = false, timer = null, MAX = 5;
    var cria = function (ev, digitar) {
      var li = document.createElement('li');
      li.className = 'ev';
      var m = document.createElement('span'); m.className = 'ev-marca'; m.setAttribute('aria-hidden', 'true');
      var t = document.createElement('span'); t.className = 'ev-txt';
      var b = document.createElement('b'); b.textContent = ev[0];
      var resto = document.createTextNode(digitar ? ' ' : ' ' + ev[1]);
      t.appendChild(b); t.appendChild(resto);
      li.appendChild(m); li.appendChild(t);
      li._resto = resto;
      return li;
    };
    feed.textContent = '';
    for (var k0 = MAX - 1; k0 >= 0; k0--) { var li0 = cria(EVENTOS[k0], false); li0.classList.add('feito'); feed.appendChild(li0); }
    idx = MAX;

    // desliza as linhas que já estavam (técnica FLIP: só transform)
    var insere = function (li) {
      var antes = [];
      for (var i = 0; i < feed.children.length; i++) antes.push([feed.children[i], feed.children[i].getBoundingClientRect().top]);
      feed.insertBefore(li, feed.firstChild);
      antes.forEach(function (par) {
        var d = par[1] - par[0].getBoundingClientRect().top;
        if (!d) return;
        par[0].style.transition = 'none';
        par[0].style.transform = 'translateY(' + d + 'px)';
      });
      void feed.offsetHeight;
      antes.forEach(function (par) {
        par[0].style.transition = 'transform .6s cubic-bezier(.16,1,.3,1)';
        par[0].style.transform = '';
      });
    };

    var digita = function (li, texto, fim) {
      var cur = document.createElement('span'); cur.className = 'cursor'; cur.setAttribute('aria-hidden', 'true');
      li.querySelector('.ev-txt').appendChild(cur);
      var n = 0;
      var passoD = function () {
        if (!vivo) { setTimeout(passoD, 200); return; }
        n++;
        li._resto.nodeValue = ' ' + texto.slice(0, n);
        if (n < texto.length) {
          var c = texto.charAt(n - 1);
          setTimeout(passoD, c === ' ' ? 55 : (c === ',' ? 160 : 22 + Math.random() * 38));
        } else {
          setTimeout(function () { if (cur.parentNode) cur.parentNode.removeChild(cur); fim(); }, 250);
        }
      };
      setTimeout(passoD, 380);
    };

    var proximo = function () {
      timer = null;
      if (!vivo || !noTopo || !liberado) return;
      var ev = EVENTOS[idx % EVENTOS.length]; idx++;
      var li = cria(ev, true);
      li.classList.add('rodando', 'nova');
      var vai = function () {
        while (feed.children.length >= MAX) feed.removeChild(feed.lastChild);
        insere(li);
        digita(li, ev[1], function () {
          li.style.setProperty('--dur', '1300ms');
          li.classList.add('carrega');
          setTimeout(function () {
            li.classList.remove('rodando', 'carrega', 'nova');
            li.classList.add('feito', 'pop');
            timer = setTimeout(proximo, 1100);
          }, 1300);
        });
      };
      if (feed.children.length >= MAX) { feed.lastChild.classList.add('sai'); setTimeout(vai, 300); } else vai();
    };
    var liga = function () { if (!timer && vivo && noTopo && liberado) timer = setTimeout(proximo, 500); };
    if (temIO) new IntersectionObserver(function (e) { noTopo = e[0].isIntersecting; liga(); }).observe(feed);
    document.addEventListener('visibilitychange', function () { vivo = !document.hidden; liga(); });
    iniciaFeed = function () { liberado = true; liga(); };
  }

  // ---- abertura: o "S" se monta (triângulos da logo) e se desfaz no painel ----
  var rnd = function (a, b) { return a + Math.random() * (b - a); };
  if (html.classList.contains('intro') && !reduz) {
    var sTris = document.querySelectorAll('.s-intro polygon');
    var grande = window.innerWidth >= 1000;
    for (var ti = 0; ti < sTris.length; ti++) {
      var st = sTris[ti].style, ang = rnd(0, 6.283), dist = rnd(260, 520);
      st.setProperty('--dx', Math.cos(ang) * dist + 'px');
      st.setProperty('--dy', Math.sin(ang) * dist + 'px');
      st.setProperty('--r', rnd(-200, 200) + 'deg');
      st.transitionDelay = (ti * 65) + 'ms';
    }
    requestAnimationFrame(function () { requestAnimationFrame(function () { html.classList.add('intro-monta'); }); });
    setTimeout(function () {
      for (var tj = 0; tj < sTris.length; tj++) {
        var s2 = sTris[tj].style;
        // no computador os triângulos "caem" para dentro do painel; no celular sobem e somem
        s2.setProperty('--ox', rnd(-90, 90) + 'px');
        s2.setProperty('--oy', (grande ? rnd(120, 320) : rnd(-260, -120)) + 'px');
        s2.setProperty('--r2', rnd(-160, 160) + 'deg');
        s2.transitionDelay = (tj * 35) + 'ms';
      }
      html.classList.add('intro-desfaz');
    }, 1900);
    setTimeout(function () { html.classList.add('intro-fim'); }, 2250);
    setTimeout(function () {
      var svg = document.querySelector('.s-intro'); if (svg) svg.style.display = 'none';
      iniciaFeed();
    }, 3300);
  } else {
    html.classList.add('intro-monta', 'intro-fim');
    iniciaFeed();
  }

  if (!reduz) html.classList.add('js-mov');

  // ---- trilho dos passos e conversa do robô: desenham ao entrar na tela ----
  var aoEntrar = function (sel, classe, margem) {
    var els = document.querySelectorAll(sel);
    if (!temIO || reduz) { els.forEach(function (el) { el.classList.add(classe); }); return; }
    var o = new IntersectionObserver(function (ents) {
      ents.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add(classe); o.unobserve(e.target); } });
    }, { rootMargin: margem || '0px 0px -15% 0px' });
    els.forEach(function (el) { o.observe(el); });
  };
  aoEntrar('.passos', 'desenha');
  aoEntrar('.chat', 'ativo', '0px 0px -25% 0px');

  // ---- treino nas conversas reais: as 3 cenas passam sozinhas enquanto estão na tela ----
  var treino = document.getElementById('treino');
  if (treino && temIO && !reduz) {
    var tEtapa = 0, tTimer = null, tVis = false;
    var ESPERA = [700, 1900, 2000, 3400];
    var tPasso = function () {
      tTimer = null;
      if (!tVis || document.hidden) return;
      tEtapa = (tEtapa + 1) % 4;
      treino.setAttribute('data-etapa', tEtapa);
      tTimer = setTimeout(tPasso, ESPERA[tEtapa]);
    };
    new IntersectionObserver(function (e) {
      tVis = e[0].isIntersecting;
      if (tVis && !tTimer) tTimer = setTimeout(tPasso, ESPERA[tEtapa]);
    }, { rootMargin: '0px 0px -20% 0px' }).observe(treino);
  }

  // ---- inclinação leve dos cartões e luz que segue o mouse (só com mouse) ----
  if (!reduz && window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('.tilt').forEach(function (c) {
      var raf = 0, px = 0, py = 0;
      var aplica = function () {
        raf = 0;
        var r = c.getBoundingClientRect(), x = (px - r.left) / r.width, y = (py - r.top) / r.height;
        c.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
        c.style.setProperty('--my', (y * 100).toFixed(1) + '%');
        c.style.transform = 'perspective(900px) rotateX(' + ((.5 - y) * 5).toFixed(2) + 'deg) rotateY(' + ((x - .5) * 6).toFixed(2) + 'deg) translateY(-4px)';
      };
      c.addEventListener('pointerenter', function () { c.classList.add('inclina'); });
      c.addEventListener('pointermove', function (e) { px = e.clientX; py = e.clientY; if (!raf) raf = requestAnimationFrame(aplica); });
      c.addEventListener('pointerleave', function () {
        if (raf) { cancelAnimationFrame(raf); raf = 0; }
        c.style.transform = '';
        setTimeout(function () { c.classList.remove('inclina'); }, 180);
      });
    });
  }

  // ---- grade triangular do fundo com parallax sutil ----
  var malha = document.querySelector('.malha');
  if (malha && !reduz) {
    var pend = false;
    var moveMalha = function () { pend = false; var y = window.scrollY || 0; malha.style.transform = 'translate3d(0,' + (-(y * .18) % 97).toFixed(1) + 'px,0)'; };
    window.addEventListener('scroll', function () { if (!pend) { pend = true; requestAnimationFrame(moveMalha); } }, { passive: true });
    moveMalha();
  }

  // ---- botão flutuante no celular depois do topo ----
  var flut = document.querySelector('.flutuante');
  var hero = document.getElementById('inicio');
  // WhatsApp (bolinha): no celular aparece JUNTO com o botão flutuante (logo acima dele), então some quando um botão
  // de pedido da seção está na tela e nunca cobre um botão principal (CSS em v7.css; no computador fica sempre).
  var zapF = document.querySelector('.zap-flut');
  if (zapF && !(flut && hero && 'IntersectionObserver' in window)) zapF.classList.add('mostra');
  var fim = document.getElementById('contato');
  if (flut && hero && 'IntersectionObserver' in window) {
    var vis = { hero: true, fim: false }, ctas = 0;
    var upd = function () { var m = !vis.hero && !vis.fim && ctas === 0; flut.classList.toggle('mostra', m); if (zapF) zapF.classList.toggle('mostra', m); };
    new IntersectionObserver(function (e) { vis.hero = e[0].isIntersecting; upd(); }).observe(hero);
    if (fim) new IntersectionObserver(function (e) { vis.fim = e[0].isIntersecting; upd(); }).observe(fim);
    // some quando um botão de orçamento da própria seção está na tela (não cobre o botão)
    var oc = new IntersectionObserver(function (ents) {
      ents.forEach(function (e) {
        var antes = e.target._visto === true;
        if (e.isIntersecting !== antes) { e.target._visto = e.isIntersecting; ctas += e.isIntersecting ? 1 : -1; }
      });
      upd();
    }, { rootMargin: '0px 0px 40px 0px' });
    document.querySelectorAll('main .acoes, main .produto-acoes, .sis-cta .btn').forEach(function (el) { if (!hero.contains(el)) oc.observe(el); });
  }

  // ---- fundo vivo: triângulos da logo subindo devagar ----
  if (reduz) return;
  var cv = document.getElementById('bgCanvas');
  var ctx = cv && cv.getContext('2d');
  if (!ctx) return;
  var W = 0, H = 0, DPR = 1, small = false, tris = [];
  var COR = ['63,210,255', '76,141,246', '159,230,255']; // paleta única (cg-cores.css, 24/10/2026)
  function rnd(a, b) { return a + Math.random() * (b - a); }

  function resize() {
    W = window.innerWidth; H = window.innerHeight; small = W < 760;
    DPR = Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2);
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    var nt = small ? 7 : 14;
    while (tris.length < nt) tris.push({ x: rnd(0, W), y: rnd(0, H), s: rnd(12, 40), a: rnd(0, 6.28), va: rnd(-.003, .003), vy: rnd(-.22, -.06), o: rnd(.05, .13), c: Math.floor(Math.random() * COR.length) });
    tris.length = nt;
  }

  var lastY = window.scrollY || 0, sv = 0, last = 0, rodando = true;
  function frame(t) {
    if (!rodando) return;
    requestAnimationFrame(frame);
    if (t - last < 32) return; // ~30 fps basta
    last = t;
    var y = window.scrollY || 0, ds = y - lastY; lastY = y; sv = sv * .85 + ds * .15;
    ctx.clearRect(0, 0, W, H);
    for (var k = 0; k < tris.length; k++) {
      var tr = tris[k];
      tr.y += tr.vy - sv * .05; tr.a += tr.va;
      if (tr.y < -60) { tr.y = H + 60; tr.x = rnd(0, W); }
      if (tr.y > H + 60) tr.y = -60;
      ctx.save(); ctx.translate(tr.x, tr.y); ctx.rotate(tr.a);
      ctx.beginPath(); ctx.moveTo(0, -tr.s); ctx.lineTo(tr.s * .87, tr.s * .5); ctx.lineTo(-tr.s * .87, tr.s * .5); ctx.closePath();
      ctx.fillStyle = 'rgba(' + COR[tr.c] + ',' + tr.o + ')'; ctx.fill();
      ctx.strokeStyle = 'rgba(' + COR[2] + ',' + (tr.o * 1.6) + ')'; ctx.lineWidth = 1; ctx.stroke();
      ctx.restore();
    }
  }

  resize();
  window.addEventListener('resize', resize, { passive: true });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { rodando = false; } else if (!rodando) { rodando = true; requestAnimationFrame(frame); }
  });
  requestAnimationFrame(frame);
})();
