import { Logo } from "@/components/marketing/Logo";

export function EmptyScreenPreview() {
    return (
        <div className="flex flex-col items-center justify-center h-full w-full bg-neutral-950 text-neutral-500">
            <div className="opacity-20 mb-4">
                {/* Assuming I can reuse the Logo component I made, but it's in components/marketing. 
             Ideally I should move Logo to components/ui or similar to share it. 
             For now, I'll just use a text placeholder or duplicate the image usage if imports are tricky cross-domain (they shouldn't be). */}
                <img src="/assets/OD-Logo-Light.svg" alt="Onesign Display" className="h-14 w-auto" />
            </div>
            <p className="text-sm font-mono tracking-widest uppercase">System Online</p>
            <p className="text-xs opacity-50 mt-1">Waiting for content</p>
        </div>
    );
}
