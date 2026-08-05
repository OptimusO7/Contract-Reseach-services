/* ============================================================
   CONTRACT RESEARCH SERVICES — app logic
   A client-side marketplace for contract research experts.
   State lives in localStorage, so everything persists in the
   browser. Payments are simulated.
   ============================================================ */

const STORE_KEY = "crs_v1";
const ADMIN_PASS = "admin";

const CATEGORIES = [
  { id: "clinical",        name: "Clinical Research",  emoji: "🧪" },
  { id: "biostatistics",   name: "Biostatistics",      emoji: "📊" },
  { id: "lab",             name: "Laboratory Services", emoji: "🔬" },
  { id: "regulatory",      name: "Regulatory Affairs",  emoji: "📋" },
  { id: "med-writing",     name: "Medical Writing",     emoji: "✍️" },
  { id: "preclinical",     name: "Preclinical Studies", emoji: "🧬" },
  { id: "market-research", name: "Market Research",     emoji: "📈" },
  { id: "lit-review",      name: "Literature Review",   emoji: "📚" },
];

const GRADS = [
  ["#0C3B2E", "#2E7D5B"], ["#B5651D", "#E3A72F"], ["#3B4A9E", "#6C7BE0"],
  ["#7C3A8E", "#C46BD4"], ["#1E7A6E", "#48C4B0"], ["#A8412F", "#E37A4A"],
  ["#2C5F2D", "#97BC62"], ["#5A2A6E", "#9B59B6"],
];

/* ---------- state ---------- */
let state = null;
let runtime = { adminAuthed: false, activeProviderId: null, catFilter: "all", dashTab: "customer" };

function seed() {
  const now = Date.now();
  const day = 86400000;
  const providers = [
    p("Dr. Ama Boateng","clinical","ama@crs.demo","Kumasi, Ashanti","Clinical trial monitoring done right","Clinical research associate with 8 years across Phase II–IV trials. I run site monitoring, source-data verification and GCP compliance so your study data holds up to any audit.",["GCP","Site monitoring","SDV","Phase II–IV"],95,"approved",4.9,47,52,now-day*400),
    p("Kwesi Mensah","biostatistics","kwesi@crs.demo","Accra","Statistics that survive peer review","Biostatistician for clinical and observational studies. Sample-size calculations, SAP writing, survival analysis and reproducible R/SAS pipelines you can hand to any reviewer.",["R","SAS","SAP","Survival analysis"],110,"approved",4.8,32,38,now-day*300),
    p("Dr. Zainab Ali","lab","zainab@crs.demo","Kumasi, Ashanti","Bioanalytical assays with airtight QC","Analytical chemist running LC-MS/MS and ELISA method development and validation. Every batch ships with full QC documentation and chain-of-custody.",["LC-MS/MS","ELISA","Method validation","QC"],120,"approved",5.0,61,74,now-day*500),
    p("Daniel Osei","regulatory","daniel@crs.demo","Remote","Regulatory submissions, first-time approvals","Regulatory affairs consultant. I assemble IND/CTA and marketing submissions, manage responses to agency questions, and keep your dossier inspection-ready.",["IND/CTA","eCTD","FDA/EMA","Compliance"],130,"approved",4.7,24,27,now-day*220),
    p("Priya Sharma","med-writing","priya@crs.demo","Accra","Clear, compliant medical writing","Medical writer for protocols, clinical study reports and manuscripts. I turn dense data into documents that reviewers and regulators actually enjoy reading.",["Protocols","CSR","Manuscripts","Plain-language"],90,"approved",4.9,38,44,now-day*350),
    p("Dr. Efua Addo","preclinical","efua@crs.demo","Kumasi, Ashanti","Rigorous preclinical & tox studies","Preclinical scientist designing and running in-vivo and in-vitro studies. Pharmacology, toxicology and clean, GLP-aligned study reports.",["In-vivo","Toxicology","GLP","Pharmacology"],115,"approved",4.8,52,58,now-day*280),
    p("Marcus Lee","market-research","marcus@crs.demo","Accra","Healthcare market research with real signal","Market researcher for life-sciences and health. KOL interviews, competitive landscaping and survey design that gives you decisions, not just decks.",["KOL interviews","Surveys","Landscaping","Analysis"],100,"approved",4.6,19,21,now-day*160),
    p("Nadia Owusu","lit-review","nadia@crs.demo","Kumasi, Ashanti","Systematic reviews, done properly","Research librarian and reviewer. PRISMA-compliant systematic reviews, meta-analyses and evidence synthesis with a fully documented search strategy.",["PRISMA","Meta-analysis","Search strategy","Screening"],85,"approved",4.9,41,46,now-day*310),
    // pending applications for the admin queue
    p("Dr. Tunde Bello","clinical","tunde@crs.demo","Accra","Trial start-up without the headaches","Clinical operations lead with 6 years in study start-up, feasibility and site management across West Africa. Clear timelines, no surprises.",["Study start-up","Feasibility","Site management","CTMS"],105,"pending",0,0,0,now-day*2),
    p("Grace Nkrumah","biostatistics","grace@crs.demo","Kumasi, Ashanti","Data management you can trust","Clinical data manager building clean EDC databases, edit checks and query workflows so your database lock is on time and audit-ready.",["EDC","Data management","Edit checks","Validation"],100,"pending",0,0,0,now-day*1),
  ];

  const reviews = [];
  const seededReviews = {
    [providers[0].id]: [["Meridian Bio",5,"Ama caught data issues our last CRA missed. Audit passed with zero findings."],["L. Mensah",5,"Monitored three sites flawlessly and kept the whole study on timeline."]],
    [providers[1].id]: [["Helix Trials",5,"Our SAP sailed through review — the analysis was airtight."],["Ben K.",4,"Rebuilt our stats pipeline in R. Fully reproducible and clean."]],
    [providers[2].id]: [["Adjoa Labs",5,"The assay validation package was the most thorough we've ever received."],["Dr. Owusu",5,"Fast turnaround with complete QC. Impeccable work."]],
    [providers[4].id]: [["Yaw D.",5,"Our CSR went from chaos to submission-ready in two weeks."]],
    [providers[7].id]: [["Ewurama",5,"The systematic review was PRISMA-perfect. Reviewers had nothing to add."]],
  };
  Object.entries(seededReviews).forEach(([pid, list]) => {
    list.forEach((r, i) => reviews.push({
      id: uid("rev"), providerId: pid, customerName: r[0], rating: r[1], comment: r[2],
      date: now - day * (5 + i * 9),
    }));
  });

  // a little history so the ledger + volume aren't empty
  const jobs = [
    job(providers[2].id, providers[2].name, "Helix Trials", "Assay method validation", "Project", 2400, "paid", now-day*12, now-day*10),
    job(providers[0].id, providers[0].name, "Meridian Bio", "Site monitoring visit", "2 days", 1520, "paid", now-day*8, now-day*7),
    job(providers[5].id, providers[5].name, "Novena Pharma", "Toxicology study report", "Project", 3450, "paid", now-day*20, now-day*18),
  ];

  return {
    providers, reviews, jobs,
    session: { name: "Guest" },
  };
}

