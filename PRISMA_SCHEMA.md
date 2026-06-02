# Prisma Schema — Intern·vention

Derived directly from `src/store.jsx` (`IV_DEFAULT` + mutations) and `src/data.js`.
Copy into `prisma/schema.prisma`, adjust provider, then `npx prisma migrate dev`.

```prisma
generator client { provider = "prisma-client-js" }
datasource db { provider = "postgresql"; url = env("DATABASE_URL") }

// ── Identity ────────────────────────────────────────────────
// email is stored ONLY to dedupe SUNet accounts. Never expose it
// outside the owner's own session.
model User {
  id          String   @id @default(cuid())
  email       String   @unique          // @stanford.edu, dedupe only
  username    String   @unique          // public handle "u/<username>"
  realName    String?                   // from Google; shown only if visibility.name
  createdAt   DateTime @default(now())

  // profile (set at sign-up; see degrees JSON below)
  profileSet  Boolean  @default(false)
  major       String?
  gradYear    String?                   // "2026" … or "Already graduated"
  gpa         String?                   // bucket, "" once graduated
  degrees     Json?                     // { degrees:[...], bachelors:{major,major2,minor,gpa,gradYear}, coterm, masters, phd }
  confirmedYear Int?                    // last year profile was confirmed

  // identity visibility (opt-in)
  showName    Boolean  @default(false)
  flairs      Json     @default("[]")   // ["co:openai","major:Computer Science","year:2026"]

  isAdmin     Boolean  @default(false)

  contributions Contribution[]
  posts         Post[]
  comments      Comment[]
  votes         Vote[]
  pollVotes     PollVote[]
  follows       Follow[]
  notifications Notification[] @relation("recipient")
  companyRequests CompanyRequest[]
}

// ── Companies ───────────────────────────────────────────────
model Company {
  slug      String   @id
  name      String
  industry  String                       // tech|finance|consulting|quant|startups|design
  domain    String?                      // for logo.dev
  bg        String?                      // tile color
  status    CompanyStatus @default(APPROVED)
  createdBy String?
  createdAt DateTime @default(now())

  contributions Contribution[]
  posts         Post[]   @relation("companyScope")
  follows       Follow[]
}
enum CompanyStatus { PENDING APPROVED REJECTED }

model CompanyRequest {
  id        String   @id @default(cuid())
  name      String
  slug      String
  industry  String
  website   String?
  note      String?
  status    CompanyStatus @default(PENDING)
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())
  reviewedAt DateTime?
}

// ── Contributions (the give-to-get unit) ────────────────────
model Contribution {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id])
  companySlug   String
  company       Company  @relation(fields: [companySlug], references: [slug])

  role          String
  cycle         String                  // "2025–26" …
  platform      String?                 // What platform did you use to apply
  hadReferral   Boolean  @default(false)
  referralSource String?                // if hadReferral: club/coffee chat/cold email/…
  comp          String?                 // bucket "$8–10k/mo · ~$96–120k/yr"
  techRounds    Int      @default(0)
  behavioralRounds Int   @default(0)
  applied       String?                 // "Sept 2025"
  offerMonth    String?                 // "Nov 2025"
  advice        String?  @db.Text       // "what's not on your LinkedIn" — unlimited

  // denormalized snapshot of the contributor's profile at submit time
  major         String?
  classYear     String?                 // Sophomore|Junior|Senior|Coterm
  gpa           String?

  createdAt     DateTime @default(now())
  @@index([companySlug, cycle])
}

// ── Community: posts / comments / votes ─────────────────────
// scope: "__main__" | "ind:<industry>" | "<companySlug>"
model Post {
  id          String   @id @default(cuid())
  scope       String
  companySlug String?
  company     Company? @relation("companyScope", fields: [companySlug], references: [slug])
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  flair       String                    // question|poll|vent|success|tips|discussion|update
  title       String
  body        String?  @db.Text
  poll        Json?                     // { options:[{label,pct}], total, daysLeft }
  edited      Boolean  @default(false)
  createdAt   DateTime @default(now())
  comments    Comment[]
  @@index([scope, createdAt])
}

model Comment {
  id        String   @id @default(cuid())
  postId    String
  post      Post     @relation(fields: [postId], references: [id])
  parentId  String?                      // self-ref for nested replies
  parent    Comment? @relation("replies", fields: [parentId], references: [id])
  replies   Comment[] @relation("replies")
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  body      String   @db.Text
  edited    Boolean  @default(false)
  createdAt DateTime @default(now())
}

// one row per user per target → enforces single vote
model Vote {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  targetType VoteTarget                  // POST | COMMENT
  targetId  String
  dir       Int                          // 1 | -1
  @@unique([userId, targetType, targetId])
}
enum VoteTarget { POST COMMENT }

model PollVote {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  postId    String
  optionIdx Int
  @@unique([userId, postId])
}

model Follow {
  id          String  @id @default(cuid())
  userId      String
  user        User    @relation(fields: [userId], references: [id])
  companySlug String
  company     Company @relation(fields: [companySlug], references: [slug])
  @@unique([userId, companySlug])
}

// ── Notifications (reply→alert→return loop) ─────────────────
model Notification {
  id          String   @id @default(cuid())
  recipientId String
  recipient   User     @relation("recipient", fields: [recipientId], references: [id])
  type        String                     // reply|award|upvote|newpost|newcontrib|badge|tier
  actor       String?                    // username of who triggered it
  title       String
  body        String?
  scope       String?
  postId      String?
  slug        String?
  read        Boolean  @default(false)
  createdAt   DateTime @default(now())
  @@index([recipientId, read])
}
```

## Notes
- **Karma / Mentor Points are NOT a column.** Compute on read exactly like `computeKarma` in `store.jsx`: `120*contributions + 15*posts(+upvotes) + 8*comments + awards`. Use a SQL view or a service function. See `AGGREGATIONS.md`.
- **Awards** in the prototype just bump `bonusKarma` client-side. In production model an `Award` table (giverId, targetId) if you want them persisted; otherwise fold into Notification + a karma delta.
- **`badges`** (Verified, Mentor, OG, Top 1%, Storyteller…) are **derived** from karma + contribution facts, not stored. Logic is in `store.jsx > myBadges()` and `karma.jsx`.
- The prototype's `editedPosts/editedComments/deletedComments` maps are just because seed data was immutable client-side — in Postgres you mutate/soft-delete rows directly, so drop those maps.
- `flairs` values are typed strings: `co:<slug>`, `major:<Major>`, `year:<gradYear>` — render via `IV.flairLabel()` logic in `data.js`.
