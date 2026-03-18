'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { updateScreen } from '@/app/actions/manage-screens'

export function ScreenSettingsForm({ screenId, screen }: {
    screenId: string
    screen: { name: string; orientation: string; display_type: string }
}) {
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    const handleSubmit = async (formData: FormData) => {
        setSaving(true)
        setSaved(false)
        try {
            await updateScreen(screenId, formData)
            setSaved(true)
            setTimeout(() => setSaved(false), 3000)
        } catch (e: any) {
            alert(e.message || 'Failed to save')
        } finally {
            setSaving(false)
        }
    }

    return (
        <form action={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Display Name</label>
                <input name="name" type="text" defaultValue={screen.name} className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Orientation</label>
                <select name="orientation" defaultValue={screen.orientation} className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black">
                    <option value="landscape">Landscape</option>
                    <option value="portrait">Portrait</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Display Type</label>
                <select name="display_type" defaultValue={screen.display_type} className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black">
                    <option value="pc">PC / Web</option>
                    <option value="android">Android</option>
                    <option value="firestick">Amazon Fire Stick</option>
                </select>
            </div>
            <div className="pt-4">
                <button
                    type="submit"
                    disabled={saving}
                    className="w-full bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {saving ? 'Saving...' : saved ? (
                        <><Check className="w-4 h-4" /> Saved</>
                    ) : 'Save Changes'}
                </button>
                {saved && (
                    <p className="text-xs text-green-600 text-center font-medium mt-2">Changes saved successfully</p>
                )}
            </div>
        </form>
    )
}