function p(name, category, email, location, tagline, bio, skills, rate, status, rating, reviewCount, jobsCompleted, joined) {
  return { id: uid("pro"), name, category, email, phone: "", location, tagline, bio, skills, rate, status, rating, reviewCount, jobsCompleted, joined: joined || Date.now() };
}
function job(providerId, providerName, customerName, title, details, amount, status, createdAt, paidAt) {
  return { id: uid("job"), providerId, providerName, customerName, title, details, amount, status, createdAt: createdAt || Date.now(), paidAt: paidAt || null };
}

/* ---------- persistence ---------- */
function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  const s = seed();
  try { localStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch (e) {}
  return s;
}
function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {}
}

/* ---------- helpers ---------- */
function uid(prefix) { return (prefix || "id") + "_" + Math.random().toString(36).slice(2, 9); }
function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
function money(n) { return "$" + Number(n).toLocaleString("en-US"); }
function firstName(name){var parts=String(name||"").trim().split(/\s+/);var honor=/^(dr|prof|mr|mrs|ms|miss|sir|dame)\.?$/i;while(parts.length>1&&honor.test(parts[0]))parts.shift();return parts[0]||String(name||"");}
function cat(id) { return CATEGORIES.find(c => c.id === id) || { name: id, emoji: "•" }; }
function initials(name) { return name.split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase(); }
function grad(seed) {
  let h = 0; for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return GRADS[h % GRADS.length];
}
function avatar(name, cls) {
  const [a, b] = grad(name);
  return `<div class="avatar ${cls || ""}" style="background:linear-gradient(135deg,${a},${b})">${esc(initials(name))}</div>`;
}
function starStr(rating) {
  const r = Math.round(rating);
  return "★".repeat(r) + "☆".repeat(5 - r);
}
function timeAgo(ts) {
  if (!ts) return "";
  const d = Date.now() - ts, day = 86400000;
  if (d < 3600000) return Math.max(1, Math.round(d / 60000)) + "m ago";
  if (d < day) return Math.round(d / 3600000) + "h ago";
  if (d < day * 30) return Math.round(d / day) + "d ago";
  return Math.round(d / (day * 30)) + "mo ago";
}
function approvedProviders() { return state.providers.filter(p => p.status === "approved"); }
function providerReviews(id) { return state.reviews.filter(r => r.providerId === id).sort((a, b) => b.date - a.date); }
function providerJobs(id) { return state.jobs.filter(j => j.providerId === id).sort((a, b) => b.createdAt - a.createdAt); }
function customerJobs(name) { return state.jobs.filter(j => j.customerName === name).sort((a, b) => b.createdAt - a.createdAt); }

/* ---------- view routing ---------- */
const views = ["home", "browse", "provider", "apply", "admin", "dashboard"];
function showView(name, scroll = true) {
  views.forEach(v => {
    const el = document.getElementById("view-" + v);
    if (el) el.hidden = v !== name;
  });
  if (scroll) window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  closeMobileNav();
}

/* ============================================================
   RENDER: HOME
   ============================================================ */
function renderHome() {
  // hero chips
  document.getElementById("heroChips").innerHTML =
    CATEGORIES.slice(0, 6).map(c => `<button class="hero-chip" data-cat="${c.id}">${c.emoji} ${c.name}</button>`).join("");

  // featured pro (top rated)
  const featured = approvedProviders().slice().sort((a, b) => b.rating - a.rating)[0];
  const fEl = document.getElementById("heroFeatured");
  if (featured) {
    fEl.innerHTML = `
      <div class="pro-top" style="margin-top:6px">
        ${avatar(featured.name)}
        <div>
          <div class="pro-name-row"><span class="pro-name">${esc(featured.name)}</span>${sealSvg()}</div>
          <div class="pro-cat">${cat(featured.category).emoji} ${cat(featured.category).name} · ${esc(featured.location)}</div>
        </div>
      </div>
      <p class="pro-tag">${esc(featured.tagline)}</p>
      <div class="rating"><span class="stars">${starStr(featured.rating)}</span> ${featured.rating.toFixed(1)} <span class="rev">(${featured.reviewCount})</span></div>
      <button class="btn btn-pine btn-block" style="margin-top:16px" data-profile="${featured.id}">View profile</button>`;
  }

  // hero stats
  const stats = platformStats();
  document.getElementById("heroStats").innerHTML = `
    <div class="hero-stat"><b>${stats.pros}</b><span>Verified experts</span></div>
    <div class="hero-stat"><b>${stats.jobs}</b><span>Jobs done</span></div>
    <div class="hero-stat"><b>${money(stats.volume)}</b><span>Paid out</span></div>`;

  // category grid
  document.getElementById("catGrid").innerHTML = CATEGORIES.map(c => {
    const count = approvedProviders().filter(p => p.category === c.id).length;
    return `<button class="cat-card" data-cat="${c.id}">
      <span class="cat-emoji">${c.emoji}</span>
      <h3>${c.name}</h3>
      <span>${count} expert${count === 1 ? "" : "s"} available</span>
    </button>`;
  }).join("");

  // top rated grid
  const top = approvedProviders().slice().sort((a, b) => b.rating - a.rating).slice(0, 6);
  document.getElementById("homeProGrid").innerHTML = top.map(proCardHTML).join("");
}

function platformStats() {
  const paid = state.jobs.filter(j => j.status === "paid");
  return {
    pros: approvedProviders().length,
    jobs: paid.length,
    volume: paid.reduce((s, j) => s + j.amount, 0),
  };
}

