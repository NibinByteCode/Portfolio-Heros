# Neon Field Portfolio Hero

A single-page portfolio hero with a procedural, ultra-smooth **neon data-field background** (HTML5 Canvas, no video) and a **looping typewriter headline**: *"Hi there. It's Nibin"*.

- Zero build step: open `index.html` in a browser.
- Resolution independent: crisp at 1080p, 4K and on phones (canvas is capped at 2x DPR / ~8.6M pixels).
- Reusable background as a **React** component and a **Framer** code component.
- Accessible: respects `prefers-reduced-motion`, pauses when the tab is hidden or off-screen.

## Files

| File | What it is |
|---|---|
| `index.html` | Complete standalone page (HTML + CSS + JS + background engine inlined) |
| `NeonFieldBackground.jsx` | React component: fixed, full-screen animated background |
| `NeonFieldBackground.framer.tsx` | Framer code component with property controls |
| `assets/poster.webp`, `poster.jpg` | Instant-load poster shown until the canvas is running |
| `PROMPT.md` | Generic prompt to recreate the whole project with any AI coding tool |

## Quick start

1. Unzip, then double-click `index.html` (or serve the folder with any static server).
2. Edit the text in the `<section class="hero">` block of `index.html`.

## Customize

### Hero text
In `index.html`:

```html
<span class="l1" data-split>Hi there.</span>
<span class="l2"><span data-split>It’s&nbsp;</span><span class="name" data-split>Nibin</span>...
```

Anything with `data-split` is typed out in order. Change the words, keep the attribute.

### Typewriter speed
In the typewriter script near the bottom of `index.html` (milliseconds):

```js
var TYPE = 95, ERASE = 42, HOLD = 2600, GAP = 600;
```

- `TYPE`: delay per typed letter
- `ERASE`: delay per erased letter
- `HOLD`: how long the full text stays on screen
- `GAP`: pause before typing restarts

### Colors
- Page accent: the `--neon` variable in the `:root` CSS block.
- Background particles: `createNeonField(canvas, { rgb: [46, 255, 96] })`. Use `[255,255,255]` for white.

### Density / performance
`createNeonField(canvas, { density: 1 })`: values from 0.3 to 1.3. The engine also lowers quality automatically on slow devices (bloom off first, then fewer particles).

## Use the background in React

```jsx
import NeonFieldBackground from "./NeonFieldBackground";

export default function App() {
  return (
    <>
      <NeonFieldBackground poster="/assets/poster.webp" color={[46, 255, 96]} density={1} />
      <main style={{ position: "relative" }}>
        {/* your content */}
      </main>
    </>
  );
}
```

Props: `poster`, `color` (`[r,g,b]`), `density`, `parallax` (bool), `fixed` (bool).

## Use the background in Framer

1. In Framer: **Assets, Code, New Code File**, paste `NeonFieldBackground.framer.tsx`.
2. Drag the component onto your page, set it to fill the width and height of the hero section, and put your heading on top.
3. Use the property panel for Poster, Color, Density and Parallax.

> The Framer file has been syntax-checked but not tested inside a live Framer project.

## Gotchas

- **Do not set an opaque `background` on `body`.** The background layer uses `z-index: -1`, and an opaque body color will hide it. Put the color on `html` instead.
- **Contrast:** the headline is white on purpose. Neon-green text disappears against a neon-green background. A dark radial scrim sits behind the text block; keep it if you change the colors.
- **Fonts** (Space Grotesk, JetBrains Mono) load from Google Fonts. Offline, the page falls back to system fonts.
- A looping 0.6s video would stutter, which is why the background is rendered procedurally instead of using a video file.

## How the background works

Additive-blended canvas layers, drawn back to front:

1. Black fill and a central haze
2. Dotted horizontal rows
3. Vertical dotted data streams
4. About 1,900 depth-drifting dust particles (70% clustered in the center band)
5. "+" markers and diamond dots
6. Typing code fragments
7. A ticking counter chip
8. Foreground bokeh, pills and corner glows
9. Large edge crosshairs
10. Bloom: a 1/5-size copy of the canvas added back at 75% alpha

Everything uses pre-rendered sprites and `drawImage`, with no per-frame `shadowBlur`.

## Browser support

Current Chrome, Edge, Firefox and Safari. Needs Canvas 2D, `ResizeObserver` and `IntersectionObserver`.

## License

Use freely for personal and commercial projects. Attribution appreciated.
