# Slideshow / Playlists — Design Spec

## Problem

Screens currently display a single image or video. Businesses need to rotate multiple pieces of content — breakfast menus, lunch specials, promo videos — in sequence on a single screen. There is no way to do this today without manually swapping media or using overlapping schedules.

## Solution

Reusable **playlists** — ordered sequences of images and videos that play on a loop with configurable transitions. Playlists can be assigned to screens as active content or within schedule time windows, just like single media today.

## Decisions

| Decision | Choice |
|----------|--------|
| Reusable playlists vs inline per-screen | **Reusable playlists** — create once, assign to many screens |
| Plan gating | **Available to all plans** (no feature gate for now) |
| Transitions | **Fade, Cut, Slide** (left/right) |
| Schedule integration | **Schedules can assign playlists** in addition to single media |

---

## Data Model

### New Tables

**`display_playlists`**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| client_id | uuid FK → display_clients | Multi-tenant scoping |
| name | text NOT NULL | e.g. "Lunch Rotation" |
| transition | text NOT NULL DEFAULT 'fade' | 'fade', 'cut', 'slide_left', 'slide_right' |
| transition_duration_ms | int NOT NULL DEFAULT 500 | Milliseconds |
| loop | boolean NOT NULL DEFAULT true | Repeat after last slide |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**`display_playlist_items`**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| playlist_id | uuid FK → display_playlists ON DELETE CASCADE | |
| media_asset_id | uuid FK → display_media_assets ON DELETE RESTRICT | |
| position | int NOT NULL | Sort order (1-based) |
| duration_seconds | int NOT NULL DEFAULT 10 | For images. Videos ignore this and play full length. |

Unique constraint: `(playlist_id, position)`.

### Modified Tables

**`display_screen_content`** — add column:
- `playlist_id uuid FK → display_playlists ON DELETE SET NULL` (nullable)
- `media_asset_id` becomes nullable
- CHECK constraint: exactly one of `media_asset_id` or `playlist_id` is NOT NULL

**`display_scheduled_screen_content`** — same pattern:
- Add `playlist_id` (nullable FK)
- `media_asset_id` becomes nullable
- CHECK constraint: exactly one set

### RLS Policies

Both new tables follow the existing pattern:
- `display_playlists`: client-scoped via `client_id` match or super_admin
- `display_playlist_items`: client-scoped via join to `display_playlists.client_id`

---

## API Changes

### Manifest Response (`GET /api/player/manifest`)

The response gains an optional `playlist` field. When a playlist is assigned, `media` contains null values and `playlist` contains the full item list:

```json
{
  "screen_id": "...",
  "refresh_version": 5,
  "media": { "id": null, "url": null, "type": null },
  "playlist": {
    "id": "uuid",
    "transition": "fade",
    "transition_duration_ms": 500,
    "loop": true,
    "items": [
      { "id": "uuid", "url": "https://signed...", "type": "image/jpeg", "duration_seconds": 10 },
      { "id": "uuid", "url": "https://signed...", "type": "video/mp4", "duration_seconds": null }
    ]
  },
  "next_check": "...",
  "fetched_at": "..."
}
```

When a single media is assigned (no playlist), `playlist` is null and `media` works as before. **Fully backwards compatible.**

### Resolution Logic

`display_resolve_screen_media` SQL function is extended (or a companion function created) to return both `media_asset_id` and `playlist_id`. The manifest route checks which one is set and builds the response accordingly.

### Refresh Detection (`GET /api/player/refresh`)

Add `knownPlaylistId` parameter. If the resolved playlist ID differs from the client's known one, `should_refresh: true`. Playlist content changes (items added/removed/reordered) trigger a `refresh_version` increment on all screens using that playlist.

---

## Player Changes

### Slideshow Engine

The player component gains a slideshow mode when `manifest.playlist` is present:

1. **State**: `currentIndex` (which slide is showing), `nextIndex` (which slide is transitioning in)
2. **Image slides**: Display for `duration_seconds`, then transition to next
3. **Video slides**: Play to completion (`onEnded` event), then transition to next
4. **Looping**: After last slide, wrap to index 0 (if `loop: true`)
5. **Transitions**: CSS-driven animations:
   - `fade`: Opacity crossfade over `transition_duration_ms`
   - `cut`: Instant swap (0ms)
   - `slide_left` / `slide_right`: Translate X with ease timing