function sealSvg() {
  return `<svg class="seal" viewBox="0 0 24 24" aria-label="Verified"><path d="M12 2l2.4 1.8 3 .1 1 2.8 2.3 1.9-1 2.8 .3 3-2.7 1.3-1.5 2.6-3-.4-2.8 1.2-2.8-1.2-3 .4-1.5-2.6L2.7 15.5l.3-3-1-2.8L4.3 7.8l1-2.8 3-.1z" fill="#E3A72F"/><path d="M8.5 12l2.4 2.4 4.6-4.8" stroke="#0C3B2E" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

function proCardHTML(pr) {
  return `<article class="pro-card" data-profile="${pr.id}">
    <div class="pro-top">
      ${avatar(pr.name)}
      <div>
        <div class="pro-name-row"><span class="pro-name">${esc(pr.name)}</span>${sealSvg()}</div>
        <div class="pro-cat">${cat(pr.category).emoji} ${cat(pr.category).name} · ${esc(pr.location)}</div>
      </div>
    </div>
    <p class="pro-tag">${esc(pr.tagline)}</p>
    <div class="skill-tags">${pr.skills.slice(0, 3).map(s => `<span class="skill-tag">${esc(s)}</span>`).join("")}</div>
    <div class="pro-meta">
      <span class="rating"><span class="stars">${starStr(pr.rating)}</span> ${pr.rating.toFixed(1)} <span class="rev">(${pr.reviewCount})</span></span>
      <span class="rate-tag">${money(pr.rate)}<span>/hr</span></span>
    </div>
  </article>`;
}

/* ============================================================
   RENDER: BROWSE
   ============================================================ */
function renderBrowse() {
  const filter = document.getElementById("catFilter");
  filter.innerHTML =
    `<button class="filter-chip ${runtime.catFilter === "all" ? "active" : ""}" data-filter="all">All categories</button>` +
    CATEGORIES.map(c => `<button class="filter-chip ${runtime.catFilter === c.id ? "active" : ""}" data-filter="${c.id}">${c.emoji} ${c.name}</button>`).join("");

  const q = (document.getElementById("browseSearch").value || "").toLowerCase().trim();
  const sort = document.getElementById("sortSelect").value;

  let list = approvedProviders();
  if (runtime.catFilter !== "all") list = list.filter(p => p.category === runtime.catFilter);
  if (q) list = list.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.tagline.toLowerCase().includes(q) ||
    cat(p.category).name.toLowerCase().includes(q) ||
    p.skills.join(" ").toLowerCase().includes(q));

  const sorters = {
    rating: (a, b) => b.rating - a.rating,
    jobs: (a, b) => b.jobsCompleted - a.jobsCompleted,
    "rate-low": (a, b) => a.rate - b.rate,
    "rate-high": (a, b) => b.rate - a.rate,
  };
  list.sort(sorters[sort] || sorters.rating);

  document.getElementById("browseCount").textContent =
    `${list.length} verified expert${list.length === 1 ? "" : "s"}${runtime.catFilter !== "all" ? " in " + cat(runtime.catFilter).name : ""}`;

  const grid = document.getElementById("browseGrid");
  const empty = document.getElementById("browseEmpty");
  if (list.length === 0) {
    grid.innerHTML = "";
    empty.hidden = false;
    empty.innerHTML = `<h3>No experts match your search yet</h3><p>Try another category or clear your search — new experts get verified all the time.</p>`;
  } else {
    empty.hidden = true;
    grid.innerHTML = list.map(proCardHTML).join("");
  }
}

/* ============================================================
   RENDER: PROVIDER PROFILE
   ============================================================ */
function renderProvider(id) {
  const pr = state.providers.find(p => p.id === id);
  const body = document.getElementById("providerBody");
  if (!pr || pr.status !== "approved") {
    body.innerHTML = `<div class="empty"><h3>This expert isn't available</h3><p>They may not be verified yet.</p><button class="btn btn-pine" data-nav="browse" style="margin-top:12px">Browse experts</button></div>`;
    return;
  }
  const revs = providerReviews(id);
  body.innerHTML = `
    <a class="prof-back" data-nav="browse">← All pros</a>
    <div class="prof-grid">
      <div>
        <div class="prof-hero">
          ${avatar(pr.name, "avatar-lg")}
          <div class="prof-headings">
            <h1>${esc(pr.name)}</h1>
            <div class="pro-cat">${cat(pr.category).emoji} ${cat(pr.category).name} · ${esc(pr.location)}</div>
            <div class="prof-badges">
              <span class="badge-verified"><svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>Verified expert</span>
              <span class="rating"><span class="stars">${starStr(pr.rating)}</span> ${pr.rating.toFixed(1)} <span class="rev">(${pr.reviewCount} reviews)</span></span>
            </div>
          </div>
        </div>

        <div class="prof-section">
          <h2>About</h2>
          <p class="prof-bio">${esc(pr.bio)}</p>
        </div>

        <div class="prof-section">
          <h2>Skills</h2>
          <div class="skill-tags">${pr.skills.map(s => `<span class="skill-tag">${esc(s)}</span>`).join("")}</div>
        </div>

        <div class="prof-section">
          <h2>Reviews (${revs.length})</h2>
          ${revs.length ? revs.map(reviewHTML).join("") : `<p class="page-lead" style="margin:0">No written reviews yet — be the first to work with ${esc(firstName(pr.name))}.</p>`}
        </div>
      </div>

      <aside>
        <div class="hire-card">
          <div class="hire-rate">${money(pr.rate)} <small>/ hour</small></div>
          <div class="hire-stats">
            <div class="hire-stat"><b>${pr.jobsCompleted}</b><span>Jobs completed</span></div>
            <div class="hire-stat"><b>${pr.rating.toFixed(1)}★</b><span>Average rating</span></div>
          </div>
          <button class="btn btn-gold btn-block btn-lg" data-hire="${pr.id}">Hire ${esc(firstName(pr.name))}</button>
          <p class="hint" style="text-align:center;margin-top:12px">You only release payment when the job is done.</p>
        </div>
      </aside>
    </div>`;
}

function reviewHTML(r) {
  return `<div class="review">
    <div class="review-head">
      ${avatar(r.customerName, "review-av avatar")}
      <div>
        <div class="review-name">${esc(r.customerName)}</div>
        <div class="review-date">${timeAgo(r.date)}</div>
      </div>
      <span class="review-stars">${starStr(r.rating)}</span>
    </div>
    <p>${esc(r.comment)}</p>
  </div>`;
}

/* ============================================================
   RENDER: APPLY
   ============================================================ */
function renderApply() {
  const sel = document.getElementById("apCategory");
  if (sel && !sel.dataset.filled) {
    sel.innerHTML = `<option value="" disabled selected>Choose a category</option>` +
      CATEGORIES.map(c => `<option value="${c.id}">${c.emoji} ${c.name}</option>`).join("");
    sel.dataset.filled = "1";
  }
  applyGoStep(1);
  updateApplyPreview();
}

