/* =========================================================================
   Intern·vention — global store (client-side "backend")
   Persists to localStorage so the prototype keeps state across refreshes.
   ========================================================================= */
const IV_KEY = "iv_state_v1";

const IV_DEFAULT = {
  auth: { signedIn: false, name: "", email: "", returning: false },
  contributions: [],       // submitted contribution records
  follows: { openai: true },
  postVotes: {},           // id -> 1 | -1
  pollVotes: {},           // postId -> optionIndex
  commentVotes: {},        // commentId -> 1 | -1
  userPosts: {},           // scope -> [post]
  userComments: {},        // postId -> [comment]
  userReplies: {},         // parentCommentId -> [reply]
  editedPosts: {},         // postId -> { title?, body? }
  editedComments: {},      // commentId -> { body }
  deletedComments: {},     // commentId -> true (tombstone for seed comments)
  userCompanies: [],       // companies added by the user (approved)
  companyRequests: [],     // pending/approved/rejected new-company submissions
  applications: [],        // (legacy, unused)
  alerts: [],              // notifications feed
  bonusKarma: 0,           // karma from awards given/received in-session
  launchMode: false,       // fresh-launch preview: hides all seeded demo data
  visibility: { name: false, company: false }, // opt-in to show identity on the Mentorboard
  username: "",            // chosen at sign-up; the public handle (u/<username>)
  flairs: [],              // company slugs the user chose to show as flairs
  profile: { major: "", gradYear: "", gpa: "", set: false }, // set at sign-up; gpa skipped once graduated
  cycleReports: {},        // cycle -> recruiting summary (industry, roles, platforms, etc.)
  seenWelcome: false,
};

function loadState() {
  try {
    const raw = localStorage.getItem(IV_KEY);
    if (raw) return { ...IV_DEFAULT, ...JSON.parse(raw) };
  } catch (e) {}
  return { ...IV_DEFAULT };
}

// thread width persists separately (UI-only, changes often during drag)
const TW_KEY = "iv_thread_w";
function loadThreadW() {
  const v = parseInt(localStorage.getItem(TW_KEY), 10);
  return Number.isFinite(v) ? Math.min(560, Math.max(300, v)) : 360;
}

const StoreCtx = createContext(null);
function useStore() { return useContext(StoreCtx); }

function computeKarma(state) {
  let k = state.contributions.length * 120;
  Object.values(state.userPosts).forEach((arr) => arr.forEach((p) => { k += 15 + Math.max(0, (p.votes || 1) - 1); }));
  Object.values(state.userComments).forEach((arr) => { k += arr.length * 8; });
  Object.values(state.userReplies || {}).forEach((arr) => { k += arr.filter((r) => r.author === "you").length * 8; });
  k += state.bonusKarma;
  return k;
}

