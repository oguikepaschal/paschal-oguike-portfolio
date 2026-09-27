// Commit data layer. The renderer (weave.js) only ever sees normalized commits:
//   { sha: string, repo: string, t: epoch ms, size: additions + deletions, significant?: boolean }
// Swap generatePlaceholderCommits() for fromGitHub(...) output — nothing else changes.

export const REPOS = [
  { id: 'sterling-capital', share: 0.30 },
  { id: 'portfolio',        share: 0.25 },
  { id: 'polanco-ops-hub',  share: 0.20 },
  { id: 'meridian-heights', share: 0.15 },
  { id: 'pz-autos',         share: 0.10 },
];

export function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const DAY = 864e5;
function gauss(r) { let u = 0; while (!u) u = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r()); }
function poisson(r, l) {
  if (l <= 0) return 0;
  if (l > 30) return Math.max(0, Math.round(l + Math.sqrt(l) * gauss(r)));
  const L = Math.exp(-l); let k = 0, p = 1;
  do { k++; p *= r(); } while (p > L);
  return k - 1;
}

// Raw shape mirrors what you'd assemble from the GitHub API: { sha, repo, date (ISO), additions, deletions }
export function generatePlaceholderCommits({ seed = 7, start = '2026-04-01', end = '2026-09-30', total = 4200 } = {}) {
  const r = mulberry32(seed * 9973 + 1);
  const t0 = Date.parse(start + 'T00:00:00Z'), t1 = Date.parse(end + 'T00:00:00Z');
  const nDays = Math.round((t1 - t0) / DAY) + 1;
  const quiet = new Float32Array(nDays).fill(1);
  for (let q = 0; q < 3; q++) {
    const s = Math.floor(r() * (nDays - 10)), len = 5 + Math.floor(r() * 6);
    for (let d = s; d < s + len && d < nDays; d++) quiet[d] = 0.08;
  }
  const out = [];
  for (const repo of REPOS) {
    const act = new Float32Array(nDays), sprint = new Float32Array(nDays).fill(0.3);
    const nS = 3 + Math.floor(r() * 4);
    for (let s = 0; s < nS; s++) {
      const c = Math.floor(r() * nDays), len = 4 + Math.floor(r() * 12), amp = 1.5 + r() * 3;
      for (let d = c - len; d <= c + len; d++) if (d >= 0 && d < nDays) { const f = 1 - Math.abs(d - c) / (len + 1); sprint[d] += amp * f * f; }
    }
    let sum = 0;
    for (let d = 0; d < nDays; d++) {
      const wd = new Date(t0 + d * DAY).getUTCDay();
      act[d] = sprint[d] * (wd === 0 || wd === 6 ? 0.3 : 1) * quiet[d] * (0.6 + r() * 0.8);
      sum += act[d];
    }
    const mean = sum / nDays, nH = 1 + Math.floor(r() * 2);
    const heavy = new Set();
    for (let h = 0; h < nH; h++) { const d = Math.floor(r() * nDays); act[d] += mean * (10 + r() * 12); sum += mean * 16; heavy.add(d); }
    const target = repo.share * total;
    for (let d = 0; d < nDays; d++) {
      const k = poisson(r, act[d] / sum * target);
      for (let i = 0; i < k; i++) {
        let size = Math.max(1, Math.round(Math.exp(Math.log(heavy.has(d) ? 40 : 20) + 1.25 * gauss(r))));
        if (r() < 0.004) size *= 8 + Math.floor(r() * 12);
        const additions = Math.round(size * (0.45 + r() * 0.5));
        const hour = 8 + r() * 15;
        out.push({
          sha: Math.floor(r() * 0xffffffff).toString(16).padStart(8, '0') + Math.floor(r() * 0xffffffff).toString(16).padStart(8, '0'),
          repo: repo.id,
          date: new Date(t0 + d * DAY + hour * 36e5).toISOString(),
          additions, deletions: size - additions,
        });
      }
    }
  }
  return out.sort((a, b) => a.date < b.date ? -1 : 1);
}

// Adapter for GitHub REST "get a commit" responses (needs `stats`, i.e. GET /repos/{owner}/{repo}/commits/{sha}).
export function fromGitHub(repo, apiCommits) {
  return apiCommits.map(c => ({
    sha: c.sha, repo,
    date: c.commit?.author?.date ?? c.commit?.committer?.date,
    additions: c.stats?.additions ?? 0, deletions: c.stats?.deletions ?? 0,
  }));
}