function applyGoStep(n) {
  document.querySelectorAll(".apply-step").forEach(f => { f.hidden = Number(f.dataset.step) !== n; });
  document.querySelectorAll(".rail-dot").forEach(d => {
    const s = Number(d.dataset.step);
    d.classList.toggle("active", s === n);
    d.classList.toggle("done", s < n);
  });
  if (n === 3) updateApplyPreview();
}

function validateStep(n) {
  const step = document.querySelector(`.apply-step[data-step="${n}"]`);
  let ok = true;
  step.querySelectorAll("input,select,textarea").forEach(el => {
    if (!el.hasAttribute("required")) return;
    const field = el.closest(".field");
    const bad = el.type === "checkbox" ? !el.checked : !el.value.trim();
    if (field) field.classList.toggle("invalid", bad);
    if (bad) ok = false;
  });
  if (!ok) toast("Please fill in the highlighted fields", "warn");
  return ok;
}

function updateApplyPreview() {
  const name = document.getElementById("apName").value.trim() || "Your name";
  const catId = document.getElementById("apCategory").value || "home-repair";
  const tagline = document.getElementById("apTagline").value.trim() || "Your one-line tagline appears here";
  const rate = document.getElementById("apRate").value || "—";
  const skills = document.getElementById("apSkills").value.split(",").map(s => s.trim()).filter(Boolean).slice(0, 3);
  document.getElementById("applyPreview").innerHTML = `
    <p class="hint" style="margin-bottom:8px">Preview of your card</p>
    <div class="pro-card" style="cursor:default">
      <div class="pro-top">${avatar(name)}
        <div><div class="pro-name-row"><span class="pro-name">${esc(name)}</span></div>
        <div class="pro-cat">${cat(catId).emoji} ${cat(catId).name}</div></div>
      </div>
      <p class="pro-tag">${esc(tagline)}</p>
      ${skills.length ? `<div class="skill-tags">${skills.map(s => `<span class="skill-tag">${esc(s)}</span>`).join("")}</div>` : ""}
      <div class="pro-meta"><span class="rating"><span class="rev">New expert</span></span>
      <span class="rate-tag">${rate === "—" ? "$—" : money(rate)}<span>/hr</span></span></div>
    </div>`;
}

function submitApplication(e) {
  e.preventDefault();
  if (!validateStep(3)) return;
  const name = document.getElementById("apName").value.trim();
  const newPro = p(
    name,
    document.getElementById("apCategory").value,
    document.getElementById("apEmail").value.trim(),
    document.getElementById("apLocation").value.trim(),
    document.getElementById("apTagline").value.trim(),
    document.getElementById("apBio").value.trim(),
    document.getElementById("apSkills").value.split(",").map(s => s.trim()).filter(Boolean),
    Number(document.getElementById("apRate").value) || 0,
    "pending", 0, 0, 0, Date.now()
  );
  newPro.phone = document.getElementById("apPhone").value.trim();
  state.providers.push(newPro);
  runtime.activeProviderId = newPro.id;
  save();
  document.getElementById("applyForm").reset();
  document.querySelectorAll(".field.invalid").forEach(f => f.classList.remove("invalid"));
  openModal(applicationSentHTML(name));
}

function applicationSentHTML(name) {
  return `<div class="modal-pad" style="text-align:center">
    <div class="receipt-check" style="background:var(--sprout);width:60px;height:60px;margin:6px auto 16px">
      <svg viewBox="0 0 24 24" style="stroke:#fff"><path d="M20 6 9 17l-5-5"/></svg>
    </div>
    <h2>Application submitted</h2>
    <p class="modal-sub" style="margin-top:10px">Thanks, ${esc(firstName(name))}. Your profile is now in the admin review queue. Once it's approved, you'll appear in Browse and can start receiving jobs.</p>
    <div style="display:flex;gap:10px;justify-content:center;margin-top:8px;flex-wrap:wrap">
      <button class="btn btn-ghost" data-close>Close</button>
      <button class="btn btn-pine" data-goto-dashboard>Track my status</button>
    </div>
    <p class="hint" style="margin-top:16px">Reviewing your own application? Switch to <b>Admin</b> (password <code style="font-family:var(--mono)">admin</code>) to approve it.</p>
  </div>`;
}

/* ============================================================
   RENDER: ADMIN
   ============================================================ */
function renderAdmin() {
  document.getElementById("adminGate").hidden = runtime.adminAuthed;
  document.getElementById("adminPanel").hidden = !runtime.adminAuthed;
  if (!runtime.adminAuthed) return;

  const pending = state.providers.filter(p => p.status === "pending");
  const stats = platformStats();
  document.getElementById("adminStats").innerHTML = `
    ${statBox(pending.length, "Awaiting review")}
    ${statBox(stats.pros, "Active pros")}
    ${statBox(stats.jobs, "Jobs paid")}
    ${statBox(money(stats.volume), "Volume processed", true)}`;

  document.getElementById("pendingCount").textContent = pending.length;
  const list = document.getElementById("pendingList");
  list.innerHTML = pending.length ? pending.map(appCardHTML).join("")
    : `<div class="empty" style="padding:34px 10px"><h3>Queue's clear</h3><p>No applications waiting. Nice.</p></div>`;

  renderLedger();
  renderProTable();
}

function statBox(value, label, mono) {
  return `<div class="stat-box"><b class="${mono ? "mono" : ""}">${value}</b><span>${label}</span></div>`;
}

function appCardHTML(pr) {
  return `<div class="app-card" id="app-${pr.id}">
    <div class="app-head">
      ${avatar(pr.name)}
      <div>
        <div class="pro-name">${esc(pr.name)}</div>
        <div class="pro-cat">${cat(pr.category).emoji} ${cat(pr.category).name} · applied ${timeAgo(pr.joined)}</div>
      </div>
      <span class="rate-tag" style="margin-left:auto">${money(pr.rate)}<span>/hr</span></span>
    </div>
    <p class="app-body">"${esc(pr.tagline)}"</p>
    <p class="app-body">${esc(pr.bio)}</p>
    <p class="app-body"><b>Location:</b> ${esc(pr.location)} &nbsp;·&nbsp; <b>Email:</b> ${esc(pr.email)}</p>
    <p class="app-body"><b>Skills:</b> ${pr.skills.map(esc).join(", ") || "—"}</p>
    <div class="app-actions">
      <button class="btn btn-pine btn-sm" data-approve="${pr.id}">✓ Approve &amp; verify</button>
      <button class="btn btn-danger btn-sm" data-reject="${pr.id}">Reject</button>
    </div>
  </div>`;
}

