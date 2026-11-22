# The Millisecond Advantage

An 18-slide [Slidev](https://sli.dev) deck about the streamhouse architecture. Built from [`SPEC.md`](./SPEC.md).

```bash
pnpm install
pnpm dev            # http://localhost:3030 — /9 opens the Process slide
pnpm build          # static SPA in dist/ (SPA fallbacks: public/_redirects, vercel.json)
pnpm export         # PDF, one page per click
pnpm export:pptx    # PPTX (slides as images)
```

`slidev export` needs a Chromium. If Playwright's bundled browser isn't installed, pass
`--executable-path /path/to/chrome`.

## How it's built

| File | Role |
| --- | --- |
| `slides.md` | Headmatter and all 18 slides; beats set with `clicks:` frontmatter |
| `style.css` | Tokens, Departure Mono (`font-display: block`), reveal keyframes |
| `layouts/dark.vue` | Full-bleed 1920×1080 layout with the scene label (`scene:` frontmatter) |
| `components/useBeats.ts` | Beat state: `b(n, fx)` reveal classes, `live`, `isStatic`, cancel `epoch` |
| `components/PillarSlide.vue` | Title + 1680×660 diagram slot + takeaway pinned to the bottom |
| `components/FlowDiagram.vue` | SVG nodes and wires from a coordinate map (`flow.ts` helpers) |
| `components/WirePulse.vue` | One pulse (glow, core, head) along a path via the Web Animations API |
| `components/PulseLoop.vue` | Ambient pulses on a set of paths |
| `components/TickFeed.ts` | Deterministic, repeating record stream (composable) |
| `components/LiveNumber.vue` | Value that updates in place and flashes changed digits |
| `components/*Diagram.vue` | One coordinate map per slide |

Motion rules: reveals play only on the step an element first appears; stepping back
hides it instantly and cancels running pulses. In print/export (`useNav().isPrintMode`),
overview thumbnails and under `prefers-reduced-motion`, pulses and feeds don't run and
each beat renders its final state.

Font: Departure Mono by Helena Zhang, SIL OFL 1.1 (`public/fonts/DepartureMono-LICENSE.txt`).
