import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { HelpIcon } from '@/components/ui/help-icon'
import { ProspectStatusBadge } from '@/components/admin/prospect-status-badge'
import { formatDistanceToNow } from 'date-fns'

const PLAN_LABELS: Record<string, string> = {
    static: 'Static',
    video: 'Video',
    pro: 'Pro',
    enterprise: 'Enterprise',
}

export default async function ProspectsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth/login')

    // Check if super admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'super_admin') {
        redirect('/app')
    }

    // Fetch prospects
    const { data: prospects } = await supabase
        .from('prospects')
        .select('*')
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-extrabold tracking-wide uppercase text-zinc-900">Prospects</h1>
                    <HelpIcon section="prospects" />
                </div>
                <div className="text-sm text-zinc-500">
                    {prospects?.length || 0} total leads
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {['new', 'contacted', 'demo_scheduled', 'converted', 'lost'].map((status) => {
                    const count = prospects?.filter(p => p.status === status).length || 0
                    return (
                        <div key={status} className="bg-white rounded-lg border border-zinc-200 p-4">
                            <p className="text-2xl font-bold text-zinc-900">{count}</p>
                            <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium mt-1">
                                {status.replace('_', ' ')}
                            </p>
                        </div>
                    )
                })}
            </div>

            {/* Prospects Table */}
            <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-zinc-50 border-b border-zinc-200">
                            <tr>
                                <th className="text-left px-6 py-3 text-xs font-bold text-zinc-500 uppercase tracking-wider">Contact</th>
                                <th className="text-left px-6 py-3 text-xs font-bold text-zinc-500 uppercase tracking-wider">Company</th>
                                <th className="text-left px-6 py-3 text-xs font-bold text-zinc-500 uppercase tracking-wider">Plan Interest</th>
                                <th className="text-left px-6 py-3 text-xs font-bold text-zinc-500 uppercase tracking-wider">Screens</th>
                                <th className="text-left px-6 py-3 text-xs font-bold text-zinc-500 uppercase tracking-wider">Status</th>
                                <th className="text-left px-6 py-3 text-xs font-bold text-zinc-500 uppercase tracking-wider">Received</th>
                                <th className="text-right px-6 py-3 text-xs font-bold text-zinc-500 uppercase tracking-wider"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {prospects?.map((prospect) => (
                                <tr key={prospect.id} className="hover:bg-zinc-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="font-semibold text-zinc-900">{prospect.name}</p>
                                        <a href={`mailto:${prospect.email}`} className="text-sm text-zinc-500 hover:text-zinc-900">
                                            {prospect.email}
                                        </a>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-zinc-700">
                                        {prospect.company || '—'}
                                    </td>
                                    <td className="px-6 py-4">
                                        {prospect.plan ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-800">
                                                {PLAN_LABELS[prospect.plan] || prospect.plan}
                                            </span>
                                        ) : '—'}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-zinc-700">
                                        {prospect.screens || '—'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <ProspectStatusBadge status={prospect.status} prospectId={prospect.id} />
                                    </td>
                                    <td className="px-6 py-4 text-sm text-zinc-500">
                                        {formatDistanceToNow(new Date(prospect.created_at), { addSuffix: true })}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Link
                                            href={`/app/prospects/${prospect.id}`}
                                            className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
                                        >
                                            View →
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {(!prospects || prospects.length === 0) && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                                        No prospects yet. Demo requests from the website will appear here.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
