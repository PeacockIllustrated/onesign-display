"""
Generate new PDF pages for Onesign Display Product Overview.
Adds: Playlists & Slideshows, Enhanced Media Library
Matches existing PDF style conventions.
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.lib.enums import TA_LEFT
from pypdf import PdfReader, PdfWriter
import os

W, H = A4

# Brand colors
DARK = HexColor('#1a1a1a')
TEAL = HexColor('#4e7e8c')
GRAY = HexColor('#6b7280')
LIGHT_GRAY = HexColor('#9ca3af')
WHITE = HexColor('#ffffff')
BG_LIGHT = HexColor('#f9fafb')
CARD_BG = HexColor('#f3f4f6')

FONT_DIR = os.path.join(os.path.dirname(__file__), '..', 'public', 'fonts')

def register_gilroy():
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    try:
        pdfmetrics.registerFont(TTFont('Gilroy', os.path.join(FONT_DIR, 'Gilroy-Regular.ttf')))
        pdfmetrics.registerFont(TTFont('Gilroy-Medium', os.path.join(FONT_DIR, 'Gilroy-Medium.ttf')))
        pdfmetrics.registerFont(TTFont('Gilroy-Bold', os.path.join(FONT_DIR, 'Gilroy-Bold.ttf')))
        pdfmetrics.registerFont(TTFont('Gilroy-Heavy', os.path.join(FONT_DIR, 'Gilroy-Heavy.ttf')))
        return True
    except:
        return False

def draw_header(c, page_num_display, section_num):
    """Draw the page header matching existing PDF style."""
    # Section number (large, top-left)
    c.setFont('Gilroy-Heavy', 28)
    c.setFillColor(DARK)
    c.drawString(50, H - 55, f'{section_num:02d}')

    # Header line
    c.setFont('Gilroy', 9)
    c.setFillColor(GRAY)
    c.drawString(100, H - 50, 'Product Overview — Onesign Display')

def draw_footer(c, page_num):
    """Draw footer matching existing PDF style."""
    c.setFont('Gilroy', 8)
    c.setFillColor(GRAY)
    c.drawString(50, 30, 'display.onesignanddigital.com')
    c.drawRightString(W - 50, 30, str(page_num))

def draw_feature_pill(c, x, y, text, w=120, h=28):
    """Draw a rounded feature pill/badge."""
    c.setFillColor(CARD_BG)
    c.roundRect(x, y, w, h, 6, fill=1, stroke=0)
    c.setFont('Gilroy-Medium', 8)
    c.setFillColor(DARK)
    c.drawCentredString(x + w/2, y + 9, text)

def draw_bullet(c, x, y, text, font='Gilroy', size=9.5):
    """Draw a bullet point."""
    c.setFont(font, size)
    c.setFillColor(DARK)
    c.drawString(x, y, '•')
    c.drawString(x + 14, y, text)

def draw_mockup_box(c, x, y, w, h, label=None):
    """Draw a placeholder mockup box."""
    c.setFillColor(HexColor('#1e293b'))
    c.roundRect(x, y, w, h, 8, fill=1, stroke=0)
    if label:
        c.setFont('Gilroy', 8)
        c.setFillColor(LIGHT_GRAY)
        c.drawCentredString(x + w/2, y + h/2 - 4, label)


def page_playlists(c):
    """Page: Playlists & Slideshows feature."""
    draw_header(c, 7, 7)
    draw_footer(c, 8)

    # Title
    c.setFont('Gilroy-Heavy', 28)
    c.setFillColor(DARK)
    c.drawString(50, H - 115, 'Playlists &')
    c.drawString(50, H - 150, 'Slideshows')

    # Subtitle
    c.setFont('Gilroy', 10.5)
    c.setFillColor(GRAY)
    y = H - 180
    lines = [
        'Rotate multiple images and videos on a single screen. Create reusable',
        'playlists with configurable transitions, assign them to any screen or',
        'schedule slot, and let them loop automatically.',
    ]
    for line in lines:
        c.drawString(50, y, line)
        y -= 15

    # Left column: feature list
    y = H - 250
    c.setFont('Gilroy-Bold', 11)
    c.setFillColor(DARK)
    c.drawString(50, y, 'How it works')
    y -= 25

    bullets = [
        'Create named playlists in the admin portal',
        'Add images and videos — drag to reorder',
        'Set duration per image (videos play full length)',
        'Choose transition: Fade, Cut, or Slide',
        'Assign to screens or schedule time slots',
        'Edit once — all screens using it update instantly',
    ]
    for bullet in bullets:
        draw_bullet(c, 50, y, bullet)
        y -= 20

    # Callout box
    y -= 15
    c.setFillColor(HexColor('#f0f9ff'))
    c.roundRect(50, y - 55, 240, 65, 8, fill=1, stroke=0)
    c.setFont('Gilroy-Bold', 10)
    c.setFillColor(TEAL)
    c.drawString(65, y - 8, 'Reusable across screens')
    c.setFont('Gilroy', 9)
    c.setFillColor(GRAY)
    c.drawString(65, y - 25, 'Change a playlist once and every')
    c.drawString(65, y - 38, 'screen using it updates automatically.')

    # Right column: mockup boxes
    rx = 320

    # Mockup: Playlist editor
    draw_mockup_box(c, rx, H - 370, 230, 180, 'Playlist editor — drag-to-reorder slides')

    # Mockup caption
    c.setFont('Gilroy', 8)
    c.setFillColor(LIGHT_GRAY)
    c.drawString(rx, H - 385, 'Playlist editor with slide list, duration controls, and settings')

    # Feature pills row
    pill_y = H - 430
    draw_feature_pill(c, rx, pill_y, 'Fade transitions', 110, 26)
    draw_feature_pill(c, rx + 118, pill_y, 'Slide transitions', 115, 26)

    pill_y -= 34
    draw_feature_pill(c, rx, pill_y, 'Per-slide timers', 110, 26)
    draw_feature_pill(c, rx + 118, pill_y, 'Loop control', 100, 26)

    pill_y -= 34
    draw_feature_pill(c, rx, pill_y, 'Video auto-duration', 130, 26)
    draw_feature_pill(c, rx + 138, pill_y, 'Preloading', 85, 26)

    # Bottom section: Player behavior
    y = 200
    c.setFillColor(CARD_BG)
    c.roundRect(50, y - 95, W - 100, 100, 8, fill=1, stroke=0)

    c.setFont('Gilroy-Bold', 10)
    c.setFillColor(DARK)
    c.drawString(70, y - 12, 'On the screen')

    c.setFont('Gilroy', 9)
    c.setFillColor(GRAY)
    desc_lines = [
        'The player preloads all slides before starting — no jitter between transitions.',
        'Images display for their configured duration. Videos play to completion.',
        'Smooth CSS transitions (fade, cut, slide) with configurable timing.',
        'Signed URLs refresh automatically — playlists run indefinitely without interruption.',
    ]
    dy = y - 30
    for line in desc_lines:
        c.drawString(70, dy, line)
        dy -= 14


def page_media_library(c):
    """Page: Enhanced Media Library feature."""
    draw_header(c, 8, 8)
    draw_footer(c, 9)

    # Title
    c.setFont('Gilroy-Heavy', 28)
    c.setFillColor(DARK)
    c.drawString(50, H - 115, 'Smarter Media')
    c.drawString(50, H - 150, 'Management')

    # Subtitle
    c.setFont('Gilroy', 10.5)
    c.setFillColor(GRAY)
    y = H - 180
    lines = [
        'Your media library now gives you a complete picture of every asset — what type',
        'it is, where it\'s used, and how much storage you\'re consuming. Upload directly',
        'from the screen management page without navigating away.',
    ]
    for line in lines:
        c.drawString(50, y, line)
        y -= 15

    # Mockup: Media library
    draw_mockup_box(c, 50, H - 380, W - 100, 150, 'Media library — search, filter by type, in-use badges, storage stats')

    c.setFont('Gilroy', 8)
    c.setFillColor(LIGHT_GRAY)
    c.drawString(50, H - 395, 'Enhanced media library with search, type filters, and usage tracking')

    # Features grid (2x3)
    grid_y = H - 450
    col1 = 50
    col2 = W/2 + 15
    gap = 78

    features = [
        ('Search & Filter', 'Find assets instantly by filename.\nFilter by type: Images, Videos,\nIn Use, or Unused.', col1),
        ('Usage Tracking', 'Green "In Use" badges show which\nassets are assigned to screens,\nplaylists, or schedules.', col2),
        ('Storage Overview', 'See total count, image/video\nbreakdown, and storage used\nat a glance.', col1),
        ('Upload From Anywhere', 'Upload media directly from the\nscreen management page. No need\nto navigate to the media library.', col2),
        ('Video Preview', 'Videos play on hover in the media\nlibrary and render inline in the\nscreen preview panel.', col1),
        ('Smart Assignment', 'The media picker shows Media,\nPlaylists, and Upload tabs — assign\nor upload in one flow.', col2),
    ]

    for i, (title, desc, x) in enumerate(features):
        row = i // 2
        fy = grid_y - (row * gap)

        # Feature card
        c.setFillColor(CARD_BG)
        c.roundRect(x, fy - 50, 240, 65, 6, fill=1, stroke=0)

        c.setFont('Gilroy-Bold', 10)
        c.setFillColor(DARK)
        c.drawString(x + 12, fy - 5, title)

        c.setFont('Gilroy', 8.5)
        c.setFillColor(GRAY)
        for j, line in enumerate(desc.split('\n')):
            c.drawString(x + 12, fy - 20 - (j * 12), line)

    # Bottom callout
    y = 115
    c.setFillColor(HexColor('#f0f9ff'))
    c.roundRect(50, y - 50, W - 100, 60, 8, fill=1, stroke=0)
    c.setFont('Gilroy-Bold', 10)
    c.setFillColor(TEAL)
    c.drawString(70, y - 10, 'Streamlined workflow')
    c.setFont('Gilroy', 9)
    c.setFillColor(GRAY)
    c.drawString(70, y - 28, 'Upload, assign, and preview — all from the screen management page. No extra steps.')


def main():
    has_gilroy = register_gilroy()
    if not has_gilroy:
        print("Warning: Gilroy fonts not found, using Helvetica fallback")

    # Generate new pages PDF
    new_pages_path = os.path.join(os.path.dirname(__file__), 'new-pages.pdf')
    c = canvas.Canvas(new_pages_path, pagesize=A4)

    page_playlists(c)
    c.showPage()

    page_media_library(c)
    c.showPage()

    c.save()
    print(f"Generated new pages: {new_pages_path}")

    # Merge: insert new pages before the last page (pricing/CTA)
    original_path = os.path.join(os.path.dirname(__file__), 'Onesign-Display-Original-8.pdf')
    output_path = os.path.join(os.path.dirname(__file__), 'Onesign-Display-Product-Overview-Updated.pdf')

    original = PdfReader(original_path)
    new = PdfReader(new_pages_path)
    writer = PdfWriter()

    # Pages 1-7 (original pages 0-6)
    for i in range(len(original.pages) - 1):
        writer.add_page(original.pages[i])

    # Insert new pages
    for page in new.pages:
        writer.add_page(page)

    # Last page (pricing/CTA)
    writer.add_page(original.pages[-1])

    with open(output_path, 'wb') as f:
        writer.write(f)

    print(f"Updated PDF: {output_path}")
    print(f"Total pages: {len(writer.pages)}")

    # Clean up temp file
    os.remove(new_pages_path)

    # Save as the main overview file
    final_path = os.path.join(os.path.dirname(__file__), 'Onesign-Display-Product-Overview.pdf')
    os.replace(output_path, final_path)
    print(f"Final PDF: {final_path}")


if __name__ == '__main__':
    main()
