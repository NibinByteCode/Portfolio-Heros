import { useEffect, useRef } from "react"
import { addPropertyControls, ControlType } from "framer"

/**
 * Framer Code Component: Neon Field Background.
 * Create a new Code File in Framer, paste this in, drag the component onto a frame
 * (set it to fill the page / fixed position) and put your hero content above it.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
/* NeonField — procedural neon-green data-field renderer (Canvas 2D, resolution independent). */
function createNeonField(canvas, options) {
  const o = Object.assign({ rgb: [46, 255, 96], maxDpr: 2, maxPixels: 8.6e6, density: 1, parallax: true }, options || {});
  const ctx = canvas.getContext('2d', { alpha: false });
  const R = o.rgb[0], G = o.rgb[1], B = o.rgb[2];
  const rand = (a, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));
  const gauss = () => (Math.random() + Math.random() + Math.random() + Math.random() - 2) * 1.7;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const col = (a, w) => {
    w = w || 0;
    return 'rgba(' + ((R + (255 - R) * w) | 0) + ',' + ((G + (255 - G) * w) | 0) + ',' + ((B + (255 - B) * w) | 0) + ',' + a + ')';
  };

  let W = 0, H = 0, dpr = 1, U = 1, K = 1, bandY = 0, bh = 0;
  let raf = 0, running = false, onscreen = true, tPrev = 0, time = 0;
  let px = 0, py = 0, tx = 0, ty = 0;
  let bloomOn = true, lowQ = false, slowFrames = 0, ema = 16;
  let dust = [], streams = [], rows = [], codes = [], crosses = [], diamonds = [], bokeh = [];
  let small = null, sctx = null, codeSprites = [];
  let ro = null, destroyed = false;

  /* ---------- sprites ---------- */
  const mk = (s, fn) => { const c = document.createElement('canvas'); c.width = c.height = s; fn(c.getContext('2d'), s); return c; };
  const radial = (s, stops) => mk(s, (g) => {
    const r = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    stops.forEach((st) => r.addColorStop(st[0], st[1]));
    g.fillStyle = r; g.fillRect(0, 0, s, s);
  });
  const glow = radial(128, [[0, col(1, 0.85)], [0.1, col(0.95, 0.2)], [0.3, col(0.28)], [0.65, col(0.06)], [1, col(0)]]);
  const dotS = radial(64, [[0, col(1, 0.8)], [0.2, col(1, 0.1)], [0.34, col(0.85)], [0.5, col(0.2)], [1, col(0)]]);
  const disc = radial(128, [[0, col(0.22)], [0.78, col(0.3)], [0.93, col(0.75)], [1, col(0)]]);
  const plusSprite = (s, lw, blur) => mk(s, (g) => {
    const m = s / 2, len = s * 0.3;
    g.strokeStyle = col(1, 0.6); g.shadowColor = col(1); g.shadowBlur = blur; g.lineWidth = lw;
    g.beginPath(); g.moveTo(m - len, m); g.lineTo(m + len, m); g.moveTo(m, m - len); g.lineTo(m, m + len); g.stroke();
  });
  const plusSm = plusSprite(64, 2, 6);
  const plusLg = plusSprite(160, 3, 14);
  const clover = mk(128, (g, s) => {
    g.globalCompositeOperation = 'lighter';
    [[0, -22], [0, 22], [-22, 0], [22, 0]].forEach((p) => g.drawImage(glow, s / 2 + p[0] - 26, s / 2 + p[1] - 26, 52, 52));
    g.drawImage(glow, s / 2 - 30, s / 2 - 30, 60, 60);
  });

  const SNIP = [
    'function initSession() {', '  const node = await mesh.connect(key);', "  if (!node.verified) throw new Error('denied');",
    '  stream.pipe(decrypt(0x7f3a));', '}', 'SELECT id, hash FROM packets WHERE ttl > 0;',
    'for (let i = 0; i < n; i++) buf[i] ^= k;', "await fetch('/api/v2/handshake');", 'public async Task<IActionResult> Sync()',
    'const [data, setData] = useState(null);', 'docker compose up --build -d', 'git push origin main', 'ssh -i key.pem root@10.0.0.7',
    '0x7F3A 0x00FF 0xA1B2 0x9C04', 'return await repo.FindAsync(id);', 'export default function Node() {', 'while (queue.length) dispatch(queue.pop());',
    'kubectl rollout status deploy/api', 'if (sig === expected) accept(pkt);', 'npm run build && deploy --prod',
  ];
  function codeSprite() {
    const n = 3 + ((Math.random() * 4) | 0), lines = [];
    for (let i = 0; i < n; i++) lines.push(SNIP[(Math.random() * SNIP.length) | 0].slice(0, 30 + ((Math.random() * 12) | 0)));
    const fs = Math.max(8, 7.5 * U), pad = Math.ceil(fs * 0.7), lh = fs * 1.45;
    const font = fs + 'px "JetBrains Mono",ui-monospace,Menlo,Consolas,monospace';
    const c = document.createElement('canvas'), g = c.getContext('2d');
    g.font = font; let w = 0; lines.forEach((l) => { w = Math.max(w, g.measureText(l).width); });
    c.width = Math.ceil(w + pad * 2); c.height = Math.ceil(n * lh + pad * 2);
    g.font = font; g.textBaseline = 'top'; g.shadowColor = col(0.9); g.shadowBlur = fs * 0.5; g.fillStyle = col(0.95, 0.25);
    lines.forEach((l, i) => g.fillText(l, pad, pad + i * lh));
    return c;
  }

  /* ---------- scene ---------- */
  const spawnDust = (first) => {
    const central = Math.random() < 0.7;
    return {
      x: central ? 0.5 + gauss() * 0.12 : rand(-0.05, 1.05),
      y: gauss() * (central ? 0.035 : 0.07) + (Math.random() < 0.15 ? gauss() * 0.18 : 0),
      z: first ? Math.random() : rand(0, 0.08), vz: rand(0.006, 0.03), s: Math.random() < 0.8 ? rand(0.35, 0.8) : rand(0.8, 1.7),
      ph: rand(6.28), tw: rand(0.8, 3), w: Math.random() < 0.12,
    };
  };
  function spawnCode(c, first) {
    c.spr = codeSprite(); c.scale = Math.random() < 0.1 ? rand(2.2, 3) : rand(0.9, 1.2);
    c.x = rand(0.18, 0.88) * W; c.y = (c.scale > 2 ? rand(0.03, 0.1) : rand(0.34, 0.6)) * H;
    c.life = rand(6, 12); c.born = first ? time - rand(0, c.life) : time; c.ph = rand(6.28); c.vx = rand(-6, 6) * U;
    c.big = c.scale > 2;
  }
  function build() {
    U = clamp(Math.sqrt(W * H) / 1440, 0.5, 3);
    K = clamp((W / dpr) * (H / dpr) / (1920 * 1080), 0.3, 1.3) * o.density;
    bandY = 0.48 * H; bh = clamp(W * 0.5625, H * 0.55, H);
    dust = []; for (let i = 0, n = (1900 * K) | 0; i < n; i++) dust.push(spawnDust(true));

    streams = [];
    [[.205, .27, .40, 1], [.597, .27, .40, .8], [.69, .0, .15, .6], [.80, .0, .18, .5], [.6, .0, .1, .5], [.01, .28, .2, .4], [.99, .35, .2, .5],
      [.40, .62, .14, .5], [.46, .28, .12, .5], [.30, .40, .2, .4]].forEach((s) => streams.push({ x: s[0], top: s[1], len: s[2], str: s[3], sp: rand(8, 30), ph: rand(6.28) }));
    for (let i = 0; i < 6; i++) streams.push({ x: rand(0.05, 0.95), top: rand(0.25, 0.55), len: rand(0.08, 0.2), str: rand(0.25, 0.5), sp: rand(8, 30), ph: rand(6.28) });
    rows = [{ v: 0.345, a: 0.3 }, { v: 0.52, a: 0.12 }, { v: 0.628, a: 0.26 }];

    crosses = [[.423, .385], [.578, .385], [.735, .385], [.423, .475], [.578, .475], [.735, .475], [.423, .565], [.578, .565], [.735, .565]]
      .map((p) => ({ x: p[0], y: p[1], ph: rand(6.28) }));
    diamonds = [[.423, .294], [.579, .294], [.736, .294], [.423, .654], [.578, .654], [.733, .654]].map((p) => ({ x: p[0], y: p[1], ph: rand(6.28) }));

    bokeh = [];
    [[.151, .848, 9, .85], [.221, .848, 10, .6], [.36, .848, 9, .25], [.639, .848, 9, .2], [.709, .848, 10, .6], [.778, .848, 9, .22], [.849, .848, 8, .15], [.919, .848, 9, .25]]
      .forEach((b) => bokeh.push({ k: 0, x: b[0], y: b[1], r: b[2], a: b[3], ph: rand(6.28) }));
    bokeh.push({ k: 1, x: .501, y: .03, r: 20, a: .95, ph: 1 }, { k: 1, x: .5, y: .797, r: 20, a: .95, ph: 2 }, { k: 1, x: .07, y: .045, r: 30, a: .5, ph: 3 },
      { k: 2, x: .065, y: .903, r: 28, a: .9, ph: 4 }, { k: 2, x: .944, y: .903, r: 28, a: .9, ph: 5 });

    codeSprites = []; codes = [];
    for (let i = 0, n = Math.max(4, Math.round(8 * K)); i < n; i++) { const c = {}; spawnCode(c, true); codes.push(c); }

    const sw = Math.max(64, (W / 5) | 0), sh = Math.max(36, (H / 5) | 0);
    small = document.createElement('canvas'); small.width = sw; small.height = sh; sctx = small.getContext('2d');
  }

  function resize() {
    const r = canvas.getBoundingClientRect();
    let d = Math.min(window.devicePixelRatio || 1, o.maxDpr);
    const cw = Math.max(2, r.width), ch = Math.max(2, r.height);
    while (cw * ch * d * d > o.maxPixels && d > 0.5) d *= 0.92;
    dpr = d; W = canvas.width = Math.round(cw * d); H = canvas.height = Math.round(ch * d);
    build();
    if (!running) render(0);
  }

  /* ---------- drawing ---------- */
  const spr = (img, x, y, w, h, a) => { ctx.globalAlpha = a; ctx.drawImage(img, x - w / 2, y - h / 2, w, h); };

  function render(dt) {
    time += dt;
    px += (tx - px) * Math.min(1, dt * 3); py += (ty - py) * Math.min(1, dt * 3);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    ctx.fillStyle = '#010402'; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    const cx = W / 2, ox = px * W * 0.012, oy = py * H * 0.008;

    // central haze + radial burst
    spr(glow, cx + ox, bandY + oy, W * 0.55, bh * 0.16, 0.2 + 0.04 * Math.sin(time * 0.9));
    ctx.strokeStyle = col(0.14); ctx.lineWidth = Math.max(1, U * 0.8); ctx.beginPath();
    for (let i = 0; i < 56; i++) {
      const a = (i / 56) * 6.283 + time * 0.03, r0 = 8 * U, r1 = (30 + 45 * ((i * 7919) % 13) / 13) * U;
      ctx.moveTo(cx + ox + Math.cos(a) * r0, bandY + oy + Math.sin(a) * r0 * 0.6); ctx.lineTo(cx + ox + Math.cos(a) * r1, bandY + oy + Math.sin(a) * r1 * 0.6);
    }
    ctx.globalAlpha = 0.8 + 0.2 * Math.sin(time * 1.3); ctx.stroke();

    // horizontal dotted rows
    ctx.fillStyle = col(1);
    rows.forEach((r) => {
      const gap = 30 * U, n = Math.ceil(W / gap), y = r.v * H + oy * 0.6, s = Math.max(1, 1.5 * U);
      for (let i = 0; i <= n; i++) {
        const x = i * gap + ((time * 6 * U) % gap) * 0 + ox * 0.6, dx = Math.abs(x / W - 0.5) * 2;
        ctx.globalAlpha = r.a * (1 - 0.65 * smooth(0.3, 1, dx)) * (0.7 + 0.3 * Math.sin(time * 1.5 + i * 0.7));
        ctx.fillRect(x, y, s, s);
      }
    });

    // vertical dotted streams
    streams.forEach((s) => {
      const gap = (s.str > 0.7 ? 20 : 26) * U, len = s.len * H, n = Math.ceil(len / gap) + 1, flow = (time * s.sp * U) % gap;
      const x = s.x * W + ox * (0.5 + s.str), top = s.top * H + oy;
      for (let k = 0; k < n; k++) {
        const yy = k * gap + flow, t = yy / len; if (t < 0 || t > 1) continue;
        const env = Math.pow(Math.sin(Math.PI * t), 0.6), size = (0.9 + t * 2.6 * s.str) * U;
        const a = (0.4 + 0.55 * s.str) * env * (0.75 + 0.25 * Math.sin(time * 2 - k * 0.35 + s.ph));
        if (size < 2) { ctx.globalAlpha = a; ctx.fillRect(x - size / 2, top + yy, size, size); } else spr(dotS, x, top + yy, size * 3, size * 3, a);
      }
    });

    // dust particles (perspective drift toward camera)
    const step = lowQ ? 2 : 1;
    for (let i = 0; i < dust.length; i += step) {
      const p = dust[i]; p.z += p.vz * dt; if (p.z > 1.1) { dust[i] = spawnDust(false); continue; }
      const f = 0.55 + p.z * 0.9, sx = cx + (p.x - 0.5) * W * f + ox * (0.4 + p.z), sy = bandY + p.y * bh * (0.5 + p.z * 1.6) + oy * (0.4 + p.z);
      const edge = 1 - smooth(0.55, 1, Math.abs(sx / W - 0.5) * 2); if (edge <= 0.01) continue;
      const a = edge * smooth(0, 0.15, p.z) * (1 - smooth(0.85, 1.1, p.z)) * (0.65 + 0.35 * Math.sin(time * p.tw + p.ph)) * (p.w ? 1 : 0.8);
      if (a < 0.02) continue;
      const size = p.s * (0.5 + p.z * 2.2) * U * 1.3;
      if (size < 2.2) { ctx.globalAlpha = a; ctx.fillRect(sx, sy, size, size); } else spr(dotS, sx, sy, size * 3.2, size * 3.2, a);
    }

    // markers
    crosses.forEach((c) => spr(plusSm, c.x * W + ox, c.y * H + oy, 17 * U, 17 * U, 0.45 + 0.25 * Math.sin(time * 1.4 + c.ph)));
    diamonds.forEach((d) => spr(dotS, d.x * W + ox, d.y * H + oy, 8 * U, 8 * U, 0.55 + 0.3 * Math.sin(time * 1.1 + d.ph)));

    // code fragments
    codes.forEach((c) => {
      const age = time - c.born, p = age / c.life; if (p > 1) { spawnCode(c, false); return; }
      const a = smooth(0, 0.1, p) * (1 - smooth(0.85, 1, p)) * (0.85 + 0.15 * Math.sin(time * 17 + c.ph)) * (c.big ? 0.16 : 0.7);
      const reveal = Math.max(0.02, smooth(0, 0.25, p)), sh = Math.ceil(c.spr.height * reveal);
      ctx.globalAlpha = a; ctx.drawImage(c.spr, 0, 0, c.spr.width, sh, c.x + c.vx * age + ox * (c.big ? 2.5 : 1), c.y + oy, c.spr.width * c.scale, sh * c.scale);
    });

    // counter chip
    {
      const w = 36 * U, h = 17 * U, x = cx + ox, y = 0.419 * H + oy;
      ctx.globalAlpha = 0.9; ctx.fillStyle = col(0.85); ctx.fillRect(x - w / 2, y - h / 2, w, h);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#021a08'; ctx.font = '700 ' + 12 * U + 'px "JetBrains Mono",ui-monospace,monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('.' + (580 + (((time * 3) | 0) % 20)), x, y + U); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = col(1);
    }

    // foreground bokeh, pills, clovers
    bokeh.forEach((b) => {
      const x = b.x * W + ox * 3, y = b.y * H + oy * 3, r = b.r * U * (W / 1672 > 1 ? 1 : 1), a = b.a * (0.8 + 0.2 * Math.sin(time * 0.9 + b.ph));
      if (b.k === 0) spr(disc, x, y, r * 2.4, r * 2.4, a); else if (b.k === 1) spr(glow, x, y, r * 3.2, r * 1.9, a); else spr(clover, x, y, r * 4.2, r * 4.2, a);
    });

    // big edge crosshairs
    [[.057, .395], [.951, .395]].forEach((c, i) => spr(plusLg, c[0] * W + ox * 2, c[1] * H + oy * 2, 62 * U, 62 * U, 0.8 + 0.2 * Math.sin(time * 1.2 + i * 1.6)));

    // soft bloom (low-res copy added back)
    if (bloomOn) {
      sctx.globalCompositeOperation = 'copy'; sctx.drawImage(canvas, 0, 0, small.width, small.height);
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.75; ctx.imageSmoothingQuality = 'high'; ctx.drawImage(small, 0, 0, W, H);
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }

  function frame(t) {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (t - tPrev) / 1000 || 0.016); tPrev = t;
    const t0 = performance.now(); render(dt);
    ema = ema * 0.95 + (performance.now() - t0) * 0.05;
    if (ema > 12) { slowFrames++; if (slowFrames > 120) { slowFrames = 0; if (bloomOn) bloomOn = false; else lowQ = true; } } else slowFrames = 0;
  }
  const start = () => { if (running || destroyed) return; running = true; tPrev = performance.now(); raf = requestAnimationFrame(frame); };
  const stop = () => { running = false; cancelAnimationFrame(raf); };
  const sync = () => { if (onscreen && !document.hidden && !reduce.matches) start(); else stop(); };

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const onMove = (e) => { if (o.parallax) { tx = e.clientX / window.innerWidth - 0.5; ty = e.clientY / window.innerHeight - 0.5; } };
  const io = new IntersectionObserver((e) => { onscreen = e[0].isIntersecting; sync(); });
  io.observe(canvas);
  ro = new ResizeObserver(() => resize()); ro.observe(canvas);
  window.addEventListener('pointermove', onMove, { passive: true });
  document.addEventListener('visibilitychange', sync);
  reduce.addEventListener && reduce.addEventListener('change', sync);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (!destroyed) { build(); if (!running) render(0); } });
  resize(); time = 6; render(0); sync();

  return {
    destroy() { destroyed = true; stop(); io.disconnect(); ro.disconnect(); window.removeEventListener('pointermove', onMove); document.removeEventListener('visibilitychange', sync); },
  };
}