export function normalize(list) {
  return list.map(c => ({
    sha: String(c.sha), repo: c.repo,
    t: typeof c.date === 'number' ? c.date : Date.parse(c.date ?? c.t),
    size: Math.max(1, (c.additions || 0) + (c.deletions || 0) || c.size || 1),
    significant: c.significant,
  })).filter(c => isFinite(c.t));
}

// Design logic: normalized commits -> engraved marks. Data-agnostic.


// Per-repo cut: angle (deg), length and weight multipliers. Unknown repos get a hashed angle.
export const REPO_STYLE = {
  'sterling-capital': { angle: 58,  len: 1.15, wt: 0.85 },
  'portfolio':        { angle: -32, len: 1.00, wt: 1.00 },
  'polanco-ops-hub':  { angle: 14,  len: 0.90, wt: 1.10 },
  'meridian-heights': { angle: 97,  len: 1.20, wt: 0.80 },
  'pz-autos':         { angle: -67, len: 0.75, wt: 1.25 },
};

// quiet = [x0,y0,x1,y1] rect under the About text.
export const FORMATS = {
  desktop: { W: 1440, H: 900, quiet: [96, 170, 690, 730], quietFall: 210, right: [0.6, 1], rightPow: 1.8, cornerSigma: 200, seeds: 26, territory: 120, red: 9, markScale: 1 },
  mobile:  { W: 375,  H: 812, quiet: [18, 128, 338, 704], quietFall: 72,  right: [0.82, 1], rightPow: 1.4, cornerSigma: 130, seeds: 12, territory: 64,  red: 3, markScale: 0.85 },
};

export const INK = { paper: '#F2F2F2', light: [216, 211, 204], dark: [146, 138, 129], cut: '#FAFAF8' };

const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
function hash2(i, j, s) { let h = (i * 374761393 + j * 668265263 + s * 1442695041) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function vnoise(x, y, s) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi, s), b = hash2(xi + 1, yi, s), c = hash2(xi, yi + 1, s), d = hash2(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function strHash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619); return h >>> 0; }

export function field(F, x, y, s) {
  const right = Math.pow(ss(F.right[0], F.right[1], x / F.W), F.rightPow);
  let corner = 0;
  for (const [cx, cy] of [[0, 0], [F.W, 0], [0, F.H], [F.W, F.H]]) {
    corner = Math.max(corner, Math.exp(-((x - cx) ** 2 + (y - cy) ** 2) / (2 * F.cornerSigma ** 2)));
  }
  let d = Math.max(right, corner) * (0.7 + 0.6 * vnoise(x / 140, y / 140, s));
  const [x0, y0, x1, y1] = F.quiet;
  const dist = Math.hypot(Math.max(x0 - x, 0, x - x1), Math.max(y0 - y, 0, y - y1));
  const q = 1 - ss(0, F.quietFall, dist);
  return Math.min(1, d * (1 - 0.985 * q) + 0.012 * (1 - q) + 0.002);
}

