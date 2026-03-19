/**
 * Deterministic sync position calculator.
 *
 * Given the current synced time and a playlist epoch, computes exactly which
 * slide should be showing and where in its display/transition cycle we are.
 *
 * This is a pure function — no React, no side effects — so it's easy to test
 * and can be called on every animation frame without concern.
 */

export type SyncPosition = {
    /** Index of the currently displayed slide */
    slideIndex: number
    /** Milliseconds elapsed within the current slide's display phase */
    slideElapsedMs: number
    /** Whether we're in the transition period between slides */
    isInTransition: boolean
    /**
     * 0..1 progress through the transition.
     * 0 = transition just started, 1 = transition complete.
     * Only meaningful when isInTransition is true.
     */
    transitionProgress: number
    /** The slide being transitioned TO (only meaningful when isInTransition) */
    nextSlideIndex: number
    /** Total cycle duration in ms (useful for debug overlay) */
    totalCycleMs: number
    /** Elapsed ms within the current cycle (useful for debug overlay) */
    cycleElapsedMs: number
}

type PlaylistItem = {
    duration_seconds: number | null
}

/**
 * Compute the deterministic sync position.
 *
 * @param syncedNowMs  - Current time in ms, calibrated to server clock
 * @param epochMs      - Playlist epoch in ms (when the cycle "started")
 * @param items        - Playlist items with their display durations
 * @param transitionDurationMs - Crossfade/transition duration (0 for 'cut')
 * @param loop         - Whether the playlist loops
 * @param transitionType - 'fade' | 'cut' | 'slide_left' | 'slide_right'
 */
export function computeSyncPosition(
    syncedNowMs: number,
    epochMs: number,
    items: PlaylistItem[],
    transitionDurationMs: number,
    loop: boolean,
    transitionType: string,
): SyncPosition {
    if (items.length === 0) {
        return {
            slideIndex: 0,
            slideElapsedMs: 0,
            isInTransition: false,
            transitionProgress: 0,
            nextSlideIndex: 0,
            totalCycleMs: 0,
            cycleElapsedMs: 0,
        }
    }

    // For 'cut' transitions, there's no transition period
    const effectiveTransitionMs = transitionType === 'cut' ? 0 : transitionDurationMs

    // Build the timeline: each segment = display + transition
    // The last item in a looping playlist also gets a transition (back to first)
    // The last item in a non-looping playlist gets NO transition
    const segments: { displayMs: number; transitionMs: number }[] = items.map((item, i) => {
        const displayMs = (item.duration_seconds ?? 10) * 1000 // Default 10s if null
        const isLastItem = i === items.length - 1
        const transitionMs = (!loop && isLastItem) ? 0 : effectiveTransitionMs
        return { displayMs, transitionMs }
    })

    const totalCycleMs = segments.reduce((sum, seg) => sum + seg.displayMs + seg.transitionMs, 0)

    if (totalCycleMs <= 0) {
        return {
            slideIndex: 0,
            slideElapsedMs: 0,
            isInTransition: false,
            transitionProgress: 0,
            nextSlideIndex: 0,
            totalCycleMs: 0,
            cycleElapsedMs: 0,
        }
    }

    // Compute raw elapsed time since epoch
    let rawElapsed = syncedNowMs - epochMs

    let cycleElapsedMs: number

    if (loop) {
        // Modulo for looping — handle negative (clock slightly ahead of epoch)
        cycleElapsedMs = ((rawElapsed % totalCycleMs) + totalCycleMs) % totalCycleMs
    } else {
        // Clamp for non-looping
        if (rawElapsed < 0) {
            cycleElapsedMs = 0
        } else if (rawElapsed >= totalCycleMs) {
            // Playlist ended — show last slide, no transition
            return {
                slideIndex: items.length - 1,
                slideElapsedMs: segments[items.length - 1].displayMs,
                isInTransition: false,
                transitionProgress: 0,
                nextSlideIndex: items.length - 1,
                totalCycleMs,
                cycleElapsedMs: totalCycleMs,
            }
        } else {
            cycleElapsedMs = rawElapsed
        }
    }

    // Walk the timeline to find the current segment
    let accumulated = 0
    for (let i = 0; i < segments.length; i++) {
        const seg = segments[i]
        const segmentTotal = seg.displayMs + seg.transitionMs

        if (cycleElapsedMs < accumulated + segmentTotal) {
            const segmentElapsed = cycleElapsedMs - accumulated

            if (segmentElapsed < seg.displayMs) {
                // In the display phase of this slide
                return {
                    slideIndex: i,
                    slideElapsedMs: segmentElapsed,
                    isInTransition: false,
                    transitionProgress: 0,
                    nextSlideIndex: i,
                    totalCycleMs,
                    cycleElapsedMs,
                }
            } else {
                // In the transition phase
                const transitionElapsed = segmentElapsed - seg.displayMs
                const transitionProgress = seg.transitionMs > 0
                    ? Math.min(transitionElapsed / seg.transitionMs, 1)
                    : 1
                const nextIndex = loop
                    ? (i + 1) % items.length
                    : Math.min(i + 1, items.length - 1)

                return {
                    slideIndex: i,
                    slideElapsedMs: seg.displayMs,
                    isInTransition: true,
                    transitionProgress,
                    nextSlideIndex: nextIndex,
                    totalCycleMs,
                    cycleElapsedMs,
                }
            }
        }

        accumulated += segmentTotal
    }

    // Fallback (shouldn't reach here due to modulo)
    return {
        slideIndex: items.length - 1,
        slideElapsedMs: 0,
        isInTransition: false,
        transitionProgress: 0,
        nextSlideIndex: items.length - 1,
        totalCycleMs,
        cycleElapsedMs,
    }
}
