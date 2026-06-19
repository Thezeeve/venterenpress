from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[1]
NEWS_DIR = ROOT / "public" / "news"
WIDTH = 1600
HEIGHT = 900


def font(size: int, bold: bool = False):
    candidates = [
        "DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf",
        "arialbd.ttf" if bold else "arial.ttf",
    ]
    for candidate in candidates:
        try:
            return ImageFont.truetype(candidate, size)
        except OSError:
            continue
    return ImageFont.load_default()


def vertical_gradient(top: tuple[int, int, int], bottom: tuple[int, int, int]):
    image = Image.new("RGB", (WIDTH, HEIGHT), top)
    draw = ImageDraw.Draw(image)
    for y in range(HEIGHT):
        mix = y / max(HEIGHT - 1, 1)
        color = tuple(int(top[i] * (1 - mix) + bottom[i] * mix) for i in range(3))
        draw.line([(0, y), (WIDTH, y)], fill=color)
    return image


def save(image: Image.Image, name: str):
    path = NEWS_DIR / name
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, quality=95)
    print(f"wrote {path}")


def draw_spacex():
    image = vertical_gradient((4, 10, 18), (13, 24, 42))
    draw = ImageDraw.Draw(image)
    draw.ellipse((-120, 540, 1720, 1120), outline=(34, 95, 170), width=8)
    draw.ellipse((110, 625, 1490, 1080), fill=(7, 13, 24))
    draw.rectangle((570, 560, 1030, 690), fill=(226, 229, 235))
    draw.polygon([(570, 690), (510, 900), (680, 900), (725, 690)], fill=(191, 196, 204))
    draw.polygon([(1030, 690), (875, 690), (930, 900), (1090, 900)], fill=(191, 196, 204))
    draw.text((640, 595), "Nasdaq", fill=(30, 42, 63), font=font(48, bold=True))
    draw.rectangle((730, 410, 815, 600), fill=(39, 39, 39))
    draw.ellipse((680, 315, 865, 525), fill=(228, 182, 151))
    draw.rounded_rectangle((700, 450, 840, 690), radius=36, fill=(33, 34, 38))
    draw.rounded_rectangle((355, 96, 1245, 210), radius=10, fill=(0, 0, 0, 0))
    draw.text((520, 88), "SPACEX", fill=(238, 241, 245), font=font(92, bold=True))
    overlay = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    overlay_draw = ImageDraw.Draw(overlay)
    overlay_draw.rectangle((0, 0, WIDTH * 0.55, HEIGHT), fill=(2, 6, 12, 140))
    image = Image.alpha_composite(image.convert("RGBA"), overlay)
    save(image.convert("RGB"), "spacex-hero-vanterenpress.png")
    save(image.convert("RGB"), "spacex-ipo.png")


def draw_ai():
    image = vertical_gradient((7, 11, 27), (31, 26, 71))
    draw = ImageDraw.Draw(image)
    for offset in range(0, WIDTH, 60):
        draw.line([(offset, 0), (offset, HEIGHT)], fill=(32, 58, 112), width=2)
    for offset in range(0, HEIGHT, 60):
        draw.line([(0, offset), (WIDTH, offset)], fill=(32, 58, 112), width=2)
    chip = (490, 215, 1110, 735)
    draw.rounded_rectangle(chip, radius=42, fill=(18, 31, 74), outline=(74, 138, 255), width=8)
    inner = (585, 305, 1015, 645)
    draw.rounded_rectangle(inner, radius=32, fill=(21, 26, 52), outline=(119, 203, 255), width=5)
    draw.text((720, 405), "AI", fill=(231, 247, 255), font=font(132, bold=True))
    for x in range(515, 1110, 65):
        draw.line([(x, 190), (x, 120)], fill=(95, 190, 255), width=6)
        draw.line([(x, 735), (x, 805)], fill=(95, 190, 255), width=6)
    for y in range(240, 735, 65):
        draw.line([(455, y), (385, y)], fill=(95, 190, 255), width=6)
        draw.line([(1110, y), (1180, y)], fill=(95, 190, 255), width=6)
    save(image, "ai-chip.jpg")


