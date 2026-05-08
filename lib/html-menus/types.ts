import 'server-only'
import type { z } from 'zod'

export type ThemeRenderResult = {
  html: string | null
  error: string | null
}

export type HtmlMenuTheme<TContent = unknown> = {
  key: string
  displayName: string
  schema: z.ZodType<TContent>
  defaultContent: TContent
  render: (content: TContent) => string
}