function renderLedger() {
  const events = [];
  state.jobs.filter(j => j.status === "paid").forEach(j => events.push({ type: "pay", ts: j.paidAt || j.createdAt, data: j }));
  state.providers.filter(p => p.status === "approved" && p.joined).forEach(p => events.push({ type: "app", ts: p.joined, data: p }));
  events.sort((a, b) => b.ts - a.ts);
  const el = document.getElementById("adminLedger");
  el.innerHTML = events.slice(0, 12).map(e => {
    if (e.type === "pay") {
      return `<div class="ledger-row">
        <span class="ledger-icon li-pay">↑</span>
        <div><div>${esc(e.data.customerName)} → ${esc(e.data.providerName)}</div><div class="ledger-time">${esc(e.data.title)} · ${timeAgo(e.ts)}</div></div>
        <span class="ledger-amt">${money(e.data.amount)}</span></div>`;
    }
    return `<div class="ledger-row">
      <span class="ledger-icon li-app">✦</span>
      <div><div>${esc(e.data.name)} verified</div><div class="ledger-time">${cat(e.data.category).name} · ${timeAgo(e.ts)}</div></div></div>`;
  }).join("") || `<p class="hint" style="padding:16px 0">No activity yet.</p>`;
}

function renderProTable() {
  const rows = state.providers.map(pr => `<tr>
    <td><div style="display:flex;align-items:center;gap:10px">${avatar(pr.name, "review-av avatar")}<b>${esc(pr.name)}</b></div></td>
    <td>${cat(pr.category).name}</td>
    <td>${pr.status === "approved" ? pr.rating.toFixed(1) + "★" : "—"}</td>
    <td>${pr.jobsCompleted}</td>
    <td><span class="status-pill st-${pr.status}">${pr.status}</span></td>
  </tr>`).join("");
  document.getElementById("adminProTable").innerHTML =
    `<thead><tr><th>Pro</th><th>Category</th><th>Rating</th><th>Jobs</th><th>Status</th></tr></thead><tbody>${rows}</tbody>`;
}

function approveProvider(id) {
  const pr = state.providers.find(p => p.id === id);
  if (!pr) return;
  pr.status = "approved";
  pr.rating = 0; pr.reviewCount = 0; pr.joined = Date.now();
  save();
  const card = document.getElementById("app-" + id);
  if (card) { card.classList.add("dismiss"); setTimeout(() => { renderAdmin(); }, 320); }
  else renderAdmin();
  toast(`${pr.name} is now verified and live 🎉`, "success");
}
function rejectProvider(id) {
  const pr = state.providers.find(p => p.id === id);
  if (!pr) return;
  pr.status = "rejected";
  save();
  const card = document.getElementById("app-" + id);
  if (card) { card.classList.add("dismiss"); setTimeout(() => renderAdmin(), 320); }
  else renderAdmin();
  toast(`${pr.name}'s application was rejected`, "warn");
}

/* ============================================================
   RENDER: DASHBOARD (customer + provider)
   ============================================================ */
function renderDashboard() {
  const body = document.getElementById("dashBody");
  body.innerHTML = `
    <div class="page-head"><div>
      <h1 class="page-title">Your dashboard</h1>
      <p class="page-lead">Track the projects you've commissioned, and the work you deliver as an expert.</p>
    </div></div>
    <div class="dash-tabs">
      <button class="dash-tab ${runtime.dashTab === "customer" ? "active" : ""}" data-tab="customer">My hires</button>
      <button class="dash-tab ${runtime.dashTab === "provider" ? "active" : ""}" data-tab="provider">My expert work</button>
    </div>
    <div id="dashContent"></div>`;
  if (runtime.dashTab === "customer") renderCustomerDash();
  else renderProviderDash();
}

function renderCustomerDash() {
  const el = document.getElementById("dashContent");
  const jobs = customerJobs(state.session.name).filter(j => state.session.name !== "Guest" || true);
  const mine = customerJobs(state.session.name);
  if (state.session.name === "Guest") {
    el.innerHTML = emptyDash("Set your name to start hiring", "Tell us who you are, then browse verified experts and send your first project request.", "Browse experts", "browse");
    return;
  }
  if (mine.length === 0) {
    el.innerHTML = emptyDash("No hires yet", "When you hire an expert, the project shows up here so you can track it and release payment on completion.", "Browse experts", "browse");
    return;
  }
  const spent = mine.filter(j => j.status === "paid").reduce((s, j) => s + j.amount, 0);
  const active = mine.filter(j => j.status !== "paid").length;
  el.innerHTML = `
    <div class="earn-row">
      ${statBox(mine.length, "Total jobs")}
      ${statBox(active, "In progress")}
      ${statBox(money(spent), "Total spent", true)}
    </div>
    ${mine.map(j => customerJobHTML(j)).join("")}`;
}

function customerJobHTML(j) {
  const reviewed = state.reviews.some(r => r.providerId === j.providerId && r.customerName === j.customerName && r.jobId === j.id);
  let actions = "";
  if (j.status === "requested") actions = `<span class="job-sub">Waiting for ${esc(firstName(j.providerName))} to accept</span>`;
  else if (j.status === "accepted") actions = `<span class="job-sub">${esc(firstName(j.providerName))} is on it</span>`;
  else if (j.status === "completed") actions = `<button class="btn btn-gold btn-sm" data-pay="${j.id}">Release payment</button>`;
  else if (j.status === "paid") actions = reviewed
    ? `<span class="job-sub">✓ Paid &amp; reviewed</span>`
    : `<button class="btn btn-ghost btn-sm" data-review="${j.id}">Leave a review</button>`;
  return `<div class="job-card">
    ${avatar(j.providerName)}
    <div class="job-main">
      <div class="job-title">${esc(j.title)}</div>
      <div class="job-sub">${esc(j.providerName)} · ${esc(j.details)} · ${timeAgo(j.createdAt)}</div>
    </div>
    <span class="job-status js-${j.status}">${j.status}</span>
    <span class="job-amt">${money(j.amount)}</span>
    <div class="job-actions">${actions}</div>
  </div>`;
}

