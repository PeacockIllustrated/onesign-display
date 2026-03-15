
export function ScreenPreviewFrame({
    src,
    caption
}: {
    src?: string;
    caption?: string
}) {
    return (
        <div className="relative group">
            <div className="overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100 shadow-lg aspect-video flex items-center justify-center relative">
                {src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={src} alt="Screen Preview" className="w-full h-full object-cover" />
                ) : (
                    <div className="text-neutral-400 font-mono text-sm">
                        Screen Output
                    </div>
                )}

                {/* Glare effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none duration-700" />
            </div>
            {caption && (
                <div className="mt-4 flex items-center justify-between px-1">
                    <span className="text-xs font-mono text-neutral-500 uppercase tracking-widest">
                        Live Preview
                    </span>
                    <span className="text-xs text-neutral-400">
                        {caption}
                    </span>
                </div>
            )}
        </div>
    );
}
