# API — endpoint inventory

Each store mutation in `src/store.jsx` becomes a route (or server action).
RSC reads can query Prisma directly; mutations go through these. **Gating column**
= what must be enforced server-side before the handler runs.

| Method · Route | From store method | Gating |
|---|---|---|
| `GET /api/me` | `state.auth`, `profile`, `visibility` | session |
| `POST /api/profile` | `setProfile` | session |
| `POST /api/profile/confirm` | `confirmProfile` | session |
| `POST /api/username` | `setUsername` (onboarding) | session; unique |
| `POST /api/visibility` | `setVisibility`, `toggleFlair` | session |
| `GET /api/companies` | `IV.companies` (APPROVED only) | public |
| `GET /api/companies/[slug]` | `getCompany` + headline stats | public (headline); **unlocked** for full report |
| `GET /api/companies/[slug]/report` | majors/channels/referral/rounds/advice | **unlocked** + n≥5 |
| `POST /api/companies/request` | `requestCompany` | session |
| `POST /api/admin/companies/[id]/review` | `reviewCompanyRequest` | **admin** |
| `POST /api/contributions` | `contribute` | session → sets unlocked |
| `PATCH /api/contributions/[id]` | `editContribution` | owner |
| `DELETE /api/contributions/[id]` | `removeContribution` | owner |
| `GET /api/feed?scope=` | `getPosts(scope)` + user posts | **unlocked** to read |
| `POST /api/posts` | `addPost` | **unlocked** → also schedule notifications |
| `PATCH /api/posts/[id]` | `editPost` | owner |
| `DELETE /api/posts/[id]` | `deletePost` | owner |
| `POST /api/posts/[id]/vote` | `votePost` | **unlocked**; upsert Vote (unique) |
| `POST /api/posts/[id]/poll` | `votePoll` | **unlocked**; one PollVote |
| `POST /api/posts/[id]/comments` | `addComment` | **unlocked** → notify post author |
| `POST /api/comments/[id]/replies` | `addReply` | **unlocked** → notify parent author |
| `PATCH /api/comments/[id]` | `editComment` | owner |
| `DELETE /api/comments/[id]` | `deleteComment` | owner |
| `POST /api/comments/[id]/vote` | `voteComment` | **unlocked**; upsert Vote |
| `POST /api/companies/[slug]/follow` | `toggleFollow` | session |
| `GET /api/mentorboard?tab=&industry=&perCapita=` | `mentorshipBoard`, mentors | public |
| `GET /api/notifications` | `alerts()` | session |
| `POST /api/notifications/read` | `markAlertRead`, `markAllAlertsRead` | owner |
| `GET /api/search?q=&track=&industry=&degree=&grad=&major=&comp=` | `search` + directory filters | public (results), gated content on click |

## Gating helper (use everywhere)
```ts
async function requireUnlocked() {
  const s = await auth();
  if (!s?.user) throw 401;
  const n = await prisma.contribution.count({ where: { userId: s.user.id } });
  if (n < 1) throw 403; // verified but not unlocked
  return s.user;
}
```

## The reply→notification loop (real version)
The prototype *simulates* inbound replies (`scheduleInboundReply`). In production
**delete that simulation** — instead, when a real comment/reply is created:
```ts
// after creating the comment:
const target = parentId ? parentComment : post;
if (target.userId !== me.id) {
  await prisma.notification.create({ data: {
    recipientId: target.userId, type: "reply", actor: me.username,
    title: parentId ? "replied to your comment" : "replied to your post",
    body: `"${body.slice(0,120)}"`, scope, postId,
  }});
}
```
Same pattern for upvote milestones, awards, and new posts in followed companies.

## Launch mode
The prototype's `launchMode` (Tweaks → "Fresh launch") hides all seeded demo data.
In production this is simply the **natural empty state** — ship with companies seeded
but zero contributions/posts, and every "no data yet / be the first" empty state in
the prototype is already designed. No flag needed.
