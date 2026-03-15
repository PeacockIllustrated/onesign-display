'use client'

import * as React from "react"
import { Check } from "lucide-react"
import clsx from "clsx"

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
    ({ className, label, id, ...props }, ref) => {
        return (
            <div className="flex items-center space-x-2">
                <div className="relative flex items-center">
                    <input
                        type="checkbox"
                        ref={ref}
                        id={id}
                        className={clsx(
                            "peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-zinc-300 transition-all checked:border-black checked:bg-black hover:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-black/20",
                            className
                        )}
                        {...props}
                    />
                    <Check
                        size={14}
                        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition-opacity peer-checked:opacity-100"
                    />
                </div>
                {label && (
                    <label htmlFor={id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-neutral-900">
                        {label}
                    </label>
                )}
            </div>
        )
    }
)
Checkbox.displayName = "Checkbox"
