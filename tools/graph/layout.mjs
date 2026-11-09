// Bố cục bản đồ tri thức, tính SẴN lúc build (không chạy mô phỏng lực trên trình duyệt).
// Hàm thuần: nhận dữ liệu thuần, trả về tọa độ thế giới cho chương, mục, tình huống. Xác định (cùng đầu vào, cùng kết quả).
//
// Ý tưởng: mỗi chương là một "đĩa" gồm nút chương ở tâm và các mục xếp theo đường xoắn ốc hướng dương (phyllotaxis),
// nên không bao giờ chồng nhau. 36 đĩa được gom quanh tâm của nhóm chủ đề rồi đẩy nhau ra bằng một vòng lặp va chạm ngắn.
// Tình huống (hình lục giác) đặt thành vành ngoài, theo hướng trọng tâm các mục mà nó nối tới.

const SPACING = 8.6; // khoảng cách giữa các mục trong đĩa chương
const CORE = 26; // bán kính nút chương + khoảng trống quanh nó
const GAP = 22; // khoảng cách tối thiểu giữa hai đĩa
const GOLDEN = Math.PI * (3 - Math.sqrt(5));

const r1 = (x) => Math.round(x * 10) / 10;

/**
 * @param {{
 *  groups: {slug:string, chapters:number[]}[],
 *  chapters: {n:number}[],
 *  entries: {id:string, ch:number, related:string[], sits:string[]}[],
 *  sits: {slug:string}[],
 * }} input
 * @returns {{
 *  chapterPos: Map<number,{x:number,y:number,r:number}>,
 *  entryPos: Map<string,{x:number,y:number}>,
 *  sitPos: Map<string,{x:number,y:number}>,
 *  bounds: {minX:number,minY:number,maxX:number,maxY:number},
 * }}
 */
export function layoutGraph({ groups, chapters, entries, sits }) {
  const count = new Map(chapters.map((c) => [c.n, 0]));
  for (const e of entries) count.set(e.ch, (count.get(e.ch) ?? 0) + 1);
  const k0 = (CORE / SPACING) ** 2;
  const radiusOf = (n) => SPACING * Math.sqrt(Math.max(count.get(n) ?? 0, 1) - 1 + k0) + 6;

  // 1. Đĩa chương: vị trí đầu theo nhóm, rồi đẩy nhau ra.
  const groupOf = new Map();
  groups.forEach((g, gi) => g.chapters.forEach((n) => groupOf.set(n, gi)));
  const G = groups.length;
  const ring = 330;
  const anchor = (gi) => {
    const a = -Math.PI / 2 + (2 * Math.PI * gi) / G;
    return { x: Math.cos(a) * ring, y: Math.sin(a) * ring };
  };
  const discs = chapters.map((c, i) => {
    const gi = groupOf.get(c.n) ?? 0;
    const a0 = anchor(gi);
    const idx = groups[gi] ? groups[gi].chapters.indexOf(c.n) : i;
    const ang = idx * GOLDEN * 2.1;
    const rad = 40 + 30 * Math.sqrt(idx);
    return { n: c.n, gi, x: a0.x + Math.cos(ang) * rad, y: a0.y + Math.sin(ang) * rad, r: radiusOf(c.n) };
  });
  for (let it = 0; it < 700; it++) {
    for (let i = 0; i < discs.length; i++) {
      for (let j = i + 1; j < discs.length; j++) {
        const a = discs[i], b = discs[j];
        let dx = b.x - a.x, dy = b.y - a.y;
        let d = Math.hypot(dx, dy);
        const min = a.r + b.r + GAP;
        if (d < min) {
          if (d < 1e-6) { dx = 1; dy = 0; d = 1; }
          const push = (min - d) / 2;
          const ux = dx / d, uy = dy / d;
          a.x -= ux * push; a.y -= uy * push;
          b.x += ux * push; b.y += uy * push;
        }
      }
    }
    for (const d of discs) {
      const a = anchor(d.gi);
      d.x += (a.x - d.x) * 0.006; d.y += (a.y - d.y) * 0.006; // về tâm nhóm
      d.x -= d.x * 0.002; d.y -= d.y * 0.002; // về gốc
    }
  }
  const chapterPos = new Map(discs.map((d) => [d.n, { x: r1(d.x), y: r1(d.y), r: r1(d.r) }]));

  // 2. Mục: xoắn ốc quanh nút chương, thứ tự theo số mục.
  const entryPos = new Map();
  const seen = new Map();
  for (const e of entries) {
    const c = chapterPos.get(e.ch);
    const i = seen.get(e.ch) ?? 0;
    seen.set(e.ch, i + 1);
    const rad = SPACING * Math.sqrt(i + k0);
    const ang = i * GOLDEN + e.ch * 0.9;
    entryPos.set(e.id, { x: r1(c.x + Math.cos(ang) * rad), y: r1(c.y + Math.sin(ang) * rad) });
  }

  // 3. Tình huống: vành ngoài theo hướng trọng tâm các mục liên quan.
  let maxR = 0;
  for (const p of entryPos.values()) maxR = Math.max(maxR, Math.hypot(p.x, p.y));
  const sitAngles = sits.map((s) => {
    let sx = 0, sy = 0, n = 0;
    for (const e of entries) if (e.sits.includes(s.slug)) { const p = entryPos.get(e.id); sx += p.x; sy += p.y; n++; }
    return { slug: s.slug, a: n ? Math.atan2(sy / n, sx / n) : 0 };
  });
  sitAngles.sort((p, q) => p.a - q.a);
  const gap = Math.min(0.3, (2 * Math.PI) / (sitAngles.length * 1.3 || 1));
  for (let i = 1; i < sitAngles.length; i++) if (sitAngles[i].a - sitAngles[i - 1].a < gap) sitAngles[i].a = sitAngles[i - 1].a + gap;
  const sitPos = new Map(sitAngles.map((s) => [s.slug, { x: r1(Math.cos(s.a) * (maxR + 70)), y: r1(Math.sin(s.a) * (maxR + 70)) }]));

  const all = [...entryPos.values(), ...sitPos.values(), ...[...chapterPos.values()]];
  const bounds = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  for (const p of all) {
    bounds.minX = Math.min(bounds.minX, p.x); bounds.maxX = Math.max(bounds.maxX, p.x);
    bounds.minY = Math.min(bounds.minY, p.y); bounds.maxY = Math.max(bounds.maxY, p.y);
  }
  return { chapterPos, entryPos, sitPos, bounds };
}
