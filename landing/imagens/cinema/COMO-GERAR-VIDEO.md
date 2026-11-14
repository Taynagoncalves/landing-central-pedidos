# Como gerar o vídeo de fundo do hero

O hero já funciona sem vídeo: o fundo é uma luz laranja animada desenhada no `<canvas>`. Quando você colocar
os quadros de um vídeo nesta pasta, o canvas passa a mostrar o vídeo **avançando e voltando junto com a rolagem**
(o mesmo efeito das páginas da Apple). Não precisa mexer no código.

## O que o vídeo precisa ser

O vídeo é só o **fundo**. Os aparelhos (totem, tablet, painel, celular, impressora), o cartão do pedido e os textos
continuam sendo desenhados por cima pelo site. Por isso:

- **Nada de aparelhos, telas, textos, logos ou pessoas no vídeo.** Só ambiente, luz e movimento de câmera.
- **Escuro**, quase preto (#0B0B0C), com luz no **laranja da marca (#FF5500)**.
- **Centro mais limpo e escuro**, porque é ali que ficam os aparelhos e os títulos.
- **Um movimento de câmera contínuo, sem cortes bruscos**. Cada parte da rolagem mostra um trecho do vídeo.

| | Desktop | Celular |
|---|---|---|
| Proporção | 16:9 | 9:16 |
| Resolução | 1920 × 1080 (ou maior) | 1080 × 1920 (ou maior) |
| Duração total | 10 s (4 takes de ~2,5 s) | 10 s (os mesmos 4 takes) |
| Arquivo final | `hero-16x9.mp4` | `hero-9x16.mp4` |

A maioria das IAs de vídeo (Kling, Veo, Runway) gera clipes de 5 a 10 segundos. O caminho mais fácil é gerar
cada take separado e juntar tudo no final (comando mais abaixo). Gere cada take **duas vezes**: uma em 16:9 e outra
em 9:16. Se a ferramenta não fizer 9:16, pule: o script recorta o meio do vídeo horizontal para o celular.

## Os 4 takes (na ordem da história)

Dica: em todos, peça câmera lenta e estável. Se a ferramenta tiver "negative prompt", use:
`text, letters, logo, watermark, people, faces, hands, phones, screens, monitors, tablets, cuts, flicker, bright white background`

### Take 1: Abertura (a palavra "PEDIU." e o totem saindo da escuridão)
- Duração: 2,5 s · Câmera: aproximação lenta (slow push-in)

```
Cinematic macro shot of a pitch-black void, a warm orange (#FF5500) light slowly blooming upward from the bottom center, fine dust particles floating and catching the light, subtle volumetric haze, very dark background, shallow depth of field, slow steady push-in, no cuts, 24fps, film grain, moody commercial lighting
```

### Take 2: O pedido no totem (zoom na tela e o cliente montando o pedido)
- Duração: 2,5 s · Câmera: dolly para frente, devagar

```
Dark modern fast-casual restaurant at night, counter area completely out of focus, warm orange bokeh lights in the background, soft orange rim light from the left, deep blacks, slow forward dolly movement toward the center, cinematic, anamorphic look, empty center of frame, no people, no text, 24fps, subtle film grain
```

### Take 3: Mesa, celular e painel (a câmera passa de lado para o monitor)
- Duração: 2,5 s · Câmera: travelling lateral para a direita (truck right)

```
Slow lateral tracking shot moving right along a dark restaurant dining room at night, tables and pendant lamps heavily blurred into warm orange bokeh, dark charcoal tones, light streaks passing gently, smooth gimbal movement, cinematic shallow depth of field, empty and dark center, no people, no text, 24fps, film grain
```

### Take 4: Cozinha e final (o cupom saindo e a câmera se afastando)
- Duração: 2,5 s · Câmera: começa perto e se afasta (pull-back / dolly out)

```
Dark professional kitchen pass at night, orange heat lamps glowing above a stainless steel counter, soft steam rising through the warm light, everything slightly out of focus, camera slowly pulling back to a wide dark shot with a warm orange glow on the horizon, deep blacks, cinematic, no people, no text, 24fps, film grain
```

## Juntar os takes em um vídeo só

Instale o ffmpeg (no Windows: `winget install Gyan.FFmpeg`, depois feche e abra o terminal). Na pasta dos vídeos,
crie um arquivo `lista.txt` com os takes na ordem:

```
file 'take1.mp4'
file 'take2.mp4'
file 'take3.mp4'
file 'take4.mp4'
```

E rode (desktop):

```
ffmpeg -f concat -safe 0 -i lista.txt -vf "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,fps=24" -c:v libx264 -crf 18 -pix_fmt yuv420p -an hero-16x9.mp4
```

Para o celular, com os takes em 9:16 (`lista-9x16.txt`):

```
ffmpeg -f concat -safe 0 -i lista-9x16.txt -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=24" -c:v libx264 -crf 18 -pix_fmt yuv420p -an hero-9x16.mp4
```

## Extrair os quadros para o site

Na pasta do projeto (`landing-central-pedidos`):

```
node ferramentas/extrair-quadros.js hero-16x9.mp4 hero-9x16.mp4
```

Ou, só com o vídeo horizontal (o celular usa um recorte 9:16 do meio dele):

```
node ferramentas/extrair-quadros.js hero-16x9.mp4
```

Isso gera cerca de 150 quadros WebP em `landing/imagens/cinema/hero/` (1920 px, desktop) e em
`landing/imagens/cinema/hero-celular/` (1080 px), mais o `quadros.json` de cada pasta. Abra a página: o fundo
já é o vídeo.

Opções úteis:
- `--quadros 120`: menos quadros e página mais leve (o padrão é 150).
- `--qualidade 70`: arquivos menores (o padrão é 78). Os 150 quadros do desktop devem ficar entre 8 e 15 MB no
  total. Eles carregam aos poucos (primeiro um quadro a cada 16, depois os do meio), então a página não trava
  esperando.
- `--so-indice`: se você copiou quadros à mão para as pastas (nomes `0001.webp`, `0002.webp`...), refaz o
  `quadros.json` sem precisar do ffmpeg.
- `--limpar`: apaga os quadros e volta para o fundo animado.

## Conferir antes de publicar

1. Abra o site por um servidor (o `quadros.json` não carrega com o arquivo aberto direto do disco).
2. Role o hero devagar: o vídeo deve avançar e voltar junto com a rolagem, sem pulos.
3. Confira se os títulos e os aparelhos continuam legíveis por cima. Se o vídeo estiver claro demais, gere de
   novo pedindo "darker, deeper blacks" (o site já escurece um pouco o vídeo para os aparelhos aparecerem).
