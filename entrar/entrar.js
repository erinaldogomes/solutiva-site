/* ClickGo · /entrar: WhatsApp ou e-mail -> código de 6 números -> sala do site (/acompanhar/#id.chave).
   A API responde igual exista ou não o contato; o código vale 10 min e é de uso único. Turnstile só quando a API manda a
   site key em /config. Sem script inline (CSP). */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var contato = '';
  var cf = { chave: '', token: '', id: null };

  function msg(el, t, erro) { el.textContent = t || ''; el.className = 'cn-msg' + (erro ? ' erro' : ''); }
  function treme(el) { el.classList.remove('en-treme'); void el.offsetWidth; el.classList.add('en-treme'); }
  function valido(t) { t = String(t || '').trim(); return /@/.test(t) ? /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(t) : t.replace(/\D/g, '').length >= 10; }
  function passo(n) { [1, 2, 3].forEach(function (i) { $('passo-' + i).hidden = i !== n; }); }

  function cfDesenhar() {
    if (!cf.chave || cf.id !== null || !window.turnstile) return;
    var onde = $('cg-turnstile'); onde.hidden = false;
    cf.id = window.turnstile.render(onde, { sitekey: cf.chave, language: 'pt-br', appearance: 'interaction-only', theme: 'light',
      callback: function (t) { cf.token = t; }, 'expired-callback': function () { cf.token = ''; }, 'error-callback': function () { cf.token = ''; } });
  }
  function cfRenovar() { cf.token = ''; try { if (window.turnstile && cf.id !== null) window.turnstile.reset(cf.id); } catch (e) { /* */ } }
  CG.chamar('/config').then(function (c) {
    var k = c && c.turnstileSiteKey;
    if (!k || !/^[\w-]{10,100}$/.test(k)) return;
    cf.chave = k;
    window.cgTurnstilePronto = cfDesenhar;
    var s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=cgTurnstilePronto';
    s.async = true; s.defer = true; document.head.appendChild(s);
  }).catch(function () { /* sem config: sem widget */ });

  $('f-contato').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var t = $('contato').value.trim(), b = $('b-codigo');
    if (!valido(t)) { msg($('m-contato'), 'Digite o seu WhatsApp com DDD ou o seu e-mail.', true); treme($('contato')); return; }
    b.disabled = true; msg($('m-contato'), 'Enviando…');
    CG.chamar('/entrar/codigo', { metodo: 'POST', corpo: { contato: t, turnstile: cf.token || undefined } }).then(function (r) {
      contato = t; msg($('m-contato'), '');
      $('enviado-para').textContent = (r && r.msg) || 'Se esse contato tiver um pedido com a gente, o código chega em instantes. Ele vale 10 minutos.';
      passo(2); $('codigo').value = ''; $('codigo').focus();
    }).catch(function (e) { msg($('m-contato'), e.message, true); }).finally(function () { b.disabled = false; cfRenovar(); });
  });

  $('codigo').addEventListener('input', function () { this.value = this.value.replace(/\D/g, '').slice(0, 6); if (this.value.length === 6) $('f-codigo').requestSubmit(); });
  $('f-codigo').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var c = $('codigo').value.replace(/\D/g, ''), b = $('b-entrar');
    if (c.length !== 6) { msg($('m-codigo'), 'O código tem 6 números.', true); treme($('codigo')); return; }
    if (b.disabled) return;
    b.disabled = true; msg($('m-codigo'), 'Conferindo…');
    CG.chamar('/entrar/confirmar', { metodo: 'POST', corpo: { contato: contato, codigo: c } }).then(function (r) {
      var l = ((r && r.pedidos) || []).filter(function (p) { return /^[A-Za-z0-9_-]{4,40}$/.test(p.id) && /^[A-Za-z0-9_-]{8,80}$/.test(p.k); });
      if (!l.length) throw new Error('Código inválido ou vencido. Confira ou peça um novo.');
      // guarda neste aparelho (a página do pedido abre sozinha da próxima vez)
      try {
        var g = JSON.parse(localStorage.getItem('cg_pedidos') || '[]').filter(function (x) { return !l.some(function (p) { return p.id === x.id; }); });
        localStorage.setItem('cg_pedidos', JSON.stringify(l.map(function (p) { return { id: p.id, k: p.k, negocio: p.negocio || '', em: Date.now() }; }).concat(g).slice(0, 5)));
      } catch (e) { /* sem armazenamento: vai pelo endereço */ }
      var link = function (p) { return '/acompanhar/#' + encodeURIComponent(p.id) + '.' + encodeURIComponent(p.k); };
      if (l.length === 1) { msg($('m-codigo'), 'Abrindo a sala do seu site…'); location.replace(link(l[0])); return; }
      var ul = $('lista'); ul.innerHTML = '';
      l.forEach(function (p) {
        var li = document.createElement('li'), a = document.createElement('a'), nb = document.createElement('b'), sm = document.createElement('small');
        a.href = link(p); nb.textContent = p.negocio || 'Seu pedido'; sm.textContent = p.situacaoTexto || '';
        a.appendChild(nb); a.appendChild(sm); li.appendChild(a); ul.appendChild(li);
      });
      passo(3);
    }).catch(function (e) { msg($('m-codigo'), e.message, true); treme($('codigo')); b.disabled = false; });
  });
  $('b-outro').onclick = function () { passo(1); msg($('m-codigo'), ''); $('b-entrar').disabled = false; $('contato').focus(); };
})();
