"""
RelicVault AI — 1-page Project Write-up PDF (improved v2).

Goals vs the previous PDF:
- Cover all 5 required sections: Problem statement, Solution overview,
  Use of AI, Impact & value, Reflections (with Challenges + Future enhancements).
- Stop being pure text: embed TWO drawn visuals so a reviewer can land
  their eye quickly:
    (1) a horizontal architecture/data-flow diagram in the "Solution overview"
        block — 5 rounded boxes with arrows (User → Upload form →
        {OpenAI Vision · OpenStreetMap Nominatim} → MongoDB → Explore/Profile).
    (2) a donut chart in the "Use of AI" block — shows how AI effort is split
        across coding agent / system prompts / vision + geocoding.
- Honour the "Minimum font size: 11-point" rule. Body 11pt, headers 12–14pt,
  no chart text below 11pt.
- Strict 1 page output on US Letter — uses BaseDocTemplate with 4 named
  Frames (header / left / right / bottom) and FrameBreaks for a robust
  per-region layout (no fragile Table-of-flowables hack).
"""

import io

from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor, white
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.platypus import (
    BaseDocTemplate, PageTemplate, Frame, FrameBreak,
    Paragraph, Spacer, Table, TableStyle,
    KeepInFrame, SimpleDocTemplate,
)
from reportlab.platypus.flowables import Flowable
from reportlab.graphics.shapes import Drawing, Rect, String, Line, Polygon
from reportlab.graphics.charts.piecharts import Pie
from reportlab.pdfbase.pdfmetrics import stringWidth

OUTPUT = r"D:\Users\13315\Desktop\polymercaptial\tmp\relicvault_writeup.pdf"

# ---------- palette ----------
INK     = HexColor("#231C18")  # main text
ACCENT  = HexColor("#A86B36")  # terracotta accent (titles, dividers)
MUTED   = HexColor("#6F5E50")  # secondary text
RULE    = HexColor("#D8C8B4")  # soft separator
CHIP_BG = HexColor("#FBF3E7")  # chip background
PILL_BG = HexColor("#F2E5D0")  # stat pill bg
GREEN   = HexColor("#4A7A4D")  # future / impact
RED     = HexColor("#A6533A")  # challenge
BLUE    = HexColor("#3F6E8C")  # what worked
DARK_BL = HexColor("#2A4D69")  # AI coding tools
TEAL    = HexColor("#3F8A7B")  # system prompts
PURPLE  = HexColor("#7A4E83")  # models+APIs
ZHIPU   = HexColor("#1F7A5E")  # 智谱 GLM (vision provider)

# ---------- styles ----------
SS = getSampleStyleSheet()

title_style = ParagraphStyle(
    "title", parent=SS["Title"],
    fontName="Helvetica-Bold", fontSize=18, leading=22,
    textColor=INK, spaceAfter=2, alignment=TA_LEFT,
)
tagline_style = ParagraphStyle(
    "tagline", parent=SS["Normal"],
    fontName="Helvetica", fontSize=11, leading=14,
    textColor=MUTED, spaceAfter=6,
)
h2_style = ParagraphStyle(
    "h2", parent=SS["Heading2"],
    fontName="Helvetica-Bold", fontSize=12, leading=14,
    textColor=ACCENT, spaceBefore=4, spaceAfter=3,
)
body_style = ParagraphStyle(
    "body", parent=SS["BodyText"],
    fontName="Helvetica", fontSize=11, leading=13.2,
    textColor=INK, spaceAfter=3, alignment=TA_LEFT,
)
chip_style = ParagraphStyle(
    "chip", parent=SS["Normal"],
    fontName="Helvetica-Bold", fontSize=11, leading=14,
    textColor=INK, alignment=TA_LEFT,
)
bullet_style = ParagraphStyle(
    "bullet", parent=body_style,
    leftIndent=14, bulletIndent=2, spaceAfter=3,
)
micro_header = ParagraphStyle(
    "mh", parent=SS["Normal"],
    fontName="Helvetica-Bold", fontSize=11, leading=13,
    textColor=INK, spaceAfter=1,
)
micro_body = ParagraphStyle(
    "mb", parent=SS["Normal"],
    fontName="Helvetica", fontSize=11, leading=13,
    textColor=INK, spaceAfter=2,
)

