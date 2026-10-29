#!/usr/bin/env node
/* Gerador do blog da ClickGo (sem dependências; Node 18+).
   Lê blog/_artigos/<slug>.html (bloco <!--meta {json} --> + corpo em HTML simples) e escreve:
     blog/<slug>/index.html   (artigo com SEO: canonical, Open Graph, Article + BreadcrumbList + FAQPage)
     blog/index.html          (índice com os cartões, do mais novo para o mais antigo)
     sitemap.xml              (só o trecho entre <!-- blog:inicio --> e <!-- blog:fim -->)
   Uso: node blog/gerar.js        (rodar da raiz do repo ou de qualquer lugar)
   Arquivos em _artigos/ que começam com "_" (ex.: _modelo.html) são ignorados. Veja blog/README.md. */
'use strict';
const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const BLOG = __dirname;
const FONTES = path.join(BLOG, '_artigos');
const SITE = 'https://clickgo.dev.br';
const ZAP = '5561984717809';
const OG = SITE + '/assets/og-cover.jpg';
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const TAGS_OK = /^(p|h2|h3|ul|ol|li|strong|em|a|br)$/;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const ld = (o) => JSON.stringify(o).replace(/</g, '\\u003c');
const dataBR = (iso) => { const [a, m, d] = iso.split('-').map(Number); return `${d} de ${MESES[m - 1]} de ${a}`; };
const palavras = (html) => html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
const zapLink = (msg) => `https://wa.me/${ZAP}?text=${encodeURIComponent(msg)}`;

function ler(arquivo) {
  const bruto = fs.readFileSync(arquivo, 'utf8').replace(/^﻿/, '');
  const m = bruto.match(/^\s*<!--meta\s*([\s\S]*?)-->\s*([\s\S]*)$/);
  if (!m) throw new Error(`${arquivo}: falta o bloco <!--meta {...} --> no topo`);
  let meta;
  try { meta = JSON.parse(m[1]); } catch (e) { throw new Error(`${arquivo}: JSON do meta inválido (${e.message})`); }
  const corpo = m[2].trim();
  const erros = [];
  for (const k of ['slug', 'titulo', 'tituloSeo', 'descricao', 'resumo', 'tema', 'data']) if (!meta[k]) erros.push(`falta "${k}"`);
  if (meta.slug && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(meta.slug)) erros.push('slug só com letras minúsculas, números e hífen');
  if (meta.slug && path.basename(arquivo, '.html') !== meta.slug) erros.push('o nome do arquivo tem que ser <slug>.html');
  if (meta.tema && !/^(cardapio|agenda)$/.test(meta.tema)) erros.push('tema é "cardapio" ou "agenda"');
  if (meta.data && !/^\d{4}-\d{2}-\d{2}$/.test(meta.data)) erros.push('data no formato AAAA-MM-DD');
  if (meta.atualizado && !/^\d{4}-\d{2}-\d{2}$/.test(meta.atualizado)) erros.push('atualizado no formato AAAA-MM-DD');
  // corpo: só tags simples, sem atributos além de href interno/https
  for (const t of corpo.matchAll(/<\/?([a-zA-Z0-9]+)([^>]*)>/g)) {
    const tag = t[1].toLowerCase();
    if (!TAGS_OK.test(tag)) { erros.push(`tag não permitida no corpo: <${tag}>`); continue; }
    const attrs = t[2].trim();
    if (attrs && !(tag === 'a' && /^href="(\/[^"\s<>]*|https:\/\/[^"\s<>]+)"$/.test(attrs))) erros.push(`atributo não permitido: <${tag} ${attrs}>`);
  }
  if (/<!--(?!cta-->)/.test(corpo)) erros.push('o único comentário aceito no corpo é <!--cta-->');
  if ((corpo.match(/<!--cta-->/g) || []).length > 1) erros.push('use no máximo um <!--cta--> no corpo');
  const faq = Array.isArray(meta.faq) ? meta.faq : [];
  faq.forEach((f, i) => { if (!f || !f.p || !f.r) erros.push(`faq[${i}] precisa de "p" e "r"`); });
  if (erros.length) throw new Error(`${arquivo}:\n  - ${erros.join('\n  - ')}`);
  const total = palavras(corpo) + palavras(faq.map((f) => f.p + ' ' + f.r).join(' '));
  return { ...meta, faq, corpo, total };
}

