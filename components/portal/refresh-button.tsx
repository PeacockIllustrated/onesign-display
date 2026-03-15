'use client'

import { refreshScreens } from '@/app/actions/screen-actions'
import { useTransition } from 'react'

export function RefreshButton({ screenSetId }: { screenSetId: string }) {
    const [isPending, startTransition] = useTransition()

    return (
        <button
            onClick={() => startTransition(async () => { await refreshScreens(screenSetId) })}
            disabled={isPending}
            className="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
        >
            {isPending ? 'Refreshed...' : 'Refresh Screens'}
        </button>
    )
}
