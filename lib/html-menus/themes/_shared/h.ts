// Tiny HTML-escape helper. Themes build their output as plain strings —
// no react-dom/server, so nothing leaks `react-dom/server` into Server
// Component import graphs. All operator-supplied text MUST flow through e().

export function e(s: string | number): string {
  if (typeof s === 'number') return String(s)
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!)
  )
}

export function fmtPrice(n: number): string {
  return `£${n.toFixed(2)}`
}
