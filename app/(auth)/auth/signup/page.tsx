'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import { signup } from './actions'
import { cn } from '@/lib/utils'
import { SELF_SERVE_PLANS, PLAN_PRICES, getPlanShortName, type PlanCode } from '@/lib/slate/plans'

const PLAN_DESCRIPTIONS: Record<string, string> = {
    static_design: 'Static image menus, up to 5 screens',
    video_design_system: 'Video + Specials Studio, up to 5 screens',
    pro_managed: 'Unlimited screens, 4K, managed support',
}

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <button
            type="submit"
            disabled={pending}
            className={cn(
                "w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors",
                pending && "opacity-50 cursor-not-allowed"
            )}
        >
            {pending ? 'Creating your account...' : 'Create account'}
        </button>
    )
}

function SignupForm() {
    const searchParams = useSearchParams()
    const planParam = searchParams.get('plan')
    const defaultPlan = SELF_SERVE_PLANS.includes(planParam as PlanCode)
        ? planParam!
        : 'video_design_system'

    const [state, formAction] = useActionState(signup, null)

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8 py-12">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <div className="flex justify-center">
                        <img src="/onesign-logo-dark.png" alt="Onesign" className="h-8 w-auto" />
                    </div>
                    <p className="mt-2 text-center text-sm text-zinc-600">
                        Create your account
                    </p>
                </div>

                <form className="mt-8 space-y-5" action={formAction}>
                    {/* Name & Business */}
                    <div className="space-y-3">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-zinc-700 mb-1">
                                Your name
                            </label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                required
                                className="block w-full bg-white px-3 py-2 border border-zinc-300 rounded-md text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
                                placeholder="Jane Smith"
                            />
                        </div>
                        <div>
                            <label htmlFor="business_name" className="block text-sm font-medium text-zinc-700 mb-1">
                                Business name
                            </label>
                            <input
                                id="business_name"
                                name="business_name"
                                type="text"
                                required
                                className="block w-full bg-white px-3 py-2 border border-zinc-300 rounded-md text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
                                placeholder="The Corner Bistro"
                            />
                        </div>
                    </div>

                    {/* Email & Password */}
                    <div className="space-y-3">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-zinc-700 mb-1">
                                Email address
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="block w-full bg-white px-3 py-2 border border-zinc-300 rounded-md text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
                                placeholder="jane@cornerbistro.com"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-zinc-700 mb-1">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="new-password"
                                required
                                minLength={8}
                                className="block w-full bg-white px-3 py-2 border border-zinc-300 rounded-md text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
                                placeholder="Min. 8 characters"
                            />
                        </div>
                    </div>

                    {/* Plan Selector */}
                    <fieldset className="space-y-2">
                        <legend className="block text-sm font-medium text-zinc-700">
                            Choose your plan
                        </legend>
                        <div className="space-y-2">
                            {SELF_SERVE_PLANS.map((code) => (
                                <label
                                    key={code}
                                    className="flex items-center gap-3 p-3 border border-zinc-200 rounded-lg cursor-pointer hover:border-zinc-400 has-[:checked]:border-black has-[:checked]:bg-zinc-50 transition-colors"
                                >
                                    <input
                                        type="radio"
                                        name="plan"
                                        value={code}
                                        defaultChecked={code === defaultPlan}
                                        className="h-4 w-4 text-black focus:ring-black border-zinc-300"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-zinc-900">
                                                {getPlanShortName(code)}
                                            </span>
                                            <span className="text-sm font-semibold text-zinc-900">
                                                &pound;{PLAN_PRICES[code]}/mo
                                            </span>
                                        </div>
                                        <p className="text-xs text-zinc-500 mt-0.5">
                                            {PLAN_DESCRIPTIONS[code]}
                                        </p>
                                    </div>
                                </label>
                            ))}
                        </div>
                        <p className="text-xs text-zinc-400 mt-1">
                            Need enterprise?{' '}
                            <Link href="/contact" className="text-zinc-600 hover:underline">
                                Contact sales
                            </Link>
                        </p>
                    </fieldset>

                    {state?.error && (
                        <div className="text-red-500 text-sm text-center bg-red-50 rounded-md py-2 px-3">
                            {state.error}
                        </div>
                    )}

                    <SubmitButton />
                </form>

                <p className="text-center text-sm text-zinc-500">
                    Already have an account?{' '}
                    <Link href="/auth/login" className="text-black font-medium hover:underline">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    )
}

export default function SignupPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-zinc-400 text-sm">Loading...</div>
            </div>
        }>
            <SignupForm />
        </Suspense>
    )
}
