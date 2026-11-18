# Rebuilds the GitHub avatar (a small, slightly blurry pixel heart) as crisp pixel art:
# finds the heart's 9x9 grid, reads the colour at the centre of each cell, and redraws it large.
from PIL import Image
import os

root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets')
src = Image.open(os.path.join(root, 'avatar.png')).convert('RGB')
palette = {'.': (248, 248, 248), '#': (17, 17, 17), 'R': (249, 3, 0), 'r': (190, 4, 18), 'd': (104, 8, 10)}

def nearest(p):
    return min(palette, key=lambda k: sum((a - b) ** 2 for a, b in zip(palette[k], p)))

# bounding box of everything that is not background
xs = [x for x in range(src.width) for y in range(src.height) if nearest(src.getpixel((x, y))) != '.']
ys = [y for x in range(src.width) for y in range(src.height) if nearest(src.getpixel((x, y))) != '.']
x0, x1, y0, y1 = min(xs), max(xs) + 1, min(ys), max(ys) + 1
N = 9
cw, ch = (x1 - x0) / N, (y1 - y0) / N
grid = []
for j in range(N):
    row = ''
    for i in range(N):
        # majority vote over the middle of the cell
        votes = {}
        for dy in (-2, 0, 2):
            for dx in (-2, 0, 2):
                k = nearest(src.getpixel((int(x0 + (i + .5) * cw + dx), int(y0 + (j + .5) * ch + dy))))
                votes[k] = votes.get(k, 0) + 1
        row += max(votes, key=votes.get)
    grid.append(row)
print('\n'.join(grid), (x0, x1, y0, y1))

CELL = 96
out = Image.new('RGBA', (N * CELL, N * CELL), (0, 0, 0, 0))
for j, row in enumerate(grid):
    for i, k in enumerate(row):
        if k != '.':
            out.paste(palette[k] + (255,), (i * CELL, j * CELL, (i + 1) * CELL, (j + 1) * CELL))
out.save(os.path.join(root, 'heart.png'))
