/* =========================================================================
   Intern·vention — mock data layer
   Plain JS. Attaches window.IV with all seed data + light generators so the
   prototype behaves like a real (client-side) backend.
   ========================================================================= */
(function () {
  // ---- tiny seeded PRNG (deterministic per company) ----
  function seedFrom(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  function mulberry(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
  const between = (rng, a, b) => a + rng() * (b - a);
  const ibetween = (rng, a, b) => Math.floor(between(rng, a, b + 1));

  // ---------------------------------------------------------------- INDUSTRIES
  const industries = [
    { key: "all", label: "All" },
    { key: "tech", label: "Tech" },
    { key: "finance", label: "Finance" },
    { key: "consulting", label: "Consulting" },
    { key: "quant", label: "Quant" },
    { key: "startups", label: "Startups" },
    { key: "design", label: "Design" },
  ];

  // ---------------------------------------------------------------- COMPANIES
  // logo: "openai" => svg mark, else single-letter monogram
  const companies = [
    { slug: "google", name: "Google", industry: "tech", reports: 47, logo: "G", bg: "#1A1A18", domain: "google.com", trend: 0 },
    { slug: "meta", name: "Meta", industry: "tech", reports: 38, logo: "M", bg: "#1C2B4A", domain: "meta.com", trend: 0 },
    { slug: "openai", name: "OpenAI", industry: "tech", reports: 32, logo: "openai", bg: "#0E0E0C", domain: "openai.com", trend: 5 },
    { slug: "apple", name: "Apple", industry: "tech", reports: 29, logo: "A", bg: "#1A1A18", domain: "apple.com", trend: 0 },
    { slug: "goldman-sachs", name: "Goldman Sachs", industry: "finance", reports: 28, logo: "G", bg: "#26415E", domain: "goldmansachs.com", trend: 4 },
    { slug: "mckinsey", name: "McKinsey", industry: "consulting", reports: 24, logo: "M", bg: "#16324F", domain: "mckinsey.com", trend: 0 },
    { slug: "stripe", name: "Stripe", industry: "tech", reports: 24, logo: "S", bg: "#4B3FA8", domain: "stripe.com", trend: 0 },
    { slug: "microsoft", name: "Microsoft", industry: "tech", reports: 22, logo: "M", bg: "#1A1A18", domain: "microsoft.com", trend: 0 },
    { slug: "jp-morgan", name: "JP Morgan", industry: "finance", reports: 22, logo: "J", bg: "#3A2E1F", domain: "jpmorganchase.com", trend: 0 },
    { slug: "bain", name: "Bain & Co.", industry: "consulting", reports: 21, logo: "B", bg: "#7A1F2B", domain: "bain.com", trend: 0 },
    { slug: "nvidia", name: "Nvidia", industry: "tech", reports: 19, logo: "N", bg: "#1F4D1F", domain: "nvidia.com", trend: 0 },
    { slug: "bcg", name: "BCG", industry: "consulting", reports: 19, logo: "B", bg: "#16453A", domain: "bcg.com", trend: 0 },
    { slug: "morgan-stanley", name: "Morgan Stanley", industry: "finance", reports: 19, logo: "M", bg: "#26415E", domain: "morganstanley.com", trend: 0 },
    { slug: "jane-street", name: "Jane Street", industry: "quant", reports: 18, logo: "J", bg: "#1A1A18", domain: "janestreet.com", trend: 0 },
    { slug: "anthropic", name: "Anthropic", industry: "tech", reports: 18, logo: "A", bg: "#C2502F", domain: "anthropic.com", trend: 3 },
    { slug: "citadel", name: "Citadel", industry: "quant", reports: 16, logo: "C", bg: "#1C3A5E", domain: "citadel.com", trend: 0 },
    { slug: "databricks", name: "Databricks", industry: "tech", reports: 14, logo: "D", bg: "#B5341F", domain: "databricks.com", trend: 0 },
    { slug: "two-sigma", name: "Two Sigma", industry: "quant", reports: 11, logo: "T", bg: "#1A1A18", domain: "twosigma.com", trend: 0 },
    { slug: "cursor", name: "Cursor", industry: "startups", reports: 9, logo: "C", bg: "#1A1A18", domain: "cursor.com", trend: 2 },
    { slug: "ramp", name: "Ramp", industry: "startups", reports: 8, logo: "R", bg: "#1F4D3A", domain: "ramp.com", trend: 0 },
  ];

  // ---------------------------------------------------------------- FACTORS
  // shared list used by Contribute (rank top 3) and "What mattered most"
  const factors = [
    { key: "referral", label: "Referral / alum connection", sub: "Most often via a current employee" },
    { key: "projects", label: "Shipped technical projects", sub: "GitHub, papers, demos — not coursework" },
    { key: "dsa", label: "DSA / LeetCode prep depth", sub: "Median 200+ problems before applying" },
    { key: "pedigree", label: "Prior FAANG / named-startup internship", sub: "Pedigree on the resume" },
    { key: "domain", label: "Domain-specific prep", sub: "ML internals, PyTorch, recent papers" },
    { key: "behavioral", label: "Behavioral / 'why this company' prep", sub: "Charter, mission alignment, depth of interest" },
    { key: "mock", label: "Mock interviews", sub: "Pramp, friends, formal practice" },
    { key: "resume", label: "Resume polish / tailoring", sub: "Per-company customization" },
  ];

  // ---------------------------------------------------------------- ROLES by industry
  const roleSets = {
    tech: [
      { name: "SWE Intern", count: 12 },
      { name: "ML Research Intern", count: 7 },
      { name: "New Grad SWE", count: 8 },
      { name: "Member of Technical Staff", count: 3 },
      { name: "Product Manager", count: 2 },
    ],
    finance: [
      { name: "IB Summer Analyst", count: 11 },
      { name: "S&T Intern", count: 6 },
      { name: "Quant Strat Intern", count: 4 },
      { name: "New Grad Analyst", count: 7 },
    ],
    consulting: [
      { name: "Summer Associate", count: 10 },
      { name: "Business Analyst", count: 8 },
      { name: "Data Science Intern", count: 3 },
    ],
    quant: [
      { name: "Quant Trading Intern", count: 9 },
      { name: "Quant Research Intern", count: 6 },
      { name: "SWE Intern", count: 5 },
    ],
    startups: [
      { name: "SWE Intern", count: 5 },
      { name: "Founding Eng (New Grad)", count: 3 },
      { name: "Product Intern", count: 2 },
    ],
    design: [
      { name: "Product Design Intern", count: 5 },
      { name: "Brand Design Intern", count: 2 },
    ],
  };

  const majorPool = {
    tech: ["Computer Science", "Math + CS", "Symbolic Systems", "EE", "Math"],
    finance: ["Economics", "MS&E", "Math", "Computer Science", "Symbolic Systems"],
    consulting: ["Economics", "MS&E", "Public Policy", "Computer Science", "STS"],
    quant: ["Math", "Computer Science", "Math + CS", "Physics", "Statistics"],
    startups: ["Computer Science", "Symbolic Systems", "Design", "MS&E", "Math + CS"],
    design: ["Design", "Symbolic Systems", "Computer Science", "Art Practice"],
  };

  const years = ["Sophomore", "Junior", "Senior", "Coterm"];

  // ---------------------------------------------------------------- DETAIL generator
  function genTiming(rng, peakIdx) {
    // 12 monthly buckets Aug..Jul; bell-ish around peakIdx
    const arr = [];
    for (let i = 0; i < 12; i++) {
      const d = Math.abs(i - peakIdx);
      let v = Math.max(0, 6 - d * 1.7 + (rng() - 0.5) * 2);
      arr.push(Math.round(v));
    }
    return arr;
  }
  function genPctList(rng, labels, n) {
    const chosen = labels.slice(0, n);
    let raw = chosen.map(() => between(rng, 0.2, 1));
    const sum = raw.reduce((a, b) => a + b, 0);
    let pcts = raw.map((x) => Math.round((x / sum) * 100));
    // fix rounding to 100
    let diff = 100 - pcts.reduce((a, b) => a + b, 0);
    pcts[0] += diff;
    pcts.sort((a, b) => b - a);
    return chosen.map((l, i) => ({ label: l, pct: pcts[i] }));
  }
  function genWhatMattered(rng) {
    const shuffled = [...factors].sort(() => rng() - 0.5);
    const top = shuffled.slice(0, 6);
    let raw = top.map(() => between(rng, 0.3, 1));
    const sum = raw.reduce((a, b) => a + b, 0);
    let pcts = raw.map((x) => Math.round((x / sum) * 100));
    let diff = 100 - pcts.reduce((a, b) => a + b, 0);
    pcts[0] += diff;
    return top
      .map((f, i) => ({ key: f.key, label: f.label, sub: f.sub, pct: pcts[i] }))
      .sort((a, b) => b.pct - a.pct);
  }

  function buildDetail(company) {
    const rng = mulberry(seedFrom(company.slug));
    const roles = roleSets[company.industry] || roleSets.tech;
    const peak = ibetween(rng, 1, 4); // Sept-ish
    const gpaBuckets = ["3.9–4.0", "3.7–3.9", "3.4–3.7"];
    const channelLabels = company.industry === "consulting"
      ? ["Career fair", "Referral", "Online apply", "Cold email"]
      : ["Referral", "Online apply", "Career fair", "Cold email"];
    const techR = ibetween(rng, 2, 4);
    const behavR = ibetween(rng, 1, 2);
    return {
      roles,
      kpis: {
        gpa: pick(rng, gpaBuckets),
        rounds: techR + behavR,
        applyToOffer: `~${ibetween(rng, 3, 8)} weeks`,
        commonYear: pick(rng, ["Junior", "Junior", "Senior", "Sophomore"]),
        comp: pick(rng, ["$7–8k / mo", "$8–10k / mo", "$6–7k / mo", "$10k+ / mo"]),
      },
      rounds: { technical: techR, behavioral: behavR },
      timing: genTiming(rng, peak),
      timingOffer: (() => { const t = genTiming(rng, peak); return t.map((_, i) => Math.round((t[i - 2] || 0) * 0.85)); })(),
      majors: genPctList(rng, majorPool[company.industry] || majorPool.tech, 3),
      channels: genPctList(rng, channelLabels, 3),
      whatMattered: genWhatMattered(rng),
    };
  }

  // ---------------------------------------------------------------- OpenAI rich override
  const openaiDetail = {
    roles: roleSets.tech,
    kpis: { gpa: "3.7–3.9", rounds: 5, applyToOffer: "~5 weeks", commonYear: "Junior", comp: "$11k+ / mo" },
    rounds: { technical: 3, behavioral: 2 },
    timing: [2, 5, 4, 1, 0, 0, 0, 0, 0, 0, 0, 0],
    timingOffer: [0, 0, 2, 4, 3, 1, 0, 0, 0, 0, 0, 0],
    majors: [
      { label: "Computer Science", pct: 75 },
      { label: "Math + CS", pct: 17 },
      { label: "Symbolic Systems", pct: 8 },
    ],
    channels: [
      { label: "Referral", pct: 58 },
      { label: "Online apply", pct: 25 },
      { label: "Career fair", pct: 17 },
    ],
    whatMattered: [
      { key: "referral", label: "Referral / Stanford alum connection", sub: "Most often via a current employee", pct: 29 },
      { key: "projects", label: "Shipped technical projects", sub: "GitHub, papers, demos — not coursework", pct: 22 },
      { key: "dsa", label: "DSA / LeetCode prep depth", sub: "Median 200+ problems before applying", pct: 17 },
      { key: "domain", label: "Domain-specific prep", sub: "ML internals, PyTorch, recent papers", pct: 13 },
      { key: "behavioral", label: "Behavioral / 'why OpenAI' prep", sub: "Charter, mission alignment, depth of interest", pct: 11 },
      { key: "pedigree", label: "Prior FAANG / named-startup internship", sub: "Pedigree on the resume", pct: 8 },
    ],
  };

  // ---------------------------------------------------------------- POSTS
  // Community-thread posts. comments optional.
  const FLAIRS = ["question", "poll", "vent", "success", "tips", "discussion", "update"];

  const openaiPosts = [
    {
      id: "oa1", author: "anon_swe_2027", time: "2h", flair: "question",
      title: "Anyone else still waiting on the OpenAI SWE intern app from early Sept?",
      body: "Applied Sept 3 through their careers page, haven't heard anything yet. Saw on LinkedIn some people got interview invites already. Should I follow up or just wait?",
      votes: 236, hot: 3,
      comments: [
        { id: "c1", author: "finally_lol", time: "1h", body: "Heard back exactly 4 weeks after applying. Don't follow up before then, it doesn't help.", votes: 41 },
        { id: "c2", author: "winter_grind", time: "1h", body: "Same boat, Sept 5 applicant. Radio silence. Solidarity 🫡", votes: 18 },
        { id: "c3", author: "intern_24", time: "40m", body: "A recruiter told me they batch-review in waves. Early Sept apps got looked at mid-Oct for me.", votes: 27 },
      ],
    },
    {
      id: "oa2", author: "poll_master", time: "4h", flair: "poll",
      title: "When did y'all submit your OpenAI app this cycle?",
      poll: {
        options: [
          { label: "August", pct: 14 },
          { label: "Early Sept", pct: 40 },
          { label: "Mid–late Sept", pct: 32 },
          { label: "Oct or later", pct: 14 },
        ],
        total: 156, daysLeft: 3, selected: 1,
      },
      votes: 189, hot: 2,
      comments: [
        { id: "c4", author: "oa_done", time: "3h", body: "Early Sept gang. Got my OA invite 3 weeks later.", votes: 12 },
      ],
    },
    {
      id: "oa3", author: "anonymous", time: "6h", flair: "vent",
      title: "Got rejected from OpenAI after final round 🫠",
      body: "Made it through 4 rounds, did the on-site, thought it went well. Got the email yesterday. Honestly devastated, prepped for months for this.",
      votes: 142, hot: 1,
      comments: [
        { id: "c5", author: "behavioral_tips", time: "5h", body: "Been there. Final-round rejection stings the most because you were SO close. It's not a reflection of your worth — the bar is genuinely random at that stage.", votes: 58 },
        { id: "c6", author: "startup_dreams", time: "4h", body: "Reframe: you're now a final-round-caliber candidate. That signal travels. You'll land somewhere great.", votes: 33 },
      ],
    },
    {
      id: "oa4", author: "finally_lol", time: "1d", flair: "success",
      title: "GOT THE OPENAI SWE INTERN OFFER!! 🥳",
      body: "CS junior, applied via referral early September. AMA basically. Happy to share what worked, what I'd do differently.",
      votes: 412, hot: 5,
      comments: [
        { id: "c7", author: "sleepless_jr", time: "22h", body: "Congrats!! How many LeetCode did you grind and what was the OA like?", votes: 14 },
        { id: "c8", author: "finally_lol", time: "21h", body: "~250 LC, mostly mediums. OA was 4 problems / 90 min, two felt like rebranded Codeforces div2.", votes: 29 },
        { id: "c9", author: "cs_to_consulting", time: "20h", body: "Did the referral come from an alum or a friend? Trying to figure out where to spend networking energy.", votes: 9 },
      ],
    },
    {
      id: "oa5", author: "intern_24", time: "2d", flair: "tips",
      title: "PSA: OpenAI's OA reuses old Codeforces div2 problems",
      body: "Did the OA last week and recognized 2/4 problems from old Codeforces contests. Highly recommend grinding ~30 div2 problems before applying.",
      votes: 298, hot: 4,
      comments: [
        { id: "c10", author: "oa_szn_done", time: "1d", body: "Can confirm. Rating 1400-1700 div2 problems are the sweet spot.", votes: 22 },
      ],
    },
    {
      id: "oa6", author: "sleepless_jr", time: "2d", flair: "discussion",
      title: "Is cold-applying to OpenAI even worth it without a referral?",
      body: "Looking at the stats here it seems like 60%+ of offers came through referrals. Wondering if I should just focus on networking instead of the careers page.",
      votes: 94,
      comments: [
        { id: "c11", author: "cold_email_god", time: "1d", body: "25% still came through online apply per the cohort report. Do both. Cold-apply AND find a referral, they're not mutually exclusive.", votes: 31 },
      ],
    },
    {
      id: "oa7", author: "oa_done", time: "3d", flair: "update",
      title: "Cleared the OA, on to phone screens",
      body: "Should I celebrate or is the real grind ahead? Anyone have tips for the phone screen specifically?",
      votes: 76,
      comments: [],
    },
    {
      id: "oa8", author: "behavioral_tips", time: "4d", flair: "tips",
      title: "Behavioral round breakdown: what they actually ask",
      body: "It's \"why OpenAI\" + 2 deep follow-ups. Read their charter, mission page, and at least 2 recent papers. They probe for genuine alignment.",
      votes: 203,
      comments: [],
    },
  ];

  const mainPosts = [
    {
      id: "m1", author: "winter_grind", time: "2h", flair: "question",
      title: "anyone else doing winter break OAs while traveling? brutal",
      body: "i have like 4 OAs scheduled across 3 time zones over winter break. how do you all handle this without losing your mind",
      votes: 312, hot: 3,
      comments: [
        { id: "mc1", author: "oa_szn_done", time: "1h", body: "i did 3 OAs from an airport lounge over break. noise-cancelling headphones + screen privacy filter = lifesaver.", votes: 24 },
      ],
    },
    {
      id: "m2", author: "poll_szn", time: "5h", flair: "poll",
      title: "which industry are you primarily recruiting for?",
      poll: {
        options: [
          { label: "Tech", pct: 52 },
          { label: "Finance", pct: 22 },
          { label: "Consulting", pct: 14 },
          { label: "Quant", pct: 8 },
          { label: "Other", pct: 4 },
        ],
        total: 347, daysLeft: 5, selected: 0,
      },
      votes: 198, hot: 2,
      comments: [],
    },
    {
      id: "m3", author: "cold_email_god", time: "1d", flair: "tips",
      title: "career fair was mostly recruiter boilerplate. cold email + LinkedIn DM > career fair imo",
      body: "spent 3 hours waiting in lines for 5-minute conversations that went nowhere. ended up getting all my interview invites from cold-emailing alums.",
      votes: 287, hot: 4,
      comments: [
        { id: "mc2", author: "cs_to_consulting", time: "20h", body: "hard disagree for consulting — career fair is where MBB actually sources. depends heavily on industry.", votes: 41 },
      ],
    },
    {
      id: "m4", author: "anonymous", time: "1d", flair: "vent",
      title: "had 3 final rounds back to back. brain literally melted",
      body: "tuesday wednesday thursday all on-sites in different cities. blanked on a basic dp question by friday. is this normal",
      votes: 156,
      comments: [],
    },
    {
      id: "m5", author: "startup_dreams", time: "2d", flair: "success",
      title: "got my dream offer at a small startup, AMA",
      body: "CS junior. 8-person seed-stage startup. paid less than a FAANG offer i turned down but i'm gonna actually own things and ship",
      votes: 421, hot: 5,
      comments: [],
    },
    {
      id: "m6", author: "cs_to_consulting", time: "2d", flair: "discussion",
      title: "is it worth applying to consulting if i'm CS?",
      body: "getting cold feet about pure SWE. wondering if MBB takes CS kids who don't have the case prep down already. anyone done this transition?",
      votes: 89,
      comments: [],
    },
    {
      id: "m7", author: "oa_szn_done", time: "3d", flair: "update",
      title: "first OA season survived. onto phone screens",
      body: "12 OAs done. 7 phone screens lined up. brain is fried but the funnel is moving. solidarity to anyone still grinding",
      votes: 102,
      comments: [],
    },
    {
      id: "m8", author: "behavioral_pilled", time: "4d", flair: "tips",
      title: "PSA: behavioral rounds matter way more than people think",
      body: "prep your \"why X company\" for every place. interviewers can tell when you're winging it. lost 2 offers to this when my technicals were strong",
      votes: 234,
      comments: [],
    },
  ];

  // ---- generated posts for non-OpenAI companies ----
  const postTemplates = [
    { flair: "question", t: (c) => `Anyone heard back from ${c} this cycle?`, b: () => "Applied a few weeks ago, total silence. Trying to figure out if I'm still in the running or should move on." },
    { flair: "tips", t: (c) => `${c} OA breakdown — what to expect`, b: () => "Two medium DSA problems plus a debugging section. Time pressure is real, practice with a timer." },
    { flair: "success", t: (c) => `Got the ${c} offer!! still in shock`, b: () => "Junior, applied through a referral. Happy to answer questions about the process." },
    { flair: "vent", t: (c) => `Rejected from ${c} post-final round 😞`, b: () => "Thought it went well. The waiting was the worst part. On to the next one I guess." },
    { flair: "discussion", t: (c) => `Is ${c} worth it over the bigger names?`, b: () => "Got competing offers and genuinely torn. Curious how people weighed comp vs growth vs brand." },
    { flair: "poll", t: (c) => `How many rounds did ${c} put you through?`, poll: true },
    { flair: "update", t: (c) => `Cleared the ${c} phone screen, onsite next week`, b: () => "Any last-minute prep advice for the onsite? Trying not to overthink it." },
    { flair: "question", t: (c) => `${c}: referral or cold apply?`, b: () => "Don't have a connection there yet. Wondering if it's worth the networking effort or just apply online." },
  ];
  const authors = ["anon_2027", "grind_szn", "ret_pilled", "ship_it", "leetcode_zombie", "anonymous", "fall_recruit", "deadline_panic", "the_funnel"];

  function genPosts(company) {
    const rng = mulberry(seedFrom(company.slug + "posts"));
    const n = Math.min(8, Math.max(4, Math.round(company.reports / 4)));
    const tpls = [...postTemplates].sort(() => rng() - 0.5).slice(0, n);
    return tpls.map((tpl, i) => {
      const base = {
        id: `${company.slug}-p${i}`,
        author: pick(rng, authors),
        time: pick(rng, ["3h", "7h", "1d", "2d", "3d", "5d"]),
        flair: tpl.flair,
        title: tpl.t(company.name),
        votes: ibetween(rng, 28, 320),
        comments: [],
      };
      if (tpl.poll) {
        const opts = ["3 or fewer", "4 rounds", "5 rounds", "6+"];
        base.poll = {
          options: genPctList(rng, opts, 4).map((o) => ({ label: o.label, pct: o.pct })),
          total: ibetween(rng, 60, 240), daysLeft: ibetween(rng, 1, 6), selected: -1,
        };
      } else {
        base.body = tpl.b();
      }
      if (i < 2) {
        base.comments = [
          { id: `${company.slug}-c${i}`, author: pick(rng, authors), time: "2h", body: "Following this — same questions. Bumping for visibility.", votes: ibetween(rng, 4, 30) },
        ];
      }
      return base;
    });
  }

  // ---------------------------------------------------------------- ADVICE
  const openaiAdvice = [
    { badge: "offer", role: "SWE Intern · CS · Junior", body: "Cold-applied through their careers page on Sept 3. Heard back in 4 weeks. The technical screen was harder than I expected — make sure you've actually shipped ML projects, not just done classwork. The behavioral round mattered way more than I thought.", ups: 84, when: "2024–25" },
    { badge: "final", role: "ML Research Intern · Math+CS · Senior", body: "Read at least two of their recent papers before the research chat. They go deep on 'why this direction' and can tell instantly if you've just skimmed abstracts. My referral got me the screen but the paper discussion got me the offer.", ups: 67, when: "2024–25" },
    { badge: "offer", role: "SWE Intern · Symbolic Systems · Junior", body: "The OA reused two old Codeforces problems almost verbatim. Grind div2 C/D problems. Also — be a real person in the behavioral. They're allergic to rehearsed answers.", ups: 52, when: "2024–25" },
    { badge: "final", role: "New Grad SWE · CS · Coterm", body: "Got referred by an alum I cold-DMed on LinkedIn. Took three messages and a coffee chat. Worth every awkward minute. The referral skipped me past the resume screen entirely.", ups: 41, when: "2023–24" },
    { badge: "offer", role: "ML Research Intern · CS · Senior", body: "Don't sleep on systems fundamentals even for research roles. Half my onsite was distributed-training and memory questions, not just modeling. PyTorch internals came up twice.", ups: 38, when: "2024–25" },
    { badge: "final", role: "SWE Intern · Math · Junior", body: "I over-indexed on LeetCode and under-prepared for the 'tell me about a project you shipped' part. They want builders. Have one project you can talk about for 20 minutes.", ups: 29, when: "2024–25" },
  ];
  const adviceTemplates = [
    (c) => `Applied to ${c} through a referral. The process was faster than the bigger names. Be ready to talk about one project in serious depth — surface-level answers don't survive the follow-ups.`,
    (c) => `${c}'s OA was standard DSA but the behavioral was where people got cut. Have a crisp 'why ${c}' that isn't generic. Specifics about their product win.`,
    (c) => `Networked into ${c} via a coffee chat with an alum. Cold outreach works if you're genuine and specific. Generic 'pick your brain' DMs get ignored.`,
    (c) => `The onsite at ${c} was 4 rounds in one day. Pace yourself, eat something between rounds, and treat every interviewer like the decision-maker.`,
  ];
  function genAdvice(company) {
    const rng = mulberry(seedFrom(company.slug + "adv"));
    const n = Math.min(adviceTemplates.length, Math.max(2, Math.round(company.reports / 6)));
    return adviceTemplates.slice(0, n).map((fn, i) => ({
      badge: i % 2 === 0 ? "offer" : "final",
      role: `${(roleSets[company.industry] || roleSets.tech)[0].name} · ${pick(rng, majorPool[company.industry] || majorPool.tech)} · ${pick(rng, years)}`,
      body: fn(company.name),
      ups: ibetween(rng, 18, 70),
      when: "2024–25",
    }));
  }

  // ---------------------------------------------------------------- INDUSTRY FORUMS
  // Broader "at large" communities — addresses "what about IB / consulting at large?"
  const INDUSTRY_FORUMS = {
    tech: { label: "Tech · at large", blurb: "SWE, ML, PM, and new-grad recruiting across the industry — not company-specific.", members: 2840 },
    finance: { label: "Investment Banking & Finance", blurb: "IB, S&T, and corporate finance. Networking, superdays, and the diversity-program timeline.", members: 1610 },
    consulting: { label: "Consulting · MBB & beyond", blurb: "Case prep, fit, and the consulting recruiting calendar across firms.", members: 1290 },
    quant: { label: "Quant · trading & research", blurb: "Quant trading, research, and dev. OAs, mental math, and the firms that move fast.", members: 880 },
    startups: { label: "Startups & founding roles", blurb: "Seed-to-Series-C, founding engineer roles, equity vs comp, and how to vet a startup.", members: 1040 },
    design: { label: "Product & Brand Design", blurb: "Portfolio reviews, design challenges, and where to find design-forward teams.", members: 470 },
  };

  // Seed posts per industry forum (cross-company, broad discussion)
  const industryPosts = {
    finance: [
      { id: "ib1", author: "superday_survivor", time: "3h", flair: "tips", title: "The IB recruiting timeline is INSANELY early — start now, not fall", body: "Diversity programs open the spring of sophomore year. By the time \"official\" applications open, a huge share of the class is already filled through accelerated programs. If you're a sophomore reading this: apply to every spring insight/diversity program now.", votes: 341, hot: 5, comments: [ { id: "ibc1", author: "rising_soph", time: "2h", body: "Wait so the summer-after-junior internship is basically decided sophomore year?? that's wild", votes: 44 }, { id: "ibc2", author: "gs_2026", time: "1h", body: "Yep. Networked into a GS diversity program in February of sophomore year, got the SA offer before fall recruiting even started.", votes: 38 } ] },
      { id: "ib2", author: "networking_machine", time: "8h", flair: "discussion", title: "How many coffee chats did it actually take you to break in?", body: "Tracking mine in a spreadsheet — I'm at 40 calls and 3 first-rounds. Curious what the real conversion looks like for everyone else.", votes: 198, hot: 3, comments: [ { id: "ibc3", author: "ms_grind", time: "6h", body: "~60 calls → 5 superdays → 1 offer. It's a numbers game. Be genuinely curious on the call and ask for one intro at the end.", votes: 52 } ] },
      { id: "ib3", author: "poll_ib", time: "1d", flair: "poll", title: "Which group are you targeting for SA?", poll: { options: [ { label: "M&A / Advisory", pct: 38 }, { label: "Sales & Trading", pct: 27 }, { label: "Coverage / Industry", pct: 21 }, { label: "Still figuring it out", pct: 14 } ], total: 211, daysLeft: 4, selected: -1 }, votes: 156, hot: 2, comments: [] },
      { id: "ib4", author: "anonymous", time: "2d", flair: "vent", title: "dinged from a superday for a 'fit' reason after nailing the technicals", body: "knew every accretion/dilution question cold. apparently didn't 'click' with one of the VPs. the fit piece is so much more important than people admit.", votes: 167, comments: [] },
      { id: "ib5", author: "wso_refugee", time: "3d", flair: "tips", title: "You do NOT need to memorize the entire 400-question guide", body: "Know the core ~50 cold (the three statements, DCF, M&A vs LBO, why-banking). Beyond that they want to see you think. I over-prepped technicals and under-prepped my story.", votes: 224, comments: [] },
    ],
    consulting: [
      { id: "co1", author: "case_in_point", time: "4h", flair: "tips", title: "Casing with friends plateaued me — here's what actually broke me through", body: "Did 30+ cases with classmates and stalled. The jump came from doing 10 cases with people a level above me (recent hires, MBA mentors) who pushed on structure and synthesis. Quality of partner > quantity of cases.", votes: 287, hot: 5, comments: [ { id: "coc1", author: "mbb_hopeful", time: "3h", body: "Where do you even find recent-hire mentors to case with?", votes: 19 }, { id: "coc2", author: "case_in_point", time: "2h", body: "Stanford consulting club alumni list + cold LinkedIn DMs to analysts who graduated 1-2 yrs ago. Most say yes if you're specific.", votes: 31 } ] },
      { id: "co2", author: "fit_over_case", time: "10h", flair: "discussion", title: "Hot take: the fit interview decides more offers than the case", body: "Everyone obsesses over the case but at the final round everyone can case. The PEI / fit stories are what differentiate. Have 3 polished stories (leadership, impact, conflict) you can flex into any prompt.", votes: 176, hot: 3, comments: [] },
      { id: "co3", author: "poll_consulting", time: "1d", flair: "poll", title: "Are you prepping for case, fit, or both equally right now?", poll: { options: [ { label: "Mostly case", pct: 46 }, { label: "Mostly fit", pct: 12 }, { label: "Both equally", pct: 42 } ], total: 188, daysLeft: 3, selected: -1 }, votes: 132, hot: 2, comments: [] },
      { id: "co4", author: "cs_to_consulting", time: "2d", flair: "question", title: "CS major pivoting to consulting — does the technical background help or hurt?", body: "Worried they'll think I'm just using them as a backup. How do I frame the CS-to-consulting story so it sounds intentional?", votes: 98, comments: [ { id: "coc3", author: "bain_2025", time: "1d", body: "Huge asset if you frame it as 'I want to solve business problems with a builder's mindset.' They love analytical CS kids. Don't apologize for it.", votes: 41 } ] },
    ],
    quant: [
      { id: "qu1", author: "mental_math_demon", time: "5h", flair: "tips", title: "The quant OA is a speed + accuracy filter, not a DSA test", body: "Jane Street / Optiver style: 80 mental-math questions in 8 minutes, then probability brainteasers. Drill arithmetic on Tradinginterview / Zetamac until you hit 60+/min. That single skill gates more people than the probability.", votes: 312, hot: 5, comments: [ { id: "quc1", author: "prob_pilled", time: "4h", body: "Zetamac score went from 35 to 70 in two weeks of daily practice. It's pure reps.", votes: 28 } ] },
      { id: "qu2", author: "ev_maximizer", time: "1d", flair: "discussion", title: "Trading vs research vs dev — how did you decide?", body: "Got OAs from a few firms across all three tracks. Background is math-heavy CS. Genuinely unsure which fits. How did you all pick?", votes: 143, hot: 3, comments: [] },
      { id: "qu3", author: "poll_quant", time: "2d", flair: "poll", title: "Where are you in the quant funnel right now?", poll: { options: [ { label: "Grinding OAs", pct: 41 }, { label: "Phone / video rounds", pct: 23 }, { label: "Final / superday", pct: 16 }, { label: "Have an offer", pct: 20 } ], total: 97, daysLeft: 2, selected: -1 }, votes: 88, comments: [] },
    ],
    tech: [
      { id: "te1", author: "newgrad_market", time: "6h", flair: "discussion", title: "Is the new-grad SWE market actually as brutal as everyone says?", body: "Seeing way fewer postings than the class above me had. Curious if people are feeling the squeeze or if it's just doomposting. What's your real funnel looking like?", votes: 264, hot: 4, comments: [ { id: "tec1", author: "ship_it", time: "5h", body: "It's tighter but not dead. Referrals matter 2x more than last year. Cold-applying to 200 postings is mostly noise now.", votes: 47 } ] },
      { id: "te2", author: "referral_pilled", time: "1d", flair: "tips", title: "One warm referral beats 100 cold applications. Spend your energy accordingly", body: "Tracked it this cycle: 80% of my interviews came from referrals, 20% from cold apply, despite cold-applying 5x more. Find one human at each target company. That's the whole game now.", votes: 298, hot: 5, comments: [] },
      { id: "te3", author: "poll_tech", time: "2d", flair: "poll", title: "How many LeetCode problems before you felt interview-ready?", poll: { options: [ { label: "< 100", pct: 18 }, { label: "100–250", pct: 44 }, { label: "250–500", pct: 27 }, { label: "500+", pct: 11 } ], total: 403, daysLeft: 5, selected: -1 }, votes: 221, hot: 3, comments: [] },
    ],
    startups: [
      { id: "st1", author: "equity_curious", time: "7h", flair: "discussion", title: "How do you actually evaluate a startup offer vs a FAANG one?", body: "Seed-stage founding-eng offer: lower base, 0.5% equity. Vs a big-tech intern→return path. How are people thinking about the risk/reward and the learning curve?", votes: 187, hot: 4, comments: [ { id: "stc1", author: "startup_dreams", time: "5h", body: "At seed stage value the equity at ~$0 and decide on the people + what you'll learn. If the founders are exceptional and you'll own real surface area, take it. The optionality compounds.", votes: 39 } ] },
      { id: "st2", author: "founding_eng", time: "2d", flair: "tips", title: "Questions to ask a startup before you sign (that they won't volunteer)", body: "Runway in months. Last round + valuation. Burn rate. What % of eng has left in the last year. Who's the 2nd engineer and why'd they join. Their answers tell you everything.", votes: 156, comments: [] },
    ],
    design: [
      { id: "de1", author: "portfolio_anxiety", time: "9h", flair: "question", title: "How many case studies should a product design portfolio actually have?", body: "Everyone says 'quality over quantity' but how few is too few? I have 3 strong ones and a couple weaker projects. Cut the weak ones entirely?", votes: 94, hot: 3, comments: [ { id: "dec1", author: "design_lead_mentor", time: "7h", body: "3 strong > 5 mixed, every time. Reviewers spend 4 minutes on a portfolio. Lead with your best, cut anything you'd have to apologize for.", votes: 27 } ] },
      { id: "de2", author: "whiteboard_warrior", time: "2d", flair: "tips", title: "The app-critique round: think out loud, don't perform", body: "They want to hear how you reason about tradeoffs, not a rehearsed teardown. Narrate your thought process, ask clarifying questions, and it's fine to disagree with the prompt.", votes: 78, comments: [] },
    ],
  };

  // ---------------------------------------------------------------- AUTHOR KARMA + BADGES
  // Curated meta for memorable handles; deterministic fallback for the rest.
  const authorRegistry = {
    finally_lol:      { karma: 4820, year: "Senior",  badges: ["offer", "mentor", "top"] },
    intern_24:        { karma: 3110, year: "Coterm",  badges: ["offer", "mentor"] },
    behavioral_tips:  { karma: 2740, year: "Senior",  badges: ["mentor", "og"] },
    cold_email_god:   { karma: 2390, year: "Senior",  badges: ["offer", "og"] },
    startup_dreams:   { karma: 2055, year: "Junior",  badges: ["offer", "mentor"] },
    intern_24b:       { karma: 1980, year: "Senior",  badges: ["mentor"] },
    oa_szn_done:      { karma: 1640, year: "Junior",  badges: ["og"] },
    behavioral_pilled:{ karma: 1510, year: "Coterm",  badges: ["mentor"] },
    superday_survivor:{ karma: 2210, year: "Senior",  badges: ["offer", "mentor"] },
    case_in_point:    { karma: 1870, year: "Senior",  badges: ["offer", "mentor"] },
    mental_math_demon:{ karma: 1730, year: "Coterm",  badges: ["offer", "og"] },
    referral_pilled:  { karma: 1605, year: "Junior",  badges: ["offer"] },
    poll_master:      { karma: 980,  year: "Junior",  badges: ["og"] },
    winter_grind:     { karma: 760,  year: "Junior",  badges: [] },
    sleepless_jr:     { karma: 410,  year: "Sophomore", badges: [] },
    cs_to_consulting: { karma: 690,  year: "Senior",  badges: [] },
    networking_machine:{ karma: 1240, year: "Junior", badges: ["offer"] },
    anonymous:        { karma: 120,  year: "—",       badges: [] },
  };

  function authorMeta(handle) {
    if (handle === "you") return null;
    if (authorRegistry[handle]) return { handle, ...authorRegistry[handle] };
    const rng = mulberry(seedFrom(handle + "meta"));
    const karma = ibetween(rng, 35, 1700);
    const badges = [];
    if (rng() > 0.55) badges.push("offer");
    if (karma > 1100) badges.push("mentor");
    if (rng() > 0.85) badges.push("og");
    return { handle, karma, year: pick(rng, years), badges };
  }

  function fmtK(n) {
    if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "") + "k";
    return String(n);
  }
  function flairLabel(value) {
    if (!value) return { label: "", type: "" };
    if (value.indexOf("co:") === 0) { const c = getCompany(value.slice(3)); return { label: "ex-" + c.name, type: "co" }; }
    if (value.indexOf("major:") === 0) return { label: value.slice(6), type: "major" };
    if (value.indexOf("year:") === 0) return { label: "Class of " + value.slice(5), type: "year" };
    return { label: value, type: "" };
  }

  // ---------------------------------------------------------------- MY CYCLE
  // ---------------------------------------------------------------- ALERTS
  // Notifications for a social/advice platform: replies, awards, karma, badges,
  // and activity in companies you follow. Seeded on sign-in so it's demoable.
  // ---------------------------------------------------------------- SEARCH
  // Unified search across companies, industry forums, and posts (all scopes).
  function search(q) {
    q = (q || "").trim().toLowerCase();
    if (!q) return { companies: [], forums: [], posts: [] };
    const companiesR = companies
      .filter((c) => (`${c.name} ${c.industry}`).toLowerCase().includes(q))
      .slice(0, 6);
    const forums = Object.keys(INDUSTRY_FORUMS)
      .filter((k) => INDUSTRY_FORUMS[k].label.toLowerCase().includes(q) || k.includes(q))
      .map((k) => ({ key: k, label: INDUSTRY_FORUMS[k].label }))
      .slice(0, 4);
    // posts: scan a representative set of scopes
    const scopes = ["__main__", "ind:finance", "ind:consulting", "ind:tech", "ind:quant", "ind:startups", "ind:design",
      "openai", "jane-street", "goldman-sachs", "anthropic", "google", "meta", "mckinsey", "stripe", "citadel"];
    const posts = [];
    scopes.forEach((s) => {
      getPosts(s).forEach((p) => {
        if (p.title.toLowerCase().includes(q) || (p.body && p.body.toLowerCase().includes(q))) {
          posts.push({ post: p, scope: s });
        }
      });
    });
    posts.sort((a, b) => b.post.votes - a.post.votes);
    return { companies: companiesR, forums, posts: posts.slice(0, 7) };
  }

  function seedAlerts() {
    const now = Date.now(), h = 3600000, day = 86400000;
    return [
      { id: "al1", type: "reply", actor: "winter_grind", title: "replied to your post", body: "“This is exactly what I needed — did the referral come from an alum or a friend?”", scope: "__main__", postId: "m1", ts: now - 2 * h, read: false },
      { id: "al2", type: "award", title: "Your tip earned an Award", body: "Someone gave your reply an Award · +5 karma", scope: "openai", postId: "oa1", ts: now - 5 * h, read: false },
      { id: "al3", type: "upvote", title: "Your post is taking off", body: "“My referral playbook that landed 3 interviews” passed 25 upvotes", scope: "__main__", postId: "m1", ts: now - 9 * h, read: false },
      { id: "al4", type: "newpost", title: "New in OpenAI", body: "3 new posts in a company you follow this week", scope: "openai", ts: now - 1 * day, read: true },
      { id: "al5", type: "badge", title: "You earned a badge", body: "Mentor — for being consistently helpful. It now shows on your posts.", ts: now - 1 * day, read: true },
      { id: "al6", type: "newcontrib", title: "Fresh data in Stripe", body: "A new SWE Intern report was added — the cohort report just got richer.", slug: "stripe", ts: now - 2 * day, read: true },
      { id: "al7", type: "reply", actor: "sleepless_jr", title: "replied to a thread you're in", body: "“How many LeetCode did you grind before applying?”", scope: "openai", postId: "oa4", ts: now - 3 * day, read: true },
      { id: "al8", type: "tier", title: "You leveled up", body: "You reached the Contributor tier. Keep sharing to hit Regular.", ts: now - 4 * day, read: true },
    ];
  }

  // ---------------------------------------------------------------- MENTORSHIP
  // Contributions = acts of giving back. A company's contribution volume is a
  // signal of its "mentorship culture." Rank people (mentors) and companies.
  const GRAD_YEARS = ["Sophomore", "Junior", "Senior", "Coterm"];
  const YEAR_LENSES = ["2025", "2026", "2027", "2028"];
  function yearShare(company, year) {
    // deterministic per-company split; supports both class standing and grad years
    const rng = mulberry(seedFrom(company.slug + "yr"));
    const keys = YEAR_LENSES.includes(year) ? YEAR_LENSES : GRAD_YEARS;
    const raw = keys.map(() => 0.4 + rng());
    const sum = raw.reduce((a, b) => a + b, 0);
    const idx = keys.indexOf(year);
    return idx < 0 ? 0 : raw[idx] / sum;
  }
  function majorShare(company, major) {
    const d = getDetail(company.slug);
    const m = (d.majors || []).find((x) => x.label === major);
    if (m) return m.pct / 100;
    return 0.06; // small tail for majors outside the top 3
  }
  // score a company under a lens: overall | major:<Major> | year:<Year>
  function mentorScore(company, lens) {
    const base = company.reports;
    if (!lens || lens === "overall") return base;
    if (lens.indexOf("major:") === 0) return Math.round(base * majorShare(company, lens.slice(6)));
    if (lens.indexOf("year:") === 0) return Math.round(base * yearShare(company, lens.slice(5)));
    return base;
  }
  // approx Stanford alumni headcount at each company (drives per-capita rate)
  function alumniBase(company) {
    const rng = mulberry(seedFrom(company.slug + "alum"));
    // big tech & banks employ far more Stanford grads than boutiques/startups
    const byInd = { tech: [120, 900], finance: [60, 400], consulting: [50, 320], quant: [25, 160], startups: [6, 60], design: [10, 70] };
    const [lo, hi] = byInd[company.industry] || [20, 200];
    // scale loosely with report volume so it's plausible, plus noise
    const scale = 0.5 + company.reports / 50;
    return Math.max(5, Math.round(between(rng, lo, hi) * scale));
  }
  // per-capita give-back rate: contributions per 100 Stanford alumni
  function giveBackRate(company) {
    return company.reports / alumniBase(company) * 100;
  }
  function mentorshipBoard({ industry, lens, perCapita } = {}) {
    let list = companies.filter((c) => (industry && industry !== "all") ? c.industry === industry : true);
    if (perCapita) {
      list = list.map((c) => ({ company: c, score: Math.round(giveBackRate(c) * 10) / 10, raw: c.reports, base: alumniBase(c) }))
        .filter((x) => x.raw > 0)
        .sort((a, b) => b.score - a.score);
    } else {
      list = list.map((c) => ({ company: c, score: mentorScore(c, lens) }))
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score);
    }
    return list;
  }
  // culture tier from contribution volume (relative to the field)
  function mentorshipTier(count) {
    if (count >= 30) return { label: "Exceptional", tone: "gold", rank: 4 };
    if (count >= 20) return { label: "Strong", tone: "green", rank: 3 };
    if (count >= 10) return { label: "Growing", tone: "blue", rank: 2 };
    if (count >= 1) return { label: "Emerging", tone: "slate", rank: 1 };
    return { label: "New", tone: "slate", rank: 0 };
  }
  const MAJOR_LENSES = ["Computer Science", "Symbolic Systems", "Management Science & Engineering", "Economics", "Mathematics"];

  // ---- cycle-wizard option sets ----
  const PLATFORMS = ["Handshake", "LinkedIn", "Company website", "Cold email", "LinkedIn cold message", "Referral portal"];
  const WARM_SOURCES = ["Stanford club", "Past internship / workplace", "Stanford friend", "Family friend", "Stanford professor", "Research lab", "Company coffee chat"];
  const PREP_RESOURCES = ["LeetCode", "HackerRank", "NeetCode", "Pramp / mock interviews", "Cracking the Coding Interview", "Case in Point", "Wall Street Oasis", "Glassdoor / Blind"];
  function rolesForIndustry(key) {
    return (roleSets[key] || roleSets.tech).map((r) => r.name);
  }

  // ---- Stanford degrees / majors / minors / class years (for sign-up profile) ----
  const DEGREE_LEVELS = ["Bachelor's (B.S./B.A.)", "Coterm (B.S. + M.S.)", "Master's (M.S./M.A.)", "PhD"];
  const DEGREE_FILTERS = ["Bachelor's", "Coterm", "Master's", "PhD"];
  const STANFORD_MAJORS = [
    "Computer Science", "Symbolic Systems", "Mathematical & Computational Science", "Mathematics", "Statistics",
    "Data Science", "Management Science & Engineering", "Economics", "Electrical Engineering", "Mechanical Engineering",
    "Bioengineering", "Chemical Engineering", "Civil & Environmental Engineering", "Materials Science & Engineering",
    "Aeronautics & Astronautics", "Engineering Physics", "Product Design", "Physics", "Chemistry", "Biology",
    "Human Biology", "Biomedical Computation", "Earth Systems", "Geological Sciences", "Geophysics", "Environmental Systems Engineering",
    "Psychology", "Political Science", "International Relations", "Public Policy", "Sociology", "Anthropology",
    "Economics & Mathematics", "History", "Philosophy", "English", "Comparative Literature", "Linguistics",
    "Communication", "Science, Technology & Society", "Urban Studies", "American Studies", "Art History",
    "Art Practice", "Film & Media Studies", "Music", "Theater & Performance Studies", "Classics", "Religious Studies",
    "Archaeology", "Feminist, Gender & Sexuality Studies", "African & African American Studies", "Asian American Studies",
    "Chicana/o–Latina/o Studies", "Comparative Studies in Race & Ethnicity", "East Asian Studies", "French", "German Studies",
    "Iberian & Latin American Cultures", "Italian", "Slavic Languages & Literatures", "Other",
  ];
  const STANFORD_MINORS = ["None", ...STANFORD_MAJORS.filter((m) => m !== "Other"), "Other"];
  const GRAD_CLASS_YEARS = (() => { const a = []; for (let y = 2030; y >= 1965; y--) a.push(String(y)); return a; })();
  const GPA_BUCKETS = ["3.9 – 4.0", "3.7 – 3.9", "3.4 – 3.7", "3.0 – 3.4", "Below 3.0", "Prefer not to say"];

  // platform-wide contribution distributions (for the Cohorts board)
  const GLOBAL_MAJORS = [
    ["Computer Science", 0.34], ["Symbolic Systems", 0.13], ["Mathematical & Computational Science", 0.10],
    ["Management Science & Engineering", 0.09], ["Economics", 0.08], ["Mathematics", 0.06],
    ["Electrical Engineering", 0.05], ["Statistics", 0.05], ["Data Science", 0.04],
    ["Bioengineering", 0.03], ["Product Design", 0.02], ["Physics", 0.01],
  ];
  const GLOBAL_GRADYEARS = [
    ["Class of 2026", 0.30], ["Class of 2025", 0.26], ["Class of 2027", 0.18],
    ["Class of 2024", 0.12], ["Class of 2028", 0.08], ["Class of 2023", 0.04], ["Class of 2029", 0.02],
  ];
  function contributionsByMajor() {
    if (LAUNCH) return [];
    return GLOBAL_MAJORS.map(([label, frac]) => ({ label, count: Math.max(1, Math.round(totalReports * frac)) }))
      .sort((a, b) => b.count - a.count);
  }
  function contributionsByGradYear() {
    if (LAUNCH) return [];
    return GLOBAL_GRADYEARS.map(([label, frac]) => ({ label, count: Math.max(1, Math.round(totalReports * frac)) }))
      .sort((a, b) => b.count - a.count);
  }

  // ---------------------------------------------------------------- public API
  const detailCache = {};
  const postsCache = {};
  const adviceCache = {};
  const pendingCompanies = {}; // slug -> company, resolvable but not in public directory

  function getCompany(slug) {
    return companies.find((c) => c.slug === slug) || pendingCompanies[slug] || companies[0];
  }
  function registerPending(c) { pendingCompanies[c.slug] = c; }
  function unregisterPending(slug) { delete pendingCompanies[slug]; }
  function isPending(slug) { return !!pendingCompanies[slug] && !companies.find((c) => c.slug === slug); }
  function getDetail(slug) {
    if (slug === "openai") return openaiDetail;
    if (!detailCache[slug]) detailCache[slug] = buildDetail(getCompany(slug));
    return detailCache[slug];
  }
  function getPosts(slug) {
    if (LAUNCH) return [];
    if (slug === "openai") return openaiPosts;
    if (slug === "__main__") return mainPosts;
    if (slug && slug.indexOf("ind:") === 0) {
      const key = slug.slice(4);
      return industryPosts[key] || [];
    }
    if (!postsCache[slug]) postsCache[slug] = genPosts(getCompany(slug));
    return postsCache[slug];
  }
  function registerCompany(c) {
    if (!companies.find((x) => x.slug === c.slug)) companies.push(c);
  }
  function scopeLabel(scope) {
    if (scope === "__main__") return "All of Stanford";
    if (scope && scope.indexOf("ind:") === 0) {
      const f = INDUSTRY_FORUMS[scope.slice(4)];
      return f ? f.label : scope;
    }
    return getCompany(scope).name;
  }
  function scopeKind(scope) {
    if (scope === "__main__") return "campus";
    if (scope && scope.indexOf("ind:") === 0) return "industry";
    return "company";
  }
  // Live "what's hot across recruiting right now" for the home pulse
  function getAdvice(slug) {
    if (LAUNCH) return [];
    if (slug === "openai") return openaiAdvice;
    if (!adviceCache[slug]) adviceCache[slug] = genAdvice(getCompany(slug));
    return adviceCache[slug];
  }
  function companyReports(c) { return LAUNCH ? 0 : c.reports; }
  function isLaunch() { return LAUNCH; }
  function setLaunch(v) { LAUNCH = !!v; }

  const totalReports = companies.reduce((a, c) => a + c.reports, 0);
  let LAUNCH = false; // fresh-launch mode: hide all seeded data

  window.IV = {
    industries, companies, factors, years,
    FLAIRS, INDUSTRY_FORUMS,
    getCompany, getDetail, getPosts, getAdvice,
    authorMeta, fmtK, flairLabel, registerCompany, registerPending, unregisterPending, isPending, companyReports, isLaunch, setLaunch,
    scopeLabel, scopeKind,
    mentorshipBoard, mentorScore, mentorshipTier, yearShare, majorShare, GRAD_YEARS, MAJOR_LENSES,
    PLATFORMS, WARM_SOURCES, PREP_RESOURCES, rolesForIndustry, YEAR_LENSES,
    DEGREE_LEVELS, DEGREE_FILTERS, STANFORD_MAJORS, STANFORD_MINORS, GRAD_CLASS_YEARS, GPA_BUCKETS,
    alumniBase, giveBackRate, contributionsByMajor, contributionsByGradYear,
    seedAlerts, search,
    totalReports,
    MONTHS: ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
  };
})();
