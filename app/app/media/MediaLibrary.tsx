'use client'

import { useState, useMemo } from 'react'
import { Search, Image, Film, LayoutGrid } from 'lucide-react'
import { MediaItem } from './MediaItem'

type Asset = {
    id: string
    storage_path: string
    filename: string
    bytes?: number
    mime?: string
    inUse?: boolean
    created_at?: string
}

type Filter = 'all' | 'images' | 'videos' | 'in-use' | 'unused'

export function MediaLibrary({ assets }: { assets: Asset[] }) {
    const [search, setSearch] = useState('')
    const [filter, setFilter] = useState<Filter>('all')

    const filtered = useMemo(() => {
        let result = assets

        // Search by filename
        if (search) {
            const q = search.toLowerCase()
            result = result.filter(a => a.filename.toLowerCase().includes(q))
        }

        // Type/usage filter
        switch (filter) {
            case 'images':
                result = result.filter(a => a.mime?.startsWith('image/'))
                break
            case 'videos':
                result = result.filter(a => a.mime?.startsWith('video/'))
                break
            case 'in-use':
                result = result.filter(a => a.inUse)
                break
            case 'unused':
                result = result.filter(a => !a.inUse)
                break
        }

        return result
    }, [assets, search, filter])

    const filters: { key: Filter; label: string; icon?: any }[] = [
        { key: 'all', label: 'All', icon: LayoutGrid },
        { key: 'images', label: 'Images', icon: Image },
        { key: 'videos', label: 'Videos', icon: Film },
        { key: 'in-use', label: 'In Use' },
        { key: 'unused', label: 'Unused' },
    ]

    return (
        <div className="space-y-4">
            {/* Search + filters row */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search files..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                    />
                </div>

                <div className="flex gap-1">
                    {filters.map(f => (
                        <button
                            key={f.key}
                            onClick={() => setFilter(f.key)}
                            className={`px-3 py-2 text-xs font-medium rounded-md transition-colors flex items-center gap-1 ${
                                filter === f.key
                                    ? 'bg-black text-white'
                                    : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            {f.icon && <f.icon className="w-3.5 h-3.5" />}
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Gallery grid */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {filtered.map((asset) => (
                    <MediaItem key={asset.id} asset={asset} />
                ))}

                {filtered.length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-500">
                        {search || filter !== 'all'
                            ? 'No media matches your filters.'
                            : 'No media found for this client.'}
                    </div>
                )}
            </div>

            {/* Showing count */}
            {filtered.length > 0 && filtered.length !== assets.length && (
                <p className="text-xs text-gray-400 text-center">
                    Showing {filtered.length} of {assets.length}
                </p>
            )}
        </div>
    )
}