def P(t, s=body_style):
    return Paragraph(t, s)


# ---------- custom flowables ----------
class HR(Flowable):
    """A thin horizontal rule that respects reportlab color."""
    def __init__(self, width, color=ACCENT, thickness=0.6):
        super().__init__()
        self.width = width
        self.color = color
        self.thickness = thickness
        self.height = thickness + 1
    def draw(self):
        self.canv.setStrokeColor(self.color)
        self.canv.setLineWidth(self.thickness)
        self.canv.line(0, 0.5, self.width, 0.5)


class Pill(Flowable):
    """A small filled rounded box with text — for top stat strip."""
    def __init__(self, text, fg=INK, bg=PILL_BG, padding=6, font=11):
        super().__init__()
        self.text = text
        self.fg = fg
        self.bg = bg
        self.padding = padding
        self.font = font
        # measure width
        self._w = stringWidth(text, "Helvetica-Bold", font) + 2 * padding
        self._h = font + 6
    def wrap(self, avail_w, avail_h):
        return self._w, self._h
    def draw(self):
        c = self.canv
        c.setFillColor(self.bg)
        c.setStrokeColor(self.bg)
        c.roundRect(0, 0, self._w, self._h, self._h / 2, stroke=0, fill=1)
        c.setFillColor(self.fg)
        c.setFont("Helvetica-Bold", self.font)
        c.drawString(self.padding, 3, self.text)


class Chip(Flowable):
    """A tiny colored chip with text — used inside Use-of-AI / Impact / Reflections."""
    def __init__(self, text, fg=white, bg=ACCENT, font=11, pad_x=7, pad_y=3):
        super().__init__()
        self.text = text
        self.fg = fg
        self.bg = bg
        self.font = font
        self.pad_x = pad_x
        self.pad_y = pad_y
        self._w = stringWidth(text, "Helvetica-Bold", font) + 2 * pad_x
        self._h = font + 2 * pad_y
    def wrap(self, avail_w, avail_h):
        return self._w, self._h
    def draw(self):
        c = self.canv
        c.setFillColor(self.bg)
        c.roundRect(0, 0, self._w, self._h, 4, stroke=0, fill=1)
        c.setFillColor(self.fg)
        c.setFont("Helvetica-Bold", self.font)
        c.drawString(self.pad_x, self.pad_y + 1, self.text)


