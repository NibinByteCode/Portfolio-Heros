# Nibin — Extracted Neon Portfolio Background

This React + Vite project ports the procedural `createNeonField` animation engine from the supplied `portfolio_index-v3(1).html` into a lifecycle-safe React component (`src/NeonField.jsx`).

## Run
```bash
npm install
npm run dev
```

## Extracted visual layers
- Horizontal central haze and radial perspective rays
- Dotted horizontal data rows
- 18 vertical dotted streams
- 1,750 depth-projected particles, clustered around the central band
- Pulsing plus and diamond markers
- Type-in / fade code fragments rendered as cached canvas sprites
- Live telemetry counter chip
- Foreground bokeh, glowing pills, corner clover lights, symmetrical crosshairs
- Offscreen bloom compositing
- Smooth mouse parallax, adaptive quality, visibility-aware animation, reduced-motion support

The original drawing algorithm is preserved and mounted / cleaned up through React `useEffect`. Replace `public/hero-poster.jpg` with another fallback image if needed.


## Readability tuning

The extracted effect has been softened for portfolio typography:
- Canvas layer opacity reduced to 34%.
- Code fragments, dust particles, crosshairs, bloom, and bokeh have lower intensity.
- A subtle radial dark veil sits behind the hero copy.
- The background poster is darkened and desaturated.
- Header/footer labels use a restrained text shadow for contrast.

To tune further, adjust `#neon-field { opacity: .34; }` in `src/styles.css`.
A value around `.22` is quieter; `.42` is more vivid.
