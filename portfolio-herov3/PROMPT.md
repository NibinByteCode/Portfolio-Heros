# Prompt: Neon Data-Field Portfolio Hero with Typewriter Headline

Copy everything below the line into your AI coding assistant. Replace the `[BRACKETS]`.

---

# Task
Build a single-page, standalone portfolio website. The hero sits on a full-screen, ultra-smooth animated "neon data field" background rendered procedurally on an HTML5 Canvas (do NOT use a video file), with a looping typewriter headline.

Deliver:
- `index.html`: everything inlined, no build step, works when opened from disk
- `NeonFieldBackground.jsx`: the same background as a reusable React component
- `assets/`: an optional poster image
- `README.md`: usage and customization notes

# Personalization (replace these)
- Headline line 1: "[GREETING, e.g. Hi there.]"
- Headline line 2: "[It's YOUR NAME]"
- Eyebrow tag: "[YOUR ROLE]"
- One-line intro: "[SHORT TAGLINE]"
- Buttons: "[PRIMARY CTA]" and "[SECONDARY CTA]"
- Accent color: [#2eff60 neon green, or any color]

# Visual concept for the background
An ultra-wide, cinematic, futuristic digital interface floating in infinite pitch-black space. Hundreds of tiny luminous accent-colored particles, vertical dotted data streams, floating programming-code fragments and scattered crosshair markers form a 3D digital network. A dense cluster of microscopic particles occupies the central horizontal band and fades into darkness toward the edges for depth and perspective. Large glowing crosshairs sit symmetrically near the left and right edges. Soft bloom, deep black shadows, high contrast, Matrix-style cyberpunk look. Static camera, 16:9 composition, no people, no objects, no borders.

# Background layers (back to front, additive "lighter" blending)
1. Near-black fill (#010402).
2. Soft horizontal haze at the central band, plus faint radial lines at the center.
3. 2-3 faint dotted horizontal rows spanning the width, fading toward the edges.
4. 15-20 vertical dotted streams. Dots flow along each column, grow larger toward the bottom, and fade at both ends.
5. About 1,500-2,000 dust particles, 70% clustered around the center. Each has a depth value `z` that drifts toward the camera and respawns at the back when it passes the front. Closer particles spread further from the center, are larger, and are fainter near the edges.
6. A grid of small "+" markers and diamond dots, pulsing gently.
7. 6-8 code fragments: pre-rendered monospace snippets (JS, C#, SQL, shell). Each types in top-to-bottom, holds, fades, then respawns elsewhere. Rarely make one large and very faint for foreground depth.
8. A small glowing counter chip near the center with ticking digits.
9. Foreground bokeh: a row of soft discs near the bottom, two glowing "pills" at top and bottom center, and four-dot "clover" glows in the bottom corners.
10. Two large crosshairs at the left and right edges.
11. Bloom: copy the canvas to a 1/5-size offscreen canvas and draw it back at full size with `lighter` at about 0.75 alpha.

# Performance and quality rules
- Use pre-rendered radial-gradient sprites with `drawImage`; use `fillRect` for tiny dots. No per-frame `shadowBlur`.
- Size the canvas to its CSS box times devicePixelRatio, capped at 2x and about 8.6M pixels (ultra-HD safe). Rebuild the scene on resize with ResizeObserver.
- Use `requestAnimationFrame` with a clamped delta time. Pause when the tab is hidden or the canvas is off-screen (IntersectionObserver).
- If `prefers-reduced-motion` is set, render one still frame.
- Adaptive quality: if average frame cost stays high, turn off bloom first, then halve the particle count.
- Subtle mouse parallax (lerped, under 2% of screen width).
- Expose `createNeonField(canvas, { rgb, density, parallax })` returning `{ destroy() }`.

# Page structure
- Background is a `position: fixed; inset: 0; z-index: -1` stack: poster `<img>` (instant load, fades out once the canvas runs), the canvas, a faint scanline overlay, and a radial vignette.
- IMPORTANT: do not give `body` an opaque background (put the color on `html`), or it will hide the negative-z-index background.
- Minimal nav: logo left, 3 links right (hide the middle links on mobile).
- Hero: centered content, full viewport height (`100svh`), responsive on phones.

# Typewriter headline (looping)
- Split every headline word into per-character `<span class="ch">`, hidden with `visibility: hidden` (NOT `display: none`), so the layout never shifts while typing.
- Reveal characters one at a time (about 95ms each, randomized +/-30%), with an extra ~380ms pause after "." and the apostrophe.
- After the last character, hold about 2.6s, then erase backwards (about 42ms per character), wait about 600ms, and repeat forever.
- The caret is a zero-width inline element with an absolutely positioned accent-colored bar. Move it right after the last visible character on every step. It stays solid while typing or erasing and blinks while holding.
- Keep the full text in `aria-label` on the `<h1>` and mark the character spans `aria-hidden`.
- If `prefers-reduced-motion` is set, show the full headline with no animation.
- Keep the speeds as named constants (`TYPE`, `ERASE`, `HOLD`, `GAP`) so they are easy to tweak.

# Typography and contrast (critical)
- Fonts: Space Grotesk (headline and body) and JetBrains Mono (labels, code), loaded from Google Fonts with system fallbacks.
- Headline `clamp(3.1rem, 10.5vw, 9.6rem)`, tight letter-spacing. Line 1 weight 300, line 2 weight 700.
- Make ALL headline text pure white (#fff). Never use the accent color for headline text, because it disappears against an accent-colored background. Use the accent only for the caret, tag dot and primary button.
- No text-shadows on individual letters (they dim neighboring letters). Instead put a dark radial scrim (`rgba(1,4,2,.85)` fading to transparent) behind the hero text block.
- Keep code fragments dim (about 0.7 alpha max, large ones about 0.16) so they never fight the text.
- Body copy is white at about 80% opacity.

# Other motion and UI
- Fade-up entrance for the tag, intro, buttons and scroll cue.
- Primary button: solid accent with glow and lift on hover. Secondary: ghost with border and blur.
- All CSS animations are disabled under `prefers-reduced-motion`.

# Acceptance checklist
- No console errors; works opened directly from disk.
- Background renders at 1080p and 4K without banding or stutter.
- Headline passes WCAG AA contrast against the background at all times.
- Typewriter loops continuously with no layout jump.
- Clean at 390px phone width with no horizontal scroll.
- Verify by screenshotting desktop and mobile after about 3 seconds, and confirm the typing loop by sampling the visible text over about 15 seconds.
