# Aggregations — the n≥5 stats + Mentorboard math

All numbers shown to users are computed from `Contribution` rows. The prototype
synthesizes them (`data.js`); in production they're SQL aggregates. **Withhold any
group with fewer than 5 contributions.**

## Company cohort report (`/api/companies/[slug]/report`)
Reference UI: `src/company.jsx`. For a company + optional filters (role, major,
class year, GPA):

- **Stanford majors pie** — `GROUP BY major HAVING count(*) >= 5`, as % of total.
- **How they got in (% of all answers)** — `GROUP BY platform` (or referralSource),
  share of contributions.
- **Median GPA** — mode of `gpa` buckets.
- **Median compensation** — median bucket of `comp`.
- **Apply-vs-offer timeline** — two series: count by `applied` month, count by
  `offerMonth` month. (UI: grouped bar chart.)
- **Interview rounds** — `avg(techRounds)`, `avg(behavioralRounds)` → rounded medians.
- **"What's not on your LinkedIn" advice** — list of `advice` text from contributions,
  newest first; each links to the company's community thread. Flair = "Contributor Advice".

Guard:
```sql
SELECT major, count(*) FROM "Contribution"
WHERE "companySlug" = $1
GROUP BY major HAVING count(*) >= 5;
```

## Karma / Mentor Points (computed, never stored)
Mirror `computeKarma` in `store.jsx`:
```
points(user) =
    120 * (# contributions)
  +  15 * (# posts)  + (sum of net upvotes on their posts)
  +   8 * (# comments + # replies)
  +  awards received * 5
```
Tiers (`karma.jsx > TIERS`): Lurker 0 / Contributor 120 / Regular 350 / Mentor 800 / Legend 2000.

## Badges (derived)
From `store.jsx > myBadges()`: `verified` (signed in + ≥1 contribution),
`senior` (grad year), `storyteller` (wrote advice), `starter` (≥1 post),
`mentor` (karma ≥ 200), plus `offer`/`og`/`top` for seeded mentors. Compute on read.

## Mentorboard (`/api/mentorboard`) — reference `src/mentorboard.jsx`
Three tabs:

1. **Mentorship cultures** (companies) — rank by **contribution count**.
   - Default = absolute volume, filterable by industry.
   - **Per-capita toggle** = `contributions / alumniBase * 100` ("give-back rate") so
     small firms can rank. `alumniBase` is real headcount data you'll need a source for;
     the prototype synthesizes it in `data.js > alumniBase`.
   - Culture tier from count: Emerging ≥1 / Growing ≥10 / Strong ≥20 / Exceptional ≥30.
2. **Who gives back** (cohorts) — `contributionsByMajor()` and `contributionsByGradYear()`:
   `GROUP BY major` / `GROUP BY classYear ORDER BY count DESC`.
3. **Top mentors** (people) — users ranked by computed karma. Anonymous `u/handle`
   unless they opted into `showName` / company flair.

## Search + directory filters (`/api/search`)
Reference `src/directory.jsx`. Free-text matches company name / role / industry.
Filters (all AND): **track** (intern/newgrad/fulltime, inferred from role name),
**industry**, **cycle**, **major**, **degree** (single), **grad year** (multi),
**min comp**. Degree + grad year must describe the *same* contributor cohort
(in real data this is automatic — they're columns on the same `Contribution` row;
the prototype had to fake the correlation, you don't).