### Preloading

To prevent blank frames between slides:
- Preload the **next** slide's media while the current one plays
- For images: create an `Image()` object and set `src`
- For videos: create a `<video>` element with `preload="auto"`

### Signed URL Management

Each manifest fetch returns signed URLs for **all** playlist items (1-hour TTL). The 45-minute refresh timer already in place will re-fetch the manifest and get fresh URLs for all items before they expire.

---

## Admin UI

### New Pages

**`/app/playlists`** — Playlist list page
- Grid of playlist cards showing: name, slide count, transition type, screens using it
- "+ New Playlist" button → creates and redirects to editor

**`/app/playlists/[id]`** — Playlist editor
- Left column: Ordered slide list (drag-to-reorder)
  - Each row: thumbnail, filename, type badge, duration input (images) or "auto" label (videos), delete button
  - "+ Add Media" button → opens existing media picker modal
- Right column: Settings panel
  - Name input
  - Transition dropdown (Fade, Cut, Slide Left, Slide Right)
  - Transition duration input (ms)
  - Loop checkbox
  - Save button

### Modified Pages

**Screen detail page** (`/app/screens/[screenId]`) — Content assignment:
- Media picker gains a **tab switcher**: "Media" | "Playlists"
- "Playlists" tab shows available playlists for this client
- Selecting a playlist assigns it (same flow as selecting single media today)
- Live preview shows first slide of playlist with playlist badge

**Schedule editor** — Same tab pattern when assigning content to a schedule slot.

### Navigation

Add "Playlists" link to the admin sidebar, below "Media".

---

## Server Actions

### New Actions (`app/actions/playlist-actions.ts`)

- `createPlaylist(clientId, name)` — creates playlist, redirects to editor
- `updatePlaylist(playlistId, formData)` — updates name, transition, duration, loop
- `deletePlaylist(playlistId)` — deletes playlist (cascades items, nullifies screen_content references)
- `addPlaylistItem(playlistId, mediaAssetId, position, durationSeconds)` — adds slide
- `removePlaylistItem(itemId)` — removes slide, re-indexes positions
- `reorderPlaylistItems(playlistId, itemIds[])` — bulk update positions
- `assignPlaylist(screenId, playlistId)` — same pattern as assignMedia but sets playlist_id instead

All actions include:
- Auth check
- Client ownership verification (same pattern as hardened `assignMedia` / `createSchedule`)
- `refresh_version` increment on affected screens

### Cascade Refresh

When a playlist is modified (items added/removed/reordered, settings changed), ALL screens currently using that playlist need their `refresh_version` incremented. This is a single query:

```sql
UPDATE display_screens SET refresh_version = refresh_version + 1
WHERE id IN (
  SELECT screen_id FROM display_screen_content WHERE playlist_id = $1 AND active = true
)
```

---

## Migration Plan

Single migration file: `supabase/migrations/20260318_add_playlists.sql`

1. Create `display_playlists` table
2. Create `display_playlist_items` table
3. Alter `display_screen_content`: add `playlist_id`, make `media_asset_id` nullable, add CHECK
4. Alter `display_scheduled_screen_content`: same changes
5. Add RLS policies for both new tables
6. Create or modify the resolution function to handle playlists

**Backwards compatible**: Existing screens with `media_asset_id` set continue to work unchanged. The CHECK constraint allows either field but not both.

---

## Testing

- Playlist CRUD: create, update, delete, add/remove/reorder items
- Assignment: assign playlist to screen, verify manifest returns full item list
- Player: slideshow advances correctly (image timer, video onEnded, loop)
- Transitions: fade, cut, slide render correctly
- Schedule integration: playlist assigned via schedule resolves correctly
- Refresh cascade: editing a playlist triggers refresh on all screens using it
- Authorization: client_admin can only manage own client's playlists
- Edge cases: empty playlist, single-item playlist, playlist with all videos
