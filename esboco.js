/* ClickGo: formulário da prévia v2 (passo a passo + prévia ao vivo) -> fila pública (/api/clickgo/pedido) -> página só do
   cliente (/acompanhar/#id.chave). Contrato da API igual ao v1: negocio, ramo, cidade, tipo, quer, servicos, cores, whatsapp,
   email, instagram, site_url (isca), t0, aceite, fotos (até 3, CG.comprimir), precisa (lista fechada), substitui {id,k}. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var form = $('#form');
  var t0 = Date.now();
  var api = new URLSearchParams(location.search).get('api');
  var menosMov = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fotos = [];
  var cardFotos = [];
  var passos = $$('.ps', form);
  var ordem = passos.map(function (p) { return p.getAttribute('data-p'); });
  var atual = 0, daRevisao = false, waOficial = false, enviando = false;
  var erro = $('#erro'), botao = $('#enviar'), botaoTxt = $('#enviar-txt'), voltar = $('#voltar');
  var RASCUNHO = 'cg_rascunho';
  var store = { get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* cheio ou bloqueado */ } }, del: function (k) { try { localStorage.removeItem(k); } catch (e) { /* bloqueado */ } } };

  /* ---------- ícones (traço 24x24) ---------- */
  var IC = {
    tesoura: 'M6 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM20 4 8.1 15.9M14.5 14.5 20 20M8.1 8.1 12 12',
    dente: 'M12 5.5C10 4 7 3.5 5.5 5S4 10 5.5 13c.8 1.6 1 4 1.5 6 .3 1.3 1.8 1.3 2.2 0l1-3.5c.4-1.2 3.2-1.2 3.6 0l1 3.5c.4 1.3 1.9 1.3 2.2 0 .5-2 .7-4.4 1.5-6C20 10 20 6.5 18.5 5S14 4 12 5.5z',
    cruz: 'M9 3h6v6h6v6h-6v6H9v-6H3V9h6z',
    garfo: 'M7 3v8M4 3v5a3 3 0 0 0 6 0V3M7 11v10M17 21V3c-2.5 1.5-4 4.5-4 8h4',
    cafe: 'M4 8h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM17 9h1.5a2.5 2.5 0 0 1 0 5H17M8 2v3M12 2v3',
    pizza: 'M12 3 3 20c6 2 12 2 18 0zM9 12h.01M14 15h.01M12 8.5 9 14',
    haltere: 'M6.5 6.5v11M17.5 6.5v11M3 9.5v5M21 9.5v5M6.5 12h11',
    pata: 'M12 20c-3 0-5-1.5-5-3.5S9.5 12 12 12s5 2.5 5 4.5-2 3.5-5 3.5zM6 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM9.5 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM14.5 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
    balanca: 'M12 3v18M7 21h10M5 7h14M5 7l-3 7a3 3 0 0 0 6 0zM19 7l-3 7a3 3 0 0 0 6 0z',
    grafico: 'M3 3v18h18M7 15l4-4 3 3 5-6',
    chave: 'M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.5-.5-.5-2.5z',
    casa: 'M3 11 12 4l9 7M5 10v10h14V10M10 20v-6h4v6',
    brilho: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z',
    sacola: 'M6 7h12l1 14H5zM9 7V6a3 3 0 0 1 6 0v1',
    livro: 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 21V5M8 7h7',
    predio: 'M4 21V4h10v17M14 9h6v12M8 8h2M8 12h2M8 16h2M17 13h1M17 17h1M3 21h18',
    loja: 'M3 9l1.5-5h15L21 9M3 9v1a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0V9M5 12v8h14v-8M10 20v-5h4v5'
  };
  var REGRAS = [
    [/barb|cabel|sal[aã]o/i, 'tesoura'], [/odont|dent/i, 'dente'], [/cl[ií]nic|m[eé]dic|sa[uú]de|fisio|psic|nutri|hospital|farm/i, 'cruz'],
    [/pizz/i, 'pizza'], [/caf[eé]|padar|doce|confeit|bolo|sorvet|a[cç]a[ií]/i, 'cafe'], [/restaur|lanch|hamb|comida|marmit|food|bar\b|churras|sushi|espeto/i, 'garfo'],
    [/academ|crossfit|pilates|yoga|fit|esporte/i, 'haltere'], [/pet|vet|banho e tosa/i, 'pata'], [/advoc|jur[ií]d|direito/i, 'balanca'],
    [/contab|financ|consult/i, 'grafico'], [/oficin|mec[aâ]n|auto|carro|moto|borrach/i, 'chave'], [/imobili|im[oó]v|constru|arquitet|reforma/i, 'casa'],
    [/est[eé]tic|beleza|unha|manicure|maqui|spa|sobrancelha|depil/i, 'brilho'], [/loja|roupa|moda|boutique|cal[cç]ad|presente|joia/i, 'sacola'],
    [/escola|curso|aula|ingl[eê]s|idioma|professor/i, 'livro'], [/escrit|empresa|ind[uú]stria|log[ií]stic/i, 'predio']
  ];
  function iconeDe(ramo) { for (var i = 0; i < REGRAS.length; i++) if (REGRAS[i][0].test(ramo || '')) return REGRAS[i][1]; return 'loja'; }
  function svgIc(nome) { return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + IC[nome] + '"/></svg>'; }

  var RAMOS = {
    // 23/10/2026 (dono): a ClickGo vende só cardápio digital e SITE COM AGENDA; o site comum está em construção
    site: ['Barbearia', 'Salão de beleza', 'Clínica', 'Odontologia', 'Estética', 'Manicure', 'Psicólogo', 'Fisioterapia', 'Pet shop', 'Pilates', 'Personal trainer', 'Tatuagem'],
    cardapio: ['Restaurante', 'Lanchonete', 'Pizzaria', 'Hamburgueria', 'Açaí', 'Cafeteria', 'Doceria', 'Marmitaria'],
    sistema: ['Clínica', 'Escritório', 'Contabilidade', 'Advocacia', 'Escola', 'Loja', 'Imobiliária', 'Indústria']
  };
  RAMOS.automacao = RAMOS.sistema;
  var EXEMPLOS = {
    automacao: ['Quando chegar um pedido, avisar o cliente no WhatsApp e anotar numa planilha', 'Lembrete automático do horário marcado', 'Cobrança e recibo enviados sozinhos'],
    sistema: ['Ler meus contratos em PDF e responder dúvidas da equipe', 'Controle de clientes e agenda da equipe', 'Área para o cliente acompanhar o pedido']
  };
  var PALETAS = [
    ['Azul e noite', '#3fd2ff', '#0a1426'], ['Preto e dourado', '#d4af37', '#111111'], ['Vinho e creme', '#9b1d3a', '#f5e6d3'], ['Verde e floresta', '#2fbf71', '#0f2a1d'],
    ['Rosa e ameixa', '#ff6fa5', '#2a0f1e'], ['Laranja e café', '#ff7a1a', '#1c130b'], ['Lilás e noite', '#9b8cff', '#140f2a'], ['Vermelho e branco', '#e63946', '#ffffff']
  ];
  var NOMES_COR = { preto: '#111111', branco: '#ffffff', dourado: '#d4af37', ouro: '#d4af37', prata: '#c0c7d0', cinza: '#7a8594', azul: '#2f6fed', marinho: '#13294b', ciano: '#3fd2ff', turquesa: '#22c3b8', verde: '#2fbf71', 'verde-escuro': '#14532d', vermelho: '#e63946', vinho: '#7b1e3a', bordo: '#7b1e3a', rosa: '#ff6fa5', pink: '#ff4f9a', roxo: '#7c4dff', lilas: '#b39ddb', 'lilás': '#b39ddb', laranja: '#ff7a1a', amarelo: '#ffc928', marrom: '#7a4a2a', bege: '#e8d8bf', creme: '#f5e6d3', nude: '#e3c4a8' };
  var CARDAPIO = { whats: ['contato', 'Pedido no WhatsApp'], entrega: ['vender', 'Entrega com taxa por bairro'], qr: ['', 'QR Code na mesa'], muitos: ['catalogo', 'Muitos itens (mais de 30)'] };
  var ROT_PRECISA = { contato: 'Contato no WhatsApp', agendar: 'Agendar horário', vender: 'Vender online', catalogo: 'Catálogo com muitos itens', paginas: 'Várias páginas', login: 'Área do cliente' };

  /* ---------- leitura do formulário ---------- */
  function val(nome) { var el = form.elements[nome]; if (!el) return ''; if (el.length !== undefined && !el.tagName) { var r = $$('[name="' + nome + '"]:checked', form)[0]; return r ? r.value : ''; } return String(el.value || '').trim(); }
  function marcados(nome) { return $$('[name="' + nome + '"]:checked', form).map(function (i) { return i.value; }); }
  function oque() { return val('oque'); }
  function projeto() { var t = oque(); return t === 'sistema' || t === 'automacao'; }

  /* (24/10/2026) a malha de pontos do fundo saiu: fundo sólido, leve no celular */

  /* ---------- mascote ---------- */
  function robo(classe, el) {
    el = el || (passos[atual] && passos[atual].querySelector('.robo')); if (!el) return;
    el.classList.remove('r-acena', 'r-ok', 'r-nao', 'r-festa');
    void el.getBoundingClientRect();
    el.classList.add(classe);
  }

  /* ---------- prévia ao vivo ---------- */
  var tel = $('#tel'), tela = $('#tela'), ms = $('#ms'), sx = $('#sx'), au = $('#au');
  var prevAbre = $('#prev-abre'), prevBox = $('#prev');
  var visiveis = {};
  function corDe(txt) {
    var hex = String(txt || '').match(/#[0-9a-f]{6}\b/ig);
    if (hex && hex.length) return [hex[0], hex[1] || null];
    var achadas = [], t = String(txt || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    Object.keys(NOMES_COR).forEach(function (n) { var nn = n.normalize('NFD').replace(/[̀-ͯ]/g, ''); var i = t.search(new RegExp('\\b' + nn + '\\b')); if (i >= 0) achadas.push([i, NOMES_COR[n]]); });
    achadas.sort(function (a, b) { return a[0] - b[0]; });
    return achadas.length ? [achadas[0][1], achadas[1] ? achadas[1][1] : null] : [null, null];
  }
  function luz(hex) { var n = parseInt(hex.slice(1), 16); return (0.299 * (n >> 16) + 0.587 * (n >> 8 & 255) + 0.114 * (n & 255)) / 255; }
  function misturar(hex, fator) { var n = parseInt(hex.slice(1), 16); var r = Math.round((n >> 16) * fator), g = Math.round((n >> 8 & 255) * fator), b = Math.round((n & 255) * fator); return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1); }
  function itensDe(txt) {
    txt = String(txt || '');
    // lista do cardápio: uma linha por item ("Nome | R$ 25,90 | descrição"); "Lanches:" sozinho é categoria
    var partes = /\n|\|/.test(txt) ? txt.split(/\n+/) : txt.split(/[,;]+/);
    return partes.map(function (s) { s = s.trim(); if (/\|/.test(s)) { var c = s.split('|').map(function (x) { return x.trim(); }); s = c[0] + (c[1] ? ': ' + c[1] : ''); } return s.replace(/^[-•*·]\s*/, ''); })
      .filter(function (s) { return s && !/:\s*$/.test(s); }).slice(0, 4).map(function (s) {
      var m = s.match(/^(.*?)(?:[:\-–]\s*)?(R\$\s*[\d.,]+|\d+[.,]?\d*\s*(?:reais)?)\s*$/i);
      return m && m[1].trim() ? [m[1].trim(), /R\$/i.test(m[2]) ? m[2].replace(/\s+/, ' ') : 'R$ ' + m[2].replace(/\s*reais/i, '')] : [s, ''];
    });
  }
  /* tíquetes (24/10/2026, visual tátil): cada serviço/item escrito vira uma etiqueta com o preço; só textContent, nada vai no pedido */
  var tiquesEl = $('#tiques');
  function desenharTiques(itens) {
    if (!tiquesEl) return;
    var chave = JSON.stringify(itens); if (tiquesEl.getAttribute('data-n') === chave) return;
    tiquesEl.setAttribute('data-n', chave); tiquesEl.textContent = '';
    itens.forEach(function (it, i) {
      var d = document.createElement('div'); d.className = 'tq'; d.style.animationDelay = (i * 70) + 'ms';
      var ic = document.createElement('span'); ic.className = 'tq-ic'; ic.textContent = (it[0].match(/[a-zà-ú0-9]/i) || [''])[0];
      var n = document.createElement('b'); n.className = 'tq-n'; n.textContent = it[0];
      var p = document.createElement('span'); p.className = 'tq-p' + (it[1] ? '' : ' sem'); p.textContent = it[1] || 'sem preço';
      d.appendChild(ic); d.appendChild(n); d.appendChild(p); tiquesEl.appendChild(d);
    });
  }
  function mostrar(bloco, on) {
    var els = $$('[data-b="' + bloco + '"]', tela);
    var era = !!visiveis[bloco]; visiveis[bloco] = !!on;
    els.forEach(function (el) { el.classList.toggle('on', !!on); });
    if (on && !era) {
      var el = els[0];
      if (el && el.offsetTop && !el.classList.contains('ms-zap')) setTimeout(function () { ms.scrollTop = Math.max(0, el.offsetTop - 60); }, 60);
      avisarPrevia();
    }
  }
  var ultimoAviso = 0;
  function avisarPrevia() {
    if (Date.now() - ultimoAviso < 600) return; ultimoAviso = Date.now();
    tel.classList.remove('pisca'); void tel.offsetWidth; tel.classList.add('pisca');
    if (prevAbre) { prevAbre.classList.remove('novo'); void prevAbre.offsetWidth; prevAbre.classList.add('novo'); }
  }
  var iconeAtual = '';
  function atualizarPrevia() {
    var tipo = oque() || 'site', nome = val('negocio'), ramo = val('ramo'), cidade = val('cidade');
    // cores
    var c = corDe(val('cores')), p = c[0] || '#c43014', s = c[1] || '#171310';
    if (c[1] && luz(c[1]) > .75 && luz(p) > .75) s = '#171310';
    tel.style.setProperty('--p', p); tel.style.setProperty('--s', s); tel.style.setProperty('--pt', luz(p) > .55 ? '#171310' : '#ffffff');
    document.documentElement.style.setProperty('--p', p);
    ms.classList.toggle('claro', luz(s) > .6);
    // ícone do ramo
    var ic = iconeDe(ramo + ' ' + nome);
    if (ic !== iconeAtual) { iconeAtual = ic; $('#ms-logo').innerHTML = svgIc(ic); $('#sx-logo').innerHTML = svgIc(ic); $('#au-logo').innerHTML = svgIc(ic); }
    // sistema / automação x site/cardápio
    sx.hidden = tipo !== 'sistema'; au.hidden = tipo !== 'automacao'; ms.hidden = projeto();
    $('#sx-nome').textContent = nome ? 'Sistema ' + nome : 'Seu sistema';
    var faz = val('sis_faz'), curto = function (t, n) { return t.length > n ? t.slice(0, n - 2) + '…' : t; };
    $('#sx-pergunta').textContent = faz ? curto(faz, 60) : 'Qual o prazo deste contrato?';
    $('#au-nome').textContent = nome || 'Sua automação';
    $('#au-gatilho').textContent = faz ? curto(faz.replace(/^quando\s+/i, ''), 70) : 'chega um pedido';
    var env = marcados('sis_env'), demo = !env.length;
    $$('.au-no[data-env]', au).forEach(function (n) {
      var k = n.getAttribute('data-env'), on = demo ? (k === 'WhatsApp' || k === 'planilha') : env.indexOf(k) >= 0;
      if (on && !n.classList.contains('on')) avisarPrevia();
      n.classList.toggle('on', on); n.classList.toggle('demo', demo);
    });
    if (projeto()) return;
    var nm = $('#ms-nome'), tt = $('#ms-tit');
    nm.textContent = nome || 'Seu negócio'; tt.textContent = nome || 'Seu negócio';
    nm.classList.toggle('vazio', !nome); tt.classList.toggle('vazio', !nome);
    $('#ms-ramo').textContent = [ramo || (tipo === 'cardapio' ? 'Cardápio' : 'Seu ramo'), cidade].filter(Boolean).join(' · ');
    var precisa = tipo === 'cardapio' ? [] : marcados('precisa'), cpx = tipo === 'cardapio' ? marcados('cpx') : [];
    $('#ms-cta').textContent = tipo === 'cardapio' ? (cpx.indexOf('whats') >= 0 ? 'Pedir no WhatsApp' : 'Ver cardápio') : precisa.indexOf('agendar') >= 0 ? 'Agendar agora' : precisa.indexOf('vender') >= 0 ? 'Ver a loja' : 'Chamar no WhatsApp';
    // lista de serviços / itens
    var itens = itensDe(val('servicos'));
    desenharTiques(itens);
    if (!itens.length && tipo === 'cardapio') itens = [['Prato da casa', 'R$ --'], ['Bebidas', 'R$ --'], ['Sobremesa', 'R$ --']];
    $('#ms-lista-t').textContent = tipo === 'cardapio' ? 'Cardápio' : 'Serviços';
    var ul = $('#ms-lista'), html = itens.map(function (it) { return '<li><span></span><b></b></li>'; }).join('');
    if (ul.getAttribute('data-n') !== JSON.stringify(itens)) {
      ul.innerHTML = html; $$('li', ul).forEach(function (li, i) { li.firstChild.textContent = itens[i][0]; li.lastChild.textContent = itens[i][1]; li.style.animationDelay = (i * 60) + 'ms'; });
      ul.setAttribute('data-n', JSON.stringify(itens));
    }
    $('#ms-loja-t').textContent = tipo === 'cardapio' ? 'Peça agora' : 'Loja';
    mostrar('paginas', precisa.indexOf('paginas') >= 0);
    mostrar('agendar', precisa.indexOf('agendar') >= 0);
    mostrar('lista', itens.length > 0);
    mostrar('vender', precisa.indexOf('vender') >= 0);
    mostrar('entrega', cpx.indexOf('entrega') >= 0);
    mostrar('catalogo', precisa.indexOf('catalogo') >= 0 || cpx.indexOf('muitos') >= 0);
    mostrar('qr', cpx.indexOf('qr') >= 0);
    mostrar('login', precisa.indexOf('login') >= 0);
    mostrar('contato', precisa.indexOf('contato') >= 0 || cpx.indexOf('whats') >= 0);
    mostrar('cidade', !!cidade);
    $('#ms-cidade').textContent = cidade; $('#ms-insta').textContent = val('instagram');
    // fotos: a 1ª vira o fundo do topo, as outras vão na galeria
    var hero = $('#ms-hero');
    if (fotos[0]) { hero.style.backgroundImage = 'url("' + fotos[0] + '")'; hero.classList.add('foto'); } else { hero.style.backgroundImage = ''; hero.classList.remove('foto'); }
    var gal = $('#ms-gal'), chave = fotos.length + ':' + fotos.map(function (f) { return f.length; }).join(',');
    if (gal.getAttribute('data-n') !== chave) { gal.innerHTML = ''; fotos.forEach(function (f) { var im = document.createElement('img'); im.alt = ''; im.src = f; gal.appendChild(im); }); gal.setAttribute('data-n', chave); }
    mostrar('fotos', fotos.length > 1);
  }
  var agPrev = 0;
  function previaJa() { cancelAnimationFrame(agPrev); agPrev = requestAnimationFrame(atualizarPrevia); }
  // prévia no celular
  function abrirPrev(sim) {
    prevBox.classList.toggle('aberta', sim); document.body.classList.toggle('prev-on', sim);
    prevAbre.setAttribute('aria-expanded', String(sim));
    if (sim) $('#prev-fechar').focus(); else prevAbre.focus();
  }
  prevAbre.addEventListener('click', function () { abrirPrev(true); });
  // computador: o celular da prévia cresce até ocupar a altura da tela (zoom), sem passar da largura que sobra ao lado
  function tamanhoPrev() {
    if (innerWidth < 1000) { tel.style.zoom = ''; return; }
    tel.style.zoom = '';
    var topo = Math.max(16, tel.getBoundingClientRect().top + scrollY), porAltura = (innerHeight - topo - 16) / 658, porLargura = (Math.min(document.documentElement.clientWidth, 1180) - 32 - 560 - (parseFloat(getComputedStyle($('#palco')).columnGap) || 96) - 8) / 320;
    tel.style.zoom = String(Math.max(0.8, Math.min(porAltura, porLargura, 1.6)).toFixed(3));
  }
  tamanhoPrev(); addEventListener('resize', tamanhoPrev);
  $('#prev-fechar').addEventListener('click', function () { abrirPrev(false); });
  document.addEventListener('click', function (e) { if (document.body.classList.contains('prev-on') && !prevBox.contains(e.target) && e.target !== prevAbre && !prevAbre.contains(e.target)) abrirPrev(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && document.body.classList.contains('prev-on')) abrirPrev(false); });

  /* ---------- montagem dinâmica dos passos ---------- */
  var sug = $('#ramos'), ramoIn = $('#ramo');
  function desenharRamos() {
    var lista = RAMOS[oque() || 'site'];
    sug.innerHTML = '';
    lista.forEach(function (r) {
      var b = document.createElement('button'); b.type = 'button'; b.innerHTML = svgIc(iconeDe(r)) + '<span></span>'; b.lastChild.textContent = r;
      b.setAttribute('aria-pressed', String(ramoIn.value.trim().toLowerCase() === r.toLowerCase()));
      b.addEventListener('click', function () { ramoIn.value = r; marcarRamo(); salvar(); previaJa(); robo('r-ok'); ramoIn.focus(); });
      sug.appendChild(b);
    });
  }
  function marcarExs() { var v = form.elements.sis_faz.value; $$('#exs button').forEach(function (b) { b.setAttribute('aria-pressed', String(v.indexOf(b.textContent) >= 0)); }); }
  form.elements.sis_faz.addEventListener('input', function () { marcarExs(); });
  function marcarRamo() { $$('button', sug).forEach(function (b) { b.setAttribute('aria-pressed', String(b.textContent.toLowerCase() === ramoIn.value.trim().toLowerCase())); }); }
  ramoIn.addEventListener('input', marcarRamo);

  function ajustarTipo() {
    var t = oque() || 'site';
    var pj = t === 'sistema' || t === 'automacao';
    $$('[data-para]', form).forEach(function (el) { el.hidden = el.getAttribute('data-para').split(' ').indexOf(t) < 0; });
    $('#t-precisa').textContent = t === 'cardapio' ? 'O que o cardápio precisa ter?' : t === 'sistema' ? 'Conta um pouco do sistema' : t === 'automacao' ? 'O que você quer automatizar?' : 'O que o site precisa fazer?';
    $('#d-precisa').textContent = pj ? 'Com as suas palavras. Pode tocar num exemplo.' : 'Marque quantos quiser.';
    $('#r-sisfaz').textContent = t === 'automacao' ? 'O que deve acontecer sozinho?' : 'O que o sistema precisa fazer?';
    var exs = $('#exs'); exs.innerHTML = '';
    (EXEMPLOS[t] || []).forEach(function (tx) {
      var b = document.createElement('button'); b.type = 'button'; b.textContent = tx; b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', function () { var ta = form.elements.sis_faz, atual = ta.value.trim(); ta.value = atual && atual.indexOf(tx) < 0 ? (atual + '. ' + tx).slice(0, 600) : tx; marcarExs(); salvar(); previaJa(); atualizarBotao(); robo('r-ok'); });
      exs.appendChild(b);
    });
    marcarExs();
    $('#r-quer').textContent = t === 'cardapio' ? 'Algo especial no cardápio?' : pj ? 'Mais alguma coisa que a gente precisa saber?' : 'O que não pode faltar?';
    form.elements.quer.placeholder = t === 'cardapio' ? 'Combos, horário de funcionamento, foto dos pratos' : pj ? 'O que mais atrapalha hoje, que programas você já usa' : 'Fotos do espaço, botão para agendar';
    $('#cp-servicos').hidden = pj;
    // cardápio (22/10/2026): lista de itens e preços, um por linha, e/ou a foto/PDF do cardápio atual (lido pela ClickGo)
    var card = t === 'cardapio';
    $('#r-servicos').textContent = card ? 'Itens e preços' : 'Serviços e preços';
    $('#t-servicos').textContent = card ? 'Quais itens e preços?' : 'Quais serviços e preços?';
    form.elements.servicos.placeholder = card ? 'Lanches:\nX-Burger | R$ 25,90 | pão brioche e cheddar\nBatata frita | R$ 16\n\nBebidas:\nRefrigerante lata | R$ 6' : 'Corte R$ 40, barba R$ 30';
    form.elements.servicos.rows = card ? 6 : 2;
    $('#d-servicos').textContent = card ? 'Um item por linha: nome | preço | descrição (opcional). Categoria com dois-pontos ("Bebidas:"). Pode deixar em branco e mandar só a foto do cardápio abaixo.' : '';
    $('#cp-cardfoto').hidden = !card;
    form.elements.negocio.placeholder = card ? 'Ex.: Pizzaria Bella Massa' : pj ? 'Ex.: Contabilidade Silva' : 'Ex.: Barbearia Dois Irmãos';
    $('#ramo').placeholder = card ? 'Ex.: Pizzaria' : pj ? 'Ex.: Escritório' : 'Ex.: Barbearia';
    $('#t-fotos').textContent = pj ? 'Tem prints ou fotos?' : 'Tem fotos?';
    desenharRamos();
  }

  // paletas
  var paletasBox = $('#paletas'), coresIn = $('#cores'), cor1 = $('#cor1'), cor2 = $('#cor2');
  // PALETAS DO RAMO (dono, 27/10/2026): 3 paletas sólidas que combinam com o negócio e o público; o resto (seletor e texto) é
  // o "outra". MESMA tabela de solutiva-app/lib/paletas.js (mudou lá, copie aqui). Ramo fora da tabela = as 8 de sempre.
  // Sem cor e sem logo, o servidor escolhe a 1ª do ramo sozinho (não trava a prévia).
  var PALETAS_RAMO = [
    [/\b(estetic\w*|spa|sobrancelh\w*|cilios|lash\w*|depila\w*|massag\w*|massoterap\w*|manicure|pedicure|nail\w*|unhas?|harmoniza\w*|micropigment\w*|design de sobrancelh\w*|beleza)\b/, [["Rosé, nude e dourado","#b7787a","#f8f1ec","#b8955a"], ["Lilás e branco","#8a72b8","#fbfaff","#d9cff0"], ["Verde-sálvia e creme","#7d9580","#f6f2e9","#c2a878"], ["Preto e dourado","#b8955a","#141210","#f1e6d8"], ["Azul Tiffany e branco","#0a9a95","#f8fcfc","#d9b8a6"], ["Terracota e areia","#b5643f","#f6efe6","#3a2a22"]]],
    [/\b(barbear\w*|barbeir\w*|barber\w*)\b/, [["Preto, madeira e dourado","#c19a5b","#141110","#6b4a2f"], ["Azul-marinho e cobre","#c27c4e","#13213a","#e9dcc7"], ["Verde-garrafa e creme","#1f4d3a","#f4efe4","#b08d57"], ["Vinho e preto","#9b2c3f","#121010","#e9dcc7"], ["Chumbo e laranja","#e07b39","#1f2226","#e9e5df"], ["Preto e branco clássico","#111111","#f6f4f0","#b08d57"]]],
    [/\b(sal[aã]o|cabeleir\w*|cabelo\w*|hair|trancist\w*|trancas|maquiad\w*|make)\b/, [["Rosé e preto","#c98b8b","#151214","#efe3dc"], ["Nude e dourado","#a8844f","#f7f0ea","#d9c3a5"], ["Terracota e creme","#b5643f","#f7f1e8","#3a2a22"], ["Lilás e branco","#8a72b8","#fbfaff","#d9cff0"], ["Preto e dourado","#b8955a","#141210","#f1e6d8"], ["Verde-sálvia e creme","#7d9580","#f6f2e9","#c2a878"]]],
    [/\b(nutri\w*|dietist\w*|emagrec\w*)\b/, [["Verde e creme","#4f7d5a","#f7f4ea","#c9a96e"], ["Pêssego e branco","#e08e6d","#fffaf6","#5f7f63"], ["Verde-oliva e areia","#6b7a3a","#f3eee2","#c58b5c"], ["Verde-menta e branco","#4f9e86","#f7fcfa","#f2b49b"], ["Laranja e creme","#e07b39","#fbf6ee","#4f7d5a"], ["Azul-petróleo e areia","#1f5f74","#f3eee2","#c9a96e"]]],
    [/\b(pet\s?shop|pet|veterin\w*|banho e tosa|tosa|cachorr\w*|gatos?)\b/, [["Azul e amarelo-manteiga","#2f6f9f","#fff9ec","#f2c94c"], ["Verde-água e branco","#3c9d93","#f7fcfb","#f29e4c"], ["Laranja e creme","#e07b39","#fbf6ee","#3d5a6c"], ["Rosa e azul-bebê","#e091a8","#f7fbff","#2f6f9f"], ["Verde e amarelo","#3f8f5a","#fffbea","#f2c94c"], ["Roxo e amarelo","#6a4c9c","#fdf9ee","#f2c94c"]]],
    [/\b(psic[oó]\w*|terapeut\w*|terapia|psicanal\w*|coach\w*)\b/, [["Verde-sálvia e creme","#7d9580","#f6f2e9","#c07a5a"], ["Terracota suave e areia","#c07a5a","#f6efe6","#5d7a94"], ["Azul-acinzentado e branco","#5d7a94","#f8fafb","#c2a878"], ["Lavanda e branco","#7c6fb0","#faf9fd","#c2a878"], ["Rosé e nude","#b7787a","#f8f1ec","#5d7a94"], ["Verde-oliva e creme","#6b7a3a","#f6f2e9","#c07a5a"]]],
    [/\b(cl[ií]nica|consult[oó]rio|m[eé]dic\w*|dentist\w*|odonto\w*|fisio\w*|fonoaudi\w*|podolog\w*|ortodont\w*|enfermag\w*|laborat[oó]rio|sa[uú]de)\b/, [["Azul-petróleo e branco","#1f5f74","#f8fbfc","#7fb7c4"], ["Verde-água e branco","#3c9d93","#f7fcfb","#1f4f4a"], ["Lavanda e cinza-claro","#7c6fb0","#f6f6fa","#3f3a5a"], ["Azul-marinho e branco","#1b2f4b","#f8fafc","#3c9d93"], ["Verde-sálvia e branco","#6f8f78","#fafaf7","#1f4d3a"], ["Rosé e branco","#b7787a","#fdf9f8","#3f3a5a"]]],
    [/\b(personal|pilates|academia|crossfit|yoga|ioga|funcional|treino\w*|dan[cç]a)\b/, [["Grafite e laranja","#e8692c","#17181a","#f3efe9"], ["Verde-sálvia e branco","#6f8f78","#fafaf7","#2f3a33"], ["Azul-marinho e areia","#1d3557","#f3eee2","#e0a458"], ["Preto e verde-limão","#9ccc3a","#121412","#f3efe9"], ["Vermelho e preto","#d63a2f","#141414","#f3efe9"], ["Lilás e branco","#7a5bc7","#fbfaff","#2f2a3a"]]],
    [/\b(tatu\w*|tattoo\w*|piercing)\b/, [["Preto e vermelho","#c0392b","#111111","#e9e1d3"], ["Preto e cinza-osso","#d9cdb8","#121212","#8a8178"], ["Verde-garrafa e preto","#3f8f6b","#0f1110","#d9cdb8"], ["Preto e dourado","#c19a5b","#121110","#e9e1d3"], ["Vinho e preto","#9b2c3f","#100e0e","#d9cdb8"], ["Azul-petróleo e preto","#3f8fa3","#0f1213","#d9cdb8"]]],
    [/\b(advoca\w*|advogad\w*|contab\w*|contador\w*|escrit[oó]rio|imobili[aá]ri\w*|corretor\w*|consultori\w*|seguros?)\b/, [["Azul-marinho, branco e dourado","#1b2f4b","#f8f7f4","#b08d57"], ["Verde-escuro e creme","#1f4d3a","#f6f2e9","#b08d57"], ["Vinho e cinza-claro","#7b1e3a","#f6f5f4","#2b2b2b"], ["Grafite e azul","#2f6f9f","#f7f8fa","#2b2f36"], ["Preto e dourado","#b08d57","#141414","#f3efe9"], ["Azul-petróleo e areia","#1f5f74","#f3eee2","#b08d57"]]],
    [/\b(doce\w*|docinho\w*|confeitar\w*|bolos?|brigadeir\w*|chocolat\w*|tortas?|cupcake\w*)\b/, [["Rosa-chá e creme","#c98a8f","#fdf7f2","#6b4433"], ["Chocolate e creme","#6b4433","#fbf5ec","#d9a679"], ["Lilás e branco","#8a72b8","#fbfaff","#e7b8c4"], ["Azul-bebê e branco","#7aa7d6","#f8fbff","#e7b8c4"], ["Pêssego e creme","#e08e6d","#fffaf6","#6b4433"], ["Verde-menta e rosa","#4f9e86","#fdf8f6","#e091a8"]]],
    [/\b(a[cç]a[ií]\w*|sorvet\w*|gelat\w*)\b/, [["Roxo-açaí e creme","#5b2a6e","#fbf7f2","#7bb661"], ["Roxo e branco","#6a2c86","#ffffff","#f2b134"], ["Roxo-açaí e preto","#9b5bb5","#141014","#7bb661"], ["Vinho e creme","#7b1e3a","#fbf5ec","#7bb661"], ["Roxo e amarelo","#5b2a6e","#fffbea","#f2c94c"], ["Lilás e branco","#8a72b8","#fbfaff","#5b2a6e"]]],
    [/\b(caf[eé]\w*|cafeteria|padari\w*|panific\w*)\b/, [["Café e creme","#6b4433","#f7f1e6","#c58b5c"], ["Verde-escuro e creme","#1f4d3a","#f6f2e9","#c19a5b"], ["Terracota e areia","#b5643f","#f6efe6","#3a2a22"], ["Preto e caramelo","#c58b5c","#141110","#f3efe9"], ["Azul-marinho e creme","#1b2f4b","#f7f1e6","#c58b5c"], ["Rosé e creme","#b7787a","#fbf5ef","#6b4433"]]],
    [/\b(japon\w*|sushi|temaki\w*|oriental|poke|ramen)\b/, [["Vermelho e branco-arroz","#b3261e","#faf7f2","#1c1c1c"], ["Preto e vermelho","#c0392b","#111111","#f3efe9"], ["Preto e dourado","#c19a5b","#121110","#b3261e"], ["Verde-chá e creme","#5e7a3a","#f8f3e8","#b3261e"], ["Azul-índigo e branco","#2b3a67","#faf8f4","#b3261e"], ["Laranja e preto","#e07b39","#131211","#f3efe9"]]],
    [/\b(cardapio|restaurante|lanchonete|lanche\w*|hamburg\w*|burger|pizz\w*|marmit\w*|comida|cozinha|churrasc\w*|espetinh\w*|pastel\w*|salgad\w*|bar|boteco|food ?truck|delivery|quentinh\w*|self ?service|tapioc\w*|crepe\w*|petisc\w*)\b/, [["Vermelho-tomate e creme","#c0392b","#fbf5ea","#2f5d3a"], ["Verde-oliva e creme","#5e7a3a","#f8f3e8","#c0392b"], ["Preto e mostarda","#e1a730","#141210","#f3efe9"], ["Laranja e creme","#e07b39","#fbf6ee","#2f2a26"], ["Vinho e creme","#7b1e3a","#fbf5ea","#c9a96e"], ["Azul-marinho e mostarda","#1b2f4b","#fbf7ee","#e1a730"]]]
  ];
  // fora da tabela: as 6 gerais (mesma lib/paletas.js GERAL)
  var PALETAS_GERAL = [["Azul-petróleo e branco","#1f5f74","#f8fbfc","#e0a458"], ["Grafite e laranja","#e8692c","#17181a","#f3efe9"], ["Verde-sálvia e creme","#7d9580","#f6f2e9","#c2a878"], ["Azul-marinho e dourado","#1b2f4b","#f8f7f4","#b08d57"], ["Rosé e nude","#b7787a","#f8f1ec","#b8955a"], ["Preto e dourado","#b8955a","#141210","#f1e6d8"]];
  var PAL_ATUAL = null;
  function paletasDoRamo() {
    var t = String(val('ramo') + ' ' + val('negocio')).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    for (var i = 0; i < PALETAS_RAMO.length; i++) if (PALETAS_RAMO[i][0].test(t)) return PALETAS_RAMO[i][1].map(function (o) { return [o[0], o[1], o[2], o[3]]; });
    return null;
  }
  function desenharPaletas() {
    var doRamo = paletasDoRamo(), lista = doRamo || PALETAS_GERAL;
    if (PAL_ATUAL && JSON.stringify(PAL_ATUAL) === JSON.stringify(lista)) return;
    PAL_ATUAL = lista; paletasBox.textContent = ''; paletasBox.classList.add('do-ramo');
    lista.forEach(function (pl) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'paleta'; b.setAttribute('aria-pressed', 'false'); b.setAttribute('aria-label', pl[0]); b.title = pl[0];
      b.innerHTML = '<i></i>'; b.firstChild.style.setProperty('--a', pl[1]); b.firstChild.style.setProperty('--b', pl[2]);
      var s = document.createElement('small'); s.textContent = pl[0]; b.appendChild(s);
      b.addEventListener('click', function () { coresIn.value = pl[0] + ' (' + pl.slice(1).filter(Boolean).join(', ') + ')'; cor1.value = pl[1]; cor2.value = pl[2]; marcarPaleta(); salvar(); previaJa(); atualizarBotao(); marcarOk(coresIn); robo('r-ok'); });
      paletasBox.appendChild(b);
    });
    // "As cores da minha logo": o app tira as cores da logo enviada (sem logo, entra a 1ª paleta do ramo)
    var bl = document.createElement('button'); bl.type = 'button'; bl.className = 'paleta paleta-logo'; bl.setAttribute('aria-pressed', 'false'); bl.title = 'As cores da minha logo';
    bl.innerHTML = '<i></i><small>As cores da minha logo</small>';
    bl.addEventListener('click', function () { coresIn.value = 'Cores da logo'; marcarPaleta(); salvar(); previaJa(); atualizarBotao(); marcarOk(coresIn); robo('r-ok'); });
    paletasBox.appendChild(bl);
    marcarPaleta();
  }
  function marcarPaleta() {
    var v = coresIn.value;
    $$('.paleta', paletasBox).forEach(function (b, i) {
      if (b.classList.contains('paleta-logo')) { b.setAttribute('aria-pressed', String(/^cores da logo/i.test(v))); return; }
      var pl = PAL_ATUAL && PAL_ATUAL[i]; b.setAttribute('aria-pressed', String(!!pl && v.indexOf(pl[1]) >= 0 && v.indexOf(pl[2]) >= 0));
    });
  }
  desenharPaletas();
  ramoIn.addEventListener('input', desenharPaletas);
  function corLivre() { coresIn.value = ('Cores ' + cor1.value + ' e ' + cor2.value).slice(0, 120); marcarPaleta(); salvar(); previaJa(); atualizarBotao(); }
  cor1.addEventListener('input', corLivre); cor2.addEventListener('input', corLivre);
  coresIn.addEventListener('input', marcarPaleta);

  /* ---------- fotos: arrastar/soltar, até 3 ---------- */
  var drop = $('#drop'), fInput = $('#foto-input'), caixa = $('#fotos'), cont = $('#foto-cont');
  function desenharFotos() {
    caixa.innerHTML = '';
    fotos.forEach(function (url, i) {
      var d = document.createElement('div'); d.className = 'mi';
      d.innerHTML = '<img alt=""><button type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button>';
      d.firstChild.src = url; d.firstChild.alt = 'Foto ' + (i + 1);
      d.lastChild.setAttribute('aria-label', 'Tirar a foto ' + (i + 1));
      d.lastChild.addEventListener('click', function () { fotos.splice(i, 1); desenharFotos(); previaJa(); });
      caixa.appendChild(d);
    });
    if (fotos.length && fotos.length < maxFotos()) { var a = document.createElement('button'); a.type = 'button'; a.className = 'mi-add'; a.setAttribute('aria-label', 'Adicionar mais fotos'); a.textContent = '+'; a.addEventListener('click', function () { fInput.click(); }); caixa.appendChild(a); }
    drop.classList.toggle('cheio', fotos.length > 0 || maxFotos() < 1);
    cont.textContent = fotos.length + ' de ' + maxFotos();
    atualizarBotao();
  }
  // o pedido leva até 3 imagens no total: no cardápio, as do cardápio atual (foto/PDF) vêm primeiro e tiram vaga das fotos do site
  function maxFotos() { return 3 - (oque() === 'cardapio' ? cardFotos.length : 0); }
  function receber(lista) {
    lista = Array.prototype.slice.call(lista || []).filter(function (f) { return /^image\//.test(f.type); }).slice(0, Math.max(0, maxFotos() - fotos.length));
    if (!lista.length) { if (maxFotos() - fotos.length <= 0) mostrarErro('Já tem ' + (3 - maxFotos()) + ' imagem(ns) do cardápio: cabem mais ' + maxFotos() + ' foto(s) do negócio.'); return; }
    Promise.all(lista.map(function (f) { return CG.comprimir(f).catch(function () { return null; }); })).then(function (urls) {
      var n = 0; urls.forEach(function (u) { if (u && fotos.length < maxFotos()) { fotos.push(u); n++; } });
      fInput.value = ''; desenharFotos(); previaJa(); if (n) robo('r-ok'); else mostrarErro('Não consegui ler essa foto. Tente outra.');
    });
  }
  fInput.addEventListener('change', function () { receber(fInput.files); });
  ['dragenter', 'dragover'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('sobre'); }); });
  ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('sobre'); }); });
  drop.addEventListener('drop', function (e) { receber(e.dataTransfer && e.dataTransfer.files); });
  // soltar foto em qualquer lugar do passo de fotos
  document.addEventListener('dragover', function (e) { if (ordem[atual] === 'fotos') e.preventDefault(); });
  document.addEventListener('drop', function (e) { if (ordem[atual] === 'fotos' && !drop.contains(e.target)) { e.preventDefault(); receber(e.dataTransfer && e.dataTransfer.files); } });

  /* ---------- cardápio atual: foto ou PDF (até 2 imagens/páginas), lido pela ClickGo e conferido no chat ---------- */
  // PDF vira imagem aqui mesmo (pdf.js da própria página, sem CDN: a CSP só deixa script do site); página = JPEG até ~1600 px
  var dropCard = $('#drop-card'), cardInput = $('#card-input'), cardCaixa = $('#card-fotos'), cardCont = $('#card-cont');
  var MAX_CARD = 2, PDFJS = '/assets/vendor/pdfjs-3.11.174/';
  function desenharCard() {
    cardCaixa.innerHTML = '';
    cardFotos.forEach(function (url, i) {
      var d = document.createElement('div'); d.className = 'mi pagina';
      d.innerHTML = '<img alt=""><button type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button>';
      d.firstChild.src = url; d.firstChild.alt = 'Cardápio, imagem ' + (i + 1);
      d.lastChild.setAttribute('aria-label', 'Tirar a imagem ' + (i + 1) + ' do cardápio');
      d.lastChild.addEventListener('click', function () { cardFotos.splice(i, 1); desenharCard(); desenharFotos(); });
      cardCaixa.appendChild(d);
    });
    dropCard.classList.toggle('cheio', cardFotos.length >= MAX_CARD);
    cardCont.textContent = cardFotos.length ? cardFotos.length + ' de ' + MAX_CARD + ' · a gente lê e te mostra para conferir' : 'até 2 imagens ou páginas';
    // foto do negócio que passou do total de 3 sai (as do cardápio têm preferência)
    if (fotos.length > maxFotos()) { fotos.length = Math.max(0, maxFotos()); desenharFotos(); previaJa(); }
    atualizarBotao();
  }
  var pdfjsP = null;
  function carregarPdfjs() {
    if (pdfjsP) return pdfjsP;
    pdfjsP = new Promise(function (ok, falha) {
      var s = document.createElement('script'); s.src = PDFJS + 'pdf.min.js';
      s.onload = function () { var L = window.pdfjsLib; if (!L) { pdfjsP = null; return falha(new Error('pdf')); } L.GlobalWorkerOptions.workerSrc = PDFJS + 'pdf.worker.min.js'; ok(L); };
      s.onerror = function () { pdfjsP = null; falha(new Error('pdf')); };
      document.head.appendChild(s);
    });
    return pdfjsP;
  }
  // canvas -> JPEG que cabe no limite do servidor (450 KB): baixa a qualidade e, se preciso, o tamanho
  function canvasJpeg(c) {
    for (var tentativa = 0; tentativa < 4; tentativa++) {
      var q = 0.86, url = c.toDataURL('image/jpeg', q);
      while (url.length > 470000 && q > 0.5) { q -= 0.08; url = c.toDataURL('image/jpeg', q); }
      if (url.length <= 470000) return url;
      var m = document.createElement('canvas'); m.width = Math.round(c.width * 0.8); m.height = Math.round(c.height * 0.8);
      m.getContext('2d').drawImage(c, 0, 0, m.width, m.height); c = m;
    }
    return null;
  }
  function pdfParaImagens(arquivo, max) {
    return carregarPdfjs().then(function (L) {
      return new Promise(function (ok, falha) { var r = new FileReader(); r.onload = function () { ok(new Uint8Array(r.result)); }; r.onerror = falha; r.readAsArrayBuffer(arquivo); })
        .then(function (dados) { return L.getDocument({ data: dados, isEvalSupported: false }).promise; });
    }).then(function (doc) {
      var n = Math.min(doc.numPages, max), urls = [], i = 1;
      function prox() {
        if (i > n) return Promise.resolve(urls);
        return doc.getPage(i++).then(function (pg) {
          var v = pg.getViewport({ scale: 1 }), e = Math.min(3, 1600 / Math.max(v.width, v.height)), vp = pg.getViewport({ scale: e });
          var c = document.createElement('canvas'); c.width = Math.round(vp.width); c.height = Math.round(vp.height);
          var cx = c.getContext('2d'); cx.fillStyle = '#ffffff'; cx.fillRect(0, 0, c.width, c.height);
          return pg.render({ canvasContext: cx, viewport: vp }).promise.then(function () { var u = canvasJpeg(c); if (u) urls.push(u); return prox(); });
        });
      }
      return prox();
    });
  }
  function receberCard(lista) {
    lista = Array.prototype.slice.call(lista || []).filter(function (f) { return /^image\//.test(f.type) || f.type === 'application/pdf' || /\.pdf$/i.test(f.name || ''); });
    var vagas = MAX_CARD - cardFotos.length;
    if (!lista.length || vagas <= 0) return;
    dropCard.classList.add('ocupado'); cardCont.textContent = 'Preparando…';
    var feito = Promise.resolve(), erroPdf = false;
    lista.forEach(function (f) {
      feito = feito.then(function () {
        if (cardFotos.length >= MAX_CARD) return;
        var ehPdf = f.type === 'application/pdf' || /\.pdf$/i.test(f.name || '');
        var p = ehPdf ? pdfParaImagens(f, MAX_CARD - cardFotos.length).catch(function () { erroPdf = true; return []; }) : CG.comprimir(f, 1600).then(function (u) { return [u]; }).catch(function () { return []; });
        return p.then(function (urls) { urls.forEach(function (u) { if (u && cardFotos.length < MAX_CARD) cardFotos.push(u); }); });
      });
    });
    feito.then(function () {
      dropCard.classList.remove('ocupado'); cardInput.value = '';
      desenharCard(); previaJa(); salvar();
      if (erroPdf) mostrarErro('Não consegui abrir esse PDF aqui. Tire um print (ou foto) do cardápio e mande como imagem.');
      else if (cardFotos.length) { mostrarErro(''); robo('r-ok'); }
    });
  }
  cardInput.addEventListener('change', function () { receberCard(cardInput.files); });
  ['dragenter', 'dragover'].forEach(function (ev) { dropCard.addEventListener(ev, function (e) { e.preventDefault(); dropCard.classList.add('sobre'); }); });
  ['dragleave', 'drop'].forEach(function (ev) { dropCard.addEventListener(ev, function (e) { e.preventDefault(); dropCard.classList.remove('sobre'); }); });
  dropCard.addEventListener('drop', function (e) { receberCard(e.dataTransfer && e.dataTransfer.files); });

  /* ---------- rascunho local ---------- */
  // v3 (24/10/2026): guarda o NOME do passo (a ordem mudou). Áudio e fotos não vão para o rascunho (só texto e escolhas).
  var CAMPOS = ['negocio', 'ramo', 'cidade', 'quer', 'servicos', 'cores', 'whatsapp', 'email', 'instagram', 'sis_faz'];
  var agSalvar = 0;
  function salvar() {
    clearTimeout(agSalvar);
    agSalvar = setTimeout(function () {
      var r = { v: 3, passo: ordem[atual], oque: oque(), precisa: marcados('precisa'), cpx: marcados('cpx'), sis_quem: val('sis_quem'), sis_env: marcados('sis_env') };
      CAMPOS.forEach(function (k) { r[k] = form.elements[k].value; });
      store.set(RASCUNHO, JSON.stringify(r));
    }, 250);
  }
  function restaurar() {
    var r; try { r = JSON.parse(store.get(RASCUNHO) || 'null'); } catch (e) { r = null; }
    if (!r || (r.v !== 2 && r.v !== 3)) return 0;
    if (r.v === 2) r.passo = 0; // rascunho do formulário antigo: os dados ficam, o passo recomeça
    CAMPOS.forEach(function (k) { if (typeof r[k] === 'string') form.elements[k].value = r[k]; });
    var marca = function (nome, lista) { $$('[name="' + nome + '"]', form).forEach(function (i) { i.checked = (lista || []).indexOf(i.value) >= 0; }); };
    marca('oque', [r.oque]); marca('precisa', r.precisa); marca('cpx', r.cpx); marca('sis_quem', [r.sis_quem]); marca('sis_env', r.sis_env);
    marcarPaleta();
    var hex = String(r.cores || '').match(/#[0-9a-f]{6}\b/ig); if (hex) { cor1.value = hex[0]; if (hex[1]) cor2.value = hex[1]; }
    var i = typeof r.passo === 'string' ? ordem.indexOf(r.passo) : 0;
    return Math.max(0, Math.min(i, ordem.indexOf('revisao')));
  }

  /* ---------- validação por passo ---------- */
  function campoErro(nome, msg) {
    var el = form.elements[nome]; var cp = el && el.closest ? el.closest('.cp, .aceite') : null;
    if (cp) { cp.classList.add('cp-err'); el.setAttribute('aria-invalid', 'true'); setTimeout(function () { el.focus(); }, 30); }
    return msg;
  }
  function limparErros() { $$('.cp-err', form).forEach(function (c) { c.classList.remove('cp-err'); }); $$('[aria-invalid]', form).forEach(function (i) { i.removeAttribute('aria-invalid'); }); }
  var emailOk = function () { return /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(val('email')); };
  function validar(p) {
    switch (p) {
      case 'oque': return oque() ? '' : 'Escolha uma das opções.';
      case 'negocio': return val('negocio') ? '' : campoErro('negocio', 'Só o nome já basta.');
      case 'ramo': return val('ramo') ? '' : campoErro('ramo', 'Toque numa sugestão ou escreva o ramo.');
      case 'cidade': return val('cidade') ? '' : campoErro('cidade', 'Diga a cidade.');
      case 'precisa': return projeto() && !val('sis_faz') ? campoErro('sis_faz', 'Conta em poucas palavras o que precisa (ou toque num exemplo).') : '';
      case 'contato':
        var zap = val('whatsapp').replace(/\D/g, '');
        if (val('email') && !emailOk()) return campoErro('email', 'Esse e-mail parece incompleto.');
        if (!waOficial && !emailOk()) return campoErro('email', 'Deixe o seu e-mail: é por ele que a gente te avisa do pedido.');
        if (zap.length < 10 && !emailOk()) return campoErro('whatsapp', 'Deixe um WhatsApp (com DDD) ou um e-mail para a gente te avisar.');
        return '';
      case 'falar': return grav.estado === 'gravando' || grav.estado === 'pausado' ? 'Toque em "Pronto" para terminar o áudio (ou apague).' : '';
      case 'revisao': return form.elements.aceite.checked ? '' : campoErro('aceite', 'Marque que concorda com o uso dos dados para montar a prévia.');
    }
    return '';
  }
  function mostrarErro(msg) { erro.textContent = msg || ''; erro.hidden = !msg; if (msg) { var r = erro.getBoundingClientRect(), nav = $('#nav').getBoundingClientRect(); if (r.bottom > nav.top - 8 || r.top < 0) erro.scrollIntoView({ block: 'center', behavior: menosMov ? 'auto' : 'smooth' }); } }

  /* ---------- navegação (conversa: um passo por vez; "servicos" fica de fora em sistema e automação) ---------- */
  var OPCIONAIS = { precisa: 1, servicos: 1, cores: 1, fotos: 1, falar: 1 };
  function ativo(p) { return !(p === 'servicos' && projeto()); }
  function ativos() { return ordem.filter(ativo); }
  function vizinho(i, d) { for (var j = i + d; j >= 0 && j < ordem.length; j += d) if (ativo(ordem[j])) return j; return -1; }
  function temAlgo(p) {
    if (p === 'precisa') { var t = oque(); return t === 'cardapio' ? marcados('cpx').length > 0 : projeto() ? true : marcados('precisa').length > 0; }
    if (p === 'servicos') return !!(val('servicos') || (oque() === 'cardapio' && cardFotos.length));
    if (p === 'cores') return !!val('cores');
    if (p === 'fotos') return fotos.length > 0;
    if (p === 'falar') return !!(val('quer') || grav.dataUrl);
    return true;
  }
  function atualizarBotao() {
    var p = ordem[atual];
    botao.classList.toggle('enviar', p === 'revisao');
    botao.classList.toggle('pular', !!(OPCIONAIS[p] && !temAlgo(p)) && p !== 'revisao' && !daRevisao);
    if (p === 'revisao') botaoTxt.textContent = antigo && trocar ? 'Enviar pedido novo' : 'Pedir minha prévia';
    else if (daRevisao) botaoTxt.textContent = 'Voltar à revisão';
    else botaoTxt.textContent = OPCIONAIS[p] && !temAlgo(p) ? 'Pular' : 'Continuar';
  }
  // frase do robô com o que a pessoa já respondeu ("Prazer, Barbearia Dois Irmãos!"); textContent, nunca HTML
  var ROT_CURTO = { site: 'Site com agenda', cardapio: 'Cardápio digital', sistema: 'Sistema sob medida', automacao: 'Automação' };
  function curto(t, n) { t = String(t || ''); return t.length > n ? t.slice(0, n - 1) + '…' : t; }
  function personalizar(ps) {
    var k = ps.querySelector('[data-kick]'); if (!k) return;
    if (!k.hasAttribute('data-kick-padrao')) k.setAttribute('data-kick-padrao', k.textContent);
    var mapa = { nome: curto(val('negocio'), 32), ramo: curto(val('ramo'), 28), tipo: ROT_CURTO[oque()] || '' };
    var modelo = k.getAttribute('data-kick'), falta = false;
    var tx = modelo.replace(/\{(\w+)\}/g, function (m, c) { if (!mapa[c]) falta = true; return mapa[c] || ''; });
    tx = falta ? k.getAttribute('data-kick-padrao') : tx;
    k.textContent = tx.charAt(0).toUpperCase() + tx.slice(1);
  }
  // balão da pessoa: a resposta do passo anterior (toque para mudar)
  var eco = $('#eco'), ecoTxt = $('#eco-txt'), ecoDe = -1;
  function respostaDe(p) {
    switch (p) {
      case 'oque': return ROT_CURTO[oque()] || '';
      case 'negocio': return val('negocio');
      case 'ramo': return val('ramo');
      case 'cidade': return val('cidade');
      case 'precisa': return resumoPrecisa();
      case 'servicos': return val('servicos') ? val('servicos').replace(/:\s*\n\s*/g, ': ').replace(/\s*\n\s*/g, ' · ') : (cardFotos.length ? 'Mandei o cardápio atual' : '');
      case 'cores': return val('cores');
      case 'fotos': return fotos.length ? fotos.length + (fotos.length > 1 ? ' fotos' : ' foto') : '';
      case 'falar': return [grav.dataUrl ? 'Áudio de ' + tempo(grav.seg) : '', val('quer')].filter(Boolean).join(' · ');
      case 'contato': return val('email') || val('whatsapp');
    }
    return '';
  }
  function mostrarEco(i) {
    var j = vizinho(i, -1), tx = j >= 0 && ordem[i] !== 'revisao' ? respostaDe(ordem[j]) : '';
    ecoDe = j; eco.hidden = !tx;
    if (tx) { ecoTxt.textContent = curto(tx.replace(/\s+/g, ' '), 70); eco.setAttribute('aria-label', 'Sua resposta: ' + curto(tx, 70) + '. Toque para mudar'); }
  }
  eco.addEventListener('click', function () { if (ecoDe >= 0) { daRevisao = false; irPara(ecoDe, true); } });
  function irPara(i, volta) {
    if (i < 0 || i >= passos.length) return;
    if (!ativo(ordem[i])) { i = vizinho(i, volta ? -1 : 1); if (i < 0) return; }
    limparErros(); mostrarErro('');
    if (ordem[atual] === 'falar' && i !== atual) gravPararOuvir();
    passos[atual].hidden = true;
    atual = i;
    if (ordem[i] === 'cores') desenharPaletas(); // as paletas seguem o ramo digitado antes
    var ps = passos[i]; personalizar(ps); ps.hidden = false;
    ps.classList.toggle('volta', !!volta);
    ps.style.animation = 'none'; void ps.offsetWidth; ps.style.animation = '';
    var lista = ativos(), n = lista.indexOf(ordem[i]) + 1, total = lista.length;
    $('#prog-barra').style.transform = 'scaleX(' + (n / total) + ')';
    $('#prog').setAttribute('aria-valuenow', String(n)); $('#prog').setAttribute('aria-valuemax', String(total));
    $('#passo-txt').textContent = n + ' de ' + total;
    voltar.hidden = i === 0;
    mostrarEco(i);
    $('#lgpd').hidden = ordem[i] !== 'revisao';
    if (ordem[i] === 'revisao') { daRevisao = false; montarRevisao(); cfDesenhar(); }
    atualizarBotao();
    salvar();
    var t = ps.querySelector('.ps-t');
    if (window.scrollY > 80) window.scrollTo({ top: 0, behavior: menosMov ? 'auto' : 'smooth' });
    if (t) t.focus({ preventScroll: true });
    var primeiro = ps.querySelector('input:not([type=radio]):not([type=checkbox]):not([type=file]):not([type=color]), textarea');
    if (primeiro && matchMedia('(hover: hover)').matches && !primeiro.value) setTimeout(function () { primeiro.focus({ preventScroll: true }); }, 380);
  }
  function avancar() {
    var p = ordem[atual], msg = validar(p);
    if (msg) { mostrarErro(msg); robo('r-nao'); return; }
    if (p === 'revisao') return enviar();
    if (daRevisao) { irPara(ordem.indexOf('revisao')); return; }
    robo('r-ok');
    irPara(vizinho(atual, 1));
  }
  form.addEventListener('submit', function (e) { e.preventDefault(); if (!enviando) avancar(); });
  voltar.addEventListener('click', function () { daRevisao = false; irPara(vizinho(atual, -1), true); });
  // Enter avança (textarea mantém a quebra de linha; Ctrl/Cmd+Enter avança também)
  form.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' || e.isComposing) return;
    var t = e.target;
    if (t.tagName === 'TEXTAREA' && !(e.ctrlKey || e.metaKey)) return;
    if (t.tagName === 'BUTTON' || t.tagName === 'A' || t.type === 'file') return;
    e.preventDefault(); if (!enviando) avancar();
  });
  // escolher o tipo já leva ao próximo passo
  $$('[name="oque"]', form).forEach(function (r) {
    r.addEventListener('change', function () {
      ajustarTipo(); previaJa(); salvar(); robo('r-ok');
      setTimeout(function () { if (ordem[atual] === 'oque' && r.checked) avancar(); }, menosMov ? 0 : 420);
    });
    // tocar de novo no cartão já escolhido também avança
    var gc = r.closest('.gc'), ja = false;
    gc.addEventListener('pointerdown', function () { ja = r.checked; });
    gc.addEventListener('click', function (e) { if (ja && e.detail > 0 && ordem[atual] === 'oque') { ja = false; setTimeout(avancar, 120); } });
  });
  form.addEventListener('input', function (e) { if (e.target.closest('.cp-err')) { e.target.closest('.cp-err').classList.remove('cp-err'); e.target.removeAttribute('aria-invalid'); mostrarErro(''); } previaJa(); salvar(); atualizarBotao(); });
  form.addEventListener('change', function () { previaJa(); salvar(); atualizarBotao(); });

  /* ---------- gravador de áudio (24/10/2026; opcional) ----------
     O microfone só é pedido no clique em "Gravar". Até 2 min ou ~580 KB (o servidor aceita 600 KB e confere os bytes do formato).
     Vai no pedido como data URL (campo audio); a ClickGo transcreve no PC e o texto entra no briefing. Não fica no rascunho. */
  var GRAV_MAX_SEG = 120, GRAV_MAX_BYTES = 580 * 1024, GRAV_MIN_BYTES = 1024;
  var grav = { estado: 'pronto', rec: null, stream: null, pedacos: [], bytes: 0, tipo: '', seg: 0, acum: 0, desde: 0, tm: 0, dataUrl: '', blobUrl: '', ctx: null, an: null, raf: 0 };
  var gBox = $('#grav'), gAudio = $('#grav-audio'), gMsg = $('#grav-msg'), gTempo = $('#grav-tempo'), gDur = $('#grav-dur'), gProg = $('#grav-prog'), gOndas = $$('#grav-ondas i');
  function tempo(s) { s = Math.max(0, Math.round(s || 0)); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
  function gEstado(e) { grav.estado = e; gBox.setAttribute('data-estado', e); atualizarBotao(); }
  function gAviso(msg) { gMsg.textContent = msg || ''; gMsg.hidden = !msg; }
  function gTipo() {
    var op = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/mp4', 'audio/webm'];
    for (var i = 0; i < op.length; i++) { try { if (MediaRecorder.isTypeSupported(op[i])) return op[i]; } catch (e) { /* */ } }
    return '';
  }
  function gSoltar() {
    clearInterval(grav.tm); cancelAnimationFrame(grav.raf);
    if (grav.stream) grav.stream.getTracks().forEach(function (t) { t.stop(); });
    grav.stream = null;
    if (grav.ctx) { try { grav.ctx.close(); } catch (e) { /* */ } }
    grav.ctx = null; grav.an = null;
    gOndas.forEach(function (o) { o.style.transform = ''; });
  }
  function gSegundos() { return grav.acum + (grav.estado === 'gravando' ? (performance.now() - grav.desde) / 1000 : 0); }
  function gTique() {
    var s = gSegundos(); gTempo.textContent = tempo(Math.floor(s));
    if (s >= GRAV_MAX_SEG) gParar();
  }
  function gOndasLoop() {
    if (!grav.an) return;
    var d = new Uint8Array(grav.an.fftSize); grav.an.getByteTimeDomainData(d);
    var soma = 0; for (var i = 0; i < d.length; i++) { var v = (d[i] - 128) / 128; soma += v * v; }
    var nivel = Math.min(1, Math.sqrt(soma / d.length) * 4);
    for (var j = gOndas.length - 1; j > 0; j--) gOndas[j].style.transform = gOndas[j - 1].style.transform;
    gOndas[0].style.transform = 'scaleY(' + (grav.estado === 'gravando' ? .15 + nivel * .85 : .15).toFixed(2) + ')';
    grav.raf = requestAnimationFrame(gOndasLoop);
  }
  function gLimpar() {
    gSoltar();
    try { gAudio.pause(); } catch (e) { /* */ }
    if (grav.blobUrl) { URL.revokeObjectURL(grav.blobUrl); }
    gAudio.removeAttribute('src');
    grav.blobUrl = ''; grav.dataUrl = ''; grav.pedacos = []; grav.bytes = 0; grav.seg = 0; grav.acum = 0; grav.rec = null;
    gProg.style.transform = 'scaleX(0)'; gBox.classList.remove('tocando');
  }
  function gIniciar() {
    gAviso('');
    if (!window.MediaRecorder || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !gTipo()) {
      gEstado('indisponivel'); gAviso('Este navegador não grava áudio aqui. Sem problema: escreva acima.'); return;
    }
    gLimpar();
    gEstado('pedindo');
    navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }).then(function (st) {
      grav.stream = st; grav.tipo = gTipo();
      var rec;
      try { rec = new MediaRecorder(st, { mimeType: grav.tipo, audioBitsPerSecond: 32000 }); } catch (e) { rec = new MediaRecorder(st); grav.tipo = rec.mimeType || grav.tipo; }
      grav.rec = rec;
      rec.ondataavailable = function (ev) {
        if (!ev.data || !ev.data.size) return;
        grav.pedacos.push(ev.data); grav.bytes += ev.data.size;
        if (grav.bytes >= GRAV_MAX_BYTES && rec.state !== 'inactive') gParar();
      };
      rec.onstop = gTerminou;
      rec.start(1000);
      grav.acum = 0; grav.desde = performance.now();
      gEstado('gravando'); gTempo.textContent = '0:00';
      grav.tm = setInterval(gTique, 250);
      if (!menosMov) {
        try {
          var AC = window.AudioContext || window.webkitAudioContext;
          grav.ctx = new AC(); grav.an = grav.ctx.createAnalyser(); grav.an.fftSize = 512;
          grav.ctx.createMediaStreamSource(st).connect(grav.an); gOndasLoop();
        } catch (e) { grav.an = null; }
      }
      robo('r-ok');
    }).catch(function (e) {
      gSoltar(); gEstado('pronto');
      gAviso(e && (e.name === 'NotAllowedError' || e.name === 'SecurityError') ? 'O microfone ficou bloqueado. Tudo bem: escreva acima ou libere o microfone no navegador.' : 'Não achei um microfone. Pode escrever acima.');
    });
  }
  function gPausar() {
    var r = grav.rec; if (!r) return;
    if (grav.estado === 'gravando' && r.state === 'recording' && r.pause) { r.pause(); grav.acum = gSegundos(); gEstado('pausado'); }
    else if (grav.estado === 'pausado' && r.state === 'paused') { r.resume(); grav.desde = performance.now(); gEstado('gravando'); }
    $('#grav-pausar').setAttribute('aria-label', grav.estado === 'pausado' ? 'Continuar gravando' : 'Pausar');
  }
  function gParar() {
    var r = grav.rec; if (!r || r.state === 'inactive') return;
    grav.seg = gSegundos(); clearInterval(grav.tm);
    gEstado('salvando');
    try { r.stop(); } catch (e) { gTerminou(); }
  }
  function gTerminou() {
    gSoltar();
    var base = String(grav.tipo || (grav.rec && grav.rec.mimeType) || '').split(';')[0] || 'audio/webm';
    var blob = new Blob(grav.pedacos, { type: base });
    if (blob.size < GRAV_MIN_BYTES || grav.seg < 1) { gLimpar(); gEstado('pronto'); gAviso('Ficou curtinho demais. Tente de novo.'); return; }
    if (blob.size > 600 * 1024) { gLimpar(); gEstado('pronto'); gAviso('O áudio ficou grande demais. Tente um mais curto.'); return; }
    var leitor = new FileReader();
    leitor.onload = function () {
      var b64 = String(leitor.result || '').split(',')[1] || '';
      grav.dataUrl = 'data:' + base + ';base64,' + b64;
      grav.blobUrl = URL.createObjectURL(blob); gAudio.src = grav.blobUrl;
      gDur.textContent = tempo(grav.seg);
      gEstado('gravado'); robo('r-ok'); salvar();
    };
    leitor.onerror = function () { gLimpar(); gEstado('pronto'); gAviso('Não deu para guardar o áudio. Tente de novo.'); };
    leitor.readAsDataURL(blob);
  }
  function gravPararOuvir() {
    try { gAudio.pause(); } catch (e) { /* */ }
    if (grav.estado === 'gravando' || grav.estado === 'pausado') gParar();
  }
  $('#grav-iniciar').addEventListener('click', gIniciar);
  $('#grav-pausar').addEventListener('click', gPausar);
  $('#grav-parar').addEventListener('click', gParar);
  $('#grav-refazer').addEventListener('click', gIniciar);
  $('#grav-apagar').addEventListener('click', function () { gLimpar(); gEstado('pronto'); gAviso(''); $('#grav-iniciar').focus(); });
  $('#grav-ouvir').addEventListener('click', function () { if (!grav.blobUrl) return; if (gAudio.paused) { var p = gAudio.play(); if (p && p.catch) p.catch(function () { /* */ }); } else gAudio.pause(); });
  gAudio.addEventListener('play', function () { gBox.classList.add('tocando'); $('#grav-ouvir').setAttribute('aria-label', 'Pausar o áudio'); });
  gAudio.addEventListener('pause', function () { gBox.classList.remove('tocando'); $('#grav-ouvir').setAttribute('aria-label', 'Ouvir o áudio'); });
  gAudio.addEventListener('ended', function () { gProg.style.transform = 'scaleX(0)'; });
  gAudio.addEventListener('timeupdate', function () { var d = grav.seg || 1; gProg.style.transform = 'scaleX(' + Math.min(1, gAudio.currentTime / d).toFixed(3) + ')'; gDur.textContent = tempo(gAudio.paused ? grav.seg : gAudio.currentTime); });
  addEventListener('pagehide', gSoltar);

  /* ---------- campos que ajudam a digitar ---------- */
  // WhatsApp: (DDD) 99999-9999 enquanto digita (só números; tira o +55)
  var zapIn = form.elements.whatsapp;
  zapIn.addEventListener('input', function () {
    var d = zapIn.value.replace(/\D/g, '');
    if (d.length > 11 && d.slice(0, 2) === '55') d = d.slice(2);
    d = d.slice(0, 11);
    var f = d.length <= 2 ? (d ? '(' + d : '') : '(' + d.slice(0, 2) + ') ' + (d.length <= 6 ? d.slice(2) : d.length <= 10 ? d.slice(2, 6) + '-' + d.slice(6) : d.slice(2, 7) + '-' + d.slice(7));
    if (zapIn.selectionStart === zapIn.value.length || document.activeElement !== zapIn) zapIn.value = f;
  });
  // Instagram: aceita link ou nome e deixa "@nome"
  var igIn = form.elements.instagram;
  igIn.addEventListener('blur', function () {
    var v = igIn.value.trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/[/?#].*$/, '').replace(/\s+/g, '').replace(/^@+/, '');
    igIn.value = v ? '@' + v.slice(0, 58) : ''; salvar();
  });
  // e-mail: sugere a correção dos erros de digitação mais comuns
  var emIn = form.elements.email, emSug = $('#email-sug');
  var DOM_ERRADO = { 'gmial.com': 'gmail.com', 'gmai.com': 'gmail.com', 'gmal.com': 'gmail.com', 'gamil.com': 'gmail.com', 'gmail.con': 'gmail.com', 'gmail.co': 'gmail.com', 'gmail.com.br': 'gmail.com', 'gmaill.com': 'gmail.com', 'hotmal.com': 'hotmail.com', 'hotmial.com': 'hotmail.com', 'hotmail.con': 'hotmail.com', 'hotmai.com': 'hotmail.com', 'outlok.com': 'outlook.com', 'outlook.con': 'outlook.com', 'yahoo.con': 'yahoo.com', 'yaho.com': 'yahoo.com', 'icloud.con': 'icloud.com', 'uol.com': 'uol.com.br', 'bol.com': 'bol.com.br' };
  function emailSugerir() {
    var v = emIn.value.trim(), m = v.match(/^([^@\s]+)@([^@\s]+)$/), certo = m && DOM_ERRADO[m[2].toLowerCase()];
    emSug.hidden = !certo; emSug.innerHTML = '';
    if (!certo) return;
    var b = document.createElement('button'); b.type = 'button'; b.className = 'sug-bt'; b.textContent = m[1] + '@' + certo;
    b.addEventListener('click', function () { emIn.value = m[1] + '@' + certo; emSug.hidden = true; marcarOk(emIn); salvar(); emIn.focus(); });
    emSug.appendChild(document.createTextNode('Quis dizer ')); emSug.appendChild(b); emSug.appendChild(document.createTextNode('?'));
  }
  emIn.addEventListener('blur', emailSugerir);
  emIn.addEventListener('input', function () { if (!emSug.hidden) emailSugerir(); });
  // sinal de "certo" no campo preenchido
  function marcarOk(el) {
    var cp = el.closest && el.closest('.cp'); if (!cp) return;
    var v = String(el.value || '').trim(), ok = !!v;
    if (el.name === 'email') ok = emailOk();
    if (el.name === 'whatsapp') ok = v.replace(/\D/g, '').length >= 10;
    cp.classList.toggle('cp-ok', ok);
  }
  $$('.cp input:not([type=file]):not([type=color]):not([type=radio]):not([type=checkbox]), .cp textarea', form).forEach(function (el) {
    el.addEventListener('input', function () { marcarOk(el); });
    el.addEventListener('blur', function () { marcarOk(el); });
  });
  // contador discreto nas caixas de texto longas (aparece perto do limite)
  $$('textarea[data-conta]', form).forEach(function (ta) {
    var max = Number(ta.getAttribute('data-conta')), c = document.createElement('small'); c.className = 'conta'; c.setAttribute('aria-hidden', 'true'); ta.parentNode.appendChild(c);
    function contar() { var n = ta.value.length; c.textContent = n + '/' + max; c.classList.toggle('on', n > max * .7); }
    ta.addEventListener('input', contar); contar();
  });

  /* ---------- revisão ---------- */
  var ROT_OQUE = { site: 'Site com agenda', cardapio: 'Cardápio digital', sistema: 'Sistema sob medida', automacao: 'Automação' };
  function resumoPrecisa() {
    var t = oque();
    if (t === 'cardapio') return marcados('cpx').map(function (k) { return CARDAPIO[k][1]; }).join(', ');
    if (projeto()) return [val('sis_faz'), marcados('sis_env').length && 'Envolve: ' + marcados('sis_env').join(', '), val('sis_quem') && 'Pessoas: ' + val('sis_quem')].filter(Boolean).join(' · ');
    return marcados('precisa').map(function (k) { return ROT_PRECISA[k]; }).join(', ');
  }
  function montarRevisao() {
    var linhas = [
      ['O que', ROT_OQUE[oque()] || '', 'oque'],
      ['Negócio', [val('negocio'), val('ramo')].filter(Boolean).join(' · '), 'negocio'],
      ['Cidade', val('cidade'), 'cidade'],
      [oque() === 'sistema' ? 'O sistema' : oque() === 'automacao' ? 'A automação' : 'Precisa', resumoPrecisa(), 'precisa'],
      projeto() ? null : [oque() === 'cardapio' ? 'Itens e preços' : 'Serviços', val('servicos'), 'servicos'],
      oque() === 'cardapio' && cardFotos.length ? ['Cardápio atual', cardFotos.length + (cardFotos.length > 1 ? ' imagens' : ' imagem') + ': a gente lê os itens e preços e te mostra para conferir', 'servicos'] : null,
      ['Cores', val('cores'), 'cores'],
      ['Fotos', fotos.length ? fotos.length + (fotos.length > 1 ? ' fotos' : ' foto') : '', 'fotos'],
      ['Recado', val('quer'), 'falar'],
      grav.dataUrl ? ['Áudio', 'Áudio de ' + tempo(grav.seg) + ': a gente ouve e transcreve', 'falar'] : null,
      ['Contato', [val('email'), val('whatsapp'), val('instagram')].filter(Boolean).join(' · '), 'contato']
    ];
    linhas = linhas.filter(Boolean);
    var dl = $('#rev'); dl.innerHTML = '';
    linhas.forEach(function (l, i) {
      var d = document.createElement('div'); d.style.animationDelay = (i * 40) + 'ms';
      var dt = document.createElement('dt'); dt.textContent = l[0];
      var dd = document.createElement('dd'); var tx = l[1].length > 160 ? l[1].slice(0, 158) + '…' : l[1]; dd.textContent = tx || 'Nada'; if (!tx) dd.className = 'vazio';
      var b = document.createElement('button'); b.type = 'button'; b.textContent = 'Mudar'; b.setAttribute('aria-label', 'Mudar ' + l[0].toLowerCase());
      b.addEventListener('click', function () { daRevisao = true; irPara(ordem.indexOf(l[2]), true); });
      d.appendChild(dt); d.appendChild(dd); d.appendChild(b); dl.appendChild(d);
    });
  }

  /* ---------- "continuar de onde parei" e pedido novo que substitui o antigo ---------- */
  var antigo = null, trocar = false;
  try {
    var ult = JSON.parse(localStorage.getItem('cg_pedidos') || '[]')[0];
    if (ult && ult.id && ult.k) {
      antigo = ult;
      var card = $('#continuar');
      $('#continuar-nome').textContent = ult.negocio || 'seu negócio';
      // A chave do pedido não fica no href (o Clarity grava o DOM): o endereço completo só nasce no clique
      $('#continuar-ir').addEventListener('click', function (ev) { ev.preventDefault(); location.href = '/acompanhar/' + (api ? '?api=' + encodeURIComponent(api) : '') + '#' + ult.id + '.' + ult.k; });
      card.hidden = false; form.hidden = true;
      prevBox.hidden = true; prevAbre.hidden = true;
      $('#palco').classList.add('so-cont');
      $('#continuar-outro').addEventListener('click', function () {
        trocar = true; card.hidden = true; form.hidden = false; prevBox.hidden = false; prevAbre.hidden = false;
        $('#palco').classList.remove('so-cont');
        $('#continuar-aviso').hidden = false;
        irPara(0); robo('r-acena');
      });
    }
  } catch (e) { /* sem localStorage */ }

  /* ---------- WhatsApp oficial (a API diz em /config): DESLIGADO = e-mail obrigatório; LIGADO = qualquer um dos dois ---------- */
  CG.chamar('/config').then(function (c) {
    if (!c || !c.whatsappOficial) return;
    waOficial = true;
    $('#avisos-sub').textContent = 'Deixe pelo menos um dos dois.';
    $('#rot-email').innerHTML = 'E-mail'; $('#rot-whats').innerHTML = 'WhatsApp';
    form.elements.email.required = false;
  }).catch(function () { /* fica o padrão: e-mail obrigatório */ });

  /* ---------- Cloudflare Turnstile (auditoria 23/10/2026): só liga quando a API manda a site key em /config ----------
     O widget fica na revisão, antes de enviar; o token vai no pedido (campo turnstile) e é de uso único (reset depois). */
  var cf = { chave: '', token: '', id: null };
  function cfDesenhar() {
    if (!cf.chave || cf.id !== null || !window.turnstile) return;
    var onde = $('#cg-turnstile'); if (!onde) return;
    onde.hidden = false;
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
    s.async = true; s.defer = true;
    document.head.appendChild(s);
  }).catch(function () { /* sem config: sem widget (a API decide) */ });

  /* ---------- enviar ---------- */
  function montarQuer() {
    var t = oque(), extra = [];
    if (t === 'cardapio') { var l = marcados('cpx').map(function (k) { return CARDAPIO[k][1]; }); if (l.length) extra.push('No cardápio: ' + l.join(', ') + '.'); }
    // projeto sob medida: a 1ª linha diz o tipo (Automação ou Sistema) para o dono distinguir na tela Projetos
    if (projeto()) {
      extra.push('Tipo de projeto: ' + (t === 'automacao' ? 'Automação' : 'Sistema sob medida') + '.');
      if (val('sis_faz')) extra.push((t === 'automacao' ? 'O que deve acontecer sozinho: ' : 'O sistema precisa: ') + val('sis_faz'));
      if (marcados('sis_env').length) extra.push('Envolve: ' + marcados('sis_env').join(', ') + '.');
      if (val('sis_quem')) extra.push('Pessoas que usam: ' + val('sis_quem') + '.');
    }
    var txt = extra.concat(val('quer') ? [val('quer')] : []).join('\n');
    // marca que a ClickGo lê (lib/cardapioItens): as primeiras N fotos são o cardápio atual do cliente
    if (t === 'cardapio' && cardFotos.length) return txt.slice(0, 1450) + (txt ? '\n' : '') + 'Cardápio atual nas fotos (' + cardFotos.length + ').';
    return txt.slice(0, 1500);
  }
  function montarPrecisa() {
    var t = oque();
    if (projeto()) return ['sistema']; // a API tem lista fechada: 'sistema' abre a sala do projeto (vale para automação também)
    if (t === 'cardapio') { var s = []; marcados('cpx').forEach(function (k) { var v = CARDAPIO[k][0]; if (v && s.indexOf(v) < 0) s.push(v); }); return s; }
    return marcados('precisa').map(String).slice(0, 6);
  }
  var mt = $('#montando'), mtLista = $$('#mt-lista li'), mtRobo = $('.mt-tel .robo');
  function montando() {
    mt.hidden = false; mt.classList.remove('pronto'); $('#mt-t').textContent = 'Montando seu pedido';
    mtLista.forEach(function (li) { li.className = ''; });
    var i = 0, passo = menosMov ? 150 : 650;
    return new Promise(function (ok) {
      (function prox() {
        if (i > 0) mtLista[i - 1].className = 'ok';
        if (i < mtLista.length) { mtLista[i].className = 'vez'; i++; setTimeout(prox, passo); } else ok();
      })();
    });
  }
  function enviar() {
    for (var i = 0; i < ordem.length; i++) { var m = validar(ordem[i]); if (m) { if (i !== atual) { irPara(i, true); m = validar(ordem[i]); } mostrarErro(m); robo('r-nao'); return; } }
    if (cf.chave && !cf.token) { cfDesenhar(); mostrarErro('Só um instante: estamos confirmando que você não é um robô. Tente enviar de novo em alguns segundos.'); return; }
    mostrarErro('');
    enviando = true; botao.disabled = true; botaoTxt.textContent = 'Enviando…';
    var corpo = {
      negocio: val('negocio'), ramo: val('ramo'), cidade: val('cidade'), tipo: oque() === 'cardapio' ? 'Cardápio digital' : 'site', quer: montarQuer(), servicos: projeto() ? '' : val('servicos'),
      cores: val('cores'), whatsapp: val('whatsapp'), email: val('email'), instagram: val('instagram'), site_url: val('site_url'), t0: t0, aceite: true, portfolio: !(form.elements.portfolio && !form.elements.portfolio.checked), fotos: oque() === 'cardapio' ? cardFotos.concat(fotos).slice(0, 3) : fotos,
      precisa: montarPrecisa(), turnstile: cf.token || undefined, audio: grav.dataUrl || undefined,
      substitui: antigo && trocar ? { id: antigo.id, k: antigo.k } : undefined,
      extras: window.CGFormExtras ? window.CGFormExtras.ids() : undefined
    };
    var animacao = montando();
    var pedido = CG.chamar('/pedido', { metodo: 'POST', corpo: corpo });
    Promise.all([pedido, animacao]).then(function (res) {
      var r = res[0];
      mtLista.forEach(function (li) { li.className = 'ok'; });
      if (r.isca) { $('#mt-t').textContent = 'Recebido!'; return; }
      try { if (window.cgLead) window.cgLead(oque()); } catch (e) { /* pixel fora */ }
      try {
        var l = JSON.parse(localStorage.getItem('cg_pedidos') || '[]').filter(function (x) { return x.id !== r.id && !(antigo && x.id === antigo.id); });
        l.unshift({ id: r.id, k: r.k, negocio: val('negocio'), em: Date.now() });
        localStorage.setItem('cg_pedidos', JSON.stringify(l.slice(0, 5)));
      } catch (e) { /* sem localStorage: o link vai no endereço */ }
      store.del(RASCUNHO);
      mt.classList.add('pronto'); $('#mt-t').textContent = 'Pedido feito! Abrindo sua página';
      robo('r-festa', mtRobo); confete();
      setTimeout(function () { location.href = '/acompanhar/' + (api ? '?api=' + encodeURIComponent(api) : '') + '#' + r.id + '.' + r.k; }, menosMov ? 300 : 1700);
    }).catch(function (e) {
      cfRenovar();
      mt.hidden = true; enviando = false; botao.disabled = false; atualizarBotao();
      mostrarErro(e.message || 'Não deu para enviar agora. Tente de novo em instantes.'); robo('r-nao');
    });
  }

  /* ---------- confete discreto ---------- */
  function confete() {
    if (menosMov) return;
    var cv = $('#confete'), cx = cv.getContext('2d'), dpr = Math.min(window.devicePixelRatio || 1, 1.5), w = innerWidth, h = innerHeight;
    cv.width = w * dpr; cv.height = h * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var cores = ['#c43014', '#e8573a', '#f6efe4', '#171310', '#ffd9cf'], ps = [], ini = performance.now();
    for (var i = 0; i < 110; i++) { var a = -Math.PI / 2 + (Math.random() - .5) * 1.6, v = 7 + Math.random() * 8; ps.push({ x: w / 2, y: h * .42, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: Math.random() * 6.28, vr: (Math.random() - .5) * .3, s: 4 + Math.random() * 5, c: cores[i % cores.length] }); }
    (function q(t) {
      var dt = (t - ini) / 1000; cx.clearRect(0, 0, w, h);
      ps.forEach(function (p) { p.vy += .32; p.vx *= .985; p.x += p.vx; p.y += p.vy; p.r += p.vr; cx.save(); cx.globalAlpha = Math.max(0, 1 - dt / 1.8); cx.translate(p.x, p.y); cx.rotate(p.r); cx.fillStyle = p.c; cx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); cx.restore(); });
      if (dt < 1.8) requestAnimationFrame(q); else cx.clearRect(0, 0, w, h);
    })(ini);
  }

  /* ---------- início ---------- */
  var inicio = restaurar();
  // ?tipo=cardapio (botões do bloco do cardápio na página inicial) já deixa a opção marcada; não atropela rascunho em andamento
  var tipoUrl = new URLSearchParams(location.search).get('tipo');
  if (inicio === 0 && /^(site|cardapio|sistema|automacao)$/.test(tipoUrl || '')) {
    var rTipo = form.querySelector('[name="oque"][value="' + tipoUrl + '"]'); if (rTipo) rTipo.checked = true;
  }
  ajustarTipo(); desenharFotos(); marcarRamo();
  $$('.cp input, .cp textarea', form).forEach(function (el) { if (el.value && el.type !== 'file' && el.type !== 'color') marcarOk(el); });
  if (!form.hidden) { irPara(inicio); if (inicio === 0) robo('r-acena'); }
  atualizarPrevia();
})();
