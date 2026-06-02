# Design Tokens — Intern·vention

Pulled from `styles.css` `:root`. The prototype themes `--accent`, `--head-font`,
`--radius` at runtime via the Tweaks panel — in production, hardcode the Stanford
Cardinal defaults below (drop the Tweaks runtime theming).

## Colors
| Token | Value | Use |
|---|---|---|
| `--accent` | `#8C1515` | Stanford Cardinal — primary, links, active states |
| `--accent-soft` | `color-mix(accent 7%, #fff)` | tinted backgrounds |
| `--accent-soft-2` | `color-mix(accent 12%, #fff)` | chips, badges |
| `--accent-line` | `color-mix(accent 24%, #fff)` | tinted borders |
| `--accent-strong` | `color-mix(accent 82%, #000)` | hover on cardinal buttons |
| `--bg` | `#FFFFFF` | page background |
| `--surface` | `#FAFAF9` | cards, inputs |
| `--surface-2` | `#F4F4F2` | tracks, secondary fills |
| `--border` | `#E7E5E0` | hairlines |
| `--border-strong` | `#D4D2CC` | input borders |
| `--text` | `#1A1A18` | primary text |
| `--text-2` | `#57544D` | secondary |
| `--text-3` | `#908C82` | tertiary / meta |
| `--green` | `#2F7D32` | success, "offer", verified |
| `--amber` | `#B45309` | warnings, pending, "final round" |
| `--reddit-orange` | `#FF4500` | upvote |
| `--reddit-blue` | `#4A90E2` | downvote |

Flair/scope chip colors are inline in `feed.jsx` / `styles.css` (`.flair-*`,
`.scope-chip.k-*`) — copy verbatim.

## Typography
- **Headings** (`--head-font`): `"Iowan Old Style", "Charter", Georgia, serif` — the
  editorial serif used for company names, h1/h2, stat numbers.
- **Body**: system stack — `-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", system-ui, sans-serif`.
- **Mono**: `"JetBrains Mono", ui-monospace, Menlo` — for `u/handle` context, URLs, kbd.
- Google fonts loaded in `Intern-vention.html` head: **Spectral**, **Space Grotesk**,
  **JetBrains Mono** (Spectral/Grotesk were Tweaks alternates — only needed if you keep theming).
- Base size 14px, line-height 1.5.

## Radius / spacing
- `--radius: 10px` (cards). Pills use `14–18px`. Avatars/logos `6–12px`.
- Page padding `28px` (compact 20 / comfy 40 — drop if not keeping density Tweak).
- Standard gaps: `8px` between posts, `10–14px` between cards.

## Shadows
- Cards: borders only, no shadow at rest. Hover (playful): `0 4px 14px rgba(0,0,0,.05)`.
- Menus/popovers: `0 8px 26px rgba(0,0,0,.1)`.
- Modals: `0 24px 60px rgba(0,0,0,.22)`.

## Logos
Real company logos via **logo.dev**: `https://img.logo.dev/<domain>?token=<pk>`.
The prototype's token is a public publishable key in `components.jsx`
(`LOGO_DEV_TOKEN`). Fallback chain: logo.dev → Google favicon → colored monogram
(letter on `company.bg`). Keep this fallback in the `<Logo>` component.

## Drop in production
The Tweaks panel (`tweaks-panel.jsx`) and its runtime CSS-var theming, density
classes, and "playful" toggle are **prototype-only** — ship the defaults above and
remove the panel.
