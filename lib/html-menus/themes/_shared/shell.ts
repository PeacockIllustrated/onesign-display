import 'server-only'
import { csp, unclesFontFaceCss } from './brand'

export type ShellOptions = {
  title: string
  css: string
  body: string
  fontFaceCss?: string
  cspOverride?: string
}

export function wrapDocument(opts: ShellOptions): string {
  const fontFaceCss = opts.fontFaceCss ?? unclesFontFaceCss
  const cspValue = opts.cspOverride ?? csp
  return (
    '<!DOCTYPE html>' +
    `<html lang="en">` +
    '<head>' +
    `<meta charset="UTF-8">` +
    `<meta name="viewport" content="width=1920, initial-scale=1">` +
    `<meta http-equiv="Content-Security-Policy" content="${escapeAttr(cspValue)}">` +
    `<title>${escapeText(opts.title)}</title>` +
    `<style>${fontFaceCss}${opts.css}</style>` +
    '</head>' +
    `<body>${opts.body}</body>` +
    '</html>'
  )
}

function escapeText(s: string): string {
  return s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]!))
}

function escapeAttr(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!))
}