const CTA = {
  cardapio: { url: '/esboco/?tipo=cardapio', botao: 'Ver meu cardápio grátis', titulo: 'Veja o seu cardápio pronto antes de pagar', texto: 'Conte do seu negócio, mande as fotos e receba a prévia grátis. Você só paga se aprovar.', zap: 'Olá! Li um artigo do blog da ClickGo sobre cardápio digital e tenho uma dúvida.' },
  agenda: { url: '/esboco/', botao: 'Ver meu site grátis', titulo: 'Veja o seu site com agenda antes de pagar', texto: 'Conte do seu negócio e receba a prévia grátis, com os seus serviços e horários. Você só paga se aprovar.', zap: 'Olá! Li um artigo do blog da ClickGo sobre site com agenda e tenho uma dúvida.' },
};

function quadroCta(tema, classe) {
  const c = CTA[tema];
  return `<aside class="${classe}" aria-label="Prévia grátis">
  <p class="cta-t">${esc(c.titulo)}</p>
  <p>${esc(c.texto)}</p>
  <div class="cta-acoes">
    <a class="bt bt-prim" href="${c.url}">${esc(c.botao)} <span aria-hidden="true">→</span></a>
    <a class="bt bt-zap" data-zap data-zap-msg="${esc(c.zap)}" href="${zapLink(c.zap)}" target="_blank" rel="noopener">Tirar dúvida no WhatsApp</a>
  </div>
</aside>`;
}

function cabeca({ titulo, descricao, url, tipo, ogTitulo, extra }) {
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(descricao)}">
<meta name="theme-color" content="#f6efe4">
<meta name="robots" content="index, follow, max-image-preview:large">
<link rel="canonical" href="${url}">
<meta property="og:type" content="${tipo}">
<meta property="og:locale" content="pt_BR">
<meta property="og:site_name" content="ClickGo">
<meta property="og:title" content="${esc(ogTitulo || titulo)}">
<meta property="og:description" content="${esc(descricao)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${OG}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="ClickGo: cardápio digital e site com agenda para o seu negócio">
<meta name="twitter:card" content="summary_large_image">
${extra || ''}<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="512x512" href="/assets/icon-512.png">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<link rel="alternate" type="application/rss+xml" title="Blog da ClickGo" href="/blog/feed.xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700..800&family=Onest:wght@400;500;700&display=swap">
<link rel="stylesheet" href="/blog/blog.css?v=1">
<script src="/pixel.js?v=2" defer></script>
<script src="/contato.js" defer></script>
</head>
<body>
<a class="pular" href="#conteudo">Pular para o conteúdo</a>
<header class="topo">
  <div class="caixa topo-in">
    <a class="marca" href="/" aria-label="ClickGo, início"><svg class="cgl" width="32" height="32" viewBox="170 126 655 655" aria-hidden="true" focusable="false"><style>svg.cgl{display:block;flex:none;overflow:visible}svg.cgl .cgl-p{transform-box:fill-box;transform-origin:50% 60%;animation:cgl-entra .62s cubic-bezier(.3,.8,.25,1.12) both}svg.cgl .cgl-1{animation-delay:.08s}svg.cgl .cgl-2{animation-delay:.16s}svg.cgl .cgl-3{animation-delay:.24s}svg.cgl .cgl-4{animation-delay:.32s}svg.cgl .cgl-5{animation-delay:.40s}svg.cgl .cgl-6{animation-delay:.48s}svg.cgl .cgl-7{animation-delay:.56s}@keyframes cgl-entra{0%{opacity:0;transform:translateY(14%) scale(.9)}62%{opacity:1;transform:translateY(-1.5%) scale(1.02)}100%{opacity:1;transform:none}}@media (prefers-reduced-motion:reduce){svg.cgl .cgl-p{animation:none}}</style><defs><clipPath id="cgl-cab"><rect x="230" y="250" width="540" height="420" rx="120"/></clipPath></defs><g class="cgl-p cgl-2"><line x1="500" y1="255" x2="500" y2="175" stroke="#3FA2F7" stroke-width="26" stroke-linecap="round"/><circle cx="500" cy="160" r="34" fill="#22D3EE"/><polygon points="500,126 534,160 500,160" fill="#B9F1FF"/></g><g class="cgl-p cgl-1"><rect x="170" y="410" width="60" height="150" rx="26" fill="#1F5FD6"/><rect x="770" y="410" width="60" height="150" rx="26" fill="#0F2C66"/></g><g class="cgl-p cgl-0" clip-path="url(#cgl-cab)"><polygon points="230,250 770,250 230,670" fill="#2D7BF0"/><polygon points="770,250 770,670 230,670" fill="#1F5FD6"/><polygon points="230,250 527,250 230,460" fill="#3FA2F7"/><polygon points="770,439 770,670 473,670" fill="#0F2C66"/></g><g class="cgl-p cgl-3"><rect x="290" y="330" width="420" height="250" rx="125" fill="#0B1220"/><rect x="290" y="330" width="420" height="250" rx="125" fill="none" stroke="#22D3EE" stroke-opacity=".55" stroke-width="8"/></g><g class="cgl-p cgl-4"><rect x="398.4" y="393" width="52" height="84" rx="26" fill="#22D3EE"/><rect x="549.6" y="393" width="52" height="84" rx="26" fill="#22D3EE"/></g><path class="cgl-p cgl-5" d="M466.4 520 Q500 545 533.6 520" fill="none" stroke="#22D3EE" stroke-width="14" stroke-linecap="round"/><polygon class="cgl-p cgl-6" points="650,520 650,741 705.9,690.3 742.3,774.8 776.1,760.5 741,679.9 811.2,679.9" fill="#F2F8FF" stroke="#0B1220" stroke-width="12" stroke-linejoin="round" paint-order="stroke"/><g class="cgl-p cgl-7" stroke="#F2F8FF" stroke-width="13" stroke-linecap="round"><line x1="615.36" y1="500" x2="582.45" y2="481"/><line x1="639.65" y1="481.36" x2="629.81" y2="444.66"/><line x1="670" y1="485.36" x2="689" y2="452.45"/></g></svg>Click<b>Go</b></a>
    <nav class="menu" aria-label="Principal">
      <a href="/blog/">Blog</a>
      <a class="bt bt-prim bt-mini" href="/esboco/">Prévia grátis</a>
    </nav>
  </div>
