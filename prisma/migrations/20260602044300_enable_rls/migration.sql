-- Defense-in-depth. Clients never hit Postgres directly: all access goes through
-- Next.js server code via Prisma's privileged role, which bypasses RLS. Enabling RLS
-- with NO policies denies the anon/authenticated PostgREST roles entirely, so the
-- auto-generated REST API exposes nothing (esp. User.email). Satisfies the security
-- advisor (no rls_disabled_in_public). App-layer guards remain the real enforcement.
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Company" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CompanyRequest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Contribution" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Post" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Comment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Vote" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PollVote" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Follow" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
