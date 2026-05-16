from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageFilter


ROOT = Path(r"C:\checktheaura")
DOWNLOADS = Path(r"C:\Users\Notebook\Downloads")
OUTPUT = ROOT / "src" / "assets" / "heroes"


SOURCES = {
    "warrior-full": {
        "source": DOWNLOADS / "Gemini_Generated_Image_66tyc66tyc66tyc6.png",
        "crop": (250, 50, 1120, 760),
        "avatar_crop": (430, 80, 910, 520),
        "mini_crop": (420, 90, 920, 720),
    },
    "strategist-full": {
        "source": DOWNLOADS / "Gemini_Generated_Image_dj578vdj578vdj57.png",
        "crop": (260, 40, 1120, 760),
        "avatar_crop": (445, 80, 925, 520),
        "mini_crop": (430, 80, 950, 720),
    },
    "warrior-base-thin": {
        "source": DOWNLOADS / "Gemini_Generated_Image_moovakmoovakmoov.png",
        "crop": (320, 40, 1040, 760),
        "avatar_crop": (455, 70, 890, 500),
        "mini_crop": (455, 70, 900, 690),
    },
    "strategist-base-thin": {
        "source": DOWNLOADS / "Gemini_Generated_Image_xeossbxeossbxeos.png",
        "crop": (340, 30, 1030, 760),
        "avatar_crop": (450, 60, 900, 490),
        "mini_crop": (450, 60, 900, 700),
    },
}


def remove_black_background(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    width, height = rgba.size

    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            brightness = max(r, g, b)

            if brightness <= 8:
                pixels[x, y] = (r, g, b, 0)
                continue

            if brightness <= 32:
                alpha = int(((brightness - 8) / 24) * a)
                pixels[x, y] = (r, g, b, alpha)

    alpha = rgba.getchannel("A").filter(ImageFilter.GaussianBlur(radius=1.5))
    rgba.putalpha(alpha)
    return rgba


def export_variant(base_image: Image.Image, crop_box: tuple[int, int, int, int], output_path: Path, size: tuple[int, int] | None = None) -> None:
    cropped = base_image.crop(crop_box)
    bbox = cropped.getbbox()
    if bbox:
      cropped = cropped.crop(bbox)

    if size:
        cropped.thumbnail(size, Image.Resampling.LANCZOS)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    cropped.save(output_path)


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)

    for key, config in SOURCES.items():
        source_image = Image.open(config["source"])
        cleaned = remove_black_background(source_image)

        export_variant(cleaned, config["crop"], OUTPUT / f"{key}.png")
        export_variant(
            cleaned,
            config["avatar_crop"],
            OUTPUT / f"{key}-avatar.png",
            size=(420, 420),
        )
        export_variant(
            cleaned,
            config["mini_crop"],
            OUTPUT / f"{key}-mini.png",
            size=(220, 220),
        )


if __name__ == "__main__":
    main()
