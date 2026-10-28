# Blog da ClickGo (clickgo.dev.br/blog/)

Blog estático de SEO local. O Render não roda build: as páginas geradas vão para o git junto com a fonte.

## Adicionar um artigo (3 passos)

1. Copie `blog/_artigos/_modelo.html` para `blog/_artigos/<slug>.html` (o nome do arquivo TEM que ser o slug:
   minúsculas, números e hífen) e preencha o bloco `<!--meta {...} -->` e o corpo.
2. Rode, na raiz do repo: `node blog/gerar.js`
   Ele cria `blog/<slug>/index.html`, refaz `blog/index.html`, `blog/feed.xml` e o trecho do blog no `sitemap.xml`,
   e avisa se o artigo tem menos de 800 ou mais de 1.200 palavras, descrição fora de 120–160 caracteres ou link
   interno para artigo que não existe. Erro de formato (JSON inválido, tag proibida) para tudo antes de gravar.
3. Confira a página no navegador, faça `git add` arquivo por arquivo (nunca `git add .`) e push no `main`.
   O Render publica sozinho.

## Regras do conteúdo

- **Preço e benefício: só os da tabela** (`solutiva-app/data/precos.json`, pacotes que não estão `foraDeVenda`).
  Nada de estatística, porcentagem, depoimento ou cliente inventado. Não prometer posição no Google.
- O cardápio NÃO tem pagamento online, integração com app de delivery, PDV nem app para instalar.
- Corpo: só `p, h2, h3, ul, ol, li, strong, em, a` (sem classe, estilo, imagem ou script). Sem `h1` (o gerador põe).
- Um `<!--cta-->` no meio do texto vira o quadro "prévia grátis". O CTA final, as perguntas frequentes (do `faq`
  do meta, com FAQPage no schema) e o "Leia também" o gerador põe sozinho.
- `tema`: `cardapio` (botão vai para `/esboco/?tipo=cardapio`) ou `agenda` (botão vai para `/esboco/`).
- 2 ou 3 links internos para outros artigos (`/blog/<slug>/`). Regiões (Taguatinga, Águas Claras, Ceilândia…)
  como exemplo natural, sem forçar.
- Para revisar um artigo antigo, edite a fonte e ponha `"atualizado": "AAAA-MM-DD"` no meta.

## O que o gerador garante

title/description únicos, canonical, Open Graph, schema.org BlogPosting + BreadcrumbList + FAQPage, sitemap e RSS.
Segurança: nenhum script inline (só o JSON-LD, que não executa), só `/pixel.js` e `/contato.js` (já na CSP do
`render.yaml`), sem formulário. Visual em `blog/blog.css`: sólido, sem vidro/blur/gradiente, animação só com
transform/opacity e `prefers-reduced-motion`.
