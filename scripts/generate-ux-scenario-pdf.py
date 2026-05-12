"""Generate the UX scenario walkthrough PDF for LG Content Store submission.

Run: python scripts/generate-ux-scenario-pdf.py
Output: webos-app/store-assets/ux-scenario.pdf
"""

from pathlib import Path

from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    Image,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "webos-app" / "store-assets"
OUT = ASSETS / "ux-scenario.pdf"

BRAND_TEAL = HexColor("#4e7e8c")
BRAND_DEEP = HexColor("#1a2e35")
BRAND_ACCENT = HexColor("#95daf8")
INK = HexColor("#1f1f1f")
MUTED = HexColor("#666666")
RULE = HexColor("#d4d4d4")


def make_styles():
    base = getSampleStyleSheet()
    styles = {
        "title": ParagraphStyle(
            "title",
            parent=base["Title"],
            fontName="Helvetica-Bold",
            fontSize=28,
            leading=34,
            textColor=BRAND_DEEP,
            alignment=TA_LEFT,
            spaceAfter=4,
        ),
        "subtitle": ParagraphStyle(
            "subtitle",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=12,
            leading=16,
            textColor=MUTED,
            alignment=TA_LEFT,
            spaceAfter=24,
        ),
        "h1": ParagraphStyle(
            "h1",
            parent=base["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=20,
            leading=24,
            textColor=BRAND_TEAL,
            spaceBefore=8,
            spaceAfter=12,
        ),
        "h2": ParagraphStyle(
            "h2",
            parent=base["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=14,
            leading=18,
            textColor=BRAND_TEAL,
            spaceBefore=8,
            spaceAfter=6,
        ),
        "body": ParagraphStyle(
            "body",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=10.5,
            leading=15,
            textColor=INK,
            spaceAfter=8,
        ),
        "bullet": ParagraphStyle(
            "bullet",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=10.5,
            leading=15,
            textColor=INK,
            leftIndent=14,
            bulletIndent=2,
            spaceAfter=3,
        ),
        "caption": ParagraphStyle(
            "caption",
            parent=base["Normal"],
            fontName="Helvetica-Oblique",
            fontSize=9,
            leading=12,
            textColor=MUTED,
            alignment=TA_CENTER,
            spaceAfter=10,
        ),
        "step": ParagraphStyle(
            "step",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=11,
            leading=15,
            textColor=BRAND_DEEP,
            spaceAfter=2,
        ),
        "footer": ParagraphStyle(
            "footer",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=8,
            textColor=MUTED,
            alignment=TA_CENTER,
        ),
    }
    return styles


def add_footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(MUTED)
    canvas.drawString(
        20 * mm,
        12 * mm,
        "Onesign Display — UX Scenario · Onesign & Digital · v1.0.0",
    )
    canvas.drawRightString(
        A4[0] - 20 * mm, 12 * mm, f"Page {doc.page}"
    )
    canvas.restoreState()


def step_block(styles, number, title, body_lines):
    """Render a numbered step with bold title and body lines."""
    elements = []
    elements.append(
        Paragraph(f"<b>Step {number} — {title}</b>", styles["step"])
    )
    for line in body_lines:
        elements.append(Paragraph(line, styles["body"]))
    return elements


def expectation_block(styles, lines):
    """Boxed 'Expected behaviour' callout."""
    rows = [[Paragraph(f"<b>Expected:</b> {line}", styles["body"])] for line in lines]
    table = Table(rows, colWidths=[160 * mm])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), HexColor("#f6f9fa")),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("LINEBEFORE", (0, 0), (0, -1), 3, BRAND_TEAL),
            ]
        )
    )
    return table


def fitted_image(path, max_w_mm=160, max_h_mm=95):
    """Return an Image flowable scaled to fit within max width / height in mm."""
    from PIL import Image as PILImage

    px_w, px_h = PILImage.open(path).size
    aspect = px_w / px_h
    w_mm = max_w_mm
    h_mm = w_mm / aspect
    if h_mm > max_h_mm:
        h_mm = max_h_mm
        w_mm = h_mm * aspect
    return Image(str(path), width=w_mm * mm, height=h_mm * mm)


