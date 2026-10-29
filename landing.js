/* ClickGo: página inicial (28/10/2026, landing.css). Veio do v9.js SEM a história em canvas (o palco preso deixava metade
   da tela vazia no computador) e sem o título palavra por palavra (o título é o LCP: aparece na primeira pintura).
   - Fontes do Google depois da primeira pintura (a CSP não aceita script inline).
   - Entrada ao rolar: o CSS usa animation-timeline; só onde não existe o IntersectionObserver põe .rv/.in. Sem JS tudo aparece.
   - Demonstrações (cardápio e agenda) são fictícias: nada vai para WhatsApp nenhum.
   - Portfólio: índice que revela a imagem, filtros com View Transition e a imagem que "viaja" para o trabalho-v9.html.
   - Como funciona: número gigante grudado que troca conforme a etapa entra na tela.
   Sem biblioteca; tudo que anima é transform/opacity (CSS); aqui só troca classe e estado. */
(function () {
  'use strict';
  var d = document, w = window, html = d.documentElement;
  html.classList.remove('sem-js'); html.classList.add('js');
  var reduz = w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // transição "pulada" (outra começou antes, aba escondida) rejeita a promessa finished: não é erro, só silencia
  var troca = function (fn) { if (!reduz && d.startViewTransition) { var t = d.startViewTransition(fn); if (t && t.finished && t.finished.catch) t.finished.catch(function () {}); if (t && t.ready && t.ready.catch) t.ready.catch(function () {}); } else fn(); };
  var $ = function (s, r) { return (r || d).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };

  var ano = $('#ano'); if (ano) ano.textContent = new Date().getFullYear();

  // ---- fontes do Google depois da primeira pintura (o CSS delas travava ~0,9 s no 4G medido em 24/10) ----
  var fl = document.querySelector('link[data-fontes]');
  if (fl) { var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = fl.href; document.head.appendChild(l); }

  // ---- entrada ao rolar onde o CSS não sabe animation-timeline ----
  if (!(w.CSS && CSS.supports && CSS.supports('animation-timeline: view()')) && 'IntersectionObserver' in w) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -10% 0px' });
    $$('.cab h2, .ficha, .demo-fone, .agenda, .trab, .artigos li, .faq details, .fim h2').forEach(function (el) { el.classList.add('rv'); io.observe(el); });
  }
  // os "checks" marcam ao entrar (também com animation-timeline, que não sabe pôr classe)
  if ('IntersectionObserver' in w) {
    var ioc = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { $$('li', e.target).forEach(function (li, i) { setTimeout(function () { li.classList.add('in'); }, reduz ? 0 : 120 + i * 110); }); ioc.unobserve(e.target); } }); }, { threshold: .4 });
    $$('.checks').forEach(function (el) { ioc.observe(el); });
  } else { $$('.checks li').forEach(function (li) { li.classList.add('in'); }); }

  // ---- topo some ao descer e volta ao subir; botão flutuante aparece depois da abertura ----
  var topo = $('#topo'), flut = $('#flut'), ultimo = 0, tick = false;
  var rola = function () {
    var y = w.scrollY || 0;
    if (topo) topo.classList.toggle('oculto', y > 120 && y > ultimo);
    if (flut) { var ab = d.querySelector('.abre'); flut.classList.toggle('on', y > (ab ? ab.offsetHeight - 80 : w.innerHeight * .8)); }
    ultimo = y; tick = false;
  };
  w.addEventListener('scroll', function () { if (!tick) { tick = true; w.requestAnimationFrame(rola); } }, { passive: true });
  // seção atual no menu
  var links = $$('.menu a[href^="#"]');
  if (links.length && 'IntersectionObserver' in w) {
    var ios = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) links.forEach(function (a) { a.setAttribute('aria-current', a.getAttribute('href') === '#' + e.target.id ? 'true' : 'false'); }); }); }, { rootMargin: '-40% 0px -55% 0px' });
    links.forEach(function (a) { var s = $(a.getAttribute('href')); if (s) ios.observe(s); });
  }

  // ---- demonstração do cardápio (fictícia) ----
  var itens = $('#itens');
  if (itens) {
    var ICO = { pizza: 'M12 3a9 9 0 0 1 9 9H3a9 9 0 0 1 9-9zM3 12l9 9 9-9M9 9h.01M14 8h.01', massa: 'M4 10h16M4 14h16M6 18h12M6 6h12', bebida: 'M6 3h12l-1.5 17h-9zM8 8h8', doce: 'M12 3l3 5h-6zM6 8h12l-1 12H7z' };
    var CAT = {
      pizzas: [['Margherita', 'molho, muçarela, manjericão', '42,00', 'pizza', '#f6c6a3'], ['Calabresa', 'calabresa, cebola, azeitona', '46,00', 'pizza', '#f3b08b'], ['Quatro queijos', 'muçarela, provolone, gorgonzola, parmesão', '54,00', 'pizza', '#f9dcb0'], ['Portuguesa', 'presunto, ovo, ervilha, cebola', '49,00', 'pizza', '#eab79b']],
      massas: [['Lasanha à bolonhesa', 'serve 2', '38,00', 'massa', '#f2b5a0'], ['Nhoque ao sugo', 'batata, molho de tomate', '32,00', 'massa', '#f6c6a3'], ['Penne ao pesto', 'manjericão, nozes', '36,00', 'massa', '#cfe3b7']],
      bebidas: [['Refrigerante lata', '350 ml', '6,00', 'bebida', '#bfe3f2'], ['Suco natural', 'laranja, limão ou abacaxi', '9,00', 'bebida', '#f9e3a1'], ['Água', 'com ou sem gás', '4,00', 'bebida', '#d6ecf5']],
      doces: [['Pizza de brigadeiro', 'brigadeiro, granulado', '39,00', 'doce', '#d9b8a8'], ['Petit gâteau', 'com sorvete', '22,00', 'doce', '#e7c9b4']]
    };
    var qtd = 0, total = 0, nEl = $('#carrinho-n'), tEl = $('#carrinho-t'), car = $('#carrinho');
    var brl = function (v) { return 'R$ ' + v.toFixed(2).replace('.', ','); };
    var desenha = function (cat) {
      itens.innerHTML = '';
      (CAT[cat] || []).forEach(function (it, i) {
        var a = d.createElement('article'); a.className = 'item'; a.style.setProperty('--i', i); a.style.setProperty('--c', it[4]);
        var ic = d.createElement('i'); ic.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + ICO[it[3]] + '"/></svg>'; a.appendChild(ic);
        var tx = d.createElement('div'); var b = d.createElement('b'); b.textContent = it[0]; var s = d.createElement('small'); s.textContent = it[1]; var e = d.createElement('em'); e.textContent = 'R$ ' + it[2]; tx.appendChild(b); tx.appendChild(s); tx.appendChild(e); a.appendChild(tx);
        var bt = d.createElement('button'); bt.type = 'button'; bt.className = 'add'; bt.textContent = '+'; bt.setAttribute('aria-label', 'Adicionar ' + it[0] + ' ao pedido (demonstração)');
        bt.addEventListener('click', function () {
          qtd++; total += parseFloat(it[2].replace(',', '.'));
          nEl.textContent = qtd; tEl.textContent = brl(total); car.classList.add('on');
          nEl.classList.remove('pulo'); bt.classList.remove('pulo'); void nEl.offsetWidth; nEl.classList.add('pulo'); bt.classList.add('pulo');
          setTimeout(function () { bt.classList.remove('pulo'); nEl.classList.remove('pulo'); }, 350);
        });
        a.appendChild(bt); itens.appendChild(a);
      });
    };
    desenha('pizzas');
    $$('.chip').forEach(function (c) {
      c.addEventListener('click', function () {
        if (c.getAttribute('aria-pressed') === 'true') return;
        $$('.chip').forEach(function (x) { x.setAttribute('aria-pressed', x === c ? 'true' : 'false'); });
        c.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduz ? 'auto' : 'smooth' });
        troca(function () { desenha(c.getAttribute('data-cat')); });
      });
    });
    car.addEventListener('click', function () { qtd = 0; total = 0; car.classList.remove('on'); nEl.textContent = '0'; tEl.textContent = brl(0); });
  }

  // ---- demonstração da agenda (fictícia) ----
  var dias = $('#dias'), horas = $('#horas');
  if (dias && horas) {
    var NOMES = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'], hoje = new Date(), diaSel = null, horaSel = null;
    var conf = $('#confirma'), confT = $('#confirma-t');
    var HORAS = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
    var atualiza = function () {
      if (diaSel == null || !horaSel) { conf.classList.remove('on'); return; }
      var dt = new Date(hoje); dt.setDate(hoje.getDate() + diaSel);
      confT.textContent = NOMES[dt.getDay()] + ' ' + dt.getDate() + '/' + (dt.getMonth() + 1) + ' às ' + horaSel;
      conf.classList.add('on');
    };
    var desenhaHoras = function () {
      horas.innerHTML = ''; horaSel = null;
      HORAS.forEach(function (h, i) {
        var b = d.createElement('button'); b.type = 'button'; b.className = 'hora'; b.textContent = h; b.style.setProperty('--i', i); b.setAttribute('aria-pressed', 'false');
        // ocupado de mentira: varia com o dia, para a demonstração parecer viva (determinístico, sem sorteio)
        if ((i + diaSel) % 4 === 1) { b.disabled = true; b.setAttribute('aria-label', h + ', ocupado'); }
        b.addEventListener('click', function () { $$('.hora', horas).forEach(function (x) { x.setAttribute('aria-pressed', 'false'); }); b.setAttribute('aria-pressed', 'true'); horaSel = h; atualiza(); });
        horas.appendChild(b);
      });
      atualiza();
    };
    for (var i = 0; i < 7; i++) (function (i) {
      var dt = new Date(hoje); dt.setDate(hoje.getDate() + i);
      var b = d.createElement('button'); b.type = 'button'; b.className = 'dia'; b.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
      b.innerHTML = '<b></b>'; b.querySelector('b').textContent = dt.getDate(); b.appendChild(d.createTextNode(i === 0 ? 'hoje' : NOMES[dt.getDay()]));
      b.addEventListener('click', function () { $$('.dia', dias).forEach(function (x) { x.setAttribute('aria-pressed', 'false'); }); b.setAttribute('aria-pressed', 'true'); diaSel = i; troca(desenhaHoras); });
      dias.appendChild(b);
    })(i);
    diaSel = 0; desenhaHoras();
    $('#confirma-b').addEventListener('click', function () { confT.textContent = 'enviado (demonstração)'; });
  }

  // ---- portfólio: índice revela a imagem; filtro com View Transition ----
  var lista = $('#port-lista');
  if (lista) {
    var vis = $$('.port-vis img'), cap = $('#port-cap');
    var mostra = function (a) {
      var id = a.getAttribute('data-img');
      vis.forEach(function (im) { im.classList.toggle('on', im.getAttribute('data-img') === id); });
      if (cap) cap.textContent = $('b', a).textContent;
      $$('.trab', lista).forEach(function (x) { x.classList.toggle('ativo', x === a); });
    };
    $$('.trab', lista).forEach(function (a) { a.addEventListener('mouseenter', function () { mostra(a); }); a.addEventListener('focus', function () { mostra(a); }); });
    $$('.filtro').forEach(function (f) {
      f.addEventListener('click', function () {
        var alvo = f.getAttribute('data-f');
        $$('.filtro').forEach(function (x) { x.setAttribute('aria-pressed', x === f ? 'true' : 'false'); });
        troca(function () {
          var primeiro = null;
          $$('.trab', lista).forEach(function (a) { var ok = alvo === 'todos' || a.getAttribute('data-f') === alvo; a.hidden = !ok; if (ok && !primeiro) primeiro = a; });
          if (primeiro) mostra(primeiro);
        });
      });
    });
  }

  // ---- transição entre páginas: o cartão clicado "vira" a imagem grande da página do trabalho ----
  w.addEventListener('pageswap', function (e) {
    if (!e.viewTransition || !lista) return;
    var url = e.activation && e.activation.entry && e.activation.entry.url || '';
    var m = /trabalho-v9\.html\?p=([a-z]+)/.exec(url);
    if (!m) return;
    // no celular a imagem grande está escondida: quem viaja é a miniatura da lista
    var cel = !w.matchMedia('(min-width: 900px)').matches;
    vis.forEach(function (im) { im.style.viewTransitionName = (!cel && im.getAttribute('data-img') === m[1]) ? 'trab-' + m[1] : 'none'; });
    if (cel) { var mini = $('.trab[data-img="' + m[1] + '"] .trab-img'); if (mini) mini.style.viewTransitionName = 'trab-' + m[1]; }
  });
  // ---- como funciona v9: índice numerado gigante grudado ----
  var ng = $('.indice-fixo .ng span'), nt = $('.indice-fixo .nt'), nd = $('.indice-fixo .nd'), passos = $$('.passo9');
  if (passos.length && 'IntersectionObserver' in w) {
    var atual = -1, trocando = 0;
    var poe = function (i) {
      if (i === atual) return; atual = i; var p = passos[i];
      passos.forEach(function (x, k) { x.classList.toggle('on', k === i); });
      if (!ng) return;
      var num = ('0' + (i + 1)).slice(-2), tit = $('b', p).textContent, desc = $('span', p).textContent;
      if (reduz) { ng.textContent = num; nt.textContent = tit; nd.textContent = desc; return; }
      clearTimeout(trocando); ng.classList.add('sai');
      trocando = setTimeout(function () { ng.textContent = num; nt.textContent = tit; nd.textContent = desc; ng.classList.remove('sai'); ng.classList.add('entra'); void ng.offsetWidth; ng.classList.remove('entra'); }, 200);
    };
    var iop = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) poe(passos.indexOf(e.target)); }); }, { rootMargin: '-38% 0px -48% 0px' });
    passos.forEach(function (p) { iop.observe(p); });
    poe(0);
  }
})();
