// Gera a sequência de quadros do fundo do hero (estilo das páginas da Apple) a partir de um vídeo.
//
// Uso:
//   node ferramentas/extrair-quadros.js video-16x9.mp4                     → desktop + celular (recorte 9:16 do mesmo vídeo)
//   node ferramentas/extrair-quadros.js video-16x9.mp4 video-9x16.mp4      → desktop + celular (vídeo vertical próprio)
//   node ferramentas/extrair-quadros.js video.mp4 --quadros 180 --qualidade 80
//   node ferramentas/extrair-quadros.js --so-indice                        → só refaz o quadros.json das pastas (se você copiou quadros à mão)
//   node ferramentas/extrair-quadros.js --limpar                           → apaga os quadros e volta para o fundo animado
//
// Saída:
//   landing/imagens/cinema/hero/0001.webp ...          1920 px de largura (desktop)
//   landing/imagens/cinema/hero-celular/0001.webp ...  1080 px de largura (celular)
//   + quadros.json em cada pasta. O site lê esse arquivo sozinho: com "total" maior que 1 usa os quadros,
//     com 0 mostra o fundo animado. Não precisa mexer no código.
//
// Precisa do ffmpeg e do ffprobe instalados (https://ffmpeg.org/download.html), com suporte a WebP (libwebp).
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const RAIZ = path.join(__dirname, "..", "landing", "imagens", "cinema");
const PASTAS = { desktop: path.join(RAIZ, "hero"), celular: path.join(RAIZ, "hero-celular") };

const args = process.argv.slice(2);
const opcao = (nome, padrao) => { const i = args.indexOf(nome); return i >= 0 ? args[i + 1] : padrao; };
const QUADROS = Number(opcao("--quadros", 150));
const QUALIDADE = Number(opcao("--qualidade", 78));
const videos = args.filter((a, i) => !a.startsWith("--") && !(i > 0 && args[i - 1].startsWith("--") && !["--so-indice", "--limpar"].includes(args[i - 1])));

function sair(msg) { console.error("\n✖ " + msg + "\n"); process.exit(1); }
function quadrosNaPasta(pasta) { return fs.existsSync(pasta) ? fs.readdirSync(pasta).filter((f) => /^\d{4}\.webp$/.test(f)).sort() : []; }
function escreverIndice(pasta, largura) {
  const lista = quadrosNaPasta(pasta);
  // os quadros precisam estar em sequência, sem buracos: 0001, 0002, 0003...
  const seguidos = lista.findIndex((f, i) => f !== String(i + 1).padStart(4, "0") + ".webp");
  const total = seguidos === -1 ? lista.length : seguidos;
  fs.mkdirSync(pasta, { recursive: true });
  fs.writeFileSync(path.join(pasta, "quadros.json"), JSON.stringify({ total, largura: largura || null, gerado: new Date().toISOString() }, null, 2) + "\n");
  console.log(`  ${path.relative(process.cwd(), pasta)}/quadros.json → ${total} quadros`);
  return total;
}
function limpar(pasta) {
  quadrosNaPasta(pasta).forEach((f) => fs.unlinkSync(path.join(pasta, f)));
}

if (args.includes("--limpar")) {
  Object.values(PASTAS).forEach((p) => { limpar(p); escreverIndice(p); });
  console.log("Quadros apagados. O hero volta a usar o fundo animado.");
  process.exit(0);
}
if (args.includes("--so-indice")) {
  Object.values(PASTAS).forEach((p) => escreverIndice(p));
  process.exit(0);
}
if (!videos.length) sair("Informe o vídeo. Ex.: node ferramentas/extrair-quadros.js meu-video.mp4");
if (!(QUADROS > 1)) sair("--quadros precisa ser um número maior que 1.");
videos.forEach((v) => { if (!fs.existsSync(v)) sair("Não achei o arquivo: " + v); });

const temFfmpeg = spawnSync("ffmpeg", ["-version"], { encoding: "utf8" });
if (temFfmpeg.error || temFfmpeg.status !== 0) sair("ffmpeg não encontrado. Instale (https://ffmpeg.org/download.html) e confira com: ffmpeg -version");

function duracao(video) {
  const r = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", video], { encoding: "utf8" });
  const d = parseFloat(r.stdout);
  if (!(d > 0)) sair("Não consegui ler a duração do vídeo com o ffprobe: " + video);
  return d;
}

function extrair(video, pasta, largura, recorteVertical) {
  const fps = (QUADROS / duracao(video)).toFixed(4);
  const filtros = [`fps=${fps}`];
  if (recorteVertical) filtros.push("crop='min(iw,ih*9/16)':ih"); // pega o meio do vídeo horizontal em 9:16
  filtros.push(`scale=${largura}:-2:flags=lanczos`);
  fs.mkdirSync(pasta, { recursive: true });
  limpar(pasta);
  console.log(`\n▶ ${path.basename(video)} → ${path.relative(process.cwd(), pasta)} (${largura}px, ${QUADROS} quadros)`);
  const r = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", video, "-vf", filtros.join(","), "-frames:v", String(QUADROS),
    "-c:v", "libwebp", "-quality", String(QUALIDADE), "-compression_level", "5", "-preset", "picture", path.join(pasta, "%04d.webp")], { stdio: "inherit" });
  if (r.status !== 0) sair("O ffmpeg falhou. Confira se ele tem suporte a WebP: ffmpeg -encoders | findstr webp");
  const total = escreverIndice(pasta, largura);
  const tamanho = quadrosNaPasta(pasta).reduce((s, f) => s + fs.statSync(path.join(pasta, f)).size, 0);
  console.log(`  ${total} quadros, ${(tamanho / 1048576).toFixed(1)} MB no total`);
}

extrair(videos[0], PASTAS.desktop, 1920, false);
extrair(videos[1] || videos[0], PASTAS.celular, 1080, !videos[1]);
console.log("\n✔ Pronto. Abra a página: o fundo do hero já usa os quadros.\n  Depois rode node ferramentas/gerar-segmentos.js se tiver mexido no index.html.\n");
