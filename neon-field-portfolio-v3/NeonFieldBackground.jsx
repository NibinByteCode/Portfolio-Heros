import React, { useEffect, useRef } from 'react';

export function createNeonField(canvas, options = {}) {
  const ctx = canvas.getContext('2d', { alpha: false });
  const rgb = options.rgb || [46, 255, 96];
  const baseDensity = options.density ?? 1;
  const parallaxStrength = options.parallax ?? 0.016;

  const [r, g, b] = rgb;
  const rgba = (a) => `rgba(${r},${g},${b},${a})`;

  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MAX_PIXELS = 8600000;

  let width = 0;
  let height = 0;
  let dpr = 1;
  let isVisible = true;
  let isTabActive = typeof document !== 'undefined' ? !document.hidden : true;
  let rafId = null;
  let lastTime = 0;
  let destroyed = false;

  let bloomEnabled = true;
  let particleScale = 1.0;
  let frameTimeEma = 16.6;
  let qualityCheckTimer = 0;

  let targetMouseX = 0;
  let targetMouseY = 0;
  let mouseX = 0;
  let mouseY = 0;

  const bloomCanvas = document.createElement('canvas');
  const bloomCtx = bloomCanvas.getContext('2d');

  function createGlowSprite(size, innerAlpha) {
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    const cctx = c.getContext('2d');
    const half = size / 2;
    const grad = cctx.createRadialGradient(half, half, 0, half, half, half);
    grad.addColorStop(0, rgba(innerAlpha));
    grad.addColorStop(0.35, rgba(innerAlpha * 0.45));
    grad.addColorStop(1, rgba(0));
    cctx.fillStyle = grad;
    cctx.fillRect(0, 0, size, size);
    return c;
  }

  const discSprite = createGlowSprite(64, 0.55);
  const pillSprite = createGlowSprite(128, 0.42);
  const cloverSprite = createGlowSprite(48, 0.5);

  const CODE_SNIPPETS = [
    [
      'const stream = new DataBus({',
      '  bufferSize: 4096,',
      '  zeroCopy: true,',
      '  onFrame: (pkt) => sync(pkt)',
      '});',
    ],
    [
      'public async Task<Node> RouteAsync(',
      '  Span<byte> payload, CancellationToken ct)',
      '{',
      '  return await _mesh.Dispatch(payload);',
      '}',
    ],
    [
      'SELECT node_id, latency_ms, status',
      'FROM telemetry_shards',
      "WHERE region = 'us-east' AND active = 1",
      'ORDER BY throughput DESC LIMIT 32;',
    ],
    [
      '#!/usr/bin/env bash',
      'kubectl rollout status deploy/core-net',
      'ss -tunap | grep ESTABLISHED | wc -l',
      'echo "[OK] Mesh synchronized"',
    ],
    [
      'function project3D(p, fov, cx, cy) {',
      '  const s = fov / (fov + p.z);',
      '  return { x: cx + p.x * s, y: cy + p.y * s };',
      '}',
    ],
  ];

  function renderCodeCanvas(lines, fontSize) {
    const lineHeight = Math.round(fontSize * 1.42);
    const maxChars = Math.max(...lines.map((l) => l.length));
    const cw = Math.ceil(maxChars * fontSize * 0.64 + 16);
    const ch = Math.ceil(lines.length * lineHeight + 12);
    const c = document.createElement('canvas');
    c.width = cw;
    c.height = ch;
    const cctx = c.getContext('2d');
    cctx.font = `500 ${fontSize}px "JetBrains Mono", monospace`;
    cctx.textBaseline = 'top';
    cctx.fillStyle = rgba(1);
    lines.forEach((line, idx) => {
      cctx.fillText(line, 4, 4 + idx * lineHeight);
    });
    return c;
  }

  let verticalStreams = [];
  let particles = [];
  let gridMarkers = [];
  let codeFragments = [];
  const counterState = { value: 482910, timer: 0 };

  function spawnCodeFragment(initialProgress = false) {
    const isLarge = Math.random() < 0.16;
    const snippet = CODE_SNIPPETS[Math.floor(Math.random() * CODE_SNIPPETS.length)];
    const fontSize = isLarge
      ? Math.max(18, Math.round(width * 0.016))
      : Math.max(10, Math.round(width * 0.0075));
    const sprite = renderCodeCanvas(snippet, fontSize);
    const marginX = width * 0.06;
    const marginY = height * 0.08;
    return {
      sprite,
      x: marginX + Math.random() * Math.max(10, width - marginX * 2 - sprite.width),
      y: marginY + Math.random() * Math.max(10, height - marginY * 2 - sprite.height),
      isLarge,
      maxAlpha: isLarge ? 0.14 : 0.42,
      phase: initialProgress ? Math.random() * 7 : 0,
      speed: 0.7 + Math.random() * 0.5,
    };
  }

  function initScene() {
    const streamCount = 18;
    verticalStreams = Array.from({ length: streamCount }, (_, i) => ({
      x: ((i + 0.5) / streamCount + (Math.random() - 0.5) * 0.03) * width,
      speed: 22 + Math.random() * 38,
      offset: Math.random() * 100,
      spacing: Math.max(12, height / 46),
      alpha: 0.25 + Math.random() * 0.35,
    }));

    const targetCount = Math.round(1750 * baseDensity * particleScale);
    particles = Array.from({ length: targetCount }, (_, i) => {
      const clustered = i < targetCount * 0.7;
      const spreadX = clustered
        ? (Math.random() + Math.random() + Math.random() - 1.5) * 0.65
        : (Math.random() - 0.5) * 2.2;
      const spreadY = clustered
        ? (Math.random() + Math.random() + Math.random() - 1.5) * 0.34
        : (Math.random() - 0.5) * 2.0;
      return {
        bx: spreadX * (width * 0.5),
        by: spreadY * (height * 0.5),
        z: Math.random(),
        vz: 0.045 + Math.random() * 0.09,
      };
    });

    gridMarkers = [];
    const cols = Math.max(8, Math.round(width / 150));
    const rows = Math.max(5, Math.round(height / 140));
    for (let gx = 1; gx < cols; gx++) {
      for (let gy = 1; gy < rows; gy++) {
        if (Math.random() < 0.58) {
          gridMarkers.push({
            x: (gx / cols) * width,
            y: (gy / rows) * height,
            isPlus: (gx + gy) % 2 === 0,
            phase: Math.random() * Math.PI * 2,
          });
        }
      }
    }

    codeFragments = Array.from({ length: 7 }, () => spawnCodeFragment(true));
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const cssW = Math.max(1, rect.width);
    const cssH = Math.max(1, rect.height);
    const rawDpr = Math.min(window.devicePixelRatio || 1, 2);
    const rawPixels = cssW * rawDpr * cssH * rawDpr;
    const scaleDown = rawPixels > MAX_PIXELS ? Math.sqrt(MAX_PIXELS / rawPixels) : 1;

    dpr = rawDpr * scaleDown;
    width = Math.round(cssW * dpr);
    height = Math.round(cssH * dpr);

    canvas.width = width;
    canvas.height = height;
    bloomCanvas.width = Math.max(1, Math.floor(width / 5));
    bloomCanvas.height = Math.max(1, Math.floor(height / 5));

    initScene();
    if (reducedMotion) renderFrame(0.016, 0);
  }

  function renderFrame(dt, elapsed) {
    const cx = width * 0.5;
    const cy = height * 0.5;

    mouseX += (targetMouseX - mouseX) * Math.min(1, dt * 5);
    mouseY += (targetMouseY - mouseY) * Math.min(1, dt * 5);
    const pxOffset = mouseX * width * parallaxStrength;
    const pyOffset = mouseY * height * parallaxStrength;

    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#010402';
    ctx.fillRect(0, 0, width, height);

    ctx.globalCompositeOperation = 'lighter';

    const hazeGrad = ctx.createLinearGradient(0, cy - height * 0.32, 0, cy + height * 0.32);
    hazeGrad.addColorStop(0, rgba(0));
    hazeGrad.addColorStop(0.5, rgba(0.085));
    hazeGrad.addColorStop(1, rgba(0));
    ctx.fillStyle = hazeGrad;
    ctx.fillRect(0, cy - height * 0.32, width, height * 0.64);

    ctx.strokeStyle = rgba(0.035);
    ctx.lineWidth = Math.max(1, dpr);
    ctx.beginPath();
    const maxRad = Math.hypot(cx, cy);
    for (let i = 0; i < 20; i++) {
      const ang = (i / 20) * Math.PI * 2;
      ctx.moveTo(cx + pxOffset * 0.3, cy + pyOffset * 0.3);
      ctx.lineTo(cx + Math.cos(ang) * maxRad, cy + Math.sin(ang) * maxRad);
    }
    ctx.stroke();

    const rowYs = [cy - height * 0.14, cy, cy + height * 0.14];
    const dotStep = Math.max(12, Math.round(16 * dpr));
    rowYs.forEach((baseY) => {
      const ry = baseY + pyOffset * 0.4;
      for (let x = dotStep; x < width - dotStep; x += dotStep) {
        const edgeFade = 1 - Math.abs(x - cx) / cx;
        if (edgeFade <= 0.02) continue;
        ctx.fillStyle = rgba(edgeFade * 0.16);
        ctx.fillRect(x + pxOffset * 0.4, ry, 2 * dpr, 2 * dpr);
      }
    });

    verticalStreams.forEach((st) => {
      st.offset = (st.offset + st.speed * dt) % st.spacing;
      const sx = st.x + pxOffset * 0.55;
      for (let y = st.offset; y < height; y += st.spacing) {
        const normY = y / height;
        const endFade = Math.sin(normY * Math.PI);
        const dotSize = (1 + normY * 2.2) * dpr;
        ctx.fillStyle = rgba(st.alpha * endFade);
        ctx.fillRect(sx, y, dotSize, dotSize);
      }
    });

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.z -= p.vz * dt;
      if (p.z <= 0.04) p.z = 1.0;

      const perspective = 1 / (0.25 + p.z * 1.35);
      const sx = cx + p.bx * perspective + pxOffset * perspective;
      const sy = cy + p.by * perspective + pyOffset * perspective;
      if (sx < 0 || sx > width || sy < 0 || sy > height) continue;

      const edgeDist = Math.hypot((sx - cx) / cx, (sy - cy) / cy);
      const edgeFade = Math.max(0, 1 - edgeDist * 0.82);
      const depthAlpha = (1 - p.z) * 0.72 * edgeFade;
      if (depthAlpha <= 0.02) continue;

      const sz = Math.max(1, (1 - p.z) * 2.6 * dpr);
      ctx.fillStyle = rgba(depthAlpha);
      ctx.fillRect(sx, sy, sz, sz);
    }

    ctx.lineWidth = Math.max(1, dpr);
    gridMarkers.forEach((m) => {
      const pulse = 0.08 + 0.1 * (0.5 + 0.5 * Math.sin(elapsed * 1.6 + m.phase));
      const mx = m.x + pxOffset * 0.65;
      const my = m.y + pyOffset * 0.65;
      const arm = 3.5 * dpr;
      ctx.strokeStyle = rgba(pulse);
      ctx.fillStyle = rgba(pulse);
      if (m.isPlus) {
        ctx.beginPath();
        ctx.moveTo(mx - arm, my);
        ctx.lineTo(mx + arm, my);
        ctx.moveTo(mx, my - arm);
        ctx.lineTo(mx, my + arm);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(mx, my - arm * 0.8);
        ctx.lineTo(mx + arm * 0.8, my);
        ctx.lineTo(mx, my + arm * 0.8);
        ctx.lineTo(mx - arm * 0.8, my);
        ctx.closePath();
        ctx.fill();
      }
    });

    for (let i = 0; i < codeFragments.length; i++) {
      const cf = codeFragments[i];
      cf.phase += dt * cf.speed;
      if (cf.phase > 6.8) {
        codeFragments[i] = spawnCodeFragment(false);
        continue;
      }
      let revealRatio = 1;
      let alpha = cf.maxAlpha;
      if (cf.phase < 2.2) revealRatio = cf.phase / 2.2;
      else if (cf.phase > 5.2) alpha = cf.maxAlpha * (1 - (cf.phase - 5.2) / 1.6);

      const sh = Math.max(1, Math.floor(cf.sprite.height * revealRatio));
      const sw = cf.sprite.width;
      const pScale = cf.isLarge ? 1.25 : 0.8;
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.drawImage(cf.sprite, 0, 0, sw, sh, cf.x + pxOffset * pScale, cf.y + pyOffset * pScale, sw, sh);
    }
    ctx.globalAlpha = 1;

    counterState.timer += dt;
    if (counterState.timer >= 0.08) {
      counterState.value = (counterState.value + Math.floor(1 + Math.random() * 19)) % 999999;
      counterState.timer = 0;
    }
    const chipW = 92 * dpr;
    const chipH = 22 * dpr;
    const chipX = cx - chipW / 2 + pxOffset * 0.75;
    const chipY = cy + height * 0.23 + pyOffset * 0.75;
    ctx.strokeStyle = rgba(0.28);
    ctx.fillStyle = rgba(0.06);
    ctx.fillRect(chipX, chipY, chipW, chipH);
    ctx.strokeRect(chipX, chipY, chipW, chipH);
    ctx.font = `600 ${Math.round(10 * dpr)}px "JetBrains Mono", monospace`;
    ctx.fillStyle = rgba(0.55);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`SYS // ${String(counterState.value).padStart(6, '0')}`, chipX + chipW / 2, chipY + chipH / 2);

    for (let i = 0; i < 7; i++) {
      const dx = ((i + 0.5) / 7) * width + pxOffset * 1.1;
      const dy = height * 0.91 + Math.sin(elapsed * 0.7 + i) * 8 * dpr;
      const ds = (46 + (i % 3) * 18) * dpr;
      ctx.drawImage(discSprite, dx - ds / 2, dy - ds / 2, ds, ds);
    }

    const pillW = 190 * dpr;
    const pillH = 26 * dpr;
    ctx.drawImage(pillSprite, cx - pillW / 2, height * 0.04 - pillH / 2, pillW, pillH);
    ctx.drawImage(pillSprite, cx - pillW / 2, height * 0.96 - pillH / 2, pillW, pillH);

    const cOff = 11 * dpr;
    const cSize = 24 * dpr;
    [
      [width * 0.055, height * 0.91],
      [width * 0.945, height * 0.91],
    ].forEach(([bx, by]) => {
      [
        [-cOff, 0],
        [cOff, 0],
        [0, -cOff],
        [0, cOff],
      ].forEach(([ox, oy]) => {
        ctx.drawImage(cloverSprite, bx + ox - cSize / 2, by + oy - cSize / 2, cSize, cSize);
      });
    });

    const chArm = 26 * dpr;
    const chGap = 7 * dpr;
    const chRad = 15 * dpr;
    ctx.strokeStyle = rgba(0.62);
    ctx.lineWidth = Math.max(1.2, 1.5 * dpr);
    [width * 0.075, width * 0.925].forEach((chX) => {
      const x = chX + pxOffset * 0.9;
      const y = cy + pyOffset * 0.9;
      ctx.beginPath();
      ctx.moveTo(x - chArm, y); ctx.lineTo(x - chGap, y);
      ctx.moveTo(x + chGap, y); ctx.lineTo(x + chArm, y);
      ctx.moveTo(x, y - chArm); ctx.lineTo(x, y - chGap);
      ctx.moveTo(x, y + chGap); ctx.lineTo(x, y + chArm);
      ctx.stroke();

      ctx.strokeStyle = rgba(0.24);
      ctx.beginPath();
      ctx.arc(x, y, chRad, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = rgba(0.62);
    });

    if (bloomEnabled && bloomCanvas.width > 0 && bloomCanvas.height > 0) {
      bloomCtx.globalCompositeOperation = 'source-over';
      bloomCtx.clearRect(0, 0, bloomCanvas.width, bloomCanvas.height);
      bloomCtx.drawImage(canvas, 0, 0, bloomCanvas.width, bloomCanvas.height);

      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.75;
      ctx.drawImage(bloomCanvas, 0, 0, width, height);
      ctx.globalAlpha = 1;
    }
  }

  let elapsedTotal = 0;
  function loop(now) {
    if (destroyed) return;
    if (!isVisible || !isTabActive) {
      rafId = null;
      return;
    }

    const rawDt = lastTime ? (now - lastTime) / 1000 : 0.016;
    lastTime = now;
    const dt = Math.min(rawDt, 0.05);
    elapsedTotal += dt;

    const t0 = performance.now();
    renderFrame(dt, elapsedTotal);
    const frameCost = performance.now() - t0;

    frameTimeEma = frameTimeEma * 0.92 + frameCost * 0.08;
    qualityCheckTimer += dt;
    if (qualityCheckTimer > 2.0) {
      qualityCheckTimer = 0;
      if (frameTimeEma > 24 && bloomEnabled) {
        bloomEnabled = false;
      } else if (frameTimeEma > 28 && particleScale > 0.5) {
        particleScale = 0.5;
        initScene();
      }
    }

    rafId = requestAnimationFrame(loop);
  }

  function startLoop() {
    if (!destroyed && !reducedMotion && isVisible && isTabActive && rafId === null) {
      lastTime = performance.now();
      rafId = requestAnimationFrame(loop);
    }
  }

  function onMouseMove(e) {
    targetMouseX = (e.clientX / Math.max(1, window.innerWidth)) * 2 - 1;
    targetMouseY = (e.clientY / Math.max(1, window.innerHeight)) * 2 - 1;
  }

  function onVisibilityChange() {
    isTabActive = !document.hidden;
    if (isTabActive) startLoop();
  }

  const resizeObserver = new ResizeObserver(() => resize());
  resizeObserver.observe(canvas);

  const intersectionObserver = new IntersectionObserver(
    (entries) => {
      isVisible = entries[0]?.isIntersecting ?? true;
      if (isVisible) startLoop();
    },
    { threshold: 0.01 }
  );
  intersectionObserver.observe(canvas);

  window.addEventListener('mousemove', onMouseMove, { passive: true });
  document.addEventListener('visibilitychange', onVisibilityChange);

  resize();
  if (reducedMotion) renderFrame(0.016, 0);
  else startLoop();

  return {
    destroy() {
      destroyed = true;
      if (rafId !== null) cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    },
  };
}

export default function NeonFieldBackground({
  rgb = [46, 255, 96],
  density = 1,
  parallax = 0.016,
  posterSrc,
  className = '',
  style = {},
}) {
  const canvasRef = useRef(null);
  const posterRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const controller = createNeonField(canvas, { rgb, density, parallax });
    if (posterRef.current) {
      posterRef.current.style.opacity = '0';
    }
    return () => controller.destroy();
  }, [rgb[0], rgb[1], rgb[2], density, parallax]);

  return (
    <div
      aria-hidden="true"
      className={className}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,
        pointerEvents: 'none',
        overflow: 'hidden',
        backgroundColor: '#010402',
        ...style,
      }}
    >
      {posterSrc && (
        <img
          ref={posterRef}
          src={posterSrc}
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 1,
            transition: 'opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      )}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'repeating-linear-gradient(to bottom, rgba(255,255,255,0) 0px, rgba(255,255,255,0) 2px, rgba(0,0,0,0.22) 3px, rgba(0,0,0,0.22) 4px)',
          opacity: 0.45,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 50% 50%, rgba(1,4,2,0) 42%, rgba(1,4,2,0.72) 100%)',
        }}
      />
    </div>
  );
}
