# Spec: rebuild “The Millisecond Advantage” deck in Slidev

Nov 22, 2026 · @Ash Minhas

## Verdict: is Slidev better here?

Slidev is the better choice for presenting and exporting. It is not better for authoring. The hard part of this deck is the custom SVG animation, and that is hand-written code in either framework.

|  | Slidev | open-slide |
| --- | --- | --- |
| Stack | Vue 3 + Markdown | React + TSX |
| Beats | Built in (`v-click`, `$clicks`, `clicks:` frontmatter) | Custom per slide |
| Export | PDF, PNG, PPTX (as images), with each click as a page | Static HTML, PDF |
| Presenter tools | Mature: notes, timer, drawing, recording | Notes, next slide, timer |
| Agent loop | Plain Claude Code | Built-in skills and in-browser comment-to-fix |
| npm downloads, last 30 days | \~1.05M (`@slidev/cli`) | \~69k (`@open-slide/core`) |

Pick Slidev if you need PDF/PPTX handouts or a long-lived, widely supported tool. Stay on open-slide if you'd rather write React and use its comment-to-fix loop.

## Goal and acceptance criteria

Build an 18-slide Slidev deck that matches the structure, look and click-driven motion of the reference deck at [talks.frwd.dev](https://talks.frwd.dev/s/millisecond-advantage?p=9). Write your own copy and diagrams; take the pattern from the reference, not its content.

Done means:

- [ ] `pnpm dev` serves the deck, and `/9` opens the Process slide directly.
- [ ] Every slide advances its beats on arrow/space, and stepping back reverses them cleanly.
- [ ] Each pillar slide has a title, an SVG flow diagram and a one-line takeaway pinned to the bottom.
- [ ] Wire pulses and the live number run on the Process slide with no chart or animation library.
- [ ] Everything renders at 1920×1080 without overflow, and fonts load before first paint.
- [ ] `slidev export --with-clicks` produces a readable PDF, with animated states settled at each step.
- [ ] `prefers-reduced-motion` turns pulses off and jumps straight to final states.

Out of scope: speaker notes text, the in-browser AI agent panel, theming beyond one dark palette.

## Setup, layout and design tokens

```bash
pnpm create slidev millisecond-advantage
cd millisecond-advantage
pnpm add -D playwright-chromium   # needed for export
```

File layout:

```text
slides.md              # headmatter + all 18 slides
style.css              # tokens, fonts, keyframes
public/fonts/          # DepartureMono-Regular.woff2 (or any OFL mono)
components/
  PillarSlide.vue      # title + diagram slot + takeaway
  FlowDiagram.vue      # SVG nodes and wires from a coordinate map
  WirePulse.vue        # one animated pulse along a path
  TickFeed.ts          # scripted record stream (composable)
  LiveNumber.vue       # value that updates as pulses land
layouts/
  dark.vue             # full-bleed 1920x1080 dark layout
```

Headmatter:

```yaml
---
theme: none
layout: dark
canvasWidth: 1920
aspectRatio: 16/9
transition: fade
fonts:
  provider: none
---
```

Tokens go in `style.css` as CSS variables:

| Token | Value |
| --- | --- |
| `--bg` | `#03050C` |
| `--text` | `#F3F6FC` |
| `--muted` | `#A9B7D9` |
| `--accent` | `#FF5A4E` (one accent only) |
| `--rule` | `rgba(255,255,255,0.13)` |
| `--hero` / `--body` | 136 px / 32 px |
| `--radius` | 6 px |
| Display font | Departure Mono, falling back to ui-monospace |
| Body font | system-ui |

Declare the font with `font-display: block` so the deck never flashes a fallback font.

## Slide list

The reference deck has 18 slides in 6 scenes. Beats are the click counts from its code; set each one with `clicks:` frontmatter. The "Job" column describes each slide's role. Write your own copy.

| # | Scene | Title | Beats | Job |
| --- | --- | --- | --- | --- |
| 1 | Premise | Title slide | — | Name and hook |
| 2 | Premise | An Afternoon at a Brokerage | 6 | A story: desks can't get a client's current exposure fast |
| 3 | Premise | The Stalest Input | — | A number built from many systems is only as fresh as the slowest |
| 4 | Premise | Agents need a new real-time architecture | — | The thesis |
| 5 | Architecture | The Streamhouse in One Sentence | — | Define it as an architecture, not a product |
| 6 | Architecture | The Architecture | — | Full diagram: sources → 5 pillars → consumers |
| 7 | Pillars | Connect | 4 | Events become keyed, timestamped records |
| 8 | Pillars | Stream | 5 | An ordered log that can be replayed to any moment |
| 9 | Pillars | Process | 5 | Keep the number current incrementally |
| 10 | Pillars | Govern | 5 | Lineage for clients and regulators |
| 11 | Pillars | Query | 4 | Answer where the data lives |
| 12 | Pillars | Query (tables) | 4 | Serve the full table that Process builds |
| 13 | Payoff | The Payoff | 5 | One record serving three readers on three timescales |
| 14 | Payoff | The World Before | 4 | Copies and pipelines everywhere |
| 15 | Payoff | Works with the Lakehouse | 4 | Lakehouse for history, streamhouse for what happens next |
| 16 | Platform | Delivered by Confluent | 3 | Vendor delivery |
| 17 | Platform | Extended by IBM | 3 | What acts on the data |
| 18 | Playbook | Takeaway | 2 | Close |

Put a small scene label (for example `PILLARS · 03`) at the top left of every slide. This is optional, but it helps the deck read as one story.

## Animation system

Three layers. All of them are driven by Slidev's per-slide click count, so stepping forward and back stays deterministic.

1. **Beats.** Set `clicks: N` in each slide's frontmatter. Components read the count with `$clicks` in templates, or `useSlideContext()` from `@slidev/client` in `<script setup>`. Use `v-click` / `v-after` only for simple reveals.
2. **Reveals.** CSS keyframes keyed off the beat: `fade`, `rise` (14 px up), `lift` (6 px), `draw-x` (clip-path wipe), and `stroke` (path draw-on via `pathLength=1` + `stroke-dashoffset`). Each part is visible once `$clicks >= its beat`. The animation runs only on the step it first appears, never when stepping back.
3. **Pulses and live data.** `WirePulse` animates a short dash along an SVG path with `element.animate()` (Web Animations API), from `strokeDashoffset: len` to `-len`, `linear`. A pulse is a stacked glow, core and head, made of 2–3 strokes with different widths and opacities. `TickFeed` emits scripted records `{gap, sym, cents | qty}` on a timer; each record fires a pulse and updates `LiveNumber` when it lands.

Rules for Claude Code:

- Draw diagrams with explicit coordinates on the 1920×1080 canvas, from one coordinate map per slide. No auto-layout library.
- Wires: 2 px stroke in `--muted`; dashed for planned or optional paths; arrowheads as separate small paths.
- Cancel every running animation on slide leave and on step-back (track them in a Set).
- Make the feed deterministic: fixed seed, fixed sequence, restart on slide enter.
- `In print/export mode (check the exact flag in the Slidev source, likely useNav().isPrintMode) and under reduced motion`, skip pulses and render the final value for that beat.

## Worked example: the Process slide (#9)

Build this slide first and get it right. The other pillar slides reuse its components. The beat plan below is a suggested design; the reference fixes only the 5-beat count and the takeaway.

Layout: a title at the top left, a 1680×660 diagram area, and a one-line takeaway at the bottom. The diagram has 2 input wires into a **Process** box. From there, one wire goes to a **topic** node and a vertical bus fans out to 4 consumer rows on the right. Labels under the box show the running value.

| Beat | What appears |
| --- | --- |
| 0 | Title, empty diagram frame |
| 1 | Inputs and the Process box draw on; the feed starts and pulses flow on the input wires |
| 2 | The live number appears and updates as each record lands |
| 3 | Wires to the 4 consumers draw on; pulses fan out to them |
| 4 | The topic wire lights up: the result is written back as a stream |
| 5 | Takeaway line rises in |

Feed script (deterministic, repeating):

```ts
const start = { XYZ: 41.12, ABC: 18.40 }; // prices
const ticks = [
  { gap: 2000, sym: 'XYZ', cents: +2 },
  { gap: 2300, sym: 'ABC', qty: +10000 },
  { gap: 1700, sym: 'XYZ', cents: -1 },
  { gap: 2600, sym: 'XYZ', qty: -3000 },
  // ...
];
```

Each tick sends a pulse down an input wire. When the pulse reaches the Process box, recompute the exposure (position × price, summed) in place, flash the changed digits in `--accent`, then fan out to the consumers.

Prompt to give Claude Code:

```text
Read SPEC.md. Scaffold the Slidev project and build slide 9 only, using
PillarSlide, FlowDiagram, WirePulse, TickFeed and LiveNumber as specified.
Run pnpm dev and check /9 at 1920x1080 for each click 0–5, stepping forward
and back. Then export with --with-clicks and confirm every step renders.
Stop and show me before building other slides.
```

## Build, export and deploy

```bash
pnpm slidev build --base /           # static SPA in dist/
pnpm slidev export --with-clicks     # PDF, one page per click
pnpm slidev export --format pptx     # PPTX; slides are images, text not editable
```

- Host `dist/` on any static host. Add an SPA fallback so deep links like `/9` resolve: on Netlify, `/* /index.html 200`; on Vercel, a rewrite of `/(.*)` to `/index.html`. On Cloudflare Pages, check its current SPA behaviour.
- `--base` must start and end with `/` when hosting under a subpath.
- Save this doc as `SPEC.md` in the repo root before prompting Claude Code. Doc menu → export as Markdown.

## Sources

- [Slidev: animations](https://sli.dev/guide/animations) · [global context](https://sli.dev/guide/global-context) · [exporting](https://sli.dev/guide/exporting) · [hosting](https://sli.dev/guide/hosting)
- [Reference deck](https://talks.frwd.dev/s/millisecond-advantage?p=9): slide titles, beat counts, palette and feed pattern read from its JS bundle
- [open-slide](https://github.com/1weiho/open-slide)
- npm download counts from api.npmjs.org, Oct 23 – Nov 21, 2026