class ArchitectureFlow(Flowable):
    """Five rounded boxes connected by arrows.
    Boxes: 'User photo' -> 'Upload form' -> {'OpenAI Vision', 'Nominatim'}
            -> 'MongoDB' -> 'Explore / Profile'
    Width-controlled: pass total width; we size boxes proportionally.
    """
    BOX_H = 24
    ARROW_W = 10

    def __init__(self, total_w):
        super().__init__()
        self.total_w = total_w
        # compute widths
        widths = [0.16, 0.18, 0.28, 0.16, 0.22]  # 5 boxes — sum = 1.00
        # reserve arrow widths
        arrow_total = self.ARROW_W * 4
        avail = total_w - arrow_total
        self.box_w = [avail * w for w in widths]
        self.h = self.BOX_H + 16  # extra space for caption row below

    def _box(self, x, y, w, h, label, sub, fill):
        c = self.canv
        c.setFillColor(fill)
        c.setStrokeColor(INK)
        c.setLineWidth(0.4)
        c.roundRect(x, y, w, h, 6, stroke=1, fill=1)
        c.setFillColor(white)
        c.setFont("Helvetica-Bold", 11)
        c.drawCentredString(x + w / 2, y + h / 2 - 4, label)
    def _arrow(self, x, y, w, h):
        c = self.canv
        c.setFillColor(INK)
        c.setStrokeColor(INK)
        c.setLineWidth(0.8)
        c.line(x + 2, y + h / 2, x + w - 4, y + h / 2)
        # arrow head
        c.setLineWidth(0.8)
        p = c.beginPath()
        p.moveTo(x + w - 4, y + h / 2)
        p.lineTo(x + w - 9, y + h / 2 + 4)
        p.lineTo(x + w - 9, y + h / 2 - 4)
        p.close()
        c.drawPath(p, stroke=0, fill=1)

    def wrap(self, avail_w, avail_h):
        return self.total_w, self.h

    def split(self, avail_w, avail_h):
        return []

    def draw(self):
        c = self.canv
        y_box = 12
        x = 0
        nodes = [
            ("User photo",        CHIP_BG),
            ("Upload form",       CHIP_BG),
            ("Zhipu GLM\n+ Nominatim", ZHIPU),
            ("MongoDB",           GREEN),
            ("Explore /\nProfile",  BLUE),
        ]
        for idx, item in enumerate(nodes):
            label, fill = item
            w_box = self.box_w[idx]
            if "\n" in label:
                c.setFillColor(fill)
                c.setStrokeColor(INK)
                c.setLineWidth(0.4)
                c.roundRect(x, y_box, w_box, self.BOX_H, 6, stroke=1, fill=1)
                c.setFillColor(white)
                c.setFont("Helvetica-Bold", 11)
                lines = label.split("\n")
                top_y = y_box + self.BOX_H - 9
                c.drawCentredString(x + w_box / 2, top_y, lines[0])
                c.drawCentredString(x + w_box / 2, top_y - 12, lines[1])
            else:
                self._box(x, y_box, w_box, self.BOX_H, label, None, fill)
            x += w_box
            if idx < 4:
                self._arrow(x, y_box, self.ARROW_W, self.BOX_H)
                x += self.ARROW_W
        # footer note
        c.setFillColor(MUTED)
        c.setFont("Helvetica-Oblique", 11)
        c.drawString(0, 0,
            "GPS pin = OSM Leaflet picker; coordinates blurred to 2 decimals before storage.")


class AIBars(Flowable):
    """Three horizontal bars stacked vertically — replaces the previous donut.

    Each row: label on the left, a bar of variable length filled with a
    coloured swatch, percentage on the right.
    Layout for self.w wide × self.h tall:
       row 0  ─ label "Coding agent"   ───── bar 40% ─────  "40%"
       row 1  ─ label "System prompts" ── bar 25% ──      "25%"
       row 2  ─ label "Models + APIs"  ──── bar 35% ────  "35%"
    """
    ROW_H = 14
    ROW_GAP = 8
    PCT_W = 32      # reserved on the right for the percentage

    def __init__(self, w=240, h=80):
        super().__init__()
        self.w = w
        self.h = h
        self.rows = [
            ("Coding agent",   40, DARK_BL),
            ("System prompts", 25, TEAL),
            ("Models + APIs",  35, PURPLE),
        ]

    def wrap(self, avail_w, avail_h):
        return self.w, self.h

    def split(self, avail_w, avail_h):
        return []

    def draw(self):
        c = self.canv
        # Compute where bars start (after the longest label).
        label_w = 0
        for label, _, _ in self.rows:
            lw = stringWidth(label, "Helvetica-Bold", 11)
            if lw > label_w:
                label_w = lw
        bar_x0 = label_w + 6
        bar_w = self.w - bar_x0 - self.PCT_W - 4
        total = 3 * self.ROW_H + 2 * self.ROW_GAP
        y = (self.h - total) / 2  # vertically centre
        for label, pct, color in self.rows:
            # label
            c.setFillColor(INK)
            c.setFont("Helvetica-Bold", 11)
            c.drawString(0, y + 3, label)
            # bar track (light background)
            c.setFillColor(HexColor("#F2EAE0"))
            c.setStrokeColor(HexColor("#D8C8B4"))
            c.setLineWidth(0.4)
            c.roundRect(bar_x0, y, bar_w, self.ROW_H, 3, stroke=1, fill=1)
            # bar fill
            fill_w = bar_w * pct / 100.0
            c.setFillColor(color)
            c.roundRect(bar_x0, y, fill_w, self.ROW_H, 3, stroke=0, fill=1)
            # percentage
            c.setFillColor(INK)
            c.setFont("Helvetica-Bold", 11)
            c.drawRightString(self.w, y + 3, f"{pct}%")
            y += self.ROW_H + self.ROW_GAP


