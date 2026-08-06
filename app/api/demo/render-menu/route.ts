import { NextRequest, NextResponse } from 'next/server'
import { renderMenu, getTheme } from '@/lib/html-menus'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

// Menu rendering for the in-situ demo simulator (/demo).
//
// The demo's honesty hinges on this route: menu pixels on the simulated
// screens come from the SAME renderMenu()/theme code that feeds real
// players — not from screenshots or fixtures. Themes are server-only
// (react-dom/server), so the client-side demo driver round-trips here.
//
// Stateless and DB-free: renders caller-supplied content through public
// themes. With no contentJson, the theme's real defaultContent is used and
// echoed back so the demo seeds from production defaults instead of copies.

export async function POST(request: NextRequest) {
    const limited = rateLimit('demo-render', getClientIp(request), {
        maxRequests: 60,
        windowMs: 60_000,
    })
    if (limited) {
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    let body: { themeKey?: unknown; contentJson?: unknown }
    try {
        body = await request.json()
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const themeKey = typeof body.themeKey === 'string' ? body.themeKey : null
    if (!themeKey) {
        return NextResponse.json({ error: 'Missing themeKey' }, { status: 400 })
    }

    const theme = getTheme(themeKey)
    if (!theme) {
        return NextResponse.json({ error: `Unknown theme: ${themeKey}` }, { status: 404 })
    }

    const content = body.contentJson ?? theme.defaultContent
    const result = renderMenu(themeKey, content)

    return NextResponse.json({
        html: result.html,
        error: result.error,
        content,
    })
}