function renderProviderDash() {
  const el = document.getElementById("dashContent");
  const approved = approvedProviders();
  const pendingSelf = state.providers.find(p => p.id === runtime.activeProviderId && p.status === "pending");

  if (approved.length === 0) {
    if (pendingSelf) {
      el.innerHTML = `
        <div class="card" style="text-align:center;max-width:520px;margin:10px auto">
          <div class="status-pill st-pending" style="margin-bottom:14px">Pending review</div>
          <h2 style="font-family:var(--body);font-size:20px">${esc(pendingSelf.name)}, you're in the queue</h2>
          <p class="page-lead" style="margin:10px auto 18px">Your application is waiting for admin approval. Once verified, your profile goes live and project requests will appear here.</p>
          <button class="btn btn-pine" data-nav="admin">Go to admin to approve</button>
        </div>`;
    } else {
      el.innerHTML = emptyDash("No profiles to manage yet", "Apply as an expert, get verified, then manage your incoming projects from here.", "Offer your expertise", "apply");
    }
    return;
  }

  if (!runtime.activeProviderId || !approved.find(p => p.id === runtime.activeProviderId)) {
    runtime.activeProviderId = approved[0].id;
  }
  const pr = state.providers.find(p => p.id === runtime.activeProviderId);
  const jobs = providerJobs(pr.id);
  const earned = jobs.filter(j => j.status === "paid").reduce((s, j) => s + j.amount, 0);
  const pendingPay = jobs.filter(j => j.status === "completed").reduce((s, j) => s + j.amount, 0);

  const banner = pendingSelf ? `<div class="sim-note" style="background:var(--gold-soft);border-color:var(--line);color:var(--ink-2);margin:0 0 20px">Your application as <strong style="color:var(--gold-600)">${esc(pendingSelf.name)}</strong> is still pending review. Approve it from <a data-nav="admin" style="color:var(--pine);text-decoration:underline;cursor:pointer">Admin</a> to bring it live.</div>` : "";

  el.innerHTML = `
    ${banner}
    <div class="provider-picker">
      <label for="provPick">Managing as</label>
      <select id="provPick">${approved.map(a => `<option value="${a.id}" ${a.id === pr.id ? "selected" : ""}>${esc(a.name)} — ${cat(a.category).name}</option>`).join("")}</select>
      <span class="badge-verified"><svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>Verified</span>
    </div>
    <div class="earn-row">
      ${statBox(money(earned), "Total earned", true)}
      ${statBox(money(pendingPay), "Awaiting release", true)}
      ${statBox(pr.jobsCompleted, "Jobs completed")}
    </div>
    ${jobs.length ? jobs.map(providerJobHTML).join("")
      : emptyDash("No project requests yet", "When a sponsor hires you, their request lands here to accept and deliver.", "See your public profile", "profile:" + pr.id)}`;
}

function providerJobHTML(j) {
  let actions = "";
  if (j.status === "requested") actions = `
    <button class="btn btn-pine btn-sm" data-accept="${j.id}">Accept job</button>
    <button class="btn btn-ghost btn-sm" data-decline="${j.id}">Decline</button>`;
  else if (j.status === "accepted") actions = `<button class="btn btn-gold btn-sm" data-complete="${j.id}">Mark complete</button>`;
  else if (j.status === "completed") actions = `<span class="job-sub">Awaiting payment release</span>`;
  else if (j.status === "paid") actions = `<span class="job-sub">✓ Paid ${timeAgo(j.paidAt)}</span>`;
  return `<div class="job-card">
    ${avatar(j.customerName)}
    <div class="job-main">
      <div class="job-title">${esc(j.title)}</div>
      <div class="job-sub">${esc(j.customerName)} · ${esc(j.details)} · ${timeAgo(j.createdAt)}</div>
    </div>
    <span class="job-status js-${j.status}">${j.status}</span>
    <span class="job-amt">${money(j.amount)}</span>
    <div class="job-actions">${actions}</div>
  </div>`;
}

function emptyDash(title, sub, btn, nav) {
  return `<div class="empty"><h3>${title}</h3><p>${sub}</p><button class="btn btn-pine" style="margin-top:14px" data-nav="${nav}">${btn}</button></div>`;
}

/* ============================================================
   JOB LIFECYCLE ACTIONS
   ============================================================ */
function openHireModal(providerId) {
  const pr = state.providers.find(p => p.id === providerId);
  if (!pr) return;
  const nameVal = state.session.name === "Guest" ? "" : state.session.name;
  openModal(`
    <div class="modal-pad">
      <div class="modal-head">
        <div><h2>Hire ${esc(firstName(pr.name))}</h2></div>
        <button class="modal-close" data-close>×</button>
      </div>
      <p class="modal-sub">Describe the project. You'll only release payment once the work is delivered.</p>
      <div class="field"><label>Your name</label><input id="hName" type="text" value="${esc(nameVal)}" placeholder="Who's hiring?" /></div>
      <div class="field"><label>What do you need done?</label><input id="hTitle" type="text" placeholder="e.g. Assay method validation" /></div>
      <div class="field"><label>Details</label><textarea id="hDetails" rows="3" placeholder="Anything ${esc(firstName(pr.name))} should know"></textarea></div>
      <div class="field-row">
        <div class="field"><label>Estimated hours</label>
          <input id="hHours" type="number" min="1" step="1" value="2" /></div>
        <div class="field"><label>Estimated total</label>
          <div class="rate-input" style="pointer-events:none"><span>$</span><input id="hTotal" type="text" value="${pr.rate * 2}" readonly style="background:none"></div></div>
      </div>
      <p class="hint" style="margin:-6px 0 16px">Based on ${money(pr.rate)}/hr. Final amount is agreed on completion.</p>
      <button class="btn btn-gold btn-block btn-lg" data-send-hire="${pr.id}">Send request</button>
    </div>`);
  // live total
  const hours = document.getElementById("hHours");
  const total = document.getElementById("hTotal");
  hours.addEventListener("input", () => { total.value = Math.max(0, (Number(hours.value) || 0) * pr.rate); });
}

function sendHire(providerId) {
  const pr = state.providers.find(p => p.id === providerId);
  const name = document.getElementById("hName").value.trim();
  const title = document.getElementById("hTitle").value.trim();
  const details = document.getElementById("hDetails").value.trim();
  const hours = Number(document.getElementById("hHours").value) || 1;
  if (!name) { toast("Add your name so the expert knows who's hiring", "warn"); return; }
  if (!title) { toast("Describe what you need done", "warn"); return; }
  state.session.name = name;
  updateIdentity();
  const newJob = job(pr.id, pr.name, name, title, details || (hours + " hours of work"), hours * pr.rate, "requested", Date.now(), null);
  state.jobs.push(newJob);
  save();
  closeModal();
  toast(`Request sent to ${firstName(pr.name)}. Track it in your dashboard.`, "success");
}

function acceptJob(id) { setJobStatus(id, "accepted"); toast("Job accepted — time to deliver", "success"); }
function declineJob(id) { state.jobs = state.jobs.filter(j => j.id !== id); save(); renderDashboard(); toast("Request declined", "warn"); }
function completeJob(id) { setJobStatus(id, "completed"); toast("Marked complete. Payment can now be released.", "gold"); }
function setJobStatus(id, status) {
  const j = state.jobs.find(x => x.id === id);
  if (!j) return; j.status = status; save(); renderDashboard();
}

