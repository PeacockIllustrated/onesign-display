'use client'

import { useState } from 'react'
import { createClient } from '@/app/actions/client-actions'
import { useRouter } from 'next/navigation'

export function ClientCreationModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const [name, setName] = useState('')
    const [slug, setSlug] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            const res = await createClient(name, slug)
            if (res.error) {
                alert(res.error)
            } else {
                router.refresh()
                onClose()
                setName('')
                setSlug('')
            }
        } catch (error) {
            alert('Failed to create client')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
                <h2 className="text-xl font-bold mb-4">Create New Client</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-700">Client Name</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value)
                                // Auto-slug
                                if (!slug) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'))
                            }}
                            className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black sm:text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-700">Slug (Unique ID)</label>
                        <input
                            type="text"
                            required
                            value={slug}
                            onChange={(e) => setSlug(e.target.value)}
                            className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black sm:text-sm"
                        />
                    </div>
                    <div className="flex justify-end space-x-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 text-sm font-medium text-white bg-black hover:bg-gray-800 rounded-md disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : 'Create Client'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
