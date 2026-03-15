'use client'

import { useState } from 'react'
import { createStore } from '@/app/actions/store-actions'
import { useRouter } from 'next/navigation'

export function CreateStoreButton({ clientId }: { clientId: string }) {
    const [isOpen, setIsOpen] = useState(false)
    const [name, setName] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            const res = await createStore(clientId, name)
            if (res.error) {
                alert(res.error)
            } else {
                router.refresh()
                setIsOpen(false)
                setName('')
            }
        } catch (error) {
            alert('Failed to create store')
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="bg-black text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800"
            >
                Add Store
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
                        <h2 className="text-xl font-bold mb-4">Add New Store</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700">Store Name</label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black sm:text-sm"
                                />
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-4 py-2 text-sm font-medium text-white bg-black hover:bg-gray-800 rounded-md disabled:opacity-50"
                                >
                                    {loading ? 'Creating...' : 'Create Store'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