function openPayFlow(id) {
  const j = state.jobs.find(x => x.id === id);
  if (!j) return;
  openModal(`
    <div class="modal-pad">
      <div class="modal-head"><div><h2>Release payment</h2></div><button class="modal-close" data-close>×</button></div>
      <p class="modal-sub">You're paying ${esc(j.providerName)} for "${esc(j.title)}". This is a simulated transaction — no real money moves.</p>
      <div class="receipt-line" style="font-family:var(--mono)"><span>Service</span><span>${esc(j.title)}</span></div>
      <div class="receipt-line" style="font-family:var(--mono)"><span>Pro</span><span>${esc(j.providerName)}</span></div>
      <div class="receipt-line total" style="font-family:var(--mono)"><span>Total</span><span>${money(j.amount)}</span></div>
      <button class="btn btn-gold btn-block btn-lg" style="margin-top:20px" data-confirm-pay="${j.id}">Pay ${money(j.amount)} now</button>
    </div>`);
}

function confirmPay(id) {
  const j = state.jobs.find(x => x.id === id);
  if (!j) return;
  j.status = "paid";
  j.paidAt = Date.now();
  const pr = state.providers.find(p => p.id === j.providerId);
  if (pr) pr.jobsCompleted += 1;
  save();
  renderIdentityDependent();
  // animated receipt
  const txId = "TXN-" + Math.random().toString(36).slice(2, 8).toUpperCase();
  document.getElementById("modalPanel").innerHTML = `
    <div class="receipt">
      <div class="receipt-top">
        <div class="receipt-check"><svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div>
        <h2>Payment released</h2>
        <p>${esc(j.providerName)} has been paid</p>
      </div>
      <div class="receipt-perf"></div>
      <div class="receipt-body">
        <div class="receipt-line"><span>PAID TO</span><span>${esc(j.providerName)}</span></div>
        <div class="receipt-line"><span>FROM</span><span>${esc(j.customerName)}</span></div>
        <div class="receipt-line"><span>SERVICE</span><span>${esc(j.title).slice(0, 22)}</span></div>
        <div class="receipt-line"><span>DATE</span><span>${new Date().toLocaleDateString("en-GB")}</span></div>
        <div class="receipt-line total"><span>TOTAL</span><span>${money(j.amount)}</span></div>
        <div class="receipt-id">${txId} · simulated payment</div>
      </div>
      <div class="receipt-actions">
        <button class="btn btn-pine btn-block" data-review="${j.id}">Rate your experience</button>
        <button class="btn btn-ghost btn-block" style="margin-top:8px" data-close>Done</button>
      </div>
    </div>`;
  toast(`Payment of ${money(j.amount)} released to ${firstName(j.providerName)}`, "success");
}

/* ---------- reviews ---------- */
let reviewPick = 0;
function openReviewModal(jobId) {
  const j = state.jobs.find(x => x.id === jobId);
  if (!j) return;
  reviewPick = 5;
  openModal(`
    <div class="modal-pad">
      <div class="modal-head"><div><h2>Rate ${esc(firstName(j.providerName))}</h2></div><button class="modal-close" data-close>×</button></div>
      <p class="modal-sub">How was "${esc(j.title)}"? Your review helps other people hire with confidence.</p>
      <div class="star-pick" id="starPick">
        ${[1, 2, 3, 4, 5].map(n => `<button data-star="${n}" class="${n <= 5 ? "on" : ""}">★</button>`).join("")}
      </div>
      <div class="field" style="margin-top:14px"><label>Your review</label>
        <textarea id="revText" rows="3" placeholder="What went well?"></textarea></div>
      <button class="btn btn-gold btn-block btn-lg" data-submit-review="${j.id}">Post review</button>
    </div>`);
}
function setReviewStars(n) {
  reviewPick = n;
  document.querySelectorAll("#starPick button").forEach(b => b.classList.toggle("on", Number(b.dataset.star) <= n));
}
function submitReview(jobId) {
  const j = state.jobs.find(x => x.id === jobId);
  if (!j) return;
  const text = document.getElementById("revText").value.trim();
  state.reviews.push({ id: uid("rev"), jobId: j.id, providerId: j.providerId, customerName: j.customerName, rating: reviewPick, comment: text || "Great work — would hire again.", date: Date.now() });
  const pr = state.providers.find(p => p.id === j.providerId);
  if (pr) {
    const total = pr.rating * pr.reviewCount + reviewPick;
    pr.reviewCount += 1;
    pr.rating = total / pr.reviewCount;
  }
  save();
  closeModal();
  renderIdentityDependent();
  toast("Thanks — your review is live", "success");
}

/* ============================================================
   MODAL + TOAST
   ============================================================ */
function openModal(html) {
  const root = document.getElementById("modalRoot");
  document.getElementById("modalPanel").innerHTML = html;
  root.hidden = false;
  document.body.style.overflow = "hidden";
}
function closeModal() {
  document.getElementById("modalRoot").hidden = true;
  document.body.style.overflow = "";
}
function toast(msg, type) {
  const wrap = document.getElementById("toastWrap");
  const t = document.createElement("div");
  t.className = "toast " + (type || "");
  t.innerHTML = `<span class="toast-dot"></span>${esc(msg)}`;
  wrap.appendChild(t);
  setTimeout(() => { t.classList.add("out"); setTimeout(() => t.remove(), 300); }, 3200);
}

/* ============================================================
   IDENTITY
   ============================================================ */
function updateIdentity() {
  document.getElementById("identityName").textContent = state.session.name;
  const dot = document.getElementById("identDot");
  dot.style.background = state.session.name === "Guest" ? "var(--line-strong)" : "var(--sprout)";
}
function openIdentityModal() {
  openModal(`
    <div class="modal-pad">
      <div class="modal-head"><div><h2>Who are you?</h2></div><button class="modal-close" data-close>×</button></div>
      <p class="modal-sub">Set the name you'll hire and get reviewed under. In a real app this would be your account.</p>
      <div class="field"><label>Your name</label><input id="idName" type="text" value="${state.session.name === "Guest" ? "" : esc(state.session.name)}" placeholder="e.g. Kofi Asante" /></div>
      <button class="btn btn-pine btn-block" data-save-identity>Save</button>
    </div>`);
}
function saveIdentity() {
  const v = document.getElementById("idName").value.trim();
  state.session.name = v || "Guest";
  save();
  updateIdentity();
  closeModal();
  renderIdentityDependent();
  toast(v ? `Hi ${firstName(v)} 👋` : "Signed out to Guest");
}
function renderIdentityDependent() {
  if (!document.getElementById("view-dashboard").hidden) renderDashboard();
  if (!document.getElementById("view-admin").hidden) renderAdmin();
  if (!document.getElementById("view-home").hidden) renderHome();
}

