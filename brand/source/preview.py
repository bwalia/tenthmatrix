import subprocess, os, sys
from PIL import Image, ImageDraw
SRC = sys.argv[1] if len(sys.argv)>1 else 'out'
OUTP = sys.argv[2] if len(sys.argv)>2 else 'preview.png'
os.makedirs('r', exist_ok=True)
def render(name, h=None, w=None):
    out = f'r/{name}-{h}-{w}.png'
    args = ['rsvg-convert', f'{SRC}/{name}', '-o', out]
    if h: args += ['-h', str(h)]
    if w: args += ['-w', str(w)]
    subprocess.run(args, check=True); return Image.open(out).convert('RGBA')
W, H = 1600, 1500
img = Image.new('RGB', (W, H), '#F7F6F2')
d = ImageDraw.Draw(img)
d.rectangle([0, H//2, W, H], fill='#0E1113')
def panel(y0, light):
    x = 40; y = y0 + 30
    lk = 'tm-logo.svg' if light else 'tm-logo-on-dark.svg'
    st = 'tm-logo-stacked.svg' if light else 'tm-logo-stacked-on-dark.svg'
    mk = 'tm-mark.svg' if light else 'tm-mark-on-dark.svg'
    mono = 'tm-logo-mono-dark.svg' if light else 'tm-logo-mono-light.svg'
    for h in (96, 48, 32, 20):
        im = render(lk, h=h); img.paste(im, (x, y), im); y += h + 24
    y2 = y0 + 30; x2 = 1100
    im = render(st, h=160); img.paste(im, (x2, y2), im)
    im = render(mono, h=32); img.paste(im, (x, y), im)
    # marks at real sizes
    xx = 40; yy = y + 60
    for s in (128, 64, 48, 32, 24, 16):
        im = render(mk, h=s); img.paste(im, (xx, yy), im); xx += s + 30
    im = render('icon.svg', h=16); img.paste(im, (xx, yy), im); xx += 40
    im = render('icon.svg', h=32); img.paste(im, (xx, yy), im); xx += 60
    # 16px renders upscaled x8 nearest
    for n in (mk, 'icon.svg'):
        im = render(n, h=16).resize((128,128), Image.NEAREST)
        img.paste(im, (xx, yy), im); xx += 150
panel(0, True); panel(H//2, False)
img.save(OUTP); print(OUTP)
