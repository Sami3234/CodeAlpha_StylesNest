"""
Remove solid / near-uniform background from navbar logo PNG via edge flood-fill,
then trim transparent margins so the asset scales cleanly in CSS.

Usage (from repo root):
  python scripts/clean-logo-png.py
"""

from __future__ import annotations

from collections import deque
from pathlib import Path

from PIL import Image


def manhattan(a: tuple[int, int, int], b: tuple[int, int, int]) -> int:
    return abs(a[0] - b[0]) + abs(a[1] - b[1]) + abs(a[2] - b[2])


def edge_flood_transparent(
    img: Image.Image,
    tolerance: int = 42,
) -> Image.Image:
    """Treat border-connected pixels similar to any corner as background."""
    rgba = img.convert("RGBA")
    w, h = rgba.size
    px = rgba.load()

    corners = [
        px[0, 0][:3],
        px[w - 1, 0][:3],
        px[0, h - 1][:3],
        px[w - 1, h - 1][:3],
    ]

    def is_bg(rgb: tuple[int, int, int]) -> bool:
        return any(manhattan(rgb, c) <= tolerance for c in corners)

    transparent = [[False] * w for _ in range(h)]
    q: deque[tuple[int, int]] = deque()

    def try_seed(x: int, y: int) -> None:
        if not (0 <= x < w and 0 <= y < h):
            return
        r, g, b, _a = px[x, y]
        if transparent[y][x]:
            return
        if is_bg((r, g, b)):
            transparent[y][x] = True
            q.append((x, y))

    for x in range(w):
        try_seed(x, 0)
        try_seed(x, h - 1)
    for y in range(h):
        try_seed(0, y)
        try_seed(w - 1, y)

    while q:
        x, y = q.popleft()
        r, g, b, _a = px[x, y]
        ref = (r, g, b)
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if not (0 <= nx < w and 0 <= ny < h):
                continue
            if transparent[ny][nx]:
                continue
            nr, ng, nb, _na = px[nx, ny]
            nref = (nr, ng, nb)
            if any(manhattan(nref, c) <= tolerance for c in corners) or manhattan(
                nref, ref
            ) <= max(18, tolerance // 2):
                transparent[ny][nx] = True
                q.append((nx, ny))

    out = rgba.copy()
    opx = out.load()
    for y in range(h):
        for x in range(w):
            if transparent[y][x]:
                opx[x, y] = (0, 0, 0, 0)
    return out


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    src = root / "public" / "StylesNest_Transparent.png"
    if not src.exists():
        raise SystemExit(f"Missing source: {src}")

    img = Image.open(src)
    cleaned = edge_flood_transparent(img, tolerance=44)
    bbox = cleaned.getbbox()
    if bbox:
        cleaned = cleaned.crop(bbox)

    # Backup original once
    backup = root / "public" / "StylesNest_Transparent.original.png"
    if not backup.exists():
        img.save(backup, optimize=True)

    cleaned.save(src, format="PNG", optimize=True)
    print(f"Wrote {src} ({cleaned.size[0]}x{cleaned.size[1]})")
    if backup.exists():
        print(f"Original copy kept at {backup}")


if __name__ == "__main__":
    main()
