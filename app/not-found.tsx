import Link from 'next/link'

export default function NotFound() {
    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
            <div className="text-center max-w-md">
                <p className="text-6xl font-bold text-[#4e7e8c] mb-4">404</p>
                <h1 className="text-xl font-semibold text-white mb-2">Page not found</h1>
                <p className="text-gray-400 text-sm mb-6">
                    The page you&apos;re looking for doesn&apos;t exist or has been moved.
                </p>
                <Link
                    href="/"
                    className="inline-block px-4 py-2 bg-[#4e7e8c] text-white text-sm font-medium rounded-lg hover:bg-[#3d6470] transition-colors"
                >
                    Back to home
                </Link>
            </div>
        </div>
    )
}
