// Domain types for the in-situ demo simulator.
//
// The point of this module is fidelity: DemoManifest mirrors the JSON the
// real /api/player/manifest route returns (see that route for the source of
// truth), and the record types mirror the display_* tables the manifest is
// built from. The demo is a different transport over the same contract.

// ── Manifest (mirrors /api/player/manifest response) ─────────

export type DemoManifestPlaylistItem = {
    id: string
    url: string
    type: string
    duration_seconds: number
}

export type DemoManifest = {
    screen_id: string
    refresh_version: number
    fit_mode: 'contain' | 'cover'
    media: { id: string | null; url: string | null; type: string | null }
    playlist: {
        id: string
        transition: 'fade' | 'cut' | 'slide_left' | 'slide_right'
        transition_duration_ms: number
        loop: boolean
        items: DemoManifestPlaylistItem[]
    } | null
    stream: null
    html_menu: {
        id: string
        theme_key: string
        rendered_at: string | null
        html: string
    } | null
    sync: {
        enabled: true
        epoch: string
        screen_index: number
        screen_count: number
    } | null
    next_check: string | null
    fetched_at: string
}

// ── Physical hardware in the scene ───────────────────────────
// A display someone has mounted on the wall. Knows nothing about the
// platform until a player stick is inserted and paired.

export type DemoHardware = {
    id: string
    /** Position/size as fractions of the wall box (0..1). Width is a
     *  fraction of wall width; height derives from the 16:9 panel. */
    x: number
    y: number
    w: number
    orientation: 'landscape' | 'portrait'
    powered: boolean
    /** The "Onesign USB player" — inserting it is what boots the software. */
    playerInserted: boolean
    /** Pairing token persisted "on the stick" (mirrors the webOS app's
     *  localStorage TOKEN_KEY — presence means auto-resume on boot). */
    storedToken: string | null
    /** Code shown on the TV while waiting to be claimed. */
    pairingCode: string | null
    /** Last-good manifest cached "on the stick" (mirrors the player's
     *  localStorage manifest cache — what keeps screens alive offline). */
    cachedManifest: DemoManifest | null
}

// ── Platform records (mirror display_* tables) ───────────────

export type DemoScreenRecord = {
    id: string
    name: string
    token: string
    hardwareId: string
    setId: string | null
    indexInSet: number
    refreshVersion: number
    /** Epoch for unsynced playlist playback (synced playback uses the
     *  set's shared epoch, exactly like the real system). */
    contentEpoch: string
}

export type DemoSet = {
    id: string
    name: string
    syncEnabled: boolean
    syncEpoch: string | null
}

export type DemoMenu = {
    id: string
    name: string
    themeKey: string
    contentJson: unknown | null
    renderedHtml: string | null
    renderedAt: string | null
    renderError: string | null
}

export type DemoPlaylist = {
    id: string
    name: string
    transition: 'fade' | 'cut' | 'slide_left' | 'slide_right'
    transitionDurationMs: number
    loop: boolean
    items: { id: string; url: string; durationSeconds: number }[]
}

export type ContentRef =
    | { kind: 'none' }
    | { kind: 'menu'; id: string }
    | { kind: 'playlist'; id: string }

export type DemoLogEntry = {
    at: string
    kind: 'pair' | 'content' | 'menu' | 'network' | 'power' | 'sync' | 'scene'
    text: string
}

// ── Whole-demo state ──────────────────────────────────────────

export type DemoState = {
    version: number
    /** Venue internet. Cutting it severs the TVs from the platform; the
     *  phone (on mobile data) keeps working — edits queue in the cloud
     *  and arrive when the venue reconnects. */
    wifi: boolean
    editMode: boolean
    backdropUrl: string | null
    hardware: Record<string, DemoHardware>
    records: Record<string, DemoScreenRecord>
    sets: Record<string, DemoSet>
    menus: Record<string, DemoMenu>
    playlists: Record<string, DemoPlaylist>
    assignments: Record<string, ContentRef>
    log: DemoLogEntry[]
}

/** Renders a menu through the real theme pipeline. The browser passes a
 *  fetch to /api/demo/render-menu; tests inject a fake. */
export type MenuRenderFn = (
    themeKey: string,
    contentJson: unknown | null,
) => Promise<{ html: string | null; error: string | null; content: unknown }>
