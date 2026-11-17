'use client'

import { useState, useTransition } from 'react'
import { pairScreenWithCode } from '@/app/actions/pair-screen'

/**
 * "Pair a TV": type the code the TV shows at /pair. Replaces typing the
 * long player token on a TV remote.
 */
export function PairScreenForm({ screenId, pairUrl }: { screenId: string; pairUrl: string }) {
    const [code, setCode] = useState('')
    const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
    const [pending, startTransition] = useTransition()

    const submit = (e: React.FormEvent) => {
        e.preventDefault()
        setMessage(null)
        startTransition(async () => {
            const res = await pairScreenWithCode(screenId, code)
            if (res.ok) {
                setMessage({ ok: true, text: 'Paired. The TV will start playing within a few seconds.' })
                setCode('')
            } else {
                setMessage({ ok: false, text: res.error })
            }
        })
    }

    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 space-y-3">
            <div>
                <h3 className="font-medium text-sm text-gray-900">Pair a TV</h3>
                <p className="text-xs text-gray-500 mt-1">
                    On the TV or Screens Player box, open <span className="font-mono text-gray-700">{pairUrl}</span> and type the code it shows.
                </p>
            </div>
            <form onSubmit={submit} className="flex gap-2">
                <input
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="K7Q-29P"
                    maxLength={8}
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    className="flex-1 min-w-0 rounded-md border border-gray-300 px-3 py-2 font-mono text-sm tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-od-teal"
                    aria-label="Pairing code"
                />
                <button
                    type="submit"
                    disabled={pending || code.replace(/[^A-Za-z0-9]/g, '').length < 6}
                    className="rounded-md bg-gray-900 px-4 py-2 text-sm text-white disabled:opacity-40"
                >
                    {pending ? 'Pairing…' : 'Pair'}
                </button>
            </form>
            {message && (
                <p className={`text-xs ${message.ok ? 'text-od-teal' : 'text-red-600'}`} role="status">{message.text}</p>
            )}
        </div>
    )
}
