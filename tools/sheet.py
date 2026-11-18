# Contact sheet of stills for a quick visual check: python tools/sheet.py out.jpg [cols] [width]
import sys, glob, os
from PIL import Image
root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'stills')
files = sorted(glob.glob(os.path.join(root, '*.png')))
cols = int(sys.argv[2]) if len(sys.argv) > 2 else 2
W = int(sys.argv[3]) if len(sys.argv) > 3 else 960
H = W * 9 // 16
rows = (len(files) + cols - 1) // cols
sheet = Image.new('RGB', (W * cols + 8 * (cols - 1), H * rows + 8 * (rows - 1)), (30, 30, 30))
for i, f in enumerate(files):
    sheet.paste(Image.open(f).convert('RGB').resize((W, H), Image.Resampling.LANCZOS), ((i % cols) * (W + 8), (i // cols) * (H + 8)))
sheet.save(sys.argv[1], quality=88)
print(len(files), 'stills')
