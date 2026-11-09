// Bản đồ vẽ bằng canvas 2D: kéo, phóng/thu (chuột, bàn phím, chụm hai ngón), tìm nút gần con trỏ bằng lưới băm.
// Bố cục đã tính sẵn lúc build (tools/graph/layout.mjs); ở đây không mô phỏng lực.
import { isReview, type GraphData } from './graph';

export type Hit = { k: 'e' | 'c' | 's'; i: number } | null;
type Node = { k: 'e' | 'c' | 's'; i: number; x: number; y: number; r: number; g: number; id: number };
export interface Insets { l: number; r: number; t: number; b: number; }
export interface ViewOpts {
  insets: () => Insets;
  onSelect: (h: Hit) => void;
  onHover: (h: Hit, x: number, y: number) => void;
}
export interface Marks { read: Set<string>; done: Set<string>; }

const CELL = 24;
const R_ENTRY = 3.4, R_CHAPTER = 15, R_SIT = 11;
const MIN_PX = { e: 1.9, c: 6, s: 7 } as const;
const K_MIN = 0.12, K_MAX = 7;
const TAU = Math.PI * 2;

const key = (cx: number, cy: number) => cx * 100003 + cy;
const ease = (t: number) => 1 - Math.pow(1 - t, 3);

export class MapView {
  private ctx: CanvasRenderingContext2D;
  private nodes: Node[] = [];
  private grid = new Map<number, Node[]>();
  private adj: number[][] = [];
  private nE: number; private nC: number;
  private dpr = 1; private w = 0; private h = 0;
  k = 0.4; private tx = 0; private ty = 0;
  private sel: Hit = null; private hov: Hit = null;
  private dim: number | null = null;
  private marks: Marks = { read: new Set(), done: new Set() };
  private col: Record<string, string> = {};
  private tones: string[] = [];
  private dirty = true; private active = true; private raf = 0; private last = 0;
  private anim: { t0: number; ms: number; from: [number, number, number]; to: [number, number, number] } | null = null;
  private ptrs = new Map<number, { x: number; y: number }>();
  private down: { x: number; y: number; t: number; moved: boolean } | null = null;
  private pinch: { d: number; k: number; wx: number; wy: number } | null = null;
  private reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  private ro: ResizeObserver;
  private io: IntersectionObserver;
  private mo: MutationObserver;
  private fitted = false;

