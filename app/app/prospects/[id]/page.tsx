import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ProspectStatusBadge } from '@/components/admin/prospect-status-badge'
import { ProspectNotesEditor } from '@/components/admin/prospect-notes-editor'
import { format } from 'date-fns'
import { Mail, Building2, Monitor, MessageSquare, Calendar, ArrowLeft } from 'lucide-react'

const PLAN_LABELS: Record<string, { name: string; price: string }> = {
    static: { name: 'Onesign Static', price: '£39' },
    video: { name: 'Onesign Video', price: '£59' },
    pro: { name: 'Onesign Pro', price: '£89' },
    enterprise: { name: 'Onesign Enterprise', price: 'POA' },
}

export default async function ProspectDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
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

    // Fetch prospect
    const { data: prospect } = await supabase
        .from('prospects')
        .select('*')
        .eq('id', id)
        .single()

    if (!prospect) {
        notFound()
    }

    const planInfo = prospect.plan ? PLAN_LABELS[prospect.plan] : null

    return (
        <div className="space-y-6 max-w-4xl">
            {/* Back Link */}
            <Link
                href="/app/prospects"
                className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Prospects
            </Link>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">{prospect.name}</h1>
                    <a href={`mailto:${prospect.email}`} className="text-zinc-500 hover:text-zinc-900 transition-colors">
                        {prospect.email}
                    </a>
                </div>
                <ProspectStatusBadge status={prospect.status} prospectId={prospect.id} />
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Company */}
                <div className="bg-white rounded-lg border border-zinc-200 p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="h-9 w-9 rounded-full bg-zinc-100 flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-zinc-600" />
                        </div>
                        <span className="text-sm font-medium text-zinc-500">Company</span>
                    </div>
                    <p className="text-lg font-semibold text-zinc-900">
                        {prospect.company || 'Not provided'}
                    </p>
                </div>

                {/* Plan Interest */}
                <div className="bg-white rounded-lg border border-zinc-200 p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="h-9 w-9 rounded-full bg-zinc-100 flex items-center justify-center">
                            <Calendar className="h-4 w-4 text-zinc-600" />
                        </div>
                        <span className="text-sm font-medium text-zinc-500">Plan Interest</span>
                    </div>
                    {planInfo ? (
                        <div>
                            <p className="text-lg font-semibold text-zinc-900">{planInfo.name}</p>
                            <p className="text-sm text-zinc-500">{planInfo.price}/month</p>
                        </div>
                    ) : (
                        <p className="text-lg font-semibold text-zinc-900">Not specified</p>
                    )}
                </div>

                {/* Screens */}
                <div className="bg-white rounded-lg border border-zinc-200 p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="h-9 w-9 rounded-full bg-zinc-100 flex items-center justify-center">
                            <Monitor className="h-4 w-4 text-zinc-600" />
                        </div>
                        <span className="text-sm font-medium text-zinc-500">Screens Needed</span>
                    </div>
                    <p className="text-lg font-semibold text-zinc-900">
                        {prospect.screens || 'Not specified'}
                    </p>
                </div>

                {/* Received */}
                <div className="bg-white rounded-lg border border-zinc,200 p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="h-9 w-9 rounded-full bg-zinc-100 flex items-center justify-center">
                            <Mail className="h-4 w-4 text-zinc-600" />
                        </div>
                        <span className="text-sm font-medium text-zinc-500">Received</span>
                    </div>
                    <p className="text-lg font-semibold text-zinc-900">
                        {format(new Date(prospect.created_at), 'MMM d, yyyy')}
                    </p>
                    <p className="text-sm text-zinc-500">
                        {format(new Date(prospect.created_at), 'h:mm a')}
                    </p>
                </div>
            </div>

            {/* Message */}
            {prospect.message && (
                <div className="bg-white rounded-lg border border-zinc-200 p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="h-9 w-9 rounded-full bg-zinc-100 flex items-center justify-center">
                            <MessageSquare className="h-4 w-4 text-zinc-600" />
                        </div>
                        <span className="text-sm font-medium text-zinc-500">Message from Prospect</span>
                    </div>
                    <p className="text-zinc-700 whitespace-pre-wrap">{prospect.message}</p>
                </div>
            )}

            {/* Notes */}
            <div className="bg-white rounded-lg border border-zinc-200 p-5">
                <h3 className="text-sm font-medium text-zinc-500 mb-3">Internal Notes</h3>
                <ProspectNotesEditor prospectId={prospect.id} initialNotes={prospect.notes || ''} />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
                <a
                    href={`mailto:${prospect.email}?subject=Re: Your Onesign Display Demo Request`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg font-medium hover:bg-zinc-800 transition-colors"
                >
                    <Mail className="h-4 w-4" />
                    Email {prospect.name.split(' ')[0]}
                </a>
            </div>
        </div>
    )
}
