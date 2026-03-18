'use client'

export default function AdminError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    return (
        <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center max-w-md">
                <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-red-500/10 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                    </svg>
                </div>
                <h2 className="text-lg font-semibold text-white mb-2">Something went wrong</h2>
                <p className="text-gray-400 text-sm mb-5">
                    There was a problem loading this page. Your data is safe.
                </p>
                <button
                    onClick={reset}
                    className="px-4 py-2 bg-[#4e7e8c] text-white text-sm font-medium rounded-lg hover:bg-[#3d6470] transition-colors"
                >
                    Try again
                </button>
            </div>
        </div>
    )
}
