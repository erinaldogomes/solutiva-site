/* ClickGo v8: dados dos trabalhos do portfólio (protótipo). Só trabalhos REAIS já citados na página inicial.
   Carregado síncrono no <head> de trabalho-v8.html para preencher a página antes do primeiro quadro, assim a imagem
   compartilhada (view-transition-name) já existe quando a transição entre páginas começa. Sem HTML vindo de fora:
   tudo é textContent/atributos, e o ?p= só escolhe uma chave da lista abaixo. */
(function () {
  'use strict';
  // enquanto os campos não foram preenchidos, o corpo da página fica invisível (visibility): nada salta quando o texto entra
  if (document.querySelector('link[href^="v9.css"]')) document.documentElement.classList.add('trab-pre');
  // paleta em teste (ver v8.js): aqui é síncrono, então a página já nasce na cor certa
  try {
    var pm = /[?&]paleta=([a-z]+)/.exec(location.search), pal = pm ? pm[1] : localStorage.getItem('cg-paleta');
    if (pal && /^(quente|eletrico|fofo|cobalto|atual)$/.test(pal)) document.documentElement.setAttribute('data-paleta', pal);
  } catch (e) {}
  var T = {
    eah: { n: '01', tipo: 'Site com agenda · cliente real', nome: 'English at Home', desc: 'Aulas de inglês online. O aluno escolhe o dia e a hora da aula experimental, e o professor confirma pelo painel.', tem: 'Agenda de aula experimental, área do aluno, página do professor parceiro', como: 'Site estático com agenda ligada ao WhatsApp; formulário com proteção contra robô', link: 'https://cursoenglishathome.online', img: 'assets/port-eah-desktop.webp', w: 1200, h: 750, vt: 'trab-eah' },
    orbix: { n: '02', tipo: 'Site de links', nome: 'Orbix', desc: 'Site de links de afiliado com a Lila, avatar criado com IA. Cada clique é medido e os produtos trocam sozinhos.', tem: 'Links por produto, fundo animado leve, tema claro e escuro, medição de cliques', como: 'Página gerada pelo servidor, sem biblioteca pesada; animação em canvas que para quando a aba some', link: 'https://orbixbr.onrender.com', img: 'assets/port-orbix-desktop.webp', w: 1200, h: 750, vt: 'trab-orbix' },
    clickgo: { n: '03', tipo: 'Vitrine', nome: 'ClickGo', desc: 'Este site: a vitrine, o formulário que pede a prévia, a página de acompanhamento e a sala do cliente.', tem: 'Prévia grátis, pagamento pelo Mercado Pago, sala do site com chat e mudanças', como: 'Site estático no Render + Cloudflare, sem script de fora além da medição; cabeçalhos de segurança (CSP)', link: 'https://clickgo.dev.br', img: 'assets/hero-poster.webp', w: 1280, h: 720, vt: 'trab-clickgo' },
    editorial: { n: '04', tipo: 'Exemplo (fictício)', nome: 'Modelo Editorial', desc: 'Demonstração do plano Completo, sob medida: barbearia fictícia "Alto da Serra" com abertura em vídeo, índice de serviços que revela a foto e transições entre seções. Não é cliente.', tem: 'Abertura em vídeo (só no computador), índice de serviços com duração, faixa que corre, equipe, horário com chamada para a agenda', como: 'HTML, CSS e 2 KB de JS próprios; só transform e opacity animam; Lighthouse mobile 100', link: 'exemplos/editorial-barbearia/', img: 'assets/port-editorial-desktop.webp', w: 1200, h: 750, vt: 'trab-editorial' }
  };
  var pg = (location.pathname.split('/').pop() || 'trabalho-v8.html');
  var ordem = ['eah', 'orbix', 'clickgo', 'editorial'];
  var p = (new URLSearchParams(location.search).get('p') || '').toLowerCase();
  if (!T[p]) p = 'eah';
  var t = T[p], i = ordem.indexOf(p);
  var ant = T[ordem[(i + ordem.length - 1) % ordem.length]], prox = T[ordem[(i + 1) % ordem.length]];
  function pronto() {
    var g = function (id) { return document.getElementById(id); };
    document.title = t.nome + ' · ClickGo';
    g('t-num').textContent = t.n; g('t-tipo').textContent = t.tipo; g('t-nome').textContent = t.nome; g('t-desc').textContent = t.desc;
    g('t-tem').textContent = t.tem; g('t-como').textContent = t.como;
    var l = g('t-link'); l.textContent = t.link.replace(/^https?:\/\//, ''); l.href = t.link;
    var im = g('t-img'); im.src = t.img; im.width = t.w; im.height = t.h; im.alt = 'Tela do site ' + t.nome; im.style.viewTransitionName = t.vt;
    var a = g('t-ant'); a.href = pg + '?p=' + ordem[(i + ordem.length - 1) % ordem.length]; a.querySelector('b').textContent = ant.nome;
    var x = g('t-prox'); x.href = pg + '?p=' + ordem[(i + 1) % ordem.length]; x.querySelector('b').textContent = prox.nome;
    document.documentElement.classList.remove('trab-pre');
  }
  // o script roda no <head>: espera o corpo existir, mas ANTES do primeiro quadro (DOMContentLoaded vem antes da pintura)
  if (document.getElementById('t-prox')) pronto(); else if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', pronto); else pronto();
})();
