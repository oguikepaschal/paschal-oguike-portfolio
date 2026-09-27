// About section weave: commit activity drawn as short engraved marks.
// Ported from design/about-weave.source.js. The math is unchanged except for
// two things: `quiet` is a list of rectangles (the real text boxes) with
// field() taking the nearest one, and the caller scales `seeds` to the
// section's area. Colours come from the site's tokens at draw time.

export interface WeaveCommit {
  sha: string;
  repo: string;
  t: number;
  size: number;
  significant?: boolean;
}

/** One row of src/data/weave-commits.json. */
export interface WeaveSnapshotRow {
  r: string;
  t: number;
  size: number;
}

export type Rect = [x0: number, y0: number, x1: number, y1: number];

export interface WeaveFormat {
  W: number;
  H: number;
  quiet: Rect[];
  quietFall: number;
  right: [number, number];
  rightPow: number;
  cornerSigma: number;
  seeds: number;
  territory: number;
  red: number;
  markScale: number;
}

export interface WeaveMark {
  x: number;
  y: number;
  ang: number;
  tone: number;
  red: boolean;
  size: number;
  len: number;
  w: number;
  phase: number;
  period: number;
  amp: number;
}

export interface WeaveColors {
  /** --ink as [r, g, b]; marks run from 12% to 45% alpha of it. */
  ink: [number, number, number];
  /** --accent, for the significant marks. */
  accent: string;
  /** Highlight beside heavy marks. Light theme only; null skips it. */
  cut: string | null;
}

/** Per-repo cut: angle (deg), length and weight multipliers. Labels come from
 * the snapshot (r1 = busiest repo). Unknown labels get a hashed angle. */
export const REPO_STYLE: Record<string, { angle: number; len: number; wt: number }> = {
  r1: { angle: 58, len: 1.15, wt: 0.85 },
  r2: { angle: -32, len: 1.0, wt: 1.0 },
  r3: { angle: 14, len: 0.9, wt: 1.1 },
  r4: { angle: 97, len: 1.2, wt: 0.8 },
  r5: { angle: -67, len: 0.75, wt: 1.25 },
};

/** The desktop format's tuning. W, H, quiet and seeds are filled in from the
 * real section at runtime. */
export const DESKTOP_FORMAT: Omit<WeaveFormat, "W" | "H" | "quiet"> = {
  quietFall: 210,
  right: [0.6, 1],
  rightPow: 1.8,
  cornerSigma: 200,
  seeds: 26,
  territory: 120,
  red: 9,
  markScale: 1,
};
/** The area DESKTOP_FORMAT.seeds was tuned for. */
export const DESKTOP_AREA = 1440 * 900;

export const INK_CUT = "#FAFAF8";

export function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Snapshot rows -> commits. Index-based ids stand in for SHAs, which the
 * snapshot deliberately doesn't carry, so layout()'s significance still works. */
export function normalize(rows: WeaveSnapshotRow[]): WeaveCommit[] {
  return rows
    .map((row, i) => ({ sha: String(i), repo: row.r, t: row.t, size: Math.max(1, row.size || 1) }))
    .filter((c) => isFinite(c.t));
}

