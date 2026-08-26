"""
Desenha o icone do app a partir dos tokens do tema.

A marca e a propria linguagem do app: a grade de dias do heatmap, com as celulas cumpridas
formando um check. Nada de fonte, nada de arte externa — geometria e as cores de src/ui/theme.ts.

Os PNGs gerados vao para o git, como os icones do widget: o build nao depende de rodar nada.
Regerar precisa de Pillow (`pip install pillow`), que e a unica coisa aqui capaz de rasterizar
sem depender de um conversor de SVG que a maquina pode nao ter.

    python3 scripts/gerar-icones.py
"""

from PIL import Image, ImageChops, ImageDraw, ImageFilter

# espelham src/ui/theme.ts
ACCENT = (0x6C, 0x4B, 0xF6)
GROUND = (0x0A, 0x07, 0x10)
SURFACE_RAISED = (0x1B, 0x18, 0x26)
INK = (0xF3, 0xF1, 0xF8)

# a grade de dias e o campo; o check e a marca de cumprido por cima dela — as duas coisas
# que o app faz, no mesmo desenho
CELLS = 6

# caminho do check dentro da caixa da marca, em fracao do lado: desce um passo curto e sobe tres
CHECK = [(0.14, 0.54), (0.38, 0.78), (0.86, 0.22)]
STROKE = 0.155

# desenha grande e reduz: e o antialias que o rounded_rectangle nao tem sozinho
SCALE = 4

# a celula do app tem raio 4 sobre 10 de lado — a mesma proporcao aqui
CORNER = 0.4
CELL_SIDE = 0.46


def mark(size, content, color, field, glow):
    """A marca sozinha, em fundo transparente, centrada num quadrado de `size`.

    `content` e a fracao do lado que a marca ocupa. `field` e a cor da grade de dias, ou
    `None` quando so o traco pode aparecer — o icone tematico do Android e uma silhueta.
    """
    big = size * SCALE
    layer = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)

    box = big * content
    origin = (big - box) / 2
    cell = box / CELLS

    if field is not None:
        side = cell * CELL_SIDE
        for row in range(CELLS):
            for column in range(CELLS):
                center_x = origin + (column + 0.5) * cell
                center_y = origin + (row + 0.5) * cell
                draw.rounded_rectangle(
                    (center_x - side / 2, center_y - side / 2, center_x + side / 2, center_y + side / 2),
                    radius=side * CORNER,
                    fill=field,
                )

    width = box * STROKE
    points = [(origin + x * box, origin + y * box) for x, y in CHECK]

    # o PIL nao tem ponta redonda: o circulo em cada vertice e a ponta
    draw.line(points, fill=color, width=round(width), joint="curve")
    for x, y in points:
        draw.ellipse((x - width / 2, y - width / 2, x + width / 2, y + width / 2), fill=color)

    layer = layer.resize((size, size), Image.LANCZOS)

    if not glow:
        return layer

    # no escuro a profundidade se faz com luz: o brilho e a marca borrada por baixo dela mesma
    halo = layer.filter(ImageFilter.GaussianBlur(size * 0.04))
    halo.putalpha(halo.getchannel("A").point(lambda value: int(value * 0.6)))
    halo.alpha_composite(layer)
    return halo


def halo(size, content):
    """O brilho violeta atras da marca na splash: luz, que e como este tema faz profundidade."""
    layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    box = size * content
    origin = (size - box) / 2

    ImageDraw.Draw(layer).ellipse((origin, origin, origin + box, origin + box), fill=(*ACCENT, 0x3D))
    return layer.filter(ImageFilter.GaussianBlur(size * 0.09))


def background(size):
    """Degrade diagonal do surface para o ground: fundo vivo sem virar desenho.

    A diagonal sai da media de uma rampa horizontal com uma vertical — girar a rampa deixaria
    canto sem cobertura, e canto de icone e o que o launcher mais mostra.
    """
    ramp = Image.linear_gradient("L").resize((size, size), Image.BICUBIC)
    diagonal = ImageChops.add(ramp, ramp.rotate(-90), scale=2)

    top = Image.new("RGB", (size, size), SURFACE_RAISED)
    bottom = Image.new("RGB", (size, size), GROUND)
    return Image.composite(bottom, top, diagonal).convert("RGBA")


def write(image, path):
    image.save(path)
    print(path, image.size)


def main():
    field = (0xFF, 0xFF, 0xFF, 0x1F)
    accent = (*ACCENT, 0xFF)

    # o icone quadrado: a marca ocupa 62% do lado, com o degrade por tras
    square = background(1024)
    square.alpha_composite(mark(1024, 0.66, accent, field, glow=True))
    write(square, "assets/images/icon.png")

    write(background(1024), "assets/images/android-icon-background.png")

    # adaptativo: o launcher corta ate 33% da borda, entao a marca fica menor que no quadrado
    write(mark(1024, 0.56, accent, field, glow=True), "assets/images/android-icon-foreground.png")

    # tematico: a mascara e o alfa, entao aqui so entra o check, e chapado
    write(mark(1024, 0.56, (*INK, 0xFF), None, glow=False), "assets/images/android-icon-monochrome.png")

    # splash: o Android 12+ mascara o icone num circulo, entao a marca fica bem menor que a
    # borda e ganha um halo que se apoia na propria mascara em vez de brigar com ela
    splash = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    splash.alpha_composite(halo(1024, 0.62))
    splash.alpha_composite(mark(1024, 0.5, accent, field, glow=True))
    write(splash, "assets/images/splash-icon.png")

    small = square.resize((48, 48), Image.LANCZOS)
    write(small, "assets/images/favicon.png")


if __name__ == "__main__":
    main()
