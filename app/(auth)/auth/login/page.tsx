'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { login } from './actions'
import { cn } from '@/lib/utils'

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <button
            type="submit"
            disabled={pending}
            className={cn(
                "w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors",
                pending && "opacity-50 cursor-not-allowed"
            )}
        >
            {pending ? 'Signing in...' : 'Sign in'}
        </button>
    )
}

export default function LoginPage() {
    const [state, formAction] = useActionState(login, null)

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <div className="flex justify-center">
                        <img src="/onesign-logo-dark.png" alt="Onesign" className="h-8 w-auto" />
                    </div>
                    <p className="mt-2 text-center text-sm text-zinc-600">
                        Sign in to your dashboard
                    </p>
                </div>
                <form className="mt-8 space-y-6" action={formAction}>
                    <input type="hidden" name="remember" value="true" />
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="email-address" className="sr-only">
                                Email address
                            </label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="appearance-none rounded-none relative block w-full bg-white px-3 py-2 border border-zinc-300 placeholder:text-zinc-400 text-zinc-900 rounded-t-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black focus:z-10 text-sm"
                                placeholder="Email address"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="appearance-none rounded-none relative block w-full bg-white px-3 py-2 border border-zinc-300 placeholder:text-zinc-400 text-zinc-900 rounded-b-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black focus:z-10 text-sm"
                                placeholder="Password"
                            />
                        </div>
                    </div>

                    {state?.error && (
                        <div className="text-red-500 text-sm text-center">
                            {state.error}
                        </div>
                    )}

                    <div>
                        <SubmitButton />
                    </div>
                </form>
                <p className="text-center text-sm text-zinc-500">
                    Don&apos;t have an account?{' '}
                    <a href="/auth/signup" className="text-black font-medium hover:underline">
                        Sign up
                    </a>
                </p>
            </div>
        </div>
    )
}
