import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { FollowButton } from "@/components/company/FollowButton";
import { getCompany, getCompanyRoles } from "@/lib/queries/companies";
import { cohortReport, MIN } from "@/lib/queries/report";
import { Logo } from "@/components/primitives/Logo";
import { Icon } from "@/components/primitives/Icon";
import { CompanyControls } from "@/components/company/CompanyControls";
import { MajorPie, ChannelDonut, TimingChart, RoundsBreakdown } from "@/components/company/Charts";
import { LockCard } from "@/components/company/LockCard";

const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);
const str = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function CompanyPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  const company = await getCompany(slug);
  if (!company || company.status !== "APPROVED") notFound(); // pending companies are not public

  const filters = {
    role: str(sp.role) || "All roles",
    major: str(sp.major) || "All",
    year: str(sp.year) || "All",
    gpa: str(sp.gpa) || "All",
  };

  // One auth() call, and the unlock-count + roles + total + follow all run in parallel
  // (cohortReport needs `unlocked`, so it follows). Co-located with the DB this is fast.
  const session = await auth();
  const userId = session?.user?.id ?? null;
  const [unlockedCount, roles, total, follow] = await Promise.all([
    userId ? prisma.contribution.count({ where: { userId } }) : Promise.resolve(0),
    getCompanyRoles(slug, company.industry),
    prisma.contribution.count({ where: { companySlug: slug } }),
    userId ? prisma.follow.findUnique({ where: { userId_companySlug: { userId, companySlug: slug } }, select: { id: true } }) : Promise.resolve(null),
  ]);
  const unlocked = unlockedCount >= 1;
  const following = follow !== null;
  const report = await cohortReport(slug, filters, unlocked);

  return (
    <main className="main" style={{ maxWidth: 1180, margin: "0 auto", padding: "var(--page-pad)" }}>
      <div className="page-url">
        <Icon name="lock" size={12} />
        <code>
          iv.stanford.edu / <strong>{company.name.toLowerCase().replace(/[^a-z]/g, "")}</strong>
        </code>
      </div>

      <header className="company-header">
        <Logo company={company} size={56} radius={12} />
        <div className="company-info">
          <h1>{company.name}</h1>
          <div className="company-meta">
            <span>{cap(company.industry)}</span>
            {total > 0 && (
              <>
                <span className="pip" />
                <span>{total} report{total === 1 ? "" : "s"}</span>
              </>
            )}
            <span className="pip" />
            <span>{roles.length} roles tracked</span>
          </div>
        </div>
        <div className="company-actions" style={{ display: "flex", gap: 10, flexShrink: 0, alignItems: "center" }}>
          <Link href={`/contribute/${slug}`} className="follow-btn" style={{ background: "var(--accent)", color: "#fff", borderColor: "var(--accent)" }}>
            + Contribute
          </Link>
          <FollowButton slug={slug} following={following} />
        </div>
      </header>

      <CompanyControls roles={roles} current={filters} />

      {report.withheld ? (
        <div className="company-launch-empty">
          <div className="cle-icon">
            <Icon name="sparkle" size={24} />
          </div>
          <h2>{report.n === 0 ? `No reports for ${company.name} yet` : `Not enough reports yet — ${report.n} of ${MIN}`}</h2>
          <p>
            {report.n === 0
              ? `This company is live in the directory, but no one has contributed a ${company.name} recruiting story for this filter yet. Be the first — your report starts the cohort data and unlocks the community.`
              : `Aggregates stay hidden until ${MIN} contributions match, so no single person is identifiable. Be early — your story helps cross the line.`}
          </p>
          <Link className="primary-btn" href={`/contribute/${slug}`}>
            {report.n === 0 ? "Be the first to contribute →" : "Contribute →"}
          </Link>
        </div>
      ) : (
        <>
          <div className="free-tag">
            <Icon name="check-circle" size={12} /> Free preview · headline stats
          </div>
          <section className="headline">
            <div className="headline-pie card">
              <div className="chart-head">
                <h2>Stanford majors</h2>
                <span className="small-meta">n={report.n}</span>
              </div>
              <MajorPie majors={report.majors} />
            </div>
            <div className="headline-stats">
              <div className="hstat">
                <div className="label">How they got in</div>
                <div className="value">{report.topChannel.label}</div>
                <div className="sub">{report.topChannel.pct}% of all answers</div>
              </div>
              <div className="hstat">
                <div className="label">Median GPA</div>
                <div className="value">{report.medianGpa}</div>
                <div className="sub">most common bucket</div>
              </div>
              <div className="hstat">
                <div className="label">Median compensation</div>
                <div className="value">{report.medianComp}</div>
                <div className="sub">self-reported</div>
              </div>
            </div>
          </section>

          <section className="hero-chart">
            <div className="chart-head">
              <h2>When they applied vs. got the offer</h2>
              <span className="timing-legend">
                <span className="tl-item"><span className="tl-sw apply" />Applied</span>
                <span className="tl-item"><span className="tl-sw offer" />Offer received</span>
              </span>
            </div>
            <TimingChart applied={report.timing.applied} offer={report.timing.offer} />
          </section>

          {unlocked && report.full ? (
            <>
              <div className="report-divider">
                <span>The full cohort report</span>
              </div>
              <div className="grid-2">
                <RoundsBreakdown rounds={report.full.rounds} />
                <div className="card">
                  <div className="chart-head">
                    <h2>How they got in</h2>
                    <span className="small-meta">% of all answers · n={report.n}</span>
                  </div>
                  <ChannelDonut channels={report.full.channels} />
                </div>
              </div>

              <div className="section-head">
                <h2>What&apos;s not on your LinkedIn that helped you get in</h2>
                <span className="meta">Stanford-specific advice from contributors</span>
              </div>
              <div className="advice-grid">
                {report.full.advice.length === 0 ? (
                  <p className="csec-sub">No written advice yet for this cohort.</p>
                ) : (
                  report.full.advice.map((a, i) => (
                    <div className="advice contributor" key={i}>
                      <div className="advice-head">
                        <span className="flair flair-advice">★ Contributor Advice</span>
                        <span className="advice-role">{a.role}</span>
                      </div>
                      <p className="advice-body">{a.body}</p>
                      <div className="advice-foot">
                        <span className="advice-when">{a.cycle}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="locked-report">
              {/* Decorative placeholder ONLY — the real full-report data is never fetched
                  or sent to locked clients (cohortReport returns full=null when locked). */}
              <div className="locked-report-content" aria-hidden="true">
                <div className="report-divider">
                  <span>The full cohort report</span>
                </div>
                <div className="grid-2">
                  <RoundsBreakdown rounds={{ technical: 3, behavioral: 1 }} />
                  <div className="card">
                    <div className="chart-head">
                      <h2>How they got in</h2>
                      <span className="small-meta">% of all answers</span>
                    </div>
                    <ChannelDonut channels={[{ label: "Referral", pct: 52 }, { label: "Company website", pct: 28 }, { label: "Career fair", pct: 12 }, { label: "Cold email", pct: 8 }]} />
                  </div>
                </div>
              </div>
              <LockCard
                heading="Unlock the full cohort report"
                body={`See how they got in, interview rounds, and every contributor's playbook for ${company.name}.`}
                slug={slug}
              />
            </div>
          )}
        </>
      )}
    </main>
  );
}