def draw_world():
    image = vertical_gradient((88, 92, 100), (45, 50, 57))
    draw = ImageDraw.Draw(image)
    rubble = [(0, 770), (160, 720), (330, 760), (510, 690), (680, 755), (880, 700), (1070, 760), (1310, 715), (1600, 790), (1600, 900), (0, 900)]
    draw.polygon(rubble, fill=(68, 62, 58))
    for x in [120, 330, 1140, 1370]:
        draw.rectangle((x, 250, x + 150, 720), fill=(83, 80, 78))
        for y in [320, 420, 520, 620]:
            draw.rectangle((x + 22, y, x + 58, y + 36), fill=(43, 45, 49))
            draw.rectangle((x + 86, y + 10, x + 124, y + 46), fill=(43, 45, 49))
    for x in [590, 760, 930]:
        draw.rectangle((x, 350, x + 95, 735), fill=(92, 88, 83))
    for x in [670, 805, 940]:
        draw.ellipse((x, 612, x + 36, 688), fill=(28, 30, 33))
        draw.rectangle((x + 10, 665, x + 26, 765), fill=(28, 30, 33))
    haze = image.filter(ImageFilter.GaussianBlur(18))
    image = Image.blend(image, haze, 0.18)
    save(image, "world-middle-east.jpg")


def draw_markets():
    image = vertical_gradient((8, 13, 24), (5, 19, 35))
    draw = ImageDraw.Draw(image)
    for x in range(70, WIDTH, 120):
        draw.line([(x, 90), (x, 810)], fill=(27, 48, 82), width=2)
    for y in range(120, HEIGHT, 100):
        draw.line([(80, y), (1520, y)], fill=(27, 48, 82), width=2)
    points = [(110, 650), (220, 620), (320, 520), (430, 560), (560, 435), (700, 490), (830, 360), (980, 410), (1090, 305), (1210, 350), (1340, 205), (1490, 150)]
    draw.line(points, fill=(56, 220, 171), width=10, joint="curve")
    for x, y in points:
        draw.ellipse((x - 9, y - 9, x + 9, y + 9), fill=(169, 252, 228))
    draw.rounded_rectangle((1060, 120, 1490, 300), radius=28, fill=(8, 17, 32), outline=(37, 67, 112), width=3)
    draw.text((1108, 165), "Markets", fill=(239, 244, 250), font=font(54, bold=True))
    draw.text((1112, 230), "+0.82%", fill=(57, 213, 127), font=font(58, bold=True))
    save(image, "markets-chart.jpg")


def draw_newsroom(name: str, accent: tuple[int, int, int]):
    image = vertical_gradient((14, 19, 30), (30, 35, 48))
    draw = ImageDraw.Draw(image)
    for x in [170, 520, 900, 1230]:
        draw.rounded_rectangle((x, 170, x + 220, 360), radius=18, fill=(23, 30, 44), outline=(51, 64, 89), width=3)
        draw.rectangle((x + 20, 195, x + 200, 325), fill=accent)
    draw.rectangle((0, 640, 1600, 900), fill=(37, 31, 25))
    for x in [180, 500, 820, 1140]:
        draw.rounded_rectangle((x, 555, x + 230, 655), radius=10, fill=(72, 60, 50))
        draw.rectangle((x + 25, 470, x + 205, 555), fill=(18, 24, 36))
        draw.ellipse((x + 92, 570, x + 142, 620), fill=(28, 30, 33))
        draw.rectangle((x + 110, 614, x + 124, 715), fill=(28, 30, 33))
    save(image, name)


def main():
    draw_spacex()
    draw_ai()
    draw_world()
    draw_markets()
    draw_newsroom("newsroom-opinion.jpg", (112, 28, 27))
    draw_newsroom("default-news.jpg", (31, 77, 126))


if __name__ == "__main__":
    main()