def build():
    styles = make_styles()
    doc = SimpleDocTemplate(
        str(OUT),
        pagesize=A4,
        leftMargin=20 * mm,
        rightMargin=20 * mm,
        topMargin=20 * mm,
        bottomMargin=22 * mm,
        title="Onesign Display — UX Scenario",
        author="Onesign & Digital",
    )

    story = []

    # ── Cover page ────────────────────────────────────────────
    icon_path = ASSETS / "store-icon.png"
    if icon_path.exists():
        story.append(Image(str(icon_path), width=40 * mm, height=40 * mm))
        story.append(Spacer(1, 8 * mm))

    story.append(Paragraph("Onesign Display", styles["title"]))
    story.append(
        Paragraph(
            "UX Scenario Walkthrough for LG Content Store Review",
            styles["subtitle"],
        )
    )

    story.append(Paragraph("App overview", styles["h2"]))
    story.append(
        Paragraph(
            "Onesign Display is a digital signage application for LG webOS TVs, "
            "designed for hospitality venues — restaurants, cafés, bars, and pubs. "
            "Operators pair a TV to their Onesign Display account using a one-time "
            "token, then manage the menus and content shown on that screen remotely "
            "from a cloud admin portal. The app on the TV is a thin client that "
            "displays whichever content the operator has assigned, with no "
            "interactive elements once the screen is paired.",
            styles["body"],
        )
    )

    story.append(Paragraph("Vendor", styles["h2"]))
    story.append(
        Paragraph(
            "Onesign &amp; Digital · D86, Princesway North, Gateshead, NE11 0TU, "
            "United Kingdom · sales@onesignanddigital.com · 0191 487 6767",
            styles["body"],
        )
    )

    story.append(Paragraph("App package", styles["h2"]))
    story.append(
        Paragraph(
            "<b>App ID:</b> com.onesignanddigital.display<br/>"
            "<b>Version:</b> 1.0.0<br/>"
            "<b>Minimum webOS:</b> 4.0<br/>"
            "<b>Type:</b> Web app (iframes a hosted player at onesign-display.vercel.app)<br/>"
            "<b>Service:</b> Subscription-based (external billing via the web portal)",
            styles["body"],
        )
    )

    story.append(PageBreak())

    # ── Prerequisites ─────────────────────────────────────────
    story.append(Paragraph("1. Prerequisites for testing", styles["h1"]))
    story.append(
        Paragraph(
            "The reviewer needs three things to complete the test scenarios:",
            styles["body"],
        )
    )
    story.append(
        Paragraph(
            "<b>1.</b> An LG TV running webOS 4.0 or later (the LG Cloud Test Lab "
            "is suitable). The app has been verified on webOS 4.0, 6.0, and 22+.",
            styles["bullet"],
        )
    )
    story.append(
        Paragraph(
            "<b>2.</b> A working internet connection on the TV. The app loads "
            "content from <i>onesign-display.vercel.app</i> over HTTPS. No offline "
            "mode is supported in v1.0.0.",
            styles["bullet"],
        )
    )
    story.append(
        Paragraph(
            "<b>3.</b> A reviewer-only pairing token, supplied in the <b>Test Info</b> "
            "section of this submission. The token is pre-paired to a sandbox "
            "account containing demo menu content (an HTML menu plus three sample "
            "slides) and will remain valid throughout the review window.",
            styles["bullet"],
        )
    )
    story.append(Spacer(1, 4 * mm))

    story.append(Paragraph("TV settings (recommended for end users)", styles["h2"]))
    story.append(
        Paragraph(
            "These settings are not required to validate the app's behaviour, but "
            "are documented here because they are part of the customer-facing setup "
            "guide (see <i>onesign-display.vercel.app/support</i>):",
            styles["body"],
        )
    )
    story.append(Paragraph("• Settings → General → Eco → Auto Power Off → Off", styles["bullet"]))
    story.append(Paragraph("• Settings → General → Eco → Eco Mode → Off", styles["bullet"]))
    story.append(Paragraph("• Settings → General → External Devices → SIMPLINK → Off", styles["bullet"]))

    story.append(PageBreak())

    # ── Scenario 1 ────────────────────────────────────────────
    story.append(Paragraph("2. Test scenarios", styles["h1"]))

    story.append(Paragraph("Scenario A — First-time pairing", styles["h2"]))
    story.append(
        Paragraph(
            "Validates that a freshly installed app can be paired and begin "
            "playback using only the TV remote.",
            styles["body"],
        )
    )
    story.extend(
        step_block(
            styles,
            1,
            "Launch the app from the launcher",
            [
                "From the LG home screen, locate <b>Onesign Display</b> in the apps "
                "row and select it with the remote's OK button.",
                "Observe the splash background (black with the Onesign Display "
                "wordmark) shown briefly during the initial load.",
            ],
        )
    )
    story.append(
        expectation_block(
            styles,
            [
                "App launches within 3–5 seconds.",
                "Setup screen appears, prompting the user to enter a pairing token.",
                "The pairing token input field has focus by default.",
            ],
        )
    )
    story.append(Spacer(1, 4 * mm))
    story.extend(
        step_block(
            styles,
            2,
            "Enter the pairing token",
            [
                "Using the remote's OK key, open the on-screen keyboard and type "
                "the pairing token supplied in the Test Info section.",
                "Press the down-arrow key to move focus from the input field to the "
                "<b>Connect</b> button, then press OK.",
            ],
        )
    )
    story.append(
        expectation_block(
            styles,
            [
                "Setup screen is replaced by the player surface within 5 seconds.",
                "Demo menu content begins displaying immediately.",
                "If the token is invalid, the player surface shows an 'Invalid token' "
                "message and returns to the setup screen after 5 seconds.",
            ],
        )
    )

    story.append(PageBreak())

    # ── Scenario B — Content playback ─────────────────────────
    story.append(Paragraph("Scenario B — Content playback", styles["h2"]))
    story.append(
        Paragraph(
            "Validates that the player displays content correctly, transitions "
            "between slides, and remains running indefinitely without user input.",
            styles["body"],
        )
    )

    coffee = ASSETS / "screenshots" / "screenshot-1-coffee-shop.png"
    if coffee.exists():
        story.append(fitted_image(coffee))
        story.append(
            Paragraph(
                "Example: Onesign Display running in a coffee shop, showing the "
                "operator's coffee menu on an LG TV. Composition is illustrative — "
                "actual content varies by operator.",
                styles["caption"],
            )
        )

    story.extend(
        step_block(
            styles,
            1,
            "Observe content playback",
            [
                "After pairing, the demo content rotates through its assigned "
                "playlist. Each slide displays for the duration configured by the "
                "operator (typically 5–30 seconds).",
                "Transitions between slides use a smooth crossfade by default.",
            ],
        )
    )
    story.append(
        expectation_block(
            styles,
            [
                "Demo content plays continuously without manual intervention.",
                "No focus rings, cursors, or interactive UI elements are visible.",
                "Slides transition smoothly without black flashes.",
                "Screen remains awake throughout (subject to the TV's own power settings).",
            ],
        )
    )

    story.append(PageBreak())

    # ── Scenario C — Re-pairing ───────────────────────────────
    story.append(Paragraph("Scenario C — Re-pairing a screen", styles["h2"]))
    story.append(
        Paragraph(
            "Validates that an operator can reset a paired screen without "
            "uninstalling the app — useful when transferring a TV between venues "
            "or after generating a new token.",
            styles["body"],
        )
    )
    story.extend(
        step_block(
            styles,
            1,
            "Trigger the reset gesture",
            [
                "While the player is running, press and hold <b>any remote button</b> "
                "for 5 continuous seconds.",
                "A confirmation modal appears in the centre of the screen, asking "
                "<i>'Reset pairing token?'</i> with <b>Cancel</b> and <b>Reset</b> "
                "buttons.",
            ],
        )
    )
    story.extend(
        step_block(
            styles,
            2,
            "Validate the modal",
            [
                "Press the right arrow key to move focus from Cancel to Reset.",
                "Press the left arrow key to move focus back to Cancel.",
                "Press OK on <b>Cancel</b> — the modal closes and playback resumes.",
            ],
        )
    )
    story.extend(
        step_block(
            styles,
            3,
            "Confirm the reset path",
            [
                "Repeat the long-press gesture to re-open the modal.",
                "Move focus to <b>Reset</b> and press OK.",
            ],
        )
    )
    story.append(
        expectation_block(
            styles,
            [
                "App returns to the initial setup screen with an empty token field.",
                "The previously stored token is removed from local storage.",
                "Re-entering the same token restores playback identically to "
                "Scenario A.",
            ],
        )
    )

    story.append(PageBreak())

    # ── Edge cases ────────────────────────────────────────────
    story.append(Paragraph("3. Edge cases", styles["h1"]))

    story.append(Paragraph("Back button suppression", styles["h2"]))
    story.append(
        Paragraph(
            "Pressing the remote's <b>Back</b> button while the app is running "
            "must NOT cause the app to exit. This is intentional — signage "
            "deployments often involve staff who may accidentally press the back "
            "key while operating the venue. The app silently ignores back-key "
            "events while the player is active. The only way to exit is via the "
            "TV's Home button or by force-closing from the LG launcher.",
            styles["body"],
        )
    )
    story.append(
        expectation_block(
            styles,
            [
                "Back button press has no visible effect while the player is running.",
                "Back button has no effect during the setup screen either.",
                "The TV's Home button still exits the app as normal (this is not "
                "intercepted).",
            ],
        )
    )

    story.append(Spacer(1, 4 * mm))
    story.append(Paragraph("Network drop and recovery", styles["h2"]))
    story.append(
        Paragraph(
            "If the TV loses internet connectivity during playback, the player "
            "continues to display the most recently cached content and shows a "
            "small 'Offline' indicator in the bottom-right corner. When connectivity "
            "returns, the indicator disappears and the player resumes fetching the "
            "latest content within 30 seconds.",
            styles["body"],
        )
    )
    story.append(
        expectation_block(
            styles,
            [
                "Disconnecting Wi-Fi causes the 'Offline' indicator to appear within ~60 seconds.",
                "Cached content continues to display during the outage.",
                "Reconnecting causes the indicator to disappear within ~30 seconds.",
                "Latest content is fetched and displayed automatically — no manual action required.",
            ],
        )
    )

    story.append(Spacer(1, 4 * mm))
    story.append(Paragraph("Long-running stability", styles["h2"]))
    story.append(
        Paragraph(
            "The player includes a 15-minute heartbeat watchdog that automatically "
            "reloads the page if no successful content fetch has occurred during "
            "that window. This is a defence-in-depth measure against memory leaks, "
            "stalled render loops, or other long-session failure modes that can "
            "affect TV browsers. The reload is transparent to the user and the "
            "pairing token persists, so playback resumes within 5–10 seconds.",
            styles["body"],
        )
    )

    story.append(PageBreak())

    # ── Behaviour summary ─────────────────────────────────────
    story.append(Paragraph("4. Expected-behaviour summary", styles["h1"]))

    summary_rows = [
        ["Action", "Expected outcome"],
        ["Open the app from the launcher",
         "Splash background, then setup screen with token input"],
        ["Enter valid token + press Connect",
         "Player surface appears within 5 seconds; demo content plays"],
        ["Enter invalid token + press Connect",
         "'Invalid token' shown; returns to setup screen after 5s"],
        ["Player running (no user input)",
         "Content rotates continuously; screen stays awake"],
        ["Press the Back button",
         "No effect — back-key is intentionally suppressed"],
        ["Hold any remote key for 5 seconds",
         "Reset confirmation modal opens (Cancel / Reset)"],
        ["Reset confirmation → Cancel",
         "Modal closes; playback resumes"],
        ["Reset confirmation → Reset",
         "Token cleared; app returns to setup screen"],
        ["Disconnect internet during playback",
         "Cached frame stays on screen; 'Offline' indicator shows"],
        ["Reconnect internet",
         "Indicator clears; fresh content fetched within 30s"],
        ["Press the TV Home button",
         "App exits normally; resumes with stored token on next launch"],
    ]

    summary_table = Table(summary_rows, colWidths=[60 * mm, 100 * mm])
    summary_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), BRAND_TEAL),
                ("TEXTCOLOR", (0, 0), (-1, 0), HexColor("#ffffff")),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, 0), 10),
                ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
                ("FONTSIZE", (0, 1), (-1, -1), 9.5),
                ("TEXTCOLOR", (0, 1), (-1, -1), INK),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1),
                 [HexColor("#ffffff"), HexColor("#f6f9fa")]),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LINEBELOW", (0, 0), (-1, 0), 1, HexColor("#ffffff")),
            ]
        )
    )
    story.append(summary_table)

    story.append(Spacer(1, 6 * mm))
    story.append(Paragraph("Known limitations (v1.0.0)", styles["h2"]))
    story.append(
        Paragraph(
            "• No offline mode — internet connectivity is required to fetch content",
            styles["bullet"],
        )
    )
    story.append(
        Paragraph(
            "• Screen Wake Lock API is unavailable on webOS &lt; 6.0; on older "
            "models the app relies on audio/canvas activity heartbeats only",
            styles["bullet"],
        )
    )
    story.append(
        Paragraph(
            "• For 24/7 commercial deployment, customer must disable Auto Power "
            "Off in the TV's own settings (one-time, documented in the support page)",
            styles["bullet"],
        )
    )

    story.append(Spacer(1, 8 * mm))
    story.append(
        Paragraph(
            "<i>For any questions during review, please contact "
            "sales@onesignanddigital.com.</i>",
            styles["body"],
        )
    )

    doc.build(story, onFirstPage=add_footer, onLaterPages=add_footer)
    print(f"Generated {OUT.relative_to(ROOT)} ({OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    build()
