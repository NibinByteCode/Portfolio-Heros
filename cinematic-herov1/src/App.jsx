import React, { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

/**
 * Procedural cinematic data field.
 * Optional assets:
 *   public/hero-bg.mp4  (silent, looping video)
 *   public/hero-still.jpg (poster / still)
 *
 * Keep the canvas enabled for the animated particle layer. If you add a video,
 * it sits behind the canvas and the canvas supplies the foreground detail.
 */
function DataField() {
  const canvasRef = useRef(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let width = 0, height = 0, dpr = 1, raf = 0, frame = 0;
    let particles = [];
    let streams = [];
    let pointer = { x: 0, y: 0 };
    let targetPointer = { x: 0, y: 0 };
    const glyphs = "01{}[]<>/\\;:=+-*#";
    const rand = (min, max) => Math.random() * (max - min) + min;

    function createParticle() {
      const spread = rand(-1, 1);
      return {
        x: rand(0, 1), y: rand(0, 1),
        z: rand(0.12, 1),
        size: rand(0.35, 1.65),
        speed: rand(0.00012, 0.00062),
        phase: rand(0, Math.PI * 2),
        drift: rand(-0.00012, 0.00012),
        spread,
        alpha: rand(0.18, 0.8)
      };
    }

    function resize() {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(650, Math.max(220, Math.floor((width * height) / 2400)));
      particles = Array.from({ length: count }, createParticle);
      const streamCount = Math.max(18, Math.floor(width / 38));
      streams = Array.from({ length: streamCount }, () => ({
        x: rand(0.03, 0.97),
        y: rand(-1, 1),
        length: rand(28, 110),
        speed: rand(0.0005, 0.0018),
        alpha: rand(0.08, 0.32),
        size: rand(7, 10)
      }));
    }

    function drawMarker(x, y, scale = 1, flip = 1) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(flip * scale, scale);
      ctx.strokeStyle = "rgba(112,255,95,.62)";
      ctx.lineWidth = 1;
      ctx.shadowColor = "rgba(73,255,73,.8)";
      ctx.shadowBlur = 9;
      ctx.beginPath();
      ctx.moveTo(-17, -8); ctx.lineTo(-17, -17); ctx.lineTo(-8, -17);
      ctx.moveTo(8, -17); ctx.lineTo(17, -17); ctx.lineTo(17, -8);
      ctx.moveTo(-17, 8); ctx.lineTo(-17, 17); ctx.lineTo(-8, 17);
      ctx.moveTo(8, 17); ctx.lineTo(17, 17); ctx.lineTo(17, 8);
      ctx.stroke();
      ctx.fillStyle = "rgba(142,255,115,.75)";
      ctx.fillRect(-1, -1, 2, 2);
      ctx.restore();
    }

    function render() {
      frame += 1;
      pointer.x += (targetPointer.x - pointer.x) * 0.035;
      pointer.y += (targetPointer.y - pointer.y) * 0.035;
      ctx.fillStyle = "rgba(2,5,3,.13)";
      ctx.fillRect(0, 0, width, height);

      // Deep, restrained central green atmosphere.
      const glow = ctx.createRadialGradient(
        width * (0.5 + pointer.x * 0.012), height * 0.49, 0,
        width * 0.5, height * 0.5, width * 0.58
      );
      glow.addColorStop(0, "rgba(11,70,24,.28)");
      glow.addColorStop(0.38, "rgba(4,35,13,.17)");
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      // Very subtle horizontal scan lines.
      ctx.save();
      ctx.globalAlpha = 0.025;
      ctx.strokeStyle = "#63ff5a";
      ctx.lineWidth = 0.5;
      for (let y = 0; y < height; y += 5) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      }
      ctx.restore();

      // Vertical streams of tiny code glyphs.
      ctx.save();
      ctx.font = '9px "DM Mono", monospace';
      streams.forEach((s, i) => {
        if (!reduceMotion) s.y += s.speed;
        if (s.y > 1.2) s.y = -0.2;
        const x = s.x * width + pointer.x * 9;
        for (let j = 0; j < s.length / 10; j++) {
          const y = ((s.y * height + j * 11) % (height + 80));
          ctx.globalAlpha = s.alpha * (1 - j / (s.length / 10));
          ctx.fillStyle = j === 0 ? "#b2ff9b" : "#43d94c";
          ctx.fillText(glyphs[Math.floor((i * 7 + j * 3 + frame / 30) % glyphs.length)], x, y);
        }
      });
      ctx.restore();

      // Distant particle network: dense in the central band, fading at edges.
      const projected = [];
      particles.forEach((p) => {
        if (!reduceMotion) {
          p.y += p.speed * (0.35 + p.z);
          p.x += p.drift;
          if (p.y > 1.03) p.y = -0.03;
          if (p.x > 1.02) p.x = -0.02;
          if (p.x < -0.02) p.x = 1.02;
        }
        const centerBias = Math.exp(-Math.pow((p.y - 0.51) / 0.36, 2));
        const edgeFade = Math.min(1, p.x * 5, (1 - p.x) * 5);
        const perspective = 0.35 + p.z * 0.9;
        const x = p.x * width + pointer.x * (5 + p.z * 17) * perspective;
        const y = p.y * height + pointer.y * (4 + p.z * 12);
        const pulse = 0.72 + Math.sin(frame * 0.018 + p.phase) * 0.28;
        const alpha = p.alpha * centerBias * edgeFade * pulse;
        projected.push({ x, y, z: p.z, alpha });
        const r = p.size * perspective;
        ctx.beginPath();
        ctx.fillStyle = `rgba(112,255,102,${alpha})`;
        ctx.shadowColor = `rgba(66,255,77,${alpha * 0.8})`;
        ctx.shadowBlur = p.z > 0.7 ? 7 : 2;
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      });

      // Connect nearby points sparingly to suggest a distributed network.
      ctx.save();
      ctx.lineWidth = 0.55;
      for (let i = 0; i < projected.length; i += 3) {
        const a = projected[i];
        for (let j = i + 1; j < Math.min(i + 13, projected.length); j += 4) {
          const b = projected[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 66) {
            ctx.strokeStyle = `rgba(62,230,79,${(1 - dist / 66) * Math.min(a.alpha, b.alpha) * 0.23})`;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      ctx.restore();

      // Floating code fragments in the outer field.
      const fragments = [
        ["const future = () =>", 0.09, 0.28],
        ["0101 // SYSTEM", 0.79, 0.22],
        ["{ intelligence: true }", 0.12, 0.76],
        ["<build />", 0.84, 0.73],
        ["0x7A  1010  0110", 0.68, 0.86]
      ];
      ctx.save();
      ctx.font = '10px "DM Mono", monospace';
      fragments.forEach(([label, x, y], i) => {
        ctx.globalAlpha = 0.28 + Math.sin(frame * 0.012 + i) * 0.08;
        ctx.fillStyle = "#8aff78";
        ctx.fillText(label, x * width + pointer.x * 7, y * height + pointer.y * 5);
      });
      ctx.restore();

      drawMarker(width * 0.055, height * 0.5, 0.82);
      drawMarker(width * 0.945, height * 0.5, 0.82, -1);

      // Soft vignette locks the focus to the center.
      const vignette = ctx.createRadialGradient(width / 2, height / 2, height * 0.12, width / 2, height / 2, width * 0.68);
      vignette.addColorStop(0, "rgba(0,0,0,0)");
      vignette.addColorStop(0.62, "rgba(0,0,0,.15)");
      vignette.addColorStop(1, "rgba(0,0,0,.92)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);

      if (!reduceMotion) raf = requestAnimationFrame(render);
    }

    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      targetPointer.x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      targetPointer.y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    };
    const onLeave = () => { targetPointer = { x: 0, y: 0 }; };

    resize();
    render();
    window.addEventListener("resize", resize, { passive: true });
    canvas.addEventListener("pointermove", onMove, { passive: true });
    canvas.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
    };
  }, [reduceMotion]);

  return <canvas ref={canvasRef} className="data-canvas" aria-hidden="true" />;
}