# Keep AIDonut name as an alias for back-compat with the call sites.
class AIDonut(AIBars):
    pass


class AIRoleFlow(Flowable):
    """A small horizontal 'AI touch-point' diagram for the Use-of-AI block.

    It shows, end to end, WHERE AI is applied in the product pipeline:
        Photo upload  →  [OpenAI Vision]  →  Structured record
                      →  [Nominatim]       →  Map pin
    Each AI step is a coloured rounded box with a one-word role label, and a
    short caption beneath explains the two model calls. This is self-
    explaining: the coloured boxes are exactly the AI, the grey boxes are the
    plain data, and the arrows show order. Replaces the old percentage bars,
    which had no clear meaning.
    """
    BOX_H = 22
    ARROW_W = 12
    CAP_Y = 0  # caption sits below the boxes

    def __init__(self, total_w):
        super().__init__()
        self.total_w = total_w
        # 5 nodes: Upload(grey), Vision(ai), Record(grey), Geocode(ai), Pin(grey)
        # widths as fractions of (total - arrows)
        fracs = [0.20, 0.22, 0.20, 0.18, 0.20]
        arrow_total = self.ARROW_W * 4
        avail = total_w - arrow_total
        self.box_w = [avail * f for f in fracs]
        self.h = self.BOX_H + 22  # boxes + caption row

    def _box(self, x, y, w, h, label, fill, fg):
        c = self.canv
        c.setFillColor(fill)
        c.setStrokeColor(INK if fill in (CHIP_BG, PILL_BG) else fill)
        c.setLineWidth(0.4)
        c.roundRect(x, y, w, h, 5, stroke=1, fill=1)
        c.setFillColor(fg)
        c.setFont("Helvetica-Bold", 10)
        c.drawCentredString(x + w / 2, y + h / 2 - 3.5, label)

    def _arrow(self, x, y, w, h):
        c = self.canv
        c.setStrokeColor(MUTED)
        c.setLineWidth(0.8)
        c.line(x + 2, y + h / 2, x + w - 4, y + h / 2)
        p = c.beginPath()
        p.moveTo(x + w - 4, y + h / 2)
        p.lineTo(x + w - 9, y + h / 2 + 4)
        p.lineTo(x + w - 9, y + h / 2 - 4)
        p.close()
        c.drawPath(p, stroke=0, fill=1)

    def wrap(self, avail_w, avail_h):
        return self.total_w, self.h

    def split(self, avail_w, avail_h):
        return []

    def draw(self):
        c = self.canv
        y = 16
        nodes = [
            ("Photo",       CHIP_BG,  INK),     # grey data
            ("Zhipu\nGLM",  ZHIPU,    white),   # AI vision provider
            ("Record",      CHIP_BG,  INK),     # grey data
            ("Nominatim",   TEAL,    white),    # AI
            ("Map pin",     CHIP_BG,  INK),     # grey data
        ]
        x = 0
        for idx, (label, fill, fg) in enumerate(nodes):
            w_box = self.box_w[idx]
            if "\n" in label:
                c.setFillColor(fill)
                c.setStrokeColor(fill)
                c.setLineWidth(0.4)
                c.roundRect(x, y, w_box, self.BOX_H, 5, stroke=1, fill=1)
                c.setFillColor(fg)
                c.setFont("Helvetica-Bold", 10)
                c.drawCentredString(x + w_box / 2, y + self.BOX_H - 9, label.split("\n")[0])
                c.drawCentredString(x + w_box / 2, y + self.BOX_H - 20, label.split("\n")[1])
            else:
                self._box(x, y, w_box, self.BOX_H, label, fill, fg)
            x += w_box
            if idx < 4:
                self._arrow(x, y, self.ARROW_W, self.BOX_H)
                x += self.ARROW_W
        # caption
        c.setFillColor(MUTED)
        c.setFont("Helvetica-Oblique", 10)
        c.drawString(0, 1,
            "Green = Zhipu GLM glm-4v-flash (photo \u2192 structured record). "
            "Teal = OpenStreetMap Nominatim (place name \u2192 map pin).")

