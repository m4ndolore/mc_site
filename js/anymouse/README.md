# Anymouse

Anymouse is an embeddable, config-driven quick-capture widget — a floating button
that opens a small panel for jotting categorized notes, with pluggable
persistence and authentication. It mounts a single instance per page.

This directory is the widget's source. It was adopted from the retired SigmaBlox
monorepo (`packages/anymouse`) when mc_site became its only host; Vite bundles
it straight from here (see [Build](#build)). mc_site's wiring — auth, the save
endpoint, placement — lives in `js/anymouse-init.js`.

## Quick Start

```js
import './anymouse/anymouse.js';   // side effect: sets window.Anymouse

Anymouse.init({
  apiBase: 'https://api.example.com',
  getUser: async () => ({ email: 'member@example.com' }),
});
```

`Anymouse.init(config)` is async and resolves to the `Anymouse` controller. The
widget mounts for everyone; `getUser()` only gates *saving* — a logged-out user
can open it and type, and Save prompts sign-in instead of persisting.

## Config

All keys are optional. Unknown keys are ignored with a console warning.

### Live keys

| Key | Type | Default | Description |
| --- | --- | --- | --- |
| `apiBase` | `string` | `''` | Base URL for the built-in `defaultSave`. Trailing slash is stripped. |
| `save` | `(note) => Promise` | `null` | Custom persistence. Overrides `defaultSave`. Receives the note payload (below). |
| `getUser` | `() => Promise<{email}\|null>` | `null` | Resolve the current user. The widget mounts for **everyone**; this only gates *capability*: a `null` user (or one without `email`) can open and type, but **Save prompts sign-in** instead of persisting. |
| `categories` | `Array<{id,label,accent?,icon?}>` | 4 built-ins | Quick-classify tiles. See note on `icon` below. |
| `defaultCategory` | `string` | `'note'` | Category id selected when the panel opens. Falls back to the first category if it doesn't match. |
| `hotkeys` | `{doubleShift,singleKey}` | `{doubleShift: true, singleKey: 'a'}` | Keyboard launchers. See [Hotkeys](#hotkeys). |
| `suppressOn` | `string[]` | `[]` | Path patterns. If any substring-matches `location.pathname`, the widget does not mount. `'/'` matches the homepage exactly. Empty array = mount everywhere. |
| `captureContext` | `boolean` | `false` | When true, attach a `context` object (below) to each note. |
| `viewAllUrl` | `string` | `'/my-notes/'` | Destination for the "View all notes" button. |
| `onViewAll` | `() => void` | `null` | Callback for "View all". Takes precedence over `viewAllUrl`. If both are falsy, the button is hidden. |
| `signInUrl` | `string` | `null` | Sign-in target for logged-out Save. Falls back to `${apiBase}/auth/sso/start?provider=authentik&returnTo=<path>`. |
| `onSignIn` | `() => void` | `null` | Callback for logged-out Save. Takes precedence over `signInUrl` (host drives sign-in). |
| `anchor` | `{selector,gap}` | `{selector: null, gap: 50}` | For top corners only. If `selector` resolves an element (e.g. a sticky navbar), the top offset = that element's bottom + `gap` px, recomputed on resize and scroll. Drag-persisted position overrides this. |
| `position` | `corner \| {default,mobile,mobileMaxWidth}` | `{default: 'top-right', mobile: null, mobileMaxWidth: 768}` | Which corner the widget parks in, with an optional different corner on narrow viewports. See [Placement](#placement). |
| `adoption` | `object` | see below | Attention/adoption mechanics. Deep-merged. See [Adoption](#adoption). |

### Adoption (attention layer)

The `adoption` block drives widget usage with four config-gated mechanics. The
default posture is "dialed up" — tune or disable any sub-key. The block is
**deep-merged**, so a host can override one leaf (e.g.
`adoption.idleNudge.idleMs`) without losing sibling defaults.

```js
adoption: {
  enabled: true,                       // master switch for the whole layer
  coachmark: {
    enabled: true,
    text: 'Quick-capture anything — double-tap Shift or click me.',
    rePulseAfterVisits: 3,             // re-pulse if seen but never used after N visits
  },
  idleNudge: {
    enabled: true,
    idleMs: 90000,                     // inactivity before the nudge fires
    text: 'Got a thought? Jot it here.',
    oncePerSession: true,
  },
  contextualHints: [                   // host-supplied; default []
    // { match: '/combine/', text: 'Capture an observation about this company.' }
  ],
  postSave: { enabled: true, streak: true },
}
```

| Mechanic | Triggers | Dismisses | Once-guard |
| --- | --- | --- | --- |
| **Coachmark + pulse** | First visit (no `anymouse-seen`) | Open panel / click × / ~8s | `anymouse-seen` set on first panel open |
| **Re-pulse** | Seen but never used, `anymouse-visits` ≥ `rePulseAfterVisits` | ~8s (no text) | `anymouse-repulsed` (at most once) |
| **Idle nudge** | `idleMs` of inactivity, panel closed | Interaction / ~10s | `anymouse-idle-shown` (sessionStorage) when `oncePerSession` |
| **Contextual hint** | First matching `contextualHints[].match` in `location.pathname` | click × / ~8s | `anymouse-hint-<match>` |
| **Post-save streak** | Successful save (`onSaved()`) | — (status line) | Sets `anymouse-used`; weekly counter resets each week |

`contextualHints` must be an array of `{ match, text }` (substring match on
`location.pathname`). A non-array falls back to `[]` with a warning.

#### localStorage / sessionStorage keys

All access is wrapped in try/catch (private-mode safe). Reduced motion disables
the pulse animation and bubble fade (bubbles still show, just static).

| Key | Store | Meaning |
| --- | --- | --- |
| `anymouse-seen` | localStorage | `'1'` once the user has opened the panel |
| `anymouse-visits` | localStorage | Integer, incremented once per `init()` |
| `anymouse-used` | localStorage | `'1'` once a note has been saved |
| `anymouse-repulsed` | localStorage | `'1'` once the one-off re-pulse has fired |
| `anymouse-streak` | localStorage | JSON `{ weekKey, count }` weekly save count |
| `anymouse-hint-<match>` | localStorage | `'1'` per contextual-hint pattern already shown |
| `anymouse-idle-shown` | sessionStorage | `'1'` once the idle nudge fired this session |

**`categories[].icon` — trust boundary.** Each category's `icon` is raw
SVG/HTML injected as-is into the DOM (`innerHTML`). It is treated as **trusted
integrator input** — the host application controls the config, so the icon
markup is not sanitized. Do not pass untrusted/user-supplied strings as `icon`.

### Note payload

The object passed to `save(note)`:

```js
{
  content: string,        // the trimmed note text
  category: string,       // active category id
  tags: string[],         // [category]
  context: object | null, // present only when captureContext is true
  createdAt: string,      // ISO 8601 timestamp
}
```

The `context` shape (when `captureContext: true`):

```js
{
  url: string,        // location.href
  title: string,      // document.title
  selection: string,  // current window text selection
}
```

### Reserved (not yet implemented)

These keys are accepted (no warning) but currently no-ops. Reserved for future
work:

- `reducedMotion` — drag uses its own `matchMedia` today.
- `theme` — `{ accent, surface, text, radius }`.
- `modes` — future `'ask'` chatbot mode.
- `fetchNotes` — future notes-feed feature.

## Placement

`position` picks the corner the button parks in. A corner is one of
`'top-right'`, `'top-left'`, `'bottom-right'`, `'bottom-left'`.

```js
position: 'bottom-left'                      // everywhere
position: { mobile: 'bottom-right' }         // top-right on desktop, bottom-right ≤768px
position: { default: 'top-left', mobile: 'bottom-left', mobileMaxWidth: 640 }
```

- `default` — the corner on wide viewports.
- `mobile` — the corner while `(max-width: mobileMaxWidth px)` matches. `null`
  means "same as `default`". Switching is live: resizing across the breakpoint
  re-parks the button.
- `mobileMaxWidth` — the breakpoint in px (default `768`).

Invalid values warn and fall back (an invalid `mobile` falls back to `default`).

How it works: the module tags `#anymouse-root` with `data-anymouse-v`
(`top`/`bottom`) and `data-anymouse-h` (`left`/`right`), and `styles.css` keys
off those — the corner insets (`--anymouse-edge`, 24px, or 12px at ≤480px, plus
the safe-area inset for bottom corners), which side the coachmark bubble opens
on (above the button for bottom corners, left-aligned for left corners), and the
scroll-duck (bottom corners shrink and fade in place instead of sliding down).
The capture panel already picks its side at open time from the button's
on-screen position.

`anchor` only applies to top corners. A user-dragged position is persisted as
inline `top`/`left` and overrides the corner until `resetPosition()`.

## defaultSave

When no custom `save` is supplied, Anymouse POSTs to
`{apiBase}/api/member/notes` with `credentials: 'include'`. It sends an
`x-member-email` header **only when the user has a real email** (never the
literal string `"null"`). Body:

```js
{
  action: 'add',
  targetType: 'company',
  targetId: 'quick-note',
  content: note.content,
  title: categoryTitle(note.category), // e.g. "Quick Note" / "New Idea"
  tags: note.tags,
  pinned: false,
}
```

A non-OK response throws `Error(data.message || 'Failed to save note')`.

## Controller methods

`Anymouse.init()` returns (and `window.Anymouse` exposes) the controller:

| Method | Description |
| --- | --- |
| `open()` | Open the capture panel. |
| `close()` | Close the panel. |
| `setCategory(id)` | Set the active capture category. |
| `setNotification(on)` | Toggle the button's notification dot. |
| `capture(text, category?)` | Programmatically set text (+ optional category) and save. No-op until mounted. |
| `minimize()` / `expand()` | Collapse / restore the button. |
| `showCoachmark()` | Manually show the coachmark bubble + pulse (handy for hosts / testing). |
| `resetPosition()` | Reset a dragged button to its default position. |
| `destroy()` | Remove the DOM, styles, and all listeners. Resets state so `init()` can remount cleanly. |
| `isMounted()` | Whether the widget is currently mounted. |

`init()` is idempotent — calling it again while already mounted is a no-op (no
duplicate root, no double-bound listeners).

## Hotkeys

- **Double-tap `Shift`** (within ~400ms) launches the widget. Enabled by default.
- **Single key `a`** launches it — but only when not typing in an editable field,
  not focused inside the widget, and with no modifier keys held. Configurable via
  `hotkeys.singleKey`.
- `Escape` closes an open panel.
- **`Cmd/Ctrl-K` is intentionally NOT used** — Ghost's built-in search owns that
  shortcut globally.

## Build

There is no separate build. `js/anymouse-init.js` imports `./anymouse/anymouse.js`
and Vite bundles the module graph with the rest of mc_site (`npm run build`).
`styles.css` is imported with Vite's `?raw` suffix so it arrives as a string and
is injected at runtime as `<style id="anymouse-styles">`, exactly as the original
esbuild text loader did. The source is linted by `npm run lint` like everything
else under `js/`.