export default function NeonFieldBackground(props) {
  const { poster, color, density, parallax, style } = props
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    const rgb = hexToRgb(color)
    const field = createNeonField(canvasRef.current, { rgb, density, parallax })
    const id = requestAnimationFrame(() => requestAnimationFrame(() => wrapRef.current?.classList.add("nf-ready")))
    return () => { cancelAnimationFrame(id); field.destroy() }
  }, [color, density, parallax])

  return (
    <div ref={wrapRef} style={{ position: "relative", width: "100%", height: "100%", background: "#010402", overflow: "hidden", ...style }}>
      <style>{`
        .nf-img,.nf-canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
        .nf-img{object-fit:cover;transition:opacity 1.2s ease .2s}
        .nf-canvas{opacity:0;transition:opacity 1.2s ease}
        .nf-ready .nf-canvas{opacity:1}.nf-ready .nf-img{opacity:0}
        .nf-vig{position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse 85% 70% at 50% 48%,transparent 40%,rgba(1,4,2,.75) 100%)}
      `}</style>
      {poster && <img className="nf-img" src={poster} alt="" />}
      <canvas ref={canvasRef} className="nf-canvas" />
      <div className="nf-vig" />
    </div>
  )
}

NeonFieldBackground.defaultProps = { poster: "", color: "#2eff60", density: 1, parallax: true }

addPropertyControls(NeonFieldBackground, {
  poster: { type: ControlType.Image, title: "Poster" },
  color: { type: ControlType.Color, title: "Color", defaultValue: "#2eff60" },
  density: { type: ControlType.Number, title: "Density", min: 0.3, max: 1.3, step: 0.1, defaultValue: 1 },
  parallax: { type: ControlType.Boolean, title: "Parallax", defaultValue: true },
})

function hexToRgb(h: string): [number, number, number] {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i.exec(h || "")
  return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [46, 255, 96]
}
