import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cn } from '@/lib/utils'
import { SignedImage } from '@/components/ui/signed-image'
import { RefreshButton } from '@/components/portal/refresh-button'
import { CreateScreenButton } from '@/components/admin/create-screen-button'
import { ScreenCard } from '@/components/portal/screen-card'

export default async function ScreenSetPage({ params }: { params: Promise<{ setId: string }> }) {
    const { setId } = await params
    const supabase = await createClient()

    const { data: screenSet } = await supabase.from('screen_sets').select('*, store:stores(id, name)').eq('id', setId).single()
    if (!screenSet) return notFound()

    // Auth check loose
    const { data: { user } } = await supabase.auth.getUser()
    // We could fetch role here if we want to conditionally hide, but for now we show it.

    // Fetch Screens with their active content
    const { data: screens } = await supabase
        .from('screens')
        .select(`
        *,
        screen_content(
            media_asset:media_assets(*)
        )
    `)
        .eq('screen_set_id', setId)
        .eq('screen_content.active', true)
        .order('name', { ascending: true })

    // Group screens
    const landscapeScreens = screens?.filter(s => s.orientation !== 'portrait') || []
    const portraitScreens = screens?.filter(s => s.orientation === 'portrait') || []

    return (
        <div className="space-y-8 h-full flex flex-col">
            <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-4 flex-shrink-0">
                <div>
                    <Link href={`/app/stores/${screenSet.store?.id}`} className="text-sm text-gray-500 hover:text-gray-900 mb-1 block">&larr; {screenSet.store?.name}</Link>
                    <h1 className="text-2xl font-bold text-gray-900">{screenSet.name}</h1>
                </div>
                <div className="flex space-x-3 w-full md:w-auto">
                    <RefreshButton screenSetId={setId} />
                    <CreateScreenButton screenSetId={setId} />
                </div>
            </div>

            <div className="flex-1 overflow-auto bg-gray-100 p-4 md:p-8 rounded-lg border border-dashed border-gray-300 space-y-8">

                {portraitScreens.length > 0 && (
                    <div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Portrait Screens</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {portraitScreens.map(screen => <ScreenCard key={screen.id} screen={screen} />)}
                        </div>
                    </div>
                )}

                {landscapeScreens.length > 0 && (
                    <div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Landscape Screens</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {landscapeScreens.map(screen => <ScreenCard key={screen.id} screen={screen} />)}
                        </div>
                    </div>
                )}

                {screens?.length === 0 && (
                    <div className="text-center text-gray-500 py-12">No screens in this set.</div>
                )}
            </div>
        </div >
    )
}
