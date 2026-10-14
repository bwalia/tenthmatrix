"""Generate TenthMatrix logo SVGs. Units: mark is 32x32; wordmark cap height 24, x-height 17, stroke 4."""
import os, math
OUT = os.environ.get('OUT', 'out')
os.makedirs(OUT, exist_ok=True)
W = 4  # stroke
# glyphs: (advance, svg-body using stroke paths; 'DOT' rects filled)
G = {
 'T': (16, '<path d="M0 2H16M8 2V24"/>'),
 'e': (17, '<path d="M2.5 15.5H15A6.5 6.5 0 1 0 13.1 20.1"/>'),
 'n': (17, '<path d="M2 7V24M2 15.5A6.5 6.5 0 0 1 15 15.5V24"/>'),
 't': (11, '<path d="M4 1V24M0 9H11"/>'),
 'h': (17, '<path d="M2 0V24M2 15.5A6.5 6.5 0 0 1 15 15.5V24"/>'),
 'M': (22, '<path d="M2 26V-2L11 13L20 -2V26" clip-path="url(#mh)"/>'),
 'a': (17, '<path d="M15 7V24"/><circle cx="8.5" cy="15.5" r="6.5"/>'),
 'r': (12, '<path d="M2 7V24M2 15.5A6.5 6.5 0 0 1 8.5 9H12"/>'),
 'i': (4,  '<path d="M2 7V24"/>'),
 'x': (16, '<path d="M-1 4L17 27M17 4L-1 27" clip-path="url(#xh)"/>'),
}
# kerning/spacing after each glyph
SP = 3.5
KERN = {('T','e'):-3.5, ('t','h'):0.5, ('t','r'):0, ('r','i'):0.5, ('a','t'):-0.5,('i','x'):0.5}

def wordmark(ink, dot):
    x = 0; parts = []; text = 'TenthMatrix'; dotx=None
    for k, ch in enumerate(text):
        adv, body = G[ch]
        if ch == 'M':
            body = body.replace('url(#mh)', 'url(#tm-mh)')
            parts.append('<clipPath id="tm-mh"><rect x="-2" y="0" width="26" height="24"/></clipPath>')
        if ch == 'x':
            body = body.replace('url(#xh)', 'url(#tm-xh)')
            parts.append(f'<clipPath id="tm-xh"><rect x="-2" y="7" width="{adv+4}" height="17"/></clipPath>')
        parts.append(f'<g transform="translate({x:g} 0)">{body}</g>')
        if ch == 'i': dotx = x
        nxt = text[k+1] if k+1 < len(text) else None
        x += adv + (SP + KERN.get((ch, nxt), 0) if nxt else 0)
    width = x
    g = (f'<g fill="none" stroke="{ink}" stroke-width="{W}" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="10">'
         + ''.join(parts) + '</g>'
         + f'<rect x="{dotx:g}" y="0" width="4" height="4" fill="{dot}"/>')
    return g, width

def mark(ink, accent, r=1):
    cells = []
    for row in range(3):
        for col in range(3):
            cells.append(f'<rect x="{col*8}" y="{10+row*8}" width="6" height="6" rx="{r}"/>')
    return (f'<g fill="{ink}">' + ''.join(cells) + '</g>'
            + f'<rect x="26" y="0" width="6" height="6" rx="{r}" fill="{accent}"/>')

def svg(w, h, body, title, pad=0):
    return (f'<?xml version="1.0" encoding="UTF-8"?>\n'
            f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{-pad:g} {-pad:g} {w+2*pad:g} {h+2*pad:g}" width="{w+2*pad:g}" height="{h+2*pad:g}" role="img" aria-label="{title}">\n'
            f'<title>{title}</title>\n{body}\n</svg>\n')

INK, ACC = '#12161A', '#0A7A57'
INK_D, ACC_D = '#F1F2EE', '#3DD69E'

