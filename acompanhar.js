/* ClickGo: página de acompanhamento do cliente (link só dele: /acompanhar/#id.chave).
   Prévia + EDITOR com o dedo (só campos controlados: texto, cor principal, foto, seções, WhatsApp) + CONVERSA com o robô.
   Tudo passa pela fila pública (CG.chamar); o app da ClickGo responde quando está ligado. */
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var h = (location.hash || '').replace(/^#/, '').split('.');
  var ID = h[0] || '', K = h[1] || '';
  if (!ID || !K) {
    try { var u = JSON.parse(localStorage.getItem('cg_pedidos') || '[]')[0]; if (u) { ID = u.id; K = u.k; history.replaceState(null, '', location.pathname + location.search + '#' + ID + '.' + K); } } catch (e) { /* */ }
  }
  if (!ID || !K) { $('sem-pedido').hidden = false; return; }

  var estado = null, vistas = 0, previaAtual = '', anexos = [], enviando = false;
  // mensagens já vistas neste aparelho (a barra fixa só conta as novas de verdade, não todas a cada visita)
  try { vistas = Number(localStorage.getItem('cg_vistas_' + ID)) || 0; } catch (e) { /* sem armazenamento */ }
  function marcarVistas(n) { vistas = n; try { localStorage.setItem('cg_vistas_' + ID, String(n)); } catch (e) { /* */ } }
  var ehLargo = function () { return matchMedia('(min-width: 980px)').matches; };

  function toast(t) { var el = $('toast'); el.textContent = t; el.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(function () { el.hidden = true; }, 3800); }
  function hora(iso) { try { return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); } catch (e) { return ''; } }

  // ---------- abas (celular) ----------
  function abrirAba(nome) {
    Array.prototype.forEach.call(document.querySelectorAll('.cg-abas button'), function (b) { b.setAttribute('aria-selected', String(b.dataset.aba === nome)); });
    $('painel-previa').hidden = nome !== 'previa';
    $('painel-editor').hidden = nome !== 'editor';
    $('painel-conversa').hidden = nome !== 'conversa';
    if (nome === 'conversa') { $('nova-msg').hidden = true; marcarVistas((estado && estado.mensagens.length) || 0); $('badge').hidden = true; $('badge').textContent = '0'; var ac = document.querySelector('.cg-abas button[data-aba="conversa"]'); if (ac) ac.classList.remove('tem-nova'); rolarChat(); }
    if (nome === 'editor') abrirEditor();
    if (estado && window.CGAndamento) window.CGAndamento.desenhar(estado, apiAndamento);
  }
  function abrirConversa() { if (!ehLargo()) abrirAba('conversa'); $('painel-conversa').scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  $('chat-voltar').onclick = function () { abrirAba('previa'); };
  Array.prototype.forEach.call(document.querySelectorAll('.cg-abas button'), function (b) { b.onclick = function () { abrirAba(b.dataset.aba); }; });
  $('ir-editar').onclick = function () { if (ehLargo()) { $('painel-editor').hidden = false; abrirEditor(); $('painel-editor').scrollIntoView({ behavior: 'smooth' }); } else abrirAba('editor'); };

  // ---------- estado ----------
  // Pedido apagado (Excluir/lixeira) ou link errado: a nuvem responde 404. Com a página já aberta, mostra NA HORA "Este pedido
  // foi encerrado", para de atualizar e não aceita mais mensagem (nada fica "concluído" num pedido que não existe).
  var encerrado = false;
  function ehSumiu(e) { return e && (e.status === 404 || /não encontrado|nao encontrado/i.test(e.message || '')); }
  function pedidoSumiu() {
    var ja = !!estado;
    encerrado = true; clearTimeout(proxima); proxima = null;
    $('tudo').hidden = true; $('sem-pedido').hidden = false;
    $('sem-pedido-t').textContent = ja ? 'Este pedido foi encerrado' : 'Não achei o seu pedido';
    $('sem-pedido-s').textContent = ja ? 'Ele não recebe mais mensagens nem aprovações. Se ainda quiser o seu site, faça um pedido novo: leva um minuto e ver a prévia não custa nada.' : 'Abra pelo link que você recebeu (ele é só seu) ou peça uma prévia nova.';
    $('sem-pedido-b').textContent = ja ? 'Fazer um novo pedido' : 'Pedir minha prévia sem custo';
    try { $('texto').disabled = true; $('envio').querySelector('button[type=submit]').disabled = true; } catch (_) {}
  }
  function carregar() {
    if (encerrado) return Promise.resolve();
    return CG.chamar('/pedido/' + encodeURIComponent(ID), { chave: K }).then(function (r) { estado = r; desenhar(); }).catch(function (e) {
      if (ehSumiu(e)) { pedidoSumiu(); return; }
      $('online').textContent = 'sem conexão'; $('online').className = 'cg-pill off';
    });
  }
  function desenhar() {
    var r = estado, i = r.info || {};
    $('tudo').hidden = false;
    var proj = !!i.projeto;
    $('titulo').textContent = (proj ? 'Sala do projeto · ' : 'Prévia de ') + r.negocio;
    $('como').hidden = proj || !!i.publicado || !!i.cancelado || !!i.sinalRecebido;
    $('online').textContent = r.appOnline ? 'atendimento online' : 'resposta em breve';
    $('online').className = 'cg-pill' + (r.appOnline ? '' : ' off');
    $('aviso-off').hidden = !!r.appOnline;
    $('chat-estado').textContent = r.appOnline ? 'online agora' : 'responde em breve';
    // andamento (etapa, equipe trabalhando/na fila): andamento.js; aqui só o que o status precisa
    var an = window.CGAndamento ? window.CGAndamento.estado(r, aprovacaoPendente()) : { naFila: false, emProd: false, frase: '' };
    // status
    var fazendo = ('emProducao' in i || 'naFila' in i) ? !!(i.emProducao || i.naFila) : /fila|fazendo|ajustando|montando|publicando/i.test(r.situacaoTexto || '') || (!proj && !i.versao && !i.publicado);
    $('giro').hidden = !fazendo;
    $('status-t').textContent = window.CGAndamento ? window.CGAndamento.limpo(r, an) : (r.situacaoTexto || 'Pedido recebido');
    $('status-s').textContent = i.publicado ? 'Seu site está no ar. Para mudar alguma coisa, use "Pedir uma mudança" logo abaixo.'
      : i.restanteLiberado ? 'Seu site está pronto! Veja na prévia. Assim que o restante cair, ele vai ao ar.'
      : i.sinalRecebido ? 'Pagamento confirmado. Estamos colocando o seu site no ar.'
      : i.pixLiberado ? (temLinkMP(i) ? 'O link de pagamento (Pix ou cartão) está logo abaixo. Assim que o pagamento for aprovado, o seu site vai ao ar.' : 'Os dados do Pix estão logo abaixo. Assim que o pagamento for aprovado, o seu site vai ao ar.')
      : an.naFila ? 'Seu pedido está na fila de produção da nossa equipe. Enquanto isso, pode tirar dúvidas na conversa.'
      : an.emProd && i.versao ? 'Nossa equipe está aplicando os seus ajustes. A nova versão aparece aqui na prévia.'
      : i.versao ? (i.rodadasRestantes > 0 ? 'Gostou? Aprove. Quer mudar? Ajuste com o dedo ou peça na conversa.' : 'Ajustes da prévia usados: o que faltar a gente ajusta depois, na sala do site.')
      : 'Nossa equipe está montando a sua prévia. Pode tirar dúvidas na conversa.';
    // prévia
    if (r.previaUrl && r.previaUrl !== previaAtual) {
      previaAtual = r.previaUrl;
      var f = $('previa'); f.src = r.previaUrl + (r.previaUrl.indexOf('?') < 0 ? '?' : '&') + 'v=' + (i.versao || 0) + '-' + Date.now();
      f.hidden = false; $('previa-vazia').hidden = true; $('previa-acoes').hidden = false; $('abrir').href = r.previaUrl;
      edCarregado = '';
    }
    // prévia fica no ar 24 h (sem pagamento); vencida, um toque republica a MESMA prévia por mais 24 h (guardada por até 30 dias)
    var exp = !!(i.previaExpirada && !i.publicado);
    $('previa-expirou').hidden = !exp;
    if (exp) { $('previa').hidden = true; $('previa-acoes').hidden = true; $('previa-vazia').hidden = true; previaAtual = ''; }
    $('previa-msg').textContent = proj ? 'O protótipo clicável aparece aqui depois que você tocar em "Gerar protótipo".' : an.naFila ? 'Sua prévia está na fila de produção. Ela aparece aqui quando ficar pronta.' : 'Nossa equipe está montando a sua prévia. Ela aparece aqui quando ficar pronta.';
    // editor
    var editavel = !!(i.editavel && r.previaUrl);
    $('aba-editor').hidden = !editavel; $('ir-editar').hidden = !editavel;
    if (!editavel && !$('painel-editor').hidden) { $('painel-editor').hidden = true; if (!ehLargo()) abrirAba('previa'); }
    $('rodadas').textContent = i.rodadasTotal ? 'Rodada de ajuste ' + Math.min(i.rodadasTotal, (i.rodadasTotal - i.rodadasRestantes) + 1) + ' de ' + i.rodadasTotal + ' na prévia. O que faltar a gente ajusta depois, na sala do site.' : '';
    // compra sempre à vista
    var cta = $('cta');
    var prep = aprovacaoPendente();
    cta.hidden = prep || !(i.podeAprovar || (i.versao && !i.pixLiberado && !an.naFila && !an.emProd));
    desenharPix(prep);
    $('aprovar').disabled = !i.podeAprovar;
    // valor EXATO que vai ser cobrado ao aprovar (vem do app, o mesmo do Pix; nunca a conta da tabela aqui no navegador)
    var sp = Number(i.sinalPrevisto) || 0;
    $('cta-s').textContent = i.rodadasRestantes === 0 ? 'Ajustes da prévia usados. Aprove' + (sp ? ' (' + brl2(sp) + ', de uma vez)' : '') + ' e o que faltar a gente ajusta depois, na sala do site.' : sp ? 'Ao aprovar, o valor é ' + brl2(sp) + ', de uma vez.' : 'Você só paga depois de aprovar, de uma vez: Pix ou até 12x no cartão (com os juros do Mercado Pago).';
    // pacotes (valores vêm da tabela da ClickGo, mandados pelo app)
    desenharPacotes();
    // PAGO (dono 24/10/2026; pagamento inteiro desde 05/11/2026): a página muda de fase enquanto o site vai ao ar; nada de
    // escolher pacote, aprovar ou pagar de novo (restante só em pedido antigo)
    var posSinal = !!(i.sinalRecebido && !i.restanteLiberado && !i.publicado && !i.cancelado && !proj && r.situacao !== 'desistencia');
    $('fase-sinal').hidden = !posSinal;
    if (posSinal) {
      cta.hidden = true; $('pacotes').hidden = true; $('resumo-pac').hidden = true; $('pix').hidden = true;
      var rp = Number(i.restantePrevisto) || 0;
      $('fase-resta-l').hidden = !rp; $('fase-resta').textContent = rp ? brl2(rp) + ', antes de o site ir ao ar' : '';
    }
    // pedido substituído por um novo deste aparelho
    if (i.cancelado || r.situacao === 'cancelado') {
      $('giro').hidden = true; cta.hidden = true; $('pacotes').hidden = true; $('resumo-pac').hidden = true; $('aba-editor').hidden = true; $('ir-editar').hidden = true;
      $('status-s').innerHTML = 'Nada foi cobrado. <a href="/esboco/">Abrir o pedido novo</a>';
    }
    // desistência pedida no chat (7 dias, CDC): sem pagamento, aprovação, pacote nem editor; a conversa continua
    if (r.situacao === 'desistencia') {
      $('giro').hidden = true; cta.hidden = true; $('pacotes').hidden = true; $('resumo-pac').hidden = true; $('aba-editor').hidden = true; $('ir-editar').hidden = true; $('pix').hidden = true;
      $('status-s').textContent = 'Pedido cancelado a seu pedido. A devolução é confirmada aqui no chat e por e-mail.';
    }
    // conversa
    desenharMsgs();
    sugestoes();
    // site no ar: a página vira a SALA DO SITE (sala.js)
    if (window.CGSala) window.CGSala.desenhar(r, { mandar: mandar, toast: toast });
    // extras (vitrine, caixinhas antes do Pix), tela de mudança e "guarde este link": cg-sala-extras.js
    if (window.CGSalaExtras) window.CGSalaExtras.desenhar(r, { mandar: mandar, toast: toast, copiar: copiarTexto });
    // subir de plano (só pacotes acima do atual que o app mandou; a diferença é do servidor): cg-sala-planos.js
    if (window.CGSalaPlanos) window.CGSalaPlanos.desenhar(r, { mandar: mandar, toast: toast });
    // sistema sob medida: a página vira a SALA DO PROJETO (projeto.js); nada de pacote, aprovar, editor ou Pix
    if (proj) {
      cta.hidden = true; $('pacotes').hidden = true; $('resumo-pac').hidden = true; $('aba-editor').hidden = true; $('ir-editar').hidden = true; $('pix').hidden = true;
      $('sugestoes').innerHTML = '';
      var SUB_SIS = { orcamento: 'Confira o orçamento logo abaixo. Dúvidas? Fale com a equipe na conversa.', sinal: 'O pagamento do sinal está logo abaixo. Com ele, a construção começa.', construcao: 'Nossa equipe constrói o seu sistema em etapas. Cada etapa pronta aparece aqui.', entrega: 'Seu sistema está pronto. A equipe combina a entrega com você pela conversa.', no_ar: 'Seu sistema está no ar. Ajustes do mês: é só pedir na conversa.' };
      $('status-s').textContent = SUB_SIS[an.etapa] ? SUB_SIS[an.etapa] : (r.projeto && r.projeto.pergunta) ? 'Responda na conversa: ' + r.projeto.pergunta : r.projeto && r.projeto.gerando ? 'Nossa equipe está montando o protótipo; ele aparece aqui quando ficar pronto.' : r.projeto && r.projeto.rodada ? 'Navegue no protótipo. Quer mudar algo? Escreva na conversa.' : 'Toque em "Gerar protótipo".';
    }
    if (window.CGProjeto) window.CGProjeto.desenhar(r, { mandar: mandar, toast: toast, abrirConversa: abrirConversa });
    // linha do tempo, animação da equipe, pergunta com respostas rápidas, barra fixa da conversa, agendar vídeo
    if (window.CGAndamento) window.CGAndamento.desenhar(r, apiAndamento);
  }
  var apiAndamento = {
    mandar: function (t, x) { return mandar(t, x); }, toast: toast, ocupado: function () { return enviando; }, abrirConversa: abrirConversa, largo: ehLargo,
    conversaAberta: function () { return !$('painel-conversa').hidden; }, encerrado: function () { return encerrado; },
    aprovado: function () { return estado ? aprovacaoPendente() : 0; }
  };
  // ---------- aprovação + cartão do Pix (fixo, visível em qualquer aba) ----------
  var aprovadoAqui = 0;
  function aprovacaoPendente() {
    var i = estado.info || {};
    if (i.pixLiberado || i.sinalRecebido || i.publicado || i.cancelado) return false;
    // aprovou (aqui ou antes, de qualquer aparelho) e o Pix ainda não saiu: fica "aprovado" sem prazo (nunca aprova 2 vezes)
    if (aprovadoAqui) return aprovadoAqui;
    var ms = estado.mensagens || [];
    for (var j = ms.length - 1; j >= 0; j--) if (ms[j].de === 'cliente' && ms[j].tipo === 'aprovar') return Date.parse(ms[j].em) || 1;
    return 0;
  }
  // aviso no topo quando há pagamento em aberto (pagamento ou restante antigo): quem veio pelo e-mail de lembrete cai direto nele
  function desenharAvisoPag() {
    var i = estado.info || {}, rest = !!(i.restanteLiberado && !i.publicado), sin = !!(i.pixLiberado && !i.sinalRecebido && !i.publicado && !i.cancelado);
    $('aviso-pag').hidden = !(rest || sin);
    // site pronto: setinha "a prévia está logo abaixo" (dono 24/10/2026)
    $('seta-previa').hidden = !(rest && estado.previaUrl && !i.previaExpirada);
    if (!(rest || sin)) return;
    var v = rest ? Number(i.restante) || 0 : Number(i.sinal) || 0;
    $('aviso-pag-t').textContent = rest ? 'Seu site está pronto! Falta só o restante' + (v ? ' (' + brl2(v) + ')' : '') + ' para ir ao ar.' : 'Prévia aprovada! Falta só o pagamento' + (v ? ' (' + brl2(v) + ')' : '') + ' para o site ir ao ar.';
    $('aviso-pag-s').textContent = i.precisaContato ? 'Toque para informar o e-mail e gerar o Pix.' : temPix(i) ? 'Toque para ver o QR Code do Pix (qualquer banco).' : temLinkMP(i) ? 'Toque para pagar (Pix ou cartão, até 12x).' : 'Toque para ver o Pix' + (i.querCartao ? '. O link do cartão chega na conversa.' : ' ou pedir o cartão parcelado.');
  }
  $('seta-previa').onclick = function () { if (!ehLargo()) abrirAba('previa'); $('painel-previa').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); };
  $('aviso-pag').onclick = function () { $('pix').scrollIntoView({ behavior: 'smooth', block: 'center' }); };
  // "Prefere cartão parcelado? Toque aqui": o pedido vai à conversa e a equipe é avisada (sem digitar)
  $('pix-cartao').onclick = function () {
    var b = this; if (b.disabled) return;
    b.disabled = true;
    mandar('', { tipo: 'cartao' }).then(function () { toast('Pedido enviado! A equipe ClickGo te manda o link do cartão na conversa.'); b.innerHTML = 'Pedido de cartão enviado. O link chega na conversa.'; })
      .catch(function () { b.disabled = false; });
  };
  // voltou do Mercado Pago (?cartao=aprovado|pendente|recusado): avisa; a confirmação chega sozinha pelo aviso do MP
  (function () {
    var m = /[?&]cartao=(aprovado|pendente|recusado)/.exec(location.search || '');
    if (!m) return;
    setTimeout(function () { toast(m[1] === 'aprovado' ? 'Pagamento aprovado! Em instantes ele aparece confirmado aqui.' : m[1] === 'pendente' ? 'Pagamento em análise no Mercado Pago. Assim que aprovar, ele aparece confirmado aqui.' : 'O pagamento não passou. Tente de novo pelo mesmo link: dá para escolher Pix ou outro cartão.'); }, 600);
    try { history.replaceState(null, '', location.pathname + location.hash); } catch (e) { /* */ }
  })();
  // Mercado Pago ligado no app (dono, 21/10/2026): o pagamento sai SÓ pelo link (Pix ou cartão), sem chave copia-e-cola
  function temLinkMP(i) { return /^https:\/\/(www\.|sandbox\.)?mercadopago\.com(\.br)?\//.test(String((i || {}).cartaoUrl || '')); }
  // PIX NA PÁGINA (24/10/2026): QR Code + copia e cola gerados pela API do Mercado Pago (qualquer banco, sem app do MP)
  function temPix(i) { return /^000201[\x20-\x7e]{20,600}$/.test(String((i || {}).pixQr || '')); }
  var qrCarregado = '', qrBuscando = '';
  function carregarQr(id) {
    if (!id || qrCarregado === id || qrBuscando === id) return;
    qrBuscando = id;
    CG.chamar('/pedido/' + encodeURIComponent(ID) + '/pix-img', { chave: K }).then(function (r) {
      qrBuscando = '';
      if (!r || r.id !== id || !/^iVBORw0KGgo[A-Za-z0-9+/]{90,40000}={0,2}$/.test(String(r.b64 || ''))) return;
      var im = $('pix-qr'); im.src = 'data:image/png;base64,' + r.b64; im.hidden = false; $('pix-qr-carregando').hidden = true; qrCarregado = id;
    }).catch(function () { qrBuscando = ''; $('pix-qr-carregando').textContent = 'Use o código abaixo (copia e cola).'; });
  }
  function desenharPix(prep) {
    var i = estado.info || {}, rest = !!(i.restanteLiberado && !i.publicado && !i.cancelado), ext = !!(i.publicado && Number(i.extraValor) > 0 && !i.cancelado), mostra = rest || ext || !!(i.pixLiberado && !i.sinalRecebido && !i.publicado && !i.cancelado);
    desenharAvisoPag();
    $('pix').hidden = !(mostra || prep);
    $('pix-preparando').hidden = mostra || !prep;
    if (prep && !mostra) { var demora = Date.now() - prep > 60000; $('pix-prep-t').textContent = demora ? 'Aprovação recebida!' : 'Aprovado! Preparando o seu pagamento…'; $('pix-prep-s').textContent = demora ? 'Estamos confirmando a sua aprovação. Os dados do pagamento aparecem aqui (e na conversa) assim que saírem.' : 'Leva só alguns segundos. Os dados do pagamento aparecem aqui mesmo.'; }
    $('pix-pronto').hidden = !mostra;
    if (prep && !mostra) { $('giro').hidden = true; $('status-t').textContent = 'Prévia aprovada!'; $('status-s').textContent = 'Obrigado! O pagamento aparece logo abaixo.'; }
    if (!mostra) return;
    var upg = ext && i.extraTipo === 'upgrade'; // diferença da implantação na troca de plano (cg-sala-planos.js)
    $('pix-titulo').textContent = upg ? 'Pague a diferença e suba para o ' + (i.extraNome || 'plano novo') : ext ? 'Pague o seu extra: ' + (i.extraNome || 'extra') : rest ? 'Pague o restante e coloque o seu site no ar' : 'Pague e coloque o seu site no ar';
    $('pix-rotulo').textContent = upg ? 'Diferença da implantação (uma vez)' : ext ? 'Extra (pagamento único)' : rest ? 'Restante' : 'Pagamento';
    $('pix-garante-sinal').hidden = rest || ext; $('pix-garante-restante').hidden = !rest;
    // 1º o e-mail (obrigatório: recibo e link da página); depois o Pix na página (QR + copia e cola); o cartão do MP fica
    // como opção secundária. Sem Pix (Mercado Pago desligado ou fora): o link do MP ou a chave Pix, como antes.
    var contato = !!i.precisaContato, pix = !contato && temPix(i);
    $('pix-contato').hidden = !contato; $('pix-tel-box').hidden = !!i.telConhecido;
    $('pix-qr-box').hidden = !pix;
    if (pix) {
      if ($('pix-copia').textContent !== i.pixQr) $('pix-copia').textContent = i.pixQr;
      if (qrCarregado !== i.pixId) { $('pix-qr').hidden = true; $('pix-qr-carregando').hidden = false; }
      carregarQr(i.pixId);
    }
    var mp = !contato && temLinkMP(i);
    $('pix-cartao-link').hidden = !mp; $('pix-cartao').hidden = mp || contato; $('pix-mp-nota').hidden = !mp || pix;
    $('pix-cartao-link').className = 'cg-btn cg-pix-mp ' + (pix ? 'cg-btn-linha secundario' : 'cg-btn-prim');
    $('pix-cartao-link').innerHTML = pix ? 'Prefere cartão? Até 12x <small>Mercado Pago</small>' : 'Pagar (Pix ou cartão, até 12x) <small>Mercado Pago</small>';
    $('pix-nota').hidden = mp || pix || contato; $('pix-comprovante').hidden = mp || pix || contato;
    if (mp) $('pix-cartao-link').href = i.cartaoUrl;
    if (i.querCartao && !$('pix-cartao').disabled) { $('pix-cartao').disabled = true; $('pix-cartao').innerHTML = 'Pedido de cartão enviado. O link chega na conversa.'; }
    var sinal = ext ? Number(i.extraValor) || 0 : rest ? Number(i.restante) || 0 : Number(i.sinal) || 0, chave = String(i.pixChave || '');
    $('pix-valor').parentNode.hidden = !sinal;
    $('pix-valor').textContent = brl2(sinal);
    $('pix-chave-box').hidden = mp || pix || contato || !chave; $('pix-sem').hidden = mp || pix || contato || !!chave;
    $('pix-chave').textContent = chave;
  }
  function copiarTexto(t) {
    var velho = function () { return new Promise(function (ok, falha) {
      var ta = document.createElement('textarea'); ta.value = t; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      var deu = false; try { deu = document.execCommand('copy'); } catch (e) { /* */ }
      document.body.removeChild(ta); deu ? ok() : falha(new Error('sem cópia'));
    }); };
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(t).catch(velho);
    return velho();
  }
  $('pix-copiar').onclick = function () {
    var b = this, t = $('pix-chave').textContent;
    copiarTexto(t).then(function () { b.textContent = 'Chave copiada!'; toast('Chave Pix copiada. É só colar no app do seu banco.'); setTimeout(function () { b.textContent = 'Copiar chave Pix'; }, 2500); })
      .catch(function () { toast('Não consegui copiar: segure o dedo sobre a chave para copiar.'); });
  };
  $('pix-copiar-cc').onclick = function () {
    var b = this, t = $('pix-copia').textContent;
    copiarTexto(t).then(function () { b.textContent = 'Código copiado!'; toast('Código Pix copiado. No app do banco, escolha Pix > Copia e cola.'); setTimeout(function () { b.textContent = 'Copiar código Pix'; }, 2500); })
      .catch(function () { toast('Não consegui copiar: segure o dedo sobre o código para copiar.'); });
  };
  var EMAIL_OK = /^[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9.-]{1,190}\.[A-Za-z]{2,24}$/;
  $('pix-contato').onsubmit = function (ev) {
    ev.preventDefault();
    var em = String($('pix-email').value || '').trim(), tel = String($('pix-tel').value || '').replace(/\D/g, ''), er = $('pix-contato-erro'), b = $('pix-contato-ok');
    er.hidden = true;
    if (!EMAIL_OK.test(em)) { er.textContent = 'Confira o e-mail (ex.: voce@email.com).'; er.hidden = false; $('pix-email').focus(); return; }
    if (tel && !/^(55)?[1-9]\d{9,10}$/.test(tel)) { er.textContent = 'Confira o WhatsApp: DDD + número.'; er.hidden = false; $('pix-tel').focus(); return; }
    if (b.disabled) return;
    b.disabled = true; b.textContent = 'Gerando o seu Pix…';
    mandar('', { tipo: 'pagador', email: em, telefone: tel }).then(function () { toast('E-mail recebido! O Pix aparece aqui em instantes.'); setTimeout(function () { b.disabled = false; b.textContent = 'Gerar meu Pix'; }, 15000); })
      .catch(function () { b.disabled = false; b.textContent = 'Gerar meu Pix'; });
  };
  $('pix-comprovante').onclick = function () {
    if (ehLargo()) $('painel-conversa').scrollIntoView({ behavior: 'smooth' }); else abrirAba('conversa');
    toast('Escolha o print ou a foto do comprovante e toque em enviar.');
    setTimeout(function () { $('anexo-input').click(); }, 250);
  };
  // link da página (é só do cliente): copiar, ou compartilhar no celular
  $('copiar-link').hidden = false;
  $('copiar-link').onclick = function () {
    var b = this, url = location.href;
    var feito = function () { b.textContent = 'Link copiado!'; b.classList.add('ok'); toast('Link copiado! Guarde nos favoritos ou mande para você mesmo.'); setTimeout(function () { b.textContent = 'Copiar meu link'; b.classList.remove('ok'); }, 2500); };
    copiarTexto(url).then(feito).catch(function () {
      if (navigator.share) navigator.share({ title: 'Meu pedido na ClickGo', url: url }).catch(function () {});
      else window.prompt('Copie o seu link:', url);
    });
  };

  function brl(v) { var n = Number(v) || 0; return 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }); }
  // valor a pagar: sempre com centavos (R$ 1,00), igual ao que o Mercado Pago cobra
  function brl2(v) { var n = Number(v) || 0; return 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  var pacotesDesenhados = '', rolouPacote = false;
  $('resumo-pac').onclick = function () { $('pacotes').scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  function desenharPacotes() {
    var ps = (estado && estado.pacotes) || [], i = estado.info || {}, box = $('pacotes-lista');
    $('pacotes').hidden = !ps.length || !!i.publicado;
    if (!ps.length) return;
    var esc = ps.filter(function (p) { return p.escolhido; })[0];
    $('resumo-pac').hidden = !esc || !!i.publicado || !!i.cancelado;
    if (esc) $('resumo-pac-t').textContent = esc.pacote + ' · ' + (esc.implantacao ? brl(esc.implantacao) + (esc.mensalidade ? ' + ' + brl(esc.mensalidade) + '/mês' : '') : brl(esc.mensalidade) + '/mês') + (esc.recomendado ? ' ★' : '');
    var trava = !i.podeTrocarPacote;
    var assin = JSON.stringify([ps, trava, i.rodadasRestantes, i.versao]);
    if (assin === pacotesDesenhados) return;
    pacotesDesenhados = assin;
    box.innerHTML = '';
    // COMPARAÇÃO (dono 24/10/2026): do menor para o maior, o que cada pacote tem A MAIS fica marcado (+) e o menor mostra,
    // riscado, o que só vem no próximo. Só com os itens da tabela (nada inventado aqui); "Tudo do X" vira o cabeçalho.
    var ord = ps.slice().sort(function (a, b) { return (Number(a.implantacao) || 0) - (Number(b.implantacao) || 0); });
    var ehPonte = function (t) { return /^tudo do /i.test(String(t)); };
    var normI = function (t) { return String(t).toLowerCase().replace(/\s+/g, ' ').trim(); };
    var difDe = {};
    ord.forEach(function (p, k) {
      var ant = k ? ord[k - 1] : null, prox = ord[k + 1] || null;
      var tinha = ant ? (ant.inclui || []).map(normI) : [];
      var ponte = (p.inclui || []).filter(ehPonte)[0] || '';
      var novos = ant ? (p.inclui || []).filter(function (t) { return !ehPonte(t) && tinha.indexOf(normI(t)) < 0; }) : [];
      var falta = prox ? (prox.inclui || []).filter(function (t) { return !ehPonte(t) && (p.inclui || []).map(normI).indexOf(normI(t)) < 0; }) : [];
      difDe[p.pacote] = { ponte: ponte, novos: novos, falta: falta, prox: prox ? prox.pacote : '' };
    });
    ps.forEach(function (p) {
      var c = document.createElement('article');
      c.className = 'cg-pac' + (p.recomendado ? ' rec' : '') + (p.escolhido ? ' esc' : '');
      c.innerHTML = '<div class="cg-pac-selos"></div><h3></h3><div class="cg-pac-preco"><b></b><span></span></div><small class="cg-pac-prazo"></small><ul></ul><button type="button" class="cg-btn"></button>';
      var selos = c.querySelector('.cg-pac-selos');
      if (p.recomendado) { var s1 = document.createElement('span'); s1.className = 'rec'; s1.textContent = '★ Recomendado para você'; selos.appendChild(s1); }
      if (p.escolhido) { var s2 = document.createElement('span'); s2.className = 'esc'; s2.textContent = '✓ Seu pacote'; selos.appendChild(s2); }
      c.querySelector('h3').textContent = p.pacote;
      c.querySelector('.cg-pac-preco b').textContent = p.implantacao ? brl(p.implantacao) : brl(p.mensalidade) + '/mês';
      c.querySelector('.cg-pac-preco span').textContent = p.implantacao ? (p.mensalidade ? 'implantação + ' + brl(p.mensalidade) + '/mês' : 'pagamento único') : '';
      c.querySelector('.cg-pac-prazo').textContent = p.prazo ? 'Prazo: ' + p.prazo : '';
      var ul = c.querySelector('ul'), df = difDe[p.pacote] || { novos: [], falta: [] };
      if (df.ponte) { var mais = document.createElement('p'); mais.className = 'cg-pac-mais'; mais.textContent = df.ponte.replace(/[.:]$/, '') + ', mais:'; ul.parentNode.insertBefore(mais, ul); }
      (p.inclui || []).filter(function (t) { return !(df.ponte && t === df.ponte); }).forEach(function (t) { var li = document.createElement('li'); li.textContent = t; if (df.novos.indexOf(t) >= 0) li.className = 'novo'; ul.appendChild(li); });
      df.falta.slice(0, 3).forEach(function (t) { var li = document.createElement('li'); li.className = 'falta'; li.textContent = t; li.title = 'Só a partir do ' + df.prox; ul.appendChild(li); });
      if (df.falta.length) { var lf = document.createElement('li'); lf.className = 'falta-nota'; lf.textContent = (df.falta.length > 3 ? 'Riscados e mais ' + (df.falta.length - 3) : 'Riscados') + ': só no ' + df.prox; ul.appendChild(lf); }
      if (p.mensalidadeInclui && p.mensalidade) { var li = document.createElement('li'); li.className = 'mens'; li.textContent = 'Mensalidade: ' + p.mensalidadeInclui; ul.appendChild(li); }
      var b = c.querySelector('button');
      if (p.escolhido) { b.className = 'cg-btn cg-btn-linha'; b.textContent = 'Pacote escolhido'; b.disabled = true; }
      else {
        b.className = 'cg-btn ' + (p.recomendado ? 'cg-btn-prim' : 'cg-btn-linha'); b.textContent = 'Escolher este'; b.disabled = trava;
        b.onclick = function () {
          var aviso = !i.versao ? 'A prévia já sai nesse nível.' : i.rodadasRestantes > 0 ? 'A prévia é refeita nesse nível (usa 1 das ' + i.rodadasTotal + ' rodadas de ajuste).' : 'As rodadas de ajuste acabaram: a prévia fica como está e o site sai nesse nível.';
          if (!confirm('Trocar para o pacote ' + p.pacote + '? ' + aviso + ' Você só paga depois de aprovar.')) return;
          b.disabled = true; b.textContent = 'Trocando…';
          mandar('', { tipo: 'pacote', pacote: p.pacote }).then(function () { toast('Pedido de troca enviado! A resposta chega na conversa.'); }).catch(function () { b.disabled = false; b.textContent = 'Escolher este'; });
        };
      }
      box.appendChild(c);
    });
    $('pacotes-nota').textContent = trava ? 'A prévia já foi aprovada: para trocar de pacote, fale na conversa.' : 'Pagamento: de uma vez, depois de aprovar a prévia (Pix ou até 12x no cartão, com os juros do Mercado Pago). Mensalidade sem fidelidade.';
    // no celular, já mostra o recomendado/escolhido
    if (!rolouPacote) { rolouPacote = true; var alvo = box.querySelector('.cg-pac.esc') || box.querySelector('.cg-pac.rec'); if (alvo && box.scrollWidth > box.clientWidth) box.scrollLeft = alvo.offsetLeft - box.offsetLeft - 16; }
  }
  function linkificar(el, texto) {
    var partes = String(texto).split(/((?:https:\/\/|http:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?\/)[^\s)]+)/g);
    partes.forEach(function (p) {
      if (/^(https:\/\/|http:\/\/(127\.0\.0\.1|localhost))/.test(p)) { var a = document.createElement('a'); a.href = p; a.target = '_blank'; a.rel = 'noopener'; a.textContent = /previa\.|sites\./.test(p) ? 'abrir o site' : p; el.appendChild(a); }
      else el.appendChild(document.createTextNode(p));
    });
  }
  var desenhadas = 0;
  function desenharMsgs() {
    var ms = estado.mensagens || [], box = $('msgs'), primeira = desenhadas === 0;
    if (vistas > ms.length) vistas = ms.length;
    if (ms.length < desenhadas) { box.innerHTML = ''; desenhadas = 0; }
    for (var j = desenhadas; j < ms.length; j++) {
      var m = ms[j], d = document.createElement('div');
      d.className = 'cg-msg ' + (m.de === 'cliente' ? 'meu' : 'dele');
      linkificar(d, (m.texto || '') + (m.fotos ? (m.texto ? '\n' : '') + '📷 ' + m.fotos + (m.fotos > 1 ? ' fotos' : ' foto') : ''));
      var t = document.createElement('time'); t.textContent = hora(m.em) + (m.via === 'whatsapp' ? ' · pelo WhatsApp' : m.via === 'instagram' ? ' · pelo direct' : ''); d.appendChild(t);
      box.appendChild(d);
    }
    desenhadas = ms.length;
    var aberta = ehLargo() || !$('painel-conversa').hidden;
    if (aberta) {
      if (!primeira && ms.length > vistas && ms.slice(vistas).some(function (x) { return x.de !== 'cliente'; })) { var rc = $('painel-conversa').getBoundingClientRect(); if (rc.bottom < 60 || rc.top > innerHeight - 60) avisoNova(ms.slice(vistas).filter(function (x) { return x.de !== 'cliente'; }).length); }
      marcarVistas(ms.length); rolarChat();
    }
    else {
      var novas = ms.slice(vistas).filter(function (x) { return x.de !== 'cliente'; }).length;
      if (!primeira && novas > (Number($('badge').textContent) || 0)) avisoNova(novas);
      $('badge').textContent = novas; $('badge').hidden = !novas;
    }
    var abaConv = document.querySelector('.cg-abas button[data-aba="conversa"]'); if (abaConv) abaConv.classList.toggle('tem-nova', !$('badge').hidden);
  }
  function avisoNova(novas) {
    if (!ehLargo() && window.CGAndamento) { window.CGAndamento.pulsar(); return; } // celular: a barra fixa da conversa pulsa
    var a = $('nova-msg'); a.textContent = novas > 1 ? novas + ' novas mensagens · ver' : 'Nova mensagem · ver'; a.hidden = false;
    clearTimeout(avisoNova.t); avisoNova.t = setTimeout(function () { a.hidden = true; }, 20000);
  }
  $('nova-msg').onclick = function () { this.hidden = true; if (ehLargo()) $('painel-conversa').scrollIntoView({ behavior: 'smooth' }); else abrirAba('conversa'); };
  function rolarChat() { var b = $('msgs'); b.scrollTop = b.scrollHeight; }
  function sugestoes() {
    var i = estado.info || {}, s = $('sugestoes'); s.innerHTML = '';
    // pergunta da equipe esperando resposta: as respostas rápidas tomam o lugar das sugestões
    var pp = window.CGAndamento && window.CGAndamento.pendente(estado);
    if (pp && pp.opcoes.length) { pp.opcoes.forEach(function (t) { var b = document.createElement('button'); b.type = 'button'; b.className = 'cg-op-perg perg'; b.textContent = t; b.onclick = function () { window.CGAndamento.responder(t, estado); }; s.appendChild(b); }); return; }
    var lista = i.publicado ? ['Quero mudar uma coisa no site'] : (i.sinalRecebido && !i.restanteLiberado) ? ['Mandar logo', 'Quando fica pronto?', 'Quero mudar algo'] : i.restanteLiberado ? ['Já paguei o restante', temLinkMP(i) ? 'Como faço para pagar?' : 'Aceita cartão?'] : i.pixLiberado ? ['Já paguei',temLinkMP(i) ? 'Como faço para pagar?' : 'Qual é a chave Pix?'] : i.versao ? ['Quanto fica?', 'Como funciona o pagamento?', 'Quanto tempo para ficar no ar?'] : ['Quanto custa um site?', 'Em quanto tempo fica pronto?'];
    lista.forEach(function (t) { var b = document.createElement('button'); b.type = 'button'; b.textContent = t; b.onclick = function () { if (t === 'Mandar logo') { abrirConversa(); $('anexo-input').click(); return; } if (i.publicado && $('sala-texto') && !$('sala-mudar').hidden && !$('sala').hidden) { $('sala-mudar').scrollIntoView({ behavior: 'smooth' }); $('sala-texto').focus(); } else mandar(t); }; s.appendChild(b); });
  }

  // ---------- conversa ----------
  function mandar(texto, extra) {
    if (enviando || encerrado) return encerrado ? Promise.reject(new Error('Este pedido foi encerrado.')) : Promise.resolve();
    enviando = true;
    var corpo = Object.assign({ texto: texto || '', fotos: anexos.slice() }, extra || {});
    return CG.chamar('/pedido/' + encodeURIComponent(ID) + '/mensagem', { metodo: 'POST', chave: K, corpo: corpo }).then(function (r) {
      estado = r; anexos = []; $('anexos').innerHTML = ''; desenhar();
      if (!r.appOnline) toast('Mensagem guardada. A resposta chega aqui em breve.');
    }).catch(function (e) { if (ehSumiu(e)) pedidoSumiu(); else toast(e.message); throw e; }).finally(function () { enviando = false; });
  }
  // áudio na conversa (cg-chat-audio.js): grava, manda como "audio" e o robô responde à transcrição
  if (window.CGChatAudio) window.CGChatAudio.ligar({ mandar: mandar, toast: toast });
  $('ver-de-novo').onclick = function () {
    var b = this; b.disabled = true; b.textContent = 'Publicando de novo…';
    mandar('', { tipo: 'reabrir' }).then(function () { toast('Pronto! Em instantes a prévia volta aqui, por mais 24 horas.'); }).catch(function () {}).finally(function () { setTimeout(function () { b.disabled = false; b.textContent = 'Ver a prévia de novo'; }, 8000); });
  };
  $('envio').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var t = $('texto').value.trim();
    if (!t && !anexos.length) return;
    mandar(t).then(function () { $('texto').value = ''; $('texto').style.height = ''; }).catch(function () {});
  });
  $('texto').addEventListener('input', function () { this.style.height = 'auto'; this.style.height = Math.min(120, this.scrollHeight) + 'px'; });
  $('texto').addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey && ehLargo()) { e.preventDefault(); $('envio').requestSubmit(); } });
  $('anexo-input').addEventListener('change', function () {
    var lista = Array.prototype.slice.call(this.files || []).slice(0, 3 - anexos.length); this.value = '';
    Promise.all(lista.map(function (f) { return CG.comprimir(f).catch(function () { return null; }); })).then(function (urls) {
      urls.forEach(function (u) { if (u) anexos.push(u); });
      $('anexos').innerHTML = ''; anexos.forEach(function (u) { var im = document.createElement('img'); im.src = u; im.alt = ''; $('anexos').appendChild(im); });
    });
  });
  $('aprovar').onclick = function () {
    if (!confirm('Aprovar a prévia? Em seguida mandamos aqui o pagamento. Assim que ele for aprovado, o site vai ao ar.')) return;
    $('aprovar').disabled = true;
    aprovadoAqui = Date.now(); if (estado) desenhar();
    $('pix').scrollIntoView({ behavior: 'smooth', block: 'center' });
    mandar('', { tipo: 'aprovar' }).then(function () {
      toast('Aprovado! Preparando o seu pagamento…');
      ciclo();
    }).catch(function () { aprovadoAqui = 0; $('aprovar').disabled = false; if (estado) desenhar(); });
  };

  // ---------- EDITOR (controlado) ----------
  var ed = { ferr: 'texto', doc: null, pilha: [], mudou: [], cor: '', fotosNovas: 0 };
  var edCarregado = '';
  var PALETA = ['#1f6feb', '#0ea5a4', '#16a34a', '#d97706', '#dc2626', '#db2777', '#7c3aed', '#111827', '#b08d57'];
  var EDITAVEIS = 'h1,h2,h3,h4,h5,h6,p,li,a,button,figcaption,blockquote,small,label,td,th,dt,dd,span,strong,em,b';

  function abrirEditor() {
    if (!estado || !estado.previaUrl) return;
    if (edCarregado === estado.previaUrl + (estado.info || {}).versao && ed.doc) return;
    edCarregado = estado.previaUrl + (estado.info || {}).versao;
    ed.pilha = []; ed.mudou = []; ed.fotosNovas = 0; atualizarBotoes();
    $('ed-painel').innerHTML = '<p class="cg-dica">Carregando o seu site para editar…</p>';
    fetch(estado.previaUrl + (estado.previaUrl.indexOf('?') < 0 ? '?' : '&') + 'e=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.text(); }).then(function (html) {
      var base = '<base href="' + estado.previaUrl.replace(/"/g, '') + '">';
      var estilo = '<style id="cg-editor">[data-cg-alvo]{outline:2px dashed #3fd2ff!important;outline-offset:3px;cursor:pointer}[contenteditable]{outline:3px solid #4c8df6!important;outline-offset:3px;background:rgba(76,141,246,.08)}html{scroll-behavior:smooth}</style>';
      html = /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, function (m) { return m + base + estilo; }) : base + estilo + html;
      var f = $('ed-frame');
      // auditoria 23/10/2026: a prévia editada nunca roda script aqui dentro (mesma origem da página do pedido). O editor só
      // precisa do contentDocument (allow-same-origin); os cliques são ouvidos daqui de fora.
      f.setAttribute('sandbox', 'allow-same-origin');
      if (f.getAttribute('sandbox') !== 'allow-same-origin' || !f.sandbox || f.sandbox.contains('allow-scripts')) throw new Error('editor sem sandbox');
      f.onload = function () { ed.doc = f.contentDocument; ligarDoc(); escolherFerr(ed.ferr); };
      f.srcdoc = html;
    }).catch(function () { $('ed-painel').innerHTML = '<p class="cg-dica">Não consegui abrir o editor agora. Peça o ajuste na conversa.</p>'; });
  }
  function foto() { return ed.doc; }
  function guardar() { ed.pilha.push(ed.doc.documentElement.innerHTML); if (ed.pilha.length > 40) ed.pilha.shift(); atualizarBotoes(); }
  function atualizarBotoes() { $('desfazer').disabled = !ed.pilha.length; $('salvar').disabled = !ed.mudou.length; $('salvar').textContent = ed.mudou.length ? 'Salvar ' + ed.mudou.length + (ed.mudou.length > 1 ? ' ajustes' : ' ajuste') : 'Salvar ajustes'; }
  $('desfazer').onclick = function () {
    if (!ed.pilha.length) return;
    ed.doc.documentElement.innerHTML = ed.pilha.pop(); ed.mudou.pop();
    ligarDoc(); escolherFerr(ed.ferr); atualizarBotoes();
  };
  function soTexto(el) {
    if (!el || !el.textContent.trim()) return false;
    return Array.prototype.every.call(el.children, function (c) { return /^(BR|STRONG|EM|B|I|SPAN|SMALL)$/.test(c.tagName) && !c.querySelector('img,svg,video'); });
  }
  function alvoTexto(n) { while (n && n !== ed.doc.body) { if (n.matches && n.matches(EDITAVEIS) && soTexto(n)) return n; n = n.parentElement; } return null; }
  function ligarDoc() {
    var d = ed.doc; if (!d) return;
    d.addEventListener('click', function (ev) {
      var a = ev.target.closest ? ev.target.closest('a,button,form') : null;
      if (a) ev.preventDefault();
      if (ed.ferr === 'texto') {
        var el = alvoTexto(ev.target); if (!el || el.isContentEditable) return;
        ev.preventDefault();
        var antes = el.textContent; guardar();
        el.setAttribute('contenteditable', 'plaintext-only');
        if (el.contentEditable !== 'plaintext-only') el.setAttribute('contenteditable', 'true');
        el.focus();
        el.addEventListener('blur', function sair() {
          el.removeEventListener('blur', sair); el.removeAttribute('contenteditable');
          if (el.textContent.trim() === antes.trim()) { ed.pilha.pop(); atualizarBotoes(); return; }
          if (!el.textContent.trim()) el.textContent = antes;
          ed.mudou.push('texto "' + antes.trim().slice(0, 40) + '" -> "' + el.textContent.trim().slice(0, 60) + '"'); atualizarBotoes();
        });
        el.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !/^(P|LI|BLOCKQUOTE)$/.test(el.tagName)) { e.preventDefault(); el.blur(); } });
      } else if (ed.ferr === 'foto') {
        var img = ev.target.closest && ev.target.closest('img');
        if (!img) return;
        ev.preventDefault();
        if (ed.fotosNovas >= 3) { toast('Até 3 fotos novas por rodada.'); return; }
        var inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*';
        inp.onchange = function () {
          var f = inp.files && inp.files[0]; if (!f) return;
          CG.comprimir(f).then(function (url) {
            guardar(); img.removeAttribute('srcset'); img.src = url; img.setAttribute('data-cg-nova', '1');
            var pic = img.closest('picture'); if (pic) Array.prototype.forEach.call(pic.querySelectorAll('source'), function (s) { s.remove(); });
            ed.fotosNovas++; ed.mudou.push('foto trocada'); atualizarBotoes();
          }).catch(function (e) { toast(e.message); });
        };
        inp.click();
      }
    }, true);
    d.addEventListener('submit', function (e) { e.preventDefault(); }, true);
    d.addEventListener('mouseover', function (ev) {
      var t = ed.ferr === 'texto' ? alvoTexto(ev.target) : ed.ferr === 'foto' ? (ev.target.closest && ev.target.closest('img')) : null;
      Array.prototype.forEach.call(d.querySelectorAll('[data-cg-alvo]'), function (x) { if (x !== t) x.removeAttribute('data-cg-alvo'); });
      if (t) t.setAttribute('data-cg-alvo', '');
    });
  }
  // cor principal = a cor saturada mais usada no CSS da prévia
  function coresDoDoc() {
    var css = Array.prototype.map.call(ed.doc.querySelectorAll('style:not(#cg-editor)'), function (s) { return s.textContent; }).join('\n') + Array.prototype.map.call(ed.doc.querySelectorAll('[style]'), function (e) { return e.getAttribute('style'); }).join('\n');
    var cont = {};
    (css.match(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g) || []).forEach(function (c) {
      var x = c.length === 4 ? '#' + c[1] + c[1] + c[2] + c[2] + c[3] + c[3] : c; x = x.toLowerCase();
      var r = parseInt(x.substr(1, 2), 16) / 255, g = parseInt(x.substr(3, 2), 16) / 255, b = parseInt(x.substr(5, 2), 16) / 255;
      var mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, s = mx === mn ? 0 : (mx - mn) / (1 - Math.abs(2 * l - 1));
      if (s < 0.25 || l < 0.12 || l > 0.92) return;
      cont[x] = (cont[x] || 0) + 1;
    });
    return Object.keys(cont).sort(function (a, b) { return cont[b] - cont[a]; });
  }
  function trocarCor(de, para) {
    var curto = '#' + de[1] + de[3] + de[5];
    var re = new RegExp(de.replace('#', '#') + '\\b' + (de[1] === de[2] && de[3] === de[4] && de[5] === de[6] ? '|' + curto + '\\b' : ''), 'gi');
    Array.prototype.forEach.call(ed.doc.querySelectorAll('style:not(#cg-editor)'), function (s) { s.textContent = s.textContent.replace(re, para); });
    Array.prototype.forEach.call(ed.doc.querySelectorAll('[style]'), function (e) { e.setAttribute('style', e.getAttribute('style').replace(re, para)); });
  }
  function secoes() {
    var todas = Array.prototype.slice.call(ed.doc.querySelectorAll('section'));
    return todas.filter(function (s) { return !s.parentElement.closest('section'); });
  }
  function nomeSecao(s, i) { var t = s.querySelector('h1,h2,h3'); return (t && t.textContent.trim().slice(0, 40)) || s.id || 'Seção ' + (i + 1); }
  function zapAtual() {
    var a = ed.doc.querySelector('a[href*="wa.me/"],a[href*="api.whatsapp.com"],a[href^="tel:"]');
    if (!a) return '';
    var m = a.getAttribute('href').match(/wa\.me\/(\d+)|phone=(\d+)|tel:\+?([\d\s()-]+)/);
    return m ? (m[1] || m[2] || m[3] || '').replace(/\D/g, '') : '';
  }
  function trocarZap(novo) {
    var velho = zapAtual();
    var dig = novo.replace(/\D/g, ''); if (dig.length >= 10 && dig.length <= 11) dig = '55' + dig;
    Array.prototype.forEach.call(ed.doc.querySelectorAll('a[href]'), function (a) {
      var hr = a.getAttribute('href');
      if (/wa\.me\/\d+/.test(hr)) a.setAttribute('href', hr.replace(/wa\.me\/\d+/, 'wa.me/' + dig));
      else if (/api\.whatsapp\.com\/send\?phone=\d+/.test(hr)) a.setAttribute('href', hr.replace(/phone=\d+/, 'phone=' + dig));
      else if (/^tel:/.test(hr)) a.setAttribute('href', 'tel:+' + dig);
    });
    // número escrito na tela (mesmos dígitos do antigo) vira o novo, formatado
    if (velho) {
      var loc = velho.replace(/^55/, ''), fmt = novo.replace(/\D/g, '').replace(/^55/, '');
      fmt = fmt.length === 11 ? '(' + fmt.slice(0, 2) + ') ' + fmt.slice(2, 7) + '-' + fmt.slice(7) : fmt.length === 10 ? '(' + fmt.slice(0, 2) + ') ' + fmt.slice(2, 6) + '-' + fmt.slice(6) : fmt;
      var w = ed.doc.createTreeWalker(ed.doc.body, NodeFilter.SHOW_TEXT);
      var n; while ((n = w.nextNode())) { n.nodeValue = n.nodeValue.replace(/\+?\d[\d\s().-]{8,18}\d/g, function (x) { var d = x.replace(/\D/g, '').replace(/^55/, ''); return d === loc ? fmt : x; }); }
    }
  }

  function escolherFerr(nome) {
    ed.ferr = nome;
    Array.prototype.forEach.call(document.querySelectorAll('.cg-ferr button'), function (b) { b.setAttribute('aria-pressed', String(b.dataset.ferr === nome)); });
    var p = $('ed-painel'); p.innerHTML = '';
    if (!ed.doc) return;
    if (nome === 'texto') p.innerHTML = '<p class="cg-dica">Toque num título, frase ou botão e escreva. Toque fora para terminar.</p>';
    if (nome === 'foto') p.innerHTML = '<p class="cg-dica">Toque numa imagem do site para trocar por uma foto sua (até 3 por rodada).</p>';
    if (nome === 'cor') {
      var cores = coresDoDoc(); ed.cor = ed.cor || cores[0] || '';
      if (!ed.cor) { p.innerHTML = '<p class="cg-dica">Esta prévia não tem uma cor principal para trocar. Peça na conversa.</p>'; return; }
      p.innerHTML = '<p class="cg-dica">Escolha a cor principal do site.</p><div class="cg-paleta"></div>';
      PALETA.forEach(function (c) {
        var b = document.createElement('button'); b.type = 'button'; b.style.background = c; b.setAttribute('aria-label', 'Cor ' + c); b.setAttribute('aria-pressed', String(c === ed.cor));
        b.onclick = function () { if (c === ed.cor) return; guardar(); trocarCor(ed.cor, c); ed.mudou.push('cor principal ' + ed.cor + ' -> ' + c); ed.cor = c; atualizarBotoes(); escolherFerr('cor'); };
        p.querySelector('.cg-paleta').appendChild(b);
      });
    }
    if (nome === 'secoes') {
      var ss = secoes();
      if (ss.length < 2) { p.innerHTML = '<p class="cg-dica">Esta prévia tem uma seção só. Para mudar a ordem, peça na conversa.</p>'; return; }
      p.innerHTML = '<p class="cg-dica">Mude a ordem ou esconda partes do site.</p><ul class="cg-secoes"></ul>';
      var ul = p.querySelector('ul');
      ss.forEach(function (s, i) {
        var li = document.createElement('li'); li.innerHTML = '<span></span><button type="button" aria-label="Subir">↑</button><button type="button" aria-label="Descer">↓</button><button type="button" aria-label="Esconder">✕</button>';
        li.querySelector('span').textContent = nomeSecao(s, i);
        var bs = li.querySelectorAll('button');
        bs[0].disabled = i === 0 || ss[i - 1].parentElement !== s.parentElement;
        bs[1].disabled = i === ss.length - 1 || ss[i + 1].parentElement !== s.parentElement;
        bs[0].onclick = function () { guardar(); s.parentElement.insertBefore(s, ss[i - 1]); ed.mudou.push('seção "' + nomeSecao(s, i) + '" subiu'); atualizarBotoes(); escolherFerr('secoes'); s.scrollIntoView({ behavior: 'smooth' }); };
        bs[1].onclick = function () { guardar(); s.parentElement.insertBefore(ss[i + 1], s); ed.mudou.push('seção "' + nomeSecao(s, i) + '" desceu'); atualizarBotoes(); escolherFerr('secoes'); s.scrollIntoView({ behavior: 'smooth' }); };
        bs[2].onclick = function () { if (ss.length <= 2) { toast('O site precisa de pelo menos 2 partes.'); return; } guardar(); var nm = nomeSecao(s, i); s.remove(); ed.mudou.push('seção "' + nm + '" escondida'); atualizarBotoes(); escolherFerr('secoes'); };
        ul.appendChild(li);
      });
    }
    if (nome === 'zap') {
      var atual = zapAtual();
      p.innerHTML = '<p class="cg-dica">Número dos botões de WhatsApp e telefone do site.</p><div style="display:flex;gap:8px;margin-bottom:10px"><input class="cg-entrada" inputmode="tel" placeholder="(DDD) 99999-9999"><button class="cg-btn cg-btn-linha cg-btn-mini" type="button">Trocar</button></div>';
      var inp = p.querySelector('input'); inp.value = atual ? atual.replace(/^55/, '') : '';
      p.querySelector('button').onclick = function () {
        var d = inp.value.replace(/\D/g, '');
        if (d.length < 10 || d.length > 13) { toast('Número com DDD, por favor.'); return; }
        guardar(); trocarZap(inp.value); ed.mudou.push('WhatsApp/telefone -> ' + d); atualizarBotoes(); toast('Número trocado em todos os botões.');
      };
    }
  }
  Array.prototype.forEach.call(document.querySelectorAll('.cg-ferr button'), function (b) { b.onclick = function () { escolherFerr(b.dataset.ferr); }; });

  $('salvar').onclick = function () {
    if (!ed.doc || !ed.mudou.length) return;
    var i = (estado && estado.info) || {};
    if (i.rodadasRestantes === 0) { toast('As rodadas de ajuste da prévia acabaram. Aprove e o que faltar a gente ajusta depois, na sala do site.'); return; }
    if (ed.doc.activeElement && ed.doc.activeElement.blur) ed.doc.activeElement.blur();
    var clone = ed.doc.documentElement.cloneNode(true);
    var fotos = [];
    Array.prototype.forEach.call(clone.querySelectorAll('img[data-cg-nova]'), function (img) {
      if (fotos.length < 3 && /^data:image\//.test(img.getAttribute('src') || '')) { fotos.push(img.getAttribute('src')); img.setAttribute('src', 'fotos/cliente-novo-' + (fotos.length - 1) + '.jpg'); }
      img.removeAttribute('data-cg-nova');
    });
    Array.prototype.forEach.call(clone.querySelectorAll('#cg-editor, base'), function (x) { x.remove(); });
    Array.prototype.forEach.call(clone.querySelectorAll('[data-cg-alvo],[contenteditable]'), function (x) { x.removeAttribute('data-cg-alvo'); x.removeAttribute('contenteditable'); });
    var html = '<!doctype html>\n' + clone.outerHTML;
    $('salvar').disabled = true; $('salvar').textContent = 'Enviando…';
    var resumo = ed.mudou.join('; ').slice(0, 580);
    mandar(resumo, { tipo: 'edicao', html: html, fotos: fotos }).then(function () {
      ed.mudou = []; ed.pilha = []; atualizarBotoes();
      toast('Ajustes enviados! A nova versão aparece em instantes.');
      if (!ehLargo()) abrirAba('previa');
    }).catch(function () { atualizarBotoes(); });
  };

  // ---------- relógio ----------
  // atualiza sozinha: ~3 s com algo andando (gerando, aprovado esperando o Pix, conversa recente), ~15 s parada;
  // aba oculta = pausa; ao voltar, atualiza na hora
  function emAndamento() {
    if (!estado) return true;
    var i = estado.info || {}, ms = estado.mensagens || [], ult = ms[ms.length - 1];
    if (/fila|fazendo|ajustando|montando|publicando|aplicando|preparando|gerando/i.test(estado.situacaoTexto || '')) return true;
    var ap = aprovacaoPendente(); if ((ap && Date.now() - ap < 10 * 60000) || (i.projeto && estado.projeto && estado.projeto.gerando)) return true;
    return !!(ult && Date.now() - (Date.parse(ult.em) || 0) < 5 * 60000);
  }
  var proxima = null;
  function ciclo() {
    clearTimeout(proxima); proxima = null;
    if (document.hidden) return;
    carregar().finally(function () { if (!document.hidden && !encerrado) { clearTimeout(proxima); proxima = setTimeout(ciclo, emAndamento() ? 3000 : 15000); } });
  }
  // outro pedido aberto na mesma aba (link novo colado): recarrega com o pedido certo
  window.addEventListener('hashchange', function () { location.reload(); });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) ciclo(); else { clearTimeout(proxima); proxima = null; } });
  if (ehLargo()) { $('painel-conversa').hidden = false; }
  ciclo();
})();
