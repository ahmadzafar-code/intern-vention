# Screens — UI spec

Every screen exists as a working `.jsx` file in this bundle (high-fidelity). Port
each to a Next.js route; markup + classNames stay identical, only `useStore()` →
`fetch`/server-action. Routes below mirror the prototype's hash router (`app.jsx`).

| Route | File | Purpose |
|---|---|---|
| `/` (directory) | `directory.jsx` | Hero, free search + filter row, company grid, cycle-pass banner, "Top mentorship cultures", contribute CTA |
| `/company/[slug]` | `company.jsx` | Headline stats (majors pie, how-they-got-in, median GPA/comp) free; full cohort report gated; community sidebar thread |
| `/community/[scope]` | `community.jsx` | Full forum: left rail (company + industry forums), center feed, right rail (karma card, Mentorboard, about) |
| `/thread/[scope]/[postId]` | `thread.jsx` | Post detail, nested comments + replies, edit/delete own |
| `/contribute` | `contribute.jsx` | Company picker (step 1) |
| `/contribute/[slug]` | `contribute.jsx` | The contribution form (see below) |
| `/mentorboard` | `mentorboard.jsx` | 3 tabs: cultures / who-gives-back / top mentors |
| `/me` (contributions) | `contributions.jsx` | Profile, Mentor Points, identity+flairs, your contributions (edit/delete), company requests, footprint |
| `/alerts` | `alerts.jsx` | Notifications feed, grouped, mark-read |
| sign-in modal | `auth.jsx` | Google → username → profile (degrees) |
| ⌘K | `search.jsx` | Command palette: companies, forums, posts |

## The contribution form (current spec — `contribute.jsx`)
This changed a lot; build it exactly as the file shows. Sections, in order:

1. **The role** — Role (select, with "+ Add a different role" → free text that creates
   a new role for that company), Cycle (`2025–26` default, back to `2022–23`),
   Compensation (8 monthly buckets each with yearly equivalent, e.g.
   "$8–10k/mo · ~$96–120k/yr", up to "$16k+/mo · $192k+/yr").
2. **How you applied** —
   - "What platform did you use to apply?" (Company website / Handshake / LinkedIn /
     Career fair / Cold email / Other→freetext).
   - **Referral** subsection: "Did you have a referral?" Yes/No. If Yes →
     "How did you get the referral?" (Stanford student club / Coffee chat / Cold email /
     LinkedIn cold outreach / Previous workplace / Research lab / Professor / Friend /
     Classmate / Other→freetext).
   - **Interview rounds**: Technical + Behavioral steppers (behavioral can be 0).
   - **Timeline**: Applied month → Final offer received month.
3. **What's not on your LinkedIn that helped you get this job?** — textarea, **no char
   limit**, with 4 guiding bullets shown above it (resources used to prepare /
   networking tips / Stanford-specific advice / the make-or-break moment).

Profile (major / grad year / GPA) is **NOT asked here** — it's captured at sign-up
and attached automatically (shown as a meta line). **No "what mattered most"**, **no
"prior experience"** — those were removed.

## Gating UI (locked vs unlocked)
- **Locked** (signed out OR 0 contributions): company headline stats visible; full
  report + threads show blurred preview behind a `LockCard` ("Contribute to unlock").
  Community composer/vote/reply disabled.
- The contribute route itself requires sign-in first (`ContributeSignInGate`).

## States to implement (all designed in the files)
- Empty / fresh-launch states (no reports yet, be the first) — `directory.jsx`, `company.jsx`
- Company pending-review banner — `contribute.jsx`, `contributions.jsx`
- Profile yearly re-confirm banner — `contributions.jsx`
- Toasts, confetti on unlock — `components.jsx`
- Responsive ≤640px rules — end of `styles.css`

## What to drop from the prototype
- `tweaks-panel.jsx` + Tweaks theming, `launchMode` flag (it's just the real empty state),
  the simulated-inbound-reply timer in `store.jsx` (replace with real notifications),
  and the `gradToYear`/synthesized-cohort fakery in `directory.jsx` (real columns make it exact).