export function layout(commits, F, { seed = 7, scale = 1 } = {}) {
  const r = mulberry32(seed * 31 + F.W);
  const s = seed;
  const repos = {};
  for (const c of commits) repos[c.repo] = (repos[c.repo] || 0) + 1;
  const ids = Object.keys(repos);
  const style = id => REPO_STYLE[id] || { angle: (strHash(id) % 180) - 90, len: 1, wt: 1 };

  // Repo territories: seeds dropped into the dense zones, count ∝ share.
  const seeds = [];
  for (const id of ids) {
    const n = Math.max(2, Math.round(repos[id] / commits.length * F.seeds));
    for (let k = 0; k < n; k++) {
      let x, y, g = 0;
      do { x = r() * F.W; y = r() * F.H; g++; } while (r() > field(F, x, y, s) && g < 500);
      seeds.push({ id, x, y });
    }
  }
  const T2 = 2 * F.territory ** 2;
  const member = (x, y, id) => {
    const wx = x + (vnoise(x / 220, y / 220, s + 5) - 0.5) * 170, wy = y + (vnoise(x / 220, y / 220, s + 6) - 0.5) * 170;
    const w = {}; let tot = 0;
    for (const sd of seeds) { const v = Math.exp(-((wx - sd.x) ** 2 + (wy - sd.y) ** 2) / T2); if (!(w[sd.id] >= v)) w[sd.id] = v; }
    for (const k in w) { w[k] = w[k] ** 2.5; tot += w[k]; }
    return tot ? w[id] / tot : 1 / ids.length;
  };

  // Significance: explicit flags win; otherwise the largest changes.
  let sig = new Set(commits.filter(c => c.significant).map(c => c.sha));
  if (!sig.size) sig = new Set([...commits].sort((a, b) => b.size - a.size).slice(0, F.red).map(c => c.sha));

  let tmin = Infinity, tmax = -Infinity;
  for (const c of commits) { tmin = Math.min(tmin, c.t); tmax = Math.max(tmax, c.t); }
  const span = Math.max(1, tmax - tmin);
  const ms = F.markScale * scale;

  const marks = [];
  for (const c of commits) {
    const red = sig.has(c.sha), minF = red ? 0.5 : 0;
    let x, y, f;
    for (let a = 0; a < 8000; a++) {
      x = r() * F.W; y = r() * F.H; f = field(F, x, y, s);
      if (f < minF) continue;
      if (r() < Math.pow(f, 1.5) * (0.12 + 0.88 * member(x, y, c.repo))) break;
    }
    const st = style(c.repo), tf = (c.t - tmin) / span, ls = Math.log(1 + c.size);
    const ang = (st.angle + (vnoise(x / 260, y / 260, s + 9) - 0.5) * 26 + (tf - 0.5) * 14 + (r() - 0.5) * 7) * Math.PI / 180;
    marks.push({
      x, y, ang, tone: f, red, size: c.size,
      len: Math.min(72, Math.max(5, (7 + 5.2 * ls) * st.len * ms)),
      w: Math.min(3, Math.max(0.4, (0.42 + 0.25 * ls) * st.wt * ms)),
      phase: r() * Math.PI * 2, period: 38 + r() * 46, amp: 0.6 + r() * 1.6,
    });
  }
  return marks.sort((a, b) => (a.red - b.red) || (a.size - b.size));
}

export function prepCanvas(cv, F) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = F.W * dpr; cv.height = F.H * dpr;
  const ctx = cv.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

// t = seconds for drift, null for static.
export function draw(ctx, marks, F, { accent = '#B8392C', t = null } = {}) {
  ctx.fillStyle = INK.paper; ctx.fillRect(0, 0, F.W, F.H);
  const { light: L, dark: D } = INK;
  for (const m of marks) {
    let { x, y, ang } = m;
    if (t != null) {
      const k = Math.sin(t * 2 * Math.PI / m.period + m.phase);
      x += Math.cos(ang) * m.amp * k; y += Math.sin(ang) * m.amp * k;
      ang += Math.sin(t * 2 * Math.PI / (m.period * 1.7) + m.phase * 2) * 0.025;
    }
    const c = Math.cos(ang), sn = Math.sin(ang), h = m.len / 2, hw = m.w / 2;
    const ax = x - c * h, ay = y - sn * h, bx = x + c * h, by = y + sn * h;
    const mx = ax + c * m.len * 0.42, my = ay + sn * m.len * 0.42;
    const nx = -sn * hw, ny = c * hw;
    if (m.red) ctx.fillStyle = accent;
    else {
      const k = Math.pow(m.tone, 0.6);
      ctx.fillStyle = `rgb(${L[0] + (D[0] - L[0]) * k | 0},${L[1] + (D[1] - L[1]) * k | 0},${L[2] + (D[2] - L[2]) * k | 0})`;
    }
    ctx.beginPath();
    ctx.moveTo(ax, ay); ctx.lineTo(mx + nx, my + ny); ctx.lineTo(bx, by); ctx.lineTo(mx - nx, my - ny);
    ctx.closePath(); ctx.fill();
    if (m.w > 1.05 && !m.red) {
      const ox = -sn * (hw + 0.45), oy = c * (hw + 0.45);
      ctx.strokeStyle = INK.cut; ctx.lineWidth = 0.55;
      ctx.beginPath(); ctx.moveTo(ax + c * h * 0.4 + ox, ay + sn * h * 0.4 + oy); ctx.lineTo(bx - c * h * 0.3 + ox, by - sn * h * 0.3 + oy); ctx.stroke();
    }
  }
}
