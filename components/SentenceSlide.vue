<script setup lang="ts">
/**
 * Slide 5 — the streamhouse in one sentence. Words reveal in order; the
 * five pillar verbs carry numbers and land warm. An "as of" wall clock
 * ticks in the corner; three properties settle in underneath.
 * Static: everything shown, clock frozen.
 */
import Clock from './Clock.vue'
import { useBeats } from './useBeats'

const { isStatic } = useBeats()

// [text, pillar number or 0]
const WORDS: [string, number][] = [
  ['A', 0], ['streamhouse', 0], ['continuously', 0],
  ['connects', 1], ['every', 0], ['business', 0], ['event,', 0],
  ['keeps', 0], ['it', 0], ['in', 0], ['an', 0], ['ordered', 0], ['stream,', 2],
  ['processes', 3], ['answers', 0], ['as', 0], ['events', 0], ['arrive,', 0],
  ['governs', 4], ['who', 0], ['may', 0], ['see', 0], ['them,', 0],
  ['and', 0], ['lets', 0], ['anyone', 0], ['query', 5], ['the', 0], ['current', 0], ['truth.', 0],
]
const PROPS = [
  { t: 'Always current', s: 'what is true now, and what just changed' },
  { t: 'Where data lives', s: 'no copies to move before you can ask' },
  { t: 'Built for software that acts', s: 'its decisions become facts' },
]
</script>

<template>
  <div class="sentence" :class="{ moving: !isStatic }">
    <div class="top">
      <div class="label">the streamhouse in one sentence</div>
      <div class="asof label">as of <span class="hit"><Clock mode="wall" start="14:02:07.4" :frozen="0" /></span></div>
    </div>
    <p class="big">
      <template v-for="([w, n], i) in WORDS" :key="i">
        <span class="w" :class="{ pillar: n }" :style="{ '--d': `${180 + i * 45}ms` }">{{ w }}<span v-if="n" class="num mono">0{{ n }}</span></span>{{ ' ' }}
      </template>
    </p>
    <div class="props">
      <div v-for="(p, i) in PROPS" :key="p.t" class="prop" :style="{ '--d': `${1700 + i * 120}ms` }">
        <div class="prop-t">{{ p.t }}</div>
        <div class="label">{{ p.s }}</div>
      </div>
    </div>
    <p class="note muted" :style="{ '--d': '2200ms' }">An architecture, not a product: a pattern you can build from parts you already run.</p>
  </div>
</template>

<style scoped>
.sentence { position: absolute; left: 120px; right: 120px; top: 150px; }
.top { display: flex; justify-content: space-between; }
.asof { font-size: 20px; }
.big { font-size: 62px; line-height: 1.28; font-weight: 600; letter-spacing: -0.02em; margin: 40px 0 56px; max-width: 1640px; }
.w { display: inline-block; }
.pillar { color: var(--hit); }
.num { font-size: 18px; color: var(--accent); margin-left: 4px; position: relative; top: -1.6em; letter-spacing: 0; }
.props { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
.prop { border-top: 2px solid var(--text); padding-top: 18px; }
.prop-t { font-size: 34px; font-weight: 700; margin-bottom: 8px; }
.prop .label { font-size: 16px; }
.note { font-size: 28px; margin: 48px 0 0; }
.moving .w { animation: wordin 520ms var(--ease) var(--d) both; }

.moving .prop, .moving .note { animation: ss-enter 600ms var(--ease-out) var(--d) both; }
@keyframes wordin { from { opacity: 0; transform: translateY(14px); } }
</style>
