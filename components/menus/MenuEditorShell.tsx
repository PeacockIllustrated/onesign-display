'use client'

import * as React from 'react'
import { saveAndRenderMenu } from '@/app/actions/menu-render-actions'
import { PanuozziEditor } from './PanuozziEditor'
import { QuadrantEditor } from './QuadrantEditor'

type Props = {
  menuId: string
  themeKey: string
  initialContent: any
}

type SaveStatus =
  | { kind: 'idle' }
  | { kind: 'saving' }
  | { kind: 'saved'; at: number }
  | { kind: 'error'; message: string }

export function MenuEditorShell({ menuId, themeKey, initialContent }: Props) {
  const [content, setContent] = React.useState<any>(initialContent)
  const [previewVersion, setPreviewVersion] = React.useState(0)
  const [status, setStatus] = React.useState<SaveStatus>({ kind: 'idle' })

  const saveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const onChange = React.useCallback(
    (next: any) => {
      setContent(next)
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(async () => {
        setStatus({ kind: 'saving' })
        try {
          const res = await saveAndRenderMenu(menuId, next)
          if (res.error) setStatus({ kind: 'error', message: res.error })
          else setStatus({ kind: 'saved', at: Date.now() })
          setPreviewVersion((v) => v + 1)
        } catch (e: any) {
          setStatus({ kind: 'error', message: e?.message ?? 'Save failed' })
        }
      }, 600)
    },
    [menuId]
  )

  React.useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,460px)_1fr] gap-4">
      <div className="space-y-3">
        <div className="text-xs">
          {status.kind === 'idle' ? <span className="text-gray-400">No unsaved edits</span> : null}
          {status.kind === 'saving' ? <span className="text-gray-500">Saving…</span> : null}
          {status.kind === 'saved' ? (
            <span className="text-emerald-600">Saved ✓</span>
          ) : null}
          {status.kind === 'error' ? (
            <span className="text-red-600 whitespace-pre-wrap">{status.message}</span>
          ) : null}
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 max-h-[calc(100vh-220px)] overflow-y-auto">
          {themeKey === 'uncles-panuozzi' ? (
            <PanuozziEditor value={content} onChange={onChange} />
          ) : themeKey === 'uncles-quadrant' ? (
            <QuadrantEditor value={content} onChange={onChange} />
          ) : (
            <div className="text-sm text-gray-500">No editor registered for theme “{themeKey}”.</div>
          )}
        </div>
      </div>

      <div className="bg-zinc-900 rounded-lg overflow-hidden">
        <div className="aspect-[16/9] w-full">
          <iframe
            src={`/app/menus/${menuId}/preview?v=${previewVersion}`}
            className="w-full h-full border-0 origin-top-left"
            title="Menu preview"
          />
        </div>
        <p className="text-[10px] text-gray-400 px-3 py-1.5 border-t border-zinc-800">
          Live preview · 1920×1080 · scaled to fit
        </p>
      </div>
    </div>
  )
}