def lockup(ink, acc, dot):
    wm, ww = wordmark(ink, dot)
    gap = 12
    # mark 32 tall; wordmark 24 tall (cap), align wordmark baseline with mark bottom
    body = mark(ink, acc) + f'<g transform="translate({32+gap} 8)">{wm}</g>'
    return body, 32 + gap + ww, 32

def stacked(ink, acc, dot):
    wm, ww = wordmark(ink, dot)
    ms = 48/32
    mx = (ww - 48)/2
    body = (f'<g transform="translate({mx:g} 0) scale({ms:g})">{mark(ink, acc)}</g>'
            f'<g transform="translate(0 64)">{wm}</g>')
    return body, ww, 88

files = {}
b,w,h = lockup(INK, ACC, ACC);        files['tm-logo.svg'] = svg(w,h,b,'TenthMatrix')
b,w,h = lockup(INK_D, ACC_D, ACC_D);  files['tm-logo-on-dark.svg'] = svg(w,h,b,'TenthMatrix')
b,w,h = lockup(INK, INK, INK);        files['tm-logo-mono-dark.svg'] = svg(w,h,b,'TenthMatrix')  # dark ink, for light backgrounds
b,w,h = lockup('#FFFFFF','#FFFFFF','#FFFFFF'); files['tm-logo-mono-light.svg'] = svg(w,h,b,'TenthMatrix')  # white, for dark backgrounds
b,w,h = stacked(INK, ACC, ACC);       files['tm-logo-stacked.svg'] = svg(w,h,b,'TenthMatrix')
b,w,h = stacked(INK_D, ACC_D, ACC_D); files['tm-logo-stacked-on-dark.svg'] = svg(w,h,b,'TenthMatrix')
files['tm-mark.svg'] = svg(32,32,mark(INK,ACC),'TenthMatrix')
files['tm-mark-on-dark.svg'] = svg(32,32,mark(INK_D,ACC_D),'TenthMatrix')
files['tm-mark-mono.svg'] = svg(32,32,mark('currentColor','currentColor').replace('<g fill','<g fill'),'TenthMatrix').replace('<svg ','<svg fill="currentColor" ')
# favicon: tile with mark, dark tile works on both browser chromes
# 16px-grid favicon: 2px cells, 1px gaps, every edge on a whole pixel
cells=''.join(f'<rect x="{3+c*3}" y="{5+r*3}" width="2" height="2"/>' for r in range(3) for c in range(3))
fav = ('<rect width="16" height="16" rx="3.5" fill="#12161A"/>' + f'<g fill="{INK_D}">{cells}</g>'
       + f'<rect x="12" y="2" width="2" height="2" fill="{ACC_D}"/>')
files['icon.svg'] = svg(16,16,fav,'TenthMatrix')
for n, s in files.items():
    open(os.path.join(OUT, n), 'w').write(s)
print('\n'.join(files))

# OG background 1200x630: dark graphite, faint lattice at right, tenth cell in mint
og = ['<rect width="1200" height="630" fill="#0E1113"/>',
      '<rect width="1200" height="630" fill="url(#tm-og-glow)"/>']
cells = []
for r in range(9):
    for c in range(7):
        x, y = 740 + c*52, 120 + r*52
        if y > 630: continue
        op = 0.05 + 0.02*c
        cells.append(f'<rect x="{x}" y="{y}" width="40" height="40" rx="6" fill="#F1F2EE" fill-opacity="{op:.2f}"/>')
og += cells
og.append('<rect x="1104" y="56" width="40" height="40" rx="6" fill="#3DD69E"/>')
og.append('<rect x="0" y="622" width="1200" height="8" fill="#3DD69E"/>')
defs = ('<defs><radialGradient id="tm-og-glow" cx="0.85" cy="0.1" r="0.8">'
        '<stop offset="0" stop-color="#3DD69E" stop-opacity="0.16"/><stop offset="1" stop-color="#3DD69E" stop-opacity="0"/>'
        '</radialGradient></defs>')
open(os.path.join(OUT,'og-background.svg'),'w').write(svg(1200,630,defs+''.join(og),'TenthMatrix'))
