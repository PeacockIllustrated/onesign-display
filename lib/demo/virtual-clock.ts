// Virtual clock for the in-situ demo.
//
// Everything time-based in the demo reads from this instead of Date.now(),
// so a full trading day can pass in seconds during a pitch. The real sync
// engine's computeSyncPosition() takes `syncedNowMs` as an argument, which
// is what lets us drive the *production* sync math with warped time — no
// production code changes required.

export class VirtualClock {
    private anchorReal: number
    private anchorVirtual: number
    private _rate: number
    private listeners = new Set<() => void>()

    constructor() {
        this.anchorReal = Date.now()
        this.anchorVirtual = Date.now()
        this._rate = 1
    }

    /** Current virtual time in ms (same scale as Date.now()). */
    now(): number {
        return this.anchorVirtual + (Date.now() - this.anchorReal) * this._rate
    }

    nowIso(): string {
        return new Date(this.now()).toISOString()
    }

    get rate(): number {
        return this._rate
    }

    /** Change speed without a discontinuity in now(). */
    setRate(rate: number) {
        const v = this.now()
        this.anchorReal = Date.now()
        this.anchorVirtual = v
        this._rate = rate
        this.emit()
    }

    /** Snap back to real wall-clock time at 1x. */
    reset() {
        this.anchorReal = Date.now()
        this.anchorVirtual = Date.now()
        this._rate = 1
        this.emit()
    }

    subscribe(fn: () => void): () => void {
        this.listeners.add(fn)
        return () => this.listeners.delete(fn)
    }

    private emit() {
        this.listeners.forEach((fn) => fn())
    }
}