function StoreProvider({ children }) {
  const [state, setState] = useState(loadState);
  const [threadW, setThreadWState] = useState(loadThreadW);
  const timers = useRef([]);

  // keep the data-layer launch flag in sync synchronously, before children render
  IV.setLaunch(state.launchMode);

  useEffect(() => {
    try { localStorage.setItem(IV_KEY, JSON.stringify(state)); } catch (e) {}
  }, [state]);
  useEffect(() => {
    document.documentElement.style.setProperty("--thread-w", threadW + "px");
    try { localStorage.setItem(TW_KEY, String(threadW)); } catch (e) {}
  }, [threadW]);

  // re-register user-added companies into the data layer on load
  useEffect(() => {
    (state.userCompanies || []).forEach((c) => IV.registerCompany(c));
    // re-register still-pending / rejected company requests so contributions resolve
    (state.companyRequests || []).forEach((r) => {
      if (r.status !== "approved") IV.registerPending({ slug: r.slug, name: r.name, industry: r.industry, reports: 0, logo: r.name[0].toUpperCase(), bg: r.bg, domain: r.domain, trend: 0, userAdded: true, pending: true });
    });
  }, []);

  // --- simulated inbound replies: makes the reply→alert→return loop feel real ---
  const SIM_REPLIERS = ["winter_grind", "sleepless_jr", "oa_szn_done", "behavioral_tips", "cold_email_god", "intern_24"];
  const SIM_POST_REPLIES = [
    "This is super helpful — how long did the whole process take you?",
    "Saving this. Did the referral come from an alum or a friend?",
    "Following! Anyone know if this is still the timeline this cycle?",
    "Thanks for posting this, exactly what I needed to hear today.",
  ];
  const SIM_COMMENT_REPLIES = [
    "Appreciate you replying — that actually answers my question.",
    "Wait really? That changes my whole plan, thank you.",
    "This is gold. Following up on this.",
  ];
  const simPick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  function scheduleInboundReply({ kind, scope, postId, parentId }) {
    const actor = simPick(SIM_REPLIERS);
    const delay = 7000 + Math.random() * 6000;
    const t = setTimeout(() => {
      const reply = {
        id: "sim-" + Math.random().toString(36).slice(2), author: actor, time: "now",
        body: kind === "comment" ? simPick(SIM_COMMENT_REPLIES) : simPick(SIM_POST_REPLIES),
        votes: 1, scope, postId,
      };
      setState((s) => {
        const al = {
          id: "al-" + Math.random().toString(36).slice(2), type: "reply", actor,
          title: kind === "comment" ? "replied to your comment" : "replied to your post",
          body: "“" + reply.body + "”", scope, postId, ts: Date.now(), read: false,
        };
        if (kind === "comment" && parentId)
          return { ...s, userReplies: { ...s.userReplies, [parentId]: [...(s.userReplies[parentId] || []), reply] }, alerts: [al, ...s.alerts] };
        return { ...s, userComments: { ...s.userComments, [postId]: [...(s.userComments[postId] || []), reply] }, alerts: [al, ...s.alerts] };
      });
    }, delay);
    timers.current.push(t);
  }
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const api = useMemo(() => ({
    state,
    // ---- auth (Stanford SUNet via Google) is separate from unlock ----
    signedIn: () => state.auth.signedIn,
    // unlocked = verified identity AND you've given a contribution (give-to-get)
    unlocked: () => state.auth.signedIn && state.contributions.length > 0,
    signIn: (acct) =>
      setState((s) => {
        const auth = { signedIn: true, name: acct.name, email: acct.email, returning: !!acct.returning };
        let contributions = s.contributions;
        let username = s.username;
        let flairs = s.flairs;
        if (acct.returning && contributions.length === 0) {
          // returning member: their prior contributions are on record server-side
          contributions = [
            { slug: "openai", role: "SWE Intern", major: "Computer Science", year: "Senior", advice: "Cold-applied early Sept, heard back in 4 weeks.", at: Date.now() - 86400000 * 40 },
            { slug: "jane-street", role: "Quant Trading Intern", major: "Math + CS", year: "Senior", advice: "", at: Date.now() - 86400000 * 55 },
          ];
          if (!username) username = "leland_j";
          flairs = ["co:openai"];
        }
        if (acct.username) username = acct.username;
        const alerts = s.alerts.length ? s.alerts : IV.seedAlerts();
        return { ...s, auth, contributions, alerts, username, flairs };
      }),
    setUsername: (u) => setState((s) => ({ ...s, username: u })),
    username: () => state.username || "you",
    signOut: () =>
      setState((s) => ({ ...s, auth: { signedIn: false, name: "", email: "", returning: false } })),

    isFollowing: (slug) => !!state.follows[slug],
    toggleFollow: (slug) =>
      setState((s) => ({ ...s, follows: { ...s.follows, [slug]: !s.follows[slug] } })),

    votePost: (id, dir) =>
      setState((s) => {
        const cur = s.postVotes[id] || 0;
        const next = cur === dir ? 0 : dir;
        const pv = { ...s.postVotes };
        if (next === 0) delete pv[id]; else pv[id] = next;
        return { ...s, postVotes: pv };
      }),
    postVote: (id) => state.postVotes[id] || 0,

    voteComment: (id, dir) =>
      setState((s) => {
        const cur = s.commentVotes[id] || 0;
        const next = cur === dir ? 0 : dir;
        const cv = { ...s.commentVotes };
        if (next === 0) delete cv[id]; else cv[id] = next;
        return { ...s, commentVotes: cv };
      }),
    commentVote: (id) => state.commentVotes[id] || 0,

    votePoll: (postId, idx) =>
      setState((s) => ({ ...s, pollVotes: { ...s.pollVotes, [postId]: idx } })),
    pollVote: (postId) => (postId in state.pollVotes ? state.pollVotes[postId] : null),

    addPost: (scope, post) => {
      setState((s) => ({
        ...s,
        userPosts: { ...s.userPosts, [scope]: [post, ...(s.userPosts[scope] || [])] },
      }));
      scheduleInboundReply({ kind: "post", scope, postId: post.id });
    },
    getUserPosts: (scope) => state.userPosts[scope] || [],

    addComment: (postId, comment) => {
      setState((s) => ({
        ...s,
        userComments: { ...s.userComments, [postId]: [...(s.userComments[postId] || []), comment] },
      }));
      scheduleInboundReply({ kind: "post", scope: comment.scope, postId });
    },
    getUserComments: (postId) => state.userComments[postId] || [],

    // ---- nested replies (to any comment, seed or user) ----
    addReply: (parentId, reply) => {
      setState((s) => ({
        ...s,
        userReplies: { ...s.userReplies, [parentId]: [...(s.userReplies[parentId] || []), reply] },
      }));
      scheduleInboundReply({ kind: "comment", scope: reply.scope, postId: reply.postId, parentId });
    },
    getReplies: (parentId) => state.userReplies[parentId] || [],

    // ---- edit / delete your own posts & comments ----
    editPost: (scope, id, patch) =>
      setState((s) => ({
        ...s,
        userPosts: { ...s.userPosts, [scope]: (s.userPosts[scope] || []).map((p) => p.id === id ? { ...p, ...patch, edited: true } : p) },
      })),
    deletePost: (scope, id) =>
      setState((s) => ({
        ...s,
        userPosts: { ...s.userPosts, [scope]: (s.userPosts[scope] || []).filter((p) => p.id !== id) },
      })),
    editComment: (postId, id, body) =>
      setState((s) => {
        // user-authored comment?
        const list = s.userComments[postId] || [];
        if (list.some((c) => c.id === id)) {
          return { ...s, userComments: { ...s.userComments, [postId]: list.map((c) => c.id === id ? { ...c, body, edited: true } : c) } };
        }
        // reply?
        let inReplies = null;
        Object.keys(s.userReplies).forEach((pid) => { if ((s.userReplies[pid] || []).some((r) => r.id === id)) inReplies = pid; });
        if (inReplies) {
          return { ...s, userReplies: { ...s.userReplies, [inReplies]: s.userReplies[inReplies].map((r) => r.id === id ? { ...r, body, edited: true } : r) } };
        }
        return s;
      }),
    deleteComment: (postId, id) =>
      setState((s) => {
        const list = s.userComments[postId] || [];
        if (list.some((c) => c.id === id)) {
          return { ...s, userComments: { ...s.userComments, [postId]: list.filter((c) => c.id !== id) } };
        }
        let inReplies = null;
        Object.keys(s.userReplies).forEach((pid) => { if ((s.userReplies[pid] || []).some((r) => r.id === id)) inReplies = pid; });
        if (inReplies) {
          return { ...s, userReplies: { ...s.userReplies, [inReplies]: s.userReplies[inReplies].filter((r) => r.id !== id) } };
        }
        return s;
      }),

    // ---- user-added companies (post-approval) ----
    addCompany: (c) => {
      IV.registerCompany(c);
      setState((s) => ({ ...s, userCompanies: [c, ...s.userCompanies] }));
    },
    userCompanies: () => state.userCompanies,

    // ---- company verification requests (Levels.fyi-style review queue) ----
    requestCompany: (req) => {
      const full = { ...req, id: "req-" + Math.random().toString(36).slice(2), status: "pending", at: Date.now() };
      IV.registerPending({ slug: full.slug, name: full.name, industry: full.industry, reports: 0, logo: full.name[0].toUpperCase(), bg: full.bg, domain: full.domain, trend: 0, userAdded: true, pending: true });
      setState((s) => ({ ...s, companyRequests: [full, ...s.companyRequests] }));
      return full;
    },
    companyRequests: () => state.companyRequests,
    requestForSlug: (slug) => state.companyRequests.find((r) => r.slug === slug),
    // demo: simulate the review team approving / rejecting
    reviewCompanyRequest: (id, decision) =>
      setState((s) => {
        const req = s.companyRequests.find((r) => r.id === id);
        if (!req) return s;
        const requests = s.companyRequests.map((r) => r.id === id ? { ...r, status: decision, reviewedAt: Date.now() } : r);
        let userCompanies = s.userCompanies;
        let alerts = s.alerts;
        let contributions = s.contributions;
        const nReports = s.contributions.filter((c) => c.slug === req.slug).length;
        if (decision === "approved") {
          IV.unregisterPending(req.slug);
          const company = {
            slug: req.slug, name: req.name, industry: req.industry,
            reports: Math.max(1, nReports), logo: req.name[0].toUpperCase(),
            bg: req.bg, domain: req.domain, trend: 1, userAdded: true,
          };
          IV.registerCompany(company);
          userCompanies = [company, ...s.userCompanies];
          contributions = s.contributions.map((c) => c.slug === req.slug ? { ...c, pendingCompany: false } : c);
          alerts = [{ id: "al-" + Math.random().toString(36).slice(2), type: "newcontrib", title: "Your company was approved", body: `${req.name} is now live with your report — thanks for starting it off.`, slug: req.slug, ts: Date.now(), read: false }, ...s.alerts];
        } else {
          alerts = [{ id: "al-" + Math.random().toString(36).slice(2), type: "badge", title: "Company request not approved", body: `${req.name} was a likely duplicate or couldn't be verified. Your story is saved — you can move it to an existing company.`, ts: Date.now(), read: false }, ...s.alerts];
        }
        return { ...s, companyRequests: requests, userCompanies, alerts, contributions };
      }),

    // ---- My Cycle (personal application tracker) ----
    applications: () => state.applications,
    addApplication: (app) =>
      setState((s) => ({ ...s, applications: [{ ...app, id: app.id || "ac-" + Math.random().toString(36).slice(2), updated: Date.now() }, ...s.applications] })),
    updateApplication: (id, patch) =>
      setState((s) => ({ ...s, applications: s.applications.map((a) => a.id === id ? { ...a, ...patch, updated: Date.now() } : a) })),
    moveStage: (id, stage) =>
      setState((s) => ({ ...s, applications: s.applications.map((a) => a.id === id ? { ...a, stage, result: null, updated: Date.now() } : a) })),
    setResult: (id, result) =>
      setState((s) => ({ ...s, applications: s.applications.map((a) => a.id === id ? { ...a, result, updated: Date.now() } : a) })),
    removeApplication: (id) =>
      setState((s) => ({ ...s, applications: s.applications.filter((a) => a.id !== id) })),

    // ---- awards (karma gifting) ----
    award: (amount) => setState((s) => ({ ...s, bonusKarma: s.bonusKarma + (amount || 0) })),

    // ---- karma + badges for the current user ----
    myKarma: () => computeKarma(state),
    myBadges: () => {
      const b = [];
      if (!(state.auth.signedIn && state.contributions.length > 0)) return b;
      b.push("verified");
      b.push("senior"); // demo user is Class of '25
      const posts = Object.values(state.userPosts).reduce((a, arr) => a + arr.length, 0);
      const advised = state.contributions.some((c) => c.advice && c.advice.length > 0);
      if (advised) b.push("storyteller");
      if (posts >= 1) b.push("starter");
      if (computeKarma(state) >= 200) b.push("mentor");
      return b;
    },

    contribute: (record) =>
      setState((s) => ({
        ...s,
        contributions: [{ ...record, pendingCompany: IV.isPending(record.slug), at: record.at || Date.now() }, ...s.contributions],
      })),
    removeContribution: (at) =>
      setState((s) => ({ ...s, contributions: s.contributions.filter((c) => c.at !== at) })),
    editContribution: (at, patch) =>
      setState((s) => ({ ...s, contributions: s.contributions.map((c) => c.at === at ? { ...c, ...patch } : c) })),

    // ---- alerts / notifications ----
    alerts: () => state.alerts,
    unreadCount: () => state.alerts.filter((a) => !a.read).length,
    markAlertRead: (id) =>
      setState((s) => ({ ...s, alerts: s.alerts.map((a) => a.id === id ? { ...a, read: true } : a) })),
    markAllAlertsRead: () =>
      setState((s) => ({ ...s, alerts: s.alerts.map((a) => ({ ...a, read: true })) })),

    relock: () => setState((s) => ({ ...s, auth: { ...s.auth, signedIn: false } })),

    markWelcome: () => setState((s) => ({ ...s, seenWelcome: true })),
    reset: () => setState({ ...IV_DEFAULT }),

    // ---- fresh-launch preview (hide all seeded demo data) ----
    launchMode: state.launchMode,
    setLaunchMode: (v) => { IV.setLaunch(v); setState((s) => ({ ...s, launchMode: !!v })); },

    // ---- profile (major / grad year / gpa) ----
    profile: state.profile || { major: "", gradYear: "", gpa: "", set: false },
    setProfile: (patch) => setState((s) => ({ ...s, profile: { ...(s.profile || {}), ...patch, set: true, confirmedYear: 2026 } })),
    profileStale: () => {
      const p = state.profile || {};
      if (!p.set) return false;
      if (p.gradYear && p.gradYear !== "Already graduated") {
        const y = parseInt(String(p.gradYear).replace(/\D/g, ""), 10);
        if (Number.isFinite(y) && y < 2026) return false; // already graduated → no re-confirm
      }
      return (p.confirmedYear || 0) < 2026;
    },
    confirmProfile: () => setState((s) => ({ ...s, profile: { ...(s.profile || {}), confirmedYear: 2026 } })),
    hasGraduated: () => {
      const gy = (state.profile || {}).gradYear;
      if (!gy) return false;
      if (gy === "Already graduated") return true;
      const y = parseInt(gy.replace(/\D/g, ""), 10);
      return Number.isFinite(y) && y < 2026;
    },
    cycleReport: (cycle) => (state.cycleReports || {})[cycle] || null,
    saveCycleReport: (cycle, data) => setState((s) => ({ ...s, cycleReports: { ...(s.cycleReports || {}), [cycle]: { ...((s.cycleReports || {})[cycle] || {}), ...data } } })),

    // ---- mentor identity / visibility opt-in ----
    mentorPoints: () => computeKarma(state),
    visibility: state.visibility || { name: false, company: false },
    setVisibility: (patch) => setState((s) => ({ ...s, visibility: { ...(s.visibility || {}), ...patch } })),
    // flairs (typed): "co:<slug>" | "major:<Major>" | "year:<GradYear>"
    flairs: state.flairs || [],
    flairOptions: () => {
      const companies = [], majors = [], cseen = [], mseen = [];
      state.contributions.forEach((c) => {
        if (!cseen.includes(c.slug)) { cseen.push(c.slug); companies.push({ value: "co:" + c.slug, company: IV.getCompany(c.slug), label: "ex-" + IV.getCompany(c.slug).name }); }
        if (c.major && !mseen.includes(c.major)) { mseen.push(c.major); majors.push({ value: "major:" + c.major, label: c.major }); }
      });
      const years = ["2025", "2026", "2027", "2028"].map((y) => ({ value: "year:" + y, label: "Class of " + y }));
      return { companies, majors, years };
    },
    toggleFlair: (value) => setState((s) => {
      const cur = s.flairs || [];
      return { ...s, flairs: cur.includes(value) ? cur.filter((x) => x !== value) : [...cur, value] };
    }),
    myMentorCompany: () => {
      // the company you've contributed to most (for "ex-X" flair)
      const counts = {};
      state.contributions.forEach((c) => { counts[c.slug] = (counts[c.slug] || 0) + 1; });
      const top = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
      return top ? IV.getCompany(top).name : null;
    },

    // ---- thread width (resizable Community Thread) ----
    threadW,
    setThreadW: (w) => setThreadWState(Math.min(560, Math.max(300, Math.round(w)))),
  }), [state, threadW]);

  return <StoreCtx.Provider value={api}>{children}</StoreCtx.Provider>;
}

Object.assign(window, { StoreProvider, useStore });
