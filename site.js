// Polaris site: sticky nav border, scroll reveal, the "Get early access" lead event and funnel events.
const PAGE = (location.pathname.match(/\/([a-z0-9-]+)(?:\.html)?$/) || [, "home"])[1].replace(/^index$/, "home");
const T = (name, params, once) => window.polarisTrack && window.polarisTrack(name, params, { once: !!once });
(() => {
  const nav = document.getElementById("nav");
  if (nav) {
    const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 8);
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  const items = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    items.forEach((el) => io.observe(el));
  } else items.forEach((el) => el.classList.add("in"));
 
  // There is no waitlist any more (11/17/26): "Get early access" opens the web app's sign-up. A tap on it is the
  // site's lead (once per page view, never with any personal data); the app counts the sign-up itself.
  document.querySelectorAll('a[href="app/"]').forEach((a) => a.addEventListener("click", () => T("generate_lead", { page: PAGE }, true)));

  // "Built for where you are" on phones: one card at a time. The chips scroll to a card; swiping updates the chips.
  const pick = document.querySelectorAll(".who-pick [data-who]"), track = document.querySelector(".who-cards");
  if (pick.length && track) {
    const mark = (i) => pick.forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.who === i)));
    pick.forEach((b) => b.addEventListener("click", () => { const c = track.children[+b.dataset.who]; track.scrollTo({ left: c.offsetLeft - track.offsetLeft, behavior: "smooth" }); mark(+b.dataset.who); T("select_content", { content_type: "who", item_id: b.textContent, page: PAGE }); }));
    track.addEventListener("scroll", () => { const w = track.clientWidth || 1; mark(Math.round(track.scrollLeft / w)); }, { passive: true });
  }
})();

// Compare tables: on phones only one table shows at a time, picked with the tabs (Training / Food / Recovery).
(() => {
  const tabs = document.querySelectorAll(".vs-tabs [data-vs]");
  const tables = document.querySelectorAll("table.vs");
  // Each cell gets its row and column names, so the stacked phone layout can label them. Every page with a compare
  // table needs this, tabs or not (the food page has one table and no tabs).
  tables.forEach((t) => {
    const cols = [...t.querySelectorAll("thead th")].map((th) => th.textContent.trim());
    t.querySelectorAll("tbody tr").forEach((tr) => {
      tr.dataset.row = tr.querySelector("th").textContent.trim();
      tr.querySelectorAll("td").forEach((td, i) => { td.dataset.col = cols[i + 1] || ""; });
    });
  });
  // Phones show a two-column head-to-head: Polaris vs the one alternative picked in the "Compare with" switch.
  const alt = document.querySelector(".vs-alt"), wrap = document.querySelector(".vs-wrap");
  const altBtns = alt ? alt.querySelectorAll("[data-alt]") : [];
  // Button text is the short column name ("vs a PT"); the full name stays in the column header.
  const label = (t) => { const ths = t.querySelectorAll("thead th"); altBtns.forEach((b) => { const th = ths[+b.dataset.alt + 1]; b.textContent = th ? "vs " + (th.dataset.short || th.textContent.trim()) : ""; b.dataset.full = th ? th.textContent.trim() : ""; b.hidden = !th; }); };
  const setAlt = (n) => { if (wrap) wrap.dataset.alt = n; altBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.alt === n))); };
  const show = (k) => {
    tabs.forEach((b) => b.setAttribute("aria-selected", String(b.dataset.vs === k)));
    tables.forEach((t) => t.classList.toggle("on", t.dataset.vsTable === k));
    const t = [...tables].find((x) => x.dataset.vsTable === k);
    if (t) { label(t); }
    setAlt("1");
  };
  if (!tabs.length) { const t = tables[0]; if (t) { label(t); } altBtns.forEach((b) => b.addEventListener("click", () => setAlt(b.dataset.alt))); return; }
  altBtns.forEach((b) => b.addEventListener("click", () => { setAlt(b.dataset.alt); T("select_content", { content_type: "compare_with", item_id: b.dataset.full, page: PAGE }); }));
  tabs.forEach((b) => b.addEventListener("click", () => { show(b.dataset.vs); T("select_content", { content_type: "compare_tab", item_id: b.dataset.vs, page: PAGE }); }));
  show("train");
})();

