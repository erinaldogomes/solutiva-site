/* ClickGo · página do pedido / sala do site (dono 24/10/2026):
   1) "Guarde este link" forte (link real, Copiar, favoritos, clickgo.dev.br/entrar);
   2) tela de mudança com 3 botões (fotos / texto ou preço / item), até 6 fotos, tipo "mudanca" + acao;
   3) VITRINE de extras com o site no ar (CGVitrine; "Quero" -> descreve -> tipo "extra"; o pagamento aparece no quadro do Pix);
   4) ANTES do Pix: extras opcionais em caixinhas, inclusive SEO, logo animado e premium (tipo "extras"; o total cobrado vem do app, no campo sinalPrevisto, que desde 05/11/2026 é o valor inteiro).
   Preço SEMPRE do catálogo que o app mandou (r.sala.vitrine / r.extras.catalogo); nada de número escrito aqui.
   acompanhar.js chama window.CGSalaExtras.desenhar(estado, { mandar, toast, copiar }) a cada atualização. Sem script inline. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  // exemplos do Vídeo Cinematográfico (Cloudflare Pages clickgo-midia, pasta vitrine/): sem som, em loop, com pôster
  var MIDIA = 'https://clickgo-midia.pages.dev/vitrine/';
  var VIDEOS = [1, 2, 3].map(function (n) { return { src: MIDIA + 'exemplo-video-' + n + '.mp4', poster: MIDIA + 'exemplo-video-' + n + '.jpg' }; });
  var api = null, est = null;
  var mont = { sala: null, salaAss: '', pre: null, preAss: '' };
  var modo = '', fotosM = [], fotosX = [], querendo = '';

  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function brl(v) { return window.CGVitrine ? window.CGVitrine.preco(Number(v) || 0) : 'R$ ' + (Number(v) || 0).toLocaleString('pt-BR'); }
  function data(iso) { try { return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }); } catch (e) { return ''; } }
  function fotosDe(input, lista, max, onde) {
    var fs = Array.prototype.slice.call(input.files || [], 0, Math.max(0, max - lista.length)); input.value = '';
    // várias fotos: lado menor, e o total fica abaixo do limite de envio da nuvem (3 MB por mensagem)
    return Promise.all(fs.map(function (f) { return CG.comprimir(f, max > 1 ? 1024 : 1280).catch(function () { return null; }); })).then(function (us) {
      var LIM = 2600000, soma = lista.reduce(function (t, u) { return t + u.length; }, 0), cortou = false;
      us.forEach(function (u) { if (!u) return; if (soma + u.length > LIM) { cortou = true; return; } soma += u.length; lista.push(u); });
      if (cortou && api) api.toast('Fotos pesadas demais para uma vez só: mande as outras numa segunda mensagem.');
      onde.innerHTML = ''; lista.forEach(function (u) { var im = document.createElement('img'); im.src = u; im.alt = ''; onde.appendChild(im); });
    });
  }
  function depois(ancora, no) { if (ancora && ancora.parentNode && no.previousElementSibling !== ancora) ancora.parentNode.insertBefore(no, ancora.nextSibling); }

  /* ---------- 1) guarde este link ---------- */
  function guarde(r) {
    var i = r.info || {}, noAr = !!i.publicado;
    var b = $('cge-guarde');
    if (!b) {
      b = el('section', 'cge-guarde'); b.id = 'cge-guarde'; b.setAttribute('aria-label', 'Guarde o link da sua página');
      b.innerHTML = '<div class="cge-g-icone" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M6 3h12v18l-6-4-6 4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg></div>' +
        '<div class="cge-g-corpo"><p class="cge-g-t"></p><p class="cge-g-url"></p>' +
        '<p class="cge-g-dica">Salve nos favoritos: no celular, toque em <b>⋮</b> e na <b>estrela</b> (Android) ou em <b>Compartilhar → Adicionar à Tela de Início</b> (iPhone).</p>' +
        '<p class="cge-g-entrar">Perdeu o link? Entre por <a href="/entrar/">clickgo.dev.br/entrar</a> com o seu WhatsApp ou e-mail.</p></div>' +
        '<button type="button" class="cg-btn cg-btn-prim cge-g-copiar">Copiar link</button>';
      b.querySelector('.cge-g-copiar').onclick = function () {
        var bt = this;
        api.copiar(location.href).then(function () { bt.textContent = 'Link copiado!'; bt.classList.add('ok'); api.toast('Link copiado! Guarde nos favoritos ou mande para você mesmo.'); setTimeout(function () { bt.textContent = 'Copiar link'; bt.classList.remove('ok'); }, 2600); })
          .catch(function () { if (navigator.share) navigator.share({ title: 'Minha página na ClickGo', url: location.href }).catch(function () {}); else window.prompt('Copie o seu link:', location.href); });
      };
      var tudo = $('tudo'); var ancora = $('sala') || null;
      if (ancora && ancora.parentNode) ancora.parentNode.insertBefore(b, ancora); else if (tudo) tudo.insertBefore(b, tudo.firstChild);
    }
    b.hidden = !!(i.cancelado || r.situacao === 'cancelado');
    b.classList.toggle('na-sala', noAr);
    b.querySelector('.cge-g-t').textContent = noAr ? 'Guarde este link: é a sala do seu site' : 'Guarde este link: é a página do seu pedido';
    b.querySelector('.cge-g-url').textContent = location.host + location.pathname;
    var velho = $('sala-guarde'); if (velho) velho.hidden = true;
  }

  /* ---------- 2) tela de mudança ---------- */
  var MODOS = {
    fotos: { rot: 'Trocar/adicionar fotos', emoji: '📷', ph: 'Onde colocar? (opcional: se não disser, a gente coloca onde ficar melhor)', foto: 6 },
    texto: { rot: 'Mudar texto ou preço', emoji: '✏️', ph: 'Ex.: trocar o preço da pizza calabresa para R$ 45', foto: 1 },
    item: { rot: 'Adicionar item', emoji: '➕', ph: '', foto: 1 }
  };
  function telaMudanca(r) {
    var cartao = $('sala-mudar'), form = $('sala-form');
    if (!cartao || !form) return;
    var s = r.sala || {};
    var box = $('cge-mudar');
    if (!box) {
      box = el('div', 'cge-mudar'); box.id = 'cge-mudar';
      var bts = el('div', 'cge-m-botoes'); bts.setAttribute('role', 'group'); bts.setAttribute('aria-label', 'O que você quer mudar');
      Object.keys(MODOS).forEach(function (k) {
        var b = el('button', 'cge-m-bt'); b.type = 'button'; b.dataset.modo = k;
        b.innerHTML = '<span class="cge-m-emo" aria-hidden="true"></span><span class="cge-m-rot"></span>';
        b.querySelector('.cge-m-emo').textContent = MODOS[k].emoji; b.querySelector('.cge-m-rot').textContent = MODOS[k].rot;
        b.onclick = function () { abrirModo(modo === k ? '' : k); };
        bts.appendChild(b);
      });
      var f = el('form', 'cge-m-form cg-sala-form'); f.id = 'cge-m-form'; f.hidden = true; f.noValidate = true;
      f.innerHTML = '<div class="cge-m-item" hidden><input id="cge-i-nome" maxlength="80" placeholder="Nome do item (ex.: Pizza de frango com catupiry)" aria-label="Nome do item">' +
        '<input id="cge-i-preco" maxlength="20" inputmode="decimal" placeholder="Preço (opcional, ex.: 49,90)" aria-label="Preço"></div>' +
        '<textarea id="cge-m-texto" rows="3" maxlength="600" aria-label="Detalhes"></textarea>' +
        '<div class="cg-anexos-prev" id="cge-m-fotos"></div>' +
        '<div class="cg-sala-acoes"><label class="cg-btn cg-btn-linha" id="cge-m-foto-l">Escolher fotos<input type="file" accept="image/*" multiple hidden id="cge-m-foto"></label>' +
        '<button class="cg-btn cg-btn-prim" id="cge-m-enviar" type="submit">Pedir mudança</button></div>' +
        '<button type="button" class="cge-voltar" id="cge-m-voltar">Voltar</button>';
      box.appendChild(bts); box.appendChild(f);
      form.parentNode.insertBefore(box, form);
      $('cge-m-foto').addEventListener('change', function () { fotosDe(this, fotosM, (MODOS[modo] || {}).foto || 1, $('cge-m-fotos')); });
      $('cge-m-voltar').onclick = function () { abrirModo(''); };
      f.addEventListener('submit', function (ev) {
        ev.preventDefault();
        var t = $('cge-m-texto').value.trim();
        if (modo === 'item') {
          var nome = $('cge-i-nome').value.trim(), pr = $('cge-i-preco').value.trim();
          if (!nome) { api.toast('Escreva o nome do item.'); $('cge-i-nome').focus(); return; }
          t = 'Item novo: ' + nome + (pr ? ' · preço: ' + pr : '') + (t ? ' · ' + t : '');
        }
        if (modo === 'fotos' && !fotosM.length) { api.toast('Escolha as fotos (até 6).'); return; }
        if (modo === 'texto' && !t) { api.toast('Escreva o que você quer mudar.'); $('cge-m-texto').focus(); return; }
        var b = $('cge-m-enviar'); b.disabled = true;
        api.mandar(t, { tipo: 'mudanca', acao: modo, fotos: fotosM.slice() }).then(function () {
          api.toast('Pedido enviado! Acompanhe aqui e na conversa.'); abrirModo('');
        }).catch(function () {}).finally(function () { b.disabled = false; });
      });
    }
    var cheio = s.total && s.restam <= 0;
    Array.prototype.forEach.call(box.querySelectorAll('.cge-m-bt'), function (b) { b.disabled = !!(s.aplicando || cheio); b.setAttribute('aria-pressed', String(b.dataset.modo === modo)); });
    box.hidden = s.ligada === false;
  }
  function abrirModo(k) {
    modo = k; fotosM = []; $('cge-m-fotos').innerHTML = ''; $('cge-m-texto').value = ''; $('cge-i-nome').value = ''; $('cge-i-preco').value = '';
    var m = MODOS[k];
    $('cge-m-form').hidden = !m; $('sala-form').hidden = !!m;
    Array.prototype.forEach.call(document.querySelectorAll('.cge-m-bt'), function (b) { b.setAttribute('aria-pressed', String(b.dataset.modo === k)); });
    if (!m) return;
    document.querySelector('.cge-m-item').hidden = k !== 'item';
    $('cge-m-texto').placeholder = k === 'item' ? 'Descrição (opcional)' : m.ph;
    $('cge-m-foto-l').firstChild.textContent = k === 'fotos' ? 'Escolher fotos (até 6)' : 'Anexar foto';
    $('cge-m-enviar').textContent = k === 'fotos' ? 'Enviar as fotos' : k === 'item' ? 'Adicionar o item' : 'Pedir mudança';
    (k === 'item' ? $('cge-i-nome') : k === 'fotos' ? $('cge-m-foto-l') : $('cge-m-texto')).focus();
  }

  /* ---------- 3) vitrine com o site no ar ---------- */
  function painelQuero(caixa, cat, aoMandar, txtBotao) {
    var p = caixa.querySelector('.cge-quero');
    if (!p) {
      p = el('form', 'cge-quero cg-sala-form'); p.noValidate = true; p.hidden = true;
      p.innerHTML = '<p class="cge-q-t"></p><label class="cge-q-qtd" hidden>Quantas seções? <select><option>1</option><option>2</option><option>3</option><option>4</option><option>5</option></select></label>' +
        '<textarea rows="3" maxlength="600" placeholder="Conte rapidinho o que você quer (ex.: a pizza girando no topo, nas cores do site)" aria-label="O que você quer"></textarea>' +
        '<div class="cg-anexos-prev"></div>' +
        '<div class="cg-sala-acoes"><label class="cg-btn cg-btn-linha">Anexar fotos<input type="file" accept="image/*" multiple hidden></label><button class="cg-btn cg-btn-prim" type="submit"></button></div>' +
        '<p class="cge-q-nota">Prefere falar? Mande um áudio na conversa contando a ideia.</p><button type="button" class="cge-voltar">Agora não</button>';
      caixa.appendChild(p);
      p.querySelector('input[type=file]').addEventListener('change', function () { fotosDe(this, fotosX, 6, p.querySelector('.cg-anexos-prev')); });
      p.querySelector('.cge-voltar').onclick = function () { p.hidden = true; querendo = ''; };
      p.querySelector('select').onchange = function () { atual(); };
      p.addEventListener('submit', function (ev) {
        ev.preventDefault();
        var b = p.querySelector('button[type=submit]'); b.disabled = true;
        aoMandar(querendo, p.querySelector('textarea').value.trim(), Number(p.querySelector('select').value) || 1, fotosX.slice())
          .then(function () { p.hidden = true; querendo = ''; }).catch(function () {}).finally(function () { b.disabled = false; });
      });
    }
    function atual() {
      var it = cat.filter(function (x) { return x.id === querendo; })[0]; if (!it) return;
      var q = it.unidade === 'secao' ? Number(p.querySelector('select').value) || 1 : 1;
      p.querySelector('.cge-q-t').textContent = it.nome + ' · ' + brl(it.valor * q) + (it.prazo ? ' · ' + it.prazo : '');
      p.querySelector('.cge-q-qtd').hidden = it.unidade !== 'secao';
      p.querySelector('button[type=submit]').textContent = txtBotao;
    }
    return { abrir: function (id) { querendo = id; fotosX = []; p.querySelector('.cg-anexos-prev').innerHTML = ''; p.querySelector('textarea').value = ''; p.querySelector('select').value = '1'; atual(); p.hidden = false; p.querySelector('textarea').focus(); p.scrollIntoView({ behavior: 'smooth', block: 'center' }); } };
  }
  function vitrineSala(r) {
    var s = r.sala || {}, i = r.info || {};
    var cat = Array.isArray(s.vitrine) ? s.vitrine : [];
    var sec = $('cge-vitrine');
    if (!cat.length || !window.CGVitrine || s.ligada === false) { if (sec) sec.hidden = true; return; }
    if (!sec) {
      sec = el('section', 'cge-vitrine'); sec.id = 'cge-vitrine'; sec.setAttribute('aria-labelledby', 'cge-v-t');
      sec.innerHTML = '<h2 id="cge-v-t">Deixe seu site ainda mais especial</h2><p class="cg-sub">Pagamento único, direto aqui. A gente faz e te avisa quando estiver no ar.</p>' +
        '<p class="cge-aberto" hidden></p><div class="cge-meus" hidden></div><div class="cge-v-lista"></div>';
      var grade = document.querySelector('#sala .cg-sala-grade');
      if (grade) depois(grade, sec); else $('sala').appendChild(sec);
    }
    sec.hidden = false;
    var ass = JSON.stringify(cat);
    var pq = painelQuero(sec, cat, function (id, texto, qtd, fotos) {
      var it = cat.filter(function (x) { return x.id === id; })[0] || {};
      return api.mandar(texto || ('Quero o extra: ' + (it.nome || id)), { tipo: 'extra', extra: id, qtd: qtd, fotos: fotos }).then(function () { api.toast('Pedido enviado! O pagamento aparece aqui em instantes.'); });
    }, 'Quero, ir para o pagamento');
    if (mont.salaAss !== ass) {
      if (mont.sala) mont.sala.destruir();
      mont.sala = window.CGVitrine.montar(sec.querySelector('.cge-v-lista'), { catalogo: cat, videos: VIDEOS, aoQuerer: function (id) { pq.abrir(id); } });
      mont.salaAss = ass;
    }
    var ab = sec.querySelector('.cge-aberto'), c = s.compraExtra;
    ab.hidden = !c;
    if (c) { ab.textContent = 'Pagamento em aberto: ' + c.nome + ' (' + brl(c.valor) + '). O Pix e o cartão estão no quadro de pagamento desta página.'; ab.onclick = function () { var px = $('pix'); if (px && !px.hidden) px.scrollIntoView({ behavior: 'smooth' }); }; }
    var meus = sec.querySelector('.cge-meus'); meus.innerHTML = '';
    (s.extrasPagos || []).slice(-5).forEach(function (x) { meus.appendChild(el('span', 'cge-chip', '✓ ' + x.nome + (x.em ? ' · ' + data(x.em) : ''))); });
    (s.videos || []).forEach(function (v) {
      if (v.estado === 'entregue' && /^https:\/\//.test(v.url || '')) { var a = el('a', 'cge-chip', '🎬 Baixar o seu vídeo'); a.href = v.url; a.target = '_blank'; a.rel = 'noopener'; meus.appendChild(a); }
      else meus.appendChild(el('span', 'cge-chip', '🎬 Vídeo em produção' + (v.ate ? ' · fica pronto até ' + data(v.ate) : '')));
    });
    meus.hidden = !meus.children.length;
    void i;
  }

  /* ---------- 4) antes do Pix: extras NA COMPRA, em caixinhas (dono 02/11/2026) ---------- */
  // Todo o catálogo à venda (inclusive SEO mensal, logo animado e site premium), cada um com a sua demo. Marcar/desmarcar manda
  // a lista inteira de ids (tipo "extras"); a nuvem confere os ids e o app recalcula o valor no SERVIDOR. O total daqui é
  // só a conta para mostrar (preços do catálogo que o app mandou); o que vale é o "a pagar ao aprovar" que volta do app.
  var preTimer = null, preIds = null;
  function somaPre(cat, ids, mensal) {
    return Math.round(cat.reduce(function (t, c) { return t + (ids.indexOf(c.id) >= 0 && (mensal ? c.unidade === 'mes' : true) ? Number(c.valor) || 0 : 0); }, 0) * 100) / 100;
  }
  function totalPre(sec, r, cat, ids) {
    var i = r.info || {}, box = sec.querySelector('.cge-pre-total'); box.innerHTML = '';
    var pac = ((r.pacotes || []).filter(function (p) { return p.escolhido; })[0]) || null;
    var ext = somaPre(cat, ids, false), mes = somaPre(cat, ids, true);
    var base = pac ? Number(pac.implantacao) || 0 : 0;
    var linha = function (rot, val, cls) { var d = el('p', 'cge-pt-l' + (cls ? ' ' + cls : '')); d.appendChild(el('span', '', rot)); d.appendChild(el('b', '', val)); box.appendChild(d); };
    if (pac && base) linha('Seu pacote (' + pac.pacote + ')', brl(base));
    linha(ids.length ? 'Extras marcados (' + ids.length + ')' : 'Extras marcados', ids.length ? '+ ' + brl(ext) : brl(0));
    if (pac && base) linha('Total previsto', brl(base + ext), 'cge-pt-forte');
    if (mes > 0 || (pac && Number(pac.mensalidade) > 0)) linha('Por mês, depois que o site for ao ar', brl((pac ? Number(pac.mensalidade) || 0 : 0) + mes) + (mes > 0 ? ' (com o SEO)' : ''));
    if (i.sinalPrevisto) linha('A pagar ao aprovar', brl(i.sinalPrevisto), 'cge-pt-sinal');
    box.appendChild(el('p', 'cge-pt-nota', mes > 0 ? 'O 1º mês do SEO já entra no total; depois ele soma na mensalidade.' : 'De uma vez, ao aprovar: Pix ou até 12x no cartão (com os juros do Mercado Pago).'));
  }
  function extrasAntes(r) {
    var x = r.extras || {}, i = r.info || {};
    var cat = (Array.isArray(x.catalogo) ? x.catalogo : []).filter(function (c) { return c && /^[a-z0-9]{2,20}$/.test(String(c.id)) && Number(c.valor) > 0; });
    var sec = $('cge-pre');
    var mostra = !!(x.pode && cat.length && window.CGVitrine && !i.publicado && !i.pixLiberado && !i.projeto && i.versao);
    if (!mostra) { if (sec) sec.hidden = true; return; }
    if (!sec) {
      sec = el('section', 'cge-vitrine cge-pre'); sec.id = 'cge-pre'; sec.setAttribute('aria-labelledby', 'cge-p-t');
      sec.innerHTML = '<h2 id="cge-p-t">Quer somar algum extra? <small>(opcional)</small></h2><p class="cg-sub">Marque o que quiser. Dá para desmarcar até aprovar.</p>' +
        '<div class="cge-v-lista"></div><div class="cge-pre-total" aria-live="polite"></div>';
      var pac = $('pacotes');
      if (pac && pac.parentNode) depois(pac, sec); else $('tudo').appendChild(sec);
    }
    sec.hidden = false;
    var esc = (x.escolhidos || []).filter(function (id) { return cat.some(function (c) { return c.id === id; }); });
    var ass = JSON.stringify(cat);
    if (mont.preAss !== ass) {
      if (mont.pre) mont.pre.destruir();
      mont.pre = window.CGVitrine.montar(sec.querySelector('.cge-v-lista'), { catalogo: cat, videos: VIDEOS, modo: 'caixinha', marcados: esc, aoMarcar: function (id, ligado) {
        var atual = (preIds || ((est && est.extras && est.extras.escolhidos) || [])).filter(function (z) { return z !== id; });
        if (ligado) atual.push(id);
        preIds = atual.slice(0, 6);
        totalPre(sec, est, cat, preIds);
        clearTimeout(preTimer);
        preTimer = setTimeout(function () {
          var lista = preIds;
          api.mandar('', { tipo: 'extras', extras: lista }).then(function () { api.toast(lista.length ? 'Extras anotados! O valor atualiza aqui em instantes.' : 'Extras retirados.'); })
            .catch(function () {}).finally(function () { preIds = null; });
        }, 700);
      } });
      mont.preAss = ass;
    }
    if (!preIds && mont.pre && mont.pre.marcar) mont.pre.marcar(esc);
    totalPre(sec, r, cat, preIds || esc);
  }

  function desenhar(r, fns) {
    api = fns; est = r;
    try { guarde(r); } catch (e) { /* */ }
    var i = r.info || {};
    var naSala = !!(i.publicado || r.situacao === 'publicado') && !i.cancelado;
    if (naSala && r.sala) { try { telaMudanca(r); } catch (e) { /* */ } try { vitrineSala(r); } catch (e) { /* */ } }
    try { extrasAntes(r); } catch (e) { /* */ }
  }
  window.CGSalaExtras = { desenhar: desenhar };
})();