/* ============================================================
   NAV + EVENTS
   ============================================================ */
function navigate(target) {
  if (target.startsWith("profile:")) {
    const id = target.split(":")[1];
    renderProvider(id); showView("provider"); return;
  }
  switch (target) {
    case "home": renderHome(); showView("home"); break;
    case "browse": renderBrowse(); showView("browse"); break;
    case "apply": renderApply(); showView("apply"); break;
    case "admin": renderAdmin(); showView("admin"); break;
    case "dashboard": renderDashboard(); showView("dashboard"); break;
    case "how":
      showView("home", false);
      setTimeout(() => document.getElementById("view-how").scrollIntoView({ behavior: "smooth" }), 60);
      break;
    default: renderHome(); showView("home");
  }
}

function closeMobileNav() {
  document.querySelector(".nav-links")?.classList.remove("open");
  document.getElementById("navBurger")?.setAttribute("aria-expanded", "false");
}

function wireEvents() {
  // global click delegation
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-nav],[data-profile],[data-cat],[data-filter],[data-hire],[data-send-hire],[data-approve],[data-reject],[data-accept],[data-decline],[data-complete],[data-pay],[data-confirm-pay],[data-review],[data-submit-review],[data-star],[data-tab],[data-next],[data-back],[data-close],[data-save-identity],[data-goto-dashboard]");
    if (!t) return;

    if (t.dataset.nav) { e.preventDefault(); navigate(t.dataset.nav); }
    else if (t.dataset.profile) { renderProvider(t.dataset.profile); showView("provider"); }
    else if (t.dataset.cat) { runtime.catFilter = t.dataset.cat; renderBrowse(); showView("browse"); }
    else if (t.dataset.filter) { runtime.catFilter = t.dataset.filter; renderBrowse(); }
    else if (t.dataset.hire) { openHireModal(t.dataset.hire); }
    else if (t.dataset.sendHire) { sendHire(t.dataset.sendHire); }
    else if (t.dataset.approve) { approveProvider(t.dataset.approve); }
    else if (t.dataset.reject) { rejectProvider(t.dataset.reject); }
    else if (t.dataset.accept) { acceptJob(t.dataset.accept); }
    else if (t.dataset.decline) { declineJob(t.dataset.decline); }
    else if (t.dataset.complete) { completeJob(t.dataset.complete); }
    else if (t.dataset.pay) { openPayFlow(t.dataset.pay); }
    else if (t.dataset.confirmPay) { confirmPay(t.dataset.confirmPay); }
    else if (t.dataset.review) { openReviewModal(t.dataset.review); }
    else if (t.dataset.submitReview) { submitReview(t.dataset.submitReview); }
    else if (t.dataset.star) { setReviewStars(Number(t.dataset.star)); }
    else if (t.dataset.tab) { runtime.dashTab = t.dataset.tab; renderDashboard(); }
    else if (t.dataset.next) { if (validateStep(Number(t.dataset.next) - 1)) applyGoStep(Number(t.dataset.next)); }
    else if (t.dataset.back) { applyGoStep(Number(t.dataset.back)); }
    else if (t.hasAttribute("data-close")) { closeModal(); }
    else if (t.hasAttribute("data-save-identity")) { saveIdentity(); }
    else if (t.hasAttribute("data-goto-dashboard")) { closeModal(); runtime.dashTab = "provider"; navigate("dashboard"); }
  });

  // modal backdrop close
  document.getElementById("modalBackdrop").addEventListener("click", closeModal);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

  // role switcher
  document.getElementById("roleSelect").addEventListener("change", (e) => {
    const v = e.target.value;
    if (v === "customer") navigate("browse");
    else if (v === "provider") { runtime.dashTab = "provider"; navigate("dashboard"); }
    else if (v === "admin") navigate("admin");
  });

  // identity
  document.getElementById("identityBtn").addEventListener("click", openIdentityModal);

  // hero search
  const heroGo = () => {
    const q = document.getElementById("heroSearch").value.trim();
    runtime.catFilter = "all";
    renderBrowse();
    if (q) { document.getElementById("browseSearch").value = q; renderBrowse(); }
    showView("browse");
  };
  document.getElementById("heroSearchBtn").addEventListener("click", heroGo);
  document.getElementById("heroSearch").addEventListener("keydown", (e) => { if (e.key === "Enter") heroGo(); });

  // browse controls
  document.getElementById("browseSearch").addEventListener("input", renderBrowse);
  document.getElementById("sortSelect").addEventListener("change", renderBrowse);

  // apply live preview
  ["apName", "apCategory", "apTagline", "apRate", "apSkills"].forEach(id => {
    document.getElementById(id).addEventListener("input", updateApplyPreview);
    document.getElementById(id).addEventListener("change", updateApplyPreview);
  });
  document.getElementById("applyForm").addEventListener("submit", submitApplication);

  // admin login
  const tryLogin = () => {
    const v = document.getElementById("adminPass").value;
    if (v === ADMIN_PASS) { runtime.adminAuthed = true; renderAdmin(); toast("Welcome back, admin"); }
    else { toast("Wrong password. Hint: it's 'admin'", "warn"); }
  };
  document.getElementById("adminLoginBtn").addEventListener("click", tryLogin);
  document.getElementById("adminPass").addEventListener("keydown", (e) => { if (e.key === "Enter") tryLogin(); });
  document.getElementById("adminLogout").addEventListener("click", () => { runtime.adminAuthed = false; renderAdmin(); });

  // provider picker (delegated via change)
  document.addEventListener("change", (e) => {
    if (e.target.id === "provPick") { runtime.activeProviderId = e.target.value; renderProviderDash(); }
  });

  // mobile nav
  document.getElementById("navBurger").addEventListener("click", () => {
    const links = document.querySelector(".nav-links");
    const open = links.classList.toggle("open");
    document.getElementById("navBurger").setAttribute("aria-expanded", String(open));
  });
}

/* ============================================================
   BOOT
   ============================================================ */
function init() {
  state = load();
  if (!state.session) state.session = { name: "Guest" };
  wireEvents();
  updateIdentity();
  renderHome();
  showView("home");
}
document.addEventListener("DOMContentLoaded", init);
