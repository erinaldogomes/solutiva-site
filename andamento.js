/* ClickGo: ANDAMENTO da página do cliente (21/10/2026).
   Linha do tempo (site/cardápio e sistema), animação de "site sendo construído" (equipe trabalhando), pergunta do robô com
   respostas rápidas (mesmo caminho da conversa), barra fixa da conversa no celular e a agenda própria do sistema (agenda.js).
   Campos novos em info (etapa, etapaN/M, emProducao, naFila, pergunta, agenda); sem eles, deduz das flags antigas.
   Nunca mostra posição nem minutos de fila. acompanhar.js chama CGAndamento.desenhar(estado, api) a cada atualização. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var SITE = [['pedido', 'Pedido'], ['esboco', 'Prévia'], ['sinal', 'Pagamento'], ['montando', 'Colocando no ar'], ['previa_final', 'Prévia final'], ['no_ar', 'No ar']];
  var SIS = [['briefing', 'Briefing'], ['prototipo', 'Protótipo'], ['orcamento', 'Orçamento'], ['sinal', 'Sinal'], ['construcao', 'Em construção'], ['entrega', 'Entrega'], ['no_ar', 'No ar']];
  // texto que não pode aparecer para o cliente (fila numerada, minutos, máquina, "assim que possível", bastidores)
  var PROIBIDO = /posi[cç][aã]o|\d+\s*min\b|minuto|\bPC\b|computador|desligad|assim que poss|claude|\brob[oô]\b|\bIA\b/i;

  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function n(v) { var x = Number(v); return isFinite(x) && x >= 0 ? Math.round(x) : 0; }

  // etapa atual + equipe trabalhando/na fila + frase curta
  function estado(r, aprovadoAqui) {
    var i = (r && r.info) || {}, proj = !!i.projeto, v = (r && r.projeto) || {}, o = v.orcamento || null, s = v.sistema || null;
    var lista = proj ? SIS : SITE, cru = String((r && r.situacaoTexto) || '');
    var etapa = lista.some(function (x) { return x[0] === i.etapa; }) ? i.etapa : '';
    if (!etapa) {
      if (proj) etapa = (s && s.sala) || (o && o.entregue) ? 'no_ar' : (s && s.concluida) || (o && o.fase === 'restante') ? 'entrega' : (s && s.construindo) || (o && o.emProducao) ? 'construcao' : (o && o.fase) ? 'sinal' : o ? 'orcamento' : (v.rodada || v.gerando) ? 'prototipo' : 'briefing';
      else etapa = i.publicado ? 'no_ar' : i.restanteLiberado ? 'previa_final' : i.sinalRecebido ? 'montando' : (i.pixLiberado || aprovadoAqui) ? 'sinal' : i.versao ? 'esboco' : 'pedido';
    }
    var naFila = 'naFila' in i ? !!i.naFila : /\bfila\b/i.test(cru);
    var emProd = 'emProducao' in i ? !!i.emProducao
      : /fazendo|montando|ajustando|aplicando|publicando|gerando|preparando|produ[cç][aã]o/i.test(cru) && !/fila/i.test(cru)
        || (!proj && etapa === 'pedido' && !naFila) || (!proj && etapa === 'montando') || !!v.gerando || etapa === 'construcao';
    if (i.cancelado || r.situacao === 'cancelado') { emProd = false; naFila = false; }
    if (emProd) naFila = false;
    var N = n(i.etapaN), M = n(i.etapaM);
    var F = proj ? {
      briefing: 'Estamos fazendo o briefing do seu negócio',
      prototipo: emProd ? 'Em produção: nossa equipe está montando o protótipo' : naFila ? 'Na fila de produção' : 'Seu protótipo está pronto',
      orcamento: 'Seu orçamento está pronto', sinal: 'Orçamento aprovado: falta só o sinal',
      construcao: 'Em construção' + (N && M ? ': etapa ' + Math.min(N, M) + ' de ' + M : ''),
      entrega: 'Seu sistema está pronto para a entrega', no_ar: 'Seu sistema está no ar'
    } : {
      pedido: naFila ? 'Na fila de produção' : 'Estamos fazendo o briefing do seu negócio',
      esboco: emProd ? (i.versao ? 'Nossa equipe está ajustando a sua prévia' : 'Nossa equipe está montando a sua prévia') : naFila ? 'Na fila de produção' : 'Sua prévia está pronta',
      sinal: 'Prévia aprovada: falta só o pagamento',
      montando: naFila ? 'Na fila de produção' : 'Colocando o seu site no ar',
      previa_final: 'Seu site está pronto para você conferir',
      no_ar: emProd ? 'Em produção: aplicando a sua mudança' : naFila ? 'Seu pedido de mudança está na fila de produção' : 'Seu site está no ar'
    };
    return { etapa: etapa, lista: lista, proj: proj, emProd: emProd, naFila: naFila, N: N, M: M, frase: F[etapa] || '' };
  }
  // título do status: o situacaoTexto do app, a menos que traga algo proibido (aí vale a frase da etapa)
  function limpo(r, an) {
    var t = String((r && r.situacaoTexto) || '').trim();
    return !t || PROIBIDO.test(t) || t === 'Pedido recebido' && an.frase ? an.frase || 'Pedido recebido' : t;
  }

  // ---------- linha do tempo ----------
  var assLinha = '';
  function desenharLinha(r, an) {
    var box = $('andamento'); if (!box) return;
    var i = r.info || {};
    box.hidden = !!(i.cancelado || r.situacao === 'cancelado');
    if (box.hidden) return;
    var idx = 0; an.lista.forEach(function (x, k) { if (x[0] === an.etapa) idx = k; });
    var fim = an.etapa === 'no_ar';
    var ass = JSON.stringify([an.etapa, an.emProd, an.naFila, an.N, an.M, an.proj]);
    if (ass === assLinha) return;
    assLinha = ass;
    var ol = $('linha'); ol.innerHTML = '';
    ol.className = 'cg-linha' + (an.proj ? ' sete' : '');
    an.lista.forEach(function (x, k) {
      var li = el('li', k < idx || (fim && k === idx) ? 'feito' : k === idx ? 'agora' + (an.emProd ? ' ativa' : an.naFila ? ' calma' : '') : '');
      li.appendChild(el('i'));
      var rot = x[1]; if (x[0] === 'construcao' && an.N && an.M) rot += ' (' + Math.min(an.N, an.M) + '/' + an.M + ')';
      li.appendChild(el('span', '', rot));
      if (k === idx) li.setAttribute('aria-current', 'step');
      ol.appendChild(li);
    });
    var ag = $('linha-agora'); ag.innerHTML = '';
    var cons = an.etapa === 'construcao' && an.N && an.M;
    ag.appendChild(el('b', '', fim ? an.lista[idx][1] : cons ? 'Em construção · etapa ' + Math.min(an.N, an.M) + ' de ' + an.M : 'Etapa ' + (idx + 1) + ' de ' + an.lista.length + ' · ' + an.lista[idx][1]));
    if (an.emProd || an.naFila) ag.appendChild(el('span', 'cg-chip-vivo' + (an.emProd ? '' : ' calma'), an.emProd ? 'trabalhando agora…' : 'na fila de produção'));
  }

  // ---------- animação "site sendo construído" ----------
  var obraEl = null, obraAss = '';
  function slug(t) { return String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 22) || 'seu-negocio'; }
  function montarObra(sis, negocio) {
    var o = el('div', 'cg-obra' + (sis ? ' sis' : ''));
    o.setAttribute('aria-hidden', 'true');
    var jan = el('div', 'cg-obra-jan');
    var barra = el('div', 'cg-obra-barra'); barra.appendChild(el('i')); barra.appendChild(el('i')); barra.appendChild(el('i'));
    barra.appendChild(el('span', 'cg-obra-url', sis ? 'sistema · ' + slug(negocio) : slug(negocio) + '.clickgo.dev.br'));
    jan.appendChild(barra);
    var c = el('div', 'cg-obra-corpo');
    if (sis) {
      c.appendChild(el('div', 'b b1 lado'));
      var pr = el('div', 'cg-obra-pr');
      var tit = el('div', 'b b2 tit'); tit.appendChild(el('span', 'dig')); tit.appendChild(el('span', 'cur')); pr.appendChild(tit);
      var cards = el('div', 'cg-obra-cols'); ['b3', 'b4', 'b5'].forEach(function (k) { cards.appendChild(el('div', 'b ' + k + ' card')); }); pr.appendChild(cards);
      ['b6', 'b7', 'b8'].forEach(function (k) { pr.appendChild(el('div', 'b ' + k + ' fila')); });
      c.appendChild(pr);
    } else {
      c.appendChild(el('div', 'b b1 topo'));
      var hero = el('div', 'b b2 hero'); hero.appendChild(el('span', 'dig')); hero.appendChild(el('span', 'cur')); hero.appendChild(el('span', 'botao')); c.appendChild(hero);
      var cols = el('div', 'cg-obra-cols'); ['b3', 'b4', 'b5'].forEach(function (k) { cols.appendChild(el('div', 'b ' + k + ' card')); }); c.appendChild(cols);
      c.appendChild(el('div', 'b b6 rod'));
    }
    jan.appendChild(c);
    jan.appendChild(el('span', 'cg-obra-mao'));
    o.appendChild(jan);
    o.appendChild(el('p', 'cg-obra-leg'));
    return o;
  }
  function desenharObra(r, an) {
    var i = r.info || {};
    var mostra = (an.emProd || an.naFila) && !i.cancelado;
    if (!mostra) { if (obraEl && obraEl.parentNode) obraEl.parentNode.removeChild(obraEl); obraEl = null; obraAss = ''; $('previa-vazia').classList.remove('com-obra'); var s0 = $('obra-slot'); if (s0) s0.hidden = true; return; }
    var ass = an.proj + '|' + r.negocio;
    if (!obraEl || ass !== obraAss) { if (obraEl && obraEl.parentNode) obraEl.parentNode.removeChild(obraEl); obraEl = montarObra(an.proj, r.negocio); obraAss = ass; }
    obraEl.classList.toggle('ativa', an.emProd); obraEl.classList.toggle('calma', !an.emProd);
    obraEl.querySelector('.cg-obra-leg').textContent = an.emProd ? (an.proj ? 'Nossa equipe está trabalhando no seu sistema agora' : 'Nossa equipe está trabalhando no seu site agora') : 'Na fila de produção: a equipe já está com o seu pedido';
    // sem prévia ainda: a animação ocupa o celular da prévia; com prévia (ou sistema): fica compacta no quadro do status
    var vazia = $('previa-vazia'), noCel = !an.proj && vazia && !vazia.hidden;
    var alvo = noCel ? vazia : $('obra-slot');
    vazia.classList.toggle('com-obra', !!noCel);
    $('obra-slot').hidden = !!noCel;
    obraEl.classList.toggle('compacta', !noCel);
    if (obraEl.parentNode !== alvo) alvo.insertBefore(obraEl, alvo.firstChild);
  }

  // ---------- pergunta do robô (respostas rápidas) ----------
  var respondida = '', assPerg = '', api = null;
  function perguntaPendente(r) {
    var p = (r.info || {}).pergunta;
    if (!p || !p.texto || p.texto === respondida) return null;
    if ((r.info || {}).cancelado) return null;
    return { texto: String(p.texto).slice(0, 300), opcoes: (p.opcoes || []).map(function (x) { return String(x).slice(0, 40); }).filter(Boolean).slice(0, 3) };
  }
  function responder(txt, p, btns) {
    if (!api) return;
    if (api.ocupado && api.ocupado()) { api.toast('Um instante: ainda estamos enviando a sua mensagem anterior.'); return; }
    respondida = p.texto;
    btns.forEach(function (b) { b.disabled = true; });
    api.mandar(txt).then(function () { api.toast('Resposta enviada! Nossa equipe segue por aqui.'); }).catch(function () { respondida = ''; assPerg = ''; btns.forEach(function (b) { b.disabled = false; }); });
  }
  function botoesPerg(box, p, cls) {
    var lista = [];
    p.opcoes.forEach(function (op) { var b = el('button', cls, op); b.type = 'button'; b.onclick = function (ev) { ev.stopPropagation(); responder(op, p, todos()); }; box.appendChild(b); lista.push(b); });
    function todos() { return Array.prototype.slice.call(document.querySelectorAll('.cg-op-perg')); }
    return lista;
  }
  function desenharPergunta(r) {
    var p = perguntaPendente(r);
    var ass = JSON.stringify(p);
    if (ass === assPerg) return p;
    assPerg = ass;
    var card = $('pergunta'), doca = $('doca-perg');
    card.innerHTML = ''; doca.innerHTML = '';
    card.hidden = !p; doca.hidden = !p;
    $('doca').classList.toggle('tem-perg', !!p);
    if (!p) return null;
    card.appendChild(el('small', '', 'Nossa equipe perguntou'));
    card.appendChild(el('b', '', p.texto));
    var op = el('div', 'cg-pergunta-op'); card.appendChild(op);
    botoesPerg(op, p, 'cg-btn cg-btn-linha cg-op-perg');
    var ir = el('button', 'cg-pergunta-outra', p.opcoes.length ? 'Responder com as minhas palavras' : 'Responder na conversa'); ir.type = 'button';
    ir.onclick = function () { if (api) api.abrirConversa(); setTimeout(function () { var t = $('texto'); if (t) t.focus(); }, 300); };
    card.appendChild(ir);
    var dop = el('div', 'cg-doca-op');
    botoesPerg(dop, p, 'cg-op-perg');
    doca.appendChild(dop);
    return p;
  }

  // ---------- barra fixa da conversa (celular) ----------
  var assDoca = '';
  function desenharDoca(r, a) {
    var d = $('doca'); if (!d) return;
    if (!d.dataset.lig) { d.dataset.lig = '1'; $('doca-abrir').onclick = function () { if (api) api.abrirConversa(); }; }
    var ms = r.mensagens || [], ult = null;
    for (var j = ms.length - 1; j >= 0; j--) if (ms[j].de !== 'cliente') { ult = ms[j]; break; }
    var p = perguntaPendente(r);
    var txt = p ? p.texto : ult ? String(ult.texto || '').replace(/\s+/g, ' ').trim() : 'Fale com a nossa equipe por aqui.';
    var ass = txt + '|' + (r.appOnline ? 1 : 0);
    if (ass !== assDoca) { assDoca = ass; $('doca-ultima').textContent = txt.slice(0, 160) || 'Fale com a nossa equipe por aqui.'; $('doca-estado').textContent = r.appOnline ? 'online agora' : 'responde por aqui'; }
    var mostra = !a.largo() && !a.conversaAberta() && !a.encerrado();
    d.hidden = !mostra;
    document.body.classList.toggle('cg-com-doca', mostra);
    // barra de compra (Aprovar) visível: a doca sobe para cima dela
    var cta = $('cta'), h = cta && !cta.hidden ? cta.offsetHeight : 0;
    document.documentElement.style.setProperty('--cta-h', h ? h + 'px' : '0px');
  }
  function pulsar() {
    var d = $('doca'); if (!d || d.hidden) return;
    d.classList.remove('pulsa'); void d.offsetWidth; d.classList.add('pulsa');
    clearTimeout(pulsar.t); pulsar.t = setTimeout(function () { d.classList.remove('pulsa'); }, 2600);
  }

  // ---------- agenda própria da sala do projeto (agenda.js; substitui o link externo agendaUrl, 21/10/2026) ----------
  function desenharAgenda(r) {
    if (window.CGAgenda) window.CGAgenda.desenhar(r, api);
  }

  function desenhar(r, a) {
    api = a;
    var an = estado(r, a.aprovado && a.aprovado());
    desenharLinha(r, an);
    desenharPergunta(r);
    desenharObra(r, an);
    desenharAgenda(r, an);
    desenharDoca(r, a);
    return an;
  }
  window.CGAndamento = { estado: estado, limpo: limpo, desenhar: desenhar, pulsar: pulsar, pendente: perguntaPendente, responder: function (txt, r) { var p = perguntaPendente(r); if (p) responder(txt, p, Array.prototype.slice.call(document.querySelectorAll('.cg-op-perg'))); } };
})();
