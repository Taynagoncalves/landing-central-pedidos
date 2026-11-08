// Gera as páginas por tipo de negócio (hamburgueria, pizzaria, açaí) a partir do landing/index.html.
// Depois de mexer no index.html, rode:  node ferramentas/gerar-segmentos.js
// Cada página troca título, descrição, chamada principal e endereço — o resto é igual ao site.
const fs = require("fs");
const path = require("path");

const RAIZ = path.join(__dirname, "..", "landing");
const SITE = "https://www.hugahuga.com.br";
const base = fs.readFileSync(path.join(RAIZ, "index.html"), "utf8");

const SEGMENTOS = [
  {
    pasta: "hamburgueria",
    titulo: "Sistema para Hamburgueria – Cardápio online, delivery, mesas e totem | Huga Huga",
    descricao: "Sistema para hamburgueria: cardápio online com adicionais, delivery e retirada, Pix e cartão, mesas com QR Code, tablet na mesa, totem de autoatendimento e impressão automática. Sem comissão por pedido.",
    h1: `Sua hamburgueria vendendo mais, com <span class="brand-c">tecnologia de verdade</span>.`,
    lead: "Cardápio online com adicionais e combos, delivery e retirada, Pix e cartão, mesas com QR Code, tablet na mesa, totem no balcão e impressão automática na cozinha — sem comissão por pedido."
  },
  {
    pasta: "pizzaria",
    titulo: "Sistema para Pizzaria – Pizza meio a meio, delivery e motoboys | Huga Huga",
    descricao: "Sistema para pizzaria: pizza com vários sabores e bordas, delivery com gestão de motoboys, Pix e cartão, mesas com QR Code, tablet, totem e impressão automática. Sem comissão por pedido.",
    h1: `Sua pizzaria vendendo mais, com <span class="brand-c">tecnologia de verdade</span>.`,
    lead: "Pizza com vários sabores e bordas recheadas, delivery com gestão de motoboys, Pix e cartão, mesas com QR Code, tablet na mesa, totem no balcão e impressão automática — sem comissão por pedido."
  },
  {
    pasta: "acai",
    titulo: "Sistema para Açaiteria – Monte seu açaí, delivery e totem | Huga Huga",
    descricao: "Sistema para açaiteria: monte o açaí com complementos grátis e pagos, delivery e retirada, Pix e cartão, totem de autoatendimento e WhatsApp automático. Sem comissão por pedido.",
    h1: `Sua açaiteria vendendo mais, com <span class="brand-c">tecnologia de verdade</span>.`,
    lead: "O cliente monta o açaí com complementos grátis e pagos, pede por delivery ou retirada, paga com Pix ou cartão e ainda pode usar o totem no balcão — sem comissão por pedido."
  }
];

function trocar(html, de, para, nome) {
  if (!html.includes(de)) throw new Error(`[${nome}] não achei: ${de.slice(0, 60)}`);
  return html.split(de).join(para);
}

const H1_ORIGINAL = `<h1>Seu negócio vendendo mais, com <span class="brand-c">tecnologia de verdade</span>.</h1>`;
const LEAD_ORIGINAL = base.match(/<p class="lead">Cardápio online com delivery e retirada[^<]*<\/p>/)[0];
const TITULO_ORIGINAL = base.match(/<title>[^<]*<\/title>/)[0];
const DESC_ORIGINAL = base.match(/<meta name="description" content="[^"]*">/)[0];

for (const seg of SEGMENTOS) {
  const url = `${SITE}/${seg.pasta}/`;
  let html = base;
  html = trocar(html, TITULO_ORIGINAL, `<title>${seg.titulo}</title>\n  <link rel="canonical" href="${url}">`, seg.pasta);
  html = trocar(html, DESC_ORIGINAL, `<meta name="description" content="${seg.descricao}">`, seg.pasta);
  html = html.replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${url}">`);
  html = html.replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${seg.titulo}">`);
  html = html.replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${seg.descricao}">`);
  html = html.replace(/<meta name="twitter:title" content="[^"]*">/, `<meta name="twitter:title" content="${seg.titulo}">`);
  html = html.replace(/<meta name="twitter:description" content="[^"]*">/, `<meta name="twitter:description" content="${seg.descricao}">`);
  html = trocar(html, H1_ORIGINAL, `<h1>${seg.h1}</h1>`, seg.pasta);
  html = trocar(html, LEAD_ORIGINAL, `<p class="lead">${seg.lead}</p>`, seg.pasta);
  // a página fica numa pasta abaixo: imagens sobem um nível
  html = html.replace(/(["'(])imagens\//g, "$1../imagens/");
  html = html.replace("<!DOCTYPE html>", `<!DOCTYPE html>\n<!-- Gerado por ferramentas/gerar-segmentos.js a partir do index.html. Não edite à mão. -->`);
  fs.mkdirSync(path.join(RAIZ, seg.pasta), { recursive: true });
  fs.writeFileSync(path.join(RAIZ, seg.pasta, "index.html"), html);
  console.log("gerada:", `/${seg.pasta}/`);
}

// mapa do site para o Google
const hoje = new Date().toISOString().slice(0, 10);
const urls = ["", ...SEGMENTOS.map((s) => `${s.pasta}/`)];
fs.writeFileSync(path.join(RAIZ, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls.map((u) => `  <url><loc>${SITE}/${u}</loc><lastmod>${hoje}</lastmod><priority>${u ? "0.8" : "1.0"}</priority></url>`).join("\n") +
  `\n</urlset>\n`);
fs.writeFileSync(path.join(RAIZ, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
console.log("sitemap.xml e robots.txt atualizados");