# ---------- content ----------
PAGE_W, PAGE_H = LETTER
LM = RM = 0.55 * inch
TM = 0.45 * inch
BM = 0.45 * inch

USABLE_W = PAGE_W - LM - RM  # ~7.4 inch
COL_GAP = 0.18 * inch
COL_W = (USABLE_W - COL_GAP) / 2  # ~3.6 inch each


def build_header():
    """Return flowables for the top header region."""
    f = []
    f.append(P("RelicVault AI — Project Write-up Summary", title_style))
    f.append(P(
        "A crowdsourced digital heritage &amp; minor-artifact museum · "
        "Next.js 14 · MongoDB · Zhipu GLM glm-4v-flash · OpenStreetMap · 3-language UI",
        tagline_style,
    ))
    f.append(P(
        "<font color='#6F5E50'>Source:</font> "
        "<font color='#2A4D69'><b>https://github.com/raywang7266/RelicVault-AI/tree/main</b></font>",
        ParagraphStyle("gh", parent=tagline_style, fontSize=10, leading=13, spaceAfter=4),
    ))
    f.append(HR(USABLE_W, color=ACCENT, thickness=1.2))
    return f


def build_left_column():
    """Returns flowables for the left column (Problem + Solution only).
    The architecture diagram lives in its own full-width row further down
    because the column is too narrow to fit 5 labels at 11pt."""
    f = []
    # PROBLEM
    f.append(P("Problem statement", h2_style))
    f.append(P(
        "China has a long history and a vast amount of cultural "
        "heritage, yet many artifacts are not properly preserved, "
        "and many valuable ones remain little known. Amateur finds — "
        "village heirlooms, family keepsakes, flea-market objects — "
        "have no lightweight, AI-assisted home, so they stay "
        "unprotected and forgotten rather than becoming part of a "
        "shared archive.",
        body_style,
    ))

    # SOLUTION OVERVIEW
    f.append(P("Solution overview", h2_style))
    f.append(P(
        "<b>RelicVault AI</b> is a full-stack web app. Users sign "
        "up, drop a photo of an artifact plus a map pin, and "
        "instantly get a structured record (name, dynasty, "
        "category, material, preservation, tags) from "
        "<font color='#1F7A5E'><b>Zhipu GLM glm-4v-flash</b></font>. "
        "Explore offers fuzzy search, "
        "<font color='#A86B36'>#tag</font> search, era / material / "
        "preservation filters, and a grid-or-map toggle. Coordinates "
        "blur to two decimals before storage, and protected "
        "sites are rounded to one decimal place.",
        body_style,
    ))
    return f


def build_architecture_row(width):
    """Full-width architecture &amp; data-flow diagram, laid out
    across the entire USABLE_W so 5 boxes can hold 11pt labels."""
    f = []
    f.append(ArchitectureFlow(width))
    return f


def build_right_column():
    """Returns flowables for the right column — short intro + 3 bullets +
    the AI touch-point diagram."""
    f = []
    f.append(P("Use of AI", h2_style))
    f.append(P(
        "AI is used in two concrete places in the product pipeline "
        "(see the flow below), plus as a coding partner throughout "
        "development. Details live in the Reflections strip.",
        body_style,
    ))
    f.append(P(
        "<font color='#1F7A5E'><b>1 · Vision provider (Zhipu GLM).</b></font> "
        "a photo becomes a structured record (name, dynasty, "
        "material, preservation, tags) via a strict JSON prompt. "
        "Default model <b>glm-4v-flash</b> (free, China-direct, OpenAI-compatible API).",
        body_style,
    ))
    f.append(P(
        "<font color='#3F8A7B'><b>2 · Geocoder.</b></font> "
        "a typed place name is resolved to coordinates with "
        "OpenStreetMap Nominatim — free and keyless.",
        body_style,
    ))
    f.append(P(
        "<font color='#2A4D69'><b>3 · Coding agent.</b></font> "
        "WorkBuddy scaffolds, refactors, and debugs the app "
        "end-to-end.",
        body_style,
    ))

    # AI touch-point diagram below the bullets.
    f.append(Spacer(1, 2))
    air = AIRoleFlow(COL_W - 4)
    air_table = Table(
        [[air]],
        colWidths=[COL_W],
    )
    air_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    f.append(air_table)
    return f


