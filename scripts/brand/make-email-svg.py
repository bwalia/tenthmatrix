"""Render the contact address as an SVG of outlined glyphs (no <text>).

Scrapers harvest addresses from HTML, mailto: links and SVG <text>; outlined
paths carry no characters to harvest. The site shows the file through a CSS
mask (EmailAddress.jsx), so it takes the surrounding text colour in both
themes.

  pip install fonttools
  python3 scripts/brand/make-email-svg.py hello@tenthmatrix.com public/brand/email-hello.svg
"""
import sys

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

FONT = "src/lib/og-fonts/IBMPlexMono-Medium.ttf"


def main(text, out):
    font = TTFont(FONT)
    cmap = font.getBestCmap()
    glyphs = font.getGlyphSet()
    upm = font["head"].unitsPerEm
    ascent = font["hhea"].ascent
    descent = -font["hhea"].descent
    hmtx = font["hmtx"]

    pen = SVGPathPen(glyphs)
    x = 0
    for ch in text:
        name = cmap[ord(ch)]
        # flip y: font units grow upwards, SVG grows downwards
        glyphs[name].draw(TransformPen(pen, (1, 0, 0, -1, x, ascent)))
        x += hmtx[name][0]

    height = ascent + descent
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {x} {height}" '
        f'width="{x / upm:.3f}em" height="{height / upm:.3f}em" aria-hidden="true">'
        f'<path d="{pen.getCommands()}"/></svg>\n'
    )
    with open(out, "w", encoding="utf-8") as f:
        f.write(svg)
    print(f"{out}: {x}x{height} units, aspect {x / height:.3f}")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
