'use client'

import { useState } from 'react'
import { addScreen } from '@/app/actions/manage-screens'
import { useRouter } from 'next/navigation'

export function CreateScreenButton({ screenSetId }: { screenSetId: string }) {
    const [isOpen, setIsOpen] = useState(false)
    const [name, setName] = useState('New Screen')
    const [orientation, setOrientation] = useState<string>('landscape')
    const [displayType, setDisplayType] = useState<string>('pc')
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const formData = new FormData()
        formData.append('screen_set_id', screenSetId)
        formData.append('name', name)
        formData.append('orientation', orientation)
        formData.append('display_type', displayType)

        try {
            await addScreen(formData) // it acts as a server action, returns void or throws
            router.refresh()
            setIsOpen(false)
            // Reset to defaults
            setName('New Screen')
            setOrientation('landscape')
        } catch (error: any) {
            alert(`Failed to create screen: ${error.message}`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="bg-black text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 flex-1 md:flex-none text-center"
            >
                Add Screen
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
                        <h2 className="text-xl font-bold mb-4">Add New Screen</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700">Screen Name</label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black sm:text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700">Orientation</label>
                                <select
                                    value={orientation}
                                    onChange={(e) => setOrientation(e.target.value)}
                                    className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black sm:text-sm"
                                >
                                    <option value="landscape">Landscape (Horizontal)</option>
                                    <option value="portrait">Portrait (Vertical)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700">Display Type</label>
                                <select
                                    value={displayType}
                                    onChange={(e) => setDisplayType(e.target.value)}
                                    className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black sm:text-sm"
                                >
                                    <option value="pc">PC / Web Browser</option>
                                    <option value="android">Android / FireStick</option>
                                </select>
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
                                    {loading ? 'Adding...' : 'Add Screen'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