// Funnel events: sections seen (half on screen, once each), CTA clicks, FAQ opens, scroll depth 50/90, video starts.
(() => {
  const sectionName = (el) => el.classList.contains("hero") ? "hero" : el.id || el.classList[0] || "section";
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { T("view_content", { content_name: PAGE, section: sectionName(e.target) }, true); io.unobserve(e.target); } }), { threshold: 0.5 });
    document.querySelectorAll("main > section").forEach((s) => io.observe(s));
  }
  document.addEventListener("click", (e) => {
    const a = e.target.closest("[data-cta]"); if (!a) return;
    const sec = a.closest("section, header, footer");
    T("cta_click", { cta_id: a.dataset.cta, cta_location: sec ? (sec.id || (sec.classList.contains("hero") ? "hero" : sec.tagName.toLowerCase())) : "page", page: PAGE });
  });
  document.querySelectorAll(".faq details").forEach((d, i) => d.addEventListener("toggle", () => { if (d.open) T("select_content", { content_type: "faq", item_id: "q" + (i + 1), page: PAGE }); }));
  const marks = [50, 90];
  const onScroll = () => {
    const h = document.documentElement.scrollHeight - innerHeight; if (h <= 0) return;
    const pct = (scrollY / h) * 100;
    marks.forEach((m) => { if (pct >= m) T("scroll", { percent_scrolled: m, page: PAGE }, true); });
  };
  addEventListener("scroll", onScroll, { passive: true });
  document.querySelectorAll("video").forEach((v) => v.addEventListener("play", () => T("video_start", { video_title: (v.getAttribute("src") || "").split("/").pop().replace(/\.[a-z0-9]+$/, ""), page: PAGE }, true)));
})();

// Star trail (home hero): Polaris sits still and every other star draws an arc around it, like a long exposure.
// The arcs grow once on load, then the whole sky turns very slowly. Drawn once and held still for reduced motion.
(() => {
  const c = document.getElementById("trail"); if (!c || !c.getContext) return;
  const ctx = c.getContext("2d"), still = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  let seed = 7; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  const N = 9, stars = Array.from({ length: N }, (_, i) => ({ r: 0.12 + 0.88 * (i + 1) / N, a: rnd() * Math.PI * 2, len: (0.5 + rnd() * 0.6) * Math.PI / 2, o: 0.14 + rnd() * 0.24 }));
  let w = 0, h = 0, t0 = 0, raf = 0, seen = true;
  const size = () => { const d = Math.min(window.devicePixelRatio || 1, 2); w = c.clientWidth; h = c.clientHeight; c.width = w * d; c.height = h * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
  const draw = (ms) => {
    if (!t0) t0 = ms; const t = (ms - t0) / 1000, grow = still ? 1 : Math.min(1, t / 3.2), ease = 1 - Math.pow(1 - grow, 3), spin = still ? 0 : t * 0.012;
    const wide = w > 900, cx = w * (wide ? 0.72 : 0.84), cy = h * (wide ? 0.36 : 0.13), R = Math.max(w, h) * (wide ? 0.62 : 0.7);
    ctx.clearRect(0, 0, w, h); ctx.lineCap = "round"; ctx.lineWidth = 1;
    for (const s of stars) { ctx.strokeStyle = "rgba(243,239,232," + s.o + ")"; ctx.beginPath(); ctx.arc(cx, cy, s.r * R, s.a + spin, s.a + spin + s.len * ease); ctx.stroke(); }
    ctx.fillStyle = "#F3EFE8"; ctx.beginPath(); ctx.arc(cx, cy, 3.2, 0, Math.PI * 2); ctx.fill();
    if (!still && seen) raf = requestAnimationFrame(draw);
  };
  const start = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); };
  size(); start();
  addEventListener("resize", () => { size(); start(); });
  if ("IntersectionObserver" in window) new IntersectionObserver((es) => { seen = es[0].isIntersecting; if (seen) start(); }).observe(c);
})();