const ss = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
function hash2(i: number, j: number, s: number) {
  let h = (i * 374761393 + j * 668265263 + s * 1442695041) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function vnoise(x: number, y: number, s: number) {
  const xi = Math.floor(x),
    yi = Math.floor(y),
    xf = x - xi,
    yf = y - yi;
  const u = xf * xf * (3 - 2 * xf),
    v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi, s),
    b = hash2(xi + 1, yi, s),
    c = hash2(xi, yi + 1, s),
    d = hash2(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function strHash(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function field(F: WeaveFormat, x: number, y: number, s: number) {
  const right = Math.pow(ss(F.right[0], F.right[1], x / F.W), F.rightPow);
  let corner = 0;
  for (const [cx, cy] of [
    [0, 0],
    [F.W, 0],
    [0, F.H],
    [F.W, F.H],
  ]) {
    corner = Math.max(corner, Math.exp(-((x - cx) ** 2 + (y - cy) ** 2) / (2 * F.cornerSigma ** 2)));
  }
  const d = Math.max(right, corner) * (0.7 + 0.6 * vnoise(x / 140, y / 140, s));
  // Nearest of the quiet rectangles (the text boxes).
  let dist = Infinity;
  for (const [x0, y0, x1, y1] of F.quiet) {
    dist = Math.min(dist, Math.hypot(Math.max(x0 - x, 0, x - x1), Math.max(y0 - y, 0, y - y1)));
  }
  const q = 1 - ss(0, F.quietFall, dist);
  return Math.min(1, d * (1 - 0.985 * q) + 0.012 * (1 - q) + 0.002);
}

export function layout(commits: WeaveCommit[], F: WeaveFormat, { seed = 7, scale = 1 } = {}): WeaveMark[] {
  const r = mulberry32(seed * 31 + F.W);
  const s = seed;
  const repos: Record<string, number> = {};
  for (const c of commits) repos[c.repo] = (repos[c.repo] || 0) + 1;
  const ids = Object.keys(repos);
  const style = (id: string) => REPO_STYLE[id] || { angle: (strHash(id) % 180) - 90, len: 1, wt: 1 };

  // Repo territories: seeds dropped into the dense zones, count ∝ share.
  const seeds: { id: string; x: number; y: number }[] = [];
  for (const id of ids) {
    const n = Math.max(2, Math.round((repos[id] / commits.length) * F.seeds));
    for (let k = 0; k < n; k++) {
      let x, y, g = 0;
      do {
        x = r() * F.W;
        y = r() * F.H;
        g++;
      } while (r() > field(F, x, y, s) && g < 500);
      seeds.push({ id, x, y });
    }
  }
  const T2 = 2 * F.territory ** 2;
  const member = (x: number, y: number, id: string) => {
    const wx = x + (vnoise(x / 220, y / 220, s + 5) - 0.5) * 170,
      wy = y + (vnoise(x / 220, y / 220, s + 6) - 0.5) * 170;
    const w: Record<string, number> = {};
    let tot = 0;
    for (const sd of seeds) {
      const v = Math.exp(-((wx - sd.x) ** 2 + (wy - sd.y) ** 2) / T2);
      if (!(w[sd.id] >= v)) w[sd.id] = v;
    }
    for (const k in w) {
      w[k] = w[k] ** 2.5;
      tot += w[k];
    }
    return tot ? w[id] / tot : 1 / ids.length;
  };

  // Significance: explicit flags win; otherwise the largest changes.
  let sig = new Set(commits.filter((c) => c.significant).map((c) => c.sha));
  if (!sig.size) sig = new Set([...commits].sort((a, b) => b.size - a.size).slice(0, F.red).map((c) => c.sha));

  let tmin = Infinity,
    tmax = -Infinity;
  for (const c of commits) {
    tmin = Math.min(tmin, c.t);
    tmax = Math.max(tmax, c.t);
  }
  const span = Math.max(1, tmax - tmin);
  const ms = F.markScale * scale;

  const marks: WeaveMark[] = [];
  for (const c of commits) {
    const red = sig.has(c.sha),
      minF = red ? 0.5 : 0;
    let x = 0,
      y = 0,
      f = 0;
    for (let a = 0; a < 8000; a++) {
      x = r() * F.W;
      y = r() * F.H;
      f = field(F, x, y, s);
      if (f < minF) continue;
      if (r() < Math.pow(f, 1.5) * (0.12 + 0.88 * member(x, y, c.repo))) break;
    }
    const st = style(c.repo),
      tf = (c.t - tmin) / span,
      ls = Math.log(1 + c.size);
    const ang =
      ((st.angle + (vnoise(x / 260, y / 260, s + 9) - 0.5) * 26 + (tf - 0.5) * 14 + (r() - 0.5) * 7) * Math.PI) / 180;
    marks.push({
      x,
      y,
      ang,
      tone: f,
      red,
      size: c.size,
      len: Math.min(72, Math.max(5, (7 + 5.2 * ls) * st.len * ms)),
      w: Math.min(3, Math.max(0.4, (0.42 + 0.25 * ls) * st.wt * ms)),
      phase: r() * Math.PI * 2,
      period: 38 + r() * 46,
      amp: 0.6 + r() * 1.6,
    });
  }
  return marks.sort((a, b) => Number(a.red) - Number(b.red) || a.size - b.size);
}

export function prepCanvas(cv: HTMLCanvasElement, F: WeaveFormat) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = F.W * dpr;
  cv.height = F.H * dpr;
  const ctx = cv.getContext("2d")!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

// t = seconds for drift, null for static.
export function draw(
  ctx: CanvasRenderingContext2D,
  marks: WeaveMark[],
  F: WeaveFormat,
  colors: WeaveColors,
  t: number | null = null,
) {
  // Transparent: the page's own --paper shows through, in either theme.
  ctx.clearRect(0, 0, F.W, F.H);
  // field() only makes the text boxes very quiet, never empty, so on narrow
  // sections a faint mark can still reach into one. Clip them out exactly.
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, F.W, F.H);
  for (const [x0, y0, x1, y1] of F.quiet) ctx.rect(x0, y0, x1 - x0, y1 - y0);
  ctx.clip("evenodd");
  const [ir, ig, ib] = colors.ink;
  for (const m of marks) {
    let { x, y, ang } = m;
    if (t != null) {
      const k = Math.sin((t * 2 * Math.PI) / m.period + m.phase);
      x += Math.cos(ang) * m.amp * k;
      y += Math.sin(ang) * m.amp * k;
      ang += Math.sin((t * 2 * Math.PI) / (m.period * 1.7) + m.phase * 2) * 0.025;
    }
    const c = Math.cos(ang),
      sn = Math.sin(ang),
      h = m.len / 2,
      hw = m.w / 2;
    const ax = x - c * h,
      ay = y - sn * h,
      bx = x + c * h,
      by = y + sn * h;
    const mx = ax + c * m.len * 0.42,
      my = ay + sn * m.len * 0.42;
    const nx = -sn * hw,
      ny = c * hw;
    if (m.red) ctx.fillStyle = colors.accent;
    else {
      const k = Math.pow(m.tone, 0.6);
      ctx.fillStyle = `rgba(${ir},${ig},${ib},${0.12 + (0.45 - 0.12) * k})`;
    }
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(mx + nx, my + ny);
    ctx.lineTo(bx, by);
    ctx.lineTo(mx - nx, my - ny);
    ctx.closePath();
    ctx.fill();
    if (colors.cut && m.w > 1.05 && !m.red) {
      const ox = -sn * (hw + 0.45),
        oy = c * (hw + 0.45);
      ctx.strokeStyle = colors.cut;
      ctx.lineWidth = 0.55;
      ctx.beginPath();
      ctx.moveTo(ax + c * h * 0.4 + ox, ay + sn * h * 0.4 + oy);
      ctx.lineTo(bx - c * h * 0.3 + ox, by - sn * h * 0.3 + oy);
      ctx.stroke();
    }
  }
  ctx.restore();
}
