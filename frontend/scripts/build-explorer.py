"""Build the original 8-direction, four-frame streetwear sprite sheet."""
from pathlib import Path
import xml.etree.ElementTree as ET

SPRITES = Path(__file__).resolve().parents[1] / 'public' / 'sprites'
source = ET.parse(SPRITES / 'arcade-explorer-prototype.svg').getroot()
paths = [node for node in source if node.tag.endswith('path')]


def path(fill, shape):
    return f'<path fill="{fill}" d="{shape}"/>'


def original(indices):
    return ''.join(path(paths[i].attrib['fill'], paths[i].attrib['d']) for i in indices)


def legs(frame, side=False):
    stride = [0, 1, 0, -1][frame]
    parts = []
    for x, dy in [(8, stride), (13, -stride)]:
        dx = stride if side and x == 8 else -stride if side else 0
        shape = path('#080d1c', 'M-1 0h5v8h-6V6h1z')
        shape += path('#20283a', 'M0 0h3v5H0z')
        shape += path('#485269', 'M0 2h2v2H0z')
        shape += path('#697084', 'M-1 7h5v1h-5z')
        parts.append(f'<g transform="translate({x + dx} {24 + dy})">{shape}</g>')
    return ''.join(parts)


def sleeves(frame):
    stride = [0, -1, 0, 1][frame]
    left = path('#30384e', 'M4 16h2v7H4z') + path('#c3947e', 'M4 23h2v3H4z')
    right = path('#30384e', 'M18 17h2v6h-2z') + path('#c3947e', 'M18 24h2v2h-2z')
    right += path('#2898b1', 'M18 22h3v2h-3z') + path('#a1f6ff', 'M18 22h3v1h-3z')
    return f'<g transform="translate(0 {stride})">{left}</g><g transform="translate(0 {-stride})">{right}</g>'


def upper(direction):
    if direction in ('down', 'diagonal'):
        return original(range(13))
    if direction == 'side':
        return (path('#060916', 'M9 1h7v3h2v7h-3v3h3v3h1v8H6V15h3v-3H7V4h2z')
                + path('#28324b', 'M9 2h7v3H9v5H8V4h1z')
                + path('#526078', 'M10 2h5v1h-5z')
                + path('#d3a18a', 'M8 6h5v6h-3V9H7V8h1z')
                + path('#151d30', 'M8 7h1v1H8z')
                + path('#414557', 'M9 13h6v3h3v9H7V16h2z')
                + path('#242a3e', 'M11 16h6v9h-6z')
                + path('#94516e', 'M8 14h2v6H8z'))
    skin = path('#a37b68', 'M7 8h2v3H7z') if direction == 'back-diagonal' else ''
    return (path('#060916', 'M9 1h7v2h2v8h-2v2h3v3h2v9H3v-9h3v-3h3v-2H7V4h2z')
            + path('#28324b', 'M9 2h7v2h2v6H8V4h1z')
            + path('#526078', 'M10 2h5v1h-5zM8 4h3v1H8z')
            + path('#161e30', 'M9 10h7v3H9z') + skin
            + path('#414557', 'M7 13h10v2h2v10H5V16h2z')
            + path('#242a3e', 'M8 16h9v9H8z')
            + path('#677083', 'M7 14h10v1H7zM6 17h1v7H6z')
            + path('#94516e', 'M8 15h2v5H8z'))


def frame_art(direction, frame):
    bob = -1 if frame in (1, 3) else 0
    body = f'<g clip-path="url(#torso)">{upper(direction)}</g>'
    body += sleeves(frame)
    body += '<circle cx="19" cy="23" r="4" fill="url(#wrist)"/>'
    if direction == 'diagonal':
        body = f'<g transform="translate(-1 0)">{body}</g>'
    return '<ellipse cx="12" cy="30" rx="8" ry="2" fill="#030713" opacity=".65"/>' + legs(frame, direction == 'side') + f'<g transform="translate(0 {bob})">{body}</g>'


rows = [('down', False), ('diagonal', False), ('side', False), ('back-diagonal', False),
        ('back', False), ('back-diagonal', True), ('side', True), ('diagonal', True)]
sheet = ['<svg xmlns="http://www.w3.org/2000/svg" width="96" height="256" viewBox="0 0 96 256" shape-rendering="crispEdges">',
         '<title>Original arcade explorer: eight directions, four walking frames</title>',
         '<defs><radialGradient id="wrist"><stop stop-color="#b5fbff" stop-opacity=".5"/><stop offset="1" stop-color="#39dfff" stop-opacity="0"/></radialGradient><clipPath id="torso"><rect width="24" height="25"/></clipPath></defs>']
for row, (direction, mirror) in enumerate(rows):
    for frame in range(4):
        art = frame_art(direction, frame)
        if mirror:
            art = f'<g transform="translate(24 0) scale(-1 1)">{art}</g>'
        sheet.append(f'<svg x="{frame * 24}" y="{row * 32}" width="24" height="32" viewBox="0 0 24 32">{art}</svg>')
sheet.append('</svg>')
(SPRITES / 'arcade-explorer.svg').write_text('\n'.join(sheet))