  constructor(private canvas: HTMLCanvasElement, private g: GraphData, private opts: ViewOpts) {
    this.ctx = canvas.getContext('2d')!;
    this.nE = g.e.length; this.nC = g.c.length;
    g.e.forEach((e, i) => this.nodes.push({ k: 'e', i, x: e[4], y: e[5], r: R_ENTRY, g: g.c[e[2]].g, id: i }));
    g.c.forEach((c, i) => this.nodes.push({ k: 'c', i, x: c.x, y: c.y, r: R_CHAPTER, g: c.g, id: this.nE + i }));
    g.s.forEach((s, i) => this.nodes.push({ k: 's', i, x: s.x, y: s.y, r: R_SIT, g: -1, id: this.nE + this.nC + i }));
    for (const n of this.nodes) {
      const kk = key(Math.floor(n.x / CELL), Math.floor(n.y / CELL));
      (this.grid.get(kk) ?? this.grid.set(kk, []).get(kk)!).push(n);
    }
    // Kề: mục ↔ chương, mục ↔ mục liên quan, mục ↔ tình huống.
    this.adj = this.nodes.map(() => []);
    const link = (a: number, b: number) => { this.adj[a].push(b); this.adj[b].push(a); };
    g.e.forEach((e, i) => link(i, this.nE + e[2]));
    g.r.forEach(([a, b]) => link(a, b));
    g.s.forEach((s, si) => s.e.forEach((ei) => link(this.nE + this.nC + si, ei)));

    this.readColors();
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(canvas.parentElement ?? canvas);
    this.io = new IntersectionObserver((en) => { this.active = en[0]?.isIntersecting ?? true; this.dirty = true; });
    this.io.observe(canvas);
    this.mo = new MutationObserver(() => { this.readColors(); this.dirty = true; });
    this.mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { this.readColors(); this.dirty = true; });
    matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => { this.reduced = e.matches; this.dirty = true; });

    canvas.addEventListener('pointerdown', this.onDown);
    canvas.addEventListener('pointermove', this.onMove);
    canvas.addEventListener('pointerup', this.onUp);
    canvas.addEventListener('pointercancel', this.onUp);
    canvas.addEventListener('pointerleave', () => { if (this.hov) { this.hov = null; this.opts.onHover(null, 0, 0); this.dirty = true; } });
    canvas.addEventListener('wheel', this.onWheel, { passive: false });
    canvas.addEventListener('keydown', this.onKey);
    this.resize();
    const loop = (t: number) => {
      this.raf = requestAnimationFrame(loop);
      if (!this.active || document.hidden) return;
      if (this.anim) this.step(t);
      const breathe = !this.reduced;
      if (this.dirty || (breathe && t - this.last > 42)) { this.draw(t); this.dirty = false; this.last = t; }
    };
    this.raf = requestAnimationFrame(loop);
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.ro.disconnect(); this.io.disconnect(); this.mo.disconnect();
  }

  /* ---------- Màu theo theme ---------- */
  private readColors() {
    const cs = getComputedStyle(document.documentElement);
    const v = (n: string) => cs.getPropertyValue(n).trim();
    this.col = { bg: v('--bg'), surface: v('--surface'), text: v('--text'), muted: v('--muted'), accent: v('--accent'), danger: v('--danger'), num: v('--num') };
    this.tones = [1, 2, 3, 4, 5, 6, 7].map((n) => v(`--tone-${n}`));
  }
  private tone(g: number) { return this.tones[(this.g.g[g]?.k ?? 1) - 1] ?? this.col.accent; }

  /* ---------- Kích thước, camera ---------- */
  resize() {
    const r = (this.canvas.parentElement ?? this.canvas).getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = Math.max(1, Math.round(r.width)); this.h = Math.max(1, Math.round(r.height));
    this.canvas.width = Math.round(this.w * this.dpr); this.canvas.height = Math.round(this.h * this.dpr);
    this.canvas.style.width = `${this.w}px`; this.canvas.style.height = `${this.h}px`;
    if (!this.fitted && this.w > 10) { this.fit(false); this.fitted = true; }
    this.dirty = true;
  }
  private rect() {
    const i = this.opts.insets();
    return { L: i.l, R: this.w - i.r, T: i.t, B: this.h - i.b };
  }
  fit(animate = true) {
    const { L, R, T, B } = this.rect();
    const b = this.g.b, m = 60;
    const bw = b.maxX - b.minX + 2 * m, bh = b.maxY - b.minY + 2 * m;
    const k = Math.max(K_MIN, Math.min((R - L) / bw, (B - T) / bh));
    const cx = (b.minX + b.maxX) / 2, cy = (b.minY + b.maxY) / 2;
    this.go(k, (L + R) / 2 - cx * k, (T + B) / 2 - cy * k, animate);
  }
  private go(k: number, tx: number, ty: number, animate: boolean) {
    if (!animate || this.reduced) { this.k = k; this.tx = tx; this.ty = ty; this.anim = null; this.dirty = true; return; }
    this.anim = { t0: performance.now(), ms: 520, from: [this.k, this.tx, this.ty], to: [k, tx, ty] };
  }
  private step(t: number) {
    const a = this.anim!;
    const p = Math.min(1, (t - a.t0) / a.ms), e = ease(p);
    // Phóng/thu nội suy theo log để mượt khi đổi mức lớn.
    this.k = Math.exp(Math.log(a.from[0]) + (Math.log(a.to[0]) - Math.log(a.from[0])) * e);
    this.tx = a.from[1] + (a.to[1] - a.from[1]) * e;
    this.ty = a.from[2] + (a.to[2] - a.from[2]) * e;
    this.dirty = true;
    if (p >= 1) this.anim = null;
  }
  zoomBy(f: number, sx?: number, sy?: number) {
    const { L, R, T, B } = this.rect();
    const cx = sx ?? (L + R) / 2, cy = sy ?? (T + B) / 2;
    const k = Math.max(K_MIN, Math.min(K_MAX, this.k * f));
    const wx = (cx - this.tx) / this.k, wy = (cy - this.ty) / this.k;
    this.go(k, cx - wx * k, cy - wy * k, false);
  }
  /** Đưa một nút vào giữa vùng nhìn thấy (trừ các bảng đang che), phóng vừa phải. */
  focus(h: Hit, k?: number) {
    if (!h) return;
    const n = this.node(h)!;
    const { L, R, T, B } = this.rect();
    const kk = Math.max(K_MIN, Math.min(K_MAX, k ?? (h.k === 'e' ? 2.6 : h.k === 'c' ? 1.5 : 1.3)));
    this.go(Math.max(this.k, kk), (L + R) / 2 - n.x * Math.max(this.k, kk), (T + B) / 2 - n.y * Math.max(this.k, kk), true);
  }
  /** Đưa cả một nhóm chương vào khung nhìn. */
  focusGroup(gi: number) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const n of this.nodes) if (n.g === gi) { x0 = Math.min(x0, n.x); x1 = Math.max(x1, n.x); y0 = Math.min(y0, n.y); y1 = Math.max(y1, n.y); }
    if (!isFinite(x0)) return;
    const { L, R, T, B } = this.rect(), m = 50;
    const k = Math.max(K_MIN, Math.min(K_MAX, Math.min((R - L) / (x1 - x0 + 2 * m), (B - T) / (y1 - y0 + 2 * m))));
    this.go(k, (L + R) / 2 - ((x0 + x1) / 2) * k, (T + B) / 2 - ((y0 + y1) / 2) * k, true);
  }
  private node(h: NonNullable<Hit>) {
    return this.nodes[h.k === 'e' ? h.i : h.k === 'c' ? this.nE + h.i : this.nE + this.nC + h.i];
  }
  screenOf(h: NonNullable<Hit>) { const n = this.node(h)!; return { x: n.x * this.k + this.tx, y: n.y * this.k + this.ty }; }

  /* ---------- Trạng thái hiển thị ---------- */
  select(h: Hit) { this.sel = h; this.dirty = true; }
  setDim(gi: number | null) { this.dim = gi; this.dirty = true; }
  setMarks(m: Marks) { this.marks = m; this.dirty = true; }
  redraw() { this.dirty = true; }

  /* ---------- Chạm, kéo, phóng ---------- */
  private pos(e: PointerEvent | WheelEvent) {
    const r = this.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  hit(sx: number, sy: number, px: number): Hit {
    const wx = (sx - this.tx) / this.k, wy = (sy - this.ty) / this.k;
    const rad = px / this.k;
    const c0x = Math.floor((wx - rad) / CELL), c1x = Math.floor((wx + rad) / CELL);
    const c0y = Math.floor((wy - rad) / CELL), c1y = Math.floor((wy + rad) / CELL);
    let best: Node | null = null, bd = Infinity;
    for (let cx = c0x; cx <= c1x; cx++) for (let cy = c0y; cy <= c1y; cy++) {
      const cell = this.grid.get(key(cx, cy));
      if (!cell) continue;
      for (const n of cell) {
        if (this.dim !== null && n.k !== 's' && n.g !== this.dim) continue;
        const d = Math.hypot(n.x - wx, n.y - wy) - Math.max(n.r, MIN_PX[n.k] / this.k) - (n.k === 'e' ? 0 : 6 / this.k);
        if (d < rad && d < bd) { bd = d; best = n; }
      }
    }
    return best ? { k: best.k, i: best.i } : null;
  }
  private onDown = (e: PointerEvent) => {
    this.canvas.setPointerCapture(e.pointerId);
    const p = this.pos(e);
    this.ptrs.set(e.pointerId, p);
    this.anim = null;
    if (this.ptrs.size === 1) this.down = { x: p.x, y: p.y, t: performance.now(), moved: false };
    if (this.ptrs.size === 2) {
      const [a, b] = [...this.ptrs.values()];
      const cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
      this.pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), k: this.k, wx: (cx - this.tx) / this.k, wy: (cy - this.ty) / this.k };
      if (this.down) this.down.moved = true;
    }
  };
  private onMove = (e: PointerEvent) => {
    const p = this.pos(e);
    const prev = this.ptrs.get(e.pointerId);
    if (prev) {
      this.ptrs.set(e.pointerId, p);
      if (this.pinch && this.ptrs.size >= 2) {
        const [a, b] = [...this.ptrs.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y), cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
        const k = Math.max(K_MIN, Math.min(K_MAX, this.pinch.k * (d / this.pinch.d)));
        this.k = k; this.tx = cx - this.pinch.wx * k; this.ty = cy - this.pinch.wy * k; this.dirty = true;
        return;
      }
      if (this.down) {
        if (!this.down.moved && Math.hypot(p.x - this.down.x, p.y - this.down.y) > 5) this.down.moved = true;
        if (this.down.moved) { this.tx += p.x - prev.x; this.ty += p.y - prev.y; this.dirty = true; this.canvas.style.cursor = 'grabbing'; }
      }
      return;
    }
    if (e.pointerType === 'mouse') {
      const h = this.hit(p.x, p.y, 12);
      if (JSON.stringify(h) !== JSON.stringify(this.hov)) { this.hov = h; this.dirty = true; this.canvas.style.cursor = h ? 'pointer' : 'grab'; }
      this.opts.onHover(h, p.x, p.y);
    }
  };
  private onUp = (e: PointerEvent) => {
    const p = this.pos(e);
    const wasDown = this.down;
    this.ptrs.delete(e.pointerId);
    if (this.ptrs.size < 2) this.pinch = null;
    this.canvas.style.cursor = 'grab';
    if (this.ptrs.size === 0 && wasDown && !wasDown.moved && e.type === 'pointerup' && performance.now() - wasDown.t < 600) {
      const h = this.hit(p.x, p.y, e.pointerType === 'mouse' ? 12 : 24);
      this.opts.onSelect(h);
    }
    if (this.ptrs.size === 0) this.down = null;
  };
  private onWheel = (e: WheelEvent) => {
    e.preventDefault();
    const p = this.pos(e);
    const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
    this.zoomBy(Math.exp(-dy * (e.ctrlKey ? 0.01 : 0.0016)), p.x, p.y);
  };
  private onKey = (e: KeyboardEvent) => {
    const step = 60;
    if (e.key === '+' || e.key === '=') this.zoomBy(1.25);
    else if (e.key === '-' || e.key === '_') this.zoomBy(0.8);
    else if (e.key === '0') this.fit();
    else if (e.key === 'ArrowLeft') this.go(this.k, this.tx + step, this.ty, false);
    else if (e.key === 'ArrowRight') this.go(this.k, this.tx - step, this.ty, false);
    else if (e.key === 'ArrowUp') this.go(this.k, this.tx, this.ty + step, false);
    else if (e.key === 'ArrowDown') this.go(this.k, this.tx, this.ty - step, false);
    else return;
    e.preventDefault();
  };

  /* ---------- Vẽ ---------- */
  private isDimmed(n: Node) { return this.dim !== null && n.k !== 's' && n.g !== this.dim; }
  private activeSet(): Set<number> {
    const s = new Set<number>();
    for (const h of [this.sel, this.hov]) {
      if (!h) continue;
      const id = this.node(h)!.id;
      s.add(id);
      for (const a of this.adj[id]) s.add(a);
    }
    return s;
  }
  private draw(t: number) {
    const { ctx, k } = this;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.w, this.h);
    ctx.translate(this.tx, this.ty);
    ctx.scale(k, k);
    const g = this.g, N = this.nodes, nE = this.nE, nC = this.nC;
    const x0 = -this.tx / k - 40, y0 = -this.ty / k - 40, x1 = (this.w - this.tx) / k + 40, y1 = (this.h - this.ty) / k + 40;
    const inView = (n: Node) => n.x > x0 && n.x < x1 && n.y > y0 && n.y < y1;
    const lw = (px: number) => px / k;
    const act = this.activeSet();

    // Cạnh chương → mục (mảnh, màu nhóm)
    ctx.lineCap = 'round';
    for (let gi = 0; gi < g.g.length; gi++) {
      if (this.dim !== null && this.dim !== gi) continue;
      ctx.beginPath();
      for (let i = 0; i < nE; i++) {
        const e = g.e[i], c = N[nE + e[2]];
        if (c.g !== gi) continue;
        const n = N[i];
        if (!inView(n) && !inView(c)) continue;
        ctx.moveTo(c.x, c.y); ctx.lineTo(n.x, n.y);
      }
      ctx.globalAlpha = 0.2; ctx.strokeStyle = this.tone(gi); ctx.lineWidth = lw(0.7); ctx.stroke();
    }
    // Cạnh mục ↔ mục liên quan
    ctx.beginPath();
    for (const [a, b] of g.r) {
      if (this.dim !== null && (N[a].g !== this.dim && N[b].g !== this.dim)) continue;
      ctx.moveTo(N[a].x, N[a].y); ctx.lineTo(N[b].x, N[b].y);
    }
    ctx.globalAlpha = 0.34; ctx.strokeStyle = this.col.muted; ctx.lineWidth = lw(0.8); ctx.stroke();
    // Cạnh tình huống → mục
    ctx.beginPath();
    g.s.forEach((s, si) => { const sn = N[nE + nC + si]; for (const ei of s.e) { ctx.moveTo(sn.x, sn.y); ctx.lineTo(N[ei].x, N[ei].y); } });
    ctx.globalAlpha = 0.13; ctx.strokeStyle = this.col.num; ctx.lineWidth = lw(0.8); ctx.stroke();
    // Cạnh sáng lên quanh nút đang chọn/đang rê
    for (const h of [this.sel, this.hov]) {
      if (!h) continue;
      const n = this.node(h)!;
      ctx.beginPath();
      for (const a of this.adj[n.id]) { ctx.moveTo(n.x, n.y); ctx.lineTo(N[a].x, N[a].y); }
      ctx.globalAlpha = 0.85; ctx.strokeStyle = n.k === 's' ? this.col.num : this.tone(n.k === 'c' ? n.g : n.g); ctx.lineWidth = lw(1.5); ctx.stroke();
    }

    // Nút mục
    const anyAct = act.size > 0;
    for (let i = 0; i < nE; i++) {
      const n = N[i];
      if (!inView(n)) continue;
      const e = g.e[i];
      const sr = Math.max(n.r * k, MIN_PX.e) / k;
      const read = this.marks.read.has(e[0]), done = this.marks.done.has(e[0]);
      let a = 1;
      if (this.isDimmed(n)) a = 0.12;
      else if (read || done) a = 0.5;
      ctx.globalAlpha = a;
      ctx.beginPath(); ctx.arc(n.x, n.y, sr, 0, TAU);
      ctx.fillStyle = this.tone(n.g); ctx.fill();
      if (isReview(e[6])) {
        ctx.beginPath(); ctx.arc(n.x, n.y, sr + 1.6 / k, 0, TAU);
        ctx.strokeStyle = this.col.danger; ctx.lineWidth = lw(1.4); ctx.globalAlpha = a < 1 ? a : 1; ctx.stroke();
      }
      if (done || (read && k > 1.2)) {
        ctx.globalAlpha = 1;
        ctx.beginPath(); ctx.arc(n.x + sr * 0.9, n.y - sr * 0.9, Math.max(2.4 / k, sr * 0.5), 0, TAU);
        ctx.fillStyle = done ? this.col.accent : this.col.muted; ctx.fill();
        ctx.strokeStyle = this.col.surface; ctx.lineWidth = lw(1); ctx.stroke();
      }
      if (anyAct && act.has(n.id)) {
        ctx.globalAlpha = 1;
        ctx.beginPath(); ctx.arc(n.x, n.y, sr + 3 / k, 0, TAU);
        ctx.strokeStyle = this.tone(n.g); ctx.lineWidth = lw(1.2); ctx.stroke();
      }
    }

    // Nút chương
    const breathe = this.reduced ? 0 : 1;
    for (let i = 0; i < nC; i++) {
      const n = N[nE + i];
      if (!inView(n)) continue;
      const a = this.isDimmed(n) ? 0.18 : 1;
      const sr = Math.max(n.r * k, MIN_PX.c) / k;
      const pulse = 1 + breathe * 0.07 * Math.sin(t / 1500 + i * 0.9);
      ctx.globalAlpha = a * 0.16;
      ctx.beginPath(); ctx.arc(n.x, n.y, sr * 1.75 * pulse, 0, TAU); ctx.fillStyle = this.tone(n.g); ctx.fill();
      ctx.globalAlpha = a;
      ctx.beginPath(); ctx.arc(n.x, n.y, sr, 0, TAU); ctx.fillStyle = this.tone(n.g); ctx.fill();
      ctx.strokeStyle = this.col.surface; ctx.lineWidth = lw(1.5); ctx.stroke();
    }

    // Nút tình huống (lục giác)
    g.s.forEach((s, si) => {
      const n = N[nE + nC + si];
      if (!inView(n)) return;
      const sr = Math.max(n.r * k, MIN_PX.s) / k;
      ctx.globalAlpha = 1;
      ctx.beginPath();
      for (let j = 0; j < 6; j++) { const an = Math.PI / 6 + (j * TAU) / 6; const px = n.x + Math.cos(an) * sr, py = n.y + Math.sin(an) * sr; j ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
      ctx.closePath();
      ctx.fillStyle = this.col.surface; ctx.fill();
      ctx.strokeStyle = this.col.num; ctx.lineWidth = lw(2); ctx.stroke();
      ctx.beginPath(); ctx.arc(n.x, n.y, sr * 0.28, 0, TAU); ctx.fillStyle = this.col.num; ctx.fill();
    });

    // Nút đang chọn: phóng to + vòng nhấn
    if (this.sel) {
      const n = this.node(this.sel)!;
      const base = Math.max(n.r * k, MIN_PX[n.k]) / k;
      ctx.globalAlpha = 1;
      ctx.beginPath(); ctx.arc(n.x, n.y, base * 2.1 + Math.sin(t / 500) * (this.reduced ? 0 : 0.6) / k, 0, TAU);
      ctx.strokeStyle = this.col.text; ctx.lineWidth = lw(1.6); ctx.stroke();
      if (n.k === 'e') {
        ctx.beginPath(); ctx.arc(n.x, n.y, base * 1.5, 0, TAU); ctx.fillStyle = this.tone(n.g); ctx.fill();
        ctx.strokeStyle = this.col.surface; ctx.lineWidth = lw(1.5); ctx.stroke();
      }
    }

    // Nhãn: chỉ chương, tình huống đang rê/chọn; tránh chồng bằng ô chữ nhật đã đặt
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.globalAlpha = 1; ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
    const placed: [number, number, number, number][] = [];
    const clash = (r: [number, number, number, number]) => placed.some((p) => r[0] < p[2] && r[2] > p[0] && r[1] < p[3] && r[3] > p[1]);
    const label = (txt: string, wx: number, wy: number, off: number, font: string, color: string, force: boolean) => {
      const sx = wx * k + this.tx, sy = wy * k + this.ty + off;
      if (sx < -80 || sx > this.w + 80 || sy < -20 || sy > this.h + 20) return;
      ctx.font = font;
      const w = ctx.measureText(txt).width + 8;
      const r: [number, number, number, number] = [sx - w / 2, sy - 9, sx + w / 2, sy + 9];
      if (!force && clash(r)) return;
      placed.push(r);
      ctx.lineJoin = 'round'; ctx.lineWidth = 4; ctx.strokeStyle = this.col.bg; ctx.strokeText(txt, sx, sy);
      ctx.fillStyle = color; ctx.fillText(txt, sx, sy);
    };
    const cut = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s);
    const selId = this.sel ? this.node(this.sel)!.id : -1, hovId = this.hov ? this.node(this.hov)!.id : -1;
    if (selId >= nE + nC) { const s = g.s[selId - nE - nC]; label(cut(s.t, 34), s.x, s.y, 20 + 4, '600 13px "Source Serif 4", Georgia, serif', this.col.text, true); }
    if (hovId >= nE + nC && hovId !== selId) { const s = g.s[hovId - nE - nC]; label(cut(s.t, 34), s.x, s.y, 24, '600 13px "Source Serif 4", Georgia, serif', this.col.text, true); }
    const order = g.c.map((_, i) => i).sort((a, b) => (nE + a === selId ? -1 : nE + b === selId ? 1 : 0) || g.e.filter((e) => e[2] === b).length - g.e.filter((e) => e[2] === a).length);
    for (const i of order) {
      const c = g.c[i];
      if (this.dim !== null && c.g !== this.dim) continue;
      const force = nE + i === selId || nE + i === hovId;
      const short = k < 0.5;
      const txt = short ? String(c.n) : `${c.n} · ${cut(c.t, k > 1.2 ? 40 : 24)}`;
      label(txt, c.x, c.y, Math.max(R_CHAPTER * k, MIN_PX.c) + 13, '600 12.5px "Source Serif 4", Georgia, serif', this.col.text, force);
    }
  }
}