export default function App() {
  return (
    <main className="portfolio-shell">
      <video
        className="hero-video"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster="/hero-poster.jpg"
        aria-hidden="true"
      >
        <source src="/hero-bg.mp4" type="video/mp4" />
      </video>
      <DataField />
      <div className="noise-layer" aria-hidden="true" />
      <header className="topbar">
        <a className="wordmark" href="#home" aria-label="Nibin home">
          <span className="wordmark-mark">N<span>.</span></span>
          <span className="wordmark-label">NIBIN MOIDEENKUTTY</span>
        </a>
        <div className="topbar-status"><span className="status-dot" /> AVAILABLE FOR SELECT PROJECTS</div>
        <a className="topbar-link" href="mailto:hello@nibin.dev">LET'S TALK <ArrowUpRight size={14} /></a>
      </header>

      <section className="hero" id="home">
        <div className="hero-meta">
          <span className="eyebrow"><span className="eyebrow-line" /> PORTFOLIO / 2026</span>
          <span className="coordinate">43°27' N&nbsp; 80°29' W</span>
        </div>

        <motion.div
          className="hero-copy"
          initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 1.15, ease: [0.2, 0.75, 0.25, 1] }}
        >
          <p className="intro-line">HELLO, WORLD <span className="intro-star">✳</span></p>
          <h1>Hi there.<br /><span>It's Nibin<span className="period">.</span></span></h1>
          <div className="hero-bottom">
            <p className="hero-description">
              I build thoughtful digital experiences<br className="desktop-break" />
              where <span>engineering meets imagination.</span>
            </p>
            <a className="explore-link" href="#about">
              <span>EXPLORE MY WORLD</span>
              <span className="explore-icon"><ArrowDownRight size={17} /></span>
            </a>
          </div>
        </motion.div>

        <div className="hero-side-note">
          <span className="side-rule" />
          <span>DESIGNING & ENGINEERING<br />WHAT'S NEXT</span>
        </div>

        <div className="hero-index"><span>01</span><i /> 04</div>
        <div className="scroll-cue"><span>SCROLL TO DISCOVER</span><span className="scroll-line" /></div>
      </section>

      <footer className="bottom-bar" id="about">
        <span>FULL STACK DEVELOPER <b>·</b> CREATIVE PROBLEM SOLVER</span>
        <span className="bottom-center">BUILT WITH CURIOSITY <span>↗</span></span>
        <a href="https://nibin.dev" target="_blank" rel="noreferrer">NIBIN.DEV <ArrowUpRight size={12} /></a>
      </footer>
    </main>
  );
}
