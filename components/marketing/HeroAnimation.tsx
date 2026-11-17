import { ScreensLockup } from '@/components/brand/ScreensLockup'

/** Marketing hero lockup on the dark hero. */
export function HeroAnimation() {
    return (
        <div className="flex flex-col items-center">
            <ScreensLockup reversed animate className="w-[260px] md:w-[340px] h-auto" />
        </div>
    )
}