def build_bottom_reflections(width):
    """Returns flowables for the bottom reflections block — 3 sub-columns
    (What worked | Challenges encountered | Future enhancements),
    then a full-width Impact & value line."""
    f = []
    f.append(P("Reflections", h2_style))

    # 3 sub-columns
    col_w_each = (width - 2 * COL_GAP) / 3

    worked = [
        P("<b>What worked</b>", micro_header),
        P(
            "• Started with the data model. The Mongoose schema "
            "came first; once right, every UI feature became a "
            "thin layer on top.",
            micro_body,
        ),
        P(
            "• Treated the prompt as a product spec — JSON schema "
            "+ <i>'say unknown'</i> = auditable vision pipeline.",
            micro_body,
        ),
        P(
            "• Picked a provider that ships: Zhipu GLM's "
            "<b>glm-4v-flash</b> is free and China-direct, so "
            "demo builds never hit a quota wall.",
            micro_body,
        ),
    ]

    challenges = [
        P("<b>Challenges encountered</b>", micro_header),
        P(
            "• CSS entrance animations — the AI agent performed "
            "poorly here. <font name='Courier'>@keyframes</font> "
            "stripped inside <font name='Courier'>@layer</font>; "
            "<font name='Courier'>display:contents</font> killing "
            "transforms. Three hard rules now live in my project "
            "memory.",
            micro_body,
        ),
        P(
            "• Permissions gap on the artifacts collection "
            "(writes vs. reads) — solved at the application layer.",
            micro_body,
        ),
    ]

    future = [
        P("<b>Future enhancements</b>", micro_header),
        P(
            "• Xiaohongshu-style social layer — public profiles, "
            "follow graph, direct messages.",
            micro_body,
        ),
        P(
            "• Richer uploads — multiple images, short video, "
            "and pure-text entries.",
            micro_body,
        ),
        P(
            "• Stronger auth — third-party sign-in (Google / "
            "WeChat), email &amp; phone-number verification.",
            micro_body,
        ),
    ]

    t = Table(
        [[worked, challenges, future]],
        colWidths=[col_w_each, col_w_each, col_w_each],
    )
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ("LINEAFTER", (0, 0), (0, 0), 0.3, RULE),
        ("LINEAFTER", (1, 0), (1, 0), 0.3, RULE),
    ]))
    f.append(t)

    # final impact line — must hit 11pt
    f.append(Spacer(1, 3))
    f.append(HR(USABLE_W, color=RULE, thickness=0.4))
    f.append(Spacer(1, 2))
    f.append(P(
        "<b>Impact &amp; value.</b> For amateur collectors and local "
        "history enthusiasts, the product lowers the cost of "
        "contributing to a shared cultural archive from days of "
        "research to under a minute; coordinates are blurred by "
        "default so dig-site secrecy is preserved. For researchers "
        "&amp; educators, the structured JSON output is directly "
        "queryable, exportable, and mappable.",
        ParagraphStyle("impact", parent=body_style, spaceBefore=0,
                       fontSize=11, leading=13.2),
    ))
    return f


# ---------- assemble the page (single PageTemplate, one Frame) ----------
#
# Layout strategy: use one big Frame for the full content area, and a single
# outer Table to lay out the header / 2-col body / bottom strip as a grid.
# Each cell of that outer Table gets a KeepInFrame wrapping the region it
# owns, so a "list of flowables" is a single Flowable as far as the Table is
# concerned. KeepInFrame will RENDER the list at its natural size; if the
# list is too tall for the cell, KeepInFrame truncates (mode="truncate"),
# so we measure beforehand to be safe.

