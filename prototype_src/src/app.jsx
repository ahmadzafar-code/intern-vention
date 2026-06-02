/* =========================================================================
   Intern·vention — App root: router, top nav, tweaks, mount
   ========================================================================= */

/* ---------------------------------------------------------- Router */
const NavCtx = createContext(null);
function useNav() { return useContext(NavCtx); }

function parseHash() {
  const h = (location.hash || "#/").replace(/^#/, "");
  const parts = h.split("/").filter(Boolean);
  if (parts.length === 0) return { name: "directory" };
  if (parts[0] === "company") return { name: "company", slug: parts[1] || "openai" };
  if (parts[0] === "contribute") return { name: "contribute", slug: parts[1] };
  if (parts[0] === "community") return { name: "community", scope: decodeURIComponent(parts[1] || "__main__") };
  if (parts[0] === "contributions") return { name: "contributions" };
  if (parts[0] === "alerts") return { name: "alerts" };
  if (parts[0] === "mentorboard") return { name: "mentorboard" };
  if (parts[0] === "thread") return { name: "thread", scope: decodeURIComponent(parts[1] || "__main__"), postId: parts[2] };
  return { name: "directory" };
}
function formatHash(route) {
  if (!route || route.name === "directory") return "#/";
  if (route.name === "company") return `#/company/${route.slug}`;
  if (route.name === "contribute") return route.slug ? `#/contribute/${route.slug}` : "#/contribute";
  if (route.name === "community") return `#/community/${encodeURIComponent(route.scope)}`;
  if (route.name === "contributions") return "#/contributions";
  if (route.name === "alerts") return "#/alerts";
  if (route.name === "mentorboard") return "#/mentorboard";
  if (route.name === "thread") return `#/thread/${encodeURIComponent(route.scope)}/${route.postId}`;
  return "#/";
}

/* ---------------------------------------------------------- Top nav */
function TopNav({ route }) {
  const nav = useNav();
  const store = useStore();
  const auth = useAuth();
  const toast = useToast();
  const [menu, setMenu] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setMenu(false); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, []);
  const signedIn = store.signedIn();
  const unlocked = store.unlocked();
  const acct = store.state.auth;
  const initials = acct.name ? acct.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase() : "YOU";
  const active = route.name === "directory" || route.name === "company" ? "companies" : route.name === "community" ? "community" : route.name === "contributions" ? "me" : route.name === "alerts" ? "alerts" : route.name === "mentorboard" ? "mentorboard" : "";
  const unread = store.signedIn() ? store.unreadCount() : 0;
  return (
    <nav className="topnav">
      <button className="brand" onClick={() => nav.go({ name: "directory" })}>Intern<span className="dot">·</span>vention</button>
      <button className="nav-search" onClick={() => nav.openSearch()}>
        <Icon name="search" size={14} /> Search companies, roles, majors…
        <kbd className="nav-search-kbd">⌘K</kbd>
      </button>
      <div className="nav-right">
        <a className={active === "companies" ? "active" : ""} onClick={() => nav.go({ name: "directory" })}>Companies</a>
        <a className={active === "community" ? "active" : ""} onClick={() => nav.go({ name: "community", scope: "__main__" })}>Community</a>
        <a className={active === "mentorboard" ? "active" : ""} onClick={() => nav.go({ name: "mentorboard" })}>Mentorboard</a>
        <a className={active === "me" ? "active" : ""} onClick={() => nav.go({ name: "contributions" })}>My Contributions</a>
        <a className={"nav-alerts" + (active === "alerts" ? " active" : "")} onClick={() => signedIn ? nav.go({ name: "alerts" }) : auth.openSignIn({ onDone: () => nav.go({ name: "alerts" }) })}>
          Alerts{unread > 0 && <span className="nav-badge">{unread}</span>}
        </a>
        {!signedIn ? (
          <button className="signin-nav-btn" onClick={() => auth.openSignIn()}>Sign in</button>
        ) : (
          <div className="avatar-wrap" ref={ref}>
            <Avatar text={initials} size={30} onClick={() => setMenu(!menu)} title="Account" />
            {menu && (
              <div className="acct-menu">
                <div className="acct-head">
                  {acct.name}
                  <span>{acct.email}</span>
                </div>
                <div className="acct-status">
                  {unlocked
                    ? <React.Fragment><Icon name="check-circle" size={13} /> Unlocked · {store.state.contributions.length} contribution{store.state.contributions.length === 1 ? "" : "s"}</React.Fragment>
                    : <React.Fragment><Icon name="lock" size={13} /> Verified — not yet contributed</React.Fragment>}
                </div>
                {!unlocked && (
                  <button onClick={() => { setMenu(false); nav.go({ name: "contribute" }); }}><Icon name="plus" size={13} /> Contribute &amp; unlock</button>
                )}
                <button onClick={() => { store.signOut(); setMenu(false); toast("Signed out", { icon: "user" }); }}><Icon name="arrow-left" size={13} /> Sign out</button>
                <button onClick={() => { store.reset(); setMenu(false); toast("Demo reset", { icon: "check" }); }}><Icon name="x" size={13} /> Reset everything</button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

/* ---------------------------------------------------------- Tweaks */
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#8C1515",
  "headFont": "editorial",
  "density": "regular",
  "radius": 10,
  "playful": true,
  "showTrending": true
}/*EDITMODE-END*/;

const HEAD_FONTS = {
  editorial: '"Iowan Old Style", "Charter", Georgia, serif',
  modern: '"Spectral", Georgia, serif',
  grotesk: '"Space Grotesk", "Helvetica Neue", sans-serif',
};

function applyTweaks(t) {
  const r = document.documentElement;
  r.style.setProperty("--accent", t.accent);
  r.style.setProperty("--head-font", HEAD_FONTS[t.headFont] || HEAD_FONTS.editorial);
  r.style.setProperty("--radius", t.radius + "px");
  document.body.classList.toggle("playful", !!t.playful);
  document.body.classList.toggle("hide-trending", !t.showTrending);
  document.body.classList.remove("density-compact", "density-regular", "density-comfy");
  document.body.classList.add("density-" + t.density);
}

function AppTweaks() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const store = useStore();
  useEffect(() => { applyTweaks(t); }, [t]);
  return (
    <TweaksPanel>
      <TweakSection label="Brand" />
      <TweakColor label="Accent" value={t.accent}
        options={["#8C1515", "#1E5BA8", "#1F7A4D", "#6D28D9", "#C2502F"]}
        onChange={(v) => setTweak("accent", v)} />
      <TweakRadio label="Headings" value={t.headFont} options={["editorial", "modern", "grotesk"]}
        onChange={(v) => setTweak("headFont", v)} />
      <TweakSection label="Layout" />
      <TweakRadio label="Density" value={t.density} options={["compact", "regular", "comfy"]}
        onChange={(v) => setTweak("density", v)} />
      <TweakSlider label="Corner radius" value={t.radius} min={4} max={16} step={1} unit="px"
        onChange={(v) => setTweak("radius", v)} />
      <TweakSlider label="Thread width" value={store.threadW} min={300} max={560} step={10} unit="px"
        onChange={(v) => store.setThreadW(v)} />
      <TweakSection label="Vibe" />
      <TweakToggle label="Student energy" value={t.playful} onChange={(v) => setTweak("playful", v)} />
      <TweakToggle label="Show trending" value={t.showTrending} onChange={(v) => setTweak("showTrending", v)} />
      <TweakSection label="Data" />
      <TweakToggle label="Fresh launch (no demo data)" value={store.launchMode} onChange={(v) => store.setLaunchMode(v)} />
      <TweakButton label="Reset everything" secondary onClick={() => { store.reset(); location.hash = "#/"; }} />
    </TweaksPanel>
  );
}

/* ---------------------------------------------------------- App */
function App() {
  const [route, setRoute] = useState(parseHash());
  const [paletteOpen, setPaletteOpen] = useState(false);
  const stack = useRef([]);

  const go = useCallback((next) => {
    stack.current.push(route);
    location.hash = formatHash(next);
    setRoute(next);
    window.scrollTo(0, 0);
    const sc = document.querySelector(".sidebar-scroll"); if (sc) sc.scrollTop = 0;
  }, [route]);

  const back = useCallback(() => {
    const prev = stack.current.pop();
    if (prev) { location.hash = formatHash(prev); setRoute(prev); }
    else { location.hash = "#/"; setRoute({ name: "directory" }); }
  }, []);

  useEffect(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // ⌘K / Ctrl-K opens the command palette anywhere
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault(); setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const navApi = useMemo(() => ({ go, back, route, openSearch: () => setPaletteOpen(true) }), [go, back, route]);

  const store = useStore();
  const L = store.launchMode ? "-L" : "";

  let view;
  if (route.name === "company") view = <CompanyView slug={route.slug} key={route.slug + L} />;
  else if (route.name === "contribute") view = <ContributeView slug={route.slug} key={(route.slug || "pick") + L} />;
  else if (route.name === "community") view = <CommunityHub scope={route.scope} key={"hub-" + route.scope + L} />;
  else if (route.name === "contributions") view = <MyContributionsView key="me" />;
  else if (route.name === "alerts") view = <AlertsView key="alerts" />;
  else if (route.name === "mentorboard") view = <MentorboardView key="mentorboard" />;
  else if (route.name === "thread") view = <PostDetailView scope={route.scope} postId={route.postId} key={route.scope + route.postId} />;
  else view = <DirectoryView key={"dir" + L} />;

  return (
    <NavCtx.Provider value={navApi}>
      <TopNav route={route} />
      {view}
      <AppTweaks />
      {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} />}
    </NavCtx.Provider>
  );
}

function Root() {
  return (
    <StoreProvider>
      <ToastHost>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ToastHost>
    </StoreProvider>
  );
}

Object.assign(window, { NavCtx, useNav, TopNav, App, Root });

ReactDOM.createRoot(document.getElementById("root")).render(<Root />);
