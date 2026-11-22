#  Cinematic Portfolio Hero

A standalone React + Vite landing page with a procedural neon-green data-field background.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. Create a production build with:

```bash
npm run build
npm run preview
```

## Optional image/video background

The supplied reference image and video are integrated:
- `public/hero-poster.jpg` is the cleaned still image used as the video poster/fallback.
- `public/hero-bg.mp4` is the supplied short video, color-graded toward neon green and extended with a ping-pong loop.
- The Canvas stays above the video with a restrained particle / parallax accent layer.

The uploaded source clip was only about 0.67 seconds long, so the generated loop repeats forward and reverse playback to reduce the abrupt restart. Replace `hero-bg.mp4` with a longer source clip for even smoother motion.

## Performance notes

- Canvas uses `requestAnimationFrame`.
- Device pixel ratio is capped at 2 to avoid excessive GPU fill cost on high-density displays.
- Particle count scales with viewport area and is capped.
- The animation respects `prefers-reduced-motion`.
- No external animation/video library is required for the background itself. Framer Motion is used only for the initial hero text reveal.

## Personalization

Edit the headline, description, links, and footer in `src/App.jsx`. Update the email address and portfolio URL to your preferred contact destinations.
