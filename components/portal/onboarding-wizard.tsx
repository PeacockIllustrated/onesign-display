'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    completeOnboarding,
    createStoreForOnboarding,
    createScreenSetForOnboarding,
} from '@/app/actions/onboarding-actions'

type Step = 'welcome' | 'store' | 'screen-set' | 'done'

export function OnboardingWizard({ clientName }: { clientName: string }) {
    const router = useRouter()
    const [step, setStep] = useState<Step>('welcome')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [dismissed, setDismissed] = useState(false)

    // Store step
    const [storeName, setStoreName] = useState('')
    const [storeId, setStoreId] = useState<string | null>(null)

    // Screen set step
    const [screenSetName, setScreenSetName] = useState('')

    const handleSkip = async () => {
        setLoading(true)
        const res = await completeOnboarding()
        setDismissed(true)
        if (!res.error) router.refresh()
    }

    const handleCreateStore = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!storeName.trim()) return
        setLoading(true)
        setError('')
        const res = await createStoreForOnboarding(storeName.trim())
        setLoading(false)
        if (res.error) {
            setError(res.error)
            return
        }
        setStoreId(res.storeId!)
        setScreenSetName('Main Menu Boards')
        setStep('screen-set')
    }

    const handleCreateScreenSet = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!screenSetName.trim() || !storeId) return
        setLoading(true)
        setError('')
        const res = await createScreenSetForOnboarding(storeId, screenSetName.trim())
        setLoading(false)
        if (res.error) {
            setError(res.error)
            return
        }
        setStep('done')
    }

    const handleFinish = async () => {
        setLoading(true)
        const res = await completeOnboarding()
        setDismissed(true)
        if (!res.error) router.refresh()
    }

    if (dismissed) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-8">

                {step === 'welcome' && (
                    <div className="text-center space-y-4">
                        <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center mx-auto">
                            <span className="text-white text-lg font-bold">1</span>
                        </div>
                        <h2 className="text-xl font-bold text-zinc-900">
                            Welcome to Onesign Display
                        </h2>
                        <p className="text-sm text-zinc-500">
                            Hi! Let&apos;s get <span className="font-medium text-zinc-700">{clientName}</span> set up.
                            We&apos;ll create your first store and screen set in under a minute.
                        </p>
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={handleSkip}
                                disabled={loading}
                                className="flex-1 px-4 py-2 text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
                            >
                                Skip setup
                            </button>
                            <button
                                onClick={() => setStep('store')}
                                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800 transition-colors"
                            >
                                Let&apos;s go
                            </button>
                        </div>
                    </div>
                )}

                {step === 'store' && (
                    <form onSubmit={handleCreateStore} className="space-y-4">
                        <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center mx-auto">
                            <span className="text-white text-lg font-bold">2</span>
                        </div>
                        <div className="text-center">
                            <h2 className="text-xl font-bold text-zinc-900">Create your first store</h2>
                            <p className="text-sm text-zinc-500 mt-1">
                                A store is a physical location — your restaurant, cafe, or venue.
                            </p>
                        </div>
                        <div>
                            <label htmlFor="store-name" className="block text-sm font-medium text-zinc-700 mb-1">
                                Store name
                            </label>
                            <input
                                id="store-name"
                                type="text"
                                required
                                value={storeName}
                                onChange={(e) => setStoreName(e.target.value)}
                                placeholder="e.g. High Street Branch"
                                className="block w-full bg-white px-3 py-2 border border-zinc-300 rounded-md text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
                            />
                        </div>
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={handleSkip}
                                disabled={loading}
                                className="flex-1 px-4 py-2 text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
                            >
                                Skip
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Creating...' : 'Create store'}
                            </button>
                        </div>
                    </form>
                )}

                {step === 'screen-set' && (
                    <form onSubmit={handleCreateScreenSet} className="space-y-4">
                        <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center mx-auto">
                            <span className="text-white text-lg font-bold">3</span>
                        </div>
                        <div className="text-center">
                            <h2 className="text-xl font-bold text-zinc-900">Add a screen set</h2>
                            <p className="text-sm text-zinc-500 mt-1">
                                A screen set groups your displays — e.g. &quot;Front Counter&quot; or &quot;Drive Through&quot;.
                            </p>
                        </div>
                        <div>
                            <label htmlFor="set-name" className="block text-sm font-medium text-zinc-700 mb-1">
                                Screen set name
                            </label>
                            <input
                                id="set-name"
                                type="text"
                                required
                                value={screenSetName}
                                onChange={(e) => setScreenSetName(e.target.value)}
                                placeholder="e.g. Main Menu Boards"
                                className="block w-full bg-white px-3 py-2 border border-zinc-300 rounded-md text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
                            />
                        </div>
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={handleSkip}
                                disabled={loading}
                                className="flex-1 px-4 py-2 text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
                            >
                                Skip
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Creating...' : 'Create screen set'}
                            </button>
                        </div>
                    </form>
                )}

                {step === 'done' && (
                    <div className="text-center space-y-4">
                        <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-zinc-900">You&apos;re all set!</h2>
                        <p className="text-sm text-zinc-500">
                            Your store and screen set are ready. Next: upload a menu image
                            and add a screen to start streaming.
                        </p>
                        <button
                            onClick={handleFinish}
                            disabled={loading}
                            className="w-full px-4 py-2.5 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Finishing...' : 'Go to dashboard'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
