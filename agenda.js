/* ClickGo: AGENDA PRÓPRIA da sala do projeto (21/10/2026), sem Google API e sem OAuth.
   info.agenda (lista branca da nuvem) = { dur, manha:[ini,fim], tarde:[ini,fim], dias:[{ d:'AAAA-MM-DD', r:'qua 22/10', l:['14:00',...] }],
   marcado: { inicio:'AAAA-MM-DDTHH:MM', rotulo, sala } | null }. Só chega depois do pagamento (ou com a agenda liberada pelo dono).
   Grade dos próximos dias úteis: manhã sempre "Ocupado" (cinza), tarde em blocos (livre = botão; tomado/bloqueado = "Ocupado").
   Escolher -> confirmar -> mandar('', { tipo:'agenda', horario }); cancelar -> { tipo:'agenda', cancelar:true }. Horário de Brasília em
   texto (nunca convertido pelo fuso do aparelho). andamento.js chama CGAgenda.desenhar(r, api) a cada atualização. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var HORA = /^\d{2}:\d{2}$/, DIA = /^\d{4}-\d{2}-\d{2}$/, SALA = /^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/;
  var SEM = { dom: 'domingo', seg: 'segunda', ter: 'terça', qua: 'quarta', qui: 'quinta', sex: 'sexta', 'sáb': 'sábado' };
  var dia = '', escolhido = '', trocando = false, enviando = false, assinatura = '', api = null;

  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function min(h) { return Number(h.slice(0, 2)) * 60 + Number(h.slice(3, 5)); }
  function hh(m) { return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); }
  function rotH(h) { return Number(h.slice(0, 2)) + 'h' + (h.slice(3, 5) === '00' ? '' : h.slice(3, 5)); }
  function rotDia(d) { var p = String(d.r || '').split(' '); return (SEM[p[0]] || p[0] || '') + ', ' + (p[1] || ''); }
  function limpa(a) {
    if (!a || typeof a !== 'object' || !Array.isArray(a.dias)) return null;
    var dur = Number(a.dur); if (!(dur >= 15 && dur <= 120)) dur = 30;
    var faixa = function (f, p) { return Array.isArray(f) && HORA.test(f[0]) && HORA.test(f[1]) ? f : p; };
    var dias = a.dias.filter(function (x) { return x && DIA.test(x.d); }).slice(0, 10).map(function (x) {
      return { d: x.d, r: String(x.r || '').slice(0, 20), l: (Array.isArray(x.l) ? x.l : []).filter(function (h) { return HORA.test(h); }) };
    });
    var m = a.marcado && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(a.marcado.inicio) ? { inicio: a.marcado.inicio, rotulo: String(a.marcado.rotulo || '').slice(0, 60), sala: SALA.test(a.marcado.sala || '') ? a.marcado.sala : '' } : null;
    return dias.length ? { dur: dur, manha: faixa(a.manha, ['08:00', '12:00']), tarde: faixa(a.tarde, ['14:00', '18:00']), dias: dias, marcado: m } : null;
  }

  function mandar(extra, ok) {
    if (enviando || !api || !api.mandar) return;
    enviando = true; desenharJa();
    api.mandar('', extra).then(function () { escolhido = ''; trocando = false; if (ok && api.toast) api.toast(ok); })
      .catch(function () {}).finally(function () { enviando = false; assinatura = ''; desenharJa(); });
  }

  var ultimo = null;
  function desenharJa() { if (ultimo) montar(ultimo); }

  function montar(a) {
    var box = $('agenda'); if (!box) return;
    box.innerHTML = '';
    var cab = el('div', 'cg-ag-cab');
    cab.appendChild(el('b', '', a.marcado && !trocando ? 'Sua conversa com a nossa equipe' : 'Agende uma conversa com a nossa equipe'));
    cab.appendChild(el('span', '', 'Por vídeo, no horário de Brasília.'));
    box.appendChild(cab);

    if (a.marcado && !trocando) {
      var c = el('div', 'cg-ag-marcado');
      c.appendChild(el('b', '', a.marcado.rotulo || a.marcado.inicio.replace('T', ' ')));
      if (a.marcado.sala) {
        var s = el('a', 'cg-btn cg-btn-prim', 'Entrar na sala'); s.href = a.marcado.sala; s.target = '_blank'; s.rel = 'noopener'; c.appendChild(s);
        c.appendChild(el('small', '', 'O link abre o Google Meet. Lembramos você 1 hora antes, por aqui e por e-mail.'));
      } else c.appendChild(el('small', '', 'Enviaremos o link da sala por aqui. Lembramos você 1 hora antes.'));
      var acoes = el('div', 'cg-ag-acoes');
      var outro = el('button', 'cg-btn cg-btn-linha', 'Escolher outro horário'); outro.type = 'button'; outro.disabled = enviando;
      outro.onclick = function () { trocando = true; escolhido = ''; desenharJa(); };
      var canc = el('button', 'cg-ag-cancelar', enviando ? 'Enviando…' : 'Cancelar a conversa'); canc.type = 'button'; canc.disabled = enviando;
      canc.onclick = function () { if (confirm('Cancelar a conversa de ' + (a.marcado.rotulo || '') + '?')) mandar({ tipo: 'agenda', cancelar: true }, 'Conversa cancelada.'); };
      acoes.appendChild(outro); acoes.appendChild(canc); c.appendChild(acoes);
      box.appendChild(c);
      return;
    }

    if (!a.dias.some(function (x) { return x.d === dia; })) dia = (a.dias.filter(function (x) { return x.l.length; })[0] || a.dias[0]).d;
    var abas = el('div', 'cg-ag-dias'); abas.setAttribute('role', 'tablist'); abas.setAttribute('aria-label', 'Dias');
    a.dias.forEach(function (x) {
      var b = el('button', 'cg-ag-dia' + (x.l.length ? '' : ' cheio')); b.type = 'button'; b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', String(x.d === dia));
      var p = x.r.split(' '); b.appendChild(el('small', '', p[0] || '')); b.appendChild(el('b', '', p[1] || x.d.slice(8)));
      b.onclick = function () { dia = x.d; escolhido = ''; desenharJa(); };
      abas.appendChild(b);
    });
    box.appendChild(abas);

    var d = a.dias.filter(function (x) { return x.d === dia; })[0];
    var grade = el('div', 'cg-ag-grade');
    var manha = el('div', 'cg-ag-hora ocupado');
    manha.appendChild(el('span', '', 'Manhã · ' + rotH(a.manha[0]) + ' às ' + rotH(a.manha[1]))); manha.appendChild(el('i', '', 'Ocupado'));
    grade.appendChild(manha);
    for (var m = min(a.tarde[0]); m + a.dur <= min(a.tarde[1]); m += a.dur) {
      (function (h) {
        var livre = d.l.indexOf(h) >= 0, valor = d.d + 'T' + h;
        if (!livre) { var o = el('div', 'cg-ag-hora ocupado'); o.appendChild(el('span', '', rotH(h))); o.appendChild(el('i', '', 'Ocupado')); grade.appendChild(o); return; }
        var b = el('button', 'cg-ag-hora livre' + (escolhido === valor ? ' escolhido' : '')); b.type = 'button'; b.setAttribute('aria-pressed', String(escolhido === valor));
        b.appendChild(el('span', '', rotH(h))); b.appendChild(el('i', '', escolhido === valor ? 'Escolhido' : 'Livre'));
        b.onclick = function () { escolhido = escolhido === valor ? '' : valor; desenharJa(); };
        grade.appendChild(b);
      })(hh(m));
    }
    box.appendChild(grade);
    if (!d.l.length) box.appendChild(el('p', 'cg-ag-nota', 'Este dia está todo ocupado. Escolha outro dia acima.'));

    var conf = el('div', 'cg-ag-conf');
    if (escolhido) {
      conf.appendChild(el('b', '', 'Confirmar: ' + rotDia(d) + ', às ' + rotH(escolhido.slice(11)) + '?'));
      var sim = el('button', 'cg-btn cg-btn-prim', enviando ? 'Enviando…' : 'Confirmar conversa'); sim.type = 'button'; sim.disabled = enviando;
      sim.onclick = function () { mandar({ tipo: 'agenda', horario: escolhido }, 'Pedido enviado! A confirmação aparece aqui.'); };
      conf.appendChild(sim);
    }
    if (trocando) { var volta = el('button', 'cg-ag-cancelar', 'Manter o horário marcado'); volta.type = 'button'; volta.onclick = function () { trocando = false; escolhido = ''; desenharJa(); }; conf.appendChild(volta); }
    if (conf.childNodes.length) box.appendChild(conf);
  }

  window.CGAgenda = {
    desenhar: function (r, a) {
      api = a || api;
      var box = $('agenda'); if (!box) return;
      var i = (r && r.info) || {};
      var ag = i.projeto && !i.cancelado ? limpa(i.agenda) : null;
      box.hidden = !ag;
      if (!ag) { ultimo = null; assinatura = ''; return; }
      var s = JSON.stringify(ag);
      if (s === assinatura && box.childNodes.length) return; // nada mudou: não redesenha (não perde a escolha)
      assinatura = s; ultimo = ag;
      if (escolhido && !ag.dias.some(function (x) { return x.l.indexOf(escolhido.slice(11)) >= 0 && x.d === escolhido.slice(0, 10); })) escolhido = '';
      montar(ag);
    }
  };
})();