</header>
`;
}

function rodape() {
  const msg = 'Olá! Vim pelo blog da ClickGo e tenho uma dúvida.';
  return `<footer class="rodape">
  <div class="caixa rodape-in">
    <p class="rodape-marca">Click<b>Go</b> · cardápio digital e site com agenda. Brasília, DF, atendendo o Brasil todo.</p>
    <nav class="rodape-links" aria-label="Rodapé">
      <a href="/">Início</a>
      <a href="/blog/">Blog</a>
      <a href="/esboco/">Prévia grátis</a>
      <a data-zap data-zap-msg="${esc(msg)}" href="${zapLink(msg)}" target="_blank" rel="noopener">WhatsApp</a>
      <a href="/privacidade.html">Privacidade</a>
      <a href="/termos.html">Termos</a>
    </nav>
  </div>
</footer>
</body>
</html>
`;
}

const ORG = { '@type': 'Organization', '@id': SITE + '/#clickgo', name: 'ClickGo', url: SITE + '/', logo: { '@type': 'ImageObject', url: SITE + '/assets/icon-512.png' } };

function paginaArtigo(a, todos) {
  const url = `${SITE}/blog/${a.slug}/`;
  const mod = a.atualizado || a.data;
  const grafo = [
    {
      '@type': 'BlogPosting', '@id': url + '#artigo', headline: a.titulo, description: a.descricao, image: OG,
      datePublished: a.data, dateModified: mod, inLanguage: 'pt-BR', wordCount: a.total,
      mainEntityOfPage: { '@type': 'WebPage', '@id': url }, author: ORG, publisher: ORG,
      about: a.tema === 'cardapio' ? 'Cardápio digital' : 'Site com agenda online',
    },
    {
      '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Início', item: SITE + '/' },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: SITE + '/blog/' },
        { '@type': 'ListItem', position: 3, name: a.titulo, item: url },
      ],
    },
  ];
  if (a.faq.length) grafo.push({ '@type': 'FAQPage', mainEntity: a.faq.map((f) => ({ '@type': 'Question', name: f.p, acceptedAnswer: { '@type': 'Answer', text: f.r } })) });
  const extra = `<meta property="article:published_time" content="${a.data}">
