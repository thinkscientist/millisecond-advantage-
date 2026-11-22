<script setup lang="ts">
/** Slide 3 — how old each input is, on a log scale; the result inherits the worst. */
const INPUTS = [
  { label: 'Prices', age: 5, txt: '5 ms' },
  { label: 'Trades', age: 40, txt: '40 ms' },
  { label: 'Positions', age: 15 * 60_000, txt: '15 min' },
  { label: 'FX rates', age: 3_600_000, txt: '1 h' },
]
const X0 = 300
const W = 1100
const MAX = Math.log10(3_600_000)
const w = (ms: number) => (Math.log10(ms) / MAX) * W
const SCALE = [
  { ms: 1, t: '1 ms' }, { ms: 1000, t: '1 s' }, { ms: 60_000, t: '1 min' }, { ms: 3_600_000, t: '1 h' },
]
const ROW = 112
</script>

<template>
  <svg width="1680" height="660" viewBox="0 0 1680 660" overflow="visible">
    <g v-for="s in SCALE" :key="s.t">
      <path :d="`M${X0 + w(s.ms)} 20 V600`" stroke="var(--rule)" stroke-width="2" />
      <text style="font-size: 20px" class="svg-body" :x="X0 + w(s.ms)" y="640" text-anchor="middle">{{ s.t }}</text>
    </g>
    <g v-for="(r, i) in INPUTS" :key="r.label">
      <text style="font-size: 32px" class="svg-mono" x="0" :y="74 + i * ROW">{{ r.label }}</text>
      <rect :x="X0" :y="44 + i * ROW" :width="Math.max(6, w(r.age))" height="40" rx="3" fill="var(--muted)" opacity=".55" />
      <text style="font-size: 28px" class="svg-mono" :x="X0 + Math.max(6, w(r.age)) + 18" :y="74 + i * ROW">{{ r.txt }}</text>
    </g>
    <g>
      <path :d="`M0 ${42 + 4 * ROW} H1680`" stroke="var(--rule)" stroke-width="2" />
      <text style="font-size: 32px" class="svg-mono" x="0" :y="104 + 4 * ROW" fill="var(--text)">Exposure</text>
      <rect :x="X0" :y="74 + 4 * ROW" :width="W" height="40" rx="3" fill="var(--accent)" />
      <text class="svg-mono" :x="X0 + W + 18" :y="104 + 4 * ROW" fill="var(--accent)" style="font-size: 28px; fill: var(--accent)">1 h old</text>
    </g>
  </svg>
</template>
