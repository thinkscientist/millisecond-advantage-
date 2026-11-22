# The Millisecond Advantage

An 18-slide [Slidev](https://sli.dev) deck about the streamhouse architecture. Built from [`SPEC.md`](./SPEC.md).

```bash
pnpm install
pnpm dev            # http://localhost:3030 — /9 opens the Process slide
pnpm build          # static SPA in dist/ (SPA fallbacks: public/_redirects, vercel.json)
pnpm build:web      # portable static build for GitHub Pages (hash routes, relative paths)
pnpm export         # PDF, one page per click
pnpm export:pptx    # PPTX (slides as images)
```

`slidev export` needs a Chromium. If Playwright's bundled browser isn't installed, pass
`--executable-path /path/to/chrome`.

## How it's built

| File | Role |
| --- | --- |
| `slides.md` | Headmatter and all 18 slides; beats set with `clicks:` frontmatter |
| `style.css` | IBM Carbon (Gray 100) tokens, IBM Plex Sans/Mono (`font-display: block`), keyframes |
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

Look: IBM Carbon Gray 100 palette (Blue 60 for live elements, Blue 40 for a value that
just changed, Red 50 for alerts only), square corners, IBM Plex Sans Light for display
type and IBM Plex Mono for labels. Fonts: IBM Plex, SIL OFL 1.1 (`public/fonts/IBM-Plex-LICENSE.txt`).

## GitHub Pages

`.github/workflows/pages.yml` builds with `pnpm build:web` (hash routing, relative paths)
and deploys on every push to `main` (and this working branch). One-time setup in the repo:
**Settings → Pages → Build and deployment → Source: GitHub Actions**. The deck is then at
`https://<owner>.github.io/<repo>/`, and `#/9` deep-links to a slide.
