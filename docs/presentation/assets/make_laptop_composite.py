from PIL import Image, ImageDraw, ImageEnhance, ImageFilter
from pathlib import Path
import numpy as np

base_path = Path(r"C:\Users\kanwa\AppData\Local\Temp\codex-clipboard-58145537-d129-4961-a166-56dccd222199.png")
web_path = Path(r"C:\Users\kanwa\AppData\Local\Temp\codex-clipboard-0f219109-b8a7-4a3c-89f7-abd52b71a341.png")
out_dir = Path(r"C:\Gerry-docks-final\presentation-assets")
out_dir.mkdir(parents=True, exist_ok=True)
out_path = out_dir / "gerrys-webpage-in-laptop.png"

base = Image.open(base_path).convert("RGBA")
web = Image.open(web_path).convert("RGBA")

# Crop the screenshot slightly to emphasize the website hero/header on the laptop screen.
w, h = web.size
web = web.crop((0, 0, w, int(h * 0.78)))

# Inner laptop screen corners, clockwise from top-left.
dst = [(970, 222), (1530, 190), (1496, 710), (873, 637)]
src = [(0, 0), (web.width, 0), (web.width, web.height), (0, web.height)]

def perspective_coeffs(dst_points, src_points):
    # PIL expects coefficients that map output coordinates to source coordinates.
    matrix = []
    values = []
    for (x, y), (u, v) in zip(dst_points, src_points):
        matrix.append([x, y, 1, 0, 0, 0, -u * x, -u * y])
        values.append(u)
        matrix.append([0, 0, 0, x, y, 1, -v * x, -v * y])
        values.append(v)
    return np.linalg.solve(np.array(matrix, dtype=float), np.array(values, dtype=float))

coeffs = perspective_coeffs(dst, src)
warped = web.transform(base.size, Image.Transform.PERSPECTIVE, coeffs, Image.Resampling.BICUBIC)

mask = Image.new("L", base.size, 0)
draw = ImageDraw.Draw(mask)
draw.polygon(dst, fill=255)
mask = mask.filter(ImageFilter.GaussianBlur(0.6))

# Match the laptop photo a bit: slightly dim and cool the screen so it sits in the scene.
warped = ImageEnhance.Brightness(warped).enhance(0.90)
warped = ImageEnhance.Contrast(warped).enhance(1.06)

# Add a subtle screen reflection/glass tint.
reflection = Image.new("RGBA", base.size, (0, 0, 0, 0))
rd = ImageDraw.Draw(reflection)
rd.polygon(dst, fill=(18, 52, 78, 34))
rd.polygon([(970,222), (1230,207), (1132,668), (873,637)], fill=(255,255,255,22))

composite = Image.alpha_composite(base, Image.composite(warped, Image.new("RGBA", base.size, (0,0,0,0)), mask))
composite = Image.alpha_composite(composite, reflection)
composite.convert("RGB").save(out_path, quality=95)
print(out_path)
