# Neon Hero Section

Reusable **hero section** code for portfolio and landing-page projects: a procedural, ultra-smooth neon data-field background (HTML5 Canvas, no video) with a looping typewriter headline.

Pick the version that fits your project and drop it in.

## Versions

| Version               | Folder    | Best for                                      |
| --------------------- | --------- | --------------------------------------------- |
| Standalone HTML       | `/html`   | Static sites, quick prototypes, no build step |
| React component       | `/react`  | React, Next.js, Vite apps                     |
| Framer code component | `/framer` | Framer sites (property panel controls)        |

> Adjust the folder names above to match your repo layout.

## Features

- Animated background drawn on a canvas: depth-drifting particles, dotted data streams, typing code fragments, crosshair markers and bloom
- Looping typewriter headline with a blinking caret and no layout shift
- Crisp at 1080p, 4K and on phones (pixel-capped for performance)
- Pauses when the tab is hidden or off-screen, with automatic quality fallback on slow devices
- Respects `prefers-reduced-motion`
- Fully customizable: text, accent color, density, parallax

## Quick start

**HTML:** open `index.html` in a browser.

**React:**

```jsx
import NeonFieldBackground from "./NeonFieldBackground";

<NeonFieldBackground
  poster="/assets/poster.webp"
  color={[46, 255, 96]}
  density={1}
/>;
```

**Framer:** create a new Code File, paste `NeonFieldBackground.framer.tsx`, drag it onto your page and use the property panel.

## Customize

| What           | Where                                                   |
| -------------- | ------------------------------------------------------- |
| Headline text  | Elements marked `data-split` in `index.html`            |
| Typing speed   | `TYPE`, `ERASE`, `HOLD`, `GAP` constants (milliseconds) |
| Particle color | `rgb` option, e.g. `[46, 255, 96]` or `[255, 255, 255]` |
| Particle count | `density` option, 0.3 to 1.3                            |
| Mouse parallax | `parallax` option, `true` or `false`                    |
| Page accent    | `--neon` CSS variable                                   |

## Notes

- Don't set an opaque `background` on `body`. The background layer sits at `z-index: -1` and would be hidden. Put the color on `html` instead.
- Keep the headline white (or another high-contrast color). Text in the same color as the particles is hard to read.
- The Framer component has not been tested in a live Framer project.
- Fonts (Space Grotesk, JetBrains Mono) load from Google Fonts and fall back to system fonts offline.

## Recreate it with AI

`PROMPT.md` contains a generic, fill-in-the-blanks prompt for rebuilding this hero with any AI coding assistant.

## Browser support

Current Chrome, Edge, Firefox and Safari.

## License

Free to use in personal and commercial projects. Attribution appreciated.
