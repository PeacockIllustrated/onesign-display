'use client'

import { useState } from 'react'
import { ClientCreationModal } from './client-creation-modal'

export function CreateClientButton() {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="bg-black text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800"
            >
                New Client
            </button>
            <ClientCreationModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </>
    )
}
