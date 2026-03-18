export default function AdminLoading() {
    return (
        <div className="flex-1 p-6 space-y-6 animate-pulse">
            <div className="h-8 w-48 bg-gray-800 rounded" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="h-32 bg-gray-800 rounded-xl" />
                <div className="h-32 bg-gray-800 rounded-xl" />
                <div className="h-32 bg-gray-800 rounded-xl" />
            </div>
            <div className="h-64 bg-gray-800 rounded-xl" />
        </div>
    )
}