<meta property="article:modified_time" content="${mod}">
<script type="application/ld+json">${ld({ '@context': 'https://schema.org', '@graph': grafo })}</script>
`;
  const corpo = a.corpo.replace(/<!--cta-->/, quadroCta(a.tema, 'cta cta-meio'));
  const faq = a.faq.length ? `<section class="faq" aria-labelledby="faq-t">
  <h2 id="faq-t">Perguntas frequentes</h2>
${a.faq.map((f) => `  <details><summary>${esc(f.p)}</summary><p>${esc(f.r)}</p></details>`).join('\n')}
</section>` : '';
  const outros = todos.filter((o) => o.slug !== a.slug).sort((x, y) => (y.tema === a.tema) - (x.tema === a.tema) || y.data.localeCompare(x.data)).slice(0, 3);
  const minutos = Math.max(1, Math.round(a.total / 200));
  return cabeca({ titulo: `${a.tituloSeo} | ClickGo`, ogTitulo: a.titulo, descricao: a.descricao, url, tipo: 'article', extra }) + `<main id="conteudo" class="artigo">
  <div class="caixa estreita">
    <nav class="trilha" aria-label="Você está em"><a href="/">Início</a><span aria-hidden="true">/</span><a href="/blog/">Blog</a></nav>
    <header class="art-cab">
      <p class="selo">${a.tema === 'cardapio' ? 'Cardápio digital' : 'Site com agenda'}</p>
      <h1>${esc(a.titulo)}</h1>
      <p class="art-info"><time datetime="${a.data}">${dataBR(a.data)}</time> · ${minutos} min de leitura</p>
    </header>
    <div class="texto">
${corpo}
    </div>
    ${faq}
    ${quadroCta(a.tema, 'cta cta-fim')}
  </div>
  <section class="mais caixa" aria-labelledby="mais-t">
    <h2 id="mais-t">Leia também</h2>
    <ul class="cartoes">
${outros.map(cartao).join('\n')}
    </ul>
  </section>
</main>
` + rodape();
}

function cartao(a) {
  return `      <li class="cartao"><a href="/blog/${a.slug}/">
        <span class="selo">${a.tema === 'cardapio' ? 'Cardápio digital' : 'Site com agenda'}</span>
        <span class="cartao-t">${esc(a.titulo)}</span>
        <span class="cartao-r">${esc(a.resumo)}</span>
        <span class="cartao-l">Ler artigo <span aria-hidden="true">→</span></span>
      </a></li>`;
}

function paginaIndice(todos) {
  const url = SITE + '/blog/';
  const desc = 'Guias práticos de cardápio digital, pedido no WhatsApp, QR Code na mesa e agenda online para pequenos negócios de Brasília e do Brasil.';
  const grafo = [
    { '@type': 'Blog', '@id': url + '#blog', name: 'Blog da ClickGo', url, description: desc, inLanguage: 'pt-BR', publisher: ORG,
      blogPost: todos.map((a) => ({ '@type': 'BlogPosting', headline: a.titulo, url: `${SITE}/blog/${a.slug}/`, datePublished: a.data })) },
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Início', item: SITE + '/' },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: url },
    ] },
  ];
  const extra = `<script type="application/ld+json">${ld({ '@context': 'https://schema.org', '@graph': grafo })}</script>\n`;
  return cabeca({ titulo: 'Blog: cardápio digital e agenda online para o seu negócio | ClickGo', descricao: desc, url, tipo: 'website', extra }) + `<main id="conteudo" class="indice">
  <div class="caixa">
    <nav class="trilha" aria-label="Você está em"><a href="/">Início</a><span aria-hidden="true">/</span><span>Blog</span></nav>
    <header class="ind-cab">
      <h1>Blog da ClickGo</h1>
      <p>Guias curtos e práticos para quem tem restaurante, pizzaria, barbearia, salão ou consultório e quer vender e agendar pelo celular.</p>
    </header>
    <ul class="cartoes">
