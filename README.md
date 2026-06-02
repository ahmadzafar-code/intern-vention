# Intern·vention — Claude Code Handoff

Turn the **Intern·vention** prototype into a deployed full-stack app.

> **What this bundle is:** The HTML/JSX files here are a **fully-working design + behavior reference** — a client-side React prototype where `localStorage` stands in for the backend. They are *not* the production codebase. Your job: **recreate this exact UI and behavior in a real Next.js app** backed by the Supabase Postgres database the owner has already provisioned, reusing the prototype's components and CSS nearly verbatim.

The prototype is **high-fidelity** — final colors, type, spacing, copy, and interactions. Recreate the UI pixel-for-pixel; only the data layer changes.

---

## What's already set up (do NOT redo)
The project owner has already configured:
- **Supabase** project (Postgres + connection string)
- **Google OAuth** credentials (client ID + secret), intended for Stanford SUNet sign-in

You will consume these via env vars (see `ENV.md`). Assume they exist.

---

## Target stack
| Layer | Choice | Notes |
|---|---|---|
| Framework | **Next.js** (App Router, TypeScript) | One repo, API routes + RSC |
| DB | **Supabase Postgres** | already provisioned |
| ORM | **Prisma** | schema in `PRISMA_SCHEMA.md` |
| Auth | **Auth.js (NextAuth v5)** Google provider | **must hard-enforce `@stanford.edu`** |
| Hosting | **Vercel** | `git push` deploy |

If you (the developer) prefer Drizzle/Kysely over Prisma, the schema in `PRISMA_SCHEMA.md` translates directly — the table shapes are what matter.

---

## The core product model (read this first)
Intern·vention is a **give-to-get, anonymous-but-verified** recruiting-intelligence platform for Stanford students.

Three invariants drive every screen — preserve them exactly:

1. **Verified but anonymous.** Users sign in with Google **restricted to `@stanford.edu`**. The email is stored **only to dedupe accounts** (one per SUNet). Everywhere else, users are an opaque `userId` → a self-chosen `username` (`u/handle`). The email must never appear in any API response other than the user's own session.

2. **Give-to-get unlock.** A user is `unlocked` only when **signed in AND has ≥1 contribution**. Locked users see headline stats + blurred previews but cannot read full cohort reports, read threads, post, vote, or comment. Gating is enforced **server-side**, not just in the UI.

3. **n ≥ 5 aggregation.** Any aggregate shown (majors pie, comp medians, channel/referral breakdown, interview-round medians) must be computed over **≥ 5 contributions** or it is withheld. This is a privacy guarantee — enforce it in the query layer.

---

## Source-of-truth files in this bundle
The prototype's "backend" is two files — translate these, don't reinvent:

| File | What it defines | Maps to |
|---|---|---|
| `src/store.jsx` | `IV_DEFAULT` state shape + every mutation (`contribute`, `votePost`, `addComment`, `requestCompany`, `reviewCompanyRequest`, `signIn`, `setProfile`, `toggleFlair`…) and `computeKarma` | **DB schema + API routes** |
| `src/data.js` | Seed companies, industries, factors, advice, alerts, the Stanford major/degree lists, and all aggregation helpers (`mentorshipBoard`, `contributionsByMajor`, `giveBackRate`, `search`…) | **`prisma/seed.ts` + SQL aggregate queries** |

Everything else (`src/components.jsx`, `feed.jsx`, `thread.jsx`, `company.jsx`, `community.jsx`, `mentorboard.jsx`, `contribute.jsx`, `directory.jsx`, `alerts.jsx`, `karma.jsx`, `contributions.jsx`, `search.jsx`, `auth.jsx`, `app.jsx`, `styles.css`) is **UI to port to Next.js components** — see `SCREENS.md`.

---

## Implementation order (suggested)
1. **Scaffold** — `create-next-app` (TS, App Router), copy `styles.css` into `app/globals.css`, pull in the Google fonts from `Intern-vention.html`'s `<head>`.
2. **Prisma schema** — from `PRISMA_SCHEMA.md`; `prisma migrate dev`; point `DATABASE_URL` at Supabase.
3. **Auth** — Auth.js Google provider with the `@stanford.edu` enforcement (see `AUTH.md`). Session = `{ userId, username, unlocked }`.
4. **Seed** — port `src/data.js` companies/industries/factors into `prisma/seed.ts`. (Posts/advice are demo-only; seed a slim set or none.)
5. **API routes** — one per store mutation; full inventory in `API.md`.
6. **Port screens** — convert each `.jsx` view to a Next.js route/component, swapping `useStore()` calls for `fetch`/server-actions. UI markup + classNames stay identical.
7. **Admin** — company-request review queue gated to admin userIds (`reviewCompanyRequest`).
8. **Deploy** — Vercel + env vars from `ENV.md`.

---

## Companion docs in this folder
- **`PRISMA_SCHEMA.md`** — complete database schema derived from `store.jsx`
- **`API.md`** — every endpoint, mapped from store mutations, with gating rules
- **`AUTH.md`** — the Stanford-only Google OAuth + anonymity contract
- **`SCREENS.md`** — screen-by-screen UI spec (routes, layout, components, states)
- **`AGGREGATIONS.md`** — the n≥5 stats + Mentorboard math as SQL
- **`ENV.md`** — environment variables checklist
- **`DESIGN_TOKENS.md`** — colors, type, spacing, radii pulled from `styles.css`

---

## Non-negotiables checklist
- [ ] Google sign-in rejects any non-`@stanford.edu` address (server-enforced)
- [ ] Email stored only for dedupe; never returned except in own session
- [ ] `unlocked` = signed in AND ≥1 contribution, enforced on every gated route
- [ ] No aggregate rendered with n < 5
- [ ] One vote per user per target (DB unique constraint)
- [ ] New companies enter a **pending** review queue, not the live directory
- [ ] Replying to a user's post/comment creates a notification for them
- [ ] Karma is **computed**, never stored as a mutable column