from reportlab.platypus import KeepInFrame as _KIF

# Measure each region's minimum required height (at its natural width) so
# we can compute exact row heights for the outer Table.
def _measure(flows, w):
    total = 0
    for f in flows:
        try:
            total += f.wrap(w, 99999)[1]
        except Exception:
            pass
    return total

hdr_w = USABLE_W
col_w = COL_W
arch_w = USABLE_W
bot_w = USABLE_W

hdr_h = _measure(build_header(), hdr_w)
left_h = _measure(build_left_column(), col_w)
right_h = _measure(build_right_column(), col_w)
arch_h = _measure(build_architecture_row(arch_w), arch_w)
bot_h = _measure(build_bottom_reflections(bot_w), bot_w)

# row height = max(left col, right col)
two_col_row_h = max(left_h, right_h)

print(f"[layout] hdr={hdr_h:.1f} left={left_h:.1f} right={right_h:.1f} arch={arch_h:.1f} bot={bot_h:.1f} two_col={two_col_row_h:.1f}")

# Outer table — three rows: header / 2-col body / bottom.
# Each cell is a KeepInFrame wrapping the region's flowables, so the cell
# can be the row's natural height.
outer = Table(
    [
        [KeepInFrame(hdr_w, hdr_h + 2, build_header(), mode="shrink")],
        [
            KeepInFrame(col_w, two_col_row_h + 2, build_left_column(), mode="shrink"),
            KeepInFrame(col_w, two_col_row_h + 2, build_right_column(), mode="shrink"),
        ],
        [KeepInFrame(bot_w, bot_h + 2, build_bottom_reflections(USABLE_W), mode="shrink")],
    ],
    colWidths=[USABLE_W],
    rowHeights=None,  # natural
    style=TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        # vertical gap between header and 2-col body
        ("BOTTOMPADDING", (0, 0), (0, 0), 6),
        # vertical gap between 2-col body and bottom
        ("BOTTOMPADDING", (0, 1), (1, 1), 6),
        # thin vertical rule between left and right cols
        ("LINEBETWEEN", (0, 1), (0, 1), 0.3, RULE),
        # tiny horizontal rule above the bottom block
        ("LINEABOVE", (0, 2), (0, 2), 0.3, RULE),
    ]),
)

doc = SimpleDocTemplate(
    OUTPUT,
    pagesize=LETTER,
    leftMargin=LM, rightMargin=RM,
    topMargin=TM, bottomMargin=BM,
    title="RelicVault AI — Project Write-up Summary",
    author="RelicVault AI Team",
)

story = []
# Row 1 — header (full width)
story.append(Table(
    [[KeepInFrame(hdr_w, hdr_h + 2, build_header(), mode="shrink")]],
    colWidths=[USABLE_W],
    style=TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]),
))
# Row 2 — two columns side by side
story.append(Spacer(1, 2))
story.append(Table(
    [[
        KeepInFrame(col_w, two_col_row_h + 2, build_left_column(), mode="shrink"),
        KeepInFrame(col_w, two_col_row_h + 2, build_right_column(), mode="shrink"),
    ]],
    colWidths=[COL_W, COL_W],
    style=TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ("LINEBETWEEN", (0, 0), (0, 0), 0.3, RULE),
    ]),
))
# Row 3 — architecture flow (full width)
story.append(Spacer(1, 4))
story.append(Table(
    [[KeepInFrame(arch_w, arch_h + 2, build_architecture_row(USABLE_W), mode="shrink")]],
    colWidths=[USABLE_W],
    style=TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
        ("LINEABOVE", (0, 0), (0, 0), 0.3, RULE),
        ("LINEBELOW", (0, 0), (0, 0), 0.3, RULE),
    ]),
))
# Row 4 — bottom (full width)
story.append(Spacer(1, 4))
story.append(Table(
    [[KeepInFrame(bot_w, bot_h + 2, build_bottom_reflections(USABLE_W), mode="shrink")]],
    colWidths=[USABLE_W],
    style=TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]),
))

doc.build(story)
print("OK", OUTPUT)