${todos.map(cartao).join('\n')}
    </ul>
    ${quadroCta('cardapio', 'cta cta-fim')}
  </div>
</main>
` + rodape();
}

function feed(todos) {
  const itens = todos.map((a) => `  <item>
    <title>${esc(a.titulo)}</title>
    <link>${SITE}/blog/${a.slug}/</link>
    <guid>${SITE}/blog/${a.slug}/</guid>
    <pubDate>${new Date(a.data + 'T12:00:00-03:00').toUTCString()}</pubDate>
    <description>${esc(a.resumo)}</description>
  </item>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>Blog da ClickGo</title>
  <link>${SITE}/blog/</link>
  <description>Cardápio digital e site com agenda para pequenos negócios.</description>
  <language>pt-BR</language>
${itens}
</channel>
</rss>
`;
}

function atualizarSitemap(todos) {
  const arq = path.join(RAIZ, 'sitemap.xml');
  let xml = fs.readFileSync(arq, 'utf8');
  const novo = todos.reduce((m, a) => ((a.atualizado || a.data) > m ? (a.atualizado || a.data) : m), '0000');
  const linhas = [`  <url><loc>${SITE}/blog/</loc><lastmod>${novo}</lastmod><changefreq>weekly</changefreq></url>`]
    .concat(todos.map((a) => `  <url><loc>${SITE}/blog/${a.slug}/</loc><lastmod>${a.atualizado || a.data}</lastmod><changefreq>monthly</changefreq></url>`));
  const bloco = `  <!-- blog:inicio (gerado por blog/gerar.js; não editar à mão) -->\n${linhas.join('\n')}\n  <!-- blog:fim -->`;
  if (/  <!-- blog:inicio[\s\S]*?<!-- blog:fim -->/.test(xml)) xml = xml.replace(/  <!-- blog:inicio[\s\S]*?<!-- blog:fim -->/, bloco);
  else xml = xml.replace('</urlset>', bloco + '\n</urlset>');
  fs.writeFileSync(arq, xml);
}

function main() {
  const arquivos = fs.readdirSync(FONTES).filter((f) => f.endsWith('.html') && !f.startsWith('_'));
  const todos = arquivos.map((f) => ler(path.join(FONTES, f))).sort((x, y) => y.data.localeCompare(x.data) || x.slug.localeCompare(y.slug));
  const avisos = [];
  for (const a of todos) {
    if (a.total < 800 || a.total > 1200) avisos.push(`${a.slug}: ${a.total} palavras (alvo 800 a 1.200)`);
    if (a.descricao.length < 120 || a.descricao.length > 160) avisos.push(`${a.slug}: descrição com ${a.descricao.length} caracteres (alvo 120 a 160)`);
    if ((a.tituloSeo + ' | ClickGo').length > 70) avisos.push(`${a.slug}: título da aba longo (${(a.tituloSeo + ' | ClickGo').length} caracteres)`);
    const dir = path.join(BLOG, a.slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), paginaArtigo(a, todos));
  }
  // links internos quebrados
  const slugs = new Set(todos.map((a) => a.slug));
  for (const a of todos) for (const l of a.corpo.matchAll(/href="\/blog\/([^"/]+)\/"/g)) if (!slugs.has(l[1])) avisos.push(`${a.slug}: link para artigo que não existe (/blog/${l[1]}/)`);
  fs.writeFileSync(path.join(BLOG, 'index.html'), paginaIndice(todos));
  fs.writeFileSync(path.join(BLOG, 'feed.xml'), feed(todos));
  atualizarSitemap(todos);
  console.log(`Blog gerado: ${todos.length} artigos.`);
  for (const a of todos) console.log(`  /blog/${a.slug}/  (${a.total} palavras)`);
  if (avisos.length) console.log('Avisos:\n  ' + avisos.join('\n  '));
}

try { main(); } catch (e) { console.error(e.message); process.exit(1); }
