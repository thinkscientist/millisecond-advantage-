<script setup lang="ts">
/**
 * Full-bleed 1920x1080 dark frame:
 *  - content fades in on slide entry (600 ms, 130 ms delay)
 *  - scene nav at the bottom: sections, one tick per slide, page counter
 *  - beat indicator bottom-right (one block per click)
 *  - a faint grain vignette at the edges
 * Sections come from each slide's `scene:` frontmatter ("PILLARS · 03").
 */
import { computed } from 'vue'
import { useNav, useSlideContext } from '@slidev/client'
import { useBeats } from '../components/useBeats'

defineProps<{ scene?: string }>()

const { slides, go, isPrintMode } = useNav()
const { $page, $clicksContext } = useSlideContext()
const { clicks, entered, isStatic } = useBeats()

const sectionOf = (no: number) =>
  String(slides.value[no - 1]?.meta?.slide?.frontmatter?.scene ?? '').split('·')[0].trim()

const sections = computed(() => {
  const out: { name: string, pages: number[] }[] = []
  slides.value.forEach((_, i) => {
    const name = sectionOf(i + 1) || '—'
    const last = out[out.length - 1]
    if (last && last.name === name) last.pages.push(i + 1)
    else out.push({ name, pages: [i + 1] })
  })
  return out
})
const here = computed(() => sections.value.findIndex(s => s.pages.includes($page.value)))
const total = computed(() => slides.value.length)
// $clicksContext is a reactive object here, not a ref
const beats = computed(() => ($clicksContext as any)?.total ?? 0)
const pad = (n: number) => String(n).padStart(2, '0')
</script>

<template>
  <div class="slidev-layout dark-layout">
    <div :key="isStatic ? 0 : entered" class="dark-content" :class="{ enter: !isStatic && !isPrintMode }">
      <slot />
    </div>

    <div v-if="beats > 0" class="beat-ind" aria-hidden="true">
      <span v-for="n in beats" :key="n" :class="{ on: clicks >= n, now: clicks === n }" />
    </div>

    <nav class="scene-nav mono">
      <div v-for="(s, i) in sections" :key="s.name" class="sec" :class="{ cur: i === here, future: i > here }">
        <span class="sec-name" @click="go(s.pages[0])">{{ s.name }}</span>
        <span class="ticks">
          <span v-for="p in s.pages" :key="p" class="tick" :class="{ on: p === $page, past: p < $page }" @click="go(p)" />
        </span>
      </div>
      <div class="page">{{ pad($page) }} / {{ pad(total) }}</div>
    </nav>

    <svg class="grain" aria-hidden="true">
      <filter id="grain-f"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" /><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .9 0" /></filter>
      <rect width="100%" height="100%" filter="url(#grain-f)" />
    </svg>
  </div>
</template>

<style>
.dark-layout {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  isolation: isolate;
  background: var(--bg);
  color: var(--text);
  padding: 0;
}
.dark-content { position: absolute; inset: 0; }
.dark-content.enter { animation: ss-enter 600ms cubic-bezier(0, 0, 0.2, 1) 130ms both; }
.dark-layout > p:empty { display: none; }

.scene-nav {
  position: absolute; left: 120px; right: 120px; bottom: 46px;
  display: flex; align-items: flex-start; gap: 44px;
  font-size: 18px; letter-spacing: 0.08em; color: var(--muted);
  z-index: 3;
}
.scene-nav .sec { display: flex; flex-direction: column; gap: 10px; }
.scene-nav .sec.cur .sec-name { color: var(--text); }
.scene-nav .sec.future { opacity: 0.62; }
.scene-nav .sec-name { cursor: pointer; }
.scene-nav .ticks { display: flex; gap: 6px; }
.scene-nav .tick { width: 28px; height: 4px; background: rgba(169, 183, 217, 0.22); cursor: pointer; transition: background-color 200ms ease; }
.scene-nav .tick.past { background: rgba(169, 183, 217, 0.7); }
.scene-nav .tick.on { background: var(--text); }
.scene-nav .page { margin-left: auto; color: var(--muted); }

.beat-ind {
  position: absolute; right: 120px; bottom: 178px; display: flex; gap: 6px; z-index: 3;
  padding: 8px; border: 1px solid var(--panel-line); border-radius: var(--radius); background: var(--panel);
}
.beat-ind span { width: 26px; height: 14px; border-radius: 2px; background: rgba(169, 183, 217, 0.18); transition: background-color 250ms ease; }
.beat-ind span.on { background: rgba(169, 183, 217, 0.6); }
.beat-ind span.now { background: var(--text); }

.grain {
  position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 4;
  opacity: 0.16; mix-blend-mode: screen;
  -webkit-mask-image: radial-gradient(ellipse 78% 74% at 50% 50%, transparent 72%, #000 100%);
  mask-image: radial-gradient(ellipse 78% 74% at 50% 50%, transparent 72%, #000 100%);
}
</style>
